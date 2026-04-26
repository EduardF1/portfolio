import { describe, it, expect } from "vitest";
import { getTravelDestinations } from "./travel-locations";

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
