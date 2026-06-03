import { MainSettingsFormSidebar } from './MainSettingsFormSidebar'
import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React, { useState } from 'react'
import { Button } from 'react-bootstrap'
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
    <MainSettingsFormSidebar
      show
      onHide={onClose}
      title="Add Currency"
      footer={
        <div className="main-settings-form-sidebar-footer">
          <div className="main-settings-form-sidebar-footer__actions">
            <Button variant="outline-secondary" type="button" onClick={onClose} className="contact-form-btn-cancel">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="contact-form-btn-create"
            >
              Add Currency
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ fontFamily: ACCOUNT_DEFAULTS_FONT }}>
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="currency-add-select"
            style={{
              display: 'block',
              fontFamily: ACCOUNT_DEFAULTS_FONT,
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontWeight: 600,
              color: '#141414',
              marginBottom: '8px',
            }}
          >
            Currency
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="currency-add-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={selectStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0091ae'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#b8b8b8'
              }}
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
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#555',
                fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
              }}
            >
              ▾
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="currency-add-rate"
            style={{
              display: 'block',
              fontFamily: ACCOUNT_DEFAULTS_FONT,
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontWeight: 600,
              color: '#141414',
              marginBottom: '8px',
            }}
          >
            Exchange Rate
          </label>
          <input
            id="currency-add-rate"
            type="number"
            placeholder="e.g. 3.6725"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#0091ae'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#b8b8b8'
            }}
          />
          <p
            style={{
              fontFamily: ACCOUNT_DEFAULTS_FONT,
              fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
              fontWeight: 300,
              color: '#888',
              marginTop: '6px',
            }}
          >
            Exchange rate relative to your company currency (AED).
          </p>
        </div>
      </div>
    </MainSettingsFormSidebar>
  )
}
