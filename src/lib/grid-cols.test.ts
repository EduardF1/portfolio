import { describe, it, expect } from "vitest";
import { gridColsClass, responsiveGridColsClass } from "./grid-cols";

describe("gridColsClass", () => {
  it("returns grid-cols-1 for 0 or 1 items", () => {
    expect(gridColsClass(0)).toBe("grid-cols-1");
    expect(gridColsClass(1)).toBe("grid-cols-1");
  });

  it("returns grid-cols-2 for 2 items at default cap", () => {
    expect(gridColsClass(2)).toBe("grid-cols-2");
  });

  it("returns grid-cols-3 for 3+ items at default cap", () => {
    expect(gridColsClass(3)).toBe("grid-cols-3");
    expect(gridColsClass(4)).toBe("grid-cols-3");
    expect(gridColsClass(99)).toBe("grid-cols-3");
  });

  it("respects a smaller cap", () => {
    expect(gridColsClass(5, 2)).toBe("grid-cols-2");
    expect(gridColsClass(5, 1)).toBe("grid-cols-1");
  });

  it("never returns more columns than items even when cap allows", () => {
    expect(gridColsClass(1, 3)).toBe("grid-cols-1");
    expect(gridColsClass(2, 3)).toBe("grid-cols-2");
  });
});

describe("responsiveGridColsClass", () => {
  it("collapses to a single column at very low counts", () => {
    expect(responsiveGridColsClass(0)).toBe("grid-cols-1");
    expect(responsiveGridColsClass(1)).toBe("grid-cols-1");
  });

  it("hits 2-up at sm: when there are 2 items, never 3-up", () => {
    expect(responsiveGridColsClass(2)).toBe("grid-cols-1 sm:grid-cols-2");
  });

  it("scales to 3-up at lg: when there are 3+ items", () => {
    expect(responsiveGridColsClass(3)).toBe(
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    );
    expect(responsiveGridColsClass(7)).toBe(
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    );
  });

  it("respects a 2-up cap", () => {
    expect(responsiveGridColsClass(7, 2)).toBe("grid-cols-1 sm:grid-cols-2");
    expect(responsiveGridColsClass(2, 2)).toBe("grid-cols-1 sm:grid-cols-2");
    expect(responsiveGridColsClass(1, 2)).toBe("grid-cols-1");
  });
});
