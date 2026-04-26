"use client";

import { useState } from "react";
import type { CountryDestination } from "@/lib/travel-locations";

/** Visible bounding box for the map: covers continental Europe + UK + nearby. */
const VIEWPORT = {
  minLon: -10,
  maxLon: 35,
  minLat: 35,
  maxLat: 65,
};
const VB_WIDTH = 900;
const VB_HEIGHT = 600;

function project(lat: number, lon: number): { x: number; y: number } {
  const x =
    ((lon - VIEWPORT.minLon) / (VIEWPORT.maxLon - VIEWPORT.minLon)) * VB_WIDTH;
  // Latitude grows north → SVG y grows south. Flip.
  const y =
    ((VIEWPORT.maxLat - lat) / (VIEWPORT.maxLat - VIEWPORT.minLat)) * VB_HEIGHT;
  return { x, y };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function markerRadius(photoCount: number): number {
  // 1 photo → 6px, 50 photos → 18px (sqrt growth so a ×10 increase ≈ ×3 radius)
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
      <svg
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        role="img"
        aria-label={`Travel destinations across ${destinations.length} countries`}
        className="w-full h-auto rounded-lg border border-border bg-surface/40"
      >
        {/* Faint lat/lon grid */}
        <g
          aria-hidden="true"
          stroke="var(--color-border)"
          strokeOpacity="0.4"
          strokeDasharray="2 6"
          strokeWidth="0.5"
          fill="none"
        >
          {[40, 50, 60].map((lat) => {
            const { y } = project(lat, 0);
            return (
              <line
                key={`p-${lat}`}
                x1={0}
                y1={y}
                x2={VB_WIDTH}
                y2={y}
              />
            );
          })}
          {[0, 10, 20, 30].map((lon) => {
            const { x } = project(0, lon);
            return (
              <line
                key={`m-${lon}`}
                x1={x}
                y1={0}
                x2={x}
                y2={VB_HEIGHT}
              />
            );
          })}
        </g>

        {/* Compass / region label */}
        <text
          x={20}
          y={30}
          fontFamily="var(--font-mono), monospace"
          fontSize="14"
          letterSpacing="3"
          fill="var(--color-foreground-subtle)"
        >
          EUROPE
        </text>

        {/* Markers */}
        {destinations.map((d) => {
          const { x, y } = project(d.centroid.lat, d.centroid.lon);
          const r = markerRadius(d.photoCount);
          const isHovered = hovered === d.slug;
          return (
            <g
              key={d.slug}
              onMouseEnter={() => setHovered(d.slug)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(d.slug)}
              onBlur={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Click target */}
              <a
                href={`#country-${d.slug}`}
                aria-label={`${d.country} — ${d.photoCount} ${d.photoCount === 1 ? "photo" : "photos"}, ${d.cities.length} ${d.cities.length === 1 ? "city" : "cities"}`}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={r + 6}
                  fill="transparent"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="var(--color-accent)"
                  fillOpacity={isHovered ? 0.95 : 0.7}
                  stroke="var(--color-background)"
                  strokeWidth="2"
                  className="transition-[fill-opacity] duration-150"
                />
              </a>
              {/* Label */}
              <text
                x={x + r + 6}
                y={y + 4}
                fontFamily="var(--font-mono), monospace"
                fontSize="11"
                fill={
                  isHovered
                    ? "var(--color-foreground)"
                    : "var(--color-foreground-muted)"
                }
                style={{ pointerEvents: "none" }}
              >
                {d.country}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-foreground-subtle">
        {destinations.length} countries · click a marker to jump to that country&apos;s photos
      </p>
    </div>
  );
}
