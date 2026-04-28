# A21 — Palette × theme preference analytics (scaffold + design doc)

Branch: `feat/v1-polish-round4` (no commits made — handed back clean).

Backlog item: anonymous count of which palette × theme combination
visitors prefer, so Eduard can pick the default. SCOPE ONLY — design
doc + flag-gated, off-by-default scaffold. Nothing is wired into the
running app, no data is collected on prod.

## Files created (4)

1. `docs/palette-analytics-design.md` — full design doc (goal, privacy,
   storage shape, client trigger, off-by-default contract, open
   decisions, wiring plan, known limitations).
2. `src/app/api/track-palette/route.ts` — Edge runtime POST handler
   gated on `NEXT_PUBLIC_PROTO_PALETTE_TRACK === "1"`. Validates body,
   honours `pf_admin` cookie + `DNT`/`Sec-GPC` headers, increments
   Upstash counters via `SET … NX EX` dedup pattern. Returns 404 when
   flag is off (route is invisible to probes).
3. `src/components/palette-tracker.tsx` — `"use client"` component
   that reads `usePalette()` + `useTheme()`, generates a per-tab
   `sessionStorage` UUID, POSTs once per mount when the flag is on.
   Renders nothing.
4. `.env.example` — added `NEXT_PUBLIC_PROTO_PALETTE_TRACK=` block
   with a pointer to the design doc.

## Files NOT touched (per scope)

- `src/components/palette-selector.tsx` — untouched.
- `src/components/theme-toggle.tsx` — untouched.
- `src/lib/analytics.ts` — untouched.
- `src/app/api/track/route.ts` — untouched.
- No mounting of `<PaletteTracker />` anywhere; the layout is unchanged.
- No additions to `src/lib/redis-analytics.ts`; the route inlines its
  own minimal Upstash pipeline helper to keep this scaffold
  self-contained (call out for the wiring step to switch to the
  shared helper).
- No new env vars beyond the single flag.

## Off-by-default contract (three independent gates)

1. **Build-time:** `NEXT_PUBLIC_PROTO_PALETTE_TRACK !== "1"` → the
   client component returns `null` before doing any work, the
   condition is a static literal so Next can tree-shake the body.
2. **Server-runtime:** the route handler returns plain
   `404 Not Found` with no JSON when the same env var is not `"1"` —
   indistinguishable from a generic 404. Even GET returns 404 in this
   state (only flips to 405 when the flag is on).
3. **Redis presence:** if `UPSTASH_REDIS_REST_URL/TOKEN` (or the
   `KV_REST_API_URL/TOKEN` Vercel-integration variants) are unset,
   the route still returns `{ ok: true }` but writes nothing. Local
   dev is a perfect no-op.

Plus: `pf_admin=1` cookie short-circuits writes (Eduard's own
browser), and `DNT: 1` / `Sec-GPC: 1` headers are honoured.

## Privacy posture

- Stored fields per accepted hit: palette slug + theme + server
  timestamp implicit in the `INCR`. Nothing else.
- No raw IP, no UA, no path, no referer.
- Dedup hash is per-tab (`sessionStorage`), client-generated via
  `crypto.randomUUID()`, expires when the tab closes. Server stores
  it under a 24 h TTL Redis key purely for "did we already count
  this?" guarding.
- Counter keys carry a 95-day TTL safety net.

## Storage shape (Upstash Redis, existing infra)

| Key                              | Type    | TTL   | Purpose                       |
| -------------------------------- | ------- | ----- | ----------------------------- |
| `palette:<palette>:<theme>`      | counter | 95 d  | Bumped per accepted hit       |
| `palette-session:<hash>`         | string  | 24 h  | `SET … NX EX` dedup guard     |

Atomic claim pattern: `SET palette-session:<hash> 1 EX 86400 NX`. If
NX returns `"OK"`, we proceed to `INCR` the counter; otherwise we
short-circuit. Concurrent requests with the same hash all see exactly
one increment.

## Open decisions for Eduard

These are intentionally NOT decided in the scaffold. Pick before
flipping the flag on:

- **Bucket window** — cumulative (current) vs rolling 7-day (would
  require `palette:<palette>:<theme>:<day>` keys, like
  `pageviews:<day>:<path>` already does in `redis-analytics.ts`).
