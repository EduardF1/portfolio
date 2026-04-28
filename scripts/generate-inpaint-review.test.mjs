import { describe, expect, it } from "vitest";
import {
  parseArgs,
  toPosix,
  pairImages,
  splitSlug,
  groupBySlug,
  thumbnailName,
  toRelFromOutputDir,
} from "./generate-inpaint-review.mjs";

describe("parseArgs", () => {
  it("captures --before/--after/--output and uses the default thumbs dir", () => {
    const opts = parseArgs([
      "--before",
      "public/photos/trips",
      "--after",
      "scripts/.inpaint-staging",
      "--output",
      "docs/inpaint-sweep-results.md",
    ]);
    expect(opts).toEqual({
      before: "public/photos/trips",
      after: "scripts/.inpaint-staging",
      output: "docs/inpaint-sweep-results.md",
      thumbs: "public/photos/_inpaint-thumbs",
    });
  });

  it("honours an explicit --thumbs override", () => {
    const opts = parseArgs([
      "--before",
      "a",
      "--after",
      "b",
      "--output",
      "c.md",
      "--thumbs",
      "tmp/x",
    ]);
    expect(opts.thumbs).toBe("tmp/x");
  });

  it("flags --help / -h and surfaces missing required flags as nulls", () => {
    expect(parseArgs(["--help"]).help).toBe(true);
    expect(parseArgs(["-h"]).help).toBe(true);
    const empty = parseArgs([]);
    expect(empty.before).toBeNull();
    expect(empty.after).toBeNull();
    expect(empty.output).toBeNull();
  });
});

describe("toPosix", () => {
  it("normalises Windows backslashes to forward slashes", () => {
    expect(toPosix("a\\b\\c.jpg")).toBe("a/b/c.jpg");
  });

  it("leaves POSIX paths untouched", () => {
    expect(toPosix("a/b/c.jpg")).toBe("a/b/c.jpg");
  });
});

describe("pairImages", () => {
  it("intersects the two lists for pairs and surfaces after-only as orphans", () => {
    const before = ["a/x.jpg", "a/y.jpg", "b/z.jpg"];
    const after = ["a/x.jpg", "a/y.jpg", "stale/leftover.jpg"];
    const { pairs, orphans } = pairImages(before, after);
    expect(pairs).toEqual(["a/x.jpg", "a/y.jpg"]);
    expect(orphans).toEqual(["stale/leftover.jpg"]);
  });

  it("returns empty arrays when after-tree is empty", () => {
    expect(pairImages(["a/x.jpg"], [])).toEqual({ pairs: [], orphans: [] });
  });
});

describe("splitSlug", () => {
  it("splits on the first separator into slug + filename", () => {
    expect(splitSlug("2018-03-israel/IMG.jpg")).toEqual({
      slug: "2018-03-israel",
      filename: "IMG.jpg",
    });
  });

  it("buckets root-level files under '(root)'", () => {
    expect(splitSlug("rogue.jpg")).toEqual({ slug: "(root)", filename: "rogue.jpg" });
  });

  it("treats Windows separators as POSIX equivalents", () => {
    expect(splitSlug("trip\\sub\\photo.jpg")).toEqual({
      slug: "trip",
      filename: "sub/photo.jpg",
    });
  });
});

describe("groupBySlug", () => {
  it("groups by first segment, slug-sorted, with per-group sorted files", () => {
    const groups = groupBySlug(["b/2.jpg", "a/2.jpg", "a/1.jpg", "b/1.jpg"]);
    expect([...groups.keys()]).toEqual(["a", "b"]);
    expect(groups.get("a")).toEqual(["a/1.jpg", "a/2.jpg"]);
    expect(groups.get("b")).toEqual(["b/1.jpg", "b/2.jpg"]);
  });
});

describe("thumbnailName", () => {
  it("flattens path separators and tags before/after", () => {
    expect(thumbnailName("trip-1/IMG_1.jpg", "before")).toBe("trip-1__IMG_1.before.jpg");
    expect(thumbnailName("trip-1/IMG_1.jpg", "after")).toBe("trip-1__IMG_1.after.jpg");
  });

  it("preserves files without an extension", () => {
    expect(thumbnailName("trip/raw", "before")).toBe("trip__raw.before.jpg");
  });
});

describe("toRelFromOutputDir", () => {
  it("emits POSIX relative paths for embedded markdown links", () => {
    expect(toRelFromOutputDir("docs", "docs/inpaint-sample-thumbs/x.jpg")).toBe(
      "inpaint-sample-thumbs/x.jpg",
    );
    expect(toRelFromOutputDir("docs", "public/photos/_inpaint-thumbs/x.jpg")).toBe(
      "../public/photos/_inpaint-thumbs/x.jpg",
    );
  });
});
