import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SectionHeading } from "./section-heading";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "A short preview of the section.",
    );
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

  it("merges a custom headingClassName onto the heading", () => {
    render(
      <SectionHeading
        kicker="X"
        headingClassName="custom-class"
        tooltip="t"
      >
        H
      </SectionHeading>,
    );
    const heading = screen.getByRole("heading", { name: /H/ });
    expect(heading.className).toContain("custom-class");
    expect(heading.className).toContain("mt-4");
  });

  it("omits the heading className entirely when no kicker and no headingClassName", () => {
    render(<SectionHeading>Bare</SectionHeading>);
    const heading = screen.getByRole("heading", { name: /Bare/ });
    expect(heading.getAttribute("class")).toBeNull();
  });

  it("forwards the id prop to the heading element", () => {
    render(
      <SectionHeading id="experience" kicker="Experience">
        Heading
      </SectionHeading>,
    );
    const heading = screen.getByRole("heading", { name: /Heading/ });
    expect(heading).toHaveAttribute("id", "experience");
  });

  it("shifts tooltip to the right when its left edge would clip the viewport", () => {
    // Stub getBoundingClientRect to simulate the tooltip clipping the left edge
    const proto = HTMLElement.prototype;
    const orig = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function () {
      return {
        x: -50,
        y: 0,
        left: -50,
        right: 250,
        top: 0,
        bottom: 30,
        width: 300,
        height: 30,
        toJSON() {
          return {};
        },
      } as DOMRect;
    };
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1000 });

    try {
      render(
        <SectionHeading kicker="X" tooltip="A clipped tooltip">
          Title
        </SectionHeading>,
      );
      // The wrapping group <span> hosts the hover/focus listeners
      const tooltip = screen.getByRole("tooltip");
      const wrapper = tooltip.parentElement!;
      fireEvent.mouseEnter(wrapper);
      // After hover, edgeOffset should be 8 - (-50) = 58
      const style = tooltip.getAttribute("style") || "";
      expect(style).toMatch(/--tt-dx:\s*58px/);
    } finally {
      proto.getBoundingClientRect = orig;
    }
  });

  it("shifts tooltip to the left when its right edge would clip the viewport", () => {
    const proto = HTMLElement.prototype;
    const orig = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function () {
      return {
        x: 800,
        y: 0,
        left: 800,
        right: 1100,
        top: 0,
        bottom: 30,
        width: 300,
        height: 30,
        toJSON() {
          return {};
        },
      } as DOMRect;
    };
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1000 });

    try {
      render(
        <SectionHeading kicker="X" tooltip="Right-clipped tooltip">
          Title
        </SectionHeading>,
      );
      const tooltip = screen.getByRole("tooltip");
      const wrapper = tooltip.parentElement!;
      fireEvent.focus(wrapper);
      // edgeOffset = 1000 - 8 - 1100 = -108
      const style = tooltip.getAttribute("style") || "";
      expect(style).toMatch(/--tt-dx:\s*-108px/);
    } finally {
      proto.getBoundingClientRect = orig;
    }
  });

  it("does not shift the tooltip when it fits comfortably in the viewport", () => {
    const proto = HTMLElement.prototype;
    const orig = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function () {
      return {
        x: 200,
        y: 0,
        left: 200,
        right: 500,
        top: 0,
        bottom: 30,
        width: 300,
        height: 30,
        toJSON() {
          return {};
        },
      } as DOMRect;
    };
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1000 });

    try {
      render(
        <SectionHeading kicker="X" tooltip="Fits cleanly">
          Title
        </SectionHeading>,
      );
      const tooltip = screen.getByRole("tooltip");
      const wrapper = tooltip.parentElement!;
      fireEvent.mouseEnter(wrapper);
      const style = tooltip.getAttribute("style") || "";
      expect(style).toMatch(/--tt-dx:\s*0px/);
    } finally {
      proto.getBoundingClientRect = orig;
    }
  });

  it("recomputes edge offset on window resize", () => {
    const proto = HTMLElement.prototype;
    const orig = proto.getBoundingClientRect;
    let leftRight: [number, number] = [200, 500];
    proto.getBoundingClientRect = function () {
      const [l, r] = leftRight;
      return {
        x: l,
        y: 0,
        left: l,
        right: r,
        top: 0,
        bottom: 30,
        width: r - l,
        height: 30,
        toJSON() {
          return {};
        },
      } as DOMRect;
    };
    Object.defineProperty(window, "innerWidth", { writable: true, value: 1000 });

    try {
      render(
        <SectionHeading kicker="X" tooltip="Will reflow on resize">
          Title
        </SectionHeading>,
      );
      const tooltip = screen.getByRole("tooltip");
      // Move the tooltip to clip the right edge, then fire a resize.
      leftRight = [800, 1100];
      fireEvent(window, new Event("resize"));
      const style = tooltip.getAttribute("style") || "";
      expect(style).toMatch(/--tt-dx:\s*-108px/);
    } finally {
      proto.getBoundingClientRect = orig;
    }
  });

  it("does not attach a resize listener when no tooltip is present", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    render(<SectionHeading kicker="No tooltip">Title</SectionHeading>);
    const resizeCalls = addSpy.mock.calls.filter((c) => c[0] === "resize");
    expect(resizeCalls.length).toBe(0);
  });

  it("renders the tooltip icon outside the heading element so its accessible name is just the section text", () => {
    render(
      <SectionHeading kicker="Selected work" tooltip="Hand-picked.">
        Things I&apos;ve helped build.
      </SectionHeading>,
    );
    const heading = screen.getByRole("heading", { level: 2 });
    // The heading's accessible name should not include the info button —
    // the icon now sits in the upper-right of the heading row, not
    // inline inside the heading.
    expect(heading.textContent).toBe("Things I've helped build.");
    // But the info button is still in the surrounding region.
    expect(
      screen.getByRole("button", { name: /What is Selected work/ }),
    ).toBeInTheDocument();
  });

  it("places the tooltip wrapper to the right of the heading via justify-between", () => {
    render(
      <SectionHeading kicker="X" tooltip="t">
        Heading
      </SectionHeading>,
    );
    const heading = screen.getByRole("heading", { level: 2 });
    const headingRow = heading.parentElement!;
    // The heading row is the flex container
    expect(headingRow.className).toContain("flex");
    expect(headingRow.className).toContain("justify-between");
  });
});
