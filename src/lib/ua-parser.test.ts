import { describe, it, expect } from "vitest";
import { parseUserAgent } from "./ua-parser";

describe("parseUserAgent", () => {
  it("returns Other/Other/desktop for empty input", () => {
    expect(parseUserAgent(null)).toEqual({
      browser: "Other",
      os: "Other",
      deviceType: "desktop",
    });
    expect(parseUserAgent(undefined)).toEqual({
      browser: "Other",
      os: "Other",
      deviceType: "desktop",
    });
    expect(parseUserAgent("")).toEqual({
      browser: "Other",
      os: "Other",
      deviceType: "desktop",
    });
  });

  it("identifies Chrome on Windows desktop", () => {
    const out = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    expect(out).toEqual({
      browser: "Chrome",
      os: "Windows",
      deviceType: "desktop",
    });
  });

  it("identifies Edge before falling through to Chrome", () => {
    const out = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0",
    );
    expect(out.browser).toBe("Edge");
  });

  it("identifies Firefox on macOS", () => {
    const out = parseUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:121.0) Gecko/20100101 Firefox/121.0",
    );
    expect(out).toEqual({
      browser: "Firefox",
      os: "macOS",
      deviceType: "desktop",
    });
  });

  it("identifies Safari on iPhone as mobile", () => {
    const out = parseUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );
    expect(out).toEqual({
      browser: "Safari",
      os: "iOS",
      deviceType: "mobile",
    });
  });

  it("identifies iPad as tablet", () => {
    const out = parseUserAgent(
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1",
    );
    expect(out.deviceType).toBe("tablet");
    expect(out.os).toBe("iOS");
  });

  it("identifies Android phone as mobile", () => {
    const out = parseUserAgent(
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
    );
    expect(out).toEqual({
      browser: "Chrome",
      os: "Android",
      deviceType: "mobile",
    });
  });

  it("identifies Android tablet (no Mobile token) as tablet", () => {
    const out = parseUserAgent(
      "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    );
    expect(out.deviceType).toBe("tablet");
    expect(out.os).toBe("Android");
  });

  it("identifies Linux desktop", () => {
    const out = parseUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    );
    expect(out.os).toBe("Linux");
    expect(out.deviceType).toBe("desktop");
  });
});
