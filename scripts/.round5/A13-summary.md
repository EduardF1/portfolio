# A13 — Pre-prod + Prototype env scaffolding + Future-features backlog (round 5)

## Eduard's ask

Set up a 3-tier env model (prod / pre-prod / prototype), document the
runbook, and seed the future-features backlog with the experiments
already on his mind — including a brand-new "videos on the sides of
sections" idea.

## Files created

- `docs/environments.md` — the 3-tier runbook (170 lines). Production /
  Preview / Prototype tiers, Vercel wiring steps, env-var scoping,
  flag-promotion + flag-cleanup workflow, "keeping prototype fresh"
  rebase procedure.
- `src/lib/proto-flags.ts` — 29-line prototype flag reader. Exposes a
  typed `protoFlags` object + `isProtoEnabled(name)` helper + `ProtoFlag`
  union type.
- `scripts/.round5/A13-summary.md` — this file.

## Files modified

- `.env.example` — appended a `# --- Prototype features ---` block with
  the 5 `NEXT_PUBLIC_PROTO_*` placeholders. Existing entries (Resend,
  Turnstile, BVB note) untouched.
- `docs/backlog.md` — appended 5 new items to the "PO + Architect
  future-features" section (after the honeypot entry, before "Process
  notes"). Existing entries untouched.

## New backlog items (5)

1. **Side-section videos** *(Eduard)* — bookend looping videos on long-
   form sections. NEW idea, not in any prior doc.
2. **Hero video full-bleed variant** *(Eduard)* — A/B against the
   current flanked variant; reuses existing `NEXT_PUBLIC_HERO_VIDEO_*`
   asset envs.
3. **Animated section dividers** *(PO)* — subtle motion at section
   transitions.
4. **Scroll-driven backgrounds** *(PO)* — CSS scroll-driven animations
   (Chromium-only with graceful fallback).
5. **Sticky parallax cards** *(PO)* — case-study / recommend cards that
   pin briefly on scroll.

All five are tagged `(prototype track)` and gated behind a specific
`NEXT_PUBLIC_PROTO_*` flag so they can ship dark on `prototype` and be
promoted to `main` one at a time.

## Decisions

1. **Static env references over dynamic lookups.** The brief's sample
   `proto-flags.ts` used `process.env[\`NEXT_PUBLIC_PROTO_${name}\`]`
   (template-string key). Per
   `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`,
   Next.js only inlines **literal** `process.env.NEXT_PUBLIC_*`
   references at build time — dynamic lookups resolve to `undefined` on
   the client. I rewrote the helper to read each flag with one literal
   `process.env.NEXT_PUBLIC_PROTO_<NAME>` reference, preserving the
   public API (`protoFlags.<flag>`, `isProtoEnabled(name)`,
   `ProtoFlag` type) so callers see no difference. Documented the
   gotcha in `docs/environments.md` so the next agent doesn't "simplify"
   it back to a dynamic lookup.
2. **No test file for `proto-flags.ts`.** Per the brief, the helper is
   too thin to be worth a test (5 boolean reads + 1 indirection).
   Flagged here so it's a conscious choice, not an oversight.
3. **Prototype env vars scoped to `Preview` only.** Vercel's `Preview`
   scope covers all non-`main` branches, including the long-lived
   `prototype` branch. Scoping there (instead of `Production`) means a
   prototype flag physically cannot leak into the prod build, even if
   someone fat-fingers a copy of the env value. The runbook spells this
   out in step 4.
4. **No separate long-lived `staging`.** Vercel Preview Deployments
   already give per-PR pre-prod URLs for free. Adding a `staging`
   branch would just be a second copy of `main` with no real benefit.
5. **Flag-cleanup deadline ~2 weeks.** Codified in the doc to keep
   prototype from becoming a graveyard of half-shipped ideas.

## Validation

- `npx tsc --noEmit` — clean (no output).
- `.env.example` parses (visual inspection: 5 new keys, blank values,
  preceded by comment block).
- `docs/backlog.md` reads coherently around the additions (new items
  follow the same `- [ ] **Title** *(Owner)* — body` shape as their
  neighbours).
- `docs/environments.md` is well-formed Markdown (headings, tables,
  fenced code blocks, internal anchor refs all balanced).

## Open follow-ups for Eduard

These are the manual / dashboard steps the runbook documents but cannot
do for you:

1. **Create the `prototype` branch and push it**:
   `git checkout -b prototype && git push -u origin prototype`.
   Run from `main` after this round merges, so the branch starts from a
   clean baseline.
2. **Vercel: assign `prototype.eduardfischer.dev`.** Dashboard →
   Project → Settings → Domains → add the subdomain → set its source
   branch to `prototype`. Vercel will surface the DNS record to add
   (`CNAME prototype → cname.vercel-dns.com`).
3. **Vercel: add `NEXT_PUBLIC_PROTO_*` env vars** scoped to `Preview`
   only. Set the ones you want to try to `1`; leave the rest blank.
4. **Schedule a recurring rebase**: after every prod release, rebase
   `prototype` on `main` (`git rebase main && git push
   --force-with-lease`). Force-with-lease is safe here because
   `prototype` has no other committers.
5. **Decide on first experiment to ship**: the runbook is ready, but
   none of the 5 backlog items have been picked up yet. Suggest
   starting with **side-section videos** since it's the new idea and
   pairs naturally with the hero-video work already in flight.

## Notes for adjacent agents

- The new helper file is at `src/lib/proto-flags.ts`. No agent in this
  round should be importing it yet (the prototype work itself hasn't
  started); when the first prototype feature lands it should add a
  test file alongside if it accumulates non-trivial logic.
- The `.env.example` additions and `docs/backlog.md` additions are
  append-only at the end of their respective relevant sections — no
  existing line was reordered or removed.
