$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$processorSource = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class EventSpriteProcessor
{
    private static bool MatchesKey(byte red, byte green, byte blue, byte keyRed, byte keyGreen, byte keyBlue, int tolerance)
    {
        return Math.Abs(red - keyRed) <= tolerance
            && Math.Abs(green - keyGreen) <= tolerance
            && Math.Abs(blue - keyBlue) <= tolerance
            && red >= 145 && blue >= 145 && green <= 165;
    }

    public static string ProcessCrop(
        string inputPath,
        string outputPath,
        int sourceX,
        int sourceY,
        int width,
        int height,
        int clearX,
        int clearY,
        int clearWidth,
        int clearHeight)
    {
        using (var source = new Bitmap(inputPath))
        using (var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb))
        {
            using (var graphics = Graphics.FromImage(bitmap))
            {
                graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
                graphics.DrawImage(
                    source,
                    new Rectangle(0, 0, width, height),
                    new Rectangle(sourceX, sourceY, width, height),
                    GraphicsUnit.Pixel);
            }

            Color[] corners = {
                source.GetPixel(0, 0),
                source.GetPixel(source.Width - 1, 0),
                source.GetPixel(0, source.Height - 1),
                source.GetPixel(source.Width - 1, source.Height - 1)
            };
            byte keyRed = (byte)((corners[0].R + corners[1].R + corners[2].R + corners[3].R) / 4);
            byte keyGreen = (byte)((corners[0].G + corners[1].G + corners[2].G + corners[3].G) / 4);
            byte keyBlue = (byte)((corners[0].B + corners[1].B + corners[2].B + corners[3].B) / 4);

            var rectangle = new Rectangle(0, 0, width, height);
            var data = bitmap.LockBits(rectangle, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int stride = Math.Abs(data.Stride);
            var pixels = new byte[stride * height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);

            var clear = new bool[width * height];
            var queued = new bool[width * height];
            var queue = new int[width * height];
            int head = 0;
            int tail = 0;

            Func<int, int, int, bool> isKey = (x, y, tolerance) =>
            {
                int offset = y * stride + x * 4;
                return MatchesKey(pixels[offset + 2], pixels[offset + 1], pixels[offset], keyRed, keyGreen, keyBlue, tolerance);
            };

            Action<int, int> enqueue = (x, y) =>
            {
                int index = y * width + x;
                if (queued[index] || !isKey(x, y, 28)) return;
                queued[index] = true;
                queue[tail++] = index;
            };

            for (int x = 0; x < width; x++)
            {
                enqueue(x, 0);
                enqueue(x, height - 1);
            }
            for (int y = 1; y < height - 1; y++)
            {
                enqueue(0, y);
                enqueue(width - 1, y);
            }

            while (head < tail)
            {
                int index = queue[head++];
                clear[index] = true;
                int x = index % width;
                int y = index / width;
                if (x > 0) enqueue(x - 1, y);
                if (x + 1 < width) enqueue(x + 1, y);
                if (y > 0) enqueue(x, y - 1);
                if (y + 1 < height) enqueue(x, y + 1);
            }

            // Clear two antialias fringe bands only when they touch the removed key field.
            for (int pass = 0; pass < 2; pass++)
            {
                var additions = new bool[width * height];
                for (int y = 0; y < height; y++)
                {
                    for (int x = 0; x < width; x++)
                    {
                        int index = y * width + x;
                        if (clear[index]) continue;
                        bool touchesClear =
                            (x > 0 && clear[index - 1])
                            || (x + 1 < width && clear[index + 1])
                            || (y > 0 && clear[index - width])
                            || (y + 1 < height && clear[index + width]);
                        if (touchesClear && isKey(x, y, 72)) additions[index] = true;
                    }
                }
                for (int index = 0; index < additions.Length; index++)
                    if (additions[index]) clear[index] = true;
            }

            // Board-frame exports intentionally expose the center so the live board
            // remains clickable and visible. Other sprite crops pass a zero-size inset.
            if (clearWidth > 0 && clearHeight > 0)
            {
                int right = Math.Min(width, clearX + clearWidth);
                int bottom = Math.Min(height, clearY + clearHeight);
                for (int y = Math.Max(0, clearY); y < bottom; y++)
                    for (int x = Math.Max(0, clearX); x < right; x++)
                        clear[y * width + x] = true;
            }

            int transparentCount = 0;
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int index = y * width + x;
                    int offset = y * stride + x * 4;
                    if (!clear[index]) continue;
                    pixels[offset] = 0;
                    pixels[offset + 1] = 0;
                    pixels[offset + 2] = 0;
                    pixels[offset + 3] = 0;
                    transparentCount++;
                }
            }

            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
            bitmap.UnlockBits(data);
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            bitmap.Save(outputPath, ImageFormat.Png);
            return String.Format(
                "{0}x{1}; key=rgb({2},{3},{4}); transparent={5}",
                width, height, keyRed, keyGreen, keyBlue, transparentCount);
        }
    }
}
'@

Add-Type -TypeDefinition $processorSource -ReferencedAssemblies System.Drawing

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$sourceRoot = Join-Path $projectRoot "assets\event-ui\source"
$processedRoot = Join-Path $projectRoot "assets\event-ui\processed"
[System.IO.Directory]::CreateDirectory($processedRoot) | Out-Null

$shellSource = Join-Path $sourceRoot "公共外壳.png"
$shellOutput = Join-Path $processedRoot "event-shell.png"
[System.IO.File]::Copy($shellSource, $shellOutput, $true)
Write-Output "event-shell.png: copied without modification"

