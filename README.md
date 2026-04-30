# Eduard Fischer-Szava — Portfolio

**Live:** <https://eduardfischer.dev>  
**Repo:** `EduardF1/portfolio` (private)  
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Vercel

Personal portfolio, writing, travel photo journal, and professional showcase. Deployed automatically to Vercel on every push to `main`.

---

## Architecture

```
src/
├── app/[locale]/          # App Router pages (i18n: en / da)
│   ├── page.tsx           # Homepage — hero, BVB feed, GitHub feed, reading feed
│   ├── work/              # Case studies (MDX)
│   ├── writing/           # Blog posts (MDX)
│   ├── travel/            # Travel section
│   │   ├── page.tsx       # Country grid + Europe map
│   │   └── photos/country/[countrySlug]/  # Per-country photo pages (aggregated)
│   ├── contact/           # Contact form with Turnstile + Resend
│   ├── personal/          # BVB / personal section
│   └── recommends/        # Book & resource recommendations
├── components/            # Shared UI components
├── lib/
│   ├── trips.ts           # Photo catalogue reader + country aggregation
│   ├── trips-pure.ts      # Edge-safe trip clustering algorithm
│   ├── travel-locations.ts # Country → city mapping, map destinations
│   ├── bvb.ts             # Bundesliga live feed (OpenLigaDB, keyless)
│   ├── experience.ts      # CV / timeline data
│   └── proto-flags.ts     # Feature flags for prototype env
content/
├── work/*.mdx             # Case study MDX files
└── writing/*.mdx          # Blog post MDX files
scripts/
└── photo-catalogue.json   # SOURCE OF TRUTH for all ~847 travel photos
public/
└── photos/trips/          # Photo files served statically (not LFS)
```

### Key architectural decisions

| Concern | Decision |
|---------|----------|
| i18n | `next-intl` with `[locale]` segment; `en` and `da` supported |
| Routing | App Router, all pages server components unless interactivity needed |
| Styling | Tailwind CSS 4 (JIT). **No dynamic class fragments** — full strings only |
| MDX | `next-mdx-remote` + `gray-matter` + `rehype-pretty-code` (Shiki) |
| Maps | `react-simple-maps` + `d3-geo` (SVG, no tile server) |
| Photos | Static files in `public/photos/`, catalogued in JSON, aggregated per country |
| Email | Resend for delivery, Yahoo IMAP for E2E test verification |
| Captcha | Cloudflare Turnstile (server-side verification in contact action) |
| CV PDF | `@react-pdf/renderer` — generate with `npm run build:cv`, commit output |

---

## Photo System

The travel photo system is the most complex part of the codebase. Read this before touching anything under `src/lib/trips*` or `scripts/photo-catalogue.json`.

### Catalogue (`scripts/photo-catalogue.json`)

~847 entries. Every photo must have this shape to appear on country pages:

```json
{
  "src": "trips/2025-04-czechia-poland-slovakia-austria/IMG20250416162107.jpg",
  "takenAt": "2025-04-16T16:21:07Z",
  "hasGps": true,
  "gps": { "lat": 48.8767, "lon": 19.1178 },
  "place": { "city": "Harmanec", "country": "Slovakia", "display": "Harmanec, Slovakia" },
  "source": { "type": "personal" },
  "caption": "Harmanec, Slovakia · April 2025"
}
```

**An entry without `hasGps: true` + `gps` + `place.city` is invisible on country pages.**

### Two photo sources

- **Personal photos** (`source.type: "personal"`) — from `public/photos/trips/<folder>/IMG*.jpg`
- **Stock photos** (`source.type: "stock"`) — from Pexels. Download script pattern:
  ```
  https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=1920
  ```
  Process with sharp: max 1920×1920, JPEG quality 82, progressive mozjpeg.  
  Pexels API key (for search): `dfW5gSS00CrmUgPQraZC6rwcrybajthYnuiwzKPQtNV9XjE1NBEpTLVm`

### Country pages (how navigation works)

All navigation (country grid cards, map pins, city dots) links to `/travel/photos/country/<slug>`.

`getPhotosByCountry(slug)` in `src/lib/trips.ts` reads the catalogue directly — it **bypasses the clustering algorithm entirely**. This was an intentional architectural decision: rapid multi-country roadtrips (Balkans 2026, Spring 2025) create dozens of tiny per-day clusters that split city photos. The country page aggregates all photos for a country regardless of which trip folder they live in.

### Trip clustering (legacy / "Recent Trips" section only)

`clusterTrips()` in `src/lib/trips-pure.ts` groups photos into trip clusters for the "Recent Trips" cards on the travel page. `MAX_GAP_DAYS = 3`. Photos crossing country borders or >3 days apart form a new cluster. **This algorithm is edge-runtime safe (no Node.js APIs).**

### Minimum 5 photos per city rule

Every city in the catalogue must have ≥5 distinct photos. The Playwright test `e2e/country-photos-min5.spec.ts` enforces this on every CI run. Violation = CI failure.

