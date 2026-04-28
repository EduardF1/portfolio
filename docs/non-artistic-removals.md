# Non-artistic photo removals

Eduard's portfolio is artistic — good-looking places and dishes. Cat photos
(especially Eduard's cat Teddy) and dog photos do not fit. This file logs
photos removed from `public/photos/trips/` and the catalogue under that
policy.

Files are **moved**, not deleted, to `scripts/.removed-non-artistic/<trip>/`
so any false positive can be reinstated by reverse-applying the rename.

## Detection

- Tool: `scripts/cat-dog-scan.py` (YOLO11n, COCO classes 15 = cat / 16 = dog).
- Threshold: 0.5 confidence.
- Audit log: `scripts/.cat-dog-scan.ndjson` (per-photo) and
  `scripts/.cat-dog-scan.json` (summary).

## Round 1 — 2026-04-28

3 photos removed across 2 trips.

| Filename | Trip | Removed reason | Suggested action |
| --- | --- | --- | --- |
| `IMG20250915131621.jpg` | `2025-09-andalusia-gibraltar` | dog conf 0.91 (Gibraltar Barbary macaque — YOLO misclassified as dog; the photo is an animal portrait either way) | Removed: artistic-portfolio policy |
| `IMG20260319141400.jpg` | `2026-03-balkans-roadtrip` | cat conf 0.91 (calico cat in foreground, indoor) | Removed: artistic-portfolio policy |
| `IMG20260329234655.jpg` | `2026-03-balkans-roadtrip` | dog conf 0.85 (grey cat sleeping; YOLO misclassified as dog — likely Teddy) | Removed: artistic-portfolio policy |

Per-trip totals:

| Trip | Removed |
| --- | --- |
| `2025-09-andalusia-gibraltar` | 1 |
| `2026-03-balkans-roadtrip` | 2 |

### Class-label notes

YOLO11n confused a Barbary macaque ("monkey") for a dog and a grey cat for a
dog. The class-id was wrong in those two cases, but the keep/remove decision
under the artistic-portfolio policy is still correct: all three photos depict
animals as primary subject and do not depict places or dishes.

## Recovery

To re-introduce a photo Eduard wants kept after review, reverse the move:

```bash
git mv scripts/.removed-non-artistic/<trip>/<file>.jpg \
       public/photos/trips/<trip>/<file>.jpg
```

Then re-add the matching entry to `scripts/photo-catalogue.json` (use
`git log -p scripts/photo-catalogue.json` to find the dropped entry).
