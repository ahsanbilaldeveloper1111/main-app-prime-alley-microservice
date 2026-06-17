import { PolicyEffectiveDateFields } from "@page-modules/workforce/company-config/PolicyEffectiveDateFields";
import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import type { BreaksPolicyFormState } from "@page-modules/workforce/company-config/breaksDomain";
import React from "react";
import { Form } from "react-bootstrap";

export type BreaksPolicyFormProps = Readonly<{
  form: BreaksPolicyFormState;
  disabled: boolean;
  onChange: (form: BreaksPolicyFormState) => void;
}>;

export function BreaksPolicyForm({ form, disabled, onChange }: BreaksPolicyFormProps) {
  const updateForm = <K extends keyof BreaksPolicyFormState>(
    key: K,
    value: BreaksPolicyFormState[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <>
      <div className="row g-3">
        <div className="col-md-6">
          <MainSettingsFormField
            id="breaks-max-per-day"
            label="Maximum breaks per day *"
            hint="How many breaks an employee may take in one day."
          >
            <Form.Control
              type="number"
              min={1}
              step={1}
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              value={form.max_breaks_per_day}
              disabled={disabled}
              onChange={(event) =>
                updateForm(
                  "max_breaks_per_day",
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
            />
          </MainSettingsFormField>
        </div>
        <div className="col-md-6">
          <MainSettingsFormField
            id="breaks-min-gap"
            label="Minimum gap (minutes) *"
            hint="Minimum time required between consecutive breaks."
          >
            <Form.Control
              type="number"
              min={0}
              step={1}
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              value={form.min_gap_minutes}
              disabled={disabled}
              onChange={(event) =>
                updateForm(
                  "min_gap_minutes",
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
            />
          </MainSettingsFormField>
        </div>
      </div>

      <PolicyEffectiveDateFields
        idPrefix="breaks"
        effectiveFrom={form.effective_from}
        effectiveTo={form.effective_to}
        disabled={disabled}
        fromHint="Date from which this break policy applies."
        onEffectiveFromChange={(value) => updateForm("effective_from", value)}
        onEffectiveToChange={(value) => updateForm("effective_to", value)}
      />
    </>
  );
}
