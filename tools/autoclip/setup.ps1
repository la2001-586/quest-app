<#
.SYNOPSIS
    動画・自動切り抜き環境（ffmpeg + Whisper）を Windows にインストールする。
.EXAMPLE
    .\setup.ps1              # ffmpeg + faster-whisper（推奨・軽量高速）
    .\setup.ps1 -Flavor openai   # ffmpeg + 本家 openai-whisper（PyTorch が入るので重い）
#>
param(
    [ValidateSet("faster", "openai")]
    [string]$Flavor = "faster"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Update-PathFromRegistry {
    # winget などでインストールした直後は、現在のウィンドウの PATH が古いままなので読み直す
    $machine = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $user = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = (@($machine, $user) | Where-Object { $_ }) -join ";"
}

function Test-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

Write-Host "== 1/2 ffmpeg ==" -ForegroundColor Cyan
if (Test-Command ffmpeg) {
    Write-Host ("ffmpeg は導入済み: " + (& ffmpeg -version | Select-Object -First 1))
}
elseif (Test-Command winget) {
    Write-Host "winget で ffmpeg をインストールします..."
    & winget install --id Gyan.FFmpeg -e --source winget `
        --accept-package-agreements --accept-source-agreements
    Update-PathFromRegistry
}
elseif (Test-Command scoop) {
    & scoop install ffmpeg
    Update-PathFromRegistry
}
elseif (Test-Command choco) {
    & choco install ffmpeg -y
    Update-PathFromRegistry
}
else {
    Write-Error "winget / scoop / choco のいずれも見つかりません。https://www.gyan.dev/ffmpeg/builds/ から手動で入れてください。"
}

if (-not (Test-Command ffmpeg)) {
    Write-Host ""
    Write-Host "ffmpeg は入りましたが、このウィンドウからはまだ見えていません。" -ForegroundColor Yellow
    Write-Host "PowerShell を開き直してから、もう一度 .\setup.ps1 を実行してください。" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "== 2/2 Whisper ==" -ForegroundColor Cyan
$python = $null
foreach ($candidate in @("py", "python3", "python")) {
    if (Test-Command $candidate) { $python = $candidate; break }
}
if (-not $python) {
    Write-Host "Python が見つかりません。winget でインストールします..." -ForegroundColor Yellow
    if (Test-Command winget) {
        & winget install --id Python.Python.3.12 -e --source winget `
            --accept-package-agreements --accept-source-agreements
        Update-PathFromRegistry
        foreach ($candidate in @("py", "python3", "python")) {
            if (Test-Command $candidate) { $python = $candidate; break }
        }
    }
}
if (-not $python) {
    Write-Error "Python 3 が必要です。https://www.python.org/downloads/windows/ から入れて、PowerShell を開き直してください。"
}

# py ランチャーの場合は -3 を付けて Python 3 を明示する
[string[]]$pyArgs = if ($python -eq "py") { @("-3") } else { @() }

& $python @pyArgs -m pip install --upgrade pip
if ($Flavor -eq "openai") {
    & $python @pyArgs -m pip install --upgrade openai-whisper
}
else {
    & $python @pyArgs -m pip install --upgrade faster-whisper
}

Write-Host ""
Write-Host "== 確認 ==" -ForegroundColor Cyan
& ffmpeg -version | Select-Object -First 1
& ffprobe -version | Select-Object -First 1
& $python @pyArgs -c @"
import importlib
for m in ('faster_whisper', 'whisper', 'sherpa_onnx'):
    try:
        importlib.import_module(m)
        print(m + ': OK')
    except ImportError:
        print(m + ': 未導入')
"@

Write-Host ""
Write-Host "完了しました。次はテスト動画で動作確認します:" -ForegroundColor Green
Write-Host "  .\make_test_video.ps1 test.mp4"
Write-Host "  $python -m ..." -ForegroundColor DarkGray
Write-Host "  python transcribe.py test.mp4 --lang en --model tiny"
Write-Host "  python autoclip.py test.mp4 --segments test.segments.json --keyword highlight"
