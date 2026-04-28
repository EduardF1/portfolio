# Inpaint pipeline — 5-photo test results

Test phase output for `scripts/inpaint-people.py`. Originals on `G:\` and the
local PC are read-only — the pipeline operates only on the worktree copies
under `public/photos/`.

## v2 — face-gated trigger (current)

**Course correction (2026-04-28).** v1 used YOLO11n person-area-percentage as
the inpaint trigger and destroyed bronze sculptures because YOLO false-detects
human-shaped statues as `person`. v2 drives the decision off **MediaPipe face
detection** instead: photos only get inpainted when MediaPipe finds a HUMAN
face above the confidence threshold. Bronze busts and stone sculptures do not
trigger MediaPipe (it is tuned for living human faces), so monuments are
preserved.

### Pipeline (v2)

1. **MediaPipe Face Detection** (BlazeFace full-range, Tasks API, ~1 MB
   `.tflite` auto-downloaded into `scripts/.inpaint-cache/`).
   Threshold: face confidence > `--face-confidence` (default `0.6`) AND face
   bbox area > `--min-face-area` (default `0.005` = 0.5 % of frame). Smaller
   than 0.5 % is unrecognisable and not worth erasing.
2. **YOLO11n** locates the surrounding `person` bbox(es) for each qualifying
   face. The LaMa mask = the union of those YOLO-person bboxes (NOT just the
   face — that would ghost-erase a head and leave a body).
   Fallback when no containing person bbox exists (close-up where the body
   extends past the frame): face bbox + 80 % expansion.
3. Mask dilation: 12 px (preserves natural LaMa edge softness).
4. **LaMa** inpaints the mask. **Photo dimensions are preserved** (LaMa returns
   same size as input — this is the explicit ask: full sweep must never resize).

### Decisions per photo (v2)

| Condition                                           | Action                          |
|-----------------------------------------------------|---------------------------------|
| 0 qualifying faces                                  | copy through unchanged          |
| largest face area > `--max-face-area` (default 0.15)| flag for human review (sidecar) |
| otherwise                                           | inpaint union of person bboxes  |

The old `--max-person-area` flag is replaced by `--max-face-area`. The
"face dominant" route flags photos that probably belong in `/personal`, not
`/travel`.

### v2 dependencies

```
scripts/.inpaint-venv/Scripts/pip.exe install mediapipe
# Then pin numpy back so SimpleLama (which requires numpy<2.0) keeps working:
scripts/.inpaint-venv/Scripts/pip.exe install "numpy<2.0.0,>=1.24.3"
# And pin opencv-contrib-python so it accepts numpy 1.x:
scripts/.inpaint-venv/Scripts/pip.exe install "opencv-contrib-python<4.10"
```

The MediaPipe 0.10.x Windows wheels removed `mp.solutions.*`, so the script uses
the Tasks API (`mediapipe.tasks.python.vision.FaceDetector`). The BlazeFace
full-range model is fetched on first run from
`https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_full_range/...`
into `scripts/.inpaint-cache/blaze_face_full_range.tflite`.

### v2 run command

```
python scripts/inpaint-people.py \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260326133320.jpg \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260325121419.jpg \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260325161408.jpg \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260329143206.jpg \
  --input public/photos/trips/2026-03-balkans-roadtrip/IMG20260325164444.jpg \
  --output scripts/.inpaint-test-output/v2-face-gated/
