# R&D ideas, Danish + EU relevance

> Curated brainstorm. Each item is a *candidate* for `docs/backlog.md` once Eduard triages. Effort marks: S (≤1 day), M (1-3 days), L (≥3 days). Fit marks: how well it lands with the Danish/Scandinavian/EU audience. Per the audience-benchmark convention, anything labelled "audience-facing" should get a Reddit + Danish-culture pass before shipping.

## 1. Palettes / visual identity (Danish + Nordic resonance)

- **Dannebrog** *(S, audience-facing)* — red-and-white palette referencing the Danish flag without literally rendering it. Foreground `#FAF9F5`, accent `#C8102E` (flag red). Carries quiet patriotism without flag-waving.
- **Nordlys (northern lights)** *(S, audience-facing)* — deep midnight bg, accent gradient teal → magenta-violet. Editorial, fits dark-mode default. Pairs naturally with the Mountain Navy palette already shipped.
- **Hygge** *(S, audience-facing)* — warm low-contrast cream + candle-orange accent, Geist Mono kicker. Reads as the "design Twitter" of Danish-life aesthetics. Use cautiously — the word is overused abroad.
- **Carlsberg green** *(M)* — bottle-green + cream. Literal but instantly recognisable. Maybe too on-the-nose; benchmark first.
- **Faroe slate** *(S)* — slate grey + sea-foam accent. Quieter Nordic register; works in either light or dark mode.
- **Per-locale default** *(S)* — DA visitors land on Mountain Navy; EN visitors land on Woodsy Cabin. Subtle nod that doesn't require asking. Set in the `setRequestLocale` flow.

## 2. Practical content for foreigners moving to Denmark / EU

- **`/relocating-to-aarhus` long-form post** *(M, audience-facing)* — Eduard's own arc as a Romanian-EU citizen who built a tech career here. CPR registration, NemID/MitID, kommune, NemKonto, AKasse vs. union, Danish lessons, the tax pre-payment year-zero quirk, the housing market reality. Authentic, not a listicle.
- **`/eu-software-jobseeker-guide`** *(M)* — for EU-passport engineers eyeing Denmark or other Nordic countries: how to read a Danish job post, what "konsulent" actually means, why Netcompany / Mjølner / Systematic / LEGO / Vestas / Mærsk / KMD / Trifork / Bankdata are the names that matter, salary expectations in DKK after tax, the 3-month notice norm.
- **`/danish-it-glossary`** *(S)* — 30 Danish IT terms with EN glosses: KOMBIT, Digitaliseringsstyrelsen, NemID/MitID, Borger.dk, Skat, NemHandel, EPJ, FBS, EUD III, etc. Short, scannable, links out.
- **`/study-route` post** *(M)* — Eduard's MSc + AU experience for prospective international students. Aarhus University BDT programme, the Herning campus, semesters with industry, why TBBD instead of pure CS.
- **"Denmark vs. {country}" comparison cards** *(L)* — small visual cards comparing Denmark to neighbouring EU countries on tax, vacation days, parental leave, MitID equivalents, working culture. Uses simple Tailwind data tables. Useful to recruiters relocating talent.

## 3. EU-specific features

- **GDPR / privacy page** *(S)* — explicit, plain-language data-handling notice. Cookie consent only if/when analytics is added. Site is currently no-cookie which is a Danish/EU advantage worth advertising.
- **EU passport / right-to-work badge** *(S, audience-facing)* — small mono kicker near the hero "EU citizen · Denmark resident · open to remote across CET ±2". Saves 50% of a recruiter's first email.
- **Schengen-only travel filter on `/travel`** *(S)* — toggle to show only Schengen-country trips. Useful demo of i18n + filter wiring; also a quiet flex on EU mobility.
- **EU-tax-aware salary calculator** *(L, novelty)* — input gross DKK, output net after Skat at standard top-bracket. Educational, not a recruiter pitch. Could reuse for SE / NO / DE.

## 4. Danish working-culture insights (subtle, professional)

- **`/working-style` page** *(M)* — extension of the existing About: explicitly states preferences that match Danish workplace norms (flat hierarchy, calm meetings, async-friendly, 37-hour work week, work-life separation). Acts as a "values" pre-filter for recruiters; reduces cultural-fit guessing.
- **Calendar-aware availability** *(S)* — the "Aarhus, Denmark · Available for new opportunities" tagline becomes dynamic: shows "Available from {month}" when Eduard is busy, or "Available now" otherwise. Driven by a simple env var or MDX frontmatter.
- **Notice-period kicker** *(S)* — show "3-month notice from current role" in the hero. Standard Danish info, helps recruiters plan. Hide after Eduard signs the next contract.

## 5. Site-wide UX (Nordic-aesthetic-aligned)

