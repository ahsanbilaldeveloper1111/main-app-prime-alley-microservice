import {
  ATTENDANCE_REPORT_INNER_TABS,
  isAttendanceReportInnerTabId,
  type AttendanceReportInnerTabId,
} from "@page-modules/workforce/attendance-reports/attendanceReportInnerTabs";
import { DailyAttendanceReportPanel } from "@page-modules/workforce/attendance-reports/DailyAttendanceReportPanel";
import { MonthlyAttendanceReportPanel } from "@page-modules/workforce/attendance-reports/MonthlyAttendanceReportPanel";
import { TeamAttendanceSnapshotPanel } from "@page-modules/workforce/attendance-reports/TeamAttendanceSnapshotPanel";
import { useShiftManagementTenant } from "@page-modules/workforce/shifts/useShiftManagementTenant";
import { WorkforceInnerTabLayout } from "@page-modules/workforce/shared/WorkforceInnerTabLayout";
import React, { useState } from "react";

export function AttendanceAnalyticsTab() {
  const [innerTab, setInnerTab] = useState<AttendanceReportInnerTabId>("daily-report");

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
      <div className="attendance-analytics-page__empty">
        Company context is not available. Sign in again or select a company to view attendance
        analytics.
      </div>
    );
  }

  const panelProps = {
    resolvedTenantId,
    isTenantListReady,
    isWorkforceAdmin,
    tenantOptions,
    tenantOptionsLoading,
    onTenantChange: setManualTenantId,
  };

  return (
    <WorkforceInnerTabLayout
      tabs={ATTENDANCE_REPORT_INNER_TABS}
      activeTabId={innerTab}
      onSelectTab={(tabId) => {
        if (isAttendanceReportInnerTabId(tabId)) {
          setInnerTab(tabId);
        }
      }}
    >
      {innerTab === "daily-report" ? <DailyAttendanceReportPanel {...panelProps} /> : null}
      {innerTab === "monthly-report" ? <MonthlyAttendanceReportPanel {...panelProps} /> : null}
      {innerTab === "team-snapshot" ? <TeamAttendanceSnapshotPanel {...panelProps} /> : null}
    </WorkforceInnerTabLayout>
  );
}
