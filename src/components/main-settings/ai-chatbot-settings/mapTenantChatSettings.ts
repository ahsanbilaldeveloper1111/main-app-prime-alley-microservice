import type {
  TenantChatSettingsResponse,
  TenantChatSettingsUpdateRequest,
} from "@utils/chat";

import { AI_CHATBOT_DEFAULT_RATE_LIMITS } from "./constants";
import type {
  AIChatbotModelOption,
  AIChatbotSettingsBudgetView,
  AIChatbotSettingsFormValues,
} from "./types";

export type TenantChatPricingTable = Record<
  string,
  { input: string; output: string }
>;

type RateLimitKey =
  | "user_per_minute"
  | "user_per_day"
  | "tenant_per_minute"
  | "tenant_per_day";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function isTenantChatSettingsShape(
  value: unknown,
): value is TenantChatSettingsResponse {
  const record = asRecord(value);
  if (!record) {
    return false;
  }
  return (
    "defaults" in record ||
    "overrides" in record ||
    "budget" in record ||
    "rate_limits" in record
  );
}

export function normalizeTenantChatSettingsPayload(
  raw: unknown,
): TenantChatSettingsResponse | null {
  const payload = asRecord(raw);
  if (!payload) return null;

  if (isTenantChatSettingsShape(payload.data)) {
    return payload.data;
  }

  if (isTenantChatSettingsShape(payload)) {
    return payload;
  }

  return null;
}

function parseLimitValue(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readStringValue(raw: unknown): string {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return "";
}

function readEffectiveLimit(
  root: Record<string, unknown>,
  key: RateLimitKey,
): number {
  const overrides = asRecord(root.overrides);
  const fromOverride = parseLimitValue(overrides?.[key]);
  if (fromOverride != null) return fromOverride;

  const defaults = asRecord(root.defaults);
  const rateLimits = asRecord(defaults?.rate_limits);
  const fromDefaults = parseLimitValue(rateLimits?.[key]);
  if (fromDefaults != null) return fromDefaults;

  return AI_CHATBOT_DEFAULT_RATE_LIMITS[key];
}

function readEffectiveModelName(root: Record<string, unknown>): string {
  const overrides = asRecord(root.overrides);
  const fromOverride = readStringValue(overrides?.model_name);
  if (fromOverride) return fromOverride;

  const defaults = asRecord(root.defaults);
  return (
    readStringValue(defaults?.pricing_default_model) ||
    readStringValue(root.openai_model) ||
    readStringValue(root.model) ||
    ""
  );
}

function readEffectiveMonthlyBudgetUsd(root: Record<string, unknown>): string {
  const overrides = asRecord(root.overrides);
  const fromOverride = readStringValue(overrides?.monthly_budget_usd);
  if (fromOverride) return fromOverride;

  const budget = asRecord(root.budget);
  if (budget?.is_unlimited === true) return "";
  return readStringValue(budget?.budget);
}

function readEffectiveThresholdPct(root: Record<string, unknown>): string {
  const overrides = asRecord(root.overrides);
  if (typeof overrides?.threshold_pct === "number" && Number.isFinite(overrides.threshold_pct)) {
    return String(overrides.threshold_pct);
  }

  const budget = asRecord(root.budget);
  if (typeof budget?.threshold_pct === "number" && Number.isFinite(budget.threshold_pct)) {
    return String(budget.threshold_pct);
  }

  return "";
}

export function mapTenantChatSettingsPricingTable(
  data: TenantChatSettingsResponse | null | undefined,
): TenantChatPricingTable {
  const root = asRecord(normalizeTenantChatSettingsPayload(data));
  if (!root) return {};

  const defaults = asRecord(root.defaults);
  const table = asRecord(defaults?.pricing_table);
  if (!table) return {};

  const result: TenantChatPricingTable = {};
  for (const [model, row] of Object.entries(table)) {
    const pricing = asRecord(row);
    if (!pricing) continue;
    const input = readStringValue(pricing.input);
    const output = readStringValue(pricing.output);
    if (!input && !output) continue;
    result[model] = { input, output };
  }
  return result;
}

function readPricingForModel(
  root: Record<string, unknown>,
  modelName: string,
  pricingTable: TenantChatPricingTable,
): { input: string; output: string } {
  const overrides = asRecord(root.overrides);
  const overrideInput = readStringValue(overrides?.input_cost_per_million);
  const overrideOutput = readStringValue(overrides?.output_cost_per_million);
  if (overrideInput || overrideOutput) {
    return {
      input: overrideInput,
      output: overrideOutput,
    };
  }

  const fromTable = pricingTable[modelName];
  if (fromTable) return fromTable;

  const defaults = asRecord(root.defaults);
  const pricing = asRecord(defaults?.pricing);
  return {
    input: readStringValue(pricing?.input_cost_per_million),
    output: readStringValue(pricing?.output_cost_per_million),
  };
}

export function mapTenantChatSettingsModelOptions(
  data: TenantChatSettingsResponse | null | undefined,
): AIChatbotModelOption[] {
  const root = asRecord(normalizeTenantChatSettingsPayload(data));
  if (!root) return [];

  const defaults = asRecord(root.defaults);
  const fromList = defaults?.available_models;
  const seen = new Set<string>();
  const options: AIChatbotModelOption[] = [];

  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    options.push({ value: trimmed, label: trimmed });
  };

  if (Array.isArray(fromList)) {
    for (const entry of fromList) {
      if (typeof entry === "string") add(entry);
    }
  }

  if (options.length === 0) {
    for (const model of Object.keys(mapTenantChatSettingsPricingTable(data))) {
      add(model);
    }
  }

  const selected = readEffectiveModelName(root);
  if (selected) add(selected);

  return options;
}

