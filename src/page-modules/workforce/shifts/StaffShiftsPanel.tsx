import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import { ShiftFormSidebar } from "@page-modules/workforce/shifts/AddShiftSidebar";
import { ShiftManagementFilters } from "@page-modules/workforce/shifts/ShiftManagementFilters";
import type { ShiftManagementPanelProps } from "@page-modules/workforce/shifts/shiftManagementPanelTypes";
import {
  SHIFT_LIST_DEFAULT_LIMIT,
  SHIFT_LIST_PAGE_SIZE_OPTIONS,
  filterShiftsBySearch,
  readShiftRequirementHours,
  resolveStaffShiftTenantId,
  staffShiftToFormState,
} from "@page-modules/workforce/shifts/shiftManagementDomain";
import { buildStaffShiftsTableColumns } from "@page-modules/workforce/shifts/shiftsTableConfig";
import { useCreateStaffShiftMutation } from "@page-modules/workforce/shifts/useCreateStaffShiftMutation";
import { useDeleteStaffShiftMutation } from "@page-modules/workforce/shifts/useDeleteStaffShiftMutation";
import { useStaffShiftsQuery } from "@page-modules/workforce/shifts/useStaffShiftsQuery";
import { useUpdateStaffShiftMutation } from "@page-modules/workforce/shifts/useUpdateStaffShiftMutation";
import { useWorkHoursPoliciesQuery } from "@page-modules/workforce/company-config/useWorkHoursPoliciesQuery";
import type { StaffShift } from "@utils/staffManagement";
import { Plus } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { Button } from "react-bootstrap";

export type StaffShiftsPanelProps = ShiftManagementPanelProps;

export function StaffShiftsPanel({
  resolvedTenantId,
  companyIdentifier,
  isTenantListReady,
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  onTenantChange,
}: StaffShiftsPanelProps) {
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(SHIFT_LIST_DEFAULT_LIMIT);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [deletingShift, setDeletingShift] = useState<StaffShift | null>(null);

  const createShiftMutation = useCreateStaffShiftMutation();
  const updateShiftMutation = useUpdateStaffShiftMutation();
  const deleteShiftMutation = useDeleteStaffShiftMutation();

  const shiftsQuery = useStaffShiftsQuery({
    tenantId: resolvedTenantId || null,
    status: statusFilter,
    type: typeFilter,
    page: currentPage,
    limit: rowsPerPage,
    enabled: isTenantListReady,
  });

  const workHoursPoliciesQuery = useWorkHoursPoliciesQuery({
    tenantId: resolvedTenantId || null,
    page: 1,
    limit: 1,
    enabled: isTenantListReady && (showCreateSidebar || Boolean(editingShift)),
  });
  const shiftRequirementHours = useMemo(
    () => readShiftRequirementHours(workHoursPoliciesQuery.data?.data?.[0]),
    [workHoursPoliciesQuery.data?.data],
  );

  const handleEditShift = useCallback((shift: StaffShift) => {
    setEditingShift(shift);
  }, []);

  const handleDeleteShift = useCallback((shift: StaffShift) => {
    setDeletingShift(shift);
  }, []);

  const shiftRows = shiftsQuery.data?.data ?? [];

  const columns = useMemo(
    () =>
      buildStaffShiftsTableColumns({
        rows: shiftRows,
        isWorkforceAdmin,
        tenantOptions,
        onEdit: handleEditShift,
        onDelete: handleDeleteShift,
      }),
    [handleDeleteShift, handleEditShift, isWorkforceAdmin, shiftRows, tenantOptions],
  );

  const filteredRows = useMemo(
    () => filterShiftsBySearch(shiftRows, searchValue),
    [searchValue, shiftRows],
  );
  const pagination = shiftsQuery.data?.pagination;
  const totalRows = pagination?.total ?? filteredRows.length;

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  const editingTenantId = editingShift
    ? resolveStaffShiftTenantId(editingShift, resolvedTenantId || companyIdentifier || "")
    : "";
  const deletingShiftLabel = deletingShift?.name?.trim() || "this shift";

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
      Add shift
    </Button>
  );

  return (
    <>
      <SettingsEmbeddedToolbar
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          resetToFirstPage();
        }}
        searchPlaceholder="Search shifts..."
        actions={addButton}
      />

      <ShiftManagementFilters
        isWorkforceAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        tenantOptionsLoading={tenantOptionsLoading}
        activeTenantId={resolvedTenantId}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onTenantChange={(tenantId) => {
          onTenantChange(tenantId);
          resetToFirstPage();
        }}
        onStatusChange={(status) => {
          setStatusFilter(status);
          resetToFirstPage();
        }}
        onTypeChange={(type) => {
          setTypeFilter(type);
          resetToFirstPage();
        }}
      />

      <EmbeddedSettingsTable
        embedded
        data={filteredRows}
        columns={columns}
        loading={shiftsQuery.isFetching}
        emptyMessage="No shifts found."
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [...SHIFT_LIST_PAGE_SIZE_OPTIONS],
        }}
        onPaginationChange={(page, perPage) => {
          setCurrentPage(page);
          setRowsPerPage(perPage);
        }}
        uniqueKey="id"
        sortable
        hover
      />

      <ShiftFormSidebar
        show={showCreateSidebar}
        mode="create"
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId || companyIdentifier || ""}
        isSubmitting={createShiftMutation.isPending}
        shiftRequirementHours={shiftRequirementHours}
        onClose={() => {
          if (createShiftMutation.isPending) return;
          setShowCreateSidebar(false);
        }}
        onSubmit={({ tenantIds, form }) => {
          createShiftMutation.mutate(
            { tenantIds, form },
            {
              onSuccess: () => {
                setShowCreateSidebar(false);
              },
            },
          );
        }}
      />

      <ShiftFormSidebar
        show={Boolean(editingShift)}
        mode="edit"
        initialForm={editingShift ? staffShiftToFormState(editingShift) : undefined}
        editTenantId={editingTenantId}
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId || companyIdentifier || ""}
        isSubmitting={updateShiftMutation.isPending}
        shiftRequirementHours={shiftRequirementHours}
        onClose={() => {
          if (updateShiftMutation.isPending) return;
          setEditingShift(null);
        }}
        onSubmit={({ form }) => {
          if (!editingShift) return;
          updateShiftMutation.mutate(
            {
              shiftId: editingShift.id,
              tenantId: editingTenantId,
              form,
            },
            {
              onSuccess: () => {
                setEditingShift(null);
              },
            },
          );
        }}
      />

      <ConfirmModal
        show={Boolean(deletingShift)}
        onHide={() => {
          if (deleteShiftMutation.isPending) return;
          setDeletingShift(null);
        }}
        title="Delete shift"
        description="Are you sure you want to delete {targetName}? This action cannot be undone."
        targetName={deletingShiftLabel}
        confirmButtonText="Delete shift"
        confirmButtonVariant="danger"
        requiredConfirmationText="delete"
        loading={deleteShiftMutation.isPending}
        onConfirm={() => {
          if (!deletingShift) return;
          const tenantId = resolveStaffShiftTenantId(
            deletingShift,
            resolvedTenantId || companyIdentifier || "",
          );
          deleteShiftMutation.mutate(
            { shiftId: deletingShift.id, tenantId },
            {
              onSuccess: () => {
                setDeletingShift(null);
              },
            },
          );
        }}
        onCancel={() => {
          if (deleteShiftMutation.isPending) return;
          setDeletingShift(null);
        }}
      />
    </>
  );
}
