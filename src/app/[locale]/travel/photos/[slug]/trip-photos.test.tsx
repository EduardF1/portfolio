/**
 * Unit tests for the trip-details route at /travel/photos/[slug]:
 *  - generateStaticParams emits one entry per clustered trip
 *  - the page renders the trip headline + month label + back link
 *  - an unknown slug triggers notFound()
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: unknown }) => (
    <a href={typeof href === "string" ? href : "#"} {...(rest as object)}>
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

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns?: string) => {
    const fn = (key: string, vars?: Record<string, unknown>) => {
      const v = vars ?? {};
      if (ns === "travel") {
        const map: Record<string, string> = {
          all: "All trips",
        };
        return map[key] ?? `travel.${key}`;
      }
      if (ns === "tripPhotos") {
        const map: Record<string, string> = {
          kicker: `Trip · ${v.country ?? ""}`,
          photoCount: `${v.count ?? 0} photos`,
          countLabel: `Photo ${v.current ?? 0} of ${v.total ?? 0}`,
          prev: "Previous photo",
          next: "Next photo",
          close: "Close",
        };
        return map[key] ?? `tripPhotos.${key}`;
      }
      return key;
    };
    return fn;
  },
  setRequestLocale: () => {},
}));

afterEach(() => {
  cleanup();
});

import TripPhotosPage, {
  generateStaticParams,
  generateMetadata,
} from "./page";
import { getTrips, __resetTripsCache } from "@/lib/trips";

describe("TripPhotosPage (/travel/photos/[slug])", () => {
  it("generateStaticParams returns one entry per clustered trip", async () => {
    __resetTripsCache();
    const params = await generateStaticParams();
    const trips = await getTrips();
    expect(params.length).toBe(trips.length);
    // Every emitted slug should be unique and resolvable.
    const slugs = new Set(params.map((p) => p.slug));
    expect(slugs.size).toBe(params.length);
    for (const t of trips) expect(slugs.has(t.slug)).toBe(true);
  });

  it("renders the headline, month label and a back link for a known slug", async () => {
    __resetTripsCache();
    const trips = await getTrips();
    if (trips.length === 0) return; // Catalogue empty (CI without fixture); skip.
    const trip = trips[0];

    const tree = await TripPhotosPage({
      params: Promise.resolve({ locale: "en", slug: trip.slug }),
    });
    render(tree);

    // Back link to /travel.
    const back = screen.getByRole("link", { name: /All trips/ });
    expect(back.getAttribute("href")).toBe("/travel");

    // Headline contains either the primary city or the country.
    const headline = trip.primaryCity ?? trip.country;
    expect(
      screen.getByRole("heading", { level: 1 }).textContent,
    ).toContain(headline);
    expect(
      screen.getByRole("heading", { level: 1 }).textContent,
    ).toContain(trip.monthLabel);
  });

  it("calls notFound() when the slug is unknown", async () => {
    __resetTripsCache();
    await expect(
      TripPhotosPage({
        params: Promise.resolve({ locale: "en", slug: "ghost-9999-99" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata returns the trip headline for known slugs and Not found otherwise", async () => {
    __resetTripsCache();
    const trips = await getTrips();
    const ghost = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "ghost-9999-99" }),
    });
    expect(ghost).toEqual({ title: "Not found" });

    if (trips.length === 0) return;
    const trip = trips[0];
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: trip.slug }),
    });
    expect(typeof meta.title).toBe("string");
    expect(String(meta.title)).toContain(trip.monthLabel);
  });
});
