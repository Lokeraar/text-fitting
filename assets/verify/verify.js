/**
 * verify.js — complete automated acceptance harness for the FitField skill asset.
 *
 * Runs every behaviour the skill documents, against the REAL system Chrome via
 * puppeteer-core (no Chromium download; uses the installed browser). One file,
 * no decomposition: every check is here, in order, and the script exits non-zero
 * if any of them fails — so "did we break something?" is a single command.
 *
 * Usage (from this directory):
 *   npm install          # installs puppeteer-core once
 *   node verify.js       # runs all checks; prints PASS/FAIL per check
 *
 * What this replaces and why it is one file: an earlier iteration split probes
 * and checks across several scratch scripts in a temp dir; checks got lost,
 * invalid synthetic-paste assertions slipped in, and nothing detected it.
 * Consolidation is the guarantee of completeness; the run is the proof.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// ── EL PREVIEW SE RESUELVE CONTRA ESTE ARCHIVO, NO CONTRA UNA MÁQUINA ──
//
// Antes era una ruta absoluta a la máquina de quien escribió la skill. Eso
// funcionaba exactamente en un equipo: en cualquier otro, `node verify.js`
// moría con «file not found» y el repo era inútil para quien lo clonara.
// Resolverlo contra `__dirname` lo hace correcto en cualquier sistema, en
// cualquier ruta, con cualquier nombre de usuario.
const PREVIEW = pathToFileURL(path.join(__dirname, '..', 'preview.html')).href;

// ── EL NAVEGADOR SE BUSCA, NO SE SUPONE ──
//
// Ninguna ruta de navegador es universal: cambia con el sistema operativo, con
// la edición (Chrome, Chromium, Edge), con el idioma de instalación y con las
// preferencias de quien lo usa. Se prueban las ubicaciones habituales, luego la
// variable de entorno, y se acepta una ruta explícita como argumento. Si no
// aparece ninguna, se dice cuál falta y cómo indicarla — nunca se asume.
function encontrarChrome() {
  // 1. Ruta explícita: `node verify.js /ruta/al/chrome`
  if (process.argv[2]) {
    if (!fs.existsSync(process.argv[2])) {
      throw new Error(`La ruta indicada no existe: ${process.argv[2]}`);
    }
    return process.argv[2];
  }

  // 2. Variable de entorno: sirve para CI y para instalaciones raras.
  const desdeEntorno = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (desdeEntorno && fs.existsSync(desdeEntorno)) return desdeEntorno;

  // 3. Las ubicaciones habituales de cada sistema.
  const candidatos = [
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Windows (Program Files, en ambos sabores)
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
  ];
  // En Windows las rutas dependen del usuario instalador: se añaden las suyas.
  if (process.env.LOCALAPPDATA) {
    candidatos.push(
      path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env.LOCALAPPDATA, 'Microsoft/Edge/Application/msedge.exe')
    );
  }
  for (const c of candidatos) {
    if (fs.existsSync(c)) return c;
  }

  throw new Error(
    'No se encontró ningún navegador compatible.\n' +
    'Indícalo así:  node verify.js /ruta/a/chrome\n' +
    'o con la variable:  CHROME_PATH=/ruta/a/chrome node verify.js\n' +
    'Probado en: ' + candidatos.join(', ')
  );
}

let CHROME;
try {
  CHROME = encontrarChrome();
} catch (e) {
  console.error(e.message);
  process.exit(2);   // 2 = el arnés no pudo arrancar (no es un fallo de la skill)
}

const FLOOR_PX = 10; // minRem 0.625 at a 16px root
const MAX_LINES = 2;

const results = [];
let failures = 0;
const ok = (name, cond, detail = '') => {
  const passed = !!cond;
  if (!passed) failures++;
  results.push(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Read the diagnostic panel + live field state. */
const read = (page) =>
  page.evaluate(() => {
    const f = document.getElementById('fit-field');
    return {
      px: document.getElementById('m-size').textContent,
      lines: document.getElementById('m-lines').textContent,
      chars: document.getElementById('m-chars').textContent,
      state: document.getElementById('m-state').textContent,
      fs: parseFloat(getComputedStyle(f).fontSize),
      len: f.value.length,
      maxLen: f.maxLength, // -1 means unlimited
      blocked: f.getAttribute('aria-blocked') === 'true',
    };
  });

/** Deterministic "type this much text" (synthetic paste events insert nothing). */
const setVal = async (page, v) =>
  page.evaluate((t) => {
    const f = document.getElementById('fit-field');
    f.value = t;
    f.dispatchEvent(new Event('input', { bubbles: true }));
  }, v);

