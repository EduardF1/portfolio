# Copy + resize the 9 selected own-camera photos for Hungary/Germany cities task.
# Source paths vary per file; mapping inline.

$Dest = "C:\Users\Eduard\Projects\portfolio\.claude\worktrees\agent-ae34db8fdc7069ccb\public\photos\trips\2026-03-balkans-roadtrip"
$MaxLongSide = 1920
$Quality = 82

Add-Type -AssemblyName System.Drawing

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$qualityParam = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)
$encoderParams.Param[0] = $qualityParam

$mapping = @(
    @{ src = "G:\Photos\2026\Budapest 26\IMG20260314222230.jpg"; name = "IMG20260314222230.jpg" },
    @{ src = "G:\Photos\2026\Budapest 26\IMG20260315003840.jpg"; name = "IMG20260315003840.jpg" },
    @{ src = "G:\Photos\2026\Budapest 26\IMG20260315003841.jpg"; name = "IMG20260315003841.jpg" },
    @{ src = "G:\Photos\2026\Germany 26 (03)\IMG20260328120403.jpg"; name = "IMG20260328120403.jpg" },
    @{ src = "G:\Photos\2026\Germany 26 (03)\IMG20260328120453.jpg"; name = "IMG20260328120453.jpg" },
    @{ src = "G:\Photos\2026\Germany 26 (03)\IMG20260328135135.jpg"; name = "IMG20260328135135.jpg" },
    @{ src = "G:\Photos\2026\Germany 26 (03)\IMG20260328151221.jpg"; name = "IMG20260328151221.jpg" },
    @{ src = "G:\Photos\2026\Germany 26 (03)\IMG20260328154040.jpg"; name = "IMG20260328154040.jpg" },
    @{ src = "G:\Photos\2026\Germany 26 (03)\IMG20260328173447_01.jpg"; name = "IMG20260328173447_01.jpg" }
)

$copied = 0
foreach ($m in $mapping) {
    $srcPath = $m.src
    $destPath = Join-Path $Dest $m.name
    if (-not (Test-Path $srcPath)) {
        Write-Warning "MISSING: $srcPath"
        continue
    }
    if (Test-Path $destPath) {
        Write-Output "SKIP (exists): $($m.name)"
        continue
    }
    $img = [System.Drawing.Image]::FromFile($srcPath)
    try {
        $orientation = 1
        if ($img.PropertyIdList -contains 0x0112) {
            $prop = $img.GetPropertyItem(0x0112)
            $orientation = [BitConverter]::ToUInt16($prop.Value, 0)
        }
        $w = $img.Width; $h = $img.Height
        $long = [Math]::Max($w, $h)
        $scale = [Math]::Min(1.0, $MaxLongSide / $long)
        $newW = [int]($w * $scale)
        $newH = [int]($h * $scale)
        $bmp = New-Object System.Drawing.Bitmap $newW, $newH
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.DrawImage($img, 0, 0, $newW, $newH)
        $g.Dispose()
        switch ($orientation) {
            2 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
            3 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
            4 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
            5 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
            6 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
            7 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
            8 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
        }
        $bmp.Save($destPath, $jpegCodec, $encoderParams)
        $bmp.Dispose()
        $copied++
    } finally {
        $img.Dispose()
    }
}
Write-Output "Copied: $copied"
