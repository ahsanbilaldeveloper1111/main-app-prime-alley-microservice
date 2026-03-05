import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Layout from "@layout/index";
import { formatNumber } from "@utils/Helper";
import { useState } from "react";
import { Row, Col, Button, Badge, Card, Form } from "react-bootstrap";
import { Check, CheckCircle, Receipt, Ban, AlertCircle, Eye, X, Layers, FileText, Calendar, Filter } from "lucide-react";

import "@assets/scss/billing.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/datatable-style.scss";

import { GetPayments } from "@utils/accounting";
import { getMinifiedCompanies } from "@utils/crm";
import { useSession } from "next-auth/react";
import moment from "moment";
import FormModal from "@pages/partial/FormModal";

import GenericTable, { TableColumn } from "@components/GenericTable";
import GenericSidebar from "@components/GenericSidebar";
import { ModuleSlug } from "@utils/Helper";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";

interface PaymentRow {
  id: number;
  amount: string;
  currency_code?: string;
  payment_method?: string;
  status?: string;
  payment_date?: string;
  invoice?: any;
  [key: string]: any;
}

const BillingHistory = () => {
  const { data: session } = useSession();

  const [refreshKey, setRefreshKey] = useState(0);
  const [companies, setCompanies] = useState<{ id: string | number; name?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number | "">("");
  const [currentFilters, setCurrentFilters] = useState<{
    status?: string;
    search?: string;
    payment_date_from?: string;
    payment_date_to?: string;
  }>({});
  const [pendingFilters, setPendingFilters] = useState<{
    status?: string;
    search?: string;
    payment_date_from?: string;
    payment_date_to?: string;
  }>({});
  const [activeStatusTab, setActiveStatusTab] = useState<string | null>(null);
  const [showFilterTabs, setShowFilterTabs] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);

  const [paymentList, setPaymentList] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
  });
  const [selectedPaymentSidebar, setSelectedPaymentSidebar] = useState<PaymentRow | null>(null);
  const [showPaymentSidebar, setShowPaymentSidebar] = useState(false);
  const [selectedPaymentView, setSelectedPaymentView] = useState<any | null>(null);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);

  const requestIdRef = useRef(0);
  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        setCompanies(result ?? []);
      } catch (e) {
        console.error("Error fetching companies:", e);
      }
    };
    fetchCompanies();
  }, []);

  const loadPayments = useCallback(async () => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setLoading(true);
    try {
      const response = await GetPayments({
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        search: memoizedFilters.search || "",
        status: memoizedFilters.status,
        // date_from: memoizedFilters.payment_date_from,
        // date_to: memoizedFilters.payment_date_to,
        ...(selectedCompanyId ? { crm_company_id: selectedCompanyId } : {}),
      }) as any;
      if (currentRequestId !== requestIdRef.current) return;
      const list = response?.dataList ?? response?.data ?? [];
      const total = response?.meta?.total ?? response?.recordsTotal ?? 0;
      setPaymentList(list);
      setTotalRecords(total);
      setPagination((prev) => ({ ...prev, totalRows: total }));
      if (response?.summary) setSummary(response.summary);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error("Error fetching payments:", error);
      setPaymentList([]);
      setTotalRecords(0);
      setPagination((prev) => ({ ...prev, totalRows: 0 }));
    } finally {
      if (requestIdRef.current === currentRequestId) setLoading(false);
    }
  }, [pagination.currentPage, pagination.rowsPerPage, memoizedFilters, refreshKey, selectedCompanyId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const openPaymentSidebar = useCallback((row: PaymentRow) => {
    setSelectedPaymentSidebar(row);
    setShowPaymentSidebar(true);
  }, []);
  const closePaymentSidebar = useCallback(() => {
    setShowPaymentSidebar(false);
    setSelectedPaymentSidebar(null);
  }, []);

  const handleOpenFiltersSidebar = useCallback(() => {
    setPendingFilters({ ...currentFilters });
    setShowFiltersSidebar(true);
  }, [currentFilters]);
  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    if (status === "completed") return "success";
    if (status === "cancelled" || status === "failed") return "danger";
    return "warning";
  };

  const tableColumns: TableColumn<PaymentRow>[] = useMemo(
    () => [
      { key: "id", label: "Payment ID", sortable: true, render: (row) => <span>#{row?.id}</span> },
      {
        key: "invoice",
        label: "Invoice",
        sortable: true,
        accessor: (row) => row?.invoice?.invoice_number ?? "-",
      },
      {
        key: "amount",
        label: "Amount",
        sortable: true,
        render: (row) => (
          <span>
            {row?.currency_code} {formatNumber(row?.amount)}
          </span>
        ),
      },
      {
        key: "payment_method",
        label: "Payment Method",
        sortable: true,
        accessor: (row) => (row?.payment_method ? String(row.payment_method).toUpperCase() : "-"),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        type: "badge",
        accessor: (row) => row?.status ?? "",
        badge: { getVariant: (row) => getStatusBadgeVariant(row?.status || "") as any },
      },
      {
        key: "payment_date",
        label: "Date",
        sortable: true,
        accessor: (row) =>
          row?.payment_date ? moment(row.payment_date).format("DD-MMM-YYYY") : "-",
      },
    ],
    []
  );

  const paymentFilterFields: FilterField[] = useMemo(
    () => [
      {
        id: "search",
        label: "Search",
        type: "text",
        value: pendingFilters.search ?? "",
        onChange: (value) =>
          setPendingFilters((prev) => ({ ...prev, search: value || undefined })),
        placeholder: "Search by invoice number or payment ID...",
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
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
          { value: "failed", label: "Failed" },
        ],
      },
      // {
      //   id: "payment_date_from",
      //   label: "Payment Date From",
      //   type: "date",
      //   value: pendingFilters.payment_date_from ?? "",
      //   onChange: (value) =>
      //     setPendingFilters((prev) => ({ ...prev, payment_date_from: value || undefined })),
      // },
      // {
      //   id: "payment_date_to",
      //   label: "Payment Date To",
      //   type: "date",
      //   value: pendingFilters.payment_date_to ?? "",
      //   onChange: (value) =>
      //     setPendingFilters((prev) => ({ ...prev, payment_date_to: value || undefined })),
      // },
    ],
    [
      pendingFilters.search,
      pendingFilters.status,
      pendingFilters.payment_date_from,
      pendingFilters.payment_date_to,
    ]
  );

  return (
    <React.Fragment>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/dashboard" className="text-decoration-none">
                  Accounting
                </a>
              </li>
              <li className="breadcrumb-item active fw-bold" aria-current="page">
                Payment History
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Select
            size="sm"
            style={{ width: "220px" }}
            value={String(selectedCompanyId)}
            onChange={(e) =>
              setSelectedCompanyId(e.target.value === "" ? "" : e.target.value)
            }
          >
            <option value="">All companies</option>
            {companies.map((c: { id: string | number; name?: string }) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.id}
              </option>
            ))}
          </Form.Select>
          <Button
            variant="outline-secondary"
            onClick={handleOpenFiltersSidebar}
          >
            <Filter size={16} className="me-2" />
            Filters
          </Button>
          <Button
            variant={showFilterTabs ? "secondary" : "outline-secondary"}
            onClick={() => setShowFilterTabs(!showFilterTabs)}
          >
            <Layers size={16} className="me-2" />
            {showFilterTabs ? "Hide Tabs" : "Show Tabs"}
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
       
        {showFilterTabs && (
      <Card className="filter-bar-card">
        <Card.Body className="filter-bar-body">
          <div className="filter-bar-tabs">
            <Button
              variant={activeStatusTab === null ? "primary" : "outline-secondary"}
              className="filter-bar-tab"
              onClick={() => {
                setActiveStatusTab(null);
                setCurrentFilters({});
                setRefreshKey((prev) => prev + 1);
              }}
            >
              <Receipt size={16} />
              All
            </Button>
            <Button
              variant={activeStatusTab === "completed" ? "primary" : "outline-secondary"}
              className="filter-bar-tab"
              onClick={() => {
                setActiveStatusTab("completed");
                setCurrentFilters({ status: "completed" });
                setRefreshKey((prev) => prev + 1);
              }}
            >
              <CheckCircle size={16} />
              Completed
            </Button>
            <Button
              variant={activeStatusTab === "cancelled" ? "primary" : "outline-secondary"}
              className="filter-bar-tab"
              onClick={() => {
                setActiveStatusTab("cancelled");
                setCurrentFilters({ status: "cancelled" });
                setRefreshKey((prev) => prev + 1);
              }}
            >
              <Ban size={16} />
              Cancelled
            </Button>
            <Button
              variant={activeStatusTab === "failed" ? "primary" : "outline-secondary"}
              className="filter-bar-tab"
              onClick={() => {
                setActiveStatusTab("failed");
                setCurrentFilters({ status: "failed" });
                setRefreshKey((prev) => prev + 1);
              }}
            >
              <AlertCircle size={16} />
              Failed
            </Button>
          </div>
          {/* <div className="filter-bar-actions">
            <Form.Control
              type="search"
              placeholder="Search Invoices..."
              onChange={(e) =>
                setCurrentFilters({ ...currentFilters, search: e.target.value })
              }
            />
          </div> */}
        </Card.Body>
      </Card>
      )}

      <GenericTable<PaymentRow>
        data={paymentList}
        columns={tableColumns}
        customizableColumns={true}
        defaultSelectedColumns={["id", "invoice", "amount", "payment_method", "status", "payment_date"]}
        columnStorageKey="customerBillingHistorySelectedColumns"
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
        loading={loading}
        emptyMessage="No payments found"
        loadingMessage="Loading payments..."
        hover={true}
        uniqueKey="id"
        onRowClick={(row) => openPaymentSidebar(row)}
      />

      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={handleCloseFiltersSidebar}
        title="Filters"
        subtitle="Filter payments by status, date range, and search"
        width="400px"
        filters={paymentFilterFields}
        onApply={() => {
          setCurrentFilters({ ...pendingFilters });
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
          setActiveStatusTab(pendingFilters.status ?? null);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setPendingFilters({});
          setCurrentFilters({});
          setActiveStatusTab(null);
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
          setShowFiltersSidebar(false);
        }}
      />

      <GenericSidebar
        isOpen={showPaymentSidebar}
        onClose={closePaymentSidebar}
        moduleSlug={ModuleSlug.BILLING}
        title={selectedPaymentSidebar ? `Payment #${selectedPaymentSidebar.id}` : "Payment Details"}
        subtitle={selectedPaymentSidebar?.invoice?.invoice_number ? `Invoice #${selectedPaymentSidebar.invoice.invoice_number}` : ""}
        metadata={selectedPaymentSidebar?.payment_date ? moment(selectedPaymentSidebar.payment_date).format("DD-MMM-YYYY") : undefined}
        width="400px"
        sections={[
          {
            id: "payment-info",
            title: "Payment Information",
            icon: FileText,
            fields: [
              { label: "Payment ID", value: selectedPaymentSidebar ? `#${selectedPaymentSidebar.id}` : "N/A" },
              { label: "Invoice", value: selectedPaymentSidebar?.invoice?.invoice_number ?? "N/A" },
              {
                label: "Amount",
                value: selectedPaymentSidebar
                  ? `${selectedPaymentSidebar.currency_code || ""} ${formatNumber(selectedPaymentSidebar?.amount)}`
                  : "N/A",
              },
              {
                label: "Payment Method",
                value: selectedPaymentSidebar?.payment_method ? String(selectedPaymentSidebar.payment_method).toUpperCase() : "N/A",
              },
              {
                label: "Status",
                value: selectedPaymentSidebar?.status ?? "N/A",
                type: "badge",
                badgeVariant: selectedPaymentSidebar ? getStatusBadgeVariant(selectedPaymentSidebar.status || "") : "secondary",
              },
              {
                label: "Date",
                value: selectedPaymentSidebar?.payment_date ?? null,
                type: "date",
                icon: Calendar,
              },
            ],
          },
          {
            id: "parties",
            title: "From / Bill To",
            icon: FileText,
            fields: [
              { label: "From", value: selectedPaymentSidebar?.invoice?.reseller?.name ?? selectedPaymentSidebar?.invoice?.company?.reseller?.name ?? "N/A" },
              { label: "Bill To", value: selectedPaymentSidebar?.invoice?.company?.name ?? "N/A" },
            ],
          },
        ]}
        actions={[
          {
            label: "View Full Receipt",
            icon: FileText,
            variant: "primary",
            onClick: () => {
              if (selectedPaymentSidebar) {
                setSelectedPaymentView(selectedPaymentSidebar);
                setShowViewPaymentModal(true);
                closePaymentSidebar();
              }
            },
          },
        ]}
      />

             <FormModal
              show={showViewPaymentModal}
              size="lg"
              onHide={() => setShowViewPaymentModal(false)}
              title="Invoice Details "
              desc={`Invoice: ${selectedPaymentView?.invoice?.invoice_number}`}
              onSubmit={() => setShowViewPaymentModal(false)}
              submitButtonText="Close"
              cancelButtonText="Cancel"
              onCancel={() => setShowViewPaymentModal(false)}
              formHtml={
                <>
                <div className="mb-4 pb-4 border-bottom">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-2">From</h6>
                    <h6 className="mb-1">{selectedPaymentView?.invoice?.reseller?.name}</h6>
                    {/* <img alt="logo" className="img-fluid" src={CompanyLogo2.src} /> */}
                    <p className="text-muted mb-0 small">123 Business Street
                      <br/>London, UK SW1A 1AA</p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-2">Bill To</h6>
                    <h6 className="mb-1">{selectedPaymentView?.invoice?.company?.name}</h6>
                    <p className="text-muted mb-0 small">123 Business Street
                      <br />London, SW1A 1AA</p>
                  </div>
                </div>
              </div>
              <div className="mb-4 pb-4 border-bottom">
                <div className="row">
                  <div className="col-md-3 col-6">
                    <p className="text-muted mb-1 small">Invoice Date</p>
                    <p className="fw-semibold mb-0">{moment(selectedPaymentView?.invoice?.invoice_date).format('DD-MMM-YYYY')}</p>
                  </div>
                  <div className="col-md-3 col-6">
                    <p className="text-muted mb-1 small">Due Date</p>
                    <p className="fw-semibold mb-0">{moment(selectedPaymentView?.invoice?.due_date).format('DD-MMM-YYYY')}</p>
                  </div>
                  <div className="col-md-3 col-6">
                    <p className="text-muted mb-1 small">Payment Method</p>
                    <p className="fw-semibold mb-0">{selectedPaymentView?.payment_method}</p>
                  </div>
                  <div className="col-md-3 col-6">
                    <p className="text-muted mb-1 small">Invoice ID</p>
                    <p className="fw-semibold mb-0">{selectedPaymentView?.invoice?.invoice_number}</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <h6 className="text-muted mb-3">Items</h6>
                <div className="table-responsive">
                  <table className="table">
                    <thead className="bg-light">
                      <tr>
                        <th>Description</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPaymentView?.invoice?.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td>{item?.product?.name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end fw-semibold">{selectedPaymentView?.currency_code} {formatNumber(item.unit_price)}</td>
                          <td className="text-end fw-semibold">{selectedPaymentView?.currency_code} {formatNumber(item.line_total)}</td>
                        </tr>
                      ))}
                      
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-light rounded p-3">
                <div className="mb-2 row">
                  <div className="col-6">
                    <p className="mb-0 text-muted">Subtotal:</p>
                  </div>
                  <div className="text-end col-6">
                    <p className="mb-0 fw-semibold">{selectedPaymentView?.currency_code} {formatNumber(selectedPaymentView?.invoice?.subtotal)}</p>
                  </div>
                </div>
                <div className="mb-2 row">
                  <div className="col-6">
                    <p className="mb-0 text-muted">Tax:</p>
                  </div>
                  <div className="text-end col-6">
                    <p className="mb-0 fw-semibold">{selectedPaymentView?.currency_code} {formatNumber(selectedPaymentView?.invoice?.tax_amount)}</p>
                  </div>
                </div>
                <hr />
                <div className="row">
                  <div className="col-6">
                    <p className="mb-0 fw-bold">Total:</p>
                  </div>
                  <div className="text-end col-6">
                    <p className="mb-0 fw-bold text-primary fs-5">{selectedPaymentView?.currency_code} {formatNumber(selectedPaymentView?.invoice?.total_amount)}</p>
                  </div>
                </div>
              </div>
                </>
              }
              ShowSubmitButton={false}
              />

            
      

    </React.Fragment>
  );
};

BillingHistory.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default BillingHistory;
