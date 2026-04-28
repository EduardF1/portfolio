import { describe, it, expect } from "vitest";
import { allTechDemos, demosForLanguage } from "./tech-demos";

describe("demosForLanguage()", () => {
  it("returns the demo list for a language with entries in the JSON cache", () => {
    const all = allTechDemos();
    const someLanguage = Object.keys(all)[0];
    const list = demosForLanguage(someLanguage);
    expect(list.length).toBeGreaterThan(0);
    expect(list).toEqual(all[someLanguage]);
  });

  it("returns an empty array for unknown languages", () => {
    expect(demosForLanguage("MadeUpLang")).toEqual([]);
  });

  it("returns an empty array for null / undefined / empty inputs", () => {
    expect(demosForLanguage(null)).toEqual([]);
    expect(demosForLanguage(undefined)).toEqual([]);
    expect(demosForLanguage("")).toEqual([]);
  });

  it("each entry has name + url + description fields", () => {
    const all = allTechDemos();
    for (const list of Object.values(all)) {
      for (const entry of list) {
        expect(typeof entry.name).toBe("string");
        expect(entry.name.length).toBeGreaterThan(0);
        expect(typeof entry.url).toBe("string");
        expect(entry.url).toMatch(/^https:\/\/github\.com\//);
        expect(typeof entry.description).toBe("string");
      }
    }
  });

  it("caps each language at 3 entries (matches the build script topN)", () => {
    const all = allTechDemos();
    for (const list of Object.values(all)) {
      expect(list.length).toBeLessThanOrEqual(3);
    }
  });
});

describe("allTechDemos()", () => {
  it("is a non-empty plain object keyed by language name", () => {
    const all = allTechDemos();
    expect(typeof all).toBe("object");
    expect(all).not.toBeNull();
    // The JSON cache may legitimately be empty in some environments, but our
    // committed build snapshot should always have at least one language.
    expect(Object.keys(all).length).toBeGreaterThan(0);
  });
});
