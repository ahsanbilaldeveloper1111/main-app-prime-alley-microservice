import { CompanyConfigFilters } from "@page-modules/workforce/company-config/CompanyConfigFilters";

import {

  COMPANY_CONFIG_INNER_TABS,

  isCompanyConfigInnerTabId,

  type CompanyConfigInnerTabId,

} from "@page-modules/workforce/company-config/companyConfigInnerTabs";

import { BreakTypesPanel } from "@page-modules/workforce/company-config/BreakTypesPanel";

import { BreaksPolicyPanel } from "@page-modules/workforce/company-config/BreaksPolicyPanel";

import { GracePeriodPolicyPanel } from "@page-modules/workforce/company-config/GracePeriodPolicyPanel";

import { OvertimePolicyPanel } from "@page-modules/workforce/company-config/OvertimePolicyPanel";

import { useCompanyConfigTenant } from "@page-modules/workforce/company-config/useCompanyConfigTenant";

import { WorkHoursPolicyPanel } from "@page-modules/workforce/company-config/WorkHoursPolicyPanel";

import { PoliciesAttendanceInnerTabLayout } from "@page-modules/workforce/shared/PoliciesAttendanceInnerTabLayout";

import React, { useState } from "react";



export function CompanyConfigTab() {

  const [innerTab, setInnerTab] = useState<CompanyConfigInnerTabId>("work-hours");



  const {

    companyIdentifier,

    isWorkforceAdmin,

    tenantOptions,

    tenantOptionsLoading,

    isTenantListReady,

    resolvedTenantId,

    setManualTenantId,

  } = useCompanyConfigTenant();



  if (!isWorkforceAdmin && !companyIdentifier) {

    return (

      <div className="settings-section-shell__no-permission">

        Company context is not available. Sign in again or select a company to manage policies.

      </div>

    );

  }



  return (

    <PoliciesAttendanceInnerTabLayout

      tabs={COMPANY_CONFIG_INNER_TABS}

      activeTabId={innerTab}

      onSelectTab={(tabId) => {

        if (isCompanyConfigInnerTabId(tabId)) {

          setInnerTab(tabId);

        }

      }}

    >

      <CompanyConfigFilters

        isWorkforceAdmin={isWorkforceAdmin}

        tenantOptions={tenantOptions}

        tenantOptionsLoading={tenantOptionsLoading}

        activeTenantId={resolvedTenantId}

        onTenantChange={setManualTenantId}

      />



      {innerTab === "work-hours" ? (

        <WorkHoursPolicyPanel

          resolvedTenantId={resolvedTenantId}

          isTenantListReady={isTenantListReady}

          isWorkforceAdmin={isWorkforceAdmin}

          tenantOptions={tenantOptions}

        />

      ) : null}



      {innerTab === "grace-period" ? (

        <GracePeriodPolicyPanel

          resolvedTenantId={resolvedTenantId}

          isTenantListReady={isTenantListReady}

        />

      ) : null}



      {innerTab === "breaks" ? (

        <BreaksPolicyPanel

          resolvedTenantId={resolvedTenantId}

          isTenantListReady={isTenantListReady}

          isWorkforceAdmin={isWorkforceAdmin}

          tenantOptions={tenantOptions}

        />

      ) : null}



      {innerTab === "overtime" ? (

        <OvertimePolicyPanel

          resolvedTenantId={resolvedTenantId}

          isTenantListReady={isTenantListReady}

          isWorkforceAdmin={isWorkforceAdmin}

          tenantOptions={tenantOptions}

        />

      ) : null}



      {innerTab === "break-types" ? (

        <BreakTypesPanel

          resolvedTenantId={resolvedTenantId}

          isTenantListReady={isTenantListReady}

          isWorkforceAdmin={isWorkforceAdmin}

          tenantOptions={tenantOptions}

        />

      ) : null}

    </PoliciesAttendanceInnerTabLayout>

  );

}


