import { getStaysForTrip, type TripStay } from "@/lib/trip-stays";

const MONTHS_EN_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format a stay as e.g. "12–14 Apr" or "30 Apr – 2 May" or, when the
 *  range straddles a year, "30 Dec 2024 – 2 Jan 2025".
 */
function formatStayRange(stay: TripStay): string {
  const ci = new Date(stay.checkIn);
  const co = new Date(stay.checkOut);
  const ciD = ci.getUTCDate();
  const coD = co.getUTCDate();
  const ciM = MONTHS_EN_SHORT[ci.getUTCMonth()];
  const coM = MONTHS_EN_SHORT[co.getUTCMonth()];
  const ciY = ci.getUTCFullYear();
  const coY = co.getUTCFullYear();

  if (ciY !== coY) {
    return `${ciD} ${ciM} ${ciY} – ${coD} ${coM} ${coY}`;
  }
  if (ciM === coM) {
    return `${ciD}–${coD} ${ciM}`;
  }
  return `${ciD} ${ciM} – ${coD} ${coM}`;
}

/**
 * Server component: lists every Airbnb stay for a given trip slug.
 * Renders nothing (returns null) when there are no stays for the slug —
 * callers can drop it into any per-trip page without a guard.
 */
export async function TripStays({ slug }: { slug: string }) {
  const stays = await getStaysForTrip(slug);
  if (stays.length === 0) return null;

  return (
    <ul className="my-4 list-disc pl-6 marker:text-foreground-subtle">
      {stays.map((s) => (
        <li key={`${s.checkIn}-${s.city}`} className="my-2 text-foreground">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground-subtle">
            {formatStayRange(s)}
          </span>{" "}
          <span>
            {s.city}, {s.country}
          </span>{" "}
          <span className="text-foreground-subtle">— {s.type}</span>
        </li>
      ))}
    </ul>
  );
}
