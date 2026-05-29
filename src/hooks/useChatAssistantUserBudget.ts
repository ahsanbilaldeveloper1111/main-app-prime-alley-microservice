import {
  isChatBudgetUnlimited,
  mapChatAssistantBudgetView,
} from "@components/chat-assistant/mapChatAssistantBudgetView";
import {
  resolveChatAssistantTenantId,
  resolveChatAssistantUserId,
} from "@components/chat-assistant/resolveChatAssistantIdentity";
import { chatKeys } from "@query/keys";
import { getClientBearerAuthorization } from "@utils/axios";
import { getChatUserDetail } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export function useChatAssistantUserBudget(
  enabled: boolean,
  tenantIdHint = "",
) {
  const { data: session, status } = useSession();

  const tenantId = useMemo(
    () => tenantIdHint.trim() || resolveChatAssistantTenantId(session?.user),
    [tenantIdHint, session?.user],
  );
  const userId = useMemo(
    () => resolveChatAssistantUserId(session?.user),
    [session?.user],
  );

  const hasAuth =
    status === "authenticated" || Boolean(getClientBearerAuthorization());
  const hasIdentity = Boolean(tenantId && userId);
  const canFetch = enabled && hasAuth && hasIdentity;

  const query = useQuery({
    queryKey: chatKeys.assistant.userBudget(tenantId, userId),
    queryFn: () => getChatUserDetail(tenantId, userId),
    enabled: canFetch,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    select: (data) => ({
      budget: mapChatAssistantBudgetView(data.budget),
      isUnlimited: isChatBudgetUnlimited(data.budget),
    }),
  });

  return {
    budget: query.data?.budget ?? null,
    isUnlimited: query.data?.isUnlimited ?? false,
    isLoading: canFetch && (query.isPending || query.isFetching),
    isError: query.isError,
    hasIdentity,
    canFetch,
    refetch: () => {
      if (!canFetch) return;
      query.refetch().catch(() => undefined);
    },
  };
}
