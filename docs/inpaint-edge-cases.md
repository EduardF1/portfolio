# Inpaint pipeline — 20-photo edge-case test corpus

> Companion to PR #41 (`feat/inpaint-people-pipeline`). The 5-photo set in
> `docs/inpaint-test-results.md` validated v1 → v2 (face-detection-gated) on
> the obvious cases. This corpus extends the test surface to the
> ambiguous / threshold-sensitive shots that determine whether the v2
> rewrite is safe to run as a sweep over `public/photos/trips/`.
>
> **Do not run yet.** PR #41's pipeline rewrite (face-detection trigger) is
> still in flight. Once that lands and the parallel agent confirms the
> 5-photo retest passes, run the script in §3 to reproduce these 20 results
> for round-2 sign-off.

## Goal

Find the photos where the v2 face-gated decision tree is most likely to
disagree with Eduard's intuition — so the round-2 review focuses on those
20 outputs rather than the ~200-photo full sweep.

For each photo we record the **predicted** decision (`COPY`, `INPAINT`,
`FLAGGED`) so a single diff against `_inpaint-log.ndjson` after the run
tells us instantly which photos surprised us.

## Pipeline recap (v2, from PR #41)

| Condition (per photo) | Action |
| --- | --- |
| 0 qualifying faces (confidence > 0.6 AND face area > 0.5 % of frame) | **COPY** through unchanged |
| largest qualifying face > 15 % of frame | **FLAGGED** for human review (sidecar) |
| otherwise (≥1 qualifying face below threshold) | **INPAINT** union of containing person bboxes |

Defaults: `--face-confidence 0.6 --min-face-area 0.005 --max-face-area 0.15
--threshold 0.4 --mask-dilate 12`.

## The 20 photos

