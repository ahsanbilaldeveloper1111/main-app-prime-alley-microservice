import axiosInstance from '@utils/axios'

const NOTIFICATION_SETTINGS_BASE = '/crm/notification-settings'

export type NotificationSound = 'chime' | 'bell' | 'ding' | null

export type NotificationSettingRow = {
  event_key: string
  title?: string
  description?: string
  popup_enabled: boolean
  in_app_enabled: boolean
  email_enabled: boolean
  notification_sound?: NotificationSound | null
  is_user_override?: boolean
}

export type NotificationSettingUpsert = Pick<
  NotificationSettingRow,
  | 'event_key'
  | 'title'
  | 'description'
  | 'popup_enabled'
  | 'in_app_enabled'
  | 'email_enabled'
  | 'notification_sound'
>

export type NotificationSettingsListMeta = {
  scope?: 'defaults' | 'user'
  user_extension?: string
  extension_user?: string
}

export type NotificationSettingsListResponse = {
  data: NotificationSettingRow[]
  meta?: NotificationSettingsListMeta
}

export type NotificationSettingsPutBody = {
  user_extension?: string | null
  settings: NotificationSettingUpsert[]
}

export type NotificationEventCatalogItem = {
  event_key: string
  title?: string
  description?: string
}

function unwrapListPayload(body: unknown): NotificationSettingsListResponse {
  if (Array.isArray(body)) {
    return { data: body as NotificationSettingRow[] }
  }
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    const nested = record.data
    if (Array.isArray(nested)) {
      return {
        data: nested,
        meta: record.meta as NotificationSettingsListMeta | undefined,
      }
    }
    if (nested && typeof nested === 'object') {
      const inner = nested as Record<string, unknown>
      if (Array.isArray(inner.data)) {
        return {
          data: inner.data,
          meta: (inner.meta ?? record.meta) as NotificationSettingsListMeta | undefined,
        }
      }
    }
  }
  return { data: [] }
}

function unwrapEventsPayload(body: unknown): NotificationEventCatalogItem[] {
  const list = unwrapListPayload(body).data
  if (list.length > 0 && 'event_key' in list[0]) {
    return list
  }
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    const events = record.events
    if (Array.isArray(events)) {
      return events as NotificationEventCatalogItem[]
    }
  }
  return []
}

export async function listNotificationSettingEvents(): Promise<NotificationEventCatalogItem[]> {
  const response = await axiosInstance.get(`${NOTIFICATION_SETTINGS_BASE}/events`)
  return unwrapEventsPayload(response.data)
}

export async function listNotificationSettings(
  userExtension?: string | null,
): Promise<NotificationSettingsListResponse> {
  const params: Record<string, string> = {}
  const extension = userExtension?.trim()
  if (extension) {
    params.user_extension = extension
  }
  const response = await axiosInstance.get(NOTIFICATION_SETTINGS_BASE, { params })
  return unwrapListPayload(response.data)
}

export async function updateNotificationSettings(
  body: NotificationSettingsPutBody,
): Promise<NotificationSettingRow[]> {
  const response = await axiosInstance.put(NOTIFICATION_SETTINGS_BASE, body)
  return unwrapListPayload(response.data).data
}
