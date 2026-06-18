import { PolicyEffectiveDateFields } from "@page-modules/workforce/company-config/PolicyEffectiveDateFields";
import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import type { GracePeriodPolicyFormState } from "@page-modules/workforce/company-config/gracePeriodDomain";
import React from "react";
import { Form } from "react-bootstrap";

export type GracePeriodPolicyFormProps = Readonly<{
  form: GracePeriodPolicyFormState;
  disabled: boolean;
  onChange: (form: GracePeriodPolicyFormState) => void;
}>;

export function GracePeriodPolicyForm({ form, disabled, onChange }: GracePeriodPolicyFormProps) {
  const updateForm = <K extends keyof GracePeriodPolicyFormState>(
    key: K,
    value: GracePeriodPolicyFormState[K],
  ) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <>
      <div className="row g-3">
        <div className="col-md-6">
          <MainSettingsFormField
            id="grace-period-minutes"
            label="Grace minutes *"
            hint="Minutes after scheduled start time before attendance is marked late."
          >
            <Form.Control
              type="number"
              min={0}
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              value={form.grace_minutes}
              disabled={disabled}
              onChange={(event) =>
                updateForm(
                  "grace_minutes",
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
            />
          </MainSettingsFormField>
        </div>
        <div className="col-md-6">
          <MainSettingsFormField
            id="grace-period-late-threshold"
            label="Late threshold (minutes) *"
            hint="Minutes after scheduled start when an employee is considered late."
          >
            <Form.Control
              type="number"
              min={0}
              className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
              value={form.late_threshold_minutes}
              disabled={disabled}
              onChange={(event) =>
                updateForm(
                  "late_threshold_minutes",
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
            />
          </MainSettingsFormField>
        </div>
      </div>

      <PolicyEffectiveDateFields
        idPrefix="grace-period"
        effectiveFrom={form.effective_from}
        effectiveTo={form.effective_to}
        disabled={disabled}
        fromHint="Date from which this grace period policy applies."
        onEffectiveFromChange={(value) => updateForm("effective_from", value)}
        onEffectiveToChange={(value) => updateForm("effective_to", value)}
      />
    </>
  );
}
