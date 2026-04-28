#!/usr/bin/env python
"""Aggressive person re-scan for trip groups Eduard flagged as still showing people.

This is a DRY-RUN-only scanner (no inpainting). For each input photo it runs:

  - YOLO11n person detection (class 0) at conf threshold (default 0.35)
  - MediaPipe Face Detection (full-range, model 1) at conf threshold (default 0.4)
    AND min face area (default 0.001 = 0.1 % of frame)

A photo is flagged if EITHER detector hits. Per-photo decisions are written to
an NDJSON log; a flagged-list text file lists the catalogue srcs to remove.

Usage:
    python scripts/aggressive-person-rescan.py \\
        --input "public/photos/trips/2018-03-israel/IMG*.jpg" \\
        --input "public/photos/trips/2022-10-germany/IMG*.jpg" \\
        --output scripts/.aggressive-rescan/

Re-uses model cache from scripts/.inpaint-cache/ (auto-creates).
"""

from __future__ import annotations

import argparse
import glob as _glob
import json
import os
import sys
import time
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
_CACHE_DIR = _SCRIPT_DIR / ".inpaint-cache"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("YOLO_CONFIG_DIR", str(_CACHE_DIR / "ultralytics"))
os.environ.setdefault("TORCH_HOME", str(_CACHE_DIR / "torch"))
os.environ.setdefault("HF_HOME", str(_CACHE_DIR / "huggingface"))
os.environ.setdefault("XDG_CACHE_HOME", str(_CACHE_DIR))

PERSON_CLASS_ID = 0


def _iter_input_paths(patterns):
    seen = set()
    out = []
    valid_ext = {".jpg", ".jpeg", ".png", ".webp"}
    for raw in patterns:
        pattern = raw.replace("\\", "/")
        matches = _glob.glob(pattern, recursive=True)
        for m in matches:
            p = Path(m).resolve()
            if p in seen or p.is_dir():
                continue
            if p.suffix.lower() not in valid_ext:
                continue
            seen.add(p)
            out.append(p)
    return out


def _load_yolo(cache_dir):
    from ultralytics import YOLO
    weights_path = cache_dir / "yolo11n.pt"
    if weights_path.exists():
        return YOLO(str(weights_path))
    return YOLO("yolo11n.pt")


_FACE_MODEL_FILENAME = "blaze_face_full_range.tflite"


def _load_face_detector():
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    model_path = _CACHE_DIR / _FACE_MODEL_FILENAME
    if not model_path.exists():
        import urllib.request
        url = (
            "https://storage.googleapis.com/mediapipe-models/face_detector/"
            "blaze_face_full_range/float16/1/blaze_face_full_range.tflite"
        )
        urllib.request.urlretrieve(url, str(model_path))
    base_opts = mp_python.BaseOptions(model_asset_path=str(model_path))
    options = mp_vision.FaceDetectorOptions(
        base_options=base_opts,
        # Over-detect at 0.2 then filter to args.face_confidence so the threshold
        # is tunable per run.
        min_detection_confidence=0.2,
    )
    return mp_vision.FaceDetector.create_from_options(options)


def _detect_persons(model, image, threshold):
    results = model.predict(
        image,
        conf=threshold,
        classes=[PERSON_CLASS_ID],
        verbose=False,
    )
    boxes = []
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


def _detect_faces(detector, image, face_confidence, min_face_area, np, mp):
    arr = np.asarray(image)
    h, w = arr.shape[:2]
    frame_area = float(w * h) if w and h else 1.0
    if frame_area <= 0:
        return []
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=arr)
    result = detector.detect(mp_image)
    faces = []
    if not result.detections:
        return faces
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
        faces.append((x1, y1, x2, y2, score))
    return faces


