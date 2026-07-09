import { PolicyEffectiveDateFields } from "@page-modules/workforce/company-config/PolicyEffectiveDateFields";
import {
  GRACE_PERIOD_CHECK_IN_MAX_MINUTES,
  GRACE_PERIOD_CHECKOUT_MAX_MINUTES,
  applyGracePeriodPolicyToggle,
  type GracePeriodPolicyFormState,
} from "@page-modules/workforce/company-config/gracePeriodDomain";
import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import React from "react";
import { Form } from "react-bootstrap";

export type GracePeriodPolicyFormProps = Readonly<{
  form: GracePeriodPolicyFormState;
  disabled: boolean;
  onChange: (form: GracePeriodPolicyFormState) => void;
}>;

const CHECKOUT_GRACE_HELP_TEXT =
  "If an employee checks out within this many minutes before shift end, they are not marked as early exit. Example: shift ends 6:00 PM, grace = 5 → 5:55 PM is fine, 5:54 PM is early exit.";

export function GracePeriodPolicyForm({ form, disabled, onChange }: GracePeriodPolicyFormProps) {
  const updateForm = <K extends keyof GracePeriodPolicyFormState>(
    key: K,
    value: GracePeriodPolicyFormState[K],
  ) => {
    onChange(applyGracePeriodPolicyToggle(form, key, value));
  };

  return (
    <>
      <div className="row g-3">
        <div className="col-md-6">
          <MainSettingsFormField
            id="grace-period-minutes"
            label="Check-in grace (minutes) *"
            hint={`Max ${GRACE_PERIOD_CHECK_IN_MAX_MINUTES}. Minutes after shift start before the employee is marked late.`}
          >
            <Form.Control
              type="number"
              min={0}
              max={GRACE_PERIOD_CHECK_IN_MAX_MINUTES}
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
            label="Check-out grace (minutes) *"
            hint={CHECKOUT_GRACE_HELP_TEXT}
          >
            <Form.Control
              type="number"
              min={0}
              max={GRACE_PERIOD_CHECKOUT_MAX_MINUTES}
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

      {/* Late adjustment policy toggles (disabled — §2.5.3 / §2.5.4)
      <MainSettingsFormField
        id="grace-period-compensate-late"
        label="Compensate late by staying"
        hint="When enabled and approval is not required, staying late enough clears late_minutes on checkout (§2.5.3)."
      >
        <Form.Check
          type="switch"
          id="grace-period-compensate-late-by-stay"
          label="Compensate late by staying"
          checked={form.compensate_late_by_stay}
          disabled={disabled || form.late_adjustment_approval_required}
          onChange={(event) => updateForm("compensate_late_by_stay", event.target.checked)}
        />
      </MainSettingsFormField>

      <MainSettingsFormField
        id="grace-period-late-adjustment-approval"
        label="Late adjustment requires approval"
        hint="When enabled, employees must submit a late adjustment request. Auto-adjust on checkout is disabled (§2.5.4)."
      >
        <Form.Check
          type="switch"
          id="grace-period-late-adjustment-approval-required"
          label="Late adjustment requires approval"
          checked={form.late_adjustment_approval_required}
          disabled={disabled || form.compensate_late_by_stay}
          onChange={(event) =>
            updateForm("late_adjustment_approval_required", event.target.checked)
          }
        />
      </MainSettingsFormField>
      */}

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