| # | src | Trip / place | Edge-case category | Predicted | Notes — what to verify in the output |
|---|---|---|---|---|---|
|  1 | `public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250413162629.jpg` | Vienna, Austria — Heeresgeschichtliches Museum | Person walking away (no face visible) | COPY | Subject is back-to-camera near WWI aero engine. MediaPipe should NOT trigger; YOLO will see a `person` bbox but with no face the decision is COPY. If pipeline inpaints, it means the face-gated trigger silently fell through to the v1 person-area fallback — that's a regression. |
|  2 | `public/photos/trips/2026-03-balkans-roadtrip/IMG20260328135215.jpg` | Dachau Memorial, Germany | Person walking away (back to camera, edge-cropped) | COPY | Visitor at right edge, no face exposed. Same expectation as #1; additional twist: half the body is outside the frame, so YOLO's `person` bbox will be partial. Verify mask doesn't bleed past right edge. |
|  3 | `public/photos/trips/2018-03-israel/IMG_20180323_115533.jpg` | Yardenit (Sea of Galilee), Israel | Person with sunglasses (eyes occluded) | INPAINT | Eduard, smiling, dark sunglasses covering eyes. BlazeFace has degraded performance on full-eye occlusion — confidence may dip below 0.6 and trigger COPY (false-negative). Watch for: face NOT detected → photo passes through with Eduard still in it. If inpainted: confirm the mural behind survives (text + crowns). |
|  4 | `public/photos/trips/2018-03-israel/IMG_20180324_130051.jpg` | Rosh HaNikra direction sign, Israel | Sunglasses + cap (combined occlusion) + 2 people side-by-side | INPAINT | One subject wears red sunglasses + black cap (eyes + forehead occluded), other is bare-faced. Two faces, two YOLO person bboxes that ALMOST touch — verify the mask UNION covers both bodies cleanly without leaving an arm or shoulder behind. |
|  5 | `public/photos/trips/2018-03-israel/IMG_20180323_113715.jpg` | Yardenit, Israel | Half-face / 3-quarter profile | INPAINT or FLAGGED | Subject seated, gaze cast 90° to the right. Profile faces are MediaPipe's weakest mode (BlazeFace is frontal-tuned). If detected: face area is ~5 % of frame so should INPAINT (not flagged). Watch for stairs + handrail reconstruction quality. |
|  6 | `public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250416162110.jpg` | Slovakia mountain hut | Half-face (top of frame cuts above mouth) | COPY or FLAGGED | Face is cropped just above the lips — MediaPipe needs both eyes + nose visible. Likely no detection → COPY. If detected, the visible-face fragment is small, likely below 0.15 → INPAINT. The "uncertain" outcome here is what makes this a useful test. |
|  7 | `public/photos/trips/2018-03-israel/IMG_20180323_114017.jpg` | Yardenit, Israel | Children + adults mixed (3 subjects) | INPAINT | Adult + 2 younger faces, all front-facing, all clearly visible. All three should trigger detection and the inpaint mask must union all 3 person bboxes. Verify the river + foliage behind reconstruct without ghost-arms. |
|  8 | `public/photos/trips/2018-03-israel/IMG_20180324_114159.jpg` | Rosh HaNikra coastline, Israel | Distant crowd (figures < 0.5 % of frame) | COPY | Tiny silhouettes on the path along the cliffs. Each face is well below the 0.5 % `--min-face-area` floor. Should COPY. If a single face squeaks past the threshold, the photo would inpaint and create a noticeable patch on the cliff path — flag for tuning. |
|  9 | `public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250413180630.jpg` | Schönbrunn Palace, Vienna | Distant crowd at palace + one closer figure | COPY (borderline) | Most tourists are sub-threshold, but one figure in the foreground-right is closer to the camera. Verify whether that single face crosses 0.5 %. If it does and triggers an inpaint, the gravel + grass should reconstruct cleanly. |
| 10 | `public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250416135247.jpg` | SNP Museum, Banská Bystrica | Distant pair walking on path | COPY | Two figures on the path are well sub-threshold. Sanity-check the threshold isn't accidentally tuned too low. |
| 11 | `public/photos/trips/2025-09-andalusia-gibraltar/IMG20250915170432.jpg` | Gibraltar — Burma Stores Central tunnel sign | Photographer's reflection (silhouette / shadow on glass) | COPY | Eduard's silhouette is reflected in the museum vitrine glass. No face is recognisable — only the head + shoulders shadow shape. Should COPY. If MediaPipe somehow latches onto the silhouette, the artefact glass + sign would corrupt — that's a false positive worth catching. |
| 12 | `public/photos/trips/2023-07-turkey/IMG_20230715_165617.jpg` | Istanbul (New Mosque, taxi window) | Photographer's reflection on car windshield + driver inside | COPY or INPAINT | Mosque shot through a windshield. Faint figure reflected in glass + a driver visible inside the parked car ahead. Either of those could trigger MediaPipe at low confidence. If it inpaints, the licence plate + mosque arches must survive. |
| 13 | `public/photos/trips/2018-03-israel/IMG_20180324_130414.jpg` | Rosh HaNikra checkpoint | Person in protective gear (soldier — beret, plate carrier, rifle) + civilian alongside | INPAINT | Two subjects: soldier in maroon beret, plate carrier and slung rifle; civilian beside him, no gear. Soldier's face is fully visible (beret doesn't occlude). Both should trigger. Watch for: the rifle and tactical gear should be erased *with* the soldier (one mask) — not orphaned like the v1 Ljubljana bicycle bug. |
| 14 | `public/photos/trips/2025-04-czechia-poland-slovakia-austria/IMG20250413154619.jpg` | Vienna museum — Napoleonic uniform display | Mannequins in helmets (stylised painted faces, glass case) | COPY | Three full-uniform mannequins behind glass with cast/painted faces (flat skin tones, no proper eyes). MediaPipe is tuned for live human skin + features — should not trigger. If it does, the historic uniforms get destroyed — a clear bug. Falls under the same family as the bronze-statue v1 regression. |
| 15 | `public/photos/trips/2026-03-balkans-roadtrip/IMG20260326132151.jpg` | Trieste — chiesa di Sant'Antonio Taumaturgo (rooftop saints) | Statues with realistic faces (the v1 false-positive scene) | COPY | The exact rooftop saints that the v1 YOLO-only pipeline destroyed. v2's whole reason to exist is to leave these alone. If MediaPipe triggers on a single rooftop saint here, the rewrite has not solved the original bug. **Hard fail if any face is detected.** |
| 16 | `public/photos/trips/2025-02-finland/IMG20250222175401.jpg` | Helsinki — Senate Square, Alexander II monument | Bronze statues (multiple realistic faces, dusk lighting) | COPY | Same family as #15 but bronze rather than stone, dusk light, plus the rooftop saints on the cathedral above. Bronze + dusk push toward the limits of "non-living face". If any of the four bronze allegorical figures trigger, the monument blocklist (parallel agent) is the safety net. |
| 17 | `public/photos/trips/2025-09-andalusia-gibraltar/IMG20250917160439.jpg` | Málaga Cathedral — chapel with saint statues in niches | Stone statues with realistic faces, indoor lighting | COPY | Polychrome wood / stone saints in niches. Skin tones are warm + lit. Higher false-positive risk than #15 (cooler bronze) or #16 (dusk). If MediaPipe triggers, the niches + grille + altar must not be ruined. |
| 18 | `public/photos/trips/2023-08-romania/IMG20230826122922.jpg` | Peleș Castle, Sinaia | Stone face on garden fountain (foreground) + distant tourists | COPY | Foreground fountain has a carved human face spitting water. Distant tourists are sub-threshold. Both should be sub-trigger. If the carved fountain face triggers, the foreground gets a hole punched in it — visible in the hero shot. |
| 19 | `public/photos/trips/2025-09-andalusia-gibraltar/IMG20250914201512.jpg` | Playa de La Herradura, Andalusia | Backlit silhouettes at sunset | COPY | Three silhouettes on the beach, sun behind them — facial features absent / black. MediaPipe should not detect (no skin tones, no eye landmarks). Should COPY. If it inpaints, the sunset reflection on the wet sand would be corrupted — a clear visual regression. |
| 20 | `public/photos/trips/2018-03-israel/IMG_20180325_135940.jpg` | Greek Orthodox church interior, Israel | 2 people side-by-side (group hug / shoulder-to-shoulder) + religious icons with painted faces in iconostasis | INPAINT | Two living subjects in front, dozens of painted icon faces behind. Living faces should detect → INPAINT; painted icon faces should NOT detect. Mask union must cover both bodies and NOT extend into the iconostasis. Twin failure modes: (a) icon faces trigger and destroy the iconostasis, (b) the two person bboxes overlap and only one gets erased ("ghost shoulder" left behind). |

