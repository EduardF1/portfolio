# Design system — Eduard Fischer-Szava portfolio

Living document. Owned by the Designer agent. Changes here precede token edits in `globals.css`.

---

## 1. Visual identity statement

When a recruiter, a CTO, or a fellow engineer lands on `eduardfischer.dev`, the first impression should be **calm, considered, and unambiguously senior** — like a well-written cover letter from a diplomatic consultant who has shipped systems for elections, defence, and renewables. Negative space, a single confident serif headline, and a quiet accent colour do most of the work. The hidden-gem warmth (BVB, cars, travel) shows through only in small deliberate moments: a hover tone, an italic em-phrase, a footer line about Aarhus. Visitors should leave feeling they have met a structured thinker who happens also to be a person.

## 2. Typography

### Display font (h1, h2, hero)

**Recommendation: keep Instrument Serif.** A contemporary high-contrast transitional serif with genuine personality at large sizes; the italic has a sloped-roman editorial feel that rewards the `<em>` use in the hero `page.tsx` already does. It evokes editorial weight (Bloomberg, *The New Yorker*) without leaning auction-house. Fraunces is too playful (optical sizing tempts maximalism); Crimson Pro is too booky and goes flat in dark mode; Newsreader is anonymous; Inter Display reads as "design Twitter," wrong register for a senior consultant. Instrument Serif is Google-licensed (OFL), free, wired in.

### Body font

**Recommendation: keep Geist Sans.** Pairs with Instrument Serif because the contrast is tonal, not visual — neither shouts. Inter is safer-but-overused; IBM Plex Sans's technical lean clashes with the editorial serif; Söhne is excellent but paid (~€300/yr) and unjustified here. Geist also matches Geist Mono cleanly, keeping the existing `font-mono text-xs uppercase tracking-[0.2em]` kicker pattern visually tight.

### Mono

Keep Geist Mono. Use only for: kickers, dates in the experience list, code in MDX, footer fineprint. Never for buttons, labels, or nav.

### Type scale

Adjust slightly from current tokens — h1 currently maxes at 4.5rem which is fine, but tighten line-height and add explicit small/lead steps.

| Role        | `clamp()`                              | line-height | letter-spacing | weight | font   |
|-------------|----------------------------------------|-------------|----------------|--------|--------|
| h1 / hero   | `clamp(2.75rem, 6vw, 4.75rem)`         | 1.02        | -0.025em       | 400    | serif  |
| h2          | `clamp(2rem, 4vw, 2.75rem)`            | 1.12        | -0.02em        | 400    | serif  |
| h3          | `clamp(1.375rem, 2.5vw, 1.625rem)`     | 1.3         | -0.015em       | 400    | serif  |
| lead / body-lg | `clamp(1.0625rem, 1.4vw, 1.125rem)` | 1.65        | 0              | 400    | sans   |
| body        | `1rem`                                 | 1.7         | 0              | 400    | sans   |
| small / kicker | `0.75rem`                           | 1.4         | 0.2em (kicker) / 0 (small) | 500 (kicker) / 400 (small) | mono / sans |

Rationale: current h1 line-height 1.05 is too airy at the upper bound — at 4.5rem it floats. 1.02 anchors. Body 1.7 stays; long paragraphs in EN/DA both benefit (Danish compound nouns).

### Weight pairings

- **Roman regular** is the default everywhere. The display serif at 400 has enough contrast; do not introduce weight 600 or 700 in serif.
- **Italic serif** carries the "diplomatic but warm" voice. Reserve `<em>` italic for one to two phrases in the hero h1, pull-quotes in writing posts, and section dedications. Never italicise full sentences in body.
- **Semibold body (Geist 500)** is the only emphasis tool inside running prose — product proper nouns, project codenames (KOMBIT VALG), button labels. Avoid bold (600+); it breaks the calm.
- Buttons: medium (500), never bold. Nav links: regular muted → accent on hover (implemented).

## 3. Spacing rhythm

- **Base unit: 4px** (Tailwind default). Steps: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128. Current code already lives on this grid (`py-20 md:py-28`, `gap-12`, `mt-8`).
- **Section vertical padding**: keep `py-20 md:py-28` (80 / 112px). For the hero alone, asymmetric — `pt-24 md:pt-32 pb-20` is correct; the hero should feel slightly top-heavy under the sticky header.
- **Container widths**: `container-prose` 42rem and `container-page` 72rem are well-judged — keep both. 42rem hits ~70-character ideal at lead size; 72rem fits a 12-column experience grid without feeling like a marketing landing page. Do **not** widen.
- **Between-paragraph rhythm**: `space-y-6` (24px) inside prose. Between h2 and its first paragraph, `mt-4` to `mt-6`. Current `mt-4` after kicker, `mt-8` after hero h1 are both right.
- **Section dividers**: keep hairline `border-t border-border/60`. No shadow separators, no gradients — the hairline is part of the editorial register.

