# Palette × theme analytics — design doc

Status: shipped on `feat/v1-round6-palette-analytics`. Off until the
Vercel KV env vars are present in production.

Backlog item: anonymous count of which palette × theme combination
visitors prefer, so Eduard can pick a sensible default for v1+.

## 1. Goal

Aggregate, anonymous count of `(palette, theme)` (and the more granular
`(palette, theme, locale)`) tuples over time. The data drives one
decision: which combination should be the served default in
`PaletteProvider` / `ThemeProvider`. Output is rendered on
`/admin/stats` (already `ADMIN_SECRET`-gated).

Example output (illustrative, not real data):

```
mountain-navy + dark      54.2%
schwarzgelb   + dark      18.1%
woodsy-cabin  + light     12.7%
mountain-navy + light     10.0%
schwarzgelb   + light      3.1%
woodsy-cabin  + dark       1.9%
```

## 2. Components

| Path                                                     | Role                                            |
| -------------------------------------------------------- | ----------------------------------------------- |
| `src/components/palette-tracker.tsx`                     | Client beacon — POSTs once per tab session.     |
| `src/app/api/track-palette/route.ts`                     | POST writes counters; GET reads them.           |
| `src/lib/palettes.ts`                                    | Shared `PALETTES`/`THEMES` (server + client).   |
| `src/app/[locale]/layout.tsx`                            | Mounts `<PaletteTracker />` inside providers.   |

## 3. Client trigger (`<PaletteTracker />`)

1. Reads `palette` from `usePalette()` and `resolvedTheme` from
   `next-themes`. Reads `locale` from `useLocale()` (next-intl).
2. Waits for `resolvedTheme` to settle to `"light"` or `"dark"`. On
   the server-rendered first paint it's `undefined`; we don't fire
   until the client value materialises.
3. Checks `sessionStorage["palette-track-fired"]`. If `"1"`, no-op.
4. Marks the flag, then POSTs
   `{ palette, theme, locale, path: window.location.pathname }` to
   `/api/track-palette` with `keepalive: true`. Failures are swallowed.

The component renders nothing. It deliberately does NOT re-fire when
the user toggles palette or theme mid-session — we want first-impression
counts, not engagement signal.

## 4. Server endpoint (`/api/track-palette`)

### POST

Body validated with Zod (`src/app/api/track-palette/route.ts`):

```ts
{
  palette: "schwarzgelb" | "mountain-navy" | "woodsy-cabin",
  theme:   "light" | "dark",
  locale:  "en" | "da",
  path:    string  // must start with "/", max 256 chars
}
```

Validation errors → `400 { ok: false, reason: "invalid-body" }`.
Malformed JSON → `400 { ok: false, reason: "invalid-json" }`.

On valid input, two counters are `INCR`ed in a single Upstash REST
pipeline:

```
INCR palette:<palette>:<theme>
INCR palette-pair:<palette>:<theme>:<locale>
```

Storage gate: `KV_REST_API_URL` (Vercel-integration variant) or
`UPSTASH_REDIS_REST_URL` must be present, with the matching token. If
neither is set the route logs the hit to stderr and returns
`{ ok: true, stored: false }` so local dev never depends on KV.

If KV is configured but unreachable, the response is also
`{ ok: true, stored: false }` — analytics never blocks the UI.

### GET

`GET /api/track-palette?secret=<ADMIN_SECRET>` returns all counters as
JSON. Used by A7's `/admin/stats` dashboard.

Response shape (the contract A7 reads):

```ts
{
  counters:  { [key: string]: number },  // sparse, only non-zero entries
  palettes:  string[],                   // ordered as in lib/palettes.ts
  themes:    string[],                   // ["light", "dark"]
  updatedAt: string                      // ISO timestamp
}
```

Counter keys match the Redis keys exactly, e.g.
`palette:mountain-navy:dark` or
`palette-pair:mountain-navy:dark:en`. The dashboard knows the
palette × theme × locale enumeration up-front and composes lookups
locally — there's no need for the server to return the cartesian
product.

A wrong / missing / mismatched `secret` returns `404 Not Found` (no
JSON body) so the route's existence isn't confirmed to drive-by probes.
Same posture as `/admin/stats` and `/admin/unlock`.

## 5. Wiring

`<PaletteTracker />` is mounted in `src/app/[locale]/layout.tsx` next
to `<VisitTracker />`, inside both `<ThemeProvider>` and
`<PaletteProvider>` so both hooks have context. Every page view in the
locale tree fires the beacon (subject to the per-tab dedup flag).

## 6. Tests

| File                                             | Coverage                                   |
| ------------------------------------------------ | ------------------------------------------ |
| `src/app/api/track-palette/route.test.ts`        | Zod validation, secret gate, KV mock paths |
| `src/components/palette-tracker.test.tsx`        | Render, sessionStorage guard, body shape   |

The route test mocks `globalThis.fetch` to stand in for the Upstash
REST endpoint — no live KV calls are made. The component test mocks
`next-themes`, `next-intl`, and the palette-provider hook so the
tracker runs in isolation under jsdom.

## 7. Privacy

This endpoint matches the privacy posture documented on `/privacy`
and used by `/api/track`:

- **No PII collected.** The server never reads or persists:
  - Raw IP addresses.
  - User-Agent strings.
  - Referer / `Referer` headers.
  - Geolocation (country/region/city — even though they're available
    via Vercel Edge headers for the existing `/api/track`).
  - Cookies (`pf_admin`, `pf_session`, etc. are never inspected by
    this route).
  - Any fingerprint, hash, or session identifier — concurrent or
    repeat visits cannot be correlated server-side.
- **No client-side identifier sent.** The body is exactly
  `{ palette, theme, locale, path }` — four fields, all of which are
  either closed enums or a route pathname. `path` is used as part of
  the Redis key shape only via the counters; the verbatim path is
  never stored alongside any other field.
- **Sparse storage.** The only data shape persisted is integer
  counters keyed by `(palette, theme)` and `(palette, theme, locale)`.
  There is no event log, no time-series, no per-visitor record. With
  full Redis access there is no way to reconstruct an individual
  visit, let alone a session.
- **Per-tab dedup is client-side.** The `palette-track-fired`
  sessionStorage flag prevents re-firing in the same tab, and clears
  when the tab closes (shorter than any cookie). No part of that flag
  ever leaves the browser.
- **Off by default in prod.** Without `KV_REST_API_URL` (or the
  `UPSTASH_REDIS_REST_URL` variant) the POST handler returns
  `{ ok: true, stored: false }` and writes nothing. Local dev never
  hits KV.
- **Admin browsing is not filtered here.** Unlike `/api/track`, this
  route does NOT inspect the `pf_admin` cookie — because doing so
  would require reading the cookie, which we explicitly avoid for the
  privacy guarantee above. In practice Eduard's own visits are a
  rounding error against real traffic; if that becomes a problem the
  client-side `<PaletteTracker />` can be patched to skip when the
  cookie is set in `document.cookie` (which lives in the client only).

## 8. Open follow-ups

- **Cumulative key never resets.** If Eduard wants a fresh measurement
  window, manually `DEL palette:*` and `DEL palette-pair:*` in
  Upstash. A scheduled reset is intentionally not wired up.
- **Sample rate.** Current implementation is 1/1. Sampling can be
  added in the client if traffic ever ramps to >10k visits/day.
- **Drift in palette list.** `src/lib/palettes.ts` is the single
  source of truth — both the route and the provider import from it.
  Adding a 4th palette is a one-file change.
