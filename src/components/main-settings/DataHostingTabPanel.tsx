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
        Your account will be <span style={{ color: '#0091ae' }}>unavailable during the migration</span>. Most finish within 24
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
            color: '#0091ae',
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
        <span style={{ color: '#0091ae' }}>they&apos;ll be selected too, but only eligible ones will be migrated</span>{' '}
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
            color: '#0091ae',
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
            color: '#0091ae',
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
        <p style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', fontWeight: 300, marginBottom: '8px' }}>
          View or change the data hosting location for your account.
        </p>

        <Divider />

        <h2 style={{ fontFamily: baseFont, fontSize: '20px', fontWeight: 600, color: '#141414', marginBottom: '20px' }}>
          Data Hosting
        </h2>

        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: baseFont,
              fontSize: '14px',
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
                border: '1.5px solid #888',
                fontSize: '10px',
                color: '#888',
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
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontFamily: baseFont,
                fontSize: '14px',
                fontWeight: 300,
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
                fontSize: '14px',
                fontWeight: 500,
                color: '#0091ae',
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
        style={{
          position: 'fixed',
          top: 0,
          right: sidebarOpen ? 0 : '-600px',
          width: '575px',
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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 32px 24px',
            borderBottom: '1px solid #e8e8e8',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontFamily: baseFont, fontSize: '20px', fontWeight: 700, color: '#141414', margin: 0 }}>
            Schedule a data migration
          </h2>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#555',
              fontSize: '22px',
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
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
          }}
        >
          <p
            style={{
              fontFamily: baseFont,
              fontSize: '14px',
              fontWeight: 300,
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
                  fontSize: '14px',
                  fontWeight: 300,
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
                fontSize: '14px',
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
                    fontSize: '14px',
                    fontFamily: baseFont,
                    fontWeight: selectedLocation ? 400 : 300,
                    color: selectedLocation ? '#141414' : '#888',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    outline: 'none',
                    background: '#fff',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    height: '42px',
                  } as React.CSSProperties
                }
                onFocus={(e) => (e.currentTarget.style.borderColor = '#0091ae')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#d0d0d0')}
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
                  color: '#555',
                  fontSize: '13px',
                }}
              >
                ▾
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '20px 32px',
            borderTop: '1px solid #e8e8e8',
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
            disabled={!canSchedule}
            style={{
              padding: '9px 20px',
              fontSize: '14px',
              fontFamily: baseFont,
              fontWeight: 400,
              color: canSchedule ? '#141414' : '#aaa',
              background: '#fff',
              border: `1px solid ${canSchedule ? '#d0d0d0' : '#e0e0e0'}`,
              borderRadius: '4px',
              cursor: canSchedule ? 'pointer' : 'not-allowed',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (canSchedule) e.currentTarget.style.borderColor = '#141414'
            }}
            onMouseLeave={(e) => {
              if (canSchedule) e.currentTarget.style.borderColor = '#d0d0d0'
            }}
          >
            Schedule data migration
          </button>

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false)
              setSelectedLocation('')
            }}
            style={{
              padding: '9px 20px',
              fontSize: '14px',
              fontFamily: baseFont,
              fontWeight: 500,
              color: '#141414',
              background: '#fff',
              border: '1px solid #141414',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
