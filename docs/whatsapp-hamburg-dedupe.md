# Hamburg WhatsApp dedupe — vs PR #38 archive import

Cross-check of the 9 Hamburg `landscape`-classified WhatsApp candidates from `docs/whatsapp-travel-candidates.md` (PR #40) against the 93 archive photos imported by PR #38 (`feat/hamburg-2022-import`). Goal: decide which WhatsApp frames are genuinely net-new content vs. duplicates of higher-quality camera originals already in the trip folder.

**Method**: 8×8 dHash via `sharp` greyscale 9×8 resize + horizontal-neighbour comparison; Hamming distance threshold ≤ 8 = duplicate. Source files for PR #38 read from `G:\Poze\Ha_Photos\` (the 93 archive originals — same image content as the imported `public/photos/trips/2022-10-germany/*.jpg`, so dHash matches are 1:1). WhatsApp candidates read from `G:\Poze\IMG-YYYYMMDD-WA####.{jpg,jpeg}`. Read-only on `G:\`.

**Then**: visual-content review on every WhatsApp candidate to flag privacy hazards (banned per `docs/photo-organization.md` §6) and rule out junk (anime screen-grabs, memes, blurry shots) — dHash alone can't tell a Hamburg landscape from a guinea-pig joke.

## 1. Per-candidate decision

| filename | filename-date | resolution | dHash | closest PR-#38 match (Hamming) | within ≤ 8? | visual subject | decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `IMG-20221003-WA0001.jpeg` | 2022-10-03 | 3840×2160 | `8db5b50d099999f1` | `IMG_0207.jpg` (20) | 0 | photo-of-screen, anime character (TV/monitor capture) | **Skip** — junk, not Hamburg content |
| `IMG-20221005-WA0002.jpg` | 2022-10-05 | 1600×900 | `80000000a0039815` | `20221021_111820.jpg` (19) | 0 | receipts/labels arranged on desk | **Skip — privacy** (document, banned per §6) |
| `IMG-20221010-WA0000.jpg` | 2022-10-10 | 1006×840 | `9c9ccc9cbc9c9f1f` | `20221021_103051.jpg` (20) | 0 | HaveIBeenPwned breach result with email visible | **Skip — privacy** (document + PII, banned per §6) |
| `IMG-20221021-WA0001.jpg` | 2022-10-21 | 1200×912 | `41179b8e8c987227` | `20221021_111820.jpg` (23) | 0 | guinea pigs in cardboard tank (forwarded meme) | **Skip** — junk, not Hamburg |
| `IMG-20221023-WA0000.jpg` | 2022-10-23 | 1600×1200 | `fcfcf1020e78b8fa` | `20221021_110855.jpg` (22) | 0 | hotel-room headboard + power outlet close-up | **Skip** — banal, no narrative value |
| `IMG-20221024-WA0003.jpeg` | 2022-10-24 | 3840×2160 | `3efe3e3c3c3cde9e` | `IMG_0250.jpg` (18) | 0 | blurry rainy night street, motion-blurred | **Skip** — quality fail (blur) |
| `IMG-20221024-WA0030.jpg` | 2022-10-24 | 1024×768 | `2666666a6e62fcde` | `IMG_0253.jpg` (23) | 0 | International Maritime Museum interior, naval-uniform mannequins; one back-of-head in frame | **Net new** — possible import after crop/review |
| `IMG-20221024-WA0032.jpg` | 2022-10-24 | 1024×768 | `787d0e86c7e62619` | `IMG_0231.jpg` (22) | 0 | pigeon on Hamburg street pavement (quirky) | **Net new** — marginal candidate, character shot |
| `IMG-20221029-WA0004.jpg` | 2022-10-29 | 1599×899 | `623899eed898b8b0` | `20221021_110855.jpg` (19) | 0 | airline boarding-flow screen "BILLUND … Front Door" | **Skip — privacy** (document + travel itinerary, banned per §6) |

## 2. Summary

- **9 of 9** WhatsApp candidates are dHash-distinct from all 93 PR-#38 imports (closest Hamming distances 18–23, all far above the ≤ 8 duplicate threshold). PR #38 didn't double-import these via the WhatsApp filename channel.
- **0 dHash duplicates** — no wasted work; the WA channel and the camera-original channel are fully orthogonal for this trip (different days/scenes, not different copies of the same frame).
- **4 hard-flag privacy skips** — receipts (`WA0002`), HIBP screenshot (`WA0000` 2022-10-10), boarding pass (`WA0004` 2022-10-29), all banned content. Plus one borderline anime-screen photo (`WA0001` 2022-10-03) under "photo of screen" / not the trip subject.
- **3 quality/relevance skips** — meme (`WA0021`), banal hotel detail (`WA0023`), motion-blur night (`WA0024-WA0003`).
- **2 net-new content candidates worth a follow-up review**:
  - `IMG-20221024-WA0030.jpg` — Hamburg International Maritime Museum interior with naval-uniform display. One person partially visible (back of head) — would need a small crop on the right edge before import. Adds a museum/culture frame to a trip folder currently dominated by exterior + Lüneburg shots.
  - `IMG-20221024-WA0032.jpg` — pigeon street shot. Atmospheric, low-stakes, kebab-case-named hero candidate (`oct-2022-hamburg-pigeon.jpg`) under `personal/` per the slug-named-hero pattern in `docs/photo-organization.md` §1, **rather than** as a `trips/2022-10-germany/` entry — its narrative belongs to the personal/character bucket, not the trip catalogue.

## 3. Recommendation

Net-new count: **2 of 9** are worth a follow-up review (`WA0024-WA0030`, `WA0024-WA0032`). The remaining 7 should be deleted from any "to-import" mental list:

| skip reason | count | files |
| --- | --- | --- |
| Privacy (document/PII per §6) | 3 | `WA0002 2022-10-05`, `WA0000 2022-10-10`, `WA0004 2022-10-29` |
| Junk / not Hamburg subject | 3 | `WA0001 2022-10-03`, `WA0001 2022-10-21`, `WA0023` |
| Quality fail (blur) | 1 | `WA0003 2022-10-24` |

A follow-up PR could:

- Crop `WA0030` (right edge) to remove the museum visitor's head, then import as `public/photos/trips/2022-10-germany/IMG-20221024-WA0030-cropped.jpg` (preserve filename per §2 archive rule, append `-cropped`).
- Optionally import `WA0032` to `public/photos/personal/oct-2022-hamburg-pigeon.jpg` if Eduard wants a quirky character shot. **Eyes-first review needed**: the brief is "Hamburg trip page", and a pigeon is at best a personal-page asset, not a trip-gallery asset.

The 4 privacy-flag files should not be touched. They illustrate the exact case `docs/whatsapp-travel-candidates.md` §3 warned about: the filename-date heuristic alone cannot surface document-class WhatsApp content; a manual visual pass was the only way to catch the boarding pass and the HIBP screenshot.

## 4. Limitations

- dHash @ 8×8 is generous (64-bit fingerprint). A WhatsApp-recompressed copy of a camera original would typically register Hamming ≤ 6; nothing in this set falls in the 6–8 grey zone, so the all-net-new verdict is robust.
- The PR #38 import folder is empty in this worktree (PR #38 unmerged at time of analysis). Source dHashes were computed against `G:\Poze\Ha_Photos\` filtered to the 93 filenames in `git diff origin/main..origin/feat/hamburg-2022-import`. Since PR #38 imports those exact files unchanged (camera originals, lossless copy), the dHashes would be identical — the verdict carries over.
- `WA0024-WA0030` (museum) is dimly lit and 1024×768 — usable for a thumbnail/fallback but Eduard should eyes-first whether the camera-archive already has a sharper Maritime Museum frame before importing.

---

Generated 2026-04-28 by the Domain-Expert sub-agent. dHash + Hamming via `sharp` (greyscale → 9×8 → row-major neighbour-compare → 64-bit fingerprint). Source files: 93 PR-#38 imports + 9 WhatsApp candidates = 102 files inspected, all read-only on `G:\Poze`.
