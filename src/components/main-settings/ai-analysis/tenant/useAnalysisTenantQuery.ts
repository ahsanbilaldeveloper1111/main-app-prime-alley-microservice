import { aiAnalyticsKeys } from "@query/keys";
import {
  getAnalysisTenant,
  type AnalysisTenantRecord,
} from "@utils/aiAnalytics";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { mapAnalysisTenantToFormValues } from "./mapAnalysisTenant";

export function useAnalysisTenantQuery(appliedTenantId: string) {
  const { status: sessionStatus } = useSession();
  const tenantId = appliedTenantId.trim();

  const query = useQuery<AnalysisTenantRecord | null>({
    queryKey: aiAnalyticsKeys.tenants.detail(tenantId),
    queryFn: () => getAnalysisTenant(tenantId),
    enabled: sessionStatus === "authenticated" && Boolean(tenantId),
    staleTime: 60_000,
  });

  const formValues = useMemo(
    () => mapAnalysisTenantToFormValues(query.data, tenantId),
    [query.data, query.dataUpdatedAt, tenantId],
  );

  return {
    ...query,
    tenantId,
    formValues,
    updatedAt: query.data?.updated_at ?? null,
    hasApiData: query.data != null,
  };
}
