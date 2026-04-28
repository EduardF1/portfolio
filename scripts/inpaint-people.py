#!/usr/bin/env python
"""Remove people from landscape travel photos via face-detection-gated inpainting.

Decision is driven by **face visibility**, not person-area-percentage. Bronze
statues, stone busts and architectural sculpture do not trigger MediaPipe Face
Detection (it is tuned for living human faces) and therefore route through the
copy-as-is path -- the previous YOLO-person-only pipeline destroyed monuments
because YOLO false-detects sculptures as `person`.

Pipeline:

    1. MediaPipe Face Detection (model 1, full-range, ~6 MB auto-download).
       Threshold: face confidence > --face-confidence (default 0.6) AND face
       bbox area > --min-face-area (default 0.005 = 0.5 % of frame). Smaller
       than that is unrecognisable in the final photo and not worth erasing.
    2. For each qualifying face, find the YOLO11n `person` bbox that contains
       it. The inpaint mask = the union of those YOLO-person bboxes (NOT the
       face bbox; we do not want to ghost-erase a head and leave a body).
       Fallback when no containing person bbox exists (rare close-ups where
       the body extends past the frame): face bbox + 80 % expansion.
    3. Mask dilation (default 12 px) for natural LaMa edge softness.
    4. LaMa inpaint. Photo dimensions are preserved (LaMa returns same size).

Per-photo decisions:

    no qualifying face            -> copy through unchanged.
    face dominates frame          -> flag for human review (sidecar .txt),
                                     skip inpaint. Trigger: largest face
                                     occupies > --max-face-area (default 0.15)
                                     of the frame. These shots probably belong
                                     in /personal, not /travel.
    otherwise (faces present)     -> inpaint union of containing person bboxes.

The pipeline ONLY operates on copies under public/photos/trips/. Originals on
G:\\ and the local PC stay read-only.

Usage:
    python scripts/inpaint-people.py \\
        --input "public/photos/trips/2026-03-balkans-roadtrip/IMG20260326133320.jpg" \\
        --output scripts/.inpaint-test-output/

    # Multiple files / globs:
    python scripts/inpaint-people.py \\
        --input "public/photos/trips/**/IMG*.jpg" \\
        --output scripts/.inpaint-out/ \\
        --face-confidence 0.6 \\
        --min-face-area 0.005 \\
        --max-face-area 0.15 \\
        --threshold 0.4 \\
        --mask-dilate 12

    # Dry run (decisions logged, no output written):
    python scripts/inpaint-people.py --input ... --output ... --dry-run

Outputs (per photo):
    <output>/<filename>           # inpainted or copied (dimensions preserved)
    <output>/flagged/<filename>   # if face dominates (with .txt sidecar)
    <output>/_inpaint-log.ndjson  # JSONL audit log
"""

from __future__ import annotations

import argparse
import glob as _glob
import json
import os
import shutil
import sys
import time
from pathlib import Path
from typing import Iterable

# Cache models locally inside the worktree to keep the global Python install
# untouched and to make the cache trivially deletable.
_SCRIPT_DIR = Path(__file__).resolve().parent
_CACHE_DIR = _SCRIPT_DIR / ".inpaint-cache"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("YOLO_CONFIG_DIR", str(_CACHE_DIR / "ultralytics"))
os.environ.setdefault("TORCH_HOME", str(_CACHE_DIR / "torch"))
os.environ.setdefault("HF_HOME", str(_CACHE_DIR / "huggingface"))
os.environ.setdefault("XDG_CACHE_HOME", str(_CACHE_DIR))

PERSON_CLASS_ID = 0  # COCO id for "person" -- shared by YOLO11/YOLOv8 weights.
FACE_FALLBACK_EXPANSION = 0.8  # 80 % bbox inflation when face has no parent person.
# LaMa CPU memory caps: a 3456x4608 photo trips an OOM around 16 GB tensor
# allocations on 32 GB hosts. Cap the long edge fed to LaMa to this size, then
# composite the inpainted result back onto the full-resolution source so output
# dimensions are still preserved bit-exactly. 2048 px long edge keeps peak RAM
# under ~4 GB while remaining high-quality.
LAMA_MAX_SIDE = 2048


