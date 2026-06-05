import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React from 'react'
import { ACCOUNT_DEFAULTS_FONT } from './accountDefaultsTabPrimitives'
import type { NotificationProfile } from './notificationProfilesTypes'

export interface NotificationProfilesProfileListProps {
  profiles: NotificationProfile[]
  onRemove: (id: string) => void
}

export const NotificationProfilesProfileList: React.FC<NotificationProfilesProfileListProps> = ({
  profiles,
  onRemove,
}) => {
  if (profiles.length === 0) return null

  const baseFont = ACCOUNT_DEFAULTS_FONT

  return (
    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {profiles.map(({ id, name }) => (
        <div
          key={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            border: '1px solid #c4c4c4',
            borderRadius: '8px',
            fontFamily: baseFont,
            fontSize: MAIN_SETTINGS_FONT_SIZE.base,
            fontWeight: 400,
            color: '#141414',
            background: '#fff',
          }}
        >
          <span>{name}</span>
          <button
            type="button"
            onClick={() => onRemove(id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6c757d',
              fontSize: MAIN_SETTINGS_FONT_SIZE.lg,
              lineHeight: 1,
              padding: '0 4px',
              fontFamily: baseFont,
            }}
            title="Remove profile"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
