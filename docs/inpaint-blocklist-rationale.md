# Inpaint blocklist rationale

`scripts/inpaint-blocklist.json` is the belt-and-braces sculpture/monument
guard for the people-inpainting pipeline (`scripts/inpaint-people.py`,
shipping on `feat/inpaint-people-pipeline` / PR #41).

## Why this exists

The first 5-photo run of PR #41 used YOLOv8 person-detection and
catastrophically erased two heritage subjects:

- **Pula anti-fascist memorial** (Croatia) — bronze human figures detected
  as "people" and overpainted with sky.
- **Trieste classical statue** (Italy) — neoclassical marble figure
  inpainted away.

The other agent has since switched the pipeline to MediaPipe **face**
detection, which sharply reduces the false-positive rate — stone and
bronze faces rarely pass living-human face detectors. But the rate is
not zero: detailed Roman busts, Renaissance statuary, and ornate
Baroque facades still occasionally trigger MediaPipe.

This blocklist is the pre-flight skip list. Any catalogue entry whose
`src` matches a blocklist row must be **copied through unchanged** by
the pipeline — same effect as if no face was detected.

## How it's wired (Option B)

This branch (`feat/inpaint-monument-blocklist`) ships **only** the JSON
+ this doc. The pipeline-side wiring is left to PR #41 or a follow-up:

```python
# top of scripts/inpaint-people.py, before the per-photo loop
import json
from pathlib import Path

BLOCKLIST = {
    e["src"]
    for e in json.loads(
        (Path(__file__).parent / "inpaint-blocklist.json").read_text(encoding="utf-8")
    )
}

# inside the per-entry loop
if entry["src"] in BLOCKLIST:
    log.info("skip:blocklist src=%s", entry["src"])
    shutil.copy2(src_path, out_path)
    continue
```

Order matters: the blocklist check must run **before** face detection,
not after. Otherwise we waste the inference and still risk a misfire
between detection and the skip decision.

## The rules

Each rule below describes one filter applied while building the JSON.
Counts are at the time of writing (catalogue size 189).

### Personal-photo rules (place-based)

| Rule | Count | Rationale |
| --- | --- | --- |
| `place.city=Grad Pula` | 5 | Roman amphitheatre + anti-fascist bronze memorial — direct PR #41 catastrophe site. |
| `place.city=Trieste` | 9 | Piazza Unità d'Italia neoclassical statues — direct PR #41 catastrophe site. |
| `place.city=Schwangau` | 5 | Neuschwanstein castle area; figural ornament on facade and gates. |
| `place.city=Brzezinka\|Oświęcim` | 3 | Auschwitz-Birkenau memorial. Sensitive site — inpainting is unsafe regardless of detection. |
| `place.city=Dachau` | 1 | KZ memorial. Sculptural memorial elements in frame. |
| `place.city=Sinaia` | 1 | Peles Castle area; carved wooden and stone figures throughout the facade. |
| `gps:Belvedere` (Vienna, lat 48.18–48.19, lon 16.38–16.39) | 7 | GPS-confirmed Schloss Belvedere cluster. Sphinx and putti statues throughout palace and gardens. The wider `place.city=Vienna` was deliberately **not** used as a blanket — the eighth Vienna photo at lon 16.31 is elsewhere in the city and is left to face detection. |

Personal-photo subtotal: **31** entries.

### Stock-photo rules (filename keyword)

Pexels filenames are descriptive. Rules match on lowercase filename
substring, deduped against earlier matches.

| Rule | Count | Rationale |
| --- | --- | --- |
| `filename:statue` | 1 | Brussels Grand-Place statue — figural sculpture is the subject. |
| `filename:cathedral` | 2 | Aarhus + Helsinki cathedrals — facades with carved saints/figures. |
| `filename:church` | 3 | Randers Haslund + Brașov Black Church (×2) — facades and figural ornament. |
| `filename:castle` | 4 | Kavala + Sinaia Peles (×2) + Saranda Lekursi (excluded by earlier `lekursi` match if present) — castles in this catalogue have figural ornament; safer to skip. |
| `filename:fortress` | 1 | Gjirokastra fortress — figural relief / flag-bearer figures possible. |
| `filename:gothic-revival` | 1 | Luxembourg gothic-revival — facade with figures. |
| `filename:neoclassical` | 1 | Bucharest neoclassical tenement — facade reliefs. |
| `filename:odeon-theatre` | 1 | Bucharest Odeon — classical theatre facade with figures. |
| `filename:triumph` / `filename:arcul-de-triumf` | 2 | Bucharest triumphal arches — relief sculpture is the subject. |

Stock-photo subtotal: **16** entries.

### Total: **47** entries (~25% of the 189-entry catalogue).

## Things that were considered and **not** blocklisted

Honest non-blocks, kept in the pipeline so we still inpaint actual
crowds:

- **Vienna outside Belvedere GPS box** — the lone Vienna photo at lon
  16.311 (Schönbrunn-side) is left to face detection. If it later turns
  out to be a Schönbrunn statue garden shot, add a manual entry.
- **Krakow Old Town personal photos (3)** — medieval old town, but the
  GPS scatter (50.062–50.064) suggests street/market scenes, not the
  Wawel statuary cluster. Face detection can handle them.
- **Bucharest, Helsinki, Milan, Istanbul personal photos** — all single
  shots in big cities, likely street scenes, not statue-prominent.
- **Generic Pexels architecture** — `cobblestone`, `half-timbered`,
  `aerial`, `harbor`, `philharmonie`, `wasserschloss`, `parliament`,
  `quiet-street`, `rooftops` — too thin a sculpture signal. Let face
  detection do its job.

The brief was explicit: *"Don't be aggressive — only block photos with
clear sculpture/monument signals. If unsure, leave it in — face
detection is the primary defense."* That's the calibration target.

## Audit trail / how to add or remove entries

The JSON is the source of truth. To **add** an entry:

1. Determine the `src` (path under `public/photos/`, matching the
   catalogue exactly).
2. Append a row with `src`, `reason` (one short sentence), and
   `matchedRule` (free-form rule tag — useful for grouping).
3. The pipeline reads the file fresh on every run; no rebuild needed.

To **remove** an entry: delete the row. Re-run the pipeline.

There is no schema validation at runtime — the pipeline only consults
`src`. `reason` and `matchedRule` are documentation aids for humans
auditing the list.

## Pattern for future entries

> When in doubt, leave the entry **out** of the blocklist —
> face detection is the primary defense, the blocklist is the
> belt-and-braces fallback for known catastrophic sites only.

Trigger a new entry only when one of these is true:

1. The site has been observed to break inpainting (post-hoc add).
2. The site is a memorial/sensitive cultural site where any inpainting
   is ethically wrong even if the detection works.
3. The photo is dominated by figural sculpture and a face-detector
   misfire would be visually catastrophic.

If none of those apply, trust face detection. Over-blocklisting
defeats the point of running the pipeline at all.
