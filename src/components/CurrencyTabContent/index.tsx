
import React, { useState } from 'react'
import GenericTable from '@components/GenericTable'
import '../../assets/css/Settings.css'
// ─── Types ────────────────────────────────────────────────────────────────────
interface Currency {
    id: number
    name: string
    exchangeRate: string | null
    format: string
    lastUpdatedDate: string
    lastUpdatedSource: string
    updatedBy?: string
    isCompanyCurrency?: boolean
  }
  
  // ─── Initial data ─────────────────────────────────────────────────────────────
  const initialCurrencies: Currency[] = [
    {
      id: 1,
      name: 'United Arab Emirates Dirham (AED) د.إ',
      exchangeRate: null,
      format: 'AED 123,456.78',
      lastUpdatedDate: '26/02/2026',
      lastUpdatedSource: 'CRM UI',
      updatedBy: 'Rizwan Haider',
      isCompanyCurrency: true,
    },
    {
      id: 2,
      name: 'US Dollar (USD) $',
      exchangeRate: '3.6725',
      format: 'US$123,456.78',
      lastUpdatedDate: '03/03/2026',
      lastUpdatedSource: 'Exchange Rate Updates',
      isCompanyCurrency: false,
    },
  ]
  
  // ─── Currency Tab ─────────────────────────────────────────────────────────────
  const CurrencyTabContent: React.FC = () => {
    const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies)
    const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
  
    const handleAddCurrency = (currency: Currency) => {
      setCurrencies(prev => [...prev, currency])
      setShowAddModal(false)
    }
    
    // ─── Shared primitives ────────────────────────────────────────────────────────
  const baseFont = 'Lexend Deca, Helvetica, Arial, sans-serif'
  
  const Divider = () => (
    <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '28px 0' }} />
  )
  
  const ExternalLinkIcon = () => (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ display: 'inline', marginLeft: '3px', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M3.5 1H11M11 1V8.5M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  
  
  // ─── Add Currency Modal ───────────────────────────────────────────────────────
  const AVAILABLE_CURRENCIES = [
    { code: 'EUR', name: 'Euro (EUR) €', format: '€123,456.78' },
    { code: 'GBP', name: 'British Pound (GBP) £', format: '£123,456.78' },
    { code: 'PKR', name: 'Pakistani Rupee (PKR) ₨', format: '₨123,456.78' },
    { code: 'SAR', name: 'Saudi Riyal (SAR) ر.س', format: 'SAR 123,456.78' },
    { code: 'INR', name: 'Indian Rupee (INR) ₹', format: '₹123,456.78' },
    { code: 'CAD', name: 'Canadian Dollar (CAD) $', format: 'CA$123,456.78' },
    { code: 'AUD', name: 'Australian Dollar (AUD) $', format: 'A$123,456.78' },
  ]
  
  interface AddCurrencyModalProps {
    onClose: () => void
    onAdd: (currency: Currency) => void
    existingIds: number[]
  }
  
  const AddCurrencyModal: React.FC<AddCurrencyModalProps> = ({ onClose, onAdd, existingIds }) => {
    const [selected, setSelected] = useState('')
    const [rate, setRate] = useState('')
  
    const handleAdd = () => {
      const found = AVAILABLE_CURRENCIES.find(c => c.code === selected)
      if (!found || !rate.trim()) return
      onAdd({
        id: Date.now(),
        name: found.name,
        exchangeRate: rate,
        format: found.format,
        lastUpdatedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '/'),
        lastUpdatedSource: 'CRM UI',
        updatedBy: 'Rizwan Haider',
        isCompanyCurrency: false,
      })
    }
  
    const canAdd = selected !== '' && rate.trim() !== ''
  
    const selectStyle: React.CSSProperties = {
      width: '100%',
      padding: '8px 36px 8px 12px',
      fontSize: '14px',
      fontFamily: baseFont,
      fontWeight: 300,
      color: '#141414',
      border: '1px solid #d0d0d0',
      borderRadius: '4px',
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
      fontSize: '14px',
      fontFamily: baseFont,
      fontWeight: 300,
      color: '#141414',
      border: '1px solid #d0d0d0',
      borderRadius: '4px',
      outline: 'none',
      background: '#fff',
      height: '38px',
      boxSizing: 'border-box',
    }
  
    return (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div style={{ background: '#fff', borderRadius: '6px', width: '480px', maxWidth: '95vw', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', fontFamily: baseFont }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: baseFont, fontSize: '18px', fontWeight: 600, color: '#141414', margin: 0 }}>Add Currency</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '22px', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
  
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontFamily: baseFont, fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}>Currency</label>
            <div style={{ position: 'relative' }}>
              <select value={selected} onChange={e => setSelected(e.target.value)} style={selectStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#0091ae')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
              >
                <option value="" disabled>Select a currency</option>
                {AVAILABLE_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555', fontSize: '12px' }}>▾</span>
            </div>
          </div>
  
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontFamily: baseFont, fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}>Exchange Rate</label>
            <input
              type="number"
              placeholder="e.g. 3.6725"
              value={rate}
              onChange={e => setRate(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#0091ae')}
              onBlur={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
            />
            <p style={{ fontFamily: baseFont, fontSize: '12px', fontWeight: 300, color: '#888', marginTop: '6px' }}>
              Exchange rate relative to your company currency (AED).
            </p>
          </div>
  
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: 600, fontFamily: baseFont, color: '#141414', background: '#fff', border: '1px solid #d0d0d0', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              style={{ padding: '9px 20px', fontSize: '14px', fontWeight: 600, fontFamily: baseFont, color: '#fff', background: canAdd ? '#141414' : '#a0a0a0', border: 'none', borderRadius: '4px', cursor: canAdd ? 'pointer' : 'not-allowed' }}
            >
              Add Currency
            </button>
          </div>
        </div>
      </div>
    )
  }
  
    // ── GenericTable columns ──────────────────────────────────────────────────
    const columns = [
      {
        key: 'name',
        label: 'Name',
        render: (row: Currency) => (
          <span style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 300, color: '#141414' }}>
            {row.name}
          </span>
        ),
      },
      {
        key: 'exchangeRate',
        label: 'Exchange Rate',
        align: 'right' as const,
        render: (row: Currency) =>
          row.isCompanyCurrency ? (
            <span
              style={{
                display: 'inline-block',
                padding: '3px 12px',
                border: '1.5px solid #1a7a5e',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#1a7a5e',
                fontFamily: baseFont,
                whiteSpace: 'nowrap',
              }}
            >
              Company Currency
            </span>
          ) : (
            <span style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 300, color: '#141414' }}>
              {row.exchangeRate}
            </span>
          ),
      },
      {
        key: 'format',
        label: 'Format',
        render: (row: Currency) => (
          <span style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 300, color: '#141414' }}>
            {row.format}
          </span>
        ),
      },
      {
        key: 'lastUpdated',
        label: 'Last Updated',
        render: (row: Currency) => (
          <div>
            <div style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 300, color: '#141414' }}>
              {row.lastUpdatedDate}
            </div>
            <div style={{ fontFamily: baseFont, fontSize: '13px', fontWeight: 300, color: '#555' }}>
              {row.lastUpdatedSource}
            </div>
            {row.updatedBy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span style={{ fontFamily: baseFont, fontSize: '12px', fontWeight: 300, color: '#888' }}>by</span>
                <span
                  style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0d6efd 0%, #198754 100%)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}
                >
                  RH
                </span>
                <span style={{ fontFamily: baseFont, fontSize: '13px', fontWeight: 400, color: '#141414' }}>
                  {row.updatedBy}
                </span>
              </div>
            )}
          </div>
        ),
      },
    ]
  
    return (
      <div>
        {/* Intro */}
        <p style={{ fontFamily: baseFont, fontSize: '14px', color: '#555', fontWeight: 300, marginBottom: '8px' }}>
          These defaults will be used for deals and properties.
        </p>
  
        <Divider />
  
        {/* ── Auto exchange rate update card ── */}
        <div
          style={{
            border: '1px solid #e0e0e0',
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
              <span style={{ fontFamily: baseFont, fontSize: '14px', fontWeight: 600, color: '#141414' }}>
                Schedule automatic exchange rate updates.
              </span>
              <a
                href="#"
                style={{ display: 'inline-flex', alignItems: 'center', fontFamily: baseFont, fontSize: '14px', fontWeight: 500, color: '#0091ae', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                Learn more <ExternalLinkIcon />
              </a>
            </div>
            <div style={{ fontFamily: baseFont, fontSize: '13px', fontWeight: 300, color: '#555', marginBottom: '14px' }}>
              <strong style={{ fontWeight: 600, color: '#141414' }}>Frequency:</strong> Monthly &nbsp;|&nbsp;{' '}
              <strong style={{ fontWeight: 600, color: '#141414' }}>Update status:</strong> Completed on 03/03/2026 + Next update on 03/04/2026
            </div>
            <button
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontFamily: baseFont,
                fontWeight: 300,
                color: '#141414',
                background: '#fff',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#141414')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
            >
              View history
            </button>
          </div>
  
          {/* Toggle + edit buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Toggle button */}
            <button
              onClick={() => setAutoUpdateEnabled(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '7px 14px',
                fontSize: '13px',
                fontFamily: baseFont,
                fontWeight: 500,
                color: '#fff',
                background: autoUpdateEnabled ? '#141414' : '#a0a0a0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {autoUpdateEnabled && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {autoUpdateEnabled ? 'On' : 'Off'}
            </button>
            {/* Edit button */}
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                background: '#fff',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#141414')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
              title="Edit schedule"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
  
        {/* ── All Currencies header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: baseFont, fontSize: '22px', fontWeight: 700, color: '#141414', margin: 0 }}>
            All Currencies
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              style={{
                padding: '9px 20px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: baseFont,
                color: '#141414',
                background: '#fff',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#141414')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
            >
              Exchange rate log
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '9px 20px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: baseFont,
                color: '#fff',
                background: '#141414',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#333')}
              onMouseLeave={e => (e.currentTarget.style.background = '#141414')}
            >
              Add Currency
            </button>
          </div>
        </div>
  
        {/* ── Info banner ── */}
        <div
          style={{
            background: '#eaf4fb',
            border: '1px solid #b8dcf0',
            borderRadius: '4px',
            padding: '14px 18px',
            marginBottom: '0px',
            fontFamily: baseFont,
            fontSize: '14px',
            fontWeight: 300,
            color: '#141414',
            lineHeight: '1.6',
          }}
        >
          Open records (including deals) use these exchange rates. Closed records use the exchange rate at the time of closing.{' '}
          <a
            href="#"
            style={{ color: '#0091ae', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Learn more <ExternalLinkIcon />
          </a>
        </div>
  
        {/* ── Currencies table ── */}
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
  
        {/* ── Add Currency Modal ── */}
        {showAddModal && (
          <AddCurrencyModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddCurrency}
            existingIds={currencies.map(c => c.id)}
          />
        )}
      </div>
    )
  }
  export default CurrencyTabContent  