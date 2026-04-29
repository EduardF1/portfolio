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

## Archived / rejected

- **`feat/exif-last-seen-footer`** — Eduard rejected (V1 polish, 2026-04-26). Footer line "Last seen in: …" not shipping. Branch retained for later.

## Backlog — Eduard fills in (no agent action needed)

- [x] ~~**Hero About narrative** — replace placeholder paragraphs in About section with Eduard's actual narrative~~ (verified done 2026-04-28 by Round 5 audit — `messages/en.json` + `messages/da.json` `aboutP1`/`aboutP2`/`aboutP3Lead`/`aboutP3LinksHint` are all real prose)
- [x] ~~**"My contribution" sections** in feral-systems article + thesis summary — replace placeholders with Eduard's specific contribution to the co-authored work~~ (verified done 2026-04-28 by Round 5 audit — both `content/articles/digitalization-of-waste-collection-feral-systems.mdx` and `conceptualization-of-an-audit-management-system.mdx` carry filled `## My contribution` sections)
- [ ] **Real travel trips** — drop new `.mdx` files into `content/travel/` with frontmatter (location, date, photos). Sample Pisa trip stays as a template.
- [x] ~~**Personal page prose** — Football section still uses placeholder grid (BVB game shots TBD); Cars + Travel now have 5 photos from the archive with location-guess captions Eduard should correct.~~ (verified done 2026-04-28 by Round 5 audit — Football now renders `/photos/bvb-yellow-wall-suedtribuene.jpg` figure; placeholder grid is gone. Photo-location captions tracked separately below.)
- [ ] **Recommendations seed entries** — drop `.mdx` files into `content/recommends/` with reading list
- [ ] **Stats-row final numbers** — update years/projects/countries with Eduard's real numbers (current is approximate)
- [ ] **GitHub profile bio fields** (name/location/website) — manual at github.com/settings/profile, OR `gh auth refresh -s user` and the PO can do it via API
- [ ] **Hero video clip** — Eduard approves a Pexels/Coverr/Pixabay reuse-allowed candidate, then PO sets `NEXT_PUBLIC_HERO_VIDEO_MP4` / `…_WEBM` / `…_POSTER` in Vercel env. Compare `?video=A` (flanks) vs. `?video=B` (full-bleed) on the live preview; PO removes the loser.
- [ ] **Photo location captions** — alt text on `/personal` car + travel photos is marked "(location guess)". Replace with real locations.
- [x] ~~**Recommendations carousel — remaining LinkedIn recs** — only 2 of 10 LinkedIn recommendations are wired (Tobias Thisted, Nanna Dohn) plus 2 PDF letters (Niels Svinding/LEGO, Martin Hovbakke/STIL). Drop the other 8 LinkedIn rec quotes into `content/recommends/letters/*.mdx`.~~ (verified done 2026-04-28 by Round 5 audit — `content/recommends/letters/` now has 12 `.mdx` files: tobias-thisted, nanna-dohn, niels-svinding, martin-hovbakke-sorensen, plus claus-hougaard-hansen, daria-maria-pelle, fabian-stefan-bernhardt, jesper-hestkjaer, mathias-stochholm-waehrens, natali-munk-jakobsen, raitis-magone, stefan-daniel-horvath. All loaded by `src/lib/recommendations.ts`.)
- [ ] **Recommender LinkedIn URLs** — current `linkedinUrl` values fall back to LinkedIn search queries. Replace with the verified profile URLs once you've confirmed the right people.
- [ ] **Confirm Tobias Thisted's company** — currently set to Netcompany based on the recommendation date alignment; verify and correct if needed.

## Queue (open work, in arrival order)

