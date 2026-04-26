import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: () => {},
  getTranslations: async () => (key: string, vars?: Record<string, unknown>) => {
    const v = vars ?? {};
    const map: Record<string, string> = {
      kicker: "Now",
      heading: "What I'm focused on right now.",
      description:
        "A snapshot of what has my attention: work, study, side bets, reading. Updated every month or two.",
      whatIsNow: "What is a /now page?",
      lastUpdated: `Last updated · ${v.date ?? ""}`,
      navIntro: "Now",
      navFocus: "Focus",
      navReading: "Reading",
      navSideBets: "Side bets",
      navLately: "Lately",
      focus: "Focus",
      reading: "Reading",
      sideBets: "Side bets",
      lately: "Lately",
    };
    return map[key] ?? key;
  },
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
