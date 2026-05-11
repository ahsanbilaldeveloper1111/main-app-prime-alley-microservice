import "@components/billings/customer/billingCustomerDatatableCommonTabsStyles";
import "@assets/scss/billing.scss";
import { BillingCustomerPortalTableShell } from "@components/billings/customer/BillingCustomerPortalTableShell";

import React, {
  type Dispatch,
  ReactElement,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
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
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { useRouter } from "next/router";
import {
  getInvoice,
  downloadInvoicePdf,
  deleteInvoice,
  InvoiceData,
} from "@utils/accounts";
import { useBillingCustomerInvoiceListQuery } from "@page-modules/billing/customer/useBillingCustomerInvoiceListQuery";
import {
  PostInvoiceStripeHostedCheckout,
  PostInvoiceStripePaymentLink,
} from "@utils/accounting";
import { useEnsureCustomerForCrmCompany } from "@hooks/billing/useEnsureCustomerForCrmCompany";
import { useMinifiedCompaniesForSelect } from "@hooks/billing/useMinifiedCompaniesForSelect";
import { BillingCustomerCompanySelect } from "@components/billings/customer/BillingCustomerCompanySelect";
import { formatNumber } from "@utils/Helper";
import { getBillingCustomerPortalTabsDropdownItems } from "@utils/billingProductsTabs";
import { billingCustomerRoutes } from "@utils/billingCustomerRoutes";
import { getErrorMessage } from "@utils/errors";

import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { usePermissions } from "@utils/permissionUtils";
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
import { HEADER_CONSTANTS } from "@constants/headerConstants";

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
const { PERMISSIONS } = HEADER_CONSTANTS;

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
        className="bc-spinner-1rem"
        aria-label="Downloading PDF"
      />
    );
  }
  return <Download size={16} aria-hidden />;
}

type InvoiceDownloadTableActionProps = Readonly<{
  row: InvoiceData;
  downloadingInvoicePdfId: number | null;
  onDownload: (invoice: InvoiceData) => Promise<void>;
}>;

function InvoiceDownloadTableAction({
  row,
  downloadingInvoicePdfId,
  onDownload,
}: InvoiceDownloadTableActionProps) {
  const busy = downloadingInvoicePdfId === row.id;
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (busy) return;
    Promise.resolve(onDownload(row)).catch(() => undefined);
  };
  return (
    <Button
      variant="link"
      size="sm"
      disabled={busy}
      className="p-1"
      title="Download"
      onClick={handleClick}
    >
      {invoiceDownloadActionIcon(row, downloadingInvoicePdfId)}
    </Button>
  );
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
  return (
    <div
      className="bc-stripe-modal-panel"
      style={marginBottom === undefined ? undefined : { marginBottom }}
    >
      {children}
    </div>
  );
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
      <Form.Control type="text" readOnly value={url} className="mb-2" />
      {extraBelowField}
      <div className="bc-stripe-url-toolbar-row">
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

const INVOICE_STATUS_FILTER_CHOICES: { value: string; label: string }[] = [
  { value: "", label: "All Status" },
  { value: STATUS_PAID, label: "Paid" },
  { value: STATUS_PENDING, label: "Pending" },
  { value: STATUS_OVERDUE, label: "Overdue" },
  { value: STATUS_PARTIALLY_PAID, label: "Partially Paid" },
  { value: STATUS_FAILED, label: "Failed" },
];

