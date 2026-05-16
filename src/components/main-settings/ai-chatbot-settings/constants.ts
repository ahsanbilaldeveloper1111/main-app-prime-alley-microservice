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
    monthlyBudgetUsd: "50.0 (blank = unlimited)",
    alertThresholdPct: "Default: 80",
  },
  pricing: {
    inputCostPerMillion: "Default: $0.15",
    outputCostPerMillion: "Default: $0.60",
  },
} as const;
