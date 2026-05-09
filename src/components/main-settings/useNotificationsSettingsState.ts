import { useCallback, useMemo, useState, type ChangeEventHandler } from 'react'
import { defaultNotificationTopics } from './notificationsDefaultTopics'
import {
  NOTIF_CHANNELS_META,
  NOTIFICATION_TOPIC_COL_WIDTH,
  TABLE_CHANNELS,
} from './notificationsSettingsConstants'
import type { ChannelKey, NotificationTopic } from './notificationsSettingsTypes'
import { getParentState, turnOffTopic } from './notificationsTopicModel'

export function useNotificationsSettingsState() {
  const [topics, setTopics] = useState<NotificationTopic[]>(defaultNotificationTopics)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [bannerVisible, setBannerVisible] = useState(true)
  const [browserNotifGranted, setBrowserNotifGranted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [channelEnabled, setChannelEnabled] = useState<Record<ChannelKey, boolean>>({
    email: true,
    bell: true,
    browser: true,
    popup: true,
  })
  const [selectedChime, setSelectedChime] = useState('Chime (1 sec.)')

  const toggleChannelEnabled = useCallback((ch: ChannelKey) => {
    setChannelEnabled((prev) => ({ ...prev, [ch]: !prev[ch] }))
  }, [])

  const allExpanded = useMemo(
    () =>
      topics.some((t) => t.subtopics && t.subtopics.length > 0) &&
      topics.filter((t) => t.subtopics && t.subtopics.length > 0).every((t) => expandedTopics.has(t.id)),
    [topics, expandedTopics]
  )

  const toggleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpandedTopics(new Set())
    } else {
      setExpandedTopics(new Set(topics.filter((t) => t.subtopics?.length).map((t) => t.id)))
    }
  }, [allExpanded, topics])

  const turnOffAll = useCallback(() => {
    setTopics((prev) => prev.map(turnOffTopic))
  }, [])

  const toggleTopicChannel = useCallback((topicId: string, channel: ChannelKey) => {
    setTopics((prev) => {
      const next: NotificationTopic[] = []
      for (const t of prev) {
        if (t.id !== topicId || t.channels[channel] === null) {
          next.push(t)
          continue
        }

        const newVal = getParentState(t, channel) !== true
        const nextTopic: NotificationTopic = { ...t, channels: { ...t.channels, [channel]: newVal } }

        if (t.subtopics) {
          const nextSubs: NonNullable<NotificationTopic['subtopics']> = []
          for (const s of t.subtopics) {
            const cur = s.channels[channel]
            if (cur === null) {
              nextSubs.push(s)
            } else {
              nextSubs.push({ ...s, channels: { ...s.channels, [channel]: newVal } })
            }
          }
          nextTopic.subtopics = nextSubs
        }

        next.push(nextTopic)
      }
      return next
    })
  }, [])

  const toggleSubtopicChannel = useCallback((topicId: string, subtopicId: string, channel: ChannelKey) => {
    setTopics((prev) => {
      const next: NotificationTopic[] = []
      for (const t of prev) {
        if (t.id !== topicId || !t.subtopics) {
          next.push(t)
          continue
        }

        const nextSubs: NonNullable<NotificationTopic['subtopics']> = []
        for (const s of t.subtopics) {
          if (s.id !== subtopicId || s.channels[channel] === null) {
            nextSubs.push(s)
            continue
          }
          nextSubs.push({ ...s, channels: { ...s.channels, [channel]: !s.channels[channel] } })
        }

        const allTrue = nextSubs.every((s) => s.channels[channel] !== false)
        const parentVal = t.channels[channel] === null ? null : allTrue
        next.push({ ...t, channels: { ...t.channels, [channel]: parentVal }, subtopics: nextSubs })
      }
      return next
    })
  }, [])

  const handleTopicCheckboxChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const topicId = e.currentTarget.dataset.topicId
      const channel = e.currentTarget.dataset.channel as ChannelKey | undefined
      if (!topicId || !channel) return
      toggleTopicChannel(topicId, channel)
    },
    [toggleTopicChannel]
  )

  const handleSubtopicCheckboxChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const topicId = e.currentTarget.dataset.topicId
      const subtopicId = e.currentTarget.dataset.subtopicId
      const channel = e.currentTarget.dataset.channel as ChannelKey | undefined
      if (!topicId || !subtopicId || !channel) return
      toggleSubtopicChannel(topicId, subtopicId, channel)
    },
    [toggleSubtopicChannel]
  )

  const toggleTopicExpanded = useCallback((topicId: string) => {
    setExpandedTopics((prev) => {
      const n = new Set(prev)
      if (n.has(topicId)) n.delete(topicId)
      else n.add(topicId)
      return n
    })
  }, [])

  const filteredTopics = useMemo(
    () =>
      searchQuery.trim()
        ? topics.filter((t) => t.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : topics,
    [topics, searchQuery]
  )

  return {
    filteredTopics,
    expandedTopics,
    toggleTopicExpanded,
    bannerVisible,
    setBannerVisible,
    browserNotifGranted,
    setBrowserNotifGranted,
    searchQuery,
    setSearchQuery,
    channelEnabled,
    toggleChannelEnabled,
    selectedChime,
    setSelectedChime,
    allExpanded,
    toggleExpandAll,
    turnOffAll,
    handleTopicCheckboxChange,
    handleSubtopicCheckboxChange,
    notifChannels: NOTIF_CHANNELS_META,
    tableChannels: TABLE_CHANNELS,
    colWidth: NOTIFICATION_TOPIC_COL_WIDTH,
    getParentState,
  }
}
