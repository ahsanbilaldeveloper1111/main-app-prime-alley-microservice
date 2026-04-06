import React from "react";
import { X, Plus } from "lucide-react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import PhoneInput from "react-phone-number-input";
import { Dropdown, Spinner, Form } from "react-bootstrap";
import RichNoteEditor from "@components/RichNoteEditor";
import {
  CRM_PERSON_DISPOSITION_OPTIONS,
  formatCrmPersonDispositionLabel,
} from "@utils/crmPersonDisposition";
import { getDatetimeLocalMinNow } from "@utils/datetimeLocalInput";

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

interface ProspectRequiredFieldsSectionProps {
  contactForm: ProspectFormState;
  setContactForm: ProspectEditSidebarProps["setContactForm"];
  parsePhoneNumberInput: ProspectEditSidebarProps["parsePhoneNumberInput"];
}

interface ProspectMetaSectionProps {
  contactForm: ProspectFormState;
  setContactForm: ProspectEditSidebarProps["setContactForm"];
  availableCampaigns: ProspectEditSidebarProps["availableCampaigns"];
  extensions: ProspectEditSidebarProps["extensions"];
}

interface ProspectAdditionalSectionProps {
  contactForm: ProspectFormState;
  setContactForm: ProspectEditSidebarProps["setContactForm"];
  availableTags: ProspectEditSidebarProps["availableTags"];
  isEditing: boolean;
  updateCustomField: (
    index: number,
    key: "field_name" | "field_value",
    value: string,
  ) => void;
  removeCustomField: (id: string) => void;
}

interface ProspectSidebarFooterProps {
  isFormValid: boolean;
  createContactLoading: boolean;
  isEditing: boolean;
  contactFormLoading: boolean;
  onClose: () => void;
  onCreateAndAddAnother?: () => void;
}

let customFieldIdCounter = 0;

const createCustomFieldId = () => `custom-field-${Date.now()}-${customFieldIdCounter++}`;

const getUpdatedFormForPhoneChange = (
  value: string | undefined,
  currentForm: ProspectFormState,
  parsePhoneNumberInput: ProspectEditSidebarProps["parsePhoneNumberInput"],
): ProspectFormState => {
  if (!value) {
    return {
      ...currentForm,
      phone_country_code: "",
      phoneNumber: "",
    };
  }

  try {
    const phoneNumber = parsePhoneNumberInput(value);
    if (phoneNumber) {
      return {
        ...currentForm,
        phone_country_code: `+${phoneNumber.countryCallingCode}`,
        phoneNumber: phoneNumber.nationalNumber,
      };
    }

    return {
      ...currentForm,
      phone_country_code: "",
      phoneNumber: value,
    };
  } catch {
    return {
      ...currentForm,
      phone_country_code: "",
      phoneNumber: value,
    };
  }
};

const PROSPECT_LEGAL_BASIS_OPTIONS = [
  "Legitimate interest",
  "Consent",
  "Contract",
  "Legal obligation",
  "Vital interests",
  "Public task",
] as const;

function toggleProspectLegalBasisOption(
  option: string,
  setContactForm: ProspectEditSidebarProps["setContactForm"],
): void {
  setContactForm((prev) => {
    const selected = prev.legal_basis.includes(option);
    return {
      ...prev,
      legal_basis: selected
        ? prev.legal_basis.filter((b) => b !== option)
        : [...prev.legal_basis, option],
    };
  });
}

