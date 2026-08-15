#!/bin/bash
# 產生 Chromium 假攝影機用的 y4m。錄影前先跑一次；檔案很大，不進版控。
set -eu
cd "$(dirname "$0")/.."
OUT=video-assets/fakecam
mkdir -p "$OUT"
DUR=${DUR:-40}

# 人臉來源：走相機路徑時餵這支，本地 gate 會判定 Ready 並開放快門
ffmpeg -y -v error -loop 1 -t "$DUR" -i video-assets/p1-crop.jpg \
  -vf "scale=540:-2,pad=540:960:(ow-iw)/2:(oh-ih)/2:color=0x2a1a33,format=yuv420p" \
  -r 12 "$OUT/p1.y4m"

ls -la "$OUT"
