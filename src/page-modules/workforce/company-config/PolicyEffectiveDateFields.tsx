import {
  MainSettingsDatePicker,
  MainSettingsFormField,
  parseIsoDateLocal,
} from "@components/main-settings/MainSettingsFormPrimitives";
import React from "react";

export type PolicyEffectiveDateFieldsProps = Readonly<{
  idPrefix: string;
  effectiveFrom: string | null | undefined;
  effectiveTo: string | null | undefined;
  disabled: boolean;
  fromHint: string;
  toHint?: string;
  onEffectiveFromChange: (value: string) => void;
  onEffectiveToChange: (value: string) => void;
}>;

export function PolicyEffectiveDateFields({
  idPrefix,
  effectiveFrom,
  effectiveTo,
  disabled,
  fromHint,
  toHint = "Optional. Leave empty for an open-ended policy.",
  onEffectiveFromChange,
  onEffectiveToChange,
}: PolicyEffectiveDateFieldsProps) {
  const fromValue = effectiveFrom ?? "";
  const toValue = effectiveTo ?? "";

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <MainSettingsFormField
          id={`${idPrefix}-effective-from`}
          label="Effective from *"
          hint={fromHint}
        >
          <MainSettingsDatePicker
            id={`${idPrefix}-effective-from`}
            value={fromValue}
            disabled={disabled}
            onChange={onEffectiveFromChange}
          />
        </MainSettingsFormField>
      </div>
      <div className="col-md-6">
        <MainSettingsFormField
          id={`${idPrefix}-effective-to`}
          label="Effective to"
          hint={toHint}
        >
          <MainSettingsDatePicker
            id={`${idPrefix}-effective-to`}
            value={toValue}
            minDate={parseIsoDateLocal(fromValue) ?? undefined}
            disabled={disabled}
            placeholder="Open-ended"
            isClearable
            onChange={onEffectiveToChange}
          />
        </MainSettingsFormField>
      </div>
    </div>
  );
}
