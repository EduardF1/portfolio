# A8 Baseline Pass — feat/v1-polish-round4

**When:** 2026-04-27 (before Round 5 agents commit)
**Branch:** `feat/v1-polish-round4`
**Working tree:** dirty (modifications + untracked files; see git status capture below)
**Logs:** `scripts/.round5/logs/baseline-*.log`

## Verdict

| Check       | Command            | Exit | Status                                  |
|-------------|--------------------|-----:|-----------------------------------------|
| Lint        | `npm run lint`     | 0    | PASS (1 warning)                        |
| Typecheck   | `npm run typecheck`| 0    | PASS                                    |
| Tests       | `npm test`         | 0    | PASS (57 files, 414 tests)              |
| Build       | `npm run build`    | 0    | PASS (106 routes, 5 metadataBase warns) |

**Overall: GREEN baseline.** All four gates pass before Round 5 agents land their changes.

---

## 1. Lint — `npm run lint` → exit 0

```
> portfolio@0.1.0 lint
> eslint

C:\Users\Eduard\Projects\portfolio\scripts\extend-catalogue.mjs
  17:3  warning  'roundCoord' is defined but never used  @typescript-eslint/no-unused-vars

✖ 1 problem (0 errors, 1 warning)
```

**Failures:** none.
**Warnings (1):**
- `scripts/extend-catalogue.mjs:17:3` — `'roundCoord' is defined but never used` (`@typescript-eslint/no-unused-vars`)

---

## 2. Typecheck — `npm run typecheck` (alias for `tsc --noEmit`) → exit 0

```
> portfolio@0.1.0 typecheck
> tsc --noEmit
```

**Failures:** none. Clean run, no diagnostics emitted.

---

## 3. Tests — `npm test` (Vitest run) → exit 0

```
 RUN  v4.1.5 C:/Users/Eduard/Projects/portfolio

 Test Files  57 passed (57)
      Tests  414 passed (414)
   Start at  23:52:40
   Duration  10.70s (transform 9.69s, setup 16.90s, import 21.97s, tests 11.68s, environment 159.21s)
```

**Failures:** none. 414/414 passing across 57 files.

---

## 4. Build — `npm run build` (Next 16.2.4 Turbopack) → exit 0

```
▲ Next.js 16.2.4 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 6.9s
  Running TypeScript ...
  Finished TypeScript in 4.6s ...
  Collecting page data using 27 workers ...
⚠ Using edge runtime on a page currently disables static generation for that page
  Generating static pages using 27 workers (0/106) ...
✓ Generating static pages using 27 workers (106/106) in 2.3s
  Finalizing page optimization ...
```

**Failures:** none. 106 routes generated.
**Warnings:**
- 5× `metadataBase property in metadata export is not set ... using "http://localhost:3000"` — non-fatal, social/OG images fall back to localhost in dev. (Pre-existing.)
- 1× `Using edge runtime on a page currently disables static generation for that page` — non-fatal, expected for the edge-runtime route.
- 1× runtime log: `[bvb] FOOTBALL_DATA_TOKEN (or BVB_API_TOKEN) not set — falling back to mock data.` — expected during local build without the token.

---

## Optional / skipped

- **Playwright (`npm run test:e2e`):** skipped — specs require a running dev server, would exceed the 2-min budget for "optional".
- **Vitest coverage (`npm run test:coverage`):** skipped to keep baseline fast; the regular vitest run already exercises every spec and is green.

---

## Git working-tree state at baseline capture

Branch: `feat/v1-polish-round4`

Modified:
- `.env.example`
- `messages/da.json`
- `messages/en.json`
- `public/photos/bvb-yellow-wall-suedtribuene.jpg`
- `scripts/.geocode-cache.json`
- `src/app/[locale]/personal/page.tsx`
- `src/app/[locale]/travel/page.tsx`
- `src/lib/bvb.test.ts`
- `src/lib/bvb.ts`

Untracked (sample): 10+ `public/photos/IMG_*.jpg` files, `scripts/.catalogue-srcs.txt`, etc.

This dirty state is the input Round 5 agents A1–A7 will modify on top of. The final pass will diff against this exact baseline.

---

## Next step

Polling `scripts/.round5/A8-trigger-final.txt` every 90s for up to 30 min. When it appears, A8 will re-run the same four checks and write `scripts/.round5/A8-final.md` with a baseline→final diff and a PASS/FAIL verdict for the Round 5 sprint.
