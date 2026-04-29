# `G:\Photos\` — cluster renames applied

> Applied 2026-04-28 by `chore/g-photos-cluster-renames`. Source-of-truth for
> the rename list: `docs/g-photos-final-state.md` §3 (country-named folders
> whose centroid resolves to a known city; coastal/ambiguous picks Eduard
> pre-approved; Denmark→city refinements). Read-only doc — files were
> renamed in-place via atomic same-volume `Rename-Item`.
>
> The §3.4 single merge (Turkey 18 → Istanbul 18) was **NOT applied** —
> merging is a multi-file operation that needs collision-aware logic; out
> of scope for a rename-only pass. Logged for follow-up.

---

## 1. Renames applied (18/18 successful)

### 1.1 §3.1 Country-named clusters → city (10/10)

| Year | Before | After | Centroid (per source doc) |
| --- | --- | --- | --- |
| 2022 | `Germany 22` | `Hamburg 22` | 53.430, 10.012 (inside Hamburg bbox) |
| 2026 | `Italy 26` | `Trieste 26` | 45.425, 13.923 (inside Trieste bbox) |
| 2018 | `Greece 18` | `Turkey 18 (07-3)` | 36.814, 28.269 (Turkish coast) |
| 2023 | `Greece 23 (07)` | `Turkey 23` | 39.950, 26.512 (Çanakkale, Turkey) |
| 2024 | `Greece 24` | `Albania 24` | 39.949, 20.057 (Saranda, Albania) |
| 2024 | `Romania 24` | `Bucharest 24` | 44.553, 26.065 (inside Bucharest bbox) |
| 2026 | `Hungary 26` | `Budapest 26` | 47.300, 19.130 (inside Budapest bbox) |
| 2018 | `Germany 18` | `Frankfurt 18` | 50.037, 8.477 (inside Frankfurt bbox) |
| 2022 | `Romania 22` | `Brasov region 22` | 45.395, 25.614 (Brașov region bbox) |
| 2019 | `Romania 19` | `Brasov region 19` | 45.897, 25.706 (Brașov region edge) |

### 1.2 §3.2 Coastal / multi-stop refinements (5/5)

| Year | Before | After | Centroid |
| --- | --- | --- | --- |
| 2022 | `Greece 22` | `Thassos 22` | 40.830, 24.707 (N. Greece coast) |
| 2023 | `Greece 23 (07-2)` | `Samos 23` | 37.899, 27.793 (Samos island) |
| 2025 | `Spain 25` | `Malaga 25` | 36.532, -4.442 (inside Malaga bbox) |
| 2016 | `Spain 16` | `Malaga 16` | 36.775, -4.100 (Malaga bbox edge) |
| 2023 | `UK 23` | `Edinburgh 23` | 55.949, -3.363 (Edinburgh) |

### 1.3 §3.3 Denmark-named clusters → city (3/3)

| Year | Before | After | Centroid |
| --- | --- | --- | --- |
| 2022 | `Denmark 22 (04)` | `Aarhus 22 (04)` | 56.156, 10.008 (Aarhus bbox edge) |
| 2019 | `Denmark 19 (08-2)` | `Vejle 19 (08-7)` | 55.694, 9.604 (Vejle bbox edge) |
| 2017 | `Denmark 17 (03)` | `Esbjerg 17 (03)` | 55.486, 8.944 (Esbjerg-Kolding) |

---

## 2. Skipped / deferred

### 2.1 §3.4 — Turkey 18 → Istanbul 18 merge

```
Merge G:\Photos\2018\Turkey 18\ (37 files, 2018-07-22→23, centroid 40.903, 29.240)
   INTO G:\Photos\2018\Istanbul 18\ (101 files, 2018-07-12→14, centroid 41.011, 28.979)
```

Not applied. Merge requires collision-aware file-level moves (rename suffix
on duplicates, source-folder removal after drain) — out of scope for a
rename-only pass. Follow up in a separate PR.

### 2.2 §3.5 — Brasov region clusters

Per source doc: leave `Brasov region 23\` and `Brasov region 23 (08)\`
unchanged. No action required.

---

## 3. Verification

All 18 `Rename-Item` calls returned success. Spot-checked top-level state:

```powershell
Test-Path -LiteralPath 'G:\Photos\2022\Hamburg 22'        # True
Test-Path -LiteralPath 'G:\Photos\2026\Trieste 26'        # True
Test-Path -LiteralPath 'G:\Photos\2018\Turkey 18 (07-3)'  # True
Test-Path -LiteralPath 'G:\Photos\2024\Albania 24'        # True
Test-Path -LiteralPath 'G:\Photos\2024\Bucharest 24'      # True
```

No collisions hit; no `-2` suffix logic fired. P13 sensitive folders, the
three quarantine paths, and `WhatsApp-by-year\` were not touched.

---

## 4. Recovery one-liner (if Eduard needs to revert all 18)

```powershell
$reverts = @(
  @{Year='2022'; Old='Hamburg 22';        New='Germany 22'},
  @{Year='2026'; Old='Trieste 26';        New='Italy 26'},
  @{Year='2018'; Old='Turkey 18 (07-3)';  New='Greece 18'},
  @{Year='2023'; Old='Turkey 23';         New='Greece 23 (07)'},
  @{Year='2024'; Old='Albania 24';        New='Greece 24'},
  @{Year='2024'; Old='Bucharest 24';      New='Romania 24'},
  @{Year='2026'; Old='Budapest 26';       New='Hungary 26'},
  @{Year='2018'; Old='Frankfurt 18';      New='Germany 18'},
  @{Year='2022'; Old='Brasov region 22';  New='Romania 22'},
  @{Year='2019'; Old='Brasov region 19';  New='Romania 19'},
  @{Year='2022'; Old='Thassos 22';        New='Greece 22'},
  @{Year='2023'; Old='Samos 23';          New='Greece 23 (07-2)'},
  @{Year='2025'; Old='Malaga 25';         New='Spain 25'},
  @{Year='2016'; Old='Malaga 16';         New='Spain 16'},
  @{Year='2023'; Old='Edinburgh 23';      New='UK 23'},
  @{Year='2022'; Old='Aarhus 22 (04)';    New='Denmark 22 (04)'},
  @{Year='2019'; Old='Vejle 19 (08-7)';   New='Denmark 19 (08-2)'},
  @{Year='2017'; Old='Esbjerg 17 (03)';   New='Denmark 17 (03)'}
)
foreach ($r in $reverts) {
  Rename-Item -LiteralPath "G:\Photos\$($r.Year)\$($r.Old)" -NewName $r.New
}
```

---

## 5. Provenance

- Source list: `docs/g-photos-final-state.md` §3 (10 + 5 + 3 = 18 renames)
- Branch: `chore/g-photos-cluster-renames`
- Coordination: disjoint from sibling agent `loose-root-files-reorg` —
  that agent operates on `G:\Photos\<year>\` root-level files, this agent
  on `<year>\<cluster>\` sub-folder names. No overlap.
- P13 sensitive folders untouched.
- Tooling: `Rename-Item -LiteralPath … -NewName …` (atomic same-volume).
