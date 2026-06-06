import { MAIN_SETTINGS_FONT, MAIN_SETTINGS_FONT_SIZE } from '../mainSettingsTokens'
import React from 'react'
import { Divider } from '../accountDefaultsTabPrimitives'
import { settingsSectionShellStyle, settingsSectionTitleStyle } from './settingsSectionPageStyles'

export const GenericPage: React.FC<Readonly<{ title: string }>> = ({ title }) => (
  <div style={settingsSectionShellStyle} className="settings-section-shell">
    <h1 style={settingsSectionTitleStyle} className="settings-section-shell__title">
      {title}
    </h1>
    <Divider />
    <div className="settings-section-shell__content main-settings-section-body">
      <div
        style={{
          background: '#f8f8f8',
          border: '1px dashed #ccc',
          borderRadius: '8px',
          padding: '64px 32px',
          textAlign: 'center',
          color: '#999',
          fontFamily: MAIN_SETTINGS_FONT,
          fontSize: MAIN_SETTINGS_FONT_SIZE.base,
        }}
      >
        <div style={{ fontSize: MAIN_SETTINGS_FONT_SIZE.display, marginBottom: '12px' }}>🗂️</div>
        <div style={{ fontWeight: 500, color: '#6c757d', marginBottom: '6px' }}>{title}</div>
        <div>Content for this section goes here.</div>
      </div>
    </div>
  </div>
)
