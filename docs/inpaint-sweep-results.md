# Inpaint Sweep — Review

People-removal review for the inpaint sweep across `public/photos/trips/`.
Tick `[x]` for **Accept**, leave both blank or tick **Reject**, then hand back to the agent.

## Summary

- Total inpainted pairs: **11**
- Trips touched: **4**
- Orphaned staging files (no matching original): **1**
- Before tree: `public/photos/trips`
- After tree: `scripts/.inpaint-staging`
- Thumbnail cache: `public/photos/_inpaint-thumbs` (gitignored)

### Per-trip counts

| Trip slug | Photos in this sweep |
|---|---:|
| `2018-03-israel` | 8 |
| `2019-07-belgium` | 1 |
| `2020-02-denmark` | 1 |
| `2026-03-balkans-roadtrip` | 1 |

### Decision tally (auto-counted from this doc)

After ticking, run `grep -c '\[x\] Accept' <doc>` and `grep -c '\[x\] Reject' <doc>`
to confirm the totals match what you expect before the apply step.

## Orphaned staging files

These files exist under the after-tree but have no matching original in the
before-tree. Likely leftovers from a previous sweep. Investigate before merging.

- `flagged/IMG_20180324_113721.jpg`

## Pairs by trip

### 2018-03-israel

| Filename | Before | After | Sign-off |
|---|---|---|---|
| `IMG_20180323_113715.jpg` | ![before](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180323_113715.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180323_113715.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |
| `IMG_20180323_113718.jpg` | ![before](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180323_113718.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180323_113718.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |
| `IMG_20180323_114017.jpg` | ![before](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180323_114017.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180323_114017.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |
| `IMG_20180323_115533.jpg` | ![before](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180323_115533.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180323_115533.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |
| `IMG_20180324_121638.jpg` | ![before](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180324_121638.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180324_121638.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |
| `IMG_20180324_130102.jpg` | ![before](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180324_130102.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180324_130102.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |
| `IMG_20180324_130414.jpg` | ![before](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180324_130414.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180324_130414.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |
| `IMG_20180325_135940.jpg` | ![before](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180325_135940.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2018-03-israel__IMG_20180325_135940.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |

### 2019-07-belgium

| Filename | Before | After | Sign-off |
|---|---|---|---|
| `IMG_20190731_153659.jpg` | ![before](../public/photos/_inpaint-thumbs/2019-07-belgium__IMG_20190731_153659.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2019-07-belgium__IMG_20190731_153659.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |

### 2020-02-denmark

| Filename | Before | After | Sign-off |
|---|---|---|---|
| `pexels-horsens-aerial-architecture-13519043.jpg` | ![before](../public/photos/_inpaint-thumbs/2020-02-denmark__pexels-horsens-aerial-architecture-13519043.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2020-02-denmark__pexels-horsens-aerial-architecture-13519043.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |

### 2026-03-balkans-roadtrip

| Filename | Before | After | Sign-off |
|---|---|---|---|
| `IMG20260327115726.jpg` | ![before](../public/photos/_inpaint-thumbs/2026-03-balkans-roadtrip__IMG20260327115726.before.jpg) | ![after](../public/photos/_inpaint-thumbs/2026-03-balkans-roadtrip__IMG20260327115726.after.jpg) | `[ ]` Accept<br>`[ ]` Reject |
