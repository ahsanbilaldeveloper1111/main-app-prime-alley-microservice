import "@assets/scss/datatable-style.scss";
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
import { useRouter } from "next/router";
import { getErrorMessage } from "@utils/errors";
import moment from "moment";
import KanbanBoard, { prospectsToKanbanColumns } from "@components/KanbanBoard";
import ProspectEditSidebar from "@components/ProspectEditSidebar";
import CreateProductModal from "@components/CreateModalProduct";
import {
  FiTrash2,
  FiEdit,
  FiCalendar,
  FiTarget,
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

import GenericSidebar from "@components/GenericSidebarNew";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import { type StatsCardData } from "@components/GenericStatsCards";
import {

  CrmDataItem,
} from "@utils/crm";
import { deleteProduct, getProducts } from "@utils/accounts";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";

let customFieldIdSeq = 0;
function createCustomFieldId(fieldName: string): string {
  const w = (globalThis as unknown as { window?: Window }).window;
  const cryptoObj = w?.crypto;

  if (cryptoObj?.randomUUID) {
    return `${cryptoObj.randomUUID()}-${fieldName}`;
  }

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex}-${fieldName}`;
  }

  customFieldIdSeq += 1;
  return `${Date.now()}-${customFieldIdSeq}-${fieldName}`;
}
import {
  RECORD_TYPES,
} from "@utils/Helper";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import ColumnEditorModal from "@components/ColumnEditorModal";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";

const VALID_FILTERS = new Set(["all"]);

type ActivitiesPanelRef = {
  refetchTasks?: () => void;
  refetchNotes?: () => void;
  refetchEmails?: () => void;
  refetchMeetings?: () => void;
};

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
const getProductTaxCategory = (row: { tax_category?: string; data?: { tax_category?: string } } | null): string =>
  row?.tax_category ?? row?.data?.tax_category ?? "Standard";
const formatProductPriceAED = (row: { base_price?: unknown; data?: { base_price?: unknown } } | null, emptyFallback = "--"): string => {
  const price = row?.base_price ?? row?.data?.base_price;
  return price == null ? emptyFallback : `AED ${Number(price).toLocaleString()}`;
};

const ACTION_BUTTON_BASE_STYLE: React.CSSProperties = {
  padding: "9px 13px",
  backgroundColor: "#000000",
  color: "#ffffff",
  border: "none",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const BillingManagement = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const requestIdRef = useRef(0);


  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [extensions] = useState<any[]>([]);

  const [availableCampaigns] = useState<
    Array<{
      value: string;
      label: string;
      id: number;
    }>
  >([]);
  
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

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
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone_country_code: "",
    phoneNumber: "",
    campaign_id: null as number | null,
    contact_owner: null as string | null,
    lifecycle_stage: "Lead",
    disposition: "",
    legal_basis: [] as string[],
    company_domain: "",
    scheduled_call_at: "",
    tags: [] as Array<{ value: string; label: string; id: number }>,
    note: "",
    source_file: "",
    custom_fields: [] as Array<{
      id: string;
      field_name: string;
      field_value: string;
    }>,
  });
  const [createContactLoading] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [contactFormLoadError, setContactFormLoadError] = useState<
    string | null
  >(null);
  const [contactFormLoading, setContactFormLoading] = useState(false);

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
    const rawEditId = router.query.editContactId;
    const editIdStr = Array.isArray(rawEditId) ? rawEditId[0] : rawEditId;
    const editIdNum = editIdStr == null ? Number.NaN : Number(editIdStr);
    if (Number.isFinite(editIdNum) && editIdNum > 0) {
      setEditingContactId(editIdNum);
    }

    const { createContact: _, editContactId: __, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, {
      shallow: true,
    });
  }, [router.isReady, router.query.createContact, router.query.editContactId]);

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

  // Load prospect into form when sidebar opens in edit mode
  useEffect(() => {
    if (!showCreateContactSidebar || !editingContactId) {
      setContactFormLoadError(null);
      setContactFormLoading(false);
      return;
    }
    let cancelled = false;
    setContactFormLoadError(null);
    setContactFormLoading(true);
    
    return () => {
      
    };
  }, [showCreateContactSidebar, editingContactId]);

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [prospectsSearch, setProspectsSearch] = useState("");
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [prospectsFilters, setProspectsFilters] = useState({
    assignedTo: null as string | null,
    campaigns: null as string[] | null,
    nextCallDateFrom: null as string | null,
    nextCallDateTo: null as string | null,
    sourceFile: null as string | null,
    tags: null as string[] | null,
  });
  /** View mode: table or board; dropdown shows only the other option to switch */
  const [prospectsViewMode, setProspectsViewMode] = useState<
    "table" | "board"
  >("table");

  // Column customization and pagination states
  const defaultSelectedColumns = [
    "name",
    "sku",
    "tax_category",
    "base_price",
    "is_active",
    "actions",
  ];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    () => defaultSelectedColumns,
  );

  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [dataList, setDataList] = useState<CrmDataItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  /** Total count of all products (unchanged when switching tabs) */
  const [totalAllProducts, setTotalAllProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  const [metrics, setMetrics] = useState<any>({
    assigned_records: 0,
    unassigned_records: 0,
    active_count: 0,
    inactive_count: 0,
    out_of_stock_count: 0,
    total_value: 0,
  });

  // Custom select styles
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "45px",
      fontSize: "0.875rem",
      borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
      boxShadow: state.isFocused
        ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)"
        : "none",
      "&:hover": {
        borderColor: "#86b7fe",
      },
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "#0d6efd",
      color: "white",
      fontSize: "0.813rem",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: "white",
      padding: "2px 6px",
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: "white",
      "&:hover": {
        backgroundColor: "#0b5ed7",
        color: "white",
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#6c757d",
      fontSize: "0.875rem",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      fontSize: "0.875rem",
    }),
  };

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const sidebarActivitiesPanelRef = useRef<ActivitiesPanelRef | null>(null);
  const sidebarRecordId = Number(
    selectedProspect?.id ?? selectedProspect?.data?.id ?? 0,
  );
  const sidebarRecordName = selectedProspect?.name ?? "Prospect";
  const sidebarRecordPhone = selectedProspect?.phone ?? "";
  const sidebarRecordEmail =
    selectedProspect?.data?.email ??
    selectedProspect?.data?.data?.email ??
    selectedProspect?.email ??
    "";

  const sidebarActivityModals = useCrmActivityModals({
    recordType: "prospect",
    recordId: sidebarRecordId,
    recordName: sidebarRecordName,
    recordEmail: sidebarRecordEmail,
    recordPhone: sidebarRecordPhone,
    onTaskCreated: () => sidebarActivitiesPanelRef.current?.refetchTasks?.(),
    onNoteCreated: () => sidebarActivitiesPanelRef.current?.refetchNotes?.(),
    onEmailSent: () => sidebarActivitiesPanelRef.current?.refetchEmails?.(),
    onMeetingScheduled: () =>
      sidebarActivitiesPanelRef.current?.refetchMeetings?.(),
  });

  const buildProductsParams = useCallback(
    (overrides: { page?: number; per_page?: number } = {}) => {
      const params: any = {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        ...overrides,
      };

      if (memoizedFilters.search) params.search = memoizedFilters.search;

      if (pagination.sortColumn) {
        params.sort_column = pagination.sortColumn;
        params.sort_direction = pagination.sortDirection;
      }

      return params;
    },
    [
      memoizedFilters.search,
      pagination.currentPage,
      pagination.rowsPerPage,
      pagination.sortColumn,
      pagination.sortDirection,
    ],
  );

  function getNameByExtension(extension: string) {
    const extensionData = extensions.find((ext) => ext.id === extension);
    return extensionData?.display_name || extensionData?.name || extension;
  }
  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const applyTableFiltersPatch = useCallback(
    (patch: Record<string, any>) => {
      const next: Record<string, any> = { ...currentFilters, ...patch };

      Object.keys(next).forEach((k) => {
        const v = next[k];
        if (
          v === undefined ||
          v === null ||
          v === "" ||
          (Array.isArray(v) && v.length === 0)
        ) {
          delete next[k];
        }
      });

      handleFiltersChange(next);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [currentFilters, handleFiltersChange, setPagination],
  );

  const hasAdvancedFiltersApplied = useMemo(() => {
    const campaign = currentFilters.campaign_id;
    const hasCampaign =
      Array.isArray(campaign) ? campaign.length > 0 : !!campaign;

    const tags = currentFilters.tags;
    const hasTags = Array.isArray(tags) ? tags.length > 0 : !!tags;

    const hasSource = !!currentFilters.source_file;
    const hasNextCall =
      !!currentFilters.scheduled_call_from || !!currentFilters.scheduled_call_to;

    return hasCampaign || hasTags || hasSource || hasNextCall;
  }, [currentFilters]);

  const showAdvancedFilterPills =
    showAdvancedFilters || hasAdvancedFiltersApplied;

  // Quote-specific filter pills
  const productsFilterPills = useMemo<FilterPill[]>(() => {
   
    return [
  
     
    ];
  }, [
    applyTableFiltersPatch,
    currentFilters,
    customSelectStyles,
  ]);

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

      const items = (response?.data || []) as any[];
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
    const id = Number(row?.id);
    if (!Number.isFinite(id) || id <= 0) return;
    setProductToDelete({ id, name: getProductDisplayName(row) });
    setShowProductDeleteModal(true);
  }, []);

  const confirmProductDelete = useCallback(async () => {
    if (!productToDelete) return;
    setDeletingProduct(true);
    try {
      await deleteProduct(productToDelete.id);
      toast.success("Product deleted successfully");
      setShowProductDeleteModal(false);
      setProductToDelete(null);
      fetchCrmData();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to delete product"));
    } finally {
      setDeletingProduct(false);
    }
  }, [fetchCrmData, productToDelete]);

  const openProductEditModal = useCallback(
    (rowOrId: { id?: unknown } | number, closeSidebarFirst = false) => {
      const id =
        typeof rowOrId === "number"
          ? rowOrId
          : Number((rowOrId as { id?: unknown })?.id);
      if (!Number.isFinite(id) || id <= 0) return;
      if (closeSidebarFirst) setShowProspectSidebar(false);
      setEditingProductId(id);
      setShowCreateProductModal(true);
    },
    [],
  );

  // Load data when filters or pagination changes
  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData, refreshKey]);

  // Clear selection after bulk delete or when clearSelectedRows changes
  useEffect(() => {
    if (clearSelectedRows) {
      setSelectedItems([]);
    }
  }, [clearSelectedRows]);

  const openProspectSidebar = useCallback((item: unknown) => {
    setSelectedProspect(item);
    setShowProspectSidebar(true);

    const id =
      item && typeof item === "object" && "id" in item
        ? Number((item as { id?: unknown }).id)
        : Number.NaN;
    if (!Number.isFinite(id) || id <= 0) return;

  
   
  }, []);

  // Backwards-compatible alias used throughout the file
  const handleViewData = useCallback(
    (item: CrmDataItem) => openProspectSidebar(item),
    [openProspectSidebar],
  );


  const handleNoteCreate = (
    note: string,
    createTask: boolean,
    taskDueDate?: string,
  ) => {
    console.log("Note created:", {
      prospectId: selectedProspect.id,
      note,
      createTask,
      taskDueDate,
    });
  };
 

  // Handle close prospect sidebar
  const handleCloseProspectSidebar = useCallback(() => {
    sidebarProspectFetchTokenRef.current += 1;
    setShowProspectSidebar(false);
    setSelectedProspect(null);
  }, []);

  // Handle close filters sidebar
  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  // Handle preview button click - shows sidebar
  const handlePreviewClick = useCallback((prospect: any) => {
    openProspectSidebar(prospect);
  }, [openProspectSidebar]);

  // Handle first column click - navigates to detail page with prospect ID in URL
  const handleFirstColumnClick = useCallback(
    (prospect: any) => {
      
    },
    [router],
  );

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
          <button
            type="button"
            style={{
              color: "#1d6ae5",
              fontWeight: 500,
              cursor: "pointer",
              background: "transparent",
              border: "none",
              padding: 0,
            }}
            onClick={() => handleViewData(row)}
          >
            {getProductDisplayName(row)}
          </button>
        ),
      },
     
      {
        key: "sku",
        label: "SKU",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span style={{ color: "#6b7280", fontSize: 13, fontFamily: "monospace" }}>
            {getProductSku(row)}
          </span>
        ),
      },
      {
        key: "tax_category",
        label: "Tax Category",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span style={{ color: "#374151", fontSize: 13 }}>
            {getProductTaxCategory(row)}
          </span>
        ),
      },
      {
        key: "base_price",
        label: "Price AED",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>
            {formatProductPriceAED(row)}
          </span>
        ),
      },
      {
        key: "is_active",
        label: "Status",
        sortable: true,
        type: "custom",
        render: (row) => {
          const status = row.is_active ? "Active" : "Inactive";
          return (
            <span style={{ color: "#374151", fontSize: 13 }}>{status}</span>
          );
        },
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        type: "custom",
        render: (row: any) => {
          return <div className="d-flex gap-1">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => openProductEditModal(row)}
            >
              <FiEdit size={16} />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => openProductDeleteModal(row)}
            >
              <FiTrash2 size={16} />
            </Button>
          </div>;
        },
      },
    ],
    [handleViewData, openProductEditModal, openProductDeleteModal],
  );

  // Define table actions
  const productsActions: TableAction<any>[] = useMemo(
    () => [
      {
        label: "Edit",
        icon: <FiEdit size={16} />,
        onClick: (row: any) => openProductEditModal(row),
        variant: "link" as const,
      },
    ],
    [openProductEditModal],
  );

  // Render Add Contacts Button with Dropdown (and Bulk Delete when rows selected)
  const renderAddProductButton = () => (
    <div
      style={{
        position: "absolute",
        right: "19px",
        top: "18px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      ref={addContactsRef}
    >
     

<button
          onClick={() => router.push("/billing/products/manage-categories")}
          style={ACTION_BUTTON_BASE_STYLE}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a1a1a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#000000";
          }}
        >
          <Plus size={16} />
          Manage Categories
        </button>
        <button
          onClick={() => setShowCreateProductModal(true)}
          style={ACTION_BUTTON_BASE_STYLE}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a1a1a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#000000";
          }}
        >
          <Plus size={16} />
          Add Product
        </button>
    
    </div>
  );

  // Render Create Contact Sidebar
  const renderCreateContactSidebar = () => {
    if (!showCreateContactSidebar) return null;
  
    const isFormValid =
      contactForm.email?.trim() &&
      contactForm.phoneNumber?.trim() &&
      (contactForm.firstName?.trim() || contactForm.lastName?.trim()) &&
      contactForm.campaign_id != null;
  
    return (
      <ProspectEditSidebar
        isOpen={showCreateContactSidebar}
        title={editingContactId ? "Edit Prospect" : "Create Prospect"}
        isEditing={!!editingContactId}
        isFormValid={!!isFormValid}
        createContactLoading={createContactLoading}
        contactForm={contactForm}
        setContactForm={setContactForm}
        contactFormLoading={contactFormLoading}
        contactFormLoadError={contactFormLoadError}
        availableCampaigns={availableCampaigns}
        extensions={extensions}
        availableTags={[]}
        parsePhoneNumberInput={() => undefined}
        onSubmitPrimary={() => {
         
        }}
        onClose={() => {
          setShowCreateContactSidebar(false);
          setEditingContactId(null);
          setContactFormLoadError(null);
          setContactFormLoading(false);
        }}
        onCreateAndAddAnother={
          editingContactId
            ? undefined
            : () => {
               
              }
        }
      />
    );
  };

  const prospectsToolbarConfig = useCrmToolbarConfig({
    entity: "prospects",
    searchValue: prospectsSearch,
    searchPlaceholder: "Search products...",
    onSearchChange: setProspectsSearch,
    onSearch: () => {},
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
    onTabAdd: () => setShowTabModal(true),
    onTabRemove: (tabId) => {
      setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
      if (activeFilter === tabId) handleFilterChange("all");
    },
    tabsDropdownLabel: "Products",
    onFiltersClick: () => setShowFiltersSidebar(true),
    onExportClick: () => {},
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: false,
    onImportClick: () => {},
    currentTableView: prospectsViewMode,
    onTableViewChange: setProspectsViewMode,
    extensions,
    onPaginationReset: () =>
      setPagination((prev) => ({ ...prev, currentPage: 1 })),
    rightActions: renderAddProductButton(),
    prospectsTabCountOverrides: {
      loading,
      totalRecords,
      activeFilter,
    },
  });

    // Handle create product
    const handleCreateProduct = useCallback(() => {
        
        toast.success("Product created successfully!");
        setShowCreateProductModal(false);
        fetchCrmData();
      }, [fetchCrmData]);
    
      // Handle create product and add another
      const handleCreateProductAndAddAnother = useCallback(() => {
        
        toast.success("Product created successfully!");
        setCreateProductModalKey((k) => k + 1);
        fetchCrmData();
        // Don't close modal, just reset form
      }, [fetchCrmData]);

  if (!session?.user?.permissions?.includes("list-crm-data-management")) {
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
      <div
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh)",
          overflow: "hidden",
        }}
      >
        {/* Main content area */}
        <div className="prospects-scrollable-content" style={{ flex: 1 }}>
          

          <div className="container-fluid">
            {/* Prospects Table */}
            <div
              className="prospects-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <GenericTable
                data={dataList}
                columns={productsColumns.filter((c) =>
                  selectedColumns.includes(c.key),
                )}
                actions={productsActions}
                showActions={false}
                // Selection
                selectable={session?.user?.permissions?.includes(
                  "delete-crm-data-management",
                )}
                selectedRows={dataList.filter((item) =>
                  selectedItems.includes(item.id),
                )}
                onSelectionChange={(selected) => {
                  setSelectedItems(selected.map((item) => item.id));
                  setClearSelectedRows(false);
                }}
           
                // Pagination
                pagination={{
                  currentPage: pagination.currentPage,
                  rowsPerPage: pagination.rowsPerPage,
                  totalRows: totalRecords,
                  pageSizeOptions: [10, 15, 25, 50, 100],
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
                defaultSortColumn={pagination.sortColumn}
                defaultSortDirection={pagination.sortDirection}
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
                onFirstColumnClick={(row) => handleFirstColumnClick(row)}
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
                  ...prospectsToolbarConfig,
                  // Hide Advanced filters button while the filters sidebar is open
                  showAdvancedFilters: !showFiltersSidebar,
                  // Keep pills visible by default so advanced pills can appear inline
                  showFilterPills: true,
                  onAdvancedFiltersClick: () =>
                    setShowAdvancedFilters((prev) => !prev),
                  filterPills: [
                    ...(prospectsToolbarConfig.filterPills ?? []),
                    ...(showAdvancedFilterPills ? productsFilterPills : []),
                  ],
                  showMoreFiltersButton: true,
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
            email={session?.user?.email || ""}
            phone={""}
            senderName={session?.user?.name || ""}
            senderEmail={session?.user?.email || ""}
            record={{
              id: selectedProspect?.id,
              type: RECORD_TYPES.PROSPECT,
            }}
            avatar={{
              initials: getInitials(selectedProspect?.name || selectedProspect?.title || "P"),
              name: selectedProspect?.name || selectedProspect?.title || "Product",
              gradient: getRandomColor(selectedProspect?.name || selectedProspect?.title || ""),
            }}
            recordType="prospect"
            recordId={
              selectedProspect?.id ?? selectedProspect?.data?.id ?? undefined
            }
            resolveUserLabel={getNameByExtension}
            onNoteCreate={handleNoteCreate}
            
            
            recordLink={{
              label: "View product details",
              onClick: () => {
                
              },
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
                    label: "Tax Category",
                    value: getProductTaxCategory(selectedProspect),
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
        {sidebarActivityModals.modals}
        {/* Filters Sidebar */}
        <GenericFilterSidebar
          isOpen={showFiltersSidebar}
          onClose={handleCloseFiltersSidebar}
          title="Filters"
          subtitle="Filter products by various criteria"
          width="400px"
          filters={[
            {
              id: "search",
              label: "Search",
              type: "text",
              value: prospectsSearch,
              onChange: (value) => setProspectsSearch(value),
              placeholder: "Search by quote title...",
            },
            
            
          ]}
          onApply={() => {
            const filtersToApply: Record<string, any> = {};

            if (prospectsSearch) {
              filtersToApply.search = prospectsSearch;
            }
            if (prospectsFilters.assignedTo) {
              filtersToApply.user_extension = [prospectsFilters.assignedTo];
            }
            if (prospectsFilters.campaigns) {
              filtersToApply.status = prospectsFilters.campaigns;
            }
            if (prospectsFilters.nextCallDateFrom) {
              filtersToApply.last_activity_date = prospectsFilters.nextCallDateFrom;
            }
            if (prospectsFilters.tags) {
              filtersToApply.signing_status = prospectsFilters.tags;
            }

            handleFiltersChange(filtersToApply);
            setPagination((prev) => ({
              ...prev,
              currentPage: 1,
            }));
            setRefreshKey((prev) => prev + 1);
            setShowFiltersSidebar(false);
          }}
          onReset={() => {
            setProspectsSearch("");
            setProspectsFilters({
              assignedTo: null,
              campaigns: null,
              nextCallDateFrom: null,
              nextCallDateTo: null,
              sourceFile: null,
              tags: null,
            });
            handleFiltersChange({});
            setCurrentFilters({});
            setActiveFilter("all");
            setPagination((prev) => ({
              ...prev,
              currentPage: 1,
            }));
            setRefreshKey((prev) => prev + 1);
          }}
        />
      </div>{" "}
      {/* End flex container */}
     
      {/* Column Editor Modal */}
      <ColumnEditorModal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        title="Customize Columns"
        columns={productsColumns.map((c) => ({ key: c.key, label: c.label }))}
        selectedColumnKeys={selectedColumns}
        onApply={(keys) => {
          setSelectedColumns(keys);
          const w = (globalThis as unknown as { window?: Window }).window;
          if (w) {
            w.localStorage.setItem(
              "crmDataSelectedColumns",
              JSON.stringify(keys),
            );
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
