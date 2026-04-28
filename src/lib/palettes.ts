/**
 * Shared palette constants.
 *
 * Lives outside the `palette-provider.tsx` `"use client"` boundary so
 * server modules (route handlers, RSC pages) can import the canonical
 * palette list without dragging in the React provider tree. The
 * provider re-exports the same constants for backwards compatibility.
 */

export type Palette = "schwarzgelb" | "mountain-navy" | "woodsy-cabin";

export const PALETTES = [
  "schwarzgelb",
  "mountain-navy",
  "woodsy-cabin",
] as const satisfies readonly Palette[];

export const DEFAULT_PALETTE: Palette = "mountain-navy";

export type Theme = "light" | "dark";

export const THEMES = ["light", "dark"] as const satisfies readonly Theme[];