def main(argv=None):
    parser = argparse.ArgumentParser(prog="aggressive-person-rescan")
    parser.add_argument("--input", action="append", default=[])
    parser.add_argument("--inputs-file", default=None,
                        help="Optional newline-separated file of input paths.")
    parser.add_argument("--output", required=True)
    parser.add_argument("--face-confidence", type=float, default=0.4)
    parser.add_argument("--min-face-area", type=float, default=0.001)
    parser.add_argument("--threshold", type=float, default=0.35)
    args = parser.parse_args(argv)

    import numpy as np
    from PIL import Image
    import mediapipe as mp

    inputs = list(args.input)
    if args.inputs_file:
        with open(args.inputs_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    inputs.append(line)
    paths = _iter_input_paths(inputs)
    if not paths:
        print("No input photos matched.", file=sys.stderr)
        return 2

    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)
    log_path = out_dir / "_rescan-log.ndjson"
    flagged_list_path = out_dir / "flagged-srcs.txt"

    print(f"[rescan] {len(paths)} photo(s) queued -> {out_dir}")
    print(
        f"[rescan] face_confidence={args.face_confidence} "
        f"min_face_area={args.min_face_area} "
        f"yolo_threshold={args.threshold}"
    )

    print("[rescan] loading MediaPipe Face Detection (BlazeFace full-range)...")
    face_detector = _load_face_detector()
    print("[rescan] loading YOLO11n...")
    yolo_model = _load_yolo(_CACHE_DIR)

    summary = {"flagged": 0, "clear": 0, "error": 0}
    flagged_srcs = []

    with log_path.open("w", encoding="utf-8") as logf:
        for i, src in enumerate(paths, start=1):
            t0 = time.perf_counter()
            try:
                image = Image.open(src).convert("RGB")
                src_size = image.size
                faces = _detect_faces(
                    face_detector, image, args.face_confidence, args.min_face_area, np, mp
                )
                persons = _detect_persons(yolo_model, image, args.threshold)
                face_count = len(faces)
                person_count = len(persons)
                largest_face_frac = 0.0
                if faces:
                    w, h = src_size
                    frame = float(w * h)
                    for x1, y1, x2, y2, _c in faces:
                        a = max(0.0, (x2 - x1)) * max(0.0, (y2 - y1))
                        if a > largest_face_frac * frame:
                            largest_face_frac = a / frame
                flagged = face_count > 0 or person_count > 0
                decision = "remove" if flagged else "keep"
                # Persist relative posix path under public/photos/ for catalogue lookup.
                src_str = str(src).replace("\\", "/")
                marker = "/public/photos/"
                if marker in src_str:
                    rel = src_str.split(marker, 1)[1]
                else:
                    rel = src.name
                record = {
                    "src": rel,
                    "filename": src.name,
                    "faceCount": face_count,
                    "personCount": person_count,
                    "largestFaceFraction": round(largest_face_frac, 6),
                    "personConfidences": [round(c, 3) for *_b, c in persons],
                    "faceConfidences": [round(c, 3) for *_b, c in faces],
                    "decision": decision,
                    "srcSize": [src_size[0], src_size[1]],
                    "wallTimeMs": int((time.perf_counter() - t0) * 1000),
                }
                if flagged:
                    flagged_srcs.append(rel)
                    summary["flagged"] += 1
                else:
                    summary["clear"] += 1
            except Exception as exc:
                record = {
                    "src": str(src).replace("\\", "/"),
                    "filename": src.name,
                    "decision": "error",
                    "error": repr(exc),
                    "wallTimeMs": int((time.perf_counter() - t0) * 1000),
                }
                summary["error"] += 1
            logf.write(json.dumps(record) + "\n")
            logf.flush()
            print(
                f"[{i:>3}/{len(paths)}] {record.get('decision','?'):>7}  "
                f"faces={record.get('faceCount','?'):>2}  "
                f"persons={record.get('personCount','?'):>2}  "
                f"face_frac={record.get('largestFaceFraction',0):.4f}  "
                f"{record.get('wallTimeMs',0):>5}ms  "
                f"{src.name}"
            )

    flagged_list_path.write_text("\n".join(flagged_srcs) + "\n", encoding="utf-8")
    print(
        f"[rescan] done. flagged={summary['flagged']} "
        f"clear={summary['clear']} errors={summary['error']}"
    )
    print(f"[rescan] log: {log_path}")
    print(f"[rescan] flagged srcs: {flagged_list_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
