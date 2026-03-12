import React from "react";
import { X, Plus } from "lucide-react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import PhoneInput from "react-phone-number-input";
import { Dropdown, Spinner, Form } from "react-bootstrap";
import RichNoteEditor from "@components/RichNoteEditor";

export interface ProspectFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone_country_code: string;
  phoneNumber: string;
  campaign_id: number | null;
  contact_owner: string | null;
  lifecycle_stage: string;
  disposition: string;
  legal_basis: string[];
  company_domain: string;
  scheduled_call_at: string;
  tags: Array<{ value: string; label: string; id: number }>;
  note: string;
  source_file: string;
  custom_fields: Array<{
    id: string;
    field_name: string;
    field_value: string;
  }>;
}

export interface ProspectEditSidebarProps {
  isOpen: boolean;
  title: string;
  isEditing: boolean;
  isFormValid: boolean;
  createContactLoading: boolean;
  contactForm: ProspectFormState;
  setContactForm: (
    next: ProspectFormState | ((prev: ProspectFormState) => ProspectFormState),
  ) => void;
  contactFormLoading: boolean;
  contactFormLoadError: string | null;
  availableCampaigns: Array<{ id: number; label: string }>;
  extensions: any[];
  availableTags: Array<{ value: string; label: string; id: number }>;
  onClose: () => void;
  onSubmitPrimary: () => void;
  onCreateAndAddAnother?: () => void;
  parsePhoneNumberInput: (value: string) =>
    | { countryCallingCode: string; nationalNumber: string }
    | undefined;
}

