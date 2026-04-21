import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import React, {
  type Dispatch,
  ReactElement,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Layout from "@layout/index";
import GenericTable, {
  FilterPill,
  TableAction as GenericTableAction,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import { GENERIC_TABLE_PAGE_SIZE_OPTIONS } from "@constants/genericTable";
import GenericSidebar from "@components/GenericSidebar";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { StatsCardData } from "@components/GenericStatsCards";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useRouter } from "next/router";
import {
  getInvoice,
  downloadInvoicePdf,
  deleteInvoice,
  InvoiceData,
  getInvoices,
} from "@utils/accounts";
import {
  PostInvoiceStripeHostedCheckout,
  PostInvoiceStripePaymentLink,
} from "@utils/accounting";
import { getMinifiedCompanies } from "@utils/crm";
import { useEnsureCustomerForCrmCompany } from "@hooks/billing/useEnsureCustomerForCrmCompany";
import { formatNumber } from "@utils/Helper";

import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import InvoiceViewModal, { InvoiceViewData } from "@components/billings/InvoiceViewModal";
import ColumnEditorModal from "@components/ColumnEditorModal";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { useInvoicePaymentModal } from "@components/billings/InvoicePaymentModal";

// Invoice Status Constants
const STATUS_DRAFT = "draft";
const STATUS_SENT = "sent";
const STATUS_PAID = "paid";
const STATUS_OVERDUE = "overdue";
const STATUS_CANCELLED = "cancelled";
const STATUS_PARTIALLY_PAID = "partially_paid";
const STATUS_FAILED = "failed";
const STATUS_REFUNDED = "refunded";
const STATUS_PENDING = "pending";

const PAY_NOW_ELIGIBLE_STATUSES = new Set<string>([
  STATUS_PENDING,
  STATUS_OVERDUE,
  STATUS_PARTIALLY_PAID,
]);

/** v2: default set includes GenericTable `actions` column key so row actions show unless hidden in column editor. */
const BILLING_INVOICES_COLUMN_STORAGE_KEY = "customerInvoicesSelectedColumns_v2";

const DEFAULT_INVOICE_TABLE_COLUMN_KEYS: string[] = [
  "invoice_number",
  "status",
  "total_amount",
  "amount_due",
  "invoice_date",
  "due_date",
  "actions",
];

function parseStoredInvoiceColumnKeys(
  raw: string | null,
  allowedKeys: readonly string[],
): string[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    const allowed = new Set(allowedKeys);
    const keys = parsed.filter(
      (k): k is string => typeof k === "string" && allowed.has(k),
    );
    return keys.length > 0 ? keys : null;
  } catch {
    return null;
  }
}

function invoiceDownloadActionIcon(
  row: InvoiceData,
  downloadingInvoicePdfId: number | null,
): React.ReactElement {
  if (downloadingInvoicePdfId === row.id) {
    return (
      <Spinner
        animation="border"
        role="status"
        size="sm"
        style={{ width: "1rem", height: "1rem", verticalAlign: "middle" }}
        aria-label="Downloading PDF"
      />
    );
  }
  return <Download size={16} aria-hidden />;
}

function loadInvoiceTableColumnsFromStorage(): string[] {
  if (globalThis.window === undefined) {
    return [...DEFAULT_INVOICE_TABLE_COLUMN_KEYS];
  }
  const stored = parseStoredInvoiceColumnKeys(
    globalThis.window.localStorage.getItem(BILLING_INVOICES_COLUMN_STORAGE_KEY),
    DEFAULT_INVOICE_TABLE_COLUMN_KEYS,
  );
  return stored ?? [...DEFAULT_INVOICE_TABLE_COLUMN_KEYS];
}

type BadgeVariant = ReturnType<
  NonNullable<NonNullable<TableColumn<InvoiceData>["badge"]>["getVariant"]>
>;

function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case STATUS_DRAFT:
      return "secondary";
    case STATUS_SENT:
      return "info";
    case STATUS_PAID:
      return "success";
    case STATUS_OVERDUE:
      return "danger";
    case STATUS_CANCELLED:
      return "dark";
    case STATUS_PARTIALLY_PAID:
      return "warning";
    case STATUS_FAILED:
      return "danger";
    case STATUS_REFUNDED:
      return "danger";
    case STATUS_PENDING:
      return "warning";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case STATUS_DRAFT:
      return "Draft";
    case STATUS_SENT:
      return "Sent";
    case STATUS_PAID:
      return "Paid";
    case STATUS_OVERDUE:
      return "Overdue";
    case STATUS_CANCELLED:
      return "Cancelled";
    case STATUS_PARTIALLY_PAID:
      return "Partially Paid";
    case STATUS_FAILED:
      return "Failed";
    case STATUS_REFUNDED:
      return "Refunded";
    case STATUS_PENDING:
      return "Pending";
    default:
      return status || "Draft";
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || "Unknown error";
  if (typeof error === "string") return error;
  return "Unknown error";
}

const stripePaymentModalPanelStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  padding: 16,
  background: "#FFFFFF",
};

const stripeUrlToolbarButtonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

async function copyTextWithClipboardToast(
  text: string,
  successMessage: string,
  errorMessage: string,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error(errorMessage);
  }
}

type StripePaymentModalPanelProps = Readonly<{
  children: React.ReactNode;
  marginBottom?: number;
}>;

function StripePaymentModalPanel({ children, marginBottom }: StripePaymentModalPanelProps) {
  const style: React.CSSProperties = { ...stripePaymentModalPanelStyle };
  if (marginBottom !== undefined) {
    style.marginBottom = marginBottom;
  }
  return <div style={style}>{children}</div>;
}

type ReadonlyPaymentUrlToolbarProps = Readonly<{
  url: string;
  extraBelowField?: React.ReactNode;
  copySuccessMessage: string;
  copyErrorMessage: string;
  openButtonLabel: string;
  onOpenPaymentUrl: () => void;
  primaryButtonLabel: string;
  onPrimaryClick: () => Promise<void>;
  primaryBusy?: boolean;
}>;

