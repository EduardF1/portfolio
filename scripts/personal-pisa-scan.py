#!/usr/bin/env python
"""Detection scan for /personal + /travel/pisa photos against the artistic
portfolio rules.

Three rules, applied per photo (priority order):
  1. cat or dog detected (YOLO11n COCO 15/16, conf >= 0.5)
       -> decision = remove-pet
  2. CLIP zero-shot top label is non-artistic AND topClipScore > 0.18
       -> decision = remove-non-artistic
  3. MediaPipe Face Detection (full-range) finds face with conf > 0.6 AND
     face area >= 0.5 % of frame
        a. largest face area < 15 % of frame -> decision = inpaint
        b. >= 15 %                            -> decision = flag-dominant-face
  4. otherwise -> decision = keep

Outputs:
    scripts/.personal-pisa-scan.ndjson
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

# Cache models locally inside the worktree.
_SCRIPT_DIR = Path(__file__).resolve().parent
_CACHE_DIR = _SCRIPT_DIR / ".inpaint-cache"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("YOLO_CONFIG_DIR", str(_CACHE_DIR / "ultralytics"))
os.environ.setdefault("TORCH_HOME", str(_CACHE_DIR / "torch"))
os.environ.setdefault("HF_HOME", str(_CACHE_DIR / "huggingface"))
os.environ.setdefault("XDG_CACHE_HOME", str(_CACHE_DIR))

PERSON_CLASS_ID = 0
CAT_CLASS_ID = 15
DOG_CLASS_ID = 16

# CLIP zero-shot label set. Each label maps to a bucket: "artistic" or
# "non-artistic". The pipeline flags a photo for removal when the top label
# (highest softmax score) is non-artistic AND topScore > 0.18 -- meaning a
# clearly non-artistic shot (receipt, screenshot, indoor desk scene, etc.).
# Travel/landscape/architecture/cars/sport stadiums all count as artistic.
CLIP_LABELS: list[tuple[str, str]] = [
    # Artistic (keep)
    ("a landscape photograph", "artistic"),
    ("a cityscape photograph", "artistic"),
    ("a photograph of architecture or a building", "artistic"),
    ("a photograph of a monument or sculpture", "artistic"),
    ("a photograph of a street scene", "artistic"),
    ("a photograph of food on a plate", "artistic"),
    ("a photograph of a beach or coastline", "artistic"),
    ("a photograph of mountains or nature", "artistic"),
    ("a photograph of a sports stadium with crowd", "artistic"),
    ("a photograph of a sports car", "artistic"),
    ("a photograph of a tower or historic landmark", "artistic"),
    ("an interior shot of a cathedral or church", "artistic"),
    ("a portrait of a person", "artistic"),
    # Non-artistic (remove)
    ("a screenshot of a computer screen", "non-artistic"),
    ("a photograph of a document or piece of paper", "non-artistic"),
    ("a photograph of a receipt", "non-artistic"),
    ("a photograph of a meeting in an office", "non-artistic"),
    ("a photograph of an ID card or passport", "non-artistic"),
    ("a blurry or out-of-focus snapshot", "non-artistic"),
    ("a photograph of household clutter", "non-artistic"),
    ("a photograph of food packaging", "non-artistic"),
]

NON_ARTISTIC_THRESHOLD = 0.18
FACE_CONFIDENCE = 0.6
MIN_FACE_AREA = 0.005
MAX_FACE_AREA = 0.15
PET_THRESHOLD = 0.5

_FACE_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_detector/"
    "blaze_face_full_range/float16/1/blaze_face_full_range.tflite"
)
_FACE_MODEL_FILENAME = "blaze_face_full_range.tflite"


def _load_yolo():
    from ultralytics import YOLO  # noqa: WPS433

    weights_path = _CACHE_DIR / "yolo11n.pt"
    if weights_path.exists():
        return YOLO(str(weights_path))
    return YOLO("yolo11n.pt")


def _load_face_detector():
    import urllib.request  # noqa: WPS433
    from mediapipe.tasks import python as mp_python  # noqa: WPS433
    from mediapipe.tasks.python import vision as mp_vision  # noqa: WPS433

    model_path = _CACHE_DIR / _FACE_MODEL_FILENAME
    if not model_path.exists():
        urllib.request.urlretrieve(_FACE_MODEL_URL, str(model_path))

    base_opts = mp_python.BaseOptions(model_asset_path=str(model_path))
    options = mp_vision.FaceDetectorOptions(
        base_options=base_opts,
        min_detection_confidence=0.3,
    )
    return mp_vision.FaceDetector.create_from_options(options)


def _load_clip():
    """Load OpenCLIP (ViT-B-32 / openai). ~600 MB on first run."""
    import open_clip  # noqa: WPS433
    import torch  # noqa: WPS433

    model, _, preprocess = open_clip.create_model_and_transforms(
        "ViT-B-32", pretrained="openai"
    )
    tokenizer = open_clip.get_tokenizer("ViT-B-32")
    model.eval()

    label_strings = [lab for lab, _bucket in CLIP_LABELS]
    with torch.no_grad():
        text_tokens = tokenizer(label_strings)
        text_features = model.encode_text(text_tokens)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
    return {
        "model": model,
        "preprocess": preprocess,
        "text_features": text_features,
        "labels": label_strings,
    }


def _detect_pets(model, image, threshold):
    results = model.predict(
        image,
        conf=threshold,
        classes=[CAT_CLASS_ID, DOG_CLASS_ID],
        verbose=False,
    )
    cats = 0
    dogs = 0
    if not results:
        return cats, dogs
    r = results[0]
    if r.boxes is None or len(r.boxes) == 0:
        return cats, dogs
    cls = r.boxes.cls.cpu().numpy().astype(int)
    for k in cls:
        if k == CAT_CLASS_ID:
            cats += 1
        elif k == DOG_CLASS_ID:
            dogs += 1
    return cats, dogs


def _detect_persons(model, image, threshold):
    results = model.predict(
        image, conf=threshold, classes=[PERSON_CLASS_ID], verbose=False
    )
    if not results:
        return 0
    r = results[0]
    if r.boxes is None or len(r.boxes) == 0:
        return 0
    cls = r.boxes.cls.cpu().numpy().astype(int)
    return int((cls == PERSON_CLASS_ID).sum())


def _detect_faces(detector, image, face_confidence, min_face_area):
    import mediapipe as mp  # noqa: WPS433
    import numpy as np  # noqa: WPS433

    arr = np.asarray(image)
    h, w = arr.shape[:2]
    frame_area = float(w * h) if w and h else 1.0
    if frame_area <= 0:
        return [], 0.0

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=arr)
    result = detector.detect(mp_image)
    faces: list[float] = []
    largest_frac = 0.0
    if not result.detections:
        return faces, largest_frac
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
        frac = bbox_area / frame_area
        if frac < min_face_area:
            continue
        faces.append(score)
        if frac > largest_frac:
            largest_frac = frac
    return faces, largest_frac


def _classify_clip(clip_state, image):
    import torch  # noqa: WPS433

    preprocess = clip_state["preprocess"]
    model = clip_state["model"]
    text_features = clip_state["text_features"]

    with torch.no_grad():
        img_tensor = preprocess(image).unsqueeze(0)
        img_features = model.encode_image(img_tensor)
        img_features = img_features / img_features.norm(dim=-1, keepdim=True)
        # cosine sim, then softmax for normalised "score".
        logits = (100.0 * img_features @ text_features.T).softmax(dim=-1)
    scores = logits[0].cpu().numpy().tolist()
    labels = clip_state["labels"]
    pairs = list(zip(labels, scores))
    pairs.sort(key=lambda p: -p[1])
    top_label, top_score = pairs[0]
    bucket = next(b for (lab, b) in CLIP_LABELS if lab == top_label)
    return top_label, float(top_score), bucket, pairs[:3]


def _decide(face_count, largest_face_frac, cat_count, dog_count, top_bucket, top_score):
    if cat_count > 0 or dog_count > 0:
        return "remove-pet"
    if top_bucket == "non-artistic" and top_score > NON_ARTISTIC_THRESHOLD:
        return "remove-non-artistic"
    if face_count > 0 and largest_face_frac < MAX_FACE_AREA:
        return "inpaint"
    if face_count > 0 and largest_face_frac >= MAX_FACE_AREA:
        return "flag-dominant-face"
    return "keep"


def main(argv=None):
    parser = argparse.ArgumentParser(prog="personal-pisa-scan")
    parser.add_argument("--root", default=".")
    parser.add_argument(
        "--out", default="scripts/.personal-pisa-scan.ndjson"
    )
    args = parser.parse_args(argv)

    from PIL import Image  # noqa: WPS433

    targets = [
        "public/photos/personal/apr-2023-milan.jpg",
        "public/photos/personal/apr-2025-vienna.jpg",
        "public/photos/personal/bvb-yellow-wall-suedtribuene.jpg",
        "public/photos/personal/mar-2024-spring-evening.jpg",
        "public/photos/personal/mar-2026-pula.jpg",
        "public/photos/personal/mar-2026-recent-trip.jpg",
        "public/photos/personal/may-2024-late-spring.jpg",
        "public/photos/personal/nov-2023-autumn.jpg",
        "public/travel/pisa/01.jpg",
        "public/travel/pisa/02.jpg",
        "public/travel/pisa/03.jpg",
    ]

    root = Path(args.root).resolve()
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print("[scan] loading models...")
    yolo = _load_yolo()
    face_detector = _load_face_detector()
    clip_state = _load_clip()
    print("[scan] models loaded")

    with out_path.open("w", encoding="utf-8") as fh:
        for rel in targets:
            src = root / rel
            if not src.exists():
                rec = {"src": rel, "error": "missing-on-disk"}
                fh.write(json.dumps(rec) + "\n")
                print(f"[skip] missing {rel}")
                continue
            t0 = time.perf_counter()
            try:
                image = Image.open(src).convert("RGB")
                w, h = image.size
                cats, dogs = _detect_pets(yolo, image, PET_THRESHOLD)
                persons = _detect_persons(yolo, image, 0.4)
                faces, largest_face_frac = _detect_faces(
                    face_detector, image, FACE_CONFIDENCE, MIN_FACE_AREA
                )
                top_label, top_score, top_bucket, top3 = _classify_clip(
                    clip_state, image
                )
                decision = _decide(
                    len(faces),
                    largest_face_frac,
                    cats,
                    dogs,
                    top_bucket,
                    top_score,
                )
                rec = {
                    "src": rel,
                    "width": int(w),
                    "height": int(h),
                    "personCount": int(persons),
                    "faceCount": int(len(faces)),
                    "largestFaceFraction": round(float(largest_face_frac), 6),
                    "catCount": int(cats),
                    "dogCount": int(dogs),
                    "topClipLabel": top_label,
                    "topClipScore": round(float(top_score), 6),
                    "topClipBucket": top_bucket,
                    "topClipTop3": [
                        [lab, round(float(sc), 6)] for (lab, sc) in top3
                    ],
                    "decision": decision,
                    "wallTimeMs": int((time.perf_counter() - t0) * 1000),
                }
            except Exception as exc:  # noqa: BLE001
                rec = {"src": rel, "error": repr(exc)}
            fh.write(json.dumps(rec) + "\n")
            fh.flush()
            print(
                f"[scan] {rel}: decision={rec.get('decision', 'error')} "
                f"faces={rec.get('faceCount', '-')} "
                f"face_frac={rec.get('largestFaceFraction', '-')} "
                f"cats={rec.get('catCount', '-')} "
                f"dogs={rec.get('dogCount', '-')} "
                f"clip='{rec.get('topClipLabel', '-')}' "
                f"score={rec.get('topClipScore', '-')}"
            )

    print(f"[scan] done -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
