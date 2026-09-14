param([string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class ScenePng {
  public static Bitmap Clean(string path, bool square, bool neutral = false) {
    using (var src = new Bitmap(path)) {
      int w=src.Width,h=src.Height; var pixels=new Color[w*h]; var key=new bool[w*h]; var clear=new bool[w*h]; var queue=new Queue<int>();
      for(int y=0;y<h;y++) for(int x=0;x<w;x++) { int i=y*w+x; Color p=src.GetPixel(x,y); pixels[i]=p; key[i]=p.A>0 && (neutral ? p.R>150 && p.B>85 && p.R-p.G>60 && p.B-p.G>18 : p.R>210 && p.B>170 && p.G<115 && p.R-p.G>110 && p.B-p.G>65); }
      // Neutral gold/cream panels contain no intended purple/pink: remove their
      // isolated matte remnants too. Colored sprites use perimeter-only cleanup.
      for(int y=0;y<h;y++) for(int x=0;x<w;x++) { int i=y*w+x; if(!key[i])continue; bool edge=x==0||y==0||x==w-1||y==h-1; if(neutral || edge || pixels[i-1].A<9 || pixels[i+1].A<9 || pixels[i-w].A<9 || pixels[i+w].A<9) {clear[i]=true;queue.Enqueue(i);} }
      while(queue.Count>0) {int i=queue.Dequeue(),x=i%w,y=i/w; foreach(int j in new int[]{x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1}) if(j>=0&&key[j]&&!clear[j]){clear[j]=true;queue.Enqueue(j);} }
      int l=w,t=h,r=-1,b=-1;
      for(int y=0;y<h;y++)for(int x=0;x<w;x++){int i=y*w+x;if(clear[i]||pixels[i].A<9)continue;l=Math.Min(l,x);r=Math.Max(r,x);t=Math.Min(t,y);b=Math.Max(b,y);}
      if(r<l)throw new Exception("Empty image: "+path);
      int cw=r-l+1,ch=b-t+1,side=Math.Max(cw,ch); var dest=new Bitmap(square?side:cw,square?side:ch,PixelFormat.Format32bppArgb);
      int ox=square?(side-cw)/2:0,oy=square?(side-ch)/2:0;
      for(int y=t;y<=b;y++)for(int x=l;x<=r;x++){int i=y*w+x; dest.SetPixel(x-l+ox,y-t+oy,clear[i]?Color.Transparent:pixels[i]);}
      return dest;
    }
  }
  public static void Export(string src,string dst,bool square){string name=System.IO.Path.GetFileNameWithoutExtension(dst);bool neutral=Array.IndexOf(new string[]{"frame","hud","closed","pressed","open","hold","next","panel"},name)>=0;using(var b=Clean(src,square,neutral)) b.Save(dst,ImageFormat.Png);}
  public static void Blank(string src,string dst,int inset,Color color){using(var b=Clean(src,false)){using(var g=Graphics.FromImage(b))using(var brush=new SolidBrush(color))g.FillRectangle(brush,inset,inset,b.Width-inset*2,b.Height-inset*2);b.Save(dst,ImageFormat.Png);}}
  public static void Crop(string src,string dst,int x,int y,int w,int h){using(var b=new Bitmap(src))using(var c=b.Clone(new Rectangle(x,y,w,h),PixelFormat.Format32bppArgb))c.Save(dst,ImageFormat.Png);}
}
'@
$source = Join-Path $ProjectRoot 'assets/event-ui/source'
$output = Join-Path $ProjectRoot 'assets/event-ui/processed/scene'
$mapping = [ordered]@{
  'common/background.png' = '公共外壳/new secen.png'
  'common/stage.png' = '公共外壳/木质板.png'
  'common/character.png' = '公共外壳/character package.png'
  'common/rewards.png' = '公共外壳/reward system.png'
  'common/dialog.png' = '公共外壳/图层 1.png'
  'common/panel.png' = '公共外壳/图层 5.png'
  'common/button.png' = '公共外壳/图层 2.png'
  'minesweeper/frame.png' = 'Minesweeper/图层 1.png'
  'minesweeper/hud.png' = 'Minesweeper/图层 2.png'
  'minesweeper/closed.png' = 'Minesweeper/图层 3.png'
  'minesweeper/pressed.png' = 'Minesweeper/图层 4.png'
  'minesweeper/open.png' = 'Minesweeper/图层 5.png'
  'minesweeper/flag.png' = 'Minesweeper/图层 6.png'
  'minesweeper/mine.png' = 'Minesweeper/图层 7.png'
  'minesweeper/clock.png' = 'Minesweeper/图层 8.png'
  'minesweeper/restart.png' = 'Minesweeper/图层 9.png'
  'minesweeper/divider.png' = 'Minesweeper/图层 10.png'
  'maze/player.png' = 'MazeChase/图层 6.png'
  'maze/enemy.png' = 'MazeChase/椭圆 1 拷贝.png'
  'maze/collectible.png' = 'MazeChase/图层 5.png'
  'maze/power.png' = 'MazeChase/图层 3.png'
  'maze/restart.png' = 'MazeChase/图层 7.png'
  'tetris/frame.png' = 'Tetris/图层 1.png'
  'tetris/hold.png' = 'Tetris/图层 2.png'
  'tetris/next.png' = 'Tetris/图层 3.png'
  'tetris/panel.png' = 'Tetris/图层 5.png'
  'tetris/block-1.png' = 'Tetris/图层 7.png'
  'tetris/block-2.png' = 'Tetris/图层 8.png'
  'tetris/block-3.png' = 'Tetris/图层 9.png'
  'tetris/block-4.png' = 'Tetris/图层 10.png'
  'tetris/block-5.png' = 'Tetris/图层 11.png'
  'tetris/block-6.png' = 'Tetris/图层 13.png'
  'tetris/block-7.png' = 'Tetris/图层 14.png'
  'tetris/ghost.png' = 'Tetris/图层 15.png'
  'tetris/restart.png' = 'Tetris/图层 17.png'
}
$report = @()
foreach ($entry in $mapping.GetEnumerator()) {
  $src=Join-Path $source $entry.Value; $dst=Join-Path $output $entry.Key
  if (!(Test-Path -LiteralPath $src)) { throw "Missing source: $src" }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dst) | Out-Null
  $square=$entry.Key -match '(closed|pressed|open|block-[1-7]|ghost)\.png$'
  [ScenePng]::Export($src,$dst,$square)
  $im=[System.Drawing.Bitmap]::FromFile($dst)
  $report += [PSCustomObject]@{source="assets/event-ui/source/$($entry.Value)";output="assets/event-ui/processed/scene/$($entry.Key)";width=$im.Width;height=$im.Height;square=$square}
  $im.Dispose()
}
# The original maze is a fixed illustration, not the game's collision map.
# Retain its outer bevel and extract its wall/floor textures; never display the baked maze.
$maze=Join-Path $source 'MazeChase/迷宫底座.png'
[ScenePng]::Blank($maze,(Join-Path $output 'maze/frame.png'),32,[System.Drawing.Color]::FromArgb(192,210,192))
[ScenePng]::Crop($maze,(Join-Path $output 'maze/wall.png'),570,80,120,32)
[ScenePng]::Crop($maze,(Join-Path $output 'maze/floor.png'),580,45,100,25)
# Remove example labels, numbers, life portraits and restart graphic from the copy only.
[ScenePng]::Blank((Join-Path $source 'MazeChase/图层 1.png'),(Join-Path $output 'maze/hud.png'),18,[System.Drawing.Color]::FromArgb(255,241,207))
$report += [PSCustomObject]@{source='assets/event-ui/source/MazeChase/迷宫底座.png';output='maze/frame.png, maze/wall.png, maze/floor.png';note='Frame interior cleared; wall crop [570,80,120,32], floor crop [580,45,100,25]'}
$report += [PSCustomObject]@{source='assets/event-ui/source/MazeChase/图层 1.png';output='maze/hud.png';note='Inset 18px interior cleared to #fff1cf; runtime values replace all sample text'}
$report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $output 'manifest.json') -Encoding UTF8
Write-Output "Processed $($mapping.Count) split resources plus 4 maze derivatives. Sources preserved."
