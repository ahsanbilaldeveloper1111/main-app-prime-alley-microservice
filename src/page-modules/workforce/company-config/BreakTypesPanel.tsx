import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { BreakTypeSidebar } from "@page-modules/workforce/company-config/BreakTypeSidebar";
import type { CompanyConfigPolicyPanelProps } from "@page-modules/workforce/company-config/companyConfigPanelTypes";
import {
  BREAK_TYPE_EMPTY_LIST_MESSAGE,
  BREAK_TYPES_LIST_DEFAULT_LIMIT,
  BREAK_TYPES_LIST_PAGE_SIZE_OPTIONS,
  filterBreakTypesBySearch,
  type BreakTypeTenantOption,
} from "@page-modules/workforce/company-config/breakTypesDomain";
import { buildBreakTypesTableColumns } from "@page-modules/workforce/company-config/breakTypesTableConfig";
import { useBreakTypesQuery } from "@page-modules/workforce/company-config/useBreakTypesQuery";
import { useCreateBreakTypeMutation } from "@page-modules/workforce/company-config/useCreateBreakTypeMutation";
import { useDeleteBreakTypeMutation } from "@page-modules/workforce/company-config/useDeleteBreakTypeMutation";
import { useUpdateBreakTypeMutation } from "@page-modules/workforce/company-config/useUpdateBreakTypeMutation";
import type { AttendanceBreakType } from "@utils/staffManagement";
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
  const [sidebarMode, setSidebarMode] = useState<"create" | "edit" | null>(null);
  const [editingBreakType, setEditingBreakType] = useState<AttendanceBreakType | null>(null);
  const [breakTypeToDelete, setBreakTypeToDelete] = useState<AttendanceBreakType | null>(null);

  const createBreakTypeMutation = useCreateBreakTypeMutation();
  const updateBreakTypeMutation = useUpdateBreakTypeMutation();
  const deleteBreakTypeMutation = useDeleteBreakTypeMutation();

  const breakTypesQuery = useBreakTypesQuery({
    tenantId: resolvedTenantId || null,
    enabled: isTenantListReady,
  });

  const breakTypeRows = breakTypesQuery.data?.data ?? [];

  const columns = useMemo(
    () =>
      buildBreakTypesTableColumns({
        onEdit: (row) => {
          setEditingBreakType(row);
          setSidebarMode("edit");
        },
        onDelete: (row) => setBreakTypeToDelete(row),
      }),
    [],
  );

  const filteredRows = useMemo(
    () => filterBreakTypesBySearch(breakTypeRows, searchValue),
    [breakTypeRows, searchValue],
  );

  const pagination = breakTypesQuery.data?.pagination;
  const totalRows = pagination?.total ?? filteredRows.length;
  const sidebarSubmitting = createBreakTypeMutation.isPending || updateBreakTypeMutation.isPending;

  const addButton = (
    <Button
      variant="primary"
      size="sm"
      type="button"
      className="shadow-sm"
      disabled={!resolvedTenantId}
      onClick={() => {
        setEditingBreakType(null);
        setSidebarMode("create");
      }}
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
        emptyMessage={BREAK_TYPE_EMPTY_LIST_MESSAGE}
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

      <BreakTypeSidebar
        show={sidebarMode != null}
        mode={sidebarMode === "edit" ? "edit" : "create"}
        breakType={editingBreakType}
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId}
        isSubmitting={sidebarSubmitting}
        onClose={() => {
          if (sidebarSubmitting) return;
          setSidebarMode(null);
          setEditingBreakType(null);
        }}
        onSubmit={({ tenantId, form }) => {
          if (sidebarMode === "edit" && editingBreakType) {
            updateBreakTypeMutation.mutate(
              { id: editingBreakType.id, tenantId, form },
              {
                onSuccess: () => {
                  setSidebarMode(null);
                  setEditingBreakType(null);
                },
              },
            );
            return;
          }
          createBreakTypeMutation.mutate(
            { tenantId, form },
            {
              onSuccess: () => {
                setSidebarMode(null);
              },
            },
          );
        }}
      />

      <DeleteConfirmationModal
        show={breakTypeToDelete != null}
        onHide={() => {
          if (deleteBreakTypeMutation.isPending) return;
          setBreakTypeToDelete(null);
        }}
        onConfirm={() => {
          if (!breakTypeToDelete || !resolvedTenantId) return;
          deleteBreakTypeMutation.mutate(
            { id: breakTypeToDelete.id, tenantId: resolvedTenantId },
            { onSuccess: () => setBreakTypeToDelete(null) },
          );
        }}
        itemName={breakTypeToDelete?.name?.trim() || undefined}
        itemType="break type"
        additionalInfo={
          <p className="mb-0">
            If this break type has existing records, deletion will be blocked — deactivate it
            instead.
          </p>
        }
        loading={deleteBreakTypeMutation.isPending}
      />
    </>
  );
}
