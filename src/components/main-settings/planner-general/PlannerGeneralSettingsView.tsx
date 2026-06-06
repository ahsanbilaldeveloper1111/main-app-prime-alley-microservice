import {
  MAIN_SETTINGS_COLOR,
  MAIN_SETTINGS_FONT_SIZE,
  MAIN_SETTINGS_FONT_WEIGHT,
  mainSettingsPrimaryButtonStyle,
} from '../mainSettingsTokens'
import React from 'react'
import { PLANNER_SETTINGS_SUCCESS_MESSAGE } from './constants'

type Props = Readonly<{
  capacityInput: string
  showMyDay: boolean
  requireEstimateForMyDay: boolean
  saveFeedback: string
  isSaving: boolean
  onCapacityInputChange: (value: string) => void
  onShowMyDayChange: (checked: boolean) => void
  onRequireEstimateChange: (checked: boolean) => void
  onSave: () => void
}>

const shellStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  background: '#ffffff',
  padding: '20px',
  maxWidth: '520px',
}

const inputStyle: React.CSSProperties = {
  width: '140px',
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  outline: 'none',
}

export const PlannerGeneralSettingsView: React.FC<Props> = ({
  capacityInput,
  showMyDay,
  requireEstimateForMyDay,
  saveFeedback,
  isSaving,
  onCapacityInputChange,
  onShowMyDayChange,
  onRequireEstimateChange,
  onSave,
}) => {
  const feedbackColor =
    saveFeedback === PLANNER_SETTINGS_SUCCESS_MESSAGE ? '#16a34a' : '#dc2626'

  return (
    <div style={shellStyle}>
      <div style={{ marginBottom: '8px', fontSize: MAIN_SETTINGS_FONT_SIZE.md, fontWeight: MAIN_SETTINGS_FONT_WEIGHT.semibold, color: MAIN_SETTINGS_COLOR.text }}>
        General
      </div>
      <div style={{ marginBottom: '14px', fontSize: MAIN_SETTINGS_FONT_SIZE.sm, color: '#6c757d' }}>
        Configure planner defaults for My Day and task estimation behavior.
      </div>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ marginBottom: '6px', fontSize: MAIN_SETTINGS_FONT_SIZE.base, fontWeight: MAIN_SETTINGS_FONT_WEIGHT.medium, color: MAIN_SETTINGS_COLOR.text }}>
          Default daily capacity (minutes)
        </div>
        <div style={{ marginBottom: '10px', fontSize: MAIN_SETTINGS_FONT_SIZE.sm, color: '#6c757d' }}>
          Syncs with My Day capacity. Used as the default when planning your day.
        </div>
        <input
          type="number"
          min={1}
          step={1}
          value={capacityInput}
          onChange={(e) => onCapacityInputChange(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: '#141414',
          }}
        >
          <input
            type="checkbox"
            checked={showMyDay}
            onChange={(e) => onShowMyDayChange(e.target.checked)}
          />
          <span>Show My Day</span>
        </label>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: '#141414',
          }}
        >
          <input
            type="checkbox"
            checked={requireEstimateForMyDay}
            onChange={(e) => onRequireEstimateChange(e.target.checked)}
          />
          <span>Ask for estimate minutes when adding tasks for My Day</span>
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <button
          type="button"
          className="main-settings-btn-primary"
          onClick={onSave}
          disabled={isSaving}
          style={mainSettingsPrimaryButtonStyle}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {saveFeedback.length > 0 ? (
        <div style={{ fontSize: MAIN_SETTINGS_FONT_SIZE.sm, color: feedbackColor }}>{saveFeedback}</div>
      ) : null}
    </div>
  )
}