def _require_runtime_deps():
    """Import heavy deps lazily so --help works without the venv installed.

    Run with: scripts/.inpaint-venv/Scripts/python.exe scripts/inpaint-people.py ...
    On a fresh machine: `pip install ultralytics simple-lama-inpainting mediapipe Pillow numpy`
    """
    try:
        global np, Image, ImageDraw
        import numpy as np  # type: ignore  # noqa: F401
        from PIL import Image, ImageDraw  # type: ignore  # noqa: F401
    except ImportError as exc:  # noqa: BLE001
        msg = (
            "[inpaint] missing runtime dependency: "
            f"{exc.name if hasattr(exc, 'name') else exc}.\n"
            "  Activate the venv first, e.g.:\n"
            "    scripts\\.inpaint-venv\\Scripts\\python.exe scripts/inpaint-people.py --help\n"
            "  Or install deps into the current Python:\n"
            "    pip install ultralytics simple-lama-inpainting mediapipe Pillow numpy"
        )
        print(msg, file=sys.stderr)
        sys.exit(2)


def _iter_input_paths(patterns: Iterable[str]) -> list[Path]:
    """Expand a list of paths/globs into existing JPG/PNG file paths."""
    seen: set[Path] = set()
    out: list[Path] = []
    valid_ext = {".jpg", ".jpeg", ".png", ".webp"}
    for raw in patterns:
        # Normalise Windows separators so forward-slash globs work.
        pattern = raw.replace("\\", "/")
        matches = _glob.glob(pattern, recursive=True)
        if not matches:
            # Treat as a single file path even if it does not yet exist; the
            # caller probably typo'd and we want a clear error.
            matches = [pattern]
        for m in matches:
            p = Path(m).resolve()
            if p in seen:
                continue
            if p.is_dir():
                continue
            if p.suffix.lower() not in valid_ext:
                continue
            seen.add(p)
            out.append(p)
    return out


def _load_yolo(cache_dir: Path):
    """Lazy-import + load YOLO11n. Weights download to the cache on first run."""
    from ultralytics import YOLO  # noqa: WPS433 -- lazy import keeps --help fast

    weights_path = cache_dir / "yolo11n.pt"
    if not weights_path.exists():
        # Ultralytics will fetch the weights from GitHub releases when given
        # the bare model name. Pass the cache path so subsequent runs are
        # offline-safe.
        model = YOLO("yolo11n.pt")
        # Persist to our cache dir for reuse.
        try:
            shutil.copyfile(model.ckpt_path, weights_path)
        except Exception:  # noqa: BLE001 -- non-fatal, cache is best-effort
            pass
        return model
    return YOLO(str(weights_path))


_FACE_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_detector/"
    "blaze_face_full_range/float16/1/blaze_face_full_range.tflite"
)
_FACE_MODEL_FILENAME = "blaze_face_full_range.tflite"


def _load_face_detector():
    """Load MediaPipe Face Detection (BlazeFace full-range, ~1 MB auto-download).

    The full-range model covers faces up to ~5 m from the camera, which matches
    our travel-photo expectation. The short-range alternative would miss
    background pedestrians. We use the modern Tasks API
    (`mediapipe.tasks.python.vision.FaceDetector`) since `mp.solutions.*` was
    removed in mediapipe >= 0.10.30 on Windows wheels.
    """
    import urllib.request  # noqa: WPS433
    from mediapipe.tasks import python as mp_python  # noqa: WPS433
    from mediapipe.tasks.python import vision as mp_vision  # noqa: WPS433

    model_path = _CACHE_DIR / _FACE_MODEL_FILENAME
    if not model_path.exists():
        print(f"[inpaint] downloading face model -> {model_path.name} (~1 MB)")
        urllib.request.urlretrieve(_FACE_MODEL_URL, str(model_path))

    base_opts = mp_python.BaseOptions(model_asset_path=str(model_path))
    options = mp_vision.FaceDetectorOptions(
        base_options=base_opts,
        # We over-detect at 0.3 here and filter to args.face_confidence in
        # _detect_faces; this keeps the threshold tunable per-run without
        # rebuilding the detector.
        min_detection_confidence=0.3,
    )
    return mp_vision.FaceDetector.create_from_options(options)


