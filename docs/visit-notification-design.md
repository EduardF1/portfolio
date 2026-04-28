# Visit-notification email — design doc

> **Status:** Approval pending. The route handler scaffold is committed but
> off by default (`VISIT_DIGEST_ENABLED` unset → 404). The `vercel.json`
> cron entry is wired but inert until the env flag flips. **Do not enable
> in Vercel Production until Eduard signs off on the open decisions in
> §9.**
>
> Backlog item: `docs/backlog.md` → "Visit-notification email" — opt-in
> per-day digest of unique visitors to `fischer_eduard@yahoo.com` via a
> Vercel cron job. *Approval needed before shipping.*

## 1. Goal

Send Eduard one short, plain-text email per day summarising the previous
day's visitor activity on the portfolio (`eduardfischer.dev`). The email
is a low-friction "did anyone read my site yesterday?" signal during the
job-search phase — not a real-time alert, not a dashboard replacement.
The existing `/admin/stats` page remains the source of truth for the
detailed view; this digest is a passive nudge so Eduard doesn't have to
open the dashboard daily.

## 2. Why daily digest, not per-visit

Per-visit emails were considered and rejected:

- **Spam risk.** A single recruiter scrolling four MDX pages plus the
  travel map would generate five emails. Worse, Vercel's edge analytics
  already double-fire on prefetch + view, so realistic traffic could
  inbox-bomb Eduard during a busy hour.
- **Recruiter-facing PII.** Per-visit alerts tempt the operator to
  un-anonymise the data ("who is this visit from?"). The hashed-IP /
  geo-only privacy posture documented at `/privacy` is easier to keep
  honest with an aggregate-only pipeline.
- **Stated preference.** Eduard explicitly chose "daily summary" in the
  backlog entry — daily is the sane default.
- **Cost.** Vercel cron invocations are free up to a generous quota; one
  fire per day stays well below the free tier. SMTP cost is also one
  outbound message per day vs. up to N per page-view.

