# 指示書：動画の「自動切り抜き」側の環境を用意する（Windows）

## この指示書の位置づけ

動画まわりには、方向の違う 2 つの系統がある。

| | 系統 | 中身 | 今回 |
| --- | --- | --- | --- |
| **A** | 動画を**作る**側 | ゆっくりボイス等の音声合成、動画編集ソフト、字幕付け | 別トラックとして継続してよい |
| **B** | 動画を**切り抜く**側 | Whisper（文字起こし）＋ ffmpeg（切り出し） | **この指示書の対象** |

**A を止める必要はない。** ただし B の準備がまだなので、B を用意する。
A を進めている途中なら、区切りのいいところまでやってから B に入ってよい。

なお A と B は後でつながる。B の `transcribe.py` は SRT（字幕ファイル）も出力するので、
A 側の字幕付けにそのまま使える。B を用意しておくと A も楽になる。

## B のゴール

このパソコン（Windows）で、次の 2 つを動く状態にする。

1. **Whisper** … 音声の文字起こし（何を、何秒〜何秒に、しゃべったか）
2. **ffmpeg** … 動画の切り出し（その時刻の部分だけを切る）

そして「動画を入れる → しゃべった内容と時刻が出る → 指定した言葉の場所だけ切り出される」
ところまでを、実際のファイルで確認する。

## ゼロから作らない

スクリプト一式は完成済みで、このリポジトリに入っている。**まずこれを取得して使う。**
自分で一から書き直さないこと（原則①：車輪の再発明をしない）。

- リポジトリ: `la2001-586/quest-app`
- ブランチ: `claude/video-auto-clip-setup-ra5jg9`
- 場所: `tools/autoclip/`

| ファイル | 役割 |
| --- | --- |
| `setup.ps1` | ffmpeg と Python と Whisper を入れる（Windows 用） |
| `make_test_video.ps1` | 確認用のテスト動画を作る |
| `transcribe.py` | 文字起こし → `.segments.json` と `.srt` を出力 |
| `autoclip.py` | キーワードや時間を指定して ffmpeg で切り出し |
| `README.md` | 使い方 |

## 手順

### 1. 取得

```powershell
git pull
git switch claude/video-auto-clip-setup-ra5jg9
cd tools\autoclip
```

git を使っていない場合は、次の ZIP を落として展開する。
`https://github.com/la2001-586/quest-app/archive/refs/heads/claude/video-auto-clip-setup-ra5jg9.zip`

### 2. インストール

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1
```

`winget` があれば ffmpeg も Python も自動で入る。
ffmpeg を入れた直後は PATH が反映されず「開き直してください」と出ることがある。
その時は PowerShell を閉じて開き直し、`.\setup.ps1` をもう一度実行する。

すでに ffmpeg が入っているなら、それがそのまま使われる（入れ直さない）。

### 3. 動作確認（英語）

```powershell
.\make_test_video.ps1 test.mp4
py -3 transcribe.py test.mp4 --lang en --model tiny
py -3 autoclip.py test.mp4 --segments test.segments.json --keyword highlight
```

> `make_test_video.ps1` は Windows 標準の音声合成でテスト音声を作る。
> これは確認用の音声を用意するためだけのもので、A 側の音声合成とは別物。
> ここを作り込む必要はない。

### 4. 動作確認（日本語）

日本語の動画でも通ることを確認する。手持ちの動画があればそれを使う。

```powershell
py -3 transcribe.py 素材.mp4 --lang ja --model small
py -3 autoclip.py 素材.mp4 --segments 素材.segments.json --keyword ここ
```

## 完了条件（これが全部そろうまで「できました」と言わない）

1. `ffmpeg -version` が表示される
2. `transcribe.py` の出力に、**時刻付きの行**が出ている（例 `5.69 - 8.58  Now here comes the highlight moment.`）
3. `clips\` フォルダに切り出した mp4 ができている
4. その mp4 を**実際に再生して**、狙った場所が切り出せていることを確認した
5. 上の 1〜4 について、**実行したコマンドとその出力をそのまま貼って**報告した

## 詰まったときの動き方

- **別のツールに乗り換えて回避しない。** B は Whisper と ffmpeg でやる。
- エラーメッセージを**全文そのまま**報告する。要約しない。
- よくある詰まり:
  - `ffmpeg は認識されていません` → PowerShell を開き直す
  - `このシステムではスクリプトの実行が無効` → 手順 2 の `Set-ExecutionPolicy` を先に実行
  - `python が見つからない` → `setup.ps1` が Python を入れた後、PowerShell を開き直す
  - 初回の文字起こしが遅い → Whisper のモデルを落としている（tiny 約 75MB / small 約 500MB）。待つ。

## 補足

- 精度が足りないときは `--model` を `tiny` → `small` → `medium` と上げる（遅くなるが正確になる）。
- 切り出しの前後に余裕を足したいときは `--pad-start 1.0 --pad-end 1.0`。
- 速さ優先で切りたいときは `--copy`（開始位置がキーフレーム単位で少しずれる）。
- `transcribe.py` が出す `.srt` は、そのまま字幕ファイルとして A 側で使える。
