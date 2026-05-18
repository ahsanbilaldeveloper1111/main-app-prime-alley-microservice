import type { AnalysisPerCallCostRow } from "@utils/aiAnalytics";

const intFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const usdFmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

function formatTimestamp(value: string | null): string {
  if (!value?.trim()) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatDurationSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "—";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function formatPerCallCostCell(
  row: AnalysisPerCallCostRow,
  column:
    | "id"
    | "tenant_id"
    | "call_id"
    | "agent_id"
    | "call_date"
    | "call_datetime"
    | "duration_s"
    | "input_tokens"
    | "output_tokens"
    | "analysis_cost_usd"
    | "status"
    | "fail_reason"
    | "served_from"
    | "created_at",
): string {
  switch (column) {
    case "id":
      return row.id || "—";
    case "tenant_id":
      return row.tenant_id;
    case "call_id":
      return row.call_id || "—";
    case "agent_id":
      return row.agent_id ?? "—";
    case "call_date":
      return row.call_date ?? "—";
    case "call_datetime":
      return formatTimestamp(row.call_datetime);
    case "duration_s":
      return formatDurationSeconds(row.duration_s);
    case "input_tokens":
      return intFmt.format(row.input_tokens);
    case "output_tokens":
      return intFmt.format(row.output_tokens);
    case "analysis_cost_usd":
      return usdFmt.format(row.analysis_cost_usd);
    case "status":
      return row.status || "—";
    case "fail_reason":
      return row.fail_reason ?? "—";
    case "served_from":
      return row.served_from ?? "—";
    case "created_at":
      return formatTimestamp(row.created_at);
    default:
      return "—";
  }
}
