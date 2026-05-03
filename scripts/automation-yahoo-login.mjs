/**
 * scripts/automation-yahoo-login.mjs
 * ─────────────────────────────────────────────────────────────────
 * Step 1 of 2 — open a browser, let YOU log in to Yahoo Mail
 * manually, then save the session so the signature script can run
 * without touching your credentials.
 *
 * Usage:
 *   npm run automate:yahoo:login
 *
 * What it does:
 *   1. Opens Chromium (visible)
 *   2. Navigates to mail.yahoo.com
 *   3. Waits until you are in the inbox
 *   4. Saves cookies + localStorage to .playwright-sessions/yahoo.json
 *
 * Sessions typically stay valid for weeks.
 */

import { chromium } from "playwright";
import { mkdirSync }  from "node:fs";
import { resolve }    from "node:path";

const SESSION_FILE = resolve(".playwright-sessions/yahoo.json");

async function main() {
  mkdirSync(".playwright-sessions", { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({ viewport: null });
  const page    = await context.newPage();

  console.log("\n── Yahoo Mail login ────────────────────────────────────────");
  console.log("  A browser window will open.");
  console.log("  Log in normally (including any 2FA / App Password).");
  console.log("  The script auto-continues once you reach the inbox.\n");

  await page.goto("https://mail.yahoo.com/", { waitUntil: "domcontentloaded" });

  // Wait until past the login page — any mail.yahoo.com URL that isn't login/consent
  await page.waitForURL(url => {
    const s = url.toString();
    return s.includes("mail.yahoo.com") && !s.includes("login") && !s.includes("consent");
  }, { timeout: 0 });

  console.log("✓ Detected inbox. Saving session...");
  await context.storageState({ path: SESSION_FILE });

  console.log(`✓ Session saved to ${SESSION_FILE}`);
  console.log("  Run  npm run automate:yahoo-signature  to set the signature.\n");

  await browser.close();
}

main();
