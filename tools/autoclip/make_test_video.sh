#!/usr/bin/env bash
# 動作確認用の短いテスト動画を作る（音声つき・画面に経過時間を表示）。
#   ./make_test_video.sh [出力パス] [音声ファイル]
# 音声ファイルを渡さない場合は espeak-ng で読み上げ音声を合成する。
set -euo pipefail

OUT="${1:-test_video.mp4}"
VOICE="${2:-}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

command -v ffmpeg >/dev/null || { echo "ffmpeg が必要です。setup.sh を実行してください。" >&2; exit 1; }

if [ -n "$VOICE" ]; then
  ffmpeg -y -loglevel error -i "$VOICE" -ar 16000 -ac 1 "$WORK/audio.wav"
elif command -v espeak-ng >/dev/null; then
  espeak-ng -v en-us -s 130 -w "$WORK/speech.wav" \
    "Welcome to the demo. Now here comes the highlight moment. Thanks for watching."
  ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=16000:cl=mono -t 2 "$WORK/sil.wav"
  printf "file '%s'\nfile '%s'\nfile '%s'\n" "$WORK/sil.wav" "$WORK/speech.wav" "$WORK/sil.wav" > "$WORK/list.txt"
  ffmpeg -y -loglevel error -f concat -safe 0 -i "$WORK/list.txt" -ar 16000 -ac 1 "$WORK/audio.wav"
else
  echo "音声ファイルも espeak-ng も無いので、無音ではなくトーン音で作ります。" >&2
  ffmpeg -y -loglevel error -f lavfi -i "sine=frequency=440:duration=12" -ar 16000 -ac 1 "$WORK/audio.wav"
fi

ffmpeg -y -loglevel error -f lavfi -i "testsrc2=size=640x360:rate=25" -i "$WORK/audio.wav" \
  -vf "drawtext=text='%{pts\\:hms}':fontsize=42:fontcolor=white:box=1:boxcolor=black@0.6:x=20:y=20" \
  -shortest -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac "$OUT"

echo "作成しました: $OUT"
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT" | awk '{printf "長さ: %.2f 秒\n", $1}'
