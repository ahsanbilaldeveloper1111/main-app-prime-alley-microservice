import React from "react";

export type AnalysisFormSkeletonField = {
  id: string;
  wide?: boolean;
  tall?: boolean;
};

export function AnalysisFormSkeleton(props: Readonly<{
  fields?: AnalysisFormSkeletonField[];
  showSave?: boolean;
}>) {
  const { fields = pricingFormSkeletonFields(), showSave = true } = props;

  return (
    <div className="ai-analysis-skeleton__form-grid" aria-busy="true" aria-label="Loading form">
      {fields.map((field) => (
        <div
          key={field.id}
          className={[
            "ai-analysis-skeleton__form-field",
            field.wide ? "ai-analysis-skeleton__form-field--wide" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="ai-analysis-skeleton__label" />
          <div
            className={
              field.tall
                ? "ai-analysis-skeleton__textarea"
                : "ai-analysis-skeleton__input"
            }
          />
        </div>
      ))}
      {showSave ? <div className="ai-analysis-skeleton__save" /> : null}
    </div>
  );
}

const FILTER_SLOT_IDS = [
  "filter-slot-a",
  "filter-slot-b",
  "filter-slot-c",
  "filter-slot-d",
  "filter-slot-e",
] as const;

export function AnalysisFilterBarSkeleton(props: Readonly<{
  filterCount?: number;
  showCompany?: boolean;
}>) {
  const { filterCount = 2, showCompany = true } = props;
  const slots = FILTER_SLOT_IDS.slice(0, filterCount);

  return (
    <div className="ai-analysis-skeleton__filter-bar" aria-busy="true" aria-label="Loading filters">
      {showCompany ? (
        <div className="ai-analysis-skeleton__filter-company">
          <div className="ai-analysis-skeleton__label" />
          <div className="ai-analysis-skeleton__input" />
        </div>
      ) : null}
      {slots.map((slotId) => (
        <div key={slotId} className="ai-analysis-skeleton__filter-field">
          <div className="ai-analysis-skeleton__label" />
          <div className="ai-analysis-skeleton__input ai-analysis-skeleton__input--short" />
        </div>
      ))}
      <div className="ai-analysis-skeleton__button" />
    </div>
  );
}

function tableCellKey(rowIndex: number, colIndex: number): string {
  return `row-${rowIndex}-col-${colIndex}`;
}

function tableHeaderKey(colIndex: number): string {
  return `header-col-${colIndex}`;
}

export function AnalysisTableSkeleton(props: Readonly<{
  rows?: number;
  cols?: number;
}>) {
  const { rows = 3, cols = 5 } = props;
  const rowIndices = Array.from({ length: rows }, (_, row) => row);
  const colIndices = Array.from({ length: cols }, (_, col) => col);

  return (
    <div className="ai-analysis-skeleton__table-wrap" aria-busy="true" aria-label="Loading table">
      <table className="table table-sm mb-0 w-100">
        <thead>
          <tr>
            {colIndices.map((colIndex) => (
              <th key={tableHeaderKey(colIndex)}>
                <div className="ai-analysis-skeleton__table-header" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowIndices.map((rowIndex) => (
            <tr key={tableCellKey(rowIndex, 0)}>
              {colIndices.map((colIndex) => (
                <td key={tableCellKey(rowIndex, colIndex)}>
                  <div
                    className="ai-analysis-skeleton__table-cell"
                    style={{
                      width: colIndex === cols - 1 ? "60%" : "80%",
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function pricingFormSkeletonFields(): AnalysisFormSkeletonField[] {
  return [
    { id: "pricing-cost-per-call" },
    { id: "pricing-input-tokens" },
    { id: "pricing-output-tokens" },
    { id: "pricing-currency" },
    { id: "pricing-notes", wide: true, tall: true },
  ];
}

const TENANT_FORM_FIELD_IDS = [
  "tenant-id",
  "tenant-industry",
  "tenant-language",
  "tenant-monthly-limit",
  "tenant-alert",
  "tenant-cost-limit",
  "tenant-per-call",
  "tenant-input-tokens",
  "tenant-output-tokens",
] as const;

export function tenantFormSkeletonFields(): AnalysisFormSkeletonField[] {
  return TENANT_FORM_FIELD_IDS.map((id) => ({ id }));
}

