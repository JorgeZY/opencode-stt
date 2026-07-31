# OpenCode STT

中文 | [English](README.md)

Windows 本地语音输入助手。按住 `F8` 录音，松开后使用本地 SenseVoice 识别，再把结果粘贴到当前获得焦点的 OpenCode 文本输入框。

## 安装

```powershell
npm install
npm run models
python -m pip install --no-deps funasr-onnx
python -m pip install kaldi-native-fbank sentencepiece PyYAML librosa
python -m pip install "git+https://github.com/fxsjy/jieba.git"
npm start
```

模型通过 ModelScope 的 `iic/SenseVoiceSmall-onnx` 下载到项目目录的 `models/sensevoice/`。识别使用本机 Python 的 `funasr-onnx` 运行时；录音仅保存在内存中。

`funasr-onnx` 的 `jieba` 依赖在部分公司网络中会被 PyPI 策略拦截，因此安装指令直接使用官方 Git 仓库。

## 使用

1. 将焦点放在 OpenCode TUI 的文本输入框。
2. 运行 `npm start`。
3. 按住 `F8` 说出任务。约 0.8 秒后输入框开始显示临时转写，并持续更新。
4. 松开按键后，完整录音会进行最终识别并覆盖临时文本；检查后按 Enter 发送。

录音只保存在内存中。模型文件存放于 `models/sensevoice/`。临时文本通过撤销上一次粘贴后重新粘贴实现更新，因此录音期间不要手动编辑输入框或切换到其他应用。

## 硬件按键

使用可编程 USB 宏按键，将其配置为按住 `F8` 快捷键，并在松开时释放 `F8`。有关宏配置、Windows 登录自启动以及后续 RP2040 专用按键方案，请参阅 [HARDWARE.md](HARDWARE.md)。