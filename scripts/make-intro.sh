#!/bin/bash
# 街機格鬥風開場卡：兩張臉左右對峙 + VS 撞擊，輸出 1920x1080。
set -eu
cd "$(dirname "$0")/.."
OUT=video-assets/build
mkdir -p "$OUT"
FONT=${FONT:-/System/Library/Fonts/Supplemental/Impact.ttf}
DUR=${DUR:-3.0}

ffmpeg -y -v error \
  -loop 1 -t "$DUR" -i video-assets/p1-crop.jpg \
  -loop 1 -t "$DUR" -i video-assets/p2-crop.jpg \
  -f lavfi -t "$DUR" -i color=c=0x1b0f22:s=1920x1080 \
  -filter_complex "\
[0:v]scale=760:-1,crop=760:1080,eq=saturation=1.15[l];\
[1:v]scale=760:-1,crop=760:1080,eq=saturation=1.15[r];\
[2:v][l]overlay=x='-760+min(t/0.5\,1)*760':y=0[bg1];\
[bg1][r]overlay=x='1920-min(t/0.5\,1)*760':y=0[bg2];\
[bg2]drawbox=x=0:y=470:w=1920:h=150:color=0x1b0f22@0.72:t=fill[bg3];\
[bg3]drawtext=fontfile=${FONT}:text='VS':fontcolor=0xffd34d:fontsize='if(lt(t,0.75),260-(0.75-t)*220,260)':x=(w-text_w)/2:y=(h-text_h)/2-20:borderw=8:bordercolor=0x8a2f5f[bg4];\
[bg4]drawtext=fontfile=${FONT}:text='FACEFORGE':fontcolor=0xfff6df:fontsize=64:x=(w-text_w)/2:y=h-140:alpha='min(max(t-1.2\,0)/0.6\,1)'[v]" \
  -map "[v]" -c:v libx264 -pix_fmt yuv420p -r 30 "$OUT/intro.mp4"

ffprobe -v error -show_entries format=duration -of default=nw=1 "$OUT/intro.mp4"
echo "built $OUT/intro.mp4"
