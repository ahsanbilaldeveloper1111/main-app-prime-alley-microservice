import React from 'react'

export type SenderSelectOption = {
  id: number
  label: string
}

type SenderSelectFieldProps = Readonly<{
  label: string
  options: SenderSelectOption[]
  value: number | null
  onChange: (id: number) => void
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  settingsHref?: string
  disabled?: boolean
}>

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#141414',
  minWidth: '60px',
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '8px 12px',
  border: '1px solid #cbd5e0',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#141414',
  backgroundColor: '#fff',
}

type SenderSelectContentProps = Readonly<{
  label: string
  options: SenderSelectOption[]
  value: number | null
  onChange: (id: number) => void
  isLoading: boolean
  isEmpty: boolean
  emptyMessage: string
  settingsHref: string
  disabled: boolean
}>

function SenderSelectContent({
  label,
  options,
  value,
  onChange,
  isLoading,
  isEmpty,
  emptyMessage,
  settingsHref,
  disabled,
}: SenderSelectContentProps) {
  if (isLoading) {
    return <span style={{ fontSize: '14px', color: '#718096' }}>Loading senders…</span>
  }

  if (isEmpty) {
    return (
      <span style={{ fontSize: '13px', color: '#b45309', lineHeight: 1.5 }}>
        {emptyMessage}{' '}
        <a href={settingsHref} style={{ color: '#0091ae' }}>
          Configure senders
        </a>
      </span>
    )
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const next = Number(e.target.value)
        if (!Number.isNaN(next)) {
          onChange(next)
        }
      }}
      disabled={disabled}
      style={selectStyle}
      aria-label={label}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export const SenderSelectField: React.FC<SenderSelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No senders available. Register senders in Settings → Communications.',
  settingsHref = '/main-settings/communications/email',
  disabled = false,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
    <span style={labelStyle}>{label}</span>
    <SenderSelectContent
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      settingsHref={settingsHref}
      disabled={disabled}
    />
  </div>
)
