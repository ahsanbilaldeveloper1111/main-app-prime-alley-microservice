import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import { CreateBreakTypeSidebar } from "@page-modules/workforce/company-config/CreateBreakTypeSidebar";
import type { CompanyConfigPolicyPanelProps } from "@page-modules/workforce/company-config/companyConfigPanelTypes";
import {
  BREAK_TYPES_LIST_DEFAULT_LIMIT,
  BREAK_TYPES_LIST_PAGE_SIZE_OPTIONS,
  filterBreakTypesBySearch,
  type BreakTypeTenantOption,
} from "@page-modules/workforce/company-config/breakTypesDomain";
import { buildBreakTypesTableColumns } from "@page-modules/workforce/company-config/breakTypesTableConfig";
import { useBreakTypesQuery } from "@page-modules/workforce/company-config/useBreakTypesQuery";
import { useCreateBreakTypeMutation } from "@page-modules/workforce/company-config/useCreateBreakTypeMutation";
import { Plus } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "react-bootstrap";

export type BreakTypesPanelProps = CompanyConfigPolicyPanelProps &
  Readonly<{
    isWorkforceAdmin: boolean;
    tenantOptions: readonly BreakTypeTenantOption[];
  }>;

export function BreakTypesPanel({
  resolvedTenantId,
  isTenantListReady,
  isWorkforceAdmin,
  tenantOptions,
}: BreakTypesPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(BREAK_TYPES_LIST_DEFAULT_LIMIT);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);

  const createBreakTypeMutation = useCreateBreakTypeMutation();

  const breakTypesQuery = useBreakTypesQuery({
    tenantId: resolvedTenantId || null,
    enabled: isTenantListReady,
  });

  const breakTypeRows = breakTypesQuery.data?.data ?? [];

  const columns = useMemo(() => buildBreakTypesTableColumns(), []);

  const filteredRows = useMemo(
    () => filterBreakTypesBySearch(breakTypeRows, searchValue),
    [breakTypeRows, searchValue],
  );

  const pagination = breakTypesQuery.data?.pagination;
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
      Add break type
    </Button>
  );

  if (!resolvedTenantId) {
    return <p className="company-config-panel__hint">Select a tenant to load break types.</p>;
  }

  if (breakTypesQuery.isError) {
    return (
      <div className="company-config-panel__status company-config-panel__status--error">
        <p>Failed to load break types.</p>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => breakTypesQuery.refetch()}
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
        searchPlaceholder="Search break types..."
        actions={addButton}
      />

      <EmbeddedSettingsTable
        embedded
        data={filteredRows}
        columns={columns}
        loading={breakTypesQuery.isFetching}
        emptyMessage="No break types found."
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [...BREAK_TYPES_LIST_PAGE_SIZE_OPTIONS],
        }}
        onPaginationChange={(page, perPage) => {
          setCurrentPage(page);
          setRowsPerPage(perPage);
        }}
        uniqueKey="id"
        sortable
        hover
      />

      <CreateBreakTypeSidebar
        show={showCreateSidebar}
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId}
        isSubmitting={createBreakTypeMutation.isPending}
        onClose={() => {
          if (createBreakTypeMutation.isPending) return;
          setShowCreateSidebar(false);
        }}
        onSubmit={({ tenantId, form }) => {
          createBreakTypeMutation.mutate(
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
