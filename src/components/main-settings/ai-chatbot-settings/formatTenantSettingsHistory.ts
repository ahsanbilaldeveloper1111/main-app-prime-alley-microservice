import type { TenantChatSettingsHistoryFieldChange } from "@utils/chat";

const EVENT_LABELS: Record<string, string> = {
  user_budget: "User budget",
  settings: "Settings",
};

const FIELD_LABELS: Record<string, string> = {
  default_user_budget_usd: "Default per user budget (USD)",
  default_budget_threshold_pct: "Default alert threshold (%)",
  monthly_budget_usd: "Default per user budget (USD)",
  budget_threshold_pct: "Default alert threshold (%)",
  model_name: "Model",
  input_cost_per_million: "Input $ / 1M tokens",
  output_cost_per_million: "Output $ / 1M tokens",
};

export function formatSettingsHistoryEventLabel(event: string): string {
  const key = event.trim();
  return EVENT_LABELS[key] ?? (key || "—");
}

function formatChangeValue(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

export function formatSettingsHistoryFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replaceAll("_", " ");
}

export function formatSettingsHistoryChangeLine(
  field: string,
  change: TenantChatSettingsHistoryFieldChange,
): string {
  const label = formatSettingsHistoryFieldLabel(field);
  const from = formatChangeValue(change.from);
  const to = formatChangeValue(change.to);
  return `${label}: ${from} → ${to}`;
}

export function formatSettingsHistoryTimestamp(ts: string, tsRaw: string): string {
  const raw = tsRaw.trim();
  if (raw) return raw;
  const iso = ts.trim();
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}
