import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cpal from 'node-cpal';
import sherpaOnnxModule from 'sherpa-onnx-node';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { Recognizer } from './recognizer.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'config.json'), 'utf8'));
const sherpaOnnx = sherpaOnnxModule.default ?? sherpaOnnxModule;
const recognizer = new Recognizer(config, root);
let recording = false;
let stream;
let resampler;
let chunks = [];
const pressed = new Set();

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
    if (recording) chunks.push(resampler.resample(samples));
  });
  status(`麦克风已就绪: ${input.name}`);
}

function startRecording() {
  if (recording) return;
  chunks = [];
  recording = true;
  status('录音中...');
}

async function stopRecording() {
  if (!recording) return;
  recording = false;
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const samples = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    samples.set(chunk, offset);
    offset += chunk.length;
  }
  chunks = [];
  if (samples.length / 16000 < config.minimumRecordingSeconds) {
    status('录音太短，已取消。');
    return;
  }
  status('识别中...');
  const text = await recognizer.transcribe(samples, config.language);
  if (!/[\p{L}\p{N}]/u.test(text) || text.length < config.minimumTextLength) {
    status('未识别到语音。');
    return;
  }
  status(`转写: ${text}`);
  await paste(text);
  status('已粘贴到当前获得焦点的输入框，按 Enter 发送。');
}

async function paste(text) {
  const payload = Buffer.from(text, 'utf8').toString('base64');
  const { execFile } = await import('node:child_process');
  await promisify(execFile)('powershell', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', path.join(root, 'scripts', 'paste.ps1'),
    payload
  ], { windowsHide: true });
}

function shortcutPressed() {
  return pressed.has(UiohookKey.Ctrl) && pressed.has(UiohookKey.Alt) && pressed.has(UiohookKey.Space);
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
status(`OpenCode STT 已启动。按住 ${config.shortcut} 录音，松开后转写并粘贴到当前输入框。`);
process.on('SIGINT', () => {
  if (recording) cpal.closeStream(stream);
  uIOhook.stop();
  process.exit(0);
});
