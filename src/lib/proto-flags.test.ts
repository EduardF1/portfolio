import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load(env: Record<string, string | undefined> = {}) {
  for (const [k, v] of Object.entries(env)) {
    vi.stubEnv(k, v ?? "");
  }
  return await import("./proto-flags");
}

describe("proto-flags", () => {
  it("animatedDividersEnabled is false when env is unset", async () => {
    const m = await load({ NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS: "" });
    expect(m.animatedDividersEnabled()).toBe(false);
  });

  it('animatedDividersEnabled is false when env is "0"', async () => {
    const m = await load({ NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS: "0" });
    expect(m.animatedDividersEnabled()).toBe(false);
  });

  it('animatedDividersEnabled is true when env is "1"', async () => {
    const m = await load({ NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS: "1" });
    expect(m.animatedDividersEnabled()).toBe(true);
  });

  it("scrollBackgroundEnabled responds to NEXT_PUBLIC_PROTO_SCROLL_BG", async () => {
    const off = await load({ NEXT_PUBLIC_PROTO_SCROLL_BG: "" });
    expect(off.scrollBackgroundEnabled()).toBe(false);
    vi.resetModules();
    const on = await load({ NEXT_PUBLIC_PROTO_SCROLL_BG: "1" });
    expect(on.scrollBackgroundEnabled()).toBe(true);
  });

  it("parallaxCardsEnabled responds to NEXT_PUBLIC_PROTO_PARALLAX_CARDS", async () => {
    const off = await load({ NEXT_PUBLIC_PROTO_PARALLAX_CARDS: "" });
    expect(off.parallaxCardsEnabled()).toBe(false);
    vi.resetModules();
    const on = await load({ NEXT_PUBLIC_PROTO_PARALLAX_CARDS: "1" });
    expect(on.parallaxCardsEnabled()).toBe(true);
  });

  it("flags are independent of each other", async () => {
    const m = await load({
      NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS: "1",
      NEXT_PUBLIC_PROTO_SCROLL_BG: "0",
      NEXT_PUBLIC_PROTO_PARALLAX_CARDS: "",
    });
    expect(m.animatedDividersEnabled()).toBe(true);
    expect(m.scrollBackgroundEnabled()).toBe(false);
    expect(m.parallaxCardsEnabled()).toBe(false);
  });
});
