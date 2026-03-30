import React from "react";

export const fieldLabel = (text: string, required: boolean = false) => (
  <label
    style={{
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#141414",
      marginBottom: "8px",
    }}
  >
    {text}
    {required && <span style={{ color: "#f2545b", marginLeft: "2px" }}>*</span>}
  </label>
);

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "16px",
  fontWeight: "300",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export const fieldWrap: React.CSSProperties = { marginBottom: "20px" };

export const sectionHeading: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#141414",
  marginBottom: "16px",
  marginTop: 0,
};

export const sectionHeadingNext: React.CSSProperties = {
  ...sectionHeading,
  marginTop: "32px",
};

/** Local calendar date as YYYY-MM-DD for `<input type="date" min="…" />`. */
export function getTodayLocalYyyyMmDd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const dropdownToggleStyle = (hasValue: boolean): React.CSSProperties => ({
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "16px",
  fontWeight: "300",
  backgroundColor: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: hasValue ? "#141414" : "#a0aec0",
});