## 4. Motion principles

Default tone: **minimal motion, generous whitespace, restraint over flourish.** Eduard ships election software; the site should not feel more animated than software he would deploy.

- **Page transitions**: **No.** Next.js's default instant client transitions are correct. A fade-in would feel marketing-y and add perceived latency. Default to current; revisit if a future MDX longform demands enter animations.
- **Hover states (links, nav, buttons)**: 200ms `ease` for colour (already in `globals.css` for `a`), 150ms for borders. Cards: 200ms `ease-out` background shift (`hover:bg-surface` in place). No transform/scale on hover anywhere — lifts read as "startup landing page."
- **Scroll-revealed elements**: **No, by default.** Exception: the GitHub feed and trip cards on the personal page may use a subtle 300ms fade-in on intersection because they load async and a hard pop is jarring. Nothing in the main flow fades in.
- **Theme switch (light/dark)**: **Instant.** A 300ms cross-fade looks broken on serif text — optical edges shimmer. CSS `color-scheme` swap, no root transitions on `color`/`background`. Components keep their hover transitions; buttons under the cursor briefly transition — fine, not a bug.
- **Palette switch (schwarzgelb / mountain-navy / woodsy-cabin)**: **Subtle 200ms fade on `background-color` and `color` at the root only.** Palette switching is user-initiated discovery (unlike theme, a setting). The fade reads as "I changed something" feedback. Keep it short.

## 5. Per-palette notes

### `schwarzgelb` — warm cream + champagne gold (light) / deep slate + warm gold (dark)

Mood: **editorial, warm, a touch personal.** Imagery: portrait with warm window light, slightly desaturated; Aarhus harbour at golden hour; amber-dominant tones. Style: 35mm, available light, no flash. **Avoid pairing the warm gold accent with thick borders (≥2px)** — at width the gold reads as caution-tape. Keep borders 1px hairline. Fit: **medium-high.** Genuinely the BVB hidden-gem palette — right hidden warmth — but champagne gold can drift "lifestyle blog" without disciplined photography. Current palette; it works.

### `mountain-navy` — cool grey + teal (light) / deep navy + cyan (dark)

Mood: **institutional, technical, trustworthy.** Imagery: cooler portrait grading, blue-hour or overcast Aarhus, fjord shots, austere Scandinavian. Style: clean, balanced, slightly cool white-balance. **Avoid leaking schwarzgelb's cream-card tokens into this palette** — cyan on warm beige reads cheap; verify `--color-accent-soft` swaps cleanly. Fit: **high.** Strongest fit for "diplomatic consultant on government election software." Risk: feeling generic-corporate; the serif display keeps it editorial.

### `woodsy-cabin` — warm beige + sage (light) / dark earth + sage (dark)

Mood: **grounded, slow, considered, slightly outdoorsy.** Imagery: forest/mountain travel, matte film grain, hiking, the trips section. Style: muted, earthy, unprocessed. **Avoid sage paired with the orange-leaning hero `<em>` accent from schwarzgelb defaults** — sage + warm orange is 1970s and undermines seniority. Verify `--color-accent` genuinely changes per palette. Fit: **medium.** Best fit for `/personal` (BVB / cars / travel) but weakest for the work-focused homepage hero. Recommend default on `/personal`, switchable elsewhere.

## 6. Component-level guidance

### Hero
**No photo on the homepage hero.** A portrait pulls toward "personal site" and away from "consultant's workshop." Text-only: kicker (mono), serif h1 with one italic accent phrase, lead sub, two buttons (primary filled + secondary outline). Portrait belongs on `/personal`, tightly cropped (waist-up, three-quarter, neutral background), asymmetric — left-aligned at md+, text wrapping on the right. Background: flat `--color-background`; no gradient, no noise, no decorative blob.

### Section headers
**Both kicker and h2.** Kicker: mono, uppercase, `text-xs`, `tracking-[0.2em]`, `text-foreground-subtle`, `mt-4` to h2. h2: weight 400 serif, left-aligned, never centred. The 4-column kicker / 8-column content split (`md:grid-cols-12`) is excellent — keep for Experience, About, Writing index.

### Cards (work, GitHub, recommendations, trips)
- Corner radius: `--radius-md` (0.5rem) for cards, `--radius-lg` (0.75rem) only for the hero CTA pill and the contact-form success panel. Current `rounded-lg overflow-hidden` on the work grid is right at the outer container; inner cells stay square via `gap-px`.
- Hover: **background shift only** (`hover:bg-surface`) + title to accent (`group-hover:text-accent`). No lift, no shadow change, no scale. Already implemented; correct.
- Shadow vs border: **border, not shadow.** Shadows imply elevation; this site is flat and editorial. Allowed: 1px hairline border or `gap-px` separator-as-border.
- GitHub / trip / recommendation cards: same pattern — kicker, h3, blurb, optional metadata row in mono small at the bottom.

