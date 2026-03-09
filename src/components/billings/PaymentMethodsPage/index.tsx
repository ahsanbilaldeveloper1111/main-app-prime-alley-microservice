import { useState, useEffect, useCallback } from "react";
import { X, CreditCard, Check } from "lucide-react";
import { GetPaymentMethods, setDefaultPaymentMethod, deletePaymentMethod, addPaymentMethod, GetCompanyDetails } from "@utils/accounting";
import { toast } from "react-toastify";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";

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
    overflow: "visible",
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

function getBillingAddressLines(companyDetails: any): string[] {
  if (!companyDetails) return [];
  const address = companyDetails?.profile?.address;
  const country = companyDetails?.country ?? companyDetails?.profile?.country ?? companyDetails?.billing_address?.country ?? "";
  if (typeof address === "string" && address.trim()) {
    const lines = address.split("\n").filter(Boolean);
    if (country.trim()) lines.push(country.trim());
    return lines;
  }
  const p = companyDetails?.profile ?? companyDetails?.billing_address ?? {};
  const line1 = p?.address_line1 ?? p?.address ?? "";
  const line2 = p?.address_line2 ?? p?.building ?? "";
  const city = p?.city ?? p?.region ?? "";
  const postal = p?.postal_code ?? "";
  const countryFallback = p?.country ?? country;
  const parts = [line1, line2, [city, postal].filter(Boolean).join(" "), countryFallback].filter(Boolean);
  return parts;
}

/** Returns Stripe createToken address fields when using company address */
function getBillingAddressForStripe(companyDetails: any): Record<string, string> {
  if (!companyDetails) return {};
  const p = companyDetails?.profile ?? companyDetails?.billing_address ?? {};
  const addressStr = companyDetails?.profile?.address;
  const country = companyDetails?.country ?? p?.country ?? "";
  let line1 = p?.address_line1 ?? p?.address ?? "";
  let line2 = p?.address_line2 ?? p?.building ?? "";
  const city = p?.city ?? p?.region ?? "";
  const state = p?.state ?? "";
  const postal = p?.postal_code ?? "";
  if (typeof addressStr === "string" && addressStr.trim()) {
    const lines = addressStr.split("\n").filter(Boolean);
    if (lines.length > 0 && !line1) line1 = lines[0];
    if (lines.length > 1 && !line2) line2 = lines[1];
  }
  const out: Record<string, string> = {};
  if (line1) out.address_line1 = line1;
  if (line2) out.address_line2 = line2;
  if (city) out.address_city = city;
  if (state) out.address_state = state;
  if (postal) out.address_zip = postal;
  if (country) out.address_country = country;
  return out;
}

