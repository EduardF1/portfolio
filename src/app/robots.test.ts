import { describe, it, expect } from "vitest";
import robots from "./robots";

describe("robots()", () => {
  it("emits a single rule allowing /, disallowing /api/ and /_next/", () => {
    const result = robots();
    expect(Array.isArray(result.rules)).toBe(true);
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    expect(rules[0].userAgent).toBe("*");
    expect(rules[0].allow).toBe("/");
    expect(rules[0].disallow).toEqual(["/api/", "/_next/"]);
  });

  it("points sitemap and host at the production domain", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://eduardfischer.dev/sitemap.xml");
    expect(result.host).toBe("https://eduardfischer.dev");
  });
});
