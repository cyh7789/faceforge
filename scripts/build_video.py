"""把 Playwright 錄的 webm 依 marks.json 切段，對齊 TTS 旁白，套街機側欄，輸出成品。

用法：python3 scripts/build_video.py
輸入：video-assets/raw/*.webm、video-assets/raw/marks.json、video-assets/vo/*.mp3、video-assets/build/intro.mp4
輸出：video-assets/faceforge-demo.mp4
"""
import json
import pathlib
import subprocess

from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1920, 1080, 30
RAW = pathlib.Path("video-assets/raw")
RAW_GATE = pathlib.Path("video-assets/raw-gate")
VO = pathlib.Path("video-assets/vo")
BUILD = pathlib.Path("video-assets/build")
PHONE_H = 1000
PHONE_W = 462

INK = (27, 15, 34)
CREAM = (255, 246, 223)
GOLD = (255, 211, 77)
PINK = (216, 106, 158)
PLUM = (138, 47, 95)

IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"
HELV = "/System/Library/Fonts/Helvetica.ttc"

# 每個旁白段對應：影片起點 mark、側欄左標題、側欄右資訊行
SEGMENTS = [
    ("02", "home", "COLLECTION", ["15 classes", "0 unlocked", "Face is the controller"]),
    ("03", "SPLIT", "SCANNING", ["P1 and P2 at once", "Local gate first", "Then 15 metrics"], 0.0, None),
    ("04", "SPLIT", "CARDS FORGED", ["Worst metric = class", "Best metric = talent", "Raw scores only"], 12.0, None),
    ("06", "collection", "ALBUM", ["Wrinkle constellation", "Drawn from your scan", "Card back art"]),
    ("07", "battle", "READY", ["Best of three", "Stat duel", "Same device 2P"]),
    ("08", "rounds", "FIGHT", ["Six stats per card", "All from raw scores", "Loser gets roasted"], 0.0, 0.80),
    ("09", "camera_blocked", "CREDIT FIREWALL", ["78s wasted per bad photo", "Checked on device", "Zero units spent"], 0.0, None),
    ("10", "outro", "FACEFORGE", ["Your face is legendary", "youcam skin analysis api", ""]),
]


def vo_text(vo_id: str) -> str:
    return (VO / f"{vo_id}.txt").read_text().strip()


