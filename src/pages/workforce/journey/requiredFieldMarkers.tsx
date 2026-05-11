import React from "react";

const REQUIRED_MARK_COLOR = "#dc2626";

/** Visible required marker independent of theme `text-danger` variables. */
export function RequiredFieldAsterisk(): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      title="Required"
      style={{
        color: REQUIRED_MARK_COLOR,
        fontWeight: 700,
        marginLeft: "2px",
      }}
    >
      *
    </span>
  );
}

export function RequiredFieldsFormHint(): React.ReactElement {
  return (
    <p className="mb-0 mt-1" style={{ fontSize: "12px", color: "#6b7280" }}>
      <span style={{ color: REQUIRED_MARK_COLOR, fontWeight: 700 }}>*</span> Required fields
    </p>
  );
}
