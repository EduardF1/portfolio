# Session handoff

> Updated as the session progresses. Next session: read this first.

## Last commits pushed (origin/main) — autonomous PO night-run

- `5b3119b` Merge feat/reading-time-estimator — 200wpm reading-time chip on /writing posts (live: "6 min read" / "4 min read" / "8 min read" verified)
- `…` Merge feat/my-story-pre-tech — `/my-story` "Paying my own way" chapter for 2016-2021 retail/logistics/call-centre roles (Janteloven-honest pre-tech disclosure per benchmark)
- `13a65c7` Handoff + backlog updates: tick tech additions, record autonomous-PO mode + privacy guard + email-blocker protocol
- `0d53695` Merge feat/how-i-work-methodology — 6 methodologies as honest paragraphs (Scrum/Kanban/FDD/CMMI/LEAN/Clean Architecture)
- `…` Merge feat/tech-additions-from-artefacts — 22 new tech entries from LinkedIn/CV pass + chip wiring
- `cd72726` **Merge feat/exif-last-seen-footer** — "Last seen in: Landsberg am Lech, Germany — March 2026" footer line, EN/DA
- `44ac09c` **Merge feat/timeline-role-deep-links** — Experience #role anchors + per-role copy-link button + :target highlight
- `d51e7ea` **Merge feat/perf-coverage-and-a11y-hardening** — a11y AA across palettes + Lighthouse CI + axe e2e + coverage thresholds 60/55/65/60
- `cd72726` (3-feature batch deploy: hardening + deep-links + EXIF footer)
- `0b9681f` Merge docs/media-analysis-and-features — 3 docs with tech-pass + trip-clusters + feature-exploration
- `9ca561f` Merge feat/per-trip-travel-pages — 41 trip clusters + custom photo lightbox
- `26ae48e` Merge feat/site-search — site-wide search (FlexSearch + Cmd+K palette + /search)
- `b23afe7` **Merge feat/test-coverage-expand**: 25 new test files; coverage 33%→74% statements
- `1087957` Audience benchmark: /blog cluster (recommend skip) + /my-story (recommend ship with tone constraints)
- `c143ee0` Styled 404 page with suggested-routes grid + contact CTA
- `3a8167d` Per-route OG images for /work and /personal listings (dark navy + Schwarzgelb)
- `54f5269` Add /now page (Derek-Sivers-style placeholder shell) + per-route OG + sitemap entry
- `46199fa` Contact form: honeypot field with silent success on bot fill
- `b4b00c4` Reading feed: add Hacker News source + tab strip on /writing
- `cb3cbd2` Add .npmrc legacy-peer-deps=true to unblock Vercel build (react-simple-maps peer vs React 19)
- `e4c4dfa` Per-route OG image for /travel/culinary listing
- `78a49ef` Fix unescaped apostrophe in recommends OG image
- `e938813` Handoff: tick per-route OG (work/[slug])
- `6592d3e` Per-route OG images for /work/[slug] case studies
- `187b8fe` Backlog + handoff: tick OG image generation
- `44691c7` Add OG + Twitter share-image generation (next/og at edge)
- `877fe8b` Backlog + handoff: SEO trifecta + 9 more techs ticked off
- `7349f26` SEO trifecta + deeper GitHub harvest (9 more techs)
- `994eb8a` Travel map: render real geography (react-simple-maps + Natural Earth)
- `efb9fb5` Backlog + handoff: tick travel map, culinary, product links, coverage publish
- `6ca9a09` Culinary sub-route under /travel + CI coverage publish
- `1fea8c7` Travel page: interactive Europe map (initial dot-grid)
- `d90e0f1` Experience timeline product links + Node/Express/Python/Scala
- `153fae2` Merge: photo catalogue + EXIF GPS captions + 4 new photos (Senior Dev A)

Plus the chain from prior rounds: tech catalogue refresh, backlog restructure, video-bg fix, OnePlus 11 recommendation, carousel rework, tooltip refit, em-dash sweep, CI fix.

