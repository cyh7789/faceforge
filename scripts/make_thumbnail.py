"""YouTube 縮圖：開場的 VS 對峙畫面加上標題，輸出 1280x720。"""
import pathlib
import subprocess

from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
BUILD = pathlib.Path("video-assets/build")
OUT = pathlib.Path("video-assets/faceforge-thumbnail.png")

INK = (27, 15, 34)
CREAM = (255, 246, 223)
GOLD = (255, 211, 77)
PLUM = (138, 47, 95)
IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"


def main() -> None:
    frame = BUILD / "thumb_src.png"
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-ss", "1.05", "-i", str(BUILD / "intro.mp4"),
         "-frames:v", "1", str(frame)],
        check=True,
    )

    base = Image.open(frame).convert("RGB").resize((W, H), Image.LANCZOS)
    draw = ImageDraw.Draw(base, "RGBA")
    draw.rectangle([0, H - 220, W, H], fill=(27, 15, 34, 216))

    title = ImageFont.truetype(IMPACT, 76)
    sub = ImageFont.truetype(IMPACT, 38)

    def centered(text, font, y, fill, stroke=0, stroke_fill=None):
        box = draw.textbbox((0, 0), text, font=font, stroke_width=stroke)
        draw.text(((W - (box[2] - box[0])) / 2, y), text, font=font, fill=fill,
                  stroke_width=stroke, stroke_fill=stroke_fill)

    centered("BAD SKIN SCORES, RARE CARDS", title, H - 196, GOLD, 4, PLUM)
    centered("FACEFORGE  ·  YOUCAM SKIN ANALYSIS API", sub, H - 96, CREAM)

    base.save(OUT)
    print("built", OUT)


if __name__ == "__main__":
    main()
