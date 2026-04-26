"use client";

import { useTranslations } from "next-intl";
import { usePalette, type Palette } from "@/components/palette-provider";

const ORDER: Palette[] = ["schwarzgelb", "mountain-navy", "woodsy-cabin"];

const KEY_BY_PALETTE: Record<Palette, "schwarzgelb" | "mountainNavy" | "woodsyCabin"> = {
  "schwarzgelb": "schwarzgelb",
  "mountain-navy": "mountainNavy",
  "woodsy-cabin": "woodsyCabin",
};

export function PaletteSelector() {
  const { palette, setPalette } = usePalette();
  const t = useTranslations("palette");

  return (
    <select
      data-testid="palette-selector"
      aria-label={t("label")}
      value={palette}
      onChange={(event) => setPalette(event.target.value as Palette)}
      className="bg-transparent text-xs text-foreground-subtle hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm cursor-pointer"
    >
      {ORDER.map((value) => (
        <option key={value} value={value}>
          {t(KEY_BY_PALETTE[value])}
        </option>
      ))}
    </select>
  );
}
