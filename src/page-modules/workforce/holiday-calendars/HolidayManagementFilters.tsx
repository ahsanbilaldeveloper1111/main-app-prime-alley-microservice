import {
  SettingsEmbeddedFilterField,
  SettingsEmbeddedFilters,
} from "@components/main-settings/SettingsEmbeddedFilters";
import {
  HOLIDAY_CALENDAR_STATUS_FILTER_OPTIONS,
  buildHolidayYearFilterOptions,
  type HolidayTenantOption,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import React, { useMemo } from "react";
import { Form } from "react-bootstrap";

const filterControlClassName =
  "settings-embedded-page__filter-control main-settings-form-select form-select";

export type HolidayManagementFiltersProps = Readonly<{
  isWorkforceAdmin: boolean;
  tenantOptions: readonly HolidayTenantOption[];
  tenantOptionsLoading: boolean;
  activeTenantId: string;
  yearFilter: string;
  statusFilter: string;
  onTenantChange: (tenantId: string) => void;
  onYearChange: (year: string) => void;
  onStatusChange: (status: string) => void;
}>;

export function HolidayManagementFilters({
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  activeTenantId,
  yearFilter,
  statusFilter,
  onTenantChange,
  onYearChange,
  onStatusChange,
}: HolidayManagementFiltersProps) {
  const yearOptions = useMemo(() => buildHolidayYearFilterOptions(), []);

  return (
    <SettingsEmbeddedFilters>
      {isWorkforceAdmin ? (
        <SettingsEmbeddedFilterField id="holiday-filter-tenant" label="Tenant">
          <Form.Select
            id="holiday-filter-tenant"
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

      <SettingsEmbeddedFilterField id="holiday-filter-year" label="Year">
        <Form.Select
          id="holiday-filter-year"
          size="sm"
          className={filterControlClassName}
          aria-label="Holiday calendar year filter"
          value={yearFilter}
          onChange={(event) => onYearChange(event.target.value)}
        >
          {yearOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </SettingsEmbeddedFilterField>

      <SettingsEmbeddedFilterField id="holiday-filter-status" label="Status">
        <Form.Select
          id="holiday-filter-status"
          size="sm"
          className={filterControlClassName}
          aria-label="Holiday calendar status filter"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          {HOLIDAY_CALENDAR_STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </SettingsEmbeddedFilterField>
    </SettingsEmbeddedFilters>
  );
}
