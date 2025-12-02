import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { NotificationPayload } from '@services/fcmService';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  description?: string;
  module?: string;
  timestamp: Date;
  data?: { [key: string]: string };
  read: boolean;
  icon?: string;
  url?: string;
}

const STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 100; // Limit stored notifications

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (payload: NotificationPayload) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Helper functions for localStorage
const saveNotificationsToStorage = (notifications: NotificationItem[]): void => {
  if (globalThis.window === undefined) {
    console.log('[NotificationContext] Window undefined, skipping save');
    return;
  }
  
  try {
    // Convert Date objects to ISO strings for storage
    const serialized = notifications.map((notif) => ({
      ...notif,
      timestamp: notif.timestamp.toISOString(),
    }));
    const jsonString = JSON.stringify(serialized);
    localStorage.setItem(STORAGE_KEY, jsonString);
    const unreadCount = notifications.filter(n => !n.read).length;
    console.log('[NotificationContext] Saved', notifications.length, 'notifications to localStorage (', unreadCount, 'unread)');
    
    // Verify it was saved correctly
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[NotificationContext] Verified localStorage has', parsed.length, 'notifications');
    }
  } catch (error) {
    console.error('[NotificationContext] Failed to save notifications to localStorage:', error);
  }
};

const loadNotificationsFromStorage = (): NotificationItem[] => {
  if (globalThis.window === undefined) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Convert ISO strings back to Date objects
    return parsed.map((notif: any) => ({
      ...notif,
      timestamp: new Date(notif.timestamp),
    }));
  } catch (error) {
    console.error('Failed to load notifications from localStorage:', error);
    return [];
  }
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // Load notifications from localStorage on mount
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return loadNotificationsFromStorage();
  });

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    // Only save if we have notifications (avoid saving empty array on initial mount before any notifications)
    if (notifications.length > 0 || localStorage.getItem(STORAGE_KEY) !== null) {
      saveNotificationsToStorage(notifications);
    }
  }, [notifications]);

  const addNotification = useCallback((payload: NotificationPayload) => {
    console.log('[NotificationContext] addNotification called with payload:', payload);
    
    // Extract notification ID - check multiple sources for uniqueness
    // Priority: payload.messageId (Firebase's unique ID) > data.notification_id > data.messageId > generated
    const notificationId = payload.messageId 
      || payload.data?.notification_id 
      || payload.data?.messageId 
      || `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${performance.now()}`;
    
    console.log('[NotificationContext] Using notification ID:', notificationId);
    
    // Get title from data.title (preferred) or notification.title
    const title = payload.data?.title || payload.notification?.title || 'New Notification';
    
    // Get description from data.description (preferred) or notification.body
    const description = payload.data?.description || payload.notification?.body || '';
    
    // Get module from data.module
    const notificationModule = payload.data?.module || '';
    
    // Get body for backward compatibility
    const body = payload.notification?.body || payload.data?.description || '';

    const notification: NotificationItem = {
      id: notificationId,
      title,
      body,
      description,
      module: notificationModule,
      timestamp: payload.data?.created_at ? new Date(payload.data.created_at) : new Date(),
      data: payload.data,
      read: false,
      icon: payload.notification?.icon,
      url: payload.data?.url,
    };

    console.log('[NotificationContext] Created notification object:', notification);

    setNotifications((prev) => {
      // Check if notification with same ID already exists to prevent duplicates
      const exists = prev.some((n) => n.id === notificationId);
      if (exists) {
        console.log('[NotificationContext] Notification already exists, skipping:', notificationId, 'Current count:', prev.length, 'Unread:', prev.filter(n => !n.read).length);
        return prev;
      }
      
      // Add new notification and limit to MAX_NOTIFICATIONS
      const updated = [notification, ...prev];
      const limited = updated.slice(0, MAX_NOTIFICATIONS);
      const unreadCount = limited.filter(n => !n.read).length;
      console.log('[NotificationContext] Adding notification. ID:', notificationId, 'Total count:', limited.length, 'Unread count:', unreadCount, 'Previous count:', prev.length);
      console.log('[NotificationContext] Notification IDs:', limited.map(n => n.id).slice(0, 5));
      return limited;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
    }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotification, clearAllNotifications]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

