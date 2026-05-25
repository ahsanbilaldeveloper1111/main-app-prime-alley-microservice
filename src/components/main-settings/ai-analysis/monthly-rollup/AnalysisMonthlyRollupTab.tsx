import React from "react";

import { Button, Table } from "react-bootstrap";

import { Filter } from "lucide-react";



import "./aiAnalysisMonthlyRollup.scss";



import type { AnalysisMonthlyRollupRow } from "@utils/aiAnalytics";



import { AnalysisTableSkeleton } from "../shared/AnalysisFormSkeleton";

import { formatMonthlyRollupCell } from "./formatMonthlyRollupDisplay";

import { useAIAnalysisMonthlyRollupPage } from "./useAIAnalysisMonthlyRollupPage";



const TABLE_COLUMNS = [

  { key: "tenant_id" as const, label: "Tenant ID" },

  { key: "year" as const, label: "Year" },

  { key: "month" as const, label: "Month" },

  { key: "total_calls" as const, label: "Total Calls" },

  { key: "total_cost_usd" as const, label: "Total Cost USD" },

  { key: "success_count" as const, label: "Success Count" },

  { key: "failed_count" as const, label: "Failed Count" },

  { key: "cache_count" as const, label: "Cache Count" },

  { key: "fresh_count" as const, label: "Fresh Count" },

  { key: "success_rate" as const, label: "Success Rate" },

] as const;



const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {

  const value = String(index + 1);

  return { value, label: value };

});



function RollupTable(props: Readonly<{

  rows: AnalysisMonthlyRollupRow[];

  isLoading: boolean;

  isError: boolean;

  onRetry: () => void;

}>) {

  const { rows, isLoading, isError, onRetry } = props;



  if (isLoading) {

    return <AnalysisTableSkeleton rows={4} cols={TABLE_COLUMNS.length} />;

  }



  if (isError) {

    return (

      <p className="ai-analysis-monthly-rollup__hint">

        Could not load monthly rollup.{" "}

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

    <div className="ai-analysis-monthly-rollup__table-wrap">

      <Table hover className="ai-analysis-monthly-rollup__table mb-0">

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

                No rollup records found for the selected filters.

              </td>

            </tr>

          ) : (

            rows.map((row) => (

              <tr key={`${row.tenant_id}-${row.year}-${row.month}`}>

                {TABLE_COLUMNS.map((col) => (

                  <td

                    key={col.key}

                    data-label={col.label}

                    className={

                      col.key === "tenant_id"

                        ? "ai-analysis-table__cell--id"

                        : undefined

                    }

                  >

                    {formatMonthlyRollupCell(row, col.key)}

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



export const AnalysisMonthlyRollupTab: React.FC = () => {

  const {

    filterForm,

    updateFilterField,

    handleApplyFilter,

    rollupQuery,

    filtersApplied,

    sessionTenantId,

  } = useAIAnalysisMonthlyRollupPage();



  const rows = rollupQuery.data ?? [];



  return (

    <div className="ai-analysis-monthly-rollup">

      <header>

        <h2 className="ai-analysis-monthly-rollup__heading">Monthly rollup</h2>

        <p className="ai-analysis-monthly-rollup__subheading">

          Monthly call volume, cost, and outcome breakdown for your company. Filter

          by year or month.

        </p>

      </header>



      <div className="ai-analysis-monthly-rollup__filters">

        <label className="ai-analysis-monthly-rollup__filter-field">

          <span className="ai-analysis-monthly-rollup__field-label">Year</span>

          <input

            type="number"

            className="ai-analysis-monthly-rollup__input"

            value={filterForm.year}

            min={1}

            step={1}

            placeholder="e.g. 2026"

            onChange={(e) => updateFilterField("year", e.target.value)}

          />

        </label>

        <label className="ai-analysis-monthly-rollup__filter-field">

          <span className="ai-analysis-monthly-rollup__field-label">Month</span>

          <select

            className="ai-analysis-monthly-rollup__input"

            value={filterForm.month}

            onChange={(e) => updateFilterField("month", e.target.value)}

          >

            <option value="">All months</option>

            {MONTH_OPTIONS.map((opt) => (

              <option key={opt.value} value={opt.value}>

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



      {!sessionTenantId ? (

        <p className="ai-analysis-monthly-rollup__hint">

          No tenant is associated with your account.

        </p>

      ) : filtersApplied ? (

        <RollupTable

          rows={rows}

          isLoading={rollupQuery.isPending}

          isError={rollupQuery.isError}

          onRetry={() => {

            rollupQuery.refetch().catch(() => undefined);

          }}

        />

      ) : (

        <p className="ai-analysis-monthly-rollup__hint">

          Apply filters to load monthly rollup data.

        </p>

      )}

    </div>

  );

};

