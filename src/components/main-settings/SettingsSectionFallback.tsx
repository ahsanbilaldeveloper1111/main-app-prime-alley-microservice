import { MAIN_SETTINGS_FONT_SIZE } from './mainSettingsTokens'
import React from 'react'

export const SettingsSectionFallback: React.FC = () => (
  <div
    style={{
      padding: '32px 40px',
      color: '#6b7280',
      fontSize: MAIN_SETTINGS_FONT_SIZE.base,
      fontFamily: 'Lexend Deca, Helvetica, Arial, sans-serif',
    }}
  >
    Loading…
  </div>
)
