import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => `tooltip:${key}`,
  setRequestLocale: () => {},
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// BvbFeed is an async Server Component that calls next-intl/server +
// fetches data. The personal-page test only cares that the page wrapper
// renders, so stub the feed with a synchronous placeholder.
vi.mock("@/components/bvb-feed", () => ({
  BvbFeed: () => <div data-testid="bvb-feed-stub" />,
}));

afterEach(() => {
  cleanup();
});

import PersonalPage from "./page";

describe("PersonalPage", () => {
  it("renders the personal-page sections (Football / Cars / Travel)", async () => {
    const tree = await PersonalPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(tree);
    // h1 from the page header
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toBeInTheDocument();
    // Sample alt text from the captioned travel + car photos
    expect(screen.getByAltText(/Ljubljana, Slovenia/)).toBeInTheDocument();
  });
});
