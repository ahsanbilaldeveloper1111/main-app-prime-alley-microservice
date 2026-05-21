import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import { useChatSessionAdmin } from "@page-modules/chat/shared/useChatSessionAdmin";
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
  const isAdmin = useChatSessionAdmin();
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
    sessionStatus === "authenticated" && isAdmin,
  );
  const companies = companiesQuery.data ?? [];
  const companiesLoading = companiesQuery.isPending;

  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [appliedTenantId, setAppliedTenantId] = useState("");

  useEffect(() => {
    if (!sessionTenantId) return;
    if (isAdmin) {
      setSelectedCompanyId((prev) => prev || sessionTenantId);
      setAppliedTenantId((prev) => prev || sessionTenantId);
      return;
    }
    setSelectedCompanyId(sessionTenantId);
    setAppliedTenantId(sessionTenantId);
  }, [sessionTenantId, isAdmin]);

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

  const viewingCompanyLabel = isAdmin
    ? appliedCompanyLabel
    : sessionCompanyLabel || appliedTenantId;

  const handleCompanySelect = useCallback(
    (companyId: string) => {
      if (!isAdmin) return;
      const id = companyId.trim();
      setSelectedCompanyId(id);
      setAppliedTenantId(id);
    },
    [isAdmin],
  );

  const handleApplyFilter = useCallback(() => {
    if (!isAdmin) return;
    if (!selectedCompanyId.trim()) {
      toast.info("Please select a company first");
      return;
    }
    setAppliedTenantId(selectedCompanyId.trim());
  }, [isAdmin, selectedCompanyId]);

  return {
    isAdmin,
    showCompanyFilter: isAdmin,
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
