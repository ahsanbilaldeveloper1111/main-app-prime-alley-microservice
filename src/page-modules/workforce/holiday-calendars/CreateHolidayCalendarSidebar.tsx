import {
  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,
  PoliciesAttendanceFormValidationMessage,
  PoliciesAttendanceTenantField,
} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";
import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MAIN_SETTINGS_FORM_SELECT_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import {
  HOLIDAY_CALENDAR_STATUS_FORM_OPTIONS,
  createDefaultHolidayCalendarFormState,
  validateCreateHolidayCalendarForm,
  type CreateHolidayCalendarFormState,
  type HolidayTenantOption,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";

export type CreateHolidayCalendarSidebarProps = Readonly<{
  show: boolean;
  isAdmin: boolean;
  tenantOptions: readonly HolidayTenantOption[];
  lockedTenantId: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    tenantId: string;
    form: CreateHolidayCalendarFormState;
  }) => void;
}>;

export function CreateHolidayCalendarSidebar({
  show,
  isAdmin,
  tenantOptions,
  lockedTenantId,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateHolidayCalendarSidebarProps) {
  const [form, setForm] = useState(createDefaultHolidayCalendarFormState);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    setForm(createDefaultHolidayCalendarFormState());
    setValidationError(null);
    if (isAdmin) {
      const defaultId =
        lockedTenantId && tenantOptions.some((option) => option.value === lockedTenantId)
          ? lockedTenantId
          : tenantOptions[0]?.value ?? "";
      setSelectedTenantId(defaultId);
      return;
    }
    setSelectedTenantId(lockedTenantId);
  }, [isAdmin, lockedTenantId, show, tenantOptions]);

  const resolvedTenantId = isAdmin ? selectedTenantId : lockedTenantId;
  const validationMessage =
    validationError ?? validateCreateHolidayCalendarForm(form, resolvedTenantId);
  const canSubmit = !validationMessage && !isSubmitting;

  const updateForm = <K extends keyof CreateHolidayCalendarFormState>(
    key: K,
    value: CreateHolidayCalendarFormState[K],
  ) => {
    setValidationError(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const error = validateCreateHolidayCalendarForm(form, resolvedTenantId);
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit({ tenantId: resolvedTenantId, form });
  };

  return (
    <PoliciesAttendanceFormSidebar
      show={show}
      onHide={onClose}
      disableClose={isSubmitting}
      title="Create holiday calendar"
      footer={
        <PoliciesAttendanceFormSidebarFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitLabel="Create calendar"
        />
      }
    >
      <PoliciesAttendanceFormShell>
        <PoliciesAttendanceTenantField
          id="holiday-tenant"
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

        <MainSettingsFormField id="holiday-name" label="Calendar name *">
          <Form.Control
            type="text"
            placeholder="Company Holidays 2026"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
          />
        </MainSettingsFormField>

        <MainSettingsFormField id="holiday-year" label="Year *">
          <Form.Control
            type="number"
            min={1900}
            max={9999}
            value={form.year}
            onChange={(event) =>
              updateForm("year", event.target.value === "" ? form.year : Number(event.target.value))
            }
            className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
          />
        </MainSettingsFormField>

        <MainSettingsFormField id="holiday-status" label="Status *">
          <Form.Select
            value={form.status}
            className={MAIN_SETTINGS_FORM_SELECT_CLASS}
            onChange={(event) => updateForm("status", event.target.value)}
          >
            {HOLIDAY_CALENDAR_STATUS_FORM_OPTIONS.map((option) => (
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
