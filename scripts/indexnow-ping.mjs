#!/usr/bin/env node
// Ping IndexNow (Bing / Yandex / Naver / Seznam / Yep) with the current
// sitemap URLs after a Vercel production build. No-op outside production
// to avoid pinging the world from preview deploys or local builds.

const KEY = "1ef642737df50c4b2f7ff66e6e99379a";
const SITE = "https://eduardfischer.dev";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const SITEMAP_URL = `${SITE}/sitemap.xml`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

if (process.env.VERCEL_ENV !== "production") {
  console.log(`[indexnow] skip (VERCEL_ENV="${process.env.VERCEL_ENV ?? ""}")`);
  process.exit(0);
}

async function main() {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) {
    console.error(`[indexnow] failed to fetch sitemap: ${res.status}`);
    process.exit(0);
  }
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) {
    console.warn("[indexnow] sitemap returned no URLs, skipping");
    process.exit(0);
  }

  const body = {
    host: new URL(SITE).host,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  const ping = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  console.log(
    `[indexnow] pinged ${urls.length} URLs → ${ping.status} ${ping.statusText}`,
  );
}

main().catch((err) => {
  console.error("[indexnow] unexpected error:", err);
  process.exit(0);
});
