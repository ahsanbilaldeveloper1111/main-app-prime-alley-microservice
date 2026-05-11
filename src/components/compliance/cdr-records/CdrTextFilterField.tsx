import React, { ChangeEvent } from "react";
import { Form } from "react-bootstrap";

import "./cdrRecordsPage.scss";

export interface CdrTextFilterFieldProps {
  minWidth: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function CdrTextFilterField(
  props: Readonly<CdrTextFilterFieldProps>,
): React.ReactElement {
  const { minWidth, placeholder, value, onValueChange } = props;
  return (
    <div
      className="cdrRecords-filterField"
      style={{ "--cdr-filter-min-width": minWidth } as React.CSSProperties}
    >
      <Form.Control
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onValueChange(e.target.value)
        }
        size="sm"
      />
    </div>
  );
}