### Forms (contact)
**Subtly filled inputs, 1px hairline border.** Recommended: `bg-surface/50 border border-border focus:border-accent focus:ring-2 focus:ring-ring/30`. Filled treatment lifts inputs off the cream background; underline-only disappears in light mode. Focus: accent border + soft ring. Error: single line of accent-coloured text below the field (already `text-sm text-accent`); do **not** turn the border red — accent reuse keeps the palette coherent. Labels above inputs, sans regular.

### Footer
**Minimal, as-is.** Single row: copyright + Aarhus tag + three icon-only socials. Hairline top border, `mt-24` standoff. No sitemap, no newsletter, no "made with Next.js" badge. The footer should feel like the closing line of a letter, not a navigation hub.

## 7. Open questions for the PO

1. **Display font: keep Instrument Serif or move to Fraunces / Newsreader?** Designer recommends keeping; confirm before locking type tokens.
2. **Italic in the hero h1: keep the single `<em>` accent phrase, or roman-only?** Currently italic; designer recommends keeping for warmth.
3. **Page transitions: stay with Next.js instant transitions, or add a 200ms fade?** Designer recommends instant.
4. **Default palette per route: should `/personal` default to `woodsy-cabin` while the rest defaults to `schwarzgelb` (or `mountain-navy`)?** This is a UX decision with palette-switcher implications for the Engineer.
5. **Hero photo: text-only on `/`, portrait only on `/personal`, as proposed — or does the PO want a portrait on the homepage hero?** Designer strongly recommends text-only on `/`.

---

## 2026-04 refinement specs

These are implementable specs for the Dev sub-agent. They refine existing components and introduce two new ones. Tone matches the rest of this doc: minimal motion, hairline borders, editorial register, no decorative flourishes.

### 8.1 Section tooltip — right-side placement, wider/shorter shape

**Component**: `src/components/section-heading.tsx`. Visible already on 9 sections; problem is the current tooltip is `max-w-[280px]` anchored `top-full left-6`, so it drops down-and-left and reads as a tall narrow column.

**Anchor & geometry**

- The tooltip wrapper (`role="tooltip"` span) anchors from the **right side of the Info icon**, not below it. Use `left-full top-1/2 -translate-y-1/2 ml-2` as the default position. The 8px left margin keeps it visually distinct from the icon.
- **Width**: `width: clamp(280px, 38vw, 480px)` — drop the current `max-w-[280px]`. At 1280px viewport this lands at ~486px capped to 480px; at 768px it lands at 292px; below 640px it falls back to the small-viewport rule below.
- **Max-height**: `max-h-[6em]` measured against the tooltip's own `text-xs` line-height (1.4) — that fits 4 lines. Set `overflow: hidden` (no scroll). If a tooltip body would not fit in 4 lines, the content is too long for tooltip use and the Domain Expert should rewrite it; do not introduce scroll.
- **Padding**: keep `px-3 py-2`. With wider width the existing padding scales fine; do not pad more.

**Typography**

- `text-xs` (0.75rem). Reason: tooltip is decorative annotation; lifting it to `text-sm` reads as paragraph and competes with the heading. Keep `font-normal normal-case tracking-normal` (already present, important — overrides serif heading inheritance).
- `leading-[1.4]` explicit override. The tooltip currently inherits the heading's tight serif line-height (1.02) when not overridden, and that's why prior renders looked claustrophobic. Add `leading-[1.4]` to the span.

**Small-viewport fallback (`<640px`)**

- Below 640px (Tailwind `sm` breakpoint), revert to **below-anchor placement**: `top-full left-0 mt-2 ml-0` and `width: min(calc(100vw - 2rem), 320px)`. The 1rem horizontal page padding plus 1rem safety = 2rem deduction.
- Implementation note for Dev: `sm:left-full sm:top-1/2 sm:-translate-y-1/2 sm:ml-2 left-0 top-full mt-2` is the cleanest Tailwind expression. The default (no prefix) covers `<640px`; `sm:` flips to side placement.
- **Never clip off-canvas.** If page padding is `px-6` (24px), the small-viewport tooltip width must respect that; the `min(calc(100vw - 2rem), 320px)` expression handles it.

**Right-edge overflow (desktop)**

