import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

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
    },
    {
      // Mobile projects override the device's defaultBrowserType so they run on
      // chromium in CI (faster, fewer browser installs — webkit isn't installed
      // by the e2e workflow). The iPhone/Pixel viewport, user-agent, and touch
      // settings still come from devices['iPhone 14'] / devices['Pixel 7'].
      name: "iphone-14",
      use: { ...devices["iPhone 14"], defaultBrowserType: "chromium" },
      grep: /@mobile|@cross/,
    },
    {
      name: "pixel-7",
      use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" },
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
