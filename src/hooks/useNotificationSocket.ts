'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTokenService } from './useTokenService';
import { useSession } from 'next-auth/react';

/** Same socket server as WhatsApp; can override with NEXT_PUBLIC_NOTIFICATION_SOCKET_URL. */
const SOCKET_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_SOCKET_URL ||
  process.env.NEXT_PUBLIC_WHATSAPP_SOCKET_URL;

type ConnectionStateListener = (connected: boolean, error: string | null) => void;

let notificationSocket: Socket | null = null;
let refCount = 0;
const connectionListeners = new Set<ConnectionStateListener>();

function notifyConnectionState(connected: boolean, error: string | null) {
  connectionListeners.forEach((cb) => cb(connected, error));
}

function getOrCreateNotificationSocket(getAccessToken: () => string | null): Socket | null {
  if (notificationSocket?.connected) return notificationSocket;
  const token = getAccessToken();
  if (!token || !SOCKET_URL) return null;

  if (notificationSocket) {
    if (!notificationSocket.connected) notificationSocket.connect();
    return notificationSocket;
  }

  const socket = io(SOCKET_URL, {
    path: '/socket.io/',
    auth: { token: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
    transports: ['polling', 'websocket'],
  });

  socket.on('connect', () => notifyConnectionState(true, null));
  socket.on('disconnect', () => notifyConnectionState(false, null));
  socket.on('connect_error', (err) => notifyConnectionState(false, err.message || 'Connection failed'));

  notificationSocket = socket;
  return socket;
}

function releaseNotificationSocket() {
  refCount--;
  if (refCount <= 0) {
    refCount = 0;
    if (notificationSocket) {
      notificationSocket.removeAllListeners();
      notificationSocket.disconnect();
      notificationSocket = null;
    }
    notifyConnectionState(false, null);
  }
}

/**
 * Shape of the notification event from the socket (matches GET /api/notifications dataList items).
 */
export interface SocketNotificationPayload {
  id: string;
  extension_id?: string;
  triggered_by_extension_id?: string;
  source_service?: string;
  action?: string;
  target_id?: string;
  target_type?: string;
  changes?: Record<string, unknown>;
  description?: string;
  title?: string;
  priority?: string;
  status?: string;
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
}

/**
 * Global notification socket: one connection per app (per tab) when user is logged in.
 * Same pattern as useAppSocket. Connects to the same socket server (or NOTIFICATION_SOCKET_URL).
 * Subscribes to 'notifications' and 'extension.<session.user.phone>'; forwards 'notification' events.
 * Does not touch WhatsApp (useAppSocket / useWhatsAppSocket).
 */
export function useNotificationSocket(
  options: UseNotificationSocketOptions = {}
): UseNotificationSocketReturn {
  const { onNotification, enabled = true } = options;
  const { data: session, status } = useSession();
  const { getAccessToken } = useTokenService();
  const [socket, setSocketState] = useState<Socket | null>(null);
  const [isConnected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<ConnectionStateListener | null>(null);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  const extensionId = (session?.user as { phone?: string } | undefined)?.phone ?? undefined;

  const subscribe = useCallback((channels: string | string[]) => {
    const s = notificationSocket;
    if (!s?.connected) return;
    const list = Array.isArray(channels) ? channels : [channels];
    s.emit('subscribe', list);
  }, []);

  useEffect(() => {
    const shouldConnect =
      enabled &&
      status === 'authenticated' &&
      !!session &&
      !!getAccessToken();

    if (!shouldConnect) return;

    refCount++;
    const listener: ConnectionStateListener = (connected, err) => {
      setConnected(connected);
      setError(err);
    };
    listenerRef.current = listener;
    connectionListeners.add(listener);

    const sock = getOrCreateNotificationSocket(getAccessToken);
    if (sock) {
      setSocketState(sock);
      setConnected(sock.connected);
      setError(null);

      const handleNotification = (payload: SocketNotificationPayload) => {
        onNotificationRef.current?.(payload);
      };
      sock.on('notification', handleNotification);

      const onConnect = () => {
        setConnected(true);
        setError(null);
        const ch: string[] = ['notifications'];
        if (extensionId) ch.push(`extension.${extensionId}`);
        sock.emit('subscribe', ch);
      };
      const onDisconnect = () => setConnected(false);
      const onConnectError = (err: Error) => {
        setConnected(false);
        setError(err?.message || 'Connection failed');
      };

      sock.on('connect', onConnect);
      sock.on('disconnect', onDisconnect);
      sock.on('connect_error', onConnectError);

      if (sock.connected) {
        const ch: string[] = ['notifications'];
        if (extensionId) ch.push(`extension.${extensionId}`);
        sock.emit('subscribe', ch);
      }

      return () => {
        sock.off('notification', handleNotification);
        sock.off('connect', onConnect);
        sock.off('disconnect', onDisconnect);
        sock.off('connect_error', onConnectError);
        connectionListeners.delete(listener);
        listenerRef.current = null;
        releaseNotificationSocket();
        setSocketState(null);
        setConnected(false);
        setError(null);
      };
    }

    return () => {
      connectionListeners.delete(listener);
      listenerRef.current = null;
      releaseNotificationSocket();
      setSocketState(null);
      setConnected(false);
      setError(null);
    };
  }, [enabled, status, session, extensionId, getAccessToken]);

  return {
    socket,
    isConnected,
    error,
    subscribe,
  };
}
