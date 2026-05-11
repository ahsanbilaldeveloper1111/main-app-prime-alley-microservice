import type { ChannelKey } from './notificationsSettingsTypes'

export const NOTIFICATIONS_BASE_FONT = 'Lexend Deca, Helvetica, Arial, sans-serif'

export const NOTIFICATION_TOPIC_COL_WIDTH = 80

export const NOTIF_CHANNELS_META: Array<{ key: ChannelKey; label: string; description: string }> = [
  { key: 'email', label: 'Email', description: 'Sent to your email address.' },
  {
    key: 'bell',
    label: 'Bell',
    description:
      'Show up in the bell icon in the navigation bar. Click on the bell to see your most recent notifications.',
  },
  {
    key: 'browser',
    label: 'Browser',
    description: "Appear in your screen when you're not active but the site is open in a browser tab.",
  },
  {
    key: 'popup',
    label: 'Pop-up',
    description:
      "Appear on your screen for a few seconds when you're active. They'll play a sound based on your preferences.",
  },
]

export const TABLE_CHANNELS: Array<{ key: ChannelKey; label: string }> = [
  { key: 'popup', label: 'Pop-up' },
  { key: 'browser', label: 'Browser' },
  { key: 'bell', label: 'Bell' },
  { key: 'email', label: 'Email' },
]
