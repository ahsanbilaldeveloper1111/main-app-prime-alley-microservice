import { CRM_AVATAR_PALETTE } from "@utils/crmThemeColors";

/** Same 8 colors as CRM Prospects name-column avatars (`getRandomColor`). */
export { CRM_AVATAR_PALETTE as WORKFORCE_AVATAR_PALETTE } from "@utils/crmThemeColors";

/** Department headcount bars / legend dots — cycles through avatar palette. */
export const WORKFORCE_DEPARTMENT_CHART_COLORS = [...CRM_AVATAR_PALETTE] as const;

/** Approvals aging buckets: fresh → warning → aged (palette indices). */
export const WORKFORCE_AGING_CHART_COLORS = [
  CRM_AVATAR_PALETTE[0],
  CRM_AVATAR_PALETTE[6],
  CRM_AVATAR_PALETTE[1],
] as const;

/** One accent per workforce dashboard stat card (left to right). */
export const WORKFORCE_DASHBOARD_STAT_ICON_COLORS = [
  CRM_AVATAR_PALETTE[0],
  CRM_AVATAR_PALETTE[6],
  CRM_AVATAR_PALETTE[2],
  CRM_AVATAR_PALETTE[3],
  CRM_AVATAR_PALETTE[1],
] as const;

/** ~10% opacity tint for stat icon backgrounds. */
export function workforcePaletteSoftBg(hex: string): string {
  return `${hex}1a`;
}
