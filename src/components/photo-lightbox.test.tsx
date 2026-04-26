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
});
