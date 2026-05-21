import { chatKeys } from "@query/keys";
import {
  CHAT_TENANT_SETTINGS_HISTORY_FETCH_ERROR_MESSAGE,
  getTenantChatSettingsHistory,
} from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";

import {
  defaultTenantSettingsHistoryFilters,
  tenantSettingsHistoryFiltersToQuery,
  type TenantSettingsHistoryFilterForm,
} from "./tenantSettingsHistoryTypes";

export function useChatTenantSettingsHistory(
  tenantId: string,
  enabled: boolean,
) {
  const { status: sessionStatus } = useSession();
  const [draftFilters, setDraftFilters] = useState(
    defaultTenantSettingsHistoryFilters,
  );
  const [appliedFilters, setAppliedFilters] = useState(
    defaultTenantSettingsHistoryFilters,
  );

  const appliedQuery = useMemo(
    () => tenantSettingsHistoryFiltersToQuery(tenantId, appliedFilters),
    [tenantId, appliedFilters],
  );

  const historyQuery = useQuery({
    queryKey: chatKeys.tenantSettings.history(tenantId, appliedQuery),
    queryFn: () => getTenantChatSettingsHistory(appliedQuery),
    enabled:
      enabled && sessionStatus === "authenticated" && Boolean(tenantId.trim()),
    staleTime: 30_000,
  });

  const updateDraft = useCallback(
    (patch: Partial<TenantSettingsHistoryFilterForm>) => {
      setDraftFilters((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...draftFilters });
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    const empty = defaultTenantSettingsHistoryFilters();
    setDraftFilters(empty);
    setAppliedFilters(empty);
  }, []);

  const resetFiltersForTenant = useCallback(() => {
    const empty = defaultTenantSettingsHistoryFilters();
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
    resetFiltersForTenant,
    rows: historyQuery.data?.rows ?? [],
    tenantIdFromApi: historyQuery.data?.tenant_id ?? "",
    isLoading: historyQuery.isFetching,
    isError: historyQuery.isError,
    errorMessage: historyQuery.isError
      ? CHAT_TENANT_SETTINGS_HISTORY_FETCH_ERROR_MESSAGE
      : null,
    refetch,
  };
}

export type ChatTenantSettingsHistoryCtx = ReturnType<
  typeof useChatTenantSettingsHistory
>;
