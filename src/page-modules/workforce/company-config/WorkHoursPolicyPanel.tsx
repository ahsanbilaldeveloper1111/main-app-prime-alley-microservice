import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import type { CompanyConfigPolicyPanelProps } from "@page-modules/workforce/company-config/companyConfigPanelTypes";
import {
  filterWorkHoursPoliciesBySearch,
  formatWorkHoursPolicyLabel,
  readWorkHoursPolicyRowId,
  resolveWorkHoursPolicyTenantId,
  WORK_HOURS_LIST_DEFAULT_LIMIT,
  WORK_HOURS_LIST_PAGE_SIZE_OPTIONS,
  type WorkHoursTenantOption,
} from "@page-modules/workforce/company-config/companyConfigDomain";
import { CreateWorkHoursPolicySidebar } from "@page-modules/workforce/company-config/CreateWorkHoursPolicySidebar";
import { buildWorkHoursPoliciesTableColumns } from "@page-modules/workforce/company-config/workHoursTableConfig";
import { useCreateWorkHoursPolicyMutation } from "@page-modules/workforce/company-config/useCreateWorkHoursPolicyMutation";
import { useDeleteWorkHoursPolicyMutation } from "@page-modules/workforce/company-config/useDeleteWorkHoursPolicyMutation";
import { useUpdateWorkHoursPolicyMutation } from "@page-modules/workforce/company-config/useUpdateWorkHoursPolicyMutation";
import { useWorkHoursPoliciesQuery } from "@page-modules/workforce/company-config/useWorkHoursPoliciesQuery";
import type { AttendanceWorkHoursPolicy } from "@utils/staffManagement";
import { Plus } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { Button } from "react-bootstrap";

type WorkHoursPolicyTableRow = AttendanceWorkHoursPolicy & { rowKey: string };

export type WorkHoursPolicyPanelProps = CompanyConfigPolicyPanelProps &
  Readonly<{
    isWorkforceAdmin: boolean;
    tenantOptions: readonly WorkHoursTenantOption[];
  }>;

