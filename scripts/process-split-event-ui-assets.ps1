param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sourceRoot = Join-Path $ProjectRoot 'assets\event-ui\source'
$processedRoot = Join-Path $ProjectRoot 'assets\event-ui\processed'
$commonSource = Join-Path $sourceRoot '公共外壳'
$minesweeperSource = Join-Path $sourceRoot '扫雷'
$commonOutput = Join-Path $processedRoot 'common'
$minesweeperOutput = Join-Path $processedRoot 'minesweeper'

New-Item -ItemType Directory -Force -Path $commonOutput, $minesweeperOutput | Out-Null

$commonAssets = [ordered]@{
  'ChatGPT Image 2026年9月12日 下午11_32_19.png' = 'background.png'
  '图层 1.png' = 'dialog-panel.png'
  '图层 2.png' = 'circular-button.png'
  '图层 3.png' = 'wood-panel.png'
  '图层 5.png' = 'panel.png'
}

$minesweeperAssets = [ordered]@{
  '图层 1.png' = 'cell-closed.png'
  '图层 2.png' = 'cell-open.png'
  '图层 3.png' = 'number-1.png'
  '图层 4.png' = 'number-2.png'
  '图层 5.png' = 'number-3.png'
  '图层 6.png' = 'number-4.png'
  '图层 7.png' = 'game-panel.png'
  '图层 8.png' = 'mine.png'
  '图层 9.png' = 'flag.png'
  '图层 10.png' = 'safety.png'
  '图层 11.png' = 'explosion.png'
  '图层 12.png' = 'victory.png'
  '图层 13.png' = 'failure.png'
}

function Assert-SourceFiles([string]$BasePath, [System.Collections.IDictionary]$Mapping) {
  foreach ($sourceName in $Mapping.Keys) {
    $sourcePath = Join-Path $BasePath $sourceName
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
      throw "Missing source asset: $sourcePath"
    }
  }
}

function Export-MagentaCleanPng([string]$SourcePath, [string]$DestinationPath) {
  $source = [System.Drawing.Bitmap]::FromFile($SourcePath)
  $output = New-Object System.Drawing.Bitmap($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    for ($y = 0; $y -lt $source.Height; $y++) {
      for ($x = 0; $x -lt $source.Width; $x++) {
        $pixel = $source.GetPixel($x, $y)
        $isMagentaFringe = $pixel.A -gt 0 -and
          $pixel.R -gt 180 -and $pixel.B -gt 120 -and $pixel.G -lt 105 -and
          ($pixel.R - $pixel.G) -gt 100 -and ($pixel.B - $pixel.G) -gt 45
        if ($isMagentaFringe) {
          $output.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
          $output.SetPixel($x, $y, $pixel)
        }
      }
    }
    $output.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $output.Dispose()
    $source.Dispose()
  }
}

Assert-SourceFiles $commonSource $commonAssets
Assert-SourceFiles $minesweeperSource $minesweeperAssets

foreach ($entry in $commonAssets.GetEnumerator()) {
  Copy-Item -LiteralPath (Join-Path $commonSource $entry.Key) -Destination (Join-Path $commonOutput $entry.Value) -Force
}

foreach ($entry in $minesweeperAssets.GetEnumerator()) {
  Export-MagentaCleanPng (Join-Path $minesweeperSource $entry.Key) (Join-Path $minesweeperOutput $entry.Value)
}

Write-Output "Processed split event UI assets into: $processedRoot"
