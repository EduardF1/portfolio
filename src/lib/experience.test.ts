import { describe, it, expect } from "vitest";
import { ROLES, tokenizeSummary, type Role } from "./experience";

describe("ROLES", () => {
  it("contains all five companies in reverse-chronological order", () => {
    const companies = ROLES.map((r) => r.company);
    expect(companies).toEqual([
      "Mjølner Informatics",
      "Netcompany",
      "Greenbyte",
      "Boozt Fashion",
      "Systematic",
    ]);
  });

  it("every link label actually appears in the role summary", () => {
    // Defensive: if a label is misspelled, tokenizeSummary will silently
    // omit it on the page. This test catches that drift at CI time.
    for (const role of ROLES) {
      for (const link of role.links ?? []) {
        expect(role.summary).toContain(link.label);
      }
    }
  });
});

describe("tokenizeSummary", () => {
  it("returns a single text token when the role has no links", () => {
    const role: Role = {
      company: "X",
      url: "",
      role: "",
      period: "",
      location: "",
      summary: "hello world",
      tech: [],
    };
    expect(tokenizeSummary(role)).toEqual([
      { kind: "text", value: "hello world" },
    ]);
  });

  it("wraps each link label in order, leaving surrounding text intact", () => {
    const role: Role = {
      company: "X",
      url: "",
      role: "",
      period: "",
      location: "",
      summary: "Visit FOO and BAR today.",
      links: [
        { label: "FOO", href: "https://foo.example" },
        { label: "BAR", href: "https://bar.example" },
      ],
      tech: [],
    };
    expect(tokenizeSummary(role)).toEqual([
      { kind: "text", value: "Visit " },
      { kind: "link", value: "FOO", href: "https://foo.example" },
      { kind: "text", value: " and " },
      { kind: "link", value: "BAR", href: "https://bar.example" },
      { kind: "text", value: " today." },
    ]);
  });

  it("prefers the longest label when two labels overlap at the same position", () => {
    const role: Role = {
      company: "X",
      url: "",
      role: "",
      period: "",
      location: "",
      summary: "open KOMBIT VALG now",
      links: [
        { label: "VALG", href: "https://v.example" },
        { label: "KOMBIT VALG", href: "https://kv.example" },
      ],
      tech: [],
    };
    const tokens = tokenizeSummary(role);
    expect(tokens).toContainEqual({
      kind: "link",
      value: "KOMBIT VALG",
      href: "https://kv.example",
    });
  });
});
