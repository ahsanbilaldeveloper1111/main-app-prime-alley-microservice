import { useCallback, useMemo, useRef, useState } from "react";
import { Search, FileText, Landmark, FileMinus, ChevronDown } from "lucide-react";
import { Form } from "react-bootstrap";
import { downloadInvoicePdf, getInvoice } from "@utils/accounts";
import type { InvoiceData } from "@utils/accounts";
import { formatNumber, GlobalDateTimeFormat } from "@utils/Helper";
import moment from "moment";
import { useSession } from "next-auth/react";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import InvoiceViewModal, { type InvoiceViewData } from "@components/billings/InvoiceViewModal";
import { BILLING_FONT, BILLING_LINK } from "@components/billings/shared/styles";
import { LinkButton } from "@components/shared/LinkButton";
import { useInvoicePaymentModal } from "@components/billings/InvoicePaymentModal";
import { toast } from "react-toastify";
import { getErrorMessage } from "@utils/errors";
import { useEnsureCustomerForCrmCompany } from "@hooks/billing/useEnsureCustomerForCrmCompany";
import { useMinifiedCompaniesSendAll } from "@hooks/billing/useMinifiedCompaniesSendAll";
import { useQueryClient } from "@tanstack/react-query";
import { accountBillingKeys } from "@query/keys";
import { useAccountBillingInvoiceHistoryQuery } from "@page-modules/billing/account-billing/useAccountBillingInvoiceHistoryQuery";
import { getPaymentMethodLabel } from "../TransactionPage/transactionPageHelpers";

const font = BILLING_FONT;
const { PERMISSIONS } = HEADER_CONSTANTS;

const toInvoiceViewData = (invoice: InvoiceData): InvoiceViewData => ({
  ...(invoice as unknown as InvoiceViewData),
  company: {
    ...(invoice.company as unknown as NonNullable<InvoiceViewData["company"]>),
    crm_company_id: invoice.company?.crm_company_id ?? undefined,
  },
});

const toggleStringSelection = (list: readonly string[], value: string): string[] => {
  if (!list.includes(value)) return [...list, value];
  const next: string[] = [];
  for (const item of list) {
    if (item !== value) next.push(item);
  }
  return next;
};

