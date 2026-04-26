import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
});

function setReducedMotion(reduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: reduced,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("<RecommendationsCarousel />", () => {
  it("renders all slides as DOM, only the active one with the quote visible", () => {
    setReducedMotion(false);
    render(<RecommendationsCarousel recommendations={RECS} locale="en" />);
    // First slide visible
    expect(screen.getByText(/Quote A/)).toBeInTheDocument();
    // Slides B and C exist as articles but their quote text is not in the DOM
    // (they render placeholder articles, content gated on isActive)
    expect(screen.queryByText(/Quote B/)).not.toBeInTheDocument();
    // 3 slide regions
    expect(screen.getAllByRole("group", { name: /Slide \d of 3/ })).toHaveLength(3);
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
    // Pause button gone — we're now in manual mode
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

  it("renders nothing when there are no recommendations", () => {
    setReducedMotion(false);
    const { container } = render(
      <RecommendationsCarousel recommendations={[]} locale="en" />,
    );
    expect(container.firstChild).toBeNull();
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
});
