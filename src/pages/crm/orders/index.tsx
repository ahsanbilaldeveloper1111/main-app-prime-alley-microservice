import "@assets/scss/datatable-style.scss";
import parsePhoneNumber from "libphonenumber-js";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
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
} from "react-icons/fi";
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
} from "@utils/crm";
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
} from "react-bootstrap";
import Select from "react-select";
import { GlobalDateFormat, ModuleSlug, formatDateForTable } from "@utils/Helper";
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
  Download as DownloadIcon,
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
import Link from "next/link";
import { toast } from "react-toastify";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import FormModal from "../../partial/FormModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";
import moment from "moment";

// Phone Container Component (with Badge for tables)
const ignoredKeys = ["order_stage_id"];
const PhoneContainer = ({ phone }: { phone: string }) => {
  const parsePhone = useCallback((phone: string) => {
    if (!phone)
      return {
        phone: "N/A",
        countryCode: "",
      };
    try {
      const parsedPhone = parsePhoneNumber(phone);
      return {
        phone: parsedPhone?.formatInternational() || phone,
        countryCode: parsedPhone?.country || "",
      };
    } catch (e) {
      console.error(e);
      return {
        phone: phone,
        countryCode: "",
      };
    }
  }, []);
  const getFlagImgSrc = useCallback((countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
  }, []);
  const phoneNumber = useMemo(() => {
    return phone
      ? parsePhone(phone)
      : {
          phone: "N/A",
          countryCode: "",
        };
  }, [phone, parsePhone]);

  const flagImgSrc = getFlagImgSrc(phoneNumber.countryCode);
  return (
    <Badge bg="info" className="bg-opacity-10 text-dark">
      <div className="d-flex align-items-center gap-2">
        {phoneNumber?.countryCode && (
          <img src={flagImgSrc} alt={phoneNumber.countryCode} />
        )}
        {phoneNumber.phone}
      </div>
    </Badge>
  );
};

// Phone Display Component (without Badge for view dialogs)
const PhoneDisplay = ({ phone }: { phone: string }) => {
  const parsePhone = useCallback((phone: string) => {
    if (!phone)
      return {
        phone: "N/A",
        countryCode: "",
      };
    try {
      const parsedPhone = parsePhoneNumber(phone);
      return {
        phone: parsedPhone?.formatInternational() || phone,
        countryCode: parsedPhone?.country || "",
      };
    } catch (e) {
      console.error(e);
      return {
        phone: phone,
        countryCode: "",
      };
    }
  }, []);
  const getFlagImgSrc = useCallback((countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
  }, []);
  const phoneNumber = useMemo(() => {
    return phone
      ? parsePhone(phone)
      : {
          phone: "N/A",
          countryCode: "",
        };
  }, [phone, parsePhone]);

  const flagImgSrc = getFlagImgSrc(phoneNumber.countryCode);
  return (
    <div className="d-flex align-items-center gap-2">
      {phoneNumber?.countryCode && (
        <img src={flagImgSrc} alt={phoneNumber.countryCode} />
      )}
      {phoneNumber.phone}
    </div>
  );
};

// Helper function to get initials from name (first two words, first two letters, only a-z)
const getInitials = (name: string): string => {
  if (!name) return "NA";

  // Split by spaces and take up to first two words
  const words = name.trim().split(/\s+/).slice(0, 2);

  // Check if we have two words and the second word has at least one letter
  const hasSecondWord = words.length >= 2;
  const secondWordHasLetter = hasSecondWord && /[a-z]/i.test(words[1]);

  if (hasSecondWord && secondWordHasLetter) {
    // First letter of first two words
    const firstLetter1 = words[0].match(/[a-z]/i)?.[0];
    const firstLetter2 = words[1].match(/[a-z]/i)?.[0];

    if (firstLetter1 && firstLetter2) {
      return (firstLetter1 + firstLetter2).toUpperCase();
    }
  }

  // If no second word or second word is only numbers, use first two letters of first word
  if (words[0]) {
    const letters = words[0].match(/[a-z]/gi) || [];
    if (letters.length >= 2) {
      return (letters[0] + letters[1]).toUpperCase();
    } else if (letters.length === 1) {
      return letters[0].toUpperCase();
    }
  }

  return "NA";
};

// Helper function to generate a random background color based on name
const getRandomColor = (name: string): string => {
  if (!name) return "#6c757d";

  // Generate a consistent color based on the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (name?.codePointAt(i) || 0) + ((hash << 5) - hash);
  }

  // Generate a color with good contrast (avoid too light colors)
  const hue = Math.abs(hash) % 360;
  const saturation = 50 + (Math.abs(hash) % 30); // 50-80%
  const lightness = 40 + (Math.abs(hash) % 20); // 40-60%

  return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
};

// KPI Card Component
interface KPICardData {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardData> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  color,
  onClick,
}) => {
  return (
    <Card
      className={onClick ? "h-100" : ""}
      style={{
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        border: "1px solid #e9ecef",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
            <div className={`text-${color}`}>{icon}</div>
          </div>
          {change && (
            <Badge
              bg={isPositive ? "success" : "danger"}
              className="bg-opacity-10"
            >
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {change}
            </Badge>
          )}
        </div>
        <h3 className="mb-1">{value}</h3>
        <p className="text-muted mb-0 small">{title}</p>
      </Card.Body>
    </Card>
  );
};

// Filter Bar Component
interface FilterBarProps {
  quickFilters: {
    id: string;
    label: string;
    count: number;
    variant?: string;
    color?: string;
    icon?: React.ReactNode;
  }[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  searchPlaceholder?: string;
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
  advancedFilterCount?: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  quickFilters,
  activeFilter,
  onFilterChange,
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Search...",
  showAdvancedFilters,
  onToggleAdvancedFilters,
  advancedFilterCount = 0,
}) => {
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3">
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map((filter) => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color;
              const buttonStyle: React.CSSProperties = {};
              if (hasCustomColor) {
                if (isActive) {
                  const bgColor = filter.color;
                  buttonStyle.background = bgColor;
                  buttonStyle.borderColor = bgColor;
                  buttonStyle.color = "#fff";
                } else {
                  buttonStyle.background = "#fff";
                  buttonStyle.borderColor = filter.color;
                  buttonStyle.color = filter.color;
                }
              }

              return (
                <Button
                  key={filter.id}
                  variant={
                    hasCustomColor
                      ? undefined
                      : isActive
                      ? filter.variant || "primary"
                      : "outline-secondary"
                  }
                  onClick={() => onFilterChange && onFilterChange(filter.id)}
                  className="d-flex align-items-center gap-2"
                  style={hasCustomColor ? buttonStyle : undefined}
                >
                  {filter.icon && (
                    <span className="d-flex align-items-center">
                      {filter.icon}
                    </span>
                  )}
                  {filter.label}
                </Button>
              );
            })}
          </div>

         
        </div>
      </Card.Body>
    </Card>
  );
};

