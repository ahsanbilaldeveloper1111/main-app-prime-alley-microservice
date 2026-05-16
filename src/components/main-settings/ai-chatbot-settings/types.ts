import { AI_CHATBOT_DEFAULT_RATE_LIMITS } from "./constants";

export interface AIChatbotRateLimitFields {
  perUserPerMinute: string;
  perUserPerDay: string;
  perTenantPerMinute: string;
  perTenantPerDay: string;
}

export interface AIChatbotPricingFields {
  inputCostPerMillion: string;
  outputCostPerMillion: string;
}

export interface AIChatbotBudgetFields {
  monthlyBudgetUsd: string;
  alertThresholdPct: string;
}

export interface AIChatbotSettingsFormValues {
  rateLimits: AIChatbotRateLimitFields;
  budget: AIChatbotBudgetFields;
  openAiModel: string;
  pricing: AIChatbotPricingFields;
}

export interface AIChatbotModelOption {
  value: string;
  label: string;
}

export interface AIChatbotSettingsBudgetView {
  spend: string;
  budget: string | null;
  usedPct: number;
  isUnlimited: boolean;
  isExhausted: boolean;
  thresholdPct: number;
  resetsOn: string;
}

export const defaultAIChatbotSettingsFormValues =
  (): AIChatbotSettingsFormValues => ({
    rateLimits: {
      perUserPerMinute: String(AI_CHATBOT_DEFAULT_RATE_LIMITS.user_per_minute),
      perUserPerDay: String(AI_CHATBOT_DEFAULT_RATE_LIMITS.user_per_day),
      perTenantPerMinute: String(
        AI_CHATBOT_DEFAULT_RATE_LIMITS.tenant_per_minute,
      ),
      perTenantPerDay: String(AI_CHATBOT_DEFAULT_RATE_LIMITS.tenant_per_day),
    },
    budget: {
      monthlyBudgetUsd: "",
      alertThresholdPct: "",
    },
    openAiModel: "",
    pricing: {
      inputCostPerMillion: "",
      outputCostPerMillion: "",
    },
  });
