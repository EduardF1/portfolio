# Cross-platform end-to-end testing

The portfolio's Playwright config (`playwright.config.ts`) ships two test
modes:

| Mode | Trigger | Projects | Approx. duration |
| ---- | ------- | -------- | ---------------- |
| **Default (PR-fast)** | `npm run test:e2e` (or unset env) | 1 — `chromium` desktop only | ~1–2 min |
| **Cross-platform matrix** | `npm run test:cross-platform` (sets `CROSS_PLATFORM=1`) | 9 — Chromium / Firefox / Webkit desktop, iPhone 14 portrait + landscape, Pixel 7, iPad Pro 11 portrait + landscape, plus a chromium narrow-viewport sanity-check | ~6–10 min |

The default mode keeps every PR fast and green. The matrix mode runs in a
nightly GitHub Actions workflow (`.github/workflows/e2e-cross-platform.yml`)
and can be triggered manually from the Actions tab when debugging a
Safari- or Firefox-only regression.

## Why a matrix at all

Eduard's audience skews toward Mac recruiters (Safari) and reviewers
opening links from a phone (iOS Safari, Android Chrome). Chromium-only
testing routinely misses:

- CSS engine differences (`gap`, `:has()`, `dvh`, scrollbars)
- JavaScript intrinsic differences (`structuredClone`, regex lookbehind,
  the latest `Intl.*` proposals)
- Touch/pointer event sequencing on real mobile devices
- Address-bar reflow on iOS landscape, where the visible viewport is
  much smaller than `window.innerHeight`

Running the matrix nightly catches these inside 24 hours instead of
"first user reports it via GitHub issue".

## The 9 projects

Each project sets a Playwright `devices[…]` descriptor that pins the
browser engine, viewport, user-agent, device-pixel ratio, touch
support, and `isMobile` flag. The project name is what shows in test
reports — keep it grep-friendly when you add new ones.

| Project | Engine | Viewport | Notes |
| ------- | ------ | -------- | ----- |
| `chromium` | Chromium | 1440×900 | Desktop baseline; runs the full untagged suite. Always on, even in default mode. |
| `firefox-desktop` | Firefox | 1440×900 | Same baseline, Gecko engine. Cross-platform mode only. |
| `webkit-desktop` | Webkit | 1440×900 | Apple Safari desktop (also covers Mac users on Sonoma+). Cross-platform mode only. |
| `chromium-mobile-emulated` | Chromium | 390×844 | Layout-only sanity check — same engine as desktop, narrow viewport. Catches `md:` breakpoint issues cheaply. |
| `mobile-iphone-14` | Webkit | 390×664 (DPR 3) | Real iOS Safari emulation, portrait. The single most important "did Safari break it" project. |
| `mobile-iphone-14-landscape` | Webkit | 844×390 | Same engine, landscape rotation. Catches header overflow / orientation-reflow bugs. Viewport pinned at the spec value (overrides Playwright's bundled 750×340 to match Eduard's request). |
| `mobile-pixel-7` | Chromium | 412×839 (DPR 2.625) | Android Chrome emulation. Pixel 8 isn't bundled in `@playwright/test` 1.59 — Pixel 7 is the latest available. |
| `tablet-ipad-pro-11` | Webkit | 834×1194 | iPad Safari portrait. Above Tailwind's `md:` (768) so the inline nav shows; this is the breakpoint where hover-state CSS often regresses. |
| `tablet-ipad-pro-11-landscape` | Webkit | 1194×834 | iPad Safari landscape. Distinct from the desktop 1440 baseline; surfaces wide-but-touch issues. |

## Tagging contract

Tests opt into the matrix via a single tag in their `describe`/`test`
title:

- **untagged** → runs only on `chromium` (desktop, full feature set).
  Use this for tests that probe browser-agnostic logic (SSR routing,
  form validation, focus management). Keyboard-shortcut tests
  (`Cmd+K`) belong here too — Playwright's keyboard emulation on
  Webkit doesn't dispatch the OS-level shortcut, only the JS event.
