# Copy + resize selected JPGs from D:\Portfolio into public/photos.
# Resizes to a max long-side of 1920px and re-encodes at JPEG quality 82.
# Existing handpicked photos in public/photos/ are LEFT INTACT.

param(
    [string]$Source = "D:\Portfolio",
    [string]$Dest   = "C:\Users\Eduard\Projects\portfolio\.claude\worktrees\agent-a173608f9e01e909d\public\photos",
    [string]$ListPath = "C:\Users\Eduard\Projects\portfolio\.claude\worktrees\agent-a173608f9e01e909d\scripts\.selected-photos.txt",
    [int]$MaxLongSide = 1920,
    [long]$Quality = 82
)

Add-Type -AssemblyName System.Drawing

# Build JPEG encoder + quality params.
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$qualityParam = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)
$encoderParams.Param[0] = $qualityParam

$selected = Get-Content $ListPath | Where-Object { $_ -ne '' }
Write-Output "Processing $($selected.Count) photos..."

$skipped = 0
$copied = 0
$totalBytes = 0L

foreach ($name in $selected) {
    $srcPath = Join-Path $Source $name
    $destPath = Join-Path $Dest $name
    if (-not (Test-Path $srcPath)) {
        Write-Warning "MISSING: $name"
        $skipped++
        continue
    }
    if (Test-Path $destPath) {
        Write-Output "SKIP (exists): $name"
        $skipped++
        continue
    }

    $img = [System.Drawing.Image]::FromFile($srcPath)
    try {
        # Honour EXIF orientation: System.Drawing stores it as property 0x0112.
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

        # Apply orientation rotation/flip on the resized bitmap.
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
        $totalBytes += (Get-Item $destPath).Length
    } finally {
        $img.Dispose()
    }
}

Write-Output ("Done. Copied={0}, Skipped={1}, Total size={2:N2} MB" -f $copied, $skipped, ($totalBytes / 1MB))
