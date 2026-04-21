import React, { useId } from "react";
import {
  Info, Calendar, ChevronDown, Plus, Pencil,
  MoreHorizontal, Star, Bold, Italic, Underline,
  Link, List, ChevronRight, ExternalLink,
} from "lucide-react";
import SelectBox, { type SelectBoxOption } from "@components/SelectBox";
import type { ProductPricingData } from "@utils/accounts";
import { getCompanyByCrmId, isValidEmail } from "@utils/Helper";
import { isOptionalWorkforcePhoneValid } from "@utils/workforcePhoneValidation";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useCreateInvoiceForm, type InvoiceLineItem } from "@hooks/billing/useCreateInvoiceForm";

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

  sectionCard: {
    border: "1px solid #e8e8e8",
    borderRadius: 10,
    background: "#fcfcfc",
    padding: "14px 14px 12px",
  } as React.CSSProperties,

  addressCard: {
    border: "1px solid #ececec",
    borderRadius: 8,
    background: "#fff",
    padding: "10px 12px",
    marginTop: 8,
    marginBottom: 8,
  } as React.CSSProperties,

  sectionBlock: {
    border: "1px solid #e9e9e9",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: "16px 18px",
    boxShadow: "rgba(20,20,20,0.03) 0px 1px 4px 0px",
  } as React.CSSProperties,

  textareaCard: {
    border: "1px solid #dcdcdc",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    maxWidth: 520,
  } as React.CSSProperties,
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

type DateInputProps = Readonly<{
  value: string;
  onChange: (next: string) => void;
  min?: string;
}>;

function DateInput({ value, onChange, min }: DateInputProps) {
  return (
    <div style={{
      backgroundColor: "rgb(255,255,255)", border: "1px solid rgb(138,138,138)",
      borderRadius: 4, height: 40, width: 190, boxSizing: "border-box" as const,
      display: "flex", alignItems: "center", paddingInline: 12, gap: 8, cursor: "pointer",
    }}>
      <Calendar size={14} color="#555" style={{ flexShrink: 0 }} />
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} min={min} style={{
        border: "none", outline: "none", fontFamily: font, fontSize: 14,
        color: "#141414", flex: 1, background: "transparent", padding: 0,
      }} />
    </div>
  );
}

type AddBoxProps = Readonly<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}>;

function AddBox({ icon, label, onClick }: AddBoxProps) {
  const isDisabled = !onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 6,
        width: 360,
        height: 120,
        boxSizing: "border-box" as const,
        display: "flex",
        alignItems: "center",
        gap: 16,
        paddingInline: 20,
        cursor: isDisabled ? "default" : "pointer",
        backgroundColor: "#fff",
        marginBottom: 4,
        boxShadow: "rgba(20,20,20,0.03) 0px 1px 4px 0px",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 6, backgroundColor: "#f5f5f5",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={t.link}><Plus size={13} /> {label}</span>
    </button>
  );
}

type CheckboxProps = Readonly<{
  id?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}>;

