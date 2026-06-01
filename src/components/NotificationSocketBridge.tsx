'use client';

import React, { useCallback } from 'react';
import { useNotifications, type AddNotificationPayload } from '../contexts/NotificationContext';
import {
  useNotificationSocket,
  type SocketNotificationPayload,
} from '../hooks/useNotificationSocket';
import { presentSocketNotification } from '../utils/presentSocketNotification';

/**
 * Maps a socket notification event to the shape expected by NotificationContext.
 */
function mapSocketToPayload(notification: SocketNotificationPayload): AddNotificationPayload {
  const id = String(notification.id);
  return {
    messageId: id,
    notification: {
      title: notification.title ?? 'Notification',
      body: notification.description ?? '',
    },
    data: {
      notification_id: id,
      title: notification.title,
      description: notification.description,
      created_at: notification.created_at,
      ...notification,
    },
  };
}

/**
 * Subscribes to the notification socket when the user is authenticated and
 * pushes each incoming notification into NotificationContext.
 * Mount once in the app (e.g. in _app or layout).
 */
export default function NotificationSocketBridge(): null {
  const { addNotification } = useNotifications();

  const handleNotification = useCallback(
    (notification: SocketNotificationPayload) => {
      addNotification(mapSocketToPayload(notification));
      presentSocketNotification(notification);
    },
    [addNotification]
  );

  useNotificationSocket({
    enabled: true,
    onNotification: handleNotification,
  });

  return null;
}
