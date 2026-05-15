"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Recharts wrappers for the admin dashboard.
 *
 * Kept in a client component because Recharts uses React refs +
 * ResizeObserver which don't exist on the server. The Server Component
 * page passes plain serialisable data in; everything visual happens on
 * the client.
 *
 * Theming: the chart series use `currentColor` driven by Tailwind utility
 * classes on the wrapping element. The dark-on-dark site colours come
 * from CSS custom properties (`--accent`, `--foreground-subtle`), and
 * we resolve them to literal hex via `getComputedStyle` in development.
 * For now we hardcode the accent token's value (the site never re-skins
 * the admin scope so this is safe enough).
 */

type DailyPoint = { day: string; views: number };
type SimpleBar = { label: string; value: number };

const ACCENT = "var(--accent, #f5a623)";
const SUBTLE = "var(--foreground-subtle, rgba(255,255,255,0.4))";
const SURFACE = "var(--surface, rgba(255,255,255,0.08))";

export function DailyViewsChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={SURFACE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={(v: string) => v.slice(5)}
            stroke={SUBTLE}
            fontSize={11}
          />
          <YAxis stroke={SUBTLE} fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(20,20,20,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              fontSize: 12,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="views" fill={ACCENT} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EventsBarChart({ data }: { data: SimpleBar[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 8, bottom: 8, left: 24 }}
        >
          <CartesianGrid stroke={SURFACE} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" stroke={SUBTLE} fontSize={11} allowDecimals={false} />
          <YAxis
            dataKey="label"
            type="category"
            stroke={SUBTLE}
            fontSize={11}
            width={120}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(20,20,20,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="value" fill={ACCENT} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_PALETTE = [
  "#f5a623",
  "#7fc7ff",
  "#9c8cff",
  "#52d6a4",
  "#ff7e8b",
  "#ffd166",
  "#a8a8a8",
];

export function DevicePie({ data }: { data: SimpleBar[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            stroke="rgba(0,0,0,0.3)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgba(20,20,20,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
