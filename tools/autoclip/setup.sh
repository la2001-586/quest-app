#!/usr/bin/env bash
# 動画・自動切り抜き環境のインストール（ffmpeg + Whisper）
#   ./setup.sh            … faster-whisper（推奨・軽量高速）を入れる
#   ./setup.sh openai     … 本家 openai-whisper を入れる
set -euo pipefail
FLAVOR="${1:-faster}"

echo "== 1/2 ffmpeg =="
if command -v ffmpeg >/dev/null; then
  echo "ffmpeg は導入済み: $(ffmpeg -version | head -1)"
elif command -v brew >/dev/null; then
  brew install ffmpeg
elif command -v apt-get >/dev/null; then
  sudo apt-get update && sudo apt-get install -y ffmpeg
elif command -v winget >/dev/null; then
  winget install --id Gyan.FFmpeg -e
else
  echo "自動導入できませんでした。https://ffmpeg.org/download.html から入れてください。" >&2
  exit 1
fi

echo "== 2/2 Whisper =="
PY="$(command -v python3 || command -v python)"
[ -n "$PY" ] || { echo "Python 3 が必要です。" >&2; exit 1; }
if [ "$FLAVOR" = "openai" ]; then
  "$PY" -m pip install --upgrade openai-whisper
else
  "$PY" -m pip install --upgrade faster-whisper
fi

echo "== 確認 =="
ffmpeg -version | head -1
ffprobe -version | head -1
"$PY" - <<'PYEOF'
import importlib
for m in ("faster_whisper", "whisper", "sherpa_onnx"):
    try:
        importlib.import_module(m)
        print(f"{m}: OK")
    except ImportError:
        print(f"{m}: 未導入")
PYEOF
echo "完了。次: ./make_test_video.sh test.mp4 && python3 transcribe.py test.mp4 --lang en --model tiny"
