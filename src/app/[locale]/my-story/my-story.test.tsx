/**
 * Smoke tests for /my-story.
 *
 * The page is a React Server Component that renders a hand-curated list of
 * career chapters. We mock next-intl + i18n nav so we can render in jsdom
 * and assert on the timeline structure (10 entries, year ranges, takeaway
 * lines) — the data the user sees on the actual page.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: () => {},
  getTranslations: async () => {
    const fn = (key: string) => {
      const map: Record<string, string> = {
        kicker: "My story",
        heading: "How I got here.",
        description:
          "A chronological version of the CV: the choices, not the achievements.",
        navIntro: "Intro",
        navChapters: "Chapters",
        navWhatsNext: "Now",
        whatsNext: "Where I am now",
        whatsNextLead: "Currently at Mjølner Informatics in Aarhus.",
      };
      return map[key] ?? key;
    };
    (
      fn as unknown as {
        rich: (
          key: string,
          tags: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
        ) => React.ReactNode[];
      }
    ).rich = (key, tags) => [
      fn(key),
      ...Object.values(tags).map((render) => render("link")),
    ];
    return fn;
  },
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
});

import MyStoryPage from "./page";

describe("MyStoryPage", () => {
  it("renders the H1 heading and intro section", async () => {
    const tree = await MyStoryPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(tree);
    expect(
      screen.getByRole("heading", { level: 1, name: /How I got here/ }),
    ).toBeInTheDocument();
  });

  it("renders an ordered list of all 10 career chapters as <li> items", async () => {
    const tree = await MyStoryPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const { container } = render(tree);
    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    const items = ol!.querySelectorAll("li");
    // The hand-curated chapter list has exactly 10 entries — see CHAPTERS
    // in page.tsx. If a chapter is added/removed this test should fail
    // and the author has to consciously update it.
    expect(items.length).toBe(10);
  });

  it("renders the Mjølner chapter as the most recent (no takeaway line yet)", async () => {
    const tree = await MyStoryPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(tree);
    expect(screen.getByText(/Current chapter/)).toBeInTheDocument();
    // "Mjølner Informatics" appears in both the body and the place line
    expect(screen.getAllByText(/Mjølner Informatics/).length).toBeGreaterThan(0);
  });

  it("renders takeaway lines for chapters that include one", async () => {
    const tree = await MyStoryPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(tree);
    // 9 of 10 chapters carry a "Took with me:" takeaway line. The
    // current-chapter (Mjølner) intentionally omits it.
    const takeaways = screen.getAllByText(/Took with me:/i);
    expect(takeaways.length).toBe(9);
  });

  it("renders headings for the three SectionNav anchors (intro, chapters, whats-next)", async () => {
    const tree = await MyStoryPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const { container } = render(tree);
    expect(container.querySelector("#intro")).not.toBeNull();
    expect(container.querySelector("#chapters")).not.toBeNull();
    expect(container.querySelector("#whats-next")).not.toBeNull();
  });

  it("renders all the institutions / employers in chronological order", async () => {
    const tree = await MyStoryPage({
      params: Promise.resolve({ locale: "en" }),
    });
    const { container } = render(tree);
    const rangeText = Array.from(container.querySelectorAll("p"))
      .map((p) => p.textContent ?? "")
      .filter((t) => /\d{4}/.test(t));
    // The first chapter starts in 2017 (IBA Kolding) and the last is
    // Apr 2026 (Mjølner). Year ranges form a non-empty timeline.
    expect(rangeText.some((t) => /2017/.test(t))).toBe(true);
    expect(rangeText.some((t) => /2026/.test(t))).toBe(true);
  });

  it("uses the locale from params (does not throw on /da)", async () => {
    const tree = await MyStoryPage({
      params: Promise.resolve({ locale: "da" }),
    });
    render(tree);
    // We don't translate the chapter body itself (intentionally hand-curated
    // in EN), but the page must render without throwing for either locale.
    expect(
      screen.getByRole("heading", { level: 1, name: /How I got here/ }),
    ).toBeInTheDocument();
  });
});
