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
3. Hold `F8` and speak your task. After about 0.8 seconds, the input begins showing an interim transcription and continues to update.
4. When you release the key, the complete recording is transcribed again and replaces the interim text. Review it, then press Enter to send.

Recordings are kept in memory only. Model files are stored in `models/sensevoice/`. Interim text is updated by undoing the previous paste and pasting the new result, so do not manually edit the input or switch to another application while recording.

## Hardware Button

Use a programmable USB macro key configured to hold `F8` and release `F8` when the button is released. See [HARDWARE.md](HARDWARE.md) for the macro configuration, Windows login autostart, and the later RP2040 dedicated-button path.