/** Human-readable labels for filter options; API/filter state keeps snake_case values. */
function formatBillingHistoryFilterLabel(option: string): string {
  if (option === "All Statuses" || option === "All Payments") return option;
  if (option.includes("_")) {
    return option
      .split("_")
      .map((part) =>
        part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join(" ");
  }
  return option.charAt(0).toUpperCase() + option.slice(1).toLowerCase();
}

function CardActions({
  onView,
  onDownload,
  onPayNow,
}: Readonly<{ onView?: () => void; onDownload?: () => void; onPayNow?: () => void }>) {
  const actions: Array<{ key: string; label: string; onClick: () => void }> = [];
  if (onPayNow) actions.push({ key: "pay-now", label: "Pay Now", onClick: onPayNow });
  if (onView) actions.push({ key: "view", label: "View", onClick: onView });
  if (onDownload) actions.push({ key: "download", label: "Download", onClick: onDownload });

  return (
    <div style={s.cardActions}>
      {actions.map((a, idx) => (
        <span key={a.key} style={{ display: "inline-flex", alignItems: "center" }}>
          <LinkButton onClick={a.onClick} style={s.actionLink}>
            {a.label}
          </LinkButton>
          {idx < actions.length - 1 && <span style={s.divider}>|</span>}
        </span>
      ))}
    </div>
  );
}

function CardProductWithIncludes({ product }: Readonly<{ product: string }>) {
  return (
    <div style={s.colValue}>
      {product}{" "}
      <LinkButton onClick={() => null} style={s.link}>
        includes
      </LinkButton>
    </div>
  );
}

function CardAmountFooter({
  label,
  amount,
}: Readonly<{ label: string; amount: string }>) {
  return (
    <>
      <hr style={s.hr} />
      <div style={s.balanceRow}>
        <span style={s.balanceLabel}>{label}</span>
        <span style={s.balanceAmount}>{amount}</span>
      </div>
    </>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: font,
    color: "#141414",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    padding: "0 0 40px 0",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 24px",
    backgroundColor: "#f5f5f5",
    flexWrap: "wrap" as const,
  },
  searchWrapper: {
    position: "relative" as const,
    flexShrink: 0,
  },
  searchInput: {
    backgroundColor: "rgb(255, 255, 255)",
    border: "1px solid rgb(138, 138, 138)",
    borderRadius: 4,
    color: "rgb(20, 20, 20)",
    display: "block",
    fontFamily: font,
    fontSize: 16,
    fontWeight: 400,
    height: 40,
    lineHeight: "24px",
    letterSpacing: 0,
    paddingInline: 16,
    paddingLeft: 42,
    width: 530,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  searchIcon: {
    position: "absolute" as const,
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#666",
    pointerEvents: "none" as const,
  },
  filterBtn: {
    cursor: "pointer",
    transition: "150ms ease-out",
    display: "inline-flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    backgroundColor: "transparent",
    color: "rgb(20, 20, 20)",
    textDecoration: "none",
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#ccc",
    verticalAlign: "middle",
    paddingBlock: 10,
    paddingInline: 12,
    fontFamily: font,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0,
    lineHeight: "18px",
    textUnderlineOffset: "24%",
    alignItems: "center",
    gap: 6,
    height: 40,
  },
  content: {
    padding: "8px 24px",
    maxWidth: "100%",
    margin: "0 auto",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "56px 24px",
    textAlign: "center" as const,
    backgroundColor: "#fff",
    border: "1px solid rgb(204, 204, 204)",
    borderRadius: 8,
    marginTop: 8,
  },
  emptyStateTitle: {
    fontFamily: font,
    fontSize: 18,
    fontWeight: 600,
    color: "#141414",
    margin: "0 0 8px 0",
  },
  emptyStateHint: {
    fontFamily: font,
    fontSize: 14,
    fontWeight: 400,
    color: "#666",
    margin: 0,
    maxWidth: 420,
    lineHeight: 1.5,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: font,
    color: "#141414",
    margin: "20px 0 12px 0",
  },
  card: {
    position: "relative" as const,
    borderRadius: 8,
    backgroundColor: "rgb(255, 255, 255)",
    border: "1px solid rgb(204, 204, 204)",
    marginBottom: 16,
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid #f0f0f0",
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontStyle: "unset",
    fontWeight: 500,
    textTransform: "unset" as const,
    fontFamily: font,
    letterSpacing: 0,
    lineHeight: "27px",
    margin: 0,
    color: "#141414",
  },
  cardActions: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    fontSize: 14,
    fontWeight: 600,
  },
  actionLink: {
    ...BILLING_LINK,
  },
  divider: {
    color: "#ccc",
    margin: "0 8px",
    fontWeight: 300,
  },
  cardBody: {
    padding: "16px 24px",
  },
  colLabel: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: font,
    color: "#141414",
    marginBottom: 6,
  },
  colValue: {
    fontSize: 14,
    fontWeight: 400,
    fontFamily: font,
    color: "#141414",
  },
  colGrid: {
    display: "grid",
    gap: 24,
    marginBottom: 16,
  },
  hr: {
    border: "none",
    borderTop: "1px solid #e5e5e5",
    margin: "0 0 14px 0",
  },
  balanceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0",
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: font,
    color: "#141414",
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: font,
    color: "#141414",
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
  visaChip: {
    background: "#1a1f71",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 3,
    letterSpacing: 0.5,
    display: "inline-block",
    marginRight: 6,
  },
};

