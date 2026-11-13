---
name: text-fitting
description: "Trigger: fluid typography, fit text to container, clamp font-size, text overflow, container query headings, responsive font-size, card title fitting, auto-fit text to N lines, shrink-to-fit title, fill a box with text, text fitting por capacidad, autoajustar letra, un solo tamaño en la celda, tamaño consistente de texto, fila de tabla con varias piezas. Enforces senior, accessible, overflow-safe text fitting in ANY web UI —Astro, React, Vue, Svelte, and plain HTML— plus global CSS and Tailwind: rem-based clamp(), container queries, and line clamping for free-flowing type; declared-line-capacity auto-fit (mirror div, binary search, floor, per-role strategy) for text that must fill exactly N lines. A cell with several spans inherits one size; hierarchy comes from color and weight, never from a child font-size or a rem clamp floor. Ceilings are height-based in em on the text node, because line-clamp on a parent of a block counts nothing. Forbids fixed px/pt sizes, vw-only values, per-frame resize fitters, and clipping in place of a capacity decision."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# Text Fitting (rem-based, container-aware)

A skill for **Pi** and **Gentle Shell** agents. Load it when you size or fit text in a web UI; the UI itself can be built with any framework.

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
   - **THERE IS ONE STRATEGY, AND THE LINE BUDGET WINS.** The order is fixed and not negotiable:

     | Step | Action |
     | --- | --- |
     | 1 | Shrink the font from the ceiling down to the floor, **inside the declared line capacity**. |
     | 2 | Only if it still does not fit at the floor, grant **one** extra line. |
     | 3 | With that extra line, raise the font back up as far as it fits. |

     **Never spend the extra line before shrinking the font.** An extra line costs vertical space for every row below it; shrinking the font costs nothing to anyone else. That asymmetry is the whole argument, and it holds in every interface: a web table, a stacked list, a terminal panel.

     Measured on one real row (105 px column, «Widget Pro (main item) 12 units»): shrinking-first gives **16 px across 3 lines**; the opposite order gives **21 px across 4 lines**. The second looks better on that row alone and makes every row underneath move. A row that grows for half a point of font is a row that grew for no reason anyone can name.

     **Why this replaced the earlier two-strategy rule.** A previous version of this file declared `letters` (largest size wins, grace line included) legitimate for titles and descriptions, with the argument that box height was free there. That was wrong as a default: it makes row height depend on text length, so two sibling rows end up different heights by fractions of a point, and a list stops being scannable. The line budget is the design parameter — if a title deserves more room, declare a larger capacity for it; do not let the fitter spend a line nobody budgeted.

     **The declared capacity is the knob.** A role that needs more room says `lines: 3` or `lines: 4`, visibly, in one place. The fitter never invents capacity.

     **And that one place is code, never the stylesheet.** A `line-clamp` in CSS is a second, invisible knob for the same decision — and the tempting place to reach for when a header truncates. If a text truncates, suspect its row in the capacity table before touching the CSS: it may be sharing the capacity of shorter siblings. See the rule below.
   - **When it does not fit at the floor, add a line and re-fit** — do not keep shrinking below the floor. The capacity is the design parameter; the floor is the accessibility limit. Growing N is the correct escape valve.
   - **WHEN THE CAPACITY IS UNKNOWN, ASK WITH `ask_user` BEFORE FITTING.** This is the rule that turns the whole skill from a technical contract into a workflow. Two situations, two behaviours:

     **A — The user already stated the capacity** («este título debe ocupar 2 líneas», «que abarque 3 espacios»). **Do not ask again.** Fit to what they said and add the +1 reserve silently. Re-asking a answered question is noise, and worse: it makes the user doubt whether the first answer was registered.

     **B — The user only said «aplica text-fitting» / «usa text-fitting» / anything with that intent, with no capacity.** Then the capacity is genuinely undetermined: no code can invent it, and guessing produces the exact defect this skill exists to prevent. **Ask before writing any code**, with two questions in one `ask_user`:

     | Question | Options |
     | --- | --- |
     | **Where** does it apply? | In the whole project · In this window/modal · In this field · In this heading · In the footer · In the hero · In the table · In the «X» button · …match the actual context |
     | **How many lines** should it use? | 1 · 2 · 3 · 4 · as many as it needs |

     The **where** options are not a fixed list: they are the containers that actually exist in the code in front of you. Read the markup first, then offer real names («la tabla de ingredientes», «el encabezado de la carta»), never generic placeholders that the user has to translate.

     **Why ask instead of deciding.** The line capacity is a product decision with a visible cost: each extra line pushes every sibling row down. A fitter that invents capacity hides that cost inside a component. A question makes it explicit and takes one round trip.

     **Never ask twice.** If the answer is in the conversation, in a declaration, or in a previous `ask_user`, use it. The question exists for the gap, not as a ritual.

   - **THE LINE CAPACITY IS A QUESTION, NOT A GUESS — ASK, OR EXPOSE IT.** The number of lines is the one input the system cannot derive: it is a design decision. Two legitimate ways to obtain it:

     1. **At design time**: the role declares it (`lines: 2`), visibly, in one place.
     2. **At runtime**: the UI exposes a control so the person states it.

     What is never acceptable is the fitter inventing capacity to make something fit. That is the same defect as hand-picking a smaller font: it hides the layout problem instead of naming it.

     The **+1 grace line is not part of the request**. It is a reserve for when the stated capacity turns out to be impossible for the actual content — a safety net, not budget. Conflating them produces the classic bug where a component silently occupies 3 lines because someone "needed" 2 and the reserve got spent on every render.

     Verified in a real browser (Chrome 127 via CDP): with the capacity set to 2, three titles of different lengths all sit at 16 px across 2 lines. Set to 3, all three use 3. Set to **1**, the two long ones shrink to 9 px and 9.5 px — they do not borrow the reserve. That is the behaviour the rule requires, and it only holds if the capacity is genuinely an input.

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
   - **DO NOT WRITE THE LINE COUNT IN THE STYLESHEET. The CSS declares behavior; the capacity is declared once, in code.** `line-clamp: 2` in a stylesheet and `maxLines: 2` in the fitter are two independent ceilings that must stay in sync by hand. The moment they drift, the CSS keeps cutting with dots while the fitter believes the text fits, the fix appears to do nothing, and nobody connects the two lines because they live in different files.

     Worse, the CSS one *silently overrides a decision that was made elsewhere*. Measured case: a column header of three words («Nombre del ingrediente», 22 characters) was fitted with the capacity belonging to its sibling one-word controls, so it got **one line** and rendered as «Nombre del ingre…». The instinctive fix was to add `-webkit-line-clamp: 2` to the header in CSS — which makes the header look right *and buries the real bug*. The real bug was in the capacity table: that header shared the `rotulo` entry (`lines: 1`) with the three controls. Adding CSS `2` would have hidden the error, and the day the header became three lines the CSS `2` would have blocked it with no trace of why.

     **The split of responsibilities:**

     | Layer | Declares | Never declares |
     |---|---|---|
     | CSS | behavior: may wrap or not, overflow handling, `display` | the number of lines |
     | Code | the capacity, per role, in one visible table | how the text wraps |

     ```css
     /* WRONG: a second source of truth for the line count */
     .col-header { -webkit-line-clamp: 2; line-clamp: 2; display: -webkit-box; }

     /* RIGHT: only the behavior */
     .col-header { white-space: normal; }
     ```

     ```js
     // RIGHT: one place, visible, per role
     const CAPACIDAD = {
       rotulo:       { lineas: 1, maxLineas: 1 },   // Quitar / Actualmente / Agrandar
       rotuloNombre: { lineas: 2, maxLineas: 2 },   // Nombre del ingrediente: three words
     };
     ```

     **Two more traps this exposes.** First, `display: -webkit-box` in CSS fights the fitter: clipping with `text-overflow: ellipsis` needs `display: block`, and the fitter writes that itself — leave `display` alone and the CSS stops fighting it. Second, **a role must not inherit the capacity of its neighbors just because they share a row.** Check the capacity table when a header truncates; the CSS is almost never the cause.

     **The consistency rule still applies, but per decision, not per row:** labels that share *one* decision (three one-word column headers) share a group and a size; a label with a *different* decision (a three-word header that needs two lines) gets its own entry even though it sits in the same row.
   - **`line-clamp` on a PARENT of a block element does nothing.** It counts line boxes of the element it is applied to, and a block child generates no line boxes for its parent: the ceiling exists in the stylesheet, not in the engine. The text grows to five or six lines while the CSS says «four». Put the ceiling on the element that actually holds the text.

     Prefer a **height** ceiling over a line count:
     ```css
     /* on the text node itself, with line-height declared above */
     max-height: calc(4 * 1.25em);
     overflow: hidden;
     ```
     `em`, not `px`, because the fitter writes `font-size` on that same node: the ceiling recomputes itself and there is no second number to desynchronize. A pixel ceiling must be rewritten on every pass, which couples the two layers — that path was tried and reverted.

     **`overflow: hidden` does not lie to `scrollHeight`:** it lets the content overflow the box while `scrollHeight` still reports the full height. That is why height ceilings are safe to measure through and `line-clamp` is not — `line-clamp` destroys the content and the fitter goes blind. Neutralize the `max-height` while measuring and restore it on every exit path.
   - **Consistency rule: never produce a patchwork of sizes on one line.** When several strings share a row by layout (table column headers such as Remove / Status / Add more, inline chips, price + unit), compute the size required by the MOST restrictive one and apply it to all of them. One row, one size.

     **And that rule must reach INSIDE a cell, not just across it.** One cell often holds several spans: a product name, a badge («main item»), a unit of measure, a surcharge. If any of them carries its own `font-size` — including a `clamp()` with a `rem` floor — it stops shrinking while the parent keeps going, and the cell mixes sizes nobody chose.

     Measured: a name pushed to 8 pt (10.67 px) beside a unit pinned at its `clamp(.8125rem, .82em, 1.0625rem)` floor of 13 px. The secondary line rendered **22 % LARGER than the primary text it belongs to**, and spent an extra line box doing it.

     The fix is `font-size: inherit` on every child; hierarchy comes from color and weight, which consume no space. Reserve a child `font-size` for a child that must NOT follow, and say why in a comment.

     **Beware a `rem` `clamp()` inside a fitted cell.** `rem` resolves against the root, so a `rem` floor in a span does not scale with the fitted parent, and `line-height` resolved per element makes the real line box taller than the fitter's arithmetic: the fitter believes 4 × 13.3 px, the browser renders 4 × 16.3 px, and «it fits» ends with the parent clipping.
   - **`white-space: nowrap` on a secondary phrase steals a whole line.** With a ~105 px column at 10.67 px, about 19 characters fit per line. «Widget Pro» uses 10 and leaves 9 free, but an 18-character phrase that cannot break starts the NEXT line and leaves the first nearly empty: five lines where four were budgeted. The waste is not caused by the long text; it is caused by a short phrase refusing to split.

     Keep `nowrap` only for atomic data («12 units», a price, a currency amount), where splitting would change meaning. Let narrative labels break between words — never `break-all`, never inside a number.
   - Measure a hidden **mirror `<div>`**, never the `<textarea>`/target itself. A textarea is a replaced element with its own internal scrolling; with `overflow: hidden` many engines report `scrollHeight === clientHeight`, so a shrink loop keyed on the textarea never fires.
   - Define the budget as N line-boxes **at the active font size**, not at the base font, and set the box height to it on every fit. A fixed pixel budget holds more lines once the font shrinks, so a third line appears. Keep a CSS fallback (`block-size` + `resize: none` + `overflow: hidden`) so capacity holds even if the script fails.
   - **The character limit is derived, never chosen.** The available space is a design parameter you designate per use: the field's **width** and its **N-line capacity**. Those two, plus the legibility floor, determine how many characters fit — so never hardcode a character cap (`maxLength` gets the computed value, not an invented number). If the derived capacity is too small, change the designated space (widen the field, allow another line); never lower the font floor to buy room.

     **But "derived" does not mean "a constant".** Because the count depends on the glyphs (see the reference-string rule below), the same field holds 62 wide characters or 140 narrow ones. A capacity shown to the user is therefore a capacity *for the text currently in the box*, and it must be recomputed on every edit — not computed once at boot and reused.
   - Expect a hard **capacity ceiling**, and enforce it by **blocking input, never by clipping**. Once the font reaches the accessibility floor, compute the largest prefix that fits the N lines and set the field's `maxLength` to it, so the browser itself refuses further typing and pasting. Silently clipping hides text from the user. The ceiling is correct (WCAG legibility), not a bug: widen the box or accept the limit — never lower the floor below legible size.
   - **`container-type` and `fit-content` cannot live on the same box.** `container-type: inline-size` forbids the element's width from depending on its content — the engine resolves it before laying out children so it can answer `cqi`. `width: fit-content` asks for exactly the opposite. The combination is a circular dependency and the browser collapses the box to its minimum: measured at **26 px, with a 0 px child that still held text**. Nesting the two boxes separately does not fix it either; the inner container then declares a size that does not exist yet. **Fix: measure the text with a `Range` in JS and publish the width inline.** Then the box has a definite width before layout, and the container query works.
   - **Size the fitted box from its WIDEST CHILD, not from a `Range` over the whole container.** `range.selectNodeContents(container)` returns the container's own width, not the width of its longest line, so a `max-width` on the box is never respected (measured: two boxes with different maxima both came out at 114 px). Walk the children and take the largest.
   - **A line-height copied to a mirror as pixels freezes it: the mirror never shrinks.** `getComputedStyle(el).lineHeight` returns the value **already resolved to pixels** (e.g. `24.96px`, from `line-height: 1.3`). Copying that string to the measuring mirror locks the line box: the mirror measured one line as 24.96 px at 16 pt and **exactly the same at 8 pt**, so it believed the same amount of text fit at both sizes. The capacity came out short, the font shrank far earlier than needed, and the box clipped. Copy the **ratio**, not the resolved value:

     ```js
     const cs = getComputedStyle(field);
     const lh = cs.lineHeight;
     mirror.style.lineHeight = /px$/.test(lh)
       ? String(parseFloat(lh) / parseFloat(cs.fontSize))   // 1.3, scales with font-size
       : lh;                                                // unitless or 'normal' already scales
     ```

     Verify it with two sizes: the mirror's `line-height` must differ. Measured after the fix: 13.87 px at 8 pt vs 27.73 px at 16 pt; before, both were 24.96 px.
   - **Never compare a height WITH padding against a budget WITHOUT padding.** `scrollHeight` includes the mirror's padding; a budget computed as `lineHeight * N` is text only. With small fonts the padding eats a whole line box: one line already "did not fit", capacity collapsed to **1 character**, and the field looked broken. Subtract the padding before comparing:

     ```js
     const relleno = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
     const alto = mirror.scrollHeight - relleno;
     ```
   - **A fixed `height` on the field cancels every shrink.** If the box has `height: calc(2 * 1.3em + 1rem)` resolved at the *initial* size, shrinking the font does not reveal more room: the box keeps its old height and the text clips. Set the height from the font size the fitter chose, on every pass, and give it no `min-height` — a `min-height` wins over the computed height, and with a 1-line budget the box still measured two.

     ```js
     field.style.height = (cupo * px * lhRatio + relleno).toFixed(2) + 'px';
     ```
   - **Fit the field once at startup and once per capacity change, not only on input.** If the fit runs only from the `input` listener, the field sits in its initial state — big font, no `maxLength` — until the user types a character, so a pasted string arrives with no limit. Call the fit from the boot sequence and from the capacity control.
   - **A capacity measured from the current value is zero when the field is empty.** Measuring `input.value` on an empty field gave 0, then set `maxLength = 0`, and the browser refused every keystroke: the field looked dead, showing «0 of 0». Measure a **reference string** instead when there is nothing typed yet — but see the next rule: a reference string is only a starting estimate, never the final answer.
   - **A reference string made of wide letters caps the field far below its real capacity.** This is the opposite failure, and it is the one users notice: they type, the font drops to the floor, and half the last line is still empty. Measured on a 311 px field with a 2-line budget: a reference of `abc…ABC…012…` reported **75 characters**, while the same field held **140** characters of narrow text. The last line was **9 % full with the reference and 94 % full with the real text**.

     Character counts are not a property of the box; they are a property of the **glyphs**. `WWWW` and `jjjj` differ by more than 2× in width. So the sample must be the text the user actually has:

     ```js
     // Repeat what is already written, then binary-search how much of THAT fits.
     const base = (field.value && field.value.length) ? field.value : REFERENCE;
     let sarta = base;
     while (sarta.length < 800) sarta += base;
     ```

     With an empty field there is nothing to sample, so a reference is the only estimate available. Keep it, but treat it as a guess: do **not** freeze it into `maxLength`, or a pasted string is truncated before it can ever be measured. Set a generous `maxLength` while empty, then replace it with the exact number once there is text:

     ```js
     field.maxLength = Math.ceil(capacidad * 2.2);   // empty: room to paste and measure
     if (field.value.length > 0) field.maxLength = capacidad;   // exact, now measurable
     ```

     Measured after the fix, same field: narrow letters 140, wide letters 62, lowercase 110, digits 98. Capacity now tracks the text instead of a fixed guess.
   - **The line budget must be computed at the SAME font size as the measurement.** A budget taken once at the floor (`lineHeight * N` at 8 pt = 27.7 px) and then compared against text measured at 9 pt (31 px) declares «does not fit» when two lines at 9 pt are 31.2 px and fit perfectly. The font falls to the floor for nothing, and the box looks half empty. Recompute the budget inside the search, per candidate size:

     ```js
     const cabePx = px => altoCon(espejo, texto, px).alto <= px * lhRatio * cupo + TOL;
     ```

     Assert it with a narrow text: it should survive at 12–15 pt on a 2-line budget, not collapse to 8 pt.
   - **A `cqi` term must clear the floor to show any difference.** Two containers of 98 px and 94 px differ by 4 px. `4cqi` gives 3.9 px and 3.8 px — both swallowed by the 13 px floor, so the text renders identically and the container query looks broken. Use a steep enough term (`20cqi`) that both values land above the floor, and assert a measured difference.
   - **A `@container` breakpoint must fall INSIDE the range of container widths you actually have.** Verified failure: two cards at 150 px and 313 px, with `@container (max-width: 20rem)` — 20 rem is 320 px, wider than both cards, so the rule matched neither and both rendered at the same size. The breakpoint looked correct in isolation and did nothing. Check the real measured widths before choosing the threshold, and assert that the two render differently.
   - **A boolean HTML attribute is falsy in `dataset`.** `<div data-cupo-panel>` gives `el.dataset.cupoPanel === ""`, which fails an `if (el.dataset.cupoPanel)` test. Write `data-cupo-panel="1"` when the presence of the attribute is what you are testing. This silently disabled a control that the markup said was wired.
   - **A verification that expects a fixed pixel value will fail on a fluid `clamp()`.** `clamp(1.5rem, 1.25rem + 1.4vw, 2.25rem)` measures 16 px inside a narrow container and 36 px in a wide one; both are correct. Assert that the result lies **inside the declared range**, never that it equals a number. A range check also keeps the real invariant visible: the text never drops below the legibility floor.
   - **Photo-free assets are still worth verifying in a real browser.** Server-side rendering and DOM stubs do not implement `@container`, do not lay out fonts, and return constant heights. The four defects above are invisible to a harness that does not lay out a page; they cost one CDP session to find and would each have shipped as a "works on my machine" bug.

   - **A TABLE COLUMN LEAVES AIR ON BOTH SIDES OF ITS TEXT, NOT ONLY BETWEEN COLUMNS.** A `column-gap` alone separates the *boxes*; it does not keep the glyphs off the border of the box the text lives in. The result reads as one continuous string of words: `|Quitar|Actualmente|Agrandar|` instead of `| Quitar | Actualmente | Agrandar |`. Measured on a real modal: with a 2 px gap and no padding, the tail of one label visually touched the head of the next, and two adjacent labels looked like a single broken word.

     **The air belongs to the cell, as padding, and it must be symmetric:**

     ```css
     /* WRONG: separates the boxes, lets the text touch its own edges */
     .row { column-gap: 2px; }

     /* RIGHT: every cell pads its text on both sides */
     .row { column-gap: .25rem; }               /* extra separation between boxes */
     .row > .cell { padding-inline: .35em; }    /* air inside each cell */
     ```

     Between two adjacent cells the total air is then `padding + gap + padding`, which is what a reader perceives as a column boundary. Use `em` so the air grows with the font: with a large system font, fixed air is what makes columns look glued again exactly when it matters most.

     **The first cell is the exception.** A cell that already sits against a visual edge (a thumbnail, a border, an icon) does not need padding on that side; give it air on the inner side only, or it will look indented relative to the row above.

     **And the fitter must count the air.** Text is measured, not boxes: an `anchoTexto`-style range measurement returns the glyph run and ignores padding. Publish a column width from that raw number and the padding eats the last letters, so the label truncates — a new bug, in a different place, from the fix that added the air. Add it back from the element itself instead of retyping the number:

     ```js
     const cs = getComputedStyle(cell);
     const aire = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
     naturalWidth += aire;
     ```

     Pay that cost out of the cells that need it least. When one column of a row carries the real content, the air comes from the short labeled controls' budget, never from the content column's: verify the content column keeps the same width before and after adding the air.

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
| Text does not fit the declared capacity | Shrink the font to the floor FIRST; only then grant one line, and re-fit. Never the reverse |
| A role needs more room than its capacity gives | Declare a larger capacity for that role; the fitter never spends a line nobody budgeted |
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
7. When verifying in a real browser repeatedly, do not open a tab per run. Reuse the existing one and cap at **two tabs per URL**, alternating A → B → A so the previous version stays visible for comparison. See `assets/verify/README.md`.

