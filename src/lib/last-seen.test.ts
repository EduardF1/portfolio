import { describe, it, expect } from "vitest";
import {
  deriveLastSeen,
  formatLastSeenMonth,
  formatLastSeenPlace,
  getLastSeen,
} from "./last-seen";

// Synthetic catalogue entry helper to keep tests dense + readable.
function entry(opts: {
  src?: string;
  takenAt?: string;
  hasGps?: boolean;
  city?: string;
  country?: string;
  lat?: number;
  lon?: number;
}) {
  const {
    src = "x.jpg",
    takenAt,
    hasGps = true,
    city,
    country,
    lat = 0,
    lon = 0,
  } = opts;
  const place =
    city || country ? { city, country, display: "" } : undefined;
  return {
    src,
    takenAt,
    hasGps,
    gps: hasGps ? { lat, lon } : undefined,
    place,
  };
}

describe("deriveLastSeen", () => {
  it("returns the most-recent GPS-tagged photo with a city + country", () => {
    const result = deriveLastSeen([
      entry({
        takenAt: "2024-04-12T10:00:00Z",
        city: "Rome",
        country: "Italy",
      }),
      entry({
        takenAt: "2026-03-27T21:48:07Z",
        city: "Landsberg am Lech",
        country: "Germany",
      }),
      entry({
        takenAt: "2025-09-10T12:00:00Z",
        city: "Madrid",
        country: "Spain",
      }),
    ]);
    expect(result).toEqual({
      city: "Landsberg am Lech",
      country: "Germany",
      takenAt: "2026-03-27T21:48:07Z",
    });
  });

  it("ignores entries without GPS, takenAt, or country", () => {
    const result = deriveLastSeen([
      entry({
        takenAt: "2026-04-01T10:00:00Z",
        hasGps: false,
        city: "Anywhere",
        country: "Nowhere",
      }),
      entry({
        // missing takenAt
        hasGps: true,
        city: "Trieste",
        country: "Italy",
      }),
      entry({
        takenAt: "2024-01-01T10:00:00Z",
        hasGps: true,
        // missing country
      }),
      entry({
        takenAt: "2023-08-15T10:00:00Z",
        city: "Bucharest",
        country: "Romania",
      }),
    ]);
    expect(result).toEqual({
      city: "Bucharest",
      country: "Romania",
      takenAt: "2023-08-15T10:00:00Z",
    });
  });

  it("falls back to country-only when the newest entry has no city", () => {
    const result = deriveLastSeen([
      entry({
        takenAt: "2024-01-01T10:00:00Z",
        city: "Aarhus",
        country: "Denmark",
      }),
      entry({
        takenAt: "2026-02-14T10:00:00Z",
        country: "France",
      }),
    ]);
    expect(result).toEqual({
      city: undefined,
      country: "France",
      takenAt: "2026-02-14T10:00:00Z",
    });
  });

  it("returns null when no entry has GPS + country + takenAt", () => {
    expect(deriveLastSeen([])).toBeNull();
    expect(
      deriveLastSeen([
        entry({ takenAt: "2024-01-01T10:00:00Z", hasGps: false }),
        entry({ hasGps: true, city: "Rome", country: "Italy" }),
      ]),
    ).toBeNull();
  });
});

describe("formatLastSeenPlace", () => {
  it("renders 'City, Country' when both are present", () => {
    expect(
      formatLastSeenPlace({
        city: "Trieste",
        country: "Italy",
        takenAt: "2026-03-26T10:00:00Z",
      }),
    ).toBe("Trieste, Italy");
  });

  it("renders just the country when city is missing", () => {
    expect(
      formatLastSeenPlace({
        country: "Italy",
        takenAt: "2026-03-26T10:00:00Z",
      }),
    ).toBe("Italy");
  });
});

describe("formatLastSeenMonth", () => {
  it("formats long month + year in English", () => {
    expect(
      formatLastSeenMonth(
        {
          city: "Trieste",
          country: "Italy",
          takenAt: "2026-03-26T10:00:00Z",
        },
        "en",
      ),
    ).toBe("March 2026");
  });

  it("formats long month + year in Danish (lowercase month)", () => {
    expect(
      formatLastSeenMonth(
        {
          city: "Trieste",
          country: "Italy",
          takenAt: "2026-03-26T10:00:00Z",
        },
        "da",
      ),
    ).toBe("marts 2026");
  });
});

describe("getLastSeen (real catalogue)", () => {
  it("returns a well-shaped LastSeen for the on-disk catalogue", async () => {
    const result = await getLastSeen();
    // The repo's catalogue has GPS-tagged entries, so this should not
    // be null. If a future PO wipes the catalogue, this expectation
    // will need to be relaxed.
    expect(result).not.toBeNull();
    if (!result) return;
    expect(typeof result.country).toBe("string");
    expect(result.country.length).toBeGreaterThan(0);
    expect(typeof result.takenAt).toBe("string");
    expect(Number.isFinite(new Date(result.takenAt).getTime())).toBe(true);
  });
});
