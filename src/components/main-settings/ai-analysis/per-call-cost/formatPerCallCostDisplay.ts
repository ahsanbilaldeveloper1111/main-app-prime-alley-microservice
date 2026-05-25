import type { AnalysisPerCallCostRow } from "@utils/aiAnalytics";

import { formatAnalysisTimestamp } from "../shared/formatAnalysisTimestamp";

const intFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const usdFmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

export type PerCallCostTableColumnKey =
  | "call_id"
  | "agent_id"
  | "call_time"
  | "duration_s"
  | "input_tokens"
  | "output_tokens"
  | "analysis_cost_usd"
  | "status"
  | "served_from"
  | "fail_reason"
  | "created_at";

export const PER_CALL_COST_TABLE_COLUMNS: ReadonlyArray<{
  key: PerCallCostTableColumnKey;
  label: string;
  width: string;
  align?: "left" | "right";
}> = [
  { key: "call_id", label: "Call ID", width: "280px" },
  { key: "agent_id", label: "Agent", width: "100px" },
  { key: "call_time", label: "Call time", width: "168px" },
  { key: "duration_s", label: "Duration", width: "88px" },
  { key: "input_tokens", label: "Input tokens", width: "108px", align: "right" },
  { key: "output_tokens", label: "Output tokens", width: "116px", align: "right" },
  { key: "analysis_cost_usd", label: "Cost", width: "112px", align: "right" },
  { key: "status", label: "Status", width: "88px" },
  { key: "served_from", label: "Served from", width: "100px" },
  { key: "fail_reason", label: "Fail reason", width: "160px" },
  { key: "created_at", label: "Recorded", width: "168px" },
];

function formatOptionalText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "—";
}

function formatLabelValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "—";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function formatCallTime(row: AnalysisPerCallCostRow): string {
  if (row.call_datetime?.trim()) {
    return formatAnalysisTimestamp(row.call_datetime);
  }
  const dateOnly = row.call_date?.trim();
  if (!dateOnly) {
    return "—";
  }
  const parsed = new Date(dateOnly);
  if (Number.isNaN(parsed.getTime())) {
    return dateOnly;
  }
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  column: PerCallCostTableColumnKey,
): string {
  switch (column) {
    case "call_id":
      return formatOptionalText(row.call_id);
    case "agent_id":
      return formatOptionalText(row.agent_id);
    case "call_time":
      return formatCallTime(row);
    case "duration_s":
      return formatDurationSeconds(row.duration_s);
    case "input_tokens":
      return intFmt.format(row.input_tokens);
    case "output_tokens":
      return intFmt.format(row.output_tokens);
    case "analysis_cost_usd":
      return usdFmt.format(row.analysis_cost_usd);
    case "status":
      return formatLabelValue(row.status);
    case "served_from":
      return row.served_from ? formatLabelValue(row.served_from) : "—";
    case "fail_reason":
      return formatOptionalText(row.fail_reason);
    case "created_at":
      return formatAnalysisTimestamp(row.created_at);
    default:
      return "—";
  }
}
