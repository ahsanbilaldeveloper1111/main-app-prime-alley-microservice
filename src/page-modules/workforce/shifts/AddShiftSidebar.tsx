import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS,
  MAIN_SETTINGS_FORM_SELECT_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import {
  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,
  PoliciesAttendanceFormValidationMessage,
  PoliciesAttendanceTenantField,
} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";
import {
  SHIFT_STATUS_FORM_OPTIONS,
  SHIFT_TYPE_FORM_OPTIONS,
  SHIFT_WORKING_DAY_OPTIONS,
  createDefaultShiftFormState,
  toggleShiftWorkingDay,
  validateCreateStaffShiftForm,
  type CreateStaffShiftFormState,
  type ShiftTenantOption,
} from "@page-modules/workforce/shifts/shiftManagementDomain";
import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";

export type ShiftFormSidebarMode = "create" | "edit";

export type ShiftFormSidebarProps = Readonly<{
  show: boolean;
  mode?: ShiftFormSidebarMode;
  initialForm?: CreateStaffShiftFormState;
  editTenantId?: string;
  isAdmin: boolean;
  tenantOptions: readonly ShiftTenantOption[];
  lockedTenantId: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    tenantIds: readonly string[];
    form: CreateStaffShiftFormState;
  }) => void;
}>;

/** @deprecated Use ShiftFormSidebarProps */
export type AddShiftSidebarProps = ShiftFormSidebarProps;