function ReadonlyPaymentUrlToolbar({
  url,
  extraBelowField,
  copySuccessMessage,
  copyErrorMessage,
  openButtonLabel,
  onOpenPaymentUrl,
  primaryButtonLabel,
  onPrimaryClick,
  primaryBusy = false,
}: ReadonlyPaymentUrlToolbarProps) {
  return (
    <>
      <Form.Control type="text" readOnly value={url} style={{ marginBottom: 10 }} />
      {extraBelowField}
      <div style={stripeUrlToolbarButtonRowStyle}>
        <Button
          variant="outline-secondary"
          onClick={async () => {
            await copyTextWithClipboardToast(url, copySuccessMessage, copyErrorMessage);
          }}
        >
          Copy
        </Button>
        <Button variant="outline-primary" onClick={onOpenPaymentUrl}>
          {openButtonLabel}
        </Button>
        <Button
          variant="primary"
          disabled={primaryBusy}
          onClick={async () => {
            await onPrimaryClick();
          }}
        >
          {primaryBusy ? (
            <>
              <Spinner
                animation="border"
                size="sm"
                className="me-2"
                role="status"
                aria-hidden="true"
              />
              {primaryButtonLabel}
            </>
          ) : (
            primaryButtonLabel
          )}
        </Button>
      </div>
    </>
  );
}

type InvoiceFilters = {
  search?: string;
  status?: string;
  invoice_date_from?: string;
  date_from?: string;
  date_to?: string;
};

type InvoiceSummary = {
  paid_count?: number;
  pending_count?: number;
  overdue_count?: number;
};

type StripeModalLabels = {
  successFallback: string;
  failureFallback: string;
};

type StripeInvoiceActionResponse = {
  success?: boolean;
  message?: string;
};

async function applyStripeInvoiceModalResponse(
  response: StripeInvoiceActionResponse | null | undefined,
  labels: StripeModalLabels,
  invoiceId: number,
  loadInvoice: (id: number) => Promise<unknown>,
  bumpRefresh: () => void,
): Promise<void> {
  const success = response?.success === true;
  if (success) {
    toast.success(response?.message || labels.successFallback);
    try {
      await loadInvoice(invoiceId);
    } catch (refreshError) {
      toast.error(`Failed to refresh invoice: ${getErrorMessage(refreshError)}`);
    }
    bumpRefresh();
    return;
  }
  toast.error(response?.message || labels.failureFallback);
}

type InvoiceListFetchOutcome =
  | { kind: "stale" }
  | {
      kind: "success";
      data: InvoiceData[];
      total: number;
      summary?: InvoiceSummary;
    }
  | { kind: "error"; message: string };

async function fetchInvoiceListPage(
  currentRequestId: number,
  requestIdRef: { current: number },
  args: {
    page: number;
    perPage: number;
    memoizedFilters: InvoiceFilters;
    selectedCompanyId: string;
  },
): Promise<InvoiceListFetchOutcome> {
  const { page, perPage, memoizedFilters, selectedCompanyId } = args;
  try {
    const response = await getInvoices({
      page,
      per_page: perPage,
      search: memoizedFilters.search || "",
      crm_company_not_null: true,
      ...memoizedFilters,
      ...(selectedCompanyId ? { crm_company_id: selectedCompanyId } : {}),
    });
    if (currentRequestId !== requestIdRef.current) {
      return { kind: "stale" };
    }
    const data = response?.data || [];
    const total = response?.pagination?.total ?? 0;
    return {
      kind: "success",
      data,
      total,
      summary: response?.summary,
    };
  } catch (error) {
    if (currentRequestId !== requestIdRef.current) {
      return { kind: "stale" };
    }
    return { kind: "error", message: getErrorMessage(error) };
  }
}

const INVOICE_STATUS_FILTER_CHOICES: { value: string; label: string }[] = [
  { value: "", label: "All Status" },
  { value: STATUS_PAID, label: "Paid" },
  { value: STATUS_PENDING, label: "Pending" },
  { value: STATUS_OVERDUE, label: "Overdue" },
  { value: STATUS_PARTIALLY_PAID, label: "Partially Paid" },
  { value: STATUS_FAILED, label: "Failed" },
];

const invoiceFilterPillButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  cursor: "pointer",
  background: "transparent",
  borderRadius: "4px",
  border: "none",
  width: "100%",
  textAlign: "left",
  fontSize: 13,
};

