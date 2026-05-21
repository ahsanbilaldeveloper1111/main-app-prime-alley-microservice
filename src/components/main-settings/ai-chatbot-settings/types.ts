import { AI_CHATBOT_DEFAULT_RATE_LIMITS } from "./constants";

export interface AIChatbotRateLimitFields {
  perUserPerMinute: string;
}

export interface AIChatbotPricingFields {
  inputCostPerMillion: string;
  outputCostPerMillion: string;
}

export interface AIChatbotBudgetFields {
  defaultUserBudgetUsd: string;
  defaultBudgetThresholdPct: string;
}

export interface AIChatbotSettingsFormValues {
  rateLimits: AIChatbotRateLimitFields;
  budget: AIChatbotBudgetFields;
  openAiModel: string;
  pricing: AIChatbotPricingFields;
  /** Percent markup on base LLM cost; blank = no markup. */
  marginPct: string;
}

export interface AIChatbotModelOption {
  value: string;
  label: string;
}

export const defaultAIChatbotSettingsFormValues =
  (): AIChatbotSettingsFormValues => ({
    rateLimits: {
      perUserPerMinute: String(AI_CHATBOT_DEFAULT_RATE_LIMITS.user_per_minute),
    },
    budget: {
      defaultUserBudgetUsd: "",
      defaultBudgetThresholdPct: "",
    },
    openAiModel: "",
    pricing: {
      inputCostPerMillion: "",
      outputCostPerMillion: "",
    },
    marginPct: "",
  });
