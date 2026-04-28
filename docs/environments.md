# Environments

Three-tier deploy model for `eduardfischer.dev`. Read this once a quarter,
or before opening Vercel settings — it answers the "where does this go,
and how does it ship?" question without a doc-trawl.

## TL;DR

| Env            | Branch               | URL                                       | Purpose                                |
| -------------- | -------------------- | ----------------------------------------- | -------------------------------------- |
| **Production** | `main`               | `eduardfischer.dev` + `www.…`             | Public site                            |
| **Preview**    | every open PR        | `portfolio-<sha>-eduardf1.vercel.app`     | Pre-prod QA, share with stakeholders   |
| **Prototype**  | `prototype` (long-lived) | `prototype.eduardfischer.dev`         | Experimental features behind flags     |

There is **no separate long-lived staging**. Vercel's free Preview
Deployments are the pre-prod tier — every PR gets one, automatically.

---

## Production

- **Branch**: `main`
- **URL**: <https://eduardfischer.dev> + <https://www.eduardfischer.dev>
- **Deploy**: Vercel auto-deploys on push to `main`.
- **Gate**: PR review + green CI before merge. Direct pushes to `main`
  are reserved for docs-only changes (per `docs/backlog.md` Conventions).
- **Env vars**: `Production` scope in Vercel. **No `NEXT_PUBLIC_PROTO_*`
  here** — the prototype flags are scoped to `Preview` only so they
  cannot leak into prod by accident.

## Preview (pre-prod)

- **Trigger**: every open PR. Vercel posts the preview URL into the PR
  conversation and as a deployment status check.
- **URL**: `https://portfolio-<sha>-eduardf1.vercel.app` (Vercel-generated,
  per-commit; the PR comment also surfaces a `<branch>-eduardf1.vercel.app`
  alias that tracks the latest commit on the branch).
- **Use**: visual QA before merging; share with stakeholders for review;
  smoke-test the change in a real Vercel runtime (which is closer to prod
  than `next dev` ever is).
- **Gate**: passes Lighthouse CI + a11y CI + Playwright (Chromium) on the
  PR. Cross-browser nightly is non-blocking and runs on schedule, not per
  PR.
- **This is the pre-prod environment.** Treat the preview URL like a
  staging server: if it looks wrong there, do not merge.

## Prototype

- **Branch**: long-lived `prototype` (cut from `main`, periodically
  rebased — see "Keeping prototype fresh" below).
- **URL**: <https://prototype.eduardfischer.dev>
- **Use**: experimental features behind feature flags. Merge winners
  into `main` via a normal PR; abandon losers by toggling the flag off
  and removing the dead code.
- **Gate**: looser than prod. Eduard merges feature branches into
  `prototype` directly to try things; CI still runs but failures don't
  block merging here. The `main` PR that promotes the winner is the
  real gate.
- **Cleanup pattern**: a feature flag should be **removed within ~2
  weeks of promotion to prod**, so prototype doesn't accumulate dead
  code. If a flag has been "on, soon to ship" for a month, either ship
  it or delete it.

---

## Wiring the prototype branch

One-time setup. Steps 1–3 are git + Vercel UI; step 4 is per-flag.

### 1. Create the branch

```bash
git checkout main
git pull
git checkout -b prototype
git push -u origin prototype
```

### 2. Confirm Vercel branch settings

Vercel dashboard → Project (`portfolio`) → **Settings → Git**:

- **Production Branch**: `main` (already set; do not change).
- **Preview Branches**: All branches. The `prototype` branch will then
  receive a stable preview deployment automatically — no further
  config needed for the deployment itself.

### 3. Assign the prototype subdomain

Vercel dashboard → Project → **Settings → Domains**:

- Add `prototype.eduardfischer.dev`.
- In the domain's assignment UI, set the source branch to `prototype`.
  (Vercel labels this control "Production Branch" inside the domain
  panel; it just means "the branch this domain serves" and is independent
  of the project-wide Production Branch from step 2.)
- DNS: Eduard's DNS provider needs a `CNAME` for `prototype` →
  `cname.vercel-dns.com`. Vercel surfaces the exact record to copy.

### 4. Add the prototype env vars

Vercel dashboard → Project → **Settings → Environment Variables**.

