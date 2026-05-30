import { resolveChatTenantIdFromSession } from "@components/main-settings/ai-chatbot-settings/resolveChatTenantId";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { useAnalysisTenantQuery } from "./useAnalysisTenantQuery";

export function useAnalysisTenantListPage() {
  const { data: session, status: sessionStatus } = useSession();
  const sessionTenantId = useMemo(
    () => resolveChatTenantIdFromSession(session?.user),
    [session?.user],
  );

  const tenantQuery = useAnalysisTenantQuery(sessionTenantId);

  const rows = useMemo(
    () => (tenantQuery.data ? [tenantQuery.data] : []),
    [tenantQuery.data],
  );

  const isLoading =
    sessionStatus === "authenticated" &&
    Boolean(sessionTenantId) &&
    (tenantQuery.isPending || tenantQuery.isFetching);

  const isError = Boolean(sessionTenantId) && tenantQuery.isError;

  return {
    rows,
    isLoading,
    isError,
    sessionTenantId,
    refetch: tenantQuery.refetch,
  };
}