def duration(path: pathlib.Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def split_caption_lines(text: str, limit: int = 52) -> list[str]:
    """把旁白切成字幕行：先斷句，過長的句子再依寬度折行。"""
    import re

    chunks: list[str] = []
    for sentence in re.split(r"(?<=[.!?:]) +", text.strip()):
        words = sentence.split()
        line = ""
        for word in words:
            candidate = f"{line} {word}".strip()
            if len(candidate) > limit and line:
                chunks.append(line)
                line = word
            else:
                line = candidate
        if line:
            chunks.append(line)
    return chunks


def caption_layer(name: str, index: int, line: str) -> pathlib.Path:
    """單行字幕圖層：畫面下緣的深色條 + 白字。"""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font = ImageFont.truetype(HELV, 40)
    box = draw.textbbox((0, 0), line, font=font)
    text_w, text_h = box[2] - box[0], box[3] - box[1]
    pad_x, pad_y = 34, 20
    band_w, band_h = text_w + pad_x * 2, text_h + pad_y * 2
    x0, y0 = (W - band_w) / 2, H - band_h - 54
    draw.rounded_rectangle([x0, y0, x0 + band_w, y0 + band_h], radius=16, fill=(16, 8, 20, 214))
    draw.text((x0 + pad_x, y0 + pad_y - box[1]), line, font=font, fill=CREAM)
    path = BUILD / f"cap_{name}_{index:02d}.png"
    layer.save(path)
    return path


def sidebar(name: str, title: str, lines: list[str], split: bool = False) -> pathlib.Path:
    """生成 1920x1080 的側欄疊層（中間手機區留透明）。"""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    title_font = ImageFont.truetype(IMPACT, 58)
    line_font = ImageFont.truetype(HELV, 30)
    tag_font = ImageFont.truetype(IMPACT, 34)

    draw.text((90, 300), title, font=title_font, fill=GOLD, stroke_width=3, stroke_fill=PLUM)
    draw.line([(90, 380), (470, 380)], fill=PINK, width=6)
    for i, line in enumerate(lines):
        if line:
            draw.text((90, 420 + i * 46), line, font=line_font, fill=CREAM)

    draw.text((W - 400, 300), "FACEFORGE", font=tag_font, fill=PINK)
    draw.line([(W - 400, 350), (W - 90, 350)], fill=GOLD, width=4)
    draw.text((W - 400, 372), "YouCam Skin Analysis API", font=line_font, fill=CREAM)
    draw.text((W - 400, 414), "Live demo, real responses", font=line_font, fill=CREAM)

    if split:
        # 兩支手機畫面在中央接合，蓋一條分隔帶並標 P1 / P2
        draw.rectangle([W // 2 - 13, 0, W // 2 + 13, H], fill=(27, 15, 34, 255))
        vs_font = ImageFont.truetype(IMPACT, 44)
        tag = ImageFont.truetype(IMPACT, 40)
        box = draw.textbbox((0, 0), "VS", font=vs_font, stroke_width=3)
        draw.text((W / 2 - (box[2] - box[0]) / 2, H / 2 - 30), "VS", font=vs_font,
                  fill=GOLD, stroke_width=3, stroke_fill=PLUM)
        draw.text((W // 2 - 420, 26), "P1", font=tag, fill=PINK)
        draw.text((W // 2 + 380, 26), "P2", font=tag, fill=PINK)

    path = BUILD / f"side_{name}.png"
    layer.save(path)
    return path


def main() -> None:
    BUILD.mkdir(parents=True, exist_ok=True)
    source = next(RAW.glob("*.webm"))
    marks = {m["label"]: m["at"] for m in json.loads((RAW / "marks.json").read_text())}
    gate_source = next(RAW_GATE.glob("*.webm"))
    gate_marks = {m["label"]: m["at"] for m in json.loads((RAW_GATE / "marks.json").read_text())}


    # 分割畫面段：左 = player 1 抽卡流程，右 = player 2，兩邊同時跑
    split_len = min(marks["draw2"] - marks["draw1"], marks["collection"] - marks["draw2"])
    order = [("draw1" if s[1] == "SPLIT" else s[1]) for s in SEGMENTS] + ["end"]
    order = [("outro" if o == "camera_blocked" else o) for o in order]
    parts = []
    for index, spec in enumerate(SEGMENTS):
        vo_id, mark_name, title, lines = spec[:4]
        offset = spec[4] if len(spec) > 4 else 0.0
        crop = spec[5] if len(spec) > 5 else None
        vo_path = VO / f"{vo_id}.mp3"
        want = duration(vo_path) + 0.45
        is_gate = mark_name in gate_marks
        is_split = mark_name == "SPLIT"
        if is_split:
            start = marks["draw1"] + offset
            nxt_spec = SEGMENTS[index + 1] if index + 1 < len(SEGMENTS) else None
            nxt_is_split = bool(nxt_spec) and nxt_spec[1] == "SPLIT"
            end_at = nxt_spec[4] if nxt_is_split else split_len
            avail = end_at - offset
        elif is_gate:
            start = gate_marks[mark_name] + offset
            avail = gate_marks["end"] - start
        else:
            start = marks[mark_name] + offset
            nxt = order[index + 1]
            avail = marks[nxt] - start
        speed = min(max(avail / want, 0.85), 2.0)
        take = min(want * speed, avail)
        # 畫面短於旁白時停格補足，避免 -shortest 砍掉旁白尾巴
        pad = max(0.0, want - take / speed)

        side = sidebar(vo_id, title, lines, split=is_split)
        caption_lines = split_caption_lines(vo_text(vo_id))
        total_chars = sum(len(line) for line in caption_lines) or 1
        vo_len = duration(vo_path)
        captions = []
        cursor = 0.0
        for i, line in enumerate(caption_lines):
            span = vo_len * len(line) / total_chars
            captions.append((caption_layer(vo_id, i, line), cursor, cursor + span))
            cursor += span
        out = BUILD / f"seg_{vo_id}.mp4"
        crop_filter = f"crop=iw:ih*{crop}:0:0," if crop else ""
        common = f"setpts=PTS/{speed:.4f}"
        if pad > 0.05:
            common += f",tpad=stop_mode=clone:stop_duration={pad:.2f}"
        if is_split:
            right_start = marks["draw2"] + offset
            chain = (
                f"[0:v]scale={PHONE_W}:{PHONE_H},{common},format=yuv420p[l];"
                f"[1:v]scale={PHONE_W}:{PHONE_H},{common},format=yuv420p[r];"
                f"[l][r]hstack=inputs=2[st];[st]pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0x1b0f22[base];"
                f"[base][2:v]overlay=0:0:format=auto[v]"
            )
            inputs = [
                "-ss", f"{start:.2f}", "-t", f"{take:.2f}", "-i", str(source),
                "-ss", f"{right_start:.2f}", "-t", f"{take:.2f}", "-i", str(source),
                "-i", str(side), "-i", str(vo_path),
            ]
            audio_map = "3:a"
            next_input = 4
        else:
            chain = (
                f"[0:v]{crop_filter}scale=-2:{PHONE_H},{common},"
                f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0x1b0f22[base];"
                f"[base][1:v]overlay=0:0[v]"
            )
            clip = gate_source if is_gate else source
            inputs = [
                "-ss", f"{start:.2f}", "-t", f"{take:.2f}", "-i", str(clip),
                "-i", str(side), "-i", str(vo_path),
            ]
            audio_map = "2:a"
            next_input = 3

        label = "v"
        for i, (cap_path, cap_start, cap_end) in enumerate(captions):
            inputs += ["-i", str(cap_path)]
            nxt = f"c{i}"
            chain += (
                f";[{label}][{next_input + i}:v]"
                f"overlay=0:0:enable='between(t,{cap_start:.2f},{cap_end:.2f})':format=auto[{nxt}]"
            )
            label = nxt

        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", *inputs,
             "-filter_complex", chain,
             "-map", f"[{label}]", "-map", audio_map,
             "-shortest", "-r", str(FPS), "-c:v", "libx264", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "192k", str(out)],
            check=True,
        )
        parts.append(out)
        print(f"seg {vo_id}: start={start:.1f}s avail={avail:.1f}s vo={want:.1f}s speed={speed:.2f}")

    # intro 補一段旁白 01 並補齊長度
    intro_vo = VO / "01.mp3"
    intro_out = BUILD / "seg_01.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(BUILD / "intro.mp4"), "-i", str(intro_vo),
         "-filter_complex", "[0:v]tpad=stop_mode=clone:stop_duration=1.0[v]",
         "-map", "[v]", "-map", "1:a", "-shortest",
         "-r", str(FPS), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
         str(intro_out)],
        check=True,
    )

    # 給 YouTube 用的 SRT：段落順序與各段實際長度算出時間軸
    srt_lines = []
    clock = 0.0
    index = 1

    def stamp(value: float) -> str:
        ms = int(round(value * 1000))
        h, ms = divmod(ms, 3_600_000)
        m, ms = divmod(ms, 60_000)
        sec, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

    for part in [intro_out] + parts:
        vo_id = part.stem.split("_")[1]
        part_len = duration(part)
        lines = split_caption_lines(vo_text(vo_id))
        total = sum(len(line) for line in lines) or 1
        cursor = clock
        for line in lines:
            span = duration(VO / f"{vo_id}.mp3") * len(line) / total
            srt_lines.append(f"{index}\n{stamp(cursor)} --> {stamp(cursor + span)}\n{line}\n")
            cursor += span
            index += 1
        clock += part_len
    pathlib.Path("video-assets/faceforge-demo.srt").write_text("\n".join(srt_lines))

    listing = BUILD / "concat.txt"
    listing.write_text("".join(f"file '{p.resolve()}'\n" for p in [intro_out] + parts))
    final = pathlib.Path("video-assets/faceforge-demo.mp4")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(listing),
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(FPS),
         "-c:a", "aac", "-b:a", "192k", str(final)],
        check=True,
    )
    print("final", final, f"{duration(final):.1f}s")


if __name__ == "__main__":
    main()
