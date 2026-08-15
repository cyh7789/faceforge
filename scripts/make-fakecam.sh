#!/bin/bash
# 產生 Chromium 假攝影機用的 y4m。錄影前先跑一次；檔案很大，不進版控。
set -eu
cd "$(dirname "$0")/.."
OUT=video-assets/fakecam
mkdir -p "$OUT"
DUR=${DUR:-40}

# 人臉來源：走相機路徑時餵這支，本地 gate 會判定 Ready 並開放快門
ffmpeg -y -v error -loop 1 -t "$DUR" -i video-assets/p1-crop.jpg \
  -filter_complex "[0:v]split[bg][fg];\
[bg]scale=-2:960,crop=540:960,gblur=sigma=26,eq=brightness=-0.07[bgb];\
[fg]scale=540:-2[fgs];\
[bgb][fgs]overlay=(W-w)/2:(H-h)/2,format=yuv420p" \
  -r 12 "$OUT/p1.y4m"

ls -la "$OUT"
