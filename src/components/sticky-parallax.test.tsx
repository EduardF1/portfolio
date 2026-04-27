import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import {
  StickyParallaxStack,
  StickyParallaxItem,
} from "./sticky-parallax";

afterEach(() => {
  cleanup();
});

describe("StickyParallaxStack / Item", () => {
  it("Stack renders children inside a marked container", () => {
    const { container } = render(
      <StickyParallaxStack>
        <p>hello</p>
      </StickyParallaxStack>,
    );
    const stack = container.querySelector(
      '[data-testid="sticky-parallax-stack"]',
    );
    expect(stack).not.toBeNull();
    expect(stack!.textContent).toBe("hello");
    expect(stack!.className).toMatch(/proto-sticky-stack/);
  });

  it("Item gets sticky class + an inline top offset that staggers per index", () => {
    const { container } = render(
      <>
        <StickyParallaxItem index={0}>
          <span>a</span>
        </StickyParallaxItem>
        <StickyParallaxItem index={1}>
          <span>b</span>
        </StickyParallaxItem>
        <StickyParallaxItem index={4}>
          <span>c</span>
        </StickyParallaxItem>
      </>,
    );
    const items = container.querySelectorAll(
      '[data-testid="sticky-parallax-item"]',
    );
    expect(items.length).toBe(3);
    items.forEach((el) => {
      expect(el.className).toMatch(/sticky/);
      expect(el.className).toMatch(/proto-sticky-item/);
    });
    expect((items[0] as HTMLElement).style.top).toBe("64px");
    expect((items[1] as HTMLElement).style.top).toBe("72px");
    // index 4 mod 4 = 0 → back to 64px
    expect((items[2] as HTMLElement).style.top).toBe("64px");
  });
});
