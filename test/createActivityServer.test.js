const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { WebSocket } = require('ws');
const { createActivityServer, isInside } = require('../lib/createActivityServer');

const clientDir = fs.mkdtempSync(path.join(os.tmpdir(), 'activity-client-'));
fs.writeFileSync(path.join(clientDir, 'index.html'), '<!doctype html><title>Activity</title>');

const server = createActivityServer({
  clientDir,
  sharedClientDir: path.join(__dirname, '..', 'client'),
  activityName: 'fixture',
  version: '9.9.9',
  routes: { '/': 'index.html' },
  redirects: { '/lobby': '/' },
  onConnection(ctx) {
    ctx.send({ type: 'ready' });
  },
  onMessage(ctx, msg) {
    if (msg.type === 'echo') ctx.send({ type: 'echo', text: msg.text });
    else if (msg.type === 'boom') {
      const err = new Error('No');
      err.code = 'nope';
      throw err;
    }
  },
});

let address;

function requestStatus(port, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path: urlPath, method: 'GET' },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      }
    );
    req.on('error', reject);
    req.end();
  });
}

describe('activity server', () => {
  before(async () => {
    address = await server.listen(0);
  });

  it('serves health, pages, shared client files, and redirects', async () => {
    const base = `http://127.0.0.1:${address.port}`;

    const health = await fetch(`${base}/health`);
    assert.deepEqual(await health.json(), {
      status: 'ok',
      version: '9.9.9',
      activity: 'fixture',
    });

    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Activity/);

    const shared = await fetch(`${base}/activity-common/socket.js`);
    assert.equal(shared.status, 200);
    assert.match(await shared.text(), /export function createSocket/);

    const redirect = await fetch(`${base}/lobby`, { redirect: 'manual' });
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get('location'), '/');

    assert.equal(isInside(clientDir, path.join(clientDir, 'index.html')), true);
    assert.equal(isInside(clientDir, path.resolve(clientDir, '../package.json')), false);
    assert.equal(await requestStatus(address.port, '/../../package.json'), 404);
  });

  it('speaks JSON messages over the websocket', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${address.port}`);
    const messages = [];
    ws.on('message', (raw) => messages.push(JSON.parse(raw.toString())));
    await new Promise((resolve, reject) => {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
    await waitFor(() => messages.some((msg) => msg.type === 'ready'));

    ws.send(JSON.stringify({ type: 'echo', text: 'hi' }));
    await waitFor(() => messages.some((msg) => msg.type === 'echo' && msg.text === 'hi'));

    ws.send('not-json');
    await waitFor(() => messages.some((msg) => msg.code === 'invalid_json'));

    ws.send(JSON.stringify({ type: 'boom' }));
    await waitFor(() => messages.some((msg) => msg.code === 'nope'));
    ws.close();
  });
});

after(async () => {
  await server.close();
  fs.rmSync(clientDir, { recursive: true, force: true });
});

function waitFor(predicate) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > 2000) {
        clearInterval(timer);
        reject(new Error('timed out waiting for a message'));
      }
    }, 10);
  });
}
