import React from "react";
import { X, Plus, ChevronDown, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { Dropdown, Form } from "react-bootstrap";
import { APP_FONT } from "../../styles/fonts";
import { CreateTicketSidebarFooter } from "@components/renderCreateTicketForm/CreateTicketSidebarFooter";
import type { TicketFormData } from "@components/renderCreateTicketForm/createTicketFormTypes";
import { useCreateTicketSidebarForm } from "@components/renderCreateTicketForm/useCreateTicketSidebarForm";

const FF = APP_FONT;

interface SimpleDropdownProps {
  value: string;
  id?: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
}

interface CreateTicketSidebarProps {
  onClose: () => void;
  onSuccess?: () => void;
  editTicketId?: number | null;
  /** List-row or preview payload used while view-ticket loads (and as fallback). */
  initialTicket?: unknown;
}

// ─── Dropdown options ─────────────────────────────────────────────────────────
const SOURCE_OPTIONS = ["Email", "Phone", "Chat", "Web form", "Social media"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const ASSOCIATION_LABEL_OPTIONS = ["No label", "Decision Maker", "Primary", "Billing"];

// ─── Styles ───────────────────────────────────────────────────────────────────
const fieldLabel = (text: string, required: boolean = false) => (
  <label
    style={{
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#141414",
      marginBottom: "8px",
      fontFamily: FF,
    }}
  >
    {text}
    {required && <span style={{ color: "#f2545b", marginLeft: "2px" }}>*</span>}
  </label>
);

const inputStyle: React.CSSProperties = {
  color: "rgb(20, 20, 20)",
  display: "inline-block",
  height: "auto",
  width: "100%",
  fontFamily: FF,
  fontSize: "16px",
  fontWeight: 300,
  letterSpacing: "0px",
  lineHeight: "24px",
  textAlign: "left",
  verticalAlign: "middle",
  backgroundColor: "rgb(255, 255, 255)",
  border: "1px solid rgb(138, 138, 138)",
  borderRadius: "4px",
  paddingInline: "16px",
  paddingBlock: "8px",
  transition: "150ms ease-out",
  minHeight: "40px",
  outline: "none",
  boxSizing: "border-box",
};

const fieldWrap: React.CSSProperties = { marginBottom: "20px" };

const dropdownToggleStyle = (hasValue: boolean): React.CSSProperties => ({
  color: hasValue ? "rgb(20, 20, 20)" : "#a0aec0",
  display: "flex",
  height: "auto",
  width: "100%",
  fontFamily: FF,
  fontSize: "16px",
  fontWeight: 300,
  letterSpacing: "0px",
  lineHeight: "24px",
  textAlign: "left",
  verticalAlign: "middle",
  backgroundColor: "rgb(255, 255, 255)",
  border: "1px solid rgb(138, 138, 138)",
  borderRadius: "4px",
  paddingInline: "16px",
  paddingBlock: "8px",
  transition: "150ms ease-out",
  minHeight: "40px",
  justifyContent: "space-between",
  alignItems: "center",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
});

const OVERLAY_BUTTON_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1000,
  background: "transparent",
  border: "none",
  padding: 0,
};

const SIDEBAR_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "min(600px, 100vw)",
  maxWidth: "100vw",
  height: "100vh",
  backgroundColor: "#ffffff",
  boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
  zIndex: 1001,
  display: "flex",
  flexDirection: "column",
  fontFamily: FF,
};

const FORM_LOADING_OVERLAY_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 2,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  backgroundColor: "rgba(255, 255, 255, 0.88)",
  padding: "24px",
};

