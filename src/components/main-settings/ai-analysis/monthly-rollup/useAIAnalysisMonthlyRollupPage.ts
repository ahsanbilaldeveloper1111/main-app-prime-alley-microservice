import { resolveChatTenantIdFromSession } from "@components/main-settings/ai-chatbot-settings/resolveChatTenantId";
import {
  findChatCompanySelectOption,
  mapChatCompaniesToSelectOptions,
} from "@page-modules/chat/shared/chatCompanySelectOptions";
import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import type { AnalysisMonthlyRollupFilters } from "@utils/aiAnalytics";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  defaultMonthlyRollupFilterForm,
  toAppliedMonthlyRollupFilters,
  type MonthlyRollupFilterForm,
} from "./types";
import { useAnalysisMonthlyRollupQuery } from "./useAnalysisMonthlyRollupQuery";

function parseFilterForm(form: MonthlyRollupFilterForm): string | null {
  const yearRaw = form.year.trim();
  if (yearRaw) {
    const year = Number.parseInt(yearRaw, 10);
    if (!Number.isFinite(year) || year < 1) {
      return "Year must be a valid positive number.";
    }
  }
  const monthRaw = form.month.trim();
  if (monthRaw) {
    const month = Number.parseInt(monthRaw, 10);
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      return "Month must be between 1 and 12.";
    }
  }
  return null;
}

export function useAIAnalysisMonthlyRollupPage() {
  const { data: session, status: sessionStatus } = useSession();
  const sessionTenantId = useMemo(
    () => resolveChatTenantIdFromSession(session?.user),
    [session?.user],
  );

  const companiesQuery = useChatCompaniesQuery(sessionStatus === "authenticated");
  const companies = companiesQuery.data ?? [];
  const companiesLoading = companiesQuery.isPending;

  const [filterForm, setFilterForm] = useState(defaultMonthlyRollupFilterForm);
  const [appliedFilters, setAppliedFilters] = useState<AnalysisMonthlyRollupFilters>(
    {},
  );
  const [filtersApplied, setFiltersApplied] = useState(false);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    setAppliedFilters(toAppliedMonthlyRollupFilters(defaultMonthlyRollupFilterForm()));
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

  const rollupQuery = useAnalysisMonthlyRollupQuery(
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
    setAppliedFilters(toAppliedMonthlyRollupFilters(filterForm));
    setFiltersApplied(true);
  }, [filterForm]);

  const updateFilterField = useCallback(
    <K extends keyof MonthlyRollupFilterForm>(
      key: K,
      value: MonthlyRollupFilterForm[K],
    ) => {
      setFilterForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    filterForm,
    updateFilterField,
    handleCompanySelect,
    handleApplyFilter,
    rollupQuery,
    filtersApplied,
  };
}
