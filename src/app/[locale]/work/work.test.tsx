/**
 * Snapshot-style tests for the /work list page that assert the translated
 * heading appears for both `en` and `da` locales by mocking
 * getTranslations against the real messages files. Keeps the i18n wiring
 * honest: if a key is renamed without updating the page, this test fails.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import enMessages from "../../../../messages/en.json";
import daMessages from "../../../../messages/da.json";

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

vi.mock("@/lib/github", () => ({
  getRepos: async () => [],
  summarize: () => ({ total: 0, languages: [] }),
}));

// GithubStats is an async Server Component that fetches from api.github.com;
// jsdom can't resolve it, so we stub it out for the i18n smoke tests.
vi.mock("@/components/github-stats", () => ({
  GithubStats: () => null,
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
      // Minimal ICU stand-in: replace {placeholder}, plus the {x, plural, …}
      // forms used by the work namespace.
      return cursor.replace(/\{(\w+)(?:,\s*plural,([^}]+))?\}/g, (_match, name: string, plural?: string) => {
        const v = vars?.[name];
        if (plural !== undefined && typeof v === "number") {
          // Pull `one {…}` / `other {…}` arms.
          const oneArm = /one\s*\{([^}]*)\}/.exec(plural);
          const otherArm = /other\s*\{([^}]*)\}/.exec(plural);
          const text = (v === 1 ? oneArm?.[1] : otherArm?.[1]) ?? "";
          return text.replace(/#/g, String(v));
        }
        return v == null ? "" : String(v);
      });
    };
    (fn as unknown as { rich: typeof rich }).rich = rich;
    function rich(
      key: string,
      tags: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
    ) {
      const value = fn(key);
      const out: React.ReactNode[] = [value];
      for (const render of Object.values(tags)) {
        out.push(render(""));
      }
      return out;
    }
    return fn;
  },
  setRequestLocale: () => {},
}));

afterEach(() => {
  cleanup();
});

import WorkPage from "./page";

describe("WorkPage i18n", () => {
  it("renders the English heading and copy", async () => {
    localeMock.current = "en";
    render(await WorkPage({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("heading", { level: 1, name: /Selected case studies\./ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Pick a technology/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Read the case study/).length).toBeGreaterThan(0);
  });

  it("renders the Danish heading and copy", async () => {
    localeMock.current = "da";
    render(await WorkPage({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("heading", { level: 1, name: /Udvalgte casestudier\./ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Vælg en teknologi/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Læs casen/).length).toBeGreaterThan(0);
  });
});
