import { resolveChatTenantIdFromSession } from "@components/main-settings/ai-chatbot-settings/resolveChatTenantId";
import {
  findChatCompanySelectOption,
  mapChatCompaniesToSelectOptions,
  resolveTenantIdFromCompany,
} from "@page-modules/chat/shared/chatCompanySelectOptions";
import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { useAnalysisPricingQuery } from "./useAnalysisPricingQuery";
import { useUpdateAnalysisPricingMutation } from "./useUpdateAnalysisPricingMutation";

export function useAIAnalysisPricingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const sessionTenantId = useMemo(
    () => resolveChatTenantIdFromSession(session?.user),
    [session?.user],
  );

  const companiesQuery = useChatCompaniesQuery(sessionStatus === "authenticated");
  const companies = companiesQuery.data ?? [];
  const companiesLoading = companiesQuery.isPending;

  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [appliedTenantId, setAppliedTenantId] = useState("");

  useEffect(() => {
    if (!sessionTenantId) return;
    setSelectedCompanyId((prev) => prev || sessionTenantId);
    setAppliedTenantId((prev) => prev || sessionTenantId);
  }, [sessionTenantId]);

  const pricingQuery = useAnalysisPricingQuery(appliedTenantId);
  const saveMutation = useUpdateAnalysisPricingMutation(appliedTenantId);

  const companyOptions = useMemo(
    () => mapChatCompaniesToSelectOptions(companies),
    [companies],
  );

  const selectedCompanyOption = useMemo(() => {
    if (!selectedCompanyId) return null;
    return findChatCompanySelectOption(companies, selectedCompanyId);
  }, [companies, selectedCompanyId]);

  const appliedCompanyLabel = useMemo(() => {
    if (!appliedTenantId) return "";
    const match = companies.find(
      (c) => resolveTenantIdFromCompany(c) === appliedTenantId,
    );
    return match?.name ?? appliedTenantId;
  }, [appliedTenantId, companies]);

  const handleCompanySelect = useCallback((companyId: string) => {
    const id = companyId.trim();
    setSelectedCompanyId(id);
    setAppliedTenantId(id);
  }, []);

  const handleApplyFilter = useCallback(() => {
    if (!selectedCompanyId.trim()) {
      toast.info("Please select a company first");
      return;
    }
    setAppliedTenantId(selectedCompanyId.trim());
  }, [selectedCompanyId]);

  return {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    appliedCompanyLabel,
    appliedTenantId,
    handleCompanySelect,
    handleApplyFilter,
    pricingQuery,
    saveMutation,
  };
}
