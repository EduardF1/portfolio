import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Next.js' `import "server-only"` marker has no test-mode shim;
      // alias to a tiny no-op so server-only modules can be imported
      // by Vitest under jsdom.
      "server-only": path.resolve(__dirname, "./vitest.server-only-shim.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.test.mjs"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      // Whole-codebase view (untested files count too) so the artifact tells
      // us where the gaps are. Restored to pre-V1-polish levels after the
      // BVB test backfill and i18n parity tests landed.
      include: ["src/**/*.{ts,tsx}", "scripts/**/*.mjs"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "scripts/**/*.test.mjs",
        // Audit / one-shot tooling — never imported from app code, no
        // unit tests by design. Lives in scripts/ but is not part of
        // the runtime surface we want to gate coverage against.
        "scripts/lighthouse-*.mjs",
        "src/i18n/**",
        "src/app/**/layout.tsx",
        "src/app/**/proxy.ts",
        // Per-route OG / Twitter card components — render at edge to PNG;
        // smoke-tested via e2e/og-smoke.spec.ts (A15) instead.
        "src/app/**/opengraph-image.tsx",
        "src/app/**/twitter-image.tsx",
        // Round 5/6 prototype scaffolds — feature-flagged dark; coverage
        // gated until promoted to prod (per docs/environments.md).
        "src/lib/proto-flags.ts",
        "src/components/palette-tracker.tsx",
        "src/app/api/track-palette/**",
        "src/app/api/cron/**",
        // Photo-source resolver — thin pass-through, manual-tested.
        "src/lib/photo-source.ts",
      ],
      // Round 6 baseline (A5 + Round 5 WIP excludes): tests covering main's
      // surface; Round 5 prototype scaffolds excluded above. Thresholds ~5pp
      // below baseline so a single regression fails CI but small refactors
      // don't churn the gate.
      thresholds: {
        statements: 72,
        branches: 65,
        functions: 78,
        lines: 73,
      },
    },
  },
});
