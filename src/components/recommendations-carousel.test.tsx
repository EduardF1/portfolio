import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RecommendationsCarousel } from "./recommendations-carousel";
import type { Recommendation } from "@/lib/recommendations";

const RECS: Recommendation[] = [
  {
    slug: "a-author",
    author: "A Author",
    role: "Colleague",
    company: "Mjølner",
    quote: "Quote A",
    language: "en",
  },
  {
    slug: "b-author",
    author: "B Author",
    role: "Manager",
    company: "LEGO",
    quote: "Quote B",
    language: "en",
  },
  {
    slug: "c-author",
    author: "C Author",
    role: "Lead",
    company: "STIL",
    quote: "Quote C",
    language: "en",
  },
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

type Listeners = {
  reduced: boolean;
  change: ((e: { matches: boolean }) => void) | null;
};

function setReducedMotion(reduced: boolean): Listeners {
  const ref: Listeners = { reduced, change: null };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      get matches() {
        return ref.reduced;
      },
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn((evt: string, cb: (e: { matches: boolean }) => void) => {
        if (evt === "change") ref.change = cb;
      }),
      removeEventListener: vi.fn(() => {
        ref.change = null;
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  return ref;
}

describe("<RecommendationsCarousel />", () => {
  it("renders all slides as DOM, only the active one with the quote visible", () => {
    setReducedMotion(false);
    const { container } = render(
      <RecommendationsCarousel recommendations={RECS} locale="en" />,
    );
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
    expect(screen.queryByText(/Quote B/)).not.toBeInTheDocument();
    expect(container.querySelectorAll('[aria-roledescription="slide"]')).toHaveLength(
      3,
    );
    expect(
      screen.getAllByRole("button", { name: /Go to slide \d of 3/ }),
    ).toHaveLength(3);
  });

  it("dot click advances to that slide and switches mode to manual (Pause hidden)", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    expect(screen.getByText(/Pause/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Go to slide 2 of 3" }),
    );
    expect(screen.getByText(/Quote B/)).toBeInTheDocument();
    expect(screen.queryByText(/Quote A/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pause/)).not.toBeInTheDocument();
  });

  it("under prefers-reduced-motion, no Pause control is shown (already manual)", () => {
    setReducedMotion(true);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    expect(screen.queryByText(/Pause/)).not.toBeInTheDocument();
  });

  it("ArrowRight advances slide", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(screen.getByText(/Quote B/)).toBeInTheDocument();
  });

  it("ArrowLeft wraps from slide 0 to the last slide (bounded loop)", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(screen.getByText(/Quote C/)).toBeInTheDocument();
  });

  it("Home jumps to first slide; End jumps to last slide", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    fireEvent.keyDown(region, { key: "End" });
    expect(screen.getByText(/Quote C/)).toBeInTheDocument();
    fireEvent.keyDown(region, { key: "Home" });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
  });

  it("ignores unrelated keys (e.g. Tab) and stays on the current slide", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    fireEvent.keyDown(region, { key: "Tab" });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
  });

  it("clicking the Pause button switches aria-live to polite", () => {
    setReducedMotion(false);
    const { container } = render(
      <RecommendationsCarousel recommendations={RECS} locale="en" />,
    );
    // Initially aria-live=off (auto mode)
    expect(container.querySelector('[aria-live="off"]')).toBeTruthy();
    fireEvent.click(screen.getByText(/Pause/));
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy();
    expect(container.querySelector('[aria-live="off"]')).toBeFalsy();
  });

  it("renders nothing when there are no recommendations", () => {
    setReducedMotion(false);
    const { container } = render(
      <RecommendationsCarousel recommendations={[]} locale="en" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("hides arrow controls when there is only a single slide", () => {
    setReducedMotion(false);
    render(
      <RecommendationsCarousel recommendations={[RECS[0]]} locale="en" />,
    );
    expect(
      screen.queryByRole("button", { name: "Previous slide" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next slide" }),
    ).not.toBeInTheDocument();
    // No dot controls either when only one slide
    expect(
      screen.queryByRole("button", { name: /Go to slide/ }),
    ).not.toBeInTheDocument();
  });

  it("Previous arrow button moves backwards (with wrap)", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByText(/Quote C/)).toBeInTheDocument();
  });

  it("Next arrow button advances slide", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText(/Quote B/)).toBeInTheDocument();
  });

  it("auto-rotate timer advances every 7s; cleared on unmount", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    const { unmount } = render(
      <RecommendationsCarousel recommendations={RECS} locale="en" />,
    );
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByText(/Quote B/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByText(/Quote C/)).toBeInTheDocument();
    // Wraps back to A
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
    unmount();
  });

  it("auto-rotate pauses while hovered, resumes on hover-out", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    fireEvent.mouseEnter(region);
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    // Still on first slide while paused
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
    fireEvent.mouseLeave(region);
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByText(/Quote B/)).toBeInTheDocument();
  });

  it("focus-within pauses auto-rotate; blur outside resumes it", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    fireEvent.focus(region);
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
    // blur where relatedTarget is outside the carousel
    fireEvent.blur(region, { relatedTarget: document.body });
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByText(/Quote B/)).toBeInTheDocument();
  });

  it("auto-rotate does not start when reduced-motion is preferred", () => {
    setReducedMotion(true);
    vi.useFakeTimers();
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
  });

  it("subscribes to reduced-motion changes and switches to manual on update", () => {
    const ref = setReducedMotion(false);
    vi.useFakeTimers();
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    // Initially auto — Pause button is shown
    expect(screen.getByText(/Pause/)).toBeInTheDocument();
    // Flip reduced-motion at runtime
    act(() => {
      ref.reduced = true;
      ref.change?.({ matches: true });
    });
    // Pause button disappears (manual + reduced)
    expect(screen.queryByText(/Pause/)).not.toBeInTheDocument();
    // Auto-rotate timer no longer runs
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
  });

  it("horizontal swipe left advances; swipe right moves back (wraps)", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    fireEvent.touchStart(region, {
      touches: [{ clientX: 200, clientY: 100 }],
    });
    fireEvent.touchEnd(region, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
    expect(screen.getByText(/Quote B/)).toBeInTheDocument();

    // Swipe right → back to A
    fireEvent.touchStart(region, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(region, {
      changedTouches: [{ clientX: 220, clientY: 100 }],
    });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
  });

  it("vertical swipe is ignored (page scroll, not slide navigation)", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    fireEvent.touchStart(region, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(region, {
      changedTouches: [{ clientX: 110, clientY: 300 }],
    });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
  });

  it("a swipe shorter than the threshold does nothing", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    fireEvent.touchStart(region, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(region, {
      changedTouches: [{ clientX: 110, clientY: 100 }],
    });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
  });

  it("touchEnd without a recorded touchStart is a no-op (defensive guard)", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    const region = screen.getByRole("region", { name: "Recommendations" });
    // Fire only end — start never recorded
    fireEvent.touchEnd(region, {
      changedTouches: [{ clientX: 0, clientY: 0 }],
    });
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
  });

  it("renders portrait <img> when frontmatter portrait is set", () => {
    setReducedMotion(false);
    const withPortrait: Recommendation = {
      ...RECS[0],
      portrait: "/photos/example.jpg",
    };
    const { container } = render(
      <RecommendationsCarousel
        recommendations={[withPortrait]}
        locale="en"
      />,
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("/photos/example.jpg");
  });

  it("falls back to a monogram avatar (uppercase first char) when no portrait", () => {
    setReducedMotion(false);
    const noPortrait: Recommendation = {
      ...RECS[0],
      author: "tobias thisted",
      portrait: undefined,
    };
    render(
      <RecommendationsCarousel
        recommendations={[noPortrait]}
        locale="en"
      />,
    );
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("falls back to '?' avatar when author is empty", () => {
    setReducedMotion(false);
    const blank: Recommendation = {
      ...RECS[0],
      author: "   ",
      portrait: undefined,
    };
    render(
      <RecommendationsCarousel recommendations={[blank]} locale="en" />,
    );
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("uses linkedinUrl when set, else a search-fallback URL", () => {
    setReducedMotion(false);
    const direct: Recommendation = {
      ...RECS[0],
      linkedinUrl: "https://linkedin.com/in/somebody",
    };
    const { rerender } = render(
      <RecommendationsCarousel
        recommendations={[direct]}
        locale="en"
      />,
    );
    const directLink = screen.getByRole("link", {
      name: /A Author on LinkedIn/,
    });
    expect(directLink).toHaveAttribute("href", "https://linkedin.com/in/somebody");

    const noUrl: Recommendation = { ...RECS[0], linkedinUrl: undefined };
    rerender(
      <RecommendationsCarousel
        recommendations={[noUrl]}
        locale="en"
      />,
    );
    const fallbackLink = screen.getByRole("link", {
      name: /A Author on LinkedIn/,
    });
    expect(fallbackLink.getAttribute("href")).toMatch(
      /^https:\/\/www\.linkedin\.com\/search\/results\/people\/\?keywords=/,
    );
  });

  it("prefers DA quote on /da; prefers EN translation on /en when DA-language source has quoteEn", () => {
    setReducedMotion(false);
    const daRec: Recommendation = {
      slug: "x",
      author: "X",
      role: "Y",
      company: "Z",
      quote: "DA Q",
      quoteEn: "EN Q",
      language: "da",
    };
    const { rerender } = render(
      <RecommendationsCarousel recommendations={[daRec]} locale="da" />,
    );
    expect(screen.getByText(/DA Q/)).toBeInTheDocument();
    rerender(
      <RecommendationsCarousel recommendations={[daRec]} locale="en" />,
    );
    expect(screen.getByText(/EN Q/)).toBeInTheDocument();
  });

  it("uses DA quote on /en when no English translation exists", () => {
    setReducedMotion(false);
    const daOnly: Recommendation = {
      slug: "y",
      author: "Y",
      role: "Y",
      company: "Z",
      quote: "DA only",
      language: "da",
    };
    render(
      <RecommendationsCarousel recommendations={[daOnly]} locale="en" />,
    );
    expect(screen.getByText(/DA only/)).toBeInTheDocument();
  });
});
