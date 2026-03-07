import { useState } from "react";
import { Info, Plus, ChevronDown } from "lucide-react";

const font = "Lexend Deca, Helvetica, Arial, sans-serif";

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: font,
    color: "#141414",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    padding: "24px",
    maxWidth: "calc(1376px)",
    margin: "0 auto",
    boxSizing: "border-box" as const,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: 300,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 16px 0",
    lineHeight: "29px",
  },
  card: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    backgroundColor: "rgb(255, 255, 255)",
    boxShadow: "rgba(20, 20, 20, 0.08) 0px 1px 8px 0px",
    border: "1px solid rgb(204, 204, 204)",
    marginBottom: 16,
    borderRadius: 8,
    boxSizing: "border-box" as const,
    overflow: "hidden",
  },
  cardPadding: {
    padding: "24px",
  },
  btnLight: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    border: "1px solid rgb(204, 204, 204)",
    borderRadius: 4,
    color: "#141414",
    fontFamily: font,
    fontSize: 12,
    fontWeight: 400,
    lineHeight: "14px",
    padding: "8px 16px",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "150ms ease-out",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 4px 0",
    lineHeight: "18px",
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: 400,
    fontFamily: font,
    color: "#141414",
    margin: 0,
    lineHeight: "22px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: "1px solid #f0f0f0",
  },
  infoLeft: {
    display: "flex",
    gap: 20,
    flex: 1,
    alignItems: "flex-start",
  },
  sectionHeadingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: 300,
    fontFamily: font,
    color: "#141414",
    margin: 0,
    lineHeight: "29px",
  },
  link: {
    fontWeight: 600,
    color: "rgb(0, 97, 98)",
    cursor: "pointer",
    textUnderlineOffset: "24%",
    textDecoration: "underline",
    fontFamily: font,
    fontSize: 14,
  },
  contactCard: {
    border: "1px solid rgb(204, 204, 204)",
    borderRadius: 8,
    padding: "24px",
    backgroundColor: "#fff",
    flex: 1,
  },
  contactHeading: {
    fontSize: 20,
    fontWeight: 600,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 12px 0",
    lineHeight: "24px",
  },
  contactDesc: {
    fontSize: 14,
    fontWeight: 400,
    fontFamily: font,
    color: "#444",
    margin: "0 0 20px 0",
    lineHeight: "21px",
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 3px 0",
    display: "block",
  },
  selectRequired: {
    fontSize: 12,
    fontWeight: 400,
    fontFamily: font,
    color: "rgb(0, 97, 98)",
    margin: "0 0 8px 0",
    display: "block",
  },
  selectBox: {
    width: "100%",
    height: 40,
    border: "1px solid rgb(138, 138, 138)",
    borderRadius: 4,
    backgroundColor: "#fff",
    fontFamily: font,
    fontSize: 14,
    color: "#141414",
    paddingInline: 12,
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    cursor: "pointer",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  addAnother: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    color: "rgb(0, 97, 98)",
    fontWeight: 600,
    fontSize: 14,
    fontFamily: font,
    cursor: "pointer",
    textDecoration: "none",
    marginTop: 12,
    border: "none",
    background: "none",
    padding: 0,
  },
  otherContactsCard: {
    border: "1px solid rgb(204, 204, 204)",
    borderRadius: 8,
    padding: "24px",
    backgroundColor: "#fff",
  },
  otherContactsHeading: {
    fontSize: 20,
    fontWeight: 600,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 20px 0",
    lineHeight: "24px",
  },
  otherRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    paddingBottom: 20,
    marginBottom: 20,
    borderBottom: "1px solid #f0f0f0",
    alignItems: "start",
  },
  otherRowLast: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    alignItems: "start",
  },
  otherContactName: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 4px 0",
  },
  otherContactDesc: {
    fontSize: 13,
    fontWeight: 400,
    fontFamily: font,
    color: "#444",
    margin: 0,
    lineHeight: "19px",
  },
};

