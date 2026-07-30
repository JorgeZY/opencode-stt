import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
function command(args) {
  return { file: 'opencode', args, shell: process.platform === 'win32' };
}

export async function recentProjects() {
  const invocation = command(['session', 'list', '--format', 'json', '--max-count', '20']);
  const { stdout } = await execFileAsync(invocation.file, invocation.args, {
    windowsHide: true,
    shell: invocation.shell
  });
  const sessions = JSON.parse(stdout);
  const seen = new Set();
  return sessions
    .filter((session) => session.directory && !seen.has(session.directory) && seen.add(session.directory))
    .map((session) => ({ directory: session.directory, title: session.title || session.directory }));
}

export async function sendPrompt(directory, prompt) {
  const invocation = command(['run', '--dir', directory, '--continue']);
  return new Promise((resolve, reject) => {
    const child = spawn(invocation.file, invocation.args, { windowsHide: true, shell: invocation.shell });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `OpenCode exited with code ${code}`));
    });
    child.stdin.end(prompt);
  });
}