// ── Dropdown filter component ──────────────────────────────────────────────────
function FilterDropdown({
  label,
  options,
}: Readonly<{ label: string; options: readonly string[] }>) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggleOption = (opt: string) => {
    setSelected((prev) => toggleStringSelection(prev, opt));
  };

  return (
    <div style={{ position: "relative" as const }}>
      <button
        style={{
          ...s.filterBtn,
          backgroundColor: selected.length > 0 ? "#f0fafa" : "#fff",
          borderColor: selected.length > 0 ? "rgb(0,97,98)" : "#ccc",
          color: selected.length > 0 ? "rgb(0,97,98)" : "#141414",
        }}
        onClick={() => setOpen(!open)}
      >
        {label}
        {selected.length > 0 && (
          <span style={{
            background: "rgb(0,97,98)", color: "#fff", borderRadius: "50%",
            fontSize: 10, fontWeight: 700, width: 16, height: 16,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            {selected.length}
          </span>
        )}
        <ChevronDown size={13} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close filter dropdown"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed" as const,
              inset: 0,
              zIndex: 9,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "default",
            }}
          />
          <div style={{
            position: "absolute" as const, top: "calc(100% + 4px)", left: 0, zIndex: 10,
            backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: 6,
            boxShadow: "rgba(20,20,20,0.12) 0px 4px 16px",
            minWidth: 180, padding: "6px 0",
          }}>
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  handleToggleOption(opt);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  padding: "8px 16px",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  fontSize: 14,
                  fontFamily: font,
                  display: "flex", alignItems: "center", gap: 10,
                  backgroundColor: selected.includes(opt) ? "#f0fafa" : "transparent",
                  color: selected.includes(opt) ? "rgb(0,97,98)" : "#141414",
                }}
              >
                <span style={{
                  width: 14, height: 14, border: `2px solid ${selected.includes(opt) ? "rgb(0,97,98)" : "#ccc"}`,
                  borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: selected.includes(opt) ? "rgb(0,97,98)" : "transparent",
                  flexShrink: 0,
                }}>
                  {selected.includes(opt) && (
                    <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" stroke="#fff" strokeWidth="1.5" fill="none" /></svg>
                  )}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function computeDateRange(option: string): { dateFrom: string; dateTo: string } | null {
  const today = moment();
  const dateTo = today.format("YYYY-MM-DD");

  if (option === "Last 30 days") {
    return { dateFrom: today.clone().subtract(30, "days").format("YYYY-MM-DD"), dateTo };
  }
  if (option === "Last 3 months") {
    return { dateFrom: today.clone().subtract(3, "months").format("YYYY-MM-DD"), dateTo };
  }
  if (option === "Last 6 months") {
    return { dateFrom: today.clone().subtract(6, "months").format("YYYY-MM-DD"), dateTo };
  }
  if (option === "Last 12 months") {
    return { dateFrom: today.clone().subtract(12, "months").format("YYYY-MM-DD"), dateTo };
  }

  return null;
}

