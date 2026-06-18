import { ShiftAssignmentForm } from "@page-modules/workforce/shifts/ShiftAssignmentForm";
import {
  buildShiftAssignmentUserOptions,
  buildShiftOptions,
  createDefaultShiftAssignmentFormState,
  SHIFT_OPTIONS_QUERY_LIMIT,
  shiftAssignmentToFormState,
  validateShiftAssignmentForm,
  type ShiftAssignmentFormState,
  type ShiftTenantOption,
} from "@page-modules/workforce/shifts/shiftAssignmentsDomain";
import { useStaffShiftsQuery } from "@page-modules/workforce/shifts/useStaffShiftsQuery";
import {
  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,
  PoliciesAttendanceFormValidationMessage,
  PoliciesAttendanceTenantField,
} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";
import {
  MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import type { StaffShiftAssignment } from "@utils/staffManagement";
import React, { useEffect, useMemo, useState } from "react";

export type ShiftAssignmentSidebarMode = "create" | "edit";

export type CreateShiftAssignmentSidebarProps = Readonly<{
  show: boolean;
  mode?: ShiftAssignmentSidebarMode;
  initialAssignment?: StaffShiftAssignment | null;
  editTenantId?: string;
  isAdmin: boolean;
  tenantOptions: readonly ShiftTenantOption[];
  lockedTenantId: string;
  isTenantListReady: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: { tenantId: string; form: ShiftAssignmentFormState }) => void;
}>;

function resolveShiftAssignmentSidebarTenantId(args: Readonly<{
  isEditMode: boolean;
  editTenantId?: string;
  lockedTenantId: string;
  isAdmin: boolean;
  selectedTenantId: string;
}>): string {
  if (args.isEditMode) {
    return args.editTenantId ?? args.lockedTenantId;
  }
  if (args.isAdmin) {
    return args.selectedTenantId;
  }
  return args.lockedTenantId;
}

export function CreateShiftAssignmentSidebar({
  show,
  mode = "create",
  initialAssignment,
  editTenantId,
  isAdmin,
  tenantOptions,
  lockedTenantId,
  isTenantListReady,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateShiftAssignmentSidebarProps) {
  const isEditMode = mode === "edit";
  const [form, setForm] = useState(createDefaultShiftAssignmentFormState);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const resolvedTenantId = resolveShiftAssignmentSidebarTenantId({
    isEditMode,
    editTenantId,
    lockedTenantId,
    isAdmin,
    selectedTenantId,
  });

  const shiftsQuery = useStaffShiftsQuery({
    tenantId: resolvedTenantId || null,
    status: "active",
    page: 1,
    limit: SHIFT_OPTIONS_QUERY_LIMIT,
    enabled: show && isTenantListReady && Boolean(resolvedTenantId),
  });

  const { mainAppUsers, loading: usersLoading } = useMainAppLookups();

  const shiftOptions = useMemo(
    () => buildShiftOptions(shiftsQuery.data?.data ?? []),
    [shiftsQuery.data?.data],
  );

  const userOptions = useMemo(
    () => buildShiftAssignmentUserOptions(mainAppUsers),
    [mainAppUsers],
  );

  useEffect(() => {
    if (!show) return;
    setValidationError(null);

    if (isEditMode) {
      setForm(shiftAssignmentToFormState(initialAssignment));
      setSelectedTenantId(editTenantId ?? lockedTenantId);
      return;
    }

    setForm(createDefaultShiftAssignmentFormState());
    if (isAdmin) {
      const defaultId =
        lockedTenantId && tenantOptions.some((option) => option.value === lockedTenantId)
          ? lockedTenantId
          : tenantOptions[0]?.value ?? "";
      setSelectedTenantId(defaultId);
      return;
    }
    setSelectedTenantId(lockedTenantId);
  }, [editTenantId, initialAssignment, isAdmin, isEditMode, lockedTenantId, show, tenantOptions]);

  const validationMessage =
    validationError ?? validateShiftAssignmentForm(form, resolvedTenantId);
  const canSubmit = !validationMessage && !isSubmitting;
  const tenantFieldReadOnly = isEditMode || !isAdmin;
  const displayTenantId = resolveShiftAssignmentSidebarTenantId({
    isEditMode,
    editTenantId,
    lockedTenantId,
    isAdmin,
    selectedTenantId,
  });

  const handleSubmit = () => {
    const error = validateShiftAssignmentForm(form, resolvedTenantId);
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit({ tenantId: resolvedTenantId, form });
  };

  const submitLabel = isEditMode ? "Save changes" : "Create assignment";
  const submittingLabel = isEditMode ? "Saving..." : "Creating...";

  return (
    <PoliciesAttendanceFormSidebar
      show={show}
      title={isEditMode ? "Edit shift assignment" : "Add shift assignment"}
      onHide={onClose}
      disableClose={isSubmitting}
      footer={
        <PoliciesAttendanceFormSidebarFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitLabel={submitLabel}
          submittingLabel={submittingLabel}
        />
      }
    >
      <PoliciesAttendanceFormShell>
        {tenantFieldReadOnly ? (
          <MainSettingsFormField id="shift-assignment-tenant" label="Tenant *">
            <div className={MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS} aria-readonly="true">
              {tenantOptions.find((option) => option.value === displayTenantId)?.label ??
                displayTenantId}
            </div>
          </MainSettingsFormField>
        ) : (
          <PoliciesAttendanceTenantField
            id="shift-assignment-tenant"
            isAdmin={isAdmin}
            tenantOptions={tenantOptions}
            selectedTenantId={selectedTenantId}
            lockedTenantId={lockedTenantId}
            disabled={isSubmitting}
            onTenantChange={(tenantId) => {
              setValidationError(null);
              setSelectedTenantId(tenantId);
            }}
          />
        )}

        <ShiftAssignmentForm
          form={form}
          disabled={isSubmitting}
          shiftOptions={shiftOptions}
          userOptions={userOptions}
          shiftsLoading={shiftsQuery.isLoading || shiftsQuery.isFetching}
          usersLoading={usersLoading}
          onChange={(nextForm) => {
            setValidationError(null);
            setForm(nextForm);
          }}
        />

        <PoliciesAttendanceFormValidationMessage message={validationMessage} />
      </PoliciesAttendanceFormShell>
    </PoliciesAttendanceFormSidebar>
  );
}
