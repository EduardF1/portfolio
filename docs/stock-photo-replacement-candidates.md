# Stock photo replacement candidates

Sign-off-ready Pexels candidate list for the **9 stock photos** flagged
`Replace` by P6 (`scripts/.photo-classify/P6/stock-audit.md`). The 9 spread
across **5 trip folders**: `2018-04-sweden` (1), `2020-02-denmark` (3),
`2022-10-denmark` (2), `2022-10-germany` (1), `2023-08-romania` (1),
`2025-03-romania` (1). The dominant failure mode is **season/tone mismatch**
— summer-green park on a February trip, snow on August/October trips, a
B&W frame in an otherwise full-colour corpus, and one cross-trip duplicate
monument. On a trip-detail page the user reads the gallery as a continuous
mood; a winter church next to a leafy summer archive frame breaks the
illusion that they're looking at one trip. Each entry below lists 3 Pexels
candidates with rationale and a recommended pick; Eduard ticks the
checklist at the bottom to close the loop.

This is **research-only**. No JPGs were downloaded. No catalogue or
attribution edits. The actual swap is a follow-up PR after sign-off.

---

## 1. `2018-04-sweden/pexels-malmo-turning-torso-sunset-13071531.jpg`

- **Trip**: 2018-04-sweden (Malmö, April)
- **Place**: Malmö, Sweden
- **P6 reason**: Third Turning-Torso shot in the same folder — same
  monument three ways (sunset, fog, daylight). Redundant; lowest filesize
  in the set.

| ID | Photographer | URL | Why fits | Why might not |
| --- | --- | --- | --- | --- |
| 16478717 | Esrageziyor | https://www.pexels.com/photo/lilla-torg-in-malmo-sweden-16478717/ | Genuine Lilla Torg square — different motif vs. the Torso, daytime warm tone matches April spring light, no people | Bright noon daylight; less moody than the trip's existing dusk fog Torso |
| 18747972 | Omerfuyar | https://www.pexels.com/photo/city-hall-in-malmo-18747972/ | Malmö City Hall ornate detail, no people, daytime architecture variety | Tight crop on tower detail — less of a "place" shot, more an architecture portrait |
| 31055680 | Damir | https://www.pexels.com/photo/stunning-sunset-over-oresund-bridge-in-malmo-31055680/ | Øresund Bridge at sunset — keeps the dusk mood the original sunset shot brought, but a totally different subject; iconic Malmö landmark | Silhouette at sunset; check it isn't tonally too close to the existing fog-Torso (both moody). The other two candidates are daytime so the set is balanced. |

### Recommended: candidate 1
Lilla Torg (16478717) brings square-level human-scale variety the cluster
is missing — three building hero-shots + one canal windmill, no street
scene. Spring daylight pairs with the April archive frame.

---

## 2. `2020-02-denmark/pexels-horsens-aerial-cityscape-13274632.jpg`

- **Trip**: 2020-02-denmark (Horsens, February)
- **Place**: Horsens, Denmark
- **P6 reason**: Repetitive aerial #2 of three KAO MHG drone shots in the
  same folder. Same photographer, same shoot.

| ID | Photographer | URL | Why fits | Why might not |
| --- | --- | --- | --- | --- |
| 35287347 | filiamariss | https://www.pexels.com/photo/charming-winter-street-scene-with-historic-architecture-35287347/ | Winter street level with historic brick architecture and snow — exactly the February ground-level shot the cluster lacks; no people | Generic Danish winter (search bled into other Nordic winter towns); P6 should sanity-check it reads as Horsens or at least convincingly Jutland |
| 36214779 | joerg-mangelsen | https://www.pexels.com/photo/scenic-winter-view-of-sonderborg-waterfront-36214779/ | Colourful waterfront buildings, clear winter sky, Danish town vibe — provincial-DK character matches Horsens | Tagged Sønderborg, not Horsens; would need a filename rename or `place` adjustment in catalogue. Reject if location-strictness is required. |
| 14786024 | kaomhg | https://www.pexels.com/photo/drone-shot-of-houses-with-snow-during-winter-14786024/ | Aerial Horsens-area snow shot from the same KAO MHG photographer — keeps photographer continuity but adds the missing winter season cue | Still aerial (P6 flagged aerial-bias); same photographer (P6 flagged photographer-overlap). Only fixes the season cue. |

