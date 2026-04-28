# A7 — tooltip stub coordination notes for A5

A7 did not introduce any new icon-only buttons that need a tooltip key beyond what already exists.

Existing icon-only buttons that A7 verified are already aria-labelled (so no stub needed):

- `src/components/site-header.tsx` — hamburger (`t("openMenu")`), close (`t("closeMenu")`), locale toggle (`t("switchToDanish/English")`), brand link (literal name, OK).
- `src/components/theme-toggle.tsx` — light/dark toggle. Hardcoded English (`Switch to light/dark mode`); see `A7-i18n-suggestions.md`. **A5: no tooltip key needed; the aria-label is already in place — only the i18n migration is pending.**
- `src/components/search-trigger.tsx` — uses `t("openLabel")` from `nav.searchOpenLabel` or similar, fine.
- `src/components/search-palette.tsx` — uses `t("close")`, fine.
- `src/components/photo-lightbox.tsx` — uses `closeLabel`, `prevLabel`, `nextLabel` props passed by parent (already i18n'd).
- `src/components/recommendations-carousel.tsx` — has hardcoded EN (`Previous slide`, `Next slide`, `Go to slide …`). See `A7-i18n-suggestions.md`. Add `tooltips.testimonialsPrev` / `…Next` / `…Goto` if A5 wants them in the tooltips namespace, otherwise put them under `testimonials.*`.
- `src/components/section-heading.tsx` — info-icon button uses `aria-label="What is {kicker}?"`. The TOOLTIP CONTENT (`tooltip` prop) is already i18n'd by callers; only the icon's aria-label is hardcoded. See suggestions.

No new tooltip stub keys created. The `tooltips.*` namespace already covers every section heading; A5's existing keys are sufficient for the page-level work A7 owns.
