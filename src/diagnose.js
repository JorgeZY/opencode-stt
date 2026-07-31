import { access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cpal from 'node-cpal';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execFileAsync = promisify(execFile);
const config = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(root, 'config.json'), 'utf8'));
let failed = false;

async function check(name, action, optional = false) {
  try {
    const detail = await action();
    console.log(`OK   ${name}${detail ? `: ${detail}` : ''}`);
  } catch (error) {
    if (optional) console.warn(`SKIP ${name}: ${error.message}`);
    else {
      failed = true;
      console.error(`FAIL ${name}: ${error.message}`);
    }
  }
}

await check('SenseVoice model', async () => {
  const model = path.join(root, config.modelDirectory, config.modelFile);
  const tokenizer = path.join(root, config.modelDirectory, 'chn_jpn_yue_eng_ko_spectok.bpe.model');
  await Promise.all([access(model), access(tokenizer)]);
  return model;
});

await check('Streaming preview model', async () => {
  const encoder = path.join(root, config.streamingModelDirectory, 'encoder.int8.onnx');
  const decoder = path.join(root, config.streamingModelDirectory, 'decoder.int8.onnx');
  await Promise.all([access(encoder), access(decoder)]);
  return 'Sherpa streaming Paraformer ready';
}, true);

await check('Python FunASR runtime', async () => {
  await execFileAsync('python', ['-c', 'from funasr_onnx import SenseVoiceSmall; print("ready")']);
  return 'funasr-onnx import succeeded';
});

await check('Transparent visual pet runtime', async () => {
  await execFileAsync('python', ['-c', 'import tkinter; print("ready")']);
  return 'tkinter import succeeded';
});

await check('Default microphone', async () => {
  const device = cpal.getDefaultInputDevice();
  if (!device) throw new Error('no default input device');
  return device.name;
});

await check('PowerShell clipboard support', async () => {
  await execFileAsync('powershell', ['-NoProfile', '-Command', 'Get-Command Set-Clipboard | Out-Null']);
  return 'Set-Clipboard available';
});

process.exitCode = failed ? 1 : 0;
