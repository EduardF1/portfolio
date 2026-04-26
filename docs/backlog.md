# Portfolio Backlog

> Live tracker maintained by the PO. Engineering work follows: branch off `main` → PR → CI green → merge.

## Roster

| Role | Responsibility |
|---|---|
| **PO** | Orchestrates, prioritizes, briefs agents, accepts work, merges PRs |
| **Designer** | Visual system docs (typography, spacing, motion, per-palette guidance) — markdown only, no code |
| **Dev** | Feature implementation (components, pages, integrations) |
| **Dev — Domain Expert** | Researches Eduard's LinkedIn + `D:\Portfolio` archive, produces content inventory + summaries |
| **Dev — Architect** *(optional)* | Tests, performance, DevOps, observability — pulled in for hardening passes |

## In flight

| Epic | Item | Owner | Branch / PR |
|---|---|---|---|
| *(none — clean slate)* | | | |

## Backlog — Eduard fills in (no agent action needed)

- [ ] **Hero About narrative** — replace placeholder paragraphs in About section with Eduard's actual narrative
- [ ] **"My contribution" sections** in feral-systems article + thesis summary — replace placeholders with Eduard's specific contribution to the co-authored work
- [ ] **Real travel trips** — drop new `.mdx` files into `content/travel/` with frontmatter (location, date, photos). Sample Pisa trip stays as a template.
- [ ] **Personal page prose** — Football section still uses placeholder grid (BVB game shots TBD); Cars + Travel now have 5 photos from the archive with location-guess captions Eduard should correct.
- [ ] **Recommendations seed entries** — drop `.mdx` files into `content/recommends/` with reading list
- [ ] **Stats-row final numbers** — update years/projects/countries with Eduard's real numbers (current is approximate)
- [ ] **GitHub profile bio fields** (name/location/website) — manual at github.com/settings/profile, OR `gh auth refresh -s user` and the PO can do it via API
- [ ] **Hero video clip** — Eduard approves a Pexels/Coverr/Pixabay reuse-allowed candidate, then PO sets `NEXT_PUBLIC_HERO_VIDEO_MP4` / `…_WEBM` / `…_POSTER` in Vercel env. Compare `?video=A` (flanks) vs. `?video=B` (full-bleed) on the live preview; PO removes the loser.
- [ ] **Photo location captions** — alt text on `/personal` car + travel photos is marked "(location guess)". Replace with real locations.
- [ ] **Recommendations carousel — remaining LinkedIn recs** — only 2 of 10 LinkedIn recommendations are wired (Tobias Thisted, Nanna Dohn) plus 2 PDF letters (Niels Svinding/LEGO, Martin Hovbakke/STIL). Drop the other 8 LinkedIn rec quotes into `content/recommends/letters/*.mdx`.

## P3 — Architect pass (optional, post-launch)

- [ ] Expand test coverage — writing pages, theme + palette switching round-trips
- [ ] sitemap.xml + robots.txt
- [ ] OG image generation per route (social previews)
- [ ] Branch protection rules (require CI before merge)
- [ ] Performance audit — lighthouse, image-loading, font-loading
- [ ] Container queries — convert `recommendations-carousel.tsx` (already uses `@container`/`@md:` internally; verify it composes when nested in a constrained parent)
- [ ] Live Yahoo IMAP MCP assertion in `e2e/contact-form-yahoo.spec.ts` — currently the message-arrival check is gated behind `RUN_LIVE_EMAIL=1` and only attaches the expected subject; wire the actual MCP search once IMAP is reliably reachable from CI

## Done

