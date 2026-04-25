# Content Inventory — Eduard Fischer-Szava Portfolio

> Read-only research over `D:\Portfolio`, the current CV, and Eduard's LinkedIn snapshots. No files were moved, copied, or modified. Photo counts and trip clusters are derived from filename timestamps; trip locations are inferences and need confirmation from Eduard.

---

## 1. Headshots

The candidate pool for hero / about photography is small and tightly focused — only two true professional headshots, plus two oversized derivatives in the same folder.

| File | Framing | Background | Suitability | Recommended placement |
|---|---|---|---|---|
| `D:\Portfolio\Documents\CV_CL_sendouts\Photos\Profile_Image_2.jpg` | Medium head-and-shoulders, slight smile, even lighting, eyes to lens | Plain off-white textured wall | **High** | **Hero** (right-aligned at md+, full-width on mobile). Matches the CV photo currently embedded in `Eduard_Fischer-Szava_CV_EN.pdf`, so it's the brand-consistent option. |
| `D:\Portfolio\Documents\CV_CL_sendouts\Photos\Profile_Image_1.jpg` | Slightly tighter crop, fuller smile, same shirt and wall | Same plain off-white wall | High | About section, or as a secondary tile in /personal. Keeps consistency with the hero. |
| `D:\Portfolio\Documents\CV_CL_sendouts\Photos\thumbnail.jfif` | Unknown (file >256KB; likely a higher-res duplicate of one of the two above) | Unknown | Medium — defer until visually confirmed | Possible source for OG/social card if higher resolution than the JPGs. |
| `D:\Portfolio\Documents\CV_CL_sendouts\Photos\thumbnail (1).jfif` | As above | As above | Medium | Same — keep in reserve. |

Both JPG headshots are clean, professional, neutral-background portraits in a navy patterned shirt — ideal for a developer/consultant portfolio. The brief already assumes `Profile_Image_2.jpg` for the hero; that aligns with the CV. Dimensions could not be programmatically read with the available tools — Eduard or the Dev should verify in Explorer / image viewer (estimate from the rendered preview: roughly 900×800 px, JPEG, ~125 KB).

