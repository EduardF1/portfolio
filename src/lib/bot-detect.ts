/**
 * Lightweight bot / datacenter detector for the analytics layer.
 *
 * Two independent signals:
 *   1. User-Agent substring match against a curated list of known
 *      crawlers, AI-training bots, headless browsers, and chat-link
 *      previewers. The match is case-insensitive and substring-based,
 *      not anchored, because vendors append version / capability
 *      tokens we don't want to chase.
 *   2. IP-CIDR match against the top cloud-datacenter ranges. This is
 *      not exhaustive (full lists are tens of MB) but covers the
 *      majority of the bot traffic the dashboard sees in practice
 *      (GCP IA / OR / VA, AWS, Azure, OVH, Hetzner, DO, Cloudflare).
 *
 * Either signal alone marks the hit as bot-like. Callers (the stats
 * endpoint, the dashboard's filter) read the union, never the
 * individual signals.
 *
 * Kept dependency-free and side-effect-free so it's trivially
 * unit-testable and safe to import from Edge runtime.
 */

const BOT_UA_PATTERNS: readonly string[] = [
  // Search-engine crawlers
  "googlebot",
  "bingbot",
  "slurp",
  "duckduckbot",
  "baiduspider",
  "yandex",
  "applebot",
  // Social-link previewers
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "discordbot",
  "telegrambot",
  "whatsapp",
  // AI-training crawlers
  "gptbot",
  "chatgpt-user",
  "claudebot",
  "anthropic-ai",
  "perplexitybot",
  // Headless / automated browsers
  "headlesschrome",
  "phantomjs",
  "puppeteer",
  "playwright",
] as const;

/**
 * Top-10-ish most-common datacenter CIDR ranges, stored as
 * [networkInt, prefix] tuples. Full vendor lists are huge (AWS alone
 * publishes ~6k IPv4 prefixes); these cover the ranges that actually
 * appeared in the last-7-days bot traffic (Council Bluffs IA, The
 * Dalles OR, Ashburn VA, plus a few other obvious vendors).
 *
 * Only IPv4 for now. IPv6 datacenter detection is a separate problem
 * (rangers are 100x as large and the bot traffic is overwhelmingly v4).
 */
const DATACENTER_CIDRS_V4: ReadonlyArray<readonly [string, number]> = [
  // Google Cloud — covers Council Bluffs (us-central1), The Dalles
  // (us-west1), and Ashburn (us-east4) which are the three GCP
  // regions Eduard's dashboard sees most bot hits from.
  ["8.34.208.0", 20],
  ["8.35.192.0", 20],
  ["34.64.0.0", 10],
  ["35.184.0.0", 13],
  ["35.192.0.0", 14],
  ["35.196.0.0", 15],
  ["35.198.0.0", 16],
  ["35.199.0.0", 17],
  ["35.200.0.0", 13],
  ["35.208.0.0", 12],
  ["35.224.0.0", 12],
  ["35.240.0.0", 13],
  ["104.154.0.0", 15],
  ["104.196.0.0", 14],
  ["107.167.160.0", 19],
  ["107.178.192.0", 18],
  ["108.59.80.0", 20],
  ["108.170.192.0", 20],
  ["108.177.0.0", 17],
  ["130.211.0.0", 16],
  ["146.148.0.0", 17],
  ["162.216.148.0", 22],
  ["162.222.176.0", 21],
  ["173.255.112.0", 20],
  ["192.158.28.0", 22],
  ["199.192.112.0", 22],
  ["199.223.232.0", 21],
  ["208.68.108.0", 22],
  // AWS — broadest public ranges
  ["3.0.0.0", 8],
  ["13.32.0.0", 15],
  ["13.224.0.0", 14],
  ["18.0.0.0", 8],
  ["35.71.64.0", 22],
  ["52.0.0.0", 8],
  ["54.0.0.0", 8],
  ["99.77.128.0", 17],
  ["99.78.128.0", 18],
  ["172.96.96.0", 20],
  ["205.251.192.0", 18],
  // Azure
  ["13.64.0.0", 11],
  ["13.96.0.0", 13],
  ["13.104.0.0", 14],
  ["20.0.0.0", 8],
  ["23.96.0.0", 13],
  ["40.64.0.0", 10],
  ["52.224.0.0", 11],
  ["104.40.0.0", 13],
  ["131.107.0.0", 16],
  ["157.55.0.0", 16],
  // OVH
  ["51.38.0.0", 16],
  ["51.68.0.0", 14],
  ["51.75.0.0", 16],
  ["51.83.0.0", 16],
  ["51.91.0.0", 16],
  ["51.178.0.0", 15],
  ["54.36.0.0", 14],
  ["91.121.0.0", 16],
  ["94.23.0.0", 16],
  ["167.114.0.0", 16],
  ["176.31.0.0", 16],
  ["198.27.64.0", 18],
  // Hetzner
  ["5.9.0.0", 16],
  ["46.4.0.0", 16],
  ["78.46.0.0", 15],
  ["88.99.0.0", 16],
  ["94.130.0.0", 16],
  ["116.202.0.0", 15],
  ["136.243.0.0", 16],
  ["138.201.0.0", 16],
  ["144.76.0.0", 16],
  ["148.251.0.0", 16],
  ["159.69.0.0", 16],
  ["176.9.0.0", 16],
  ["188.40.0.0", 16],
  ["213.133.96.0", 19],
  // DigitalOcean
  ["45.55.0.0", 16],
  ["46.101.0.0", 16],
  ["104.131.0.0", 16],
  ["104.236.0.0", 16],
  ["107.170.0.0", 16],
  ["134.122.0.0", 16],
  ["134.209.0.0", 16],
  ["138.68.0.0", 16],
  ["138.197.0.0", 16],
  ["139.59.0.0", 16],
  ["142.93.0.0", 16],
  ["143.110.0.0", 16],
  ["143.198.0.0", 16],
  ["146.190.0.0", 16],
  ["157.230.0.0", 16],
  ["159.65.0.0", 16],
  ["159.89.0.0", 16],
  ["159.203.0.0", 16],
  ["161.35.0.0", 16],
  ["165.22.0.0", 16],
  ["167.71.0.0", 16],
  ["167.99.0.0", 16],
  ["170.64.0.0", 16],
  ["178.62.0.0", 16],
  ["188.166.0.0", 16],
  ["188.226.128.0", 17],
  ["192.241.128.0", 17],
  // Cloudflare (workers + warp endpoints often originate here)
  ["103.21.244.0", 22],
  ["103.22.200.0", 22],
  ["103.31.4.0", 22],
  ["104.16.0.0", 12],
  ["108.162.192.0", 18],
  ["131.0.72.0", 22],
  ["141.101.64.0", 18],
  ["162.158.0.0", 15],
  ["172.64.0.0", 13],
  ["173.245.48.0", 20],
  ["188.114.96.0", 20],
  ["190.93.240.0", 20],
  ["197.234.240.0", 22],
  ["198.41.128.0", 17],
] as const;

