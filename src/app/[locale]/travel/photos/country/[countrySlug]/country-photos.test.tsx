/**
 * Smoke tests for the per-country aggregated photo page at
 * /travel/photos/country/[countrySlug].
 *
 * Mocks `getPhotosByCountry` / `getAllCountrySlugs` from @/lib/trips
 * and `getCitiesByCountry` from @/lib/travel-locations against known
 * fixtures, then asserts the page renders the heading, photo count,
 * and city sections correctly.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import enMessages from "../../../../../../../messages/en.json";

vi.mock("server-only", () => ({}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: React.ComponentProps<"a"> & { href: unknown }) => (
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

const BELGIUM_GROUP = {
  country: "Belgium",
  countrySlug: "belgium",
  photoCount: 15,
  cities: [
    {
      city: "Brussels",
      photos: Array.from({ length: 6 }, (_, i) => ({
        filename: `brussels-${i}.jpg`,
        src: `/photos/brussels-${i}.jpg`,
        alt: `Brussels, Belgium`,
        takenAt: `2024-04-${String(i + 10).padStart(2, "0")}T10:00:00Z`,
        city: "Brussels",
        country: "Belgium",
        lat: 50.85,
        lon: 4.35,
      })),
    },
    {
      city: "Ghent",
      photos: Array.from({ length: 5 }, (_, i) => ({
        filename: `ghent-${i}.jpg`,
        src: `/photos/ghent-${i}.jpg`,
        alt: `Ghent, Belgium`,
        takenAt: `2024-04-${String(i + 12).padStart(2, "0")}T10:00:00Z`,
        city: "Ghent",
        country: "Belgium",
        lat: 51.05,
        lon: 3.72,
      })),
    },
    {
      city: "Bruges",
      photos: Array.from({ length: 4 }, (_, i) => ({
        filename: `bruges-${i}.jpg`,
        src: `/photos/bruges-${i}.jpg`,
        alt: `Bruges, Belgium`,
        takenAt: `2024-04-${String(i + 14).padStart(2, "0")}T10:00:00Z`,
        city: "Bruges",
        country: "Belgium",
        lat: 51.21,
        lon: 3.22,
      })),
    },
  ],
};

vi.mock("@/lib/trips", () => ({
  getPhotosByCountry: async (slug: string) =>
    slug === "belgium" ? BELGIUM_GROUP : null,
  getAllCountrySlugs: async () => ["belgium"],
}));

vi.mock("@/lib/travel-locations", () => ({
  getCitiesByCountry: async () => [
    {
      country: "Belgium",
      slug: "belgium",
      cities: [
        { name: "Brussels", photoCount: 6, primaryTripSlug: "belgium-2024-04" },
        { name: "Ghent", photoCount: 5, primaryTripSlug: "belgium-2024-04" },
        { name: "Bruges", photoCount: 4, primaryTripSlug: "belgium-2024-04" },
      ],
      photoCount: 15,
      primaryTripSlug: "belgium-2024-04",
    },
  ],
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns?: string) => {
    type Bag = Record<string, unknown>;
    const bag = enMessages as Bag;
    const root = (ns ? (bag[ns] as Bag) : bag) ?? {};
    const fn = (key: string, vars?: Record<string, unknown>) => {
      const segments = key.split(".");
      let cursor: unknown = root;
      for (const seg of segments) {
        if (cursor && typeof cursor === "object" && seg in cursor) {
          cursor = (cursor as Bag)[seg];
        } else {
          cursor = undefined;
          break;
        }
      }
      if (typeof cursor !== "string") return key;
      // Two-pass: ICU plurals first, then simple {var} substitutions.
      const out = (cursor as string)
        .replace(
          /\{(\w+),\s*plural,\s*((?:[^{}]|\{[^{}]*\})*)\}/g,
          (_match, name: string, plural: string) => {
            const v = vars?.[name];
            if (typeof v === "number") {
              const oneArm = /one\s*\{([^}]*)\}/.exec(plural);
              const otherArm = /other\s*\{([^}]*)\}/.exec(plural);
              const text = (v === 1 ? oneArm?.[1] : otherArm?.[1]) ?? "";
              return text.replace(/#/g, String(v));
            }
            return "";
          },
        )
        .replace(/\{(\w+)\}/g, (_m, name: string) => {
          const v = vars?.[name];
          return v == null ? "" : String(v);
        });
      return out;
    };
    return fn;
  },
  setRequestLocale: () => {},
}));

afterEach(() => {
  cleanup();
});

import CountryPhotosPage from "./page";

describe("CountryPhotosPage", () => {
  it("renders the country heading and photo count", async () => {
    render(
      await CountryPhotosPage({
        params: Promise.resolve({ locale: "en", countrySlug: "belgium" }),
      }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Belgium" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/15 photos/)).toBeInTheDocument();
  });

  it("renders city sections for Brussels, Ghent, and Bruges", async () => {
    render(
      await CountryPhotosPage({
        params: Promise.resolve({ locale: "en", countrySlug: "belgium" }),
      }),
    );
    const sections = screen.getAllByTestId("city-section");
    const cities = sections.map((s) => s.getAttribute("data-city"));
    expect(cities).toContain("Brussels");
    expect(cities).toContain("Ghent");
    expect(cities).toContain("Bruges");
  });

  it("shows all photos across city sections (15 total)", async () => {
    render(
      await CountryPhotosPage({
        params: Promise.resolve({ locale: "en", countrySlug: "belgium" }),
      }),
    );
    const thumbs = screen.getAllByTestId("lightbox-thumb");
    expect(thumbs.length).toBe(BELGIUM_GROUP.photoCount);
  });

  it("returns 404 for an unknown country slug", async () => {
    // notFound() throws an error in tests; we catch it.
    await expect(
      CountryPhotosPage({
        params: Promise.resolve({ locale: "en", countrySlug: "atlantis" }),
      }),
    ).rejects.toThrow();
  });

  it("city sections render in country-card order (Brussels → Ghent → Bruges)", async () => {
    render(
      await CountryPhotosPage({
        params: Promise.resolve({ locale: "en", countrySlug: "belgium" }),
      }),
    );
    const sections = screen.getAllByTestId("city-section");
    expect(sections.map((s) => s.getAttribute("data-city"))).toEqual([
      "Brussels",
      "Ghent",
      "Bruges",
    ]);
  });
});
