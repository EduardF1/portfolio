# Agent A5 (Tooltips) — Summary

Branch: `feat/v1-polish-round4` (changes left uncommitted, as instructed).

## Goal
Convert flat label-only tooltips ("Open menu", "GitHub", "Travel") into
informative previews of what users will find behind a control or section.
All tooltip strings live under the `tooltips.*` i18n namespace so other
agents leave them alone.

## Tooltip inventory (Round 5 baseline)

Pre-existing tooltip surfaces found across `src/`:

| File | Surface | Pre-existing tooltip |
| --- | --- | --- |
| `src/components/site-header.tsx` | nav links (work/writing/recommends/personal/travel/contact), locale toggle, hamburger, close button, mobile nav | Only `aria-label` (e.g. `t("openMenu")`); no `title=` |
| `src/components/site-footer.tsx` | GitHub/LinkedIn/Mail social icons, Privacy link | `aria-label` only |
| `src/components/theme-toggle.tsx` | Light/Dark toggle | Hardcoded EN `aria-label` only |
| `src/components/palette-selector.tsx` | Palette `<select>` | `aria-label` only |
| `src/components/search-trigger.tsx` | Header search button | `aria-label` only |
| `src/components/skills.tsx` | Tech tile `<a>` | `title={tech.name}` (label-only) |
| `src/components/stats-row.tsx` | 4 stat tiles | None |
| `src/components/github-stats.tsx` | Stats card, 4 sub-cards, "View on GitHub" | Hardcoded EN labels, no tooltips |
| `src/components/recommendations-carousel.tsx` | Prev/Next slide buttons | Hardcoded EN `aria-label` only |
| `src/components/photo-lightbox.tsx` | Prev/Next/Close buttons | Localised `aria-label` only |
| `src/components/bvb-tabs.tsx` | Standings/Fixtures/Results tabs | None |
| `src/components/section-heading.tsx` | Generic info-icon tooltip | Already supports `tooltip` prop |
| `src/components/reading-feed.tsx` | Reading section heading | Hardcoded EN tooltip prop on /writing |
| `src/components/how-i-work.tsx` | "How I work" heading | None |
| `src/app/[locale]/personal/page.tsx` | Football/Cars/Travel sub-section headings | None |
| `src/app/[locale]/now/page.tsx` | Focus/Reading/Side-bets/Lately headings | None |
| `src/app/[locale]/my-story/page.tsx` | "Where I am now" heading | None |
| `src/app/privacy/page.tsx` | Email link | None |
| `src/app/[locale]/travel/page.tsx` | Page heading + sub-sections | Already uses `tt("travel")` for top heading; sub-sections untouched (A4 wires the rest) |

11 pre-existing keys under `tooltips.*` (about, experience, selectedWork,
openSource, technologies, writingPosts, writingArticles, testimonials,
recommends, travel, contact) were preserved and reused where appropriate.

## Keys added under `tooltips.*`

60 new keys (taking the namespace from 11 → 71 keys in both EN and DA).

```
navWork, navWriting, navRecommends, navPersonal, navTravel, navContact,
navMyStory, navNow,
switchToDanish, switchToEnglish,
openMenu, closeMenu,
themeToggleToDark, themeToggleToLight,
paletteSelector,
searchOpen, searchClose,
footerGithub, footerLinkedin, footerEmail, footerPrivacy,
githubStats, githubStatsRepos, githubStatsFollowers, githubStatsStars,
  githubStatsSince, githubViewProfile,
statsYears, statsLanguages, statsProjects, statsCountries,
skillsHeading, skillsTechTile,
howIWork,
footballSection, footballBvbFeed, footballBvbStandings,
  footballBvbFixtures, footballBvbResults,
carsSection, travelSection,
carouselPrev, carouselNext,
lightboxPrev, lightboxNext, lightboxClose,
readingFeed, writingReadingDevto, writingReadingHn, writingReadingAll,
myStoryWhatsNext,
nowFocus, nowReading, nowSideBets, nowLately,
travelEuropeMap, travelByCountry, travelRecentTrips,
  travelCulinaryCrossLink,
privacyPage
```

### Sample (EN → DA)

- `tooltips.navWork`
  - EN: "Case studies from business-critical systems plus a live feed of my public GitHub repositories."
  - DA: "Casestudier fra forretningskritiske systemer plus et live-feed af mine offentlige GitHub-repositories."
