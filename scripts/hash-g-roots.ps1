# hash-g-roots.ps1 - dHash + SHA-256 hasher for arbitrary G:\ photo roots.
#
# Walks each Root recursively, computes dHash (8x8 -> 64-bit) using WPF
# BitmapImage with DecodePixelWidth=64 (fast JPEG DCT-downsample), and
# emits one JSON record per file to OutFile (NDJSON, append-friendly).
#
# Resume-friendly: existing entries in OutFile (or in -ExistingHashes
# files) are reused by `path` key.
#
# READ-ONLY. No moves, no deletes. Used as the hashing pass for
# scripts/master-dedup-g.mjs (the mover lives there in JS).
#
# Skip rules:
#   - $RECYCLE.BIN, System Volume Information
#   - any directory whose normalized path contains a P13 sensitive prefix
#   - any directory named .duplicates, .review-for-delete, Screenshots,
#     duplicates-to_be_deleted (the new quarantine target)
#
# Usage:
#   .\hash-g-roots.ps1 -Roots @('G:\Video\WhatsApp_Images','G:\WD_EXT_HDD','G:\backup media telefon') `
#                      -OutFile scripts\.photo-classify\g-master-dedup\hashes-new.ndjson `
#                      -ExistingHashes @('scripts\.photo-classify\P8-redo\hashes.ndjson') `
#                      -ProgressEvery 250
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string[]]$Roots,
    [Parameter(Mandatory=$true)]
    [string]$OutFile,
    [string[]]$ExistingHashes = @(),
    [string]$LogFile = '',
    [int]$ProgressEvery = 250,
    [int]$MaxFiles = 100000
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

Add-Type -AssemblyName PresentationCore, WindowsBase, System.Drawing

$includeExts  = @('.jpg', '.jpeg', '.png')
$skipExts     = @('.heic', '.raw', '.cr2', '.nef', '.dng', '.arw')

# P13 sensitive prefixes (case-insensitive prefix match on normalized path
# with backslash separators and lowercase). Mirror of the JS `isSensitive`.
$sensitivePrefixes = @(
    'g:\poze\cv + cl photos\',
    'g:\poze\driving license photos\',
    'g:\poze\id photos\',
    'g:\poze\passport photos\',
    'g:\poze\residence permit photos\',
    'g:\poze\camera roll iphone backup\',
    'g:\whatsapp\',
    'g:\important documents\'
)
$sensitiveWildcardPrefixes = @(
    'g:\citizenship',
    'g:\backup nc'
)
# Folder-name skips (exact directory name, case-insensitive). These apply
# anywhere in the tree, e.g. don't recurse into `.duplicates\`.
$skipDirNames = @(
    '.duplicates',
    '.review-for-delete',
    'Screenshots',
    'duplicates-to_be_deleted',
    '$RECYCLE.BIN',
    'System Volume Information',
    'Recycle Bin'
)

function Test-IsSensitive {
    param([string]$path)
    $n = $path.Replace('/', '\').ToLowerInvariant()
    foreach ($pref in $sensitivePrefixes) { if ($n.StartsWith($pref)) { return $true } }
    foreach ($stem in $sensitiveWildcardPrefixes) { if ($n.StartsWith($stem)) { return $true } }
    return $false
}

function Test-IsSkipDir {
    param([string]$dir)
    $name = Split-Path -Leaf $dir
    foreach ($s in $skipDirNames) {
        if ($name -ieq $s) { return $true }
    }
    return $false
}

# Ensure output directory exists
$outDir = Split-Path -Parent $OutFile
if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}
if ($LogFile -eq '') { $LogFile = Join-Path $outDir 'hash-g-roots.log' }

function Log { param([string]$msg)
    $ts = (Get-Date).ToString('s')
    $line = "$ts $msg"
    Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

Log "=== hash-g-roots start: roots=$($Roots -join ',') threshold=N/A maxFiles=$MaxFiles ==="

# -----------------------------------------------------------
# 1. Load existing hashes (resume cache)
# -----------------------------------------------------------
$cached = @{}
$cacheSources = @($ExistingHashes) + @($OutFile)
foreach ($cf in $cacheSources) {
    if (-not (Test-Path -LiteralPath $cf)) { continue }
    Log "Loading cache from $cf..."
    $loaded = 0
    foreach ($line in Get-Content -LiteralPath $cf -Encoding UTF8) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try {
            $o = $line | ConvertFrom-Json
            if ($o.path -and $o.hash) {
                $cached[$o.path.ToLowerInvariant()] = $o
                $loaded++
            }
        } catch { }
    }
    Log "  loaded $loaded from $cf"
}
Log "Total cache entries: $($cached.Count)"

# -----------------------------------------------------------
# 2. Walk roots
# -----------------------------------------------------------
$allFiles = New-Object System.Collections.Generic.List[string]
$rootMap = @{}  # path -> root (for stats)
foreach ($root in $Roots) {
    if (-not (Test-Path -LiteralPath $root)) {
        Log "WARN: root $root does not exist, skipping"
        continue
    }
    Log "Walking $root..."
    $stack = New-Object System.Collections.Generic.Stack[string]
    $stack.Push($root)
    $rootCount = 0
    while ($stack.Count -gt 0) {
        $dir = $stack.Pop()
        if (Test-IsSkipDir $dir) { continue }
        if (Test-IsSensitive $dir) { continue }
        try {
            foreach ($sub in [System.IO.Directory]::EnumerateDirectories($dir)) {
                if (Test-IsSkipDir $sub) { continue }
                if (Test-IsSensitive $sub) { continue }
                $stack.Push($sub)
            }
        } catch { }
        try {
            foreach ($f in [System.IO.Directory]::EnumerateFiles($dir)) {
                $ext = [System.IO.Path]::GetExtension($f).ToLowerInvariant()
                if ($includeExts -contains $ext) {
                    if (Test-IsSensitive $f) { continue }
                    $allFiles.Add($f)
                    $rootMap[$f] = $root
                    $rootCount++
                    if ($allFiles.Count -ge $MaxFiles) {
                        Log "MaxFiles=$MaxFiles reached during walk, stopping enumeration"
                        $stack.Clear()
                        break
                    }
                }
            }
        } catch { }
    }
    Log ("  {0}: {1} photos enumerated" -f $root, $rootCount)
}
Log "Total files to consider: $($allFiles.Count)"

