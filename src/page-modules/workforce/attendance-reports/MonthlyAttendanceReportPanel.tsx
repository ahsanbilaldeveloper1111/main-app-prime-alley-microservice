import { MonthlyAttendanceReportChartsView } from "@page-modules/workforce/attendance-reports/MonthlyAttendanceReportChartsView";
import { MonthlyAttendanceReportFilters } from "@page-modules/workforce/attendance-reports/MonthlyAttendanceReportFilters";
import type { AttendanceReportPanelProps } from "@page-modules/workforce/attendance-reports/attendanceReportPanelTypes";
import {
  buildMonthlyReportUserLabelMap,
  defaultMonthlyReportMonth,
} from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportDomain";
import { useMonthlyAttendanceReportQuery } from "@page-modules/workforce/attendance-reports/useMonthlyAttendanceReportQuery";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import React, { useMemo, useState } from "react";
import { Button } from "react-bootstrap";

export function MonthlyAttendanceReportPanel({
  resolvedTenantId,
  isTenantListReady,
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  onTenantChange,
}: AttendanceReportPanelProps) {
  const [reportMonth, setReportMonth] = useState(defaultMonthlyReportMonth);
  const [departmentId, setDepartmentId] = useState("");

  const { mainAppDepartments, mainAppUsers, loading: lookupsLoading } = useMainAppLookups();

  const parsedDepartmentId = useMemo(() => {
    const trimmed = departmentId.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }, [departmentId]);

  const monthlyReportQuery = useMonthlyAttendanceReportQuery({
    tenantId: resolvedTenantId || null,
    month: reportMonth,
    departmentId: parsedDepartmentId,
    enabled: isTenantListReady,
  });

  const userLabelById = useMemo(
    () => buildMonthlyReportUserLabelMap(mainAppUsers),
    [mainAppUsers],
  );

  const reportData = monthlyReportQuery.data;
  const reportRows = reportData?.employees ?? [];
  const trendRows = reportData?.trend ?? [];

  if (!resolvedTenantId) {
    return (
      <p className="attendance-analytics-panel__message">
        Select a tenant to view the monthly attendance report.
      </p>
    );
  }

  if (monthlyReportQuery.isError) {
    return (
      <div className="attendance-analytics-panel__message attendance-analytics-panel__message--error">
        <p>Failed to load monthly attendance report.</p>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => monthlyReportQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="attendance-analytics-panel">
      <MonthlyAttendanceReportFilters
        isWorkforceAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        tenantOptionsLoading={tenantOptionsLoading}
        activeTenantId={resolvedTenantId}
        onTenantChange={onTenantChange}
        reportMonth={reportMonth}
        departmentId={departmentId}
        departments={mainAppDepartments}
        departmentsLoading={lookupsLoading}
        onReportMonthChange={setReportMonth}
        onDepartmentChange={setDepartmentId}
      />

      <MonthlyAttendanceReportChartsView
        rows={reportRows}
        trend={trendRows}
        summary={reportData?.summary ?? {}}
        userLabelById={userLabelById}
        reportMonth={reportMonth}
        apiMonth={reportData?.month}
        loading={monthlyReportQuery.isFetching}
      />
    </div>
  );
}
