'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useTokenService } from './useTokenService';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

// Resolution order mirrors the original Next.js setup:
//   1. dedicated notification socket URL (preferred)
//   2. shared WhatsApp/notification socket URL (legacy fallback)
// `import.meta.env.VITE_*` is the canonical Vite source; `process.env.NEXT_PUBLIC_*`
// is kept as a fallback for any deployment still using the legacy keys (the Vite
// config mirrors NEXT_PUBLIC_* onto process.env at build time).
const viteEnv = (import.meta.env ?? {}) as Record<string, string | undefined>;
const SOCKET_URL =
  viteEnv.VITE_NOTIFICATION_SOCKET_URL ||
  viteEnv.VITE_WHATSAPP_SOCKET_URL ||
  process.env.NEXT_PUBLIC_NOTIFICATION_SOCKET_URL ||
  process.env.NEXT_PUBLIC_WHATSAPP_SOCKET_URL;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ConnectionStateListener = (connected: boolean, error: string | null) => void;

/** Notification event payload from the socket (matches API notification shape). */
export interface SocketNotificationPayload {
  id: string | number;
  extension_id?: string | number;
  triggered_by_extension_id?: string | number | null;
  tenant_id?: string | null;
  source_service?: string | null;
  action?: string;
  target_id?: string | number;
  target_type?: string;
  module?: string;
  changes?: Record<string, unknown> | null;
  description?: string;
  title?: string;
  priority?: string;
  status?: string | null;
  ringtone?: string | null;
  popup?: boolean | null;
  in_app?: boolean;
  push_notification?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface UseNotificationSocketOptions {
  onNotification?: (payload: SocketNotificationPayload) => void;
  enabled?: boolean;
}

export interface UseNotificationSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  subscribe: (channels: string | string[]) => void;
  unsubscribe: (channels: string | string[]) => void;
}

// -----------------------------------------------------------------------------
// Module state (single shared socket per tab)
// -----------------------------------------------------------------------------

let sharedSocket: Socket | null = null;
let refCount = 0;
const connectionListeners = new Set<ConnectionStateListener>();

function broadcastState(connected: boolean, error: string | null): void {
  connectionListeners.forEach((cb) => cb(connected, error));
}

// -----------------------------------------------------------------------------
// Socket lifecycle
// -----------------------------------------------------------------------------

function getOrCreateSocket(getAccessToken: () => string | null): Socket | null {
  if (sharedSocket?.connected) return sharedSocket;

  const token = getAccessToken();
  console.log("NOTIF", token, SOCKET_URL, sharedSocket)
  if (!token || !SOCKET_URL) return null;

  if (sharedSocket) {
    if (!sharedSocket.connected) sharedSocket.connect();
    return sharedSocket;
  }

  const socket = io(SOCKET_URL, {
    auth: { token, module_slug: '' },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => broadcastState(true, null));
  socket.on('disconnect', () => broadcastState(false, null));
  socket.on('connect_error', (err: Error) =>
    broadcastState(false, err?.message ?? 'Connection failed')
  );

  sharedSocket = socket;
  return socket;
}

function releaseSocket(): void {
  refCount--;
  if (refCount <= 0) {
    refCount = 0;
    if (sharedSocket) {
      sharedSocket.removeAllListeners();
      sharedSocket.disconnect();
      sharedSocket = null;
    }
    broadcastState(false, null);
  }
}

function getSubscriptionChannels(extensionId: string | undefined): string[] {
  const channels = ['notifications'];
  if (extensionId) channels.push(`extension.${extensionId}`);
  return channels;
}

function emitSubscribe(socket: Socket, extensionId: string | undefined): void {
  socket.emit('subscribe', getSubscriptionChannels(extensionId));
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

/**
 * Shared notification socket: one connection per tab when the user is authenticated.
 * Subscribes to `notifications` and `extension.<phone>`; forwards `notification` events.
 */
export function useNotificationSocket(
  options: UseNotificationSocketOptions = {}
): UseNotificationSocketReturn {
  const { onNotification, enabled = true } = options;
  const { data: session, status } = useSession();
  const { getAccessToken } = useTokenService();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<ConnectionStateListener | null>(null);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  const extensionId = (session?.user as { phone?: string } | undefined)?.phone ?? undefined;

  const subscribe = useCallback((channels: string | string[]) => {
    if (!sharedSocket?.connected) return;
    const list = Array.isArray(channels) ? channels : [channels];
    sharedSocket.emit('subscribe', list);
  }, []);

  const unsubscribe = useCallback((channels: string | string[]) => {
    if (!sharedSocket?.connected) return;
    const list = Array.isArray(channels) ? channels : [channels];
    sharedSocket.emit('unsubscribe', list);
  }, []);

  useEffect(() => {
    const isAuthenticated =
      enabled &&
      status === 'authenticated' &&
      Boolean(session) &&
      Boolean(getAccessToken());

    if (!isAuthenticated) return;

    refCount++;
    const listener: ConnectionStateListener = (connected, err) => {
      setConnected(connected);
      setError(err);
    };
    listenerRef.current = listener;
    connectionListeners.add(listener);

    const sock = getOrCreateSocket(getAccessToken);

    const cleanup = (): void => {
      connectionListeners.delete(listener);
      listenerRef.current = null;
      releaseSocket();
      setSocket(null);
      setConnected(false);
      setError(null);
    };

    if (!sock) {
      return cleanup;
    }

    setSocket(sock);
    setConnected(sock.connected);
    setError(null);

    const handleNotification = (payload: SocketNotificationPayload) => {
      onNotificationRef.current?.(payload);
    };

    const onConnect = (): void => {
      setConnected(true);
      setError(null);
      emitSubscribe(sock, extensionId);
    };

    const onDisconnect = (): void => setConnected(false);

    const onConnectError = (err: Error): void => {
      setConnected(false);
      setError(err?.message ?? 'Connection failed');
    };

    sock.on('notification', handleNotification);
    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('connect_error', onConnectError);

    if (sock.connected) {
      emitSubscribe(sock, extensionId);
    }

    return () => {
      sock.off('notification', handleNotification);
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('connect_error', onConnectError);
      cleanup();
    };
  }, [enabled, status, session, extensionId, getAccessToken]);

  return {
    socket,
    isConnected,
    error,
    subscribe,
    unsubscribe,
  };
}
