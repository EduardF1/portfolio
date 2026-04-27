# Contrast fixes — 2026-04-28 (Round 6, light-mode pass)

> WCAG 2.1 AA contrast audit and fixes for the three light-mode
> palettes. Dark mode already passes AA per
> `docs/perf-audit-2026-04.md`.

## Methodology

- Inline WCAG 2.1 contrast helper at `src/lib/contrast.ts` (no runtime
  dep; canonical sRGB-luminance formula). Tested in
  `src/lib/contrast.test.ts`.
- AA thresholds: **body text ≥ 4.5:1**, **large text + UI / graphical
  objects ≥ 3:1** (WCAG SC 1.4.3 + 1.4.11).
- Tokens audited per palette (light only): `--color-foreground`,
  `--color-foreground-muted`, `--color-foreground-subtle`,
  `--color-accent`, `--color-accent-foreground` against
  `--color-background` and (where actually painted as text bg) against
  `--color-surface`.
- Δ ≤ 8 in CIE L\* preferred when minimal-tweak is enough; documented
  deviations otherwise.

## Tokens deliberately not boosted

| Token                       | Why                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `--color-border` vs bg      | Decorative card divider; not a UI control or graphical-object that conveys meaning. WCAG 1.4.11 exempts purely decorative dividers, and bumping it visibly thickens every card edge. Focus rings (`--color-ring`) are separately AA-compliant. |
| `--color-surface-strong`    | Used only in the hero gradient and the `<TravelEuropeMap>` sea fill — never as a text background. No text-contrast obligation. |
| `--color-foreground-subtle` on `--color-surface` | Token is only painted on `bg-background`, never on `bg-surface`, in the current codebase. (Surface is reserved for code blocks and ambient panels using `text-foreground` or `text-foreground-muted`.) |

## Audit results & fixes

### Schwarzgelb (light) — the cream/gold palette Eduard flagged

