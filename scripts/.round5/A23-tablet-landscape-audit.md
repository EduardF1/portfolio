# Tablet + Landscape Layout Audit

Branch: `feat/v1-polish-round4` · Agent A23 · Read-only.
Targeted viewports: iPhone 14 landscape (844x390), iPad Pro 11 portrait (834x1194), iPad Pro 11 landscape (1194x834).

## Tailwind breakpoints in use

There is **no** `tailwind.config.ts` in this repo. Tailwind v4 is configured CSS-first via `src/app/globals.css` (`@import "tailwindcss"; @theme {...}`). No `@theme` `--breakpoint-*` overrides are declared, so Tailwind's defaults apply:

| Token | Min width | What lands here |
|---|---|---|
| `sm` | 640 px | iPhone 14 landscape (844) is `≥sm`, `≥md` |
| `md` | 768 px | iPad portrait (834), iPhone 14 landscape (844) |
| `lg` | 1024 px | iPad landscape (1194) |
| `xl` | 1280 px | not yet activated by any target viewport |
| `2xl` | 1536 px | n/a |

A few components also use container queries (`@container`, `@sm:`, `@md:`) — notably `recommendations-carousel.tsx`, `skills.tsx`, `how-i-work.tsx`, the home `Experience` block, and `travel-europe-map.tsx`. Those track the wrapper width, not the viewport, so they tend to behave better on awkward tablet widths than the viewport-prefixed components do.

`container-page` is `max-width: 72rem` (1152 px) with `padding-inline: 1.5rem` (24 px). At iPad landscape 1194 px, content extends 1152 px wide with only ~21 px gutter on each side — material below.

## Viewport-specific findings

### iPhone 14 landscape (844x390)

844 px lands in `md`, so every `md:` desktop-ish layout activates with only 390 px of vertical room.

