/**
 * Finesse WS stream API: client connects via SSE; server proxies to Finesse via SockJS/STOMP.
 * Same pattern as cti-stomp-stream. Streams state, errors, and optional preview dialog events.
 *
 * Env: FINESSE_WS_BACKEND or NEXT_PUBLIC_FINESSE_WS_BASE (e.g. http://192.168.30.137:8010).
 *
 * 502 with app on SSL: reverse proxy (nginx/Apache) in front of Next.js is closing long-lived
 * SSE. Fix: disable buffering and set long timeouts for this path. See
 * docs/FINESSE-WS-STREAM-502-FIX.md and ci/nginx-finesse-ws-stream.conf.example.
 *
 * Production fix: In production build, Next may bundle sockjs-client with its "browser" driver,
 * which relies on global.WebSocket (undefined in Node). Polyfill it with the "ws" package so
 * SockJS can connect and receive socket events.
 */
import { Client } from '@stomp/stompjs';

// Ensure Node has WebSocket for sockjs-client when this API route runs in production.
// The browser build of sockjs-client expects (1) global.WebSocket and (2) message/close
// handlers to receive browser-style events (e.data, e.code, e.reason). The "ws" package
// passes (data) and (code, reason) directly. Wrap "ws" so sockjs gets the expected shape.
if (typeof global !== 'undefined' && typeof global.WebSocket === 'undefined') {
  try {
    const Ws = require('ws');
    class NodeWebSocketBrowserAdapter {
      constructor(url, protocols) {
        this._ws = new Ws(url, protocols);
        this._ws.on('message', (data) => {
          if (this.onmessage) this.onmessage({ data });
        });
        this._ws.on('close', (code, reason) => {
          if (this.onclose) this.onclose({ code, reason: reason && reason.toString() });
        });
        this._ws.on('error', (err) => {
          if (this.onerror) this.onerror(err);
        });
      }
      send(data) {
        this._ws.send(data);
      }
      close() {
        this._ws.close();
      }
      get readyState() {
        return this._ws.readyState;
      }
    }
    global.WebSocket = NodeWebSocketBrowserAdapter;
  } catch (_) {
    // ignore if ws not available
  }
}

const KEEP_ALIVE_MS = 30_000;
const DEFAULT_BACKEND = 'http://localhost:8010';
const AUTH_REQUIRED_MESSAGE = 'Your session has expired or is invalid. Please log in again.';

/** SSE event types sent to the client */
const SSE_TYPE = {
  PING: 'ping',
  STATE: 'state',
  ERROR: 'error',
  PREVIEW: 'preview',
  STOMP_CONNECTED: 'stomp_connected',
  STOMP_CLOSED: 'stomp_closed',
  AUTH_REQUIRED: 'auth_required',
  STOMP_ERROR: 'stomp_error',
};

/** Headers for SSE; proxy-friendly so nginx/etc. don’t buffer or timeout and return 502 */
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate',
  'X-Accel-Buffering': 'no',
  Connection: 'keep-alive',
};

const connectionPool = new Map();
const sseStreams = new Map();
const connectionSubscriptions = new Map();
const subscriptionsSetup = new Set();

const isDev = process.env.NODE_ENV === 'development';

function log(...args) {
  if (isDev) console.log('[Finesse WS Stream]', ...args);
}

function topicPath(userId, suffix) {
  return `/topic/finesse/user/${userId}/${suffix}`;
}

function writeToStreams(connectionKey, data) {
  if (isDev && data?.type !== SSE_TYPE.PING) {
    console.log('[Finesse WS Stream] Outgoing:', connectionKey, data?.type, data);
  }
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const streams = sseStreams.get(connectionKey) || [];
  streams.forEach((res) => {
    if (res.destroyed || res.closed) return;
    try {
      res.write(payload);
      if (res.flush) res.flush();
    } catch {
      // ignore
    }
  });
}

function cleanupSubscriptions(connectionKey) {
  const subs = connectionSubscriptions.get(connectionKey) || [];
  subs.forEach((sub) => {
    try {
      sub?.unsubscribe?.();
    } catch {
      // ignore
    }
  });
  connectionSubscriptions.delete(connectionKey);
  subscriptionsSetup.delete(connectionKey);
}

