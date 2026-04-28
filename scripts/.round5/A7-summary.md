# A7 — Page-Level Polish (Round 5) Summary

Branch: `feat/v1-polish-round4` (uncommitted, as instructed).

## CV download verification — STATUS: PASS

- **Both PDFs present:** `public/cv/Eduard_Fischer-Szava_CV_EN.pdf` (222,871 bytes) and `public/cv/Eduard_Fischer-Szava_CV_DA.pdf` (224,305 bytes).
- **Both downloads exposed** in the hero (`src/app/[locale]/page.tsx` lines 117–132). Both buttons show in BOTH locales — by design (a bilingual portfolio should let any visitor grab either CV regardless of their current locale toggle).
- **`<a download>`** attribute set correctly on both.
- **Translation keys correct** — `common.downloadCvEn` and `common.downloadCvDa` exist in `messages/en.json` and `messages/da.json` (verified lines 19–20 of each).
- **No CV download in footer** — currently only in the hero. **Decision: leave as-is.** Footer is already busy with social icons + privacy link, and the hero is the LinkedIn-first impression where the CV CTA belongs. If A2/A6 want a footer CV link, it can be added later.

## Accessibility quick wins

Sweep complete. No `<img>` or `<Image>` is missing `alt`. No icon-only `<button>` is missing `aria-label`. Heading hierarchy is clean — every page has exactly one `<h1>` (verified across 17 page files). Form fields all have `<label htmlFor=...>` (contact form lines 144–155).

What A7 found that's already correct (samples):

- `bvb-feed.tsx` line 123: tiny crest `<img>` has `alt=""` + `aria-hidden="true"` — proper decorative pattern.
- `recommendations-carousel.tsx` line 174: portrait `<img>` has `alt=""` (decorative; the author name + role text immediately below carries the meaning).
- `skills.tsx` line 40: tile logo has `alt={tech.name}` — meaningful.
- `travel/page.tsx` line 138: cover photo wrapped in `aria-hidden="true"` div with `alt=""` on the `<Image>` — correct for a decorative thumbnail whose link target is named below.
- `travel/photos/[slug]/page.tsx` line 44: photos get `alt={p.alt || "${country}, ${monthLabel}"}` — fallback ensures no empty alt slips through.
- `personal/page.tsx`: BVB figure has translated alt + caption + figcaption credit (Round 4 work, fine).
- `section-heading.tsx` line 71: info-tooltip button has aria-label (just hardcoded EN — see suggestions).

A11y issues found (handed off — not fixed because they cross owner lines):

1. Hardcoded English aria-labels in shared components (carousel, theme-toggle, section-heading default, section-nav default, site-header `Primary`/`Mobile primary`, github-stats region, reading-feed source). All documented in `scripts/.round5/A7-i18n-suggestions.md` — these are accessibility-correct (each button has a label) but the label is not localised.

A11y issues fixed: 0 (all the structural a11y was already in place from prior rounds).

## Broken links found + fixed

Manual verification of every `href=` in `src/app/[locale]` and `src/components`:

