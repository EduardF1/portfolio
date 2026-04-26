import { describe, it, expect } from "vitest";
import { formatDate, formatYearMonth } from "./format";

describe("formatDate", () => {
  it("formats an ISO string in en-GB by default", () => {
    expect(formatDate("2024-04-15")).toBe("15 April 2024");
  });

  it("accepts a Date instance directly", () => {
    expect(formatDate(new Date("2023-01-31T00:00:00Z"))).toBe("31 January 2023");
  });

  it("respects an explicit locale", () => {
    // en-US uses month-day-year
    const formatted = formatDate("2024-04-15", "en-US");
    expect(formatted).toMatch(/April 15,?\s*2024/);
  });
});

describe("formatYearMonth", () => {
  it("formats an ISO string as short month + year in en-GB", () => {
    expect(formatYearMonth("2024-04-15")).toMatch(/Apr\s*2024/);
  });

  it("accepts a Date instance directly", () => {
    expect(formatYearMonth(new Date("2023-12-01"))).toMatch(/Dec\s*2023/);
  });
});