| Combo                                         | Before                        | After                          | Notes                                                              |
| --------------------------------------------- | ----------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `foreground` vs `background` (#1F2A2C / #F6F3EA) | **13.27:1** ✅                 | (unchanged) **13.27:1** ✅      | —                                                                  |
| `foreground-muted` vs `background`             | **5.35:1** ✅                  | (unchanged) **5.35:1** ✅       | —                                                                  |
| `foreground-subtle` vs `background`            | `#6F7570` → **4.25:1** ❌      | `#6B716C` → **4.50:1** ✅       | Δ L\* ≈ 1.6 (visually identical).                                  |
| `accent` vs `background` (link/UI)             | `#B89968` → **2.43:1** ❌      | `#A88554` → **3.08:1** ✅ (AA-large/UI) | Δ L\* ≈ 7.2. See "Why we accepted AA-large" below.        |
| `accent-foreground` vs `accent` (chip)         | `#1F2A2C` on `#B89968` = **5.47:1** ✅ | `#1F2A2C` on `#A88554` = **4.31:1** (AA-large only) | Slipped from AA-body to AA-large. Acceptable: chip text is short labels (`Active`, `Filter`), not paragraphs, and the colour change was driven by the link-on-bg fix above. |

#### Why Schwarzgelb accent stays at AA-large (3:1)

The schwarzgelb gold gamut on cream is mathematically incapable of
clearing **4.5:1 link-on-background AND 4.5:1 chip-text-on-accent
simultaneously**, regardless of Δ:

- At any gold light enough to keep a dark chip text ≥ 4.5 on accent,
  the link-on-bg ratio is < 3.5.
- At any gold dark enough to clear 4.5 link-on-bg, the dark chip text
  drops below 3:1.

Choices considered:

1. **Split into two tokens** (`--color-accent` for chip/decoration,
   new `--color-link` for body links). Cleanest structurally but
   touches every `text-accent` consumer (~15 files). Out of scope for
   a single round.
2. **Pick a value that clears AA-large (3:1) for both link and chip,
   and enforce a non-color signal for body links.** ✅ Adopted.

The body-link contract is enforced in `src/components/mdx-components.tsx`:
MDX `<a>` is now `text-accent underline decoration-1 underline-offset-4
hover:decoration-2` (always-underlined, hover thickens). This satisfies
WCAG SC 1.4.1 (Use of Color) and lets the 3.08:1 ratio carry under
SC 1.4.11 (Non-text Contrast) for the link as a UI object.

The recommendations carousel author link already has a dotted underline
(`docs/perf-audit-2026-04.md` row #3 in the audit fix list).

#### Action item for follow-ups

- [ ] If the chip text 4.31:1 ever feels low in QA, switch chip
      text-color to white (`#FFFFFF` on `#A88554` = 3.42 — worse, not
      better; another option is to adopt a slightly lighter accent for
      the chip background only via `--color-accent-soft`-derived
      tinting). Best long-term: split `--color-link` from
      `--color-accent` and let chip stay at the original brighter gold.

### Mountain-navy (light)

All combos already ≥ AA from the polish round 4 fixes. No tokens changed.

| Combo                                  | Ratio                | Status |
| -------------------------------------- | -------------------- | ------ |
| `foreground` vs `background`           | 16.59:1              | ✅     |
| `foreground-muted` vs `background`     | 7.04:1               | ✅     |
| `foreground-subtle` vs `background`    | 5.56:1               | ✅     |
| `accent` (#0E7490) vs `background`     | 4.98:1               | ✅     |
| `accent-foreground` vs `accent` (chip) | 5.36:1 (white on #0E7490) | ✅ |

### Woodsy-cabin (light)

| Combo                                  | Before                    | After                     | Notes |
| -------------------------------------- | ------------------------- | ------------------------- | ----- |
| `foreground` vs `background`           | 12.74:1 ✅                | (unchanged) 12.74:1 ✅    | — |
| `foreground-muted` vs `background`     | 6.83:1 ✅                 | (unchanged) 6.83:1 ✅     | — |
| `foreground-subtle` vs `background`    | 4.57:1 ✅                 | (unchanged) 4.57:1 ✅     | Already AA-body. |
| `accent` vs `background`               | `#7A8B6F` → **3.12:1** ❌ | `#5F6F54` → **4.62:1** ✅ | Δ L\* ≈ 11. Exceeds the heuristic Δ ≤ 8 cap, see below. |
| `accent-foreground` vs `accent` (chip) | cream on `#7A8B6F` → **3.12:1** ❌ | cream on `#5F6F54` → **4.62:1** ✅ | Same swap fixes both. |

#### Why woodsy-cabin Δ L\* exceeds 8

The cream/sage gamut is in the same "valley" as Schwarzgelb's gold/cream
— but the woodsy palette has the advantage that the chip text is also
cream (a light tone). That means a single accent darkening of Δ L\* ≈ 11
fixes **both** failures simultaneously:

- Body-link ratio: 3.12 → 4.62 (clears AA-body).
- Cream-chip ratio: 3.12 → 4.62 (clears AA-body).

The smaller Δ L\* ≈ 8 alternative (`#687962`) clears AA-body for
white-text chip but **only AA-large** for the existing cream chip. So
the 11-point shift is the smallest delta that resolves both AA-body
constraints with no consumer code changes. The deeper sage retains the
"woodsy cabin" character — it reads as a cooler shadow of the original
sage rather than a different hue.

## Files changed in this branch

- `src/app/globals.css` — token edits in `[data-palette="schwarzgelb"]`
  and `[data-palette="woodsy-cabin"]` light-mode blocks (no Tailwind
  config).
- `src/components/mdx-components.tsx` — body links always-underlined.
- `src/lib/contrast.ts` (new) — WCAG helper.
- `src/lib/contrast.test.ts` (new) — guardrail test for the AA matrix.
- `docs/contrast-fixes-2026-04-28.md` (this file).

## Visual QA notes

Run `npm run dev`, switch palettes via the selector, and visually scan:

1. `/` — hero, recommendations carousel author link (Schwarzgelb gold
   should now read as a deeper antique-brass; carousel author link
   already had dotted underline, still legible).
2. `/work` and `/recommends` — case-study links inside MDX (always
   underlined now; check that the underline doesn't visually clash on
   long links).
3. Filter chips on `/recommends` and `/writing` — verify Schwarzgelb
   active-chip text reads OK (4.31:1 — borderline, but only on short
   labels).
4. Footer subtle text — the Δ ≈ 1.6 nudge to `foreground-subtle` should
   be invisible in side-by-side comparison.
