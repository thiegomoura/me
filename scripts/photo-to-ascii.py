#!/usr/bin/env python3
"""Convert a photo to ASCII art for the thiego.dev portfolio.

Reads an image path from argv[1] and writes an ASCII string to argv[2]
(default: src/data/ascii-portrait.txt). Width defaults to 100 chars.
"""

import sys
from PIL import Image, ImageOps

# Enable HEIC/HEIF support when pillow-heif is installed.
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

CHARS = "@#MW%8B*+ohkbd=_:~^i!lI?. "  # 20 levels, all HTML-safe (dark -> light)

def to_ascii(image_path: str, target_width: int = 100) -> str:
    img = Image.open(image_path)
    # Flatten transparency onto white so portrait reads correctly (dark on light).
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        bg = Image.new("RGB", rgba.size, (255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[3])
        img = bg
    img = img.convert("L")
    img = ImageOps.autocontrast(img, cutoff=2)

    w, h = img.size
    # Terminal chars are ~2x taller than wide; scale height to compensate.
    aspect = 0.5
    new_h = max(1, int(h * (target_width / w) * aspect))
    img = img.resize((target_width, new_h))

    pixels = img.load()
    n = len(CHARS)
    out_lines = []
    for y in range(new_h):
        row = []
        for x in range(target_width):
            p = pixels[x, y]
            idx = min(n - 1, int(p / 256 * n))
            row.append(CHARS[idx])
        out_lines.append("".join(row))
    return "\n".join(out_lines)

if __name__ == "__main__":
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else "src/data/ascii-portrait.txt"
    width = int(sys.argv[3]) if len(sys.argv) > 3 else 100

    art = to_ascii(src, width)

    with open(dst, "w") as f:
        f.write(art)

    rows = art.count("\n") + 1
    print(f"Wrote {len(art)} chars ({width} cols x {rows} rows) to {dst}")
    print("--- preview ---")
    print(art)