function Checkbox({ id, checked, onChange, disabled }: CheckboxProps) {
  return (
    <button
      id={id}
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 16,
        height: 16,
        borderRadius: 3,
        border: `2px solid ${checked ? "#141414" : "#888"}`,
        backgroundColor: checked ? "#141414" : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        padding: 0,
      }}
    >
      {checked && (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <polyline points="1.5,4.5 3.5,7 7.5,2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

type InfoTipProps = Readonly<{
  text: string;
  size?: number;
}>;

function InfoTip({ text, size = 13 }: InfoTipProps) {
  return (
    <span title={text} aria-label={text} style={{ display: "inline-flex", alignItems: "center" }}>
      <Info size={size} color="#888" />
    </span>
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

function handleProductSelect(
  value: unknown,
  toSingleSelectString: (v: unknown) => string | null,
  customerProducts: ProductPricingData[],
  selectedProductIds: Set<number>,
  addProductToInvoice: (cp: ProductPricingData) => void,
  setProductSelectOpen: (v: boolean | ((prev: boolean) => boolean)) => void,
) {
  const v = toSingleSelectString(value);
  const id = Number(v);
  if (!Number.isFinite(id) || id <= 0) return;
  if (selectedProductIds.has(id)) return;
  const found = customerProducts.find((cp) => Number(cp?.product?.id ?? cp.product_id) === id);
  if (!found) return;
  addProductToInvoice(found);
  setProductSelectOpen(false);
}

// ─────────────────────────────────────────────────────────────────────────────
// Section components (extracted to reduce cognitive complexity)
// ─────────────────────────────────────────────────────────────────────────────

type LineItemsSectionProps = Readonly<{
  currencyCode: string;
  selectedCompanyId: string | null;
  productSelectWrapRefTop: React.RefObject<HTMLDivElement | null>;
  productSelectWrapRef: React.RefObject<HTMLDivElement | null>;
  productSelectOpen: boolean;
  productSelectAnchor: string;
  setProductSelectAnchor: (v: "top" | "empty") => void;
  setProductSelectOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  productSelectDisabled: boolean;
  availableProductOptions: SelectBoxOption[];
  productSelectPlaceholder: string;
  toSingleSelectString: (v: unknown) => string | null;
  customerProducts: ProductPricingData[];
  selectedProductIds: Set<number>;
  addProductToInvoice: (cp: ProductPricingData) => void;
  items: InvoiceLineItem[];
  round2: (n: number) => number;
  lineTax: (it: InvoiceLineItem) => number;
  lineTotal: (it: InvoiceLineItem) => number;
  cloneItem: (id: string) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: object) => void;
  formatVatRate2: (vat: unknown) => string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}>;

function CreateInvoiceLineItemsSection(props: LineItemsSectionProps) {
  const { currencyCode, selectedCompanyId, productSelectWrapRefTop, productSelectWrapRef, productSelectOpen, productSelectAnchor,
    setProductSelectAnchor, setProductSelectOpen, productSelectDisabled, availableProductOptions,
    productSelectPlaceholder, toSingleSelectString, customerProducts, selectedProductIds, addProductToInvoice,
    items, round2, lineTax, lineTotal, removeItem, updateItem, formatVatRate2, subtotal, taxAmount, totalAmount } = props;
  const onProductSelect = (v: unknown) => handleProductSelect(v, toSingleSelectString, customerProducts, selectedProductIds, addProductToInvoice, setProductSelectOpen);
  const companyNotSelected = selectedCompanyId == null;
  const selectFromLibraryDisabled = companyNotSelected || productSelectDisabled;
  const customLineItemDisabled = companyNotSelected;
  return (
    <div style={{ ...t.sectionBlock, padding: "18px 20px" }}>
      <h2 style={{ ...t.secHeading, marginBottom: 14 }}>Line items</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        {selectedCompanyId ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontFamily: font }}>Currency:</span>
            <select disabled style={{
              backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: 4, color: "#141414", fontFamily: font,
              fontSize: 14, height: 36, paddingInline: "10px 28px", appearance: "none" as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", cursor: "pointer", outline: "none",
            }}>
              <option>{currencyCode}</option>
            </select>
          </div>
        ) : (
          <div />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={lineItemBtnStyle}>Edit columns</button>
          <div ref={productSelectWrapRefTop} style={{ position: "relative" as const }}>
            <button
              type="button"
              onClick={() => { setProductSelectAnchor("top"); setProductSelectOpen((v) => !v); }}
              disabled={productSelectDisabled}
              style={{ ...lineItemBtnStyle, display: "inline-flex", alignItems: "center", gap: 6, cursor: productSelectDisabled ? "not-allowed" : "pointer", opacity: productSelectDisabled ? 0.7 : 1 }}
            >
              Add line item <ChevronDown size={13} />
            </button>
            {productSelectOpen && productSelectAnchor === "top" && (
              <div style={{ position: "absolute", top: 38, right: 0, width: 420, zIndex: 80 }}>
                <SelectBox options={availableProductOptions} value={null} isClearable isDisabled={productSelectDisabled}
                  placeholder={productSelectPlaceholder} onChange={onProductSelect} />
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ boxSizing: "border-box" as const, border: "1px solid #e7e7e7", borderRadius: 10, width: "100%",
        position: "relative" as const, overflow: "hidden", backgroundColor: "#fff", padding: "52px 40px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 64, minHeight: 260 }}>
        {items.length === 0 ? (
          <>
            <div style={{ maxWidth: 400 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: font, margin: "0 0 10px 0" }}>Add line items to your invoice</h3>
              <p style={{ fontSize: 14, color: "#555", fontFamily: font, margin: "0 0 14px 0", lineHeight: "21px" }}>Add line items for the products you're selling to your customer.</p>
              <button type="button" style={{ ...t.link, display: "inline-flex", marginBottom: 20, border: "none", background: "transparent", padding: 0 }}>Learn more about the product library <ExternalLink size={12} /></button>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <div ref={productSelectWrapRef} style={{ position: "relative" as const }}>
                  <button
                    type="button"
                    onClick={() => {
                      setProductSelectAnchor("empty");
                      setProductSelectOpen((v) => !v);
                    }}
                    style={{
                      ...lineItemBtnStyle1,
                      cursor: selectFromLibraryDisabled ? "not-allowed" : "pointer",
                      opacity: selectFromLibraryDisabled ? 0.7 : 1,
                    }}
                    disabled={selectFromLibraryDisabled}
                  >
                    Select from product library
                  </button>
                  {productSelectOpen && productSelectAnchor === "empty" && (
                    <div style={{ position: "absolute", top: 48, left: 0, width: 420, zIndex: 60 }}>
                      <SelectBox options={availableProductOptions} value={null} isClearable isDisabled={productSelectDisabled}
                        placeholder={productSelectPlaceholder} onChange={onProductSelect} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={customLineItemDisabled}
                  style={{
                    ...lineItemBtnStyle1,
                    cursor: customLineItemDisabled ? "not-allowed" : "pointer",
                    opacity: customLineItemDisabled ? 0.7 : 1,
                  }}
                >
                  Create custom line item
                </button>
              </div>
            </div>
            <PackageIllustration />
          </>
        ) : (
          <div style={{ width: "100%" }}>
            {items.map((it) => (
              <div key={it.id} style={{ borderBottom: "1px solid #eee", padding: "14px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: font }}>{it.product_name}</div>
                    <div style={{ fontSize: 12, color: "#666", fontFamily: font, marginTop: 4 }}>{it.product_description || "—"}</div>
                    <div style={{ marginTop: 10 }}>
                      <div style={t.label}>Description</div>
                      <input style={{ ...t.inputFixed, width: "100%" }} type="text" value={it.description}
                        onChange={(e) => updateItem(it.id, { description: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {/* <button style={lineItemBtnStyle} onClick={() => cloneItem(it.id)}>Clone</button> */}
                    <button style={{ ...lineItemBtnStyle, borderColor: "rgba(220,53,69,0.45)", color: "#dc3545" }} onClick={() => removeItem(it.id)}>Remove</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12, marginTop: 12 }}>
                  <div><div style={t.label}>Quantity</div>
                    <input style={t.inputFixed} type="number" min={0} value={it.quantity}
                      onChange={(e) => updateItem(it.id, { quantity: Math.max(0, Number(e.target.value) || 0) })} /></div>
                  <div><div style={t.label}>Unit Price</div>
                    <input style={t.inputFixed} type="number" value={it.unit_price}
                      onChange={(e) => updateItem(it.id, { unit_price: Number(e.target.value) || 0 })} /></div>
                  <div><div style={t.label}>Tax (%)</div>
                    <input style={t.inputFixed} type="number" step="0.01" value={it.vat_rate}
                      onChange={(e) => updateItem(it.id, { vat_rate: formatVatRate2(e.target.value) })} /></div>
                  <div><div style={t.label}>Tax Amount</div>
                    <div style={{ fontSize: 14, color: "#141414", fontFamily: font, paddingTop: 9 }}>{currencyCode} {round2(lineTax(it))}</div></div>
                  <div><div style={t.label}>Line Total</div>
                    <div style={{ fontSize: 14, color: "#141414", fontFamily: font, paddingTop: 9 }}>{currencyCode} {round2(lineTotal(it))}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ border: "1px solid #e7e7e7", borderTop: "none", borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
        padding: "20px 24px", backgroundColor: "#fff", marginBottom: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: font, marginBottom: 4 }}>Summary</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px dashed #ddd" }}>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Subtotal</span>
          <span style={{ fontSize: 14, color: "#141414", fontFamily: font }}> {currencyCode} {subtotal}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px dashed #ddd" }}>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Tax Amount</span>
          <span style={{ fontSize: 14, color: "#141414", fontFamily: font }}>{currencyCode} {taxAmount}</span>
        </div>
        <div style={{ padding: "14px 0", borderBottom: "1px dashed #ddd" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button type="button" style={{ ...t.link, border: "none", background: "transparent", padding: 0 }}>+ Add discount, fee, or tax</button><ChevronDown size={13} color="rgb(0,97,98)" />
            <InfoTip text="Add a discount, fee, or additional tax to this invoice." />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: font }}>Total</span>
            <InfoTip text="Total = Subtotal + Tax Amount." />
          </div>
          <span style={{ fontSize: 14, color: "#141414", fontFamily: font }}>{currencyCode} {totalAmount}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#666", fontFamily: font }}>
          Items: <strong style={{ color: "#141414" }}>{items.length}</strong> · Currency: <strong style={{ color: "#141414" }}>{currencyCode}</strong>
        </div>
      </div>
      </div>
  );
}

type PaymentSectionProps = Readonly<{
  acceptOnline: boolean;
  setAcceptOnline: (v: boolean | ((p: boolean) => boolean)) => void;
  collectBilling: boolean;
  setCollectBilling: (v: boolean | ((p: boolean) => boolean)) => void;
  collectShipping: boolean;
  setCollectShipping: (v: boolean | ((p: boolean) => boolean)) => void;
  storePayment: boolean;
  setStorePayment: (v: boolean | ((p: boolean) => boolean)) => void;
  partialPayments: boolean;
  setPartialPayments: (v: boolean | ((p: boolean) => boolean)) => void;
}>;

function CreateInvoicePaymentSection(props: PaymentSectionProps) {
  const { acceptOnline, setAcceptOnline, collectBilling, setCollectBilling, collectShipping, setCollectShipping,
    storePayment, setStorePayment, partialPayments, setPartialPayments } = props;
  const paymentFieldId = useId();
  const collectBillingId = `${paymentFieldId}-collect-billing`;
  const collectShippingId = `${paymentFieldId}-collect-shipping`;
  const storePaymentId = `${paymentFieldId}-store-payment`;
  const partialPaymentsId = `${paymentFieldId}-partial-payments`;
  return (
    <div style={{ ...t.sectionBlock, padding: "18px 20px" }}>
      <h2 style={{ ...t.secHeading, marginBottom: 6 }}>Payment collection</h2>
      <p style={{ ...t.muted, marginBottom: 20 }}>Choose how you want to collect payment for this invoice</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, cursor: "not-allowed", opacity: 0.45 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} />
        <span style={{ fontSize: 16, fontFamily: font, color: "#888", lineHeight: "22px" }}>Charge invoice using a stored payment method</span>
      </div>
      <hr style={{ border: "none", borderTop: "1px solid #e5e5e5", margin: "0 0 14px 0", width: "55%" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, cursor: "pointer" }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #141414", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#141414" }} />
        </div>
        <span style={{ fontSize: 16, fontFamily: font, color: "#141414", lineHeight: "22px" }}>Send invoice to request payment from the customer</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 700, fontFamily: font, color: "#141414" }}>Accept online payments</span>
        <CardLogos />
      </div>
      <p style={{ ...t.muted, fontSize: 14, marginBottom: 18 }}>Include a checkout link on your invoices to collect credit, debit and bank debits from your customers.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
        <button type="button" aria-pressed={acceptOnline} onClick={() => setAcceptOnline(!acceptOnline)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: acceptOnline ? "#141414" : "#f0f0f0",
            border: `1px solid ${acceptOnline ? "#141414" : "#ccc"}`, borderRadius: 4, padding: "8px 14px", cursor: "pointer", transition: "150ms ease-out" }}>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: font, color: acceptOnline ? "#fff" : "#888", letterSpacing: 0.5 }}>{acceptOnline ? "ON" : "OFF"}</span>
          {acceptOnline && (
            <div style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><polyline points="1.5,5.5 4.5,8.5 9.5,2.5" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          )}
        </button>
      </div>
      {acceptOnline && (
        <div style={{ position: "relative" as const, borderRadius: 10, backgroundColor: "rgb(255,255,255)", border: "1px solid #e7e7e7",
          width: "100%", maxWidth: 760, boxSizing: "border-box" as const, padding: "20px 24px", marginBottom: 8 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Accepted forms of payment *</span>
              <InfoTip text="Payment methods your customer can use at checkout." />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Checkbox checked disabled onChange={() => {}} />
              <span style={{ position: "relative" as const, lineHeight: "normal", maxWidth: "100%", fontSize: 16, paddingLeft: 12, fontFamily: font, color: "#aaa" }}>Credit or debit card</span>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Billing address</span>
              <InfoTip text="Ask for billing address during checkout." />
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: 0 }}>
              <Checkbox
                id={collectBillingId}
                checked={collectBilling}
                onChange={() => setCollectBilling((p) => !p)}
              />
              <label
                htmlFor={collectBillingId}
                style={{
                  position: "relative" as const,
                  lineHeight: "normal",
                  fontWeight: 100,
                  maxWidth: "100%",
                  fontSize: 15,
                  paddingLeft: 12,
                  fontFamily: font,
                  color: "#141414",
                  cursor: "pointer",
                  marginBottom: 0,
                }}
              >
                Collect billing address for credit card purchases
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Shipping address</span>
              <InfoTip text="Ask for shipping address during checkout." />
            </div>
            <div style={{ display: "flex", alignItems: "center", opacity: 0.4, padding: 0 }}>
              <Checkbox
                id={collectShippingId}
                checked={collectShipping}
                onChange={() => setCollectShipping((p) => !p)}
              />
              <label
                htmlFor={collectShippingId}
                style={{
                  position: "relative" as const,
                  lineHeight: "normal",
                  maxWidth: "100%",
                  fontSize: 16,
                  paddingLeft: 12,
                  fontFamily: font,
                  color: "#141414",
                  cursor: "pointer",
                  marginBottom: 0,
                }}
              >
                Collect shipping address
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Store payment methods for future charges</span>
              <InfoTip text="Store payment details for future charges." />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 0, padding: 0 }}>
              <Checkbox
                id={storePaymentId}
                checked={storePayment}
                onChange={() => setStorePayment((p) => !p)}
              />
              <label
                htmlFor={storePaymentId}
                style={{
                  position: "relative" as const,
                  lineHeight: "normal",
                  fontWeight: 100,
                  maxWidth: "100%",
                  fontSize: 15,
                  paddingLeft: 12,
                  fontFamily: font,
                  color: "#141414",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  marginBottom: 0,
                }}
              >
                Collect your customer's payment details at checkout for future charges
                <InfoTip text="Your customer's payment details can be reused for future charges." />
              </label>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><span style={{ fontSize: 14, fontWeight: 600, fontFamily: font }}>Partial payments</span></div>
            <div style={{ display: "flex", alignItems: "center", padding: 0 }}>
              <Checkbox
                id={partialPaymentsId}
                checked={partialPayments}
                onChange={() => setPartialPayments((p) => !p)}
              />
              <label
                htmlFor={partialPaymentsId}
                style={{
                  position: "relative" as const,
                  fontWeight: 100,
                  lineHeight: "normal",
                  maxWidth: "100%",
                  fontSize: 15,
                  paddingLeft: 12,
                  fontFamily: font,
                  color: "#141414",
                  cursor: "pointer",
                  marginBottom: 0,
                }}
              >
                Allow your customer to pay an amount less than the balance due
              </label>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}

type CustomerFormTaxFields = Readonly<{
  tax_id: string;
  vat_rate: string;
  vat_exemption: boolean;
}>;

type CustomerModalProps = Readonly<{
  open: boolean;
  section: "billing" | "shipping";
  onClose: () => void;
  customerForm: {
    phone: string;
    email: string;
    address: string;
    postal_code: string;
    city: string;
    country: string;
  } & CustomerFormTaxFields;
  setCustomerForm: React.Dispatch<
    React.SetStateAction<
      {
        phone: string;
        email: string;
        address: string;
        postal_code: string;
        city: string;
        country: string;
      } & CustomerFormTaxFields
    >
  >;
  formatVatRate2: (vat: unknown) => string;
  onSave: () => Promise<void>;
  resolvingCustomer: boolean;
}>;

const CUSTOMER_MODAL_EMAIL_MAX_LEN = 50;
const CUSTOMER_MODAL_POSTAL_MAX_LEN = 50;
const CUSTOMER_MODAL_CITY_MAX_LEN = 100;
const CUSTOMER_MODAL_COUNTRY_MAX_LEN = 100;
const CUSTOMER_MODAL_TAX_ID_MAX_LEN = 64;

function CreateInvoiceCustomerModal(props: CustomerModalProps) {
  const { open, section, onClose, customerForm, setCustomerForm, formatVatRate2, onSave, resolvingCustomer } = props;
  const emailTrimmed = customerForm.email.trim();
  const emailHasContent = emailTrimmed.length > 0;
  const emailInvalid = emailHasContent && !isValidEmail(emailTrimmed);
  const phoneShowInvalid =
    Boolean(customerForm.phone?.toString().trim()) && !isOptionalWorkforcePhoneValid(customerForm.phone);
  const saveDisabled = resolvingCustomer || emailInvalid || phoneShowInvalid;

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      <button type="button" aria-label="Close customer modal" onClick={onClose}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.45)", border: "none", padding: 0, cursor: "pointer" }} />
      <dialog open aria-label="Customer details"
        style={{ width: "min(720px, calc(100% - 32px))", margin: "auto", padding: 0, borderRadius: 10, border: "1px solid #e5e5e5",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)", overflow: "hidden", fontFamily: font }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Customer details {section === "billing" ? "— Billing" : "— Shipping"}</div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "1px solid #ddd", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>Close</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={t.label}>Phone</div>
              <div className="phone-input-wrapper" style={{ width: "100%" }}>
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={
                    customerForm.phone && customerForm.phone.trim() !== ""
                      ? customerForm.phone
                      : undefined
                  }
                  onChange={(value: string | undefined) =>
                    setCustomerForm((p) => ({
                      ...p,
                      phone: value && value.trim() !== "" ? value : "",
                    }))
                  }
                  placeholder="Enter phone number"
                  style={{ width: "100%" }}
                  numberInputProps={{
                    "aria-invalid": phoneShowInvalid,
                    "aria-describedby": phoneShowInvalid ? "create-invoice-customer-phone-error" : undefined,
                    style: {
                      ...t.input360,
                      width: "100%",
                      border: phoneShowInvalid
                        ? "1px solid rgb(200, 60, 60)"
                        : "1px solid rgb(138,138,138)",
                    },
                  }}
                />
              </div>

              {phoneShowInvalid ? (
                <p
                  id="create-invoice-customer-phone-error"
                  role="alert"
                  style={{ ...t.muted, color: "#c03", marginTop: 6, marginBottom: 0 }}
                >
                  Enter a valid phone number for the selected country.
                </p>
              ) : null}
            </div>
            <div>
              <div style={t.label}>Email</div>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                maxLength={CUSTOMER_MODAL_EMAIL_MAX_LEN}
                aria-invalid={emailInvalid}
                aria-describedby={emailInvalid ? "create-invoice-customer-email-error" : undefined}
                style={{
                  ...t.input360,
                  width: "100%",
                  border: emailInvalid ? "1px solid rgb(200, 60, 60)" : "1px solid rgb(138,138,138)",
                }}
                value={customerForm.email}
                onChange={(e) =>
                  setCustomerForm((p) => ({
                    ...p,
                    email: e.target.value.toLowerCase().slice(0, CUSTOMER_MODAL_EMAIL_MAX_LEN),
                  }))
                }
              />
              {emailInvalid ? (
                <p id="create-invoice-customer-email-error" role="alert" style={{ ...t.muted, color: "#c03", marginTop: 6, marginBottom: 0 }}>
                  Enter a valid email address.
                </p>
              ) : null}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={t.label}>Address</div>
              <textarea
                style={{
                  ...t.input360,
                  width: "100%",
                  height: 88,
                  paddingBlock: 10,
                  resize: "vertical",
                  lineHeight: "20px",
                }}
                value={customerForm.address}
                onChange={(e) =>
                  setCustomerForm((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
            <div>
              <div style={t.label}>Postal code</div>
              <input
                style={{ ...t.input360, width: "100%" }}
                maxLength={CUSTOMER_MODAL_POSTAL_MAX_LEN}
                value={customerForm.postal_code}
                onChange={(e) =>
                  setCustomerForm((p) => ({
                    ...p,
                    postal_code: e.target.value.slice(0, CUSTOMER_MODAL_POSTAL_MAX_LEN),
                  }))
                }
              />
            </div>
            <div><div style={t.label}>City</div>
              <input
                style={{ ...t.input360, width: "100%" }}
                maxLength={CUSTOMER_MODAL_CITY_MAX_LEN}
                value={customerForm.city}
                onChange={(e) =>
                  setCustomerForm((p) => ({
                    ...p,
                    city: e.target.value.slice(0, CUSTOMER_MODAL_CITY_MAX_LEN),
                  }))
                }
              /></div>
            <div style={{ gridColumn: "1 / -1" }}><div style={t.label}>Country</div>
              <input
                style={{ ...t.input360, width: "100%" }}
                maxLength={CUSTOMER_MODAL_COUNTRY_MAX_LEN}
                value={customerForm.country}
                onChange={(e) =>
                  setCustomerForm((p) => ({
                    ...p,
                    country: e.target.value.slice(0, CUSTOMER_MODAL_COUNTRY_MAX_LEN),
                  }))
                }
              /></div>

            <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
              <div
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: 8,
                  padding: 12,
                  background: "#fafafa",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#141414" }}>
                  Tax information
                </div>
                <p style={{ ...t.muted, marginTop: 0, marginBottom: 12, fontSize: 12 }}>
                  Stored on the customer profile and used for new line items and tax display.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <div>
                    <div style={t.label}>VAT number</div>
                    <input
                      type="text"
                      autoComplete="off"
                      maxLength={CUSTOMER_MODAL_TAX_ID_MAX_LEN}
                      style={{ ...t.input360, width: "100%" }}
                      value={customerForm.tax_id}
                      onChange={(e) =>
                        setCustomerForm((p) => ({
                          ...p,
                          tax_id: e.target.value.slice(0, CUSTOMER_MODAL_TAX_ID_MAX_LEN),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <div style={t.label}>VAT rate (%)</div>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      style={{ ...t.input360, width: "100%" }}
                      value={customerForm.vat_rate}
                      onChange={(e) =>
                        setCustomerForm((p) => ({
                          ...p,
                          vat_rate: formatVatRate2(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 14,
                        color: "#141414",
                        userSelect: "none" as const,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={customerForm.vat_exemption}
                        onChange={(e) =>
                          setCustomerForm((p) => ({ ...p, vat_exemption: e.target.checked }))
                        }
                      />{" "}
                      VAT exempt (no VAT charged for this customer)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, padding: "8px 14px", cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={() => onSave().then(() => undefined)} disabled={saveDisabled}
            style={{ background: "#006162", color: "#fff", border: "1px solid #006162", borderRadius: 6, padding: "8px 14px",
              cursor: saveDisabled ? "not-allowed" : "pointer", opacity: saveDisabled ? 0.7 : 1, fontWeight: 700 }}>Save</button>
        </div>
      </dialog>
    </div>
  );
}

type AdvancedSettingsProps = Readonly<{
  open: boolean;
  onToggle: () => void;
}>;

function CreateInvoiceAdvancedSettings(props: AdvancedSettingsProps) {
  const { open, onToggle } = props;
  return (
    <>
      <button type="button" aria-expanded={open} onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" as const, border: "none", background: "transparent", padding: 0 }}>
        <ChevronRight size={18} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 200ms", color: "#141414" }} />
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: font, color: "#141414" }}>Advanced settings</span>
      </button>
      {open && (
        <div style={{ paddingLeft: 28, marginTop: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "292px 292px", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><span style={{ fontSize: 14, fontWeight: 600, fontFamily: font, color: "#141414" }}>Language *</span></div>
              <p style={{ ...t.muted, marginBottom: 8 }}>The language used for module titles and labels</p>
              <select style={{ ...t.select, width: 280, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}>
                <option>English</option><option>French</option><option>German</option><option>Spanish</option>
              </select>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><span style={{ fontSize: 14, fontWeight: 600, fontFamily: font, color: "#141414" }}>Locale *</span></div>
              <p style={{ ...t.muted, marginBottom: 8 }}>Format dates and addresses by locale</p>
              <select style={{ ...t.select, width: 280, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}>
                <option>United Kingdom</option><option>United States</option><option>European Union</option><option>Australia</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
type CreateInvoicePageProps = {
  editInvoiceId?: string;
};

type CreateInvoiceFormState = ReturnType<typeof useCreateInvoiceForm>;

function CreateInvoicePageView({ form }: Readonly<{ form: CreateInvoiceFormState }>) {
  const {
    companyOptions,
    loadingCompanies,
    companySelectOpen,
    setCompanySelectOpen,
    companySelectWrapRef,
    selectedCompanyId,
    selectedCompanyName,
    customerData,
    resolvingCustomer,
    currencyCode,
    customerModalOpen,
    setCustomerModalOpen,
    customerModalSection,
    customerForm,
    setCustomerForm,
    customerProducts,
    productSelectOpen,
    setProductSelectOpen,
    productSelectAnchor,
    setProductSelectAnchor,
    productSelectWrapRef,
    productSelectWrapRefTop,
    invoiceDate,
    setInvoiceDate,
    dueDate,
    endDate,
    setEndDate,
    paymentMode,
    setPaymentMode,
    poNumber,
    setPoNumber,
    notes,
    setNotes,
    termsConditions,
    setTermsConditions,
    items,
    isEditMode,
    toSingleSelectString,
    formatCustomerAddress,
    openCustomerModal,
    saveCustomerModal,
    round2,
    lineTax,
    lineTotal,
    subtotal,
    taxAmount,
    totalAmount,
    availableProductOptions,
    selectedProductIds,
    productSelectDisabled,
    productSelectPlaceholder,
    formatVatRate2,
    onCompanyChange,
    addProductToInvoice,
    cloneItem,
    removeItem,
    updateItem,
    handleDueDateChange,
    acceptOnline,
    setAcceptOnline,
    collectBilling,
    setCollectBilling,
    collectShipping,
    setCollectShipping,
    storePayment,
    setStorePayment,
    partialPayments,
    setPartialPayments,
    advancedOpen,
    setAdvancedOpen,
    submitting,
    loadingEditInvoice,
    handleCreateInvoice,
    router,
  } = form;

  const isCreateDisabled =
    submitting ||
    resolvingCustomer ||
    loadingEditInvoice ||
    (!isEditMode && !selectedCompanyId);

  return (
    <div style={{
      flex: 1,
      backgroundColor: "#fff",
      margin: "0",
      borderRadius: 8,
      border: "none",
      boxShadow: "rgba(20,20,20,0.06) 0px 1px 8px 0px",
      padding: "0",
      boxSizing: "border-box" as const,
    }}>

    <div style={{ fontFamily: font, color: "#141414", backgroundColor: "#f5f5f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Top nav bar ── */}
      <div style={{
        height: 48, backgroundColor: "#2d2d2d", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 16px", flexShrink: 0,
        position: "sticky" as const, top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["Exit", "Save"].map(lbl => (
            <button
              key={lbl}
              type="button"
              onClick={() => {
                if (lbl !== "Exit") return;
                router.push("/billing/invoices").catch(() => undefined);
              }}
              style={{ background: "none", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 4, color: "#fff", fontFamily: font, fontSize: 13, fontWeight: 400, padding: "5px 14px", cursor: "pointer" }}
            >
              {lbl}
            </button>
          ))}
          <span style={{ color: "#ff8c69", fontSize: 13, fontFamily: font, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
            Unsaved changes
          </span>
        </div>
        <span style={{ position: "absolute" as const, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 15, fontWeight: 400, fontFamily: font }}>
          {isEditMode ? "Edit invoice" : "Create invoice"}
        </span>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => handleCreateInvoice().then(() => undefined)}
            disabled={isCreateDisabled}
            style={{
              background: "#fff",
              border: "none",
              borderRadius: 4,
              color: "#141414",
              fontFamily: font,
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 20px",
              cursor: isCreateDisabled ? "not-allowed" : "pointer",
              opacity: isCreateDisabled ? 0.7 : 1,
            }}
          >
            {isEditMode ? "Save" : "Create"}
          </button>
          <span style={{ position: "absolute" as const, top: -6, right: -6, backgroundColor: "#e53935", border: "2px solid #2d2d2d", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {items.length}
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
        {[
          { key: "more", icon: <MoreHorizontal size={16} /> },
          { key: "star", icon: <Star size={16} /> },
        ].map((item, i, arr) => (
          <button
            key={item.key}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none",
              cursor: "pointer",
              color: "#666",
            }}
          >
            {item.icon}
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
              <div style={t.label}>
                Billing Contact <InfoTip text="Billing contact details shown on the invoice." />
              </div>
              <AddBox
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="9" r="3" /><path d="M6 20c0-3 2.7-5 6-5s6 2 6 5" /><line x1="16" y1="5" x2="20" y2="5" /><line x1="16" y1="8" x2="20" y2="8" /></svg>}
                label="Add contact"
              />
            </div>

            <div style={{ marginBottom: 22, ...t.sectionCard }}>
              <div style={t.label}>Company *</div>
              {isEditMode ? (
                <div style={{
                  border: "1px solid rgb(204,204,204)", borderRadius: 6, width: 360, minHeight: 48,
                  boxSizing: "border-box" as const, display: "flex", alignItems: "center", paddingInline: 16,
                  backgroundColor: "#f5f5f5", color: "#141414", fontFamily: font, fontSize: 14,
                }}>
                  {getCompanyByCrmId(selectedCompanyId, companyOptions.map((o) => ({ id: o.value, name: o.label }))) ||
                  customerData?.name ||
                  selectedCompanyName ||
                  "—"}
                </div>
                
              ) : (
                <div ref={companySelectWrapRef} style={{ position: "relative" as const }}>
                <AddBox
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><rect x="3" y="7" width="18" height="14" rx="1.5" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>}
                  label={selectedCompanyId ? selectedCompanyName : "Add company"}
                  onClick={() => setCompanySelectOpen((v) => !v)}
                />
                {companySelectOpen && (
                  <div style={{ position: "absolute", top: 126, left: 0, width: 360, zIndex: 60 }}>
                    <SelectBox
                      options={companyOptions}
                      value={selectedCompanyId}
                      onChange={onCompanyChange}
                      placeholder={loadingCompanies ? "Loading companies..." : "Select company"}
                      isClearable={true}
                      isDisabled={loadingCompanies || resolvingCustomer}
                    />
                  </div>
                )}
                </div>
              )}
            </div>

            {selectedCompanyId ? (
              <>
                <div style={{ marginBottom: 18, ...t.sectionCard }}>
                  <div style={t.label}>
                    Billing address <InfoTip text="Billing address printed on the invoice." />
                  </div>
                  <div style={t.addressCard}>
                    <p style={{ ...t.muted, whiteSpace: "pre-line" }}>
                      {formatCustomerAddress(customerData)}
                    </p>
                  </div>
                  <button
                    type="button"
                    style={{ ...t.linkSm, border: "none", background: "transparent", padding: 0 }}
                    onClick={() => openCustomerModal("billing")}
                    disabled={resolvingCustomer}
                  >
                    <Pencil size={12} /> Edit address
                  </button>
                </div>

                <div style={t.sectionCard}>
                  <div style={t.label}>Shipping address</div>
                  <div style={t.addressCard}>
                    <p style={{ ...t.muted, whiteSpace: "pre-line" }}>
                      {formatCustomerAddress(customerData)}
                    </p>
                  </div>
                  <button
                    type="button"
                    style={{ ...t.linkSm, border: "none", background: "transparent", padding: 0 }}
                    onClick={() => openCustomerModal("shipping")}
                    disabled={resolvingCustomer}
                  >
                    <Pencil size={12} /> Edit address
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {/* Right — invoice meta */}
          <div style={{ paddingTop: 48 }}>
            <div style={t.sectionBlock}>
            <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" as const }}>
              <div>
                <div style={t.label}>
                  Invoice date * <InfoTip size={12} text="Date the invoice is issued." />
                </div>
                <DateInput value={invoiceDate} onChange={setInvoiceDate} />
              </div>
              <div>
                <div style={t.label}>Payment terms *</div>
                <select style={t.select} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as "one_time" | "recurring" | "subscription")}>
                  <option value="one_time">One time</option>
                  <option value="recurring">Recurring</option>
                  <option value="subscription">Subscription</option>
                </select>
              </div>
              <div>
                <div style={t.label}>
                  Due date * <InfoTip size={12} text="Date payment is due." />
                </div>
                <DateInput
                  value={dueDate}
                  min={invoiceDate}
                  onChange={handleDueDateChange}
                />
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={t.label}>
                Next invoice number <InfoTip size={12} text="Auto-generated invoice number." />
              </div>
              <input style={{ ...t.inputFixed, backgroundColor: "#f5f5f5" }} type="text" defaultValue="INV-1005" readOnly />
            </div>

            <div>
              <div style={t.label}>PO number</div>
              <input style={t.input360} type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={t.label}>End date</div>
              <DateInput value={endDate || ""} onChange={setEndDate} />
            </div>
            </div>
          </div>
        </div>

        <hr style={t.divider} />
        {selectedCompanyId ? (
          <>
        <CreateInvoiceLineItemsSection
          currencyCode={currencyCode}
          selectedCompanyId={selectedCompanyId}
          productSelectWrapRefTop={productSelectWrapRefTop}
          productSelectWrapRef={productSelectWrapRef}
          productSelectOpen={productSelectOpen}
          productSelectAnchor={productSelectAnchor}
          setProductSelectAnchor={setProductSelectAnchor}
          setProductSelectOpen={setProductSelectOpen}
          productSelectDisabled={productSelectDisabled}
          availableProductOptions={availableProductOptions}
          productSelectPlaceholder={productSelectPlaceholder}
          toSingleSelectString={toSingleSelectString}
          customerProducts={customerProducts}
          selectedProductIds={selectedProductIds}
          addProductToInvoice={addProductToInvoice}
          items={items}
          round2={round2}
          lineTax={lineTax}
          lineTotal={lineTotal}
          cloneItem={cloneItem}
          removeItem={removeItem}
          updateItem={updateItem}
          formatVatRate2={formatVatRate2}
          subtotal={subtotal}
          taxAmount={taxAmount}
          totalAmount={totalAmount}
        />

        <hr style={t.divider} />
        
        {/* ── COMMENTS ── */}
        <div style={{ ...t.sectionBlock, marginBottom: 18 }}>
        <h2 style={{ ...t.secHeading, marginBottom: 12 }}>Comments</h2>
        <div style={t.textareaCard}>
          <textarea
            placeholder="Enter any extra notes that you would like to appear in this invoice."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%", border: "none", outline: "none", fontFamily: font,
              fontSize: 13, color: "#888", padding: "12px 14px", resize: "none" as const,
              minHeight: 80, boxSizing: "border-box" as const, backgroundColor: "transparent", lineHeight: "20px",
            }}
          />
          <div style={{ borderTop: "1px solid #e5e5e5", padding: "7px 12px", display: "flex", alignItems: "center", gap: 4 }}>
            {([
              { key: "bold", icon: <Bold size={14} /> },
              { key: "italic", icon: <Italic size={14} /> },
              { key: "underline", icon: <Underline size={14} /> },
            ] as Array<{ key: string; icon: React.ReactNode }>).map((item) => (
              <button key={item.key} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "3px 5px", display: "flex", alignItems: "center", borderRadius: 3 }}>
                {item.icon}
              </button>
            ))}
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontFamily: font, fontSize: 13, padding: "3px 5px", fontStyle: "italic", textDecoration: "underline", borderRadius: 3 }}>I</button>
            <span style={{ color: "#ddd", margin: "0 4px" }}>|</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontFamily: font, fontSize: 12, padding: "3px 6px", display: "inline-flex", alignItems: "center", gap: 2, borderRadius: 3 }}>
              More <ChevronDown size={11} />
            </button>
            <span style={{ color: "#ddd", margin: "0 4px" }}>|</span>
            {([
              { key: "link", icon: <Link size={14} /> },
              { key: "list", icon: <List size={14} /> },
            ] as Array<{ key: string; icon: React.ReactNode }>).map((item) => (
              <button key={item.key} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "3px 5px", display: "flex", alignItems: "center", borderRadius: 3 }}>
                {item.icon}
              </button>
            ))}
          </div>
        </div>
        </div>

        <div style={{ ...t.sectionBlock, marginTop: 22 }}>
          <h2 style={{ ...t.secHeading, marginBottom: 12 }}>Terms &amp; Conditions</h2>
          <div style={t.textareaCard}>
            <textarea
              placeholder="Enter terms & conditions"
              value={termsConditions}
              onChange={(e) => setTermsConditions(e.target.value)}
              style={{
                width: "100%", border: "none", outline: "none", fontFamily: font,
                fontSize: 13, color: "#888", padding: "12px 14px", resize: "none" as const,
                minHeight: 80, boxSizing: "border-box" as const, backgroundColor: "transparent", lineHeight: "20px",
              }}
            />
          </div>
        </div>

        
            <hr style={t.divider} />

            {/* ── PAYMENT COLLECTION ── */}
            <CreateInvoicePaymentSection
              acceptOnline={acceptOnline}
              setAcceptOnline={setAcceptOnline}
              collectBilling={collectBilling}
              setCollectBilling={setCollectBilling}
              collectShipping={collectShipping}
              setCollectShipping={setCollectShipping}
              storePayment={storePayment}
              setStorePayment={setStorePayment}
              partialPayments={partialPayments}
              setPartialPayments={setPartialPayments}
            />

            <hr style={t.divider} />

            {/* ── ADVANCED SETTINGS ── */}
            <CreateInvoiceAdvancedSettings
              open={advancedOpen}
              onToggle={() => setAdvancedOpen(!advancedOpen)}
            />
          </>
        ) : (
          <div
            role="status"
            aria-live="polite"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid rgb(204,204,204)",
              borderRadius: 8,
              backgroundColor: "#fff",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: font,
              boxShadow: "rgba(20,20,20,0.04) 0px 1px 4px 0px",
            }}
          >
            <Info size={18} color="rgb(0,97,98)" style={{ flexShrink: 0 }} aria-hidden />
            <p style={{ ...t.muted, fontSize: 14, color: "#555", margin: 0, lineHeight: "21px" }}>
              Choose a company first to continue.
            </p>
          </div>
        )}

        <CreateInvoiceCustomerModal
          open={customerModalOpen}
          section={customerModalSection}
          onClose={() => setCustomerModalOpen(false)}
          customerForm={customerForm}
          setCustomerForm={setCustomerForm}
          formatVatRate2={formatVatRate2}
          onSave={saveCustomerModal}
          resolvingCustomer={resolvingCustomer}
        />
      </div>
    </div>
  </div>
  );
}

export function CreateInvoicePageContent(props: Readonly<CreateInvoicePageProps>) {
  const form = useCreateInvoiceForm({ editInvoiceId: props.editInvoiceId });
  return <CreateInvoicePageView form={form} />;
}

export default function CreateInvoicePage() {
  return <CreateInvoicePageContent />;
}
