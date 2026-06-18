import type { ShiftTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

export type AttendanceReportPanelProps = Readonly<{
  resolvedTenantId: string;
  isTenantListReady: boolean;
  isWorkforceAdmin: boolean;
  tenantOptions: readonly ShiftTenantOption[];
  tenantOptionsLoading: boolean;
  onTenantChange: (tenantId: string) => void;
}>;
