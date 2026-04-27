/**
 * Pure aggregation + plain-text composition for the daily visit
 * digest. No I/O, no env var reads — the cron route does all the
 * Redis fetching and passes the raw inputs in here. That keeps the
 * function trivially unit-testable and keeps the route handler thin.
 *
 * See `docs/visit-notification-design.md` for the email format spec.
 */

export type DigestInput = {
  /** UTC date the digest covers, yyyy-MM-dd. */
  day: string;
  /**
   * Total page views for the day. Sum of all `pageviews:DAY:<path>`
   * counters, OR `hits.length` if you want to derive it from the
   * raw hits log.
   */
  totalPageViews: number;
  /** Distinct IP-hashes for the day (from `visit-tracker`). */
  uniqueVisitors: number;
  /** Top pages by view count, descending. */
  topPages: Array<{ path: string; views: number }>;
  /** Top palette × theme combo, or null if unavailable. */
  topPaletteTheme: { palette: string; theme: string; count: number } | null;
};

export type DigestOutput = {
  subject: string;
  body: string;
};

/**
 * Compose the plain-text email body. Plain text by design (see
 * design-doc §5: friendlier to Yahoo's spam filter, no temptation to
 * embed pixel trackers, easier to keep aligned with the no-PII
 * promise on `/privacy`).
 *
 * Empty days render a "0 visits yesterday" line so Eduard can tell
 * "nothing happened" from "cron is broken" (design-doc §9.3, default
 * = send-on-zero).
 */
export function composeDigest(input: DigestInput): DigestOutput {
  const subject = `portfolio — ${input.totalPageViews} visit${
    input.totalPageViews === 1 ? "" : "s"
  } yesterday (${input.uniqueVisitors} unique)`;

  const lines: string[] = [];
  lines.push(`Yesterday (${input.day} UTC):`);
  lines.push(`  Total page views:   ${input.totalPageViews}`);
  lines.push(`  Unique visitors:    ${input.uniqueVisitors}`);
  lines.push("");

  if (input.topPages.length === 0) {
    lines.push("  Top pages:          (none)");
  } else {
    lines.push("  Top pages:");
    const widest = Math.max(...input.topPages.map((p) => p.path.length));
    for (const p of input.topPages) {
      lines.push(`    ${p.path.padEnd(widest)}  ${p.views}`);
    }
  }
  lines.push("");

  if (input.topPaletteTheme) {
    const { palette, theme, count } = input.topPaletteTheme;
    lines.push(`  Top palette × theme: ${palette} × ${theme} (${count})`);
  } else {
    lines.push("  Top palette × theme: —");
  }
  lines.push("");

  lines.push("Dashboard: https://eduardfischer.dev/admin/stats");
  lines.push("Unsubscribe: unset NEXT_PUBLIC_PROTO_VISIT_DIGEST in Vercel env.");

  return { subject, body: lines.join("\n") };
}