### Recommended: candidate 1
filiamariss snow-street (35287347) is the strongest fix for the February
trip — ground-level, snowed-in, breaks the aerial monoculture in one shot.
If location-strictness wins over season fit, fall back to candidate 3.

---

## 3. `2020-02-denmark/pexels-horsens-aerial-rooftops-13274625.jpg`

- **Trip**: 2020-02-denmark (Horsens, February)
- **Place**: Horsens, Denmark
- **P6 reason**: Repetitive aerial #3 from same KAO MHG shoot
  (sequential ID with 13274632). Photographer overlap.

| ID | Photographer | URL | Why fits | Why might not |
| --- | --- | --- | --- | --- |
| 30748022 | jakobandersson | https://www.pexels.com/photo/snow-covered-urban-rooftops-in-winter-sunshine-30748022/ | Urban rooftops blanketed in snow under clear winter sky — keeps the rooftops motif the original had but adds the missing winter cue and a different photographer | Not Horsens-tagged in title; Jakob Andersson also supplies the Aarhus half-timbered shot in 2022-10-denmark, so risk of photographer-overlap moves between folders |
| 35287333 | filiamariss | https://www.pexels.com/photo/snow-covered-european-town-aerial-view-in-winter-35287333/ | Snow-covered European town aerial — fixes the season; new photographer | Generic European-town tag, not Horsens-specific; weakest "is this really Horsens" defense |
| 13274317 | gabriel-moshu | https://www.pexels.com/photo/aerial-footage-of-a-cityscape-13274317/ | Horsens aerial cityscape from a different photographer than KAO MHG — fixes the photographer-overlap concern | Still aerial (#3 aerial in folder); summer/no-snow daytime — keeps the season-mismatch the trip already has |

### Recommended: candidate 1
jakobandersson snow rooftops (30748022) — same motif as the original
(rooftops) but winter-tonal and a non-KAO photographer. Best of the three
on the photographer + season axes simultaneously.

---

## 4. `2020-02-denmark/pexels-horsens-park-pathway-14547046.jpg`

- **Trip**: 2020-02-denmark (Horsens, February)
- **Place**: Horsens, Denmark
- **P6 reason**: Lush green summer park dropped on a February trip.
  Tonally jarring vs. the winter archive frame.

| ID | Photographer | URL | Why fits | Why might not |
| --- | --- | --- | --- | --- |
| 16065962 | Vadutskevich | https://www.pexels.com/photo/snowed-urban-park-16065962/ | Tranquil urban park, bare trees lining a snowy path — direct replace-in-kind for the original (park pathway → snowy park pathway), no people | Generic urban park; not Horsens-specific |
| 6626646 | Paul | https://www.pexels.com/photo/snow-covered-pathway-between-bare-trees-6626646/ | Serene snowy pathway, bare trees, daytime winter — tonally cold and quiet, matches a February gallery's mood | Very generic forest-path shot; could be anywhere in northern Europe |
| 19322885 | Paparazziratzfatzzi | https://www.pexels.com/photo/snowed-path-leading-to-illuminated-residential-district-19322885/ | Snowy path leading to lit residential district — adds an evening/dusk note to the cluster which is otherwise all daytime | Evening light may clash with the cluster's three other (currently bright daytime aerial) frames if those stay |

### Recommended: candidate 1
Vadutskevich snowy park (16065962) is the closest like-for-like swap —
preserves the "park pathway" semantic, just winter. Lowest-friction edit.

---

## 5. `2022-10-denmark/pexels-randers-haslund-church-winter-6526779.jpg`

