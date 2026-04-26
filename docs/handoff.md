# Session handoff

> Updated as the session progresses. Next session: read this first.

## Last commits pushed (origin/main)

- `6ca9a09` Culinary sub-route under /travel + CI coverage publish
- `1fea8c7` Travel page: interactive Europe map with 20 countries from GPS catalogue
- `d90e0f1` Experience timeline product links + Node/Express/Python/Scala
- `153fae2` Merge: photo catalogue + EXIF GPS captions + 4 new photos (Senior Dev A)

Plus the chain from prior rounds: tech catalogue refresh, backlog restructure, video-bg fix, OnePlus 11 recommendation, carousel rework, tooltip refit, em-dash sweep, CI fix.

## Currently in flight

- Nothing in flight. All work for this session is on `origin/main`.
- Senior Dev A landed: 253-photo catalogue (215 with GPS, 20 countries), real captions on `/personal`, 4 more photos (Milan, Vienna, Gibraltar, Pula). Merged in `153fae2`.

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

5. **Just shipped**:
   - Experience timeline product links (KOMBIT VALG, STIL, UA.dk, Greenbyte Breeze, Boozt, SitaWare/Frontline/Edge)
   - 4 more techs (Node, Express, Python, Scala)
   - Travel map at `/travel` (lightweight SVG with 20-country markers, click → scroll to per-country section)
   - Culinary sub-route at `/travel/culinary` with two seed dishes
   - CI coverage step + artifact upload (no threshold gating yet — baseline 36%)

## Open queue, next session priorities

1. **Deeper GitHub harvest** — switch from WebFetch (truncates at ~20) to `gh repo list EduardF1 --limit 100 --json name,language,topics`. Cross-reference with `Desktop\Job search 2026\Linkedin sections (01.12.25)\Skills_*.png` and `Eduard_Fischer-Szava_CV_Ledger_FULL.docx` for the LinkedIn-stated skills harvest. Note: reading the PNG screenshots blew the image budget on Senior Dev A's first attempt; the safe path is `Get-Content -Encoding Byte` size-checks first or just use the gh CLI + WebFetch on `https://github.com/EduardF1` overview which lists language stats.
2. **Visit-notification daily digest** — needs Eduard's approval before shipping. Design proposal already in backlog.
3. **`/blog` nav cluster** — Reddit + Danish-culture benchmark first (per `feedback_audience_benchmark.md`).
4. **`/my-story` page** — same benchmark first.
5. **Tighten coverage thresholds** — once a few more components have basic tests (writing pages, theme provider, travel-europe-map, hero-video-bg).

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
