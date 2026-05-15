import { chatKeys } from "@query/keys";
import { updateTenantChatSettings } from "@utils/chat";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { toast } from "react-toastify";

import { mapFormValuesToTenantSettingsUpdate } from "./mapTenantChatSettings";
import { resolveChatTenantIdFromSession } from "./resolveChatTenantId";
import type { AIChatbotSettingsFormValues } from "./types";

export function useUpdateChatTenantSettingsMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const tenantId = useMemo(
    () => resolveChatTenantIdFromSession(session?.user),
    [session?.user],
  );

  return useMutation({
    mutationFn: async (values: AIChatbotSettingsFormValues) => {
      const payload = mapFormValuesToTenantSettingsUpdate(values);
      return updateTenantChatSettings(payload, tenantId || undefined);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(chatKeys.tenantSettings.detail(tenantId), data);
      queryClient
        .invalidateQueries({
          queryKey: chatKeys.tenantSettings.all(),
        })
        .catch(() => undefined);
      toast.success("AI Chatbot settings saved.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save AI Chatbot settings.";
      toast.error(message);
    },
  });
}