const SPINNER_STYLE: React.CSSProperties = {
  animation: "create-ticket-sidebar-spin 0.9s linear infinite",
  color: "#0091ae",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
  value,
  id,
  options,
  onChange,
  placeholder,
  testId,
}) => (
  <Dropdown>
    <Dropdown.Toggle
      id={id}
      data-test-id={testId}
      variant="outline-secondary"
      style={dropdownToggleStyle(!!value)}
    >
      {value || placeholder || "Select..."}
    </Dropdown.Toggle>
    <Dropdown.Menu
      style={{
        width: "100%",
        maxHeight: "220px",
        overflowY: "auto",
        textAlign: "left",
      }}
    >
      {options.map((opt) => (
        <Dropdown.Item
          key={opt}
          onClick={() => onChange(opt)}
          style={{ textAlign: "left" }}
        >
          {opt}
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  </Dropdown>
);

// ─── Main renderCreateTicket ──────────────────────────────────────────────────
const renderCreateTicket = (
  showCreateTicketSidebar: boolean,
  setShowCreateTicketSidebar: (show: boolean) => void,
) => {
  if (!showCreateTicketSidebar) return null;
  return <CreateTicketSidebar onClose={() => setShowCreateTicketSidebar(false)} />;
};

export default renderCreateTicket;

// ─── Sidebar component ────────────────────────────────────────────────────────
export const CreateTicketSidebar: React.FC<CreateTicketSidebarProps> = ({
  onClose,
  onSuccess,
  editTicketId = null,
  initialTicket,
}) => {
  const {
    ticketForm,
    loading,
    picklistsLoading,
    isEditMode,
    isFormValid,
    pipelineLabels,
    submoduleLabels,
    statusLabels,
    typeLabels,
    ownerLabels,
    isContactsExpanded,
    setIsContactsExpanded,
    isCompaniesExpanded,
    setIsCompaniesExpanded,
    handleCreateDateChange,
    handleSubmit,
    setField,
    setFieldFromEvent,
    setTicketForm,
    todayDate,
  } = useCreateTicketSidebarForm({
    editTicketId,
    initialTicket,
    onSuccess,
    onClose,
  });

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "#0091ae");
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "rgb(138, 138, 138)");

  return (
    <>
      <style>{`
        @keyframes create-ticket-sidebar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close create ticket sidebar"
        onClick={onClose}
        style={OVERLAY_BUTTON_STYLE}
      />

      {/* Sidebar */}
      <div
        style={SIDEBAR_STYLE}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "20px clamp(16px, 4vw, 24px)",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
              fontFamily: FF,
            }}
          >
            {isEditMode ? "Edit Ticket" : "Create Ticket"}
          </h2>
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

        {/* ── Content ── */}
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {picklistsLoading && (
            <div
              style={FORM_LOADING_OVERLAY_STYLE}
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <Loader2 size={32} style={SPINNER_STYLE} aria-hidden="true" />
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#33475b",
                  fontFamily: FF,
                  textAlign: "center",
                }}
              >
                {isEditMode ? "Loading ticket details..." : "Loading form options..."}
              </p>
            </div>
          )}

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px clamp(16px, 6vw, 40px) 40px",
              opacity: picklistsLoading ? 0.45 : 1,
              pointerEvents: picklistsLoading ? "none" : "auto",
              transition: "opacity 150ms ease-out",
            }}
          >

          {/* Edit this form link */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
            <button
              type="button"
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "#0091ae",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Edit this form <ExternalLink size={13} />
            </button>
          </div>

          {/* Ticket Name */}
          <div style={fieldWrap}>
            {fieldLabel("Ticket name", true)}
            <input
              type="text"
              data-test-id="ticketname-input"
              value={ticketForm.ticketName}
              onChange={setFieldFromEvent("ticketName")}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
              placeholder=""
            />
          </div>

          {/* Pipeline */}
          <div style={fieldWrap}>
            {fieldLabel("Pipeline", true)}
            <SimpleDropdown
              id="create-ticket-pipeline"
              value={ticketForm.pipeline}
              options={pipelineLabels}
              onChange={setField("pipeline")}
              placeholder="Select Pipeline"
              testId="pipeline-input"
            />
          </div>

          {/* Primary issue / submodule */}
          <div style={fieldWrap}>
            {fieldLabel("Primary issue", true)}
            <SimpleDropdown
              id="create-ticket-submodule"
              value={ticketForm.submodule}
              options={submoduleLabels}
              onChange={setField("submodule")}
              placeholder="Select primary issue"
              testId="submodule-input"
            />
          </div>

          {/* Ticket Type */}
          <div style={fieldWrap}>
            {fieldLabel("Ticket type", true)}
            <SimpleDropdown
              id="create-ticket-type"
              value={ticketForm.ticketType}
              options={typeLabels}
              onChange={setField("ticketType")}
              placeholder="Select type"
              testId="tickettype-input"
            />
          </div>

          {/* Ticket Status */}
          <div style={fieldWrap}>
            {fieldLabel("Ticket status", true)}
            <SimpleDropdown
              id="create-ticket-status"
              value={ticketForm.ticketStatus}
              options={statusLabels}
              onChange={setField("ticketStatus")}
              placeholder="Select Status"
              testId="ticketstatus-input"
            />
          </div>

          {/* Ticket Description */}
          <div style={fieldWrap}>
            {fieldLabel("Ticket description")}
            <input
              type="text"
              data-test-id="ticketdescription-input"
              value={ticketForm.ticketDescription}
              onChange={setFieldFromEvent("ticketDescription")}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
              placeholder=""
            />
          </div>

          {/* Source */}
          <div style={fieldWrap}>
            {fieldLabel("Source")}
            <SimpleDropdown
              id="create-ticket-source"
              value={ticketForm.source}
              options={SOURCE_OPTIONS}
              onChange={setField("source")}
              placeholder=""
              testId="source-input"
            />
          </div>

          {/* Ticket Owner */}
          <div style={fieldWrap}>
            {fieldLabel("Ticket owner")}
            <SimpleDropdown
              id="create-ticket-owner"
              value={ticketForm.ticketOwner}
              options={ownerLabels}
              onChange={setField("ticketOwner")}
              placeholder="Select owner"
              testId="ticketowner-input"
            />
          </div>

          {/* Priority */}
          <div style={fieldWrap}>
            {fieldLabel("Priority")}
            <SimpleDropdown
              id="create-ticket-priority"
              value={ticketForm.priority}
              options={PRIORITY_OPTIONS}
              onChange={setField("priority")}
              placeholder=""
              testId="priority-input"
            />
          </div>

          {/* Create Date */}
          <div style={fieldWrap}>
            {fieldLabel("Create date")}
            <input
              type="date"
              data-test-id="createdate-input"
              value={ticketForm.createDate}
              onChange={handleCreateDateChange}
              max={todayDate}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Divider */}
          <hr style={{ borderColor: "#eaf0f6", margin: "8px 0 24px" }} />

          {/* Associate Ticket with */}
          <div style={{ marginTop: "4px" }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#141414",
                marginBottom: "16px",
                marginTop: 0,
                fontFamily: FF,
              }}
            >
              Associate Ticket with
            </h3>

            {/* Contacts section */}
            <div
              style={{
                border: "1px solid #cccccc",
                borderRadius: "6px",
                marginBottom: "16px",
                overflow: "hidden",
                borderLeft: "4px solid #ccc",
              }}
            >
              <button
                type="button"
                aria-expanded={isContactsExpanded}
                onClick={() => setIsContactsExpanded((v) => !v)}
                style={{
                  padding: "12px 16px",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  font: "inherit",
                }}
              >
                {isContactsExpanded ? (
                  <ChevronDown size={16} style={{ color: "#6c757d" }} />
                ) : (
                  <ChevronRight size={16} style={{ color: "#6c757d" }} />
                )}
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#141414",
                    fontFamily: FF,
                  }}
                >
                  Contacts
                </span>
              </button>

              {isContactsExpanded && (
                <div style={{ padding: "16px" }}>
                  <div style={fieldWrap}>
                    <label
                      htmlFor="create-ticket-contact-associate"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#141414",
                        marginBottom: "6px",
                        fontFamily: FF,
                      }}
                    >
                      Associate records
                    </label>
                    <SimpleDropdown
                      id="create-ticket-contact-associate"
                      value={ticketForm.contactAssociateRecord}
                      options={["Contact A", "Contact B", "Contact C"]}
                      onChange={setField("contactAssociateRecord")}
                      placeholder="Search"
                      testId="contact-associate-input"
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label
                      htmlFor="create-ticket-contact-association-label"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#141414",
                        marginBottom: "6px",
                        fontFamily: FF,
                      }}
                    >
                      Association label
                    </label>
                    <SimpleDropdown
                      id="create-ticket-contact-association-label"
                      value={ticketForm.contactAssociationLabel}
                      options={ASSOCIATION_LABEL_OPTIONS}
                      onChange={setField("contactAssociationLabel")}
                      testId="contact-label-input"
                    />
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <Form.Check
                      type="checkbox"
                      label={
                        <span style={{ fontSize: "13px", color: "#6c757d", fontFamily: FF }}>
                          Add timeline activity from this Contact{" "}
                          <span
                            title="Adds contact activity to the ticket timeline"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              backgroundColor: "#e0e7ef",
                              color: "#6c757d",
                              fontSize: "11px",
                              cursor: "help",
                            }}
                          >
                            i
                          </span>
                        </span>
                      }
                      checked={ticketForm.addTimelineContact}
                      onChange={(e) =>
                        setTicketForm((p: TicketFormData) => ({ ...p, addTimelineContact: e.target.checked }))
                      }
                    />
                  </div>

                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#0091ae",
                      fontSize: "13px",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontFamily: FF,
                    }}
                  >
                    <Plus size={14} /> Add more
                  </button>
                </div>
              )}
            </div>

            {/* Companies section */}
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginBottom: "16px",
                overflow: "hidden",
                borderLeft: "4px solid #ccc",
              }}
            >
              <button
                type="button"
                aria-expanded={isCompaniesExpanded}
                onClick={() => setIsCompaniesExpanded((v) => !v)}
                style={{
                  padding: "12px 16px",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  font: "inherit",
                }}
              >
                {isCompaniesExpanded ? (
                  <ChevronDown size={16} style={{ color: "#6c757d" }} />
                ) : (
                  <ChevronRight size={16} style={{ color: "#6c757d" }} />
                )}
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#141414",
                    fontFamily: FF,
                  }}
                >
                  Companies
                </span>
              </button>

              {isCompaniesExpanded && (
                <div style={{ padding: "16px" }}>
                  <div style={fieldWrap}>
                    <label
                      htmlFor="create-ticket-company-associate"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#141414",
                        marginBottom: "6px",
                        fontFamily: FF,
                      }}
                    >
                      Associate records
                    </label>
                    <SimpleDropdown
                      id="create-ticket-company-associate"
                      value={ticketForm.companyAssociateRecord}
                      options={["Company A", "Company B", "Company C"]}
                      onChange={setField("companyAssociateRecord")}
                      placeholder="Search"
                      testId="company-associate-input"
                    />
                  </div>

                  <div style={fieldWrap}>
                    <label
                      htmlFor="create-ticket-company-association-label"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#141414",
                        marginBottom: "6px",
                        fontFamily: FF,
                      }}
                    >
                      Association label{" "}
                      <span style={{ color: "#f2545b" }}>*</span>{" "}
                      <span
                        title="Required association label"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          backgroundColor: "#e0e7ef",
                          color: "#6c757d",
                          fontSize: "11px",
                          cursor: "help",
                        }}
                      >
                        i
                      </span>
                    </label>
                    <input
                      id="create-ticket-company-association-label"
                      type="text"
                      value={ticketForm.companyAssociationLabel}
                      readOnly
                      style={{
                        ...inputStyle,
                        backgroundColor: "#f7fafc",
                        color: "#a0aec0",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <Form.Check
                      type="checkbox"
                      label={
                        <span style={{ fontSize: "13px", color: "#6c757d", fontFamily: FF }}>
                          Add timeline activity from this Company{" "}
                          <span
                            title="Adds company activity to the ticket timeline"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              backgroundColor: "#e0e7ef",
                              color: "#6c757d",
                              fontSize: "11px",
                              cursor: "help",
                            }}
                          >
                            i
                          </span>
                        </span>
                      }
                      checked={ticketForm.addTimelineCompany}
                      onChange={(e) =>
                        setTicketForm((p: TicketFormData) => ({ ...p, addTimelineCompany: e.target.checked }))
                      }
                    />
                  </div>

                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#0091ae",
                      fontSize: "13px",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontFamily: FF,
                    }}
                  >
                    <Plus size={14} /> Add more
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        <CreateTicketSidebarFooter
          isEditMode={isEditMode}
          isFormValid={isFormValid}
          loading={loading}
          picklistsLoading={picklistsLoading}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      </div>
    </>
  );
};

/**
 * Usage in your parent component:
 *
 * import { CreateTicketSidebar } from './renderCreateTicket';
 *
 * const [showCreateTicketSidebar, setShowCreateTicketSidebar] = useState(false);
 *
 * // In your JSX:
 * {showCreateTicketSidebar && (
 *   <CreateTicketSidebar onClose={() => setShowCreateTicketSidebar(false)} />
 * )}
 *
 * // Or use the renderCreateTicket helper:
 * import renderCreateTicket from './renderCreateTicket';
 * {renderCreateTicket(showCreateTicketSidebar, setShowCreateTicketSidebar)}
 */