function DateRangeDropdown({
  label,
  options,
  selectedOption,
  dateFrom,
  dateTo,
  onChangeOption,
  onChangeDateFrom,
  onChangeDateTo,
  onClear,
}: Readonly<{
  label: string;
  options: readonly string[];
  selectedOption: string;
  dateFrom: string;
  dateTo: string;
  onChangeOption: (value: string) => void;
  onChangeDateFrom: (value: string) => void;
  onChangeDateTo: (value: string) => void;
  onClear: () => void;
}>) {
  const [open, setOpen] = useState(false);

  const isCustom = selectedOption === "Custom range";
  const hasValue = selectedOption !== "" || (dateFrom !== "" && dateTo !== "");

  return (
    <div style={{ position: "relative" as const }}>
      <button
        type="button"
        style={{
          ...s.filterBtn,
          backgroundColor: hasValue ? "#f0fafa" : "#fff",
          borderColor: hasValue ? "rgb(0,97,98)" : "#ccc",
          color: hasValue ? "rgb(0,97,98)" : "#141414",
        }}
        onClick={() => setOpen(!open)}
      >
        {label}
        {hasValue && (
          <span
            style={{
              ...s.badge,
              background: "rgb(0,97,98)",
              color: "#fff",
            }}
          >
            1
          </span>
        )}
        <ChevronDown size={13} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close filter dropdown"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed" as const,
              inset: 0,
              zIndex: 9,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "default",
            }}
          />

          <div
            style={{
              position: "absolute" as const,
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 10,
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: 6,
              boxShadow: "rgba(20,20,20,0.12) 0px 4px 16px",
              minWidth: 240,
              padding: 8,
            }}
          >
            {hasValue && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "rgb(0,97,98)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: font,
                    fontSize: 12,
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            <div style={{ padding: "6px 0" }}>
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChangeOption(opt);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: font,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 6,
                    backgroundColor: selectedOption === opt ? "#f0fafa" : "transparent",
                    color: selectedOption === opt ? "rgb(0,97,98)" : "#141414",
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: `2px solid ${selectedOption === opt ? "rgb(0,97,98)" : "#ccc"}`,
                      borderRadius: 50,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selectedOption === opt ? "rgb(0,97,98)" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  {opt}
                </button>
              ))}
            </div>

            {isCustom && (
              <div style={{ paddingTop: 8, borderTop: "1px solid #eee" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <DateRangeInputField
                    label="From"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={onChangeDateFrom}
                  />
                  <DateRangeInputField
                    label="To"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={onChangeDateTo}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DateRangeInputField({
  label,
  value,
  min,
  max,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}>) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "#666",
          fontFamily: font,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #ccc",
          fontFamily: font,
          fontSize: 13,
        }}
      />
    </div>
  );
}

function StatusDropdown({
  label,
  options,
  value,
  onChange,
  inactiveValues = ["", "All Statuses"],
}: Readonly<{
  label: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  inactiveValues?: readonly string[];
}>) {
  const [open, setOpen] = useState(false);
  const hasValue = value !== "" && !inactiveValues.includes(value);

  return (
    <div style={{ position: "relative" as const }}>
      <button
        type="button"
        style={{
          ...s.filterBtn,
          backgroundColor: hasValue ? "#f0fafa" : "#fff",
          borderColor: hasValue ? "rgb(0,97,98)" : "#ccc",
          color: hasValue ? "rgb(0,97,98)" : "#141414",
          textTransform: "capitalize",
        }}
        onClick={() => setOpen(!open)}
      >
        {label}
        {hasValue && (
          <span
            style={{
              ...s.badge,
              background: "rgb(0,97,98)",
              color: "#fff",
            }}
          >
            1
          </span>
        )}
        <ChevronDown size={13} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close filter dropdown"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed" as const,
              inset: 0,
              zIndex: 9,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "default",
            }}
          />
          <div
            style={{
              position: "absolute" as const,
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 10,
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: 6,
              boxShadow: "rgba(20,20,20,0.12) 0px 4px 16px",
              minWidth: 200,
              padding: 8,
            }}
          >
            {options.map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: font,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 6,
                    backgroundColor: isSelected ? "#f0fafa" : "transparent",
                    color: isSelected ? "rgb(0,97,98)" : "#141414",
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: `2px solid ${isSelected ? "rgb(0,97,98)" : "#ccc"}`,
                      borderRadius: 50,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected ? "rgb(0,97,98)" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  {formatBillingHistoryFilterLabel(opt)}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Card: Invoice issued ───────────────────────────────────────────────────────
function InvoiceCard({
  invoiceNumber,
  product,
  amount,
  balance,
  status,
  onView,
  onDownload,
  onPayNow,
}: Readonly<{
  invoiceNumber: string;
  product: string;
  amount: string;
  balance: string;
  status?: string;
  onView: () => void;
  onDownload: () => void;
  onPayNow?: () => void;
}>) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardTitleRow}>
          <FileText size={22} color="#141414" />
          <h3 style={s.cardTitle}>Invoice issued #{invoiceNumber}</h3>
        </div>
        <CardActions
          onPayNow={
            typeof status === "string" && status.toLowerCase() === "pending" ? onPayNow : undefined
          }
          onView={onView}
          onDownload={onDownload}
        />
      </div>
      <div style={s.cardBody}>
        <div style={{ ...s.colGrid, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div style={s.colLabel}>Products</div>
            <CardProductWithIncludes product={product} />
          </div>
          <div>
            <div style={s.colLabel}>Invoice amount</div>
            <div style={s.colValue}>{amount}</div>
          </div>
        </div>
        <CardAmountFooter label="Invoice balance" amount={balance} />
      </div>
    </div>
  );
}

