import { PolicyEffectiveDateFields } from "@page-modules/workforce/company-config/PolicyEffectiveDateFields";
import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import type { OvertimePolicyFormState } from "@page-modules/workforce/company-config/overtimeDomain";
import React from "react";
import { Form } from "react-bootstrap";

export type OvertimePolicyFormProps = Readonly<{
  form: OvertimePolicyFormState;
  disabled: boolean;
  onChange: (form: OvertimePolicyFormState) => void;
}>;

export function OvertimePolicyForm({ form, disabled, onChange }: OvertimePolicyFormProps) {
  const updateForm = <K extends keyof OvertimePolicyFormState>(
    key: K,
    value: OvertimePolicyFormState[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <>
      <div className="row g-3">
        <div className="col-md-6">
          <MainSettingsFormField
            id="overtime-buffer-minutes"
            label="Buffer (minutes) *"
            hint="Grace period before overtime is counted after scheduled hours."
          >
            <Form.Control
              type="number"
              min={0}
              step={1}
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              value={form.buffer_minutes}
              disabled={disabled}
              onChange={(event) =>
                updateForm(
                  "buffer_minutes",
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
            />
          </MainSettingsFormField>
        </div>
        <div className="col-md-6">
          <MainSettingsFormField
            id="overtime-weekly-cap"
            label="Weekly cap (hours) *"
            hint="Maximum overtime hours allowed per week."
          >
            <Form.Control
              type="number"
              min={1}
              step="0.5"
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              value={form.weekly_cap_hours}
              disabled={disabled}
              onChange={(event) =>
                updateForm(
                  "weekly_cap_hours",
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
            />
          </MainSettingsFormField>
        </div>
      </div>

      <MainSettingsFormField id="overtime-enabled" label="Overtime tracking">
        <Form.Check
          type="checkbox"
          id="overtime-is-enabled"
          label="Overtime policy is enabled"
          checked={form.enabled}
          disabled={disabled}
          onChange={(event) => updateForm("enabled", event.target.checked)}
        />
      </MainSettingsFormField>

      <PolicyEffectiveDateFields
        idPrefix="overtime"
        effectiveFrom={form.effective_from}
        effectiveTo={form.effective_to}
        disabled={disabled}
        fromHint="Date from which this overtime policy applies."
        onEffectiveFromChange={(value) => updateForm("effective_from", value)}
        onEffectiveToChange={(value) => updateForm("effective_to", value)}
      />
    </>
  );
}
