import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_PLANNER_DAILY_CAPACITY,
  DEFAULT_PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY,
  DEFAULT_PLANNER_SHOW_MY_DAY,
  PLANNER_DAILY_CAPACITY_STORAGE_KEY,
  PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY_STORAGE_KEY,
  PLANNER_SETTINGS_INVALID_CAPACITY_MESSAGE,
  PLANNER_SETTINGS_SUCCESS_MESSAGE,
  PLANNER_SHOW_MY_DAY_STORAGE_KEY,
} from './constants'

export function usePlannerGeneralSettings() {
  const [capacityInput, setCapacityInput] = useState<string>(String(DEFAULT_PLANNER_DAILY_CAPACITY))
  const [showMyDay, setShowMyDay] = useState<boolean>(DEFAULT_PLANNER_SHOW_MY_DAY)
  const [requireEstimateForMyDay, setRequireEstimateForMyDay] = useState<boolean>(
    DEFAULT_PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY,
  )
  const [saveFeedback, setSaveFeedback] = useState<string>('')

  const clearFeedback = useCallback(() => {
    setSaveFeedback('')
  }, [])

  useEffect(() => {
    if (globalThis.window === undefined) return
    const rawValue = globalThis.window.localStorage.getItem(PLANNER_DAILY_CAPACITY_STORAGE_KEY)
    const rawShowMyDay = globalThis.window.localStorage.getItem(PLANNER_SHOW_MY_DAY_STORAGE_KEY)
    const rawRequireEstimate = globalThis.window.localStorage.getItem(
      PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY_STORAGE_KEY,
    )
    const parsed = Number.parseInt(rawValue ?? '', 10)
    if (Number.isFinite(parsed) && parsed > 0) {
      setCapacityInput(String(parsed))
    } else {
      setCapacityInput(String(DEFAULT_PLANNER_DAILY_CAPACITY))
    }
    setShowMyDay(rawShowMyDay == null ? DEFAULT_PLANNER_SHOW_MY_DAY : rawShowMyDay === 'true')
    setRequireEstimateForMyDay(
      rawRequireEstimate == null
        ? DEFAULT_PLANNER_REQUIRE_ESTIMATE_FOR_MY_DAY
        : rawRequireEstimate === 'true',
    )
  }, [])

  const handleSave = useCallback((): void => {
    const parsed = Number.parseInt(capacityInput, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setSaveFeedback(PLANNER_SETTINGS_INVALID_CAPACITY_MESSAGE)
      return
    }
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
  }, [capacityInput, showMyDay, requireEstimateForMyDay])

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
    onCapacityInputChange,
    onShowMyDayChange,
    onRequireEstimateChange,
    handleSave,
  }
}
