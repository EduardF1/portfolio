import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` is a runtime guard for Next, throws when imported
      // from a client component. In Vitest there is no client/server
      // boundary; alias it to an empty module so server-flagged libs
      // can be unit-tested directly.
      "server-only": path.resolve(__dirname, "./vitest.server-only.ts"),
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
      // us where the gaps are. Thresholds intentionally not enforced yet:
      // baseline is ~36% statements at this commit and we'd rather see the
      // number trend up than gate every PR. Tighten once coverage rises.
      include: ["src/**/*.{ts,tsx}", "scripts/**/*.mjs"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "scripts/**/*.test.mjs",
        "src/i18n/**",
        "src/app/**/layout.tsx",
        "src/app/**/proxy.ts",
      ],
    },
  },
});
