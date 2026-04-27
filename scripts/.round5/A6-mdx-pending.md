# A6 — MDX Sections Pending Eduard's Hand

Pass over every `.mdx` file under `content/`. Looking for placeholder sections, missing "My contribution" blocks, etc.

## Status by file

### Work case studies (`content/work/`)

| File | Has "My contribution" | Notes |
| --- | --- | --- |
| `boozt.mdx` | Yes | Complete. |
| `greenbyte-saas.mdx` | Implicit (rolled into the body) | Ownership of mobile app + DevOps thesis link is clearly stated; no missing "My contribution" subhead, but the body itself reads as one. Fine for v1. |
| `kombit-valg.mdx` | Yes | Complete, with "By the numbers" + "Stack and tooling" + STIL stint. |
| `sitaware.mdx` | Implicit | No explicit "My contribution" subhead; the bulleted list functions as one. Consistent with the boozt/greenbyte format-mix, no action needed. |

### Articles (`content/articles/`)

| File | Has "My contribution" | Notes |
| --- | --- | --- |
| `digitalization-of-waste-collection-feral-systems.mdx` | Yes | Complete, names co-authors. |
| `conceptualization-of-an-audit-management-system.mdx` | Yes | Complete, names thesis partner and links Niels Svinding's letter. |

### Writing (`content/writing/`)

| File | Notes |
| --- | --- |
| `three-tier-thinking.mdx` | Complete, em-dashes converted to commas. |

### Recommends (`content/recommends/`)

| File | Notes |
| --- | --- |
| `oneplus-11.mdx` | Complete product writeup. |

### Recommendation letters (`content/recommends/letters/`)

All twelve letters present and have body content:
- `claus-hougaard-hansen.mdx` (LinkedIn, EN)
- `daria-maria-pelle.mdx` (LinkedIn, EN)
- `fabian-stefan-bernhardt.mdx` (LinkedIn, EN)
- `jesper-hestkjaer.mdx` (LinkedIn, EN)
- `martin-hovbakke-sorensen.mdx` (signed letter, DA with EN quote)
- `mathias-stochholm-waehrens.mdx` (LinkedIn, EN)
- `nanna-dohn.mdx` (LinkedIn, EN)
- `natali-munk-jakobsen.mdx` (LinkedIn, EN)
- `niels-svinding.mdx` (signed letter, EN, dated 2025-11-12)
- `raitis-magone.mdx` (LinkedIn, EN)
- `stefan-daniel-horvath.mdx` (LinkedIn, EN)
- `tobias-thisted.mdx` (LinkedIn, EN)

### Things only Eduard can confirm

- `daria-maria-pelle.mdx` — body ends with "Best of luck in your future projects, Eduard!" which reads slightly student-y. Authentic LinkedIn quote, leave as-is unless Eduard chooses to trim the sign-off.
- `raitis-magone.mdx` — describes the Greenbyte mobile app as the "Kalenda Android application". The greenbyte case study describes the mobile companion as Flutter/Dart (cross-platform). Both can be true (Flutter ships an Android binary), but worth a quick read by Eduard for consistency.
- All twelve letters appear wired up. The backlog item "recommendation letters not all wired" mentioned in the brief seems already addressed — no obviously missing letter file.

## Conclusion

No `[INSERT...]`-style or "Hero About narrative" placeholder sections found in any MDX. All four work case studies have at least implicit contribution sections. Both articles have explicit contribution sections. All recommendation letters present and bodied. Nothing requires Eduard's hand to ship v1.