const CrmOrders = () => {
  const { data: session } = useSession();

  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);

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
    null
  );

  // Mark Order Lost Modal
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [orderToMarkLost, setOrderToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");

  // UI State
  const [showOrdersAnalytics, setShowOrdersAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
    }
  );
  const [ordersPagination, setOrdersPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
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

  // Fetch orders when filters or search change
  const fetchOrders = useCallback(
    async (page = 1, perPage = 15) => {
      setLoading(true);
      try {
        const params: any = {
          page,
          per_page: perPage,
        };

        // Use search from currentFilters if available
        if (currentFilters.search) {
          params.search = currentFilters.search;
        }

        // Add filter parameters at top level
        if (currentFilters.stage_id) {
          params.stage_id = currentFilters.stage_id;
        }
        if (currentFilters.assigned_to) {
          params.assigned_to = currentFilters.assigned_to;
        }
        if (currentFilters.is_lost !== undefined) {
          params.is_lost = currentFilters.is_lost;
        }
        if (currentFilters.include_lost !== undefined) {
          params.include_lost = currentFilters.include_lost;
        }
        if (currentFilters.include_archived !== undefined) {
          params.include_archived = currentFilters.include_archived;
        }
        if (currentFilters.industry) {
          params.industry = currentFilters.industry;
        }
        if (currentFilters.order_value_min) {
          params.order_value_min = currentFilters.order_value_min;
        }
        if (currentFilters.order_value_max) {
          params.order_value_max = currentFilters.order_value_max;
        }
        if (currentFilters.order_stage_id) {
          params.order_stage_id = currentFilters.order_stage_id;
        }
        if (currentFilters.order_approval_status) {
          params.order_approval_status = currentFilters.order_approval_status;
        }
        if (currentFilters.fulfillment_status) {
          params.fulfillment_status = currentFilters.fulfillment_status;
        }
        if (currentFilters.payment_status) {
          params.payment_status = currentFilters.payment_status;
        }
        if (currentFilters.date_from) {
          params.date_from = currentFilters.date_from;
        }
        if (currentFilters.date_to) {
          params.date_to = currentFilters.date_to;
        }

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
    [currentFilters]
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
        (s: any) => s.id.toString() === activeFilter
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
        selectedOrderForAttachments.id
      );
      setAttachments(orderData || []);

      // Fetch deal attachments if deal_id exists
      if (selectedOrderForAttachments.deal_id) {
        try {
          const dealData = await getDealAttachments(
            Number(selectedOrderForAttachments.deal_id)
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
        file.name
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
          attachmentId
        );
        await fetchAttachments(); // Refresh attachments list
        toast.success("Attachment deleted successfully!");
      } catch (error) {
        console.error("Failed to delete attachment:", error);
        toast.error("Failed to delete attachment");
      }
    },
    [selectedOrderForAttachments?.id]
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
        attachmentId
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
        attachmentId
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

  const handleViewOrder = useCallback(async (orderId: number) => {
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
                    leadData.contact_persons
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
        } catch (error) {
          console.error("Failed to fetch deal:", error);
          // Don't show error toast as deal is optional
        }
      }

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
    []
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
    setPaginationState: (state: any) => void
  ) => {
    const newDirection =
      paginationState.sortColumn === column &&
      paginationState.sortDirection === "asc"
        ? "desc"
        : "asc";
    setPaginationState({
      ...paginationState,
      sortColumn: column,
      sortDirection: newDirection,
      currentPage: 1,
    });
  };

  const sortData = <T extends Record<string, any>>(
    data: T[],
    sortColumn: string,
    sortDirection: "asc" | "desc"
  ): T[] => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (aVal === undefined) aVal = "";
      if (bVal === undefined) bVal = "";

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const paginateData = <T,>(
    data: T[],
    currentPage: number,
    rowsPerPage: number
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
    label: string
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
    if (paginationState.sortColumn !== column) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return paginationState.sortDirection === "asc" ? (
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
      currency: order.currency || "USD",
      approvalStatus: order.order_approval_status || null,
      fulfillmentStatus: order.fulfillment_status || null,
      paymentStatus: order.payment_status || null,
      //orderDate: formatDateForTable(order.order_date),
      orderDate: order.order_date ? moment(order.order_date).format(GlobalDateFormat) : '-',
      assignedUser:
        extensions.find(
          (ext: any) =>
            ext?.id == order?.assigned_to ||
            ext?.extension == order?.assigned_to
        )?.display_name ||
        extensions.find(
          (ext: any) =>
            ext?.id == order?.assigned_to ||
            ext?.extension == order?.assigned_to
        )?.name ||
        order.assigned_to ||
        "",
      expectedDeliveryDate: formatDateForTable(order.expected_delivery_date),
      actualDeliveryDate: formatDateForTable(order.actual_delivery_date),
      owner:
        extensions.find(
          (ext: any) =>
            ext?.id == order?.assigned_to ||
            ext?.extension == order?.assigned_to
        )?.display_name ||
        extensions.find(
          (ext: any) =>
            ext?.id == order?.assigned_to ||
            ext?.extension == order?.assigned_to
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
        o.fulfillmentStatus?.toLowerCase().includes("delivered")
    ).length;
    const inProgress = transformedOrders.filter((o) =>
      o.fulfillmentStatus?.toLowerCase().includes("progress")
    ).length;
    const pendingApproval = transformedOrders.filter((o) =>
      o.approvalStatus?.toLowerCase().includes("pending")
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
        (o) => o.stage === stage.name || o.rawData?.order_stage_id === stage.id
      );
      counts[stage.id] = stageOrders.length;
    });

    return counts;
  }, [ordersData, extensions, stages, summaryTiles, totalOrders]);

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
    menu: (provided: any) => ({
      ...provided,
      fontSize: "0.875rem",
    }),
  };

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
        mainLink="/crm/dashboard"
        subTitle="Orders"
      />
      <div>
        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Orders Management</h2>
            <p className="text-muted mb-0">Track and fulfill customer orders</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant={showOrdersAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowOrdersAnalytics(!showOrdersAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showOrdersAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
            <Button
            variant={showAdvancedFilters ? "secondary" : "outline-secondary"}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FiFilter size={16} className="me-2" />
            {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          </div>
        </div>

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
                            ([stage, count]) => ({ name: stage, value: count })
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
                            }
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
                          ([status, count]) => ({ status, count })
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
          // activeFilter={activeFilter}
          // onFilterChange={(filterId) => {
          //   setActiveFilter(filterId);
          //   setOrdersPagination({ ...ordersPagination, currentPage: 1 });
          // }}
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
                              (e: any) => (e.id || e.extension) === assignedToId
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
                      const assignedToValue = selected ? selected.value : null;
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
                              (st: any) => st.id.toString() === stageId
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
                          filtersToApply.order_approval_status = ordersFilters.orderApprovalStatus;
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

        {/* Column Customization */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <Layers size={16} className="me-2" />
              Customize Table
            </Dropdown.Toggle>
            <Dropdown.Menu
              align="end"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {[
                { key: "orderNumber", label: "Order Number" },
                { key: "customer", label: "Customer" },
                { key: "deal", label: "Linked Deal" },
                { key: "stage", label: "Stage" },
                { key: "value", label: "Value" },
                { key: "approvalStatus", label: "Approval Status" },
                { key: "fulfillmentStatus", label: "Fulfillment Status" },
                { key: "paymentStatus", label: "Payment Status" },
                { key: "assignedUser", label: "Assigned To" },
                { key: "orderDate", label: "Order Date" },
                { key: "owner", label: "Owner" },
                { key: "created", label: "Created" },
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedOrdersColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrdersColumns([
                          ...selectedOrdersColumns,
                          col.key,
                        ]);
                        localStorage.setItem(
                          "ordersSelectedColumns",
                          JSON.stringify([...selectedOrdersColumns, col.key])
                        );
                      } else {
                        const newCols = selectedOrdersColumns.filter(
                          (c) => c !== col.key
                        );
                        setSelectedOrdersColumns(newCols);
                        localStorage.setItem(
                          "ordersSelectedColumns",
                          JSON.stringify(newCols)
                        );
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() => {
                  const allCols = [
                    "orderNumber",
                    "customer",
                    "deal",
                    "stage",
                    "value",
                    "approvalStatus",
                    "fulfillmentStatus",
                    "paymentStatus",
                    "assignedUser",
                    "orderDate",
                    "owner",
                    "created",
                  ];
                  setSelectedOrdersColumns(allCols);
                  localStorage.setItem(
                    "ordersSelectedColumns",
                    JSON.stringify(allCols)
                  );
                }}
              >
                Select All
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => {
                  const defaultCols = [
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
                  setSelectedOrdersColumns(defaultCols);
                  localStorage.setItem(
                    "ordersSelectedColumns",
                    JSON.stringify(defaultCols)
                  );
                }}
              >
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Orders Table */}
        <Card
          className="border-0 shadow-sm orders-table-wrapper"
          style={{ width: "100%" }}
        >
          <Card.Body className="p-0" style={{ width: "100%" }}>
            <div className="table-responsive">
              <Table
                hover
                className="mb-0 w-100"
                style={{ width: "100%", margin: 0 }}
              >
                <thead className="bg-light">
                  <tr>
                    {selectedOrdersColumns.includes("orderNumber") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "orderNumber",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Order Number{" "}
                        {renderSortIcon("orderNumber", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("customer") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "customer",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Customer {renderSortIcon("customer", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("deal") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "deal",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Linked Deal {renderSortIcon("deal", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("stage") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "stage",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Stage {renderSortIcon("stage", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("value") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "value",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Value {renderSortIcon("value", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("approvalStatus") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "approvalStatus",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Approval{" "}
                        {renderSortIcon("approvalStatus", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("fulfillmentStatus") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "fulfillmentStatus",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Fulfillment{" "}
                        {renderSortIcon("fulfillmentStatus", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("paymentStatus") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "paymentStatus",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Payment{" "}
                        {renderSortIcon("paymentStatus", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("assignedUser") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "assignedUser",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Assigned To{" "}
                        {renderSortIcon("assignedUser", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("orderDate") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "orderDate",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Order Date{" "}
                        {renderSortIcon("orderDate", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("owner") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "owner",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Owner {renderSortIcon("owner", ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes("created") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "created",
                            ordersPagination,
                            setOrdersPagination
                          )
                        }
                      >
                        Created {renderSortIcon("created", ordersPagination)}
                      </th>
                    )}
                    <th style={{ width: "120px", minWidth: "120px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={selectedOrdersColumns.length + 1}
                        className="text-center py-4"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedOrdersColumns.length + 1}
                        className="text-center py-4 text-muted"
                      >
                        No orders found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    paginateData(
                      sortData(
                        filteredOrders,
                        ordersPagination.sortColumn,
                        ordersPagination.sortDirection
                      ),
                      ordersPagination.currentPage,
                      ordersPagination.rowsPerPage
                    ).map((order) => (
                      <tr 
                        key={order.id}
                        onDoubleClick={() => {
                          if (session?.user?.permissions?.includes("list-crm-orders")) {
                            handleViewOrder(order.rawData?.id || order.id);
                          }
                        }}
                        style={{
                          cursor: session?.user?.permissions?.includes("list-crm-orders") 
                            ? "pointer" 
                            : "default"
                        }}
                      >
                        {selectedOrdersColumns.includes("orderNumber") && (
                          <td className="fw-semibold">{order.orderNumber}</td>
                        )}
                        {selectedOrdersColumns.includes("customer") && (
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {order.customer ? (
                                <>
                                  <div
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "50%",
                                      backgroundColor: getRandomColor(
                                        order.customer
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
                                    {getInitials(order.customer)}
                                  </div>
                                  <div>
                                    <div className="fw-medium">
                                      {order.customer}
                                    </div>
                                    {order.customerEmail && (
                                      <small className="text-muted">
                                        {order.customerEmail}
                                      </small>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div>No Customer</div>
                              )}
                            </div>
                          </td>
                        )}
                        {selectedOrdersColumns.includes("deal") && (
                          <td>
                            <div>
                              <div className="fw-medium">
                                {order.deal || "No Deal"}
                              </div>
                            </div>
                          </td>
                        )}
                        {selectedOrdersColumns.includes("stage") && (
                          <td>
                            <span
                              style={{
                                backgroundColor: order?.stageColor || "grey",
                              }}
                              className="badge"
                            >
                              {order.stage}
                            </span>
                          </td>
                        )}
                        {selectedOrdersColumns.includes("value") && (
                          <td className="fw-semibold">
                            {order.currency}{" "}
                            {parseFloat(String(order.value)).toLocaleString()}
                          </td>
                        )}
                        {selectedOrdersColumns.includes("approvalStatus") && (
                          <td>
                            <Badge
                              bg={
                                order.approvalStatus?.toLowerCase() ===
                                "approved"
                                  ? "success"
                                  : order.approvalStatus?.toLowerCase() ===
                                    "rejected"
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {order.approvalStatus}
                            </Badge>
                          </td>
                        )}
                        {selectedOrdersColumns.includes(
                          "fulfillmentStatus"
                        ) && (
                          <td>
                            <Badge
                              bg={
                                order.fulfillmentStatus
                                  ?.toLowerCase()
                                  .includes("completed") ||
                                order.fulfillmentStatus
                                  ?.toLowerCase()
                                  .includes("delivered")
                                  ? "success"
                                  : order.fulfillmentStatus
                                      ?.toLowerCase()
                                      .includes("progress")
                                  ? "primary"
                                  : "secondary"
                              }
                            >
                              {order.fulfillmentStatus}
                            </Badge>
                          </td>
                        )}
                        {selectedOrdersColumns.includes("paymentStatus") && (
                          <td>
                            <Badge
                              bg={
                                order.paymentStatus?.toLowerCase() === "paid"
                                  ? "success"
                                  : order.paymentStatus?.toLowerCase() ===
                                    "partial"
                                  ? "warning"
                                  : "danger"
                              }
                            >
                              {order.paymentStatus}
                            </Badge>
                          </td>
                        )}
                        {selectedOrdersColumns.includes("assignedUser") && (
                          <td>{order.assignedUser || "-"}</td>
                        )}
                        {selectedOrdersColumns.includes("orderDate") && (
                          <td className="text-uppercase">{order.orderDate || "-"}</td>
                        )}
                        {selectedOrdersColumns.includes("owner") && (
                          <td>{order.owner || "-"}</td>
                        )}
                        {selectedOrdersColumns.includes("created") && (
                          <td>{order.created || "-"}</td>
                        )}
                        <td style={{ width: "120px", minWidth: "120px" }}>
                          <div className="d-flex gap-1">
                            {activeFilter === "deleted" ? (
                              <>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  title="View"
                                  onClick={() =>
                                    handleViewOrder(
                                      order.rawData?.id || order.id
                                    )
                                  }
                                >
                                  <Eye size={16} />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-success"
                                  title="Restore"
                                  onClick={() =>
                                    handleRestoreOrder(
                                      order.rawData?.id || order.id
                                    )
                                  }
                                >
                                  <RotateCcw size={16} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  title="View"
                                  onClick={() =>
                                    handleViewOrder(
                                      order.rawData?.id || order.id
                                    )
                                  }
                                >
                                  <Eye size={16} />
                                </Button>
                                {session?.user?.permissions?.includes(
                                  "edit-crm-orders"
                                ) && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-1"
                                    title="Edit"
                                    onClick={() =>
                                      (window.location.href = `/crm/orders/${
                                        order.rawData?.id || order.id
                                      }/edit`)
                                    }
                                  >
                                    <Edit size={16} />
                                  </Button>
                                )}
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-info"
                                  title="Manage Attachments"
                                  onClick={() => {
                                    setSelectedOrderForAttachments(
                                      order.rawData || order
                                    );
                                    setShowAttachmentModal(true);
                                  }}
                                >
                                  <Paperclip size={16} />
                                </Button>
                                {session?.user?.permissions?.includes(
                                  "delete-crm-orders"
                                ) && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-1 text-danger"
                                    title="Delete"
                                    onClick={() =>
                                      handleDeleteOrder(
                                        order.rawData?.id || order.id,
                                        order.orderNumber
                                      )
                                    }
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                                {activeFilter !== "lost" && (
                                  <Dropdown className="d-inline">
                                    <Dropdown.Toggle
                                      as={Button}
                                      variant="link"
                                      size="sm"
                                      className="p-1"
                                      title="More Actions"
                                    >
                                      <MoreVertical size={16} />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                      <Dropdown.Item
                                        className="text-danger"
                                        onClick={() =>
                                          handleMarkLost(order.rawData || order)
                                        }
                                      >
                                        <X size={14} className="me-2" />
                                        Lost
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-3">
              {renderPaginationControls(
                filteredOrders.length,
                ordersPagination,
                setOrdersPagination,
                "orders"
              )}
            </div>
          </Card.Body>
        </Card>
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
                    e.target.value ? Number(e.target.value) : null
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
        >
          {/* Custom Header */}
          <div
            style={{
              color: "black",
              padding: "30px",
              position: "relative",
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <button
              onClick={() => setShowOrderViewModal(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "black",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                e.currentTarget.style.transform = "rotate(90deg)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "rotate(0deg)";
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>
              {viewingOrder.order_number || `Order #${viewingOrder.id}`}
            </h3>
            <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
              Order Details
            </p>
          </div>

          <Modal.Body style={{ padding: "30px" }}>
            {loadingOrder ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Order Information Section */}
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: "20px",
                    paddingBottom: "10px",
                    borderBottom: "2px solid #f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <ShoppingBag size={18} style={{ color: "#4680ff" }} />
                  Order Information
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    marginBottom: "30px",
                  }}
                >
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}
                    >
                      Order Number
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      {viewingOrder.order_number || `ORD-${viewingOrder.id}`}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
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
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      <Badge
                        bg="secondary"
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor:
                            viewingOrder.stage?.color || "#6c757d",
                        }}
                      >
                        {viewingOrder.stage?.name || "Not assigned"}
                      </Badge>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}
                    >
                      Status
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      <Badge
                        bg={
                          viewingOrder.status?.toLowerCase() === "completed"
                            ? "success"
                            : viewingOrder.status?.toLowerCase() === "pending"
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
                        {viewingOrder.status || "N/A"}
                      </Badge>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}
                    >
                      Final Amount
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      {viewingOrder.currency || "USD"}{" "}
                      {parseFloat(
                        viewingOrder.final_amount ||
                          viewingOrder.total_amount ||
                          "0"
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}
                    >
                      Order Date
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      {viewingOrder.order_date
                        ? formatDateForTable(viewingOrder.order_date)
                        : "N/A"}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}
                    >
                      Expected Delivery
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      {viewingOrder.expected_delivery_date
                        ? formatDateForTable(
                            viewingOrder.expected_delivery_date
                          )
                        : "N/A"}
                    </div>
                  </div>
                  {viewingOrder.industry && (
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "10px",
                        transition: "all 0.3s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#e5e7eb";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#f8f9fa";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}
                      >
                        Industry
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#1f2937",
                          fontWeight: 500,
                        }}
                      >
                        {viewingOrder.industry}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Information */}
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: "20px",
                    paddingBottom: "10px",
                    borderBottom: "2px solid #f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <User size={18} style={{ color: "#4680ff" }} />
                  Customer Information
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    marginBottom: "30px",
                  }}
                >
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <User size={14} />
                      Customer Name
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                      className="d-flex align-items-center gap-2"
                    >
                      {viewingOrder.customer_name ? (
                        <>
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              backgroundColor: getRandomColor(
                                viewingOrder.customer_name
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
                        </>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                  {viewingOrder.customer_email && (
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "10px",
                        transition: "all 0.3s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#e5e7eb";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#f8f9fa";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Mail size={14} />
                        Email
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#1f2937",
                          fontWeight: 500,
                        }}
                      >
                        {viewingOrder.customer_email}
                      </div>
                    </div>
                  )}
                  {viewingOrder.customer_phone && (
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "10px",
                        transition: "all 0.3s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#e5e7eb";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#f8f9fa";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
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
                          fontSize: "15px",
                          color: "#1f2937",
                          fontWeight: 500,
                        }}
                      >
                        <PhoneDisplay
                          phone={viewingOrder.customer_phone || ""}
                        />
                      </div>
                    </div>
                  )}
                  {viewingOrder.customer_address && (
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "10px",
                        transition: "all 0.3s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#e5e7eb";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#f8f9fa";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
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
                          fontSize: "15px",
                          color: "#1f2937",
                          fontWeight: 500,
                        }}
                      >
                        {viewingOrder.customer_address}
                      </div>
                    </div>
                  )}
                </div>

                {/* Deal Information */}
                {relatedDeal && (
                  <>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1f2937",
                        marginBottom: "20px",
                        paddingBottom: "10px",
                        borderBottom: "2px solid #f8f9fa",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Link2 size={18} style={{ color: "#4680ff" }} />
                      Deal Information
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "20px",
                        marginBottom: "30px",
                      }}
                    >
                      <div
                        style={{
                          background: "#f8f9fa",
                          padding: "16px",
                          borderRadius: "10px",
                          transition: "all 0.3s",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#e5e7eb";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "#f8f9fa";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
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
                            fontSize: "15px",
                            color: "#1f2937",
                            fontWeight: 500,
                          }}
                        >
                          {relatedDeal.name || "N/A"}
                        </div>
                      </div>
                      {relatedDeal.stage && (
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
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
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            <Badge
                              bg="primary"
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor:
                                  relatedDeal.stage?.color || "#6c757d",
                              }}
                            >
                              {relatedDeal.stage?.name || "Not assigned"}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {relatedDeal.net_value && (
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
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
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            {relatedDeal.currency || "USD"}{" "}
                            {parseFloat(
                              String(
                                relatedDeal.net_value ||
                                  relatedDeal.grand_total ||
                                  0
                              )
                            ).toLocaleString()}
                          </div>
                        </div>
                      )}
                      {relatedDeal.assigned_to && (
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
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
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            <User
                              size={14}
                              style={{
                                color: "#4680ff",
                                marginRight: "6px",
                                display: "inline",
                              }}
                            />
                            {extensions.find(
                              (ext: any) =>
                                ext?.id == relatedDeal?.assigned_to ||
                                ext?.extension == relatedDeal?.assigned_to
                            )?.display_name ||
                              extensions.find(
                                (ext: any) =>
                                  ext?.id == relatedDeal?.assigned_to ||
                                  ext?.extension == relatedDeal?.assigned_to
                              )?.name ||
                              relatedDeal.assigned_to ||
                              "Not assigned"}
                          </div>
                        </div>
                      )}
                      {relatedDeal.created_at && (
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
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
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            <Calendar
                              size={14}
                              style={{
                                color: "#4680ff",
                                marginRight: "6px",
                                display: "inline",
                              }}
                            />
                            {relatedDeal.created_at
                              ? formatDateForTable(relatedDeal.created_at)
                              : "N/A"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Deal Company Information */}
                    {relatedDeal.company_name && (
                      <>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#1f2937",
                            marginBottom: "20px",
                            paddingBottom: "10px",
                            borderBottom: "2px solid #f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <Building2 size={18} style={{ color: "#4680ff" }} />
                          Deal Company Information
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                            marginBottom: "30px",
                          }}
                        >
                          <div
                            style={{
                              background: "#f8f9fa",
                              padding: "16px",
                              borderRadius: "10px",
                              transition: "all 0.3s",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#e5e7eb";
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "#f8f9fa";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Building2 size={14} />
                              Company Name
                            </div>
                            <div
                              style={{
                                fontSize: "15px",
                                color: "#1f2937",
                                fontWeight: 500,
                              }}
                            >
                              {relatedDeal.company_name}
                            </div>
                          </div>
                          {relatedDeal.industry && (
                            <div
                              style={{
                                background: "#f8f9fa",
                                padding: "16px",
                                borderRadius: "10px",
                                transition: "all 0.3s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "#e5e7eb";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = "#f8f9fa";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#6b7280",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  marginBottom: "6px",
                                }}
                              >
                                Industry
                              </div>
                              <div
                                style={{
                                  fontSize: "15px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                }}
                              >
                                {relatedDeal.industry}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Lead Information */}
                {relatedLead && (
                  <>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1f2937",
                        marginBottom: "20px",
                        paddingBottom: "10px",
                        borderBottom: "2px solid #f8f9fa",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Target size={18} style={{ color: "#4680ff" }} />
                      Lead Information
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "20px",
                        marginBottom: "30px",
                      }}
                    >
                      <div
                        style={{
                          background: "#f8f9fa",
                          padding: "16px",
                          borderRadius: "10px",
                          transition: "all 0.3s",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#e5e7eb";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "#f8f9fa";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
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
                            fontSize: "15px",
                            color: "#1f2937",
                            fontWeight: 500,
                          }}
                        >
                          {relatedLead.name}
                        </div>
                      </div>
                      {relatedLead.stage && (
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
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
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            <Badge
                              bg="primary"
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor:
                                  relatedLead.stage?.color || "#6c757d",
                              }}
                            >
                              {relatedLead.stage?.name || "Not assigned"}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {relatedLead.lead_potential && (
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
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
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            <Badge
                              bg={
                                relatedLead.lead_potential === "Hot"
                                  ? "danger"
                                  : relatedLead.lead_potential === "Warm"
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
                      {relatedLead.status && (
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: "6px",
                            }}
                          >
                            Status
                          </div>
                          <div
                            style={{
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            <Badge
                              bg={
                                relatedLead.is_lost
                                  ? "danger"
                                  : relatedLead.status === "new"
                                  ? "primary"
                                  : "success"
                              }
                            >
                              {relatedLead.is_lost
                                ? "Lost"
                                : relatedLead.status || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {relatedLead.user_extension && (
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
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
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            <User
                              size={14}
                              style={{
                                color: "#4680ff",
                                marginRight: "6px",
                                display: "inline",
                              }}
                            />
                            {extensions.find(
                              (ext: any) =>
                                ext?.id == relatedLead?.user_extension ||
                                ext?.extension == relatedLead?.user_extension
                            )?.display_name ||
                              extensions.find(
                                (ext: any) =>
                                  ext?.id == relatedLead?.user_extension ||
                                  ext?.extension == relatedLead?.user_extension
                              )?.name ||
                              relatedLead.user_extension ||
                              "Not assigned"}
                          </div>
                        </div>
                      )}
                      {relatedLead.created_at && (
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f8f9fa";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
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
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            <Calendar
                              size={14}
                              style={{
                                color: "#4680ff",
                                marginRight: "6px",
                                display: "inline",
                              }}
                            />
                            {relatedLead.created_at
                              ? formatDateForTable(relatedLead.created_at)
                              : "N/A"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lead Company Information */}
                    {/* {relatedLead.company_name && (
                      <>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '20px',
                          paddingBottom: '10px',
                          borderBottom: '2px solid #f8f9fa',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <Building2 size={18} style={{ color: '#4680ff' }} />
                          Lead Company Information
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '20px',
                          marginBottom: '30px'
                        }}>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '10px',
                            transition: 'all 0.3s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#e5e7eb';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px'
                            }}>Company Name</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              <Building2 size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                              {relatedLead.company_name}
                            </div>
                          </div>
                          {relatedLead.industry && (
                            <div style={{
                              background: '#f8f9fa',
                              padding: '16px',
                              borderRadius: '10px',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#e5e7eb';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '6px'
                              }}>Industry</div>
                              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                {relatedLead.industry}
                              </div>
                            </div>
                          )}
                          {relatedLead.business_type && (
                            <div style={{
                              background: '#f8f9fa',
                              padding: '16px',
                              borderRadius: '10px',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#e5e7eb';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '6px'
                              }}>Business Type</div>
                              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                {relatedLead.business_type}
                              </div>
                            </div>
                          )}
                          {relatedLead.company_size && (
                            <div style={{
                              background: '#f8f9fa',
                              padding: '16px',
                              borderRadius: '10px',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#e5e7eb';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '6px'
                              }}>Company Size</div>
                              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                {relatedLead.company_size}
                              </div>
                            </div>
                          )}
                          {(relatedLead.company_city || relatedLead.company_country) && (
                            <div style={{
                              background: '#f8f9fa',
                              padding: '16px',
                              borderRadius: '10px',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#e5e7eb';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '6px'
                              }}>Location</div>
                              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                {[relatedLead.company_city, relatedLead.company_country].filter(Boolean).join(', ') || 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )} */}

                    {/* Campaign Information */}
                    {relatedLead.campaign && (
                      <>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#1f2937",
                            marginBottom: "20px",
                            paddingBottom: "10px",
                            borderBottom: "2px solid #f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <FileText size={18} style={{ color: "#4680ff" }} />
                          Campaign Information
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                            marginBottom: "30px",
                          }}
                        >
                          <div
                            style={{
                              background: "#f8f9fa",
                              padding: "16px",
                              borderRadius: "10px",
                              transition: "all 0.3s",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#e5e7eb";
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "#f8f9fa";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
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
                                fontSize: "15px",
                                color: "#1f2937",
                                fontWeight: 500,
                              }}
                            >
                              {relatedLead.campaign.name}
                            </div>
                          </div>
                          {relatedLead.campaign_field_values &&
                            Object.keys(relatedLead.campaign_field_values)
                              .length > 0 &&
                            Object.entries(
                              relatedLead.campaign_field_values
                            ).map(([key, value]: [string, any]) => (
                              <div
                                key={key}
                                style={{
                                  background: "#f8f9fa",
                                  padding: "16px",
                                  borderRadius: "10px",
                                  transition: "all 0.3s",
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = "#e5e7eb";
                                  e.currentTarget.style.transform =
                                    "translateY(-2px)";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = "#f8f9fa";
                                  e.currentTarget.style.transform =
                                    "translateY(0)";
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
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
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 500,
                                  }}
                                >
                                  {String(value)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </>
                    )}

                    {/* Prospect Information */}
                    {relatedLead.crm_data && (
                      <>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#1f2937",
                            marginBottom: "20px",
                            paddingBottom: "10px",
                            borderBottom: "2px solid #f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <FileText size={18} style={{ color: "#4680ff" }} />
                          Prospect Information
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                            marginBottom: "30px",
                          }}
                        >
                          {relatedLead.crm_data.id && (
                            <div
                              style={{
                                background: "#f8f9fa",
                                padding: "16px",
                                borderRadius: "10px",
                                transition: "all 0.3s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "#e5e7eb";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = "#f8f9fa";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
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
                                  fontSize: "15px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                }}
                              >
                                #{relatedLead.crm_data.id}
                              </div>
                            </div>
                          )}
                          <div
                            style={{
                              background: "#f8f9fa",
                              padding: "16px",
                              borderRadius: "10px",
                              transition: "all 0.3s",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#e5e7eb";
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "#f8f9fa";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
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
                                fontSize: "15px",
                                color: "#1f2937",
                                fontWeight: 500,
                              }}
                            >
                              {relatedLead.crm_data.name ||
                                (relatedLead.crm_data.data &&
                                  relatedLead.crm_data.data.name) ||
                                "N/A"}
                            </div>
                          </div>
                          <div
                            style={{
                              background: "#f8f9fa",
                              padding: "16px",
                              borderRadius: "10px",
                              transition: "all 0.3s",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#e5e7eb";
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "#f8f9fa";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
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
                                fontSize: "15px",
                                color: "#1f2937",
                                fontWeight: 500,
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
                            <div
                              style={{
                                background: "#f8f9fa",
                                padding: "16px",
                                borderRadius: "10px",
                                transition: "all 0.3s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "#e5e7eb";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = "#f8f9fa";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
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
                                  fontSize: "15px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                }}
                              >
                                {relatedLead.crm_data.source_file}
                              </div>
                            </div>
                          )}
                          {relatedLead.crm_data.uploaded_by && (
                            <div
                              style={{
                                background: "#f8f9fa",
                                padding: "16px",
                                borderRadius: "10px",
                                transition: "all 0.3s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "#e5e7eb";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = "#f8f9fa";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#6b7280",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  marginBottom: "6px",
                                }}
                              >
                                Uploaded By
                              </div>
                              <div
                                style={{
                                  fontSize: "15px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                }}
                              >
                                <User
                                  size={14}
                                  style={{
                                    color: "#4680ff",
                                    marginRight: "6px",
                                    display: "inline",
                                  }}
                                />
                                {relatedLead.crm_data.uploaded_by}
                              </div>
                            </div>
                          )}
                          {relatedLead.crm_data.created_at && (
                            <div
                              style={{
                                background: "#f8f9fa",
                                padding: "16px",
                                borderRadius: "10px",
                                transition: "all 0.3s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "#e5e7eb";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = "#f8f9fa";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#6b7280",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  marginBottom: "6px",
                                }}
                              >
                                Created At
                              </div>
                              <div
                                style={{
                                  fontSize: "15px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                }}
                              >
                                <Calendar
                                  size={14}
                                  style={{
                                    color: "#4680ff",
                                    marginRight: "6px",
                                    display: "inline",
                                  }}
                                />
                                {formatDateForTable(
                                  relatedLead.crm_data.created_at
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Prospect Fields */}
                        {relatedLead.crm_data.data &&
                          typeof relatedLead.crm_data.data === "object" &&
                          Object.keys(relatedLead.crm_data.data).length > 0 && (
                            <>
                              <div
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 600,
                                  color: "#1f2937",
                                  marginBottom: "20px",
                                  paddingBottom: "10px",
                                  borderBottom: "2px solid #f8f9fa",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <FileText
                                  size={18}
                                  style={{ color: "#4680ff" }}
                                />
                                Prospect Fields
                              </div>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fit, minmax(250px, 1fr))",
                                  gap: "20px",
                                  marginBottom: "30px",
                                }}
                              >
                                {Object.entries(relatedLead.crm_data.data)
                                  .filter(([key]) => {
                                    // Show all fields, but if name/phone are already shown from crm_data directly,
                                    // only show them from data if they're not in crm_data
                                    const keyLower = key.toLowerCase();
                                    if (
                                      keyLower === "name" &&
                                      relatedLead.crm_data.name
                                    )
                                      return false;
                                    if (
                                      keyLower === "phone" &&
                                      relatedLead.crm_data.phone
                                    )
                                      return false;
                                    return true;
                                  })
                                  .map(([key, value]: [string, any]) => (
                                    <div
                                      key={key}
                                      style={{
                                        background: "#f8f9fa",
                                        padding: "16px",
                                        borderRadius: "10px",
                                        transition: "all 0.3s",
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.background =
                                          "#e5e7eb";
                                        e.currentTarget.style.transform =
                                          "translateY(-2px)";
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.background =
                                          "#f8f9fa";
                                        e.currentTarget.style.transform =
                                          "translateY(0)";
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          color: "#6b7280",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.5px",
                                          marginBottom: "6px",
                                        }}
                                      >
                                        {key.replace(/_/g, " ")}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "15px",
                                          color: "#1f2937",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {String(value || "N/A")}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </>
                          )}
                      </>
                    )}
                  </>
                )}

                {/* Order Items/Products */}
                {viewingOrder.items &&
                  Array.isArray(viewingOrder.items) &&
                  viewingOrder.items.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#1f2937",
                          marginBottom: "20px",
                          paddingBottom: "10px",
                          borderBottom: "2px solid #f8f9fa",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <Package size={18} style={{ color: "#4680ff" }} />
                        Order Items ({viewingOrder.items.length})
                      </div>
                      <div
                        style={{
                          marginBottom: "30px",
                          width: "100%",
                          overflowX: "auto",
                        }}
                      >
                        <div
                          className="table-responsive custom-table-order"
                          style={{ width: "100%" }}
                        >
                          <Table
                            hover
                            style={{
                              width: "100%",
                              marginBottom: 0,
                              tableLayout: "auto",
                            }}
                          >
                            <thead style={{ background: "#f8f9fa" }}>
                              <tr>
                                <th>#</th>
                                <th>Product Name</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                {viewingOrder.items.some(
                                  (item: any) => item.description
                                ) && <th>Description</th>}
                                <th>Unit Price</th>
                                <th
                                  style={{
                                    maxWidth: "100px",
                                    minWidth: "unset",
                                  }}
                                >
                                  Total Price
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {viewingOrder.items.map(
                                (item: any, index: number) => (
                                  <tr key={item.id || index}>
                                    <td>{index + 1}</td>
                                    <td className="fw-semibold">
                                      {item.product_name ||
                                        item.product?.name ||
                                        "N/A"}
                                    </td>
                                    <td>{item.product?.sku || "N/A"}</td>
                                    <td>{item.quantity || "0"}</td>
                                    {viewingOrder.items.some(
                                      (i: any) => i.description
                                    ) && (
                                      <td
                                        style={{
                                          maxWidth: "200px",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {item.description || "-"}
                                      </td>
                                    )}
                                    <td>
                                      {viewingOrder.currency || "USD"}{" "}
                                      {parseFloat(
                                        item.unit_price || "0"
                                      ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td
                                      style={{
                                        maxWidth: "100px",
                                        minWidth: "unset",
                                      }}
                                      className="fw-semibold"
                                    >
                                      {viewingOrder.currency || "USD"}{" "}
                                      {parseFloat(
                                        item.total_price || "0"
                                      ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                            <tfoot
                              style={{ background: "#f8f9fa", fontWeight: 600 }}
                            >
                              <tr>
                                <td
                                  colSpan={
                                    viewingOrder.items.some(
                                      (item: any) => item.description
                                    )
                                      ? 6
                                      : 5
                                  }
                                  className="text-end"
                                >
                                  Subtotal:
                                </td>
                                <td
                                  style={{
                                    maxWidth: "100px",
                                    minWidth: "unset",
                                  }}
                                >
                                  {viewingOrder.currency || "USD"}{" "}
                                  {parseFloat(
                                    viewingOrder.total_amount || "0"
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                              {viewingOrder.discount_amount &&
                                parseFloat(viewingOrder.discount_amount) >
                                  0 && (
                                  <tr>
                                    <td
                                      colSpan={
                                        viewingOrder.items.some(
                                          (item: any) => item.description
                                        )
                                          ? 6
                                          : 5
                                      }
                                      className="text-end"
                                    >
                                      Discount:
                                    </td>
                                    <td
                                      style={{
                                        maxWidth: "100px",
                                        minWidth: "unset",
                                      }}
                                    >
                                      - {viewingOrder.currency || "USD"}{" "}
                                      {parseFloat(
                                        viewingOrder.discount_amount
                                      ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                  </tr>
                                )}
                              {viewingOrder.tax_amount &&
                                parseFloat(viewingOrder.tax_amount) > 0 && (
                                  <tr>
                                    <td
                                      colSpan={
                                        viewingOrder.items.some(
                                          (item: any) => item.description
                                        )
                                          ? 6
                                          : 5
                                      }
                                      className="text-end"
                                    >
                                      Tax:
                                    </td>
                                    <td
                                      style={{
                                        maxWidth: "100px",
                                        minWidth: "unset",
                                      }}
                                    >
                                      {viewingOrder.currency || "USD"}{" "}
                                      {parseFloat(
                                        viewingOrder.tax_amount
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
                                      (item: any) => item.description
                                    )
                                      ? 6
                                      : 5
                                  }
                                  className="text-end"
                                >
                                  Total:
                                </td>
                                <td
                                  style={{
                                    maxWidth: "100px",
                                    minWidth: "unset",
                                  }}
                                >
                                  {viewingOrder.currency || "USD"}{" "}
                                  {parseFloat(
                                    viewingOrder.final_amount ||
                                      viewingOrder.total_amount ||
                                      "0"
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
                    </>
                  )}

                {/* Additional Order Details */}
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: "20px",
                    paddingBottom: "10px",
                    borderBottom: "2px solid #f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <FileText size={18} style={{ color: "#4680ff" }} />
                  Additional Information
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    marginBottom: "30px",
                  }}
                >
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
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
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
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
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
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
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
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
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
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
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
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
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "10px",
                        transition: "all 0.3s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#e5e7eb";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#f8f9fa";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}
                      >
                        Assigned To
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: 600 }}>
                        {extensions.find(
                          (ext: any) =>
                            ext?.id == viewingOrder?.assigned_to ||
                            ext?.extension == viewingOrder?.assigned_to
                        )?.display_name ||
                          extensions.find(
                            (ext: any) =>
                              ext?.id == viewingOrder?.assigned_to ||
                              ext?.extension == viewingOrder?.assigned_to
                          )?.name ||
                          viewingOrder.assigned_to ||
                          "Not assigned"}
                      </div>
                    </div>
                  )}
                  {viewingOrder.contract_length && (
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "10px",
                        transition: "all 0.3s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#e5e7eb";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#f8f9fa";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
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
                          fontSize: "15px",
                          color: "#1f2937",
                          fontWeight: 500,
                        }}
                      >
                        {viewingOrder.contract_length}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {viewingOrder.notes && (
                  <>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1f2937",
                        marginBottom: "20px",
                        paddingBottom: "10px",
                        borderBottom: "2px solid #f8f9fa",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <FileText size={18} style={{ color: "#4680ff" }} />
                      Notes
                    </div>
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "16px",
                        borderRadius: "10px",
                        marginBottom: "30px",
                        fontSize: "14px",
                        color: "#1f2937",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {viewingOrder.notes}
                    </div>
                  </>
                )}

                {/* History */}
                {viewingOrder.histories &&
                  Array.isArray(viewingOrder.histories) &&
                  viewingOrder.histories.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#1f2937",
                          marginBottom: "20px",
                          paddingBottom: "10px",
                          borderBottom: "2px solid #f8f9fa",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <History size={18} style={{ color: "#4680ff" }} />
                        Activity History ({viewingOrder.histories.length})
                      </div>
                      <div
                        style={{
                          position: "relative",
                          paddingLeft: "30px",
                          marginBottom: "30px",
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
                                paddingBottom: "20px",
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
                                      : "#4680ff",
                                  border: "3px solid white",
                                  boxShadow: "0 0 0 2px #e5e7eb",
                                }}
                              />
                              <div
                                style={{
                                  background: "#f8f9fa",
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
                                    history.created_at
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
                                  Object.keys(history.changes).length > 0 && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#6b7280",
                                      }}
                                    >
                                      {Object.entries(history.changes).map(
                                        ([key, change]: [string, any]) => {
                                          if (ignoredKeys.includes(key)) {
                                            return <></>;
                                          }
                                          return (
                                            <div
                                              key={key}
                                              style={{ marginTop: "4px" }}
                                            >
                                              <strong>{key}:</strong>{" "}
                                              {change.old
                                                ? `${change.old} → `
                                                : ""}
                                              {change.new || "N/A"}
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    paddingTop: "20px",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  {session?.user?.permissions?.includes("edit-crm-orders") && (
                    <Button
                      variant="primary"
                      style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        fontWeight: 500,
                        fontSize: "14px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#4680ff",
                        border: "none",
                      }}
                      onClick={() => {
                        setShowOrderViewModal(false);
                        window.location.href = `/crm/orders/${viewingOrder.id}/edit`;
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#3b6ce5";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(70, 128, 255, 0.4)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#4680ff";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <Edit size={16} />
                      Edit Order
                    </Button>
                  )}
                  <Button
                    variant="outline-secondary"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontWeight: 500,
                      fontSize: "14px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                    onClick={() => setShowOrderViewModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </Modal.Body>
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
                                  "pdf"
                                )
                                  ? "#dc3545"
                                  : attachment.mime_type?.includes("csv") ||
                                    attachment.mime_type?.includes("excel") ||
                                    attachment.mime_type?.includes(
                                      "spreadsheet"
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
                                      "pdf"
                                    )
                                      ? "#dc3545"
                                      : attachment.mime_type?.includes("csv") ||
                                        attachment.mime_type?.includes(
                                          "excel"
                                        ) ||
                                        attachment.mime_type?.includes(
                                          "spreadsheet"
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
                                    style={{
                                      fontSize: "12px",
                                      color: "#6c757d",
                                    }}
                                  >
                                    {formatFileSize(attachment.file_size)} •{" "}
                                    {attachment.created_at
                                      ? formatDateForTable(
                                          attachment.created_at
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
    </React.Fragment>
  );
};

CrmOrders.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmOrders;
