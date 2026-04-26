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
});
