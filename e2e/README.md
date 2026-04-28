# Playwright e2e tests

This directory holds the Playwright suite. The configuration lives in
`playwright.config.ts` at the repo root.

## Running

| Command | What it runs |
| --- | --- |
| `npm run test:e2e` | Single-project (chromium desktop) — the PR-fast path |
| `npm run test:e2e:ui` | Interactive Playwright UI mode |
| `npm run test:cross-platform` | Full 9-project matrix (`CROSS_PLATFORM=1`) — desktop chromium/firefox/webkit + 4 mobile/tablet emulations |

The cross-platform matrix is the nightly job (and is gated locally so PRs
don't pay the cost). See `docs/cross-platform-testing.md` for the
engine-specific gotchas.

The dev/CI server is started automatically (see `playwright.config.ts`)
and reuses an existing one in dev. Pass `BASE_URL=…` to point at a
deployed environment instead of starting a local server.

## Project matrix

The cross-platform config exercises a device matrix to catch
mobile-only regressions:

- `chromium` — desktop Chrome (1280×720). Skips `@mobile`.
- `chromium-laptop-1366` — common DK enterprise laptop. Runs `@cross`.
- `chromium-tablet` — iPad-sized viewport (Chromium engine for CI parity).
- `mobile-iphone-14` / `mobile-iphone-se` — iPhone 14 + smallest iPhone SE.
- `mobile-pixel-7` / `mobile-galaxy-s5` — Pixel 7 + smallest Galaxy.

## Tagging

| Tag | Where it runs |
| --- | --- |
| _untagged_ | Desktop chromium only |
| `@cross` | Every project (desktop + mobile + tablet) |
| `@mobile` | Mobile/tablet projects only (skips desktop) |

## Environment variables

Most specs run against the default test build with no extra env. A few
specs need opt-in flags:

| Variable                | Used by                              | Default | Notes |
| ----------------------- | ------------------------------------ | ------- | ----- |
| `BASE_URL`              | all                                  | local   | Skip the bundled webServer; hit a deployed URL instead. |
| `BVB_USE_MOCK`          | `bvb-feed.spec.ts` (`getBvbFeed`)   | unset   | Set to `1` on the dev server so the BVB feed renders deterministic mock data with no network. CI does this implicitly because `BVB_API_TOKEN` is unset. |
| `LIVE_INTEGRATIONS`     | mock helpers                         | unset   | Set to `1` to bypass `page.route()` mocks and hit real upstreams. Never set in CI. |
| `RUN_LIVE_EMAIL`        | `contact-form-yahoo.spec.ts`         | unset   | Opt-in for the live Yahoo round-trip. |
| `YAHOO_IMAP_USER`       | `contact-form-yahoo.spec.ts`         | —       | Yahoo address to poll, e.g. `fischer_eduard@yahoo.com`. |
| `YAHOO_IMAP_APP_PASS`   | `contact-form-yahoo.spec.ts`         | —       | 16-char Yahoo *app password* (not the account password). Generate one at <https://login.yahoo.com/account/security>. |
| `YAHOO_IMAP_HOST`       | `contact-form-yahoo.spec.ts`         | `imap.mail.yahoo.com` | Override only if you proxy IMAP. |
| `YAHOO_IMAP_PORT`       | `contact-form-yahoo.spec.ts`         | `993`   | TLS port. |
| `YAHOO_IMAP_FOLDER`     | `contact-form-yahoo.spec.ts`         | `INBOX` | Folder to poll. |

## Live integrations

Several specs touch features that, in production, hit a real upstream
service (OpenLigaDB, Yahoo SMTP, etc.). The cross-platform matrix
multiplies each spec by 9, so an unmocked spec turns one nightly run into
27+ outbound calls. That's:

- **Rude.** OpenLigaDB is free and key-less; we shouldn't burn its
  bandwidth for tests.
- **Flaky.** Real APIs go down, rate-limit, or return drifting data
  between fixture-write and CI run.
- **Slow.** Network round trips dominate the spec's wall-clock time.

So as a rule: **specs MUST mock any live integration** unless the spec
exists *specifically* to test the integration boundary.

### Pattern

For each integration, add a `fixtures/<name>-fixtures.ts` and a
`fixtures/<name>-mock.ts`:

- **`*-fixtures.ts`** — pure data. Export the JSON shapes that the
  upstream API returns, modelling only the fields your code consumes.
  Internal consistency matters (matches = won + draw + lost, etc.) but
  exhaustive realism does not. Ship realistic enough to fool the parsers
  but no more.
- **`*-mock.ts`** — exports `async function mock<Name>Api(page: Page)`.
  Inside, register `page.route(...)` handlers for each upstream URL
  pattern. Honour the `LIVE_INTEGRATIONS=1` opt-out.

Then in the spec:

```ts
import { mock<Name>Api } from "./fixtures/<name>-mock";

test.describe("...", () => {
  test.beforeEach(async ({ page }) => {
    await mock<Name>Api(page);
  });
  // ...
});
```

### Opt-out: `LIVE_INTEGRATIONS=1`

Set this env var when you need to smoke-test against the real API
(e.g. before a release, or when debugging a "the mock disagrees with
production" bug):

```bash
LIVE_INTEGRATIONS=1 npm run test:e2e -- e2e/bvb-feed.spec.ts
```

**Never set `LIVE_INTEGRATIONS=1` in CI.** The matrix multiplies the
call count by 9, retries multiply it again, and we've already had one
nightly job tripped by OpenLigaDB rate-limiting.

Each `mock*Api` helper is responsible for honouring this contract:

```ts
export async function mockFooApi(page: Page): Promise<void> {
  if (process.env.LIVE_INTEGRATIONS === "1") return;
  await page.route("**/api.foo.example/**", (route) =>
    route.fulfill({ json: fooFixture }),
  );
}
```

### Server-component caveat

`page.route()` only intercepts requests made by the **browser**. Anything
fetched by a Next.js Server Component (or a Route Handler running on the
server) goes straight through Node's fetch and bypasses Playwright. If
your integration runs server-side:

1. Mock the route anyway — it covers any client-side hydration fetches
   and any future client-side enhancements without re-wiring.
2. Write the spec assertions against the structural contract (selectors,
   ARIA attributes, list-non-empty), NOT against specific values from
   the fixture. A drifting upstream then doesn't break the spec.
3. For full server-side determinism, prefer a separate test-only env
   var inside the lib (e.g. `FOO_USE_FIXTURE=1`) that returns the
   in-process fixture directly. None currently do this, but it's the
   correct fallback if upstream becomes truly unreliable.

### Existing live-integration mocks

| Integration | Fixture | Mock helper |
| --- | --- | --- |
| OpenLigaDB (BVB feed) | `fixtures/bvb-fixtures.ts` | `fixtures/bvb-mock.ts` |

### Live Yahoo round-trip

The default contact-form spec only checks the server-action success
card and that the visible recipient address is Yahoo. The full
round-trip variant submits a real form, then polls Yahoo over IMAP
until the message arrives (60s timeout). Run it locally with:

```bash
RUN_LIVE_EMAIL=1 \
RESEND_API_KEY=re_... \
YAHOO_IMAP_USER=fischer_eduard@yahoo.com \
YAHOO_IMAP_APP_PASS=xxxxxxxxxxxxxxxx \
npm run test:e2e -- contact-form-yahoo
```

The helper that talks to IMAP lives at `e2e/helpers/yahoo-imap.ts`
and uses the [`imapflow`](https://www.npmjs.com/package/imapflow)
client. Tests cannot call MCP tools directly, which is why we keep a
parallel IMAP path here.

## Visual regression

`visual.spec.ts` captures baseline screenshots for the main routes
(home light + dark, /work, /writing, /personal, /travel). Baselines
live alongside the spec under
`e2e/visual.spec.ts-snapshots/`. To refresh after intentional UI
changes, push a PR with the `visual-regression-update` label — the
`.github/workflows/visual-regression.yml` workflow runs Playwright
with `--update-snapshots` and commits the new baselines back to the
PR. Locally:

```bash
npx playwright test visual --update-snapshots
```

Dynamic regions (current date in the footer, fetched feeds like BVB)
are masked with `mask: [page.locator(...)]` so timing-induced diff
noise is minimised.
