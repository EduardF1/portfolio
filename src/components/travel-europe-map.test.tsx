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
  Geographies: ({
    children,
  }: {
    children: (props: {
      geographies: { rsmKey: string; properties: { name: string } }[];
    }) => React.ReactNode;
  }) =>
    children({
      // A handful of fake geographies so we can verify the chloropleth
      // fill picks them up by `properties.name`.
      geographies: [
        { rsmKey: "g-italy", properties: { name: "Italy" } },
        { rsmKey: "g-czech", properties: { name: "Czech Republic" } },
        { rsmKey: "g-france", properties: { name: "France" } },
      ],
    }),
  Geography: ({ fill }: { fill?: string }) => (
    <path data-testid="geo" data-fill={fill ?? ""} />
  ),
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

import {
  TravelEuropeMap,
  TravelMapLegend,
  type MapCity,
  type MapDestination,
  type TravelEuropeMapLabels,
} from "./travel-europe-map";

const SAMPLES: MapDestination[] = [
  {
    country: "Italy",
    slug: "italy",
    centroid: { lat: 43.5, lon: 11.0 },
    cities: ["Pisa"],
    photoCount: 8,
    firstTripSlug: "italy-2024-04",
  },
  {
    country: "Denmark",
    slug: "denmark",
    centroid: { lat: 56.0, lon: 10.0 },
    cities: ["Aarhus", "Copenhagen"],
    photoCount: 100,
    // No firstTripSlug — fallback should be the in-page anchor.
  },
  {
    country: "Spain",
    slug: "spain",
    centroid: { lat: 40.0, lon: -3.7 },
    cities: ["Madrid"],
    photoCount: 1,
    firstTripSlug: "spain-2025-09",
  },
];

const TEST_LABELS: TravelEuropeMapLabels = {
  toggleAriaLabel: "Switch map view",
  destinationsLabel: "Destinations",
  mapLabel: "Map",
  legendTitle: "Trips per country",
  legendUnit: "trips",
};

const SAMPLE_CITIES: MapCity[] = [
  {
    city: "Pisa",
    country: "Italy",
    slug: "italy-pisa",
    lat: 43.72,
    lon: 10.4,
    photoCount: 8,
    primaryTripSlug: "italy-2024-04",
  },
  {
    city: "Krakow",
    country: "Poland",
    slug: "poland-krakow",
    lat: 50.06,
    lon: 19.94,
    photoCount: 3,
    primaryTripSlug: "poland-2025-04",
  },
];

afterEach(() => {
  cleanup();
});

