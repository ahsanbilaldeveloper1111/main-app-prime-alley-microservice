'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTokenService } from './useTokenService';
import { useSession } from 'next-auth/react';

// Vite-first lookup with a NEXT_PUBLIC_* fallback so deployments that still
// ship the legacy key keep working.
const viteEnv = (import.meta.env ?? {}) as Record<string, string | undefined>;
const SOCKET_URL =
  viteEnv.VITE_WHATSAPP_SOCKET_URL ||
  process.env.NEXT_PUBLIC_WHATSAPP_SOCKET_URL;

type ConnectionStateListener = (connected: boolean, error: string | null) => void;

let sharedSocket: Socket | null = null;
let refCount = 0;
const connectionListeners = new Set<ConnectionStateListener>();

function notifyConnectionState(connected: boolean, error: string | null) {
  connectionListeners.forEach((cb) => cb(connected, error));
}

function getOrCreateSocket(
  getAccessToken: () => string | null,
  moduleSlug?: string
): Socket | null {
  if (sharedSocket?.connected) return sharedSocket;
  const token = getAccessToken();
  if (!token || !SOCKET_URL) return null;

  if (sharedSocket) {
    if (!sharedSocket.connected) sharedSocket.connect();
    return sharedSocket;
  }

  const socket = io(SOCKET_URL, {
    auth: {
      token,
      module_slug: moduleSlug || '',
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    notifyConnectionState(true, null);
  });

  socket.on('disconnect', () => {
    notifyConnectionState(false, null);
  });

  socket.on('connect_error', (err) => {
    notifyConnectionState(false, err.message || 'Connection failed');
  });

  sharedSocket = socket;
  return socket;
}

function releaseSocket() {
  refCount--;
  if (refCount <= 0) {
    refCount = 0;
    if (sharedSocket) {
      sharedSocket.removeAllListeners();
      sharedSocket.disconnect();
      sharedSocket = null;
    }
    notifyConnectionState(false, null);
  }
}

export interface UseAppSocketOptions {
  /** Optional module slug sent to server for token verification (e.g. /users/me?module_slug=...) */
  moduleSlug?: string;
  /** If true, connect only when this is true. Default: connect when authenticated. */
  enabled?: boolean;
}

export interface UseAppSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  subscribe: (channels: string | string[]) => void;
  unsubscribe: (channels: string | string[]) => void;
}

/**
 * Shared socket hook: one connection per app (per tab). JWT-authenticated.
 * Use for WhatsApp, notifications, and other features that use the same socket server.
 * Connect when authenticated; disconnect when no consumer is mounted (ref-counted).
 */
export function useAppSocket(options: UseAppSocketOptions = {}): UseAppSocketReturn {
  const { moduleSlug, enabled = true } = options;
  const { data: session, status } = useSession();
  const { getAccessToken } = useTokenService();
  const [socket, setSocketState] = useState<Socket | null>(null);
  const [isConnected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<ConnectionStateListener | null>(null);

  const subscribe = useCallback((channels: string | string[]) => {
    const s = sharedSocket;
    if (!s?.connected) return;
    const list = Array.isArray(channels) ? channels : [channels];
    s.emit('subscribe', list);
  }, []);

  const unsubscribe = useCallback((channels: string | string[]) => {
    const s = sharedSocket;
    if (!s?.connected) return;
    const list = Array.isArray(channels) ? channels : [channels];
    s.emit('unsubscribe', list);
  }, []);

  useEffect(() => {
    const shouldConnect =
      enabled &&
      status === 'authenticated' &&
      !!session &&
      !!getAccessToken();

    if (!shouldConnect) {
      return;
    }

    refCount++;
    const listener: ConnectionStateListener = (connected, err) => {
      setConnected(connected);
      setError(err);
    };
    listenerRef.current = listener;
    connectionListeners.add(listener);

    const sock = getOrCreateSocket(getAccessToken, moduleSlug);
    if (sock) {
      setSocketState(sock);
      setConnected(sock.connected);
      setError(null);
    }

    return () => {
      connectionListeners.delete(listener);
      listenerRef.current = null;
      releaseSocket();
      setSocketState(null);
      setConnected(false);
      setError(null);
    };
  }, [enabled, status, session, moduleSlug, getAccessToken]);

  return {
    socket,
    isConnected,
    error,
    subscribe,
    unsubscribe,
  };
}
