# A24 — Backlog Round 5 reconciliation

Branch: `feat/v1-polish-round4` (no commits made; backlog edit only)

## Items marked done (5)

All five "Eduard fills in" items flagged stale by A9's audit were verified against current source-of-truth files and re-marked as done with `(verified done 2026-04-28 by Round 5 audit)`:

1. **Hero About narrative** — verified by reading `messages/en.json` + `messages/da.json` lines 32–38 (`hero`, `heroSubtitle`, `aboutP1`, `aboutP2`, `aboutP3Lead`, `aboutP3LinksHint`). All EN+DA strings carry real prose, no placeholders.
2. **"My contribution" sections** — verified by reading `content/articles/digitalization-of-waste-collection-feral-systems.mdx` (line 28+) and `content/articles/conceptualization-of-an-audit-management-system.mdx` (line 30+). Both `## My contribution` sections have substantive content. The thesis one is detailed (stakeholder mapping, MoSCoW prioritisation, UML, COTS screening landing on Qarma/Segura). The feral-systems one is shorter ("Group 22 deliverable, jointly authored…") which is technically filled though minimal — flagging as ambiguous (see below).
3. **Personal page prose — Football placeholder grid** — verified by reading `src/app/[locale]/personal/page.tsx` lines 78–101. Football section now renders an `Image` figure with `/photos/bvb-yellow-wall-suedtribuene.jpg`. No placeholder grid remains.
4. **Recommendations carousel — remaining LinkedIn recs** — verified by listing `content/recommends/letters/*.mdx`: 12 letter MDX files exist (tobias-thisted, nanna-dohn, niels-svinding, martin-hovbakke-sorensen, claus-hougaard-hansen, daria-maria-pelle, fabian-stefan-bernhardt, jesper-hestkjaer, mathias-stochholm-waehrens, natali-munk-jakobsen, raitis-magone, stefan-daniel-horvath). `src/lib/recommendations.ts:34-71` reads all `.mdx` files in the directory, so all 12 are wired.
5. **`/my-story` page** — verified by reading `src/app/[locale]/my-story/page.tsx` lines 20–90. All 10 chapters (the original 8 plus "Paying my own way" 2016–2021 and "Putting roots down" 2017–2023) carry full prose bodies with `body` and `takeaway` fields populated. No italicised placeholders remain. Marked the existing "shell shipped" line as `[x]` with the audit annotation rather than removing the original (preserves history).

## New items added (13)

All appended under a new "### Round 5 follow-ups (2026-04-28)" subsection placed inside the "Architect pass" block, immediately after the Live Yahoo IMAP MCP item and before the future-features block. Each carries an owner tag in italics:

1. BVB Playwright route mock *(Architect)* — verify A17's mock works after first nightly run
2. Per-route OG images — verification *(Architect)* — LinkedIn preview check after merge
3. Lightbox attribution UI — visual review *(Architect)*
4. Stock-photo audit (~47 entries) *(Eduard)* — `docs/photo-attributions.md` glance-through
5. Cross-platform first-nightly triage *(Architect)* — flip `continue-on-error` after 5 green nights
6. Visual regression baselines for Playwright *(Architect)*
7. Safari/Webkit CSS fixes *(Architect)* — punch list at `scripts/.round5/A22-safari-audit.md`
8. Tablet + landscape layout fixes *(Architect)* — punch list at `scripts/.round5/A23-tablet-landscape-audit.md`
9. Lightbox UI for stock photos: design review *(Designer)*
10. Prototype branch wiring (manual) *(Eduard)* — see `docs/environments.md`
11. Prototype-flag sweep cleanup *(Architect, scheduled +2 weeks)* — cross-references the new Scheduled agents section
12. Visit-notification email cron *(Eduard, design review)* — A20's `docs/visit-notification-design.md`
13. Theme/palette analytics *(Eduard, design review)* — A21's `docs/palette-analytics-design.md`

### Near-duplicate notes (kept both)

- **Visit-notification email** already existed in "User requests" as an Eduard approval item. The Round 5 follow-up tracks A20's design-doc review specifically. Different stage; both retained.
- **Theme/palette analytics** already existed in the future-features block as an Architect proposal. The Round 5 follow-up tracks A21's design-doc review with Eduard. Different stage; both retained.

## Schedule entry added

New `## Scheduled agents` section inserted between the queue block and `## Process notes`, with the prototype-flag sweep entry verbatim per the brief.

## Process notes appended

One-liner added: "Round 5 (2026-04-28): 15-agent sprint — see `scripts/.round5/` for individual agent summaries."

## Anything Eduard should re-verify

- **feral-systems "My contribution"** is technically filled but minimal — a single sentence naming the four co-authors and identifying it as a Group 22 deliverable. If Eduard wants a sharper personal contribution paragraph (analogous to the thesis one), that work would re-open. I marked it as done because the placeholder is gone and the section answers the question, but flag it here so the audit trail is honest.
- **Stock-photo audit count (~47)** is taken from the brief's wording; A24 did not independently count `docs/photo-attributions.md` entries. If A14's actual count differs, the parenthetical in the backlog item can be tightened on next pass.
- **A22 / A23 audit files** are referenced as `scripts/.round5/A22-safari-audit.md` and `…/A23-tablet-landscape-audit.md` per the brief; A24 did not verify their existence (the brief notes A22/A23 are "in flight"). If they ship under different filenames, fix the references.

## Validation

- `docs/backlog.md` parses as Markdown — checked structure: no broken table rows, no unbalanced fences, all original sections preserved in original positions.
- All new items have explicit owner tags in italic parentheses.
- No code files touched. No commits made.
