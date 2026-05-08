import "@components/billings/customer/billingCustomerDatatablePortalStyles";
import { BillingCustomerPortalTableShell } from "@components/billings/customer/BillingCustomerPortalTableShell";
import React, {
  ReactElement,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

import { deleteCustomerProductPricing } from "@utils/accounts";
import { useBillingCustomerSubscriptionsPricingQuery } from "@page-modules/billing/customer/useBillingCustomerSubscriptionsPricingQuery";
import CreateSubscriptionModal from "@components/CreateSubscriptionModal";
import type { CustomerProductPricingDataItem } from "@utils/accounts";
import moment from "moment";
import {
  formatDateTimeGlobal,
  formatNumber,
  GlobalDateFormat,
} from "@utils/Helper";
import { Package, FileText, Calendar, Plus } from "lucide-react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { getErrorMessage } from "@utils/errors";
import { toDateInputValue } from "@utils/dateInputValue";
import { getBillingCustomerPortalTabsDropdownItems } from "@utils/billingProductsTabs";
import { billingCustomerRoutes } from "@utils/billingCustomerRoutes";

import GenericTable, { TableColumn, FilterPill } from "@components/GenericTable";
import { GENERIC_TABLE_PAGE_SIZE_OPTIONS } from "@constants/genericTable";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import GenericSidebar from "@components/GenericSidebarNew";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import { useEnsureCustomerForCrmCompany } from "@hooks/billing/useEnsureCustomerForCrmCompany";
import { useMinifiedCompaniesForSelect } from "@hooks/billing/useMinifiedCompaniesForSelect";
import { BillingCustomerCompanySelect } from "@components/billings/customer/BillingCustomerCompanySelect";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import ColumnEditorModal from "@components/ColumnEditorModal";

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
  const raw =
    typeof value === "string" || typeof value === "number" ? String(value) : "";
  const s = raw.trim();
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

function formatNextBillingDateFilterPillLabel(from?: string, to?: string): string | undefined {
  const fromD = from?.trim();
  const toD = to?.trim();
  if (fromD && toD) {
    return `${moment(fromD).format("MMM D")} – ${moment(toD).format("MMM D, YYYY")}`;
  }
  if (fromD) {
    return moment(fromD).format("MMM D, YYYY");
  }
  if (toD) {
    return moment(toD).format("MMM D, YYYY");
  }
  return undefined;
}

/** YYYY-MM-DD compares correctly as strings. */
function renewalEndDateOnOrAfterStart(
  start: string | undefined,
  end: string | undefined,
): string | undefined {
  const s = start?.trim();
  const e = end?.trim();
  if (!e) {
    return end;
  }
  if (!s) {
    return end;
  }
  if (e < s) {
    return s;
  }
  return end;
}

const BILLING_SUBSCRIPTIONS_COLUMN_STORAGE_KEY = "billing-subscriptions-table-columns";

const DEFAULT_SUBSCRIPTION_TABLE_COLUMN_KEYS: string[] = [
  "name",
  "description",
  "base_price",
  "selling_price",
  "renewal_start_date",
  "renewal_end_date",
  "status",
  "billing_cycle",
  "subscriptions",
  "actions",
];

function parseStoredSubscriptionColumnKeys(raw: string | null): string[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    const allowed = new Set(DEFAULT_SUBSCRIPTION_TABLE_COLUMN_KEYS);
    const keys = parsed.filter(
      (k): k is string => typeof k === "string" && allowed.has(k),
    );
    return keys.length > 0 ? keys : null;
  } catch {
    return null;
  }
}

function loadSubscriptionTableColumnsFromStorage(): string[] {
  const win = (globalThis as unknown as { window?: Window & { localStorage: Storage } }).window;
  if (win === undefined) {
    return [...DEFAULT_SUBSCRIPTION_TABLE_COLUMN_KEYS];
  }
  const stored = parseStoredSubscriptionColumnKeys(
    win.localStorage.getItem(BILLING_SUBSCRIPTIONS_COLUMN_STORAGE_KEY),
  );
  return stored ?? [...DEFAULT_SUBSCRIPTION_TABLE_COLUMN_KEYS];
}

