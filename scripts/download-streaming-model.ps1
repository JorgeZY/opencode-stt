$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$models = Join-Path $root 'models'
$archive = Join-Path $models 'sherpa-onnx-streaming-paraformer-bilingual-zh-en.tar.bz2'
$target = Join-Path $models 'streaming-paraformer-zh-en'
$url = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-paraformer-bilingual-zh-en.tar.bz2'

if (Test-Path (Join-Path $target 'encoder.int8.onnx')) {
  Write-Host 'Streaming preview model is already installed.'
  exit 0
}

New-Item -ItemType Directory -Force -Path $models | Out-Null
Write-Host 'Downloading Sherpa streaming Chinese-English preview model (about 226 MB)...'
Invoke-WebRequest -Uri $url -OutFile $archive
tar -xjf $archive -C $models
Rename-Item (Join-Path $models 'sherpa-onnx-streaming-paraformer-bilingual-zh-en') 'streaming-paraformer-zh-en'
Remove-Item $archive
Write-Host "Streaming preview model is ready: $target"