`D:\Portfolio\Documents\Linkedin\Version 31.01.24\` contains only a screenshot of his old LinkedIn About section (`About.png`) and a text refresh draft — no photos. The newer mirror folder `D:\Portfolio\Documents\Linkedin Version 31.01.24\` holds the same two artefacts. No additional headshots elsewhere in `Documents\`.

The 44k+ travel photos (`D:\Portfolio\poze\IMG2023*.jpg`–`IMG2025*.jpg`) are explicitly not appropriate for the hero — they're personal / off-brand for a consultant site and belong on `/personal` later.

**Recommendation:** keep `Profile_Image_2.jpg` as the canonical hero photo. Ship a single web-optimised export (e.g. 1200px wide, AVIF + JPEG fallback) into `public/images/hero/`. No need to widen the candidate set.

---

## 2. Travel photos — grouped by trip

Eduard's photos live at `D:\Portfolio\poze\` (and a duplicate set under `D:\Portfolio\poze\camera\`), not the top-level as the brief stated. The naming convention is `IMG<YYYYMMDD><HHMMSS>.jpg`. A handful of duplicates appear at the `D:\Portfolio\` root itself but the canonical archive is `poze\`.

Clusters below are derived from contiguous date runs in the filename glob output. Anything ≥30 days from the next photo starts a new cluster. **All location guesses are inferences that require Eduard's confirmation.** Sample filenames are pulled from the matched globs, not opened.

### 2023 trips

| # | Date range | Photo count (approx.) | Inferred location | Sample filenames | Vibe |
|---|---|---|---|---|---|
| 1 | 2023-08-22 → 2023-08-23 | ~12 | Italy — pre-Pisa leg, possibly Florence or Rome (inferred — verify with Eduard) | `IMG20230822134707.jpg`, `IMG20230822173938.jpg`, `IMG20230823002348.jpg`, `IMG20230823192939.jpg` | City / streetscape, evening shots |
| 2 | 2023-08-24 *(reserved)* | ~30+ | **Pisa, Italy — already published as the sample trip; do not re-claim** | `IMG20230824135048.jpg` etc. | Tower / city centre |
| 3 | 2023-08-25 → 2023-08-26 | ~50+ | Italy — likely Cinque Terre / coastal day after Pisa (inferred — verify with Eduard) | `IMG20230825094154.jpg`, `IMG20230825100505.jpg`, `IMG20230825101306.jpg`, `IMG20230825101750.jpg` | Coast, harbours, cliff villages — long photo run from morning to afternoon implies sightseeing day |

### 2024 trips

| # | Date range | Photo count (approx.) | Inferred location | Sample filenames | Vibe |
|---|---|---|---|---|---|
| 4 | 2024-01-01 → 2024-01-02 | ~60 | Romania, family New Year (inferred — Romanian roots; January density suggests holiday at home) | `IMG20240101182002.jpg`, `IMG20240101205811.jpg`, `IMG20240102141143.jpg`, `IMG20240102162940.jpg` | Family / home / fireworks |
| 5 | 2024-01-09 → 2024-01-26 | ~40 | Aarhus / Denmark winter daily life (inferred — gap of ~7 days, then sparse cadence; not a trip but a domestic stretch) | `IMG20240109081752.jpg`, `IMG20240114222230.jpg`, `IMG20240120180122.jpg`, `IMG20240121151148.jpg` | Indoor, café/home, winter walks |

### 2025 trips

| # | Date range | Photo count (approx.) | Inferred location | Sample filenames | Vibe |
|---|---|---|---|---|---|
| 6 | 2025-01-01 → 2025-01-08 | ~15 | Romania, family New Year (inferred — same pattern as 2024) | `IMG20250101000007.jpg`, `IMG20250103182437.jpg`, `IMG20250106174448.jpg`, `IMG20250108191406.jpg` | New-year, indoor / family |
| 7 | 2025-01-10 → 2025-01-26 | ~80 | Aarhus + short trip (inferred — dense 22-Jan run suggests a day out; locations unclear without geotag check) | `IMG20250110120145.jpg`, `IMG20250115182221.jpg`, `IMG20250122160210.jpg`, `IMG20250122203256.jpg` | Mixed — café, urban, possible weekend trip on 22-Jan |

### Older (pre-MSc) trips found incidentally

- 2016 batch (`IMG_20160715_*` → `IMG_20160919_*`) — Romania / VIA pre-studies summer (inferred). Not in scope for current portfolio narrative but useful if `/personal` ever wants a "long arc" view.
- 2018 (`IMG_20180207_*`) — sparse, likely incidental.

### Caveats

- The brief estimated 44k photos at the top level. The actual photo store is `D:\Portfolio\poze\` plus its `camera\` subfolder, with many duplicates between the two. A real count needs `dir /s /b` or PowerShell — which are blocked in this read-only research session. Treat counts above as order-of-magnitude.
- Without EXIF parsing tools (no shell available), GPS-based location confirmation isn't possible from this session. Recommend the Dev add an EXIF-reading step when actually shipping `/travel` content so geotags drive captions automatically.
- Many "trips" are actually domestic-life clusters, not travel. The PO should pick 3–5 trips Eduard actually wants public, then have the Dev/Designer source 6–10 photos each.

**Top 3 best-clustered actual trips (recommended for `/travel` and `/personal`):**

1. **Italy — late August 2023** (Aug 22 → Aug 26, ~90 photos across pre-Pisa, Pisa, post-Pisa). The Pisa leg is already published; the coastal/Florence days around it could become a multi-card travelogue.
2. **Romania — Jan 2024 New Year** (Jan 1–2, ~60 photos). Family, home country — strong fit for `/personal` only, not the public hero.
3. **Romania — Jan 2025 New Year** (Jan 1–8, ~15 photos, slower cadence). Companion to #2; could be paired into a "going home for New Year" recurring-ritual entry.

---

## 3. Master's article (MOT)

**Source:** `D:\Portfolio\Documents\MOT_Article\MOT Article.pdf` (also as `.docx` in the same folder).

- **Exact title:** *Digitalization of waste collection — a theoretical study of feral systems*
- **Date:** Authored late 2022 as part of the **MOT (Management of Technology)** course in **SEM_1** of the MSc Engineering — Technology-Based Business Development programme at Aarhus University. References cited up to **December 2022**, so treat the article as **December 2022**.
- **Authors:** Group 22 — Andreas Monrad Pedersen, Daniel Alexander Robert Silsbee, Jacob Hansen Rubæk, Frederik Freltoft Thoudal, Eduard Fischer-Szava (student ID 202202630). **Co-authored** — important for any "publish on portfolio" decision.
- **Length:** 14 pages of body + references. Body text approximately **5,500–6,500 words** (estimated from page density; the title page leaves "Number of characters (including spaces)" blank, so we don't have an exact AU character count).

### Two-paragraph summary (publishable)

The article is a theoretical and case-based study of how a large industrial manufacturer should approach digitalisation of its waste-collection processes. Working from observations at an unnamed "study case company" (SCC), the authors identify three intertwined disciplines that determine whether such a project succeeds: **requirements engineering**, **compliance management**, and the deliberate use of **Feral Information Systems (FIS)** — the spreadsheets, scripts, and end-user tools that grow up alongside enterprise platforms — as legitimate **prototypes** rather than something to be policed. The literature review situates the work inside Industry 4.0 / 5.0 thinking and surveys the dominant barriers (missing skills, ineffective strategy, mindset gaps) reported by Vogelsang, Mahmood, Lammers and others. Empirically, the SCC's facility-management department was found collecting waste data manually into an Excel dashboard with no compliance, no analytics, and no coordination with SAP — a textbook FIS waiting to be either suppressed or productised.

The contribution is a **two-layer guideline** for upper management and IT departments. The outer layer frames digitalisation as a strategic business effort; the inner layer prescribes concrete practices: capture requirements as user stories early; treat the existing FIS as the iterative prototype in a prototyping-model SDLC; bring the prototype under standards (UML for design, SOLID for code, IEEE-829 for testing, IEEE-830 for requirements specs) before promoting it into the operational backbone; and only then integrate it with SAP and the rest of the corporate landscape. The closing argument is that FIS shouldn't be punished — they're sensemaking artefacts that reveal real user needs, and managed correctly they cut the cost and risk of later ERP integration. The paper closes with a call for follow-on work on digital-capability feasibility studies and continuous re-evaluation of standards as digitalisation evolves.

### Key takeaways (for the article page)

- **Feral systems are prototypes, not violations.** Treat the spreadsheets people build "in the shadows" as a free first iteration of the real product; channel them, don't suppress them.
- **Requirements engineering is the gating discipline.** User stories + early stakeholder mapping prevent the agility-gap drift that produces feral systems in the first place.
- **The biggest barrier is human, not technical.** Missing skills, fixed mindsets, and weak strategy outweigh any specific tool choice in the literature.
- **Standards are how a prototype graduates.** UML, SOLID, IEEE-829 and IEEE-830 are the bridge from "FIS hidden in Excel" to "module that talks to SAP".
- **Digitalisation requires continuous re-evaluation.** Anything you ship today becomes legacy fast — bake re-evaluation into the operating model.

### Publishing format recommendation

**Excerpt + summary + link to full PDF**, not full text. Reasons:
1. Co-authored — publishing the full text needs four other people's sign-off.
2. The article is academic prose with figures (Figures 1–5) that would need to be re-rendered for web; not worth the engineering for a side-channel artefact.
3. The summary above already lands the takeaways a recruiter or peer would care about.

Ship the **two-paragraph summary** + **5 takeaways** as the body, and link to the PDF in `public/articles/mot-feral-systems.pdf` (move/copy with Eduard's permission). Add a clear "Co-authored with [list]" credit line.

### Suggested slug

`content/articles/digitalization-of-waste-collection-feral-systems.mdx`

(Or shorter: `feral-systems-digitalization.mdx`. The current `devops-research.mdx` placeholder remains a separate, later piece — don't overwrite it.)

---

## 4. Other writing & academic work

Surface-scanned `D:\Portfolio\AU-MSC\**`. Eduard's individually-authored deliverables are tagged `(EDFIS)` or `- EDFIS` in the filename, which makes them easy to isolate. Below is the publishable subset (i.e. own work, written form, polished enough to summarise).

| Filename | Semester / course | ~Length | Topic guess |
|---|---|---|---|
| `D:\Portfolio\AU-MSC\SEM_1\MOT\article\presentation\MOT Article Presentation - EDFIS.pptx` | SEM_1 / MOT | Slide deck | Defence of the feral-systems article above. Could become slide screenshots in the article post. |
| `D:\Portfolio\AU-MSC\SEM_1\TS_1\project\report\TS1 Report - EDFIS.pdf` | SEM_1 / Technology Studies 1 | ~20–30 pp | Research-methods project; precursor to MOT article methodology. |
| `D:\Portfolio\AU-MSC\SEM_1\TS_1\assignments\methods_test\handin\TS_1_test_2022 - EDFIS.pdf` | SEM_1 / TS_1 | Short | Methods test — academic, not publishable. |
| `D:\Portfolio\AU-MSC\SEM_1\PTO\exam_preparation\draft\People and Technology in Organisations - take-home assignment 14-15 December 2022 - EDFIS.pdf` | SEM_1 / PTO | Take-home essay | People-and-tech / org-behaviour reflection. Could be mined for a short essay on consulting culture. |
| `D:\Portfolio\AU-MSC\SEM_1\PTO\sessions\session_6 (11.10.22)\handin\PTO_Assignment_1 - EDFIS.pdf` | SEM_1 / PTO | Short | Patagonia case work. Probably not standalone. |
| `D:\Portfolio\AU-MSC\SEM_1\MOT\assignments\assignment_1\hand_in\MOT 2022 Exercise 1 - EDFIS.pdf` | SEM_1 / MOT | Short exercise | Skip. |
| `D:\Portfolio\AU-MSC\SEM_1\MOT\assignments\assignment_2\hand_in\MOT 2022 Exercise 2 - EDFIS.pdf` | SEM_1 / MOT | Short exercise | Skip. |
| `D:\Portfolio\AU-MSC\SEM_2\TS_2\Exam\Report\TS2 Report - EDFIS.pdf` | SEM_2 / Technology Studies 2 | ~20–30 pp | Research-methods report. Possible companion piece to the MOT article. |
| `D:\Portfolio\AU-MSC\SUMMER_UNIVERSITY\Management Strategy, Business Ethics and Leadership\Leadership, Management Strategy and Business Ethics - EDFIS.pdf` | Summer University 2023 | ~20 pp | Ethics / leadership essay. Could yield a `/writing` post on consulting ethics if Eduard wants. |
| `D:\Portfolio\AU-MSC\SEM_3\electives\EPM\report\hand-in\EPM_Report (EDFIS).pdf` | SEM_3 / Engineering Project Management | ~30+ pp | EPM final report — agile/risk-management research. Strong candidate for a second `/articles` post. |
| `D:\Portfolio\AU-MSC\SEM_3\electives\EPM\report\poster\EPM_Poster (EDFIS).pdf` | SEM_3 / EPM | Single page | Poster — convert to a tile/diagram inside the EPM article. |
| `D:\Portfolio\AU-MSC\SEM_3\electives\SEO\exam\hand-in\SEO_Report (EDFIS).pdf` | SEM_3 / Sustainability in Engineering and Operations | ~30+ pp | Sustainability report. Possible third article. |
| `D:\Portfolio\AU-MSC\SEM_3\MST_Defense\Bukowiecka_Fischer-Szava_Thesis.pdf` | SEM_3 / Master Thesis | ~80–100 pp | **The thesis itself — DevOps in SMEs at Greenbyte.** Co-authored with Bukowiecka. This is the source for the existing `content/articles/devops-research.mdx` placeholder. |
| `D:\Portfolio\AU-MSC\SEM_3\MST_Defense\MST Presentation - EDFIS.pptx` | SEM_3 / MST | Slide deck | Thesis defence deck. |

The thesis (`Bukowiecka_Fischer-Szava_Thesis.pdf`) is the largest single asset. It already has a placeholder MDX — replacing the placeholder body with a 2-paragraph summary + key findings is the natural P1 next step after the MOT article ships.

VIA bachelor / IBA materials are scattered across `D:\Portfolio\Documents\Word files\` (e.g. `Systematic - Eduard Fischer-Szava.docx`, `Final_Reflections.docx`, `Technical report - Eduard Fischer-Szava.docx`). Useful for /work case-study background but not as standalone publishable writing.

---

## 5. Books candidates for `/recommends`

Slim pickings — Eduard's archive is light on personal book PDFs. Two technical books at `D:\Portfolio\Documents\Books\` plus the MSc summer-university textbook(s) under `AU-MSC\SUMMER_UNIVERSITY\...\book\`.

| Title | Author | Path | Suggested verdict (1 sentence draft — Eduard to confirm) |
|---|---|---|---|
| *Starting Out with Java, 6th Edition* | Tony Gaddis | `D:\Portfolio\Documents\Books\Starting_Out_with_Java_6th_Edition.pdf` | Solid first OO/Java textbook for someone coming from no programming background — useful as a beginner pointer, not for working engineers. |
| *Head First Object-Oriented Design and Analysis* | Brett D. McLaughlin et al. (O'Reilly) | `D:\Portfolio\Documents\Books\O'Reilly Head First Object-Oriented Design and Analysis.pdf` | The Head First series at its best — turned my mental model on requirements + OOAD around early on; still recommend it to juniors. |
| *Business Ethics* | Andrew Crane, Dirk Matten | `D:\Portfolio\AU-MSC\SUMMER_UNIVERSITY\Management Strategy, Business Ethics and Leadership\book\Business Ethics by Andrew Crane, Dirk Matten (z-lib.org).pdf` | Required reading at AU summer school — surprisingly readable framing of stakeholder vs. utilitarian ethics; useful when consulting work pulls you into political territory. |
| *The Pyramid Principle* | Barbara Minto (referenced as `pyramid principle.pdf` in summer-university folder) | `D:\Portfolio\AU-MSC\SUMMER_UNIVERSITY\Management Strategy, Business Ethics and Leadership\book\pyramid principle.pdf` | The single most useful book for anyone who has to write to executives — completely changed how I structure technical reports and slide decks. |
| *The Ethics of Leadership* | (folder file, author unverified) | `D:\Portfolio\AU-MSC\SUMMER_UNIVERSITY\Management Strategy, Business Ethics and Leadership\book\the ethics of leadership.pdf` | Tag as "to verify" — Eduard should confirm whether he actually rates it before it ships. |

