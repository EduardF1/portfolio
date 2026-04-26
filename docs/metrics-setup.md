# Metrics POC — setup

This is a tiny first-party analytics stack (visit tracking + admin dashboard)
plus a public GitHub-stats widget. Lives entirely on the portfolio's existing
Vercel deployment; the only external service is Upstash Redis (REST).

## Architecture (tl;dr)

```
visitor → <VisitTracker /> → POST /api/track  (Edge runtime)
                                  ├── reads x-vercel-ip-* headers (geo)
                                  ├── parses User-Agent → buckets
                                  ├── mints/reuses pf_session cookie
                                  └── writes to Upstash Redis (REST)

Eduard → /admin/stats?key=…  →  sets pf_admin cookie  →  reads Redis
                                                           and renders dashboard
```

Storage shape:

| Key                             | Type   | Purpose                            |
| ------------------------------- | ------ | ---------------------------------- |
| `hits:YYYY-MM-DD`               | ZSET   | one JSON Hit per page-view         |
| `sessions:YYYY-MM-DD`           | SET    | unique session ids per UTC day     |
| `pageviews:YYYY-MM-DD:<path>`   | STRING | INCR counter (fast top-pages read) |
| `referrers:YYYY-MM-DD`          | ZSET   | ZINCRBY referrer host → count      |

Every key auto-expires after 95 days, so even if the cleanup cron is never
wired up the data set self-trims. **TODO:** add a Vercel Cron route at
`/api/cron/purge-analytics` that runs a daily SCAN+DEL pass for keys older
than 90 days. Out of scope for the POC.

## Required env vars (Vercel → Project → Settings → Environment Variables)

### Production / Preview / Development

| Name                          | Value                       | Notes                                                         |
| ----------------------------- | --------------------------- | ------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`      | `https://xxxx.upstash.io`   | From Upstash console — copy the REST URL, not the Redis URL. |
| `UPSTASH_REDIS_REST_TOKEN`    | `AX…` (long opaque token)   | Read+Write token. Use a separate read-only token for…         |
| `ADMIN_SECRET`                | `openssl rand -hex 32`      | Random 32+ char string. Bookmark `/admin/stats?key=<secret>`. |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `1` (prod) / unset (dev) | When unset, `<VisitTracker />` is a no-op.                    |
| `GITHUB_TOKEN` (optional)     | classic PAT, public-repo    | Lifts the GitHub API rate limit from 60/hr to 5 000/hr.       |

If `UPSTASH_*` are unset, `/api/track` becomes a 204 no-op and the dashboard
shows an "empty state" banner. The site builds and deploys cleanly without
any of these set — handy for local dev.

## Step-by-step Vercel setup

1. **Create the Upstash database**
   - Sign up at <https://upstash.com/> (GitHub login is fine).
   - Create a new Redis database. Pick the region closest to your Vercel
     deployment region (Frankfurt for Europe).
   - On the database page, scroll to *REST API*. Copy the `UPSTASH_REDIS_REST_URL`
     and `UPSTASH_REDIS_REST_TOKEN` values.
   - Or: install the Vercel ↔ Upstash integration
     (<https://vercel.com/integrations/upstash>) — it'll inject the env vars
     into your Vercel project automatically.

2. **Generate `ADMIN_SECRET`**

   ```bash
   openssl rand -hex 32
   ```

   Paste that into Vercel as `ADMIN_SECRET`. Bookmark `https://eduardfischer.dev/admin/stats?key=<that>`
   on every device you'll use to check stats. After the first visit the
   cookie does the rest for 90 days.

3. **Set `NEXT_PUBLIC_ANALYTICS_ENABLED=1`** in Production only. Leave it
   unset in Preview and Development so PR previews and local runs don't
   pollute the dataset.

4. **(Optional) Generate a GitHub PAT** for the public stats widget:
   - <https://github.com/settings/personal-access-tokens/new>
   - Classic token, scope: `public_repo` is enough. No expiry, or a long one.
   - Paste it into Vercel as `GITHUB_TOKEN`.

5. **Redeploy.** The dashboard is now live at `/admin/stats?key=<secret>`,
   `/api/track` is recording, and the GitHub widget shows hourly-refreshed
   numbers on `/work`.

## Local dev

```bash
# Without Upstash — site works, /api/track is a 204 no-op, dashboard shows empty state.
npm run dev

# With Upstash, but tracking off (good for testing the dashboard
# without populating prod data):
UPSTASH_REDIS_REST_URL=… UPSTASH_REDIS_REST_TOKEN=… ADMIN_SECRET=foo npm run dev

# Full stack locally — visit a page, then hit:
#   http://localhost:3000/admin/stats?key=foo
```

There is no mock-data path bundled — local Redis is not required. If you
want to seed data without Upstash for a screenshot, it's quicker to spin up
a free Upstash sandbox DB than to add a fake-Redis layer.

## Verifying it works

1. Open Chrome DevTools → Network → `track`. After page load you should
   see `POST /api/track` → 204, with a `Set-Cookie: pf_session=…` on the
   first call.
2. Hit `/admin/stats?key=<secret>`. You should see your one hit on the
   "Today" tab.
3. Hit it again from a different browser to verify unique-session counts
   increment correctly.

## Privacy posture (visible at `/privacy`)

- No raw IPs are stored anywhere — only `country`/`region`/`city` from
  Vercel's pre-resolved `x-vercel-ip-*` headers.
- Session ids are random 16-byte hex, HTTP-only, SameSite=Lax, 30-min TTL.
- `pf_admin=1` skips recording so Eduard's own browsing doesn't pollute
  the dataset.
- No third-party trackers, no analytics SDKs, no cookies beyond the two
  named above.
