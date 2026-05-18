import React from "react";

export type AnalysisFormSkeletonField = {
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
      {fields.map((field, index) => (
        <div
          key={`field-${index}`}
          className={[
            "ai-analysis-skeleton__form-field",
            field.wide ? "ai-analysis-skeleton__form-field--wide" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            className="ai-analysis-skeleton__label"
            style={{ animationDelay: `${index * 0.06}s` }}
          />
          <div
            className={
              field.tall
                ? "ai-analysis-skeleton__textarea"
                : "ai-analysis-skeleton__input"
            }
            style={{ animationDelay: `${index * 0.06 + 0.03}s` }}
          />
        </div>
      ))}
      {showSave ? (
        <div
          className="ai-analysis-skeleton__save"
          style={{ animationDelay: `${fields.length * 0.06}s` }}
        />
      ) : null}
    </div>
  );
}

export function AnalysisFilterBarSkeleton(props: Readonly<{
  filterCount?: number;
  showCompany?: boolean;
}>) {
  const { filterCount = 2, showCompany = true } = props;

  return (
    <div className="ai-analysis-skeleton__filter-bar" aria-busy="true" aria-label="Loading filters">
      {showCompany ? (
        <div className="ai-analysis-skeleton__filter-company">
          <div className="ai-analysis-skeleton__label" />
          <div className="ai-analysis-skeleton__input" />
        </div>
      ) : null}
      {Array.from({ length: filterCount }, (_, index) => (
        <div key={`filter-${index}`} className="ai-analysis-skeleton__filter-field">
          <div
            className="ai-analysis-skeleton__label"
            style={{ animationDelay: `${(index + 1) * 0.06}s` }}
          />
          <div
            className="ai-analysis-skeleton__input ai-analysis-skeleton__input--short"
            style={{ animationDelay: `${(index + 1) * 0.06 + 0.03}s` }}
          />
        </div>
      ))}
      <div
        className="ai-analysis-skeleton__button"
        style={{ animationDelay: `${(filterCount + 1) * 0.06}s` }}
      />
    </div>
  );
}

export function AnalysisTableSkeleton(props: Readonly<{
  rows?: number;
  cols?: number;
}>) {
  const { rows = 3, cols = 5 } = props;

  return (
    <div className="ai-analysis-skeleton__table-wrap" aria-busy="true" aria-label="Loading table">
      <table className="table table-sm mb-0 w-100">
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, colIndex) => (
              <th key={`h-${colIndex}`}>
                <div
                  className="ai-analysis-skeleton__table-header"
                  style={{ animationDelay: `${colIndex * 0.05}s` }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={`r-${rowIndex}`}>
              {Array.from({ length: cols }, (_, colIndex) => (
                <td key={`c-${rowIndex}-${colIndex}`}>
                  <div
                    className="ai-analysis-skeleton__table-cell"
                    style={{
                      width: colIndex === cols - 1 ? "60%" : "80%",
                      animationDelay: `${(rowIndex * cols + colIndex) * 0.05}s`,
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
  return [{}, {}, {}, {}, { wide: true, tall: true }];
}

export function tenantFormSkeletonFields(): AnalysisFormSkeletonField[] {
  return Array.from({ length: 9 }, () => ({}));
}
