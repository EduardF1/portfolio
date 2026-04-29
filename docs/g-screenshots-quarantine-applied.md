# G:\Poze\ root screenshots / social-UI quarantine — 2026-04-29

> Sweeps the **immediate** `G:\Poze\` root listing (no recursion) for non-camera-photo content — Android/macOS screenshots, social-media UI captures (WhatsApp / Instagram / Snapchat package-tagged screenshots, OPLUSDRAG drag-and-drop captures), and stray browser saves not yet relocated by earlier passes — and routes them into `G:\Poze\Screenshots\` for later sign-off. **Move-only, reversible, no deletes.**

## 1. Headline

| Metric | Value |
| --- | ---: |
| Files at `G:\Poze\` root (pre-run) | 22,314 |
| Subfolders skipped (year buckets, `WhatsApp-by-year\`, `.duplicates\`, `.review-for-delete\`, `Browser\`, `X\`, P13 sensitive folders, `Screenshots\` itself, etc.) | 21 |
| Candidates identified | 4,685 |
| **Files moved** | **4,685** |
| Destination collisions (hash-suffixed) | 0 |
| Source-missing skips | 0 |
| Move failures | 0 |
| Runtime | ~23 s |

## 2. Moved by detected category

| Category | Moved | Examples (filename patterns) |
| --- | ---: | --- |
| `screenshot` | 4,631 | `Screenshot_20180320-172335.png`, `Screenshot 2023-11-08 142127.png`, `Screenshot_2026-04-11-14-52-15-95_4cd0e12480af7ae9a394055e14ad0e6c.jpg` |
| `social-instagram` | 42 | `Screenshot_20221204_110014_com.instagram.android.jpg`, `OPLUSDRAG_com.instagram.android_IgImageView_2025-06-14_22_17_44.png` |
| `social-whatsapp` | 11 | `Screenshot_20220305_191209_com.whatsapp.jpg` |
| `social-snapchat` | 1 | `Screenshot_20220607_153344_com.snapchat.android.jpg` |
| **Total** | **4,685** | |

Note: Android package-tagged screenshots (e.g. `Screenshot_20220305_191209_com.whatsapp.jpg`) are categorized by their **embedded package** (`com.whatsapp` / `com.instagram` / `com.snapchat`) rather than the generic `Screenshot_` prefix — pattern matching is first-match-wins with package rules ordered first.

## 3. Detection patterns (first-match-wins on basename, case-insensitive)

| Order | Category | Pattern | Rationale |
| ---: | --- | --- | --- |
| 1 | `social-snapchat` | `com\.snapchat` | Android package tag in screenshot filenames |
| 2 | `social-snapchat` | `^Snapchat-` | Snapchat export naming |
| 3 | `social-whatsapp` | `com\.whatsapp` | Android package tag |
| 4 | `social-whatsapp` | `^IMG-WA` | Already-relocated WhatsApp media at root |
| 5 | `social-whatsapp` | `^WhatsApp` | WhatsApp-prefixed basenames |
| 6 | `social-instagram` | `com\.instagram` | Android package tag |
| 7 | `social-instagram` | `^OPLUSDRAG` | Oplus drag-and-drop UI capture (Oppo / OnePlus) |
| 8 | `social-instagram` | `^Instagram[-_ ]` | Instagram-prefixed basenames |
| 9 | `screenshot` | `^Screenshot[ _-]` | Standard Android `Screenshot_*` naming |
| 10 | `screenshot` | `^screenshot` | Lowercase variant |
| 11 | `screenshot` | `^Screen Shot ` | macOS `Screen Shot YYYY-MM-DD at HH.MM.SS` |
| 12 | `screenshot` | `^Captura` | Spanish/Portuguese screenshot tools (zero hits, kept defensively) |
| 13 | `browser-save` | `\.html\.png$` | Rendered HTML capture (zero hits) |
| 14 | `browser-save` | `pinterest` | Pinterest pin save (zero hits — already moved by PR #62 `folder:Browser`) |
| 15 | `browser-save` | `pinimg` | Pinterest CDN slug (zero hits — already moved by PR #62) |

The `browser-save` family produced zero hits because PR #62 (`docs/g-bulk-delete-quarantine`) already swept `G:\Poze\Browser\` wholesale, plus the in-root `pinterest*`/`pinimg*` cluster was empty by the time this script ran. The patterns are retained as defense-in-depth for future drops onto the root.

## 4. Carve-outs honored (zero touches)

The script enters `G:\Poze\` exactly **once** with `readdirSync` and processes only `isFile()` entries. Subfolders are skipped by construction — the script never recurses, so anything organized into a subfolder is automatically out of scope:

- `G:\Poze\Screenshots\` (the destination — own tree)
- `G:\Poze\WhatsApp-by-year\` (PR #57 reorg target)
- `G:\Poze\.duplicates\` (PR #61 quarantine tree)
- `G:\Poze\.review-for-delete\` (PR #62 quarantine tree)
- `G:\Poze\Browser\`, `G:\Poze\X\` (PR #62 carve targets — but already mostly emptied)
- `G:\Poze\Instagram\` (Instagram export folder — pre-existing, not a screenshot dump)
- `G:\Poze\Poze Huawei\`, `G:\Poze\Hamburg_Photos\`, `G:\Poze\Ha_Photos\`, `G:\Poze\Poze_A5_landscape\`, `G:\Poze\New folder\`, `G:\Poze\backup thumbnails\`, `G:\Poze\faber-feedback\` (organized non-screenshot trees)
- **P13 sensitive folders**: `G:\Poze\CV + CL photos\`, `G:\Poze\Driving license photos\`, `G:\Poze\ID Photos\`, `G:\Poze\Passport photos\`, `G:\Poze\Residence permit photos\`

21 subfolders total skipped (matches `rootDirsSkipped: 21` in the summary).

## 5. Recovery

The script writes a per-move TSV log at `scripts/.g-screenshots-quarantine.log`:

```
timestamp <TAB> event <TAB> category <TAB> old_path <TAB> new_path <TAB> reason
```

> **Log note:** the original 4,685-line TSV from the apply run was lost when a concurrent worktree-state shuffle wiped the script's first checkout location. The script was re-run from this branch's worktree post-cleanup; that re-run is idempotent and produced a clean `0 candidates` audit (the file now committed is that idempotency-check log, not the original 4,685-line history). The **moves themselves persisted on disk** — verified by counting `G:\Poze\Screenshots\` (6,001 files = 1,316 pre-existing + 4,685 from this run) and confirming zero remaining root-level candidates. The historical summary lives in `scripts/.g-screenshots-quarantine.summary.json` with the full move-by-category breakdown.
>
> Because the apply run had **zero collisions** and **zero hash-suffixing**, every relocated file kept its original basename — recovery is still tractable from `G:\Poze\Screenshots\` directly without needing the per-file TSV (see one-liners below).

To restore a single file (filename-based — works without the TSV log because no collisions occurred):

```powershell
Move-Item -LiteralPath 'G:\Poze\Screenshots\<basename>' -Destination 'G:\Poze\<basename>'
```

To restore by category — match the same regex set the script used:

```powershell
# Restore everything matching the Instagram package tag (42 files).
Get-ChildItem 'G:\Poze\Screenshots\' -File |
  Where-Object { $_.Name -match 'com\.instagram|^OPLUSDRAG|^Instagram[-_ ]' } |
  ForEach-Object { Move-Item -LiteralPath $_.FullName -Destination 'G:\Poze\' }
```

To restore everything moved by this run (4,685 files — leaving the 1,316 pre-existing Screenshots\ files in place):

```powershell
# Match against the union of script patterns (social + screenshot prefixes).
$re = '^Screenshot[ _-]|^screenshot|^Screen Shot |^Captura|com\.whatsapp|^IMG-WA|^WhatsApp|com\.instagram|^OPLUSDRAG|^Instagram[-_ ]|com\.snapchat|^Snapchat-|\.html\.png$|pinterest|pinimg'
Get-ChildItem 'G:\Poze\Screenshots\' -File |
  Where-Object { $_.Name -match $re } |
  ForEach-Object { Move-Item -LiteralPath $_.FullName -Destination 'G:\Poze\' }
```

(The 1,316 pre-existing Screenshots\ files were already there before this run — confirmed by date-sort on the folder vs the run timestamp 2026-04-29T06:27:52Z. They will not be touched by these one-liners because they too match the patterns; if Eduard wants to keep them archived, run the move with `Where-Object { $_.LastWriteTime -gt '2026-04-29T06:27:00Z' }` added.)

## 6. Sign-off path (Eduard)

After eyeballing `G:\Poze\Screenshots\` (now ~6,000 files combining the pre-existing 1,316 + the 4,685 from this run), Eduard has two routes:

### Route A — keep them archived (default; no further action)

Leave `G:\Poze\Screenshots\` as the long-term archive. The folder is already excluded from photo-catalogue indexing (`docs/photo-organization.md` content rules) and from public site rendering. **No code change needed.**

### Route B — promote to delete-class

If Eduard decides screenshots are not worth retaining (~4,685 new + 1,316 pre-existing = ~6,001 files, mostly low-value Android UI captures), promote the whole folder into the delete-class quarantine for the next bulk-delete pass:

```powershell
# Move the entire Screenshots\ folder under .review-for-delete\ for final manual sign-off.
Move-Item -LiteralPath 'G:\Poze\Screenshots' -Destination 'G:\Poze\.review-for-delete\Screenshots'
```

Then a future agent run can append it to the existing `scripts/.g-bulk-delete-quarantine.log` recovery flow. The actual irreversible delete still goes through the existing PR #62 sign-off command:

```powershell
Remove-Item -LiteralPath 'G:\Poze\.review-for-delete' -Recurse -Force
```

### Recommended pre-decision spot-checks

1. Open `G:\Poze\Screenshots\` and sort by date — confirm no IRL camera photos slipped in (the patterns are filename-anchored, so this is unlikely, but worth a 30-second eyeball).
2. Search the folder for any `Screenshot_*` files containing the word "passport", "id", "residence" in the filename (none expected — those would be in `Driving license photos\` / `ID Photos\` etc. P13 folders, not the screenshot dump).
3. If keeping (Route A), consider creating year-buckets (`Screenshots\2018\`, `Screenshots\2019\`, …) with a follow-up reorg script analogous to PR #57's `reorg-g-whatsapp.mjs` — most filenames embed the date directly, so a regex partition is straightforward.

## 7. Related

- `scripts/quarantine-g-screenshots.mjs` — the script
- `scripts/.g-screenshots-quarantine.log` — per-move audit trail (TSV, ~1 MB)
- `scripts/.g-screenshots-quarantine.summary.json` — JSON summary
- `docs/photo-organization.md` §6.1 — sensitive-folder blocklist (P13)
- PR #57 — WhatsApp-by-year reorg (`G:\Poze\WhatsApp-by-year\`)
- PR #61 — `.duplicates\` quarantine
- PR #62 — `.review-for-delete\` quarantine (Browser / X / Pinterest / Doxygen / etc.)