- **`@cross`** → runs on every project, desktop + mobile + tablet.
  Use for layout invariants (no horizontal overflow, nav reachable,
  hero visible) where the cross-browser truth matters.
- **`@mobile`** → runs only on the mobile portrait projects
  (`chromium-mobile-emulated`, `mobile-iphone-14`,
  `mobile-iphone-14-landscape`, `mobile-pixel-7`). Use for tests that
  depend on the mobile-only UI (hamburger menu, mobile sheet, palette
  inside the sheet).

The grep filters live in `playwright.config.ts` next to each project.

## How to run

### Locally

```bash
# Fast PR mode — chromium only, ~37 tests
npm run test:e2e

# Full matrix — 9 projects, ~180 tests, ~6–10 min
npm run test:cross-platform

# Filter to one project while debugging a Safari issue:
npm run test:cross-platform -- --project=mobile-iphone-14

# UI mode (chromium only — UI mode does not multiplex projects):
npm run test:e2e:ui
```

Before the first `test:cross-platform` run on a fresh checkout you need
the non-Chromium browser binaries:

```bash
npx playwright install firefox webkit
```

`npm run test:cross-platform` shells out via `cross-env` so the
`CROSS_PLATFORM=1` env var works on Windows PowerShell, macOS, and
Linux equally. `cross-env` was added as a devDependency in this round —
run `npm install` once after pulling.

### CI

- **Per-PR** (`.github/workflows/ci.yml`, `e2e` job) — runs the default
  Chromium-only `npm run test:e2e`. Fast, blocking.
- **Nightly** (`.github/workflows/e2e-cross-platform.yml`) — runs the
  full `npm run test:cross-platform` matrix at 04:00 UTC every day,
  uploading the HTML report as an artifact. Currently
  `continue-on-error: true` while the matrix beds in; promote to a
  required check once 5 nightly runs are green.
- **Manual** — kick the nightly job ad-hoc from the Actions tab via
  `workflow_dispatch` whenever a PR description hints at a Safari or
  Firefox-shaped regression.

## Browser-engine gotchas to watch

These are the failure modes that have historically surfaced *only* on
non-Chromium browsers — keep them in mind when triaging a red matrix.

### Safari / Webkit

- **`:has()` selector** — Webkit shipped it in 15.4 (Mar 2022). Older
  iOS users (15.0–15.3) won't get the styles. The bundled iPhone 14
  descriptor uses iOS 16 so we're fine here, but check
  caniuse before adopting `:has()` for hover-only tweaks.
- **Flexbox `gap`** — only landed in Safari 14.1 (Apr 2021). Anyone on
  iOS 14.0 or earlier sees collapsed gaps. Our minimum is iOS 16; safe.
- **Video autoplay** — Safari requires both `muted` AND `playsinline`
  attributes on `<video>` for autoplay. Missing either silently falls
  back to a poster frame. The carousel doesn't ship video today, but
  flag any future video work.
- **Date/time inputs** — `<input type="date">`, `type="datetime-local">`,
  and `type="time">` render as native iOS pickers, which differ in
  height and tap-target size from Chromium. Form layout assertions
  that pin pixel heights will flake on iOS.
- **Viewport units `dvh` / `svh` / `lvh`** — Webkit semantics for
  these track Safari's address-bar visibility; on Android Chrome they
  freeze at one value. Tests that assert layout when scrolled often
  flake on iOS.
- **Pointer focus on `<button>`** — Safari deliberately does NOT focus
  buttons on click (this is the "Safari focus debate" problem). Tests
  that call `button.click()` then assert `expect(button).toBeFocused()`
  will fail on Webkit. Use `button.focus()` explicitly, or guard with
  `test.skip(browserName === 'webkit', '…reason…')`.

