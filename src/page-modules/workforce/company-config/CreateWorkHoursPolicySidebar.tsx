import {
  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,
  PoliciesAttendanceFormValidationMessage,
  PoliciesAttendanceTenantField,
} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";
import {
  createDefaultWorkHoursPolicyFormState,
  validateWorkHoursPolicyForm,
  workHoursPolicyToFormState,
  type WorkHoursPolicyFormState,
  type WorkHoursTenantOption,
} from "@page-modules/workforce/company-config/companyConfigDomain";
import { WorkHoursPolicyForm } from "@page-modules/workforce/company-config/WorkHoursPolicyForm";
import type { AttendanceWorkHoursPolicy } from "@utils/staffManagement";
import {
  MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import React, { useEffect, useState } from "react";

export type WorkHoursPolicySidebarMode = "create" | "edit";

export type CreateWorkHoursPolicySidebarProps = Readonly<{
  show: boolean;
  mode?: WorkHoursPolicySidebarMode;
  initialPolicy?: AttendanceWorkHoursPolicy | null;
  editTenantId?: string;
  isAdmin: boolean;
  tenantOptions: readonly WorkHoursTenantOption[];
  lockedTenantId: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: { tenantId: string; form: WorkHoursPolicyFormState }) => void;
}>;

export function CreateWorkHoursPolicySidebar({
  show,
  mode = "create",
  initialPolicy,
  editTenantId,
  isAdmin,
  tenantOptions,
  lockedTenantId,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateWorkHoursPolicySidebarProps) {
  const isEditMode = mode === "edit";
  const [form, setForm] = useState(createDefaultWorkHoursPolicyFormState);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    setValidationError(null);

    if (isEditMode) {
      setForm(workHoursPolicyToFormState(initialPolicy));
      setSelectedTenantId(editTenantId ?? lockedTenantId);
      return;
    }

    setForm(createDefaultWorkHoursPolicyFormState());
    if (isAdmin) {
      const defaultId =
        lockedTenantId && tenantOptions.some((option) => option.value === lockedTenantId)
          ? lockedTenantId
          : tenantOptions[0]?.value ?? "";
      setSelectedTenantId(defaultId);
      return;
    }
    setSelectedTenantId(lockedTenantId);
  }, [editTenantId, initialPolicy, isAdmin, isEditMode, lockedTenantId, show, tenantOptions]);

  const resolvedTenantId = isEditMode
    ? editTenantId ?? lockedTenantId
    : isAdmin
      ? selectedTenantId
      : lockedTenantId;
  const validationMessage =
    validationError ?? validateWorkHoursPolicyForm(form, resolvedTenantId);
  const canSubmit = !validationMessage && !isSubmitting;
  const tenantFieldReadOnly = isEditMode || !isAdmin;
  const displayTenantId = isEditMode
    ? editTenantId ?? lockedTenantId
    : isAdmin
      ? selectedTenantId
      : lockedTenantId;

  const handleSubmit = () => {
    const error = validateWorkHoursPolicyForm(form, resolvedTenantId);
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit({ tenantId: resolvedTenantId, form });
  };

  const submitLabel = isEditMode ? "Save changes" : "Create policy";
  const submittingLabel = isEditMode ? "Saving..." : "Creating...";

  return (
    <PoliciesAttendanceFormSidebar
      show={show}
      title={isEditMode ? "Edit work hours policy" : "Add work hours policy"}
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
          <MainSettingsFormField id="work-hours-policy-tenant" label="Tenant *">
            <div className={MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS} aria-readonly="true">
              {tenantOptions.find((option) => option.value === displayTenantId)?.label ??
                displayTenantId}
            </div>
          </MainSettingsFormField>
        ) : (
          <PoliciesAttendanceTenantField
            id="work-hours-policy-tenant"
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

        <WorkHoursPolicyForm
          form={form}
          disabled={isSubmitting}
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
