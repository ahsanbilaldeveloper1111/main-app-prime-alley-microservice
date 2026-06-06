import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React, { useState } from 'react'
import {
  ACCOUNT_DEFAULTS_FONT,
  DATA_HOSTING_LOCATIONS,
  Divider,
  ExternalLinkIcon,
} from './accountDefaultsTabPrimitives'

const MIGRATION_BULLETS: Array<{ id: string; content: React.ReactNode }> = [
  {
    id: 'unavailable',
    content: (
      <>
        Your account will be <span style={{ color: '#0066CC' }}>unavailable during the migration</span>. Most finish within 24
        hours; some can take up to 36. Your public content will remain online.
      </>
    ),
  },
  {
    id: 'post-migration',
    content: (
      <>
        After the migration completes, your data and settings will remain unchanged, but{' '}
        <button
          type="button"
          onClick={() => null}
          style={{
            color: '#0066CC',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          some steps
          <ExternalLinkIcon />
        </button>{' '}
        may be needed to keep everything running smoothly.
      </>
    ),
  },
  {
    id: 'sandboxes',
    content: (
      <>
        If you have active Sandboxes,{' '}
        <span style={{ color: '#0066CC' }}>they&apos;ll be selected too, but only eligible ones will be migrated</span>{' '}
        —you may need to take action.
      </>
    ),
  },
  {
    id: 'details',
    content: (
      <>
        For more details, check our{' '}
        <button
          type="button"
          onClick={() => null}
          style={{
            color: '#0066CC',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          FAQ
          <ExternalLinkIcon />
        </button>{' '}
        or{' '}
        <button
          type="button"
          onClick={() => null}
          style={{
            color: '#0066CC',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          contact support
          <ExternalLinkIcon />
        </button>
        {'.'}
      </>
    ),
  },
]

export const DataHostingTabContent: React.FC = () => {
  const currentLocation = 'European Union (Germany)'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('')

  const canSchedule = selectedLocation !== ''
  const baseFont = ACCOUNT_DEFAULTS_FONT

  return (
    <>
      <div>
        <p style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.base, color: '#6c757d', fontWeight: 400, marginBottom: '8px' }}>
          View or change the data hosting location for your account.
        </p>

        <Divider />

        <h2 style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.lg, fontWeight: 600, color: '#141414', marginBottom: '20px' }}>
          Data Hosting
        </h2>

        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: baseFont,
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontWeight: 600,
              color: '#141414',
              marginBottom: '10px',
            }}
          >
            Your data hosting location{' '}
            <span
              title="The region where your account data is stored and processed."
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '1.5px solid #6c757d',
                fontSize: MAIN_SETTINGS_FONT_SIZE.xs,
                color: '#6c757d',
                cursor: 'default',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              i
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                padding: '8px 14px',
                border: '1px solid #b8b8b8',
                borderRadius: '8px',
                fontFamily: baseFont,
                fontSize: MAIN_SETTINGS_FONT_SIZE.base,
                fontWeight: 400,
                color: '#141414',
                background: '#fff',
                whiteSpace: 'nowrap',
              }}
            >
              {currentLocation}
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: baseFont,
                fontSize: MAIN_SETTINGS_FONT_SIZE.base,
                fontWeight: 500,
                color: '#0066CC',
                padding: 0,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 99998,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        />
      )}

      <div
        className={[
          'main-settings-form-sidebar',
          sidebarOpen ? 'main-settings-form-sidebar--open' : 'main-settings-form-sidebar--closed',
        ].join(' ')}
        style={{
          position: 'fixed',
          top: 0,
          right: sidebarOpen ? 0 : undefined,
          height: '100vh',
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          zIndex: 99999,
          transition: 'right 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: baseFont,
        }}
      >
        <div
          className="main-settings-form-sidebar__header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #d0d0d0',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.lg, fontWeight: 600, color: '#141414', margin: 0 }}>
            Schedule a data migration
          </h2>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6c757d',
              fontSize: MAIN_SETTINGS_FONT_SIZE.icon,
              lineHeight: 1,
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        <div
          className="main-settings-form-sidebar__body"
          style={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <p
            style={{
              fontFamily: baseFont,
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontWeight: 400,
              color: '#141414',
              marginBottom: '20px',
              lineHeight: '1.6',
            }}
          >
            To change where your data is hosted you&apos;ll need to schedule a data migration. Here&apos;s what you need to
            know:
          </p>

          <ul
            style={{
              margin: '0 0 28px 0',
              padding: '0 0 0 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {MIGRATION_BULLETS.map(({ id, content }) => (
              <li
                key={id}
                style={{
                  fontFamily: baseFont,
                  fontSize: MAIN_SETTINGS_FONT_SIZE.base,
                  fontWeight: 400,
                  color: '#141414',
                  lineHeight: '1.6',
                  listStyleType: 'disc',
                }}
              >
                {content}
              </li>
            ))}
          </ul>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: baseFont,
                fontSize: MAIN_SETTINGS_FONT_SIZE.base,
                fontWeight: 600,
                color: '#141414',
                marginBottom: '10px',
              }}
            >
              New data hosting location <span style={{ color: '#cc3300', marginLeft: '2px' }}>*</span>
            </div>

            <div style={{ position: 'relative' }}>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={
                  {
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    fontSize: MAIN_SETTINGS_FONT_SIZE.base,
                    fontFamily: baseFont,
                    fontWeight: selectedLocation ? 400 : 300,
                    color: selectedLocation ? '#141414' : '#6c757d',
                    border: '1px solid #b8b8b8',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#fff',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    height: '42px',
                  } as React.CSSProperties
                }
                onFocus={(e) => (e.currentTarget.style.borderColor = '#86b7fe')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#b8b8b8')}
              >
                <option value="" disabled>
                  Choose a location
                </option>
                {DATA_HOSTING_LOCATIONS.filter((l) => l !== currentLocation).map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#6c757d',
                  fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
                }}
              >
                ▾
              </span>
            </div>
          </div>
        </div>

        <div
          className="main-settings-form-sidebar__footer"
          style={{
            borderTop: '1px solid #d0d0d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            flexShrink: 0,
            background: '#fff',
          }}
        >
          <button
            type="button"
            className="main-settings-btn-primary"
            disabled={!canSchedule}
            style={{
              padding: '9px 20px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontFamily: baseFont,
              opacity: canSchedule ? 1 : 0.65,
              cursor: canSchedule ? 'pointer' : 'not-allowed',
            }}
          >
            Schedule data migration
          </button>

          <button
            type="button"
            className="main-settings-btn-outline"
            onClick={() => {
              setSidebarOpen(false)
              setSelectedLocation('')
            }}
            style={{
              padding: '9px 20px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontFamily: baseFont,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
