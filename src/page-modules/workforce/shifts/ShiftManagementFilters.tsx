import {
  SettingsEmbeddedFilterField,
  SettingsEmbeddedFilters,
} from "@components/main-settings/SettingsEmbeddedFilters";
import {
  SHIFT_STATUS_FILTER_OPTIONS,
  SHIFT_TYPE_FILTER_OPTIONS,
  type ShiftTenantOption,
} from "@page-modules/workforce/shifts/shiftManagementDomain";
import React from "react";
import { Form } from "react-bootstrap";

const filterControlClassName =
  "settings-embedded-page__filter-control main-settings-form-select form-select";

export type ShiftManagementFiltersProps = Readonly<{
  isWorkforceAdmin: boolean;
  tenantOptions: readonly ShiftTenantOption[];
  tenantOptionsLoading: boolean;
  activeTenantId: string;
  statusFilter: string;
  typeFilter: string;
  onTenantChange: (tenantId: string) => void;
  onStatusChange: (status: string) => void;
  onTypeChange: (type: string) => void;
}>;

export function ShiftManagementFilters({
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  activeTenantId,
  statusFilter,
  typeFilter,
  onTenantChange,
  onStatusChange,
  onTypeChange,
}: ShiftManagementFiltersProps) {
  return (
    <SettingsEmbeddedFilters>
      {isWorkforceAdmin ? (
        <SettingsEmbeddedFilterField id="shift-filter-tenant" label="Tenant">
          <Form.Select
            id="shift-filter-tenant"
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
      ) : null}

      <SettingsEmbeddedFilterField id="shift-filter-status" label="Status">
        <Form.Select
          id="shift-filter-status"
          size="sm"
          className={filterControlClassName}
          aria-label="Shift status filter"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          {SHIFT_STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </SettingsEmbeddedFilterField>

      <SettingsEmbeddedFilterField id="shift-filter-type" label="Type">
        <Form.Select
          id="shift-filter-type"
          size="sm"
          className={filterControlClassName}
          aria-label="Shift type filter"
          value={typeFilter}
          onChange={(event) => onTypeChange(event.target.value)}
        >
          {SHIFT_TYPE_FILTER_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </SettingsEmbeddedFilterField>
    </SettingsEmbeddedFilters>
  );
}
