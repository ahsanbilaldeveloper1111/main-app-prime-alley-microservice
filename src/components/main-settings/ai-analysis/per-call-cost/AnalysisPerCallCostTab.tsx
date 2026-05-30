import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import { Filter } from "lucide-react";

import GenericTable from "@components/GenericTable";

import "./aiAnalysisPerCallCost.scss";

import type { PerCallCostFilterForm } from "./types";
import { getPerCallCostTableColumns } from "./perCallCostTableColumns";
import { useAIAnalysisPerCallCostPage } from "./useAIAnalysisPerCallCostPage";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
] as const;

export const AnalysisPerCallCostTab: React.FC = () => {
  const {
    filterForm,
    updateFilterField,
    handleApplyFilter,
    callsQuery,
    filtersApplied,
    tablePagination,
    handlePaginationChange,
    rows,
  } = useAIAnalysisPerCallCostPage();

  const columns = useMemo(() => getPerCallCostTableColumns(), []);
  const tableLoading = callsQuery.isPending || callsQuery.isFetching;

  return (
    <div className="ai-analysis-per-call-cost">
      <header>
        <h2 className="ai-analysis-per-call-cost__heading">Per-call cost</h2>
        <p className="ai-analysis-per-call-cost__subheading">
          One row per processed call, including failed and cache-served runs. Filter by
          date range or status.
        </p>
      </header>

      <div className="ai-analysis-per-call-cost__filters">
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
        <Button type="button" variant="primary" onClick={handleApplyFilter}>
          <Filter size={16} className="me-2" aria-hidden />
          Filter
        </Button>
      </div>

      {filtersApplied ? (
        <>
          {callsQuery.isError ? (
            <p className="ai-analysis-per-call-cost__hint">
              Could not load per-call cost data.{" "}
              <button
                type="button"
                className="btn btn-link p-0 align-baseline"
                onClick={() => {
                  callsQuery.refetch().catch(() => undefined);
                }}
              >
                Retry
              </button>
            </p>
          ) : null}
          <div className="ai-analysis-per-call-cost__table">
            <GenericTable
              data={rows}
              columns={columns}
              loading={tableLoading}
              emptyMessage="No call cost records found for the selected filters."
              loadingMessage="Loading per-call cost data..."
              showToolbar={false}
              hover={true}
              striped={false}
              uniqueKey="id"
              fixedHeight={true}
              maxHeight="min(560px, calc(100vh - 380px))"
              pagination={{
                currentPage: tablePagination.currentPage,
                rowsPerPage: tablePagination.rowsPerPage,
                totalRows: tablePagination.totalRows,
                pageSizeOptions: tablePagination.pageSizeOptions,
              }}
              onPaginationChange={handlePaginationChange}
            />
          </div>
        </>
      ) : (
        <p className="ai-analysis-per-call-cost__hint">
          Apply filters to load per-call cost data.
        </p>
      )}
    </div>
  );
};
