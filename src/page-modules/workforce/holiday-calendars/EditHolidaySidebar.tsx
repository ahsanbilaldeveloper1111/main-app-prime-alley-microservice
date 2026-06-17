import {
  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,
  PoliciesAttendanceFormValidationMessage,
} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";
import { HolidayEntryFormFields } from "@page-modules/workforce/holiday-calendars/HolidayEntryFormFields";
import {
  calendarHolidayToFormState,
  createDefaultCalendarHolidayFormState,
  getCalendarHolidayDateBounds,
  readCalendarHolidayId,
  readHolidayCalendarYear,
  validateCreateCalendarHolidayForm,
  type CreateCalendarHolidayFormState,
  type HolidayDepartmentOption,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import type { HolidayCalendar, HolidayCalendarHoliday } from "@utils/staffManagement";
import React, { useEffect, useMemo, useState } from "react";

export type EditHolidaySidebarProps = Readonly<{
  show: boolean;
  calendar: HolidayCalendar | null;
  holiday: HolidayCalendarHoliday | null;
  departmentOptions: readonly HolidayDepartmentOption[];
  departmentsLoading: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    calendarId: number;
    holidayId: number;
    form: CreateCalendarHolidayFormState;
  }) => void;
}>;

export function EditHolidaySidebar({
  show,
  calendar,
  holiday,
  departmentOptions,
  departmentsLoading,
  isSubmitting,
  onClose,
  onSubmit,
}: EditHolidaySidebarProps) {
  const [form, setForm] = useState(createDefaultCalendarHolidayFormState);
  const [validationError, setValidationError] = useState<string | null>(null);
  const holidayId = holiday ? readCalendarHolidayId(holiday) : null;

  useEffect(() => {
    if (!show || !holiday) return;
    setForm(calendarHolidayToFormState(holiday));
    setValidationError(null);
  }, [holiday, show]);

  const calendarYear = calendar ? readHolidayCalendarYear(calendar) : null;
  const dateBounds = useMemo(
    () => (calendarYear != null ? getCalendarHolidayDateBounds(calendarYear) : null),
    [calendarYear],
  );
  const minDate = dateBounds ? new Date(`${dateBounds.min}T00:00:00`) : undefined;
  const maxDate = dateBounds ? new Date(`${dateBounds.max}T00:00:00`) : undefined;

  const validationMessage =
    validationError ?? validateCreateCalendarHolidayForm(form, { calendarYear });
  const canSubmit =
    !validationMessage &&
    !isSubmitting &&
    calendar != null &&
    holidayId != null &&
    calendarYear != null;
  const holidayLabel = holiday?.name?.trim() || "holiday";

  const updateForm = <K extends keyof CreateCalendarHolidayFormState>(
    key: K,
    value: CreateCalendarHolidayFormState[K],
  ) => {
    setValidationError(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    if (!calendar || holidayId == null) return;
    const error = validateCreateCalendarHolidayForm(form, { calendarYear });
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit({ calendarId: calendar.id, holidayId, form });
  };

  return (
    <PoliciesAttendanceFormSidebar
      show={show}
      onHide={onClose}
      disableClose={isSubmitting}
      title={`Edit ${holidayLabel}`}
      footer={
        <PoliciesAttendanceFormSidebarFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitLabel="Save changes"
          submittingLabel="Saving..."
        />
      }
    >
      <PoliciesAttendanceFormShell>
        <HolidayEntryFormFields
          form={form}
          calendarYear={calendarYear}
          minDate={minDate}
          maxDate={maxDate}
          departmentOptions={departmentOptions}
          departmentsLoading={departmentsLoading}
          onChange={updateForm}
          onScopeChange={(scope) => {
            setValidationError(null);
            setForm((current) => ({
              ...current,
              scope,
              department_id: scope === "department" ? current.department_id : "",
            }));
          }}
          idPrefix="holiday-edit"
        />

        <PoliciesAttendanceFormValidationMessage message={validationMessage} />
      </PoliciesAttendanceFormShell>
    </PoliciesAttendanceFormSidebar>
  );
}
