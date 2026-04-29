"""
Visual content cleanup v2: scan ALL photos in scripts/photo-catalogue.json
(own AND Pexels) for inappropriate / non-artistic content using CLIP
zero-shot classification.

Triggered by Eduard reports: a Tirana own-camera photo shows an MG34 machine
gun and a Budapest photo shows a Claude chat screenshot. Prior sweep only
checked own-camera; this v2 covers the entire catalogue including stock.

Outputs NDJSON to stdout, one record per photo (not skipping pexels).

Usage:
  scripts/.inpaint-venv/Scripts/python.exe scripts/visual-content-cleanup-v2.py \
      --catalogue scripts/photo-catalogue.json \
      --photos-root public/photos \
      --threshold 0.18 \
      > scripts/.visual-cleanup-v2.ndjson
"""

import argparse
import json
import sys
from pathlib import Path

import torch
from PIL import Image

import open_clip


REJECT_LABELS = [
    "a weapon or firearm or military gear",
    "a machine gun or rifle or cannon",
    "a screenshot of a chat application or web page",
    "a phone screenshot or computer interface",
    "an empty conference room or whiteboard",
    "a bedroom or hotel room or hallway interior",
    "items being sold or marketplace listing",
    "a piece of clothing on a hanger or in a closet",
    "indoor mundane domestic scene",
]

ACCEPT_LABELS = [
    "a landmark monument or historic building",
    "a scenic landscape or coastline view",
    "an architectural detail of a cathedral or castle",
    "a food photograph or local cuisine",
    "a city skyline or street scene",
]

ALL_LABELS = REJECT_LABELS + ACCEPT_LABELS
REJECT_SET = set(REJECT_LABELS)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--catalogue", required=True)
    p.add_argument("--photos-root", required=True)
    p.add_argument("--threshold", type=float, default=0.18)
    p.add_argument("--model", default="ViT-B-32")
    p.add_argument("--pretrained", default="laion2b_s34b_b79k")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    catalogue_path = Path(args.catalogue)
    photos_root = Path(args.photos_root)

    if not catalogue_path.is_file():
        print(f"catalogue not found: {catalogue_path}", file=sys.stderr)
        return 2
    if not photos_root.is_dir():
        print(f"photos root not found: {photos_root}", file=sys.stderr)
        return 2

    with catalogue_path.open(encoding="utf-8") as f:
        catalogue = json.load(f)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(
        f"loading model {args.model} ({args.pretrained}) on {device}...",
        file=sys.stderr,
    )
    model, _, preprocess = open_clip.create_model_and_transforms(
        args.model, pretrained=args.pretrained
    )
    model = model.to(device).eval()
    tokenizer = open_clip.get_tokenizer(args.model)

    text_tokens = tokenizer(ALL_LABELS).to(device)
    with torch.no_grad():
        text_features = model.encode_text(text_tokens)
        text_features = text_features / text_features.norm(
            dim=-1, keepdim=True
        )

    total = len(catalogue)
    print(f"scanning {total} catalogue entries (own + pexels)...",
          file=sys.stderr)

    for i, entry in enumerate(catalogue):
        src = entry.get("src", "")
        photo_path = photos_root / src
        if not photo_path.is_file():
            print(f"missing file: {photo_path}", file=sys.stderr)
            continue

        try:
            img = Image.open(photo_path).convert("RGB")
        except Exception as exc:  # noqa: BLE001
            print(f"open failed {photo_path}: {exc}", file=sys.stderr)
            continue

        image_input = preprocess(img).unsqueeze(0).to(device)
        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features = image_features / image_features.norm(
                dim=-1, keepdim=True
            )
            sims = (100.0 * image_features @ text_features.T).softmax(dim=-1)
            scores = sims[0].cpu().tolist()

        ranked = sorted(
            zip(ALL_LABELS, scores), key=lambda kv: kv[1], reverse=True
        )
        top_label, top_score = ranked[0]

        if top_label in REJECT_SET and top_score > args.threshold:
            decision = "remove"
        else:
            decision = "keep"

        record = {
            "src": src,
            "topLabel": top_label,
            "topScore": round(float(top_score), 4),
            "decision": decision,
            "isPexels": Path(src).name.lower().startswith("pexels-"),
            "scores": [
                [lbl, round(float(s), 4)] for lbl, s in ranked
            ],
        }
        print(json.dumps(record))

        if (i + 1) % 25 == 0:
            print(f"  {i + 1}/{total}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
