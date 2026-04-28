/**
 * Smoke test for the per-trip photo page. Mocks the trips library + the
 * lightbox + next-intl translation lookup against the real messages
 * files, then renders the page for one known trip slug and asserts the
 * heading, date range, intro line, and a thumbnail show up.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import enMessages from "../../../../../../messages/en.json";
import daMessages from "../../../../../../messages/da.json";

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

const ITALY_TRIP = {
  slug: "italy-2024-04",
  country: "Italy",
  countrySlug: "italy",
  year: 2024,
  monthLabel: "April 2024",
  dateRange: "12–18 April 2024",
  photoCount: 2,
  primaryCity: "Rome",
  startsAt: "2024-04-12T10:00:00Z",
  endsAt: "2024-04-18T10:00:00Z",
  isCluster: true,
  photos: [
    {
      filename: "rome-1.jpg",
      src: "/photos/rome-1.jpg",
      alt: "Rome, Italy",
      takenAt: "2024-04-12T10:00:00Z",
      city: "Rome",
      country: "Italy",
      lat: 41.9,
      lon: 12.5,
    },
    {
      filename: "rome-2.jpg",
      src: "/photos/rome-2.jpg",
      alt: "Rome, Italy",
      takenAt: "2024-04-18T10:00:00Z",
      city: "Rome",
      country: "Italy",
      lat: 41.9,
      lon: 12.5,
    },
  ],
};

vi.mock("@/lib/trips", () => ({
  getTrips: async () => [ITALY_TRIP],
  getTrip: async (slug: string) => (slug === ITALY_TRIP.slug ? ITALY_TRIP : null),
}));

const localeMock = { current: "en" as "en" | "da" };

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns?: string) => {
    type Bag = Record<string, unknown>;
    const bag = (localeMock.current === "en" ? enMessages : daMessages) as Bag;
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
      return cursor.replace(
        /\{(\w+)(?:,\s*plural,([^}]+))?\}/g,
        (_match, name: string, plural?: string) => {
          const v = vars?.[name];
          if (plural !== undefined && typeof v === "number") {
            const oneArm = /one\s*\{([^}]*)\}/.exec(plural);
            const otherArm = /other\s*\{([^}]*)\}/.exec(plural);
            const text = (v === 1 ? oneArm?.[1] : otherArm?.[1]) ?? "";
            return text.replace(/#/g, String(v));
          }
          return v == null ? "" : String(v);
        },
      );
    };
    return fn;
  },
  setRequestLocale: () => {},
}));

afterEach(() => {
  cleanup();
});

import TripPhotosPage from "./page";

describe("TripPhotosPage smoke", () => {
  it("renders the heading, date range, intro line, and a thumbnail in English", async () => {
    localeMock.current = "en";
    render(
      await TripPhotosPage({
        params: Promise.resolve({ locale: "en", slug: ITALY_TRIP.slug }),
      }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /Rome, April 2024/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/12–18 April 2024/)).toBeInTheDocument();
    // i18n intro line interpolates country + month.
    expect(
      screen.getByText(/stretch through Italy in April 2024/),
    ).toBeInTheDocument();
    // Lightbox renders a thumbnail per photo (one button each).
    const thumbs = screen.getAllByTestId("lightbox-thumb");
    expect(thumbs.length).toBe(ITALY_TRIP.photoCount);
  });

  it("renders the Danish intro line for the same trip", async () => {
    localeMock.current = "da";
    render(
      await TripPhotosPage({
        params: Promise.resolve({ locale: "da", slug: ITALY_TRIP.slug }),
      }),
    );
    expect(
      screen.getByText(/Billeder fra en tur gennem Italy i April 2024/),
    ).toBeInTheDocument();
  });
});