## Autonomous PO night-run — winding down

When you wake up, three new strategic docs live in `docs/`:

- **`docs/recruiter-deep-dive-2026-04.md`** — DK-recruiter market context, screening rubric, P0/P1 action items. **Top finding**: zero AI/LLM project on the portfolio = biggest single gap (32% of DK 2026 junior listings ask for it). Suggested fix: small LLM-augmented feature (semantic search re-rank, MCP server for portfolio search, or a credible OSS CLI tool).
- **`docs/external-ssd-scout-2026-04.md`** — `G:\` folder-name reconnaissance (no documents opened). 4 concrete content opportunities flagged: SEP4 IoT case study, embedded/firmware tech surface (FreeRTOS / Atmel), Aeldra & JustCook side-projects, Android side-project audit.
- **`docs/audience-benchmark.md`** (earlier in session) — Reddit + Danish-culture benchmark on `/blog` (recommended skip) + `/my-story` (recommended ship with tone constraints).

All four senior-dev rounds completed and merged this session: A (search → per-trip pages), B (test coverage → perf+a11y hardening), C (media + features research), D (EXIF footer).

PO running autonomously, building features on individual branches and batching 2-3 per deploy per Eduard's directive. CI green required before merge; deploys gated by visible feature count.

**Round 2 (after Eduard's "fully fledged website" prompt):**

- `e9b932e` Batch F (2 fixes): apple-icon.svg + icon.svg 404 fixed (manifest stable URLs) + calmer hero kicker ("Aarhus, Denmark · EU/EEA work eligibility") + 73 photos deployed across 20 countries (34 MB) + /travel Recent-trips back to next/image
- `2db09c4` Batch G (2 features): JSON-LD Person+Website schema (knowledge-panel feed) + theme-color light/dark meta + Hero About real bio paragraphs + KOMBIT VALG and Boozt "My contribution" + /now real prose + /my-story 8 chapter prose with year-range corrections + /personal BVB Football paragraph
- `0165ad6` Batch H (3 features): hero portrait painting-frame (palette-aware CSS) + /cv read-only viewer (PDF.js canvas, blocks select/contextmenu/Ctrl-C/-S/-P/-A/F12) + empty-card fix on Skills tiles (Lexik / Windows CMD monogram tiles, PHPUnit local SVG)
- `f62f1f6` Hotfix: /cv 500 — `pageOf` was a function passed across server→client RSC boundary; replaced with template string + client-side substitution. /cv now 200 OK.

**Original autonomous-night batches (6 deploys, 17 features + 3 strategic docs):**
1. `cb3cbd2` `.npmrc` legacy-peer-deps fix (unblocked 6h of failed Vercel builds)
2. **Batch A** `cd72726` (3 features): a11y hardening + timeline #role anchors + EXIF footer
3. **Batch B** `0d53695` (2 features): tech catalogue +22 + "How I work" methodology section
4. **Batch C** `5b3119b` (2 features): reading-time estimator + /my-story pre-tech chapter
5. **Batch D** `4992604` (1 feature + 1 doc): "Visit live system" buttons on /work + recruiter R&D doc
6. **Batch E** `e32dacd` (1 doc): G:\ external-SSD scout

Plus several PO inline shipments on main directly during the early-evening interactive phase: site-wide search, per-trip pages (41 trips × 2 locales = 82 pages), /now shell, /my-story shell, listing OGs, 404 page, global error boundary, humans.txt + security.txt, PWA manifest, reading-feed HN tab, contact-form honeypot.

## Where to look first when you wake up

1. `docs/recruiter-deep-dive-2026-04.md` — strategic; specifically the **P0 action items**.
2. `docs/external-ssd-scout-2026-04.md` — quick wins from `G:\Dev`.
3. The live site: `Cmd+K` to test the new search; click any /work case study to see the "Visit live system" button; /writing list to see reading-time chips; /my-story to see the new pre-tech chapter; footer to see the "Last seen in" line.
4. The 4 P0/P1 follow-ups Eduard owns: (a) fill "My contribution" paragraphs in the 4 /work case studies, (b) pick an AI/LLM angle for a small project, (c) confirm the SEP4 IoT case-study idea, (d) write the prose in /now and /my-story.

**Privacy guard active**: nothing from CPR / contracts / private docs from `D:\Portfolio` or `G:\` goes to git. Only LinkedIn-public-equivalent info gets surfaced.

**Email-blocker protocol**: if PO hits a crucial blocker, send to fischer_eduard@yahoo.com via Yahoo MCP, tag "from Claude" / "from Eduard", 10-min reply window or move task to end of backlog.

## Vercel deploy crisis (resolved this session)

- **Discovery**: every Vercel production deploy from the past 6h was `● Error` — `react-simple-maps@3.0.0` peers against React 16/17/18 but the project is on React 19. Locally it was installed with `--legacy-peer-deps` (per session memory) but Vercel was running plain `npm install` and failing.
- **Symptom**: `/sitemap.xml`, `/robots.txt`, `/writing/rss.xml` all 404 on the live site. The travel map upgrade, OG images, EU badge — all NOT actually live (frozen at last good deploy).
- **Fix**: `cb3cbd2` adds `.npmrc` with `legacy-peer-deps=true`. New deploy `portfolio-ef5b3pl5w` ● Ready in 47s. All three SEO routes now serve 200 OK on eduardfischer.dev.
- **Lesson**: when adding a dep with `--legacy-peer-deps` locally, ALWAYS add the same flag to `.npmrc` so Vercel matches local resolution behaviour.

## Next session: pick up here

1. **Wait for Senior Dev A** to push its branch (EXIF + GPS catalogue + 4 more photos for /personal). Review the catalogue + additions, merge if clean.
2. **Verify the live deploy** of these refinements:
   - `/?video=A` and `/?video=B` on eduardfischer.dev — the placeholder should now be conspicuous (terracotta gradient with "Variant A · Left/Right" or "Variant B · Full bleed" labels).
   - Skills section logos — every tile now sits on a small white plate, so Symfony / PHPUnit / xUnit / dark logos remain readable in dark mode.
   - PHPUnit logo — should now be a clean blue SVG mark "PHP UNIT" (local file at `public/logos/phpunit.svg`).
   - CircleCI logo — should resolve via `github.com/circleci.png` (was broken Devicon URL).
4. **Open queue** is now a single ordered list in `docs/backlog.md` `## Queue (open work, in arrival order)`. Three sub-sections, all part of the same queue:
   - **User requests still open**: deeper GitHub tech harvest pass (first pass added Node/Express/Python/Scala — but EduardF1 has 73 repos and the GitHub API truncates per WebFetch call so a paginated harvest is needed), culinary section under `/travel`, visit-notification daily digest (needs approval), coverage CI threshold, `/blog` nav cluster (needs benchmark), `/my-story` page (needs benchmark), additional tech entries from LinkedIn screenshots + CV ledger.
   - **Architect pass (optional hardening)**: tests, branch protection, perf audit, carousel container queries, live Yahoo IMAP CI assertion.
   - **PO + Architect future-features (also queued, at the bottom)**: 18 items including sitemap, OG, RSS, search, lightboxes, heatmap, analytics, RO locale, `/now`, honeypot, etc.

