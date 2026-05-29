import React from 'react'
import { PlannerGeneralSettingsView } from './planner-general/PlannerGeneralSettingsView'
import { usePlannerGeneralSettings } from './planner-general/usePlannerGeneralSettings'

export const PlannerGeneralSettings: React.FC = () => {
  const {
    capacityInput,
    showMyDay,
    requireEstimateForMyDay,
    saveFeedback,
    isSaving,
    onCapacityInputChange,
    onShowMyDayChange,
    onRequireEstimateChange,
    handleSave,
  } = usePlannerGeneralSettings()

  return (
    <PlannerGeneralSettingsView
      capacityInput={capacityInput}
      showMyDay={showMyDay}
      requireEstimateForMyDay={requireEstimateForMyDay}
      saveFeedback={saveFeedback}
      isSaving={isSaving}
      onCapacityInputChange={onCapacityInputChange}
      onShowMyDayChange={onShowMyDayChange}
      onRequireEstimateChange={onRequireEstimateChange}
      onSave={handleSave}
    />
  )
}
