import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Playwright cross-browser × cross-device matrix.
 *
 * Two modes, switched by env:
 *
 *   • CROSS_PLATFORM unset (default, the PR-fast path)
 *     → only the "chromium" desktop project runs. Same green-build cost
 *       we had before. Use this for `npm run test:e2e` and the per-PR
 *       CI job.
 *
 *   • CROSS_PLATFORM=1 (the full matrix)
 *     → all 9 projects run: 3 desktop browsers (Chromium/Firefox/Webkit)
 *       at 1440×900, 4 mobile/tablet device emulations covering iOS Safari,
 *       Android Chrome, iPad Safari, plus portrait + landscape orientations.
 *       Used by `npm run test:cross-platform` locally and (if wired) the
 *       nightly CI job. Slower; expects all three browser engines to be
 *       installed (`npx playwright install`).
 *
 * Tagging convention (preserved from earlier rounds):
 *   - untagged tests run on the "chromium" desktop project only
 *   - @cross runs on every project (desktop + mobile + tablet)
 *   - @mobile runs on the mobile/tablet projects only (skips desktop)
 *
 * Webkit/Firefox-specific gotchas live in
 * docs/cross-platform-testing.md — read that before debugging a flake.
 */

const CROSS_PLATFORM = process.env.CROSS_PLATFORM === "1";

// Desktop viewport common across all three engines so visual diffs aren't
// confounded by viewport differences.
const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;

// Reusable filters so the @mobile / @cross / untagged contract is one
// source of truth — easier to audit than scattered grep strings.
const MOBILE_OR_CROSS = /@mobile|@cross/;
const CROSS_ONLY = /@cross/;
const NOT_MOBILE = { grepInvert: /@mobile/ } as const;

type ProjectDef = ReturnType<typeof defineConfig>["projects"];
type Project = NonNullable<ProjectDef>[number];

const desktopProjects: Project[] = [
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"], viewport: DESKTOP_VIEWPORT },
    // @mobile-tagged tests rely on the hamburger menu (md:hidden), so they
    // only make sense on the mobile-width projects below.
    ...NOT_MOBILE,
  },
];

// Projects that ONLY run when CROSS_PLATFORM=1. The default mode keeps the
// PR pipeline at a single browser to preserve current speed.
const matrixProjects: Project[] = CROSS_PLATFORM
  ? [
      // ----- desktop, three engines -----
      {
        name: "firefox-desktop",
        use: { ...devices["Desktop Firefox"], viewport: DESKTOP_VIEWPORT },
        // Firefox-only desktop coverage; @mobile tests don't apply here.
        ...NOT_MOBILE,
      },
      {
        name: "webkit-desktop",
        // Apple Safari is the engine most likely to surface gaps for
        // Eduard's audience (Mac recruiters, iPad reviewers). Run the
        // same desktop suite to flush out CSS/JS feature-detect bugs.
        use: { ...devices["Desktop Safari"], viewport: DESKTOP_VIEWPORT },
        ...NOT_MOBILE,
      },
      // ----- desktop chromium emulating a narrow viewport -----
      {
        name: "chromium-mobile-emulated",
        // Sanity-check: chromium engine + 390×844 viewport. Catches
        // layout-only regressions cheaply; the real iPhone 14 / Pixel 7
        // projects below cover engine-level differences.
        use: {
          ...devices["Desktop Chrome"],
          viewport: { width: 390, height: 844 },
        },
        grep: MOBILE_OR_CROSS,
      },
      // ----- mobile, real engines -----
      {
        name: "mobile-iphone-14",
        // Webkit + iOS UA + iPhone 14 viewport (390×664) and DPR 3.
        // Real-world Apple Safari coverage.
        use: { ...devices["iPhone 14"] },
        grep: MOBILE_OR_CROSS,
      },
      {
        name: "mobile-iphone-14-landscape",
        // iPhone 14 rotated. Bundled "iPhone 14 landscape" descriptor uses
        // viewport 750×340 (Safari address-bar trimmed). The task spec
        // mentioned 844×390 as a target — Playwright's bundled value is
        // closer to the real visual viewport, so prefer it. We also pin
        // 844×390 via override for the "actual screen" assertion case.
        use: {
          ...devices["iPhone 14 landscape"],
          viewport: { width: 844, height: 390 },
        },
        grep: MOBILE_OR_CROSS,
      },
      {
        name: "mobile-pixel-7",
        // Pixel 8 isn't bundled in @playwright/test 1.59 — Pixel 7 is the
        // newest available. Same chromium engine + Android UA.
        use: { ...devices["Pixel 7"] },
        grep: MOBILE_OR_CROSS,
      },
      // ----- tablet, both orientations -----
      {
        name: "tablet-ipad-pro-11",
        // Webkit + iPad Pro 11 portrait (834×1194). Catches the "tablet
        // hover-state CSS triggers" class of bugs.
        use: { ...devices["iPad Pro 11"] },
        grep: CROSS_ONLY,
      },
      {
        name: "tablet-ipad-pro-11-landscape",
        // iPad Pro 11 landscape (1194×834). Distinct breakpoint from the
        // 1440×900 desktop and 834-portrait — exposes orientation-change
        // reflow issues.
        use: { ...devices["iPad Pro 11 landscape"] },
        grep: CROSS_ONLY,
      },
    ]
  : [];

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? CROSS_PLATFORM
      ? [["github"], ["html", { open: "never" }]]
      : "github"
    : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    // expect.toHaveScreenshot.maxDiffPixelRatio is intentionally NOT set
    // here — see docs/cross-platform-testing.md "Visual baselines"
    // follow-up. Adding baselines now would commit binary artefacts to
    // the repo before we agree which projects own them.
  },
  projects: [...desktopProjects, ...matrixProjects],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