- **Reading-time estimate on posts/articles** *(S)* — minutes-to-read kicker. Standard for the audience.
- **"Last updated" stamp on long-form pages** *(S)* — Nordic readers value freshness markers; reduces stale-content suspicion.
- **Subtle weather / time-of-day banner on `/personal`** *(M, decorative)* — pulls Aarhus weather from `met.no` (Norwegian Met office, free, no API key) once a day. Quiet "you're meeting a real person who lives here" signal.
- **Bicycle distance to Aarhus C** *(S, decorative)* — the kind of micro-detail Danish readers smile at. From a hard-coded postal-code centroid; uses OpenStreetMap routing if Eduard wants real numbers.
- **Snowflake / leaf seasonal subtle accent** *(M)* — a single low-key visual cue per season (Dec snowflakes, Oct leaves), CSS-only, reduced-motion respected. Hygge without leaning into it.

## 6. Content / community surfaces

- **Inline DA/EN toggle on long-form pages** *(S)* — when both translations exist, a small mono "EN | DA" affordance at the top of the article. Currently the locale toggle is in the header; this lets readers switch mid-essay without losing scroll position.
- **Guest-post slot for ex-colleagues** *(M)* — open `content/guest/*.mdx` collection. Tobias Thisted, Nanna Dohn, etc. could write a paragraph each — strong social proof on a Danish portfolio because written recommendations carry more weight than star ratings here.
- **`/aktivitet` (activity) page** *(M)* — Danish reads as more honest than "now"; a `/now`-style page in DA. Lists what Eduard is currently working on, learning, reading. Updates monthly.
- **Public open-source contributions feed** *(M)* — pull from the GitHub events API: PRs, issues, releases on third-party repos. Demonstrates community participation, which is rated highly in DK hiring.

## 7. Career / hiring features

- **`/cv` printable view** *(M)* — single-page web view that prints to PDF cleanly via `@page` CSS. Removes the "two CVs drift" risk and lets recruiters share a URL instead of a file.
- **`/work` filter by stack** *(S)* — chip-driven filter on the case-study list, e.g. "show .NET projects only". Already have the tech-chip system; reuse it.
- **Salary-transparency footer** *(M, audience-facing)* — bold for Denmark: state expected gross monthly DKK range. Many candidates do this on Danish-tech LinkedIn but rarely on personal sites. Strong signalling, but needs Eduard's comfort. Benchmark hard before shipping.
- **References section behind a request gate** *(M)* — "Niels Svinding (LEGO), Martin Hovbakke Sørensen (STIL) — references on request." Click → opens a contact form that emails Eduard with the requester's name + company. Avoids exposing his references' contact info publicly.

## 8. Technical / DevOps

- **Sentry error monitoring** *(S)* — free tier, EU-hosted region. Catches client-side errors in the wild.
- **Plausible / Umami self-hosted analytics** *(M)* — GDPR-compliant by default, no cookie banner needed. Hosted in EU. Replaces the Vercel Analytics consideration with a privacy-first option.
- **Lighthouse CI check** *(S)* — fail PR if perf regresses by > 5pt. Pairs with the existing coverage step.
- **Sitemap ping on deploy** *(S)* — Vercel build hook → POST to https://www.bing.com/indexnow with the sitemap URL. Speeds up search-engine pickup of new posts.
- **`og:locale:alternate` + hreflang** *(S)* — currently the layout sets `lang={locale}` but doesn't emit `hreflang="da-DK"` / `hreflang="en"`. SEO improvement specifically for Google.dk surfacing the right locale.

## 9. Discovery / outreach

- **Polyglot RSS** *(S)* — separate `/da/writing/rss.xml`. Some Danish feed readers default to DA-specific feeds.
- **Submit to dansk.it / Version2 / IDA** *(S, manual)* — note Eduard's portfolio in the relevant Danish-tech communities once `/relocating-to-aarhus` and `/danish-it-glossary` exist. These hit the right audience for a long-tail SEO boost.
- **Webmentions support** *(M)* — accept incoming mentions (replies/likes from other personal sites) under each post. Indieweb pattern, well-regarded among Nordic personal-site community.

## 10. Personal / human signals

- **BVB matchday badge** *(S, decorative)* — `/personal` shows "Today: BVB vs. {opponent}, kickoff 18:30 CET" only on matchdays. Bundesliga API or hard-coded calendar. Single tiny detail that signals personality without dominating the page.
- **Coffee preference line** *(S)* — `/personal` tagline addition: filter, espresso, or dripper. Dumb and small, but Danish readers will notice and appreciate the deliberateness.
- **"What's on the desk" photo strip** *(M)* — quarterly update. 3-4 photos of current keyboard / book / mug / view. Very Nordic-tasteful; rotates so the page doesn't feel frozen.

## Suggested pull-into-backlog order

If Eduard wants to ship a few without overthinking:

1. **EU passport / right-to-work badge** (S, recruiter-friction-killer)
2. **`/relocating-to-aarhus` long-form** (M, content-driven, Eduard-narrated)
3. **`/danish-it-glossary`** (S, evergreen SEO)
4. **Reading-time estimate** (S, polish)
5. **Hreflang + per-locale sitemap link** (S, SEO mechanics)
6. **Plausible self-hosted analytics** (M, privacy-first signal)
7. **Salary-transparency footer** (M, only after benchmark)
8. **Dannebrog or Nordlys palette** (S, visual variety)

Everything else lives here as a parking lot until/unless Eduard moves it into `docs/backlog.md` proper.