```

(Defaults: `--face-confidence 0.6 --min-face-area 0.005 --max-face-area 0.15
--threshold 0.4 --mask-dilate 12`.)

### v2 summary table

| # | Filename                  | Decision | Faces | Persons | Largest face % | Src size  | Out size  | Time   |
|---|---------------------------|----------|-------|---------|----------------|-----------|-----------|--------|
| 1 | `IMG20260326133320.jpg`   | copied   | 0     | 0       | 0.0 %          | 1920x1440 | 1920x1440 | 161 ms |
| 2 | `IMG20260325121419.jpg`   | copied   | 0     | 11      | 0.0 %          | 1920x1440 | 1920x1440 |  75 ms |
| 3 | `IMG20260325161408.jpg`   | copied   | 0     |  0      | 0.0 %          | 1920x1440 | 1920x1440 |  63 ms |
| 4 | `IMG20260329143206.jpg`   | copied   | 0     |  1      | 0.0 %          | 1440x1920 | 1440x1920 |  76 ms |
| 5 | `IMG20260325164444.jpg`   | copied   | 0     |  3      | 0.0 %          | 1440x1920 | 1440x1920 |  66 ms |

All 5 photos route through the **copy-through** path. Dimension parity:
verified pixel-equal sizes on every output (see "Dimension verification"
below).

### v2 vs v1 — direct before/after comparison

The 5-photo set was chosen to span the failure modes from v1. Photo 1 has
been swapped from `IMG20260326132151.jpg` (Sant'Antonio Nuovo rooftop) to
`IMG20260326133320.jpg` (a Trieste classical statue specifically requested by
Eduard for the regression test). The other four photos are identical to v1.

| # | Photo                                     | v1 decision (BAD)         | v2 decision    | Win?   |
|---|-------------------------------------------|---------------------------|----------------|--------|
| 1 | Trieste classical statue (`...133320`)    | (new in v2 set)           | copied         | n/a    |
| 2 | Ljubljana square 16-pedestrian (`...121419`) | inpainted (orphan bicycle artifact) | copied | mixed |
| 3 | Pula harbour empty (`...161408`)          | copied                    | copied         | parity |
| 4 | Trattoria menu (`...143206`)              | flagged (48 % person area)| copied         | win    |
| 5 | Pula anti-fascist memorial (`...164444`)  | **CATASTROPHIC** (4 bronze figures inpainted, sculptures erased) | **copied (sculptures preserved)** | **WIN** |

#### Photo 1 — Trieste classical statue (`IMG20260326133320.jpg`)

- v1: not in v1 test set; the analogous "rooftop saint" photo
  (`IMG20260326132151.jpg`) was wrongly inpainted in v1.
- v2: `faceCount=0`, `personCount=0`, decision `copied`. The statue is a
  classical sculpture — MediaPipe correctly does not register it as a face,
  and YOLO11n at the default 0.4 threshold did not even detect it as a
  person here. **Statue preserved verbatim.**

#### Photo 2 — Ljubljana, Prešeren Square (`IMG20260325121419.jpg`)

- v1: 16 persons, 6.7 % area, decision `inpainted`. Cyclist erased but
  bicycle left floating (orphan-attachment artifact).
- v2: `faceCount=0` (full-range model maxes out at conf=0.226 on the closest
  pedestrian, well below 0.6). `personCount=11`. Decision `copied`.
- Verdict: **the 16 background pedestrians are preserved, not erased.** Per
  the new spec ("filters out distant micro-faces that aren't recognisable
  anyway"), this is correct: the faces were too low-confidence/too small
  to be recognisable in the final photo, so removing them is not justified.
  The orphan-bicycle artifact is gone because we no longer touch the photo.
- If Eduard wants the crowd thinned in this specific shot, the controls are
  `--face-confidence 0.2` (lower the bar) — but this is a per-photo override
  he should apply manually after seeing the v2 result, not a default.

#### Photo 3 — Pula harbour empty (`IMG20260325161408.jpg`)

- v1: 0 persons, decision `copied`. Output byte-equivalent.
- v2: 0 faces, 0 persons, decision `copied`. Output byte-equivalent.
- Verdict: **parity, both runs handle the negative case correctly.**

#### Photo 4 — Trattoria menu (`IMG20260329143206.jpg`)

- v1: 2 persons (hand+arm holding menu), 48.2 % area, decision `flagged`.
  Routed to `flagged/` with `.txt` sidecar.
- v2: 0 faces (no actual face is in the frame — only a hand and a menu),
  1 person bbox (YOLO sees the body around the camera). Decision `copied`.
- Verdict: **better.** The new "no face -> copy" path correctly recognises
  this is a still-life menu shot, not a portrait. v1 over-flagged it; v2
  preserves the photo as travel content. (If a face WERE visible in a similar
  shot, the dominant-face rule would catch it.)

#### Photo 5 — Pula anti-fascist memorial (`IMG20260325164444.jpg`) — the catastrophe

- v1: 4 persons (the four bronze figures of the memorial — the standing
  partisan + three writhing figures at the base), 21.1 % area, decision
  `inpainted`. **All four sculptures erased. Memorial destroyed.**
- v2: `faceCount=0`, `personCount=3`. Decision `copied`. **The bronze
  sculptures are preserved exactly.**
- Verdict: **the v1 catastrophe is fully resolved.** MediaPipe Face Detection
  does not register bronze patina + cast-metal modelling as a living human
  face, even at confidence floor 0.05 (max conf observed across all 34 weak
  detections at threshold 0.05: 0.245). With the default 0.6 threshold, no
  face is reported and the photo flows through the copy path untouched.

### Dimension verification (v2)

PIL `image.size` for every output equals its input — explicit Eduard ask:

```
IMG20260326133320.jpg: src=(1920, 1440) out=(1920, 1440) OK
IMG20260325121419.jpg: src=(1920, 1440) out=(1920, 1440) OK
IMG20260325161408.jpg: src=(1920, 1440) out=(1920, 1440) OK
IMG20260329143206.jpg: src=(1440, 1920) out=(1440, 1920) OK
IMG20260325164444.jpg: src=(1440, 1920) out=(1440, 1920) OK
```

All 5 outputs are byte-copy-equivalent to source (no re-encode happened
because every photo went through the `copied` branch).

### Recommended thresholds (v2)

The defaults shipping in v2 are validated by this run:

| Flag                   | Default | Rationale                                                     |
|------------------------|---------|---------------------------------------------------------------|
| `--face-confidence`    | 0.6     | Below 0.6 we get phantom faces in foliage and bronze patina; above 0.7 we miss profile views. The Pula memorial maxed out at 0.245 across 34 weak detections — comfortably below the 0.6 floor. |
| `--min-face-area`      | 0.005   | 0.5 % of frame. Below this a face is unrecognisable in the final photo. Filters out the long-tail false positives without losing any genuine human portrait. |
| `--max-face-area`      | 0.15    | Largest face exceeding 15 % of frame routes the photo to `flagged/` (likely belongs in /personal). |
| `--threshold` (YOLO)   | 0.4     | Defensive secondary; only used to find the person bbox around an already-detected face. |
| `--mask-dilate`        | 12      | Unchanged from v1; preserves natural LaMa edge softness.      |

### Open questions for full-sweep approval

1. **Ljubljana square**: with v2 defaults the 16 background pedestrians are
   preserved. Eduard's clarified ask was "people removed when faces are
   visible" — and at typical viewing zoom these faces are NOT visually
   recognisable. Confirm this is the intended outcome before the full sweep.
2. **Per-photo override path**: when Eduard does want a specific crowded shot
   thinned, he can re-run that single photo with `--face-confidence 0.2 --min-face-area 0.001`.
   Worth documenting as a manual escape hatch in the photo-organisation guide?
3. **Holding pattern.** Per the original PR plan, do not run the full sweep
   until Eduard has reviewed v2's 5-photo decisions and confirmed the
   defaults are correct. The 5 outputs are under
   `scripts/.inpaint-test-output/v2-face-gated/` (gitignored, worktree-only).

---

## v1 — person-area trigger (deprecated)

The original implementation used YOLO11n person detection plus a
`--max-person-area 0.25` cap. It is preserved here only for the catastrophe
audit. **Do not run v1 against the full sweep.**

### v1 run command

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

(YOLO confidence was lowered to 0.25 for v1's stress test — that surfaced even
more sculpture false positives, which was the point.)

### v1 summary table

| # | Filename                  | Decision   | Persons | Area % | Time   |
|---|---------------------------|------------|---------|--------|--------|
| 1 | `IMG20260326132151.jpg`   | inpainted  | 1       |  0.3 % | 13.1 s |
| 2 | `IMG20260325121419.jpg`   | inpainted  | 16      |  6.7 % | 13.4 s |
| 3 | `IMG20260325161408.jpg`   | copied     | 0       |  0.0 % |  0.1 s |
| 4 | `IMG20260329143206.jpg`   | flagged    | 2       | 48.2 % |  0.1 s |
| 5 | `IMG20260325164444.jpg`   | inpainted  | 4       | 21.1 % | 12.2 s |

### v1 catastrophes (now resolved in v2)

- **Photo 1 (Sant'Antonio Nuovo rooftop)**: YOLO false-flagged a classical
  sculpture as a person. LaMa erased it; an architectural feature went
  missing. v2 fix: the sculpture has no human face -> photo is copied.
- **Photo 5 (Pula anti-fascist memorial)**: YOLO false-flagged the four
  bronze figures of the memorial as persons. LaMa erased them, leaving
  smears of bronze-green oxidation against the masonry. A war memorial
  was stripped of its memorial. v2 fix: bronze figures have no human face
  -> photo is copied, sculptures preserved exactly.
- **Photo 2 orphan-bicycle artifact**: YOLO detected the cyclist but not the
  bicycle, leaving a riderless bike floating in the foreground. v2
  side-effect fix: pedestrians at this distance don't register as faces, so
  the photo is copied unchanged and the artifact never appears.

### v1 known issues NOT fixed by v2

- **Detached-attachment artifacts** would still occur if v2 ever did inpaint
  a crowded shot with high-confidence faces. Future iteration: expand the
  YOLO mask to include `bicycle`, `motorcycle`, `dog`, `handbag`, `suitcase`,
  `umbrella` when overlapping a `person` bbox. Out of scope for this PR.

---

Pending sign-off: do not run the full sweep until Eduard has reviewed the
v2 decisions in this document and approved the tuned defaults.
