# Run the v2 face-gated inpaint pipeline against the 20-photo edge-case
# corpus defined in scripts/inpaint-edge-cases.json.
#
# Companion to docs/inpaint-edge-cases.md and PR #41
# (feat/inpaint-people-pipeline). Outputs land in scripts/.inpaint-edge-output/
# (gitignored). Prints a markdown summary diffing predicted vs. actual
# decision so the round-2 review can focus on surprises.
#
# This script does NOT auto-deploy or auto-commit. Run it once PR #41 has
# landed and the venv (scripts/.inpaint-venv/) is set up per
# docs/inpaint-test-results.md.

param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$Manifest = (Join-Path $PSScriptRoot "inpaint-edge-cases.json"),
    [string]$OutputDir = (Join-Path $PSScriptRoot ".inpaint-edge-output"),
    [string]$PythonExe = (Join-Path $PSScriptRoot ".inpaint-venv\Scripts\python.exe"),
    [string]$Pipeline = (Join-Path $PSScriptRoot "inpaint-people.py"),
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Manifest)) {
    throw "Manifest not found: $Manifest"
}
if (-not (Test-Path $Pipeline)) {
    throw "Pipeline script not found (PR #41 may not be merged yet): $Pipeline"
}
if (-not (Test-Path $PythonExe)) {
    throw "venv python not found: $PythonExe (set up per docs/inpaint-test-results.md)"
}

$manifestJson = Get-Content $Manifest -Raw | ConvertFrom-Json
$photos = $manifestJson.photos
Write-Output "Loaded $($photos.Count) photos from $Manifest"

# Resolve every src against the repo root and verify it exists before we
# spin up the Python interpreter (which is slow to load deps).
$resolvedInputs = @()
foreach ($p in $photos) {
    $abs = Join-Path $RepoRoot $p.src
    if (-not (Test-Path $abs)) {
        throw "Missing photo from manifest: $($p.src)"
    }
    $resolvedInputs += $abs
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Build the python args. inpaint-people.py accepts repeated --input flags.
$pyArgs = @($Pipeline)
foreach ($abs in $resolvedInputs) {
    $pyArgs += "--input"
    $pyArgs += $abs
}
$pyArgs += "--output"
$pyArgs += $OutputDir
if ($DryRun) {
    $pyArgs += "--dry-run"
}

Write-Output ""
Write-Output "Running pipeline against $($resolvedInputs.Count) photos..."
Write-Output "  python  : $PythonExe"
Write-Output "  pipeline: $Pipeline"
Write-Output "  output  : $OutputDir"
Write-Output "  dry-run : $DryRun"
Write-Output ""

& $PythonExe @pyArgs
if ($LASTEXITCODE -ne 0) {
    throw "Pipeline exited non-zero ($LASTEXITCODE). See output above."
}

# Parse the JSONL audit log to compare predicted vs actual decisions.
$logPath = Join-Path $OutputDir "_inpaint-log.ndjson"
if (-not (Test-Path $logPath)) {
    Write-Warning "Audit log not found at $logPath -- pipeline may have changed its log path. Skipping diff."
    return
}

$logEntries = @{}
foreach ($line in Get-Content $logPath) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    try {
        $entry = $line | ConvertFrom-Json
    } catch {
        continue
    }
    # Index entries by basename of the input path so we can join with the
    # manifest regardless of absolute-vs-relative path quirks.
    if ($entry.input) {
        $key = [System.IO.Path]::GetFileName($entry.input)
        $logEntries[$key] = $entry
    }
}

Write-Output ""
Write-Output "## Edge-case run summary"
Write-Output ""
Write-Output "| #  | Photo | Category | Predicted | Actual | Out exists | Match |"
Write-Output "|----|-------|----------|-----------|--------|------------|-------|"

$matches = 0
$mismatches = 0
foreach ($p in $photos) {
    $base = [System.IO.Path]::GetFileName($p.src)
    $entry = $logEntries[$base]
    $actual = if ($entry -and $entry.decision) { $entry.decision.ToUpper() } else { "?" }
    $outPath = Join-Path $OutputDir $base
    $flaggedPath = Join-Path (Join-Path $OutputDir "flagged") $base
    $outExists = (Test-Path $outPath) -or (Test-Path $flaggedPath)
    $isMatch = ($actual -eq $p.predicted.ToUpper())
    if ($isMatch) { $matches++ } else { $mismatches++ }
    $marker = if ($isMatch) { "ok" } else { "DIFF" }
    Write-Output ("| {0,2} | ``{1}`` | {2} | {3} | {4} | {5} | {6} |" -f $p.n, $base, $p.category, $p.predicted, $actual, $outExists, $marker)
}

Write-Output ""
Write-Output ("Matches: {0}/{1}; Diffs: {2}" -f $matches, $photos.Count, $mismatches)
Write-Output ""
Write-Output "Review every DIFF row by eye against docs/inpaint-edge-cases.md"
Write-Output "before approving a full sweep of public/photos/trips/."