| File | Line | Issue | Severity | Suggested fix |
|---|---|---|---|---|
| `src/components/photo-lightbox.tsx` | 276, 283 | Modal image is capped at `max-h-[88vh]` = 343 px tall on this viewport. Caption + attribution + Photo-N-of-N pill (top-right) + close button + arrows must all share the same 390 px of height — caption `mt-3` + attribution `mt-2` push the bottom of the dialog content past the image cap. Backdrop is `bg-black/85` so overflow hides under the chrome. | **HIGH** | Use `max-h-[78vh]` plus `landscape:max-h-[68vh]` on the image, or constrain the wrapper with `landscape:max-h-[88svh] landscape:max-w-[70vw]`. The arrows at `left-2 sm:left-6` already tuck inside, but their vertical centring (`top-1/2 -translate-y-1/2`) overlaps the image when `max-h-[88vh]` fills the viewport — verify with `data-testid="lightbox-prev"` Playwright snapshot. |
| `src/components/site-header.tsx` | 222 | Mobile menu sheet uses `max-h-[100svh]` and lives below a sticky header. Sticky header is `min-h-16` (64 px) — that's 16 % of viewport height. Open the sheet in landscape: only ~326 px of usable space for 6 nav links + locale + palette + theme toggle. Currently scrollable (`overflow-y-auto`) so it works, but feels cramped. Less critical because the inline nav already shows at `≥md`, so iPhone 14 landscape (844 px) hides the hamburger entirely — sheet is unreachable on this viewport. **Verify**: `md:hidden` on the trigger means landscape iPhone uses the full inline nav, which is a lot to fit in the 844-wide bar. | Medium | Either widen the inline-nav threshold (`md:hidden lg:hidden` → keep hamburger to `<lg`) or compress nav gaps from `gap-8` to `lg:gap-8 gap-5` so the right-cluster keeps room for SearchTrigger + locale + palette + theme. |
| `src/app/[locale]/page.tsx` | 95-167 | Hero is `md:grid-cols-12` with `md:items-center`. On iPhone 14 landscape (844 px = `md`), the hero activates the two-column layout — left col `md:col-span-7`, right col `md:col-span-5` for the 400 px portrait frame. With 390 px of viewport height, the centred portrait frame (`aspect-square` + 5 px mat padding ≈ 410 px tall) **overflows the viewport vertically**. User has to scroll to see the CTAs (`download CV` buttons live in the left column). | **HIGH** | Add a landscape-only stack override: gate the two-col grid to `lg:grid-cols-12` (1024+) so iPhone landscape and iPad portrait both stack vertically. Or use Tailwind's `landscape:` modifier with a height check, e.g. `md:max-h-[700px]:grid-cols-12` (custom) — simpler is bumping the breakpoint. |
| `src/components/recommendations-carousel.tsx` | 144 | `min-h-[320px]` on the slides container + `py-12 @md:py-16` padding = 416-448 px minimum height. On iPhone 14 landscape (390 px), this overflows the viewport, plus dots+pause sit below it. Acceptable because the page is scrollable, but visually the carousel **alone** is taller than the viewport, so a swipe-to-next gesture inside it competes with vertical page-scroll inertia. | Medium | Drop `min-h-[320px]` to `min-h-[260px]` or use `min-h-[60svh]` capped (`md:min-h-[320px]`). Also raise the carousel's swipe vertical-tolerance slightly — currently `Math.abs(dy) > Math.abs(dx)` rejects swipes, but on a tall carousel in landscape the user's thumb arc has more dy than expected. |
| `src/app/[locale]/page.tsx` | 461 | `FeaturedWork` uses `sm:grid-cols-2`. At 844 px landscape, two cards side-by-side each get ~398 px wide, fine. But each card is `p-8` (32 px padding) with kicker + h3 + blurb — one viewport-height tall. Three projects fit on first scroll, fourth requires scroll. Low concern. | Low | None needed. |
| `src/components/photo-lightbox.tsx` | 236-254 | Top-right cluster (`top-3 right-3`) — count pill + close button — uses `flex items-center gap-2`. At 390 px height, this row sits 12 px from the top while the image starts immediately below it. Verify the close button's `focus-visible:ring-2 ring-white` does not get clipped by the image's rounded corner. | Low | None needed — already responsive. |
| `src/components/recommendations-carousel.tsx` | 222, 231 | Carousel arrows: `hidden @md:[@media(hover:hover)]:inline-flex`. On iPad / iPhone landscape with hover-capable Bluetooth keyboard, arrows show; pure-touch users get nothing visible. Swipe IS implemented (lines 99-116) so functionality survives. But there's no visible affordance that swipe works — first-time users may not try. | Medium | Add a one-shot "swipe to navigate" cue (font-mono micro-text below the dots) on `[@media(hover:none)]` only, or expose the dots as larger tap targets (currently `h-1.5 w-1.5` = 6 px — under WCAG 2.5.5 minimum target size). |

### iPad Pro 11 portrait (834x1194)

834 px lands in `md`. Plenty of vertical space (1194 px) so hero overflow isn't a concern, but the two-column `md:` desktop layouts get cramped horizontally.

