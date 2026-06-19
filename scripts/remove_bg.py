"""白(に近い)背景を透過にする。ChatGPT等で生成した白背景PNGをゲーム用の透過PNGに変換。

使い方:
  python scripts/remove_bg.py <input.png> [output.png] [threshold]
  - output 省略時は input を上書き
  - threshold 省略時 236 (この値以上のR,G,B全部=背景とみなす)

縁の白いフチ(ハロー)はアルファ収縮+わずかなぼかしで除去する。
"""
import sys
import numpy as np
from PIL import Image, ImageFilter


def remove_bg(inp: str, outp: str, thr: int = 236) -> None:
    im = Image.open(inp).convert("RGBA")
    arr = np.array(im)
    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    bg = (r >= thr) & (g >= thr) & (b >= thr)
    arr[..., 3] = np.where(bg, 0, arr[..., 3])
    im2 = Image.fromarray(arr, "RGBA")
    # 白フチを1px削り、エッジをなめらかに
    a = im2.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    im2.putalpha(a)
    im2.save(outp)
    total = arr.shape[0] * arr.shape[1]
    print(f"{inp} -> {outp}  size={im.size}  transparent={int(bg.sum())}/{total} ({bg.mean()*100:.1f}%)")


if __name__ == "__main__":
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else src
    th = int(sys.argv[3]) if len(sys.argv) > 3 else 236
    remove_bg(src, dst, th)