function looksLikeAuthError(message = '', body = '') {
  const s = `${message} ${body}`.toLowerCase();
  return (
    s.includes('unauthorized') ||
    s.includes('token expired') ||
    (s.includes('invalid') && s.includes('token'))
  );
}

function parseAndForward(connectionKey, msg, eventType) {
  try {
    const payload = JSON.parse(msg.body);
    writeToStreams(connectionKey, { type: eventType, data: payload });
  } catch (e) {
    if (isDev) console.error(`[Finesse WS Stream] Parse failed (${eventType}):`, e?.message ?? e);
  }
}

function setupSubscriptions(client, connectionKey, finesseUserId, hasPreview) {
  if (subscriptionsSetup.has(connectionKey)) return;
  cleanupSubscriptions(connectionKey);

  const stateTopic = topicPath(finesseUserId, 'state');
  const errorTopic = topicPath(finesseUserId, 'errors');
  const previewTopic = topicPath(finesseUserId, 'preview');
  const userQueueState = '/user/queue/state';
  const userQueueErrors = '/user/queue/errors';
  const userQueuePreview = '/user/queue/preview';

  log('Subscribing:', finesseUserId, '→', stateTopic, errorTopic, hasPreview ? previewTopic : '(no preview)');

  const subs = [
    client.subscribe(stateTopic, (msg) => parseAndForward(connectionKey, msg, SSE_TYPE.STATE)),
    client.subscribe(errorTopic, (msg) => parseAndForward(connectionKey, msg, SSE_TYPE.ERROR)),
    client.subscribe(userQueueState, (msg) => parseAndForward(connectionKey, msg, SSE_TYPE.STATE)),
    client.subscribe(userQueueErrors, (msg) => parseAndForward(connectionKey, msg, SSE_TYPE.ERROR)),
  ];

  if (hasPreview) {
    subs.push(
      client.subscribe(previewTopic, (msg) => parseAndForward(connectionKey, msg, SSE_TYPE.PREVIEW)),
      client.subscribe(userQueuePreview, (msg) => parseAndForward(connectionKey, msg, SSE_TYPE.PREVIEW))
    );
  }

  connectionSubscriptions.set(connectionKey, subs);
  subscriptionsSetup.add(connectionKey);
}

function getSockJsUrl() {
  const base = process.env.FINESSE_WS_BACKEND || process.env.NEXT_PUBLIC_FINESSE_WS_BASE || DEFAULT_BACKEND;
  return base.endsWith('/ws') ? base : `${base.replace(/\/$/, '')}/ws`;
}