def _load_lama():
    """Lazy-import + load simple-lama-inpainting. ~200MB download on first run."""
    from simple_lama_inpainting import SimpleLama  # noqa: WPS433

    return SimpleLama()


def _detect_persons(model, image: Image.Image, threshold: float):
    """Run YOLO and return [(x1,y1,x2,y2,conf), ...] for the person class."""
    # Ultralytics accepts PIL images directly. verbose=False keeps stdout clean.
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


def _detect_faces(
    detector,
    image: Image.Image,
    face_confidence: float,
    min_face_area: float,
):
    """Run MediaPipe Face Detection (Tasks API).

    Returns a list of (x1,y1,x2,y2,conf) tuples in image-pixel coordinates,
    filtered to faces with confidence > face_confidence AND bbox-area
    fraction > min_face_area.
    """
    import mediapipe as mp  # noqa: WPS433

    arr = np.asarray(image)
    h, w = arr.shape[:2]
    frame_area = float(w * h) if w and h else 1.0
    if frame_area <= 0:
        return []

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=arr)
    result = detector.detect(mp_image)
    faces: list[tuple[float, float, float, float, float]] = []
    if not result.detections:
        return faces

    for det in result.detections:
        # Tasks API: det.categories[0].score is the confidence.
        score = 0.0
        if det.categories:
            try:
                score = float(det.categories[0].score)
            except (TypeError, ValueError):
                score = 0.0
        if score < face_confidence:
            continue
        bb = det.bounding_box  # absolute pixel coords (origin top-left).
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


def _box_contains_point(
    box: tuple[float, float, float, float, float], px: float, py: float
) -> bool:
    x1, y1, x2, y2, _c = box
    return x1 <= px <= x2 and y1 <= py <= y2


def _expand_face_bbox(
    face: tuple[float, float, float, float, float],
    image_size: tuple[int, int],
    expansion: float,
) -> tuple[float, float, float, float, float]:
    """Inflate a face bbox by `expansion` (fraction of width/height each side).

    Used as a fallback mask when MediaPipe found a face but YOLO did not return
    any person bbox containing its centroid.
    """
    w, h = image_size
    x1, y1, x2, y2, conf = face
    bw = x2 - x1
    bh = y2 - y1
    fx1 = max(0.0, x1 - bw * expansion)
    fy1 = max(0.0, y1 - bh * expansion)
    fx2 = min(float(w), x2 + bw * expansion)
    fy2 = min(float(h), y2 + bh * expansion)
    return (fx1, fy1, fx2, fy2, conf)


def _select_inpaint_boxes(
    faces: list[tuple[float, float, float, float, float]],
    persons: list[tuple[float, float, float, float, float]],
    image_size: tuple[int, int],
) -> tuple[list[tuple[float, float, float, float, float]], int]:
    """For each qualifying face, return the containing person bbox (or fallback).

    Returns (selected_boxes, fallback_count). De-duplicates person boxes that
    contain multiple faces so the LaMa mask is the union, not double-painted.
    """
    selected: list[tuple[float, float, float, float, float]] = []
    seen_person_ids: set[int] = set()
    fallback_count = 0
    for face in faces:
        fx1, fy1, fx2, fy2, _fc = face
        cx = (fx1 + fx2) / 2.0
        cy = (fy1 + fy2) / 2.0
        # Walk persons; record the first one whose bbox contains the face
        # centroid. (For overlapping persons we'd want smallest-area; in
        # practice a face centroid lands inside one person box only.)
        match_idx: int | None = None
        for idx, person in enumerate(persons):
            if _box_contains_point(person, cx, cy):
                match_idx = idx
                break
        if match_idx is None:
            # No containing person -> fall back to expanded face bbox.
            fallback_count += 1
            selected.append(_expand_face_bbox(face, image_size, FACE_FALLBACK_EXPANSION))
            continue
        if match_idx in seen_person_ids:
            continue
        seen_person_ids.add(match_idx)
        selected.append(persons[match_idx])
    return selected, fallback_count


