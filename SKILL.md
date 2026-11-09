---
name: text-fitting
description: "Trigger: fluid typography, fit text to container, clamp font-size, text overflow, container query headings, responsive font-size, card title fitting, auto-fit text to N lines, shrink-to-fit title, fill a box with text, text fitting por capacidad, autoajustar letra, un solo tamaño en la celda, tamaño consistente de texto, fila de tabla con varias piezas. Enforces senior, accessible, overflow-safe text fitting in ANY web UI —Astro, React, Vue, Svelte, and plain HTML— plus global CSS and Tailwind: rem-based clamp(), container queries, and line clamping for free-flowing type; declared-line-capacity auto-fit (mirror div, binary search, floor, per-role strategy) for text that must fill exactly N lines. A cell with several spans inherits one size; hierarchy comes from color and weight, never from a child font-size or a rem clamp floor. Ceilings are height-based in em on the text node, because line-clamp on a parent of a block counts nothing. Forbids fixed px/pt sizes, vw-only values, per-frame resize fitters, and clipping in place of a capacity decision."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# Text Fitting (rem-based, container-aware)

Runtime contract for fluid, accessible, overflow-safe typography in any web UI: Astro, React, Vue, Svelte, and plain HTML, plus global CSS and Tailwind. Nothing in the measuring rules is framework-specific — the only framework-coupled parts are the container-query and token-scale examples, which map one-to-one to any CSS pipeline.

## Activation Contract

Use this skill when sizing or fitting text in any component's style block (`.astro`, `.jsx`/`.tsx`, `.vue`, `.svelte`), global CSS, or Tailwind: page headings, card/island titles, dynamic-length strings, any text that must self-fit its box.

The measuring rules (rule 8) are pure DOM arithmetic and work unchanged in every framework. Framework-specific advice is confined to the container-query and token-scale examples, which translate directly to any CSS pipeline — React/Vue/Svelte style blocks accept the same declarations.

Do NOT activate it for: print stylesheets, fixed-density kiosk UIs, SVG/canvas text, or any case where the design mandates a physical unit.

Scope: any component with a style block or utility classes, global CSS/Tailwind tokens, and any component whose text has a declared line capacity. Two paths: **fluid CSS** (`clamp()` + container queries + `line-clamp`) for free-flowing type, and **measured auto-fit** (rule 8) for text that must fill exactly N lines. Never a `resize` listener; one fit per content change.

## Hard Rules

1. **Fluid type is rem-based.** Never fixed `px`/`pt`, never a `vw`-only preferred value.
   ```css
   /* ❌ static — breaks on small viewports and ignores user font-size preference */
   font-size: 32px;
   /* ❌ vw-only — text does NOT grow with browser font-size setting (WCAG 1.4.4) */
   font-size: clamp(1rem, 4vw, 2rem);
   /* ✅ rem in the fluid part — elastic AND accessible */
   font-size: clamp(1rem, calc(0.875rem + 1.5vw), 2rem);
   ```

2. **Follow the formula.** `clamp(min_rem, calc(base_rem + k_vw), max_rem)`. `min`, `max`, and `base` are `rem` so every cap responds to the user's font-size preference; `vw` supplies viewport elasticity. Derive `base_rem` and `k` as a linear interpolation between two target sizes (see `assets/examples.md`), never eyeball them.

3. **Zoom test (WCAG 1.4.4, verified to the ceiling).** The middle value MUST contain `rem`. Mental check: drop the `vw` term — the text must still grow when the user increases the browser font size. Never set `max` below a legible minimum, and never let a `clamp` cap defeat text resizing for primary content. Verify to the browser's font-size ceiling (500% in Chromium), not just the 200% WCAG floor: `rem` scales with that setting (`1rem` = 80px at 500%) while `vw`/`cqi` do not, so the `rem` terms are the only thing still carrying growth past 200%.

4. **Contain dynamic text.** Wrap variable-length strings in boxes with `min-height` / `height: auto`, and clamp lines:
   ```css
   .fit-title {
     font-size: clamp(1.125rem, calc(1rem + 1vw), 1.5rem);
     line-height: 1.3;
     display: -webkit-box;
     -webkit-line-clamp: 2;
     -webkit-box-orient: vertical;
     overflow: hidden;
   }
   ```
   `-webkit-line-clamp` requires a constrained inline size (`max-width` or a block container). Never clamp away load-bearing content: if it matters, keep it reachable (expand control, link, or full view).