function sendSSEErrorAndEnd(res, connectionKey, message) {
  try {
    if (!res.headersSent) {
      res.writeHead(200, SSE_HEADERS);
    }
    res.write(`data: ${JSON.stringify({ type: SSE_TYPE.ERROR, message })}\n\n`);
  } catch {
    // ignore
  }
  try {
    res.end();
  } catch {
    // ignore
  }
  if (connectionKey) {
    const streams = sseStreams.get(connectionKey) || [];
    const idx = streams.indexOf(res);
    if (idx > -1) streams.splice(idx, 1);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, finesseUserId, preview = 'true' } = req.query;
  const hasPreview = preview === 'true' || preview === '1';
  const connectionKey = finesseUserId;

  log('SSE request — finesseUserId:', finesseUserId, 'preview:', hasPreview);

  if (!token || !finesseUserId) {
    res.writeHead(200, SSE_HEADERS);
    res.write(`data: ${JSON.stringify({ type: SSE_TYPE.ERROR, message: 'Missing token or finesseUserId' })}\n\n`);
    res.end();
    return;
  }

  try {
    res.writeHead(200, SSE_HEADERS);
    // Ensure headers are flushed immediately in production.
    if (res.flushHeaders) res.flushHeaders();
    // Reduce TCP buffering for low-latency streaming.
    try {
      res.socket?.setNoDelay?.(true);
      res.socket?.setKeepAlive?.(true);
    } catch {
      // ignore
    }
  } catch (err) {
    if (isDev) console.error('[Finesse WS Stream] writeHead failed:', err?.message ?? err);
    return res.status(500).json({ message: 'Failed to start stream' });
  }

  if (!sseStreams.has(connectionKey)) sseStreams.set(connectionKey, []);
  sseStreams.get(connectionKey).push(res);

  // Write an initial ping so intermediaries don't buffer an empty stream.
  try {
    res.write(`data: ${JSON.stringify({ type: SSE_TYPE.PING, timestamp: Date.now() })}\n\n`);
    if (res.flush) res.flush();
  } catch {
    // ignore
  }

  const keepAlive = setInterval(() => {
    if (res.destroyed || res.closed) {
      clearInterval(keepAlive);
      return;
    }
    try {
      res.write(`data: ${JSON.stringify({ type: SSE_TYPE.PING, timestamp: Date.now() })}\n\n`);
      if (res.flush) res.flush();
    } catch {
      clearInterval(keepAlive);
    }
  }, KEEP_ALIVE_MS);

  const cleanup = () => {
    clearInterval(keepAlive);
    const streams = sseStreams.get(connectionKey) || [];
    const idx = streams.indexOf(res);
    if (idx > -1) streams.splice(idx, 1);
    if (streams.length > 0) return;

    sseStreams.delete(connectionKey);
    cleanupSubscriptions(connectionKey);
    const conn = connectionPool.get(connectionKey);
    try {
      if (conn?.client?.connected) conn.client.deactivate();
    } catch {
      // ignore
    }
    connectionPool.delete(connectionKey);
  };

  req.on('aborted', cleanup);
  req.on('close', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);

  const existing = connectionPool.get(connectionKey);
  if (existing?.client?.connected) {
    existing.lastUsed = Date.now();
    setupSubscriptions(existing.client, connectionKey, finesseUserId, hasPreview);
    writeToStreams(connectionKey, { type: SSE_TYPE.STOMP_CONNECTED });
    return;
  }

  const sockJsUrl = getSockJsUrl();
  log('Connecting to backend:', sockJsUrl, 'user:', connectionKey);

  try {
    const { default: SockJS } = await import('sockjs-client');
    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: 5000,
      connectionTimeout: 10000,
      debug: isDev
        ? (str) => {
            const s = String(str);
            if (s.includes('CONNECTED') || s.includes('SUBSCRIBE') || s.includes('MESSAGE')) {
              console.log('[Finesse STOMP]', s.substring(0, 120));
            }
          }
        : () => {},
      onConnect: () => {
        connectionPool.set(connectionKey, {
          client,
          lastUsed: Date.now(),
          token,
          finesseUserId,
        });
        setupSubscriptions(client, connectionKey, finesseUserId, hasPreview);
        writeToStreams(connectionKey, { type: SSE_TYPE.STOMP_CONNECTED });
      },
      onStompError: (frame) => {
        const message = frame?.headers?.message ?? '';
        const body = frame?.body ?? '';
        if (looksLikeAuthError(message, body)) {
          writeToStreams(connectionKey, { type: SSE_TYPE.AUTH_REQUIRED, message: AUTH_REQUIRED_MESSAGE });
          try {
            cleanupSubscriptions(connectionKey);
            client.deactivate();
          } catch {
            // ignore
          }
          connectionPool.delete(connectionKey);
          return;
        }
        writeToStreams(connectionKey, { type: SSE_TYPE.STOMP_ERROR, message, body });
      },
      onWebSocketClose: () => {
        cleanupSubscriptions(connectionKey);
        const conn = connectionPool.get(connectionKey);
        if (conn?.client === client) connectionPool.delete(connectionKey);
        writeToStreams(connectionKey, { type: SSE_TYPE.STOMP_CLOSED });
      },
    });

    client.activate();
  } catch (err) {
    const msg = err?.message ?? String(err);
    if (isDev) console.error('[Finesse WS Stream] STOMP setup failed:', msg);
    cleanup();
    sendSSEErrorAndEnd(res, connectionKey, `Stream setup failed: ${msg}. Check FINESSE_WS_BACKEND (e.g. http://host:8010) and that the backend is reachable.`);
  }
}
