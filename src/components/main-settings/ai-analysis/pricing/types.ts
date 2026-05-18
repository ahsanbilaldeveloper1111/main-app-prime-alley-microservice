export type AnalysisPricingFormValues = Readonly<{
  costPerCallUsd: string;
  costPer1MInputTokensUsd: string;
  costPer1MOutputTokensUsd: string;
  currency: string;
  notes: string;
}>;

export const defaultAnalysisPricingFormValues = (): AnalysisPricingFormValues => ({
  costPerCallUsd: "",
  costPer1MInputTokensUsd: "",
  costPer1MOutputTokensUsd: "",
  currency: "USD",
  notes: "",
});