5. **Scale reusable cards/islands to their container, not the viewport.** Declare a container, then use query units with an `rem` foldback:
   ```css
   .card { container-type: inline-size; }
   .card-title { font-size: clamp(1rem, calc(0.75rem + 2cqi), 1.5rem); }
   @container (max-width: 30rem) {
     .card-title { font-size: 1rem; } /* rem foldback — still honors font-size preference */
   }
   ```
   Prefer `container-type: inline-size` (not `size`) to avoid layout cycles; scope with `container-name`. Query units (`cqw`/`cqi`) are not user-font-size relative, so the `rem` term and foldback are mandatory, not optional.

6. **Ship a token scale, not per-component magic numbers.** Define fluid steps once in global CSS and consume them everywhere.
   ```css
   :root {
     --step-0: clamp(1rem, calc(0.9rem + 0.5vw), 1.25rem);
     --step-2: clamp(1.75rem, calc(1.5rem + 1.5vw), 2.5rem);
   }
   .h-card { font-size: var(--step-2); }
   ```

7. **Long-form and free-flowing page type is CSS-only.** Paragraphs, article body, and any text with no fixed line budget use `clamp()` + container queries. No JS resize listeners and no fitting libraries for that case. Prefer `text-wrap: balance` for short headings and `text-wrap: pretty` for paragraphs where supported (progressive enhancement).

   **The dividing line is a declared LINE CAPACITY, not page vs widget.** If the designer can state "this string must fill exactly N lines", auto-fit is legitimate (rule 8). If the text is free flow with no line ceiling, CSS fluid type is correct and JS fitting is over-engineering.

