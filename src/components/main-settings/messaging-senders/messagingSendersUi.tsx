import React from 'react'
import { ACCOUNT_DEFAULTS_FONT } from '../accountDefaultsTabPrimitives'

export const MESSAGING_SENDERS_FONT = ACCOUNT_DEFAULTS_FONT

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

const STATUS_COLORS: Record<StatusTone, { bg: string; text: string; border: string }> = {
  success: { bg: '#e8f5ef', text: '#1a7a5e', border: '#1a7a5e' },
  warning: { bg: '#fff8e6', text: '#8a6d00', border: '#c9a800' },
  danger: { bg: '#fdecea', text: '#b42318', border: '#b42318' },
  neutral: { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },
}

export function statusToneForEmailVerification(status: string): StatusTone {
  if (status === 'verified') return 'success'
  if (status === 'failed') return 'danger'
  return 'warning'
}

export function statusToneForWhatsAppStatus(status: string): StatusTone {
  if (status === 'ONLINE') return 'success'
  if (status === 'CREATING' || status === 'OFFLINE') return 'warning'
  return 'neutral'
}

export const StatusBadge: React.FC<{ label: string; tone: StatusTone }> = ({ label, tone }) => {
  const colors = STATUS_COLORS[tone]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: MESSAGING_SENDERS_FONT,
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export const SectionHeading: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <header style={{ marginBottom: '24px' }}>
    <h2
      style={{
        fontFamily: MESSAGING_SENDERS_FONT,
        fontSize: '18px',
        fontWeight: 600,
        color: '#141414',
        margin: '0 0 8px',
      }}
    >
      {title}
    </h2>
    <p
      style={{
        fontFamily: MESSAGING_SENDERS_FONT,
        fontSize: '14px',
        fontWeight: 300,
        color: '#555',
        margin: 0,
        maxWidth: '720px',
        lineHeight: 1.5,
      }}
    >
      {description}
    </p>
  </header>
)

export const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section
    style={{
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      padding: '20px 24px',
      marginBottom: '24px',
      background: '#fff',
    }}
  >
    <h3
      style={{
        fontFamily: MESSAGING_SENDERS_FONT,
        fontSize: '15px',
        fontWeight: 600,
        color: '#141414',
        margin: '0 0 16px',
      }}
    >
      {title}
    </h3>
    {children}
  </section>
)

type TextFieldProps = Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  hint?: string
}>

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  hint,
}) => (
  <div style={{ marginBottom: '16px' }}>
    <label
      style={{
        display: 'block',
        marginBottom: '6px',
        fontFamily: MESSAGING_SENDERS_FONT,
        fontSize: '14px',
        fontWeight: 600,
        color: '#141414',
      }}
    >
      {label}
      {required ? ' *' : ''}
    </label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        maxWidth: '420px',
        padding: '8px 12px',
        fontSize: '14px',
        fontFamily: MESSAGING_SENDERS_FONT,
        color: '#141414',
        border: '1px solid #d0d0d0',
        borderRadius: '4px',
        outline: 'none',
        background: '#fff',
        boxSizing: 'border-box',
      }}
    />
    {hint ? (
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: MESSAGING_SENDERS_FONT,
          fontSize: '12px',
          color: '#777',
        }}
      >
        {hint}
      </p>
    ) : null}
  </div>
)

type SelectFieldProps = Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
}>

export const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: '16px' }}>
    <label
      style={{
        display: 'block',
        marginBottom: '6px',
        fontFamily: MESSAGING_SENDERS_FONT,
        fontSize: '14px',
        fontWeight: 600,
        color: '#141414',
      }}
    >
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        maxWidth: '420px',
        padding: '8px 12px',
        fontSize: '14px',
        fontFamily: MESSAGING_SENDERS_FONT,
        color: '#141414',
        border: '1px solid #d0d0d0',
        borderRadius: '4px',
        outline: 'none',
        background: '#fff',
        boxSizing: 'border-box',
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
)

function getActionButtonStyles(variant: 'primary' | 'secondary' | 'danger') {
  if (variant === 'primary') {
    return { bg: '#0091ae', color: '#fff', border: '#0091ae' }
  }
  if (variant === 'danger') {
    return { bg: '#fff', color: '#b42318', border: '#f5c2c0' }
  }
  return { bg: '#fff', color: '#141414', border: '#d0d0d0' }
}

export const ActionButton: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit'
}> = ({ children, onClick, disabled, variant = 'primary', type = 'button' }) => {
  const styles = getActionButtonStyles(variant)

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        fontFamily: MESSAGING_SENDERS_FONT,
        fontWeight: 500,
        color: styles.color,
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}

export const InlineAlert: React.FC<{ tone: StatusTone; children: React.ReactNode }> = ({
  tone,
  children,
}) => {
  const colors = STATUS_COLORS[tone]
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '6px',
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.text,
        fontFamily: MESSAGING_SENDERS_FONT,
        fontSize: '14px',
        marginBottom: '16px',
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  )
}

export const ModeBadge: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '4px',
      background: '#f0f7fa',
      color: '#006f87',
      fontFamily: MESSAGING_SENDERS_FONT,
      fontSize: '13px',
      fontWeight: 500,
      marginBottom: '16px',
    }}
  >
    Account mode: {label}
  </span>
)

export const DefaultBadge: React.FC = () => (
  <span
    style={{
      display: 'inline-block',
      marginLeft: '8px',
      padding: '1px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 500,
      fontFamily: MESSAGING_SENDERS_FONT,
      background: '#eef2ff',
      color: '#4338ca',
      border: '1px solid #c7d2fe',
    }}
  >
    Default
  </span>
)

export function formatTenantModeLabel(mode: string | null): string {
  if (mode === 'byo_sendgrid') return 'Bring your own SendGrid'
  if (mode === 'byo_twilio') return 'Bring your own Twilio'
  if (mode === 'platform') return 'Platform (shared account)'
  return 'Not configured'
}
