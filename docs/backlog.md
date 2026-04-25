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
| *(none)* | | | |

## Backlog — prioritized

### P0 — Eduard's wave-1 refinements (active sprint)

- [ ] **Default palette → Mountain Navy** — keep all 3 in dropdown, change first-visit default
- [ ] **Hero portrait** — `Profile_Image_2.jpg` to the right of the hero text on home (PO override of Designer's "no portrait" recommendation — Eduard explicitly wants it)
- [ ] **Vertical timeline for Experience** — points/dots on each role, line connecting them
- [ ] **Company links in Experience** — link company names to their websites (Netcompany, Greenbyte, Boozt, Systematic)
- [ ] **"My contribution" placeholder** in feral-systems article — Eduard fills in his actual contribution

### P1 — Eduard's wave-2 refinements

- [ ] **Section info tooltips** — hover on each section heading shows a short preview/explainer like professional sites do
- [ ] **Tech chip → glossary section + filter** — chips on Experience cards become clickable; clicking scrolls to a new "Technologies" section above "Open source & learning in public" showing a 1–2 sentence description of the tech, AND filters the GitHub feed below to repos in that language
- [ ] **Skills / Languages / Tools section** — proper grid with logos (Angular, .NET, Java, etc.) clickable to official docs. Sourced from CV + LinkedIn
- [ ] **Auto-generated GitHub repo descriptions** — for the ~50 repos with no description, scan READMEs / package.json and write short blurbs, then `gh repo edit` to set description on each (one-shot script; runs once)
- [ ] **Stats row** — years coding, languages, projects shipped, countries visited

### P2 — Content (needs Eduard input or domain-expert pass)

- [ ] Selected Work case studies — **KOMBIT VALG / Boozt** need 15-min Eduard interview each
- [ ] Selected Work case studies — **SitaWare / Greenbyte** writable from local archive (Domain Expert pass)
- [ ] Master's thesis summary (Bukowiecka_Fischer-Szava_Thesis.pdf) — replaces `devops-research.mdx` placeholder
- [ ] Real Italy 2023 trip on `/travel` (replaces Pisa sample)
- [ ] Personal page content — BVB / cars / travel deep dive (after Domain Expert audits `D:\Portfolio\poze\`)
- [ ] Recommendations seed entries — pending Eduard's reading list

### P3 — Architect / hardening

- [ ] Expand test coverage — writing pages, theme + palette switching, contact form server action
- [ ] sitemap.xml + robots.txt
- [ ] OG image generation (per-route social previews)
- [ ] GitHub profile bio fields (name/location/website) — needs `gh auth refresh -s user` or manual
- [ ] Branch protection rules (require CI before merge)

## Done

- Scaffold (Next.js 16, React 19, TS, Tailwind v4 CSS-first)
- Design system v1 (warm cream + terracotta) → replaced by 3-palette switcher
- Layout shell, header with locale toggle + theme toggle + palette dropdown, footer
- Home: hero, about, experience timeline, featured work tiles
- MDX content collections (writing, articles, recommends, travel)
- `/work` page with live filterable GitHub feed (73 repos)
- `/travel` route with photo-gallery component + Pisa sample
- Contact form (server action + Zod + Turnstile-ready + Resend-ready)
- EN/DA bilingual via `next-intl` (clean EN URLs, `/da/*` for Danish)
- CV download (EN + DA)
- GitHub repo (private) + Vercel deploy, auto-deploy on push to `main`
- Custom domain `eduardfischer.dev` (Cloudflare-registered, Vercel-served)
- GitHub profile README refreshed (links to `EduardFischer.dev`)
- `.devcontainer/` for Codespaces
- CI/CD: lint, typecheck, unit (Vitest), E2E (Playwright), build — green on `main`
- Palette switcher: 3 themes (schwarzgelb, mountain-navy, woodsy-cabin) × light/dark, dropdown in header, localStorage
- Design system documentation (`docs/design.md`)
- Content inventory from `D:\Portfolio` (`docs/content-inventory.md`)
- Master's article summary published (feral systems study)

## Conventions

- Branch per feature: `feat/<kebab-case>`. Land via PR, never push to `main` directly except for docs.
- Tests required for new components or non-trivial logic.
- All routes under `src/app/[locale]/`. Internal links via `Link` from `@/i18n/navigation`. External links via plain `<a>`.
- Tailwind v4 — tokens in `src/app/globals.css` `@theme` block; **no `tailwind.config.js`**.
- Commit messages: plain, descriptive, **no `Co-Authored-By` trailer ever**.
- Sub-agents: artefact production only. PO main thread does git + PR (subagent sandboxes block git).
