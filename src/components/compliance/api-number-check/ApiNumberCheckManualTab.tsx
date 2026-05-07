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
      <textarea
        className="apiNumberCheck-textarea"
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(e.target.value)
        }
        placeholder='Enter phone numbers separated by comma or newline (e.g., +15551234567, +447700900123)'
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
            {isChecking ? "Checking..." : "Check Numbers"}
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
