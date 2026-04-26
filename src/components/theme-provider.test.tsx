import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ThemeProvider } from "./theme-provider";

beforeEach(() => {
  // next-themes touches matchMedia for system-theme detection
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

describe("<ThemeProvider />", () => {
  it("renders its children unchanged (it's a thin passthrough wrapper)", () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <p>theme child</p>
      </ThemeProvider>,
    );
    expect(screen.getByText("theme child")).toBeInTheDocument();
  });

  it("forwards next-themes props (defaultTheme, enableSystem) without throwing", () => {
    render(
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <span data-testid="under">ok</span>
      </ThemeProvider>,
    );
    expect(screen.getByTestId("under")).toBeInTheDocument();
  });
});
