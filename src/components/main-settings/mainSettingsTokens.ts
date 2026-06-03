import type { CSSProperties } from 'react'

/** Shared border radii for Main Settings UI. */
export const MAIN_SETTINGS_RADIUS = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  pill: '9999px',
  full: '50%',
} as const

export const MAIN_SETTINGS_FONT = 'Lexend Deca, Helvetica, Arial, sans-serif'

/** Responsive font sizes for Main Settings UI (driven by CSS vars on `.main-settings-root`). */
export const MAIN_SETTINGS_FONT_SIZE = {
  xs: 'var(--ms-font-xs, clamp(0.625rem, 1.8vw, 0.6875rem))',
  sm: 'var(--ms-font-sm, clamp(0.75rem, 2vw, 0.8125rem))',
  base: 'var(--ms-font-base, clamp(0.8125rem, 2.2vw, 0.875rem))',
  md: 'var(--ms-font-md, clamp(0.875rem, 2.4vw, 1rem))',
  lg: 'var(--ms-font-lg, clamp(1rem, 2.6vw, 1.25rem))',
  xl: 'var(--ms-font-xl, clamp(1.125rem, 2.8vw, 1.5rem))',
  input: 'var(--ms-font-input, clamp(0.875rem, 2.4vw, 1rem))',
  icon: 'var(--ms-font-icon, clamp(1.125rem, 3vw, 1.375rem))',
  display: 'var(--ms-font-display, clamp(1.75rem, 5vw, 2.5rem))',
} as const

/** Shared border colors for Main Settings UI. */
export const MAIN_SETTINGS_BORDER = {
  /** Panel dividers, tab rails */
  subtle: '#d0d0d0',
  /** Inputs, controls */
  default: '#b8b8b8',
  /** Tab outlines, card edges */
  strong: '#c4c4c4',
  /** Active sidebar indicator */
  accent: '#0a0a0a',
} as const

/** Top-level section heading (General, Tickets, Account Defaults, etc.). */
export const mainSettingsPageTitleStyle: CSSProperties = {
  fontFamily: MAIN_SETTINGS_FONT,
  fontSize: MAIN_SETTINGS_FONT_SIZE.xl,
  fontWeight: 400,
  color: '#141414',
  marginBottom: '16px',
  letterSpacing: 0,
}

const MAIN_SETTINGS_TAB_BORDER = `1px solid ${MAIN_SETTINGS_BORDER.strong}`

export type MainSettingsTabButtonStyleOptions = Readonly<{
  isActive: boolean
  isFirst: boolean
  isLast: boolean
  fontFamily: string
  fontSize?: string
  padding?: string
  fontWeight?: number
}>

/** Full-width tab bar with horizontal overflow controls when tabs do not fit. */
export const mainSettingsTabBarStyle: CSSProperties = {
  display: 'flex',
  width: '100%',
  alignItems: 'flex-end',
  borderBottom: MAIN_SETTINGS_TAB_BORDER,
  marginBottom: '20px',
  overflow: 'hidden',
}

export const mainSettingsTabRowStyle: CSSProperties = {
  display: 'flex',
  flex: '0 0 auto',
  flexWrap: 'nowrap',
}

/** Segmented tab button; sits on a full-width bottom divider line. */
export function getMainSettingsTabButtonStyle({
  isActive,
  isFirst,
  isLast,
  fontFamily,
  fontSize = MAIN_SETTINGS_FONT_SIZE.base,
  padding = '10px 20px',
  fontWeight = 300,
}: MainSettingsTabButtonStyleOptions): CSSProperties {
  return {
    padding,
    background: isActive ? '#ffffff' : 'whitesmoke',
    borderTop: MAIN_SETTINGS_TAB_BORDER,
    borderLeft: isFirst ? MAIN_SETTINGS_TAB_BORDER : 'none',
    borderRight: isLast ? MAIN_SETTINGS_TAB_BORDER : 'none',
    borderBottom: isActive ? '1px solid #ffffff' : 'none',
    marginBottom: isActive ? '-1px' : 0,
    cursor: 'pointer',
    fontFamily,
    fontSize,
    fontWeight,
    color: '#141414',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
    position: 'relative',
    zIndex: isActive ? 1 : 0,
    outline: 'none',
    boxSizing: 'border-box',
    flex: '0 0 auto',
  }
}