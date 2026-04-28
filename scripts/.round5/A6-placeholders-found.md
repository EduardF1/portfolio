# A6 — Placeholder Hunt Results

Searched for: `Lorem`, `TODO`, `FIXME`, `[INSERT`, `TBD`, `(location guess)`, `placeholder`, `xxx`, `???`

Scope: `messages/*.json`, `content/**/*.mdx`

## Findings

### Zero true placeholders in scope

After grepping all listed markers across `messages/en.json`, `messages/da.json`, and every `content/**/*.mdx`, no user-facing placeholder copy was found. The single match below is a JSON property name, not visible text:

- `messages/en.json:295` — `search.placeholder` is the i18n key holding the search-input placeholder text. The string itself, "Search posts, articles, work, recommends...", is real copy.
- `messages/da.json:295` — Same key, real Danish copy.

### Out-of-scope notes (informational only — not in A6 ownership)

- `src/app/admin/stats/page.tsx:38` — comment `// TODO i18n — this entire file is intentionally EN-only (admin scope)`. Intentional code comment, admin route is EN-only by design.
- `src/app/privacy/page.tsx:1` — comment `// TODO i18n — EN-only POC; Dev A will localise once the i18n sweep lands`. Intentional code comment.
- `src/components/hero-video-bg.tsx` — `placeholder branch` in test names refers to a deliberate fallback render path, not unfinished copy.

## Conclusion

No content placeholders to surface to Eduard from messages/MDX scope. All `placeholder` matches are either i18n key names or test-suite descriptors.