## Output Contract

Return: the style files changed (`.astro`, `.jsx`/`.tsx`, `.vue`, `.svelte`, `.css` or Tailwind), the fluid tokens used or added, the verification performed (resize + font-size at the 500% Chromium ceiling), every place `px`/`pt` was converted, and any residual overflow risk or accessibility caveat. For bounded widgets, also return the designated space (field width + N lines), the legibility floor, and the character capacity derived from them.

A character capacity is a property of the **glyphs**, not of the box: the same 311 px field held 62 wide characters and 140 narrow ones. So never report one fixed number as if it described the field. Report the capacity **for the text in question**, and state that it is recomputed on every edit — with the empty field falling back to a reference estimate, never a frozen cap.

For any text with several spans in one cell, also return: the single size chosen, which spans inherit it, and which (if any) keep their own and why. For any row with a height ceiling, state the declared capacity in lines, say whether it came from the user or from a question you asked, and confirm the shrink-then-grow order was respected.

## References

- `assets/examples.md` — before/after catalog: static → fluid, vw-only → rem, viewport → container queries, plus the linear-interpolation derivation and a token scale.
- `assets/FitField.astro` — reference bounded field implementing rule 8 (mirror measurer, CSS space limit, derived `maxLength`). Its designated space is parameterized: the `lines` prop plus the field's `inline-size`. The same measurer pattern applies to any text with a declared line capacity.
- `assets/preview.html` — runnable mirror of `FitField.astro` with a live diagnostic readout; open it directly to verify the shrink-to-fit behavior.
- `assets/verify/` — automated acceptance harness (puppeteer-core + the system Chrome) that proves the FitField behaviour in a real browser: `cd assets/verify && npm install && node verify.js`. Every documented behaviour has a numbered check; exit `0` means all passed.
