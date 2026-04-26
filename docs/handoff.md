# Session handoff

> Updated as the session progresses. Next session: read this first.

## Last commit pushed (origin/main)

- `17eeb2c` Tech catalogue: 9 more entries + fix CircleCI/PHPUnit/Symfony rendering
- `0cb8d26` Backlog: collapse queue silos — single ordered list, future-features at bottom
- `fd2240c` gitignore: agent worktrees
- `c17977e` Untrack accidentally embedded agent worktree
- `16071eb` Refinements: video-bg visible placeholder, backlog queue, coverage tooling, handoff doc
- `0b238d0` Tech catalogue + OnePlus 11 + carousel rework + tooltip refit + em-dash sweep
- `367d106` Fix CI: extractFirstParagraph no longer rejects "This..." paragraphs

CI on main was failing pre-existing (the boilerplate-filter regex caught any paragraph starting with "This/These/Those/The"). `367d106` fixes it; expect CI to be green on the next run.

## Currently in flight

- **Senior Dev A** (background agent, worktree-isolated) is running EXIF + GPS extraction across `D:\Portfolio` and producing `scripts/photo-catalogue.json`, `scripts/build-photo-catalogue.mjs`, real captions on `/personal`, plus 4 additional photos. Branch + commits will appear under a `worktree-agent-*` branch in `.claude/worktrees/` — that path is now correctly gitignored so it won't accidentally re-embed.
- All other in-flight work has been pushed to `origin/main`.

## Next session: pick up here

1. **Wait for Senior Dev A** to push its branch (EXIF + GPS catalogue + 4 more photos for /personal). Review the catalogue + additions, merge if clean.
2. **Verify the live deploy** of these refinements:
   - `/?video=A` and `/?video=B` on eduardfischer.dev — the placeholder should now be conspicuous (terracotta gradient with "Variant A · Left/Right" or "Variant B · Full bleed" labels).
   - Skills section logos — every tile now sits on a small white plate, so Symfony / PHPUnit / xUnit / dark logos remain readable in dark mode.
   - PHPUnit logo — should now be a clean blue SVG mark "PHP UNIT" (local file at `public/logos/phpunit.svg`).
   - CircleCI logo — should resolve via `github.com/circleci.png` (was broken Devicon URL).
4. **Open queue** is now a single ordered list in `docs/backlog.md` `## Queue (open work, in arrival order)`. Three sub-sections, all part of the same queue:
   - **User requests**: GitHub tech harvest, experience product links, travel map, culinary section, visit-notification, coverage threshold, `/blog` nav cluster, `/my-story` page (last two need Reddit + Danish-culture benchmark before shipping).
   - **Architect pass (optional hardening)**: tests, branch protection, perf audit, carousel container queries, live Yahoo IMAP CI assertion.
   - **PO + Architect future-features (also queued, at the bottom)**: 18 items including sitemap, OG, RSS, search, lightboxes, heatmap, analytics, RO locale, `/now`, honeypot, etc.

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
