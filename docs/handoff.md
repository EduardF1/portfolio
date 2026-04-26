# Session handoff

> Updated as the session progresses. Next session: read this first.

## Last commit pushed (origin/main)

- `0b238d0` Tech catalogue + OnePlus 11 + carousel rework + tooltip refit + em-dash sweep
- `367d106` Fix CI: extractFirstParagraph no longer rejects "This..." paragraphs

CI on main was failing pre-existing (the boilerplate-filter regex caught any paragraph starting with "This/These/Those/The"). `367d106` fixes it; expect CI to be green on the next run.

## Currently in flight

- **Senior Dev A** (background agent, worktree-isolated) is running EXIF + GPS extraction across `D:\Portfolio` and producing `scripts/photo-catalogue.json`, `scripts/build-photo-catalogue.mjs`, real captions on `/personal`, plus 4 additional photos. Branch + commits will appear under a `worktree-agent-*` branch; PO merges when it lands.
- **Local uncommitted work**: video-bg placeholder made conspicuous (terracotta gradient + "Variant A · Left" label); switched gating from `@lg:` (container) to `lg:` (viewport) so the columns reliably appear ≥1024px viewport. backlog.md updated with new requests + future-features section. Coverage tooling installed.

## Next session: pick up here

1. **Wait for Senior Dev A** to push its branch. Review the catalogue + photo additions, merge if clean.
2. **Push the local uncommitted batch**: video-bg fix, eslint coverage ignore, backlog updates, this handoff. Single commit "Refinements: video-bg visible placeholder, backlog queue, coverage tooling, handoff doc."
3. **Verify Vercel deploy** — visit `/?video=A` and `/?video=B` on eduardfischer.dev after the push. The placeholder should now be conspicuous (terracotta gradient with a labelled badge).
4. **Open user requests still pending** (in arrival order, see `docs/backlog.md` "## P2"):
   - GitHub tech harvest from https://github.com/EduardF1 (heavy: visit each repo, scan README, propose additions to `src/lib/tech.ts`)
   - Experience timeline product links — link KOMBIT VALG, SitaWare, Greenbyte SaaS, Boozt, Mjølner products in addition to company URLs
   - Travel page interactive Europe map (depends on Senior Dev A's GPS catalogue)
   - Culinary section under `/travel`
   - Visit-notification daily digest email — needs Eduard's approval before shipping
   - Coverage threshold + CI publish — `@vitest/coverage-v8` already installed; remaining work is wiring Vercel/CI step + soft floor
   - `/blog` nav cluster (Personal / Travel / Recommends) — benchmark against Reddit + Danish-culture portfolios first
   - `/my-story` page — long-form arc, layout only; Eduard provides narrative

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
