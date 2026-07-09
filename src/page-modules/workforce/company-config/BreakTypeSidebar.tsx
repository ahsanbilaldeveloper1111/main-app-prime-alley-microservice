import {
  BREAK_TYPE_FLEXIBLE_DURATION_MAX,
  BREAK_TYPE_FLEXIBLE_DURATION_MIN,
  BREAK_TYPE_FORM_OPTIONS,
  BREAK_TYPE_NAME_MAX_LENGTH,
  breakTypeToFormState,
  createDefaultBreakTypeFormState,
  isFixedBreakType,
  isFlexibleBreakType,
  validateBreakTypeForm,
  type BreakTypeFormState,
  type BreakTypeTenantOption,
} from "@page-modules/workforce/company-config/breakTypesDomain";
import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MAIN_SETTINGS_FORM_SELECT_CLASS,
  MainSettingsDatePicker,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import {
  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,
  PoliciesAttendanceFormValidationMessage,
  PoliciesAttendanceTenantField,
} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";
import type { AttendanceBreakType } from "@utils/staffManagement";
import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";

export type BreakTypeSidebarProps = Readonly<{
  show: boolean;
  mode: "create" | "edit";
  breakType?: AttendanceBreakType | null;
  isAdmin: boolean;
  tenantOptions: readonly BreakTypeTenantOption[];
  lockedTenantId: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: { tenantId: string; form: BreakTypeFormState }) => void;
}>;

export function BreakTypeSidebar({
  show,
  mode,
  breakType,
  isAdmin,
  tenantOptions,
  lockedTenantId,
  isSubmitting,
  onClose,
  onSubmit,
}: BreakTypeSidebarProps) {
  const [form, setForm] = useState(createDefaultBreakTypeFormState);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    setValidationError(null);
    setForm(mode === "edit" ? breakTypeToFormState(breakType) : createDefaultBreakTypeFormState());
    if (isAdmin) {
      const defaultId =
        lockedTenantId && tenantOptions.some((option) => option.value === lockedTenantId)
          ? lockedTenantId
          : tenantOptions[0]?.value ?? "";
      setSelectedTenantId(defaultId);
      return;
    }
    setSelectedTenantId(lockedTenantId);
  }, [breakType, isAdmin, lockedTenantId, mode, show, tenantOptions]);

  const resolvedTenantId = isAdmin ? selectedTenantId : lockedTenantId;
  const validationMessage = validationError ?? validateBreakTypeForm(form, resolvedTenantId);
  const canSubmit = !validationMessage && !isSubmitting;
  const isFixed = isFixedBreakType(form.type);
  const isFlexible = isFlexibleBreakType(form.type);

  const updateForm = <K extends keyof BreakTypeFormState>(
    key: K,
    value: BreakTypeFormState[K],
  ) => {
    setValidationError(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const error = validateBreakTypeForm(form, resolvedTenantId);
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit({ tenantId: resolvedTenantId, form });
  };

  return (
    <PoliciesAttendanceFormSidebar
      show={show}
      title={mode === "edit" ? "Edit break type" : "Add break type"}
      onHide={onClose}
      disableClose={isSubmitting}
      footer={
        <PoliciesAttendanceFormSidebarFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitLabel={mode === "edit" ? "Save break type" : "Create break type"}
        />
      }
    >
      <PoliciesAttendanceFormShell>
        {mode === "create" ? (
          <PoliciesAttendanceTenantField
            id="break-type-tenant"
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
        ) : null}

        <MainSettingsFormField
          id="break-type-name"
          label="Break name *"
          hint={`Max ${BREAK_TYPE_NAME_MAX_LENGTH} characters. Must be unique per company.`}
        >
          <Form.Control
            type="text"
            maxLength={BREAK_TYPE_NAME_MAX_LENGTH}
            className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
            placeholder="Lunch break"
            value={form.name}
            disabled={isSubmitting}
            onChange={(event) => updateForm("name", event.target.value)}
          />
        </MainSettingsFormField>

        <MainSettingsFormField id="break-type-type" label="Break type *">
          <Form.Select
            className={MAIN_SETTINGS_FORM_SELECT_CLASS}
            value={form.type}
            disabled={isSubmitting}
            onChange={(event) => updateForm("type", event.target.value)}
          >
            {BREAK_TYPE_FORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </MainSettingsFormField>

        {isFixed ? (
          <div className="row g-3">
            <div className="col-md-6">
              <MainSettingsFormField id="break-type-start-time" label="Start time *">
                <Form.Control
                  type="time"
                  className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
                  value={form.start_time}
                  disabled={isSubmitting}
                  onChange={(event) => updateForm("start_time", event.target.value)}
                />
              </MainSettingsFormField>
            </div>
            <div className="col-md-6">
              <MainSettingsFormField
                id="break-type-end-time"
                label="End time *"
                hint="If the break is not taken by this time, a violation is flagged."
              >
                <Form.Control
                  type="time"
                  className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
                  value={form.end_time}
                  disabled={isSubmitting}
                  onChange={(event) => updateForm("end_time", event.target.value)}
                />
              </MainSettingsFormField>
            </div>
          </div>
        ) : null}

        {isFlexible ? (
          <MainSettingsFormField
            id="break-type-duration"
            label="Maximum duration (minutes) *"
            hint={`Min ${BREAK_TYPE_FLEXIBLE_DURATION_MIN}, max ${BREAK_TYPE_FLEXIBLE_DURATION_MAX}.`}
          >
            <Form.Control
              type="number"
              min={BREAK_TYPE_FLEXIBLE_DURATION_MIN}
              max={BREAK_TYPE_FLEXIBLE_DURATION_MAX}
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              value={form.duration_minutes}
              disabled={isSubmitting}
              onChange={(event) =>
                updateForm(
                  "duration_minutes",
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
            />
          </MainSettingsFormField>
        ) : null}

        <MainSettingsFormField
          id="break-type-max-per-day"
          label="Maximum breaks per day *"
          hint="Exceeding this flags a violation but does not block the employee."
        >
          <Form.Control
            type="number"
            min={1}
            className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
            value={form.max_per_day}
            disabled={isSubmitting}
            onChange={(event) =>
              updateForm("max_per_day", event.target.value === "" ? 0 : Number(event.target.value))
            }
          />
        </MainSettingsFormField>

        <MainSettingsFormField
          id="break-type-paid"
          label="Paid / Unpaid *"
          hint="Paid breaks count toward worked hours; unpaid breaks are deducted."
        >
          <Form.Check
            type="switch"
            id="break-type-is-paid"
            label="Paid break"
            checked={form.is_paid}
            disabled={isSubmitting}
            onChange={(event) => updateForm("is_paid", event.target.checked)}
          />
        </MainSettingsFormField>

        <MainSettingsFormField id="break-type-active" label="Status *">
          <Form.Check
            type="switch"
            id="break-type-is-active"
            label="Active"
            checked={form.is_active}
            disabled={isSubmitting}
            onChange={(event) => updateForm("is_active", event.target.checked)}
          />
        </MainSettingsFormField>

        <MainSettingsFormField
          id="break-type-effective-from"
          label="Effective from *"
          hint="Must be today or a future date."
        >
          <MainSettingsDatePicker
            id="break-type-effective-from"
            value={form.effective_from}
            disabled={isSubmitting}
            onChange={(value) => updateForm("effective_from", value)}
          />
        </MainSettingsFormField>

        <PoliciesAttendanceFormValidationMessage message={validationMessage} />
      </PoliciesAttendanceFormShell>
    </PoliciesAttendanceFormSidebar>
  );
}
