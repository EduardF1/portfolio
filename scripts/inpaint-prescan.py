#!/usr/bin/env python
"""Pre-scan trip photos to identify which ones need people-removal inpainting.

This is a detection-only counterpart to scripts/inpaint-people.py. It runs the
same MediaPipe Face Detection (BlazeFace full-range) gate plus a YOLO11n
person-detection side pass for cross-reference, but writes results to a
manifest instead of inpainting. The full sweep then iterates only over photos
flagged `needs-inpaint`, cutting CPU time by ~70 percent on a corpus where
roughly 30 percent of photos contain visible faces.

Outputs:
    scripts/.inpaint-prescan.ndjson   # JSONL audit log, one row per photo
    scripts/inpaint-targets.json      # clean manifest the sweep harness reads

Usage:
    scripts/.inpaint-venv/Scripts/python.exe scripts/inpaint-prescan.py
        [--root public/photos/trips]
        [--face-confidence 0.6]
        [--min-face-area 0.005]
        [--yolo-threshold 0.4]

Read-only on JPG bytes. No image data is written.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Cache models locally inside the worktree. If a sibling worktree already
# downloaded them, copy/reuse those weights to skip the re-download.
_SCRIPT_DIR = Path(__file__).resolve().parent
_CACHE_DIR = _SCRIPT_DIR / ".inpaint-cache"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("YOLO_CONFIG_DIR", str(_CACHE_DIR / "ultralytics"))
os.environ.setdefault("TORCH_HOME", str(_CACHE_DIR / "torch"))
os.environ.setdefault("HF_HOME", str(_CACHE_DIR / "huggingface"))
os.environ.setdefault("XDG_CACHE_HOME", str(_CACHE_DIR))

PERSON_CLASS_ID = 0  # COCO id for "person" -- shared across YOLO11/YOLOv8 weights.

_FACE_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_detector/"
    "blaze_face_full_range/float16/1/blaze_face_full_range.tflite"
)
_FACE_MODEL_FILENAME = "blaze_face_full_range.tflite"


def _load_face_detector():
    """Load MediaPipe Face Detection (BlazeFace full-range, ~1 MB auto-download)."""
    import urllib.request  # noqa: WPS433
    from mediapipe.tasks import python as mp_python  # noqa: WPS433
    from mediapipe.tasks.python import vision as mp_vision  # noqa: WPS433

    model_path = _CACHE_DIR / _FACE_MODEL_FILENAME
    if not model_path.exists():
        print(f"[prescan] downloading face model -> {model_path.name} (~1 MB)")
        urllib.request.urlretrieve(_FACE_MODEL_URL, str(model_path))

    base_opts = mp_python.BaseOptions(model_asset_path=str(model_path))
    options = mp_vision.FaceDetectorOptions(
        base_options=base_opts,
        # Over-detect at 0.3, filter to face_confidence in _detect_faces so the
        # threshold is tunable per-run.
        min_detection_confidence=0.3,
    )
    return mp_vision.FaceDetector.create_from_options(options)


def _load_yolo():
    """Lazy-import + load YOLO11n. Weights download to the cache on first run."""
    from ultralytics import YOLO  # noqa: WPS433

    weights_path = _CACHE_DIR / "yolo11n.pt"
    if weights_path.exists():
        return YOLO(str(weights_path))
    # Ultralytics will fetch the weights from GitHub releases on first use.
    return YOLO("yolo11n.pt")


def _detect_faces(detector, image, face_confidence, min_face_area):
    """Run MediaPipe Face Detection. Returns kept faces above thresholds.

    Returns: (kept_faces, raw_face_count)
    where kept_faces is a list of (x1,y1,x2,y2,conf) for faces meeting the
    confidence + min-area thresholds, and raw_face_count is the total number
    of faces MediaPipe surfaced above its internal 0.3 floor (useful debug).
    """
    import mediapipe as mp  # noqa: WPS433
    import numpy as np  # noqa: WPS433

    arr = np.asarray(image)
    h, w = arr.shape[:2]
    frame_area = float(w * h) if w and h else 1.0
    if frame_area <= 0:
        return [], 0

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=arr)
    result = detector.detect(mp_image)
    if not result.detections:
        return [], 0

    raw_count = len(result.detections)
    kept: list[tuple[float, float, float, float, float]] = []
    for det in result.detections:
        score = 0.0
        if det.categories:
            try:
                score = float(det.categories[0].score)
            except (TypeError, ValueError):
                score = 0.0
        if score < face_confidence:
            continue
        bb = det.bounding_box
        x1 = max(0.0, float(bb.origin_x))
        y1 = max(0.0, float(bb.origin_y))
        x2 = min(float(w), x1 + float(bb.width))
        y2 = min(float(h), y1 + float(bb.height))
        if x2 <= x1 or y2 <= y1:
            continue
        bbox_area = (x2 - x1) * (y2 - y1)
        if (bbox_area / frame_area) < min_face_area:
            continue
        kept.append((x1, y1, x2, y2, score))
    return kept, raw_count


def _detect_persons(model, image, threshold):
    """Run YOLO and return [(x1,y1,x2,y2,conf), ...] for the person class only."""
    results = model.predict(
        image,
        conf=threshold,
        classes=[PERSON_CLASS_ID],
        verbose=False,
    )
    boxes: list[tuple[float, float, float, float, float]] = []
    if not results:
        return boxes
    r = results[0]
    if r.boxes is None or len(r.boxes) == 0:
        return boxes
    xyxy = r.boxes.xyxy.cpu().numpy()
    conf = r.boxes.conf.cpu().numpy()
    cls = r.boxes.cls.cpu().numpy().astype(int)
    for (x1, y1, x2, y2), c, k in zip(xyxy, conf, cls):
        if k != PERSON_CLASS_ID:
            continue
        boxes.append((float(x1), float(y1), float(x2), float(y2), float(c)))
    return boxes


def _largest_face_fraction(image_size, faces):
    if not faces:
        return 0.0
    w, h = image_size
    if w == 0 or h == 0:
        return 0.0
    frame = float(w * h)
    best = 0.0
    for x1, y1, x2, y2, _c in faces:
        a = max(0.0, x2 - x1) * max(0.0, y2 - y1)
        if a > best:
            best = a
    return best / frame


def _iter_jpgs(root: Path):
    """Yield all .jpg/.jpeg files under root, sorted for deterministic output."""
    matches: list[Path] = []
    for ext in ("*.jpg", "*.jpeg", "*.JPG", "*.JPEG"):
        matches.extend(root.rglob(ext))
    seen: set[Path] = set()
    out: list[Path] = []
    for p in matches:
        rp = p.resolve()
        if rp in seen:
            continue
        seen.add(rp)
        out.append(p)
    out.sort(key=lambda p: str(p).lower())
    return out


def _to_repo_relative(path: Path, repo_root: Path) -> str:
    """Return src as 'trips/<trip>/<file>.jpg' when under public/photos/, else POSIX abs."""
    try:
        rel = path.resolve().relative_to(repo_root.resolve())
    except ValueError:
        return str(path).replace("\\", "/")
    parts = rel.parts
    # public/photos/trips/<trip>/<file> -> trips/<trip>/<file>
    if len(parts) >= 3 and parts[0] == "public" and parts[1] == "photos":
        return "/".join(parts[2:])
    return rel.as_posix()


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="inpaint-prescan",
        description=(
            "Detect which trip photos contain visible human faces so the "
            "inpainting sweep skips face-free photos and saves ~70% CPU time."
        ),
    )
    parser.add_argument(
        "--root",
        default="public/photos/trips",
        help="Directory to scan recursively (default: public/photos/trips).",
    )
    parser.add_argument(
        "--repo-root",
        default=".",
        help="Repo root used for relative `src` keys in the manifest (default: cwd).",
    )
    parser.add_argument(
        "--ndjson-out",
        default="scripts/.inpaint-prescan.ndjson",
        help="Per-photo NDJSON audit log (default: scripts/.inpaint-prescan.ndjson).",
    )
    parser.add_argument(
        "--manifest-out",
        default="scripts/inpaint-targets.json",
        help="Sweep-harness manifest (default: scripts/inpaint-targets.json).",
    )
    parser.add_argument(
        "--face-confidence",
        type=float,
        default=0.6,
        help="Face-detection confidence threshold (default 0.6, matches inpaint-people.py).",
    )
    parser.add_argument(
        "--min-face-area",
        type=float,
        default=0.005,
        help="Min face bbox area as fraction of frame (default 0.005 = 0.5%%).",
    )
    parser.add_argument(
        "--yolo-threshold",
        type=float,
        default=0.4,
        help="YOLO11n person-detection confidence threshold (default 0.4).",
    )
    args = parser.parse_args(argv)

    # Lazy import the heavy deps so --help works without the venv.
    from PIL import Image  # noqa: WPS433
    import numpy as np  # noqa: F401, WPS433  -- imported transitively in helpers

    root = Path(args.root)
    if not root.is_dir():
        print(f"[prescan] root not found: {root}", file=sys.stderr)
        return 2
    repo_root = Path(args.repo_root)

    photos = _iter_jpgs(root)
    if not photos:
        print(f"[prescan] no JPG files under {root}", file=sys.stderr)
        return 2

    print(f"[prescan] {len(photos)} photo(s) under {root}")
    print(
        f"[prescan] face_confidence={args.face_confidence} "
        f"min_face_area={args.min_face_area} "
        f"yolo_threshold={args.yolo_threshold}"
    )

    print("[prescan] loading MediaPipe Face Detection (BlazeFace full-range)...")
    face_detector = _load_face_detector()
    print("[prescan] loading YOLO11n...")
    yolo_model = _load_yolo()

    ndjson_path = Path(args.ndjson_out)
    ndjson_path.parent.mkdir(parents=True, exist_ok=True)
    # Truncate prior runs -- prescans are not append-only.
    ndjson_path.write_text("", encoding="utf-8")

    targets: list[dict] = []
    needs_inpaint = 0
    clean = 0
    errors = 0
    t_start = time.perf_counter()

    with ndjson_path.open("a", encoding="utf-8") as logf:
        for i, src in enumerate(photos, start=1):
            t0 = time.perf_counter()
            rel_src = _to_repo_relative(src, repo_root)
            try:
                with Image.open(src) as raw:
                    image = raw.convert("RGB")
                src_size = image.size
                faces, raw_face_count = _detect_faces(
                    face_detector,
                    image,
                    args.face_confidence,
                    args.min_face_area,
                )
                persons = _detect_persons(yolo_model, image, args.yolo_threshold)
                face_count = len(faces)
                person_count = len(persons)
                max_face_area = _largest_face_fraction(src_size, faces)
                decision = "needs-inpaint" if face_count > 0 else "clean"

                record = {
                    "src": rel_src,
                    "width": src_size[0],
                    "height": src_size[1],
                    "faceCount": face_count,
                    "rawFaceCount": raw_face_count,
                    "personCount": person_count,
                    "maxFaceArea": round(max_face_area, 6),
                    "decision": decision,
                    "wallTimeMs": int((time.perf_counter() - t0) * 1000),
                }
                if decision == "needs-inpaint":
                    needs_inpaint += 1
                    targets.append(
                        {
                            "src": rel_src,
                            "faceCount": face_count,
                            "personCount": person_count,
                            "maxFaceArea": round(max_face_area, 6),
                        }
                    )
                else:
                    clean += 1
            except Exception as exc:  # noqa: BLE001 -- log, continue
                errors += 1
                record = {
                    "src": rel_src,
                    "decision": "error",
                    "error": repr(exc),
                    "wallTimeMs": int((time.perf_counter() - t0) * 1000),
                }
            logf.write(json.dumps(record) + "\n")
            logf.flush()
            print(
                f"[{i:>3}/{len(photos)}] "
                f"{record.get('decision', '?'):>13}  "
                f"faces={record.get('faceCount', '-'):>2}  "
                f"persons={record.get('personCount', '-'):>2}  "
                f"max_face={record.get('maxFaceArea', 0):.4f}  "
                f"{record.get('wallTimeMs', 0):>5}ms  "
                f"{src.name}"
            )

    elapsed = time.perf_counter() - t_start
    manifest = {
        "generatedAt": datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "root": str(root).replace("\\", "/"),
        "thresholds": {
            "faceConfidence": args.face_confidence,
            "minFaceArea": args.min_face_area,
            "yoloThreshold": args.yolo_threshold,
        },
        "totalScanned": len(photos),
        "needsInpaint": needs_inpaint,
        "clean": clean,
        "errors": errors,
        "targets": targets,
    }
    manifest_path = Path(args.manifest_out)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )

    print(
        f"[prescan] done in {elapsed:.1f}s. "
        f"scanned={len(photos)} needs_inpaint={needs_inpaint} "
        f"clean={clean} errors={errors}"
    )
    print(f"[prescan] manifest: {manifest_path}")
    print(f"[prescan] ndjson:   {ndjson_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
