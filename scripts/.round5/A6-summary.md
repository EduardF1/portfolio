# A6 — Copy QA + LinkedIn-Readiness Polish · Summary

Branch: `feat/v1-polish-round4` (left uncommitted, per brief).
Scope: `messages/en.json`, `messages/da.json` (excluding `tooltips.*`), and all `content/**/*.mdx`.

## 1. Em-dash → comma sweep

**Result:** 4 occurrences across 2 MDX files. Zero in messages.

| File | Line | Before | After |
| --- | --- | --- | --- |
| `content/writing/three-tier-thinking.mdx` | 36 | `which of the three pressures — testability, parallel work, future migration — the codebase is going to face` | `which of the three pressures, testability, parallel work, future migration, the codebase is going to face` |
| `content/writing/three-tier-thinking.mdx` | 42 | `The other end — the small Symfony movies app, the Express cars CRUD, the weekend repos — is where the three tiers should blur on purpose.` | `The other end, the small Symfony movies app, the Express cars CRUD, the weekend repos, is where the three tiers should blur on purpose.` |
| `content/work/greenbyte-saas.mdx` | 17 | `for the renewables sector — Kalenda, Millwatcher, EnergyMaster, Roberta and Vindmøllenet — used by operators` | `for the renewables sector, Kalenda, Millwatcher, EnergyMaster, Roberta and Vindmøllenet, used by operators` |

Note: line 17 of `greenbyte-saas.mdx` had two em-dashes inside one sentence; counted as one fix above (one diff).

**Preserved:** all en-dashes in date ranges (`Oct 2021 – May 2022`, `Nov 2021 – Sep 2024`, etc.) and the Arrange–Act–Assert hyphenation in `kombit-valg.mdx:39`. Em-dashes inside code blocks: none found.

**Verification:** post-edit grep for `—` across `messages/` and `content/` returns zero hits.

## 2. Placeholders found

Searched: `Lorem`, `TODO`, `FIXME`, `[INSERT`, `TBD`, `(location guess)`, `placeholder`, `xxx`, `???`.

**User-facing copy hits:** zero. The only `placeholder` match is the i18n property name `search.placeholder` (the value is real copy: `"Search posts, articles, work, recommends…"`). Detail in `A6-placeholders-found.md`.

`TODO` occurrences in `src/` are in code comments outside A6 scope; flagged for awareness in `A6-page-strings-to-polish.md`.

## 3. Professional tone polish

**Result:** no rewrites needed in messages/MDX. The copy is already in Eduard's voice — measured, concrete, professional, and warm. The hedge-word grep (`just`, `really`, `very`, `quite`, `basically`, `simply`, `I love`, `amazing`, `awesome`, `cool`) returned only:

- `messages/en.json` `recommends.description`: "With the reasoning, not just the link." — `just` is the rhetorical pivot of the sentence, not filler. Kept.
- `content/work/greenbyte-saas.mdx` summary: "Just under three years…" and body: "Just shy of three years." — both idiomatic time expressions, not hedges. Kept.
- Hits inside recommendation-letter quotes (`natali-munk-jakobsen.mdx`, `jesper-hestkjaer.mdx`) — verbatim third-party quotes; not editable.

No "I love coding"-class amateurishness anywhere; the recruiter scroll-test passes already.

## 4. EN/DA parity

**Within A6 scope (everything outside `tooltips.*`):**

| Metric | Value |
| --- | --- |
| EN leaf keys (non-tooltip) | 254 |
| DA leaf keys (non-tooltip) | 254 |
| Keys only in EN | 0 |
| Keys only in DA | 0 |
| Identical EN/DA strings | 8 — all legitimate (proper nouns and tech terms used unchanged in Danish: `Backend`, `Frontend`, `Data`, `Borussia Dortmund`, `Intro`, `Download CV`, `Download CV (EN)`, `Download CV (DA)`) |

**A6 scope is at full parity.** Danish translations are natural and recruiter-readable (e.g., `aboutP1` translates "five-plus years" as "over fem års erfaring" rather than a literal calque; `whatsNextLead` keeps Eduard's tone). No DA→EN translation friction surfaced.

**Out-of-scope finding (flagged for Agent A5):** `tooltips.*` has 60 EN keys missing in DA (`tooltips.navWork`, `tooltips.navWriting`, … through `tooltips.privacyPage`). The original 11 `tooltips.*` entries are present in both languages and parity-clean; the 60 newer additions are EN-only. This is A5's ownership per brief; left untouched.

## 5. MDX changes

**Files touched:** 2.
- `content/writing/three-tier-thinking.mdx` — em-dash sweep.
- `content/work/greenbyte-saas.mdx` — em-dash sweep.

All other MDX (work × 4, articles × 2, recommends × 1, recommendation letters × 12) reviewed end-to-end. Detail in `A6-mdx-pending.md`. None needed copy edits.

## 6. What still needs Eduard's hand

Nothing in A6 scope is blocking publication. Items to consider when he reads through:

- `content/recommends/letters/raitis-magone.mdx` calls the Greenbyte mobile app the "Kalenda Android application", while `content/work/greenbyte-saas.mdx` describes it as Flutter / Dart (cross-platform). Both can be true; worth a glance for consistency.
- `content/recommends/letters/daria-maria-pelle.mdx` ends with a chatty "Best of luck in your future projects, Eduard!" — verbatim LinkedIn quote, but the closer reads slightly student-y. Eduard may want to trim the sign-off when polishing the page render.
- Five user-visible em-dashes live in `src/` page strings (page title, OG image alt text, PWA manifest, admin empty state). Out of A6 scope by rule; documented in `A6-page-strings-to-polish.md` for the agent owning those files.

## Files written

- `scripts/.round5/A6-summary.md` (this file)
- `scripts/.round5/A6-placeholders-found.md`
- `scripts/.round5/A6-mdx-pending.md`
- `scripts/.round5/A6-page-strings-to-polish.md`

## Files edited

- `content/writing/three-tier-thinking.mdx`
- `content/work/greenbyte-saas.mdx`

No edits to `messages/en.json` or `messages/da.json` required — both files already met the bar.