const normalizeBillingCycle = (
  value: unknown,
): CustomerProductPricingDataItem["billing_cycle"] => {
  const raw =
    typeof value === "string" || typeof value === "number" ? String(value) : "";
  const s = raw.trim();
  if (s === "one time" || s === "monthly" || s === "quarterly" || s === "yearly") {
    return s;
  }
  return "one time";
};

const buildEditPricingItem = (row: any): CustomerProductPricingDataItem | null => {
  const rawId = row?.product_id ?? row?.product?.id ?? row?.id;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const start =
    toDateInputValue(row?.renewal_start_date) ||
    toDateInputValue(row?.renewal_start) ||
    today;
  const end =
    toDateInputValue(row?.renewal_end_date) ||
    toDateInputValue(row?.renewal_end) ||
    today;

  return {
    product_id: id,
    selling_price: Number(row?.selling_price ?? 0) || 0,
    discount_applicability_id: row?.discount_applicability_id ?? null,
    custom_description: String(row?.custom_description ?? ""),
    is_active: Boolean(row?.is_active ?? row?.product?.is_active ?? true),
    renewal_start_date: start,
    renewal_end_date: end,
    status: normalizePricingStatus(row?.status),
    billing_cycle: normalizeBillingCycle(row?.billing_cycle),
    subscriptions: Math.max(0, Number(row?.subscriptions ?? 0) || 0),
    product: row?.product ?? null,

  };
};

