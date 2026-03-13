import { useCallback, useEffect, useState } from "react";
import { Search, FileText, Landmark, FileMinus, ChevronDown } from "lucide-react";
import {
  downloadInvoicePdf,
  getInvoice,
  getInvoices,
} from "@utils/accounts";
import type { InvoiceData } from "@utils/accounts";
import { GlobalDateTimeFormat } from "@utils/Helper";
import moment from "moment";
import { useSession } from "next-auth/react";
import InvoiceViewModal, { type InvoiceViewData } from "@components/billings/InvoiceViewModal";

const font = "Lexend Deca, Helvetica, Arial, sans-serif";

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
    maxWidth: "calc(1376px)",
    margin: "0 auto",
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
    fontWeight: 600,
    color: "rgb(0, 97, 98)",
    cursor: "pointer",
    textUnderlineOffset: "24%",
    textDecoration: "underline",
    fontFamily: font,
    fontSize: 14,
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

// ── Card: Invoice issued ───────────────────────────────────────────────────────
function InvoiceCard({
  invoiceNumber,
  product,
  amount,
  balance,
  onView,
  onDownload,
}: Readonly<{
  invoiceNumber: string;
  product: string;
  amount: string;
  balance: string;
  onView: () => void;
  onDownload: () => void;
}>) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardTitleRow}>
          <FileText size={22} color="#141414" />
          <h3 style={s.cardTitle}>Invoice issued #{invoiceNumber}</h3>
        </div>
        <div style={s.cardActions}>
          <button
            type="button"
            style={{ ...s.actionLink, background: "none", border: "none", padding: 0 }}
            onClick={onView}
          >
            View
          </button>
          <span style={s.divider}>|</span>
          <button
            type="button"
            style={{ ...s.actionLink, background: "none", border: "none", padding: 0 }}
            onClick={onDownload}
          >
            Download
          </button>
        </div>
      </div>
      <div style={s.cardBody}>
        <div style={{ ...s.colGrid, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div style={s.colLabel}>Products</div>
            <div style={s.colValue}>
              {product}{" "}
              <button
                type="button"
                onClick={() => null}
                style={{ ...s.link, background: "none", border: "none", padding: 0 }}
              >
                includes
              </button>
            </div>
          </div>
          <div>
            <div style={s.colLabel}>Invoice amount</div>
            <div style={s.colValue}>{amount}</div>
          </div>
        </div>
        <hr style={s.hr} />
        <div style={s.balanceRow}>
          <span style={s.balanceLabel}>Invoice balance</span>
          <span style={s.balanceAmount}>{balance}</span>
        </div>
      </div>
    </div>
  );
}