8. **Any text with a declared line capacity may shrink-to-fit with JS.** CSS cannot size text by content length, so a measurer is the correct tool. This covers bounded widgets (chips, badges, N-line inputs) **and** page content whose line budget the designer sets: card titles, product names, one-line list rows, short descriptions. Scope:
   - **FIT IS TWO-DIMENSIONAL. Checking height alone is the classic bug.** A fitter that only measures `scrollHeight` against `lineHeight × N` reports success while the text overflows sideways and lands on top of the next column. This matters most in tables and multi-column rows:
     ```js
     // ❌ WRONG — only sees vertical overflow
     fits = el.scrollHeight <= lineHeight * lines + tol;

     // ✅ RIGHT — both axes
     fits = el.scrollHeight <= lineHeight * lines + tol   // does not overflow down
         && el.scrollWidth  <= el.clientWidth  + tol;     // does not overflow sideways
     ```
     **With `white-space: nowrap`, the height check can never fail** — the text physically cannot grow taller, so it overflows horizontally instead and `scrollHeight` stays at one line. That combination (nowrap cell + height-only check + `text-align: center`) is exactly how two columns end up painted on top of each other. If a cell is nowrap, the WIDTH test is the only one that does anything.
   - **Never center-align a cell you cannot guarantee to fit.** `text-align: center` makes an overflowing string spill symmetrically onto BOTH neighbours, so it collides on two sides instead of one. Use `start`/`end` alignment, or guarantee the fit with the width test above, or clamp.
   - **A table column's ceiling is set by its narrowest neighbour's needs, not by taste.** Before choosing 16 pt for a column, measure the string at 16 pt and compare with the column width. If the three control columns need 224 px of 356, the name column has what is left, and the name's ceiling must be chosen from that remainder — not the other way round.
   - **Never hardcode a column width measured on one device.** Writing `50px 90px 64px` for three control columns means you measured ONE device, at ONE system font size, in ONE orientation. On any other device those numbers are wrong, and the only repair is asking the user for another screenshot. A column whose content is text gets its width DERIVED, not declared: measure the text at the real ceiling and at the real floor, then size it from the space actually available. Publish the result as a custom property so the grid consumes it:
     ```css
     grid-template-columns: var(--col-mini, 26px) minmax(0, 1fr)
                            var(--col-a, 50px) var(--col-b, 90px) var(--col-c, 64px);
     ```
     Keep a px fallback inside `var()` so the layout still works without JS.
   - **Measure with a Range, not `scrollWidth`.** A grid cell's `scrollWidth` is `max(text, box)`, so a label already sitting in a wide column reports the COLUMN width, the fitter concludes it always fits, and the automation silently freezes at the old numbers. `Range.getBoundingClientRect()` measures the glyphs and nothing else:
     ```js
     const r = document.createRange();
     r.selectNodeContents(el);
     return r.getBoundingClientRect().width;   // the text, not the box
     ```
   - **`offsetParent` is null for every `position:fixed` element**, visible or not, so it is not a visibility test inside a fixed modal. Use `clientWidth` (0 when hidden) to tell open from closed.
   - **Reserve the priority column before dividing the rest.** If the design says "the name has priority", that is a budget, not a sentiment: subtract its minimum from the available width BEFORE splitting what remains among the secondary columns. Otherwise, the moment the secondary labels technically fit at the ceiling they consume everything and the priority column collapses to a few pixels — the layout is "correct" and the product unusable. Budget that reserve in px (a character count), never in percent: characters shown does not scale with the screen.
   - Recompute on `resize` and `orientationchange`, debounced, never per frame.
   - **Fit both directions, not just down.** Start at the CSS base (or the title ceiling), and scale UP toward the ceiling when the text is short and space is free, then DOWN toward the floor when it overflows. A fitter that only shrinks leaves short titles tiny and wastes the box.
   - **Defaults per role** (configurable per project — put them in one constants block, never inline in the loop):
     - Content text: ceiling **1.333rem (16 pt = 21.33 px)**, floor **0.667rem (8 pt = 10.67 px)**.
     - Titles: ceiling **2rem (24 pt = 32 px)**, floor **0.667rem (8 pt = 10.67 px)**.
     - **Think in POINTS when the designer does.** Word and CSS share the point: `1 pt = 96/72 px = 1.3333 px`, and `1 rem = 16 px`. So Word 12 pt = `1rem`, Word 16 pt = `1.333rem`, Word 8 pt = `0.667rem`. Converting a Word spec to `px` by copying the number is the classic mistake: it shrinks the text by 25 %.
     - The **8 pt floor (10.67 px) is a last resort, not a resting size.** It is the smallest size a person reads with comfort on paper; on a phone it is still tight, and common practice converges on 12 pt (16 px) for support text. 8 pt is only acceptable as the step immediately before growing the line budget. Never leave text sitting at the floor when an extra line would let it be legible.

   **DEFAULT POSTURE: EVERY TEXT BOX SELF-FITS.** Text fitting is not a treatment for four named roles. It applies to **any area with text inside a box, nested element, card, row, chip, cell, or panel**, and the only input that matters is the space the box actually has. The starting size is the same for all of them (content: 16 pt) unless the designer declares a different ceiling, and the ladder below applies unchanged.
   - Reach for auto-fit **before** hand-picking a smaller size to make something fit. Choosing 12 pt by hand so a row fits is a decision that hides a layout problem; letting the box self-fit (and grow its line budget when needed) surfaces it.
   - A smaller ceiling is legitimate only when the designer states a **role reason** (dense scan target, legal footnote). "It did not fit" is not a role reason: grow the line budget first.
   - **Which resource is scarce decides the fit strategy — and it is declared per role, never assumed.** Two strategies are legitimate, and they give opposite answers on the same text:

     | Strategy | Rule | Correct when |
     | --- | --- | --- |
     | `letters` | largest size wins, even if it spends the grace line | box height is free: titles, descriptions, hero copy |
     | `lines` | shortest capacity that fits wins; shrink to the floor before growing | row height is the scarce resource: table rows stacked one under another |

     Measured on one real row (105 px column, «Atlantic salmon (base ingredient) 0.24 Kg»): `letters` gives **21 px across 4 lines**, `lines` gives **16 px across 3**. Both are defensible; only one is right per design.

     **Do not hardcode either one globally.** Put the strategy on the role declaration, next to the ceiling and the capacity. A single global choice is always wrong for one half of the screen: `letters` everywhere makes table rows grow for half a point and push the footer off-screen; `lines` everywhere drops a 32 px title to 21 px to save a line the layout never needed.

     **State the decision and who made it.** This is a product call the owner makes, not a typographic default the fitter picks. Write it in the role table with its reason.

     An earlier version of this rule said «rows may grow taller than they may shrink — the two-line row at 16 pt beats the one-line row at 10 pt». That is the `letters` strategy stated as a universal law. It was wrong as a law, and it survived because nothing recorded that the alternative existed. A row that grows costs vertical space for every sibling below it; on a phone that is the difference between a visible footer and a hidden one.
   - **When it does not fit at the floor, add a line and re-fit** — do not keep shrinking below the floor. The capacity is the design parameter; the floor is the accessibility limit. Growing N is the correct escape valve.
   - **THE GRACE LINE: exactly one, and only one.** The line budget has three states, and the order matters:

     | Situation | Action |
     | --- | --- |
     | Fits at N lines | Use N lines. Nothing else changes. |
     | Does not fit at the floor in N | Grant **one** line: N+1. Re-fit. |
     | Fits at N+1 | Use N+1. **No ellipsis.** |
     | Does not fit even at N+1, at the floor | Only here may the text be clipped with an ellipsis. |

     **The ellipsis never means "there is more text".** It means the content still does not fit in the established parameters *even after the one-line exception*. While the text is complete, dots would signal missing content that is not missing — a lie told to the reader. Anchor the decision to the parameter, not to the feeling that something might be hidden.

     **Enforce it in one place.** `maxLines` must never exceed `lines + 1`; clamp it at the fitter, not at each call site:
     ```js
     const hardMax = Math.min(capacity.maxLines, capacity.lines + 1);
     ```
     A role whose cell holds several distinct data items (name + badge + unit + price) is a **declared capacity**, not a grace line — mark it explicitly, and say so in a comment. Otherwise a caller asking for two grace lines silently reintroduces the problem.
   - **Re-fit on every content mutation, not only on open.** Fitting runs once when the box is painted, so any text written LATER —a price surcharge (`+$5 for this item`), a state label, a unit that changes to `×2`, a validation message— enters unmeasured and gets clipped by the clamp. The defect is invisible in the static case and appears exactly when the user interacts, which is when it matters most.
     Hook the re-fit at the END of the function that repaints the row, never at each call site: one repaint path, one re-fit, and a future state change cannot forget it.
     ```js
     function paintRow(i) { /* ...writes text... */  requestFit(); }
     ```
   - **`requestAnimationFrame` does not deduplicate.** It groups the TIMING of the callbacks into the next frame but runs ALL of them, so N requests in one tick still mean N full measurements. If the paint function runs once per row, guard it with a flag:
     ```js
     let pending = false;
     function requestFit() {
       if (pending) return;
       pending = true;
       requestAnimationFrame(() => { pending = false; fit(); });
     }
     ```
     Verify the fit itself never repaints the row it measures, or the guard only hides an infinite loop.
   - **A hard CSS clamp and the JS line budget must agree.** `line-clamp: N` in the stylesheet and `maxLines: N` in the fitter are two independent ceilings; raise one without the other and the CSS keeps cutting with dots while the JS believes the text fits, so the fix appears to do nothing. Change them in the same commit, and assert the equality in a test.
   - **`line-clamp` on a PARENT of a block element does nothing.** It counts line boxes of the element it is applied to, and a block child generates no line boxes for its parent: the ceiling exists in the stylesheet, not in the engine. The text grows to five or six lines while the CSS says «four». Put the ceiling on the element that actually holds the text.

     Prefer a **height** ceiling over a line count:
     ```css
     /* on the text node itself, with line-height declared above */
     max-height: calc(4 * 1.25em);
     overflow: hidden;
     ```
     `em`, not `px`, because the fitter writes `font-size` on that same node: the ceiling recomputes itself and there is no second number to desynchronize. A pixel ceiling must be rewritten on every pass, which couples the two layers — that path was tried and reverted.

     **`overflow: hidden` does not lie to `scrollHeight`:** it lets the content overflow the box while `scrollHeight` still reports the full height. That is why height ceilings are safe to measure through and `line-clamp` is not — `line-clamp` destroys the content and the fitter goes blind. Neutralize the `max-height` while measuring and restore it on every exit path.
   - **Consistency rule: never produce a patchwork of sizes on one line.** When several strings share a row by layout (table column headers such as Remove / Current / Add more, inline chips, price + unit), compute the size required by the MOST restrictive one and apply it to all of them. One row, one size.

     **And that rule must reach INSIDE a cell, not just across it.** One cell often holds several spans: a product name, a badge («base ingredient»), a unit of measure, a surcharge. If any of them carries its own `font-size` — including a `clamp()` with a `rem` floor — it stops shrinking while the parent keeps going, and the cell mixes sizes nobody chose.

     Measured: a name pushed to 8 pt (10.67 px) beside a unit pinned at its `clamp(.8125rem, .82em, 1.0625rem)` floor of 13 px. The secondary line rendered **22 % LARGER than the primary text it belongs to**, and spent an extra line box doing it.

     The fix is `font-size: inherit` on every child; hierarchy comes from color and weight, which consume no space. Reserve a child `font-size` for a child that must NOT follow, and say why in a comment.

     **Beware a `rem` `clamp()` inside a fitted cell.** `rem` resolves against the root, so a `rem` floor in a span does not scale with the fitted parent, and `line-height` resolved per element makes the real line box taller than the fitter's arithmetic: the fitter believes 4 × 13.3 px, the browser renders 4 × 16.3 px, and «it fits» ends with the parent clipping.
   - **`white-space: nowrap` on a secondary phrase steals a whole line.** With a ~105 px column at 10.67 px, about 19 characters fit per line. «Atlantic salmon» uses 15 and leaves 4 free, but an 18-character phrase that cannot break starts the NEXT line and leaves the first nearly empty: five lines where four were budgeted. The waste is not caused by the long text; it is caused by a short phrase refusing to split.

     Keep `nowrap` only for atomic data («0.24 Kg», a price, a currency amount), where splitting would change meaning. Let narrative labels break between words — never `break-all`, never inside a number.
   - Measure a hidden **mirror `<div>`**, never the `<textarea>`/target itself. A textarea is a replaced element with its own internal scrolling; with `overflow: hidden` many engines report `scrollHeight === clientHeight`, so a shrink loop keyed on the textarea never fires.
   - Define the budget as N line-boxes **at the active font size**, not at the base font, and set the box height to it on every fit. A fixed pixel budget holds more lines once the font shrinks, so a third line appears. Keep a CSS fallback (`block-size` + `resize: none` + `overflow: hidden`) so capacity holds even if the script fails.
   - **The character limit is derived, never chosen.** The available space is a design parameter you designate per use: the field's **width** and its **N-line capacity**. Those two, plus the legibility floor, determine how many characters fit — so never hardcode a character cap (`maxLength` gets the computed value, not an invented number). If the derived capacity is too small, change the designated space (widen the field, allow another line); never lower the font floor to buy room.
   - Expect a hard **capacity ceiling**, and enforce it by **blocking input, never by clipping**. Once the font reaches the accessibility floor, compute the largest prefix that fits the N lines and set the field's `maxLength` to it, so the browser itself refuses further typing and pasting. Silently clipping hides text from the user. The ceiling is correct (WCAG legibility), not a bug: widen the box or accept the limit — never lower the floor below legible size.
   - **Run the fit once per content change, never on `resize` or per frame.** Trigger it when the modal opens, when the content is replaced, and when the container width changes for a structural reason (breakpoint, rotation). A `resize` listener that re-fits on every frame forces a layout recalculation per frame and janks the scroll.
   - **Binary-search the size, do not step by 1 px.** Each measure forces layout. From 32 px down to 10.67 px, a linear walk costs over 21 measures; a binary search costs about 5. Write the loop to halve the interval.
   - Keep the fluid `rem` base as the source of truth: reset to it on every run (so text also grows back when content shortens), and clamp the result between the floor and the ceiling.
   - Sync the mirror's content width, font family/weight, line-height, and text on every measure; append a trailing space when content ends with `\n` so that newline stays counted.

