# Photo classification plan — 2026-04-28

> Path renamed from `G:\Photos` to `G:\Photos` on 2026-04-29; pre-rename log entries reference the old name and remain valid. The forward-looking sections of this doc use `G:\Photos`; numbers and historical descriptions are preserved verbatim.

> Consolidates the 5-agent sweep dispatched 2026-04-28 PM (P-A2 / P-B / P-C / P-D / P-E) on top of the earlier P1-P14 round. Read-only catalogue results — no files moved.

## Headline

- `G:\Photos\` is large (~41,000 photos) and was previously **only ~28% covered** by the per-year P1-P5 slices. P-E flagged 75,719 orphans (88.5% of the combined `G:\` + `D:\Portfolio\poze\` tree of 85,601 photos) as not-in-any-prior-scan.
- `G:\Photos\` × `D:\Portfolio\poze\` is **massively duplicated**: P-B found 8,631 perceptual-dup groups (Hamming ≤ 8) with **17,529 demote candidates**. The largest single group is 4,031 byte-identical CV/CL DSLR headshots mirrored across both roots.
- **Local PC has zero vacation media.** P-C scanned `C:\Users\Eduard\Pictures` (the only existing allowlisted root — OneDrive Pictures / Pozele mele / Camera Roll are not synced on this machine) and found 7,325 files, **all Windows screenshots**. P-D scanned `C:\Users\Eduard\Videos` and found 7 files, **all screen recordings or webcam clips**. The "move from local PC to G:\" task is therefore a **no-op**.
- The 2018-2020 slice is now properly catalogued: P-A2 produced 3,937 entries (vs the partial 74 from the original P-A run) — 2018 = 1,297 / 2019 = 1,025 / 2020 = 1,615; 51.6% have EXIF date-taken, 35% have GPS.

## G:\ classification status

| Slice | Status | Coverage |
| --- | --- | --- |
| P1 (≤2017) | done (initial round) | partial — `not-in-sibling-scan` orphans flag many root-level files this missed |
| P2-redo (2018-2020) | **done 2026-04-28** | 3,937 entries; ~95% of root-level coverage hit before time budget; <100-file tail likely missed |
| P3 (2021-2022) | done (initial round) | 6,272 photos / 1,949 GPS-tagged |
| P4 (2023-2024) | done (initial round) | partial |
| P5 (2025-2026 + undated) | done (initial round) | partial — also produced bonus `cross-drive-summary.md` |
| P6 (stock audit) | done | 49 stock photos audited; 9 Replace recs; 0 location mismatches |
| P7 (D:\Portfolio scan) | done | 70k files / 91.5GB; big extraction candidates flagged |
| P8-redo (perceptual dedup) | **done 2026-04-28** | 40,460 photos hashed; 8,631 dup groups; 17,529 demote candidates |
| P9 (best-of shortlist) | done | strongest heroes in Schwangau + Málaga; ~150 unimported Hamburg 2022 frames |
| P10 (per-slot recs) | unknown — was still running at last handoff | — |
| P11 (GPS cluster validation) | done | 87.8% match; 23 mismatches all in `2026-03-balkans-roadtrip/` (Italy/Germany/Austria transit legs) |
| P12 (burst detection) | done | 94 bursts; 379 demote candidates (caveat: stock photos cluster as bursts by mtime) |
| P13 (sensitive sweep) | done | folder blocklist (`G:\Citizenship*`, `G:\Whatsapp\`, `G:\Important Documents\`, `G:\backup NC*`, etc.) |
| P14 (camera fingerprinting) | done | — |
| P-orphans (master sweep) | **done 2026-04-28** | 75,719 orphans across G:\Photos\ (41,021) + D:\Portfolio\poze\ (44,580) — 88.5% of total |

## C:\ → G:\ move proposal

**Nothing to move.** Both scans came back empty.

| Root | Status | Files found | Vacation candidates |
| --- | --- | ---: | ---: |
| `C:\Users\Eduard\Pictures` | exists | 7,325 photos | **0** (all Windows screenshots in `Pictures\Screenshots\`) |
| `C:\Users\Eduard\Pictures\Camera Roll` | exists | 1 video, 1 `desktop.ini` | 0 |
| `C:\Users\Eduard\Pictures\Saved Pictures` | exists | only `desktop.ini` | 0 |
| `C:\Users\Eduard\Videos` | exists | 7 videos | **0** (6 screen recordings, 1 webcam clip; OBS-default-named files at 147–190 kbps were correctly classified `screen_recording`) |
| `C:\Users\Eduard\OneDrive\Pictures` | not on disk | — | — |
| `C:\Users\Eduard\OneDrive\Pozele mele` | not on disk | — | — |
| `C:\Users\Eduard\OneDrive\Camera Roll` | not on disk | — | — |
| `C:\Users\Eduard\OneDrive\Videos` | not on disk | — | — |
| `C:\Users\Eduard\Pictures\iCloud Photos\Photos` | not on disk (iCloud not initialised) | — | — |

If vacation photos exist on this PC, they live in OneDrive folders that aren't currently synced or in iCloud sync that isn't initialised. **Action**: Eduard either confirms there's nothing to move, or initialises a sync, after which we can re-run P-C / P-D.

## Privacy notes

- **G:\Photos\ subfolder caveat**: P-B's perceptual-dedup pass hashed (read-only, no decode beyond dHash) the document-style subfolders inside `G:\Photos\` — `CV + CL photos\`, `Driving license photos\`, `ID Photos\`, `Passport photos\`, `Residence permit photos\`. Their paths now appear inside `scripts/.photo-classify/P8-redo/dedup.ndjson` `members[]` arrays. P-A2 did NOT enter these — its blocklist matched P13's intent. **Recommendation**: extend the §6.1 source-folder allowlist in `docs/photo-organization.md` to also list these G:\Photos\ subfolders as blocklisted (in addition to the top-level G:\ blocklist already there).
- **Loss of P-C / P-D outputs on disk**: the `scripts/.local-pc-move/` directory was untracked when one of the dev rebase agents ran a clean. The agents' summary numbers above are preserved; the underlying NDJSON is not. Since both came back empty, this is harmless — but a note for next round: agents writing to `scripts/.*` should land their outputs in committed locations or stage them immediately.

## Top action items (priority order)

1. **Hamburg 2022 import** — biggest single content win. ~150 photos in `G:\Photos\Ha_Photos\` + `D:\Portfolio\poze\Ha_Photos\`. P9 confirmed this flips the Hamburg trip slot from "thin (2 own + 3 stock)" to "well-covered". P-A2's pass found 119 of the Huawei-era photos in `Poze Huawei\` carrying full EXIF + GPS — they're hero candidates.
2. **New trip pages**: `2022-10-de-hamburg`, `2022-XX-greece` (P3 found these GPS-clustered but not on `/travel` yet).
3. **P-orphans triage** — 33,231 of the 75,719 orphans are simply `not-in-sibling-scan` because the per-year P1/P3/P4/P5 slices skipped root-level files outside year-bucket folders. A single P1-style pass over the orphan-list would absorb most of them. The 12,418 `no-date-signal` orphans (mostly Pinterest/Browser web saves, social-CDN exports, Doxygen call-graphs) are strong delete candidates per `docs/photo-organization.md` §6.
4. **Self-portrait hand-pass** on `G:\Photos\Instagram\` (143 curated frames). P3 classifier excludes — needs new heuristic.
5. **9 stock photo replacements** per P6/`stock-audit.md` (tonal mismatches).
6. **23 photo re-clusterings** in `2026-03-balkans-roadtrip/` per P11 (transit legs Italy/Germany/Austria).
7. **Big-archive extractions on D:\Portfolio**: Ernesto wedding zip 16.97GB, `1749442124878.jpg.zip` 1.35GB, `Photos Hamburg.zip` 1.32GB. 92 smaller archives in father's TATA construction archive. 95 video files / 1.2GB; TS2 interview .mp4s duplicated 4× (cleanup candidate).
8. **Eduard sign-off on dedup demote list** — P-B's 17,529 candidates need a quick review pass, especially the 4,031-member CV/CL group. Recommend keeping ONE high-res original per pose, demoting the rest.
9. **Install exiftool** on the Windows host — current pure-PowerShell EXIF reader covers ~78% of files (HEIC/PNG/RAW miss). 1,018 of P-orphans are HEIC/RAW-unreadable.
10. **Re-run P10** (per-slot recommendations) — it was still running at the prior handoff and may be incomplete.

## Outputs (this round)

- `scripts/.photo-classify/P2-redo/scan.ndjson` (3,937 lines) + `proposal.md`
- `scripts/.photo-classify/P8-redo/dedup.ndjson` (8,631 groups) + `summary.md` + `hashes.ndjson` (40,460-line resume cache) + `find-dupes.ps1` + `group-from-cache.ps1` + `find-dupes.log`
- `scripts/.photo-classify/P-orphans/scan.ndjson` (75,719 records, 23.6 MB) + `summary.md` + `scan.ps1`
- (lost — empty results regardless) `scripts/.local-pc-move/photos/scan.ndjson`, `scripts/.local-pc-move/videos/scan.ndjson`
