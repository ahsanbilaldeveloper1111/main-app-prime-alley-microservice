import "@components/billings/customer/billingCustomerDatatableCommonTabsStyles";
import "@assets/scss/billing.scss";
import { BillingCustomerPortalTableShell } from "@components/billings/customer/BillingCustomerPortalTableShell";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { parsePhoneNumber as parsePhoneNumberInput } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Button,
  Modal,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;
import { useRouter } from "next/router";
import { formatDateTimeGlobal } from "@utils/Helper";
import moment from "moment";
import KanbanBoard, { prospectsToKanbanColumns } from "@components/KanbanBoard";
import ProspectEditSidebar, {
  type ProspectFormState as ProspectSidebarFormState,
} from "@components/ProspectEditSidebar";
import CreateProductModal from "@components/CreateModalProduct";
import {
  FiTrash2,
  FiEdit
} from "react-icons/fi";
import {
  Clock as ClockIcon,
  Plus,
  History,
  FileText,
  Target,
} from "lucide-react";
import GenericTable, {
  TableColumn,
  TableAction,
  FilterPill,
  TabConfig,
} from "@components/GenericTable";
import { GENERIC_TABLE_PAGE_SIZE_OPTIONS } from "@constants/genericTable";

import GenericSidebar from "@components/GenericSidebarNew";
import GenericFilterSidebar, {
  type FilterField,
  type FilterOption,
} from "@components/GenericFilterSidebar";
import { type StatsCardData } from "@components/GenericStatsCards";
import {
  deleteProduct,
  getProductCategoriesList,
  getProducts,
  type ProductCategoryData,
  type ProductData,
} from "@utils/accounts";

import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";

/** Row from `getProducts` / list-products — not CRM `getCrmData`. */
type BillingProductRow = ProductData & Record<string, unknown>;

import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import ColumnEditorModal from "@components/ColumnEditorModal";
import { getBillingCustomerPortalTabsDropdownItems } from "@utils/billingProductsTabs";
import { billingCustomerRoutes } from "@utils/billingCustomerRoutes";

const VALID_FILTERS = new Set(["all"]);

function billingProductActiveFilterToDropdownValue(
  isActive: boolean | undefined,
): string {
  if (isActive === true) {
    return "true";
  }
  if (isActive === false) {
    return "false";
  }
  return "";
}

function billingProductDropdownValueToActiveFilter(
  value: string,
): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

// Helper function to get initials from name (first two words, first two letters, only a-z)
const getInitials = (name: string): string => {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "NA";

  const words = trimmed.split(/\s+/).slice(0, 2);
  const alphaSingle = /[a-z]/i;
  const firstAlphaUpper = (value: string): string | undefined => {
    const m = alphaSingle.exec(value);
    return m?.[0] ? m[0].toUpperCase() : undefined;
  };

  const w1 = words[0] ?? "";
  const w2 = words[1];
  const first = firstAlphaUpper(w1);
  const second = w2 ? firstAlphaUpper(w2) : undefined;
  if (first && second) return first + second;

  // Fallback: first two letters (a-z only) from first word
  const letters: string[] = [];
  const alphaGlobal = /[a-z]/gi;
  let match: RegExpExecArray | null;
  while ((match = alphaGlobal.exec(w1)) !== null && letters.length < 2) {
    letters.push(match[0].toUpperCase());
  }
  if (letters.length >= 2) return letters[0] + letters[1];
  if (letters.length === 1) return letters[0];
  return "NA";
};

// Helper function to generate a consistent background color based on name
const getRandomColor = (name: string): string => {
  if (name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (name.codePointAt(i) ?? 0) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const saturation = 50 + (Math.abs(hash) % 30); // 50-80%
    const lightness = 40 + (Math.abs(hash) % 20); // 40-60%
    return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
  }
  return "#6c757d";
};

// Product field accessors (shared between table columns and sidebar)
function getProductDisplayName(row: { id?: unknown; name?: string; title?: string } | null): string {
  const name = row?.name ?? row?.title;
  if (name) return name;
  if (row?.id == null) return "N/A";
  const idDisplay =
    typeof row.id === "string" || typeof row.id === "number"
      ? String(row.id)
      : "?";
  return `Product #${idDisplay}`;
}
const getProductSku = (row: { sku?: string; data?: { sku?: string } } | null, emptyFallback = "--"): string =>
  row?.sku ?? row?.data?.sku ?? emptyFallback;

type ProductCategoryRowSlice = {
  category_id?: string | number;
  category?: { name?: string } | null;
  data?: {
    category_id?: string | number;
    category?: { name?: string } | null;
  };
} | null;

