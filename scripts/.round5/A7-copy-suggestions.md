# A7 — copy suggestions for A6

Items A7 noticed during the page-level sweep that are A6's copy domain. A7 did NOT edit copy.

## Hero CTAs (`src/app/[locale]/page.tsx`, lines 109–133)

Current order: `See selected work` → `Download CV (EN)` → `Download CV (DA)`.

Observations:

- The hero shows BOTH CV downloads in BOTH locales. This is correct for a bilingual portfolio — visitors should be able to grab whichever language CV they prefer regardless of which version of the site they're reading. Don't simplify away the "wrong" locale's CV.
- However, three back-to-back rounded buttons of similar visual weight may feel button-heavy. A6 can consider whether the DA button should de-emphasise (e.g. text-link styling) when locale === "en", and vice versa. **Structural change only — A7 flagged for A6 since it touches CTA copy hierarchy.**

## "Hire me" CTA absence

The brief says hero should have clear CTAs (Hire / Read / Contact). Currently:

- "Read" → `See selected work` (button, links to `/work`) — covered.
- "Contact" → no direct hero CTA. Footer + `/contact` only.
- "Hire" — no hero CTA. The portfolio is implicitly a hire-me, but no explicit "available for [thing], talk to me" line.

`home.heroSubtitle` already says "I'm Eduard, a Software Engineer at Mjølner Informatics in Aarhus. Calm under complexity, …" — calm, but doesn't name the call to action. A6 may consider adding a fourth muted button "Get in touch" or building it into the subtitle.

## Recommendations carousel "Pause" button (line 261)

`<button>Pause</button>` is the only visible string in the auto-rotating carousel. A6 may want to consider whether this should also have a "Play" state when paused — currently the button disappears once paused (line 255 condition `mode === "auto"`).

## Privacy page (`src/app/privacy/page.tsx`)

EN-only POC. The TODO comment at top of file says A6/Dev A will localise. A6 owns the copy translation when ready.

## "Now" page (`src/app/[locale]/now/page.tsx`)

The body of every section is hardcoded English in `.tsx`:
- Lines 64–84 (focus paragraph)
- Lines 92–105 (reading paragraph)
- Lines 113–138 (side-bets paragraph)
- Lines 146–160 (lately paragraph)

Only the kickers + section labels go through `t(...)`. A6 should land the body copy in `now.focusBody`, `now.readingBody`, `now.sideBetsBody`, `now.latelyBody` — preserving the inline `<Link>` helpers (`/recommends`, `/work`, `/writing`, `/personal`, `mjolner.dk`).

## "How I Work" component (`src/components/how-i-work.tsx`)

Six BULLETS in a const array, plus heading + lede at lines 67–72. All English. A6 should land copy under `home.howIWork.*`.

## `recommends/[slug]/page.tsx` (lines 52, 57, 71)

Three short hardcoded English strings (`All recommendations`, `Reviewed`, `Visit product`). Already noted in `A7-i18n-suggestions.md` — flagging here too because A6 owns the wording.

## Hero portrait alt (`src/app/[locale]/page.tsx` line 157)

`alt="Eduard Fischer-Szava, portrait"` — a comma-separated alt is OK, but most screen readers will read it as a single phrase. A6 may want to consider `"Portrait of Eduard Fischer-Szava"` for clearer cadence. Minor.

## Footer (`src/components/site-footer.tsx`)

Line 31: `© {year} Eduard Fischer-Szava · Aarhus, Denmark` — the location string ("Aarhus, Denmark") is duplicated with `common.available` and `footer.rights`. A6 should pick one canonical key; the current footer renders the literal string instead of using `t("footer.rights")` even though the key exists.

Line 45: `Privacy` — hardcoded link text. Already a known TODO (i18n privacy page).

---

That's the full copy-suggestion list from the A7 sweep. Most of the portfolio is i18n-clean at the .tsx level; the cluster is on the now-page bodies, the how-i-work component, and one leaf page (`recommends/[slug]`).
