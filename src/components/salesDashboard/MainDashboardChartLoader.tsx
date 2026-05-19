"use client";

import React from "react";

export function MainDashboardChartLoader({
  children,
  isLoading = false,
}: Readonly<{ children: React.ReactNode; isLoading?: boolean }>) {
  return (
    <div className="sales-dashboard__chart-loader-wrap" aria-busy={isLoading}>
      {children}
      {isLoading ? (
        <div className="sales-dashboard__chart-loader-overlay" aria-label="Loading chart data">
          <output className="sales-dashboard__chart-loader-output" aria-live="polite">
            <span
              className="spinner-border text-primary sales-dashboard__chart-loader-spinner"
              aria-hidden="true"
            />
            <span className="visually-hidden">Loading chart data</span>
          </output>
        </div>
      ) : null}
    </div>
  );
}