- **Trip**: 2022-10-denmark (Randers / Aarhus, October)
- **Place**: Randers, Denmark
- **P6 reason**: Snowy winter church on an October trip — tonally jarring;
  the trip was unlikely to have had snow.

| ID | Photographer | URL | Why fits | Why might not |
| --- | --- | --- | --- | --- |
| 18947583 | Eddson Lens | https://www.pexels.com/photo/facade-of-a-historical-building-in-denmark-18947583/ | Historic Danish brick building with tower — a church/civic-monument substitute, daytime, no people, autumn-neutral tones | Not explicitly Randers; the search returned a generic Denmark hit. Filename would say `randers` but the source isn't Randers-confirmed. |
| 5684177 | Linda Christiansen | https://www.pexels.com/photo/photograph-of-buildings-with-windows-5684177/ | Cobblestone street with traditional Danish buildings — provincial-Denmark character, no people, neutral daytime | Same caveat — Denmark-generic, not Randers-pinpointed. Aesthetically a strong autumn-neutral fit. |
| 29125265 | Wolfgang Weiser | https://www.pexels.com/photo/charming-autumn-alley-in-hamburg-with-fall-foliage-29125265/ | Cobblestone alley with strong autumn foliage — exact October mood | Hamburg, not Denmark. Reject unless we're widening the "place" rule (we're not). Listed for tonal reference only. |

### Recommended: candidate 1
Eddson Lens historic Danish façade (18947583) is the safest swap — Danish,
autumn-neutral, civic-architecture feel that pairs with the existing
Aarhus cathedral hero. If Eduard wants Randers-strict, this slot may need
a manual Pexels browse on `randers` directly (P6 already noted Randers
returns are thin on Pexels).

---

## 6. `2022-10-denmark/pexels-randers-wind-turbines-4512516.jpg`

- **Trip**: 2022-10-denmark (Randers / Aarhus, October)
- **Place**: Randers, Denmark
- **P6 reason**: Generic blue-sky-and-turbines stock — doesn't read as
  Randers; could be any Danish flatland.

| ID | Photographer | URL | Why fits | Why might not |
| --- | --- | --- | --- | --- |
| 5684177 | Linda Christiansen | https://www.pexels.com/photo/photograph-of-buildings-with-windows-5684177/ | Cobblestone street + traditional buildings — Randers-coded historic-centre vibe; if used, picks a different candidate from #5 above | Same caveat (Denmark-generic, not strict-Randers); using here means **don't** also use it for #5 |
| 33487095 | Jasmin Borsig | https://www.pexels.com/photo/charming-cobblestone-alley-in-odense-denmark-33487095/ | Cobblestone alley, classic architecture — Danish provincial historic-centre — but B&W. Stylistic risk if the corpus removes the only existing B&W frame (#7 below) | Tagged Odense, not Randers; B&W reintroduces the very stylistic outlier P6 just flagged for Hamburg. **Caution**. |
| 5334300 | Christian Pfeifer | https://www.pexels.com/photo/a-boat-moored-on-the-shore-and-waterfront-buildings-in-helsingor-denmark-5334300/ | Blue fishing boat at harbour with historic buildings — adds a water-element variety the Randers cluster lacks (Randers sits on the Gudenå's mouth into Randers Fjord); strong autumn-daylight palette | Tagged Helsingør, not Randers. Tonally on-target, location-loose. |

### Recommended: candidate 3
Christian Pfeifer harbour shot (5334300) brings the water element that's
genuinely Randers-coded (fjord town) and is the most autumn-day-tonal of
the three. Filename would still say `randers` per our own slug — the
photographer's title is Helsingør but Randers harbour is the closer
semantic for the trip page. Eduard's call on whether that rename is OK
or if he'd rather hand-browse for a strict Randers shot.

---

## 7. `2022-10-germany/pexels-hamburg-wasserschloss-bw-7133327.jpg`

- **Trip**: 2022-10-germany (Hamburg, October)
- **Place**: Hamburg, Germany
- **P6 reason**: The only B&W frame in the entire stock corpus.
  Stylistic outlier next to colour archive frames.

