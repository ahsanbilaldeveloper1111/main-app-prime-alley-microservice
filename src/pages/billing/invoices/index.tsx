import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import React, {
  ReactElement,
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
import GenericSidebar from "@components/GenericSidebar";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { StatsCardData } from "@components/GenericStatsCards";
import { useRouter } from "next/router";
import {
  getInvoice,
  downloadInvoicePdf,
  InvoiceData,
  getInvoices,
} from "@utils/accounts";
import { getMinifiedCompanies } from "@utils/crm";
import { formatNumber } from "@utils/Helper";

import { Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
import InvoiceViewModal, { InvoiceViewData } from "@components/billings/InvoiceViewModal";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  Plus,
  Receipt,
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

type InvoiceFilters = {
  search?: string;
  status?: string;
  invoice_date_from?: string;
  date_from?: string;
  date_to?: string;
};

const InvoiceList = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<InvoiceFilters>({});
  const [pendingFilters, setPendingFilters] = useState<InvoiceFilters>({});
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<{ id: string | number; name?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const { openInvoicePayment: handlePayInvoice, invoicePaymentModal } = useInvoicePaymentModal({
    companyOptions,
    onPaymentSuccess: () => setRefreshKey((prev) => prev + 1),
  });
  
  // View invoice modal states
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<InvoiceViewData | null>(null);

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

  const handleDownloadPDF = useCallback(async (invoice: InvoiceData) => {
    try {
      await downloadInvoicePdf(invoice.id);
    } catch (error) {
      toast.error(`Failed to download invoice PDF: ${getErrorMessage(error)}`);
    }
  }, []);

  const invoiceTableActions: GenericTableAction<InvoiceData>[] = useMemo(
    () => [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row: InvoiceData) => handleViewInvoice(row),
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
        icon: <Download size={16} />,
        onClick: (row: InvoiceData) => handleDownloadPDF(row),
      },
    ],
    [
      session?.user?.permissions,
      handleViewInvoice,
      handlePayInvoice,
      handleDownloadPDF,
    ],
  );

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
          { value: STATUS_DRAFT, label: "Draft" },
          { value: STATUS_SENT, label: "Sent" },
          { value: STATUS_PAID, label: "Paid" },
          { value: STATUS_PENDING, label: "Pending" },
          { value: STATUS_OVERDUE, label: "Overdue" },
          { value: STATUS_PARTIALLY_PAID, label: "Partially Paid" },
          { value: STATUS_CANCELLED, label: "Cancelled" },
          { value: STATUS_FAILED, label: "Failed" },
          { value: STATUS_REFUNDED, label: "Refunded" },
        ],
      },
      {
        id: "invoice_date_from",
        label: "Invoice Date From",
        type: "date",
        value: pendingFilters.invoice_date_from ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, invoice_date_from: value || undefined })),
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
  type InvoiceSummary = {
    paid_count?: number;
    pending_count?: number;
    overdue_count?: number;
  };
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
      const response = await getInvoices({
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        search: memoizedFilters.search || "",
        crm_company_not_null: true,
        
        ...memoizedFilters,
        ...(selectedCompanyId ? { crm_company_id: selectedCompanyId } : {}),
      });
      if (currentRequestId !== invoiceRequestIdRef.current) return;
      const data = response?.data || [];
      const total = response?.pagination?.total ?? 0;
      setInvoiceList(data);
      setTotalRecords(total);
      setPagination((prev) => ({ ...prev, totalRows: total }));
      // Keep total all invoices when no status filter is applied
      if (!memoizedFilters.status) {
        setTotalAllInvoices(total);
      }
      if (response?.summary) setSummary(response.summary);
    } catch (error) {
      if (currentRequestId !== invoiceRequestIdRef.current) return;
      const message = getErrorMessage(error);
      toast.error(`Failed to load invoices: ${message}`, {
        toastId: "billing_invoices_load_failed",
      });
      setInvoiceList([]);
      setTotalRecords(0);
      setPagination((prev) => ({ ...prev, totalRows: 0 }));
    } finally {
      if (invoiceRequestIdRef.current === currentRequestId) {
        setInvoiceLoading(false);
      }
    }
  }, [pagination.currentPage, pagination.rowsPerPage, memoizedFilters, selectedCompanyId]);

  React.useEffect(() => {
    loadInvoices();
  }, [loadInvoices, refreshKey]);

  // Filter pills for invoices
  const invoiceFilterPills = React.useMemo<FilterPill[]>(
    () => [
      {
        id: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "", label: "All Status" },
          { value: STATUS_DRAFT, label: "Draft" },
          { value: STATUS_SENT, label: "Sent" },
          { value: STATUS_PAID, label: "Paid" },
          { value: STATUS_PENDING, label: "Pending" },
          { value: STATUS_OVERDUE, label: "Overdue" },
          { value: STATUS_PARTIALLY_PAID, label: "Partially Paid" },
          { value: STATUS_CANCELLED, label: "Cancelled" },
          { value: STATUS_FAILED, label: "Failed" },
          { value: STATUS_REFUNDED, label: "Refunded" },
        ],
        value: currentFilters.status || "",
        onChange: (value: string) => {
          setCurrentFilters((prev) => {
            if (value) {
              return { ...prev, status: value };
            } else {
              const { status, ...rest } = prev;
              return rest;
            }
          });
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
        },
      },
      {
        id: "invoice_date",
        label: "Invoice Date",
        type: "date",
        value: currentFilters.invoice_date_from || "",
        onChange: (value: string) => {
          setCurrentFilters((prev) => {
            if (value) {
              return { ...prev, invoice_date_from: value };
            } else {
              const { invoice_date_from, ...rest } = prev;
              return rest;
            }
          });
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
        },
      },
    ],
    [currentFilters]
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
    onEditColumnsClick: () => {},

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
        defaultSelectedColumns={["invoice_number", "status", "total_amount", "amount_due", "invoice_date", "due_date"]}
        columnStorageKey="customerInvoicesSelectedColumns"
        pagination={{
          currentPage: pagination.currentPage,
          rowsPerPage: pagination.rowsPerPage,
          totalRows: totalRecords,
          pageSizeOptions: [10, 15, 25, 50],
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

      {/* View Invoice Modal */}
      <InvoiceViewModal
        show={showViewInvoiceModal}
        onHide={closeViewInvoiceModal}
        invoice={selectedInvoiceForView}
        companyName={session?.user?.company_name || ""}
        companyOptions={companyOptions}
      />
    </React.Fragment>
  );
};

InvoiceList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default InvoiceList;