If Eduard later wants real-time alerts for specific signal (e.g. "a
recruiter from LinkedIn scrolled to the bottom of `/work`"), that should
be a separate `notify-on-recruiter` route gated by its own flag — not a
generalisation of this digest.

## 3. Trigger

- **Platform:** Vercel Cron Jobs (defined in `vercel.json`).
- **Schedule:** `0 7 * * *` UTC = **09:00 Europe/Copenhagen** in CET
  (08:00 in CEST). See §9 for the open question on whether to track DST
  via two cron entries or accept the one-hour drift.
- **Path:** `/api/cron/visit-digest` (GET, called by Vercel's cron
  scheduler — Vercel signs the request with the `CRON_SECRET` you set in
  the project's env vars).

## 4. Data flow

```
Vercel Cron (daily 09:00 CET)
    │
    ▼
GET /api/cron/visit-digest
  │ Authorization: Bearer ${CRON_SECRET}    ← Vercel signs automatically
  │
  ├─ guard 1: VISIT_DIGEST_ENABLED === "1"  → else 404 "feature gated"
  ├─ guard 2: Authorization header matches  → else 401
  │
  ├─ Read yesterday's hits from Upstash:
  │     dayKeysForRange(now, 1)   from src/lib/analytics.ts
  │     → ["YYYY-MM-DD"]   (yesterday in UTC)
  │     getHits([yesterday])     from src/lib/redis-analytics.ts
  │
  ├─ Aggregate (all helpers already in src/lib/analytics.ts):
  │     totalVisits     = hits.length
  │     uniqueVisitors  = uniqueSessions(hits)
  │     topPages        = topN(countBy(hits, "path"), 5)
  │     topReferrers    = topN(countBy(hits, "ref-host"), 5)   [*]
  │     topCountries    = topN(countBy(hits, "country"), 5)
  │     deviceMix       = deviceMix(hits)
  │     standout        = detectStandouts(hits)                [**]
  │
  ├─ Compose plain-text email body (no HTML — see §5)
  │
  └─ Send via SMTP (DIGEST_SMTP_*)
       on send-fail → log + return 500 (Vercel will retry next cron tick)
       on no-data   → either send "0 visits yesterday" or skip (see §8)
```

[*] The `ref` field stored on each Hit is the full referrer URL; we
re-host-normalise via the existing `normalizeReferrer` helper before
counting. (`countBy(hits, "ref")` would top-N raw URLs which is not
what we want.)

[**] `detectStandouts` is the small bit of bespoke logic the digest
adds on top of analytics. Heuristics:

- LinkedIn referrer → flag the visit.
- User-Agent contains `recruit`, `talent`, `headhunt` → flag.
- Country is a tier-1 hiring market AND visit count > 1 → mention.
- All standouts use ALREADY-HASHED data (no PII) — the flag is a label
  on the aggregate row, not a per-IP dossier.

## 5. Email format

Plain text. No HTML. Reasons: (a) Yahoo's spam filter is friendlier to
plain text from new SMTP senders; (b) plain text removes the temptation
to embed pixel trackers / external images that would compromise the
"no third-party trackers" promise on `/privacy`.

Sketch:

```
Subject: portfolio — 12 visits yesterday (3 unique)

Yesterday (2026-04-26 UTC):
  Total page views:   12
  Unique visitors:    3
  Top pages:
    /work                   5
    /                       3
    /travel                 2
    /writing/hello-world    2

  Top referrers:
    linkedin.com            3   ← LinkedIn visit
    google.com              2
    (direct)                7

  Countries: DK 8, DE 3, US 1
  Devices:   desktop 9, mobile 3, tablet 0

Standouts:
  • LinkedIn referrer detected on /work (3 hits, desktop, DE)

Dashboard: https://eduardfischer.dev/admin/stats
Unsubscribe: set VISIT_DIGEST_ENABLED=0 in Vercel env.
```

The "Unsubscribe" line is for Eduard's own future self, not GDPR-style
recipient opt-out — the recipient is the operator, who controls the env
var directly.

## 6. Privacy

The digest must be GDPR-safe in line with the public commitment on
`src/app/privacy/page.tsx`:

> *"This site uses minimal first-party analytics. We record anonymous,
> aggregate hit data (path, country, browser type, referrer). No IP
> addresses, names, or persistent identifiers are stored."*

Concrete rules for the email body:

1. **No raw IPs.** The Hit shape (`src/lib/analytics.ts`) doesn't even
   carry an IP; only country/region/city from Vercel's `x-vercel-ip-*`
   headers. The digest cannot leak what we don't store.
2. **No session IDs in the email body.** `uniqueSessions()` returns a
   count, not the IDs. Even though session IDs are random and 30-min
   TTL, including them in an email would create a durable record outside
   Redis.
3. **City truncation.** If the standouts ever include city, round to
   country-level for any country where the day's traffic from that city
   is < 5. (Today's standouts only emit country, so this is forward-
   looking.)
4. **No User-Agent strings.** We bucket UAs into `browser` / `os` /
   `deviceType` at ingest time; the email body uses only those buckets,
   never the raw UA.
5. **Recipient is fixed.** `DIGEST_RECIPIENT` defaults to
   `fischer_eduard@yahoo.com`. The route does not accept a recipient
   from the request — there is no scenario where this digest is sent to
   anyone else.

## 7. Auth

Vercel Cron Jobs hit the route with the `Authorization: Bearer
${CRON_SECRET}` header set automatically when `CRON_SECRET` is defined
in the project's env vars (Vercel docs on cron). The route handler MUST
reject anything else with a 401, both to defend against external probes
and so that running the URL by hand in a browser fails closed.

```ts
const auth = request.headers.get("authorization");
if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response("Unauthorized", { status: 401 });
}
```

`CRON_SECRET` should be a 32+ byte random string (`openssl rand -hex
32`). Do not reuse the existing `ADMIN_SECRET` from `/admin/stats` — the
two surfaces have different blast radii.

## 8. Off-by-default

The route returns **404** with body `feature gated` whenever
`process.env.VISIT_DIGEST_ENABLED !== "1"`. This guard runs BEFORE the
auth check so even a leaked `CRON_SECRET` cannot trigger the side effect
(an outbound email) until the operator explicitly flips the flag.

Two flags exist:

- `VISIT_DIGEST_ENABLED=1` — server-only flag, the production switch.
- `NEXT_PUBLIC_PROTO_VISIT_DIGEST=1` — public flag, currently unused but
  reserved for a possible "preview the digest in /admin/stats" UI. The
  scaffold accepts EITHER flag for parity with the prototype-flag
  convention used elsewhere (`src/lib/proto-flags.ts`), but in practice
  only `VISIT_DIGEST_ENABLED` is needed.

The `vercel.json` cron entry is committed but documented as inert: the
cron WILL fire even with the flag off (Vercel cannot conditionally
schedule based on env), but every fire returns 404 immediately, so the
side effect (the email) does not happen. Eduard pays nothing extra.

## 9. Open decisions for Eduard

These are blockers Eduard has to resolve before merge / enable. The
scaffold is parameterised so each can flip without code changes.

1. **SMTP provider.** Three plausible options:
   - **Yahoo SMTP** (`smtp.mail.yahoo.com:465`, app password).
     **Recommended.** Eduard already owns the mailbox, Yahoo app
     passwords are free, no third-party signup. Caveat: Yahoo silently
     greylists new senders; the first few cron runs may bounce or land
     in spam, which is annoying but recoverable.
   - **Resend** — already a dependency for the contact form
     (`RESEND_API_KEY` in `.env.example`). Reusing it is the cheapest
     in dev-time. Caveat: Resend's free tier is 100 emails/day shared
     across all sending domains; the contact form already eats some of
     that budget.
   - **Postmark / SendGrid** — overkill for one email per day.
2. **Schedule.** `0 7 * * *` UTC = 09:00 CET / 08:00 CEST. Options:
   - Accept the DST drift (recommended for v1).
   - Use two cron entries with explicit UTC offsets per Europe/Copenhagen
     DST window (more accurate, more YAML).
   - Pick a different time entirely (e.g. 06:00 UTC = 07:00 CET, before
     Eduard's morning standup).
3. **Alert thresholds.** Should the digest skip silently on zero-visit
   days? Two views:
   - **Skip** — less inbox noise, but Eduard can't tell "0 visits" from
     "cron broken".
   - **Send "0 visits yesterday"** (recommended) — confirms the pipe is
     alive, costs one extra line.
4. **Standouts list.** Eduard should sanity-check the standout
   heuristics in §4 before they go live. The current set is a guess.
5. **Retention coordination.** The 90-day retention TODO in
   `redis-analytics.ts` (`purgeOlderThan`) is unrelated, but if it lands
   first the digest needs to read yesterday (still well within 90d), so
   no conflict.

## 10. Failure modes

| Failure                    | Behaviour                                          |
|----------------------------|----------------------------------------------------|
| Redis unavailable          | `getHits` returns `[]` → email "0 visits" (or skip per §9.3); never 5xx the cron, Vercel would retry |
| SMTP unreachable / 5xx     | Log, return 500 — Vercel retries on the next cron tick (24h). One missed day is acceptable. |
| `CRON_SECRET` unset        | Auth check fails for any caller including Vercel; gate it during ship checklist. |
| Flag flipped without env   | 404 immediately; no work done; cheap. |
| Yahoo greylists first run  | First email lands in spam; Eduard whitelists `noreply@*` from sender. Document in ship checklist. |
| Cron fires twice           | `recordHit` is idempotent at the per-hit level; the digest is read-only against Redis, so a double-fire sends two identical emails. Acceptable for v1. |

## 11. Implementation plan (from scaffold to ship)

The current scaffold (`src/app/api/cron/visit-digest/route.ts`) does
auth + flag gating + a stub response. The path from scaffold to shipped
feature is roughly:

1. **Resolve §9.1 (provider).** ~30 min — Eduard picks Yahoo or Resend.
2. **Wire SMTP send.** ~1.5 h — for Yahoo: `nodemailer` + app password
   over `smtp.mail.yahoo.com:465`. For Resend: reuse the contact-form
   code path.
3. **Implement aggregation.** ~1 h — wire `getHits` →
   `uniqueSessions` / `topN` / `countBy` / `deviceMix`, all already
   exported. Plus the `detectStandouts` helper (~30 min).
4. **Compose plain-text body.** ~30 min — string template; no HTML.
5. **Tests.** ~1 h — unit-test the aggregation/composition with a fake
   `Hit[]`; mock the SMTP transport; verify 401/404 paths.
6. **Ship checklist run.** ~15 min — set env vars, fire cron, verify
   email lands.

**Total estimate: 4-5 hours from scaffold to shipped, assuming Yahoo
SMTP and that Eduard has an app password ready.** Add another hour if
Resend is chosen and the free-tier quota needs splitting between the
contact form and the digest.

## 12. Ship checklist

Run by Eduard, in order, after design sign-off:

- [ ] **Decisions resolved.** §9.1 (provider), §9.2 (schedule), §9.3
      (zero-day behaviour), §9.4 (standouts) all confirmed.
- [ ] **Generate `CRON_SECRET`.** `openssl rand -hex 32`. Save in a
      password manager.
- [ ] **(Yahoo path)** Generate Yahoo app password at
      [Yahoo Account Security](https://login.yahoo.com/account/security).
      The "Mail (IMAP/SMTP)" app password works for both IMAP (existing
      MCP) and SMTP. Note: this is the same app password Eduard uses for
      the email MCP — separate one is fine for blast-radius isolation.
- [ ] **Set Vercel Production env vars** (Project → Settings → Env
      Variables, scope: Production):
      - `VISIT_DIGEST_ENABLED=1`
      - `CRON_SECRET=<the hex string>`
      - `DIGEST_SMTP_HOST=smtp.mail.yahoo.com` (Yahoo path) or
        `RESEND_API_KEY=<existing>` (Resend path)
      - `DIGEST_SMTP_PORT=465`
      - `DIGEST_SMTP_USER=fischer_eduard@yahoo.com`
      - `DIGEST_SMTP_PASSWORD=<app password>`
      - `DIGEST_RECIPIENT=fischer_eduard@yahoo.com` (default; redundant
        but explicit)
- [ ] **Redeploy Production.** Env-var changes do not auto-redeploy on
      Vercel; trigger a redeploy to pick them up.
- [ ] **Smoke-test the route.** From the Vercel dashboard, Cron Jobs →
      "Trigger" the entry once. Check the function log for a 200 + the
      log line `[digest] sent`.
- [ ] **Verify email landed.** Check `fischer_eduard@yahoo.com` inbox
      AND spam folder. If in spam: open it, mark "Not spam", whitelist
      the sender. After 1-2 successful deliveries Yahoo learns and
      future digests should land in the inbox.
- [ ] **Wait one calendar day.** The first scheduled fire (next 09:00
      CET) lands a real digest; verify.
- [ ] **(Optional)** Update `docs/backlog.md` to mark the item shipped.

Rollback: set `VISIT_DIGEST_ENABLED=0` (or unset entirely) and redeploy.
The cron continues to fire but every call returns 404 and no email is
sent. To stop the cron entirely, remove the entry from `vercel.json`
and redeploy.
