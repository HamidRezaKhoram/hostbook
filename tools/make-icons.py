#!/usr/bin/env python3
"""Draw the app icons into public/icons/ (a cream house on terracotta). Run after changing the design."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
ACCENT, CREAM, DARK = (180, 83, 42), (250, 246, 239), (124, 52, 22)
S = 1024  # draw large, then downscale for smooth edges


def house(d: ImageDraw.ImageDraw, cx: float, cy: float, w: float) -> None:
    h = w * 0.9
    left, right, top, base = cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2
    eave = top + h * 0.42
    d.polygon([(cx, top), (right + w * 0.08, eave), (left - w * 0.08, eave)], fill=CREAM)
    d.rectangle([left + w * 0.06, eave - 1, right - w * 0.06, base], fill=CREAM)
    dw = w * 0.22
    d.rounded_rectangle([cx - dw / 2, base - h * 0.34, cx + dw / 2, base], radius=dw * 0.45, fill=ACCENT)
    win = w * 0.16
    d.ellipse([cx - win / 2, eave - h * 0.2, cx + win / 2, eave - h * 0.2 + win], fill=DARK)


def icon(size: int, maskable: bool, rounded: bool) -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable or not rounded:
        d.rectangle([0, 0, S, S], fill=ACCENT)
    else:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.22, fill=ACCENT)
    house(d, S / 2, S * 0.52, S * (0.44 if maskable else 0.56))  # maskable keeps the 80% safe zone
    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
icon(192, False, True).save(OUT / "icon-192.png")
icon(512, False, True).save(OUT / "icon-512.png")
icon(512, True, False).save(OUT / "maskable-512.png")
icon(180, False, False).convert("RGB").save(OUT / "apple-touch-icon.png")  # iOS rounds it itself
(OUT / "favicon.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    '<rect width="64" height="64" rx="14" fill="#b4532a"/>'
    '<path d="M32 13 52 30H12z" fill="#faf6ef"/><rect x="16" y="29" width="32" height="22" fill="#faf6ef"/>'
    '<rect x="28" y="38" width="8" height="13" rx="3.5" fill="#b4532a"/></svg>\n'
)
print("icons written to", OUT)
