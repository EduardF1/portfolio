/**
 * Tests for the pure helpers in lib/search/client.ts.
 *
 * The full FlexSearch path is exercised by the palette + page tests via
 * a stub; here we focus on the deterministic pure functions:
 *   - hitHref maps a collection to its canonical route,
 *   - findMatchRange does a case-insensitive substring lookup,
 *   - groupByCollection preserves insertion order within each group,
 *   - buildClientIndex + searchClient round-trip a small fixture against
 *     the real FlexSearch index.
 */

import { describe, expect, it } from "vitest";
import {
  buildClientIndex,
  findMatchRange,
  groupByCollection,
  hitHref,
  searchClient,
} from "./client";
import type { SearchEntry, SearchIndex } from "./build-index";

const SAMPLE_INDEX: SearchIndex = {
  locale: "en",
  generatedAt: "2026-04-28T00:00:00Z",
  entries: [
    {
      id: "writing/three-tier",
      collection: "writing",
      slug: "three-tier-thinking",
      locale: "en",
      title: "Three-tier thinking",
      description: "Pattern.",
      tags: ["delivery"],
      excerpt: "Body excerpt.",
    },
    {
      id: "work/kombit",
      collection: "work",
      slug: "kombit-valg",
      locale: "en",
      title: "KOMBIT VALG",
      description: "Election platform.",
      tags: ["dotnet", "angular"],
      excerpt: "Body.",
    },
    {
      id: "recommends/book",
      collection: "recommends",
      slug: "a-philosophy-of-software-design",
      locale: "en",
      title: "A Philosophy of Software Design",
      description: "John Ousterhout.",
      tags: ["book"],
      excerpt: "Body.",
    },
    {
      id: "articles/feral",
      collection: "articles",
      slug: "feral-systems",
      locale: "en",
      title: "Feral systems in waste collection",
      tags: [],
      excerpt: "Body.",
    },
  ],
};

describe("hitHref", () => {
  it("routes writing entries under /writing/<slug>", () => {
    expect(
      hitHref({
        ...SAMPLE_INDEX.entries[0],
      }),
    ).toBe("/writing/three-tier-thinking");
  });

  it("routes articles under /writing/<slug> (shared list page)", () => {
    expect(hitHref(SAMPLE_INDEX.entries[3])).toBe("/writing/feral-systems");
  });

  it("routes work entries under /work/<slug>", () => {
    expect(hitHref(SAMPLE_INDEX.entries[1])).toBe("/work/kombit-valg");
  });

  it("routes recommends entries under /recommends/<slug>", () => {
    expect(hitHref(SAMPLE_INDEX.entries[2])).toBe(
      "/recommends/a-philosophy-of-software-design",
    );
  });

  it("falls back to / for an unrecognised collection", () => {
    const odd = {
      ...SAMPLE_INDEX.entries[0],
      collection: "nope" as unknown as SearchEntry["collection"],
    };
    expect(hitHref(odd)).toBe("/");
  });
});

describe("findMatchRange", () => {
  it("returns null for empty needle", () => {
    expect(findMatchRange("Three-tier", "")).toBeNull();
  });

  it("returns null when the needle is absent", () => {
    expect(findMatchRange("Three-tier", "abc")).toBeNull();
  });

  it("returns a [start, end) tuple for a case-insensitive match", () => {
    // "tier" in "Three-tier" — lowercased, idx 6.
    expect(findMatchRange("Three-tier", "TIER")).toEqual([6, 10]);
  });

  it("returns 0-based start index when match is at the head", () => {
    expect(findMatchRange("KOMBIT VALG", "kom")).toEqual([0, 3]);
  });
});

describe("groupByCollection", () => {
  it("groups hits by collection, preserving global order within each group", () => {
    const grouped = groupByCollection([
      { ...SAMPLE_INDEX.entries[0], score: 5 },
      { ...SAMPLE_INDEX.entries[2], score: 4 },
      {
        ...SAMPLE_INDEX.entries[0],
        id: "writing/another",
        slug: "another",
        title: "Another writing",
        score: 3,
      },
    ]);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].collection).toBe("writing");
    expect(grouped[0].hits.map((h) => h.slug)).toEqual([
      "three-tier-thinking",
      "another",
    ]);
    expect(grouped[1].collection).toBe("recommends");
  });

  it("returns an empty list when given an empty hit list", () => {
    expect(groupByCollection([])).toEqual([]);
  });
});

describe("buildClientIndex + searchClient", () => {
  it("returns [] for an empty / whitespace-only query (no useless full scans)", () => {
    const index = buildClientIndex(SAMPLE_INDEX);
    expect(searchClient(index, "")).toEqual([]);
    expect(searchClient(index, "   ")).toEqual([]);
  });

  it("hydrates entries by id and finds them via title search", () => {
    const index = buildClientIndex(SAMPLE_INDEX);
    const hits = searchClient(index, "kombit");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].id).toBe("work/kombit");
    expect(hits[0].slug).toBe("kombit-valg");
  });

  it("ranks title matches above body-only matches (title weight is highest)", () => {
    const index = buildClientIndex({
      locale: "en",
      generatedAt: "2026-04-28T00:00:00Z",
      entries: [
        ...SAMPLE_INDEX.entries,
        {
          id: "writing/excerpt-only",
          collection: "writing",
          slug: "excerpt-only",
          locale: "en",
          title: "An unrelated post",
          tags: [],
          excerpt: "Mentions kombit deep in the body.",
        },
      ],
    });
    const hits = searchClient(index, "kombit");
    // The KOMBIT-titled doc must rank above the body-only mention.
    const top = hits[0];
    expect(top?.id).toBe("work/kombit");
  });

  it("hits include a numeric score field for downstream sorting", () => {
    const index = buildClientIndex(SAMPLE_INDEX);
    const hits = searchClient(index, "thinking");
    expect(hits[0]?.score).toBeTypeOf("number");
    expect(hits[0]?.score).toBeGreaterThan(0);
  });

  it("respects the limit parameter", () => {
    const many: SearchEntry[] = Array.from({ length: 30 }, (_, i) => ({
      id: `writing/m-${i}`,
      collection: "writing",
      slug: `m-${i}`,
      locale: "en",
      title: `match number ${i}`,
      tags: [],
      excerpt: "match",
    }));
    const index = buildClientIndex({
      locale: "en",
      generatedAt: "2026-04-28T00:00:00Z",
      entries: many,
    });
    const hits = searchClient(index, "match", 5);
    expect(hits.length).toBeLessThanOrEqual(5);
  });
});
