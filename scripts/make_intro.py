"""街機格鬥風開場卡：兩張臉滑入對峙 + VS 撞擊，輸出 1920x1080 幀序列。"""
import math
import pathlib
import subprocess

from PIL import Image, ImageDraw, ImageFont

W, H, FPS, DUR = 1920, 1080, 30, 3.0
OUT = pathlib.Path("video-assets/build")
FRAMES = OUT / "intro_frames"
INK = (27, 15, 34)
GOLD = (255, 211, 77)
PLUM = (138, 47, 95)
CREAM = (255, 246, 223)

IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"
HELV = "/System/Library/Fonts/Helvetica.ttc"


def load(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def centered(draw: ImageDraw.ImageDraw, text: str, font, y: int, fill, stroke=0, stroke_fill=None, cx=W // 2):
    box = draw.textbbox((0, 0), text, font=font, stroke_width=stroke)
    draw.text(
        (cx - (box[2] - box[0]) / 2, y),
        text,
        font=font,
        fill=fill,
        stroke_width=stroke,
        stroke_fill=stroke_fill,
    )


def portrait(path: str) -> Image.Image:
    img = Image.open(path).convert("RGB")
    scale = max(760 / img.width, H / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (img.width - 760) // 2
    top = (img.height - H) // 2
    return img.crop((left, top, left + 760, top + H))


def main() -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    for old in FRAMES.glob("*.png"):
        old.unlink()

    left_face = portrait("video-assets/p1-crop.jpg")
    right_face = portrait("video-assets/p2-crop.jpg")
    vs_font = load(IMPACT, 300)
    title_font = load(IMPACT, 72)
    tag_font = load(HELV, 34)

    total = int(FPS * DUR)
    for i in range(total):
        t = i / FPS
        frame = Image.new("RGB", (W, H), INK)
        slide = min(t / 0.45, 1.0)
        ease = 1 - (1 - slide) ** 3
        frame.paste(left_face, (round(-760 + ease * 760), 0))
        frame.paste(right_face, (round(W - ease * 760), 0))

        draw = ImageDraw.Draw(frame, "RGBA")

        if t >= 0.4:
            punch = min((t - 0.4) / 0.22, 1.0)
            size = round(300 * (1.9 - 0.9 * punch)) if punch < 1 else 300
            f = load(IMPACT, size)
            box = draw.textbbox((0, 0), "VS", font=f, stroke_width=10)
            draw.text(
                (W / 2 - (box[2] - box[0]) / 2, H / 2 - (box[3] - box[1]) / 2 - 40),
                "VS",
                font=f,
                fill=GOLD,
                stroke_width=10,
                stroke_fill=PLUM,
            )

        if t >= 1.3:
            centered(draw, "FACEFORGE", title_font, H - 190, CREAM, 4, PLUM)
            centered(draw, "YOUR FACE. YOUR FATE.", tag_font, H - 105, GOLD)

        if t >= 0.4:
            shake = max(0.0, 1 - (t - 0.4) / 0.3)
            if shake > 0:
                dx = round(math.sin(t * 90) * 12 * shake)
                shifted = Image.new("RGB", (W, H), INK)
                shifted.paste(frame, (dx, 0))
                frame = shifted

        frame.save(FRAMES / f"{i:04d}.png")

    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error",
            "-framerate", str(FPS),
            "-i", str(FRAMES / "%04d.png"),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            str(OUT / "intro.mp4"),
        ],
        check=True,
    )
    print("built", OUT / "intro.mp4")


if __name__ == "__main__":
    main()
