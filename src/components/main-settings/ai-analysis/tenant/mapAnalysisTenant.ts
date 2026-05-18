import type {
  AnalysisTenantRecord,
  AnalysisTenantUpdateRequest,
} from "@utils/aiAnalytics";

import type { AnalysisTenantFormValues } from "./types";
import { defaultAnalysisTenantFormValues } from "./types";

const TOKENS_PER_MILLION = 1_000_000;
const OMIT = Symbol("omit");

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

function numbersEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-12;
}

function resolveOptionalString(
  raw: string,
  original: string | null,
): string | typeof OMIT {
  const trimmed = raw.trim();
  const originalTrimmed = original?.trim() ?? "";
  if (trimmed === originalTrimmed) {
    return OMIT;
  }
  return trimmed;
}

function resolveOptionalFloat(
  raw: string,
  original: number,
  label: string,
): number | typeof OMIT {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid non-negative number.`);
  }
  if (numbersEqual(value, original)) {
    return OMIT;
  }
  return value;
}

function resolveNullableInt(
  raw: string,
  original: number | null,
  label: string,
): number | null | typeof OMIT {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (original == null) {
      return OMIT;
    }
    return null;
  }
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid non-negative whole number.`);
  }
  if (original != null && value === original) {
    return OMIT;
  }
  return value;
}

function resolveAlertThresholdPct(
  raw: string,
  original: number,
): number | typeof OMIT {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (original === 0) {
      return OMIT;
    }
    throw new Error("Alert threshold % is required.");
  }
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Alert threshold % must be between 0 and 100.");
  }
  if (value === original) {
    return OMIT;
  }
  return value;
}

function resolveTriStateUsd(
  raw: string,
  original: number | null,
  label: string,
): number | null | typeof OMIT {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (original == null) {
      return OMIT;
    }
    return null;
  }
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid non-negative number.`);
  }
  if (original != null && numbersEqual(value, original)) {
    return OMIT;
  }
  return value;
}

function resolveTriStatePerTokenFromPerMillion(
  rawPerMillion: string,
  originalPerToken: number | null,
  label: string,
): number | null | typeof OMIT {
  const trimmed = rawPerMillion.trim();
  if (!trimmed) {
    if (originalPerToken == null) {
      return OMIT;
    }
    return null;
  }
  const perMillion = Number.parseFloat(trimmed);
  if (!Number.isFinite(perMillion) || perMillion < 0) {
    throw new Error(`${label} must be a valid non-negative number.`);
  }
  const perToken = perMillion / TOKENS_PER_MILLION;
  if (originalPerToken != null && numbersEqual(perToken, originalPerToken)) {
    return OMIT;
  }
  return perToken;
}

function assignIfChanged<K extends keyof AnalysisTenantUpdateRequest>(
  payload: AnalysisTenantUpdateRequest,
  key: K,
  value: AnalysisTenantUpdateRequest[K] | typeof OMIT,
): void {
  if (value !== OMIT) {
    payload[key] = value;
  }
}

export function mapAnalysisTenantToFormValues(
  data: AnalysisTenantRecord | null | undefined,
  fallbackTenantId: string,
): AnalysisTenantFormValues {
  if (!data) {
    return defaultAnalysisTenantFormValues(fallbackTenantId);
  }
  return {
    tenantId: data.tenant_id,
    industryType: data.industry_type?.trim() ?? "",
    primaryLanguage: data.primary_language?.trim() ?? "",
    monthlyCallLimit: numberToInputString(data.monthly_call_limit),
    alertThresholdPct: numberToInputString(data.alert_threshold_pct),
    costLimitUsd: numberToInputString(data.cost_limit_usd),
    costPerCallUsd: numberToInputString(data.cost_per_call_usd),
    costPer1MInputTokensUsd: perTokenToPerMillionInput(data.cost_per_input_token_usd),
    costPer1MOutputTokensUsd: perTokenToPerMillionInput(
      data.cost_per_output_token_usd,
    ),
  };
}

export function mapFormValuesToAnalysisTenantUpdate(
  values: AnalysisTenantFormValues,
  original: AnalysisTenantRecord | null,
): AnalysisTenantUpdateRequest {
  const payload: AnalysisTenantUpdateRequest = {};

  assignIfChanged(
    payload,
    "industry_type",
    resolveOptionalString(values.industryType, original?.industry_type ?? null),
  );
  assignIfChanged(
    payload,
    "primary_language",
    resolveOptionalString(
      values.primaryLanguage,
      original?.primary_language ?? null,
    ),
  );
  assignIfChanged(
    payload,
    "monthly_call_limit",
    resolveNullableInt(
      values.monthlyCallLimit,
      original?.monthly_call_limit ?? null,
      "Monthly call limit",
    ),
  );
  assignIfChanged(
    payload,
    "alert_threshold_pct",
    resolveAlertThresholdPct(
      values.alertThresholdPct,
      original?.alert_threshold_pct ?? 0,
    ),
  );
  assignIfChanged(
    payload,
    "cost_limit_usd",
    resolveOptionalFloat(
      values.costLimitUsd,
      original?.cost_limit_usd ?? 0,
      "Cost limit USD",
    ),
  );
  assignIfChanged(
    payload,
    "cost_per_call_usd",
    resolveTriStateUsd(
      values.costPerCallUsd,
      original?.cost_per_call_usd ?? null,
      "$ per call",
    ),
  );
  assignIfChanged(
    payload,
    "cost_per_input_token_usd",
    resolveTriStatePerTokenFromPerMillion(
      values.costPer1MInputTokensUsd,
      original?.cost_per_input_token_usd ?? null,
      "$ per 1M input tokens",
    ),
  );
  assignIfChanged(
    payload,
    "cost_per_output_token_usd",
    resolveTriStatePerTokenFromPerMillion(
      values.costPer1MOutputTokensUsd,
      original?.cost_per_output_token_usd ?? null,
      "$ per 1M output tokens",
    ),
  );

  return payload;
}

export function validateAnalysisTenantForm(
  values: AnalysisTenantFormValues,
  original: AnalysisTenantRecord | null,
): string | null {
  try {
    mapFormValuesToAnalysisTenantUpdate(values, original);
    return null;
  } catch (error: unknown) {
    return error instanceof Error ? error.message : "Invalid tenant values.";
  }
}