---

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in keys as needed (most are optional for dev)
npm run dev                  # http://localhost:3000
```

Most features work without any env vars. The contact form logs to the console in dev when `RESEND_API_KEY` is unset.

### Available scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (~765 tests) |
| `npm run test:e2e` | Playwright E2E (all browsers) |
| `npm run test:e2e:fast` | Playwright E2E (skip a11y dump) |
| `npm run storybook` | Storybook on port 6006 |
| `npm run build:cv` | Regenerate CV PDFs → `public/cv/` |
| `ANALYZE=true npm run build` | Bundle analyser treemap |

---

## Environment Variables

See `.env.example` for the full annotated list. Key variables:

| Variable | Required in prod | Purpose |
|----------|-----------------|---------|
| `RESEND_API_KEY` | ✅ | Contact form email delivery |
| `CONTACT_TO` | ✅ | Delivery address for contact submissions |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ | Cloudflare Turnstile public key |
| `TURNSTILE_SECRET_KEY` | ✅ | Cloudflare Turnstile server verification |
| `ADMIN_SECRET` | ✅ | Guards `/admin/stats` and palette read endpoint |
| `CRON_SECRET` | ✅ (if digest on) | Vercel signs cron requests with this |
| `DAILY_SALT` | ✅ (if digest on) | Per-IP hash anonymisation seed |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Optional | Vercel KV for palette analytics |
| `YAHOO_IMAP_USER` / `YAHOO_IMAP_APP_PASS` | E2E only | Live email round-trip test (`RUN_LIVE_EMAIL=1`) |
| `NEXT_PUBLIC_PROTO_*` | Preview only | Feature flags — **never set on prod** |

---

## Deployment

**Automatic.** Push to `main` → Vercel deploys to <https://eduardfischer.dev>.

Every PR gets a preview deployment at `https://portfolio-<sha>-eduardf1.vercel.app`.

### Push workflow (private repo requires token)

```powershell
$token = gh auth token --user EduardF1
git remote set-url origin "https://EduardF1:${token}@github.com/EduardF1/portfolio.git"
git push origin main
```

### CV PDFs

`public/cv/` PDFs are **committed** (not generated at build time). Re-run `npm run build:cv` and commit whenever `src/lib/experience.ts`, `content/work/*.mdx`, or `messages/*.json` change.

### After deploying photo changes

Vercel serves `public/` as static assets. New/replaced photo files are live as soon as the deployment completes (~2–4 min after push).

---

## Testing

### Unit tests (Vitest)

```bash
npm test                    # run all
npm run test:coverage       # with coverage report
```

Key test files:
- `src/lib/trips-pure.test.ts` — clustering algorithm
- `src/app/[locale]/contact/contact.test.tsx` — contact form + attachment validation
- `src/components/bvb-feed.test.tsx` — BVB standings component

### E2E tests (Playwright)

```bash
npm run test:e2e            # all browsers
npm run test:e2e:fast       # skip a11y dump (faster)
RUN_LIVE_EMAIL=1 npm run test:e2e  # include Yahoo IMAP round-trip
```

Key E2E files:
- `e2e/country-photos-min5.spec.ts` — **asserts ≥5 distinct photos per city** on every country page
- `e2e/contact-form-attachments.spec.ts` — attachment type/size validation
- `e2e/contact-form-yahoo.spec.ts` — happy path + live email round-trip
- `e2e/a11y-audit-dump.spec.ts` — axe-core a11y audit (all pages)

### Storybook

```bash
npm run storybook           # interactive component explorer
npm run build-storybook     # static build → storybook-static/
```

---

## Critical Gotchas

1. **Tailwind JIT + dynamic classes** — never build class names from string fragments (e.g., `` `col-span-${n}` ``). The JIT scanner won't find them. Use full literal strings or a lookup object.

2. **`photo-catalogue.json` line endings** — Git will warn about LF→CRLF on Windows. This is fine; the file is JSON and the app reads it with Node's `fs`, not as text.

3. **Stock photo `takenAt` must be within 3 days** of personal photos in the same folder, or `clusterTrips()` will put them in a separate orphan cluster (invisible on trip pages, though country pages are unaffected).

4. **`next/image` with `priority`** adds `<link rel="preload">` in the document head. Only use `priority` on above-the-fold LCP candidates. External `<img>` tags (e.g., club crests) must have `loading="lazy"` to avoid spurious preload warnings.

5. **`process.env[dynamicKey]`** is always `undefined` in the browser. Next.js only inlines literal `process.env.NEXT_PUBLIC_*` references. The `proto-flags.ts` helper uses one literal per flag for this reason.

6. **The admin route** (`/admin/stats`) returns `notFound()` to unauthenticated visitors and carries `X-Robots-Tag: noindex`. Do not remove either guard.

7. **CV PDFs** are not auto-generated on Vercel build. Run `npm run build:cv` locally and commit the output files after any content change.

---

## Docs Index

Detailed runbooks live in `docs/`:

| File | Contents |
|------|----------|
| `docs/environments.md` | Vercel environments, prototype branch, feature flags |
| `docs/design.md` | Design system, colour tokens, typography, spacing |
| `docs/photo-organization.md` | Photo folder conventions and naming |
| `docs/metrics-setup.md` | Visit tracking, palette analytics, Vercel KV |
| `docs/perf-audit-2026-04.md` | Lighthouse scores and performance baseline |
| `docs/backlog.md` | Known issues and future ideas |
| `e2e/README.md` | E2E test setup, Yahoo IMAP live test instructions |


> **Note:** CV generation is also covered in the Deployment section above.
