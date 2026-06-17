import { PolicyEffectiveDateFields } from "@page-modules/workforce/company-config/PolicyEffectiveDateFields";
import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import type { WorkHoursPolicyFormState } from "@page-modules/workforce/company-config/companyConfigDomain";
import React from "react";
import { Form } from "react-bootstrap";

export type WorkHoursPolicyFormProps = Readonly<{
  form: WorkHoursPolicyFormState;
  disabled: boolean;
  onChange: (form: WorkHoursPolicyFormState) => void;
}>;

export function WorkHoursPolicyForm({ form, disabled, onChange }: WorkHoursPolicyFormProps) {
  const updateForm = <K extends keyof WorkHoursPolicyFormState>(
    key: K,
    value: WorkHoursPolicyFormState[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <>
      <div className="row g-3">
        <div className="col-md-6">
          <MainSettingsFormField
            id="work-hours-min-hours"
            label="Minimum hours per day *"
            hint="Expected minimum working hours for a full day."
          >
            <Form.Control
              type="number"
              min={1}
              step="0.5"
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              value={form.min_hours_per_day}
              disabled={disabled}
              onChange={(event) =>
                updateForm(
                  "min_hours_per_day",
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
            />
          </MainSettingsFormField>
        </div>
        <div className="col-md-6">
          <MainSettingsFormField
            id="work-hours-max-hours"
            label="Maximum hours per day *"
            hint="Upper limit for daily working hours."
          >
            <Form.Control
              type="number"
              min={1}
              step="0.5"
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              value={form.max_hours_per_day}
              disabled={disabled}
              onChange={(event) =>
                updateForm(
                  "max_hours_per_day",
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
            />
          </MainSettingsFormField>
        </div>
      </div>

      <PolicyEffectiveDateFields
        idPrefix="work-hours"
        effectiveFrom={form.effective_from}
        effectiveTo={form.effective_to}
        disabled={disabled}
        fromHint="Date from which this work hours policy applies."
        onEffectiveFromChange={(value) => updateForm("effective_from", value)}
        onEffectiveToChange={(value) => updateForm("effective_to", value)}
      />
    </>
  );
}
