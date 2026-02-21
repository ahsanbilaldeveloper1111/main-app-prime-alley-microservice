import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AddNotificationPayload {
  messageId?: string;
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
  };
  data?: Record<string, unknown>;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  description?: string;
  module?: string;
  timestamp: Date;
  data?: Record<string, unknown>;
  read: boolean;
  icon?: string;
  url?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (payload: AddNotificationPayload) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 100;

// -----------------------------------------------------------------------------
// Storage helpers
// -----------------------------------------------------------------------------

function saveToStorage(notifications: NotificationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = notifications.map((n) => ({
      ...n,
      timestamp: n.timestamp.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // Ignore storage errors
  }
}

function loadFromStorage(): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Array<NotificationItem & { timestamp: string }>;
    return parsed.map((n) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// Payload → Notification mapping
// -----------------------------------------------------------------------------

function payloadToItem(payload: AddNotificationPayload, notificationId: string): NotificationItem {
  const title = String(payload.data?.title ?? payload.notification?.title ?? 'New Notification');
  const description = String(payload.data?.description ?? payload.notification?.body ?? '');
  const body = String(payload.notification?.body ?? payload.data?.description ?? '');
  const module = String(payload.data?.module ?? '');
  const timestamp = payload.data?.created_at
    ? new Date(String(payload.data.created_at))
    : new Date();

  return {
    id: notificationId,
    title,
    body,
    description,
    module,
    timestamp,
    data: payload.data,
    read: false,
    icon: payload.notification?.icon,
    url: payload.data?.url != null ? String(payload.data.url) : undefined,
  };
}

function resolveNotificationId(payload: AddNotificationPayload): string {
  return String(
    payload.messageId ??
      payload.data?.notification_id ??
      payload.data?.messageId ??
      `notification-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  );
}

function sameIdAndTarget(item: NotificationItem, id: string, targetType: string): boolean {
  const itemTarget = String((item.data as { target_type?: string } | undefined)?.target_type ?? '');
  return item.id === id && itemTarget === targetType;
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps): React.ReactElement {
  const [notifications, setNotifications] = useState<NotificationItem[]>(loadFromStorage);

  useEffect(() => {
    if (notifications.length > 0 || localStorage.getItem(STORAGE_KEY) !== null) {
      saveToStorage(notifications);
    }
  }, [notifications]);

  const addNotification = useCallback((payload: AddNotificationPayload) => {
    const notificationId = resolveNotificationId(payload);
    const targetType = String(payload.data?.target_type ?? '');
    const item = payloadToItem(payload, notificationId);

    setNotifications((prev) => {
      const filtered = prev.filter((n) => !sameIdAndTarget(n, notificationId, targetType));
      return [item, ...filtered].slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
