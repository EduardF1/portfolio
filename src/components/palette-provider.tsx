"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PALETTE,
  PALETTES,
  type Palette,
} from "@/lib/palettes";

// Re-export so existing imports from `@/components/palette-provider`
// keep working. Server code should prefer `@/lib/palettes` directly.
export { DEFAULT_PALETTE, PALETTES };
export type { Palette };

const STORAGE_KEY = "palette";

function isPalette(value: unknown): value is Palette {
  return (
    typeof value === "string" && (PALETTES as readonly string[]).includes(value)
  );
}

interface PaletteContextValue {
  palette: Palette;
  setPalette: (palette: Palette) => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(DEFAULT_PALETTE);

  // Hydrate from localStorage on mount; the inline boot script in <body> already set
  // the data-palette attribute pre-paint, so this only needs to sync React state.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isPalette(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPaletteState(stored);
        document.documentElement.dataset.palette = stored;
      } else {
        document.documentElement.dataset.palette = DEFAULT_PALETTE;
      }
    } catch {
      document.documentElement.dataset.palette = DEFAULT_PALETTE;
    }
  }, []);

  const setPalette = useCallback((next: Palette) => {
    if (!isPalette(next)) return;
    setPaletteState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors (private mode, quota, etc.)
    }
    document.documentElement.dataset.palette = next;
  }, []);

  return (
    <PaletteContext.Provider value={{ palette, setPalette }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    throw new Error("usePalette must be used within a PaletteProvider");
  }
  return ctx;
}