describe("<TravelEuropeMap />", () => {
  it("renders a marker for each destination in the Destinations view", () => {
    const { container } = render(
      <TravelEuropeMap
        destinations={SAMPLES}
        initialView="destinations"
        labels={TEST_LABELS}
      />,
    );
    const markers = container.querySelectorAll('[data-testid="marker"]');
    expect(markers.length).toBe(3);
  });

  it("each marker deep-links to the country's first trip page when available, falling back to the in-page anchor", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        initialView="destinations"
        labels={TEST_LABELS}
      />,
    );
    const itLink = screen.getByLabelText(/^Italy, 8 photos, 1 city$/);
    expect(itLink).toHaveAttribute("href", "/travel/photos/italy-2024-04");
    const dkLink = screen.getByLabelText(/^Denmark, 100 photos, 2 cities$/);
    // Fallback for the country with no published trip slug.
    expect(dkLink).toHaveAttribute("href", "#country-denmark");
    const esLink = screen.getByLabelText(/^Spain, 1 photo, 1 city$/);
    expect(esLink).toHaveAttribute("href", "/travel/photos/spain-2025-09");
  });

  it("renders an aria-label summarising the destination count", () => {
    render(<TravelEuropeMap destinations={SAMPLES} />);
    expect(
      screen.getByLabelText(/Travel destinations across 3 countries/),
    ).toBeInTheDocument();
  });

  it("renders the country name as a label next to each marker in the Destinations view", () => {
    const { container } = render(
      <TravelEuropeMap
        destinations={SAMPLES}
        initialView="destinations"
        labels={TEST_LABELS}
      />,
    );
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
    const { container } = render(
      <TravelEuropeMap
        destinations={SAMPLES}
        initialView="destinations"
        labels={TEST_LABELS}
      />,
    );
    const markers = container.querySelectorAll('[data-testid="marker"]');
    // Ordering matches the input array
    expect(markers[0].getAttribute("data-lon")).toBe("11");
    expect(markers[0].getAttribute("data-lat")).toBe("43.5");
    expect(markers[2].getAttribute("data-lon")).toBe("-3.7");
    expect(markers[2].getAttribute("data-lat")).toBe("40");
  });

  it("renders the per-map metadata footer line in Destinations view", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        initialView="destinations"
        labels={TEST_LABELS}
      />,
    );
    expect(
      screen.getByText(/3 countries · click a marker/),
    ).toBeInTheDocument();
  });

  it("exposes a binary Destinations / Map toggle group, defaulting to Map", () => {
    render(<TravelEuropeMap destinations={SAMPLES} labels={TEST_LABELS} />);
    expect(screen.getByTestId("map-view-destinations")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId("map-view-map")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The legacy Intensity / Cities toggles must be gone.
    expect(screen.queryByTestId("map-view-intensity")).not.toBeInTheDocument();
    expect(screen.queryByTestId("map-view-cities")).not.toBeInTheDocument();
  });

  it("hides country pins and shows the legend in the default Map view", () => {
    const { container } = render(
      <TravelEuropeMap
        destinations={SAMPLES}
        tripCounts={{ Italy: 2 }}
        labels={TEST_LABELS}
      />,
    );
    expect(screen.getByTestId("map-view-map")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Country pins should not render in the combined view; their
    // role is taken over by the chloropleth + city dots.
    expect(container.querySelectorAll('[data-testid="marker"]').length).toBe(0);
    // Legend appears alongside the chloropleth.
    expect(screen.getByTestId("map-legend")).toBeInTheDocument();
  });

  it("treats legacy initialView='intensity' as the new combined Map view", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        initialView="intensity"
        tripCounts={{ Italy: 2 }}
        labels={TEST_LABELS}
      />,
    );
    expect(screen.getByTestId("map-view-map")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("treats legacy initialView='cities' as the new combined Map view and renders city dots", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        cities={SAMPLE_CITIES}
        initialView="cities"
        labels={TEST_LABELS}
      />,
    );
    expect(screen.getByTestId("map-view-map")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByTestId("city-dot")).toHaveLength(2);
  });

  it("renders city dots overlaid in the default Map view when cities are provided", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        cities={SAMPLE_CITIES}
        labels={TEST_LABELS}
      />,
    );
    const dots = screen.getAllByTestId("city-dot");
    expect(dots).toHaveLength(2);
    expect(dots[0]).toHaveAttribute("data-city-slug", "italy-pisa");
    expect(dots[1]).toHaveAttribute("data-city-slug", "poland-krakow");
  });

  it("city dot's aria-label is the tooltip line including city, country and photo count", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        cities={SAMPLE_CITIES}
        labels={TEST_LABELS}
      />,
    );
    const pisaDot = screen.getByLabelText(/^Pisa, Italy · 8 photos$/);
    expect(pisaDot).toBeInTheDocument();
    expect(pisaDot).toHaveAttribute("href", "/travel/photos/italy-2024-04");
    const krakow = screen.getByLabelText(/^Krakow, Poland · 3 photos$/);
    expect(krakow).toBeInTheDocument();
  });

  it("uses provided photoCountOne / photoCountOther templates for the tooltip", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        cities={SAMPLE_CITIES}
        labels={{
          ...TEST_LABELS,
          photoCountOne: "1 foto",
          photoCountOther: "{count} fotos",
        }}
      />,
    );
    // Pisa has 8 photos → uses the 'other' template.
    expect(screen.getByLabelText(/^Pisa, Italy · 8 fotos$/)).toBeInTheDocument();
  });

  it("falls back to English plural when photoCountOne / photoCountOther are absent", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        cities={[
          {
            city: "Solo",
            country: "Italy",
            slug: "italy-solo",
            lat: 43,
            lon: 11,
            photoCount: 1,
          },
        ]}
        labels={{
          toggleAriaLabel: "x",
          destinationsLabel: "x",
          mapLabel: "x",
          legendTitle: "x",
          legendUnit: "x",
        }}
      />,
    );
    expect(screen.getByLabelText(/^Solo, Italy · 1 photo$/)).toBeInTheDocument();
  });

  it("city dots are not rendered in the Destinations view", () => {
    const { container } = render(
      <TravelEuropeMap
        destinations={SAMPLES}
        cities={SAMPLE_CITIES}
        initialView="destinations"
        labels={TEST_LABELS}
      />,
    );
    expect(container.querySelectorAll('[data-testid="city-dot"]').length).toBe(
      0,
    );
  });

  it("city dots use the contrast-friendly accent-foreground fill with a foreground stroke for readability over the chloropleth", () => {
    const { container } = render(
      <TravelEuropeMap
        destinations={SAMPLES}
        cities={SAMPLE_CITIES}
        labels={TEST_LABELS}
      />,
    );
    const dot = container.querySelector('[data-testid="city-dot"]');
    expect(dot).not.toBeNull();
    // The visible body of the dot is the second <circle> child (the
    // first is the larger, transparent hit area).
    const circles = dot!.querySelectorAll("circle");
    const body = circles[1];
    expect(body.getAttribute("fill")).toBe("var(--color-accent-foreground)");
    expect(body.getAttribute("stroke")).toBe("var(--color-foreground)");
  });

  it("paints geographies with the tier-derived fill in the combined Map view", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        tripCounts={{
          Italy: 6, // tier 4 → darkest accent
          Czechia: 1, // tier 1 → accent-soft, also exercises NE-name alias
        }}
        labels={TEST_LABELS}
      />,
    );
    const geos = screen.getAllByTestId("geo");
    const fillByGeoName = new Map(
      geos.map((node, i) => {
        // Same order as the mocked `geographies` array.
        const order = ["Italy", "Czech Republic", "France"];
        return [order[i], node.getAttribute("data-fill") ?? ""] as const;
      }),
    );
    expect(fillByGeoName.get("Italy")).toBe("var(--color-accent)");
    expect(fillByGeoName.get("Czech Republic")).toBe("var(--color-accent-soft)");
    // France has no trips → neutral surface fill.
    expect(fillByGeoName.get("France")).toBe("var(--color-surface-strong)");
  });

  it("paints geographies with the neutral surface fill in the Destinations view", () => {
    render(
      <TravelEuropeMap
        destinations={SAMPLES}
        initialView="destinations"
        tripCounts={{ Italy: 6 }}
        labels={TEST_LABELS}
      />,
    );
    const geos = screen.getAllByTestId("geo");
    for (const node of geos) {
      expect(node.getAttribute("data-fill")).toBe("var(--color-surface-strong)");
    }
  });
});

describe("<TravelMapLegend /> snapshot", () => {
  it("renders five tier swatches with stable range labels", () => {
    const { container } = render(<TravelMapLegend labels={TEST_LABELS} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("each tier has a swatch + range label in DOM order", () => {
    render(<TravelMapLegend labels={TEST_LABELS} />);
    for (let i = 0; i < 5; i += 1) {
      expect(screen.getByTestId(`legend-tier-${i}`)).toBeInTheDocument();
    }
    // The five expected range labels, in order.
    const expected = ["0", "1", "2–3", "4–5", "6+"];
    for (const label of expected) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
