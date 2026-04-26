import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

import { SiteFooter } from "./site-footer";

afterEach(() => {
  cleanup();
});

describe("<SiteFooter />", () => {
  it("renders the GitHub, LinkedIn and Email social links", async () => {
    render(await SiteFooter());
    const gh = screen.getByLabelText("GitHub");
    expect(gh).toHaveAttribute("href", "https://github.com/EduardF1");
    expect(gh).toHaveAttribute("target", "_blank");
    expect(gh).toHaveAttribute("rel", "noopener noreferrer");

    const li = screen.getByLabelText("LinkedIn");
    expect(li).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/eduard-fischer-szava/",
    );

    const mail = screen.getByLabelText("Email");
    expect(mail).toHaveAttribute("href", "mailto:fischer_eduard@yahoo.com");
    // mailto: is not http → no target
    expect(mail).not.toHaveAttribute("target");
  });

  it("shows the current year in the copyright line", async () => {
    render(await SiteFooter());
    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${year} Eduard Fischer-Szava`)),
    ).toBeInTheDocument();
  });
});
