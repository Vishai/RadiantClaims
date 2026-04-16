#!/usr/bin/env python3
"""
Apply serif text overlays to Campaign A base images.

Matches the RadiantClaims Facebook cover aesthetic: cream-colored
display serif in the bottom third, with a subtle dark gradient
behind it for legibility against warm photography.

Output: 2 variants per ad — Playfair Display Medium vs Cormorant
Garamond SemiBold — so we can A/B the typographic feel without
regenerating imagery.
"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(
    "/Users/brandonarmstrong/Developer/RadiantClaims/public/brand/ads/campaign-a"
)
USER_FONTS = Path("/Users/brandonarmstrong/Library/Fonts")

FONT_PLAYFAIR_MEDIUM = USER_FONTS / "PlayfairDisplay-Medium.ttf"
FONT_CORMORANT_SEMIBOLD = USER_FONTS / "CormorantGaramond-SemiBold.ttf"

# Brand cream — matches the Facebook cover's tagline tone, slightly
# warmer than pure white.
CREAM = (245, 234, 213, 255)

ADS = [
    {
        "base": "ad1-hands-v1.png",
        "slug": "ad1",
        "text": (
            "If your family lived through above-ground nuclear testing, "
            "the federal government may owe you up to $100,000."
        ),
    },
    {
        "base": "ad2-map-v2.png",
        "slug": "ad2",
        "text": (
            "The 2027 deadline is approaching. "
            "Families across the Southwest may qualify."
        ),
    },
    {
        "base": "ad3-notebook-v2.png",
        "slug": "ad3",
        # Hard break between the two thoughts to avoid an orphaned word.
        "text": (
            "The 2-minute RECA eligibility check.\n"
            "Plain English. No cost."
        ),
    },
    {
        "base": "ad4-karen-v1.png",
        "slug": "ad4",
        # Break at the natural pause after the question mark.
        "text": "Filing for a parent?\nWe'll walk you through it.",
    },
]


def wrap_text_to_width(
    text: str, font: ImageFont.FreeTypeFont, max_width: int
) -> list[str]:
    """
    Greedy word-wrap so each line fits within max_width pixels.
    Respects explicit \\n as hard breaks — useful when we want to
    control phrasing rhythm (avoid orphans, break at natural pauses).
    """
    out: list[str] = []
    for segment in text.split("\n"):
        words = segment.split()
        current: list[str] = []
        for word in words:
            candidate = " ".join(current + [word])
            bbox = font.getbbox(candidate)
            width = bbox[2] - bbox[0]
            if width <= max_width:
                current.append(word)
            else:
                if current:
                    out.append(" ".join(current))
                current = [word]
        if current:
            out.append(" ".join(current))
    return out


def add_bottom_gradient(
    img: Image.Image, height_frac: float = 0.42, max_alpha: int = 140
) -> Image.Image:
    """
    Composite a soft black gradient over the bottom of the image,
    fading from fully transparent at the top of the gradient band
    to max_alpha at the very bottom.
    """
    w, h = img.size
    grad_h = int(h * height_frac)
    gradient = Image.new("RGBA", (w, grad_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(gradient)
    for y in range(grad_h):
        t = y / max(grad_h - 1, 1)
        alpha = int(max_alpha * (t**1.7))
        draw.rectangle([(0, y), (w, y + 1)], fill=(0, 0, 0, alpha))
    out = img.copy()
    out.paste(gradient, (0, h - grad_h), gradient)
    return out


def draw_text_with_shadow(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    shadow_offset: tuple[int, int] = (0, 2),
    shadow_fill: tuple[int, int, int, int] = (0, 0, 0, 160),
) -> None:
    """Paint a soft drop-shadow behind the text, then the text itself."""
    sx, sy = shadow_offset
    draw.text((xy[0] + sx, xy[1] + sy), text, font=font, fill=shadow_fill)
    draw.text(xy, text, font=font, fill=fill)


def render_overlay(
    base_path: Path,
    text: str,
    font_path: Path,
    out_path: Path,
) -> tuple[int, int]:
    img = Image.open(base_path).convert("RGBA")
    w, h = img.size

    # Gradient band for legibility.
    img = add_bottom_gradient(img, height_frac=0.42, max_alpha=140)

    # Font size scaled to image height — ~3.6% gives ~46px at 1280px
    # tall, which reads comfortably on mobile feed.
    font_size = max(int(h * 0.036), 28)
    font = ImageFont.truetype(str(font_path), font_size)

    # Wrap to 84% of width so we always have side margin.
    max_text_width = int(w * 0.84)
    lines = wrap_text_to_width(text, font, max_text_width)

    line_spacing = int(font_size * 1.35)
    total_text_height = line_spacing * len(lines)

    bottom_margin = int(h * 0.08)
    start_y = h - bottom_margin - total_text_height

    draw = ImageDraw.Draw(img)
    for i, line in enumerate(lines):
        bbox = font.getbbox(line)
        line_w = bbox[2] - bbox[0]
        x = (w - line_w) // 2
        y = start_y + i * line_spacing
        draw_text_with_shadow(draw, (x, y), line, font=font, fill=CREAM)

    img.convert("RGB").save(out_path, "PNG", optimize=True)
    return w, h


def main() -> None:
    assert BASE_DIR.exists(), f"Missing {BASE_DIR}"
    assert FONT_PLAYFAIR_MEDIUM.exists(), f"Missing {FONT_PLAYFAIR_MEDIUM}"
    assert FONT_CORMORANT_SEMIBOLD.exists(), f"Missing {FONT_CORMORANT_SEMIBOLD}"

    for ad in ADS:
        base = BASE_DIR / ad["base"]
        slug = ad["slug"]
        text = ad["text"]

        out_playfair = BASE_DIR / f"{slug}-overlay-v1-playfair.png"
        out_cormorant = BASE_DIR / f"{slug}-overlay-v2-cormorant.png"

        w, h = render_overlay(base, text, FONT_PLAYFAIR_MEDIUM, out_playfair)
        render_overlay(base, text, FONT_CORMORANT_SEMIBOLD, out_cormorant)

        print(f"  {slug}: {w}x{h}")
        print(f"    -> {out_playfair.name}")
        print(f"    -> {out_cormorant.name}")


if __name__ == "__main__":
    main()
