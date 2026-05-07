import React, { ChangeEvent } from "react";
import { Form } from "react-bootstrap";

import "./cdrRecordsPage.scss";

export interface CdrDatetimeFilterFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  resolveDefault: () => string;
}

export function CdrDatetimeFilterField(
  props: Readonly<CdrDatetimeFilterFieldProps>,
): React.ReactElement {
  const { value, onValueChange, resolveDefault } = props;
  return (
    <div
      className="cdrRecords-filterField"
      style={{ "--cdr-filter-min-width": "220px" } as React.CSSProperties}
    >
      <Form.Control
        type="datetime-local"
        required
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const v = e.target.value;
          onValueChange(v.trim() ? v : resolveDefault());
        }}
        size="sm"
      />
    </div>
  );
}
