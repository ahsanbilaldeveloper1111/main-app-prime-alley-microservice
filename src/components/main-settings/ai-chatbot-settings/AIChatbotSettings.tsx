import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

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
import { useChatTenantSettingsQuery } from "./useChatTenantSettingsQuery";
import { useUpdateChatTenantSettingsMutation } from "./useUpdateChatTenantSettingsMutation";

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

const SECTION_GAP = "1.5rem";

const formStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: SECTION_GAP,
};

const rowLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  margin: 0,
  lineHeight: 1.2,
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "2px",
  fontSize: "12px",
  fontWeight: 500,
  color: "#374151",
  lineHeight: 1.2,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "4px 8px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  fontSize: "13px",
  outline: "none",
  lineHeight: 1.35,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#fff",
};

const gridFourColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px 12px",
};

const gridThreeColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 1fr) repeat(2, minmax(0, 1fr))",
  gap: "8px 12px",
  alignItems: "end",
};

const formSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const saveButtonStyle: React.CSSProperties = {
  border: "1px solid #111827",
  background: "#111827",
  color: "#ffffff",
  borderRadius: "4px",
  padding: "5px 14px",
  fontSize: "13px",
  cursor: "pointer",
  alignSelf: "flex-start",
};

const hintTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#6b7280",
  lineHeight: 1.35,
};

const statusTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  lineHeight: 1.35,
  color: "#991b1b",
};

const budgetRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 14px",
  alignItems: "baseline",
  fontSize: "12px",
  color: "#374151",
  margin: 0,
  lineHeight: 1.35,
};

const budgetStrongStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#111827",
};

const progressTrackStyle: React.CSSProperties = {
  height: "4px",
  borderRadius: "2px",
  background: "#e5e7eb",
  overflow: "hidden",
};

function NumberField(props: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  step?: number | string;
  disabled?: boolean;
}>) {
  const { label, value, onChange, min = 0, step = 1, disabled = false } = props;
  return (
    <label style={{ margin: 0 }}>
      <span style={fieldLabelStyle}>{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
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

function BudgetLine(props: Readonly<{ budget: AIChatbotSettingsBudgetView }>) {
  const { budget } = props;
  const usedPct = Math.min(100, Math.max(0, budget.usedPct));
  let barColor = "#059669";
  if (budget.isExhausted) {
    barColor = "#dc2626";
  } else if (usedPct >= budget.thresholdPct) {
    barColor = "#d97706";
  }

  let budgetLabel = "—";
  if (budget.isUnlimited) {
    budgetLabel = "Unlimited";
  } else if (budget.budget != null) {
    budgetLabel = `$${budget.budget}`;
  }

  return (
    <div style={formSectionStyle}>
      <p style={budgetRowStyle}>
        <span style={rowLabelStyle}>Budget:</span>{" "}
        MTD <span style={budgetStrongStyle}>${budget.spend}</span>
        {" · "}
        Cap <span style={budgetStrongStyle}>{budgetLabel}</span>
        {" · "}
        Used <span style={budgetStrongStyle}>{usedPct.toFixed(1)}%</span>
        {" · "}
        Resets <span style={budgetStrongStyle}>{formatResetsOn(budget.resetsOn)}</span>
        {budget.isExhausted && (
          <>
            {" · "}
            <span style={{ color: "#dc2626", fontWeight: 600 }}>Exhausted</span>
          </>
        )}
      </p>
      {!budget.isUnlimited && (
        <div style={progressTrackStyle} aria-hidden>
          <div
            style={{
              height: "100%",
              width: `${usedPct}%`,
              background: barColor,
            }}
          />
        </div>
      )}
    </div>
  );
}

export const AIChatbotSettings: React.FC = () => {
  const {
    formValues: fetchedFormValues,
    budget,
    modelOptions,
    rawSettings,
    isLoading,
    isError,
    refetch,
    isFetching,
    hasApiData,
  } = useChatTenantSettingsQuery();

  const [values, setValues] = useState<AIChatbotSettingsFormValues>(
    defaultAIChatbotSettingsFormValues(),
  );
  const [formHydrated, setFormHydrated] = useState(false);
  const saveMutation = useUpdateChatTenantSettingsMutation();

  useEffect(() => {
    if (isLoading || isFetching) return;
    const next = fetchedFormValues ?? defaultAIChatbotSettingsFormValues();
    setValues(next);
    setFormHydrated(true);
  }, [fetchedFormValues, isLoading, isFetching]);

  const updateRateLimit = useCallback(
    (key: keyof AIChatbotSettingsFormValues["rateLimits"], next: string) => {
      setValues((prev) => ({
        ...prev,
        rateLimits: { ...prev.rateLimits, [key]: next },
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
    const validationError = validateAIChatbotSettingsForm(values);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    saveMutation.mutate(values);
  }, [saveMutation, values]);

  const isSaving = saveMutation.isPending;
  const fieldsDisabled = isLoading || !formHydrated || isSaving;

  const modelSelectOptions = useMemo(
    () => buildModelSelectOptions(modelOptions, values.openAiModel),
    [modelOptions, values.openAiModel],
  );

  if (isLoading && !formHydrated) {
    return <p style={hintTextStyle}>Loading AI Chatbot settings…</p>;
  }

  return (
    <form style={formStyle} onSubmit={(e) => e.preventDefault()}>
      {isError && (
        <p style={statusTextStyle}>
          Could not load settings. Using defaults.{" "}
          <button
            type="button"
            onClick={() => {
              refetch().catch(() => undefined);
            }}
            style={{
              border: "none",
              background: "none",
              color: "#991b1b",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
              font: "inherit",
            }}
          >
            Retry
          </button>
        </p>
      )}

      {!isError && !hasApiData && formHydrated && (
        <p style={hintTextStyle}>No settings returned — using built-in defaults.</p>
      )}

      {budget && <BudgetLine budget={budget} />}

      <div style={formSectionStyle}>
        <p style={rowLabelStyle}>Rate limits</p>
        <div style={gridFourColStyle}>
          <NumberField
            label="User / min"
            value={values.rateLimits.perUserPerMinute}
            onChange={(v) => updateRateLimit("perUserPerMinute", v)}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="User / day"
            value={values.rateLimits.perUserPerDay}
            onChange={(v) => updateRateLimit("perUserPerDay", v)}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="Tenant / min"
            value={values.rateLimits.perTenantPerMinute}
            onChange={(v) => updateRateLimit("perTenantPerMinute", v)}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="Tenant / day"
            value={values.rateLimits.perTenantPerDay}
            onChange={(v) => updateRateLimit("perTenantPerDay", v)}
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      <div style={formSectionStyle}>
        <p style={rowLabelStyle}>Model & pricing</p>
        <div style={gridThreeColStyle}>
          <label style={{ margin: 0 }}>
            <span style={fieldLabelStyle}>OpenAI model</span>
            <select
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
              style={selectStyle}
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
            step="0.000001"
            min={0}
            disabled={fieldsDisabled}
          />
          <NumberField
            label="Output $ / 1M tokens"
            value={values.pricing.outputCostPerMillion}
            onChange={(v) => updatePricing("outputCostPerMillion", v)}
            step="0.000001"
            min={0}
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || fieldsDisabled}
        style={{
          ...saveButtonStyle,
          opacity: isSaving || fieldsDisabled ? 0.65 : 1,
          cursor: isSaving || fieldsDisabled ? "not-allowed" : "pointer",
        }}
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </form>
  );
};
