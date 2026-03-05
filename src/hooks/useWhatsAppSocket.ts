'use client';

import { useEffect, useRef } from 'react';
import { useAppSocket } from './useAppSocket';

/** Payload from socket server for WhatsApp events (from Laravel broadcast) */
export interface WhatsAppSocketPayload {
  whats_app_chat_id?: number | string;
  message_sid?: string;
  id?: number;
  direction?: 'inbound' | 'outbound';
  message?: string;
  message_type?: string;
  content_sid?: string;
  status?: string;
  from_number?: string;
  to_number?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface UseWhatsAppSocketCallbacks {
  onMessageReceived?: (payload: WhatsAppSocketPayload) => void;
  onStatusUpdated?: (payload: WhatsAppSocketPayload) => void;
}

export interface UseWhatsAppSocketOptions {
  moduleSlug?: string;
  /** Currently selected chat id – subscribe to whatsapp.chat.{selectedChat} */
  selectedChatId: number | null;
  callbacks: UseWhatsAppSocketCallbacks;
}

/**
 * WhatsApp-specific socket hook. Uses shared useAppSocket, subscribes to
 * 'whatsapp' and 'whatsapp.chat.{selectedChatId}', and forwards
 * whatsapp.message.received / whatsapp.message.status.updated to callbacks.
 */
export function useWhatsAppSocket(options: UseWhatsAppSocketOptions) {
  const { moduleSlug, selectedChatId, callbacks } = options;
  const { socket, isConnected, error, subscribe, unsubscribe } = useAppSocket({
    moduleSlug,
    enabled: true,
  });
  const prevChatRef = useRef<number | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Subscribe to general whatsapp channel when connected
  useEffect(() => {
    if (!isConnected || !socket) return;
    subscribe('whatsapp');
    return () => {
      unsubscribe('whatsapp');
    };
  }, [isConnected, socket, subscribe, unsubscribe]);

  // Subscribe / unsubscribe to chat-specific channel when selectedChatId changes
  useEffect(() => {
    if (!isConnected || !socket) return;

    const prev = prevChatRef.current;
    if (prev != null && prev !== selectedChatId) {
      unsubscribe(`whatsapp.chat.${prev}`);
    }
    prevChatRef.current = selectedChatId;

    if (selectedChatId != null) {
      subscribe(`whatsapp.chat.${selectedChatId}`);
    }

    return () => {
      if (selectedChatId != null) {
        unsubscribe(`whatsapp.chat.${selectedChatId}`);
      }
      prevChatRef.current = null;
    };
  }, [isConnected, socket, selectedChatId, subscribe, unsubscribe]);

  // Event listeners for WhatsApp events
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (payload: WhatsAppSocketPayload) => {
      callbacksRef.current.onMessageReceived?.(payload);
    };
    const handleStatusUpdated = (payload: WhatsAppSocketPayload) => {
      callbacksRef.current.onStatusUpdated?.(payload);
    };

    socket.on('whatsapp.message.received', handleMessageReceived);
    socket.on('whatsapp.message.status.updated', handleStatusUpdated);

    return () => {
      socket.off('whatsapp.message.received', handleMessageReceived);
      socket.off('whatsapp.message.status.updated', handleStatusUpdated);
    };
  }, [socket]);

  return {
    isConnected,
    error,
  };
}
