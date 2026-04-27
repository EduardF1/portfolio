# Safari/Webkit CSS Audit

Branch: `feat/v1-polish-round4`
Auditor: A22 (read-only)
Scope: `src/app/globals.css`, `src/components/**/*.tsx`, `src/app/[locale]/**/*.tsx`, Tailwind config (none — Tailwind v4 uses CSS-first `@theme` in `globals.css`).
PostCSS pipeline: `@tailwindcss/postcss` only — **no autoprefixer**. Tailwind v4 emits modern CSS without vendor prefixes, so anything Safari needs prefixed must be hand-prefixed in `globals.css` (or added via a `@layer utilities` rule).

---

## High severity

| File | Line | Pattern | Risk | Suggested fix |
|---|---|---|---|---|
| _none_ | — | — | — | — |

No HIGH-severity blockers. Specifically verified:

- **`<video autoplay>` is correct.** `src/components/hero-video-bg.tsx:60-72` renders `<video muted autoPlay playsInline loop preload="metadata" poster=…>`. All three iOS-Safari autoplay prerequisites (`muted`, `autoplay`, `playsinline`) are present. No fix needed.
- **No scroll-driven animations** (`animation-timeline: scroll()` / `view-timeline`) anywhere in the tree — Safari's biggest current gap is not used.
- **No CSS `mask-image`** — no `-webkit-mask` prefix issue.

---

## Medium severity

| File | Line | Pattern | Risk | Suggested fix |
|---|---|---|---|---|
| `src/components/site-header.tsx` | 104 | `backdrop-blur supports-[backdrop-filter]:bg-background/60` on the sticky header | Tailwind v4 emits `backdrop-filter: blur(8px)` only — **no `-webkit-backdrop-filter`**. Safari < 18 (still ~25–30% of installed Safari users on iOS 17 and older) needs the `-webkit-` prefix or the blur silently no-ops and you get the fallback opaque `bg-background/75` instead of the intended frosted look. The `supports-[backdrop-filter]` CSS feature query also fails on Safari < 18 because the unprefixed property is not what Safari registers. | Add a small utility in `globals.css` `@layer utilities` that mirrors `backdrop-blur*` to `-webkit-backdrop-filter`, OR add a one-off rule `header { -webkit-backdrop-filter: blur(8px); }` next to the sticky header. Cheapest patch: in `globals.css`, add a `@supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))` block scoped to the header selector. |
| `src/components/hero-video-bg.tsx` | 141 | `backdrop-saturate-75` overlay on Variant B | Same prefix problem — Safari < 18 won't apply saturation desaturation. Visual difference is subtle (a hue shift), not layout-breaking. | Apply the same `-webkit-backdrop-filter` shim. Variant B is gated to `?video=B` query and only renders ≥`lg`, so impact is small. |
| `src/components/photo-lightbox.tsx` | 229 | `backdrop-blur-sm` on the lightbox backdrop (`bg-black/85`) | Already has a strong opaque fallback (`bg-black/85`), so even when blur fails on Safari < 18 the modal is still readable. Cosmetic only. | Same shim as above. Defer if budget tight. |
| `src/components/search-palette.tsx` | 251 | `backdrop-blur-sm` on the command-palette backdrop (`bg-foreground/40`) | `bg-foreground/40` is only 40% opaque — without the blur fallback, content underneath is more visible than designed. Mild aesthetic regression on Safari < 18. | Same shim. |
| `src/components/site-header.tsx` | 213 | `backdrop-blur-sm` on the mobile-menu backdrop | Same as above — palette also 40% opaque. | Same shim. |
| `src/components/how-i-work.tsx` | 64 | `@container` query | Tailwind v4 native container queries compile to `@container` CSS. Safari ≥ 16. Eduard's analytics will tell you the real floor — Safari 15.x is the cliff. Falls back to base styles, so layout doesn't break, but `@md:`/`@lg:` variants silently no-op. Sections affected: experience grid, how-I-work, recommendations, skills, stats-row, travel-europe-map, hero. | Accept Safari ≥ 16 as the floor. If Eduard wants Safari 15.x support: pair container variants with a viewport variant (`md:` alongside `@md:`) so width-based layout still kicks in. Low priority — Safari 15 share is small. |
| `src/components/recommendations-carousel.tsx` | 138, 144, 165 | `@container` + `@md:py-16` + `@md:text-3xl` | Same as above. Quote sizing falls back to `text-2xl` on Safari 15.x — readable, just smaller. | Add `md:` siblings if Safari 15.x parity needed. |
| `src/components/skills.tsx` | 77 | `@container` | Same as above. | Same. |
| `src/components/stats-row.tsx` | 24 | `@container` | Same as above. Stats row already uses flex-wrap, so it degrades cleanly. | Accept. |
| `src/components/travel-europe-map.tsx` | 48 | `@container` | Same as above. The SVG map scales with the container — viewport queries would also work. | Same. |
| `src/app/[locale]/page.tsx` | 93, 331, 334 | `@container` + `@md:grid-cols-12 @md:col-span-4 @md:col-span-8` for the experience layout | This is the most visible container-query usage. On Safari 15.x the experience timeline becomes single-column instead of 4/8 split. Functional, just less polished. | Pair with `md:grid-cols-12 md:col-span-4 md:col-span-8` for breadth-first support. |
| `src/components/site-header.tsx` | 222 | `max-h-[100svh]` on the mobile menu sheet | Safari ≥ 15.4 supports `svh`. Older iOS Safari (15.0–15.3) falls back to its default which is unset — the menu can scroll past the viewport. | Pair with a `100vh` fallback before the `svh` value, or use `max-h-screen` (which Tailwind v4 still maps to `100vh`) with a `@supports (height: 100svh)` override. |
| `src/app/global-error.tsx` | 17 | inline `minHeight: "100dvh"` | Safari ≥ 15.4 for `dvh`. On older iOS Safari the page falls back to the browser default — error screen still works (centered content), but min-height is 0 so short messages may not vertically center. | Add a `100vh` fallback either as a stacked declaration (write `100vh` first, then `100dvh` second) or via `@supports`. Trivial — error page only. |
| `src/app/[locale]/page.tsx` | 350-355 | `target:bg-accent-soft/40 target:ring-1 target:ring-accent/30 target:px-3 target:py-2 target:-mx-3` on `<li>`, plus `target:bg-accent` on the timeline dot | Tailwind v4's `target:` variant compiles to the `:target` pseudo-class, which Safari supports universally. **However**: the rule layers `target:px-3 target:py-2 target:-mx-3` — when activated, padding/margin shift the layout. Combined with the `grid grid-cols-[1fr_auto]` parent, Safari historically had subgrid/layout-shift quirks but this is a plain grid so should be fine. Worth a Webkit smoke test specifically clicking an in-page anchor like `/?#role-systematic`. | No code change needed. Add a Playwright test that navigates to `/#role-…` and screenshots the highlighted role on Webkit. |
| `src/components/site-header.tsx` | 104 | `position: sticky` header inside `body { overflow-x: clip }` | `globals.css:148-153` has a comment specifically calling out that `clip` was chosen over `hidden` to keep sticky working. Good. But Safari ≥ 16 supports `overflow: clip` — Safari 15.x silently treats it as `visible`, so the horizontal-overflow safety net the comment describes does NOT engage on Safari 15.x. Mobile users on iOS 15 can drag-reveal empty bg if any descendant overflows. | Treat `overflow-x: clip` as Safari 16+. Accept; no fix unless iOS 15 is in the support matrix. The actual offending children are already fixed at source per the comment, so this is genuinely belt-and-suspenders. |

