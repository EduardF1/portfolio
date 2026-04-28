# Inpaint sweep verification — Israel 2018

**Run date:** 2026-04-29 (Round 1 sibling sweep PR `feat/inpaint-sweep-v1`)
**Verifier:** Architect sub-agent (independent re-run + per-photo audit)
**Branch:** `docs/inpaint-israel-verify`
**Photos verified:** 9 (highest face density per `inpaint-prescan` — Eduard's family is in some of these; privacy-critical)
**Verdict:** **HOLD — DO NOT MERGE the sweep PR for Israel section.**

---

## Sibling-PR status

The sibling agent's branch `feat/inpaint-sweep-v1` has not been pushed to GitHub
and no PR was found within the polling window. Verification therefore ran
**fallback path**: pipeline re-executed locally on the 9 Israel target photos
in `scripts/.inpaint-staging-israel-only/`, then verified per spec.

## Verification harness

- Re-run face detection on AFTER images using the **same MediaPipe BlazeFace
  full-range model** the pipeline uses, but at a **lower threshold of 0.5**
  (vs the pipeline default 0.6) — Eduard wants paranoia-grade thoroughness so
  faint residual faces still trip.
- SSIM (greyscale, `data_range=255`) computed via `scikit-image
  structural_similarity` between BEFORE and AFTER. Interpretation:
  - `< 0.7` → LaMa hallucinated too much (REJECT)
  - `0.7 – 0.97` → expected range for healthy inpaint
  - `> 0.999` → no actual change (silent failure; REJECT)
- 100×100 crops of the inpainted region (top / mid / bottom anchors of the
  pixel-diff bbox) saved to `scripts/.inpaint-staging-israel-only/crops/` and
  visually inspected for LaMa artifacts (grey blocks, colour bleeds, ghost
  outlines).
- Cross-check: none of the 9 Israel photos appear in
  `scripts/inpaint-blocklist.json` — config is correct.

## Per-photo verdict

| # | Filename | Dimensions | Before faces | After faces | SSIM | Pipeline result | Decision | Rationale |
|---|----------|-----------|--------------|-------------|------|-----------------|----------|-----------|
| 1 | IMG_20180323_113715.jpg | 3456×4608 | n/a | n/a | n/a | **error (LaMa OOM, 16 GB alloc)** | **REJECT** | LaMa needs ~16 GB RAM at full Pixel-2 resolution; allocator threw `not enough memory: 16329453888 bytes`. No AFTER produced. |
| 2 | IMG_20180323_113718.jpg | 3456×4608 | n/a | n/a | n/a | **error (LaMa OOM)** | **REJECT** | Same OOM as #1. No AFTER produced. |
| 3 | IMG_20180323_114017.jpg | 2448×3264 | 3 | 0 | 0.769 | inpainted | **REJECT (visual)** | 0 residual faces, SSIM in range, BUT visual inspection of full image shows a large flat grey block where the three subjects stood (River Jordan baptism scene). LaMa fell back to low-detail blur instead of plausible water/foliage. Bottom crop stddev = 3.53 (uniform grey). Privacy ✅ but image unusable for `/travel`. |
| 4 | IMG_20180323_115533.jpg | 2448×3264 | 1 | 0 | 0.849 | inpainted | **REJECT (visual)** | 0 residual faces. Mosaic-wall scene; AFTER shows a grey vertical smear over the hedge / lower wall. Less catastrophic than #3 but still visibly artificial. |
| 5 | IMG_20180324_113721.jpg | 4160×3120 | 2 | 2 | 1.000 | flagged (face >15% of frame) | **REJECT** | Pipeline correctly refused to inpaint (face is the subject, would butcher composition) and routed to `flagged/`, where it sits unmodified. Two faces still present at conf 0.81 + 0.71. Privacy violation if shipped as-is. Belongs in `/personal`, not `/travel`. |
| 6 | IMG_20180324_121638.jpg | 3264×2448 | 3 | 0 | 0.781 | inpainted | **REJECT (visual)** | 0 residual faces, but the most catastrophic visual outcome of the three: huge double-rectangle grey block over the seaside scene. Mid-crop stddev = 3.24 (essentially flat grey). |
| 7 | IMG_20180324_130102.jpg | 4608×3456 | n/a | n/a | n/a | **error (LaMa OOM)** | **REJECT** | OOM. No AFTER. |
| 8 | IMG_20180324_130414.jpg | 4608×3456 | n/a | n/a | n/a | **error (LaMa OOM)** | **REJECT** | OOM. No AFTER. |
| 9 | IMG_20180325_135940.jpg | 4608×3456 | n/a | n/a | n/a | **error (LaMa OOM)** | **REJECT** | OOM. No AFTER. |

## Summary

- **OK: 0 / 9**
- **REJECT: 9 / 9**
  - 5 × pipeline OOM error (any photo at 4608×3456 fails on this machine)
  - 1 × correctly flagged but face-bearing (no inpaint)
  - 3 × inpainted with 0 residual faces (privacy ✅) but visually destroyed by
    LaMa flat-grey artifact (`/travel` unsuitable)

## Root causes

1. **LaMa OOM at full resolution.** All five OOM photos are 4608×3456 (15.9 MP).
   `simple-lama-inpainting` runs the FFC convolution at native resolution and
   blew past 16 GB alloc on this machine. The pipeline currently has no
   downscale-then-upscale path. **Pipeline change needed before any 4608×3456
   photo can sweep.**

2. **LaMa quality on large masks.** Even when LaMa ran (3 photos at 2448×3264
   or 3264×2448), the union-of-person-bbox mask is too large for LaMa to fill
   plausibly — it falls back to blurred-grey. The 0.5–3% face areas drove
   `personCount`-aligned masks of 10–30% of the frame. LaMa is not designed
   for deletions of this scale.

## Recommendation

**Do not greenlight the sweep PR for the Israel section. Pick one path:**

### Option A (preferred for `/travel` artistic intent) — **drop the 9 photos**

Remove all 9 Israel face-bearing photos from `public/photos/trips/2018-03-israel/`
and from the `/travel` Israel page. The remaining 5 face-clean Israel photos
(IMG_20180324_114159, IMG_20180324_121517, IMG_20180324_130051, IMG_20180325_131135,
IMG_20180325_131138 — clean per prescan) are sufficient for the section. Privacy ✅,
zero LaMa risk, zero family exposure.

### Option B (if more Israel coverage is required) — **swap for Pexels stock**

Curate 4-6 Pexels Israel travel photos (Sea of Galilee, Jordan River, Tiberias,
old-Jerusalem alleys) and add them via the existing stock-photo flow. Tag with
`pexels-` prefix and update `photo-catalogue.json` with attribution.

### Option C (only if Eduard insists on these specific photos) — **manual GIMP/Photoshop hand-fix**

Per photo: clone-stamp the people out using surrounding scenery as source.
~15-30 min per photo at full res. Recommended on:
- IMG_20180323_114017 (river scene with clean water/foliage to clone from)
- IMG_20180324_121638 (seaside, clean horizon and water)

Not recommended for OOM photos until pipeline gains tile-based or downscaled
LaMa pass.

## Action taken on the sweep PR

Sibling PR `feat/inpaint-sweep-v1` was **never opened** (branch only exists
locally on the sibling worktree, no commits unique vs `main`, no remote push,
no GitHub PR). There is no PR to comment on. This verification was instead run
on a fresh fallback execution of the pipeline against the 9 Israel photos.

If/when the sibling agent does push, the comment to add is:

> ❌ Privacy hold: 9/9 Israel photos REJECT (5 LaMa OOM @ 4608×3456,
> 1 face-dominant flagged, 3 visually destroyed grey-block inpaints).
> Recommend Option A: drop the 9 photos and ship the 5 clean Israel
> photos already in the catalogue. See `docs/inpaint-israel-verify.md`.

## Artifacts

- `scripts/.inpaint-staging-israel-only/before/` — 9 source copies (read-only ref)
- `scripts/.inpaint-staging-israel-only/after/` — 3 inpainted JPEGs (visually rejected)
- `scripts/.inpaint-staging-israel-only/after/flagged/` — 1 flagged sidecar
- `scripts/.inpaint-staging-israel-only/after/_inpaint-log.ndjson` — pipeline audit log (5 OOM tracebacks)
- `scripts/.inpaint-staging-israel-only/crops/` — 9 × 100×100 verification crops
- `scripts/.inpaint-staging-israel-only/verify.json` — machine-readable verdict
- `scripts/verify-israel-inpaint.py` — verification harness (committed)

The staging directory is `.gitignore`d via the existing `.inpaint-*` patterns
and is not committed; only the harness script and this doc go on the branch.
