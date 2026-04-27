import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ScrollDrivenBackground } from "./scroll-driven-bg";

afterEach(() => {
  cleanup();
});

describe("ScrollDrivenBackground", () => {
  it("renders a fixed decorative layer marked aria-hidden", () => {
    const { container } = render(<ScrollDrivenBackground />);
    const root = container.querySelector('[data-testid="scroll-driven-bg"]');
    expect(root).not.toBeNull();
    expect(root!.getAttribute("aria-hidden")).toBe("true");
    expect(root!.className).toMatch(/fixed/);
    // Inner gradient layer that the scroll-timeline animation targets
    expect(container.querySelector(".proto-scroll-bg-layer")).not.toBeNull();
  });
});
