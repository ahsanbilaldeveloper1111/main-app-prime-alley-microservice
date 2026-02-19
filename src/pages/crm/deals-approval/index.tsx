import "@assets/scss/datatable-style.scss";
import parsePhoneNumber from "libphonenumber-js";
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
  ToolbarConfig,
  FilterPill,
  TabConfig,
} from "@components/GenericTable";
import GenericSidebar from '@components/GenericSidebarNew';
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import ConvertToOrderModal from "@components/ConvertToOrderModal";
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
  getDeals,
  getStages,
  deleteDeal,
  restoreDeal,
  getDeal,
  getDealAttachments,
  uploadDealAttachment,
  deleteDealAttachment,
  downloadDealAttachment,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  markDealLost,
  getLead,
  updateDeal,
  approveDeal,
  rejectDeal,
  getCrmProducts,
  getCampaignById,
  getIndustries,
  getBusinessTypes,
  createEstimate,
  CrmProduct,
  StageData,
  IndustryData,
  DealTemplateData,
  DealTemplateField,
  BusinessTypeData,
  PDFDownloadDeal,
  getDealFollowUps,
  createDealFollowUp,
  updateDealFollowUp,
  deleteDealFollowUp,
  getDealMeetings
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
  Spinner,
  
} from "react-bootstrap";
import Select from 'react-select';
import { GlobalDateFormat, GlobalDateTimeFormat, ModuleSlug, formatDateForTable, checkRequiredFields } from "@utils/Helper";
import {
  Target,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Trash2,
  Handshake,
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
  ShoppingBag,
  History,
  GitBranch,
  MessageSquare,
  Send,
  UserCheck,
  User,
  Building2,
  Mail,
  Phone,
  Paperclip,
  Upload,
  Download as DownloadIcon,
  AlertCircle,
  RotateCcw,
  Percent,
  Package,
  RefreshCw,
  ArrowLeft,
  Copy,
  Trash,
  Phone as PhoneIcon,
  Check,
  CheckSquare,
  XCircle,
} from 'lucide-react';
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

} from 'recharts';
import Link from "next/link";
import { toast } from "react-toastify";
import moment from "moment";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber as parsePhoneNumberLib } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import FormModal from "../../partial/FormModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";

const ignoredKeys = ["stage_id"];
// Phone Container Component (with Badge for tables)
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

const KPICard: React.FC<KPICardData> = ({ title, value, change, isPositive, icon, color, onClick }) => {
  return (
    <Card 
      className={onClick ? 'h-100' : ''} 
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: '1px solid #e9ecef'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
            <div className={`text-${color}`}>{icon}</div>
          </div>
          {change && (
            <Badge bg={isPositive ? 'success' : 'danger'} className="bg-opacity-10">
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
  quickFilters: { id: string; label: string; count: number; variant?: string; color?: string; icon?: React.ReactNode }[];
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
  advancedFilterCount = 0
}) => {
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3">
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map(filter => {
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
                  buttonStyle.background = '#fff';
                  buttonStyle.borderColor = filter.color;
                  buttonStyle.color = filter.color;
                }
              }

              return (
                <Button
                  key={filter.id}
                  variant={hasCustomColor ? undefined : (isActive ? (filter.variant || 'primary') : 'outline-secondary')}
                  onClick={() => onFilterChange && onFilterChange(filter.id)}
                  className="d-flex align-items-center gap-2"
                  style={hasCustomColor ? buttonStyle : undefined}
                >
                  {filter.icon && <span className="d-flex align-items-center">{filter.icon}</span>}
                  {filter.label}
                </Button>
              );
            })}
          </div>

          {/* <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
            <InputGroup style={{ width: '300px', minWidth: '200px' }} className="flex-shrink-0">
              <Form.Control
                style={{ height: '41px' }}
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onSearch();
                  }
                }}
              />
              <Button 
                variant="outline-secondary"
                onClick={onSearch}
              >
                <Search size={16} />
              </Button>
            </InputGroup>
            <Button 
              variant={showAdvancedFilters ? 'primary' : 'outline-secondary'}
              onClick={onToggleAdvancedFilters}
              className="d-flex align-items-center flex-shrink-0"
            >
              <Filter size={16} className="me-2" />
              Filters
              {advancedFilterCount > 0 && (
                <Badge bg="light" text="dark" className="ms-2">
                  {advancedFilterCount}
                </Badge>
              )}
            </Button>
          </div> */}
        </div>
      </Card.Body>
    </Card>
  );
};