// ── Card: Payment processed ────────────────────────────────────────────────────
function PaymentCard({
  id,
  product,
  invoiceRef,
  paymentMethod,
  cardBrand,
  cardLast4,
  cardHolder,
  amount,
}: Readonly<{
  id: string;
  product: string;
  invoiceRef: string;
  paymentMethod?: string;
  cardBrand?: string;
  cardLast4: string;
  cardHolder: string;
  amount: string;
}>) {
  const normalizedPaymentMethod = String(paymentMethod ?? "")
    .trim()
    .toLowerCase();
  const isCardPayment =
    normalizedPaymentMethod === "stripe" ||
    String(cardLast4 || "").trim().length > 0;

  const chipLabel = (
    isCardPayment
      ? (cardBrand || "CARD").toString().toUpperCase()
      : getPaymentMethodLabel(paymentMethod).toUpperCase()
  ).trim();

  const primaryLine = isCardPayment
    ? `${(cardBrand || "Card").toString()} ending in ${String(cardLast4 || "****")}`
    : getPaymentMethodLabel(paymentMethod);

  const secondaryLine = String(cardHolder || "").trim();

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardTitleRow}>
          <Landmark size={22} color="#141414" />
          <h3 style={s.cardTitle}>Payment processed #{id}</h3>
        </div>
        <CardActions />
      </div>
      <div style={s.cardBody}>
        <div style={{ ...s.colGrid, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <div style={s.colLabel}>Products</div>
            <CardProductWithIncludes product={product} />
          </div>
          <div>
            <div style={s.colLabel}>Paid for invoice</div>
            <div style={s.colValue}>
              <LinkButton onClick={() => null} style={s.link}>
                #{invoiceRef}
              </LinkButton>
            </div>
          </div>
          <div>
            <div style={s.colLabel}>Payment method</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 2 }}>
              <span style={s.visaChip}>{chipLabel || "PAYMENT"}</span>
              <div>
                <div style={{ fontSize: 14, color: "#141414", fontFamily: font }}>
                  {primaryLine}
                </div>
                {secondaryLine.length > 0 && (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: font,
                      color: "#141414",
                    }}
                  >
                    {secondaryLine}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <CardAmountFooter label="Amount paid" amount={amount} />
      </div>
    </div>
  );
}

// ── Card: Order issued ─────────────────────────────────────────────────────────
function OrderCard({
  id,
  product,
  amount,
}: Readonly<{ id: string; product: string; amount: string }>) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardTitleRow}>
          <FileMinus size={22} color="#141414" />
          <h3 style={s.cardTitle}>Order issued #{id}</h3>
        </div>
        <CardActions />
      </div>
      <div style={s.cardBody}>
        <div style={{ ...s.colGrid, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div style={s.colLabel}>Products</div>
            <CardProductWithIncludes product={product} />
          </div>
        </div>
        <CardAmountFooter label="Amount" amount={amount} />
      </div>
    </div>
  );
}

