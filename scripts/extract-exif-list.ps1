# Helper for the photo-catalogue-extension task: same EXIF reader as extract-exif.ps1
# but accepts -SourceFolder and -ListPath (newline-separated filenames) instead of
# scanning a whole folder. Emits NDJSON to stdout.
#
# Usage: pwsh -NoProfile -File scripts/extract-exif-list.ps1 -SourceFolder 'G:\Photos' -ListPath /tmp/candidates.txt
param(
  [Parameter(Mandatory = $true)] [string] $SourceFolder,
  [Parameter(Mandatory = $true)] [string] $ListPath
)

$ErrorActionPreference = 'Stop'

function Read-U16 {
  param([byte[]]$b, [int]$o, [bool]$le)
  if ($le) { return [BitConverter]::ToUInt16($b, $o) }
  return [int](([int]$b[$o] -shl 8) -bor [int]$b[$o+1])
}
function Read-U32 {
  param([byte[]]$b, [int]$o, [bool]$le)
  if ($le) { return [BitConverter]::ToUInt32($b, $o) }
  return [uint32](([uint32]$b[$o] -shl 24) -bor ([uint32]$b[$o+1] -shl 16) -bor ([uint32]$b[$o+2] -shl 8) -bor [uint32]$b[$o+3])
}
function Read-Rational {
  param([byte[]]$b, [int]$o, [bool]$le)
  $num = Read-U32 -b $b -o $o -le $le
  $den = Read-U32 -b $b -o ($o + 4) -le $le
  if ($den -eq 0) { return 0.0 }
  return [double]$num / [double]$den
}
function Read-AsciiAt {
  param([byte[]]$b, [int]$entry, [int]$tiffStart, [bool]$le, [int]$cnt)
  if ($cnt -le 4) {
    return [System.Text.Encoding]::ASCII.GetString($b, $entry + 8, [Math]::Max(0, $cnt - 1))
  }
  $valOff = Read-U32 -b $b -o ($entry + 8) -le $le
  $start = $tiffStart + [int]$valOff
  return [System.Text.Encoding]::ASCII.GetString($b, $start, [Math]::Max(0, $cnt - 1))
}

