# Agent A12 — Playwright Cross-Platform Matrix

Date: 2026-04-27
Branch: `feat/v1-polish-round4` (left uncommitted, per orders)

## Goal

Expand Playwright from chromium-only to a 9-project cross-browser ×
cross-device matrix so Apple Safari / Firefox / iOS / Android / iPad
regressions surface in CI within 24 hours.

## Project list

Two-mode config: default unset = 1 project (PR-fast), `CROSS_PLATFORM=1`
= 9 projects (full matrix).

| # | Project name | Engine | Viewport | Notes |
| -- | --- | --- | --- | --- |
| 1 | `chromium` | Chromium | 1440×900 | Always on. Runs untagged + `@cross` tests. Replaces the previous chromium-desktop baseline. |
| 2 | `firefox-desktop` | Firefox | 1440×900 | Cross-platform mode only. `@cross` only (no `@mobile`). |
| 3 | `webkit-desktop` | Webkit | 1440×900 | Apple Safari desktop. `@cross` only. |
| 4 | `chromium-mobile-emulated` | Chromium | 390×844 | Layout-only sanity check. `@mobile` + `@cross`. |
| 5 | `mobile-iphone-14` | Webkit | 390×664, DPR 3 | Real iOS Safari. `@mobile` + `@cross`. |
| 6 | `mobile-iphone-14-landscape` | Webkit | 844×390 (overridden — Playwright bundles 750×340) | iPhone 14 landscape. `@mobile` + `@cross`. |
| 7 | `mobile-pixel-7` | Chromium | 412×839, DPR 2.625 | Android Chrome. Pixel 8 is NOT bundled in `@playwright/test` 1.59 — Pixel 7 is the latest available. `@mobile` + `@cross`. |
| 8 | `tablet-ipad-pro-11` | Webkit | 834×1194 | iPad Safari portrait. `@cross` only. |
| 9 | `tablet-ipad-pro-11-landscape` | Webkit | 1194×834 | iPad Safari landscape. `@cross` only. |

Tagging contract preserved from earlier rounds:

- untagged → `chromium` desktop only
- `@cross` → all 9 projects
- `@mobile` → projects 4, 5, 6, 7 (mobile-width portraits + landscape)

## Files modified

- **`playwright.config.ts`** — full rewrite. Splits projects into
  `desktopProjects` (always on) and `matrixProjects` (gated on
  `process.env.CROSS_PLATFORM === "1"`). Preserves `webServer`,
  `baseURL`, retries, workers. Reporter switches to `[github + html]`
  in CI when in cross-platform mode so the artifact is browsable.
- **`package.json`** — added one new script (`test:cross-platform`)
  and one devDependency (`cross-env@^7.0.3`). Existing `test:e2e`
  unchanged → PR pipeline keeps current speed.
- **`docs/cross-platform-testing.md`** (new) — full documentation:
  why, the 9 projects, how to run, browser-engine gotchas
  cheatsheet, open follow-ups.
- **`.github/workflows/e2e-cross-platform.yml`** (new) — nightly
  matrix run at 04:00 UTC + `workflow_dispatch`. Installs all three
  browser engines, runs full matrix, uploads HTML report as
  artifact (14-day retention). `continue-on-error: true` while the
  matrix beds in.

## Spec adjustments

**None.** I reviewed every spec in `e2e/` for cross-browser hazards.
The hazards I found (`Cmd+K` keyboard shortcut, `toBeFocused()` on
buttons after click, container-query test) all live in **untagged**
specs — under the new tagging contract, untagged = chromium-only, so
they run only where they work. Tagged specs (`@cross`, `@mobile`) use
patterns that are cross-browser-safe today:

- `responsive-matrix.spec.ts` (`@cross`) — uses `getByRole` and
  `page.evaluate(scrollWidth/innerWidth)`, both engine-agnostic.
- `bvb-feed.spec.ts` (`@cross`) — uses `getByRole("tab", …)` + URL
  hash assertion. Engine-agnostic. Live-API flakiness is a separate
  concern (see follow-ups).
- `contact-form-yahoo.spec.ts` first test (`@cross`) — form-fill +
  success-text assertion. Engine-agnostic.
- `mobile-smoke.spec.ts` (`@mobile`) — hamburger trigger click works
  cross-engine because Playwright dispatches synthetic pointer events.

I deliberately did NOT add browser-specific `test.skip` guards because
none of the existing specs are demonstrated to fail on Webkit/Firefox
yet. Adding pre-emptive skips would mask real regressions when the
matrix runs for the first time. **First nightly run is the
discovery moment** — once Eduard sees what actually fails, A12-or-
successor can add targeted `test.skip(browserName === 'webkit', …)`
guards with a real reason in the message.

## Validation performed