const CrmDeals = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({ approval_status: 'pending' });
  const [dealsData, setDealsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDeals, setTotalDeals] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);
  
  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<any>(null);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalDescription, setSuccessModalDescription] = useState('');
  
  // View Modal
  const [showDealViewModal, setShowDealViewModal] = useState(false);
  const [viewingDeal, setViewingDeal] = useState<any>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [showDealHistoryModal, setShowDealHistoryModal] = useState(false);
  const [relatedLead, setRelatedLead] = useState<any>(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general-info");
  
  // Sidebar states
  const [showDealSidebar, setShowDealSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Attachments Modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedDealForAttachments, setSelectedDealForAttachments] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  
  // Delete Attachment Modal
  const [showDeleteAttachmentModal, setShowDeleteAttachmentModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{ id: number; name: string } | null>(null);
  
  // Download file modal (table column)
  const [showDownloadFileModal, setShowDownloadFileModal] = useState(false);
  const [dealForDownload, setDealForDownload] = useState<any>(null);
  
  // Follow-up Modal
  const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);
  const [followUpIdToEdit, setFollowUpIdToEdit] = useState<number | null>(null);
  const [followupData, setFollowupData] = useState({
    dealId: null as number | null,
    dealName: "",
    followUpDate: "",
    followUpStatus: "Pending",
    communicationChannel: "Phone Call",
    communicationChannelOther: "",
    notes: "",
    userExtension: "",
  });
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);

  // Delete Follow-up Modal
  const [showDeleteFollowUpModal, setShowDeleteFollowUpModal] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<{ dealId: number; followUpId: number; label?: string } | null>(null);
  
  // Meeting Modal
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [meetingIdToEdit, setMeetingIdToEdit] = useState<number | null>(null);
  const [meetingData, setMeetingData] = useState({
    dealId: null as number | null,
    dealName: '',
    meetingName: '',
    meetingType: 'Online',
    meetingDate: '',
    meetingTime: '',
    meetingOutcome: '',
    extensions: [] as string[],
  });
  const [meetingAttendees, setMeetingAttendees] = useState<readonly any[]>([]);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  
  // Delete Meeting Modal
  const [showDeleteMeetingModal, setShowDeleteMeetingModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<{ meetingId: number; meetingName?: string; dealId?: number } | null>(null);
  
  // Mark Deal Lost Modal
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [dealToMarkLost, setDealToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");
  
  // Edit Deal Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDealId, setEditingDealId] = useState<number | null>(null);
  const [editFormStep, setEditFormStep] = useState(0);
  const [editLoading, setEditLoading] = useState(false);
  const [editFetching, setEditFetching] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    ticket_id: null as number | null,
    stage_id: undefined as number | undefined,
    assigned_to: null as string | null,
    expected_close_date: "",
    company_name: "",
    industry_ids: [] as number[],
    decision_maker_title: "",
    decision_maker_name: "",
    decision_maker_phone_country_code: "",
    decision_maker_phone: "",
    decision_maker_email: "",
    deal_type: "",
    contract_length: "",
    contract_length_custom: "",
    billing_model: "",
    payment_terms: "",
    payment_terms_custom: "",
    risk_level: "",
    competitors: "",
    quotation_sent: false,
    contract_sent: false,
    contract_received: false,
    follow_up_date: "",
    currency: "AED",
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
    last_approved_at: null as string | null,
    approval_status: null as string | null,
  });
  const [editProducts, setEditProducts] = useState<CrmProduct[]>([]);
  const [editLoadingProducts, setEditLoadingProducts] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any>(null);
  const [editCampaignIndustries, setEditCampaignIndustries] = useState<IndustryData[]>([]);
  const [editSelectedIndustryId, setEditSelectedIndustryId] = useState<number | null>(null);
  const [editLoadingIndustries, setEditLoadingIndustries] = useState(false);
  const [editAllIndustries, setEditAllIndustries] = useState<IndustryData[]>([]);
  const [editLoadingAllIndustries, setEditLoadingAllIndustries] = useState(false);
  const [editSourceLead, setEditSourceLead] = useState<any>(null);
  const [editDealTemplate, setEditDealTemplate] = useState<DealTemplateData | null>(null);
  const [editTemplateFieldsData, setEditTemplateFieldsData] = useState<Record<string, any>>({});
  const [editBusinessTypes, setEditBusinessTypes] = useState<BusinessTypeData[]>([]);
  const [editBusinessTypeId, setEditBusinessTypeId] = useState<number | null>(null);
  const [editBusinessTypeOther, setEditBusinessTypeOther] = useState<string>("");
  const [editShowOtherBusinessType, setEditShowOtherBusinessType] = useState(false);
  const [editShowAllIndustries, setEditShowAllIndustries] = useState(false);
  const [editEstimationItems, setEditEstimationItems] = useState<Array<{
    product_id: number;
    product_service: string;
    description: string;
    qty: number;
    unit_price: number;
    original_currency: string;
    original_price: number;
  }>>([]);
  const [editShowAddItemModal, setEditShowAddItemModal] = useState(false);
  const [editEditingItemIndex, setEditEditingItemIndex] = useState<number | null>(null);
  const [editItemFormData, setEditItemFormData] = useState({
    product_id: null as number | null,
    product_service: "",
    description: "",
    qty: 1,
    unit_price: 0,
  });
  // Add/Edit Revision modal (replaces Add Item for Estimation step)
  const [editShowAddRevisionModal, setEditShowAddRevisionModal] = useState(false);
  const [editEditingRevisionIndex, setEditEditingRevisionIndex] = useState<number | null>(null);
  const [editRevisionProducts, setEditRevisionProducts] = useState<Array<{
    product_id: number;
    product_service: string;
    description: string;
    qty: number;
    unit_price: number;
    original_currency: string;
    original_price: number;
    tax_percentage: string;
    standard_discount_percentage: string;
    special_discount_percentage: string;
  }>>([]);
  const [editRevisionFormData, setEditRevisionFormData] = useState({
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
  });
  const [editRevisionProductsCatalog, setEditRevisionProductsCatalog] = useState<CrmProduct[]>([]);
  const [editRevisionLoadingProducts, setEditRevisionLoadingProducts] = useState(false);
  const [editRevisionSelectedProductIds, setEditRevisionSelectedProductIds] = useState<Array<{ value: number; label: string }>>([]);
  const [editShowRevisionHistoryModal, setEditShowRevisionHistoryModal] = useState(false);
  const [editConvertingPrice, setEditConvertingPrice] = useState(false);
  const [editEstimates, setEditEstimates] = useState<any[]>([]);
  const [editAttachments, setEditAttachments] = useState<any[]>([]);
  const [editHistories, setEditHistories] = useState<any[]>([]);
  const [editNegotiationBar, setEditNegotiationBar] = useState(0);
  const [editProbability, setEditProbability] = useState(0);
  
  const [showConvertToOrderModal, setShowConvertToOrderModal] = useState(false);
  const [dealToConvert, setDealToConvert] = useState<number | null>(null);
  
  // UI State
  const [showDealsAnalytics, setShowDealsAnalytics] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dealsSearch, setDealsSearch] = useState('');
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [selectedDealsColumns, setSelectedDealsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('dealsSelectedColumns');
    return saved ? JSON.parse(saved) : ['name', 'company', 'stage', 'approvalStatus', 'dealType', 'value', 'assignedUser', 'closeDate', 'owner'];
  });
  const [dealsPagination, setDealsPagination] = useState({ currentPage: 1, rowsPerPage: 15, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [serverPaginationMeta, setServerPaginationMeta] = useState<{ total: number; current_page: number; per_page: number; last_page: number } | null>(null);
  const [dealsFilters, setDealsFilters] = useState({
    assignedTo: null as string | null,
    approvalStatus: null as string | null,
    stage: null as string | null,
    followUpDateFrom: null as string | null,
    followUpDateTo: null as string | null,
    probabilityMin: null as string | null,
    probabilityMax: null as string | null,
    dealType: null as string | null,
    industry: null as string | null,
    expectedCloseDateFrom: null as string | null,
    expectedCloseDateTo: null as string | null,
  });


  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchStages();
    fetchLostReasons();
    fetchExtensions(ModuleSlug.CRM_DEALS);
  }, []);

  // Fetch deals when filters or search change
  const fetchDeals = useCallback(
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
        if (currentFilters.follow_up_date_from) {
          params.follow_up_date_from = currentFilters.follow_up_date_from;
        }
        if (currentFilters.follow_up_date_to) {
          params.follow_up_date_to = currentFilters.follow_up_date_to;
        }
        if (currentFilters.probability_min) {
          params.probability_min = currentFilters.probability_min;
        }
        if (currentFilters.probability_max) {
          params.probability_max = currentFilters.probability_max;
        }
        if (currentFilters.deal_type) {
          params.deal_type = currentFilters.deal_type;
        }
        if (currentFilters.industry) {
          params.industry = currentFilters.industry;
        }
        if (currentFilters.expected_close_date_from) {
          params.expected_close_date_from = currentFilters.expected_close_date_from;
        }
        if (currentFilters.expected_close_date_to) {
          params.expected_close_date_to = currentFilters.expected_close_date_to;
        }
        if (currentFilters.approval_status) {
          params.approval_status = currentFilters.approval_status;
        }

        const response: any = await getDeals(params);
        console.log("Raw response from getDeals:", response);

        const dealsArray: any[] = response?.dataList || [];
        const pagination: any = response?.meta || {};
        const summary: any = response?.summary_tiles || null;
        
        setDealsData(Array.isArray(dealsArray) ? dealsArray : []);
        setTotalDeals(pagination?.total || 0);
        setSummaryTiles(summary);
        
        // Update server pagination meta
        if (pagination && pagination.total !== undefined) {
          setServerPaginationMeta({
            total: pagination.total || 0,
            current_page: pagination.current_page || 1,
            per_page: pagination.per_page || 5,
            last_page: pagination.last_page || 1
          });
          
          // Sync local pagination state with server response
          setDealsPagination(prev => ({
            ...prev,
            currentPage: pagination.current_page || prev.currentPage,
            rowsPerPage: pagination.per_page || prev.rowsPerPage
          }));
        }

        return response;
      } finally {
        setLoading(false);
      }
    },
    [currentFilters]
  );

  // Handle activeFilter changes to update currentFilters and stage dropdown
  useEffect(() => {
    if (activeFilter === 'all') {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.stage_id;
        delete newFilters.include_archived;
        delete newFilters.include_lost;
        return newFilters;
      });
      // Clear stage dropdown
      setDealsFilters(prev => ({
        ...prev,
        stage: null
      }));
    } else if (activeFilter === 'lost') {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.stage_id;
        delete newFilters.include_archived;
        newFilters.include_lost = true;
        return newFilters;
      });
      // Clear stage dropdown
      setDealsFilters(prev => ({
        ...prev,
        stage: null
      }));
    } else if (activeFilter === 'deleted') {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.stage_id;
        delete newFilters.include_lost;
        newFilters.include_archived = true;
        return newFilters;
      });
      // Clear stage dropdown
      setDealsFilters(prev => ({
        ...prev,
        stage: null
      }));
    } else if (activeFilter && stages.length > 0) {
      // Find stage by id (activeFilter should be stage id as string)
      const selectedStage = stages.find((s: any) => s.id.toString() === activeFilter);
      if (selectedStage) {
        setCurrentFilters((prev) => {
          const newFilters = { ...prev };
          delete newFilters.include_archived;
          delete newFilters.include_lost;
          newFilters.stage_id = selectedStage.id.toString();
          return newFilters;
        });
        // Auto-fill stage dropdown
        setDealsFilters(prev => ({
          ...prev,
          stage: selectedStage.id.toString()
        }));
      }
    }
  }, [activeFilter, stages]);
  
  // Read tab from URL on mount and when router is ready
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const tabFromUrl = String(router.query.tab);
      // Allow "all", "lost", "deleted", or any stage ID
      const isValidFilter = tabFromUrl === 'all' || tabFromUrl === 'lost' || tabFromUrl === 'deleted' || 
        (stages.length > 0 && stages.some((s: any) => s.id.toString() === tabFromUrl));
      if (isValidFilter && tabFromUrl !== activeFilter) {
        setActiveFilter(tabFromUrl);
      }
    }
  }, [router.isReady, router.query.tab, stages, activeFilter]);
  
  // Handler to update filter and URL
  const handleFilterChange = useCallback((filterId: string) => {
    setActiveFilter(filterId);
    setDealsPagination((prev) => ({ ...prev, currentPage: 1 }));
    
    // Update URL with tab query parameter
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: filterId }
      },
      undefined,
      { shallow: true }
    );
  }, [router]);

  useEffect(() => {
    fetchDeals(dealsPagination.currentPage, dealsPagination.rowsPerPage);
  }, [refreshKey, currentFilters, dealsPagination.currentPage, dealsPagination.rowsPerPage, fetchDeals]);

  // Fetch attachments when modal opens
  useEffect(() => {
    if (showAttachmentModal && selectedDealForAttachments?.id) {
      fetchAttachments();
    } else {
      setAttachments([]);
    }
  }, [showAttachmentModal, selectedDealForAttachments?.id]);

  const fetchAttachments = async () => {
    if (!selectedDealForAttachments?.id) return;
    setLoadingAttachments(true);
    try {
      const data = await getDealAttachments(selectedDealForAttachments.id);
      setAttachments(data || []);
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedDealForAttachments?.id) return;
    
    setUploadingFile(true);
    try {
      await uploadDealAttachment(selectedDealForAttachments.id, file, file.name);
      await fetchAttachments(); // Refresh attachments list
      if (fileInputRef) {
        fileInputRef.value = '';
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = useCallback(async (attachmentId: number) => {
    if (!selectedDealForAttachments?.id) return;
    
    try {
      await deleteDealAttachment(selectedDealForAttachments.id, attachmentId);
      await fetchAttachments(); // Refresh attachments list
      toast.success("Attachment deleted successfully!");
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      toast.error("Failed to delete attachment");
    }
  }, [selectedDealForAttachments?.id]);

  const confirmDeleteAttachment = useCallback(async () => {
    if (!attachmentToDelete) return;
    
    await handleDeleteAttachment(attachmentToDelete.id);
    setShowDeleteAttachmentModal(false);
    setAttachmentToDelete(null);
  }, [attachmentToDelete, handleDeleteAttachment]);

  const handleDownloadAttachment = async (attachmentId: number) => {
    if (!selectedDealForAttachments?.id) return;
    
    try {
      await downloadDealAttachment(selectedDealForAttachments.id, attachmentId);
    } catch (error) {
      console.error("Failed to download attachment:", error);
    }
  };

  // Handle open filters sidebar
  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters((prev) => {
      const newFilters = { ...prev };
      
      // Handle stage_id filter (single value)
      if ('stage_id' in filters) {
        if (filters.stage_id) {
          newFilters.stage_id = String(filters.stage_id);
        } else {
          delete newFilters.stage_id;
        }
      }
      
      // Handle assigned_to filter (single value)
      if ('assigned_to' in filters) {
        if (filters.assigned_to) {
          newFilters.assigned_to = String(filters.assigned_to);
        } else {
          delete newFilters.assigned_to;
        }
      }
      
      // Handle search
      if ('search' in filters) {
        if (filters.search) {
          newFilters.search = filters.search;
        } else {
          delete newFilters.search;
        }
      }
      
      // Handle is_lost filter
      if ('is_lost' in filters) {
        newFilters.is_lost = filters.is_lost;
      }
      
      // Handle include_lost filter
      if ('include_lost' in filters) {
        if (filters.include_lost) {
          newFilters.include_lost = true;
        } else {
          delete newFilters.include_lost;
        }
      }
      
      // Handle include_archived filter
      if ('include_archived' in filters) {
        if (filters.include_archived) {
          newFilters.include_archived = true;
        } else {
          delete newFilters.include_archived;
        }
      }
      
      // Handle follow_up_date_from filter
      if ('follow_up_date_from' in filters) {
        if (filters.follow_up_date_from) {
          newFilters.follow_up_date_from = filters.follow_up_date_from;
        } else {
          delete newFilters.follow_up_date_from;
        }
      }
      
      // Handle follow_up_date_to filter
      if ('follow_up_date_to' in filters) {
        if (filters.follow_up_date_to) {
          newFilters.follow_up_date_to = filters.follow_up_date_to;
        } else {
          delete newFilters.follow_up_date_to;
        }
      }
      
      // Handle probability_min filter
      if ('probability_min' in filters) {
        if (filters.probability_min) {
          newFilters.probability_min = String(filters.probability_min);
        } else {
          delete newFilters.probability_min;
        }
      }
      
      // Handle probability_max filter
      if ('probability_max' in filters) {
        if (filters.probability_max) {
          newFilters.probability_max = String(filters.probability_max);
        } else {
          delete newFilters.probability_max;
        }
      }
      
      // Handle deal_type filter
      if ('deal_type' in filters) {
        if (filters.deal_type) {
          newFilters.deal_type = filters.deal_type;
        } else {
          delete newFilters.deal_type;
        }
      }

      // Handle approval_status filter
      if ('approval_status' in filters) {
        if (filters.approval_status) {
          newFilters.approval_status = filters.approval_status;
        } else {
          delete newFilters.approval_status;
        }
      }
      
      // Handle industry filter
      if ('industry' in filters) {
        if (filters.industry) {
          newFilters.industry = filters.industry;
        } else {
          delete newFilters.industry;
        }
      }
      
      // Handle expected_close_date_from filter
      if ('expected_close_date_from' in filters) {
        if (filters.expected_close_date_from) {
          newFilters.expected_close_date_from = filters.expected_close_date_from;
        } else {
          delete newFilters.expected_close_date_from;
        }
      }
      
      // Handle expected_close_date_to filter
      if ('expected_close_date_to' in filters) {
        if (filters.expected_close_date_to) {
          newFilters.expected_close_date_to = filters.expected_close_date_to;
        } else {
          delete newFilters.expected_close_date_to;
        }
      }
      
      return newFilters;
    });
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages('deal');
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchLostReasons = async () => {
    try {
      const lostReasonsData = await (getStages as any)('lost_reason');
      setLostReasons(lostReasonsData || []);
    } catch (error) {
      console.error("Failed to fetch lost reasons:", error);
    }
  };

  const fetchExtensions = async (moduleSlug: string = ModuleSlug.CRM_DEALS) => {
    try {
      const hierarchyData = await GetHierarchyData(moduleSlug);
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
    } catch (error) {
      console.error("Failed to fetch extensions:", error);
    }
  };

  // Handle view deal
  const handleViewDeal = useCallback(async (dealId: number) => {
    try {
      setLoadingDeal(true);
      setLoadingLead(true);
      setRelatedLead(null);
      const dealData: any = await getDeal(dealId);
      setViewingDeal(dealData);
      
      // Fetch lead information if ticket_id exists (ticket_id contains the lead_id)
      if (dealData.ticket_id) {
        try {
          const leadData: any = await getLead(Number(dealData.ticket_id));
          
          // Parse contact_persons if it's a string
          if (leadData.contact_persons && typeof leadData.contact_persons === 'string') {
            try {
              leadData.contact_persons = JSON.parse(leadData.contact_persons);
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
      
      setShowDealViewModal(true);
    } catch (error) {
      console.error("Failed to fetch deal:", error);
      toast.error("Failed to load deal details");
    } finally {
      setLoadingDeal(false);
      setLoadingLead(false);
    }
  }, []);

  const [dealMeetings, setDealMeetings] = useState<any[]>([]);
  const [loadingDealMeetings, setLoadingDealMeetings] = useState(false);

  const fetchDealMeetings = useCallback(async (dealId: number) => {
    try {
      setLoadingDealMeetings(true);
      const dealMeetings  = await getDealMeetings({deal_id: dealId});
      setDealMeetings(dealMeetings?.data || []);
    } catch (error) {
      console.error("Failed to fetch deal meetings:", error);
    } finally {
      setLoadingDealMeetings(false);
    }
  }, []);

  const [dealFollowUps, setDealFollowUps] = useState<any[]>([]);
  const [loadingDealFollowUps, setLoadingDealFollowUps] = useState(false);

  const fetchDealFollowUps = useCallback(async (dealId: number) => {
    try {
      setLoadingDealFollowUps(true);
      const dealFollowUps  = await getDealFollowUps(dealId);
      console.log("dealFollowUps", dealFollowUps);
      setDealFollowUps(dealFollowUps || [] as any);
    } catch (error) {

    } finally {
      setLoadingDealFollowUps(false);
    }
  }, []);

  const handleRowClicked = useCallback(async (dealId: number) => {
    try {
      const dealData: any = await getDeal(dealId);
      setSelectedDeal(dealData);
      setShowDealSidebar(true);

      await fetchDealFollowUps(dealId);
      await fetchDealMeetings(dealId);

    } catch (error) {
      console.error("Failed to fetch deal:", error);
      toast.error("Failed to load deal details");
    }
  }, [fetchDealFollowUps, fetchDealMeetings]);

  const handlePreviewClick = useCallback(async (deal: any) => {
    const dealId = deal.rawData?.id || deal.id;
    // Set the deal immediately to show sidebar
    setSelectedDeal(deal.rawData || deal);
    setShowDealSidebar(true);
    
    // Fetch additional data (follow-ups, meetings) in the background
    if (dealId) {
      try {
        await fetchDealFollowUps(dealId);
        await fetchDealMeetings(dealId);
        // Optionally refresh the deal data to get latest info
        const dealData: any = await getDeal(dealId);
        setSelectedDeal(dealData);
      } catch (error) {
        console.error("Failed to fetch deal details:", error);
        // Don't show error toast as sidebar is already open with basic data
      }
    }
  }, [fetchDealFollowUps, fetchDealMeetings]);

  // Handle first column click - navigates to detail page
  const handleFirstColumnClick = useCallback((deal: any) => {
      router.push('/crm/deals-approval/approval-detailpage');
  }, [router]);

  const handleCallClick = useCallback(async (deal: any) => {
    const phone = deal?.phone || deal?.rawData?.phone || relatedLead?.phone;
    if (!phone) {
      toast.error("No phone number available for this deal");
      return;
    }
    // Handle call logic here - similar to leads page
    // This might integrate with CTI or open a phone dialer
    console.log("Calling:", phone);
  }, [relatedLead]);

  const handleNoteCreate = useCallback((note: string, createTask: boolean, taskDueDate?: string) => {
    console.log('Note created:', {
      dealId: selectedDeal?.id || selectedDeal?.rawData?.id,
      note,
      createTask,
      taskDueDate
    });
    // Implement note creation logic here
    toast.success('Note created successfully');
  }, [selectedDeal]);

  const handleCloseDealSidebar = useCallback(() => {
    setShowDealSidebar(false);
    setSelectedDeal(null);
  }, []);

  const handleDeleteDeal = useCallback((dealId: number, dealName?: string) => {
    setDealToDelete({ id: dealId, name: dealName });
    setShowDeleteModal(true);
  }, []);

  // Handle meeting creation
  const handleCreateMeeting = useCallback(async () => {
    if (!meetingData.dealId || !meetingData.meetingName || !meetingData.meetingDate || !meetingData.meetingTime) return;
    
    setLoadingMeeting(true);
    try {
      const payload: any = {
        name: meetingData.meetingName,
        meeting_type: meetingData.meetingType,
        meeting_date: meetingData.meetingDate,
        meeting_time: meetingData.meetingTime,
        deal_id: String(meetingData.dealId),
        meeting_outcome: "Scheduled", // Default to "Scheduled" when creating
        extensions: meetingAttendees.length > 0 ? meetingAttendees.map((user: any) => user.value) : [(session?.user as any)?.extension || 'admin'],
      };
      
      await createMeeting(payload);
      
      // Refresh deal data
     // if (viewingDeal?.id === meetingData.dealId) {
       // await handleRowClicked(meetingData.dealId);
        await fetchDealMeetings(meetingData.dealId);
     // }
      
      // Reset form and close modal
      setShowAddMeetingModal(false);
      setMeetingIdToEdit(null);
      setMeetingData({
        dealId: null,
        dealName: '',
        meetingName: '',
        meetingType: 'Online',
        meetingDate: '',
        meetingTime: '',
        meetingOutcome: '',
        extensions: [],
      });
      setMeetingAttendees([]);
      
      // Refresh deals list
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to create meeting:", error);
    } finally {
      setLoadingMeeting(false);
    }
  }, [meetingData, meetingAttendees, session, viewingDeal, handleViewDeal]);

  // Handle meeting update
  const handleUpdateMeeting = useCallback(async () => {
    if (!meetingIdToEdit || !meetingData.meetingName || !meetingData.meetingDate || !meetingData.meetingTime) return;
    
    setLoadingMeeting(true);
    try {
      const payload: any = {
        name: meetingData.meetingName,
        meeting_type: meetingData.meetingType,
        meeting_date: meetingData.meetingDate,
        meeting_time: meetingData.meetingTime,
        extensions: meetingAttendees.length > 0 ? meetingAttendees.map((user: any) => user.value) : [],
      };
      
      if (meetingData.meetingOutcome) {
        payload.meeting_outcome = meetingData.meetingOutcome;
      }
      
      await updateMeeting(meetingIdToEdit, payload);
      
      // Refresh deal data
      if (viewingDeal?.id === meetingData.dealId && meetingData.dealId) {
       // await handleRowClicked(meetingData.dealId);
        await fetchDealMeetings(meetingData.dealId);
      }
      
      // Reset form and close modal
      setShowAddMeetingModal(false);
      setMeetingIdToEdit(null);
      setMeetingData({
        dealId: null,
        dealName: '',
        meetingName: '',
        meetingType: 'Online',
        meetingDate: '',
        meetingTime: '',
        meetingOutcome: '',
        extensions: [],
      });
      setMeetingAttendees([]);
      
      // Refresh deals list
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to update meeting:", error);
    } finally {
      setLoadingMeeting(false);
    }
  }, [meetingIdToEdit, meetingData, meetingAttendees, viewingDeal, handleViewDeal]);

  // Handle edit meeting click
  const handleEditMeeting = useCallback((meeting: any) => {
    // Format date for input (YYYY-MM-DD)
    const meetingDate = meeting.meeting_date
      ? new Date(meeting.meeting_date).toISOString().split("T")[0]
      : "";

    // Format time for input (HH:MM)
    const meetingTime = meeting.meeting_time || "";

    // Set attendees from meeting extensions
    // meeting.extensions is an array of objects with 'extension' property (e.g., { extension: "511", ... })
    const meetingExtensionStrings = meeting.extensions && Array.isArray(meeting.extensions)
      ? meeting.extensions.map((extObj: any) => extObj.extension || String(extObj.id))
      : [];
    
    const attendees = meetingExtensionStrings.length > 0
      ? extensions
          .filter((ext: any) => {
            // Match by extension string or ID (convert to string for comparison)
            const extExtension = String(ext.extension || "");
            const extId = String(ext.id || "");
            return meetingExtensionStrings.some((meetingExt: string) => 
              meetingExt === extExtension || meetingExt === extId
            );
          })
          .map((ext: any) => ({
            value: ext.id || ext.extension,
            label: ext.display_name || ext.name || ext.id || ext.extension,
          }))
      : [];

    setMeetingIdToEdit(meeting.id);
    setMeetingData({
      dealId: viewingDeal?.id || null,
      dealName: viewingDeal?.name || "",
      meetingName: meeting.name || "",
      meetingType: meeting.meeting_type || "Online",
      meetingDate: meetingDate,
      meetingTime: meetingTime,
      meetingOutcome: meeting.meeting_outcome || "",
      extensions: meetingExtensionStrings, // Store extension strings, not objects
    });
    setMeetingAttendees(attendees);
    setShowAddMeetingModal(true);
  }, [viewingDeal, extensions]);

  const getTodayDate = useCallback((startDateParam: string = "") => {
    let today = new Date();
    if(startDateParam)
      {
       const startDate = new Date(startDateParam);
       if (moment(startDate).isBefore(today))
       {
        today = startDate;
       }
      }
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Handle meeting deletion
  const handleDeleteMeeting = useCallback((meetingId: number, meetingName?: string) => {
    setMeetingToDelete({ meetingId, meetingName });
    setShowDeleteMeetingModal(true);
  }, []);

  const confirmDeleteMeeting = useCallback(async () => {
    if (!meetingToDelete) return;
    
    try {
      await deleteMeeting(meetingToDelete.meetingId);
      
      // Refresh deal data
      if (meetingToDelete.dealId) {
        await fetchDealMeetings(meetingToDelete.dealId);
      }
      
      // Refresh deals list
      setRefreshKey((oldKey) => oldKey + 1);
      
      setShowDeleteMeetingModal(false);
      setMeetingToDelete(null);
      toast.success("Meeting deleted successfully!");
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      toast.error("Failed to delete meeting");
    }
  }, [meetingToDelete, fetchDealMeetings]);

  const handleCreateFollowUp = useCallback(async () => {
    const isValid = checkRequiredFields(followupData, [
      { field: "dealId", name: "Deal" },
      { field: "followUpDate", name: "Follow-up Date" },
      { field: "communicationChannel", name: "Communication Channel" },
    ]);
    if (
      followupData.communicationChannel === "Other" &&
      !followupData.communicationChannelOther?.trim()
    ) {
      toast.error("Please specify the communication channel");
      return;
    }
    if (!isValid) return;

    setLoadingFollowUp(true);
    try {
      const dealId = followupData.dealId!;
      const followUp: any = await createDealFollowUp(dealId, {
        follow_up_date: followupData.followUpDate,
        communication_channel: followupData.communicationChannel,
        communication_channel_other: followupData.communicationChannelOther,
        notes: followupData.notes
      });
      if(followUp) {
        setShowAddFollowupModal(false);
        setFollowUpIdToEdit(null);
        setFollowupData({
          dealId: null,
          dealName: "",
          followUpDate: "",
          followUpStatus: "Pending",
          communicationChannel: "Phone Call",
          communicationChannelOther: "",
          notes: "",
          userExtension: "",
        });
       // handleRowClicked(dealId);
        await fetchDealFollowUps(dealId);
      } 
      
    } catch (error) {
      console.error("Failed to save follow-up:", error);
      toast.error("Failed to save follow-up");
    } finally {
      setLoadingFollowUp(false);
    }
  }, [followupData, fetchDealFollowUps]);

  const handleUpdateFollowUp = useCallback(async () => {
    const isValid = checkRequiredFields(followupData, [
      { field: "dealId", name: "Deal" },
      { field: "followUpDate", name: "Follow-up Date" },
      { field: "communicationChannel", name: "Communication Channel" },
    ]);
    if (
      followupData.communicationChannel === "Other" &&
      !followupData.communicationChannelOther?.trim()
    ) {
      toast.error("Please specify the communication channel");
      return;
    }
    if (!followUpIdToEdit || !isValid) return;

    setLoadingFollowUp(true);
    try {
      const dealId = followupData.dealId!;
      const followUp: any = await updateDealFollowUp(dealId, followUpIdToEdit, {
        follow_up_date: followupData.followUpDate,
        communication_channel: followupData.communicationChannel,
        communication_channel_other: followupData.communicationChannelOther,
        notes: followupData.notes,
      });
      if(followUp) {
        setShowAddFollowupModal(false);
        setFollowUpIdToEdit(null);
        setFollowupData({
          dealId: null,
          dealName: "",
          followUpDate: "",
          followUpStatus: "Pending",
          communicationChannel: "Phone Call",
          communicationChannelOther: "",
          notes: "",
          userExtension: "",
        });
        //handleRowClicked(dealId);
        await fetchDealFollowUps(dealId);
      }


    } catch (error) {
      console.error("Failed to update follow-up:", error);
      toast.error("Failed to update follow-up");
    } finally {
      setLoadingFollowUp(false);
    }
  }, [followUpIdToEdit, followupData, fetchDealFollowUps]);

  const handleDeleteFollowUp = useCallback(async (dealId: number, followUpId: number) => {
    try {
      await deleteDealFollowUp(dealId, followUpId);
      await fetchDealFollowUps(dealId);
    } catch (error) {
      console.error("Failed to delete follow-up:", error);
    }
  }, [fetchDealFollowUps]);

  const confirmDeleteFollowUp = useCallback(async () => {
    if (!followUpToDelete) return;
    try {
      await handleDeleteFollowUp(followUpToDelete.dealId, followUpToDelete.followUpId);
      await fetchDealFollowUps(followUpToDelete.dealId);
      setShowDeleteFollowUpModal(false);
      setFollowUpToDelete(null);
      
    } catch (error) {
      console.error("Failed to delete follow-up:", error);
    }
  }, [followUpToDelete, handleDeleteFollowUp]);

  const handleDownloadDeal = useCallback(async (dealId: number) => {
    try {
      await PDFDownloadDeal(dealId);
    } catch (error) {
      console.error("Failed to download deal:", error);
      toast.error("Failed to download deal");
    }
  }, []);

  const confirmDeleteDeal = useCallback(async () => {
    if (!dealToDelete) return;

    try {
      await deleteDeal(dealToDelete.id);
      setShowDeleteModal(false);
      setDealToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Deal Deleted");
      setSuccessModalDescription("Deal has been deleted successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to delete deal:", error);
    }
  }, [dealToDelete]);

  // Restore Deal Handler
  const handleRestoreDeal = useCallback(async (dealId: number) => {
    if (!window.confirm('Are you sure you want to restore this deal?')) return;

    try {
      await restoreDeal(dealId);
      toast.success("Deal restored successfully!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Deal Restored");
      setSuccessModalDescription("Deal has been restored successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to restore deal:", error);
      toast.error("Failed to restore deal");
    }
  }, []);

  // Mark Deal Lost Modal
  const handleMarkLost = useCallback((deal: any) => {
    setDealToMarkLost(deal);
    setShowMarkLostModal(true);
  }, []);

  const handleMarkLostSubmit = useCallback(async () => {
    if (!dealToMarkLost || !lostReasonId || !lostFeedback.trim()) return;

    try {
      await markDealLost(dealToMarkLost.id, {
        lost_reason_id: lostReasonId,
        lost_feedback: lostFeedback,
      });
      setShowMarkLostModal(false);
      setDealToMarkLost(null);
      setLostReasonId(null);
      setLostFeedback("");
      toast.success("Deal marked as lost!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Deal Marked as Lost");
      setSuccessModalDescription("Deal has been marked as lost successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to mark deal as lost:", error);
    }
  }, [dealToMarkLost, lostReasonId, lostFeedback]);

  const handleApproveDeal = useCallback(async (deal: any) => {
    const dealId = deal?.id ?? deal?.rawData?.id;
    if (!dealId) return;
    try {
      await approveDeal(dealId);
      toast.success("Deal approved successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to approve deal:", error);
      toast.error("Failed to approve deal");
    }
  }, []);

  const handleRejectDeal = useCallback(async (deal: any) => {
    const dealId = deal?.id ?? deal?.rawData?.id;
    if (!dealId) return;
    try {
      await rejectDeal(dealId);
      toast.success("Deal rejected successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to reject deal:", error);
      toast.error("Failed to reject deal");
    }
  }, []);

  // Edit Deal Handlers
const handleEditDeal = useCallback(async (dealId: number) => {
  setEditingDealId(dealId);
  setEditFetching(true);
  setShowEditModal(true);
  
  try {
    // Fetch deal data
    const deal = await getDeal(dealId);
    
    // Format dates for input fields
    const formatDate = (dateString: string | null) => {
      if (!dateString) return "";
      return dateString.split('T')[0];
    };
    // Set form data
    setEditFormData({
      name: deal.name || "",
      ticket_id: deal.ticket_id ? Number(deal.ticket_id) : null,
      stage_id: deal.stage_id ? Number(deal.stage_id) : undefined,
      assigned_to: deal.assigned_to || null,
      expected_close_date: formatDate(deal.expected_close_date),
      company_name: deal.company_name || "",
      industry_ids: (deal as any).industry_ids && Array.isArray((deal as any).industry_ids) 
        ? (deal as any).industry_ids.map((id: any) => Number(id)).filter((id: number) => !Number.isNaN(id))
        : (deal as any).industries && Array.isArray((deal as any).industries)
        ? (deal as any).industries.map((ind: any) => typeof ind === 'object' ? Number(ind.id) : Number(ind)).filter((id: number) => !Number.isNaN(id))
        : [],
      decision_maker_title: deal.decision_maker_title || "",
      decision_maker_name: deal.decision_maker_name || (deal as any).main_decision_maker?.name || "",
      decision_maker_phone_country_code: deal.decision_maker_phone_country_code || (deal as any).main_decision_maker?.phone_country_code || "",
      decision_maker_phone: deal.decision_maker_phone || (deal as any).main_decision_maker?.phone || "",
      decision_maker_email: (deal as any).main_decision_maker?.email || "",
      deal_type: deal.deal_type || "",
      contract_length: deal.contract_length || "",
      contract_length_custom: deal.contract_length_custom || "",
      billing_model: deal.billing_model || "",
      payment_terms: deal.payment_terms || "",
      payment_terms_custom: deal.payment_terms_custom || "",
      risk_level: deal.risk_level || "",
      competitors: deal.competitors || "",
      quotation_sent: deal.quotation_sent || false,
      contract_sent: deal.contract_sent || false,
      contract_received: deal.contract_received || false,
      follow_up_date: formatDate(deal.follow_up_date),
      currency: deal.currency || "AED",
      tax_percentage: (deal as any).tax_percentage?.toString() || "0",
      standard_discount_percentage: (deal as any).standard_discount_percentage?.toString() || "0",
      special_discount_percentage: (deal as any).special_discount_percentage?.toString() || "0",
      last_approved_at: null,
      approval_status: null,
    });
    // Set business type
    const dealAny = deal as any;
    // Set approval fields if they exist
    if (dealAny.last_approved_at !== undefined) {
      setEditFormData(prev => ({ ...prev, last_approved_at: dealAny.last_approved_at }));
    }
    if (dealAny.approval_status !== undefined) {
      setEditFormData(prev => ({ ...prev, approval_status: dealAny.approval_status }));
    }
    if (dealAny.business_type_id) {
      setEditBusinessTypeId(Number(dealAny.business_type_id));
      setEditBusinessTypeOther("");
      setEditShowOtherBusinessType(false);
    } else if (dealAny.business_type_other) {
      setEditBusinessTypeId(null);
      setEditBusinessTypeOther(dealAny.business_type_other);
      setEditShowOtherBusinessType(true);
    }
    // Fetch lead data if ticket_id exists
    if (deal.ticket_id) {
      try {
        const leadData: any = await getLead(Number(deal.ticket_id));
        setEditSourceLead(leadData);
      } catch (error) {
        console.error("Failed to fetch lead:", error);
      }
    }
    // Set deal template
    const dealTemplateData = (deal as any).deal_template;
    if (dealTemplateData) {
      setEditDealTemplate(dealTemplateData);
      const dealTemplateFieldValues = (deal as any).deal_template_field_values || {};
      setEditTemplateFieldsData(dealTemplateFieldValues);
    }
    // Set estimates and other data
    const sortedEstimates = deal.estimates && deal.estimates.length > 0
      ? [...deal.estimates].sort((a: any, b: any) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        })
      : [];
    setEditEstimates(sortedEstimates);
    setEditAttachments((deal as any).attachments || []);
    setEditHistories((deal as any).histories || []);
    setEditNegotiationBar(deal.negotiation_bar || 0);
    setEditProbability(deal.probability || 0);
    // Load estimation chart from the most recent estimate
    if (sortedEstimates.length > 0) {
      const latestEstimate = sortedEstimates[0];
      
      if (latestEstimate.tax_percentage) {
        setEditFormData(prev => ({ ...prev, tax_percentage: latestEstimate.tax_percentage.toString() }));
      }
      if (latestEstimate.standard_discount_percentage) {
        setEditFormData(prev => ({ ...prev, standard_discount_percentage: latestEstimate.standard_discount_percentage.toString() }));
      }
      if (latestEstimate.special_discount_percentage) {
        setEditFormData(prev => ({ ...prev, special_discount_percentage: latestEstimate.special_discount_percentage.toString() }));
      }
      
      if (latestEstimate.estimation_chart && latestEstimate.estimation_chart.length > 0) {
        setEditEstimationItems(latestEstimate.estimation_chart.map((item: any) => ({
          product_id: item.product_id || 0,
          product_service: item.product_service || "",
          description: item.description || "",
          qty: item.qty || 1,
          unit_price: item.unit_price || 0,
          original_currency: item.original_currency || deal.currency || "AED",
          original_price: item.original_price || item.unit_price || 0,
        })));
      }
    } else if (deal.estimation_chart && Array.isArray(deal.estimation_chart) && deal.estimation_chart.length > 0) {
      setEditEstimationItems(deal.estimation_chart.map((item: any) => ({
        product_id: item.product_id || 0,
        product_service: item.product_service || "",
        description: item.description || "",
        qty: item.qty || 1,
        unit_price: item.unit_price || 0,
        original_currency: item.original_currency || deal.currency || "AED",
        original_price: item.original_price || item.unit_price || 0,
      })));
    }
    // Fetch business types
    try {
      const businessTypesResponse = await getBusinessTypes({ per_page: 1000 });
      setEditBusinessTypes(businessTypesResponse?.data || []);
    } catch (error) {
      console.error("Failed to fetch business types:", error);
    }
    // Fetch all industries
    try {
      const response = await getIndustries({ per_page: 1000 });
      setEditAllIndustries(response.data || []);
    } catch (error) {
      console.error("Failed to fetch industries:", error);
    }
    
  } catch (error) {
    console.error("Failed to fetch deal:", error);
    toast.error("Failed to load deal data");
    setShowEditModal(false);
  } finally {
    setEditFetching(false);
  }
}, []);
const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!editingDealId) return;
  setEditLoading(true);
  try {
    const payload: any = {
      name: editFormData.name,
      stage_id: editFormData.stage_id ? String(editFormData.stage_id) : undefined,
      assigned_to: editFormData.assigned_to,
      expected_close_date: editFormData.expected_close_date,
      company_name: editFormData.company_name,
      industry_ids: editFormData.industry_ids,
      ...(editBusinessTypeId ? { business_type_id: String(editBusinessTypeId) } : {}),
      ...(editBusinessTypeOther ? { business_type_other: editBusinessTypeOther } : {}),
      decision_maker_title: editFormData.decision_maker_title,
      decision_maker_name: editFormData.decision_maker_name,
      decision_maker_phone_country_code: editFormData.decision_maker_phone_country_code,
      decision_maker_phone: editFormData.decision_maker_phone,
      decision_maker_email: editFormData.decision_maker_email,
      deal_type: editFormData.deal_type,
      contract_length: editFormData.contract_length,
      contract_length_custom: editFormData.contract_length_custom || "",
      billing_model: editFormData.billing_model,
      payment_terms: editFormData.payment_terms,
      payment_terms_custom: editFormData.payment_terms_custom || "",
      risk_level: editFormData.risk_level,
      competitors: editFormData.competitors || "",
      quotation_sent: editFormData.quotation_sent,
      contract_sent: editFormData.contract_sent,
      contract_received: editFormData.contract_received,
      follow_up_date: editFormData.follow_up_date || "",
      currency: editFormData.currency,
      negotiation_bar: editNegotiationBar,
      probability: editProbability,
    };
    // Add deal template data if template exists
    if (editDealTemplate && editDealTemplate.id) {
      payload.deal_template_id = editDealTemplate.id;
      Object.entries(editTemplateFieldsData).forEach(([key, value]) => {
        payload[`deal_template_field_values[${key}]`] = value;
      });
    }
    if (editFormData.ticket_id) {
      payload.ticket_id = editFormData.ticket_id;
    }
    // Update deal
    await updateDeal(editingDealId, payload);
    // Create/update estimation chart if items exist
    if (editEstimationItems.length > 0) {
      const estimatePayload = {
        deal_id: editingDealId,
        estimation_chart: editEstimationItems.map(item => ({
          product_id: item.product_id,
          product_service: item.product_service,
          description: item.description || "",
          qty: item.qty,
          unit_price: item.unit_price,
          original_currency: item.original_currency || editFormData.currency,
          original_price: item.original_price || item.unit_price,
        })),
        standard_discount_percentage: parseFloat(editFormData.standard_discount_percentage || "0"),
        special_discount_percentage: parseFloat(editFormData.special_discount_percentage || "0"),
        tax_percentage: parseFloat(editFormData.tax_percentage || "0"),
        currency: editFormData.currency,
      };
      await createEstimate(estimatePayload, false);
    }
    toast.success("Deal updated successfully!");
    setShowEditModal(false);
    setRefreshKey((oldKey) => oldKey + 1);
    
    // Reset form
    setEditFormStep(0);
    setEditingDealId(null);
  } catch (error: any) {
    console.error("Failed to update deal:", error);
    toast.error("Failed to update deal");
  } finally {
    setEditLoading(false);
  }
}, [editingDealId, editFormData, editBusinessTypeId, editBusinessTypeOther, editDealTemplate, editTemplateFieldsData, editNegotiationBar, editProbability, editEstimationItems]);
const handleCloseEditModal = useCallback(() => {
  setShowEditModal(false);
  setEditFormStep(0);
  setEditingDealId(null);
  // Reset all edit states
  setEditFormData({
    name: "",
    ticket_id: null,
    stage_id: undefined,
    assigned_to: null,
    expected_close_date: "",
    company_name: "",
    industry_ids: [],
    decision_maker_title: "",
    decision_maker_name: "",
    decision_maker_phone_country_code: "",
    decision_maker_phone: "",
    decision_maker_email: "",
    deal_type: "",
    contract_length: "",
    contract_length_custom: "",
    billing_model: "",
    payment_terms: "",
    payment_terms_custom: "",
    risk_level: "",
    competitors: "",
    quotation_sent: false,
    contract_sent: false,
    contract_received: false,
    follow_up_date: "",
      currency: "AED",
      tax_percentage: "0",
      standard_discount_percentage: "0",
      special_discount_percentage: "0",
      last_approved_at: null,
      approval_status: null,
    });
  setEditEstimationItems([]);
  setEditProducts([]);
  setEditDealTemplate(null);
  setEditTemplateFieldsData({});
  setEditBusinessTypeId(null);
  setEditBusinessTypeOther("");
  setEditShowOtherBusinessType(false);
}, []);

  // Helper functions
  const handleSort = (column: string, paginationState: any, setPaginationState: (state: any) => void) => {
    const newDirection = paginationState.sortColumn === column && paginationState.sortDirection === 'asc' ? 'desc' : 'asc';
    setPaginationState({ ...paginationState, sortColumn: column, sortDirection: newDirection, currentPage: 1 });
  };

  const sortData = <T extends Record<string, any>>(data: T[], sortColumn: string, sortDirection: 'asc' | 'desc'): T[] => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const paginateData = <T,>(data: T[], currentPage: number, rowsPerPage: number): T[] => {
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
    serverMeta?: { total: number; current_page: number; per_page: number; last_page: number } | null
  ) => {
    // Use server pagination meta if available, otherwise fall back to client-side calculation
    const totalPages = serverMeta ? serverMeta.last_page : getTotalPages(dataLength, paginationState.rowsPerPage);
    const totalItems = serverMeta ? serverMeta.total : dataLength;
    const { currentPage, rowsPerPage } = paginationState;
    const actualCurrentPage = serverMeta ? serverMeta.current_page : currentPage;
    const actualPerPage = serverMeta ? serverMeta.per_page : rowsPerPage;
    const startRow = (actualCurrentPage - 1) * actualPerPage + 1;
    const endRow = Math.min(actualCurrentPage * actualPerPage, totalItems);

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Show</span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) => setPaginationState({ ...paginationState, rowsPerPage: Number(e.target.value), currentPage: 1 })}
            style={{ width: 'auto' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
          <span className="text-muted small">entries</span>
        </div>
        
        <div className="text-muted small">
          Showing {startRow} to {endRow} of {totalItems} {label}
        </div>

        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={actualCurrentPage === 1}
            onClick={() => setPaginationState({ ...paginationState, currentPage: 1 })}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={actualCurrentPage === 1}
            onClick={() => setPaginationState({ ...paginationState, currentPage: actualCurrentPage - 1 })}
          >
            <ChevronLeft size={14} />
          </Button>
          
          {[...Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= actualCurrentPage - 1 && pageNum <= actualCurrentPage + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={actualCurrentPage === pageNum ? 'primary' : 'outline-secondary'}
                  onClick={() => setPaginationState({ ...paginationState, currentPage: pageNum })}
                >
                  {pageNum}
                </Button>
              );
            } else if (pageNum === actualCurrentPage - 2 || pageNum === actualCurrentPage + 2) {
              return <span key={pageNum} className="px-2">...</span>;
            }
            return null;
          })}
          
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={actualCurrentPage === totalPages}
            onClick={() => setPaginationState({ ...paginationState, currentPage: actualCurrentPage + 1 })}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={actualCurrentPage === totalPages}
            onClick={() => setPaginationState({ ...paginationState, currentPage: totalPages })}
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
    return paginationState.sortDirection === 'asc' ? 
      <ArrowUp size={14} className="ms-1" /> : 
      <ArrowDown size={14} className="ms-1" />;
  };

  // Transform API deal data to UI format
  const transformDealData = (deal: any) => {
    return {
      id: deal.id,
      name: deal.name || '',
      company: deal.company_name || '',
      industry: deal.industry || '',
      stage: deal.stage?.name || 'No Stage',
      stageColor: deal.stage?.color || 'grey',
      dealType: deal.deal_type || '',
      approvalStatus: deal.approval_status || '',
      value: deal.net_value || deal.grand_total || '0',
      currency: deal.currency || 'AED',
      probability: deal?.stage?.probability || 0,


      // closeDate: formatDateForTable(deal.expected_close_date),
      // followUpDate: formatDateForTable(deal.follow_up_date),

      closeDate: deal.expected_close_date ? moment(deal.expected_close_date).format(GlobalDateFormat) : '-',
      followUpDate: deal.follow_up_date ? moment(deal.follow_up_date).format(GlobalDateFormat) : '-',


      owner: extensions.find((ext: any) => ext?.id == deal?.created_by || ext?.extension == deal?.created_by)?.display_name || 
              extensions.find((ext: any) => ext?.id == deal?.created_by || ext?.extension == deal?.created_by)?.name || 
              deal.created_by || '',
      assignedUser: extensions.find((ext: any) => ext?.id == deal?.assigned_to || ext?.extension == deal?.assigned_to)?.display_name || 
                    extensions.find((ext: any) => ext?.id == deal?.assigned_to || ext?.extension == deal?.assigned_to)?.name || 
                    deal.assigned_to || '',
      created: formatDateForTable(deal.created_at),
      riskLevel: deal.risk_level || '',
      negotiationBar: deal.negotiation_bar || 0,
      quotationSent: deal.quotation_sent || false,
      contractSent: deal.contract_sent || false,
      isLost: deal.is_lost || false,
      rawData: deal // Keep original data for actions
    };
  };

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const transformedDeals = dealsData.map(transformDealData);
    
    const total = summaryTiles ? totalDeals : transformedDeals.length;
    const won = transformedDeals.filter(d => d.stage?.toLowerCase().includes('won') || d.rawData?.stage?.is_won).length;
    const inNegotiation = transformedDeals.filter(d => d.stage?.toLowerCase().includes('negotiation')).length;
    
    // Calculate total value
    const totalValue = transformedDeals.reduce((sum, d) => {
      const value = parseFloat(String(d.value).replace(/[^0-9.-]/g, '')) || 0;
      return sum + value;
    }, 0);
    
    // Stage distribution
    const stageCounts: Record<string, number> = {};
    transformedDeals.forEach(d => {
      const stage = d.stage || 'No Stage';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });
    
    // Deal type distribution
    const dealTypeCounts: Record<string, number> = {};
    transformedDeals.forEach(d => {
      const type = d.dealType || 'new_sale';
      dealTypeCounts[type] = (dealTypeCounts[type] || 0) + 1;
    });

    return { total, won, inNegotiation, totalValue, stageCounts, dealTypeCounts };
  }, [dealsData, extensions, summaryTiles, totalDeals]);

  // Transform deals data (no client-side filtering - API handles it)
  const filteredDeals = useMemo(() => {
    return dealsData.map(transformDealData);
  }, [dealsData, extensions]);

  // Calculate filter counts (using summary_tiles if available, otherwise from data)
  const filterCounts = useMemo(() => {
    const transformed = dealsData.map(transformDealData);
    const counts: Record<string, number> = {
      all: summaryTiles?.total_deals || totalDeals || transformed.length,
      lost: summaryTiles?.lost_deals || transformed.filter(d => d.isLost).length,
      deleted: summaryTiles?.deleted_deals || 0,
    };
    
    // Add counts for first 5 stages
    stages.slice(0, 5).forEach((stage: any) => {
      const stageDeals = transformed.filter(d => d.stage === stage.name || d.rawData?.stage_id === stage.id);
      counts[stage.id] = stageDeals.length;
    });
    
    return counts;
  }, [dealsData, extensions, stages, summaryTiles, totalDeals]);

  // Update custom tabs counts when filterCounts change
  useEffect(() => {
    setCustomTabs(prevTabs => 
      prevTabs.map(tab => {
        const count = filterCounts[tab.id] || 0;
        return { ...tab, count };
      })
    );
  }, [filterCounts]);

  // Custom select styles
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '45px',
      fontSize: '0.875rem',
      borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
      '&:hover': {
        borderColor: '#86b7fe'
      }
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#0d6efd',
      color: 'white',
      fontSize: '0.813rem'
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: 'white',
      padding: '2px 6px'
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: '#0b5ed7',
        color: 'white'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      fontSize: '0.875rem'
    })
  };

  // Define stats cards for GenericTable
  const dealsStatsCards: StatsCardData[] = useMemo(() => [
    {
      title: 'All Deals',
      value: summaryTiles?.total_deals || totalDeals || 0,
      icon: Handshake,
      iconColor: '#6366F1',
      iconBgColor: '#EEF2FF',
      subtitle: 'Total in pipeline'
    },
    {
      title: 'New',
      value: summaryTiles?.new_deals || analyticsData.stageCounts['New'] || 0,
      icon: PlusCircle,
      iconColor: '#3B82F6',
      iconBgColor: '#DBEAFE',
      metric: {
        text: 'Fresh opportunities',
        dotColor: '#2563EB'
      }
    },
    {
      title: 'Qualified',
      value: summaryTiles?.qualified_deals || analyticsData.stageCounts['Qualified'] || 0,
      icon: CheckCircle,
      iconColor: '#10B981',
      iconBgColor: '#D1FAE5',
      subtitle: 'Verified & ready'
    },
    {
      title: 'Proposal',
      value: analyticsData.stageCounts['Proposal'] || 0,
      icon: FileText,
      iconColor: '#8B5CF6',
      iconBgColor: '#EDE9FE',
      metric: {
        text: 'Submitted',
        dotColor: '#7C3AED'
      }
    },
    {
      title: 'Negotiation',
      value: analyticsData.stageCounts['Negotiation'] || analyticsData.inNegotiation || 0,
      icon: Users,
      iconColor: '#F59E0B',
      iconBgColor: '#FEF3C7',
      subtitle: 'In discussion'
    },
    {
      title: 'Closed Won',
      value: analyticsData.stageCounts['Closed Won'] || analyticsData.stageCounts['Won'] || analyticsData.won || 0,
      icon: Target,
      iconColor: '#059669',
      iconBgColor: '#D1FAE5',
      badge: {
        text: 'Success',
        bgColor: '#D1FAE5',
        textColor: '#065F46'
      }
    }
  ], [summaryTiles, totalDeals, analyticsData]);

  // Define columns for GenericTable
  const dealsColumns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Deal Name',
        sortable: true,
        type: 'avatar',
        avatar: {
          getInitials: (row) => getInitials(row.name),
          getColor: (row) => getRandomColor(row.name)
        },
        emptyValue: 'N/A'
      },
      {
        key: 'company',
        label: 'Company',
        sortable: true,
        type: 'multi-field',
        fields: {
          primary: 'company',
          secondary: 'industry',
          secondaryClass: 'text-muted small'
        },
        emptyValue: 'No Company'
      },
      {
        key: 'stage',
        label: 'Stage',
        sortable: true,
        type: 'custom',
        render: (row) => (
          <span
            style={{ backgroundColor: row?.stageColor || "grey" }}
            className="badge"
          >
            {row?.stage}
          </span>
        )
      },
      {
        key: 'dealType',
        label: 'Deal Type',
        sortable: true,
        type: 'badge',
        badge: {
          getVariant: () => 'primary'
        },
        emptyValue: '-'
      },
      {
        key: 'value',
        label: 'Value',
        sortable: true,
        type: 'custom',
        render: (row) => (
          <span className="fw-semibold">
            {row.currency} {parseFloat(String(row.value)).toLocaleString()}
          </span>
        )
      },
      {
        key: 'closeDate',
        label: 'Expected Close',
        sortable: true,
        type: 'text',
        accessor: (row) => row.closeDate || '-',
        emptyValue: '-'
      },
      {
        key: 'followUpDate',
        label: 'Follow-up Date',
        sortable: true,
        type: 'text',
        accessor: (row) => row.followUpDate || '-',
        emptyValue: '-'
      },
      {
        key: 'owner',
        label: 'Owner',
        sortable: true,
        type: 'text',
        emptyValue: '-'
      },
      {
        key: 'assignedUser',
        label: 'Assigned To',
        sortable: true,
        type: 'text',
        emptyValue: '-'
      },
      {
        key: 'created',
        label: 'Created',
        sortable: true,
        type: 'text',
        emptyValue: '-'
      }
    ],
    []
  );

  // Define actions for GenericTable
  const dealsActions: TableAction<any>[] = useMemo(
    () => {
      if (activeFilter === 'deleted') {
        return [
          {
            label: 'View',
            icon: <Eye size={16} />,
            onClick: (row: any) => handleViewDeal(row.rawData?.id || row.id),
            variant: 'link' as const
          },
          {
            label: 'Restore',
            icon: <RotateCcw size={16} />,
            onClick: (row: any) => handleRestoreDeal(row.rawData?.id || row.id),
            variant: 'link' as const,
            className: 'text-success'
          }
        ];
      }

      return [
        {
          label: 'View',
          icon: <Eye size={16} />,
          onClick: (row: any) => handleViewDeal(row.rawData?.id || row.id),
          variant: 'link' as const
        },
        ...(session?.user?.permissions?.includes('edit-crm-deals') ? [{
          label: 'Edit',
          icon: <Edit size={16} />,
          onClick: (row: any) => {
            if (activeFilter !== "lost") {
              handleEditDeal(row.rawData?.id || row.id);
            }
          },
          variant: 'link' as const,
          show: () => activeFilter !== "lost"
        }] : []),
        {
          label: 'Attachments',
          icon: <Paperclip size={16} />,
          onClick: (row: any) => {
            setSelectedDealForAttachments(row.rawData || row);
            setShowAttachmentModal(true);
          },
          variant: 'link' as const,
          className: 'text-info'
        },
        ...(session?.user?.permissions?.includes('add-crm-orders') ? [{
          label: 'Convert to Order',
          icon: <ShoppingBag size={16} />,
          onClick: (row: any) => {
            window.location.href = `/crm/orders/create?deal_id=${row.rawData?.id || row.id}`;
          },
          variant: 'link' as const,
          className: 'text-success'
        }] : []),
        ...(session?.user?.permissions?.includes('delete-crm-deals') ? [{
          label: 'Delete',
          icon: <Trash2 size={16} />,
          onClick: (row: any) => handleDeleteDeal(row.rawData?.id || row.id, row.name),
          variant: 'link' as const,
          className: 'text-danger'
        }] : []),
        ...(activeFilter !== 'lost' ? [{
          label: 'More Actions',
          icon: <MoreVertical size={16} />,
          variant: 'link' as const,
          dropdown: {
            align: 'end' as const,
            options: [
              {
                label: 'Mark as Lost',
                icon: <X size={14} />,
                onClick: (row: any) => handleMarkLost(row.rawData || row),
                className: 'text-danger'
              },

              ...(session?.user?.permissions?.includes('approve-reject-crm-deals') ? [
              {
                label: 'Approve',
                icon: <CheckCircle size={14} />,
                onClick: (row: any) => { void handleApproveDeal(row.rawData || row); },
                className: 'text-success',
                show: (row: any) => (row.rawData?.approval_status ?? row.approval_status) === 'pending'
              },
              {
                label: 'Reject',
                icon: <XCircle size={14} />,
                onClick: (row: any) => { void handleRejectDeal(row.rawData || row); },
                className: 'text-danger',
                show: (row: any) => (row.rawData?.approval_status ?? row.approval_status) === 'pending'
              }
              ] : [])
              
            ]
          }
        }] : [])
      ];
    },
    [session, activeFilter, handleViewDeal, handleRestoreDeal, handleDeleteDeal, handleMarkLost, handleApproveDeal, handleRejectDeal]
  );
 
  if (!session?.user?.permissions?.includes('list-crm-deals')) {
    return null;
  }
 
  return (
    <React.Fragment>
      <style dangerouslySetInnerHTML={{__html: `
        .deals-scrollable-content {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          overflow: hidden;
        }
        
        .deals-scrollable-content .container-fluid {
          display: flex;
          flex-direction: column;
        }
        
        .deals-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .deals-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .deals-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .deals-table-wrapper .table-responsive table th,
        .deals-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
      `}} />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Deals Approval"
      />

      {/* Main flex container for content and sidebar */}
      <div style={{ display: 'flex', gap: '0', height: 'calc(100vh)', overflow: 'hidden' }}>
        {/* Main content area */}
        <div className="deals-scrollable-content" style={{ flex: 1 }}>
        <div className="container-fluid">

        {/* Analytics Section - Collapsible */}
        {showDealsAnalytics && (
          <>
            {/* Summary Stats using KPICard */}
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <KPICard 
                  title="Total Deals"
                  value={analyticsData.total.toString()}
                  icon={<Handshake size={24} />}
                  color="primary"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard 
                  title="Won Deals"
                  value={analyticsData.won.toString()}
                  icon={<CheckCircle size={24} />}
                  color="success"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard 
                  title="In Negotiation"
                  value={analyticsData.inNegotiation.toString()}
                  icon={<Activity size={24} />}
                  color="warning"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard 
                  title="Total Value"
                  value={`${analyticsData.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
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
                    <h6 className="fw-bold mb-3">Deals by Stage</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analyticsData.stageCounts).map(([stage, count]) => ({ name: stage, value: count }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(analyticsData.stageCounts).map(([stage, count], index) => {
                            const colors = ['#0dcaf0', '#0d6efd', '#ffc107', '#fd7e14', '#198754', '#6c757d'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
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
                    <h6 className="fw-bold mb-3">Deal Type Distribution</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={Object.entries(analyticsData.dealTypeCounts).map(([type, count]) => ({ type, count }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
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
        {false && (
          <FilterBar
            quickFilters={[
              {
                id: 'all',
                label: 'All Deals',
                count: filterCounts.all,
                color: '#0d6efd',
                icon: <Users size={16} />
              },
              ...stages.slice(0, 5).map((stage: any) => ({
                id: stage.id.toString(),
                label: stage.name,
                count: filterCounts[stage.id] || 0,
                color: stage.color || '#6c757d',
                icon: <Layers size={16} />
              })),
              {
                id: 'lost',
                label: 'Lost',
                count: filterCounts.lost || 0,
                color: '#fd7e14',
                icon: <X size={16} />
              },
              {
                id: 'deleted',
                label: 'Deleted',
                count: filterCounts.deleted || 0,
                color: '#dc3545',
                icon: <Trash2 size={16} />
              }
            ]}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            // searchValue={dealsSearch}
            // onSearchChange={(value) => setDealsSearch(value)}
            // onSearch={() => {
            //   if (dealsSearch.trim()) {
            //     handleFiltersChange({ search: dealsSearch.trim() });
            //   } else {
            //     handleFiltersChange({ search: null });
            //   }
            //   setDealsPagination({ ...dealsPagination, currentPage: 1 });
            // }}
            // searchPlaceholder="Search deals by name, company..."
            // showAdvancedFilters={showAdvancedFilters}
            // onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
            // advancedFilterCount={
            //   (dealsFilters.assignedTo !== null ? 1 : 0) +
            //   (dealsFilters.stage !== null ? 1 : 0) +
            //   (dealsFilters.followUpDateFrom !== null || dealsFilters.followUpDateTo !== null ? 1 : 0) +
            //   (dealsFilters.probabilityMin !== null || dealsFilters.probabilityMax !== null ? 1 : 0) +
            //   (dealsFilters.dealType !== null ? 1 : 0) +
            //   (dealsFilters.industry !== null ? 1 : 0) +
            //   (dealsFilters.expectedCloseDateFrom !== null || dealsFilters.expectedCloseDateTo !== null ? 1 : 0)
            // }
          />
        )}

        {/* Advanced Filters */}
        {false && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Search
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search deals by name, company, value..."
                    value={dealsSearch}
                    onChange={(e) => setDealsSearch(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Assigned To</Form.Label>
                  <Select
                    options={extensions.map((ext: any) => ({ 
                      value: ext.id || ext.extension, 
                      label: ext.display_name || ext.name || ext.id || ext.extension
                    }))}
                    value={dealsFilters.assignedTo ? (() => {
                      const assignedToId = dealsFilters.assignedTo;
                      const ext = extensions.find((e: any) => (e.id || e.extension) === assignedToId);
                      return ext ? { 
                        value: assignedToId, 
                        label: ext.display_name || ext.name || assignedToId 
                      } : { value: assignedToId, label: assignedToId };
                    })() : null}
                    onChange={(selected) => {
                      const assignedToValue = selected ? selected.value : null;
                      setDealsFilters(prev => ({
                        ...prev,
                        assignedTo: assignedToValue
                      }));
                      // Reset to all when assigned filter changes
                      setActiveFilter('all');
                    }}
                    placeholder="Select user..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Stages</Form.Label>
                  <Select
                    options={stages.map(s => ({ value: s.id.toString(), label: s.name }))}
                    value={dealsFilters.stage ? (() => {
                      const stageId = dealsFilters.stage;
                      const stage = stages.find((st: any) => st.id.toString() === stageId);
                      return stage ? { value: stageId, label: stage.name } : { value: stageId, label: stageId };
                    })() : null}
                    onChange={(selected) => {
                      const stageValue = selected ? selected.value : null;
                      setDealsFilters(prev => ({
                        ...prev,
                        stage: stageValue
                      }));
                      // Update activeFilter to match selected stage
                      if (stageValue) {
                        setActiveFilter(stageValue);
                      } else {
                        setActiveFilter('all');
                      }
                    }}
                    placeholder="Select stage..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Follow-up Date From</Form.Label>
                  <Form.Control
                    type="date"
                    value={dealsFilters.followUpDateFrom || ''}
                    onChange={(e) => {
                      const dateValue = e.target.value || null;
                      setDealsFilters(prev => ({
                        ...prev,
                        followUpDateFrom: dateValue
                      }));
                    }}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Follow-up Date To</Form.Label>
                  <Form.Control
                    type="date"
                    value={dealsFilters.followUpDateTo || ''}
                    onChange={(e) => {
                      const dateValue = e.target.value || null;
                      setDealsFilters(prev => ({
                        ...prev,
                        followUpDateTo: dateValue
                      }));
                    }}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Probability Min (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    value={dealsFilters.probabilityMin || ''}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setDealsFilters(prev => ({
                        ...prev,
                        probabilityMin: value
                      }));
                    }}
                    placeholder="0"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Probability Max (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    value={dealsFilters.probabilityMax || ''}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setDealsFilters(prev => ({
                        ...prev,
                        probabilityMax: value
                      }));
                    }}
                    placeholder="100"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Deal Type</Form.Label>
                  <Form.Select
                    value={dealsFilters.dealType || ''}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setDealsFilters(prev => ({
                        ...prev,
                        dealType: value
                      }));
                    }}
                  >
                    <option value="">Select Deal Type</option>
                    <option value="new_sale">New Sale</option>
                    <option value="renewal">Renewal</option>
                    <option value="migration">Migration</option>
                    <option value="upsell">Upsell</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Approval Status</Form.Label>
                  <Form.Select
                    value={dealsFilters.approvalStatus || ''}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setDealsFilters(prev => ({
                        ...prev,
                        approvalStatus: value
                      }));
                    }}
                  >
                    <option value="">Select Approval Status</option>
                    <option value="pending" selected>Pending</option>
                    <option value="approved">Approved</option>  
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Col>
                <Col md={4}> 
                  <Form.Label className="small fw-bold mb-2">Industry</Form.Label>
                  <Form.Select
                    value={dealsFilters.industry || ''}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setDealsFilters(prev => ({
                        ...prev,
                        industry: value
                      }));
                    }}
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Banking & Financial Services">Banking & Financial Services</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Construction">Construction</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Expected Close Date From</Form.Label>
                  <Form.Control
                    type="date"
                    value={dealsFilters.expectedCloseDateFrom || ''}
                    onChange={(e) => {
                      const dateValue = e.target.value || null;
                      setDealsFilters(prev => ({
                        ...prev,
                        expectedCloseDateFrom: dateValue
                      }));
                    }}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Expected Close Date To</Form.Label>
                  <Form.Control
                    type="date"
                    value={dealsFilters.expectedCloseDateTo || ''}
                    onChange={(e) => {
                      const dateValue = e.target.value || null;
                      setDealsFilters(prev => ({
                        ...prev,
                        expectedCloseDateTo: dateValue
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
                        // Map dealsFilters to the format expected by handleFiltersChange
                        const filtersToApply: Record<string, any> = {};
                        
                        if (dealsSearch) {
                          filtersToApply.search = dealsSearch;
                        }
                        if (dealsFilters.assignedTo) {
                          filtersToApply.assigned_to = dealsFilters.assignedTo;
                        }
                        if (dealsFilters.stage) {
                          filtersToApply.stage_id = dealsFilters.stage;
                        }
                        if (dealsFilters.followUpDateFrom) {
                          filtersToApply.follow_up_date_from = dealsFilters.followUpDateFrom;
                        }
                        if (dealsFilters.followUpDateTo) {
                          filtersToApply.follow_up_date_to = dealsFilters.followUpDateTo;
                        }
                        if (dealsFilters.probabilityMin) {
                          filtersToApply.probability_min = dealsFilters.probabilityMin;
                        }
                        if (dealsFilters.probabilityMax) {
                          filtersToApply.probability_max = dealsFilters.probabilityMax;
                        }
                        if (dealsFilters.dealType) {
                          filtersToApply.deal_type = dealsFilters.dealType;
                        }
                        // Always pass approval_status so it can be set or cleared
                        filtersToApply.approval_status = dealsFilters.approvalStatus || null;
                        if (dealsFilters.industry) {
                          filtersToApply.industry = dealsFilters.industry;
                        }
                        if (dealsFilters.expectedCloseDateFrom) {
                          filtersToApply.expected_close_date_from = dealsFilters.expectedCloseDateFrom;
                        }
                        if (dealsFilters.expectedCloseDateTo) {
                          filtersToApply.expected_close_date_to = dealsFilters.expectedCloseDateTo;
                        }
                        
                        handleFiltersChange(filtersToApply);
                        setDealsPagination({ ...dealsPagination, currentPage: 1 });
                        setRefreshKey(prev => prev + 1);
                      }}
                    >
                      Submit Filters
                    </Button>
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setDealsSearch("");
                        setDealsFilters({
                          assignedTo: null,
                          stage: null,
                          followUpDateFrom: null,
                          followUpDateTo: null,
                          probabilityMin: null,
                          probabilityMax: null,
                          dealType: null,
                          approvalStatus: null,
                          industry: null,
                          expectedCloseDateFrom: null,
                          expectedCloseDateTo: null,
                        });
                        handleFiltersChange({});
                        setCurrentFilters({});
                        setActiveFilter('all');
                        setDealsPagination({ ...dealsPagination, currentPage: 1 });
                        setRefreshKey(prev => prev + 1);
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

        {/* Deals Table with GenericTable */}
        <GenericTable
          data={filteredDeals}
          columns={dealsColumns}
          actions={dealsActions}
          showActions={false}
          customizableColumns={true}
          defaultSelectedColumns={['name', 'company', 'stage', 'approvalStatus', 'dealType', 'value', 'assignedUser', 'closeDate', 'owner']}
          columnStorageKey="dealsSelectedColumns"
          onColumnChange={(cols) => setSelectedDealsColumns(cols)}
          onPreviewClick={(deal) => handlePreviewClick(deal)}
          onFirstColumnClick={(deal) => handleFirstColumnClick(deal)}
          pagination={{
            currentPage: dealsPagination.currentPage,
            rowsPerPage: dealsPagination.rowsPerPage,
            totalRows: totalDeals,
            pageSizeOptions: [10, 15, 25, 50, 100]
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setDealsPagination({
              ...dealsPagination,
              currentPage: page,
              rowsPerPage
            });
          }}
          sortable={true}
          defaultSortColumn={dealsPagination.sortColumn}
          defaultSortDirection={dealsPagination.sortDirection}
          onSort={(column, direction) => {
            setDealsPagination({
              ...dealsPagination,
              sortColumn: column,
              sortDirection: direction
            });
          }}
          onRowDoubleClick={(row) => {
            if (session?.user?.permissions?.includes('list-crm-deals')) {
              handleViewDeal(row.rawData?.id || row.id);
            }
          }}
          loading={loading}
          emptyMessage="No deals found matching your criteria"
          loadingMessage="Loading deals..."
          hover={true}
          uniqueKey="id"
          
          // Fixed height mode
          fixedHeight={true}
          maxHeight="calc(100vh - 380px)"
          
          // Toolbar
          showToolbar={true}
          toolbar={{
            // Tabs
            showTabs: true,
            tabsDropdownLabel: "Deals",
            tabs: [
              { id: 'all', label: 'All deals', count: filterCounts.all, removable: false },
              ...customTabs
            ],
            activeTab: activeFilter,
            onTabChange: handleFilterChange,
            onTabAdd: () => setShowTabModal(true),
            onTabRemove: (tabId) => {
              setCustomTabs(tabs => tabs.filter(t => t.id !== tabId));
              if (activeFilter === tabId) {
                handleFilterChange('all');
              }
            },
            
            // Search
            showSearch: true,
            searchValue: dealsSearch,
            searchPlaceholder: "Search deals by name, company, value...",
            onSearchChange: (value) => {
              setDealsSearch(value);
              // Clear search on empty value
              if (!value) {
                const newFilters = { ...currentFilters };
                delete newFilters.search;
                handleFiltersChange(newFilters);
                setRefreshKey((prev) => prev + 1);
              }
            },
            onSearch: () => {
              if (dealsSearch) {
                handleFiltersChange({
                  ...currentFilters,
                  search: dealsSearch
                });
                setDealsPagination({ ...dealsPagination, currentPage: 1 });
                setRefreshKey((prev) => prev + 1);
              }
            },
            
            // Actions
            showTableViewDropdown: true,
            tableViewLabel: "Table view",
            showViewSwitcher: true,
            showEditColumns: true,
            onEditColumnsClick: () => setShowColumnEditor(true),
            showPipelineDropdown: true,
            pipelineLabel: "All Pipelines",
            showFiltersButton: true,
            onFiltersClick: handleOpenFiltersSidebar,
            showSortButton: true,
            showExportButton: true,
            onExportClick: () => setShowExportModal(true),
            showSaveButton: true,
            onSaveClick: () => console.log('Save view'),
            
            // Filter Pills
            filterPills: [
              { 
                id: 'contact_owner', 
                label: 'Contact Owner', 
                showDropdown: true,
                dropdownOptions: [
                  { label: 'All Owners', value: 'all', onClick: () => {
                    const newFilters = { ...currentFilters };
                    delete newFilters.assigned_to;
                    handleFiltersChange(newFilters);
                    setRefreshKey((prev) => prev + 1);
                  }},
                  ...extensions.map(ext => ({
                    label: ext.display_name || ext.name || ext.extension,
                    value: ext.id || ext.extension,
                    onClick: () => {
                      handleFiltersChange({ ...currentFilters, assigned_to: ext.id || ext.extension });
                      setRefreshKey((prev) => prev + 1);
                    }
                  }))
                ]
              }
            ],
            showAdvancedFilters: true,
            onAdvancedFiltersClick: handleOpenFiltersSidebar
          }}
          
          // Stats cards for metrics
          statsCards={dealsStatsCards}
        />
        </div>
        </div>

      {/* Deal Sidebar */}
      {showDealSidebar && (
      <GenericSidebar
        isOpen={showDealSidebar}
        onClose={handleCloseDealSidebar}
        title={selectedDeal?.name || 'Deal Details'}
        subtitle={selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone || selectedDeal?.company || selectedDeal?.company_name || ''}
        email={selectedDeal?.email || selectedDeal?.rawData?.email || relatedLead?.email}
        phone={selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone}
        avatar={{
          initials: getInitials(selectedDeal?.name || 'NA'),
          name: selectedDeal?.name || 'NA',
          gradient: getRandomColor(selectedDeal?.name || '')
        }}
        onNoteCreate={handleNoteCreate}
        breezeRecordSummary={{
          content: `This deal was created on ${selectedDeal?.created_at ? moment(selectedDeal.created_at).format('MMMM DD, YYYY') : 'recent date'}. ${selectedDeal?.stage?.name ? `Currently in ${selectedDeal.stage.name} stage.` : ''} ${selectedDeal?.value ? `Deal value: ${selectedDeal.currency || 'AED'} ${parseFloat(String(selectedDeal.value)).toLocaleString()}.` : ''} ${selectedDeal?.company_name || selectedDeal?.company ? `Company: ${selectedDeal.company_name || selectedDeal.company}.` : ''}`,
          timestamp: selectedDeal?.updated_at ? `Generated on ${moment(selectedDeal.updated_at).format('MMM DD, YYYY [at] h:mm A')}` : 'Generated recently',
          onRefresh: () => console.log('Refresh AI summary'),
          onThumbsUp: () => console.log('Thumbs up'),
          onThumbsDown: () => console.log('Thumbs down'),
          onCopy: () => {
            const summaryText = `This deal was created on ${selectedDeal?.created_at ? moment(selectedDeal.created_at).format('MMMM DD, YYYY') : 'recent date'}. ${selectedDeal?.stage?.name ? `Currently in ${selectedDeal.stage.name} stage.` : ''} ${selectedDeal?.value ? `Deal value: ${selectedDeal.currency || 'AED'} ${parseFloat(String(selectedDeal.value)).toLocaleString()}.` : ''} ${selectedDeal?.company_name || selectedDeal?.company ? `Company: ${selectedDeal.company_name || selectedDeal.company}.` : ''}`;
            navigator.clipboard.writeText(summaryText);
            toast.success('Summary copied to clipboard');
          },
          onAskQuestion: () => console.log('Ask AI a question')
        }}
        recordLink={{
          label: 'View record',
          onClick: () => {
            const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
            if (dealId) {
              router.push(`/crm/deals/${dealId}/edit`);
            }
          }
        }}
        actionsDropdown={{
          label: 'Actions',
          items: [
            { 
              label: 'Edit Deal', 
              onClick: () => {
                const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                if (dealId) {
                  router.push(`/crm/deals/${dealId}/edit`);
                }
              }
            },
            ...((selectedDeal?.approval_status ?? selectedDeal?.rawData?.approval_status) === 'approved' ? [{
              label: 'Convert to Order', 
              onClick: () => {
                setShowDealSidebar(false);
                const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                if (dealId) {
                  setDealToConvert(dealId);
                  setShowConvertToOrderModal(true);
                }
              }
            }] : []),
            { 
              label: 'View History', 
              onClick: () => {
                setShowDealSidebar(false);
                const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                if (dealId) {
                  handleViewDeal(dealId);
                  setShowDealHistoryModal(true);
                }
              }
            },
            { 
              label: 'Delete', 
              onClick: () => {
                const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                if (dealId) {
                  handleDeleteDeal(dealId, selectedDeal?.name);
                }
              }
            }
          ]
        }}
        quickActions={[
          { 
            id: 'note', 
            label: 'Note', 
            icon: FileText, 
            onClick: () => {}, // This is handled internally now
            disabled: false 
          },
          { 
            id: 'call', 
            label: 'Call', 
            icon: PhoneIcon, 
            onClick: () => {
              const phone = selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone;
              if (phone) {
                handleCallClick(selectedDeal);
              }
            },
            disabled: !(selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone)
          },
          { 
            id: 'email', 
            label: 'Email', 
            icon: Mail, 
            onClick: () => {},
            disabled: !(selectedDeal?.email || selectedDeal?.rawData?.email || relatedLead?.email)
          },
          { 
            id: 'task', 
            label: 'Task', 
            icon: CheckSquare, 
            onClick: () => {},
            disabled: false 
          },
          { 
            id: 'meeting', 
            label: 'Meeting', 
            icon: Calendar, 
            onClick: () => {
              const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
              if (dealId) {
                setMeetingData({
                  dealId: Number(dealId),
                  dealName: selectedDeal?.name || '',
                  meetingName: '',
                  meetingType: 'Online',
                  meetingDate: '',
                  meetingTime: '',
                  meetingOutcome: '',
                  extensions: []
                });
                setMeetingAttendees([]);
                setShowAddMeetingModal(true);
              }
            },
            disabled: false 
          },
          { 
            id: 'more', 
            label: 'More', 
            icon: MoreVertical, 
            onClick: () => console.log('More actions'),
            disabled: false 
          }
        ]}
        sections={[
          {
            id: 'about-deal',
            title: 'About this deal',
            icon: Handshake,
            collapsible: true,
            defaultExpanded: true,
            actions: [
              { label: 'Edit all properties', onClick: () => {
                const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                if (dealId) {
                  router.push(`/crm/deals/${dealId}/edit`);
                }
              }}
            ],
            fields: [
              {
                label: 'Name',
                value: selectedDeal?.name || 'N/A',
                copyable: true
              },
              {
                label: 'Phone',
                value: selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone || 'N/A',
                type: 'phone',
                copyable: true,
                externalLink: (selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone) ? `tel:${selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone}` : undefined,
                show: !!(selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone)
              },
              {
                label: 'Email',
                value: selectedDeal?.email || selectedDeal?.rawData?.email || relatedLead?.email || 'N/A',
                type: 'email',
                copyable: true,
                externalLink: (selectedDeal?.email || selectedDeal?.rawData?.email || relatedLead?.email) ? `mailto:${selectedDeal?.email || selectedDeal?.rawData?.email || relatedLead?.email}` : undefined,
                show: !!(selectedDeal?.email || selectedDeal?.rawData?.email || relatedLead?.email)
              },
              {
                label: 'Company',
                value: selectedDeal?.company_name || selectedDeal?.company || 'N/A',
                copyable: true,
                show: !!(selectedDeal?.company_name || selectedDeal?.company)
              },
              {
                label: 'Stage',
                value: typeof selectedDeal?.stage === 'string' 
                  ? selectedDeal.stage 
                  : (selectedDeal?.stage?.name || selectedDeal?.rawData?.stage?.name || 'N/A'),
                type: 'badge',
                badgeVariant: 'primary'
              },
              {
                label: 'Deal Value',
                value: selectedDeal?.value 
                  ? `${selectedDeal?.currency || 'AED'} ${parseFloat(String(selectedDeal.value)).toLocaleString()}`
                  : 'N/A',
                copyable: true,
                show: !!selectedDeal?.value
              },
              {
                label: 'Probability',
                value: selectedDeal?.probability ? `${selectedDeal.probability}%` : 'N/A',
                show: !!selectedDeal?.probability
              },
              {
                label: 'Deal Type',
                value: selectedDeal?.dealType || selectedDeal?.deal_type || 'N/A',
                type: 'badge',
                badgeVariant: 'info',
                show: !!(selectedDeal?.dealType || selectedDeal?.deal_type)
              },
              {
                label: 'Assigned To',
                value: selectedDeal?.assigned_user?.display_name || selectedDeal?.assigned_user?.name || selectedDeal?.assignedUser || 'Unassigned',
                hasDetails: true,
                onDetailsClick: () => console.log('Show user details')
              },
              {
                label: 'Created Date',
                value: selectedDeal?.created_at || selectedDeal?.created ? moment(selectedDeal.created_at || selectedDeal.created).format('MMM DD, YYYY') : 'N/A',
                type: 'date'
              },
              {
                label: 'Last Updated',
                value: selectedDeal?.updated_at || selectedDeal?.last_activity_at ? moment(selectedDeal.updated_at || selectedDeal.last_activity_at).format('MMM DD, YYYY') : 'N/A',
                type: 'date'
              }
            ]
          },
          {
            id: 'recent-activities',
            title: 'Recent activities',
            icon: History,
            collapsible: true,
            defaultExpanded: true,
            count: 0,
            emptyState: {
              icon: History,
              message: 'No recent activities for this deal.',
              action: {
                label: 'Log activity',
                onClick: () => console.log('Log activity')
              }
            }
          },
          {
            id: 'call-recordings',
            title: 'Call Recordings',
            icon: PhoneIcon,
            collapsible: true,
            defaultExpanded: true,
            count: 0,
            actions: [
              { label: 'View all recordings', onClick: () => console.log('View all') }
            ],
            emptyState: {
              icon: PhoneIcon,
              message: 'No call recordings available yet.',
              action: {
                label: 'Make a call',
                onClick: () => {
                  const phone = selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone;
                  if (phone) {
                    handleCallClick(selectedDeal);
                  }
                }
              }
            }
          },
          {
            id: 'notes',
            title: 'Notes',
            icon: FileText,
            collapsible: true,
            defaultExpanded: true,
            count: 0,
            emptyState: {
              icon: FileText,
              message: 'No notes added yet.',
              action: {
                label: 'Add note',
                onClick: () => console.log('Add note')
              }
            }
          },
          {
            id: 'follow-ups',
            title: 'Follow-ups',
            icon: History,
            collapsible: true,
            defaultExpanded: true,
            badge: {
              value: dealFollowUps?.length ?? 0,
              variant: 'secondary'
            },
            ...(dealFollowUps?.length
              ? {
                  customContent: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(dealFollowUps || []).map((fu: any) => (
                        <div
                          key={fu.id}
                          style={{
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>
                              {fu.follow_up_date ? moment(fu.follow_up_date).format(GlobalDateFormat) : '-'}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>
                              {fu.communication_channel || fu.communication_channel_other || '-'}
                            </span>
                          </div>
                          {fu.follow_up_status && (
                            <div style={{ marginBottom: '4px', color: '#475569' }}>
                              <span style={{ color: '#94a3b8' }}>Status: </span>{fu.follow_up_status}
                            </div>
                          )}
                          {fu.notes && (
                            <div style={{ color: '#475569', lineHeight: 1.4 }}>
                              {fu.notes.length > 120 ? `${fu.notes.slice(0, 120)}...` : fu.notes}
                            </div>
                          )}
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0"
                              title="Edit"
                              
                              onClick={() => {
                                const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                                if (dealId) {
                                  setFollowupData({
                                    dealId: Number(dealId),
                                    dealName: selectedDeal?.name || '',
                                    followUpDate: fu.follow_up_date ? moment(fu.follow_up_date).format('YYYY-MM-DD') : '',
                                    followUpStatus: fu.follow_up_status || 'Pending',
                                    communicationChannel: fu.communication_channel || 'Phone Call',
                                    communicationChannelOther: fu.communication_channel_other || '',
                                    notes: fu.notes || '',
                                    userExtension: (session?.user as any)?.extension || '',
                                  });
                                  setFollowUpIdToEdit(fu.id);
                                  setShowAddFollowupModal(true);
                                }
                              }}
                            >
                              <Edit size={14} className="me-1" />
                            </Button>

                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-danger"
                              title="Delete"
                              onClick={() => {
                                const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                                if (dealId) {
                                  setFollowUpToDelete({
                                    dealId: Number(dealId),
                                    followUpId: fu.id,
                                    label: fu.follow_up_date ? moment(fu.follow_up_date).format(GlobalDateFormat) : 'Follow-up',
                                  });
                                  setShowDeleteFollowUpModal(true);
                                }
                              }}
                            >
                              <Trash size={14} className="me-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                        onClick={() => {
                          const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                          if (dealId) {
                            setFollowupData({
                              dealId: Number(dealId),
                              dealName: selectedDeal?.name || '',
                              followUpDate: '',
                              followUpStatus: 'Pending',
                              communicationChannel: 'Phone Call',
                              communicationChannelOther: '',
                              notes: '',
                              userExtension: (session?.user as any)?.extension || '',
                            });
                            setFollowUpIdToEdit(null);
                            setShowAddFollowupModal(true);
                          }
                        }}
                      >
                        <Plus size={14} className="me-1" /> Add Follow Up
                      </Button>
                    </div>
                  )
                }
              : {
                  emptyState: {
                    icon: History,
                    message: 'No follow-ups yet',
                    action: {
                      label: 'Add Follow Up',
                      onClick: () => {
                        const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                        if (dealId) {
                          setFollowupData({
                            dealId: Number(dealId),
                            dealName: selectedDeal?.name || '',
                            followUpDate: '',
                            followUpStatus: 'Pending',
                            communicationChannel: 'Phone Call',
                            communicationChannelOther: '',
                            notes: '',
                            userExtension: (session?.user as any)?.extension || '',
                          });
                          setFollowUpIdToEdit(null);
                          setShowAddFollowupModal(true);
                        }
                      }
                    }
                  }
                })
          }
        ]}
      />
      )}
      </div>

      {/* Delete Deal Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDealToDelete(null);
        }}
        onConfirm={confirmDeleteDeal}
        itemName={dealToDelete?.name}
        itemType="deal"
      />

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />

      {/* Mark Deal Lost Modal */}
      <FormModal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
        title="Mark deal as lost"
        desc="Please fill in the details below to mark the deal as lost."
        size="lg"
        formHtml={
          <>
          <Form.Group className="mb-3">
            <Form.Label>Lost Reason *</Form.Label>
            <Form.Select
              value={lostReasonId || ""}
              onChange={(e) =>
                setLostReasonId(e.target.value ? Number(e.target.value) : null)
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
              placeholder="Please provide additional feedback about why this deal was lost..."
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

      {/* Deal View Modal */}
     
{viewingDeal && (
  <Modal
    show={showDealViewModal}
    onHide={() => setShowDealViewModal(false)}
    size="xl"
    centered
    className="deal-view-modal"
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
        onClick={() => setShowDealViewModal(false)}
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
            background: "#10b981",
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
          {viewingDeal.name
            ? viewingDeal.name.charAt(0).toUpperCase()
            : "D"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ 
            margin: 0, 
            fontWeight: 700, 
            fontSize: "26px",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {viewingDeal.name}
          </h2>
          <div style={{ 
            marginTop: "6px", 
            opacity: 0.95, 
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            color: "#000",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Handshake size={14} />
              {viewingDeal.stage?.name || "No stage"}
            </span>
            <span>•</span>
            <span style={{ fontWeight: 600 }}>
              {viewingDeal.currency || 'AED'} {parseFloat(String(viewingDeal.net_value || viewingDeal.grand_total || 0)).toLocaleString()}
            </span>
            <span>•</span>
            <span>
              Created {viewingDeal.created_at
                ? moment(viewingDeal.created_at).format("MMM DD, YYYY")
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>

    <Modal.Body style={{ padding: 0, maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
      {loadingDeal ? (
        <div style={{
          padding: "48px 20px",
          textAlign: "center",
        }}>
          <Spinner animation="border" variant="primary" size="sm" style={{ marginBottom: "12px" }} />
          <p className="mb-0" style={{ color: "#6b7280", fontSize: "14px" }}>Loading deal details...</p>
        </div>
      ) : (
        <>
          <style>{`
            .deal-detail-filter-buttons {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 0;
              padding: 0;
              width: 100%;
            }

            .deal-detail-filter-button {
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

            .deal-detail-filter-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .deal-detail-filter-button.active {
              color: white;
            }

            .deal-detail-filter-button.active .filter-icon {
              color: white;
            }

            .deal-detail-filter-button:not(.active) .filter-icon {
              color: inherit;
            }

            .filter-icon {
              width: 18px;
              height: 18px;
              flex-shrink: 0;
            }
          `}</style>

          {/* Main Content Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", minHeight: "500px" }}>
            
            {/* Left Panel - Main Information */}
            <div style={{ padding: "32px", borderRight: "1px solid #e5e7eb" }}>
              
              {/* Tabs Navigation */}
              <div className="deal-detail-filter-buttons mb-4">
                <button
                  className={`deal-detail-filter-button ${activeTab === "general-info" ? 'active' : ''}`}
                  onClick={() => setActiveTab("general-info")}
                  style={{
                    backgroundColor: activeTab === "general-info" ? "#10b981" : 'white',
                    borderColor: "#10b981",
                    color: activeTab === "general-info" ? 'white' : "#10b981"
                  }}
                >
                  <Handshake className="filter-icon" size={18} />
                  <span>General Information</span>
                </button>
                <button
                  className={`deal-detail-filter-button ${activeTab === "campaign-prospect" ? 'active' : ''}`}
                  onClick={() => setActiveTab("campaign-prospect")}
                  style={{
                    backgroundColor: activeTab === "campaign-prospect" ? "#10b981" : 'white',
                    borderColor: "#10b981",
                    color: activeTab === "campaign-prospect" ? 'white' : "#10b981"
                  }}
                >
                  <FileText className="filter-icon" size={18} />
                  <span>Campaign & Prospect</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "general-info" && (
                <div>
                  {/* Quick Info Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "28px" }}>
                    <div
                      style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        padding: "20px",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(16, 185, 129, 0.15)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          background: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <User size={20} style={{ color: "white" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#10b981",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            marginBottom: "4px",
                          }}>
                            Assigned To
                          </div>
                          <div style={{
                            fontSize: "15px",
                            color: "#1f2937",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {extensions.find((ext: any) => ext?.id == viewingDeal?.assigned_to || ext?.extension == viewingDeal?.assigned_to)?.display_name || 
                             extensions.find((ext: any) => ext?.id == viewingDeal?.assigned_to || ext?.extension == viewingDeal?.assigned_to)?.name || 
                             viewingDeal.assigned_to || 'Not assigned'}
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
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(16, 185, 129, 0.15)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          background: "#f59e0b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <DollarSign size={20} style={{ color: "white" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#f59e0b",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            marginBottom: "4px",
                          }}>
                            Deal Value
                          </div>
                          <div style={{
                            fontSize: "15px",
                            color: "#1f2937",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {viewingDeal.currency || 'AED'} {parseFloat(String(viewingDeal.net_value || viewingDeal.grand_total || 0)).toLocaleString()}
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
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(16, 185, 129, 0.15)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          background: viewingDeal.stage?.color || "#6c757d",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <Target size={20} style={{ color: "white" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            marginBottom: "4px",
                          }}>
                            Stage
                          </div>
                          <div style={{
                            fontSize: "15px",
                            color: "#1f2937",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {viewingDeal.stage?.name || "Not assigned"}
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
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(16, 185, 129, 0.15)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          background: "#8b5cf6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <Percent size={20} style={{ color: "white" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#8b5cf6",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            marginBottom: "4px",
                          }}>
                            Probability
                          </div>
                          <div style={{
                            fontSize: "15px",
                            color: "#1f2937",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {viewingDeal?.stage?.probability || 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deal Information Section */}
                  <div style={{ marginBottom: "28px" }}>
                    <h5 style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1f2937",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <div style={{
                        width: "4px",
                        height: "18px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        borderRadius: "2px",
                      }} />
                      Deal Details
                    </h5>
                    <div style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "20px",
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "14px", fontWeight: 600 }}>
                          <Handshake size={16} style={{ color: "#10b981" }} />
                          Deal Name
                        </div>
                        <div style={{ color: "#1f2937", fontSize: "15px", fontWeight: 500 }}>
                          {viewingDeal.name}
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "14px", fontWeight: 600 }}>
                          <Calendar size={16} style={{ color: "#10b981" }} />
                          Created
                        </div>
                        <div style={{ color: "#1f2937", fontSize: "15px", fontWeight: 500 }}>
                          {viewingDeal.created_at
                            ? moment(viewingDeal.created_at).format("MMMM DD, YYYY [at] hh:mm A")
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Information Section */}
                  {viewingDeal.company_name && (
                    <div style={{ marginBottom: "28px" }}>
                      <h5 style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#1f2937",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                        <div style={{
                          width: "4px",
                          height: "18px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          borderRadius: "2px",
                        }} />
                        Client Information
                      </h5>
                      <div style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                          <div>
                            <div style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: "6px",
                            }}>
                              Client Name
                            </div>
                            <div style={{
                              fontSize: "14px",
                              color: "#1f2937",
                              fontWeight: 500,
                              wordBreak: "break-word",
                            }}>
                              <Building2 size={14} style={{ color: "#10b981", marginRight: "6px", display: "inline" }} />
                              {viewingDeal.company_name}
                            </div>
                          </div>
                          {viewingDeal.industry && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                Industry
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                {viewingDeal.industry}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lead Information Section */}
                  {relatedLead && (
                    <div style={{ marginBottom: "28px" }}>
                      <h5 style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#1f2937",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                        <div style={{
                          width: "4px",
                          height: "18px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          borderRadius: "2px",
                        }} />
                        Lead Information
                      </h5>
                      <div style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                          <div>
                            <div style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: "6px",
                            }}>
                              Lead Name
                            </div>
                            <div style={{
                              fontSize: "14px",
                              color: "#1f2937",
                              fontWeight: 500,
                              wordBreak: "break-word",
                            }}>
                              {relatedLead.name}
                            </div>
                          </div>
                          {relatedLead.lead_potential && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                Lead Potential
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                <Badge 
                                  bg={relatedLead.lead_potential === 'Hot' ? 'danger' : relatedLead.lead_potential === 'Warm' ? 'warning' : 'secondary'}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}
                                >
                                  {relatedLead.lead_potential || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          )}
                          {relatedLead.user_extension && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                Assigned To
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                <User size={14} style={{ color: "#10b981", marginRight: "6px", display: "inline" }} />
                                {extensions.find((ext: any) => ext?.id == relatedLead?.user_extension || ext?.extension == relatedLead?.user_extension)?.display_name || 
                                 extensions.find((ext: any) => ext?.id == relatedLead?.user_extension || ext?.extension == relatedLead?.user_extension)?.name || 
                                 relatedLead.user_extension || 'Not assigned'}
                              </div>
                            </div>
                          )}
                          {relatedLead.created_at && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                Created Date
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                <Calendar size={14} style={{ color: "#10b981", marginRight: "6px", display: "inline" }} />
                                {relatedLead.created_at ? formatDateForTable(relatedLead.created_at) : 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "campaign-prospect" && (
                <div>
                  {/* Campaign Information Section */}
                  <div style={{ marginBottom: "28px" }}>
                    <h5 style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1f2937",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <div style={{
                        width: "4px",
                        height: "18px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        borderRadius: "2px",
                      }} />
                      Campaign Information
                    </h5>
                    {relatedLead?.campaign ? (
                      <div style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                          <div>
                            <div style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: "6px",
                            }}>
                              Campaign Name
                            </div>
                            <div style={{
                              fontSize: "14px",
                              color: "#1f2937",
                              fontWeight: 500,
                              wordBreak: "break-word",
                            }}>
                              {relatedLead.campaign.name}
                            </div>
                          </div>
                          {relatedLead.campaign_field_values && Object.keys(relatedLead.campaign_field_values).length > 0 && (
                            Object.entries(relatedLead.campaign_field_values).map(([key, value]: [string, any]) => (
                              <div key={key}>
                                <div style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#6b7280",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  marginBottom: "6px",
                                }}>
                                  {key}
                                </div>
                                <div style={{
                                  fontSize: "14px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                  wordBreak: "break-word",
                                }}>
                                  {String(value)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#6b7280",
                        background: "#f9fafb",
                        border: "2px dashed #d1d5db",
                        borderRadius: "12px"
                      }}>
                        No campaign information available
                      </div>
                    )}
                  </div>

                  {/* Prospect Information Section */}
                  <div style={{ marginBottom: "28px" }}>
                    <h5 style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1f2937",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <div style={{
                        width: "4px",
                        height: "18px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        borderRadius: "2px",
                      }} />
                      Prospect Information
                    </h5>
                    {relatedLead?.crm_data ? (
                      <div style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                          {relatedLead.crm_data.id && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                CRM Data ID
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                #{relatedLead.crm_data.id}
                              </div>
                            </div>
                          )}
                          {(relatedLead.crm_data.name || (relatedLead.crm_data.data && relatedLead.crm_data.data.name)) && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                Name
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                {relatedLead.crm_data.name || (relatedLead.crm_data.data && relatedLead.crm_data.data.name) || 'N/A'}
                              </div>
                            </div>
                          )}
                          {(relatedLead.crm_data.phone || (relatedLead.crm_data.data && relatedLead.crm_data.data.phone)) && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                Phone
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                <PhoneDisplay
                                  phone={
                                    relatedLead.crm_data.phone ||
                                    (relatedLead.crm_data.data && relatedLead.crm_data.data.phone) ||
                                    ""
                                  }
                                />
                              </div>
                            </div>
                          )}
                          {relatedLead.crm_data.source_file && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                Source File
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                {relatedLead.crm_data.source_file}
                              </div>
                            </div>
                          )}
                          {relatedLead.crm_data.uploaded_by && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                Uploaded By
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                <User size={14} style={{ color: "#10b981", marginRight: "6px", display: "inline" }} />
                                {relatedLead.crm_data.uploaded_by}
                              </div>
                            </div>
                          )}
                          {relatedLead.crm_data.created_at && (
                            <div>
                              <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "6px",
                              }}>
                                Created At
                              </div>
                              <div style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}>
                                <Calendar size={14} style={{ color: "#10b981", marginRight: "6px", display: "inline" }} />
                                {formatDateForTable(relatedLead.crm_data.created_at)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#6b7280",
                        background: "#f9fafb",
                        border: "2px dashed #d1d5db",
                        borderRadius: "12px"
                      }}>
                        No prospect information available
                      </div>
                    )}
                  </div>

                  {/* Prospect Fields Section */}
                  {relatedLead?.crm_data?.data && typeof relatedLead.crm_data.data === 'object' && Object.keys(relatedLead.crm_data.data).length > 0 && (
                    <div style={{ marginBottom: "28px" }}>
                      <h5 style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#1f2937",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                        <div style={{
                          width: "4px",
                          height: "18px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          borderRadius: "2px",
                        }} />
                        Prospect Fields
                      </h5>
                      <div style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "20px",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                          {Object.entries(relatedLead.crm_data.data)
                            .filter(([key]) => key.toLowerCase() !== 'name' && key.toLowerCase() !== 'phone')
                            .map(([key, value]: [string, any]) => (
                              <div key={key}>
                                <div style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#6b7280",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  marginBottom: "6px",
                                }}>
                                  {key.replace(/_/g, ' ')}
                                </div>
                                <div style={{
                                  fontSize: "14px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                  wordBreak: "break-word",
                                }}>
                                  {String(value || 'N/A')}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel - Quick Actions & Timeline */}
            <div style={{ 
              padding: "32px 24px", 
              background: "#fafbfc",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}>
              
              {/* Quick Actions */}
              <div>
                <h6 style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "14px",
                }}>
                  Quick Actions
                </h6>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {session?.user?.permissions?.includes("edit-crm-deals") && (
                    <button
                      style={{
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        cursor: activeFilter === "lost" ? "not-allowed" : "pointer",
                        opacity: activeFilter === "lost" ? 0.6 : 1,
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#1f2937",
                      }}
                      onClick={() => {
                        if (activeFilter === "lost") return;
                        setShowDealViewModal(false);
                        window.location.href = `/crm/deals/${viewingDeal.id}/edit`;
                      }}
                      disabled={activeFilter === "lost"}
                      onMouseOver={(e) => {
                        if (activeFilter === "lost") return;
                        e.currentTarget.style.borderColor = "#10b981";
                        e.currentTarget.style.background = "#f0fdf4";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseOut={(e) => {
                        if (activeFilter === "lost") return;
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "#10b981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Edit size={16} style={{ color: "white" }} />
                      </div>
                      Edit Deal
                    </button>
                  )}

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
                    onClick={() => setShowDealHistoryModal(true)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "#10b981";
                      e.currentTarget.style.background = "#f0fdf4";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <History size={16} style={{ color: "white" }} />
                    </div>
                    View History
                  </button>
                </div>
              </div>

              {/* Status Overview */}
              <div>
                <h6 style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "14px",
                }}>
                  Status Overview
                </h6>
                <div style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                        Stage
                      </span>
                      <Badge 
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "6px",
                          backgroundColor: viewingDeal.stage?.color || "#6c757d",
                        }}
                      >
                        {viewingDeal.stage?.name || "N/A"}
                      </Badge>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                        Value
                      </span>
                      <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
                        {viewingDeal.currency || 'AED'} {parseFloat(String(viewingDeal.net_value || viewingDeal.grand_total || 0)).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                        Probability
                      </span>
                      <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
                        {viewingDeal?.stage?.probability || 0}%
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                        Meetings
                      </span>
                      <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
                        {viewingDeal.meetings?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meetings Timeline */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}>
                  <h6 style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    margin: 0,
                  }}>
                    Recent Meetings
                  </h6>
                  {session?.user?.permissions?.includes("add-meeting-crm-deals") && (
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#10b981",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "6px",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => {
                        setMeetingData({
                          dealId: viewingDeal.id,
                          dealName: viewingDeal.name,
                          meetingName: '',
                          meetingType: 'Online',
                          meetingDate: '',
                          meetingTime: '',
                          meetingOutcome: 'Scheduled',
                          extensions: [],
                        });
                        setMeetingAttendees([]);
                        setShowAddMeetingModal(true);
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#f0fdf4";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      title="Schedule Meeting"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
                <div style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}>
                  {viewingDeal.meetings && viewingDeal.meetings.length > 0 ? (
                    <div style={{ position: "relative" }}>
                      {/* Timeline line */}
                      <div style={{
                        position: "absolute",
                        left: "7px",
                        top: "8px",
                        bottom: "8px",
                        width: "2px",
                        background: "#e5e7eb",
                      }} />
                      
                      {viewingDeal.meetings.slice(0, 5).map((meeting: any, index: number) => {
                        const isCompleted = meeting.meeting_outcome === "Completed - Successful";
                        const isCancelled = meeting.meeting_outcome === "Cancelled";
                        return (
                          <div 
                            key={meeting.id || index}
                            style={{ 
                              position: "relative",
                              paddingLeft: "28px",
                              paddingBottom: index < Math.min(viewingDeal.meetings.length, 5) - 1 ? "16px" : "0",
                            }}
                          >
                            {/* Timeline dot */}
                            <div style={{
                              position: "absolute",
                              left: "0",
                              top: "4px",
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              background: isCompleted ? "#10b981" : isCancelled ? "#dc3545" : "#f59e0b",
                              border: "3px solid white",
                              boxShadow: "0 0 0 1px #e5e7eb",
                            }} />
                            
                            <div>
                              <div style={{ fontSize: "12px", color: "#1f2937", fontWeight: 600, marginBottom: "4px" }}>
                                {meeting.name}
                              </div>
                              <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>
                                {meeting.meeting_date ? moment(meeting.meeting_date).format("MMM DD, YYYY") : "N/A"}
                              </div>
                              {meeting.meeting_outcome && (
                                <Badge
                                  bg={
                                    meeting.meeting_outcome === "Completed - Successful"
                                      ? "success"
                                      : meeting.meeting_outcome === "Completed - Needs Follow-up"
                                      ? "info"
                                      : meeting.meeting_outcome === "Cancelled"
                                      ? "danger"
                                      : meeting.meeting_outcome === "Rescheduled"
                                      ? "warning"
                                      : "secondary"
                                  }
                                  style={{ fontSize: "10px", padding: "2px 8px" }}
                                >
                                  {meeting.meeting_outcome}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {viewingDeal.meetings.length > 5 && (
                        <div style={{
                          textAlign: "center",
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid #f3f4f6",
                        }}>
                          <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>
                            +{viewingDeal.meetings.length - 5} more meetings
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#9ca3af",
                    }}>
                      <Users size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                      <div style={{ fontSize: "13px" }}>No meetings yet</div>
                      {session?.user?.permissions?.includes("add-meeting-crm-deals") && (
                        <button
                          style={{
                            marginTop: "12px",
                            padding: "8px 16px",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => {
                            setMeetingData({
                              dealId: viewingDeal.id,
                              dealName: viewingDeal.name,
                              meetingName: '',
                              meetingType: 'Online',
                              meetingDate: '',
                              meetingTime: '',
                              meetingOutcome: 'Scheduled',
                              extensions: [],
                            });
                            setMeetingAttendees([]);
                            setShowAddMeetingModal(true);
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#059669";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#10b981";
                          }}
                        >
                          <Plus size={14} />
                          Schedule Meeting
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal.Body>

    {/* Footer */}
    <div style={{
      padding: "20px 32px",
      borderTop: "1px solid #e5e7eb",
      background: "white",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        Deal ID: <strong>#{viewingDeal.id}</strong>
      </div>
      <Button
        variant="outline-secondary"
        onClick={() => setShowDealViewModal(false)}
        style={{
          padding: "10px 24px",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "14px",
          border: "2px solid #e5e7eb",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = "#10b981";
          e.currentTarget.style.color = "#10b981";
          e.currentTarget.style.background = "#f0fdf4";
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


      {/* Deal History Modal */}
      {viewingDeal && (
        <Modal 
          show={showDealHistoryModal} 
          onHide={() => {
            setShowDealHistoryModal(false);
          }} 
          size="xl" 
          centered
        >
          {/* Custom Header */}
          <div style={{
            borderBottom: '1px solid #ccc',
            color: 'black',
            padding: '30px',
            position: 'relative',
          }}>
            <button 
              onClick={() => {
                setShowDealHistoryModal(false);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'black',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <History size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 600, fontSize: '24px' }}>
                  Complete Deal History
                </h3>
                <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                  {viewingDeal.name} - All Activities & Changes
                </p>
              </div>
            </div>
          </div>

          <Modal.Body style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Deal Summary Card */}
            <Card className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Deal Name</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{viewingDeal.name}</div>
                  </Col>
                  <Col md={3}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Current Value</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#198754' }}>
                      {viewingDeal.currency || 'AED'} {parseFloat(String(viewingDeal.net_value || viewingDeal.grand_total || 0)).toLocaleString()}
                    </div>
                  </Col>
                  <Col md={3}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Current Stage</div>
                    <Badge bg="primary" style={{ fontSize: '13px', padding: '6px 12px', backgroundColor: viewingDeal.stage?.color || '#6c757d' }}>
                      {viewingDeal.stage?.name || 'Not assigned'}
                    </Badge>
                  </Col>
                  <Col md={3}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Owner</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>
                      {extensions.find((ext: any) => ext?.id == viewingDeal?.assigned_to || ext?.extension == viewingDeal?.assigned_to)?.display_name || 
                       extensions.find((ext: any) => ext?.id == viewingDeal?.assigned_to || ext?.extension == viewingDeal?.assigned_to)?.name || 
                       viewingDeal.assigned_to || 'Not assigned'}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Timeline */}
            {viewingDeal.histories && Array.isArray(viewingDeal.histories) && viewingDeal.histories.length > 0 ? (
              <div style={{ position: 'relative' }}>
                {/* Vertical Timeline Line */}
                <div style={{
                  position: 'absolute',
                  left: '25px',
                  top: '0',
                  bottom: '0',
                  width: '2px',
                  background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                  opacity: 0.3
                }} />
                
                {viewingDeal.histories.map((history: any, index: number) => {
                  // Transform history data to history format
                  const getCategoryAndIcon = (event: string, changes: any) => {
                    if (event === 'created') {
                      return { category: 'Creation', icon: <Plus size={16} />, color: '#198754' };
                    }
                    if (changes && Object.keys(changes).length > 0) {
                      const changeKeys = Object.keys(changes);
                      if (changeKeys.some(k => k.includes('stage'))) {
                        return { category: 'Stage Change', icon: <GitBranch size={16} />, color: '#0d6efd' };
                      }
                      if (changeKeys.some(k => k.includes('grand_total') || k.includes('net_value') || k.includes('discount') || k.includes('value') || k.includes('amount') || k.includes('price'))) {
                        return { category: 'Financial', icon: <DollarSign size={16} />, color: '#198754' };
                      }
                      if (changeKeys.some(k => k.includes('assigned') || k.includes('owner') || k.includes('user_extension'))) {
                        return { category: 'Assignment', icon: <UserCheck size={16} />, color: '#20c997' };
                      }
                      if (changeKeys.some(k => k.includes('contract') || k.includes('quotation'))) {
                        return { category: 'Document', icon: <Send size={16} />, color: '#fd7e14' };
                      }
                      if (changeKeys.some(k => k.includes('probability') || k.includes('negotiation'))) {
                        return { category: 'Update', icon: <FileText size={16} />, color: '#6c757d' };
                      }
                    }
                    return { category: 'Update', icon: <FileText size={16} />, color: '#6c757d' };
                  };

                  const { category, icon, color } = getCategoryAndIcon(history.event, history.changes);
                  const performedBy = extensions.find((ext: any) => ext?.id == history?.user_extension || ext?.extension == history?.user_extension)?.display_name || 
                                     extensions.find((ext: any) => ext?.id == history?.user_extension || ext?.extension == history?.user_extension)?.name || 
                                     history.user_extension || 'System';
                  const timestamp = new Date(history.created_at).toLocaleString();
                  
                  // Build metadata from changes
                  const metadata: Record<string, any> = {};
                  if (history.changes && Object.keys(history.changes).length > 0) {
                    Object.entries(history.changes).forEach(([key, change]: any) => {
                      if(ignoredKeys.includes(key)) return;
                      if (change.old !== undefined && change.new !== undefined) {
                        metadata[key] = `${change.old} → ${change.new}`;
                      } else if (change.new !== undefined) {
                        metadata[key] = change.new;
                      }
                    });
                  }

                  return (
                    <div 
                      key={history.id || index} 
                      style={{
                        position: 'relative',
                        paddingLeft: '60px',
                        paddingBottom: '30px',
                        opacity: 0,
                        animation: `slideIn 0.4s ease forwards ${index * 0.05}s`
                      }}
                    >
                      {/* Timeline Node */}
                      <div style={{
                        position: 'absolute',
                        left: '16px',
                        top: '0',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'white',
                        border: `3px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        boxShadow: `0 0 0 4px ${color}20`
                      }} />
                      
                      {/* Activity Card */}
                      <Card 
                        className="border-0 shadow-sm"
                        style={{
                          transition: 'all 0.3s',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateX(5px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                      >
                        <Card.Body style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: `${color}15`,
                                color: color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {icon}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                                    {history.event === 'created' ? 'Created' : history.event === 'updated' ? 'Updated' : history.event}
                                  </span>
                                  <div
                                    style={{
                                      display: "inline-block",
                                      backgroundColor: color,
                                      color: "#fff",
                                      fontSize: "11px",
                                      padding: "3px 8px",
                                      fontWeight: 500,
                                      borderRadius: "0.375rem",
                                      lineHeight: 1,
                                      textAlign: "center",
                                      whiteSpace: "nowrap",
                                      verticalAlign: "baseline",
                                    }}
                                  >
                                    {category}
                                  </div>
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                                  {history.description || 'Record updated'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} />
                                    {timestamp}
                                  </span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <User size={12} />
                                    {performedBy}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Metadata Tags */}
                          {Object.keys(metadata).length > 0 && (
                            <div style={{ 
                              marginTop: '12px', 
                              paddingTop: '12px', 
                              borderTop: '1px solid #f3f4f6',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              {Object.entries(metadata).map(([key, value]) => (
                                <span 
                                  key={key}
                                  style={{
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    color: '#4b5563'
                                  }}
                                >
                                  <strong>{key}:</strong> {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <History size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>No history available for this deal</p>
              </div>
            )}

            {/* Animation Keyframes */}
            <style>{`
              @keyframes slideIn {
                from {
                  opacity: 0;
                  transform: translateX(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
            `}</style>
          </Modal.Body>

          <Modal.Footer style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '20px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                <strong>{viewingDeal.histories?.length || 0}</strong> activities recorded
              </div>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setShowDealHistoryModal(false);
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                Close
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {/* Manage Attachments Modal */}
      {selectedDealForAttachments && (
        <Modal 
          show={showAttachmentModal} 
          onHide={() => {
            setShowAttachmentModal(false);
            setSelectedDealForAttachments(null);
          }} 
          size="lg" 
          centered
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="d-flex align-items-center gap-2">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center" 
                style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <Paperclip size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>Manage Attachments</div>
                <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: 'normal' }}>
                  {selectedDealForAttachments.name}
                </div>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {/* Upload Section */}
            <div className="mb-4 p-4 border rounded" style={{ background: '#f8f9fa' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="mb-1 fw-bold">Upload New Attachments</h6>
                  <small className="text-muted">Supported formats: PDF, CSV, Excel, or Image (Max 5MB)</small>
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
                {/* <Button 
                  variant="primary" 
                  className="d-flex align-items-center gap-2"
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload
                    </>
                  )}
                </Button> */}
              </div>
            </div>

            {/* Attachments List */}
            <div>
              <h6 className="mb-3 fw-bold d-flex align-items-center gap-2">
                <FileText size={18} />
                Attached Files ({attachments.length})
              </h6>
              
              {loadingAttachments ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Paperclip size={48} className="mb-3 opacity-25" />
                  <div>No attachments yet</div>
                  <small>Upload files using the form above</small>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {attachments.map((attachment: any) => (
                    <Card key={attachment.id} className="border shadow-sm">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            {/* File Icon */}
                            <div 
                              className="rounded d-flex align-items-center justify-content-center"
                              style={{ 
                                width: '45px', 
                                height: '45px', 
                                background: attachment.mime_type?.includes('pdf') ? '#dc3545' : 
                                           attachment.mime_type?.includes('csv') || attachment.mime_type?.includes('excel') || attachment.mime_type?.includes('spreadsheet') ? '#198754' : 
                                           attachment.mime_type?.includes('image') ? '#0d6efd' : '#6c757d',
                                color: 'white'
                              }}
                            >
                              <FileText size={22} />
                            </div>
                            
                            {/* File Info */}
                            <div className="flex-grow-1">
                              <div className="fw-semibold" style={{ fontSize: '14px' }}>{attachment.name}</div>
                              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                {formatFileSize(attachment.file_size)} • {attachment.created_at ? formatDateForTable(attachment.created_at) : 'N/A'}
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
                              onClick={() => handleDownloadAttachment(attachment.id)}
                            >
                              <DownloadIcon size={18} />
                            </Button>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-2 text-danger" 
                              title="Delete"
                              onClick={() => {
                                setAttachmentToDelete({ id: attachment.id, name: attachment.name });
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
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAttachmentModal(false);
                setSelectedDealForAttachments(null);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Add/Edit Meeting Modal */}
      <Modal 
        show={showAddMeetingModal} 
        onHide={() => {
          setShowAddMeetingModal(false);
          setMeetingIdToEdit(null);
          setMeetingData({
            dealId: null,
            dealName: '',
            meetingName: '',
            meetingType: 'Online',
            meetingDate: '',
            meetingTime: '',
            meetingOutcome: '',
            extensions: [],
          });
          setMeetingAttendees([]);
        }} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton style={{ color: 'black', borderBottom: '1px solid #ccc' }}>
          <Modal.Title className="d-flex align-items-center">
            <Users size={24} className="me-2" />
            {meetingIdToEdit ? "Update Meeting" : "Schedule Meeting"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {meetingData.dealName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <User size={20} className="me-2" />
              <span><strong>Deal:</strong> {meetingData.dealName}</span>
            </div>
          )}

          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Meeting Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="text"
                    value={meetingData.meetingName}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingName: e.target.value })}
                    placeholder="Enter meeting name or title..."
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Meeting Type <span className="text-danger">*</span></Form.Label>
                  <Select
                    value={{ value: meetingData.meetingType, label: meetingData.meetingType }}
                    onChange={(option) => setMeetingData({ ...meetingData, meetingType: option?.value || 'Online' })}
                    options={[
                      { value: 'Online', label: 'Online' },
                      { value: 'In-Person', label: 'In-Person' },
                      { value: 'Phone Call', label: 'Phone Call' },
                      { value: 'Video Call', label: 'Video Call' }
                    ]}
                    styles={customSelectStyles}
                    placeholder="Select meeting type..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Meeting Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="date"
                    value={meetingData.meetingDate}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingDate: e.target.value })}
                    min={
                      meetingIdToEdit
                        ? getTodayDate(meetingData.meetingDate)
                        : new Date().toISOString().split("T")[0]
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Meeting Time <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="time"
                    value={meetingData.meetingTime}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingTime: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Meeting Outcome - Only show when editing */}
            {meetingIdToEdit && (
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">
                      Meeting Outcome
                    </Form.Label>
                    <Select
                      value={
                        meetingData.meetingOutcome
                          ? {
                              value: meetingData.meetingOutcome,
                              label: meetingData.meetingOutcome,
                            }
                          : null
                      }
                      onChange={(option) =>
                        setMeetingData({
                          ...meetingData,
                          meetingOutcome: option?.value || "",
                        })
                      }
                      options={[
                        { value: "Scheduled", label: "Scheduled" },
                        {
                          value: "Completed - Successful",
                          label: "Completed - Successful",
                        },
                        {
                          value: "Completed - Needs Follow-up",
                          label: "Completed - Needs Follow-up",
                        },
                        { value: "Cancelled", label: "Cancelled" },
                        { value: "No Show", label: "No Show" },
                        { value: "Rescheduled", label: "Rescheduled" },
                      ]}
                      styles={customSelectStyles}
                      placeholder="Select meeting outcome..."
                      isClearable
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Attendees</Form.Label>
                  <Select
                    isMulti
                    value={meetingAttendees}
                    onChange={(selected) => setMeetingAttendees(selected || [])}
                    options={extensions.map((extension: { id: string; display_name: string; name: string }) => ({
                      value: extension.id,
                      label: extension.display_name || extension.name || extension.id
                    }))}
                    placeholder="Select attendees for this meeting..."
                    styles={customSelectStyles}
                  />
                  <Form.Text className="text-muted">
                    Select users who will attend this meeting.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="alert alert-info mb-0 d-flex align-items-center">
              <AlertCircle size={18} className="me-2" />
              <small>
                Schedule meetings to track important interactions with your
                deals.
              </small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top bg-light">
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setShowAddMeetingModal(false);
              setMeetingIdToEdit(null);
              setMeetingData({
                dealId: null,
                dealName: '',
                meetingName: '',
                meetingType: 'Online',
                meetingDate: '',
                meetingTime: '',
                meetingOutcome: '',
                extensions: [],
              });
              setMeetingAttendees([]);
            }}
          >
            <X size={16} className="me-1" />
            Cancel
          </Button>
          <Button 
            variant="primary"
            disabled={
              !meetingData.meetingName || 
              !meetingData.meetingType || 
              !meetingData.meetingDate || 
              !meetingData.meetingTime ||
              loadingMeeting
            }
            onClick={meetingIdToEdit ? handleUpdateMeeting : handleCreateMeeting}
          >
            {loadingMeeting ? (
              <>
                <div className="spinner-border spinner-border-sm me-1" role="status" />
                {meetingIdToEdit ? "Updating..." : "Scheduling..."}
              </>
            ) : (
              <>
                <Calendar size={16} className="me-1" />
                {meetingIdToEdit ? "Update Meeting" : "Schedule Meeting"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Meeting Modal */}
      <DeleteConfirmationModal
        show={showDeleteMeetingModal}
        onHide={() => {
          setShowDeleteMeetingModal(false);
          setMeetingToDelete(null);
        }}
        onConfirm={confirmDeleteMeeting}
        itemName={meetingToDelete?.meetingName}
        itemType="meeting"
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


      {/* Filters Sidebar */}
      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={() => setShowFiltersSidebar(false)}
        title="Filters"
        subtitle="Filter and refine your deals"
        width="400px"
        filters={[
          {
            id: 'assignedTo',
            label: 'Assigned To',
            type: 'select' as const,
            value: dealsFilters.assignedTo
              ? (() => {
                  const assignedToId = dealsFilters.assignedTo;
                  const ext = extensions.find((e: any) => (e.id || e.extension) === assignedToId);
                  return ext ? { 
                    value: assignedToId, 
                    label: ext.display_name || ext.name || assignedToId 
                  } : { value: assignedToId, label: assignedToId };
                })()
              : null,
            onChange: (selected) => {
              const assignedToValue = selected ? selected.value : null;
              setDealsFilters(prev => ({
                ...prev,
                assignedTo: assignedToValue
              }));
              setActiveFilter('all');
            },
            options: extensions.map((ext: any) => ({ 
              value: ext.id || ext.extension, 
              label: ext.display_name || ext.name || ext.id || ext.extension
            })),
            placeholder: 'Select user...',
            isClearable: true,
            styles: customSelectStyles
          },
          {
            id: 'stage',
            label: 'Stage',
            type: 'select' as const,
            value: dealsFilters.stage
              ? (() => {
                  const stageId = dealsFilters.stage;
                  const stage = stages.find((st: any) => st.id.toString() === stageId);
                  return stage ? { value: stageId, label: stage.name } : { value: stageId, label: stageId };
                })()
              : null,
            onChange: (selected) => {
              const stageValue = selected ? selected.value : null;
              setDealsFilters(prev => ({
                ...prev,
                stage: stageValue
              }));
              if (stageValue) {
                setActiveFilter(stageValue);
              } else {
                setActiveFilter('all');
              }
            },
            options: stages.map(s => ({ value: s.id.toString(), label: s.name })),
            placeholder: 'Select stage...',
            isClearable: true,
            styles: customSelectStyles
          },
          {
            id: 'followUpDateFrom',
            label: 'Follow-up Date From',
            type: 'date' as const,
            value: dealsFilters.followUpDateFrom || '',
            onChange: (value) => setDealsFilters(prev => ({ ...prev, followUpDateFrom: value }))
          },
          {
            id: 'followUpDateTo',
            label: 'Follow-up Date To',
            type: 'date' as const,
            value: dealsFilters.followUpDateTo || '',
            onChange: (value) => setDealsFilters(prev => ({ ...prev, followUpDateTo: value }))
          },
          {
            id: 'probabilityMin',
            label: 'Probability Min (%)',
            type: 'text' as const,
            value: dealsFilters.probabilityMin || '',
            onChange: (value) => setDealsFilters(prev => ({ ...prev, probabilityMin: value })),
            placeholder: '0'
          },
          {
            id: 'probabilityMax',
            label: 'Probability Max (%)',
            type: 'text' as const,
            value: dealsFilters.probabilityMax || '',
            onChange: (value) => setDealsFilters(prev => ({ ...prev, probabilityMax: value })),
            placeholder: '100'
          },
          {
            id: 'dealType',
            label: 'Deal Type',
            type: 'dropdown' as const,
            value: dealsFilters.dealType || '',
            onChange: (value) => setDealsFilters(prev => ({ ...prev, dealType: value })),
            options: [
              { value: '', label: 'Select Deal Type' },
              { value: 'new_sale', label: 'New Sale' },
              { value: 'renewal', label: 'Renewal' },
              { value: 'migration', label: 'Migration' },
              { value: 'upsell', label: 'Upsell' }
            ]
          },
          {
            id: 'approvalStatus',
            label: 'Approval Status',
            type: 'dropdown' as const,
            value: dealsFilters.approvalStatus || '',
            onChange: (value) => setDealsFilters(prev => ({ ...prev, approvalStatus: value })),
            options: [
              { value: '', label: 'Select Approval Status' },
              { value: 'pending', label: 'Pending'},
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ]
          },
          {
            id: 'industry',
            label: 'Industry',
            type: 'dropdown' as const,
            value: dealsFilters.industry || '',
            onChange: (value) => setDealsFilters(prev => ({ ...prev, industry: value })),
            options: [
              { value: '', label: 'Select Industry' },
              { value: 'Technology', label: 'Technology' },
              { value: 'Healthcare', label: 'Healthcare' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Banking & Financial Services', label: 'Banking & Financial Services' },
              { value: 'Manufacturing', label: 'Manufacturing' },
              { value: 'Retail', label: 'Retail' },
              { value: 'Education', label: 'Education' },
              { value: 'Real Estate', label: 'Real Estate' },
              { value: 'Telecommunications', label: 'Telecommunications' },
              { value: 'Construction', label: 'Construction' },
              { value: 'Other', label: 'Other' }
            ]
          },
          {
            id: 'expectedCloseDateFrom',
            label: 'Expected Close Date From',
            type: 'date' as const,
            value: dealsFilters.expectedCloseDateFrom || '',
            onChange: (value) => setDealsFilters(prev => ({ ...prev, expectedCloseDateFrom: value }))
          },
          {
            id: 'expectedCloseDateTo',
            label: 'Expected Close Date To',
            type: 'date' as const,
            value: dealsFilters.expectedCloseDateTo || '',
            onChange: (value) => setDealsFilters(prev => ({ ...prev, expectedCloseDateTo: value }))
          }
        ]}
        onApply={() => {
          // Map dealsFilters to the format expected by handleFiltersChange
          const filtersToApply: Record<string, any> = {};
          
          if (dealsSearch) {
            filtersToApply.search = dealsSearch;
          }
          if (dealsFilters.assignedTo) {
            filtersToApply.assigned_to = dealsFilters.assignedTo;
          }
          if (dealsFilters.stage) {
            filtersToApply.stage_id = dealsFilters.stage;
          }
          if (dealsFilters.followUpDateFrom) {
            filtersToApply.follow_up_date_from = dealsFilters.followUpDateFrom;
          }
          if (dealsFilters.followUpDateTo) {
            filtersToApply.follow_up_date_to = dealsFilters.followUpDateTo;
          }
          if (dealsFilters.probabilityMin) {
            filtersToApply.probability_min = dealsFilters.probabilityMin;
          }
          if (dealsFilters.probabilityMax) {
            filtersToApply.probability_max = dealsFilters.probabilityMax;
          }
          if (dealsFilters.dealType) {
            filtersToApply.deal_type = dealsFilters.dealType;
          }
          filtersToApply.approval_status = dealsFilters.approvalStatus || null;
          if (dealsFilters.industry) {
            filtersToApply.industry = dealsFilters.industry;
          }
          if (dealsFilters.expectedCloseDateFrom) {
            filtersToApply.expected_close_date_from = dealsFilters.expectedCloseDateFrom;
          }
          if (dealsFilters.expectedCloseDateTo) {
            filtersToApply.expected_close_date_to = dealsFilters.expectedCloseDateTo;
          }
          
          handleFiltersChange(filtersToApply);
          setDealsPagination({ ...dealsPagination, currentPage: 1 });
          setRefreshKey(prev => prev + 1);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setDealsSearch("");
          setDealsFilters({
            assignedTo: null,
            stage: null,
            followUpDateFrom: null,
            followUpDateTo: null,
            probabilityMin: null,
            probabilityMax: null,
            dealType: null,
            approvalStatus: null,
            industry: null,
            expectedCloseDateFrom: null,
            expectedCloseDateTo: null,
          });
          handleFiltersChange({});
          setCurrentFilters({});
          setActiveFilter('all');
          setDealsPagination({ ...dealsPagination, currentPage: 1 });
          setRefreshKey(prev => prev + 1);
        }}
        showApplyButton={true}
        showResetButton={true}
      />

      {/* Edit Deal Modal */}
      <Modal 
        show={showEditModal} 
        onHide={handleCloseEditModal} 
        size="xl"
        fullscreen="lg-down"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <Edit size={20} className="me-2" />
            Edit Deal Information
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {editFetching ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading deal data...</p>
            </div>
          ) : (
            <Form onSubmit={handleEditSubmit}>
              {/* Timeline Navigation */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between position-relative">
                  <div 
                    className="position-absolute bg-light" 
                    style={{ 
                      left: '0', 
                      right: '0', 
                      top: '20px', 
                      height: '2px', 
                      zIndex: 0 
                    }}
                  />
                  <div 
                    className="position-absolute bg-primary" 
                    style={{ 
                      left: '0', 
                      top: '20px', 
                      height: '2px', 
                      width: `${(() => {
                        const totalVisibleSteps = editDealTemplate ? 5 : 4;
                        let visualPosition = editFormStep;
                        if (!editDealTemplate && editFormStep > 2) {
                          visualPosition = editFormStep - 1;
                        }
                        return ((visualPosition + 1) / totalVisibleSteps) * 100;
                      })()}%`,
                      zIndex: 0,
                      transition: 'width 0.3s ease'
                    }}
                  />
                  
                  {[0, 1, 2, 3, 4].map((step) => {
                    if (step === 2 && !editDealTemplate) {
                      return null;
                    }
                    
                    const displayNumber = (!editDealTemplate && step > 2) ? step : step + 1;
                    
                    return (
                      <div 
                        key={step}
                        className="text-center position-relative" 
                        style={{ cursor: 'pointer', flex: 1 }}
                        onClick={() => setEditFormStep(step)}
                      >
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${editFormStep >= step ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                          style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                        >
                          {editFormStep > step ? <CheckCircle size={20} /> : displayNumber}
                        </div>
                        <small className={`d-block mt-2 ${editFormStep === step ? 'fw-bold text-primary' : 'text-muted'}`}>
                          {step === 0 ? 'Deal Info' : step === 1 ? 'Company Info' : step === 2 ? 'Characteristics' : step === 3 ? 'Progress & Notes' : 'Estimation'}
                        </small>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Content */}
              <div style={{ minHeight: '400px' }}>
                {/* Step 0: Deal Information */}
                {editFormStep === 0 && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-primary">DEAL INFORMATION</h5>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Deal Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                              type="text" 
                              value={editFormData.name}
                              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                              placeholder="Enter deal name" 
                              required 
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Stage <span className="text-danger">*</span></Form.Label>
                            <Form.Select 
                              value={editFormData.stage_id || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, stage_id: e.target.value ? Number(e.target.value) : undefined })}
                              required
                            >
                              <option value="">Select Stage</option>
                              {stages.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                  {stage.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Expected Close Date <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                              type="date" 
                              value={editFormData.expected_close_date}
                              onChange={(e) => setEditFormData({ ...editFormData, expected_close_date: e.target.value })}
                              required 
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Assigned to <span className="text-danger">*</span></Form.Label>
                            <Form.Select 
                              value={editFormData.assigned_to || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, assigned_to: e.target.value || null })}
                              required
                            >
                              <option value="">Select User</option>
                              {extensions.map((ext: any) => (
                                <option key={ext.id || ext.extension} value={ext.id || ext.extension}>
                                  {ext.display_name || ext.name || ext.id}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Currency <span className="text-danger">*</span></Form.Label>
                            <Form.Select 
                              value={editFormData.currency}
                              onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                              required
                            >
                              <option value="AED">AED</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Follow-up Date</Form.Label>
                            <Form.Control 
                              type="date" 
                              value={editFormData.follow_up_date}
                              onChange={(e) => setEditFormData({ ...editFormData, follow_up_date: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* Step 1: Company Information */}
                {editFormStep === 1 && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-success">COMPANY INFORMATION</h5>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                              type="text" 
                              value={editFormData.company_name}
                              onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                              placeholder="Enter company name" 
                              required 
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Select Business Type <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                              value={editShowOtherBusinessType ? "other" : (editBusinessTypeId ? String(editBusinessTypeId) : "")}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "other") {
                                  setEditShowOtherBusinessType(true);
                                  setEditBusinessTypeId(null);
                                  setEditBusinessTypeOther("");
                                } else if (value) {
                                  setEditShowOtherBusinessType(false);
                                  setEditBusinessTypeId(Number(value));
                                  setEditBusinessTypeOther("");
                                } else {
                                  setEditShowOtherBusinessType(false);
                                  setEditBusinessTypeId(null);
                                  setEditBusinessTypeOther("");
                                }
                              }}
                              required
                            >
                              <option value="">Select Business Type</option>
                              {editBusinessTypes.map((businessType) => (
                                <option key={businessType.id} value={businessType.id}>
                                  {businessType.name}
                                </option>
                              ))}
                              <option value="other">Other</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        {editShowOtherBusinessType && (
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Business Type (Other) <span className="text-danger">*</span></Form.Label>
                              <Form.Control
                                type="text"
                                value={editBusinessTypeOther}
                                onChange={(e) => setEditBusinessTypeOther(e.target.value)}
                                placeholder="Enter business type"
                                required
                              />
                            </Form.Group>
                          </Col>
                        )}
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Decision Maker Title</Form.Label>
                            <Form.Select 
                              value={editFormData.decision_maker_title}
                              onChange={(e) => setEditFormData({ ...editFormData, decision_maker_title: e.target.value })}
                            >
                              <option value="">Select Title</option>
                              <option value="Mr.">Mr.</option>
                              <option value="Mrs.">Mrs.</option>
                              <option value="Ms.">Ms.</option>
                              <option value="Dr.">Dr.</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={8}>
                          <Form.Group className="mb-3">
                            <Form.Label>Decision Maker Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                              type="text" 
                              value={editFormData.decision_maker_name}
                              onChange={(e) => setEditFormData({ ...editFormData, decision_maker_name: e.target.value })}
                              placeholder="Decision maker name" 
                              required 
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Decision Maker Email <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                              type="email" 
                              value={editFormData.decision_maker_email}
                              onChange={(e) => setEditFormData({ ...editFormData, decision_maker_email: e.target.value })}
                              placeholder="decisionmaker@company.com" 
                              required 
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Decision Maker Phone <span className="text-danger">*</span></Form.Label>
                            <div className="phone-input-wrapper">
                              <PhoneInput
                                international
                                defaultCountry="US"
                                value={editFormData.decision_maker_phone_country_code && editFormData.decision_maker_phone 
                                  ? `${editFormData.decision_maker_phone_country_code}${editFormData.decision_maker_phone}` 
                                  : editFormData.decision_maker_phone || undefined}
                                onChange={(value) => {
                                  if (value) {
                                    try {
                                      const phoneNumber = parsePhoneNumberLib(value);
                                      if (phoneNumber) {
                                        setEditFormData(prev => ({
                                          ...prev,
                                          decision_maker_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                          decision_maker_phone: phoneNumber.nationalNumber,
                                        }));
                                      } else {
                                        setEditFormData(prev => ({
                                          ...prev,
                                          decision_maker_phone_country_code: "",
                                          decision_maker_phone: value,
                                        }));
                                      }
                                    } catch (error) {
                                      setEditFormData(prev => ({
                                        ...prev,
                                        decision_maker_phone_country_code: "",
                                        decision_maker_phone: value,
                                      }));
                                    }
                                  } else {
                                    setEditFormData(prev => ({
                                      ...prev,
                                      decision_maker_phone_country_code: "",
                                      decision_maker_phone: "",
                                    }));
                                  }
                                }}
                                placeholder="Enter phone number"
                              />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* Step 2: Deal Characteristics - Only show if template is available */}
                {editFormStep === 2 && editDealTemplate && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0 text-info">DEAL CHARACTERISTICS</h5>
                        {editDealTemplate.name && (
                          <Badge bg="info" className="ms-2">
                            Template: {editDealTemplate.name}
                          </Badge>
                        )}
                      </div>
                      {editDealTemplate.description && (
                        <div className="alert alert-info mb-4">
                          <small>{editDealTemplate.description}</small>
                        </div>
                      )}
                      {editDealTemplate.fields && editDealTemplate.fields.length > 0 ? (
                        <Row>
                          {(() => {
                            const fieldsArray = editDealTemplate.fields || [];
                            const sortedFields = [...fieldsArray].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
                            return sortedFields.map((field: DealTemplateField) => {
                              const fieldValue = editTemplateFieldsData[field.field_name] || '';
                              
                              return (
                                <Col md={6} key={field.field_name}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>
                                      {field.field_name}
                                      {field.is_required && <span className="text-danger"> *</span>}
                                    </Form.Label>
                                    {field.field_type === 'dropdown' ? (
                                      <Form.Select
                                        value={fieldValue}
                                        onChange={(e) => setEditTemplateFieldsData({
                                          ...editTemplateFieldsData,
                                          [field.field_name]: e.target.value
                                        })}
                                        required={field.is_required}
                                      >
                                        <option value="">Select {field.field_name}</option>
                                        {field.options && Array.isArray(field.options) && field.options.map((option: string, index: number) => (
                                          <option key={index} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </Form.Select>
                                    ) : field.field_type === 'text' || !field.field_type ? (
                                      <Form.Control
                                        type="text"
                                        value={fieldValue}
                                        onChange={(e) => setEditTemplateFieldsData({
                                          ...editTemplateFieldsData,
                                          [field.field_name]: e.target.value
                                        })}
                                        placeholder={`Enter ${field.field_name}`}
                                        required={field.is_required}
                                      />
                                    ) : (
                                      <Form.Control
                                        type={field.field_type === 'date' ? 'date' : field.field_type === 'email' ? 'email' : 'text'}
                                        value={fieldValue}
                                        onChange={(e) => setEditTemplateFieldsData({
                                          ...editTemplateFieldsData,
                                          [field.field_name]: e.target.value
                                        })}
                                        placeholder={`Enter ${field.field_name}`}
                                        required={field.is_required}
                                      />
                                    )}
                                  </Form.Group>
                                </Col>
                              );
                            });
                          })()}
                        </Row>
                      ) : (
                        <div className="text-center py-4 text-muted">
                          <p>No fields defined in this template.</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {/* Step 3: Progress & Notes */}
                {editFormStep === 3 && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-warning">NEGOTIATION PROGRESS</h5>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Quotation Sent</Form.Label>
                            <Form.Check
                              type="checkbox"
                              checked={editFormData.quotation_sent}
                              onChange={(e) => setEditFormData({ ...editFormData, quotation_sent: e.target.checked })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Contract Sent</Form.Label>
                            <Form.Check
                              type="checkbox"
                              checked={editFormData.contract_sent}
                              onChange={(e) => setEditFormData({ ...editFormData, contract_sent: e.target.checked })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Contract Received</Form.Label>
                            <Form.Check
                              type="checkbox"
                              checked={editFormData.contract_received}
                              onChange={(e) => setEditFormData({ ...editFormData, contract_received: e.target.checked })}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* Step 4: Estimation Chart */}
                {editFormStep === 4 && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-success">ESTIMATION CHART</h5>
                      
                      {/* Deal-level settings */}
                      <Row className="mb-4">
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Tax Percentage (%)</Form.Label>
                            <Form.Control
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={editFormData.tax_percentage}
                              onChange={(e) => setEditFormData({ ...editFormData, tax_percentage: e.target.value })}
                              placeholder="0"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Standard Discount (%)</Form.Label>
                            <Form.Select
                              value={(editFormData.standard_discount_percentage && parseFloat(editFormData.standard_discount_percentage))}
                              onChange={(e) => setEditFormData({ ...editFormData, standard_discount_percentage: e.target.value })}
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="10">10%</option>
                              <option value="15">15%</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        {extensions?.length > 1 && <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Special Discount (%)</Form.Label>
                            <Form.Control
                              disabled={extensions?.length <= 1}
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={editFormData.special_discount_percentage}
                              onChange={(e) => setEditFormData({ ...editFormData, special_discount_percentage: e.target.value })}
                              placeholder="0"
                            />
                          </Form.Group>
                        </Col>}
                      </Row>

                      {/* Action Buttons */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => setEditShowRevisionHistoryModal(true)}
                        >
                          <History size={14} className="me-1" />
                          Revision History
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setEditEditingItemIndex(null);
                            setEditItemFormData({
                              product_id: null,
                              product_service: "",
                              description: "",
                              qty: 1,
                              unit_price: 0,
                            });
                            setEditShowAllIndustries(false);
                            setEditShowAddItemModal(true);
                          }}
                        >
                          <Plus size={14} className="me-1" />
                          Add Item
                        </Button>
                      </div>

                      {/* Estimation Items Table */}
                      <div className="table-responsive">
                        <Table hover>
                          <thead className="bg-light">
                            <tr>
                              <th>#</th>
                              <th>Product Name</th>
                              <th>Qty</th>
                              {editEstimationItems.some((item) => item.description) && <th>Description</th>}
                              <th className="text-end">Unit Price</th>
                              <th className="text-end">Total Price</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editEstimationItems.map((item, index) => {
                              const subtotal = item.qty * item.unit_price;
                              
                              return (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td className="fw-semibold">{item.product_service || 'N/A'}</td>
                                  <td className="text-center">{item.qty || '0'}</td>
                                  {editEstimationItems.some((i) => i.description) && (
                                    <td className="text-muted small">{item.description || '-'}</td>
                                  )}
                                  <td className="text-end">
                                    {editFormData.currency || 'AED'} {parseFloat(String(item.unit_price || '0')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="text-end fw-semibold">
                                    {editFormData.currency || 'AED'} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1 justify-content-center">
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1"
                                        title="Edit Item"
                                        onClick={() => {
                                          setEditEditingItemIndex(index);
                                          setEditItemFormData({
                                            product_id: item.product_id,
                                            product_service: item.product_service,
                                            description: item.description,
                                            qty: item.qty,
                                            unit_price: item.unit_price,
                                          });
                                          setEditShowAllIndustries(false);
                                          setEditShowAddItemModal(true);
                                        }}
                                      >
                                        <Edit size={16} />
                                      </Button>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1 text-danger"
                                        title="Delete Item"
                                        onClick={() => {
                                          setEditEstimationItems(editEstimationItems.filter((_, i) => i !== index));
                                        }}
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {editEstimationItems.length === 0 && (
                              <tr>
                                <td colSpan={editEstimationItems.some((item) => item.description) ? 7 : 6} className="text-center text-muted py-5">
                                  <Package size={40} className="text-muted mb-3" style={{ opacity: 0.5 }} />
                                  <div>No items in estimation chart</div>
                                  <small>Click "Add Item" to add products or services</small>
                                </td>
                              </tr>
                            )}
                          </tbody>
                          {editEstimationItems.length > 0 && (() => {
                            const grandTotal = editEstimationItems.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
                            const totalDiscountPercentage = parseFloat(editFormData.standard_discount_percentage || "0") + parseFloat(editFormData.special_discount_percentage || "0");
                            const totalDiscount = (grandTotal * totalDiscountPercentage) / 100;
                            const subtotalAfterDiscount = grandTotal - totalDiscount;
                            const taxAmount = (subtotalAfterDiscount * parseFloat(editFormData.tax_percentage || "0")) / 100;
                            const netValue = subtotalAfterDiscount + taxAmount;
                            
                            return (
                              <tfoot className="bg-light">
                                <tr>
                                  <td colSpan={editEstimationItems.some((item) => item.description) ? 6 : 5} className="text-end">
                                    <strong>Subtotal:</strong>
                                  </td>
                                  <td className="text-end fw-semibold">
                                    {editFormData.currency || 'AED'} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                                {totalDiscount > 0 && (
                                  <tr>
                                    <td colSpan={editEstimationItems.some((item) => item.description) ? 6 : 5} className="text-end text-muted">
                                      Discount ({totalDiscountPercentage}%):
                                    </td>
                                    <td className="text-end text-danger">
                                      - {editFormData.currency || 'AED'} {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                )}
                                {parseFloat(editFormData.tax_percentage || "0") > 0 && (
                                  <tr>
                                    <td colSpan={editEstimationItems.some((item) => item.description) ? 6 : 5} className="text-end">
                                      <strong>Tax ({editFormData.tax_percentage}%):</strong>
                                    </td>
                                    <td className="text-end fw-semibold">
                                      {editFormData.currency || 'AED'} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                )}
                                <tr className="border-top border-2">
                                  <td colSpan={editEstimationItems.some((item) => item.description) ? 6 : 5} className="text-end">
                                    <strong className="fs-5">Total:</strong>
                                  </td>
                                  <td className="text-end fw-bold text-success fs-5">
                                    {editFormData.currency || 'AED'} {netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              </tfoot>
                            );
                          })()}
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </div>

              {/* Form Footer */}
              <div className="d-flex justify-content-between mt-4">
                <Button 
                  variant="secondary" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (editFormStep > 0) {
                      let prevStep = editFormStep - 1;
                      if (prevStep === 2 && !editDealTemplate) {
                        prevStep = 1;
                      }
                      setEditFormStep(prevStep);
                    } else {
                      handleCloseEditModal();
                    }
                  }}
                >
                  {editFormStep > 0 ? <><ChevronLeft size={16} className="me-1" /> Previous</> : 'Cancel'}
                </Button>
                <div className="d-flex gap-2">
                  {editFormStep < 4 ? (
                    <Button 
                      variant="primary"
                      onClick={(e) => {
                        e.preventDefault();
                        let nextStep = editFormStep + 1;
                        if (nextStep === 2 && !editDealTemplate) {
                          nextStep = 3;
                        }
                        setEditFormStep(Math.min(4, nextStep));
                      }}
                    >
                      Next <ChevronRight size={16} className="ms-1" />
                    </Button>
                  ) : (
                    <Button variant="primary" type="submit" disabled={editLoading}>
                      {editLoading ? 'Updating...' : 'Update Deal'}
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Add/Edit Item Modal (Sub-modal for Estimation) */}
      <Modal 
        show={editShowAddItemModal} 
        onHide={() => {
          setEditShowAddItemModal(false);
          setEditEditingItemIndex(null);
          setEditItemFormData({
            product_id: null,
            product_service: "",
            description: "",
            qty: 1,
            unit_price: 0,
          });
        }} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{editEditingItemIndex !== null ? 'Edit Item' : 'Add New Item'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Product/Service Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={editItemFormData.product_service}
                    onChange={(e) => setEditItemFormData({ ...editItemFormData, product_service: e.target.value })}
                    placeholder="Enter product or service name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter product description or specifications"
                    value={editItemFormData.description}
                    onChange={(e) => setEditItemFormData({ ...editItemFormData, description: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={editItemFormData.qty}
                    onChange={(e) => setEditItemFormData({ ...editItemFormData, qty: parseInt(e.target.value) || 1 })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Unit Price <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter unit price"
                    value={editItemFormData.unit_price}
                    onChange={(e) => setEditItemFormData({ ...editItemFormData, unit_price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Card className="bg-light border-0">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Sub Total:</span>
                      <h5 className="mb-0 text-success">
                        {editFormData.currency} {(editItemFormData.qty * editItemFormData.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h5>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => {
            setEditShowAddItemModal(false);
            setEditEditingItemIndex(null);
            setEditItemFormData({
              product_id: null,
              product_service: "",
              description: "",
              qty: 1,
              unit_price: 0,
            });
          }}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            disabled={!editItemFormData.product_service || editItemFormData.qty < 1 || editItemFormData.unit_price <= 0}
            onClick={() => {
              const newItem = {
                product_id: editItemFormData.product_id || Date.now(),
                product_service: editItemFormData.product_service,
                description: editItemFormData.description,
                qty: editItemFormData.qty,
                unit_price: editItemFormData.unit_price,
                original_currency: editFormData.currency,
                original_price: editItemFormData.unit_price,
              };

              if (editEditingItemIndex !== null) {
                const updated = [...editEstimationItems];
                updated[editEditingItemIndex] = newItem;
                setEditEstimationItems(updated);
              } else {
                setEditEstimationItems([...editEstimationItems, newItem]);
              }

              setEditShowAddItemModal(false);
              setEditEditingItemIndex(null);
              setEditItemFormData({
                product_id: null,
                product_service: "",
                description: "",
                qty: 1,
                unit_price: 0,
              });
            }}
          >
            {editEditingItemIndex !== null ? 'Update Item' : 'Add Item'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Revision History Modal */}
      <Modal 
        show={editShowRevisionHistoryModal} 
        onHide={() => setEditShowRevisionHistoryModal(false)} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <History size={20} className="me-2" />
            Revision History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editEstimates.length > 0 ? (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead className="bg-light">
                    <tr>
                      <th>Version</th>
                      <th>Created</th>
                      <th>Grand Total</th>
                      <th>Net Value</th>
                      <th>Items</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editEstimates.map((estimate: any, index: number) => {
                      const grandTotal = parseFloat(estimate.grand_total || "0");
                      const netValue = parseFloat(estimate.net_value || "0");
                      const itemCount = estimate.estimation_chart?.length || 0;
                      
                      return (
                        <tr key={estimate.id || index}>
                          <td>
                            <Badge bg="secondary">
                              {estimate.version || `v${editEstimates.length - index}.0`}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Calendar size={14} className="me-2 text-muted" />
                              {new Date(estimate.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="fw-bold text-success">
                            {grandTotal.toLocaleString()} {estimate.currency || editFormData.currency}
                          </td>
                          <td>
                            {netValue.toLocaleString()} {estimate.currency || editFormData.currency}
                          </td>
                          <td>
                            <Badge bg="secondary">{itemCount} items</Badge>
                          </td>
                          <td>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-info"
                              title="Load Version"
                              onClick={() => {
                                if (estimate.estimation_chart && estimate.estimation_chart.length > 0) {
                                  setEditEstimationItems(estimate.estimation_chart.map((item: any) => ({
                                    product_id: item.product_id || 0,
                                    product_service: item.product_service || "",
                                    description: item.description || "",
                                    qty: item.qty || 1,
                                    unit_price: item.unit_price || 0,
                                    original_currency: item.original_currency || estimate.currency || editFormData.currency,
                                    original_price: item.original_price || item.unit_price || 0,
                                  })));
                                  
                                  if (estimate.tax_percentage) {
                                    setEditFormData(prev => ({ ...prev, tax_percentage: estimate.tax_percentage.toString() }));
                                  }
                                  if (estimate.standard_discount_percentage) {
                                    setEditFormData(prev => ({ ...prev, standard_discount_percentage: estimate.standard_discount_percentage.toString() }));
                                  }
                                  if (estimate.special_discount_percentage) {
                                    setEditFormData(prev => ({ ...prev, special_discount_percentage: estimate.special_discount_percentage.toString() }));
                                  }
                                  
                                  setEditShowRevisionHistoryModal(false);
                                  toast.success(`${estimate.version || `v${editEstimates.length - index}.0`} has been loaded successfully!`);
                                } else {
                                  toast.error("This revision has no items to load");
                                }
                              }}
                            >
                              <RefreshCw size={14} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              
              <Card className="border-0 bg-light mt-3">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <small className="text-muted">Total Revisions</small>
                      <div className="fw-bold">{editEstimates.length}</div>
                    </Col>
                    <Col md={6}>
                      <small className="text-muted">Latest Update</small>
                      <div className="fw-bold">
                        {editEstimates.length > 0 ? new Date(editEstimates[0].created_at).toLocaleString() : 'N/A'}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </>
          ) : (
            <div className="text-center text-muted p-5">
              <History size={48} className="mb-3 text-muted" />
              <p className="mb-0">No revision history available</p>
              <small>Revisions will appear here when estimates are created</small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditShowRevisionHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add New Tab Modal */}
      <Modal show={showTabModal} onHide={() => setShowTabModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Tab</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Select a filter to add as a new tab</p>
          <div className="d-grid gap-2">
            {stages.map((stage: any) => {
              const isAlreadyAdded = customTabs.some(t => t.id === stage.id.toString());
              const stageCount = filterCounts[stage.id] || 0;
              return (
                <Button
                  key={stage.id}
                  variant="outline-primary"
                  onClick={() => {
                    if (!isAlreadyAdded) {
                      setCustomTabs([...customTabs, {
                        id: stage.id.toString(),
                        label: stage.name,
                        count: stageCount,
                        removable: true
                      }]);
                      setShowTabModal(false);
                      toast.success('Tab added successfully!');
                    }
                  }}
                  disabled={isAlreadyAdded}
                  className="d-flex align-items-center justify-content-start"
                  style={{ textAlign: 'left' }}
                >
                  <Layers size={16} className="me-2" />
                  {stage.name}
                  {stageCount > 0 && (
                    <Badge bg="secondary" className="ms-auto">
                      {stageCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
            {/* Lost and Deleted tabs */}
            <Button
              variant="outline-primary"
              onClick={() => {
                if (!customTabs.find(t => t.id === 'lost')) {
                  setCustomTabs([...customTabs, {
                    id: 'lost',
                    label: 'Lost',
                    count: filterCounts.lost || 0,
                    removable: true
                  }]);
                  setShowTabModal(false);
                  toast.success('Tab added successfully!');
                }
              }}
              disabled={customTabs.some(t => t.id === 'lost')}
              className="d-flex align-items-center justify-content-start"
              style={{ textAlign: 'left' }}
            >
              <X size={16} className="me-2" />
              Lost
              {(filterCounts.lost || 0) > 0 && (
                <Badge bg="secondary" className="ms-auto">
                  {filterCounts.lost || 0}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => {
                if (!customTabs.find(t => t.id === 'deleted')) {
                  setCustomTabs([...customTabs, {
                    id: 'deleted',
                    label: 'Deleted',
                    count: filterCounts.deleted || 0,
                    removable: true
                  }]);
                  setShowTabModal(false);
                  toast.success('Tab added successfully!');
                }
              }}
              disabled={customTabs.some(t => t.id === 'deleted')}
              className="d-flex align-items-center justify-content-start"
              style={{ textAlign: 'left' }}
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

     {/* Convert to Order Modal */}
{dealToConvert && (
  <ConvertToOrderModal
    show={showConvertToOrderModal}
    onHide={() => {
      setShowConvertToOrderModal(false);
      setDealToConvert(null);
    }}
    dealId={dealToConvert}
    onSuccess={() => {
      // Optionally refresh deals list or show success message
    // toast.success("Order created successfully!");
      setRefreshKey((prev) => prev + 1);
    }}
  />
)}

    </React.Fragment>
  );
};

CrmDeals.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDeals;

