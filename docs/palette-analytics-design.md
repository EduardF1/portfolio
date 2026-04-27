# Palette analytics — design doc (prototype scaffold)

Status: SCOPE ONLY. Off by default. No data collected on prod until the
flag is flipped on the prototype env and the tracker component is
mounted in the layout (intentionally NOT done yet).

Backlog item: anonymous count of which palette × theme combination
visitors prefer, so Eduard can pick a sensible default for v1+.

## 1. Goal

Aggregate, anonymous count of `(palette, theme)` pairs over time. The
result is a small ranking visible on `/admin/stats` (already
ADMIN_SECRET-gated) of the form:

```
mountain-navy + dark      54.2%
schwarzgelb   + dark      18.1%
woodsy-cabin  + light     12.7%
mountain-navy + light     10.0%
schwarzgelb   + light      3.1%
woodsy-cabin  + dark       1.9%
```

Output drives one decision: which palette × theme should be the served
default in `PaletteProvider` / `ThemeProvider`. Nothing else.

## 2. Privacy posture

Matches the existing `/api/track` and `/privacy` page contract:

- **No PII.** No raw IP, no UA string, no referer.
- Stored fields are: palette slug, theme (`light` | `dark`), server
  timestamp, and a hashed-per-tab session ID used only for dedup.
- The session hash is generated in the browser via `crypto.randomUUID()`
  and lives in `sessionStorage` (so it expires when the tab closes —
  shorter than the per-day visit cookie used by `/api/track`).
- A 24-hour Redis TTL on `palette-session:<hash>` means we only count
  the first palette+theme a visitor lands on per day-ish window. They
  can flip palettes 50 times in one tab; we record one event.
- `pf_admin=1` cookie present → server drops the hit on the floor (same
  rule as `/api/track`).
- Honour `Sec-GPC: 1` and `DNT: 1` request headers — when either is
  set, return 204 without writing.
- The data is purely an aggregate counter. There is no way to
  reconstruct an individual session's path even with full Redis access.

## 3. Storage (Upstash Redis — existing infra)

Two key shapes, both with TTLs so cold paths self-expire:

| Key                                            | Type    | Purpose                                      | TTL      |
| ---------------------------------------------- | ------- | -------------------------------------------- | -------- |
| `palette:<palette>:<theme>`                    | counter | `INCR` on each non-deduped event             | 95 days  |
| `palette-session:<hash>`                       | string  | dedup: present means we already counted this | 24 hours |

Pipeline per accepted hit:

```
SET    palette-session:<hash>  1   EX 86400  NX   # NX = only if absent
INCR   palette:<palette>:<theme>                  # only if SET returned OK
EXPIRE palette:<palette>:<theme> 8208000          # 95 d safety net
```

If the `SET … NX` returns null (already present) we short-circuit and
don't increment. This keeps the contract "one count per hash per 24 h"
even under concurrent requests (Redis pipelines are atomic per command;
the NX guard is the source of truth).

Reuses the existing `redis-analytics.ts` REST helpers (`execPipeline`,
`execOne`) — no new dependency, works on Edge runtime.

## 4. Client trigger

`<PaletteTracker />` is a tiny client component that mounts on every
page (when wired in — see §8 below). Behaviour:

1. If `process.env.NEXT_PUBLIC_PROTO_PALETTE_TRACK !== "1"` → return
   `null`, never fetch. The whole component tree-shakes to a no-op when
   the env var is unset (same pattern as `VisitTracker`).
2. Reads the current palette via `usePalette()` (from
   `palette-provider.tsx`) and the current theme via `useTheme()` from
   `next-themes`.
3. On first mount, if the tab does not already have a session hash in
   `sessionStorage["palette-track-hash"]`, generate one with
   `crypto.randomUUID()` and store it.
4. POST `{ palette, theme, sessionHash }` to `/api/track-palette` with
   `keepalive: true`. Failures are swallowed.
5. Renders nothing.

It deliberately does NOT re-fire when the user toggles palette or
theme. This is by design: we want first-impression counts, not "how
much did this user fiddle with the picker". A re-fire-on-change
variant is a possible follow-up but is explicitly out of scope.

## 5. Aggregation / display

The `/admin/stats` dashboard (already protected by `ADMIN_SECRET`)
gains a "Palette preferences" section that:

- Calls a new `getPaletteCounts()` helper in `redis-analytics.ts`
  (NOT in this scaffold — follow-up).
