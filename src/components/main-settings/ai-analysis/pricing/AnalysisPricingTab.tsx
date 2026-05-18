import React, { useCallback, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Filter } from "lucide-react";
import Select from "react-select";
import { toast } from "react-toastify";

import "./aiAnalysisPricing.scss";

import {
  AnalysisFormSkeleton,
  pricingFormSkeletonFields,
} from "../shared/AnalysisFormSkeleton";
import { validateAnalysisPricingForm } from "./mapAnalysisPricing";
import type { AnalysisPricingFormValues } from "./types";
import { defaultAnalysisPricingFormValues } from "./types";
import { useAIAnalysisPricingPage } from "./useAIAnalysisPricingPage";

type CompanySelectOption = { value: string; label: string };

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
    <div className="ai-analysis-pricing__company-filter">
      <div className="ai-analysis-pricing__company-select">
        <span className="ai-analysis-pricing__field-label">Company</span>
        <Select<CompanySelectOption>
          isLoading={companiesLoading}
          options={companyOptions}
          value={selectedCompanyOption}
          onChange={(opt) => onCompanySelect(opt?.value ?? "")}
          placeholder="Select company..."
          isClearable
          classNamePrefix="ai-analysis-pricing-company"
        />
      </div>
      <Button type="button" variant="primary" onClick={onApplyFilter}>
        <Filter size={16} className="me-2" aria-hidden />
        Filter
      </Button>
      {appliedCompanyLabel ? (
        <p className="ai-analysis-pricing__meta">
          Viewing: <strong>{appliedCompanyLabel}</strong>
        </p>
      ) : null}
    </div>
  );
}

export const AnalysisPricingTab: React.FC = () => {
  const {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    appliedCompanyLabel,
    appliedTenantId,
    handleCompanySelect,
    handleApplyFilter,
    pricingQuery,
    saveMutation,
  } = useAIAnalysisPricingPage();

  const {
    formValues: fetchedFormValues,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
    tenantId: queryTenantId,
    updatedAt,
    hasApiData,
  } = pricingQuery;

  const [values, setValues] = useState<AnalysisPricingFormValues>(
    defaultAnalysisPricingFormValues(),
  );
  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {
    setValues(defaultAnalysisPricingFormValues());
    setFormHydrated(false);
  }, [appliedTenantId]);

  useEffect(() => {
    if (!appliedTenantId || queryTenantId !== appliedTenantId || isLoading) {
      return;
    }
    setValues(fetchedFormValues);
    setFormHydrated(true);
  }, [appliedTenantId, queryTenantId, dataUpdatedAt, fetchedFormValues, isLoading]);

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

  if (!appliedTenantId) {
    return (
      <div className="ai-analysis-pricing">
        <header>
          <h2 className="ai-analysis-pricing__heading">Analysis pricing</h2>
          <p className="ai-analysis-pricing__subheading">
            Formula cost = fixed per-call + (input tokens × input_rate) + (output
            tokens × output rate). Cache-served calls cost $0
          </p>
        </header>
        <CompanyFilterBar
          companiesLoading={companiesLoading}
          companyOptions={companyOptions}
          selectedCompanyOption={selectedCompanyOption}
          onCompanySelect={handleCompanySelect}
          onApplyFilter={handleApplyFilter}
        />
        <p className="ai-analysis-pricing__hint">Select a company to load pricing.</p>
      </div>
    );
  }

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
        <CompanyFilterBar
          companiesLoading={companiesLoading}
          companyOptions={companyOptions}
          selectedCompanyOption={selectedCompanyOption}
          onCompanySelect={handleCompanySelect}
          onApplyFilter={handleApplyFilter}
          appliedCompanyLabel={appliedCompanyLabel}
        />
        <AnalysisFormSkeleton fields={pricingFormSkeletonFields()} />
      </div>
    );
  }

  return (
    <div key={appliedTenantId} className="ai-analysis-pricing">
      <header>
        <h2 className="ai-analysis-pricing__heading">Analysis pricing</h2>
        <p className="ai-analysis-pricing__subheading">
          Formula cost = fixed per-call + (input tokens × input_rate) + (output
          tokens × output rate). Cache-served calls cost $0
        </p>
      </header>

      <CompanyFilterBar
        companiesLoading={companiesLoading}
        companyOptions={companyOptions}
        selectedCompanyOption={selectedCompanyOption}
        onCompanySelect={handleCompanySelect}
        onApplyFilter={handleApplyFilter}
        appliedCompanyLabel={appliedCompanyLabel}
      />

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
          No pricing returned — enter values and save to create tenant pricing.
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

      {updatedAt ? (
        <p className="ai-analysis-pricing__meta">Last updated: {updatedAt}</p>
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
