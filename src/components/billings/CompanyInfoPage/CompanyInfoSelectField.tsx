import React from "react";
import { companyInfoStyles as s } from "./companyInfoStyles";

type Props = Readonly<{
  label: string;
  required?: boolean;
  requiredNote?: boolean;
  placeholder?: string;
  defaultValue?: string;
}>;

export function CompanyInfoSelectField({
  label,
  required,
  requiredNote,
  placeholder,
  defaultValue,
}: Props) {
  return (
    <div>
      <span style={s.selectLabel}>
        {label}
        {required && " *"}
      </span>
      {requiredNote && (
        <span style={s.selectRequired}>This role is required and a user must always be assigned.</span>
      )}
      <div style={{ position: "relative" as const }}>
        <select style={s.selectBox} defaultValue={defaultValue || ""}>
          {defaultValue ? (
            <option value={defaultValue}>{defaultValue}</option>
          ) : (
            <option value="" disabled>
              {placeholder || "Select a contact"}
            </option>
          )}
          {!defaultValue && <option value="">Select a contact</option>}
        </select>
      </div>
    </div>
  );
}
