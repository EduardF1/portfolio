import { describe, it, expect } from "vitest";
import {
  deriveCityDestinations,
  getCityDestinations,
  getTravelDestinations,
} from "./travel-locations";

describe("getTravelDestinations", () => {
  it("returns countries derived from the EXIF photo catalogue", async () => {
    const dests = await getTravelDestinations();
    expect(Array.isArray(dests)).toBe(true);
    expect(dests.length).toBeGreaterThan(0);

    // Every destination has the expected shape and non-empty fields.
    for (const d of dests) {
      expect(typeof d.country).toBe("string");
      expect(d.country.length).toBeGreaterThan(0);
      expect(typeof d.slug).toBe("string");
      expect(d.slug).toMatch(/^[a-z0-9-]+$/);
      expect(typeof d.centroid.lat).toBe("number");
      expect(typeof d.centroid.lon).toBe("number");
      expect(d.photoCount).toBeGreaterThan(0);
      expect(Array.isArray(d.cities)).toBe(true);
      // cities sorted ascending
      const sorted = [...d.cities].sort((a, b) => a.localeCompare(b));
      expect(d.cities).toEqual(sorted);
    }
  });

  it("sorts destinations alphabetically by country name", async () => {
    const dests = await getTravelDestinations();
    const countries = dests.map((d) => d.country);
    const sorted = [...countries].sort((a, b) => a.localeCompare(b));
    expect(countries).toEqual(sorted);
  });
});

describe("deriveCityDestinations", () => {
  it("groups GPS-tagged catalogue entries by `(country, city)` pair", () => {
    const cities = deriveCityDestinations([
      // Two photos in Pisa → bucketed.
      {
        src: "trips/2024-04-italy/a.jpg",
        takenAt: "2024-04-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 43.72, lon: 10.4 },
        place: { city: "Pisa", country: "Italy" },
      },
      {
        src: "trips/2024-04-italy/b.jpg",
        takenAt: "2024-04-12T11:00:00Z",
        hasGps: true,
        gps: { lat: 43.73, lon: 10.41 },
        place: { city: "Pisa", country: "Italy" },
      },
      // Lone photo in Florence, same country → separate dot.
      {
        src: "trips/2024-04-italy/c.jpg",
        takenAt: "2024-04-13T10:00:00Z",
        hasGps: true,
        gps: { lat: 43.77, lon: 11.25 },
        place: { city: "Florence", country: "Italy" },
      },
      // No GPS → must NOT produce a dot.
      {
        src: "trips/2024-04-italy/no-gps.jpg",
        takenAt: "2024-04-13T11:00:00Z",
        hasGps: false,
        place: { city: "Rome", country: "Italy" },
      },
      // Same city in a different country → still its own dot.
      {
        src: "trips/2025-04-czechia-poland/d.jpg",
        takenAt: "2025-04-14T10:00:00Z",
        hasGps: true,
        gps: { lat: 50.06, lon: 19.94 },
        place: { city: "Krakow", country: "Poland" },
      },
    ]);

    expect(cities).toHaveLength(3);
    const byKey = new Map(cities.map((c) => [`${c.country}|${c.city}`, c]));
    expect(byKey.get("Italy|Pisa")?.photoCount).toBe(2);
    expect(byKey.get("Italy|Florence")?.photoCount).toBe(1);
    expect(byKey.get("Poland|Krakow")?.photoCount).toBe(1);
  });

  it("averages lat/lon to a centroid per city", () => {
    const cities = deriveCityDestinations([
      {
        src: "trips/2024-04-italy/a.jpg",
        takenAt: "2024-04-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 43.7, lon: 10.4 },
        place: { city: "Pisa", country: "Italy" },
      },
      {
        src: "trips/2024-04-italy/b.jpg",
        takenAt: "2024-04-12T11:00:00Z",
        hasGps: true,
        gps: { lat: 43.74, lon: 10.42 },
        place: { city: "Pisa", country: "Italy" },
      },
    ]);
    expect(cities).toHaveLength(1);
    expect(cities[0].lat).toBeCloseTo(43.72, 5);
    expect(cities[0].lon).toBeCloseTo(10.41, 5);
  });

  it("attaches a primary trip slug derived from the catalogue clustering", () => {
    const cities = deriveCityDestinations([
      {
        src: "trips/2024-04-italy/pisa-1.jpg",
        takenAt: "2024-04-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 43.7, lon: 10.4 },
        place: { city: "Pisa", country: "Italy" },
      },
      {
        src: "trips/2024-04-italy/pisa-2.jpg",
        takenAt: "2024-04-12T11:00:00Z",
        hasGps: true,
        gps: { lat: 43.7, lon: 10.4 },
        place: { city: "Pisa", country: "Italy" },
      },
    ]);
    expect(cities).toHaveLength(1);
    expect(cities[0].primaryTripSlug).toBe("italy-2024-04");
  });

  it("emits a stable URL-safe slug per city", () => {
    const cities = deriveCityDestinations([
      {
        src: "trips/2018-04-sweden/a.jpg",
        takenAt: "2018-04-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 55.6, lon: 13.0 },
        place: { city: "Malmö", country: "Sweden" },
      },
    ]);
    expect(cities[0].slug).toBe("sweden-malmo");
    expect(cities[0].slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("deduplicates against the live catalogue and returns sensible counts", async () => {
    const cities = await getCityDestinations();
    expect(Array.isArray(cities)).toBe(true);
    expect(cities.length).toBeGreaterThan(10);
    const seen = new Set<string>();
    for (const c of cities) {
      const key = `${c.country}|${c.city}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      expect(typeof c.lat).toBe("number");
      expect(typeof c.lon).toBe("number");
      expect(c.photoCount).toBeGreaterThan(0);
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
