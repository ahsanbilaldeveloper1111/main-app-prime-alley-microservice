import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import { submitChatTraining, type ChatTrainingResponse } from "@utils/chat";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

export function useFaqProfilesPage() {
  const router = useRouter();
  const companiesQuery = useChatCompaniesQuery(true);
  const companies = companiesQuery.data ?? [];
  const companiesLoading = companiesQuery.isPending;

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingResponse, setTrainingResponse] = useState<ChatTrainingResponse | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const trainingMutation = useMutation({
    mutationFn: (tenantId: string) =>
      submitChatTraining({
        tenant_id: tenantId,
        chunk_size: 1000,
        chunk_overlap: 200,
      }),
    onSuccess: (response) => {
      setTrainingResponse(response);
      setShowTrainingModal(true);
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

  return {
    router,
    companies,
    companiesLoading,
    showCompanyModal,
    setShowCompanyModal,
    showTrainingModal,
    setShowTrainingModal,
    trainingResponse,
    selectedCompanyId,
    setSelectedCompanyId,
    handleTrainBotClick,
    handleCompanySubmit,
    closeTrainingModal,
    trainingLoading: trainingMutation.isPending,
  };
}