- Iterates `palette × theme` (3 palettes × 2 themes = 6 keys) via a
  pipeline of `GET` commands.
- Renders a small bar chart or sorted list, with absolute counts and
  a percentage column.

Counters are cumulative. To answer "what's preferred *recently*" we'd
need either a rolling window (see §7) or a per-day key shape — see
open decisions.

## 6. Off-by-default contract

Three independent gates have to all be set for any data to flow:

1. **Build time:** `NEXT_PUBLIC_PROTO_PALETTE_TRACK=1` at build (Vercel
   prototype env). Otherwise the client component returns `null` and
   compiles to ~empty.
2. **Server runtime:** the route handler returns `404 Not Found` with
   no body when the same env var is not `"1"`. Even if a curious
   visitor finds the URL, they get a 404 indistinguishable from any
   other unknown route.
3. **Redis presence:** if `UPSTASH_REDIS_REST_URL/TOKEN` (or the
   `KV_REST_API_URL/TOKEN` Vercel-integration variants) are unset,
   the route still returns `{ ok: true }` but writes nothing. Local
   dev never hits Redis.

To turn this on in prototype:

```
# Vercel project → Prototype environment → env vars
NEXT_PUBLIC_PROTO_PALETTE_TRACK = 1
```

…then redeploy prototype. To turn off, unset and redeploy.

## 7. Open decisions for Eduard

These are intentionally NOT decided in the scaffold; they affect data
modelling and should be picked before flipping the flag on:

- **Bucket window.** Cumulative (current scaffold) vs rolling 7-day
  (would require `palette:<palette>:<theme>:<day>` keys, like
  `pageviews:<day>:<path>` already does in `redis-analytics.ts`).
  Rolling is more useful if Eduard's audience changes; cumulative is
  simpler and matches "pick a default once".
- **Display format on `/admin/stats`.** Sorted list vs stacked bar
  chart vs heatmap (3×2 grid). Picking the visualisation also drives
  the read-side helper signature.
- **Sample rate.** If traffic ever ramps to >10k visits/day, sampling
  to 1/N preserves the proportions while keeping Upstash request
  budget low. Current scaffold is unsampled (1/1).
- **Opt-out signal.** Scaffold respects `Sec-GPC: 1` and `DNT: 1`
  request headers. Confirm this matches Eduard's `/privacy` page
  language; if the page only mentions DNT, harmonise wording.
- **Drift in palette list.** Today there are 3 palettes
  (`schwarzgelb`, `mountain-navy`, `woodsy-cabin`). If a 4th is added,
  the validator in the route handler must be updated. Single source of
  truth would be importing `PALETTES` from `palette-provider.tsx`,
  but that's a client module — server import would pull `"use client"`
  directives in. Scaffold inlines the list; a follow-up can extract a
  shared constant module to dedupe.
- **Re-fire on user change.** Should toggling the palette mid-session
  recount? Default is no (first-impression only). Yes-counts every
  switch, which is more "engagement signal" than "default preference".

## 8. Wiring (intentionally NOT done in this scaffold)

To make this live, after Eduard signs off:

1. Mount `<PaletteTracker />` in the root client layout, somewhere
   inside both `<PaletteProvider>` and the `<ThemeProvider>` so the
   hooks have context. Current root layout in
   `src/app/[locale]/layout.tsx` is a server component; the tracker
   should sit alongside `<VisitTracker />` if there is one, or in a
   shared client wrapper.
2. Add `getPaletteCounts()` to `src/lib/redis-analytics.ts`.
3. Render the new section in `/admin/stats`.
4. Set `NEXT_PUBLIC_PROTO_PALETTE_TRACK=1` on prototype, deploy,
   verify with a curl POST that the counter increments.
5. Watch for a week; pick the winning default; remove the scaffold.

Estimated effort to ship from here: ~3-4 hours including admin
dashboard rendering and a smoke test.

## 9. Known limitations

- **Multi-tab.** Each tab gets its own session hash, so a visitor who
  opens 3 tabs will be counted 3 times. Acceptable: the alternative
  (localStorage-scoped hash) lets one tab's pick leak across all tabs
  even after the user closes them, which is closer to a tracking
  cookie than a dedup key.
- **No geo or temporal slicing.** The scaffold doesn't bucket by day
  or country, so we can't answer "do European visitors prefer dark
  mode more?" without changing the key shape.
- **Cumulative key never resets.** If Eduard wants a fresh
  measurement window, manually `DEL palette:*` in Upstash.
