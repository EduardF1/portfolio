"use client";

import { Document } from "flexsearch";
import type { Id } from "flexsearch";
import type { SearchEntry, SearchIndex } from "./build-index";

/**
 * Client-side search shim around FlexSearch.
 *
 * The build-time index ships a flat array of `SearchEntry` rows. We
 * hydrate a single `Document` index on first use, then route all queries
 * through it. Results are scored by FlexSearch's contextual scorer and
 * deduped across the multiple fields it indexes per entry.
 */

type DocIndex = Document<SearchEntry>;

export type ClientIndex = {
  /** All entries, indexed by id. Used to hydrate result rows. */
  byId: Map<string, SearchEntry>;
  /** FlexSearch document index. */
  flex: DocIndex;
};

export function buildClientIndex(payload: SearchIndex): ClientIndex {
  const flex: DocIndex = new Document({
    tokenize: "forward",
    cache: 100,
    document: {
      id: "id",
      index: ["title", "description", "tags", "excerpt"],
    },
  });
  const byId = new Map<string, SearchEntry>();
  for (const entry of payload.entries) {
    byId.set(entry.id, entry);
    flex.add(entry);
  }
  return { byId, flex };
}

export type SearchHit = SearchEntry & { score: number };

/**
 * Run a query against the client index. Empty / whitespace-only queries
 * return `[]` so the palette can fall back to a default state.
 */
export function searchClient(
  index: ClientIndex,
  rawQuery: string,
  limit = 30,
): SearchHit[] {
  const query = rawQuery.trim();
  if (query.length === 0) return [];

  // FlexSearch's document search returns one bucket per field. We merge,
  // then award a small per-field weight so a title hit outranks an
  // excerpt hit. Order within a bucket is FlexSearch's contextual
  // ranking, which we preserve as the secondary sort.
  const fieldWeights: Record<string, number> = {
    title: 4,
    description: 2,
    tags: 3,
    excerpt: 1,
  };
  const buckets = index.flex.search(query, { limit });

  const accum = new Map<string, { entry: SearchEntry; score: number }>();
  for (const bucket of buckets) {
    const weight = (bucket.field != null ? fieldWeights[bucket.field as string] : undefined) ?? 1;
    bucket.result.forEach((id: Id, position: number) => {
      const key = String(id);
      const entry = index.byId.get(key);
      if (!entry) return;
      // Descending position bonus: first hit in a bucket gets the most.
      const positionScore = bucket.result.length - position;
      const incoming = weight * positionScore;
      const existing = accum.get(key);
      if (!existing || existing.score < incoming) {
        accum.set(key, { entry, score: existing ? existing.score + incoming : incoming });
      } else {
        existing.score += incoming;
      }
    });
  }
  return Array.from(accum.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry, score }) => ({ ...entry, score }));
}

/**
 * Group hits by collection, preserving global order within each group.
 */
export function groupByCollection(
  hits: SearchHit[],
): Array<{ collection: SearchEntry["collection"]; hits: SearchHit[] }> {
  const order = new Map<SearchEntry["collection"], SearchHit[]>();
  for (const h of hits) {
    const list = order.get(h.collection) ?? [];
    list.push(h);
    order.set(h.collection, list);
  }
  return Array.from(order.entries()).map(([collection, hits]) => ({
    collection,
    hits,
  }));
}

/**
 * Build the route a hit links to for the given locale. EN is the
 * canonical (no prefix); DA gets `/da` because long-form MDX falls back
 * to EN anyway, so we still serve the EN page in the user's chosen path.
 */
export function hitHref(hit: SearchEntry): string {
  const { collection, slug } = hit;
  if (collection === "writing" || collection === "articles") {
    return `/writing/${slug}`;
  }
  if (collection === "work") return `/work/${slug}`;
  if (collection === "recommends") return `/recommends/${slug}`;
  return "/";
}

/**
 * Find the first match of `needle` inside `haystack`, case-insensitive,
 * and return the [start, end) indices. Returns `null` when no match.
 */
export function findMatchRange(
  haystack: string,
  needle: string,
): [number, number] | null {
  if (!needle) return null;
  const idx = haystack.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return null;
  return [idx, idx + needle.length];
}