| File | Line | Issue | Severity | Suggested fix |
|---|---|---|---|---|
| `src/app/[locale]/page.tsx` | 95-167 | Hero `md:grid-cols-12 / md:col-span-7 / md:col-span-5`. On 834 px: left col ≈ 467 px (after `gap-12` = 48 px), right col ≈ 317 px. The 400 px-wide portrait frame (`max-w-[400px]`) hits its cap and is centred via `md:justify-end`, but the left column's H1 (`clamp(2.75rem, 6vw, 4.5rem)` ≈ 50 px) plus three CTAs (`See work`, `Download CV EN`, `Download CV DA` — all wrapping with `flex-wrap`) gets visually packed. The two CV-download chips run to ~360 px wide combined; in 467 px they still fit but barely. **In Danish locale the labels are longer ("Download CV (engelsk)")** — likely wraps onto a 4th visual row. | Medium | Make the portrait `md:col-span-4` and prose `md:col-span-8`, OR gate the two-col activation to `lg:` (works for both iPad portrait + iPhone landscape). |
| `src/app/[locale]/contact/page.tsx` | 13-50 | Contact page: `md:grid-cols-12` with sidebar `md:col-span-5` (intro+links) and form `md:col-span-7`. On 834 px the form column is ~437 px — the textarea looks tight, but acceptable. The sidebar's email mailto-link `fischer_eduard@yahoo.com` is 25 chars in mono-ish font ≈ 280 px wide; fits. | Low | None needed. |
| `src/app/[locale]/personal/page.tsx` | 86, 124, 158 | Three sections all use `md:grid-cols-12 / md:col-span-4` (heading) + `md:col-span-8` (content + figure). At 834 px the right column is ~507 px. The figure has `max-w-2xl` (672 px) which gets capped at the column width — fine. The "BVB Yellow Wall" image is `aspect-[4/3]` so renders ~507x380 px — looks balanced. | Low | None needed. |
| `src/components/site-header.tsx` | 122-191 | Header at 834 px: full inline nav (`hidden md:flex`) + locale toggle + palette select + theme toggle + search trigger + brand mark. Total inline = brand (~165 px) + nav (6 links × ~70 px + 5 × `gap-8` 32 px ≈ 580 px) + right cluster (search + EN/DA + palette + theme ≈ 230 px) ≈ 975 px **but viewport is 834 px**. Result: navigation will compress (`gap-8` shrinks via flex but min content widths kick in) or wrap. Inspect at 834 px — likely overflowing, hiding behind `overflow-x: clip` (globals.css line 152). | **HIGH** | Either bump the hamburger threshold to `lg:hidden` (so iPad portrait gets the sheet), or shrink `gap-8` to `md:gap-5 lg:gap-8` and allow the EN/DA toggle to drop to `lg:inline-flex`. The current `overflow-x: clip` masks the symptom — items at the right are silently clipped. Smoke spec `responsive-matrix.spec.ts:38-52` only asserts that *one* of inline-nav-or-hamburger is visible; it does not catch overflow inside the inline nav. |
| `src/app/[locale]/travel/page.tsx` | 72 | "By country" uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. iPad portrait sits in `md` → 2 columns of 393 px each. Each card has `p-6` and a `font-serif text-2xl` country name + comma-separated city list. Reads OK with 2 cols, but on **landscape** (1194 px) it jumps to 4 cols (250 px each) — see below. | Low (portrait) | None needed. |
| `src/components/skills.tsx` | 96 | Skills grid uses `grid-cols-3 @sm:grid-cols-4 @md:grid-cols-6` — container-query'd. At 834 px the parent `container-page` is 834-48=786 px, the `@md` breakpoint is 768 px (Tailwind container default), so the 6-col grid activates → 8 categories × 6 logos per row, each tile ≈ 116 px. Still readable. Container queries here actually shine vs. viewport-prefixed siblings. | Low | None needed. |

### iPad Pro 11 landscape (1194x834)

1194 px is in `lg`. This is where the SectionNav (`lg:fixed left-6`) and 3-col grids activate.

