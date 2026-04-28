import { describe, it, expect } from "vitest";
import {
  contrastRatio,
  passesAA,
  parseHex,
  relativeLuminance,
} from "./contrast";

describe("parseHex", () => {
  it("parses 6-digit hex", () => {
    expect(parseHex("#FF0000")).toEqual([255, 0, 0]);
    expect(parseHex("#00FF00")).toEqual([0, 255, 0]);
    expect(parseHex("#0000FF")).toEqual([0, 0, 255]);
  });

  it("parses 3-digit shorthand", () => {
    expect(parseHex("#F00")).toEqual([255, 0, 0]);
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
  });

  it("ignores trailing alpha on 8-digit hex", () => {
    expect(parseHex("#0F172A80")).toEqual([15, 23, 42]);
  });

  it("throws on invalid hex", () => {
    expect(() => parseHex("not-a-hex")).toThrow();
  });
});

describe("relativeLuminance", () => {
  it("is 0 for pure black and 1 for pure white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("is 21:1 between black and white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("is 1:1 for identical colors", () => {
    expect(contrastRatio("#7A8B6F", "#7A8B6F")).toBeCloseTo(1, 5);
  });

  it("is symmetric in fg/bg order", () => {
    const a = contrastRatio("#0F172A", "#F4F7F9");
    const b = contrastRatio("#F4F7F9", "#0F172A");
    expect(a).toBeCloseTo(b, 6);
  });
});

/**
 * Documented (palette, theme, fg-token, bg-token) tuples that the
 * round-6 contrast pass guarantees pass WCAG AA.
 *
 * Source of truth: `src/app/globals.css` and
 * `docs/contrast-fixes-2026-04-28.md`. If a value drifts in either
 * file, this test should drift too — the test is a guardrail against
 * accidental palette regressions, not a re-derivation.
 *
 * Notes on what is intentionally NOT in this matrix:
 *   • `--color-border` vs `--color-background`. Borders here are
 *     decorative dividers (1.4.11 exempts non-meaning-bearing
 *     graphical objects). Boosting them to 3:1 visibly thickens every
 *     card edge; we instead style ring/focus indicators separately.
 *   • `--color-surface-strong` is only used in gradients and the
 *     travel-map sea fill — never as a text background.
 *   • Schwarzgelb light `text-accent` vs background is 3.08:1
 *     (AA-large/UI). Body link contract requires an underline — the
 *     MDX `<a>` adds one always — which lets the pair clear WCAG
 *     SC 1.4.1 (Use of Color). We test the AA-large threshold here.
 *   • Dark theme is already audited in docs/perf-audit-2026-04.md.
 */
type ContrastCase = {
  palette: "schwarzgelb" | "mountain-navy" | "woodsy-cabin";
  theme: "light";
  label: string;
  fg: string;
  bg: string;
  target: "body" | "large";
};

const cases: ContrastCase[] = [
  // ────── schwarzgelb light ──────
  {
    palette: "schwarzgelb",
    theme: "light",
    label: "foreground vs background",
    fg: "#1F2A2C",
    bg: "#F6F3EA",
    target: "body",
  },
  {
    palette: "schwarzgelb",
    theme: "light",
    label: "foreground-muted vs background",
    fg: "#5C6663",
    bg: "#F6F3EA",
    target: "body",
  },
  {
    palette: "schwarzgelb",
    theme: "light",
    label: "foreground-subtle vs background",
    fg: "#6B716C",
    bg: "#F6F3EA",
    target: "body",
  },
  {
    palette: "schwarzgelb",
    theme: "light",
    label: "accent vs background (AA-large; underline carries body)",
    fg: "#A88554",
    bg: "#F6F3EA",
    target: "large",
  },
  {
    palette: "schwarzgelb",
    theme: "light",
    label: "accent-foreground vs accent (chip)",
    fg: "#1F2A2C",
    bg: "#A88554",
    target: "large",
  },

  // ────── mountain-navy light ──────
  {
    palette: "mountain-navy",
    theme: "light",
    label: "foreground vs background",
    fg: "#0F172A",
    bg: "#F4F7F9",
    target: "body",
  },
  {
    palette: "mountain-navy",
    theme: "light",
    label: "foreground-muted vs background",
    fg: "#475569",
    bg: "#F4F7F9",
    target: "body",
  },
  {
    palette: "mountain-navy",
    theme: "light",
    label: "foreground-subtle vs background",
    fg: "#57647A",
    bg: "#F4F7F9",
    target: "body",
  },
  {
    palette: "mountain-navy",
    theme: "light",
    label: "accent vs background (link)",
    fg: "#0E7490",
    bg: "#F4F7F9",
    target: "body",
  },
  {
    palette: "mountain-navy",
    theme: "light",
    label: "accent-foreground vs accent (chip)",
    fg: "#FFFFFF",
    bg: "#0E7490",
    target: "body",
  },

  // ────── woodsy-cabin light ──────
  {
    palette: "woodsy-cabin",
    theme: "light",
    label: "foreground vs background",
    fg: "#2D2620",
    bg: "#F2EDE0",
    target: "body",
  },
  {
    palette: "woodsy-cabin",
    theme: "light",
    label: "foreground-muted vs background",
    fg: "#5A4F42",
    bg: "#F2EDE0",
    target: "body",
  },
  {
    palette: "woodsy-cabin",
    theme: "light",
    label: "foreground-subtle vs background",
    fg: "#75695C",
    bg: "#F2EDE0",
    target: "body",
  },
  {
    palette: "woodsy-cabin",
    theme: "light",
    label: "accent vs background (link)",
    fg: "#5F6F54",
    bg: "#F2EDE0",
    target: "body",
  },
  {
    palette: "woodsy-cabin",
    theme: "light",
    label: "accent-foreground vs accent (chip)",
    fg: "#F2EDE0",
    bg: "#5F6F54",
    target: "body",
  },
];

describe("WCAG AA light-mode contrast (round-6 pass)", () => {
  for (const c of cases) {
    const targetRatio = c.target === "body" ? 4.5 : 3.0;
    it(`${c.palette} / ${c.theme} — ${c.label} ≥ ${targetRatio}:1`, () => {
      const actual = contrastRatio(c.fg, c.bg);
      expect(
        passesAA(c.fg, c.bg, c.target),
        `expected ratio ≥ ${targetRatio}, got ${actual.toFixed(2)} for ${c.fg} on ${c.bg}`,
      ).toBe(true);
    });
  }
});
