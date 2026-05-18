import React, { useCallback, useEffect, useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Filter } from "lucide-react";
import Select from "react-select";
import { toast } from "react-toastify";

import "./aiAnalysisTenant.scss";

import type { AnalysisTenantRecord } from "@utils/aiAnalytics";

import {
  AnalysisFormSkeleton,
  AnalysisTableSkeleton,
  tenantFormSkeletonFields,
} from "../shared/AnalysisFormSkeleton";
import { formatTenantTableCell } from "./formatAnalysisTenantDisplay";
import { validateAnalysisTenantForm } from "./mapAnalysisTenant";
import type { AnalysisTenantFormValues } from "./types";
import { defaultAnalysisTenantFormValues } from "./types";
import { useAIAnalysisTenantPage } from "./useAIAnalysisTenantPage";

type CompanySelectOption = { value: string; label: string };

const TABLE_COLUMNS = [
  { key: "tenant_id" as const, label: "Tenant ID" },
  { key: "industry_type" as const, label: "Industry type" },
  { key: "primary_language" as const, label: "Primary language" },
  { key: "monthly_call_limit" as const, label: "Monthly call limit" },
  { key: "alert_threshold_pct" as const, label: "Alert threshold %" },
  { key: "cost_limit_usd" as const, label: "Cost limit USD" },
  { key: "created_at" as const, label: "Created at" },
  { key: "updated_at" as const, label: "Updated at" },
  { key: "input_override" as const, label: "$/1M input (override)" },
  { key: "output_override" as const, label: "$/1M output (override)" },
];

function TenantField(props: Readonly<{
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  type?: "text" | "number";
  step?: string;
  hint?: string;
}>) {
  const {
    label,
    value,
    onChange,
    disabled = false,
    readOnly = false,
    type = "text",
    step,
    hint,
  } = props;

  return (
    <label className="ai-analysis-tenant__field">
      <span className="ai-analysis-tenant__field-label">{label}</span>
      <input
        type={type}
        className="ai-analysis-tenant__input"
        value={value}
        readOnly={readOnly}
        disabled={disabled || readOnly}
        step={step}
        min={type === "number" ? 0 : undefined}
        onChange={
          onChange
            ? (e) => {
                onChange(e.target.value);
              }
            : undefined
        }
      />
      {hint ? (
        <span className="ai-analysis-tenant__field-hint">{hint}</span>
      ) : null}
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
    <div className="ai-analysis-tenant__company-filter">
      <div className="ai-analysis-tenant__company-select">
        <span className="ai-analysis-tenant__field-label">Company</span>
        <Select<CompanySelectOption>
          isLoading={companiesLoading}
          options={companyOptions}
          value={selectedCompanyOption}
          onChange={(opt) => onCompanySelect(opt?.value ?? "")}
          placeholder="Select company..."
          isClearable
          classNamePrefix="ai-analysis-tenant-company"
        />
      </div>
      <Button type="button" variant="primary" onClick={onApplyFilter}>
        <Filter size={16} className="me-2" aria-hidden />
        Filter
      </Button>
      {appliedCompanyLabel ? (
        <p className="ai-analysis-tenant__meta">
          Editing: <strong>{appliedCompanyLabel}</strong>
        </p>
      ) : null}
    </div>
  );
}

