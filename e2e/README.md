# Playwright e2e tests

This directory holds the Playwright suite. The configuration lives in
`playwright.config.ts` at the repo root.

## Running

| Command | What it runs |
| --- | --- |
| `npm run test:e2e` | Single-project (chromium desktop) — the PR-fast path |
| `npm run test:cross-platform` | Full 9-project matrix (`CROSS_PLATFORM=1`) — desktop chromium/firefox/webkit + 4 mobile/tablet emulations |

The cross-platform matrix is the nightly job (and is gated locally so PRs
don't pay the cost). See `docs/cross-platform-testing.md` for the
engine-specific gotchas.

## Tagging

| Tag | Where it runs |
| --- | --- |
| _untagged_ | Desktop chromium only |
| `@cross` | Every project (desktop + mobile + tablet) |
| `@mobile` | Mobile/tablet projects only (skips desktop) |

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
