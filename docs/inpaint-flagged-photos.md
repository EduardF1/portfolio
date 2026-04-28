# Inpaint sweep — flagged photos for manual review

Photos where the face occupies more than `--max-face-area` (default 0.15 = 15 %)
of the frame. The pipeline does NOT inpaint these because removing such a large
face would butcher the composition. They are flagged for human review and most
likely belong in `/personal`, not `/travel`.

The pipeline writes the original through to `scripts/.inpaint-staging/flagged/`
with a `.txt` sidecar. The `--apply` step (PR-acceptance pass) does NOT touch
these — they stay on the source photo until Eduard decides per-photo what to do.

## Decision options for each flagged photo

1. **Drop from `/travel`.** If the photo is a portrait/selfie of recognisable
   people, remove the entry from `scripts/photo-catalogue.json` and delete the
   public copy. The original on `G:\` and the local PC is unchanged.
2. **Replace with Pexels stock.** If the trip needs the date covered, swap in a
   stock photo of the same place (see `docs/photo-organization.md` attribution
   rules). Re-run the catalogue build.
3. **Keep with manual crop.** If a tourist accidentally walked too close to the
   camera, crop them out manually in an editor and drop the cropped version
   over the public copy. Then re-run the prescan to confirm the new file no
   longer trips the face-area threshold.
4. **Re-run with a higher threshold.** Only if Eduard is confident the visible
   face is not recognisable; rerun that one photo with
   `--max-face-area 0.20 --face-confidence 0.6 --min-face-area 0.005`.

## Flagged in this sweep

### `trips/2018-03-israel/IMG_20180324_113721.jpg`

- **Detected**: 2 faces, 2 persons.
- **Largest face fraction**: 0.176 (≈ 17.6 % of frame, above the 0.15 threshold).
- **Source size**: 4160 × 3120.
- **Reason**: face is the photo subject; LaMa would erase a recognisable family
  member's portrait and leave a hole in the centre of the composition.
- **Sidecar**: `scripts/.inpaint-staging/flagged/IMG_20180324_113721.jpg.txt`
- **Recommendation**: review with Eduard. The Israel trip carries a privacy
  blocker because family members are visible in many of the photos. This one is
  by far the closest crop, so most likely option 1 (drop from `/travel`) or
  option 2 (replace with a Pexels stock of the same site) is the right call.
  Option 4 is **not recommended** for this photo — the face is large enough that
  identification is trivial even after a crop.
