import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEventHandler } from 'react'

import { defaultNotificationTopics } from './notificationsDefaultTopics'

import {

  NOTIF_CHANNELS_META,

  NOTIFICATION_TOPIC_COL_WIDTH,

  TABLE_CHANNELS,

} from './notificationsSettingsConstants'

import type { ChannelKey, NotificationTopic } from './notificationsSettingsTypes'

import { getParentState, turnOffTopic } from './notificationsTopicModel'
import { chimeLabelToNotificationSound } from './notificationSettingsMappers'
import { SMART_CRM_TOPIC_ID } from './smartCrmNotificationConfig'
import { playNotificationRingtone } from '@utils/notificationRingtonePlayer'

import { useGlobalNotificationSettings } from './useGlobalNotificationSettings'

import { useSmartCrmNotificationSettings } from './useSmartCrmNotificationSettings'



const SAVE_DEBOUNCE_MS = 600



export function useNotificationsSettingsState() {

  const {

    smartCrmTopic,

    isLoading: isSmartCrmLoading,

    isSaving: isSmartCrmSaving,

    loadError: smartCrmLoadError,

    persistSmartCrmTopic,

  } = useSmartCrmNotificationSettings()



  const {

    initialChannelEnabled,

    initialChimeLabel,

    isLoading: isGlobalLoading,

    isSaving: isGlobalSaving,

    loadError: globalLoadError,

    persistGlobalSettings,

  } = useGlobalNotificationSettings()



  const [topics, setTopics] = useState<NotificationTopic[]>(defaultNotificationTopics)

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  const [bannerVisible, setBannerVisible] = useState(true)

  const [browserNotifGranted, setBrowserNotifGranted] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const [selectedChime, setSelectedChime] = useState('Chime (1 sec.)')

  const [globalInitialized, setGlobalInitialized] = useState(false)



  const [channelEnabled, setChannelEnabled] = useState<Record<ChannelKey, boolean>>({

    email: true,

    bell: true,

    browser: true,

    popup: true,

  })



  const smartCrmSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const globalSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const channelEnabledRef = useRef(channelEnabled)

  const selectedChimeRef = useRef(selectedChime)



  channelEnabledRef.current = channelEnabled

  selectedChimeRef.current = selectedChime



  useEffect(() => {

    if (!smartCrmTopic) return

    setTopics((prev) => prev.map((topic) => (topic.id === SMART_CRM_TOPIC_ID ? smartCrmTopic : topic)))

    setExpandedTopics((prev) => {

      if (prev.has(SMART_CRM_TOPIC_ID)) return prev

      const next = new Set(prev)

      next.add(SMART_CRM_TOPIC_ID)

      return next

    })

  }, [smartCrmTopic])



  useEffect(() => {

    if (globalInitialized || isGlobalLoading) return

    setChannelEnabled(initialChannelEnabled)

    setSelectedChime(initialChimeLabel)

    setGlobalInitialized(true)

  }, [globalInitialized, isGlobalLoading, initialChannelEnabled, initialChimeLabel])



  const scheduleSmartCrmSave = useCallback(

    (topic: NotificationTopic) => {

      if (smartCrmSaveTimerRef.current) {

        clearTimeout(smartCrmSaveTimerRef.current)

      }

      smartCrmSaveTimerRef.current = setTimeout(() => {

        persistSmartCrmTopic(topic)

      }, SAVE_DEBOUNCE_MS)

    },

    [persistSmartCrmTopic],

  )



  const scheduleGlobalSave = useCallback(() => {

    if (globalSaveTimerRef.current) {

      clearTimeout(globalSaveTimerRef.current)

    }

    globalSaveTimerRef.current = setTimeout(() => {

      persistGlobalSettings({

        channelEnabled: channelEnabledRef.current,

        selectedChime: selectedChimeRef.current,

      })

    }, SAVE_DEBOUNCE_MS)

  }, [persistGlobalSettings])



  useEffect(

    () => () => {

      if (smartCrmSaveTimerRef.current) {

        clearTimeout(smartCrmSaveTimerRef.current)

      }

      if (globalSaveTimerRef.current) {

        clearTimeout(globalSaveTimerRef.current)

      }

    },

    [],

  )



  const updateTopics = useCallback(

    (updater: (prev: NotificationTopic[]) => NotificationTopic[]) => {

      setTopics((prev) => {

        const next = updater(prev)

        const smartCrm = next.find((topic) => topic.id === SMART_CRM_TOPIC_ID)

        if (smartCrm?.subtopics?.length) {

          scheduleSmartCrmSave(smartCrm)

        }

        return next

      })

    },

    [scheduleSmartCrmSave],

  )



  const toggleChannelEnabled = useCallback(

    (ch: ChannelKey) => {
      setChannelEnabled((prev) => {
        const next = { ...prev, [ch]: !prev[ch] }
        channelEnabledRef.current = next
        return next
      })
      scheduleGlobalSave()
    },

    [scheduleGlobalSave],

  )



  const allExpanded = useMemo(

    () =>

      topics.some((t) => t.subtopics && t.subtopics.length > 0) &&

      topics.filter((t) => t.subtopics && t.subtopics.length > 0).every((t) => expandedTopics.has(t.id)),

    [topics, expandedTopics],

  )



  const toggleExpandAll = useCallback(() => {

    if (allExpanded) {

      setExpandedTopics(new Set())

    } else {

      setExpandedTopics(new Set(topics.filter((t) => t.subtopics?.length).map((t) => t.id)))

    }

  }, [allExpanded, topics])



  const turnOffAll = useCallback(() => {

    updateTopics((prev) => prev.map(turnOffTopic))

  }, [updateTopics])



  const toggleTopicChannel = useCallback(

    (topicId: string, channel: ChannelKey) => {

      updateTopics((prev) => {

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

    },

    [updateTopics],

  )



  const toggleSubtopicChannel = useCallback(

    (topicId: string, subtopicId: string, channel: ChannelKey) => {

      updateTopics((prev) => {

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

    },

    [updateTopics],

  )



  const handleTopicCheckboxChange: ChangeEventHandler<HTMLInputElement> = useCallback(

    (e) => {

      const topicId = e.currentTarget.dataset.topicId

      const channel = e.currentTarget.dataset.channel as ChannelKey | undefined

      if (!topicId || !channel) return

      toggleTopicChannel(topicId, channel)

    },

    [toggleTopicChannel],

  )



  const handleSubtopicCheckboxChange: ChangeEventHandler<HTMLInputElement> = useCallback(

    (e) => {

      const topicId = e.currentTarget.dataset.topicId

      const subtopicId = e.currentTarget.dataset.subtopicId

      const channel = e.currentTarget.dataset.channel as ChannelKey | undefined

      if (!topicId || !subtopicId || !channel) return

      toggleSubtopicChannel(topicId, subtopicId, channel)

    },

    [toggleSubtopicChannel],

  )



  const toggleTopicExpanded = useCallback((topicId: string) => {

    setExpandedTopics((prev) => {

      const n = new Set(prev)

      if (n.has(topicId)) n.delete(topicId)

      else n.add(topicId)

      return n

    })

  }, [])



  const handleChimeChange = useCallback(
    (value: string) => {
      selectedChimeRef.current = value
      setSelectedChime(value)
      scheduleGlobalSave()
    },
    [scheduleGlobalSave],
  )

  const playSelectedChime = useCallback(() => {
    playNotificationRingtone(chimeLabelToNotificationSound(selectedChimeRef.current))
  }, [])

  const filteredTopics = useMemo(

    () =>

      searchQuery.trim()

        ? topics.filter((t) => t.label.toLowerCase().includes(searchQuery.toLowerCase()))

        : topics,

    [topics, searchQuery],

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

    setSelectedChime: handleChimeChange,
    playSelectedChime,
    allExpanded,

    toggleExpandAll,

    turnOffAll,

    handleTopicCheckboxChange,

    handleSubtopicCheckboxChange,

    notifChannels: NOTIF_CHANNELS_META,

    tableChannels: TABLE_CHANNELS,

    colWidth: NOTIFICATION_TOPIC_COL_WIDTH,

    getParentState,

    isSmartCrmLoading,

    isSmartCrmSaving,

    smartCrmLoadError,

    isGlobalLoading,

    isGlobalSaving,

    globalLoadError,

  }

}

