import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import enMessages from "../../../../messages/en.json";
import daMessages from "../../../../messages/da.json";

vi.mock("server-only", () => ({}));

const localeMock = { current: "en" as "en" | "da" };

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns?: string) => {
    type Bag = Record<string, unknown>;
    const bag = (localeMock.current === "en" ? enMessages : daMessages) as Bag;
    const root = (ns ? walk(bag, ns) : bag) ?? {};
    function walk(b: Bag, path: string): Bag | undefined {
      let c: unknown = b;
      for (const seg of path.split(".")) {
        if (c && typeof c === "object" && seg in c) c = (c as Bag)[seg];
        else return undefined;
      }
      return c as Bag;
    }
    const t = (key: string) => {
      const v = walk(root, key);
      return typeof v === "string" ? v : key;
    };
    // Minimal `.rich` shim so the personal page can use t.rich for the
    // BVB photo credit (translated string with two anchor tags).
    (t as unknown as {
      rich: (
        key: string,
        tags: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
      ) => React.ReactNode;
    }).rich = (key, tags) => {
      const v = walk(root, key);
      const template = typeof v === "string" ? v : key;
      return [template, ...Object.values(tags).map((render) => render(""))];
    };
    return t;
  },
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
    localeMock.current = "en";
    const tree = await PersonalPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(tree);
    // h1 from the page header
    expect(
      screen.getByRole("heading", { level: 1, name: /Outside the office\./ }),
    ).toBeInTheDocument();
    // Sample alt text from the captioned travel + car photos
    expect(screen.getByAltText(/Ljubljana, Slovenia/)).toBeInTheDocument();
  });

  it("renders the Danish heading when locale is da", async () => {
    localeMock.current = "da";
    const tree = await PersonalPage({
      params: Promise.resolve({ locale: "da" }),
    });
    render(tree);
    expect(
      screen.getByRole("heading", { level: 1, name: /Uden for kontoret\./ }),
    ).toBeInTheDocument();
  });
});
