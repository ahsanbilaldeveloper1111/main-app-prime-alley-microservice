import { useState, useEffect, useCallback } from "react";
import { GetPayments } from "@utils/accounting";
import { GlobalDateFormat, GlobalDateTimeFormat } from "@utils/Helper";
import { downloadInvoicePdf, getInvoice } from "@utils/accounts";
import moment from "moment";
import { useSession } from "next-auth/react";
import InvoiceViewModal from "@components/billings/InvoiceViewModal";

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
  
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { data: session } = useSession();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  const closeViewInvoiceModal = useCallback(() => {
    setShowViewInvoiceModal(false);
    setSelectedInvoiceForView(null);
  }, []);

  const handleViewInvoice = useCallback(async (payment: any) => {
    const invoiceId = payment?.invoice?.id ?? payment?.invoice_id ?? payment?.invoice?.invoice_id;
    if (!invoiceId) {
      console.warn("No invoice id found for payment:", payment);
      return;
    }

    setShowViewInvoiceModal(true);
    setSelectedInvoiceForView(null);
    setIsInvoiceLoading(true);
    try {
      const invoiceDetails = await getInvoice(Number(invoiceId));
      setSelectedInvoiceForView(invoiceDetails);
    } catch (err) {
      console.error("View invoice error:", err);
    } finally {
      setIsInvoiceLoading(false);
    }
  }, []);

  const handleDownloadPDF = useCallback(async (payment: any) => {
    const invoiceId = payment?.invoice?.id ?? payment?.invoice_id ?? payment?.invoice?.invoice_id;
    if (!invoiceId) {
      console.warn("No invoice id found for payment:", payment);
      return;
    }
    try {
      await downloadInvoicePdf(Number(invoiceId));
    } catch (err) {
      console.error("PDF download error:", err);
    }
  }, []);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await GetPayments({ page: 1, per_page: 500 });
        setPayments(response?.dataList || []);
        console.log("GetPayments response:", response);
      } catch (err) {
        console.error("TransactionsPage GetPayments error:", err);
      }
    };
    fetchPayments();
  }, []);

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
            {payments.map((payment) => (
              <tr
                key={payment?.id}
                onMouseEnter={() => setHoveredRow(payment?.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  backgroundColor: hoveredRow === payment.id ? "#fafafa" : "#fff",
                  transition: "background-color 100ms ease-out",
                }}
              >
                {/* Date Issued */}
                <td style={{ ...s.td, ...s.dateCell }}>
                  {payment?.invoice?.invoice_date ? moment(payment?.invoice?.invoice_date).format(GlobalDateFormat) : ""}
                </td>

                {/* Details */}
                <td style={s.td}>
                  <div style={s.detailsTitle}>Invoice #{payment?.invoice?.invoice_number}</div>
                 
                    <div style={s.detailsSub}>{payment?.updated_at ? moment(payment?.updated_at).format(GlobalDateTimeFormat) : ""}</div>
                  
                  <div style={s.actionLinks}>
                    <button
                      type="button"
                      style={{ ...s.link, background: "none", border: "none", padding: 0 }}
                      onClick={() => handleViewInvoice(payment)}
                    >
                      View
                    </button>
                    <span style={s.divider}>|</span>
                    <button
                      type="button"
                      style={{ ...s.link, background: "none", border: "none", padding: 0 }}
                      onClick={() => handleDownloadPDF(payment)}
                    >
                      Download
                    </button>
                  </div>
                </td>

                {/* PO Number */}
                <td style={{ ...s.td }}>
                  {payment?.invoice?.po_number || "-"}
                </td>

                {/* Products */}
                <td style={s.td}>
                  <div style={{ whiteSpace: "pre-line" }}>
                    {payment?.invoice?.items?.map((item: any) => item?.product?.name).join("\n") || ""}
                  </div>
                </td>

                {/* Amount */}
                <td style={s.td}>
                  
                    <div  style={{ marginBottom: 12 }}>
                      <div style={s.amountLabel}>Invoice amount</div>
                      <div style={s.amountValue}>{payment?.invoice?.currency_code || "AED"} {payment?.invoice?.total_amount??0}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={s.amountLabel}>Invoice Balance</div>
                      <div style={s.amountValue}>{payment?.invoice?.currency_code || "AED"} {payment?.invoice?.amount_due??0}</div>
                    </div>
                </td>

                {/* Status */}
                <td style={s.td}>
                  <span style={s.statusBadge}>{payment?.status}</span>
                </td>

                {/* Actions (empty col per design) */}
                <td style={s.td} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceViewModal
        show={showViewInvoiceModal}
        onHide={closeViewInvoiceModal}
        invoice={selectedInvoiceForView}
        loading={isInvoiceLoading}
        companyName={session?.user?.company_name || ""}
      />

    </div>
  );
}