### Firefox

- **Scrollbar styling** — only `scrollbar-width` and `scrollbar-color`
  CSS work; `::-webkit-scrollbar` is silently ignored. Designs that
  rely on a custom scrollbar look will regress.
- **CSS `gap` percentage values** — Firefox computes percent gaps
  against the wrong axis in some flex/grid edge cases. Prefer rem/px
  for grid gaps.
- **`structuredClone` on Workers** — older Firefox ESR (102) lacks
  full structured-clone support in Worker postMessage. Not relevant
  to the portfolio today, but keep in mind if we ever ship a
  PhotoSwipe-style worker.
- **Date format strings** — Firefox's `toLocaleDateString` uses ASCII
  spaces where Chrome uses U+202F (narrow no-break) for `12:00 AM`.
  String-equality assertions on rendered timestamps will flake.

### Tablet / landscape

- **Hover-state CSS triggers on tablets** — iPad Safari fires `:hover`
  on the first tap (sticky hover), then "unsticks" on the next tap
  outside. UI that hides controls behind hover (e.g. carousel arrows)
  becomes a two-tap UX on tablet. Cover with explicit `@media (hover:
  none)` fallbacks.
- **Orientation-change reflow** — rotating a real device fires
  `resize` AND `orientationchange`; Playwright's emulation fires only
  one synthetic resize. Layout fixes that depend on the second event
  may pass in CI and fail on a real iPad.
- **iOS landscape address bar** — the visible viewport in Safari
  landscape is significantly shorter than `screen.height` because the
  bottom toolbar is opaque. The spec we run pins viewport at the
  marketing dimension (844×390) but Playwright's bundled descriptor
  uses 750×340 — the latter is closer to the actual on-device visible
  area. If a test relies on `100vh` filling the screen, expect ~50px
  of difference between the two.

## Open follow-ups

1. **Visual regression baselines.** `expect.toHaveScreenshot` is the
   natural next step — it'd let us assert per-project pixel snapshots.
   We DELIBERATELY did not enable it in this round because:
   - Baselines are platform-specific binaries (PNG) and committing them
     across 9 projects bulks up the repo by a few MB per route.
   - Webkit on Linux (CI) renders subpixel text differently from Webkit
     on macOS (local) — the same baseline can't serve both. We'd need
     either a Linux-CI-only baseline directory or a Docker-image-pinned
     toolchain.
   - Recommend approach: add `expect.toHaveScreenshot.maxDiffPixelRatio:
     0.02` and start with a single `home.spec.ts` baseline that runs
     only on `chromium`, then expand. Baselines should live under
     `e2e/__screenshots__/` with a `.gitignore` for non-`chromium`
     projects until the macOS/Linux Webkit gap is solved.
2. **Promote nightly job to required check.** After 5 consecutive green
   nightly runs, flip `continue-on-error: false` in
   `.github/workflows/e2e-cross-platform.yml` and add the job to branch
   protection.
3. **Replace BVB live API with a route mock.** `bvb-feed.spec.ts` is
   tagged `@cross` so the matrix calls OpenLigaDB ~9× per nightly run.
   This is fine today but will rate-limit during a season. Replace
   with `page.route("**/api.openligadb.de/**", route => …)` returning
   a fixture — A3's summary already flagged this as out of A3's scope.
4. **Add a Playwright route mock for `next/image` 304s.** On Webkit
   the image-optimization endpoint sometimes returns 304 with a
   stale ETag mismatching the bundle hash, producing a 1-in-50 flake
   when running 9 projects in parallel. Hasn't fired yet but is on
   the watch list.
5. **Live email round-trip test.** `contact-form-yahoo.spec.ts` has a
   second test gated on `RUN_LIVE_EMAIL=1`. The matrix doesn't enable
   it. If we ever do, run it on `chromium` only — sending 9 emails
   per nightly run would rate-limit Resend.
