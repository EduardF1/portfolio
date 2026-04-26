import { describe, it, expect } from "vitest";
import { getRecommendations } from "./recommendations";

describe("getRecommendations", () => {
  it("loads MDX letters from content/recommends/letters and sorts by author", async () => {
    const items = await getRecommendations();
    expect(items.length).toBeGreaterThan(0);
    // Sorted alphabetically by author
    const authors = items.map((i) => i.author);
    const sorted = [...authors].sort((a, b) => a.localeCompare(b));
    expect(authors).toEqual(sorted);
    // Each has at least the required fields populated
    for (const i of items) {
      expect(typeof i.slug).toBe("string");
      expect(i.slug.length).toBeGreaterThan(0);
      expect(["en", "da"]).toContain(i.language);
      expect(typeof i.author).toBe("string");
      expect(typeof i.quote).toBe("string");
    }
  });
});
