#!/usr/bin/env python
"""Run YOLO person + cat/dog + MediaPipe face + CLIP non-artistic detection
on a list of candidate JPG paths read from a JSON file.

Output: NDJSON to stdout, one row per file.
Read-only on input bytes.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

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

ARTISTIC_LABELS = [
    "a beautiful landscape photograph",
    "a scenic cityscape",
    "an architectural photograph of a building or castle or church",
    "a food photograph or dish on a plate",
    "an artistic interior photograph",
    "a still life photograph",
    "a coastline or beach landscape",
]
NON_ARTISTIC_LABELS = [
    "a gas pump or fuel station",
    "a parking lot or parked cars",
    "a store front or shopping centre",
    "a road sign or street sign",
    "a trash bin or dumpster",
    "an indoor mundane scene like a hotel lobby",
    "a transit station or train platform interior",
    "a receipt or document",
]
ALL_LABELS = ARTISTIC_LABELS + NON_ARTISTIC_LABELS
NON_ARTISTIC_SET = set(NON_ARTISTIC_LABELS)


def _load_yolo():
    from ultralytics import YOLO
    weights = _CACHE_DIR / "yolo11n.pt"
    if weights.exists():
        return YOLO(str(weights))
    return YOLO("yolo11n.pt")


def _load_face_detector():
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    import urllib.request

    fname = "blaze_face_full_range.tflite"
    model_path = _CACHE_DIR / fname
    if not model_path.exists():
        url = (
            "https://storage.googleapis.com/mediapipe-models/face_detector/"
            "blaze_face_full_range/float16/1/blaze_face_full_range.tflite"
        )
        urllib.request.urlretrieve(url, model_path)

    base_options = mp_python.BaseOptions(model_asset_path=str(model_path))
    options = mp_vision.FaceDetectorOptions(
        base_options=base_options, min_detection_confidence=0.4,
    )
    return mp_vision.FaceDetector.create_from_options(options)


def _load_clip():
    import open_clip
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, _, preprocess = open_clip.create_model_and_transforms(
        "ViT-B-32", pretrained="laion2b_s34b_b79k"
    )
    model = model.to(device).eval()
    tokenizer = open_clip.get_tokenizer("ViT-B-32")
    text_tokens = tokenizer(ALL_LABELS).to(device)
    with torch.no_grad():
        text_features = model.encode_text(text_tokens)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
    return model, preprocess, text_features, device


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--shortlist", required=True)
    p.add_argument("--person-conf", type=float, default=0.35)
    p.add_argument("--pet-conf", type=float, default=0.35)
    p.add_argument("--face-area", type=float, default=0.001)
    p.add_argument("--non-artistic-threshold", type=float, default=0.18)
    args = p.parse_args()

    print("loading models...", file=sys.stderr)
    yolo = _load_yolo()
    face_det = _load_face_detector()
    clip_model, preprocess, text_features, device = _load_clip()
    import torch
    import mediapipe as mp_mod
    from PIL import Image
    import numpy as np

    data = json.loads(Path(args.shortlist).read_text(encoding="utf-8"))
    total = sum(len(v) for v in data.values())
    print(f"scanning {total} candidates...", file=sys.stderr)

    done = 0
    for slug, items in data.items():
        for item in items:
            src = item["src"]
            row = {
                "slug": slug, "src": src, "file": item.get("file"),
                "iso": item.get("iso"), "lat": item.get("lat"), "lon": item.get("lon"),
                "cameraModel": item.get("cameraModel"),
                "face": 0.0, "faceArea": 0.0, "person": 0.0,
                "cat": 0.0, "dog": 0.0,
                "clipNonArtisticTop": [None, 0.0], "clipTopOverall": [None, 0.0],
                "clean": True, "reason": "",
            }
            try:
                img = Image.open(src).convert("RGB")
            except Exception as e:
                row["clean"] = False
                row["reason"] = f"open-failed:{e}"
                print(json.dumps(row), flush=True)
                done += 1
                continue

            try:
                yres = yolo.predict(img, conf=args.person_conf,
                                    classes=[PERSON_CLASS_ID, CAT_CLASS_ID, DOG_CLASS_ID],
                                    verbose=False)
                if yres and yres[0].boxes is not None and len(yres[0].boxes):
                    confs = yres[0].boxes.conf.cpu().numpy()
                    cls = yres[0].boxes.cls.cpu().numpy().astype(int)
                    for c, k in zip(confs, cls):
                        if k == PERSON_CLASS_ID and float(c) > row["person"]:
                            row["person"] = float(c)
                        elif k == CAT_CLASS_ID and float(c) > row["cat"]:
                            row["cat"] = float(c)
                        elif k == DOG_CLASS_ID and float(c) > row["dog"]:
                            row["dog"] = float(c)
            except Exception as e:
                row["reason"] += f" yolo-err:{e}"

            try:
                arr = np.array(img)
                mp_image = mp_mod.Image(image_format=mp_mod.ImageFormat.SRGB, data=arr)
                fr = face_det.detect(mp_image)
                if fr and fr.detections:
                    h, w = arr.shape[:2]
                    image_area = h * w
                    for d in fr.detections:
                        score = d.categories[0].score if d.categories else 0.0
                        bb = d.bounding_box
                        area_ratio = (bb.width * bb.height) / image_area if image_area > 0 else 0.0
                        if area_ratio >= args.face_area and score > row["face"]:
                            row["face"] = float(score)
                            row["faceArea"] = float(area_ratio)
            except Exception as e:
                row["reason"] += f" face-err:{e}"

            try:
                with torch.no_grad():
                    img_tensor = preprocess(img).unsqueeze(0).to(device)
                    img_features = clip_model.encode_image(img_tensor)
                    img_features = img_features / img_features.norm(dim=-1, keepdim=True)
                    similarity = (img_features @ text_features.T).squeeze(0)
                    sims = similarity.cpu().numpy().tolist()
                pairs = list(zip(ALL_LABELS, sims))
                pairs.sort(key=lambda x: x[1], reverse=True)
                row["clipTopOverall"] = [pairs[0][0], float(pairs[0][1])]
                nas = [pp for pp in pairs if pp[0] in NON_ARTISTIC_SET]
                if nas:
                    row["clipNonArtisticTop"] = [nas[0][0], float(nas[0][1])]
            except Exception as e:
                row["reason"] += f" clip-err:{e}"

            reasons = []
            if row["person"] >= args.person_conf:
                reasons.append(f"person@{row['person']:.2f}")
            if row["face"] >= 0.4 and row["faceArea"] >= args.face_area:
                reasons.append(f"face@{row['face']:.2f}")
            if row["cat"] >= args.pet_conf:
                reasons.append(f"cat@{row['cat']:.2f}")
            if row["dog"] >= args.pet_conf:
                reasons.append(f"dog@{row['dog']:.2f}")
            top_label, top_score = row["clipTopOverall"]
            if top_label in NON_ARTISTIC_SET and top_score >= args.non_artistic_threshold:
                reasons.append(f"non-artistic:{top_label}@{top_score:.2f}")
            row["clean"] = (len(reasons) == 0)
            row["reason"] = "; ".join(reasons) if reasons else "clean"

            print(json.dumps(row), flush=True)
            done += 1
            if done % 10 == 0:
                print(f"  progress {done}/{total}", file=sys.stderr)

    print(f"done {done}/{total}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
