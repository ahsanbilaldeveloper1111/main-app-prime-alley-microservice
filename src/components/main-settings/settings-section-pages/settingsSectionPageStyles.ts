import type { CSSProperties } from 'react'

export const SETTINGS_SECTION_FONT = 'Lexend Deca, Helvetica, Arial, sans-serif'

export const settingsSectionShellStyle: CSSProperties = {
  padding: '32px 40px',
  flex: 1,
}

export const settingsSectionTitleStyle: CSSProperties = {
  fontFamily: SETTINGS_SECTION_FONT,
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#141414',
  marginBottom: '24px',
  letterSpacing: 0,
}

export const settingsSectionTabRowStyle: CSSProperties = {
  display: 'flex',
  marginBottom: '32px',
  overflow: 'hidden',
}

export function settingsSectionTabButtonStyle(isActive: boolean, isLast: boolean): CSSProperties {
  return {
    padding: '12px 28px',
    background: isActive ? '#ffffff' : 'whitesmoke',
    border: '1px solid #e0e0e0',
    borderRight: isLast ? '1px solid #e0e0e0' : 'none',
    borderBottom: isActive ? '2px solid #ffffff' : '2px solid #e0e0e0',
    cursor: 'pointer',
    fontFamily: SETTINGS_SECTION_FONT,
    fontSize: '14px',
    fontWeight: 300,
    color: '#141414',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
    position: 'relative',
    top: '1px',
  }
}

export const settingsSectionNoPermissionStyle: CSSProperties = {
  color: '#6b7280',
}
