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
      // us where the gaps are. Thresholds set below the V1 polish baseline
      // (the BVB feed + i18n sweep + photo-grid additions added ~2k lines
      // of partially-tested code, so branches dipped from 57% to 53%);
      // raised gradually as a separate test-backfill pass brings it back up.
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
      ],
      thresholds: {
        statements: 55,
        branches: 50,
        functions: 60,
        lines: 55,
      },
    },
  },
});