For each `NEXT_PUBLIC_PROTO_*` variable in `.env.example`:

- **Scope**: `Preview` only (NOT `Production`, NOT `Development`).
  Scoping to `Preview` means the value also reaches the `prototype`
  branch's preview deployment, but never prod.
- **Value**: `1` to enable the flag, blank/missing to disable.

The code reads them via `src/lib/proto-flags.ts` — see the next section.

---

## Reading flags in code

`src/lib/proto-flags.ts` exports a `protoFlags` object and an
`isProtoEnabled(name)` helper, plus per-flag `*Enabled()` functions for
component/page mount sites. All three styles compile to the same
client-bundle output.

```ts
import {
  isProtoEnabled,
  protoFlags,
  animatedDividersEnabled,
} from "@/lib/proto-flags";

// In a component:
if (isProtoEnabled("sideSectionVideos")) {
  // render the prototype experience
}

// Or directly:
const layout = protoFlags.videoBackgroundFullBleed ? "B" : "A";

// Or the bare-function form (preferred at mount sites):
if (animatedDividersEnabled()) {
  // render the divider
}
```

**Why static references matter** (Next.js gotcha): only literal
`process.env.NEXT_PUBLIC_*` references are inlined into the client
bundle at build time. Dynamic lookups like
`process.env[\`NEXT_PUBLIC_${name}\`]` resolve to `undefined` in the
browser. The helper file uses one literal reference per flag for that
reason; do not refactor it to a dynamic lookup. See
`node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`.

## Active prototype flags

Each flag is `"1"` → on, anything else (unset, `""`, `"0"`) → off. Add
new flags to `src/lib/proto-flags.ts`, register them in this table, and
append the empty placeholder to `.env.example`.

| Flag                                       | Default | Effect                                                                                                                                                                                  |
| ------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_PROTO_VIDEO_BG_FULL_BLEED`    | off     | Hero video background renders full-bleed instead of contained inside the hero card.                                                                                                     |
| `NEXT_PUBLIC_PROTO_SIDE_SECTION_VIDEOS`    | off     | Inline videos in side-by-side sections on the homepage.                                                                                                                                 |
| `NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS`      | off     | Subtle animated dividers between major homepage sections. Thin gradient line + SVG sweep, 600ms ease-out, IntersectionObserver-driven, motion-reduce respected.                          |
| `NEXT_PUBLIC_PROTO_SCROLL_BG`              | off     | Scroll-driven decorative background behind the hero/about. Uses CSS `animation-timeline: scroll()`; wrapped in `@supports (...)` so Safari/Firefox fall back to a static gradient.       |
| `NEXT_PUBLIC_PROTO_PARALLAX_CARDS`         | off     | Sticky-parallax cards on `/writing` and `/recommends`. Each card pins briefly at the top of the viewport on scroll then releases. Pure CSS `position: sticky`, motion-reduce respected. |

Enable locally by adding the flag to `.env.local`, e.g.

```bash
NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS=1
```

Restart `next dev` after changing any `NEXT_PUBLIC_*` var so the build
pipeline re-inlines the value.

## Keeping prototype fresh

`prototype` is long-lived and **must** be rebased on `main` regularly,
otherwise it drifts and the merge-the-winner PR turns into a conflict
nightmare.

- After every prod release, rebase: `git checkout prototype && git
  rebase main && git push --force-with-lease origin prototype`. Force
  push is acceptable here because the branch is deploy-target-only;
  no one else commits to it.
- If conflicts get hairy, prefer `git reset --hard main` and re-apply
  the still-experimental flags on top.

## Promoting a flag to prod

1. Branch from `main` (not from `prototype`): `git checkout -b
   feat/<flag-name>-promotion`.
2. Cherry-pick or re-implement the feature on the new branch.
3. Remove the `NEXT_PUBLIC_PROTO_*` flag from
   `src/lib/proto-flags.ts`, `.env.example`, and any component guards.
4. Open a PR → review → merge to `main`.
5. Delete the env var from Vercel's `Preview` scope.
6. On `prototype`, rebase on `main` (the flag and gated code are now
   gone).

## Abandoning a flag

Same flow without step 4 — just remove the flag, the gated code, and
the env var. A flag that has been on for a month with no decision is a
flag to delete.
