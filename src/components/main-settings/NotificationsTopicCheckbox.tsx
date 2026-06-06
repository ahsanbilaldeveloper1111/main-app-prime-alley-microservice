import { MAIN_SETTINGS_COLOR, MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React, { type ChangeEventHandler } from 'react'

export type NotificationsTopicCheckboxProps = {
  value: boolean | 'indeterminate' | null
  onChange: ChangeEventHandler<HTMLInputElement>
  id: string
  inputProps?: Record<string, string>
  colWidth: number
}

export const NotificationsTopicCheckbox: React.FC<NotificationsTopicCheckboxProps> = ({
  value,
  onChange,
  id,
  inputProps,
  colWidth,
}) => {
  if (value === null) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: colWidth,
          color: '#bbb',
          fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
        }}
      >
        --
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: colWidth }}>
      <input
        {...(inputProps ?? {})}
        type="checkbox"
        id={id}
        checked={value === true}
        ref={(el) => {
          if (el) el.indeterminate = value === 'indeterminate'
        }}
        onChange={onChange}
        style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: MAIN_SETTINGS_COLOR.primary }}
      />
    </span>
  )
}
