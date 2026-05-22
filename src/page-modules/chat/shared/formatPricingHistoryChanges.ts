import type { ChatPricingFieldChange } from "@utils/chat";

const FIELD_LABELS: Record<string, string> = {
  margin_pct: "Cost margin (%)",
  input_cost_per_million: "Input $ / 1M tokens",
  output_cost_per_million: "Output $ / 1M tokens",
};

function formatChangeValue(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

export function formatPricingHistoryFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replaceAll("_", " ");
}

export function formatPricingHistoryChangeLine(
  field: string,
  change: ChatPricingFieldChange,
): string {
  const label = formatPricingHistoryFieldLabel(field);
  const from = formatChangeValue(change.from);
  const to = formatChangeValue(change.to);
  return `${label}: ${from} → ${to}`;
}

export function formatPricingHistoryTimestamp(ts: string, tsRaw: string): string {
  const raw = tsRaw.trim();
  if (raw) return raw;
  const iso = ts.trim();
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}
