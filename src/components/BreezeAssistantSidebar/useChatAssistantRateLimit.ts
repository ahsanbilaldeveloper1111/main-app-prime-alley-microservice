import {
  getEffectiveUserRateLimitsFromSettings,
  normalizeTenantChatSettingsPayload,
} from "@components/main-settings/ai-chatbot-settings/mapTenantChatSettings";
import { chatKeys } from "@query/keys";
import {
  buildUserRateLimitFromSettingsCaps,
  mapChatRateLimitApi,
} from "@page-modules/chat/shared/mapChatRateLimit";
import type { ChatUserRateLimitView } from "@page-modules/chat/shared/mapChatRateLimit";
import { resolveTenantIdFromSession } from "@page-modules/chat/shared/resolveTenantIdFromSession";
import { getChatUserRateLimit, getTenantChatSettings, type ChatRateLimit } from "@utils/chat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";

export function useChatAssistantRateLimit(enabled: boolean) {
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const tenantId = useMemo(
    () => resolveTenantIdFromSession(session?.user),
    [session?.user],
  );

  const usageQuery = useQuery({
    queryKey: chatKeys.assistant.rateLimit(),
    queryFn: getChatUserRateLimit,
    enabled: enabled && sessionStatus === "authenticated",
    staleTime: 30_000,
    select: (data) =>
      data
        ? mapChatRateLimitApi(data.rateLimit, data.hasUsageCounts)
        : null,
  });

  const settingsQuery = useQuery({
    queryKey: chatKeys.tenantSettings.detail(tenantId),
    queryFn: () => getTenantChatSettings(tenantId || undefined),
    enabled:
      enabled &&
      sessionStatus === "authenticated" &&
      usageQuery.isSuccess &&
      !usageQuery.data,
    staleTime: 60_000,
    select: (raw) => {
      const settings = normalizeTenantChatSettingsPayload(raw);
      const caps = getEffectiveUserRateLimitsFromSettings(settings);
      return buildUserRateLimitFromSettingsCaps(caps);
    },
  });

  const rateLimit: ChatUserRateLimitView | null =
    usageQuery.data ?? settingsQuery.data ?? null;

  const applyRateLimitFromSend = useCallback(
    (limit: ChatRateLimit | undefined) => {
      if (!limit) return;
      queryClient.setQueryData(
        chatKeys.assistant.rateLimit(),
        mapChatRateLimitApi(limit, true),
      );
    },
    [queryClient],
  );

  const refreshRateLimit = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: chatKeys.assistant.rateLimit(),
    });
  }, [queryClient]);

  return {
    rateLimit,
    isLoading: usageQuery.isLoading || settingsQuery.isLoading,
    applyRateLimitFromSend,
    refreshRateLimit,
  };
}
