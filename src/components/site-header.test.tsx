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
      label: "Theme palette",
      schwarzgelb: "Black & Yellow",
      mountainNavy: "Mountain Navy",
      woodsyCabin: "Woodsy Cabin",
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

describe("<SiteHeader />", () => {
  it("renders the Home brand and all primary nav links", () => {
    render(
      <PaletteProvider>
        <SiteHeader />
      </PaletteProvider>,
    );
    expect(screen.getByLabelText("Home")).toBeInTheDocument();
    for (const label of ["Work", "Posts", "Recommends", "Personal", "Travel", "Contact"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("locale toggle replaces the route with the other locale", () => {
    render(
      <PaletteProvider>
        <SiteHeader />
      </PaletteProvider>,
    );
    const toggle = screen.getByTestId("locale-toggle");
    fireEvent.click(toggle);
    expect(replace).toHaveBeenCalledWith("/work", { locale: "da" });
  });
});
