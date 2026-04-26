import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PaletteProvider,
  usePalette,
  PALETTES,
  DEFAULT_PALETTE,
} from "./palette-provider";

function Probe() {
  const { palette, setPalette } = usePalette();
  return (
    <div>
      <span data-testid="current">{palette}</span>
      <button onClick={() => setPalette("mountain-navy")}>to-mountain</button>
      <button onClick={() => setPalette("woodsy-cabin")}>to-woods</button>
    </div>
  );
}

describe("<PaletteProvider />", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-palette");
  });

  it("defaults to mountain-navy when no palette is stored", async () => {
    render(
      <PaletteProvider>
        <Probe />
      </PaletteProvider>,
    );
    expect(screen.getByTestId("current").textContent).toBe("mountain-navy");
    // After mount effect runs, the attribute is set explicitly to the default.
    expect(document.documentElement.dataset.palette).toBe("mountain-navy");
  });

  it("applies a stored palette on mount", () => {
    window.localStorage.setItem("palette", "woodsy-cabin");
    render(
      <PaletteProvider>
        <Probe />
      </PaletteProvider>,
    );
    expect(screen.getByTestId("current").textContent).toBe("woodsy-cabin");
    expect(document.documentElement.dataset.palette).toBe("woodsy-cabin");
  });

  it("setPalette persists to localStorage and sets data-palette", async () => {
    const user = userEvent.setup();
    render(
      <PaletteProvider>
        <Probe />
      </PaletteProvider>,
    );
    await user.click(screen.getByText("to-mountain"));
    expect(screen.getByTestId("current").textContent).toBe("mountain-navy");
    expect(window.localStorage.getItem("palette")).toBe("mountain-navy");
    expect(document.documentElement.dataset.palette).toBe("mountain-navy");
  });

  it("ignores invalid stored palettes and falls back to mountain-navy", () => {
    window.localStorage.setItem("palette", "not-a-real-palette");
    render(
      <PaletteProvider>
        <Probe />
      </PaletteProvider>,
    );
    expect(screen.getByTestId("current").textContent).toBe("mountain-navy");
    expect(document.documentElement.dataset.palette).toBe("mountain-navy");
  });

  it("ignores attempts to set an invalid palette via setPalette", async () => {
    const user = userEvent.setup();
    function Bad() {
      const { palette, setPalette } = usePalette();
      return (
        <div>
          <span data-testid="current">{palette}</span>
          {/* Force an invalid value through the type system */}
          <button
            onClick={() =>
              (setPalette as unknown as (value: string) => void)("not-real")
            }
          >
            invalid
          </button>
        </div>
      );
    }
    render(
      <PaletteProvider>
        <Bad />
      </PaletteProvider>,
    );
    await user.click(screen.getByText("invalid"));
    expect(screen.getByTestId("current").textContent).toBe("mountain-navy");
  });

  it("throws when usePalette is consumed outside a provider", () => {
    function Outside() {
      usePalette();
      return null;
    }
    // Suppress React's expected error log during the throwing render
    const orig = console.error;
    console.error = () => {};
    try {
      expect(() => render(<Outside />)).toThrow(
        /usePalette must be used within a PaletteProvider/,
      );
    } finally {
      console.error = orig;
    }
  });

  it("survives a localStorage.setItem that throws (private mode/quota)", async () => {
    const user = userEvent.setup();
    const setSpy = vi
      .spyOn(window.localStorage.__proto__, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
    render(
      <PaletteProvider>
        <Probe />
      </PaletteProvider>,
    );
    // The click should not throw even though storage write fails
    await user.click(screen.getByText("to-woods"));
    expect(screen.getByTestId("current").textContent).toBe("woodsy-cabin");
    expect(document.documentElement.dataset.palette).toBe("woodsy-cabin");
    setSpy.mockRestore();
  });

  it("survives a localStorage.getItem that throws on hydration", () => {
    const getSpy = vi
      .spyOn(window.localStorage.__proto__, "getItem")
      .mockImplementation(() => {
        throw new Error("ReadDenied");
      });
    render(
      <PaletteProvider>
        <Probe />
      </PaletteProvider>,
    );
    expect(screen.getByTestId("current").textContent).toBe("mountain-navy");
    expect(document.documentElement.dataset.palette).toBe("mountain-navy");
    getSpy.mockRestore();
  });

  it("exposes a sane PALETTES list and DEFAULT_PALETTE constant", () => {
    expect(PALETTES).toEqual(["schwarzgelb", "mountain-navy", "woodsy-cabin"]);
    expect(DEFAULT_PALETTE).toBe("mountain-navy");
  });
});
