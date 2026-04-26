# Session handoff

> Updated as the session progresses. Next session: read this first.

## Last commits pushed (origin/main)

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

## Currently in flight (autonomous PO mode while Eduard sleeps)

All four senior-dev rounds completed and merged this session: A (search → per-trip pages), B (test coverage → perf+a11y hardening), C (media + features research), D (EXIF footer).

PO is now running autonomously, building features on individual branches and batching 2-3 per deploy per Eduard's directive. CI green required before merge; deploys gated by visible feature count.

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
