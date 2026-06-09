import type { CrmListPageScopedLayoutStylesConfig } from "@crm/shared/CrmListPageScopedLayoutStyles";
import type { ToolbarConfig, ToolbarTabsDropdownItem } from "@components/GenericTable";

/** Toolbar module dropdown — mirrors sidebar workforce sub-modules (Prospects-style). */
export const WORKFORCE_TABS_DROPDOWN_ITEMS: ToolbarTabsDropdownItem[] = [
  { label: "Dashboard", href: "/workforce/dashboard" },
  { label: "Employees", href: "/workforce/employees" },
  { label: "Attendance", href: "/workforce/attendance" },
  { label: "Journey", href: "/workforce/journey" },
  { label: "Approval Requests", href: "/workforce/approval-requests" },
  { label: "Org Chart", href: "/workforce/org-chart" },
  { label: "Request Categories", href: "/workforce/request-categories" },
];

export const WORKFORCE_TOOLBAR_LABELS = {
  dashboard: "Dashboard",
  employees: "Employees",
  attendance: "Attendance",
  journey: "Journey",
  approvalRequests: "Approval Requests",
  orgChart: "Org Chart",
  requestCategories: "Request Categories",
} as const;

/** Prospects-style module switcher for workforce GenericTable toolbars. */
export function workforceModuleToolbarDropdown(
  tabsDropdownLabel: string,
): Pick<ToolbarConfig, "tabsDropdownLabel" | "tabsDropdownItems"> {
  return {
    tabsDropdownLabel,
    tabsDropdownItems: WORKFORCE_TABS_DROPDOWN_ITEMS,
  };
}

/** Reuse prospects list layout class names so `custom.scss` page chrome applies. */
export const WORKFORCE_LIST_SCOPED_LAYOUT: CrmListPageScopedLayoutStylesConfig = {
  tableWrapperClass: "prospects-table-wrapper",
  scrollableContentClass: "prospects-scrollable-content",
  pageContainerClass: "prospects-page-container",
  contentAreaClass: "prospects-content-area",
  includePhoneInputStyles: false,
};

/** Employees page has dashboard charts below the table — do not lock to viewport height. */
export const EMPLOYEES_LIST_SCOPED_LAYOUT: CrmListPageScopedLayoutStylesConfig = {
  ...WORKFORCE_LIST_SCOPED_LAYOUT,
  autoHeight: true,
};

export const WORKFORCE_THEME = {
  fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
  primary: "#0066CC",
  primaryHover: "#0052A3",
  text: "#141414",
  textMuted: "#6c757d",
  selectedBg: "#EEF2FF",
} as const;
