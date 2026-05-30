import React, { useRef, useState } from 'react'
import { generalSettingsStyles as s } from './generalSettingsPanelStyles'
import { MAIN_SETTINGS_FONT_SIZE, MAIN_SETTINGS_RADIUS } from './mainSettingsTokens'

export type GeneralSettingsProfileTabProps = {
  userName: string
  setUserName: (v: string) => void
  language: string
  setLanguage: (v: string) => void
  dateFormat: string
  setDateFormat: (v: string) => void
  phoneCountry: string
  setPhoneCountry: (v: string) => void
  phoneNumber: string
  setPhoneNumber: (v: string) => void
}

export const GeneralSettingsProfileTab: React.FC<GeneralSettingsProfileTabProps> = ({
  userName,
  setUserName,
  language,
  setLanguage,
  dateFormat,
  setDateFormat,
  phoneCountry,
  setPhoneCountry,
  phoneNumber,
  setPhoneNumber,
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = () => `${userName.charAt(0)}`.toUpperCase()

  return (
    <div>
      <p style={s.notice}>These preferences only apply to you.</p>

      <div style={s.sectionTitle}>Global</div>
      <div style={s.sectionSubtitle}>This applies across any accounts you have.</div>

      <div style={{ marginBottom: '24px' }}>
        <span style={s.label}>Profile Image</span>
        <button
          type="button"
          aria-label="Change profile photo"
          style={{ ...s.profileImageBox, border: s.profileImageBox.border as string, padding: 0 }}
          onClick={() => fileInputRef.current?.click()}
        >
          {profileImage ? (
            <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>{getInitials()}</span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = (ev) => {
                const result = ev.target?.result
                if (typeof result === 'string') setProfileImage(result)
              }
              reader.readAsDataURL(file)
            }
          }}
        />
      </div>

      <div style={s.fieldGroup}>
        <label htmlFor="general-profile-name" style={s.label}>
          Name
        </label>
        <input
          id="general-profile-name"
          style={s.input}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#006162'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#b8b8b8'
          }}
        />
      </div>

      <div style={s.fieldGroup}>
        <label htmlFor="general-language" style={s.label}>
          Language <span style={s.helpIcon} title="Applies globally across all accounts">?</span>
        </label>
        <select id="general-language" style={s.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>English</option>
          <option>French</option>
          <option>Spanish</option>
          <option>German</option>
          <option>Arabic</option>
          <option>Urdu</option>
        </select>
      </div>

      <div style={s.fieldGroup}>
        <label htmlFor="general-date-format" style={s.label}>
          Date, time, and number format{' '}
          <span style={s.helpIcon} title="Sets date/time/number format based on locale">?</span>
        </label>
        <div style={{ fontSize: MAIN_SETTINGS_FONT_SIZE.sm, color: '#555', fontWeight: 300, marginBottom: '8px' }}>
          Format: 2 March 2026, 02/03/2026, 19:41 GMT, and 1,234.56
        </div>
        <select
          id="general-date-format"
          style={s.select}
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value)}
        >
          <option>United Kingdom</option>
          <option>United States</option>
          <option>European Union</option>
          <option>Pakistan</option>
          <option>Australia</option>
        </select>
      </div>

      <div style={s.fieldGroup}>
        <label htmlFor="general-phone-number" style={s.label}>
          Phone number
        </label>
        <div style={s.helpText}>
          We may use this phone number to contact you about security events. Please refer to our privacy policy for{' '}
          <button
            type="button"
            onClick={() => null}
            style={{ ...s.link, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            more information ↗
          </button>
        </div>
        <div style={{ display: 'flex', gap: 0, marginTop: '10px' }}>
          <select
            aria-label="Phone country"
            value={phoneCountry}
            onChange={(e) => setPhoneCountry(e.target.value)}
            style={{
              padding: '8px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              border: '1px solid #b8b8b8',
              borderRight: 'none',
              borderTopLeftRadius: MAIN_SETTINGS_RADIUS.md,
              borderBottomLeftRadius: MAIN_SETTINGS_RADIUS.md,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              background: '#fff',
              fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#006162'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#b8b8b8'
            }}
          >
            <option value="GB">🇬🇧</option>
            <option value="US">🇺🇸</option>
            <option value="PK">🇵🇰</option>
            <option value="AU">🇦🇺</option>
          </select>
          <input
            id="general-phone-number"
            style={{
              width: '260px',
              padding: '8px 12px',
              fontSize: MAIN_SETTINGS_FONT_SIZE.base,
              color: '#141414',
              border: '1px solid #b8b8b8',
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: MAIN_SETTINGS_RADIUS.md,
              borderBottomRightRadius: MAIN_SETTINGS_RADIUS.md,
              background: '#fff',
              fontFamily: "'Lexend Deca', Helvetica, Arial, sans-serif",
              outline: 'none',
            }}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#006162'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#b8b8b8'
            }}
          />
        </div>
      </div>

      <div style={s.sectionTitle}>Defaults</div>
      <div style={s.sectionSubtitle}>This only applies to this account.</div>
      <div style={s.fieldGroup}>
        <div style={s.label}>General working hours</div>
        <button
          type="button"
          onClick={() => null}
          style={{
            ...s.link,
            fontSize: MAIN_SETTINGS_FONT_SIZE.base,
            fontWeight: 300,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Edit working hours ↗
        </button>
      </div>
    </div>
  )
}
