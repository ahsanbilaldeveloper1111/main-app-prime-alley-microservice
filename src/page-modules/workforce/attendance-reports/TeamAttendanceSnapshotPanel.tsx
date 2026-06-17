import { TeamAttendanceSnapshotChartsView } from "@page-modules/workforce/attendance-reports/TeamAttendanceSnapshotChartsView";
import { TeamAttendanceSnapshotFilters } from "@page-modules/workforce/attendance-reports/TeamAttendanceSnapshotFilters";
import { AttendanceCorrectionModal } from "@page-modules/workforce/attendance-reports/AttendanceCorrectionModal";
import type { AttendanceCorrectionTarget } from "@page-modules/workforce/attendance-reports/attendanceCorrectionDomain";
import { consumeHandledAttendanceError } from "@page-modules/workforce/attendance/attendanceDomain";
import { useCreateAttendanceCorrectionMutation } from "@page-modules/workforce/attendance-reports/useCreateAttendanceCorrectionMutation";
import type { AttendanceReportPanelProps } from "@page-modules/workforce/attendance-reports/attendanceReportPanelTypes";
import { defaultDailyReportDate } from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import {
  buildUserNameByExtensionMap,
  isTeamAttendanceSnapshotStatusFilter,
  resolveTeamSnapshotEmployeeName,
} from "@page-modules/workforce/attendance-reports/teamAttendanceSnapshotDomain";
import { useDailyReportExtensionOptions } from "@page-modules/workforce/attendance-reports/useDailyReportExtensionOptions";
import { useTeamAttendanceSnapshotQuery } from "@page-modules/workforce/attendance-reports/useTeamAttendanceSnapshotQuery";
import { useDebouncedValue } from "@hooks/useDebouncedValue";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import type {
  AttendanceCorrectionPayload,
  TeamAttendanceSnapshotEmployee,
  TeamAttendanceSnapshotStatusFilter,
} from "@utils/staffManagement";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

export function TeamAttendanceSnapshotPanel({
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
  const [statusFilter, setStatusFilter] = useState<TeamAttendanceSnapshotStatusFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceCorrectionTarget | null>(null);
  const debouncedSearch = useDebouncedValue(searchValue, 400);

  const correctionMutation = useCreateAttendanceCorrectionMutation();

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

  const snapshotQuery = useTeamAttendanceSnapshotQuery({
    tenantId: resolvedTenantId || null,
    date: reportDate,
    departmentId: isWorkforceAdmin ? parsedDepartmentId : null,
    extensions: selectedExtensions,
    status: statusFilter,
    search: debouncedSearch,
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

  const userNameByExtension = useMemo(
    () => buildUserNameByExtensionMap(mainAppUsers),
    [mainAppUsers],
  );

  const departmentNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const department of mainAppDepartments) {
      if (department.id == null || !Number.isFinite(department.id)) {
        continue;
      }
      map.set(department.id, department.name?.trim() || `Department #${department.id}`);
    }
    return map;
  }, [mainAppDepartments]);

  const snapshot = snapshotQuery.data;
  const resolvedReportDate = snapshot?.date?.trim() || reportDate;
  const summary = snapshot?.summary ?? {};
  const employees = snapshot?.employees ?? [];

  const handleOpenCorrection = useCallback(
    (employee: TeamAttendanceSnapshotEmployee) => {
      const userId = employee.user_id?.trim();
      if (!userId) {
        toast.error("Employee extension is required for attendance correction.");
        return;
      }

      setCorrectionTarget({
        userId,
        employeeName: resolveTeamSnapshotEmployeeName(employee, userNameByExtension),
        workDate: resolvedReportDate,
        initialStatus: employee.status,
      });
    },
    [resolvedReportDate, userNameByExtension],
  );

  const handleCloseCorrection = useCallback(() => {
    if (correctionMutation.isPending) {
      return;
    }
    setCorrectionTarget(null);
  }, [correctionMutation.isPending]);

  const handleSubmitCorrection = useCallback(
    (payload: AttendanceCorrectionPayload) => {
      correctionMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Attendance correction submitted.");
          setCorrectionTarget(null);
        },
        onError: (error: unknown) => {
          consumeHandledAttendanceError(error, "TeamSnapshot.attendanceCorrection");
          toast.error("Failed to submit attendance correction.");
        },
      });
    },
    [correctionMutation],
  );

  if (!resolvedTenantId) {
    return (
      <p className="attendance-analytics-panel__message">
        Select a tenant to view the team attendance snapshot.
      </p>
    );
  }

  if (snapshotQuery.isError) {
    return (
      <div className="attendance-analytics-panel__message attendance-analytics-panel__message--error">
        <p>Failed to load team attendance snapshot.</p>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => snapshotQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="attendance-analytics-panel">
      <TeamAttendanceSnapshotFilters
        isWorkforceAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        tenantOptionsLoading={tenantOptionsLoading}
        activeTenantId={resolvedTenantId}
        onTenantChange={onTenantChange}
        reportDate={reportDate}
        departmentId={departmentId}
        selectedExtensions={selectedExtensions}
        statusFilter={statusFilter}
        searchValue={searchValue}
        departments={mainAppDepartments}
        departmentsLoading={lookupsLoading}
        extensionOptions={extensionOptions}
        extensionsLoading={extensionsLoading || lookupsLoading}
        onReportDateChange={setReportDate}
        onDepartmentChange={setDepartmentId}
        onExtensionsChange={setSelectedExtensions}
        onStatusFilterChange={(value) => {
          if (isTeamAttendanceSnapshotStatusFilter(value)) {
            setStatusFilter(value);
          }
        }}
        onSearchChange={setSearchValue}
      />

      <TeamAttendanceSnapshotChartsView
        summary={summary}
        employees={employees}
        userNameByExtension={userNameByExtension}
        departmentNameById={departmentNameById}
        reportDate={resolvedReportDate}
        loading={snapshotQuery.isFetching}
        onCorrectEmployee={handleOpenCorrection}
      />

      <AttendanceCorrectionModal
        show={correctionTarget != null}
        tenantId={resolvedTenantId}
        target={correctionTarget}
        isSubmitting={correctionMutation.isPending}
        onClose={handleCloseCorrection}
        onSubmit={handleSubmitCorrection}
      />
    </div>
  );
}
