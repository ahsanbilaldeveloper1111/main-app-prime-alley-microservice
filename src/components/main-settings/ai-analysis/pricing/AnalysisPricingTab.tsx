import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import "./aiAnalysisPricing.scss";

import {
  AnalysisFormSkeleton,
  pricingFormSkeletonFields,
} from "../shared/AnalysisFormSkeleton";
import { formatAnalysisLastUpdated } from "../shared/formatAnalysisTimestamp";
import { validateAnalysisPricingForm } from "./mapAnalysisPricing";
import type { AnalysisPricingFormValues } from "./types";
import { defaultAnalysisPricingFormValues } from "./types";
import { useAIAnalysisPricingPage } from "./useAIAnalysisPricingPage";

function PricingNumberField(props: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  step?: string;
}>) {
  const { label, value, onChange, disabled = false, step = "0.000001" } = props;
  return (
    <label className="ai-analysis-pricing__field">
      <span className="ai-analysis-pricing__field-label">{label}</span>
      <input
        type="number"
        className="ai-analysis-pricing__input"
        value={value}
        min={0}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export const AnalysisPricingTab: React.FC = () => {
  const { pricingQuery, saveMutation } = useAIAnalysisPricingPage();

  const {
    formValues: fetchedFormValues,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
    updatedAt,
    hasApiData,
  } = pricingQuery;

  const [values, setValues] = useState<AnalysisPricingFormValues>(
    defaultAnalysisPricingFormValues(),
  );
  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    setValues(fetchedFormValues);
    setFormHydrated(true);
  }, [dataUpdatedAt, fetchedFormValues, isLoading]);

  const handleSave = useCallback(() => {
    const validationError = validateAnalysisPricingForm(values);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    saveMutation.mutate(values);
  }, [saveMutation, values]);

  const isSaving = saveMutation.isPending;
  const fieldsDisabled = isLoading || !formHydrated || isSaving;
  const lastUpdatedLabel = formatAnalysisLastUpdated(updatedAt);

  if (isLoading && !formHydrated) {
    return (
      <div className="ai-analysis-pricing">
        <header>
          <h2 className="ai-analysis-pricing__heading">Analysis pricing</h2>
          <p className="ai-analysis-pricing__subheading">
            Formula cost = fixed per-call + (input tokens × input_rate) + (output
            tokens × output rate). Cache-served calls cost $0
          </p>
        </header>
        <AnalysisFormSkeleton fields={pricingFormSkeletonFields()} />
      </div>
    );
  }

  return (
    <div className="ai-analysis-pricing">
      <header>
        <h2 className="ai-analysis-pricing__heading">Analysis pricing</h2>
        <p className="ai-analysis-pricing__subheading">
          Formula cost = fixed per-call + (input tokens × input_rate) + (output
          tokens × output rate). Cache-served calls cost $0
        </p>
      </header>

      {isError ? (
        <p className="ai-analysis-pricing__hint">
          Could not load pricing.{" "}
          <button
            type="button"
            className="btn btn-link p-0 align-baseline"
            onClick={() => {
              refetch().catch(() => undefined);
            }}
          >
            Retry
          </button>
        </p>
      ) : null}

      {!isError && !hasApiData && formHydrated ? (
        <p className="ai-analysis-pricing__hint">
          No pricing returned — enter values and save to create pricing.
        </p>
      ) : null}

      <div className="ai-analysis-pricing__grid">
        <PricingNumberField
          label="$ per Call"
          value={values.costPerCallUsd}
          onChange={(v) => setValues((prev) => ({ ...prev, costPerCallUsd: v }))}
          disabled={fieldsDisabled}
          step="0.01"
        />
        <PricingNumberField
          label="$ per 1M input tokens"
          value={values.costPer1MInputTokensUsd}
          onChange={(v) =>
            setValues((prev) => ({ ...prev, costPer1MInputTokensUsd: v }))
          }
          disabled={fieldsDisabled}
        />
        <PricingNumberField
          label="$ per 1M output tokens"
          value={values.costPer1MOutputTokensUsd}
          onChange={(v) =>
            setValues((prev) => ({ ...prev, costPer1MOutputTokensUsd: v }))
          }
          disabled={fieldsDisabled}
        />
        <label className="ai-analysis-pricing__field">
          <span className="ai-analysis-pricing__field-label">Currency</span>
          <input
            type="text"
            className="ai-analysis-pricing__input"
            value={values.currency}
            disabled={fieldsDisabled}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, currency: e.target.value }))
            }
          />
        </label>
        <label className="ai-analysis-pricing__field ai-analysis-pricing__notes">
          <span className="ai-analysis-pricing__field-label">Notes</span>
          <textarea
            className="ai-analysis-pricing__textarea"
            value={values.notes}
            disabled={fieldsDisabled}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </label>
      </div>

      {lastUpdatedLabel ? (
        <p className="ai-analysis-pricing__meta">Last updated: {lastUpdatedLabel}</p>
      ) : null}

      <button
        type="button"
        className="ai-analysis-pricing__save"
        onClick={handleSave}
        disabled={isSaving || fieldsDisabled}
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </div>
  );
};
