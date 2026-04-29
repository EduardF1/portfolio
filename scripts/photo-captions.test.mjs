import { describe, expect, it } from "vitest";
import {
  slugifyForFilename,
  monthYearLabel,
  titleCaseLandmark,
  stripCityPrefix,
  parsePexelsFilename,
  derivePhotoCaption,
} from "./photo-captions.mjs";

describe("slugifyForFilename", () => {
  it("matches the kebab-case ASCII form Pexels uses", () => {
    expect(slugifyForFilename("Brașov")).toBe("brasov");
    expect(slugifyForFilename("Banská Bystrica")).toBe("banska-bystrica");
    expect(slugifyForFilename("Tel Aviv")).toBe("tel-aviv");
    expect(slugifyForFilename("Sfântu Gheorghe")).toBe("sfantu-gheorghe");
    expect(slugifyForFilename("The Hague")).toBe("the-hague");
  });
});

describe("monthYearLabel", () => {
  it("formats a UTC ISO timestamp as 'Month YYYY'", () => {
    expect(monthYearLabel("2026-03-21T12:00:00Z")).toBe("March 2026");
    expect(monthYearLabel("2018-04-08T19:42:58Z")).toBe("April 2018");
  });
  it("returns null for missing or unparseable input", () => {
    expect(monthYearLabel(null)).toBeNull();
    expect(monthYearLabel("")).toBeNull();
    expect(monthYearLabel("not-a-date")).toBeNull();
  });
});

describe("titleCaseLandmark", () => {
  it("title-cases each kebab token", () => {
    expect(titleCaseLandmark("kungsparken-windmill")).toBe(
      "Kungsparken Windmill",
    );
    expect(titleCaseLandmark("turning-torso-sunset")).toBe(
      "Turning Torso Sunset",
    );
  });
  it("keeps short connector words lowercase mid-string", () => {
    expect(titleCaseLandmark("tower-of-london-fortress")).toBe(
      "Tower of London Fortress",
    );
    expect(titleCaseLandmark("of-the-mountain")).toBe("Of the Mountain");
  });
});

describe("stripCityPrefix", () => {
  it("removes the city slug when it appears as a prefix", () => {
    expect(stripCityPrefix("london-tower-of-london", "london")).toBe(
      "tower-of-london",
    );
    expect(stripCityPrefix("malmo-turning-torso", "malmo")).toBe(
      "turning-torso",
    );
  });
  it("returns empty string when body equals the city slug", () => {
    expect(stripCityPrefix("london", "london")).toBe("");
  });
  it("leaves the body untouched when no prefix match", () => {
    expect(stripCityPrefix("brasov-black-church", "bucharest")).toBe(
      "brasov-black-church",
    );
  });
});

describe("parsePexelsFilename", () => {
  it("extracts the landmark slug after stripping the city prefix", () => {
    const got = parsePexelsFilename(
      "pexels-london-tower-of-london-fortress-30483647.jpg",
      "london",
    );
    expect(got).not.toBeNull();
    expect(got.landmark).toBe("Tower of London Fortress");
    expect(got.id).toBe("30483647");
  });
  it("handles multi-token city slugs", () => {
    const got = parsePexelsFilename(
      "pexels-banska-bystrica-tatra-autumn-backdrop-34422122.jpg",
      "banska-bystrica",
    );
    expect(got.landmark).toBe("Tatra Autumn Backdrop");
  });
  it("returns null for non-Pexels filenames", () => {
    expect(parsePexelsFilename("IMG_20180324_114159.jpg", "")).toBeNull();
  });
  it("returns null when no trailing numeric id is present", () => {
    expect(
      parsePexelsFilename("pexels-london-tower-of-london.jpg", "london"),
    ).toBeNull();
  });
});

describe("derivePhotoCaption", () => {
  it("builds 'Landmark · City, Country · Month Year' for stock with takenAt", () => {
    const cap = derivePhotoCaption({
      src: "trips/2023-07-uk/pexels-london-tower-of-london-fortress-30483647.jpg",
      takenAt: "2023-07-15T12:00:00Z",
      place: { city: "London", country: "United Kingdom", display: "London, United Kingdom" },
      source: { type: "stock", provider: "Pexels" },
    });
    expect(cap).toBe(
      "Tower of London Fortress · London, United Kingdom · July 2023",
    );
  });

  it("omits Month Year when stock has no takenAt", () => {
    const cap = derivePhotoCaption({
      src: "trips/2018-04-sweden/pexels-malmo-turning-torso-7019069.jpg",
      takenAt: null,
      place: { city: "Malmö", country: "Sweden", display: "Malmö, Sweden" },
      source: { type: "stock", provider: "Pexels" },
    });
    expect(cap).toBe("Turning Torso · Malmö, Sweden");
  });

  it("uses 'place.display · Month Year' for personal photos", () => {
    const cap = derivePhotoCaption({
      src: "trips/2026-03-balkans-roadtrip/IMG20260321100000.jpg",
      takenAt: "2026-03-21T10:00:00Z",
      place: { city: "Pula", country: "Croatia", display: "Pula, Croatia" },
    });
    expect(cap).toBe("Pula, Croatia · March 2026");
  });

  it("falls back to 'place.display' alone when filename parse fails", () => {
    const cap = derivePhotoCaption({
      src: "trips/2023-07-uk/pexels-london-foo.jpg",
      takenAt: "2023-07-15T12:00:00Z",
      place: { display: "London, United Kingdom" },
      source: { type: "stock", provider: "Pexels" },
    });
    // Filename has no trailing id ⇒ no landmark, just place + month.
    expect(cap).toBe("London, United Kingdom · July 2023");
  });

  it("does not double-print the city when landmark slug starts with city", () => {
    const cap = derivePhotoCaption({
      src: "trips/2023-07-uk/pexels-london-london-eye-12345.jpg",
      takenAt: "2023-07-15T12:00:00Z",
      place: { city: "London", country: "United Kingdom", display: "London, United Kingdom" },
      source: { type: "stock", provider: "Pexels" },
    });
    // City prefix is stripped once → "London Eye", not "London London Eye".
    expect(cap).toBe("London Eye · London, United Kingdom · July 2023");
  });

  it("returns null when both place and takenAt are missing", () => {
    expect(
      derivePhotoCaption({
        src: "trips/x/y.jpg",
        takenAt: null,
      }),
    ).toBeNull();
  });
});
