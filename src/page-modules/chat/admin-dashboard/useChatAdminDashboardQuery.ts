import { chatKeys } from "@query/keys";
import { getAdminChatDashboard } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { mapAdminDashboardApi } from "./mapAdminDashboardApi";

export function useChatAdminDashboardQuery() {
  const { status: sessionStatus } = useSession();

  const query = useQuery({
    queryKey: chatKeys.adminDashboard.detail(),
    queryFn: () => getAdminChatDashboard(),
    enabled: sessionStatus === "authenticated",
    staleTime: 60_000,
    select: mapAdminDashboardApi,
  });

  return {
    ...query,
    model: query.data ?? null,
  };
}