/** True lone-surrogate check: an emoji cut in half would leave one. */
const hasLoneSurrogate = (s) => {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const high = c >= 0xd800 && c <= 0xdbff;
    const low = c >= 0xdc00 && c <= 0xdfff;
    if (high && !(s.charCodeAt(i + 1) >= 0xdc00 && s.charCodeAt(i + 1) <= 0xdfff)) return true;
    if (low && !(s.charCodeAt(i - 1) >= 0xd800 && s.charCodeAt(i - 1) <= 0xdbff)) return true;
  }
  return false;
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--window-size=1280,900', '--force-device-scale-factor=1'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(PREVIEW, { waitUntil: 'networkidle0' });

    // ---- 1. Script is alive: panel populated (the old ReferenceError symptom).
    let d = await read(page);
    ok('1. panel live on load (script ran to completion)', !d.px.includes('—'), d.px);
    const baseFs = d.fs;
    ok('1b. fluid base is above the floor', baseFs > FLOOR_PX, baseFs.toFixed(1) + 'px');

    // ---- 2. Progressive shrink; the box NEVER shows more than MAX_LINES.
    let prevFs = baseFs;
    for (const n of [60, 120, 180, 240, 300]) {
      await setVal(page, 'a'.repeat(n));
      await sleep(60);
      d = await read(page);
      const linesN = parseInt(d.lines, 10);
      ok(
        `2. shrink@${n} keeps ${MAX_LINES} lines`,
        d.fs <= prevFs + 0.01 && linesN <= MAX_LINES,
        `${d.fs.toFixed(1)}px  ${d.lines}`
      );
      prevFs = d.fs;
    }

    // ---- 3. Hard capacity: floor + overflow -> blocked, still 2 lines.
    await setVal(page, 'b'.repeat(600));
    await sleep(80);
    d = await read(page);
    ok('3. font reaches the accessibility floor', Math.abs(d.fs - FLOOR_PX) < 0.2, d.px);
    ok('3b. blocked state reported', /aforo/i.test(d.state), d.state);
    ok('3c. maxLength set to the derived capacity', d.maxLen === d.len && d.maxLen > 0, `max=${d.maxLen} len=${d.len}`);
    ok('3d. still never more than MAX_LINES', parseInt(d.lines, 10) <= MAX_LINES, d.lines);

    // 3e is the decisive one: REAL keystrokes must be refused by the browser itself.
    await page.focus('#fit-field');
    const before = (await read(page)).len;
    for (let i = 0; i < 10; i++) await page.keyboard.type('z');
    await sleep(100);
    d = await read(page);
    ok('3e. real keystrokes refused at capacity (native blocking)', d.len === before, `${before} -> ${d.len}`);

    // ---- 4. Deleting lifts the block AND grows the font back.
    await page.keyboard.press('Backspace');
    await sleep(80);
    d = await read(page);
    ok('4. one deletion lifts the block', !d.blocked && d.maxLen > d.len, `max=${d.maxLen} len=${d.len} blocked=${d.blocked}`);

    await setVal(page, 'c'.repeat(40));
    await sleep(80);
    d = await read(page);
    ok('4b. font grows back after deletion', d.fs > FLOOR_PX + 2, `${d.fs.toFixed(1)}px`);

    // ---- 5. Overflowing paste-like input truncates to the capacity, 2 lines max.
    await setVal(page, 'x'.repeat(3000));
    await sleep(80);
    d = await read(page);
    ok('5. overflow truncated to <= MAX_LINES', parseInt(d.lines, 10) <= MAX_LINES, d.lines);
    ok('5b. capacity enforced on bulk input', d.maxLen === d.len, `max=${d.maxLen} len=${d.len}`);

    // ---- 6. Emoji integrity: the derived boundary must not split a surrogate pair.
    await setVal(page, '\ud83d\ude00'.repeat(300));
    await sleep(80);
    const v = await page.$eval('#fit-field', (f) => f.value);
    ok('6. emoji not split at the boundary (no lone surrogate)', !hasLoneSurrogate(v), `len=${v.length}`);

    // ---- 7. Newlines consume capacity too (the trailing-space mirror trick).
    await setVal(page, 'l1\nl2\nl3\nl4');
    await sleep(80);
    d = await read(page);
    ok('7. newlines counted and capacity enforced', d.maxLen === d.len && d.maxLen > 0, `max=${d.maxLen} len=${d.len}`);

    await browser.close();
  } finally {
    await browser.close().catch(() => {});
  }

  console.log('\n=== FIT FIELD — ACCEPTANCE RESULTS ===');
  results.forEach((r) => console.log(r));
  console.log(`\n${results.length - failures}/${results.length} passed`);
  if (failures) {
    console.log(`\n${failures} CHECK(S) FAILED — the skill asset is NOT verified.`);
    process.exit(1);
  }
  console.log('\nAll documented behaviour verified in real Chrome.');
})().catch((e) => {
  console.error('HARNESS ERROR (could not run):', e);
  process.exit(2);
});
