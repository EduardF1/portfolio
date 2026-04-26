import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// react-simple-maps reaches out to a CDN for TopoJSON; in jsdom the network
// is unavailable, so we stub the components to render lightweight DOM that
// preserves the props we care about (markers, hrefs, aria-labels).
vi.mock("react-simple-maps", () => ({
  ComposableMap: ({ children, ...rest }: React.PropsWithChildren) => (
    <svg data-testid="map" {...(rest as object)}>
      {children}
    </svg>
  ),
  Geographies: ({ children }: { children: (props: { geographies: unknown[] }) => React.ReactNode }) =>
    children({ geographies: [] }),
  Geography: () => null,
  Marker: ({
    coordinates,
    children,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
  }: {
    coordinates: [number, number];
    children?: React.ReactNode;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
  }) => (
    <g
      data-testid="marker"
      data-lon={coordinates[0]}
      data-lat={coordinates[1]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {children}
    </g>
  ),
}));

import { TravelEuropeMap } from "./travel-europe-map";
import type { CountryDestination } from "@/lib/travel-locations";

const SAMPLES: CountryDestination[] = [
  {
    country: "Italy",
    slug: "italy",
    centroid: { lat: 43.5, lon: 11.0 },
    cities: ["Pisa"],
    photoCount: 8,
  },
  {
    country: "Denmark",
    slug: "denmark",
    centroid: { lat: 56.0, lon: 10.0 },
    cities: ["Aarhus", "Copenhagen"],
    photoCount: 100,
  },
  {
    country: "Spain",
    slug: "spain",
    centroid: { lat: 40.0, lon: -3.7 },
    cities: ["Madrid"],
    photoCount: 1,
  },
];

afterEach(() => {
  cleanup();
});

describe("<TravelEuropeMap />", () => {
  it("renders a marker for each destination", () => {
    const { container } = render(<TravelEuropeMap destinations={SAMPLES} />);
    const markers = container.querySelectorAll('[data-testid="marker"]');
    expect(markers.length).toBe(3);
  });

  it("each marker links to the per-country anchor #country-<slug>", () => {
    render(<TravelEuropeMap destinations={SAMPLES} />);
    const itLink = screen.getByLabelText(/^Italy, 8 photos, 1 city$/);
    expect(itLink).toHaveAttribute("href", "#country-italy");
    const dkLink = screen.getByLabelText(/^Denmark, 100 photos, 2 cities$/);
    expect(dkLink).toHaveAttribute("href", "#country-denmark");
    const esLink = screen.getByLabelText(/^Spain, 1 photo, 1 city$/);
    expect(esLink).toHaveAttribute("href", "#country-spain");
  });

  it("renders an aria-label summarising the destination count", () => {
    render(<TravelEuropeMap destinations={SAMPLES} />);
    expect(
      screen.getByLabelText(/Travel destinations across 3 countries/),
    ).toBeInTheDocument();
  });

  it("renders the country name as a label next to each marker", () => {
    const { container } = render(<TravelEuropeMap destinations={SAMPLES} />);
    const labels = Array.from(container.querySelectorAll("text")).map(
      (t) => t.textContent,
    );
    expect(labels).toEqual(expect.arrayContaining(["Italy", "Denmark", "Spain"]));
  });

  it("renders nothing when destinations array is empty", () => {
    const { container } = render(<TravelEuropeMap destinations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("uses the provided centroid lat/lon as marker coordinates", () => {
    const { container } = render(<TravelEuropeMap destinations={SAMPLES} />);
    const markers = container.querySelectorAll('[data-testid="marker"]');
    // Ordering matches the input array
    expect(markers[0].getAttribute("data-lon")).toBe("11");
    expect(markers[0].getAttribute("data-lat")).toBe("43.5");
    expect(markers[2].getAttribute("data-lon")).toBe("-3.7");
    expect(markers[2].getAttribute("data-lat")).toBe("40");
  });

  it("renders the per-map metadata footer line", () => {
    render(<TravelEuropeMap destinations={SAMPLES} />);
    expect(
      screen.getByText(/3 countries · click a marker/),
    ).toBeInTheDocument();
  });
});
