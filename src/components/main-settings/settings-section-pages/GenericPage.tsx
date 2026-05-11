import React from 'react'
import { Divider } from '../accountDefaultsTabPrimitives'
import { SETTINGS_SECTION_FONT, settingsSectionShellStyle, settingsSectionTitleStyle } from './settingsSectionPageStyles'

export const GenericPage: React.FC<Readonly<{ title: string }>> = ({ title }) => (
  <div style={settingsSectionShellStyle}>
    <h1 style={settingsSectionTitleStyle}>{title}</h1>
    <Divider />
    <div
      style={{
        background: '#f8f8f8',
        border: '1px dashed #ccc',
        borderRadius: '6px',
        padding: '64px 32px',
        textAlign: 'center',
        color: '#999',
        fontFamily: SETTINGS_SECTION_FONT,
        fontSize: '14px',
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗂️</div>
      <div style={{ fontWeight: 500, color: '#555', marginBottom: '6px' }}>{title}</div>
      <div>Content for this section goes here.</div>
    </div>
  </div>
)
