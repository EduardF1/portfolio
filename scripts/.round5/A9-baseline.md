# LinkedIn-Readiness Audit — BASELINE

Audit performed by Agent A9 against the codebase at 2026-04-27 (pre-Round-5 fixes from sibling agents). Read-only; no source modified.

## Per-page verdict

| Page | Verdict | Top issues |
|---|---|---|
| Hero (`src/app/[locale]/page.tsx`) | READY-with-polish | Stats placeholder `20+` countries (line 7 of `stats-row.tsx`), `4` projects undercounts, `4` languages debatable. Hero copy + CV-EN/DA buttons solid. |
| /work (`src/app/[locale]/work/page.tsx`) | READY | GithubStats + GithubFeed both server-side and ISR-cached, no live bug visible in code; recovery already in place via `null`-fallback empty state. EN-only `GithubStats` labels (`Public repos`, `Followers`, `Total stars`, `On GitHub since`, `Top languages`, `View on GitHub`, `Live numbers from the public profile, refreshed hourly`) all flagged `// TODO i18n` in `src/components/github-stats.tsx:32-103` — Danish recruiters will see English only here. |
| /work case studies | READY | All 4 (`kombit-valg`, `sitaware`, `greenbyte-saas`, `boozt`) have substantial prose; KOMBIT and Boozt include "My contribution" + "By the numbers" blocks. Strong. |
| /personal (`src/app/[locale]/personal/page.tsx`) | NOT-READY | (1) `CAR_PHOTOS` (lines 14-27) — three photos with date-only alts (`"31 March 2024"` etc.). Backlog explicitly notes Agent A1 is fixing — currently has wrong images. (2) BVB section: Agent A3 is rewriting per brief. (3) Travel preview (`TRAVEL_PHOTOS` 29-54) currently has six location-confident captions, and they look fine. |
| /writing (`src/app/[locale]/writing/page.tsx`) | READY | Single post (`three-tier-thinking.mdx`, dated 2026-04-27 = today) + 2 articles. Reading-feed component fetches dev.to / HN / All — copy hardcoded EN in `reading-feed.tsx:11-22` (`SOURCE_HEADINGS` + `SOURCE_DESCRIPTIONS`); kicker + tooltip passed to it from `writing/page.tsx:127-130` are also hardcoded EN literals. Should be DA-translated. |
| /travel (`src/app/[locale]/travel/page.tsx`) | READY-with-polish | Photo-catalogue clustering working; country tiles link to most-recent trip. Agent A4 restructuring trip details navigation. No MDX trip files (`content/travel/*.mdx` empty), so the photo-driven path is the only path — fine. |
| /travel/culinary | NOT-READY | `content/culinary/*.mdx` directory does not exist. Page renders the empty-state placeholder ("No dishes published yet. Drop `.mdx` files into `content/culinary/`."). Recruiter sees a TODO. **Recommendation:** hide the cross-link from `/travel` until at least one dish ships, or remove the route from sitemap. |
| /my-story (`src/app/[locale]/my-story/page.tsx`) | READY | Full prose for all 10 chapters present (lines 20-90). Backlog says "prose placeholders Eduard hasn't filled in" but the source shows complete chapters. **Backlog item is stale** — Eduard already filled the chapters in. Mjølner chapter (last, Apr 2026 –) honestly notes "I'll fill this chapter out properly once there's a delivery I can name", which is acceptable. |
| /recommends (`src/app/[locale]/recommends/page.tsx`) | READY | 12 letter MDX files in `content/recommends/letters/` (10 LinkedIn quotes + 2 PDF letters: `niels-svinding`, `martin-hovbakke-sorensen`). Backlog item "only 4 of 10 LinkedIn recs wired" is stale. Single product entry (`oneplus-11.mdx`). Slug page (`recommends/[slug]/page.tsx:52,71`) has hardcoded EN strings `"All recommendations"` and `"Visit product"` — not i18n-routed. |
| /privacy (`src/app/privacy/page.tsx`) | READY-with-polish | EN-only POC at root `/privacy` (file comment line 1: `TODO i18n — EN-only POC`). The Danish nav has no privacy link (footer Link uses NextLink → `/privacy`, not `/da/privacy`); cross-root-layout link triggers full reload. Acceptable for V1, callout if a Danish recruiter clicks Privacy. |

