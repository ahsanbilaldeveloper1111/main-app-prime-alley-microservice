import { resolveTenantDisplayFromCompanies } from "@page-modules/chat/shared/chatCompanySelectOptions";
import {
  useChatCompaniesQuery,
  type ChatCompanyOption,
} from "@page-modules/chat/useChatCompaniesQuery";
import { chatKeys } from "@query/keys";
import {
  getChatAdminPricingHistory,
  type ChatAdminPricingHistoryRow,
} from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";

import {
  adminPricingHistoryFiltersToQuery,
  defaultAdminPricingHistoryFilters,
  type AdminPricingHistoryFilterForm,
} from "./adminPricingHistoryTypes";

export type AdminPricingHistoryRowView = ChatAdminPricingHistoryRow & {
  tenantName: string;
};

function enrichPricingRows(
  rows: ChatAdminPricingHistoryRow[],
  companies: readonly ChatCompanyOption[] | undefined,
): AdminPricingHistoryRowView[] {
  const list = companies ?? [];
  return rows.map((row) => {
    const { tenantId, tenantName } = resolveTenantDisplayFromCompanies(
      row.tenant_id,
      list,
    );
    return { ...row, tenant_id: tenantId, tenantName };
  });
}

export function useChatAdminPricingHistoryPage(enabled: boolean) {
  const { status: sessionStatus } = useSession();
  const companiesQuery = useChatCompaniesQuery(
    enabled && sessionStatus === "authenticated",
  );

  const [draftFilters, setDraftFilters] = useState(
    defaultAdminPricingHistoryFilters(),
  );
  const [appliedFilters, setAppliedFilters] = useState(
    defaultAdminPricingHistoryFilters(),
  );

  const appliedQuery = useMemo(
    () => adminPricingHistoryFiltersToQuery(appliedFilters),
    [appliedFilters],
  );

  const historyQuery = useQuery({
    queryKey: chatKeys.adminPricingHistory.list(appliedQuery),
    queryFn: () => getChatAdminPricingHistory(appliedQuery),
    enabled: enabled && sessionStatus === "authenticated",
    staleTime: 30_000,
  });

  const rows = useMemo(
    () =>
      enrichPricingRows(historyQuery.data?.rows ?? [], companiesQuery.data),
    [historyQuery.data?.rows, companiesQuery.data],
  );

  const updateDraft = useCallback(
    (patch: Partial<AdminPricingHistoryFilterForm>) => {
      setDraftFilters((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...draftFilters });
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    const empty = defaultAdminPricingHistoryFilters();
    setDraftFilters(empty);
    setAppliedFilters(empty);
  }, []);

  const refetch = useCallback(() => {
    historyQuery.refetch().catch(() => undefined);
  }, [historyQuery]);

  return {
    draftFilters,
    updateDraft,
    applyFilters,
    clearFilters,
    rows,
    count: historyQuery.data?.count ?? 0,
    isLoading: historyQuery.isFetching,
    isError: historyQuery.isError,
    error: historyQuery.error,
    refetch,
  };
}

export type ChatAdminPricingHistoryPageCtx = ReturnType<
  typeof useChatAdminPricingHistoryPage
>;