| ID | Photographer | URL | Why fits | Why might not |
| --- | --- | --- | --- | --- |
| 7058070 | NJeromin | https://www.pexels.com/photo/a-view-of-the-wasserschloss-speicherstadt-restaurant-in-germany-7058070/ | Same Wasserschloss subject as the original, twilight in **colour** — direct subject-preserving B&W → colour swap by the same photographer (Niklas Jeromin). Drops B&W, keeps everything else. | Twilight-blue palette; check it doesn't double up too closely with `pexels-hamburg-speicherstadt-canal-30195965.jpg` already in the same folder |
| 25337832 | Wolfgang Weiser | https://www.pexels.com/photo/wasserschloss-speicherstadt-restaurant-in-hamburg-germany-25337832/ | Same monument, night-illumination, colour, no people — fully replaces the subject identity | Night vs. dusk — slightly later light than the rest of the cluster |
| 36051449 | filiamariss | https://www.pexels.com/photo/historic-warehouse-district-in-hamburg-at-dusk-36051449/ | Different Speicherstadt subject (broader warehouse district at dusk), colour, no people — adds variety vs. doubling up on Wasserschloss | Lets go of the Wasserschloss subject identity entirely; if Eduard wants the swap to be invisible (same monument, just colour), this candidate is wrong |

### Recommended: candidate 1
NJeromin twilight Wasserschloss (7058070) — same photographer, same
subject, colour. Lowest-impact swap; the gallery just stops being B&W.

---

## 8. `2023-08-romania/pexels-brasov-black-church-snow-35380540.jpg`

- **Trip**: 2023-08-romania (Sinaia + Brașov, August)
- **Place**: Brașov, Romania
- **P6 reason**: Snow on an August trip — the worst tonal mismatch in
  the corpus per P6.

| ID | Photographer | URL | Why fits | Why might not |
| --- | --- | --- | --- | --- |
| 17713520 | reanimatedmanx | https://www.pexels.com/photo/gothic-black-church-in-brasov-17713520/ | Gothic Black Church, summer/snowless — exact subject-preserving snow → summer swap | Confirm via click-through that it reads as warm summer and not shoulder-season |
| 34073275 | rambe-ioana | https://www.pexels.com/photo/scenic-view-of-brasov-s-historical-center-34073275/ | Brașov historical centre with red rooftops + clock tower — same photographer who already supplies the Council-Square clock-tower shot in `2022-08-romania`, so cross-trip photographer reuse risk; great summer mood | Photographer-overlap with another folder (P6 flagged this exact pattern as a separate concern) |
| 5718472 | andreea-juganaru | https://www.pexels.com/photo/buildings-near-the-mountain-5718472/ | Downtown Brașov + mountain backdrop at sunset — strong August evening tone, different photographer | Sunset ≠ midday August archive frame — pairs better with golden-hour Eduard frames than with bright-daylight ones |

### Recommended: candidate 1
reanimatedmanx Gothic Black Church (17713520) — exact-monument summer
replacement. Dead-on fix for the worst tonal mismatch in the corpus.

---

## 9. `2025-03-romania/pexels-bucharest-triumphal-arch-night-30210641.jpg`

- **Trip**: 2025-03-romania (Bucharest, March)
- **Place**: Bucharest, Romania
- **P6 reason**: Same monument (Arcul de Triumf at night) appears in both
  `2022-12-romania` and `2025-03-romania` — viewer sees the same monument
  twice in two different trip galleries.

