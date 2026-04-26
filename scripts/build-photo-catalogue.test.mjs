import { describe, expect, it } from "vitest";
import {
  dmsToDecimal,
  roundCoord,
  geocodeCacheKey,
  parseNominatimResponse,
  exifDateToIso,
  buildCatalogueEntry,
  parseArgs,
} from "./build-photo-catalogue.mjs";

describe("dmsToDecimal", () => {
  it("converts northern hemisphere DMS to a positive decimal", () => {
    // 56°09'25.8" N (Aarhus)
    const dec = dmsToDecimal({
      degNum: 56,
      degDen: 1,
      minNum: 9,
      minDen: 1,
      secNum: 258,
      secDen: 10,
      ref: "N",
    });
    expect(dec).toBeCloseTo(56.157167, 5);
  });

  it("flips sign for S and W references", () => {
    const south = dmsToDecimal({
      degNum: 33,
      degDen: 1,
      minNum: 51,
      minDen: 1,
      secNum: 0,
      secDen: 1,
      ref: "S",
    });
    expect(south).toBeCloseTo(-33.85, 5);

    const west = dmsToDecimal({
      degNum: 73,
      degDen: 1,
      minNum: 56,
      minDen: 1,
      secNum: 0,
      secDen: 1,
      ref: "W",
    });
    expect(west).toBeCloseTo(-73.9333, 4);
  });

  it("safely handles zero denominators (corrupt EXIF)", () => {
    const dec = dmsToDecimal({
      degNum: 10,
      degDen: 0,
      minNum: 0,
      minDen: 1,
      secNum: 0,
      secDen: 1,
      ref: "N",
    });
    expect(dec).toBe(0);
  });
});

describe("roundCoord", () => {
  it("rounds to 5 decimal places", () => {
    expect(roundCoord(56.123456789)).toBe(56.12346);
    expect(roundCoord(-4.999999)).toBe(-5);
  });
});

describe("geocodeCacheKey", () => {
  it("uses 2 decimal places so nearby points share a cache entry", () => {
    expect(geocodeCacheKey(56.157, 10.2107)).toBe("56.16,10.21");
    // A photo 200m away — same key.
    expect(geocodeCacheKey(56.158, 10.2118)).toBe("56.16,10.21");
  });
});

describe("parseNominatimResponse", () => {
  it("prefers city + country", () => {
    const place = parseNominatimResponse({
      address: { city: "Aarhus", country: "Denmark" },
      display_name: "Aarhus, Aarhus Municipality, Central Jutland, Denmark",
    });
    expect(place).toEqual({ city: "Aarhus", country: "Denmark", display: "Aarhus, Denmark" });
  });

  it("falls back through town/village/hamlet", () => {
    const place = parseNominatimResponse({
      address: { village: "Mesopotam", country: "Albania" },
    });
    expect(place.city).toBe("Mesopotam");
    expect(place.display).toBe("Mesopotam, Albania");
  });

  it("uses display_name when address is missing", () => {
    const place = parseNominatimResponse({
      display_name: "Some Hill, Some Region, Some Country",
    });
    expect(place.display).toBe("Some Hill, Some Country");
  });

  it("returns Unknown location for an empty body", () => {
    expect(parseNominatimResponse(null).display).toBe("Unknown location");
    expect(parseNominatimResponse({}).display).toBe("Unknown location");
  });
});

describe("exifDateToIso", () => {
  it("converts EXIF colon-separated date to ISO 8601 Z", () => {
    expect(exifDateToIso("2024:05:25 16:46:27")).toBe("2024-05-25T16:46:27Z");
  });

  it("returns null on malformed input", () => {
    expect(exifDateToIso(null)).toBeNull();
    expect(exifDateToIso("")).toBeNull();
    expect(exifDateToIso("not a date")).toBeNull();
  });
});

describe("buildCatalogueEntry", () => {
  it("includes gps + place when EXIF carries GPS", () => {
    const entry = buildCatalogueEntry(
      {
        file: "IMG_x.jpg",
        hasGps: true,
        lat: 56.157167,
        lon: 10.2107,
        dateTimeOriginal: "2024:05:25 16:46:27",
        cameraModel: "OnePlus 11 5G",
      },
      { city: "Aarhus", country: "Denmark", display: "Aarhus, Denmark" },
    );
    expect(entry.src).toBe("IMG_x.jpg");
    expect(entry.takenAt).toBe("2024-05-25T16:46:27Z");
    expect(entry.hasGps).toBe(true);
    expect(entry.gps.lat).toBeCloseTo(56.15717, 5);
    expect(entry.gps.lon).toBeCloseTo(10.2107, 5);
    expect(entry.place.display).toBe("Aarhus, Denmark");
    expect(entry.cameraModel).toBe("OnePlus 11 5G");
  });

  it("omits gps and place when EXIF lacks GPS", () => {
    const entry = buildCatalogueEntry(
      {
        file: "IMG_no_gps.jpg",
        hasGps: false,
        lat: null,
        lon: null,
        dateTimeOriginal: "2023:11:26 16:19:47",
        cameraModel: "OnePlus 11 5G",
      },
      null,
    );
    expect(entry.hasGps).toBe(false);
    expect(entry.gps).toBeUndefined();
    expect(entry.place).toBeUndefined();
    expect(entry.takenAt).toBe("2023-11-26T16:19:47Z");
  });
});

describe("parseArgs", () => {
  it("defaults to dry-run with archive folder and geocoding enabled", () => {
    const o = parseArgs([]);
    expect(o.write).toBe(false);
    expect(o.geocode).toBe(true);
    expect(o.folder).toMatch(/Portfolio$/);
  });

  it("parses --write / --no-geocode / --folder / --limit", () => {
    const o = parseArgs(["--write", "--no-geocode", "--folder", "/tmp/x", "--limit", "5"]);
    expect(o.write).toBe(true);
    expect(o.geocode).toBe(false);
    expect(o.folder).toBe("/tmp/x");
    expect(o.limit).toBe(5);
  });
});
