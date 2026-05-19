import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from "@utils/Helper";
import { crmAppKeys } from "../query/keys";
import type { CrmExtensionLookup } from "@crm/shared/crmListExtensionDisplayName";

/** Hierarchy extensions for CRM data management (prospects list Owner column). */
export function useCrmDataManagementExtensions() {
  const { status } = useSession();

  return useQuery({
    queryKey: crmAppKeys.hierarchyExtensions.module(ModuleSlug.CRM_DATA_MANAGEMENT),
    queryFn: async (): Promise<CrmExtensionLookup[]> => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_DATA_MANAGEMENT);
      return hierarchyData?.extensions ?? [];
    },
    enabled: status === "authenticated",
  });
}
