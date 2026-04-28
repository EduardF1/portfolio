"use client";

import { useCallback, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import type { CountryDestination } from "@/lib/travel-locations";
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

export type TravelMapView = "destinations" | "intensity";

export type TravelEuropeMapLabels = {
  toggleAriaLabel: string;
  destinationsLabel: string;
  intensityLabel: string;
  legendTitle: string;
  legendUnit: string;
};

const DEFAULT_LABELS: TravelEuropeMapLabels = {
  toggleAriaLabel: "Switch map view",
  destinationsLabel: "Destinations",
  intensityLabel: "Intensity",
  legendTitle: "Trips per country",
  legendUnit: "trips",
};

export function TravelEuropeMap({
  destinations,
  tripCounts = {},
  initialView = "destinations",
  labels = DEFAULT_LABELS,
}: {
  destinations: MapDestination[];
  tripCounts?: Record<string, number>;
  initialView?: TravelMapView;
  labels?: TravelEuropeMapLabels;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [view, setView] = useState<TravelMapView>(initialView);

  const handleToggle = useCallback(
    (next: TravelMapView) => {
      setView(next);
      // Persist via the `?map=` URL search param so the view survives a
      // refresh / share. We mutate the URL directly with replaceState
      // (no localStorage, no router push) so we do not trigger a
      // server round-trip — the chloropleth and pin views are both
      // rendered from props already on the client.
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (next === "intensity") {
        url.searchParams.set("map", "intensity");
      } else {
        url.searchParams.delete("map");
      }
      window.history.replaceState(null, "", url.toString());
    },
    [],
  );

  if (destinations.length === 0) return null;

  const isIntensity = view === "intensity";

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
            aria-pressed={!isIntensity}
            onClick={() => handleToggle("destinations")}
            className={
              !isIntensity
                ? "px-3 py-1.5 bg-accent text-accent-foreground"
                : "px-3 py-1.5 bg-background text-foreground-muted hover:text-foreground"
            }
          >
            {labels.destinationsLabel}
          </button>
          <button
            type="button"
            data-testid="map-view-intensity"
            aria-pressed={isIntensity}
            onClick={() => handleToggle("intensity")}
            className={
              isIntensity
                ? "px-3 py-1.5 bg-accent text-accent-foreground"
                : "px-3 py-1.5 bg-background text-foreground-muted hover:text-foreground"
            }
          >
            {labels.intensityLabel}
          </button>
        </div>
      </div>

      <figure
        aria-label={`Travel destinations across ${destinations.length} countries`}
        className="overflow-hidden rounded-lg border border-border bg-surface/40"
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
                if (isIntensity) {
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

          {!isIntensity &&
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
        </ComposableMap>
      </figure>

      {isIntensity && <TravelMapLegend labels={labels} />}

      <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-foreground-subtle">
        {destinations.length} countries · click a marker to open that country&apos;s photo set · base map © Natural Earth
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
