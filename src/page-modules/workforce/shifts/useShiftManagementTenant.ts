import { usePermissions } from "@utils/permissionUtils";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useShiftTenantOptions } from "@page-modules/workforce/shifts/useShiftTenantOptions";

export function useShiftManagementTenant() {
  const { data: session } = useSession();
  const companyIdentifier =
    (session?.user?.company_identifier as string | undefined)?.trim() || "";
  const { isAdmin } = usePermissions();
  const isWorkforceAdmin = isAdmin();
  const {
    tenantOptions,
    defaultTenantId,
    isLoading: tenantOptionsLoading,
    isTenantListReady,
  } = useShiftTenantOptions(isWorkforceAdmin);

  const [manualTenantId, setManualTenantId] = useState("");

  const resolvedTenantId = useMemo(() => {
    if (!isWorkforceAdmin) {
      return companyIdentifier;
    }
    if (!isTenantListReady) {
      return "";
    }
    const fallbackTenantId = defaultTenantId.trim();
    if (!fallbackTenantId) {
      return "";
    }
    return manualTenantId.trim() || fallbackTenantId;
  }, [
    companyIdentifier,
    defaultTenantId,
    isTenantListReady,
    isWorkforceAdmin,
    manualTenantId,
  ]);

  return {
    companyIdentifier,
    isWorkforceAdmin,
    tenantOptions,
    tenantOptionsLoading,
    isTenantListReady,
    resolvedTenantId,
    setManualTenantId,
  };
}
