import type { CSSProperties } from 'react'
import {
  getMainSettingsTabButtonStyle,
  MAIN_SETTINGS_FONT,
  mainSettingsPageTitleStyle,
  mainSettingsTabBarStyle,
  mainSettingsTabRowStyle,
} from '../mainSettingsTokens'

export const settingsSectionShellStyle: CSSProperties = {
  padding: 'clamp(16px, 3vw, 20px) clamp(12px, 4vw, 24px)',
  flex: 1,
}

export const settingsSectionTitleStyle: CSSProperties = {
  ...mainSettingsPageTitleStyle,
  fontFamily: MAIN_SETTINGS_FONT,
}

export const settingsSectionTabBarStyle: CSSProperties = {
  ...mainSettingsTabBarStyle,
}

export const settingsSectionTabRowStyle: CSSProperties = {
  ...mainSettingsTabRowStyle,
}

export function settingsSectionTabButtonStyle(
  isActive: boolean,
  isFirst: boolean,
  isLast: boolean,
): CSSProperties {
  return getMainSettingsTabButtonStyle({
    isActive,
    isFirst,
    isLast,
    fontFamily: MAIN_SETTINGS_FONT,
  })
}

export const settingsSectionNoPermissionStyle: CSSProperties = {
  color: '#6c757d',
}
