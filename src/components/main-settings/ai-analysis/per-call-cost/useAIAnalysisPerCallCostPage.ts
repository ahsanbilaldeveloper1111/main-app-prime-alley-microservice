import { resolveChatTenantIdFromSession } from "@components/main-settings/ai-chatbot-settings/resolveChatTenantId";
import {
  findChatCompanySelectOption,
  mapChatCompaniesToSelectOptions,
} from "@page-modules/chat/shared/chatCompanySelectOptions";
import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import type { AnalysisPerCallCostFilters } from "@utils/aiAnalytics";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  DEFAULT_PER_CALL_LIMIT,
  defaultPerCallCostFilterForm,
  toAppliedPerCallCostFilters,
  type PerCallCostFilterForm,
} from "./types";
import { useAnalysisPerCallCostQuery } from "./useAnalysisPerCallCostQuery";

function parseFilterForm(form: PerCallCostFilterForm): string | null {
  const limitRaw = form.limit.trim();
  if (limitRaw) {
    const limit = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(limit) || limit < 1 || limit > 500) {
      return "Limit must be between 1 and 500.";
    }
  }
  if (form.dateFrom && form.dateTo && form.dateFrom > form.dateTo) {
    return "Date from must be on or before date to.";
  }
  return null;
}

export function useAIAnalysisPerCallCostPage() {
  const { data: session, status: sessionStatus } = useSession();
  const sessionTenantId = useMemo(
    () => resolveChatTenantIdFromSession(session?.user),
    [session?.user],
  );

  const companiesQuery = useChatCompaniesQuery(sessionStatus === "authenticated");
  const companies = companiesQuery.data ?? [];
  const companiesLoading = companiesQuery.isPending;

  const [filterForm, setFilterForm] = useState(defaultPerCallCostFilterForm);
  const [appliedFilters, setAppliedFilters] = useState<AnalysisPerCallCostFilters>(
    { limit: DEFAULT_PER_CALL_LIMIT, offset: 0 },
  );
  const [filtersApplied, setFiltersApplied] = useState(false);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    setAppliedFilters({
      limit: DEFAULT_PER_CALL_LIMIT,
      offset: 0,
    });
    setFiltersApplied(true);
  }, [sessionStatus]);

  useEffect(() => {
    if (!sessionTenantId) return;
    setFilterForm((prev) => ({
      ...prev,
      tenantId: prev.tenantId || sessionTenantId,
    }));
    setAppliedFilters((prev) =>
      prev.tenant_id ? prev : { ...prev, tenant_id: sessionTenantId },
    );
    setFiltersApplied(true);
  }, [sessionTenantId]);

  const callsQuery = useAnalysisPerCallCostQuery(
    appliedFilters,
    sessionStatus === "authenticated" && filtersApplied,
  );

  const companyOptions = useMemo(
    () => mapChatCompaniesToSelectOptions(companies),
    [companies],
  );

  const selectedCompanyOption = useMemo(() => {
    if (!filterForm.tenantId) return null;
    return findChatCompanySelectOption(companies, filterForm.tenantId);
  }, [companies, filterForm.tenantId]);

  const handleCompanySelect = useCallback((companyId: string) => {
    setFilterForm((prev) => ({ ...prev, tenantId: companyId.trim() }));
  }, []);

  const handleApplyFilter = useCallback(() => {
    const validationError = parseFilterForm(filterForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setAppliedFilters(toAppliedPerCallCostFilters(filterForm, 0));
    setFiltersApplied(true);
  }, [filterForm]);

  const updateFilterField = useCallback(
    <K extends keyof PerCallCostFilterForm>(
      key: K,
      value: PerCallCostFilterForm[K],
    ) => {
      setFilterForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const limit = appliedFilters.limit ?? DEFAULT_PER_CALL_LIMIT;
  const offset = appliedFilters.offset ?? 0;
  const total = callsQuery.data?.total ?? 0;
  const canGoPrev = offset > 0;
  const canGoNext = offset + limit < total;

  const goToPrevPage = useCallback(() => {
    if (!canGoPrev) return;
    setAppliedFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset ?? 0) - (prev.limit ?? DEFAULT_PER_CALL_LIMIT)),
    }));
  }, [canGoPrev]);

  const goToNextPage = useCallback(() => {
    if (!canGoNext) return;
    setAppliedFilters((prev) => ({
      ...prev,
      offset: (prev.offset ?? 0) + (prev.limit ?? DEFAULT_PER_CALL_LIMIT),
    }));
  }, [canGoNext]);

  return {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    filterForm,
    updateFilterField,
    handleCompanySelect,
    handleApplyFilter,
    callsQuery,
    filtersApplied,
    total,
    offset,
    limit,
    canGoPrev,
    canGoNext,
    goToPrevPage,
    goToNextPage,
  };
}
