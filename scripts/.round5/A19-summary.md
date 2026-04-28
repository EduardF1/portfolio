# Agent A19 — Photo organization doc — summary

Run date: 2026-04-27
Branch: `feat/v1-polish-round4` (no commits made; uncommitted for PO)

## Files created

- `docs/photo-organization.md` (new) — 10,853 bytes, 8 sections
  - Folder taxonomy under `public/photos/` (trips/ + personal/)
  - Filename conventions (archive vs slug-named hero vs stock)
  - Catalogue schema with full field reference
  - Adding-a-new-trip walkthrough
  - Adding-a-stock-photo walkthrough
  - Banned-content rules (Eduard's standing list)
  - Trip-detail ≥5-photo target
  - Related docs index + open questions

## AGENTS.md change

Appended one line at the bottom (after the existing `<!-- END:nextjs-agent-rules -->`
block, separated by a blank line). Verbatim:

```
- Photos: see `docs/photo-organization.md` for folder layout, naming, catalogue schema, and stock attribution rules.
```

The five existing lines (Next.js agent rules block) are untouched.

## Conventions confirmed against actual round-5 state

- Multi-country folder slug examples in repo:
  `2025-04-czechia-poland-slovakia-austria`, `2026-03-balkans-roadtrip`,
  `2025-09-andalusia-gibraltar`. The doc captures both flavours
  ("country-country-country" vs "region name").
- Camera filename formats live side-by-side in the same trip folders
  (`IMG_20180323_113715.jpg` Huawei vs `IMG20250917154701.jpg` OnePlus). Doc
  notes both; convention is "preserve as-is, the catalogue keys off the path".
- Confirmed via grep: no catalogue entry uses `"type": "personal"` and no
  catalogue entry has `src` starting with `personal/`. Personal hero photos
  are page assets, NOT catalogue entries. The doc spells this out explicitly
  so future agents don't try to "complete" the catalogue by adding them.
- Stock entries always carry the full `source` block (provider, url,
  photographer, photographerUrl, license, licenseUrl). All v1 stock is from
  Pexels per A14's single-provider decision.

## Things for Eduard to verify

1. **Folder name `personal/` vs `featured/`.** The folder currently mixes
   "personal" portraits with "hero photos reused on pages" (BVB stadium,
   Vienna street, Milan). The name `personal/` is a misnomer for several of
   them. Renaming would cascade through `src/app/[locale]/personal/page.tsx`
   and any tests; not in this round's scope, but flagged in section 1 + as an
   open question at the bottom of the doc. Decide for round 6 or later.

2. **Explicit `source.type: "personal"` vs absent `source` block.** The
   current convention is "absent `source` block ⇒ personal photo". Cleaner
   for hand editing; less friendly to TypeScript consumers that want a
   discriminated union. Doc captures the current convention but flags as an
   open question. If you want explicit, A14 (or a future agent) can do a
   one-shot pass to backfill.

3. **`docs/backlog.md` as the prior-decisions reference.** I asserted in the
   stock-fill section that `docs/backlog.md` carries prior sourcing
   decisions; A14's per-trip rationale actually lives in
   `scripts/.round5/A14-summary.md`. The doc references both, so this is
   correct, but if backlog.md gets pruned of stock-related history later we
   should update the cross-reference.

4. **Trip-folder naming auto-derivation.** A1's summary says "Trip-folder
   naming is auto-derived from country+YYYY-MM in the catalogue, with curated
   names for the four big multi-country trips". The doc presents the slug as
   manual ("decide the folder slug"). In practice it IS manual when the trip
   spans multiple countries — the auto-derivation is just for the
   single-country case. The doc covers both, but if there's a script that
   actually generates the slug, point me at it for round 6 and I'll add a
   one-liner.

## Out-of-scope (not touched)

- No code files modified.
- No other docs touched (other agents are editing `docs/`).
- No commit; branch left dirty for the orchestrator.
- No build / e2e run.
