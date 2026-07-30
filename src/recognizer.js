import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export class Recognizer {
  constructor(config, root) {
    const modelDirectory = path.resolve(root, config.modelDirectory);
    const worker = fileURLToPath(new URL('./funasr-worker.py', import.meta.url));
    this.worker = spawn('python', [worker, modelDirectory, String(config.threads)], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    this.buffer = '';
    this.pending = [];
    this.worker.stdout.on('data', (chunk) => this.read(chunk));
    this.worker.stderr.on('data', (chunk) => process.stderr.write(chunk));
    this.worker.on('error', (error) => this.fail(error));
  }

  read(chunk) {
    this.buffer += chunk;
    let newline;
    while ((newline = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newline);
      this.buffer = this.buffer.slice(newline + 1);
      const request = this.pending.shift();
      if (!request) continue;
      const result = JSON.parse(line);
      result.error ? request.reject(new Error(result.error)) : request.resolve(result.text.trim());
    }
  }

  fail(error) {
    while (this.pending.length) this.pending.shift().reject(error);
  }

  transcribe(samples, language) {
    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject });
      this.worker.stdin.write(JSON.stringify({
        language,
        samples: Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength).toString('base64')
      }) + '\n');
    });
  }
}
