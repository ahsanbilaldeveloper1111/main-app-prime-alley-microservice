import type { CSSProperties } from 'react'
import {
  getMainSettingsTabButtonStyle,
  mainSettingsPageTitleStyle,
  mainSettingsTabBarStyle,
  mainSettingsTabRowStyle,
} from './mainSettingsTokens'

export const ACCOUNT_DEFAULTS_PAGE_FONT = 'Lexend Deca, Helvetica, Arial, sans-serif'

export const accountDefaultsPageShellStyle: CSSProperties = {
  padding: 'clamp(16px, 3vw, 20px) clamp(12px, 4vw, 24px)',
  flex: 1,
}

export const accountDefaultsPageTitleStyle: CSSProperties = {
  ...mainSettingsPageTitleStyle,
  fontFamily: ACCOUNT_DEFAULTS_PAGE_FONT,
}

export const accountDefaultsTabBarStyle: CSSProperties = {
  ...mainSettingsTabBarStyle,
}

export const accountDefaultsTabRowStyle: CSSProperties = {
  ...mainSettingsTabRowStyle,
}

export function getAccountDefaultsTabButtonStyle(
  isActive: boolean,
  isFirst: boolean,
  isLast: boolean,
): CSSProperties {
  return getMainSettingsTabButtonStyle({
    isActive,
    isFirst,
    isLast,
    fontFamily: ACCOUNT_DEFAULTS_PAGE_FONT,
  })
}
