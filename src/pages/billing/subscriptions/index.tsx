import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { Button, Form } from "react-bootstrap";

import "@assets/scss/billing.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import {
  createCustomer,
  deleteCustomerProductPricing,
  getCustomer,
  getCustomerProductPricingList,
} from "@utils/accounts";
import CreateSubscriptionModal from "@components/CreateSubscriptionModal";
import type { CustomerProductPricingDataItem } from "@utils/accounts";
import { getMinifiedCompanies } from "@utils/crm";
import moment from "moment";
import { formatNumber, GlobalDateFormat } from "@utils/Helper";
import { Package, FileText, Calendar, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@utils/errors";

import GenericTable, { TableColumn, FilterPill } from "@components/GenericTable";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import GenericSidebar from "@components/GenericSidebarNew";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";

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

const normalizePricingStatus = (
  value: unknown,
): CustomerProductPricingDataItem["status"] => {
  const s = String(value ?? "").trim();
  if (
    s === "Active" ||
    s === "Trial" ||
    s === "In Progress" ||
    s === "Suspended" ||
    s === "Inactive"
  ) {
    return s;
  }
  return "Active";
};

const normalizeBillingCycle = (
  value: unknown,
): CustomerProductPricingDataItem["billing_cycle"] => {
  const s = String(value ?? "").trim();
  if (s === "one time" || s === "monthly" || s === "quarterly" || s === "yearly") {
    return s;
  }
  return "one time";
};

const buildEditPricingItem = (row: any): CustomerProductPricingDataItem | null => {
  console.log(row);
  const rawId = row?.product_id ?? row?.product?.id ?? row?.id;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const today = new Date().toISOString().slice(0, 10);

  return {
    product_id: id,
    selling_price: Number(row?.selling_price ?? 0) || 0,
    discount_applicability_id: row?.discount_applicability_id ?? null,
    custom_description: String(row?.custom_description ?? ""),
    is_active: Boolean(row?.is_active ?? row?.product?.is_active ?? true),
    renewal_start_date: String(row?.renewal_start_date ?? today),
    renewal_end_date: String(row?.renewal_end_date ?? today),
    status: normalizePricingStatus(row?.status),
    billing_cycle: normalizeBillingCycle(row?.billing_cycle),
    subscriptions: Math.max(0, Number(row?.subscriptions ?? 0) || 0),
    product: row?.product ?? null,

  };
};

const ProductDetails = () => {
  const [companyOptions, setCompanyOptions] = useState<{ id: string | number; name?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number>("");
  const [refreshKey, setRefreshKey] = useState(0);
  // we resolve customer id in background; no UI needed for this state currently
  const [showCreateSubscriptionModal, setShowCreateSubscriptionModal] =
    useState(false);
  const [createSubscriptionModalKey, setCreateSubscriptionModalKey] =
    useState(0);
  const [deletingProductId, setDeletingProductId] = useState<string | number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    productId: string | number;
    name?: string;
  } | null>(null);

  const [showEditSubscriptionModal, setShowEditSubscriptionModal] = useState(false);
  const [editSubscriptionModalKey, setEditSubscriptionModalKey] = useState(0);
  const [editInitialPricingData, setEditInitialPricingData] = useState<
    CustomerProductPricingDataItem[] | undefined
  >(undefined);


  useEffect(() => {
    const fetchCompanyOptions = async () => {
      try {
        const result = await getMinifiedCompanies({ send_all: "true" });
        setCompanyOptions(result ?? []);
      } catch (e) {
        toast.error(`Failed to load companies: ${getErrorMessage(e)}`, {
          toastId: "billing_subscriptions_load_companies_failed",
        });
      }
    };
    fetchCompanyOptions();
  }, []);

  // Resolve selected customer first (mandatory)
  useEffect(() => {
    let cancelled = false;
    if (!selectedCompanyId) {
      return;
    }

    (async () => {
      try {
        const customer: any = await getCustomer(selectedCompanyId);
        if (cancelled) return;

        if (customer?.success === false && customer?.message === "Not Found") {
          await createCustomer({
            crm_company_id: selectedCompanyId,
            profile: { vat_exemption: false },
          });
          if (cancelled) return;
          // Customer created for this selectedCompanyId; refetch pricing list
          setRefreshKey((k) => k + 1);
        }
      } catch (e) {
        if (cancelled) return;
        toast.error(`Failed to load customer: ${getErrorMessage(e)}`, {
          toastId: "billing_subscriptions_load_customer_failed",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId, setRefreshKey]);
    

  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [totalAllSubscriptions, setTotalAllSubscriptions] = useState(0);

  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
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
      if (!selectedCompanyId) {
        setDataList([]);
        setTotalRecords(0);
        setTotalAllSubscriptions(0);
        setPagination((prev) => ({ ...prev, totalRows: 0 }));
        return;
      }

      const response = (await getCustomerProductPricingList(selectedCompanyId, {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        search: currentFilters.search || "",
        status: currentFilters.status || undefined,
        sort_direction: "desc",
        billing_cycle: currentFilters.billing_cycle || undefined,
      } as any)) as any;

      if (currentRequestId !== requestIdRef.current) return;

      const list = Array.isArray(response) ? response : response?.dataList ?? response?.data ?? [];
      const total =
        response?.meta?.total ??
        response?.recordsTotal ??
        response?.recordsFiltered ??
        (Array.isArray(list) ? list.length : 0);

      setDataList(list);
      setTotalRecords(total);
      setTotalAllSubscriptions(total);
      setPagination((prev) => ({ ...prev, totalRows: total }));
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      toast.error(`Failed to load subscriptions: ${getErrorMessage(error)}`, {
        toastId: "billing_subscriptions_fetch_failed",
      });
      setDataList([]);
      setTotalRecords(0);
      setPagination((prev) => ({ ...prev, totalRows: 0 }));
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [pagination.currentPage, pagination.rowsPerPage, currentFilters, refreshKey, selectedCompanyId]);

  const handleCreateSubscription = useCallback(() => {
    setShowCreateSubscriptionModal(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCreateSubscriptionAndAddAnother = useCallback(() => {
    setCreateSubscriptionModalKey((k) => k + 1);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleEditSubscriptionSaved = useCallback(() => {
    setShowEditSubscriptionModal(false);
    setEditInitialPricingData(undefined);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleOpenEditModal = useCallback((row: any) => {
    const item = buildEditPricingItem(row);
    if (!item) return;
    setEditInitialPricingData([item]);
    setEditSubscriptionModalKey((k) => k + 1);
    setShowEditSubscriptionModal(true);
  }, []);

  const handleDeletePricing = useCallback(
    async (productId: string | number) => {
      if (!selectedCompanyId) return;
      setDeletingProductId(productId);
      try {
        await deleteCustomerProductPricing(selectedCompanyId, productId);
        setRefreshKey((k) => k + 1);
      } catch (e) {
        toast.error(`Failed to delete subscription: ${getErrorMessage(e)}`, {
          toastId: "billing_subscriptions_delete_failed",
        });
      } finally {
        setDeletingProductId(null);
      }
    },
    [selectedCompanyId],
  );

  const openDeleteConfirmation = useCallback((row: any) => {
    const productId = row?.product_id ?? row?.product?.id ?? row?.id;
    if (!productId) return;
    setDeleteTarget({
      productId,
      name: row?.product?.name,
    });
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await handleDeletePricing(deleteTarget.productId);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }, [deleteTarget, handleDeletePricing]);

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
        key: "description",
        label: "Description",
        sortable: true,
        type: "text",
        accessor: (row) => row?.product?.description ?? "",
        render: (row) => (
          <div>
            <span>{row?.product?.description ?? "-"}</span>
          </div>
        ),
      },

      {
        key: "base_price",
        label: "Base Price",
        sortable: true,
        type: "text",
        accessor: (row) => row?.product?.base_price ?? "",
        render: (row) => (
          <div>
            <span>{`${row?.product?.currency ?? "AED"} ${formatNumber(row?.product?.base_price ?? 0)}`}</span>
          </div>
        ),
      },
      {
        key: "selling_price",
        label: "Selling Price",
        sortable: true,
        type: "text",
        accessor: (row) => row?.selling_price ?? "",
        render: (row) => (
          <div>
            <span>{`${row?.product?.currency ?? "AED"} ${formatNumber(row?.selling_price ?? 0)}`}</span>
          </div>
        ),
      },

    
      {
        key: "renewal_start_date",
        label: "Renewal Start",
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
        label: "Renewal End",
        sortable: true,
        type: "text",
        accessor: (row) =>
          row?.renewal_end_date
            ? moment(row.renewal_end_date).format(GlobalDateFormat)
            : "",
        emptyValue: "-",
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
        key: "subscriptions",
        label: "Quantity",
        sortable: true,
        type: "text",
        accessor: (row) => row?.subscriptions ?? "0",
        emptyValue: "0",
      },
     
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        type: "custom",
        render: (row) => {
          const productId = row?.product_id ?? row?.product?.id ?? row?.id;
          const isDeleting = deletingProductId != null && deletingProductId === productId;
          return (
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="sm"
                variant="outline-primary"
                disabled={!productId || isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenEditModal(row);
                }}
              >
                Edit
              </Button>

              <Button
                size="sm"
                variant="outline-danger"
                disabled={!productId || isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!productId) return;
                  openDeleteConfirmation(row);
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          );
        },
      },
    ],
    [deletingProductId, handleOpenEditModal, openDeleteConfirmation]
  );

  const [selectedProductView, setSelectedProductView] = useState<any>(null);
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
    for (let i = 0; i < (seed || "").length; i++) n += seed.codePointAt(i) ?? 0;
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

  const applyStatusFilter = useCallback((status: string) => {
    setCurrentFilters((prev) => ({ ...prev, status }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRefreshKey((k) => k + 1);
  }, []);

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
            <button
              key={s}
              type="button"
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: currentFilters.status === s ? "#f0f0f0" : "transparent",
                borderRadius: "4px",
                border: "none",
                width: "100%",
                textAlign: "left",
              }}
              onClick={() => applyStatusFilter(s)}
            >
              {s}
            </button>
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
  ], [currentFilters, applyStatusFilter]);

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
        onClick={() => setShowCreateSubscriptionModal(true)}
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
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2">
              <Form.Select
                size="sm"
                style={{ width: "220px" }}
                value={String(selectedCompanyId)}
                onChange={(e) =>
                  setSelectedCompanyId(
                    e.target.value === "" ? "" : e.target.value,
                  )
                }
              >
                <option value="">Select company</option>
                {companyOptions.map(
                  (c: { id: string | number; name?: string }) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? c.id}
                    </option>
                  ),
                )}
              </Form.Select>
            </div>
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
        emptyMessage={
          selectedCompanyId === ""
            ? "Select company to view subscriptions  "
            : "No subscriptions found"
        }
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

      {showCreateSubscriptionModal && (
        <CreateSubscriptionModal
          key={createSubscriptionModalKey}
          customerId={selectedCompanyId}
          onClose={() => setShowCreateSubscriptionModal(false)}
          onCreate={handleCreateSubscription}
          onCreateAndAddAnother={handleCreateSubscriptionAndAddAnother}
        />
      )}

      {showEditSubscriptionModal && (
        <CreateSubscriptionModal
          key={editSubscriptionModalKey}
          mode="edit"
          initialPricingData={editInitialPricingData}
          customerId={selectedCompanyId}
          onClose={() => {
            setShowEditSubscriptionModal(false);
            setEditInitialPricingData(undefined);
          }}
          onCreate={handleEditSubscriptionSaved}
          onCreateAndAddAnother={handleEditSubscriptionSaved}
        />
      )}

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          if (!deletingProductId) {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          confirmDelete().then(() => undefined);
        }}
        itemType="subscription"
        itemName={deleteTarget?.name}
        loading={deletingProductId != null}
      />
    </React.Fragment>
  );
};

ProductDetails.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductDetails;
