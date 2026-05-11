import moment from "moment";
import { useSession } from "next-auth/react";
import { GlobalDateFormat, GlobalDateTimeFormat } from "@utils/Helper";
import InvoiceViewModal from "@components/billings/InvoiceViewModal";
import { getPaymentMethodLabel, getPaymentStatusBadge } from "./transactionPageHelpers";
import { transactionPageStyles as s } from "./transactionPageStyles";

export type TransactionsPageViewProps = Readonly<{
  hoveredRow: number | null;
  setHoveredRow: (id: number | null) => void;
  payments: any[];
  showViewInvoiceModal: boolean;
  selectedInvoiceForView: any;
  isInvoiceLoading: boolean;
  closeViewInvoiceModal: () => void;
  handleViewInvoice: (payment: any) => void;
  handleDownloadPDF: (payment: any) => void;
}>;

export function TransactionsPageView({
  hoveredRow,
  setHoveredRow,
  payments,
  showViewInvoiceModal,
  selectedInvoiceForView,
  isInvoiceLoading,
  closeViewInvoiceModal,
  handleViewInvoice,
  handleDownloadPDF,
}: TransactionsPageViewProps) {
  const { data: session } = useSession();

  return (
    <div style={s.page}>
      <h1 style={s.pageHeading}>Transactions</h1>

      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead style={s.thead}>
            <tr>
              <th style={{ ...s.th, width: 130 }}>Date Issued</th>
              <th style={{ ...s.th, width: 220 }}>Details</th>
              <th style={{ ...s.th, width: 120 }}>Transaction Number</th>
              <th style={{ ...s.th }}>Subscriptions</th>
              <th style={{ ...s.th }}>Payment Method</th>
              <th style={{ ...s.th, width: 160 }}>Amount</th>
              <th style={{ ...s.th, width: 120 }}>Status</th>
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
                <td style={{ ...s.td, ...s.dateCell }}>
                  {payment?.invoice?.invoice_date ? moment(payment?.invoice?.invoice_date).format(GlobalDateFormat) : ""}
                </td>

                <td style={s.td}>
                  <div style={s.detailsTitle}>Invoice #{payment?.invoice?.invoice_number}</div>

                  <div style={s.detailsSub}>{payment?.updated_at ? moment(payment?.updated_at).format(GlobalDateTimeFormat) : ""}</div>

                  <div style={s.actionLinks}>
                    <button
                      type="button"
                      style={{ ...s.link, background: "none", border: "none", padding: 0 }}
                      onClick={() => {
                        handleViewInvoice(payment);
                      }}
                    >
                      View
                    </button>
                    <span style={s.divider}>|</span>
                    <button
                      type="button"
                      style={{ ...s.link, background: "none", border: "none", padding: 0 }}
                      onClick={() => {
                        handleDownloadPDF(payment);
                      }}
                    >
                      Download
                    </button>
                  </div>
                </td>

                <td style={s.td}>
                  #{payment?.id?.toString() || "-"}
                </td>

                <td style={s.td}>
                  <div style={{ whiteSpace: "pre-line" }}>
                    {payment?.invoice?.items?.map((item: any) => item?.product?.name).join("\n") || ""}
                  </div>
                </td>

                <td style={s.td}>
                  {getPaymentMethodLabel(payment?.payment_method)}
                </td>

                <td style={s.td}>

                  <div style={{ marginBottom: 12 }}>
                    <div style={s.amountLabel}>Invoice amount</div>
                    <div style={s.amountValue}>{payment?.invoice?.currency_code || "AED"} {payment?.invoice?.total_amount ?? 0}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={s.amountLabel}>Invoice Balance</div>
                    <div style={s.amountValue}>{payment?.invoice?.currency_code || "AED"} {payment?.invoice?.amount_due ?? 0}</div>
                  </div>
                </td>

                <td style={s.td}>
                  {(() => {
                    const badge = getPaymentStatusBadge(payment?.status);
                    return (
                      <span style={badge.style ? { ...s.statusBadge, ...badge.style } : s.statusBadge}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </td>

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
        isTenantInvoice={true}
      />

    </div>
  );
}
