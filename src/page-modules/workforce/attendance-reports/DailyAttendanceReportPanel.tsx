import { DailyAttendanceReportChartsView } from "@page-modules/workforce/attendance-reports/DailyAttendanceReportChartsView";
import { DailyAttendanceReportFilters } from "@page-modules/workforce/attendance-reports/DailyAttendanceReportFilters";
import type { AttendanceReportPanelProps } from "@page-modules/workforce/attendance-reports/attendanceReportPanelTypes";
import { defaultDailyReportDate } from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import { useDailyAttendanceReportQuery } from "@page-modules/workforce/attendance-reports/useDailyAttendanceReportQuery";
import { useDailyReportExtensionOptions } from "@page-modules/workforce/attendance-reports/useDailyReportExtensionOptions";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";

export function DailyAttendanceReportPanel({
  resolvedTenantId,
  isTenantListReady,
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  onTenantChange,
}: AttendanceReportPanelProps) {
  const [reportDate, setReportDate] = useState(defaultDailyReportDate);
  const [departmentId, setDepartmentId] = useState("");
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);

  const {
    mainAppDepartments,
    mainAppUsers,
    companyIdentifier,
    loading: lookupsLoading,
  } = useMainAppLookups();

  const parsedDepartmentId = useMemo(() => {
    const trimmed = departmentId.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }, [departmentId]);

  const dailyReportQuery = useDailyAttendanceReportQuery({
    tenantId: resolvedTenantId || null,
    date: reportDate,
    departmentId: parsedDepartmentId,
    extensions: selectedExtensions,
    enabled: isTenantListReady,
  });

  const { extensionOptions, extensionsLoading } = useDailyReportExtensionOptions({
    companyIdentifier,
    departmentId: parsedDepartmentId,
    fallbackUsers: mainAppUsers,
    enabled: isTenantListReady,
  });

  useEffect(() => {
    const allowedExtensions = new Set(extensionOptions.map((option) => option.value));
    setSelectedExtensions((current) => {
      const next = current.filter((extension) => allowedExtensions.has(extension));
      return next.length === current.length ? current : next;
    });
  }, [extensionOptions]);

  const userLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of extensionOptions) {
      map.set(option.value, option.label);
    }
    return map;
  }, [extensionOptions]);

  const reportRows = dailyReportQuery.data?.data ?? [];

  if (!resolvedTenantId) {
    return (
      <p className="attendance-analytics-panel__message">
        Select a tenant to view the daily attendance report.
      </p>
    );
  }

  if (dailyReportQuery.isError) {
    return (
      <div className="attendance-analytics-panel__message attendance-analytics-panel__message--error">
        <p>Failed to load daily attendance report.</p>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => dailyReportQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="attendance-analytics-panel">
      <DailyAttendanceReportFilters
        isWorkforceAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        tenantOptionsLoading={tenantOptionsLoading}
        activeTenantId={resolvedTenantId}
        onTenantChange={onTenantChange}
        reportDate={reportDate}
        departmentId={departmentId}
        selectedExtensions={selectedExtensions}
        departments={mainAppDepartments}
        departmentsLoading={lookupsLoading}
        extensionOptions={extensionOptions}
        extensionsLoading={extensionsLoading || lookupsLoading}
        onReportDateChange={setReportDate}
        onDepartmentChange={setDepartmentId}
        onExtensionsChange={setSelectedExtensions}
      />

      <DailyAttendanceReportChartsView
        rows={reportRows}
        userLabelById={userLabelById}
        reportDate={reportDate}
        loading={dailyReportQuery.isFetching}
      />
    </div>
  );
}