$atlasDefinitions = @(
    @{
        Source = "扫雷.png"
        Folder = "minesweeper"
        Sprites = @(
            @{ Name = "board-frame.png"; X = 33; Y = 171; W = 611; H = 347; Clear = @(30, 24, 551, 299) },
            @{ Name = "covered.png"; X = 665; Y = 287; W = 130; H = 130 },
            @{ Name = "revealed.png"; X = 810; Y = 288; W = 130; H = 128 },
            @{ Name = "number-1.png"; X = 954; Y = 288; W = 127; H = 128 },
            @{ Name = "number-2.png"; X = 1095; Y = 288; W = 130; H = 128 },
            @{ Name = "number-3.png"; X = 1237; Y = 288; W = 130; H = 128 },
            @{ Name = "number-4.png"; X = 1380; Y = 288; W = 127; H = 128 },
            @{ Name = "mine.png"; X = 34; Y = 594; W = 251; H = 259 },
            @{ Name = "flag.png"; X = 320; Y = 594; W = 185; H = 255 },
            @{ Name = "safety.png"; X = 528; Y = 626; W = 228; H = 205 },
            @{ Name = "explosion.png"; X = 779; Y = 588; W = 220; H = 263 },
            @{ Name = "victory.png"; X = 1035; Y = 642; W = 224; H = 196 },
            @{ Name = "failure.png"; X = 1290; Y = 638; W = 217; H = 198 }
        )
    },
    @{
        Source = "俄罗斯方块.png"
        Folder = "tetris"
        Sprites = @(
            @{ Name = "board-frame.png"; X = 25; Y = 12; W = 368; H = 690; Clear = @(27, 54, 314, 600) },
            @{ Name = "grid.png"; X = 405; Y = 58; W = 319; H = 628 },
            @{ Name = "block-1.png"; X = 745; Y = 181; W = 60; H = 69 },
            @{ Name = "block-2.png"; X = 1495; Y = 157; W = 68; H = 67 },
            @{ Name = "block-3.png"; X = 1428; Y = 359; W = 67; H = 68 },
            @{ Name = "block-4.png"; X = 1023; Y = 132; W = 68; H = 68 },
            @{ Name = "block-5.png"; X = 1371; Y = 133; W = 68; H = 68 },
            @{ Name = "block-6.png"; X = 858; Y = 360; W = 68; H = 68 },
            @{ Name = "block-7.png"; X = 1090; Y = 363; W = 67; H = 68 },
            @{ Name = "block-8.png"; X = 889; Y = 544; W = 67; H = 67 },
            @{ Name = "line-clear.png"; X = 1090; Y = 558; W = 543; H = 111 },
            @{ Name = "next-panel.png"; X = 98; Y = 717; W = 230; H = 195 },
            @{ Name = "hold-panel.png"; X = 407; Y = 718; W = 211; H = 195 },
            @{ Name = "value-panel.png"; X = 724; Y = 719; W = 212; H = 88 },
            @{ Name = "game-over.png"; X = 1030; Y = 718; W = 594; H = 190 }
        )
    },
    @{
        Source = "迷宫.png"
        Folder = "maze"
        Sprites = @(
            @{ Name = "board-frame.png"; X = 28; Y = 124; W = 784; H = 520; Clear = @(38, 36, 708, 446) },
            @{ Name = "floor.png"; X = 848; Y = 166; W = 119; H = 115 },
            @{ Name = "wall-horizontal.png"; X = 999; Y = 165; W = 134; H = 115 },
            @{ Name = "wall-vertical.png"; X = 1170; Y = 157; W = 92; H = 130 },
            @{ Name = "wall-corner.png"; X = 1306; Y = 161; W = 119; H = 121 },
            @{ Name = "wall-t.png"; X = 1463; Y = 157; W = 121; H = 139 },
            @{ Name = "wall-cross.png"; X = 1762; Y = 151; W = 137; H = 146 },
            @{ Name = "collectible.png"; X = 851; Y = 347; W = 87; H = 105 },
            @{ Name = "power-item.png"; X = 969; Y = 326; W = 144; H = 154 },
            @{ Name = "player.png"; X = 1123; Y = 319; W = 180; H = 166 },
            @{ Name = "enemy.png"; X = 1305; Y = 314; W = 194; H = 176 },
            @{ Name = "shield.png"; X = 1512; Y = 318; W = 176; H = 172 },
            @{ Name = "power-effect.png"; X = 819; Y = 504; W = 251; H = 212 },
            @{ Name = "victory.png"; X = 1292; Y = 511; W = 312; H = 200 },
            @{ Name = "failure.png"; X = 1609; Y = 511; W = 290; H = 205 }
        )
    }
)

foreach ($atlas in $atlasDefinitions) {
    $inputPath = Join-Path $sourceRoot $atlas.Source
    $folderPath = Join-Path $processedRoot $atlas.Folder
    [System.IO.Directory]::CreateDirectory($folderPath) | Out-Null
    foreach ($sprite in $atlas.Sprites) {
        $clear = if ($sprite.ContainsKey("Clear")) { $sprite.Clear } else { @(0, 0, 0, 0) }
        $outputPath = Join-Path $folderPath $sprite.Name
        $result = [EventSpriteProcessor]::ProcessCrop(
            $inputPath,
            $outputPath,
            $sprite.X,
            $sprite.Y,
            $sprite.W,
            $sprite.H,
            $clear[0],
            $clear[1],
            $clear[2],
            $clear[3])
        Write-Output "$($atlas.Folder)/$($sprite.Name): $result"
    }
}
