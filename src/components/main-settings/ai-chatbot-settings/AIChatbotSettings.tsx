import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import { Filter } from "lucide-react";
import Select from "react-select";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import { toast } from "react-toastify";

import "./aiChatbotSettings.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

import type {
  AIChatbotModelOption,
  AIChatbotSettingsBudgetView,
  AIChatbotSettingsFormValues,
} from "./types";
import { defaultAIChatbotSettingsFormValues } from "./types";
import {
  resolvePricingForModel,
  validateAIChatbotSettingsForm,
} from "./mapTenantChatSettings";
import { AI_CHATBOT_FIELD_PLACEHOLDERS } from "./constants";
import {
  AI_CHATBOT_DECIMAL_PLACES,
  formatDecimalInputValue,
} from "./aiChatbotDecimalFormat";
import { AIChatbotSettingsFormSkeleton } from "./AIChatbotSettingsFormSkeleton";
import { ModelPricingDefaultsTable } from "./ModelPricingDefaultsTable";
import { useAIChatbotSettingsPage } from "./useAIChatbotSettingsPage";

type CompanySelectOption = { value: string; label: string };

function CompanyFilterBar(props: Readonly<{
  companiesLoading: boolean;
  companyOptions: CompanySelectOption[];
  selectedCompanyOption: CompanySelectOption | null;
  onCompanySelect: (companyId: string) => void;
  onApplyFilter: () => void;
  appliedCompanyLabel?: string;
}>) {
  const {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    onCompanySelect,
    onApplyFilter,
    appliedCompanyLabel,
  } = props;

  return (
    <div className="ai-chatbot-settings__company-filter">
      <div className="ai-chatbot-settings__company-select">
        <span className="ai-chatbot-settings__field-label">Company</span>
        <Select<CompanySelectOption>
          isLoading={companiesLoading}
          options={companyOptions}
          value={selectedCompanyOption}
          onChange={(opt) => onCompanySelect(opt?.value ?? "")}
          placeholder="Select company..."
          isClearable
          classNamePrefix="ai-chatbot-company"
        />
      </div>
      <Button
        type="button"
        variant="primary"
        className="ai-chatbot-settings__filter-btn"
        onClick={onApplyFilter}
      >
        <Filter size={16} className="me-2" aria-hidden />
        Filter
      </Button>
      {appliedCompanyLabel ? (
        <p className="ai-chatbot-settings__company-active">
          Viewing: <strong>{appliedCompanyLabel}</strong>
        </p>
      ) : null}
    </div>
  );
}

function buildModelSelectOptions(
  apiOptions: AIChatbotModelOption[],
  selectedValue: string,
): AIChatbotModelOption[] {
  const seen = new Set<string>();
  const options: AIChatbotModelOption[] = [];

  const add = (value: string, label: string) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    options.push({ value: trimmed, label });
  };

  for (const opt of apiOptions) {
    add(opt.value, opt.label);
  }

  if (selectedValue.trim()) {
    add(selectedValue, selectedValue);
  }

  return options;
}

function NumberField(props: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  decimalPlaces?: number;
  disabled?: boolean;
}>) {
  const {
    label,
    value,
    onChange,
    placeholder,
    min = 0,
    max,
    step = 1,
    decimalPlaces,
    disabled = false,
  } = props;

  const handleBlur = () => {
    if (decimalPlaces == null || !value.trim()) {
      return;
    }
    onChange(formatDecimalInputValue(value, decimalPlaces));
  };

  return (
    <label className="ai-chatbot-settings__field">
      <span className="ai-chatbot-settings__field-label">{label}</span>
      <input
        type="number"
        className="ai-chatbot-settings__input"
        min={min}
        max={max}
        step={step}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
      />
    </label>
  );
}

function ReadonlyField(props: Readonly<{ label: string; value: string }>) {
  const { label, value } = props;
  return (
    <div className="ai-chatbot-settings__field">
      <span className="ai-chatbot-settings__field-label">{label}</span>
      <p className="ai-chatbot-settings__readonly-value">{value}</p>
    </div>
  );
}

function formatResetsOn(iso: string): string {
  if (!iso.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSpendUsd(spend: string): string {
  const trimmed = spend.trim();
  if (!trimmed) return "—";
  const numeric = Number.parseFloat(trimmed.replace(/^\$/, ""));
  if (Number.isFinite(numeric)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: AI_CHATBOT_DECIMAL_PLACES,
      maximumFractionDigits: AI_CHATBOT_DECIMAL_PLACES,
    }).format(numeric);
  }
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
}

