import type { AnalysisTenantRecord } from "@utils/aiAnalytics";

import { formatAnalysisTimestamp } from "../shared/formatAnalysisTimestamp";

const TOKENS_PER_MILLION = 1_000_000;

function formatUsd(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return `$${value.toFixed(6)}`;
}

function formatPerMillionOverride(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return formatUsd(value * TOKENS_PER_MILLION);
}

export function formatTenantTableCell(
  row: AnalysisTenantRecord,
  column:
    | "tenant_id"
    | "industry_type"
    | "primary_language"
    | "monthly_call_limit"
    | "alert_threshold_pct"
    | "cost_limit_usd"
    | "created_at"
    | "updated_at"
    | "input_override"
    | "output_override",
): string {
  switch (column) {
    case "tenant_id":
      return row.tenant_id;
    case "industry_type":
      return row.industry_type?.trim() || "—";
    case "primary_language":
      return row.primary_language?.trim() || "—";
    case "monthly_call_limit":
      return row.monthly_call_limit == null
        ? "Unlimited"
        : String(row.monthly_call_limit);
    case "alert_threshold_pct":
      return `${row.alert_threshold_pct}%`;
    case "cost_limit_usd":
      return `$${row.cost_limit_usd.toFixed(2)}`;
    case "created_at":
      return formatAnalysisTimestamp(row.created_at);
    case "updated_at":
      return formatAnalysisTimestamp(row.updated_at);
    case "input_override":
      return formatPerMillionOverride(row.cost_per_input_token_usd);
    case "output_override":
      return formatPerMillionOverride(row.cost_per_output_token_usd);
    default:
      return "—";
  }
}