# -----------------------------------------------------------
# 3. dHash via WPF BitmapImage (DCT-downsampled JPEG decode)
# -----------------------------------------------------------
function Get-DHash {
    param([string]$Path)
    $tw = 0; $th = 0
    $hs = [System.IO.File]::OpenRead($Path)
    try {
        $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
            $hs,
            [System.Windows.Media.Imaging.BitmapCreateOptions]::DelayCreation,
            [System.Windows.Media.Imaging.BitmapCacheOption]::None)
        if ($dec.Frames.Count -lt 1) { throw "No frames" }
        $frame0 = $dec.Frames[0]
        $tw = $frame0.PixelWidth; $th = $frame0.PixelHeight
    } finally { $hs.Close() }

    $bs = [System.IO.File]::OpenRead($Path)
    $bi = $null
    try {
        $bi = New-Object System.Windows.Media.Imaging.BitmapImage
        $bi.BeginInit()
        $bi.StreamSource = $bs
        $bi.DecodePixelWidth = 64
        $bi.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
        $bi.CreateOptions = [System.Windows.Media.Imaging.BitmapCreateOptions]::IgnoreColorProfile
        $bi.EndInit()
        $bi.Freeze()
    } finally { $bs.Close() }
    if ($bi.PixelWidth -lt 9 -or $bi.PixelHeight -lt 8) {
        throw "Decoded too small: $($bi.PixelWidth)x$($bi.PixelHeight)"
    }
    $scaleX = 9 / [double]$bi.PixelWidth
    $scaleY = 8 / [double]$bi.PixelHeight
    $xform = New-Object System.Windows.Media.ScaleTransform($scaleX, $scaleY)
    $tb = New-Object System.Windows.Media.Imaging.TransformedBitmap($bi, $xform)
    $conv = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap(
        $tb, [System.Windows.Media.PixelFormats]::Bgr24, $null, 0)
    $w = $conv.PixelWidth; $h = $conv.PixelHeight
    if ($w -lt 9 -or $h -lt 8) {
        throw "Resample produced too-small bitmap ${w}x${h}"
    }
    $stride = ($w * 24 + 7) -shr 3
    $buf = New-Object byte[] ($stride * $h)
    $conv.CopyPixels($buf, $stride, 0)
    $gray = New-Object 'int[]' 72
    for ($y = 0; $y -lt 8; $y++) {
        $rowOff = $y * $stride
        $gOff = $y * 9
        for ($x = 0; $x -lt 9; $x++) {
            $i = $rowOff + ($x * 3)
            $b = $buf[$i]; $gv = $buf[$i + 1]; $r = $buf[$i + 2]
            $gray[$gOff + $x] = [int](($r * 0.299) + ($gv * 0.587) + ($b * 0.114))
        }
    }
    $hash = [uint64]0
    $bit = 63
    for ($y = 0; $y -lt 8; $y++) {
        $gOff = $y * 9
        for ($x = 0; $x -lt 8; $x++) {
            if ($gray[$gOff + $x] -gt $gray[$gOff + $x + 1]) {
                $hash = $hash -bor ([uint64]1 -shl $bit)
            }
            $bit--
        }
    }
    return @{ Hash = $hash; Width = $tw; Height = $th }
}

# -----------------------------------------------------------
# 4. Hash sweep, append to OutFile
# -----------------------------------------------------------
$writer = [System.IO.StreamWriter]::new($OutFile, $true, [System.Text.UTF8Encoding]::new($false))
$processed = 0; $hashed = 0; $reused = 0; $failed = 0
try {
    foreach ($p in $allFiles) {
        $processed++
        if ($processed % $ProgressEvery -eq 0) {
            Log "Progress: $processed / $($allFiles.Count) (hashed=$hashed reused=$reused failed=$failed)"
        }
        $key = $p.ToLowerInvariant()
        if ($cached.ContainsKey($key)) {
            $reused++
            continue
        }
        try {
            $fi = Get-Item -LiteralPath $p -ErrorAction Stop
            $h = Get-DHash -Path $p
            $rec = [pscustomobject]@{
                path   = $p
                root   = $rootMap[$p]
                size   = $fi.Length
                mtime  = $fi.LastWriteTimeUtc.ToString('o')
                hash   = ('{0:x16}' -f [uint64]$h.Hash)
                width  = $h.Width
                height = $h.Height
            }
            $writer.WriteLine(($rec | ConvertTo-Json -Compress))
            $writer.Flush()
            $hashed++
        } catch {
            $failed++
            Log "  FAIL $p $_"
        }
    }
} finally {
    $writer.Dispose()
}
Log "=== hash-g-roots complete: processed=$processed hashed=$hashed reused=$reused failed=$failed ==="
