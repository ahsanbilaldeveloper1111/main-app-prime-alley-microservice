import type {
  NotificationSettingRow,
  NotificationSettingUpsert,
  NotificationSound,
} from '@services/notificationSettingsApi'
import type { ChannelKey, NotificationSubtopic, NotificationTopic } from './notificationsSettingsTypes'
import { SMART_CRM_TOPIC_ID } from './smartCrmNotificationConfig'
import { unknownToLowerSoundToken } from '@utils/unknownToLowerSoundToken'

const CHIME_LABEL_BY_SOUND: Record<string, string> = {
  chime: 'Chime (1 sec.)',
  bell: 'Bell (2 sec.)',
  ding: 'Ding (0.5 sec.)',
}

const SOUND_BY_CHIME_LABEL: Record<string, NotificationSound> = {
  'Chime (1 sec.)': 'chime',
  'Bell (2 sec.)': 'bell',
  'Ding (0.5 sec.)': 'ding',
  None: null,
}

export function normalizeNotificationSound(raw: unknown): NotificationSound {
  const text = unknownToLowerSoundToken(raw)
  if (text == null || text === 'null' || text === 'none') return null
  if (text === 'chime' || text === 'bell' || text === 'ding') return text
  return 'chime'
}

export function notificationSoundToChimeLabel(sound: NotificationSound | null | undefined): string {
  if (sound == null) {
    return 'None'
  }
  return CHIME_LABEL_BY_SOUND[sound] ?? 'Chime (1 sec.)'
}

export function chimeLabelToNotificationSound(label: string): NotificationSound {
  return SOUND_BY_CHIME_LABEL[label] ?? 'chime'
}

function rowToChannels(row: NotificationSettingRow): Record<ChannelKey, boolean | null> {
  return {
    popup: row.popup_enabled,
    browser: null,
    bell: row.in_app_enabled,
    email: row.email_enabled,
  }
}

export function notificationSettingRowToSubtopic(row: NotificationSettingRow): NotificationSubtopic {
  const label = row.title?.trim() || row.event_key
  return {
    id: row.event_key,
    label,
    description: row.description?.trim() || undefined,
    channels: rowToChannels(row),
    notificationSound: normalizeNotificationSound(row.notification_sound),
  }
}

export function subtopicToNotificationSettingUpsert(subtopic: NotificationSubtopic): NotificationSettingUpsert {
  return {
    event_key: subtopic.id,
    title: subtopic.label,
    description: subtopic.description,
    popup_enabled: subtopic.channels.popup === true,
    in_app_enabled: subtopic.channels.bell === true,
    email_enabled: subtopic.channels.email === true,
    notification_sound: subtopic.notificationSound ?? null,
  }
}

export function buildSmartCrmTopicFromRows(rows: NotificationSettingRow[]): NotificationTopic | null {
  if (rows.length === 0) {
    return null
  }

  const subtopics = rows.map(notificationSettingRowToSubtopic)
  const channels: Record<ChannelKey, boolean | null> = {
    popup: null,
    browser: null,
    bell: null,
    email: null,
  }

  for (const key of Object.keys(channels) as ChannelKey[]) {
    const vals = subtopics.map((s) => s.channels[key]).filter((v): v is boolean => v !== null)
    if (vals.length === 0) {
      channels[key] = null
    } else if (vals.every(Boolean)) {
      channels[key] = true
    } else if (vals.every((v) => !v)) {
      channels[key] = false
    } else {
      channels[key] = null
    }
  }

  return {
    id: SMART_CRM_TOPIC_ID,
    label: 'Smart CRM',
    channels,
    subtopics,
  }
}

export function smartCrmTopicToUpsertPayload(topic: NotificationTopic): NotificationSettingUpsert[] {
  return (topic.subtopics ?? []).map(subtopicToNotificationSettingUpsert)
}

export function applyNotificationSoundToTopic(
  topic: NotificationTopic,
  sound: NotificationSound,
): NotificationTopic {
  if (!topic.subtopics?.length) {
    return topic
  }
  return {
    ...topic,
    subtopics: topic.subtopics.map((sub) => ({ ...sub, notificationSound: sound })),
  }
}

function normalizeSoundKey(sound: NotificationSound | undefined): string {
  if (sound == null) return 'null'
  return sound
}

export function pickDominantNotificationSound(rows: NotificationSettingRow[]): NotificationSound {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = normalizeSoundKey(normalizeNotificationSound(row.notification_sound))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let best: NotificationSound = 'chime'
  let bestCount = -1
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count
      best = key === 'null' ? null : (key as NotificationSound)
    }
  }
  return best
}

export function smartCrmRowsHaveMixedSounds(rows: NotificationSettingRow[]): boolean {
  const sounds = new Set(rows.map((row) => normalizeSoundKey(normalizeNotificationSound(row.notification_sound))))
  return sounds.size > 1
}