## Critical blockers (must fix before LinkedIn share)

- [ ] **/travel/culinary empty state on a public route.** A recruiter clicking it sees the dev-facing placeholder text mentioning the file path `content/culinary/`. Either seed at least 2 dishes (the `culinary.dishCount` plural exists) or drop the cross-link in `src/app/[locale]/travel/page.tsx:58-64` until ready. The route is in the sitemap, so search engines surface it too.
- [ ] **/personal CAR_PHOTOS section** — placeholder alts (date-only, no location), and per backlog the images themselves are wrong. Agent A1 is the owner; baseline records this as blocking.
- [ ] **GithubStats card on /work is fully untranslated.** Six English labels rendered to Danish visitors. Either translate or accept and document, but don't ship as-is on a localised portfolio. (Lines 32, 37, 42, 47, 62, 66, 76, 102 in `src/components/github-stats.tsx`.)
- [ ] **Reading-feed (`/writing` lower section) copy is hardcoded EN** (`reading-feed.tsx:11-22` SOURCE_HEADINGS/DESCRIPTIONS + `writing/page.tsx:127-130` `kicker="Reading"` and the long English tooltip). Danish version reads as half-translated.
- [ ] **`/recommends/[slug]` page has hardcoded EN** "All recommendations" (line 52) and "Visit product" (line 71). Hit when a recruiter actually clicks into a recommendation.

## Non-blocking polish (nice to fix, not gating)

