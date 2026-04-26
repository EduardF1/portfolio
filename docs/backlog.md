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
- [ ] **Personal page prose** — fill in placeholders in Football / Cars / Travel sections; add real photos
- [ ] **Recommendations seed entries** — drop `.mdx` files into `content/recommends/` with reading list
- [ ] **Stats-row final numbers** — update years/projects/countries with Eduard's real numbers (current is approximate)
- [ ] **GitHub profile bio fields** (name/location/website) — manual at github.com/settings/profile, OR `gh auth refresh -s user` and the PO can do it via API

## P3 — Architect pass (optional, post-launch)

- [ ] Expand test coverage — writing pages, theme + palette switching round-trips, contact form server action
- [ ] sitemap.xml + robots.txt
- [ ] OG image generation per route (social previews)
- [ ] Branch protection rules (require CI before merge)
- [ ] Performance audit — lighthouse, image-loading, font-loading

## Done

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