- If the tooltip's right edge would cross the viewport, **flip to left-of-icon**. Implementation: a small client-side check on hover/focus that reads `tooltipEl.getBoundingClientRect().right > window.innerWidth - 8` and toggles a `data-flip="true"` attribute. CSS rule for the flipped state: `data-flip:left-auto data-flip:right-full data-flip:ml-0 data-flip:mr-2`.
- Alternative if Dev prefers CSS-only: use `anchor-name` / `position-try` (CSS Anchor Positioning — Chrome 125+, Safari/Firefox lagging). **Not recommended** for this site given browser support; ship the JS check.
- The translate-x reveal animation also flips: from `translateX(4px)` (default, sliding in from the right) to `translateX(-4px)` (flipped, sliding in from the left).

**Animation**

- Keep existing `transition-opacity duration-150`.
- **Add** `transition-transform duration-150` and a 4px translate-x reveal: hidden state `translateX(0)`; visible state `translateX(4px)`. Combined with opacity 0→1 the tooltip slides slightly away from the icon as it appears. Do not exceed 4px — larger drift reads "marketing landing page."
- Respect `prefers-reduced-motion: reduce` — the tooltip should still appear (functional), but with `transition-duration: 0ms` and no transform. Add a `motion-reduce:transform-none motion-reduce:duration-0` qualifier.

**Acceptance**

- Hovering the Info icon on the About heading at 1440px wide shows a tooltip ~480px wide, ~3 lines tall, immediately to the right of the icon, vertically centred on it.
- At 600px wide, the tooltip drops below the icon at ~320px wide.
- At 1440px wide, on a heading positioned in the right column where the right edge would clip, the tooltip flips to the left of the icon.
- Keyboard focus on the icon button shows the tooltip identically to hover.

---

### 8.2 Recommendations carousel — new component

**File**: `src/components/recommendations-carousel.tsx` (Dev to create). Used on a recommendations section of the homepage and/or `/recommends` index. Source data from `content/recommends/letters/*.mdx` (Domain Expert is producing).

**Frontmatter schema (assume; Domain Expert confirms)**

```yaml
---
author: "Jens Madsen"
role: "Engineering Manager"
company: "KOMBIT"
quote: "Eduard's structured approach to election software made the audit pass painless." # ≤200 chars
language: "en" # "en" | "da"
portrait: "/recommends/jens.jpg" # optional
---
```

If `portrait` is absent, render an initial-avatar fallback: a 40px circle with `bg-surface border border-border`, the author's first initial centred in `font-serif text-base`. Same color tokens as cards.

**Layout**

- Card: `max-w-3xl mx-auto`. Vertical rhythm: `py-12 md:py-16` of internal padding inside the carousel's own section.
- Quote: rendered in **Instrument Serif**, `text-2xl md:text-3xl`, `leading-[1.25]`, italic, with **typographic** opening and closing quotes (`"` `"`) — not straight quotes. The opening quote can be visually offset with a slight negative `text-indent: -0.4em` so the quote mark hangs into the gutter (editorial convention). Color: `text-foreground`.
- Separator: a single em-dash `—` (U+2014) in `text-foreground-subtle`, mono not required, placed on its own line above the attribution.
- Attribution: `text-sm text-foreground-muted`, sans, regular. Format: `[Portrait or initial avatar]  Name · Role, Company`. If portrait/initial is shown, it sits left of the name with `gap-3`. Use mid-dot `·` (U+00B7) between role and company, not comma — keeps it visually quieter.
- Slide spacing: at least `min-h-[320px]` so quotes of varying length don't cause vertical jumps as the carousel rotates. If a quote is short, the bottom whitespace just grows.

**Auto-rotate behaviour**

- Dwell: **7 seconds** per slide. Eduard's quotes are short editorial moments; 7s gives time to read at the median reading speed (~5 words/sec) for a ~30-word pull-quote.
- **Pause on hover** (any pointer over the carousel container) and **on focus-within** (any focusable child receives keyboard focus). Resume on pointer leave / focus blur.
- **Respect `prefers-reduced-motion: reduce`**: do not auto-rotate at all. The user advances manually via dots/arrows/swipe. Show all dots; first slide is the active one; the visible-slide region is no longer announced as live (see ARIA below).

**Controls**

- **Dots below**: one circle per slide, `h-1.5 w-1.5 rounded-full`. Active: `bg-accent`. Inactive: `bg-border hover:bg-foreground-subtle`. Gap: `gap-2`. Each dot is a `<button>` with `aria-label="Go to slide N of M"` and `aria-current="true"` on the active one.
- **Arrows on hover only (desktop)**: previous/next chevrons (`lucide-react` `ChevronLeft` / `ChevronRight`) absolutely positioned on the left/right edges of the card, vertically centred. Hidden by default (`opacity-0`), shown on `group-hover:opacity-100` of the carousel container. **Not** rendered on touch (use `@media (hover: hover)` to gate visibility) — touch users get swipe.
- **Invisible swipe area on touch**: cover the card with a transparent absolutely-positioned `<div role="presentation">` that listens to pointer events with a horizontal-swipe threshold (~50px). Vertical scroll must still work, so cancel the swipe if `|dy| > |dx|`.
- Keyboard: when any control has focus, Left/Right arrow keys advance slides. `Home` / `End` jump to first/last.

