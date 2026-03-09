import { useState, useEffect, useCallback } from "react";
import { Search, FileText, Landmark, FileMinus, ChevronDown } from "lucide-react";
import { GetPayments } from "@utils/accounting";

function formatBillingDate(value: string | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(value);
  }
}

const font = "Lexend Deca, Helvetica, Arial, sans-serif";

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
    // flexWrap: "wrap" as const,
  },
  searchWrapper: {
    position: "relative" as const,
    flexShrink: 0,
  },
  searchInput: {
    backgroundColor: "rgb(255, 255, 255)",
    border: "1px solid rgb(138, 138, 138)",
    borderRadius: 20,
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
    // paddingBlock: 10,
    // paddingInline: 12,
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
function FilterDropdown({ label, options }: { label: string; options: string[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div style={{ position: "relative" as const }}>
      <button
        style={{
          ...s.filterBtn,
        //   backgroundColor: selected.length > 0 ? "transparent" : "transparent",
          borderColor: selected.length > 0 ? "transparent" : "transparent",
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
          <div
            style={{ position: "fixed" as const, inset: 0, zIndex: 9 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute" as const, top: "calc(100% + 4px)", left: 0, zIndex: 10,
            backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: 6,
            boxShadow: "rgba(20,20,20,0.12) 0px 4px 16px",
            minWidth: 180, padding: "6px 0",
          }}>
            {options.map(opt => (
              <div
                key={opt}
                onClick={() => {
                  setSelected(prev =>
                    prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
                  );
                }}
                style={{
                  padding: "8px 16px", cursor: "pointer", fontSize: 14, fontFamily: font,
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


// ── Card: Payment processed ────────────────────────────────────────────────────
function PaymentCard({ id, product, invoiceRef, cardLast4, cardHolder, amount, brand = "VISA" }: {
  id: string; product: string; invoiceRef: string;
  cardLast4: string; cardHolder: string; amount: string;
  brand?: string;
}) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardTitleRow}>
          <Landmark size={22} color="#141414" />
          <h3 style={s.cardTitle}>Payment processed #{id}</h3>
        </div>
        {/* <div style={s.cardActions}>
          <a style={s.actionLink}>View</a>
          <span style={s.divider}>|</span>
          <a style={s.actionLink}>Download</a>
        </div> */}
      </div>
      <div style={s.cardBody}>
        <div style={{ ...s.colGrid, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <div style={s.colLabel}>Products</div>
            <div style={s.colValue}>
              {product} <a style={s.link}>includes</a>
            </div>
          </div>
          <div>
            <div style={s.colLabel}>Paid for invoice</div>
            <div style={s.colValue}>
              <a style={s.link}>#{invoiceRef}</a>
            </div>
          </div>
          <div>
            <div style={s.colLabel}>Payment method</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 2 }}>
              <span style={s.visaChip}>{brand}</span>
              <div>
                <div style={{ fontSize: 14, color: "#141414", fontFamily: font }}>
                  {brand} <em>ending in</em> {cardLast4}
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


// ── Main page ──────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

export default function BillingHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetPayments({
        page: 1,
        per_page: 50,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      }) as any;
      const list = response?.dataList ?? response?.data ?? [];
      setPaymentsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("GetPayments error:", err);
      setPaymentsList([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filters = [
    { label: "Date range", options: ["Last 30 days", "Last 3 months", "Last 6 months", "Last 12 months", "Custom range"] },
    { label: "Orders", options: ["Order issued", "Order amended", "Order cancelled"] },
    { label: "Invoices", options: ["Invoice issued", "Invoice credited", "Invoice voided"] },
    { label: "Payments", options: ["Payment processed", "Payment failed", "Payment refunded"] },
    { label: "Credits", options: ["Credit applied", "Credit issued", "Credit expired"] },
    { label: "Refunds", options: ["Refund issued", "Refund pending"] },
    { label: "Usage & Limits", options: ["Credits used", "Credits added", "Limit changed"] },
  ];

  const currency = (row: any) => row?.currency_code ?? row?.currency ?? "AED";
  const amountStr = (row: any) => `${currency(row)} ${Number(row?.amount ?? 0).toFixed(2)}`;
  const cardLast4 = (row: any) =>
    row?.payment_method?.last4 ?? row?.card_last4 ?? row?.last4 ?? (typeof row?.payment_method === "string" ? "****" : "****");
  const cardHolder = (row: any) =>
    row?.payment_method?.holder_name ?? row?.billing_details?.name ?? row?.card_holder ?? "—";
  const cardBrand = (row: any) =>
    (row?.payment_method?.brand ?? row?.payment_method ?? "CARD").toString().toUpperCase();

  const paymentsByDate = paymentsList.reduce<Record<string, any[]>>((acc, row) => {
    const dateKey = row?.payment_date ?? row?.created_at ?? row?.date ?? "";
    const d = dateKey ? formatBillingDate(dateKey) : "—";
    if (!acc[d]) acc[d] = [];
    acc[d].push(row);
    return acc;
  }, {});
  const sortedDates = Object.keys(paymentsByDate).sort((a, b) => {
    if (a === "—" || b === "—") return a === "—" ? 1 : -1;
    const timeA = paymentsByDate[a][0]?.payment_date ?? paymentsByDate[a][0]?.created_at ?? 0;
    const timeB = paymentsByDate[b][0]?.payment_date ?? paymentsByDate[b][0]?.created_at ?? 0;
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  return (
    <div style={s.page}>
      {/* Top bar: search + status filter (same as payment-history) + filters */}
      <div style={s.topBar}>
        <div style={s.searchWrapper}>
          <Search size={16} color="#888" style={s.searchIcon} />
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search by invoice number or payment ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            ...s.filterBtn,
            minWidth: 160,
            paddingLeft: 12,
            paddingRight: 28,
            cursor: "pointer",
            appearance: "auto",
          }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {filters.map(f => (
          <FilterDropdown key={f.label} label={f.label} options={f.options} />
        ))}
      </div>

      <div style={s.content}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center" as const, color: "#666", fontFamily: font }}>
            Loading…
          </div>
        ) : paymentsList.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center" as const, color: "#666", fontFamily: font }}>
            No billing history found.
          </div>
        ) : (
          sortedDates.map((dateLabel) => (
            <div key={dateLabel}>
              <div style={s.dateLabel}>{dateLabel}</div>
              {paymentsByDate[dateLabel].map((row: any) => (
                <PaymentCard
                  key={row?.id ?? row?.payment_id ?? Math.random()}
                  id={String(row?.id ?? row?.payment_id ?? "—")}
                  product={row?.product_name ?? row?.invoice?.product ?? row?.description ?? "—"}
                  invoiceRef={row?.invoice?.invoice_number ?? row?.invoice_number ?? row?.invoice_id ?? "—"}
                  cardLast4={cardLast4(row)}
                  cardHolder={cardHolder(row)}
                  amount={amountStr(row)}
                  brand={cardBrand(row)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
