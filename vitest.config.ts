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
      ],
      thresholds: {
        statements: 60,
        branches: 55,
        functions: 65,
        lines: 60,
      },
    },
  },
});
