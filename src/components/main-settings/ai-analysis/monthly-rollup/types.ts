import type { AnalysisMonthlyRollupFilters } from "@utils/aiAnalytics";

export type MonthlyRollupFilterForm = {
  tenantId: string;
  year: string;
  month: string;
};

export function defaultMonthlyRollupFilterForm(): MonthlyRollupFilterForm {
  const now = new Date();
  return {
    tenantId: "",
    year: String(now.getFullYear()),
    month: "",
  };
}

export function toAppliedMonthlyRollupFilters(
  form: MonthlyRollupFilterForm,
): AnalysisMonthlyRollupFilters {
  const filters: AnalysisMonthlyRollupFilters = {};
  const tenantId = form.tenantId.trim();
  if (tenantId) {
    filters.tenant_id = tenantId;
  }
  const yearRaw = form.year.trim();
  if (yearRaw) {
    const year = Number.parseInt(yearRaw, 10);
    if (Number.isFinite(year)) {
      filters.year = year;
    }
  }
  const monthRaw = form.month.trim();
  if (monthRaw) {
    const month = Number.parseInt(monthRaw, 10);
    if (Number.isFinite(month)) {
      filters.month = month;
    }
  }
  return filters;
}
