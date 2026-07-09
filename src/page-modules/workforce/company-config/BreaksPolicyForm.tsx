import { PolicyEffectiveDateFields } from "@page-modules/workforce/company-config/PolicyEffectiveDateFields";
import { BREAK_POLICY_TARGET_OPTIONS } from "@page-modules/workforce/company-config/breaksDomain";
import type { BreaksPolicyFormState } from "@page-modules/workforce/company-config/breaksDomain";
import {
  MAIN_SETTINGS_FORM_CONTROL_CLASS,
  MAIN_SETTINGS_FORM_SELECT_CLASS,
  MainSettingsFormField,
} from "@components/main-settings/MainSettingsFormPrimitives";
import type { MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
import React from "react";
import { Form } from "react-bootstrap";

export type BreaksPolicyFormProps = Readonly<{
  form: BreaksPolicyFormState;
  disabled: boolean;
  departmentOptions: readonly MainAppDepartmentLookup[];
  onChange: (form: BreaksPolicyFormState) => void;
}>;

export function BreaksPolicyForm({
  form,
  disabled,
  departmentOptions,
  onChange,
}: BreaksPolicyFormProps) {
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
          <MainSettingsFormField id="breaks-target-type" label="Target type *">
            <Form.Select
              className={MAIN_SETTINGS_FORM_SELECT_CLASS}
              value={form.target_type}
              disabled={disabled}
              onChange={(event) => {
                const targetType = event.target.value as BreaksPolicyFormState["target_type"];
                onChange({
                  ...form,
                  target_type: targetType,
                  target_id: targetType === "company" ? "" : form.target_id,
                });
              }}
            >
              {BREAK_POLICY_TARGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </MainSettingsFormField>
        </div>
        {form.target_type === "department" ? (
          <div className="col-md-6">
            <MainSettingsFormField id="breaks-target-department" label="Department *">
              <Form.Select
                className={MAIN_SETTINGS_FORM_SELECT_CLASS}
                value={form.target_id}
                disabled={disabled}
                onChange={(event) => updateForm("target_id", event.target.value)}
              >
                <option value="">Select department</option>
                {departmentOptions.map((department) => (
                  <option key={department.id} value={String(department.id)}>
                    {department.name?.trim() || `Department #${department.id}`}
                  </option>
                ))}
              </Form.Select>
            </MainSettingsFormField>
          </div>
        ) : null}
        {form.target_type === "employee" ? (
          <div className="col-md-6">
            <MainSettingsFormField
              id="breaks-target-employee"
              label="Employee ID *"
              hint="Extension number or employee identifier."
            >
              <Form.Control
                type="text"
                className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
                value={form.target_id}
                disabled={disabled}
                onChange={(event) => updateForm("target_id", event.target.value)}
              />
            </MainSettingsFormField>
          </div>
        ) : null}
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <MainSettingsFormField
            id="breaks-max-per-day"
            label="Maximum breaks per day *"
            hint="Used in single generic break mode."
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
            label="Minimum gap between breaks (minutes)"
            hint="Blocks starting a new break until this gap has passed (422 from API)."
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

      <MainSettingsFormField
        id="breaks-total-max"
        label="Total max break time per day (minutes) *"
        hint="Daily cap across all breaks. Exceeding flags a violation but does not block breaks."
      >
        <Form.Control
          type="number"
          min={1}
          className={MAIN_SETTINGS_FORM_CONTROL_CLASS}
          value={form.total_max_break_minutes}
          disabled={disabled}
          onChange={(event) =>
            updateForm(
              "total_max_break_minutes",
              event.target.value === "" ? 0 : Number(event.target.value),
            )
          }
        />
      </MainSettingsFormField>

      <MainSettingsFormField
        id="breaks-count-toward-ot"
        label="Break time counts toward overtime"
        hint="When off (default), break time is excluded from OT calculations."
      >
        <Form.Check
          type="switch"
          id="breaks-break-time-counts-toward-overtime"
          label="Break time counts toward overtime"
          checked={form.break_time_counts_toward_overtime}
          disabled={disabled}
          onChange={(event) =>
            updateForm("break_time_counts_toward_overtime", event.target.checked)
          }
        />
      </MainSettingsFormField>

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