## Category coverage

| Category | Count | Photo numbers |
| --- | ---: | --- |
| Person walking away (no face visible) | 2 | 1, 2 |
| Sunglasses (± hat) | 2 | 3, 4 |
| Half-faces (profile / partial / cropped) | 2 | 5, 6 |
| Children + adults mixed | 1 | 7 |
| Distant crowds (faces < 0.5 % of frame) | 3 | 8, 9, 10 |
| Photographer's reflection / shadow | 2 | 11, 12 |
| Person in protective gear (beret + tactical / mannequin helmets) | 2 | 13, 14 |
| Statues with realistic faces (stone / bronze / polychrome) | 4 | 15, 16, 17, 18 |
| Backlit silhouette people | 1 | 19 |
| Multiple person bboxes overlapping (group hug / side-by-side) | 1 | 20 |
| **Total** | **20** | |

(#4 also doubles as side-by-side, #18 also doubles as distant crowd, #20
also tests painted icon faces — but each photo is counted once in its
primary category to keep the table honest.)

## Predicted-outcome distribution

| Outcome | Count | Photos |
| --- | ---: | --- |
| `COPY` (face-gated trigger does not fire) | 14 | 1, 2, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, plus 6, 12 most-likely |
| `INPAINT` (faces present, none > 15 % of frame) | 6 | 3, 4, 5, 7, 13, 20 |
| `FLAGGED` (largest face > 15 %, kicked to human review) | 0 (intentional) | — |

`FLAGGED` is intentionally absent: that bucket is well-covered by the
existing 5-photo set and the planned full sweep — close-up portraits in
`/personal/` will trigger it cleanly. The risk surface this corpus targets
is the boundary between `COPY` and `INPAINT`.

## How to run (after PR #41 lands)

The script `scripts/inpaint-edge-test.ps1` reads
`scripts/inpaint-edge-cases.json` (sidecar of this doc, same 20 paths) and
invokes the v2 Python pipeline once per photo. Outputs land in
`scripts/.inpaint-edge-output/` (gitignored). The script prints a
markdown listing of each photo's before / after status + size + decision
parsed from the JSONL log.

```pwsh
# Activate the inpaint venv first (PR #41 ships it):
scripts\.inpaint-venv\Scripts\Activate.ps1

# Then run the corpus:
pwsh scripts\inpaint-edge-test.ps1
```

The script does NOT auto-deploy or auto-commit. It prints a summary and a
diff between the predicted column above and the actual `decision` field
from `_inpaint-log.ndjson`. Eduard reviews the surprises by eye before
green-lighting the full sweep.
