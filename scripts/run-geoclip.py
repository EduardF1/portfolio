#!/usr/bin/env python
"""
run-geoclip.py
==============

Predict approximate lat/lon for portfolio photos that lack EXIF GPS metadata
using the GeoCLIP image-only geolocation model. Reverse-geocodes the top-1
prediction via the existing Nominatim cache (or live Nominatim, with the same
1 req/sec policy as build-photo-catalogue.mjs).

Outputs:
  scripts/.geoclip-predictions.json
    {
      "generated_at": "...",
      "model": "geoclip 1.2.0",
      "no_gps_count": N,
      "predictions": [
        {
          "src": "trips/.../foo.jpg",
          "place_hint": "Malmo, Sweden",   # existing catalogue hint, if any
          "topK": [
            { "lat": ..., "lon": ..., "prob": ... },
            ...
          ],
          "top1_geocode": {
            "city": ...,
            "country": ...,
            "display": ...,
            "from_cache": bool
          }
        },
        ...
      ],
      "smoke_test": {
        "samples": [
          {
            "src": "...",
            "truth_lat": ..., "truth_lon": ...,
            "pred_lat": ..., "pred_lon": ...,
            "km_error": ...
          },
          ...
        ],
        "mean_km": ...,
        "median_km": ...
      }
    }

DOES NOT modify scripts/photo-catalogue.json. Eduard signs off; a follow-up
agent applies approved entries.

Usage (from repo root, inside the worktree):
  scripts/.inpaint-venv/Scripts/python.exe scripts/run-geoclip.py
"""

from __future__ import annotations

import json
import math
import os
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# Force UTF-8 stdout so we can print place names with diacritics on Windows.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except Exception:
    pass

# ---------------------------------------------------------------------------
# Paths and constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
PHOTOS_ROOT = REPO_ROOT / "public" / "photos"
CATALOGUE_PATH = SCRIPT_DIR / "photo-catalogue.json"
GEOCODE_CACHE_PATH = SCRIPT_DIR / ".geocode-cache.json"
PREDICTIONS_PATH = SCRIPT_DIR / ".geoclip-predictions.json"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
NOMINATIM_USER_AGENT = "EduardFischer.dev portfolio batch-geocoder/1.0"
NOMINATIM_MIN_INTERVAL_MS = 1500  # 1 req/sec + 500 ms safety, for back-to-back batches
NOMINATIM_BACKOFF_429_S = 30      # if we hit 429, sleep this long before continuing

TOP_K = 5
SMOKE_TEST_K = 3  # number of GPS-known photos to verify accuracy


# ---------------------------------------------------------------------------
# Geocode helpers (mirror build-photo-catalogue.mjs semantics)
# ---------------------------------------------------------------------------

def geocode_cache_key(lat: float, lon: float) -> str:
    """Match build-photo-catalogue.mjs geocodeCacheKey: 2-decimal rounded."""
    return f"{round(lat * 100) / 100:.2f},{round(lon * 100) / 100:.2f}"


def parse_nominatim_response(body: dict) -> dict:
    addr = body.get("address") or {}
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("municipality")
        or addr.get("county")
        or None
    )
    country = addr.get("country") or None
    display = body.get("display_name") or None
    if city and country:
        short = f"{city}, {country}"
    elif country:
        short = country
    else:
        short = display or ""
    return {"city": city, "country": country, "display": short}


_LAST_NOMINATIM_AT = 0.0


def reverse_geocode_live(lat: float, lon: float) -> dict | None:
    """Live Nominatim call, rate-limited to ~1 req/sec with 429 backoff."""
    global _LAST_NOMINATIM_AT
    now = time.time()
    elapsed_ms = (now - _LAST_NOMINATIM_AT) * 1000
    if elapsed_ms < NOMINATIM_MIN_INTERVAL_MS:
        time.sleep((NOMINATIM_MIN_INTERVAL_MS - elapsed_ms) / 1000)
    qs = urllib.parse.urlencode({
        "format": "jsonv2",
        "lat": f"{lat}",
        "lon": f"{lon}",
        "zoom": "10",
        "accept-language": "en",
    })
    req = urllib.request.Request(
        f"{NOMINATIM_URL}?{qs}",
        headers={"User-Agent": NOMINATIM_USER_AGENT},
    )
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            _LAST_NOMINATIM_AT = time.time()
            return parse_nominatim_response(body)
        except urllib.error.HTTPError as exc:  # type: ignore[attr-defined]
            if exc.code == 429 and attempt == 0:
                print(
                    f"  WARN: Nominatim 429 for {lat:.4f},{lon:.4f}; backing off {NOMINATIM_BACKOFF_429_S}s",
                    file=sys.stderr,
                )
                time.sleep(NOMINATIM_BACKOFF_429_S)
                continue
            print(f"  WARN: Nominatim {lat:.4f},{lon:.4f} -> {exc}", file=sys.stderr)
            _LAST_NOMINATIM_AT = time.time()
            return None
        except Exception as exc:
            print(f"  WARN: Nominatim {lat:.4f},{lon:.4f} -> {exc}", file=sys.stderr)
            _LAST_NOMINATIM_AT = time.time()
            return None
    return None


