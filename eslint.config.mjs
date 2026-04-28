import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Agent worktrees and any nested build output inside them.
    ".claude/**",
    "**/.next/**",
    "coverage/**",
    // Vendored PDF.js worker bundle — third-party minified code, not ours
    // to lint. Synced from `node_modules/pdfjs-dist` by
    // scripts/sync-pdfjs-worker.mjs.
    "public/pdf/**",
    // Local Python venv created by scripts/inpaint-people.py. Contains
    // bundled JS from matplotlib/etc. that is not ours to lint.
    "scripts/.inpaint-venv/**",
    "scripts/.inpaint-cache/**",
    "scripts/.inpaint-test-output/**",
  ]),
]);

export default eslintConfig;
