#!/bin/bash
# 依 VIDEO-SCRIPT.md 的分鏡把旁白切段生成 TTS，並印出每段長度。
set -eu
cd "$(dirname "$0")/.."
OUT=video-assets/vo
mkdir -p "$OUT"
VOICE=${VOICE:-en-US-AvaMultilingualNeural}
RATE=${RATE:-+8%}

write() { printf '%s' "$2" > "$OUT/$1.txt"; }

write 01 "Two ugly faces. One winner."
write 02 "Skin analysis apps grade your face and tell you what to fix. FaceForge takes the same scores and forges a fighter out of them."
write 03 "Two players, one phone, side by side. One shoots on camera, one picks from the album. A local face detector clears each face before anything leaves the device, then the YouCam Skin Analysis API scores fifteen skin metrics."
write 04 "Your worst metric picks your class. Pores at fifty forges the Crater Warden. Droopy eyelids crown the Drooping Regent. Six battle stats come straight out of the raw scores, and the mirror has opinions about both of you."
write 06 "Fifteen classes to unlock, one for every metric the API scores. The API is deterministic to fourteen decimal places, so the same face always forges the same card. Flip it, and the back draws your own wrinkle constellation."
write 07 "Now put that face in the ring. Pick your fighter, lock it in, pass the phone. Best of three."
write 08 "Round one. Pick a stat, hope yours is higher. Round two. Round three. Loser gets roasted by the mirror. Every number on screen came out of a real API response."
write 09 "Everything here is built on measured API behavior. Point the camera at anything without a face and the shutter stays locked. Bad photos cost seventy-eight seconds of silent retries, so the gate stops them on the device and spends nothing. The flattering UI scores hide the interesting signal, so the whole engine runs on raw scores."
write 10 "Skin analysis tells you your face is flawed. FaceForge says your face is legendary."

for f in "$OUT"/*.txt; do
  id=$(basename "$f" .txt)
  edge-tts --voice "$VOICE" --rate="$RATE" --file "$f" --write-media "$OUT/$id.mp3" >/dev/null
  dur=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT/$id.mp3")
  printf '%s  %ss\n' "$id" "$dur"
done

total=$(for f in "$OUT"/*.mp3; do ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$f"; done | paste -sd+ - | bc)
echo "total ${total}s"
