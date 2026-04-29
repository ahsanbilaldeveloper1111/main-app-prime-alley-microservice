import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Form } from "react-bootstrap";

import "@assets/scss/billing.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { GetPayments } from "@utils/accounting";
import { BILLING_PRODUCTS_TABS_DROPDOWN_ITEMS } from "@utils/billingProductsTabs";
import moment from "moment";
import { GlobalDateFormat } from "@utils/Helper";

import GenericTable, { TableColumn, FilterPill } from "@components/GenericTable";
import { GENERIC_TABLE_PAGE_SIZE_OPTIONS } from "@constants/genericTable";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import { useEnsureCustomerForCrmCompany } from "@hooks/billing/useEnsureCustomerForCrmCompany";
import { useMinifiedCompaniesSendAll } from "@hooks/billing/useMinifiedCompaniesSendAll";
import ColumnEditorModal from "@components/ColumnEditorModal";

const BILLING_TRANSACTIONS_COLUMN_STORAGE_KEY = "billing-transactions-table-columns";

const DEFAULT_TRANSACTION_TABLE_COLUMN_KEYS: string[] = [
  "date_issued",
  "details",
  "transaction_number",
  "subscriptions",
  "payment_method",
  "amount",
  "status",
];

function parseStoredTransactionColumnKeys(raw: string | null): string[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    const allowed = new Set(DEFAULT_TRANSACTION_TABLE_COLUMN_KEYS);
    const keys = parsed.filter(
      (k): k is string => typeof k === "string" && allowed.has(k),
    );
    return keys.length > 0 ? keys : null;
  } catch {
    return null;
  }
}

function loadTransactionTableColumnsFromStorage(): string[] {
  const win = (globalThis as unknown as { window?: Window & { localStorage: Storage } }).window;
  if (win === undefined) {
    return [...DEFAULT_TRANSACTION_TABLE_COLUMN_KEYS];
  }
  const stored = parseStoredTransactionColumnKeys(
    win.localStorage.getItem(BILLING_TRANSACTIONS_COLUMN_STORAGE_KEY),
  );
  return stored ?? [...DEFAULT_TRANSACTION_TABLE_COLUMN_KEYS];
}

