import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React from 'react'
import '../../assets/css/Settings.css'
import { Divider, InputField, SelectField, ACCOUNT_DEFAULTS_FONT } from './accountDefaultsTabPrimitives'
import {
  GENERAL_TAB_COUNTRY_OPTIONS,
  GENERAL_TAB_FISCAL_YEAR_OPTIONS,
  GENERAL_TAB_TIMEZONE_OPTIONS,
} from './generalTabConstants'

const GeneralTabContent: React.FC = () => (
  <div className="settings-general-tab-content-wrapper">
    <p
      style={{
        fontFamily: ACCOUNT_DEFAULTS_FONT,
        fontSize: MAIN_SETTINGS_FONT_SIZE.base,
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
      options={[...GENERAL_TAB_TIMEZONE_OPTIONS]}
      helpIcon
    />
    <SelectField
      label="Fiscal year"
      value="January - December"
      options={[...GENERAL_TAB_FISCAL_YEAR_OPTIONS]}
      helpIcon
    />

    <Divider />

    <h2
      style={{
        fontFamily: ACCOUNT_DEFAULTS_FONT,
        fontSize: MAIN_SETTINGS_FONT_SIZE.lg,
        fontWeight: 600,
        color: '#141414',
        marginBottom: '8px',
      }}
    >
      Company Information
    </h2>
    <p
      style={{
        fontFamily: ACCOUNT_DEFAULTS_FONT,
        fontSize: MAIN_SETTINGS_FONT_SIZE.base,
        color: '#555',
        marginBottom: '24px',
      }}
    >
      This information will be used as a default where needed. If you&apos;re looking to update your company information for
      billing, visit{' '}
      <a href="/main-settings/billing" style={{ color: '#0091ae', textDecoration: 'none' }}>
        Account &amp; Billing
      </a>
      {'.'}
    </p>

    <InputField label="Company name" value="Prime Alley Technology" />
    <InputField label="Company domain" value="primealley.com" />
    <InputField label="Company address" value="office 2208" />
    <InputField label="Company address line 2" value="" />

    <SelectField label="Country" value="United Arab Emirates" options={[...GENERAL_TAB_COUNTRY_OPTIONS]} />
    <InputField label="City" value="Dubai" />
    <InputField label="State / Region" value="" />
    <InputField label="Postal code / ZIP" value="" />
    <InputField label="Phone" value="" helpIcon />
  </div>
)

export default GeneralTabContent
