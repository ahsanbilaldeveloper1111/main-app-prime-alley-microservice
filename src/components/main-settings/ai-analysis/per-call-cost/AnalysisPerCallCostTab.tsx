import React from "react";
import { Button, Table } from "react-bootstrap";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import Select from "react-select";

import "./aiAnalysisPerCallCost.scss";

import type { AnalysisPerCallCostRow } from "@utils/aiAnalytics";

import { AnalysisTableSkeleton } from "../shared/AnalysisFormSkeleton";
import { formatPerCallCostCell } from "./formatPerCallCostDisplay";
import type { PerCallCostFilterForm } from "./types";
import { useAIAnalysisPerCallCostPage } from "./useAIAnalysisPerCallCostPage";

type CompanySelectOption = { value: string; label: string };

const TABLE_COLUMNS = [
  { key: "id" as const, label: "Id" },
  { key: "tenant_id" as const, label: "Tenant Id" },
  { key: "call_id" as const, label: "Call Id" },
  { key: "agent_id" as const, label: "Agent Id" },
  { key: "call_date" as const, label: "Call Date" },
  { key: "call_datetime" as const, label: "Call Datetime" },
  { key: "duration_s" as const, label: "Duration" },
  { key: "input_tokens" as const, label: "Input Tokens" },
  { key: "output_tokens" as const, label: "Output Tokens" },
  { key: "analysis_cost_usd" as const, label: "Analysis Cost USD" },
  { key: "status" as const, label: "Status" },
  { key: "fail_reason" as const, label: "Fail Reason" },
  { key: "served_from" as const, label: "Served From" },
  { key: "created_at" as const, label: "Created At" },
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
] as const;

function PerCallCostTable(props: Readonly<{
  rows: AnalysisPerCallCostRow[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}>) {
  const { rows, isLoading, isError, onRetry } = props;

  if (isLoading) {
    return <AnalysisTableSkeleton rows={8} cols={TABLE_COLUMNS.length} />;
  }

  if (isError) {
    return (
      <p className="ai-analysis-per-call-cost__hint">
        Could not load per-call cost data.{" "}
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

  return (
    <div className="ai-analysis-per-call-cost__table-wrap">
      <Table hover responsive className="ai-analysis-per-call-cost__table mb-0">
        <thead>
          <tr>
            {TABLE_COLUMNS.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={TABLE_COLUMNS.length} className="text-muted text-center">
                No call cost records found for the selected filters.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={`${row.id}-${row.call_id}-${row.created_at ?? ""}`}>
                {TABLE_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    data-label={col.label}
                    title={formatPerCallCostCell(row, col.key)}
                  >
                    {formatPerCallCostCell(row, col.key)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

export const AnalysisPerCallCostTab: React.FC = () => {
  const {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    filterForm,
    updateFilterField,
    handleCompanySelect,
    handleApplyFilter,
    callsQuery,
    filtersApplied,
    total,
    offset,
    limit,
    canGoPrev,
    canGoNext,
    goToPrevPage,
    goToNextPage,
  } = useAIAnalysisPerCallCostPage();

  const rows = callsQuery.data?.items ?? [];
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + limit, total);

  return (
    <div className="ai-analysis-per-call-cost">
      <header>
        <h2 className="ai-analysis-per-call-cost__heading">Per-call cost</h2>
        <p className="ai-analysis-per-call-cost__subheading">
          One row per processed call, including failed and cache-served runs. Filter by
          tenant, date range, or status.
        </p>
      </header>

      <div className="ai-analysis-per-call-cost__filters">
        <div className="ai-analysis-per-call-cost__company-select">
          <span className="ai-analysis-per-call-cost__field-label">Company</span>
          <Select<CompanySelectOption>
            isLoading={companiesLoading}
            options={companyOptions}
            value={selectedCompanyOption}
            onChange={(opt) => handleCompanySelect(opt?.value ?? "")}
            placeholder="All companies…"
            isClearable
            classNamePrefix="ai-analysis-per-call-cost-company"
          />
        </div>
        <label className="ai-analysis-per-call-cost__filter-field">
          <span className="ai-analysis-per-call-cost__field-label">Date from</span>
          <input
            type="date"
            className="ai-analysis-per-call-cost__input"
            value={filterForm.dateFrom}
            onChange={(e) => updateFilterField("dateFrom", e.target.value)}
          />
        </label>
        <label className="ai-analysis-per-call-cost__filter-field">
          <span className="ai-analysis-per-call-cost__field-label">Date to</span>
          <input
            type="date"
            className="ai-analysis-per-call-cost__input"
            value={filterForm.dateTo}
            onChange={(e) => updateFilterField("dateTo", e.target.value)}
          />
        </label>
        <label className="ai-analysis-per-call-cost__filter-field">
          <span className="ai-analysis-per-call-cost__field-label">Status</span>
          <select
            className="ai-analysis-per-call-cost__input"
            value={filterForm.status}
            onChange={(e) =>
              updateFilterField(
                "status",
                e.target.value as PerCallCostFilterForm["status"],
              )
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ai-analysis-per-call-cost__filter-field">
          <span className="ai-analysis-per-call-cost__field-label">Limit</span>
          <input
            type="number"
            className="ai-analysis-per-call-cost__input"
            value={filterForm.limit}
            min={1}
            max={500}
            step={1}
            onChange={(e) => updateFilterField("limit", e.target.value)}
          />
        </label>
        <Button type="button" variant="primary" onClick={handleApplyFilter}>
          <Filter size={16} className="me-2" aria-hidden />
          Filter
        </Button>
      </div>

      {!filtersApplied ? (
        <p className="ai-analysis-per-call-cost__hint">
          Apply filters to load per-call cost data.
        </p>
      ) : (
        <>
          <p className="ai-analysis-per-call-cost__meta">
            {total === 0
              ? "No records"
              : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
          </p>
          <PerCallCostTable
            rows={rows}
            isLoading={callsQuery.isPending}
            isError={callsQuery.isError}
            onRetry={() => {
              callsQuery.refetch().catch(() => undefined);
            }}
          />
          {total > 0 ? (
            <div className="ai-analysis-per-call-cost__pagination">
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={!canGoPrev || callsQuery.isPending}
                onClick={goToPrevPage}
              >
                <ChevronLeft size={16} className="me-1" aria-hidden />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={!canGoNext || callsQuery.isPending}
                onClick={goToNextPage}
              >
                Next
                <ChevronRight size={16} className="ms-1" aria-hidden />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