5. **Just shipped this session**:
   - Geographic Travel map at `/travel` (react-simple-maps + Natural Earth 1:50m TopoJSON via jsDelivr; country borders + coastlines under terracotta markers; no API key)
   - 13 more techs total: Node, Express, Python, Scala (first GitHub pass), Haskell, C++, Doctrine, Twig, Cucumber, Mongoose, Kubernetes, Terraform, Ansible (deeper gh-CLI pass)
   - Experience timeline product links (KOMBIT VALG, STIL, UA.dk, Greenbyte Breeze, Boozt, SitaWare/Frontline/Edge)
   - Culinary sub-route at `/travel/culinary` with two seed dishes
   - CI coverage step + 14-day artifact upload (no threshold gating yet — baseline 36%)
   - SEO: `src/app/sitemap.ts` (both locales × all routes), `src/app/robots.ts`, RSS feed at `/writing/rss.xml`

## Open queue, next session priorities

1. **Visit-notification daily digest** — needs Eduard's approval before shipping. Design proposal already in backlog (Vercel cron → Resend → fischer_eduard@yahoo.com).
2. **`/blog` nav cluster** — Reddit + Danish-culture benchmark first (per `feedback_audience_benchmark.md`).
3. **`/my-story` page** — same benchmark first. Eduard provides the narrative; layout work tracks structure.
4. **Per-route OG images** — root + all four collection slug routes (`/work`, `/writing`, `/recommends`, `/travel`) shipped. `/travel/culinary/[slug]` is the only sub-route still without a per-item card; trivially mirror the `/travel/[slug]` shape if/when you want one.
5. **LinkedIn screenshots + CV-ledger tech pass** — GitHub side is well-covered now (13 techs added across two passes). Remaining gaps in those local artefacts (mind the PNG image-size budget; OCR or smaller resampled copies are safer than reading raw screenshots).
6. **Tighten coverage thresholds** — once writing pages, theme provider, travel-europe-map, hero-video-bg have basic tests.