**Recommendation:** seed `/recommends` with **3 entries**: Head First OOAD, Pyramid Principle, and one tool of Eduard's choosing (current placeholder is `tools` category, so a third tool/SaaS would balance the section). Don't ship Starting Out with Java — generic and not on-brand for a senior engineer's site. Ship the rest only if Eduard explicitly endorses them; verdicts above are **drafts**, not Eduard's actual opinions.

---

## 6. Project case-study source material

For each `/work` case study the PO has lined up, here's what the local archive yields. Usefulness ratings reflect **how much narrative material exists locally** — not the importance of the role itself.

### KOMBIT VALG (Netcompany, Oct 2024 — present)

- **Paths found:** None. No KOMBIT, VALG, Netcompany, or election-platform artefacts in `D:\Portfolio\Documents\` or `D:\Portfolio\AU-MSC\`.
- **Type:** N/A.
- **Usefulness:** **Nothing-found.** Current and post-MSc — the archive predates this role.
- **Recommendation:** This case study has to be written from Eduard's head + the public CV bullets. Architect/Dev should brief Eduard for a 30-min interview, capture quotes, then draft. Keep it deliberately abstract — it's a public-sector election system, NDA-sensitive.

### SitaWare (Systematic, Feb–Jun 2021)

- **Paths found:**
  - `D:\Portfolio\Documents\Word files\Systematic - Eduard Fischer-Szava.docx` (cover letter / personal pitch — useful for tone)
  - `D:\Portfolio\Documents\Word files\Systematic - Company Presentation.docx`
  - `D:\Portfolio\Documents\Word files\Systematic_Target.docx`
  - `D:\Portfolio\Documents\Word files\Technical report - Eduard Fischer-Szava.docx` (likely VIA internship technical report — most useful)
  - `D:\Portfolio\Documents\Word files\Final_Reflections.docx` (likely VIA internship reflection — useful for personal voice)
  - `D:\Portfolio\Documents\Word files\logbook.docx`, `logbook_part_2.docx` (internship logs — primary source on what he actually did day-to-day)
  - `D:\Portfolio\Documents\PPT Presentations\Internship_Systematic.pptx` (internship presentation deck)
- **Type:** Mix of cover letter, company presentation, technical report, reflection, daily logs, defence deck.
- **Usefulness:** **High.** Several thousand words of first-person material on the SitaWare experience exists. The technical report alone should give the Dev a usable narrative spine; the logbook gives concrete examples; the deck gives images.
- **Recommendation:** SitaWare can be a strong, story-driven case study built almost entirely from existing material with light editing.

### Greenbyte (Nov 2021 — Sep 2024)

- **Paths found:**
  - `D:\Portfolio\AU-MSC\SEM_3\MST_Defense\Bukowiecka_Fischer-Szava_Thesis.pdf` — **the master's thesis was conducted at Greenbyte** ("DevOps Implementation Research" per the CV). This is the single richest artefact in the entire archive.
  - `D:\Portfolio\AU-MSC\SEM_3\MST_Defense\MST Presentation - EDFIS.pptx` — defence deck.
  - `D:\Portfolio\Documents\PPT Presentations\Thesis presentation 30.11.2023.pptx` and `Thesis presentation 30_11_2023.pptx` — duplicate / variant decks.
  - `D:\Portfolio\Documents\PPT Presentations\DevOps Implementation in an SME – An Empirical.pptx` — direct title match to the thesis topic.
  - `D:\Portfolio\Documents\PPT Presentations\15.12 Exam presentation.pptx` / `_2.pptx` — likely the same content polished for exam.
- **Type:** Thesis PDF (~80–100 pp), 4–5 versions of the defence deck.
- **Usefulness:** **High.** The case study writes itself — there's a finished, defended thesis to draw from. Plus the day-job context (mobile Flutter app, .NET/React SaaS) lives in Eduard's head.
- **Recommendation:** Two pieces of content — (a) `/work/greenbyte` as a case study covering the SaaS + Flutter mobile work, and (b) `/articles/devops-sme` (replacing the current placeholder) as the thesis summary. Cross-link them.

### Boozt (Boozt Fashion AB, Oct 2021 — May 2022)

- **Paths found:** Searches across `D:\Portfolio\Documents\` for "Boozt" timed out / returned no obvious matches. No dedicated folder, no obvious slide decks, no logbook for Boozt found in this scan.
- **Type:** N/A.
- **Usefulness:** **Low / nothing-found.** Has to be written from Eduard's head, supported by the CV bullets (PHP/Symfony, Kanban introduction, automated testing, Malmö).
- **Recommendation:** Treat as the lowest-priority case study. A short, factual page based on CV bullets is sufficient unless Eduard wants to invest more.

---

## 7. LinkedIn cross-check

WebFetch was not available in this session, so the public LinkedIn URL `https://www.linkedin.com/in/eduard-fischer-szava/` could not be retrieved live. LinkedIn aggressively blocks unauthenticated scraping anyway, so even if WebFetch had been available, the result would likely have been an anti-bot page. Falling back to the local snapshot.

