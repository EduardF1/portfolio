# A6 — Hardcoded Strings in `src/` That Should Be Polished

A6's scope excludes `src/` page files. The following user-visible strings live in code rather than i18n and contain em-dashes or other polish issues. Recommended for whichever agent owns the relevant page.

## User-visible em-dashes (` — `)

These strings render in the browser; em-dashes here should match A6's editorial convention (commas).

- `src/app/global-error.tsx:28` — `<title>Something went wrong — Eduard Fischer-Szava</title>`
- `src/app/opengraph-image.tsx:6` — `export const alt = "Eduard Fischer-Szava — Software Engineer & IT Consultant";`
- `src/app/[locale]/layout.tsx:49` — `alt: "Eduard Fischer-Szava — Software Engineer & IT Consultant",`
- `src/app/manifest.webmanifest:2` — `"name": "Eduard Fischer-Szava — EduardFischer.dev",`
- `src/app/admin/stats/page.tsx:240` — `empty="No geo data — Vercel headers may be missing in dev."` (admin only, lower priority)

### Suggested replacements

| File | Current | Suggested |
| --- | --- | --- |
| `src/app/global-error.tsx` | `Something went wrong — Eduard Fischer-Szava` | `Something went wrong, Eduard Fischer-Szava` (or just the proper name) |
| `src/app/opengraph-image.tsx` | `Eduard Fischer-Szava — Software Engineer & IT Consultant` | `Eduard Fischer-Szava, Software Engineer & IT Consultant` |
| `src/app/[locale]/layout.tsx:49` | same as above | same as above |
| `src/app/manifest.webmanifest` | `Eduard Fischer-Szava — EduardFischer.dev` | `Eduard Fischer-Szava, EduardFischer.dev` |
| `src/app/admin/stats/page.tsx:240` | `No geo data — Vercel headers may be missing in dev.` | `No geo data. Vercel headers may be missing in dev.` |

## Comments and test descriptors (cosmetic only — non-user-facing)

These are em-dashes inside JS comments, JSDoc blocks, and `describe()` strings. They do not render to the browser. Left as-is unless someone wants global stylistic consistency.

- `src/proxy.ts:10`, `src/i18n/messages.test.ts:21`, `src/app/admin/layout.tsx:6,25`, `src/app/admin/unlock/route.ts:8,17`, `src/app/robots.ts:11`, `src/app/actions/contact.ts:13,24,48`, `src/components/hero-video-bg.tsx:2,11`, `src/app/globals.css:4,17,31,47,91,151`, `src/app/admin/stats/page.tsx:21,38,51,57,61`, `src/app/privacy/page.tsx:1`, `src/app/privacy/layout.tsx:7`, `src/components/hero-video-bg.test.tsx:20,47,62`, `src/app/twitter-image.tsx:8`, `src/app/admin/stats/page.test.tsx:70,139,155,189,198,204,208,213,220`, `src/app/[locale]/contact/contact-form.tsx:40`, `src/app/api/track/route.ts:10,40,48,70`, `src/app/[locale]/layout.tsx:100,106` etc.

## Notes

- A6 did NOT modify any `src/` file per scope rules.
- The five user-visible em-dashes are inside metadata strings (page titles, OG image alt text, PWA manifest) that recruiters scrolling LinkedIn previews will see, so worth picking up in this round.
