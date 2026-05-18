import type { AnalysisMonthlyRollupRow } from "@utils/aiAnalytics";

const intFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const usdFmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatMonthLabel(month: number): string {
  if (month >= 1 && month <= 12) {
    return MONTH_NAMES[month - 1];
  }
  return String(month);
}

export function formatMonthlyRollupCell(
  row: AnalysisMonthlyRollupRow,
  column:
    | "tenant_id"
    | "year"
    | "month"
    | "total_calls"
    | "total_cost_usd"
    | "success_count"
    | "failed_count"
    | "cache_count"
    | "fresh_count"
    | "success_rate",
): string {
  switch (column) {
    case "tenant_id":
      return row.tenant_id;
    case "year":
      return String(row.year);
    case "month":
      return formatMonthLabel(row.month);
    case "total_calls":
      return intFmt.format(row.total_calls);
    case "total_cost_usd":
      return usdFmt.format(row.total_cost_usd);
    case "success_count":
      return intFmt.format(row.success_count);
    case "failed_count":
      return intFmt.format(row.failed_count);
    case "cache_count":
      return intFmt.format(row.cache_count);
    case "fresh_count":
      return intFmt.format(row.fresh_count);
    case "success_rate":
      return `${row.success_rate.toFixed(1)}%`;
    default:
      return "—";
  }
}
