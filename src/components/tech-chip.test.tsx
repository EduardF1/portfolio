import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../messages/en.json";
import daMessages from "../../messages/da.json";

type MockLinkHref =
  | string
  | { pathname: string; query?: Record<string, string>; hash?: string };

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: Omit<React.ComponentProps<"a">, "href"> & { href: MockLinkHref }) => {
    let resolved = "#";
    if (typeof href === "string") {
      resolved = href;
    } else if (href && typeof href === "object") {
      const params = href.query
        ? "?" + new URLSearchParams(href.query).toString()
        : "";
      const hash = href.hash ? `#${href.hash}` : "";
      resolved = `${href.pathname}${params}${hash}`;
    }
    return (
      <a href={resolved} {...rest}>
        {children}
      </a>
    );
  },
}));

// Stub out the JSON cache so the render tests do not depend on whatever
// `scripts/build-tech-demos.mjs` happens to have produced last.
vi.mock("@/lib/tech-demos", () => ({
  demosForLanguage: (lang: string | null | undefined) => {
    if (lang === "C#") {
      return [
        {
          name: "alpha-csharp",
          url: "https://github.com/EduardF1/alpha-csharp",
          description: "Alpha demo.",
        },
        {
          name: "beta-csharp",
          url: "https://github.com/EduardF1/beta-csharp",
          description: "Beta demo.",
        },
        {
          name: "gamma-csharp",
          url: "https://github.com/EduardF1/gamma-csharp",
          description: "Gamma demo.",
        },
      ];
    }
    return [];
  },
  allTechDemos: () => ({}),
}));

import { TechChip } from "./tech-chip";

function renderChip(slug: string, locale: "en" | "da" = "en") {
  const messages = locale === "en" ? enMessages : daMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <TechChip slug={slug} />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("<TechChip />", () => {
  it("renders nothing for an unknown slug", () => {
    const { container } = renderChip("definitely-not-a-tech");
    expect(container.firstChild).toBeNull();
  });

  it("renders the chip text linked to /work?tech=<slug>#technologies", () => {
    renderChip("csharp");
    const link = screen.getByRole("link", { name: "C#" });
    expect(link).toHaveAttribute(
      "href",
      "/work?tech=csharp#technologies",
    );
  });

  it("shows the demo badge when at least one demo repo matches the chip's ghLanguage", () => {
    renderChip("csharp");
    const badge = screen.getByTestId("tech-chip-demo-badge-csharp");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/demo/i);
  });

  it("lists the top 3 demo repos in the popover, each with target=_blank rel=noopener", () => {
    renderChip("csharp");
    const popover = screen.getByTestId("tech-chip-demo-popover-csharp");
    const anchors = popover.querySelectorAll("a");
    expect(anchors.length).toBe(3);
    const expected = [
      "https://github.com/EduardF1/alpha-csharp",
      "https://github.com/EduardF1/beta-csharp",
      "https://github.com/EduardF1/gamma-csharp",
    ];
    Array.from(anchors).forEach((a, i) => {
      expect(a.getAttribute("href")).toBe(expected[i]);
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    });
  });

  it("hides the demo badge when no demo repo matches (ghLanguage with no entries)", () => {
    // "Vue" has ghLanguage: null and no demos → badge must be absent.
    renderChip("vue");
    expect(screen.queryByTestId("tech-chip-demo-badge-vue")).toBeNull();
    expect(screen.queryByTestId("tech-chip-demo-popover-vue")).toBeNull();
    // The chip text link must still render.
    expect(
      screen.getByRole("link", { name: "Vue.js" }),
    ).toBeInTheDocument();
  });

  it("hides the demo badge when ghLanguage is mapped but the JSON has no entries", () => {
    // "Haskell" maps to ghLanguage Haskell — but our mock only returns demos
    // for C#. Confirms the hidden-when-empty branch.
    renderChip("haskell");
    expect(screen.queryByTestId("tech-chip-demo-badge-haskell")).toBeNull();
  });

  it("forwards data-tech-slug onto the chip text link", () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <TechChip slug="csharp" data-tech-slug="csharp" />
      </NextIntlClientProvider>,
    );
    // When demos exist, the data-tech-slug attribute is on the inner anchor.
    expect(screen.getByRole("link", { name: "C#" })).toHaveAttribute(
      "data-tech-slug",
      "csharp",
    );
  });

  // TODO(round-7): vitest.setup.ts global next-intl mock is locale-agnostic
  // (always returns enMessages); cannot validate DA strings without a
  // locale-aware mock pattern. Restore when that lands.
  it.skip("localises the demo badge label in Danish", () => {
    renderChip("csharp", "da");
    const badge = screen.getByTestId("tech-chip-demo-badge-csharp");
    expect(badge).toHaveTextContent(/demo/i);
    expect(badge).toHaveAttribute(
      "aria-label",
      "Vis demo-repositories for C#",
    );
  });
});
