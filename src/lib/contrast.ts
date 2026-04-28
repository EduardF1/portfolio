/**
 * Tiny WCAG 2.1 contrast-ratio helper.
 *
 * Inlined (no `wcag-contrast` runtime dep) because we only use this from
 * tests + a one-shot audit script. The math is the canonical
 * Web Content Accessibility Guidelines 2.1 SC 1.4.3 / 1.4.11 formula:
 *
 *   1. sRGB channel → linear (gamma 2.4 with low-end linear segment).
 *   2. Relative luminance Y = 0.2126 R + 0.7152 G + 0.0722 B.
 *   3. Contrast ratio = (Y_lighter + 0.05) / (Y_darker + 0.05).
 *
 * AA thresholds:
 *   • body text (< 18 pt or < 14 pt bold):     ≥ 4.5
 *   • large text + UI / graphical components:  ≥ 3.0
 *
 * Reference: https://www.w3.org/TR/WCAG21/#contrast-minimum
 */

/** Parse a `#RGB`, `#RRGGBB`, or 8-digit `#RRGGBBAA` hex into [r, g, b] (0–255). */
export function parseHex(hex: string): [number, number, number] {
  const cleaned = hex.replace(/^#/, "");
  if (cleaned.length === 3) {
    const [r, g, b] = cleaned.split("");
    return [
      parseInt(r + r, 16),
      parseInt(g + g, 16),
      parseInt(b + b, 16),
    ];
  }
  if (cleaned.length === 6 || cleaned.length === 8) {
    return [
      parseInt(cleaned.slice(0, 2), 16),
      parseInt(cleaned.slice(2, 4), 16),
      parseInt(cleaned.slice(4, 6), 16),
    ];
  }
  throw new Error(`Invalid hex color: ${hex}`);
}

/** sRGB 0–255 channel → linear-light 0..1. */
function srgbChannelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Relative luminance per WCAG 2.1 (Y in 0..1). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  );
}

/** WCAG contrast ratio between two hex colors (1.0 ≤ result ≤ 21.0). */
export function contrastRatio(fg: string, bg: string): number {
  const Lfg = relativeLuminance(fg);
  const Lbg = relativeLuminance(bg);
  const [hi, lo] = Lfg > Lbg ? [Lfg, Lbg] : [Lbg, Lfg];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA target. Pass `"body"` for ≥4.5, `"large"` (or UI) for ≥3.0. */
export type ContrastTarget = "body" | "large";

export const AA_THRESHOLDS: Record<ContrastTarget, number> = {
  body: 4.5,
  large: 3.0,
};

/** Whether the (fg, bg) pair clears the requested AA threshold. */
export function passesAA(
  fg: string,
  bg: string,
  target: ContrastTarget = "body",
): boolean {
  return contrastRatio(fg, bg) >= AA_THRESHOLDS[target];
}
