'use client';

import React from 'react';
import { useNotifications, type AddNotificationPayload } from '../contexts/NotificationContext';
import { useNotificationSocket, SocketNotificationPayload } from '../hooks/useNotificationSocket';

/**
 * Maps socket notification payload to AddNotificationPayload and adds it via addNotification.
 */
function socketNotificationToPayload(notification: SocketNotificationPayload): AddNotificationPayload {
  return {
    messageId: notification.id,
    notification: {
      title: notification.title || 'Notification',
      body: notification.description ?? '',
    },
    data: {
      notification_id: notification.id,
      title: notification.title,
      description: notification.description,
      created_at: notification.created_at,
      ...notification,
    },
  };
}

/**
 * Connects the notification Socket.IO when the user is logged in, subscribes to
 * 'notifications' and 'extension.<session.user.phone>', and pushes each incoming
 * notification into NotificationContext so it appears in the UI.
 * Mount this inside a layout that is only rendered for authenticated users (e.g. main Layout).
 */
export default function NotificationSocketBridge() {
  const { addNotification } = useNotifications();

  useNotificationSocket({
    enabled: true,
    onNotification: (notification) => {
      addNotification(socketNotificationToPayload(notification));
    },
  });

  return null;
}