def reverse_geocode(lat: float, lon: float, cache: dict) -> tuple[dict | None, bool]:
    """Cache-first reverse geocode. Returns (place, from_cache)."""
    key = geocode_cache_key(lat, lon)
    if key in cache:
        return cache[key], True
    place = reverse_geocode_live(lat, lon)
    if place is not None:
        cache[key] = place
    return place, False


# ---------------------------------------------------------------------------
# Distance
# ---------------------------------------------------------------------------

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0088  # mean Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# ---------------------------------------------------------------------------
# Catalogue
# ---------------------------------------------------------------------------

def load_catalogue() -> list[dict]:
    with CATALOGUE_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def resolve_photo_path(src: str) -> Path:
    return PHOTOS_ROOT / src.replace("/", os.sep)


# ---------------------------------------------------------------------------
# GeoCLIP wrapper
# ---------------------------------------------------------------------------

def predict_topk(model, image_path: Path, top_k: int = TOP_K) -> list[dict]:
    gps_tensor, prob_tensor = model.predict(str(image_path), top_k=top_k)
    out = []
    for i in range(top_k):
        lat, lon = gps_tensor[i].cpu().numpy()
        out.append({
            "lat": float(lat),
            "lon": float(lon),
            "prob": float(prob_tensor[i].cpu()),
        })
    return out


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def pick_smoke_test_entries(entries: list[dict]) -> list[dict]:
    """Pick 3 GPS-known photos from diverse trips (not stock)."""
    chosen: list[dict] = []
    seen_trips: set[str] = set()
    for e in entries:
        if not e.get("hasGps"):
            continue
        if (e.get("source") or {}).get("type") == "stock":
            continue
        # extract trip folder slug from src
        parts = e["src"].split("/")
        trip = parts[1] if len(parts) > 1 else ""
        if trip in seen_trips:
            continue
        photo_path = resolve_photo_path(e["src"])
        if not photo_path.exists():
            continue
        chosen.append(e)
        seen_trips.add(trip)
        if len(chosen) >= SMOKE_TEST_K:
            break
    return chosen