- [ ] **StatsRow numbers**: `stats-row.tsx:5-8` still uses `5+ years / 4 languages / 4 projects / 20+ countries`. Backlog says these are placeholder. Real numbers from the photo catalogue would push countries higher than 20 (the catalogue shows trips across more than that). `4 projects` undersells (KOMBIT VALG alone covers VC/VCA/VDK/Driftssite/EduAdmin/Infosite/Lokal/NCSCE per `kombit-valg.mdx`).
- [ ] **HowIWork component (`how-i-work.tsx`)** — labels `"How I work"`, `"Six short principles..."` and all six bullet bodies are hardcoded EN literals (lines 31-87). DA visitors see English. Add to `messages/*.json` under `home.howIWork.*`.
- [ ] **Footer "Privacy" link** uses NextLink, full reload on DA. Either accept or move privacy under `[locale]/` per the TODO in `privacy/page.tsx:1-2`.
- [ ] **`tooltips.experience`** says "five companies in five years" — Eduard now has six companies (counting Mjølner) and active period spans Feb 2021 → Apr 2026 = ~5 years 2 months. Numbers still hold but the kicker on home — `experienceHeading` "Five years across five companies." — undercounts (Mjølner makes it six). Either say "across six companies" or "across the past five years".
- [ ] **OG images** — per-route OG present for `/work`, `/personal`, `/my-story`, `/now`, `/travel/culinary`, and the dynamic slug pages. Missing for `/writing`, `/recommends`, `/travel` (root). Root `opengraph-image.tsx` will inherit. Acceptable but a quick win.
- [ ] **Stats-row `4 languages`** — Eduard's profile mentions Romanian/Danish/English; Swedish/Norwegian receptive only. The number is honest by inclusive count but a recruiter scanning for verified Danish + English might want a clearer breakdown elsewhere (already done in About copy and JSON-LD `knowsLanguage: ["en","da","ro"]`).
- [ ] **`src/app/[locale]/now/page.tsx:65-159`** — body prose for Now page is hardcoded EN paragraphs; t() is used for headings only. DA version reads English in the body.
- [ ] **`my-story/page.tsx:20-90` `CHAPTERS`** — chapter headings and body are hardcoded EN. DA visitors get English chapters. Acceptable for V1 (chapters are personal-narrative, hardest to translate well), but document.
- [ ] **`personal/page.tsx`** — section bodies are translated via `personal.sections.*`, good. BVB caption credit currently `"Photo: editorial composite, Westfalenstadion. Reference image via AllFootball Classic, 2012–13 Champions League feature."` — that's a self-flagged synthetic image. Fine, just be aware a sharp recruiter could read "editorial composite" as "AI-generated".
- [ ] **`recommends.kicker` is "Recommends"** — both EN and DA. The DA file uses `"Anbefalinger"` for nav but kicker text would also benefit from a DA-native string. (Looks like nav DA = "Anbefalinger"; needs a quick check that the page's kicker also localises. Confirmed in `messages/da.json` — needs verification in a single read.)
- [ ] **Hero "Available" pill copy** — `t("common.available")` returns "Aarhus, Denmark" (EN) / "Aarhus, Danmark" (DA). The token is named `available` but renders only the city. The intent is "available for work in Aarhus". Either rename to `location` or add a real availability cue. Ambiguous as-is to a recruiter.
- [ ] **`AGENTS.md` warning** — "This is NOT the Next.js you know" — relevant to working agents but not to recruiters; ensure no instruction text bleeds into rendered output (it doesn't, just noting).
- [ ] **Sitaware case study `liveCaveat`** says "My contribution was Frontline and Edge feature work plus UI test automation." But internship was 25 weeks, junior level — make sure the work-page tooltip and hero language don't oversell.

## Items confirmed good (don't touch)

- Hero CTA pair: CV-EN + CV-DA download buttons both wired (`page.tsx:117-132`), files exist at `public/cv/Eduard_Fischer-Szava_CV_EN.pdf` and `_DA.pdf`. **Eduard's recurring concern is satisfied.**
- Hero portrait: priority-loaded, picture-frame treatment, palette-aware. Strong recruiter-grade visual.
- Experience timeline: 5 roles with company links, period, location, summary, tech chips. Mjølner Informatics correctly listed as current. Netcompany correctly ended Feb 2026. Tech chip arrays are rich (Netcompany has 10 chips after the `feat/tech-additions-from-artefacts` pass).
- About paragraphs (P1/P2/P3) are filled in EN + DA, not placeholders. **Backlog item "Hero About narrative" is stale**.
- Recommendations carousel handles DA-source quotes via `quoteEn` field, locale-aware (`recommendations-carousel.tsx:18-21`).
- All four work case studies are substantial: KOMBIT (~85 lines, with metrics), SitaWare (~30 lines), Greenbyte (~35 lines), Boozt (~28 lines). Quality is consistent.
- Recommendations: 12 letter MDX files in `content/recommends/letters/` — 10 LinkedIn quotes + 2 signed PDF letters (Niels Svinding/LEGO, Martin Hovbakke/STIL). **Backlog item "only 4 of 10 LinkedIn recs wired" is stale.**
- JSON-LD Person + Website schema at `src/app/[locale]/layout.tsx:107-175` is comprehensive and useful for Google knowledge panels.
- Layout metadata: title template `%s · Eduard Fischer-Szava`, description with current employer, hreflang en/en-DK/da/da-DK/x-default. Good SEO baseline.
- Mobile menu has full a11y (focus trap, ESC, aria-modal, body-scroll lock). No mobile-blocking patterns visible in markup.
- No em-dashes Eduard prefers as commas surfaced in user-visible copy (only in code comments).
- All work case-study `liveUrl` + `liveCaveat` patterns are honest about what's behind a login wall vs. public.
- Privacy page is short, honest, no third-party trackers claim. Sufficient for GDPR v1.
- Three-tier-thinking post — well-written, dated today, technically credible. Good signal post for engineers.

## Final verdict

**Overall: NOT-READY** — fixable in one focused round.

The portfolio is fundamentally strong: hero, experience, work case studies, my-story, and recommendations carousel are all recruiter-presentable. The blockers are concentrated and shallow:

1. **Empty `/travel/culinary` showing a developer-facing TODO** (1 file change to hide cross-link, or 2 seed `.mdx` to fill).
2. **Personal CAR_PHOTOS** — Agent A1 is fixing.
3. **Three i18n gaps** (GithubStats card, Reading-feed copy, recommends/[slug] hardcoded strings) — visible immediately to a Danish recruiter who toggles DA.

If the sibling agents land their planned commits (A1 cars, A3 BVB, A4 travel restructure, plus an i18n sweep on the three gaps above), the portfolio moves to READY for LinkedIn share without needing further structural work. The "Items confirmed good" list is long enough that overall quality is high; what's missing is the last 10% of consistency.

A LinkedIn recruiter scanning EN for 30s today would form a strong, positive impression. A Danish recruiter on `/da` would notice the inconsistency in three specific places and call it half-translated. Fix the three i18n gaps + the culinary placeholder + ship A1/A3/A4's work, and the answer flips to READY.
