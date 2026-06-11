export type AnalysisTenantFormValues = {
  tenantId: string;
  name: string;
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
  name = "",
): AnalysisTenantFormValues {
  return {
    tenantId,
    name,
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
