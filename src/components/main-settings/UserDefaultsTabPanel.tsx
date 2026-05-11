import React, { useState } from 'react'
import '../../assets/css/Settings.css'
import { ACCOUNT_DEFAULTS_FONT, Divider } from './accountDefaultsTabPrimitives'
import {
  ColorDot,
  UserDefaultsFieldLabel,
  UserDefaultsSelectField,
  UserDefaultsSectionHeading,
} from './userDefaultsTabInternals'

const EMAIL_FONT_OPTIONS = ['Sans Serif', 'Serif', 'Monospace', 'Georgia', 'Arial', 'Times New Roman', 'Courier New'] as const
const EMAIL_FONT_SIZE_OPTIONS = ['8', '9', '10', '11', '12', '14', '16', '18', '24', '36'] as const
const LANGUAGE_OPTIONS = ['English', 'French', 'Spanish', 'German', 'Arabic', 'Urdu'] as const
const DATE_FORMAT_OPTIONS = ['United States', 'United Kingdom', 'European Union', 'Pakistan', 'Australia'] as const

const UserDefaultsTabPanel: React.FC = () => {
  const [language, setLanguage] = useState('English')
  const [dateFormat, setDateFormat] = useState('United States')
  const [font, setFont] = useState('Sans Serif')
  const [fontSize, setFontSize] = useState('11')
  const fontColor = '#333333'

  return (
    <div className="settings-user-defaults-wrapper">
      <p style={{ fontFamily: ACCOUNT_DEFAULTS_FONT, fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: 300 }}>
        Set defaults for users in your account. To add or edit user permissions go to{' '}
        <a href="/main-settings/users-teams" style={{ color: '#0091ae', textDecoration: 'none', fontWeight: 400 }}>
          Users &amp; Teams
        </a>
        {'.'}
      </p>

      <Divider />

      <UserDefaultsSectionHeading
        title="New user defaults"
        subtitle="Set defaults for users added to your account. They can update this in user preferences."
      />

      <UserDefaultsSelectField
        label="Language"
        value={language}
        onChange={setLanguage}
        helpIcon
        helpTitle="Language used in the interface for new users"
        options={[...LANGUAGE_OPTIONS]}
      />

      <UserDefaultsSelectField
        label="Date and number format"
        value={dateFormat}
        onChange={setDateFormat}
        helpIcon
        helpTitle="Sets the date, time, and number format based on locale"
        sub={`Format: ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} and 1,234.56`}
        options={[...DATE_FORMAT_OPTIONS]}
      />

      <Divider />

      <UserDefaultsSectionHeading
        title="Notifications"
        subtitle="Set notification defaults for all users in your account. They can update this in user preferences."
      />

      <div style={{ marginBottom: '20px' }}>
        <a
          href="/main-settings/notifications"
          style={{
            fontFamily: ACCOUNT_DEFAULTS_FONT,
            fontSize: '14px',
            fontWeight: 500,
            color: '#0091ae',
            textDecoration: 'none',
            display: 'block',
            marginBottom: '4px',
          }}
        >
          Manage account defaults
        </a>
        <p style={{ fontFamily: ACCOUNT_DEFAULTS_FONT, fontSize: '13px', color: '#555', fontWeight: 300, margin: 0 }}>
          Set up the default notifications for all users in your account who are not included in a profile.
        </p>
      </div>

      <Divider />

      <UserDefaultsSectionHeading
        title="Email"
        subtitle="This default will apply to outgoing emails from the CRM and Inbox email editors for all users of this account."
      />

      <div style={{ marginBottom: '24px' }}>
        <UserDefaultsFieldLabel>Font</UserDefaultsFieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '180px' }}>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              style={
                {
                  width: '100%',
                  padding: '8px 36px 8px 12px',
                  fontSize: '14px',
                  fontFamily: ACCOUNT_DEFAULTS_FONT,
                  color: '#141414',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  outline: 'none',
                  background: '#fff',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  height: '38px',
                } as React.CSSProperties
              }
            >
              {EMAIL_FONT_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#555',
                fontSize: '12px',
              }}
            >
              ▾
            </span>
          </div>

          <div style={{ position: 'relative', width: '80px' }}>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              style={
                {
                  width: '100%',
                  padding: '8px 28px 8px 12px',
                  fontSize: '14px',
                  fontFamily: ACCOUNT_DEFAULTS_FONT,
                  color: '#141414',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  outline: 'none',
                  background: '#fff',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  height: '38px',
                } as React.CSSProperties
              }
            >
              {EMAIL_FONT_SIZE_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#555',
                fontSize: '12px',
              }}
            >
              ▾
            </span>
          </div>

          <span style={{ fontFamily: ACCOUNT_DEFAULTS_FONT, fontSize: '14px', color: '#555', fontWeight: 300 }}>pt</span>

          <ColorDot color={fontColor} />
        </div>
      </div>
    </div>
  )
}

export default UserDefaultsTabPanel
