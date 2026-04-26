import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// next/image renders an <img> at runtime; the bundler stub here keeps it
// minimal and lets the alt prop pass through cleanly for assertions.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

import { PhotoGallery, type Photo } from "./photo-gallery";

afterEach(() => {
  cleanup();
});

describe("<PhotoGallery />", () => {
  it("renders one Image per photo with its alt text", () => {
    const photos: Photo[] = [
      { src: "/photos/a.jpg", alt: "A photo" },
      { src: "/photos/b.jpg", alt: "Another photo" },
    ];
    render(<PhotoGallery photos={photos} />);
    expect(screen.getByAltText("A photo")).toBeInTheDocument();
    expect(screen.getByAltText("Another photo")).toBeInTheDocument();
  });

  it("renders nothing for an empty array or undefined input", () => {
    const { container, rerender } = render(<PhotoGallery photos={[]} />);
    expect(container.firstChild).toBeNull();
    rerender(<PhotoGallery photos={undefined as unknown as Photo[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("collapses the responsive grid for low photo counts", () => {
    // 1 photo → never goes wider than 1 column, so the lg: rectangle
    // beside it is not empty.
    const single: Photo[] = [{ src: "/photos/a.jpg", alt: "Solo" }];
    const { container, rerender } = render(<PhotoGallery photos={single} />);
    const grid1 = container.firstChild as HTMLElement;
    expect(grid1.className).toContain("grid-cols-1");
    expect(grid1.className).not.toContain("sm:grid-cols-2");
    expect(grid1.className).not.toContain("lg:grid-cols-3");

    // 2 photos → max sm:grid-cols-2, no lg: third column.
    const pair: Photo[] = [
      { src: "/photos/a.jpg", alt: "A" },
      { src: "/photos/b.jpg", alt: "B" },
    ];
    rerender(<PhotoGallery photos={pair} />);
    const grid2 = container.firstChild as HTMLElement;
    expect(grid2.className).toContain("sm:grid-cols-2");
    expect(grid2.className).not.toContain("lg:grid-cols-3");

    // 3+ photos → full responsive ladder.
    const trio: Photo[] = [
      { src: "/photos/a.jpg", alt: "A" },
      { src: "/photos/b.jpg", alt: "B" },
      { src: "/photos/c.jpg", alt: "C" },
    ];
    rerender(<PhotoGallery photos={trio} />);
    const grid3 = container.firstChild as HTMLElement;
    expect(grid3.className).toContain("sm:grid-cols-2");
    expect(grid3.className).toContain("lg:grid-cols-3");
  });
});
