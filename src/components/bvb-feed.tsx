import { getTranslations } from "next-intl/server";
import { getBvbFeed, BVB_TEAM_ID, type BvbFeedData } from "@/lib/bvb";
import { BvbTabs } from "./bvb-tabs";

/**
 * Flashscore-style BVB feed: standings / next matches / recent results.
 *
 * This is a Server Component — it fetches the feed once on the server and
 * renders all three panels as static HTML. The client-side {@link BvbTabs}
 * component owns only the tab-state machine (hash sync, arrow-key nav,
 * aria-* attrs) so we do not ship any of the standings rows or fixture
 * lists as client JS.
 */
export async function BvbFeed() {
  const data = await getBvbFeed();
  const t = await getTranslations("personal.bvb");

  const empty =
    data.standings.length === 0 &&
    data.fixtures.length === 0 &&
    data.results.length === 0;

  if (empty) {
    return (
      <div
        data-testid="bvb-feed-empty"
        className="rounded-lg border border-dashed border-border p-8"
      >
        <p className="text-foreground-subtle">{t("unavailable")}</p>
        <p className="mt-3 max-w-2xl text-sm">{t("seasonSummary")}</p>
      </div>
    );
  }

  return (
    <BvbTabs
      labels={{
        standings: t("tabs.standings"),
        fixtures: t("tabs.fixtures"),
        results: t("tabs.results"),
      }}
      isMock={data.isMock}
      mockBadge={t("mockBadge")}
    >
      <StandingsPanel data={data} />
      <FixturesPanel data={data} />
      <ResultsPanel data={data} />
    </BvbTabs>
  );
}

async function StandingsPanel({ data }: { data: BvbFeedData }) {
  const t = await getTranslations("personal.bvb.standings");
  if (data.standings.length === 0) {
    return <p className="text-foreground-subtle">{t("empty")}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <thead className="text-left text-xs uppercase tracking-wider text-foreground-subtle">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-3 font-mono">
              {t("position")}
            </th>
            <th scope="col" className="py-2 pr-3">
              {t("team")}
            </th>
            <th scope="col" className="py-2 pr-3 text-right">
              {t("played")}
            </th>
            <th
              scope="col"
              className="hidden py-2 pr-3 text-right md:table-cell"
            >
              {t("won")}
            </th>
            <th
              scope="col"
              className="hidden py-2 pr-3 text-right md:table-cell"
            >
              {t("drawn")}
            </th>
            <th
              scope="col"
              className="hidden py-2 pr-3 text-right md:table-cell"
            >
              {t("lost")}
            </th>
            <th
              scope="col"
              className="hidden py-2 pr-3 text-right md:table-cell"
            >
              {t("goalDiff")}
            </th>
            <th scope="col" className="py-2 pr-2 text-right font-mono">
              {t("points")}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.standings.map((row) => {
            const isBvb = row.teamId === BVB_TEAM_ID;
            return (
              <tr
                key={row.teamId || row.position}
                data-bvb={isBvb || undefined}
                className={
                  isBvb
                    ? "border-b border-border bg-accent/10 font-semibold text-foreground"
                    : "border-b border-border/60"
                }
              >
                <td className="py-2 pr-3 font-mono">{row.position}</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center gap-2">
                    {row.crest && (
                      // Tiny external crest from football-data.org.
                      // Unoptimised is fine here — small, infrequent, and
                      // we don't want to wire up next.config.js remote
                      // patterns for one team-list use case.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.crest}
                        alt=""
                        width={16}
                        height={16}
                        className="h-4 w-4 object-contain"
                        aria-hidden="true"
                      />
                    )}
                    <span className="md:hidden">
                      {row.teamTla ?? row.teamShortName ?? row.teamName}
                    </span>
                    <span className="hidden md:inline">
                      {row.teamShortName ?? row.teamName}
                    </span>
                  </span>
                </td>
                <td className="py-2 pr-3 text-right font-mono">
                  {row.playedGames}
                </td>
                <td className="hidden py-2 pr-3 text-right font-mono md:table-cell">
                  {row.won}
                </td>
                <td className="hidden py-2 pr-3 text-right font-mono md:table-cell">
                  {row.draw}
                </td>
                <td className="hidden py-2 pr-3 text-right font-mono md:table-cell">
                  {row.lost}
                </td>
                <td className="hidden py-2 pr-3 text-right font-mono md:table-cell">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="py-2 pr-2 text-right font-mono font-semibold">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function FixturesPanel({ data }: { data: BvbFeedData }) {
  const t = await getTranslations("personal.bvb.fixtures");
  if (data.fixtures.length === 0) {
    return <p className="text-foreground-subtle">{t("empty")}</p>;
  }
  return (
    <ul className="divide-y divide-border/60">
      {data.fixtures.map((m) => (
        <li
          key={m.id}
          className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
        >
          <time
            dateTime={m.utcDate}
            className="font-mono text-xs text-foreground-subtle"
          >
            {formatDate(m.utcDate)}
          </time>
          <span className="text-sm">
            {m.isHome ? t("vs") : t("at")} <strong>{m.opponent}</strong>
          </span>
          <span className="ml-auto font-mono text-xs text-foreground-subtle">
            {m.competitionName}
          </span>
        </li>
      ))}
    </ul>
  );
}

async function ResultsPanel({ data }: { data: BvbFeedData }) {
  const t = await getTranslations("personal.bvb.results");
  if (data.results.length === 0) {
    return <p className="text-foreground-subtle">{t("empty")}</p>;
  }
  return (
    <ul className="divide-y divide-border/60">
      {data.results.map((m) => {
        const score =
          m.bvbScore != null && m.opponentScore != null
            ? m.isHome
              ? `${m.bvbScore}–${m.opponentScore}`
              : `${m.opponentScore}–${m.bvbScore}`
            : "—";
        const outcomeClass =
          m.outcome === "W"
            ? "text-emerald-600 dark:text-emerald-400"
            : m.outcome === "L"
              ? "text-red-600 dark:text-red-400"
              : "text-foreground-subtle";
        return (
          <li
            key={m.id}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
          >
            <time
              dateTime={m.utcDate}
              className="font-mono text-xs text-foreground-subtle"
            >
              {formatDate(m.utcDate)}
            </time>
            <span className="text-sm">
              {m.isHome ? t("vs") : t("at")} <strong>{m.opponent}</strong>
            </span>
            <span className={`font-mono text-sm ${outcomeClass}`}>
              {score}
              {m.outcome && (
                <span className="ml-2 text-xs">({t(`outcome.${m.outcome}`)})</span>
              )}
            </span>
            <span className="ml-auto font-mono text-xs text-foreground-subtle">
              {m.competitionName}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function formatDate(iso: string): string {
  const matchDate = new Date(iso);
  if (Number.isNaN(matchDate.getTime())) return iso;
  return matchDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
