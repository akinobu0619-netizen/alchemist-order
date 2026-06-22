param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [int]$MaxSize = 512,
  [int]$Tolerance = 110,
  [switch]$GlobalKey,
  [switch]$PixelArt
)

Add-Type -AssemblyName System.Drawing

if (-not ("EdgeBackgroundRemover" -as [type])) {
  Add-Type -ReferencedAssemblies @('System.Drawing.dll', 'System.dll') -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class EdgeBackgroundRemover {
    public static void Process(string input, string output, int maxSize, int tolerance, bool globalKey, bool pixelArt) {
        using (var source = new Bitmap(input))
        using (var image = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb)) {
            using (var g = Graphics.FromImage(image)) {
                g.DrawImageUnscaled(source, 0, 0);
            }

            int width = image.Width, height = image.Height;
            var rect = new Rectangle(0, 0, width, height);
            var data = image.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int stride = data.Stride;
            byte[] pixels = new byte[stride * height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);

            int[] cornerR = new int[4], cornerG = new int[4], cornerB = new int[4];
            int[] xs = { 2, width - 3, 2, width - 3 };
            int[] ys = { 2, 2, height - 3, height - 3 };
            for (int i = 0; i < 4; i++) {
                int p = ys[i] * stride + xs[i] * 4;
                cornerB[i] = pixels[p]; cornerG[i] = pixels[p + 1]; cornerR[i] = pixels[p + 2];
            }
            Array.Sort(cornerR); Array.Sort(cornerG); Array.Sort(cornerB);
            int keyR = (cornerR[1] + cornerR[2]) / 2;
            int keyG = (cornerG[1] + cornerG[2]) / 2;
            int keyB = (cornerB[1] + cornerB[2]) / 2;
            int tol2 = tolerance * tolerance;

            bool[] visited = new bool[width * height];
            var queue = new Queue<int>(width * 4 + height * 4);
            Action<int, int> seed = (x, y) => {
                int idx = y * width + x;
                if (visited[idx]) return;
                int p = y * stride + x * 4;
                int db = pixels[p] - keyB, dg = pixels[p + 1] - keyG, dr = pixels[p + 2] - keyR;
                if (dr * dr + dg * dg + db * db <= tol2) {
                    visited[idx] = true;
                    queue.Enqueue(idx);
                }
            };
            for (int x = 0; x < width; x++) { seed(x, 0); seed(x, height - 1); }
            for (int y = 0; y < height; y++) { seed(0, y); seed(width - 1, y); }

            int[] dx = { 1, -1, 0, 0 }, dy = { 0, 0, 1, -1 };
            while (queue.Count > 0) {
                int idx = queue.Dequeue();
                int x = idx % width, y = idx / width;
                for (int k = 0; k < 4; k++) {
                    int nx = x + dx[k], ny = y + dy[k];
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    int ni = ny * width + nx;
                    if (visited[ni]) continue;
                    int p = ny * stride + nx * 4;
                    int db = pixels[p] - keyB, dg = pixels[p + 1] - keyG, dr = pixels[p + 2] - keyR;
                    if (dr * dr + dg * dg + db * db <= tol2) {
                        visited[ni] = true;
                        queue.Enqueue(ni);
                    }
                }
            }

            if (globalKey) {
                for (int y = 0; y < height; y++) {
                    for (int x = 0; x < width; x++) {
                        int idx = y * width + x;
                        if (visited[idx]) continue;
                        int p = y * stride + x * 4;
                        int db = pixels[p] - keyB, dg = pixels[p + 1] - keyG, dr = pixels[p + 2] - keyR;
                        if (dr * dr + dg * dg + db * db <= tol2) visited[idx] = true;
                    }
                }
            }

            int minX = width, minY = height, maxX = -1, maxY = -1;
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int idx = y * width + x;
                    int p = y * stride + x * 4;
                    if (visited[idx]) {
                        pixels[p + 3] = 0;
                    } else {
                        pixels[p + 3] = 255;
                        if (x < minX) minX = x; if (x > maxX) maxX = x;
                        if (y < minY) minY = y; if (y > maxY) maxY = y;
                    }
                }
            }
            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
            image.UnlockBits(data);

            if (maxX < minX || maxY < minY) throw new InvalidOperationException("No foreground detected.");
            int pad = Math.Max(8, Math.Min(width, height) / 40);
            minX = Math.Max(0, minX - pad); minY = Math.Max(0, minY - pad);
            maxX = Math.Min(width - 1, maxX + pad); maxY = Math.Min(height - 1, maxY + pad);
            var crop = new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);

            double scale = Math.Min(1.0, (double)maxSize / Math.Max(crop.Width, crop.Height));
            int outW = Math.Max(1, (int)Math.Round(crop.Width * scale));
            int outH = Math.Max(1, (int)Math.Round(crop.Height * scale));
            using (var result = new Bitmap(outW, outH, PixelFormat.Format32bppArgb))
            using (var g = Graphics.FromImage(result)) {
                g.Clear(Color.Transparent);
                g.CompositingMode = CompositingMode.SourceCopy;
                g.CompositingQuality = pixelArt ? CompositingQuality.HighSpeed : CompositingQuality.HighQuality;
                g.InterpolationMode = pixelArt ? InterpolationMode.NearestNeighbor : InterpolationMode.HighQualityBicubic;
                g.SmoothingMode = pixelArt ? SmoothingMode.None : SmoothingMode.HighQuality;
                g.PixelOffsetMode = pixelArt ? PixelOffsetMode.Half : PixelOffsetMode.HighQuality;
                g.DrawImage(image, new Rectangle(0, 0, outW, outH), crop, GraphicsUnit.Pixel);
                Directory.CreateDirectory(Path.GetDirectoryName(output));
                result.Save(output, ImageFormat.Png);
            }
        }
    }
}
"@
}

[EdgeBackgroundRemover]::Process(
  (Resolve-Path -LiteralPath $InputPath).Path,
  [System.IO.Path]::GetFullPath($OutputPath),
  $MaxSize,
  $Tolerance,
  [bool]$GlobalKey,
  [bool]$PixelArt
)

Write-Output "Processed: $InputPath -> $OutputPath"