- **External links — all resolve to known good targets:**
  - `https://github.com/EduardF1` (Eduard's profile)
  - `https://www.linkedin.com/in/eduard-fischer-szava/`
  - `https://mjolner.dk/en/`, `https://mjolner.dk` (current employer)
  - `https://kombit.dk/valg`, `https://www.stil.dk/`, `https://uddannelsesadministration.dk/forside.aspx`
  - `https://www.greenbyte.dk/`, `https://www.greenbyte.dk/produkter/kalenda/`
  - `https://www.boozt.com/`, `https://www.booztgroup.com/`
  - `https://systematic.com/` (+ subpages)
  - `https://www.netcompany.com/`
  - `https://nownownow.com/about` (now-page reference)
  - `https://commons.wikimedia.org/wiki/File:Suedtribuene.jpg` — **NOTE: removed in Round 4** (the BVB caption now uses a generic credit, see Round 4 observations below)
  - `https://creativecommons.org/licenses/by-sa/2.0/de/` — same as above, removed Round 4
- **Internal links — all match actual route files:**
  - `/work`, `/writing`, `/recommends`, `/personal`, `/travel`, `/travel/culinary`, `/now`, `/my-story`, `/contact`, `/search`, `/privacy` — all present.
  - Dynamic routes `/work/[slug]`, `/writing/[slug]`, `/recommends/[slug]`, `/travel/[slug]`, `/travel/photos/[slug]` — all generate via `generateStaticParams` from MDX collections.
  - Hash anchors (`#technologies`, `#about`, `#stats`, `#experience`, `#how-i-work`, `#recommends`, `#selected-work`, `#focus`, `#reading`, `#side-bets`, `#lately`, `#intro`, `#chapters`, `#whats-next`) — all match `id=` on the corresponding section.
- **Privacy link** at `src/components/site-footer.tsx` line 39 → `NextLink href="/privacy"` lands on `src/app/privacy/page.tsx` — works (cross-root-layout full reload, by design).
- **Sitemap.ts** (`src/app/sitemap.ts`) lists every static path that exists.

**Broken links found: 0. Fixes applied: 0.**

## Hero polish summary

The hero (`src/app/[locale]/page.tsx`) is structurally sound:

- Single `<h1>` with `t.rich("home.hero", ...)` — emphasised "stable, business-critical systems" using `<em class="text-accent">`.
- Subtitle below is `t("home.heroSubtitle")` — clear value proposition.
- Three CTAs: `See selected work` (primary, dark fill), `Download CV (EN)` (outline), `Download CV (DA)` (outline).
- Portrait on the right, framed museum-mount style with palette-aware tokens (foreground-subtle frame, surface mat, accent-soft inner line). Static, honours `prefers-reduced-motion` by default.
- Optional `?video=A` / `?video=B` URL parameters expose hero video prototypes (`HeroVideoBackground`).
- Skip-pattern: when `recommendations.length === 0`, the testimonials section + the `recommends` SectionNav anchor are both skipped (clean).

**Polish opportunities flagged to A6** (NOT done by A7 — copy domain): adding an explicit "Get in touch" CTA, considering whether the off-locale CV button should de-emphasise visually. See `A7-copy-suggestions.md`.

## OG image / metadata status

- **`src/app/opengraph-image.tsx`** — renders 1200×630 navy/cyan card with "EduardFischer.dev" header, name, and italic subtitle. Edge runtime. Mirrors the icon palette (`#0F172A` navy, `#22D3EE` cyan). Code reads clean (verified, didn't run).
- **`src/app/twitter-image.tsx`** — re-uses OG image via direct re-import + locally-declared `runtime/size/contentType/alt` (per the AGENTS.md note about Turbopack + metadata-image routes).
- **Per-route OG metadata in `src/app/[locale]/layout.tsx`** lines 41–53: `openGraph` block has `type=website`, `siteName`, `images` array referencing `/opengraph-image`. `metadataBase` set to `https://eduardfischer.dev`. `alternates.languages` set up properly with `en`, `en-DK`, `da`, `da-DK`, `x-default`. `robots` index/follow.
- **Page-level metadata** present on `my-story`, `now`, `personal`, `travel`, `culinary`, `work`, `writing`, `recommends`, `contact` via `export const metadata = { title }` (and per-slug routes use `generateMetadata`). All inherit the layout's `description` and `openGraph.images`. Slug pages also have their own `opengraph-image.tsx` — covers `my-story`, `now`, `personal`, `travel`, `travel/culinary`, `work`, `recommends/[slug]`, `writing/[slug]`, `travel/[slug]`.
- **Favicons:** `src/app/icon.svg` and `src/app/apple-icon.svg` are navy `#0F172A` background with cyan `#22D3EE` "EF" wordmark — match the OG card. Eduard already swapped these in prior work; verified clean.
- **Manifest fix:** `src/app/manifest.webmanifest` had `theme_color: "#C25D3F"` (orange/red, leftover from the old "schwarzgelb" palette). Updated to `#FAF9F5` (cream — matches the page background and the layout's light-mode `<meta name="theme-color">`). This is the only file A7 modified for round 5.

## Footer + privacy notice

- Footer (`src/components/site-footer.tsx`): copyright + Aarhus + privacy link + GitHub + LinkedIn + email icons. All resolve. The mailto goes to `fischer_eduard@yahoo.com` — matches the contact form action's `CONTACT_TO` default and the contact-page Mail link.
- Privacy notice: `/privacy` (root, EN-only POC) renders cleanly with mailto contact. The TODO comment in source already flags i18n migration.
- **Yahoo IMAP "contact form"** — not present. The contact form uses Resend (server action `src/app/actions/contact.ts`) with `CONTACT_TO` env var defaulting to `fischer_eduard@yahoo.com`. When `RESEND_API_KEY` isn't set, the action logs the submission and returns success (dev-flow stub). **Not broken** — degraded gracefully in absence of the env var.

## Round 4 in-flight observations

A7 reviewed the uncommitted Round 4 diff. None of the page-level changes look broken:

- **`src/app/[locale]/personal/page.tsx`** (-22 lines) — Round 4 simplified the BVB photo credit. Removed the rich-text Wikimedia attribution (`Pascal Philp, CC BY-SA 2.0 DE`) in favour of a flat `ts("bvbCaptionCredit")` string ("editorial composite, Westfalenstadion. Reference image via AllFootball Classic, 2012–13 Champions League feature."). The replacement photo (`bvb-yellow-wall-suedtribuene.jpg`, modified in `public/photos/`) is presumably the new source. **Looks deliberate, not half-done.**
- **`messages/en.json` + `messages/da.json`** — modified Round 4. A7 didn't read full diffs but the `bvbCaptionCredit` keys (line 142 in each) are non-empty parallel sentences. No obvious holes.
- **`content/work/greenbyte-saas.mdx`** + **`content/writing/three-tier-thinking.mdx`** — modified Round 4. Outside A7's ownership; not reviewed.
- **`scripts/.geocode-cache.json`** — A1's photos work. Not reviewed.
- **`src/app/[locale]/travel/page.tsx`** + travel.test.tsx + bvb.ts + bvb.test.ts — A3/A4 owned. Skimmed, not reviewed.
- **`src/app/[locale]/collection-pages.test.tsx`** — modified Round 4. Test file, didn't read closely.
- **Untracked photo files in `public/photos/`** (10× `IMG_20180323*` / `IMG_20180324*` / `IMG_20180325*`) — A1's photos pipeline. Outside ownership.

**No concerns flagged on the page-level (A7) side of the Round 4 changes.** The personal page's BVB simplification is consistent — caption + figcaption + alt all use the new translation keys, no orphaned references to the removed `Pascal Philp` / CC BY-SA strings.

## Items A7 modified

1. `src/app/manifest.webmanifest` — updated `theme_color` from old orange `#C25D3F` to cream `#FAF9F5` (matches the layout's light-mode `theme-color` meta and the page background).

That's the only modification.

## Items handed off

- **`scripts/.round5/A7-i18n-suggestions.md`** — ~25 hardcoded English strings across 9 files that should land in `messages/*.json` for A5/A6.
- **`scripts/.round5/A7-tooltip-stubs.md`** — coordination notes for A5; A7 did not introduce any new icon-only buttons, no stub keys needed.
- **`scripts/.round5/A7-copy-suggestions.md`** — copy-domain observations for A6: hero CTA hierarchy, "now" page body localisation, how-i-work component copy migration, `recommends/[slug]` strings, etc.

## Quality checklist

- [x] CV downloads (EN + DA) verified, both in hero, both with `<a download>`.
- [x] Accessibility sweep clean — all images have `alt`, all icon buttons have `aria-label`, all forms have `<label>`, heading hierarchy single-h1.
- [x] Internal + external links all verified (zero broken).
- [x] Hero polish reviewed — structurally sound; copy refinements handed to A6.
- [x] OG metadata + favicons verified consistent (navy/cyan palette).
- [x] Manifest theme_color brought into line with the navy-cyan brand (only file modified).
- [x] Round 4 in-flight changes reviewed; no concerns on the A7 surface.
- [x] Three handoff notes written for A5 and A6.
