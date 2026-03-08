import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Layout from "@layout/index";
import { useRouter } from "next/router";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { useState } from "react";
import { Button, Form } from "react-bootstrap";

import "@assets/scss/billing.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import "@assets/scss/datatable-style.scss";
import { GetProducts } from "@utils/accounting";
import { getMinifiedCompanies } from "@utils/crm";
import { useSession } from "next-auth/react";
import moment from "moment";
import { formatNumber, GlobalDateFormat } from "@utils/Helper";
import { Package, FileText, Calendar, Plus } from "lucide-react";

import GenericTable, { TableColumn, FilterPill } from "@components/GenericTable";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import GenericSidebar from "@components/GenericSidebarNew";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  type: string;
  totalAmount: string;
  status: string;
  created: string;
}

const ProductDetails = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [errorCompanies, setErrorCompanies] = useState<string | null>(null);
  const [companyOptions, setCompanyOptions] = useState<{ id: string | number; name?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number | "">("");


  useEffect(() => {
    const fetchCompanyOptions = async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        setCompanyOptions(result ?? []);
      } catch (e) {
        console.error("Error fetching company options:", e);
      }
    };
    fetchCompanyOptions();
  }, []);
    

  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [totalAllSubscriptions, setTotalAllSubscriptions] = useState(0);

  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<{
    search?: string;
    status?: string;
    billing_cycle?: string;
    renewal_end_date_from?: string;
    renewal_end_date_to?: string;
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

  // Sync search bar value → currentFilters so fetch re-runs
  useEffect(() => {
    setCurrentFilters((prev) => ({ ...prev, search: subscriptionSearch || undefined }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [subscriptionSearch]);

  const requestIdRef = useRef(0);

  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  const fetchProducts = useCallback(async () => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setLoading(true);
    try {
      const response = await GetProducts({
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        search: currentFilters.search || "",
        status: currentFilters.status || undefined,
        billing_cycle: currentFilters.billing_cycle || undefined,
        ...(selectedCompanyId ? { crm_company_id: selectedCompanyId } : {}),
      }) as any;

      if (currentRequestId !== requestIdRef.current) return;

      const list = response?.dataList ?? response?.data ?? [];
      const total = response?.meta?.total ?? response?.recordsTotal ?? response?.recordsFiltered ?? 0;
      setDataList(list);
      setTotalRecords(total);
      setTotalAllSubscriptions(total);
      setPagination((prev) => ({ ...prev, totalRows: total }));
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error("Error fetching products:", error);
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
    fetchProducts();
  }, [fetchProducts]);

  const tableColumns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Subscription Name",
        sortable: true,
        type: "text",
        accessor: (row) => row?.product?.name ?? "",
        render: (row) => (
          <div>
            <span className="fw-semibold">{row?.product?.name ?? "-"}</span>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        type: "badge",
        accessor: (row) =>
          row?.product?.is_active ? "Active" : "Suspended",
        badge: {
          getVariant: (row) =>
            row?.product?.is_active ? "success" : "danger",
        },
      },
      {
        key: "billing_cycle",
        label: "Billing Cycle",
        sortable: true,
        type: "text",
        accessor: (row) => row?.billing_cycle ?? "",
        render: (row) => (
          <span className="text-capitalize">
            {row?.billing_cycle || "-"}
          </span>
        ),
      },
      {
        key: "renewal_start_date",
        label: "Current Period Start",
        sortable: true,
        type: "text",
        accessor: (row) =>
          row?.renewal_start_date
            ? moment(row.renewal_start_date).format(GlobalDateFormat)
            : "",
        emptyValue: "-",
      },
      {
        key: "renewal_end_date",
        label: "Current Period End",
        sortable: true,
        type: "text",
        accessor: (row) =>
          row?.renewal_end_date
            ? moment(row.renewal_end_date).format(GlobalDateFormat)
            : "",
        emptyValue: "-",
      },
      {
        key: "subscriptions",
        label: "Quantity",
        sortable: true,
        type: "text",
        accessor: (row) => row?.subscriptions ?? "0",
        emptyValue: "0",
      },
      {
        key: "selling_price",
        label: "Price",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span>
            {row?.company?.profile?.currency ||
              row?.product?.currency ||
              "USD"}{" "}
            {formatNumber(row?.selling_price)}
          </span>
        ),
      },
    ],
    []
  );

  const [selectedProductView, setSelectedProductView] = useState<any | null>(
    null
  );
  const [showProductSidebar, setShowProductSidebar] = useState(false);

  const getInitials = (name: string) => {
    if (!name || typeof name !== "string") return "NA";
    return name
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (seed: string) => {
    const colors = [
      "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
      "#10b981", "#06b6d4", "#3b82f6",
    ];
    let n = 0;
    for (let i = 0; i < (seed || "").length; i++) n += seed.charCodeAt(i);
    return colors[n % colors.length];
  };

  const handleViewProduct = useCallback((row: any) => {
    setSelectedProductView(row);
    setShowProductSidebar(true);
  }, []);

  const handleCloseProductSidebar = useCallback(() => {
    setShowProductSidebar(false);
    setSelectedProductView(null);
  }, []);

  // Preview button on row hover – opens the same sidebar
  const handlePreviewClick = useCallback((row: any) => {
    handleViewProduct(row);
  }, [handleViewProduct]);

  // Filter pills: Status + Next Billing Date
  const subscriptionFilterPills = useMemo<FilterPill[]>(() => [
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
          {["Active", "Trial", "Inactive", "Suspended"].map((s) => (
            <div
              key={s}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: currentFilters.status === s ? "#f0f0f0" : "transparent",
                borderRadius: "4px",
              }}
              onClick={() => {
                setCurrentFilters((prev) => ({ ...prev, status: s }));
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
                setRefreshKey((k) => k + 1);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "renewal_end_date",
      label: "Next Billing Date",
      showDropdown: true,
      active: !!currentFilters.renewal_end_date_from,
      activeLabel: currentFilters.renewal_end_date_from
        ? moment(currentFilters.renewal_end_date_from).format("MMM D, YYYY")
        : undefined,
      onClear: () => {
        setCurrentFilters((prev) => {
          const { renewal_end_date_from, renewal_end_date_to, ...rest } = prev;
          return rest;
        });
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        setRefreshKey((k) => k + 1);
      },
      dropdownContent: (
        <div style={{ minWidth: 220, padding: "4px 0" }}>
          <div style={{ padding: "4px 12px 8px", fontSize: 12, color: "#666" }}>From</div>
          <input
            type="date"
            value={currentFilters.renewal_end_date_from ?? ""}
            style={{ width: "100%", padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 4, marginBottom: 8 }}
            onChange={(e) => {
              setCurrentFilters((prev) => ({ ...prev, renewal_end_date_from: e.target.value || undefined }));
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
              setRefreshKey((k) => k + 1);
            }}
          />
          <div style={{ padding: "4px 12px 8px", fontSize: 12, color: "#666" }}>To</div>
          <input
            type="date"
            value={currentFilters.renewal_end_date_to ?? ""}
            style={{ width: "100%", padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 4 }}
            onChange={(e) => {
              setCurrentFilters((prev) => ({ ...prev, renewal_end_date_to: e.target.value || undefined }));
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
              setRefreshKey((k) => k + 1);
            }}
          />
        </div>
      ),
    },
  ], [currentFilters]);

  // Add Subscription button
  const renderAddSubscriptionButton = () => (
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
        type="button"
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
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1a1a1a"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#000000"; }}
        onClick={() => {
          // Navigate to add subscription page or open a modal
          // window.location.href = "/billing/create-invoice";
          router.push('/billing/create-invoice');
        }}
      >
        <Plus size={16} />
        Add Subscription
      </button>
    </div>
  );

  // Toolbar config following the same pattern as customer-invoices
  const subscriptionsToolbarConfig = useCrmToolbarConfig({
    entity: "invoices" as any,
    searchValue: subscriptionSearch,
    searchPlaceholder: "Search subscriptions...",
    onSearchChange: setSubscriptionSearch,
    onSearch: () => {
      setCurrentFilters((prev) => ({ ...prev, search: subscriptionSearch || undefined }));
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
        label: "All Subscriptions",
        count: totalAllSubscriptions,
        removable: false,
      },
    ],
    onTabAdd: () => {},
    onTabRemove: () => {},
    tabsDropdownLabel: "Subscriptions",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => {},
    onEditColumnsClick: () => {},
    showImport: false,
    onImportClick: () => {},
    currentTableView: "table",
    onTableViewChange: () => {},
    extensions: [],
    onPaginationReset: () => setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: renderAddSubscriptionButton(),
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
        placeholder: "Search products...",
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
          { value: "Active", label: "Active" },
          { value: "Trial", label: "Trial" },
          { value: "Inactive", label: "Inactive" },
        ],
      },
      {
        id: "billing_cycle",
        label: "Billing Cycle",
        type: "dropdown",
        value: currentFilters.billing_cycle ?? "",
        onChange: (value) =>
          setCurrentFilters((prev) => ({
            ...prev,
            billing_cycle: value || undefined,
          })),
        options: [
          { value: "", label: "All Types" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "yearly", label: "Yearly" },
          { value: "one time", label: "One-time" },
        ],
      },
    ],
    [currentFilters.search, currentFilters.status, currentFilters.billing_cycle]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Billing" mainLink="/billing/dashboard" subTitle="Subscriptions" />

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
        columns={tableColumns}
        pagination={{
          currentPage: pagination.currentPage,
          rowsPerPage: pagination.rowsPerPage,
          totalRows: totalRecords,
          pageSizeOptions: [10, 15, 25, 50],
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
        emptyMessage="No subscriptions found"
        loadingMessage="Loading subscriptions..."
        hover={true}
        uniqueKey="id"
        onRowClick={(row) => handleViewProduct(row)}
        onPreviewClick={(row) => handlePreviewClick(row)}
        customizableColumns={true}
        columnStorageKey="customer-product-details-columns"
        fixedHeight={true}
        maxHeight="calc(100vh - 345px)"
        showToolbar={true}
        toolbar={{
          ...subscriptionsToolbarConfig,
          showFilterPills: true,
          filterPills: subscriptionFilterPills,
          showMoreFiltersButton: true,
          onAdvancedFiltersClick: handleOpenFiltersSidebar,
        }}
      />

      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={handleCloseFiltersSidebar}
        title="Filters"
        subtitle="Filter subscriptions by status and billing cycle"
        width="400px"
        filters={filterFields}
        onApply={() => {
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((k) => k + 1);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setCurrentFilters({});
          setSubscriptionSearch("");
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((k) => k + 1);
        }}
      />
        </div>{/* End main content area */}

        {/* Subscription Detail Sidebar — sibling of main content, same pattern as prospects.tsx */}
        {showProductSidebar && (
        <div style={{ borderLeft: "1px solid #e2e8f0" }}>
        <GenericSidebar
        isOpen={showProductSidebar}
        onClose={handleCloseProductSidebar}
        title={selectedProductView?.product?.name ?? "Subscription Details"}
        subtitle={
          selectedProductView?.product?.is_active ? "Active" : "Suspended"
        }
        avatar={{
          initials: getInitials(
            selectedProductView?.product?.name ?? "NA"
          ),
          name: selectedProductView?.product?.name ?? "NA",
          gradient: getRandomColor(
            selectedProductView?.product?.name ?? ""
          ),
        }}
        sections={[
          {
            id: "subscription-info",
            title: "Subscription Information",
            icon: Package,
            collapsible: true,
            defaultExpanded: true,
            fields: [
              {
                label: "Subscription Name",
                value: selectedProductView?.product?.name ?? "N/A",
              },
              {
                label: "Status",
                value: selectedProductView?.product?.is_active
                  ? "Active"
                  : "Suspended",
                type: "badge",
                badgeVariant: selectedProductView?.product?.is_active
                  ? "success"
                  : "danger",
              },
              {
                label: "Billing Cycle",
                value: selectedProductView?.billing_cycle
                  ? String(selectedProductView.billing_cycle)
                  : "N/A",
              },
              {
                label: "Current Period Start",
                value: selectedProductView?.renewal_start_date ?? null,
                type: "date",
                icon: Calendar,
              },
              {
                label: "Current Period End",
                value: selectedProductView?.renewal_end_date ?? null,
                type: "date",
                icon: Calendar,
              },
              {
                label: "Quantity",
                value: selectedProductView?.subscriptions ?? "0",
              },
              {
                label: "Price",
                value:
                  (selectedProductView?.company?.profile?.currency ||
                    selectedProductView?.product?.currency ||
                    "USD") +
                  " " +
                  formatNumber(selectedProductView?.selling_price ?? 0),
              },
            ],
          },
          {
            id: "product-details",
            title: "Product Details",
            icon: FileText,
            collapsible: true,
            defaultExpanded: true,
            fields: [
              {
                label: "Category",
                value:
                  selectedProductView?.product?.category?.name ?? "N/A",
              },
              {
                label: "Base Price",
                value:
                  (selectedProductView?.company?.profile?.currency ||
                    selectedProductView?.product?.currency ||
                    "USD") +
                  " " +
                  formatNumber(
                    selectedProductView?.product?.base_price ?? 0
                  ),
              },
            ],
          },
        ]}
      />
        </div>
        )}
      </div>
    </React.Fragment>
  );
};

ProductDetails.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductDetails;
