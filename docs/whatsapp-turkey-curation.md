# Turkey 2023 WhatsApp curation — visual review

Visual classification of the 10 `landscape`-bucket WhatsApp candidates flagged in `docs/whatsapp-travel-candidates.md` (PR #40) §2 `2023-07-turkey`. Goal: produce a top-5 import-recommendation list with reasoning, plus a stance on whether the existing Pexels stock should be kept once Eduard's own coverage grows.

**Method**: each candidate inspected via `sharp` (size, dimensions, aspect, dHash) and a direct visual pass; subject classified as cityscape / coastal / interior / Pamukkale-travertine / Cappadocia. dHash clustering done at Hamming ≤ 8 to catch near-duplicates of the same scene. Read-only on `G:\Poze\`.

**Existing trip coverage** (per `scripts/photo-catalogue.json`): 4 own + 1 Pexels stock — *not* the "1 own + 4 stocks" the brief assumed. Coverage today:
- `IMG_20230712_135809.jpg` — Kuşadası restaurant menu/promo (weak, mostly tabletop)
- `IMG_20230712_161810.jpg` — Kuşadası
- `IMG_20230715_165617.jpg` — Istanbul
- `IMG_20230716_142933.jpg` — Istanbul
- `pexels-istanbul-galata-tower-street-29069777.jpg` — Galata Tower (stock)

Gap: **no Pamukkale, no Cappadocia, no clean Aegean coast hero shot**. WhatsApp candidates therefore have real fill-the-gap potential.

## 1. Per-candidate review

| filename | date | resolution | size | dHash | dHash cluster | subject | recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `IMG-20230712-WA0001.jpg` | 2023-07-12 | 2048×1536 | 278 KB | `76373363622903c3` | C2 | Family selfie at Pamukkale (background travertines visible) | **Skip** — faces, privacy |
| `IMG-20230712-WA0002.jpg` | 2023-07-12 | 2048×1536 | 300 KB | `93b93131369725e8` | C3 | Family selfie at Hierapolis ruins | **Skip** — faces, privacy |
| `IMG-20230712-WA0003.jpg` | 2023-07-12 | 2048×1536 | 155 KB | `73737373694a12dd` | C4 | Family selfie at Hierapolis (mountains background) | **Skip** — faces, privacy |
| `IMG-20230712-WA0004.jpg` | 2023-07-12 | 2048×1536 | 245 KB | `73737173694a82dd` | C4 | Same Hierapolis selfie composition (near-dup of WA0003) | **Skip** — faces, near-dup of WA0003 |
| `IMG-20230712-WA0005.jpg` | 2023-07-12 | 2048×1536 | 248 KB | `73737373694a329d` | C4 | Same Hierapolis selfie composition (near-dup of WA0003) | **Skip** — faces, near-dup of WA0003 |
| `IMG-20230712-WA0027.jpg` | 2023-07-12 | 2000×1500 | 252 KB | `cae6f6b3217178fc` | C5 | Pamukkale travertine close-up + bare feet/torso | **Skip** — body in frame, privacy |
| `IMG-20230712-WA0028.jpg` | 2023-07-12 | 2000×1500 | 234 KB | `e7e37bb93170f8f8` | C6 | Pamukkale travertine + bare feet (near-dup of WA0027) | **Skip** — body in frame, privacy |
| `IMG-20230714-WA0003.jpg` | 2023-07-14 | 1600×1200 | 90 KB | `18f279d0e0f0f0e0` | C7 | **Aegean coast town at dusk** (Kuşadası or Söke skyline, sea, sunset gradient sky, no people) | **IMPORT** — top pick |
| `IMG-20230714-WA0086.jpg` | 2023-07-14 | 1024×683 | 104 KB | `8d3ee6a38e6c8cdc` | C0 | Eduard on jet ski, beach + bystanders behind | **Skip** — many bystanders, privacy/people |
| `IMG-20230714-WA0087.jpg` | 2023-07-14 | 1024×683 | 111 KB | `29036c27c6a9b03d` | C1 | Eduard flexing + brother (shirtless) on jet ski | **Skip** — multiple shirtless subjects, privacy |

dHash clustering: 8 distinct visual clusters across 10 candidates (WA0003-WA0005 collapse into one cluster at Hamming ≤ 8 — that's the same family-selfie composition reshot 3×). Even the apparently-similar jet-ski WA0086 and WA0087 sit at Hamming > 8 because the subject pose differs.

## 2. Top-5 import recommendation

The label "10 landscape candidates" was set by the filename-date heuristic in PR #40 (horizontal aspect ≤ 1.85, ≥ 80 KB). Visual review reveals **only 1 of 10 is actually a landscape suitable for the portfolio gallery**. The "top 5" is therefore really "top 1 + 4 honourable mentions that flunk privacy".

| rank | filename | subject | suggested target path | reasoning |
| --- | --- | --- | --- | --- |
| 1 | `IMG-20230714-WA0003.jpg` | Aegean coast town at sunset/dusk | `public/photos/trips/2023-07-turkey/IMG-20230714-WA0003.jpg` | Only true clean landscape. Fills the "no own coastal hero shot" gap. Filename date Jul 14 → matches Kuşadası leg (catalogue confirms 37.83 lat region). 1600×1200 is gallery-grade after a `sharp` 1920px resize. |
| — | (no rank-2 to rank-5 imports recommended) | — | — | All other 9 candidates have either faces (selfies), exposed body parts (Pamukkale travertine bare-feet shots), or shirtless bystanders (jet-ski beach scene). None are clean landscapes. Importing any would violate `docs/photo-organization.md` §6 privacy guidance and Eduard's job-search-context preference for tightly-curated visual presence. |

If the **bottom 4** (privacy-flagged) ones turn out to be valuable to Eduard for personal-context use (e.g. the dusk-coast candidate plus the Pamukkale family selfies in a private-share album), they live at the source on `G:\Poze\` already — no portfolio import needed.

## 3. Stocks decision

Recommendation: **keep the 1 Pexels Galata-tower stock**, even after importing `WA0003` (the one true new landscape).

- The Galata stock covers Istanbul; `WA0003` covers Aegean coast (Kuşadası area) at dusk. Different cities, different times of day → no thematic overlap. Stock removal would orphan Istanbul on the trip page.
- The catalogue's existing 4 own Istanbul/Kuşadası shots are mostly mid-day urban scenes (per filename HHMMSS: 13:58, 16:18, 16:56, 14:29). The dusk frame fills a "golden-hour" mood beat the trip page is currently missing.
- Per `docs/photo-organization.md` §4 stock policy, stocks are kept until own-coverage saturates. Single new dusk frame ≠ saturation.

If a future round adds Pamukkale and/or Cappadocia own-coverage (these are the two big gaps; neither WhatsApp nor camera archive currently has a clean privacy-safe frame), revisit the stocks question then.

## 4. Recommended next-step PR

Single-file import:

1. Branch: `feat/turkey-2023-coast-dusk`.
2. Copy `G:\Poze\IMG-20230714-WA0003.jpg` to `public/photos/trips/2023-07-turkey/` (preserve filename per `docs/photo-organization.md` §2 archive convention; lowercase extension; no transcoding).
3. Run `npm run build:photo-catalogue` (per `scripts/build-photo-catalogue.mjs`) so the new entry lands in `scripts/photo-catalogue.json` with EXIF-derived `takenAt` if any survived WhatsApp's strip — likely null, in which case set `takenAt` from the filename date `2023-07-14T00:00:00Z` and `place.display = "Kuşadası, Turkey"` (best-guess from filename date overlap with existing Jul 12 Kuşadası entries; Eduard should confirm city before merge).
4. Update `content/travel/2023-07-turkey.{en,da}.mdx` (if the trip page exists; check `src/app/[locale]/travel/photos/[slug]/page.tsx` rendering pattern) to acknowledge the dusk frame in the prose.
5. No new stock attribution needed; existing Galata stock entry stays.

## 5. Limitations & open questions

- WhatsApp strips most EXIF including GPS; the city assignment for `WA0003` rests on filename date + adjacency to confirmed Kuşadası entries on Jul 12. Eduard should eyes-first whether the dusk skyline is Kuşadası, Söke, or another Aegean stop.
- The dHash clustering is on the 10 filtered "landscape" candidates only — there are 56 other in-window WhatsApp files in the `2023-07-turkey` window (66 total per PR #40 §2) classified as `people-likely`/`screenshot-likely`. Some of those may contain real landscapes the heuristic mis-binned (vertical landscape orientation defeated by phone camera defaults). Out of scope for this PR but worth a follow-up scan if Eduard wants more own-coverage.
- One of the existing 4 own photos (`IMG_20230712_135809.jpg`) is a tabletop menu shot with dubious narrative value. Domain-expert recommends Eduard re-evaluate that file separately — it may be a "personal cookbook receipt" type frame that doesn't belong in the public gallery either. Out of scope for this PR; flagged for a follow-up curation pass.

---

Generated 2026-04-28 by the Domain-Expert sub-agent. Visual review on 10/10 candidates; dHash clustering via `sharp`; read-only on `G:\Poze`. No imports performed.
