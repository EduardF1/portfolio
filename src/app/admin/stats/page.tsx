import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  bucketHitsByDay,
  countBy,
  dayKey,
  dayKeysForRange,
  deviceMix,
  RANGE_DAYS,
  suspiciousDays,
  topN,
  uniqueSessions,
  type Hit,
  type RangeKey,
} from "@/lib/analytics";
import {
  getHits,
  getUniqueSessionCount,
  isAnalyticsEnabled,
} from "@/lib/redis-analytics";
import {
  barChartPercents,
  fetchPaletteStats,
  getSearchQueryStats,
  topPaletteCombos,
  type CountRow,
  type PaletteStats,
} from "@/lib/admin-stats";
import { isBotUserAgent } from "@/lib/bot-detect";
import {
  DailyViewsChart,
  DevicePie,
  EventsBarChart,
} from "@/components/admin-charts";

// Force dynamic. We always read the cookie and never want to cache the
// dashboard. Required because cookies() opts a Server Component out of
// static rendering anyway, but we make it explicit here.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN_COOKIE = "pf_admin";
const RANGE_TABS: RangeKey[] = ["today", "24h", "7d", "30d", "90d", "all"];
const RANGE_LABEL: Record<RangeKey, string> = {
  today: "Today",
  "24h": "Last 24h",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

const EVENT_LABEL: Record<string, string> = {
  pageview: "Page view",
  cv_download: "CV download",
  language_switch: "Language switch",
  external_link: "External link",
  exit: "Exit",
};

type SearchParams = Promise<{
  key?: string;
  range?: string;
  bots?: string;
  raw?: string;
}>;

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE)?.value;
  const expected = process.env.ADMIN_SECRET;

  // Auth gate (unchanged from the pre-Phase-3 dashboard):
  //   1. Anything that doesn't already hold pf_admin=1 is sent to
  //      `notFound()` (HTTP 404). We never return 401/403 to avoid
  //      confirming the route exists to drive-by probes.
  //   2. The `?key=` first-visit flow is handled by /admin/unlock
  //      (Next 16 forbids cookie mutation in Server Component render).
  //   3. The cookie is a static "1"; the only signal is "this browser
  //      previously authenticated". Rotation is via env-var rotation.
  //   4. New for Phase 3: /admin/signout clears the cookie and lands
  //      the visitor on "/". The sign-out link is rendered in the
  //      header below.
  const unlocked = adminCookie === "1";
  if (!unlocked) {
    if (sp.key && expected && sp.key === expected) {
      const target = sp.range
        ? `/admin/unlock?key=${encodeURIComponent(sp.key)}&range=${encodeURIComponent(sp.range)}`
        : `/admin/unlock?key=${encodeURIComponent(sp.key)}`;
      redirect(target);
    }
    notFound();
  }

  if (!isAnalyticsEnabled()) {
    return <EmptyState />;
  }

  const range: RangeKey = RANGE_TABS.includes(sp.range as RangeKey)
    ? (sp.range as RangeKey)
    : "today";
  // Bot filter defaults to ON ("exclude"). Visitor opts in to bot data
  // by appending ?bots=include.
  const bots = sp.bots === "include" ? "include" : "exclude";
  const showRaw = sp.raw === "1";

  const days = dayKeysForRange(new Date(), RANGE_DAYS[range]);

  // Build the absolute base URL for the internal /api/track-palette
  // call. Server Components can't use relative URLs, and we can't
  // hardcode the prod domain because that breaks preview deploys.
  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const baseUrl = host ? `${proto}://${host}` : "";

  const [hits, uniqueAcrossDays, paletteStats, searchQueries] = await Promise.all([
    getHits(days),
    getUniqueSessionCount(days),
    fetchPaletteStats(baseUrl, expected),
    getSearchQueryStats(),
  ]);

  return (
    <Dashboard
      range={range}
      days={days}
      hits={hits}
      uniqueAcrossDays={uniqueAcrossDays}
      paletteStats={paletteStats}
      searchQueries={searchQueries}
      adminCookie={adminCookie}
      bots={bots}
      showRaw={showRaw}
    />
  );
}

