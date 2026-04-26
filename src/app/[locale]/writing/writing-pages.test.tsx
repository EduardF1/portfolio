/**
 * Smoke tests for the writing list page + slug page.
 *
 * These pages are React Server Components that read MDX files from the
 * real content/ directory via gray-matter. We mock next-intl + next-mdx-remote
 * just enough to render them out-of-band in jsdom, but use the actual
 * content files (no fs mocking) so the tests track real frontmatter.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => `tooltip:${key}`,
  setRequestLocale: () => {},
  getRequestConfig: () => () => ({}),
}));

// reading-feed makes a network call; we don't care about it for these tests.
vi.mock("@/components/reading-feed", () => ({
  ReadingFeed: () => null,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

// next-mdx-remote/rsc renders MDX in a server context; for jsdom tests we
// substitute it for a passthrough that just emits the body string in a <div>.
vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => (
    <div data-testid="mdx-body">{source}</div>
  ),
}));

// next/navigation notFound throws. The slug tests cover the throw path
// explicitly so we can keep the real implementation.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

afterEach(() => {
  cleanup();
});

import WritingPage from "./page";
import WritingItem, { generateMetadata, generateStaticParams } from "./[slug]/page";
import { getCollection } from "@/lib/content";

describe("WritingPage (list)", () => {
  it("renders the list with all writing posts and articles", async () => {
    const tree = await WritingPage({ searchParams: Promise.resolve({}) });
    render(tree);

    // Headings
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Notes from practice/i,
      }),
    ).toBeInTheDocument();

    // Posts section
    expect(screen.getByRole("heading", { level: 2, name: /^Posts/ })).toBeInTheDocument();
    // Articles section
    expect(
      screen.getByRole("heading", { level: 2, name: /^Articles/ }),
    ).toBeInTheDocument();

    // The two seeded articles should appear
    expect(
      screen.getByText(
        /Digitalization of waste collection: a theoretical study of feral systems/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Conceptualization of an audit management system/),
    ).toBeInTheDocument();
  });

  it("sorts each list newest-first by frontmatter date", async () => {
    const tree = await WritingPage({ searchParams: Promise.resolve({}) });
    const { container } = render(tree);

    const articlesSection = container.querySelectorAll("section")[2]!;
    const links = Array.from(articlesSection.querySelectorAll("h3")).map(
      (h) => h.textContent ?? "",
    );
    // The 2023 audit article is newer than the 2022 feral systems one,
    // so it should come first.
    expect(links[0]).toMatch(/audit management system/i);
    expect(links[1]).toMatch(/feral systems/i);
  });

  it("Posts/Articles counters use singular / plural correctly", async () => {
    const posts = await getCollection("writing");
    const articles = await getCollection("articles");
    const tree = await WritingPage({ searchParams: Promise.resolve({}) });
    render(tree);
    expect(
      screen.getByText(
        new RegExp(`${posts.length} ${posts.length === 1 ? "post" : "posts"}`),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(
          `${articles.length} ${articles.length === 1 ? "article" : "articles"}`,
        ),
      ),
    ).toBeInTheDocument();
  });
});

describe("WritingItem (slug page)", () => {
  it("renders an article: title, MDX body, back link", async () => {
    const tree = await WritingItem({
      params: Promise.resolve({
        locale: "en",
        slug: "digitalization-of-waste-collection-feral-systems",
      }),
    });
    render(tree);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Digitalization of waste collection/,
      }),
    ).toBeInTheDocument();
    // MDX body smoke
    expect(screen.getByTestId("mdx-body")).toBeInTheDocument();
    // Back link to the list
    expect(
      screen.getByRole("link", { name: /All writing/ }),
    ).toBeInTheDocument();
  });

  it("looks up articles when slug is in the articles collection", async () => {
    const tree = await WritingItem({
      params: Promise.resolve({
        locale: "en",
        slug: "digitalization-of-waste-collection-feral-systems",
      }),
    });
    render(tree);

    // The article frontmatter has a `publication` field
    expect(screen.getByText(/Aarhus University/)).toBeInTheDocument();
  });

  it("calls notFound() when the slug does not exist", async () => {
    await expect(
      WritingItem({
        params: Promise.resolve({ locale: "en", slug: "no-such-thing" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  describe("generateStaticParams", () => {
    it("returns one entry per writing + article slug", async () => {
      const params = await generateStaticParams();
      const slugs = params.map((p) => p.slug);
      expect(slugs).toContain("digitalization-of-waste-collection-feral-systems");
      expect(slugs).toContain("conceptualization-of-an-audit-management-system");
    });
  });

  describe("generateMetadata", () => {
    it("returns the frontmatter title for a known article", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({
          locale: "en",
          slug: "conceptualization-of-an-audit-management-system",
        }),
      });
      expect(meta.title).toMatch(/audit management system/i);
    });

    it('returns { title: "Not found" } when slug is unknown', async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ locale: "en", slug: "ghost" }),
      });
      expect(meta).toEqual({ title: "Not found" });
    });
  });
});