/** Product catalog category label: nested `category.name` from API, else lookup by `category_id`. */
function getProductCategoryDisplayName(
  row: ProductCategoryRowSlice,
  idToName: ReadonlyMap<string, string>,
): string {
  const fromApi = row?.category?.name ?? row?.data?.category?.name;
  if (typeof fromApi === "string" && fromApi.trim() !== "") {
    return fromApi.trim();
  }
  const rawId = row?.category_id ?? row?.data?.category_id;
  if (rawId === undefined || rawId === null) {
    return "—";
  }
  const idStr = String(rawId).trim();
  if (idStr === "") {
    return "—";
  }
  return idToName.get(idStr) ?? "—";
}
const formatProductPriceAED = (row: { base_price?: unknown; data?: { base_price?: unknown } } | null, emptyFallback = "--"): string => {
  const price = row?.base_price ?? row?.data?.base_price;
  if (price == null || price === "") {
    return emptyFallback;
  }
  let n: number;
  if (typeof price === "number") {
    n = price;
  } else if (typeof price === "string") {
    n = Number.parseFloat(price.replaceAll(",", ""));
  } else {
    return emptyFallback;
  }
  if (!Number.isFinite(n)) {
    return emptyFallback;
  }
  return `AED ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Billing products toolbar (same UX as billing subscriptions filter pills). */
function formatBillingProductsFilterDateLabel(from?: string, to?: string): string | undefined {
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

function billingProductsIsActiveLabel(isActive: unknown): string | undefined {
  if (isActive === true) return "Active";
  if (isActive === false) return "Inactive";
  return undefined;
}

function billingProductsTodayYmd(): string {
  return moment().format("YYYY-MM-DD");
}

/** YYYY-MM-DD compares correctly as strings (end not before start, not after today). */
function billingProductsDateToOnOrAfterFrom(
  start: string | undefined,
  end: string | undefined,
): string | undefined {
  const todayYmd = billingProductsTodayYmd();
  const s = start?.trim();
  let e = end?.trim();
  if (!e) {
    return end;
  }
  if (e > todayYmd) {
    e = todayYmd;
  }
  if (!s) {
    return e;
  }
  if (e < s) {
    return s;
  }
  return e;
}

/** Latest selectable "from" date: not after today and not after "to" (YYYY-MM-DD string order). */
function billingProductsUpperBoundForCreatedFrom(
  to: string | undefined,
  todayYmd: string,
): string {
  const te = to?.trim();
  if (!te) {
    return todayYmd;
  }
  return te < todayYmd ? te : todayYmd;
}

/** Local calendar day from HTML `type="date"` → start of day as UTC ISO for list-products. */
function billingProductsCreatedAtFromUtcIso(ymd: string | undefined): string | undefined {
  const s = ymd?.trim();
  if (!s) {
    return undefined;
  }
  const m = moment(s, "YYYY-MM-DD", true);
  if (!m.isValid()) {
    return undefined;
  }
  return m.startOf("day").utc().toISOString();
}

/** Local calendar day from HTML `type="date"` → end of day as UTC ISO for list-products. */
function billingProductsCreatedAtToUtcIso(ymd: string | undefined): string | undefined {
  const s = ymd?.trim();
  if (!s) {
    return undefined;
  }
  const m = moment(s, "YYYY-MM-DD", true);
  if (!m.isValid()) {
    return undefined;
  }
  return m.endOf("day").utc().toISOString();
}

const BILLING_PRODUCTS_COLUMN_STORAGE_KEY = "billing-products-table-columns";

const DEFAULT_PRODUCT_TABLE_COLUMN_KEYS: string[] = [
  "name",
  "sku",
  "category_id",
  "base_price",
  "is_active",
  "created_at",
  "actions",
];

function parseStoredProductColumnKeys(raw: string | null): string[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    const allowed = new Set(DEFAULT_PRODUCT_TABLE_COLUMN_KEYS);
    const keys = parsed.filter(
      (k): k is string => typeof k === "string" && allowed.has(k),
    );
    return keys.length > 0 ? keys : null;
  } catch {
    return null;
  }
}

function loadProductTableColumnsFromStorage(): string[] {
  const win = (globalThis as unknown as { window?: Window & { localStorage: Storage } }).window;
  if (win === undefined) {
    return [...DEFAULT_PRODUCT_TABLE_COLUMN_KEYS];
  }
  const fromDedicated = parseStoredProductColumnKeys(
    win.localStorage.getItem(BILLING_PRODUCTS_COLUMN_STORAGE_KEY),
  );
  if (fromDedicated) {
    return fromDedicated;
  }
  const legacy = parseStoredProductColumnKeys(win.localStorage.getItem("crmDataSelectedColumns"));
  return legacy ?? [...DEFAULT_PRODUCT_TABLE_COLUMN_KEYS];
}

const BillingManagement = () => {
  const { data: session } = useSession();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const canAccessBillingProducts = hasAnyPermission([
    PERMISSIONS.VIEW_PRODUCTS_BILLING,
    PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT,
  ]);
  const canCreateBillingProduct = hasPermission(PERMISSIONS.CREATE_PRODUCTS_BILLING);
  const canUpdateBillingProduct = hasPermission(PERMISSIONS.UPDATE_PRODUCTS_BILLING);
  const canDeleteBillingProduct = hasPermission(PERMISSIONS.DELETE_PRODUCTS_BILLING);
  const tabsDropdownItems = useMemo(
    () => getBillingCustomerPortalTabsDropdownItems((permission) => hasPermission(permission)),
    [hasPermission],
  );
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  /** Sidebar search, status, category, created range; applied to `currentFilters` only when user clicks Apply. */
  const [filterSidebarDraft, setFilterSidebarDraft] = useState<{
    search: string;
    is_active: boolean | undefined;
    category_id: string;
    created_at_from: string;
    created_at_to: string;
  }>({
    search: "",
    is_active: undefined,
    category_id: "",
    created_at_from: "",
    created_at_to: "",
  });
  const [productCategories, setProductCategories] = useState<ProductCategoryData[]>([]);
  const requestIdRef = useRef(0);


  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // Sidebar states
  const [showProspectSidebar, setShowProspectSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const sidebarProspectFetchTokenRef = useRef(0);

  // Add Contacts button states
  const [showAddContactsDropdown, setShowAddContactsDropdown] = useState(false);
  const [showCreateContactSidebar, setShowCreateContactSidebar] =
    useState(false);
  const addContactsRef = useRef<HTMLDivElement>(null);
  const [contactForm, setContactForm] = useState<ProspectSidebarFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone_country_code: "",
    phoneNumber: "",
    campaign_id: null,
    campaign_name: null,
    campaign_status: null,
    contact_owner: null,
    lifecycle_stage: "Lead",
    disposition: "",
    legal_basis: [],
    company_domain: "",
    scheduled_call_at: "",
    tags: [],
    note: "",
    source_file: "",
    source: "",
    custom_fields: [],
  });
  const [createContactLoading] = useState(false);
  
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [createProductModalKey, setCreateProductModalKey] = useState(0);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // Initialize activeFilter state
  const [activeFilter, setActiveFilter] = useState("all");

  // Read tab from URL on mount and when router is ready
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const tabFromUrl = String(router.query.tab);
      if (VALID_FILTERS.has(tabFromUrl)) {
        setActiveFilter(tabFromUrl);
      }
    }
  }, [router.isReady, router.query.tab]);

  // Open Create Contact sidebar when navigated from header (Ticket = Prospect)
  useEffect(() => {
    if (!router.isReady || router.query.createContact !== "1") return;
    setShowCreateContactSidebar(true);

    const { createContact: _, editContactId: __, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, {
      shallow: true,
    });
  }, [router.isReady, router.query.createContact, router]);

  // Close Add Contacts dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addContactsRef.current &&
        !addContactsRef.current.contains(event.target as Node)
      ) {
        setShowAddContactsDropdown(false);
      }
    };

    if (showAddContactsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddContactsDropdown]);

  // Handler to update filter and URL
  const handleFilterChange = useCallback(
    (filterId: string) => {
      setActiveFilter(filterId);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      // Prevent showing stale totalRecords on "Convert to Leads" tab until new data loads
      if (filterId === "has_leads") {
        setLoading(true);
      }

      // Update URL with tab query parameter
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, tab: filterId },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );
  const [prospectsSearch, setProspectsSearch] = useState("");
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  /** View mode: table or board; dropdown shows only the other option to switch */
  const [prospectsViewMode, setProspectsViewMode] = useState<
    "table" | "board"
  >("table");

  // Column customization and pagination states (defaults SSR-safe; hydrate from localStorage on client)
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => [
    ...DEFAULT_PRODUCT_TABLE_COLUMN_KEYS,
  ]);

  useEffect(() => {
    setSelectedColumns(loadProductTableColumnsFromStorage());
  }, []);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [dataList, setDataList] = useState<BillingProductRow[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  /** Total count of all products (unchanged when switching tabs) */
  const [totalAllProducts, setTotalAllProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>({
    assigned_records: 0,
    unassigned_records: 0,
    active_count: 0,
    inactive_count: 0,
    out_of_stock_count: 0,
    total_value: 0,
  });

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  useEffect(() => {
    let cancelled = false;
    getProductCategoriesList({ page: 1 })
      .then((list) => {
        if (cancelled) return;
        setProductCategories(Array.isArray(list.data) ? list.data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setProductCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const productCategoryIdToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of productCategories) {
      if (c && typeof c.id === "number") {
        const label = String(c.name ?? "").trim() || `Category ${c.id}`;
        m.set(String(c.id), label);
      }
    }
    return m;
  }, [productCategories]);

  // Keep `prospectsSearch` (filters sidebar / board) and fetch `currentFilters.search` in sync.
  useEffect(() => {
    setCurrentFilters((prev) => ({ ...prev, search: prospectsSearch || undefined }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [prospectsSearch]);

  const buildProductsParams = useCallback(
    (overrides: { page?: number; per_page?: number } = {}) => {
      const params: Record<string, unknown> = {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        ...overrides,
      };

      if (memoizedFilters.search) params.search = memoizedFilters.search;
      if (typeof memoizedFilters.is_active === "boolean") {
        params.is_active = memoizedFilters.is_active;
      }
      const categoryIdParam = memoizedFilters.category_id;
      if (
        categoryIdParam !== undefined &&
        categoryIdParam !== null &&
        String(categoryIdParam).trim() !== ""
      ) {
        params.category_id = String(categoryIdParam).trim();
      }
      const createdFromUtc = billingProductsCreatedAtFromUtcIso(
        memoizedFilters.created_at_from,
      );
      if (createdFromUtc) {
        params.created_at_from = createdFromUtc;
      }
      const createdToUtc = billingProductsCreatedAtToUtcIso(memoizedFilters.created_at_to);
      if (createdToUtc) {
        params.created_at_to = createdToUtc;
      }

      if (pagination.sortColumn) {
        params["order[column]"] = pagination.sortColumn;
        params["order[dir]"] = pagination.sortDirection;
      }

      return params;
    },
    [
      memoizedFilters.search,
      memoizedFilters.is_active,
      memoizedFilters.category_id,
      memoizedFilters.created_at_from,
      memoizedFilters.created_at_to,
      pagination.currentPage,
      pagination.rowsPerPage,
      pagination.sortColumn,
      pagination.sortDirection,
    ],
  );

  // Handle filter changes (toolbar / sidebar); fetch follows `currentFilters` via `buildProductsParams`.
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
  }, []);

  const applyIsActiveFilter = useCallback((isActive: boolean) => {
    setCurrentFilters((prev) => ({ ...prev, is_active: isActive }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRefreshKey((k) => k + 1);
  }, []);

  // Filter pills: Active/Inactive (`is_active` true/false) + Create date (`created_at_from` / `created_at_to`).
  const productsFilterPills = useMemo<FilterPill[]>(() => {
    const todayYmd = billingProductsTodayYmd();
    const createdFromMax = billingProductsUpperBoundForCreatedFrom(
      currentFilters.created_at_to,
      todayYmd,
    );
    const createDateDropdown = (
      <div className="bc-filter-dropdown-min-220">
        <div className="bc-filter-date-label">
          From
        </div>
        <input
          type="date"
          value={currentFilters.created_at_from ?? ""}
          max={createdFromMax}
          className="bc-filter-date-input bc-filter-date-input--mb"
          onChange={(e) => {
            const nextStart = e.target.value || undefined;
            setCurrentFilters((prev) => ({
              ...prev,
              created_at_from: nextStart,
              created_at_to: billingProductsDateToOnOrAfterFrom(
                nextStart,
                prev.created_at_to,
              ),
            }));
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
            setRefreshKey((k) => k + 1);
          }}
        />
        <div className="bc-filter-date-label">
          To
        </div>
        <input
          type="date"
          value={currentFilters.created_at_to ?? ""}
          min={currentFilters.created_at_from || undefined}
          max={todayYmd}
          className="bc-filter-date-input"
          onChange={(e) => {
            const nextEndRaw = e.target.value || undefined;
            setCurrentFilters((prev) => ({
              ...prev,
              created_at_to: billingProductsDateToOnOrAfterFrom(
                prev.created_at_from,
                nextEndRaw,
              ),
            }));
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );

    return [
      {
        id: "is_active",
        label: "Status",
        showDropdown: true,
        active: typeof currentFilters.is_active === "boolean",
        activeLabel: billingProductsIsActiveLabel(currentFilters.is_active),
        onClear: () => {
          setCurrentFilters((prev) => {
            const { is_active, ...rest } = prev;
            return rest;
          });
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((k) => k + 1);
        },
        dropdownContent: (
          <div className="bc-filter-dropdown-min-200">
            {([
              { label: "Active", value: true },
              { label: "Inactive", value: false },
            ] as const).map(({ label, value }) => (
              <button
                key={label}
                type="button"
                className={`bc-filter-pill-option${currentFilters.is_active === value ? " bc-filter-pill-option--active" : ""}`}
                onClick={() => applyIsActiveFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        ),
      },
      {
        id: "create_date",
        label: "Create Date",
        showDropdown: true,
        active: !!(
          currentFilters.created_at_from || currentFilters.created_at_to
        ),
        activeLabel: formatBillingProductsFilterDateLabel(
          currentFilters.created_at_from,
          currentFilters.created_at_to,
        ),
        onClear: () => {
          setCurrentFilters((prev) => {
            const { created_at_from, created_at_to, ...rest } = prev;
            return rest;
          });
          setPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((k) => k + 1);
        },
        dropdownContent: createDateDropdown,
      },
    ];
  }, [currentFilters, applyIsActiveFilter]);

  // Handle activeFilter changes to update currentFilters
  useEffect(() => {
    if (activeFilter === "all") {
      // For products, we only have "all" filter - no special filtering needed
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        return newFilters;
      });
    }
    // Don't reset pagination here - it's already reset in onFilterChange
  }, [activeFilter]);

  // Fetch prospects data
  const fetchCrmData = useCallback(async () => {
    // Increment request ID to track the latest request
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setLoading(true);
    try {
      const response = await getProducts(buildProductsParams());

      // Only update state if this is still the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const rawList = response?.data;
      const items: any[] = Array.isArray(rawList) ? rawList : [];
      const total = response?.pagination?.total ?? items.length;

      setDataList(items as any);
      setTotalRecords(total);

      // Keep total all products only when fetching without tab filter (all products)
      const isAllProducts =
        memoizedFilters.has_scheduled_calls !== true &&
        memoizedFilters.has_tickets !== true;
      if (isAllProducts) {
        setTotalAllProducts(total);
      }

      const summary = (response as any)?.summary;
      if (summary && typeof summary === "object") {
        setMetrics(summary);
      } else {
        const toNumber = (value: unknown) => {
          const n = typeof value === "string" ? Number(value) : (value as number);
          return Number.isFinite(n) ? n : 0;
        };
        const totalValue = items.reduce((acc, item) => {
          const price =
            item?.base_price ??
            item?.data?.base_price ??
            item?.effective_price ??
            item?.base_price ??
            0;
          return acc + toNumber(price);
        }, 0);
        const activeCount = items.filter((i) => (i?.status ?? "Active") === "Active").length;
        const inactiveCount = items.filter((i) => (i?.status ?? "") === "Inactive").length;
        const outOfStockCount = items.filter((i) => (i?.status ?? "") === "Out of Stock").length;
        setMetrics({
          active_count: activeCount,
          inactive_count: inactiveCount,
          out_of_stock_count: outOfStockCount,
          total_value: totalValue,
        });
      }
    } catch (error: any) {
      // Only handle error if this is still the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      console.error("Failed to fetch products:", error);
      setDataList([]);
      setTotalRecords(0);
    } finally {
      // Only set loading to false if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [buildProductsParams, memoizedFilters.has_scheduled_calls, memoizedFilters.has_tickets]);

  const openProductDeleteModal = useCallback((row: any) => {
    if (!canDeleteBillingProduct) return;
    const id = Number(row?.id);
    if (!Number.isFinite(id) || id <= 0) return;
    setProductToDelete({ id, name: getProductDisplayName(row) });
    setShowProductDeleteModal(true);
  }, [canDeleteBillingProduct]);

  const confirmProductDelete = useCallback(async () => {
    if (!canDeleteBillingProduct || !productToDelete) return;
    setDeletingProduct(true);
    try {
      await deleteProduct(productToDelete.id);
      toast.success("Product deleted successfully");
      setShowProductDeleteModal(false);
      setProductToDelete(null);
      fetchCrmData();
    } catch {
      /* Error toast already shown in `deleteProduct` (accounts) */
    } finally {
      setDeletingProduct(false);
    }
  }, [fetchCrmData, productToDelete, canDeleteBillingProduct]);

  const openProductEditModal = useCallback(
    (rowOrId: { id?: unknown } | number, closeSidebarFirst = false) => {
      if (!canUpdateBillingProduct) return;
      const id =
        typeof rowOrId === "number"
          ? rowOrId
          : Number((rowOrId as { id?: unknown })?.id);
      if (!Number.isFinite(id) || id <= 0) return;
      if (closeSidebarFirst) setShowProspectSidebar(false);
      setEditingProductId(id);
      setShowCreateProductModal(true);
    },
    [canUpdateBillingProduct],
  );

  // Load data when filters or pagination changes
  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData, refreshKey]);

  const handleViewProduct = useCallback((row: any) => {
    setSelectedProspect(row);
    setShowProspectSidebar(true);

    const id =
      row && typeof row === "object" && "id" in row
        ? Number((row as { id?: unknown }).id)
        : Number.NaN;
    if (!Number.isFinite(id) || id <= 0) return;
  }, []);

  // Backwards-compatible alias used throughout the file
  const handleViewData = useCallback(
    (item: BillingProductRow) => handleViewProduct(item),
    [handleViewProduct],
  );


  // Handle close prospect sidebar
  const handleCloseProspectSidebar = useCallback(() => {
    sidebarProspectFetchTokenRef.current += 1;
    setShowProspectSidebar(false);
    setSelectedProspect(null);
  }, []);

  const handleOpenFiltersSidebar = useCallback(() => {
    const rawCat = currentFilters.category_id;
    const rawFrom = currentFilters.created_at_from;
    const rawTo = currentFilters.created_at_to;
    setFilterSidebarDraft({
      search: String(currentFilters.search ?? ""),
      is_active:
        typeof currentFilters.is_active === "boolean"
          ? currentFilters.is_active
          : undefined,
      category_id:
        rawCat !== undefined && rawCat !== null && String(rawCat).trim() !== ""
          ? String(rawCat).trim()
          : "",
      created_at_from:
        typeof rawFrom === "string" && rawFrom.trim() !== ""
          ? rawFrom.trim()
          : "",
      created_at_to:
        typeof rawTo === "string" && rawTo.trim() !== "" ? rawTo.trim() : "",
    });
    setShowFiltersSidebar(true);
  }, [
    currentFilters.search,
    currentFilters.is_active,
    currentFilters.category_id,
    currentFilters.created_at_from,
    currentFilters.created_at_to,
  ]);

  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  // Preview button on row hover – opens the same sidebar
  const handlePreviewClick = useCallback((row: any) => {
    handleViewProduct(row);
  }, [handleViewProduct]);

  // Stats cards data for metrics
  const productsStatsCards: StatsCardData[] = useMemo(
    () => [
      {
        title: "Total Products",
        value: totalRecords,
        icon: FileText,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
      },
      {
        title: "Active Products",
        value: metrics.active_count ?? 0,
        icon: Target,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
        metric: { text: "In stock", dotColor: "#10B981" },
      },
     
      {
        title: "Inactive Products",
        value: metrics.inactive_count ?? 0,
        icon: ClockIcon,
        iconColor: "#6B7280",
        iconBgColor: "#F3F4F6",
      },
    ],
    [metrics, totalRecords],
  );

  // Define columns for GenericTable - Clean declarative definitions
  const productsColumns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span className="bc-product-name-link">
            {getProductDisplayName(row)}
          </span>
        ),
      },
     
      {
        key: "sku",
        label: "SKU",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span className="bc-product-cell-muted-mono">
            {getProductSku(row)}
          </span>
        ),
      },
      {
        key: "category_id",
        label: "Category",
        sortable: false,
        type: "custom",
        render: (row) => (
          <span className="bc-product-cell-text">
            {getProductCategoryDisplayName(row, productCategoryIdToName)}
          </span>
        ),
      },
      {
        key: "base_price",
        label: "Price AED",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span className="bc-product-cell-text bc-product-cell-text--medium">
            {formatProductPriceAED(row)}
          </span>
        ),
      },
      {
        key: "is_active",
        label: "Status",
        sortable: false,
        type: "custom",
        render: (row) => {
          const status = row.is_active ? "Active" : "Inactive";
          return (
            <span className="bc-product-cell-text">{status}</span>
          );
        },
      },
      {
        key: "created_at",
        label: "Created at",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span className="bc-product-cell-text">
            {formatDateTimeGlobal(row.created_at) || "—"}
          </span>
        ),
      },

      {
        key: "actions",
        label: "Actions",
        sortable: false,
        type: "custom",
        render: (row: any) => {
          return (
          <div className="d-flex gap-1">
            {canUpdateBillingProduct ? (
            <button
              type="button"
              className="bc-table-icon-btn bc-table-icon-btn--primary"
              onClick={() => openProductEditModal(row)}
            >
              <FiEdit size={16} />
            </button>
            ) : null}
            {canDeleteBillingProduct ? (
            <button
              type="button"
              className="bc-table-icon-btn bc-table-icon-btn--danger"
              onClick={() => openProductDeleteModal(row)}
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
      openProductEditModal,
      openProductDeleteModal,
      productCategoryIdToName,
      canUpdateBillingProduct,
      canDeleteBillingProduct,
    ],
  );

  // Define table actions
  const productsActions: TableAction<any>[] = useMemo(
    () =>
      canUpdateBillingProduct
        ? [
            {
              label: "Edit",
              icon: <FiEdit size={16} />,
              onClick: (row: any) => openProductEditModal(row),
              variant: "link" as const,
            },
          ]
        : [],
    [openProductEditModal, canUpdateBillingProduct],
  );

  const renderAddProductButton = () => (
    <div
      className="bc-table-toolbar-floating"
      ref={addContactsRef}
    >
      {session?.user?.permissions?.includes(
        PERMISSIONS.UPDATE_PRODUCTS_BILLING,
      ) ? (
        <button
          type="button"
          className="bc-btn-billing-dark"
          onClick={() =>
            router.push(billingCustomerRoutes.productsManageCategories())
          }
        >
          <Plus size={16} />
          Manage Categories
        </button>
      ) : null}
        {canCreateBillingProduct ? (
        <button
          type="button"
          className="bc-btn-billing-dark"
          onClick={() => setShowCreateProductModal(true)}
        >
          <Plus size={16} />
          Add Product
        </button>
        ) : null}
    
    </div>
  );

  // Render Create Contact Sidebar
  const renderCreateContactSidebar = () => {
    if (!showCreateContactSidebar) return null;
  
    return (
      <ProspectEditSidebar
        isOpen={showCreateContactSidebar}
        title="Create Product"
        isEditing={false}
        isFormValid={true}
        createContactLoading={createContactLoading}
        contactForm={contactForm}
        setContactForm={setContactForm}
        contactFormLoading={false}
        contactFormLoadError={null}
        availableCampaigns={[]}
        extensions={[]}
        parsePhoneNumberInput={() => undefined}
        availableTags={[]}
        onClose={() => setShowCreateContactSidebar(false)}
        onSubmitPrimary={() => {}}
        onCreateAndAddAnother={() => {}}
      />
    );
  };

  /** `invoices` avoids CRM "prospects" filter pills; we supply billing pills only (like subscriptions). */
  const productsToolbarConfig = useCrmToolbarConfig({
    entity: "invoices" as any,
    searchValue: prospectsSearch,
    searchPlaceholder: "Search products by name or SKU...",
    onSearchChange: setProspectsSearch,
    onSearch: () => {
      setCurrentFilters((prev) => ({ ...prev, search: prospectsSearch || undefined }));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      setRefreshKey((prev) => prev + 1);
    },
    currentFilters,
    handleFiltersChange,
    refresh: () => setRefreshKey((prev) => prev + 1),
    activeTab: activeFilter,
    onTabChange: handleFilterChange,
    tabs: [
      {
        id: "all",
        label: "All Products",
        count: totalAllProducts,
        removable: false,
      },
      ...customTabs,
    ],
    onTabRemove: (tabId: string) => {
      setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
      if (activeFilter === tabId) handleFilterChange("all");
    },
    tabsDropdownLabel: "Products",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => {},
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: false,
    onImportClick: () => {},
    currentTableView: prospectsViewMode,
    onTableViewChange: setProspectsViewMode,
    showTableViewDropdown: false,
    showSearch: false,
    showExportButton: false,
    showSaveButton: false,
    extensions: [],
    onPaginationReset: () =>
      setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: renderAddProductButton(),
  });

    // Handle create product
    const handleCreateProduct = useCallback(() => {
        
        setShowCreateProductModal(false);
        fetchCrmData();
      }, [fetchCrmData]);
    
      // Handle create product and add another
      const handleCreateProductAndAddAnother = useCallback(() => {
        
        setCreateProductModalKey((k) => k + 1);
        fetchCrmData();
        // Don't close modal, just reset form
      }, [fetchCrmData]);

  const productCategoryFilterOptions: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = [{ value: "", label: "All categories" }];
    for (const cat of productCategories) {
      if (cat && typeof cat.id === "number") {
        opts.push({
          value: String(cat.id),
          label: String(cat.name ?? "").trim() || `Category ${cat.id}`,
        });
      }
    }
    return opts;
  }, [productCategories]);

  const productFilterFields: FilterField[] = useMemo(() => {
    const todayYmd = billingProductsTodayYmd();
    const createdFromMax = billingProductsUpperBoundForCreatedFrom(
      filterSidebarDraft.created_at_to,
      todayYmd,
    );
    return [
      {
        id: "search",
        label: "Search",
        type: "text",
        value: filterSidebarDraft.search,
        onChange: (value) =>
          setFilterSidebarDraft((prev) => ({ ...prev, search: value ?? "" })),
        placeholder: "Search products...",
      },
      {
        id: "is_active",
        label: "Status",
        type: "dropdown",
        value: billingProductActiveFilterToDropdownValue(
          filterSidebarDraft.is_active,
        ),
        onChange: (value) =>
          setFilterSidebarDraft((prev) => ({
            ...prev,
            is_active: billingProductDropdownValueToActiveFilter(value ?? ""),
          })),
        options: [
          { value: "", label: "All" },
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ],
      },
      {
        id: "category_id",
        label: "Category",
        type: "dropdown",
        value: filterSidebarDraft.category_id ?? "",
        onChange: (value) =>
          setFilterSidebarDraft((prev) => ({
            ...prev,
            category_id: typeof value === "string" ? value : "",
          })),
        options: productCategoryFilterOptions,
      },
      {
        id: "created_at_from",
        label: "Created from",
        type: "date",
        value: filterSidebarDraft.created_at_from,
        max: createdFromMax,
        onChange: (value) => {
          const nextFrom = typeof value === "string" ? value : "";
          setFilterSidebarDraft((prev) => {
            const adjustedTo =
              billingProductsDateToOnOrAfterFrom(
                nextFrom || undefined,
                prev.created_at_to || undefined,
              ) ?? "";
            return {
              ...prev,
              created_at_from: nextFrom,
              created_at_to: adjustedTo,
            };
          });
        },
      },
      {
        id: "created_at_to",
        label: "Created to",
        type: "date",
        value: filterSidebarDraft.created_at_to,
        min: filterSidebarDraft.created_at_from || undefined,
        max: todayYmd,
        onChange: (value) => {
          const raw = typeof value === "string" ? value : "";
          setFilterSidebarDraft((prev) => {
            const adjusted =
              billingProductsDateToOnOrAfterFrom(
                prev.created_at_from || undefined,
                raw || undefined,
              ) ?? "";
            return { ...prev, created_at_to: adjusted };
          });
        },
      },
    ];
  }, [
    filterSidebarDraft.search,
    filterSidebarDraft.is_active,
    filterSidebarDraft.category_id,
    filterSidebarDraft.created_at_from,
    filterSidebarDraft.created_at_to,
    productCategoryFilterOptions,
  ]);

  if (!canAccessBillingProducts) {
    return null;
  }

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prospects-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .prospects-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .prospects-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .prospects-table-wrapper .table-responsive table th,
        .prospects-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .prospects-table-wrapper .table-responsive table td:last-child,
        .prospects-table-wrapper .table-responsive table th:last-child {
          max-width: none;
        }
        .prospects-table-wrapper .table-responsive table td[style*="width"],
        .prospects-table-wrapper .table-responsive table th[style*="width"] {
          max-width: none;
        }
        .timeline-line {
          position: relative;
          height: 2px;
          background: #e9ecef;
          margin-top: 10px;
        }
        .timeline-line::after {
          content: "";
          position: absolute;
          top: -8px;
          left: 0;
          width: 2px;
          height: 18px;
          background: #e9ecef;
        }
        .timeline-item:last-child .timeline-line {
          display: none;
        }
        .generic-table-row.clickable {
          cursor: pointer;
        }
        
        
        /* Page layout for full height */
        .prospects-page-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          overflow: hidden;
        }
        
        .prospects-content-area {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .prospects-scrollable-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
        /* Phone input: match other form fields - border like text inputs, no blue focus glow */
        .contact-form-phone-input-wrapper .PhoneInput {
          border: 1px solid #8a8a8a !important;
          border-radius: 4px;
          padding: 10px 12px;
          font-size: 14px;
          box-shadow: none !important;
        }
        .contact-form-phone-input-wrapper .PhoneInput:focus-within {
          border-color: #0091ae !important;
          outline: none;
          box-shadow: none !important;
        }
      `,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Products"
      />
      {/* Main flex container for content and sidebar */}
      <BillingCustomerPortalTableShell>
        {/* Main content area */}
        <div className="prospects-scrollable-content bc-prospect-scroll-fill">
          

          <div className="container-fluid">
            {/* Prospects Table */}
            <div
              className="prospects-table-wrapper bc-prospect-table-wrapper"
            >
              <GenericTable
                data={dataList}
                columns={productsColumns.filter((c) =>
                  selectedColumns.includes(c.key),
                )}
                actions={productsActions}
                showToolbarActions={false}
                showActions={false}
                // Pagination
                pagination={{
                  currentPage: pagination.currentPage,
                  rowsPerPage: pagination.rowsPerPage,
                  totalRows: totalRecords,
                  pageSizeOptions: GENERIC_TABLE_PAGE_SIZE_OPTIONS,
                }}
                onPaginationChange={(page, rowsPerPage) => {
                  setPagination({
                    ...pagination,
                    currentPage: page,
                    rowsPerPage,
                  });
                }}
                // Sorting
                sortable={true}
                defaultSortBy={pagination.sortColumn}
                defaultSortOrder={pagination.sortDirection}
                onSort={(column, direction) => {
                  setPagination((prev) => ({
                    ...prev,
                    sortColumn: column,
                    sortDirection: direction,
                    currentPage: 1,
                  }));
                }}
                // Row interactions
                onPreviewClick={(row) => handlePreviewClick(row)}
                onFirstColumnClick={(row) => handleViewData(row)}
                onRowDoubleClick={(row) => {
                  if (
                    session?.user?.permissions?.includes(
                      "view-crm-data-management",
                    )
                  ) {
                    handleViewData(row);
                  }
                }}
                // Loading & styling
                loading={loading}
                emptyMessage="No prospects found matching your criteria"
                loadingMessage="Loading prospects..."
                hover={true}
                uniqueKey="id"
                // Fixed height mode
                fixedHeight={true}
                maxHeight="calc(100vh - 345px)"
                // Toolbar
                showToolbar={true}
                toolbar={{
                  ...productsToolbarConfig,
                  tabsDropdownItems,
                  showFiltersButton: false,
                  showFilterPills: true,
                  showViewSwitcher: false,
                  filterPills: productsFilterPills,
                  showMoreFiltersButton: true,
                  onAdvancedFiltersClick: handleOpenFiltersSidebar,
                }}
                // Stats cards for metrics
                statsCards={productsStatsCards}
                // When Board View is selected, show board content instead of table
                customBody={
  prospectsViewMode === "board" ? (
    <KanbanBoard
      columns={prospectsToKanbanColumns(
        dataList,
        getInitials,
        getRandomColor
      )}
      onCardClick={(card) => handleViewData(card.raw)}
      onCardMove={(cardId, fromCol, toCol) => {
        
      }}
      searchValue={prospectsSearch}
    />
  ) : undefined
}
              />
            </div>
          </div>

          <DeleteConfirmationModal
            show={showProductDeleteModal}
            onHide={() => {
              setShowProductDeleteModal(false);
              setProductToDelete(null);
            }}
            onConfirm={() => {
              confirmProductDelete().then(() => undefined);
            }}
            itemName={productToDelete?.name}
            itemType="product"
            loading={deletingProduct}
          />

       
         
        </div>{" "}
        {/* End main content area */}
        {/* Prospect Detail Sidebar */}
        {showProspectSidebar && (
          <GenericSidebar
            isOpen={showProspectSidebar}
            onClose={handleCloseProspectSidebar}
            title={getProductDisplayName(selectedProspect) || "Product Details"}
            subtitle={getProductSku(selectedProspect)}
            avatar={{
              initials: getInitials(selectedProspect?.name || selectedProspect?.title || "P"),
              name: selectedProspect?.name || selectedProspect?.title || "Product",
              gradient: getRandomColor(selectedProspect?.name || selectedProspect?.title || ""),
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Edit Product",
                  onClick: () => openProductEditModal(selectedProspect, true),
                },
              ],
            }}
            sections={[
              {
                id: "about-product",
                title: "About this product",
                icon: Target,
                collapsible: true,
                defaultExpanded: true,
                actions: [
                  {
                    label: "Edit all properties",
                    onClick: () => openProductEditModal(selectedProspect, true),
                  },
                ],
                fields: [
                  {
                    label: "Product Name",
                    value: getProductDisplayName(selectedProspect),
                    copyable: true,
                  },
                  {
                    label: "SKU",
                    value: getProductSku(selectedProspect, "N/A"),
                    copyable: true,
                  },
                  {
                    label: "Status",
                    value: selectedProspect?.status ?? "N/A",
                  },
                  {
                    label: "Price AED",
                    value: formatProductPriceAED(selectedProspect, "N/A"),
                    copyable: true,
                  },
                  {
                    label: "Category",
                    value: getProductCategoryDisplayName(
                      selectedProspect,
                      productCategoryIdToName,
                    ),
                  },
                 
                  {
                    label: "Description",
                    value: selectedProspect?.description || "N/A",
                    show: !!selectedProspect?.description,
                  },
                  {
                    label: "Created Date",
                    value: selectedProspect?.created_at
                      ? moment(selectedProspect.created_at).format(
                          "MMM DD, YYYY",
                        )
                      : "N/A",
                    type: "date",
                  },
                  {
                    label: "Last Updated",
                    value: selectedProspect?.updated_at
                      ? moment(selectedProspect.updated_at).format(
                          "MMM DD, YYYY",
                        )
                      : "N/A",
                    type: "date",
                  },
                ],
              },
              {
                id: "recent-activities",
                title: "Recent activities",
                icon: History,
                collapsible: true,
                defaultExpanded: true,
                count: 0,
                emptyState: {
                  icon: History,
                  message: "No recent activities for this product.",
                  action: {
                    label: "Log activity",
                    onClick: () => {
                      const id = selectedProspect?.id ?? selectedProspect?.data?.id ?? "";
                      if (id) {
                        router.push(`/crm/products/${id}`);
                        handleCloseProspectSidebar();
                      }
                    },
                  },
                },
              },
              {
                id: "product-history",
                title: "Product History",
                icon: FileText,
                collapsible: true,
                defaultExpanded: true,
                emptyState: {
                  icon: FileText,
                  message: "No history available for this product.",
                  action: {
                    label: "View details",
                    onClick: () => {
                      const id = selectedProspect?.id;
                      if (id) {
                        router.push(`/crm/products/${id}`);
                        handleCloseProspectSidebar();
                      }
                    },
                  },
                },
              },
              {
                id: "notes",
                title: "Notes",
                icon: FileText,
                collapsible: true,
                defaultExpanded: true,
                count: 0,
                emptyState: {
                  icon: FileText,
                  message: "No notes added yet.",
                  action: {
                    label: "Add note",
                    onClick: () => console.log("Add note"),
                  },
                },
              }
            ]}
          />
        )}
        {/* Filters Sidebar */}
        <GenericFilterSidebar
          isOpen={showFiltersSidebar}
          onClose={handleCloseFiltersSidebar}
          title="Filters"
          subtitle="Filter products by search, status, category, and created date"
          width="400px"
          filters={productFilterFields}
          onApply={() => {
            const trimmedSearch = filterSidebarDraft.search.trim();
            setCurrentFilters((prev) => {
              const next = { ...prev };
              if (trimmedSearch) {
                next.search = trimmedSearch;
              } else {
                delete next.search;
              }
              if (typeof filterSidebarDraft.is_active === "boolean") {
                next.is_active = filterSidebarDraft.is_active;
              } else {
                delete next.is_active;
              }
              const nextCategoryId = filterSidebarDraft.category_id.trim();
              if (nextCategoryId) {
                next.category_id = nextCategoryId;
              } else {
                delete next.category_id;
              }
              const fromYmd = filterSidebarDraft.created_at_from.trim();
              const toYmdRaw = filterSidebarDraft.created_at_to.trim();
              const toYmd =
                billingProductsDateToOnOrAfterFrom(
                  fromYmd || undefined,
                  toYmdRaw || undefined,
                ) ?? "";
              if (fromYmd) {
                next.created_at_from = fromYmd;
              } else {
                delete next.created_at_from;
              }
              if (toYmd) {
                next.created_at_to = toYmd;
              } else {
                delete next.created_at_to;
              }
              return next;
            });
            setProspectsSearch(trimmedSearch);
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
            setRefreshKey((k) => k + 1);
            setShowFiltersSidebar(false);
          }}
          onReset={() => {
            setFilterSidebarDraft({
              search: "",
              is_active: undefined,
              category_id: "",
              created_at_from: "",
              created_at_to: "",
            });
            setCurrentFilters({});
            setProspectsSearch("");
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
            setRefreshKey((k) => k + 1);
          }}
        />
      </BillingCustomerPortalTableShell>
      {/* End flex container */}
     
      {/* Column Editor Modal */}
      <ColumnEditorModal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        title="Customize Columns"
        columns={productsColumns.map((c) => ({ key: c.key, label: c.label }))}
        selectedColumnKeys={selectedColumns}
        onApply={(keys: string[]) => {
          setSelectedColumns(keys);
          const w = (globalThis as unknown as { window?: Window }).window;
          if (w) {
            w.localStorage.setItem(BILLING_PRODUCTS_COLUMN_STORAGE_KEY, JSON.stringify(keys));
          }
        }}
      />

      {/* Add Tab Modal */}
      <Modal show={showTabModal} onHide={() => setShowTabModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Tab</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Select a filter to add as a new tab</p>
          <div className="d-grid gap-2">
            
            
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTabModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Create Contact Sidebar */}
      {renderCreateContactSidebar()}
      {/* Create Product Modal */}
      {showCreateProductModal && (
        <CreateProductModal
          key={createProductModalKey}
          productId={editingProductId ?? undefined}
          onUpdated={() => {
            setShowCreateProductModal(false);
            setEditingProductId(null);
            fetchCrmData();
          }}
          onClose={() => {
            setShowCreateProductModal(false);
            setEditingProductId(null);
          }}
          onCreate={handleCreateProduct}
          onCreateAndAddAnother={handleCreateProductAndAddAnother}
        />
      )}
    </React.Fragment>
  );
};

BillingManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default BillingManagement;
