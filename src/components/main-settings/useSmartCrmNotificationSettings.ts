import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useAuthContext } from '@auth/AuthProvider'
import {
  listNotificationSettingEvents,
  listNotificationSettings,
  updateNotificationSettings,
  type NotificationSettingRow,
} from '@services/notificationSettingsApi'
import { notificationSettingsKeys } from '@query/keys'
import {
  buildSmartCrmTopicFromRows,
  notificationSoundToChimeLabel,
  pickDominantNotificationSound,
  smartCrmTopicToUpsertPayload,
} from './notificationSettingsMappers'
import { resolveNotificationUserExtension } from './resolveNotificationUserExtension'
import { isSmartCrmEventKey } from './smartCrmNotificationConfig'
import type { NotificationTopic } from './notificationsSettingsTypes'

function sortRows(rows: NotificationSettingRow[]): NotificationSettingRow[] {
  return [...rows].sort((a, b) => a.event_key.localeCompare(b.event_key))
}

function mergeCatalogWithResolved(
  catalog: NotificationSettingRow[],
  resolved: NotificationSettingRow[],
): NotificationSettingRow[] {
  const resolvedByKey = new Map(resolved.map((row) => [row.event_key, row]))

  for (const item of catalog) {
    if (!isSmartCrmEventKey(item.event_key)) continue
    if (!resolvedByKey.has(item.event_key)) {
      resolvedByKey.set(item.event_key, {
        event_key: item.event_key,
        title: item.title,
        description: item.description,
        popup_enabled: true,
        in_app_enabled: true,
        email_enabled: false,
        notification_sound: 'chime',
      })
    }
  }

  return sortRows(
    [...resolvedByKey.values()].filter((row) => isSmartCrmEventKey(row.event_key)),
  )
}

async function fetchSmartCrmNotificationRows(userExtension?: string): Promise<NotificationSettingRow[]> {
  const [eventsCatalog, resolved] = await Promise.all([
    listNotificationSettingEvents().catch(() => []),
    listNotificationSettings(userExtension),
  ])

  const listRows = resolved.data.filter((row) => isSmartCrmEventKey(row.event_key))
  if (listRows.length > 0) {
    if (eventsCatalog.length === 0) {
      return sortRows(listRows)
    }
    const catalogRows: NotificationSettingRow[] = eventsCatalog.map((event) => ({
      event_key: event.event_key,
      title: event.title,
      description: event.description,
      popup_enabled: true,
      in_app_enabled: true,
      email_enabled: false,
      notification_sound: 'chime',
    }))
    return mergeCatalogWithResolved(catalogRows, listRows)
  }

  if (eventsCatalog.length > 0) {
    const catalogRows: NotificationSettingRow[] = eventsCatalog
      .filter((event) => isSmartCrmEventKey(event.event_key))
      .map((event) => ({
        event_key: event.event_key,
        title: event.title,
        description: event.description,
        popup_enabled: true,
        in_app_enabled: true,
        email_enabled: false,
        notification_sound: 'chime',
      }))
    return sortRows(catalogRows)
  }

  return []
}

export function useSmartCrmNotificationSettings() {
  const { user } = useAuthContext()
  const userExtension = useMemo(() => resolveNotificationUserExtension(user), [user])
  const queryClient = useQueryClient()

  const queryKey = notificationSettingsKeys.smartCrm.resolved(userExtension ?? '__defaults__')

  const query = useQuery({
    queryKey,
    queryFn: () => fetchSmartCrmNotificationRows(userExtension),
    staleTime: 30_000,
  })

  const smartCrmTopic = useMemo(
    () => (query.data ? buildSmartCrmTopicFromRows(query.data) : null),
    [query.data],
  )

  const initialChimeLabel = useMemo(() => {
    if (!query.data?.length) return 'Chime (1 sec.)'
    return notificationSoundToChimeLabel(pickDominantNotificationSound(query.data))
  }, [query.data])

  const saveMutation = useMutation({
    mutationFn: async (topic: NotificationTopic) => {
      const settings = smartCrmTopicToUpsertPayload(topic)
      if (settings.length === 0) {
        return []
      }
      return updateNotificationSettings({
        user_extension: userExtension ?? null,
        settings,
      })
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, sortRows(data))
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to save Smart CRM notification settings.'
      toast.error(message)
    },
  })

  const persistSmartCrmTopic = useCallback(
    (topic: NotificationTopic) => {
      saveMutation.mutate(topic)
    },
    [saveMutation],
  )

  return {
    userExtension,
    smartCrmTopic,
    initialChimeLabel,
    isLoading: query.isPending,
    isSaving: saveMutation.isPending,
    loadError: query.error,
    persistSmartCrmTopic,
    refetch: query.refetch,
  }
}