export function mapTenantChatSettingsToFormValues(
  data: TenantChatSettingsResponse | null | undefined,
): AIChatbotSettingsFormValues {
  const root = asRecord(normalizeTenantChatSettingsPayload(data));
  if (!root) return {
    rateLimits: {
      perUserPerMinute: String(AI_CHATBOT_DEFAULT_RATE_LIMITS.user_per_minute),
      perUserPerDay: String(AI_CHATBOT_DEFAULT_RATE_LIMITS.user_per_day),
      perTenantPerMinute: String(
        AI_CHATBOT_DEFAULT_RATE_LIMITS.tenant_per_minute,
      ),
      perTenantPerDay: String(AI_CHATBOT_DEFAULT_RATE_LIMITS.tenant_per_day),
    },
    budget: { monthlyBudgetUsd: "", alertThresholdPct: "" },
    openAiModel: "",
    pricing: { inputCostPerMillion: "", outputCostPerMillion: "" },
  };

  const pricingTable = mapTenantChatSettingsPricingTable(data);
  const modelName = readEffectiveModelName(root);
  const pricing = readPricingForModel(root, modelName, pricingTable);

  return {
    rateLimits: {
      perUserPerMinute: String(readEffectiveLimit(root, "user_per_minute")),
      perUserPerDay: String(readEffectiveLimit(root, "user_per_day")),
      perTenantPerMinute: String(readEffectiveLimit(root, "tenant_per_minute")),
      perTenantPerDay: String(readEffectiveLimit(root, "tenant_per_day")),
    },
    budget: {
      monthlyBudgetUsd: readEffectiveMonthlyBudgetUsd(root),
      alertThresholdPct: readEffectiveThresholdPct(root),
    },
    openAiModel: modelName,
    pricing: {
      inputCostPerMillion: pricing.input,
      outputCostPerMillion: pricing.output,
    },
  };
}

export function resolvePricingForModel(
  data: TenantChatSettingsResponse | null | undefined,
  modelName: string,
): { inputCostPerMillion: string; outputCostPerMillion: string } {
  const root = asRecord(normalizeTenantChatSettingsPayload(data));
  if (!root) {
    return { inputCostPerMillion: "", outputCostPerMillion: "" };
  }
  const pricing = readPricingForModel(
    root,
    modelName.trim(),
    mapTenantChatSettingsPricingTable(data),
  );
  return {
    inputCostPerMillion: pricing.input,
    outputCostPerMillion: pricing.output,
  };
}

