import { describe, it, expect } from "vitest";
import {
  deriveCitiesByCountry,
  deriveCityDestinations,
  getCitiesByCountry,
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

describe("deriveCitiesByCountry", () => {
  it("groups catalogue entries by (country, city) and orders cities by photo count desc", () => {
    const out = deriveCitiesByCountry([
      // Romania: Bucharest 3, Brașov 2, Sibiu 1
      {
        src: "trips/2022-08-romania/buc1.jpg",
        takenAt: "2022-08-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 44.43, lon: 26.1 },
        place: { city: "Bucharest", country: "Romania" },
      },
      {
        src: "trips/2022-08-romania/buc2.jpg",
        takenAt: "2022-08-12T11:00:00Z",
        hasGps: true,
        gps: { lat: 44.43, lon: 26.1 },
        place: { city: "Bucharest", country: "Romania" },
      },
      {
        src: "trips/2022-08-romania/buc3.jpg",
        takenAt: "2022-08-12T12:00:00Z",
        hasGps: true,
        gps: { lat: 44.43, lon: 26.1 },
        place: { city: "Bucharest", country: "Romania" },
      },
      {
        src: "trips/2022-08-romania/bra1.jpg",
        takenAt: "2022-08-13T10:00:00Z",
        hasGps: true,
        gps: { lat: 45.66, lon: 25.6 },
        place: { city: "Brașov", country: "Romania" },
      },
      {
        src: "trips/2022-08-romania/bra2.jpg",
        takenAt: "2022-08-13T11:00:00Z",
        hasGps: true,
        gps: { lat: 45.66, lon: 25.6 },
        place: { city: "Brașov", country: "Romania" },
      },
      {
        src: "trips/2022-08-romania/sibiu.jpg",
        takenAt: "2022-08-14T10:00:00Z",
        hasGps: true,
        gps: { lat: 45.79, lon: 24.15 },
        place: { city: "Sibiu", country: "Romania" },
      },
    ]);

    expect(out).toHaveLength(1);
    const romania = out[0];
    expect(romania.country).toBe("Romania");
    expect(romania.cities.map((c) => c.name)).toEqual([
      "Bucharest",
      "Brașov",
      "Sibiu",
    ]);
    expect(romania.cities[0].photoCount).toBe(3);
    expect(romania.cities[1].photoCount).toBe(2);
    expect(romania.cities[2].photoCount).toBe(1);
  });

  it("breaks ties alphabetically when cities have equal photo counts", () => {
    const out = deriveCitiesByCountry([
      {
        src: "a.jpg",
        takenAt: "2024-04-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 0, lon: 0 },
        place: { city: "Zagreb", country: "Croatia" },
      },
      {
        src: "b.jpg",
        takenAt: "2024-04-13T10:00:00Z",
        hasGps: true,
        gps: { lat: 0, lon: 0 },
        place: { city: "Split", country: "Croatia" },
      },
      {
        src: "c.jpg",
        takenAt: "2024-04-14T10:00:00Z",
        hasGps: true,
        gps: { lat: 0, lon: 0 },
        place: { city: "Pula", country: "Croatia" },
      },
    ]);
    expect(out[0].cities.map((c) => c.name)).toEqual([
      "Pula",
      "Split",
      "Zagreb",
    ]);
  });

  it("attaches the most-recent trip slug as the country's primary trip slug", () => {
    const out = deriveCitiesByCountry([
      {
        src: "old.jpg",
        takenAt: "2022-08-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 44.43, lon: 26.1 },
        place: { city: "Bucharest", country: "Romania" },
      },
      {
        src: "new.jpg",
        takenAt: "2024-08-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 44.43, lon: 26.1 },
        place: { city: "Bucharest", country: "Romania" },
      },
    ]);
    expect(out[0].primaryTripSlug).toBe("romania-2024-08");
  });

  it("attaches a primary trip slug per city derived from the catalogue clustering", () => {
    const out = deriveCitiesByCountry([
      {
        src: "trips/2024-04-italy/rome-1.jpg",
        takenAt: "2024-04-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 41.9, lon: 12.5 },
        place: { city: "Rome", country: "Italy" },
      },
      {
        src: "trips/2024-04-italy/rome-2.jpg",
        takenAt: "2024-04-12T11:00:00Z",
        hasGps: true,
        gps: { lat: 41.9, lon: 12.5 },
        place: { city: "Rome", country: "Italy" },
      },
    ]);
    const italy = out[0];
    expect(italy.cities[0].primaryTripSlug).toBe("italy-2024-04");
  });

  it("counts entries without GPS but with country toward the country photoCount", () => {
    const out = deriveCitiesByCountry([
      {
        src: "no-gps.jpg",
        hasGps: false,
        place: { city: "Bucharest", country: "Romania" },
      },
      {
        src: "with-gps.jpg",
        takenAt: "2022-08-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 44.43, lon: 26.1 },
        place: { city: "Bucharest", country: "Romania" },
      },
    ]);
    expect(out[0].photoCount).toBe(2);
    expect(out[0].cities[0].photoCount).toBe(2);
  });

  it("sorts countries alphabetically", () => {
    const out = deriveCitiesByCountry([
      {
        src: "i.jpg",
        takenAt: "2024-04-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 0, lon: 0 },
        place: { city: "Rome", country: "Italy" },
      },
      {
        src: "a.jpg",
        takenAt: "2024-04-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 0, lon: 0 },
        place: { city: "Vienna", country: "Austria" },
      },
    ]);
    expect(out.map((c) => c.country)).toEqual(["Austria", "Italy"]);
  });

  it("returns sensible data against the live catalogue", async () => {
    const out = await getCitiesByCountry();
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
    for (const cc of out) {
      expect(cc.slug).toMatch(/^[a-z0-9-]+$/);
      expect(cc.photoCount).toBeGreaterThan(0);
      expect(Array.isArray(cc.cities)).toBe(true);
      // Cities sorted by photoCount desc, then alphabetical.
      for (let i = 1; i < cc.cities.length; i++) {
        const prev = cc.cities[i - 1];
        const curr = cc.cities[i];
        if (prev.photoCount === curr.photoCount) {
          expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0);
        } else {
          expect(prev.photoCount).toBeGreaterThan(curr.photoCount);
        }
      }
    }
  });
});
