import type {
  TenantChatSettingsResponse,
  TenantChatSettingsUpdateRequest,
} from "@utils/chat";

import {
  formatDecimalInputValue,
  readDecimalStringValue,
} from "./aiChatbotDecimalFormat";
import { AI_CHATBOT_DEFAULT_RATE_LIMITS } from "./constants";
import type {
  AIChatbotModelOption,
  AIChatbotSettingsFormValues,
} from "./types";

export type TenantChatPricingTable = Record<
  string,
  { input: string; output: string }
>;

type RateLimitKey = "user_per_minute" | "user_per_day";

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

/** Effective per-user caps from tenant chat settings (for assistant UI fallback). */
export function getEffectiveUserRateLimitsFromSettings(
  data: TenantChatSettingsResponse | null | undefined,
): { perMinuteLimit: number; perDayLimit: number } {
  const root = asRecord(normalizeTenantChatSettingsPayload(data));
  if (!root) {
    return {
      perMinuteLimit: AI_CHATBOT_DEFAULT_RATE_LIMITS.user_per_minute,
      perDayLimit: AI_CHATBOT_DEFAULT_RATE_LIMITS.user_per_day,
    };
  }
  return {
    perMinuteLimit: readEffectiveLimit(root, "user_per_minute"),
    perDayLimit: readEffectiveLimit(root, "user_per_day"),
  };
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
    const input = readDecimalStringValue(pricing.input);
    const output = readDecimalStringValue(pricing.output);
    if (!input && !output) continue;
    result[model] = { input, output };
  }
  return result;
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
    marginPct: "",
  };

  const modelName = readEffectiveModelName(root);

  return {
    rateLimits: {
      perUserPerMinute: String(readEffectiveLimit(root, "user_per_minute")),
    },
    budget: {
      defaultUserBudgetUsd: readEffectiveDefaultUserBudgetUsd(root),
      defaultBudgetThresholdPct: readEffectiveDefaultBudgetThresholdPct(root),
    },
    openAiModel: modelName,
    marginPct: readEffectiveMarginPct(root),
  };
}

function toPayloadString(raw: string): string {
  return raw.trim();
}

function toPayloadDecimalString(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return formatDecimalInputValue(trimmed);
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
  const defaultUserBudget = toPayloadString(values.budget.defaultUserBudgetUsd);
  const defaultThresholdPct = toPayloadString(
    values.budget.defaultBudgetThresholdPct,
  );
  const marginPct = toPayloadString(values.marginPct);

  validateOptionalNonNegativeInt(userPerMinute, "User per minute");
  validateOptionalNonNegativeNumber(defaultUserBudget, "Default per user budget");
  validateOptionalThresholdPct(defaultThresholdPct);
  validateOptionalNonNegativeNumber(marginPct, "Cost margin (%)");

  return {
    tenant_id: id,
    user_per_minute: userPerMinute,
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

/** User-facing label for tenant LLM cost margin. */
export function formatTenantMarginPctDisplay(
  marginPct: string | null | undefined,
): string {
  if (!marginPct?.trim()) {
    return "No margin (base cost)";
  }
  const value = Number.parseFloat(marginPct.trim());
  if (!Number.isFinite(value)) {
    return marginPct.trim();
  }
  return `+${value}%`;
}

