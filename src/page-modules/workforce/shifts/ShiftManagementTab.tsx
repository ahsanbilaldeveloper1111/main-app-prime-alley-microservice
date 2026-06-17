import { ShiftAssignmentsPanel } from "@page-modules/workforce/shifts/ShiftAssignmentsPanel";

import { StaffShiftsPanel } from "@page-modules/workforce/shifts/StaffShiftsPanel";

import {

  isShiftManagementInnerTabId,

  SHIFT_MANAGEMENT_INNER_TABS,

  type ShiftManagementInnerTabId,

} from "@page-modules/workforce/shifts/shiftManagementInnerTabs";

import { useShiftManagementTenant } from "@page-modules/workforce/shifts/useShiftManagementTenant";

import { PoliciesAttendanceInnerTabLayout } from "@page-modules/workforce/shared/PoliciesAttendanceInnerTabLayout";

import React, { useState } from "react";



export function ShiftManagementTab() {

  const [innerTab, setInnerTab] = useState<ShiftManagementInnerTabId>("shifts");



  const {

    companyIdentifier,

    isWorkforceAdmin,

    tenantOptions,

    tenantOptionsLoading,

    isTenantListReady,

    resolvedTenantId,

    setManualTenantId,

  } = useShiftManagementTenant();



  if (!companyIdentifier) {

    return (

      <div className="settings-section-shell__no-permission">

        Company context is not available. Sign in again or select a company to load shifts.

      </div>

    );

  }



  const panelProps = {

    resolvedTenantId,

    companyIdentifier,

    isTenantListReady,

    isWorkforceAdmin,

    tenantOptions,

    tenantOptionsLoading,

    onTenantChange: setManualTenantId,

  };



  return (

    <PoliciesAttendanceInnerTabLayout

      tabs={SHIFT_MANAGEMENT_INNER_TABS}

      activeTabId={innerTab}

      onSelectTab={(tabId) => {

        if (isShiftManagementInnerTabId(tabId)) {

          setInnerTab(tabId);

        }

      }}

    >

      {innerTab === "shifts" ? <StaffShiftsPanel {...panelProps} /> : null}

      {innerTab === "shift-assignments" ? <ShiftAssignmentsPanel {...panelProps} /> : null}

    </PoliciesAttendanceInnerTabLayout>

  );

}


