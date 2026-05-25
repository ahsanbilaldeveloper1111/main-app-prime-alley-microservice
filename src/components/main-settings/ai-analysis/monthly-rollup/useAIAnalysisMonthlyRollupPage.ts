import { resolveChatTenantIdFromSession } from "@components/main-settings/ai-chatbot-settings/resolveChatTenantId";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {  defaultMonthlyRollupFilterForm,
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

  const [filterForm, setFilterForm] = useState(defaultMonthlyRollupFilterForm);
  const [appliedFilterForm, setAppliedFilterForm] = useState(
    defaultMonthlyRollupFilterForm,
  );
  const [filtersApplied, setFiltersApplied] = useState(false);

  const appliedFilters = useMemo(
    () => toAppliedMonthlyRollupFilters(appliedFilterForm, sessionTenantId),
    [appliedFilterForm, sessionTenantId],
  );

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    setAppliedFilterForm(defaultMonthlyRollupFilterForm());
    setFiltersApplied(true);
  }, [sessionStatus]);

  const rollupQuery = useAnalysisMonthlyRollupQuery(
    appliedFilters,
    sessionStatus === "authenticated" && filtersApplied && Boolean(sessionTenantId),
  );

  const handleApplyFilter = useCallback(() => {
    const validationError = parseFilterForm(filterForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setAppliedFilterForm(filterForm);
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
    filterForm,
    updateFilterField,
    handleApplyFilter,
    rollupQuery,
    filtersApplied,
    sessionTenantId,
  };
}