// ── Company logo illustration ──────────────────────────────────────────────────
function CompanyLogo() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* building base */}
      <polygon points="50,10 85,30 85,75 50,90 15,75 15,30" fill="#e0f4f4" stroke="#00897b" strokeWidth="1.5" />
      {/* left face */}
      <polygon points="15,30 50,10 50,90 15,75" fill="#b2dfdb" />
      {/* right face */}
      <polygon points="85,30 50,10 50,90 85,75" fill="#80cbc4" />
      {/* top highlight */}
      <polygon points="50,10 85,30 50,50 15,30" fill="#e0f4f4" />
      {/* windows left */}
      <rect x="22" y="40" width="10" height="8" rx="1" fill="#00897b" opacity="0.5" />
      <rect x="22" y="54" width="10" height="8" rx="1" fill="#00897b" opacity="0.5" />
      <rect x="22" y="68" width="10" height="8" rx="1" fill="#00897b" opacity="0.5" />
      {/* windows right */}
      <rect x="68" y="40" width="10" height="8" rx="1" fill="#004d40" opacity="0.4" />
      <rect x="68" y="54" width="10" height="8" rx="1" fill="#004d40" opacity="0.4" />
      <rect x="68" y="68" width="10" height="8" rx="1" fill="#004d40" opacity="0.4" />
      {/* center windows */}
      <rect x="44" y="34" width="12" height="10" rx="1" fill="#00695c" opacity="0.5" />
      <rect x="44" y="50" width="12" height="10" rx="1" fill="#00695c" opacity="0.5" />
      <rect x="44" y="66" width="12" height="10" rx="1" fill="#00695c" opacity="0.5" />
    </svg>
  );
}

