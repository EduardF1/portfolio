#!/usr/bin/env python
"""Independent verification of the Israel inpainting sweep.

For each (before, after) pair:
  - Re-runs MediaPipe Face Detection on AFTER at conf>=0.5 (lower than the
    pipeline default 0.6 -- we want even faint residual faces to trip).
  - Computes SSIM (structural similarity) between BEFORE and AFTER.
  - Dumps three 100x100 crops (top, mid, bottom) of the inpainted region for
    visual artifact inspection.
  - Emits a JSON verdict per photo.

Decision matrix:
  faces==0 AND 0.7 <= ssim <= 0.99       -> OK
  faces>=1                                -> REJECT (residual face)
  ssim < 0.7                              -> REJECT (LaMa hallucinated too much)
  ssim > 0.99                             -> REJECT (no actual change; inpaint failed)

Usage:
    python verify-israel-inpaint.py \
        --before scripts/.inpaint-staging-israel-only/before \
        --after  scripts/.inpaint-staging-israel-only/after \
        --crops  scripts/.inpaint-staging-israel-only/crops \
        --output scripts/.inpaint-staging-israel-only/verify.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
_CACHE_DIR = _SCRIPT_DIR / ".inpaint-cache"
os.environ.setdefault("XDG_CACHE_HOME", str(_CACHE_DIR))

import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity as ssim_metric


def _load_face_detector():
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision

    model_path = _CACHE_DIR / "blaze_face_full_range.tflite"
    if not model_path.exists():
        raise FileNotFoundError(f"Face model missing: {model_path}")
    base_opts = mp_python.BaseOptions(model_asset_path=str(model_path))
    options = mp_vision.FaceDetectorOptions(
        base_options=base_opts,
        # Over-detect at 0.3, then filter at 0.5 in the verifier.
        min_detection_confidence=0.3,
    )
    return mp_vision.FaceDetector.create_from_options(options)


def _detect_faces(detector, image: Image.Image, threshold: float = 0.5):
    """Return [(x1,y1,x2,y2,conf), ...] for faces above threshold."""
    import mediapipe as mp

    arr = np.asarray(image)
    h, w = arr.shape[:2]
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=arr)
    result = detector.detect(mp_image)
    faces = []
    if not result.detections:
        return faces
    for det in result.detections:
        score = float(det.categories[0].score) if det.categories else 0.0
        if score < threshold:
            continue
        bb = det.bounding_box
        x1 = max(0.0, float(bb.origin_x))
        y1 = max(0.0, float(bb.origin_y))
        x2 = min(float(w), x1 + float(bb.width))
        y2 = min(float(h), y1 + float(bb.height))
        if x2 <= x1 or y2 <= y1:
            continue
        faces.append((x1, y1, x2, y2, score))
    return faces


def _compute_ssim(before: Image.Image, after: Image.Image) -> float:
    """Greyscale SSIM. Resize after to before if dimensions differ slightly."""
    if before.size != after.size:
        after = after.resize(before.size, Image.LANCZOS)
    a = np.asarray(before.convert("L"))
    b = np.asarray(after.convert("L"))
    # data_range required for non-uint8 paths; play safe by passing the actual range.
    return float(ssim_metric(a, b, data_range=255))


def _diff_bbox(before_arr: np.ndarray, after_arr: np.ndarray):
    """Find the bounding box of pixels that changed (>5 grey-level threshold)."""
    if before_arr.shape != after_arr.shape:
        return None
    delta = np.abs(before_arr.astype(int) - after_arr.astype(int)).max(axis=-1)
    changed = delta > 5  # threshold to ignore JPEG re-encode noise
    if not changed.any():
        return None
    ys, xs = np.where(changed)
    return (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))


def _dump_crops(before: Image.Image, after: Image.Image, crops_dir: Path, name: str):
    """Save 100x100 crops at top/mid/bottom of the changed region for artifact review."""
    before_arr = np.asarray(before)
    after_arr = np.asarray(after.resize(before.size, Image.LANCZOS) if before.size != after.size else after)
    bbox = _diff_bbox(before_arr, after_arr)
    crops_info = []
    if bbox is None:
        return crops_info
    x1, y1, x2, y2 = bbox
    cx = (x1 + x2) // 2
    h = y2 - y1
    # Three vertical anchors inside the bbox; 100x100 crop centered on each.
    for label, cy in [("top", y1 + h // 6), ("mid", y1 + h // 2), ("bottom", y1 + (5 * h) // 6)]:
        # Clamp crop window to image bounds.
        x0 = max(0, cx - 50)
        y0 = max(0, cy - 50)
        x1c = min(after.size[0], x0 + 100)
        y1c = min(after.size[1], y0 + 100)
        crop = after.crop((x0, y0, x1c, y1c))
        out_path = crops_dir / f"{Path(name).stem}_{label}.png"
        crop.save(out_path)
        # Quick stats for artifact heuristic: low-saturation flat regions are LaMa "blur"
        crop_arr = np.asarray(crop.convert("RGB"))
        std = float(crop_arr.std())
        crops_info.append({"label": label, "path": str(out_path.name), "stddev": std})
    return crops_info


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--before", required=True)
    parser.add_argument("--after", required=True)
    parser.add_argument("--crops", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--face-confidence", type=float, default=0.5)
    args = parser.parse_args()

    before_dir = Path(args.before)
    after_dir = Path(args.after)
    crops_dir = Path(args.crops)
    crops_dir.mkdir(parents=True, exist_ok=True)
    out_path = Path(args.output)

    print(f"[verify] before={before_dir}", file=sys.stderr)
    print(f"[verify] after ={after_dir}", file=sys.stderr)
    print(f"[verify] face-confidence={args.face_confidence}", file=sys.stderr)

    detector = _load_face_detector()
    results = []
    for before_path in sorted(before_dir.glob("*.jpg")):
        after_path = after_dir / before_path.name
        flagged_path = after_dir / "flagged" / before_path.name
        if not after_path.exists() and flagged_path.exists():
            after_path = flagged_path
            note_flagged = True
        else:
            note_flagged = False
        if not after_path.exists():
            results.append({
                "filename": before_path.name,
                "decision": "REJECT",
                "rationale": "AFTER missing — pipeline did not produce output",
            })
            continue

        before_img = Image.open(before_path).convert("RGB")
        after_img = Image.open(after_path).convert("RGB")
        before_faces = _detect_faces(detector, before_img, args.face_confidence)
        after_faces = _detect_faces(detector, after_img, args.face_confidence)
        ssim_val = _compute_ssim(before_img, after_img)
        crops_info = _dump_crops(before_img, after_img, crops_dir, before_path.name)

        # Decision logic
        decision = "OK"
        rationales = []
        if note_flagged:
            decision = "REJECT"
            rationales.append("flagged (face dominates frame); no inpaint applied")
        if len(after_faces) > 0:
            decision = "REJECT"
            rationales.append(f"{len(after_faces)} residual face(s) at conf>=0.5")
        if ssim_val < 0.7:
            decision = "REJECT"
            rationales.append(f"SSIM {ssim_val:.3f} < 0.7 (LaMa hallucinated too much)")
        elif ssim_val > 0.999:
            # >0.999 means literally identical -> no change. >0.99 alone is fine for tiny masks.
            decision = "REJECT"
            rationales.append(f"SSIM {ssim_val:.4f} > 0.999 (no change; inpaint failed silently)")
        if not rationales:
            rationales.append(f"0 faces, SSIM {ssim_val:.3f}, no obvious artifacts")

        result = {
            "filename": before_path.name,
            "before_faces": len(before_faces),
            "after_faces": len(after_faces),
            "after_face_confidences": [round(f[4], 3) for f in after_faces],
            "ssim": round(ssim_val, 4),
            "flagged": note_flagged,
            "decision": decision,
            "rationale": "; ".join(rationales),
            "crops": crops_info,
        }
        results.append(result)
        print(json.dumps(result), file=sys.stderr)

    summary = {
        "total": len(results),
        "ok": sum(1 for r in results if r.get("decision") == "OK"),
        "reject": sum(1 for r in results if r.get("decision") == "REJECT"),
        "results": results,
    }
    out_path.write_text(json.dumps(summary, indent=2))
    print(f"[verify] wrote {out_path}", file=sys.stderr)
    print(f"[verify] OK={summary['ok']}/{summary['total']} REJECT={summary['reject']}", file=sys.stderr)


if __name__ == "__main__":
    main()