---

## Low severity

| File | Line | Pattern | Risk | Suggested fix |
|---|---|---|---|---|
| `src/app/globals.css` | 164 | `background-color: color-mix(in oklab, var(--color-accent) 30%, transparent)` for `::selection` | Safari ≥ 16.4. Older Safari ignores the rule entirely — selection falls back to the OS default highlight. Acceptable degradation. | None. |
| `src/app/globals.css` | 175-177 | `clamp(...)` for h1/h2/h3 sizes | Safari ≥ 13.1, universally fine. | None. |
| `src/app/globals.css` | 196-204 | `margin-inline`, `padding-inline` | Logical properties — universally supported on Safari ≥ 14.5. | None. |
| `src/components/hero-video-bg.tsx` | 52 | `mix-blend-difference` on the prototype label | Universally supported. | None. |
| `src/components/hero-video-bg.tsx` | 45 | `isolate` (Tailwind for `isolation: isolate`) | Universally supported. | None. |
| `src/app/[locale]/page.tsx` | 154 + similar | `aspect-square`, `aspect-[4/3]` | `aspect-ratio` CSS — universally supported. | None. |
| `globals.css` (alpha tokens via `bg-surface/30`, `bg-background/75`, `bg-foreground/40` everywhere) | many | Tailwind v4 alpha modifiers compile to `color-mix(in oklab, …)` for `oklch`/`oklab` token systems | Safari ≥ 16.4 for `color-mix`. Safari < 16.4 sees an invalid declaration and the alpha fails silently — `bg-background/75` would render as fully opaque or transparent depending on which fallback Tailwind emits. Tailwind v4 actually emits an `rgb(...)` fallback ahead of the `color-mix` value, so this is OK. **Verify in Webkit smoke test.** | None expected. Watch for "header looks fully opaque on iOS 16.3" type bug reports. |
| All sticky usage | — | One sticky header (`sticky top-0`) — not nested inside grid/flex parents that would trigger the old Safari sticky-in-grid bugs. | Header sits in a normal block-flow `<header>`. Safe. | None. |
| Many | — | `:focus-visible` (used in 11 places) | Universally supported. | None. |

---

## Confirmed safe (verified, but worth knowing)

