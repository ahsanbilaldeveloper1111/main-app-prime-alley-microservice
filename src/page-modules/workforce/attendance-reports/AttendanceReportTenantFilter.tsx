import {
  SettingsEmbeddedFilterField,
  SettingsEmbeddedFilters,
} from "@components/main-settings/SettingsEmbeddedFilters";
import type { ShiftTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";
import React from "react";
import { Form } from "react-bootstrap";

const filterControlClassName =
  "settings-embedded-page__filter-control main-settings-form-select form-select";

export type AttendanceReportTenantFilterFieldProps = Readonly<{
  isWorkforceAdmin: boolean;
  tenantOptions: readonly ShiftTenantOption[];
  tenantOptionsLoading: boolean;
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
}>;

export function AttendanceReportTenantFilterField({
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  activeTenantId,
  onTenantChange,
}: AttendanceReportTenantFilterFieldProps) {
  if (!isWorkforceAdmin) {
    return null;
  }

  return (
    <SettingsEmbeddedFilterField id="attendance-report-filter-tenant" label="Tenant">
      <Form.Select
        id="attendance-report-filter-tenant"
        size="sm"
        className={filterControlClassName}
        aria-label="Tenant filter"
        value={activeTenantId}
        disabled={tenantOptionsLoading || tenantOptions.length === 0}
        onChange={(event) => onTenantChange(event.target.value)}
      >
        {tenantOptions.length === 0 ? (
          <option value="">No tenants</option>
        ) : (
          tenantOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        )}
      </Form.Select>
    </SettingsEmbeddedFilterField>
  );
}

/** @deprecated Use AttendanceReportTenantFilterField inside a shared SettingsEmbeddedFilters row. */
export function AttendanceReportTenantFilter(props: AttendanceReportTenantFilterFieldProps) {
  return (
    <SettingsEmbeddedFilters>
      <AttendanceReportTenantFilterField {...props} />
    </SettingsEmbeddedFilters>
  );
}
