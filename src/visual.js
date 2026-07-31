import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

export function createVisual(root) {
  const script = path.join(root, 'src', 'visual-pet.py');
  const process = spawn('python', [script], {
    windowsHide: true,
    stdio: ['ignore', 'ignore', 'pipe']
  });
  process.stderr.on('data', (chunk) => console.error(`Visual pet error: ${chunk}`));

  const send = (message, waitForReply = false) => new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: 37652 });
    socket.setEncoding('utf8');
    socket.on('error', reject);
    if (waitForReply) {
      let reply = '';
      socket.on('data', (chunk) => { reply += chunk; });
      socket.on('end', () => {
        try {
          const result = JSON.parse(reply);
          result.error ? reject(new Error(result.error)) : resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    } else {
      socket.on('connect', () => resolve());
    }
    socket.end(JSON.stringify(message));
  });
  const publish = (text, color = 'LightSteelBlue', level = 0) => send({ text, color, level }).catch(() => {});
  publish.close = () => process.kill();
  publish.meter = (level) => send({ level }).catch(() => {});
  publish.replace = (text, previousLength) => send({ action: 'replace', text, previousLength }, true);
  return publish;
}
