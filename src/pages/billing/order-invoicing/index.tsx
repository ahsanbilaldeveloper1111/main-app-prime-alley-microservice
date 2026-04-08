import "@crm/orders/orderListPageOrderScss";
import { useRouter } from "next/router";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  Layout,
  BreadcrumbItem,
  GenericTable,
  GenericSidebar,
  GenericFilterSidebar,
  StatsCards,
  OrderEditModal,
  type TableColumn,
  type TableAction,
} from "@crm/orders/orderListOrderPageFrame";
import {
  FiUpload,
  FiDatabase,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEye,
  FiUser,
  FiUsers,
  FiPhone,
  FiMessageCircle,
  FiPlay,
  FiClock,
  FiX,
  FiAlertCircle,
  FiCalendar,
  FiTarget,
  FiMoreVertical,
} from "@crm/orders/orderListFiIcons";
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
} from "@crm/orders/orderListCrmApi";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Row,
  Col,
  Badge,
  Dropdown,
  Form,
  Card,
  Table,
  InputGroup,
  Modal,
  Spinner,
} from "@crm/orders/orderListBootstrap";
import Select, { type SingleValue } from "react-select";

type OrderInvoicingSelectOption = { value: string | number; label: string };

const toOptionalSelectString = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  return String(value);
};
import {
  GlobalDateFormat,
  ModuleSlug,
  formatDateForTable,
} from "@utils/Helper";
import {
  Target,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Trash2,
  ShoppingBag,
  MoreVertical,
  X,
  Users,
  PlusCircle,
  Zap,
  Star,
  Clock,
  Search,
  Filter,
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
  AlertTriangle,
  RefreshCw,
  History,
  Mail,
  Phone,
  Building2,
  Package,
  Link2,
  User,
  Paperclip,
  Upload,
  DownloadIcon,
  RotateCcw,
  AlertCircle,
  Handshake,
  Info,
} from "@crm/orders/orderListLucideHeavy";
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
} from "@crm/orders/orderListRecharts";
import Link from "next/link";
import { toast } from "react-toastify";

import {
  SuccessfulModal,
  FormModal,
  DeleteConfirmationModal,
  PhoneDisplay,
  KPICard,
  FilterBar,
  getInitials,
  getRandomColor,
  customSelectStyles,
} from "@crm/orders/orderListOrderPageShared";
import { useSession } from "next-auth/react";
import moment from "moment";
import { buildCrmOrdersListGetOrdersParams } from "@crm/orders/buildCrmOrdersListGetOrdersParams";

