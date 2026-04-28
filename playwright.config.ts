import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

// CHROMIUM_OVERRIDE: every "mobile-*" / "*-tablet" project below uses a
// Playwright `devices[…]` descriptor whose default browser is webkit (or,
// for Pixel/Galaxy, chromium). Our CI only installs the chromium binary,
// so each project explicitly overrides `defaultBrowserType: "chromium"`.
// We trade some real-device realism for a CI-friendly green build —
// the tradeoff is documented in docs/backlog.md.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Desktop runs the standard suite. @mobile-tagged tests rely on the
      // hamburger menu (md:hidden), so they only make sense on mobile-width
      // projects below.
      grepInvert: /@mobile/,
    },
    {
      name: "chromium-laptop-1366",
      // CHROMIUM_OVERRIDE — desktop Chrome already runs on chromium; we
      // only resize to the smaller laptop viewport common in DK enterprise.
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
      grep: /@cross/,
    },
    {
      name: "chromium-tablet",
      // CHROMIUM_OVERRIDE — iPad Pro 11 descriptor is webkit by default;
      // force chromium so CI's chromium-only install can run it.
      use: {
        ...devices["iPad (gen 7)"],
        defaultBrowserType: "chromium",
        viewport: { width: 768, height: 1024 },
        isMobile: false, // chromium does not support isMobile
      },
      grep: /@cross/,
    },
    {
      // 1024×768 — classic iPad landscape. Wide enough for the viewport
      // `lg:` breakpoint to flip on (≥1024 px), but the actual section
      // *container* sits inside container-page (max 72rem with 1.5rem
      // gutters) so any layout that should react to container width
      // rather than viewport width is exercised here. @cross-tagged tests
      // run against this project to keep the matrix stable.
      name: "chromium-tablet-landscape",
      use: {
        ...devices["iPad (gen 7) landscape"],
        defaultBrowserType: "chromium",
        viewport: { width: 1024, height: 768 },
        isMobile: false,
      },
      grep: /@cross|@tablet-landscape/,
    },
    {
      // 1366×1024 — iPad Pro 12.9" landscape, common in DK enterprise
      // reception areas and recruiter laptops at meetings. Same intent as
      // chromium-tablet-landscape but exercises the upper end of the
      // tablet-landscape band where viewport `lg:` is comfortably on.
      name: "chromium-tablet-landscape-large",
      use: {
        ...devices["Desktop Chrome"],
        defaultBrowserType: "chromium",
        viewport: { width: 1366, height: 1024 },
      },
      grep: /@cross|@tablet-landscape/,
    },
    {
      name: "mobile-iphone-14",
      // CHROMIUM_OVERRIDE — iPhone 14 descriptor is webkit by default.
      use: {
        ...devices["iPhone 14"],
        defaultBrowserType: "chromium",
        isMobile: false,
      },
      grep: /@mobile|@cross/,
    },
    {
      name: "mobile-iphone-se",
      // CHROMIUM_OVERRIDE — smallest common iPhone (375×667). Webkit by
      // default; forced to chromium for CI parity.
      use: {
        ...devices["iPhone SE"],
        defaultBrowserType: "chromium",
        isMobile: false,
        viewport: { width: 375, height: 667 },
      },
      grep: /@mobile|@cross/,
    },
    {
      name: "mobile-pixel-7",
      // Pixel 7 is already chromium by default; pinning makes the
      // intent explicit and the projects array uniform.
      use: {
        ...devices["Pixel 7"],
        defaultBrowserType: "chromium",
      },
      grep: /@mobile|@cross/,
    },
    {
      name: "mobile-galaxy-s5",
      // CHROMIUM_OVERRIDE — Galaxy S5 is the smallest common Android
      // (360×640). Galaxy S5 descriptor is chromium by default but we
      // pin defaultBrowserType so the projects array is uniform.
      use: {
        ...devices["Galaxy S5"],
        defaultBrowserType: "chromium",
        viewport: { width: 360, height: 640 },
      },
      grep: /@mobile|@cross/,
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