const ProductDetails = () => {
  const companyOptions = useMinifiedCompaniesSendAll();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number>("");

  const [transactionSearch, setTransactionSearch] = useState("");
  const [totalAllTransactions, setTotalAllTransactions] = useState(0);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => [
    ...DEFAULT_TRANSACTION_TABLE_COLUMN_KEYS,
  ]);

  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onAccountingCustomerCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEnsureCustomerForCrmCompany(selectedCompanyId, {
    onCreated: onAccountingCustomerCreated,
    errorToastId: "billing_transactions_ensure_customer_failed",
  });

  const [currentFilters, setCurrentFilters] = useState<{
    search?: string;
    status?: string;
  }>({});

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
  });

  useEffect(() => {
    setSelectedColumns(loadTransactionTableColumnsFromStorage());
  }, []);

  // Sync search bar value → currentFilters so fetch re-runs
  useEffect(() => {
    setCurrentFilters((prev) => ({
      ...prev,
      search: transactionSearch || undefined,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [transactionSearch]);

  const requestIdRef = useRef(0);

  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  const fetchPayments = useCallback(async () => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setLoading(true);
    try {
      const response = (await GetPayments({
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        search: currentFilters.search || "",
        status: currentFilters.status || undefined,
        ...(selectedCompanyId ? { crm_company_id: selectedCompanyId } : {}),
      })) as any;

      if (currentRequestId !== requestIdRef.current) return;

      const list = response?.dataList ?? response?.data ?? [];
      const total =
        response?.meta?.total ??
        response?.recordsTotal ??
        response?.recordsFiltered ??
        (Array.isArray(list) ? list.length : 0);

      setDataList(list);
      setTotalRecords(total);
      setTotalAllTransactions(total);
      setPagination((prev) => ({ ...prev, totalRows: total }));
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error("Error fetching payments:", error);
      setDataList([]);
      setTotalRecords(0);
      setPagination((prev) => ({ ...prev, totalRows: 0 }));
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [pagination.currentPage, pagination.rowsPerPage, currentFilters, refreshKey, selectedCompanyId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const tableColumns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "date_issued",
        label: "Date Issued",
        sortable: true,
        type: "text",
        accessor: (row) =>
          row?.invoice?.invoice_date
            ? moment(row.invoice.invoice_date).format(GlobalDateFormat)
            : "",
        emptyValue: "-",
      },
      {
        key: "details",
        label: "Details",
        sortable: false,
        type: "custom",
        render: (payment) => (
          <div>
            <div className="fw-semibold">
              Invoice #{payment?.invoice?.invoice_number ?? "-"}
            </div>
            <div className="text-muted small">
              {payment?.updated_at
                ? moment(payment.updated_at).format("YYYY-MM-DD HH:mm")
                : "-"}
            </div>
          </div>
        ),
      },
      {
        key: "transaction_number",
        label: "Transaction Number",
        sortable: true,
        type: "text",
        accessor: (payment) => (payment?.id == null ? "" : `#${payment.id}`),
        emptyValue: "-",
      },
      {
        key: "subscriptions",
        label: "Subscriptions",
        sortable: false,
        type: "custom",
        render: (payment) => (
          <div style={{ whiteSpace: "pre-line" }}>
            {payment?.invoice?.items
              ?.map((item: any) => item?.product?.name)
              .filter(Boolean)
              .join("\n") || "-"}
          </div>
        ),
      },
      {
        key: "payment_method",
        label: "Payment Method",
        sortable: true,
        type: "text",
        accessor: (payment) => {
          const method = payment?.payment_method;
          if (typeof method !== "string") return "-";
          const normalized = method.trim().toLowerCase();
          if (normalized === "stripe") return "Card";
          return method.trim() || "-";
        },
        emptyValue: "-",
      },
      {
        key: "amount",
        label: "Amount",
        sortable: true,
        type: "custom",
        render: (payment) => {
          const currency = payment?.invoice?.currency_code || "AED";
          const invoiceAmount = payment?.invoice?.total_amount ?? 0;
          const balance = payment?.invoice?.amount_due ?? 0;
          return (
            <div>
              <div className="mb-2">
                <div className="text-muted small">Invoice amount</div>
                <div>
                  {currency} {invoiceAmount}
                </div>
              </div>
              <div>
                <div className="text-muted small">Invoice Balance</div>
                <div>
                  {currency} {balance}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        type: "badge",
        accessor: (payment) => {
          const status = payment?.status;
          if (typeof status !== "string") return "-";
          const normalized = status.trim().toLowerCase();
          if (normalized === "completed") return "Processed";
          if (normalized === "failed") return "Failed";
          return status.trim() || "-";
        },
        badge: {
          getVariant: (payment) => {
            const status = payment?.status;
            if (typeof status !== "string") return "secondary";
            const normalized = status.trim().toLowerCase();
            if (normalized === "completed") return "success";
            if (normalized === "failed") return "danger";
            return "secondary";
          },
        },
      },
    ],
    [],
  );

  const applyStatusFilter = useCallback((status: string) => {
    setCurrentFilters((prev) => ({ ...prev, status }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRefreshKey((k) => k + 1);
  }, []);

  // Filter pills: Payment status
  const transactionFilterPills = useMemo<FilterPill[]>(() => [
    {
      id: "status",
      label: "Status",
      showDropdown: true,
      active: !!currentFilters.status,
      activeLabel: currentFilters.status ?? undefined,
      onClear: () => {
        setCurrentFilters((prev) => { const { status, ...rest } = prev; return rest; });
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        setRefreshKey((k) => k + 1);
      },
      dropdownContent: (
        <div style={{ minWidth: 200 }}>
          {[
            { value: "completed", label: "Processed" },
            { value: "failed", label: "Failed" },
          ].map((s) => (
            <button
              key={s.value}
              type="button"
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background:
                  currentFilters.status === s.value ? "#f0f0f0" : "transparent",
                borderRadius: "4px",
                border: "none",
                width: "100%",
                textAlign: "left",
              }}
              onClick={() => applyStatusFilter(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      ),
    },
  ], [currentFilters, applyStatusFilter]);

  const transactionsToolbarConfig = useCrmToolbarConfig({
    entity: "transactions" as any,
    searchValue: transactionSearch,
    searchPlaceholder: "Search transactions...",
    onSearchChange: setTransactionSearch,
    onSearch: () => {
      setCurrentFilters((prev) => ({
        ...prev,
        search: transactionSearch || undefined,
      }));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setRefreshKey((prev) => prev + 1);
    },
    currentFilters,
    handleFiltersChange,
    refresh: () => setRefreshKey((prev) => prev + 1),
    activeTab: "all",
    onTabChange: () => {},
    tabs: [
      {
        id: "all",
        label: "All Transactions",
        count: totalAllTransactions,
        removable: false,
      },
    ],
    onTabRemove: () => {},
    tabsDropdownLabel: "Transactions",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => {},
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: false,
    onImportClick: () => {},
    currentTableView: "table",
    onTableViewChange: () => {},
    extensions: [],
    onPaginationReset: () =>
      setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: null,
  });

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        id: "search",
        label: "Search",
        type: "text",
        value: currentFilters.search ?? "",
        onChange: (value) =>
          setCurrentFilters((prev) => ({ ...prev, search: value })),
        placeholder: "Search transactions...",
      },
      {
        id: "status",
        label: "Status",
        type: "dropdown",
        value: currentFilters.status ?? "",
        onChange: (value) =>
          setCurrentFilters((prev) => ({ ...prev, status: value || undefined })),
        options: [
          { value: "", label: "All Status" },
          { value: "completed", label: "Processed" },
          { value: "failed", label: "Failed" },
        ],
      },
    ],
    [currentFilters.search, currentFilters.status]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Billing"
        mainLink="/billing/dashboard"
        subTitle="Transactions"
      />

      {/* Main flex container for content and sidebar — same pattern as prospects.tsx */}
      <div style={{ display: "flex", gap: "0", height: "calc(100vh)", overflow: "hidden" }}>
        {/* Main content area */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>

          {/* Company selector above the table */}
          <div className="mb-3 d-flex align-items-center gap-2">
            <Form.Select
              size="sm"
              style={{ width: "220px" }}
              value={String(selectedCompanyId)}
              onChange={(e) =>
                setSelectedCompanyId(e.target.value === "" ? "" : e.target.value)
              }
            >
              <option value="">All companies</option>
              {companyOptions.map((c: { id: string | number; name?: string }) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.id}
                </option>
              ))}
            </Form.Select>
          </div>

      <GenericTable
        data={dataList}
        columns={tableColumns.filter((c) => selectedColumns.includes(c.key))}
        pagination={{
          currentPage: pagination.currentPage,
          rowsPerPage: pagination.rowsPerPage,
          totalRows: totalRecords,
          pageSizeOptions: GENERIC_TABLE_PAGE_SIZE_OPTIONS,
        }}
        onPaginationChange={(page, rowsPerPage) => {
          setPagination((prev) => ({
            ...prev,
            currentPage: page,
            rowsPerPage,
          }));
        }}
        sortable={true}
        loading={loading}
        emptyMessage="No transactions found"
        loadingMessage="Loading transactions..."
        hover={true}
        uniqueKey="id"
        fixedHeight={true}
        maxHeight="calc(100vh - 345px)"
        showToolbar={true}
        toolbar={{
          ...transactionsToolbarConfig,
          tabsDropdownItems: BILLING_PRODUCTS_TABS_DROPDOWN_ITEMS,
          showFilterPills: false,
          filterPills: transactionFilterPills,
          showMoreFiltersButton: false,
          showAdvancedFilters: false,
        }}
      />

      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={handleCloseFiltersSidebar}
        title="Filters"
        subtitle="Filter transactions by status"
        width="400px"
        filters={filterFields}
        onApply={() => {
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((k) => k + 1);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setCurrentFilters({});
          setTransactionSearch("");
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((k) => k + 1);
        }}
      />

      <ColumnEditorModal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        title="Customize Columns"
        columns={tableColumns.map((c) => ({ key: c.key, label: c.label }))}
        selectedColumnKeys={selectedColumns}
        onApply={(keys: string[]) => {
          setSelectedColumns(keys);
          const w = (globalThis as unknown as { window?: Window }).window;
          if (w) {
            w.localStorage.setItem(
              BILLING_TRANSACTIONS_COLUMN_STORAGE_KEY,
              JSON.stringify(keys),
            );
          }
        }}
      />
        </div>{/* End main content area */}
      </div>
    </React.Fragment>
  );
};

ProductDetails.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductDetails;
