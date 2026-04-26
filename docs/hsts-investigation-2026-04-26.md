# HSTS / encryption error investigation — 2026-04-26

Eduard reported an HSTS / encryption error after typing **`fischereduard.dev`**
(no dot between "fischer" and "eduard") into the address bar. Below is what
the DNS, TLS, and source-of-truth checks show.

## Canonical production URL

The portfolio's canonical hostname is **`eduardfischer.dev`** ("eduard"
first, "fischer" second). The repo is internally consistent — every
production reference uses this spelling:

- `src/app/[locale]/layout.tsx:32` — `metadataBase: new URL("https://eduardfischer.dev")`
- `src/app/sitemap.ts:6` — `const SITE = "https://eduardfischer.dev"`
- `src/app/robots.ts:3` — `const SITE = "https://eduardfischer.dev"`
- `src/app/writing/rss.xml/route.ts:3` — `const SITE = "https://eduardfischer.dev"`
- `src/app/manifest.webmanifest:2,3` — name & short_name reference `EduardFischer.dev`
- `src/app/actions/contact.ts:59` — `from: "Portfolio <noreply@eduardfischer.dev>"`
- All `opengraph-image.tsx` files render `EduardFischer.dev` in the brand strip.
- JSON-LD Person + Website blocks in `src/app/[locale]/layout.tsx:106-157` all
  use `https://eduardfischer.dev`.

There is no `vercel.json` (defaults are used) and no other domain configured.

## DNS resolution (run locally on Windows, 2026-04-26)

```
> Resolve-DnsName eduardfischer.dev -Type A
eduardfischer.dev   A   300   76.76.21.21      # Vercel anycast edge IP

> Resolve-DnsName fischereduard.dev -Type ALL
ERROR: fischereduard.dev : DNS name does not exist.
```

```
> Invoke-WebRequest -Uri https://eduardfischer.dev -Method Head
Status:  200 OK
Server:                       Vercel
Strict-Transport-Security:    max-age=63072000   (2 years)
X-Vercel-Id:                  arn1::iad1::…

> Invoke-WebRequest -Uri https://fischereduard.dev -Method Head
ERROR: No such host is known.  (fischereduard.dev:443)
```

## What this means

- **`eduardfischer.dev`** is the live Vercel deployment, currently serving
  HTTP 200 with a valid certificate and an HSTS header
  (`max-age=63072000` ≈ 2 years). This is the canonical URL.
- **`fischereduard.dev`** does not exist in DNS at all — there is no
  registration, no certificate, and no Vercel alias. It is a typo.

The browser HSTS error Eduard saw therefore was **not** about the live
site. The most plausible explanation is one of:

1. **Browser autocomplete / typed-URL HSTS preload remnant** — Chromium
   keeps a host-level HSTS pin in `chrome://net-internals/#hsts` for any
   domain that ever sent an STS header to that browser. If `fischereduard.dev`
   was briefly pointed somewhere with HSTS at any point in the past (even
   a stub Vercel preview, a parked-domain page, or a previous owner's
   site), the pin survives the domain going dark. Chromium then refuses
   plain-HTTP fallbacks and surfaces an encryption error when the host
   no longer resolves.
2. **Browser address-bar suggestion bug** — Chromium occasionally caches
   a "best guess" host with HSTS for misspellings; the symptom is the
   same.

Either way, this is a browser-local cache issue, not a Vercel / Cloudflare
/ DNS misconfiguration on our side. The live site is healthy.

## Action for Eduard

1. **Always navigate via `https://eduardfischer.dev`** — confirmed live,
   valid TLS, HSTS active. (Mnemonic: alphabetical — first name, then
   surname.)
2. **Clear the stale HSTS pin in Chromium** if the typo is sticky:
   - Visit `chrome://net-internals/#hsts`.
   - Under "Delete domain security policies", enter
     `fischereduard.dev` and click **Delete**.
   - Optionally repeat for any historical typos
     (`eduradfischer.dev`, `eduardfisher.dev`, etc.).
   - Restart the browser; the encryption error for the wrong domain
     should disappear (and the address will simply fail with a normal
     "site can't be reached" instead).
3. **No production fix needed.** The canonical domain's cert and HSTS
   header are intact; do not rotate anything.

## Optional follow-up (low priority)

If Eduard wants to defend against the typo, two registrar options:

- **Buy `fischereduard.dev`** at a registrar (.dev is Google-only, ~$12/yr),
  and add it as a Vercel domain alias that 301-redirects to
  `https://eduardfischer.dev`. This eliminates the typo trap permanently.
- **Skip**: the typo is a low-traffic personal-vector mistake; a one-time
  HSTS-cache flush is enough.

Recommendation: skip unless Eduard has been bouncing off the typo
repeatedly. The HSTS pin will time out on its own in 2 years if the
domain stays unregistered, and the canonical URL is on every CV / LinkedIn
/ email signature so the typo is unlikely to reach recruiters.
