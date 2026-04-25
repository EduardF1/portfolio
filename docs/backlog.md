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
| Structure | `/travel` section + photo gallery | (PO salvage) | PR [#2](https://github.com/EduardF1/portfolio/pull/2) |
| Design | Palette switcher (3 themes + dropdown, light default, localStorage) | Dev | `feat/palette-switcher` *(in progress)* |
| Design | Design system doc | Designer | `feat/design-system-doc` *(in progress)* |
| Content | Content inventory from `D:\Portfolio` + LinkedIn | Domain Expert | `feat/content-inventory` *(launching)* |

## Backlog — prioritized

### P0 (next up)

- [ ] **Lock palette decision** — after Eduard previews all three live, strip the other two and remove the dropdown. *(blocked on palette-switcher PR + Eduard's call)*

### P1 (soon)

- [ ] Hero photo placement on home (`Profile_Image_2.jpg`) *(blocked on palette decision)*
- [ ] Master's article summary (MOT Article) — summary, not full text *(blocked on content inventory)*
- [ ] Domain Expert recommendations triage *(blocked on inventory landing)*

### P2

- [ ] Selected Work case studies (KOMBIT VALG, SitaWare, Greenbyte SaaS+Flutter, Boozt) *(needs Eduard's narrative input)*
- [ ] "Working with" skills/competencies tile section
- [ ] At-a-glance stats row (years, languages, projects, countries)
- [ ] Personal page content (BVB, cars, travel deep dive)

### P3

- [ ] Recommendations seed entries (3–5 starter products/books)
- [ ] Architect pass: expand test coverage to writing pages, theme + palette switching
- [ ] Architect pass: sitemap.xml + robots.txt + OG image generation
- [ ] GitHub profile bio fields (name/location/website) — manual or `gh auth refresh -s user`

## Done

- Scaffold (Next.js 16, React 19, TS, Tailwind v4 CSS-first)
- Design system v1 (warm cream + terracotta — being replaced)
- Layout shell, header with locale toggle + theme toggle, footer
- Home: hero, about, experience timeline, featured work tiles
- MDX content collections (writing, articles, recommends, travel)
- `/work` page with live filterable GitHub feed (73 repos)
- Contact form (server action + Zod + Turnstile-ready + Resend-ready)
- EN/DA bilingual via `next-intl` (clean EN URLs, `/da/*` for Danish)
- CV download (EN + DA)
- GitHub repo + Vercel deploy, auto-deploy on push to `main`
- Custom domain `eduardfischer.dev` (Cloudflare-registered, Vercel-served)
- GitHub profile README refreshed
- `.devcontainer/` for Codespaces
- CI/CD: lint, typecheck, unit (Vitest), E2E (Playwright), build — green on `main`
- Repo private

## Conventions

- Branch per feature: `feat/<kebab-case>`. Land via PR, never push to `main` directly except for docs.
- Tests required for new components or non-trivial logic.
- All routes under `src/app/[locale]/`. Internal links via `Link` from `@/i18n/navigation`. External links via plain `<a>`.
- Tailwind v4 — tokens in `src/app/globals.css` `@theme` block; **no `tailwind.config.js`**.
- Commit messages: plain, descriptive, **no `Co-Authored-By` trailer ever**.
