/**
 * Smoke tests for the homepage. Real content (recommendations) is loaded
 * from MDX, but we mock next-intl translations to plain string lookups so
 * we can exercise both the no-video and the ?video=A / ?video=B paths.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

beforeEach(() => {
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

const useTranslationsMock = vi.fn();
vi.mock("next-intl", () => ({
  useTranslations: (ns?: string) => useTranslationsMock(ns),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns?: string) => (key: string) => {
    if (ns) return `${ns}.${key}`;
    return key;
  },
  setRequestLocale: () => {},
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: unknown }) => (
    <a href={typeof href === "string" ? href : "#"} {...(rest as object)}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

afterEach(() => {
  cleanup();
  useTranslationsMock.mockReset();
});

import Home from "./page";

function makeT(map: Record<string, string>, ns?: string) {
  // namespaced lookups with `home.x` style keys
  const fn = (key: string) => {
    const composite = ns ? `${ns}.${key}` : key;
    return map[composite] ?? map[key] ?? key;
  };
  (fn as unknown as { rich: typeof rich }).rich = rich;
  function rich(
    key: string,
    tags: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
  ) {
    const value = map[ns ? `${ns}.${key}` : key] ?? key;
    return [value, ...Object.values(tags).map((render) => render(""))];
  }
  return fn;
}

const I18N: Record<string, string> = {
  // common
  "common.available": "EU citizen · Aarhus, Denmark",
  "common.seeWork": "See work",
  "common.downloadCv": "Download CV",
  "common.allWork": "All work",
  // home
  "home.hero": "Software Engineer",
  "home.heroSubtitle": "Hello world.",
  "home.aboutKicker": "About",
  "home.aboutP1": "I'm a Software Engineer.",
  "home.aboutP2": "Romanian by birth.",
  "home.aboutP3Lead": "What I look for.",
  "home.aboutP3LinksHint": "The /my-story page; the /now page.",
  "home.experienceKicker": "Experience",
  "home.experienceHeading": "Five years across five companies.",
  "home.selectedKicker": "Selected work",
  "home.selectedHeading": "Things I've helped build.",
  "home.stats.years": "Years",
  "home.stats.languages": "Languages",
  "home.stats.projects": "Projects",
  "home.stats.countries": "Countries",
  // tooltips
  "tooltips.experience": "tt-experience",
  "tooltips.selectedWork": "tt-selected",
  "tooltips.testimonials": "tt-testimonials",
  "tooltips.skills": "tt-skills",
  // testimonials
  "testimonials.kicker": "Testimonials",
  "testimonials.heading": "What people said.",
  // skills
  "skills.kicker": "Skills",
  "skills.heading": "Tools & languages.",
};

describe("Home (homepage)", () => {
  it("renders without a hero video when ?video is not set", async () => {
    useTranslationsMock.mockImplementation((ns?: string) => makeT(I18N, ns));
    const tree = await Home({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    const { container } = render(tree);
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toBeInTheDocument();
    // Hero callout buttons
    expect(screen.getByRole("link", { name: /See work/ })).toBeInTheDocument();
    expect(screen.getByText(/Download CV/)).toBeInTheDocument();
    // Experience entries: each role anchor opens the company site
    expect(screen.getByText("Mjølner Informatics")).toBeInTheDocument();
    expect(screen.getByText("Netcompany")).toBeInTheDocument();
    expect(screen.getByText("Greenbyte")).toBeInTheDocument();
    expect(screen.getByText("Boozt Fashion")).toBeInTheDocument();
    expect(screen.getByText("Systematic")).toBeInTheDocument();
    // No <video> element when no ?video param
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders a video-bg branch when ?video=A", async () => {
    useTranslationsMock.mockImplementation((ns?: string) => makeT(I18N, ns));
    const tree = await Home({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ video: "A" }),
    });
    const { container } = render(tree);
    expect(container.textContent).toMatch(/Variant A/);
  });

  it("renders the Variant B branch when ?video=B", async () => {
    useTranslationsMock.mockImplementation((ns?: string) => makeT(I18N, ns));
    const tree = await Home({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ video: "B" }),
    });
    const { container } = render(tree);
    expect(container.textContent).toMatch(/Variant B/);
  });

  it("ignores invalid ?video values (no Variant placeholder rendered)", async () => {
    useTranslationsMock.mockImplementation((ns?: string) => makeT(I18N, ns));
    const tree = await Home({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ video: "Z" }),
    });
    const { container } = render(tree);
    expect(container.textContent).not.toMatch(/Variant A/);
    expect(container.textContent).not.toMatch(/Variant B/);
  });
});
