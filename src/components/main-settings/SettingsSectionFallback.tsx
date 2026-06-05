import { MAIN_SETTINGS_FONT, MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React from 'react'

export const SettingsSectionFallback: React.FC = () => (
  <div
    style={{
      padding: '32px 40px',
      color: '#6c757d',
      fontSize: MAIN_SETTINGS_FONT_SIZE.base,
      fontFamily: MAIN_SETTINGS_FONT,
    }}
  >
    Loading…
  </div>
)
