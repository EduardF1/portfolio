import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaletteProvider, usePalette } from "./palette-provider";

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
});
