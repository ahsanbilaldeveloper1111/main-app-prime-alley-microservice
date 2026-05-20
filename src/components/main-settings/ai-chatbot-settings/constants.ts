/** Applied when GET `/chat/tenant/settings` returns no data or omits rate limits. */
export const AI_CHATBOT_DEFAULT_RATE_LIMITS = {
  user_per_minute: 20,
  user_per_day: 500,
  tenant_per_minute: 400,
  tenant_per_day: 20_000,
} as const;

/** Input placeholders shown when fields are empty. */
export const AI_CHATBOT_FIELD_PLACEHOLDERS = {
  rateLimits: {
    perUserPerMinute: "Default: 20",
    perUserPerDay: "Default: 500",
    perTenantPerMinute: "Default: 400",
    perTenantPerDay: "Default: 20000",
  },
  budget: {
    monthlyBudgetUsd: "50.00 (blank = unlimited)",
    alertThresholdPct: "Default: 80",
  },
  pricing: {
    inputCostPerMillion: "Default: $0.15",
    outputCostPerMillion: "Default: $0.60",
  },
} as const;

export type ModelPricingDefaultRow = Readonly<{
  model: string;
  inputUsdPerMillion: string;
  outputUsdPerMillion: string;
}>;

/** Reference pricing when API `defaults.pricing_table` is empty. */
export const AI_CHATBOT_DEFAULT_PRICING_TABLE: readonly ModelPricingDefaultRow[] = [
  { model: "gpt-4o", inputUsdPerMillion: "2.50", outputUsdPerMillion: "10.00" },
  { model: "gpt-4o-mini", inputUsdPerMillion: "0.15", outputUsdPerMillion: "0.60" },
  { model: "gpt-4-turbo", inputUsdPerMillion: "10.00", outputUsdPerMillion: "30.00" },
  { model: "gpt-4", inputUsdPerMillion: "30.00", outputUsdPerMillion: "60.00" },
  { model: "gpt-3.5-turbo", inputUsdPerMillion: "0.50", outputUsdPerMillion: "1.50" },
  { model: "gpt-o1", inputUsdPerMillion: "15.00", outputUsdPerMillion: "60.00" },
  { model: "gpt-o1-mini", inputUsdPerMillion: "3.00", outputUsdPerMillion: "12.00" },
];
