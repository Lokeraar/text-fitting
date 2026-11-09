# Astro Text-Fitting — Before / After Catalog

Companion examples for `../SKILL.md`. Every "after" is CSS-only, rem-based, and honors WCAG 1.4.4 text resizing.

## 1. Fluid typography: `clamp()` + `calc()`  *(advanced clamp source)*

### Before — static

```css
/* ❌ Fixed: overflows small screens, wastes space on large ones,
   and ignores the user's font-size preference entirely. */
.hero-title {
  font-size: 32px;
}
```

### Before — empirical approximation

```css
/* ❌ 5vw-style guesses are not senior: unbounded below 1rem,
   illegible on phones, inconsistent with the design scale. */
.hero-title {
  font-size: 5vw;
}
```

### After — calculated linear combination

```css
/* ✅ Interpolate between 1rem @ 320px and 2rem @ 1200px, then clamp. */
.hero-title {
  font-size: clamp(1rem, calc(0.64rem + 1.8vw), 2rem);
}
```

### How `0.64rem` and `1.8vw` were derived

Pick two anchors: minimum size `1rem` at viewport `320px`, maximum `2rem` at `1200px`. Working in px (assuming the root default `1rem = 16px`):

```text
slope  k = (max_px − min_px) / (V_max − V_min)
           = (32 − 16) / (1200 − 320) = 16 / 880 ≈ 0.0182 px/px
           → as vw:  0.0182 × 100 ≈ 1.8vw

base   b = min_px − k × V_min
           = 16 − 0.0182 × 320 = 16 − 5.82 ≈ 10.18px
           → as rem: 10.18 / 16 ≈ 0.64rem
```

Verify: at `320px` → `0.64rem + 1.8vw` = `10.24px + 5.76px` = `16px` ✓. At `1200px` → `10.24px + 21.6px` = `31.8px` ≈ `32px` ✓. Below/above those widths the `clamp()` floor/ceiling take over.

```css
/* Generalized token form: one declaration per fluid step. */
--step-2: clamp(1.75rem, calc(1.5rem + 1.5vw), 2.5rem);
```

## 2. Accessible zoom / text resizing  *(WCAG 1.4.4 source)*

### Before — vw-only preferred value

```css
/* ❌ With a purely-vw middle term, raising the browser's font-size
   setting does NOT enlarge this text. Full-page zoom also fights the
   clamp() caps. Fails the "text resizable to 200%" intent. */
.card-title {
  font-size: clamp(0.875rem, 4vw, 2rem);
}
```

### After — rem in the fluid part

```css
/* ✅ rem in the middle term: text grows with the font-size setting,
   vw still adds viewport elasticity, rem caps keep the floor/ceiling
   in the user's scale. */
.card-title {
  font-size: clamp(0.875rem, calc(0.75rem + 1.5vw), 2rem);
}
```

**Zoom test (run mentally before shipping):** delete the `vw` term. `calc(0.75rem)` still scales with the user's font-size preference → pass. If deleting `vw` leaves a `px`/`pt`/`vw`-only value → fail, rewrite.

## 3. Local overflow containment: container queries  *(containment source)*

Auto-fit text that tracks the viewport breaks when the same component is placed in a narrow card and a wide rail: it fits the *screen*, not the *card*.

### Before — viewport-driven in a modular layout

```astro
---
// Card.astro
const { title } = Astro.props;
---
<div class="card">
  <!-- Scales with the full viewport, not this card. In a 280px rail the
       font still renders at viewport scale → overflow. -->
  <h3 class="card-title">{title}</h3>
</div>

<style>
  .card-title {
    font-size: clamp(1.25rem, calc(1rem + 2vw), 2rem);
  }
</style>
```

### After — container-driven, island-isolated

```astro
---
// Card.astro
const { title } = Astro.props;
---
<div class="card">
  <h3 class="card-title">{title}</h3>
</div>

<style>
  /* Establish the query context on the component's own wrapper. */
  .card {
    container-type: inline-size;      /* inline-size avoids layout cycles */
    container-name: card;             /* scope the query */
    min-height: 0;                    /* allow the box to absorb height changes */
  }

  /* Fluid against the CARD, not the screen; rem term keeps it accessible. */
  .card-title {
    font-size: clamp(1rem, calc(0.75rem + 2cqi), 1.5rem);
    line-height: 1.3;
    text-wrap: balance;               /* progressive enhancement */
  }

  /* rem foldback for narrow cards — honors font-size preference. */
  @container card (max-width: 30rem) {
    .card-title {
      font-size: 1rem;
    }
  }
</style>
```

Query units (`cqw`, `cqi`) are relative to the container, **not** to the user's font-size preference — which is exactly why the `rem` term and the `rem` foldback are mandatory here.

## 4. Dynamic-length text: line clamping

### Before — fixed height clips arbitrarily

```css
/* ❌ Fragile: longer strings overflow visibly, shorter ones leave a gap,
   and height: 120px is a magic number unrelated to the type scale. */
.product-name {
  height: 120px;
  font-size: 24px;                    /* also static — see rule 1 */
  overflow: hidden;
}
```

### After — fluid size + clamp lines + elastic box

```css
/* ✅ Size from the token scale, clamp the LINE count, let the box breathe. */
.product-name {
  font-size: clamp(1.125rem, calc(1rem + 1vw), 1.5rem);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

```css
/* The containing box adapts instead of forcing a magic height. */
.card {
  min-height: 0;
  height: auto;
}
```

Line-clamp hides content: for a decorative title that is fine; if the text is load-bearing, do not clamp — add an expand control, a link, or show it in full. Verify with the longest realistic string at the narrowest container.

## 5. Enterprise token scale (define once, consume everywhere)

```css
/* src/styles/tokens.css — global, imported once. */
:root {
  --step--1: clamp(0.75rem, calc(0.70rem + 0.25vw), 0.90rem);
  --step-0:  clamp(1.00rem, calc(0.90rem + 0.50vw), 1.25rem);
  --step-1:  clamp(1.25rem, calc(1.10rem + 0.75vw), 1.75rem);
  --step-2:  clamp(1.75rem, calc(1.50rem + 1.50vw), 2.50rem);
  --step-3:  clamp(2.50rem, calc(2.00rem + 2.50vw), 3.75rem);
}

.body { font-size: var(--step-0); }
h1    { font-size: var(--step-3); text-wrap: balance; }
h2    { font-size: var(--step-2); text-wrap: balance; }
.card-title { font-size: var(--step-1); }
.caption    { font-size: var(--step--1); }
```

Every size is `rem`-based at all three positions (`min`, fluid `base`, `max`), so the whole scale responds to the user's font-size preference while staying viewport-fluid.

## Non-goals (deliberately excluded)

- Client-side JS fitting: `resize` listeners, DOM measurement, `canvas`/`ResizeObserver` mutation of font sizes. Use `clamp()` + container queries instead.
- Fixed `px`/`pt` font-sizes for responsive or dynamic text.
- `vw`-only preferred values inside `clamp()`.
- Print output and fixed-density kiosk surfaces — out of scope unless a physical unit is explicitly mandated.
