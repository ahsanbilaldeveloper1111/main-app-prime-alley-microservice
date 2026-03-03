import React, { useState } from 'react';
import '../../assets/css/Settings.css';

// ─── Reusable primitives (matching GeneralTabContent style) ───────────────────

const baseFont = 'Lexend Deca, Helvetica, Arial, sans-serif'

const Divider = () => (
  <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '28px 0' }} />
)

const HelpIcon: React.FC<{ title?: string }> = ({ title = 'Help' }) => (
  <span
    title={title}
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
)

const FieldLabel: React.FC<{ children: React.ReactNode; helpIcon?: boolean; helpTitle?: string; sub?: string }> = ({
  children,
  helpIcon,
  helpTitle,
  sub,
}) => (
  <div style={{ marginBottom: sub ? '4px' : '8px' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: baseFont,
        fontSize: '14px',
        fontWeight: 600,
        color: '#141414',
      }}
    >
      {children}
      {helpIcon && <HelpIcon title={helpTitle} />}
    </div>
    {sub && (
      <div style={{ fontFamily: baseFont, fontSize: '13px', fontWeight: 300, color: '#888', marginTop: '2px' }}>
        {sub}
      </div>
    )}
  </div>
)

const SelectField: React.FC<{
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  helpIcon?: boolean
  helpTitle?: string
  sub?: string
  width?: string
}> = ({ label, value, options, onChange, helpIcon, helpTitle, sub, width = '340px' }) => (
  <div style={{ marginBottom: '24px' }}>
    <FieldLabel helpIcon={helpIcon} helpTitle={helpTitle} sub={sub}>
      {label}
    </FieldLabel>
    <div style={{ position: 'relative', width, maxWidth: '100%' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 36px 8px 12px',
          fontSize: '14px',
          fontFamily: baseFont,
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
        } as React.CSSProperties}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
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
  </div>
)

// ─── Font color circle button ──────────────────────────────────────────────────
const ColorDot: React.FC<{ color: string; onClick?: () => void }> = ({ color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: color,
      border: '2px solid #d0d0d0',
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
    }}
  />
)

// ─── Section heading (matches GeneralTabContent <h2>) ─────────────────────────
const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <>
    <h2
      style={{
        fontFamily: baseFont,
        fontSize: '20px',
        fontWeight: 600,
        color: '#141414',
        marginBottom: subtitle ? '6px' : '20px',
      }}
    >
      {title}
    </h2>
    {subtitle && (
      <p style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', marginBottom: '20px', fontWeight: 300 }}>
        {subtitle}
      </p>
    )}
  </>
)

// ─── User Defaults Tab ────────────────────────────────────────────────────────
const UserDefaults: React.FC = () => {
  // New user defaults
  const [language, setLanguage] = useState('English')
  const [dateFormat, setDateFormat] = useState('United States')

  // Email defaults
  const [font, setFont] = useState('Sans Serif')
  const [fontSize, setFontSize] = useState('11')
  const [fontColor, setFontColor] = useState('#333333')

  return (
    <div className='settings-user-defaults-wrapper'>
      {/* Intro */}
      <p style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', marginBottom: '8px', fontWeight: 300 }}>
        Set defaults for users in your account. To add or edit user permissions go to{' '}
        <a href="#" style={{ color: '#0091ae', textDecoration: 'none', fontWeight: 400 }}>
          Users &amp; Teams
        </a>
        .
      </p>

      <Divider />

      {/* ── New user defaults ── */}
      <SectionHeading
        title="New user defaults"
        subtitle="Set defaults for users added to your account. They can update this in user preferences."
      />

      <SelectField
        label="Language"
        value={language}
        onChange={setLanguage}
        helpIcon
        helpTitle="Language used in the interface for new users"
        options={['English', 'French', 'Spanish', 'German', 'Arabic', 'Urdu']}
      />

      <SelectField
        label="Date and number format"
        value={dateFormat}
        onChange={setDateFormat}
        helpIcon
        helpTitle="Sets the date, time, and number format based on locale"
        sub={`Format: ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} and 1,234.56`}
        options={['United States', 'United Kingdom', 'European Union', 'Pakistan', 'Australia']}
      />

      <Divider />

      {/* ── Notifications ── */}
      <SectionHeading
        title="Notifications"
        subtitle="Set notification defaults for all users in your account. They can update this in user preferences."
      />

      <div style={{ marginBottom: '20px' }}>
        <a
          href="#"
          style={{
            fontFamily: baseFont,
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
        <p style={{ fontFamily: baseFont, fontSize: '13px', color: '#555', fontWeight: 300, margin: 0 }}>
          Set up the default notifications for all users in your account who are not included in a profile.
        </p>
      </div>

      <Divider />

      {/* ── Email ── */}
      <SectionHeading
        title="Email"
        subtitle="This default will apply to outgoing emails from the CRM and Inbox email editors for all users of this account."
      />

      {/* Font row: font family + size + color dot */}
      <div style={{ marginBottom: '24px' }}>
        <FieldLabel>Font</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Font family select */}
          <div style={{ position: 'relative', width: '180px' }}>
            <select
              value={font}
              onChange={e => setFont(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 36px 8px 12px',
                fontSize: '14px',
                fontFamily: baseFont,
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
              } as React.CSSProperties}
            >
              {['Sans Serif', 'Serif', 'Monospace', 'Georgia', 'Arial', 'Times New Roman', 'Courier New'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555', fontSize: '12px' }}>▾</span>
          </div>

          {/* Font size select */}
          <div style={{ position: 'relative', width: '80px' }}>
            <select
              value={fontSize}
              onChange={e => setFontSize(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 28px 8px 12px',
                fontSize: '14px',
                fontFamily: baseFont,
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
              } as React.CSSProperties}
            >
              {['8', '9', '10', '11', '12', '14', '16', '18', '24', '36'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555', fontSize: '12px' }}>▾</span>
          </div>

          {/* "pt" label */}
          <span style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', fontWeight: 300 }}>pt</span>

          {/* Color dot */}
          <ColorDot color={fontColor} />
        </div>
      </div>
    </div>
  )
}

export default UserDefaults
