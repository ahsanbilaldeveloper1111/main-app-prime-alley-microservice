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

function readShiftTenantIdList(tenantId: string): readonly string[] {
  const trimmed = tenantId.trim();
  return trimmed ? [trimmed] : [];
}

function resolveDefaultShiftSelectedTenantId(
  isAdmin: boolean,
  lockedTenantId: string,
  tenantOptions: readonly ShiftTenantOption[],
): string {
  if (!isAdmin) {
    return lockedTenantId;
  }
  if (lockedTenantId && tenantOptions.some((option) => option.value === lockedTenantId)) {
    return lockedTenantId;
  }
  return tenantOptions[0]?.value ?? "";
}

function readShiftSidebarInitialState(
  isEditMode: boolean,
  isAdmin: boolean,
  initialForm: CreateStaffShiftFormState | undefined,
  editTenantId: string | undefined,
  lockedTenantId: string,
  tenantOptions: readonly ShiftTenantOption[],
): Readonly<{
  form: CreateStaffShiftFormState;
  selectedTenantId: string;
}> {
  if (isEditMode) {
    return {
      form: initialForm ?? createDefaultShiftFormState(),
      selectedTenantId: editTenantId ?? lockedTenantId,
    };
  }

  return {
    form: createDefaultShiftFormState(),
    selectedTenantId: resolveDefaultShiftSelectedTenantId(
      isAdmin,
      lockedTenantId,
      tenantOptions,
    ),
  };
}

function resolveShiftFormTenantIds(args: Readonly<{
  isEditMode: boolean;
  isAdmin: boolean;
  editTenantId?: string;
  selectedTenantId: string;
  lockedTenantId: string;
}>): readonly string[] {
  if (args.isEditMode) {
    if (args.editTenantId?.trim()) {
      return [args.editTenantId.trim()];
    }
    return readShiftTenantIdList(args.lockedTenantId);
  }

  if (args.isAdmin) {
    return readShiftTenantIdList(args.selectedTenantId);
  }

  return readShiftTenantIdList(args.lockedTenantId);
}

function resolveShiftFormDisplayTenantId(args: Readonly<{
  isEditMode: boolean;
  isAdmin: boolean;
  editTenantId?: string;
  selectedTenantId: string;
  lockedTenantId: string;
}>): string {
  if (args.isEditMode) {
    return args.editTenantId?.trim() || args.lockedTenantId;
  }

  if (args.isAdmin) {
    return args.selectedTenantId;
  }

  return args.lockedTenantId;
}

function readShiftSidebarLabels(isEditMode: boolean): Readonly<{
  title: string;
  submitLabel: string;
  submittingLabel: string;
}> {
  if (isEditMode) {
    return {
      title: "Edit shift",
      submitLabel: "Save changes",
      submittingLabel: "Saving...",
    };
  }

  return {
    title: "Add shift",
    submitLabel: "Create shift",
    submittingLabel: "Creating...",
  };
}

type ShiftSidebarTenantFieldSectionProps = Readonly<{
  tenantFieldReadOnly: boolean;
  displayTenantId: string;
  tenantOptions: readonly ShiftTenantOption[];
  isAdmin: boolean;
  selectedTenantId: string;
  lockedTenantId: string;
  isSubmitting: boolean;
  onTenantChange: (tenantId: string) => void;
}>;

function ShiftSidebarTenantFieldSection({
  tenantFieldReadOnly,
  displayTenantId,
  tenantOptions,
  isAdmin,
  selectedTenantId,
  lockedTenantId,
  isSubmitting,
  onTenantChange,
}: ShiftSidebarTenantFieldSectionProps) {
  if (tenantFieldReadOnly) {
    return (
      <MainSettingsFormField id="shift-tenant" label="Tenant">
        <div className={MAIN_SETTINGS_FORM_READONLY_VALUE_CLASS} aria-readonly="true">
          {tenantOptions.find((option) => option.value === displayTenantId)?.label ??
            displayTenantId}
        </div>
      </MainSettingsFormField>
    );
  }

  return (
    <PoliciesAttendanceTenantField
      id="shift-tenant"
      isAdmin={isAdmin}
      tenantOptions={tenantOptions}
      selectedTenantId={selectedTenantId}
      lockedTenantId={lockedTenantId}
      disabled={isSubmitting}
      onTenantChange={onTenantChange}
    />
  );
}