// ── Stripe add-card form (runs inside Elements) ─────────────────────────────────
function AddCardFormSidebar({
  onSuccess,
  onCancel,
  companyDetails,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  companyDetails?: any;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [useCompanyAddress, setUseCompanyAddress] = useState(true);

  const billingAddressLines = companyDetails ? getBillingAddressLines(companyDetails) : [];

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#141414",
        fontFamily: font,
        "::placeholder": { color: "#aab7c4" },
      },
      invalid: { color: "#9e2146" },
    },
  };

  const stripeInputWrapper: React.CSSProperties = {
    backgroundColor: "rgb(255,255,255)",
    border: "1px solid rgb(138,138,138)",
    borderRadius: 4,
    padding: "12px 16px",
    minHeight: 44,
    width: "100%",
    boxSizing: "border-box",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError("Stripe has not loaded yet");
      return;
    }
    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      setError("Please enter your card details.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const tokenData: Record<string, string | undefined> = {
        name: cardholderName || undefined,
        address_country: "US",
      };
      if (useCompanyAddress && companyDetails) {
        const billingAddr = getBillingAddressForStripe(companyDetails);
        Object.assign(tokenData, billingAddr);
      }
      const { error: tokenError, token } = await stripe.createToken(cardNumberElement, tokenData);
      if (tokenError) {
        setError(tokenError.message || "Failed to create card token");
        setIsProcessing(false);
        return;
      }
      if (!token) {
        setError("Failed to create card token");
        setIsProcessing(false);
        return;
      }
      const payload: Record<string, any> = {
        stripeToken: token.id,
        isDefault,
        cardholderName: cardholderName || undefined,
      };
      if (useCompanyAddress && companyDetails) {
        const addr = getBillingAddressForStripe(companyDetails);
        if (Object.keys(addr).length > 0) payload.billingAddress = addr;
      }
      await addPaymentMethod(payload);
      toast.success("Payment method added successfully");
      setIsProcessing(false);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to add payment method");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ margin: "0 0 4px 0" }}>
        <span style={{ color: "rgb(0,97,98)", fontWeight: 600, fontSize: 14, fontFamily: font }}>
          Add a debit or credit card
        </span>
      </p>

      <label style={{ ...s.fieldLabel, marginTop: 20 }}>Name on card *</label>
      <input
        style={s.input}
        type="text"
        placeholder="John Doe"
        value={cardholderName}
        onChange={(e) => setCardholderName(e.target.value)}
        required
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 6 }}>
        <span style={{ ...s.fieldLabel, margin: 0 }}>Card number *</span>
        <CardLogos />
      </div>
      <div style={stripeInputWrapper}>
        <CardNumberElement options={cardElementOptions} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end", marginTop: 16 }}>
        <div>
          <label style={s.fieldLabel}>Expiration date *</label>
          <div style={stripeInputWrapper}>
            <CardExpiryElement options={cardElementOptions} />
          </div>
        </div>
        <div>
          <label style={s.fieldLabel}>Security code *</label>
          <div style={stripeInputWrapper}>
            <CardCvcElement options={cardElementOptions} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8 }}>
          <CreditCard size={28} color="#888" />
          <span style={{ fontSize: 12, color: "#888", fontFamily: font, lineHeight: "16px" }}>
            3 digits on back of card
          </span>
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 13, color: "#c0392b", marginTop: 8, fontFamily: font }}>{error}</div>
      )}
      <p style={{ fontSize: 12, color: "#888", marginTop: 8, fontFamily: font }}>
        Your card information is securely processed by Stripe.
      </p>

      <div style={s.checkRow} onClick={() => setIsDefault(!isDefault)}>
        <div style={{ ...s.checkbox, backgroundColor: isDefault ? "#141414" : "#fff" }}>
          {isDefault && <CheckIcon />}
        </div>
        <span style={s.checkLabel}>Set as default payment method</span>
      </div>

      {companyDetails && (
        <>
          <hr style={s.sectionDivider} />
          <div style={s.sectionHeading}>Billing address</div>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer" }}
            onClick={() => setUseCompanyAddress(!useCompanyAddress)}
          >
            <div style={{
              width: 18, height: 18, border: "2px solid #141414", borderRadius: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: useCompanyAddress ? "#141414" : "#fff", flexShrink: 0,
            }}>
              {useCompanyAddress && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <polyline points="1.5,5.5 4,8.5 9.5,2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 14, fontFamily: font, color: "#141414", cursor: "pointer" }}>
              Use my company address
            </span>
          </div>
          {useCompanyAddress && billingAddressLines.length > 0 && (
            <div style={{ marginTop: 4, lineHeight: "24px" }}>
              {billingAddressLines.map((line, i) => (
                <div key={i} style={{ fontSize: 14, fontFamily: font, color: i === 0 ? "#141414" : "rgb(0, 97, 98)" }}>
                  {line}
                </div>
              ))}
            </div>
          )}
          {useCompanyAddress && billingAddressLines.length === 0 && (
            <div style={{ fontSize: 14, color: "#666", fontFamily: font }}>No billing address on file.</div>
          )}
        </>
      )}

      <div style={{ ...s.sidebarFooter, position: "static" as const, marginTop: 24, padding: 0, border: "none" }}>
        <button type="submit" style={s.btnDark} disabled={!stripe || !cardholderName.trim() || isProcessing}>
          {isProcessing ? "Adding…" : "Save"}
        </button>
        <button type="button" style={s.btnLight} onClick={onCancel} disabled={isProcessing}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Add Payment Sidebar ────────────────────────────────────────────────────────
function AddPaymentSidebar({ onClose }: { onClose: () => void }) {
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const [companyDetails, setCompanyDetails] = useState<any>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
    setStripePublishableKey(key || null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCompany = async () => {
      try {
        const res = await GetCompanyDetails();
        if (!cancelled) setCompanyDetails(res);
      } catch (err) {
        if (!cancelled) setCompanyDetails(null);
      }
    };
    fetchCompany();
    return () => { cancelled = true; };
  }, []);

  const handleSuccess = () => {
    onClose();
  };

  return (
    <>
      <div style={s.overlay} onClick={onClose} />

      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <h2 style={s.sidebarTitle}>Add Payment Method</h2>
          <button style={s.closeBtn} onClick={onClose}>
            <X size={20} color="#141414" />
          </button>
        </div>

        <div style={s.sidebarBody}>
          {stripePublishableKey ? (
            <Elements
              stripe={loadStripe(stripePublishableKey)}
              options={{
                mode: "setup",
                currency: "usd",
                appearance: {
                  variables: { colorPrimary: "#006162" },
                },
              }}
            >
              <AddCardFormSidebar onSuccess={handleSuccess} onCancel={onClose} companyDetails={companyDetails} />
            </Elements>
          ) : (
            <div style={{ color: "#666", fontSize: 14, fontFamily: font }}>
              Loading Stripe…
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Delete confirm overlay ─────────────────────────────────────────────────────
function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div style={s.overlay} onClick={onCancel} />
      <div style={{
        position: "fixed" as const,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: 8,
        boxShadow: "rgba(20,20,20,0.2) 0px 8px 24px",
        padding: 24,
        zIndex: 100001,
        minWidth: 320,
      }}>
        <div style={{ ...s.sidebarTitle, marginBottom: 12 }}>Delete Payment Method</div>
        <p style={{ fontSize: 14, fontFamily: font, color: "#141414", margin: "0 0 20px 0", lineHeight: 1.5 }}>
          Are you sure you want to delete this payment method?
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button style={s.btnLight} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...s.btnDark, backgroundColor: "#c0392b", borderColor: "#c0392b" }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PaymentMethodsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetPaymentMethods() as any;
      const list = Array.isArray(response)
        ? response
        : response?.payment_methods ?? response?.data ?? [];
      setPaymentMethods(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("GetPaymentMethods error:", err);
      setPaymentMethods([]);
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleSetDefault = async (id: string) => {
    setActionsOpenId(null);
    try {
      await setDefaultPaymentMethod(id);
      toast.success("Default payment method updated");
      fetchPaymentMethods();
    } catch (err) {
      toast.error("Failed to set default payment method");
    }
  };

  const handleDeleteClick = (id: string) => {
    setActionsOpenId(null);
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deletePaymentMethod(deleteConfirmId);
      toast.success("Payment method deleted");
      setDeleteConfirmId(null);
      fetchPaymentMethods();
    } catch (err) {
      toast.error("Failed to delete payment method");
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    fetchPaymentMethods();
  };

  const brand = (m: any) => (m?.card?.brand ?? m?.brand ?? "CARD").toString().toUpperCase();
  const last4 = (m: any) => m?.card?.last4 ?? m?.last4 ?? "****";
  const holder = (m: any) => m?.billing_details?.name ?? m?.holder_name ?? "—";
  const expStr = (m: any) => {
    const month = m?.card?.exp_month ?? m?.exp_month;
    const year = m?.card?.exp_year ?? m?.exp_year;
    if (month != null && year != null) return `${String(month).padStart(2, "0")} / ${year}`;
    return "—";
  };
  const isDefault = (m: any) => m?.is_default === true || m?.isDefault === true;

  return (
    <div style={s.page}>
      <div style={s.topRow}>
        <h1 style={s.pageHeading}>Payment Methods</h1>
        <button style={s.btnDark} onClick={() => setSidebarOpen(true)}>
          Add Payment Method
        </button>
      </div>

      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead style={s.thead}>
            <tr>
              <th style={{ ...s.th, width: "25%" }}>Payment Method</th>
              <th style={{ ...s.th, width: "20%" }}>Billing Address</th>
              <th style={{ ...s.th, width: "14%" }}>Expiration Date</th>
              <th style={{ ...s.th, width: "20%" }}>Products</th>
              <th style={{ ...s.th, width: "10%" }}>Default</th>
              <th style={{ ...s.th, width: "13%" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ ...s.td, textAlign: "center", color: "#666" }}>
                  Loading…
                </td>
              </tr>
            ) : paymentMethods.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...s.td, textAlign: "center", color: "#666" }}>
                  No payment methods yet. Add one to get started.
                </td>
              </tr>
            ) : (
              paymentMethods.map((method) => (
                <tr key={method?.id}>
                  <td style={s.td}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={s.visaChip}>{brand(method)}</span>
                      <div>
                        <div style={{ fontSize: 14, fontFamily: font, color: "#141414" }}>
                          {brand(method)} <em style={{ fontStyle: "italic", fontWeight: 400 }}>ending in</em>{" "}
                          <strong>{last4(method)}</strong>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: "#141414" }}>
                          {holder(method)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 14, fontFamily: font, color: "#141414", display: "block" }}>
                      {method?.billing_details?.address?.line1 ?? "—"}
                    </span>
                    <span style={s.addressLink}>
                      {method?.billing_details?.address?.line2 ?? method?.billing_details?.address?.city ?? ""}
                    </span>
                    <span style={s.addressLink}>
                      {method?.billing_details?.address?.postal_code ?? ""}{" "}
                      {method?.billing_details?.address?.country ?? ""}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 14, fontFamily: font, color: "#141414" }}>{expStr(method)}</span>
                  </td>
                  <td style={s.td}>
                    <span style={s.productLink}>Pro Plan</span>
                  </td>
                  <td style={s.td}> <div style={{ display: "flex", alignItems: "center", gap: 4 }}> {isDefault(method) ? <Check size={20} color="#006162" /> : <></>} <span style={{ fontSize: 12, fontFamily: font, color: "#141414" }}>{isDefault(method) ? "Default" : ""}</span></div></td>
                 
                  <td style={{ ...s.td, position: "relative" as const }}>
                    <button
                      style={s.actionsBtn}
                      onClick={() => setActionsOpenId(actionsOpenId === method?.id ? null : method?.id)}
                    >
                      Actions ▾
                    </button>
                    {actionsOpenId === method?.id && (
                      <>
                        <div
                          style={{ position: "fixed" as const, inset: 0, zIndex: 9998 }}
                          onClick={() => setActionsOpenId(null)}
                        />
                        <div style={{
                          position: "absolute" as const,
                          top: "calc(100% - 8px)",
                          right: 0,
                          zIndex: 9999,
                          backgroundColor: "#fff",
                          border: "1px solid #ccc",
                          borderRadius: 6,
                          boxShadow: "rgba(20,20,20,0.12) 0px 4px 16px",
                          minWidth: 180,
                          padding: "6px 0",
                        }}>
                          {!isDefault(method) && (
                            <div
                              onClick={() => handleSetDefault(method.id)}
                              style={{
                                padding: "10px 16px",
                                cursor: "pointer",
                                fontSize: 14,
                                fontFamily: font,
                                color: "#141414",
                              }}
                            >
                              Set as default
                            </div>
                          )}
                          <div
                            onClick={() => handleDeleteClick(method.id)}
                            style={{
                              padding: "10px 16px",
                              cursor: "pointer",
                              fontSize: 14,
                              fontFamily: font,
                              color: "#c0392b",
                            }}
                          >
                            Delete payment method
                          </div>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sidebarOpen && <AddPaymentSidebar onClose={handleCloseSidebar} />}
      {deleteConfirmId && (
        <DeleteConfirmModal
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}