def run() -> int:
    print(f"[run-geoclip] Loading catalogue from {CATALOGUE_PATH}")
    catalogue = load_catalogue()
    no_gps = [e for e in catalogue if not e.get("hasGps")]
    print(f"[run-geoclip] No-GPS entries: {len(no_gps)}")

    # Load geocode cache once
    if GEOCODE_CACHE_PATH.exists():
        with GEOCODE_CACHE_PATH.open("r", encoding="utf-8") as f:
            geocode_cache = json.load(f)
    else:
        geocode_cache = {}
    print(f"[run-geoclip] Geocode cache entries: {len(geocode_cache)}")

    print("[run-geoclip] Loading GeoCLIP model (cpu)...")
    from geoclip import GeoCLIP  # noqa: WPS433  (deferred import to give cleaner error if missing)
    model = GeoCLIP()
    model.eval()
    print("[run-geoclip] Model ready.")

    # ---- Smoke test --------------------------------------------------------
    print("\n[run-geoclip] === Smoke test ===")
    smoke_entries = pick_smoke_test_entries(catalogue)
    print(f"[run-geoclip] Picked {len(smoke_entries)} GPS-known photos.")
    smoke_results: list[dict] = []
    for e in smoke_entries:
        photo_path = resolve_photo_path(e["src"])
        truth_lat = e["gps"]["lat"]
        truth_lon = e["gps"]["lon"]
        try:
            preds = predict_topk(model, photo_path, top_k=TOP_K)
        except Exception as exc:
            print(f"  ERR: {e['src']} -> {exc}")
            continue
        top = preds[0]
        km = haversine_km(truth_lat, truth_lon, top["lat"], top["lon"])
        print(
            f"  src={e['src']}\n"
            f"    truth=({truth_lat:.4f}, {truth_lon:.4f})\n"
            f"    top1 =({top['lat']:.4f}, {top['lon']:.4f}, p={top['prob']:.4f})\n"
            f"    km_error={km:.2f}"
        )
        smoke_results.append({
            "src": e["src"],
            "truth_lat": truth_lat,
            "truth_lon": truth_lon,
            "pred_lat": top["lat"],
            "pred_lon": top["lon"],
            "pred_prob": top["prob"],
            "km_error": km,
        })

    smoke_summary: dict = {"samples": smoke_results}
    if smoke_results:
        errs = [r["km_error"] for r in smoke_results]
        smoke_summary["mean_km"] = statistics.fmean(errs)
        smoke_summary["median_km"] = statistics.median(errs)
        smoke_summary["min_km"] = min(errs)
        smoke_summary["max_km"] = max(errs)

    # ---- No-GPS predictions (predict first, geocode second) ---------------
    print("\n[run-geoclip] === No-GPS predictions (image inference pass) ===")
    predictions: list[dict] = []
    for i, e in enumerate(no_gps, start=1):
        src = e["src"]
        photo_path = resolve_photo_path(src)
        if not photo_path.exists():
            print(f"  [{i}/{len(no_gps)}] MISSING FILE: {src}")
            predictions.append({
                "src": src,
                "place_hint": (e.get("place") or {}).get("display"),
                "error": "file_not_found",
                "topK": [],
                "top1_geocode": None,
            })
            continue
        try:
            preds = predict_topk(model, photo_path, top_k=TOP_K)
        except Exception as exc:
            print(f"  [{i}/{len(no_gps)}] ERR: {src} -> {exc}")
            predictions.append({
                "src": src,
                "place_hint": (e.get("place") or {}).get("display"),
                "error": str(exc),
                "topK": [],
                "top1_geocode": None,
            })
            continue
        top = preds[0]
        print(
            f"  [{i}/{len(no_gps)}] {src} | hint={(e.get('place') or {}).get('display')} "
            f"| top1=({top['lat']:.4f}, {top['lon']:.4f}, p={top['prob']:.4f})"
        )
        predictions.append({
            "src": src,
            "place_hint": (e.get("place") or {}).get("display"),
            "topK": preds,
            "top1_geocode": None,  # filled in geocoding pass below
        })

    # ---- Geocoding pass: deduplicate keys, then batch with rate limit ------
    print("\n[run-geoclip] === Reverse-geocoding pass ===")
    coord_keys: list[tuple[str, float, float]] = []
    seen_keys: set[str] = set()
    for p in predictions:
        if not p["topK"]:
            continue
        top = p["topK"][0]
        key = geocode_cache_key(top["lat"], top["lon"])
        if key in seen_keys:
            continue
        seen_keys.add(key)
        coord_keys.append((key, top["lat"], top["lon"]))
    cached_hits = sum(1 for k, _, _ in coord_keys if k in geocode_cache)
    to_fetch = [(k, la, lo) for k, la, lo in coord_keys if k not in geocode_cache]
    print(
        f"[run-geoclip] Unique top-1 coord-keys: {len(coord_keys)} "
        f"(cache hits: {cached_hits}, need fetch: {len(to_fetch)})"
    )
    for n, (key, la, lo) in enumerate(to_fetch, start=1):
        place = reverse_geocode_live(la, lo)
        if place is not None:
            geocode_cache[key] = place
            print(f"  [{n}/{len(to_fetch)}] {key} -> {place['display']}")
        else:
            print(f"  [{n}/{len(to_fetch)}] {key} -> (failed)")
        # Persist cache incrementally to survive a crash mid-run.
        if n % 5 == 0:
            with GEOCODE_CACHE_PATH.open("w", encoding="utf-8") as f:
                json.dump(geocode_cache, f, indent=2, ensure_ascii=False)
                f.write("\n")

    # Fill predictions with the geocoded place (cache or fresh).
    for p in predictions:
        if not p["topK"]:
            continue
        top = p["topK"][0]
        key = geocode_cache_key(top["lat"], top["lon"])
        place = geocode_cache.get(key)
        if place is None:
            p["top1_geocode"] = None
        else:
            obj = dict(place)
            obj["from_cache"] = True  # all entries now in cache; provenance is irrelevant downstream
            p["top1_geocode"] = obj

    # ---- Persist -----------------------------------------------------------
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model": "geoclip 1.2.0",
        "device": "cpu",
        "top_k": TOP_K,
        "no_gps_count": len(no_gps),
        "predictions": predictions,
        "smoke_test": smoke_summary,
    }
    with PREDICTIONS_PATH.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\n[run-geoclip] Wrote {PREDICTIONS_PATH}")

    # Persist any new geocode cache entries we picked up.
    with GEOCODE_CACHE_PATH.open("w", encoding="utf-8") as f:
        json.dump(geocode_cache, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"[run-geoclip] Updated {GEOCODE_CACHE_PATH}")

    if smoke_results:
        print(
            f"\n[run-geoclip] Smoke summary: mean={smoke_summary['mean_km']:.2f} km, "
            f"median={smoke_summary['median_km']:.2f} km, "
            f"min={smoke_summary['min_km']:.2f}, max={smoke_summary['max_km']:.2f}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(run())
