import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import type { CompanyConfigPolicyPanelProps } from "@page-modules/workforce/company-config/companyConfigPanelTypes";
import {
  BREAKS_LIST_DEFAULT_LIMIT,
  BREAKS_LIST_PAGE_SIZE_OPTIONS,
  filterBreaksPoliciesBySearch,
  readBreaksPolicyRowId,
  type BreaksTenantOption,
} from "@page-modules/workforce/company-config/breaksDomain";
import { buildBreaksPoliciesTableColumns } from "@page-modules/workforce/company-config/breaksTableConfig";
import { CreateBreaksPolicySidebar } from "@page-modules/workforce/company-config/CreateBreaksPolicySidebar";
import { useBreaksPoliciesQuery } from "@page-modules/workforce/company-config/useBreaksPoliciesQuery";
import { useCreateBreaksPolicyMutation } from "@page-modules/workforce/company-config/useCreateBreaksPolicyMutation";
import type { AttendanceBreakPolicy } from "@utils/staffManagement";
import { Plus } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "react-bootstrap";

type BreaksPolicyTableRow = AttendanceBreakPolicy & { rowKey: string };

export type BreaksPolicyPanelProps = CompanyConfigPolicyPanelProps &
  Readonly<{
    isWorkforceAdmin: boolean;
    tenantOptions: readonly BreaksTenantOption[];
  }>;

export function BreaksPolicyPanel({
  resolvedTenantId,
  isTenantListReady,
  isWorkforceAdmin,
  tenantOptions,
}: BreaksPolicyPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(BREAKS_LIST_DEFAULT_LIMIT);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);

  const createBreaksPolicyMutation = useCreateBreaksPolicyMutation();

  const breaksPoliciesQuery = useBreaksPoliciesQuery({
    tenantId: resolvedTenantId || null,
    page: currentPage,
    limit: rowsPerPage,
    enabled: isTenantListReady,
  });

  const policyRows = breaksPoliciesQuery.data?.data ?? [];

  const columns = useMemo(() => buildBreaksPoliciesTableColumns(), []);

  const filteredRows = useMemo(
    () => filterBreaksPoliciesBySearch(policyRows, searchValue),
    [policyRows, searchValue],
  );

  const tableRows = useMemo((): BreaksPolicyTableRow[] => {
    return filteredRows.map((row, index) => ({
      ...row,
      rowKey: readBreaksPolicyRowId(row, index),
    }));
  }, [filteredRows]);

  const pagination = breaksPoliciesQuery.data?.pagination;
  const totalRows = pagination?.total ?? filteredRows.length;

  const addButton = (
    <Button
      variant="primary"
      size="sm"
      type="button"
      className="shadow-sm"
      disabled={!resolvedTenantId}
      onClick={() => setShowCreateSidebar(true)}
    >
      <Plus size={16} className="me-1" aria-hidden />
      Add break policy
    </Button>
  );

  if (!resolvedTenantId) {
    return (
      <p className="company-config-panel__hint">Select a tenant to load break policies.</p>
    );
  }

  if (breaksPoliciesQuery.isError) {
    return (
      <div className="company-config-panel__status company-config-panel__status--error">
        <p>Failed to load break policies.</p>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => breaksPoliciesQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <SettingsEmbeddedToolbar
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search break policies..."
        actions={addButton}
      />

      <EmbeddedSettingsTable
        embedded
        data={tableRows}
        columns={columns}
        loading={breaksPoliciesQuery.isFetching}
        emptyMessage="No break policies found."
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [...BREAKS_LIST_PAGE_SIZE_OPTIONS],
        }}
        onPaginationChange={(page, perPage) => {
          setCurrentPage(page);
          setRowsPerPage(perPage);
        }}
        uniqueKey="rowKey"
        sortable
        hover
      />

      <CreateBreaksPolicySidebar
        show={showCreateSidebar}
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId}
        isSubmitting={createBreaksPolicyMutation.isPending}
        onClose={() => {
          if (createBreaksPolicyMutation.isPending) return;
          setShowCreateSidebar(false);
        }}
        onSubmit={({ tenantId, form }) => {
          createBreaksPolicyMutation.mutate(
            { tenantId, form },
            {
              onSuccess: () => {
                setShowCreateSidebar(false);
              },
            },
          );
        }}
      />
    </>
  );
}
