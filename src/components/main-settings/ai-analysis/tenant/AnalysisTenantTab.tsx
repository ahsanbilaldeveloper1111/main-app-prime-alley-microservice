import React from "react";

import "./aiAnalysisTenant.scss";

import { TenantsTable } from "./AnalysisTenantShared";
import { useAnalysisTenantListPage } from "./useAnalysisTenantListPage";

export const AnalysisTenantTab: React.FC = () => {
  const { rows, isLoading, isError, sessionTenantId, refetch } =
    useAnalysisTenantListPage();

  return (
    <div className="ai-analysis-tenant">
      <header>
        <h2 className="ai-analysis-tenant__heading">Analysis tenants</h2>
        <p className="ai-analysis-tenant__subheading">
          View per-tenant limits, thresholds, and cost overrides for your company.
          Use Tenant Config to edit settings.
        </p>
      </header>

      {sessionTenantId ? (
        <TenantsTable
          rows={rows}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => {
            refetch().catch(() => undefined);
          }}
        />
      ) : (
        <p className="ai-analysis-tenant__hint">
          No tenant is associated with your account.
        </p>
      )}
    </div>
  );
};
