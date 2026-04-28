#!/usr/bin/env python
"""Remove people from landscape travel photos via YOLO11 detection + LaMa inpainting.

Conservative defaults: only inpaints when persons are clearly background subjects.
Photos where a person dominates the frame (selfies, portraits) are flagged for
human review, NOT auto-inpainted (LaMa produces uncanny artifacts on centred
human subjects).

The pipeline ONLY operates on copies under public/photos/trips/. Originals on
G:\\ and the local machine are read-only.

Usage:
    python scripts/inpaint-people.py \\
        --input "public/photos/trips/2026-03-balkans-roadtrip/IMG20260326133320.jpg" \\
        --output scripts/.inpaint-test-output/

    # Multiple files / globs:
    python scripts/inpaint-people.py \\
        --input "public/photos/trips/**/IMG*.jpg" \\
        --output scripts/.inpaint-out/ \\
        --threshold 0.4 \\
        --max-person-area 0.25 \\
        --mask-dilate 12

    # Dry run (decisions logged, no output written):
    python scripts/inpaint-people.py --input ... --output ... --dry-run

Outputs (per photo):
    <output>/<filename>           # inpainted or copied
    <output>/flagged/<filename>   # if person dominates (with .txt sidecar)
    <output>/_inpaint-log.ndjson  # JSONL audit log

Decision tree:
    person_area_fraction == 0          -> copy as-is (no person)
    person_area_fraction > max_area    -> flag for human review
    else                               -> inpaint via LaMa
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


def _require_runtime_deps():
    """Import heavy deps lazily so --help works without the venv installed.

    Run with: scripts/.inpaint-venv/Scripts/python.exe scripts/inpaint-people.py ...
    On a fresh machine: `pip install ultralytics simple-lama-inpainting Pillow numpy`
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
            "    pip install ultralytics simple-lama-inpainting Pillow numpy"
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


def _build_mask(
    image_size: tuple[int, int],
    boxes: list[tuple[float, float, float, float, float]],
    dilate_px: int,
) -> Image.Image:
    """White-on-black PIL mask covering all person bboxes, dilated for soft edges."""
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


def _person_area_fraction(
    image_size: tuple[int, int],
    boxes: list[tuple[float, float, float, float, float]],
) -> float:
    """Union-area of all person bboxes divided by frame area.

    Uses a binary numpy raster instead of analytic union-of-rects so overlap
    is handled correctly without per-pair intersection bookkeeping.
    """
    if not boxes:
        return 0.0
    w, h = image_size
    if w == 0 or h == 0:
        return 0.0
    raster = np.zeros((h, w), dtype=np.uint8)
    for x1, y1, x2, y2, _conf in boxes:
        ix1 = max(0, int(x1))
        iy1 = max(0, int(y1))
        ix2 = min(w, int(x2))
        iy2 = min(h, int(y2))
        if ix2 <= ix1 or iy2 <= iy1:
            continue
        raster[iy1:iy2, ix1:ix2] = 1
    return float(raster.sum()) / float(w * h)


def _process_one(
    src: Path,
    out_dir: Path,
    yolo_model,
    lama,
    threshold: float,
    max_person_area: float,
    mask_dilate: int,
    dry_run: bool,
) -> dict:
    t0 = time.perf_counter()
    image = Image.open(src).convert("RGB")
    boxes = _detect_persons(yolo_model, image, threshold)
    person_count = len(boxes)
    area_frac = _person_area_fraction(image.size, boxes)

    record = {
        "src": str(src).replace("\\", "/"),
        "personCount": person_count,
        "personAreaFraction": round(area_frac, 6),
        "decision": None,
        "wallTimeMs": 0,
    }

    if person_count == 0:
        record["decision"] = "copied"
        if not dry_run:
            dst = out_dir / src.name
            shutil.copyfile(src, dst)
    elif area_frac > max_person_area:
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
                        f"reason: person dominant in frame",
                        f"person_count: {person_count}",
                        f"person_area_fraction: {area_frac:.4f}",
                        f"max_person_area_threshold: {max_person_area}",
                        "",
                        "Skipped LaMa inpainting because removing the dominant",
                        "person would produce uncanny artifacts. Review manually:",
                        "  - if the person IS the subject (selfie/portrait): keep as-is.",
                        "  - if the person is removable: re-run with a higher",
                        "    --max-person-area or use a different tool.",
                        "",
                    ]
                ),
                encoding="utf-8",
            )
    else:
        record["decision"] = "inpainted"
        if not dry_run:
            mask = _build_mask(image.size, boxes, mask_dilate)
            inpainted = lama(image, mask)
            # SimpleLama returns a PIL.Image. Save as JPEG to match input
            # extension when possible; default to high quality to minimise
            # the second-generation compression hit.
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

    record["wallTimeMs"] = int((time.perf_counter() - t0) * 1000)
    return record


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="inpaint-people",
        description=(
            "Remove background people from landscape photos via YOLO11 + LaMa. "
            "Flags photos where a person dominates the frame for human review."
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
        "--threshold",
        type=float,
        default=0.4,
        help="YOLO person-detection confidence threshold (default 0.4).",
    )
    parser.add_argument(
        "--max-person-area",
        type=float,
        default=0.25,
        help=(
            "If the union of person bboxes exceeds this fraction of the frame, "
            "the photo is flagged instead of inpainted (default 0.25)."
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
    print(f"[inpaint] threshold={args.threshold} max_person_area={args.max_person_area} "
          f"mask_dilate={args.mask_dilate} dry_run={args.dry_run}")

    print("[inpaint] loading YOLO11n (first run downloads ~6MB)...")
    yolo_model = _load_yolo(_CACHE_DIR)

    # Lazy-load LaMa: skip the 200MB download entirely if no photo will need it.
    # We do not know that ahead of detection, so for simplicity load eagerly
    # only when we have at least one input. (Detection is cheap; loading is
    # the dominant first-run cost.)
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
                    lama=lama,
                    threshold=args.threshold,
                    max_person_area=args.max_person_area,
                    mask_dilate=args.mask_dilate,
                    dry_run=args.dry_run,
                )
            except Exception as exc:  # noqa: BLE001 -- log, continue
                record = {
                    "src": str(src).replace("\\", "/"),
                    "personCount": -1,
                    "personAreaFraction": -1,
                    "decision": "error",
                    "wallTimeMs": 0,
                    "error": repr(exc),
                }
            logf.write(json.dumps(record) + "\n")
            logf.flush()
            decision = record["decision"]
            summary[decision] = summary.get(decision, 0) + 1
            print(
                f"[{i:>3}/{len(input_paths)}] {decision:>9}  "
                f"persons={record['personCount']:>2}  "
                f"area={record['personAreaFraction']:.3f}  "
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
