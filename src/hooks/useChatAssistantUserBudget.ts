import { mapChatAssistantBudgetView } from "@components/chat-assistant/mapChatAssistantBudgetView";
import {
  resolveChatAssistantTenantId,
  resolveChatAssistantUserId,
} from "@components/chat-assistant/resolveChatAssistantIdentity";
import { chatKeys } from "@query/keys";
import { getChatUserDetail } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export function useChatAssistantUserBudget(enabled: boolean) {
  const { data: session, status } = useSession();

  const tenantId = useMemo(
    () => resolveChatAssistantTenantId(session?.user),
    [session?.user],
  );
  const userId = useMemo(
    () => resolveChatAssistantUserId(session?.user),
    [session?.user],
  );

  const canFetch =
    enabled &&
    status === "authenticated" &&
    Boolean(tenantId) &&
    Boolean(userId);

  const query = useQuery({
    queryKey: chatKeys.assistant.userBudget(tenantId, userId),
    queryFn: () => getChatUserDetail(tenantId, userId),
    enabled: canFetch,
    staleTime: 60_000,
    select: (data) => mapChatAssistantBudgetView(data.budget),
  });

  return {
    budget: query.data,
    isLoading: query.isPending || query.isFetching,
    isError: query.isError,
    refetch: () => {
      query.refetch().catch(() => undefined);
    },
    hasIdentity: Boolean(tenantId && userId),
  };
}