function Read-Exif([string]$path) {
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $result = @{
    file = [System.IO.Path]::GetFileName($path)
    hasGps = $false
    dateTimeOriginal = $null
    cameraModel = $null
    lat = $null
    lon = $null
  }
  if ($bytes.Length -lt 4 -or $bytes[0] -ne 0xFF -or $bytes[1] -ne 0xD8) { return $result }
  $i = 2
  while ($i -lt $bytes.Length - 4) {
    if ($bytes[$i] -ne 0xFF) { return $result }
    $marker = $bytes[$i + 1]
    if ($marker -eq 0xDA -or $marker -eq 0xD9) { return $result }
    $segLen = ([int]$bytes[$i + 2] -shl 8) -bor [int]$bytes[$i + 3]
    if ($marker -eq 0xE1 -and $segLen -gt 8) {
      $segStart = $i + 4
      if ($bytes[$segStart] -eq 0x45 -and $bytes[$segStart+1] -eq 0x78 -and $bytes[$segStart+2] -eq 0x69 -and $bytes[$segStart+3] -eq 0x66) {
        $tiffStart = $segStart + 6
        $byteOrder = [System.Text.Encoding]::ASCII.GetString($bytes, $tiffStart, 2)
        $isLE = $byteOrder -eq 'II'
        $ifd0Off = Read-U32 -b $bytes -o ($tiffStart + 4) -le $isLE
        $ifd0 = $tiffStart + [int]$ifd0Off
        $entryCount = Read-U16 -b $bytes -o $ifd0 -le $isLE
        $gpsIfdOff = $null
        $exifIfdOff = $null
        for ($e = 0; $e -lt $entryCount; $e++) {
          $entry = $ifd0 + 2 + $e * 12
          $tag = Read-U16 -b $bytes -o $entry -le $isLE
          $type = Read-U16 -b $bytes -o ($entry + 2) -le $isLE
          $cnt = Read-U32 -b $bytes -o ($entry + 4) -le $isLE
          if ($tag -eq 0x8825) { $gpsIfdOff = Read-U32 -b $bytes -o ($entry + 8) -le $isLE }
          elseif ($tag -eq 0x8769) { $exifIfdOff = Read-U32 -b $bytes -o ($entry + 8) -le $isLE }
          elseif ($tag -eq 0x0110) {
            $result.cameraModel = (Read-AsciiAt -b $bytes -entry $entry -tiffStart $tiffStart -le $isLE -cnt ([int]$cnt)).TrimEnd([char]0)
          }
        }
        if ($exifIfdOff) {
          $exifIfd = $tiffStart + [int]$exifIfdOff
          $ec = Read-U16 -b $bytes -o $exifIfd -le $isLE
          for ($e = 0; $e -lt $ec; $e++) {
            $entry = $exifIfd + 2 + $e * 12
            $tag = Read-U16 -b $bytes -o $entry -le $isLE
            $cnt = Read-U32 -b $bytes -o ($entry + 4) -le $isLE
            if ($tag -eq 0x9003) {
              $result.dateTimeOriginal = (Read-AsciiAt -b $bytes -entry $entry -tiffStart $tiffStart -le $isLE -cnt ([int]$cnt)).TrimEnd([char]0)
            }
          }
        }
        if ($gpsIfdOff) {
          $gpsIfd = $tiffStart + [int]$gpsIfdOff
          $gc = Read-U16 -b $bytes -o $gpsIfd -le $isLE
          $latRef = $null; $lonRef = $null; $lat = $null; $lon = $null
          for ($e = 0; $e -lt $gc; $e++) {
            $entry = $gpsIfd + 2 + $e * 12
            $tag = Read-U16 -b $bytes -o $entry -le $isLE
            $type = Read-U16 -b $bytes -o ($entry + 2) -le $isLE
            $cnt = Read-U32 -b $bytes -o ($entry + 4) -le $isLE
            if ($tag -eq 0x0001 -and $cnt -ge 1) {
              $latRef = [System.Text.Encoding]::ASCII.GetString($bytes, $entry + 8, 1)
            } elseif ($tag -eq 0x0003 -and $cnt -ge 1) {
              $lonRef = [System.Text.Encoding]::ASCII.GetString($bytes, $entry + 8, 1)
            } elseif ($tag -eq 0x0002 -and $cnt -eq 3 -and $type -eq 5) {
              $valOff = Read-U32 -b $bytes -o ($entry + 8) -le $isLE
              $base = $tiffStart + [int]$valOff
              $deg = Read-Rational -b $bytes -o $base -le $isLE
              $min = Read-Rational -b $bytes -o ($base + 8) -le $isLE
              $sec = Read-Rational -b $bytes -o ($base + 16) -le $isLE
              $lat = $deg + $min / 60.0 + $sec / 3600.0
            } elseif ($tag -eq 0x0004 -and $cnt -eq 3 -and $type -eq 5) {
              $valOff = Read-U32 -b $bytes -o ($entry + 8) -le $isLE
              $base = $tiffStart + [int]$valOff
              $deg = Read-Rational -b $bytes -o $base -le $isLE
              $min = Read-Rational -b $bytes -o ($base + 8) -le $isLE
              $sec = Read-Rational -b $bytes -o ($base + 16) -le $isLE
              $lon = $deg + $min / 60.0 + $sec / 3600.0
            }
          }
          if ($null -ne $lat -and $null -ne $lon) {
            if ($latRef -eq 'S') { $lat = -$lat }
            if ($lonRef -eq 'W') { $lon = -$lon }
            $result.hasGps = $true
            $result.lat = $lat
            $result.lon = $lon
          }
        }
        return $result
      }
    }
    $i = $i + 2 + $segLen
  }
  return $result
}

$names = Get-Content $ListPath | Where-Object { $_ -ne '' }
foreach ($name in $names) {
  $path = Join-Path $SourceFolder $name
  if (-not (Test-Path $path)) { continue }
  try {
    $r = Read-Exif -path $path
    [Console]::Out.WriteLine(($r | ConvertTo-Json -Compress -Depth 4))
  } catch {
    $err = @{ file = $name; error = "$_" }
    [Console]::Out.WriteLine(($err | ConvertTo-Json -Compress -Depth 4))
  }
}
