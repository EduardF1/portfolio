/**
 * scripts/automation-linkedin-login.mjs
 * ─────────────────────────────────────────────────────────────────
 * Step 1 of 2 — open a browser, let YOU log in to LinkedIn manually,
 * then save the session so the action script can run without
 * touching your credentials.
 *
 * Usage:
 *   npm run automate:linkedin:login
 *
 * What it does:
 *   1. Opens Chromium (visible, full-size)
 *   2. Navigates to linkedin.com/login
 *   3. Waits until you are on the feed (you log in, handle 2FA, etc.)
 *   4. Saves cookies + localStorage to .playwright-sessions/linkedin.json
 *
 * After this runs once, you can re-run the action script as many
 * times as you like — no password ever touches the automation code.
 * Sessions typically stay valid for weeks.
 */

import { chromium } from "playwright";
import { mkdirSync }  from "node:fs";
import { resolve }    from "node:path";

const SESSION_FILE = resolve(".playwright-sessions/linkedin.json");

async function main() {
  mkdirSync(".playwright-sessions", { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({ viewport: null });
  const page    = await context.newPage();

  console.log("\n── LinkedIn login ──────────────────────────────────────────");
  console.log("  A browser window will open.");
  console.log("  Log in normally (including any 2FA / CAPTCHA).");
  console.log("  The script auto-continues once you reach the feed.\n");

  await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });

  // Wait indefinitely for the feed — you drive the login
  await page.waitForURL(/linkedin\.com\/feed/, { timeout: 0 });

  console.log("✓ Detected feed. Saving session...");
  await context.storageState({ path: SESSION_FILE });

  console.log(`✓ Session saved to ${SESSION_FILE}`);
  console.log("  Run  npm run automate:linkedin  to add the Featured link.\n");

  await browser.close();
}

main();