// ── Card: Payment processed ────────────────────────────────────────────────────
function PaymentCard({
  id,
  product,
  invoiceRef,
  cardLast4,
  cardHolder,
  amount,
}: Readonly<{
  id: string;
  product: string;
  invoiceRef: string;
  cardLast4: string;
  cardHolder: string;
  amount: string;
}>) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardTitleRow}>
          <Landmark size={22} color="#141414" />
          <h3 style={s.cardTitle}>Payment processed #{id}</h3>
        </div>
        <div style={s.cardActions}>
          <button type="button" onClick={() => null} style={{ ...s.actionLink, background: "none", border: "none", padding: 0 }}>
            View
          </button>
          <span style={s.divider}>|</span>
          <button type="button" onClick={() => null} style={{ ...s.actionLink, background: "none", border: "none", padding: 0 }}>
            Download
          </button>
        </div>
      </div>
      <div style={s.cardBody}>
        <div style={{ ...s.colGrid, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <div style={s.colLabel}>Products</div>
            <div style={s.colValue}>
              {product}{" "}
              <button
                type="button"
                onClick={() => null}
                style={{ ...s.link, background: "none", border: "none", padding: 0 }}
              >
                includes
              </button>
            </div>
          </div>
          <div>
            <div style={s.colLabel}>Paid for invoice</div>
            <div style={s.colValue}>
              <button
                type="button"
                onClick={() => null}
                style={{ ...s.link, background: "none", border: "none", padding: 0 }}
              >
                #{invoiceRef}
              </button>
            </div>
          </div>
          <div>
            <div style={s.colLabel}>Payment method</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 2 }}>
              <span style={s.visaChip}>VISA</span>
              <div>
                <div style={{ fontSize: 14, color: "#141414", fontFamily: font }}>
                  Visa <em>ending in</em> {cardLast4}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: "#141414" }}>{cardHolder}</div>
              </div>
            </div>
          </div>
        </div>
        <hr style={s.hr} />
        <div style={s.balanceRow}>
          <span style={s.balanceLabel}>Amount paid</span>
          <span style={s.balanceAmount}>{amount}</span>
        </div>
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
        <div style={s.cardActions}>
          <button type="button" onClick={() => null} style={{ ...s.actionLink, background: "none", border: "none", padding: 0 }}>
            View
          </button>
          <span style={s.divider}>|</span>
          <button type="button" onClick={() => null} style={{ ...s.actionLink, background: "none", border: "none", padding: 0 }}>
            Download
          </button>
        </div>
      </div>
      <div style={s.cardBody}>
        <div style={{ ...s.colGrid, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div style={s.colLabel}>Products</div>
            <div style={s.colValue}>
              {product}{" "}
              <button
                type="button"
                onClick={() => null}
                style={{ ...s.link, background: "none", border: "none", padding: 0 }}
              >
                includes
              </button>
            </div>
          </div>
        </div>
        <hr style={s.hr} />
        <div style={s.balanceRow}>
          <span style={s.balanceLabel}>Amount</span>
          <span style={s.balanceAmount}>{amount}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BillingHistoryPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  const [invoices, setInvoices] = useState<any[]>([]);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<InvoiceViewData | null>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  const closeViewInvoiceModal = useCallback(() => {
    setShowViewInvoiceModal(false);
    setSelectedInvoiceForView(null);
    setIsInvoiceLoading(false);
  }, []);

  const handleViewInvoice = useCallback(async (invoiceId: number) => {
    setShowViewInvoiceModal(true);
    setSelectedInvoiceForView(null);
    setIsInvoiceLoading(true);
    try {
      const invoiceDetails = await getInvoice(invoiceId);
      setSelectedInvoiceForView(toInvoiceViewData(invoiceDetails));
    } catch (err) {
      console.error("BillingHistoryPage view invoice error:", err);
      closeViewInvoiceModal();
    } finally {
      setIsInvoiceLoading(false);
    }
  }, [closeViewInvoiceModal]);

  const handleDownloadInvoice = useCallback(async (invoiceId: number) => {
    try {
      await downloadInvoicePdf(invoiceId);
    } catch (err) {
      console.error("BillingHistoryPage download invoice error:", err);
    }
  }, []);
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await getInvoices({ page: 1, per_page: 50, limit: 50 }) as any;
        setInvoices(res?.data || []);
        console.log("getInvoices response:", res);
      } catch (err) {
        console.error("BillingHistoryPage getInvoices error:", err);
      }
    };
    fetchInvoices();
  }, []);

  const filters = [
    { label: "Date range", options: ["Last 30 days", "Last 3 months", "Last 6 months", "Last 12 months", "Custom range"] },
    { label: "Orders", options: ["Order issued", "Order amended", "Order cancelled"] },
    { label: "Invoices", options: ["Invoice issued", "Invoice credited", "Invoice voided"] },
    { label: "Payments", options: ["Payment processed", "Payment failed", "Payment refunded"] },
    { label: "Credits", options: ["Credit applied", "Credit issued", "Credit expired"] },
    { label: "Refunds", options: ["Refund issued", "Refund pending"] },
    { label: "Usage & Limits", options: ["Credits used", "Credits added", "Limit changed"] },
  ];

  return (
    <div style={s.page}>
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
        {filters.map(f => (
          <FilterDropdown key={f.label} label={f.label} options={f.options} />
        ))}
      </div>

      {/* Content */}
      <div style={s.content}>

        {invoices.map((invoice: any) => (
          <div key={invoice.id}>
            <div style={s.dateLabel}>{moment(invoice.created_at).format(GlobalDateTimeFormat)}</div>
            <InvoiceCard
              invoiceNumber={String(invoice.invoice_number ?? "")}
              product={invoice.items?.map((item: any) => item?.product?.name).filter(Boolean).join(", ") || ""}
              amount={`${invoice.currency_code || "AED"} ${invoice.total_amount ?? 0}`}
              balance={`${invoice.currency_code || "AED"} ${invoice.amount_due ?? 0}`}
              onView={() => handleViewInvoice(Number(invoice.id))}
              onDownload={() => handleDownloadInvoice(Number(invoice.id))}
            />
            
            {Array.isArray(invoice.payments) && invoice.payments.map((payment: any) => (
              <PaymentCard
                key={payment.id}
                id={String(payment.id)}
                product={payment.notes}
                invoiceRef={String(invoice.invoice_number ?? "")}
                cardLast4={payment?.card_last4 ?? ""}
                cardHolder={payment?.card_holder ?? ""}
                amount={`${payment?.currency_code || "AED"} ${payment?.amount ?? 0}`}
              />
            ))}

            <OrderCard
              id="22970930"
              product={invoice.items?.map((item: any) => item?.product?.name).filter(Boolean).join(", ") || ""}
              amount={`${invoice.currency_code || "AED"} ${invoice.total_amount ?? 0}`}
            />

          </div>
        ))}
        <InvoiceViewModal
          show={showViewInvoiceModal}
          onHide={closeViewInvoiceModal}
          invoice={selectedInvoiceForView}
          loading={isInvoiceLoading}
          companyName={session?.user?.company_name || ""}
        />
      </div>
    </div>
  );
}