const ProspectMetaSection: React.FC<ProspectMetaSectionProps> = ({
  contactForm,
  setContactForm,
  availableCampaigns,
  extensions,
}) => (
  <div className="contact-form-section" style={{ marginTop: "24px" }}>
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="prospect-campaign-select"
        className="contact-form-label"
        style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 600,
          color: "#141414",
          marginBottom: "8px",
        }}
      >
        Campaign
      </label>
      {(() => {
        const campaignSelectOptions = availableCampaigns.map((c) => ({
          value: String(c.id),
          label: c.label,
        }));
        return (
          <Select
            inputId="prospect-campaign-select"
            value={
              contactForm.campaign_id == null
                ? null
                : campaignSelectOptions.find(
                    (o) => o.value === String(contactForm.campaign_id),
                  ) ?? null
            }
            onChange={(opt: any) =>
              setContactForm({
                ...contactForm,
                campaign_id: opt?.value ? Number(opt.value) : null,
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
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="prospect-owner-select"
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
        inputId="prospect-owner-select"
        value={(() => {
          const opts = extensions.map((ext: any) => ({
            value: String(ext.extension ?? ext.id ?? ""),
            label:
              ext.display_name ||
              ext.name ||
              ext.extension ||
              String(ext.id || ""),
          }));
          return contactForm.contact_owner == null
            ? null
            : opts.find((o) => o.value === contactForm.contact_owner) || null;
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
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="prospect-source-input"
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
        id="prospect-source-input"
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
        onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
        placeholder="Enter source"
      />
    </div>
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="prospect-disposition-dropdown"
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
          id="prospect-disposition-dropdown"
          variant="outline-secondary"
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            border: "1px solid #8a8a8a",
            borderRadius: "4px",
            fontSize: "14px",
            backgroundColor: "#fff",
            color: contactForm.disposition ? "#141414" : "#a0aec0",
          }}
        >
          {contactForm.disposition
            ? formatCrmPersonDispositionLabel(contactForm.disposition)
            : "Select..."}
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ width: "100%" }}>
          {CRM_PERSON_DISPOSITION_OPTIONS.map(({ value, label }) => (
            <Dropdown.Item
              key={value}
              onClick={() =>
                setContactForm({
                  ...contactForm,
                  disposition: value,
                })
              }
            >
              {label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="prospect-legal-basis-dropdown"
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
      <Dropdown autoClose="outside">
        <Dropdown.Toggle
          id="prospect-legal-basis-dropdown"
          variant="outline-secondary"
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            border: "1px solid #8a8a8a",
            borderRadius: "4px",
            fontSize: "14px",
            backgroundColor: "#fff",
            color: contactForm.legal_basis?.length ? "#141414" : "#a0aec0",
          }}
        >
          {contactForm.legal_basis?.length
            ? contactForm.legal_basis.join(", ")
            : "Select..."}
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ width: "100%", padding: "8px" }}>
          {PROSPECT_LEGAL_BASIS_OPTIONS.map((option) => (
            <Dropdown.Item
              key={option}
              as="div"
              style={{ padding: "4px 8px" }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Form.Check
                type="checkbox"
                id={`prospect-legal-basis-${option}`}
                label={option}
                checked={contactForm.legal_basis.includes(option)}
                onChange={() =>
                  toggleProspectLegalBasisOption(option, setContactForm)
                }
              />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  </div>
);

const ProspectAdditionalSection: React.FC<ProspectAdditionalSectionProps> = ({
  contactForm,
  setContactForm,
  availableTags,
  isEditing,
  updateCustomField,
  removeCustomField,
}) => {
  const scheduledFloor = getDatetimeLocalMinNow();
  const allowLegacyPastScheduled =
    isEditing &&
    contactForm.scheduled_call_at !== "" &&
    contactForm.scheduled_call_at < scheduledFloor;
  const scheduledInputMin = allowLegacyPastScheduled ? undefined : scheduledFloor;

  return (
  <div
    className="contact-form-section"
    style={{
      marginTop: "24px",
      paddingTop: "24px",
      borderTop: "1px solid #eaf0f6",
    }}
  >
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="prospect-company-domain-input"
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
        id="prospect-company-domain-input"
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
        onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
      />
    </div>
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="prospect-scheduled-call-input"
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
        id="prospect-scheduled-call-input"
        type="datetime-local"
        {...(scheduledInputMin === undefined ? {} : { min: scheduledInputMin })}
        value={contactForm.scheduled_call_at}
        onFocus={(e) => {
          const floor = getDatetimeLocalMinNow();
          const cur = contactForm.scheduled_call_at;
          if (isEditing && cur !== "" && cur < floor) {
            e.currentTarget.removeAttribute("min");
          } else {
            e.currentTarget.min = floor;
          }
        }}
        onChange={(e) => {
          const v = e.target.value;
          const minVal = getDatetimeLocalMinNow();
          if (v !== "" && v < minVal) {
            return;
          }
          setContactForm({
            ...contactForm,
            scheduled_call_at: v,
          });
        }}
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
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="prospect-tags-select"
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
        inputId="prospect-tags-select"
        isMulti
        value={contactForm.tags}
        onChange={(selected) => {
          const tags = selected ? [...selected] : [];
          setContactForm((prev: any) => ({ ...prev, tags }));
        }}
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
    <div className="contact-form-field" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="prospect-note-editor"
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
        id="prospect-note-editor"
        value={contactForm.note ?? ""}
        onChange={(html) => setContactForm({ ...contactForm, note: html })}
        placeholder="Notes about this contact"
        height={80}
      />
    </div>
    <div
      className="contact-form-field"
      style={{
        marginBottom: contactForm.custom_fields?.length ? "12px" : "0px",
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
                id: createCustomFieldId(),
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
              onChange={(e) =>
                updateCustomField(idx, "field_name", e.target.value)
              }
              placeholder="Title"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
            />
            <input
              type="text"
              value={f.field_value}
              onChange={(e) =>
                updateCustomField(idx, "field_value", e.target.value)
              }
              placeholder="Value"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
            />
            <button
              type="button"
              aria-label={`Remove custom field ${idx + 1}`}
              onClick={() => removeCustomField(f.id)}
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
                e.currentTarget.style.backgroundColor = "#fef2f2";
                e.currentTarget.style.borderColor = "#ef4444";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
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
  );
};

const ProspectSidebarFooter: React.FC<ProspectSidebarFooterProps> = ({
  isFormValid,
  createContactLoading,
  isEditing,
  contactFormLoading,
  onClose,
  onCreateAndAddAnother,
}) => {
  const isPrimaryDisabled =
    !isFormValid || createContactLoading || (isEditing && contactFormLoading);

  const canPrimaryHover =
    isFormValid && !createContactLoading && (!isEditing || !contactFormLoading);

  const canSecondaryActions = isFormValid && !createContactLoading;

  let primaryButtonLabel: string;
  if (createContactLoading) {
    primaryButtonLabel = isEditing ? "Updating..." : "Creating...";
  } else {
    primaryButtonLabel = isEditing ? "Update" : "Create";
  }

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
        className="contact-form-btn-create"
        disabled={isPrimaryDisabled}
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
        {primaryButtonLabel}
      </button>
      {!isEditing && onCreateAndAddAnother && (
        <button
          type="button"
          className="contact-form-btn-create-another"
          disabled={!canSecondaryActions}
          onClick={onCreateAndAddAnother}
          style={{
            padding: "10px 20px",
            backgroundColor: "transparent",
            color: canSecondaryActions ? "#141414" : "#a0aec0",
            border: "1px solid #8a8a8a",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: canSecondaryActions ? "pointer" : "not-allowed",
          }}
          onMouseEnter={(e) => {
            if (canSecondaryActions) {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }
          }}
          onMouseLeave={(e) => {
            if (canSecondaryActions) {
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
  );
};

const ProspectRequiredFieldsSection: React.FC<
  ProspectRequiredFieldsSectionProps
> = ({ contactForm, setContactForm, parsePhoneNumberInput }) => (
  <div className="contact-form-section">
    <div
      className="contact-form-field"
      style={{ marginBottom: "20px" }}
    >
      <label
        htmlFor="prospect-first-name"
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
        id="prospect-first-name"
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
        htmlFor="prospect-last-name"
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
        id="prospect-last-name"
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
        htmlFor="prospect-email"
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
        id="prospect-email"
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
        htmlFor="prospect-phone"
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
          id="prospect-phone"
          international
          defaultCountry="US"
          value={
            contactForm.phone_country_code && contactForm.phoneNumber
              ? `${contactForm.phone_country_code}${contactForm.phoneNumber}`
              : contactForm.phoneNumber || undefined
          }
          onChange={(value) =>
            setContactForm((prev) =>
              getUpdatedFormForPhoneChange(
                value,
                prev,
                parsePhoneNumberInput,
              ),
            )
          }
          placeholder="Enter phone number"
        />
      </div>
    </div>
  </div>
);

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

  const updateCustomField = (
    index: number,
    key: "field_name" | "field_value",
    value: string,
  ) => {
    setContactForm((prev) => ({
      ...prev,
      custom_fields: (prev.custom_fields ?? []).map((cf, i) =>
        i === index ? { ...cf, [key]: value } : cf,
      ),
    }));
  };

  const removeCustomField = (id: string) => {
    setContactForm((prev) => ({
      ...prev,
      custom_fields: (prev.custom_fields ?? []).filter((cf) => cf.id !== id),
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isDisabled =
      !isFormValid || createContactLoading || (isEditing && contactFormLoading);
    if (isDisabled) {
      return;
    }
    onSubmitPrimary();
  };

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
            onSubmit={handleFormSubmit}
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
                <ProspectRequiredFieldsSection
                  contactForm={contactForm}
                  setContactForm={setContactForm}
                  parsePhoneNumberInput={parsePhoneNumberInput}
                />
                <ProspectMetaSection
                  contactForm={contactForm}
                  setContactForm={setContactForm}
                  availableCampaigns={availableCampaigns}
                  extensions={extensions}
                />
                <ProspectAdditionalSection
                  contactForm={contactForm}
                  setContactForm={setContactForm}
                  availableTags={availableTags}
                  isEditing={isEditing}
                  updateCustomField={updateCustomField}
                  removeCustomField={removeCustomField}
                />
                </>
              )}
            </div>

            <ProspectSidebarFooter
              isFormValid={isFormValid}
              createContactLoading={createContactLoading}
              isEditing={isEditing}
              contactFormLoading={contactFormLoading}
              onClose={onClose}
              onCreateAndAddAnother={onCreateAndAddAnother}
            />
          </form>
        </div>
    </>
  );
};

export default ProspectEditSidebar;