const ProductDetails = () => {
  const { hasPermission } = usePermissions();
  const canViewSubscriptions = hasPermission(PERMISSIONS.VIEW_PRODUCT_DETAILS_BILLING);
  const canCreateSubscription = hasPermission(PERMISSIONS.CREATE_SUBSCRIPTIONS_BILLING);
  const canUpdateSubscription = hasPermission(PERMISSIONS.UPDATE_SUBSCRIPTIONS_BILLING);
  const canDeleteSubscription = hasPermission(PERMISSIONS.DELETE_SUBSCRIPTIONS_BILLING);

  const { companyOptions } = useMinifiedCompaniesForSelect(
    "billing_subscriptions_load_companies_failed",
  );
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


  const onAccountingCustomerCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEnsureCustomerForCrmCompany(selectedCompanyId, {
    onCreated: onAccountingCustomerCreated,
    errorToastId: "billing_subscriptions_load_customer_failed",
  });

  const [subscriptionSearch, setSubscriptionSearch] = useState("");

  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<{
    search?: string;
    status?: string;
    billing_cycle?: string;
    renewal_start_date?: string;
    renewal_end_date?: string;
  }>({});

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

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

  const subscriptionsFiltersKey = useMemo(
    () =>
      JSON.stringify({
        search: currentFilters.search ?? "",
        status: currentFilters.status ?? "",
        billing_cycle: currentFilters.billing_cycle ?? "",
        renewal_start_date: currentFilters.renewal_start_date ?? "",
        renewal_end_date: currentFilters.renewal_end_date ?? "",
      }),
    [
      currentFilters.search,
      currentFilters.status,
      currentFilters.billing_cycle,
      currentFilters.renewal_start_date,
      currentFilters.renewal_end_date,
    ],
  );

  const pricingQuery = useBillingCustomerSubscriptionsPricingQuery({
    crmId: selectedCompanyId ? String(selectedCompanyId) : "",
    page: pagination.currentPage,
    perPage: pagination.rowsPerPage,
    filtersKey: subscriptionsFiltersKey,
    refreshKey,
    search: currentFilters.search || "",
    status: currentFilters.status || undefined,
    billing_cycle: currentFilters.billing_cycle || undefined,
    renewal_start_date: currentFilters.renewal_start_date || undefined,
    renewal_end_date: currentFilters.renewal_end_date || undefined,
  });

  const dataList = pricingQuery.data?.list ?? [];
  const loading = pricingQuery.isFetching;
  const totalRecords = pricingQuery.data?.total ?? 0;
  const totalAllSubscriptions = totalRecords;

  useEffect(() => {
    const total = pricingQuery.data?.total ?? 0;
    setPagination((prev) => ({ ...prev, totalRows: total }));
  }, [pricingQuery.data?.total]);

  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

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
    if (!canUpdateSubscription) return;
    const item = buildEditPricingItem(row);
    if (!item) return;
    setEditInitialPricingData([item]);
    setEditSubscriptionModalKey((k) => k + 1);
    setShowEditSubscriptionModal(true);
  }, [canUpdateSubscription]);

  const handleDeletePricing = useCallback(
    async (productId: string | number) => {
      if (!canDeleteSubscription || !selectedCompanyId) return;
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
    [selectedCompanyId, canDeleteSubscription],
  );

  const openDeleteConfirmation = useCallback((row: any) => {
    if (!canDeleteSubscription) return;
    const productId = row?.product_id ?? row?.product?.id ?? row?.id;
    if (!productId) return;
    setDeleteTarget({
      productId,
      name: row?.product?.name,
    });
    setShowDeleteModal(true);
  }, [canDeleteSubscription]);

  const confirmDelete = useCallback(async () => {
    if (!canDeleteSubscription || !deleteTarget) return;
    await handleDeletePricing(deleteTarget.productId);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }, [deleteTarget, handleDeletePricing, canDeleteSubscription]);

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
            <div className="d-flex gap-1">
              {canUpdateSubscription ? (
              <button
                type="button"
                className="bc-table-icon-btn bc-table-icon-btn--primary"
                disabled={!productId || isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenEditModal(row);
                }}
              >
                <FiEdit size={16} />
              </button>
              ) : null}

              {canDeleteSubscription ? (
              <button
                type="button"
                className="bc-table-icon-btn bc-table-icon-btn--danger"
                disabled={!productId || isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!productId) return;
                  openDeleteConfirmation(row);
                }}
                title={isDeleting ? "Deleting..." : "Delete"}
              >
                <FiTrash2 size={16} />
              </button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      deletingProductId,
      handleOpenEditModal,
      openDeleteConfirmation,
      canUpdateSubscription,
      canDeleteSubscription,
    ]
  );

  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => [
    ...DEFAULT_SUBSCRIPTION_TABLE_COLUMN_KEYS,
  ]);

  useEffect(() => {
    setSelectedColumns(loadSubscriptionTableColumnsFromStorage());
  }, []);

  const visibleTableColumns = useMemo(
    () => tableColumns.filter((c) => selectedColumns.includes(c.key)),
    [tableColumns, selectedColumns],
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

  const applyBillingCycleFilter = useCallback((billingCycle: string) => {
    setCurrentFilters((prev) => ({ ...prev, billing_cycle: billingCycle }));
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
        <div className="bc-filter-dropdown-min-200">
          {["Active", "Trial", "Inactive", "Suspended"].map((s) => (
            <button
              key={s}
              type="button"
              className={`bc-filter-pill-option${currentFilters.status === s ? " bc-filter-pill-option--active" : ""}`}
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
      active: !!(currentFilters.renewal_start_date || currentFilters.renewal_end_date),
      activeLabel: formatNextBillingDateFilterPillLabel(
        currentFilters.renewal_start_date,
        currentFilters.renewal_end_date,
      ),
      onClear: () => {
        setCurrentFilters((prev) => {
          const { renewal_start_date, renewal_end_date, ...rest } = prev;
          return rest;
        });
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        setRefreshKey((k) => k + 1);
      },
      dropdownContent: (
        <div className="bc-filter-dropdown-min-220">
          <div className="bc-filter-date-label">From</div>
          <input
            type="date"
            value={currentFilters.renewal_start_date ?? ""}
            max={currentFilters.renewal_end_date || undefined}
            className="bc-filter-date-input bc-filter-date-input--mb"
            onChange={(e) => {
              const nextStart = e.target.value || undefined;
              setCurrentFilters((prev) => ({
                ...prev,
                renewal_start_date: nextStart,
                renewal_end_date: renewalEndDateOnOrAfterStart(nextStart, prev.renewal_end_date),
              }));
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
              setRefreshKey((k) => k + 1);
            }}
          />
          <div className="bc-filter-date-label">To</div>
          <input
            type="date"
            value={currentFilters.renewal_end_date ?? ""}
            min={currentFilters.renewal_start_date || undefined}
            className="bc-filter-date-input"
            onChange={(e) => {
              const nextEndRaw = e.target.value || undefined;
              setCurrentFilters((prev) => ({
                ...prev,
                renewal_end_date: renewalEndDateOnOrAfterStart(prev.renewal_start_date, nextEndRaw),
              }));
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
              setRefreshKey((k) => k + 1);
            }}
          />
        </div>
      ),
    },
    {
      id: "billing_cycle",
      label: "Billing Cycle",
      showDropdown: true,
      active: !!currentFilters.billing_cycle,
      activeLabel: currentFilters.billing_cycle ? String(currentFilters.billing_cycle) : undefined,
      onClear: () => {
        setCurrentFilters((prev) => {
          const { billing_cycle, ...rest } = prev;
          return rest;
        });
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        setRefreshKey((k) => k + 1);
      },
      dropdownContent: (
        <div className="bc-filter-dropdown-min-200">
          {["monthly", "quarterly", "yearly", "one time"].map((cycle) => (
            <button
              key={cycle}
              type="button"
              className={`bc-filter-pill-option bc-filter-pill-option--capitalize${currentFilters.billing_cycle === cycle ? " bc-filter-pill-option--active" : ""}`}
              onClick={() => applyBillingCycleFilter(cycle)}
            >
              {cycle}
            </button>
          ))}
        </div>
      ),
    },
  ], [currentFilters, applyStatusFilter, applyBillingCycleFilter]);

  // Add Subscription button
  const renderAddSubscriptionButton = () =>
    canCreateSubscription ? (
    <div className="bc-table-toolbar-floating">
      <button
        type="button"
        className="bc-btn-billing-dark"
        onClick={() => setShowCreateSubscriptionModal(true)}
      >
        <Plus size={16} />
        Add Subscription
      </button>

    </div>
  ) : null;

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
    onTabAdd: undefined,
    onTabRemove: () => {},
    tabsDropdownLabel: "Subscriptions",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => {},
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: false,
    onImportClick: () => {},
    currentTableView: "table",
    onTableViewChange: () => {},
    showTableViewDropdown: false,
    showSearch: false,
    showExportButton: false,
    showSaveButton: false,
    extensions: [],
    onPaginationReset: () => setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: renderAddSubscriptionButton(),
  });

  const tabsDropdownItems = useMemo(
    () => getBillingCustomerPortalTabsDropdownItems((permission) => hasPermission(permission)),
    [hasPermission],
  );

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

  if (!canViewSubscriptions) {
    return null;
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Billing"
        mainLink={billingCustomerRoutes.dashboard()}
        subTitle="Subscriptions"
      />

      {/* Main flex container for content and sidebar — same pattern as prospects.tsx */}
      <BillingCustomerPortalTableShell>
        {/* Main content area */}
        <div className="bc-main-scroll">

          {/* Company selector above the table */}
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2">
              <BillingCustomerCompanySelect
                value={selectedCompanyId}
                onChange={(next) => setSelectedCompanyId(next)}
                companies={companyOptions}
                emptyOptionLabel="Select company"
              />
            </div>
          </div>

      <GenericTable
        data={dataList}
        columns={visibleTableColumns}
        showToolbarActions={false}
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
        fixedHeight={true}
        maxHeight="calc(100vh - 345px)"
        showToolbar={true}
        toolbar={{
          ...subscriptionsToolbarConfig,
          tabsDropdownItems,
          showFilterPills: true,
          filterPills: subscriptionFilterPills,
          showMoreFiltersButton: false,
          showAdvancedFilters: false,
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
        <div className="bc-sidebar-border-start">
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
                value: formatDateTimeGlobal(
                  selectedProductView?.renewal_start_date,
                ),
                type: "datetime",
                icon: Calendar,
              },
              {
                label: "Current Period End",
                value: formatDateTimeGlobal(
                  selectedProductView?.renewal_end_date,
                ),
                type: "datetime",
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
      </BillingCustomerPortalTableShell>

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
              BILLING_SUBSCRIPTIONS_COLUMN_STORAGE_KEY,
              JSON.stringify(keys),
            );
          }
        }}
      />

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
