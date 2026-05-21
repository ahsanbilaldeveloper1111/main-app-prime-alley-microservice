import { chatKeys, controlhubKeys } from "@query/keys";
import {
  updateChatbotUserBudget,
  type UpdateChatbotUserBudgetPayload,
} from "@utils/users";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export function useUpdateChatbotUserBudgetMutation(tenantId: string) {
  const queryClient = useQueryClient();
  const tid = tenantId.trim();

  return useMutation({
    mutationFn: async (args: {
      userId: string;
      payload: UpdateChatbotUserBudgetPayload;
    }) => {
      if (!tid) {
        throw new Error("Please select a company first");
      }
      const uid = args.userId.trim();
      if (!uid) {
        throw new Error("Please select a user");
      }
      await updateChatbotUserBudget(tid, uid, args.payload);
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: chatKeys.tenantUsers.detail(tid) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: chatKeys.assistant.all() })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: controlhubKeys.users.all() })
        .catch(() => undefined);
      toast.success("User budget override saved.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save user budget override.";
      toast.error(message);
    },
  });
}