function toPayloadString(raw: string): string {
  return raw.trim();
}

function validateOptionalNonNegativeInt(raw: string, label: string): void {
  const trimmed = raw.trim();
  if (!trimmed) return;
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid non-negative integer.`);
  }
}

function validateOptionalNonNegativeNumber(raw: string, label: string): void {
  const trimmed = raw.trim();
  if (!trimmed) return;
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid non-negative number.`);
  }
}

function validateOptionalThresholdPct(raw: string): void {
  const trimmed = raw.trim();
  if (!trimmed) return;
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Alert threshold (%) must be between 0 and 100.");
  }
}

/** Flat PUT body for `/chat/tenant/settings` (string fields, empty string when unset). */
export function mapFormValuesToTenantSettingsUpdate(
  values: AIChatbotSettingsFormValues,
  tenantId: string,
): TenantChatSettingsUpdateRequest {
  const id = tenantId.trim();
  if (!id) {
    throw new Error("Please select a company first");
  }

  const modelName = values.openAiModel.trim();
  if (!modelName) {
    throw new Error("Please select an OpenAI model.");
  }

  const userPerMinute = toPayloadString(values.rateLimits.perUserPerMinute);
  const userPerDay = toPayloadString(values.rateLimits.perUserPerDay);
  const tenantPerMinute = toPayloadString(values.rateLimits.perTenantPerMinute);
  const tenantPerDay = toPayloadString(values.rateLimits.perTenantPerDay);
  const inputCost = toPayloadString(values.pricing.inputCostPerMillion);
  const outputCost = toPayloadString(values.pricing.outputCostPerMillion);
  const monthlyBudget = toPayloadString(values.budget.monthlyBudgetUsd);
  const thresholdPct = toPayloadString(values.budget.alertThresholdPct);

  validateOptionalNonNegativeInt(userPerMinute, "User per minute");
  validateOptionalNonNegativeInt(userPerDay, "User per day");
  validateOptionalNonNegativeInt(tenantPerMinute, "Tenant per minute");
  validateOptionalNonNegativeInt(tenantPerDay, "Tenant per day");
  validateOptionalNonNegativeNumber(inputCost, "Input cost per million");
  validateOptionalNonNegativeNumber(outputCost, "Output cost per million");
  validateOptionalNonNegativeNumber(monthlyBudget, "Monthly budget");
  validateOptionalThresholdPct(thresholdPct);

  return {
    tenant_id: id,
    user_per_minute: userPerMinute,
    user_per_day: userPerDay,
    tenant_per_minute: tenantPerMinute,
    tenant_per_day: tenantPerDay,
    input_cost_per_million: inputCost,
    output_cost_per_million: outputCost,
    monthly_budget_usd: monthlyBudget,
    threshold_pct: thresholdPct,
    model_name: modelName,
  };
}

export function validateAIChatbotSettingsForm(
  values: AIChatbotSettingsFormValues,
  tenantId: string,
): string | null {
  try {
    mapFormValuesToTenantSettingsUpdate(values, tenantId);
    return null;
  } catch (error: unknown) {
    return error instanceof Error ? error.message : "Invalid settings.";
  }
}

export function mapTenantChatSettingsBudget(
  data: TenantChatSettingsResponse | null | undefined,
): AIChatbotSettingsBudgetView | null {
  const root = normalizeTenantChatSettingsPayload(data);
  const budget = root?.budget;
  if (!budget) return null;

  return {
    spend: budget.spend ?? "0",
    budget: budget.budget,
    usedPct: budget.used_pct ?? 0,
    isUnlimited: Boolean(budget.is_unlimited),
    isExhausted: Boolean(budget.is_exhausted),
    thresholdPct: budget.threshold_pct ?? 0,
    resetsOn: budget.resets_on ?? "",
  };
}
