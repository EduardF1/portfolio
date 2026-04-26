import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const setTheme = vi.fn();
const useTheme = vi.fn().mockReturnValue({ resolvedTheme: "light", setTheme });

vi.mock("next-themes", () => ({
  useTheme: () => useTheme(),
}));

import { ThemeToggle } from "./theme-toggle";

beforeEach(() => {
  setTheme.mockReset();
  useTheme.mockReset();
  useTheme.mockReturnValue({ resolvedTheme: "light", setTheme });
});

afterEach(() => {
  cleanup();
});

describe("<ThemeToggle />", () => {
  it("after mount in light mode, shows the Moon icon and an aria-label to switch to dark", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  it("after mount in dark mode, aria-label says switch to light mode", () => {
    useTheme.mockReturnValue({ resolvedTheme: "dark", setTheme });
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to light mode",
    );
  });

  it("clicking flips the theme between light and dark", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("clicking from dark switches back to light", () => {
    useTheme.mockReturnValue({ resolvedTheme: "dark", setTheme });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
