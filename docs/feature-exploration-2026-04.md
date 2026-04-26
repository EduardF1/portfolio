# Feature exploration — April 2026

> **Senior Dev C, 2026-04-26.** Six new feature ideas grounded in the actual content + media archive surfaced this session (LinkedIn skill ledger, CV ledger DOCX, 215-photo EXIF catalogue across 20 countries). Cross-checked against `docs/backlog.md` and `docs/rnd-ideas.md` to avoid duplicates.
>
> **Tone constraints**: Janteloven-aware (per `docs/audience-benchmark.md`) — factual register over heroic, dated over dateless, "I worked on / I learned" over "I led / I revolutionised". Sized realistically for the team structure (PO + 2 senior devs + this analyst lane); S = ≤1 day inline, M = 1–3 days a senior dev, L = a multi-session epic.

## 1. "How I work" prose surface — methodologies as a paragraph, not chips *(S)*

**Scope**: Add a small "How I work" section under the Experience timeline (or as a sidebar on `/work`). 4–6 short factual sentences naming the methodologies Eduard has actually shipped under: Scrum, Kanban, FDD, CMMI/TMMI, LEAN, Clean Architecture, Agile in iterative master's-degree consultancy mode. No chips, no logos — pure copy. Tag each with the role / company that taught it ("Kanban — introduced at Boozt, 2021"; "FDD + LEAN + CMMI5 — Systematic, 2021").

**User value**: Closes the Section A.4 gap from `tech-pass-from-artefacts.md` without polluting the tech catalogue with methodology chips that read as buzzwordy in DK register. A Danish recruiter scanning the page learns *which methodology Eduard has lived inside, where, and when* in 30 seconds.

**Size**: S. Pure copy + a small `<aside>` block. ~2h including translation pair.
**Depends on**: nothing.

---

## 2. Per-trip travelogue collection populated from EXIF clusters *(M)*

**Scope**: Senior Dev A is independently building per-trip pages — this proposal is for the **content scaffolding** that makes their pipeline land cleanly. From `docs/trip-clusters.md` we have ~6 multi-photo, photo-rich trips that warrant standalone pages: 2026-03 Adriatic Loop (48 photos / 6 countries), 2025-04 Central-Europe loop (40 photos / 4 countries), 2025-09 Spain + Gibraltar (13 / 2), 2024-09 Albania (7), 2023-08 Romania Carpathians (12), 2023-07 Turkey Aegean (10), 2023-04 Milan (13), 2022-10 Hamburg + Munster (15). For each: a 200-word travelogue MDX with a 4–6-photo gallery and per-day route. Skip the noisy Denmark singletons — group them under a single `/travel/denmark` page.

**User value**: The current `/travel` page has 20 country markers but most lead to no story. Real photo trips with ~200-word context sit in the Danish-pleasant register — factual, dated, observational, not "10 amazing places."

**Size**: M. Each travelogue is ~30min of writing if Eduard provides a couple of memory anchors per trip (PO can pre-extract from the cluster table). 6–8 travelogues + scaffolding fits in 1–3 dev-days.
**Depends on**: Senior Dev A's per-trip page generation merging in (currently in flight on `feat/per-trip-travel-pages`); `docs/trip-clusters.md` (this PR).

---

## 3. `/timeline` deep-link experience — `?role=netcompany#stil-stint` *(S–M)*

**Scope**: The current Experience timeline on `src/app/[locale]/page.tsx` lists 5 roles, each with a free-text description. Add: (a) anchor IDs for each role (`#netcompany`, `#mjolner`, `#greenbyte`, etc.) so deep links land at the right card; (b) sub-anchors for sub-projects mentioned in the description (`#kombit-valg`, `#stil-stint`, `#sitaware-edge`); (c) optional `?role=netcompany` query param that scrolls + highlights the matched role on first paint. Add a "Copy link to this role" button next to each card title.

**User value**: When Eduard pastes "the relevant section of my CV" into a recruiter conversation he can send `eduardfischer.dev/?role=netcompany#stil-stint` instead of "scroll down past my main experience to the STIL bit." Saves both sides 20 seconds and demonstrates frontend craft.

**Size**: S–M. Anchor IDs + clipboard button is S (≤1 day). The query-param + highlight on paint is the rest.
**Depends on**: Section B action items from `tech-pass-from-artefacts.md` (the STIL stint, NCSCE, Advansor + Dansk Wilton sub-bullets need to exist in the timeline copy first for the deep links to point at something real).

---

## 4. `/research` micro-collection — surface the two unpublished academic articles *(M)*

