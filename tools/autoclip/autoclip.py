#!/usr/bin/env python3
"""文字起こし結果（segments.json）から、キーワードや時間指定で動画を切り出す。

使い方:
    # 「ハイライト」を含む発話を、前後0.5秒の余裕つきで切り出す
    python3 autoclip.py video.mp4 --segments video.segments.json --keyword ハイライト

    # 時間を直接指定して切り出す
    python3 autoclip.py video.mp4 --range 3.5-9.0 --range 12-18

    # 発話区間をすべて個別クリップにする
    python3 autoclip.py video.mp4 --segments video.segments.json --all
"""
import argparse, json, shutil, subprocess, sys
from pathlib import Path


def die(msg):
    print(f"[autoclip] エラー: {msg}", file=sys.stderr)
    sys.exit(1)


def duration_of(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)],
                         capture_output=True, text=True)
    try:
        return float(out.stdout.strip())
    except ValueError:
        die(f"動画の長さを取得できません: {path}")


def parse_range(text: str):
    try:
        a, b = text.split("-", 1)
        return float(a), float(b)
    except ValueError:
        die(f"--range の書式は 開始-終了 （秒）です: {text}")


def merge(spans, gap: float):
    """近接するクリップ範囲をひとつにまとめる。"""
    spans = sorted(spans)
    merged = []
    for start, end, label in spans:
        if merged and start - merged[-1][1] <= gap:
            prev = merged[-1]
            merged[-1] = (prev[0], max(prev[1], end), prev[2])
        else:
            merged.append((start, end, label))
    return merged


def cut(src: Path, start: float, end: float, dst: Path, copy: bool) -> bool:
    """ffmpeg で切り出す。既定は再エンコード（フレーム単位で正確）。"""
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{start:.3f}",
           "-i", str(src), "-t", f"{end - start:.3f}"]
    if copy:
        # キーフレーム単位でのカット。速いが開始位置がずれることがある
        cmd += ["-c", "copy", "-avoid_negative_ts", "make_zero"]
    else:
        cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k"]
    cmd.append(str(dst))
    return subprocess.run(cmd).returncode == 0


def main():
    ap = argparse.ArgumentParser(description="Whisper の結果をもとに ffmpeg で自動切り抜き")
    ap.add_argument("video")
    ap.add_argument("--segments", help="transcribe.py が出力した segments.json")
    ap.add_argument("--keyword", action="append", default=[], help="複数指定可（いずれかに一致）")
    ap.add_argument("--range", action="append", default=[], dest="ranges", help="例 3.5-9.0")
    ap.add_argument("--all", action="store_true", help="全発話区間を切り出す")
    ap.add_argument("--pad-start", type=float, default=0.5)
    ap.add_argument("--pad-end", type=float, default=0.5)
    ap.add_argument("--merge-gap", type=float, default=1.0, help="この秒数以内の近接クリップは連結")
    ap.add_argument("--out-dir", default="clips")
    ap.add_argument("--copy", action="store_true", help="再エンコードせず高速に切る")
    args = ap.parse_args()

    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        die("ffmpeg / ffprobe が見つかりません。setup.sh を実行してください。")
    src = Path(args.video)
    if not src.is_file():
        die(f"動画が見つかりません: {src}")

    spans = []
    for r in args.ranges:
        a, b = parse_range(r)
        spans.append((a, b, "range"))

    if args.segments:
        segs = json.loads(Path(args.segments).read_text(encoding="utf-8"))
        for s in segs:
            text = s["text"]
            hit = args.all or any(k.lower() in text.lower() for k in args.keyword)
            if hit:
                label = "seg" if args.all else "hit"
                spans.append((s["start"] - args.pad_start, s["end"] + args.pad_end, label))
    elif args.keyword or args.all:
        die("--keyword / --all には --segments が必要です。")

    if not spans:
        print("[autoclip] 該当する区間がありませんでした。")
        return 0

    total = duration_of(src)
    spans = [(max(0.0, a), min(total, b), lab) for a, b, lab in spans if b > 0 and a < total]
    spans = merge(spans, args.merge_gap)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    made = []
    for i, (a, b, label) in enumerate(spans, 1):
        dst = out_dir / f"{src.stem}_{label}{i:02d}_{a:.2f}-{b:.2f}.mp4"
        if cut(src, a, b, dst, args.copy):
            made.append(dst)
            print(f"[autoclip] {a:7.2f}s - {b:7.2f}s  ({b - a:5.2f}s) -> {dst}")
        else:
            print(f"[autoclip] 切り出し失敗: {a:.2f}-{b:.2f}", file=sys.stderr)
    print(f"[autoclip] {len(made)} 本のクリップを作成しました（{out_dir}）")
    return 0 if made else 1


if __name__ == "__main__":
    sys.exit(main())