| File | Line | Issue | Severity | Suggested fix |
|---|---|---|---|---|
| `src/components/section-nav.tsx` | 108 | Fixed left-rail TOC: `hidden lg:block fixed left-6 top-1/3 z-20`. At 1194 px viewport, `container-page` (max-w 1152) leaves only 21 px gutter on each side. The TOC sits at `left-6` = 24 px, *inside* the gutter. Labels are ~120 px wide — they run from x=24 to x=144, overlapping the leftmost edge of the page content (which starts at x=21). Specifically, the H2 "About" / "Experience" headings collide with the TOC labels. Acceptable on full-desktop 1440-px chromium project, **broken at the iPad-landscape size that just qualifies for `lg:`**. | **HIGH** | Gate the SectionNav to `xl:block` (1280+) instead of `lg:block`, OR reduce the `container-page` max-width to `64rem` so iPad landscape leaves room, OR shift the TOC offscreen-left and reveal on hover. Lowest-cost fix: `xl:block`. |
| `src/app/[locale]/travel/page.tsx` | 72 | `lg:grid-cols-4` country tiles. At 1194 px width with `container-page` padding, each tile is ~280 px wide — country name `font-serif text-2xl` (32 px) sits well, the comma-separated cities truncate at 6 entries. Density is fine. | Low | None needed. |
| `src/app/[locale]/travel/page.tsx` | 122 | `lg:grid-cols-3` for trip cards with `aspect-[4/3]` cover image. At 1194 px → ~360 px-wide cards × 270 px-tall photos. Fine. | Low | None needed. |
| `src/components/photo-gallery.tsx`, `photo-lightbox.tsx` | 16, 195 | `responsiveGridColsClass` returns `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. On iPad landscape that's 3 cols × ~380-px-tall thumbnails. Lightbox click area is the full thumbnail. Touch hit area 380 px × 380 px = excellent. | Low | None needed. |
| `src/components/travel-europe-map.tsx` | 47-128 | Map uses `react-simple-maps` with hover state for marker highlight (`onMouseEnter` / `onMouseLeave` only — no `onTouchStart`). On iPad landscape, tapping a country circle navigates via `<a href="#country-X">`, but the **hover label** never appears because the touch ends without a `mouseenter`. Users get a marker click but cannot see country names without aim-and-tap. | Medium | Add a `tap-to-toggle` state: `onClick` toggles `hovered` instead of relying on mouse-only events. Or render country labels permanently (lines 112-126 already render `<text>` — they read off `isHovered` for *colour only*, not visibility, so labels are always visible. **Re-verify** my read here — if labels are always visible the issue is only that `onMouseLeave` may stick on touch.) |
| `src/components/recommendations-carousel.tsx` | 222, 231 | Carousel arrows hidden behind `[@media(hover:hover)]`. iPad Pro on Safari **does** report `hover: hover` (Apple Pencil-aware), so arrows DO appear here. Tap-to-advance works. Net positive. | Low | None needed. |
| `src/app/[locale]/page.tsx` | 95-167 | Hero two-column at 1194 px: left col 7/12 ≈ 670 px, right col 5/12 ≈ 480 px (capped to `max-w-[400px]`). Looks correct, breathing room good. | Low | None needed. |

## Hover-vs-touch concerns

A grep for `hover:` flags 40 files. Most are colour transitions (`hover:text-accent`) — no functional regression on touch. The ones that matter:

- **`src/components/recommendations-carousel.tsx:222,231`** — prev/next arrows gated to `[@media(hover:hover)]`. Pure-touch tablets (rare; iPad reports hover) don't see arrows; swipe is the fallback. Acceptable but undiscoverable.
- **`src/components/recommendations-carousel.tsx:127-134`** — `onMouseEnter`/`onFocus` paused state. Touch users get auto-rotate that never pauses. Tap-to-pause does NOT exist (the manual `Pause` button at line 261 is the only escape). For a mobile/tablet user reading slow, the carousel rotates from under them. **Severity: Medium**. Suggest: add `onTouchStart` → `setPaused(true)`, with a delayed unpause.
- **`src/components/section-heading.tsx:96-100`** — tooltip reveal via `group-hover/tooltip` and `group-focus-within/tooltip`. On touch, the `<button aria-label>` gets focus on tap, so tooltip should show — **but** there is no close gesture; tooltip dismisses only when focus moves elsewhere. Tappers may be left with a tooltip stuck on screen. **Severity: Low** (works, just clunky).
- **`src/components/travel-europe-map.tsx:86-89`** — hover sets `setHovered`, no touch fallback. Country circle on `<a href>` so navigation works on tap; only the highlight is mouse-bound. Labels are always rendered (line 112-126 — `<text>` always emitted), they just don't change colour on touch. **Severity: Low** — cosmetic.

## Recommended additional Tailwind breakpoints

Don't add new global breakpoints — Tailwind v4 default `md` and `lg` are sane. Instead, use existing modifiers more deliberately:

- **Use `landscape:` and `portrait:`** for the lightbox image cap and the home Hero stacking. `landscape:max-h-[68vh]` on the lightbox image cleanly fixes the 390-px-tall problem without breaking portrait.
- **Replace `md:grid-cols-12` with `lg:grid-cols-12`** on the home Hero (line 95) and probably the home About (line 176) — both are designed for desktop, both look squeezed on iPad portrait + iPhone landscape.
- **Replace `lg:block` with `xl:block`** on `SectionNav` (`section-nav.tsx:108`) so the fixed TOC doesn't overlap content at iPad-landscape width.
- **Replace `md:hidden` with `lg:hidden`** on the hamburger trigger (`site-header.tsx:184`) so iPad portrait gets the mobile sheet rather than an overflowing inline nav.

If you do want a tablet-only token, drop this in `globals.css` under `@theme`:

```css
--breakpoint-tablet: 48rem; /* 768px, alias for md */
--breakpoint-desktop: 64rem; /* 1024px, alias for lg */
```

…but that's just renaming `md`/`lg`. The real wins are the 3-line patches above.

## Test plan addition

Existing coverage in `e2e/responsive-matrix.spec.ts` runs across `tablet-ipad-pro-11` + `tablet-ipad-pro-11-landscape` + `mobile-iphone-14-landscape` (see `playwright.config.ts:96-132`). It only asserts no horizontal overflow + nav reachable. Add the following:

1. **Lightbox in iPhone-landscape** (`@cross` tag, project `mobile-iphone-14-landscape`):
   - Navigate to `/travel/photos/[any-slug]`, click first thumbnail.
   - Assert lightbox image's `getBoundingClientRect().bottom` is ≤ `window.innerHeight - 16` (i.e. caption + attribution don't overflow).
   - Assert close button is reachable via `tabIndex` without scroll.

2. **Hero overflow in iPhone-landscape** (`@mobile`):
   - Navigate to `/`, run `document.querySelector('[data-testid="hero-frame"]').getBoundingClientRect().bottom` and assert `< window.innerHeight + 200` (allow scroll, but flag if portrait frame alone exceeds 1.5x viewport).

3. **SectionNav overlap on iPad landscape** (`@cross`, `tablet-ipad-pro-11-landscape`):
   - Navigate to `/`, query `nav[aria-label="On this page"]` and the first `<h2>` in `#about`.
   - Assert the nav's `getBoundingClientRect().right` is `<= h2.getBoundingClientRect().left`. Currently this will fail.

