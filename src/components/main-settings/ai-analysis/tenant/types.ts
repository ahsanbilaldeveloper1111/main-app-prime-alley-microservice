export type AnalysisTenantFormValues = {
  tenantId: string;
  industryType: string;
  primaryLanguage: string;
  monthlyCallLimit: string;
  alertThresholdPct: string;
  costLimitUsd: string;
  costPerCallUsd: string;
  costPer1MInputTokensUsd: string;
  costPer1MOutputTokensUsd: string;
};

export function defaultAnalysisTenantFormValues(
  tenantId = "",
): AnalysisTenantFormValues {
  return {
    tenantId,
    industryType: "",
    primaryLanguage: "",
    monthlyCallLimit: "",
    alertThresholdPct: "",
    costLimitUsd: "",
    costPerCallUsd: "",
    costPer1MInputTokensUsd: "",
    costPer1MOutputTokensUsd: "",
  };
}