/**
 * Parse a dotted-quad IPv4 to a 32-bit unsigned integer. Returns
 * `null` for anything that doesn't parse cleanly (IPv6, garbage, etc).
 */
export function ipv4ToInt(ip: string | null | undefined): number | null {
  if (!ip) return null;
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let acc = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n < 0 || n > 255) return null;
    acc = (acc * 256 + n) >>> 0;
  }
  return acc >>> 0;
}

function getCidrCache(): Array<readonly [number, number, number]> {
  // Cache the (network, mask, prefix) tuples on first use so we don't
  // re-parse the dotted-quad strings on every check.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (g.__botCidrCache) return g.__botCidrCache;
  const out: Array<readonly [number, number, number]> = [];
  for (const [net, prefix] of DATACENTER_CIDRS_V4) {
    const n = ipv4ToInt(net);
    if (n === null) continue;
    // /0 is a special case (any address) and we never want one in our
    // CIDR table; skip it defensively.
    if (prefix === 0) continue;
    const mask = ((0xffffffff << (32 - prefix)) >>> 0) >>> 0;
    out.push([n & mask, mask, prefix] as const);
  }
  g.__botCidrCache = out;
  return out;
}

/**
 * Returns true if the given IPv4 falls inside one of the embedded
 * datacenter CIDR ranges. IPv6 / unparseable inputs always return
 * false (we can't classify them).
 */
export function isDatacenterIp(ip: string | null | undefined): boolean {
  const asInt = ipv4ToInt(ip);
  if (asInt === null) return false;
  for (const [net, mask] of getCidrCache()) {
    if ((asInt & mask) === net) return true;
  }
  return false;
}

/**
 * Returns true if the User-Agent string matches one of the known-bot
 * substrings. Comparison is case-insensitive. Missing UA counts as
 * a bot — real browsers never send an empty UA.
 */
export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true;
  const s = ua.toLowerCase();
  for (const pat of BOT_UA_PATTERNS) {
    if (s.includes(pat)) return true;
  }
  return false;
}

/**
 * Combined predicate: a hit is bot-like if EITHER the UA matches a
 * known crawler OR the IP falls in a known datacenter range. Callers
 * (stats endpoint, dashboard filter) read this union; individual
 * signals are exported for tests and the raw-payload preview only.
 */
export function isBotHit({
  ua,
  ip,
}: {
  ua?: string | null;
  ip?: string | null;
}): boolean {
  return isBotUserAgent(ua) || isDatacenterIp(ip);
}

export const BOT_UA_LIST_FOR_TESTS: readonly string[] = BOT_UA_PATTERNS;
