import "@crm/orders/orderListPageOrderScss";
import { useRouter } from "next/router";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  TableColumn,
  TableAction,
} from "@components/GenericTable";
import { GENERIC_TABLE_PAGE_SIZE_OPTIONS } from "@constants/genericTable";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import StatsCards from "@components/GenericStatsCards";
import OrderEditModal from "@components/OrderEditModal";
import { FiFilter } from "react-icons/fi";
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
  getMinifiedCompanies,
} from "@utils/crm";
import { useEnsureCustomerForCrmCompany } from "@hooks/billing/useEnsureCustomerForCrmCompany";
import { GetHierarchyData } from "@utils/users";
import { Button, Row, Col, Badge, Form, Card, Modal } from "react-bootstrap";
import Select, { type SingleValue } from "react-select";
import {
  GlobalDateFormat,
  ModuleSlug,
  formatDateForTable,
  formatNumber,
} from "@utils/Helper";
import {
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  ShoppingBag,
  MoreVertical,
  X,
  Users,
  PlusCircle,
  Layers,
  DollarSign,
  Activity,
  FileText,
  ShoppingCart,
  Paperclip,
  Upload,
  DownloadIcon,
  RotateCcw,
  AlertCircle,
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

import {
  SuccessfulModal,
  FormModal,
  DeleteConfirmationModal,
} from "@crm/orders/orderListOrderPageShared";
import { useSession } from "next-auth/react";
import moment from "moment";
import {
  CrmKPICard as KPICard,
  CrmFilterBar as FilterBar,
} from "@components/crm/CrmListPageUi";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";
import {
  CrmOrderViewModal,
  OrderInvoicingOrderSidebar,
  attachmentMimeIconBackground,
  buildOrdersListParams,
  extensionLabelForAssignedTo,
  fulfillmentBadgeVariant,
  mergeOrdersListFilters,
  orderApprovalBadgeVariant,
  paymentStatusBadgeVariant,
} from "@components/billings/order-invoicing";

const ignoredHistoryKeys = new Set<string>(["order_stage_id"]);

function assignedSelectValue(
  opt: SingleValue<{ value: string | number }>,
): string | null {
  const value = opt?.value;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return null;
}

function transformOrderListRow(order: any, extensions: any[]) {
  const assignedLabel = extensionLabelForAssignedTo(
    extensions,
    order?.assigned_to,
  );
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
    orderDate: order.order_date
      ? moment(order.order_date).format(GlobalDateFormat)
      : "-",
    assignedUser: assignedLabel,
    expectedDeliveryDate: formatDateForTable(order.expected_delivery_date),
    actualDeliveryDate: formatDateForTable(order.actual_delivery_date),
    owner: assignedLabel,
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
    rawData: order,
  };
}

async function loadDealAndLeadForOrder(orderData: {
  deal_id?: number | string | null;
}): Promise<{ deal: any; lead: any }> {
  let deal: any = null;
  let lead: any = null;
  if (!orderData.deal_id) {
    return { deal, lead };
  }
  try {
    deal = await getDeal(Number(orderData.deal_id));
    if (!deal?.ticket_id) {
      return { deal, lead };
    }
    try {
      lead = await getLead(Number(deal.ticket_id));
      if (
        lead.contact_persons &&
        typeof lead.contact_persons === "string"
      ) {
        try {
          lead.contact_persons = JSON.parse(lead.contact_persons);
        } catch (e) {
          console.error("Failed to parse contact_persons:", e);
          lead.contact_persons = [];
        }
      }
    } catch (error) {
      console.error("Failed to fetch lead:", error);
    }
  } catch (error) {
    console.error("Failed to fetch deal:", error);
  }
  return { deal, lead };
}

