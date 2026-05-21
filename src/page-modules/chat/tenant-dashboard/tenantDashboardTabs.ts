export type TenantDashboardTab = "overview" | "users";

export const TENANT_DASHBOARD_TABS: ReadonlyArray<{
  id: TenantDashboardTab;
  label: string;
}> = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users budgets & usage" },
];
