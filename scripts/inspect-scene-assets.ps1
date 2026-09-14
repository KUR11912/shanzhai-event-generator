$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'exports/v4-scene-update'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$report = @()
foreach ($dir in @('公共外壳','Minesweeper','MazeChase','Tetris')) {
  $files = @(Get-ChildItem -LiteralPath (Join-Path $root "assets/event-ui/source/$dir") -Filter '*.png')
  $sheet = New-Object System.Drawing.Bitmap(1000, ([int][Math]::Ceiling($files.Count / 5.0) * 180))
  $g = [System.Drawing.Graphics]::FromImage($sheet)
  $g.Clear([System.Drawing.Color]::FromArgb(205,210,217))
  $font = New-Object System.Drawing.Font('Microsoft YaHei', 9)
  for ($i=0; $i -lt $files.Count; $i++) {
    $im = [System.Drawing.Bitmap]::FromFile($files[$i].FullName)
    $minX=$im.Width; $minY=$im.Height; $maxX=-1; $maxY=-1; $transparent=0
    for ($y=0; $y -lt $im.Height; $y++) { for ($x=0; $x -lt $im.Width; $x++) {
      $p=$im.GetPixel($x,$y)
      if ($p.A -le 8) { $transparent++; continue }
      if ($x -lt $minX) { $minX=$x }; if ($x -gt $maxX) { $maxX=$x }
      if ($y -lt $minY) { $minY=$y }; if ($y -gt $maxY) { $maxY=$y }
    } }
    $report += [PSCustomObject]@{directory=$dir;file=$files[$i].Name;width=$im.Width;height=$im.Height;transparentPixels=$transparent;bounds=@($minX,$minY,$maxX,$maxY);sha256=(Get-FileHash -LiteralPath $files[$i].FullName -Algorithm SHA256).Hash}
    $scale=[Math]::Min(180.0/$im.Width,135.0/$im.Height)
    $dx=($i%5)*200; $dy=[Math]::Floor($i/5)*180
    $g.DrawImage($im,[single]($dx+10),[single]($dy+5),[single]($im.Width*$scale),[single]($im.Height*$scale))
    $g.DrawString($files[$i].Name,$font,[System.Drawing.Brushes]::Black,[System.Drawing.RectangleF]::new($dx+6,$dy+144,190,35))
    $im.Dispose()
  }
  $sheet.Save((Join-Path $out "$dir-contact.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  $font.Dispose(); $g.Dispose(); $sheet.Dispose()
}
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $out 'source-inspection.json') -Encoding UTF8
$report | Format-Table directory,file,width,height,transparentPixels -AutoSize