- `npx playwright test --list` (default mode) → 37 tests on `chromium`
  only. Matches the previous behavior exactly.
- `CROSS_PLATFORM=1 npx playwright test --list` → 181 tests across
  the 9 named projects. All 9 projects appear in the list.
- `npx tsc --noEmit` (project-wide) → clean, no errors. The config
  typechecks against the project's tsconfig.

I did **not** run the full matrix — needed Firefox/Webkit binaries
not currently installed locally. Eduard should run
`npx playwright install firefox webkit && npm run test:cross-platform`
on his machine to get the first real-world signal.

## How to run

```bash
# Fast PR mode (chromium only, ~37 tests):
npm run test:e2e

# Full matrix (9 projects, ~180 tests, ~6–10 min):
npm install                          # picks up cross-env
npx playwright install firefox webkit  # one-time
npm run test:cross-platform

# Single project (debugging Safari only):
npm run test:cross-platform -- --project=mobile-iphone-14

# Open the last HTML report:
npx playwright show-report
```

## CI integration

**Added** `.github/workflows/e2e-cross-platform.yml` (flagged here
per the optional brief):

- Triggers: nightly cron `0 4 * * *` (04:00 UTC) + manual via
  `workflow_dispatch`.
- Installs all three browser engines with `--with-deps`.
- Runs `npm run test:cross-platform` with `BVB_USE_MOCK=1` (no-op
  per A3's changes but kept for future-proofing).
- Uploads `playwright-report/` artifact, 14-day retention.
- `continue-on-error: true` for now — promote to required check
  after 5 consecutive green nightly runs.

The existing per-PR `e2e` job in `ci.yml` is **untouched** — keeps
the chromium-only `npm run test:e2e` invocation, same speed as
before. Per-PR builds will not get slower from this change.

## Open follow-ups

1. **First-nightly triage.** When the first matrix run fires (next
   04:00 UTC after merge), expect 1–3 failures — most likely on
   `mobile-iphone-14-landscape` (height 390 px is brutal for any
   spec that asserts off-screen content) or `webkit-desktop` (focus
   semantics). Fix or guard with `test.skip(browserName === …)`.
2. **Visual regression baselines.** Documented as a follow-up in
   `docs/cross-platform-testing.md` § "Open follow-ups" — not enabled
   in this round to avoid committing binary baselines before we agree
   which projects own them.
3. **BVB live-API mock.** `bvb-feed.spec.ts` hits OpenLigaDB live ×9
   nightly. Wrap with `page.route("**/api.openligadb.de/**", …)` once
   the spec ownership is sorted (A3's summary flagged this as out of
   their scope too).
4. **Promote nightly job to required check.** Flip
   `continue-on-error: false` in `e2e-cross-platform.yml` and add to
   branch protection after 5 green nightly runs.
5. **`cross-env` is a new devDependency.** Eduard needs `npm install`
   once after pulling. If he prefers no new deps, the alternative is
   a tiny `node` wrapper but it's uglier than a 30 KB devDependency
   that ~every Node project already has.

## Cross-browser pitfalls cheatsheet

The terse list (full version in `docs/cross-platform-testing.md`):

1. **Webkit `:has()` selector** — Safari 15.4+. iOS 15.0–15.3 misses it.
2. **Webkit flexbox `gap`** — Safari 14.1+. Older Safari collapses gaps.
3. **Webkit autoplay** — needs BOTH `muted` AND `playsinline` on `<video>`.
4. **Webkit `<button>` focus** — Safari refuses to focus buttons on click.
   `button.click(); expect(button).toBeFocused()` will fail. Use
   `button.focus()` or `test.skip(browserName === 'webkit', …)`.
5. **iOS date inputs** — `<input type="date">` renders as a native
   picker on iOS; height and tap-target differ from Chrome. Don't pin
   pixel heights.
6. **Viewport units `dvh`/`svh`/`lvh`** — track Safari's address-bar
   visibility on Webkit, freeze on Android Chrome. Layout-while-
   scrolled tests will flake on iOS.
7. **Firefox scrollbars** — only `scrollbar-width`/`scrollbar-color`,
   no `::-webkit-scrollbar`. Custom scrollbar designs regress.
8. **Firefox `Intl` thin spaces** — `toLocaleDateString` uses U+202F
   on Chrome, ASCII space on Firefox. String-equality on rendered
   timestamps flakes.
9. **iPad sticky hover** — first tap fires `:hover`, second tap
   outside un-sticks. Hover-only UI = two-tap UX on tablet. Use
   `@media (hover: none)` fallbacks.
10. **iOS landscape visible viewport** — Safari's bottom toolbar is
    opaque; visible height ≈ `screen.height − ~50px`. Tests asserting
    `100vh` filling the screen will fail on real iOS landscape.