| ID | Photographer | URL | Why fits | Why might not |
| --- | --- | --- | --- | --- |
| 34417386 | Bogdan Chirea | https://www.pexels.com/photo/night-view-of-the-romanian-athenaeum-bucharest-34417386/ | Romanian Athenaeum at night — keeps the night-illumination tone of the original, swaps the duplicated monument for a totally different iconic Bucharest landmark | Still night-tonal; if the rest of the 2025-03 cluster is daytime-skewed, this slot stays the lone night frame |
| 16945240 | Czapp Arpad | https://www.pexels.com/photo/city-street-in-bucharest-at-night-16945240/ | Bucharest old-town street at night with fountains + traffic — same photographer (Czapp Árpád) who already supplies the Cărturești bookshop in this folder, photographer continuity within the cluster | Same-photographer risk inside the folder; check if Eduard prefers spreading photographers |
| 11997320 | Czapp Arpad | https://www.pexels.com/photo/beige-concrete-building-under-blue-sky-11997320/ | Beautifully illuminated historic building at night, no people — different monument, night-tonal continuity | Same photographer concern as #2; subject is less iconic than Athenaeum |

### Recommended: candidate 1
Bogdan Chirea Athenaeum at night (34417386) — different monument, kills
the cross-trip duplicate, brings the Athenaeum (one of Bucharest's two or
three top icons) into the corpus for the first time. New photographer too.

---

## Process notes

- **License**: Pexels License (https://www.pexels.com/license/) permits
  free commercial + non-commercial use; attribution is "appreciated but
  not required". The portfolio's existing convention
  (`docs/photo-attributions.md`, `scripts/photo-catalogue.json` `source`
  block) is to credit photographers anyway. Replacement entries follow
  the same convention — when the swap PR lands, each new file gets a
  full `source` block with `photographer`, `photographerUrl`, `url`,
  `license: "Pexels License"`, `licenseUrl`.
- **Provider stays Pexels**. No new provider introduced in this round
  per the task constraints; Unsplash remains acceptable in principle but
  is out of scope here.
- **No catalogue or attribution edits in this PR** — this doc is
  research only. The actual swap is a follow-up: download → resize via
  `scripts/copy-and-resize-photos.ps1` (or the sharp pipeline in
  `scripts/.round5/a14-fetch-stock.mjs`) → drop into
  `public/photos/trips/<slug>/` → rebuild catalogue → regenerate
  `docs/photo-attributions.md` via `scripts/.round5/a14-rebuild-attributions.mjs`.
- **Tonal-fingerprint shortcut**: the candidates were ranked from the
  Pexels search-page descriptions (subject, light, season, people-yes/no)
  rather than RGB-sampling each archive frame. For the 9 cases here,
  P6's prose reasons gave a clear-enough season target — Eduard's
  visual click-through is the final check.
- **Pexels search bias**: location queries for small Danish towns
  (Horsens, Randers) leak into broader Denmark / Nordic results; some
  candidates are tagged for nearby cities (Sønderborg, Helsingør,
  Odense). Flagged per-row above. The strict-Randers / strict-Horsens
  cases may need Eduard to hand-browse Pexels directly.
- **Empty-search cases**: every one of the 9 returned ≥ 3 candidates;
  no needed-Eduard-eyes-fallback. Quality varies — strongest hits are
  #1, #4, #7, #8, #9; weakest are #5 and #6 (Randers-strict is thin on
  Pexels).

## Sign-off

Tick the candidate to use, or strike through and write your own ID:

- [ ] Stock 1 (`malmo-turning-torso-sunset-13071531`) → use candidate ___
- [ ] Stock 2 (`horsens-aerial-cityscape-13274632`) → use candidate ___
- [ ] Stock 3 (`horsens-aerial-rooftops-13274625`) → use candidate ___
- [ ] Stock 4 (`horsens-park-pathway-14547046`) → use candidate ___
- [ ] Stock 5 (`randers-haslund-church-winter-6526779`) → use candidate ___
- [ ] Stock 6 (`randers-wind-turbines-4512516`) → use candidate ___
- [ ] Stock 7 (`hamburg-wasserschloss-bw-7133327`) → use candidate ___
- [ ] Stock 8 (`brasov-black-church-snow-35380540`) → use candidate ___
- [ ] Stock 9 (`bucharest-triumphal-arch-night-30210641`) → use candidate ___

Reply with deltas (e.g. "1: cand 2, 3: keep original, 5: hand-browse")
and a follow-up agent will execute the swap PR.
