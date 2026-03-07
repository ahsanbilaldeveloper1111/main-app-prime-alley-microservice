import { useState } from "react";
import { X, CreditCard } from "lucide-react";

const font = "Lexend Deca, Helvetica, Arial, sans-serif";

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: font,
    color: "#141414",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    padding: "24px",
    position: "relative" as const,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: 300,
    fontFamily: font,
    color: "#141414",
    margin: 0,
    lineHeight: "29px",
  },
  btnDark: {
    backgroundColor: "rgb(20, 20, 20)",
    borderColor: "rgba(20, 20, 20, 0)",
    color: "rgb(255, 255, 255)",
    textDecoration: "none",
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: 10,
    paddingInline: 24,
    fontFamily: font,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0,
    lineHeight: "18px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  btnLight: {
    backgroundColor: "#fff",
    borderColor: "rgb(204,204,204)",
    color: "rgb(20,20,20)",
    textDecoration: "none",
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: 10,
    paddingInline: 24,
    fontFamily: font,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0,
    lineHeight: "18px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  tableWrapper: {
    backgroundColor: "#fff",
    border: "1px solid rgb(204, 204, 204)",
    borderRadius: 8,
    boxShadow: "rgba(20, 20, 20, 0.08) 0px 1px 8px 0px",
    overflow: "hidden",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontFamily: font,
  },
  thead: {
    backgroundColor: "#f5f5f5",
    borderBottom: "1px solid #e5e5e5",
  },
  th: {
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: font,
    color: "#141414",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
    letterSpacing: 0,
    lineHeight: "18px",
  },
  td: {
    padding: "20px 16px",
    fontSize: 14,
    fontFamily: font,
    color: "#141414",
    verticalAlign: "middle" as const,
    lineHeight: "22px",
  },
  visaChip: {
    background: "#1a1f71",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    padding: "3px 7px",
    borderRadius: 3,
    letterSpacing: 0.5,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  addressLink: {
    color: "rgb(0,97,98)",
    fontWeight: 400,
    fontSize: 14,
    fontFamily: font,
    textDecoration: "none",
    display: "block",
    lineHeight: "22px",
  },
  productLink: {
    color: "rgb(0,97,98)",
    fontWeight: 600,
    fontSize: 14,
    fontFamily: font,
    textDecoration: "underline",
    textUnderlineOffset: "24%",
    cursor: "pointer",
  },
  actionsBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "none",
    border: "none",
    fontFamily: font,
    fontSize: 14,
    fontWeight: 700,
    color: "#141414",
    cursor: "pointer",
    padding: 0,
  },

  // ── Overlay ──
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(20,20,20,0.35)",
    zIndex: 100,
  },

  // ── Sidebar ──
  sidebar: {
    border: "1px solid rgb(204, 204, 204)",
    borderRadius: 0,
    boxShadow: "rgba(20, 20, 20, 0.08) 0px 16px 32px 0px",
    position: "fixed" as const,
    top: 0,
    bottom: 0,
    right: 0,
    minWidth: 300,
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column" as const,
    width: 700,
    backgroundColor: "rgb(255, 255, 255)",
    zIndex: 99999,
    overflowY: "auto" as const,
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e5e5e5",
    flexShrink: 0,
  },
  sidebarTitle: {
    color: "rgb(20,20,20)",
    fontSize: 20,
    fontWeight: 600,
    lineHeight: "24px",
    fontFamily: font,
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#666",
    display: "flex",
    alignItems: "center",
    padding: 4,
  },
  sidebarBody: {
    flex: 1,
    padding: "24px",
    overflowY: "auto" as const,
  },
  sidebarFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #e5e5e5",
    display: "flex",
    gap: 12,
    flexShrink: 0,
    backgroundColor: "#fff",
  },
  fieldLabel: {
    fontSize: 14,
    fontStyle: "unset",
    fontWeight: 600,
    textTransform: "unset" as const,
    color: "rgb(20,20,20)",
    fontFamily: font,
    letterSpacing: 0,
    lineHeight: "18px",
    display: "block",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgb(255,255,255)",
    border: "1px solid rgb(138,138,138)",
    borderRadius: 4,
    color: "rgb(20,20,20)",
    display: "block",
    fontFamily: font,
    fontSize: 16,
    fontWeight: 400,
    height: 40,
    lineHeight: "24px",
    letterSpacing: 0,
    paddingInline: 16,
    paddingBlock: 8,
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    cursor: "pointer",
  },
  checkbox: {
    width: 18,
    height: 18,
    border: "2px solid #141414",
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#141414",
    flexShrink: 0,
    cursor: "pointer",
  },
  checkLabel: {
    fontSize: 14,
    fontFamily: font,
    color: "#141414",
    cursor: "pointer",
  },
  sectionDivider: {
    border: "none",
    borderTop: "1px solid #e5e5e5",
    margin: "24px 0",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 12px 0",
  },
  infoText: {
    fontSize: 13,
    fontFamily: font,
    color: "rgb(0,97,98)",
    margin: "0 0 12px 0",
    lineHeight: "20px",
  },
  addressText: {
    fontSize: 14,
    fontFamily: font,
    color: "rgb(0,97,98)",
    lineHeight: "22px",
    margin: 0,
  },
  subscriptionBox: {
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: "12px 16px",
    backgroundColor: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
};