// ── Select dropdown component ──────────────────────────────────────────────────
function SelectField({
  label,
  required,
  requiredNote,
  placeholder,
  defaultValue,
}: {
  label: string;
  required?: boolean;
  requiredNote?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <span style={s.selectLabel}>
        {label}{required && " *"}
      </span>
      {requiredNote && (
        <span style={s.selectRequired}>This role is required and a user must always be assigned.</span>
      )}
      <div style={{ position: "relative" as const }}>
        <select style={s.selectBox} defaultValue={defaultValue || ""}>
          {defaultValue ? (
            <option value={defaultValue}>{defaultValue}</option>
          ) : (
            <option value="" disabled>{placeholder || "Select a contact"}</option>
          )}
          {!defaultValue && <option value="">Select a contact</option>}
        </select>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CompanyInfoPage() {
  return (
    <div style={s.page}>

      {/* ── Company Information ── */}
      <h1 style={s.pageHeading}>Company Information</h1>

      <div style={s.card}>
        {/* Company Name */}
        <div style={s.infoRow}>
          <div style={s.infoLeft}>
            {/* Logo only on first row, spanning vertically */}
            <div style={{ width: 100, flexShrink: 0, display: "flex", alignItems: "flex-start", paddingTop: 4 }}>
              <CompanyLogo />
            </div>
            <div>
              <p style={s.fieldLabel}>Company Name</p>
              <p style={s.fieldValue}>Prime Alley Technology</p>
            </div>
          </div>
          <button style={s.btnLight}>Edit name</button>
        </div>

        {/* Primary Company Address */}
        <div style={s.infoRow}>
          <div style={s.infoLeft}>
            <div style={{ width: 100, flexShrink: 0 }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <p style={{ ...s.fieldLabel, margin: 0 }}>Primary Company Address</p>
                <Info size={14} color="#888" />
              </div>
              <p style={{ ...s.fieldValue, lineHeight: "24px" }}>
                office 2208<br />
                The burlington Tower<br />
                Business Bay DU<br />
                United Arab Emirates
              </p>
            </div>
          </div>
          <button style={s.btnLight}>Edit address</button>
        </div>

        {/* Business TRN number */}
        <div style={{ ...s.infoRow, borderBottom: "none" }}>
          <div style={s.infoLeft}>
            <div style={{ width: 100, flexShrink: 0 }} />
            <div>
              <p style={s.fieldLabel}>Business TRN number</p>
              <p style={s.fieldValue}>100507016200003</p>
            </div>
          </div>
          <button style={s.btnLight}>Edit Business TRN number</button>
        </div>
      </div>

      {/* ── Points of Contact ── */}
      <div style={{ ...s.sectionHeadingRow, marginTop: 8 }}>
        <h2 style={s.sectionHeading}>Points of Contact</h2>
        <a style={s.link}>Looking for user permissions?</a>
      </div>

      {/* Primary + Billing contacts side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Primary Account Contacts */}
        <div style={s.contactCard}>
          <h3 style={s.contactHeading}>Primary Account Contacts</h3>
          <p style={s.contactDesc}>
            The main person working with the account on a daily basis. This user will receive all important account notifications (including invoices, upgrades, renewals etc.)
          </p>
          <SelectField
            label="Select a user"
            required
            requiredNote
            defaultValue="Rizwan Haider (rizwan@primealley.com)"
          />
          <button style={s.addAnother}>
            <Plus size={14} />
            <span>Add another</span>
          </button>
        </div>

        {/* Billing Contacts */}
        <div style={s.contactCard}>
          <h3 style={s.contactHeading}>Billing Contacts</h3>
          <p style={s.contactDesc}>
            Send copies of invoices, receipts, orders and other renewal notifications to these HubSpot users.
          </p>
          <SelectField
            label="Select a user"
            required
            requiredNote
            defaultValue="Rizwan Haider (rizwan@primealley.com)"
          />
          <button style={s.addAnother}>
            <Plus size={14} />
            <span>Add another</span>
          </button>
        </div>
      </div>

      {/* Other Contacts */}
      <div style={s.otherContactsCard}>
        <h3 style={s.otherContactsHeading}>Other Contacts</h3>

        {/* Accounts Payable */}
        <div style={s.otherRow}>
          <div>
            <p style={s.otherContactName}>Accounts Payable</p>
            <p style={s.otherContactDesc}>Send copies of invoices and credit memos to these users or email addresses.</p>
          </div>
          <SelectField label="Select a user or enter an email address" placeholder="Select a contact" />
        </div>

        {/* Decision Maker */}
        <div style={s.otherRow}>
          <div>
            <p style={s.otherContactName}>Decision Maker</p>
            <p style={s.otherContactDesc}>Approves HubSpot purchases, upgrades, and renewals. Receives all important account notifications.</p>
          </div>
          <SelectField label="Select a user" required requiredNote placeholder="Select a contact" />
        </div>

        {/* Onboarding Contact */}
        <div style={s.otherRow}>
          <div>
            <p style={s.otherContactName}>Onboarding Contact</p>
            <p style={s.otherContactDesc}>Sets up this account through our onboarding process with HubSpot.</p>
          </div>
          <SelectField label="Select a user" required requiredNote placeholder="Select a contact" />
        </div>

        {/* Security Contact */}
        <div style={s.otherRow}>
          <div>
            <p style={s.otherContactName}>Security Contact</p>
            <p style={s.otherContactDesc}>Receives security alerts and notifications.</p>
          </div>
          <SelectField label="Select a user or enter an email address" required requiredNote placeholder="Select a contact" />
        </div>

        {/* Technical Admin */}
        <div style={s.otherRowLast}>
          <div>
            <p style={s.otherContactName}>Technical Admin</p>
            <p style={s.otherContactDesc}>Manages all technical settings in this account, such as domain and integration changes.</p>
          </div>
          <SelectField label="Select a user" required requiredNote placeholder="Select a contact" />
        </div>
      </div>

    </div>
  );
}
