// Reverse-geocode the missing cells for the balkan backfill via Nominatim,
// at <=1 req/sec. Updates the geocode cache in place.
import { readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const CACHE_PATH = new URL("../.geocode-cache.json", import.meta.url);
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const UA = "EduardFischer.dev portfolio batch-geocoder/1.0";

const MISS = ["44.46,26.11", "45.28,24.31", "46.91,19.69", "47.41,19.25", "50.07,14.38", "50.08,14.42", "50.08,14.43"];

function parseNominatim(body) {
  if (!body || typeof body !== "object") return { city: null, country: null, display: "Unknown location" };
  const addr = body.address || {};
  const city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || addr.suburb || addr.county || addr.state || null;
  const country = addr.country || null;
  let display;
  if (city && country) display = `${city}, ${country}`;
  else if (country) display = country;
  else if (typeof body.display_name === "string" && body.display_name.length > 0) {
    const parts = body.display_name.split(",").map((s) => s.trim());
    display = parts.length >= 2 ? `${parts[0]}, ${parts[parts.length - 1]}` : parts[0];
  } else display = "Unknown location";
  return { city, country, display };
}

const cache = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
let added = 0;
for (const cell of MISS) {
  if (cache[cell]) {
    console.log("CACHE HIT:", cell, cache[cell].display);
    continue;
  }
  const [lat, lon] = cell.split(",");
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");
  const resp = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json", "Accept-Language": "en" } });
  if (!resp.ok) {
    console.error("FAIL:", cell, resp.status);
    await sleep(1100);
    continue;
  }
  const body = await resp.json();
  const place = parseNominatim(body);
  cache[cell] = place;
  added++;
  console.log("RESOLVED:", cell, "->", place.display);
  await sleep(1100);
}

writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n", "utf8");
console.log(`Added ${added} cells.`);