export function WorkHoursPolicyPanel({
  resolvedTenantId,
  isTenantListReady,
  isWorkforceAdmin,
  tenantOptions,
}: WorkHoursPolicyPanelProps) {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(WORK_HOURS_LIST_DEFAULT_LIMIT);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AttendanceWorkHoursPolicy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<AttendanceWorkHoursPolicy | null>(null);

  const createWorkHoursPolicyMutation = useCreateWorkHoursPolicyMutation();
  const updateWorkHoursPolicyMutation = useUpdateWorkHoursPolicyMutation();
  const deleteWorkHoursPolicyMutation = useDeleteWorkHoursPolicyMutation();

  const workHoursPoliciesQuery = useWorkHoursPoliciesQuery({
    tenantId: resolvedTenantId || null,
    page: currentPage,
    limit: rowsPerPage,
    enabled: isTenantListReady,
  });

  const policyRows = workHoursPoliciesQuery.data?.data ?? [];

  const handleEditPolicy = useCallback((policy: AttendanceWorkHoursPolicy) => {
    setEditingPolicy(policy);
  }, []);

  const handleDeletePolicy = useCallback((policy: AttendanceWorkHoursPolicy) => {
    setDeletingPolicy(policy);
  }, []);

  const columns = useMemo(
    () =>
      buildWorkHoursPoliciesTableColumns({
        onEdit: handleEditPolicy,
        onDelete: handleDeletePolicy,
      }),
    [handleDeletePolicy, handleEditPolicy],
  );

  const filteredRows = useMemo(
    () => filterWorkHoursPoliciesBySearch(policyRows, searchValue),
    [policyRows, searchValue],
  );

  const tableRows = useMemo((): WorkHoursPolicyTableRow[] => {
    return filteredRows.map((row, index) => ({
      ...row,
      rowKey: readWorkHoursPolicyRowId(row, index),
    }));
  }, [filteredRows]);

  const pagination = workHoursPoliciesQuery.data?.pagination;
  const totalRows = pagination?.total ?? filteredRows.length;

  const editingTenantId = editingPolicy
    ? resolveWorkHoursPolicyTenantId(editingPolicy, resolvedTenantId)
    : "";
  const deletingTenantId = deletingPolicy
    ? resolveWorkHoursPolicyTenantId(deletingPolicy, resolvedTenantId)
    : "";
  const deletingPolicyLabel = deletingPolicy
    ? formatWorkHoursPolicyLabel(deletingPolicy)
    : "this work hours policy";

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
      Add work hours policy
    </Button>
  );

  if (!resolvedTenantId) {
    return (
      <p className="company-config-panel__hint">Select a tenant to load work hours policies.</p>
    );
  }

  if (workHoursPoliciesQuery.isError) {
    return (
      <div className="company-config-panel__status company-config-panel__status--error">
        <p>Failed to load work hours policies.</p>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => workHoursPoliciesQuery.refetch()}
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
        searchPlaceholder="Search work hours policies..."
        actions={addButton}
      />

      <EmbeddedSettingsTable
        embedded
        data={tableRows}
        columns={columns}
        loading={workHoursPoliciesQuery.isFetching}
        emptyMessage="No work hours policies found."
        pagination={{
          currentPage,
          rowsPerPage,
          totalRows,
          pageSizeOptions: [...WORK_HOURS_LIST_PAGE_SIZE_OPTIONS],
        }}
        onPaginationChange={(page, perPage) => {
          setCurrentPage(page);
          setRowsPerPage(perPage);
        }}
        uniqueKey="rowKey"
        sortable
        hover
      />

      <CreateWorkHoursPolicySidebar
        show={showCreateSidebar}
        mode="create"
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId}
        isSubmitting={createWorkHoursPolicyMutation.isPending}
        onClose={() => {
          if (createWorkHoursPolicyMutation.isPending) return;
          setShowCreateSidebar(false);
        }}
        onSubmit={({ tenantId, form }) => {
          createWorkHoursPolicyMutation.mutate(
            { tenantId, form },
            {
              onSuccess: () => {
                setShowCreateSidebar(false);
              },
            },
          );
        }}
      />

      <CreateWorkHoursPolicySidebar
        show={Boolean(editingPolicy)}
        mode="edit"
        initialPolicy={editingPolicy}
        editTenantId={editingTenantId}
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={resolvedTenantId}
        isSubmitting={updateWorkHoursPolicyMutation.isPending}
        onClose={() => {
          if (updateWorkHoursPolicyMutation.isPending) return;
          setEditingPolicy(null);
        }}
        onSubmit={({ tenantId, form }) => {
          if (!editingPolicy?.id) return;
          updateWorkHoursPolicyMutation.mutate(
            {
              policyId: editingPolicy.id,
              tenantId,
              form,
            },
            {
              onSuccess: () => {
                setEditingPolicy(null);
              },
            },
          );
        }}
      />

      <ConfirmModal
        show={Boolean(deletingPolicy)}
        onHide={() => {
          if (deleteWorkHoursPolicyMutation.isPending) return;
          setDeletingPolicy(null);
        }}
        title="Delete work hours policy"
        description="Are you sure you want to delete {targetName}? This action cannot be undone."
        targetName={deletingPolicyLabel}
        confirmButtonText="Delete policy"
        confirmButtonVariant="danger"
        requiredConfirmationText="delete"
        loading={deleteWorkHoursPolicyMutation.isPending}
        onConfirm={() => {
          if (!deletingPolicy?.id) return;
          deleteWorkHoursPolicyMutation.mutate(
            { policyId: deletingPolicy.id, tenantId: deletingTenantId },
            {
              onSuccess: () => {
                setDeletingPolicy(null);
              },
            },
          );
        }}
        onCancel={() => {
          if (deleteWorkHoursPolicyMutation.isPending) return;
          setDeletingPolicy(null);
        }}
      />
    </>
  );
}