4. **Inline-nav overflow on iPad portrait** (`@cross`, `tablet-ipad-pro-11`):
   - Navigate to `/`, measure `header > div`'s `scrollWidth` vs `clientWidth`. Assert no inline overflow inside the header (the existing `assertNoHorizontalOverflow` only checks the document, not nested clipped overflow).

5. **Carousel auto-rotate pauses on touch** (`@mobile`):
   - Touch-tap the recommendations region; wait 9 s; assert the active slide (`aria-current="true"`) has not changed. Currently this fails — `onTouchStart` doesn't pause the autoplay.

## Summary of the top 3

1. **`SectionNav` at `lg:` collides with content on iPad landscape (1194 px)** — `section-nav.tsx:108`. Patch: change `lg:block` to `xl:block`.
2. **Home `Hero` activates two-column at `md:` (768 px)** — `page.tsx:95`. On iPhone 14 landscape (844x390) the 400 px portrait frame pushes CTAs below the fold; on iPad portrait (834 px) Danish CTA labels likely wrap awkwardly. Patch: `md:grid-cols-12` → `lg:grid-cols-12`.
3. **Photo lightbox `max-h-[88vh]` overflows in iPhone landscape (390 px)** — `photo-lightbox.tsx:276,283`. With caption + attribution + close pill stacked, the modal exceeds the viewport. Patch: add `landscape:max-h-[68vh] landscape:max-w-[70vw]` to the wrapper, and verify close+arrows stay reachable.

Honourable mention: **inline nav at iPad portrait (834 px)** silently overflows because `overflow-x: clip` masks it. Either lower the hamburger threshold to `lg:hidden` or shrink `gap-8`.
