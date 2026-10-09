Add-Type -AssemblyName System.Drawing
$outDir = "d:\Dialectal\nutri\app_store_screenshots"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir }

function Resize-Image ($srcPath, $destPath, $width, $height) {
    $srcImage = [System.Drawing.Image]::FromFile($srcPath)
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $graphics.FillRectangle($brush, 0, 0, $width, $height)
    
    $scale = [Math]::Min([double]$width / [double]$srcImage.Width, [double]$height / [double]$srcImage.Height)
    $drawWidth = [int]($srcImage.Width * $scale)
    $drawHeight = [int]($srcImage.Height * $scale)
    $posX = [int](($width - $drawWidth) / 2)
    $posY = [int](($height - $drawHeight) / 2)
    
    $graphics.DrawImage($srcImage, $posX, $posY, $drawWidth, $drawHeight)
    
    $destBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destBitmap.Dispose()
    $srcImage.Dispose()
    Write-Host "Generated: $destPath ($width x $height)"
}

$src1 = "C:\Users\madan\.gemini\antigravity\brain\6a3121e8-f50b-488a-af71-39e18e643c21\screenshot_live_scanner_1790856427180.jpg"
$src2 = "C:\Users\madan\.gemini\antigravity\brain\6a3121e8-f50b-488a-af71-39e18e643c21\screenshot_macros_details_1790856452930.jpg"

Resize-Image $src1 (Join-Path $outDir "iphone_1290x2796_scanner.png") 1290 2796
Resize-Image $src2 (Join-Path $outDir "iphone_1290x2796_macros.png") 1290 2796
Resize-Image $src1 (Join-Path $outDir "ipad_2048x2732_scanner.png") 2048 2732
Resize-Image $src2 (Join-Path $outDir "ipad_2048x2732_macros.png") 2048 2732

