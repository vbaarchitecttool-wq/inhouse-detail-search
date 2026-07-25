from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
IMAGE_PATH = ROOT / "public" / "diagrams" / "photo-79bc3a51.webp"
FONT_PATH = Path(r"C:\Windows\Fonts\NotoSansJP-VF.ttf")


def arrow(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
    color: str,
) -> None:
    draw.line([start, end], fill=color, width=5)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    length = 18
    spread = 0.55
    p1 = (
        end[0] - length * math.cos(angle - spread),
        end[1] - length * math.sin(angle - spread),
    )
    p2 = (
        end[0] - length * math.cos(angle + spread),
        end[1] - length * math.sin(angle + spread),
    )
    draw.polygon([end, p1, p2], fill=color)


def label(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    target: tuple[int, int],
    color: str,
    font: ImageFont.FreeTypeFont,
) -> None:
    x1, y1, x2, y2 = box
    start_y = y2 if target[1] > y2 else y1
    start = ((x1 + x2) // 2, start_y)
    arrow(draw, start, target, color)

    shadow = (x1 + 3, y1 + 3, x2 + 3, y2 + 3)
    draw.rounded_rectangle(shadow, radius=9, fill=(0, 0, 0, 135))
    draw.rounded_rectangle(
        box,
        radius=9,
        fill=(17, 24, 39, 232),
        outline=color,
        width=4,
    )
    text_box = draw.textbbox((0, 0), text, font=font)
    text_w = text_box[2] - text_box[0]
    text_h = text_box[3] - text_box[1]
    draw.text(
        ((x1 + x2 - text_w) / 2, (y1 + y2 - text_h) / 2 - 2),
        text,
        font=font,
        fill="white",
        stroke_width=1,
        stroke_fill=(0, 0, 0, 200),
    )


def main() -> None:
    image = Image.open(IMAGE_PATH).convert("RGBA").resize((960, 640))
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    font = ImageFont.truetype(str(FONT_PATH), 20)

    # Pile and ground-improvement work.
    label(draw, (18, 16, 232, 64), "既製コンクリート杭", (145, 345), "#60A5FA", font)
    label(draw, (18, 78, 152, 126), "鋼杭", (285, 350), "#F59E0B", font)
    label(draw, (300, 16, 574, 64), "場所打ちコンクリート杭", (515, 335), "#A78BFA", font)
    label(draw, (700, 16, 870, 64), "地盤改良", (700, 385), "#34D399", font)

    # Foundation-bed work shown in the foreground.
    label(draw, (300, 574, 462, 622), "砂利地業", (505, 500), "#38BDF8", font)
    label(draw, (492, 574, 634, 622), "砂地業", (650, 500), "#FBBF24", font)
    label(draw, (666, 574, 942, 622), "捨てコンクリート地業", (820, 500), "#F87171", font)

    result = Image.alpha_composite(image, overlay).convert("RGB")
    result.save(IMAGE_PATH, "WEBP", quality=86, method=6)


if __name__ == "__main__":
    main()