function buildInvoiceStatusFilterPills(
  currentFilters: InvoiceFilters,
  setCurrentFilters: Dispatch<SetStateAction<InvoiceFilters>>,
  applyInvoiceFiltersAndRefresh: () => void,
  handleStatusFilterPillSelect: (optValue: string) => void,
  handleInvoiceDateFromPillChange: (nextValue: string | undefined) => void,
): FilterPill[] {
  return [
    {
      id: "status",
      label: "Status",
      showDropdown: true,
      active: !!currentFilters.status,
      activeLabel: currentFilters.status
        ? getStatusLabel(currentFilters.status)
        : undefined,
      onClear: () => {
        setCurrentFilters((prev) => {
          const { status, ...rest } = prev;
          return rest;
        });
        applyInvoiceFiltersAndRefresh();
      },
      dropdownContent: (
        <div style={{ minWidth: 200 }}>
          {INVOICE_STATUS_FILTER_CHOICES.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              style={{
                ...invoiceFilterPillButtonStyle,
                background:
                  (opt.value === "" && !currentFilters.status) ||
                  currentFilters.status === opt.value
                    ? "#f0f0f0"
                    : "transparent",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => handleStatusFilterPillSelect(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "date_from",
      label: "Date From",
      showDropdown: true,
      active: !!currentFilters.date_from,
      activeLabel: currentFilters.date_from || undefined,
      onClear: () => {
        setCurrentFilters((prev) => {
          const { date_from, ...rest } = prev;
          return rest;
        });
        applyInvoiceFiltersAndRefresh();
      },
      dropdownContent: (
        <div style={{ minWidth: 220, padding: "4px 0" }}>
          <input
            type="date"
            value={currentFilters.date_from ?? ""}
            style={{
              width: "100%",
              padding: "6px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) =>
              handleInvoiceDateFromPillChange(e.target.value || undefined)
            }
          />
        </div>
      ),
    },
  ];
}

type InvoiceStripePaymentLinkModalProps = Readonly<{
  show: boolean;
  onHide: () => void;
  invoiceTitle: string;
  selectedStripeCheckoutUrl: string;
  selectedStripePaymentLinkUrl: string;
  checkoutExpiresLocalText: string;
  checkoutRemainingText: string;
  stripeHostedCheckoutLoading: boolean;
  stripePaymentLinkLoading: boolean;
  openPaymentUrlInNewTabAndCloseModal: (url: string) => void;
  requestStripeHostedCheckoutForModal: (labels: StripeModalLabels) => Promise<void>;
  requestStripePaymentLinkForModal: (labels: StripeModalLabels) => Promise<void>;
}>;

function InvoiceStripePaymentLinkModal({
  show,
  onHide,
  invoiceTitle,
  selectedStripeCheckoutUrl,
  selectedStripePaymentLinkUrl,
  checkoutExpiresLocalText,
  checkoutRemainingText,
  stripeHostedCheckoutLoading,
  stripePaymentLinkLoading,
  openPaymentUrlInNewTabAndCloseModal,
  requestStripeHostedCheckoutForModal,
  requestStripePaymentLinkForModal,
}: InvoiceStripePaymentLinkModalProps) {
  const checkoutExpiryHint = checkoutExpiresLocalText ? (
    <p style={{ marginBottom: 10, color: "#6B7280", fontSize: 13 }}>
      Checkout session expires in about{" "}
      {checkoutRemainingText ? <strong>{checkoutRemainingText}</strong> : null}
    </p>
  ) : undefined;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Generate Payment Link - {invoiceTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <StripePaymentModalPanel marginBottom={14}>
          <h6 style={{ marginBottom: 8 }}>Stripe Checkout link</h6>
          <p style={{ marginBottom: 12, color: "#6B7280", fontSize: 14 }}>
            One-time hosted page. Copy or open in browser. Success -&gt;
            {" "}
            <code>/public/payment/success?session_id=&#123;CHECKOUT_SESSION_ID&#125;</code>;
            <br />
            Cancel payment link -&gt;{" "}
            <code>
              /public/payment/cancel?invoice_id=…&amp;session_id=&#123;CHECKOUT_SESSION_ID&#125;
            </code>
            {"."}
          </p>
          {selectedStripeCheckoutUrl ? (
            <ReadonlyPaymentUrlToolbar
              url={selectedStripeCheckoutUrl}
              extraBelowField={checkoutExpiryHint}
              copySuccessMessage="Checkout link copied"
              copyErrorMessage="Failed to copy checkout link"
              openButtonLabel="Open Stripe"
              onOpenPaymentUrl={() => {
                openPaymentUrlInNewTabAndCloseModal(selectedStripeCheckoutUrl);
              }}
              primaryButtonLabel="New Link"
              primaryBusy={stripeHostedCheckoutLoading}
              onPrimaryClick={async () => {
                await requestStripeHostedCheckoutForModal({
                  successFallback: "New Checkout link generated",
                  failureFallback: "Failed to generate new Checkout link",
                });
              }}
            />
          ) : (
            <Button
              variant="primary"
              disabled={stripeHostedCheckoutLoading}
              onClick={async () => {
                await requestStripeHostedCheckoutForModal({
                  successFallback: "Stripe Checkout link generated",
                  failureFallback: "Failed to generate Stripe Checkout link",
                });
              }}
            >
              {stripeHostedCheckoutLoading ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Generating…
                </>
              ) : (
                "Generate Stripe Checkout Link"
              )}
            </Button>
          )}
        </StripePaymentModalPanel>

        <StripePaymentModalPanel>
          <h6 style={{ marginBottom: 8 }}>Stripe Payment Link</h6>
          <p style={{ marginBottom: 8, color: "#6B7280", fontSize: 14 }}>
            Persistent link visible in Stripe Dashboard -&gt; Payment links.
            Same success/cancel redirects as Checkout.
          </p>
          {selectedStripePaymentLinkUrl ? (
            <ReadonlyPaymentUrlToolbar
              url={selectedStripePaymentLinkUrl}
              copySuccessMessage="Payment link copied"
              copyErrorMessage="Failed to copy payment link"
              openButtonLabel="Open Link"
              onOpenPaymentUrl={() => {
                openPaymentUrlInNewTabAndCloseModal(selectedStripePaymentLinkUrl);
              }}
              primaryButtonLabel="New Link"
              primaryBusy={stripePaymentLinkLoading}
              onPrimaryClick={async () => {
                await requestStripePaymentLinkForModal({
                  successFallback: "New payment link generated",
                  failureFallback: "Failed to generate new payment link",
                });
              }}
            />
          ) : (
            <>
              <p style={{ marginBottom: 12, color: "#6B7280", fontSize: 14 }}>
                No Payment Link yet. Create one to get a persistent URL and see it in Stripe Dashboard.
              </p>
              <Button
                variant="primary"
                disabled={stripePaymentLinkLoading}
                onClick={async () => {
                  await requestStripePaymentLinkForModal({
                    successFallback: "Stripe Payment link generated",
                    failureFallback: "Failed to generate Stripe Payment link",
                  });
                }}
              >
                {stripePaymentLinkLoading ? (
                  <>
                    <Spinner
                      animation="border"
                      size="sm"
                      className="me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Generating…
                  </>
                ) : (
                  "Generate Stripe Payment link"
                )}
              </Button>
            </>
          )}
        </StripePaymentModalPanel>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

const InvoiceList = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<InvoiceFilters>({});
  const [pendingFilters, setPendingFilters] = useState<InvoiceFilters>({});
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [selectedInvoiceTableColumns, setSelectedInvoiceTableColumns] = useState<string[]>(() => [
    ...DEFAULT_INVOICE_TABLE_COLUMN_KEYS,
  ]);

  useEffect(() => {
    setSelectedInvoiceTableColumns(loadInvoiceTableColumnsFromStorage());
  }, []);

  const [companyOptions, setCompanyOptions] = useState<{ id: string | number; name?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const onAccountingCustomerCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEnsureCustomerForCrmCompany(selectedCompanyId, {
    onCreated: onAccountingCustomerCreated,
    errorToastId: "billing_invoices_ensure_customer_failed",
  });

  const { openInvoicePayment: handlePayInvoice, invoicePaymentModal } = useInvoicePaymentModal({
    companyOptions,
    onPaymentSuccess: () => setRefreshKey((prev) => prev + 1),
  });
  
  // View invoice modal states
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<InvoiceViewData | null>(null);
  const [showGeneratePaymentLinkModal, setShowGeneratePaymentLinkModal] = useState(false);
  const [selectedInvoiceForPaymentLink, setSelectedInvoiceForPaymentLink] = useState<InvoiceData | null>(
    null,
  );
  const [checkoutNowMs, setCheckoutNowMs] = useState<number>(() => Date.now());
  const [stripeHostedCheckoutLoading, setStripeHostedCheckoutLoading] = useState(false);
  const [stripePaymentLinkLoading, setStripePaymentLinkLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceData | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState(false);

  const toInvoiceViewData = useCallback((invoice: InvoiceData): InvoiceViewData => {
    const view = invoice as unknown as InvoiceViewData;
    const company = view.company;
    return {
      ...view,
      company: company
        ? { ...company, crm_company_id: company.crm_company_id ?? undefined }
        : undefined,
    };
  }, []);

  const openInvoiceSidebar = useCallback((row: InvoiceData) => {
    setSelectedInvoiceSidebar(row);
    setShowInvoiceSidebar(true);
  }, []);
  const closeInvoiceSidebar = useCallback(() => {
    setShowInvoiceSidebar(false);
    setSelectedInvoiceSidebar(null);
  }, []);

  const handleViewInvoice = useCallback(
    async (invoice: InvoiceData) => {
      try {
        const invoiceDetails = await getInvoice(invoice.id);
        setSelectedInvoiceForView(toInvoiceViewData(invoiceDetails));
        setShowViewInvoiceModal(true);
      } catch (error) {
        toast.error(`Failed to load invoice details: ${getErrorMessage(error)}`);
      }
    },
    [toInvoiceViewData],
  );

  const closeViewInvoiceModal = useCallback(() => {
    setShowViewInvoiceModal(false);
    setSelectedInvoiceForView(null);
  }, []);

  const loadInvoiceIntoPaymentLinkModal = useCallback(async (invoiceId: number) => {
    const invoiceDetails = await getInvoice(invoiceId);
    setSelectedInvoiceForPaymentLink(invoiceDetails);
    return invoiceDetails;
  }, []);

  const openGeneratePaymentLinkModal = useCallback(
    async (invoice: InvoiceData) => {
      try {
        await loadInvoiceIntoPaymentLinkModal(invoice.id);
        setShowGeneratePaymentLinkModal(true);
      } catch (error) {
        toast.error(`Failed to load invoice: ${getErrorMessage(error)}`);
      }
    },
    [loadInvoiceIntoPaymentLinkModal],
  );

  const closeGeneratePaymentLinkModal = useCallback(() => {
    setShowGeneratePaymentLinkModal(false);
    setSelectedInvoiceForPaymentLink(null);
    setStripeHostedCheckoutLoading(false);
    setStripePaymentLinkLoading(false);
  }, []);

  const openPaymentUrlInNewTabAndCloseModal = useCallback(
    (url: string) => {
      const trimmed = String(url ?? "").trim();
      if (!trimmed) {
        return;
      }
      globalThis.open(trimmed, "_blank", "noopener,noreferrer");
      closeGeneratePaymentLinkModal();
    },
    [closeGeneratePaymentLinkModal],
  );

  const requestStripeHostedCheckoutForModal = useCallback(
    async (labels: StripeModalLabels) => {
      if (!selectedInvoiceForPaymentLink?.id) {
        return;
      }
      const invoiceId = selectedInvoiceForPaymentLink.id;
      setStripeHostedCheckoutLoading(true);
      try {
        const response = (await PostInvoiceStripeHostedCheckout(
          invoiceId,
        )) as StripeInvoiceActionResponse | null | undefined;
        await applyStripeInvoiceModalResponse(
          response,
          labels,
          invoiceId,
          loadInvoiceIntoPaymentLinkModal,
          () => setRefreshKey((prev) => prev + 1),
        );
      } catch {
        // Toast is handled in API helper.
      } finally {
        setStripeHostedCheckoutLoading(false);
      }
    },
    [loadInvoiceIntoPaymentLinkModal, selectedInvoiceForPaymentLink],
  );

  const requestStripePaymentLinkForModal = useCallback(
    async (labels: StripeModalLabels) => {
      if (!selectedInvoiceForPaymentLink?.id) {
        return;
      }
      const invoiceId = selectedInvoiceForPaymentLink.id;
      setStripePaymentLinkLoading(true);
      try {
        const response = (await PostInvoiceStripePaymentLink(
          invoiceId,
        )) as StripeInvoiceActionResponse | null | undefined;
        await applyStripeInvoiceModalResponse(
          response,
          labels,
          invoiceId,
          loadInvoiceIntoPaymentLinkModal,
          () => setRefreshKey((prev) => prev + 1),
        );
      } catch {
        // Toast is handled in API helper.
      } finally {
        setStripePaymentLinkLoading(false);
      }
    },
    [loadInvoiceIntoPaymentLinkModal, selectedInvoiceForPaymentLink],
  );

  const selectedStripeCheckoutUrl = useMemo(
    () => String((selectedInvoiceForPaymentLink as any)?.stripe_checkout_url ?? "").trim(),
    [selectedInvoiceForPaymentLink],
  );
  const selectedStripeCheckoutExpiresAt = useMemo(
    () => String((selectedInvoiceForPaymentLink as any)?.stripe_checkout_expires_at ?? "").trim(),
    [selectedInvoiceForPaymentLink],
  );
  const selectedStripePaymentLinkUrl = useMemo(
    () => String((selectedInvoiceForPaymentLink as any)?.stripe_payment_link_url ?? "").trim(),
    [selectedInvoiceForPaymentLink],
  );

  useEffect(() => {
    if (!showGeneratePaymentLinkModal || !selectedStripeCheckoutExpiresAt) {
      return;
    }
    const timer = globalThis.setInterval(() => {
      setCheckoutNowMs(Date.now());
    }, 1000);
    return () => globalThis.clearInterval(timer);
  }, [showGeneratePaymentLinkModal, selectedStripeCheckoutExpiresAt]);

  const checkoutExpiresLocalText = useMemo(() => {
    if (!selectedStripeCheckoutExpiresAt) return "";
    const m = moment.utc(selectedStripeCheckoutExpiresAt).local();
    return m.isValid() ? m.format("DD-MMM-YYYY hh:mm:ss A") : "";
  }, [selectedStripeCheckoutExpiresAt]);

  const checkoutRemainingText = useMemo(() => {
    if (!selectedStripeCheckoutExpiresAt) return "";
    const expiresMs = moment.utc(selectedStripeCheckoutExpiresAt).valueOf();
    if (!Number.isFinite(expiresMs)) return "";
    const diffMs = expiresMs - checkoutNowMs;
    if (diffMs <= 0) return "Expired";
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }, [selectedStripeCheckoutExpiresAt, checkoutNowMs]);

  const handleOpenFiltersSidebar = useCallback(() => {
    setPendingFilters({ ...currentFilters });
    setShowFiltersSidebar(true);
  }, [currentFilters]);
  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  const tableColumns: TableColumn<InvoiceData>[] = useMemo(
    () => [
      {
        key: "invoice_number",
        label: "Invoice Number",
        sortable: true,
        render: (row) => <span>#{row.invoice_number}</span>,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        type: "badge",
        accessor: (row) => getStatusLabel(row.status || STATUS_DRAFT),
        badge: { getVariant: (row) => getStatusBadgeVariant(row.status || STATUS_DRAFT) },
      },
      {
        key: "total_amount",
        label: "Total Amount",
        sortable: true,
        render: (row) => (
          <span>
            {row.currency_code || "AED"} {formatNumber(Number.parseFloat(row?.total_amount || "0"))}
          </span>
        ),
      },
      {
        key: "amount_due",
        label: "Amount Due",
        sortable: true,
        render: (row) => (
          <span>
            {row.currency_code || "AED"} {formatNumber(Number.parseFloat(row?.amount_due || "0"))}
          </span>
        ),
      },
      {
        key: "invoice_date",
        label: "Invoice Date",
        sortable: true,
        accessor: (row) => (row.invoice_date ? moment(row.invoice_date).format("DD-MMM-YYYY") : ""),
      },
      {
        key: "due_date",
        label: "Due Date",
        sortable: true,
        accessor: (row) =>
          row.due_date ? moment(row.due_date).format("DD-MMM-YYYY") : "No due date",
      },
    ],
    []
  );

  const [downloadingInvoicePdfId, setDownloadingInvoicePdfId] = useState<number | null>(null);

  const handleDownloadPDF = useCallback(async (invoice: InvoiceData) => {
    setDownloadingInvoicePdfId(invoice.id);
    try {
      await downloadInvoicePdf(invoice.id);
    } catch (error) {
      toast.error(`Failed to download invoice PDF: ${getErrorMessage(error)}`);
    } finally {
      setDownloadingInvoicePdfId(null);
    }
  }, []);

  const openDeleteInvoiceModal = useCallback((invoice: InvoiceData) => {
    setDeleteTarget(invoice);
    setDeleteModalOpen(true);
  }, []);

  const closeDeleteInvoiceModal = useCallback(() => {
    if (deletingInvoice) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }, [deletingInvoice]);

  const confirmDeleteInvoice = useCallback(async () => {
    if (!deleteTarget) return;
    setDeletingInvoice(true);
    try {
      await deleteInvoice(deleteTarget.id);
      setRefreshKey((prev) => prev + 1);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(`Failed to delete invoice: ${getErrorMessage(error)}`);
    } finally {
      setDeletingInvoice(false);
    }
  }, [deleteTarget]);

  const invoiceTableActions: GenericTableAction<InvoiceData>[] = useMemo(
    () => [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row: InvoiceData) => handleViewInvoice(row),
      },

      

      {
        label: "Generate Payment Link",
        icon: <Plus size={16} />,
        show: (row: InvoiceData) =>
          String(row.status ?? "").trim().toLowerCase() === STATUS_PENDING,
        onClick: (row: InvoiceData) => openGeneratePaymentLinkModal(row),
      },
      {
        label: "Edit",
        icon: <Pencil size={16} />,
        show: (row: InvoiceData) =>
          String(row.status ?? "").trim().toLowerCase() === STATUS_PENDING,
        onClick: (row: InvoiceData) =>
          router.push(`/billing/invoices/edit/${row.id}`),
      },
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        show: (row: InvoiceData) =>
          String(row.status ?? "").trim().toLowerCase() === STATUS_PENDING,
        onClick: (row: InvoiceData) => openDeleteInvoiceModal(row),
      },
      {
        label: "Pay Now",
        icon: <DollarSign size={16} />,
        // variant: "danger",
        show: (row: InvoiceData) =>
          PAY_NOW_ELIGIBLE_STATUSES.has(row.status ?? "") &&
          !!session?.user?.permissions?.includes("pay-invoices-billing"),
        onClick: (row: InvoiceData) => handlePayInvoice(row),
      },
      {
        label: "Download",
        icon: (row: InvoiceData) =>
          invoiceDownloadActionIcon(row, downloadingInvoicePdfId),
        disabled: (row: InvoiceData) => downloadingInvoicePdfId === row.id,
        onClick: (row: InvoiceData) => handleDownloadPDF(row),
      },
    ],
    [
      session?.user?.permissions,
      handleViewInvoice,
      handlePayInvoice,
      handleDownloadPDF,
      downloadingInvoicePdfId,
      openDeleteInvoiceModal,
      openGeneratePaymentLinkModal,
    ],
  );

  const deleteModalItemName = useMemo(() => {
    if (!deleteTarget) return undefined;
    if (deleteTarget.invoice_number) return `Invoice #${String(deleteTarget.invoice_number)}`;
    return `Invoice #${String(deleteTarget.id)}`;
  }, [deleteTarget]);

  const invoiceFilterFields: FilterField[] = useMemo(
    () => [
      {
        id: "search",
        label: "Search",
        type: "text",
        value: pendingFilters.search ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, search: value || undefined })),
        placeholder: "Search by invoice number...",
      },
      {
        id: "status",
        label: "Status",
        type: "dropdown",
        value: pendingFilters.status ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, status: value || undefined })),
        options: [
          { value: "", label: "All Status" },
          { value: STATUS_PAID, label: "Paid" },
          { value: STATUS_PENDING, label: "Pending" },
          { value: STATUS_OVERDUE, label: "Overdue" },
          { value: STATUS_PARTIALLY_PAID, label: "Partially Paid" },
          { value: STATUS_FAILED, label: "Failed" },
        ],
      },
      
      {
        id: "due_date_from",
        label: "Date From",
        type: "date",
        value: pendingFilters.date_from ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, date_from: value || undefined })),
      },
      {
        id: "due_date_to",
        label: "Date To",
        type: "date",
        value: pendingFilters.date_to ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, date_to: value || undefined })),
      },
    ],
    [
      pendingFilters.search,
      pendingFilters.status,
      pendingFilters.invoice_date_from,
      pendingFilters.date_from,
      pendingFilters.date_to,
    ]
  );

  useEffect(() => {
    const fetchCompanyOptions = async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        setCompanyOptions(result ?? []);
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error(`Failed to load companies: ${message}`, {
          toastId: "billing_companies_load_failed",
        });
      }
    };

    fetchCompanyOptions();
  }, []);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);

  const [invoiceList, setInvoiceList] = useState<InvoiceData[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
  });
  const [selectedInvoiceSidebar, setSelectedInvoiceSidebar] = useState<InvoiceData | null>(null);
  const [showInvoiceSidebar, setShowInvoiceSidebar] = useState(false);
  const invoiceRequestIdRef = useRef(0);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [totalAllInvoices, setTotalAllInvoices] = useState(0);
  const canPayInvoices = session?.user?.permissions?.includes("pay-invoices-billing") === true;
  const canPaySelectedInvoice =
    !!selectedInvoiceSidebar &&
    canPayInvoices &&
    PAY_NOW_ELIGIBLE_STATUSES.has(selectedInvoiceSidebar.status ?? "");

  const loadInvoices = useCallback(async () => {
    invoiceRequestIdRef.current += 1;
    const currentRequestId = invoiceRequestIdRef.current;
    setInvoiceLoading(true);
    try {
      const outcome = await fetchInvoiceListPage(
        currentRequestId,
        invoiceRequestIdRef,
        {
          page: pagination.currentPage,
          perPage: pagination.rowsPerPage,
          memoizedFilters,
          selectedCompanyId,
        },
      );
      if (outcome.kind === "stale") {
        return;
      }
      if (outcome.kind === "error") {
        toast.error(`Failed to load invoices: ${outcome.message}`, {
          toastId: "billing_invoices_load_failed",
        });
        setInvoiceList([]);
        setTotalRecords(0);
        setPagination((prev) => ({ ...prev, totalRows: 0 }));
        return;
      }
      setInvoiceList(outcome.data);
      setTotalRecords(outcome.total);
      setPagination((prev) => ({ ...prev, totalRows: outcome.total }));
      if (!memoizedFilters.status) {
        setTotalAllInvoices(outcome.total);
      }
      if (outcome.summary) {
        setSummary(outcome.summary);
      }
    } finally {
      if (invoiceRequestIdRef.current === currentRequestId) {
        setInvoiceLoading(false);
      }
    }
  }, [pagination.currentPage, pagination.rowsPerPage, memoizedFilters, selectedCompanyId]);

  React.useEffect(() => {
    loadInvoices();
  }, [loadInvoices, refreshKey]);

  const applyInvoiceFiltersAndRefresh = useCallback(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleStatusFilterPillSelect = useCallback(
    (optValue: string) => {
      setCurrentFilters((prev) => {
        if (!optValue) {
          const { status, ...rest } = prev;
          return rest;
        }
        return { ...prev, status: optValue };
      });
      applyInvoiceFiltersAndRefresh();
    },
    [applyInvoiceFiltersAndRefresh],
  );

  const handleInvoiceDateFromPillChange = useCallback(
    (nextValue: string | undefined) => {
      setCurrentFilters((prev) => {
        if (!nextValue) {
          const { date_from, ...rest } = prev;
          return rest;
        }
        return { ...prev, date_from: nextValue };
      });
      applyInvoiceFiltersAndRefresh();
    },
    [applyInvoiceFiltersAndRefresh],
  );

  // Filter pills must use GenericTable `FilterPill` shape (`showDropdown` + `dropdownContent` / `dropdownOptions`), not ad-hoc `type`/`options`.
  const invoiceFilterPills = React.useMemo<FilterPill[]>(
    () =>
      buildInvoiceStatusFilterPills(
        currentFilters,
        setCurrentFilters,
        applyInvoiceFiltersAndRefresh,
        handleStatusFilterPillSelect,
        handleInvoiceDateFromPillChange,
      ),
    [
      currentFilters,
      applyInvoiceFiltersAndRefresh,
      handleStatusFilterPillSelect,
      handleInvoiceDateFromPillChange,
    ],
  );

  // Stats cards for invoices
  const invoiceStatsCards: StatsCardData[] = React.useMemo(
    () => [
      {
        title: "Total Invoices",
        value: totalRecords,
        icon: Receipt,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
      },
      {
        title: "Paid",
        value: summary?.paid_count ?? 0,
        icon: CheckCircle,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
      },
      {
        title: "Pending",
        value: summary?.pending_count ?? 0,
        icon: Clock,
        iconColor: "#F59E0B",
        iconBgColor: "#FEF3C7",
      },
      {
        title: "Overdue",
        value: summary?.overdue_count ?? 0,
        icon: AlertCircle,
        iconColor: "#EF4444",
        iconBgColor: "#FEE2E2",
      },
    ],
    [summary, totalRecords]
  );

  // Render Create Invoice Button
  const renderCreateInvoiceButton = () => (
    <div
      style={{
        position: "absolute",
        right: "19px",
        top: "18px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <button
        onClick={() => {
          router.push('/billing/create-invoice');
        }}
        style={{
          padding: "9px 13px",
          backgroundColor: "#000000",
          color: "#ffffff",
          border: "none",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1a1a1a";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#000000";
        }}
      >
        <Plus size={16} />
        Create Invoice
      </button>
    </div>
  );

  // Handle preview button click
  const handlePreviewClick = useCallback((invoice: InvoiceData) => {
    openInvoiceSidebar(invoice);
  }, [openInvoiceSidebar]);

  // Toolbar configuration
  const invoicesToolbarConfig: ToolbarConfig = {
    showTabs: true,
    tabsDropdownLabel: "Invoices",
    tabs: [
      {
        id: "all",
        label: "All Invoices",
        count: totalAllInvoices,
        removable: false,
      },
    ],
    activeTab: "all",
    onTabChange: () => {},
    onTabAdd: () => {},
    onTabRemove: () => {},

    showSearch: true,
    searchValue: invoiceSearch,
    searchPlaceholder: "Search invoices...",
    onSearchChange: setInvoiceSearch,
    onSearch: () => {
      setCurrentFilters((prev) => ({
        ...prev,
        search: invoiceSearch || undefined,
      }));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setRefreshKey((prev) => prev + 1);
    },

    showTableViewDropdown: true,
    currentTableView: "table",
    onTableViewChange: () => {},

    showEditColumns: true,
    onEditColumnsClick: () => setShowColumnEditor(true),

    showFiltersButton: true,
    onFiltersClick: handleOpenFiltersSidebar,

    showFilterPills: true,
    filterPills: invoiceFilterPills,
    showMoreFiltersButton: true,
    showAdvancedFilters: true,
    onAdvancedFiltersClick: handleOpenFiltersSidebar,

    showSortButton: true,
    showExportButton: false,
    onExportClick: () => {},

    rightActions: renderCreateInvoiceButton(),
  };




  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Billing"
        mainLink="/billing/dashboard"
        subTitle="Invoices"
      />

      <div className="container-fluid">
        <div className="mb-3 d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            style={{ width: '220px' }}
            value={String(selectedCompanyId)}
            onChange={(e) => setSelectedCompanyId(e.target.value === '' ? '' : e.target.value)}
          >
            <option value="">All companies</option>
            {companyOptions.map((c: { id: string | number; name?: string }) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.id}
              </option>
            ))}
          </Form.Select>
        </div>

      <GenericTable<InvoiceData>
        data={invoiceList}
        columns={tableColumns}
        actions={invoiceTableActions}
        showActions={true}
        actionsLabel="Actions"
        customizableColumns={true}
        defaultSelectedColumns={DEFAULT_INVOICE_TABLE_COLUMN_KEYS}
        columnStorageKey={BILLING_INVOICES_COLUMN_STORAGE_KEY}
        selectedColumns={selectedInvoiceTableColumns}
        onColumnChange={setSelectedInvoiceTableColumns}
        pagination={{
          currentPage: pagination.currentPage,
          rowsPerPage: pagination.rowsPerPage,
          totalRows: totalRecords,
          pageSizeOptions: GENERIC_TABLE_PAGE_SIZE_OPTIONS,
        }}
        onPaginationChange={(page, rowsPerPage) => {
          setPagination((prev) => ({ ...prev, currentPage: page, rowsPerPage }));
        }}
        sortable={true}
        loading={invoiceLoading}
        emptyMessage="No invoices found"
        loadingMessage="Loading invoices..."
        hover={true}
        uniqueKey="id"
        onRowClick={(row) => openInvoiceSidebar(row)}
        onPreviewClick={(row) => handlePreviewClick(row)}
        showToolbar={true}
        toolbar={invoicesToolbarConfig}
        statsCards={invoiceStatsCards}
        fixedHeight={true}
        maxHeight="calc(100vh - 345px)"
      />
      </div>

      <GenericSidebar
        isOpen={showInvoiceSidebar}
        onClose={closeInvoiceSidebar}
        title={selectedInvoiceSidebar ? `Invoice #${selectedInvoiceSidebar.invoice_number}` : "Invoice Details"}
        subtitle={selectedInvoiceSidebar?.company?.name ?? ""}
        metadata={selectedInvoiceSidebar?.due_date ? `Due: ${moment(selectedInvoiceSidebar.due_date).format("DD-MMM-YYYY")}` : undefined}
        width="400px"
        sections={[
          {
            id: "invoice-info",
            title: "Invoice Information",
            icon: FileText,
            fields: [
              { label: "Invoice Number", value: selectedInvoiceSidebar ? `#${selectedInvoiceSidebar.invoice_number}` : "N/A" },
              {
                label: "Status",
                value: selectedInvoiceSidebar ? getStatusLabel(selectedInvoiceSidebar.status || STATUS_DRAFT) : "N/A",
                type: "badge",
                badgeVariant: selectedInvoiceSidebar ? getStatusBadgeVariant(selectedInvoiceSidebar.status || STATUS_DRAFT) : "secondary",
              },
              {
                label: "Total Amount",
                value: selectedInvoiceSidebar
                  ? `${selectedInvoiceSidebar.currency_code || "AED"} ${formatNumber(Number.parseFloat(selectedInvoiceSidebar?.total_amount || "0"))}`
                  : "N/A",
              },
              {
                label: "Amount Due",
                value: selectedInvoiceSidebar
                  ? `${selectedInvoiceSidebar.currency_code || "AED"} ${formatNumber(Number.parseFloat(selectedInvoiceSidebar?.amount_due || "0"))}`
                  : "N/A",
              },
              {
                label: "Invoice Date",
                value: selectedInvoiceSidebar?.invoice_date ?? null,
                type: "date",
                icon: Calendar,
              },
              {
                label: "Due Date",
                value: selectedInvoiceSidebar?.due_date ?? null,
                type: "date",
                icon: Calendar,
              },
            ],
          },
          {
            id: "company-info",
            title: "Bill To",
            icon: FileText,
            fields: [
              { label: "Company", value: selectedInvoiceSidebar?.company?.name ?? "N/A" },
              { label: "Country", value: selectedInvoiceSidebar?.company?.country ?? "N/A" },
            ].filter((f) => f.value !== "N/A" || f.label === "Company"),
          },
        ]}
        actions={[
          {
            label: "View Full Invoice",
            icon: FileText,
            variant: "primary",
            onClick: () => {
              if (selectedInvoiceSidebar) {
                setSelectedInvoiceForView(toInvoiceViewData(selectedInvoiceSidebar));
                setShowViewInvoiceModal(true);
                closeInvoiceSidebar();
              }
            },
          },
          {
            label: "Pay Now",
            icon: DollarSign,
            variant: "success",
            show: canPaySelectedInvoice,
            onClick: () => {
              if (selectedInvoiceSidebar) {
                handlePayInvoice(selectedInvoiceSidebar);
                closeInvoiceSidebar();
              }
            },
          },
          {
            label: "Download PDF",
            icon: Download,
            variant: "outline-primary",
            onClick: () => {
              if (selectedInvoiceSidebar) {
                handleDownloadPDF(selectedInvoiceSidebar);
              }
            },
          },
        ]}
      />

      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={handleCloseFiltersSidebar}
        title="Filters"
        subtitle="Filter invoices by status, date range, and search"
        width="400px"
        filters={invoiceFilterFields}
        onApply={() => {
          setCurrentFilters({ ...pendingFilters });
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setPendingFilters({});
          setCurrentFilters({});
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
          setShowFiltersSidebar(false);
        }}
      />

      {invoicePaymentModal}

      <DeleteConfirmationModal
        show={deleteModalOpen}
        onHide={closeDeleteInvoiceModal}
        onConfirm={() => {
          confirmDeleteInvoice().catch(() => undefined);
        }}
        itemType="invoice"
        itemName={deleteModalItemName}
        loading={deletingInvoice}
      />

      <InvoiceStripePaymentLinkModal
        show={showGeneratePaymentLinkModal}
        onHide={closeGeneratePaymentLinkModal}
        invoiceTitle={String(
          selectedInvoiceForPaymentLink?.invoice_number ??
            selectedInvoiceForPaymentLink?.id ??
            "",
        )}
        selectedStripeCheckoutUrl={selectedStripeCheckoutUrl}
        selectedStripePaymentLinkUrl={selectedStripePaymentLinkUrl}
        checkoutExpiresLocalText={checkoutExpiresLocalText}
        checkoutRemainingText={checkoutRemainingText}
        stripeHostedCheckoutLoading={stripeHostedCheckoutLoading}
        stripePaymentLinkLoading={stripePaymentLinkLoading}
        openPaymentUrlInNewTabAndCloseModal={openPaymentUrlInNewTabAndCloseModal}
        requestStripeHostedCheckoutForModal={requestStripeHostedCheckoutForModal}
        requestStripePaymentLinkForModal={requestStripePaymentLinkForModal}
      />

      {/* View Invoice Modal */}
      <InvoiceViewModal
        show={showViewInvoiceModal}
        onHide={closeViewInvoiceModal}
        invoice={selectedInvoiceForView}
        companyName={session?.user?.company_name || ""}
        companyOptions={companyOptions}
        isTenantInvoice={false}
      />

      <ColumnEditorModal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        title="Customize Columns"
        columns={tableColumns.map((c) => ({ key: c.key, label: c.label }))}
        selectedColumnKeys={selectedInvoiceTableColumns}
        onApply={(keys) => {
          setSelectedInvoiceTableColumns(keys);
          if (globalThis.window !== undefined) {
            globalThis.window.localStorage.setItem(
              BILLING_INVOICES_COLUMN_STORAGE_KEY,
              JSON.stringify(keys),
            );
          }
        }}
      />
    </React.Fragment>
  );
};

InvoiceList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default InvoiceList;

