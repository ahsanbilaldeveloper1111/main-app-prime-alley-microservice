import { chatKeys } from "@query/keys";
import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import {
  mapChatCompaniesToSelectOptions,
  type ChatCompanySelectOption,
} from "@page-modules/chat/shared/chatCompanySelectOptions";
import { getChatAdminAuditLog } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";

import {
  chatAdminAuditLogFiltersToQuery,
  defaultChatAdminAuditLogFilters,
  type ChatAdminAuditLogFilterForm,
} from "./types";

export function useChatAdminAuditLogPage() {
  const { status: sessionStatus } = useSession();
  const companiesQuery = useChatCompaniesQuery(sessionStatus === "authenticated");

  const [draftFilters, setDraftFilters] = useState(defaultChatAdminAuditLogFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultChatAdminAuditLogFilters);

  const appliedQuery = useMemo(
    () => chatAdminAuditLogFiltersToQuery(appliedFilters),
    [appliedFilters],
  );

  const auditLogQuery = useQuery({
    queryKey: chatKeys.adminAuditLog.list(appliedQuery),
    queryFn: () => getChatAdminAuditLog(appliedQuery),
    enabled: sessionStatus === "authenticated",
    staleTime: 30_000,
  });

  const companyOptions: ChatCompanySelectOption[] = useMemo(
    () => mapChatCompaniesToSelectOptions(companiesQuery.data ?? []),
    [companiesQuery.data],
  );

  const selectedCompanyOption = useMemo(() => {
    const id = draftFilters.tenantId.trim();
    if (!id) return null;
    return companyOptions.find((o) => o.value === id) ?? { value: id, label: id };
  }, [companyOptions, draftFilters.tenantId]);

  const updateDraft = useCallback(
    (patch: Partial<ChatAdminAuditLogFilterForm>) => {
      setDraftFilters((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...draftFilters });
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    const empty = defaultChatAdminAuditLogFilters();
    setDraftFilters(empty);
    setAppliedFilters(empty);
  }, []);

  const refetch = useCallback(() => {
    auditLogQuery.refetch().catch(() => undefined);
  }, [auditLogQuery]);

  return {
    draftFilters,
    updateDraft,
    selectedCompanyOption,
    companyOptions,
    companiesLoading: companiesQuery.isPending,
    applyFilters,
    clearFilters,
    data: auditLogQuery.data ?? null,
    isLoading: auditLogQuery.isFetching,
    isError: auditLogQuery.isError,
    error: auditLogQuery.error,
    refetch,
  };
}

export type ChatAdminAuditLogPageCtx = ReturnType<typeof useChatAdminAuditLogPage>;
