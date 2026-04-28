/**
 * Smoke test for the /privacy POC page.
 *
 * The page is a static (no params) Server Component holding a privacy
 * statement and a contact mailto. The test asserts the contract that
 * matters: the contact link is the user's published email, the page
 * exposes an h1 heading, and the analytics promise (no IPs, no third
 * parties) is on the rendered DOM.
 */

import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import PrivacyPage from "./page";

afterEach(() => {
  cleanup();
});

describe("PrivacyPage", () => {
  it("renders an H1 about how the site uses data", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /How this site uses data/ }),
    ).toBeInTheDocument();
  });

  it("links to the published mailto for follow-up questions", () => {
    render(<PrivacyPage />);
    const link = screen.getByRole("link", {
      name: /fischer_eduard@yahoo\.com/,
    });
    expect(link).toHaveAttribute("href", "mailto:fischer_eduard@yahoo.com");
  });

  it("states the analytics privacy promise (no IPs, no third-party trackers)", () => {
    const { container } = render(<PrivacyPage />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/No IP addresses/i);
    expect(text).toMatch(/No third-party trackers/i);
  });
});
