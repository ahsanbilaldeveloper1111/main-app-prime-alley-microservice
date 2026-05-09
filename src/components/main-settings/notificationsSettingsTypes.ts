export type ChannelKey = 'popup' | 'browser' | 'bell' | 'email'

export type NotificationSubtopic = {
  id: string
  label: string
  description?: string
  channels: Record<ChannelKey, boolean | null>
}

export type NotificationTopic = {
  id: string
  label: string
  channels: Record<ChannelKey, boolean | null>
  subtopics?: NotificationSubtopic[]
}
