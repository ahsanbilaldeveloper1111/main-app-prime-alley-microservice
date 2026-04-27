import React from "react";
import { X } from "lucide-react";
import { Form, Spinner } from "react-bootstrap";
import type { ToolPayload } from "@utils/tools";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToolFormState extends Partial<ToolPayload> {
  display_name: string;
  tool_name: string;
  description: string;
  method: string;
  endpoint_url: string;
  enabled: boolean;
}

export interface ToolEditSidebarProps {
  isOpen: boolean;
  isEditing: boolean;
  formState: ToolFormState;
  setFormState: (
    next: ToolFormState | ((prev: ToolFormState) => ToolFormState),
  ) => void;
  submitLoading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;

const FIELD_INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "14px",
  outline: "none",
  fontFamily: "inherit",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#141414",
  marginBottom: "8px",
};

const FIELD_WRAPPER_STYLE: React.CSSProperties = { marginBottom: "20px" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPrimaryButtonStyle(canInteract: boolean): React.CSSProperties {
  return {
    padding: "10px 20px",
    backgroundColor: canInteract ? "#0091ae" : "#cbd5e0",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: canInteract ? "pointer" : "not-allowed",
  };
}

function getSecondaryButtonStyle(): React.CSSProperties {
  return {
    padding: "10px 20px",
    backgroundColor: "transparent",
    color: "#141414",
    border: "1px solid #8a8a8a",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  };
}

function getPrimaryLabel(isEditing: boolean, loading: boolean): string {
  if (loading) return isEditing ? "Updating..." : "Creating...";
  return isEditing ? "Update" : "Create";
}

function isToolFormValid(form: ToolFormState, isEditing: boolean): boolean {
  const hasDisplayName = Boolean(form.display_name?.trim());
  const hasEndpointUrl = Boolean(form.endpoint_url?.trim());
  const hasToolName = isEditing || Boolean(form.tool_name?.trim());
  return hasDisplayName && hasEndpointUrl && hasToolName;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ToolFieldsProps {
  formState: ToolFormState;
  setFormState: ToolEditSidebarProps["setFormState"];
  isEditing: boolean;
}

const ToolFields: React.FC<ToolFieldsProps> = ({
  formState,
  setFormState,
  isEditing,
}) => {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#0091ae";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#8a8a8a";
  };

  const setField = <K extends keyof ToolFormState>(key: K, value: ToolFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="contact-form-section">
      {!isEditing && (
        <div className="contact-form-field" style={FIELD_WRAPPER_STYLE}>
          <label
            htmlFor="tool-name-input"
            className="contact-form-label contact-form-label-required"
            style={LABEL_STYLE}
          >
            Tool Name <span style={{ color: "#f2545b" }}>*</span>
          </label>
          <input
            id="tool-name-input"
            type="text"
            value={formState.tool_name}
            onChange={(e) => setField("tool_name", e.target.value)}
            placeholder="e.g. get_faqs"
            style={FIELD_INPUT_STYLE}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      )}

      <div className="contact-form-field" style={FIELD_WRAPPER_STYLE}>
        <label
          htmlFor="tool-display-name-input"
          className="contact-form-label contact-form-label-required"
          style={LABEL_STYLE}
        >
          Display Name <span style={{ color: "#f2545b" }}>*</span>
        </label>
        <input
          id="tool-display-name-input"
          type="text"
          value={formState.display_name}
          onChange={(e) => setField("display_name", e.target.value)}
          placeholder="e.g. Get FAQs"
          style={FIELD_INPUT_STYLE}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div className="contact-form-field" style={FIELD_WRAPPER_STYLE}>
        <label
          htmlFor="tool-description-input"
          className="contact-form-label"
          style={LABEL_STYLE}
        >
          Description
        </label>
        <textarea
          id="tool-description-input"
          rows={2}
          value={formState.description}
          onChange={(e) => setField("description", e.target.value)}
          style={{ ...FIELD_INPUT_STYLE, resize: "vertical" }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div className="contact-form-field" style={FIELD_WRAPPER_STYLE}>
        <label
          htmlFor="tool-method-select"
          className="contact-form-label contact-form-label-required"
          style={LABEL_STYLE}
        >
          Method <span style={{ color: "#f2545b" }}>*</span>
        </label>
        <select
          id="tool-method-select"
          value={formState.method}
          onChange={(e) => setField("method", e.target.value)}
          style={FIELD_INPUT_STYLE}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="contact-form-field" style={FIELD_WRAPPER_STYLE}>
        <label
          htmlFor="tool-endpoint-url-input"
          className="contact-form-label contact-form-label-required"
          style={LABEL_STYLE}
        >
          Endpoint URL <span style={{ color: "#f2545b" }}>*</span>
        </label>
        <input
          id="tool-endpoint-url-input"
          type="text"
          value={formState.endpoint_url}
          onChange={(e) => setField("endpoint_url", e.target.value)}
          placeholder="https://..."
          style={FIELD_INPUT_STYLE}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div className="contact-form-field" style={FIELD_WRAPPER_STYLE}>
        <Form.Check
          type="switch"
          id="tool-enabled-switch"
          label="Enabled"
          checked={!!formState.enabled}
          onChange={(e) => setField("enabled", e.target.checked)}
        />
      </div>
    </div>
  );
};

interface ToolSidebarFooterProps {
  isEditing: boolean;
  submitLoading: boolean;
  isFormValid: boolean;
  onClose: () => void;
}

const ToolSidebarFooter: React.FC<ToolSidebarFooterProps> = ({
  isEditing,
  submitLoading,
  isFormValid,
  onClose,
}) => {
  const canInteract = isFormValid && !submitLoading;
  const primaryLabel = getPrimaryLabel(isEditing, submitLoading);

  const handlePrimaryHoverEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (canInteract) e.currentTarget.style.backgroundColor = "#007a94";
  };

  const handlePrimaryHoverLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (canInteract) e.currentTarget.style.backgroundColor = "#0091ae";
  };

  const handleSecondaryHoverEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "#f7fafc";
  };

  const handleSecondaryHoverLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "transparent";
  };

  return (
    <div
      className="contact-sidebar-footer"
      style={{
        padding: "16px 24px",
        borderTop: "1px solid #eaf0f6",
        display: "flex",
        gap: "12px",
        justifyContent: "flex-start",
      }}
    >
      <button
        type="submit"
        disabled={!canInteract}
        style={getPrimaryButtonStyle(canInteract)}
        onMouseEnter={handlePrimaryHoverEnter}
        onMouseLeave={handlePrimaryHoverLeave}
      >
        {submitLoading && <Spinner size="sm" className="me-2" />}
        {primaryLabel}
      </button>

      <button
        type="button"
        disabled={submitLoading}
        onClick={onClose}
        style={getSecondaryButtonStyle()}
        onMouseEnter={handleSecondaryHoverEnter}
        onMouseLeave={handleSecondaryHoverLeave}
      >
        Cancel
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ToolEditSidebar: React.FC<ToolEditSidebarProps> = ({
  isOpen,
  isEditing,
  formState,
  setFormState,
  submitLoading,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const isFormValid = isToolFormValid(formState, isEditing);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isDisabled = !isFormValid || submitLoading;
    if (isDisabled) return;
    onSubmit();
  };

  const sidebarTitle = isEditing ? "Edit Tool" : "Add Tool";

  return (
    <>
      <div
        className="contact-sidebar-overlay"
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
        className="contact-sidebar-container"
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
        {/* Header */}
        <div
          className="contact-sidebar-header"
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            className="contact-sidebar-title"
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            {sidebarTitle}
          </h2>
          <button
            className="contact-sidebar-close-btn"
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <div
            className="contact-sidebar-content"
            style={{ flex: 1, overflowY: "auto", padding: "40px" }}
          >
            <ToolFields
              formState={formState}
              setFormState={setFormState}
              isEditing={isEditing}
            />
          </div>

          <ToolSidebarFooter
            isEditing={isEditing}
            submitLoading={submitLoading}
            isFormValid={isFormValid}
            onClose={onClose}
          />
        </form>
      </div>
    </>
  );
};

export { isToolFormValid };
export default ToolEditSidebar;