function LiveSpendSection(props: Readonly<{
  budget: AIChatbotSettingsBudgetView | null;
}>) {
  const { budget } = props;
  const spendDisplay = budget ? formatSpendUsd(budget.spend) : "—";
  const resetsDisplay = budget ? formatResetsOn(budget.resetsOn) : "—";

  const usedPct = budget
    ? Math.min(100, Math.max(0, budget.usedPct))
    : 0;
  let barColor = "#059669";
  if (budget?.isExhausted) {
    barColor = "#dc2626";
  } else if (budget && usedPct >= budget.thresholdPct) {
    barColor = "#d97706";
  }

  return (
    <div className="ai-chatbot-settings__section">
      <p className="ai-chatbot-settings__row-label">Live spend (Month-to-date)</p>
      <div className="ai-chatbot-settings__grid-2">
        <ReadonlyField label="Spend" value={spendDisplay} />
        <ReadonlyField label="Reset on" value={resetsDisplay} />
      </div>
      {budget && !budget.isUnlimited && (
        <>
          <p className="ai-chatbot-settings__live-spend-meta">
            <span>{usedPct.toFixed(AI_CHATBOT_DECIMAL_PLACES)}% of monthly cap used</span>
            {budget.isExhausted && (
              <span className="ai-chatbot-settings__live-spend-exhausted">
                · Budget exhausted
              </span>
            )}
          </p>
          <div className="ai-chatbot-settings__progress-track" aria-hidden>
            <div
              style={{
                height: "100%",
                width: `${usedPct}%`,
                background: barColor,
              }}
            />
          </div>
        </>
      )}
      {budget?.isUnlimited && (
        <p className="ai-chatbot-settings__hint">No monthly cap configured.</p>
      )}
    </div>
  );
}

