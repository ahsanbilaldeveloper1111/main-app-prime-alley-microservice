import React from 'react'
import { APP_FONT } from '../../styles/fonts'
import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'

export const ACCOUNT_DEFAULTS_FONT = APP_FONT

const HelpDot: React.FC = () => (
  <span
    title="Help"
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
    }}
  >
    i
  </span>
)

const FieldLabelRow: React.FC<{ label: string; helpIcon?: boolean }> = ({ label, helpIcon }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '8px',
      fontFamily: ACCOUNT_DEFAULTS_FONT,
      fontSize: MAIN_SETTINGS_FONT_SIZE.base,
      fontWeight: 600,
      color: '#141414',
    }}
  >
    {label}
    {helpIcon ? <HelpDot /> : null}
  </div>
)

export const InputField: React.FC<{ label: string; value?: string; helpIcon?: boolean }> = ({
  label,
  value = '',
  helpIcon,
}) => (
  <div style={{ marginBottom: '24px' }}>
    <FieldLabelRow label={label} helpIcon={helpIcon} />
    <input
      type="text"
      defaultValue={value}
      style={{
        width: '340px',
        maxWidth: '100%',
        padding: '8px 12px',
        fontSize: MAIN_SETTINGS_FONT_SIZE.input,
        fontFamily: ACCOUNT_DEFAULTS_FONT,
        color: '#141414',
        border: '1px solid #b8b8b8',
        borderRadius: '8px',
        outline: 'none',
        background: '#fff',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = '#86b7fe')}
      onBlur={(e) => (e.currentTarget.style.borderColor = '#b8b8b8')}
    />
  </div>
)

export const SelectField: React.FC<{ label: string; value?: string; options: string[]; helpIcon?: boolean }> = ({
  label,
  value = '',
  options,
  helpIcon,
}) => (
  <div style={{ marginBottom: '24px' }}>
    <FieldLabelRow label={label} helpIcon={helpIcon} />
    <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
      <select
        defaultValue={value}
        style={{
          width: '100%',
          padding: '8px 36px 8px 12px',
          fontSize: MAIN_SETTINGS_FONT_SIZE.input,
          fontFamily: ACCOUNT_DEFAULTS_FONT,
          color: '#141414',
          border: '1px solid #b8b8b8',
          borderRadius: '8px',
          outline: 'none',
          background: '#fff',
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
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
          color: '#6c757d',
          fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
        }}
      >
        ▾
      </span>
    </div>
  </div>
)

export const Divider = () => (
  <hr
    style={{
      border: 'none',
      borderTop: '1px solid #d0d0d0',
      margin: '28px 0',
    }}
  />
)

export const ExternalLinkIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 12 12"
    fill="none"
    style={{ flexShrink: 0, display: 'inline', marginLeft: '3px', verticalAlign: 'middle' }}
  >
    <path
      d="M3.5 1H11M11 1V8.5M11 1L1 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="#6c757d"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.2s',
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      flexShrink: 0,
    }}
  >
    <polyline points="4,2 9,6 4,10" />
  </svg>
)

export const DATA_HOSTING_LOCATIONS = [
  'United States',
  'European Union (Germany)',
  'Asia Pacific (Australia)',
  'Asia Pacific (Singapore)',
  'Canada',
  'United Kingdom',
] as const

export const FeatureSectionHeading: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div style={{ marginBottom: '20px' }}>
    <h2
      style={{
        fontFamily: ACCOUNT_DEFAULTS_FONT,
        fontSize: MAIN_SETTINGS_FONT_SIZE.lg,
        fontWeight: 600,
        color: '#141414',
        marginBottom: '6px',
      }}
    >
      {title}
    </h2>
    <p
      style={{
        fontFamily: ACCOUNT_DEFAULTS_FONT,
        fontSize: MAIN_SETTINGS_FONT_SIZE.input,
        fontWeight: 400,
        color: '#141414',
        lineHeight: '1.6',
        margin: 0,
      }}
    >
      {children}
    </p>
  </div>
)
