import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

// Default `next-intl/server` mocks: locale "en" and a passthrough
// translator that returns "footer:<key>". Individual tests override
// either as needed.
vi.mock("next-intl/server", () => ({
  getLocale: async () => "en",
  getTranslations: async (ns?: string) => (key: string) =>
    `${ns ?? "_"}:${key}`,
}));

// Default `@/lib/last-seen`: no GPS data → null. Tests that need a
// concrete value re-mock the module via `vi.doMock` before the dynamic
// import below.
vi.mock("@/lib/last-seen", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/last-seen")>("@/lib/last-seen");
  return {
    ...actual,
    getLastSeen: vi.fn(async () => null),
  };
});

import * as lastSeen from "@/lib/last-seen";
import { SiteFooter } from "./site-footer";

afterEach(() => {
  cleanup();
  vi.mocked(lastSeen.getLastSeen).mockReset();
  // Re-establish the default null return so each test has a clean
  // baseline.
  vi.mocked(lastSeen.getLastSeen).mockResolvedValue(null);
});

describe("<SiteFooter />", () => {
  it("renders the GitHub, LinkedIn and Email social links", async () => {
    render(await SiteFooter());
    const gh = screen.getByLabelText("GitHub");
    expect(gh).toHaveAttribute("href", "https://github.com/EduardF1");
    expect(gh).toHaveAttribute("target", "_blank");
    expect(gh).toHaveAttribute("rel", "noopener noreferrer");

    const li = screen.getByLabelText("LinkedIn");
    expect(li).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/eduard-fischer-szava/",
    );

    const mail = screen.getByLabelText("Send email");
    expect(mail).toHaveAttribute("href", "mailto:fischer_eduard@yahoo.com");
    // mailto: is not http → no target
    expect(mail).not.toHaveAttribute("target");
  });

  it("shows the current year in the copyright line", async () => {
    render(await SiteFooter());
    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${year} Eduard Fischer-Szava`)),
    ).toBeInTheDocument();
  });

  it("omits the 'last seen' line when no GPS-tagged photo is available", async () => {
    vi.mocked(lastSeen.getLastSeen).mockResolvedValue(null);
    render(await SiteFooter());
    expect(screen.queryByTestId("footer-last-seen")).toBeNull();
  });

  it("renders the localised 'last seen in' line for the most recent GPS photo", async () => {
    vi.mocked(lastSeen.getLastSeen).mockResolvedValue({
      city: "Trieste",
      country: "Italy",
      takenAt: "2026-03-26T10:00:00Z",
    });
    render(await SiteFooter());
    const line = screen.getByTestId("footer-last-seen");
    expect(line.textContent).toMatch(/footer:lastSeenIn/);
    expect(line.textContent).toMatch(/Trieste, Italy/);
    expect(line.textContent).toMatch(/March 2026/);
  });
});