def _build_mask(
    image_size: tuple[int, int],
    boxes: list[tuple[float, float, float, float, float]],
    dilate_px: int,
) -> Image.Image:
    """White-on-black PIL mask covering all bboxes, dilated for soft edges."""
    w, h = image_size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    for x1, y1, x2, y2, _conf in boxes:
        # Dilate by inflating the bbox; for LaMa a slightly oversized mask
        # produces cleaner blends than tight crops.
        x1d = max(0, int(x1) - dilate_px)
        y1d = max(0, int(y1) - dilate_px)
        x2d = min(w, int(x2) + dilate_px)
        y2d = min(h, int(y2) + dilate_px)
        draw.rectangle([x1d, y1d, x2d, y2d], fill=255)
    return mask


def _largest_face_area_fraction(
    image_size: tuple[int, int],
    faces: list[tuple[float, float, float, float, float]],
) -> float:
    """Largest face bbox area divided by frame area."""
    if not faces:
        return 0.0
    w, h = image_size
    if w == 0 or h == 0:
        return 0.0
    frame = float(w * h)
    best = 0.0
    for x1, y1, x2, y2, _c in faces:
        a = max(0.0, (x2 - x1)) * max(0.0, (y2 - y1))
        if a > best:
            best = a
    return best / frame


def _process_one(
    src: Path,
    out_dir: Path,
    yolo_model,
    face_detector,
    lama,
    threshold: float,
    face_confidence: float,
    min_face_area: float,
    max_face_area: float,
    mask_dilate: int,
    dry_run: bool,
) -> dict:
    t0 = time.perf_counter()
    image = Image.open(src).convert("RGB")
    src_size = image.size

    faces = _detect_faces(face_detector, image, face_confidence, min_face_area)
    persons = _detect_persons(yolo_model, image, threshold)

    face_count = len(faces)
    person_count = len(persons)
    largest_face_frac = _largest_face_area_fraction(src_size, faces)

    record = {
        "src": str(src).replace("\\", "/"),
        "faceCount": face_count,
        "personCount": person_count,
        "largestFaceFraction": round(largest_face_frac, 6),
        "decision": None,
        "fallbackBoxCount": 0,
        "srcSize": [src_size[0], src_size[1]],
        "outSize": None,
        "wallTimeMs": 0,
    }

    if face_count == 0:
        # No human face. Bronze sculptures, empty harbour, lone landscapes -- all
        # pass through unmodified. (This is the monument-preservation fix.)
        record["decision"] = "copied"
        if not dry_run:
            dst = out_dir / src.name
            shutil.copyfile(src, dst)
            with Image.open(dst) as out_image:
                record["outSize"] = [out_image.size[0], out_image.size[1]]
        else:
            record["outSize"] = [src_size[0], src_size[1]]
    elif largest_face_frac > max_face_area:
        # Face dominates the frame. Inpainting would destroy a portrait/selfie.
        # Flag for human review; these likely belong in /personal not /travel.
        record["decision"] = "flagged"
        if not dry_run:
            flagged_dir = out_dir / "flagged"
            flagged_dir.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, flagged_dir / src.name)
            sidecar = flagged_dir / f"{src.name}.txt"
            sidecar.write_text(
                "\n".join(
                    [
                        f"src: {src}",
                        "reason: face is the photo subject; inpainting would destroy the photo",
                        f"face_count: {face_count}",
                        f"person_count: {person_count}",
                        f"largest_face_fraction: {largest_face_frac:.4f}",
                        f"max_face_area_threshold: {max_face_area}",
                        "",
                        "Skipped LaMa inpainting because the face is large enough that",
                        "removing it would butcher the composition. Likely belongs in",
                        "/personal rather than /travel. Review manually:",
                        "  - portrait/selfie of subject -> move out of /travel.",
                        "  - background tourist accidentally close to camera -> re-run",
                        "    with a higher --max-face-area or crop the photo first.",
                        "",
                    ]
                ),
                encoding="utf-8",
            )
            record["outSize"] = [src_size[0], src_size[1]]
        else:
            record["outSize"] = [src_size[0], src_size[1]]
    else:
        # Faces detected, none dominant -> inpaint the union of containing
        # person bboxes (with face-bbox fallback for tight close-ups).
        selected, fallback = _select_inpaint_boxes(faces, persons, src_size)
        record["fallbackBoxCount"] = fallback
        record["decision"] = "inpainted"
        if not dry_run:
            mask = _build_mask(src_size, selected, mask_dilate)
            # LaMa is memory-hungry: tensor allocations scale ~quadratically with
            # pixel count, and a 3456x4608 photo would need ~16GB of CPU RAM in
            # one of the FFC convolution layers (observed crash on 32GB host
            # while other processes consumed half the RAM). Cap the LaMa input
            # to LAMA_MAX_SIDE on the long edge; upscale the inpainted output
            # back to src and composite ONLY the masked regions onto the
            # original. Unmasked pixels stay pixel-identical to the source.
            sw, sh = src_size
            long_side = max(sw, sh)
            if long_side > LAMA_MAX_SIDE:
                scale = LAMA_MAX_SIDE / float(long_side)
                rw = max(1, int(round(sw * scale)))
                rh = max(1, int(round(sh * scale)))
                small_image = image.resize((rw, rh), Image.LANCZOS)
                small_mask = mask.resize((rw, rh), Image.NEAREST)
                small_inpainted = lama(small_image, small_mask)
                # Upscale to src dims, then composite onto the source using
                # the full-resolution mask so unmasked pixels are unchanged.
                upscaled = small_inpainted.convert("RGB").resize(src_size, Image.LANCZOS)
                inpainted = Image.composite(upscaled, image, mask)
            else:
                inpainted = lama(image, mask)
            # SimpleLama pads the input to a multiple of 8 before inference
            # (`pad_out_to_modulo=8` in prepare_img_and_mask) and returns the
            # padded output without cropping. Crop back to src dimensions
            # to preserve the input shape exactly.
            if inpainted.size != src_size:
                inpainted = inpainted.crop((0, 0, src_size[0], src_size[1]))
            # SimpleLama returns a PIL.Image (same dimensions as input). Save as
            # JPEG to match input extension when possible; high quality keeps
            # second-generation compression damage minimal.
            dst = out_dir / src.name
            ext = dst.suffix.lower()
            if ext in {".jpg", ".jpeg"}:
                inpainted.convert("RGB").save(dst, "JPEG", quality=92, optimize=True)
            elif ext == ".png":
                inpainted.save(dst, "PNG", optimize=True)
            elif ext == ".webp":
                inpainted.save(dst, "WEBP", quality=92)
            else:
                inpainted.save(dst)
            with Image.open(dst) as out_image:
                record["outSize"] = [out_image.size[0], out_image.size[1]]
        else:
            record["outSize"] = [src_size[0], src_size[1]]

    record["wallTimeMs"] = int((time.perf_counter() - t0) * 1000)
    return record


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="inpaint-people",
        description=(
            "Remove people from landscape photos when a HUMAN face is visible. "
            "MediaPipe Face Detection gates the pipeline (bronze/stone "
            "sculptures do not trigger), then YOLO11n locates the surrounding "
            "person bbox(es), and LaMa inpaints the union. Photo dimensions "
            "are preserved. Photos with a dominant face are flagged for "
            "human review (likely belong in /personal, not /travel)."
        ),
    )
    parser.add_argument(
        "--input",
        action="append",
        required=True,
        help="Input photo path or glob (repeatable). Recursive globs (**/) supported.",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Output directory. Created if missing.",
    )
    parser.add_argument(
        "--face-confidence",
        type=float,
        default=0.6,
        help=(
            "MediaPipe face-detection confidence threshold (default 0.6). "
            "Below 0.6 we get phantom faces in foliage; above 0.7 we miss "
            "profile views."
        ),
    )
    parser.add_argument(
        "--min-face-area",
        type=float,
        default=0.005,
        help=(
            "Minimum face bbox area as a fraction of the frame for the face "
            "to count as 'recognisable' (default 0.005 = 0.5 %%). Smaller "
            "faces are too distant to identify and not worth erasing."
        ),
    )
    parser.add_argument(
        "--max-face-area",
        type=float,
        default=0.15,
        help=(
            "If the largest detected face exceeds this fraction of the frame, "
            "the photo is flagged for human review instead of inpainted "
            "(default 0.15). The face is the subject; inpainting would "
            "destroy the photo. Such photos likely belong in /personal."
        ),
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.4,
        help=(
            "YOLO11n person-detection confidence threshold (default 0.4). "
            "Now a defensive secondary -- only used to find the person bbox "
            "around an already-detected face."
        ),
    )
    parser.add_argument(
        "--mask-dilate",
        type=int,
        default=12,
        help="Pixels of bbox dilation when building the LaMa mask (default 12).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run detection and log decisions but do not write output images.",
    )
    args = parser.parse_args(argv)

    # Defer heavy imports past argparse so `--help` works without the venv.
    _require_runtime_deps()

    input_paths = _iter_input_paths(args.input)
    if not input_paths:
        print("No input photos matched.", file=sys.stderr)
        return 2

    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)
    log_path = out_dir / "_inpaint-log.ndjson"

    print(f"[inpaint] {len(input_paths)} photo(s) queued -> {out_dir}")
    print(
        f"[inpaint] face_confidence={args.face_confidence} "
        f"min_face_area={args.min_face_area} "
        f"max_face_area={args.max_face_area} "
        f"yolo_threshold={args.threshold} "
        f"mask_dilate={args.mask_dilate} dry_run={args.dry_run}"
    )

    print("[inpaint] loading MediaPipe Face Detection (BlazeFace full-range, ~1MB auto-download)...")
    face_detector = _load_face_detector()
    print("[inpaint] loading YOLO11n (first run downloads ~6MB)...")
    yolo_model = _load_yolo(_CACHE_DIR)

    # Lazy-load LaMa: skip the 200MB download entirely if no photo will need it.
    # Detection is cheap; LaMa load is the dominant first-run cost. Loading
    # eagerly is fine when at least one input is queued.
    lama = None
    if not args.dry_run:
        print("[inpaint] loading LaMa (first run downloads ~200MB)...")
        lama = _load_lama()

    summary = {"inpainted": 0, "copied": 0, "flagged": 0}
    with log_path.open("a", encoding="utf-8") as logf:
        for i, src in enumerate(input_paths, start=1):
            try:
                record = _process_one(
                    src=src,
                    out_dir=out_dir,
                    yolo_model=yolo_model,
                    face_detector=face_detector,
                    lama=lama,
                    threshold=args.threshold,
                    face_confidence=args.face_confidence,
                    min_face_area=args.min_face_area,
                    max_face_area=args.max_face_area,
                    mask_dilate=args.mask_dilate,
                    dry_run=args.dry_run,
                )
            except Exception as exc:  # noqa: BLE001 -- log, continue
                record = {
                    "src": str(src).replace("\\", "/"),
                    "faceCount": -1,
                    "personCount": -1,
                    "largestFaceFraction": -1,
                    "decision": "error",
                    "fallbackBoxCount": 0,
                    "srcSize": None,
                    "outSize": None,
                    "wallTimeMs": 0,
                    "error": repr(exc),
                }
            logf.write(json.dumps(record) + "\n")
            logf.flush()
            decision = record["decision"]
            summary[decision] = summary.get(decision, 0) + 1
            print(
                f"[{i:>3}/{len(input_paths)}] {decision:>9}  "
                f"faces={record['faceCount']:>2}  "
                f"persons={record['personCount']:>2}  "
                f"face_frac={record['largestFaceFraction']:.3f}  "
                f"{record['wallTimeMs']:>5}ms  "
                f"{src.name}"
            )

    print(
        f"[inpaint] done. inpainted={summary.get('inpainted', 0)} "
        f"copied={summary.get('copied', 0)} flagged={summary.get('flagged', 0)} "
        f"errors={summary.get('error', 0)}"
    )
    print(f"[inpaint] log: {log_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
