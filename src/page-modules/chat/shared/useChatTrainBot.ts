import { chatKeys } from "@query/keys";
import { postChatTraining, type ChatTrainingResponse } from "@utils/chat";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

const TRAINING_CHUNK_SIZE = 1000;
const TRAINING_CHUNK_OVERLAP = 200;

export function useChatTrainBot(resolveTenantId: () => string) {
  const queryClient = useQueryClient();
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingResponse, setTrainingResponse] =
    useState<ChatTrainingResponse | null>(null);

  const trainingMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      return postChatTraining({
        tenant_id: tenantId,
        chunk_size: TRAINING_CHUNK_SIZE,
        chunk_overlap: TRAINING_CHUNK_OVERLAP,
      });
    },
    onSuccess: (response, tenantId) => {
      setTrainingResponse(response);
      setShowTrainingModal(true);
      const id = tenantId.trim();
      void queryClient.invalidateQueries({
        queryKey: chatKeys.training.status(id),
      });
      void queryClient.invalidateQueries({
        queryKey: chatKeys.tenantDashboard.detail(id),
      });
      toast.success(response.message?.trim() || "Bot training completed.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to train bot.";
      toast.error(message);
    },
  });

  const handleTrainBotClick = useCallback(() => {
    const tenantId = resolveTenantId().trim();
    if (!tenantId) {
      toast.info("Please select a company and apply the filter first");
      return;
    }
    trainingMutation.mutate(tenantId);
  }, [resolveTenantId, trainingMutation]);

  const closeTrainingModal = useCallback(() => {
    setShowTrainingModal(false);
    setTrainingResponse(null);
  }, []);

  return {
    handleTrainBotClick,
    trainingLoading: trainingMutation.isPending,
    showTrainingModal,
    trainingResponse,
    closeTrainingModal,
  };
}
