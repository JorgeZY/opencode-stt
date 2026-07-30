$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$models = Join-Path $root 'models'
$senseVoice = Join-Path $models 'sensevoice'

New-Item -ItemType Directory -Force -Path $models | Out-Null

New-Item -ItemType Directory -Force -Path $senseVoice | Out-Null

if (-not (Test-Path (Join-Path $senseVoice 'model_quant.onnx'))) {
  Write-Host 'Downloading SenseVoice INT8 ONNX model from ModelScope (about 228 MB)...'
  $env:PYTHONPATH = "$env:TEMP\modelscope-no-ssl"
  try {
    modelscope download --model iic/SenseVoiceSmall-onnx --local_dir $senseVoice
  } finally {
    Remove-Item Env:PYTHONPATH -ErrorAction SilentlyContinue
  }
}

if (-not (Test-Path (Join-Path $senseVoice 'chn_jpn_yue_eng_ko_spectok.bpe.model'))) {
  $env:PYTHONPATH = "$env:TEMP\modelscope-no-ssl"
  try {
    modelscope download --model iic/SenseVoiceSmall chn_jpn_yue_eng_ko_spectok.bpe.model --local_dir $senseVoice
  } finally {
    Remove-Item Env:PYTHONPATH -ErrorAction SilentlyContinue
  }
}

if (-not (Test-Path (Join-Path $senseVoice 'model_quant.onnx')) -or -not (Test-Path (Join-Path $senseVoice 'tokens.json')) -or -not (Test-Path (Join-Path $senseVoice 'chn_jpn_yue_eng_ko_spectok.bpe.model'))) {
  throw 'Unable to download the ONNX model. Check network policy, then rerun npm run models.'
}

Write-Host 'Models are ready in models\sensevoice'
