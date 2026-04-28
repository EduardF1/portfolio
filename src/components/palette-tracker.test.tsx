import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { PaletteTracker } from "./palette-tracker";

// next-themes is mocked because PaletteTracker reads `resolvedTheme`
// from it. We don't want to depend on the provider tree in a unit test.
const themeState = { resolvedTheme: "dark" as string | undefined };
vi.mock("next-themes", () => ({
  useTheme: () => themeState,
}));

// next-intl's `useLocale` likewise — return a fixed string so the
// component doesn't need NextIntlClientProvider in the test render.
vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

// `usePalette()` from the provider needs the provider context. Mock
// the hook directly so the tracker can run in isolation.
vi.mock("@/components/palette-provider", () => ({
  usePalette: () => ({ palette: "mountain-navy", setPalette: vi.fn() }),
}));

beforeEach(() => {
  window.sessionStorage.clear();
  themeState.resolvedTheme = "dark";
  // jsdom doesn't ship a window.location.pathname setter; default is
  // "/" which is fine for these assertions.
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<PaletteTracker />", () => {
  it("POSTs once on mount with the documented body shape", () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<PaletteTracker />);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("/api/track-palette");
    const initObj = init as RequestInit;
    expect(initObj.method).toBe("POST");
    const body = JSON.parse(String(initObj.body));
    expect(body).toEqual({
      palette: "mountain-navy",
      theme: "dark",
      locale: "en",
      path: "/",
    });
  });

  it("is a no-op when the sessionStorage flag is already set", () => {
    window.sessionStorage.setItem("palette-track-fired", "1");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<PaletteTracker />);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("marks the flag after firing so a remount in the same tab is a no-op", () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    const { unmount } = render(<PaletteTracker />);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    unmount();
    render(<PaletteTracker />);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem("palette-track-fired")).toBe("1");
  });

  it("does not fire when the theme is still unresolved", () => {
    themeState.resolvedTheme = undefined;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<PaletteTracker />);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("swallows fetch failures without throwing", () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    expect(() => render(<PaletteTracker />)).not.toThrow();
  });
});