### 2026-04 refinement sweep
- Mjølner Informatics added as current role; Netcompany ended Feb 2026; STIL Jun–Sep 2025 stint noted in summary
- Hero subtitle, experience heading "Five years across five companies", layout metadata description — all updated EN + DA
- Nav copy: "Writing" → "Posts and articles" (EN) / "Tekster" → "Indlæg og artikler" (DA); kicker matches; route stays `/writing`
- Theme dropdown localised via `next-intl`: `Schwarzgelb` → "Black & Yellow" (EN) / "Sort & Gul" (DA)
- Section tooltip: right-of-icon placement with `clamp(280px, 38vw, 480px)` width, `max-h-[6em]` shape, JS overflow-flip, `motion-reduce` respected
- EF monogram favicon (`src/app/icon.svg` + `apple-icon.svg`) — terracotta + cream serif
- Tech logos: filled xUnit / PHPUnit / Robot Framework (Simple Icons + xunit.net direct); added Selenium, RxJS, Redux, Next.js, Splunk
- Recommendations carousel — `src/components/recommendations-carousel.tsx`, `src/lib/recommendations.ts`, 4 letter MDX seeds, full ARIA carousel pattern with `auto`↔`manual` `aria-live` switch, hover/focus-within pause, swipe, reduced-motion → manual mode only, unit tests
- 5 photos copied from `D:\Portfolio` → `public/photos/` and integrated into `/personal` Cars + Travel sections
- Container queries — `Skills`, `StatsRow`, Experience timeline; documented split in `globals.css`
- Playwright mobile project (iPhone 14, Pixel 7) + `e2e/mobile-smoke.spec.ts` + `e2e/contact-form-yahoo.spec.ts` (live-email tier behind `RUN_LIVE_EMAIL=1`)
- Live community reading feed on `/writing` from dev.to (current-year filter, ISR 1h)
- Hero video-bg prototype (`?video=A` / `?video=B`) — code-only, no clips committed; tonal-gradient placeholder until env vars set

### Foundation
- Scaffold (Next.js 16, React 19, TS, Tailwind v4 CSS-first)
- Layout shell, header (locale toggle + theme toggle + palette dropdown), footer
- MDX content collections (writing, articles, recommends, travel, work)
- EN/DA bilingual via `next-intl`
- CV download (EN + DA)
- GitHub repo (private) + Vercel deploy + custom domain `eduardfischer.dev`
- `.devcontainer/` for Codespaces
- CI/CD: Vitest + Playwright + GitHub Actions

### Visual identity
- Three-palette switcher (schwarzgelb / mountain-navy / woodsy-cabin) × light/dark, dropdown in header, localStorage; **mountain-navy** is the first-visit default
- Hero portrait with transparent BG (background-removed via @imgly so it works across all themes)
- Vertical timeline for Experience with company links and clickable tech chips
- StatsRow under About
- Skills section with Devicon logos linking to official docs
- SectionHeading with hover-tooltip preview on 9 sections
- Design system documentation (`docs/design.md`)

### Content
- 4 case studies (`/work/{kombit-valg, sitaware, greenbyte-saas, boozt}`) — MDX-driven; SitaWare + Greenbyte from local archive, KOMBIT + Boozt placeholders pending Eduard interview
- Master's article summary — feral systems study (Dec 2022)
- Master's thesis summary — Conceptualization of an audit management system (LEGO Group case study, Dec 2023)
- Personal page — 3-section structured layout (Football / Cars / Travel) with single Schwarzgelb accent on the BVB heading
- Travel section with photo gallery, sample Pisa trip
- Tech-chip glossary on `/work` with GitHub feed filter wiring
- Content inventory (`docs/content-inventory.md`)

### GitHub & deploy
- 42 GitHub repo descriptions auto-filled via one-shot `scripts/sync-gh-descriptions.mjs` (CRA/Next template short-circuit, prepositional/numbered-fragment guards)
- GitHub profile README refreshed (links to eduardfischer.dev)
- Auto-deploy on push to `main` (Vercel)

## Conventions

- Branch per feature: `feat/<kebab-case>`. Land via PR; never push to `main` directly except for docs.
- Tests required for new components or non-trivial logic.
- All routes under `src/app/[locale]/`. Internal links via `Link` from `@/i18n/navigation`. External links via plain `<a>`.
- Tailwind v4 — tokens in `src/app/globals.css` `@theme` block; **no `tailwind.config.js`**.
- Commit messages: plain, descriptive, **no `Co-Authored-By` trailer ever**.
- Sub-agents: artefact production only. PO main thread does git + PR.
