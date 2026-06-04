import type { CSSProperties } from 'react'

/** Shared border radii for Main Settings UI. */
export const MAIN_SETTINGS_RADIUS = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  pill: '9999px',
  full: '50%',
} as const

/** Matches CRM / Prospects (Lexend Deca + Bootstrap-scale type). */
export const MAIN_SETTINGS_FONT = 'Lexend Deca, Helvetica, Arial, sans-serif'

/**
 * Font sizes aligned with Prospects / Bootstrap ($font-size-base: 0.875rem).
 * Values resolve from CSS vars on `.main-settings-root`.
 */
export const MAIN_SETTINGS_FONT_SIZE = {
  xs: 'var(--ms-font-xs, 0.75rem)',
  sm: 'var(--ms-font-sm, 0.8125rem)',
  base: 'var(--ms-font-base, 0.875rem)',
  md: 'var(--ms-font-md, 1rem)',
  lg: 'var(--ms-font-lg, 1.25rem)',
  xl: 'var(--ms-font-xl, 1.5rem)',
  input: 'var(--ms-font-input, 0.875rem)',
  /** Toolbar / table row action icons in Main Settings (`--ms-action-icon-size`). */
  actionIcon: 'var(--ms-action-icon-size, 1rem)',
  icon: 'var(--ms-font-icon, 1.375rem)',
  display: 'var(--ms-font-display, 2.5rem)',
} as const

/** Font weights aligned with CRM list / form patterns. */
export const MAIN_SETTINGS_FONT_WEIGHT = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

/** Theme colors aligned with global `.btn-primary` (Prospects / Bootstrap). */
export const MAIN_SETTINGS_COLOR = {
  primary: '#0066CC',
  primaryHover: '#0052A3',
  primaryFocusRing: 'rgba(0, 102, 204, 0.25)',
  /** Bootstrap-style control focus (matches CRM react-select). */
  inputFocusBorder: '#86b7fe',
  inputFocusShadow: '0 0 0 0.2rem rgba(13, 110, 253, 0.25)',
  text: '#141414',
  textMuted: '#6c757d',
  /** @deprecated Use textMuted — kept for gradual migration */
  textSecondary: '#6c757d',
  white: '#ffffff',
  border: '#dee2e6',
  /** Segmented tab bar — matches Planner Tasks (`ptl-tab-btn`). */
  tabBorder: '#8A8A8A',
  tabInactiveBg: '#ffffff',
  tabInactiveText: '#141414',
  tabActiveBg: '#f5f8fa',
  tabActiveText: '#0066CC',
} as const

/** Section heading (h2) inside a settings panel. */
export const mainSettingsSectionTitleStyle: CSSProperties = {
  fontFamily: MAIN_SETTINGS_FONT,
  fontSize: MAIN_SETTINGS_FONT_SIZE.lg,
  fontWeight: MAIN_SETTINGS_FONT_WEIGHT.semibold,
  color: MAIN_SETTINGS_COLOR.text,
  lineHeight: 1.25,
  margin: 0,
}

/** Muted helper / description copy. */
export const mainSettingsMutedTextStyle: CSSProperties = {
  fontFamily: MAIN_SETTINGS_FONT,
  fontSize: MAIN_SETTINGS_FONT_SIZE.base,
  fontWeight: MAIN_SETTINGS_FONT_WEIGHT.normal,
  color: MAIN_SETTINGS_COLOR.textMuted,
  lineHeight: 1.5,
}

/** Outline secondary button (Prospects `btn-outline-primary` pattern). */
export const mainSettingsOutlineButtonStyle: CSSProperties = {
  fontFamily: MAIN_SETTINGS_FONT,
  fontSize: MAIN_SETTINGS_FONT_SIZE.base,
  fontWeight: MAIN_SETTINGS_FONT_WEIGHT.normal,
  color: MAIN_SETTINGS_COLOR.primary,
  background: MAIN_SETTINGS_COLOR.white,
  border: `1px solid ${MAIN_SETTINGS_COLOR.primary}`,
  borderRadius: MAIN_SETTINGS_RADIUS.md,
  cursor: 'pointer',
  padding: '9px 22px',
}

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
  fontWeight: MAIN_SETTINGS_FONT_WEIGHT.semibold,
  color: MAIN_SETTINGS_COLOR.text,
  marginBottom: '16px',
  letterSpacing: 0,
  lineHeight: 1.25,
}

/** Primary action button (same as Prospects `variant="primary"`). */
export const mainSettingsPrimaryButtonStyle: CSSProperties = {
  fontFamily: MAIN_SETTINGS_FONT,
  fontSize: MAIN_SETTINGS_FONT_SIZE.base,
  fontWeight: MAIN_SETTINGS_FONT_WEIGHT.normal,
  color: '#ffffff',
  background: MAIN_SETTINGS_COLOR.primary,
  border: `1px solid ${MAIN_SETTINGS_COLOR.primary}`,
  borderRadius: MAIN_SETTINGS_RADIUS.md,
  cursor: 'pointer',
  padding: '9px 22px',
}

/** Text links inside Main Settings forms. */
export const mainSettingsLinkStyle: CSSProperties = {
  color: MAIN_SETTINGS_COLOR.primary,
  textDecoration: 'none',
}

const MAIN_SETTINGS_TAB_BORDER = `1px solid ${MAIN_SETTINGS_COLOR.tabBorder}`

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
  fontSize = MAIN_SETTINGS_FONT_SIZE.sm,
  padding = '10px 20px',
  fontWeight,
}: MainSettingsTabButtonStyleOptions): CSSProperties {
  return {
    padding,
    background: isActive ? MAIN_SETTINGS_COLOR.tabActiveBg : MAIN_SETTINGS_COLOR.tabInactiveBg,
    borderTop: MAIN_SETTINGS_TAB_BORDER,
    borderLeft: isFirst ? MAIN_SETTINGS_TAB_BORDER : 'none',
    borderRight: MAIN_SETTINGS_TAB_BORDER,
    borderBottom: isActive
      ? `2px solid ${MAIN_SETTINGS_COLOR.primary}`
      : `1px solid ${MAIN_SETTINGS_COLOR.tabBorder}`,
    marginBottom: isActive ? '-1px' : 0,
    cursor: 'pointer',
    fontFamily,
    fontSize,
    fontWeight:
      fontWeight ??
      (isActive ? MAIN_SETTINGS_FONT_WEIGHT.semibold : MAIN_SETTINGS_FONT_WEIGHT.normal),
    color: isActive ? MAIN_SETTINGS_COLOR.tabActiveText : MAIN_SETTINGS_COLOR.tabInactiveText,
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
    position: 'relative',
    zIndex: isActive ? 1 : 0,
    outline: 'none',
    boxSizing: 'border-box',
    flex: '0 0 auto',
  }
}
