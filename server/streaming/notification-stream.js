// src/pages/api/notification-stream.js
// SSE proxy for notification socket: client connects to this API; server connects to the
// notification Socket.IO server (e.g. on a machine with no internet) and streams events.
// Same pattern as cti-stomp-stream.
//
// Socket server contract (Laravel socket-server):
// - Auth: handshake.auth.token (Bearer JWT) → server verifies via AUTH_SERVER_URL/users/me.
// - On connect server emits 'connected'; client sends 'subscribe', server emits 'subscribed'.
// - Notifications: server emits 'notification' to sockets where socket.data.user_extension === notification.extension_id.
// - Path: default /socket.io; transports: websocket, polling.

import { io } from 'socket.io-client';

const KEEP_ALIVE_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 15000; // 15 seconds

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
};

const writeSSE = (res, obj) => {
  if (res.destroyed || res.closed) return;
  try {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
    if (res.flush) res.flush();
  } catch (err) {
    console.error('[notification-stream] writeSSE error:', err?.message);
  }
};

const sendErrorAndEnd = (res, message) => {
  res.writeHead(200, SSE_HEADERS);
  writeSSE(res, { type: 'error', message });
  res.end();
};

const buildChannels = (extensionId) => {
  const ch = ['notifications'];
  if (extensionId) ch.push(`extension.${extensionId}`);
  return ch;
};

// Normalize to raw JWT (no "Bearer " prefix). Socket server adds "Bearer " when calling AUTH_SERVER_URL/users/me.
const toRawToken = (token) =>
  String(token).trim().replace(/^Bearer\s+/i, '');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Server-side URL only (not NEXT_PUBLIC_); include protocol e.g. http://192.168.30.163:6001
  const rawUrl = process.env.NOTIFICATION_SOCKET_URL || process.env.PRIVATE_NOTIFICATION_SOCKET_URL;
  let socketUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (!socketUrl.startsWith('http://') && !socketUrl.startsWith('https://') && socketUrl) {
    socketUrl = `http://${socketUrl}`;
  }
  const isInvalid = !socketUrl || socketUrl === 'undefined' || socketUrl === 'null';
  if (isInvalid) {
    console.error('[notification-stream] NOTIFICATION_SOCKET_URL (or PRIVATE_NOTIFICATION_SOCKET_URL) not set. Set in .env.local (e.g. http://192.168.30.163:6001).');
    return sendErrorAndEnd(res, 'Notification socket URL not configured. Set NOTIFICATION_SOCKET_URL in server env.');
  }

  const { token: tokenParam, tokenB64, extensionId } = req.query;
  // Support token (plain or "Bearer xxx") or tokenB64 (base64url-encoded JWT) to avoid query-string corruption of +/ in JWT
  let rawToken = '';
  if (tokenB64 && typeof tokenB64 === 'string') {
    try {
      rawToken = Buffer.from(tokenB64, 'base64url').toString('utf8');
    } catch (e) {
      console.warn('[notification-stream] tokenB64 decode failed:', e?.message);
    }
  }
  if (!rawToken && tokenParam) {
    rawToken = toRawToken(tokenParam);
    // Fix query-string corruption: + often becomes space when sent in URL; JWT payload uses +. Restore + if token looks like JWT.
    if (rawToken && !rawToken.includes('+') && rawToken.includes(' ')) {
      const parts = rawToken.split('.');
      if (parts.length === 3) {
        rawToken = parts.map((p) => p.replace(/ /g, '+')).join('.');
      }
    }
  }
  if (!rawToken) {
    return sendErrorAndEnd(res, 'Missing or invalid token (use token or tokenB64 query param).');
  }

  res.writeHead(200, SSE_HEADERS);

  writeSSE(res, { type: 'connecting', message: 'Connecting to notification server...' });

  const baseUrl = socketUrl.replace(/\/+$/, '');
  // Socket.IO path (default /socket.io) – your server uses default, so path is /socket.io
  const socketPath = process.env.NOTIFICATION_SOCKET_PATH || '/socket.io';
  const transports = (process.env.NOTIFICATION_SOCKET_TRANSPORTS || 'websocket,polling').split(',').map((t) => t.trim()).filter(Boolean);

  const socket = io(baseUrl, {
    path: socketPath,
    transports: transports.length ? transports : ['websocket', 'polling'],
    auth: { token: rawToken },
    reconnection: false,
    timeout: CONNECTION_TIMEOUT,
  });

  let cleanedUp = false;
  let keepAlive = null;

  const safeCleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    clearTimeout(connectionTimeout);
    if (keepAlive != null) {
      clearInterval(keepAlive);
      keepAlive = null;
    }
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (e) {
      console.warn('[notification-stream] cleanup:', e?.message);
    }
  };

  const connectionTimeout = setTimeout(() => {
    if (!socket.connected) {
      console.warn('[notification-stream] connection timeout');
      writeSSE(res, { type: 'error', message: 'Connection timeout to notification server' });
      safeCleanup();
    }
  }, CONNECTION_TIMEOUT);

  socket.on('connect', () => {
    clearTimeout(connectionTimeout);
    const channels = buildChannels(extensionId);
    if (process.env.NODE_ENV === 'development') {
      console.log('[notification-stream] connected, subscribe', channels);
    }
    socket.emit('subscribe', channels);
    writeSSE(res, { type: 'connected', message: 'Connected', socketId: socket.id });
  });

  socket.on('connected', (msg) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[notification-stream] server connected event', msg?.message ?? msg);
    }
  });

  socket.on('subscribed', (data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[notification-stream] subscribed', data?.channels ?? data);
    }
    writeSSE(res, { type: 'subscribed', channels: data?.channels ?? data });
  });

  socket.on('notification', (notification) => {
    writeSSE(res, { type: 'notification', data: notification });
  });

  socket.on('connect_error', (err) => {
    const msg = err?.message || 'Connection failed';
    const detail = err?.description || (err?.context ? String(err.context) : '');
    console.error('[notification-stream] connect_error', msg, detail || '');
    writeSSE(res, {
      type: 'error',
      message: msg === 'xhr poll error' || msg.includes('ENOTFOUND')
        ? 'Cannot reach notification server. Check NOTIFICATION_SOCKET_URL and that the socket server is running.'
        : msg,
    });
    safeCleanup();
  });

  socket.on('disconnect', (reason) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[notification-stream] disconnect', reason);
    }
    writeSSE(res, { type: 'disconnected', reason });
  });

  keepAlive = setInterval(() => {
    if (!res.destroyed && !res.closed) writeSSE(res, { type: 'ping', timestamp: Date.now() });
    else safeCleanup();
  }, KEEP_ALIVE_INTERVAL);

  res.on('close', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[notification-stream] client closed');
    }
    safeCleanup();
  });
  res.on('finish', safeCleanup);
  res.on('error', (err) => {
    console.error('[notification-stream] response error', err?.message);
    safeCleanup();
  });

  req.on('aborted', safeCleanup);
  req.on('close', safeCleanup);
}