- **No `:has(...)` selectors** anywhere in `src/`.
- **No CSS `dvh`/`svh`/`lvh`** in stylesheets — only `100svh` (site-header sheet) and `100dvh` (global-error) inline. Both have minor older-iOS fallback gaps; flagged Medium above.
- **No CSS subgrid** — flagged but not present.
- **No nested CSS** in `globals.css` — Tailwind v4 doesn't emit nesting; the file is flat.
- **No `@starting-style` / `@property` / `transition-behavior: allow-discrete`**.
- **No scroll-driven animations** (`animation-timeline`, `scroll-timeline`, `view-timeline`).
- **No `<input type="date">`** — the styling-on-Safari headache doesn't apply.
- **No `mask-image`** declarations.
- **No `content-visibility`, `overscroll-behavior`, `will-change`** at the source level.
- **No CSS scroll snap** (`snap-x`, `snap-mandatory`, etc.) — the recommendations carousel is JS-driven, not snap-based.
- **`scroll-margin-top` (`scroll-mt-24`)** is widely used (~15 sites) — Safari ≥ 14.1, universal at this point.
- **`scroll-behavior: smooth`** is not set anywhere — clean.
- **`<video>` autoplay block** is correctly configured for iOS Safari (`muted` + `playsInline` + `autoPlay`, MP4 source listed last after WEBM so Safari picks MP4).
- **No Tailwind config file** — Tailwind v4 is configured entirely via `@theme` in `globals.css`, so no plugin-emitted experimental utilities to worry about.

---

## Recommended Safari version floor

**Safari ≥ 16.4** — covers ~95–97% of current Safari/iOS Safari users (per Caniuse, Apr 2026 baseline).

This floor is set by:

1. `color-mix(in oklab, …)` in `globals.css:164` (Safari 16.4+).
2. Tailwind v4 alpha-modifier compilation strategy (also Safari 16.4+, with rgb fallback).
3. `@container` queries across 7 components (Safari 16+).
4. `overflow-x: clip` (Safari 16+).

If Eduard wants to target **Safari ≥ 15.4** (covers another ~2% of users, mostly older iPads):

- Add `-webkit-backdrop-filter` shim for the 5 `backdrop-blur*` / `backdrop-saturate-*` sites.
- Pair every `@container` + `@md:` / `@lg:` site with a viewport-based fallback (`md:` / `lg:`).
- Add `100vh` fallback alongside `100svh` / `100dvh` (2 sites).
- Replace `overflow-x: clip` with `overflow-x: hidden` and audit sticky behaviour (the comment in `globals.css:147-152` indicates this was specifically rejected — leave as-is unless absolutely required).

If Eduard wants **Safari ≥ 18** (current and one back) — no fixes needed, modern stack ships clean.

---

## Test plan

After A12's matrix runs Webkit nightly, watch for visual regressions on these specific files first (ordered by likelihood of Webkit-specific failure):

1. **`src/components/site-header.tsx`** — sticky header background. If the frosted blur looks "off" or the header is fully opaque on Webkit screenshots, the `-webkit-backdrop-filter` shim is needed. Compare desktop + mobile sheet open/closed.
2. **`src/app/[locale]/page.tsx`** (experience section, lines 328-380) — `:target`-driven highlight when navigating to `/#role-systematic`, `/#role-netcompany`, etc. Webkit historically has odd repaint timing on `:target`. Add a Playwright step that navigates to each role anchor and screenshots.
3. **`src/components/hero-video-bg.tsx`** Variants A and B — exercise via `?video=A` and `?video=B` query params. Confirm video actually plays on Webkit (autoplay regression risk) and that the `backdrop-saturate-75` overlay (Variant B) renders.
4. **`src/components/photo-lightbox.tsx` + `src/components/search-palette.tsx`** — open both on Webkit, verify backdrop blur OR opaque-fallback both look acceptable.
5. **Any container-query layout** — experience grid (`@md:grid-cols-12`), recommendations carousel (`@md:py-16`, `@md:text-3xl`), skills, how-I-work. On Webkit at viewport widths 768px and 1024px, confirm the `@md:` / `@lg:` layout breakpoint kicks in. If the layout looks "stuck at mobile" on a desktop Webkit screenshot, the container-query bug is what you're seeing.
6. **Mobile menu sheet** (`src/components/site-header.tsx:222`) — on iOS Webkit at <600px height (e.g., landscape iPhone), confirm the `max-h-[100svh]` doesn't let the sheet exceed viewport.
7. **Alpha-modified backgrounds** — at `bg-background/75` (header), `bg-surface/30` (experience section bg), `bg-accent-soft/40` (`:target` highlight). On Webkit confirm the alpha actually blends (vs. fully opaque or fully transparent) — this validates the Tailwind v4 `color-mix`-with-rgb-fallback strategy.

If Webkit nightly stays green for 2 runs across the above 7 surfaces, the Safari floor of 16.4 is verified and no patches are needed.
