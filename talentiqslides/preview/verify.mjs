import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9224',
  '--user-data-dir=' + process.cwd() + '\\preview\\chrome-v2-profile', 'about:blank'
], { windowsHide: true, stdio: 'ignore' });

let ws;
try {
  let target;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      target = (await (await fetch('http://127.0.0.1:9224/json/list')).json()).find(item => item.type === 'page');
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

  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const sizes = [
    { name: 'desktop', width: 1440, height: 900, mobile: false },
    { name: 'present', width: 1280, height: 720, mobile: false },
    { name: 'mobile', width: 390, height: 844, mobile: true }
  ];
  for (const size of sizes) {
    await send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: 1, mobile: size.mobile });
    for (let slide = 1; slide <= 8; slide++) {
      await send('Page.navigate', { url: `http://127.0.0.1:6969/?slide=${slide}&qa=${Date.now()}-${size.name}` });
      await new Promise(resolve => setTimeout(resolve, 650));
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(`preview/v2-${size.name}-${slide}.png`, Buffer.from(data, 'base64'));
      const { result } = await send('Runtime.evaluate', { expression: `JSON.stringify((()=>{const s=document.querySelector('.slide.active');const rect=s.querySelector('.shell').getBoundingClientRect();return{slide:${slide},title:s.querySelector('h1,h2')?.textContent,images:[...s.querySelectorAll('img')].map(image=>image.complete&&image.naturalWidth>0),scrollWidth:s.scrollWidth,scrollHeight:s.scrollHeight,shellBottom:Math.round(rect.bottom),activeCount:document.querySelectorAll('.slide.active').length}})())`, returnByValue: true });
      const resultData = JSON.parse(result.value);
      if (resultData.activeCount !== 1 || !resultData.title || resultData.images.some(loaded => !loaded) || resultData.scrollWidth > size.width || (!size.mobile && resultData.shellBottom > size.height + 1)) {
        throw new Error(`Layout check failed at ${size.name} slide ${slide}: ${JSON.stringify(resultData)}`);
      }
      console.log(size.name, slide, resultData.title, `height=${resultData.scrollHeight}`);
    }
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:6969/' });
  await new Promise(resolve => setTimeout(resolve, 450));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  const nav = await send('Runtime.evaluate', { expression: `document.querySelector('.slide.active').getAttribute('aria-label')`, returnByValue: true });
  if (!nav.result.value.startsWith('Slide 2')) throw new Error('Keyboard navigation failed');
  await send('Runtime.evaluate', { expression: `document.querySelector('.stage').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:innerWidth*.75}))` });
  const clicked = await send('Runtime.evaluate', { expression: `document.querySelector('.slide.active').getAttribute('aria-label')`, returnByValue: true });
  if (!clicked.result.value.startsWith('Slide 3')) throw new Error('Click navigation failed');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  const back = await send('Runtime.evaluate', { expression: `JSON.stringify({label:document.querySelector('.slide.active')?.getAttribute('aria-label'),count:document.querySelectorAll('.slide.active').length})`, returnByValue: true });
  if (!JSON.parse(back.result.value).label.startsWith('Slide 2') || JSON.parse(back.result.value).count !== 1) throw new Error('Backward keyboard navigation failed');
  await send('Runtime.evaluate', { expression: `document.querySelector('.stage').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:innerWidth*.25}))` });
  const clickedBack = await send('Runtime.evaluate', { expression: `document.querySelector('.slide.active')?.getAttribute('aria-label')`, returnByValue: true });
  if (!clickedBack.result.value.startsWith('Slide 1')) throw new Error('Backward click navigation failed');
  await send('Runtime.evaluate', { expression: `window.dispatchEvent(new WheelEvent('wheel',{deltaY:100,cancelable:true}))` });
  const wheelForward = await send('Runtime.evaluate', { expression: `document.querySelector('.slide.active')?.getAttribute('aria-label')`, returnByValue: true });
  if (!wheelForward.result.value.startsWith('Slide 2')) throw new Error('Wheel forward navigation failed');
  await new Promise(resolve => setTimeout(resolve, 700));
  await send('Runtime.evaluate', { expression: `window.dispatchEvent(new WheelEvent('wheel',{deltaY:-100,cancelable:true}))` });
  const wheelBack = await send('Runtime.evaluate', { expression: `document.querySelector('.slide.active')?.getAttribute('aria-label')`, returnByValue: true });
  if (!wheelBack.result.value.startsWith('Slide 1')) throw new Error('Wheel backward navigation failed');
  console.log('Navigation passed');
} finally {
  ws?.close();
  chrome.kill();
}
