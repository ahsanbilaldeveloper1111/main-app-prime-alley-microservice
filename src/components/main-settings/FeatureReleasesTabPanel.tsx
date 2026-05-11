import React, { useState } from 'react'
import { ACCOUNT_DEFAULTS_FONT, Divider, FeatureSectionHeading } from './accountDefaultsTabPrimitives'

export const FeatureReleasesTabContent: React.FC = () => {
  const [gradualRelease, setGradualRelease] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const baseFont = ACCOUNT_DEFAULTS_FONT

  return (
    <div>
      <p style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', fontWeight: 300, marginBottom: '8px' }}>
        Set defaults related to Feature Releases.
      </p>

      <Divider />

      <FeatureSectionHeading title="Gradual Releases">
        When new features and tools are released, you can opt in to get them at the end of the gradual release. This will give
        more time to test changes and prepare users. Upcoming release dates can be found in the{' '}
        <a
          href="/main-settings/product-updates"
          style={{ color: '#0091ae', fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Product Updates page
        </a>
        {'.'}
      </FeatureSectionHeading>

      <button
        type="button"
        aria-pressed={gradualRelease}
        onClick={() => setGradualRelease((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '32px',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            border: `1.5px solid ${gradualRelease ? '#141414' : '#aaa'}`,
            borderRadius: '3px',
            background: gradualRelease ? '#141414' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {gradualRelease && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <div style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 400, color: '#141414', lineHeight: '1.5' }}>
            Put this account at the end of gradual feature releases
          </div>
          <div
            style={{
              fontFamily: baseFont,
              fontSize: '13px',
              fontWeight: 300,
              color: '#555',
              marginTop: '3px',
              lineHeight: '1.5',
            }}
          >
            Note: Opting into this setting will <strong style={{ fontWeight: 700 }}>only</strong> apply to all future
            releases. Changes to this preference apply to the entire account.
          </div>
        </div>
      </button>

      <FeatureSectionHeading title="Email Notifications">
        Get weekly emails about the latest product updates. Changes to this preference will only apply to you.
      </FeatureSectionHeading>

      <button
        type="button"
        aria-pressed={emailNotifications}
        onClick={() => setEmailNotifications((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            border: `1.5px solid ${emailNotifications ? '#141414' : '#aaa'}`,
            borderRadius: '3px',
            background: emailNotifications ? '#141414' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {emailNotifications && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 400, color: '#141414' }}>
          Turn on email notifications
        </span>
      </button>
    </div>
  )
}
