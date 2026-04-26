import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PaletteProvider } from "./palette-provider";
import { PaletteSelector } from "./palette-selector";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      label: "Theme palette",
      schwarzgelb: "Black & Yellow",
      mountainNavy: "Mountain Navy",
      woodsyCabin: "Woodsy Cabin",
    };
    return map[key] ?? key;
  },
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-palette");
});

describe("<PaletteSelector />", () => {
  it("renders an option per palette in the documented order", () => {
    render(
      <PaletteProvider>
        <PaletteSelector />
      </PaletteProvider>,
    );
    const select = screen.getByLabelText("Theme palette") as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll("option")).map((o) => ({
      value: o.value,
      label: o.textContent,
    }));
    expect(options).toEqual([
      { value: "schwarzgelb", label: "Black & Yellow" },
      { value: "mountain-navy", label: "Mountain Navy" },
      { value: "woodsy-cabin", label: "Woodsy Cabin" },
    ]);
  });

  it("defaults to mountain-navy on first visit", () => {
    render(
      <PaletteProvider>
        <PaletteSelector />
      </PaletteProvider>,
    );
    const select = screen.getByLabelText("Theme palette") as HTMLSelectElement;
    expect(select.value).toBe("mountain-navy");
  });

  it("changing the selector flips data-palette on <html> and persists to localStorage", () => {
    render(
      <PaletteProvider>
        <PaletteSelector />
      </PaletteProvider>,
    );
    const select = screen.getByLabelText("Theme palette") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "woodsy-cabin" } });
    expect(select.value).toBe("woodsy-cabin");
    expect(document.documentElement.dataset.palette).toBe("woodsy-cabin");
    expect(window.localStorage.getItem("palette")).toBe("woodsy-cabin");
  });

  it("reflects the palette stored on previous visit", () => {
    window.localStorage.setItem("palette", "schwarzgelb");
    render(
      <PaletteProvider>
        <PaletteSelector />
      </PaletteProvider>,
    );
    const select = screen.getByLabelText("Theme palette") as HTMLSelectElement;
    expect(select.value).toBe("schwarzgelb");
  });
});