- **Display format** on `/admin/stats` — sorted list, stacked bar,
  or 3×2 heatmap. Drives the read-side helper signature.
- **Sample rate** — unsampled is fine until Eduard sees >10k
  visits/day, at which point a 1/N sample preserves proportions
  cheaply.
- **Opt-out wording on `/privacy`** — scaffold respects DNT and GPC;
  confirm the privacy page mentions both (or harmonise to whichever
  is canonical).
- **Drift in palette list** — today there are 3 palettes
  (`schwarzgelb`, `mountain-navy`, `woodsy-cabin`). The route inlines
  the allow-list; a follow-up should extract a shared constant module
  so we don't drift if a 4th lands. (The brief mentioned "4 palette
  slugs" — only 3 exist in the codebase. Confirm intent.)
- **Re-fire on user change** — current scaffold fires once per mount
  ("first impression"). Yes-on-change is a different signal
  ("engagement"). Pick one before flipping the flag on.

## Mounting note (follow-up, NOT done in this scope)

To make this live after Eduard signs off:

1. Render `<PaletteTracker />` somewhere inside both
   `<PaletteProvider>` and the `<ThemeProvider>` — the natural home
   is alongside any existing visit-tracker in
   `src/app/[locale]/layout.tsx`. (There's a `VisitTracker` component
   in the repo but it's not yet mounted on this branch from what I
   can see — wiring is its own task.)
2. Add a `getPaletteCounts()` helper to
   `src/lib/redis-analytics.ts` (pipeline of 6 GETs over the 3×2
   key matrix).
3. Render a "Palette preferences" section in `/admin/stats`.
4. Set `NEXT_PUBLIC_PROTO_PALETTE_TRACK=1` on the prototype Vercel
   environment, deploy, smoke-test with a curl POST.
5. Leave it on for a week; pick the winning default; remove the
   scaffold.

## Validation

- `npx tsc --noEmit` → exit 0, clean.
- Did not run `next build` (this is scope-only; nothing is mounted in
  the layout, so build wouldn't exercise the new client component).
- Route handler signature matches
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
  (Edge runtime, named `POST`/`GET` exports, `Request`-typed param).
- Used the same `cookies()` / `headers()` await-pattern as the
  existing `/api/track` route — confirmed `await` is required (Next 15+
  contract).

## Estimated effort to ship from here

**~3-4 hours** to take this from scope to shipped:

- 30 min — extract palette-list constant module so route + provider
  share one source of truth.
- 30 min — add `getPaletteCounts()` to `redis-analytics.ts` + unit
  test (vitest pattern matches `redis-analytics.test.ts`).
- 30 min — switch the route to import from the shared helper;
  delete the inlined pipeline.
- 60 min — render the preferences section in `/admin/stats`
  (depends on Eduard's display-format pick).
- 30 min — mount `<PaletteTracker />` in the locale layout, wired
  inside the existing providers; add a vitest smoke test that the
  component returns null when the flag is off.
- 30 min — set env var on Vercel prototype, deploy, smoke-test,
  confirm the counter increments.

Decisions Eduard owes before that timer starts:
- bucket window (cumulative vs 7-day rolling)
- display format on `/admin/stats`
- whether to re-fire on palette/theme change
- privacy-page wording around DNT/GPC

## Quality notes

- **No mounting in scope.** Even though it's tempting, mounting the
  tracker is the wiring step, not the scaffold step. The component
  and the route are dead code in the bundle until both the env var
  flips on AND the tracker is mounted in a layout. This is the
  right tradeoff for "design first, ship later."
- **Self-contained scaffold.** The route file inlines its own
  minimal Upstash pipeline helper rather than importing from
  `src/lib/redis-analytics.ts`. This is deliberate: it keeps the
  scaffold reviewable in isolation, and the wiring step gets to
  decide whether to extract a third caller (the existing `recordHit`
  has its own shape) or just reuse the existing helpers verbatim.
- **Indistinguishable 404.** When the flag is off, the route returns
  `Not Found` with no JSON body, no hint that the URL exists. A
  visitor poking around the network tab can't tell this is a real
  endpoint vs a typo.
- **Does NOT read user-agent.** The privacy contract is stricter
  than `/api/track`: that route stamps in geo/UA buckets server-
  side; this one doesn't, because the feature only needs the
  palette × theme tuple.
