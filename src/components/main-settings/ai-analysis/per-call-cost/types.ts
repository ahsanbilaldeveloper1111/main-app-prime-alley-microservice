import type { AnalysisPerCallCostFilters } from "@utils/aiAnalytics";

export type PerCallCostFilterForm = {
  tenantId: string;
  dateFrom: string;
  dateTo: string;
  status: "" | "success" | "failed";
  limit: string;
};

export const DEFAULT_PER_CALL_LIMIT = 100;

export function defaultPerCallCostFilterForm(): PerCallCostFilterForm {
  return {
    tenantId: "",
    dateFrom: "",
    dateTo: "",
    status: "",
    limit: String(DEFAULT_PER_CALL_LIMIT),
  };
}

export function toAppliedPerCallCostFilters(
  form: PerCallCostFilterForm,
  offset: number,
): AnalysisPerCallCostFilters {
  const filters: AnalysisPerCallCostFilters = { offset };

  const tenantId = form.tenantId.trim();
  if (tenantId) {
    filters.tenant_id = tenantId;
  }
  const dateFrom = form.dateFrom.trim();
  if (dateFrom) {
    filters.date_from = dateFrom;
  }
  const dateTo = form.dateTo.trim();
  if (dateTo) {
    filters.date_to = dateTo;
  }
  if (form.status === "success" || form.status === "failed") {
    filters.status = form.status;
  }
  const limitRaw = form.limit.trim();
  const parsedLimit = limitRaw
    ? Number.parseInt(limitRaw, 10)
    : DEFAULT_PER_CALL_LIMIT;
  filters.limit = Number.isFinite(parsedLimit) ? parsedLimit : DEFAULT_PER_CALL_LIMIT;

  return filters;
}
