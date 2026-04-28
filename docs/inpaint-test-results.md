# Inpaint pipeline — 5-photo test results

Test phase output for `scripts/inpaint-people.py` (YOLO11n person detection
+ LaMa inpainting). Run on 2026-04-28 against 5 photos from
`public/photos/trips/2026-03-balkans-roadtrip/`. Originals on `G:\` and the
local PC are read-only — pipeline operates only on the worktree copies under
`public/photos/`.

Run command:

```
python scripts/inpaint-people.py \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260326132151.jpg \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260325121419.jpg \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260325161408.jpg \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260329143206.jpg \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260325164444.jpg \
  --threshold 0.25 \
  --output scripts/.inpaint-test-output/
```

Threshold note: lowered confidence to **0.25** (vs the default 0.4) for the
test sweep so distant/small persons are also caught. The default 0.4 is
appropriate for the full sweep; 0.25 here was for stress-testing.

The before/after images live under `scripts/.inpaint-test-output/` (gitignored,
worktree-only). Side-by-side renders are referenced relatively below; if you
view this on GitHub they will not resolve — clone the branch locally to see
them.

## Summary table

| # | Filename                  | Decision   | Persons | Area % | Time   |
|---|---------------------------|------------|---------|--------|--------|
| 1 | `IMG20260326132151.jpg`   | inpainted  | 1       |  0.3 % | 13.1 s |
| 2 | `IMG20260325121419.jpg`   | inpainted  | 16      |  6.7 % | 13.4 s |
| 3 | `IMG20260325161408.jpg`   | copied     | 0       |  0.0 % |  0.1 s |
| 4 | `IMG20260329143206.jpg`   | flagged    | 2       | 48.2 % |  0.1 s |
| 5 | `IMG20260325164444.jpg`   | inpainted  | 4       | 21.1 % | 12.2 s |

## Photo 1 — Trieste, Sant'Antonio Nuovo (single small "person")

- Source: `public/photos/trips/2026-03-balkans-roadtrip/IMG20260326132151.jpg`
- Decision: inpainted
- Person count: 1 / Person area: 0.3 % / Runtime: 13 058 ms

| Before | After |
|---|---|
| ![before](../scripts/.inpaint-test-output/IMG20260326132151-before.jpg) | ![after](../scripts/.inpaint-test-output/IMG20260326132151-after.jpg) |

**Verdict: false-positive on a statue.** YOLO flagged one of the classical
sculptures lining the church roofline as a person. LaMa erased it cleanly
(the sky blend is invisible) but the architectural feature is now missing.
The inpaint quality is fine; the detection target was wrong.

## Photo 2 — Ljubljana, Prešeren Square (multiple background people)

- Source: `public/photos/trips/2026-03-balkans-roadtrip/IMG20260325121419.jpg`
- Decision: inpainted
- Person count: 16 / Person area: 6.7 % / Runtime: 13 363 ms

| Before | After |
|---|---|
| ![before](../scripts/.inpaint-test-output/IMG20260325121419-before.jpg) | ![after](../scripts/.inpaint-test-output/IMG20260325121419-after.jpg) |

**Verdict: mixed — orphan-bicycle artifact.** The cobblestone square is
plausibly reconstructed, the buildings' bases blend reasonably, and most of
the 16 detected pedestrians are gone. **However:** YOLO detected the cyclist
but not their bike, so a riderless bicycle is left floating in the foreground
— an obvious giveaway. Same risk applies to people with strollers, suitcases,
dogs, or shopping bags. Future iterations should expand the YOLO mask to
include `bicycle`, `motorcycle`, `dog`, `handbag`, `suitcase` etc. when found
overlapping with a `person` box.

## Photo 3 — Pula harbour (no people — negative test)

- Source: `public/photos/trips/2026-03-balkans-roadtrip/IMG20260325161408.jpg`
- Decision: copied
- Person count: 0 / Person area: 0.0 % / Runtime: 84 ms

| Before | After |
|---|---|
| ![before](../scripts/.inpaint-test-output/IMG20260325161408-before.jpg) | ![after](../scripts/.inpaint-test-output/IMG20260325161408-after.jpg) |

**Verdict: pass.** The "no person" copy-through path works; output is
byte-equivalent to the source. Fast (<0.1 s — detection-only).

## Photo 4 — Trattoria menu in hand (centred dominant person — flagged)

- Source: `public/photos/trips/2026-03-balkans-roadtrip/IMG20260329143206.jpg`
- Decision: flagged (NOT inpainted)
- Person count: 2 / Person area: 48.2 % / Runtime: 79 ms

| Before | After (preserved original)   |
|---|---|
| ![before](../scripts/.inpaint-test-output/IMG20260329143206-before.jpg) | ![after](../scripts/.inpaint-test-output/IMG20260329143206-after.jpg) |

**Verdict: pass.** Hand + arm holding a restaurant menu fill ~48 % of the
frame. The flagged path correctly routed this to
`scripts/.inpaint-test-output/flagged/` with a `.txt` sidecar explaining the
"person dominant" reason. The "after" image above is just the preserved
original (no LaMa run, as designed).

## Photo 5 — Pula, anti-fascist memorial (worst case)

- Source: `public/photos/trips/2026-03-balkans-roadtrip/IMG20260325164444.jpg`
- Decision: inpainted
- Person count: 4 / Person area: 21.1 % / Runtime: 12 246 ms

| Before | After |
|---|---|
| ![before](../scripts/.inpaint-test-output/IMG20260325164444-before.jpg) | ![after](../scripts/.inpaint-test-output/IMG20260325164444-after.jpg) |

**Verdict: catastrophic.** YOLO detected the four bronze sculptures (the
standing partisan figure on top of the obelisk + three writhing figures at
the base) as persons. LaMa erased them, leaving smears of bronze-green
oxidation against the masonry. A war memorial photographed for a travel
gallery has been stripped of its memorial. **This is not safe to ship.**

## Recommended threshold tuning

For the full-sweep run I recommend the following changes vs. the test
defaults:

1. **`--threshold 0.4`** (revert from the 0.25 used in this test). The lower
   threshold catches more genuine pedestrians, but it also surfaces every
   weak false-positive on statues. The default 0.4 is the right floor for
   the full sweep.
2. **`--max-person-area 0.15`** (lower from 0.25). Photo 5 only had 21 %
   "person" area but produced a disastrous result. A 15 % cap routes
   monument shots like that to `flagged/` instead of butchering them. Photo
   2 (6.7 %) and photo 1 (0.3 %) still process. The conservative posture is
   "if the human is visually significant in the frame, ask a human first".
3. **Expand the detection class list to include physical attachments.**
   Photo 2's orphan-bicycle is a structural artifact, not a parameter
   issue. Future iteration: detect `[person, bicycle, motorcycle, dog,
   handbag, backpack, suitcase, umbrella]` and dilate the mask around any
   such object that overlaps a `person` bbox. Out of scope for this PR but
   logged here.
4. **Pre-filter monument photos.** YOLO (COCO-trained) will repeatedly hit
   classical statues, war memorials, and rooftop sculptures. The cheapest
   mitigation is a manual blocklist: any photo from a known monument
   location (Pula amphitheatre, Trieste churches, Vienna, Rome, etc.) bypass
   the inpaint pipeline entirely. The catalogue's `place.display` field
   makes this easy.
5. **Consider a `--require-area-min` floor** (not implemented yet) to skip
   inpainting when the largest detected person box is <0.5 % of the frame.
   That would have skipped photo 1 (the rooftop "statue-person" was 0.3 %),
   avoiding the uncanny invisible erasure on a sky region nobody asked us to
   touch. Tradeoff: it would also skip genuinely tiny background tourists
   that we *might* still want gone.

## Per-photo runtime extrapolation

- Detection-only pass (no person, no inpaint): ~80 ms / photo.
- Full inpaint pass (LaMa on a 720x960..960x1280 image, CPU): ~13 s / photo.
- Mixed assumption (~60 % copied, ~30 % inpainted, ~10 % flagged across
  ~200 photos): roughly 200 × (0.08 + 0.3 × 13) = ~14 minutes for the full
  sweep. Acceptable on Eduard's machine without CUDA.

## Quality concerns for Eduard before the full sweep

- **Statue / monument false positives are systemic.** YOLO11n trained on
  COCO will treat human-shaped sculptures as persons. Any pre-filter must
  exclude obvious monument photos before this pipeline runs.
- **Detached-attachment artifacts.** Bikes, dogs, strollers, luggage left
  behind when their owners are erased. Worse on busy squares than empty
  paths.
- **The pipeline is destructive within the worktree copy.** Originals on
  `G:\` are safe, but the `public/photos/` copies *are* what gets
  overwritten if `--output public/photos/...` is ever used directly. The
  full-sweep invocation should always write to a separate output directory
  and Eduard should review before any commit replaces the originals.

Pending sign-off: do not run the full sweep until Eduard has reviewed photos
1, 2, and especially 5 above and approved the tuned parameters.
