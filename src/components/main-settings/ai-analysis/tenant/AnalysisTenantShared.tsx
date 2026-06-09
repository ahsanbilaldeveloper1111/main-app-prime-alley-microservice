import React from "react";
import { Button, Table } from "react-bootstrap";
import { Filter } from "lucide-react";
import Select from "react-select";

import type { AnalysisTenantRecord } from "@utils/aiAnalytics";

import { AnalysisTableSkeleton } from "../shared/AnalysisFormSkeleton";
import { formatTenantTableCell } from "./formatAnalysisTenantDisplay";

export type CompanySelectOption = { value: string; label: string };

export const TENANT_TABLE_COLUMNS = [
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

export function TenantField(props: Readonly<{
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
    <label className="ai-analysis-tenant-config__field">
      <span className="ai-analysis-tenant-config__field-label">{label}</span>
      <input
        type={type}
        className="ai-analysis-tenant-config__input"
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
        <span className="ai-analysis-tenant-config__field-hint">{hint}</span>
      ) : null}
    </label>
  );
}

export function CompanyFilterBar(props: Readonly<{
  companiesLoading: boolean;
  companyOptions: CompanySelectOption[];
  selectedCompanyOption: CompanySelectOption | null;
  onCompanySelect: (companyId: string) => void;
  onApplyFilter: () => void;
  appliedCompanyLabel?: string;
  selectClassPrefix?: string;
}>) {
  const {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    onCompanySelect,
    onApplyFilter,
    appliedCompanyLabel,
    selectClassPrefix = "ai-analysis-tenant-company",
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
          classNamePrefix={selectClassPrefix}
        />
      </div>
      <Button type="button" variant="primary" onClick={onApplyFilter}>
        <Filter size={16} className="me-2" aria-hidden />
        Filter
      </Button>
      {appliedCompanyLabel ? (
        <p className="ai-analysis-tenant__meta">
          Viewing: <strong>{appliedCompanyLabel}</strong>
        </p>
      ) : null}
    </div>
  );
}

export function TenantsTable(props: Readonly<{
  rows: AnalysisTenantRecord[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedTenantId?: string;
  onSelectRow?: (tenantId: string) => void;
}>) {
  const {
    rows,
    isLoading,
    isError,
    onRetry,
    selectedTenantId = "",
    onSelectRow,
  } = props;

  if (isLoading) {
    return (
      <AnalysisTableSkeleton
        rows={Math.max(3, Math.min(rows.length, 8))}
        cols={TENANT_TABLE_COLUMNS.length}
      />
    );
  }

  if (isError) {
    return (
      <p className="ai-analysis-tenant__hint">
        Could not load tenants.{" "}
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

  const list = rows;

  return (
    <div className="ai-analysis-tenant__table-wrap">
      <Table hover className="ai-analysis-tenant__table mb-0">
        <thead>
          <tr>
            {TENANT_TABLE_COLUMNS.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td
                colSpan={TENANT_TABLE_COLUMNS.length}
                className="text-muted text-center"
              >
                No tenant records found.
              </td>
            </tr>
          ) : (
            list.map((tableRow) => {
              const isSelected =
                Boolean(selectedTenantId) &&
                tableRow.tenant_id === selectedTenantId;
              const rowClassName = [
                "ai-analysis-tenant__row",
                isSelected ? "ai-analysis-tenant__row--selected" : "",
                onSelectRow ? "ai-analysis-tenant__row--clickable" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <tr
                  key={tableRow.tenant_id}
                  className={rowClassName}
                  onClick={
                    onSelectRow
                      ? () => {
                          onSelectRow(tableRow.tenant_id);
                        }
                      : undefined
                  }
                >
                  {TENANT_TABLE_COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      data-label={col.label}
                      className={
                        col.key === "tenant_id"
                          ? "ai-analysis-table__cell--id"
                          : undefined
                      }
                    >
                      {formatTenantTableCell(tableRow, col.key)}
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
