/**
 * Tests for the /search full-results page.
 *
 * Covers both the SearchPage server entry (params + searchParams plumbing)
 * and the client component that owns the input + URL sync.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

const routerReplace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
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

let urlParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => urlParams,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      title: "Search",
      kicker: "Search",
      pageDescription: "Find anything Eduard has written.",
      placeholder: "Search the site",
      loading: "Loading…",
      errorGeneric: "Search index unavailable",
      hint: "Start typing to search",
      noResults: "No results match this query",
      enFallback: "EN",
      "collection.writing": "Posts",
      "collection.work": "Work",
      "collection.recommends": "Recommends",
      "collection.articles": "Articles",
    };
    return map[key] ?? key;
  },
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: () => {},
}));

vi.mock("@/lib/search/client", async () => {
  type Hit = {
    id: string;
    title: string;
    description?: string;
    excerpt?: string;
    collection: "writing" | "work" | "recommends" | "articles";
    slug: string;
    score: number;
    localeFallback?: boolean;
  };
  return {
    buildClientIndex: (payload: { entries: Hit[] }) => ({
      byId: new Map<string, Hit>(payload.entries.map((e) => [e.id, e])),
    }),
    searchClient: (
      index: { byId: Map<string, Hit> },
      query: string,
    ): Hit[] => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return Array.from(index.byId.values())
        .filter((e) => e.title.toLowerCase().includes(q))
        .map((e) => ({ ...e, score: 1 }));
    },
    hitHref: (hit: Hit) => `/${hit.collection}/${hit.slug}`,
  };
});

const SAMPLE_INDEX = {
  entries: [
    {
      id: "writing/three-tier",
      collection: "writing" as const,
      slug: "three-tier-thinking",
      title: "Three-tier thinking",
      description: "Pattern.",
      excerpt: "When in doubt, split it three ways…",
    },
    {
      id: "work/kombit",
      collection: "work" as const,
      slug: "kombit-valg",
      title: "KOMBIT VALG",
      description: "Election platform.",
    },
  ],
};

beforeEach(() => {
  routerReplace.mockReset();
  urlParams = new URLSearchParams();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => SAMPLE_INDEX,
    })) as unknown as typeof fetch,
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

import { SearchPageClient } from "./search-client";
import SearchPage from "./page";

async function flushAsync() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("<SearchPageClient />", () => {
  it("renders the heading + description shell synchronously", () => {
    render(<SearchPageClient locale="en" initialQuery="" />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Search/ }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("search-page-input")).toBeInTheDocument();
  });

  it("loads the index, then shows the empty-state hint when query is empty", async () => {
    render(<SearchPageClient locale="en" initialQuery="" />);
    await flushAsync();
    expect(screen.getByText(/Start typing to search/)).toBeInTheDocument();
  });

  it("seeds the input from initialQuery prop and renders matching hits", async () => {
    urlParams = new URLSearchParams("q=kombit");
    render(<SearchPageClient locale="en" initialQuery="kombit" />);
    await flushAsync();
    expect(screen.getAllByTestId("search-page-result").length).toBeGreaterThan(0);
    expect(screen.getByText(/KOMBIT VALG/)).toBeInTheDocument();
  });

  it("typing into the input fires router.replace with the URL-encoded query", async () => {
    render(<SearchPageClient locale="en" initialQuery="" />);
    await flushAsync();
    const input = screen.getByTestId("search-page-input");
    fireEvent.change(input, { target: { value: "three" } });
    expect(routerReplace).toHaveBeenLastCalledWith("/search?q=three");
  });

  it("clearing the input replaces the URL with /search (drops the q param)", async () => {
    urlParams = new URLSearchParams("q=kombit");
    render(<SearchPageClient locale="en" initialQuery="kombit" />);
    await flushAsync();
    const input = screen.getByTestId("search-page-input");
    fireEvent.change(input, { target: { value: "" } });
    expect(routerReplace).toHaveBeenLastCalledWith("/search");
  });

  it("renders the no-results copy when query has no matches", async () => {
    urlParams = new URLSearchParams("q=zzzz-nothing");
    render(<SearchPageClient locale="en" initialQuery="zzzz-nothing" />);
    await flushAsync();
    expect(screen.getByText(/No results match this query/)).toBeInTheDocument();
  });

  it("renders the error copy when the index fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })) as unknown as typeof fetch,
    );
    render(<SearchPageClient locale="en" initialQuery="" />);
    await flushAsync();
    expect(screen.getByText(/Search index unavailable/)).toBeInTheDocument();
  });

  it("each hit links to hitHref with the localised collection chip", async () => {
    urlParams = new URLSearchParams("q=three");
    render(<SearchPageClient locale="en" initialQuery="three" />);
    await flushAsync();
    const link = screen
      .getAllByTestId("search-page-result")[0] as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/writing/three-tier-thinking");
    expect(link.textContent).toMatch(/Posts/);
    expect(link.textContent).toMatch(/Three-tier thinking/);
  });

  it("syncs query when the URL params change externally (Back/Forward navigation)", async () => {
    const { rerender } = render(
      <SearchPageClient locale="en" initialQuery="" />,
    );
    await flushAsync();
    // Simulate a back/forward change of ?q
    urlParams = new URLSearchParams("q=kombit");
    rerender(<SearchPageClient locale="en" initialQuery="" />);
    await flushAsync();
    const input = screen.getByTestId("search-page-input") as HTMLInputElement;
    expect(input.value).toBe("kombit");
  });
});

describe("SearchPage (Server entry)", () => {
  it("forwards locale + q from params to the client component", async () => {
    urlParams = new URLSearchParams("q=kombit");
    const tree = await SearchPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ q: "kombit" }),
    });
    render(tree);
    await flushAsync();
    const input = screen.getByTestId("search-page-input") as HTMLInputElement;
    expect(input.value).toBe("kombit");
  });

  it("treats missing q as empty initial query", async () => {
    const tree = await SearchPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    render(tree);
    await flushAsync();
    const input = screen.getByTestId("search-page-input") as HTMLInputElement;
    expect(input.value).toBe("");
  });
});
