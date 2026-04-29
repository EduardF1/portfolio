# Thin-trip Pexels stock candidates

Per-trip Pexels candidate slates for trips that remain below the 5-photo target
in `scripts/photo-catalogue.json`. Sign-off doc only — Eduard ticks the boxes
for the candidates to import; a follow-up PR (`scripts/.round5/a14-fetch-stock.mjs`
pipeline) actually downloads, optimises, and appends the catalogue entries.

- **Source pool**: Pexels search (`https://www.pexels.com/search/...`).
- **License**: [Pexels License](https://www.pexels.com/license/) — commercial
  use OK; attribution voluntary but kept per `docs/photo-attributions.md`.
- **Filter applied**: landscape orientation preferred; no people in foreground
  (visual inspection of search-result thumb); subject tonally consistent with
  the trip's existing catalogue entries (city centre, monuments, harbour,
  natural features depending on locale).
- **Read-only research**: no JPGs were downloaded; no catalogue mutations.
- **Per-trip target**: bring trip count to 5. Candidates listed exceed that —
  Eduard picks the import set.
- **Sibling agent (`feat/thin-trip-own-archive-backfill`)**: no PR found at
  branch-creation time; this doc reflects the catalogue **as-is** at HEAD
  `8e3d215` (50 stock photos, 222 catalogue entries, 9 thin trips).

## Sign-off legend

- `[ ]` candidate awaiting Eduard's tick
- `[x]` Eduard approves — include in the import PR
- `[~]` skip / replace (will be cut from import PR)

---

## 1. `2018-03-israel` — current count 2, gap 3

- **Existing catalogue entries**: 2 photos around Rosh HaNikra (Mate Asher),
  Israel — Mediterranean white-cliff/grotto coastline, March 24, 2018.
- **Pexels search**: `rosh hanikra`, `galilee` (March = early spring; Israel
  was greenest of the year, so Galilee greens slot tonally with the cliffs).
- **Tonal target**: turquoise sea + white limestone (Rosh HaNikra cluster) +
  green hills (broader Northern Israel context).

