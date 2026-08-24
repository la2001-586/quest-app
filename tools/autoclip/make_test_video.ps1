<#
.SYNOPSIS
    動作確認用の短いテスト動画を作る（音声つき・画面に経過時間を表示）。
    読み上げ音声は Windows 標準の音声合成で作るので、追加インストールは不要。
.EXAMPLE
    .\make_test_video.ps1 test.mp4
    .\make_test_video.ps1 test.mp4 -Voice ナレーション.wav   # 手持ちの音声を使う
#>
param(
    [string]$Out = "test_video.mp4",
    [string]$Voice = "",
    [string]$Text = "Welcome to the demo. Now here comes the highlight moment. Thanks for watching."
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error "ffmpeg が見つかりません。先に .\setup.ps1 を実行してください。"
}

$work = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ("autoclip_" + [guid]::NewGuid().ToString("N")))
try {
    $audio = Join-Path $work "audio.wav"

    if ($Voice) {
        & ffmpeg -y -loglevel error -i $Voice -ar 16000 -ac 1 $audio
    }
    else {
        $speech = Join-Path $work "speech.wav"
        $synthesized = $false
        try {
            Add-Type -AssemblyName System.Speech
            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
            $synth.Rate = -1
            $synth.SetOutputToWaveFile($speech)
            $synth.Speak($Text)
            $synth.Dispose()
            $synthesized = $true
        }
        catch {
            Write-Host "Windows の音声合成を使えませんでした: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        if ($synthesized) {
            # 前後に無音を足して、切り抜き位置が分かりやすいようにする
            $silence = Join-Path $work "sil.wav"
            $list = Join-Path $work "list.txt"
            & ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=16000:cl=mono -t 2 $silence
            @($silence, $speech, $silence) |
                ForEach-Object { "file '" + ($_ -replace '\\', '/') + "'" } |
                Set-Content -Path $list -Encoding ascii
            & ffmpeg -y -loglevel error -f concat -safe 0 -i $list -ar 16000 -ac 1 $audio
        }
        else {
            Write-Host "読み上げ音声の代わりにトーン音で作ります（文字起こしの確認には使えません）。" -ForegroundColor Yellow
            & ffmpeg -y -loglevel error -f lavfi -i "sine=frequency=440:duration=12" -ar 16000 -ac 1 $audio
        }
    }

    $drawtext = "drawtext=text='%{pts\:hms}':fontsize=42:fontcolor=white:box=1:boxcolor=black@0.6:x=20:y=20"
    & ffmpeg -y -loglevel error -f lavfi -i "testsrc2=size=640x360:rate=25" -i $audio `
        -vf $drawtext -shortest -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac $Out

    $duration = & ffprobe -v error -show_entries format=duration -of "default=nw=1:nk=1" $Out
    Write-Host ("作成しました: {0}（{1:N2} 秒）" -f $Out, [double]$duration) -ForegroundColor Green
}
finally {
    Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
}
