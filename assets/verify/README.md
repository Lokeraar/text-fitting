# Verify harness — FitField asset

One command to prove the documented behaviour actually works, in **real Chrome**.
No manual clicking, no guessing.

```bash
cd assets/verify
npm install   # once — installs puppeteer-core only (~25 pkgs, no Chromium download)
node verify.js
```

The script drives the system Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`)
headlessly, loads `../preview.html`, and asserts every behaviour the skill documents.
Exit code `0` = all checks passed; `1` = at least one failed; `2` = the harness itself
could not run (missing browser, wrong path).

## Why a single file

An earlier iteration spread probes and checks across several scratch scripts in a temp
directory. Checks went missing, an invalid synthetic-paste assertion slipped in, and
nothing noticed. Splitting this into "atoms/molecules/organisms" would multiply the
seams where a check can quietly disappear. **Completeness lives in one file; the run is
the proof it is complete.** If a behaviour is documented in `SKILL.md`, it has a numbered
check here — adding a documented behaviour means adding a check in the same place.

## What is verified

| # | Behaviour |
|---|-----------|
| 1 | Script runs to completion on load (guards the old `ReferenceError` at startup) |
| 1b | Fluid base font-size sits above the accessibility floor |
| 2 | Font shrinks progressively and the box **never** exceeds 2 lines |
| 3 | Font reaches the accessibility floor (0.625 rem) |
| 3b | Blocked state is reported in the panel |
| 3c | `maxLength` is set to the derived capacity (not an invented number) |
| 3d | Still never more than 2 lines at the floor |
| 3e | **Real keystrokes are refused** by the browser — native blocking, not clipping |
| 4 | Deleting once lifts the block |
| 4b | Font grows back after deletion |
| 5 | Bulk/overflow input truncates to 2 lines |
| 5b | Capacity enforced on bulk input |
| 6 | Emoji are never split at the boundary (no lone surrogate) |
| 7 | Newlines consume capacity too |

## Notes on correctness of the harness itself

- **Synthetic `paste` events insert nothing** (`before: 0, after: 0`). Bulk input is
  simulated by setting `value` and dispatching `input`, which is what the component
  actually reacts to. Check 3e uses *real* `keyboard.type` keystrokes, because only
  those exercise the browser's native `maxLength` enforcement.
- **`scrollHeight` is an integer.** Two exact line-boxes are 62.72px but measure as 63px,
  so `Math.ceil(63 / 31.36)` wrongly reports 3 lines. The panel uses `Math.round`;
  the harness parses the panel's own integer count rather than recomputing.
- **Chrome must exist** at the path in `verify.js` (or `CHROME` constant). On a machine
  with Edge only, point it at `msedge.exe`.
