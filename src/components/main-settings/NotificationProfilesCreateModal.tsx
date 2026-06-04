import { MainSettingsFormSidebar } from './MainSettingsFormSidebar'
import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React from 'react'
import { Button } from 'react-bootstrap'
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
    <MainSettingsFormSidebar
      show
      onHide={onClose}
      title="Create notification profile"
      footer={
        <div className="main-settings-form-sidebar-footer">
          <div className="main-settings-form-sidebar-footer__actions">
            <Button variant="outline-secondary" type="button" onClick={onClose} className="contact-form-btn-cancel">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={onCreate}
              disabled={!canCreate}
              className="contact-form-btn-create"
            >
              Create profile
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ fontFamily: baseFont }}>
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
          className="main-settings-form-control"
          style={
            {
              width: '100%',
              padding: '8px 12px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontFamily: baseFont,
              fontWeight: 400,
              color: '#141414',
              border: '1px solid #b8b8b8',
              borderRadius: '8px',
              outline: 'none',
              background: '#fff',
              boxSizing: 'border-box',
              height: '38px',
            } as React.CSSProperties
          }
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#86b7fe'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#b8b8b8'
          }}
        />
      </div>
    </MainSettingsFormSidebar>
  )
}
