import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getSessionPhoneOrExtension } from '@planner/projectMemberRole'
import { getMyDayPreferences, patchMyDayPreferences } from '@utils/tasks'
import {
  DEFAULT_PLANNER_DAILY_CAPACITY,
  DEFAULT_PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY,
  DEFAULT_PLANNER_SHOW_MY_DAY,
  PLANNER_DAILY_CAPACITY_STORAGE_KEY,
  PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY_STORAGE_KEY,
  PLANNER_SETTINGS_INVALID_CAPACITY_MESSAGE,
  PLANNER_SETTINGS_SAVE_ERROR_MESSAGE,
  PLANNER_SETTINGS_SUCCESS_MESSAGE,
  PLANNER_SHOW_MY_DAY_STORAGE_KEY,
} from './constants'

function readLocalCapacity(): number {
  if (globalThis.window === undefined) return DEFAULT_PLANNER_DAILY_CAPACITY
  const parsed = Number.parseInt(
    globalThis.window.localStorage.getItem(PLANNER_DAILY_CAPACITY_STORAGE_KEY) ?? '',
    10,
  )
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PLANNER_DAILY_CAPACITY
}

function readLocalBoolean(key: string, defaultValue: boolean): boolean {
  if (globalThis.window === undefined) return defaultValue
  const raw = globalThis.window.localStorage.getItem(key)
  if (raw == null) return defaultValue
  return raw === 'true'
}

export function usePlannerGeneralSettings() {
  const { data: session } = useSession()
  const extension = getSessionPhoneOrExtension(session)

  const [capacityInput, setCapacityInput] = useState<string>(String(DEFAULT_PLANNER_DAILY_CAPACITY))
  const [showMyDay, setShowMyDay] = useState<boolean>(DEFAULT_PLANNER_SHOW_MY_DAY)
  const [requireEstimateForMyDay, setRequireEstimateForMyDay] = useState<boolean>(
    DEFAULT_PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY,
  )
  const [saveFeedback, setSaveFeedback] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const clearFeedback = useCallback(() => {
    setSaveFeedback('')
  }, [])

  useEffect(() => {
    setCapacityInput(String(readLocalCapacity()))
    setShowMyDay(readLocalBoolean(PLANNER_SHOW_MY_DAY_STORAGE_KEY, DEFAULT_PLANNER_SHOW_MY_DAY))
    setRequireEstimateForMyDay(
      readLocalBoolean(
        PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY_STORAGE_KEY,
        DEFAULT_PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY,
      ),
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    getMyDayPreferences(extension || undefined)
      .then((prefs) => {
        if (cancelled) return
        const mins = prefs.daily_capacity_minutes
        if (typeof mins === 'number' && Number.isFinite(mins) && mins > 0) {
          setCapacityInput(String(mins))
        }
        if (typeof prefs.my_day_default_view === 'boolean') {
          setShowMyDay(prefs.my_day_default_view)
        }
      })
      .catch(() => {
        /* keep localStorage defaults */
      })
    return () => {
      cancelled = true
    }
  }, [extension])

  const handleSave = useCallback(async (): Promise<void> => {
    const parsed = Number.parseInt(capacityInput, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setSaveFeedback(PLANNER_SETTINGS_INVALID_CAPACITY_MESSAGE)
      return
    }
    setIsSaving(true)
    try {
      await patchMyDayPreferences(
        {
          daily_capacity_minutes: parsed,
          my_day_default_view: showMyDay,
        },
        extension || undefined,
      )
      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.setItem(PLANNER_DAILY_CAPACITY_STORAGE_KEY, String(parsed))
        globalThis.window.localStorage.setItem(PLANNER_SHOW_MY_DAY_STORAGE_KEY, String(showMyDay))
        globalThis.window.localStorage.setItem(
          PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY_STORAGE_KEY,
          String(requireEstimateForMyDay),
        )
      }
      setCapacityInput(String(parsed))
      setSaveFeedback(PLANNER_SETTINGS_SUCCESS_MESSAGE)
    } catch {
      setSaveFeedback(PLANNER_SETTINGS_SAVE_ERROR_MESSAGE)
    } finally {
      setIsSaving(false)
    }
  }, [capacityInput, showMyDay, requireEstimateForMyDay, extension])

  const onCapacityInputChange = useCallback(
    (value: string) => {
      setCapacityInput(value)
      clearFeedback()
    },
    [clearFeedback],
  )

  const onShowMyDayChange = useCallback(
    (checked: boolean) => {
      setShowMyDay(checked)
      clearFeedback()
    },
    [clearFeedback],
  )

  const onRequireEstimateChange = useCallback(
    (checked: boolean) => {
      setRequireEstimateForMyDay(checked)
      clearFeedback()
    },
    [clearFeedback],
  )

  return {
    capacityInput,
    showMyDay,
    requireEstimateForMyDay,
    saveFeedback,
    isSaving,
    onCapacityInputChange,
    onShowMyDayChange,
    onRequireEstimateChange,
    handleSave,
  }
}