// ── Card logos SVG row ─────────────────────────────────────────────────────────
function CardLogos() {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {/* Amex */}
      <div style={{ width: 36, height: 24, background: "#2671b9", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 7, fontWeight: 900, letterSpacing: -0.5 }}>AMEX</span>
      </div>
      {/* Mastercard */}
      <div style={{ width: 36, height: 24, background: "#252525", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: -4 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#eb001b", marginRight: -4 }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f79e1b", marginLeft: -4 }} />
      </div>
      {/* Visa */}
      <div style={{ width: 36, height: 24, background: "#1a1f71", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 9, fontWeight: 900, letterSpacing: 0.5 }}>VISA</span>
      </div>
      {/* Maestro */}
      <div style={{ width: 36, height: 24, background: "#252525", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" as const, width: 20, height: 14 }}>
          <div style={{ position: "absolute" as const, left: 0, width: 12, height: 12, borderRadius: "50%", background: "#eb001b", top: 1 }} />
          <div style={{ position: "absolute" as const, right: 0, width: 12, height: 12, borderRadius: "50%", background: "#0099df", top: 1, opacity: 0.9 }} />
        </div>
      </div>
    </div>
  );
}

// ── Checkmark icon ─────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <polyline points="1.5,5.5 4,8.5 9.5,2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Add Payment Sidebar ────────────────────────────────────────────────────────
function AddPaymentSidebar({ onClose }: { onClose: () => void }) {
  const [allowAdmins, setAllowAdmins] = useState(true);
  const [useCompanyAddress, setUseCompanyAddress] = useState(true);
  const [subscriptionChecked, setSubscriptionChecked] = useState(true);

  return (
    <>
      {/* Overlay */}
      <div style={s.overlay} onClick={onClose} />

      {/* Sidebar panel */}
      <div style={s.sidebar}>
        {/* Header */}
        <div style={s.sidebarHeader}>
          <h2 style={s.sidebarTitle}>Add Payment Method</h2>
          <button style={s.closeBtn} onClick={onClose}>
            <X size={20} color="#141414" />
          </button>
        </div>

        {/* Body */}
        <div style={s.sidebarBody}>
          {/* Subtitle link */}
          <p style={{ margin: "0 0 4px 0" }}>
            <a style={{ color: "rgb(0,97,98)", fontWeight: 600, fontSize: 14, fontFamily: font, textDecoration: "underline", cursor: "pointer" }}>
              Add a debit or credit card
            </a>
          </p>

          {/* Name on card */}
          <label style={{ ...s.fieldLabel, marginTop: 20 }}>Name on card *</label>
          <input style={s.input} type="text" placeholder="" />

          {/* Card number */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 6 }}>
            <span style={{ ...s.fieldLabel, margin: 0 }}>Card number *</span>
            <CardLogos />
          </div>
          <input style={s.input} type="text" placeholder="1234 5678 9012 3456" />

          {/* Expiration + Security */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end", marginTop: 16 }}>
            <div>
              <label style={s.fieldLabel}>Expiration date *</label>
              <input style={s.input} type="text" placeholder="MM/YY" />
            </div>
            <div>
              <label style={s.fieldLabel}>Security code *</label>
              <input style={s.input} type="text" placeholder="3 digits" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8 }}>
              <CreditCard size={28} color="#888" />
              <span style={{ fontSize: 12, color: "#888", fontFamily: font, lineHeight: "16px" }}>3 digits on back of card</span>
            </div>
          </div>

          {/* Allow all admins */}
          <div style={s.checkRow} onClick={() => setAllowAdmins(!allowAdmins)}>
            <div style={{ ...s.checkbox, backgroundColor: allowAdmins ? "#141414" : "#fff" }}>
              {allowAdmins && <CheckIcon />}
            </div>
            <span style={s.checkLabel}>Allow all admins to use this payment method</span>
          </div>

          {/* Divider */}
          <hr style={s.sectionDivider} />

          {/* Billing address */}
          <div style={s.sectionHeading}>Billing address</div>
          <div style={s.checkRow} onClick={() => setUseCompanyAddress(!useCompanyAddress)}>
            <div style={{ ...s.checkbox, backgroundColor: useCompanyAddress ? "#141414" : "#fff" }}>
              {useCompanyAddress && <CheckIcon />}
            </div>
            <span style={s.checkLabel}>Use my company address</span>
          </div>

          {useCompanyAddress && (
            <div style={{ marginTop: 16 }}>
              <p style={{ ...s.addressText, margin: 0, lineHeight: "24px" }}>
                <span style={{ color: "#141414", fontFamily: font, fontSize: 14 }}>office 2208</span><br />
                <span style={{ color: "rgb(0,97,98)", fontFamily: font, fontSize: 14 }}>The burlington Tower</span><br />
                <span style={{ color: "rgb(0,97,98)", fontFamily: font, fontSize: 14 }}>Business Bay <span style={{ color: "rgb(0,97,98)" }}>DU</span></span><br />
                <span style={{ color: "rgb(0,97,98)", fontFamily: font, fontSize: 14 }}>United Arab Emirates</span>
              </p>
            </div>
          )}

          {/* Divider */}
          <hr style={s.sectionDivider} />

          {/* Manage Subscriptions */}
          <div style={s.sectionHeading}>Manage Subscriptions</div>
          <p style={s.infoText}>
            The subscriptions chosen below will be charged to this payment method on your next billing date.
          </p>

          <div
            style={{ ...s.subscriptionBox, cursor: "pointer" }}
            onClick={() => setSubscriptionChecked(!subscriptionChecked)}
          >
            <div style={{ ...s.checkbox, backgroundColor: subscriptionChecked ? "#141414" : "#fff" }}>
              {subscriptionChecked && <CheckIcon />}
            </div>
            <span style={{ fontSize: 14, fontFamily: font, color: "#141414" }}>Pro Plan</span>
          </div>
        </div>

        {/* Footer */}
        <div style={s.sidebarFooter}>
          <button style={s.btnDark}>Save</button>
          <button style={s.btnLight} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PaymentMethodsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div style={s.page}>
      {/* Header row */}
      <div style={s.topRow}>
        <h1 style={s.pageHeading}>Payment Methods</h1>
        <button style={s.btnDark} 
        onClick={() => setSidebarOpen(true)}
        >
          Add Payment Method
        </button>
      </div>

      {/* Table */}
      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead style={s.thead}>
            <tr>
              <th style={{ ...s.th, width: "25%" }}>Payment Method</th>
              <th style={{ ...s.th, width: "28%" }}>Billing Address</th>
              <th style={{ ...s.th, width: "14%" }}>Expiration Date</th>
              <th style={{ ...s.th, width: "20%" }}>Products</th>
              <th style={{ ...s.th, width: "13%" }}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Payment Method */}
              <td style={s.td}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={s.visaChip}>VISA</span>
                  <div>
                    <div style={{ fontSize: 14, fontFamily: font, color: "#141414" }}>
                      Visa <em style={{ fontStyle: "italic", fontWeight: 400 }}>ending in</em> <strong>5478</strong>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: "#141414" }}>RIZWAN HAIDER</div>
                  </div>
                </div>
              </td>

              {/* Billing Address */}
              <td style={s.td}>
                <span style={{ fontSize: 14, fontFamily: font, color: "#141414", display: "block" }}>office 2208</span>
                <span style={s.addressLink}>The burlington Tower</span>
                <span style={s.addressLink}>Business Bay DU</span>
                <span style={s.addressLink}>United Arab Emirates</span>
              </td>

              {/* Expiration Date */}
              <td style={s.td}>
                <span style={{ fontSize: 14, fontFamily: font, color: "#141414" }}>12 / 2099</span>
              </td>

              {/* Products */}
              <td style={s.td}>
                <span style={s.productLink}>Pro Plan</span>
              </td>

              {/* Actions dropdown */}
              <td style={{ ...s.td, position: "relative" as const }}>
                <button
                  style={s.actionsBtn}
                  onClick={() => setActionsOpen(!actionsOpen)}
                >
                  Actions ▾
                </button>
                {actionsOpen && (
                  <>
                    <div
                      style={{ position: "fixed" as const, inset: 0, zIndex: 9 }}
                      onClick={() => setActionsOpen(false)}
                    />
                    <div style={{
                      position: "absolute" as const, top: "calc(100% - 8px)", right: 0, zIndex: 10,
                      backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: 6,
                      boxShadow: "rgba(20,20,20,0.12) 0px 4px 16px",
                      minWidth: 180, padding: "6px 0",
                    }}>
                      {["Edit payment method", "Delete payment method"].map(opt => (
                        <div
                          key={opt}
                          onClick={() => setActionsOpen(false)}
                          style={{
                            padding: "10px 16px", cursor: "pointer", fontSize: 14,
                            fontFamily: font, color: opt.includes("Delete") ? "#c0392b" : "#141414",
                          }}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sidebar */}
      {sidebarOpen && <AddPaymentSidebar onClose={() => setSidebarOpen(false)} />}
    </div>
  );
}
