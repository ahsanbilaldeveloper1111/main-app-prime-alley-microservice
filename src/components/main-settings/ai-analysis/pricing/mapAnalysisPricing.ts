import type {
  AnalysisCostPricingResponse,
  AnalysisCostPricingUpdateRequest,
} from "@utils/aiAnalytics";

import type { AnalysisPricingFormValues } from "./types";
import { defaultAnalysisPricingFormValues } from "./types";

const TOKENS_PER_MILLION = 1_000_000;

function numberToInputString(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  return String(value);
}

function perTokenToPerMillionInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  return String(value * TOKENS_PER_MILLION);
}

function parseOptionalFloat(raw: string, label: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid non-negative number.`);
  }
  return value;
}

function parsePerMillionToPerToken(raw: string, label: string): number | undefined {
  const perMillion = parseOptionalFloat(raw, label);
  if (perMillion === undefined) {
    return undefined;
  }
  return perMillion / TOKENS_PER_MILLION;
}

export function mapAnalysisPricingToFormValues(
  data: AnalysisCostPricingResponse | null | undefined,
): AnalysisPricingFormValues {
  if (!data) {
    return defaultAnalysisPricingFormValues();
  }
  return {
    costPerCallUsd: numberToInputString(data.cost_per_call_usd),
    costPer1MInputTokensUsd: perTokenToPerMillionInput(data.cost_per_input_token_usd),
    costPer1MOutputTokensUsd: perTokenToPerMillionInput(
      data.cost_per_output_token_usd,
    ),
    currency: data.currency?.trim() || "USD",
    notes: data.notes?.trim() ?? "",
  };
}

export function mapFormValuesToAnalysisPricingUpdate(
  values: AnalysisPricingFormValues,
): AnalysisCostPricingUpdateRequest {
  const currency = values.currency.trim();
  const notes = values.notes.trim();

  return {
    cost_per_call_usd: parseOptionalFloat(values.costPerCallUsd, "$ per call"),
    cost_per_input_token_usd: parsePerMillionToPerToken(
      values.costPer1MInputTokensUsd,
      "$ per 1M input tokens",
    ),
    cost_per_output_token_usd: parsePerMillionToPerToken(
      values.costPer1MOutputTokensUsd,
      "$ per 1M output tokens",
    ),
    ...(currency ? { currency } : {}),
    ...(notes ? { notes } : {}),
  };
}

export function validateAnalysisPricingForm(
  values: AnalysisPricingFormValues,
): string | null {
  try {
    mapFormValuesToAnalysisPricingUpdate(values);
    return null;
  } catch (error: unknown) {
    return error instanceof Error ? error.message : "Invalid pricing values.";
  }
}
