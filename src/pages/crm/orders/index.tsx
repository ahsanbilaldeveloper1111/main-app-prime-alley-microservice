import "@assets/scss/datatable-style.scss";
import { useRouter } from "next/router";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  TableColumn,
  TableAction,
  TabConfig,
} from "@components/GenericTable";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import { useCrmLogActivityModals } from "@hooks/useCrmLogActivityModals";
import GenericSidebar from "@components/GenericSidebarNew";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import { CrmListColumnEditorModal } from "@crm/shared/CrmListColumnEditorModal";
import { parseStoredVisibleColumnKeysLoose } from "@utils/crmListVisibleColumnsStorage";
import CrmExportModal from "@components/CrmExportModal";
import { StatsCardData } from "@components/GenericStatsCards";
import { EditOrderSidebar } from "@components/EditOrderSidebar";
import {
  getOrders,
  getOrder,
  getStages,
  deleteOrder,
  restoreOrder,
  getOrderAttachments,
  uploadOrderAttachment,
  deleteOrderAttachment,
  downloadOrderAttachment,
  markOrderLost,
  getDeal,
  getLead,
  getDealAttachments,
  downloadDealAttachment,
  updateOrder,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Row,
  Col,
  Badge,
  Form,
  Card,
  Table,
  Modal,
  Spinner,
} from "react-bootstrap";
import Select from "react-select";
import {
  GlobalDateFormat,
  ModuleSlug,
  RECORD_TYPES,
  formatDateForTable,
  formatCrmPreviewDate,
} from "@utils/Helper";
import {
  Target,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  ShoppingBag,
  MoreVertical,
  X,
  Users,
  Layers,
  Calendar,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  Activity,
  FileText,
  ShoppingCart,
  History,
  Mail,
  Building2,
  User,
  Paperclip,
  Upload,
  Download as DownloadIcon,
  RotateCcw,
  Info,
  Phone as PhoneIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "react-toastify";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import FormModal from "../../partial/FormModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";
import moment from "moment";
import { useCti } from "@hooks/useCti";
import KanbanBoard, { KanbanColumnDef, KanbanCardData } from "@components/KanbanBoard";
import {
  CrmPhoneDisplay as PhoneDisplay,
  CrmKPICard as KPICard,
  CrmFilterBar as FilterBar,
} from "@components/crm/CrmListPageUi";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";
import { CrmListExportModalAssignedToSelect } from "@crm/shared/CrmListExportModalAssignedToSelect";
import {
  buildCrmOrdersListExportParams,
  buildCrmOrdersListGetOrdersParams,
} from "@crm/orders/buildCrmOrdersListGetOrdersParams";
import { useCrmListPreviewPersistence } from "@crm/shared/useCrmListPreviewPersistence";
import { applyCrmFilterRules, CRM_BASE_FILTER_RULES } from "@crm/shared/crmListFilterHelpers";

const ignoredKeys = ["order_stage_id"];

const ORDERS_FILTER_RULES = [
  ...CRM_BASE_FILTER_RULES,
  { key: "industry", kind: "truthy" },
  { key: "order_value_min", kind: "string" },
  { key: "order_value_max", kind: "string" },
  { key: "order_stage_id", kind: "string" },
  { key: "order_approval_status", kind: "truthy" },
  { key: "fulfillment_status", kind: "truthy" },
  { key: "payment_status", kind: "truthy" },
  { key: "date_from", kind: "truthy" },
  { key: "date_to", kind: "truthy" },
  { key: "created_at_from", kind: "truthy" },
  { key: "created_at_to", kind: "truthy" },
  { key: "created_at_month", kind: "truthy" },
  { key: "ticket_id", kind: "present" },
  { key: "deal_id", kind: "present" },
  { key: "status", kind: "truthy" },
] as const;

function ordersToKanbanColumns(
  orders: any[],
  stages: Array<{ id: number | string; name: string }>
): KanbanColumnDef[] {
  const buckets: Record<string, KanbanCardData[]> = {};

  stages.forEach((stage) => {
    buckets[String(stage.id)] = [];
  });

  for (const order of orders) {
    const stageId = String(order.stageId ?? order.stage ?? "");
    const bucketKey = buckets[stageId] ? stageId : String(stages[0]?.id ?? "");

    buckets[bucketKey].push({
      id: order.id,
      name: order.orderNumber || `Order #${order.id}`,
      email: order.customerEmail,
      avatarInitials: order.customerEmail
        ? getInitials(order.customer || "")
        : undefined,
      avatarColor: order.customerEmail
        ? getRandomColor(order.customer || "")
        : undefined,
      metaLines: [
        order.customer || "",
        order.value ? `Value: ${order.value} ${order.currency}` : "",
        order.assignedUser ? `Owner: ${order.assignedUser}` : "",
      ].filter(Boolean),
      raw: order,
    });
  }

  return stages.map((stage) => ({
    id: String(stage.id),
    title: stage.name,
    cards: buckets[String(stage.id)] ?? [],
  }));
}

const CrmOrders = () => { // NOSONAR
  const { data: session } = useSession();
  const router = useRouter();
  const { dialNumber, isInitialized } = useCti();

  const [isAccountRole, setIsAccountRole] = useState(true);

  const [isDeliveryRole, setIsDeliveryRole] = useState(true);

  // Which edit mode to show: root (full), account, or delivery — three separate modals

  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);
  const [ordersMetrics, setOrdersMetrics] = useState<Record<string, number> | null>(
    null,
  );

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  // View Modal
  const [showOrderViewModal, setShowOrderViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [relatedDeal, setRelatedDeal] = useState<any>(null);
  const [relatedLead, setRelatedLead] = useState<any>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("tab1");

  // Sidebar states
  const [showOrderSidebar, setShowOrderSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const sidebarOrderRecordId = useMemo(() => {
    const rawId = selectedOrder?.id ?? selectedOrder?.rawData?.id;
    const numericId = Number(rawId);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : 0;
  }, [selectedOrder]);

  const sidebarOrderRecordName = useMemo(() => {
    const orderNumber = selectedOrder?.order_number;
    if (orderNumber != null && orderNumber !== "") {
      return String(orderNumber);
    }
    const customerName = selectedOrder?.customer_name;
    return typeof customerName === "string" ? customerName : "";
  }, [selectedOrder]);

  const sidebarLogActivityModals = useCrmLogActivityModals({
    recordType: "order",
    recordId: sidebarOrderRecordId,
    recordName: sidebarOrderRecordName,
    recordPhone: selectedOrder?.customer_phone ?? "",
    recordEmail: selectedOrder?.customer_email ?? "",
  });
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [ordersViewMode, setOrdersViewMode] = useState<"table" | "board">("table");
  const [exportFilters, setExportFilters] = useState<Record<string, any>>({});
  const [exportFileName, setExportFileName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [tabTotals, setTabTotals] = useState<{
    all: number | null;
    lost: number | null;
    deleted: number | null;
  }>({
    all: null,
    lost: null,
    deleted: null,
  });
  const activeFilterRef = useRef<string>("all");

  // Attachments Modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedOrderForAttachments, setSelectedOrderForAttachments] =
    useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [dealAttachments, setDealAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Delete Attachment Modal
  const [showDeleteAttachmentModal, setShowDeleteAttachmentModal] =
    useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(
    null,
  );

  // Edit Order Sidebar (replaces modal: Edit as Account / Edit as Delivery)
  const [showEditOrderSidebar, setShowEditOrderSidebar] = useState(false);
  const [editingOrderIdInSidebar, setEditingOrderIdInSidebar] = useState<
    number | null
  >(null);
  const [editOrderModeInSidebar, setEditOrderModeInSidebar] = useState<
    "account" | "delivery"
  >("account");
  // Mark Order Lost Modal
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [orderToMarkLost, setOrderToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");

  // UI State
  const [showOrdersAnalytics, setShowOrdersAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [selectedOrdersColumns, setSelectedOrdersColumns] = useState<string[]>(
    () => {
      const defaults = [
        "orderNumber",
        "customer",
        "deal",
        "stage",
        "value",
        "approvalStatus",
        "fulfillmentStatus",
        "assignedUser",
        "orderDate",
        "owner",
      ];
      if (globalThis.window === undefined) {
        return defaults;
      }
      const stored = parseStoredVisibleColumnKeysLoose(
        globalThis.localStorage.getItem("ordersSelectedColumns"),
      );
      return stored ?? defaults;
    },
  );
  const [ordersPagination, setOrdersPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortBy: "",
    sortOrder: "asc" as "asc" | "desc",
  });
  const [ordersFilters, setOrdersFilters] = useState({
    assignedTo: null as string | null,
    stage: null as string | null,
    industry: null as string | null,
    orderValueMin: null as string | null,
    orderValueMax: null as string | null,
    orderApprovalStatus: null as string | null,
    fulfillmentStatus: null as string | null,
    paymentStatus: null as string | null,
    ticketId: null as string | null,
    dealId: null as string | null,
    dateFrom: null as string | null,
    dateTo: null as string | null,
  });
  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchStages();
    fetchLostReasons();
    fetchExtensions(ModuleSlug.CRM_ORDERS);
  }, []);

  // Sync export modal filters from current table filters when modal opens
  useEffect(() => {
    if (showExportModal) {
      setExportFilters({ ...currentFilters });
      if (!exportFileName) {
        setExportFileName(`orders_${moment().format("YYYY-MM-DD")}`);
      }
    }
  }, [showExportModal, currentFilters]);

  // Build API params from filters for export (per Orders API spec)
  const buildOrdersExportParams = useCallback(
    (
      filters: Record<string, any>,
      pagination?: { page: number; per_page: number },
    ) =>
      buildCrmOrdersListExportParams(
        filters,
        pagination,
        "user_extension_filter",
      ),
    [],
  );

  const fetchOrdersForExport = useCallback(
    async (filters: Record<string, any>) => {
      const PER_PAGE = 100;
      let page = 1;
      const allData: any[] = [];
      for (;;) {
        const response: any = await getOrders(
          buildOrdersExportParams(filters, { page, per_page: PER_PAGE }),
        );
        const ordersArray: any[] = response?.dataList || [];
        const pagination: any = response?.meta || {};
        const lastPage = pagination?.last_page ?? 1;
        allData.push(...ordersArray);
        if (page >= lastPage || ordersArray.length < PER_PAGE) break;
        page += 1;
      }
      return allData;
    },
    [buildOrdersExportParams],
  );

  const handleOrdersExport = useCallback(async () => {
    const name = exportFileName.trim() || `orders_${moment().format("YYYY-MM-DD")}`;
    const ext = name.endsWith(".csv") ? "" : ".csv";
    setExporting(true);
    try {
      const allData = await fetchOrdersForExport(exportFilters);
      if (allData.length === 0) {
        toast.info("No orders match the selected filters.");
        return;
      }
      const headers = Array.from(
        new Set(
          allData.flatMap((row) =>
            typeof row === "object" && row !== null
              ? Object.keys(row).filter(
                  (k) => typeof (row as any)[k] !== "object",
                )
              : [],
          ),
        ),
      ).sort();
      const csvRows = [
        headers.join(","),
        ...allData.map((row) =>
          headers
            .map((h) => {
              const val = (row as any)[h];
              if (val == null) return "";
              if (typeof val === "object") return "";
              const s = String(val).replace(/"/g, '""');
              return s.includes(",") || s.includes('"') ? `"${s}"` : s;
            })
            .join(","),
        ),
      ];
      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ext;
      a.click();
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
      toast.success(`Exported ${allData.length} orders successfully!`);
    } catch (err) {
      toast.error("Failed to export orders");
    } finally {
      setExporting(false);
    }
  }, [exportFileName, exportFilters, fetchOrdersForExport]);

  // Fetch orders when filters or search change
  const fetchOrders = useCallback(
    async (page = 1, perPage = 15) => {
      setLoading(true);
      try {
        const params = buildCrmOrdersListGetOrdersParams({
          filters: currentFilters,
          page,
          perPage,
          tableSort: ordersPagination,
          normalizeSearch: true,
          ownerParamStyle: "user_extension_filter",
        });

        const response: any = await getOrders(params);
        console.log("Raw response from getOrders:", response);

        const ordersArray: any[] = response?.dataList || [];
        const pagination: any = response?.meta || {};
        const summary: any = response?.summary_tiles || null;
        const metricsFromApi: any = response?.metrics || null;

        setOrdersData(Array.isArray(ordersArray) ? ordersArray : []);
        setTotalOrders(pagination?.total || 0);
        setSummaryTiles(summary);
        setOrdersMetrics(metricsFromApi);
        setTabTotals((prev) => ({
          all:
            typeof summary?.total_orders === "number"
              ? summary.total_orders
              : prev.all,
          lost:
            typeof summary?.lost_orders === "number" ? summary.lost_orders : prev.lost,
          deleted:
            typeof summary?.deleted_orders === "number"
              ? summary.deleted_orders
              : prev.deleted,
        }));

        const activeTabAtResponse = activeFilterRef.current;
        if (
          activeTabAtResponse === "all" ||
          activeTabAtResponse === "lost" ||
          activeTabAtResponse === "deleted"
        ) {
          setTabTotals((prev) => ({
            ...prev,
            [activeTabAtResponse]: pagination?.total || 0,
          }));
        }

        return response;
      } finally {
        setLoading(false);
      }
    },
    [currentFilters, ordersPagination.sortBy, ordersPagination.sortOrder],
  );

  // initiate call
  const handleCallClick = useCallback(
    async (order: any) => {
      const phone = order?.customer_phone;
      if (!phone) {
        toast.error("No phone number available for this order");
        return;
      }
      if (!isInitialized) {
        toast.error("CTI not initialized. Please wait...");
        return;
      }
      try {
        const result = await dialNumber(phone);
        if (result.success) {
          toast.success(`Calling ${order?.name || phone}...`);
        } else {
          toast.error(result.error || "Failed to make call");
        }
      } catch (error) {
        console.error("Call error:", error);
        toast.error("Failed to make call");
      }
    },
    [dialNumber, isInitialized],
  );

  // Handle activeFilter changes to update currentFilters and stage dropdown
  useEffect(() => {
    if (activeFilter === "all") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.stage_id;
        delete newFilters.include_archived;
        delete newFilters.include_lost;
        return newFilters;
      });
      // Clear stage dropdown
      setOrdersFilters((prev) => ({
        ...prev,
        stage: null,
      }));
    } else if (activeFilter === "lost") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.stage_id;
        delete newFilters.include_archived;
        newFilters.include_lost = true;
        return newFilters;
      });
      // Clear stage dropdown
      setOrdersFilters((prev) => ({
        ...prev,
        stage: null,
      }));
    } else if (activeFilter === "deleted") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.stage_id;
        delete newFilters.include_lost;
        newFilters.include_archived = true;
        return newFilters;
      });
      // Clear stage dropdown
      setOrdersFilters((prev) => ({
        ...prev,
        stage: null,
      }));
    } else if (activeFilter && stages.length > 0) {
      // Find stage by id (activeFilter should be stage id as string)
      const selectedStage = stages.find(
        (s: any) => s.id.toString() === activeFilter,
      );
      if (selectedStage) {
        setCurrentFilters((prev) => {
          const newFilters = { ...prev };
          delete newFilters.include_archived;
          delete newFilters.include_lost;
          newFilters.stage_id = selectedStage.id.toString();
          return newFilters;
        });
        // Auto-fill stage dropdown
        setOrdersFilters((prev) => ({
          ...prev,
          stage: selectedStage.id.toString(),
        }));
      }
    }
  }, [activeFilter, stages]);

  // Read tab from URL on mount and when router is ready
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const tabFromUrl = String(router.query.tab);
      // Allow "all", "lost", "deleted", or any stage ID
      const isValidFilter =
        tabFromUrl === "all" ||
        tabFromUrl === "lost" ||
        tabFromUrl === "deleted" ||
        (stages.length > 0 &&
          stages.some((s: any) => s.id.toString() === tabFromUrl));
      if (isValidFilter) {
        setActiveFilter((prev) => (prev === tabFromUrl ? prev : tabFromUrl));
      }
    }
  }, [router.isReady, router.query.tab, stages]);

  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  // Handler to update filter and URL
  const handleFilterChange = useCallback(
    (filterId: string) => {
      let nextTotalFromTab: number | undefined;
      if (filterId === "all") {
        if (typeof summaryTiles?.total_orders === "number") {
          nextTotalFromTab = summaryTiles.total_orders;
        }
      } else if (filterId === "lost") {
        if (typeof tabTotals.lost === "number") {
          nextTotalFromTab = tabTotals.lost;
        }
      } else if (filterId === "deleted") {
        if (typeof tabTotals.deleted === "number") {
          nextTotalFromTab = tabTotals.deleted;
        }
      }

      if (typeof nextTotalFromTab === "number") {
        setTotalOrders(nextTotalFromTab);
      }

      setActiveFilter(filterId);
      setOrdersPagination((prev) => ({ ...prev, currentPage: 1 }));

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
    [router, summaryTiles, tabTotals],
  );

  useEffect(() => {
    fetchOrders(ordersPagination.currentPage, ordersPagination.rowsPerPage);
  }, [
    refreshKey,
    currentFilters,
    ordersPagination.currentPage,
    ordersPagination.rowsPerPage,
    fetchOrders,
  ]);

  // Fetch attachments when modal opens
  useEffect(() => {
    if (showAttachmentModal && selectedOrderForAttachments?.id) {
      fetchAttachments();
    } else {
      setAttachments([]);
      setDealAttachments([]);
    }
  }, [showAttachmentModal, selectedOrderForAttachments?.id]);

  const fetchAttachments = async () => {
    if (!selectedOrderForAttachments?.id) return;
    setLoadingAttachments(true);
    try {
      // Fetch order attachments
      const orderData = await getOrderAttachments(
        selectedOrderForAttachments.id,
      );
      setAttachments(orderData || []);

      // Fetch deal attachments if deal_id exists
      if (selectedOrderForAttachments.deal_id) {
        try {
          const dealData = await getDealAttachments(
            Number(selectedOrderForAttachments.deal_id),
          );
          setDealAttachments(dealData || []);
        } catch (error) {
          console.error("Failed to fetch deal attachments:", error);
          setDealAttachments([]);
        }
      } else {
        setDealAttachments([]);
      }
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
      setAttachments([]);
      setDealAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedOrderForAttachments?.id) return;

    setUploadingFile(true);
    try {
      await uploadOrderAttachment(
        selectedOrderForAttachments.id,
        file,
        file.name,
      );
      await fetchAttachments(); // Refresh attachments list
      if (fileInputRef) {
        fileInputRef.value = "";
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = useCallback(
    async (attachmentId: number) => {
      if (!selectedOrderForAttachments?.id) return;

      try {
        await deleteOrderAttachment(
          selectedOrderForAttachments.id,
          attachmentId,
        );
        await fetchAttachments(); // Refresh attachments list
        toast.success("Attachment deleted successfully!");
      } catch (error) {
        console.error("Failed to delete attachment:", error);
        toast.error("Failed to delete attachment");
      }
    },
    [selectedOrderForAttachments?.id],
  );

  const confirmDeleteAttachment = useCallback(async () => {
    if (!attachmentToDelete) return;

    await handleDeleteAttachment(attachmentToDelete.id);
    setShowDeleteAttachmentModal(false);
    setAttachmentToDelete(null);
  }, [attachmentToDelete, handleDeleteAttachment]);

  const handleDownloadAttachment = async (attachmentId: number) => {
    if (!selectedOrderForAttachments?.id) return;

    try {
      await downloadOrderAttachment(
        selectedOrderForAttachments.id,
        attachmentId,
      );
    } catch (error) {
      console.error("Failed to download attachment:", error);
    }
  };

  const handleDownloadDealAttachment = async (attachmentId: number) => {
    if (!selectedOrderForAttachments?.deal_id) return;

    try {
      await downloadDealAttachment(
        Number(selectedOrderForAttachments.deal_id),
        attachmentId,
      );
    } catch (error) {
      console.error("Failed to download deal attachment:", error);
    }
  };

  /** Download all attachments for an order (from sidebar Actions). Fetches order + deal attachments and triggers download for each. */
  const handleDownloadAllAttachments = useCallback(
    async (orderData: { id: number; deal_id?: number | string } | null) => {
      if (!orderData?.id) return;
      try {
        const orderAttachments = await getOrderAttachments(orderData.id);
        const orderList = orderAttachments || [];
        let dealList: any[] = [];
        if (orderData.deal_id) {
          try {
            const dealAttachments = await getDealAttachments(
              Number(orderData.deal_id),
            );
            dealList = dealAttachments || [];
          } catch {
            dealList = [];
          }
        }
        const total = orderList.length + dealList.length;
        if (total === 0) {
          toast.info("No attachments to download.");
          return;
        }
        for (const att of orderList) {
          await downloadOrderAttachment(orderData.id, att.id);
          await new Promise((r) => setTimeout(r, 400));
        }
        for (const att of dealList) {
          await downloadDealAttachment(Number(orderData.deal_id), att.id);
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch (error) {
        console.error("Failed to download attachments:", error);
        toast.error("Failed to download some attachments.");
      }
    },
    [],
  );

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters((prev) => applyCrmFilterRules(prev, filters, ORDERS_FILTER_RULES));
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages("order");
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchLostReasons = async () => {
    try {
      const lostReasonsData = await (getStages as any)("lost_reason");
      setLostReasons(lostReasonsData || []);
    } catch (error) {
      console.error("Failed to fetch lost reasons:", error);
    }
  };

  const fetchExtensions = async (moduleSlug: string = ModuleSlug.CRM_LEADS) => {
    try {
      const hierarchyData = await GetHierarchyData(moduleSlug);
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
    } catch (error) {
      console.error("Failed to fetch extensions:", error);
    }
  };

  const fetchOrderDetails = useCallback(async (orderId: number) => {
    setLoadingOrder(true);
    setLoadingDeal(true);
    setLoadingLead(true);
    setRelatedDeal(null);
    setRelatedLead(null);
    try {
      const orderData: any = await getOrder(orderId);
      setViewingOrder(orderData);

      // Fetch deal information if deal_id exists
      if (orderData.deal_id) {
        try {
          const dealData: any = await getDeal(Number(orderData.deal_id));
          setRelatedDeal(dealData);

          // Fetch lead information if ticket_id exists (ticket_id contains the lead_id)
          if (dealData.ticket_id) {
            try {
              const leadData: any = await getLead(Number(dealData.ticket_id));

              // Parse contact_persons if it's a string
              if (
                leadData.contact_persons &&
                typeof leadData.contact_persons === "string"
              ) {
                try {
                  leadData.contact_persons = JSON.parse(
                    leadData.contact_persons,
                  );
                } catch (e) {
                  console.error("Failed to parse contact_persons:", e);
                  leadData.contact_persons = [];
                }
              }

              setRelatedLead(leadData);
            } catch (error) {
              console.error("Failed to fetch lead:", error);
              // Don't show error toast as lead is optional
            }
          }
          setLoadingDeal(false);
        } catch (error) {
          console.error("Failed to fetch deal:", error);
          setLoadingDeal(false);
          // Don't show error toast as deal is optional
        }
      } else {
        setLoadingDeal(false);
      }
      setLoadingLead(false);
      setLoadingOrder(false);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      setLoadingOrder(false);
      setLoadingDeal(false);
      setLoadingLead(false);
    }
  }, []);

  // Handle view order - open GenericSidebar only (no modal)
  const handleViewOrder = useCallback(
    async (orderId: number) => {
      try {
        const orderData: any = await getOrder(orderId);
        setSelectedOrder(orderData);
        setShowOrderSidebar(true);
        await fetchOrderDetails(orderId);
      } catch (error) {
        console.error("Failed to fetch order:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoadingOrder(false);
        setLoadingDeal(false);
        setLoadingLead(false);
      }
    },
    [fetchOrderDetails],
  );

  const handleRowClicked = useCallback(async (orderId: number) => {
    try {
      const orderData: any = await getOrder(orderId);
      setSelectedOrder(orderData);
      setShowOrderSidebar(true);
      await fetchOrderDetails(orderId);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error("Failed to load order details");
    }
  }, []);

  // Handle preview button click - shows sidebar (persistence wrapper below)
  const handlePreviewClickBase = useCallback(
    async (order: any) => {
      const orderId = order.rawData?.id || order.id;
      // Set the order immediately to show sidebar
      setSelectedOrder(order.rawData || order);
      setShowOrderSidebar(true);

      // Fetch additional data in the background
      if (orderId) {
        try {
          await fetchOrderDetails(orderId);
          // Optionally refresh the order data to get latest info
          const orderData: any = await getOrder(orderId);
          setSelectedOrder(orderData);
        } catch (error) {
          console.error("Failed to fetch order details:", error);
          // Don't show error toast as sidebar is already open with basic data
        }
      }
    },
    [fetchOrderDetails],
  );

  const openOrderPreviewById = useCallback(
    (id: number) => {
      handlePreviewClickBase({ id, rawData: { id } }).catch((error: unknown) => {
        console.error("openOrderPreviewById:", error);
      });
    },
    [handlePreviewClickBase],
  );

  const { writePreviewIdToStorage, clearPreviewIdFromStorage } =
    useCrmListPreviewPersistence({
      localStorageKey: "crm-orders-list-preview-record-id",
      listLoading: !isInitialized || loading,
      openPreviewByNumericId: openOrderPreviewById,
      enableRestore: false,
    });

  const handlePreviewClick = useCallback(
    async (order: any) => {
      const orderId = order.rawData?.id || order.id;
      if (orderId) writePreviewIdToStorage(Number(orderId));
      await handlePreviewClickBase(order);
    },
    [handlePreviewClickBase, writePreviewIdToStorage],
  );

  // Handle close order sidebar
  const handleCloseOrderSidebar = useCallback(() => {
    setShowOrderSidebar(false);
    setSelectedOrder(null);
    setViewingOrder(null);
    setRelatedDeal(null);
    setRelatedLead(null);
    clearPreviewIdFromStorage();
  }, [clearPreviewIdFromStorage]);

  const handleHideOrderSidebarKeepPersistence = useCallback(() => {
    setShowOrderSidebar(false);
    setSelectedOrder(null);
    setViewingOrder(null);
    setRelatedDeal(null);
    setRelatedLead(null);
  }, []);

  // Handle first column click - navigates to detail page
  const handleFirstColumnClick = useCallback(
    (order: any) => {
      const orderId = order.rawData?.id || order.id;
      if (orderId) {
        router.push(`/crm/detailspage?type=order&id=${orderId}`);
      }
    },
    [router],
  );

  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  const handleDeleteOrder = useCallback(
    (orderId: number, orderNumber?: string) => {
      setOrderToDelete({ id: orderId, orderNumber });
      setShowDeleteModal(true);
    },
    [],
  );

  const confirmDeleteOrder = useCallback(async () => {
    if (!orderToDelete) return;

    try {
      await deleteOrder(orderToDelete.id);
      setShowDeleteModal(false);
      setOrderToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Order Deleted");
      setSuccessModalDescription("Order has been deleted successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to delete order:", error);
    }
  }, [orderToDelete]);

  // Restore Order Handler
  const handleRestoreOrder = useCallback(async (orderId: number) => {
    if (!window.confirm("Are you sure you want to restore this order?")) return;

    try {
      await restoreOrder(orderId);
      toast.success("Order restored successfully!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Order Restored");
      setSuccessModalDescription("Order has been restored successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to restore order:", error);
      toast.error("Failed to restore order");
    }
  }, []);

  // Mark Order Lost Modal
  const handleMarkLost = useCallback((order: any) => {
    setOrderToMarkLost(order);
    setShowMarkLostModal(true);
  }, []);

  const handleMarkLostSubmit = useCallback(async () => {
    if (!orderToMarkLost || !lostReasonId || !lostFeedback.trim()) return;

    try {
      await markOrderLost(orderToMarkLost.id, {
        lost_reason_id: lostReasonId,
        lost_feedback: lostFeedback,
      });
      setShowMarkLostModal(false);
      setOrderToMarkLost(null);
      setLostReasonId(null);
      setLostFeedback("");
      toast.success("Order marked as lost!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Order Marked as Lost");
      setSuccessModalDescription("Order has been marked as lost successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to mark order as lost:", error);
    }
  }, [orderToMarkLost, lostReasonId, lostFeedback]);

  // Helper functions
  const handleSort = (
    column: string,
    paginationState: any,
    setPaginationState: (state: any) => void,
  ) => {
    const newDirection =
      paginationState.sortBy === column &&
      paginationState.sortOrder === "asc"
        ? "desc"
        : "asc";
    setPaginationState({
      ...paginationState,
      sortBy: column,
      sortOrder: newDirection,
      currentPage: 1,
    });
  };

  const sortData = <T extends Record<string, any>>(
    data: T[],
    sortBy: string,
    sortOrder: "asc" | "desc",
  ): T[] => {
    if (!sortBy) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (aVal === undefined) aVal = "";
      if (bVal === undefined) bVal = "";

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
      if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const paginateData = <T,>(
    data: T[],
    currentPage: number,
    rowsPerPage: number,
  ): T[] => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength: number, rowsPerPage: number): number => {
    return Math.ceil(dataLength / rowsPerPage);
  };

  const renderPaginationControls = (
    dataLength: number,
    paginationState: any,
    setPaginationState: (state: any) => void,
    label: string,
  ) => {
    const totalPages = getTotalPages(dataLength, paginationState.rowsPerPage);
    const { currentPage, rowsPerPage } = paginationState;
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, dataLength);

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Show</span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) =>
              setPaginationState({
                ...paginationState,
                rowsPerPage: Number(e.target.value),
                currentPage: 1,
              })
            }
            style={{ width: "auto" }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
          <span className="text-muted small">entries</span>
        </div>

        <div className="text-muted small">
          Showing {startRow} to {endRow} of {dataLength} {label}
        </div>

        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() =>
              setPaginationState({ ...paginationState, currentPage: 1 })
            }
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() =>
              setPaginationState({
                ...paginationState,
                currentPage: currentPage - 1,
              })
            }
          >
            <ChevronLeft size={14} />
          </Button>

          {[...Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={
                    currentPage === pageNum ? "primary" : "outline-secondary"
                  }
                  onClick={() =>
                    setPaginationState({
                      ...paginationState,
                      currentPage: pageNum,
                    })
                  }
                >
                  {pageNum}
                </Button>
              );
            } else if (
              pageNum === currentPage - 2 ||
              pageNum === currentPage + 2
            ) {
              return (
                <span key={pageNum} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPaginationState({
                ...paginationState,
                currentPage: currentPage + 1,
              })
            }
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPaginationState({
                ...paginationState,
                currentPage: totalPages,
              })
            }
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    );
  };

  const renderSortIcon = (column: string, paginationState: any) => {
    if (paginationState.sortBy !== column) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return paginationState.sortOrder === "asc" ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };

  // Transform API order data to UI format
  const transformOrderData = (order: any) => {
    return {
      id: order.id,
      orderNumber: order.order_number || "",
      customer: order.customer_name || "",
      customerEmail: order.customer_email || "",
      customerPhone: order.customer_phone || "",
      deal: order.deal?.name || order.deal_id || "",
      dealId: order.deal_id || null,
      stage: order.stage?.name || "No Stage",
      stageColor: order.stage?.color || "grey",
      stageId: order.order_stage_id || null,
      value: order.final_amount || order.total_amount || "0",
      currency: order.currency || "AED",
      approvalStatus: order.order_approval_status || null,
      fulfillmentStatus: order.fulfillment_status || null,
      paymentStatus: order.payment_status || null,
      //orderDate: formatDateForTable(order.order_date),
      orderDate: order.order_date
        ? moment(order.order_date).format(GlobalDateFormat)
        : "-",
      assignedUser:
        extensions.find(
          (ext: any) =>
            ext?.id == order?.assigned_to ||
            ext?.extension == order?.assigned_to,
        )?.display_name ||
        extensions.find(
          (ext: any) =>
            ext?.id == order?.assigned_to ||
            ext?.extension == order?.assigned_to,
        )?.name ||
        order.assigned_to ||
        "",
      expectedDeliveryDate: formatDateForTable(order.expected_delivery_date),
      actualDeliveryDate: formatDateForTable(order.actual_delivery_date),
      owner:
        extensions.find(
          (ext: any) =>
            ext?.id == order?.assigned_to ||
            ext?.extension == order?.assigned_to,
        )?.display_name ||
        extensions.find(
          (ext: any) =>
            ext?.id == order?.assigned_to ||
            ext?.extension == order?.assigned_to,
        )?.name ||
        order.assigned_to ||
        "",
      created: formatDateForTable(order.created_at),
      contractType: order.contract_type || "",
      contractLength: order.contract_length || "",
      contractStartDate: formatDateForTable(order.contract_start_date),
      contractEndDate: formatDateForTable(order.contract_end_date),
      billingModel: order.billing_model || "",
      billingStatus: order.billing_status || "",
      paymentTerms: order.payment_terms || "",
      progressDial: order.progress_dial || 0,
      pocName: order.poc_name || order.customer_name || "",
      pocTitle: order.poc_title || "",
      pocPhone: order.poc_phone || "",
      company: order.company || order.deal?.company_name || "",
      industry: order.industry || order.deal?.industry || "",
      status: order.status || "pending",
      rawData: order, // Keep original data for actions
    };
  };

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const transformedOrders = ordersData.map(transformOrderData);

    const total = summaryTiles ? totalOrders : transformedOrders.length;
    const delivered = transformedOrders.filter(
      (o) =>
        o.fulfillmentStatus?.toLowerCase().includes("completed") ||
        o.fulfillmentStatus?.toLowerCase().includes("delivered"),
    ).length;
    const inProgress = transformedOrders.filter((o) =>
      o.fulfillmentStatus?.toLowerCase().includes("progress"),
    ).length;
    const pendingApproval = transformedOrders.filter((o) =>
      o.approvalStatus?.toLowerCase().includes("pending"),
    ).length;

    // Calculate total value
    const totalValue = transformedOrders.reduce((sum, o) => {
      const value = parseFloat(String(o.value).replace(/[^0-9.-]/g, "")) || 0;
      return sum + value;
    }, 0);

    // Stage distribution
    const stageCounts: Record<string, number> = {};
    transformedOrders.forEach((o) => {
      const stage = o.stage || "No Stage";
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });

    // Status distribution
    const statusCounts: Record<string, number> = {};
    transformedOrders.forEach((o) => {
      const status = o.fulfillmentStatus || "pending";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      total,
      delivered,
      inProgress,
      pendingApproval,
      totalValue,
      stageCounts,
      statusCounts,
    };
  }, [ordersData, extensions, summaryTiles, totalOrders]);

  // Transform orders data (no client-side filtering - API handles it)
  const filteredOrders = useMemo(() => {
    return ordersData.map(transformOrderData);
  }, [ordersData, extensions]);

  // Calculate filter counts (using summary_tiles if available, otherwise from data)
  const filterCounts = useMemo(() => {
    const transformed = ordersData.map(transformOrderData);
    const counts: Record<string, number> = {
      all: tabTotals.all ?? summaryTiles?.total_orders ?? transformed.length,
      lost:
        tabTotals.lost ??
        summaryTiles?.lost_orders ??
        transformed.filter((o) => o.rawData?.is_lost).length,
      deleted:
        tabTotals.deleted ??
        summaryTiles?.deleted_orders ??
        transformed.filter((o) => o.rawData?.is_archived || o.rawData?.deleted_at)
          .length,
    };

    // Add counts for all stages (not just first 5, for custom tabs)
    stages.forEach((stage: any) => {
      const stageOrders = transformed.filter(
        (o) => o.stage === stage.name || o.rawData?.order_stage_id === stage.id,
      );
      counts[stage.id] = stageOrders.length;
    });

    return counts;
  }, [ordersData, extensions, stages, summaryTiles, tabTotals]);

  // Update custom tabs counts when filterCounts change
  useEffect(() => {
    setCustomTabs((prevTabs) =>
      prevTabs.map((tab) => {
        const count = filterCounts[tab.id] || 0;
        return { ...tab, count };
      }),
    );
  }, [filterCounts]);

  // Define stats cards for GenericTable
  const ordersStatsCards: StatsCardData[] = useMemo(
    () => {
      const m = ordersMetrics || {};
      return [
        {
          title: "All Orders",
          value: m.total_orders ?? 0,
          icon: Users,
          iconColor: "#6366F1",
          iconBgColor: "#EEF2FF",
          metric: {
            text: `${m.total_orders_last_7_days ?? 0} in last 7 days`,
            dotColor: "#6366F1",
          },
        },
        {
          title: "High-Value Orders",
          value: m.high_value_orders ?? 0,
          icon: Calendar,
          iconColor: "#10B981",
          iconBgColor: "#D1FAE5",
          additionalText: "Client-defined threshold",
        },
        {
          title: "Active Orders",
          value: m.active_orders ?? 0,
          icon: Target,
          iconColor: "#8B5CF6",
          iconBgColor: "#EDE9FE",
          additionalText: "In progress",
        },
        {
          title: "Orders under Review",
          value: m.orders_under_review ?? 0,
          icon: Users,
          iconColor: "#6366F1",
          iconBgColor: "#EEF2FF",
          additionalText: "Orders paused for review",
        },
        {
          title: "Completed Orders",
          value: m.completed_orders ?? 0,
          icon: Calendar,
          iconColor: "#10B981",
          iconBgColor: "#D1FAE5",
          metric: {
            text: `${m.completed_orders_last_7_days ?? 0} in last 7 days`,
            dotColor: "#10B981",
          },
        },
        {
          title: "Canceled Orders",
          value: m.canceled_orders ?? 0,
          icon: Target,
          iconColor: "#8B5CF6",
          iconBgColor: "#EDE9FE",
          metric: {
            text: `${m.canceled_orders_last_7_days ?? 0} in last 7 days`,
            dotColor: "#8B5CF6",
          },
        },
      ];
    },
    [ordersMetrics],
  );

  // Define columns for GenericTable
  const ordersColumns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "orderNumber",
        label: "Order Number",
        sortable: true,
        type: "text",
        emptyValue: "-",
      },
      {
        key: "customer",
        label: "Company",
        sortable: true,
        type: "multi-field",
        fields: {
          primary: "customer",
          secondary: "customerEmail",
          secondaryClass: "text-muted small",
        },
        render: (row) => (
          <div className="d-flex align-items-center gap-2">
            {row.customer ? (
              <>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: getRandomColor(row.customer),
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "600",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(row.customer)}
                </div>
                <div>
                  <div className="fw-medium">{row.customer}</div>
                  {row.customerEmail && (
                    <small className="text-muted">{row.customerEmail}</small>
                  )}
                </div>
              </>
            ) : (
              <div>No Company</div>
            )}
          </div>
        ),
        emptyValue: "No Company",
      },
      {
        key: "deal",
        label: "Linked Deal",
        sortable: true,
        type: "text",
        accessor: (row) => row.deal || "No Deal",
        emptyValue: "No Deal",
      },
      {
        key: "stage",
        label: "Stage",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span
            style={{ backgroundColor: row?.stageColor || "grey" }}
            className="badge"
          >
            {row.stage}
          </span>
        ),
      },
      {
        key: "value",
        label: "Value",
        sortable: true,
        type: "custom",
        render: (row) => (
          <span className="fw-semibold">
            {row.currency} {parseFloat(String(row.value)).toLocaleString()}
          </span>
        ),
      },
      {
        key: "approvalStatus",
        label: "Approval",
        sortable: true,
        type: "custom",
        render: (row) => (
          <Badge
            bg={
              row.approvalStatus?.toLowerCase() === "approved"
                ? "success"
                : row.approvalStatus?.toLowerCase() === "rejected"
                  ? "danger"
                  : "warning"
            }
          >
            {row.approvalStatus}
          </Badge>
        ),
        emptyValue: "-",
      },
      {
        key: "fulfillmentStatus",
        label: "Fulfillment",
        sortable: true,
        type: "custom",
        render: (row) => (
          <Badge
            bg={
              row.fulfillmentStatus?.toLowerCase().includes("completed") ||
              row.fulfillmentStatus?.toLowerCase().includes("delivered")
                ? "success"
                : row.fulfillmentStatus?.toLowerCase().includes("progress")
                  ? "primary"
                  : "secondary"
            }
          >
            {row.fulfillmentStatus}
          </Badge>
        ),
        emptyValue: "-",
      },
      {
        key: "paymentStatus",
        label: "Payment",
        sortable: true,
        type: "custom",
        render: (row) => (
          <Badge
            bg={
              row.paymentStatus?.toLowerCase() === "paid"
                ? "success"
                : row.paymentStatus?.toLowerCase() === "partial"
                  ? "warning"
                  : "danger"
            }
          >
            {row.paymentStatus}
          </Badge>
        ),
        emptyValue: "-",
      },
      {
        key: "assignedUser",
        label: "Owner",
        sortable: true,
        type: "text",
        emptyValue: "-",
      },
      {
        key: "orderDate",
        label: "Order Date",
        sortable: true,
        type: "text",
        emptyValue: "-",
      },
      {
        key: "owner",
        label: "Associate with",
        sortable: true,
        type: "text",
        emptyValue: "-",
      },
      {
        key: "created",
        label: "Created",
        sortable: true,
        type: "text",
        emptyValue: "-",
      },
    ],
    [],
  );

  // Define actions for GenericTable
  const ordersActions: TableAction<any>[] = useMemo(() => {
    if (activeFilter === "deleted") {
      return [
        {
          label: "View",
          icon: <Eye size={16} />,
          onClick: (row: any) => handlePreviewClick(row),
          variant: "link" as const,
        },
        {
          label: "Restore",
          icon: <RotateCcw size={16} />,
          onClick: (row: any) => handleRestoreOrder(row.rawData?.id || row.id),
          variant: "link" as const,
          className: "text-success",
        },
      ];
    }

    return [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row: any) => handlePreviewClick(row),
        variant: "link" as const,
      },

      ...(session?.user?.is_admin === "1" || isAccountRole
        ? [
            {
              label: "Edit as Account",
              icon: <Edit size={16} />,
              onClick: (row: any) => {
                const id = row.rawData?.id ?? row.id;
                if (id) {
                  setEditingOrderIdInSidebar(id);
                  setEditOrderModeInSidebar("account");
                  setShowEditOrderSidebar(true);
                }
              },
              variant: "link" as const,
            },
          ]
        : []),

      ...(session?.user?.is_admin === "1" || isDeliveryRole
        ? [
            {
              label: "Edit as Delivery",
              icon: <Edit size={16} />,
              onClick: (row: any) => {
                const id = row.rawData?.id ?? row.id;
                if (id) {
                  setEditingOrderIdInSidebar(id);
                  setEditOrderModeInSidebar("delivery");
                  setShowEditOrderSidebar(true);
                }
              },
              variant: "link" as const,
              className: "text-warning",
            },
          ]
        : []),

      {
        label: "Attachments",
        icon: <Paperclip size={16} />,
        onClick: (row: any) => {
          setSelectedOrderForAttachments(row.rawData || row);
          setShowAttachmentModal(true);
        },
        variant: "link" as const,
        className: "text-info",
      },

      ...(session?.user?.permissions?.includes("delete-crm-orders")
        ? [
            {
              label: "Delete",
              icon: <Trash2 size={16} />,
              onClick: (row: any) =>
                handleDeleteOrder(row.rawData?.id || row.id, row.orderNumber),
              variant: "link" as const,
              className: "text-danger",
            },
          ]
        : []),

      // ✅ ALWAYS SHOW MORE ACTIONS
      {
        label: "More Actions",
        icon: <MoreVertical size={16} />,
        variant: "link" as const,
        dropdown: {
          align: "end" as const,
          options: [
            {
              label: "Withdraw (with lost reason)",
              icon: <X size={14} />,
              onClick: (row: any) => handleMarkLost(row.rawData || row),
              className: "text-danger",
            },
            {
              label: "Withdraw (For Further Changes)",
              icon: <X size={14} />,
              onClick: (row: any) => handleDeleteOrder(row.rawData || row),
              className: "text-danger",
            },
          ],
        },
      },
    ];
  }, [
    session,
    activeFilter,
    handlePreviewClick,
    handleViewOrder,
    handleRestoreOrder,
    handleDeleteOrder,
    handleMarkLost,
    fetchOrderDetails,
  ]);

  const ordersToolbarConfig = useCrmToolbarConfig({
    entity: "orders",
    searchValue: ordersSearch,
    searchPlaceholder: "Search orders by number, customer, deal...",
    onSearchChange: setOrdersSearch,
    onSearch: () => {},
    currentFilters,
    handleFiltersChange,
    refresh: () => setRefreshKey((prev) => prev + 1),
    activeTab: activeFilter,
    onTabChange: handleFilterChange,
    tabs: [
      { id: "all", label: "All orders", count: filterCounts.all, removable: false },
      ...customTabs,
    ],
    onTabAdd: () => setShowTabModal(true),
    onTabRemove: (tabId) => {
      setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
      if (activeFilter === tabId) handleFilterChange("all");
    },
    tabsDropdownLabel: "Orders",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => setShowExportModal(true),
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: false,
    currentTableView: ordersViewMode,
    onTableViewChange: setOrdersViewMode,
    extensions,
    onPaginationReset: () =>
      setOrdersPagination((prev) => ({ ...prev, currentPage: 1 })),
  });

  if (!session?.user?.permissions?.includes("list-crm-orders")) {
    return null;
  }

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .orders-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .orders-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .orders-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .orders-table-wrapper .table-responsive table th,
        .orders-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        
        /* Page layout for full height */
        .orders-page-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          overflow: hidden;
        }
        
        .orders-content-area {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .orders-scrollable-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
      `,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Orders"
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
        <div className="orders-scrollable-content" style={{ flex: 1 }}>
          <div className="container-fluid">
            {/* Analytics Section - Collapsible */}
            {showOrdersAnalytics && (
              <>
                {/* Summary Stats using KPICard */}
                <Row className="mb-4">
                  <Col lg={3} md={6} className="mb-3">
                    <KPICard
                      title="Total Orders"
                      value={analyticsData.total.toString()}
                      icon={<ShoppingBag size={24} />}
                      color="primary"
                    />
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <KPICard
                      title="Delivered"
                      value={analyticsData.delivered.toString()}
                      icon={<CheckCircle size={24} />}
                      color="success"
                    />
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <KPICard
                      title="In Progress"
                      value={analyticsData.inProgress.toString()}
                      icon={<Activity size={24} />}
                      color="info"
                    />
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <KPICard
                      title="Total Value"
                      value={`${analyticsData.totalValue.toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 0,
                        },
                      )}`}
                      icon={<DollarSign size={24} />}
                      color="success"
                    />
                  </Col>
                </Row>

                {/* Analytics Charts */}
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body>
                        <h6 className="fw-bold mb-3">Orders by Stage</h6>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={Object.entries(
                                analyticsData.stageCounts,
                              ).map(([stage, count]) => ({
                                name: stage,
                                value: count,
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }: any) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.entries(analyticsData.stageCounts).map(
                                ([stage, count], index) => {
                                  const colors = [
                                    "#0dcaf0",
                                    "#0d6efd",
                                    "#ffc107",
                                    "#fd7e14",
                                    "#198754",
                                    "#6c757d",
                                  ];
                                  return (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={colors[index % colors.length]}
                                    />
                                  );
                                },
                              )}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body>
                        <h6 className="fw-bold mb-3">
                          Fulfillment Status Distribution
                        </h6>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={Object.entries(
                              analyticsData.statusCounts,
                            ).map(([status, count]) => ({ status, count }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0d6efd" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {/* Filter Bar */}
            {showFilterBar && (
              <FilterBar
                quickFilters={[
                  {
                    id: "all",
                    label: "All Orders",
                    count: filterCounts.all,
                    color: "#0d6efd",
                    icon: <ShoppingCart size={16} />,
                  },
                  ...stages.slice(0, 5).map((stage: any) => ({
                    id: stage.id.toString(),
                    label: stage.name,
                    count: filterCounts[stage.id] || 0,
                    color: stage.color || "#6c757d",
                    icon: <Layers size={16} />,
                  })),
                  {
                    id: "lost",
                    label: "Lost",
                    count: filterCounts.lost || 0,
                    color: "#fd7e14",
                    icon: <X size={16} />,
                  },
                  {
                    id: "deleted",
                    label: "Deleted",
                    count: filterCounts.deleted || 0,
                    color: "#dc3545",
                    icon: <Trash2 size={16} />,
                  },
                ]}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                // searchValue={ordersSearch}

                // onSearch={() => {
                //   if (ordersSearch.trim()) {
                //     handleFiltersChange({ search: ordersSearch.trim() });
                //   } else {
                //     handleFiltersChange({ search: null });
                //   }
                //   setOrdersPagination({ ...ordersPagination, currentPage: 1 });
                // }}
                // searchPlaceholder="Search orders by number, customer, deal..."
                // onSearchChange={(value) => setOrdersSearch(value)}
                // showAdvancedFilters={showAdvancedFilters}
                // onToggleAdvancedFilters={() =>
                //   setShowAdvancedFilters(!showAdvancedFilters)
                // }
                // advancedFilterCount={
                //   (ordersFilters.assignedTo !== null ? 1 : 0) +
                //   (ordersFilters.stage !== null ? 1 : 0) +
                //   (ordersFilters.industry !== null ? 1 : 0) +
                //   (ordersFilters.orderValueMin !== null ||
                //   ordersFilters.orderValueMax !== null
                //     ? 1
                //     : 0) +
                //   (ordersFilters.orderApprovalStatus !== null ? 1 : 0) +
                //   (ordersFilters.fulfillmentStatus !== null ? 1 : 0) +
                //   (ordersFilters.paymentStatus !== null ? 1 : 0) +
                //   (ordersFilters.dateFrom !== null || ordersFilters.dateTo !== null
                //     ? 1
                //     : 0)
                // }
              />
            )}

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <Row className="g-3 align-items-end">
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Search
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={ordersSearch}
                        onChange={(e) => setOrdersSearch(e.target.value)}
                        placeholder="Search orders by number, customer, deal..."
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Owner
                      </Form.Label>
                      <Select
                        options={extensions.map((ext: any) => ({
                          value: ext.id || ext.extension,
                          label:
                            ext.display_name ||
                            ext.name ||
                            ext.id ||
                            ext.extension,
                        }))}
                        value={
                          ordersFilters.assignedTo
                            ? (() => {
                                const assignedToId = ordersFilters.assignedTo;
                                const ext = extensions.find(
                                  (e: any) =>
                                    (e.id || e.extension) === assignedToId,
                                );
                                return ext
                                  ? {
                                      value: assignedToId,
                                      label:
                                        ext.display_name ||
                                        ext.name ||
                                        assignedToId,
                                    }
                                  : {
                                      value: assignedToId,
                                      label: assignedToId,
                                    };
                              })()
                            : null
                        }
                        onChange={(selected) => {
                          const assignedToValue = selected
                            ? selected.value
                            : null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            assignedTo: assignedToValue,
                          }));
                          // Reset to all when assigned filter changes
                          setActiveFilter("all");
                        }}
                        placeholder="Select user..."
                        styles={customSelectStyles}
                        isClearable
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Order Stage
                      </Form.Label>
                      <Select
                        options={stages.map((s) => ({
                          value: s.id.toString(),
                          label: s.name,
                        }))}
                        value={
                          ordersFilters.stage
                            ? (() => {
                                const stageId = ordersFilters.stage;
                                const stage = stages.find(
                                  (st: any) => st.id.toString() === stageId,
                                );
                                return stage
                                  ? { value: stageId, label: stage.name }
                                  : { value: stageId, label: stageId };
                              })()
                            : null
                        }
                        onChange={(selected) => {
                          const stageValue = selected ? selected.value : null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            stage: stageValue,
                          }));
                          // Update activeFilter to match selected stage
                          if (stageValue) {
                            setActiveFilter(stageValue);
                          } else {
                            setActiveFilter("all");
                          }
                        }}
                        placeholder="Select stage..."
                        styles={customSelectStyles}
                        isClearable
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Industry
                      </Form.Label>
                      <Form.Select
                        value={ordersFilters.industry || ""}
                        onChange={(e) => {
                          const value = e.target.value || null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            industry: value,
                          }));
                        }}
                      >
                        <option value="">Select Industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Banking & Financial Services">
                          Banking & Financial Services
                        </option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                        <option value="Education">Education</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Telecommunications">
                          Telecommunications
                        </option>
                        <option value="Construction">Construction</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Order Value Min
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={ordersFilters.orderValueMin || ""}
                        onChange={(e) => {
                          const value = e.target.value || null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            orderValueMin: value,
                          }));
                        }}
                        placeholder="0.00"
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Order Value Max
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={ordersFilters.orderValueMax || ""}
                        onChange={(e) => {
                          const value = e.target.value || null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            orderValueMax: value,
                          }));
                        }}
                        placeholder="0.00"
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Order Approval Status
                      </Form.Label>
                      <Form.Select
                        value={ordersFilters.orderApprovalStatus || ""}
                        onChange={(e) => {
                          const value = e.target.value || null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            orderApprovalStatus: value,
                          }));
                        }}
                      >
                        <option value="">Select Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Fulfillment Status
                      </Form.Label>
                      <Form.Select
                        value={ordersFilters.fulfillmentStatus || ""}
                        onChange={(e) => {
                          const value = e.target.value || null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            fulfillmentStatus: value,
                          }));
                        }}
                      >
                        <option value="">Select Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Payment Status
                      </Form.Label>
                      <Form.Select
                        value={ordersFilters.paymentStatus || ""}
                        onChange={(e) => {
                          const value = e.target.value || null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            paymentStatus: value,
                          }));
                        }}
                      >
                        <option value="">Select Status</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Date From
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={ordersFilters.dateFrom || ""}
                        onChange={(e) => {
                          const dateValue = e.target.value || null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            dateFrom: dateValue,
                          }));
                        }}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold mb-2">
                        Date To
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={ordersFilters.dateTo || ""}
                        onChange={(e) => {
                          const dateValue = e.target.value || null;
                          setOrdersFilters((prev) => ({
                            ...prev,
                            dateTo: dateValue,
                          }));
                        }}
                      />
                    </Col>
                    <Col md={4}>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-secondary"
                          className="d-flex align-items-center justify-content-center"
                          onClick={() => {
                            // Map ordersFilters to the format expected by handleFiltersChange
                            const filtersToApply: Record<string, any> = {};

                            if (ordersSearch) {
                              filtersToApply.search = ordersSearch;
                            }
                            if (ordersFilters.assignedTo) {
                              filtersToApply.user_extension_filter =
                                ordersFilters.assignedTo;
                            }
                            if (ordersFilters.stage) {
                              filtersToApply.order_stage_id =
                                ordersFilters.stage;
                            }
                            if (ordersFilters.industry) {
                              filtersToApply.industry = ordersFilters.industry;
                            }
                            if (ordersFilters.orderValueMin) {
                              filtersToApply.order_value_min =
                                ordersFilters.orderValueMin;
                            }
                            if (ordersFilters.orderValueMax) {
                              filtersToApply.order_value_max =
                                ordersFilters.orderValueMax;
                            }
                            if (ordersFilters.orderApprovalStatus) {
                              filtersToApply.order_approval_status =
                                ordersFilters.orderApprovalStatus;
                            }
                            if (ordersFilters.fulfillmentStatus) {
                              filtersToApply.fulfillment_status =
                                ordersFilters.fulfillmentStatus;
                            }
                            if (ordersFilters.paymentStatus) {
                              filtersToApply.payment_status =
                                ordersFilters.paymentStatus;
                            }
                            if (ordersFilters.dateFrom) {
                              filtersToApply.date_from = ordersFilters.dateFrom;
                            }
                            if (ordersFilters.dateTo) {
                              filtersToApply.date_to = ordersFilters.dateTo;
                            }

                            handleFiltersChange(filtersToApply);
                            setOrdersPagination({
                              ...ordersPagination,
                              currentPage: 1,
                            });
                            setRefreshKey((prev) => prev + 1);
                          }}
                        >
                          Submit Filters
                        </Button>
                        <Button
                          variant="outline-secondary"
                          className="d-flex align-items-center justify-content-center"
                          onClick={() => {
                            setOrdersSearch("");
                            setOrdersFilters({
                              assignedTo: null,
                              stage: null,
                              industry: null,
                              orderValueMin: null,
                              orderValueMax: null,
                              orderApprovalStatus: null,
                              fulfillmentStatus: null,
                              paymentStatus: null,
                              ticketId: null,
                              dealId: null,
                              dateFrom: null,
                              dateTo: null,
                            });
                            handleFiltersChange({});
                            setCurrentFilters({});
                            setActiveFilter("all");
                            setOrdersPagination({
                              ...ordersPagination,
                              currentPage: 1,
                            });
                            setRefreshKey((prev) => prev + 1);
                          }}
                        >
                          Reset
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Orders Table with GenericTable */}
            <div
              className="orders-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <GenericTable
                data={filteredOrders}
                columns={ordersColumns.filter((c) =>
                  selectedOrdersColumns.includes(c.key),
                )}
                actions={ordersActions}
                showActions={false}
                // customizableColumns={true}
                defaultSelectedColumns={[
                  "orderNumber",
                  "customer",
                  "deal",
                  "stage",
                  "value",
                  "approvalStatus",
                  "fulfillmentStatus",
                  "assignedUser",
                  "orderDate",
                  "owner",
                ]}
                columnStorageKey="ordersSelectedColumns"
                onColumnChange={(cols) => setSelectedOrdersColumns(cols)}
                pagination={{
                  currentPage: ordersPagination.currentPage,
                  rowsPerPage: ordersPagination.rowsPerPage,
                  totalRows: totalOrders,
                  pageSizeOptions: [10, 15, 25, 50, 100],
                }}
                onPaginationChange={(page, rowsPerPage) => {
                  setOrdersPagination({
                    ...ordersPagination,
                    currentPage: page,
                    rowsPerPage,
                  });
                }}
                sortable={true}
                defaultSortBy={ordersPagination.sortBy}
                defaultSortOrder={ordersPagination.sortOrder}
                onSort={(column, direction) => {
                  setOrdersPagination({
                    ...ordersPagination,
                    sortBy: column,
                    sortOrder: direction,
                  });
                }}
                onPreviewClick={(order) => handlePreviewClick(order)}
                onFirstColumnClick={(order) => handleFirstColumnClick(order)}
                onRowDoubleClick={(row) => {
                  if (session?.user?.permissions?.includes("list-crm-orders")) {
                    handleViewOrder(row.rawData?.id || row.id);
                  }
                }}
                loading={loading}
                emptyMessage="No orders found matching your criteria"
                loadingMessage="Loading orders..."
                hover={true}
                uniqueKey="id"
                // Fixed height mode
                fixedHeight={true}
                maxHeight="calc(100vh - 380px)"
                // Toolbar
                showToolbar={true}
                toolbar={ordersToolbarConfig}
                // Stats cards for metrics
                statsCards={ordersStatsCards}
                customBody={
                  ordersViewMode === "board" ? (
                    <KanbanBoard
                      columns={ordersToKanbanColumns(filteredOrders, stages)}
                      onCardClick={(order) =>
                        handleViewOrder(order.raw?.id ?? order.id)
                      }
                      onCardMove={(orderId, fromCol, toCol) => {
                        const order = filteredOrders.find(
                          (o) => o.id === Number(orderId) || o.id === orderId
                        );
                        if (order) {
                          updateOrder(Number(order.id), {
                            order_stage_id: toCol,
                          })
                            .then(() => {
                              fetchOrders(
                                ordersPagination.currentPage,
                                ordersPagination.rowsPerPage
                              );
                            })
                            .catch((err) => {
                              console.error("Failed to update order stage:", err);
                              toast.error("Failed to update order stage");
                            });
                        }
                      }}
                      searchValue={ordersSearch}
                    />
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Order Details Sidebar */}
        {showOrderSidebar && (
          <GenericSidebar
            isOpen={showOrderSidebar}
            onClose={handleCloseOrderSidebar}
            title={
              selectedOrder?.order_number ||
              `Order #${selectedOrder?.id}` ||
              "Order Details"
            }
            subtitle={
              selectedOrder?.customer_name ||
              selectedOrder?.customer_phone ||
              ""
            }
            email={selectedOrder?.customer_email}
            phone={selectedOrder?.customer_phone}
            avatar={{
              initials: getInitials(selectedOrder?.customer_name || "NA"),
              name: selectedOrder?.customer_name || "NA",
              gradient: getRandomColor(selectedOrder?.customer_name || ""),
            }}
            recordType="order"
            recordId={
              selectedOrder?.id ?? selectedOrder?.rawData?.id ?? undefined
            }
            senderName={session?.user?.name || ""}
            senderEmail={session?.user?.email || ""}
            onLogCall={sidebarLogActivityModals.openLogCall}
            onLogEmail={sidebarLogActivityModals.openLogEmail}
            onLogSms={sidebarLogActivityModals.openLogSms}
            onLogWhatsApp={sidebarLogActivityModals.openLogWhatsApp}
            onLogMeeting={sidebarLogActivityModals.openLogMeeting}
            crmSummary={selectedOrder?.rawData?.crm_summary ?? selectedOrder?.crm_summary ?? undefined}
            record={{
              id: selectedOrder?.id || selectedOrder?.rawData?.id,
              type: RECORD_TYPES.ORDER,
            }}
            recordLink={{
              label: "View record",
              onClick: () => {
                const orderId = selectedOrder?.id || selectedOrder?.rawData?.id;
                if (orderId) {
                  handleHideOrderSidebarKeepPersistence();
                  router.push(`/crm/detailspage?type=order&id=${orderId}`);
                }
              },
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Edit Order",
                  onClick: () => {
                    const orderId =
                      selectedOrder?.id || selectedOrder?.rawData?.id;
                    if (orderId) {
                      setShowOrderSidebar(false);
                      setEditingOrderIdInSidebar(orderId);
                      setEditOrderModeInSidebar("account");
                      setShowEditOrderSidebar(true);
                    }
                  },
                },
                {
                  label: "View History",
                  onClick: () => {
                    setShowOrderSidebar(false);
                    const orderId =
                      selectedOrder?.id || selectedOrder?.rawData?.id;
                    if (orderId) {
                      handleViewOrder(orderId);
                    }
                  },
                },
                {
                  label: "Download Attachment",
                  onClick: () => {
                    const orderData = selectedOrder?.rawData || selectedOrder;
                    if (orderData?.id) {
                      handleDownloadAllAttachments(orderData);
                    }
                  },
                },
                {
                  label: "Delete",
                  onClick: () => {
                    const orderId =
                      selectedOrder?.id || selectedOrder?.rawData?.id;
                    if (orderId) {
                      setShowOrderSidebar(false);
                      handleDeleteOrder(orderId, selectedOrder?.order_number);
                    }
                  },
                },
              ],
            }}
            sections={[
              {
                id: "about-order",
                title: "About this order",
                icon: ShoppingBag,
                collapsible: true,
                defaultExpanded: true,
                actions: [
                  ...(session?.user?.is_admin === "1" || isAccountRole
                    ? [
                        {
                          label: "Edit as Account",
                          onClick: () => {
                            const orderId =
                              selectedOrder?.id || selectedOrder?.rawData?.id;
                            if (orderId) {
                              setEditingOrderIdInSidebar(orderId);
                              setEditOrderModeInSidebar("account");
                              setShowEditOrderSidebar(true);
                            }
                          },
                        },
                      ]
                    : []),
                  ...(session?.user?.is_admin === "1" || isDeliveryRole
                    ? [
                        {
                          label: "Edit as Delivery",
                          onClick: () => {
                            const orderId =
                              selectedOrder?.id || selectedOrder?.rawData?.id;
                            if (orderId) {
                              setEditingOrderIdInSidebar(orderId);
                              setEditOrderModeInSidebar("delivery");
                              setShowEditOrderSidebar(true);
                            }
                          },
                        },
                      ]
                    : []),
                  {
                    label: "Edit all properties (full page)",
                    onClick: () => {
                      const orderId =
                        selectedOrder?.id || selectedOrder?.rawData?.id;
                      if (orderId) router.push(`/crm/orders/${orderId}/edit`);
                    },
                  },
                ],
                fields: [
                  {
                    label: "Order Number",
                    value:
                      selectedOrder?.order_number ||
                      `ORD-${selectedOrder?.id}` ||
                      "N/A",
                    copyable: true,
                  },
                  {
                    label: "Customer",
                    value: selectedOrder?.customer_name || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Phone",
                    value: selectedOrder?.customer_phone || "N/A",
                    type: "phone",
                    copyable: true,
                    externalLink: selectedOrder?.customer_phone
                      ? `tel:${selectedOrder.customer_phone}`
                      : undefined,
                  },
                  {
                    label: "Email",
                    value: selectedOrder?.customer_email || "N/A",
                    type: "email",
                    copyable: true,
                    externalLink: selectedOrder?.customer_email
                      ? `mailto:${selectedOrder.customer_email}`
                      : undefined,
                    show: !!selectedOrder?.customer_email,
                  },
                  {
                    label: "Stage",
                    value:
                      selectedOrder?.stage?.name ||
                      selectedOrder?.stage ||
                      "N/A",
                    type: "badge",
                    badgeVariant: "primary",
                  },
                  {
                    label: "Order Value",
                    value:
                      selectedOrder?.final_amount || selectedOrder?.total_amount
                        ? `${selectedOrder?.currency || "AED"} ${parseFloat(String(selectedOrder.final_amount || selectedOrder.total_amount)).toLocaleString()}`
                        : "N/A",
                    copyable: true,
                  },
                  {
                    label: "Order Date",
                    value:
                      selectedOrder?.order_date || selectedOrder?.created_at
                        ? formatCrmPreviewDate(
                            selectedOrder.order_date ||
                              selectedOrder.created_at,
                          ) || "N/A"
                        : "N/A",
                    type: "date",
                    show: !!(
                      selectedOrder?.order_date || selectedOrder?.created_at
                    ),
                  },
                  {
                    label: "Expected Delivery",
                    value: selectedOrder?.expected_delivery_date
                      ? formatCrmPreviewDate(
                          selectedOrder.expected_delivery_date,
                        ) || "N/A"
                      : "N/A",
                    type: "date",
                    show: !!selectedOrder?.expected_delivery_date,
                  },
                  {
                    label: "Approval Status",
                    value: selectedOrder?.order_approval_status || "N/A",
                    type: "badge",
                    badgeVariant:
                      selectedOrder?.order_approval_status?.toLowerCase() ===
                      "approved"
                        ? "success"
                        : selectedOrder?.order_approval_status?.toLowerCase() ===
                            "rejected"
                          ? "danger"
                          : "warning",
                    show: !!selectedOrder?.order_approval_status,
                  },
                  {
                    label: "Fulfillment Status",
                    value: selectedOrder?.fulfillment_status || "N/A",
                    type: "badge",
                    badgeVariant:
                      selectedOrder?.fulfillment_status
                        ?.toLowerCase()
                        ?.includes("completed") ||
                      selectedOrder?.fulfillment_status
                        ?.toLowerCase()
                        ?.includes("delivered")
                        ? "success"
                        : selectedOrder?.fulfillment_status
                              ?.toLowerCase()
                              ?.includes("progress")
                          ? "primary"
                          : "secondary",
                    show: !!selectedOrder?.fulfillment_status,
                  },
                  {
                    label: "Payment Status",
                    value: selectedOrder?.payment_status || "N/A",
                    type: "badge",
                    badgeVariant:
                      selectedOrder?.payment_status?.toLowerCase() === "paid"
                        ? "success"
                        : selectedOrder?.payment_status?.toLowerCase() ===
                            "partial"
                          ? "warning"
                          : "danger",
                    show: !!selectedOrder?.payment_status,
                  },
                ],
              },
              {
                id: "recent-activities",
                title: "Recent activities",
                icon: History,
                collapsible: true,
                defaultExpanded: true,
                count: Array.isArray(selectedOrder?.audit_trail)
                  ? selectedOrder.audit_trail.length
                  : 0,
                emptyState: {
                  icon: History,
                  message: "No recent activities for this order.",
                  action: {
                    label: "Log activity",
                    onClick: () => console.log("Log activity"),
                  },
                },
              },
              {
                id: "call-recordings",
                title: "Call Recordings",
                icon: PhoneIcon,
                collapsible: true,
                defaultExpanded: true,
                count: 0,               
                emptyState: {
                  icon: PhoneIcon,
                  message: "No call recordings available yet.",
                  action: {
                    label: "Make a call",
                    onClick: () => 
                      selectedOrder?.customer_phone &&
                      handleCallClick(selectedOrder),                      
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
              },
            ]}
          />
        )}
        {sidebarLogActivityModals.modals}
      </div>

      {/* Delete Order Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDeleteOrder}
        itemName={orderToDelete?.orderNumber}
        itemType="order"
      />

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />

      {/* Delete Attachment Modal */}
      <DeleteConfirmationModal
        show={showDeleteAttachmentModal}
        onHide={() => {
          setShowDeleteAttachmentModal(false);
          setAttachmentToDelete(null);
        }}
        onConfirm={confirmDeleteAttachment}
        itemName={attachmentToDelete?.name}
        itemType="attachment"
      />

      {/* Column Editor Modal */}
      <CrmListColumnEditorModal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        columns={ordersColumns.map((c) => ({ key: c.key, label: c.label }))}
        selectedColumnKeys={selectedOrdersColumns}
        storageKey="ordersSelectedColumns"
        onSelectedKeysChange={setSelectedOrdersColumns}
      />

      {/* Export Modal */}
      <CrmExportModal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        title="Export Orders"
        subtitle="Choose filters to define which orders are exported. Defaults match your current table view."
        fileNameValue={exportFileName}
        onFileNameChange={setExportFileName}
        fileNamePlaceholder={`orders_${moment().format("YYYY-MM-DD")}`}
        onExportClick={handleOrdersExport}
        exporting={exporting}
        exportButtonLabel="Export"
      >
        <hr />
        <h6 className="mb-3">Export filters</h6>
        <Row>
          <Col md={6}>
            <CrmListExportModalAssignedToSelect
              extensions={extensions}
              value={
                exportFilters.user_extension_filter != null &&
                exportFilters.user_extension_filter !== ""
                  ? String(exportFilters.user_extension_filter)
                  : undefined
              }
              setExportFilters={setExportFilters}
              styles={customSelectStyles}
            />
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Order Stage</Form.Label>
              <Form.Select
                value={exportFilters.order_stage_id || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setExportFilters((prev) => {
                    const next = { ...prev };
                    if (v) next.order_stage_id = v;
                    else delete next.order_stage_id;
                    return next;
                  });
                }}
              >
                <option value="">All stages</option>
                {stages.map((stage: any) => (
                  <option key={stage.id} value={String(stage.id)}>
                    {stage.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Industry</Form.Label>
              <Form.Select
                value={exportFilters.industry || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setExportFilters((prev) => {
                    const next = { ...prev };
                    if (v) next.industry = v;
                    else delete next.industry;
                    return next;
                  });
                }}
              >
                <option value="">All industries</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date from</Form.Label>
              <Form.Control
                type="date"
                value={exportFilters.date_from || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setExportFilters((prev) => {
                    const next = { ...prev };
                    if (v) next.date_from = v;
                    else delete next.date_from;
                    return next;
                  });
                }}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date to</Form.Label>
              <Form.Control
                type="date"
                value={exportFilters.date_to || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setExportFilters((prev) => {
                    const next = { ...prev };
                    if (v) next.date_to = v;
                    else delete next.date_to;
                    return next;
                  });
                }}
              />
            </Form.Group>
          </Col>
        </Row>
      </CrmExportModal>

      {/* Filters Sidebar */}
      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={() => setShowFiltersSidebar(false)}
        title="Filters"
        subtitle="Filter and refine your orders"
        width="400px"
        filters={[
          {
            id: "assignedTo",
            label: "Owner",
            type: "select" as const,
            value: ordersFilters.assignedTo
              ? (() => {
                  const assignedToId = ordersFilters.assignedTo;
                  const ext = extensions.find(
                    (e: any) => (e.id || e.extension) === assignedToId,
                  );
                  return ext
                    ? {
                        value: assignedToId,
                        label: ext.display_name || ext.name || assignedToId,
                      }
                    : { value: assignedToId, label: assignedToId };
                })()
              : null,
            onChange: (selected) => {
              const assignedToValue = selected ? selected.value : null;
              setOrdersFilters((prev) => ({
                ...prev,
                assignedTo: assignedToValue,
              }));
              setActiveFilter("all");
            },
            options: extensions.map((ext: any) => ({
              value: ext.id || ext.extension,
              label: ext.display_name || ext.name || ext.id || ext.extension,
            })),
            placeholder: "Select user...",
            isClearable: true,
            styles: customSelectStyles,
          },
          {
            id: "stage",
            label: "Order Stage",
            type: "select" as const,
            value: ordersFilters.stage
              ? (() => {
                  const stageId = ordersFilters.stage;
                  const stage = stages.find(
                    (st: any) => st.id.toString() === stageId,
                  );
                  return stage
                    ? { value: stageId, label: stage.name }
                    : { value: stageId, label: stageId };
                })()
              : null,
            onChange: (selected) => {
              const stageValue = selected ? selected.value : null;
              setOrdersFilters((prev) => ({
                ...prev,
                stage: stageValue,
              }));
              if (stageValue) {
                setActiveFilter(stageValue);
              } else {
                setActiveFilter("all");
              }
            },
            options: stages.map((s) => ({
              value: s.id.toString(),
              label: s.name,
            })),
            placeholder: "Select stage...",
            isClearable: true,
            styles: customSelectStyles,
          },
          {
            id: "industry",
            label: "Industry",
            type: "dropdown" as const,
            value: ordersFilters.industry || "",
            onChange: (value) =>
              setOrdersFilters((prev) => ({ ...prev, industry: value })),
            options: [
              { value: "", label: "Select Industry" },
              { value: "Technology", label: "Technology" },
              { value: "Healthcare", label: "Healthcare" },
              { value: "Finance", label: "Finance" },
              {
                value: "Banking & Financial Services",
                label: "Banking & Financial Services",
              },
              { value: "Manufacturing", label: "Manufacturing" },
              { value: "Retail", label: "Retail" },
              { value: "Education", label: "Education" },
              { value: "Real Estate", label: "Real Estate" },
              { value: "Telecommunications", label: "Telecommunications" },
              { value: "Construction", label: "Construction" },
              { value: "Other", label: "Other" },
            ],
          },
          {
            id: "orderValueMin",
            label: "Order Value Min",
            type: "text" as const,
            value: ordersFilters.orderValueMin || "",
            onChange: (value) =>
              setOrdersFilters((prev) => ({ ...prev, orderValueMin: value })),
            placeholder: "0.00",
          },
          {
            id: "orderValueMax",
            label: "Order Value Max",
            type: "text" as const,
            value: ordersFilters.orderValueMax || "",
            onChange: (value) =>
              setOrdersFilters((prev) => ({ ...prev, orderValueMax: value })),
            placeholder: "0.00",
          },
          {
            id: "orderApprovalStatus",
            label: "Order Approval Status",
            type: "dropdown" as const,
            value: ordersFilters.orderApprovalStatus || "",
            onChange: (value) =>
              setOrdersFilters((prev) => ({
                ...prev,
                orderApprovalStatus: value,
              })),
            options: [
              { value: "", label: "Select Status" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ],
          },
          {
            id: "fulfillmentStatus",
            label: "Fulfillment Status",
            type: "dropdown" as const,
            value: ordersFilters.fulfillmentStatus || "",
            onChange: (value) =>
              setOrdersFilters((prev) => ({
                ...prev,
                fulfillmentStatus: value,
              })),
            options: [
              { value: "", label: "Select Status" },
              { value: "pending", label: "Pending" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
          {
            id: "paymentStatus",
            label: "Payment Status",
            type: "dropdown" as const,
            value: ordersFilters.paymentStatus || "",
            onChange: (value) =>
              setOrdersFilters((prev) => ({ ...prev, paymentStatus: value })),
            options: [
              { value: "", label: "Select Status" },
              { value: "unpaid", label: "Unpaid" },
              { value: "partial", label: "Partial" },
              { value: "paid", label: "Paid" },
              { value: "refunded", label: "Refunded" },
            ],
          },
          {
            id: "dateFrom",
            label: "Date From",
            type: "date" as const,
            value: ordersFilters.dateFrom || "",
            onChange: (value) =>
              setOrdersFilters((prev) => ({ ...prev, dateFrom: value })),
          },
          {
            id: "dateTo",
            label: "Date To",
            type: "date" as const,
            value: ordersFilters.dateTo || "",
            onChange: (value) =>
              setOrdersFilters((prev) => ({ ...prev, dateTo: value })),
          },
        ]}
        onApply={() => {
          // Map ordersFilters to the format expected by handleFiltersChange
          const filtersToApply: Record<string, any> = {};

          if (ordersSearch) {
            filtersToApply.search = ordersSearch;
          }
          if (ordersFilters.assignedTo) {
            filtersToApply.user_extension_filter = ordersFilters.assignedTo;
          }
          if (ordersFilters.stage) {
            filtersToApply.order_stage_id = ordersFilters.stage;
          }
          if (ordersFilters.industry) {
            filtersToApply.industry = ordersFilters.industry;
          }
          if (ordersFilters.orderValueMin) {
            filtersToApply.order_value_min = ordersFilters.orderValueMin;
          }
          if (ordersFilters.orderValueMax) {
            filtersToApply.order_value_max = ordersFilters.orderValueMax;
          }
          if (ordersFilters.orderApprovalStatus) {
            filtersToApply.order_approval_status =
              ordersFilters.orderApprovalStatus;
          }
          if (ordersFilters.fulfillmentStatus) {
            filtersToApply.fulfillment_status = ordersFilters.fulfillmentStatus;
          }
          if (ordersFilters.paymentStatus) {
            filtersToApply.payment_status = ordersFilters.paymentStatus;
          }
          if (ordersFilters.dateFrom) {
            filtersToApply.date_from = ordersFilters.dateFrom;
          }
          if (ordersFilters.dateTo) {
            filtersToApply.date_to = ordersFilters.dateTo;
          }

          handleFiltersChange(filtersToApply);
          setOrdersPagination({ ...ordersPagination, currentPage: 1 });
          setRefreshKey((prev) => prev + 1);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setOrdersSearch("");
          setOrdersFilters({
            assignedTo: null,
            stage: null,
            industry: null,
            orderValueMin: null,
            orderValueMax: null,
            orderApprovalStatus: null,
            fulfillmentStatus: null,
            paymentStatus: null,
            ticketId: null,
            dealId: null,
            dateFrom: null,
            dateTo: null,
          });
          handleFiltersChange({});
          setCurrentFilters({});
          setActiveFilter("all");
          setOrdersPagination({ ...ordersPagination, currentPage: 1 });
          setRefreshKey((prev) => prev + 1);
        }}
        showApplyButton={true}
        showResetButton={true}
      />

      {/* Mark Order Lost Modal */}
      <FormModal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
        title="Mark order as lost"
        desc="Please fill in the details below to mark the order as lost."
        size="lg"
        formHtml={
          <>
            <Form.Group className="mb-3">
              <Form.Label>Lost Reason *</Form.Label>
              <Form.Select
                value={lostReasonId || ""}
                onChange={(e) =>
                  setLostReasonId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                required
              >
                <option value="">Select a reason</option>
                {lostReasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Additional Feedback *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={lostFeedback}
                onChange={(e) => setLostFeedback(e.target.value)}
                placeholder="Please provide additional feedback about why this order was lost..."
                required
              />
            </Form.Group>
          </>
        }
        onSubmit={handleMarkLostSubmit}
        onCancel={() => setShowMarkLostModal(false)}
        submitButtonText="Mark Lost Reason"
        cancelButtonText="Cancel"
        isSubmitDisabled={!lostReasonId || !lostFeedback.trim()}
      />

      {/* Order View Modal */}
      {viewingOrder && (
        <Modal
          show={showOrderViewModal}
          onHide={() => setShowOrderViewModal(false)}
          size="xl"
          centered
          className="order-view-modal"
        >
          {/* Modern Header with Gradient */}
          <div
            style={{
              background: "#fff",
              color: "black",
              padding: "24px 32px",
              position: "relative",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              borderBottom: "1px solid #ccc",
            }}
          >
            <button
              onClick={() => setShowOrderViewModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "black",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <X size={18} />
            </button>

            {/* Header Content */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  background: "#f59e0b",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: "700",
                  flexShrink: 0,
                  color: "#fff",
                }}
              >
                <ShoppingBag size={32} style={{ color: "white" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "26px",
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {viewingOrder.order_number || `Order #${viewingOrder.id}`}
                </h2>
                <div
                  style={{
                    marginTop: "6px",
                    opacity: 0.95,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    color: "#000",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Target size={14} />
                    {viewingOrder.stage?.name || "No stage"}
                  </span>
                  <span>•</span>
                  <span style={{ fontWeight: 600 }}>
                    {viewingOrder.currency || "AED"}{" "}
                    {parseFloat(
                      viewingOrder.final_amount ||
                        viewingOrder.total_amount ||
                        "0",
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    {viewingOrder.order_date
                      ? formatCrmPreviewDate(viewingOrder.order_date) || "N/A"
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Modal.Body
            style={{
              padding: 0,
              maxHeight: "calc(90vh - 200px)",
              overflowY: "auto",
            }}
          >
            {loadingOrder ? (
              <div
                style={{
                  padding: "48px 20px",
                  textAlign: "center",
                }}
              >
                <Spinner
                  animation="border"
                  variant="primary"
                  size="sm"
                  style={{ marginBottom: "12px" }}
                />
                <p
                  className="mb-0"
                  style={{ color: "#6b7280", fontSize: "14px" }}
                >
                  Loading order details...
                </p>
              </div>
            ) : (
              <>
                <style>{`
            .order-detail-filter-buttons {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 0;
              padding: 0;
              width: 100%;
            }

            .order-detail-filter-button {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 20px;
              border-radius: 8px;
              border: 1px solid;
              font-weight: 500;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s ease;
              background: white;
              white-space: nowrap;
            }

            .order-detail-filter-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .order-detail-filter-button.active {
              color: white;
            }

            .order-detail-filter-button.active .filter-icon {
              color: white;
            }

            .order-detail-filter-button:not(.active) .filter-icon {
              color: inherit;
            }

            .filter-icon {
              width: 18px;
              height: 18px;
              flex-shrink: 0;
            }
          `}</style>

                {/* Main Content Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 360px",
                    minHeight: "500px",
                  }}
                >
                  {/* Left Panel - Main Information */}
                  <div
                    style={{
                      padding: "32px",
                      borderRight: "1px solid #e5e7eb",
                    }}
                  >
                    {/* Tabs Navigation */}
                    <div className="order-detail-filter-buttons mb-4">
                      <button
                        className={`order-detail-filter-button ${activeTab === "tab1" ? "active" : ""}`}
                        onClick={() => setActiveTab("tab1")}
                        style={{
                          backgroundColor:
                            activeTab === "tab1" ? "#f59e0b" : "white",
                          borderColor: "#f59e0b",
                          color: activeTab === "tab1" ? "white" : "#f59e0b",
                        }}
                      >
                        <ShoppingBag className="filter-icon" size={18} />
                        <span>General Information</span>
                      </button>
                      <button
                        className={`order-detail-filter-button ${activeTab === "tab2" ? "active" : ""}`}
                        onClick={() => setActiveTab("tab2")}
                        style={{
                          backgroundColor:
                            activeTab === "tab2" ? "#f59e0b" : "white",
                          borderColor: "#f59e0b",
                          color: activeTab === "tab2" ? "white" : "#f59e0b",
                        }}
                      >
                        <FileText className="filter-icon" size={18} />
                        <span>Lead/Deal Information</span>
                      </button>
                      <button
                        className={`order-detail-filter-button ${activeTab === "additional-info" ? "active" : ""}`}
                        onClick={() => setActiveTab("additional-info")}
                        style={{
                          backgroundColor:
                            activeTab === "additional-info"
                              ? "#f59e0b"
                              : "white",
                          borderColor: "#f59e0b",
                          color:
                            activeTab === "additional-info"
                              ? "white"
                              : "#f59e0b",
                        }}
                      >
                        <Info className="filter-icon" size={18} />
                        <span>Additional Information</span>
                      </button>
                      <button
                        className={`order-detail-filter-button ${activeTab === "history" ? "active" : ""}`}
                        onClick={() => setActiveTab("history")}
                        style={{
                          backgroundColor:
                            activeTab === "history" ? "#f59e0b" : "white",
                          borderColor: "#f59e0b",
                          color: activeTab === "history" ? "white" : "#f59e0b",
                        }}
                      >
                        <History className="filter-icon" size={18} />
                        <span>History</span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "tab1" && (
                      <div>
                        {/* Quick Info Cards */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "16px",
                            marginBottom: "28px",
                          }}
                        >
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 16px rgba(245, 158, 11, 0.15)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background:
                                    viewingOrder.stage?.color || "#6c757d",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Target size={20} style={{ color: "white" }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Stage
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingOrder.stage?.name || "Not assigned"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 16px rgba(245, 158, 11, 0.15)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background:
                                    viewingOrder.status?.toLowerCase() ===
                                    "completed"
                                      ? "#10b981"
                                      : viewingOrder.status?.toLowerCase() ===
                                          "pending"
                                        ? "#f59e0b"
                                        : "#6c757d",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <CheckCircle
                                  size={20}
                                  style={{ color: "white" }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Status
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingOrder.status || "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 16px rgba(245, 158, 11, 0.15)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: "#10b981",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <DollarSign
                                  size={20}
                                  style={{ color: "white" }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#10b981",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Final Amount
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingOrder.currency || "AED"}{" "}
                                  {parseFloat(
                                    viewingOrder.final_amount ||
                                      viewingOrder.total_amount ||
                                      "0",
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 16px rgba(245, 158, 11, 0.15)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: "#3b82f6",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Calendar
                                  size={20}
                                  style={{ color: "white" }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#3b82f6",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Order Date
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingOrder.order_date
                                    ? formatCrmPreviewDate(
                                        viewingOrder.order_date,
                                      ) || "N/A"
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Information Section */}
                        <div style={{ marginBottom: "28px" }}>
                          <h5
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#1f2937",
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "4px",
                                height: "18px",
                                background:
                                  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Order Details
                          </h5>
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "20px",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "140px 1fr",
                                gap: "16px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  color: "#6b7280",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                }}
                              >
                                <ShoppingBag
                                  size={16}
                                  style={{ color: "#f59e0b" }}
                                />
                                Order Number
                              </div>
                              <div
                                style={{
                                  color: "#1f2937",
                                  fontSize: "15px",
                                  fontWeight: 500,
                                }}
                              >
                                {viewingOrder.order_number ||
                                  `ORD-${viewingOrder.id}`}
                              </div>

                              {viewingOrder.expected_delivery_date && (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      color: "#6b7280",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <Calendar
                                      size={16}
                                      style={{ color: "#f59e0b" }}
                                    />
                                    Expected Delivery
                                  </div>
                                  <div
                                    style={{
                                      color: "#1f2937",
                                      fontSize: "15px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {formatCrmPreviewDate(
                                      viewingOrder.expected_delivery_date,
                                    )}
                                  </div>
                                </>
                              )}

                              {viewingOrder.industry && (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      color: "#6b7280",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <Building2
                                      size={16}
                                      style={{ color: "#f59e0b" }}
                                    />
                                    Industry
                                  </div>
                                  <div
                                    style={{
                                      color: "#1f2937",
                                      fontSize: "15px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {viewingOrder.industry}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Company Information Section */}
                        <div style={{ marginBottom: "28px" }}>
                          <h5
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#1f2937",
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "4px",
                                height: "18px",
                                background:
                                  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Company Information
                          </h5>
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "20px",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "16px 24px",
                              }}
                            >
                              {viewingOrder.customer_name && (
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Company Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "50%",
                                        backgroundColor: getRandomColor(
                                          viewingOrder.customer_name,
                                        ),
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "10px",
                                        fontWeight: "600",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {getInitials(viewingOrder.customer_name)}
                                    </div>
                                    <span>{viewingOrder.customer_name}</span>
                                  </div>
                                </div>
                              )}
                              {viewingOrder.customer_email && (
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Email
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <Mail
                                      size={14}
                                      style={{
                                        color: "#f59e0b",
                                        marginRight: "6px",
                                        display: "inline",
                                      }}
                                    />
                                    {viewingOrder.customer_email}
                                  </div>
                                </div>
                              )}
                              {viewingOrder.customer_phone && (
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Phone
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <PhoneDisplay
                                      phone={viewingOrder.customer_phone || ""}
                                    />
                                  </div>
                                </div>
                              )}
                              {viewingOrder.customer_address && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Address
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {viewingOrder.customer_address}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Items/Products */}
                        {viewingOrder.items &&
                          Array.isArray(viewingOrder.items) &&
                          viewingOrder.items.length > 0 && (
                            <div style={{ marginBottom: "28px" }}>
                              <h5
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 700,
                                  color: "#1f2937",
                                  marginBottom: "16px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "4px",
                                    height: "18px",
                                    background:
                                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                    borderRadius: "2px",
                                  }}
                                />
                                Order Items
                                <Badge
                                  bg="secondary"
                                  style={{
                                    marginLeft: "8px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  {viewingOrder.items.length}
                                </Badge>
                              </h5>
                              <div
                                style={{
                                  background: "white",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "12px",
                                  overflow: "hidden",
                                }}
                              >
                                <div style={{ overflowX: "auto" }}>
                                  <Table
                                    hover
                                    style={{
                                      width: "100%",
                                      marginBottom: 0,
                                      tableLayout: "auto",
                                    }}
                                  >
                                    <thead style={{ background: "#f9fafb" }}>
                                      <tr>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          #
                                        </th>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          Product Name
                                        </th>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          SKU
                                        </th>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          Quantity
                                        </th>
                                        {viewingOrder.items.some(
                                          (item: any) => item.description,
                                        ) && (
                                          <th
                                            style={{
                                              padding: "12px 16px",
                                              fontSize: "11px",
                                              fontWeight: 700,
                                              color: "#6b7280",
                                              textTransform: "uppercase",
                                              letterSpacing: "0.5px",
                                            }}
                                          >
                                            Description
                                          </th>
                                        )}
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          Unit Price
                                        </th>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          Total Price
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {viewingOrder.items.map(
                                        (item: any, index: number) => (
                                          <tr
                                            key={item.id || index}
                                            style={{
                                              borderBottom: "1px solid #f3f4f6",
                                            }}
                                          >
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                              }}
                                            >
                                              {index + 1}
                                            </td>
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                                fontWeight: 600,
                                              }}
                                            >
                                              {item.product_name ||
                                                item.product?.name ||
                                                "N/A"}
                                            </td>
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#6b7280",
                                              }}
                                            >
                                              {item.product?.sku || "N/A"}
                                            </td>
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                              }}
                                            >
                                              {item.quantity || "0"}
                                            </td>
                                            {viewingOrder.items.some(
                                              (i: any) => i.description,
                                            ) && (
                                              <td
                                                style={{
                                                  padding: "14px 16px",
                                                  fontSize: "13px",
                                                  color: "#6b7280",
                                                  maxWidth: "200px",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {item.description || "-"}
                                              </td>
                                            )}
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                              }}
                                            >
                                              {viewingOrder.currency || "AED"}{" "}
                                              {parseFloat(
                                                item.unit_price || "0",
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                                fontWeight: 600,
                                              }}
                                            >
                                              {viewingOrder.currency || "AED"}{" "}
                                              {parseFloat(
                                                item.total_price || "0",
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                    <tfoot
                                      style={{
                                        background: "#f9fafb",
                                        fontWeight: 600,
                                      }}
                                    >
                                      <tr>
                                        <td
                                          colSpan={
                                            viewingOrder.items.some(
                                              (item: any) => item.description,
                                            )
                                              ? 6
                                              : 5
                                          }
                                          style={{
                                            padding: "12px 16px",
                                            textAlign: "right",
                                            fontSize: "13px",
                                            color: "#6b7280",
                                          }}
                                        >
                                          Subtotal:
                                        </td>
                                        <td
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "13px",
                                            color: "#1f2937",
                                          }}
                                        >
                                          {viewingOrder.currency || "AED"}{" "}
                                          {parseFloat(
                                            viewingOrder.total_amount || "0",
                                          ).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                        </td>
                                      </tr>
                                      {viewingOrder.discount_amount &&
                                        parseFloat(
                                          viewingOrder.discount_amount,
                                        ) > 0 && (
                                          <tr>
                                            <td
                                              colSpan={
                                                viewingOrder.items.some(
                                                  (item: any) =>
                                                    item.description,
                                                )
                                                  ? 6
                                                  : 5
                                              }
                                              style={{
                                                padding: "12px 16px",
                                                textAlign: "right",
                                                fontSize: "13px",
                                                color: "#6b7280",
                                              }}
                                            >
                                              Discount:
                                            </td>
                                            <td
                                              style={{
                                                padding: "12px 16px",
                                                fontSize: "13px",
                                                color: "#dc2626",
                                              }}
                                            >
                                              - {viewingOrder.currency || "AED"}{" "}
                                              {parseFloat(
                                                viewingOrder.discount_amount,
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                          </tr>
                                        )}
                                      {viewingOrder.tax_amount &&
                                        parseFloat(viewingOrder.tax_amount) >
                                          0 && (
                                          <tr>
                                            <td
                                              colSpan={
                                                viewingOrder.items.some(
                                                  (item: any) =>
                                                    item.description,
                                                )
                                                  ? 6
                                                  : 5
                                              }
                                              style={{
                                                padding: "12px 16px",
                                                textAlign: "right",
                                                fontSize: "13px",
                                                color: "#6b7280",
                                              }}
                                            >
                                              Tax:
                                            </td>
                                            <td
                                              style={{
                                                padding: "12px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                              }}
                                            >
                                              {viewingOrder.currency || "AED"}{" "}
                                              {parseFloat(
                                                viewingOrder.tax_amount,
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                          </tr>
                                        )}
                                      <tr style={{ fontSize: "16px" }}>
                                        <td
                                          colSpan={
                                            viewingOrder.items.some(
                                              (item: any) => item.description,
                                            )
                                              ? 6
                                              : 5
                                          }
                                          style={{
                                            padding: "12px 16px",
                                            textAlign: "right",
                                            fontSize: "14px",
                                            color: "#1f2937",
                                            fontWeight: 700,
                                          }}
                                        >
                                          Total:
                                        </td>
                                        <td
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "14px",
                                            color: "#1f2937",
                                            fontWeight: 700,
                                          }}
                                        >
                                          {viewingOrder.currency || "AED"}{" "}
                                          {parseFloat(
                                            viewingOrder.final_amount ||
                                              viewingOrder.total_amount ||
                                              "0",
                                          ).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {activeTab === "tab2" && (
                      <div>
                        {/* Deal Information */}
                        {relatedDeal && (
                          <div style={{ marginBottom: "28px" }}>
                            <h5
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "#1f2937",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "4px",
                                  height: "18px",
                                  background:
                                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                  borderRadius: "2px",
                                }}
                              />
                              Deal Information
                            </h5>
                            <div
                              style={{
                                background: "#f9fafb",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "20px",
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Deal Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {relatedDeal.name || "N/A"}
                                  </div>
                                </div>
                                {relatedDeal.stage && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Stage
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Badge
                                        style={{
                                          padding: "6px 14px",
                                          borderRadius: "20px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          backgroundColor:
                                            relatedDeal.stage?.color ||
                                            "#6c757d",
                                        }}
                                      >
                                        {relatedDeal.stage?.name ||
                                          "Not assigned"}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                {relatedDeal.net_value && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Deal Value
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {relatedDeal.currency || "AED"}{" "}
                                      {parseFloat(
                                        String(
                                          relatedDeal.net_value ||
                                            relatedDeal.grand_total ||
                                            0,
                                        ),
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                )}
                                {relatedDeal.assigned_to && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Owner
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <User
                                        size={14}
                                        style={{
                                          color: "#f59e0b",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
                                      {extensions.find(
                                        (ext: any) =>
                                          ext?.id == relatedDeal?.assigned_to ||
                                          ext?.extension ==
                                            relatedDeal?.assigned_to,
                                      )?.display_name ||
                                        extensions.find(
                                          (ext: any) =>
                                            ext?.id ==
                                              relatedDeal?.assigned_to ||
                                            ext?.extension ==
                                              relatedDeal?.assigned_to,
                                        )?.name ||
                                        relatedDeal.assigned_to ||
                                        "Not assigned"}
                                    </div>
                                  </div>
                                )}
                                {relatedDeal.created_at && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Created Date
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Calendar
                                        size={14}
                                        style={{
                                          color: "#f59e0b",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
                                      {relatedDeal.created_at
                                        ? formatDateForTable(
                                            relatedDeal.created_at,
                                          )
                                        : "N/A"}
                                    </div>
                                  </div>
                                )}
                                {relatedDeal.company_name && (
                                  <div style={{ gridColumn: "1 / -1" }}>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Company Name
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Building2
                                        size={14}
                                        style={{
                                          color: "#f59e0b",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
                                      {relatedDeal.company_name}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Lead Information */}
                        {relatedLead && (
                          <div style={{ marginBottom: "28px" }}>
                            <h5
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "#1f2937",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "4px",
                                  height: "18px",
                                  background:
                                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                  borderRadius: "2px",
                                }}
                              />
                              Lead Information
                            </h5>
                            <div
                              style={{
                                background: "#f9fafb",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "20px",
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Lead Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {relatedLead.name}
                                  </div>
                                </div>
                                {relatedLead.stage && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Stage
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Badge
                                        style={{
                                          padding: "6px 14px",
                                          borderRadius: "20px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          backgroundColor:
                                            relatedLead.stage?.color ||
                                            "#6c757d",
                                        }}
                                      >
                                        {relatedLead.stage?.name ||
                                          "Not assigned"}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                {relatedLead.lead_potential && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Lead Potential
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Badge
                                        bg={
                                          relatedLead.lead_potential === "Hot"
                                            ? "danger"
                                            : relatedLead.lead_potential ===
                                                "Warm"
                                              ? "warning"
                                              : "secondary"
                                        }
                                        style={{
                                          padding: "6px 14px",
                                          borderRadius: "20px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {relatedLead.lead_potential || "N/A"}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                {relatedLead.user_extension && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Owner
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <User
                                        size={14}
                                        style={{
                                          color: "#f59e0b",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
                                      {extensions.find(
                                        (ext: any) =>
                                          ext?.id ==
                                            relatedLead?.user_extension ||
                                          ext?.extension ==
                                            relatedLead?.user_extension,
                                      )?.display_name ||
                                        extensions.find(
                                          (ext: any) =>
                                            ext?.id ==
                                              relatedLead?.user_extension ||
                                            ext?.extension ==
                                              relatedLead?.user_extension,
                                        )?.name ||
                                        relatedLead.user_extension ||
                                        "Not assigned"}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Campaign Information */}
                        {relatedLead?.campaign && (
                          <div style={{ marginBottom: "28px" }}>
                            <h5
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "#1f2937",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "4px",
                                  height: "18px",
                                  background:
                                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                  borderRadius: "2px",
                                }}
                              />
                              Campaign Information
                            </h5>
                            <div
                              style={{
                                background: "#f9fafb",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "20px",
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Campaign Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {relatedLead.campaign.name}
                                  </div>
                                </div>
                                {relatedLead.campaign_field_values &&
                                  Object.keys(relatedLead.campaign_field_values)
                                    .length > 0 &&
                                  Object.entries(
                                    relatedLead.campaign_field_values,
                                  ).map(([key, value]: [string, any]) => (
                                    <div key={key}>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          fontWeight: 700,
                                          color: "#6b7280",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.5px",
                                          marginBottom: "6px",
                                        }}
                                      >
                                        {key}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          color: "#1f2937",
                                          fontWeight: 500,
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {String(value)}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Prospect Information */}
                        {relatedLead?.crm_data && (
                          <div style={{ marginBottom: "28px" }}>
                            <h5
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "#1f2937",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "4px",
                                  height: "18px",
                                  background:
                                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                  borderRadius: "2px",
                                }}
                              />
                              Prospect Information
                            </h5>
                            <div
                              style={{
                                background: "#f9fafb",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "20px",
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                {relatedLead.crm_data.id && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      CRM Data ID
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      #{relatedLead.crm_data.id}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {relatedLead.crm_data.name ||
                                      (relatedLead.crm_data.data &&
                                        relatedLead.crm_data.data.name) ||
                                      "N/A"}
                                  </div>
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Phone
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <PhoneDisplay
                                      phone={
                                        relatedLead.crm_data.phone ||
                                        (relatedLead.crm_data.data &&
                                          relatedLead.crm_data.data.phone) ||
                                        ""
                                      }
                                    />
                                  </div>
                                </div>
                                {relatedLead.crm_data.source_file && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Source File
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {relatedLead.crm_data.source_file}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "additional-info" && (
                      <div>
                        {/* Additional Information Section */}
                        <div style={{ marginBottom: "28px" }}>
                          <h5
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#1f2937",
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "4px",
                                height: "18px",
                                background:
                                  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Additional Information
                          </h5>
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "20px",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "16px 24px",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: "6px",
                                  }}
                                >
                                  Approval Status
                                </div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#1f2937",
                                    fontWeight: 500,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {viewingOrder.order_approval_status ? (
                                    <Badge
                                      bg={
                                        viewingOrder.order_approval_status?.toLowerCase() ===
                                        "approved"
                                          ? "success"
                                          : viewingOrder.order_approval_status?.toLowerCase() ===
                                              "rejected"
                                            ? "danger"
                                            : "warning"
                                      }
                                    >
                                      {viewingOrder.order_approval_status}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted">Not Set</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: "6px",
                                  }}
                                >
                                  Fulfillment Status
                                </div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#1f2937",
                                    fontWeight: 500,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {viewingOrder.fulfillment_status ? (
                                    <Badge
                                      bg={
                                        viewingOrder.fulfillment_status
                                          ?.toLowerCase()
                                          .includes("completed") ||
                                        viewingOrder.fulfillment_status
                                          ?.toLowerCase()
                                          .includes("delivered")
                                          ? "success"
                                          : viewingOrder.fulfillment_status
                                                ?.toLowerCase()
                                                .includes("progress")
                                            ? "primary"
                                            : "secondary"
                                      }
                                    >
                                      {viewingOrder.fulfillment_status}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted">Not Set</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: "6px",
                                  }}
                                >
                                  Payment Status
                                </div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#1f2937",
                                    fontWeight: 500,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {viewingOrder.payment_status ? (
                                    <Badge
                                      bg={
                                        viewingOrder.payment_status?.toLowerCase() ===
                                        "paid"
                                          ? "success"
                                          : viewingOrder.payment_status?.toLowerCase() ===
                                              "partial"
                                            ? "warning"
                                            : "danger"
                                      }
                                    >
                                      {viewingOrder.payment_status}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted">Not Set</span>
                                  )}
                                </div>
                              </div>
                              {viewingOrder.assigned_to && (
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Owner
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <User
                                      size={14}
                                      style={{
                                        color: "#f59e0b",
                                        marginRight: "6px",
                                        display: "inline",
                                      }}
                                    />
                                    {extensions.find(
                                      (ext: any) =>
                                        ext?.id == viewingOrder?.assigned_to ||
                                        ext?.extension ==
                                          viewingOrder?.assigned_to,
                                    )?.display_name ||
                                      extensions.find(
                                        (ext: any) =>
                                          ext?.id ==
                                            viewingOrder?.assigned_to ||
                                          ext?.extension ==
                                            viewingOrder?.assigned_to,
                                      )?.name ||
                                      viewingOrder.assigned_to ||
                                      "Not assigned"}
                                  </div>
                                </div>
                              )}
                              {viewingOrder.contract_length && (
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Contract Length
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {viewingOrder.contract_length}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {viewingOrder.notes && (
                          <div style={{ marginBottom: "28px" }}>
                            <h5
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "#1f2937",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "4px",
                                  height: "18px",
                                  background:
                                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                  borderRadius: "2px",
                                }}
                              />
                              Notes
                            </h5>
                            <div
                              style={{
                                background: "#fffbeb",
                                border: "1px solid #fcd34d",
                                borderRadius: "12px",
                                padding: "16px 20px",
                                fontSize: "14px",
                                color: "#78350f",
                                lineHeight: "1.6",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {viewingOrder.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "history" && (
                      <div>
                        {/* Activity History */}
                        {viewingOrder.histories &&
                        Array.isArray(viewingOrder.histories) &&
                        viewingOrder.histories.length > 0 ? (
                          <div style={{ marginBottom: "28px" }}>
                            <h5
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "#1f2937",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "4px",
                                  height: "18px",
                                  background:
                                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                  borderRadius: "2px",
                                }}
                              />
                              Activity History
                              <Badge
                                bg="secondary"
                                style={{
                                  marginLeft: "8px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                }}
                              >
                                {viewingOrder.histories.length}
                              </Badge>
                            </h5>
                            <div
                              style={{
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "20px",
                              }}
                            >
                              <div
                                style={{
                                  position: "relative",
                                  paddingLeft: "30px",
                                }}
                              >
                                <div
                                  style={{
                                    content: "",
                                    position: "absolute",
                                    left: "8px",
                                    top: 0,
                                    bottom: 0,
                                    width: "2px",
                                    background: "#e5e7eb",
                                  }}
                                />
                                {viewingOrder.histories.map(
                                  (history: any, idx: number) => (
                                    <div
                                      key={history.id || idx}
                                      style={{
                                        position: "relative",
                                        paddingBottom:
                                          idx <
                                          viewingOrder.histories.length - 1
                                            ? "20px"
                                            : "0",
                                      }}
                                    >
                                      <div
                                        style={{
                                          content: "",
                                          position: "absolute",
                                          left: "-26px",
                                          top: "4px",
                                          width: "12px",
                                          height: "12px",
                                          borderRadius: "50%",
                                          background:
                                            history.event === "created"
                                              ? "#10b981"
                                              : "#f59e0b",
                                          border: "3px solid white",
                                          boxShadow: "0 0 0 2px #e5e7eb",
                                        }}
                                      />
                                      <div
                                        style={{
                                          background: "#f9fafb",
                                          padding: "12px 16px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            color: "#6b7280",
                                            fontWeight: 600,
                                            marginBottom: "4px",
                                          }}
                                        >
                                          {new Date(
                                            history.created_at,
                                          ).toLocaleString()}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "14px",
                                            color: "#1f2937",
                                            marginBottom: "4px",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {history.event === "created"
                                            ? "Created"
                                            : history.event === "updated"
                                              ? "Updated"
                                              : history.event}
                                        </div>
                                        {history.description && (
                                          <div
                                            style={{
                                              fontSize: "13px",
                                              color: "#6b7280",
                                              marginBottom: "8px",
                                            }}
                                          >
                                            {history.description}
                                          </div>
                                        )}
                                        {history.changes &&
                                          Object.keys(history.changes).length >
                                            0 && (
                                            <div
                                              style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                              }}
                                            >
                                              {Object.entries(
                                                history.changes,
                                              ).map(
                                                ([key, change]: [
                                                  string,
                                                  any,
                                                ]) => {
                                                  if (
                                                    ignoredKeys.includes(key)
                                                  ) {
                                                    return null;
                                                  }
                                                  return (
                                                    <div
                                                      key={key}
                                                      style={{
                                                        marginTop: "4px",
                                                      }}
                                                    >
                                                      <strong>{key}:</strong>{" "}
                                                      {change.old
                                                        ? `${change.old} → `
                                                        : ""}
                                                      {change.new || "N/A"}
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: "40px",
                              textAlign: "center",
                              color: "#6b7280",
                              background: "#f9fafb",
                              border: "2px dashed #d1d5db",
                              borderRadius: "12px",
                            }}
                          >
                            <History
                              size={40}
                              style={{ marginBottom: "12px", opacity: 0.5 }}
                            />
                            <div style={{ fontSize: "14px", fontWeight: 500 }}>
                              No activity history found
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Panel - Quick Actions & Info */}
                  <div
                    style={{
                      padding: "32px 24px",
                      background: "#fafbfc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    {/* Quick Actions */}
                    <div>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Quick Actions
                      </h6>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {session?.user?.permissions?.includes(
                          "edit-crm-orders",
                        ) && (
                          <button
                            style={{
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "12px 16px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "#1f2937",
                            }}
                            onClick={() => {
                              setShowOrderViewModal(false);
                              window.location.href = `/crm/orders/${viewingOrder.id}/edit`;
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = "#f59e0b";
                              e.currentTarget.style.background = "#fffbeb";
                              e.currentTarget.style.transform =
                                "translateX(4px)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = "#e5e7eb";
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "#f59e0b",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Edit size={16} style={{ color: "white" }} />
                            </div>
                            Edit Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status Overview */}
                    <div>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Status Overview
                      </h6>
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Stage
                            </span>
                            <Badge
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "4px 10px",
                                borderRadius: "6px",
                                backgroundColor:
                                  viewingOrder.stage?.color || "#6c757d",
                              }}
                            >
                              {viewingOrder.stage?.name || "N/A"}
                            </Badge>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Status
                            </span>
                            <Badge
                              bg={
                                viewingOrder.status?.toLowerCase() ===
                                "completed"
                                  ? "success"
                                  : viewingOrder.status?.toLowerCase() ===
                                      "pending"
                                    ? "warning"
                                    : "secondary"
                              }
                              style={{ fontSize: "11px", padding: "4px 10px" }}
                            >
                              {viewingOrder.status || "N/A"}
                            </Badge>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Total Amount
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingOrder.currency || "AED"}{" "}
                              {parseFloat(
                                viewingOrder.final_amount ||
                                  viewingOrder.total_amount ||
                                  "0",
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Items
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingOrder.items?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div style={{ flex: 1 }}>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Order Summary
                      </h6>
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {viewingOrder.order_date && (
                            <div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  fontWeight: 600,
                                  marginBottom: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Order Date
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                }}
                              >
                                {formatCrmPreviewDate(viewingOrder.order_date)}
                              </div>
                            </div>
                          )}

                          {viewingOrder.expected_delivery_date && (
                            <div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  fontWeight: 600,
                                  marginBottom: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Expected Delivery
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                }}
                              >
                                {formatCrmPreviewDate(
                                  viewingOrder.expected_delivery_date,
                                )}
                              </div>
                            </div>
                          )}

                          {viewingOrder.payment_status && (
                            <div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  fontWeight: 600,
                                  marginBottom: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Payment Status
                              </div>
                              <Badge
                                bg={
                                  viewingOrder.payment_status?.toLowerCase() ===
                                  "paid"
                                    ? "success"
                                    : viewingOrder.payment_status?.toLowerCase() ===
                                        "partial"
                                      ? "warning"
                                      : "danger"
                                }
                                style={{
                                  fontSize: "11px",
                                  padding: "4px 10px",
                                }}
                              >
                                {viewingOrder.payment_status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>

          {/* Footer */}
          <div
            style={{
              padding: "20px 32px",
              borderTop: "1px solid #e5e7eb",
              background: "white",
              borderBottomLeftRadius: "12px",
              borderBottomRightRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              Order ID: <strong>#{viewingOrder.id}</strong>
            </div>
            <Button
              variant="outline-secondary"
              onClick={() => setShowOrderViewModal(false)}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                border: "2px solid #e5e7eb",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#f59e0b";
                e.currentTarget.style.color = "#f59e0b";
                e.currentTarget.style.background = "#fffbeb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#6c757d";
                e.currentTarget.style.background = "white";
              }}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* Manage Attachments Modal */}
      {selectedOrderForAttachments && (
        <Modal
          show={showAttachmentModal}
          onHide={() => {
            setShowAttachmentModal(false);
            setSelectedOrderForAttachments(null);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "40px",
                  height: "40px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <Paperclip size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 600 }}>
                  Manage Attachments
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6c757d",
                    fontWeight: "normal",
                  }}
                >
                  {selectedOrderForAttachments.order_number ||
                    selectedOrderForAttachments.name ||
                    `Order #${selectedOrderForAttachments.id}`}
                </div>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {/* Upload Section */}
            <div
              className="mb-4 p-4 border rounded"
              style={{ background: "#f8f9fa" }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="mb-1 fw-bold">Upload New Attachments</h6>
                  <small className="text-muted">
                    Supported formats: PDF, CSV, Excel, or Image (Max 5MB)
                  </small>
                </div>
              </div>
              <div className="d-flex gap-2">
                <Form.Control
                  ref={(input) => setFileInputRef(input as HTMLInputElement)}
                  type="file"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      handleFileUpload(file);
                    }
                  }}
                  accept=".pdf,.csv,.xls,.xlsx,.xlsm,.png,.jpg,.jpeg,.gif,.webp"
                  style={{ flex: 1 }}
                  disabled={uploadingFile}
                />
                <Button
                  variant="primary"
                  className="d-flex align-items-center gap-2"
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Attachments List */}
            <div>
              {/* Order Attachments Section */}
              <h6 className="mb-3 fw-bold d-flex align-items-center gap-2">
                <FileText size={18} />
                Order Attachments ({attachments.length})
              </h6>

              {loadingAttachments ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <Paperclip size={48} className="mb-3 opacity-25" />
                  <div>No order attachments yet</div>
                  <small>Upload files using the form above</small>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2 mb-4">
                  {attachments.map((attachment: any) => (
                    <Card key={attachment.id} className="border shadow-sm">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            {/* File Icon */}
                            <div
                              className="rounded d-flex align-items-center justify-content-center"
                              style={{
                                width: "45px",
                                height: "45px",
                                background: attachment.mime_type?.includes(
                                  "pdf",
                                )
                                  ? "#dc3545"
                                  : attachment.mime_type?.includes("csv") ||
                                      attachment.mime_type?.includes("excel") ||
                                      attachment.mime_type?.includes(
                                        "spreadsheet",
                                      )
                                    ? "#198754"
                                    : attachment.mime_type?.includes("image")
                                      ? "#0d6efd"
                                      : "#6c757d",
                                color: "white",
                              }}
                            >
                              <FileText size={22} />
                            </div>

                            {/* File Info */}
                            <div className="flex-grow-1">
                              <div
                                className="fw-semibold"
                                style={{ fontSize: "14px" }}
                              >
                                {attachment.name}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#6c757d" }}
                              >
                                {formatFileSize(attachment.file_size)} •{" "}
                                {attachment.created_at
                                  ? formatDateForTable(attachment.created_at)
                                  : "N/A"}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="d-flex gap-1">
                            <Button
                              variant="link"
                              size="sm"
                              className="p-2 text-primary"
                              title="Download"
                              onClick={() =>
                                handleDownloadAttachment(attachment.id)
                              }
                            >
                              <DownloadIcon size={18} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-2 text-danger"
                              title="Delete"
                              onClick={() => {
                                setAttachmentToDelete({
                                  id: attachment.id,
                                  name: attachment.name,
                                });
                                setShowDeleteAttachmentModal(true);
                              }}
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}

              {/* Deal Attachments Section */}
              {selectedOrderForAttachments?.deal_id && (
                <>
                  <h6 className="mb-3 fw-bold d-flex align-items-center gap-2 mt-4">
                    <FileText size={18} />
                    Deal Attachments ({dealAttachments.length})
                    <Badge
                      bg="secondary"
                      className="ms-2"
                      style={{ fontSize: "11px" }}
                    >
                      Read-only
                    </Badge>
                  </h6>

                  {loadingAttachments ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : dealAttachments.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <Paperclip size={48} className="mb-3 opacity-25" />
                      <div>No deal attachments</div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {dealAttachments.map((attachment: any) => (
                        <Card
                          key={`deal-${attachment.id}`}
                          className="border shadow-sm"
                          style={{ opacity: 0.9 }}
                        >
                          <Card.Body className="p-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-3 flex-grow-1">
                                {/* File Icon */}
                                <div
                                  className="rounded d-flex align-items-center justify-content-center"
                                  style={{
                                    width: "45px",
                                    height: "45px",
                                    background: attachment.mime_type?.includes(
                                      "pdf",
                                    )
                                      ? "#dc3545"
                                      : attachment.mime_type?.includes("csv") ||
                                          attachment.mime_type?.includes(
                                            "excel",
                                          ) ||
                                          attachment.mime_type?.includes(
                                            "spreadsheet",
                                          )
                                        ? "#198754"
                                        : attachment.mime_type?.includes(
                                              "image",
                                            )
                                          ? "#0d6efd"
                                          : "#6c757d",
                                    color: "white",
                                  }}
                                >
                                  <FileText size={22} />
                                </div>

                                {/* File Info */}
                                <div className="flex-grow-1">
                                  <div
                                    className="fw-semibold"
                                    style={{ fontSize: "14px" }}
                                  >
                                    {attachment.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#6c757d",
                                    }}
                                  >
                                    {formatFileSize(attachment.file_size)} •{" "}
                                    {attachment.created_at
                                      ? formatDateForTable(
                                          attachment.created_at,
                                        )
                                      : "N/A"}
                                  </div>
                                </div>
                              </div>

                              {/* Actions - Download only */}
                              <div className="d-flex gap-1">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-2 text-primary"
                                  title="Download"
                                  onClick={() =>
                                    handleDownloadDealAttachment(attachment.id)
                                  }
                                >
                                  <DownloadIcon size={18} />
                                </Button>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAttachmentModal(false);
                setSelectedOrderForAttachments(null);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Order Sidebar (Edit as Account / Edit as Delivery) */}
      {showEditOrderSidebar && editingOrderIdInSidebar != null && (
        <EditOrderSidebar
          onClose={() => {
            setShowEditOrderSidebar(false);
            setEditingOrderIdInSidebar(null);
          }}
          orderId={editingOrderIdInSidebar}
          editMode={editOrderModeInSidebar}
          onSuccess={() => setRefreshKey((prev) => prev + 1)}
        />
      )}

      {/* Add New Tab Modal */}
      <Modal show={showTabModal} onHide={() => setShowTabModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Tab</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Select a filter to add as a new tab</p>
          <div className="d-grid gap-2">
            <Button
              variant="outline-primary"
              onClick={() => {
                if (!customTabs.some((t) => t.id === "lost")) {
                  const nextTabs = [
                    ...customTabs,
                    {
                      id: "lost",
                      label: "Mark order as lost",
                      count: filterCounts.lost || 0,
                      removable: true,
                    },
                  ];
                  setCustomTabs(nextTabs);
                  setShowTabModal(false);
                  toast.success("Tab added successfully!");
                }
              }}
              disabled={customTabs.some((t) => t.id === "lost")}
              className="d-flex align-items-center justify-content-start"
              style={{ textAlign: "left" }}
            >
              <X size={16} className="me-2" />
              Mark order as lost
              {(filterCounts.lost || 0) > 0 && (
                <Badge bg="secondary" className="ms-auto">
                  {filterCounts.lost || 0}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => {
                if (!customTabs.some((t) => t.id === "deleted")) {
                  const nextTabs = [
                    ...customTabs,
                    {
                      id: "deleted",
                      label: "Deleted",
                      count: filterCounts.deleted || 0,
                      removable: true,
                    },
                  ];
                  setCustomTabs(nextTabs);
                  setShowTabModal(false);
                  toast.success("Tab added successfully!");
                }
              }}
              disabled={customTabs.some((t) => t.id === "deleted")}
              className="d-flex align-items-center justify-content-start"
              style={{ textAlign: "left" }}
            >
              <Trash2 size={16} className="me-2" />
              Deleted
              {(filterCounts.deleted || 0) > 0 && (
                <Badge bg="secondary" className="ms-auto">
                  {filterCounts.deleted || 0}
                </Badge>
              )}
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTabModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CrmOrders.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmOrders;
