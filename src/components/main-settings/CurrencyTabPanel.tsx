import {
  MAIN_SETTINGS_FONT_SIZE,
  MAIN_SETTINGS_FONT_WEIGHT,
  mainSettingsPrimaryButtonStyle,
} from './mainSettingsTokens'
import React, { useMemo, useState } from 'react'
import GenericTable, { type TableColumn } from '@components/GenericTable'
import '../../assets/css/Settings.css'
import { ACCOUNT_DEFAULTS_FONT, Divider, ExternalLinkIcon } from './accountDefaultsTabPrimitives'
import { CurrencyTabAddModal } from './CurrencyTabAddModal'
import { INITIAL_CURRENCIES } from './currencyTabConstants'
import type { Currency } from './currencyTabTypes'

function buildCurrencyColumns(baseFont: string): TableColumn<Currency>[] {
  return [
    {
      key: 'name',
      label: 'Name',
      type: 'custom',
      render: (row: Currency) => (
        <span style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.base, fontWeight: 400, color: '#141414' }}>{row.name}</span>
      ),
    },
    {
      key: 'exchangeRate',
      label: 'Exchange Rate',
      align: 'right',
      type: 'custom',
      render: (row: Currency) =>
        row.isCompanyCurrency ? (
          <span
            style={{
              display: 'inline-block',
              padding: '3px 12px',
              border: '1.5px solid #1a7a5e',
              borderRadius: '20px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
              fontWeight: 500,
              color: '#1a7a5e',
              fontFamily: baseFont,
              whiteSpace: 'nowrap',
            }}
          >
            Company Currency
          </span>
        ) : (
          <span style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.base, fontWeight: 400, color: '#141414' }}>{row.exchangeRate}</span>
        ),
    },
    {
      key: 'format',
      label: 'Format',
      type: 'custom',
      render: (row: Currency) => (
        <span style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.base, fontWeight: 400, color: '#141414' }}>{row.format}</span>
      ),
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      type: 'custom',
      render: (row: Currency) => (
        <div>
          <div style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.base, fontWeight: 400, color: '#141414' }}>{row.lastUpdatedDate}</div>
          <div style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.sm, fontWeight: 400, color: '#6c757d' }}>{row.lastUpdatedSource}</div>
          {row.updatedBy ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <span style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.sm, fontWeight: 400, color: '#6c757d' }}>by</span>
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0d6efd 0%, #198754 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: MAIN_SETTINGS_FONT_SIZE.xs,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                RH
              </span>
              <span style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.sm, fontWeight: 400, color: '#141414' }}>{row.updatedBy}</span>
            </div>
          ) : null}
        </div>
      ),
    },
  ]
}

const CurrencyTabPanel: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>(INITIAL_CURRENCIES)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const baseFont = ACCOUNT_DEFAULTS_FONT
  const columns = useMemo(() => buildCurrencyColumns(baseFont), [baseFont])

  const handleAddCurrency = (currency: Currency) => {
    setCurrencies((prev) => [...prev, currency])
    setShowAddModal(false)
  }

  return (
    <div>
      <p style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.base, color: '#6c757d', fontWeight: 400, marginBottom: '8px' }}>These defaults will be used for deals and properties.</p>

      <Divider />

      <div
        style={{
          border: '1px solid #c4c4c4',
          borderRadius: '6px',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '24px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.base, fontWeight: 600, color: '#141414' }}>Schedule automatic exchange rate updates.</span>
            <a
              href="/main-settings/help-center"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: baseFont,
                fontSize: MAIN_SETTINGS_FONT_SIZE.base,
                fontWeight: 500,
                color: '#0066CC',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Learn more <ExternalLinkIcon />
            </a>
          </div>
          <div style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.sm, fontWeight: 400, color: '#6c757d', marginBottom: '14px' }}>
            <strong style={{ fontWeight: 600, color: '#141414' }}>Frequency:</strong> Monthly &nbsp;|&nbsp;{' '}
            <strong style={{ fontWeight: 600, color: '#141414' }}>Update status:</strong> Completed on 03/03/2026 + Next update on 03/04/2026
          </div>
          <button
            type="button"
            style={{
              padding: '6px 14px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
              fontFamily: baseFont,
              fontWeight: 400,
              color: '#141414',
              background: '#fff',
              border: '1px solid #b8b8b8',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#141414')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#b8b8b8')}
          >
            View history
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setAutoUpdateEnabled((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '7px 14px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
              fontFamily: baseFont,
              fontWeight: 500,
              color: '#fff',
              background: autoUpdateEnabled ? '#141414' : '#a0a0a0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {autoUpdateEnabled ? (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
            {autoUpdateEnabled ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              background: '#fff',
              border: '1px solid #b8b8b8',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#141414')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#b8b8b8')}
            title="Edit schedule"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: baseFont, fontSize: MAIN_SETTINGS_FONT_SIZE.lg, fontWeight: 600, color: '#141414', margin: 0 }}>All Currencies</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            style={{
              padding: '9px 20px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              fontWeight: 600,
              fontFamily: baseFont,
              color: '#141414',
              background: '#fff',
              border: '1px solid #b8b8b8',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#141414')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#b8b8b8')}
          >
            Exchange rate log
          </button>
          <button
            type="button"
            className="main-settings-btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{
              ...mainSettingsPrimaryButtonStyle,
              padding: '9px 20px',
              fontWeight: MAIN_SETTINGS_FONT_WEIGHT.semibold,
            }}
          >
            Add Currency
          </button>
        </div>
      </div>

      <div
        style={{
          background: '#eaf4fb',
          border: '1px solid #b8dcf0',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '0px',
          fontFamily: baseFont,
          fontSize: MAIN_SETTINGS_FONT_SIZE.base,
          fontWeight: 400,
          color: '#141414',
          lineHeight: '1.6',
        }}
      >
        Open records (including deals) use these exchange rates. Closed records use the exchange rate at the time of closing.{' '}
        <a
          href="/main-settings/help-center"
          style={{ color: '#0066CC', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Learn more <ExternalLinkIcon />
        </a>
      </div>

      <GenericTable
        data={currencies}
        columns={columns}
        showActions={false}
        uniqueKey="id"
        hover={true}
        loading={false}
        emptyMessage="No currencies added yet"
        fixedHeight={false}
      />

      {showAddModal ? <CurrencyTabAddModal onClose={() => setShowAddModal(false)} onAdd={handleAddCurrency} /> : null}
    </div>
  )
}

export default CurrencyTabPanel
