import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MainSettingsDatePicker,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import type { ShiftAssignmentFormState } from "@page-modules/workforce/shifts/shiftAssignmentsDomain";
import React from "react";
import { Form } from "react-bootstrap";

export type ShiftAssignmentFormProps = Readonly<{
  form: ShiftAssignmentFormState;
  disabled: boolean;
  shiftOptions: ReadonlyArray<{ value: number; label: string }>;
  userOptions: ReadonlyArray<{ value: string; label: string }>;
  shiftsLoading: boolean;
  usersLoading: boolean;
  onChange: (form: ShiftAssignmentFormState) => void;
}>;

export function ShiftAssignmentForm({
  form,
  disabled,
  shiftOptions,
  userOptions,
  shiftsLoading,
  usersLoading,
  onChange,
}: ShiftAssignmentFormProps) {
  const updateForm = <K extends keyof ShiftAssignmentFormState>(
    key: K,
    value: ShiftAssignmentFormState[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <>
      <MainSettingsFormField id="shift-assignment-shift" label="Shift *">
        <Form.Select
          className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
          value={form.shift_id || ""}
          disabled={disabled || shiftsLoading || shiftOptions.length === 0}
          onChange={(event) =>
            updateForm("shift_id", event.target.value === "" ? 0 : Number(event.target.value))
          }
        >
          <option value="">
            {shiftsLoading ? "Loading shifts..." : "Select shift"}
          </option>
          {shiftOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </MainSettingsFormField>

      <MainSettingsFormField id="shift-assignment-user" label="User *">
        <Form.Select
          className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
          value={form.user_id}
          disabled={disabled || usersLoading || userOptions.length === 0}
          onChange={(event) => updateForm("user_id", event.target.value)}
        >
          <option value="">
            {usersLoading ? "Loading users..." : "Select user"}
          </option>
          {userOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </MainSettingsFormField>

      <MainSettingsFormField
        id="shift-assignment-effective-from"
        label="Effective from *"
        hint="Date from which this shift assignment applies."
      >
        <MainSettingsDatePicker
          id="shift-assignment-effective-from"
          value={form.effective_from}
          disabled={disabled}
          onChange={(value) => updateForm("effective_from", value)}
        />
      </MainSettingsFormField>

      <MainSettingsFormField
        id="shift-assignment-effective-to"
        label="Effective to"
        hint="Optional end date for this assignment. Leave empty for open-ended."
      >
        <MainSettingsDatePicker
          id="shift-assignment-effective-to"
          value={form.effective_to}
          disabled={disabled}
          onChange={(value) => updateForm("effective_to", value)}
        />
      </MainSettingsFormField>

      <MainSettingsFormField
        id="shift-assignment-reason"
        label="Reason *"
        hint="Brief note explaining why this assignment was made."
      >
        <Form.Control
          as="textarea"
          rows={3}
          className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
          value={form.reason}
          disabled={disabled}
          onChange={(event) => updateForm("reason", event.target.value)}
        />
      </MainSettingsFormField>
    </>
  );
}
