#!/usr/bin/env python
"""Scan trip photos for cat (COCO 15) and dog (COCO 16) detections.

Artistic-portfolio policy: Eduard's portfolio is for good-looking places +
dishes. Pets (especially Eduard's cat Teddy) and dogs do not fit. This script
flags every photo containing a cat or dog above the confidence threshold so
the cleanup task can move them out of the catalogue.

Outputs:
    scripts/.cat-dog-scan.ndjson   # one row per photo
    scripts/.cat-dog-scan.json     # summary manifest

Usage:
    scripts/.inpaint-venv/Scripts/python.exe scripts/cat-dog-scan.py
        [--root public/photos/trips]
        [--threshold 0.5]

Read-only on JPG bytes.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Cache models locally inside the worktree.
_SCRIPT_DIR = Path(__file__).resolve().parent
_CACHE_DIR = _SCRIPT_DIR / ".inpaint-cache"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("YOLO_CONFIG_DIR", str(_CACHE_DIR / "ultralytics"))
os.environ.setdefault("TORCH_HOME", str(_CACHE_DIR / "torch"))
os.environ.setdefault("HF_HOME", str(_CACHE_DIR / "huggingface"))
os.environ.setdefault("XDG_CACHE_HOME", str(_CACHE_DIR))

CAT_CLASS_ID = 15  # COCO id for "cat"
DOG_CLASS_ID = 16  # COCO id for "dog"


def _load_yolo():
    from ultralytics import YOLO  # noqa: WPS433

    weights_path = _CACHE_DIR / "yolo11n.pt"
    if weights_path.exists():
        return YOLO(str(weights_path))
    return YOLO("yolo11n.pt")


def _detect(model, image, threshold):
    results = model.predict(
        image,
        conf=threshold,
        classes=[CAT_CLASS_ID, DOG_CLASS_ID],
        verbose=False,
    )
    cats: list[float] = []
    dogs: list[float] = []
    if not results:
        return cats, dogs
    r = results[0]
    if r.boxes is None or len(r.boxes) == 0:
        return cats, dogs
    conf = r.boxes.conf.cpu().numpy()
    cls = r.boxes.cls.cpu().numpy().astype(int)
    for c, k in zip(conf, cls):
        if k == CAT_CLASS_ID:
            cats.append(float(c))
        elif k == DOG_CLASS_ID:
            dogs.append(float(c))
    return cats, dogs


def _iter_jpgs(root: Path):
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
    try:
        rel = path.resolve().relative_to(repo_root.resolve())
    except ValueError:
        return str(path).replace("\\", "/")
    parts = rel.parts
    if len(parts) >= 3 and parts[0] == "public" and parts[1] == "photos":
        return "/".join(parts[2:])
    return rel.as_posix()


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="cat-dog-scan",
        description=(
            "Detect which trip photos contain cats or dogs so the artistic-"
            "portfolio cleanup can remove them from the catalogue."
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
        help="Repo root for relative `src` keys (default: cwd).",
    )
    parser.add_argument(
        "--ndjson-out",
        default="scripts/.cat-dog-scan.ndjson",
        help="Per-photo NDJSON audit log.",
    )
    parser.add_argument(
        "--manifest-out",
        default="scripts/.cat-dog-scan.json",
        help="Summary manifest.",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.5,
        help="Cat/dog detection confidence threshold (default 0.5).",
    )
    args = parser.parse_args(argv)

    from PIL import Image  # noqa: WPS433

    root = Path(args.root)
    if not root.is_dir():
        print(f"[catdog] root not found: {root}", file=sys.stderr)
        return 2
    repo_root = Path(args.repo_root)

    photos = _iter_jpgs(root)
    if not photos:
        print(f"[catdog] no JPG files under {root}", file=sys.stderr)
        return 2

    print(f"[catdog] {len(photos)} photo(s) under {root}")
    print(f"[catdog] threshold={args.threshold}")
    print("[catdog] loading YOLO11n...")
    model = _load_yolo()

    ndjson_path = Path(args.ndjson_out)
    ndjson_path.parent.mkdir(parents=True, exist_ok=True)
    ndjson_path.write_text("", encoding="utf-8")

    removals: list[dict] = []
    keep_count = 0
    remove_count = 0
    errors = 0
    t_start = time.perf_counter()

    with ndjson_path.open("a", encoding="utf-8") as logf:
        for i, src in enumerate(photos, start=1):
            t0 = time.perf_counter()
            rel_src = _to_repo_relative(src, repo_root)
            try:
                with Image.open(src) as raw:
                    image = raw.convert("RGB")
                w, h = image.size
                cats, dogs = _detect(model, image, args.threshold)
                cat_count = len(cats)
                dog_count = len(dogs)
                max_cat = max(cats) if cats else 0.0
                max_dog = max(dogs) if dogs else 0.0
                decision = "remove" if (cat_count or dog_count) else "keep"

                record = {
                    "src": rel_src,
                    "width": w,
                    "height": h,
                    "cat_count": cat_count,
                    "dog_count": dog_count,
                    "max_cat_conf": round(max_cat, 4),
                    "max_dog_conf": round(max_dog, 4),
                    "decision": decision,
                    "wallTimeMs": int((time.perf_counter() - t0) * 1000),
                }
                if decision == "remove":
                    remove_count += 1
                    removals.append(
                        {
                            "src": rel_src,
                            "cat_count": cat_count,
                            "dog_count": dog_count,
                            "max_cat_conf": round(max_cat, 4),
                            "max_dog_conf": round(max_dog, 4),
                        }
                    )
                else:
                    keep_count += 1
            except Exception as exc:  # noqa: BLE001
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
                f"{record.get('decision', '?'):>7}  "
                f"cat={record.get('cat_count', '-'):>1}({record.get('max_cat_conf', 0):.2f})  "
                f"dog={record.get('dog_count', '-'):>1}({record.get('max_dog_conf', 0):.2f})  "
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
        "threshold": args.threshold,
        "totalScanned": len(photos),
        "remove": remove_count,
        "keep": keep_count,
        "errors": errors,
        "removals": removals,
    }
    manifest_path = Path(args.manifest_out)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )

    print(
        f"[catdog] done in {elapsed:.1f}s. "
        f"scanned={len(photos)} remove={remove_count} keep={keep_count} errors={errors}"
    )
    print(f"[catdog] manifest: {manifest_path}")
    print(f"[catdog] ndjson:   {ndjson_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
