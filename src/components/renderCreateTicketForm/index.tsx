import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Dropdown, Form } from "react-bootstrap";
import { APP_FONT } from "../../styles/fonts";
import { getAllUsers } from "../../utils/users";

const FF = APP_FONT;

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface TicketFormData {
  ticketName: string;
  pipeline: string;
  ticketStatus: string;
  ticketDescription: string;
  source: string;
  ticketOwner: string;
  priority: string;
  createDate: string;
  // Associations
  contactAssociateRecord: string;
  contactAssociationLabel: string;
  addTimelineContact: boolean;
  companyAssociateRecord: string;
  companyAssociationLabel: string;
  addTimelineCompany: boolean;
}

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
}

// ─── Initial State ────────────────────────────────────────────────────────────
const initialTicketForm: TicketFormData = {
  ticketName: "",
  pipeline: "Support Pipeline",
  ticketStatus: "New",
  ticketDescription: "",
  source: "",
  ticketOwner: "",
  priority: "",
  createDate: "",
  contactAssociateRecord: "",
  contactAssociationLabel: "No label",
  addTimelineContact: false,
  companyAssociateRecord: "",
  companyAssociationLabel: "Primary",
  addTimelineCompany: false,
};

// ─── Dropdown options ─────────────────────────────────────────────────────────
const PIPELINE_OPTIONS = ["Support Pipeline", "Technical Pipeline", "Billing Pipeline"];
const TICKET_STATUS_OPTIONS = ["New", "Waiting on contact", "Waiting on us", "Closed"];
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
}) => {
  const [ticketForm, setTicketForm] = useState<TicketFormData>(initialTicketForm);
  const [loading, setLoading] = useState(false);
  const [ownerOptions, setOwnerOptions] = useState<string[]>([]);
  const [isContactsExpanded, setIsContactsExpanded] = useState(true);
  const [isCompaniesExpanded, setIsCompaniesExpanded] = useState(true);

  const set =
    <K extends keyof TicketFormData>(key: K) =>
    (val: TicketFormData[K]) =>
      setTicketForm((prev) => ({ ...prev, [key]: val }));

  const setE =
    (key: keyof TicketFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setTicketForm((prev) => ({ ...prev, [key]: e.target.value }));

  const isFormValid =
    ticketForm.ticketName.trim() !== "" &&
    ticketForm.pipeline !== "" &&
    ticketForm.ticketStatus !== "";

  const todayDate = useMemo(() => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().split("T")[0];
  }, []);

  const handleCreateDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const safeDate = selectedDate && selectedDate > todayDate ? todayDate : selectedDate;
    setTicketForm((prev) => ({ ...prev, createDate: safeDate }));
  };

  useEffect(() => {
    const getDisplayValue = (item: unknown, keys: string[]): string => {
      const record = (item ?? {}) as Record<string, unknown>;
      for (const key of keys) {
        const value = record[key];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      return "";
    };

    const loadFormDropdowns = async () => {
      try {
        const usersResponse = await getAllUsers({ page: 1, perPage: 500 });

        const userList = Array.isArray(usersResponse?.dataList)
          ? usersResponse.dataList
          : [];
        const owners = userList
          .map((user: unknown) =>
            getDisplayValue(user, [
              "name",
              "display_name",
              "full_name",
              "first_name",
              "email",
              "user_extension",
            ]),
          )
          .filter(Boolean);
        setOwnerOptions(Array.from(new Set(owners)));

       
        
      } catch (error) {
        console.error("Failed to load create ticket dropdown options:", error);
      }
    };

    loadFormDropdowns();
  }, []);

  useEffect(() => {
    if (!ticketForm.ticketOwner && ownerOptions.length > 0) {
      setTicketForm((prev) => ({ ...prev, ticketOwner: ownerOptions[0] }));
    }
  }, [ownerOptions, ticketForm.ticketOwner]);

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "#0091ae");
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "rgb(138, 138, 138)");

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      // Replace with actual API call e.g. createTicket(ticketForm)
      await new Promise((res) => setTimeout(res, 800));
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            Create Ticket
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
        <div style={{ flex: 1, overflowY: "auto", padding: "16px clamp(16px, 6vw, 40px) 40px" }}>

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
              onChange={setE("ticketName")}
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
              options={PIPELINE_OPTIONS}
              onChange={set("pipeline")}
              placeholder="Select Pipeline"
              testId="pipeline-input"
            />
          </div>

          {/* Ticket Status */}
          <div style={fieldWrap}>
            {fieldLabel("Ticket status", true)}
            <SimpleDropdown
              id="create-ticket-status"
              value={ticketForm.ticketStatus}
              options={TICKET_STATUS_OPTIONS}
              onChange={set("ticketStatus")}
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
              onChange={setE("ticketDescription")}
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
              onChange={set("source")}
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
              options={ownerOptions}
              onChange={set("ticketOwner")}
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
              onChange={set("priority")}
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
                      onChange={set("contactAssociateRecord")}
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
                      onChange={set("contactAssociationLabel")}
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
                        setTicketForm((p) => ({ ...p, addTimelineContact: e.target.checked }))
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
                      onChange={set("companyAssociateRecord")}
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
                        setTicketForm((p) => ({ ...p, addTimelineCompany: e.target.checked }))
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

        {/* ── Footer ── */}
        <div
          style={{
            padding: "16px clamp(16px, 4vw, 24px)",
            borderTop: "1px solid #eaf0f6",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* Create */}
          <button
            type="button"
            disabled={!isFormValid || loading}
            onClick={handleSubmit}
            style={{
              padding: "10px 20px",
              backgroundColor: isFormValid && !loading ? "#0091ae" : "#cbd5e0",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isFormValid && !loading ? "pointer" : "not-allowed",
              fontFamily: FF,
              transition: "150ms ease-out",
            }}
            onMouseEnter={(e) => {
              if (isFormValid && !loading) e.currentTarget.style.backgroundColor = "#007a94";
            }}
            onMouseLeave={(e) => {
              if (isFormValid && !loading) e.currentTarget.style.backgroundColor = "#0091ae";
            }}
          >
            {loading ? "Creating..." : "Create"}
          </button>

          {/* Create and add another */}
          <button
            type="button"
            disabled={!isFormValid || loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: isFormValid && !loading ? "#141414" : "#a0aec0",
              border: "1px solid #8a8a8a",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isFormValid && !loading ? "pointer" : "not-allowed",
              fontFamily: FF,
              transition: "150ms ease-out",
            }}
            onMouseEnter={(e) => {
              if (isFormValid && !loading) e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              if (isFormValid && !loading) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Create and add another
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "#141414",
              border: "1px solid #8a8a8a",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: FF,
              transition: "150ms ease-out",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cancel
          </button>
        </div>
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
