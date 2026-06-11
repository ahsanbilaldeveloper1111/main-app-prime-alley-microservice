import React, { useState } from "react";

import { MainSettingsOverflowTabBar } from "@components/main-settings/MainSettingsOverflowTabBar";

import "./aiAnalysisTenantConfig.scss";

import { CompanyFilterBar } from "./AnalysisTenantShared";
import { AnalysisConfigAuthoringPanel } from "./config-authoring/AnalysisConfigAuthoringPanel";
import { AnalysisTenantSettingsPanel } from "./AnalysisTenantSettingsPanel";
import {
  TENANT_CONFIG_INNER_TABS,
  type TenantConfigInnerTab,
} from "./tenantConfigInnerTabs";
import { useAIAnalysisTenantPage } from "./useAIAnalysisTenantPage";

export const AnalysisTenantConfigTab: React.FC = () => {
  const [innerTab, setInnerTab] = useState<TenantConfigInnerTab>("settings");

  const {
    companiesLoading,
    companyOptions,
    selectedCompanyOption,
    appliedCompanyLabel,
    appliedTenantId,
    handleCompanySelect,
    handleApplyFilter,
    tenantQuery,
    saveMutation,
  } = useAIAnalysisTenantPage();

  return (
    <div className="ai-analysis-tenant-config">
      <header>
        <h2 className="ai-analysis-tenant-config__heading">Tenant config</h2>
        <p className="ai-analysis-tenant-config__subheading">
          Configure per-company limits, analysis config authoring, and cost overrides.
        </p>
      </header>

      <CompanyFilterBar
        companiesLoading={companiesLoading}
        companyOptions={companyOptions}
        selectedCompanyOption={selectedCompanyOption}
        onCompanySelect={handleCompanySelect}
        onApplyFilter={handleApplyFilter}
        appliedCompanyLabel={appliedCompanyLabel}
        selectClassPrefix="ai-analysis-tenant-config-company"
      />

      <MainSettingsOverflowTabBar
        tabs={TENANT_CONFIG_INNER_TABS}
        activeTabId={innerTab}
        onSelect={(tabId) => setInnerTab(tabId as TenantConfigInnerTab)}
        tabBarShellClassName="ai-analysis-tenant-config__inner-tab-bar"
        tabRowClassName="ai-analysis-tenant-config__inner-tab-row main-settings-overflow-tab-bar__row"
        tabButtonClassName="ai-analysis-tenant-config__inner-tab-btn"
        tabButtonActiveClassName="ai-analysis-tenant-config__inner-tab-btn--active"
      />

      {innerTab === "settings" ? (
        <AnalysisTenantSettingsPanel
          appliedTenantId={appliedTenantId}
          appliedCompanyLabel={appliedCompanyLabel}
          tenantQuery={tenantQuery}
          saveMutation={saveMutation}
        />
      ) : null}

      {innerTab === "config-authoring" ? (
        <AnalysisConfigAuthoringPanel
          appliedCompanyId={appliedTenantId}
          appliedCompanyLabel={appliedCompanyLabel}
        />
      ) : null}
    </div>
  );
};