> All open work lives here as a single ordered queue. New items go to the bottom (Eduard's request, PO addition, or Architect proposal — all queued the same way). Origin is tagged on each item.

### User requests

- [x] ~~**Tools and languages, deeper GitHub harvest** *(Eduard)*~~ — first pass: Node, Express, Python, Scala. Second pass via `gh repo list EduardF1 --limit 100`: Haskell, C++, Doctrine, Twig, Cucumber, Mongoose, Kubernetes, Terraform, Ansible. Cross-pass with LinkedIn screenshots + CV ledger still open as a separate backlog item below.
- [x] ~~**Experience timeline product links** *(Eduard)*~~ — shipped: ProductLink helper renders KOMBIT VALG, STIL, UA.dk, Greenbyte Breeze, boozt.com, SitaWare/Frontline/Edge as inline links inside each role's summary.
- [x] ~~**Travel page interactive Europe map** *(Eduard)*~~ — shipped at `/travel` (lightweight inline SVG, 20-country markers from the EXIF catalogue, click → scroll to per-country anchor). `/travel/culinary` cross-link sits below it.
- [x] ~~**Culinary section under /travel** *(Eduard)*~~ — shipped 2026-04-26 at `/travel/culinary` with two seed dishes; Eduard fills in real entries.
- [ ] **Visit-notification email** *(Eduard)* — opt-in per-day digest of unique visitors to fischer_eduard@yahoo.com via a Vercel cron job. Per-visit emails would spam; daily digest is the sane default. Approval needed before shipping.
- [ ] **Coverage threshold tightening** *(PO)* — coverage now collected and published as a 14-day CI artifact (`coverage/` upload from the validate job). Whole-codebase baseline at 2026-04-26: 36% stmts / 31% branches / 32% funcs / 35% lines (the lower numbers vs. the earlier 58% reading reflect a wider include scope: untested files now count). Thresholds intentionally NOT enforced yet. Re-enable once writing pages, theme provider, video-bg, travel-map, etc. have basic tests.
- [ ] **`/blog` appbar / nav cluster** *(Eduard)* — **benchmark complete; recommendation: SKIP.** See `docs/audience-benchmark.md` — a "Blog" parent over Personal/Travel/Recommends bundles items with no shared parent in Danish register, lands at the dropdown anti-pattern (3 items in a mobile collapsible), and trips a Janteloven cue ("I have so much content I need to organise it"). Recommended alternative: keep nav flat; if count must drop, demote `/recommends` to footer.
- [x] ~~**`/my-story` page** *(Eduard)* — **shell shipped 2026-04-26.** Layout at `src/app/[locale]/my-story/page.tsx` with 8 chapter slots (IBA → VIA → AU → Systematic → Boozt → Greenbyte → Netcompany → Mjølner), each with year-range eyebrow, place, heading, italicised placeholder body for Eduard's prose, optional "Took with me" line. Per-route OG + sitemap entry. Eduard fills prose chapter by chapter, following `docs/audience-benchmark.md` tone constraints.~~ (verified done 2026-04-28 by Round 5 audit — all 10 chapters in `src/app/[locale]/my-story/page.tsx` carry full prose bodies and "Took with me" takeaways; no italicised placeholders remain.)
- [x] ~~**Tech entries: LinkedIn screenshots + CV ledger pass** *(Eduard)*~~ — shipped 2026-04-26 in `feat/tech-additions-from-artefacts`. Sr Dev C analysed the 5 LinkedIn skills PNGs + CV ledger DOCX (via PowerShell on `word/document.xml`) and produced `docs/tech-pass-from-artefacts.md`. PO added all 22 chip-worthy techs (C, JavaScript, ASP.NET, EF Core, JBoss, Hibernate, Tomcat, JSP, JAX-RS/WS, Behat, Mockery, Guzzle, Lexik, Karma, Jasmine, Jest, Angular Material, Maven, Gradle, Bitbucket, Jira) to `src/lib/tech.ts` and wired the role chip arrays for Netcompany (+aspnet, ef-core, jboss, typescript, jquery), Boozt (+doctrine, behat, mockery, guzzle, phpunit), Systematic (+karma, jasmine, robot-framework). STIL stint detail expanded in Netcompany copy.

### Architect pass (optional hardening)

- [x] ~~Expand test coverage *(Architect)*~~ — shipped 2026-04-26 in `feat/test-coverage-expand` (merged `b23afe7`). 25 new test files + 4 expanded → 37 total, 236 tests passing. Coverage 33%→74% statements / 29%→67% branches / 30%→82% functions / 32%→74% lines. Includes carousel ARIA + section-heading + theme-provider + reading-feed (devto/hn/all) + writing pages + sitemap + RSS + sync-gh-descriptions guards.
- [x] ~~Branch protection rules *(Architect)*~~ — runbook at `docs/branch-protection-setup.md`; PO applies the gh-CLI / web-UI commands once this PR is merged.
- [x] ~~Performance audit *(Architect)*~~ — shipped 2026-04-26 in `docs/perf-audit-2026-04.md`. Average 97 perf / 95 a11y / 99 BP / 93 SEO across 8 routes. Three S-effort a11y fixes applied (foreground-subtle contrast bump across all 6 palette/theme combos; carousel link-in-text-block; travel-map nested-interactive). M/L items deferred — see doc.
- [x] ~~Container queries — `recommendations-carousel.tsx` *(Architect)*~~ — verified via `e2e/carousel-container-queries.spec.ts`: padding flips when the parent width changes, viewport stays fixed.
- [x] ~~Coverage threshold gate *(Architect)*~~ — `vitest.config.ts` enforces 60/55/65/60 (stmts/branches/funcs/lines), comfortably below the 63/57/69/63 baseline so a >5 pp drop fails CI.
- [x] ~~Lighthouse CI on PRs *(Architect)*~~ — `.github/workflows/lighthouse.yml` + `lighthouserc.json` with Perf>=85, A11y>=95, BP>=95, SEO>=95 budgets; `continue-on-error: true` initially so PRs aren't blocked while budgets settle.
- [x] ~~Bundle analyzer *(Architect)*~~ — `@next/bundle-analyzer` wired behind `ANALYZE=true npm run build`; off by default.
- [x] ~~axe-core a11y CI gate *(Architect)*~~ — `e2e/a11y.spec.ts` walks 8 routes; serious/critical fail the run, moderate/minor are advisory in the log.
- [ ] Live Yahoo IMAP MCP assertion in `e2e/contact-form-yahoo.spec.ts` *(Architect)* — currently the message-arrival check is gated behind `RUN_LIVE_EMAIL=1` and only attaches the expected subject; wire the actual MCP search once IMAP is reliably reachable from CI

### Round 5 follow-ups (2026-04-28)

> Discovered during the 15-agent Round 5 sprint. Each item references its origin agent under `scripts/.round5/` and is queued in arrival order at the bottom of this section.

- [ ] **BVB Playwright route mock** *(Architect)* — A12 flagged: nightly cross-platform matrix hits OpenLigaDB 9× per nightly. A17 added the mock fixture; verify it works after first nightly run.
- [ ] **Per-route OG images — verification** *(Architect)* — A16 added per-route OG for `/writing`, `/recommends`, `/travel`, `/my-story`. Verify they render in LinkedIn previews after merge.
- [ ] **Lightbox attribution UI — visual review** *(Architect)* — A18 wired stock-photo attribution; needs visual review at the lightbox to confirm legibility + aesthetic.
- [ ] **Stock-photo audit (~47 entries)** *(Eduard)* — A14 added Pexels/Unsplash/Pixabay photos to fill thin trip clusters. Eduard should glance through `docs/photo-attributions.md` and swap any photos that don't feel right.
- [ ] **Cross-platform first-nightly triage** *(Architect)* — A12's nightly workflow has `continue-on-error: true` while burning in. After 5 green nights, flip to `false`. Watch for Webkit/Firefox-specific failures.
- [ ] **Visual regression baselines for Playwright** *(Architect)* — A12's matrix runs but no screenshot baselines yet. Decide policy + commit baselines after design is stable.
- [ ] **Safari/Webkit CSS fixes** *(Architect)* — A22's audit punch list at `scripts/.round5/A22-safari-audit.md`. Apply fixes per priority.
- [ ] **Tablet + landscape layout fixes** *(Architect)* — A23's audit punch list at `scripts/.round5/A23-tablet-landscape-audit.md`. Apply fixes per priority.
- [ ] **Lightbox UI for stock photos: design review** *(Designer)* — A18's attribution caption needs design pass; subtle vs distracting tradeoff.
- [ ] **Prototype branch wiring (manual)** *(Eduard)* — see `docs/environments.md`. Create the `prototype` branch, assign `prototype.eduardfischer.dev` in Vercel, add `NEXT_PUBLIC_PROTO_*` envs scoped to Preview only.
- [ ] **Prototype-flag sweep cleanup** *(Architect, scheduled +2 weeks)* — see "Scheduled agents" below; opens a PR removing dead flags or promoting them to prod.
- [ ] **Visit-notification email cron** *(Eduard, design review)* — A20 wrote `docs/visit-notification-design.md` + flag-gated scaffold. Eduard reviews, picks SMTP provider, then ships.
- [ ] **Theme/palette analytics** *(Eduard, design review)* — A21 wrote `docs/palette-analytics-design.md` + flag-gated scaffold. Eduard reviews, then ships.

### PO + Architect future-features (also queued, at the bottom of the queue)

> Curated proposals, not committed. Each is sized for a single focused PR. Triage before pulling in. Same arrival-queue treatment as everything above: items move out of this section as they're worked, and new ideas append to the bottom of it.

- [x] ~~**Sitemap + robots.txt** *(Architect)*~~ — shipped: `src/app/sitemap.ts` covers both locales × all static + dynamic MDX routes. `src/app/robots.ts` points at the sitemap.
- [x] ~~**OG image generation** *(Architect)*~~ — shipped: root-level `src/app/opengraph-image.tsx` + `twitter-image.tsx` render a 1200×630 PNG via `next/og` at edge. Per-route OG images (e.g. `/work/[slug]/opengraph-image.tsx`) remain a follow-up if Eduard wants per-page covers.
- [x] ~~**RSS feed for Posts and articles** *(PO)*~~ — shipped at `/writing/rss.xml` via a Next 16 route handler. 1h CDN cache, posts + articles merged + sorted newest first.
- [x] ~~**Search across writing + work + recommends** *(PO)*~~ — shipped 2026-04-26 in `feat/site-search` (merged `26ae48e`). FlexSearch index built at request time per locale, served via `/api/search-index/[locale]`. `Cmd+K` (or `/`) opens an ARIA dialog palette with focus trap, arrow nav, and grouped results. Fallback `/search?q=` route for full results. EN-only MDX falls back gracefully on DA with `EN` badge. Includes 12 unit tests + 2 Playwright specs.
- [ ] **Per-trip travel pages with photo lightboxes** *(PO)* — once the EXIF catalogue lands, generate `/travel/{trip-slug}` from clusters of photos by date+location.
- [ ] **Travel map heatmap mode** *(PO)* — toggle on the Europe map between "destinations" (current) and "intensity" (number of trips per country with a chloropleth fill).
- [x] ~~**Reading-feed source rotation** *(PO)*~~ — shipped: dev.to / Hacker News / All-sources tabs on `/writing` via `?reading=devto|hn|all`. HN uses front-page top-stories (no per-topic filter). All-sources merges + sorts by date desc. ISR 1h on every fetch.
- [ ] **Theme/palette analytics** *(Architect)* — anonymous count of which palette × theme combination visitors prefer; helps decide the default. Vercel Analytics or a single `/api/track-palette` route.
- [ ] **Contact form anti-spam** *(Architect)* — switch the placeholder Cloudflare Turnstile to a live site key.
- [ ] **PDF resume regenerated from MDX** *(PO)* — single-source-of-truth: experience timeline → CV PDF via `react-pdf`. Avoids the "two CVs" drift.
- [ ] **Code-snippet syntax highlighting in MDX** *(PO)* — `rehype-pretty-code` + Shiki. Useful once Eduard publishes technical posts.
- [ ] **Analytics dashboard at `/admin/stats`** *(Architect)* — protected by simple shared-secret query string. Chart of unique visits, top pages, search queries. Visible only to Eduard.
- [ ] **Tech-chip → live repo demo link** *(PO)* — when a tech has open-source projects on Eduard's GitHub matching the chip's `ghLanguage`, show a tiny "demo" badge on the chip.
- [ ] **Internationalisation expansion** *(PO)* — Romanian (Eduard's native language) as a third locale once long-form copy is more stable.
- [ ] **Light-mode contrast pass** *(Architect)* — verify all three palettes hit WCAG AA on body text against the light theme; the Schwarzgelb/cream combo is borderline.
- [x] ~~**`/now` page** *(PO)*~~ — shipped 2026-04-26: Derek-Sivers-style shell at `/now` with Focus / Reading / Side bets / Lately sections, `LAST_UPDATED` constant, per-route OG (cocoa+amber gradient), sitemap entry. Eduard fills in real prose.
- [x] ~~**Per-route OG images for landing pages** *(PO)*~~ — shipped 2026-04-26: `/work` (dark navy + terracotta accent) and `/personal` (Schwarzgelb half-split). `/writing`, `/recommends`, `/travel`, `/travel/culinary` listings either inherit root or have their own card.
- [x] ~~**Styled 404 page** *(PO)*~~ — shipped 2026-04-26: `src/app/[locale]/not-found.tsx` with on-brand suggested-routes grid + contact CTA fallback.
- [ ] **Contact-form attachment support** *(PO)* — accept a CV / portfolio attachment and forward via Resend. Whitelist: PDF, JPEG, PNG, and Word (.doc + .docx); 4 MB form ceiling under the Vercel 4.5 MB body cap (5 MB Zod backstop). For recruiters with a brief CV or portfolio sample.
- [x] ~~**Honeypot field on contact form** *(Architect)*~~ — shipped: hidden `<input name="website">` off-screen with `tabIndex={-1}` + `aria-hidden`. Server action silently feigns `status: "ok"` when filled, so bots don't learn the trap.
- [ ] **Side-section videos** *(Eduard, prototype track)* — short looping videos rendered as bookend visuals on the long-form sections (About, /personal, /writing). Reuse-allowed sources (Pexels/Coverr/Pixabay) only. Behind `NEXT_PUBLIC_PROTO_SIDE_SECTION_VIDEOS=1`. Promote to prod once a winner is picked.
- [ ] **Hero video full-bleed variant** *(Eduard, prototype track)* — A/B against the current flanked variant. Behind `NEXT_PUBLIC_PROTO_VIDEO_BG_FULL_BLEED=1`. Existing `NEXT_PUBLIC_HERO_VIDEO_*` envs cover the asset; the prototype flag controls which layout renders.
- [ ] **Animated section dividers** *(PO, prototype track)* — subtle SVG / Lottie / CSS-only motion at section transitions. Behind `NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS=1`.
- [ ] **Scroll-driven backgrounds** *(PO, prototype track)* — CSS scroll-driven animations (only Chromium for now, Safari/Firefox fall back gracefully). Behind `NEXT_PUBLIC_PROTO_SCROLL_BG=1`.
- [ ] **Sticky parallax cards** *(PO, prototype track)* — recommend / case-study cards that pin briefly on scroll. Behind `NEXT_PUBLIC_PROTO_PARALLAX_CARDS=1`.

## Scheduled agents

- **Prototype-flag sweep + cleanup PR** — every 2 weeks, scan `prototype` branch for feature flags older than 2 weeks per the cleanup deadline in `docs/environments.md`. Open a PR removing dead flags or promoting them to prod. First run: 2 weeks after `prototype` branch is created.

## Process notes

- All new work — Eduard requests, PO additions, Architect proposals, future-features — is **queued at the END of the queue above** in arrival order. Nothing is silently inserted near the top, and there is no separate "ideas" silo: PO/Architect proposals sit in the same queue, just at the bottom (because they were proposed after Eduard's direct asks).
- Audience-facing copy ideas (sections, taglines, narrative arcs) are **benchmarked against Reddit + Danish-culture articles** before shipping, to verify they hit positively for the local audience.
- Round 5 (2026-04-28): 15-agent sprint — see `scripts/.round5/` for individual agent summaries.

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