**Accessibility (WAI-ARIA Authoring Practices Guide carousel pattern)**

- Root region: `role="region"` `aria-roledescription="carousel"` `aria-label="Recommendations"`.
- Each slide: `role="group"` `aria-roledescription="slide"` `aria-label="Slide N of M"`. Inactive slides have `aria-hidden="true"` and `tabindex="-1"` on focusable descendants (the `inert` attribute is the cleaner future option once Safari support is universal).
- **`aria-live` tradeoff (per WAI-ARIA APG)**: a live region announces every slide change to a screen reader. Combined with **auto-rotate**, that means the user gets interrupted every 7 seconds with no way to control it — explicitly the worst case the APG warns against. Therefore:
  - When auto-rotating: **`aria-live="off"`** on the slide region. The carousel is purely visual; auto-rotation is a sighted-only enhancement.
  - When the user has interacted (clicked a dot, pressed arrows, swiped), or when `prefers-reduced-motion: reduce` is set, auto-rotate is disabled and we set **`aria-live="polite"`** on the slide region so manual navigation is announced.
  - Implementation: a state variable `mode: "auto" | "manual"`. On any user input, transition to `"manual"` and never go back. Update both `aria-live` and the auto-rotate timer accordingly.
- Pause/play affordance: per APG, an auto-rotating carousel should expose an explicit pause control. **Recommendation**: small "Pause" / "Play" button rendered next to the dots, `text-xs text-foreground-subtle`, label toggles. Not an icon — a word, for clarity. Hidden when reduced-motion is active (already paused).

**Styling tokens**

- Card background: none. The carousel sits on `--color-background`. No surface, no shadow, no border on the card itself. Section above and below: hairline `border-t border-b border-border/60` if it sits between other sections.
- Dots active color: `--color-accent` (per palette).
- Quote color stays `--color-foreground` across all palettes; do not tint per palette — quotes are content, not chrome.

**Acceptance**

- Five recommendations rotate every 7 seconds. Hovering pauses rotation immediately. Tabbing to a dot pauses rotation. Pressing right arrow on a focused dot advances. Refreshing with `prefers-reduced-motion: reduce` simulated in DevTools shows static first slide and dots, no auto-rotate.
- Pull-quote in Instrument Serif italic, opening quote hanging into the gutter, em-dash separator, attribution in sans below.
- VoiceOver in `auto` mode: silence during rotation (live region off). After clicking a dot: each subsequent slide change announces author + role.

---

### 8.3 Container queries for mobile responsiveness

**Confirmation: container queries ship in Tailwind v4 core.** The local `node_modules/tailwindcss/package.json` is v4.2.4; v4 includes `@container`, `@min-*`, `@max-*` variants and the `container-type` utility natively. **No plugin install required**; do not add `@tailwindcss/container-queries` (that was the v3 plugin).

**Token system — three named container breakpoints**

| Token | Width | Use case |
|---|---|---|
| `narrow` | `@container (min-width: 32rem)` → use as `@sm:` | Stacked → 2-col layouts in cards/sections within a sidebar or constrained context. Maps to current `sm:` (640px viewport) for components that previously assumed full-viewport width. |
| `comfortable` | `@container (min-width: 48rem)` → use as `@md:` | Multi-column grids (about + stats, skills grid columns, timeline year-rail). Maps to current `md:` (768px). |
| `wide` | `@container (min-width: 64rem)` → use as `@lg:` | Hero side-by-side, video flanks, palette dropdown horizontal expansion. Maps to current `lg:` (1024px). |

These align with Tailwind v4's default `@sm` / `@md` / `@lg` container variants. **Do not invent custom names** — using the built-in shorthand keeps the codebase legible. Internally we still call them narrow / comfortable / wide in design conversation; in code they're `@sm:` / `@md:` / `@lg:`.

**Container declaration pattern**

Every section that should react to its own width gets `@container` on its outermost element (a `<section>` or `<div>`). The default `container-type: inline-size` is correct for layout. Children then use `@md:grid-cols-3` etc. Do not nest containers more than two deep — readability erodes.

**One-line-per-component conversion checklist (current `md:` → `@container` target)**

Dev: convert these components. Each entry is `path → root element → conversion`.

