import {
  SettingsEmbeddedFilterField,
  SettingsEmbeddedFilters,
} from "@components/main-settings/SettingsEmbeddedFilters";
import type { CompanyConfigTenantOption } from "@page-modules/workforce/company-config/companyConfigDomain";
import React from "react";
import { Form } from "react-bootstrap";

const filterControlClassName =
  "settings-embedded-page__filter-control main-settings-form-select form-select";

export type CompanyConfigFiltersProps = Readonly<{
  isWorkforceAdmin: boolean;
  tenantOptions: readonly CompanyConfigTenantOption[];
  tenantOptionsLoading: boolean;
  activeTenantId: string;
  onTenantChange: (tenantId: string) => void;
}>;

export function CompanyConfigFilters({
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  activeTenantId,
  onTenantChange,
}: CompanyConfigFiltersProps) {
  if (!isWorkforceAdmin) {
    return null;
  }

  return (
    <SettingsEmbeddedFilters>
      <SettingsEmbeddedFilterField id="company-config-filter-tenant" label="Tenant">
        <Form.Select
          id="company-config-filter-tenant"
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
    </SettingsEmbeddedFilters>
  );
}
