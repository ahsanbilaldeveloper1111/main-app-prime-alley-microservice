import React from "react";
import { Eye, Info, Tag } from "lucide-react";
import { STATUS_COLOR_SUGGESTIONS } from "../ticketStatusesTypes";

type StatusColorFieldProps = Readonly<{
  color: string;
  name: string;
  onColorChange: (color: string) => void;
  colorPickerId: string;
  colorTextId: string;
}>;

export const StatusColorField: React.FC<StatusColorFieldProps> = ({
  color,
  name,
  onColorChange,
  colorPickerId,
  colorTextId,
}) => (
  <div className="contact-form-field" style={{ marginBottom: "20px" }}>
    <label
      htmlFor={colorPickerId}
      style={{
        display: "block",
        fontSize: "14px",
        fontWeight: 600,
        color: "#141414",
        marginBottom: "8px",
      }}
      className="d-flex align-items-center gap-2"
    >
      Status Color <span style={{ color: "#f2545b" }}>*</span>
      <span
        className="text-muted"
        title="Select a color that visually represents this status"
        style={{ cursor: "help" }}
      >
        <Info size={14} />
      </span>
    </label>

    <div className="d-flex align-items-center gap-2">
      <input
        type="color"
        id={colorPickerId}
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        style={{
          width: "50px",
          height: "38px",
          padding: "2px",
          border: "1px solid #8a8a8a",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      />
      <input
        type="text"
        id={colorTextId}
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        placeholder="e.g., #FF5733"
        style={{
          flex: 1,
          padding: "10px 12px",
          border: "1px solid #8a8a8a",
          borderRadius: "4px",
          fontSize: "14px",
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#0091ae";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#8a8a8a";
        }}
      />
    </div>

    <p
      style={{
        fontSize: "0.813rem",
        color: "#6c757d",
        marginTop: "6px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <Info size={12} />
      Choose colors that align with status meaning (e.g., green for completed, yellow for pending, red for
      critical).
    </p>

    <div style={{ marginTop: "12px" }}>
      <small style={{ color: "#6c757d", fontWeight: 600, display: "block", marginBottom: "8px" }}>
        Suggested Colors:
      </small>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {STATUS_COLOR_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.color}
            type="button"
            onClick={() => onColorChange(suggestion.color)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              backgroundColor: "transparent",
              border: "1px solid #8a8a8a",
              borderRadius: "4px",
              fontSize: "13px",
              color: "#141414",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                backgroundColor: suggestion.color,
                borderRadius: "3px",
                border: "1px solid #dee2e6",
                flexShrink: 0,
              }}
            />
            <small>{suggestion.label}</small>
          </button>
        ))}
      </div>
    </div>

    <div style={{ marginTop: "16px" }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#141414",
          marginBottom: "10px",
        }}
      >
        <Eye size={16} />
        Status Preview
      </label>
      <div style={{ backgroundColor: "#f8f9fa", borderRadius: "6px", padding: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <small style={{ color: "#6c757d", display: "block", marginBottom: "6px" }}>As Badge:</small>
            <div
              style={{
                backgroundColor: color,
                padding: "4px 12px",
                fontSize: "14px",
                borderRadius: "3px",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Tag size={13} />
              {name || "Status Name"}
            </div>
          </div>
          <div>
            <small style={{ color: "#6c757d", display: "block", marginBottom: "6px" }}>
              As Status Indicator:
            </small>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 10px",
                backgroundColor: "#ffffff",
                borderRadius: "4px",
                border: "1px solid #dee2e6",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#141414" }}>
                {name || "Status Name"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <p
        style={{
          fontSize: "0.813rem",
          color: "#6c757d",
          marginTop: "6px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Info size={12} />
        This is how your status will appear in tickets, dashboards, and reports
      </p>
    </div>
  </div>
);