const ProspectEditSidebar: React.FC<ProspectEditSidebarProps> = ({
  isOpen,
  title,
  isEditing,
  isFormValid,
  createContactLoading,
  contactForm,
  setContactForm,
  contactFormLoading,
  contactFormLoadError,
  availableCampaigns,
  extensions,
  availableTags,
  onClose,
  onSubmitPrimary,
  onCreateAndAddAnother,
  parsePhoneNumberInput,
}) => {
  if (!isOpen) return null;

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
        }}
        onClick={onClose}
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
              {title}
            </h2>
            <button
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
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !isFormValid ||
                createContactLoading ||
                (isEditing && contactFormLoading)
              ) {
                return;
              }
              onSubmitPrimary();
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            {contactFormLoadError && (
              <div
                style={{
                  padding: "12px 24px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: "14px",
                }}
              >
                {contactFormLoadError}
              </div>
            )}
            {/* Form Content */}
            <div
              className="contact-sidebar-content"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "40px",
              }}
            >
              {isEditing && contactFormLoading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 280,
                    gap: "16px",
                  }}
                >
                  <Spinner
                    animation="border"
                    role="status"
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      color: "#0091ae",
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    Loading prospect...
                  </span>
                </div>
              ) : (
                <>
                  {/* Required: Name, Email, Phone */}
                  <div className="contact-form-section">
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        First name <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="text"
                        data-test-id="firstname-input"
                        value={contactForm.firstName}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            firstName: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Last name <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="text"
                        data-test-id="lastname-input"
                        value={contactForm.lastName}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            lastName: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Email <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="email"
                        data-test-id="email-input"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Phone <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <div className="phone-input-wrapper contact-form-phone-input-wrapper">
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={
                            contactForm.phone_country_code &&
                            contactForm.phoneNumber
                              ? `${contactForm.phone_country_code}${contactForm.phoneNumber}`
                              : contactForm.phoneNumber || undefined
                          }
                          onChange={(value) => {
                            if (value) {
                              try {
                                const phoneNumber =
                                  parsePhoneNumberInput(value);
                                if (phoneNumber) {
                                  setContactForm({
                                    ...contactForm,
                                    phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                    phoneNumber: phoneNumber.nationalNumber,
                                  });
                                } else {
                                  setContactForm({
                                    ...contactForm,
                                    phone_country_code: "",
                                    phoneNumber: value,
                                  });
                                }
                              } catch {
                                setContactForm({
                                  ...contactForm,
                                  phone_country_code: "",
                                  phoneNumber: value,
                                });
                              }
                            } else {
                              setContactForm({
                                ...contactForm,
                                phone_country_code: "",
                                phoneNumber: "",
                              });
                            }
                          }}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional: Campaign, Contact owner, Lifecycle stage, Disposition, Legal basis */}
                  <div
                    className="contact-form-section"
                    style={{ marginTop: "24px" }}
                  >
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Campaign <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      {(() => {
                        const campaignSelectOptions = availableCampaigns.map(
                          (c) => ({
                            value: String(c.id),
                            label: c.label,
                          }),
                        );
                        return (
                          <Select
                            value={
                              contactForm.campaign_id != null
                                ? campaignSelectOptions.find(
                                    (o) =>
                                      o.value ===
                                      String(contactForm.campaign_id),
                                  ) ?? null
                                : null
                            }
                            onChange={(opt: any) =>
                              setContactForm({
                                ...contactForm,
                                campaign_id: opt?.value
                                  ? Number(opt.value)
                                  : null,
                              })
                            }
                            options={campaignSelectOptions}
                            placeholder="Select campaign"
                            isClearable
                            isSearchable
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: 40,
                                border: "1px solid #8a8a8a",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }),
                            }}
                          />
                        );
                      })()}
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Owner
                      </label>
                      <Select
                        value={(() => {
                          const opts = extensions.map((ext: any) => ({
                            value: String(ext.extension ?? ext.id ?? ""),
                            label:
                              ext.display_name ||
                              ext.name ||
                              ext.extension ||
                              String(ext.id || ""),
                          }));
                          return contactForm.contact_owner != null
                            ? opts.find(
                                (o) => o.value === contactForm.contact_owner,
                              ) || null
                            : null;
                        })()}
                        onChange={(opt: any) =>
                          setContactForm({
                            ...contactForm,
                            contact_owner: opt?.value ?? null,
                          })
                        }
                        options={extensions.map((ext: any) => ({
                          value: String(ext.extension ?? ext.id ?? ""),
                          label:
                            ext.display_name ||
                            ext.name ||
                            ext.extension ||
                            String(ext.id || ""),
                        }))}
                        placeholder="Select owner"
                        isClearable
                        isSearchable
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: 40,
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }),
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Source
                      </label>
                      <input
                        type="text"
                        value={contactForm.source_file}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            source_file: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                        placeholder="Enter source"
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Disposition
                      </label>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                            color: contactForm.disposition
                              ? "#141414"
                              : "#a0aec0",
                          }}
                        >
                          {contactForm.disposition || "Select..."}
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ width: "100%" }}>
                          {[
                            "interested",
                            "not_interested",
                            "callback_requested",
                            "no_answer",
                            "busy",
                            "do_not_call",
                            "wrong_number",
                            "follow_up",
                          ].map((d) => (
                            <Dropdown.Item
                              key={d}
                              onClick={() =>
                                setContactForm({
                                  ...contactForm,
                                  disposition: d,
                                })
                              }
                            >
                              {d.replace(/_/g, " ")}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Legal basis for processing contact&apos;s data
                      </label>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                            color: contactForm.legal_basis?.length
                              ? "#141414"
                              : "#a0aec0",
                          }}
                        >
                          {contactForm.legal_basis?.length
                            ? contactForm.legal_basis.join(", ")
                            : "Select..."}
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          style={{ width: "100%", padding: "8px" }}
                        >
                          {[
                            "Legitimate interest",
                            "Consent",
                            "Contract",
                            "Legal obligation",
                            "Vital interests",
                            "Public task",
                          ].map((option) => (
                            <Dropdown.Item
                              key={option}
                              as="div"
                              style={{ padding: "4px 8px" }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const isSelected =
                                  contactForm.legal_basis.includes(option);
                                setContactForm({
                                  ...contactForm,
                                  legal_basis: isSelected
                                    ? contactForm.legal_basis.filter(
                                        (b) => b !== option,
                                      )
                                    : [...contactForm.legal_basis, option],
                                });
                              }}
                            >
                              <Form.Check
                                type="checkbox"
                                label={option}
                                checked={contactForm.legal_basis.includes(
                                  option,
                                )}
                                onChange={() => {}}
                              />
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>

                  {/* Optional: Datetime and text fields */}
                  <div
                    className="contact-form-section"
                    style={{
                      marginTop: "24px",
                      paddingTop: "24px",
                      borderTop: "1px solid #eaf0f6",
                    }}
                  >
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Company domain
                      </label>
                      <input
                        type="text"
                        value={contactForm.company_domain}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            company_domain: e.target.value,
                          })
                        }
                        placeholder="e.g. example.com"
                        data-no-capitalize
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Scheduled call at
                      </label>
                      <input
                        type="datetime-local"
                        value={contactForm.scheduled_call_at}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            scheduled_call_at: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Tags
                      </label>
                      <CreatableSelect
                        isMulti
                        value={contactForm.tags}
                        onChange={(selected) =>
                          setContactForm({
                            ...contactForm,
                            tags: selected ? [...selected] : [],
                          })
                        }
                        options={availableTags.map((t: any) => ({
                          value: t.value,
                          label: t.label,
                          id: t.id,
                        }))}
                        placeholder="Select or create tags"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: 40,
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }),
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Note
                      </label>
                      <RichNoteEditor
                        value={contactForm.note ?? ""}
                        onChange={(html) =>
                          setContactForm({ ...contactForm, note: html })
                        }
                        placeholder="Notes about this contact"
                        minHeight={80}
                      />
                    </div>

                    {/* Custom fields (user-defined) */}
                    <div
                      className="contact-form-field"
                      style={{
                        marginBottom: contactForm.custom_fields?.length
                          ? "12px"
                          : "0px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setContactForm((prev) => ({
                            ...prev,
                            custom_fields: [
                              ...(prev.custom_fields ?? []),
                              {
                                id: `${Date.now()}-${Math.random()}`,
                                field_name: "",
                                field_value: "",
                              },
                            ],
                          }))
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          backgroundColor: "transparent",
                          border: "1px dashed #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
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
                        <Plus size={16} />
                        Add custom field
                      </button>
                    </div>

                    {!!contactForm.custom_fields?.length && (
                      <div style={{ marginTop: "12px" }}>
                        {contactForm.custom_fields.map((f, idx) => (
                          <div
                            key={f.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr auto",
                              gap: "10px",
                              alignItems: "center",
                              marginBottom: "10px",
                            }}
                          >
                            <input
                              type="text"
                              value={f.field_name}
                              onChange={(e) => {
                                const v = e.target.value;
                                setContactForm((prev) => ({
                                  ...prev,
                                  custom_fields: (prev.custom_fields ?? []).map(
                                    (cf, i) =>
                                      i === idx ? { ...cf, field_name: v } : cf,
                                  ),
                                }));
                              }}
                              placeholder="Title"
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                border: "1px solid #8a8a8a",
                                borderRadius: "4px",
                                fontSize: "14px",
                                outline: "none",
                              }}
                              onFocus={(e) =>
                                (e.currentTarget.style.borderColor = "#0091ae")
                              }
                              onBlur={(e) =>
                                (e.currentTarget.style.borderColor = "#8a8a8a")
                              }
                            />
                            <input
                              type="text"
                              value={f.field_value}
                              onChange={(e) => {
                                const v = e.target.value;
                                setContactForm((prev) => ({
                                  ...prev,
                                  custom_fields: (prev.custom_fields ?? []).map(
                                    (cf, i) =>
                                      i === idx ? { ...cf, field_value: v } : cf,
                                  ),
                                }));
                              }}
                              placeholder="Value"
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                border: "1px solid #8a8a8a",
                                borderRadius: "4px",
                                fontSize: "14px",
                                outline: "none",
                              }}
                              onFocus={(e) =>
                                (e.currentTarget.style.borderColor = "#0091ae")
                              }
                              onBlur={(e) =>
                                (e.currentTarget.style.borderColor = "#8a8a8a")
                              }
                            />
                            <button
                              type="button"
                              aria-label={`Remove custom field ${idx + 1}`}
                              onClick={() =>
                                setContactForm((prev) => ({
                                  ...prev,
                                  custom_fields: (prev.custom_fields ?? []).filter(
                                    (cf) => cf.id !== f.id,
                                  ),
                                }))
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 36,
                                height: 36,
                                borderRadius: "6px",
                                border: "1px solid #8a8a8a",
                                backgroundColor: "transparent",
                                cursor: "pointer",
                                color: "#718096",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#fef2f2";
                                e.currentTarget.style.borderColor = "#ef4444";
                                e.currentTarget.style.color = "#ef4444";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                                e.currentTarget.style.borderColor = "#8a8a8a";
                                e.currentTarget.style.color = "#718096";
                              }}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
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
                className="contact-form-btn-create"
                disabled={
                  !isFormValid ||
                  createContactLoading ||
                  (isEditing && contactFormLoading)
                }
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    isFormValid &&
                    !createContactLoading &&
                    (!isEditing || !contactFormLoading)
                      ? "#0091ae"
                      : "#cbd5e0",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isFormValid &&
                    !createContactLoading &&
                    (!isEditing || !contactFormLoading)
                      ? "pointer"
                      : "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (
                    isFormValid &&
                    !createContactLoading &&
                    (!isEditing || !contactFormLoading)
                  ) {
                    e.currentTarget.style.backgroundColor = "#007a94";
                  }
                }}
                onMouseLeave={(e) => {
                  if (
                    isFormValid &&
                    !createContactLoading &&
                    (!isEditing || !contactFormLoading)
                  ) {
                    e.currentTarget.style.backgroundColor = "#0091ae";
                  }
                }}
              >
                {createContactLoading
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                    ? "Update"
                    : "Create"}
              </button>
              {!isEditing && onCreateAndAddAnother && (
                <button
                  type="button"
                  className="contact-form-btn-create-another"
                  disabled={!isFormValid || createContactLoading}
                  onClick={onCreateAndAddAnother}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "transparent",
                    color:
                      isFormValid && !createContactLoading
                        ? "#141414"
                        : "#a0aec0",
                    border: "1px solid #8a8a8a",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor:
                      isFormValid && !createContactLoading
                        ? "pointer"
                        : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (isFormValid && !createContactLoading) {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isFormValid && !createContactLoading) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  Create and add another
                </button>
              )}
              <button
                type="button"
                className="contact-form-btn-cancel"
                disabled={createContactLoading}
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f7fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
    </>
  );
};

export default ProspectEditSidebar;