**Local snapshot:** `D:\Portfolio\Documents\Linkedin\Version 31.01.24\` (mirrored as `D:\Portfolio\Documents\Linkedin Version 31.01.24\`). Two artefacts:

1. `About.png` — screenshot of the **old (pre-31.01.24)** About section. Reads: *"I am a young Software Engineering student with a strong desire to encounter newness and embrace changes, both personally and professionally. I have always had a strong sense of curiosity and interest in understanding my surroundings and when I face an unknown concept, I approach it in an energetic manner and strive to understand it to the last detail. My vision is that theory is the first milestone on approaching a challenge, followed by practice and lastly, a dynamic team that can cooperate harmoniously."*

2. `New_About.txt` — the **31.01.24 refresh draft**: *"As a versatile Software Engineer, I bring nearly three years of industry experience, having graduated with a bachelor's degree specializing in data engineering and a master's in technology-based business development. Fueled by a passion for continuous learning and adaptability, both personally and professionally, I energetically embrace new challenges, approaching them with a thorough and detail-oriented mindset. I believe in a mixed approach to problem-solving, starting with theory as the foundation, followed by practical application, and culminating in collaborative teamwork for harmonious execution."*

### Notable differences vs. the current CV (`Eduard_Fischer-Szava_CV_EN.pdf`)

The CV opener has evolved further since the 2024 LinkedIn refresh — the current CV positioning is **"motivated by building stable and long-term solutions"** and explicitly anchors on **business-critical systems (KOMBIT VALG, SitaWare)**. The LinkedIn snapshot positions Eduard as a *"versatile Software Engineer"* with *"nearly three years of industry experience"*, no mention of consulting, KOMBIT, or business-critical systems. **This is a real gap** — if his live LinkedIn still reads like the Jan 2024 draft, it under-sells the current consulting positioning by about 18 months.

The local snapshot does not contain certifications, courses, recommendations, projects sections, or recent posts — only the About text. Anything like AU diplomas / VIA diploma / MS grades lives in `D:\Portfolio\Documents\CV_CL_sendouts\Base\`, not the LinkedIn folder.

**Recommendation:** Outside the scope of this inventory, but worth flagging to Eduard: his LinkedIn About almost certainly needs a refresh to match the current CV. That's an Eduard task, not an agent task.

---

## 8. Recommendations to PO

Ranked. Each: *what / why / who / size*.

### R1. Lock in the master's article post (MOT — feral systems)

- **What:** Replace the current `content/articles/devops-research.mdx` *placeholder* OR add a sibling `content/articles/digitalization-of-waste-collection-feral-systems.mdx` using the summary in §3 above.
- **Why:** It's the highest-quality piece of writing in the archive, it's already in PO scope (P1 in the backlog), and §3 already produced the publishable copy. Ship it before the thesis post because the thesis is co-authored too but more sensitive (Greenbyte = a recent employer).
- **Who:** Dev.
- **Size:** **S** — copy/paste from §3, mention co-authors, add PDF download in `public/articles/`.

### R2. Replace the DevOps placeholder with the actual thesis summary

- **What:** Rewrite `content/articles/devops-research.mdx` with a 2-paragraph summary of `Bukowiecka_Fischer-Szava_Thesis.pdf` plus 3–5 bullet findings.
- **Why:** The placeholder is currently visible — anyone landing on `/articles/devops-research` reads "[Placeholder summary — to be replaced]". That's a credibility leak. The thesis file exists; we just need a 1-hour reading pass to extract the summary.
- **Who:** Dev — Domain Expert (this agent in a follow-up run, or Dev with a brief).
- **Size:** **M** — requires actually reading the 80–100pp thesis, which this session didn't have time for.

### R3. Build SitaWare and Greenbyte case studies from existing material

- **What:** Flesh out `/work/sitaware` and `/work/greenbyte-saas` (currently placeholder tiles on the home page) using the source material in §6. SitaWare draws from the technical report + logbooks + internship deck; Greenbyte draws from the thesis + four years of context Eduard already lived.
- **Why:** Two of the four featured-work tiles can land with real content. KOMBIT and Boozt have to wait for Eduard input — these don't.
- **Who:** Dev (drafting), Eduard (review pass), possibly Designer (visuals).
- **Size:** **L** — two case studies, plus light Designer input on visuals.

### R4. Ship the hero photo

- **What:** Move `D:\Portfolio\Documents\CV_CL_sendouts\Photos\Profile_Image_2.jpg` into `public/images/hero/` (web-optimised: AVIF + JPEG fallback at e.g. 1200px wide), wire it into the `<Hero>` component in `src/app/[locale]/page.tsx`.
- **Why:** Already in the P1 backlog (blocked on the palette decision). The photo is ready, the analysis in §1 confirms it's the right one. Once the palette lands, this is a small unblock.
- **Who:** Dev (after Designer signs off the palette).
- **Size:** **S**.

### R5. Seed `/recommends` with 3 starter entries

- **What:** Replace the `sample.mdx` placeholder with 3 real entries — *Head First OOAD*, *The Pyramid Principle*, and one tool of Eduard's choosing (e.g. JetBrains Rider, since he writes a lot of C#).
- **Why:** Backlog P3, low-effort, removes the "Placeholder Recommendation" copy currently visible on the live site.
- **Who:** Dev, with **Eduard's verdict copy** (the verdicts in §5 are drafts).
- **Size:** **S**.

### R6. Document a `/personal` plan for travel photos before scaling photo handling

- **What:** Designer note: define the cropping ratio, max-photos-per-trip, and gallery layout for `/personal`'s travel section *before* the Dev imports any of the 44k+ photos.
- **Why:** Without a layout spec, the Dev will either over-build or under-build. Trip clusters (§2) give the data; we need the design constraint before pulling images out of `D:\Portfolio\poze\`.
- **Who:** Designer (spec) → Dev (implementation later).
- **Size:** **M** — Designer spec is small; the Dev follow-up is medium because there are 44k+ candidates to filter through.

### R7. Brief Eduard for the KOMBIT VALG case study

- **What:** PO sends Eduard a short questionnaire (5–7 questions) to capture the KOMBIT story, since nothing in the archive supports it.
- **Why:** It's Eduard's most current, highest-status work — but the only source is in his head. Until that's captured, `/work/kombit-valg` stays a placeholder.
- **Who:** PO.
- **Size:** **S** (questionnaire) → **M** (Dev writes up the answers).

---

## Appendix — sources

- `D:\Portfolio\Documents\MOT_Article\MOT Article.pdf`
- `D:\Portfolio\Documents\CV_CL_sendouts\Photos\Profile_Image_1.jpg`, `Profile_Image_2.jpg`
- `D:\Portfolio\Documents\Linkedin\Version 31.01.24\New_About.txt`, `About.png`
- `D:\Portfolio\Documents\CV_CL_feedback\CV_CL_Feedback_Phil.txt`, `CV_CL_Feedback_Kimm.txt`
- `D:\Portfolio\AU-MSC\SEM_3\MST_Defense\Bukowiecka_Fischer-Szava_Thesis.pdf`
- `D:\Portfolio\AU-MSC\SEM_3\MST_Defense\MST Presentation - EDFIS.pptx`
- `D:\Portfolio\AU-MSC\SUMMER_UNIVERSITY\Management Strategy, Business Ethics and Leadership\Leadership, Management Strategy and Business Ethics - EDFIS.pdf`
- `D:\Portfolio\Documents\Word files\Technical report - Eduard Fischer-Szava.docx`, `Final_Reflections.docx`, `logbook.docx`, `logbook_part_2.docx`, `Internship_Systematic.pptx`
- `D:\Portfolio\Documents\Books\O'Reilly Head First Object-Oriented Design and Analysis.pdf`, `Starting_Out_with_Java_6th_Edition.pdf`
- `C:\Users\Eduard\Desktop\Job search 2026\Sent applications\Eduard_Fischer-Szava_CV_EN.pdf`
- `C:\Users\Eduard\Projects\portfolio\docs\backlog.md`
- `C:\Users\Eduard\Projects\portfolio\src\app\[locale]\page.tsx`
- `C:\Users\Eduard\Projects\portfolio\content\articles\devops-research.mdx`
- `C:\Users\Eduard\Projects\portfolio\content\recommends\sample.mdx`
