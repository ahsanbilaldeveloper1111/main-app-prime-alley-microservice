import type {
  GlobalNotificationSettingsRow,
  GlobalNotificationSettingsUpsert,
} from '@services/globalNotificationSettingsApi'
import {
  chimeLabelToNotificationSound,
  normalizeNotificationSound,
  notificationSoundToChimeLabel,
} from './notificationSettingsMappers'
import type { ChannelKey } from './notificationsSettingsTypes'

export const DEFAULT_GLOBAL_CHANNEL_ENABLED: Record<ChannelKey, boolean> = {
  email: true,
  bell: true,
  browser: true,
  popup: true,
}

export const DEFAULT_GLOBAL_CHIME_LABEL = 'Chime (1 sec.)'

export function globalSettingsToChannelEnabled(
  row: GlobalNotificationSettingsRow | null | undefined,
): Record<ChannelKey, boolean> {
  if (!row) {
    return { ...DEFAULT_GLOBAL_CHANNEL_ENABLED }
  }
  return {
    email: row.send_email,
    bell: row.in_app,
    browser: row.push_notification,
    popup: row.popup !== false,
  }
}

export function globalSettingsToChimeLabel(
  row: GlobalNotificationSettingsRow | null | undefined,
): string {
  if (!row?.ringtone) {
    return DEFAULT_GLOBAL_CHIME_LABEL
  }
  return notificationSoundToChimeLabel(normalizeNotificationSound(row.ringtone))
}

export type GlobalNotificationUiState = {
  channelEnabled: Record<ChannelKey, boolean>
  selectedChime: string
}

export function globalUiStateToUpsertPayload(
  state: GlobalNotificationUiState,
): GlobalNotificationSettingsUpsert {
  const ringtone = chimeLabelToNotificationSound(state.selectedChime)
  return {
    module_slug: null,
    push_notification: state.channelEnabled.browser,
    send_email: state.channelEnabled.email,
    in_app: state.channelEnabled.bell,
    popup: state.channelEnabled.popup,
    ringtone,
  }
}

export function globalUiStateToCreatePayload(
  userExtension: string,
  state: GlobalNotificationUiState,
): GlobalNotificationSettingsRow {
  const upsert = globalUiStateToUpsertPayload(state)
  return {
    user_extension: userExtension,
    module_slug: null,
    push_notification: upsert.push_notification ?? true,
    send_email: upsert.send_email ?? true,
    in_app: upsert.in_app ?? true,
    popup: upsert.popup ?? true,
    ringtone: upsert.ringtone ?? null,
  }
}
