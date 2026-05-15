import { chatKeys } from "@query/keys";
import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import {
  getChatTrainingStatus,
  submitChatTraining,
  type ChatTrainingResponse,
} from "@utils/chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

export function useFaqProfilesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const companiesQuery = useChatCompaniesQuery(true);
  const companies = companiesQuery.data ?? [];
  const companiesLoading = companiesQuery.isPending;

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingResponse, setTrainingResponse] = useState<ChatTrainingResponse | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [statusTenantId, setStatusTenantId] = useState("");

  const statusTenantTrimmed = statusTenantId.trim();

  const trainingStatusQuery = useQuery({
    queryKey: chatKeys.training.status(statusTenantTrimmed || "__none__"),
    queryFn: () => getChatTrainingStatus(statusTenantTrimmed),
    enabled: Boolean(statusTenantTrimmed),
    retry: false,
  });

  const trainingMutation = useMutation({
    mutationFn: (tenantId: string) =>
      submitChatTraining({
        tenant_id: tenantId,
        chunk_size: 1000,
        chunk_overlap: 200,
      }),
    onSuccess: (response, tenantId) => {
      setTrainingResponse(response);
      setShowTrainingModal(true);
      const id = tenantId.trim();
      setStatusTenantId(id);
      void queryClient.invalidateQueries({
        queryKey: chatKeys.training.status(id),
      });
    },
    onError: () => {
      // submitChatTraining already surfaces toast
    },
  });

  const handleTrainBotClick = useCallback(() => {
    setSelectedCompanyId("");
    setShowCompanyModal(true);
  }, []);

  const handleCompanySubmit = useCallback(() => {
    if (!selectedCompanyId?.trim()) {
      toast.info("Please select a company first");
      return;
    }
    setShowCompanyModal(false);
    trainingMutation.mutate(selectedCompanyId.trim());
  }, [selectedCompanyId, trainingMutation]);

  const closeTrainingModal = useCallback(() => {
    setShowTrainingModal(false);
    setTrainingResponse(null);
  }, []);

  const refetchTrainingStatus = useCallback(() => {
    if (!statusTenantTrimmed) {
      toast.info("Select a company above to load training status");
      return;
    }
    void trainingStatusQuery.refetch();
  }, [statusTenantTrimmed, trainingStatusQuery]);

  const trainingStatusErrorMessage =
    trainingStatusQuery.isError && trainingStatusQuery.error instanceof Error
      ? trainingStatusQuery.error.message
      : null;

  return {
    router,
    companies,
    companiesLoading,
    showCompanyModal,
    setShowCompanyModal,
    showTrainingModal,
    trainingResponse,
    selectedCompanyId,
    setSelectedCompanyId,
    handleTrainBotClick,
    handleCompanySubmit,
    closeTrainingModal,
    trainingLoading: trainingMutation.isPending,
    statusTenantId,
    setStatusTenantId,
    trainingStatus: trainingStatusQuery.data ?? null,
    trainingStatusLoading: trainingStatusQuery.isFetching,
    trainingStatusErrorMessage,
    refetchTrainingStatus,
  };
}
