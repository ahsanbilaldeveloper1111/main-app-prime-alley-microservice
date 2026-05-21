export type AdminDashboardTab = "overview" | "users" | "pricing-history";

export const ADMIN_DASHBOARD_TABS: ReadonlyArray<{
  id: AdminDashboardTab;
  label: string;
}> = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users budgets & usage" },
  { id: "pricing-history", label: "Pricing History" },
];
