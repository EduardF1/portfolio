"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import type { CountryDestination } from "@/lib/travel-locations";

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

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function markerRadius(photoCount: number): number {
  return clamp(5 + Math.sqrt(photoCount) * 1.6, 6, 22);
}

export function TravelEuropeMap({
  destinations,
}: {
  destinations: CountryDestination[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (destinations.length === 0) return null;

  return (
    <div className="@container relative">
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
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="var(--color-surface-strong)"
                  stroke="var(--color-border)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "var(--color-surface)" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {destinations.map((destination) => {
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
                  href={`#country-${destination.slug}`}
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

      <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-foreground-subtle">
        {destinations.length} countries · click a marker to jump to that country&apos;s photos · base map © Natural Earth
      </p>
    </div>
  );
}
