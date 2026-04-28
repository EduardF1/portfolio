"""
CLIP zero-shot classification for non-artistic photos in public/photos/trips/.

Outputs NDJSON to stdout, one record per photo:
  {"src": "trips/.../foo.jpg", "topLabel": "...", "topScore": 0.42,
   "decision": "keep" | "review-remove", "scores": [[label, score], ...]}

Decision rule: pick the highest-scoring label across the union of artistic +
non-artistic labels. If the top label is in the non-artistic set AND
score > NON_ARTISTIC_THRESHOLD, mark "review-remove". Otherwise "keep".

Usage:
  scripts/.inpaint-venv/Scripts/python.exe scripts/classify-non-artistic.py \\
      --photos-dir public/photos/trips \\
      --threshold 0.18 \\
      --gas-pump-threshold 0.18 \\
      > scripts/.non-artistic-scan.ndjson
"""

import argparse
import json
import os
import sys
from pathlib import Path

import torch
from PIL import Image

import open_clip


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


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--photos-dir", required=True,
                   help="Path to public/photos/trips/")
    p.add_argument("--threshold", type=float, default=0.18,
                   help="Default non-artistic decision threshold (0..1)")
    p.add_argument("--gas-pump-threshold", type=float, default=0.18,
                   help="Override threshold for gas-pump label")
    p.add_argument("--model", default="ViT-B-32",
                   help="open_clip model name")
    p.add_argument("--pretrained", default="laion2b_s34b_b79k",
                   help="open_clip pretrained tag")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    photos_root = Path(args.photos_dir)
    if not photos_root.is_dir():
        print(f"photos dir not found: {photos_root}", file=sys.stderr)
        return 2

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"loading model {args.model} ({args.pretrained}) on {device}...",
          file=sys.stderr)
    model, _, preprocess = open_clip.create_model_and_transforms(
        args.model, pretrained=args.pretrained
    )
    model = model.to(device).eval()
    tokenizer = open_clip.get_tokenizer(args.model)

    text_tokens = tokenizer(ALL_LABELS).to(device)
    with torch.no_grad():
        text_features = model.encode_text(text_tokens)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)

    photo_paths = sorted(
        p for p in photos_root.rglob("*")
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )
    print(f"scanning {len(photo_paths)} photos...", file=sys.stderr)

    for i, photo_path in enumerate(photo_paths):
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

        ranked = sorted(zip(ALL_LABELS, scores), key=lambda kv: kv[1],
                        reverse=True)
        top_label, top_score = ranked[0]

        # Apply per-label threshold (gas pump can be lowered separately)
        if top_label in NON_ARTISTIC_SET:
            label_threshold = (
                args.gas_pump_threshold
                if "gas pump" in top_label
                else args.threshold
            )
            decision = (
                "review-remove" if top_score > label_threshold else "keep"
            )
        else:
            decision = "keep"

        # Path relative to public/photos/ (= trips/<slug>/<file>.jpg)
        # photos_root resolves to <repo>/public/photos/trips
        # We want a src relative to public/photos/, so prefix with the parent
        # name "trips/" plus the relative-to-trips path.
        rel_to_trips = photo_path.relative_to(photos_root)
        src = f"trips/{rel_to_trips.as_posix()}"

        record = {
            "src": src,
            "topLabel": top_label,
            "topScore": round(float(top_score), 4),
            "decision": decision,
            "scores": [[lbl, round(float(s), 4)] for lbl, s in ranked],
        }
        print(json.dumps(record))

        if (i + 1) % 25 == 0:
            print(f"  {i + 1}/{len(photo_paths)}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
