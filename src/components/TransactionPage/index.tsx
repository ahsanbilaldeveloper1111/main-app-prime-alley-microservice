import { useState } from "react";

const font = "Lexend Deca, Helvetica, Arial, sans-serif";

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: font,
    color: "#141414",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    padding: "24px",
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: 300,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 20px 0",
    lineHeight: "29px",
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
    padding: "16px 16px",
    fontSize: 14,
    fontFamily: font,
    color: "#141414",
    verticalAlign: "top" as const,
    borderBottom: "1px solid #e5e5e5",
    lineHeight: "20px",
  },
  dateCell: {
    fontSize: 14,
    fontFamily: font,
    color: "#141414",
    fontWeight: 400,
    whiteSpace: "nowrap" as const,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: font,
    color: "#141414",
    marginBottom: 2,
  },
  detailsSub: {
    fontSize: 12,
    fontWeight: 300,
    fontFamily: font,
    color: "#666",
    marginBottom: 8,
  },
  actionLinks: {
    display: "flex",
    alignItems: "center",
    gap: 0,
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
  divider: {
    color: "#ccc",
    margin: "0 8px",
    fontWeight: 300,
    fontSize: 14,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: 300,
    fontFamily: font,
    color: "#666",
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 400,
    fontFamily: font,
    color: "#141414",
    marginBottom: 12,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #141414",
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: 13,
    fontWeight: 400,
    fontFamily: font,
    color: "#141414",
    whiteSpace: "nowrap" as const,
    backgroundColor: "#fff",
  },
};

// ── Transaction data ───────────────────────────────────────────────────────────
const transactions = [
  {
    id: 1,
    dateIssued: "11 Feb 2026",
    detailsTitle: "Invoice #720886618",
    detailsSub: "Last updated 11 Feb 2026",
    poNumber: "-",
    products: "Pro Plan",
    amounts: [
      { label: "Invoice amount", value: "AED 97.20" },
      { label: "Invoice balance", value: "AED 0.00" },
    ],
    status: "Processed",
  },
  {
    id: 2,
    dateIssued: "11 Feb 2026",
    detailsTitle: "Order #22970930",
    detailsSub: null,
    poNumber: "",
    products: "",
    amounts: [],
    status: "Processed",
  },
  {
    id: 3,
    dateIssued: "11 Feb 2026",
    detailsTitle: "Payment #43595815",
    detailsSub: "Credit card",
    poNumber: "",
    products: "Pro Plan",
    amounts: [
      { label: "Payment amount", value: "AED 97.20" },
    ],
    status: "Processed",
  },
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <div style={s.page}>
      <h1 style={s.pageHeading}>Transactions</h1>

      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead style={s.thead}>
            <tr>
              <th style={{ ...s.th, width: 130 }}>Date Issued</th>
              <th style={{ ...s.th, width: 220 }}>Details</th>
              <th style={{ ...s.th, width: 120 }}>PO Number</th>
              <th style={{ ...s.th }}>Products</th>
              <th style={{ ...s.th, width: 160 }}>Amount</th>
              <th style={{ ...s.th, width: 120 }}>Status</th>
              <th style={{ ...s.th, width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                onMouseEnter={() => setHoveredRow(tx.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  backgroundColor: hoveredRow === tx.id ? "#fafafa" : "#fff",
                  transition: "background-color 100ms ease-out",
                }}
              >
                {/* Date Issued */}
                <td style={{ ...s.td, ...s.dateCell }}>
                  {tx.dateIssued}
                </td>

                {/* Details */}
                <td style={s.td}>
                  <div style={s.detailsTitle}>{tx.detailsTitle}</div>
                  {tx.detailsSub && (
                    <div style={s.detailsSub}>{tx.detailsSub}</div>
                  )}
                  <div style={s.actionLinks}>
                    <a style={s.link}>View</a>
                    <span style={s.divider}>|</span>
                    <a style={s.link}>Download</a>
                  </div>
                </td>

                {/* PO Number */}
                <td style={{ ...s.td, color: tx.poNumber === "-" ? "#141414" : "#ccc" }}>
                  {tx.poNumber || ""}
                </td>

                {/* Products */}
                <td style={s.td}>
                  {tx.products || ""}
                </td>

                {/* Amount */}
                <td style={s.td}>
                  {tx.amounts.map((amt, i) => (
                    <div key={i} style={{ marginBottom: i < tx.amounts.length - 1 ? 12 : 0 }}>
                      <div style={s.amountLabel}>{amt.label}</div>
                      <div style={s.amountValue}>{amt.value}</div>
                    </div>
                  ))}
                </td>

                {/* Status */}
                <td style={s.td}>
                  <span style={s.statusBadge}>{tx.status}</span>
                </td>

                {/* Actions (empty col per design) */}
                <td style={s.td} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
