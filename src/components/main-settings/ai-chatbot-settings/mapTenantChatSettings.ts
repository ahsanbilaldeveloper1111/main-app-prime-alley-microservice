import type { TenantChatSettingsResponse } from "@utils/chat";

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

function parseNonNegativeInt(raw: string, label: string): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid non-negative integer.`);
  }
  return value;
}

function parseOptionalCostString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Pricing values must be valid non-negative numbers.");
  }
  return trimmed;
}

/** Body for PUT `/chat/tenant/settings` — tenant overrides only. */
export function mapFormValuesToTenantSettingsUpdate(
  values: AIChatbotSettingsFormValues,
): { overrides: NonNullable<TenantChatSettingsResponse["overrides"]> } {
  const modelName = values.openAiModel.trim();
  if (!modelName) {
    throw new Error("Please select an OpenAI model.");
  }

  return {
    overrides: {
      user_per_minute: parseNonNegativeInt(
        values.rateLimits.perUserPerMinute,
        "User per minute",
      ),
      user_per_day: parseNonNegativeInt(
        values.rateLimits.perUserPerDay,
        "User per day",
      ),
      tenant_per_minute: parseNonNegativeInt(
        values.rateLimits.perTenantPerMinute,
        "Tenant per minute",
      ),
      tenant_per_day: parseNonNegativeInt(
        values.rateLimits.perTenantPerDay,
        "Tenant per day",
      ),
      model_name: modelName,
      input_cost_per_million: parseOptionalCostString(
        values.pricing.inputCostPerMillion,
      ),
      output_cost_per_million: parseOptionalCostString(
        values.pricing.outputCostPerMillion,
      ),
    },
  };
}

export function validateAIChatbotSettingsForm(
  values: AIChatbotSettingsFormValues,
): string | null {
  try {
    mapFormValuesToTenantSettingsUpdate(values);
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
