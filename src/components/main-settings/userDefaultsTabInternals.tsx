import React from 'react'
import { ACCOUNT_DEFAULTS_FONT } from './accountDefaultsTabPrimitives'

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
        fontFamily: ACCOUNT_DEFAULTS_FONT,
        fontSize: '14px',
        fontWeight: 600,
        color: '#141414',
      }}
    >
      {children}
      {helpIcon ? <HelpIcon title={helpTitle} /> : null}
    </div>
    {sub ? (
      <div
        style={{ fontFamily: ACCOUNT_DEFAULTS_FONT, fontSize: '13px', fontWeight: 300, color: '#888', marginTop: '2px' }}
      >
        {sub}
      </div>
    ) : null}
  </div>
)

export const UserDefaultsSelectField: React.FC<{
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
        onChange={(e) => onChange(e.target.value)}
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
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
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

export const ColorDot: React.FC<{ color: string; onClick?: () => void }> = ({ color, onClick }) => (
  <button
    type="button"
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

export const UserDefaultsSectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <>
    <h2
      style={{
        fontFamily: ACCOUNT_DEFAULTS_FONT,
        fontSize: '20px',
        fontWeight: 600,
        color: '#141414',
        marginBottom: subtitle ? '6px' : '20px',
      }}
    >
      {title}
    </h2>
    {subtitle ? (
      <p style={{ fontFamily: ACCOUNT_DEFAULTS_FONT, fontSize: '14px', color: '#555', marginBottom: '20px', fontWeight: 300 }}>
        {subtitle}
      </p>
    ) : null}
  </>
)

export const UserDefaultsFieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FieldLabel>{children}</FieldLabel>
)
