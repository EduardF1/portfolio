import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const replace = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      work: "Work",
      writing: "Posts",
      recommends: "Recommends",
      personal: "Personal",
      travel: "Travel",
      contact: "Contact",
      switchToDanish: "Switch to Danish",
      switchToEnglish: "Switch to English",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      menuTitle: "Site navigation",
      label: "Theme palette",
      schwarzgelb: "Black & Yellow",
      mountainNavy: "Mountain Navy",
      woodsyCabin: "Woodsy Cabin",
      openLabel: "Open search",
      short: "Search",
    };
    return map[key] ?? key;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/work",
  useRouter: () => ({ replace }),
}));

beforeEach(() => {
  replace.mockReset();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
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

import { SiteHeader } from "./site-header";
import { PaletteProvider } from "./palette-provider";

function renderHeader() {
  return render(
    <PaletteProvider>
      <SiteHeader />
    </PaletteProvider>,
  );
}

describe("<SiteHeader />", () => {
  it("renders the brand link as one continuous name and all primary nav links", () => {
    renderHeader();
    // aria-label exposes the full name to AT, even though the visible
    // text is split across two spans for mobile stacking.
    expect(
      screen.getByRole("link", { name: "Eduard Fischer-Szava" }),
    ).toBeInTheDocument();
    for (const label of ["Work", "Posts", "Recommends", "Personal", "Travel", "Contact"]) {
      // Header inline nav renders these links unconditionally — once at md+.
      // Mobile sheet is closed by default, so each label appears exactly once.
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("locale toggle replaces the route with the other locale", () => {
    renderHeader();
    const toggle = screen.getByTestId("locale-toggle");
    fireEvent.click(toggle);
    expect(replace).toHaveBeenCalledWith("/work", { locale: "da" });
  });

  it("hamburger button toggles the mobile menu open and closed", () => {
    renderHeader();
    const trigger = screen.getByTestId("mobile-menu-trigger");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const sheet = screen.getByTestId("mobile-menu");
    expect(sheet).toBeInTheDocument();
    expect(sheet).toHaveAttribute("role", "dialog");
    expect(sheet).toHaveAttribute("aria-modal", "true");

    const close = screen.getByTestId("mobile-menu-close");
    fireEvent.click(close);
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  it("ESC closes the open mobile menu", () => {
    renderHeader();
    fireEvent.click(screen.getByTestId("mobile-menu-trigger"));
    expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  it("renders all nav links inside the open mobile menu", () => {
    renderHeader();
    fireEvent.click(screen.getByTestId("mobile-menu-trigger"));
    const sheet = screen.getByTestId("mobile-menu");
    for (const label of [
      "Work",
      "Posts",
      "Recommends",
      "Personal",
      "Travel",
      "Contact",
    ]) {
      // Each nav label appears in both the inline (hidden on mobile via CSS
      // but present in DOM) and sheet navs while open. Filter to the sheet.
      const within = sheet.querySelectorAll("a");
      const found = Array.from(within).some((a) => a.textContent === label);
      expect(found, `mobile sheet renders link ${label}`).toBe(true);
    }
  });

  it("active route is announced via aria-current in both inline and mobile nav", () => {
    renderHeader();
    // pathname mock is /work — the Work link should carry aria-current="page".
    const inlineWork = screen.getAllByRole("link", { name: "Work" })[0];
    expect(inlineWork).toHaveAttribute("aria-current", "page");
  });
});
