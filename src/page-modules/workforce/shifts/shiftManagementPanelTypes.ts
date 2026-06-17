import type { ShiftTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

export type ShiftManagementPanelProps = Readonly<{
  resolvedTenantId: string;
  companyIdentifier: string;
  isTenantListReady: boolean;
  isWorkforceAdmin: boolean;
  tenantOptions: readonly ShiftTenantOption[];
  tenantOptionsLoading: boolean;
  onTenantChange: (tenantId: string) => void;
}>;
