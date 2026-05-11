import type { ChannelKey, NotificationTopic } from './notificationsSettingsTypes'

export function getParentState(
  topic: NotificationTopic,
  channel: ChannelKey
): boolean | 'indeterminate' | null {
  if (!topic.subtopics || topic.subtopics.length === 0) {
    return topic.channels[channel]
  }
  const vals = topic.subtopics.map((s) => s.channels[channel])
  if (vals.every((v) => v === null)) return null
  const filtered = vals.filter((v): v is boolean => v !== null)
  if (filtered.every(Boolean)) return true
  if (filtered.every((v) => !v)) return false
  return 'indeterminate'
}

export function turnOffChannels(channels: Record<ChannelKey, boolean | null>): Record<ChannelKey, boolean | null> {
  return {
    popup: channels.popup === null ? null : false,
    browser: channels.browser === null ? null : false,
    bell: channels.bell === null ? null : false,
    email: channels.email === null ? null : false,
  }
}

export function turnOffTopic(t: NotificationTopic): NotificationTopic {
  const next: NotificationTopic = { ...t, channels: turnOffChannels(t.channels) }
  if (!t.subtopics) return next

  const nextSubs: NonNullable<NotificationTopic['subtopics']> = []
  for (const s of t.subtopics) {
    nextSubs.push({ ...s, channels: turnOffChannels(s.channels) })
  }
  next.subtopics = nextSubs
  return next
}
