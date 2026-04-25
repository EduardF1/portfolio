import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("dedupes conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles falsy and conditional values", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("supports nested arrays and objects (clsx behaviour)", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });
});
