import {
  SettingsEmbeddedFilterField,
  SettingsEmbeddedFilters,
} from "@components/main-settings/SettingsEmbeddedFilters";
import { MainSettingsDatePicker } from "@components/main-settings/MainSettingsFormPrimitives";
import { AttendanceReportTenantFilterField } from "@page-modules/workforce/attendance-reports/AttendanceReportTenantFilter";
import type { AttendanceReportPanelProps } from "@page-modules/workforce/attendance-reports/attendanceReportPanelTypes";
import { TEAM_SNAPSHOT_STATUS_FILTER_OPTIONS } from "@page-modules/workforce/attendance-reports/teamAttendanceSnapshotDomain";
import SelectBox from "@components/SelectBox";
import type { MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
import type { TeamAttendanceSnapshotStatusFilter } from "@utils/staffManagement";
import React from "react";
import { Form } from "react-bootstrap";

const filterControlClassName =
  "settings-embedded-page__filter-control main-settings-form-select form-select";

function resolveExtensionsPlaceholder(
  extensionsLoading: boolean,
  optionCount: number,
): string {
  if (extensionsLoading) return "Loading extensions...";
  if (optionCount === 0) return "No extensions available";
  return "All extensions";
}

export type TeamAttendanceSnapshotFiltersProps = Readonly<
  Pick<
    AttendanceReportPanelProps,
    "isWorkforceAdmin" | "tenantOptions" | "tenantOptionsLoading" | "onTenantChange"
  > & {
    activeTenantId: string;
    reportDate: string;
    departmentId: string;
    selectedExtensions: readonly string[];
    statusFilter: TeamAttendanceSnapshotStatusFilter;
    searchValue: string;
    departments: readonly MainAppDepartmentLookup[];
    departmentsLoading: boolean;
    extensionOptions: ReadonlyArray<{ value: string; label: string }>;
    extensionsLoading: boolean;
    onReportDateChange: (value: string) => void;
    onDepartmentChange: (departmentId: string) => void;
    onExtensionsChange: (extensions: string[]) => void;
    onStatusFilterChange: (status: TeamAttendanceSnapshotStatusFilter) => void;
    onSearchChange: (value: string) => void;
  }
>;

export function TeamAttendanceSnapshotFilters({
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  activeTenantId,
  onTenantChange,
  reportDate,
  departmentId,
  selectedExtensions,
  statusFilter,
  searchValue,
  departments,
  departmentsLoading,
  extensionOptions,
  extensionsLoading,
  onReportDateChange,
  onDepartmentChange,
  onExtensionsChange,
  onStatusFilterChange,
  onSearchChange,
}: TeamAttendanceSnapshotFiltersProps) {
  const extensionsPlaceholder = resolveExtensionsPlaceholder(
    extensionsLoading,
    extensionOptions.length,
  );

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

        <SettingsEmbeddedFilterField id="team-snapshot-date" label="Snapshot date">
          <MainSettingsDatePicker
            id="team-snapshot-date"
            value={reportDate}
            onChange={onReportDateChange}
          />
        </SettingsEmbeddedFilterField>

        {isWorkforceAdmin ? (
          <SettingsEmbeddedFilterField id="team-snapshot-department" label="Department">
            <Form.Select
              id="team-snapshot-department"
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
        ) : null}

        <SettingsEmbeddedFilterField id="team-snapshot-status" label="Status">
          <Form.Select
            id="team-snapshot-status"
            size="sm"
            className={filterControlClassName}
            aria-label="Status filter"
            value={statusFilter}
            onChange={(event) => {
              onStatusFilterChange(event.target.value as TeamAttendanceSnapshotStatusFilter);
            }}
          >
            {TEAM_SNAPSHOT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </SettingsEmbeddedFilterField>

        <SettingsEmbeddedFilterField id="team-snapshot-search" label="Search">
          <Form.Control
            id="team-snapshot-search"
            size="sm"
            type="search"
            className={filterControlClassName}
            placeholder="Employee code or extension"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </SettingsEmbeddedFilterField>

        <SettingsEmbeddedFilterField id="team-snapshot-extensions" label="Extensions">
          <SelectBox
            inputId="team-snapshot-extensions"
            className="team-attendance-snapshot-extensions-select"
            classNamePrefix="team-attendance-snapshot-extensions-select"
            options={[...extensionOptions]}
            value={selectedExtensions.length > 0 ? [...selectedExtensions] : null}
            isMulti
            isSearchable
            isClearable
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            isDisabled={extensionsLoading || extensionOptions.length === 0}
            placeholder={extensionsPlaceholder}
            onChange={(value) => {
              const extensions = Array.isArray(value) ? value.map(String) : [];
              onExtensionsChange(extensions);
            }}
          />
        </SettingsEmbeddedFilterField>
      </SettingsEmbeddedFilters>
    </div>
  );
}
