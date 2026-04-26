import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SectionNav } from "./section-nav";

type IOEntry = {
  target: Element;
  isIntersecting: boolean;
  intersectionRatio: number;
};

let observerCallback: ((entries: IOEntry[]) => void) | null = null;
let observed: Element[] = [];
let disconnected = false;

class MockIntersectionObserver {
  constructor(cb: (entries: IOEntry[]) => void) {
    observerCallback = cb;
  }
  observe(el: Element) {
    observed.push(el);
  }
  disconnect() {
    disconnected = true;
  }
  unobserve() {}
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  observerCallback = null;
  observed = [];
  disconnected = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
];

function renderWithSections() {
  // Mount real DOM nodes for each section so getElementById works.
  for (const s of SECTIONS) {
    const el = document.createElement("section");
    el.id = s.id;
    document.body.appendChild(el);
  }
  return render(<SectionNav sections={SECTIONS} />);
}

describe("<SectionNav />", () => {
  it("renders a link per section with the right label", () => {
    renderWithSections();
    expect(
      screen.getByRole("navigation", { name: "On this page" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /About/ })).toHaveAttribute(
      "href",
      "#about",
    );
    expect(screen.getByRole("link", { name: /Experience/ })).toHaveAttribute(
      "href",
      "#experience",
    );
    expect(screen.getByRole("link", { name: /Skills/ })).toHaveAttribute(
      "href",
      "#skills",
    );
  });

  it("marks the first section active by default (aria-current=location)", () => {
    renderWithSections();
    const aboutLink = screen.getByRole("link", { name: /About/ });
    expect(aboutLink).toHaveAttribute("aria-current", "location");
  });

  it("flips the active item when the IntersectionObserver fires for another section", () => {
    renderWithSections();
    const expEl = document.getElementById("experience")!;
    expect(observerCallback).not.toBeNull();
    act(() => {
      observerCallback!([
        { target: expEl, isIntersecting: true, intersectionRatio: 0.6 },
      ]);
    });
    const expLink = screen.getByRole("link", { name: /Experience/ });
    expect(expLink).toHaveAttribute("aria-current", "location");
    // Previous active should have lost the flag
    expect(
      screen.getByRole("link", { name: /About/ }),
    ).not.toHaveAttribute("aria-current");
  });

  it("picks the topmost intersecting section when multiple are visible at once", () => {
    renderWithSections();
    const aboutEl = document.getElementById("about")!;
    const expEl = document.getElementById("experience")!;
    const skillsEl = document.getElementById("skills")!;
    // Mock layout so experience sits at the top of the active band, then
    // skills, then about (which has scrolled past). Lower `top` = nearer
    // the top of the viewport.
    aboutEl.getBoundingClientRect = () =>
      ({ top: -200, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    expEl.getBoundingClientRect = () =>
      ({ top: 100, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    skillsEl.getBoundingClientRect = () =>
      ({ top: 600, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    act(() => {
      observerCallback!([
        { target: expEl, isIntersecting: true, intersectionRatio: 0.5 },
        { target: skillsEl, isIntersecting: true, intersectionRatio: 0.5 },
      ]);
    });
    // Experience (top=100) is closer to the top of the viewport than skills (top=600)
    expect(
      screen.getByRole("link", { name: /Experience/ }),
    ).toHaveAttribute("aria-current", "location");
    expect(
      screen.getByRole("link", { name: /Skills/ }),
    ).not.toHaveAttribute("aria-current");
  });

  it("removes a section from the active set when it stops intersecting", () => {
    renderWithSections();
    const expEl = document.getElementById("experience")!;
    const skillsEl = document.getElementById("skills")!;
    expEl.getBoundingClientRect = () =>
      ({ top: 100, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    skillsEl.getBoundingClientRect = () =>
      ({ top: 600, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    // Both intersect — experience wins because it's higher.
    act(() => {
      observerCallback!([
        { target: expEl, isIntersecting: true, intersectionRatio: 0.5 },
        { target: skillsEl, isIntersecting: true, intersectionRatio: 0.5 },
      ]);
    });
    expect(
      screen.getByRole("link", { name: /Experience/ }),
    ).toHaveAttribute("aria-current", "location");

    // Experience scrolls out of the active band; skills should win now.
    act(() => {
      observerCallback!([
        { target: expEl, isIntersecting: false, intersectionRatio: 0 },
      ]);
    });
    expect(
      screen.getByRole("link", { name: /Skills/ }),
    ).toHaveAttribute("aria-current", "location");
  });

  it("renders nothing when no sections are passed", () => {
    const { container } = render(<SectionNav sections={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("calls scrollIntoView on click and prevents default navigation", () => {
    renderWithSections();
    const expEl = document.getElementById("experience")!;
    const scrollSpy = vi.fn();
    expEl.scrollIntoView = scrollSpy;

    const link = screen.getByRole("link", { name: /Experience/ });
    const ev = fireEvent.click(link);
    expect(ev).toBe(false); // preventDefault was called → fireEvent returns false
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy.mock.calls[0][0]).toMatchObject({
      block: "start",
    });
  });

  it("uses behavior:auto when user prefers reduced motion", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: q.includes("reduce"),
        media: q,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    renderWithSections();
    const expEl = document.getElementById("experience")!;
    const scrollSpy = vi.fn();
    expEl.scrollIntoView = scrollSpy;

    fireEvent.click(screen.getByRole("link", { name: /Experience/ }));
    expect(scrollSpy.mock.calls[0][0]).toMatchObject({ behavior: "auto" });
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = renderWithSections();
    expect(disconnected).toBe(false);
    unmount();
    expect(disconnected).toBe(true);
  });
});
