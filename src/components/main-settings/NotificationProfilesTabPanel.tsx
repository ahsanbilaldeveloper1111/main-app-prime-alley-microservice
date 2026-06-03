import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React from 'react'
import {
  ACCOUNT_DEFAULTS_FONT,
  Divider,
  ExternalLinkIcon,
} from './accountDefaultsTabPrimitives'
import { NOTIFICATION_PROFILES_PRESETS_HREF } from './notificationProfilesConstants'
import { NotificationProfilesCreateModal } from './NotificationProfilesCreateModal'
import { NotificationProfilesProfileList } from './NotificationProfilesProfileList'
import { useNotificationProfilesState } from './useNotificationProfilesState'

export const NotificationProfilesTabContent: React.FC = () => {
  const {
    showModal,
    profileName,
    setProfileName,
    profiles,
    openModal,
    closeModal,
    removeProfile,
    createProfile,
  } = useNotificationProfilesState()

  const baseFont = ACCOUNT_DEFAULTS_FONT

  return (
    <div>
      <p style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.base, color: '#555', marginBottom: '8px', fontWeight: 300 }}>
        These defaults will be used for user defaults and presets.
      </p>

      <Divider />

      <h2
        style={{
          fontFamily: baseFont,
          fontSize: MAIN_SETTINGS_FONT_SIZE.md,
          fontWeight: 600,
          color: '#141414',
          marginBottom: '6px',
        }}
      >
        Notification Profiles
      </h2>
      <p style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.base, color: '#555', fontWeight: 300, marginBottom: '20px' }}>
        Set notification defaults for a group of users within a preset. To add or edit Presets go to{' '}
        <a
          href={NOTIFICATION_PROFILES_PRESETS_HREF}
          style={{
            color: '#0091ae',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Presets
          <ExternalLinkIcon />
        </a>
        {'.'}
      </p>

      <button
        type="button"
        onClick={openModal}
        style={{
          padding: '9px 18px',
          fontSize: MAIN_SETTINGS_FONT_SIZE.base,
          fontFamily: baseFont,
          fontWeight: 500,
          color: '#141414',
          background: '#fff',
          border: '1px solid #b8b8b8',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#141414')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#b8b8b8')}
      >
        Create notification profile
      </button>

      <NotificationProfilesProfileList profiles={profiles} onRemove={removeProfile} />

      {showModal ? (
        <NotificationProfilesCreateModal
          profileName={profileName}
          setProfileName={setProfileName}
          onClose={closeModal}
          onCreate={createProfile}
        />
      ) : null}
    </div>
  )
}
