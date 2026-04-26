import { describe, it, expect, beforeEach } from "vitest";
import {
  clusterTrips,
  getTrips,
  getTrip,
  __resetTripsCache,
} from "./trips";

beforeEach(() => {
  __resetTripsCache();
});

// Synthetic catalogue entry helper to keep the tests dense + readable.
function entry(
  src: string,
  takenAt: string,
  country: string,
  city?: string,
  lat = 0,
  lon = 0,
) {
  return {
    src,
    takenAt,
    hasGps: true,
    gps: { lat, lon },
    place: { city, country },
  };
}

describe("clusterTrips", () => {
  it("buckets photos in the same (country, year-month) into one trip", () => {
    const trips = clusterTrips([
      entry("a.jpg", "2024-04-12T10:00:00Z", "Italy", "Rome"),
      entry("b.jpg", "2024-04-15T14:00:00Z", "Italy", "Rome"),
      entry("c.jpg", "2024-04-18T08:00:00Z", "Italy", "Florence"),
    ]);
    expect(trips).toHaveLength(1);
    expect(trips[0].slug).toBe("italy-2024-04");
    expect(trips[0].photoCount).toBe(3);
    expect(trips[0].country).toBe("Italy");
    expect(trips[0].isCluster).toBe(true);
    expect(trips[0].photos[0].filename).toBe("a.jpg");
    expect(trips[0].photos[2].filename).toBe("c.jpg");
  });

  it("emits one trip per (country, year-month) and sorts most-recent first", () => {
    const trips = clusterTrips([
      entry("rome.jpg", "2024-04-12T10:00:00Z", "Italy", "Rome"),
      entry("vienna.jpg", "2025-04-04T09:00:00Z", "Austria", "Vienna"),
      entry("oldrome.jpg", "2023-04-01T09:00:00Z", "Italy", "Rome"),
    ]);
    expect(trips.map((t) => t.slug)).toEqual([
      "austria-2025-04",
      "italy-2024-04",
      "italy-2023-04",
    ]);
  });

  it("uses a stable kebab slug derived from the country + start year-month", () => {
    const trips = clusterTrips([
      entry("p.jpg", "2024-09-10T00:00:00Z", "Albania", "Tirana"),
    ]);
    expect(trips[0].slug).toBe("albania-2024-09");

    const trips2 = clusterTrips([
      entry("q.jpg", "2025-04-04T00:00:00Z", "Czechia", "Prague"),
    ]);
    expect(trips2[0].slug).toBe("czechia-2025-04");

    // Diacritics fold cleanly to ASCII.
    const trips3 = clusterTrips([
      entry("r.jpg", "2025-12-04T00:00:00Z", "Malmö kommun", "Malmö"),
    ]);
    expect(trips3[0].slug).toBe("malmo-kommun-2025-12");
  });

  it("merges adjacent-month photos within 14 days into one trip", () => {
    const trips = clusterTrips([
      entry("a.jpg", "2024-03-27T10:00:00Z", "Italy", "Rome"),
      entry("b.jpg", "2024-03-30T10:00:00Z", "Italy", "Rome"),
      entry("c.jpg", "2024-04-04T10:00:00Z", "Italy", "Florence"),
    ]);
    expect(trips).toHaveLength(1);
    // Slug uses the start-month, not the end-month, so the trip is
    // findable by its earliest photo.
    expect(trips[0].slug).toBe("italy-2024-03");
    expect(trips[0].photoCount).toBe(3);
    expect(trips[0].dateRange).toMatch(/March/);
    expect(trips[0].dateRange).toMatch(/April/);
  });

  it("does NOT merge adjacent months when boundary photos are >14 days apart", () => {
    const trips = clusterTrips([
      entry("a.jpg", "2024-03-05T10:00:00Z", "Italy", "Rome"),
      entry("b.jpg", "2024-04-25T10:00:00Z", "Italy", "Florence"),
    ]);
    expect(trips).toHaveLength(2);
    expect(new Set(trips.map((t) => t.slug))).toEqual(
      new Set(["italy-2024-03", "italy-2024-04"]),
    );
  });

  it("keeps single-photo trips and flags isCluster=false", () => {
    const trips = clusterTrips([
      entry("solo.jpg", "2022-07-04T10:00:00Z", "Greece", "Athens"),
    ]);
    expect(trips).toHaveLength(1);
    expect(trips[0].photoCount).toBe(1);
    expect(trips[0].isCluster).toBe(false);
    expect(trips[0].slug).toBe("greece-2022-07");
  });

  it("formats date range as 'D–D Month YYYY' for same-month trips", () => {
    const trips = clusterTrips([
      entry("a.jpg", "2024-04-12T10:00:00Z", "Italy", "Rome"),
      entry("b.jpg", "2024-04-18T10:00:00Z", "Italy", "Rome"),
    ]);
    expect(trips[0].dateRange).toBe("12–18 April 2024");
    expect(trips[0].monthLabel).toBe("April 2024");
  });

  it("formats date range as 'D Month – D Month YYYY' across months", () => {
    const trips = clusterTrips([
      entry("a.jpg", "2024-03-27T10:00:00Z", "Italy", "Rome"),
      entry("b.jpg", "2024-04-04T10:00:00Z", "Italy", "Florence"),
    ]);
    expect(trips[0].dateRange).toBe("27 March – 4 April 2024");
  });

  it("formats date range as a single date when only one photo", () => {
    const trips = clusterTrips([
      entry("a.jpg", "2024-04-12T10:00:00Z", "Italy", "Rome"),
    ]);
    expect(trips[0].dateRange).toBe("12 April 2024");
  });

  it("picks the most-photographed city as primaryCity", () => {
    const trips = clusterTrips([
      entry("a.jpg", "2024-04-12T10:00:00Z", "Italy", "Rome"),
      entry("b.jpg", "2024-04-13T10:00:00Z", "Italy", "Rome"),
      entry("c.jpg", "2024-04-15T10:00:00Z", "Italy", "Florence"),
    ]);
    expect(trips[0].primaryCity).toBe("Rome");
  });

  it("ignores entries without GPS, country, or takenAt", () => {
    const trips = clusterTrips([
      entry("good.jpg", "2024-04-12T10:00:00Z", "Italy", "Rome"),
      // missing takenAt
      {
        src: "no-date.jpg",
        hasGps: true,
        gps: { lat: 0, lon: 0 },
        place: { country: "Italy" },
      },
      // hasGps false
      {
        src: "no-gps.jpg",
        takenAt: "2024-04-12T10:00:00Z",
        hasGps: false,
      },
      // no place
      {
        src: "no-place.jpg",
        takenAt: "2024-04-12T10:00:00Z",
        hasGps: true,
        gps: { lat: 0, lon: 0 },
      },
    ]);
    expect(trips).toHaveLength(1);
    expect(trips[0].photoCount).toBe(1);
  });
});

describe("getTrips / getTrip (real catalogue)", () => {
  it("loads trips from the on-disk catalogue and they have well-formed shape", async () => {
    const trips = await getTrips();
    expect(Array.isArray(trips)).toBe(true);
    expect(trips.length).toBeGreaterThan(0);

    for (const t of trips) {
      expect(t.slug).toMatch(/^[a-z0-9-]+-\d{4}-\d{2}$/);
      expect(t.country.length).toBeGreaterThan(0);
      expect(t.photoCount).toBeGreaterThan(0);
      expect(t.photos.length).toBe(t.photoCount);
      expect(t.startsAt <= t.endsAt).toBe(true);
      expect(t.isCluster).toBe(t.photoCount > 1);
    }
  });

  it("getTrip returns the matching trip and null for unknown slugs", async () => {
    const trips = await getTrips();
    const first = trips[0];
    const found = await getTrip(first.slug);
    expect(found?.slug).toBe(first.slug);
    expect(await getTrip("definitely-not-a-real-trip-9999")).toBeNull();
  });

  it("slug is stable across repeated calls", async () => {
    const a = await getTrips();
    __resetTripsCache();
    const b = await getTrips();
    expect(a.map((t) => t.slug)).toEqual(b.map((t) => t.slug));
  });
});
