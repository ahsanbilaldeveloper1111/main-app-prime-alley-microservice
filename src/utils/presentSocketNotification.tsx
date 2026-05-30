import { createElement } from 'react'
import { toast, type ToastOptions } from 'react-toastify'
import {
  normalizeNotificationRingtone,
  playNotificationRingtone,
} from './notificationRingtonePlayer'
import type { SocketNotificationPayload } from '../hooks/useNotificationSocket'

const POPUP_TOAST_OPTIONS: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function resolveTitle(notification: SocketNotificationPayload): string {
  const title = notification.title?.trim()
  return title || 'Notification'
}

function resolveDescription(notification: SocketNotificationPayload): string {
  return notification.description?.trim() ?? ''
}

export function showSocketNotificationPopup(
  title: string,
  description: string,
  notificationId?: string | number,
): void {
  const toastId =
    notificationId == null ? undefined : `socket-notif-${notificationId}`
  toast.info(
    createElement(
      'div',
      { style: { lineHeight: 1.4 } },
      createElement(
        'div',
        { style: { fontWeight: 600, marginBottom: description ? 4 : 0, color: '#141414' } },
        title,
      ),
      description
        ? createElement('div', { style: { fontSize: 13, color: '#444' } }, description)
        : null,
    ),
    {
      ...POPUP_TOAST_OPTIONS,
      toastId,
    },
  )
}

/** Show an in-app popup and/or play the resolved ringtone for a socket notification. */
export function presentSocketNotification(notification: SocketNotificationPayload): void {
  const title = resolveTitle(notification)
  const description = resolveDescription(notification)

  if (isTruthyFlag(notification.popup)) {
    showSocketNotificationPopup(title, description, notification.id)
  }

  const ringtone = normalizeNotificationRingtone(notification.ringtone)
  if (ringtone) {
    playNotificationRingtone(ringtone)
  }
}
