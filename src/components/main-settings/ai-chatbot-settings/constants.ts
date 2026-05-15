/** Applied when GET `/chat/tenant/settings` returns no data or omits rate limits. */
export const AI_CHATBOT_DEFAULT_RATE_LIMITS = {
  user_per_minute: 20,
  user_per_day: 500,
  tenant_per_minute: 400,
  tenant_per_day: 20_000,
} as const;
