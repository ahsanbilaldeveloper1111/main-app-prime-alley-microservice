import type { NotificationSound } from '@services/notificationSettingsApi'

export type ChannelKey = 'popup' | 'browser' | 'bell' | 'email'

export type NotificationSubtopic = {
  id: string
  label: string
  description?: string
  channels: Record<ChannelKey, boolean | null>
  /** Pop-up sound from notification-settings API (`chime` | `bell` | `ding` | null). */
  notificationSound?: NotificationSound
}

export type NotificationTopic = {
  id: string
  label: string
  channels: Record<ChannelKey, boolean | null>
  subtopics?: NotificationSubtopic[]
}
