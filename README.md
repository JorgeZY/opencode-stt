# OpenCode STT

[中文](README.zh-CN.md) | English

Windows local voice input assistant. Hold `F8` to record, release it to transcribe with the local SenseVoice model, and paste the result into the currently focused OpenCode text input.

## Installation

```powershell
npm install
npm run models
python -m pip install funasr-onnx
npm start
```

The model is downloaded from ModelScope (`iic/SenseVoiceSmall-onnx`) to `models/sensevoice/` in the project directory. Transcription runs with the local Python `funasr-onnx` runtime; recordings are kept in memory only.

On a normal network, `pip install funasr-onnx` automatically installs dependencies such as `kaldi-native-fbank`, `sentencepiece`, `PyYAML`, `librosa`, and `jieba`.

If your network blocks the PyPI source package for `jieba`, use this fallback instead:

```powershell
python -m pip install --no-deps funasr-onnx
python -m pip install kaldi-native-fbank sentencepiece PyYAML librosa
python -m pip install "git+https://github.com/fxsjy/jieba.git"
```

## Usage

1. Focus the text input in the OpenCode TUI.
2. Run `npm start`.
3. Hold `F8` and speak your task. Streaming recognition appears in the desktop pet's speech bubble while recording.
4. When you release the key, the complete recording is transcribed once by SenseVoice and pasted into the focused input. Review it, then press Enter to send.

Recordings are kept in memory only. Model files are stored in `models/sensevoice/`. The helper intentionally does not inject interim text into the OpenCode TUI: terminal UIs do not expose a stable text range API, so replacing partial hypotheses can corrupt the user's input. Only the final transcription is pasted.

A lightweight transparent desktop pet appears while the helper is running. It uses Python's built-in `tkinter`. The pet is always on top and draggable. Its speech bubble appears only while streaming transcription is available, keeping interim text out of the OpenCode input.

## Streaming Preview Model

The current preview mode re-runs SenseVoice over the recording collected so far. Installing the optional Sherpa streaming Chinese-English Paraformer model automatically switches previews to true incremental ASR, while SenseVoice still performs the final correction after key release. Download it explicitly; it is not required for final SenseVoice transcription:

```powershell
npm run models:streaming
```

After downloading, stop any existing background instance and start the helper again. Startup must include this line before true streaming preview is active:

## Diagnose

Run this before reporting setup problems. It checks the model files, Python runtime, default microphone, and clipboard support:

```powershell
npm run diagnose
```

Only one helper instance can run at a time. Stop the existing background instance before manually running `npm start`.

## Corrections

Edit `corrections.json` to add local replacements for recurring technical terms. Keys are recognized text and values are the desired text.

## Hardware Button

Use a programmable USB macro key configured to hold `F8` and release `F8` when the button is released. See [HARDWARE.md](HARDWARE.md) for the macro configuration, Windows login autostart, and the later RP2040 dedicated-button path.
