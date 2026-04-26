# Future-features R&D, deep dive — 2026-04-26 evening

> **R&D analyst sub-agent, 2026-04-26 evening.** Builds on four prior strategy docs:
> `docs/audience-benchmark.md` (Janteloven tone constraints), `docs/recruiter-deep-dive-2026-04.md`
> (DK-recruiter market + AI/LLM gap), `docs/feature-exploration-2026-04.md` (Sr Dev C round 1, 7 ideas
> already proposed), and `docs/external-ssd-scout-2026-04.md` (`G:\` content opportunities).
> Methodology: cross-reference what's currently shipped (live site + git log + `src/` tree) against
> what those docs already cover, then propose ideas that **extend rather than duplicate**. Every idea
> below is grounded in Eduard's specific state: the 5-role timeline, the 215-photo EXIF catalogue,
> the four `/work` MDX case studies, the EU/Aarhus/Romanian-native context, the two unpublished
> academic articles, and the consultancy-client mix on the CV ledger. No fabrication: where Eduard's
> attendance/output at a specific event is uncertain, the idea is framed conditionally ("if Eduard
> has X, surface it" rather than "Eduard did X").

## What's already shipped (1-paragraph snapshot)

The site is live at [eduardfischer.dev](https://eduardfischer.dev) running Next.js 16 + React 19 +
Tailwind v4 on Vercel, EN/DA bilingual via `next-intl`. Major surfaces in place: home (hero +
About + StatsRow + Skills + Experience timeline with role anchors + How-I-work methodology
paragraphs + recommendations carousel), `/work` (4 case studies with "Visit live system" buttons),
`/writing` (posts + 2 academic articles + dev.to/HN reading feed + RSS + reading-time chips),
`/recommends` (4 letter MDX seeds), `/personal` (Football BVB factual paragraph + Cars + Travel
photos), `/travel` (interactive Europe map, 41 per-trip pages, culinary sub-route, 215-photo EXIF
catalogue across 20 countries), `/now`, `/my-story` (8-chapter shell with 5 chapters filled
including the pre-tech "Paying my own way" disclosure), `/contact` (with Yahoo IMAP + honeypot),
`/cv` (read-only PDF.js viewer), `/search` (FlexSearch + Cmd+K palette). Three-palette switcher
(Schwarzgelb / Mountain Navy / Woodsy Cabin) × light/dark, 60+ tech chips, JSON-LD Person+Website
schema, EXIF-derived "Last seen in" footer line, per-route OG images, sitemap + robots + RSS,
honeypot, axe-core a11y CI gate, Lighthouse CI budgets, coverage gate at 60/55/65/60.

## The thesis: where the portfolio sits today, where it could go next

The portfolio has matured past the "shell" phase and is firmly in the "credible production
artefact" register — the recruiter-deep-dive's P0 list (live-system buttons, AI/LLM gap, "My
contribution" paragraphs) is **half-closed** (live-system buttons shipped; AI/LLM still missing;
"My contribution" prose filled on KOMBIT + Boozt). The remaining gaps fall into three honest
categories. **First, depth**: the four case studies are templated but only two have rich prose;
the SitaWare and Greenbyte case studies still read closer to summaries than the
Problem→Approach→Process→Artifacts→Impact→Learnings shape Danish recruiters scan for. **Second,
strategic distinctiveness**: the site reads as "competent Danish-tech engineer" — the AI/LLM
gap, the absent OSS contribution surface, the missing conference / community signal, and the
unsurfaced academic publication track all leave easy points on the table. **Third, signal
maturation**: as the site fills with content, navigation, search, and quiet feedback loops
(analytics, write-once-publish-everywhere, automated freshness markers) become higher-leverage
than yet another page.

The strategic positioning argument is this: Eduard is currently visible to recruiters as a
multi-stack consultant-in-Aarhus with EU mobility — that's accurate but generic. The *underused*
edges are the ones that sit at the intersection of **identity + craft**: Romanian-native engineer
who built his Danish career through retail and logistics work first; multi-lingual practitioner
with measurable EXIF-traceable presence across 20 countries; co-author on two unpublished
academic articles bridging research and SMB practice; embedded/firmware experience from VIA SEP4
that's currently invisible. The next round of work should move the site from "competent" to
"specifically Eduard" — and the levers for that are mostly content surfacing and strategic
framing, not framework choices. A small, credible AI/LLM project closes the single largest market
gap; a `/photos` rotating gallery surfaces an asset most engineers don't have; a public `/research`
collection turns latent academic credit into legible signal. Each is independently shippable and
together they take the site from "good portfolio" to "specifically the portfolio of someone who
deserves a 30-minute screen call."

## Category A — Technical R&D (6 ideas)

### A1. Semantic-rerank layer over the FlexSearch palette *(M)*

**Scope**: The current Cmd+K palette uses FlexSearch lexical match. Add an opt-in
"semantic mode" that re-ranks the top-20 lexical candidates via a small embeddings model
(e.g., OpenAI `text-embedding-3-small` at build time, cached as a per-locale JSON). Embed
each indexed document once at build, embed the user's query at request time via a Vercel Edge
function, cosine-similarity-rank, return top 5. Add a small "Match: lexical | semantic" toggle
in the palette footer. **Value**: closes the recruiter-deep-dive AI/LLM gap as a working,
visible, opt-in feature on the live site. The recruiter mental model is "this engineer brings
LLM tools where they help, not as a costume" — exactly the calm framing the deep-dive flagged
for the DK market. **Depends on**: an `OPENAI_API_KEY` environment variable in Vercel; a build
step that emits `embeddings/{en,da}.json`. **Risk**: bill if the API costs spike on bot crawls;
mitigated by Edge-function rate-limit + 24h response cache. **Why differentiates Eduard**: most
DK personal-portfolios mention AI in the about copy; almost none ship a working LLM-augmented
feature. The portfolio repo becomes the demo.

### A2. Public MCP server for portfolio search *(M)*

**Scope**: A standalone MCP (Model Context Protocol) server published as `@eduardf1/portfolio-mcp`
on npm, exposing tools like `search_portfolio(query)`, `get_role(slug)`, `list_recent_writing()`.
Backed by the same FlexSearch index. Documented in a 600-word `/writing/articles/mcp-portfolio.mdx`
post explaining what MCP is, why a portfolio is a perfect 1-day project for it, and how recruiters
or other devs can run it. **Value**: ships an OSS package with measurable adoption signal (npm
downloads visible publicly) AND closes the AI gap with a meta angle that's genuinely interesting
to engineers. **Depends on**: the npm + GitHub publishing flow; a small Node CLI scaffold.
**Risk**: low audience adoption — niche. Mitigated by the writing post being valuable on its own
as an MCP intro. **Why differentiates Eduard**: very few portfolios ship a public MCP server. This
is exactly the "specifically Eduard" intersection of craft + AI + writing.

### A3. `scripts/photo-catalogue.json` schema upgrade + EXIF-MCP CLI *(S)*

**Scope**: The existing `scripts/build-photo-catalogue.mjs` script is private to the repo. Extract
the EXIF-extraction + GPS-clustering logic into a small standalone CLI tool published as
`exif-trip-clusters` on npm — takes a photos directory, returns a JSON catalogue with trip clusters
(date + GPS proximity) ready to feed into a portfolio. **Value**: a credible OSS contribution with
a real use-case (the portfolio is the reference implementation), low maintenance burden, easy to
explain in 2 sentences on `/work`. **Depends on**: nothing — the logic exists. **Risk**: minimal;
the script is already battle-tested on 215 real photos. **Why differentiates Eduard**: the
portfolio already has 215 EXIF-tagged photos as a substrate — most engineers wouldn't have the
test data to validate this, Eduard does. Closes both the OSS gap (recruiter-deep-dive P1 #4) and
half the AI/LLM credibility gap.

### A4. Edge-rendered case-study screenshot generator *(M)*

**Scope**: A Next.js Edge route at `/api/og/case-study/[slug]/screenshot.png` that fetches the
"Visit live system" URL, screenshots it via a headless Browserless / Playwright Edge service,
caches for 24h, and surfaces a small "How it looks today, [date]" preview at the top of each
`/work` case study. Replaces the current "trust me, click the link" with an actual visual
artefact. **Value**: solves the case-study credibility gap deeper than the current button — a
recruiter sees the live system without leaving the portfolio, and the date stamp signals the
site is alive. **Depends on**: a screenshot service (Browserless free tier, or a Cloudflare
Worker + `@cloudflare/puppeteer`). **Risk**: external service dependency + per-request cost;
mitigated by 24h cache. **Why differentiates Eduard**: the four `/work` slugs all have public
URLs (KOMBIT VALG, Boozt, UA.dk, Greenbyte), so the screenshot story actually works. Almost no
engineer-portfolio does this, even though it's the most legible artefact possible.

### A5. Anonymous palette-preference + dark-mode telemetry on `/admin/stats` *(M)*

**Scope**: Already on backlog as P1 architect work but un-scoped. Concrete proposal: a single
beacon endpoint at `/api/track-prefs` that accepts `{palette, theme, locale}` (no user identifier,
no IP storage, no cookies — just a counter increment in Vercel KV), and a private
`/admin/stats?key={shared-secret}` page that renders three pie charts. **Value**: lets Eduard
make data-driven palette decisions (which combo do visitors actually prefer? does DA traffic land
on Mountain Navy more than Woodsy Cabin?), closes the analytics gap without GDPR baggage.
**Depends on**: Vercel KV; a `STATS_SECRET` env var. **Risk**: looks like analytics, so
benchmark the GDPR copy carefully ("aggregate counters only, no personal data, no cookies, no IP
log") and surface a `/privacy` page. **Why differentiates Eduard**: most personal portfolios have
either no analytics (lazy) or full Vercel/GA4 (cookie banners, GDPR friction). Self-hosted
counter-only telemetry is the rare honest middle and lands well in DK register.

### A6. Static-CMS layer (Decap CMS) for prose-heavy collections *(L)*

**Scope**: Wire Decap CMS (or Tina) to `content/writing/`, `content/recommends/`,
`content/travel/` so Eduard can edit prose from a `/admin` route without git. Auth via GitHub
OAuth (`netlify-cms-oauth-provider` or Vercel-native equivalent), commits go through a PR. Editor
preview reflects the live MDX. **Value**: removes the "I have to push a commit to fix a typo"
friction — currently a real blocker on the `/now` and `/my-story` prose-fill items. Eduard owns
the keyboard at the moment of writing. **Depends on**: GitHub OAuth app; Decap config; a
`content/{collection}/admin.json` schema per collection. **Risk**: Decap is in maintenance mode
(Netlify-original); Tina is more actively maintained but has a hosted-tier monetisation arc.
Pick Tina, accept the dependency. **Why differentiates Eduard**: less about differentiation, more
about removing friction so Eduard's prose-fill backlog (currently 4 items in `docs/backlog.md`)
actually lands.

## Category B — UX / Content R&D (6 ideas)

### B1. `/photos` rotating-gallery surface — the 215-photo asset out of `/personal` *(S–M)*

**Scope**: Currently the 215-photo EXIF catalogue is fragmented across `/travel/[country]` (per-
trip pages) and `/personal` (Cars + Travel sub-grids). Add a top-level `/photos` route that
renders a rotating Pinterest-style masonry of ~30 photos at a time, deterministically selected
from the catalogue (seed = current week-of-year, so it changes weekly without being random).
Photos link back to the originating per-trip page. EXIF data (camera, lens, location, date)
shown on hover. **Value**: surfaces an asset most engineer-portfolios don't have, and reframes
the photos from "personal" (slightly self-indulgent in DK register) to "geographic record"
(observational, factual). **Depends on**: existing `scripts/photo-catalogue.json`. **Risk**:
Janteloven cue — a "look at all my travel" page can read as boasting. Mitigated by tone:
heading reads "Recent geography" not "My travels"; sub-line is dated and observational ("215
GPS-tagged shots, 20 countries, last updated April 2026").

### B2. `/talks` shell — empty until Eduard speaks at something *(S)*

**Scope**: A `/talks` route that lists conference/meetup talks Eduard has given. Shipped as an
empty shell that says "Currently planning my first community talk for 2026 — once I've spoken,
slides and recordings will live here." Plus a small footer block listing communities Eduard
**attends if he does** (Aarhus.NET, JavaForum Aarhus, GOTO Aarhus, IDA, dansk.it). **Value**: a
forward-looking commitment that a recruiter reads as "this person is investing in community
visibility" — even before the first talk. **Depends on**: Eduard confirming which communities he
actually attends (not fabricated). **Risk**: empty pages can read as aspirational filler;
mitigated by a single calm sentence framing it as "in progress." **Why differentiates Eduard**:
the recruiter-deep-dive flagged "no community signal" as a P1. Even shell-state shipping signals
intent; deferring it leaves the slot empty.

### B3. Inline EN↔DA toggle on long-form posts *(S)*

**Scope**: When a `/writing/{slug}` MDX exists in both EN and DA, surface a tiny mono "EN | DA"
toggle at the top of the article body (not in the global header — that's already there).
Switching mid-article preserves scroll position via the article's heading slug. **Value**:
the global locale toggle is in the header, but mid-essay readers don't want to lose context.
This makes the bilingual story tactile rather than infrastructural. **Depends on**: nothing —
the routing already supports both locales. **Risk**: low. **Why differentiates Eduard**: most
EN/DA bilingual portfolios just have a header toggle. Inline mid-article toggle reads as
"this person actually thought about bilingual reading flow."

### B4. Snapshot diary on `/now` — auto-archive of last-month's `/now` *(S)*

**Scope**: When Eduard updates `/now`, auto-snapshot the previous version into `/now/archive/2026-
04.mdx`. Surface as a small "Previous snapshots" index at the bottom of `/now`. **Value**: turns
the `/now` page from a mutable single-state into a quiet diary — recruiters can see what Eduard
was focused on six months ago, which signals consistency / non-bullshitting better than any
self-description. The archive is generated, not curated. **Depends on**: a
`scripts/snapshot-now.mjs` script run pre-deploy. **Risk**: low. **Why differentiates Eduard**:
the `/now` movement (Derek Sivers) is well-known; the snapshot-archive variant is much rarer and
adds a temporal dimension that reads as honest in DK register.

### B5. `/work` filter chips by stack *(S)*

**Scope**: On `/work` listing, show clickable chips at the top: ".NET | Java | PHP | TypeScript |
Angular | React". Click filters the case-study list to the matching slugs. Already has the
tech-chip system in `src/lib/tech.ts` — wire the filter. **Value**: a recruiter searching
for a specific stack match gets there in one click, instead of skimming all four cases. The
filter state lives in URL params (`/work?stack=dotnet`) so it's shareable. **Depends on**:
nothing — the data model exists. **Risk**: minimal. **Why differentiates Eduard**: most
portfolios make the recruiter search; this makes the recruiter filter. Saves 30 seconds per scan.

### B6. Empty-state polish across stub collections *(S)*

**Scope**: `/recommends` (4 letters), `/writing` (1 post + 2 articles + 1 reading-feed),
`/travel/culinary` (2 dishes) currently look thin. Don't fake content; make the empty states
honest and inviting: "I write 4-6 essays a year and only when I have something to say. The next
one is drafting; here's what's coming up if you're curious." **Value**: turns a thinness signal
into a deliberateness signal. Janteloven-aligned: "I produce when I have something" reads
calm, not lazy. **Depends on**: nothing. **Risk**: minimal — pure copy. **Why differentiates
Eduard**: most thin-content portfolios just look unfinished; framing the thinness deliberately
is the rare upgrade.

## Category C — Strategic positioning R&D (4 ideas)

### C1. Romanian (RO) locale — Romania→Denmark talent-pipeline angle *(M)*

**Scope**: Already on backlog. Concrete framing: ship `ro` as a third locale via `next-intl`,
landing Eduard in the small-but-real Romania→Denmark talent pipeline (~3,000 Romanian engineers
in DK as of 2024 per ANSE, growing). Translate the home page, `/about`, `/now`, `/contact`, and
`/my-story` first; defer the long-form `/work` MDX (those stay EN+DA). Surface a small flag
on the locale switcher only when on the RO route — keeps EN/DA traffic uncluttered. **Value**:
zero competing portfolios are RO-trilingual. Strong differentiator for the Romanian-native
recruiter-pipeline angle (some DK consultancies — Trifork, KMD, Netcompany — do Romania-side
hiring). **Risk**: copy maintenance triples. Mitigated by limiting RO to evergreen pages
(About / `/now` / `/my-story` / `/contact`), not the rotating writing collection. **Why
differentiates Eduard**: this is **the** "specifically Eduard" lever — Romanian-native is rare
in DK tech, and surfacing it confidently bridges a recruiting gap most candidates ignore.

### C2. Public-sector / govtech specialism positioning *(S)*

**Scope**: Eduard's CV has unusually deep Danish-public-sector exposure: KOMBIT VALG (Danish
elections), STIL (Ministry of Education / Uddannelse.dk), KMT, NCSCE — a four-system run inside
Netcompany. Lean into this on the home About: a single line reading "Five years across five
companies, including a four-system rotation across Danish public-sector platforms (KOMBIT VALG
elections, STIL education, KMT, NCSCE)." **Value**: closes a positioning gap — public-sector
work is *valuable* on the DK market (KMD, Netcompany, Trifork, Schultz, Bankdata, KOMBIT itself
all hire for it) but is currently buried inside the Netcompany role description. **Risk**: NDA-
sensitivity around what's said about each system. Mitigated by sticking to the public-facing
product-name + sector ("elections", "education") rather than internal details. **Why
differentiates Eduard**: the public-sector specialism is rare and hard-to-fake. Most engineers
have private-sector experience; the public-sector run is a credible niche.

### C3. Embedded / firmware retro-surface — VIA SEP4 IoT case study *(M)*

**Scope**: From the `G:\Dev\SEP4_IoT` family of folders (per `docs/external-ssd-scout-2026-04.md`),
write a 600-word `/work/sep4-iot.mdx` case study summarising the bachelor SEP4 IoT project (FreeRTOS
+ Atmel Studio + AVR), Eduard's role, what shipped. Don't pretend it's recent; frame as "VIA
bachelor capstone, 2018, what taught me C and embedded thinking." **Value**: opens the door to the
DK IoT/embedded sector (Grundfos, Velux, Universal Robots, Demant, Coloplast, Kamstrup) — currently
zero embedded surface on the portfolio. **Depends on**: Eduard providing the canonical project
description from `G:\Dev\SEP4_IoT`. **Risk**: dating to 2018 could read as stale; mitigated by
explicit framing ("bachelor-era, the foundation that taught me C and embedded thinking"). **Why
differentiates Eduard**: most engineer-portfolios omit the bachelor projects; explicit retro
framing turns a stale fact into a deliberate breadth signal.

### C4. AI-augmented engineering as a stated *practice*, not a costume *(S)*

**Scope**: Once A1 or A2 ships, add a single short paragraph to the `/now` page or the home About:
"I bring AI tools into my workflow where they reduce time-to-correctness — search reranking on this
site uses embeddings; my MCP server ([link]) makes the portfolio queryable to LLM clients; I'm
sceptical of AI productivity claims I can't measure on my own work. I write about what I learn at
[link]." **Value**: differentiates the AI signal from the LinkedIn-default ("I love AI!") — Eduard
states what he ships, what he's sceptical of, and links to evidence. Reads as honest engineer, not
hype. **Risk**: requires A1/A2 to ship first or the paragraph is empty. **Why differentiates
Eduard**: the recruiter-deep-dive flagged "32% of DK 2026 listings mention AI" — most portfolios
respond with vague enthusiasm; this responds with shipped artefacts + measured scepticism, which
is the rarer and stronger signal in DK register.

## Category D — Long-term epics (3 ideas)

### D1. Federated visit-tracking with opt-in personalisation *(L, ~2 weeks)*

**Scope**: Build a small "sign in to bookmark" feature for repeat visitors — a recruiter who's
returned 3 times can opt into a "what's new since your last visit?" digest on landing. Auth via
GitHub OAuth (zero PII storage beyond the GitHub username + last-visit timestamp). On return,
the homepage surfaces a "Hi {handle} — since you last visited (Apr 12), I shipped X, Y, Z" badge.
**Value**: turns the site into a relationship surface for recurring recruiters. The DK
recruiter-deep-dive flagged 33-day median time-to-hire — a recruiter often visits 2-3 times during
a process; making the second visit feel personalised converts. **Depends on**: GitHub OAuth app;
a Vercel KV store for `{username, lastVisit}` records; a changelog-since-{date} renderer.
**Risk**: GDPR boundaries (storing GitHub username = personal data). Mitigated by explicit
opt-in + 90-day TTL on the record + a `/forget-me` route. **Why differentiates Eduard**: very
few personal sites do this. The "what's new since" framing is a calm, factual, non-promotional
way to make recurrence feel cared-for.

### D2. Full audit/QA layer — visual regression + content-freshness CI *(L, ~10 days)*

**Scope**: Three-tier hardening: (1) Percy / Chromatic / Playwright visual-regression on the
4 most-trafficked routes (`/`, `/work`, `/writing`, `/contact`), failing PRs that change pixel
output without intent; (2) a content-freshness check that flags `/now`, `/my-story`, `/recommends`
if their `LAST_UPDATED` constant is more than 90 days stale; (3) a broken-link checker (linkinator)
on the live site, run nightly via GitHub Actions, alerting via the existing Yahoo-IMAP MCP if
anything 404s. **Value**: turns the portfolio into a self-monitoring artefact — important because
when Eduard's job-search heat is highest, he can't be manually QA'ing. **Depends on**:
Playwright (already installed) + a visual-snapshot service. **Risk**: maintenance overhead on
flaky snapshots. Mitigated by snapshot-only-the-stable-routes scope. **Why differentiates
Eduard**: signals operational maturity. A recruiter who somehow notices "this person nightly-
audits their own portfolio" reads it as "this is how they think about production systems."

### D3. `/research` collection + custom academic-CMS for long-form *(L, ~8-10 days)*

**Scope**: Per `docs/feature-exploration-2026-04.md` idea #4, surface the two unpublished academic
articles ("DevOps Implementation in an SME — An Empirical Study" + "The Employee Knowledge
Management Framework") as MDX summaries under a new `/research` collection. Layered on top: a
small academic-paper renderer with footnotes, citation rendering (BibTeX → links), figure
captions, methodology side-rail. Doubles as the long-form layout for any future paper Eduard
writes. **Value**: closes the "but did you publish?" check that LEGO Tech / Trifork / KMD R&D /
Danske Bank R&D quietly run; turns latent academic credit into legible signal. **Depends on**:
Eduard providing 600-900 word abstracts per article + a publication-status confirmation
(institutional repo? DOI? unpublished?). **Risk**: requires Eduard's writing time. **Why
differentiates Eduard**: three pieces of long-form research output (Master's thesis already on
site + these two) is a credible scholarly signal that a typical engineer-portfolio doesn't
have access to. The scholarly framing alone reads strong in DK register.

## What NOT to build (calibration)

- **A "Hire me" hero CTA / ribbon banner.** Janteloven-aversive — the existing "Available
  for new opportunities" hero kicker + `/contact` route is already the right depth. Anything
  louder reads as US-LinkedIn-speak.
- **A blog/RSS subscription pop-up.** Personal sites that pop up "subscribe to my newsletter"
  on first visit are uniformly mocked in 2026 portfolio articles. RSS feed exists at
  `/writing/rss.xml` for the 5% of readers who want it; that's enough.
- **Skill-rating bars / level-meters.** Already flagged in the recruiter-deep-dive. Tech chips
  with usage history beat fake-precise percentages every time.
- **A Twitter / X feed embed.** Eduard's professional surface is portfolio + LinkedIn + GitHub.
  Adding a third real-time social feed adds maintenance burden + noise without signal.
- **A live-chat widget (Intercom / Crisp).** The portfolio is a calm, considered surface; live
  chat is the opposite tone. Email + contact form is the right depth for DK register.
- **Generative AI hero (talking-head video, AI avatar, LLM-greeted-you-by-name).** Reads as
  novelty-for-novelty's-sake — exactly the AI-as-costume framing the recruiter-deep-dive
  warned against.
- **A `/projects` numerical sidebar (47 commits this week / 1,200 lines this month).** Janteloven
  cue, fake-precise. The StatsRow under About is the right depth (5 years, 5 companies,
  20 countries) — one tier of metrics, not a vanity dashboard.
- **A heavy 3D/WebGL hero.** Already correctly avoided per project rule. Don't reintroduce.
- **Multiple hero variants A/B/C/D.** The current `?video=A` / `?video=B` is enough; more
  variants is analysis paralysis.
- **A "praise wall" / testimonials carousel that scrolls infinitely.** The recommendations
  carousel exists with 2-of-10 letters wired; finishing the wired set is the right move,
  not adding a separate "wall of praise."
- **Crypto / Web3 surface.** Out of register for the DK market and out of Eduard's stated stack.

## Prioritisation matrix

| # | Idea | Cat | Size | Value | Risk | Recommended order |
|---|---|---|---|---|---|---|
| 1 | A1 Semantic search rerank | A | M | High | Medium | **1** |
| 2 | C2 Public-sector positioning line | C | S | High | Low | **2** |
| 3 | B1 `/photos` rotating gallery | B | S–M | High | Low | **3** |
| 4 | A3 EXIF-CLI as OSS package | A | S | High | Low | 4 |
| 5 | B5 `/work` filter chips | B | S | Medium | Low | 5 |
| 6 | C1 Romanian (RO) locale | C | M | High | Medium | 6 |
| 7 | A2 MCP server for portfolio | A | M | Medium | Low | 7 |
| 8 | C3 SEP4 IoT case study | C | M | Medium | Low | 8 |
| 9 | B4 `/now` snapshot archive | B | S | Medium | Low | 9 |
| 10 | A5 Anonymous palette telemetry | A | M | Medium | Low (post-GDPR copy) | 10 |
| 11 | B3 Inline EN↔DA toggle | B | S | Low–Med | Low | 11 |
| 12 | C4 AI-as-practice paragraph | C | S | Medium | Low (post-A1/A2) | 12 |
| 13 | B6 Empty-state polish | B | S | Low–Med | Low | 13 |
| 14 | B2 `/talks` shell | B | S | Medium | Low | 14 |
| 15 | A4 Edge screenshot generator | A | M | Medium | Medium | 15 |
| 16 | A6 Decap/Tina static CMS | A | L | Medium | Medium | 16 |
| 17 | D1 Federated visit-tracking | D | L | Medium | Medium (GDPR) | 17 |
| 18 | D2 Full audit/QA layer | D | L | Medium | Low | 18 |
| 19 | D3 `/research` + academic CMS | D | L | High | Medium (Eduard writing time) | 19 |

19 ideas total: Category A (technical) = 6, Category B (UX/content) = 6, Category C (strategic) = 4,
Category D (long-term epics) = 3.

## Concrete next-3-actions for the morning

These are three things Eduard could greenlight on his next coffee, each independently shippable
this week, in PO + senior-dev cadence:

1. **Greenlight A1 (semantic search rerank).** Highest single-action AI/LLM gap-closer per the
   recruiter-deep-dive. Decision needed: (a) OpenAI vs. open-source local model (Eduard's
   preference on cost vs. control), (b) whether the toggle defaults to `lexical` or `semantic`
   on first paint. Once decided, PO can spec a 1-day implementation for a senior dev.

2. **Greenlight C2 (public-sector positioning line in the home About).** Smallest possible win
   — it's a single sentence in the About copy. Decision needed: Eduard confirms the four
   public-sector platforms he's comfortable naming (KOMBIT VALG / STIL / KMT / NCSCE) and
   approves the framing. PO can ship inline within 30 min.

3. **Greenlight B1 (`/photos` rotating gallery) + tone-check the heading.** Asset already
   exists (215 GPS-tagged photos). Decision needed: Eduard signs off on a Janteloven-safe
   heading ("Recent geography" or similar — not "My travels"). PO can spec for a senior dev
   over a half-day; ship by end of week.

If only one of the three lands, **#2 (public-sector positioning line)** is the highest-
ROI-per-minute single sentence on the entire portfolio right now — it surfaces a real specialism
that's currently buried inside the Netcompany role description, costs no engineering time, and
opens the door to KMD / Schultz / Bankdata / Trifork-style govtech recruiters who currently
read the home page as "generic Aarhus consultant."