- `src/app/[locale]/page.tsx` Hero block → wrap hero in `<section class="@container">` → `md:grid-cols-12 md:gap-12` becomes `@md:grid-cols-12 @md:gap-12`. Video flanks (see 8.4) gated on `@lg:`.
- `src/app/[locale]/page.tsx` About + StatsRow grid → wrap About+Stats wrapper in `@container` → `md:grid-cols-12` becomes `@md:grid-cols-12`; stats row's `sm:grid-cols-4` becomes `@sm:grid-cols-4`.
- `src/components/skills.tsx` → root `@container` → `md:grid-cols-3 lg:grid-cols-4` becomes `@md:grid-cols-3 @lg:grid-cols-4`.
- Experience timeline (wherever rendered, likely `src/app/[locale]/page.tsx` or `src/components/timeline.tsx` if extracted) → wrap timeline `<ol>` in `@container` → `md:grid-cols-[8rem_1fr]` (year rail + content) becomes `@md:grid-cols-[8rem_1fr]`. Tech-chip wrap stays auto.
- `src/components/site-footer.tsx` → root `<footer class="@container">` → if footer ever has `md:flex-row md:justify-between`, becomes `@md:flex-row @md:justify-between`. Currently single-row; convert defensively for future addition.
- `src/components/palette-selector.tsx` (dropdown) → no conversion needed; it's a `<select>` that doesn't change layout. **Skip.** If the palette UI later becomes a custom dropdown menu with horizontal expansion at wider parent widths, that's the time to add `@container`.
- `src/components/recommendations-carousel.tsx` (new) → root `@container` → arrows visibility `@lg:opacity-0 @lg:group-hover:opacity-100`; quote text size `@md:text-3xl`.
- `src/components/site-header.tsx` → **leave alone.** The header is genuinely viewport-width responsive (the whole page width sets navigation density). Container queries here would add complexity without benefit. Document this exception.

**Edge cases & gotchas**

- Components used inside MDX (mdx-components) inherit their container from the surrounding article. Make sure the MDX article wrapper is `@container` so e.g. embedded recommendation cards adapt to article width, not viewport.
- A `position: sticky` parent with `container-type: inline-size` works in current Chrome/Firefox/Safari (verified mid-2025), but if the sticky header ever needs container queries, test in Safari Tech Preview before shipping.
- Don't double-style: if a component now uses `@md:`, **remove** the old `md:` from the same property. Mixing the two leads to silent precedence bugs.

**Acceptance**

- Skills section dropped into a 320px-wide sidebar collapses to 1 column even though the viewport is 1440px wide.
- Timeline rendered inside a 600px column shows stacked layout; the same component on the homepage at 1440px shows year-rail + content.

---

### 8.4 Hero video background — two prototypes

Inspired by netcompany.com. Both variants are **desktop-only** (gated via `@lg:` container query on the hero) and **decorative** — `aria-hidden="true"`, no caption, no transcript.

**Shared baseline (both variants)**