export type BillingHistoryPageProps = Readonly<{
  /**
   * Customer-facing route: show company dropdown and call invoices with
   * `crm_company_not_null: true` and `crm_company_id` when a company is selected.
   */
  customerCompanyPicker?: boolean;
}>;

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BillingHistoryPage({
  customerCompanyPicker = false,
}: BillingHistoryPageProps) {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const canPayInvoices = hasPermission(PERMISSIONS.PAY_INVOICES_BILLING);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangeOption, setDateRangeOption] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("All Payments");
  const canViewStaticBillingSections = hasPermission(
    PERMISSIONS.VIEW_STATIC_SECTIONS_BILLING,
  );

  const queryClient = useQueryClient();
  const viewInvoiceRequestRef = useRef(0);
  const payNowRequestRef = useRef(0);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<InvoiceViewData | null>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const companyOptions = useMinifiedCompaniesSendAll({
    enabled: customerCompanyPicker,
    onError: (e) => {
      toast.error(`Failed to load companies: ${getErrorMessage(e)}`, {
        toastId: "billing_history_load_companies_failed",
      });
    },
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number>("");

  const bumpInvoicesAfterCustomerCreated = useCallback(() => {
    queryClient
      .invalidateQueries({ queryKey: accountBillingKeys.invoiceHistory.all() })
      .catch(() => undefined);
  }, [queryClient]);

  useEnsureCustomerForCrmCompany(customerCompanyPicker ? selectedCompanyId : null, {
    onCreated: bumpInvoicesAfterCustomerCreated,
    errorToastId: "billing_history_ensure_customer_failed",
  });

  const selectedCompanyLabel = useMemo(() => {
    if (!selectedCompanyId) return "";
    const found = companyOptions.find((c) => String(c.id) === String(selectedCompanyId));
    return found?.name?.trim() || String(selectedCompanyId);
  }, [companyOptions, selectedCompanyId]);

  const closeViewInvoiceModal = useCallback(() => {
    viewInvoiceRequestRef.current += 1;
    setShowViewInvoiceModal(false);
    setSelectedInvoiceForView(null);
    setIsInvoiceLoading(false);
  }, []);

  const handleViewInvoice = useCallback(async (invoiceId: number) => {
    viewInvoiceRequestRef.current += 1;
    const req = viewInvoiceRequestRef.current;
    setShowViewInvoiceModal(true);
    setSelectedInvoiceForView(null);
    setIsInvoiceLoading(true);
    try {
      const invoiceDetails = await getInvoice(invoiceId);
      if (req !== viewInvoiceRequestRef.current) return;
      setSelectedInvoiceForView(toInvoiceViewData(invoiceDetails));
    } catch (err) {
      console.error("BillingHistoryPage view invoice error:", err);
      if (req !== viewInvoiceRequestRef.current) return;
      closeViewInvoiceModal();
    } finally {
      if (req === viewInvoiceRequestRef.current) {
        setIsInvoiceLoading(false);
      }
    }
  }, [closeViewInvoiceModal]);

  const handleDownloadInvoice = useCallback(async (invoiceId: number) => {
    try {
      await downloadInvoicePdf(invoiceId);
    } catch (err) {
      console.error("BillingHistoryPage download invoice error:", err);
    }
  }, []);

  const invoiceHistoryParams = useMemo(
    () => ({
      customerCompanyPicker,
      selectedCompanyId,
      search: searchQuery,
      dateFrom,
      dateTo,
      statusFilter,
      paymentStatusFilter,
    }),
    [
      customerCompanyPicker,
      selectedCompanyId,
      searchQuery,
      dateFrom,
      dateTo,
      statusFilter,
      paymentStatusFilter,
    ],
  );

  const invoicesQuery = useAccountBillingInvoiceHistoryQuery(invoiceHistoryParams);
  const invoices = invoicesQuery.data ?? [];
  const loadingInvoices = invoicesQuery.isFetching;

  const { openInvoicePayment: openInvoicePaymentModal, invoicePaymentModal } = useInvoicePaymentModal({
    onPaymentSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: accountBillingKeys.invoiceHistory.all() })
        .catch(() => undefined);
    },
  });

  const handlePayNow = useCallback(
    async (invoiceId: number) => {
      if (!canPayInvoices) {
        toast.error("You are not authorized to pay invoices");
        return;
      }
      payNowRequestRef.current += 1;
      const req = payNowRequestRef.current;
      try {
        const invoiceDetails = await getInvoice(invoiceId);
        if (req !== payNowRequestRef.current) return;
        openInvoicePaymentModal(invoiceDetails);
      } catch (err) {
        console.error("BillingHistoryPage pay now error:", err);
      }
    },
    [canPayInvoices, openInvoicePaymentModal]
  );

  const filters = useMemo(
    () =>
      [
        {
          label: "Date range",
          options: ["Last 30 days", "Last 3 months", "Last 6 months", "Last 12 months", "Custom range"],
          isStaticSection: false,
        },
        {
          label: "Status",
          options: ["All Statuses", "paid", "partially_paid", "pending", "overdue"],
          isStaticSection: false,
        },
        {
          label: "Orders",
          options: ["Order issued", "Order amended", "Order cancelled"],
          isStaticSection: true,
        },
        {
          label: "Invoices",
          options: ["Invoice issued", "Invoice credited", "Invoice voided"],
          isStaticSection: true,
        },
        // { label: "Payments", options: ["All Payments", "pending", "completed", "failed"], isStaticSection: false },
        {
          label: "Credits",
          options: ["Credit applied", "Credit issued", "Credit expired"],
          isStaticSection: true,
        },
        {
          label: "Refunds",
          options: ["Refund issued", "Refund pending"],
          isStaticSection: true,
        },
        {
          label: "Usage & Limits",
          options: ["Credits used", "Credits added", "Limit changed"],
          isStaticSection: true,
        },
      ].filter(
        (filterItem) =>
          !filterItem.isStaticSection || canViewStaticBillingSections,
      ),
    [canViewStaticBillingSections],
  );

  return (
    <div style={s.page}>
      {customerCompanyPicker ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 24px 0 24px",
            flexShrink: 0,
          }}
        >
          <Form.Select
            size="sm"
            style={{
              width: 220,
              height: 40,
              fontFamily: font,
              border: "1px solid rgb(138, 138, 138)",
              borderRadius: 4,
            }}
            value={String(selectedCompanyId)}
            onChange={(e) =>
              setSelectedCompanyId(e.target.value === "" ? "" : e.target.value)
            }
            aria-label="Select company"
          >
            <option value="">Select company</option>
            {companyOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.id}
              </option>
            ))}
          </Form.Select>
        </div>
      ) : null}

      {/* Top bar: search + filters */}
      <div style={s.topBar}>
        {/* Search */}
        <div style={s.searchWrapper}>
          <Search size={16} color="#888" style={s.searchIcon} />
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search Billing History"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter dropdowns */}
        {filters.map((f) => {
          if (f.label === "Date range") {
            return (
              <DateRangeDropdown
                key={f.label}
                label={f.label}
                options={f.options}
                selectedOption={dateRangeOption}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChangeOption={(opt) => {
                  setDateRangeOption(opt);
                  if (opt === "Custom range") {
                    if (dateFrom === "" && dateTo === "") {
                      const today = moment().format("YYYY-MM-DD");
                      setDateFrom(today);
                      setDateTo(today);
                    }
                    return;
                  }

                  const computed = computeDateRange(opt);
                  if (computed == null) {
                    setDateFrom("");
                    setDateTo("");
                    return;
                  }
                  setDateFrom(computed.dateFrom);
                  setDateTo(computed.dateTo);
                }}
                onChangeDateFrom={(value) => {
                  setDateRangeOption("Custom range");
                  setDateFrom(value);
                  if (dateTo !== "" && value !== "" && value > dateTo) {
                    setDateTo(value);
                  }
                }}
                onChangeDateTo={(value) => {
                  setDateRangeOption("Custom range");
                  setDateTo(value);
                  if (dateFrom !== "" && value !== "" && value < dateFrom) {
                    setDateFrom(value);
                  }
                }}
                onClear={() => {
                  setDateRangeOption("");
                  setDateFrom("");
                  setDateTo("");
                }}
              />
            );
          }

          if (f.label === "Status") {
            return (
              <StatusDropdown
                key={f.label}
                label={f.label}
                options={f.options}
                value={statusFilter}
                onChange={setStatusFilter}
                inactiveValues={["", "All Statuses"]}
              />
            );
          }

          if (f.label === "Payments") {
            return (
              <StatusDropdown
                key={f.label}
                label={f.label}
                options={f.options}
                value={paymentStatusFilter}
                onChange={setPaymentStatusFilter}
                inactiveValues={["", "All Payments"]}
              />
            );
          }

          return <FilterDropdown key={f.label} label={f.label} options={f.options} />;
        })}
      </div>

      {/* Content */}
      <div style={s.content}>

        {loadingInvoices && (
          <div style={{ padding: "24px 0", color: "#666" }}>Loading...</div>
        )}
        {!loadingInvoices && invoices.length === 0 && (
          <div style={s.emptyState} role="status" aria-live="polite">
            <FileText size={48} color="#ccc" style={{ marginBottom: 16 }} aria-hidden />
            <p style={s.emptyStateTitle}>No history found</p>
            <p style={s.emptyStateHint}>
              There is no billing history for the current filters. Choose a company above to narrow results,
              or adjust your search, date range, or status filters.
            </p>
          </div>
        )}
        {!loadingInvoices &&
          invoices.length > 0 &&
          invoices.map((invoice: any) => (
            <div key={invoice.id}>
              <div style={s.dateLabel}>
                {moment(invoice.created_at).format(GlobalDateTimeFormat)}
              </div>
              <InvoiceCard
                invoiceNumber={String(invoice.invoice_number ?? "")}
                product={
                  invoice.items
                    ?.map((item: any) => item?.product?.name)
                    .filter(Boolean)
                    .join(", ") || ""
                }
                amount={`${invoice.currency_code || "AED"} ${formatNumber(invoice.total_amount ?? 0)}`}
                balance={`${invoice.currency_code || "AED"} ${formatNumber(invoice.amount_due ?? 0)}`}
                status={String(invoice.status ?? "")}
                onView={() => handleViewInvoice(Number(invoice.id))}
                onDownload={() => handleDownloadInvoice(Number(invoice.id))}
                onPayNow={canPayInvoices ? () => handlePayNow(Number(invoice.id)) : undefined}
              />

              {Array.isArray(invoice.payments) &&
                invoice.payments.map((payment: any) => (
                  <PaymentCard
                    key={payment.id}
                    id={String(payment.id)}
                    product={payment.notes}
                    invoiceRef={String(invoice.invoice_number ?? "")}
                    paymentMethod={payment?.payment_method ?? payment?.method ?? ""}
                    cardBrand={payment?.card_brand ?? payment?.brand ?? ""}
                    cardLast4={payment?.card_last4 ?? ""}
                    cardHolder={payment?.card_holder ?? ""}
                    amount={`${payment?.currency_code || "AED"} ${formatNumber(payment?.amount ?? 0)}`}
                  />
                ))}

              {/* <OrderCard
                id="22970930"
                product={
                  invoice.items
                    ?.map((item: any) => item?.product?.name)
                    .filter(Boolean)
                    .join(", ") || ""
                }
                amount={`${invoice.currency_code || "AED"} ${invoice.total_amount ?? 0}`}
              /> */}
            </div>
          ))}
        <InvoiceViewModal
          show={showViewInvoiceModal}
          onHide={closeViewInvoiceModal}
          invoice={selectedInvoiceForView}
          loading={isInvoiceLoading}
          companyName={
            customerCompanyPicker
              ? selectedCompanyLabel || session?.user?.company_name || ""
              : session?.user?.company_name || ""
          }
          isTenantInvoice={!customerCompanyPicker}
        />
        {invoicePaymentModal}
      </div>
    </div>
  );
}
