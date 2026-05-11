import { useState, useEffect } from "react";
import { X, CreditCard, Check } from "lucide-react";
import { addPaymentMethod, GetCompanyDetails } from "@utils/accounting";
import { toast } from "react-toastify";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { paymentMethodsFont as font, paymentMethodsStyles as s } from "./paymentMethodsStyles";
import { getBillingAddressLines, getBillingAddressForStripe } from "./paymentMethodsStripeHelpers";
import type { PaymentMethodsPageViewModel } from "./usePaymentMethodsPage";

const { PERMISSIONS } = HEADER_CONSTANTS;

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

// ── Stripe add-card form (runs inside Elements) ─────────────────────────────────
function AddCardFormSidebar({
  onSuccess,
  onCancel,
  companyDetails,
  canMarkDefault,
}: Readonly<{
  onSuccess: () => void;
  onCancel: () => void;
  companyDetails?: any;
  canMarkDefault: boolean;
}>) {
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
        isDefault: canMarkDefault ? isDefault : false,
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

      <label htmlFor="cardholderName" style={{ ...s.fieldLabel, marginTop: 20 }}>Name on card *</label>
      <input
        id="cardholderName"
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
          <label htmlFor="cardExpiry" style={s.fieldLabel}>Expiration date *</label>
          <div style={stripeInputWrapper}>
            <CardExpiryElement id="cardExpiry" options={cardElementOptions} />
          </div>
        </div>
        <div>
          <label htmlFor="cardCvc" style={s.fieldLabel}>Security code *</label>
          <div style={stripeInputWrapper}>
            <CardCvcElement id="cardCvc" options={cardElementOptions} />
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

      {canMarkDefault && (
      <label style={{ ...s.checkRow, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          style={{
            position: "absolute",
            opacity: 0,
            width: 1,
            height: 1,
            margin: 0,
            pointerEvents: "none",
          }}
        />
        <span
          aria-hidden="true"
          style={{ ...s.checkbox, backgroundColor: isDefault ? "#141414" : "#fff" }}
        >
          {isDefault && <CheckIcon />}
        </span>
        <span style={s.checkLabel}>Set as default payment method</span>
      </label>
      )}

      {companyDetails && (
        <>
          <hr style={s.sectionDivider} />
          <div style={s.sectionHeading}>Billing address</div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={useCompanyAddress}
              onChange={(e) => setUseCompanyAddress(e.target.checked)}
              style={{
                position: "absolute",
                opacity: 0,
                width: 1,
                height: 1,
                margin: 0,
                pointerEvents: "none",
              }}
            />
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                border: "2px solid #141414",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: useCompanyAddress ? "#141414" : "#fff",
                flexShrink: 0,
              }}
            >
              {useCompanyAddress && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <polyline points="1.5,5.5 4,8.5 9.5,2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span style={{ fontSize: 14, fontFamily: font, color: "#141414" }}>
              Use my company address
            </span>
          </label>
          {useCompanyAddress && billingAddressLines.length > 0 && (
            <div style={{ marginTop: 4, lineHeight: "24px" }}>
              {billingAddressLines.map((line) => (
                <div
                  key={line.key}
                  style={{ fontSize: 14, fontFamily: font, color: line.tone === "primary" ? "#141414" : "rgb(0, 97, 98)" }}
                >
                  {line.text}
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
function AddPaymentSidebar({ onClose }: Readonly<{ onClose: () => void }>) {
  const { hasPermission } = usePermissions();
  const canMarkDefault = hasPermission(PERMISSIONS.MARK_PAYMENT_METHOD_DEFAULT_BILLING);
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
        console.error("AddPaymentSidebar fetchCompany error:", err);
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
      <button
        type="button"
        aria-label="Close add payment sidebar"
        onClick={onClose}
        style={{ ...s.overlay, border: "none", padding: 0 }}
      />

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
              <AddCardFormSidebar
                onSuccess={handleSuccess}
                onCancel={onClose}
                companyDetails={companyDetails}
                canMarkDefault={canMarkDefault}
              />
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
}: Readonly<{
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
    <>
      <button
        type="button"
        aria-label="Close delete confirmation"
        onClick={onCancel}
        style={{ ...s.overlay, border: "none", padding: 0 }}
      />
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

export type PaymentMethodsPageViewProps = Readonly<PaymentMethodsPageViewModel>;

export function PaymentMethodsPageView({
  canAddPaymentMethod,
  canMarkDefaultPaymentMethod,
  canDeletePaymentMethod,
  sidebarOpen,
  setSidebarOpen,
  actionsOpenId,
  setActionsOpenId,
  paymentMethods,
  loading,
  deleteConfirmId,
  setDeleteConfirmId,
  handleSetDefault,
  handleDeleteClick,
  handleConfirmDelete,
  handleCloseSidebar,
}: PaymentMethodsPageViewProps) {

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

  let tableRows: React.ReactNode;
  if (loading) {
    tableRows = (
      <tr>
        <td colSpan={5} style={{ ...s.td, textAlign: "center", color: "#666" }}>
          Loading…
        </td>
      </tr>
    );
  } else if (paymentMethods.length === 0) {
    tableRows = (
      <tr>
        <td colSpan={5} style={{ ...s.td, textAlign: "center", color: "#666" }}>
          No payment methods yet. Add one to get started.
        </td>
      </tr>
    );
  } else {
    tableRows = paymentMethods.map((method) => (
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
          {(canMarkDefaultPaymentMethod || canDeletePaymentMethod) && (
            <>
          <button
            style={s.actionsBtn}
            onClick={() => setActionsOpenId(actionsOpenId === method?.id ? null : method?.id)}
          >
            Actions ▾
          </button>
          {actionsOpenId === method?.id && (
            <>
              <button
                type="button"
                aria-label="Close actions menu"
                onClick={() => setActionsOpenId(null)}
                style={{
                  position: "fixed" as const,
                  inset: 0,
                  zIndex: 9998,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                }}
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
                {canMarkDefaultPaymentMethod && !isDefault(method) && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(method.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: 14,
                      fontFamily: font,
                      color: "#141414",
                    }}
                  >
                    Set as default
                  </button>
                )}
                {canDeletePaymentMethod && (
                <button
                  type="button"
                  onClick={() => handleDeleteClick(method.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: font,
                    color: "#c0392b",
                  }}
                >
                  Delete payment method
                </button>
                )}
              </div>
            </>
          )}
          </>
          )}
        </td>
      </tr>
    ));
  }

  return (
    <div style={s.page}>
      <div style={s.topRow}>
        <h1 style={s.pageHeading}>Payment Methods</h1>
        {canAddPaymentMethod && (
          <button style={s.btnDark} onClick={() => setSidebarOpen(true)}>
            Add Payment Method
          </button>
        )}
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
            {tableRows}
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
