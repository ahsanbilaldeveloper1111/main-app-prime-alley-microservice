import { chatKeys } from "@query/keys";
import { getTenantChatUsers } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { mapTenantUsersApi } from "./mapTenantUsersApi";

export function useChatTenantUsersQuery(tenantId: string, enabled: boolean) {
  const { status: sessionStatus } = useSession();
  const id = tenantId.trim();

  const query = useQuery({
    queryKey: chatKeys.tenantUsers.detail(id),
    queryFn: async () => {
      const data = await getTenantChatUsers(id || undefined);
      return {
        tenantId: data.tenant_id,
        count: data.count,
        rows: mapTenantUsersApi(data),
      };
    },
    enabled: enabled && sessionStatus === "authenticated",
    staleTime: 60_000,
  });

  return {
    ...query,
    rows: query.data?.rows ?? [],
    count: query.data?.count ?? 0,
    apiTenantId: query.data?.tenantId ?? "",
  };
}