## Decision Gates

| Situation | Action |
| --- | --- |
| Text must fit a reusable card/island, not the screen | Container queries (`cqi`) + `container-type: inline-size` + `rem` foldback |
| Text sits in a table cell or a row with sibling columns | Check BOTH axes (`scrollWidth` vs `clientWidth` too); a `nowrap` cell only ever overflows sideways |
| A cell's string must not touch its neighbours | Never `text-align:center` on an unguaranteed fit; prove the width fit or align to a side |
| A column width depends on its text content | Measure the text (Range) and publish it as a CSS variable; never a literal px |
| Text does not fit the declared lines | Grant exactly one extra line; ellipsis only if it still fails at the floor |
| A `line-clamp` lives in the CSS | Prefer a height ceiling in `em` on the text node; a `line-clamp` on a parent of a block counts nothing. If it stays, keep it equal to the fitter's `maxLines` and raise both in the same commit |
| Text changes after the box was fitted | Re-fit at the end of the repaint function, guarded to once per frame |
| A layout rule must hold on unknown devices | Derive the number at runtime; a measured constant is a bug waiting for a different screen |
| Dynamic-length string may overflow its box | `line-clamp` + `line-height` + `min-height` container; keep essential content reachable |
| Designer hands you `px`/`pt` specs | Convert to a rem fluid range via the formula; flag the conversion and why |
| Text with a DECLARED line capacity (card title, product name, one-line row, N-line field) must fill those lines | JS auto-fit (rule 8): mirror `<div>`, capacity in N lines, floor, binary search, one run per content change |
| Several strings share one row and must look uniform | Fit the most restrictive string and apply its size to every one of them (rule 8, consistency) |
| A cell holds primary + secondary spans (name, badge, unit, surcharge) | Every child `font-size: inherit`; hierarchy by color and weight only. A child `clamp()` with a `rem` floor stops shrinking while the parent keeps going |
| A row's height is the scarce resource (stacked table rows) | Strategy `lines`: shrink to the floor before spending the grace line |
| Box height is free (title, description, hero copy) | Strategy `letters`: largest size wins, grace line included |
| A ceiling must survive the fitter writing `font-size` | Height ceiling in `em` on the text node (`max-height: calc(N * 1.25em)`), not `line-clamp` on an ancestor |
| Free-flowing page type with no line ceiling | `clamp()` + container queries — auto-fit is over-engineering there |
| Clipped content is load-bearing | Do not clamp; restructure the layout or add a disclosure control |
| Demand for pixel-exact sizes across zoom levels | Out of scope; flag the conflict (fluid type is intentionally not pixel-exact) |
| Choosing a character limit for a bounded field | Don't: derive it from the designated space (box width + N lines) and the legibility floor; change the space, never the floor |
| Text still overflows at the floor | Add a line and re-fit; never go below the floor |
| Content exceeds N lines even at the floor | Block further input (`maxLength` at the fitting prefix) — do not clip silently and do not shrink below the floor |
| The derived capacity is too small for real content | Widen the field or raise the line budget (designated space) — do not shrink below the legibility floor |

