# 動画・自動切り抜き環境（Whisper + ffmpeg）

音声を Whisper で文字起こしし、そのタイムスタンプを使って ffmpeg で
「言った場所」を自動的に切り出すための最小セットです。

```
動画 → [ffmpeg] 音声抽出 → [Whisper] 文字起こし＋時刻 → [ffmpeg] 切り出し → クリップ
```

## 1. インストール

```bash
cd tools/autoclip
./setup.sh          # ffmpeg + faster-whisper（推奨・軽量高速）
./setup.sh openai   # ffmpeg + 本家 openai-whisper を使いたい場合
```

## 2. 使い方

```bash
# ① 文字起こし（タイムスタンプ付きの JSON と SRT が出る）
python3 transcribe.py 素材.mp4 --lang ja --model small

# ② キーワードを含む発話だけを切り出す
python3 autoclip.py 素材.mp4 --segments 素材.segments.json --keyword ハイライト

# 時間を直接指定して切り出す
python3 autoclip.py 素材.mp4 --range 3.5-9.0 --range 12-18

# 発話区間をすべて個別クリップにする（--merge-gap 0 で連結しない）
python3 autoclip.py 素材.mp4 --segments 素材.segments.json --all --merge-gap 0
```

主なオプション

| オプション | 意味 |
| --- | --- |
| `--model` | `tiny` / `base` / `small` / `medium` / `large-v3`。大きいほど正確・低速 |
| `--lang` | `ja` `en` など。未指定なら自動判定 |
| `--pad-start` / `--pad-end` | 切り出しの前後に足す余裕（既定 0.5 秒） |
| `--merge-gap` | この秒数以内の近接クリップを 1 本に連結（既定 1.0 秒） |
| `--copy` | 再エンコードせず高速に切る（開始位置がキーフレーム単位でずれることがある） |

## 3. 動作確認

```bash
./make_test_video.sh test.mp4                    # 音声つきテスト動画を作る
python3 transcribe.py test.mp4 --lang en --model tiny
python3 autoclip.py test.mp4 --segments test.segments.json --keyword highlight
```

## 4. 文字起こしエンジンについて

`transcribe.py` は 3 つの実装に対応し、導入済みのものを自動で選びます。

| backend | 特徴 |
| --- | --- |
| `faster-whisper` | 既定。本家と同じ Whisper モデルを高速・省メモリで動かす実装 |
| `openai-whisper` | 本家実装。PyTorch が必要で重い |
| `sherpa-onnx` | 外部ネットワークが制限された環境向け。モデルは GitHub Releases から取得でき、VAD で発話区間を検出してから Whisper にかける |

`sherpa-onnx` を使う場合はモデルの場所を環境変数で渡します。

```bash
export SHERPA_WHISPER_DIR=~/models/sherpa-onnx-whisper-tiny
export SHERPA_VAD=~/models/silero_vad.onnx
python3 transcribe.py 素材.mp4 --backend sherpa-onnx --lang ja
```

モデルの入手先:
- `https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-tiny.tar.bz2`
- `https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx`

## 5. 検証済みの内容（2026-08-24）

- ffmpeg 6.1.1 / ffprobe 導入・動作確認（テスト動画生成・音声抽出・切り出し・静止画抽出）
- Whisper で 14.6 秒のテスト動画を文字起こしし、3 つの発話区間と時刻を取得
- キーワード `highlight` に一致した区間（5.19s〜9.08s）を自動で切り出し
- 切り出したクリップを再度文字起こしして内容一致を確認、
  さらに映像に焼き込んだ時刻表示（05.200 → 08.920）でカット位置を目視確認
- `--all` `--copy` `--range` の各モードも動作確認済み

補足: 検証に使った実行環境は外部ネットワークが制限されており、
`openai-whisper` / `faster-whisper` が使うモデル配布元（openaipublic.azureedge.net,
huggingface.co）に接続できませんでした（403）。そのため検証は GitHub Releases から
取得できる `sherpa-onnx` 版 Whisper（tiny）で行っています。
通常のパソコンでは `./setup.sh` → `faster-whisper` がそのまま使えます。
