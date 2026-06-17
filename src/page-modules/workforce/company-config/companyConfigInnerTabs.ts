export const COMPANY_CONFIG_INNER_TABS = [
  { id: "work-hours", label: "Work Hours" },
  { id: "grace-period", label: "Grace Period" },
  { id: "breaks", label: "Breaks" },
  { id: "overtime", label: "Overtime" },
  { id: "break-types", label: "Break Types" },
] as const;

export type CompanyConfigInnerTabId = (typeof COMPANY_CONFIG_INNER_TABS)[number]["id"];

export function isCompanyConfigInnerTabId(value: string): value is CompanyConfigInnerTabId {
  return COMPANY_CONFIG_INNER_TABS.some((tab) => tab.id === value);
}
