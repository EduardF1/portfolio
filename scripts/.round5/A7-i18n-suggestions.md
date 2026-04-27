# A7 — i18n suggestions for A5 / A6

Hardcoded strings found in `.tsx` files that should be translated. Listed by file with proposed translation keys. A7 did NOT touch `messages/*.json`; these are handed off.

## src/app/[locale]/recommends/[slug]/page.tsx

Lines 52, 57, 71. Three short UI strings, plus the "Reviewed {date}" pattern.

| Line | Hardcoded EN | Proposed key | Notes |
|------|--------------|--------------|-------|
| 52 | `All recommendations` | `recommends.allLink` | Back-link label |
| 57 | `Reviewed {formatDate(...)}` | `recommends.reviewed` (already exists in `recommends.reviewed` for the index) | Reuse the existing ICU `{date}` key |
| 71 | `Visit product` | `recommends.visitProduct` | External-link CTA |

When A5/A6 add the keys, the `.tsx` should switch to:
```tsx
const t = await getTranslations("recommends");
// ...
{t("allLink")}
{category} · {t("reviewed", { date: formatDate(...) })}
{t("visitProduct")}
```

## src/components/recommendations-carousel.tsx

Lines 217, 225, 242, 261. Carousel control aria-labels + visible Pause label, all hardcoded English.

| Line | Hardcoded EN | Proposed key |
|------|--------------|--------------|
| 124 | `Recommendations` (region label) | `testimonials.regionLabel` |
| 217 | `Previous slide` (aria) | `testimonials.prevSlide` |
| 225 | `Next slide` (aria) | `testimonials.nextSlide` |
| 242 | `Go to slide {i+1} of {total}` (aria) | `testimonials.gotoSlide` (ICU `{n}/{total}`) |
| 261 | `Pause` (visible) | `testimonials.pause` |

## src/components/section-heading.tsx

Line 24. Default tooltip-button aria-label (`What is ${kicker} ?`).

| Hardcoded EN | Proposed key |
|--------------|--------------|
| `What is {kicker}?` / `What is this section?` | `tooltips.whatIs` ICU `{kicker}` |

This component is a client component and uses `next-intl`'s `useTranslations` hook fine. A5 (tooltips) is a natural owner.

## src/components/section-nav.tsx

Line 26. Default `ariaLabel = "On this page"`.

| Hardcoded EN | Proposed key |
|--------------|--------------|
| `On this page` | `nav.onThisPage` |

Note: `section-nav.test.tsx` asserts the literal "On this page" — when the key lands, the test should be updated too.

## src/components/theme-toggle.tsx

Line 20. Theme toggle aria-label.

| Hardcoded EN | Proposed key |
|--------------|--------------|
| `Switch to light mode` / `Switch to dark mode` | `nav.switchToLight` / `nav.switchToDark` |

## src/components/site-header.tsx

Lines 108, 120, 243. Brand link + nav `aria-label` strings.

| Line | Hardcoded EN | Proposed key |
|------|--------------|--------------|
| 108 | `Eduard Fischer-Szava` (brand-link aria) | proper noun, can stay as-is |
| 120 | `Primary` (desktop nav) | `nav.primaryNavLabel` |
| 243 | `Mobile primary` (mobile sheet nav) | `nav.mobileNavLabel` |

## src/components/github-stats.tsx

Line 56. Region aria-label.

| Hardcoded EN | Proposed key |
|--------------|--------------|
| `GitHub profile stats` | `work.githubStatsRegion` |

## src/components/reading-feed.tsx

Line 107. Source-selector aria-label.

| Hardcoded EN | Proposed key |
|--------------|--------------|
| `Reading feed source` | `writing.readingFeedSource` |

## src/app/[locale]/writing/page.tsx

Lines 127–131. ReadingFeed kicker/tooltip props passed as hardcoded EN.

| Hardcoded EN | Proposed key |
|--------------|--------------|
| `Reading` | `writing.readingKicker` |
| `A live, hourly-refreshed list of community posts. ...` | `tooltips.reading` |

## src/app/privacy/page.tsx + src/app/privacy/layout.tsx

Currently EN-only outside `[locale]`. The TODO at top of the file says A6/Dev A will localise. Already documented in code; no extra note needed.

## src/components/how-i-work.tsx

Lines 33–55 (BULLETS array) + line 67–72 (heading + lede). Six short principles, each grounded in a CV anchor. **Copy lives in source.** Owner: A6 (copy). When A6 lands, every bullet's `where` and `body` should land under e.g. `home.howIWork.bullets.0`, plus `home.howIWork.heading` + `home.howIWork.lede`.

## src/app/actions/contact.ts

Lines 6, 7, 11, 104, 111. Zod schema messages + server-action error responses.

| Line | Hardcoded EN | Notes |
|------|--------------|-------|
| 6 | `Name is required` | Zod default |
| 7 | `Enter a valid email` | Zod default |
| 11 | `Message should be at least 10 characters` | Zod default |
| 104 | `Captcha verification failed.` | server-side error |
| 111 | `Could not send the message. Please try again or email directly.` | server-side error |

These flow into the form via `state.errors` (per-field) and `state.message` (top-level). Translating server-action returns is more work than UI strings — A6 should decide whether to surface them via translation lookup keyed by `code` or pre-translate by reading `accept-language`.

## Summary

Roughly 25 strings across 9 files. Most of the page-level pages are clean (route through `getTranslations`); the cluster of issues is in shared client components (carousel, theme-toggle, section-heading) and one hold-out leaf page (`recommends/[slug]`).
