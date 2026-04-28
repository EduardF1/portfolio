/**
 * Tests for <ReadingFeed /> — the Server Component that renders the live
 * "what the wider community is reading" section on /writing.
 *
 * The lib/reading-feed fetcher is mocked so we can assert:
 *   - empty branch (no items returned → fallback empty card),
 *   - populated branch (items render as a list with description + tags),
 *   - the SourceTabs render the three known sources, with the active tab
 *     marked aria-current="page",
 *   - the per-source heading copy is wired correctly.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

const getReadingFeed = vi.fn();

vi.mock("@/lib/reading-feed", () => ({
  getReadingFeed: (source: string, limit: number) => getReadingFeed(source, limit),
  READING_SOURCES: [
    { id: "devto", label: "dev.to" },
    { id: "hn", label: "Hacker News" },
    { id: "all", label: "All sources" },
  ],
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  getReadingFeed.mockReset();
});

import { ReadingFeed } from "./reading-feed";

const ITEMS = [
  {
    id: "devto-1",
    source: "devto" as const,
    title: "TypeScript Discriminated Unions",
    description: "How to model exhaustive variants",
    url: "https://dev.to/x/ts-du",
    publishedAt: "2026-04-15T12:00:00Z",
    author: "Jane Dev",
    readingMinutes: 4,
    tags: ["typescript", "patterns", "react"],
  },
  {
    id: "hn-1",
    source: "hn" as const,
    title: "A small note on caching",
    description: undefined,
    url: "https://news.ycombinator.com/item?id=1",
    publishedAt: "2026-04-14T08:00:00Z",
    author: "user42",
    readingMinutes: undefined,
    tags: [],
  },
];

describe("<ReadingFeed />", () => {
  it("renders the empty fallback when no items are returned", async () => {
    getReadingFeed.mockResolvedValueOnce([]);
    const tree = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "devto",
      limit: 6,
    });
    render(tree);
    expect(
      screen.getByText(/feed is briefly unavailable/i),
    ).toBeInTheDocument();
  });

  it("renders one list item per feed entry, with title and description when present", async () => {
    getReadingFeed.mockResolvedValueOnce(ITEMS);
    const tree = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "devto",
      limit: 6,
    });
    const { container } = render(tree);
    const items = container.querySelectorAll("ul.divide-y > li");
    expect(items.length).toBe(2);
    expect(screen.getByText(/TypeScript Discriminated Unions/)).toBeInTheDocument();
    expect(screen.getByText(/How to model exhaustive variants/)).toBeInTheDocument();
    expect(screen.getByText(/A small note on caching/)).toBeInTheDocument();
  });

  it("renders the three source tabs with the active one carrying aria-current=page", async () => {
    getReadingFeed.mockResolvedValueOnce(ITEMS);
    const tree = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "hn",
      limit: 6,
    });
    render(tree);
    const tabs = screen.getAllByRole("link", {
      name: /^(dev\.to|Hacker News|All sources)$/,
    });
    expect(tabs).toHaveLength(3);
    const active = tabs.find((t) => t.getAttribute("aria-current") === "page");
    expect(active?.textContent).toBe("Hacker News");
  });

  it("uses /writing for the devto tab href and /writing?reading=… for the rest", async () => {
    getReadingFeed.mockResolvedValueOnce([]);
    const tree = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "all",
      limit: 6,
    });
    render(tree);
    const devtoTab = screen.getByRole("link", { name: "dev.to" });
    expect(devtoTab).toHaveAttribute("href", "/writing");
    const hnTab = screen.getByRole("link", { name: "Hacker News" });
    expect(hnTab).toHaveAttribute("href", "/writing?reading=hn");
    const allTab = screen.getByRole("link", { name: "All sources" });
    expect(allTab).toHaveAttribute("href", "/writing?reading=all");
  });

  it("uses the per-source heading copy", async () => {
    getReadingFeed.mockResolvedValueOnce([]);
    const treeDevto = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "devto",
      limit: 6,
    });
    const { rerender } = render(treeDevto);
    expect(
      screen.getByText(/wider community is talking about/i),
    ).toBeInTheDocument();

    getReadingFeed.mockResolvedValueOnce([]);
    const treeHn = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "hn",
      limit: 6,
    });
    rerender(treeHn);
    expect(screen.getByText(/front page of Hacker News/i)).toBeInTheDocument();

    getReadingFeed.mockResolvedValueOnce([]);
    const treeAll = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "all",
      limit: 6,
    });
    rerender(treeAll);
    expect(screen.getByText(/Across dev\.to and Hacker News/i)).toBeInTheDocument();
  });

  it("each list item links to the external item URL with target=_blank + safe rel", async () => {
    getReadingFeed.mockResolvedValueOnce(ITEMS);
    const tree = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "devto",
      limit: 6,
    });
    const { container } = render(tree);
    const links = Array.from(
      container.querySelectorAll("ul.divide-y > li > a"),
    ) as HTMLAnchorElement[];
    expect(links).toHaveLength(2);
    for (const a of links) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toMatch(/noopener/);
      expect(a.getAttribute("rel")).toMatch(/noreferrer/);
    }
    expect(links[0].href).toBe("https://dev.to/x/ts-du");
    expect(links[1].href).toBe("https://news.ycombinator.com/item?id=1");
  });

  it("shows reading-time + first 3 tags inline for an item that has them", async () => {
    getReadingFeed.mockResolvedValueOnce([
      {
        id: "x",
        source: "devto" as const,
        title: "T",
        description: "D",
        url: "https://dev.to/x/y",
        publishedAt: "2026-04-15T12:00:00Z",
        author: "Author Name",
        readingMinutes: 7,
        tags: ["a", "b", "c", "d"],
      },
    ]);
    const tree = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "devto",
      limit: 6,
    });
    const { container } = render(tree);
    const meta = container.textContent ?? "";
    expect(meta).toMatch(/Author Name/);
    expect(meta).toMatch(/7 min read/);
    // Only first 3 tags rendered, "d" excluded.
    expect(meta).toMatch(/a · b · c/);
    expect(meta).not.toMatch(/· d/);
  });

  it("on /writing?reading=all each card prefixes the source label (HN or dev.to)", async () => {
    getReadingFeed.mockResolvedValueOnce(ITEMS);
    const tree = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "all",
      limit: 6,
    });
    const { container } = render(tree);
    const text = container.textContent ?? "";
    expect(text).toMatch(/HN/);
    expect(text).toMatch(/dev\.to/);
  });

  it("count badge in the right column shows '· N' when items are present", async () => {
    getReadingFeed.mockResolvedValueOnce(ITEMS);
    const tree = await ReadingFeed({
      kicker: "Reading",
      tooltip: "tip",
      source: "devto",
      limit: 6,
    });
    const { container } = render(tree);
    const text = container.textContent ?? "";
    expect(text).toMatch(/dev\.to · 2/);
  });
});
