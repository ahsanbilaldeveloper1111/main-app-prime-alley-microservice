import React, { ChangeEvent } from "react";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckManualTabProps {
  value: string;
  onChange: (value: string) => void;
  isManualInputValid: boolean;
  isChecking: boolean;
  onCheck: () => void;
  onClear: () => void;
}

export function ApiNumberCheckManualTab({
  value,
  onChange,
  isManualInputValid,
  isChecking,
  onCheck,
  onClear,
}: Readonly<ApiNumberCheckManualTabProps>): React.ReactElement {
  return (
    <div className="apiNumberCheck-manualTab">
      <input
        type="text"
        className="apiNumberCheck-textarea apiNumberCheck-singleInput"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Enter one phone number (e.g., 0512345678)"
      />
      <div className="apiNumberCheck-manualFooter">
        <span className="apiNumberCheck-hint">
          Numbers must start with &quot;05&quot; and be exactly 10 digits
        </span>
        <div className="apiNumberCheck-manualButtons">
          <button
            type="button"
            className="apiNumberCheck-btnPrimary"
            onClick={onCheck}
            disabled={!isManualInputValid || isChecking}
          >
            {isChecking ? "Checking..." : "Check Number"}
          </button>
          <button
            type="button"
            className="apiNumberCheck-btnSecondary"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
