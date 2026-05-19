import { chatKeys } from "@query/keys";
import { updateTenantChatSettings } from "@utils/chat";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { mapFormValuesToTenantSettingsUpdate } from "./mapTenantChatSettings";
import type { AIChatbotSettingsFormValues } from "./types";

export function useUpdateChatTenantSettingsMutation(appliedTenantId: string) {
  const queryClient = useQueryClient();
  const tenantId = appliedTenantId.trim();

  return useMutation({
    mutationFn: async (values: AIChatbotSettingsFormValues) => {
      if (!tenantId) {
        throw new Error("Please select a company first");
      }
      const payload = mapFormValuesToTenantSettingsUpdate(values, tenantId);
      return updateTenantChatSettings(payload);
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