## Execution Steps

1. Determine whether the text scales with the **viewport** (page-level) or with its **container** (card/island).
2. Pick a fluid step from the token scale, or compute `clamp(min_rem, calc(base_rem + k_vw), max_rem)` by interpolating between two target sizes at two breakpoints.
3. Apply the zoom test (Hard Rule 3).
4. If content length is dynamic, add containment (Hard Rule 4); verify the longest realistic string and the narrowest container do not clip.
5. For reusable components, declare `container-type: inline-size` and add an `@container` `rem` foldback.
6. Verify: resize across breakpoints; bump browser font size to its ceiling (500% in Chromium); confirm no overflow and no loss of content or function at that ceiling, not only at the 200% WCAG floor. For bounded widgets, prefer the automated harness (`assets/verify`) over manual clicking: it runs the resize/capacity/edge-case matrix deterministically and exits non-zero on the first miss.

## Output Contract

Return: the style files changed (`.astro`, `.jsx`/`.tsx`, `.vue`, `.svelte`, `.css` or Tailwind), the fluid tokens used or added, the verification performed (resize + font-size at the 500% Chromium ceiling), every place `px`/`pt` was converted, and any residual overflow risk or accessibility caveat. For bounded widgets, also return the designated space (field width + N lines), the legibility floor, and the character capacity derived from them.

For any text with several spans in one cell, also return: the single size chosen, which spans inherit it, and which (if any) keep their own and why. For any row with a height ceiling, name the strategy (`letters` / `lines`) and who decided it.

## References

- `assets/examples.md` — before/after catalog: static → fluid, vw-only → rem, viewport → container queries, plus the linear-interpolation derivation and a token scale.
- `assets/FitField.astro` — reference bounded field implementing rule 8 (mirror measurer, CSS space limit, derived `maxLength`). Its designated space is parameterized: the `lines` prop plus the field's `inline-size`. The same measurer pattern applies to any text with a declared line capacity.
- `assets/preview.html` — runnable mirror of `FitField.astro` with a live diagnostic readout; open it directly to verify the shrink-to-fit behavior.
- `assets/verify/` — automated acceptance harness (puppeteer-core + the system Chrome) that proves the FitField behaviour in a real browser: `cd assets/verify && npm install && node verify.js`. Every documented behaviour has a numbered check; exit `0` means all passed.