function buildInvoiceStatusFilterPills(
  currentFilters: InvoiceFilters,
  setCurrentFilters: Dispatch<SetStateAction<InvoiceFilters>>,
  applyInvoiceFiltersAndRefresh: () => void,
  handleStatusFilterPillSelect: (optValue: string) => void,
  handleInvoiceDateFromPillChange: (nextValue: string | undefined) => void,
  handleInvoiceDateToPillChange: (nextValue: string | undefined) => void,
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
        <div className="bc-filter-dropdown-min-200">
          {INVOICE_STATUS_FILTER_CHOICES.map((opt) => {
            const isActive =
              (opt.value === "" && !currentFilters.status) ||
              currentFilters.status === opt.value;
            return (
            <button
              key={opt.value || "all"}
              type="button"
              className={`bc-filter-pill-option${isActive ? " bc-filter-pill-option--active" : ""}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => handleStatusFilterPillSelect(opt.value)}
            >
              {opt.label}
            </button>
            );
          })}
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
        <div className="bc-filter-dropdown-min-220">
          <input
            type="date"
            value={currentFilters.date_from ?? ""}
            className="bc-filter-date-input"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) =>
              handleInvoiceDateFromPillChange(e.target.value || undefined)
            }
          />
        </div>
      ),
    },
    {
      id: "date_to",
      label: "Date To",
      showDropdown: true,
      active: !!currentFilters.date_to,
      activeLabel: currentFilters.date_to || undefined,
      onClear: () => {
        setCurrentFilters((prev) => {
          const { date_to, ...rest } = prev;
          return rest;
        });
        applyInvoiceFiltersAndRefresh();
      },
      dropdownContent: (
        <div className="bc-filter-dropdown-min-220">
          <input
            type="date"
            value={currentFilters.date_to ?? ""}
            className="bc-filter-date-input"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) =>
              handleInvoiceDateToPillChange(e.target.value || undefined)
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
    <p className="bc-modal-muted-hint">
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
          <h6 className="bc-modal-section-title">Stripe Checkout link</h6>
          <p className="bc-modal-muted-p">
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
          <h6 className="bc-modal-section-title">Stripe Payment Link</h6>
          <p className="bc-modal-muted-p bc-modal-muted-p--tight">
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
              <p className="bc-modal-muted-p">
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
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const canCreateInvoice = hasPermission(PERMISSIONS.CREATE_INVOICES_BILLING);
  const canUpdateInvoice = hasPermission(PERMISSIONS.UPDATE_INVOICES_BILLING);
  const canDeleteInvoice = hasPermission(PERMISSIONS.DELETE_INVOICES_BILLING);
  const tabsDropdownItems = useMemo(
    () => getBillingCustomerPortalTabsDropdownItems((permission) => hasPermission(permission)),
    [hasPermission],
  );
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

  const { companyOptions } = useMinifiedCompaniesForSelect("billing_companies_load_failed");
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
    if (!canDeleteInvoice || !deleteTarget) return;
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
  }, [deleteTarget, canDeleteInvoice]);

  const invoiceTableActions: GenericTableAction<InvoiceData>[] = useMemo(
    () => [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row: InvoiceData) => {
          Promise.resolve(handleViewInvoice(row)).catch(() => undefined);
        },
      },

      

      {
        label: "Generate Payment Link",
        icon: <Plus size={16} />,
        show: (row: InvoiceData) =>
          String(row.status ?? "").trim().toLowerCase() === STATUS_PENDING,
        onClick: (row: InvoiceData) => {
          Promise.resolve(openGeneratePaymentLinkModal(row)).catch(() => undefined);
        },
      },
      {
        label: "Edit",
        icon: <Pencil size={16} />,
        show: (row: InvoiceData) =>
          canUpdateInvoice &&
          String(row.status ?? "").trim().toLowerCase() === STATUS_PENDING,
        onClick: (row: InvoiceData) =>
          router.push(billingCustomerRoutes.invoicesEdit(row.id)),
      },
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        show: (row: InvoiceData) =>
          canDeleteInvoice &&
          String(row.status ?? "").trim().toLowerCase() === STATUS_PENDING,
        onClick: (row: InvoiceData) => openDeleteInvoiceModal(row),
      },
      {
        label: "Pay Now",
        icon: <DollarSign size={16} />,
        // variant: "danger",
        show: (row: InvoiceData) =>
          PAY_NOW_ELIGIBLE_STATUSES.has(row.status ?? "") &&
          !!session?.user?.permissions?.includes(PERMISSIONS.PAY_INVOICES_BILLING),
        onClick: (row: InvoiceData) => {
          Promise.resolve(handlePayInvoice(row)).catch(() => undefined);
        },
      },
      {
        label: "Download",
        render: (row: InvoiceData) => (
          <InvoiceDownloadTableAction
            row={row}
            downloadingInvoicePdfId={downloadingInvoicePdfId}
            onDownload={handleDownloadPDF}
          />
        ),
      },
    ],
    [
      session?.user?.permissions,
      canUpdateInvoice,
      canDeleteInvoice,
      handleViewInvoice,
      handlePayInvoice,
      handleDownloadPDF,
      downloadingInvoicePdfId,
      openDeleteInvoiceModal,
      openGeneratePaymentLinkModal,
      router,
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

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);
  const invoiceFiltersKey = useMemo(
    () =>
      JSON.stringify({
        search: memoizedFilters.search ?? "",
        status: memoizedFilters.status ?? "",
        invoice_date_from: memoizedFilters.invoice_date_from ?? "",
        date_from: memoizedFilters.date_from ?? "",
        date_to: memoizedFilters.date_to ?? "",
      }),
    [
      memoizedFilters.search,
      memoizedFilters.status,
      memoizedFilters.invoice_date_from,
      memoizedFilters.date_from,
      memoizedFilters.date_to,
    ],
  );

  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
  });

  const invoicesQuery = useBillingCustomerInvoiceListQuery({
    crmKey: selectedCompanyId || "all",
    page: pagination.currentPage,
    perPage: pagination.rowsPerPage,
    filtersKey: invoiceFiltersKey,
    refreshKey,
    filters: memoizedFilters,
  });

  const invoiceList = invoicesQuery.data?.list ?? [];
  const invoiceLoading = invoicesQuery.isFetching;
  const totalRecords = invoicesQuery.data?.total ?? 0;
  const summary = (invoicesQuery.data?.summary ?? null) as InvoiceSummary | null;

  useEffect(() => {
    const total = invoicesQuery.data?.total ?? 0;
    setPagination((prev) => ({ ...prev, totalRows: total }));
  }, [invoicesQuery.data?.total]);

  const [totalAllInvoices, setTotalAllInvoices] = useState(0);
  useEffect(() => {
    if (!memoizedFilters.status && invoicesQuery.data != null) {
      setTotalAllInvoices(invoicesQuery.data.total);
    }
  }, [memoizedFilters.status, invoicesQuery.data]);

  const [selectedInvoiceSidebar, setSelectedInvoiceSidebar] = useState<InvoiceData | null>(null);
  const [showInvoiceSidebar, setShowInvoiceSidebar] = useState(false);
  const canPayInvoices =
    session?.user?.permissions?.includes(PERMISSIONS.PAY_INVOICES_BILLING) === true;
  const canPaySelectedInvoice =
    !!selectedInvoiceSidebar &&
    canPayInvoices &&
    PAY_NOW_ELIGIBLE_STATUSES.has(selectedInvoiceSidebar.status ?? "");

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

  const handleInvoiceDateToPillChange = useCallback(
    (nextValue: string | undefined) => {
      setCurrentFilters((prev) => {
        if (!nextValue) {
          const { date_to, ...rest } = prev;
          return rest;
        }
        return { ...prev, date_to: nextValue };
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
        handleInvoiceDateToPillChange,
      ),
    [
      currentFilters,
      applyInvoiceFiltersAndRefresh,
      handleStatusFilterPillSelect,
      handleInvoiceDateFromPillChange,
      handleInvoiceDateToPillChange,
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
  const renderCreateInvoiceButton = () =>
    canCreateInvoice ? (
    <div className="bc-table-toolbar-floating">
      <button
        type="button"
        className="bc-btn-billing-dark"
        onClick={() => {
          router.push(billingCustomerRoutes.createInvoice());
        }}
      >
        <Plus size={16} />
        Create Invoice
      </button>
    </div>
  ) : null;

  // Handle preview button click
  const handlePreviewClick = useCallback((invoice: InvoiceData) => {
    openInvoiceSidebar(invoice);
  }, [openInvoiceSidebar]);

  // Toolbar configuration
  const invoicesToolbarConfig: ToolbarConfig = {
    showTabs: true,
    tabsDropdownLabel: "Invoices",
    tabsDropdownItems,
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
    onTabRemove: () => {},

    showSearch: false,

    showTableViewDropdown: false,
    currentTableView: "table",
    onTableViewChange: () => {},

    showEditColumns: true,
    onEditColumnsClick: () => setShowColumnEditor(true),

    showFiltersButton: true,
    onFiltersClick: handleOpenFiltersSidebar,

    showFilterPills: true,
    filterPills: invoiceFilterPills,
    showMoreFiltersButton: false,
    showAdvancedFilters: false,

    showSortButton: true,
    showExportButton: false,
    onExportClick: () => {},

    rightActions: renderCreateInvoiceButton(),

    toolbarSettingsPath: billingCustomerRoutes.mainSettingsBilling(),
  };




  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Billing"
        mainLink={billingCustomerRoutes.dashboard()}
        subTitle="Invoices"
      />

      {/* Main flex container — table + sidebar side-by-side */}
      <BillingCustomerPortalTableShell>
        {/* Main content area */}
        <div className="bc-main-scroll">
          <div className="container-fluid">
            <div className="mb-3 d-flex align-items-center gap-2">
              <BillingCustomerCompanySelect
                value={selectedCompanyId}
                onChange={(next) => setSelectedCompanyId(String(next))}
                companies={companyOptions}
              />
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
      </div>

        {/* Invoice Detail Sidebar — rendered alongside the table */}
        {showInvoiceSidebar && (
        <GenericSidebar
          isOpen={showInvoiceSidebar}
          onClose={closeInvoiceSidebar}
        title={selectedInvoiceSidebar ? `Invoice #${selectedInvoiceSidebar.invoice_number}` : "Invoice Details"}
        subtitle={selectedInvoiceSidebar?.company?.name ?? ""}
        avatar={{
          initials: selectedInvoiceSidebar ? `#${String(selectedInvoiceSidebar.invoice_number).slice(-2)}` : "IN",
          name: selectedInvoiceSidebar ? `Invoice #${selectedInvoiceSidebar.invoice_number}` : "Invoice",
          gradient: "#6366F1",
        }}
        width="400px"
        quickActions={[
          {
            id: "view-invoice",
            label: "View Full Invoice",
            icon: Eye,
            onClick: () => {
              if (selectedInvoiceSidebar) {
                setSelectedInvoiceForView(toInvoiceViewData(selectedInvoiceSidebar));
                setShowViewInvoiceModal(true);
                closeInvoiceSidebar();
              }
            },
          },
          ...(canPaySelectedInvoice
            ? [
                {
                  id: "pay-now",
                  label: "Pay Now",
                  icon: DollarSign,
                  onClick: () => {
                    if (selectedInvoiceSidebar) {
                      handlePayInvoice(selectedInvoiceSidebar);
                      closeInvoiceSidebar();
                    }
                  },
                },
              ]
            : []),
          {
            id: "download-pdf",
            label: "Download PDF",
            icon: Download,
            onClick: () => {
              if (selectedInvoiceSidebar) {
                handleDownloadPDF(selectedInvoiceSidebar);
              }
            },
          },
        ]}
        actionsDropdown={{
          label: "Actions",
          items: [
            {
              label: "View Full Invoice",
              onClick: () => {
                if (selectedInvoiceSidebar) {
                  setSelectedInvoiceForView(toInvoiceViewData(selectedInvoiceSidebar));
                  setShowViewInvoiceModal(true);
                  closeInvoiceSidebar();
                }
              },
            },
            ...(canPaySelectedInvoice
              ? [
                  {
                    label: "Pay Now",
                    onClick: () => {
                      if (selectedInvoiceSidebar) {
                        handlePayInvoice(selectedInvoiceSidebar);
                        closeInvoiceSidebar();
                      }
                    },
                  },
                ]
              : []),
            {
              label: "Download PDF",
              onClick: () => {
                if (selectedInvoiceSidebar) {
                  handleDownloadPDF(selectedInvoiceSidebar);
                }
              },
            },
          ],
        }}
        sections={[
          {
            id: "invoice-info",
            title: "Invoice Information",
            icon: FileText,
            collapsible: true,
            defaultExpanded: true,
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
            collapsible: true,
            defaultExpanded: true,
            fields: [
              { label: "Company", value: selectedInvoiceSidebar?.company?.name ?? "N/A" },
              { label: "Country", value: selectedInvoiceSidebar?.company?.country ?? "N/A" },
            ].filter((f) => f.value !== "N/A" || f.label === "Company"),
          },
        ]}
        />
        )}
      </BillingCustomerPortalTableShell>
      {/* End flex container */}

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
        onApply={(keys: string[]) => {
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

