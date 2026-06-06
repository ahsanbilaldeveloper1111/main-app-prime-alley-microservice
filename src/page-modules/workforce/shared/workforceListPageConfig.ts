import type { CrmListPageScopedLayoutStylesConfig } from "@crm/shared/CrmListPageScopedLayoutStyles";

/** Reuse prospects list layout class names so `custom.scss` page chrome applies. */
export const WORKFORCE_LIST_SCOPED_LAYOUT: CrmListPageScopedLayoutStylesConfig = {
  tableWrapperClass: "prospects-table-wrapper",
  scrollableContentClass: "prospects-scrollable-content",
  pageContainerClass: "prospects-page-container",
  contentAreaClass: "prospects-content-area",
  includePhoneInputStyles: false,
};

export const WORKFORCE_THEME = {
  fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
  primary: "#0066CC",
  primaryHover: "#0052A3",
  text: "#141414",
  textMuted: "#6c757d",
  selectedBg: "#EEF2FF",
} as const;
