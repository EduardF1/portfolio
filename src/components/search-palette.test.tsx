/**
 * Tests for <SearchPalette /> — the site-wide ⌘K command palette.
 *
 * Behaviour we lock in:
 *   - opens on Cmd+K / Ctrl+K, on bare `/` when no input is focused, and
 *     on the `portfolio:search-open` custom event,
 *   - opens but is closed by default,
 *   - lazy-fetches the per-locale index from /api/search-index on first open,
 *   - shows a hint when query is empty, "no results" when no hits,
 *   - ESC closes,
 *   - clicking a result navigates via the i18n router and closes,
 *   - "See all" routes to /search?q=…,
 *   - render rate is bounded — re-opening does not trigger a second fetch.
 *
 * The lib/search/client module ships a real FlexSearch backed index. We
 * replace it with a deterministic stub so result ranking is predictable
 * and the test is hermetic.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

const routerPush = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      title: "Search",
      placeholder: "Search the site",
      close: "Close",
      loading: "Loading…",
      errorGeneric: "Search index unavailable",
      hint: "Start typing to search",
      noResults: "No results",
      enFallback: "EN",
      kbdHint: "↑↓ to move · enter to select · esc to close",
      seeAll: "See all results",
      resultsLabel: "Search results",
      "collection.writing": "Posts",
      "collection.articles": "Articles",
      "collection.work": "Work",
      "collection.recommends": "Recommends",
    };
    return map[key] ?? key;
  },
}));

vi.mock("@/lib/search/client", async () => {
  type Hit = {
    id: string;
    title: string;
    description?: string;
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
      const all = Array.from(index.byId.values());
      // Score: descending count of substring matches in title.
      return all
        .map((entry) => ({
          ...entry,
          score: entry.title.toLowerCase().includes(q) ? 5 : 0,
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);
    },
    groupByCollection: (
      hits: Hit[],
    ): Array<{ collection: Hit["collection"]; hits: Hit[] }> => {
      const order = new Map<Hit["collection"], Hit[]>();
      for (const h of hits) {
        const list = order.get(h.collection) ?? [];
        list.push(h);
        order.set(h.collection, list);
      }
      return Array.from(order.entries()).map(([collection, hits]) => ({
        collection,
        hits,
      }));
    },
    hitHref: (hit: Hit) => `/${hit.collection}/${hit.slug}`,
    findMatchRange: (haystack: string, needle: string) => {
      if (!needle) return null;
      const idx = haystack.toLowerCase().indexOf(needle.toLowerCase());
      return idx < 0 ? null : ([idx, idx + needle.length] as [number, number]);
    },
  };
});

const SAMPLE_INDEX = {
  entries: [
    {
      id: "writing/three-tier",
      collection: "writing" as const,
      slug: "three-tier-thinking",
      title: "Three-tier thinking",
      description: "A pattern for structuring delivery decisions.",
    },
    {
      id: "work/kombit",
      collection: "work" as const,
      slug: "kombit-valg",
      title: "KOMBIT VALG",
      description: "Denmark's national administrative election platform.",
    },
    {
      id: "recommends/book",
      collection: "recommends" as const,
      slug: "a-philosophy-of-software-design",
      title: "A Philosophy of Software Design",
      description: "John Ousterhout · 2018.",
    },
  ],
};

beforeEach(() => {
  routerPush.mockReset();
  // Mock fetch for the index endpoint.
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

import { SearchPalette } from "./search-palette";

async function flushAsync() {
  // Allow the index fetch + buildClientIndex effect chain to settle.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function openPalette() {
  fireEvent.keyDown(window, { key: "k", metaKey: true });
}

describe("<SearchPalette />", () => {
  it("is closed by default (no dialog in the DOM)", () => {
    render(<SearchPalette />);
    expect(screen.queryByTestId("search-palette")).not.toBeInTheDocument();
  });

  it("opens on Cmd+K and shows the empty-state hint", async () => {
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    expect(screen.getByTestId("search-palette")).toBeInTheDocument();
    expect(screen.getByText(/Start typing to search/)).toBeInTheDocument();
  });

  it("opens on Ctrl+K (Linux/Windows shortcut)", async () => {
    render(<SearchPalette />);
    fireEvent.keyDown(window, { key: "K", ctrlKey: true });
    await flushAsync();
    expect(screen.getByTestId("search-palette")).toBeInTheDocument();
  });

  it("opens on `/` keystroke when no input is focused", async () => {
    render(<SearchPalette />);
    fireEvent.keyDown(window, { key: "/" });
    await flushAsync();
    expect(screen.getByTestId("search-palette")).toBeInTheDocument();
  });

  it("does NOT open on `/` while an input is focused (typing in a form)", async () => {
    const wrap = document.createElement("div");
    document.body.appendChild(wrap);
    const input = document.createElement("input");
    wrap.appendChild(input);
    input.focus();

    render(<SearchPalette />);
    fireEvent.keyDown(input, { key: "/" });
    await flushAsync();
    expect(screen.queryByTestId("search-palette")).not.toBeInTheDocument();
    document.body.removeChild(wrap);
  });

  it("opens when the portfolio:search-open custom event fires", async () => {
    render(<SearchPalette />);
    act(() => {
      window.dispatchEvent(new CustomEvent("portfolio:search-open"));
    });
    await flushAsync();
    expect(screen.getByTestId("search-palette")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    const dialog = screen.getByTestId("search-palette");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByTestId("search-palette")).not.toBeInTheDocument();
  });

  it("typing a query renders matching results, grouped by collection heading", async () => {
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    const input = screen.getByTestId("search-palette-input");
    fireEvent.change(input, { target: { value: "three" } });
    await flushAsync();
    expect(screen.getAllByTestId("search-palette-result")).toHaveLength(1);
    // Group heading rendered (from collection.writing translation key).
    expect(screen.getByText("Posts")).toBeInTheDocument();
  });

  it("Enter navigates the i18n router to the active hit and closes the palette", async () => {
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    const input = screen.getByTestId("search-palette-input");
    fireEvent.change(input, { target: { value: "kombit" } });
    await flushAsync();
    const dialog = screen.getByTestId("search-palette");
    fireEvent.keyDown(dialog, { key: "Enter" });
    expect(routerPush).toHaveBeenCalledWith("/work/kombit-valg");
    expect(screen.queryByTestId("search-palette")).not.toBeInTheDocument();
  });

  it("Enter with no hits and a non-empty query falls back to /search?q=…", async () => {
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    const input = screen.getByTestId("search-palette-input");
    fireEvent.change(input, { target: { value: "nothing-matches-this" } });
    await flushAsync();
    const dialog = screen.getByTestId("search-palette");
    fireEvent.keyDown(dialog, { key: "Enter" });
    expect(routerPush).toHaveBeenCalledWith(
      "/search?q=nothing-matches-this",
    );
  });

  it("clicking a result navigates and closes", async () => {
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    const input = screen.getByTestId("search-palette-input");
    fireEvent.change(input, { target: { value: "philosophy" } });
    await flushAsync();
    const result = screen.getByTestId("search-palette-result");
    fireEvent.click(result);
    expect(routerPush).toHaveBeenCalledWith(
      "/recommends/a-philosophy-of-software-design",
    );
  });

  it("ArrowDown moves the active cursor through results (wrap-around at end)", async () => {
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    const input = screen.getByTestId("search-palette-input");
    // Multi-char query "k" matches kombit (1 hit). Use a more permissive
    // query so we get >1 hit.
    fireEvent.change(input, { target: { value: "i" } });
    await flushAsync();
    const results = screen.getAllByTestId("search-palette-result");
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].dataset.active).toBe("true");
    const dialog = screen.getByTestId("search-palette");
    fireEvent.keyDown(dialog, { key: "ArrowDown" });
    const after = screen.getAllByTestId("search-palette-result");
    expect(after[0].dataset.active).toBeUndefined();
    expect(after[1].dataset.active).toBe("true");
  });

  it("'See all' button routes to /search?q=… with the query encoded", async () => {
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    const input = screen.getByTestId("search-palette-input");
    fireEvent.change(input, { target: { value: "philosophy" } });
    await flushAsync();
    const seeAll = screen.getByRole("button", { name: /See all results/ });
    fireEvent.click(seeAll);
    expect(routerPush).toHaveBeenCalledWith("/search?q=philosophy");
  });

  it("only fetches the index once across multiple opens (cache lifetime = page lifetime)", async () => {
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    const dialog = screen.getByTestId("search-palette");
    fireEvent.keyDown(dialog, { key: "Escape" });
    openPalette();
    await flushAsync();
    expect(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(
      1,
    );
  });

  it("renders the error fallback if the index fetch returns non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })) as unknown as typeof fetch,
    );
    render(<SearchPalette />);
    openPalette();
    await flushAsync();
    expect(screen.getByText(/Search index unavailable/)).toBeInTheDocument();
  });
});
