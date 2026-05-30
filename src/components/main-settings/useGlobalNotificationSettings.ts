import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useAuthContext } from '@auth/AuthProvider'
import {
  createGlobalNotificationSettings,
  getGlobalNotificationSettings,
  isConflictError,
  upsertGlobalNotificationSettings,
  type GlobalNotificationSettingsRow,
} from '@services/globalNotificationSettingsApi'
import { notificationSettingsKeys } from '@query/keys'
import {
  globalSettingsToChannelEnabled,
  globalSettingsToChimeLabel,
  globalUiStateToCreatePayload,
  globalUiStateToUpsertPayload,
  type GlobalNotificationUiState,
} from './globalNotificationSettingsMappers'
import { resolveNotificationUserExtension } from './resolveNotificationUserExtension'

async function fetchGlobalNotificationSettings(
  userExtension: string,
): Promise<GlobalNotificationSettingsRow | null> {
  return getGlobalNotificationSettings(userExtension)
}

async function saveGlobalNotificationSettings(
  userExtension: string,
  state: GlobalNotificationUiState,
): Promise<GlobalNotificationSettingsRow> {
  const payload = globalUiStateToUpsertPayload(state)
  try {
    return await upsertGlobalNotificationSettings(userExtension, payload)
  } catch (error) {
    if (!isConflictError(error)) {
      throw error
    }
    return createGlobalNotificationSettings(
      globalUiStateToCreatePayload(userExtension, state),
    )
  }
}

export function useGlobalNotificationSettings() {
  const { user } = useAuthContext()
  const userExtension = useMemo(() => resolveNotificationUserExtension(user), [user])
  const queryClient = useQueryClient()

  const queryKey = notificationSettingsKeys.global.resolved(userExtension ?? '__missing__')

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userExtension) {
        return null
      }
      return fetchGlobalNotificationSettings(userExtension)
    },
    enabled: Boolean(userExtension),
    staleTime: 30_000,
  })

  const initialChannelEnabled = useMemo(
    () => globalSettingsToChannelEnabled(query.data),
    [query.data],
  )

  const initialChimeLabel = useMemo(
    () => globalSettingsToChimeLabel(query.data),
    [query.data],
  )

  const saveMutation = useMutation({
    mutationFn: async (state: GlobalNotificationUiState) => {
      if (!userExtension) {
        throw new Error('Your extension is not available. Sign in again to save notification settings.')
      }
      return saveGlobalNotificationSettings(userExtension, state)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to save notification preferences.'
      toast.error(message)
    },
  })

  const persistGlobalSettings = useCallback(
    (state: GlobalNotificationUiState) => {
      saveMutation.mutate(state)
    },
    [saveMutation],
  )

  return {
    userExtension,
    initialChannelEnabled,
    initialChimeLabel,
    isLoading: query.isPending,
    isSaving: saveMutation.isPending,
    loadError: query.error,
    persistGlobalSettings,
    refetch: query.refetch,
  }
}
