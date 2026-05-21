import type { ChatAdminPricingHistoryField } from "@utils/chat";

export type AdminPricingHistoryFilterForm = Readonly<{
  from: string;
  to: string;
  field: "" | ChatAdminPricingHistoryField;
  limit: string;
}>;

export const defaultAdminPricingHistoryFilters =
  (): AdminPricingHistoryFilterForm => ({
    from: "",
    to: "",
    field: "",
    limit: "100",
  });

export function adminPricingHistoryFiltersToQuery(
  form: AdminPricingHistoryFilterForm,
): {
  from?: string;
  to?: string;
  field?: ChatAdminPricingHistoryField;
  limit?: number;
} {
  const limitRaw = form.limit.trim();
  const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : 100;
  const limit = Number.isFinite(limitParsed) ? limitParsed : 100;

  const field = form.field.trim();
  const query: {
    from?: string;
    to?: string;
    field?: ChatAdminPricingHistoryField;
    limit?: number;
  } = { limit };

  const from = form.from.trim();
  if (from) query.from = from;
  const to = form.to.trim();
  if (to) query.to = to;
  if (
    field === "margin_pct" ||
    field === "input_cost_per_million" ||
    field === "output_cost_per_million"
  ) {
    query.field = field;
  }

  return query;
}

export const ADMIN_PRICING_HISTORY_FIELD_OPTIONS: ReadonlyArray<{
  value: "" | ChatAdminPricingHistoryField;
  label: string;
}> = [
  { value: "", label: "All fields" },
  { value: "margin_pct", label: "Cost markup (%)" },
  { value: "input_cost_per_million", label: "Input $ / 1M tokens" },
  { value: "output_cost_per_million", label: "Output $ / 1M tokens" },
];
