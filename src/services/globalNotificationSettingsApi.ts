import { isAxiosError } from 'axios'
import axiosInstance from '@utils/axios'

const GLOBAL_NOTIFICATION_SETTINGS_BASE = '/notification-settings'

export type GlobalNotificationSettingsRow = {
  user_extension: string
  module_slug?: string | null
  tenant_id?: string | null
  push_notification: boolean
  send_email: boolean
  in_app: boolean
  popup: boolean | null
  ringtone?: string | null
}

export type GlobalNotificationSettingsUpsert = {
  module_slug?: string | null
  tenant_id?: string | null
  push_notification?: boolean
  send_email?: boolean
  in_app?: boolean
  popup?: boolean | null
  ringtone?: string | null
}

export type GlobalNotificationSettingsListFilters = {
  user_extension?: string
  module_slug?: string | null
  tenant_id?: string
}

function unwrapRow(body: unknown): GlobalNotificationSettingsRow | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  const record = body as Record<string, unknown>
  const nested = record.data
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as GlobalNotificationSettingsRow
  }
  if ('user_extension' in record && typeof record.push_notification === 'boolean') {
    return record as GlobalNotificationSettingsRow
  }
  return null
}

function unwrapList(body: unknown): GlobalNotificationSettingsRow[] {
  if (Array.isArray(body)) {
    return body as GlobalNotificationSettingsRow[]
  }
  if (!body || typeof body !== 'object') {
    return []
  }
  const record = body as Record<string, unknown>
  const nested = record.data
  if (Array.isArray(nested)) {
    return nested as GlobalNotificationSettingsRow[]
  }
  if (nested && typeof nested === 'object') {
    const inner = nested as Record<string, unknown>
    if (Array.isArray(inner.data)) {
      return inner.data as GlobalNotificationSettingsRow[]
    }
  }
  return []
}

export async function listGlobalNotificationSettings(
  filters: GlobalNotificationSettingsListFilters = {},
): Promise<GlobalNotificationSettingsRow[]> {
  const params: Record<string, string> = {}
  if (filters.user_extension?.trim()) {
    params.user_extension = filters.user_extension.trim()
  }
  if (filters.module_slug != null && filters.module_slug !== '') {
    params.module_slug = String(filters.module_slug)
  }
  if (filters.tenant_id?.trim()) {
    params.tenant_id = filters.tenant_id.trim()
  }
  const response = await axiosInstance.get(GLOBAL_NOTIFICATION_SETTINGS_BASE, { params })
  return unwrapList(response.data)
}

export async function getGlobalNotificationSettings(
  userExtension: string,
  moduleSlug?: string | null,
): Promise<GlobalNotificationSettingsRow | null> {
  const extension = userExtension.trim()
  if (!extension) {
    return null
  }
  const params: Record<string, string> = {}
  if (moduleSlug != null && moduleSlug !== '') {
    params.module_slug = String(moduleSlug)
  }
  try {
    const response = await axiosInstance.get(
      `${GLOBAL_NOTIFICATION_SETTINGS_BASE}/${encodeURIComponent(extension)}`,
      { params },
    )
    return unwrapRow(response.data)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function createGlobalNotificationSettings(
  body: GlobalNotificationSettingsRow,
): Promise<GlobalNotificationSettingsRow> {
  const response = await axiosInstance.post(GLOBAL_NOTIFICATION_SETTINGS_BASE, body)
  return unwrapRow(response.data) ?? body
}

export async function upsertGlobalNotificationSettings(
  userExtension: string,
  body: GlobalNotificationSettingsUpsert,
): Promise<GlobalNotificationSettingsRow> {
  const extension = userExtension.trim()
  if (!extension) {
    throw new Error('User extension is required to save notification settings.')
  }
  const response = await axiosInstance.put(
    `${GLOBAL_NOTIFICATION_SETTINGS_BASE}/${encodeURIComponent(extension)}`,
    body,
  )
  const row = unwrapRow(response.data)
  if (!row) {
    throw new Error('Unexpected response when saving global notification settings.')
  }
  return row
}

export async function patchGlobalNotificationSettings(
  userExtension: string,
  body: GlobalNotificationSettingsUpsert,
): Promise<GlobalNotificationSettingsRow> {
  const extension = userExtension.trim()
  if (!extension) {
    throw new Error('User extension is required to update notification settings.')
  }
  const response = await axiosInstance.patch(
    `${GLOBAL_NOTIFICATION_SETTINGS_BASE}/${encodeURIComponent(extension)}`,
    body,
  )
  const row = unwrapRow(response.data)
  if (!row) {
    throw new Error('Unexpected response when updating global notification settings.')
  }
  return row
}

export async function deleteGlobalNotificationSettings(
  userExtension: string,
  moduleSlug?: string | null,
): Promise<void> {
  const extension = userExtension.trim()
  if (!extension) {
    return
  }
  const params: Record<string, string> = {}
  if (moduleSlug != null && moduleSlug !== '') {
    params.module_slug = String(moduleSlug)
  }
  await axiosInstance.delete(
    `${GLOBAL_NOTIFICATION_SETTINGS_BASE}/${encodeURIComponent(extension)}`,
    { params },
  )
}

export async function listGlobalNotificationSettingsByExtensions(
  userExtensions: string[],
): Promise<GlobalNotificationSettingsRow[]> {
  const extensions = userExtensions.map((ext) => ext.trim()).filter(Boolean)
  if (extensions.length === 0) {
    return []
  }
  const response = await axiosInstance.post(
    `${GLOBAL_NOTIFICATION_SETTINGS_BASE}/list-by-extensions`,
    { user_extensions: extensions },
  )
  return unwrapList(response.data)
}

/** True when the row represents platform-wide defaults (`module_slug` unset). */
export function isGlobalDefaultRow(row: GlobalNotificationSettingsRow): boolean {
  return row.module_slug == null || row.module_slug === ''
}

export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404
}

export function isConflictError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409
}