| # | Pexels ID | URL | Photographer | Subject / orientation | Sign-off |
|---|---|---|---|---|---|
| 1 | 16294237 | [link](https://www.pexels.com/photo/aerial-view-of-the-coastline-near-rosh-hanikra-grottoes-at-the-border-of-israel-and-lebanon-16294237/) | [Sunbeam](https://www.pexels.com/@sunbeam-114409506/) | Aerial Rosh HaNikra grottoes, IL/LB border — landscape | `[ ]` |
| 2 | 36946679 | [link](https://www.pexels.com/photo/dramatic-coastal-cliff-with-azure-sea-under-cloudy-sky-36946679/) | [Valentina Besker](https://www.pexels.com/@valentina-besker-917936546/) | Dramatic coastal arch, azure sea — landscape | `[ ]` |
| 3 | 20172580 | [link](https://www.pexels.com/photo/detail-of-rocky-shore-of-sea-of-galilee-in-israel-water-and-blue-sky-landscape-with-hills-in-the-background-20172580/) | [Marta Nogueira](https://www.pexels.com/@marta-nogueira-589022975/) | Sea of Galilee rocky shore + hills — landscape | `[ ]` |
| 4 | 33924951 | [link](https://www.pexels.com/photo/scenic-view-of-galilee-hills-and-sea-33924951/) | [Mark Direen](https://www.pexels.com/@mark-direen-622749/) | Lush green Galilee hills + sea — landscape | `[ ]` |
| 5 | 36442700 | [link](https://www.pexels.com/photo/scenic-view-of-sea-of-galilee-in-israel-36442700/) | [Elenav](https://www.pexels.com/@elenav-2011499497/) | Sea of Galilee + palm trees + hills — landscape | `[ ]` |

---

## 2. `2019-07-belgium` — current count 4, gap 1

- **Existing**: Brussels Grand Place statue, Ghent canal twilight + 2 own
  archive shots. Trip was July 2019.
- **Pexels search**: `brussels summer`, `bruges summer` (Brugge wasn't yet
  represented; trip itinerary plausibly included a day-trip).
- **Tonal target**: golden Flemish architecture, summer sky, canal/water.

| # | Pexels ID | URL | Photographer | Subject / orientation | Sign-off |
|---|---|---|---|---|---|
| 1 | 35035915 | [link](https://www.pexels.com/photo/35035915/) | [Sertug Enes Çetinkaya](https://www.pexels.com/) | Atomium under sunny sky — landscape | `[ ]` |
| 2 | 33401014 | [link](https://www.pexels.com/photo/33401014/) | [Aleksandre Lomadze](https://www.pexels.com/@aleksandre-lomadze-2154684396/) | Mont des Arts gardens + Brussels skyline — landscape | `[ ]` |
| 3 | 2960887 | [link](https://www.pexels.com/photo/2960887/) | [Paul Deetman](https://www.pexels.com/) | Cinquantenaire Park arch, summer — landscape | `[ ]` |
| 4 | 33506900 | [link](https://www.pexels.com/photo/33506900/) | [Selim Zengin](https://www.pexels.com/@selim-zengin-2155018084/) | Bruges canal + flowers + tour boat — landscape | `[ ]` |
| 5 | 18799641 | [link](https://www.pexels.com/photo/18799641/) | [Milan](https://www.pexels.com/@milan-743755762/) | Aerial Bruges belfry tower — landscape | `[ ]` |

---

## 3. `2019-07-luxembourg` — current count 4, gap 1

- **Existing**: Adolphe Bridge autumn, Bar at night, Gothic Revival,
  Philharmonie. All Luxembourg City. July 2019.
- **Pexels search**: `luxembourg city` (excluding photographers already in
  catalogue: Ad Thiry, Ruben Da Costa, Büşra Karabulut).
- **Tonal target**: stone fortifications + Alzette valley greens + summer
  daylight (existing set leans evening / autumn — bringing a daylight piece
  balances).

| # | Pexels ID | URL | Photographer | Subject / orientation | Sign-off |
|---|---|---|---|---|---|
| 1 | 34161153 | [link](https://www.pexels.com/photo/34161153/) | [Irvine](https://www.pexels.com/) | Medieval fortifications + greenery — landscape | `[ ]` |
| 2 | 33083147 | [link](https://www.pexels.com/photo/33083147/) | [Sara Schlickmann](https://www.pexels.com/) | Alzette river through old town — landscape | `[ ]` |
| 3 | 29472785 | [link](https://www.pexels.com/photo/29472785/) | [Marina Zvada](https://www.pexels.com/) | Aerial old-town rooftops — landscape | `[ ]` |
| 4 | 34127880 | [link](https://www.pexels.com/photo/34127880/) | [Toufic Haddad](https://www.pexels.com/) | Neumünster Abbey + Pétrusse valley — landscape | `[ ]` |
| 5 | 27659285 | [link](https://www.pexels.com/photo/27659285/) | [Mehmet Hardal](https://www.pexels.com/) | Panoramic river view + abbey — landscape | `[ ]` |

---

## 4. `2020-02-denmark` — current count 2, gap 3

- **Existing**: 2 Horsens aerials by KAO MHG (no `takenAt` — stock-only
  cluster currently). Trip was February 2020 — winter.
- **Pexels search**: `horsens winter`, generic Danish winter / snowy town.
- **Tonal target**: muted winter aerials, snow on rooftops, low Nordic light
  (matches the existing aerials' palette).

| # | Pexels ID | URL | Photographer | Subject / orientation | Sign-off |
|---|---|---|---|---|---|
| 1 | 13274317 | [link](https://www.pexels.com/photo/13274317/) | [Gabriel Moshu](https://www.pexels.com/@gabriel-moshu-296476472/) | Aerial Horsens cityscape — landscape | `[ ]` |
| 2 | 35287333 | [link](https://www.pexels.com/photo/35287333/) | [Filia Mariss](https://www.pexels.com/@filiamariss/) | Aerial snow-covered European town — landscape | `[ ]` |
| 3 | 14551738 | [link](https://www.pexels.com/photo/14551738/) | [Efrem Efre](https://www.pexels.com/@efrem-efre-2786187/) | Aerial snow-covered town by river — landscape | `[ ]` |
| 4 | 30748022 | [link](https://www.pexels.com/photo/30748022/) | [Jakob Andersson](https://www.pexels.com/@jakobandersson/) | Snow-covered rooftops + winter foliage — landscape | `[ ]` |
| 5 | 35301741 | [link](https://www.pexels.com/photo/35301741/) | [Ayco World](https://www.pexels.com/@ayco-world-108848112/) | Snowy harbour + moored boats, overcast — landscape | `[ ]` |

> Note: photographer Jakob Andersson is already in the catalogue (Aarhus,
> 2022-10). Re-using the same photographer here is fine but flag if Eduard
> prefers diversity.

---

## 5. `2022-08-denmark` — current count 4, gap 1

- **Existing**: Billund airport airliner (Fatih Turan), Horsens summer aerial
  (KAO MHG) + 2 own archive. August 2022 — high summer Jutland.
- **Pexels search**: `billund` (sparse — Pexels has no LEGO House or town
  shots tagged as such); fell back to `jutland summer` for natural-coast
  context that fits the August timing.
- **Tonal target**: Jutland summer — dunes, lighthouses, North Sea.

| # | Pexels ID | URL | Photographer | Subject / orientation | Sign-off |
|---|---|---|---|---|---|
| 1 | 12323479 | [link](https://www.pexels.com/photo/12323479/) | [op23](https://www.pexels.com/) | White church in Skagen dunes — landscape | `[ ]` |
| 2 | 26771998 | [link](https://www.pexels.com/photo/26771998/) | [Wolfgang Weiser](https://www.pexels.com/) | Rømø Beach dunes, clear sky — landscape | `[ ]` |
| 3 | 26600775 | [link](https://www.pexels.com/photo/26600775/) | [suju](https://www.pexels.com/) | Skagen Lighthouse at sunset, North Sea — landscape | `[ ]` |
| 4 | 33830439 | [link](https://www.pexels.com/photo/33830439/) | [Tommes Frites](https://www.pexels.com/@tommes-frites/) | Hirtshals Lighthouse + Danish flag — landscape | `[ ]` |
| 5 | 18134307 | [link](https://www.pexels.com/photo/18134307/) | [Tha Dah Baw](https://www.pexels.com/@tha-dah-baw/) | Samsø Island green coastline — landscape | `[ ]` |

> Caveat: the trip slug is `denmark` (not Jutland-specific). If Eduard wants
> the gap filled by something tighter to the Horsens/Billund itinerary
> rather than coastal Jutland, flag and we'll search for inland summer
> alternatives — but Pexels coverage of Horsens summer beyond what's already
> imported is genuinely thin.

---

## 6. `2022-12-romania` — current count 4, gap 1

- **Existing**: Arcul de Triumf night, Military Circle corner, Odeon Theatre,
  Quiet street — all Bucharest, December 2022.
- **Pexels search**: `bucharest winter`.
- **Tonal target**: snow / winter blue hour cityscape, neoclassical
  architecture (matches existing).

| # | Pexels ID | URL | Photographer | Subject / orientation | Sign-off |
|---|---|---|---|---|---|
| 1 | 953626 | [link](https://www.pexels.com/photo/953626/) | [Dave Haas](https://www.pexels.com/@dave-haas-347675/) | Snow-covered Bucharest street + bicycle — landscape | `[ ]` |
| 2 | 36210381 | [link](https://www.pexels.com/photo/36210381/) | [Olaru Dragosh](https://www.pexels.com/@olaru-dragosh-328310951/) | Palace surrounded by snow-covered trees — landscape | `[ ]` |
| 3 | 11431969 | [link](https://www.pexels.com/photo/11431969/) | [lukez0r](https://www.pexels.com/@lukez0r/) | Snowy city street, evening streetlights — landscape | `[ ]` |
| 4 | 19448896 | [link](https://www.pexels.com/photo/19448896/) | [vlasceanu](https://www.pexels.com/@vlasceanu/) | Aerial Bucharest Christmas market carousel — landscape | `[ ]` |
| 5 | 11016776 | [link](https://www.pexels.com/photo/11016776/) | [Ana-Maria Antonenco](https://www.pexels.com/@ana-maria-antonenco-78158389/) | Palace of the Parliament daytime — landscape | `[ ]` |

> Photographer Ana-Maria Antonenco is already in catalogue (used twice). Fine
> to reuse if tonal match wins.

---

## 7. `2023-04-italy` — current count 4, gap 1

- **Existing**: Galleria Vittorio Emanuele II + 3 own archive. Milan, April
  2023 — early spring.
- **Pexels search**: `milan spring`.
- **Tonal target**: warm stone + spring magnolia/bloom + Duomo silhouettes
  (existing Galleria is warm marble — keeps consistent).

| # | Pexels ID | URL | Photographer | Subject / orientation | Sign-off |
|---|---|---|---|---|---|
| 1 | 36665795 | [link](https://www.pexels.com/photo/36665795/) | [Tommaso](https://www.pexels.com/@tommaso/) | Historic building + magnolia blooms — landscape | `[ ]` |
| 2 | 36781363 | [link](https://www.pexels.com/photo/36781363/) | [Earth Photart](https://www.pexels.com/@earth-photart/) | Aerial Milan + Alps backdrop — landscape | `[ ]` |
| 3 | 31178835 | [link](https://www.pexels.com/photo/31178835/) | [OnTheCrow](https://www.pexels.com/@onthecrow/) | Duomo at sunset + birds — landscape | `[ ]` |
| 4 | 33695864 | [link](https://www.pexels.com/photo/33695864/) | [Mihaela Claudia Puscas](https://www.pexels.com/@mihaela-claudia-puscas/) | Duomo + clear blue sky — landscape | `[ ]` |
| 5 | 36665793 | [link](https://www.pexels.com/photo/36665793/) | [Tommaso](https://www.pexels.com/@tommaso/) | Victorian-style architecture + magnolia — landscape | `[ ]` |

---

## 8. `2023-07-turkey` — current count 4, gap 1

- **Existing**: Galata Tower street + 3 own archive. Istanbul, July 2023.
- **Pexels search**: `istanbul summer`.
- **Tonal target**: golden hour over Bosphorus, mosque domes, summer haze.

| # | Pexels ID | URL | Photographer | Subject / orientation | Sign-off |
|---|---|---|---|---|---|
| 1 | 33522090 | [link](https://www.pexels.com/photo/33522090/) | [Smuldur](https://www.pexels.com/@smuldur/) | Waterfront ferries + Blue Mosque — landscape | `[ ]` |
| 2 | 8071157 | [link](https://www.pexels.com/photo/8071157/) | [Yunustug](https://www.pexels.com/@yunustug/) | Aerial Blue Mosque + Bosphorus — landscape | `[ ]` |
| 3 | 28601269 | [link](https://www.pexels.com/photo/28601269/) | [Ninetysevenyears](https://www.pexels.com/@ninetysevenyears/) | Aerial Hagia Sophia + Bosphorus — landscape | `[ ]` |
| 4 | 33702999 | [link](https://www.pexels.com/photo/33702999/) | [Muzin Kahraman](https://www.pexels.com/@muzin-kahraman-789215623/) | Sunny Bosphorus road, summer day — landscape | `[ ]` |
| 5 | 35016386 | [link](https://www.pexels.com/photo/35016386/) | [Hobiphotography](https://www.pexels.com/@hobiphotography/) | Bosphorus sunset, Maiden's Tower silhouette — landscape | `[ ]` |

---

## 9. `2025-03-romania` — current count 4, gap 1

- **Existing**: Cărturești Carusel, Neoclassical Tenement, Parliament cloudy,
  Triumphal Arch night — all Bucharest, March 2025.
- **Pexels search**: `romanian athenaeum` (cherry-blossom-specific
  Bucharest searches returned Berlin/Tokyo/Hungary, not Bucharest — Pexels
  coverage is genuinely thin for Bucharest spring blossoms).
- **Tonal target**: neoclassical / belle-époque facades, daylight (existing
  set already covers night and cloudy day).

| # | Pexels ID | URL | Photographer | Subject / orientation | Sign-off |
|---|---|---|---|---|---|
| 1 | 12623889 | [link](https://www.pexels.com/photo/12623889/) | [Cosmin Chiwu](https://www.pexels.com/@cosmin-chiwu/) | Romanian Athenaeum front view + greenery — landscape | `[ ]` |
| 2 | 17613733 | [link](https://www.pexels.com/photo/17613733/) | [Ana-Maria Antonenco](https://www.pexels.com/@ana-maria-antonenco-78158389/) | Romanian Athenaeum neoclassical detail — landscape | `[ ]` |
| 3 | 36895898 | [link](https://www.pexels.com/photo/36895898/) | [Photographisa RO](https://www.pexels.com/@photographisa-ro/) | Athenaeum framed through stone sculpture — landscape | `[ ]` |
| 4 | 27334027 | [link](https://www.pexels.com/photo/27334027/) | [Jakub Zerdzicki](https://www.pexels.com/@jakub-zerdzicki/) | Parliament Palace facade detail — landscape | `[ ]` |
| 5 | 36683133 | [link](https://www.pexels.com/photo/36683133/) | [Liza Sigareva](https://www.pexels.com/@liza-sigareva/) | Historic building + pink blossoms (Bucharest area) — landscape | `[ ]` |

---

## Genuinely-obscure footnote

- **Billund-specific summer / LEGO House**: Pexels has ~0 usable
  location-tagged images of Billund town or LEGO House exterior. Fallback
  used was Jutland coastal summer (Skagen, Rømø, Hirtshals, Samsø) which
  shares the August-summer mood but not the inland Lego/airport theme. If
  the gap matters for narrative integrity, the alternative is to commission
  / shoot in person rather than stock-fill.
- **Bucharest cherry blossoms**: Pexels' Bucharest spring tag mostly returns
  Berlin/Tokyo/Hungary blooms. The Athenaeum slate above goes for
  neoclassical daylight rather than seasonal flora.

## Process / next step

1. Eduard ticks the `[x]`s.
2. Follow-up agent runs the equivalent of `scripts/.round5/a14-fetch-stock.mjs`
   to download, optimise (`sharp` long-edge ≤ 2000 px, q85 mozjpeg, strip
   metadata), name `<provider>-<location>-<id>.jpg`, place under the trip
   folder, append catalogue entries, and update
   `docs/photo-attributions.md`.
3. Validate (`scripts/.round5/validate-photos.mjs`) and merge.

_Generated: 2026-04-28._
