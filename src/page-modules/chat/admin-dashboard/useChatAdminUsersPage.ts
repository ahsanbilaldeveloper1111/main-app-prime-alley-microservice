import {
  mapChatCompaniesToSelectOptions,
  type ChatCompanySelectOption,
} from "@page-modules/chat/shared/chatCompanySelectOptions";
import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import { useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";

import {
  defaultAdminUsersFilters,
  type AdminUsersFilterForm,
} from "./adminUsersFilterTypes";
import { useChatAdminUsersQuery } from "./useChatAdminUsersQuery";

export function useChatAdminUsersPage(enabled: boolean) {
  const { status: sessionStatus } = useSession();
  const companiesQuery = useChatCompaniesQuery(
    enabled && sessionStatus === "authenticated",
  );
  const usersQuery = useChatAdminUsersQuery(enabled);

  const [draftFilters, setDraftFilters] = useState(defaultAdminUsersFilters());
  const [appliedTenantId, setAppliedTenantId] = useState("");

  const companyOptions: ChatCompanySelectOption[] = useMemo(
    () => mapChatCompaniesToSelectOptions(companiesQuery.data ?? []),
    [companiesQuery.data],
  );

  const selectedCompanyOption = useMemo(() => {
    const id = draftFilters.tenantId.trim();
    if (!id) return null;
    return companyOptions.find((o) => o.value === id) ?? { value: id, label: id };
  }, [companyOptions, draftFilters.tenantId]);

  const filteredRows = useMemo(() => {
    const all = usersQuery.rows;
    const tenantId = appliedTenantId.trim();
    if (!tenantId) return all;
    return all.filter((row) => row.tenantId === tenantId);
  }, [usersQuery.rows, appliedTenantId]);

  const updateDraft = useCallback((patch: Partial<AdminUsersFilterForm>) => {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedTenantId(draftFilters.tenantId.trim());
  }, [draftFilters.tenantId]);

  const clearFilters = useCallback(() => {
    const empty = defaultAdminUsersFilters();
    setDraftFilters(empty);
    setAppliedTenantId("");
  }, []);

  return {
    draftFilters,
    updateDraft,
    selectedCompanyOption,
    companyOptions,
    companiesLoading: companiesQuery.isPending,
    applyFilters,
    clearFilters,
    rows: filteredRows,
    count: filteredRows.length,
    totalCount: usersQuery.count,
    isLoading: usersQuery.isFetching,
    isError: usersQuery.isError,
    error: usersQuery.error,
    refetch: () => {
      usersQuery.refetch().catch(() => undefined);
    },
  };
}

export type ChatAdminUsersPageCtx = ReturnType<typeof useChatAdminUsersPage>;
