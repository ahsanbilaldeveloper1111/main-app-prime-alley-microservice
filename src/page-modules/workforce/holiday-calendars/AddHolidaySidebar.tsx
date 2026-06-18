import {
  PoliciesAttendanceFormShell,
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooter,
  PoliciesAttendanceFormValidationMessage,
} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";
import { HolidayEntryFormFields } from "@page-modules/workforce/holiday-calendars/HolidayEntryFormFields";
import {
  createDefaultCalendarHolidayFormState,
  getCalendarHolidayDateBounds,
  readHolidayCalendarYear,
  validateCreateCalendarHolidayForm,
  type CreateCalendarHolidayFormState,
  type HolidayDepartmentOption,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import type { HolidayCalendar } from "@utils/staffManagement";
import React, { useEffect, useMemo, useState } from "react";

export type AddHolidaySidebarProps = Readonly<{
  show: boolean;
  calendar: HolidayCalendar | null;
  departmentOptions: readonly HolidayDepartmentOption[];
  departmentsLoading: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: { calendarId: number; form: CreateCalendarHolidayFormState }) => void;
}>;

export function AddHolidaySidebar({
  show,
  calendar,
  departmentOptions,
  departmentsLoading,
  isSubmitting,
  onClose,
  onSubmit,
}: AddHolidaySidebarProps) {
  const [form, setForm] = useState(createDefaultCalendarHolidayFormState);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    setForm(createDefaultCalendarHolidayFormState());
    setValidationError(null);
  }, [calendar?.id, show]);

  const calendarYear = calendar ? readHolidayCalendarYear(calendar) : null;
  const dateBounds = useMemo(() => {
    if (calendarYear === null) {
      return null;
    }
    return getCalendarHolidayDateBounds(calendarYear);
  }, [calendarYear]);
  const minDate = dateBounds ? new Date(`${dateBounds.min}T00:00:00`) : undefined;
  const maxDate = dateBounds ? new Date(`${dateBounds.max}T00:00:00`) : undefined;

  const validationMessage =
    validationError ??
    validateCreateCalendarHolidayForm(form, { calendarYear });
  const canSubmit =
    !validationMessage && !isSubmitting && calendar != null && calendarYear != null;
  const calendarLabel = calendar?.name?.trim() || "calendar";

  const updateForm = <K extends keyof CreateCalendarHolidayFormState>(
    key: K,
    value: CreateCalendarHolidayFormState[K],
  ) => {
    setValidationError(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    if (!calendar) return;
    const error = validateCreateCalendarHolidayForm(form, { calendarYear });
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit({ calendarId: calendar.id, form });
  };

  return (
    <PoliciesAttendanceFormSidebar
      show={show}
      onHide={onClose}
      disableClose={isSubmitting}
      title={`Add holiday to ${calendarLabel}`}
      footer={
        <PoliciesAttendanceFormSidebarFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          submitLabel="Add holiday"
          submittingLabel="Adding..."
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
        />

        <PoliciesAttendanceFormValidationMessage message={validationMessage} />
      </PoliciesAttendanceFormShell>
    </PoliciesAttendanceFormSidebar>
  );
}