type ShiftSidebarFormFieldsProps = Readonly<{
  form: CreateStaffShiftFormState;
  onChange: <K extends keyof CreateStaffShiftFormState>(
    key: K,
    value: CreateStaffShiftFormState[K],
  ) => void;
}>;

function ShiftSidebarFormFields({ form, onChange }: ShiftSidebarFormFieldsProps) {
  return (
    <>
      <MainSettingsFormField id="shift-name" label="Shift name">
        <Form.Control
          type="text"
          placeholder="General Shift"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
        />
      </MainSettingsFormField>

      <MainSettingsFormField id="shift-type" label="Type">
        <Form.Select
          value={form.type}
          onChange={(event) => onChange("type", event.target.value)}
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
              onChange={(event) => onChange("start_time", event.target.value)}
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
            />
          </MainSettingsFormField>
        </div>
        <div className="col-md-6">
          <MainSettingsFormField id="shift-end-time" label="End time">
            <Form.Control
              type="time"
              value={form.end_time}
              onChange={(event) => onChange("end_time", event.target.value)}
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
                onChange("working_days", toggleShiftWorkingDay(form.working_days, option.value))
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
              onChange={(event) => onChange("earliest_checkin", event.target.value)}
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
                onChange(
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
                onChange(
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
              onChange={(event) => onChange("effective_from", event.target.value)}
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
            />
          </MainSettingsFormField>
        </div>
      </div>

      <MainSettingsFormField id="shift-status" label="Status">
        <Form.Select
          value={form.status}
          onChange={(event) => onChange("status", event.target.value)}
          className={MAIN_SETTINGS_FORM_SELECT_CLASS}
        >
          {SHIFT_STATUS_FORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </MainSettingsFormField>
    </>
  );
}

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

    const initialState = readShiftSidebarInitialState(
      isEditMode,
      isAdmin,
      initialForm,
      editTenantId,
      lockedTenantId,
      tenantOptions,
    );
    setForm(initialState.form);
    setSelectedTenantId(initialState.selectedTenantId);
  }, [
    editTenantId,
    initialForm,
    isAdmin,
    isEditMode,
    lockedTenantId,
    show,
    tenantOptions,
  ]);

  const tenantResolutionArgs = {
    isEditMode,
    isAdmin,
    editTenantId,
    selectedTenantId,
    lockedTenantId,
  };
  const resolvedTenantIds = resolveShiftFormTenantIds(tenantResolutionArgs);
  const displayTenantId = resolveShiftFormDisplayTenantId(tenantResolutionArgs);
  const validationMessage =
    validationError ?? validateCreateStaffShiftForm(form, resolvedTenantIds);
  const canSubmit = !validationMessage && !isSubmitting;
  const tenantFieldReadOnly = isEditMode || !isAdmin;

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

  const submitLabels = readShiftSidebarLabels(isEditMode);

  return (
    <PoliciesAttendanceFormSidebar
      show={show}
      onHide={onClose}
      disableClose={isSubmitting}
      title={submitLabels.title}
      footer={
        <PoliciesAttendanceFormSidebarFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitLabel={submitLabels.submitLabel}
          submittingLabel={submitLabels.submittingLabel}
        />
      }
    >
      <PoliciesAttendanceFormShell>
        <ShiftSidebarTenantFieldSection
          tenantFieldReadOnly={tenantFieldReadOnly}
          displayTenantId={displayTenantId}
          tenantOptions={tenantOptions}
          isAdmin={isAdmin}
          selectedTenantId={selectedTenantId}
          lockedTenantId={lockedTenantId}
          isSubmitting={isSubmitting}
          onTenantChange={(tenantId) => {
            setValidationError(null);
            setSelectedTenantId(tenantId);
          }}
        />

        <ShiftSidebarFormFields form={form} onChange={updateForm} />

        <PoliciesAttendanceFormValidationMessage message={validationMessage} />
      </PoliciesAttendanceFormShell>
    </PoliciesAttendanceFormSidebar>
  );
}

export const AddShiftSidebar = ShiftFormSidebar;
