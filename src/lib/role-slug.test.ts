import { describe, it, expect } from "vitest";
import { roleSlug } from "./role-slug";

describe("roleSlug", () => {
  it("lowercases and kebab-cases plain words", () => {
    expect(roleSlug("Netcompany")).toBe("netcompany");
    expect(roleSlug("Boozt Fashion")).toBe("boozt-fashion");
  });

  it("strips Danish diacritics and ø", () => {
    expect(roleSlug("Mjølner Informatics")).toBe("mjolner-informatics");
  });

  it("handles æ and å", () => {
    expect(roleSlug("Sælde Æsk Åre")).toBe("saelde-aesk-are");
  });

  it("collapses multi-word + punctuation safely", () => {
    expect(roleSlug("Power Factors / Greenbyte")).toBe(
      "power-factors-greenbyte",
    );
  });

  it("trims leading/trailing dashes", () => {
    expect(roleSlug("  Acme Corp  ")).toBe("acme-corp");
  });

  it("is stable for same input", () => {
    const a = roleSlug("Mjølner Informatics");
    const b = roleSlug("Mjølner Informatics");
    expect(a).toBe(b);
  });
});
