import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MAIN_SETTINGS_FORM_SELECT_CLASS,
  MainSettingsDatePicker,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import {
  HOLIDAY_HALF_DAY_FORM_OPTIONS,
  HOLIDAY_SCOPE_FORM_OPTIONS,
  type CreateCalendarHolidayFormState,
  type HolidayDepartmentOption,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import React from "react";
import { Form } from "react-bootstrap";

export type HolidayEntryFormFieldsProps = Readonly<{
  form: CreateCalendarHolidayFormState;
  calendarYear: number | null;
  minDate?: Date;
  maxDate?: Date;
  departmentOptions: readonly HolidayDepartmentOption[];
  departmentsLoading: boolean;
  onChange: <K extends keyof CreateCalendarHolidayFormState>(
    key: K,
    value: CreateCalendarHolidayFormState[K],
  ) => void;
  onScopeChange: (scope: CreateCalendarHolidayFormState["scope"]) => void;
  idPrefix?: string;
}>;

function readHolidayDateFieldHint(calendarYear: number | null): string | undefined {
  if (calendarYear === null) {
    return undefined;
  }
  return `Only dates in ${calendarYear} are allowed.`;
}

function readDepartmentSelectPlaceholder(
  departmentsLoading: boolean,
  departmentOptionCount: number,
): string {
  if (departmentsLoading) {
    return "Loading departments...";
  }
  if (departmentOptionCount === 0) {
    return "No departments available";
  }
  return "Select department";
}

export function HolidayEntryFormFields({
  form,
  calendarYear,
  minDate,
  maxDate,
  departmentOptions,
  departmentsLoading,
  onChange,
  onScopeChange,
  idPrefix = "holiday-entry",
}: HolidayEntryFormFieldsProps) {
  const isDepartmentScope = form.scope === "department";
  const dateFieldHint = readHolidayDateFieldHint(calendarYear);
  const departmentPlaceholder = readDepartmentSelectPlaceholder(
    departmentsLoading,
    departmentOptions.length,
  );

  return (
    <>
      <MainSettingsFormField id={`${idPrefix}-name`} label="Holiday name *">
        <Form.Control
          type="text"
          placeholder="Independence Day"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
        />
      </MainSettingsFormField>

      <MainSettingsFormField
        id={`${idPrefix}-date`}
        label="Date *"
        hint={dateFieldHint}
      >
        <MainSettingsDatePicker
          id={`${idPrefix}-date`}
          value={form.date}
          minDate={minDate}
          maxDate={maxDate}
          disabled={calendarYear == null}
          placeholder="Select holiday date"
          onChange={(value) => onChange("date", value)}
        />
      </MainSettingsFormField>

      <MainSettingsFormField id={`${idPrefix}-scope`} label="Scope *">
        <Form.Select
          value={form.scope}
          className={MAIN_SETTINGS_FORM_SELECT_CLASS}
          onChange={(event) =>
            onScopeChange(event.target.value as CreateCalendarHolidayFormState["scope"])
          }
        >
          {HOLIDAY_SCOPE_FORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </MainSettingsFormField>

      {isDepartmentScope ? (
        <MainSettingsFormField id={`${idPrefix}-department`} label="Department *">
          <Form.Select
            value={form.department_id}
            className={MAIN_SETTINGS_FORM_SELECT_CLASS}
            disabled={departmentsLoading || departmentOptions.length === 0}
            onChange={(event) => onChange("department_id", event.target.value)}
          >
            <option value="">{departmentPlaceholder}</option>
            {departmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </MainSettingsFormField>
      ) : null}

      <MainSettingsFormField id={`${idPrefix}-half-day`} label="Half day (optional)">
        <Form.Select
          value={form.half_day}
          className={MAIN_SETTINGS_FORM_SELECT_CLASS}
          onChange={(event) =>
            onChange("half_day", event.target.value as CreateCalendarHolidayFormState["half_day"])
          }
        >
          {HOLIDAY_HALF_DAY_FORM_OPTIONS.map((option) => (
            <option key={option.value || "full-day"} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </MainSettingsFormField>
    </>
  );
}
