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
