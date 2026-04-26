/**
 * Smoke tests for the collection list + slug pages: recommends, work, travel,
 * travel/culinary. They're React Server Components that read MDX from the
 * real content/ directory; we mock next-intl + next-mdx-remote + i18n nav
 * + server-only just enough to render them in jsdom.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns?: string) => {
    const fn = (key: string, vars?: Record<string, unknown>) => {
      const v = vars ?? {};
      if (ns === "travel") {
        const map: Record<string, string> = {
          kicker: "Travel",
          heading: "Notes from the road.",
          description: "Trips and the places they took me.",
          all: "All travel",
          tripCount: `${v.count ?? 1} trip`,
          noTrips: "No trips published yet.",
          recentTripsKicker: "Recent trips",
          recentTripsHeading: "Latest from the road",
          byCountry: "By country",
          photoCount: `${v.count ?? 0} photos`,
          cityCount: `${v.count ?? 0} cities`,
          culinaryCrossLink: "See the culinary side of these trips",
          viewTrips: "View trips",
        };
        return map[key] ?? `travel.${key}`;
      }
      if (ns === "work") {
        const map: Record<string, string> = {
          kicker: "Work",
          heading: "Selected case studies.",
          description: "Case studies of business-critical systems.",
          selected: "Selected",
          casesOf: `${v.visible ?? 0} of ${v.total ?? 0} case studies`,
          filterAria: "Filter case studies by stack",
          all: "All",
          readCaseStudy: "Read the case study",
          technologiesKicker: "Technologies",
          pickATechnology: "Pick a technology",
          officialDocs: "Official docs",
          clearFilter: "Clear filter",
          openSourceHeading: "Public repositories",
          openSourceLead: `${v.count ?? 0} repos, ${v.years ?? 0}+ years.`,
          feedUnavailable: "GitHub feed unavailable, try refreshing in a moment.",
          "blurbs.kombit-valg": "KOMBIT VALG blurb",
          "blurbs.sitaware": "SitaWare blurb",
          "blurbs.greenbyte-saas": "Greenbyte blurb",
          "blurbs.boozt": "Boozt blurb",
        };
        return map[key] ?? `work.${key}`;
      }
      if (ns === "culinary") {
        const map: Record<string, string> = {
          kicker: "Culinary",
          heading: "Notes from the table.",
          description: "Dishes that earned the trip.",
          dishesHeading: "Dishes",
          dishCount: `${v.count ?? 0} dishes`,
          noDishes: "No dishes published yet.",
        };
        return map[key] ?? `culinary.${key}`;
      }
      if (ns === "recommends") {
        const map: Record<string, string> = {
          kicker: "Recommends",
          heading: "Tools, books, and products I trust.",
          description:
            "A short, considered list of products, tools, and books I return to.",
          noItems: "No recommendations yet.",
          reviewed: `Reviewed ${v.date ?? ""}`,
        };
        return map[key] ?? `recommends.${key}`;
      }
      if (ns === "tooltips") return `tooltip:${key}`;
      return key;
    };
    (fn as unknown as { rich: typeof rich }).rich = rich;
    function rich(
      key: string,
      tags: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
    ) {
      return [fn(key), ...Object.values(tags).map((render) => render(""))];
    }
    return fn;
  },
  setRequestLocale: () => {},
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: unknown }) => (
    <a href={typeof href === "string" ? href : "#"} {...(rest as object)}>
      {children}
    </a>
  ),
}));

vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => (
    <div data-testid="mdx-body">{source}</div>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("react-simple-maps", () => ({
  ComposableMap: ({ children }: React.PropsWithChildren) => <svg>{children}</svg>,
  Geographies: ({ children }: { children: (props: { geographies: unknown[] }) => React.ReactNode }) =>
    children({ geographies: [] }),
  Geography: () => null,
  Marker: ({ children }: React.PropsWithChildren) => <g>{children}</g>,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// getRepos hits the live GitHub API in real use; for tests we return [] so the
// WorkPage falls into its "GitHub feed unavailable" branch without a network call.
vi.mock("@/lib/github", () => ({
  getRepos: async () => [],
  summarize: () => ({ total: 0, languages: [] }),
}));

// GithubStats is an async Server Component that fetches the GitHub /users
// API. In jsdom + the WorkPage's eagerly-rendered tree it can't be async
// (Test renders treat it as a client component), so we mock the component
// itself with a synchronous stub.
vi.mock("@/components/github-stats", () => ({
  GithubStats: () => <div data-testid="github-stats-stub" />,
}));

afterEach(() => {
  cleanup();
});

import RecommendsPage from "./recommends/page";
import RecommendItem, {
  generateMetadata as recommendsMeta,
  generateStaticParams as recommendsParams,
} from "./recommends/[slug]/page";
import WorkPage from "./work/page";
import WorkItem, {
  generateMetadata as workMeta,
  generateStaticParams as workParams,
} from "./work/[slug]/page";
import TravelPage from "./travel/page";
import TravelItem, {
  generateMetadata as travelMeta,
} from "./travel/[slug]/page";
import CulinaryPage from "./travel/culinary/page";

describe("RecommendsPage list", () => {
  it("renders the collection grid + h1", async () => {
    const tree = await RecommendsPage();
    render(tree);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Tools, books, and products I trust/,
      }),
    ).toBeInTheDocument();
  });
});

describe("RecommendItem slug page", () => {
  it("renders an existing recommendation by slug", async () => {
    const params = await recommendsParams();
    const slug = params[0]!.slug;
    const tree = await RecommendItem({
      params: Promise.resolve({ locale: "en", slug }),
    });
    render(tree);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("mdx-body")).toBeInTheDocument();
  });

  it("calls notFound when the slug is unknown", async () => {
    await expect(
      RecommendItem({
        params: Promise.resolve({ locale: "en", slug: "ghost" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata returns title for known slug, Not found for unknown", async () => {
    const params = await recommendsParams();
    const slug = params[0]!.slug;
    const meta = await recommendsMeta({
      params: Promise.resolve({ locale: "en", slug }),
    });
    expect(typeof meta.title).toBe("string");
    const ghost = await recommendsMeta({
      params: Promise.resolve({ locale: "en", slug: "ghost" }),
    });
    expect(ghost).toEqual({ title: "Not found" });
  });
});

describe("WorkPage list", () => {
  it("renders the four selected case study cards", async () => {
    const tree = await WorkPage({ searchParams: Promise.resolve({}) });
    render(tree);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Selected case studies/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("KOMBIT VALG")).toBeInTheDocument();
    expect(screen.getByText("SitaWare Frontline & Edge")).toBeInTheDocument();
    expect(screen.getByText("Greenbyte SaaS + Mobile")).toBeInTheDocument();
    expect(screen.getByText("Boozt e-commerce backend")).toBeInTheDocument();
  });

  it("when ?tech=… resolves to a known tech, the chip + description render", async () => {
    const tree = await WorkPage({
      searchParams: Promise.resolve({ tech: "react" }),
    });
    render(tree);
    expect(screen.getByText(/Clear filter/)).toBeInTheDocument();
  });

  it("renders the placeholder text when no tech is selected", async () => {
    const tree = await WorkPage({ searchParams: Promise.resolve({}) });
    render(tree);
    expect(
      screen.getByRole("heading", { level: 2, name: /Pick a technology/ }),
    ).toBeInTheDocument();
  });
});

describe("WorkItem slug page", () => {
  it("renders an existing case study and pulls company kicker into header", async () => {
    const params = await workParams();
    const slug = params[0]!.slug;
    const tree = await WorkItem({
      params: Promise.resolve({ locale: "en", slug }),
    });
    render(tree);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("mdx-body")).toBeInTheDocument();
  });

  it("calls notFound when slug is unknown", async () => {
    await expect(
      WorkItem({
        params: Promise.resolve({ locale: "en", slug: "ghost" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata returns title for known slug, Not found otherwise", async () => {
    const params = await workParams();
    const slug = params[0]!.slug;
    const meta = await workMeta({
      params: Promise.resolve({ locale: "en", slug }),
    });
    expect(typeof meta.title).toBe("string");
    const ghost = await workMeta({
      params: Promise.resolve({ locale: "en", slug: "ghost" }),
    });
    expect(ghost).toEqual({ title: "Not found" });
  });
});

describe("TravelPage list", () => {
  it("renders the heading and the culinary cross-link", async () => {
    const tree = await TravelPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(tree);
    expect(
      screen.getByRole("heading", { level: 1, name: /Notes from the road/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/See the culinary side/)).toBeInTheDocument();
  });
});

describe("TravelItem slug page", () => {
  it("calls notFound when slug is unknown", async () => {
    await expect(
      TravelItem({
        params: Promise.resolve({ locale: "en", slug: "ghost" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata returns Not found for unknown slug", async () => {
    const ghost = await travelMeta({
      params: Promise.resolve({ locale: "en", slug: "ghost" }),
    });
    expect(ghost).toEqual({ title: "Not found" });
  });
});

describe("CulinaryPage list", () => {
  it("renders the dish grid and dish count", async () => {
    const tree = await CulinaryPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(tree);
    expect(
      screen.getByRole("heading", { level: 1, name: /Notes from the table/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/0 dishes/)).toBeInTheDocument();
  });
});
