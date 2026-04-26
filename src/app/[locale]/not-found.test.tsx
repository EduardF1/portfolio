import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

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
  it("renders the 404 heading and a suggested-routes grid", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /That page is not where it used to be/,
      }),
    ).toBeInTheDocument();
    // Suggested routes
    expect(screen.getByText("Selected work")).toBeInTheDocument();
    expect(screen.getByText("Posts and articles")).toBeInTheDocument();
    expect(screen.getByText("Recommendations")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    // Drop-me-a-line CTA links to /contact
    expect(
      screen.getByRole("link", { name: /Drop me a line/ }),
    ).toHaveAttribute("href", "/contact");
  });
});
