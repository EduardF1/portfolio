import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const map: Record<string, string> = {
      kicker: "404 · Not found",
      heading: "That page is not where it used to be.",
      lead: "The link may be stale, the slug may have changed, or it may never have existed in the first place. Try one of these instead:",
      stuck: "Still stuck?",
      "links.home": "Home",
      "links.work": "Selected work",
      "links.writing": "Posts and articles",
      "links.travel": "Travel",
      "links.personal": "Personal",
      "links.contact": "Contact",
    };
    const fn = (key: string) => map[key] ?? key;
    (fn as unknown as { rich: typeof rich }).rich = rich;
    function rich(
      key: string,
      tags: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
    ) {
      const out: React.ReactNode[] = [map[key] ?? key];
      for (const render of Object.values(tags)) {
        out.push(render("Drop me a line"));
      }
      return out;
    }
    return fn;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

import NotFound from "./not-found";

afterEach(() => {
  cleanup();
});

describe("NotFound", () => {
  it("renders the 404 heading and a suggested-routes grid", async () => {
    render(await NotFound());
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /That page is not where it used to be/,
      }),
    ).toBeInTheDocument();
    // Suggested routes
    expect(screen.getByText("Selected work")).toBeInTheDocument();
    expect(screen.getByText("Posts and articles")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    // /recommends was dropped from the suggestion grid (kept the count at
    // 6 so the 2-col layout has no half-empty trailing row).
    expect(screen.queryByText("Recommendations")).not.toBeInTheDocument();
    // Drop-me-a-line CTA links to /contact
    expect(
      screen.getByRole("link", { name: /Drop me a line/ }),
    ).toHaveAttribute("href", "/contact");
  });
});
