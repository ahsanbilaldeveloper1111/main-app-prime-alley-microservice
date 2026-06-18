import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import type { CompanyConfigPolicyPanelProps } from "@page-modules/workforce/company-config/companyConfigPanelTypes";
import { CreateOvertimePolicySidebar } from "@page-modules/workforce/company-config/CreateOvertimePolicySidebar";
import {
  filterOvertimePoliciesBySearch,
  OVERTIME_LIST_DEFAULT_LIMIT,
  OVERTIME_LIST_PAGE_SIZE_OPTIONS,
  readOvertimePolicyRowId,
  type OvertimeTenantOption,
} from "@page-modules/workforce/company-config/overtimeDomain";
import { buildOvertimePoliciesTableColumns } from "@page-modules/workforce/company-config/overtimeTableConfig";
import { useCreateOvertimePolicyMutation } from "@page-modules/workforce/company-config/useCreateOvertimePolicyMutation";
import { useOvertimePoliciesQuery } from "@page-modules/workforce/company-config/useOvertimePoliciesQuery";
import type { AttendanceOvertimePolicy } from "@utils/staffManagement";
import { Plus } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "react-bootstrap";

type OvertimePolicyTableRow = AttendanceOvertimePolicy & { rowKey: string };

export type OvertimePolicyPanelProps = CompanyConfigPolicyPanelProps &
  Readonly<{
    isWorkforceAdmin: boolean;
    tenantOptions: readonly OvertimeTenantOption[];
  }>;

export function OvertimePolicyPanel({
  resolvedTenantId,
  isTenantListReady,
  isWorkforceAdmin,
  tenantOptions,
}: OvertimePolicyPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(OVERTIME_LIST_DEFAULT_LIMIT);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);

  const createOvertimePolicyMutation = useCreateOvertimePolicyMutation();

  const overtimePoliciesQuery = useOvertimePoliciesQuery({
    tenantId: resolvedTenantId || null,
    page: currentPage,
    limit: rowsPerPage,
    enabled: isTenantListReady,
  });

  const policyRows = overtimePoliciesQuery.data?.data ?? [];

  const columns = useMemo(() => buildOvertimePoliciesTableColumns(), []);

  const filteredRows = useMemo(
    () => filterOvertimePoliciesBySearch(policyRows, searchValue),
    [policyRows, searchValue],
  );

  const tableRows = useMemo((): OvertimePolicyTableRow[] => {
    return filteredRows.map((row, index) => ({
      ...row,
      rowKey: readOvertimePolicyRowId(row, index),
    }));
  }, [filteredRows]);

  const pagination = overtimePoliciesQuery.data?.pagination;
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
      Add overtime policy
    </Button>
  );

  if (!resolvedTenantId) {
    return (
      <p className="company-config-panel__hint">Select a tenant to load overtime policies.</p>
    );
  }

  if (overtimePoliciesQuery.isError) {
    return (
      <div className="company-config-panel__status company-config-panel__status--error">
        <p>Failed to load overtime policies.</p>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => overtimePoliciesQuery.refetch()}
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
        searchPlaceholder="Search overtime policies..."
        actions={addButton}
      />

      <EmbeddedSettingsTable
        embedded
        data={tableRows}
        columns={columns}
        loading={overtimePoliciesQuery.isFetching}
        emptyMessage="No overtime policies found."
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [...OVERTIME_LIST_PAGE_SIZE_OPTIONS],
        }}
        onPaginationChange={(page, perPage) => {
          setCurrentPage(page);
          setRowsPerPage(perPage);
        }}
        uniqueKey="rowKey"
        sortable
        hover
      />

      <CreateOvertimePolicySidebar
        show={showCreateSidebar}
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId}
        isSubmitting={createOvertimePolicyMutation.isPending}
        onClose={() => {
          if (createOvertimePolicyMutation.isPending) return;
          setShowCreateSidebar(false);
        }}
        onSubmit={({ tenantId, form }) => {
          createOvertimePolicyMutation.mutate(
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
