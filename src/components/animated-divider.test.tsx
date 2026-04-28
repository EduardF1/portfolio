import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, act } from "@testing-library/react";
import { AnimatedDivider } from "./animated-divider";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AnimatedDivider", () => {
  it("renders with data-visible='false' before any intersection", () => {
    // Provide a no-op IntersectionObserver so the effect doesn't throw
    // and we can observe the pre-intersection state.
    class NoopIO {
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds: ReadonlyArray<number> = [];
    }
    vi.stubGlobal("IntersectionObserver", NoopIO);

    const { container } = render(<AnimatedDivider />);
    const divider = container.querySelector('[data-testid="animated-divider"]');
    expect(divider).not.toBeNull();
    expect(divider!.getAttribute("data-visible")).toBe("false");
    // Carries the gradient base layer + SVG sweep
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("flips data-visible='true' once the divider intersects the viewport", () => {
    type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
    let captured: IOCallback | null = null;
    class FakeIO {
      constructor(cb: IOCallback) {
        captured = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds: ReadonlyArray<number> = [];
    }
    vi.stubGlobal("IntersectionObserver", FakeIO);

    const { container } = render(<AnimatedDivider />);
    expect(captured).not.toBeNull();
    act(() => {
      captured!([{ isIntersecting: true }]);
    });
    const divider = container.querySelector('[data-testid="animated-divider"]');
    expect(divider!.getAttribute("data-visible")).toBe("true");
  });

  it("falls back to visible immediately when IntersectionObserver is unavailable", () => {
    // jsdom does not ship IntersectionObserver by default; we delete it
    // explicitly so the SSR-safety branch runs.
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<AnimatedDivider />);
    const divider = container.querySelector('[data-testid="animated-divider"]');
    expect(divider!.getAttribute("data-visible")).toBe("true");
  });
});