export function ShiftFormSidebar({
  show,
  mode = "create",
  initialForm,
  editTenantId,
  isAdmin,
  tenantOptions,
  lockedTenantId,
  isSubmitting,
  onClose,
  onSubmit,
}: ShiftFormSidebarProps) {
  const isEditMode = mode === "edit";
  const [form, setForm] = useState(createDefaultShiftFormState);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    setValidationError(null);
    if (isEditMode) {
      setForm(initialForm ?? createDefaultShiftFormState());
      setSelectedTenantId(editTenantId ?? lockedTenantId);
      return;
    }
    setForm(createDefaultShiftFormState());
    if (isAdmin) {
      const defaultId =
        lockedTenantId && tenantOptions.some((option) => option.value === lockedTenantId)
          ? lockedTenantId
          : tenantOptions[0]?.value ?? "";
      setSelectedTenantId(defaultId);
      return;
    }
    setSelectedTenantId(lockedTenantId);
  }, [
    editTenantId,
    initialForm,
    isAdmin,
    isEditMode,
    lockedTenantId,
    show,
    tenantOptions,
  ]);

  const resolvedTenantIds =
    isEditMode
      ? editTenantId
        ? [editTenantId]
        : lockedTenantId
          ? [lockedTenantId]
          : []
      : isAdmin
        ? selectedTenantId
          ? [selectedTenantId]
          : []
        : lockedTenantId
          ? [lockedTenantId]
          : [];
  const validationMessage =
    validationError ?? validateCreateStaffShiftForm(form, resolvedTenantIds);
  const canSubmit = !validationMessage && !isSubmitting;
  const tenantFieldReadOnly = isEditMode || !isAdmin;
  const displayTenantId = isEditMode
    ? editTenantId ?? lockedTenantId
    : isAdmin
      ? selectedTenantId
      : lockedTenantId;

  const updateForm = <K extends keyof CreateStaffShiftFormState>(
    key: K,
    value: CreateStaffShiftFormState[K],
  ) => {
    setValidationError(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const error = validateCreateStaffShiftForm(form, resolvedTenantIds);
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit({ tenantIds: resolvedTenantIds, form });
  };

  const submitLabel = isEditMode ? "Save changes" : "Create shift";
  const submittingLabel = isEditMode ? "Saving..." : "Creating...";

  return (
    <PoliciesAttendanceFormSidebar
      show={show}
      onHide={onClose}
      disableClose={isSubmitting}
      title={isEditMode ? "Edit shift" : "Add shift"}
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
          <MainSettingsFormField id="shift-tenant" label="Tenant">
            <div className={MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS} aria-readonly="true">
              {tenantOptions.find((option) => option.value === displayTenantId)?.label ??
                displayTenantId}
            </div>
          </MainSettingsFormField>
        ) : (
          <PoliciesAttendanceTenantField
            id="shift-tenant"
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

        <MainSettingsFormField id="shift-name" label="Shift name">
          <Form.Control
            type="text"
            placeholder="General Shift"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
          />
        </MainSettingsFormField>

        <MainSettingsFormField id="shift-type" label="Type">
          <Form.Select
            value={form.type}
            onChange={(event) => updateForm("type", event.target.value)}
            className={MAIN_SETTINGS_FORM_SELECT_CLASS}
          >
            {SHIFT_TYPE_FORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </MainSettingsFormField>

        <div className="row g-3">
          <div className="col-md-6">
            <MainSettingsFormField id="shift-start-time" label="Start time">
              <Form.Control
                type="time"
                value={form.start_time}
                onChange={(event) => updateForm("start_time", event.target.value)}
                className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              />
            </MainSettingsFormField>
          </div>
          <div className="col-md-6">
            <MainSettingsFormField id="shift-end-time" label="End time">
              <Form.Control
                type="time"
                value={form.end_time}
                onChange={(event) => updateForm("end_time", event.target.value)}
                className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              />
            </MainSettingsFormField>
          </div>
        </div>

        <MainSettingsFormField id="shift-working-days" label="Working days">
          <div className="d-flex flex-wrap gap-3">
            {SHIFT_WORKING_DAY_OPTIONS.map((option) => (
              <Form.Check
                key={option.value}
                type="checkbox"
                id={`shift-day-${option.value}`}
                label={option.label}
                checked={form.working_days.includes(option.value)}
                onChange={() =>
                  updateForm("working_days", toggleShiftWorkingDay(form.working_days, option.value))
                }
              />
            ))}
          </div>
        </MainSettingsFormField>

        <div className="row g-3">
          <div className="col-md-6">
            <MainSettingsFormField id="shift-earliest-checkin" label="Earliest check-in">
              <Form.Control
                type="time"
                value={form.earliest_checkin ?? ""}
                onChange={(event) => updateForm("earliest_checkin", event.target.value)}
                className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              />
            </MainSettingsFormField>
          </div>
          <div className="col-md-6">
            <MainSettingsFormField id="shift-grace-period" label="Grace period (minutes)">
              <Form.Control
                type="number"
                min={0}
                value={form.grace_period_minutes ?? ""}
                onChange={(event) =>
                  updateForm(
                    "grace_period_minutes",
                    event.target.value === "" ? undefined : Number(event.target.value),
                  )
                }
                className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              />
            </MainSettingsFormField>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <MainSettingsFormField id="shift-hard-limit" label="Hard limit (hours)">
              <Form.Control
                type="number"
                min={1}
                value={form.hard_limit_hours ?? ""}
                onChange={(event) =>
                  updateForm(
                    "hard_limit_hours",
                    event.target.value === "" ? undefined : Number(event.target.value),
                  )
                }
                className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              />
            </MainSettingsFormField>
          </div>
          <div className="col-md-6">
            <MainSettingsFormField id="shift-effective-from" label="Effective from">
              <Form.Control
                type="date"
                value={form.effective_from}
                onChange={(event) => updateForm("effective_from", event.target.value)}
                className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              />
            </MainSettingsFormField>
          </div>
        </div>

        <MainSettingsFormField id="shift-status" label="Status">
          <Form.Select
            value={form.status}
            onChange={(event) => updateForm("status", event.target.value)}
            className={MAIN_SETTINGS_FORM_SELECT_CLASS}
          >
            {SHIFT_STATUS_FORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </MainSettingsFormField>

        <PoliciesAttendanceFormValidationMessage message={validationMessage} />
      </PoliciesAttendanceFormShell>
    </PoliciesAttendanceFormSidebar>
  );
}

export const AddShiftSidebar = ShiftFormSidebar;
