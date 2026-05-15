import { chatKeys } from "@query/keys";
import { getTenantChatDashboard } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { mapTenantDashboardApi } from "./mapTenantDashboardApi";

function resolveTenantIdFromSession(
  user: Record<string, unknown> | undefined,
): string {
  if (!user) return "";
  const candidates = [
    user.company_identifier,
    user.tenant_id,
    user.tenant,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

export function useChatTenantDashboardQuery() {
  const { data: session, status: sessionStatus } = useSession();
  const tenantId = useMemo(
    () =>
      resolveTenantIdFromSession(
        session?.user as Record<string, unknown> | undefined,
      ),
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