**Scope**: The CV ledger (Aug 2022 – Jun 2023 master's period) lists two co-authored academic articles that don't currently exist on the site:

1. *"DevOps Implementation in an SME — An Empirical Study"* — research at Greenbyte, Feb–Jun 2023.
2. *"The Employee Knowledge Management Framework"* — research at LEGO Group, Aug 2022 – Jan 2023.

Surface both as 600–900-word MDX summaries under a new `/research` collection (or as a sub-tab under `/writing`). Each: abstract, methodology, key findings, "my contribution" paragraph (per the `feedback_audience_benchmark.md` constraints), link to the source paper if Eduard has a PDF. The existing master's-thesis MDX is the template.

**User value**: Three pieces of long-form research output is a credible scholarly signal for a Danish recruiter — closes the "but did you publish anything?" check that some larger Danish IT employers (Danske Bank Tech, Trifork, KMD R&D) implicitly run. Also gives the existing thesis MDX a sibling collection to live alongside.

**Size**: M. Schema + listing page (~3h dev) + Eduard providing prose for two articles. Honest constraint: Eduard has to write the abstracts; agent can scaffold.
**Depends on**: Eduard confirming whether either article is publicly published (DOI / arXiv / institutional repo). If not, the `/research` page is "research-in-progress" rather than "published research" — still valid, just framed differently.

---

## 5. EXIF-derived "Last seen in" footer line *(S)*

**Scope**: A single one-liner above the footer: *"Last seen in: Trieste, Italy — March 2026"* — automatically driven by the most-recent GPS-tagged photo in `scripts/photo-catalogue.json`. Updates whenever Eduard runs the EXIF catalogue script after a new trip. Localised: EN reads "Last seen in"; DA reads "Sidst set i".

**User value**: A quiet, dated, factual personality cue. Reads as observational ("I exist in the world and update this site"), not boastful. Fits Janteloven register because it's the data speaking, not Eduard. Small but distinctive — most personal sites don't do this.

**Size**: S. ~30min: read the catalogue at build time, sort by `takenAt`, render in `src/components/site-footer.tsx`. The `latestPhoto` field is already computed in `getTravelDestinations()` — extend that derivation to surface the country + city of the latest entry.
**Depends on**: nothing.

---

## 6. "Pre-tech career" honest disclosure block on `/my-story` *(S)*

**Scope**: When `/my-story` ships (per `docs/audience-benchmark.md` Decision 2), include a short factual paragraph naming the four pre-tech roles from LinkedIn: GLS goods receiver (Mar 2017 – Sep 2018, Kolding), eMAG call center (Sep 2016 – Jan 2017, Bucharest), LPP Reserved sales assistant (Apr–Sep 2016), Domisis Construct sales intern (Jul–Oct 2018), REITAN goods receiver (May 2019 – May 2021, Vejle, part-time during VIA studies). 3-4 sentences. No apology, no bragging — just "I paid for studies by working logistics and retail; that taught me about service and operations." Frames the tech career arc as a deliberate choice, not a birthright.

**User value**: Strong Janteloven-aligned signal — a Danish recruiter reads "this person was a forklift operator while studying" as a credible character mark, not a stigma. Reads as honest in DK register (where many engineers also worked stipend-supplementing jobs through uni). The current site has zero pre-tech surface; this gives the arc texture without putting it on the headline timeline.

**Size**: S. Pure copy. Lives inside `/my-story` page once the shell ships.
**Depends on**: `/my-story` page shell shipping (queued, recommended SHIP per audience benchmark).

---

## 7. "Trip companion" cross-reference between `/work` and `/travel` *(M)*

**Scope**: When a `/work` case study mentions a city or country (e.g. "Boozt — Malmö, Sweden", "LEGO thesis — Billund, Denmark", "Systematic — Aarhus, Denmark"), add a small inline reciprocal: a kicker beneath the case-study title reading "*Photos from this trip → /travel/sweden 2018-04*" if the EXIF catalogue has a matching cluster, or "*Where I lived — /travel/denmark*" for in-country roles. Symmetric: each `/travel/{country}` page surfaces "*Worked here on: [Boozt 2021–2022, LEGO master's 2023–2024]*" if applicable.

**User value**: Stitches the work and personal halves of the site together at a single inline level — currently they sit as parallel silos. Reads as "this person carries one life through both surfaces" which is the Danish ideal of work-life integration without pretence. Concrete: a recruiter reading the Boozt case study learns Eduard actually lived in Malmö (commute reality), not just "worked at Boozt remotely."

**Size**: M. Logic to match work-MDX `location` frontmatter against country clusters in the catalogue. Add `location: "Malmö, Sweden"` frontmatter to existing 4 work MDX files; surface kicker; mirror the lookup on `/travel/[country]` pages. ~1–2 dev-days.
**Depends on**: per-trip travel pages (idea #2) for the `/travel/{country}` surface to land on.

---

## Summary table

| # | Idea | Size | Depends on |
|---|---|---|---|
| 1 | "How I work" prose surface | S | — |
| 2 | Per-trip travelogue collection from EXIF clusters | M | Senior Dev A's `feat/per-trip-travel-pages`; `docs/trip-clusters.md` |
| 3 | `/timeline` deep-link experience (`?role=...`) | S–M | CV-ledger gap fixes from tech-pass Section B |
| 4 | `/research` micro-collection (DevOps + KM articles) | M | Eduard publication-status confirmation |
| 5 | EXIF-derived "Last seen in" footer line | S | — |
| 6 | Pre-tech career honest disclosure on `/my-story` | S | `/my-story` shell shipping |
| 7 | Trip-companion cross-ref between `/work` and `/travel` | M | per-trip pages (idea #2) |

## Top 3 recommendation

If PO needs to pull only three of these into the active queue:

1. **#5 EXIF "Last seen in" footer** — S, no dependencies, distinctive small detail, Janteloven-aligned. Ship within an hour.
2. **#1 "How I work" methodology paragraph** — S, no dependencies, closes the methodology gap from the tech pass without polluting `tech.ts`. Ship within a day.
3. **#3 `/timeline` deep-links** — once Section B action items from the tech pass land, this becomes the highest-leverage UX win for recruiter conversations: a single shareable URL per role.

Items #2, #4, #7 are the bigger M-sized bets and should move into the queue once #1, #3, #5 are out and Senior Dev A's per-trip pages are merged.
