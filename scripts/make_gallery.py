"""把手機直式截圖排成 Devpost 相簿用的 16:9 說明圖，字級大到縮圖也讀得到。

用法：python3 scripts/make_gallery.py
輸入：video-assets/screenshots/*.png
輸出：video-assets/gallery/*.png（1920x1080）
"""
import pathlib

from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
SRC = pathlib.Path("video-assets/screenshots")
OUT = pathlib.Path("video-assets/gallery")

INK = (27, 15, 34)
CREAM = (255, 246, 223)
GOLD = (255, 211, 77)
PINK = (216, 106, 158)
PLUM = (138, 47, 95)

IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"
HELV = "/System/Library/Fonts/Helvetica.ttc"

SLIDES = [
    ("01-face-gate", "THE GATE RUNS FIRST", [
        "MediaPipe BlazeFace runs locally, self-hosted WASM,",
        "with zero external calls.",
        "A photo without a clear face never leaves the device,",
        "so it never spends a YouCam API unit.",
    ]),
    ("02-card-reveal", "YOUR WORST METRIC IS YOUR CLASS", [
        "The YouCam Skin Analysis API scores 15 skin metrics.",
        "The weakest one picks the class, the strongest one",
        "becomes the talent, and all six battle stats are",
        "derived from the raw scores. Then the mirror roasts you.",
    ]),
    ("03-card-back", "THE BACK IS YOUR OWN DATA", [
        "The card back plots a constellation from the wrinkle",
        "readings of that same analysis.",
        "Same face, same stars: the API is deterministic",
        "to 14 decimal places.",
    ]),
    ("04-collection", "15 CLASSES, ONE PER METRIC", [
        "Every metric the API scores has a class behind it.",
        "Collecting them means running more analyses,",
        "which is the loop a brand campaign actually wants.",
    ]),
    ("05-battle", "STAT DUEL, BEST OF THREE", [
        "Two faces, one phone. Pick a stat and hope yours is",
        "higher. Every number on the board came out of a",
        "real API response, not a design spreadsheet.",
    ]),
    ("06-battle-result", "THE LOSER GETS ROASTED", [
        "The roast names the metric that lost the match,",
        "so the joke lands on real data.",
        "Rematch with the same cards, or forge new ones.",
    ]),
    ("07-credit-firewall", "THE CREDIT FIREWALL", [
        "A bad photo costs about 78 seconds of silent retries",
        "upstream, so we never send one.",
        "This album pick has no face: blocked on the device,",
        "zero units spent, and the mirror button stays locked.",
    ]),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    title_font = ImageFont.truetype(IMPACT, 66)
    body_font = ImageFont.truetype(HELV, 36)
    tag_font = ImageFont.truetype(IMPACT, 34)

    for name, title, lines in SLIDES:
        shot = Image.open(SRC / f"{name}.png").convert("RGB")
        scale = 980 / shot.height
        shot = shot.resize((round(shot.width * scale), 980), Image.LANCZOS)

        canvas = Image.new("RGB", (W, H), INK)
        canvas.paste(shot, (W - shot.width - 90, (H - shot.height) // 2))

        draw = ImageDraw.Draw(canvas)
        draw.text((96, 300), title, font=title_font, fill=GOLD, stroke_width=3, stroke_fill=PLUM)
        draw.line([(96, 392), (96 + 520, 392)], fill=PINK, width=6)
        for i, line in enumerate(lines):
            draw.text((96, 436 + i * 52), line, font=body_font, fill=CREAM)

        draw.text((96, 96), "FACEFORGE", font=tag_font, fill=PINK)
        draw.text((96, 140), "YouCam Skin Analysis API", font=body_font, fill=CREAM)

        canvas.save(OUT / f"{name}.png")
        print("built", OUT / f"{name}.png")


if __name__ == "__main__":
    main()
