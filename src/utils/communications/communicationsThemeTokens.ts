/** Communications UI tokens — aligned with Main Settings / CRM Prospects. */
export {
  MAIN_SETTINGS_COLOR as COMMUNICATIONS_COLOR,
  MAIN_SETTINGS_FONT as COMMUNICATIONS_FONT,
  MAIN_SETTINGS_FONT_SIZE as COMMUNICATIONS_FONT_SIZE,
  MAIN_SETTINGS_FONT_WEIGHT as COMMUNICATIONS_FONT_WEIGHT,
} from "@components/main-settings/mainSettingsTokens";

/** Primary stat card accent (matches Prospects list pages). */
export const COMMUNICATIONS_STAT_PRIMARY = {
  iconColor: "#0066CC",
  iconBgColor: "#EEF2FF",
} as const;

/** Selected / active list item background (replaces legacy purple #ede9fe). */
export const COMMUNICATIONS_SELECTED_BG = "#EEF2FF";

/** Stat card palette aligned with CRM Prospects metrics. */
export const COMMUNICATIONS_STAT_COLORS = {
  primary: COMMUNICATIONS_STAT_PRIMARY,
  inbound: {
    iconColor: "#10B981",
    iconBgColor: "#D1FAE5",
  },
  outbound: {
    iconColor: "#0EA5E9",
    iconBgColor: "#E0F2FE",
  },
  warning: {
    iconColor: "#F59E0B",
    iconBgColor: "#FEF3C7",
  },
  danger: {
    iconColor: "#EF4444",
    iconBgColor: "#FEE2E2",
  },
} as const;
