import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// next/image: render a plain <img> so jsdom can resolve src/alt.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

import { PhotoLightbox, type LightboxPhoto } from "./photo-lightbox";

const photos: LightboxPhoto[] = [
  { src: "/photos/a.jpg", alt: "Photo A" },
  { src: "/photos/b.jpg", alt: "Photo B" },
  { src: "/photos/c.jpg", alt: "Photo C" },
];

afterEach(() => {
  cleanup();
});

describe("<PhotoLightbox />", () => {
  it("renders a thumbnail button per photo with its alt text", () => {
    render(<PhotoLightbox photos={photos} />);
    expect(screen.getAllByTestId("lightbox-thumb")).toHaveLength(3);
    expect(screen.getByLabelText("Photo A")).toBeInTheDocument();
  });

  it("renders nothing for empty input", () => {
    const { container } = render(<PhotoLightbox photos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("collapses the thumbnail grid for low photo counts", () => {
    const single: LightboxPhoto[] = [{ src: "/photos/a.jpg", alt: "Solo" }];
    const { container, rerender } = render(<PhotoLightbox photos={single} />);
    const grid1 = container.querySelector(".grid") as HTMLElement;
    expect(grid1.className).toContain("grid-cols-1");
    expect(grid1.className).not.toContain("sm:grid-cols-2");

    const pair: LightboxPhoto[] = [
      { src: "/photos/a.jpg", alt: "A" },
      { src: "/photos/b.jpg", alt: "B" },
    ];
    rerender(<PhotoLightbox photos={pair} />);
    const grid2 = container.querySelector(".grid") as HTMLElement;
    expect(grid2.className).toContain("sm:grid-cols-2");
    expect(grid2.className).not.toContain("lg:grid-cols-3");
  });

  it("opens the dialog on thumbnail click and closes on Escape", () => {
    render(<PhotoLightbox photos={photos} />);
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByLabelText("Photo A"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ArrowRight advances, ArrowLeft goes back, wrapping at the ends", () => {
    render(<PhotoLightbox photos={photos} />);
    fireEvent.click(screen.getByLabelText("Photo A"));

    // The count badge announces position.
    expect(screen.getByText("Photo 1 of 3")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByText("Photo 2 of 3")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    // Wrap around back to 1.
    expect(screen.getByText("Photo 1 of 3")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByText("Photo 3 of 3")).toBeInTheDocument();
  });

  it("closes when the backdrop is clicked", () => {
    render(<PhotoLightbox photos={photos} />);
    fireEvent.click(screen.getByLabelText("Photo A"));
    const dialog = screen.getByRole("dialog");
    // Click the dialog itself (the backdrop) — the inner image div
    // stops propagation so it never reaches this listener.
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses a localised count label when provided", () => {
    render(
      <PhotoLightbox
        photos={photos}
        countLabel="Foto {current} af {total}"
      />,
    );
    fireEvent.click(screen.getByLabelText("Photo A"));
    expect(screen.getByText("Foto 1 af 3")).toBeInTheDocument();
  });

  it("Next / Prev arrow buttons cycle through photos", () => {
    render(<PhotoLightbox photos={photos} />);
    fireEvent.click(screen.getByLabelText("Photo A"));
    expect(screen.getByText("Photo 1 of 3")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("lightbox-next"));
    expect(screen.getByText("Photo 2 of 3")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("lightbox-prev"));
    expect(screen.getByText("Photo 1 of 3")).toBeInTheDocument();
  });

  it("hides the prev/next arrows when only one photo is shown", () => {
    render(
      <PhotoLightbox photos={[{ src: "/photos/a.jpg", alt: "Solo" }]} />,
    );
    fireEvent.click(screen.getByLabelText("Solo"));
    expect(screen.queryByTestId("lightbox-prev")).not.toBeInTheDocument();
    expect(screen.queryByTestId("lightbox-next")).not.toBeInTheDocument();
  });

  it("renders the caption under the active photo when present", () => {
    const captioned: LightboxPhoto[] = [
      { src: "/photos/a.jpg", alt: "A", caption: "Photo of an alley" },
    ];
    render(<PhotoLightbox photos={captioned} />);
    fireEvent.click(screen.getByLabelText("A"));
    expect(screen.getByText("Photo of an alley")).toBeInTheDocument();
  });

  it("a horizontal swipe-left advances to the next photo", () => {
    render(<PhotoLightbox photos={photos} />);
    fireEvent.click(screen.getByLabelText("Photo A"));
    const dialog = screen.getByTestId("lightbox-dialog");
    fireEvent.touchStart(dialog, {
      touches: [{ clientX: 250, clientY: 100 }],
    });
    fireEvent.touchEnd(dialog, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
    expect(screen.getByText("Photo 2 of 3")).toBeInTheDocument();
  });

  it("a horizontal swipe-right goes back (and wraps from index 0 to last)", () => {
    render(<PhotoLightbox photos={photos} />);
    fireEvent.click(screen.getByLabelText("Photo A"));
    const dialog = screen.getByTestId("lightbox-dialog");
    fireEvent.touchStart(dialog, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(dialog, {
      changedTouches: [{ clientX: 250, clientY: 100 }],
    });
    expect(screen.getByText("Photo 3 of 3")).toBeInTheDocument();
  });

  it("a vertical drag is ignored (page scroll, not slide nav)", () => {
    render(<PhotoLightbox photos={photos} />);
    fireEvent.click(screen.getByLabelText("Photo A"));
    const dialog = screen.getByTestId("lightbox-dialog");
    fireEvent.touchStart(dialog, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(dialog, {
      changedTouches: [{ clientX: 110, clientY: 400 }],
    });
    expect(screen.getByText("Photo 1 of 3")).toBeInTheDocument();
  });

  it("a swipe shorter than 50px is ignored", () => {
    render(<PhotoLightbox photos={photos} />);
    fireEvent.click(screen.getByLabelText("Photo A"));
    const dialog = screen.getByTestId("lightbox-dialog");
    fireEvent.touchStart(dialog, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(dialog, {
      changedTouches: [{ clientX: 130, clientY: 100 }],
    });
    expect(screen.getByText("Photo 1 of 3")).toBeInTheDocument();
  });

  it("touchEnd without a prior touchStart is a no-op (defensive)", () => {
    render(<PhotoLightbox photos={photos} />);
    fireEvent.click(screen.getByLabelText("Photo A"));
    const dialog = screen.getByTestId("lightbox-dialog");
    fireEvent.touchEnd(dialog, {
      changedTouches: [{ clientX: 0, clientY: 0 }],
    });
    expect(screen.getByText("Photo 1 of 3")).toBeInTheDocument();
  });

  it("close button closes the dialog", () => {
    render(<PhotoLightbox photos={photos} />);
    fireEvent.click(screen.getByLabelText("Photo A"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("lightbox-close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