- `tooltips.statsYears`
  - EN: "Years of professional software work, from my 2021 internship at Systematic to today."
  - DA: "Års professionelt softwarearbejde, fra praktikken hos Systematic i 2021 til i dag."
- `tooltips.themeToggleToDark`
  - EN: "Switch to dark mode — easier on the eyes after sundown."
  - DA: "Skift til mørk tilstand — lettere for øjnene efter solnedgang."

## Files modified

### i18n message files
- `messages/en.json` — added 60 keys to `tooltips` namespace
- `messages/da.json` — added the same 60 keys with natural Danish translations

### Components (wiring)
- `src/components/site-header.tsx` — `title` on 6 nav links (desktop + mobile sheet), locale toggle (desktop + mobile), hamburger open/close
- `src/components/site-footer.tsx` — `title` on GitHub/LinkedIn/Mail icons + Privacy link (also widened the icon component type to accept lucide-react `Mail` next to local SVGs)
- `src/components/theme-toggle.tsx` — `title` on the toggle button
- `src/components/palette-selector.tsx` — `title` on the `<select>`
- `src/components/search-trigger.tsx` — `title` on the search button
- `src/components/github-stats.tsx` — `title` on the section, on each of the 4 sub-cards, and on the "View on GitHub" link
- `src/components/stats-row.tsx` — `title` on each of the 4 stat tiles
- `src/components/skills.tsx` — replaced label-only `title={tech.name}` with informative `Open the official documentation for {name}…` template; also `title` on the `<section>` itself
- `src/components/recommendations-carousel.tsx` — `title` on Prev/Next slide buttons
- `src/components/photo-lightbox.tsx` — `title` on Prev/Next/Close buttons
- `src/components/bvb-tabs.tsx` — `title` on the wrapping feed `<div>` + each of the 3 tab buttons
- `src/components/how-i-work.tsx` — added `tooltip` prop to "How I work" SectionHeading

### Pages
- `src/app/[locale]/page.tsx` — already used 3 `tt(...)` lookups; left as-is
- `src/app/[locale]/work/page.tsx` — already used 3 `tt(...)` lookups; left as-is
- `src/app/[locale]/writing/page.tsx` — replaced hardcoded EN `tooltip="A live, hourly-refreshed list…"` on `<ReadingFeed>` with `t("readingFeed")` (`t` is the tooltips namespace there)
- `src/app/[locale]/personal/page.tsx` — added `tooltip` prop to Football, Cars, Travel sub-section headings
- `src/app/[locale]/now/page.tsx` — added `tooltip` prop to Focus, Reading, Side bets, Lately headings
- `src/app/[locale]/my-story/page.tsx` — added `tooltip` prop to "Where I am now" heading
- `src/app/privacy/page.tsx` — added `title` on the email link (POC file, kept inline EN since the page is intentionally EN-only per its own TODO)
- `src/app/[locale]/travel/page.tsx` — NOT touched (Agent A4 owns). Note dropped at `scripts/.round5/A5-travel-tooltips.md` listing the 4 new travel-related keys (`travelEuropeMap`, `travelByCountry`, `travelRecentTrips`, `travelCulinaryCrossLink`) and where to wire them.

### Out-of-scope intentionally left
- `src/components/search-palette.tsx` — close button uses `aria-label={t("close")}` from the search namespace; the X is unambiguous and a tooltip would clutter the modal. Skipped per the "buttons with obvious labels don't need them" guideline.
- `src/components/section-nav.tsx` — anchor links to in-page sections are short labels right next to a dot indicator; obvious context, skipped.
- `src/app/admin/stats/page.tsx` — admin-only, EN-only, internal use; skipped.

## i18n parity confirmed

Verified with a small Node script:

```
EN tooltip count: 71
DA tooltip count: 71
EN-only: []
DA-only: []
```

## TypeScript

`npx tsc --noEmit` runs clean across the touched files (one type widening
needed in `site-footer.tsx` to accept lucide-react's `Mail` icon alongside
the locally-defined `GithubIcon`/`LinkedinIcon`).

## Tone reference for downstream agents

Tooltip register: clear, professional, slightly warm. 6–15 words.
Tells the user what they will find, not what the control "is".
Danish translations are natural register, not literal — Eduard
targets DK recruiters and the Danish copy was tuned accordingly.
