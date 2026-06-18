import {
  SettingsEmbeddedFilterField,
  SettingsEmbeddedFilters,
} from "@components/main-settings/SettingsEmbeddedFilters";
import { MainSettingsDatePicker } from "@components/main-settings/MainSettingsFormPrimitives";
import { AttendanceReportTenantFilterField } from "@page-modules/workforce/attendance-reports/AttendanceReportTenantFilter";
import type { AttendanceReportPanelProps } from "@page-modules/workforce/attendance-reports/attendanceReportPanelTypes";
import SelectBox from "@components/SelectBox";
import type { MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
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

export type DailyAttendanceReportFiltersProps = Readonly<
  Pick<
    AttendanceReportPanelProps,
    "isWorkforceAdmin" | "tenantOptions" | "tenantOptionsLoading" | "onTenantChange"
  > & {
    activeTenantId: string;
    reportDate: string;
    departmentId: string;
    selectedExtensions: readonly string[];
    departments: readonly MainAppDepartmentLookup[];
    departmentsLoading: boolean;
    extensionOptions: ReadonlyArray<{ value: string; label: string }>;
    extensionsLoading: boolean;
    onReportDateChange: (value: string) => void;
    onDepartmentChange: (departmentId: string) => void;
    onExtensionsChange: (extensions: string[]) => void;
  }
>;

export function DailyAttendanceReportFilters({
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  activeTenantId,
  onTenantChange,
  reportDate,
  departmentId,
  selectedExtensions,
  departments,
  departmentsLoading,
  extensionOptions,
  extensionsLoading,
  onReportDateChange,
  onDepartmentChange,
  onExtensionsChange,
}: DailyAttendanceReportFiltersProps) {
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

        <SettingsEmbeddedFilterField id="daily-report-date" label="Report date">
          <MainSettingsDatePicker
            id="daily-report-date"
            value={reportDate}
            onChange={onReportDateChange}
          />
        </SettingsEmbeddedFilterField>

        <SettingsEmbeddedFilterField id="daily-report-department" label="Department">
          <Form.Select
            id="daily-report-department"
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

        <SettingsEmbeddedFilterField id="daily-report-extensions" label="Extensions">
          <SelectBox
            inputId="daily-report-extensions"
            className="daily-attendance-report-extensions-select"
            classNamePrefix="daily-attendance-report-extensions-select"
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
