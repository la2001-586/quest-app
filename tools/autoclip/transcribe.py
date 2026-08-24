#!/usr/bin/env python3
"""動画/音声を Whisper で文字起こしし、タイムスタンプ付き JSON と SRT を出力する。

使い方:
    python3 transcribe.py input.mp4 --lang ja --model small
    python3 transcribe.py input.mp4 --backend sherpa-onnx   # ネット制限環境向け

出力: <出力先>/<名前>.segments.json  … [{"start":秒, "end":秒, "text":"…"}]
      <出力先>/<名前>.srt
"""
import argparse, json, os, shutil, subprocess, sys, tempfile, wave
from pathlib import Path


def die(msg, code=1):
    print(f"[transcribe] エラー: {msg}", file=sys.stderr)
    sys.exit(code)


def extract_audio(src: Path, dst: Path) -> Path:
    """ffmpeg で 16kHz モノラル WAV を取り出す（Whisper が期待する形式）。"""
    if not shutil.which("ffmpeg"):
        die("ffmpeg が見つかりません。setup.sh を実行してください。")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
           "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(dst)]
    if subprocess.run(cmd).returncode != 0:
        die(f"音声の抽出に失敗しました: {src}")
    return dst


def pick_backend(name: str) -> str:
    if name != "auto":
        return name
    for mod, backend in (("faster_whisper", "faster-whisper"),
                         ("whisper", "openai-whisper"),
                         ("sherpa_onnx", "sherpa-onnx")):
        try:
            __import__(mod)
            return backend
        except ImportError:
            continue
    die("Whisper が見つかりません。setup.sh を実行してください。")


def run_faster_whisper(wav, model, lang):
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="auto", compute_type="int8")
    segments, _ = m.transcribe(str(wav), language=lang, vad_filter=True)
    return [{"start": s.start, "end": s.end, "text": s.text.strip()} for s in segments]


def run_openai_whisper(wav, model, lang):
    import whisper
    m = whisper.load_model(model)
    r = m.transcribe(str(wav), language=lang, verbose=False)
    return [{"start": s["start"], "end": s["end"], "text": s["text"].strip()}
            for s in r["segments"]]


def run_sherpa_onnx(wav, lang):
    """VAD で発話区間を切り出し、区間ごとに Whisper を回してタイムスタンプを得る。

    モデルの場所は環境変数で指定する:
      SHERPA_WHISPER_DIR … tiny-encoder.onnx などが入ったディレクトリ
      SHERPA_VAD         … silero_vad.onnx のパス
    """
    import numpy as np, sherpa_onnx
    mdir = Path(os.environ.get("SHERPA_WHISPER_DIR", ""))
    vad_path = os.environ.get("SHERPA_VAD", "")
    if not mdir.is_dir() or not Path(vad_path).is_file():
        die("SHERPA_WHISPER_DIR と SHERPA_VAD を設定してください。")
    prefix = next((p.name[:-len("-encoder.onnx")] for p in mdir.glob("*-encoder.onnx")), None)
    if prefix is None:
        die(f"{mdir} に *-encoder.onnx がありません。")

    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(mdir / f"{prefix}-encoder.onnx"),
        decoder=str(mdir / f"{prefix}-decoder.onnx"),
        tokens=str(mdir / f"{prefix}-tokens.txt"),
        language=lang or "en", task="transcribe", num_threads=os.cpu_count() or 4)

    vcfg = sherpa_onnx.VadModelConfig()
    vcfg.silero_vad.model = vad_path
    vcfg.silero_vad.min_silence_duration = 0.35
    vcfg.silero_vad.min_speech_duration = 0.20
    vcfg.sample_rate = 16000
    vad = sherpa_onnx.VoiceActivityDetector(vcfg, buffer_size_in_seconds=100)

    with wave.open(str(wav)) as w:
        audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0

    segments, window = [], 512
    for i in range(0, len(audio), window):
        vad.accept_waveform(audio[i:i + window])
        while not vad.empty():
            segments.append((vad.front.start, np.array(vad.front.samples, dtype=np.float32)))
            vad.pop()
    vad.flush()
    while not vad.empty():
        segments.append((vad.front.start, np.array(vad.front.samples, dtype=np.float32)))
        vad.pop()

    out = []
    for start_sample, samples in segments:
        s = rec.create_stream()
        s.accept_waveform(16000, samples)
        rec.decode_stream(s)
        text = s.result.text.strip()
        if text:
            out.append({"start": start_sample / 16000,
                        "end": (start_sample + len(samples)) / 16000,
                        "text": text})
    return out


def to_srt(segs):
    def ts(t):
        h, rem = divmod(max(t, 0), 3600)
        m, s = divmod(rem, 60)
        return "%02d:%02d:%02d,%03d" % (h, m, int(s), round((s - int(s)) * 1000))
    return "".join(f"{i}\n{ts(s['start'])} --> {ts(s['end'])}\n{s['text']}\n\n"
                   for i, s in enumerate(segs, 1))


def main():
    ap = argparse.ArgumentParser(description="Whisper で文字起こし（タイムスタンプ付き）")
    ap.add_argument("input")
    ap.add_argument("--backend", default="auto",
                    choices=["auto", "faster-whisper", "openai-whisper", "sherpa-onnx"])
    ap.add_argument("--model", default="small", help="tiny / base / small / medium / large-v3")
    ap.add_argument("--lang", default=None, help="ja, en など。未指定なら自動判定")
    ap.add_argument("--out-dir", default=None)
    args = ap.parse_args()

    src = Path(args.input)
    if not src.is_file():
        die(f"入力が見つかりません: {src}")
    out_dir = Path(args.out_dir) if args.out_dir else src.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    backend = pick_backend(args.backend)
    print(f"[transcribe] backend={backend} model={args.model} lang={args.lang or 'auto'}")

    with tempfile.TemporaryDirectory() as tmp:
        wav = extract_audio(src, Path(tmp) / "audio16k.wav")
        if backend == "faster-whisper":
            segs = run_faster_whisper(wav, args.model, args.lang)
        elif backend == "openai-whisper":
            segs = run_openai_whisper(wav, args.model, args.lang)
        else:
            segs = run_sherpa_onnx(wav, args.lang)

    json_path = out_dir / f"{src.stem}.segments.json"
    srt_path = out_dir / f"{src.stem}.srt"
    json_path.write_text(json.dumps(segs, ensure_ascii=False, indent=2), encoding="utf-8")
    srt_path.write_text(to_srt(segs), encoding="utf-8")
    print(f"[transcribe] {len(segs)} 区間 -> {json_path}")
    print(f"[transcribe] SRT      -> {srt_path}")
    for s in segs:
        print("  %7.2f - %7.2f  %s" % (s["start"], s["end"], s["text"]))


if __name__ == "__main__":
    main()
