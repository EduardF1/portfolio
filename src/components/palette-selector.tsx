"use client";

import { usePalette, type Palette } from "@/components/palette-provider";

const OPTIONS: { value: Palette; label: string }[] = [
  { value: "schwarzgelb", label: "Schwarzgelb" },
  { value: "mountain-navy", label: "Mountain Navy" },
  { value: "woodsy-cabin", label: "Woodsy Cabin" },
];

export function PaletteSelector() {
  const { palette, setPalette } = usePalette();

  return (
    <select
      data-testid="palette-selector"
      aria-label="Select color palette"
      value={palette}
      onChange={(event) => setPalette(event.target.value as Palette)}
      className="bg-transparent text-xs text-foreground-subtle hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm cursor-pointer"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
