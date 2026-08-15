"""Devpost 相簿第一張：資料流架構圖，說明本地 gate 擋在 API 之前。

用法：python3 scripts/make_architecture.py
輸出：video-assets/gallery/00-architecture.png（1920x1080）
"""
import pathlib

from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
OUT = pathlib.Path("video-assets/gallery/00-architecture.png")

INK = (27, 15, 34)
CREAM = (255, 246, 223)
GOLD = (255, 211, 77)
PINK = (216, 106, 158)
PLUM = (138, 47, 95)
DEVICE = (58, 34, 68)
SERVER = (44, 26, 54)

IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"
HELV = "/System/Library/Fonts/Helvetica.ttc"
HELV_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def box(draw, xy, title, lines, fill, border, title_font, body_font, title_fill=CREAM):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=18, fill=fill, outline=border, width=4)
    draw.text((x0 + 26, y0 + 20), title, font=title_font, fill=title_fill)
    for i, line in enumerate(lines):
        draw.text((x0 + 26, y0 + 66 + i * 34), line, font=body_font, fill=CREAM)


def arrow(draw, start, end, color=GOLD, width=5, head=16):
    draw.line([start, end], fill=color, width=width)
    x0, y0 = start
    x1, y1 = end
    if x1 == x0:  # 垂直
        direction = 1 if y1 > y0 else -1
        draw.polygon([(x1, y1), (x1 - head, y1 - head * direction), (x1 + head, y1 - head * direction)], fill=color)
    else:
        direction = 1 if x1 > x0 else -1
        draw.polygon([(x1, y1), (x1 - head * direction, y1 - head), (x1 - head * direction, y1 + head)], fill=color)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGB", (W, H), INK)
    draw = ImageDraw.Draw(canvas)

    head = ImageFont.truetype(IMPACT, 58)
    tag = ImageFont.truetype(IMPACT, 32)
    box_title = ImageFont.truetype(HELV_B, 30)
    body = ImageFont.truetype(HELV, 25)
    note = ImageFont.truetype(HELV, 26)

    draw.text((90, 74), "FACEFORGE", font=tag, fill=PINK)
    draw.text((90, 118), "HOW ONE SELFIE BECOMES A CARD", font=head, fill=GOLD,
              stroke_width=3, stroke_fill=PLUM)
    draw.line([(90, 200), (720, 200)], fill=PINK, width=6)

    # 裝置端
    draw.rounded_rectangle([80, 250, 900, 560], radius=22, fill=DEVICE, outline=PINK, width=3)
    draw.text((110, 268), "ON DEVICE", font=box_title, fill=PINK)

    box(draw, (110, 320, 460, 520), "Camera or album",
        ["Front camera, or a photo", "the player already has"], INK, PLUM, box_title, body)
    box(draw, (520, 320, 870, 520), "MediaPipe BlazeFace",
        ["Self-hosted WASM,", "zero external calls.", "No face, no API call."], INK, GOLD, box_title, body)
    arrow(draw, (462, 420), (516, 420))

    # 伺服器端
    draw.rounded_rectangle([1020, 250, 1840, 560], radius=22, fill=SERVER, outline=PINK, width=3)
    draw.text((1050, 268), "SERVER", font=box_title, fill=PINK)

    box(draw, (1050, 320, 1400, 520), "Next.js API proxy",
        ["API key never reaches", "the browser. 60s deadline,", "typed error taxonomy."], INK, PLUM, box_title, body)
    box(draw, (1450, 320, 1810, 520), "YouCam Skin Analysis",
        ["SD mode, 16 actions.", "15 raw metrics per face,", "deterministic to 14 dp."], INK, GOLD, box_title, body)
    arrow(draw, (1402, 420), (1446, 420))
    arrow(draw, (902, 420), (1016, 420))
    draw.text((908, 452), "clean shots only", font=body, fill=GOLD)

    # 引擎
    box(draw, (80, 640, 900, 900), "Game engine, on raw scores",
        ["Weakest metric  ->  class          Strongest metric  ->  talent",
         "Sum of absolute deltas  ->  rarity",
         "Six battle stats derived from the same raw values",
         "Roast names the metric that lost"], SERVER, PLUM, box_title, body)

    box(draw, (1020, 640, 1840, 900), "What the player gets",
        ["A card with class, rarity, stats and a constellation back",
         "15 classes to collect, one per metric the API scores",
         "Best-of-three duels: same phone, NPC, or a room code",
         "Same face always forges the same card"], SERVER, GOLD, box_title, body)
    arrow(draw, (1810, 530), (1810, 630))
    arrow(draw, (902, 770), (1016, 770))

    draw.text((90, 950),
              "Every constant in the engine was measured from committed API responses before the game was written.",
              font=note, fill=CREAM)
    draw.text((90, 992),
              "Those fixtures replay offline, which is how the whole build cost 90 of our 1,000 units.",
              font=note, fill=CREAM)

    canvas.save(OUT)
    print("built", OUT)


if __name__ == "__main__":
    main()
