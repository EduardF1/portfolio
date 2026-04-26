# Recruiter deep-dive — Danish + Scandinavian engineering market, April 2026

> **PO autonomous-mode R&D, 2026-04-26.** Builds on `docs/audience-benchmark.md` (which covered the `/blog` and `/my-story` decisions). This is the broader strategic picture: what Danish recruiters look for in a software-engineering portfolio in 2026, what the talent-market context looks like for Eduard specifically, and what concrete moves on `eduardfischer.dev` would convert recruiter scan-time into interviews.

## Sources cross-referenced (April 2026)

- Danish hiring market: [Workindenmark](https://www.workindenmark.dk), [Glassdoor Denmark SE jobs](https://www.glassdoor.com/Job/denmark-software-engineer-jobs-SRCH_IL.0,7_IN63_KO8,25.htm), [Edstellar 2026 in-demand skills](https://www.edstellar.com/blog/skills-in-demand-in-denmark), [it-jobs-dk salary guide](https://www.it-jobs-dk.com/software-engineer-salary-denmark/), [Nucamp top 10 DK startups](https://www.nucamp.co/blog/top-10-tech-startups-hiring-junior-developers-in-denmark-in-2026), [agency-partners.com market insights](https://agency-partners.com/reports/market-insights/denmark-software)
- Portfolio-strategy 2026: [DEV "Portfolio projects that get you hired in 2026"](https://dev.to/devraj_singh7/the-portfolio-projects-that-actually-get-you-hired-in-2026-1l0e), [Templyo 17 portfolio examples](https://templyo.io/blog/17-best-web-developer-portfolio-examples-for-2024), [byagentai 15 portfolios that got hired](https://byagentai.com/blog/software-engineer-portfolio-examples), [WahResume portfolio links 2026](https://www.wahresume.com/blog/revolutionize-your-resume-with-portfolio-links-a-2026-guide), [Coders Stop on Medium](https://medium.com/@coders.stop/building-a-developer-portfolio-that-gets-interviews-6b523901e89a)
- GitHub recruiter perspective: [Kula.ai "How to recruit on GitHub 2026"](https://www.kula.ai/blog/github-beginners-guide-source-candidates), [Rocket Recruiting GitHub guide](https://www.getrocket.com/post/github/)
- AI/LLM market: [Metaintro "Software engineer listings up 30% from AI demand"](https://www.metaintro.com/blog/software-engineer-job-listings-spike-2026-ai-demand), [Glassdoor Copenhagen AI engineer jobs](https://www.glassdoor.com/Job/copenhagen-ai-engineer-jobs-SRCH_IL.0,10_IC2218704_KO11,22.htm), [Wellfound Copenhagen AI engineer](https://wellfound.com/role/l/ai-engineer/copenhagen)
- HN signal: [Ask HN: Who is hiring? (April 2026)](https://news.ycombinator.com/item?id=47601859), [Ask HN: Who wants to be hired? (April 2026)](https://news.ycombinator.com/item?id=47601858)

## The market context Eduard is operating in

| Fact | Number / source | Implication for `eduardfischer.dev` |
|---|---|---|
| Engineer shortage in DK by 2026 | **13,500** projected (IDA) | Demand is real. Portfolio has leverage. |
| SE jobs in DK (2026 Q1) | ~4,760 over 3 months | Healthy active market. |
| Geographic split | Copenhagen **94%**, Aarhus **6%** | Aarhus base = smaller pond, less competition. Optionally signal openness to CPH commute / hybrid. |
| Median time-to-hire | **33 days** | Tight loop — once a recruiter clicks the site, decision happens within a month. Site must be production-ready, not "in progress". |
| Full-time share | **93%** of roles | Eduard's full-time framing is conventional and correct. |
| AI/LLM mention rate (junior listings, DK) | **32%** | Eduard's portfolio currently has **zero** AI/LLM content — biggest single gap. |
| Top Danish hirers | LEGO Group (30 open), Danfoss (30), Danske Bank (27), Trifork, KMD | Eduard already has LEGO master's-thesis content; could lean into. |
| Recruiter first-scan time | **<15-30 seconds** | Homepage must signal full picture in that window. |

## What Danish recruiters actually look for (synthesised from sources)

### The screening rubric (priority order)

1. **Geographic + visa fit** — Eduard's "Aarhus, Denmark" + EU citizen badge already nail this. ✓ Live.
2. **Tech stack match** — chip glossary + role tech arrays answer this in 5 seconds. ✓ Live.
3. **Verifiable proof** — GitHub link, **live demos**, contribution count.
   - **Eduard has GitHub link** ✓ but **no live demos** ✗ on `/work` case studies. Single biggest portfolio gap right now.
4. **Code quality** — recruiters click into 1-2 repos to scan style.
   - The portfolio repo IS the code-quality sample. The README + the actual TypeScript / a11y / test coverage tell that story. We're in good shape (74% statements, 95+ Lighthouse a11y).
5. **Project depth** — 3-5 case studies with **Problem → Approach → Process → Artifacts → Impact → Learnings** structure.
   - `/work/{slug}` MDX templates are this shape ✓ but content is largely placeholder (Eduard authoring KOMBIT VALG / SitaWare / Greenbyte / Boozt). **Filling these is high-leverage.**
6. **Clarity of role / contribution** — recruiters need to know what you specifically did.
   - This is the consistent miss in 2026 portfolio-mistakes lists. Eduard's case-study template has a "My contribution" placeholder; filling it converts.
7. **Personality + voice** — short, dated, calm. "About me" / blog / `/my-story`.
   - `/my-story`, `/now`, `/personal` shells exist ✓; `/writing` has dev.to + HN feeds + RSS ✓. Prose is the bottleneck.
8. **Network / community signal** — meetup talks, OSS contributions, conference attendance, Ask-HN posts.
   - No conference talks surfaced ✗. No public OSS contribution list ✗. Low-effort win: small "Community" footer block.

### What recruiters DON'T like (anti-patterns)

| Anti-pattern | Source | Eduard's site? |
|---|---|---|
| Polished output without showing process | DEV / Apollo Technical | ✓ Avoided — case-study template forces process surface. |
| Decorative animation / WebGL noise | Awwwards / Scandinavian-design articles | ✓ Avoided — restrained motion only, no Three.js (project rule). |
| "Award-winning", "industry-leading", "10× engineer" copy | Multiple Danish-recruiter pieces, Janteloven articles | ✓ Avoided — `audience-benchmark.md` constraints in place. |
| Slow load, large hero video that auto-plays | Lighthouse / 2026 portfolio articles | ✓ Avoided — hero video is opt-in via `?video=A/B`, off by default. Lighthouse perf 91-99. |
| Buried contact info / no clear next step | Multiple | ✓ Avoided — `/contact` route in nav, mailto on every footer, contact CTA on `/my-story`. |
| Photos of "tech-bro" lifestyle (whiteboard selfies, coffee+laptop) | Scandinavian-aesthetic guidance | ✓ Avoided — only authored content + travel photos exist. |
| **No live demos on case studies** | DEV / fantasticportfolios.com / Templyo | **✗ Active gap.** See action item below. |
| **No AI/LLM project surface** | Metaintro / multiple 2026 sources | **✗ Active gap.** See action item below. |

## Action items in priority order

### P0 — Highest leverage, shippable inline

1. **Add "Live system" buttons to `/work` case studies** *(S, ~30 min)*
   - For each public-facing system: KOMBIT VALG (kombit.dk/valg), UA.dk (ua.dk), Greenbyte Breeze (greenbyte.com/breeze), boozt.com, SitaWare (systematic.com SitaWare suite). Add a button like "Visit the live system →" with a small "(parts of which I built)" caveat where appropriate.
   - Where the system is internal (KOMBIT internals, Netcompany internal portals), add "Demo not public — see case study" without the button. Honest.
   - **Why it converts**: closes the 2026 #1 portfolio-mistake gap from every source. Recruiter clicks → sees real production system → mental model crystallises.

2. **Spin up ONE small AI/LLM personal project, link from `/work`** *(M, 1-2 days inline)*
   - The cheapest credible angle: extend the existing Cmd+K search (already FlexSearch, already shipped) with **semantic-similarity re-ranking** via OpenAI embeddings. ~80 lines of Node, costs cents per build.
   - OR: a small CLI tool published to npm — e.g., `linkedin-skills-to-portfolio` that takes a LinkedIn skills export PNG, OCRs, and returns a tech catalogue draft. Genuinely useful (Sr Dev C just did this manually) and ships as a public OSS contribution.
   - OR: an MCP server for searching Eduard's portfolio (the meta angle). Niche but technically distinctive.
   - **Why it converts**: 32% of DK 2026 junior listings explicitly mention AI/LLM. Recruiter checks "does this person have hands-on AI?" — currently the answer is "no." One small project flips that to "yes, here's the repo + post-mortem."
   - **Janteloven hedge**: frame as "what I learned" not "I shipped an AI system." Match the calm register.

3. **Fill the four `/work` case-study placeholders with the "My contribution" paragraph** *(S, content — Eduard does this)*
   - This is the single biggest content debt blocking the rubric. Even 3-4 sentences per case study unlocks the rest.

### P1 — Medium leverage

4. **Add an "OSS contributions" footer block on `/work`** *(S)*
   - 3-5 lines listing meaningful PRs to other people's repos. The Kula.ai / Rocket Recruiting articles confirm: recruiters specifically look for contributions to others' projects (not just own repos). If Eduard has even small PRs (typo fix, doc improvement, bug report) — surface them. If not, this becomes a gap to fill over time.

5. **List Danish networking presence** *(S)*
   - TechBBQ attendance, Copenhagen Tech Summit, GOTO conference (Aarhus's own), Aarhus.NET meetup, JavaForum Aarhus — even attendance is signal. A small "Community" line in the footer reading "Aarhus.NET · GOTO · TechBBQ" is enough.
   - GOTO is **literally in Aarhus** — strong local-context signal.

6. **Surface the two unpublished academic articles per Sr Dev C idea #4** *(M)*
   - "DevOps Implementation in an SME" (Greenbyte 2023) and "Employee Knowledge Management Framework" (LEGO 2022-2023). Even as 600-word abstracts on `/writing/articles/` they signal scholarly depth — closes the "but did you publish?" check that LEGO Tech / Trifork / KMD R&D / Danske Bank R&D quietly run.

7. **Sharpen the homepage hero kicker for the AI angle** *(S)*
   - Once #2 lands, update the hero subtitle or the About kicker to mention AI-augmented engineering practice (not "I do AI" — "I bring AI tools into the loop where they help"). Honest framing for a 32%-AI-mention market.

### P2 — Low leverage / steady-state

8. Conference-talk page (`/talks` or footer block) — empty unless Eduard has spoken or wants to.
9. Newsletter/RSS — RSS already shipped at `/writing/rss.xml`. No newsletter yet; not strictly needed.
10. Romanian (RO) locale — Eduard's native language. Genuine differentiator for the Romania-Denmark talent pipeline (a real recruiting niche). Already on backlog as future-feature.

## What is NOT a gap (don't waste cycles)

- **Hero video / animation**: Scandinavian aesthetic is restrained. Eduard's restraint is correct. Don't add three.js.
- **Long-form "About me"**: 2-paragraph About + dated `/now` + `/my-story` shell is the right depth. Don't expand to 10-section monolith.
- **Multiple themes / palettes**: already shipped (3 palettes × 2 themes). More options = analysis paralysis.
- **Skill-rating bars** ("80% TypeScript / 60% Python"): broadly mocked in 2025-2026 portfolio articles as fake-precise. Tech chips with usage history beat skill bars every time.

## Tone calibration cheat-sheet

When writing copy for any of the above, run it through these questions before shipping:

- ☐ Is it dated? ("Mar 2025") beats ("recently")
- ☐ Is it factual? ("PR #234 to maven-resolver, merged Jan 2024") beats ("contributed to OSS")
- ☐ Is the role explicit? ("I designed the schema and wrote the migrations") beats ("we built it")
- ☐ Is the metric concrete? ("47k unique elections handled") beats ("scaled massively")
- ☐ Could a Danish recruiter screenshot one paragraph and post it without it reading as bragging?

If three or more answers are "yes", ship it. If two or fewer, rewrite.

## Update to backlog

Once Eduard reviews this doc, the P0 items should land at the top of the queue:
- "Live system" buttons on `/work` case studies (PO inline, S)
- AI/LLM personal project (M, dispatch a senior dev or PO over a focused session)
- Eduard fills "My contribution" paragraphs in case studies (Eduard authors)

P1 items append to the existing future-features queue in `docs/backlog.md`.
