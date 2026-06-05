import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React from 'react'
import { Clock } from 'lucide-react'
import { generalSettingsStyles as s } from './generalSettingsPanelStyles'

function halfHourTimeOptions(): React.ReactNode {
  return Array.from({ length: 24 }).flatMap((_, h) =>
    ['00', '30'].map((m) => {
      const val = `${String(h).padStart(2, '0')}:${m}`
      return (
        <option key={val} value={val}>
          {val}
        </option>
      )
    })
  )
}

export type GeneralSettingsTasksTabProps = {
  dueDate: string
  setDueDate: (v: string) => void
  dueTime: string
  setDueTime: (v: string) => void
  reminder: string
  setReminder: (v: string) => void
  followUpList: boolean
  setFollowUpList: (v: boolean) => void
  followUpDisqualify: boolean
  setFollowUpDisqualify: (v: boolean) => void
}

export const GeneralSettingsTasksTab: React.FC<GeneralSettingsTasksTabProps> = ({
  dueDate,
  setDueDate,
  dueTime,
  setDueTime,
  reminder,
  setReminder,
  followUpList,
  setFollowUpList,
  followUpDisqualify,
  setFollowUpDisqualify,
}) => (
  <div>
    <p style={s.notice}>These preferences only apply to you.</p>

    <div style={s.sectionTitle}>Defaults</div>
    <div style={s.sectionSubtitle}>Set preferences for task creation.</div>

    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div style={s.fieldGroup}>
        <label htmlFor="general-due-date" style={s.label}>
          Due date
        </label>
        <select
          id="general-due-date"
          style={{ ...s.select, width: '240px', height: '40px' }}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        >
          <option>In 3 business days</option>
          <option>In 1 business day</option>
          <option>In 5 business days</option>
          <option>In 1 week</option>
          <option>In 2 weeks</option>
          <option>No due date</option>
        </select>
      </div>

      <div style={s.fieldGroup}>
        <label htmlFor="general-due-time" style={s.label}>
          Due time
        </label>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6c757d',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <Clock size={14} />
          </span>
          <select
            id="general-due-time"
            style={
              {
                width: '240px',
                padding: '8px 12px 8px 34px',
                fontSize: MAIN_SETTINGS_FONT_SIZE.md,
                height: '40px',
                fontWeight: 400,
                color: '#141414',
                border: '1px solid #b8b8b8',
                borderRadius: '8px',
                background: '#fff',
                fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
                outline: 'none',
                appearance: 'none',
              } as React.CSSProperties
            }
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          >
            {halfHourTimeOptions()}
          </select>
        </div>
      </div>
    </div>

    <div style={s.fieldGroup}>
      <label htmlFor="general-reminder" style={s.label}>
        Reminder
      </label>
      <select id="general-reminder" style={s.select} value={reminder} onChange={(e) => setReminder(e.target.value)}>
        <option>No reminder</option>
        <option>At time of task</option>
        <option>5 minutes before</option>
        <option>15 minutes before</option>
        <option>30 minutes before</option>
        <option>1 hour before</option>
        <option>1 day before</option>
      </select>
    </div>

    <div style={s.sectionTitle}>Follow-up tasks</div>
    <div style={s.sectionSubtitle}>Set preferences for follow-up reminders.</div>

    <div style={s.checkboxRow}>
      <input
        type="checkbox"
        id="followUpList"
        style={s.checkbox}
        checked={followUpList}
        onChange={(e) => setFollowUpList(e.target.checked)}
      />
      <label htmlFor="followUpList" style={s.checkboxLabel}>
        Get prompted to create a follow up task every time you complete a task from a list view
      </label>
    </div>

    <div style={s.checkboxRow}>
      <input
        type="checkbox"
        id="followUpDisqualify"
        style={s.checkbox}
        checked={followUpDisqualify}
        onChange={(e) => setFollowUpDisqualify(e.target.checked)}
      />
      <label htmlFor="followUpDisqualify" style={s.checkboxLabel}>
        Get prompted to create a follow up task every time you disqualify a lead
      </label>
    </div>
  </div>
)
