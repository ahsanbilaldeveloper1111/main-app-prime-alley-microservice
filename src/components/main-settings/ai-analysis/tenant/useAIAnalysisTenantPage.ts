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

import { useAnalysisTenantQuery } from "./useAnalysisTenantQuery";
import { useUpdateAnalysisTenantMutation } from "./useUpdateAnalysisTenantMutation";

export function useAIAnalysisTenantPage() {
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

  const appliedCompanyLabel = useMemo(() => {
    if (appliedTenantId) {
      const match = companies.find(
        (c) => resolveTenantIdFromCompany(c) === appliedTenantId,
      );
      return match?.name ?? appliedTenantId;
    }
    return "";
  }, [appliedTenantId, companies]);

  const tenantQuery = useAnalysisTenantQuery(appliedTenantId, appliedCompanyLabel);
  const saveMutation = useUpdateAnalysisTenantMutation(appliedTenantId);

  const companyOptions = useMemo(
    () => mapChatCompaniesToSelectOptions(companies),
    [companies],
  );

  const selectedCompanyOption = useMemo(() => {
    if (selectedCompanyId) {
      return findChatCompanySelectOption(companies, selectedCompanyId);
    }
    return null;
  }, [companies, selectedCompanyId]);

  const handleCompanySelect = useCallback((companyId: string) => {
    const id = companyId.trim();
    setSelectedCompanyId(id);
    setAppliedTenantId(id);
  }, []);

  const handleApplyFilter = useCallback(() => {
    const companyId = selectedCompanyId.trim();
    if (companyId) {
      setAppliedTenantId(companyId);
      return;
    }
    toast.info("Please select a company first");
  }, [selectedCompanyId]);

  const handleTenantRowSelect = useCallback((tenantId: string) => {
    const id = tenantId.trim();
    if (!id) return;
    setSelectedCompanyId(id);
    setAppliedTenantId(id);
  }, []);

  return {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    appliedCompanyLabel,
    appliedTenantId,
    handleCompanySelect,
    handleApplyFilter,
    handleTenantRowSelect,
    tenantQuery,
    saveMutation,
  };
}
