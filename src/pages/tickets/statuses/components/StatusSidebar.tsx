import React from "react";
import { X, Tag, Info } from "lucide-react";
import type { StatusSidebarConfig } from "../ticketStatusesTypes";
import { StatusColorField } from "./StatusColorField";

type StatusSidebarProps = Readonly<{
  isOpen: boolean;
  config: StatusSidebarConfig;
  name: string;
  color: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorChange: (color: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}>;

export const StatusSidebar: React.FC<StatusSidebarProps> = ({
  isOpen,
  config,
  name,
  color,
  onNameChange,
  onColorChange,
  onSubmit,
  onClose,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const isFormValid = name.trim() !== "" && color.trim() !== "";
  const canSubmit = isFormValid && !isSubmitting;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit();
  };

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "600px",
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Tag size={20} style={{ color: "#0091ae" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#141414", margin: 0 }}>{config.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#718096",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor={config.nameInputId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#141414",
                  marginBottom: "8px",
                }}
              >
                Status Name <span style={{ color: "#f2545b" }}>*</span>
                <span title="Enter a clear name that represents the ticket state" style={{ cursor: "help", color: "#6c757d" }}>
                  <Info size={14} />
                </span>
              </label>
              <input
                id={config.nameInputId}
                type="text"
                value={name}
                onChange={onNameChange}
                placeholder={config.namePlaceholder}
                style={{
                  width: "100%",
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
                Use descriptive names that clearly indicate the current state of a ticket in your workflow.
              </p>
            </div>

            <StatusColorField
              color={color}
              name={name}
              onColorChange={onColorChange}
              colorPickerId={config.colorPickerId}
              colorTextId={config.colorTextId}
            />
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #eaf0f6",
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: "10px 20px",
                backgroundColor: canSubmit ? "#0091ae" : "#cbd5e0",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (canSubmit) e.currentTarget.style.backgroundColor = "#007a94";
              }}
              onMouseLeave={(e) => {
                if (canSubmit) e.currentTarget.style.backgroundColor = "#0091ae";
              }}
            >
              {isSubmitting ? config.submittingLabel : config.submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "#141414",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