function TenantsTable(props: Readonly<{
  row: AnalysisTenantRecord | null | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedTenantId: string;
  onSelectRow: (tenantId: string) => void;
}>) {
  const { row, isLoading, isError, onRetry, selectedTenantId, onSelectRow } =
    props;

  if (!selectedTenantId) {
    return (
      <p className="ai-analysis-tenant__hint">
        Select a company to view tenant details in the table.
      </p>
    );
  }

  if (isLoading) {
    return <AnalysisTableSkeleton rows={1} cols={TABLE_COLUMNS.length} />;
  }

  if (isError) {
    return (
      <p className="ai-analysis-tenant__hint">
        Could not load tenant.{" "}
        <button
          type="button"
          className="btn btn-link p-0 align-baseline"
          onClick={onRetry}
        >
          Retry
        </button>
      </p>
    );
  }

  const list = row ? [row] : [];

  return (
    <div className="ai-analysis-tenant__table-wrap">
      <Table hover responsive className="ai-analysis-tenant__table mb-0">
        <thead>
          <tr>
            {TABLE_COLUMNS.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={TABLE_COLUMNS.length} className="text-muted text-center">
                No tenant records found.
              </td>
            </tr>
          ) : (
            list.map((row) => {
              const isSelected = row.tenant_id === selectedTenantId;
              return (
                <tr
                  key={row.tenant_id}
                  className={`ai-analysis-tenant__row${isSelected ? " ai-analysis-tenant__row--selected" : ""}`}
                  onClick={() => onSelectRow(row.tenant_id)}
                >
                  {TABLE_COLUMNS.map((col) => (
                    <td key={col.key} data-label={col.label}>
                      {formatTenantTableCell(row, col.key)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}

export const AnalysisTenantTab: React.FC = () => {
  const {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    appliedCompanyLabel,
    appliedTenantId,
    handleCompanySelect,
    handleApplyFilter,
    handleTenantRowSelect,
    tenantQuery,
    saveMutation,
  } = useAIAnalysisTenantPage();

  const {
    data: tenantData,
    formValues: fetchedFormValues,
    isLoading: tenantLoading,
    isError: tenantError,
    isSuccess: tenantLoaded,
    refetch: refetchTenant,
    dataUpdatedAt,
    tenantId: queryTenantId,
    updatedAt,
    hasApiData,
  } = tenantQuery;

  const [values, setValues] = useState<AnalysisTenantFormValues>(
    defaultAnalysisTenantFormValues(),
  );
  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {
    setValues(defaultAnalysisTenantFormValues(appliedTenantId));
    setFormHydrated(false);
  }, [appliedTenantId]);

  useEffect(() => {
    if (!appliedTenantId || queryTenantId !== appliedTenantId || tenantLoading) {
      return;
    }
    setValues(fetchedFormValues);
    setFormHydrated(true);
  }, [
    appliedTenantId,
    queryTenantId,
    dataUpdatedAt,
    fetchedFormValues,
    tenantLoading,
  ]);

  const handleSave = useCallback(() => {
    const validationError = validateAnalysisTenantForm(values, tenantData ?? null);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    saveMutation.mutate(values);
  }, [saveMutation, tenantData, values]);

  const isSaving = saveMutation.isPending;
  const fieldsDisabled = tenantLoading || !formHydrated || isSaving;

  return (
    <div className="ai-analysis-tenant">
      <header>
        <h2 className="ai-analysis-tenant__heading">Analysis tenants</h2>
        <p className="ai-analysis-tenant__subheading">
          Configure per-tenant limits, alert thresholds, and optional cost overrides.
          Click a row or select a company to edit settings.
        </p>
      </header>

      <TenantsTable
        row={tenantData}
        isLoading={tenantLoading}
        isError={tenantError}
        onRetry={() => {
          refetchTenant().catch(() => undefined);
        }}
        selectedTenantId={appliedTenantId}
        onSelectRow={handleTenantRowSelect}
      />

      <CompanyFilterBar
        companiesLoading={companiesLoading}
        companyOptions={companyOptions}
        selectedCompanyOption={selectedCompanyOption}
        onCompanySelect={handleCompanySelect}
        onApplyFilter={handleApplyFilter}
        appliedCompanyLabel={appliedCompanyLabel}
      />

      {appliedTenantId ? null : (
        <p className="ai-analysis-tenant__hint">
          Select a company or table row to edit tenant settings.
        </p>
      )}

      {appliedTenantId && tenantLoading && formHydrated === false ? (
        <AnalysisFormSkeleton fields={tenantFormSkeletonFields()} />
      ) : null}

      {appliedTenantId && tenantError ? (
        <p className="ai-analysis-tenant__hint">
          Could not load tenant settings.{" "}
          <button
            type="button"
            className="btn btn-link p-0 align-baseline"
            onClick={() => {
              refetchTenant().catch(() => undefined);
            }}
          >
            Retry
          </button>
        </p>
      ) : null}

      {appliedTenantId && tenantLoaded && formHydrated ? (
        <>
          {hasApiData ? null : (
            <p className="ai-analysis-tenant__hint">
              No tenant settings returned — enter values and save to create settings.
            </p>
          )}

          <div key={appliedTenantId} className="ai-analysis-tenant__grid">
            <TenantField
              label="Tenant ID"
              value={values.tenantId || appliedTenantId}
              readOnly
            />
            <TenantField
              label="Industry type"
              value={values.industryType}
              disabled={fieldsDisabled}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, industryType: v }))
              }
            />
            <TenantField
              label="Primary language"
              value={values.primaryLanguage}
              disabled={fieldsDisabled}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, primaryLanguage: v }))
              }
            />
            <TenantField
              label="Monthly call limit"
              value={values.monthlyCallLimit}
              type="number"
              step="1"
              hint="Leave empty for unlimited"
              disabled={fieldsDisabled}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, monthlyCallLimit: v }))
              }
            />
            <TenantField
              label="Alert threshold %"
              value={values.alertThresholdPct}
              type="number"
              step="1"
              hint="0–100"
              disabled={fieldsDisabled}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, alertThresholdPct: v }))
              }
            />
            <TenantField
              label="Cost limit USD"
              value={values.costLimitUsd}
              type="number"
              step="0.01"
              disabled={fieldsDisabled}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, costLimitUsd: v }))
              }
            />
            <TenantField
              label="$ per call"
              value={values.costPerCallUsd}
              type="number"
              step="0.000001"
              hint="Empty = use global pricing"
              disabled={fieldsDisabled}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, costPerCallUsd: v }))
              }
            />
            <TenantField
              label="$ per 1M input tokens"
              value={values.costPer1MInputTokensUsd}
              type="number"
              step="0.000001"
              hint="Empty = use global pricing"
              disabled={fieldsDisabled}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, costPer1MInputTokensUsd: v }))
              }
            />
            <TenantField
              label="$ per 1M output tokens"
              value={values.costPer1MOutputTokensUsd}
              type="number"
              step="0.000001"
              hint="Empty = use global pricing"
              disabled={fieldsDisabled}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, costPer1MOutputTokensUsd: v }))
              }
            />
          </div>

          {updatedAt ? (
            <p className="ai-analysis-tenant__meta">Last updated: {updatedAt}</p>
          ) : null}

          <button
            type="button"
            className="ai-analysis-tenant__save"
            onClick={handleSave}
            disabled={isSaving || fieldsDisabled}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </>
      ) : null}
    </div>
  );
};
