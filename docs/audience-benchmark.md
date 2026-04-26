# Audience benchmark — `/blog` cluster + `/my-story` page

> Per `feedback_audience_benchmark.md`: audience-facing nav/narrative changes are benchmarked against Reddit + Danish-culture portfolio articles before shipping. This doc captures the benchmark for two queued items so the build decision is informed when Eduard says go.
>
> **Audience**: primarily Danish + Scandinavian recruiters and engineers; secondarily EU-wide tech and the wider international web.

## Benchmark sources consulted (April 2026)

- Janteloven discussions: HN ([Law of Jante thread](https://news.ycombinator.com/item?id=15373068)), [Working with Norwegians](https://workingwithnorwegians.com/the-law-of-jante-janteloven), [Exploring Denmark](https://www.exploringdenmark.com/guide-to-denmarks-janteloven/), [B2B Export Services](https://b2bexportservices.com/the-law-of-jante-in-scandinavian-business/), [StarAvis 2025 piece](https://www.staravis.com/en/2025/10/27/janteloven-the-law-of-jante/), [BeBeez "Where's our Lovable?"](https://bebeez.eu/2025/08/10/danish-founders-ask-wheres-our-lovable/)
- Nav design 2026: [Eleken dropdown UI](https://www.eleken.co/blog-posts/dropdown-menu-ui), [Navbar Gallery types](https://www.navbar.gallery/blog/website-navigation-bars-types), [Justinmind navigation patterns](https://www.justinmind.com/blog/navigation-design-almost-everything-you-need-to-know/)
- Portfolio narrative arcs: [Jake Knapp on Medium "one awesome story"](https://jakek.medium.com/build-your-design-portfolio-around-one-and-only-one-awesome-story-d3995f74cf47), [Dribbble storytelling in design portfolios](https://dribbble.com/stories/2024/03/18/crafting-a-narrative-mastering-storytelling-in-your-design-portfolio), [DEV "Anthology of a Creative Developer 2026"](https://dev.to/nk2552003/the-anthology-of-a-creative-developer-a-2026-portfolio-56jp)
- Scandinavian aesthetic + tone: [Muz.li top 100 portfolios 2026](https://muz.li/blog/top-100-most-creative-and-unique-portfolio-websites-of-2025/), [Bricxlabs Scandinavian agencies April 2026](https://bricxlabs.com/ux-agencies/web-design-agencies-for-scandinavian-startups), [Canva Scandinavian design](https://www.canva.com/learn/scandinavian-design/)
- Danish CV / personal-website expectations: [WorkInDenmark CV guide](https://www.workindenmark.dk/job-search-in-denmark/your-cv), [WorkInDenmark do's and don'ts](https://www.workindenmark.dk/job-search-in-denmark/your-cv/a-good-personal-profile/do-s-and-don-ts), [VisualCV Denmark format](https://www.visualcv.com/international/denmark-cv/)

## Synthesis: what the audience expects

1. **Substance over decoration.** Danish recruiters explicitly look for "clarity over visual design," scannable layout, reverse-chronological honesty. Showy navigation reads as foreign; clean-and-flat reads as professional.
2. **Janteloven still bites — quietly.** Even the 2025 countermovement framing ("reclaiming individuality") explicitly admits the cultural baseline: don't talk yourself up. Acceptable self-presentation is *what I did, dated, factual*. Unacceptable is *how I changed the field*.
3. **Mobile-first nav ergonomics.** 2026 dropdown-UX consensus: avoid dropdowns for 2–3 items, cap top-level at 5–7, never nest deep on mobile.
4. **Storytelling is creeping in** — even for engineers, narrative arcs in portfolios are trending in 2026. But the arcs that land are factual, chronological, decision-anchored — not heroic.

## Decision 1: `/blog` nav cluster (group Personal/Travel/Recommends under "Blog")

**Recommendation: don't ship the dropdown. Keep nav flat.**

Reasons:

- **Top-level count already at the comfortable max.** Current: Home, Work, Writing, Recommends, Personal, Travel, Contact = 7 items. That is the *upper* end of "5–7 top-level items" guidance. Adding a parent + dropdown doesn't reduce the count meaningfully; it just nests three of the seven and adds a hover-target.
- **The grouping isn't thematically cohesive in Danish register.** Personal (identity), Travel (photography), Recommends (reading list) don't share a parent concept that reads as "Blog" — they share the parent concept of "non-work-product." A US-y framing might bundle them as "Blog" to suggest a content body; a Danish reading is more likely to parse this as "I have a lot of content and want to organise it" — adjacent to humble-brag.
- **Mobile penalty.** Three items in a collapsible mobile menu is exactly the anti-pattern dropdown-UX 2026 guidance flags. Tap-target hit-rate drops; visible-on-first-load info drops.
- **Hidden Janteloven cue.** A "Blog" parent implies a curated content brand. Danish-register portfolios trend the other way — flatter, less self-curated, less "personal brand."

If Eduard wants to reduce the visible count, the Scandinavian-friendly alternatives are:

- **Demote `/recommends` to the footer** (it's a reading list, not a primary surface). 7 → 6 items.
- **Rename `/personal`** to something less self-indulgent. Options worth Eduard's eye: "Off-duty" (English-borrow common in DK tech), "Outside work," "Other things." Avoid "About me" — it adds a self-promotion cue.
- **Keep `/travel` and `/recommends` as second-row sub-tabs *only on desktop*** under their natural parent (Travel sits naturally under itself; Recommends could quietly live under Writing as a tab). No mobile dropdown.

## Decision 2: `/my-story` page

**Recommendation: ship it, but with strict tone constraints.**

Reasons:

- **Narrative arcs are trending in 2026 portfolios** — including for engineers (DEV "Anthology" piece, Jake Knapp on Medium). The trend is real; ignoring it would feel dated by 2027.
- **Danish register tolerates chronology better than achievement.** "I went here, then I went there, then I learned this" reads as factual, not promotional. "I built world-class systems and led the field" reads as foreign — Janteloven-aversive.
- **Eduard's actual arc is interesting and varied** — IBA Kolding (AP Marketing & Management) → VIA (BSc) → Aarhus (MSc) → Systematic → Boozt → Greenbyte → Netcompany → Mjølner. That's a non-obvious trajectory worth telling. The story is *the choices*, not the achievements.

**Hard constraints for the page (apply at copywriting time):**

| Do | Don't |
|---|---|
| Date every transition (year + month) | Use superlatives ("award-winning," "world-class") |
| Anchor in concrete decisions ("I switched from marketing to CS because…") | Claim outsized impact ("I built the system that scaled to millions") |
| Keep length 600–1200 words, scannable | Write 3000+ words of dense prose |
| Use "I worked on X, I learned Y" | Use "I led X, I revolutionised Y" |
| Cross-reference `/work` for system detail and `/personal` for identity | Duplicate `/work` content with a heroic frame |
| Acknowledge non-linearity ("the marketing degree wasn't wasted because…") | Pretend the path was always intentional |
| Single calm tone throughout | Hype-build to a "and that's how I…" climax |

Format suggestion (so layout work can start before Eduard writes copy):
- **Hero**: just the title, "How I got here." No tagline.
- **Sections** in chronological order, each with a year-range eyebrow:
  1. *2014–2016 · IBA Kolding (AP Marketing & Management)* — why marketing first, what it left
  2. *2016–2019 · VIA University College (BSc IT)* — the switch, what carried over
  3. *2019–2023 · Aarhus University (MSc TBBD)* — bridging tech + business
  4. *2020–* Industry chapters: Systematic → Boozt → Greenbyte → Netcompany → Mjølner. Each: 2-4 sentences. What I worked on (sanitised for confidentiality), what I took with me, what made me move.
- **Coda**: a short paragraph on what's next. Pairs with `/now`.
- **Closing line** with a soft CTA: "If something here resonates with what you're hiring for, I'd be glad to hear from you" — link to `/contact`. Avoid "Let's connect" / "Let's chat" — those read as US LinkedIn-speak in Danish register.

## Rollout order suggestion

1. `/my-story` page shell with placeholder sections (PO can do this next session — pure structure, Eduard fills prose).
2. Eduard writes the prose under the constraints above.
3. Single calm link to `/my-story` from the home About section ("Read the longer arc on `/my-story`"). No nav-bar item — keep it flat.
4. **Skip the `/blog` dropdown.** If nav-count reduction is wanted, demote `/recommends` to footer and stop there.

## Update the backlog

When this benchmark is accepted, mark:
- `/blog` nav cluster → **closed (rejected on Danish-register benchmark)**, with a pointer to this doc.
- `/my-story` page → **shell can begin**, with the constraints in this doc as the gating rubric for copy review.
