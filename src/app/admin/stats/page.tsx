import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  bucketHitsByDay,
  countBy,
  dayKey,
  dayKeysForRange,
  deviceMix,
  RANGE_DAYS,
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

// Force dynamic — we always read the cookie and never want to cache
// the dashboard. Required because cookies() opts a Server Component
// out of static rendering anyway, but we make it explicit here.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN_COOKIE = "pf_admin";
const COOKIE_TTL_DAYS = 90;
const RANGE_TABS: RangeKey[] = ["today", "7d", "30d", "all"];
const RANGE_LABEL: Record<RangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

type SearchParams = Promise<{ key?: string; range?: string }>;

// TODO i18n — this entire file is intentionally EN-only (admin scope).
export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE)?.value;
  const expected = process.env.ADMIN_SECRET;

  // Auth gate. Posture:
  //   1. Anything that doesn't already hold pf_admin=1 OR present a
  //      key that exactly equals process.env.ADMIN_SECRET is fed
  //      `notFound()` (HTTP 404). We never return 401/403 because
  //      that confirms the route exists; 404 makes the whole
  //      `/admin/stats` surface invisible to drive-by probes.
  //   2. `expected && sp.key === expected` is the strict-equality
  //      gate. Both `sp.key` and `expected` must be non-empty
  //      strings — an unset ADMIN_SECRET cannot be matched by an
  //      empty `?key=` query, even though both would coerce to
  //      empty string.
  //   3. On a successful key match we mint a 90-day pf_admin
  //      cookie (httpOnly + secure + sameSite=lax) so subsequent
  //      visits don't need the secret in the URL. The cookie is a
  //      static "1" — its ONLY job is to mark the browser as
  //      previously-authenticated. There's no signature or rotation;
  //      anyone with cookie-jar access to Eduard's machine has the
  //      same trust level he does.
  //   4. There is no logout / cookie-revoke route. To revoke,
  //      rotate ADMIN_SECRET in Vercel and delete the cookie
  //      manually (the old cookie still says "1" but no key in any
  //      URL can re-mint it once the env var rotates).
  let unlocked = adminCookie === "1";
  if (!unlocked && sp.key && expected && sp.key === expected) {
    cookieStore.set(ADMIN_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: COOKIE_TTL_DAYS * 24 * 60 * 60,
    });
    unlocked = true;
  }
  if (!unlocked) notFound();

  // Empty-state when Upstash isn't configured.
  if (!isAnalyticsEnabled()) {
    return <EmptyState />;
  }

  const range: RangeKey = RANGE_TABS.includes(sp.range as RangeKey)
    ? (sp.range as RangeKey)
    : "today";
  const days = dayKeysForRange(new Date(), RANGE_DAYS[range]);
  const [hits, uniqueAcrossDays] = await Promise.all([
    getHits(days),
    getUniqueSessionCount(days),
  ]);

  return (
    <Dashboard
      range={range}
      days={days}
      hits={hits}
      uniqueAcrossDays={uniqueAcrossDays}
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

function Dashboard({
  range,
  days,
  hits,
  uniqueAcrossDays,
}: {
  range: RangeKey;
  days: string[];
  hits: Hit[];
  uniqueAcrossDays: number;
}) {
  // Aggregate everything we need for the cards in one pass through hits.
  const totalViews = hits.length;
  const uniqueSess = uniqueSessions(hits);
  const perDay = bucketHitsByDay(hits, days);
  const topPages = topN(countBy(hits, "path"), 10);
  // Build referrer counts from hits (matches getHits ordering and
  // honours self-referral suppression done at insertion time).
  const referrerCounts: Record<string, number> = {};
  for (const h of hits) {
    if (!h.ref) continue;
    try {
      const host = new URL(h.ref).host;
      referrerCounts[host] = (referrerCounts[host] ?? 0) + 1;
    } catch {
      // ignore malformed referrers
    }
  }
  const topReferrers = topN(referrerCounts, 10);
  const countries = topN(countBy(hits, "country"), 10);
  const browsers = topN(countBy(hits, "browser"), 5);
  const devices = deviceMix(hits);
  const deviceTotal = devices.mobile + devices.tablet + devices.desktop;

  return (
    <main className="container-page py-12 md:py-16">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
            Internal · {dayKey(new Date())}
          </p>
          <h1 className="mt-2 text-3xl font-medium">Stats</h1>
        </div>
        <nav aria-label="Range" className="flex flex-wrap gap-2">
          {RANGE_TABS.map((r) => (
            <a
              key={r}
              href={`/admin/stats?range=${r}`}
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
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Page views" value={totalViews.toLocaleString("en-GB")} />
        <Stat
          label="Unique sessions (visit-day)"
          value={uniqueAcrossDays.toLocaleString("en-GB")}
          note={`${uniqueSess.toLocaleString("en-GB")} unique in window`}
        />
        <Stat
          label="Days in window"
          value={days.length.toLocaleString("en-GB")}
        />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Per-day views</h2>
        <div className="mt-4 rounded-lg border border-border p-4">
          {days.length === 0 ? (
            <p className="text-foreground-subtle">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {days.map((day) => {
                const dayViews = perDay[day] ?? 0;
                const max = Math.max(1, ...Object.values(perDay));
                const pct = (dayViews / max) * 100;
                return (
                  <li
                    key={day}
                    className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm"
                  >
                    <span className="font-mono text-xs text-foreground-subtle">
                      {day}
                    </span>
                    <div className="h-2 rounded bg-surface">
                      <div
                        className="h-2 rounded bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-right font-mono">{dayViews}</span>
                  </li>
                );
              })}
            </ul>
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
        <RankTable
          title="Geography"
          rows={countries}
          keyHeader="Country"
          empty="No geo data — Vercel headers may be missing in dev."
        />
        <BarMix
          title="Device mix"
          total={deviceTotal}
          rows={[
            { key: "Mobile", count: devices.mobile },
            { key: "Tablet", count: devices.tablet },
            { key: "Desktop", count: devices.desktop },
          ]}
        />
        <RankTable title="Browser mix" rows={browsers} keyHeader="Browser" />
      </div>

      <p className="mt-16 text-xs text-foreground-subtle">
        First-party, anonymous, aggregate. No IP addresses or persistent
        identifiers stored. See <code>/privacy</code>.
      </p>
    </main>
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
    <div className="rounded-lg border border-border p-5">
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
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
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

function BarMix({
  title,
  total,
  rows,
}: {
  title: string;
  total: number;
  rows: Array<{ key: string; count: number }>;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="mt-4 rounded-lg border border-border p-4">
        {total === 0 ? (
          <p className="text-sm text-foreground-subtle">No data yet.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const pct = total === 0 ? 0 : (r.count / total) * 100;
              return (
                <li key={r.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{r.key}</span>
                    <span className="font-mono text-xs text-foreground-subtle">
                      {r.count} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-surface">
                    <div
                      className="h-2 rounded bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
