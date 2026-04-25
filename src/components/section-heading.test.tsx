import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeading } from "./section-heading";

describe("<SectionHeading />", () => {
  it("renders kicker, heading, and info button when tooltip is set", () => {
    render(
      <SectionHeading
        kicker="Experience"
        tooltip="A short preview of the section."
      >
        Three years across four companies.
      </SectionHeading>,
    );

    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Three years across four companies\./,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "What is Experience?" }),
    ).toBeInTheDocument();
  });

  it("does NOT render the info button when tooltip is undefined", () => {
    render(
      <SectionHeading kicker="Experience">
        Three years across four companies.
      </SectionHeading>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses the correct aria-label on the info button", () => {
    render(
      <SectionHeading kicker="Selected work" tooltip="Hand-picked case studies.">
        Things I&apos;ve helped build.
      </SectionHeading>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "What is Selected work?");
  });

  it("falls back to a generic aria-label when no kicker is provided", () => {
    render(
      <SectionHeading tooltip="Hand-picked case studies.">
        Things I&apos;ve helped build.
      </SectionHeading>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "What is this section?");
  });

  it("renders an h1 when level is h1", () => {
    render(
      <SectionHeading level="h1" tooltip="About the page.">
        Page title
      </SectionHeading>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /Page title/ }),
    ).toBeInTheDocument();
  });
});
