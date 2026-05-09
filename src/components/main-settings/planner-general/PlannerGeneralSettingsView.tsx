import React from 'react'
import { PLANNER_SETTINGS_SUCCESS_MESSAGE } from './constants'

type Props = Readonly<{
  capacityInput: string
  showMyDay: boolean
  requireEstimateForMyDay: boolean
  saveFeedback: string
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
  borderRadius: '6px',
  outline: 'none',
}

const saveButtonStyle: React.CSSProperties = {
  border: '1px solid #111827',
  background: '#111827',
  color: '#ffffff',
  borderRadius: '6px',
  padding: '8px 14px',
  fontSize: '13px',
  cursor: 'pointer',
}

export const PlannerGeneralSettingsView: React.FC<Props> = ({
  capacityInput,
  showMyDay,
  requireEstimateForMyDay,
  saveFeedback,
  onCapacityInputChange,
  onShowMyDayChange,
  onRequireEstimateChange,
  onSave,
}) => {
  const feedbackColor =
    saveFeedback === PLANNER_SETTINGS_SUCCESS_MESSAGE ? '#16a34a' : '#dc2626'

  return (
    <div style={shellStyle}>
      <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
        General
      </div>
      <div style={{ marginBottom: '14px', fontSize: '13px', color: '#6b7280' }}>
        Configure planner defaults for My Day and task estimation behavior.
      </div>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>
          Capacity per day
        </div>
        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#6b7280' }}>
          Default number of tasks a user can handle per day.
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
            color: '#111827',
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
            color: '#111827',
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
        <button type="button" onClick={onSave} style={saveButtonStyle}>
          Save
        </button>
      </div>
      {saveFeedback.length > 0 ? (
        <div style={{ fontSize: '12px', color: feedbackColor }}>{saveFeedback}</div>
      ) : null}
    </div>
  )
}
