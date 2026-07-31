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

  const publish = (text, color = 'LightSteelBlue', level = 0) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: 37652 });
    socket.on('error', () => {});
    socket.end(JSON.stringify({ text, color, level }));
  };
  publish.close = () => process.kill();
  publish.meter = (level) => publish('', undefined, level);
  return publish;
}
