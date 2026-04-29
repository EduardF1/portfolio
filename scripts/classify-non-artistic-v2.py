"""
Aggressive second-pass CLIP zero-shot classifier for sales/work content
that the prior sweep missed (e.g. laptop+mouse for-sale shot at Horsens
2020-02, Tican meat warehouse at Vejle).

Outputs NDJSON to stdout, one record per OWN-CAMERA photo (skips Pexels).

Usage:
  scripts/.inpaint-venv/Scripts/python.exe scripts/classify-non-artistic-v2.py \
      --photos-dir public/photos/trips \
      --threshold 0.15 \
      > scripts/.sales-work-sweep.ndjson
"""

import argparse
import json
import sys
from pathlib import Path

import torch
from PIL import Image

import open_clip


KEEP_LABELS = [
    "a landmark or monument photograph",
    "a scenic landscape or coastline",
    "an architectural photograph of a historic building or castle or church",
    "a food photograph or dish on a plate",
    "a city street scene with historic buildings",
    "an artistic interior of a museum or cultural site",
]

REMOVE_LABELS = [
    "a laptop or computer or electronic device",
    "a computer mouse or keyboard or wires",
    "consumer goods packaging or product photography",
    "a work environment or office or warehouse",
    "items being sold online or marketplace listings",
    "vehicles in parking lots or driving",
    "indoor mundane scene like a hotel room or hallway",
]

ALL_LABELS = KEEP_LABELS + REMOVE_LABELS
REMOVE_SET = set(REMOVE_LABELS)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--photos-dir", required=True)
    p.add_argument("--threshold", type=float, default=0.15)
    p.add_argument("--model", default="ViT-B-32")
    p.add_argument("--pretrained", default="laion2b_s34b_b79k")
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
        if p.is_file()
        and p.suffix.lower() in {".jpg", ".jpeg", ".png"}
        and not p.name.lower().startswith("pexels-")
    )
    print(f"scanning {len(photo_paths)} own-camera photos (pexels skipped)...",
          file=sys.stderr)

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

        if top_label in REMOVE_SET and top_score > args.threshold:
            decision = "review-remove"
        else:
            decision = "keep"

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

        if (i + 1) % 10 == 0:
            print(f"  {i + 1}/{len(photo_paths)}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
