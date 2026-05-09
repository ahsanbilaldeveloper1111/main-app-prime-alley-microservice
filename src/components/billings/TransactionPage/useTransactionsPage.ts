import { useCallback, useRef, useState } from "react";
import { downloadInvoicePdf, getInvoice } from "@utils/accounts";
import { useAccountBillingTenantPaymentsQuery } from "@page-modules/billing/account-billing/useAccountBillingTenantPaymentsQuery";

export function useTransactionsPage() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const viewInvoiceGen = useRef(0);

  const paymentsQuery = useAccountBillingTenantPaymentsQuery();
  const payments = (paymentsQuery.data ?? []) as any[];

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

    const gen = ++viewInvoiceGen.current;
    setShowViewInvoiceModal(true);
    setSelectedInvoiceForView(null);
    setIsInvoiceLoading(true);
    try {
      const invoiceDetails = await getInvoice(Number(invoiceId));
      if (gen !== viewInvoiceGen.current) return;
      setSelectedInvoiceForView(invoiceDetails);
    } catch (err) {
      console.error("View invoice error:", err);
      if (gen !== viewInvoiceGen.current) return;
      setShowViewInvoiceModal(false);
      setSelectedInvoiceForView(null);
    } finally {
      if (gen === viewInvoiceGen.current) {
        setIsInvoiceLoading(false);
      }
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

  return {
    hoveredRow,
    setHoveredRow,
    payments,
    showViewInvoiceModal,
    selectedInvoiceForView,
    isInvoiceLoading,
    closeViewInvoiceModal,
    handleViewInvoice,
    handleDownloadPDF,
  };
}
