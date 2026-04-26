import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: () => {},
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

import NowPage from "./page";

describe("NowPage", () => {
  it("renders the heading, last-updated marker, and the four sections", async () => {
    const tree = await NowPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(tree);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /What I.m focused on right now/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last updated · /)).toBeInTheDocument();
    for (const heading of ["Focus", "Reading", "Side bets", "Lately"]) {
      expect(
        screen.getByRole("heading", { level: 2, name: new RegExp(heading) }),
      ).toBeInTheDocument();
    }
  });
});