function EmptyState() {
  return (
    <main className="container-page py-20">
      <h1 className="text-3xl font-medium">Stats</h1>
      <p className="mt-4 text-foreground-muted">
        Set up Upstash Redis to start collecting analytics. See{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">
          docs/metrics-setup.md
        </code>{" "}
        for the env vars you need to configure.
      </p>
    </main>
  );
}

/**
 * Trim a Hit array down to the last 24 hours (when range=24h). The
 * existing day-bucket scheme means range=24h pulls today + yesterday,
 * but we want a rolling 24-hour window for display.
 */
function trimTo24h(hits: Hit[]): Hit[] {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return hits.filter((h) => h.ts >= cutoff);
}

/**
 * Apply the bot filter. We trust the API route to have dropped UA / IP
 * matches before storage, but suspicious-days heuristic still applies
 * to historical hits captured before the filter shipped. We also re-run
 * the UA matcher on the stored hits as belt-and-braces against any
 * accidentally-stored crawler payloads.
 */
function applyBotFilter(
  hits: Hit[],
  bots: "include" | "exclude",
  days: string[],
): Hit[] {
  if (bots === "include") return hits;
  const suspDays = suspiciousDays(hits, days);
  return hits.filter((h) => {
    if (suspDays.has(dayKey(new Date(h.ts)))) return false;
    // Stored hits don't carry the original UA, but they carry a
    // bucketed browser. "Other" combined with "Other" OS is a strong
    // signal of a crawler hit that slipped through the API filter.
    if (h.browser === "Other" && h.os === "Other") return false;
    // Defensive: if any synthetic UA bucket leaked in, drop it.
    if (isBotUserAgent(h.browser)) return false;
    return true;
  });
}

/**
 * Count events. Hits without an explicit `event` field default to
 * "pageview" — older stored hits predating Phase 2 will all bucket
 * into "pageview", which is correct.
 */
function eventCounts(hits: Hit[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of hits) {
    const k = h.event ?? "pageview";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** Top N (country, city) pairs grouped by country. */
function topCitiesByCountry(
  hits: Hit[],
  topCountries: Array<{ key: string; count: number }>,
  perCountry: number,
): Array<{ country: string; count: number; cities: Array<{ city: string; count: number }> }> {
  const cityByCountry: Record<string, Record<string, number>> = {};
  for (const h of hits) {
    if (!h.country || !h.city) continue;
    if (!cityByCountry[h.country]) cityByCountry[h.country] = {};
    cityByCountry[h.country][h.city] =
      (cityByCountry[h.country][h.city] ?? 0) + 1;
  }
  return topCountries.map((c) => ({
    country: c.key,
    count: c.count,
    cities: topN(cityByCountry[c.key] ?? {}, perCountry).map((r) => ({
      city: r.key,
      count: r.count,
    })),
  }));
}

function Dashboard({
  range,
  days,
  hits,
  uniqueAcrossDays,
  paletteStats,
  searchQueries,
  adminCookie,
  bots,
  showRaw,
}: {
  range: RangeKey;
  days: string[];
  hits: Hit[];
  uniqueAcrossDays: number;
  paletteStats: PaletteStats;
  searchQueries: CountRow[];
  adminCookie: string | undefined;
  bots: "include" | "exclude";
  showRaw: boolean;
}) {
  const rangeScopedHits = range === "24h" ? trimTo24h(hits) : hits;
  const filteredHits = applyBotFilter(rangeScopedHits, bots, days);
  const suspDays = suspiciousDays(rangeScopedHits, days);

  // ---- KPIs ----
  const totalViews = filteredHits.length;
  const uniqueSess = uniqueSessions(filteredHits);
  const timeOnPageVals = filteredHits
    .map((h) => h.timeOnPageMs)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgTimeOnPageSec =
    timeOnPageVals.length === 0
      ? 0
      : Math.round(
          timeOnPageVals.reduce((a, b) => a + b, 0) / timeOnPageVals.length / 1000,
        );
  const scrollVals = filteredHits
    .map((h) => h.scrollDepthPct)
    .filter((v): v is number => typeof v === "number" && v >= 0);
  const avgScrollPct =
    scrollVals.length === 0
      ? 0
      : Math.round(scrollVals.reduce((a, b) => a + b, 0) / scrollVals.length);

  // ---- charts data ----
  const perDay = bucketHitsByDay(filteredHits, days);
  const dailyChartData = days.map((d) => ({ day: d, views: perDay[d] ?? 0 }));
  const events = eventCounts(filteredHits);
  const eventChartData = (["pageview", "cv_download", "language_switch", "external_link", "exit"] as const)
    .map((k) => ({ label: EVENT_LABEL[k] ?? k, value: events[k] ?? 0 }))
    .filter((r) => r.value > 0);

  // ---- tables ----
  const topPages = topN(countBy(filteredHits, "path"), 10);
  const referrerCounts: Record<string, number> = {};
  for (const h of filteredHits) {
    // Prefer the new referrerHost field (hostname only). Fall back to
    // parsing `ref` for hits stored before Phase 2.
    if (h.referrerHost) {
      referrerCounts[h.referrerHost] = (referrerCounts[h.referrerHost] ?? 0) + 1;
      continue;
    }
    if (!h.ref) continue;
    try {
      const host = new URL(h.ref).host;
      referrerCounts[host] = (referrerCounts[host] ?? 0) + 1;
    } catch {
      // ignore malformed referrers
    }
  }
  const topReferrers = topN(referrerCounts, 10);
  const topCountries = topN(countBy(filteredHits, "country"), 10);
  const geoRows = topCitiesByCountry(filteredHits, topCountries, 3);
  const browsers = topN(countBy(filteredHits, "browser"), 5);
  const oses = topN(countBy(filteredHits, "os"), 5);
  const devices = deviceMix(filteredHits);
  const deviceTotal = devices.mobile + devices.tablet + devices.desktop;
  const deviceChartData = [
    { label: "Mobile", value: devices.mobile },
    { label: "Tablet", value: devices.tablet },
    { label: "Desktop", value: devices.desktop },
  ];
  const utmHits = filteredHits.filter((h) => h.utmSource);
  const utmSources = topN(countBy(utmHits as Hit[], "utmSource"), 10);
  const langCounts = countBy(filteredHits, "lang");
  const langRows = topN(langCounts, 5);

  return (
    <main className="container-page py-12 md:py-16">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            Internal · {dayKey(new Date())}
          </p>
          <h1 className="mt-2 text-3xl font-medium">Stats</h1>
          <p
            className={`mt-2 text-xs ${adminCookie === "1" ? "text-foreground-subtle" : "text-amber-500"}`}
          >
            {adminCookie === "1"
              ? "Your browser is excluded from these stats"
              : "Set the admin cookie to exclude your own views, visit with ?key= first"}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 md:items-end">
          <nav aria-label="Range" className="flex flex-wrap gap-2">
            {RANGE_TABS.map((r) => (
              <a
                key={r}
                href={`/admin/stats?range=${r}&bots=${bots}${showRaw ? "&raw=1" : ""}`}
                aria-current={range === r ? "page" : undefined}
                className={
                  "rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors " +
                  (range === r
                    ? "bg-foreground text-background"
                    : "border border-border text-foreground-muted hover:border-accent hover:text-accent")
                }
              >
                {RANGE_LABEL[r]}
              </a>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-3 text-xs">
            <a
              href={`/admin/stats?range=${range}&bots=${bots === "exclude" ? "include" : "exclude"}${showRaw ? "&raw=1" : ""}`}
              className="rounded-full border border-border px-3 py-1 font-mono uppercase tracking-wider text-foreground-muted hover:border-accent hover:text-accent"
            >
              Bots: {bots === "exclude" ? "excluded" : "included"}
            </a>
            <a
              href={`/admin/stats?range=${range}&bots=${bots}${showRaw ? "" : "&raw=1"}`}
              className="rounded-full border border-border px-3 py-1 font-mono uppercase tracking-wider text-foreground-muted hover:border-accent hover:text-accent"
            >
              Raw: {showRaw ? "on" : "off"}
            </a>
            <Link
              href="/admin/signout"
              prefetch={false}
              className="rounded-full border border-border px-3 py-1 font-mono uppercase tracking-wider text-foreground-muted hover:border-amber-500 hover:text-amber-500"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      {suspDays.size > 0 && bots === "include" && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Showing all data including {suspDays.size} suspicious day(s) (
          {[...suspDays].join(", ")}).{" "}
          <a
            href={`/admin/stats?range=${range}&bots=exclude${showRaw ? "&raw=1" : ""}`}
            className="underline"
          >
            Exclude bots
          </a>
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Stat label="Page views" value={totalViews.toLocaleString("en-GB")} />
        <Stat
          label="Unique sessions (visit-day)"
          value={uniqueAcrossDays.toLocaleString("en-GB")}
          note={`${uniqueSess.toLocaleString("en-GB")} unique in window`}
        />
        <Stat
          label="Avg time on page"
          value={`${avgTimeOnPageSec.toLocaleString("en-GB")} s`}
          note={
            timeOnPageVals.length === 0
              ? "no signal yet"
              : `${timeOnPageVals.length.toLocaleString("en-GB")} pings`
          }
        />
        <Stat
          label="Avg scroll depth"
          value={`${avgScrollPct}%`}
          note={
            scrollVals.length === 0
              ? "no signal yet"
              : `${scrollVals.length.toLocaleString("en-GB")} samples`
          }
        />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Per-day views</h2>
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          {days.length === 0 ? (
            <p className="text-foreground-subtle">No data yet.</p>
          ) : (
            <DailyViewsChart data={dailyChartData} />
          )}
        </div>
      </section>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <RankTable title="Top pages" rows={topPages} keyHeader="Path" />
        <RankTable
          title="Top referrers"
          rows={topReferrers}
          keyHeader="Host"
          empty="No external referrers in this window."
        />
        <GeographyCard rows={geoRows} />
        <DeviceCard total={deviceTotal} chartData={deviceChartData} />
        <RankTable title="Browser mix" rows={browsers} keyHeader="Browser" />
        <RankTable title="OS mix" rows={oses} keyHeader="OS" />
        <RankTable
          title="UTM sources"
          rows={utmSources}
          keyHeader="Source"
          empty="No UTM-tagged traffic in this window."
        />
        <RankTable
          title="Language mix"
          rows={langRows}
          keyHeader="Lang"
          empty="No lang signal yet (older hits)."
        />
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Events</h2>
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          {eventChartData.length === 0 ? (
            <p className="text-sm text-foreground-subtle">
              No event signal yet. Older hits all bucket into &quot;pageview&quot;.
            </p>
          ) : (
            <EventsBarChart data={eventChartData} />
          )}
        </div>
      </section>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <PaletteCard stats={paletteStats} />
        <SearchQueriesCard rows={searchQueries} />
      </div>

      {showRaw && <RawPayloadPreview hits={filteredHits.slice(-20)} />}

      <p className="mt-16 text-xs text-foreground-subtle">
        First-party, anonymous, aggregate. No IP addresses or persistent
        identifiers stored. See <code>/privacy</code>.
      </p>
    </main>
  );
}

function DeviceCard({
  total,
  chartData,
}: {
  total: number;
  chartData: Array<{ label: string; value: number }>;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium">Device mix</h2>
      <div className="mt-4 rounded-lg border border-border bg-background p-4">
        {total === 0 ? (
          <p className="text-sm text-foreground-subtle">No data yet.</p>
        ) : (
          <>
            <DevicePie data={chartData} />
            <ul className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {chartData.map((r) => {
                const pct = total === 0 ? 0 : (r.value / total) * 100;
                return (
                  <li
                    key={r.label}
                    className="flex flex-col items-start rounded border border-border px-2 py-1"
                  >
                    <span className="font-mono">{r.label}</span>
                    <span className="font-mono text-foreground-subtle">
                      {r.value} · {pct.toFixed(0)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function GeographyCard({
  rows,
}: {
  rows: Array<{
    country: string;
    count: number;
    cities: Array<{ city: string; count: number }>;
  }>;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium">Geography</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-background">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-foreground-subtle">
            No geo data, Vercel headers may be missing in dev.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/40 text-left">
                <th className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-foreground-subtle">
                  Country
                </th>
                <th className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-foreground-subtle">
                  Top cities
                </th>
                <th className="px-4 py-2 text-right font-mono text-xs uppercase tracking-wider text-foreground-subtle">
                  Hits
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.country}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-2 font-mono">{r.country}</td>
                  <td className="px-4 py-2 text-xs text-foreground-muted">
                    {r.cities.length === 0
                      ? "—"
                      : r.cities
                          .map((c) => `${c.city} (${c.count})`)
                          .join(", ")}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function RawPayloadPreview({ hits }: { hits: Hit[] }) {
  return (
    <section className="mt-12">
      <details className="rounded-lg border border-border bg-background p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Raw payload preview (last {hits.length})
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded bg-surface/40 p-3 text-xs leading-snug">
          {hits.map((h) => JSON.stringify(h, null, 2)).join("\n\n")}
        </pre>
      </details>
    </section>
  );
}

/**
 * Top palette × theme combos card. Same component as before, just
 * re-rendered against the dark dashboard chrome.
 */
function PaletteCard({ stats }: { stats: PaletteStats }) {
  const top = topPaletteCombos(stats, 6);
  const bars = barChartPercents(top);
  return (
    <section>
      <h2 className="text-lg font-medium">Top palette × theme</h2>
      <div className="mt-4 rounded-lg border border-border bg-background p-4">
        {bars.length === 0 ? (
          <p className="text-sm text-foreground-subtle">
            No data yet. Once <code>/api/track-palette</code> is wired up
            this card will rank palette × theme picks by count.
          </p>
        ) : (
          <ul className="space-y-3">
            {bars.map((row) => (
              <li key={row.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono">{row.key}</span>
                  <span className="font-mono text-xs text-foreground-subtle">
                    {row.count}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded bg-surface">
                  <div
                    className="h-2 rounded bg-accent"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        {stats.updatedAt && (
          <p className="mt-3 text-xs text-foreground-subtle">
            Updated {stats.updatedAt}
          </p>
        )}
      </div>
    </section>
  );
}

function SearchQueriesCard({ rows }: { rows: CountRow[] }) {
  const top = rows.slice(0, 10);
  const bars = barChartPercents(top);
  return (
    <section>
      <h2 className="text-lg font-medium">Top search queries</h2>
      <div className="mt-4 rounded-lg border border-border bg-background p-4">
        {bars.length === 0 ? (
          <p className="text-sm text-foreground-subtle">
            No data yet. Search queries stay client-side by default;
            server-side logging will land once a privacy review signs off.
          </p>
        ) : (
          <ul className="space-y-3">
            {bars.map((row) => (
              <li key={row.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono">{row.key}</span>
                  <span className="font-mono text-xs text-foreground-subtle">
                    {row.count}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded bg-surface">
                  <div
                    className="h-2 rounded bg-accent"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-3xl font-medium tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-foreground-subtle">{note}</p>}
    </div>
  );
}

function RankTable({
  title,
  rows,
  keyHeader,
  empty = "No data yet.",
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
  keyHeader: string;
  empty?: string;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-background">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-foreground-subtle">{empty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/40 text-left">
                <th className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-foreground-subtle">
                  {keyHeader}
                </th>
                <th className="px-4 py-2 text-right font-mono text-xs uppercase tracking-wider text-foreground-subtle">
                  Hits
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono">{r.key}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
