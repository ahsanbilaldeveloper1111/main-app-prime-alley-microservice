import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  findChatCompanySelectOption,
  mapChatCompaniesToSelectOptions,
  resolveTenantIdFromCompany,
} from "@page-modules/chat/shared/chatCompanySelectOptions";
import { resolveChatTenantIdFromSession } from "./resolveChatTenantId";
import { useChatTenantSettingsQuery } from "./useChatTenantSettingsQuery";
import { useUpdateChatTenantSettingsMutation } from "./useUpdateChatTenantSettingsMutation";

export function useAIChatbotSettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const sessionTenantId = useMemo(
    () => resolveChatTenantIdFromSession(session?.user),
    [session?.user],
  );
  const sessionCompanyLabel = useMemo(() => {
    const user = session?.user;
    if (!user || typeof user !== "object") {
      return "";
    }
    const name = (user as { company_name?: string | null }).company_name;
    return typeof name === "string" ? name.trim() : "";
  }, [session?.user]);

  const companiesQuery = useChatCompaniesQuery(
    sessionStatus === "authenticated",
  );
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

  const viewingCompanyLabel =
    appliedCompanyLabel || sessionCompanyLabel || appliedTenantId;

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
    showCompanyFilter: true,
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    appliedCompanyLabel,
    viewingCompanyLabel,
    appliedTenantId,
    handleCompanySelect,
    handleApplyFilter,
    companies,
    settingsQuery,
    saveMutation,
  };
}
