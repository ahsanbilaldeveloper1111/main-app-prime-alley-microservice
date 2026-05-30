import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React from 'react'
import { ACCOUNT_DEFAULTS_FONT } from './accountDefaultsTabPrimitives'

export interface NotificationProfilesCreateModalProps {
  profileName: string
  setProfileName: (v: string) => void
  onClose: () => void
  onCreate: () => void
}

export const NotificationProfilesCreateModal: React.FC<NotificationProfilesCreateModalProps> = ({
  profileName,
  setProfileName,
  onClose,
  onCreate,
}) => {
  const baseFont = ACCOUNT_DEFAULTS_FONT
  const trimmed = profileName.trim()
  const canCreate = trimmed.length > 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      />
      <div
        className="main-settings-form-dialog"
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          fontFamily: baseFont,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.lg, fontWeight: 600, color: '#141414', margin: 0 }}>
            Create notification profile
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#888',
              fontSize: MAIN_SETTINGS_FONT_SIZE.icon,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="notification-profile-name"
            style={{
              display: 'block',
              fontFamily: baseFont,
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontWeight: 600,
              color: '#141414',
              marginBottom: '8px',
            }}
          >
            Profile name
          </label>
          <input
            id="notification-profile-name"
            type="text"
            placeholder="e.g. Sales Team Default"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canCreate && onCreate()}
            autoFocus
            style={
              {
                width: '100%',
                padding: '8px 12px',
                fontSize: MAIN_SETTINGS_FONT_SIZE.base,
                fontFamily: baseFont,
                fontWeight: 300,
                color: '#141414',
                border: '1px solid #b8b8b8',
                borderRadius: '8px',
                outline: 'none',
                background: '#fff',
                boxSizing: 'border-box',
                height: '38px',
              } as React.CSSProperties
            }
            onFocus={(e) => (e.currentTarget.style.borderColor = '#0091ae')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#b8b8b8')}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontFamily: baseFont,
              fontWeight: 300,
              color: '#141414',
              background: '#fff',
              border: '1px solid #b8b8b8',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={!canCreate}
            style={{
              padding: '9px 20px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontFamily: baseFont,
              fontWeight: 500,
              color: '#fff',
              background: canCreate ? '#141414' : '#a0a0a0',
              border: 'none',
              borderRadius: '8px',
              cursor: canCreate ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Create profile
          </button>
        </div>
      </div>
    </div>
  )
}
