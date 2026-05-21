import { resolveChatAssistantTenantId } from "@components/chat-assistant/resolveChatAssistantIdentity";
import { chatKeys } from "@query/keys";
import { getClientBearerAuthorization } from "@utils/axios";
import {
  deleteChatConversation,
  getChatConversations,
  mapChatConversationsToListItems,
} from "@utils/chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

function resolveDeleteTenantId(
  listTenantId: string,
  sessionUser: unknown,
): string {
  return listTenantId.trim() || resolveChatAssistantTenantId(sessionUser);
}

export function useChatAssistantConversations(enabled: boolean) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const hasAuth =
    status === "authenticated" || Boolean(getClientBearerAuthorization());
  const canFetch = enabled && hasAuth;

  const query = useQuery({
    queryKey: chatKeys.assistant.conversations(),
    queryFn: getChatConversations,
    enabled: canFetch,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    select: (data) => ({
      conversations: mapChatConversationsToListItems(data.conversations),
      tenantId: data.tenant_id?.trim() ?? "",
    }),
  });

  const invalidateConversations = useCallback(() => {
    if (!canFetch) return;
    queryClient
      .invalidateQueries({ queryKey: chatKeys.assistant.conversations() })
      .catch(() => undefined);
  }, [canFetch, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const tenantId = resolveDeleteTenantId(
        query.data?.tenantId ?? "",
        session?.user,
      );
      if (!tenantId) {
        throw new Error("Tenant id is required to delete a conversation.");
      }
      await deleteChatConversation(tenantId, threadId);
    },
    onSuccess: () => {
      invalidateConversations();
    },
  });

  return {
    conversations: query.data?.conversations ?? [],
    conversationsTenantId: query.data?.tenantId ?? "",
    isLoading: canFetch && query.isPending && query.data === undefined,
    isError: query.isError,
    invalidateConversations,
    deleteConversation: deleteMutation.mutateAsync,
    isDeletingConversation: deleteMutation.isPending,
    deletingThreadId: deleteMutation.isPending
      ? deleteMutation.variables
      : undefined,
  };
}
