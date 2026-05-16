import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  resolveChatTenantIdFromSession,
  resolveTenantIdFromCompany,
} from "./resolveChatTenantId";
import { useChatTenantSettingsQuery } from "./useChatTenantSettingsQuery";
import { useUpdateChatTenantSettingsMutation } from "./useUpdateChatTenantSettingsMutation";

export function useAIChatbotSettingsPage() {
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

  const settingsQuery = useChatTenantSettingsQuery(appliedTenantId);
  const saveMutation = useUpdateChatTenantSettingsMutation(appliedTenantId);

  const companyOptions = useMemo(
    () =>
      companies
        .map((company) => {
          const tenantId = resolveTenantIdFromCompany(company);
          if (!tenantId) return null;
          return {
            value: tenantId,
            label: company.name ?? tenantId,
          };
        })
        .filter((opt): opt is { value: string; label: string } => opt != null),
    [companies],
  );

  const selectedCompanyOption = useMemo(() => {
    if (!selectedCompanyId) return null;
    const match = companyOptions.find((opt) => opt.value === selectedCompanyId);
    return match ?? { value: selectedCompanyId, label: selectedCompanyId };
  }, [companyOptions, selectedCompanyId]);

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
    settingsQuery,
    saveMutation,
  };
}
