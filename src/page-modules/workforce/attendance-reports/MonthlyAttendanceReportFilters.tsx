import {
  SettingsEmbeddedFilterField,
  SettingsEmbeddedFilters,
} from "@components/main-settings/SettingsEmbeddedFilters";
import { AttendanceReportTenantFilterField } from "@page-modules/workforce/attendance-reports/AttendanceReportTenantFilter";
import type { AttendanceReportPanelProps } from "@page-modules/workforce/attendance-reports/attendanceReportPanelTypes";
import type { MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
import React from "react";
import { Form } from "react-bootstrap";

const filterControlClassName =
  "settings-embedded-page__filter-control main-settings-form-select form-select";

export type MonthlyAttendanceReportFiltersProps = Readonly<
  Pick<
    AttendanceReportPanelProps,
    "isWorkforceAdmin" | "tenantOptions" | "tenantOptionsLoading" | "onTenantChange"
  > & {
    activeTenantId: string;
    reportMonth: string;
    departmentId: string;
    departments: readonly MainAppDepartmentLookup[];
    departmentsLoading: boolean;
    onReportMonthChange: (value: string) => void;
    onDepartmentChange: (departmentId: string) => void;
  }
>;

export function MonthlyAttendanceReportFilters({
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  activeTenantId,
  onTenantChange,
  reportMonth,
  departmentId,
  departments,
  departmentsLoading,
  onReportMonthChange,
  onDepartmentChange,
}: MonthlyAttendanceReportFiltersProps) {
  return (
    <div className="attendance-analytics-filters">
      <SettingsEmbeddedFilters>
        <AttendanceReportTenantFilterField
          isWorkforceAdmin={isWorkforceAdmin}
          tenantOptions={tenantOptions}
          tenantOptionsLoading={tenantOptionsLoading}
          activeTenantId={activeTenantId}
          onTenantChange={onTenantChange}
        />

        <SettingsEmbeddedFilterField id="monthly-report-month" label="Report month">
          <Form.Control
            id="monthly-report-month"
            type="month"
            className={filterControlClassName}
            aria-label="Report month"
            value={reportMonth}
            onChange={(event) => onReportMonthChange(event.target.value)}
          />
        </SettingsEmbeddedFilterField>

        <SettingsEmbeddedFilterField id="monthly-report-department" label="Department">
          <Form.Select
            id="monthly-report-department"
            size="sm"
            className={filterControlClassName}
            aria-label="Department filter"
            value={departmentId}
            disabled={departmentsLoading}
            onChange={(event) => onDepartmentChange(event.target.value)}
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={String(department.id)} value={String(department.id)}>
                {department.name?.trim() || `Department #${department.id}`}
              </option>
            ))}
          </Form.Select>
        </SettingsEmbeddedFilterField>
      </SettingsEmbeddedFilters>
    </div>
  );
}
