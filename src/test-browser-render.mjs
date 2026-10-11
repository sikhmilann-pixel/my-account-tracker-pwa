import http from 'http';
import { spawn } from 'child_process';

async function run() {
  console.log('Launching Chrome in headless mode with remote debugging...');
  const chromeProcess = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--disable-gpu',
      '--user-data-dir=/tmp/chrome-test-profile-' + Date.now(),
      'http://127.0.0.1:5173/',
    ],
    { stdio: 'ignore' }
  );

  // Wait 1.5s for Chrome to bind
  await new Promise((r) => setTimeout(r, 1500));

  // Fetch /json/list
  const pages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = pages.find((p) => p.type === 'page' && p.url.includes('5173'));
  if (!page) {
    throw new Error('Could not find active page in Chrome DevTools target list');
  }

  console.log('Connecting to DevTools target:', page.webSocketDebuggerUrl);
  const ws = new (globalThis.WebSocket || WebSocket)(page.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data || evt);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  await new Promise((resolve) => {
    ws.addEventListener('open', resolve);
  });

  // Enable Console and Runtime
  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data || evt);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[Browser Console]', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[Browser Uncaught Exception]', msg.params.exceptionDetails);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');

  console.log('Waiting 3 seconds for React and Dexie initialization...');
  await new Promise((r) => setTimeout(r, 3000));

  // Evaluate DOM
  const evalRes = await send('Runtime.evaluate', {
    expression: 'document.querySelector("#root") ? document.querySelector("#root").innerText : "NO ROOT"',
  });

  const pageText = evalRes.result?.value || '';
  console.log('\n--- RENDERED PAGE TEXT CONTENT ---');
  console.log(pageText.slice(0, 500));
  console.log('----------------------------------\n');

  ws.close();
  chromeProcess.kill();

  if (pageText.includes('Account Balance') || pageText.includes('+ Add Income')) {
    console.log(' SUCCESS: Dashboard successfully rendered in the browser!');
  } else if (pageText.includes('Starting My Account Tracker')) {
    console.error(' STILL STUCK ON SPINNER!');
    process.exit(1);
  } else {
    console.error(' Unexpected page state:', pageText);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Error during browser verification:', err);
  process.exit(1);
});
