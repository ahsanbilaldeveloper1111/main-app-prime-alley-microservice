import React from "react";
import { X } from "lucide-react";
import { Form } from "react-bootstrap";

/** Matches `ProspectEditSidebar` field labels. */
export const categorySidebarLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#141414",
  marginBottom: "8px",
};

/** Matches `ProspectEditSidebar` text inputs (padding, border, radius, font). */
export const categorySidebarControlStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "14px",
  outline: "none",
  minHeight: 40,
};

export function CategorySidebarField({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      {children}
    </div>
  );
}

type CategorySidebarLabelProps = Readonly<{
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}>;

export function CategorySidebarLabel({
  htmlFor,
  required,
  children,
}: CategorySidebarLabelProps): React.ReactElement {
  return (
    <label
      htmlFor={htmlFor}
      className={
        required ? "contact-form-label contact-form-label-required" : "contact-form-label"
      }
      style={categorySidebarLabelStyle}
    >
      {children}
      {required ? <span style={{ color: "#f2545b" }}> *</span> : null}
    </label>
  );
}

type CategorySidebarTextInputProps = Readonly<
  React.ComponentProps<typeof Form.Control> & { id: string }
>;

export function CategorySidebarTextInput({
  id,
  onFocus,
  onBlur,
  style,
  ...rest
}: CategorySidebarTextInputProps): React.ReactElement {
  return (
    <Form.Control
      {...rest}
      id={id}
      style={{ ...categorySidebarControlStyle, ...style }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#0091ae";
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#8a8a8a";
        onBlur?.(e);
      }}
    />
  );
}

type CategorySidebarSelectProps = Readonly<
  React.ComponentProps<typeof Form.Select> & { id: string }
>;

export function CategorySidebarSelect({
  id,
  onFocus,
  onBlur,
  style,
  ...rest
}: CategorySidebarSelectProps): React.ReactElement {
  return (
    <Form.Select
      {...rest}
      id={id}
      style={{ ...categorySidebarControlStyle, ...style }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#0091ae";
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#8a8a8a";
        onBlur?.(e);
      }}
    />
  );
}

type CategorySidebarTextAreaProps = Readonly<
  React.ComponentProps<typeof Form.Control> & { id: string }
>;

export function CategorySidebarTextArea({
  id,
  as,
  onFocus,
  onBlur,
  style,
  ...rest
}: CategorySidebarTextAreaProps): React.ReactElement {
  return (
    <Form.Control
      {...rest}
      id={id}
      as={as ?? "textarea"}
      style={{ ...categorySidebarControlStyle, ...style }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#0091ae";
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#8a8a8a";
        onBlur?.(e);
      }}
    />
  );
}

export interface CategoryEditSidebarProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  savingCategory: boolean;
  submitDisabled: boolean;
  submitLabel: string;
  children: React.ReactNode;
}

/**
 * Create / edit request category panel — layout and typography match `ProspectEditSidebar`.
 */
const CategoryEditSidebar: React.FC<CategoryEditSidebarProps> = ({
  isOpen,
  title,
  onClose,
  onSubmit,
  savingCategory,
  submitDisabled,
  submitLabel,
  children,
}) => {
  if (!isOpen) {
    return null;
  }

  const canPrimaryHover = !submitDisabled;

  return (
    <>
      <div
        className="contact-sidebar-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
        aria-hidden="true"
      />

      <div
        className="contact-sidebar-container"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="contact-sidebar-header"
          style={{
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
            {title}
          </h2>
          <button
            type="button"
            className="contact-sidebar-close-btn"
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

        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            className="contact-sidebar-content"
            style={{
              flex: 1,
              overflowY: "auto",
            }}
          >
            <div className="contact-form-section">{children}</div>
          </div>

          <div
            className="contact-sidebar-footer"
            style={{
              borderTop: "1px solid #eaf0f6",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-start",
            }}
          >
            <button
              type="submit"
              className="contact-form-btn-create"
              disabled={submitDisabled}
              style={{
                padding: "10px 20px",
                backgroundColor: canPrimaryHover ? "#0091ae" : "#cbd5e0",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: canPrimaryHover ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (canPrimaryHover) {
                  e.currentTarget.style.backgroundColor = "#007a94";
                }
              }}
              onMouseLeave={(e) => {
                if (canPrimaryHover) {
                  e.currentTarget.style.backgroundColor = "#0091ae";
                }
              }}
            >
              {submitLabel}
            </button>
            <button
              type="button"
              className="contact-form-btn-cancel"
              disabled={savingCategory}
              onClick={onClose}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "#141414",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
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

export default CategoryEditSidebar;
