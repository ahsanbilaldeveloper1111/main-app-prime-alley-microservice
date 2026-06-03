/**
 * Shared CRM accent tokens (`crm-wcag-accents.scss`).
 *
 * Prospects list uses two patterns (see `crmProspectsContactsListPageTableColumns.tsx`):
 * 1. Identity accents — `getRandomColor(name)` hashes the label into `CRM_AVATAR_PALETTE`.
 * 2. Semantic accents — map status/type to a variant or CSS modifier; colors live in CSS
 *    (e.g. `gt-campaign-status--active`, `getCrmPersonDispositionBadgeVariant`).
 *
 * Smart CRM stages/charts use pattern 2 for type-based fills; avatars use pattern 1 via
 * `crmNameAvatar.getRandomColor`.
 */
export const CRM_THEME = {  primary: "#2967ee",
  teal: "#006d82",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  neutral: "#64748b",
  muted: "#9ca3af",
} as const;

/**
 * Stage type fills for charts/forms (hex mirrors `stages-table-name-dot--*` in SCSS).
 */
export const STAGE_TYPE_THEME_COLORS = {
  lead: CRM_THEME.primary,
  deal: "#b45309",
  order: "#15803d",
  lost_reason: "#b91c1c",
} as const;

/** Activity history pipeline step colors (prospect → order). */
export const CRM_ACTIVITY_PIPELINE_COLORS = {
  prospect: CRM_THEME.teal,
  lead: CRM_THEME.primary,
  deal: CRM_THEME.warning,
  order: CRM_THEME.success,
} as const;

/** Stable avatar / badge accent palette derived from CRM theme (not random hues). */
export const CRM_AVATAR_PALETTE = [
  CRM_THEME.primary,
  CRM_THEME.teal,
  "#0e7490",
  "#1d4ed8",
  "#065f46",
  "#0369a1",
  CRM_THEME.warning,
  "#4f46e5",
] as const;

export function resolveStageThemeColor(type: string): string {
  return (
    STAGE_TYPE_THEME_COLORS[
      type as keyof typeof STAGE_TYPE_THEME_COLORS
    ] ?? CRM_THEME.neutral
  );
}
