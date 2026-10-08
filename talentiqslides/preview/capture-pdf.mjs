import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9225',
  '--user-data-dir=' + process.cwd() + '\\preview\\chrome-pdf-profile', 'about:blank'
], { windowsHide: true, stdio: 'ignore' });

let ws;
try {
  let target;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      target = (await (await fetch('http://127.0.0.1:9225/json/list')).json()).find(item => item.type === 'page');
      if (target) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!target) throw new Error('Chrome debugger did not start');

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const promise = pending.get(message.id);
    pending.delete(message.id);
    message.error ? promise.reject(message.error) : promise.resolve(message.result);
  });
  function send(method, params = {}) {
    const requestId = ++id;
    return new Promise((resolve, reject) => {
      pending.set(requestId, { resolve, reject });
      ws.send(JSON.stringify({ id: requestId, method, params }));
    });
  }

  await mkdir('tmp/pdfs', { recursive: true });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 2, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (let slide = 1; slide <= 8; slide++) {
    await send('Page.navigate', { url: `http://127.0.0.1:6969/?slide=${slide}&pdf=${Date.now()}` });
    await new Promise(resolve => setTimeout(resolve, 650));
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(`tmp/pdfs/talentiq-slide-${slide}.png`, Buffer.from(data, 'base64'));
    console.log(`Captured slide ${slide}`);
  }
} finally {
  ws?.close();
  chrome.kill();
}
