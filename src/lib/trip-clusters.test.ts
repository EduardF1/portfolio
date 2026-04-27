import { describe, expect, it } from "vitest";
import {
  TIER_RANGE_LABELS,
  TRIP_GAP_DAYS,
  tierForTripCount,
  tripCountByCountry,
} from "./trip-clusters";

describe("tierForTripCount", () => {
  it("returns 0 for zero, negative, or non-finite counts", () => {
    expect(tierForTripCount(0)).toBe(0);
    expect(tierForTripCount(-3)).toBe(0);
    expect(tierForTripCount(Number.NaN)).toBe(0);
    expect(tierForTripCount(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("returns 1 for exactly one trip", () => {
    expect(tierForTripCount(1)).toBe(1);
  });

  it("returns 2 for the 2-3 mid bucket", () => {
    expect(tierForTripCount(2)).toBe(2);
    expect(tierForTripCount(3)).toBe(2);
  });

  it("returns 3 for the 4-5 mid-dark bucket", () => {
    expect(tierForTripCount(4)).toBe(3);
    expect(tierForTripCount(5)).toBe(3);
  });

  it("returns 4 for 6 or more trips (darkest tier)", () => {
    expect(tierForTripCount(6)).toBe(4);
    expect(tierForTripCount(12)).toBe(4);
    expect(tierForTripCount(99)).toBe(4);
  });

  it("exposes a label tuple aligned with the five tiers", () => {
    expect(TIER_RANGE_LABELS).toHaveLength(5);
    expect(TIER_RANGE_LABELS[0]).toBe("0");
    expect(TIER_RANGE_LABELS[4]).toBe("6+");
  });
});

describe("tripCountByCountry", () => {
  it("returns an empty map when given no usable entries", () => {
    expect(tripCountByCountry([]).size).toBe(0);
    expect(
      tripCountByCountry([
        { takenAt: undefined, place: { country: "Italy" } },
        { takenAt: "2024-01-01T00:00:00Z", place: {} },
      ]).size,
    ).toBe(0);
  });

  it("counts a single photo as one trip", () => {
    const counts = tripCountByCountry([
      { takenAt: "2024-04-12T10:00:00Z", place: { country: "Italy" } },
    ]);
    expect(counts.get("Italy")).toBe(1);
  });

  it("merges photos within the 3-day window into one trip", () => {
    const counts = tripCountByCountry([
      { takenAt: "2024-04-12T10:00:00Z", place: { country: "Italy" } },
      { takenAt: "2024-04-13T10:00:00Z", place: { country: "Italy" } },
      { takenAt: "2024-04-15T10:00:00Z", place: { country: "Italy" } },
    ]);
    expect(counts.get("Italy")).toBe(1);
  });

  it("starts a new trip when the gap strictly exceeds TRIP_GAP_DAYS", () => {
    // 2024-04-12 → 2024-04-16 = 4-day gap (> 3) → 2 trips
    const counts = tripCountByCountry([
      { takenAt: "2024-04-12T10:00:00Z", place: { country: "Italy" } },
      { takenAt: "2024-04-16T10:00:01Z", place: { country: "Italy" } },
    ]);
    expect(counts.get("Italy")).toBe(2);
    // Sanity-check the boundary constant the algorithm uses.
    expect(TRIP_GAP_DAYS).toBe(3);
  });

  it("accepts an exact 3-day gap as the same trip", () => {
    // 2024-04-12 10:00 → 2024-04-15 10:00 = exactly 3 days, still one trip.
    const counts = tripCountByCountry([
      { takenAt: "2024-04-12T10:00:00Z", place: { country: "Italy" } },
      { takenAt: "2024-04-15T10:00:00Z", place: { country: "Italy" } },
    ]);
    expect(counts.get("Italy")).toBe(1);
  });

  it("treats each country independently", () => {
    const counts = tripCountByCountry([
      { takenAt: "2024-04-12T10:00:00Z", place: { country: "Italy" } },
      { takenAt: "2024-04-12T18:00:00Z", place: { country: "France" } },
      { takenAt: "2024-08-01T10:00:00Z", place: { country: "Italy" } },
      { takenAt: "2024-08-04T10:00:00Z", place: { country: "Italy" } },
    ]);
    expect(counts.get("Italy")).toBe(2);
    expect(counts.get("France")).toBe(1);
  });

  it("is order-independent (sorts internally)", () => {
    const a = tripCountByCountry([
      { takenAt: "2024-08-01T10:00:00Z", place: { country: "Italy" } },
      { takenAt: "2024-04-12T10:00:00Z", place: { country: "Italy" } },
      { takenAt: "2024-04-13T10:00:00Z", place: { country: "Italy" } },
    ]);
    expect(a.get("Italy")).toBe(2);
  });

  it("ignores entries with malformed timestamps", () => {
    const counts = tripCountByCountry([
      { takenAt: "not-a-date", place: { country: "Italy" } },
      { takenAt: "2024-04-12T10:00:00Z", place: { country: "Italy" } },
    ]);
    expect(counts.get("Italy")).toBe(1);
  });
});