const CrmOrders = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);
  const [companies, setCompanies] = useState<{ id: string | number; name?: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number>(
    "",
  );

  const onAccountingCustomerCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEnsureCustomerForCrmCompany(selectedCompanyId || null, {
    onCreated: onAccountingCustomerCreated,
    errorToastId: "billing_order_invoicing_ensure_customer_failed",
  });

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
  const [activeTab, setActiveTab] = useState<string>("tab1");

  // Sidebar states
  const [showOrderSidebar, setShowOrderSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);

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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  // Mark Order Lost Modal
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [orderToMarkLost, setOrderToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");

  // UI State
  const [showOrdersAnalytics] = useState(false);
  const [showAdvancedFilters] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [ordersSearch, setOrdersSearch] = useState("");
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
    dateFrom: null as string | null,
    dateTo: null as string | null,
  });

  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchStages();
    fetchLostReasons();
    fetchExtensions(ModuleSlug.CRM_ORDERS);
  }, []);

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

  // Fetch orders when filters or search change
  const fetchOrders = useCallback(
    async (page = 1, perPage = 15) => {
      setLoading(true);
      try {
        const params = buildOrdersListParams(
          page,
          perPage,
          currentFilters,
          selectedCompanyId,
        );

        const response: any = await getOrders(params);
        console.log("Raw response from getOrders:", response);

        const ordersArray: any[] = response?.dataList || [];
        const pagination: any = response?.meta || {};
        const summary: any = response?.summary_tiles || null;

        setOrdersData(Array.isArray(ordersArray) ? ordersArray : []);
        setTotalOrders(pagination?.total || 0);
        setSummaryTiles(summary);

        return response;
      } finally {
        setLoading(false);
      }
    },
    [currentFilters, selectedCompanyId],
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
        stages.some((s: any) => s.id.toString() === tabFromUrl);
      if (isValidFilter && tabFromUrl !== activeFilter) {
        setActiveFilter(tabFromUrl);
      }
    }
  }, [router.isReady, router.query.tab, stages, activeFilter]);

  // Handler to update filter and URL
  const handleFilterChange = useCallback(
    (filterId: string) => {
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
    [router],
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

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters((prev) => mergeOrdersListFilters(prev, filters));
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
    setRelatedDeal(null);
    setRelatedLead(null);
    try {
      const orderData: any = await getOrder(orderId);
      setViewingOrder(orderData);
      const { deal, lead } = await loadDealAndLeadForOrder(orderData);
      setRelatedDeal(deal);
      setRelatedLead(lead);
      setLoadingOrder(false);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      setLoadingOrder(false);
    }
  }, []);

  const handleViewOrder = useCallback(
    async (orderId: number) => {
      await fetchOrderDetails(orderId);
      try {
        setShowOrderViewModal(true);
      } catch (error) {
        console.error("Failed to fetch order:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoadingOrder(false);
      }
    },
    [fetchOrderDetails],
  );

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
    if (!globalThis.confirm("Are you sure you want to restore this order?"))
      return;

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

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const transformedOrders = ordersData.map((o) =>
      transformOrderListRow(o, extensions),
    );

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
      const value =
        Number.parseFloat(String(o.value).replaceAll(/[^0-9.-]/g, "")) || 0;
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
    return ordersData.map((o) => transformOrderListRow(o, extensions));
  }, [ordersData, extensions]);

  // Calculate filter counts (using summary_tiles if available, otherwise from data)
  const filterCounts = useMemo(() => {
    const transformed = ordersData.map((o) =>
      transformOrderListRow(o, extensions),
    );
    const counts: Record<string, number> = {
      all: summaryTiles?.total_orders || totalOrders || transformed.length,
      lost:
        summaryTiles?.lost_orders ||
        transformed.filter((o) => o.rawData?.is_lost).length,
      deleted: summaryTiles?.deleted_orders || 0,
    };

    // Add counts for first 5 stages
    stages.slice(0, 5).forEach((stage: any) => {
      const stageOrders = transformed.filter(
        (o) => o.stage === stage.name || o.rawData?.order_stage_id === stage.id,
      );
      counts[stage.id] = stageOrders.length;
    });

    return counts;
  }, [ordersData, extensions, stages, summaryTiles, totalOrders]);

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
            {row.currency} {formatNumber(row.value)}
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
            bg={orderApprovalBadgeVariant(row.approvalStatus)}
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
          <Badge bg={fulfillmentBadgeVariant(row.fulfillmentStatus)}>
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
          <Badge bg={paymentStatusBadgeVariant(row.paymentStatus)}>
            {row.paymentStatus}
          </Badge>
        ),
        emptyValue: "-",
      },
      {
        key: "assignedUser",
        label: "Assigned To",
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
          onClick: (row: any) => handleViewOrder(row.rawData?.id || row.id),
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
        onClick: (row: any) => handleViewOrder(row.rawData?.id || row.id),
        variant: "link" as const,
      },

      ...(session?.user?.permissions?.includes("edit-crm-orders")
        ? [
            {
              label: "Edit",
              icon: <Edit size={16} />,
              onClick: (row: any) => {
                setEditingOrderId(row.rawData?.id || row.id);
                setShowEditModal(true);
              },
              variant: "link" as const,
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
              label: "Mark as Lost",
              icon: <X size={14} />,
              onClick: (row: any) => handleMarkLost(row.rawData || row),
              className: "text-danger",
            },
            {
              label: "Withdraw",
              icon: <X size={14} />,
              onClick: (row: any) => handleMarkLost(row.rawData || row),
              className: "text-danger",
            },
          ],
        },
      },
    ];
  }, [
    session,
    activeFilter,
    handleViewOrder,
    handleRestoreOrder,
    handleDeleteOrder,
    handleMarkLost,
  ]);

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
      `,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/accounting/customer/dashboard"
        subTitle="Orders"
      />
      <div>
        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/dashboard" className="text-decoration-none">
                    Accounts
                  </a>
                </li>
                <li
                  className="breadcrumb-item active fw-bold"
                  aria-current="page"
                >
                  Order Management
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
              variant={showFilterBar ? "secondary" : "outline-secondary"}
              onClick={() => setShowFilterBar(!showFilterBar)}
            >
              <Layers size={16} className="me-2" />
              {showFilterBar ? "Hide Tabs" : "Show Tabs"}
            </Button>
            <Button
              variant={showFiltersSidebar ? "secondary" : "outline-secondary"}
              onClick={() => setShowFiltersSidebar(!showFiltersSidebar)}
            >
              <FiFilter size={16} className="me-2" />
              {showFiltersSidebar ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          data={[
            {
              title: "All Orders",
              value: summaryTiles?.total_orders || totalOrders || 0,
              icon: ShoppingBag,
              iconColor: "#6366F1",
              iconBgColor: "#EEF2FF",
              subtitle: "Total orders",
            },
            {
              title: "New",
              value:
                summaryTiles?.new_orders ||
                analyticsData.stageCounts["New"] ||
                0,
              icon: PlusCircle,
              iconColor: "#3B82F6",
              iconBgColor: "#DBEAFE",
              metric: {
                text: "Fresh orders",
                dotColor: "#2563EB",
              },
            },
            {
              title: "Qualified",
              value:
                summaryTiles?.qualified_orders ||
                analyticsData.stageCounts["Qualified"] ||
                0,
              icon: CheckCircle,
              iconColor: "#10B981",
              iconBgColor: "#D1FAE5",
              subtitle: "Verified & ready",
            },
            {
              title: "Proposal",
              value: analyticsData.stageCounts["Proposal"] || 0,
              icon: FileText,
              iconColor: "#8B5CF6",
              iconBgColor: "#EDE9FE",
              metric: {
                text: "Under review",
                dotColor: "#7C3AED",
              },
            },
            {
              title: "Negotiation",
              value: analyticsData.stageCounts["Negotiation"] || 0,
              icon: Users,
              iconColor: "#F59E0B",
              iconBgColor: "#FEF3C7",
              subtitle: "In discussion",
            },
            {
              title: "Lost",
              value: summaryTiles?.lost_orders || filterCounts.lost || 0,
              icon: AlertCircle,
              iconColor: "#EF4444",
              iconBgColor: "#FEE2E2",
              subtitle: "Requires review",
            },
            // {
            //   title: 'Deleted',
            //   value: summaryTiles?.deleted_orders || filterCounts.deleted || 0,
            //   icon: Trash2,
            //   iconColor: '#6B7280',
            //   iconBgColor: '#F3F4F6',
            //   metric: {
            //     text: 'Archived',
            //     dotColor: '#9CA3AF'
            //   }
            // }
          ]}
          gridMinWidth="180px"
        />

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
                  value={`${analyticsData.totalValue.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
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
                          data={Object.entries(analyticsData.stageCounts).map(
                            ([stage, count]) => ({ name: stage, value: count }),
                          )}
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
                                  key={`pie-stage-${stage}-${count}`}
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
                        data={Object.entries(analyticsData.statusCounts).map(
                          ([status, count]) => ({ status, count }),
                        )}
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
                  <Form.Label className="small fw-bold mb-2">Search</Form.Label>
                  <Form.Control
                    type="text"
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="Search orders by number, customer, deal..."
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Assigned To
                  </Form.Label>
                  <Select
                    options={extensions.map((ext: any) => ({
                      value: ext.id || ext.extension,
                      label:
                        ext.display_name || ext.name || ext.id || ext.extension,
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
                              : { value: assignedToId, label: assignedToId };
                          })()
                        : null
                    }
                    onChange={(selected) => {
                      const opt = selected as SingleValue<{
                        value: string | number;
                        label: string | number;
                      }>;
                      const assignedToValue = assignedSelectValue(opt);
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
                      const opt = selected as SingleValue<{
                        value: string;
                        label: string;
                      }>;
                      const stageValue = opt?.value ?? null;
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
                          filtersToApply.assigned_to = ordersFilters.assignedTo;
                        }
                        if (ordersFilters.stage) {
                          filtersToApply.order_stage_id = ordersFilters.stage;
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
        <GenericTable
          data={filteredOrders}
          columns={ordersColumns}
          actions={ordersActions}
          customizableColumns={true}
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
          pagination={{
            currentPage: ordersPagination.currentPage,
            rowsPerPage: ordersPagination.rowsPerPage,
            totalRows: totalOrders,
            pageSizeOptions: GENERIC_TABLE_PAGE_SIZE_OPTIONS,
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setOrdersPagination({
              ...ordersPagination,
              currentPage: page,
              rowsPerPage,
            });
          }}
          sortable={true}
          onRowClick={async (row) => {
            if (session?.user?.permissions?.includes("list-crm-orders")) {
              setShowOrderSidebar(true);
              // Fetch full order details including related deal and lead
              await fetchOrderDetails(row.rawData?.id || row.id);
            }
          }}
          loading={loading}
          emptyMessage="No orders found matching your criteria"
          loadingMessage="Loading orders..."
          hover={true}
          uniqueKey="id"
        />
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

      {/* Order Sidebar */}
      <OrderInvoicingOrderSidebar
        isOpen={showOrderSidebar}
        onClose={() => {
          setShowOrderSidebar(false);
          setViewingOrder(null);
          setRelatedDeal(null);
          setRelatedLead(null);
        }}
        viewingOrder={viewingOrder}
        relatedDeal={relatedDeal}
        relatedLead={relatedLead}
        extensions={extensions}
        session={session}
        activeFilter={activeFilter}
        onEditOrder={() => {
          setShowOrderSidebar(false);
          const id = viewingOrder?.id;
          if (id != null) setEditingOrderId(Number(id));
          setShowEditModal(true);
        }}
        onViewDetails={() => {
          setShowOrderSidebar(false);
          const id = viewingOrder?.id;
          if (id != null) {
            handleViewOrder(Number(id)).catch((err: unknown) => {
              console.error("Failed to open order from sidebar:", err);
            });
          }
        }}
      />

      {/* Filters Sidebar */}
      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={() => setShowFiltersSidebar(false)}
        title="Filters"
        subtitle="Filter and refine your orders"
        width="400px"
        filters={[
          {
            id: "search",
            label: "Search",
            type: "text" as const,
            value: ordersSearch,
            onChange: (value) => setOrdersSearch(value),
            placeholder: "Search orders by number, customer, deal...",
          },
          {
            id: "assignedTo",
            label: "Assigned To",
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
              const opt = selected as SingleValue<{
                value: string | number;
                label: string | number;
              }>;
              const assignedToValue = assignedSelectValue(opt);
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
              const opt = selected as SingleValue<{
                value: string;
                label: string;
              }>;
              const stageValue = opt?.value ?? null;
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
            filtersToApply.assigned_to = ordersFilters.assignedTo;
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

      {viewingOrder && (
        <CrmOrderViewModal
          viewingOrder={viewingOrder}
          show={showOrderViewModal}
          onHide={() => setShowOrderViewModal(false)}
          loadingOrder={loadingOrder}
          relatedDeal={relatedDeal}
          relatedLead={relatedLead}
          extensions={extensions}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          session={session}
          ignoredHistoryKeys={ignoredHistoryKeys}
        />
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
                      <span
                        className="spinner-border spinner-border-sm"
                        aria-hidden="true"
                      />
                      <span>Uploading...</span>
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

              {(() => {
                if (loadingAttachments) {
                  return (
                    <output
                      className="d-block text-center py-5"
                      aria-live="polite"
                    >
                      <span
                        className="spinner-border text-primary"
                        aria-hidden="true"
                      />
                      <span className="visually-hidden">
                        Loading attachments…
                      </span>
                    </output>
                  );
                }
                if (attachments.length === 0) {
                  return (
                    <div className="text-center py-4 text-muted">
                      <Paperclip size={48} className="mb-3 opacity-25" />
                      <div>No order attachments yet</div>
                      <small>Upload files using the form above</small>
                    </div>
                  );
                }
                return (
                  <div className="d-flex flex-column gap-2 mb-4">
                    {attachments.map((attachment: any) => (
                      <Card key={attachment.id} className="border shadow-sm">
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                              <div
                                className="rounded d-flex align-items-center justify-content-center"
                                style={{
                                  width: "45px",
                                  height: "45px",
                                  background: attachmentMimeIconBackground(
                                    attachment.mime_type,
                                  ),
                                  color: "white",
                                }}
                              >
                                <FileText size={22} />
                              </div>

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
                                    ? formatDateForTable(attachment.created_at)
                                    : "N/A"}
                                </div>
                              </div>
                            </div>

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
                );
              })()}

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

                  {(() => {
                    if (loadingAttachments) {
                      return (
                        <output
                          className="d-block text-center py-5"
                          aria-live="polite"
                        >
                          <span
                            className="spinner-border text-primary"
                            aria-hidden="true"
                          />
                          <span className="visually-hidden">
                            Loading attachments…
                          </span>
                        </output>
                      );
                    }
                    if (dealAttachments.length === 0) {
                      return (
                        <div className="text-center py-4 text-muted">
                          <Paperclip size={48} className="mb-3 opacity-25" />
                          <div>No deal attachments</div>
                        </div>
                      );
                    }
                    return (
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
                                  <div
                                    className="rounded d-flex align-items-center justify-content-center"
                                    style={{
                                      width: "45px",
                                      height: "45px",
                                      background: attachmentMimeIconBackground(
                                        attachment.mime_type,
                                      ),
                                      color: "white",
                                    }}
                                  >
                                    <FileText size={22} />
                                  </div>

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

                                <div className="d-flex gap-1">
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-2 text-primary"
                                    title="Download"
                                    onClick={() =>
                                      handleDownloadDealAttachment(
                                        attachment.id,
                                      )
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
                    );
                  })()}
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

      {editingOrderId && (
        <OrderEditModal
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setEditingOrderId(null);
          }}
          orderId={editingOrderId}
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
            toast.success("Order updated successfully!");
          }}
        />
      )}
    </React.Fragment>
  );
};

CrmOrders.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmOrders;
