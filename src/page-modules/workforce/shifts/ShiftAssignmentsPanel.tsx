import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import { CreateShiftAssignmentSidebar } from "@page-modules/workforce/shifts/CreateShiftAssignmentSidebar";
import { ShiftAssignmentsTenantFilter } from "@page-modules/workforce/shifts/ShiftAssignmentsTenantFilter";
import {
  buildShiftAssignmentUserOptions,
  filterShiftAssignmentsBySearch,
  formatShiftAssignmentRowLabel,
  readShiftAssignmentRowId,
  resolveShiftAssignmentTenantId,
  SHIFT_ASSIGNMENTS_LIST_DEFAULT_LIMIT,
  SHIFT_ASSIGNMENTS_LIST_PAGE_SIZE_OPTIONS,
  SHIFT_OPTIONS_QUERY_LIMIT,
} from "@page-modules/workforce/shifts/shiftAssignmentsDomain";
import { buildShiftAssignmentsTableColumns } from "@page-modules/workforce/shifts/shiftAssignmentsTableConfig";
import type { ShiftManagementPanelProps } from "@page-modules/workforce/shifts/shiftManagementPanelTypes";
import { useCreateShiftAssignmentMutation } from "@page-modules/workforce/shifts/useCreateShiftAssignmentMutation";
import { useDeleteShiftAssignmentMutation } from "@page-modules/workforce/shifts/useDeleteShiftAssignmentMutation";
import { useShiftAssignmentsQuery } from "@page-modules/workforce/shifts/useShiftAssignmentsQuery";
import { useStaffShiftsQuery } from "@page-modules/workforce/shifts/useStaffShiftsQuery";
import { useUpdateShiftAssignmentMutation } from "@page-modules/workforce/shifts/useUpdateShiftAssignmentMutation";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import type { StaffShift, StaffShiftAssignment } from "@utils/staffManagement";
import { Plus } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { Button } from "react-bootstrap";

type ShiftAssignmentTableRow = StaffShiftAssignment & { rowKey: string };

export type ShiftAssignmentsPanelProps = ShiftManagementPanelProps;

