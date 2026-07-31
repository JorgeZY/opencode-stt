import { readFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cpal from 'node-cpal';
import sherpaOnnxModule from 'sherpa-onnx-node';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { Recognizer } from './recognizer.js';
import { createVisual } from './visual.js';
import { StreamingPreview } from './streaming-preview.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'config.json'), 'utf8'));
const corrections = JSON.parse(await readFile(path.join(root, config.correctionsFile), 'utf8'));
const sherpaOnnx = sherpaOnnxModule.default ?? sherpaOnnxModule;
const recognizer = new Recognizer(config, root);
const streamingPreview = new StreamingPreview(sherpaOnnx, config, root);
const visual = createVisual(root);
let recording = false;
let stream;
let resampler;
let chunks = [];
let previewTimer;
let previewRunning = false;
let recordingId = 0;
let streamingText = '';
let lastMeterUpdate = 0;
const pressed = new Set();

const instance = net.createServer();
instance.on('error', () => {
  console.error('OpenCode STT is already running.');
  process.exit(1);
});
await new Promise((resolve) => instance.listen(37651, '127.0.0.1', resolve));

function status(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function initializeMicrophone() {
  const input = cpal.getDefaultInputDevice();
  const nativeConfig = cpal.getDefaultInputConfig(input.deviceId);
  resampler = new sherpaOnnx.LinearResampler(nativeConfig.sampleRate, 16000);
  stream = cpal.createStream(input.deviceId, true, {
    sampleRate: nativeConfig.sampleRate,
    channels: 1,
    format: 'f32'
  }, (samples) => {
    // Keep the audio device warm; only retain samples while the shortcut is held.
    if (!recording) return;
    const resampled = resampler.resample(samples);
    chunks.push(resampled);
    const now = Date.now();
    if (now - lastMeterUpdate > 50) {
      let energy = 0;
      for (const sample of resampled) energy += sample * sample;
      visual.meter(Math.min(1, Math.sqrt(energy / resampled.length) * 6));
      lastMeterUpdate = now;
    }
    if (streamingPreview.available) updateStreamingPreview(resampled);
  });
  status(`麦克风已就绪: ${input.name}`);
  visual('', 'LightSteelBlue');
}

function startRecording() {
  if (recording) return;
  chunks = [];
  recording = true;
  streamingText = '';
  streamingPreview.start();
  recordingId += 1;
  if (!streamingPreview.available) previewTimer = setInterval(() => void preview(recordingId), config.previewIntervalMs);
  status('录音中...');
  visual('', 'MediumSpringGreen');
}

async function stopRecording() {
  if (!recording) return;
  if (previewTimer) clearInterval(previewTimer);
  // Retain the final phoneme that often arrives just after key release.
  await new Promise((resolve) => setTimeout(resolve, config.tailCaptureMs));
  recording = false;
  streamingPreview.finish();
  const samples = recordedSamples();
  chunks = [];
  if (samples.length / 16000 < config.minimumRecordingSeconds) {
    status('录音太短，已取消。');
    return;
  }
  status('识别中...');
  visual('', 'Gold');
  const text = correct(await recognizer.transcribe(samples, config.language));
  if (!/[\p{L}\p{N}]/u.test(text) || text.length < config.minimumTextLength) {
    status('未识别到语音。');
    return;
  }
  status(`转写: ${text}`);
  await visual.replace(text, 0);
  status('已将最终结果粘贴到当前输入框，按 Enter 发送。');
  visual('', 'LightSteelBlue');
}

function updateStreamingPreview(samples) {
  const text = correct(streamingPreview.accept(samples));
  if (!text || text === streamingText) return;
  streamingText = text;
  status(`实时转写: ${text}`);
  visual(text, 'DeepSkyBlue');
}

function recordedSamples() {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const samples = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    samples.set(chunk, offset);
    offset += chunk.length;
  }
  return samples;
}

function correct(text) {
  let result = text;
  for (const [from, to] of Object.entries(corrections)) result = result.replaceAll(from, to);
  return result;
}

async function preview(id) {
  if (!recording || previewRunning || id !== recordingId) return;
  const samples = recordedSamples();
  if (samples.length / 16000 < config.previewMinimumSeconds) return;
  previewRunning = true;
  try {
    const text = correct(await recognizer.transcribe(samples, config.language));
    if (recording && id === recordingId && /[\p{L}\p{N}]/u.test(text) && text.length >= config.minimumTextLength) {
      status(`临时转写: ${text}`);
      visual(text, 'DeepSkyBlue');
    }
  } catch (error) {
    status(`临时识别失败: ${error.message}`);
  } finally {
    previewRunning = false;
  }
}

function shortcutPressed() {
  return pressed.has(UiohookKey.F8);
}

uIOhook.on('keydown', (event) => {
  pressed.add(event.keycode);
  if (shortcutPressed() && !recording) startRecording();
});

uIOhook.on('keyup', (event) => {
  pressed.delete(event.keycode);
  if (recording && !shortcutPressed()) void stopRecording().catch((error) => status(`失败: ${error.message}`));
});

uIOhook.start();

initializeMicrophone();
status(streamingPreview.available
  ? 'Sherpa 中英流式预览已启用。'
  : 'Sherpa 流式模型未安装，使用 SenseVoice 累积预览。');
status(`OpenCode STT 已启动。按住 ${config.shortcut} 录音，松开后最终识别并粘贴到当前输入框。`);
process.on('SIGINT', () => {
  if (recording) cpal.closeStream(stream);
  uIOhook.stop();
  instance.close();
  visual.close();
  process.exit(0);
});
