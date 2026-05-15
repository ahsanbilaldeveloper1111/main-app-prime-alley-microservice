import { chatKeys } from "@query/keys";
import { getTenantChatDashboard } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { resolveTenantIdFromSession } from "../shared/resolveTenantIdFromSession";

import { mapTenantDashboardApi } from "./mapTenantDashboardApi";

export function useChatTenantDashboardQuery() {
  const { data: session, status: sessionStatus } = useSession();
  const tenantId = useMemo(
    () => resolveTenantIdFromSession(session?.user),
    [session?.user],
  );

  const query = useQuery({
    queryKey: chatKeys.tenantDashboard.detail(tenantId),
    queryFn: () => getTenantChatDashboard(tenantId || undefined),
    enabled: sessionStatus === "authenticated",
    staleTime: 60_000,
    select: mapTenantDashboardApi,
  });

  return {
    ...query,
    tenantId,
    model: query.data ?? null,
  };
}
