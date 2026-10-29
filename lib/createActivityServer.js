const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function isInside(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const rootWithSep = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(rootWithSep);
}

function createActivityServer({
  clientDir,
  sharedClientDir = null,
  sharedClientMount = '/activity-common',
  version = '0.0.0',
  activityName = 'activity',
  routes = {},
  redirects = {},
  onConnection = () => {},
  onMessage = () => {},
  onSocketClose = () => {},
} = {}) {
  if (!clientDir) {
    throw new Error('clientDir is required');
  }

  const resolvedClientDir = path.resolve(clientDir);
  const resolvedSharedDir = sharedClientDir ? path.resolve(sharedClientDir) : null;
  const mount = sharedClientMount.startsWith('/') ? sharedClientMount : `/${sharedClientMount}`;

  function send(ws, payload) {
    if (!ws || ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify(payload));
  }

  function broadcast(payload) {
    const raw = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) client.send(raw);
    }
  }

  function json(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  }

  function serveFile(res, filePath, root) {
    if (!isInside(root, filePath)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const urlPath = url.pathname;

    if (urlPath === '/health') {
      json(res, 200, { status: 'ok', version, activity: activityName });
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405);
      res.end('Method Not Allowed');
      return;
    }

    const query = url.search || '';
    if (redirects[urlPath]) {
      res.writeHead(302, { Location: `${redirects[urlPath]}${query}` });
      res.end();
      return;
    }

    if (resolvedSharedDir && (urlPath === mount || urlPath.startsWith(`${mount}/`))) {
      const rel = urlPath.slice(mount.length).replace(/^\/+/, '');
      serveFile(res, path.resolve(resolvedSharedDir, rel), resolvedSharedDir);
      return;
    }

    const routeFile = routes[urlPath];
    const filePath = routeFile
      ? path.resolve(resolvedClientDir, routeFile)
      : path.resolve(resolvedClientDir, `.${urlPath}`);
    serveFile(res, filePath, resolvedClientDir);
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    const ctx = {
      ws,
      send: (payload) => send(ws, payload),
      broadcast,
    };
    onConnection(ctx);

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: 'error', code: 'invalid_json', message: 'Invalid JSON' });
        return;
      }
      if (!msg || typeof msg.type !== 'string' || !msg.type) {
        send(ws, { type: 'error', code: 'invalid_message', message: 'Message type is required.' });
        return;
      }
      try {
        onMessage(ctx, msg);
      } catch (err) {
        send(ws, {
          type: 'error',
          code: err.code || 'error',
          message: err.message || 'Request failed.',
        });
      }
    });

    ws.on('close', () => {
      onSocketClose(ctx);
    });
  });

  function listen(port = 0, host = '127.0.0.1') {
    return new Promise((resolve, reject) => {
      const onError = (err) => reject(err);
      server.once('error', onError);
      server.listen(port, host, () => {
        server.removeListener('error', onError);
        resolve(server.address());
      });
    });
  }

  function close() {
    for (const client of wss.clients) {
      client.close();
    }
    return new Promise((resolve, reject) => {
      wss.close();
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  return { server, wss, send, broadcast, json, listen, close };
}

module.exports = { createActivityServer, isInside };