## Quick sanity-check checklist for next session

- Visit `https://eduardfischer.dev/travel` — should show real Europe map with country borders + 20 terracotta markers.
- Visit `https://eduardfischer.dev/sitemap.xml` and `/robots.txt` and `/writing/rss.xml` — all three should serve.
- Visit `https://eduardfischer.dev/?video=A` and `?video=B` — should show conspicuous flank/full-bleed video bg placeholders.
- Skills section (home page) — every logo should sit on a small white plate (Symfony, PHPUnit, etc. visible in dark mode).

## Known issues / sanity-checks

- **Yahoo IMAP MCP**: confirmed working via round-trip test (sent + received `[Portfolio e2e check 2026-04-26-0526]` in INBOX, ID 304597).
- **Test coverage** at 58.4% statements / 51.92% branches / 69.13% funcs / 59.65% lines. Lowest-covered files: `recommendations-carousel.tsx` (57.6%), `section-heading.tsx` (53.8%), `scripts/sync-gh-descriptions.mjs` (43.1%).
- **Tobias Thisted's company is set to Netcompany** based on rec timing. Eduard to confirm.
- **Recommender LinkedIn URLs** are LinkedIn search URLs (not direct profile URLs) until Eduard confirms each.
- **CMD has `icon: null`** in tech.ts — no clean Devicon variant. Acceptable — falls back to text monogram.

## Conventions to remember (in memory)

- `feedback_team_structure.md`: PO + 2 senior multi-skilled devs, optional Designer (markdown only).
- `feedback_handoff_convention.md`: write `docs/handoff.md` before tokens run out, update incrementally.
- `feedback_audience_benchmark.md`: audience-facing copy ideas → benchmark vs. Reddit + Danish-culture articles before shipping.
- `feedback_no_coauthor_trailer.md`: never include `Co-Authored-By:` in commits.
- New requests are queued at the **END** of `docs/backlog.md`, not near the top.

## Backlog deltas this session

Added P2 section in `docs/backlog.md` with: GitHub tech harvest, experience product links, travel map, culinary section, visit-notification, coverage CI, `/blog` cluster, `/my-story`, future-features list. P4 future-features section added with 18 candidate items.

## Memory deltas this session

- `feedback_team_structure.md` rewritten for the PO + 2 senior devs setup
- `feedback_handoff_convention.md` created
- `feedback_audience_benchmark.md` created
- `user_profile.md` updated with Mjølner role (Apr 2026 →) + Netcompany end (Feb 2026)
