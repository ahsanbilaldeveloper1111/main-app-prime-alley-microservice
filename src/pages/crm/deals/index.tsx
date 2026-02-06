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
import GenericTable, { TableColumn, TableAction } from "@components/GenericTable";
import GenericSidebar from "@components/GenericSidebar";
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
import { GlobalDateFormat, ModuleSlug, formatDateForTable, checkRequiredFields } from "@utils/Helper";
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
  const [estimationItems, setEstimationItems] = useState<Array<{
    product_id: number;
    product_service: string;
    description: string;
    qty: number;
    unit_price: number;
    original_currency: string;
    original_price: number;
  }>>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState({
    product_id: null as number | null,
    product_service: "",
    description: "",
    qty: 1,
    unit_price: 0,
  });
  const [showRevisionHistoryModal, setShowRevisionHistoryModal] = useState(false);
  const [convertingPrice, setConvertingPrice] = useState(false);
  const [showAllIndustries, setShowAllIndustries] = useState(false);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [dealsData, setDealsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDeals, setTotalDeals] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);
  
  const [showConvertToOrderModal, setShowConvertToOrderModal] = useState(false);
const [dealToConvert, setDealToConvert] = useState<number | null>(null);
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
  const [meetingToDelete, setMeetingToDelete] = useState<{ meetingId: number; meetingName?: string } | null>(null);
  
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
  const [editConvertingPrice, setEditConvertingPrice] = useState(false);
  const [editEstimates, setEditEstimates] = useState<any[]>([]);
  const [editAttachments, setEditAttachments] = useState<any[]>([]);
  const [editHistories, setEditHistories] = useState<any[]>([]);
  const [editNegotiationBar, setEditNegotiationBar] = useState(0);
  const [editProbability, setEditProbability] = useState(0);
  
  // UI State
  const [showDealsAnalytics, setShowDealsAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dealsSearch, setDealsSearch] = useState('');
  const [selectedDealsColumns, setSelectedDealsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('dealsSelectedColumns');
    return saved ? JSON.parse(saved) : ['name', 'company', 'stage', 'dealType', 'value', 'assignedUser', 'closeDate', 'owner'];
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
        delete newFilters.approval_status;
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
      if (viewingDeal?.id === meetingData.dealId) {
        await handleViewDeal(meetingData.dealId);
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
        await handleViewDeal(meetingData.dealId);
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
      if (viewingDeal?.id) {
        await handleViewDeal(viewingDeal.id);
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
  }, [meetingToDelete, viewingDeal, handleViewDeal]);

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
      await updateDeal(dealId, {
        follow_up_date: followupData.followUpDate,
      } as any);

      if (viewingDeal?.id === dealId) {
        await handleViewDeal(dealId);
      }
      if (selectedDeal?.id === dealId || selectedDeal?.rawData?.id === dealId) {
        const fresh = await getDeal(dealId);
        setSelectedDeal(fresh || selectedDeal);
      }

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
      setRefreshKey((oldKey) => oldKey + 1);
      toast.success("Follow-up saved successfully!");
    } catch (error) {
      console.error("Failed to save follow-up:", error);
      toast.error("Failed to save follow-up");
    } finally {
      setLoadingFollowUp(false);
    }
  }, [followupData, viewingDeal, selectedDeal, handleViewDeal]);

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
      await updateDeal(dealId, {
        follow_up_date: followupData.followUpDate,
      } as any);

      if (viewingDeal?.id === dealId) {
        await handleViewDeal(dealId);
      }
      if (selectedDeal?.id === dealId || selectedDeal?.rawData?.id === dealId) {
        const fresh = await getDeal(dealId);
        setSelectedDeal(fresh || selectedDeal);
      }

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
      setRefreshKey((oldKey) => oldKey + 1);
      toast.success("Follow-up updated successfully!");
    } catch (error) {
      console.error("Failed to update follow-up:", error);
      toast.error("Failed to update follow-up");
    } finally {
      setLoadingFollowUp(false);
    }
  }, [followUpIdToEdit, followupData, viewingDeal, selectedDeal, handleViewDeal]);

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
    });
    // Set business type
    const dealAny = deal as any;
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
  });
  setEditEstimationItems([]);
  setEditProducts([]);
  setEditShowAddRevisionModal(false);
  setEditEditingRevisionIndex(null);
  setEditRevisionProducts([]);
  setEditRevisionFormData({ tax_percentage: "0", standard_discount_percentage: "0", special_discount_percentage: "0" });
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
        key: 'status',
        label: 'Status',
        sortable: true,
        type: 'text',
        accessor: () => 'pending',
        emptyValue: 'pending'
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
        {
          label: 'Download',
          icon: <DownloadIcon size={16} />,
          onClick: (row: any) => {
            setDealForDownload(row.rawData || row);
            setShowDownloadFileModal(true);
          },
          variant: 'link' as const,
          className: 'text-secondary'
        },
        ...(session?.user?.permissions?.includes('add-crm-orders') ? [{
          label: 'Convert to Order',
          icon: <ShoppingBag size={16} />,
          onClick: (row: any) => {
            setDealToConvert(row.rawData?.id || row.id);
            setShowConvertToOrderModal(true);
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
              }
            ]
          }
        }] : [])
      ];
    },
    [session, activeFilter, handleViewDeal, handleRestoreDeal, handleDeleteDeal, handleMarkLost]
  );
 
  if (!session?.user?.permissions?.includes('list-crm-deals')) {
    return null;
  }
 
  return (
    <React.Fragment>
      <style dangerouslySetInnerHTML={{__html: `
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
        subTitle="Deals"
      />
      <div>
        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
  <nav aria-label="breadcrumb">
    <ol className="breadcrumb mb-0">
      <li className="breadcrumb-item">
        <a href="/dashboard" className="text-decoration-none">
          CRM
        </a>
      </li>
      <li className="breadcrumb-item active fw-bold" aria-current="page">
        Deals
      </li>
    </ol>
  </nav>
</div>
          <div className="d-flex flex-wrap gap-2">
            {/* <Button 
              variant={showDealsAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowDealsAnalytics(!showDealsAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showDealsAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button> */}
            {/* {session?.user?.permissions?.includes('add-crm-deals') && (
              <Link href="/crm/deals/create">
                <Button variant="primary">
                  <Plus size={16} className="me-2" />
                  Add Deal
                </Button>
              </Link>
            )} */}
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
            // {
            //   title: 'Lost',
            //   value: summaryTiles?.lost_deals || filterCounts.lost || 0,
            //   icon: AlertCircle,
            //   iconColor: '#EF4444',
            //   iconBgColor: '#FEE2E2',
            //   subtitle: 'Needs review'
            // },
            // {
            //   title: 'Deleted',
            //   value: summaryTiles?.deleted_deals || filterCounts.deleted || 0,
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
        {showFilterBar && (
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
                          industry: null,
                          expectedCloseDateFrom: null,
                          expectedCloseDateTo: null,
                          approvalStatus: null,
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
          customizableColumns={true}
          defaultSelectedColumns={['name', 'company', 'stage', 'status', 'dealType', 'value', 'assignedUser', 'closeDate', 'owner']}
          columnStorageKey="dealsSelectedColumns"
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
          onRowClick={(row) => {
            if (session?.user?.permissions?.includes('list-crm-deals')) {
              setSelectedDeal(row.rawData || row);
              setShowDealSidebar(true);
            }
          }}
          loading={loading}
          emptyMessage="No deals found matching your criteria"
          loadingMessage="Loading deals..."
          hover={true}
          uniqueKey="id"
        />
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

      {/* Download File Modal */}
      <Modal
        show={showDownloadFileModal}
        onHide={() => {
          setShowDownloadFileModal(false);
          setDealForDownload(null);
        }}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <DownloadIcon size={22} className="me-2" />
            Download File
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            You can download a file for this deal. Click the button below to download a summary file (dummy file for now).
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDownloadFileModal(false);
              setDealForDownload(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const content = dealForDownload
                ? `Deal: ${dealForDownload.name || 'N/A'}\nCompany: ${dealForDownload.company || dealForDownload.company_name || 'N/A'}\nValue: ${dealForDownload.currency || 'AED'} ${dealForDownload.value ?? 'N/A'}\n\nThis is a dummy file for download.`
                : 'This is a dummy file for download.';
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `deal-${dealForDownload?.name?.replace(/\s+/g, '-') || 'export'}-${new Date().toISOString().slice(0, 10)}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              setShowDownloadFileModal(false);
              setDealForDownload(null);
              toast.success('File downloaded successfully');
            }}
          >
            <DownloadIcon size={16} className="me-1" />
            Download file
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Follow-up Modal */}
      <Modal
        show={showAddFollowupModal}
        onHide={() => {
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
        }}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{ color: "black", borderBottom: "1px solid #ccc" }}
        >
          <Modal.Title className="d-flex align-items-center">
            <Calendar size={24} className="me-2" />
            {followUpIdToEdit
              ? "Update Follow up Activity"
              : "Add Follow up Activity"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {followupData.dealName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <Handshake size={20} className="me-2" />
              <span>
                <strong>Deal:</strong> {followupData.dealName}
              </span>
            </div>
          )}

          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Follow-up Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={followupData.followUpDate}
                    onChange={(e) =>
                      setFollowupData({
                        ...followupData,
                        followUpDate: e.target.value,
                      })
                    }
                    min={
                      followUpIdToEdit
                        ? getTodayDate(followupData.followUpDate)
                        : new Date().toISOString().split("T")[0]
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Status</Form.Label>
                  <Select
                    value={{
                      value: followupData.followUpStatus,
                      label: followupData.followUpStatus,
                    }}
                    onChange={(option) =>
                      setFollowupData({
                        ...followupData,
                        followUpStatus: option?.value || "Pending",
                      })
                    }
                    options={[
                      { value: "Pending", label: "Pending" },
                      { value: "In Progress", label: "In Progress" },
                      { value: "Completed", label: "Completed" },
                      { value: "Cancelled", label: "Cancelled" },
                    ]}
                    styles={customSelectStyles}
                    placeholder="Select status..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Communication Channel <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    value={{
                      value: followupData.communicationChannel,
                      label: followupData.communicationChannel,
                    }}
                    onChange={(option) =>
                      setFollowupData({
                        ...followupData,
                        communicationChannel: option?.value || "Phone Call",
                        communicationChannelOther: "",
                      })
                    }
                    options={[
                      { value: "Phone Call", label: "Phone Call" },
                      { value: "Email", label: "Email" },
                      { value: "Video Call", label: "Video Call" },
                      {
                        value: "In-Person Meeting",
                        label: "In-Person Meeting",
                      },
                      { value: "SMS", label: "SMS" },
                      { value: "WhatsApp", label: "WhatsApp" },
                      { value: "Other", label: "Other" },
                    ]}
                    styles={customSelectStyles}
                    placeholder="Select communication channel..."
                  />
                </Form.Group>
              </Col>
            </Row>

            {followupData.communicationChannel === "Other" && (
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">
                      Communication Channel (Other){" "}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={followupData.communicationChannelOther}
                      onChange={(e) =>
                        setFollowupData({
                          ...followupData,
                          communicationChannelOther: e.target.value,
                        })
                      }
                      placeholder="Specify communication channel..."
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={followupData.notes}
                    onChange={(e) =>
                      setFollowupData({
                        ...followupData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Add notes, description, or specific action items for this follow-up..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="alert alert-info mb-0 d-flex align-items-center">
              <AlertCircle size={18} className="me-2" />
              <small>
                Follow-up activities help track communication and next steps
                with deals.
              </small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => {
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
            }}
          >
            <X size={16} className="me-1" />
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={
              !followupData.followUpDate ||
              !followupData.communicationChannel ||
              (followupData.communicationChannel === "Other" &&
                !followupData.communicationChannelOther?.trim()) ||
              loadingFollowUp
            }
            onClick={
              followUpIdToEdit ? handleUpdateFollowUp : handleCreateFollowUp
            }
          >
            {loadingFollowUp ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                />
                {followUpIdToEdit ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <Plus size={16} className="me-1" />
                {followUpIdToEdit ? "Update Follow up" : "Add Follow up"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Deal Sidebar */}
      <GenericSidebar
        isOpen={showDealSidebar}
        onClose={() => {
          setShowDealSidebar(false);
          setSelectedDeal(null);
        }}
        title={selectedDeal?.name || 'Deal Details'}
        subtitle={selectedDeal?.company || selectedDeal?.company_name || ''}
        metadata={selectedDeal?.id ? `Deal ID: ${selectedDeal.id}` : ''}
        avatar={{
          name: selectedDeal?.name || 'Deal',
          useIcon: true
        }}
        contextPayload={
          selectedDeal
            ? (() => {
                const { follow_ups, meetings, audit_trail, ...dealRest } = selectedDeal ?? {};
                const dealForPayload = selectedDeal ? { ...dealRest } : undefined;
                return { deal: dealForPayload };
              })()
            : undefined
        }
        width="420px"
        tabs={[
          {
            id: 'general',
            label: 'General Information',
            sections: [
              {
                id: 'deal-info',
                title: 'Deal Information',
                icon: Handshake,
                fields: [
                  {
                    label: 'Deal Name',
                    value: selectedDeal?.name || 'N/A',
                    type: 'text' as const
                  },
                  {
                    label: 'Stage',
                    value: typeof selectedDeal?.stage === 'string' 
                      ? selectedDeal.stage 
                      : (selectedDeal?.stage?.name || selectedDeal?.rawData?.stage?.name || 'N/A'),
                    type: 'badge' as const,
                    badgeVariant: 'primary'
                  },
                  {
                    label: 'Deal Value',
                    value: selectedDeal?.value 
                      ? `${selectedDeal?.currency || 'AED'} ${parseFloat(String(selectedDeal.value)).toLocaleString()}`
                      : 'N/A',
                    type: 'text' as const,
                    icon: DollarSign
                  },
                  {
                    label: 'Probability',
                    value: selectedDeal?.probability ? `${selectedDeal.probability}%` : 'N/A',
                    type: 'text' as const
                  },
                  {
                    label: 'Deal Type',
                    value: selectedDeal?.dealType || selectedDeal?.deal_type || 'N/A',
                    type: 'badge' as const,
                    badgeVariant: 'info',
                    show: !!(selectedDeal?.dealType || selectedDeal?.deal_type)
                  },
                  {
                    label: 'Assigned To',
                    value: selectedDeal?.assignedUser || 'Unassigned',
                    type: 'text' as const,
                    icon: User
                  },
                  {
                    label: 'Created Date',
                    value: selectedDeal?.created || selectedDeal?.created_at,
                    type: 'date' as const,
                    icon: Calendar
                  },
                  {
                    label: 'Expected Close Date',
                    value: selectedDeal?.closeDate || selectedDeal?.expected_close_date,
                    type: 'date' as const,
                    show: !!(selectedDeal?.closeDate || selectedDeal?.expected_close_date)
                  },
                  {
                    label: 'Risk Level',
                    value: selectedDeal?.riskLevel || selectedDeal?.risk_level || 'N/A',
                    type: 'badge' as const,
                    badgeVariant: selectedDeal?.riskLevel === 'High' || selectedDeal?.risk_level === 'High' ? 'danger' : 
                                 selectedDeal?.riskLevel === 'Medium' || selectedDeal?.risk_level === 'Medium' ? 'warning' : 'success',
                    show: !!(selectedDeal?.riskLevel || selectedDeal?.risk_level)
                  },
                  {
                    label: 'Follow-ups',
                    value: `${selectedDeal?.follow_ups?.length ?? (selectedDeal?.follow_up_date ? 1 : 0)} follow-up(s)`,
                    type: 'text' as const,
                    icon: History,
                    show: true
                  }
                ]
              },
              {
                id: 'client-info',
                title: 'Client Information',
                icon: Building2,
                fields: [
                  {
                    label: 'Client Name',
                    value: selectedDeal?.company || selectedDeal?.company_name || 'N/A',
                    type: 'text' as const,
                    icon: Building2
                  },
                  {
                    label: 'Industry',
                    value: selectedDeal?.industry || 'N/A',
                    type: 'text' as const,
                    show: !!selectedDeal?.industry
                  }
                ]
              }
            ]
          },
          {
            id: 'campaign-prospect',
            label: 'Campaign & Prospect',
            sections: [
              {
                id: 'campaign-info',
                title: 'Campaign Information',
                icon: Target,
                emptyState: {
                  icon: Target,
                  message: 'No campaign information available'
                }
              },
              {
                id: 'prospect-info',
                title: 'Prospect Information',
                icon: User,
                emptyState: {
                  icon: User,
                  message: 'No prospect information available'
                }
              },
              {
                id: 'prospect-fields',
                title: 'Prospect Fields',
                icon: FileText,
                emptyState: {
                  icon: FileText,
                  message: 'No prospect fields available'
                }
              },
              {
                id: 'follow-ups',
                title: 'Follow-ups',
                icon: History,
                badge: {
                  value: selectedDeal?.follow_ups?.length ?? (selectedDeal?.follow_up_date ? 1 : 0),
                  variant: 'secondary'
                },
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
              },
              {
                id: 'meetings',
                title: 'Meetings',
                icon: Calendar,
                badge: {
                  value: 0,
                  variant: 'secondary'
                },
                emptyState: {
                  icon: Calendar,
                  message: 'No meetings scheduled yet',
                  action: {
                    label: 'Schedule Meeting',
                    onClick: () => {
                      const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                      if (dealId) {
                        setMeetingData({
                          dealId: dealId,
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
                    }
                  }
                }
              }
            ]
          }
        ]}
        actions={[
          {
            label: 'Edit Deal',
            icon: Edit,
            onClick: () => {
              setShowDealSidebar(false);
              window.location.href = `/crm/deals/${selectedDeal?.id || selectedDeal?.rawData?.id}/edit`;
            },
            variant: 'primary',
            show: session?.user?.permissions?.includes('edit-crm-deals') && activeFilter !== 'lost'
          },
          {
            label: 'View History',
            icon: History,
            onClick: () => {
              setShowDealSidebar(false);
              handleViewDeal(selectedDeal?.id || selectedDeal?.rawData?.id);
              setShowDealHistoryModal(true);
            },
            variant: 'outline-primary'
          }
        ]}
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
            id: 'search',
            label: 'Search',
            type: 'text' as const,
            value: dealsSearch,
            onChange: (value) => setDealsSearch(value),
            placeholder: 'Search deals by name, company, value...'
          },
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
              { value: 'pending', label: 'Pending' },
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
          if (dealsFilters.approvalStatus) {
            filtersToApply.approval_status = dealsFilters.approvalStatus;
          }
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
            industry: null,
            expectedCloseDateFrom: null,
            expectedCloseDateTo: null,
            approvalStatus: null,
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
                      {/* <h5 className="fw-bold mb-4 text-success">ESTIMATION CHART</h5> */}
                      
                      {/* Deal-level settings */}
                      {/* <Row className="mb-4">
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
                      </Row> */}

                      {/* Action Button - Add Revision/Quotation */}
                      <div className="d-flex justify-content-end align-items-center mb-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            setEditEditingRevisionIndex(null);
                            setEditRevisionProducts([]);
                            setEditRevisionFormData({
                              tax_percentage: editFormData.tax_percentage || "0",
                              standard_discount_percentage: editFormData.standard_discount_percentage || "0",
                              special_discount_percentage: editFormData.special_discount_percentage || "0",
                            });
                            setEditRevisionSelectedProductIds([]);
                            setEditShowAddRevisionModal(true);
                            setEditRevisionLoadingProducts(true);
                            try {
                              const res = await getCrmProducts({ per_page: 100 });
                              setEditRevisionProductsCatalog(res?.data || []);
                            } catch (_e) {
                              setEditRevisionProductsCatalog([]);
                            } finally {
                              setEditRevisionLoadingProducts(false);
                            }
                          }}
                        >
                          <Plus size={14} className="me-1" />
                          Add Revision
                        </Button>
                      </div>

                      {/* Revision History Table (replaces product listing) */}
                      <div className="table-responsive">
                        <Table hover className="align-middle">
                          <thead className="bg-light">
                            <tr>
                              <th>Version</th>
                              <th>Created</th>
                              <th>Grand Total</th>
                              <th>Net Value</th>
                              <th>Items</th>
                              <th style={{ minWidth: 'auto' }}>Actions</th>
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
                                  <td style={{ minWidth: 'auto' }}>
                                    <div className="d-flex gap-1 justify-content-center">
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1"
                                        title="Edit revision"
                                        onClick={async () => {
                                          setEditEditingRevisionIndex(index);
                                          setEditRevisionProducts((estimate.estimation_chart || []).map((item: any) => ({
                                            product_id: item.product_id || 0,
                                            product_service: item.product_service || "",
                                            description: item.description || "",
                                            qty: item.qty || 1,
                                            unit_price: item.unit_price || 0,
                                            original_currency: item.original_currency || estimate.currency || editFormData.currency,
                                            original_price: item.original_price || item.unit_price || 0,
                                            tax_percentage: (item.tax_percentage != null ? String(item.tax_percentage) : estimate.tax_percentage != null ? String(estimate.tax_percentage) : "0"),
                                            standard_discount_percentage: (item.standard_discount_percentage != null ? String(item.standard_discount_percentage) : estimate.standard_discount_percentage != null ? String(estimate.standard_discount_percentage) : "0"),
                                            special_discount_percentage: (item.special_discount_percentage != null ? String(item.special_discount_percentage) : estimate.special_discount_percentage != null ? String(estimate.special_discount_percentage) : "0"),
                                          })));
                                          setEditRevisionFormData({
                                            tax_percentage: estimate.tax_percentage?.toString() || "0",
                                            standard_discount_percentage: estimate.standard_discount_percentage?.toString() || "0",
                                            special_discount_percentage: estimate.special_discount_percentage?.toString() || "0",
                                          });
                                          setEditRevisionSelectedProductIds([]);
                                          setEditShowAddRevisionModal(true);
                                          setEditRevisionLoadingProducts(true);
                                          try {
                                            const res = await getCrmProducts({ per_page: 100 });
                                            setEditRevisionProductsCatalog(res?.data || []);
                                          } catch (_e) {
                                            setEditRevisionProductsCatalog([]);
                                          } finally {
                                            setEditRevisionLoadingProducts(false);
                                          }
                                        }}
                                      >
                                        <Edit size={16} />
                                      </Button>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1 text-danger"
                                        title="Delete revision"
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to delete ${estimate.version || `v${editEstimates.length - index}.0`}?`)) {
                                            setEditEstimates(editEstimates.filter((_, i) => i !== index));
                                            toast.success("Revision removed");
                                          }
                                        }}
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* EMPTY STATE */}
                            {editEstimates.length === 0 && (
                              <tr>
                                <td colSpan={6} className="text-center text-muted py-5">
                                  <History size={40} className="mb-3 text-muted d-block mx-auto" style={{ opacity: 0.5 }} />
                                  <div>No revision history available</div>
                                  <small>Revisions will appear here when estimates are created</small>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>

                      {/* Summary Card */}
                      {editEstimates.length > 0 && (
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
                      )}

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

      {/* Add/Edit Revision Modal (Quotation with multiple products) */}
      <Modal 
        show={editShowAddRevisionModal} 
        onHide={() => {
          setEditShowAddRevisionModal(false);
          setEditEditingRevisionIndex(null);
          setEditRevisionProducts([]);
          setEditRevisionFormData({ tax_percentage: "0", standard_discount_percentage: "0", special_discount_percentage: "0" });
        }} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{editEditingRevisionIndex !== null ? 'Edit Revision / Quotation' : 'Add Revision / Quotation'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Default Tax & Discount (applied when adding new products) */}
            {/* <Row className="g-3 mb-3">
              <Col md={12}>
                <Form.Text className="text-muted small">Default Tax & Discount — used when you add new products below. Each product can then have its own values in the table.</Form.Text>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Default Tax (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editRevisionFormData.tax_percentage}
                    onChange={(e) => setEditRevisionFormData({ ...editRevisionFormData, tax_percentage: e.target.value })}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Default Standard Discount (%)</Form.Label>
                  <Form.Select
                    value={editRevisionFormData.standard_discount_percentage}
                    onChange={(e) => setEditRevisionFormData({ ...editRevisionFormData, standard_discount_percentage: e.target.value })}
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Default Special Discount (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editRevisionFormData.special_discount_percentage}
                    onChange={(e) => setEditRevisionFormData({ ...editRevisionFormData, special_discount_percentage: e.target.value })}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
            </Row> */}

            {/* Product selection - multi-select */}
            <Form.Group className="mb-3">
              <Form.Label>Add Products</Form.Label>
              <Select
                isMulti
                value={editRevisionSelectedProductIds}
                onChange={(selected) => setEditRevisionSelectedProductIds(selected ? [...selected] : [])}
                options={editRevisionProductsCatalog.map((p) => ({
                  value: p.id,
                  label: `${p.name} - ${editFormData.currency || 'AED'} ${p.price || 0}`,
                }))}
                placeholder={editRevisionLoadingProducts ? "Loading products..." : "Select products to add..."}
                isDisabled={editRevisionLoadingProducts}
                isSearchable
              />
              <div className="d-flex gap-2 mt-2 flex-wrap">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    const toAdd = editRevisionProductsCatalog.filter((p) =>
                      editRevisionSelectedProductIds.some((s) => s.value === p.id) &&
                      !editRevisionProducts.some((ep) => ep.product_id === p.id)
                    );
                    const newItems = toAdd.map((p) => ({
                      product_id: p.id,
                      product_service: p.name || "",
                      description: "",
                      qty: 1,
                      unit_price: parseFloat(p.price || "0"),
                      original_currency: editFormData.currency || "AED",
                      original_price: parseFloat(p.price || "0"),
                      tax_percentage: editRevisionFormData.tax_percentage,
                      standard_discount_percentage: editRevisionFormData.standard_discount_percentage,
                      special_discount_percentage: editRevisionFormData.special_discount_percentage,
                    }));
                    setEditRevisionProducts([...editRevisionProducts, ...newItems]);
                    setEditRevisionSelectedProductIds([]);
                  }}
                  disabled={editRevisionSelectedProductIds.length === 0}
                >
                  <Plus size={14} className="me-1" />
                  Add Selected Products
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setEditRevisionProducts([...editRevisionProducts, {
                      product_id: Date.now(),
                      product_service: "",
                      description: "",
                      qty: 1,
                      unit_price: 0,
                      original_currency: editFormData.currency || "AED",
                      original_price: 0,
                      tax_percentage: editRevisionFormData.tax_percentage,
                      standard_discount_percentage: editRevisionFormData.standard_discount_percentage,
                      special_discount_percentage: editRevisionFormData.special_discount_percentage,
                    }]);
                  }}
                >
                  <Plus size={14} className="me-1" />
                  Add Custom Product
                </Button>
              </div>
            </Form.Group>

            {/* Products in this revision - each product has its own Tax, Standard discount, Special discount */}
            <Form.Label>Products in this revision</Form.Label>
            <div className="table-responsive mb-3">
              <Table size="sm" hover>
                <thead className="bg-light">
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Tax (%)</th>
                    <th>Std Disc (%)</th>
                    <th>Spec Disc (%)</th>
                    <th>Line Total</th>
                    <th style={{ minWidth: 'auto' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {editRevisionProducts.map((item, idx) => {
                    const subtotal = (item.qty || 0) * (item.unit_price || 0);
                    const taxPct = parseFloat(String(item.tax_percentage ?? "0")) || 0;
                    const stdPct = parseFloat(String(item.standard_discount_percentage ?? "0")) || 0;
                    const specPct = parseFloat(String(item.special_discount_percentage ?? "0")) || 0;
                    const discPct = stdPct + specPct;
                    const disc = (subtotal * discPct) / 100;
                    const afterDisc = subtotal - disc;
                    const tax = (afterDisc * taxPct) / 100;
                    const lineTotal = afterDisc + tax;
                    return (
                      <tr key={idx}>
                        <td>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="Product name"
                            value={item.product_service}
                            onChange={(e) => {
                              const updated = [...editRevisionProducts];
                              updated[idx] = { ...item, product_service: e.target.value };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min="1"
                            size="sm"
                            style={{ width: 70 }}
                            value={item.qty}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || 1;
                              const updated = [...editRevisionProducts];
                              updated[idx] = { ...item, qty: v };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            size="sm"
                            style={{ width: 90 }}
                            value={item.unit_price}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              const updated = [...editRevisionProducts];
                              updated[idx] = { ...item, unit_price: v, original_price: v };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            size="sm"
                            style={{ width: 70 }}
                            value={item.tax_percentage ?? "0"}
                            onChange={(e) => {
                              const updated = [...editRevisionProducts];
                              updated[idx] = { ...item, tax_percentage: e.target.value };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            size="sm"
                            style={{ width: 70 }}
                            value={item.standard_discount_percentage ?? "0"}
                            onChange={(e) => {
                              const updated = [...editRevisionProducts];
                              updated[idx] = { ...item, standard_discount_percentage: e.target.value };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            size="sm"
                            style={{ width: 70 }}
                            value={item.special_discount_percentage ?? "0"}
                            onChange={(e) => {
                              const updated = [...editRevisionProducts];
                              updated[idx] = { ...item, special_discount_percentage: e.target.value };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>{editFormData.currency || 'AED'} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ minWidth: 'auto' }}>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger"
                            onClick={() => setEditRevisionProducts(editRevisionProducts.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              {editRevisionProducts.length === 0 && (
                <div className="text-center text-muted py-3 small">No products. Select products above and click "Add Selected Products".</div>
              )}
            </div>

            {/* Grand total preview (sum of per-product line totals) */}
            {editRevisionProducts.length > 0 && (() => {
              const subtotalAll = editRevisionProducts.reduce((s, i) => s + (i.qty || 0) * (i.unit_price || 0), 0);
              let totalDiscount = 0;
              let totalTax = 0;
              editRevisionProducts.forEach((i) => {
                const st = (i.qty || 0) * (i.unit_price || 0);
                const stdPct = parseFloat(String(i.standard_discount_percentage ?? "0")) || 0;
                const specPct = parseFloat(String(i.special_discount_percentage ?? "0")) || 0;
                const taxPct = parseFloat(String(i.tax_percentage ?? "0")) || 0;
                const disc = (st * (stdPct + specPct)) / 100;
                const afterDisc = st - disc;
                totalDiscount += disc;
                totalTax += (afterDisc * taxPct) / 100;
              });
              const grandTotal = subtotalAll - totalDiscount + totalTax;
              return (
                <Card className="bg-light border-0">
                  <Card.Body className="py-2">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Subtotal:</span>
                      <span>{editFormData.currency} {subtotalAll.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="d-flex justify-content-between text-danger">
                        <span>Total Discount:</span>
                        <span>- {editFormData.currency} {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {totalTax > 0 && (
                      <div className="d-flex justify-content-between">
                        <span>Total Tax:</span>
                        <span>{editFormData.currency} {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between fw-bold mt-1 pt-1 border-top">
                      <span>Grand Total:</span>
                      <span className="text-success">{editFormData.currency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </Card.Body>
                </Card>
              );
            })()}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => {
            setEditShowAddRevisionModal(false);
            setEditEditingRevisionIndex(null);
            setEditRevisionProducts([]);
          }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={editRevisionProducts.length === 0}
            onClick={async () => {
              if (!editingDealId || editRevisionProducts.length === 0) return;
              try {
                const payload = {
                  deal_id: editingDealId,
                  estimation_chart: editRevisionProducts.map((item) => ({
                    product_id: item.product_id,
                    product_service: item.product_service,
                    description: item.description || "",
                    qty: item.qty,
                    unit_price: item.unit_price,
                    original_currency: item.original_currency || editFormData.currency,
                    original_price: item.original_price ?? item.unit_price,
                    tax_percentage: parseFloat(String(item.tax_percentage ?? "0")),
                    standard_discount_percentage: parseFloat(String(item.standard_discount_percentage ?? "0")),
                    special_discount_percentage: parseFloat(String(item.special_discount_percentage ?? "0")),
                  })),
                  standard_discount_percentage: parseFloat(editRevisionFormData.standard_discount_percentage || "0"),
                  special_discount_percentage: parseFloat(editRevisionFormData.special_discount_percentage || "0"),
                  tax_percentage: parseFloat(editRevisionFormData.tax_percentage || "0"),
                  currency: editFormData.currency,
                };
                await createEstimate(payload, false);
                let netValue = 0;
                editRevisionProducts.forEach((i) => {
                  const st = (i.qty || 0) * (i.unit_price || 0);
                  const stdPct = parseFloat(String(i.standard_discount_percentage ?? "0")) || 0;
                  const specPct = parseFloat(String(i.special_discount_percentage ?? "0")) || 0;
                  const taxPct = parseFloat(String(i.tax_percentage ?? "0")) || 0;
                  const disc = (st * (stdPct + specPct)) / 100;
                  const afterDisc = st - disc;
                  netValue += afterDisc + (afterDisc * taxPct) / 100;
                });
                const subtotal = editRevisionProducts.reduce((s, i) => s + (i.qty || 0) * (i.unit_price || 0), 0);
                const newEstimate = {
                  id: Date.now(),
                  estimation_chart: editRevisionProducts,
                  grand_total: subtotal,
                  net_value: netValue,
                  tax_percentage: editRevisionFormData.tax_percentage,
                  standard_discount_percentage: editRevisionFormData.standard_discount_percentage,
                  special_discount_percentage: editRevisionFormData.special_discount_percentage,
                  currency: editFormData.currency,
                  created_at: new Date().toISOString(),
                  version: `v${editEstimates.length + 1}.0`,
                };
                if (editEditingRevisionIndex !== null) {
                  const updated = [...editEstimates];
                  updated[editEditingRevisionIndex] = { ...updated[editEditingRevisionIndex], ...newEstimate };
                  setEditEstimates(updated);
                } else {
                  setEditEstimates([newEstimate, ...editEstimates]);
                }
                toast.success(editEditingRevisionIndex !== null ? "Revision updated!" : "Revision added!");
                setEditShowAddRevisionModal(false);
                setEditEditingRevisionIndex(null);
                setEditRevisionProducts([]);
              } catch (err: any) {
                toast.error(err?.message || "Failed to save revision");
              }
            }}
          >
            {editEditingRevisionIndex !== null ? 'Update Revision' : 'Save Revision'}
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
      toast.success("Order created successfully!");
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

