import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React, { useEffect, useState } from 'react'
import { ACCOUNT_DEFAULTS_FONT } from './accountDefaultsTabPrimitives'
import { AVAILABLE_CURRENCY_DEFS } from './currencyTabConstants'
import type { Currency } from './currencyTabTypes'

export interface CurrencyTabAddModalProps {
  onClose: () => void
  onAdd: (currency: Currency) => void
}

export const CurrencyTabAddModal: React.FC<CurrencyTabAddModalProps> = ({ onClose, onAdd }) => {
  const [selected, setSelected] = useState('')
  const [rate, setRate] = useState('')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    globalThis.addEventListener('keydown', handleKeyDown)
    return () => globalThis.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleAdd = () => {
    const found = AVAILABLE_CURRENCY_DEFS.find((c) => c.code === selected)
    if (!found || !rate.trim()) return
    onAdd({
      id: Date.now(),
      name: found.name,
      exchangeRate: rate,
      format: found.format,
      lastUpdatedDate: new Date().toLocaleDateString('en-GB').replaceAll('/', '/'),
      lastUpdatedSource: 'CRM UI',
      updatedBy: 'Rizwan Haider',
      isCompanyCurrency: false,
    })
  }

  const canAdd = selected !== '' && rate.trim() !== ''

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 36px 8px 12px',
    fontSize: MAIN_SETTINGS_FONT_SIZE.base,
    fontFamily: ACCOUNT_DEFAULTS_FONT,
    fontWeight: 300,
    color: '#141414',
    border: '1px solid #b8b8b8',
    borderRadius: '8px',
    outline: 'none',
    background: '#fff',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    height: '38px',
    boxSizing: 'border-box',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: MAIN_SETTINGS_FONT_SIZE.base,
    fontFamily: ACCOUNT_DEFAULTS_FONT,
    fontWeight: 300,
    color: '#141414',
    border: '1px solid #b8b8b8',
    borderRadius: '8px',
    outline: 'none',
    background: '#fff',
    height: '38px',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'default',
        }}
      />
      <dialog
        open
        aria-labelledby="currency-add-title"
        className="main-settings-form-dialog"
        style={{
          position: 'relative',
          background: '#fff',
          border: 'none',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          fontFamily: ACCOUNT_DEFAULTS_FONT,
          color: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 id="currency-add-title" style={{ fontFamily: ACCOUNT_DEFAULTS_FONT, fontSize: MAIN_SETTINGS_FONT_SIZE.lg, fontWeight: 600, color: '#141414', margin: 0 }}>
            Add Currency
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: MAIN_SETTINGS_FONT_SIZE.icon, lineHeight: 1, padding: '0 4px' }}>
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="currency-add-select" style={{ display: 'block', fontFamily: ACCOUNT_DEFAULTS_FONT, fontSize: MAIN_SETTINGS_FONT_SIZE.base, fontWeight: 600, color: '#141414', marginBottom: '8px' }}>Currency</label>
          <div style={{ position: 'relative' }}>
            <select
              id="currency-add-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={selectStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0091ae')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#b8b8b8')}
            >
              <option value="" disabled>
                Select a currency
              </option>
              {AVAILABLE_CURRENCY_DEFS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555', fontSize: MAIN_SETTINGS_FONT_SIZE.sm }}>▾</span>
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label htmlFor="currency-add-rate" style={{ display: 'block', fontFamily: ACCOUNT_DEFAULTS_FONT, fontSize: MAIN_SETTINGS_FONT_SIZE.base, fontWeight: 600, color: '#141414', marginBottom: '8px' }}>Exchange Rate</label>
          <input
            id="currency-add-rate"
            type="number"
            placeholder="e.g. 3.6725"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#0091ae')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#b8b8b8')}
          />
          <p style={{ fontFamily: ACCOUNT_DEFAULTS_FONT, fontSize: MAIN_SETTINGS_FONT_SIZE.sm, fontWeight: 300, color: '#888', marginTop: '6px' }}>
            Exchange rate relative to your company currency (AED).
          </p>
        </div>


        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontWeight: 600,
              fontFamily: ACCOUNT_DEFAULTS_FONT,
              color: '#141414',
              background: '#fff',
              border: '1px solid #b8b8b8',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              padding: '9px 20px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontWeight: 600,
              fontFamily: ACCOUNT_DEFAULTS_FONT,
              color: '#fff',
              background: canAdd ? '#141414' : '#a0a0a0',
              border: 'none',
              borderRadius: '8px',
              cursor: canAdd ? 'pointer' : 'not-allowed',
            }}
          >
            Add Currency
          </button>
        </div>
      </dialog>
    </div>
  )
}