const ignoredKeys = ["order_stage_id"];

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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | number | ''>('');

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
  const [showOrdersAnalytics, setShowOrdersAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [selectedOrdersColumns, setSelectedOrdersColumns] = useState<string[]>(
    () => {
      const saved = localStorage.getItem("ordersSelectedColumns");
      return saved
        ? JSON.parse(saved)
        : [
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
        const params = buildCrmOrdersListGetOrdersParams({
          filters: currentFilters,
          page,
          perPage,
          tableSort: null,
          normalizeSearch: false,
          ownerParamStyle: "assigned_to",
          crmCompanyId: selectedCompanyId,
        });

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
        (stages.length > 0 &&
          stages.some((s: any) => s.id.toString() === tabFromUrl));
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
    setCurrentFilters((prev) => {
      const newFilters = { ...prev };

      // Handle stage_id filter (single value)
      if ("stage_id" in filters) {
        if (filters.stage_id) {
          newFilters.stage_id = String(filters.stage_id);
        } else {
          delete newFilters.stage_id;
        }
      }

      // Handle assigned_to filter (single value)
      if ("assigned_to" in filters) {
        if (filters.assigned_to) {
          newFilters.assigned_to = String(filters.assigned_to);
        } else {
          delete newFilters.assigned_to;
        }
      }

      // Handle search
      if ("search" in filters) {
        if (filters.search) {
          newFilters.search = filters.search;
        } else {
          delete newFilters.search;
        }
      }

      // Handle is_lost filter
      if ("is_lost" in filters) {
        newFilters.is_lost = filters.is_lost;
      }

      // Handle include_lost filter
      if ("include_lost" in filters) {
        if (filters.include_lost) {
          newFilters.include_lost = true;
        } else {
          delete newFilters.include_lost;
        }
      }

      // Handle include_archived filter
      if ("include_archived" in filters) {
        if (filters.include_archived) {
          newFilters.include_archived = true;
        } else {
          delete newFilters.include_archived;
        }
      }

      // Handle industry filter
      if ("industry" in filters) {
        if (filters.industry) {
          newFilters.industry = filters.industry;
        } else {
          delete newFilters.industry;
        }
      }

      // Handle order_value_min filter
      if ("order_value_min" in filters) {
        if (filters.order_value_min) {
          newFilters.order_value_min = String(filters.order_value_min);
        } else {
          delete newFilters.order_value_min;
        }
      }

      // Handle order_value_max filter
      if ("order_value_max" in filters) {
        if (filters.order_value_max) {
          newFilters.order_value_max = String(filters.order_value_max);
        } else {
          delete newFilters.order_value_max;
        }
      }

      // Handle order_stage_id filter (note: this is different from stage_id, it's order_stage_id)
      if ("order_stage_id" in filters) {
        if (filters.order_stage_id) {
          newFilters.order_stage_id = String(filters.order_stage_id);
        } else {
          delete newFilters.order_stage_id;
        }
      }

      // Handle order_approval_status filter
      if ("order_approval_status" in filters) {
        if (filters.order_approval_status) {
          newFilters.order_approval_status = filters.order_approval_status;
        } else {
          delete newFilters.order_approval_status;
        }
      }

      // Handle fulfillment_status filter
      if ("fulfillment_status" in filters) {
        if (filters.fulfillment_status) {
          newFilters.fulfillment_status = filters.fulfillment_status;
        } else {
          delete newFilters.fulfillment_status;
        }
      }

      // Handle payment_status filter
      if ("payment_status" in filters) {
        if (filters.payment_status) {
          newFilters.payment_status = filters.payment_status;
        } else {
          delete newFilters.payment_status;
        }
      }

      // Handle date_from filter
      if ("date_from" in filters) {
        if (filters.date_from) {
          newFilters.date_from = filters.date_from;
        } else {
          delete newFilters.date_from;
        }
      }

      // Handle date_to filter
      if ("date_to" in filters) {
        if (filters.date_to) {
          newFilters.date_to = filters.date_to;
        } else {
          delete newFilters.date_to;
        }
      }

      return newFilters;
    });
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

  const handleViewOrder = useCallback(async (orderId: number) => {
    await fetchOrderDetails(orderId);
    try {
      setShowOrderViewModal(true);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoadingOrder(false);
      setLoadingDeal(false);
      setLoadingLead(false);
    }
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
    fetchOrderDetails,
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
                      const opt =
                        selected as SingleValue<OrderInvoicingSelectOption>;
                      const assignedToValue = toOptionalSelectString(opt?.value);
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
                      const opt =
                        selected as SingleValue<OrderInvoicingSelectOption>;
                      const stageValue = toOptionalSelectString(opt?.value);
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
          onRowClick={async (row) => {
            if (session?.user?.permissions?.includes("list-crm-orders")) {
              setSelectedOrder(row.rawData || row);
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
      <GenericSidebar
        isOpen={showOrderSidebar}
        onClose={() => {
          setShowOrderSidebar(false);
          setSelectedOrder(null);
          setViewingOrder(null);
          setRelatedDeal(null);
          setRelatedLead(null);
        }}
        moduleSlug={ModuleSlug.BILLING}
        title={
          viewingOrder?.order_number ||
          `Order #${viewingOrder?.id}` ||
          "Order Details"
        }
        subtitle={viewingOrder?.customer_name || ""}
        metadata={viewingOrder?.id ? `Order ID: ${viewingOrder.id}` : ""}
        email={viewingOrder?.customer_email || ""}
        phone={viewingOrder?.customer_phone || ""}
        avatar={{
          name: viewingOrder?.customer_name || "Order",
          useIcon: true,
        }}
        width="420px"
        tabs={[
          {
            id: "general",
            label: "General Information",
            sections: [
              {
                id: "order-info",
                title: "Order Information",
                icon: ShoppingBag,
                fields: [
                  {
                    label: "Order Number",
                    value:
                      viewingOrder?.order_number ||
                      `ORD-${viewingOrder?.id}` ||
                      "N/A",
                    type: "text" as const,
                  },
                  {
                    label: "Stage",
                    value: viewingOrder?.stage?.name || "Not assigned",
                    type: "badge" as const,
                    badgeVariant: "secondary",
                    show: !!viewingOrder?.stage,
                  },
                  {
                    label: "Status",
                    value: viewingOrder?.status || "N/A",
                    type: "badge" as const,
                    badgeVariant:
                      viewingOrder?.status?.toLowerCase() === "completed"
                        ? "success"
                        : viewingOrder?.status?.toLowerCase() === "pending"
                          ? "warning"
                          : "secondary",
                  },
                  {
                    label: "Final Amount",
                    value:
                      viewingOrder?.final_amount || viewingOrder?.total_amount
                        ? `${viewingOrder?.currency || "AED"} ${parseFloat(String(viewingOrder.final_amount || viewingOrder.total_amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "N/A",
                    type: "text" as const,
                    icon: DollarSign,
                  },
                  {
                    label: "Order Date",
                    value: viewingOrder?.order_date,
                    type: "date" as const,
                    icon: Calendar,
                    show: !!viewingOrder?.order_date,
                  },
                  {
                    label: "Expected Delivery",
                    value: viewingOrder?.expected_delivery_date,
                    type: "date" as const,
                    icon: Calendar,
                    show: !!viewingOrder?.expected_delivery_date,
                  },
                  {
                    label: "Industry",
                    value: viewingOrder?.industry || "N/A",
                    type: "text" as const,
                    show: !!viewingOrder?.industry,
                  },
                ],
              },
              {
                id: "customer-info",
                title: "Company Information",
                icon: User,
                fields: [
                  {
                    label: "Company Name",
                    value: viewingOrder?.customer_name || "N/A",
                    type: "text" as const,
                    icon: Building2,
                  },
                  {
                    label: "Email",
                    value: viewingOrder?.customer_email || "N/A",
                    type: "text" as const,
                    icon: Mail,
                    show: !!viewingOrder?.customer_email,
                  },
                  {
                    label: "Phone",
                    value: viewingOrder?.customer_phone || "N/A",
                    type: "text" as const,
                    icon: Phone,
                    show: !!viewingOrder?.customer_phone,
                  },
                  {
                    label: "Address",
                    value: viewingOrder?.customer_address || "N/A",
                    type: "text" as const,
                    show: !!viewingOrder?.customer_address,
                  },
                ],
              },
            ],
          },
          {
            id: "lead-deal",
            label: "Lead/Deal Information",
            sections: [
              // Deal Information Section
              ...(relatedDeal
                ? [
                    {
                      id: "deal-info",
                      title: "Deal Information",
                      icon: Link2,
                      fields: [
                        {
                          label: "Deal Name",
                          value: relatedDeal?.name || "N/A",
                          type: "text" as const,
                        },
                        {
                          label: "Stage",
                          value: relatedDeal?.stage?.name || "Not assigned",
                          type: "badge" as const,
                          badgeVariant: "primary",
                          show: !!relatedDeal?.stage,
                        },
                        {
                          label: "Deal Value",
                          value:
                            relatedDeal?.net_value || relatedDeal?.grand_total
                              ? `${relatedDeal?.currency || "AED"} ${parseFloat(String(relatedDeal.net_value || relatedDeal.grand_total)).toLocaleString()}`
                              : "N/A",
                          type: "text" as const,
                          icon: DollarSign,
                          show: !!(
                            relatedDeal?.net_value || relatedDeal?.grand_total
                          ),
                        },
                        {
                          label: "Assigned To",
                          value:
                            extensions.find(
                              (ext: any) =>
                                ext?.id == relatedDeal?.assigned_to ||
                                ext?.extension == relatedDeal?.assigned_to,
                            )?.display_name ||
                            extensions.find(
                              (ext: any) =>
                                ext?.id == relatedDeal?.assigned_to ||
                                ext?.extension == relatedDeal?.assigned_to,
                            )?.name ||
                            relatedDeal?.assigned_to ||
                            "Not assigned",
                          type: "text" as const,
                          icon: User,
                          show: !!relatedDeal?.assigned_to,
                        },
                        {
                          label: "Created Date",
                          value: relatedDeal?.created_at,
                          type: "date" as const,
                          icon: Calendar,
                          show: !!relatedDeal?.created_at,
                        },
                      ],
                    },
                  ]
                : []),
              // Deal Company Information Section
              ...(relatedDeal?.company_name
                ? [
                    {
                      id: "deal-company-info",
                      title: "Deal Company Information",
                      icon: Building2,
                      fields: [
                        {
                          label: "Company Name",
                          value: relatedDeal?.company_name || "N/A",
                          type: "text" as const,
                          icon: Building2,
                        },
                        {
                          label: "Industry",
                          value: relatedDeal?.industry || "N/A",
                          type: "text" as const,
                          show: !!relatedDeal?.industry,
                        },
                      ],
                    },
                  ]
                : []),
              // Lead Information Section
              ...(relatedLead
                ? [
                    {
                      id: "lead-info",
                      title: "Lead Information",
                      icon: Target,
                      fields: [
                        {
                          label: "Lead Name",
                          value: relatedLead?.name || "N/A",
                          type: "text" as const,
                        },
                        {
                          label: "Stage",
                          value: relatedLead?.stage?.name || "Not assigned",
                          type: "badge" as const,
                          badgeVariant: "primary",
                          show: !!relatedLead?.stage,
                        },
                        {
                          label: "Lead Potential",
                          value: relatedLead?.lead_potential || "N/A",
                          type: "badge" as const,
                          badgeVariant:
                            relatedLead?.lead_potential === "Hot"
                              ? "danger"
                              : relatedLead?.lead_potential === "Warm"
                                ? "warning"
                                : "secondary",
                          show: !!relatedLead?.lead_potential,
                        },
                        {
                          label: "Status",
                          value: relatedLead?.status || "N/A",
                          type: "text" as const,
                          show: !!relatedLead?.status,
                        },
                        {
                          label: "Assigned To",
                          value:
                            extensions.find(
                              (ext: any) =>
                                ext?.id == relatedLead?.assigned_to ||
                                ext?.extension == relatedLead?.assigned_to,
                            )?.display_name ||
                            extensions.find(
                              (ext: any) =>
                                ext?.id == relatedLead?.assigned_to ||
                                ext?.extension == relatedLead?.assigned_to,
                            )?.name ||
                            relatedLead?.assigned_to ||
                            "Not assigned",
                          type: "text" as const,
                          icon: User,
                          show: !!relatedLead?.assigned_to,
                        },
                        {
                          label: "Created Date",
                          value: relatedLead?.created_at,
                          type: "date" as const,
                          icon: Calendar,
                          show: !!relatedLead?.created_at,
                        },
                      ],
                    },
                  ]
                : []),
              // Campaign Information Section - only if campaign exists
              ...(relatedLead?.campaign
                ? [
                    {
                      id: "campaign-info",
                      title: "Campaign Information",
                      icon: FileText,
                      fields: [
                        {
                          label: "Campaign Name",
                          value: relatedLead?.campaign?.name || "N/A",
                          type: "text" as const,
                        },
                      ],
                    },
                  ]
                : []),
              // Prospect Information Section - only if crm_data exists
              ...(relatedLead?.crm_data
                ? [
                    {
                      id: "prospect-info",
                      title: "Prospect Information",
                      icon: User,
                      fields: [
                        {
                          label: "CRM Data ID",
                          value: relatedLead?.crm_data?.id
                            ? `#${relatedLead.crm_data.id}`
                            : "N/A",
                          type: "text" as const,
                          show: !!relatedLead?.crm_data?.id,
                        },
                        {
                          label: "Name",
                          value:
                            relatedLead?.crm_data?.name ||
                            relatedLead?.crm_data?.data?.name ||
                            "N/A",
                          type: "text" as const,
                        },
                        {
                          label: "Phone",
                          value:
                            relatedLead?.crm_data?.phone ||
                            relatedLead?.crm_data?.data?.phone ||
                            "N/A",
                          type: "text" as const,
                          icon: Phone,
                        },
                        {
                          label: "Source File",
                          value: relatedLead?.crm_data?.source_file || "N/A",
                          type: "text" as const,
                          show: !!relatedLead?.crm_data?.source_file,
                        },
                        {
                          label: "Uploaded By",
                          value: relatedLead?.crm_data?.uploaded_by || "N/A",
                          type: "text" as const,
                          icon: User,
                          show: !!relatedLead?.crm_data?.uploaded_by,
                        },
                        {
                          label: "Created At",
                          value: relatedLead?.crm_data?.created_at,
                          type: "date" as const,
                          icon: Calendar,
                          show: !!relatedLead?.crm_data?.created_at,
                        },
                      ],
                    },
                  ]
                : []),
              // Empty state if no deal or lead information at all
              ...(!relatedDeal && !relatedLead
                ? [
                    {
                      id: "no-info",
                      title: "No Information Available",
                      icon: AlertCircle,
                      emptyState: {
                        icon: AlertCircle,
                        message:
                          "No deal or lead information available for this order",
                      },
                    },
                  ]
                : []),
            ],
          },
          {
            id: "additional-info",
            label: "Additional Information",
            sections: [
              {
                id: "additional-details",
                title: "Additional Information",
                icon: FileText,
                fields: [
                  {
                    label: "Approval Status",
                    value: viewingOrder?.order_approval_status || "Not Set",
                    type: "badge" as const,
                    badgeVariant:
                      viewingOrder?.order_approval_status?.toLowerCase() ===
                      "approved"
                        ? "success"
                        : viewingOrder?.order_approval_status?.toLowerCase() ===
                            "rejected"
                          ? "danger"
                          : "warning",
                  },
                  {
                    label: "Fulfillment Status",
                    value: viewingOrder?.fulfillment_status || "Not Set",
                    type: "badge" as const,
                    badgeVariant:
                      viewingOrder?.fulfillment_status
                        ?.toLowerCase()
                        .includes("completed") ||
                      viewingOrder?.fulfillment_status
                        ?.toLowerCase()
                        .includes("delivered")
                        ? "success"
                        : viewingOrder?.fulfillment_status
                              ?.toLowerCase()
                              .includes("progress")
                          ? "primary"
                          : "secondary",
                  },
                  {
                    label: "Payment Status",
                    value: viewingOrder?.payment_status || "Not Set",
                    type: "badge" as const,
                    badgeVariant:
                      viewingOrder?.payment_status?.toLowerCase() === "paid"
                        ? "success"
                        : viewingOrder?.payment_status?.toLowerCase() ===
                            "partial"
                          ? "warning"
                          : "danger",
                  },
                  {
                    label: "Assigned To",
                    value:
                      extensions.find(
                        (ext: any) =>
                          ext?.id == viewingOrder?.assigned_to ||
                          ext?.extension == viewingOrder?.assigned_to,
                      )?.display_name ||
                      extensions.find(
                        (ext: any) =>
                          ext?.id == viewingOrder?.assigned_to ||
                          ext?.extension == viewingOrder?.assigned_to,
                      )?.name ||
                      viewingOrder?.assigned_to ||
                      "Not assigned",
                    type: "text" as const,
                    icon: User,
                    show: !!viewingOrder?.assigned_to,
                  },
                  {
                    label: "Contract Length",
                    value: viewingOrder?.contract_length || "N/A",
                    type: "text" as const,
                    show: !!viewingOrder?.contract_length,
                  },
                ],
              },
              {
                id: "notes",
                title: "Notes",
                icon: FileText,
                fields: viewingOrder?.notes
                  ? [
                      {
                        label: "Notes",
                        value: viewingOrder?.notes,
                        type: "text" as const,
                      },
                    ]
                  : [],
                emptyState: !viewingOrder?.notes
                  ? {
                      icon: FileText,
                      message: "No notes available",
                    }
                  : undefined,
              },
            ],
          },
          {
            id: "history",
            label: "History",
            sections: [
              {
                id: "activity-history",
                title: "Activity History",
                icon: History,
                badge: {
                  value: viewingOrder?.histories?.length || 0,
                  variant: "secondary",
                },
                emptyState:
                  !viewingOrder?.histories ||
                  viewingOrder.histories.length === 0
                    ? {
                        icon: History,
                        message: "No activity history yet",
                      }
                    : undefined,
                customContent:
                  viewingOrder?.histories &&
                  viewingOrder.histories.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      {viewingOrder.histories.map(
                        (history: any, idx: number) => (
                          <div
                            key={history.id || idx}
                            style={{
                              padding: "16px",
                              backgroundColor: "#f9fafb",
                              borderRadius: "10px",
                              border: "1px solid #f3f4f6",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: "6px",
                              }}
                            >
                              {history.action || "Activity"}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                marginBottom: "4px",
                              }}
                            >
                              by{" "}
                              {history.user?.name ||
                                history.created_by ||
                                "System"}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#9ca3af",
                              }}
                            >
                              {history.created_at
                                ? formatDateForTable(history.created_at)
                                : "N/A"}
                            </div>
                            {history.description && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  fontSize: "12px",
                                  color: "#4b5563",
                                  fontStyle: "italic",
                                }}
                              >
                                {history.description}
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  ) : undefined,
              },
            ],
          },
        ]}
        actions={[
          {
            label: "Edit Order",
            icon: Edit,
            onClick: () => {
              setShowOrderSidebar(false);
              setEditingOrderId(viewingOrder?.id);
              setShowEditModal(true);
            },
            variant: "primary",
            show:
              session?.user?.permissions?.includes("edit-crm-orders") &&
              activeFilter !== "lost",
          },
          {
            label: "View Details",
            icon: Eye,
            onClick: () => {
              setShowOrderSidebar(false);
              handleViewOrder(viewingOrder?.id);
            },
            variant: "outline-primary",
          },
        ]}
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
                      ? moment(viewingOrder.order_date).format("MMM DD, YYYY")
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
                                    ? formatDateForTable(
                                        viewingOrder.order_date,
                                      )
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
                                    {formatDateForTable(
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
                                      Assigned To
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
                                      Assigned To
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
                                    Assigned To
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
                                {moment(viewingOrder.order_date).format(
                                  "MMM DD, YYYY",
                                )}
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
                                {moment(
                                  viewingOrder.expected_delivery_date,
                                ).format("MMM DD, YYYY")}
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