export function ShiftAssignmentsPanel({
  resolvedTenantId,
  isTenantListReady,
  isWorkforceAdmin,
  tenantOptions,
  tenantOptionsLoading,
  onTenantChange,
}: ShiftAssignmentsPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(SHIFT_ASSIGNMENTS_LIST_DEFAULT_LIMIT);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<StaffShiftAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<StaffShiftAssignment | null>(null);

  const createShiftAssignmentMutation = useCreateShiftAssignmentMutation();
  const updateShiftAssignmentMutation = useUpdateShiftAssignmentMutation();
  const deleteShiftAssignmentMutation = useDeleteShiftAssignmentMutation();

  const shiftAssignmentsQuery = useShiftAssignmentsQuery({
    tenantId: resolvedTenantId || null,
    page: currentPage,
    limit: rowsPerPage,
    enabled: isTenantListReady,
  });

  const shiftsLookupQuery = useStaffShiftsQuery({
    tenantId: resolvedTenantId || null,
    status: "active",
    page: 1,
    limit: SHIFT_OPTIONS_QUERY_LIMIT,
    enabled: isTenantListReady && Boolean(resolvedTenantId),
  });

  const { mainAppUsers } = useMainAppLookups();

  const assignmentRows = shiftAssignmentsQuery.data?.data ?? [];
  const shiftsById = useMemo(() => {
    const map = new Map<number, StaffShift>();
    for (const shift of shiftsLookupQuery.data?.data ?? []) {
      if (Number.isFinite(shift.id)) {
        map.set(shift.id, shift);
      }
    }
    return map;
  }, [shiftsLookupQuery.data?.data]);

  const userLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of buildShiftAssignmentUserOptions(mainAppUsers)) {
      map.set(option.value, option.label);
    }
    return map;
  }, [mainAppUsers]);

  const handleEditAssignment = useCallback((assignment: StaffShiftAssignment) => {
    setEditingAssignment(assignment);
  }, []);

  const handleDeleteAssignment = useCallback((assignment: StaffShiftAssignment) => {
    setDeletingAssignment(assignment);
  }, []);

  const columns = useMemo(
    () =>
      buildShiftAssignmentsTableColumns({
        shiftsById,
        userLabelById,
        onEdit: handleEditAssignment,
        onDelete: handleDeleteAssignment,
      }),
    [handleDeleteAssignment, handleEditAssignment, shiftsById, userLabelById],
  );

  const filteredRows = useMemo(
    () =>
      filterShiftAssignmentsBySearch(
        assignmentRows,
        searchValue,
        shiftsById,
        userLabelById,
      ),
    [assignmentRows, searchValue, shiftsById, userLabelById],
  );

  const tableRows = useMemo((): ShiftAssignmentTableRow[] => {
    return filteredRows.map((row, index) => ({
      ...row,
      rowKey: readShiftAssignmentRowId(row, index),
    }));
  }, [filteredRows]);

  const pagination = shiftAssignmentsQuery.data?.pagination;
  const totalRows = pagination?.total ?? filteredRows.length;

  const editingTenantId = editingAssignment
    ? resolveShiftAssignmentTenantId(editingAssignment, resolvedTenantId)
    : "";
  const deletingTenantId = deletingAssignment
    ? resolveShiftAssignmentTenantId(deletingAssignment, resolvedTenantId)
    : "";
  const deletingAssignmentLabel = deletingAssignment
    ? formatShiftAssignmentRowLabel(deletingAssignment, shiftsById, userLabelById)
    : "this shift assignment";

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
      Add shift assignment
    </Button>
  );

  if (!resolvedTenantId) {
    return (
      <p className="shift-management-panel__hint">Select a tenant to load shift assignments.</p>
    );
  }

  if (shiftAssignmentsQuery.isError) {
    return (
      <div className="shift-management-panel__status shift-management-panel__status--error">
        <p>Failed to load shift assignments.</p>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => shiftAssignmentsQuery.refetch()}
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
        searchPlaceholder="Search shift assignments..."
        actions={addButton}
      />

      <ShiftAssignmentsTenantFilter
        isWorkforceAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        tenantOptionsLoading={tenantOptionsLoading}
        activeTenantId={resolvedTenantId}
        onTenantChange={(tenantId) => {
          onTenantChange(tenantId);
          setCurrentPage(1);
        }}
      />

      <EmbeddedSettingsTable
        embedded
        data={tableRows}
        columns={columns}
        loading={shiftAssignmentsQuery.isFetching}
        emptyMessage="No shift assignments found."
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [...SHIFT_ASSIGNMENTS_LIST_PAGE_SIZE_OPTIONS],
        }}
        onPaginationChange={(page, perPage) => {
          setCurrentPage(page);
          setRowsPerPage(perPage);
        }}
        uniqueKey="rowKey"
        sortable
        hover
      />

      <CreateShiftAssignmentSidebar
        show={showCreateSidebar}
        mode="create"
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId}
        isTenantListReady={isTenantListReady}
        isSubmitting={createShiftAssignmentMutation.isPending}
        onClose={() => {
          if (createShiftAssignmentMutation.isPending) return;
          setShowCreateSidebar(false);
        }}
        onSubmit={({ tenantId, form }) => {
          createShiftAssignmentMutation.mutate(
            { tenantId, form },
            {
              onSuccess: () => {
                setShowCreateSidebar(false);
              },
            },
          );
        }}
      />

      <CreateShiftAssignmentSidebar
        show={Boolean(editingAssignment)}
        mode="edit"
        initialAssignment={editingAssignment}
        editTenantId={editingTenantId}
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId}
        isTenantListReady={isTenantListReady}
        isSubmitting={updateShiftAssignmentMutation.isPending}
        onClose={() => {
          if (updateShiftAssignmentMutation.isPending) return;
          setEditingAssignment(null);
        }}
        onSubmit={({ tenantId, form }) => {
          const assignmentId = editingAssignment?.id;
          if (assignmentId == null || !Number.isFinite(assignmentId)) {
            return;
          }
          updateShiftAssignmentMutation.mutate(
            { assignmentId, tenantId, form },
            {
              onSuccess: () => {
                setEditingAssignment(null);
              },
            },
          );
        }}
      />

      <ConfirmModal
        show={Boolean(deletingAssignment)}
        onHide={() => {
          if (deleteShiftAssignmentMutation.isPending) return;
          setDeletingAssignment(null);
        }}
        title="Delete shift assignment"
        description="Are you sure you want to delete {targetName}? This action cannot be undone."
        targetName={deletingAssignmentLabel}
        confirmButtonText="Delete assignment"
        confirmButtonVariant="danger"
        requiredConfirmationText="delete"
        loading={deleteShiftAssignmentMutation.isPending}
        onConfirm={() => {
          const assignmentId = deletingAssignment?.id;
          if (assignmentId == null || !Number.isFinite(assignmentId) || !deletingTenantId) {
            return;
          }
          deleteShiftAssignmentMutation.mutate(
            { assignmentId, tenantId: deletingTenantId },
            {
              onSuccess: () => {
                setDeletingAssignment(null);
              },
            },
          );
        }}
      />
    </>
  );
}
