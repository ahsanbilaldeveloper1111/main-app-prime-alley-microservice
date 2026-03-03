import React from 'react'
import '../../assets/css/Settings.css'

// ─── Tab Content Components ───────────────────────────────────────────────────

const InputField: React.FC<{ label: string; value?: string; helpIcon?: boolean }> = ({
    label,
    value = '',
    helpIcon,
  }) => (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          color: '#141414',
        }}
      >
        {label}
        {helpIcon && (
          <span
            title="Help"
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
            }}
          >
            i
          </span>
        )}
      </div>
      <input
        type="text"
        defaultValue={value}
        style={{
          width: '340px',
          maxWidth: '100%',
          padding: '8px 12px',
          fontSize: '14px',
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          color: '#141414',
          border: '1px solid #d0d0d0',
          borderRadius: '4px',
          outline: 'none',
          background: '#fff',
          boxSizing: 'border-box',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = '#0091ae')}
        onBlur={e => (e.currentTarget.style.borderColor = '#d0d0d0')}
      />
    </div>
  )
  
  const SelectField: React.FC<{ label: string; value?: string; options: string[]; helpIcon?: boolean }> = ({
    label,
    value = '',
    options,
    helpIcon,
  }) => (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          color: '#141414',
        }}
      >
        {label}
        {helpIcon && (
          <span
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
            }}
          >
            i
          </span>
        )}
      </div>
      <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
        <select
          defaultValue={value}
          style={{
            width: '100%',
            padding: '8px 36px 8px 12px',
            fontSize: '14px',
            fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
            color: '#141414',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            outline: 'none',
            background: '#fff',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          {options.map(opt => (
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
const Divider = () => (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid #e8e8e8',
        margin: '28px 0',
      }}
    />
  )
// ─── General Tab ──────────────────────────────────────────────────────────────
const GeneralTabContent: React.FC = () => (
    <div className='settings-general-tab-content-wrapper'>
      <p
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '14px',
          color: '#555',
          marginBottom: '24px',
        }}
      >
        These defaults will be applied to the entire account.
      </p>
      <Divider />
  
      <InputField label="Account name" value="Prime Alley Technology" helpIcon />
      <SelectField
        label="Time zone"
        value="UTC +00:00 London"
        options={['UTC +00:00 London', 'UTC -05:00 New York', 'UTC +01:00 Paris', 'UTC +08:00 Singapore']}
        helpIcon
      />
      <SelectField
        label="Fiscal year"
        value="January - December"
        options={[
          'January - December',
          'April - March',
          'July - June',
          'October - September',
        ]}
        helpIcon
      />
  
      <Divider />
  
      <h2
        style={{
          fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
          fontSize: '20px',
          fontWeight: 600,
          color: '#141414',
          marginBottom: '8px',
        }}
      >
        Company Information
      </h2>
      <p style={{ fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif', fontSize: '14px', color: '#555', marginBottom: '24px' }}>
        This information will be used as a default where needed. If you're looking to update your company information for billing, visit{' '}
        <a href="#" style={{ color: '#0091ae', textDecoration: 'none' }}>
          Account &amp; Billing
        </a>
        .
      </p>
  
      <InputField label="Company name" value="Prime Alley Technology" />
      <InputField label="Company domain" value="primealley.com" />
      <InputField label="Company address" value="office 2208" />
      <InputField label="Company address line 2" value="" />
  
      <SelectField
        label="Country"
        value="United Arab Emirates"
        options={['United Arab Emirates', 'United States', 'United Kingdom', 'Pakistan', 'Germany']}
      />
      <InputField label="City" value="Dubai" />
      <InputField label="State / Region" value="" />
      <InputField label="Postal code / ZIP" value="" />
      <InputField label="Phone" value="" helpIcon />
    </div>
  )
  export default GeneralTabContent