- Element: `<video>` with attributes `muted autoplay playsinline loop preload="metadata"`. `playsinline` is essential on iOS even though we gate to desktop — Safari desktop can run in a small window that triggers mobile-like behaviour.
- `aria-hidden="true"` on every `<video>`. The video carries no information; the heading and CTA buttons carry the semantic content.
- **Replace with poster image** under any of: `prefers-reduced-motion: reduce`, container width `< @lg`, the user has explicitly toggled a "reduce media" setting (future), or the video failed to load (`onerror`). Poster is a still frame from the same clip, lossy WebP, ~120KB max.
- Loop length: **≤8 seconds**. Anything longer is wasted bandwidth (visitors don't watch hero loops). Eduard's brand tone is restraint; even 8s is generous.
- File budget: **≤2MB per clip**, H.264 MP4 + WebM (VP9 or AV1) fallback, 1080p, ~24fps. The Architect should run a Lighthouse pass after Dev lands the clip — if LCP regresses by more than 200ms, drop to 720p or shorten the loop.
- License: **reuse-allowed only**. Suggested sources: **Pexels Videos**, **Coverr**, **Pixabay Videos** — all permit commercial reuse without attribution. Dev sources the actual clip; before committing any video file with unclear license, **pause and ask Eduard**. Do not embed candidate URLs in this spec; sourcing is the Dev/Architect's job.
- Stylistic direction: **abstract, generic-consulting feel.** Allowed: cool-toned cityscape time-lapses (no recognisable buildings or branding), out-of-focus light bokeh, slow drone shots over water/clouds, abstract motion graphics in cool tones, light playing on a textured surface. **Forbidden**: people, faces, hands, Eduard, logos, recognisable Aarhus landmarks (too tied to one geography), warm-tone footage (clashes with all three palettes' accent colours), explicit tech imagery (code, screens, monitors — feels stocky), drone shots with corporate-headquarters vibe.
- Cool tones only: blues, slate, soft cyan, neutral grey. The terracotta/gold accent and the serif heading need to read against a blue-grey field; warm video undermines that contrast.

**Variant A — flanking sides (slim vertical columns)**

- Layout: hero is a 3-column grid at `@lg`+. Left column: video, ~12% of container width. Centre column: hero text (kicker, h1, lead, CTAs), ~76%. Right column: video, ~12%. Below `@lg` the video columns are `display: none` and the centre column expands to full width.
- Video columns: `aspect-ratio: 9 / 16` (vertical), `object-fit: cover`, height matches the hero section's full height (`h-full`). Width auto-fills the 12% column.
- **Subtle vignette**: each video column gets an inner `box-shadow: inset 60px 0 60px -20px var(--color-background)` on the inside edge (right edge of the left column, left edge of the right column). The video bleeds into the page background without a hard seam. Outer edges: hairline border `border-l border-r border-border/60` against the page edge.
- Centre column unchanged from current text-only hero.
- Mood: editorial gallery — two slim film strips bookending the headline. Strongest variant for Eduard's restraint-first tone.

**Variant B — full-bleed background (entire hero behind heading)**

- Layout: video positioned absolutely, full hero width, `object-fit: cover`, `inset-0`, `z-index: 0`. Hero content (kicker, h1, lead, CTAs) sits in a relative container at `z-index: 10`.
- **Darken overlay**: a `<div>` between the video and the content with `background: var(--color-background)` at **60% opacity** (`bg-background/60`). In dark mode this darkens; in light mode it actually *lightens* the video — verify both modes maintain WCAG AA contrast on the heading. Per palette: in `mountain-navy` dark, the navy overlay tints the video cool, which is on-brand; in `schwarzgelb` light, the cream overlay tints the video warm, which works against the cool-tone rule above. **Recommendation**: in light mode add a second overlay layer at 20% with a desaturating `backdrop-filter: saturate(0.7)` to keep the cool feel.
- Heading legibility check: the serif h1 in `--color-foreground` must hit ≥4.5:1 contrast against the overlaid video at every frame of the loop. Architect runs a contrast audit on three sample frames before merging.
- Mood: cinematic, more "marketing-confident" than Variant A. **Risk**: this is closer to the consulting-landing-page register the rest of the design pushes against. Use only if Variant A reads too austere in user testing.

**Recommendation**: ship **Variant A** as the default. Variant B sits behind a feature flag for A/B comparison; PO decides after seeing both live.

**Mobile / reduced-motion fallback**

- Below `@lg`: no video at all. Hero is text-only, exactly as it is today. Do not show the poster image either — the current text-only hero is the canonical mobile experience.
- `prefers-reduced-motion: reduce` on desktop: replace `<video>` with the poster `<img>` (still frame). Same layout (flanks for A, full-bleed for B), same overlay for B, no motion.
- If the video fails to load: same fallback as reduced-motion.

**Acceptance**

- On a 1440px desktop with normal motion preferences, Variant A shows two slim video columns flanking the hero text; loop is silent, ≤8s, cool-toned.
- On a 1024px window (right at the `@lg` boundary), the layout is verified — no half-rendered columns, no layout shift on first paint.
- At 800px width, the hero is text-only with no video and no poster.
- DevTools "Emulate prefers-reduced-motion: reduce" replaces the video with a static poster image, no autoplay attempt.

---

### 8.5 Theme dropdown — English-only labels

**Component**: `src/components/palette-selector.tsx`. Currently the labels are hard-coded in English already — `"Schwarzgelb"`, `"Mountain Navy"`, `"Woodsy Cabin"` — but the first label is the German loanword. Eduard wants no German leaking into the English UI.

**Final label proposal**

| Slug (do not change) | Current visible label | **New visible label** |
|---|---|---|
| `schwarzgelb` | Schwarzgelb | **Black & Gold** |
| `mountain-navy` | Mountain Navy | **Mountain Navy** *(unchanged)* |
| `woodsy-cabin` | Woodsy Cabin | **Woodsy Cabin** *(unchanged)* |

**Confirmation**: `Black & Gold` is the right call. It carries the BVB nod (the unofficial "Schwarz und Gelb" English fan rendering), is a recognised colour-pairing label outside football contexts (jewellery, design, Pittsburgh Steelers — all neutral associations), and uses an ampersand — slightly more designed than "and" without becoming twee. Alternatives considered:

- *Borussia* — too on-the-nose; doubles down on the football reference and undermines the "hidden warmth" tone.
- *Dortmund* — same problem, plus opaque to non-football readers.
- *Champagne Gold* — accurate to the actual accent token, but loses the BVB nod entirely; the palette name is one of three places the BVB easter egg lives.
- *Black & Yellow* — flat; "Gold" reads more editorial and matches the actual `--color-accent` token (it's gold-leaning, not pure yellow).

**Implementation note**: only the visible label string changes. The slug `schwarzgelb` stays in `localStorage`, in CSS class names, in palette-provider state — every existing user's saved palette continues to work without migration. Single-line change in `palette-selector.tsx`'s `OPTIONS` array.

**DA translation**: the Danish UI label stays translated. **`messages/da.json` should keep its DA rendering** — the rule is "no German in EN," not "no localisation in DA." Recommended DA labels:

- `schwarzgelb` → **`Sort & Guld`**
- `mountain-navy` → **`Bjergblå`** (literal: "mountain blue" — Danish doesn't loan-word "navy" in design contexts; if Eduard prefers consultant-neutral, use `Marineblå`).
- `woodsy-cabin` → **`Skovhytte`** (literal: "forest cabin" — single compound noun feels right in DA).

These are not currently in `messages/da.json` because the palette selector doesn't use `useTranslations` yet. **Open question for Dev**: wire the palette selector through `next-intl` so labels are `t("palette.schwarzgelb")` etc., or hard-code per locale in the component. Designer recommends wiring through `next-intl` for consistency with the rest of the app.

---

### 8.6 Nav copy — "Writing" → "Posts and articles"

**Current**: header nav shows `Writing` (EN) and `Tekster` (DA), pulling from `messages/{en,da}.json` `nav.writing`. The route segment is `/writing`.

**Visible label change (EN)**

- `nav.writing`: `"Writing"` → **`"Posts and articles"`**
- This better describes the page's actual content (short blog posts plus academic articles), matching the section split that already exists on the writing index page (`writing.posts` and `writing.articlesLead` are both present in `en.json`).

**Visible label change (DA)**

- `nav.writing`: `"Tekster"` → **`"Indlæg og artikler"`**
- Direct parallel: `Indlæg` ("posts" — already used in `writing.posts`) + `og` + `artikler` ("articles"). Keeps DA register consistent with EN.
- Alternative considered: `"Tekster"` is fine on its own (means "writings/texts"), but doesn't signal the post/article split. Eduard's preference for parallelism with EN wins.

**Route rename: `/writing` → `/posts`?**

- **Recommendation: keep the route at `/writing`. Change visible label only.**
- Reasons:
  1. `/writing` is already indexed (and the site has been live with this URL since the Vercel deploy in the Done list). Renaming creates a 301 redirect chain and resets any incoming link equity.
  2. `/posts` is reductive — it doesn't cover the academic articles, which are arguably the more substantial half of the section.
  3. URL doesn't have to mirror visible label. `/writing` is the *category*; "Posts and articles" is its sub-structure. Same as how Stripe's `/customers` URL surfaces a page titled "Companies and individuals" without anyone caring.
- If Eduard insists on a route rename anyway, the SEO cost is recoverable: add `next.config.js` redirect from `/writing` → `/posts` (and `/[locale]/writing` → `/[locale]/posts`), preserve sitemap entries, accept ~2 weeks for re-indexing. But the cost is real and the gain is cosmetic; default is don't.

**Files Dev will touch (label-only path)**

- `messages/en.json` — `nav.writing` value
- `messages/da.json` — `nav.writing` value
- That's it. `site-header.tsx` already pulls from `t("writing")`; no component change.

**Acceptance**

- Header nav shows "Posts and articles" in EN, "Indlæg og artikler" in DA.
- The route stays `/writing` and `/da/writing`; existing bookmarks and external links continue to work.
- The page heading on the destination page (a separate string, `writing.kicker`) stays "Writing" — it's a kicker, not the link label. Optional polish: align that to `"Posts and articles"` too for consistency, but not strictly required.

---

## 9. Open questions raised by 2026-04 specs

1. **Tooltip flip detection** — JS `getBoundingClientRect` check vs. CSS Anchor Positioning. Designer recommends JS now, CSS-native in 12 months once Safari ships.
2. **Recommendations carousel — pause/play affordance** — render as a text button next to dots, or omit and rely on hover-to-pause? APG says explicit pause is required for auto-rotating carousels. Designer recommends including it.
3. **Container query rollout** — convert all listed components in one PR, or stage the rollout component-by-component? Designer mildly prefers staged (one PR per component) so any regression is bisectable.
4. **Video variant choice** — A (flanks) vs. B (full-bleed). Designer recommends A; PO decides after seeing both live.
5. **Palette label localisation wiring** — push palette labels through `next-intl` or hard-code per locale? Designer recommends `next-intl`.
6. **Writing route rename** — keep `/writing` (recommended) or move to `/posts`? PO calls this; SEO impact is real but small.
