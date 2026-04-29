"use client";

import { useCallback, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import type {
  CityDestination,
  CountryDestination,
} from "@/lib/travel-locations";
import {
  TIER_RANGE_LABELS,
  tierForTripCount,
} from "@/lib/trip-clusters";

/**
 * Destination shape consumed by the map. The base `CountryDestination`
 * is enriched on the server with `firstTripSlug` so a pin click can
 * deep-link straight to a real photo set when one exists.
 */
export type MapDestination = CountryDestination & {
  firstTripSlug?: string;
};

/** Per-city dot data for the Cities overlay. Re-exports the lib type
 *  so callers only need to import from this module. */
export type MapCity = CityDestination;

// World TopoJSON (Natural Earth 1:50m) served from jsDelivr CDN. ~250KB
// gzipped, edge-cached. We use a Mercator projection clipped to a
// Europe-shaped viewport so coastlines and country borders render
// properly under the destination markers.
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const PROJECTION_CONFIG = {
  // Centre of Europe; scale tuned to fill the viewport without clipping
  // Iberia / the Baltics. center is [lon, lat].
  center: [15, 53] as [number, number],
  scale: 700,
  rotate: [0, 0, 0] as [number, number, number],
};

const VB_WIDTH = 900;
const VB_HEIGHT = 600;

/**
 * Map between the country names that come back from Nominatim (used in
 * `place.country` in the photo catalogue) and the `properties.name`
 * values exposed by the Natural Earth `world-atlas` countries-50m
 * dataset. Most match exactly; only a handful of geopolitical
 * spellings drift between the two sources.
 *
 * Keys are catalogue / Nominatim names; values are Natural Earth names.
 */
const NOMINATIM_TO_NE_NAME: Readonly<Record<string, string>> = {
  Czechia: "Czech Republic",
  Turkey: "Turkey", // some NE builds use "Türkiye"; we cover both below
};

/** A small set of Natural Earth name aliases we additionally accept
 *  for a given Nominatim country (used to be defensive across NE
 *  versions). */
const NE_NAME_ALIASES: Readonly<Record<string, readonly string[]>> = {
  Czechia: ["Czechia", "Czech Republic", "Czech Rep."],
  Turkey: ["Turkey", "Türkiye"],
};

function normaliseGeographyName(name: unknown): string {
  return typeof name === "string" ? name : "";
}

/** Look up a trip count for a Natural Earth country name. */
function tripCountForGeography(
  geoName: string,
  tripCounts: Record<string, number>,
): number {
  // 1. Exact catalogue-name hit.
  if (geoName in tripCounts) return tripCounts[geoName];
  // 2. Alias-table hit (e.g. NE "Czech Republic" → catalogue "Czechia").
  for (const [catName, aliases] of Object.entries(NE_NAME_ALIASES)) {
    if (aliases.includes(geoName) && catName in tripCounts) {
      return tripCounts[catName];
    }
  }
  // 3. Reverse direct map (catalogue → NE) — covers cases where NE_NAME_ALIASES
  //    does not list the alias explicitly.
  for (const [catName, neName] of Object.entries(NOMINATIM_TO_NE_NAME)) {
    if (geoName === neName && catName in tripCounts) return tripCounts[catName];
  }
  return 0;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function markerRadius(photoCount: number): number {
  return clamp(5 + Math.sqrt(photoCount) * 1.6, 6, 22);
}

/**
 * Radius for a city-overlay dot. Kept smaller than country pins so a
 * dense overlay does not swallow the chloropleth underneath. Scales
 * with `sqrt(photoCount)` for the same compressed-spread feel.
 */
function cityDotRadius(photoCount: number): number {
  return clamp(3 + Math.sqrt(photoCount) * 0.9, 3.5, 9);
}

/**
 * Slugify a country name to match the anchor ids on /travel
 * (`country-<slug>`). Mirrors the helper in `travel-locations.ts`.
 */
function slugifyCountry(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Tier-keyed CSS strings for the chloropleth fill.
 * Tier 0: neutral surface (no trips).
 * Tier 1: lightest accent (uses --color-accent-soft).
 * Tier 2-4: progressively stronger accent via colour-mix on
 *           --color-accent over the surface — works across all three
 *           palettes (warm terracotta on light, glow-orange on dark).
 */
const TIER_FILLS: readonly string[] = [
  "var(--color-surface-strong)",
  "var(--color-accent-soft)",
  "color-mix(in oklab, var(--color-accent) 55%, var(--color-surface-strong))",
  "color-mix(in oklab, var(--color-accent) 80%, var(--color-surface-strong))",
  "var(--color-accent)",
];

/**
 * Two-state toggle: a simple country-pin view ("destinations") and a
 * combined chloropleth + city-dot view ("map", the default).
 *
 * The legacy `"intensity"` and `"cities"` values are accepted for
 * backward compatibility with deep-links that predate the merge —
 * both resolve to the new combined `"map"` view at component mount.
 */
export type TravelMapView = "destinations" | "map" | "intensity" | "cities";

export type TravelEuropeMapLabels = {
  toggleAriaLabel: string;
  destinationsLabel: string;
  /** Label for the combined chloropleth + city-dots view button. */
  mapLabel?: string;
  /** @deprecated Kept for back-compat — falls back to `mapLabel`. */
  intensityLabel?: string;
  /** @deprecated Cities are now folded into the combined `map` view. */
  citiesLabel?: string;
  legendTitle: string;
  legendUnit: string;
  /** Singular photo-count phrase, e.g. "1 photo". Optional; the
   *  parent passes the already-localised plural string (resolved on
   *  the server). Functions cannot cross the RSC boundary, so we
   *  trade the closure for a {one, other} pair. */
  photoCountOne?: string;
  /** Plural photo-count phrase template with a literal `{count}`
   *  token, e.g. "{count} photos". */
  photoCountOther?: string;
};

const DEFAULT_LABELS: TravelEuropeMapLabels = {
  toggleAriaLabel: "Switch map view",
  destinationsLabel: "Destinations",
  mapLabel: "Map",
  legendTitle: "Trips per country",
  legendUnit: "trips",
  photoCountOne: "1 photo",
  photoCountOther: "{count} photos",
};

/**
 * Coalesce any legacy view value (`"intensity"` / `"cities"`) into the
 * combined `"map"` view. Keeps state machine internally binary while
 * letting older `?map=` URLs continue to deep-link sensibly.
 */
function coalesceView(v: TravelMapView): "destinations" | "map" {
  return v === "destinations" ? "destinations" : "map";
}

function formatPhotoCount(
  n: number,
  one: string | undefined,
  other: string | undefined,
): string {
  if (n === 1 && one) return one;
  if (other) return other.replace("{count}", String(n));
  return `${n} ${n === 1 ? "photo" : "photos"}`;
}

function buildCityTooltip(
  city: string,
  country: string,
  photoCount: number,
  labels: TravelEuropeMapLabels,
): string {
  return `${city}, ${country} · ${formatPhotoCount(
    photoCount,
    labels.photoCountOne,
    labels.photoCountOther,
  )}`;
}

export function TravelEuropeMap({
  destinations,
  cities = [],
  tripCounts = {},
  initialView = "map",
  labels = DEFAULT_LABELS,
}: {
  destinations: MapDestination[];
  cities?: MapCity[];
  tripCounts?: Record<string, number>;
  initialView?: TravelMapView;
  labels?: TravelEuropeMapLabels;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [view, setView] = useState<"destinations" | "map">(
    coalesceView(initialView),
  );

  const handleToggle = useCallback((next: "destinations" | "map") => {
    setView(next);
    // Clear any sticky hover state when switching modes so an
    // overlay-specific hover does not leak across views.
    setHovered(null);
    setHoveredCity(null);
    // Persist via the `?map=` URL search param so the view survives a
    // refresh / share. The combined `map` view is the default, so we
    // strip the param entirely; only the simpler `destinations` view
    // pins itself in the URL.
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (next === "destinations") {
      url.searchParams.set("map", "destinations");
    } else {
      url.searchParams.delete("map");
    }
    window.history.replaceState(null, "", url.toString());
  }, []);

  /**
   * Click handler for a city dot: scroll to the trip card / country
   * tile that contains photos from this city. We try, in order:
   *   1. `#trip-<primaryTripSlug>` — set on each Recent Trips card.
   *   2. `#country-<country-slug>` — fallback when the dominant trip
   *      isn't rendered as a card on the page (e.g. older trip).
   * If neither exists we noop and let the anchor's href drive a
   * normal navigation to the trip's photo page.
   */
  const handleCityClick = useCallback(
    (city: MapCity, e: React.MouseEvent<HTMLAnchorElement>) => {
      if (typeof document === "undefined") return;
      const candidates: string[] = [];
      if (city.primaryTripSlug) candidates.push(`trip-${city.primaryTripSlug}`);
      candidates.push(`country-${slugifyCountry(city.country)}`);
      for (const id of candidates) {
        const node = document.getElementById(id);
        if (node) {
          e.preventDefault();
          node.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      // No matching anchor — fall through to the href-driven nav.
    },
    [],
  );

  if (destinations.length === 0) return null;

  const isMap = view === "map";
  const isDestinations = view === "destinations";

  // The combined view paints the chloropleth and overlays per-city
  // dots. The simpler view shows neutral country fills with one pin
  // per country. City overlay only renders when we have cities.
  const showChloropleth = isMap;
  const showCountryPins = isDestinations;
  const showCityDots = isMap && cities.length > 0;

  const mapLabel = labels.mapLabel ?? labels.intensityLabel ?? "Map";

  return (
    <div className="@container relative">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div
          role="group"
          aria-label={labels.toggleAriaLabel}
          className="inline-flex rounded-lg border border-border overflow-hidden text-xs font-mono uppercase tracking-[0.15em]"
        >
          <button
            type="button"
            data-testid="map-view-destinations"
            aria-pressed={isDestinations}
            onClick={() => handleToggle("destinations")}
            className={
              isDestinations
                ? "px-3 py-1.5 bg-accent text-accent-foreground"
                : "px-3 py-1.5 bg-background text-foreground-muted hover:text-foreground"
            }
          >
            {labels.destinationsLabel}
          </button>
          <button
            type="button"
            data-testid="map-view-map"
            aria-pressed={isMap}
            onClick={() => handleToggle("map")}
            className={
              isMap
                ? "px-3 py-1.5 bg-accent text-accent-foreground"
                : "px-3 py-1.5 bg-background text-foreground-muted hover:text-foreground"
            }
          >
            {mapLabel}
          </button>
        </div>
      </div>

      <figure
        aria-label={`Travel destinations across ${destinations.length} countries`}
        className="overflow-hidden rounded-lg border border-border bg-surface/40 relative"
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={PROJECTION_CONFIG}
          width={VB_WIDTH}
          height={VB_HEIGHT}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName = normaliseGeographyName(
                  (geo.properties as { name?: unknown } | undefined)?.name,
                );
                let fill = "var(--color-surface-strong)";
                if (showChloropleth) {
                  const trips = tripCountForGeography(geoName, tripCounts);
                  fill = TIER_FILLS[tierForTripCount(trips)];
                }
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="var(--color-border)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "var(--color-surface)" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {showCountryPins &&
            destinations.map((destination) => {
              const radius = markerRadius(destination.photoCount);
              const isHovered = hovered === destination.slug;
              return (
                <Marker
                  key={destination.slug}
                  coordinates={[destination.centroid.lon, destination.centroid.lat]}
                  onMouseEnter={() => setHovered(destination.slug)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(destination.slug)}
                  onBlur={() => setHovered(null)}
                >
                  <a
                    href={
                      destination.firstTripSlug
                        ? `/travel/photos/${destination.firstTripSlug}`
                        : `#country-${destination.slug}`
                    }
                    aria-label={`${destination.country}, ${destination.photoCount} ${destination.photoCount === 1 ? "photo" : "photos"}, ${destination.cities.length} ${destination.cities.length === 1 ? "city" : "cities"}`}
                  >
                    <circle
                      r={radius + 6}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                    />
                    <circle
                      r={radius}
                      fill="var(--color-accent)"
                      fillOpacity={isHovered ? 0.95 : 0.75}
                      stroke="var(--color-background)"
                      strokeWidth={1.5}
                      style={{
                        cursor: "pointer",
                        transition: "fill-opacity 150ms",
                      }}
                    />
                  </a>
                  <text
                    x={radius + 6}
                    y={4}
                    fontFamily="var(--font-mono), monospace"
                    fontSize={10}
                    fill={
                      isHovered
                        ? "var(--color-foreground)"
                        : "var(--color-foreground-muted)"
                    }
                    style={{ pointerEvents: "none" }}
                  >
                    {destination.country}
                  </text>
                </Marker>
              );
            })}

          {showCityDots &&
            cities.map((city) => {
              const baseRadius = cityDotRadius(city.photoCount);
              const isHovered = hoveredCity === city.slug;
              const radius = isHovered ? baseRadius * 1.5 : baseRadius;
              const tooltip = buildCityTooltip(
                city.city,
                city.country,
                city.photoCount,
                labels,
              );
              return (
                <Marker
                  key={city.slug}
                  coordinates={[city.lon, city.lat]}
                  onMouseEnter={() => setHoveredCity(city.slug)}
                  onMouseLeave={() => setHoveredCity(null)}
                  onFocus={() => setHoveredCity(city.slug)}
                  onBlur={() => setHoveredCity(null)}
                >
                  <a
                    data-testid="city-dot"
                    data-city-slug={city.slug}
                    href={
                      city.primaryTripSlug
                        ? `/travel/photos/${city.primaryTripSlug}`
                        : `#country-${slugifyCountry(city.country)}`
                    }
                    aria-label={tooltip}
                    onClick={(e) => handleCityClick(city, e)}
                  >
                    {/* Larger, transparent hit area for steady hover. */}
                    <circle
                      r={baseRadius + 6}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                    />
                    {/*
                      City dots sit on top of an accent-tinted
                      chloropleth, so an accent fill would melt into
                      the background. Use the inverse swatch
                      (`accent-foreground` — cream on light, deep on
                      dark) for the body, with a `--color-foreground`
                      ring for hard contrast against any tier.
                    */}
                    <circle
                      r={radius}
                      fill="var(--color-accent-foreground)"
                      fillOpacity={isHovered ? 1 : 0.95}
                      stroke="var(--color-foreground)"
                      strokeWidth={1.25}
                      style={{
                        cursor: "pointer",
                        transition: "r 150ms ease, fill-opacity 150ms",
                      }}
                    />
                    {isHovered && (
                      <g
                        data-testid="city-tooltip"
                        pointerEvents="none"
                        // Anchor the tooltip just above the dot.
                        transform={`translate(0, ${-baseRadius - 6})`}
                      >
                        {/*
                          Solid background with a foreground-coloured
                          border so the tooltip reads cleanly over
                          any chloropleth tier (including darkest
                          accent and accent-foreground dot fills).
                        */}
                        <rect
                          x={-tooltip.length * 3 - 6}
                          y={-16}
                          rx={3}
                          ry={3}
                          width={tooltip.length * 6 + 12}
                          height={18}
                          fill="var(--color-background)"
                          stroke="var(--color-foreground)"
                          strokeWidth={0.75}
                          opacity={1}
                        />
                        <text
                          textAnchor="middle"
                          y={-3}
                          fontFamily="var(--font-mono), monospace"
                          fontSize={10}
                          fill="var(--color-foreground)"
                        >
                          {tooltip}
                        </text>
                      </g>
                    )}
                  </a>
                </Marker>
              );
            })}
        </ComposableMap>
      </figure>

      {showChloropleth && <TravelMapLegend labels={labels} />}

      <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-foreground-subtle">
        {showCityDots
          ? `${destinations.length} countries · ${cities.length} cities · click a dot to jump to the trip · base map © Natural Earth`
          : `${destinations.length} countries · click a marker to open that country's photo set · base map © Natural Earth`}
      </p>
    </div>
  );
}

/**
 * Five-swatch legend for the chloropleth view. Stable DOM order so a
 * snapshot test can assert the swatch + range label sequence.
 */
export function TravelMapLegend({
  labels,
}: {
  labels: TravelEuropeMapLabels;
}) {
  return (
    <div
      data-testid="map-legend"
      role="group"
      aria-label={labels.legendTitle}
      className="mt-3 flex items-center gap-3 flex-wrap"
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-foreground-subtle">
        {labels.legendTitle}
      </p>
      <ul className="flex items-center gap-2 flex-wrap">
        {TIER_RANGE_LABELS.map((range, tier) => (
          <li
            key={tier}
            data-testid={`legend-tier-${tier}`}
            className="flex items-center gap-1.5"
          >
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-sm border border-border"
              style={{ backgroundColor: TIER_FILLS[tier] }}
            />
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-foreground-muted">
              {range}
            </span>
          </li>
        ))}
        <li className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-foreground-subtle">
          {labels.legendUnit}
        </li>
      </ul>
    </div>
  );
}
