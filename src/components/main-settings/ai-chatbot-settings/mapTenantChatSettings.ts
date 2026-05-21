import type {
  TenantChatSettingsResponse,
  TenantChatSettingsUpdateRequest,
} from "@utils/chat";

import { AI_CHATBOT_DEFAULT_RATE_LIMITS } from "./constants";
import type {
  AIChatbotModelOption,
  AIChatbotSettingsFormValues,
} from "./types";

export type TenantChatPricingTable = Record<
  string,
  { input: string; output: string }
>;

type RateLimitKey = "user_per_minute";

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

function readEffectiveDefaultUserBudgetUsd(root: Record<string, unknown>): string {
  const overrides = asRecord(root.overrides);
  const fromOverride = readStringValue(overrides?.default_user_budget_usd);
  if (fromOverride) return fromOverride;
  return readStringValue(overrides?.monthly_budget_usd);
}

function readEffectiveMarginPct(root: Record<string, unknown>): string {
  const overrides = asRecord(root.overrides);
  const raw = overrides?.margin_pct;
  if (raw == null) return "";
  return readStringValue(raw);
}

function readEffectiveDefaultBudgetThresholdPct(
  root: Record<string, unknown>,
): string {
  const overrides = asRecord(root.overrides);
  const raw =
    overrides?.default_budget_threshold_pct ?? overrides?.threshold_pct;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(raw);
  }
  return readStringValue(raw);
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
    },
    budget: { defaultUserBudgetUsd: "", defaultBudgetThresholdPct: "" },
    openAiModel: "",
    pricing: { inputCostPerMillion: "", outputCostPerMillion: "" },
    marginPct: "",
  };

  const pricingTable = mapTenantChatSettingsPricingTable(data);
  const modelName = readEffectiveModelName(root);
  const pricing = readPricingForModel(root, modelName, pricingTable);

  return {
    rateLimits: {
      perUserPerMinute: String(readEffectiveLimit(root, "user_per_minute")),
    },
    budget: {
      defaultUserBudgetUsd: readEffectiveDefaultUserBudgetUsd(root),
      defaultBudgetThresholdPct: readEffectiveDefaultBudgetThresholdPct(root),
    },
    openAiModel: modelName,
    pricing: {
      inputCostPerMillion: pricing.input,
      outputCostPerMillion: pricing.output,
    },
    marginPct: readEffectiveMarginPct(root),
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
  const inputCost = toPayloadString(values.pricing.inputCostPerMillion);
  const outputCost = toPayloadString(values.pricing.outputCostPerMillion);
  const defaultUserBudget = toPayloadString(values.budget.defaultUserBudgetUsd);
  const defaultThresholdPct = toPayloadString(
    values.budget.defaultBudgetThresholdPct,
  );
  const marginPct = toPayloadString(values.marginPct);

  validateOptionalNonNegativeInt(userPerMinute, "User per minute");
  validateOptionalNonNegativeNumber(inputCost, "Input cost per million");
  validateOptionalNonNegativeNumber(outputCost, "Output cost per million");
  validateOptionalNonNegativeNumber(defaultUserBudget, "Default user budget");
  validateOptionalThresholdPct(defaultThresholdPct);
  validateOptionalNonNegativeNumber(marginPct, "Cost markup (%)");

  return {
    tenant_id: id,
    user_per_minute: userPerMinute,
    input_cost_per_million: inputCost,
    output_cost_per_million: outputCost,
    model_name: modelName,
    margin_pct: marginPct,
    default_user_budget_usd: defaultUserBudget,
    default_budget_threshold_pct: defaultThresholdPct,
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

/** Raw `overrides.margin_pct` from GET settings (`null` = no markup). */
export function mapTenantChatSettingsMarginPct(
  data: TenantChatSettingsResponse | null | undefined,
): string | null {
  const root = asRecord(normalizeTenantChatSettingsPayload(data));
  if (!root) return null;

  const overrides = asRecord(root.overrides);
  const raw = overrides?.margin_pct;
  if (raw == null) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed || null;
  }
  return null;
}

/** User-facing label for tenant LLM cost markup. */
export function formatTenantMarginPctDisplay(
  marginPct: string | null | undefined,
): string {
  if (marginPct == null || !marginPct.trim()) {
    return "No markup (base cost)";
  }
  const value = Number.parseFloat(marginPct.trim());
  if (!Number.isFinite(value)) {
    return marginPct.trim();
  }
  return `+${value}%`;
}