export const AIChatbotSettings: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canEditSettings = hasPermission(PERMISSIONS.EDIT_TENANT_SETTINGS_AI_CHAT);

  const {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    appliedCompanyLabel,
    appliedTenantId,
    handleCompanySelect,
    handleApplyFilter,
    settingsQuery,
    saveMutation,
  } = useAIChatbotSettingsPage();

  const {
    tenantId: queryTenantId,
    dataUpdatedAt,
    formValues: fetchedFormValues,
    budget,
    modelOptions,
    pricingTable,
    rawSettings,
    isLoading,
    isError,
    refetch,
    hasApiData,
  } = settingsQuery;

  const [values, setValues] = useState<AIChatbotSettingsFormValues>(
    defaultAIChatbotSettingsFormValues(),
  );
  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {
    setValues(defaultAIChatbotSettingsFormValues());
    setFormHydrated(false);
  }, [appliedTenantId]);

  useEffect(() => {
    if (!appliedTenantId || queryTenantId !== appliedTenantId || isLoading) {
      return;
    }
    const next = fetchedFormValues ?? defaultAIChatbotSettingsFormValues();
    setValues(next);
    setFormHydrated(true);
  }, [
    appliedTenantId,
    queryTenantId,
    dataUpdatedAt,
    fetchedFormValues,
    isLoading,
  ]);

  const updateRateLimit = useCallback(
    (key: keyof AIChatbotSettingsFormValues["rateLimits"], next: string) => {
      setValues((prev) => ({
        ...prev,
        rateLimits: { ...prev.rateLimits, [key]: next },
      }));
    },
    [],
  );

  const updateBudget = useCallback(
    (key: keyof AIChatbotSettingsFormValues["budget"], next: string) => {
      setValues((prev) => ({
        ...prev,
        budget: { ...prev.budget, [key]: next },
      }));
    },
    [],
  );

  const updatePricing = useCallback(
    (key: keyof AIChatbotSettingsFormValues["pricing"], next: string) => {
      setValues((prev) => ({
        ...prev,
        pricing: { ...prev.pricing, [key]: next },
      }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!canEditSettings) {
      toast.error("You do not have permission to edit tenant settings.");
      return;
    }
    const validationError = validateAIChatbotSettingsForm(values, appliedTenantId);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    saveMutation.mutate(values);
  }, [appliedTenantId, canEditSettings, saveMutation, values]);

  const isSaving = saveMutation.isPending;
  const fieldsDisabled =
    isLoading || !formHydrated || isSaving || !canEditSettings;

  const modelSelectOptions = useMemo(
    () => buildModelSelectOptions(modelOptions, values.openAiModel),
    [modelOptions, values.openAiModel],
  );

  const showFormSkeleton =
    Boolean(appliedTenantId) &&
    (isLoading || !formHydrated || queryTenantId !== appliedTenantId);

  if (!appliedTenantId) {
    return (
      <div className="ai-chatbot-settings">
        <CompanyFilterBar
          companiesLoading={companiesLoading}
          companyOptions={companyOptions}
          selectedCompanyOption={selectedCompanyOption}
          onCompanySelect={handleCompanySelect}
          onApplyFilter={handleApplyFilter}
        />
        <p className="ai-chatbot-settings__hint">Select a company to load settings.</p>
      </div>
    );
  }

  return (
    <form
      key={appliedTenantId}
      className="ai-chatbot-settings"
      onSubmit={(e) => e.preventDefault()}
    >
      <CompanyFilterBar
        companiesLoading={companiesLoading}
        companyOptions={companyOptions}
        selectedCompanyOption={selectedCompanyOption}
        onCompanySelect={handleCompanySelect}
        onApplyFilter={handleApplyFilter}
        appliedCompanyLabel={appliedCompanyLabel}
      />

      {showFormSkeleton ? (
        <AIChatbotSettingsFormSkeleton />
      ) : (
        <>
      {isError && (
        <p className="ai-chatbot-settings__status">
          Could not load settings. Using defaults.{" "}
          <button
            type="button"
            className="ai-chatbot-settings__retry"
            onClick={() => {
              refetch().catch(() => undefined);
            }}
          >
            Retry
          </button>
        </p>
      )}

      {!isError && !hasApiData && formHydrated && (
        <p className="ai-chatbot-settings__hint">
          No settings returned — using built-in defaults.
        </p>
      )}

      <div className="ai-chatbot-settings__section">
        <p className="ai-chatbot-settings__row-label">Rate limits</p>
        <div className="ai-chatbot-settings__grid-4">
          <NumberField
            label="User / min"
            value={values.rateLimits.perUserPerMinute}
            onChange={(v) => updateRateLimit("perUserPerMinute", v)}
            placeholder={AI_CHATBOT_FIELD_PLACEHOLDERS.rateLimits.perUserPerMinute}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="User / day"
            value={values.rateLimits.perUserPerDay}
            onChange={(v) => updateRateLimit("perUserPerDay", v)}
            placeholder={AI_CHATBOT_FIELD_PLACEHOLDERS.rateLimits.perUserPerDay}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="Tenant / min"
            value={values.rateLimits.perTenantPerMinute}
            onChange={(v) => updateRateLimit("perTenantPerMinute", v)}
            placeholder={
              AI_CHATBOT_FIELD_PLACEHOLDERS.rateLimits.perTenantPerMinute
            }
            disabled={fieldsDisabled}
          />
          <NumberField
            label="Tenant / day"
            value={values.rateLimits.perTenantPerDay}
            onChange={(v) => updateRateLimit("perTenantPerDay", v)}
            placeholder={AI_CHATBOT_FIELD_PLACEHOLDERS.rateLimits.perTenantPerDay}
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      <div className="ai-chatbot-settings__section">
        <p className="ai-chatbot-settings__row-label">Budget (USD)</p>
        <div className="ai-chatbot-settings__grid-2">
          <NumberField
            label="Monthly Budget (USD)"
            value={values.budget.monthlyBudgetUsd}
            onChange={(v) => updateBudget("monthlyBudgetUsd", v)}
            placeholder={AI_CHATBOT_FIELD_PLACEHOLDERS.budget.monthlyBudgetUsd}
            step="0.01"
            decimalPlaces={AI_CHATBOT_DECIMAL_PLACES}
            min={0}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="Alert threshold (%)"
            value={values.budget.alertThresholdPct}
            onChange={(v) => updateBudget("alertThresholdPct", v)}
            placeholder={AI_CHATBOT_FIELD_PLACEHOLDERS.budget.alertThresholdPct}
            min={0}
            max={100}
            step="0.01"
            decimalPlaces={AI_CHATBOT_DECIMAL_PLACES}
            disabled={fieldsDisabled}
          />
        </div>
        <p className="ai-chatbot-settings__hint">
          Alert threshold triggers when spend reaches this percentage of the
          monthly cap.
        </p>
      </div>

      <LiveSpendSection budget={budget} />

      <div className="ai-chatbot-settings__section">
        <p className="ai-chatbot-settings__row-label">Model & pricing</p>
        <div className="ai-chatbot-settings__grid-3">
          <label className="ai-chatbot-settings__field">
            <span className="ai-chatbot-settings__field-label">OpenAI model</span>
            <select
              className="ai-chatbot-settings__select"
              value={values.openAiModel}
              disabled={fieldsDisabled}
              onChange={(e) => {
                const model = e.target.value;
                const pricing = model
                  ? resolvePricingForModel(rawSettings, model)
                  : null;
                setValues((prev) => ({
                  ...prev,
                  openAiModel: model,
                  pricing: pricing
                    ? {
                        inputCostPerMillion: pricing.inputCostPerMillion,
                        outputCostPerMillion: pricing.outputCostPerMillion,
                      }
                    : prev.pricing,
                }));
              }}
            >
              <option value="">Select model…</option>
              {modelSelectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="Input $ / 1M tokens"
            value={values.pricing.inputCostPerMillion}
            onChange={(v) => updatePricing("inputCostPerMillion", v)}
            placeholder={AI_CHATBOT_FIELD_PLACEHOLDERS.pricing.inputCostPerMillion}
            step="0.01"
            decimalPlaces={AI_CHATBOT_DECIMAL_PLACES}
            min={0}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="Output $ / 1M tokens"
            value={values.pricing.outputCostPerMillion}
            onChange={(v) => updatePricing("outputCostPerMillion", v)}
            placeholder={AI_CHATBOT_FIELD_PLACEHOLDERS.pricing.outputCostPerMillion}
            step="0.01"
            decimalPlaces={AI_CHATBOT_DECIMAL_PLACES}
            min={0}
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      <ModelPricingDefaultsTable pricingTable={pricingTable} />

      {canEditSettings ? (
        <button
          type="button"
          className="ai-chatbot-settings__save"
          onClick={handleSave}
          disabled={isSaving || fieldsDisabled}
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      ) : (
        <p className="ai-chatbot-settings__hint">
          You have view-only access to tenant settings.
        </p>
      )}
        </>
      )}
    </form>
  );
};
