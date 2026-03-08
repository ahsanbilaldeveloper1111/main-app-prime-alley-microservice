import { useState } from "react";
import {
  Info, Calendar, ChevronDown, Plus, Pencil,
  MoreHorizontal, Star, Bold, Italic, Underline,
  Link, List, ChevronRight, ExternalLink,
} from "lucide-react";

const font = "Lexend Deca, Helvetica, Arial, sans-serif";

// ─────────────────────────────────────────────────────────────────────────────
// Shared style tokens
// ─────────────────────────────────────────────────────────────────────────────
const t = {
  label: {
    fontSize: 14, fontWeight: 600, fontFamily: font, color: "#141414",
    marginBottom: 6, display: "flex" as const, alignItems: "center" as const,
    gap: 5, lineHeight: "18px",
  } as React.CSSProperties,

  inputFixed: {
    backgroundColor: "rgb(255,255,255)", border: "1px solid rgb(138,138,138)",
    borderRadius: 4, color: "rgb(20,20,20)", display: "block", fontFamily: font,
    fontSize: 16, fontWeight: 400, height: 40, lineHeight: "24px", letterSpacing: 0,
    paddingInline: 16, paddingBlock: 8, width: 190,
    boxSizing: "border-box" as const, outline: "none",
  } as React.CSSProperties,

  input360: {
    backgroundColor: "rgb(255,255,255)", border: "1px solid rgb(138,138,138)",
    borderRadius: 4, color: "rgb(20,20,20)", display: "block", fontFamily: font,
    fontSize: 16, fontWeight: 400, height: 40, lineHeight: "24px", letterSpacing: 0,
    paddingInline: 16, paddingBlock: 8, width: 360,
    boxSizing: "border-box" as const, outline: "none",
  } as React.CSSProperties,

  select: {
    backgroundColor: "rgb(255,255,255)", border: "1px solid rgb(138,138,138)",
    borderRadius: 4, color: "rgb(20,20,20)", fontFamily: font, fontSize: 16,
    height: 40, paddingInline: 16, paddingRight: 36, paddingBlock: 8, width: 190,
    boxSizing: "border-box" as const, outline: "none", appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
    cursor: "pointer", lineHeight: "24px",
  } as React.CSSProperties,

  link: {
    fontWeight: 600, color: "rgb(0,97,98)", cursor: "pointer",
    textUnderlineOffset: "24%", textDecoration: "underline", fontFamily: font,
    fontSize: 14, display: "inline-flex" as const, alignItems: "center" as const, gap: 4,
  } as React.CSSProperties,

  linkSm: {
    fontWeight: 600, color: "rgb(0,97,98)", cursor: "pointer",
    textUnderlineOffset: "24%", textDecoration: "underline", fontFamily: font,
    fontSize: 13, display: "inline-flex" as const, alignItems: "center" as const, gap: 4,
  } as React.CSSProperties,

  divider: {
    border: "none", borderTop: "1px solid #e5e5e5", margin: "32px 0",
  } as React.CSSProperties,

  secHeading: {
    fontSize: 18, fontWeight: 700, fontFamily: font, color: "#141414", margin: "0 0 20px 0",
  } as React.CSSProperties,

  muted: {
    fontSize: 13, color: "#666", fontFamily: font, margin: 0, lineHeight: "19px",
  } as React.CSSProperties,
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function DateInput({ value }: { value: string }) {
  return (
    <div style={{
      backgroundColor: "rgb(255,255,255)", border: "1px solid rgb(138,138,138)",
      borderRadius: 4, height: 40, width: 190, boxSizing: "border-box" as const,
      display: "flex", alignItems: "center", paddingInline: 12, gap: 8, cursor: "pointer",
    }}>
      <Calendar size={14} color="#555" style={{ flexShrink: 0 }} />
      <input type="text" defaultValue={value} style={{
        border: "none", outline: "none", fontFamily: font, fontSize: 14,
        color: "#141414", flex: 1, background: "transparent", padding: 0,
      }} />
    </div>
  );
}

function AddBox({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      border: "1px solid rgb(204,204,204)", borderRadius: 6, width: 360, height: 120,
      boxSizing: "border-box" as const, display: "flex", alignItems: "center", gap: 16,
      paddingInline: 20, cursor: "pointer", backgroundColor: "#fff", marginBottom: 4,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 6, backgroundColor: "#f5f5f5",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={t.link}><Plus size={13} /> {label}</span>
    </div>
  );
}

function Checkbox({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div onClick={disabled ? undefined : onChange} style={{
      width: 16, height: 16, borderRadius: 3,
      border: `2px solid ${checked ? "#141414" : "#888"}`,
      backgroundColor: checked ? "#141414" : "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
    }}>
      {checked && (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <polyline points="1.5,4.5 3.5,7 7.5,2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function CardLogos() {
  return (
    <div style={{ display: "inline-flex", gap: 4, alignItems: "center", verticalAlign: "middle", marginLeft: 8 }}>
      <div style={{ width: 32, height: 22, background: "#1a1f71", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 7, fontWeight: 900 }}>VISA</span>
      </div>
      <div style={{ width: 32, height: 22, background: "#252525", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#eb001b", marginRight: -3 }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#f79e1b", marginLeft: -3 }} />
      </div>
      <div style={{ width: 32, height: 22, background: "#2671b9", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 6, fontWeight: 900 }}>AMEX</span>
      </div>
      <div style={{ width: 32, height: 22, background: "#0070ba", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 6, fontWeight: 900 }}>PAY</span>
      </div>
    </div>
  );
}

function PackageIllustration() {
  return (
    <svg width="150" height="130" viewBox="0 0 150 130" fill="none">
      {/* Invoice paper */}
      <rect x="58" y="2" width="82" height="76" rx="5" fill="#fff" stroke="#d5d5d5" strokeWidth="1.5" />
      <rect x="68" y="14" width="54" height="6" rx="3" fill="#e2e2e2" />
      <path d="M68 28 Q100 22 130 28" stroke="#ccc" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="68" y="36" width="42" height="4" rx="2" fill="#eaeaea" />
      <rect x="68" y="44" width="50" height="4" rx="2" fill="#eaeaea" />
      <rect x="68" y="52" width="36" height="4" rx="2" fill="#eaeaea" />
      {/* Box */}
      <rect x="4" y="60" width="82" height="60" rx="4" fill="#f5b942" />
      <rect x="4" y="60" width="82" height="22" rx="4" fill="#e9a82e" />
      {/* Tape vertical */}
      <rect x="40" y="60" width="14" height="60" fill="#dfa020" />
      <rect x="40" y="60" width="14" height="22" fill="#d49018" />
      {/* Tape horizontal */}
      <rect x="4" y="68" width="82" height="10" fill="#a8d8ea" opacity="0.82" />
      {/* Shadow */}
      <ellipse cx="45" cy="122" rx="38" ry="6" fill="rgba(0,0,0,0.07)" />
    </svg>
  );
}

// Line items button style (as per spec)
const lineItemBtnStyle: React.CSSProperties = {
  cursor: "pointer",
  transition: "150ms ease-out",
  display: "inline-block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  backgroundColor: "rgb(255,255,255)",
  borderColor: "rgb(138,138,138)",
  color: "rgb(20,20,20)",
  textDecoration: "none",
  borderRadius: 4,
  borderWidth: 1,
  borderStyle: "solid",
  verticalAlign: "middle",
  paddingBlock: 10,
  paddingInline: 24,
  maxWidth: "100%",
  fontFamily: font,
  fontSize: 12,
  fontWeight: 100,
  letterSpacing: 0,
  lineHeight: "18px",
  textUnderlineOffset: "24%",
};

const lineItemBtnStyle1: React.CSSProperties = {
    cursor: "pointer",
    transition: "150ms ease-out",
    display: "inline-block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    backgroundColor: "rgb(255,255,255)",
    borderColor: "rgb(138,138,138)",
    color: "rgb(20,20,20)",
    textDecoration: "none",
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: 10,
    paddingInline: 24,
    maxWidth: "100%",
    fontFamily: font,
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: 0,
    lineHeight: "18px",
    textUnderlineOffset: "24%",
  };

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CreateInvoicePage() {
  const [acceptOnline, setAcceptOnline] = useState(true);
  const [collectBilling, setCollectBilling] = useState(false);
  const [collectShipping, setCollectShipping] = useState(false);
  const [storePayment, setStorePayment] = useState(false);
  const [partialPayments, setPartialPayments] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div style={{ fontFamily: font, color: "#141414", backgroundColor: "#f5f5f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Top nav bar ── */}
      <div style={{
        height: 48, backgroundColor: "#2d2d2d", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 16px", flexShrink: 0,
        position: "sticky" as const, top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["Exit", "Save"].map(lbl => (
            <button key={lbl} style={{ background: "none", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 4, color: "#fff", fontFamily: font, fontSize: 13, fontWeight: 400, padding: "5px 14px", cursor: "pointer" }}>
              {lbl}
            </button>
          ))}
          <span style={{ color: "#ff8c69", fontSize: 13, fontFamily: font, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
            Unsaved changes
          </span>
        </div>
        <span style={{ position: "absolute" as const, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 15, fontWeight: 400, fontFamily: font }}>
          Create invoice
        </span>
        <div style={{ position: "relative" }}>
          <button style={{ background: "#fff", border: "none", borderRadius: 4, color: "#141414", fontFamily: font, fontSize: 13, fontWeight: 600, padding: "6px 20px", cursor: "pointer" }}>
            Create
          </button>
          <span style={{ position: "absolute" as const, top: -6, right: -6, backgroundColor: "#e53935", border: "2px solid #2d2d2d", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            2
          </span>
        </div>
      </div>

      {/* ── Preset bar ── */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
        <span style={{ fontSize: 13, fontFamily: font, color: "#444" }}>
          Preset: <strong style={{ color: "#141414" }}>Default preset</strong>
        </span>
        <button style={{ background: "none", border: "1px solid #ccc", borderRadius: 4, color: "#666", fontFamily: font, fontSize: 12, padding: "4px 12px", cursor: "pointer" }}>
          Preview
        </button>
      </div>

      {/* ── Right floating icons ── */}
      <div style={{ position: "fixed" as const, right: 0, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column" as const, backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: "8px 0 0 8px", overflow: "hidden", zIndex: 20 }}>
        {[<MoreHorizontal size={16} />, <Star size={16} />].map((icon, i, arr) => (
          <button key={i} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none", cursor: "pointer", color: "#666" }}>
            {icon}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          SINGLE WHITE PAGE — no individual cards
      ════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        backgroundColor: "#fff",
        margin: "16px 56px 24px 24px",
        borderRadius: 8,
        border: "1px solid rgb(204,204,204)",
        boxShadow: "rgba(20,20,20,0.06) 0px 1px 8px 0px",
        padding: "36px 48px",
        boxSizing: "border-box" as const,
      }}>

        {/* ── BILL TO ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

          {/* Left */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: font, margin: "0 0 24px 0" }}>Bill to</h2>

            <div style={{ marginBottom: 22 }}>
              <div style={t.label}>Billing Contact <Info size={13} color="#888" /></div>
              <AddBox
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="9" r="3" /><path d="M6 20c0-3 2.7-5 6-5s6 2 6 5" /><line x1="16" y1="5" x2="20" y2="5" /><line x1="16" y1="8" x2="20" y2="8" /></svg>}
                label="Add contact"
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={t.label}>Company</div>
              <AddBox
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><rect x="3" y="7" width="18" height="14" rx="1.5" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>}
                label="Add company"
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={t.label}>Billing address <Info size={13} color="#888" /></div>
              <p style={t.muted}>No billing address</p>
              <a style={t.linkSm}><Pencil size={12} /> Edit address</a>
            </div>

            <div>
              <div style={t.label}>Shipping address</div>
              <p style={t.muted}>No shipping address</p>
              <a style={t.linkSm}><Pencil size={12} /> Edit address</a>
            </div>
          </div>

          {/* Right — invoice meta */}
          <div style={{ paddingTop: 48 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" as const }}>
              <div>
                <div style={t.label}>Invoice date * <Info size={12} color="#888" /></div>
                <DateInput value="08/03/2026" />
              </div>
              <div>
                <div style={t.label}>Payment terms *</div>
                <select style={t.select} defaultValue="receipt">
                  <option value="receipt">Due on receipt</option>
                  <option value="net15">Net 15</option>
                  <option value="net30">Net 30</option>
                </select>
              </div>
              <div>
                <div style={t.label}>Due date * <Info size={12} color="#888" /></div>
                <DateInput value="08/03/2026" />
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={t.label}>Next invoice number <Info size={12} color="#888" /></div>
              <input style={{ ...t.inputFixed, backgroundColor: "#f5f5f5" }} type="text" defaultValue="INV-1005" readOnly />
            </div>

            <div>
              <div style={t.label}>PO number</div>
              <input style={t.input360} type="text" defaultValue="" />
            </div>
          </div>
        </div>

        <hr style={t.divider} />

        {/* ── LINE ITEMS ── */}
        <h2 style={t.secHeading}>Line items</h2>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontFamily: font }}>Currency:</span>
            <select style={{
              backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: 4,
              color: "#141414", fontFamily: font, fontSize: 14, height: 36,
              paddingInline: "10px 28px", appearance: "none" as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
              cursor: "pointer", outline: "none",
            }}>
              <option>United Arab Emirates Dir…</option>
              <option>US Dollar (USD)</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={lineItemBtnStyle}>Edit columns</button>
            <button style={{ ...lineItemBtnStyle, display: "inline-flex", alignItems: "center", gap: 6 }}>
              Add line item <ChevronDown size={13} />
            </button>
          </div>
        </div>

        {/* Line items container */}
        <div style={{
          boxSizing: "border-box" as const,
          border: "1px solid rgb(204,204,204)",
          borderRadius: 8,
          width: "100%",
          position: "relative" as const,
          overflow: "hidden",
          backgroundColor: "#fff",
          padding: "52px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          minHeight: 260,
        }}>
          <div style={{ maxWidth: 400 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: font, margin: "0 0 10px 0" }}>
              Add line items to your invoice
            </h3>
            <p style={{ fontSize: 14, color: "#555", fontFamily: font, margin: "0 0 14px 0", lineHeight: "21px" }}>
              Add line items for the products you're selling to your customer.
            </p>
            <a style={{ ...t.link, display: "inline-flex", marginBottom: 20 }}>
              Learn more about the product library <ExternalLink size={12} />
            </a>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button style={lineItemBtnStyle1}>Select from product library</button>
              <button style={lineItemBtnStyle1}>Create custom line item</button>
            </div>
          </div>
          <PackageIllustration />
        </div>

        {/* ── Summary (attached below line items, no gap) ── */}
        <div style={{
          border: "1px solid rgb(204,204,204)",
          borderTop: "none",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          padding: "20px 24px",
          backgroundColor: "#fff",
          marginBottom: 0,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: font, marginBottom: 4 }}>Summary</div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px dashed #ddd" }}>
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Subtotal</span>
            <span style={{ fontSize: 14, color: "#aaa", fontFamily: font }}>--</span>
          </div>

          <div style={{ padding: "14px 0", borderBottom: "1px dashed #ddd" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <a style={t.link}>+ Add discount, fee, or tax</a>
              <ChevronDown size={13} color="rgb(0,97,98)" />
              <Info size={13} color="#888" />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: font }}>Total</span>
              <Info size={13} color="#888" />
            </div>
            <span style={{ fontSize: 14, color: "#aaa", fontFamily: font }}>--</span>
          </div>
        </div>

        <hr style={t.divider} />

        {/* ── COMMENTS ── */}
        <h2 style={t.secHeading}>Comments</h2>
        <div style={{ border: "1px solid rgb(138,138,138)", borderRadius: 4, backgroundColor: "#fff", overflow: "hidden", maxWidth: 460 }}>
          <textarea
            placeholder="Enter any extra notes that you would like to appear in this invoice."
            style={{
              width: "100%", border: "none", outline: "none", fontFamily: font,
              fontSize: 13, color: "#888", padding: "12px 14px", resize: "none" as const,
              minHeight: 80, boxSizing: "border-box" as const, backgroundColor: "transparent", lineHeight: "20px",
            }}
          />
          <div style={{ borderTop: "1px solid #e5e5e5", padding: "7px 12px", display: "flex", alignItems: "center", gap: 4 }}>
            {([<Bold size={14} />, <Italic size={14} />, <Underline size={14} />] as React.ReactNode[]).map((icon, i) => (
              <button key={i} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "3px 5px", display: "flex", alignItems: "center", borderRadius: 3 }}>
                {icon}
              </button>
            ))}
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontFamily: font, fontSize: 13, padding: "3px 5px", fontStyle: "italic", textDecoration: "underline", borderRadius: 3 }}>I</button>
            <span style={{ color: "#ddd", margin: "0 4px" }}>|</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontFamily: font, fontSize: 12, padding: "3px 6px", display: "inline-flex", alignItems: "center", gap: 2, borderRadius: 3 }}>
              More <ChevronDown size={11} />
            </button>
            <span style={{ color: "#ddd", margin: "0 4px" }}>|</span>
            {([<Link size={14} />, <List size={14} />] as React.ReactNode[]).map((icon, i) => (
              <button key={i} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "3px 5px", display: "flex", alignItems: "center", borderRadius: 3 }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        <hr style={t.divider} />

        {/* ── PAYMENT COLLECTION ── */}
        <h2 style={{ ...t.secHeading, marginBottom: 6 }}>Payment collection</h2>
        <p style={{ ...t.muted, marginBottom: 20 }}>Choose how you want to collect payment for this invoice</p>

        {/* Radio 1: Stored — greyed out with divider below */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, cursor: "not-allowed", opacity: 0.45 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} />
          <span style={{ fontSize: 16, fontFamily: font, color: "#888", lineHeight: "22px" }}>
            Charge invoice using a stored payment method
          </span>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid #e5e5e5", margin: "0 0 14px 0", width: "55%" }} />

        {/* Radio 2: Send — selected */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, cursor: "pointer" }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #141414", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#141414" }} />
          </div>
          <span style={{ fontSize: 16, fontFamily: font, color: "#141414", lineHeight: "22px" }}>
            Send invoice to request payment from the customer
          </span>
        </div>

        {/* Accept online payments header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: font, color: "#141414" }}>Accept online payments</span>
          <CardLogos />
        </div>
        <p style={{ ...t.muted, fontSize: 14, marginBottom: 18 }}>
          Include a checkout link on your invoices to collect credit, debit and bank debits from your customers.
        </p>

        {/* ON toggle button — styled as the design: black box with ON label + checkmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
          <div
            onClick={() => setAcceptOnline(!acceptOnline)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              backgroundColor: acceptOnline ? "#141414" : "#f0f0f0",
              border: `1px solid ${acceptOnline ? "#141414" : "#ccc"}`,
              borderRadius: 4, padding: "8px 14px",
              cursor: "pointer", transition: "150ms ease-out",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: font, color: acceptOnline ? "#fff" : "#888", letterSpacing: 0.5 }}>
              {acceptOnline ? "ON" : "OFF"}
            </span>
            {acceptOnline && (
              <div style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <polyline points="1.5,5.5 4.5,8.5 9.5,2.5" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Online payment options container */}
        {acceptOnline && (
          <div style={{
            position: "relative" as const,
            borderRadius: 8,
            backgroundColor: "rgb(255,255,255)",
            border: "1px solid rgb(204,204,204)",
            width: 600,
            boxSizing: "border-box" as const,
            padding: "20px 24px",
            marginBottom: 8,
          }}>

            {/* Accepted forms of payment */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Accepted forms of payment *</span>
                <Info size={13} color="#888" />
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Checkbox checked={true} onChange={() => {}} disabled />
                <span style={{ position: "relative" as const, lineHeight: "normal", maxWidth: "100%", fontSize: 16, paddingLeft: 12, fontFamily: font, color: "#aaa" }}>
                  Credit or debit card
                </span>
              </div>
            </div>

            {/* Billing address */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Billing address</span>
                <Info size={13} color="#888" />
              </div>
              <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => setCollectBilling(!collectBilling)}>
                <Checkbox checked={collectBilling} onChange={() => setCollectBilling(!collectBilling)} />
                <span style={{ position: "relative" as const, lineHeight: "normal", fontWeight: 100, maxWidth: "100%", fontSize: 15, paddingLeft: 12, fontFamily: font, color: "#141414" }}>
                  Collect billing address for credit card purchases
                </span>
              </div>
            </div>

            {/* Shipping address */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Shipping address</span>
                <Info size={13} color="#888" />
              </div>
              <div style={{ display: "flex", alignItems: "center", cursor: "pointer", opacity: 0.4 }} onClick={() => setCollectShipping(!collectShipping)}>
                <Checkbox checked={collectShipping} onChange={() => setCollectShipping(!collectShipping)} />
                <span style={{ position: "relative" as const, lineHeight: "normal", maxWidth: "100%", fontSize: 16, paddingLeft: 12, fontFamily: font, color: "#141414" }}>
                  Collect shipping address
                </span>
              </div>
            </div>

            {/* Store payment methods */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Store payment methods for future charges</span>
                <Info size={13} color="#888" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0, cursor: "pointer" }} onClick={() => setStorePayment(!storePayment)}>
                <Checkbox checked={storePayment} onChange={() => setStorePayment(!storePayment)} />
                <span style={{ position: "relative" as const, lineHeight: "normal", fontWeight: 100, maxWidth: "100%", fontSize: 15, paddingLeft: 12, fontFamily: font, color: "#141414", display: "flex", alignItems: "center", gap: 8 }}>
                  Collect your customer's payment details at checkout for future charges
                  <Info size={13} color="#888" />
                </span>
              </div>
            </div>

            {/* Partial payments */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Partial payments</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => setPartialPayments(!partialPayments)}>
                <Checkbox checked={partialPayments} onChange={() => setPartialPayments(!partialPayments)} />
                <span style={{ position: "relative" as const, fontWeight: 100, lineHeight: "normal", maxWidth: "100%", fontSize: 15, paddingLeft: 12, fontFamily: font, color: "#141414" }}>
                  Allow your customer to pay an amount less than the balance due
                </span>
              </div>
            </div>

          </div>
        )}

        <hr style={t.divider} />

        {/* ── ADVANCED SETTINGS ── */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" as const }}
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          <ChevronRight
            size={18}
            style={{ transform: advancedOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 200ms", color: "#141414" }}
          />
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: font, color: "#141414" }}>Advanced settings</span>
        </div>

        {advancedOpen && (
          <div style={{ paddingLeft: 28, marginTop: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "292px 292px", gap: 20 }}>
              {/* Language */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font, color: "#141414" }}>Language *</span>
                </div>
                <p style={{ ...t.muted, marginBottom: 8 }}>The language used for module titles and labels</p>
                <select style={{
                  ...t.select, width: 280,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                }}>
                  <option>English</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Spanish</option>
                </select>
              </div>

              {/* Locale */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font, color: "#141414" }}>Locale *</span>
                </div>
                <p style={{ ...t.muted, marginBottom: 8 }}>Format dates and addresses by locale</p>
                <select style={{
                  ...t.select, width: 280,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                }}>
                  <option>United Kingdom</option>
                  <option>United States</option>
                  <option>European Union</option>
                  <option>Australia</option>
                </select>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
