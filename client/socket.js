export function socketUrl() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}`;
}

export function createSocket() {
  return new WebSocket(socketUrl());
}

export function send(ws, payload) {
  ws.send(JSON.stringify(payload));
}

export function waitForOpen(ws) {
  if (ws.readyState === WebSocket.OPEN) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const fail = () => reject(new Error('WebSocket failed to open'));
    ws.addEventListener('open', () => resolve(), { once: true });
    ws.addEventListener('error', fail, { once: true });
  });
}
