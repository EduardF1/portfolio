import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { VisitTracker } from "./visit-tracker";

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
});

describe("<VisitTracker />", () => {
  it("does not POST when NEXT_PUBLIC_ANALYTICS_ENABLED is unset", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    render(<VisitTracker />);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("POSTs path + ref to /api/track when enabled", () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "1";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    render(<VisitTracker />);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("/api/track");
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse(String((init as RequestInit).body));
    expect(typeof body.path).toBe("string");
    expect(typeof body.ref).toBe("string");
  });

  it("swallows fetch failures silently", async () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "1";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    expect(() => render(<VisitTracker />)).not.toThrow();
  });
});
