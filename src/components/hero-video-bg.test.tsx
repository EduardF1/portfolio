import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

// The component reads env at module load time, so we dynamic-import it
// inside each test after stubbing the relevant variables.
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load(env: Record<string, string | undefined> = {}) {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) vi.stubEnv(k, "");
    else vi.stubEnv(k, v);
  }
  return await import("./hero-video-bg");
}

describe("HeroVideoBackground (placeholder branch — no env set)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_HERO_VIDEO_MP4", "");
    vi.stubEnv("NEXT_PUBLIC_HERO_VIDEO_WEBM", "");
    vi.stubEnv("NEXT_PUBLIC_HERO_VIDEO_POSTER", "");
  });

  it("Variant A renders two flank columns (left + right) with placeholder labels", async () => {
    const { HeroVideoBackground } = await load();
    const { container } = render(<HeroVideoBackground variant="A" />);
    expect(container.textContent).toMatch(/Variant A · Left/);
    expect(container.textContent).toMatch(/Variant A · Right/);
    // No <video> element when env vars are unset
    expect(container.querySelector("video")).toBeNull();
  });

  it("Variant B renders a single full-bleed placeholder", async () => {
    const { HeroVideoBackground } = await load();
    const { container } = render(<HeroVideoBackground variant="B" />);
    expect(container.textContent).toMatch(/Variant B · Full bleed/);
    expect(container.textContent).not.toMatch(/Variant A/);
    expect(container.querySelector("video")).toBeNull();
  });

  it("returns null for an unrecognised variant", async () => {
    const { HeroVideoBackground } = await load();
    const { container } = render(
      // @ts-expect-error — exercising the fallthrough branch
      <HeroVideoBackground variant="C" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("HeroFlanks placeholder columns include a vignette shadow div on each side", async () => {
    const { HeroFlanks } = await load();
    const { container } = render(<HeroFlanks />);
    // Two top-level absolute columns, each with a nested vignette
    const cols = container.querySelectorAll(".absolute.inset-y-0");
    expect(cols.length).toBe(2);
  });
});

describe("HeroVideoBackground (real-video branch — env set)", () => {
  it("Variant A renders <video> with WEBM + MP4 sources and a poster", async () => {
    const { HeroVideoBackground } = await load({
      NEXT_PUBLIC_HERO_VIDEO_MP4: "https://example.com/clip.mp4",
      NEXT_PUBLIC_HERO_VIDEO_WEBM: "https://example.com/clip.webm",
      NEXT_PUBLIC_HERO_VIDEO_POSTER: "/photos/poster.jpg",
    });
    const { container } = render(<HeroVideoBackground variant="A" />);
    const videos = container.querySelectorAll("video");
    // Two columns → two video elements
    expect(videos.length).toBe(2);
    const first = videos[0] as HTMLVideoElement;
    expect(first.getAttribute("poster")).toBe("/photos/poster.jpg");
    expect(first.querySelector('source[type="video/webm"]')).not.toBeNull();
    expect(first.querySelector('source[type="video/mp4"]')).not.toBeNull();
  });

  it("Variant B renders one full-bleed <video> when env is set", async () => {
    const { HeroVideoBackground } = await load({
      NEXT_PUBLIC_HERO_VIDEO_MP4: "https://example.com/clip.mp4",
      NEXT_PUBLIC_HERO_VIDEO_POSTER: "/photos/poster.jpg",
    });
    const { container } = render(<HeroVideoBackground variant="B" />);
    const videos = container.querySelectorAll("video");
    expect(videos.length).toBe(1);
    // Without WEBM env, only mp4 source
    expect(videos[0].querySelector('source[type="video/webm"]')).toBeNull();
    expect(videos[0].querySelector('source[type="video/mp4"]')).not.toBeNull();
  });

  it("renders WEBM only when WEBM is set without MP4", async () => {
    const { HeroVideoBackground } = await load({
      NEXT_PUBLIC_HERO_VIDEO_WEBM: "https://example.com/clip.webm",
    });
    const { container } = render(<HeroVideoBackground variant="B" />);
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video!.querySelector('source[type="video/webm"]')).not.toBeNull();
    expect(video!.querySelector('source[type="video/mp4"]')).toBeNull();
  });
});
