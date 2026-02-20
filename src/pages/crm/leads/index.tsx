import "@assets/scss/datatable-style.scss";
import parsePhoneNumber from "libphonenumber-js";
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
import GenericSidebar from "@components/GenericSidebarNew";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import {
  getLeads,
  getLead,
  deleteLead,
  convertLead,
  markLeadLost,
  getStages,
  createLeadFollowUp,
  updateLeadFollowUp,
  deleteLeadFollowUp,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  restoreLead,
  updateLead,
  getCampaigns,
  getCampaignById,
  getCrmData,
  getCrmDataById,
  getBusinessTypes,
  getLeadFollowUps,
  getMeetings,
} from "@utils/crm";
import type {
  StageData,
  CampaignData,
  CrmDataItem,
  IndustryData,
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
  Popover,
  OverlayTrigger,
  Tooltip as BsTooltip,
  Spinner,
} from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber as parsePhoneLib } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Country, State, City } from "country-state-city";
import {
  ModuleSlug,
  formatDateForTable,
  checkRequiredFields,
  GlobalDateFormat,
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
  Handshake,
  MoreVertical,
  X,
  Users,
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
  Mail,
  Phone as PhoneIcon,
  Phone,
  ChartLine,
  Building2,
  User,
  History,
  FileText,
  GitBranch,
  DollarSign,
  UserCheck,
  AlertCircle,
  RotateCcw,
  CheckSquare,
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
  FiPlus,
} from "react-icons/fi";
import { toast } from "react-toastify";
import moment from "moment";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import FormModal from "../../partial/FormModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";
import { useCti } from "../../../contexts/CtiContext";
import type { StatsCardData } from "@components/GenericStatsCards";
import CreateLeadModal from "@components/CreateLeadModal";

import ConvertToDealModal from "@components/ConvertToDealModal";
// Type definition for transformed lead data
interface LeadData {
  id: any;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  stage: string;
  stageColor: string;
  leadPotential: string;
  lead_score: number;
  assignedUser: string;
  created: string;
  lastActivity: string;
  followUps: any[];
  meetings: any[];
  source: string;
  campaign: string;
  isLost: boolean;
  lostReasonName?: string;
  rawData: any;
  [key: string]: any; // Index signature
}

const ignoredKeys = ["stage_id", "contact_persons"];
// Phone Container Component (with Badge for tables)
const PhoneContainer = ({
  phone,
  onClick,
}: {
  phone: string;
  onClick?: () => void;
}) => {
  const [showPopover, setShowPopover] = useState(false);

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

  const phoneBadge = (
    <Badge
      bg="info"
      className="bg-opacity-10 text-dark"
      style={{ cursor: onClick ? "pointer" : "default" }}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <div className="d-flex align-items-center gap-2">
        {phoneNumber?.countryCode && (
          <img src={flagImgSrc} alt={phoneNumber.countryCode} />
        )}
        {phoneNumber.phone}
      </div>
    </Badge>
  );

  if (!onClick) {
    return phoneBadge;
  }

  const popover = (
    <Popover
      id={`phone-popover-${phone}`}
      style={{
        maxWidth: "160px",
        pointerEvents: "auto",
        border: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
      }}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <Popover.Body
        className="p-0"
        style={{
          padding: "8px",
          borderRadius: "8px",
        }}
      >
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
            setShowPopover(false);
          }}
          className="d-flex align-items-center justify-content-center gap-2 w-100"
          style={{
            fontSize: "13px",
            fontWeight: "600",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #dee2e6",
            backgroundColor: "transparent",
            color: "#212529",
            boxShadow: "none",
            transition: "all 0.2s ease",
            minHeight: "36px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.backgroundColor = "#f8f9fa";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Phone size={18} style={{ strokeWidth: 2.5 }} />
          <span>Call</span>
        </Button>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      show={showPopover}
      placement="top"
      overlay={popover}
      trigger={[]}
    >
      <span style={{ display: "inline-block" }}>{phoneBadge}</span>
    </OverlayTrigger>
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

          <div className="d-flex gap-2 align-items-center flex-shrink-0">
            {onToggleAdvancedFilters && (
              <Button
                variant={
                  advancedFilterCount > 0 ? "primary" : "outline-secondary"
                }
                onClick={onToggleAdvancedFilters}
                className="d-flex align-items-center gap-2"
              >
                <Filter size={16} />
                Filters
                {advancedFilterCount > 0 && (
                  <Badge bg="light" text="dark" className="ms-1">
                    {advancedFilterCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const CrmLeads = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { dialNumber, isInitialized } = useCti();

  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filterBusinessTypes, setFilterBusinessTypes] = useState<
    BusinessTypeData[]
  >([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);

  // UI State
  const [showLeadsAnalytics, setShowLeadsAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [leadsSearch, setLeadsSearch] = useState("");
  const [showLeadViewModal, setShowLeadViewModal] = useState(false);
  const [viewingLead, setViewingLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("general-info");
  const [loadingLead, setLoadingLead] = useState(false);
  const [showLeadHistoryModal, setShowLeadHistoryModal] = useState(false);

  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [editLeadIdForSidebar, setEditLeadIdForSidebar] = useState<
    number | null
  >(null);
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  // Sidebar states
  const [showLeadSidebar, setShowLeadSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const [showConvertToDealModal, setShowConvertToDealModal] = useState(false);
  const [convertingLeadId, setConvertingLeadId] = useState<number | null>(null);
  // Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editFormStep, setEditFormStep] = useState(0);
  const [editFormData, setEditFormData] = useState({
    name: "",
    user_extension: null as number | null,
    type: "lead" as "lead" | "opportunity",
    description: "",
    source: "",
    company_name: "",
    industry_ids: [] as number[],
    business_type: "",
    company_country: "",
    company_province: "",
    company_city: "",
    company_location_other: "",
    company_size: "",
    stage_id: undefined as number | undefined,
    campaign_id: undefined as number | undefined,
    crm_data_id: undefined as number | undefined,
    lead_potential: "",
    campaign_field_values: {} as Record<string, any>,
    contact_persons: [
      {
        title: "",
        name: "",
        phone_country_code: "",
        phone: "",
        email: "",
      },
    ] as Array<{
      title: string;
      name: string;
      phone_country_code: string;
      phone: string;
      email: string;
    }>,
  });
  const [editStages, setEditStages] = useState<StageData[]>([]);
  const [editExtensions, setEditExtensions] = useState<any[]>([]);
  const [editCampaigns, setEditCampaigns] = useState<CampaignData[]>([]);
  const [editCrmData, setEditCrmData] = useState<CrmDataItem[]>([]);
  const [editSelectedCampaign, setEditSelectedCampaign] =
    useState<CampaignData | null>(null);
  const [editSelectedCrmData, setEditSelectedCrmData] =
    useState<CrmDataItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFetching, setEditFetching] = useState(false);
  const [editBusinessTypes, setEditBusinessTypes] = useState<
    BusinessTypeData[]
  >([]);
  const [editBusinessTypeId, setEditBusinessTypeId] = useState<number | null>(
    null,
  );
  const [editBusinessTypeOther, setEditBusinessTypeOther] =
    useState<string>("");
  const [editShowOtherBusinessType, setEditShowOtherBusinessType] =
    useState(false);
  const [editSelectedCountry, setEditSelectedCountry] = useState<{
    value: string;
    label: string;
    isoCode: string;
  } | null>(null);
  const [editSelectedState, setEditSelectedState] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [editSelectedCity, setEditSelectedCity] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const isEditInitialLoad = useRef(true);

  // Follow-up Modal
  const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);
  const [followUpIdToEdit, setFollowUpIdToEdit] = useState<number | null>(null);
  const [followupData, setFollowupData] = useState({
    leadId: null as number | null,
    leadName: "",
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
    leadId: null as number | null,
    leadName: "",
    meetingName: "",
    meetingType: "Online",
    meetingDate: "",
    meetingTime: "",
    meetingOutcome: "",
    extensions: [] as string[],
  });
  const [meetingAttendees, setMeetingAttendees] = useState<readonly any[]>([]);
  const [loadingMeeting, setLoadingMeeting] = useState(false);

  // Change Stage Modal
  const [showChangeStageModal, setShowChangeStageModal] = useState(false);
  const [leadToChangeStage, setLeadToChangeStage] = useState<any>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [loadingChangeStage, setLoadingChangeStage] = useState(false);
  const [leadStages, setLeadStages] = useState<any[]>([]);

  const [selectedLeadsColumns, setSelectedLeadsColumns] = useState<string[]>(
    () => {
      const saved = localStorage.getItem("leadsSelectedColumns");
      return saved
        ? JSON.parse(saved)
        : [
            "name",
            "company",
            "email",
            "phone",
            "stage",
            "leadPotential",
            "followUps",
            "assignedUser",
            "created",
          ];
    },
  );
  const [leadsPagination, setLeadsPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [leadsFilters, setLeadsFilters] = useState({
    assignedTo: null as string | null,
    stage: null as string | null,
    businessType: null as string | null,
    source: null as string | null,
    leadPotential: null as string | null,
    campaign: null as string | null,
    lostReason: null as string | null,
    leadScoreMin: null as string | null,
    leadScoreMax: null as string | null,
    dateFrom: null as string | null,
    dateTo: null as string | null,
  });

  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchStages();
    fetchLostReasons();
    fetchExtensions(ModuleSlug.CRM_LEADS);
    fetchCampaigns();
    fetchFilterBusinessTypes();
  }, []);

  const fetchFilterBusinessTypes = async () => {
    try {
      const res = await getBusinessTypes({ per_page: 1000 });
      setFilterBusinessTypes(res?.data || []);
    } catch (error) {
      console.error("Failed to fetch business types:", error);
    }
  };

  // Fetch leads when filters or search change
  const fetchLeads = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      setLoading(true);
      try {
        const params: any = {
          page,
          per_page: perPage,
        };

        // Use search from currentFilters if available, otherwise use the search parameter
        if (currentFilters.search) {
          params.search = currentFilters.search;
        } else if (search) {
          params.search = search;
        }

        // Add filter parameters at top level
        if (currentFilters.stage_id) {
          params.stage_id = currentFilters.stage_id;
        }
        if (currentFilters.assigned_to) {
          params.assigned_to = currentFilters.assigned_to;
        }
        if (currentFilters.business_type_id) {
          params.business_type_id = currentFilters.business_type_id;
        }
        if (currentFilters.source) {
          params.source = currentFilters.source;
        }
        if (currentFilters.lead_potential) {
          params.lead_potential = currentFilters.lead_potential;
        }
        if (currentFilters.campaign_id) {
          params.campaign_id = currentFilters.campaign_id;
        }
        if (currentFilters.lost_reason_id) {
          params.lost_reason_id = currentFilters.lost_reason_id;
        }
        if (currentFilters.lead_score_min) {
          params.lead_score_min = currentFilters.lead_score_min;
        }
        if (currentFilters.lead_score_max) {
          params.lead_score_max = currentFilters.lead_score_max;
        }
        if (currentFilters.date_from) {
          params.date_from = currentFilters.date_from;
        }
        if (currentFilters.date_to) {
          params.date_to = currentFilters.date_to;
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

        const response: any = await getLeads(params);
        console.log("Raw response from getLeads:", response);

        // Handle nested response structure
        // The API returns: { code, message, data: { success, data: [...], pagination, summary_tiles } }
        const responseData: any = (response as any)?.data;
        // The leads array is at response.data.data (not response.data.data.data)
        const leadsArray: any[] = responseData?.data || [];
        const pagination: any = responseData?.pagination || {};
        const summary: any = responseData?.summary_tiles || null;

        // Set leads data, total, and summary tiles
        setLeadsData(Array.isArray(leadsArray) ? leadsArray : []);
        setTotalLeads(
          pagination?.total ||
            (Array.isArray(leadsArray) ? leadsArray.length : 0) ||
            0,
        );
        setSummaryTiles(summary);

        // Transform to GenericListPage expected format
        const transformedData = {
          dataList: Array.isArray(leadsArray) ? leadsArray : [],
          meta: {
            total:
              pagination?.total ||
              (Array.isArray(leadsArray) ? leadsArray.length : 0) ||
              0,
            current_page: pagination?.current_page || page,
            per_page: pagination?.per_page || perPage,
            last_page: pagination?.last_page || 1,
          },
        };
        console.log("Transformed data:", transformedData);
        return transformedData;
      } finally {
        setLoading(false);
      }
    },
    [currentFilters], // Only currentFilters as dependency
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
      setLeadsFilters((prev) => ({
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
      setLeadsFilters((prev) => ({
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
      setLeadsFilters((prev) => ({
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
        setLeadsFilters((prev) => ({
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
        setLeadsPagination((prev) => ({ ...prev, currentPage: 1 }));
      }
    }
  }, [router.isReady, router.query.tab, stages, activeFilter]);

  // Handler to update filter and URL
  const handleFilterChange = useCallback(
    (filterId: string) => {
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
    fetchLeads(
      leadsPagination.currentPage,
      leadsPagination.rowsPerPage,
      leadsSearch,
    );
  }, [
    refreshKey,
    currentFilters,
    leadsPagination.currentPage,
    leadsPagination.rowsPerPage,
    fetchLeads,
  ]);

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

      // Handle business type filter
      if ("business_type_id" in filters) {
        if (filters.business_type_id) {
          newFilters.business_type_id = String(filters.business_type_id);
        } else {
          delete newFilters.business_type_id;
        }
      }

      // Handle source filter
      if ("source" in filters) {
        if (filters.source) {
          newFilters.source = filters.source;
        } else {
          delete newFilters.source;
        }
      }

      // Handle lead_potential filter
      if ("lead_potential" in filters) {
        if (filters.lead_potential) {
          newFilters.lead_potential = filters.lead_potential;
        } else {
          delete newFilters.lead_potential;
        }
      }

      // Handle campaign_id filter
      if ("campaign_id" in filters) {
        if (filters.campaign_id) {
          newFilters.campaign_id = String(filters.campaign_id);
        } else {
          delete newFilters.campaign_id;
        }
      }

      // Handle lost_reason_id filter
      if ("lost_reason_id" in filters) {
        if (filters.lost_reason_id) {
          newFilters.lost_reason_id = String(filters.lost_reason_id);
        } else {
          delete newFilters.lost_reason_id;
        }
      }

      // Handle lead_score_min filter
      if ("lead_score_min" in filters) {
        if (filters.lead_score_min) {
          newFilters.lead_score_min = String(filters.lead_score_min);
        } else {
          delete newFilters.lead_score_min;
        }
      }

      // Handle lead_score_max filter
      if ("lead_score_max" in filters) {
        if (filters.lead_score_max) {
          newFilters.lead_score_max = String(filters.lead_score_max);
        } else {
          delete newFilters.lead_score_max;
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

  const [leadFollowUps, setLeadFollowUps] = useState<any[]>([]);
  const [loadingLeadFollowUps, setLoadingLeadFollowUps] = useState(false);
  const fetchLeadFollowUps = useCallback(async (leadId: number) => {
    try {
      setLoadingLeadFollowUps(true);
      const leadFollowUps = await getLeadFollowUps(leadId);
      setLeadFollowUps(leadFollowUps || ([] as any));
      console.log("leadFollowUps", leadFollowUps);
    } catch (error) {
      console.error("Failed to fetch lead follow-ups:", error);
    } finally {
      setLoadingLeadFollowUps(false);
    }
  }, []);

  const [leadMeetings, setLeadMeetings] = useState<any[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const fetchMeetings = useCallback(async (leadId: number) => {
    try {
      setLoadingMeetings(true);
      const meetings = await getMeetings({ lead_id: leadId });
      console.log("meetings", meetings);
      setLeadMeetings(meetings?.data || []);
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    } finally {
      setLoadingMeetings(false);
    }
  }, []);

  const handleRowClicked = useCallback(
    async (leadId: number) => {
      try {
        const leadData: any = await getLead(leadId);
        await fetchLeadFollowUps(leadId);
        await fetchMeetings(leadId);
        setSelectedLead(leadData);
        setShowLeadSidebar(true);
      } catch (error) {
        console.error("Failed to fetch lead:", error);
        toast.error("Failed to load lead details");
      }
    },
    [fetchLeadFollowUps, fetchMeetings],
  );

  // Handle preview button click - shows sidebar
  const handlePreviewClick = useCallback(
    async (lead: LeadData) => {
      const leadId = lead.rawData?.id || lead.id;
      // Set the lead immediately to show sidebar
      setSelectedLead(lead.rawData || lead);
      setShowLeadSidebar(true);

      // Fetch additional data (follow-ups, meetings) in the background
      if (leadId) {
        try {
          await fetchLeadFollowUps(leadId);
          await fetchMeetings(leadId);
          // Optionally refresh the lead data to get latest info
          const leadData: any = await getLead(leadId);
          setSelectedLead(leadData);
        } catch (error) {
          console.error("Failed to fetch lead details:", error);
          // Don't show error toast as sidebar is already open with basic data
        }
      }
    },
    [fetchLeadFollowUps, fetchMeetings],
  );

  // Handle first column click - navigates to detail page
  const handleFirstColumnClick = useCallback(
    (lead: LeadData) => {
      router.push("/crm/leads/leads-detailpage");
    },
    [router],
  );

  const fetchStages = async () => {
    try {
      const stagesData = await getStages("lead");
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

  const fetchCampaigns = async () => {
    try {
      const campaignsData = await getCampaigns({
        per_page: 1000,
        module_slug: ModuleSlug.CRM_CAMPAIGNS,
      });
      setCampaigns(campaignsData?.data || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
  };

  // Helper functions
  const handleSort = (
    column: string,
    paginationState: any,
    setPaginationState: (state: any) => void,
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
    sortDirection: "asc" | "desc",
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
    if (paginationState.sortColumn !== column) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return paginationState.sortDirection === "asc" ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };
  // Transform API lead data to UI format
  const transformLeadData = (lead: any): LeadData => {
    // Parse contact_persons - it can be a JSON string or an array
    let contactPersonsArray: any[] = [];
    if (lead.contact_persons) {
      if (typeof lead.contact_persons === "string") {
        try {
          contactPersonsArray = JSON.parse(lead.contact_persons);
        } catch (e) {
          console.error("Failed to parse contact_persons:", e);
          contactPersonsArray = [];
        }
      } else if (Array.isArray(lead.contact_persons)) {
        contactPersonsArray = lead.contact_persons;
      }
    }

    // Get first available contact person
    const contactPerson =
      contactPersonsArray.find((cp) => cp.email || cp.phone) ||
      contactPersonsArray[0] ||
      {};

    // Use contact person data if available, otherwise fall back to top-level fields
    const email = contactPerson.email || "";
    const phone = contactPerson.phone
      ? `${contactPerson.phone_country_code || ""} ${
          contactPerson.phone
        }`.trim()
      : lead.contact_phone
        ? `${lead.contact_phone_country_code || ""} ${lead.contact_phone}`.trim()
        : "";

    return {
      id: lead.id,
      name: lead.name || "",
      email: email,
      phone: phone,
      company: lead.company_name || "",
      industry: lead.industry || "",
      stage: lead.is_lost
        ? "Lost"
        : lead.stage?.name || (lead.stage_id ? "Unknown" : "New"),
      stageColor: lead.is_lost ? "grey" : lead.stage?.color || "grey",
      leadPotential: lead?.lead_potential || "Not Set",
      lead_score: lead?.stage?.score || 0,
      assignedUser:
        extensions.find(
          (ext: any) =>
            ext?.id == lead?.user_extension ||
            ext?.extension == lead?.user_extension,
        )?.display_name ||
        extensions.find(
          (ext: any) =>
            ext?.id == lead?.user_extension ||
            ext?.extension == lead?.user_extension,
        )?.name ||
        lead.user_extension ||
        "",
      created: formatDateForTable(lead.created_at),
      lastActivity: formatDateForTable(lead.last_activity_at),
      followUps: lead.follow_ups || [],
      meetings: lead.meetings || [],
      source: lead.source || "",
      campaign: lead.campaign?.name || "",
      isLost: lead.is_lost || false,
      lostReasonName: lead.is_lost ? lead.stage?.name || "" : "",
      rawData: lead, // Keep original data for actions
    };
  };

  // Delete Lead Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);

  // Delete Follow-up Modal
  const [showDeleteFollowUpModal, setShowDeleteFollowUpModal] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<{
    leadId: number;
    followUpId: number;
    leadName?: string;
  } | null>(null);

  // Delete Meeting Modal
  const [showDeleteMeetingModal, setShowDeleteMeetingModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<{
    meetingId: number;
    meetingName?: string;
    leadId?: number;
  } | null>(null);

  // Handle call button click
  const handleCallClick = useCallback(
    async (lead: any) => {
      const phone = lead.phone;
      if (!phone) {
        toast.error("No phone number available for this entry");
        return;
      }

      if (!isInitialized) {
        toast.error("CTI not initialized. Please wait...");
        return;
      }

      try {
        const result = await dialNumber(phone);

        if (result.success) {
          // toast.success(`Calling ${lead.name || phone}...`);
        } else {
          // toast.error(result.error || "Failed to make call");
        }
      } catch (error) {
        console.error("Call error:", error);
        toast.error("Failed to make call");
      }
    },
    [dialNumber, isInitialized],
  );

  /** Sidebar Call button: when completePhone is passed, dial via CTI (same as dialer API) */
  const handleSidebarCall = useCallback(
    async (phone?: string) => {
      if (!phone?.trim()) {
        toast.error("No phone number available to call");
        return;
      }
      if (!isInitialized) {
        toast.error("CTI not initialized. Please wait...");
        return;
      }
      try {
        const result = await dialNumber(phone.trim());
        if (result.success) {
          // toast.success(`Calling ${phone}...`);
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

  // Helper function to get name by extension
  function getNameByExtension(extension: string) {
    const extensionData = extensions.find(
      (ext) => ext.id === extension || ext.extension === extension,
    );
    return extensionData?.display_name || extensionData?.name || extension;
  }

  // Handle note creation
  const handleNoteCreate = useCallback(
    (note: string, createTask: boolean, taskDueDate?: string) => {
      console.log("Note created:", {
        leadId: selectedLead?.id || selectedLead?.rawData?.id,
        note,
        createTask,
        taskDueDate,
      });

      // Here you would typically:
      // 1. Save the note to your backend/database
      // 2. If createTask is true, create a task with the due date
      // 3. Update the UI to show the new note
      // 4. Maybe refresh the notes section

      toast.success(
        `Note saved successfully!${createTask ? " Task created." : ""}`,
      );
    },
    [selectedLead],
  );

  // Handle close lead sidebar
  const handleCloseLeadSidebar = useCallback(() => {
    setShowLeadSidebar(false);
    setSelectedLead(null);
  }, []);

  const handleDeleteLead = useCallback((leadId: number, leadName?: string) => {
    setLeadToDelete({ id: leadId, name: leadName });
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteLead = useCallback(async () => {
    if (!leadToDelete) return;

    try {
      await deleteLead(leadToDelete.id);
      setShowDeleteModal(false);
      setLeadToDelete(null);
      // Refresh the list
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lead Deleted");
      setSuccessModalDescription("Lead has been deleted successfully");
      //window.location.reload();
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  }, [leadToDelete]);

  // Restore Lead Handler
  const handleRestoreLead = useCallback(async (leadId: number) => {
    if (!window.confirm("Are you sure you want to restore this lead?")) return;

    try {
      await restoreLead(leadId);
      toast.success("Lead restored successfully!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lead Restored");
      setSuccessModalDescription("Lead has been restored successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to restore lead:", error);
      toast.error("Failed to restore lead");
    }
  }, []);

  // Convert Lead Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<any>(null);
  const [convertFormData, setConvertFormData] = useState({
    opportunity_name: "",
    value: "",
    probability: "",
    expected_close_date: "",
    description: "",
  });
  const handleConvertLead = useCallback((lead: any) => {
    router.push(`/crm/deals/create?lead_id=${lead.id}`);
  }, []);

  const handleConvertSubmit = useCallback(async () => {
    if (!leadToConvert) return;

    try {
      await convertLead(leadToConvert.id);
      setShowConvertModal(false);
      setLeadToConvert(null);
      setConvertFormData({
        opportunity_name: "",
        value: "",
        probability: "",
        expected_close_date: "",
        description: "",
      });
      toast.success("Lead converted successfully!");
      // Refresh the list
      window.location.reload();
    } catch (error) {
      console.error("Failed to convert lead:", error);
    }
  }, [leadToConvert, convertFormData]);

  // Mark Lead Lost Modal
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [leadToMarkLost, setLeadToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");

  const handleMarkLost = useCallback((lead: any) => {
    setLeadToMarkLost(lead);
    setShowMarkLostModal(true);
  }, []);

  // Handle change stage
  const handleChangeStage = useCallback(async (lead: any) => {
    setLeadToChangeStage(lead);
    setSelectedStageId(lead.stage_id || null);
    try {
      // Fetch only lead stages
      const stagesData = await getStages("lead");
      setLeadStages(stagesData || []);
      setShowChangeStageModal(true);
    } catch (error) {
      console.error("Failed to fetch lead stages:", error);
      toast.error("Failed to load lead stages");
    }
  }, []);

  const handleChangeStageSubmit = useCallback(async () => {
    if (!leadToChangeStage || !selectedStageId) return;

    try {
      setLoadingChangeStage(true);
      await updateLead(leadToChangeStage.id, {
        stage_id: selectedStageId,
      });
      setShowChangeStageModal(false);
      setLeadToChangeStage(null);
      setSelectedStageId(null);
      toast.success("Lead stage updated successfully!");
      // Refresh the list
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to update lead stage:", error);
      toast.error("Failed to update lead stage");
    } finally {
      setLoadingChangeStage(false);
    }
  }, [leadToChangeStage, selectedStageId]);

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  const handleMarkLostSubmit = useCallback(async () => {
    if (!leadToMarkLost || !lostReasonId || !lostFeedback.trim()) return;

    try {
      await markLeadLost(leadToMarkLost.id, {
        lost_reason_id: lostReasonId,
        lost_feedback: lostFeedback,
      });
      setShowMarkLostModal(false);
      setLeadToMarkLost(null);
      setLostReasonId(null);
      setLostFeedback("");
      toast.success("Lead marked as lost!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lead Marked as Lost");
      setSuccessModalDescription("Lead has been marked as lost successfully");
      // Refresh the list
      //window.location.reload();
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to mark lead as lost:", error);
    }
  }, [leadToMarkLost, lostReasonId, lostFeedback]);

  // Handle view lead
  const handleViewLead = useCallback(async (leadId: number) => {
    setLoadingLead(true);
    try {
      const leadData: any = await getLead(leadId);

      // Parse contact_persons if it's a string
      if (
        leadData.contact_persons &&
        typeof leadData.contact_persons === "string"
      ) {
        try {
          leadData.contact_persons = JSON.parse(leadData.contact_persons);
        } catch (e) {
          console.error("Failed to parse contact_persons:", e);
          leadData.contact_persons = [];
        }
      }

      setViewingLead({
        ...leadData,
        stage: leadData.is_lost
          ? { ...(leadData.stage || {}), name: "Lost" }
          : leadData.stage,
      });
      //setActiveTab("lead-info"); // Reset to first tab when opening modal
      setShowLeadViewModal(true);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
      toast.error("Failed to load lead details");
    } finally {
      setLoadingLead(false);
    }
  }, []);

  // Handle edit lead - open same sidebar as Create Lead with prefilled data
  const handleEditLead = useCallback((leadId: number) => {
    setEditLeadIdForSidebar(leadId);
    setShowCreateLeadModal(true);
  }, []);

  // Edit Modal Helper Functions
  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditCampaignChange = async (campaignId: number | undefined) => {
    handleEditInputChange("campaign_id", campaignId);

    if (!campaignId) {
      setEditSelectedCampaign(null);
      handleEditInputChange("campaign_field_values", {});
      return;
    }

    try {
      const campaign = await getCampaignById(campaignId);
      setEditSelectedCampaign(campaign);

      // Pre-fill fields from campaign
      if (!isEditInitialLoad.current) {
        if ((campaign as any).company_name) {
          handleEditInputChange("company_name", (campaign as any).company_name);
        }
        if ((campaign as any).source) {
          handleEditInputChange("source", (campaign as any).source);
        }
        if ((campaign as any).stage_id) {
          handleEditInputChange("stage_id", Number((campaign as any).stage_id));
        }
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
    }
  };

  const handleEditCampaignFieldChange = (fieldKey: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      campaign_field_values: {
        ...prev.campaign_field_values,
        [fieldKey]: value,
      },
    }));
  };

  const addEditContactPerson = () => {
    setEditFormData((prev) => ({
      ...prev,
      contact_persons: [
        ...prev.contact_persons,
        {
          title: "",
          name: "",
          phone_country_code: "",
          phone: "",
          email: "",
        },
      ],
    }));
  };

  const removeEditContactPerson = (index: number) => {
    if (editFormData.contact_persons.length <= 1) {
      toast.error("At least one contact person is required");
      return;
    }
    setEditFormData((prev) => ({
      ...prev,
      contact_persons: prev.contact_persons.filter((_, i) => i !== index),
    }));
  };

  const updateEditContactPerson = (
    index: number,
    field: string,
    value: any,
  ) => {
    setEditFormData((prev) => {
      const updated = [...prev.contact_persons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, contact_persons: updated };
    });
  };

  const handleEditCountryChange = (selected: any) => {
    setEditSelectedCountry(selected);
    setEditSelectedState(null);
    setEditSelectedCity(null);
    handleEditInputChange("company_country", selected?.label || "");
    handleEditInputChange("company_province", "");
    handleEditInputChange("company_city", "");
  };

  const handleEditStateChange = (selected: any) => {
    setEditSelectedState(selected);
    setEditSelectedCity(null);
    handleEditInputChange("company_province", selected?.label || "");
    handleEditInputChange("company_city", "");
  };

  const handleEditCityChange = (selected: any) => {
    setEditSelectedCity(selected);
    handleEditInputChange("company_city", selected?.label || "");
  };

  const validateEditStep0 = (): boolean => {
    if (!editFormData.name?.trim()) {
      toast.error("Lead name is required");
      return false;
    }
    if (editFormData.user_extension == null || !editFormData.user_extension) {
      toast.error("Assigned To is required");
      return false;
    }
    if (!editFormData.stage_id) {
      toast.error("Stage is required");
      return false;
    }
    return true;
  };

  const validateEditStep1 = (): boolean => {
    if (!editFormData.company_name?.trim()) {
      toast.error("Company name is required");
      return false;
    }
    if (editShowOtherBusinessType && !editBusinessTypeOther?.trim()) {
      toast.error("Please specify the business type");
      return false;
    }
    if (!editShowOtherBusinessType && !editBusinessTypeId) {
      toast.error("Business type is required");
      return false;
    }
    return true;
  };

  const validateEditStep2 = (): boolean => {
    for (let i = 0; i < editFormData.contact_persons.length; i++) {
      const person = editFormData.contact_persons[i];
      if (!person.title?.trim()) {
        toast.error(`Contact person ${i + 1}: Title is required`);
        return false;
      }
      if (!person.name?.trim()) {
        toast.error(`Contact person ${i + 1}: Name is required`);
        return false;
      }
      if (!person.phone?.trim()) {
        toast.error(`Contact person ${i + 1}: Phone is required`);
        return false;
      }
      if (!person.email?.trim()) {
        toast.error(`Contact person ${i + 1}: Email is required`);
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(person.email)) {
        toast.error(`Contact person ${i + 1}: Invalid email format`);
        return false;
      }
    }
    return true;
  };

  const validateEditStep3 = (): boolean => {
    if ((editSelectedCampaign as any)?.custom_fields) {
      for (const field of (editSelectedCampaign as any).custom_fields) {
        if (
          field.required &&
          !editFormData.campaign_field_values?.[field.field_key]
        ) {
          toast.error(`${field.field_name} is required`);
          return false;
        }
      }
    }
    return true;
  };

  const handleEditNextStep = () => {
    let isValid = false;
    switch (editFormStep) {
      case 0:
        isValid = validateEditStep0();
        break;
      case 1:
        isValid = validateEditStep1();
        break;
      case 2:
        isValid = validateEditStep2();
        break;
      case 3:
        isValid = validateEditStep3();
        break;
      default:
        isValid = true;
    }

    if (isValid && editFormStep < 3) {
      setEditFormStep((prev) => prev + 1);
    }
  };

  const handleEditSubmit = async () => {
    // Validate all steps
    if (
      !validateEditStep0() ||
      !validateEditStep1() ||
      !validateEditStep2() ||
      !validateEditStep3()
    ) {
      return;
    }

    setEditLoading(true);
    try {
      const payload: any = {
        name: editFormData.name,
        user_extension:
          String(editFormData.user_extension) ||
          String((session?.user as any)?.extension) ||
          "admin",
        type: editFormData.type,
        description: editFormData.description,
        source: editFormData.source,
        company_name: editFormData.company_name,
        industry_ids: editFormData.industry_ids,
        company_country: editFormData.company_country,
        company_province: editFormData.company_province,
        company_city: editFormData.company_city,
        company_location_other: editFormData.company_location_other,
        company_size: editFormData.company_size,
        stage_id: editFormData.stage_id,
        campaign_id: editFormData.campaign_id,
        crm_data_id: editFormData.crm_data_id,
        lead_potential: editFormData.lead_potential,
        campaign_field_values: editFormData.campaign_field_values,
        contact_persons: editFormData.contact_persons,
      };

      // Handle business type
      if (editShowOtherBusinessType) {
        payload.business_type_id = null;
        payload.business_type_other = editBusinessTypeOther;
      } else {
        payload.business_type_id = editBusinessTypeId;
        payload.business_type_other = null;
      }

      if (editingLead?.id) {
        await updateLead(editingLead.id, payload);
        toast.success("Lead updated successfully");
        setShowEditModal(false);
        fetchLeads(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Failed to update lead:", error);
      toast.error(error.message || "Failed to update lead");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle follow-up creation
  const handleCreateFollowUp = useCallback(async () => {
    // Validate required fields
    const isValid = checkRequiredFields(followupData, [
      { field: "leadId", name: "Lead" },
      { field: "followUpDate", name: "Follow-up Date" },
      { field: "communicationChannel", name: "Communication Channel" },
    ]);

    // If "Other" is selected, communicationChannelOther is required
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
      const payload: any = {
        follow_up_date: followupData.followUpDate,
        follow_up_status: followupData.followUpStatus,
        communication_channel: followupData.communicationChannel,
        notes: followupData.notes,
        user_extension:
          followupData.userExtension ||
          (session?.user as any)?.extension ||
          "admin",
      };

      if (
        followupData.communicationChannel === "Other" &&
        followupData.communicationChannelOther
      ) {
        payload.communication_channel_other =
          followupData.communicationChannelOther;
      }

      if (followupData.leadId) {
        await createLeadFollowUp(followupData.leadId, payload);
      }

      // Refresh lead data (sidebar or view modal)
      if (followupData.leadId) {
        await handleRowClicked(followupData.leadId);
      }

      // Reset form and close modal
      setShowAddFollowupModal(false);
      setFollowUpIdToEdit(null);
      setFollowupData({
        leadId: null,
        leadName: "",
        followUpDate: "",
        followUpStatus: "Pending",
        communicationChannel: "Phone Call",
        communicationChannelOther: "",
        notes: "",
        userExtension: "",
      });
    } catch (error) {
      console.error("Failed to create follow-up:", error);
    } finally {
      setLoadingFollowUp(false);
    }
  }, [followupData, session, handleRowClicked]);

  // Handle follow-up update
  const handleUpdateFollowUp = useCallback(async () => {
    // Validate required fields
    const isValid = checkRequiredFields(followupData, [
      { field: "leadId", name: "Lead" },
      { field: "followUpDate", name: "Follow-up Date" },
      { field: "communicationChannel", name: "Communication Channel" },
    ]);

    // If "Other" is selected, communicationChannelOther is required
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
      const payload: any = {
        follow_up_date: followupData.followUpDate,
        follow_up_status: followupData.followUpStatus,
        communication_channel: followupData.communicationChannel,
        notes: followupData.notes,
        user_extension:
          followupData.userExtension ||
          (session?.user as any)?.extension ||
          "admin",
      };

      if (
        followupData.communicationChannel === "Other" &&
        followupData.communicationChannelOther
      ) {
        payload.communication_channel_other =
          followupData.communicationChannelOther;
      }

      await updateLeadFollowUp(followupData.leadId!, followUpIdToEdit, payload);

      // Refresh lead data (sidebar or view modal)
      if (followupData.leadId) {
        await handleRowClicked(followupData.leadId);
      }

      // Reset form and close modal
      setShowAddFollowupModal(false);
      setFollowUpIdToEdit(null);
      setFollowupData({
        leadId: null,
        leadName: "",
        followUpDate: "",
        followUpStatus: "Pending",
        communicationChannel: "Phone Call",
        communicationChannelOther: "",
        notes: "",
        userExtension: "",
      });
    } catch (error) {
      console.error("Failed to update follow-up:", error);
    } finally {
      setLoadingFollowUp(false);
    }
  }, [followUpIdToEdit, followupData, session, handleRowClicked]);
  const getTodayDate = useCallback((startDateParam: string = "") => {
    let today = new Date();
    if (startDateParam) {
      const startDate = new Date(startDateParam);
      if (moment(startDate).isBefore(today)) {
        today = startDate;
      }
    }
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);
  // Handle edit follow-up click
  const handleEditFollowUp = useCallback(
    (followUp: any) => {
      // Format date for input (YYYY-MM-DD)
      const followUpDate = followUp.follow_up_date
        ? new Date(followUp.follow_up_date).toISOString().split("T")[0]
        : "";

      setFollowUpIdToEdit(followUp.id);
      setFollowupData({
        leadId: viewingLead?.id || null,
        leadName: viewingLead?.name || "",
        followUpDate: followUpDate,
        followUpStatus: followUp.follow_up_status || "Pending",
        communicationChannel: followUp.communication_channel || "Phone Call",
        communicationChannelOther: followUp.communication_channel_other || "",
        notes: followUp.notes || "",
        userExtension:
          followUp.user_extension ||
          (session?.user as any)?.extension ||
          "admin",
      });
      setShowAddFollowupModal(true);
    },
    [viewingLead, session],
  );

  // Handle follow-up deletion
  const handleDeleteFollowUp = useCallback(
    (leadId: number, followUpId: number, leadName?: string) => {
      setFollowUpToDelete({ leadId, followUpId, leadName });
      setShowDeleteFollowUpModal(true);
    },
    [],
  );

  const confirmDeleteFollowUp = useCallback(async () => {
    if (!followUpToDelete) return;

    try {
      await deleteLeadFollowUp(
        followUpToDelete.leadId,
        followUpToDelete.followUpId,
      );

      // Refresh lead data
      if (viewingLead?.id === followUpToDelete.leadId) {
        await handleViewLead(followUpToDelete.leadId);
      }

      // Refresh leads list
      setRefreshKey((oldKey) => oldKey + 1);

      setShowDeleteFollowUpModal(false);
      setFollowUpToDelete(null);
    } catch (error) {
      console.error("Failed to delete follow-up:", error);
      toast.error("Failed to delete follow-up");
    }
  }, [followUpToDelete, viewingLead, handleViewLead]);

  // Handle meeting creation
  const handleCreateMeeting = useCallback(async () => {
    if (
      !meetingData.leadId ||
      !meetingData.meetingName ||
      !meetingData.meetingDate ||
      !meetingData.meetingTime
    )
      return;

    setLoadingMeeting(true);
    try {
      const payload: any = {
        name: meetingData.meetingName,
        meeting_type: meetingData.meetingType,
        meeting_date: meetingData.meetingDate,
        meeting_time: meetingData.meetingTime,
        lead_id: String(meetingData.leadId),
        meeting_outcome: "Scheduled", // Default to "Scheduled" when creating
        extensions:
          meetingAttendees.length > 0
            ? meetingAttendees.map((user: any) => user.value)
            : [(session?.user as any)?.extension || "admin"],
      };

      await createMeeting(payload);

      // Refresh lead data (sidebar or view modal)
      if (meetingData.leadId) {
        await handleRowClicked(meetingData.leadId);
      }

      // Reset form and close modal
      setShowAddMeetingModal(false);
      setMeetingIdToEdit(null);
      setMeetingData({
        leadId: null,
        leadName: "",
        meetingName: "",
        meetingType: "Online",
        meetingDate: "",
        meetingTime: "",
        meetingOutcome: "",
        extensions: [],
      });
      setMeetingAttendees([]);
    } catch (error) {
      console.error("Failed to create meeting:", error);
    } finally {
      setLoadingMeeting(false);
    }
  }, [meetingData, meetingAttendees, session, handleRowClicked]);

  // Handle meeting update
  const handleUpdateMeeting = useCallback(async () => {
    if (
      !meetingIdToEdit ||
      !meetingData.meetingName ||
      !meetingData.meetingDate ||
      !meetingData.meetingTime
    )
      return;

    setLoadingMeeting(true);
    try {
      const payload: any = {
        name: meetingData.meetingName,
        meeting_type: meetingData.meetingType,
        meeting_date: meetingData.meetingDate,
        meeting_time: meetingData.meetingTime,
        extensions:
          meetingAttendees.length > 0
            ? meetingAttendees.map((user: any) => user.value)
            : [],
      };

      if (meetingData.meetingOutcome) {
        payload.meeting_outcome = meetingData.meetingOutcome;
      }

      await updateMeeting(meetingIdToEdit!, payload);

      // Refresh lead data (sidebar or view modal)
      if (meetingData.leadId) {
        await handleRowClicked(meetingData.leadId);
      }

      // Reset form and close modal
      setShowAddMeetingModal(false);
      setMeetingIdToEdit(null);
      setMeetingData({
        leadId: null,
        leadName: "",
        meetingName: "",
        meetingType: "Online",
        meetingDate: "",
        meetingTime: "",
        meetingOutcome: "",
        extensions: [],
      });
      setMeetingAttendees([]);
    } catch (error) {
      console.error("Failed to update meeting:", error);
    } finally {
      setLoadingMeeting(false);
    }
  }, [meetingIdToEdit, meetingData, meetingAttendees, handleRowClicked]);

  // Handle edit meeting click
  const handleEditMeeting = useCallback(
    (meeting: any) => {
      // Format date for input (YYYY-MM-DD)
      const meetingDate = meeting.meeting_date
        ? new Date(meeting.meeting_date).toISOString().split("T")[0]
        : "";

      // Format time for input (HH:MM)
      const meetingTime = meeting.meeting_time || "";

      // Set attendees from meeting extensions
      // meeting.extensions is an array of objects with 'extension' property (e.g., { extension: "511", ... })
      const meetingExtensionStrings =
        meeting.extensions && Array.isArray(meeting.extensions)
          ? meeting.extensions.map(
              (extObj: any) => extObj.extension || String(extObj.id),
            )
          : [];

      const attendees =
        meetingExtensionStrings.length > 0
          ? extensions
              .filter((ext: any) => {
                // Match by extension string or ID (convert to string for comparison)
                const extExtension = String(ext.extension || "");
                const extId = String(ext.id || "");
                return meetingExtensionStrings.some(
                  (meetingExt: string) =>
                    meetingExt === extExtension || meetingExt === extId,
                );
              })
              .map((ext: any) => ({
                value: ext.id || ext.extension,
                label: ext.display_name || ext.name || ext.id || ext.extension,
              }))
          : [];

      setMeetingIdToEdit(meeting.id);
      setMeetingData({
        leadId: viewingLead?.id || null,
        leadName: viewingLead?.name || "",
        meetingName: meeting.name || "",
        meetingType: meeting.meeting_type || "Online",
        meetingDate: meetingDate,
        meetingTime: meetingTime,
        meetingOutcome: meeting.meeting_outcome || "",
        extensions: meetingExtensionStrings, // Store extension strings, not objects
      });
      setMeetingAttendees(attendees);
      setShowAddMeetingModal(true);
    },
    [viewingLead, extensions],
  );

  // Handle meeting deletion
  const handleDeleteMeeting = useCallback(
    (meetingId: number, meetingName?: string, leadId?: number) => {
      setMeetingToDelete({ meetingId, meetingName, leadId });
      setShowDeleteMeetingModal(true);
    },
    [],
  );

  const confirmDeleteMeeting = useCallback(async () => {
    if (!meetingToDelete) return;

    try {
      await deleteMeeting(meetingToDelete.meetingId);

      // Refresh lead data (sidebar or view modal)
      const leadIdToRefresh = meetingToDelete.leadId ?? viewingLead?.id;
      if (leadIdToRefresh) {
        await handleRowClicked(leadIdToRefresh);
      }

      setShowDeleteMeetingModal(false);
      setMeetingToDelete(null);
      toast.success("Meeting deleted successfully");
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      toast.error("Failed to delete meeting");
    }
  }, [meetingToDelete, viewingLead, handleRowClicked]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const transformedLeads = leadsData.map(transformLeadData);

    // Use summary_tiles if available, otherwise calculate from data
    const total = summaryTiles ? totalLeads : transformedLeads.length;
    const hot =
      summaryTiles?.hot_leads ||
      transformedLeads.filter((l) => l.leadPotential === "Hot").length;
    // Removed lead score calculation
    const qualified = transformedLeads.filter(
      (l) =>
        l.stage === "Qualified" || l.stage?.toLowerCase().includes("qualified"),
    ).length;

    // Stage distribution
    const stageCounts: Record<string, number> = {};
    transformedLeads.forEach((l) => {
      const stage = l.stage || "New";
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });

    // Potential distribution
    const potentialCounts: Record<string, number> = {};
    transformedLeads.forEach((l) => {
      const potential = l.leadPotential || "Warm";
      potentialCounts[potential] = (potentialCounts[potential] || 0) + 1;
    });

    return { total, qualified, hot, stageCounts, potentialCounts };
  }, [leadsData, extensions, summaryTiles, totalLeads]);

  // Stats cards data for metrics
  const leadsStatsCards: StatsCardData[] = useMemo(
    () => [
      {
        title: "All Leads",
        value: summaryTiles?.total_leads || totalLeads || 0,
        icon: Users,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
        subtitle: "Total in system",
      },
      {
        title: "New",
        value: summaryTiles?.new_leads || analyticsData.stageCounts["New"] || 0,
        icon: UserCheck,
        iconColor: "#3B82F6",
        iconBgColor: "#DBEAFE",
        metric: {
          text: "Fresh leads",
          dotColor: "#2563EB",
        },
      },
      {
        title: "Qualified",
        value:
          summaryTiles?.qualified_leads ||
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
          text: "In review",
          dotColor: "#7C3AED",
        },
      },
      {
        title: "Negotiation",
        value: analyticsData.stageCounts["Negotiation"] || 0,
        icon: Handshake,
        iconColor: "#F59E0B",
        iconBgColor: "#FEF3C7",
        subtitle: "Active discussions",
      },
      {
        title: "Closed Won",
        value:
          analyticsData.stageCounts["Closed Won"] ||
          analyticsData.stageCounts["Won"] ||
          0,
        icon: Target,
        iconColor: "#059669",
        iconBgColor: "#D1FAE5",
        badge: {
          text: "Success",
          bgColor: "#D1FAE5",
          textColor: "#065F46",
        },
      },
    ],
    [summaryTiles, totalLeads, analyticsData],
  );

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

  // Transform leads data (no client-side filtering - API handles it)
  const filteredLeads = useMemo(() => {
    return leadsData.map(transformLeadData);
  }, [leadsData, extensions]);

  // Extract unique source values from leads data for creatable select
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    leadsData.forEach((lead: any) => {
      if (lead.source && lead.source.trim()) {
        sources.add(lead.source.trim());
      }
    });
    return Array.from(sources)
      .sort()
      .map((source) => ({
        value: source,
        label: source,
      }));
  }, [leadsData]);

  // Calculate filter counts (using summary_tiles if available, otherwise from data)
  const filterCounts = useMemo(() => {
    const transformed = leadsData.map(transformLeadData);
    const counts: Record<string, number> = {
      all: summaryTiles?.total_leads || totalLeads || transformed.length,
      lost:
        summaryTiles?.lost_leads || transformed.filter((l) => l.isLost).length,
      deleted: summaryTiles?.deleted_leads || 0,
    };

    // Add counts for all stages (not just first 5, for custom tabs)
    stages.forEach((stage: any) => {
      const stageLeads = transformed.filter(
        (l) => l.stage === stage.name || l.rawData?.stage_id === stage.id,
      );
      counts[stage.id] = stageLeads.length;
    });

    return counts;
  }, [leadsData, extensions, stages, summaryTiles, totalLeads]);

  // Update custom tabs counts when filterCounts change
  useEffect(() => {
    setCustomTabs((prevTabs) =>
      prevTabs.map((tab) => {
        const count = filterCounts[tab.id] || 0;
        return { ...tab, count };
      }),
    );
  }, [filterCounts]);

  // Define table columns - Clean data definitions only
  const leadsColumns: TableColumn<LeadData>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "avatar",
        avatar: {
          getInitials: (lead) => getInitials(lead.name),
          getColor: (lead) => getRandomColor(lead.name),
        },
        emptyValue: "N/A",
      },
      {
        key: "company",
        label: "Individual/Company",
        sortable: true,
        type: "multi-field",
        fields: {
          primary: "company",
          secondary: "industry",
          secondaryClass: "gt-company-industry",
        },
        emptyValue: "No Company",
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        type: "text",
      },
      {
        key: "phone",
        label: "Phone",
        sortable: true,
        align: "left",
        type: "custom",
      },
      {
        key: "stage",
        label: "Stage",
        sortable: true,
        type: "custom",
        render: (lead: LeadData) => {
          const badge = (
            <Badge
              bg=""
              style={{ backgroundColor: lead.stageColor || "#6c757d" }}
            >
              {lead.stage || "-"}
            </Badge>
          );
          if (lead.isLost && lead.lostReasonName) {
            return (
              <OverlayTrigger
                placement="top"
                overlay={
                  <BsTooltip id={`stage-${lead.id}`}>
                    Reason: {lead.lostReasonName}
                  </BsTooltip>
                }
              >
                <span className="d-inline-block" style={{ cursor: "help" }}>
                  {badge}
                </span>
              </OverlayTrigger>
            );
          }
          return badge;
        },
      },
      {
        key: "leadPotential",
        label: "Lead Potential",
        sortable: true,
        type: "badge",
        badge: {
          getVariant: (lead) =>
            lead.leadPotential === "Hot"
              ? "danger"
              : lead.leadPotential === "Warm"
                ? "warning"
                : "secondary",
        },
      },
      {
        key: "followUps",
        label: "Follow-up Date",
        sortable: false,
        align: "center",
        type: "text",
        accessor: (lead: LeadData) => {
          const followUps = lead.followUps || [];
          if (followUps.length === 0) return null;
          const sortedFollowUps = [...followUps].sort((a, b) => {
            const dateA = a.follow_up_date
              ? new Date(a.follow_up_date).getTime()
              : Infinity;
            const dateB = b.follow_up_date
              ? new Date(b.follow_up_date).getTime()
              : Infinity;
            return dateA - dateB;
          });
          const earliestFollowUp = sortedFollowUps[0];
          return earliestFollowUp?.follow_up_date
            ? moment(earliestFollowUp.follow_up_date).format(GlobalDateFormat)
            : null;
        },
      },
      {
        key: "assignedUser",
        label: "Assigned To",
        sortable: true,
        type: "text",
      },
      {
        key: "created",
        label: "Created",
        sortable: true,
        type: "text",
      },
    ],
    [],
  );

  // Define table actions

  const leadsActions: TableAction<LeadData>[] = useMemo(() => {
    if (activeFilter === "deleted") {
      return [
        {
          label: "View",
          icon: <Eye size={16} />,
          onClick: (lead: LeadData) =>
            handleViewLead(lead.rawData?.id || lead.id),
        },
        {
          label: "Restore",
          icon: <RotateCcw size={16} />,
          onClick: (lead: LeadData) =>
            handleRestoreLead(lead.rawData?.id || lead.id),
        },
      ];
    }

    const actions: TableAction<LeadData>[] = [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (lead: LeadData) =>
          handleViewLead(lead.rawData?.id || lead.id),
      },
    ];

    if (session?.user?.permissions?.includes("edit-crm-leads")) {
      actions.push({
        label: "Edit",
        icon: <Edit size={16} />,
        onClick: (lead: LeadData) =>
          handleEditLead(lead.rawData?.id || lead.id),
        show: () => activeFilter !== "lost",
      });
    }

    if (session?.user?.permissions?.includes("add-crm-deals")) {
      actions.push({
        label: "Convert to Deal",
        icon: <Handshake size={16} />,
        onClick: (lead: LeadData) => {
          setConvertingLeadId(lead.rawData?.id || lead.id);
          setShowConvertToDealModal(true);
        },
        className: "text-success",
        disabled: () => activeFilter === "lost",
      });
    }

    if (session?.user?.permissions?.includes("delete-crm-leads")) {
      actions.push({
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (lead: LeadData) =>
          handleDeleteLead(lead.rawData?.id || lead.id, lead.name),
        className: "text-danger",
      });
    }

    // Add Change Stage and Lost actions (only when not viewing lost leads)
    if (activeFilter !== "lost") {
      if (session?.user?.permissions?.includes("edit-crm-leads")) {
        actions.push({
          label: "Change Stage",
          icon: <GitBranch size={16} />,
          onClick: (lead: LeadData) => handleChangeStage(lead.rawData || lead),
        });
      }

      if (session?.user?.permissions?.includes("mark-as-lost-crm-leads")) {
        actions.push({
          label: "Lost",
          icon: <X size={16} />,
          onClick: (lead: LeadData) => handleMarkLost(lead.rawData || lead),
          className: "text-danger",
        });
      }
    }

    return actions;
  }, [
    session,
    activeFilter,
    handleViewLead,
    handleConvertLead,
    handleDeleteLead,
    handleRestoreLead,
    handleChangeStage,
    handleMarkLost,
  ]);

  // Handler to open filters sidebar
  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  if (!session?.user?.permissions?.includes("list-crm-leads")) {
    return null;
  }

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .leads-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .leads-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .leads-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .leads-table-wrapper .table-responsive table th,
        .leads-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .leads-table-wrapper .table-responsive table td:last-child,
        .leads-table-wrapper .table-responsive table th:last-child {
          max-width: none;
        }
        .leads-table-wrapper .table-responsive table td[style*="width"],
        .leads-table-wrapper .table-responsive table th[style*="width"] {
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
        .leads-page-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          overflow: hidden;
        }
        
        .leads-content-area {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .leads-scrollable-content {
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
        subTitle="Leads"
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
        <div className="leads-scrollable-content" style={{ flex: 1 }}>
          {/* Analytics Section - Collapsible */}
          {showLeadsAnalytics && (
            <>
              {/* Summary Stats using KPICard */}
              <Row className="mb-4">
                <Col lg={3} md={6} className="mb-3">
                  <KPICard
                    title="Total Leads"
                    value={analyticsData.total.toString()}
                    icon={<Target size={24} />}
                    color="primary"
                  />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <KPICard
                    title="Qualified Leads"
                    value={summaryTiles?.qualified_leads?.toString() || "0"}
                    icon={<CheckCircle size={24} />}
                    color="success"
                  />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <KPICard
                    title="New Leads"
                    value={summaryTiles?.new_leads?.toString() || "0"}
                    icon={<TrendingUp size={24} />}
                    color="danger"
                  />
                </Col>
              </Row>

              {/* Analytics Charts */}
              <Row className="mb-4">
                <Col md={6} className="mb-3">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h6 className="fw-bold mb-3">
                        Lead Potential Distribution
                      </h6>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Hot",
                                value:
                                  analyticsData.potentialCounts["Hot"] || 0,
                                color: "#dc3545",
                              },
                              {
                                name: "Warm",
                                value:
                                  analyticsData.potentialCounts["Warm"] || 0,
                                color: "#ffc107",
                              },
                              {
                                name: "Cold",
                                value:
                                  analyticsData.potentialCounts["Cold"] || 0,
                                color: "#0dcaf0",
                              },
                            ]}
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
                            {[
                              {
                                name: "Hot",
                                value:
                                  analyticsData.potentialCounts["Hot"] || 0,
                                color: "#dc3545",
                              },
                              {
                                name: "Warm",
                                value:
                                  analyticsData.potentialCounts["Warm"] || 0,
                                color: "#ffc107",
                              },
                              {
                                name: "Cold",
                                value:
                                  analyticsData.potentialCounts["Cold"] || 0,
                                color: "#0dcaf0",
                              },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
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
                      <h6 className="fw-bold mb-3">Lead Stage Distribution</h6>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={Object.entries(analyticsData.stageCounts).map(
                            ([stage, count]) => ({ stage, count }),
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="stage" />
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

          <div className="container-fluid">
            {/* Filter Bar */}
            {showFilterBar && (
              <FilterBar
                quickFilters={[
                  {
                    id: "all",
                    label: "All Leads",
                    count: filterCounts.all,
                    color: "#0d6efd",
                    icon: <Users size={16} />,
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
              />
            )}

            {/* Advanced Filters */}
            {showAdvancedFilters &&
              session?.user?.permissions?.includes("list-crm-leads") && (
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <Row className="g-3 align-items-end">
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Assigned To
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
                            leadsFilters.assignedTo
                              ? (() => {
                                  const assignedToId = leadsFilters.assignedTo;
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
                            setLeadsFilters((prev) => ({
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
                          Stages
                        </Form.Label>
                        <Select
                          options={stages.map((s) => ({
                            value: s.id.toString(),
                            label: s.name,
                          }))}
                          value={
                            leadsFilters.stage
                              ? (() => {
                                  const stageId = leadsFilters.stage;
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
                            setLeadsFilters((prev) => ({
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
                          Business Type
                        </Form.Label>
                        <Select
                          options={filterBusinessTypes.map(
                            (bt: BusinessTypeData) => ({
                              value: bt.id.toString(),
                              label: bt.name,
                            }),
                          )}
                          value={
                            leadsFilters.businessType
                              ? (() => {
                                  const btId = leadsFilters.businessType;
                                  const bt = filterBusinessTypes.find(
                                    (b: BusinessTypeData) =>
                                      b.id.toString() === btId,
                                  );
                                  return bt
                                    ? { value: btId, label: bt.name }
                                    : { value: btId, label: btId };
                                })()
                              : null
                          }
                          onChange={(selected) => {
                            const businessTypeValue = selected
                              ? selected.value
                              : null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              businessType: businessTypeValue,
                            }));
                          }}
                          placeholder="Select business type..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Source
                        </Form.Label>
                        <CreatableSelect
                          options={uniqueSources}
                          value={
                            leadsFilters.source
                              ? {
                                  value: leadsFilters.source,
                                  label: leadsFilters.source,
                                }
                              : null
                          }
                          onChange={(selected) => {
                            const sourceValue = selected
                              ? selected.value
                              : null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              source: sourceValue,
                            }));
                          }}
                          placeholder="Select or create source..."
                          styles={customSelectStyles}
                          isClearable
                          formatCreateLabel={(inputValue) =>
                            `Create "${inputValue}"`
                          }
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Lead Potential
                        </Form.Label>
                        <Select
                          options={[
                            { value: "Hot", label: "Hot" },
                            { value: "Warm", label: "Warm" },
                            { value: "Cold", label: "Cold" },
                          ]}
                          value={
                            leadsFilters.leadPotential
                              ? {
                                  value: leadsFilters.leadPotential,
                                  label: leadsFilters.leadPotential,
                                }
                              : null
                          }
                          onChange={(selected) => {
                            const leadPotentialValue = selected
                              ? selected.value
                              : null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              leadPotential: leadPotentialValue,
                            }));
                          }}
                          placeholder="Select lead potential..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Campaign
                        </Form.Label>
                        <Select
                          options={campaigns.map((campaign: any) => ({
                            value: campaign.id.toString(),
                            label: campaign.name,
                          }))}
                          value={
                            leadsFilters.campaign
                              ? (() => {
                                  const campaignId = leadsFilters.campaign;
                                  const campaign = campaigns.find(
                                    (c: any) => c.id.toString() === campaignId,
                                  );
                                  return campaign
                                    ? {
                                        value: campaignId,
                                        label: campaign.name,
                                      }
                                    : { value: campaignId, label: campaignId };
                                })()
                              : null
                          }
                          onChange={(selected) => {
                            const campaignValue = selected
                              ? selected.value
                              : null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              campaign: campaignValue,
                            }));
                          }}
                          placeholder="Select campaign..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold mb-2">
                          Lead Score Range
                        </Form.Label>
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Control
                            type="number"
                            min="0"
                            value={leadsFilters.leadScoreMin || ""}
                            onChange={(e) => {
                              const minValue = e.target.value || null;
                              setLeadsFilters((prev) => ({
                                ...prev,
                                leadScoreMin: minValue,
                              }));
                            }}
                            placeholder="Min"
                            style={{ flex: 1 }}
                          />
                          <span className="text-muted">to</span>
                          <Form.Control
                            type="number"
                            min="0"
                            value={leadsFilters.leadScoreMax || ""}
                            onChange={(e) => {
                              const maxValue = e.target.value || null;
                              setLeadsFilters((prev) => ({
                                ...prev,
                                leadScoreMax: maxValue,
                              }));
                            }}
                            placeholder="Max"
                            style={{ flex: 1 }}
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold mb-2">
                          Date Range
                        </Form.Label>
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Control
                            type="date"
                            value={leadsFilters.dateFrom || ""}
                            onChange={(e) => {
                              const dateFromValue = e.target.value || null;
                              setLeadsFilters((prev) => ({
                                ...prev,
                                dateFrom: dateFromValue,
                              }));
                            }}
                            placeholder="From"
                            style={{ flex: 1 }}
                          />
                          <span className="text-muted">to</span>
                          <Form.Control
                            type="date"
                            value={leadsFilters.dateTo || ""}
                            onChange={(e) => {
                              const dateToValue = e.target.value || null;
                              setLeadsFilters((prev) => ({
                                ...prev,
                                dateTo: dateToValue,
                              }));
                            }}
                            placeholder="To"
                            style={{ flex: 1 }}
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-secondary"
                            className="d-flex align-items-center justify-content-center"
                            onClick={() => {
                              // Map leadsFilters to the format expected by handleFiltersChange
                              const filtersToApply: Record<string, any> = {};

                              if (leadsSearch) {
                                filtersToApply.search = leadsSearch;
                              }
                              if (leadsFilters.assignedTo) {
                                filtersToApply.assigned_to =
                                  leadsFilters.assignedTo;
                              }
                              if (leadsFilters.stage) {
                                filtersToApply.stage_id = leadsFilters.stage;
                              }
                              if (leadsFilters.businessType) {
                                filtersToApply.business_type_id =
                                  leadsFilters.businessType;
                              }
                              if (leadsFilters.source) {
                                filtersToApply.source = leadsFilters.source;
                              }
                              if (leadsFilters.leadPotential) {
                                filtersToApply.lead_potential =
                                  leadsFilters.leadPotential;
                              }
                              if (leadsFilters.campaign) {
                                filtersToApply.campaign_id =
                                  leadsFilters.campaign;
                              }
                              if (leadsFilters.lostReason) {
                                filtersToApply.lost_reason_id =
                                  leadsFilters.lostReason;
                              }
                              if (leadsFilters.leadScoreMin) {
                                filtersToApply.lead_score_min =
                                  leadsFilters.leadScoreMin;
                              }
                              if (leadsFilters.leadScoreMax) {
                                filtersToApply.lead_score_max =
                                  leadsFilters.leadScoreMax;
                              }
                              if (leadsFilters.dateFrom) {
                                filtersToApply.date_from =
                                  leadsFilters.dateFrom;
                              }
                              if (leadsFilters.dateTo) {
                                filtersToApply.date_to = leadsFilters.dateTo;
                              }

                              handleFiltersChange(filtersToApply);
                              setLeadsPagination({
                                ...leadsPagination,
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
                              setLeadsSearch("");
                              setLeadsFilters({
                                assignedTo: null,
                                stage: null,
                                businessType: null,
                                source: null,
                                leadPotential: null,
                                campaign: null,
                                lostReason: null,
                                leadScoreMin: null,
                                leadScoreMax: null,
                                dateFrom: null,
                                dateTo: null,
                              });
                              handleFiltersChange({});
                              setCurrentFilters({});
                              setActiveFilter("all");
                              setLeadsPagination({
                                ...leadsPagination,
                                currentPage: 1,
                              });
                              setRefreshKey((prev) => prev + 1);
                            }}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

            {/* Leads Table */}
            <div
              className="leads-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <GenericTable
                data={filteredLeads}
                columns={leadsColumns}
                actions={leadsActions}
                showActions={false}
                pagination={{
                  currentPage: leadsPagination.currentPage,
                  rowsPerPage: leadsPagination.rowsPerPage,
                  totalRows: totalLeads,
                  pageSizeOptions: [10, 15, 25, 50, 100],
                }}
                onPaginationChange={(page, rowsPerPage) => {
                  setLeadsPagination({
                    ...leadsPagination,
                    currentPage: page,
                    rowsPerPage,
                  });
                }}
                sortable={true}
                defaultSortColumn={leadsPagination.sortColumn}
                defaultSortDirection={leadsPagination.sortDirection}
                onSort={(column, direction) => {
                  setLeadsPagination({
                    ...leadsPagination,
                    sortColumn: column,
                    sortDirection: direction,
                  });
                }}
                // customizableColumns={true}
                defaultSelectedColumns={[
                  "name",
                  "company",
                  "email",
                  "phone",
                  "stage",
                  "leadPotential",
                  "followUps",
                  "assignedUser",
                  "created",
                ]}
                columnStorageKey="leadsSelectedColumns"
                onColumnChange={(cols) => setSelectedLeadsColumns(cols)}
                onPreviewClick={(lead) => handlePreviewClick(lead)}
                onFirstColumnClick={(lead) => handleFirstColumnClick(lead)}
                onRowDoubleClick={(lead) => {
                  if (session?.user?.permissions?.includes("list-crm-leads")) {
                    handleViewLead(lead.rawData?.id || lead.id);
                  }
                }}
                loading={loading}
                emptyMessage="No leads found matching your criteria"
                loadingMessage="Loading leads..."
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
                  tabsDropdownLabel: "Leads",
                  tabs: [
                    {
                      id: "all",
                      label: "All leads",
                      count: filterCounts.all,
                      removable: false,
                    },
                    ...customTabs,
                  ],
                  activeTab: activeFilter,
                  onTabChange: handleFilterChange,
                  onTabAdd: () => setShowTabModal(true),
                  onTabRemove: (tabId) => {
                    setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
                    if (activeFilter === tabId) {
                      handleFilterChange("all");
                    }
                  },

                  // Search
                  showSearch: true,
                  searchValue: leadsSearch,
                  searchPlaceholder: "Search leads by name, company, email...",
                  onSearchChange: (value) => {
                    setLeadsSearch(value);
                  },
                  onSearch: () => {
                    const filtersToApply: Record<string, any> = {
                      ...currentFilters,
                    };
                    if (leadsSearch) {
                      filtersToApply.search = leadsSearch;
                    } else {
                      delete filtersToApply.search;
                    }
                    handleFiltersChange(filtersToApply);
                    setLeadsPagination({ ...leadsPagination, currentPage: 1 });
                    setRefreshKey((prev) => prev + 1);
                  },

                  // Actions
                  showTableViewDropdown: true,
                  tableViewLabel: "Table view",
                  showViewSwitcher: true,
                  showEditColumns: true,
                  showPipelineDropdown: true,
                  pipelineLabel: "All Pipelines",
                  showFiltersButton: true,
                  onFiltersClick: handleOpenFiltersSidebar,
                  showSortButton: true,
                  showExportButton: true,
                  showSaveButton: true,

                  // Filter Pills
                  filterPills: [
                    {
                      id: "contact_owner",
                      label: "Contact Owner",
                      showDropdown: true,
                      dropdownOptions: [
                        {
                          label: "All Owners",
                          value: "all",
                          onClick: () => {
                            const newFilters = { ...currentFilters };
                            delete newFilters.assigned_to;
                            handleFiltersChange(newFilters);
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        ...extensions.map((ext) => ({
                          label: ext.display_name || ext.name || ext.extension,
                          value: ext.id || ext.extension,
                          onClick: () => {
                            handleFiltersChange({
                              ...currentFilters,
                              assigned_to: ext.id || ext.extension,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        })),
                      ],
                    },
                    {
                      id: "create_date",
                      label: "Create date",
                      showDropdown: true,
                      dropdownOptions: [
                        {
                          label: "All Time",
                          value: "all",
                          onClick: () => {
                            const newFilters = { ...currentFilters };
                            delete newFilters.date_from;
                            delete newFilters.date_to;
                            handleFiltersChange(newFilters);
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Today",
                          value: "today",
                          onClick: () => {
                            const today = moment().format("YYYY-MM-DD");
                            handleFiltersChange({
                              ...currentFilters,
                              date_from: today,
                              date_to: today,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Last 7 Days",
                          value: "week",
                          onClick: () => {
                            const from = moment()
                              .subtract(7, "days")
                              .format("YYYY-MM-DD");
                            const to = moment().format("YYYY-MM-DD");
                            handleFiltersChange({
                              ...currentFilters,
                              date_from: from,
                              date_to: to,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Last 30 Days",
                          value: "month",
                          onClick: () => {
                            const from = moment()
                              .subtract(30, "days")
                              .format("YYYY-MM-DD");
                            const to = moment().format("YYYY-MM-DD");
                            handleFiltersChange({
                              ...currentFilters,
                              date_from: from,
                              date_to: to,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                      ],
                    },
                    {
                      id: "lead_stage",
                      label: "Lead Stage",
                      showDropdown: true,
                      dropdownOptions: [
                        {
                          label: "All Stages",
                          value: "all",
                          onClick: () => {
                            const newFilters = { ...currentFilters };
                            delete newFilters.stage_id;
                            handleFiltersChange(newFilters);
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        ...stages.map((stage) => ({
                          label: stage.name,
                          value: stage.id.toString(),
                          onClick: () => {
                            handleFiltersChange({
                              ...currentFilters,
                              stage_id: stage.id.toString(),
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        })),
                      ],
                    },
                    {
                      id: "lead_potential",
                      label: "Lead Potential",
                      showDropdown: true,
                      dropdownOptions: [
                        {
                          label: "All Potential",
                          value: "all",
                          onClick: () => {
                            const newFilters = { ...currentFilters };
                            delete newFilters.lead_potential;
                            handleFiltersChange(newFilters);
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Hot",
                          value: "Hot",
                          onClick: () => {
                            handleFiltersChange({
                              ...currentFilters,
                              lead_potential: "Hot",
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Warm",
                          value: "Warm",
                          onClick: () => {
                            handleFiltersChange({
                              ...currentFilters,
                              lead_potential: "Warm",
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Cold",
                          value: "Cold",
                          onClick: () => {
                            handleFiltersChange({
                              ...currentFilters,
                              lead_potential: "Cold",
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                      ],
                    },
                  ],
                  showAdvancedFilters: true,
                  onAdvancedFiltersClick: handleOpenFiltersSidebar,

                  // Right-aligned custom actions
                  rightActions: session?.user?.permissions?.includes(
                    "add-crm-leads",
                  ) ? (
                    <div
                      style={{
                        position: "absolute",
                        right: "40px",
                        top: "18px",
                        width: "auto",
                      }}
                    >
                      <button
                        onClick={() => setShowCreateLeadModal(true)}
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#1a1a1a";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#000000";
                        }}
                      >
                        Add Lead
                      </button>
                    </div>
                  ) : undefined,
                }}
                statsCards={leadsStatsCards}
              />
            </div>
          </div>
        </div>

        {/* Lead Details Sidebar */}
        {showLeadSidebar && (
          <GenericSidebar
            isOpen={showLeadSidebar}
            onClose={handleCloseLeadSidebar}
            title={selectedLead?.name || "Lead Details"}
            subtitle={selectedLead?.phone || selectedLead?.rawData?.phone || ""}
            email={selectedLead?.email || selectedLead?.rawData?.email}
            phone={selectedLead?.phone || selectedLead?.rawData?.phone}
            avatar={{
              initials: getInitials(selectedLead?.name || "NA"),
              name: selectedLead?.name || "NA",
              gradient: getRandomColor(selectedLead?.name || ""),
            }}
            onNoteCreate={handleNoteCreate}
            breezeRecordSummary={{
              content: `This lead was created on ${selectedLead?.created_at ? moment(selectedLead.created_at).format("MMMM DD, YYYY") : "recent date"}. ${selectedLead?.stage?.name ? `Currently in ${selectedLead.stage.name} stage.` : ""} ${selectedLead?.lead_potential || selectedLead?.leadPotential ? `Lead potential: ${selectedLead.lead_potential || selectedLead.leadPotential}.` : ""} ${selectedLead?.company_name || selectedLead?.company ? `Company: ${selectedLead.company_name || selectedLead.company}.` : ""}`,
              timestamp: selectedLead?.updated_at
                ? `Generated on ${moment(selectedLead.updated_at).format("MMM DD, YYYY [at] h:mm A")}`
                : "Generated recently",
              onRefresh: () => console.log("Refresh AI summary"),
              onThumbsUp: () => console.log("Thumbs up"),
              onThumbsDown: () => console.log("Thumbs down"),
              onCopy: () => {
                const summaryText = `This lead was created on ${selectedLead?.created_at ? moment(selectedLead.created_at).format("MMMM DD, YYYY") : "recent date"}. ${selectedLead?.stage?.name ? `Currently in ${selectedLead.stage.name} stage.` : ""} ${selectedLead?.lead_potential || selectedLead?.leadPotential ? `Lead potential: ${selectedLead.lead_potential || selectedLead.leadPotential}.` : ""} ${selectedLead?.company_name || selectedLead?.company ? `Company: ${selectedLead.company_name || selectedLead.company}.` : ""}`;
                navigator.clipboard.writeText(summaryText);
                toast.success("Summary copied to clipboard");
              },
              onAskQuestion: () => console.log("Ask AI a question"),
            }}
            recordLink={{
              label: "View record",
              onClick: () => {
                const leadId = selectedLead?.id || selectedLead?.rawData?.id;
                if (leadId) {
                  router.push(`/crm/leads/${leadId}/edit`);
                }
              },
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Edit Lead",
                  onClick: () => {
                    const leadId =
                      selectedLead?.id || selectedLead?.rawData?.id;
                    if (leadId) {
                      router.push(`/crm/leads/${leadId}/edit`);
                    }
                  },
                },
                {
                  label: "Convert to Deal",
                  onClick: () => {
                    setShowLeadSidebar(false);
                    handleConvertLead(selectedLead?.rawData || selectedLead);
                  },
                },
                {
                  label: "View History",
                  onClick: () => {
                    setShowLeadSidebar(false);
                    const leadId =
                      selectedLead?.id || selectedLead?.rawData?.id;
                    if (leadId) {
                      handleViewLead(leadId);
                      setShowLeadHistoryModal(true);
                    }
                  },
                },
                {
                  label: "Delete",
                  onClick: () => {
                    const leadId =
                      selectedLead?.id || selectedLead?.rawData?.id;
                    if (leadId) {
                      handleDeleteLead(leadId, selectedLead?.name);
                    }
                  },
                },
              ],
            }}
            quickActions={[
              {
                id: "note",
                label: "Note",
                icon: FileText,
                onClick: () => {}, // This is handled internally now
                disabled: false,
              },
              {
                id: "call",
                label: "Call",
                icon: Phone,
                onClick: () => {
                  const phone =
                    selectedLead?.phone || selectedLead?.rawData?.phone;
                  if (phone) {
                    handleCallClick(selectedLead);
                  }
                },
                disabled: !(
                  selectedLead?.phone || selectedLead?.rawData?.phone
                ),
              },
              {
                id: "email",
                label: "Email",
                icon: Mail,
                onClick: () => {},
                disabled: !(
                  selectedLead?.email || selectedLead?.rawData?.email
                ),
              },
              {
                id: "task",
                label: "Task",
                icon: CheckSquare,
                onClick: () => {},
                disabled: false,
              },
              {
                id: "meeting",
                label: "Meeting",
                icon: Calendar,
                onClick: () => {
                  const leadId = selectedLead?.id || selectedLead?.rawData?.id;
                  if (leadId) {
                    setMeetingData({
                      leadId: Number(leadId),
                      leadName: selectedLead?.name || "",
                      meetingName: "",
                      meetingType: "Online",
                      meetingDate: "",
                      meetingTime: "",
                      meetingOutcome: "",
                      extensions: [],
                    });
                    setMeetingAttendees([]);
                    setShowAddMeetingModal(true);
                  }
                },
                disabled: false,
              },
              {
                id: "more",
                label: "More",
                icon: MoreVertical,
                onClick: () => console.log("More actions"),
                disabled: false,
              },
            ]}
            sections={[
              {
                id: "about-lead",
                title: "About this lead",
                icon: Target,
                collapsible: true,
                defaultExpanded: true,
                actions: [
                  {
                    label: "Edit all properties",
                    onClick: () => {
                      const leadId =
                        selectedLead?.id || selectedLead?.rawData?.id;
                      if (leadId) {
                        router.push(`/crm/leads/${leadId}/edit`);
                      }
                    },
                  },
                ],
                fields: [
                  {
                    label: "Name",
                    value: selectedLead?.name || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Phone",
                    value:
                      selectedLead?.phone ||
                      selectedLead?.rawData?.phone ||
                      "N/A",
                    type: "phone",
                    copyable: true,
                    externalLink:
                      selectedLead?.phone || selectedLead?.rawData?.phone
                        ? `tel:${selectedLead?.phone || selectedLead?.rawData?.phone}`
                        : undefined,
                  },
                  {
                    label: "Email",
                    value:
                      selectedLead?.email ||
                      selectedLead?.rawData?.email ||
                      "N/A",
                    type: "email",
                    copyable: true,
                    externalLink:
                      selectedLead?.email || selectedLead?.rawData?.email
                        ? `mailto:${selectedLead?.email || selectedLead?.rawData?.email}`
                        : undefined,
                    show: !!(
                      selectedLead?.email || selectedLead?.rawData?.email
                    ),
                  },
                  {
                    label: "Company",
                    value:
                      selectedLead?.company_name ||
                      selectedLead?.company ||
                      "N/A",
                    copyable: true,
                    show: !!(
                      selectedLead?.company_name || selectedLead?.company
                    ),
                  },
                  {
                    label: "Stage",
                    value:
                      selectedLead?.is_lost || selectedLead?.isLost
                        ? "Lost"
                        : selectedLead?.stage?.name ||
                          selectedLead?.stage ||
                          "N/A",
                    type: "badge",
                    badgeVariant:
                      selectedLead?.is_lost || selectedLead?.isLost
                        ? "danger"
                        : "primary",
                  },
                  {
                    label: "Lead Potential",
                    value:
                      selectedLead?.lead_potential ||
                      selectedLead?.leadPotential ||
                      "N/A",
                    type: "badge",
                    badgeVariant:
                      selectedLead?.lead_potential === "Hot" ||
                      selectedLead?.leadPotential === "Hot"
                        ? "danger"
                        : selectedLead?.lead_potential === "Warm" ||
                            selectedLead?.leadPotential === "Warm"
                          ? "warning"
                          : "secondary",
                  },
                  {
                    label: "Assigned To",
                    value:
                      selectedLead?.assigned_user?.display_name ||
                      selectedLead?.assigned_user?.name ||
                      selectedLead?.assignedUser ||
                      "Unassigned",
                    hasDetails: true,
                    onDetailsClick: () => console.log("Show user details"),
                  },
                  {
                    label: "Lead Score",
                    value: selectedLead?.stage?.score
                      ? `${selectedLead.stage.score}%`
                      : selectedLead?.lead_score
                        ? `${selectedLead.lead_score}%`
                        : "N/A",
                    show: !!(
                      selectedLead?.stage?.score || selectedLead?.lead_score
                    ),
                  },
                  {
                    label: "Source",
                    value: selectedLead?.source || "N/A",
                    show: !!selectedLead?.source,
                  },
                  {
                    label: "Created Date",
                    value:
                      selectedLead?.created_at || selectedLead?.created
                        ? moment(
                            selectedLead.created_at || selectedLead.created,
                          ).format("MMM DD, YYYY")
                        : "N/A",
                    type: "date",
                  },
                  {
                    label: "Last Updated",
                    value:
                      selectedLead?.updated_at || selectedLead?.last_activity_at
                        ? moment(
                            selectedLead.updated_at ||
                              selectedLead.last_activity_at,
                          ).format("MMM DD, YYYY")
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
                  message: "No recent activities for this lead.",
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
                actions: [
                  {
                    label: "View all recordings",
                    onClick: () => console.log("View all"),
                  },
                ],
                emptyState: {
                  icon: PhoneIcon,
                  message: "No call recordings available yet.",
                  action: {
                    label: "Make a call",
                    onClick: () => {
                      const phone =
                        selectedLead?.phone || selectedLead?.rawData?.phone;
                      if (phone) {
                        handleCallClick(selectedLead);
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
              },
            ]}
          />
        )}
      </div>

      {/* Delete Lead Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setLeadToDelete(null);
        }}
        onConfirm={confirmDeleteLead}
        itemName={leadToDelete?.name}
        itemType="lead"
      />

      {/* Delete Follow-up Modal */}
      <DeleteConfirmationModal
        show={showDeleteFollowUpModal}
        onHide={() => {
          setShowDeleteFollowUpModal(false);
          setFollowUpToDelete(null);
        }}
        onConfirm={confirmDeleteFollowUp}
        itemName={
          followUpToDelete?.leadName
            ? `follow-up for ${followUpToDelete.leadName}`
            : "this follow-up"
        }
        itemType="follow-up"
      />

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

      {/* Convert Lead Modal */}
      <FormModal
        show={showConvertModal}
        onHide={() => setShowConvertModal(false)}
        title="Convert lead to opportunity"
        desc="Please fill in the details below to convert the lead to an opportunity."
        size="lg"
        formHtml={
          <>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Opportunity Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={convertFormData.opportunity_name}
                      onChange={(e) =>
                        setConvertFormData({
                          ...convertFormData,
                          opportunity_name: e.target.value,
                        })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Value</Form.Label>
                    <Form.Control
                      type="number"
                      value={convertFormData.value}
                      onChange={(e) =>
                        setConvertFormData({
                          ...convertFormData,
                          value: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Probability (%)</Form.Label>
                    <Form.Control
                      type="number"
                      value={convertFormData.probability}
                      onChange={(e) =>
                        setConvertFormData({
                          ...convertFormData,
                          probability: e.target.value,
                        })
                      }
                      min="0"
                      max="100"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Expected Close Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={convertFormData.expected_close_date}
                      onChange={(e) =>
                        setConvertFormData({
                          ...convertFormData,
                          expected_close_date: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={convertFormData.description}
                  onChange={(e) =>
                    setConvertFormData({
                      ...convertFormData,
                      description: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Form>
          </>
        }
        onSubmit={handleConvertSubmit}
        onCancel={() => setShowConvertModal(false)}
        submitButtonText="Convert to Opportunity"
        cancelButtonText="Cancel"
      />

      <FormModal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
        title="Mark lead as lost"
        desc="Please fill in the details below to mark the lead as lost."
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
                placeholder="Please provide additional feedback about why this lead was lost..."
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

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />

      {/* Lead View Modal */}
      {viewingLead && (
        <Modal
          show={showLeadViewModal}
          onHide={() => setShowLeadViewModal(false)}
          size="xl"
          centered
          className="lead-view-modal"
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
              onClick={() => setShowLeadViewModal(false)}
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
                  background: "#2563eb",
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
                {viewingLead.name
                  ? viewingLead.name.charAt(0).toUpperCase()
                  : "L"}
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
                  {viewingLead.name}
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
                    {viewingLead.stage?.name || "No stage"}
                  </span>
                  <span>•</span>
                  <span>
                    Created{" "}
                    {viewingLead.created_at
                      ? moment(viewingLead.created_at).format("MMM DD, YYYY")
                      : "N/A"}
                  </span>
                  {viewingLead.is_lost && (
                    <>
                      <span>•</span>
                      <Badge
                        bg="danger"
                        style={{
                          fontWeight: 500,
                        }}
                      >
                        Lost
                      </Badge>
                    </>
                  )}
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
            {loadingLead ? (
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
                  Loading lead details...
                </p>
              </div>
            ) : (
              <>
                <style>{`
            .lead-detail-filter-buttons {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 0;
              padding: 0;
              width: 100%;
            }

            .lead-detail-filter-button {
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

            .lead-detail-filter-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .lead-detail-filter-button.active {
              color: white;
            }

            .lead-detail-filter-button.active .filter-icon {
              color: white;
            }

            .lead-detail-filter-button:not(.active) .filter-icon {
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
                    <div className="lead-detail-filter-buttons mb-4">
                      <button
                        className={`lead-detail-filter-button ${activeTab === "general-info" ? "active" : ""}`}
                        onClick={() => setActiveTab("general-info")}
                        style={{
                          backgroundColor:
                            activeTab === "general-info" ? "#2563eb" : "white",
                          borderColor: "#2563eb",
                          color:
                            activeTab === "general-info" ? "white" : "#2563eb",
                        }}
                      >
                        <Target className="filter-icon" size={18} />
                        <span>General Information</span>
                      </button>
                      <button
                        className={`lead-detail-filter-button ${activeTab === "campaign-prospect" ? "active" : ""}`}
                        onClick={() => setActiveTab("campaign-prospect")}
                        style={{
                          backgroundColor:
                            activeTab === "campaign-prospect"
                              ? "#2563eb"
                              : "white",
                          borderColor: "#2563eb",
                          color:
                            activeTab === "campaign-prospect"
                              ? "white"
                              : "#2563eb",
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
                                "0 8px 16px rgba(37, 99, 235, 0.15)";
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
                                  background: "#2563eb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <User size={20} style={{ color: "white" }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#2563eb",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Assigned To
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
                                  {extensions.find(
                                    (ext: any) =>
                                      ext?.id == viewingLead?.user_extension ||
                                      ext?.extension ==
                                        viewingLead?.user_extension,
                                  )?.display_name ||
                                    extensions.find(
                                      (ext: any) =>
                                        ext?.id ==
                                          viewingLead?.user_extension ||
                                        ext?.extension ==
                                          viewingLead?.user_extension,
                                    )?.name ||
                                    viewingLead.user_extension ||
                                    "Not assigned"}
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
                                "0 8px 16px rgba(37, 99, 235, 0.15)";
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
                                  background: "#0284c7",
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
                                    color: "#0284c7",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Lead Potential
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
                                  <Badge
                                    bg={
                                      viewingLead.lead_potential === "Hot"
                                        ? "danger"
                                        : viewingLead.lead_potential === "Warm"
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
                                    {viewingLead.lead_potential || "N/A"}
                                  </Badge>
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
                                "0 8px 16px rgba(37, 99, 235, 0.15)";
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
                                    viewingLead.stage?.color || "#6c757d",
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
                                  {viewingLead.stage?.name || "Not assigned"}
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
                                "0 8px 16px rgba(37, 99, 235, 0.15)";
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
                                <ChartLine
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
                                  Lead Score
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
                                  {viewingLead?.lead_score !== null
                                    ? `${viewingLead?.lead_score}%`
                                    : "Not Set"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lead Information Section */}
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
                                  "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Lead Details
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
                                <User size={16} style={{ color: "#2563eb" }} />
                                Lead Name
                              </div>
                              <div
                                style={{
                                  color: "#1f2937",
                                  fontSize: "15px",
                                  fontWeight: 500,
                                }}
                              >
                                {viewingLead.name}
                              </div>

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
                                  style={{ color: "#2563eb" }}
                                />
                                Created
                              </div>
                              <div
                                style={{
                                  color: "#1f2937",
                                  fontSize: "15px",
                                  fontWeight: 500,
                                }}
                              >
                                {viewingLead.created_at
                                  ? moment(viewingLead.created_at).format(
                                      "MMMM DD, YYYY [at] hh:mm A",
                                    )
                                  : "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Company Information Section */}
                        {viewingLead.company_name && (
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
                                    "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
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
                                    }}
                                  >
                                    <Building2
                                      size={14}
                                      style={{
                                        color: "#2563eb",
                                        marginRight: "6px",
                                        display: "inline",
                                      }}
                                    />
                                    {viewingLead.company_name}
                                  </div>
                                </div>
                                {viewingLead.industry && (
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
                                      Industry
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {viewingLead.industry}
                                    </div>
                                  </div>
                                )}
                                {viewingLead.business_type && (
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
                                      Business Type
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {viewingLead.business_type}
                                    </div>
                                  </div>
                                )}
                                {viewingLead.company_size && (
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
                                      Company Size
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {viewingLead.company_size}
                                    </div>
                                  </div>
                                )}
                                {viewingLead.company_city && (
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
                                      Location
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {[
                                        viewingLead.company_city,
                                        viewingLead.company_country,
                                      ]
                                        .filter(Boolean)
                                        .join(", ") || "N/A"}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Contact Persons Section */}
                        {viewingLead.contact_persons &&
                          Array.isArray(viewingLead.contact_persons) &&
                          viewingLead.contact_persons.length > 0 && (
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
                                      "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
                                    borderRadius: "2px",
                                  }}
                                />
                                Contact Persons
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
                                  {viewingLead.contact_persons.length}
                                </Badge>
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
                                    gap: "16px",
                                  }}
                                >
                                  {viewingLead.contact_persons.map(
                                    (person: any, index: number) => (
                                      <div
                                        key={index}
                                        style={{
                                          background: "white",
                                          padding: "16px",
                                          borderRadius: "8px",
                                          border: "1px solid #e5e7eb",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: "#1f2937",
                                            marginBottom: "8px",
                                          }}
                                        >
                                          {person.title} {person.name}
                                        </div>
                                        {person.email && (
                                          <div
                                            style={{
                                              fontSize: "13px",
                                              color: "#6b7280",
                                              marginBottom: "4px",
                                            }}
                                          >
                                            <Mail
                                              size={12}
                                              style={{
                                                marginRight: "6px",
                                                display: "inline",
                                              }}
                                            />
                                            {person.email}
                                          </div>
                                        )}
                                        {person.phone && (
                                          <div
                                            style={{
                                              fontSize: "13px",
                                              color: "#6b7280",
                                            }}
                                          >
                                            <PhoneDisplay
                                              phone={
                                                person.phone_country_code &&
                                                person.phone
                                                  ? `${person.phone_country_code}${person.phone}`
                                                  : person.phone
                                              }
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Description */}
                        {viewingLead.description && (
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
                                    "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
                                  borderRadius: "2px",
                                }}
                              />
                              Description
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
                              {viewingLead.description}
                            </div>
                          </div>
                        )}

                        {/* Lost Reason */}
                        {viewingLead.is_lost && viewingLead.lost_reason && (
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
                                    "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                                  borderRadius: "2px",
                                }}
                              />
                              Lead Lost Information
                            </h5>
                            <div
                              style={{
                                background: "#fee2e2",
                                border: "1px solid #fecaca",
                                borderRadius: "12px",
                                padding: "16px 20px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#dc2626",
                                  marginBottom: "8px",
                                }}
                              >
                                Reason: {viewingLead.lost_reason.name}
                              </div>
                              {viewingLead.lost_feedback && (
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#991b1b",
                                    lineHeight: "1.6",
                                  }}
                                >
                                  Feedback: {viewingLead.lost_feedback}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "campaign-prospect" && (
                      <div>
                        {/* Campaign Information Section */}
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
                                  "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Campaign Information
                          </h5>
                          {viewingLead.campaign ? (
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
                                    {viewingLead.campaign.name}
                                  </div>
                                </div>
                                {viewingLead.campaign_field_values &&
                                  Object.keys(viewingLead.campaign_field_values)
                                    .length > 0 &&
                                  Object.entries(
                                    viewingLead.campaign_field_values,
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
                              No campaign information available
                            </div>
                          )}
                        </div>

                        {/* Prospect Information Section */}
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
                                  "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Prospect Information
                          </h5>
                          {viewingLead.crm_data ? (
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
                                {viewingLead.crm_data.id && (
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
                                      #{viewingLead.crm_data.id}
                                    </div>
                                  </div>
                                )}
                                {(viewingLead.crm_data.name ||
                                  (viewingLead.crm_data.data &&
                                    viewingLead.crm_data.data.name)) && (
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
                                      {viewingLead.crm_data.name ||
                                        (viewingLead.crm_data.data &&
                                          viewingLead.crm_data.data.name) ||
                                        "N/A"}
                                    </div>
                                  </div>
                                )}
                                {(viewingLead.crm_data.phone ||
                                  (viewingLead.crm_data.data &&
                                    viewingLead.crm_data.data.phone)) && (
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
                                          viewingLead.crm_data.phone ||
                                          (viewingLead.crm_data.data &&
                                            viewingLead.crm_data.data.phone) ||
                                          ""
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                                {viewingLead.crm_data.source_file && (
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
                                      {viewingLead.crm_data.source_file}
                                    </div>
                                  </div>
                                )}
                                {viewingLead.crm_data.uploaded_by && (
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
                                      Uploaded By
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
                                          color: "#2563eb",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
                                      {viewingLead.crm_data.uploaded_by}
                                    </div>
                                  </div>
                                )}
                                {viewingLead?.crm_data?.scheduled_call_at && (
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
                                      Scheduled Call
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
                                          color: "#2563eb",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
                                      {(() => {
                                        const scheduledAt =
                                          viewingLead.crm_data
                                            .scheduled_call_at;
                                        const isOverdue =
                                          moment(scheduledAt).isBefore(
                                            moment(),
                                          );
                                        const isNextHour = moment(
                                          scheduledAt,
                                        ).isBefore(moment().add(1, "hour"));
                                        return (
                                          <span>
                                            {moment(scheduledAt).format(
                                              "MMM DD, YYYY HH:mm",
                                            )}
                                            {isOverdue && (
                                              <Badge
                                                bg="danger"
                                                className="ms-2"
                                                style={{
                                                  fontSize: "10px",
                                                  padding: "2px 6px",
                                                }}
                                              >
                                                Overdue
                                              </Badge>
                                            )}
                                            {isNextHour && !isOverdue && (
                                              <Badge
                                                bg="warning"
                                                className="ms-2"
                                                style={{
                                                  fontSize: "10px",
                                                  padding: "2px 6px",
                                                }}
                                              >
                                                Soon
                                              </Badge>
                                            )}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}
                                {viewingLead.crm_data.created_at && (
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
                                      Created At
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
                                          color: "#2563eb",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
                                      {formatDateForTable(
                                        viewingLead.crm_data.created_at,
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Scheduled Call Notes */}
                              {viewingLead.crm_data?.note && (
                                <div
                                  style={{
                                    marginTop: "20px",
                                    paddingTop: "20px",
                                    borderTop: "1px solid #e5e7eb",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "8px",
                                    }}
                                  >
                                    Scheduled Call Notes
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      lineHeight: "1.6",
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {viewingLead.crm_data.note}
                                  </div>
                                </div>
                              )}
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
                              No prospect information available
                            </div>
                          )}
                        </div>

                        {/* Prospect Fields Section */}
                        {viewingLead.crm_data?.data &&
                          typeof viewingLead.crm_data.data === "object" &&
                          Object.keys(viewingLead.crm_data.data).length > 0 && (
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
                                      "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
                                    borderRadius: "2px",
                                  }}
                                />
                                Prospect Fields
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
                                  {Object.entries(viewingLead.crm_data.data)
                                    .filter(
                                      ([key]) =>
                                        key.toLowerCase() !== "name" &&
                                        key.toLowerCase() !== "phone",
                                    )
                                    .map(([key, value]: [string, any]) => (
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
                                          {String(value || "N/A")}
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
                          "edit-crm-leads",
                        ) && (
                          <button
                            style={{
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "12px 16px",
                              cursor:
                                activeFilter === "lost"
                                  ? "not-allowed"
                                  : "pointer",
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
                              setShowLeadViewModal(false);
                              setEditLeadIdForSidebar(viewingLead.id);
                              setShowCreateLeadModal(true);
                            }}
                            disabled={activeFilter === "lost"}
                            onMouseOver={(e) => {
                              if (activeFilter === "lost") return;
                              e.currentTarget.style.borderColor = "#2563eb";
                              e.currentTarget.style.background = "#eff6ff";
                              e.currentTarget.style.transform =
                                "translateX(4px)";
                            }}
                            onMouseOut={(e) => {
                              if (activeFilter === "lost") return;
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
                                background: "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Edit size={16} style={{ color: "white" }} />
                            </div>
                            Edit Lead
                          </button>
                        )}

                        {session?.user?.permissions?.includes(
                          "add-crm-deals",
                        ) && (
                          <button
                            disabled={activeFilter === "lost"}
                            style={{
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "12px 16px",
                              cursor:
                                activeFilter === "lost"
                                  ? "not-allowed"
                                  : "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "#1f2937",
                              opacity: activeFilter === "lost" ? 0.6 : 1,
                            }}
                            onClick={() => {
                              if (activeFilter !== "lost") {
                                setShowLeadViewModal(false);
                                handleConvertLead(viewingLead);
                              }
                            }}
                            onMouseOver={(e) => {
                              if (activeFilter !== "lost") {
                                e.currentTarget.style.borderColor = "#10b981";
                                e.currentTarget.style.background = "#f0fdf4";
                                e.currentTarget.style.transform =
                                  "translateX(4px)";
                              }
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
                                background: "#10b981",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Handshake size={16} style={{ color: "white" }} />
                            </div>
                            Convert to Deal
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
                          onClick={() => setShowLeadHistoryModal(true)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#2563eb";
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.transform = "translateX(4px)";
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
                              background:
                                "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <History size={16} style={{ color: "white" }} />
                          </div>
                          View History
                        </button>
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
                                  viewingLead.stage?.color || "#6c757d",
                              }}
                            >
                              {viewingLead.stage?.name || "N/A"}
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
                              Lead Score
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingLead?.lead_score !== null
                                ? `${viewingLead?.lead_score}%`
                                : "N/A"}
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
                              Follow-ups
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingLead.follow_ups?.length || 0}
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
                              Meetings
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingLead.meetings?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Follow-ups Timeline */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "14px",
                        }}
                      >
                        <h6
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            margin: 0,
                          }}
                        >
                          Recent Follow-ups
                        </h6>
                        {session?.user?.permissions?.includes(
                          "add-follow-up-crm-leads",
                        ) && (
                          <button
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#2563eb",
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "6px",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => {
                              setFollowupData({
                                leadId: viewingLead.id,
                                leadName: viewingLead.name,
                                followUpDate: "",
                                followUpStatus: "Pending",
                                communicationChannel: "Phone Call",
                                communicationChannelOther: "",
                                notes: "",
                                userExtension:
                                  (session?.user as any)?.extension || "admin",
                              });
                              setShowAddFollowupModal(true);
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#eff6ff";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                            title="Add Follow-up"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        {viewingLead.follow_ups &&
                        viewingLead.follow_ups.length > 0 ? (
                          <div style={{ position: "relative" }}>
                            {/* Timeline line */}
                            <div
                              style={{
                                position: "absolute",
                                left: "7px",
                                top: "8px",
                                bottom: "8px",
                                width: "2px",
                                background: "#e5e7eb",
                              }}
                            />

                            {viewingLead.follow_ups
                              .slice(0, 5)
                              .map((followUp: any, index: number) => {
                                const isCompleted =
                                  followUp.follow_up_status === "Completed";
                                return (
                                  <div
                                    key={followUp.id || index}
                                    style={{
                                      position: "relative",
                                      paddingLeft: "28px",
                                      paddingBottom:
                                        index <
                                        Math.min(
                                          viewingLead.follow_ups.length,
                                          5,
                                        ) -
                                          1
                                          ? "16px"
                                          : "0",
                                    }}
                                  >
                                    {/* Timeline dot */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: "0",
                                        top: "4px",
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "50%",
                                        background: isCompleted
                                          ? "#10b981"
                                          : "#2563eb",
                                        border: "3px solid white",
                                        boxShadow: "0 0 0 1px #e5e7eb",
                                      }}
                                    />

                                    <div>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#1f2937",
                                          fontWeight: 600,
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {followUp.communication_channel ===
                                        "Other"
                                          ? followUp.communication_channel_other
                                          : followUp.communication_channel}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#6b7280",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {followUp.follow_up_date
                                          ? moment(
                                              followUp.follow_up_date,
                                            ).format("MMM DD, YYYY")
                                          : "N/A"}
                                      </div>
                                      <Badge
                                        bg={
                                          followUp.follow_up_status ===
                                          "Completed"
                                            ? "success"
                                            : followUp.follow_up_status ===
                                                "In Progress"
                                              ? "primary"
                                              : "warning"
                                        }
                                        style={{
                                          fontSize: "10px",
                                          padding: "2px 8px",
                                        }}
                                      >
                                        {followUp.follow_up_status}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}

                            {viewingLead.follow_ups.length > 5 && (
                              <div
                                style={{
                                  textAlign: "center",
                                  marginTop: "12px",
                                  paddingTop: "12px",
                                  borderTop: "1px solid #f3f4f6",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "#2563eb",
                                    fontWeight: 600,
                                  }}
                                >
                                  +{viewingLead.follow_ups.length - 5} more
                                  follow-ups
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "20px",
                              color: "#9ca3af",
                            }}
                          >
                            <History
                              size={32}
                              style={{ marginBottom: "8px", opacity: 0.5 }}
                            />
                            <div style={{ fontSize: "13px" }}>
                              No follow-ups yet
                            </div>
                            {session?.user?.permissions?.includes(
                              "add-follow-up-crm-leads",
                            ) && (
                              <button
                                style={{
                                  marginTop: "12px",
                                  padding: "8px 16px",
                                  background: "#2563eb",
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
                                  setFollowupData({
                                    leadId: viewingLead.id,
                                    leadName: viewingLead.name,
                                    followUpDate: "",
                                    followUpStatus: "Pending",
                                    communicationChannel: "Phone Call",
                                    communicationChannelOther: "",
                                    notes: "",
                                    userExtension:
                                      (session?.user as any)?.extension ||
                                      "admin",
                                  });
                                  setShowAddFollowupModal(true);
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = "#1d4ed8";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = "#2563eb";
                                }}
                              >
                                <Plus size={14} />
                                Add Follow-up
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meetings Timeline */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "14px",
                        }}
                      >
                        <h6
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            margin: 0,
                          }}
                        >
                          Recent Meetings
                        </h6>
                        {session?.user?.permissions?.includes(
                          "add-meeting-crm-leads",
                        ) && (
                          <button
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#2563eb",
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
                                leadId: viewingLead.id,
                                leadName: viewingLead.name,
                                meetingName: "",
                                meetingType: "Online",
                                meetingDate: "",
                                meetingTime: "",
                                meetingOutcome: "Scheduled",
                                extensions: [],
                              });
                              setMeetingAttendees([]);
                              setShowAddMeetingModal(true);
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#eff6ff";
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
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        {viewingLead.meetings &&
                        viewingLead.meetings.length > 0 ? (
                          <div style={{ position: "relative" }}>
                            {/* Timeline line */}
                            <div
                              style={{
                                position: "absolute",
                                left: "7px",
                                top: "8px",
                                bottom: "8px",
                                width: "2px",
                                background: "#e5e7eb",
                              }}
                            />

                            {viewingLead.meetings
                              .slice(0, 5)
                              .map((meeting: any, index: number) => {
                                const isCompleted =
                                  meeting.meeting_outcome ===
                                  "Completed - Successful";
                                const isCancelled =
                                  meeting.meeting_outcome === "Cancelled";
                                return (
                                  <div
                                    key={meeting.id || index}
                                    style={{
                                      position: "relative",
                                      paddingLeft: "28px",
                                      paddingBottom:
                                        index <
                                        Math.min(
                                          viewingLead.meetings.length,
                                          5,
                                        ) -
                                          1
                                          ? "16px"
                                          : "0",
                                    }}
                                  >
                                    {/* Timeline dot */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: "0",
                                        top: "4px",
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "50%",
                                        background: isCompleted
                                          ? "#10b981"
                                          : isCancelled
                                            ? "#dc3545"
                                            : "#2563eb",
                                        border: "3px solid white",
                                        boxShadow: "0 0 0 1px #e5e7eb",
                                      }}
                                    />

                                    <div>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#1f2937",
                                          fontWeight: 600,
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {meeting.name}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#6b7280",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {meeting.meeting_date
                                          ? moment(meeting.meeting_date).format(
                                              "MMM DD, YYYY",
                                            )
                                          : "N/A"}
                                      </div>
                                      {meeting.meeting_outcome && (
                                        <Badge
                                          bg={
                                            meeting.meeting_outcome ===
                                            "Completed - Successful"
                                              ? "success"
                                              : meeting.meeting_outcome ===
                                                  "Completed - Needs Follow-up"
                                                ? "info"
                                                : meeting.meeting_outcome ===
                                                    "Cancelled"
                                                  ? "danger"
                                                  : meeting.meeting_outcome ===
                                                      "Rescheduled"
                                                    ? "warning"
                                                    : "secondary"
                                          }
                                          style={{
                                            fontSize: "10px",
                                            padding: "2px 8px",
                                          }}
                                        >
                                          {meeting.meeting_outcome}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                            {viewingLead.meetings.length > 5 && (
                              <div
                                style={{
                                  textAlign: "center",
                                  marginTop: "12px",
                                  paddingTop: "12px",
                                  borderTop: "1px solid #f3f4f6",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "#2563eb",
                                    fontWeight: 600,
                                  }}
                                >
                                  +{viewingLead.meetings.length - 5} more
                                  meetings
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "20px",
                              color: "#9ca3af",
                            }}
                          >
                            <Users
                              size={32}
                              style={{ marginBottom: "8px", opacity: 0.5 }}
                            />
                            <div style={{ fontSize: "13px" }}>
                              No meetings yet
                            </div>
                            {session?.user?.permissions?.includes(
                              "add-meeting-crm-leads",
                            ) && (
                              <button
                                style={{
                                  marginTop: "12px",
                                  padding: "8px 16px",
                                  background: "#2563eb",
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
                                    leadId: viewingLead.id,
                                    leadName: viewingLead.name,
                                    meetingName: "",
                                    meetingType: "Online",
                                    meetingDate: "",
                                    meetingTime: "",
                                    meetingOutcome: "Scheduled",
                                    extensions: [],
                                  });
                                  setMeetingAttendees([]);
                                  setShowAddMeetingModal(true);
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = "#1d4ed8";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = "#2563eb";
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
              Lead ID: <strong>#{viewingLead.id}</strong>
            </div>
            <Button
              variant="outline-secondary"
              onClick={() => setShowLeadViewModal(false)}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                border: "2px solid #e5e7eb",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.color = "#2563eb";
                e.currentTarget.style.background = "#eff6ff";
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

      {/* Lead History Modal */}
      {viewingLead && (
        <Modal
          show={showLeadHistoryModal}
          onHide={() => {
            setShowLeadHistoryModal(false);
          }}
          size="xl"
          centered
        >
          {/* Custom Header */}
          <div
            style={{
              borderBottom: "1px solid #ccc",
              color: "black",
              padding: "30px",
              position: "relative",
            }}
          >
            <button
              onClick={() => {
                setShowLeadHistoryModal(false);
              }}
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
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <History size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>
                  Complete Lead History
                </h3>
                <p
                  style={{
                    margin: "8px 0 0 0",
                    opacity: 0.9,
                    fontSize: "14px",
                  }}
                >
                  {viewingLead.name} - All Activities & Changes
                </p>
              </div>
            </div>
          </div>

          <Modal.Body
            style={{ padding: "30px", maxHeight: "70vh", overflowY: "auto" }}
          >
            {/* Lead Summary Card */}
            <Card
              className="border-0 shadow-sm mb-4"
              style={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              }}
            >
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "4px",
                      }}
                    >
                      Lead Name
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>
                      {viewingLead.name}
                    </div>
                  </Col>
                  <Col md={3}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "4px",
                      }}
                    >
                      Current Stage
                    </div>
                    <Badge
                      bg="primary"
                      style={{
                        fontSize: "13px",
                        padding: "6px 12px",
                        backgroundColor: viewingLead.stage?.color || "#6c757d",
                      }}
                    >
                      {viewingLead.stage?.name || "Not assigned"}
                    </Badge>
                  </Col>
                  <Col md={3}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "4px",
                      }}
                    >
                      Status
                    </div>
                    <Badge
                      bg={
                        viewingLead.is_lost
                          ? "danger"
                          : viewingLead.status === "new"
                            ? "primary"
                            : "success"
                      }
                      style={{ fontSize: "13px", padding: "6px 12px" }}
                    >
                      {viewingLead.is_lost
                        ? "Lost"
                        : viewingLead.status || "N/A"}
                    </Badge>
                  </Col>
                  <Col md={3}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "4px",
                      }}
                    >
                      Assigned To
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>
                      {extensions.find(
                        (ext: any) =>
                          ext?.id == viewingLead?.user_extension ||
                          ext?.extension == viewingLead?.user_extension,
                      )?.display_name ||
                        extensions.find(
                          (ext: any) =>
                            ext?.id == viewingLead?.user_extension ||
                            ext?.extension == viewingLead?.user_extension,
                        )?.name ||
                        viewingLead.user_extension ||
                        "Not assigned"}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Timeline */}
            {viewingLead.audit_trail &&
            Array.isArray(viewingLead.audit_trail) &&
            viewingLead.audit_trail.length > 0 ? (
              <div style={{ position: "relative" }}>
                {/* Vertical Timeline Line */}
                <div
                  style={{
                    position: "absolute",
                    left: "25px",
                    top: "0",
                    bottom: "0",
                    width: "2px",
                    background:
                      "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                    opacity: 0.3,
                  }}
                />

                {viewingLead.audit_trail.map((audit: any, index: number) => {
                  // Transform audit trail data to history format
                  const getCategoryAndIcon = (event: string, changes: any) => {
                    if (event === "created") {
                      return {
                        category: "Creation",
                        icon: <Plus size={16} />,
                        color: "#198754",
                      };
                    }
                    if (changes && Object.keys(changes).length > 0) {
                      const changeKeys = Object.keys(changes);
                      if (changeKeys.some((k) => k.includes("stage"))) {
                        return {
                          category: "Stage Change",
                          icon: <GitBranch size={16} />,
                          color: "#0d6efd",
                        };
                      }
                      if (
                        changeKeys.some(
                          (k) =>
                            k.includes("value") ||
                            k.includes("amount") ||
                            k.includes("price"),
                        )
                      ) {
                        return {
                          category: "Financial",
                          icon: <DollarSign size={16} />,
                          color: "#198754",
                        };
                      }
                      if (
                        changeKeys.some(
                          (k) =>
                            k.includes("assigned") ||
                            k.includes("owner") ||
                            k.includes("user_extension"),
                        )
                      ) {
                        return {
                          category: "Assignment",
                          icon: <UserCheck size={16} />,
                          color: "#20c997",
                        };
                      }
                    }
                    return {
                      category: "Update",
                      icon: <FileText size={16} />,
                      color: "#6c757d",
                    };
                  };

                  const { category, icon, color } = getCategoryAndIcon(
                    audit.event,
                    audit.changes,
                  );
                  const performedBy =
                    extensions.find(
                      (ext: any) =>
                        ext?.id == audit?.user_extension ||
                        ext?.extension == audit?.user_extension,
                    )?.display_name ||
                    extensions.find(
                      (ext: any) =>
                        ext?.id == audit?.user_extension ||
                        ext?.extension == audit?.user_extension,
                    )?.name ||
                    audit.user_extension ||
                    "System";
                  const timestamp =
                    audit.created_at_human ||
                    new Date(audit.created_at).toLocaleString();

                  // Build metadata from changes
                  const metadata: Record<string, any> = {};
                  if (audit.changes && Object.keys(audit.changes).length > 0) {
                    Object.entries(audit.changes).forEach(
                      ([key, change]: [string, any]) => {
                        if (ignoredKeys.includes(key)) return;
                        if (
                          change.old !== undefined &&
                          change.new !== undefined
                        ) {
                          metadata[key] = `${change.old} → ${change.new}`;
                        } else if (change.new !== undefined) {
                          metadata[key] = change.new;
                        }
                      },
                    );
                  }

                  return (
                    <div
                      key={audit.id || index}
                      style={{
                        position: "relative",
                        paddingLeft: "60px",
                        paddingBottom: "30px",
                        opacity: 0,
                        animation: `slideIn 0.4s ease forwards ${
                          index * 0.05
                        }s`,
                      }}
                    >
                      {/* Timeline Node */}
                      <div
                        style={{
                          position: "absolute",
                          left: "16px",
                          top: "0",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "white",
                          border: `3px solid ${color}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                          boxShadow: `0 0 0 4px ${color}20`,
                        }}
                      />

                      {/* Activity Card */}
                      <Card
                        className="border-0 shadow-sm"
                        style={{
                          transition: "all 0.3s",
                          cursor: "pointer",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "translateX(5px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(0,0,0,0.15)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "translateX(0)";
                          e.currentTarget.style.boxShadow =
                            "0 1px 3px rgba(0,0,0,0.1)";
                        }}
                      >
                        <Card.Body style={{ padding: "16px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "8px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  background: `${color}15`,
                                  color: color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {icon}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 600,
                                      color: "#1f2937",
                                    }}
                                  >
                                    {audit.event === "created"
                                      ? "Created"
                                      : audit.event === "updated"
                                        ? "Updated"
                                        : audit.event}
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
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#6b7280",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {audit.description || "Record updated"}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    fontSize: "12px",
                                    color: "#9ca3af",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <Clock size={12} />
                                    {timestamp}
                                  </span>
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <User size={12} />
                                    {performedBy}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Metadata Tags */}
                          {Object.keys(metadata).length > 0 && (
                            <div
                              style={{
                                marginTop: "12px",
                                paddingTop: "12px",
                                borderTop: "1px solid #f3f4f6",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              {Object.entries(metadata).map(([key, value]) => (
                                <span
                                  key={key}
                                  style={{
                                    fontSize: "11px",
                                    padding: "4px 8px",
                                    background: "#f9fafb",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "4px",
                                    color: "#4b5563",
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
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6b7280",
                }}
              >
                <History
                  size={48}
                  style={{ opacity: 0.3, marginBottom: "16px" }}
                />
                <p>No history available for this lead</p>
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

          <Modal.Footer
            style={{
              background: "#f9fafb",
              borderTop: "1px solid #e5e7eb",
              padding: "20px 30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                <strong>{viewingLead.audit_trail?.length || 0}</strong>{" "}
                activities recorded
              </div>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setShowLeadHistoryModal(false);
                }}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontWeight: 500,
                  fontSize: "14px",
                }}
              >
                Close
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {/* Add/Edit Follow-up Modal */}
      <Modal
        show={showAddFollowupModal}
        onHide={() => {
          setShowAddFollowupModal(false);
          setFollowUpIdToEdit(null);
          setFollowupData({
            leadId: null,
            leadName: "",
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
          {followupData.leadName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <User size={20} className="me-2" />
              <span>
                <strong>Lead:</strong> {followupData.leadName}
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
                with leads.
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
                leadId: null,
                leadName: "",
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

      {/* Add/Edit Meeting Modal */}
      <Modal
        show={showAddMeetingModal}
        onHide={() => {
          setShowAddMeetingModal(false);
          setMeetingIdToEdit(null);
          setMeetingData({
            leadId: null,
            leadName: "",
            meetingName: "",
            meetingType: "Online",
            meetingDate: "",
            meetingTime: "",
            meetingOutcome: "",
            extensions: [],
          });
          setMeetingAttendees([]);
        }}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{ color: "black", borderBottom: "1px solid #ccc" }}
        >
          <Modal.Title className="d-flex align-items-center">
            <Users size={24} className="me-2" />
            {meetingIdToEdit ? "Update Meeting" : "Schedule Meeting"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {meetingData.leadName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <User size={20} className="me-2" />
              <span>
                <strong>Lead:</strong> {meetingData.leadName}
              </span>
            </div>
          )}

          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Meeting Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={meetingData.meetingName}
                    onChange={(e) =>
                      setMeetingData({
                        ...meetingData,
                        meetingName: e.target.value,
                      })
                    }
                    placeholder="Enter meeting name or title..."
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Meeting Type <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    value={{
                      value: meetingData.meetingType,
                      label: meetingData.meetingType,
                    }}
                    onChange={(option) =>
                      setMeetingData({
                        ...meetingData,
                        meetingType: option?.value || "Online",
                      })
                    }
                    options={[
                      { value: "Online", label: "Online" },
                      { value: "In-Person", label: "In-Person" },
                      { value: "Phone Call", label: "Phone Call" },
                      { value: "Video Call", label: "Video Call" },
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
                  <Form.Label className="fw-semibold small">
                    Meeting Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={meetingData.meetingDate}
                    onChange={(e) =>
                      setMeetingData({
                        ...meetingData,
                        meetingDate: e.target.value,
                      })
                    }
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
                  <Form.Label className="fw-semibold small">
                    Meeting Time <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={meetingData.meetingTime}
                    onChange={(e) =>
                      setMeetingData({
                        ...meetingData,
                        meetingTime: e.target.value,
                      })
                    }
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
                  <Form.Label className="fw-semibold small">
                    Attendees
                  </Form.Label>
                  <Select
                    isMulti
                    value={meetingAttendees}
                    onChange={(selected) => setMeetingAttendees(selected || [])}
                    options={extensions.map(
                      (extension: {
                        id: string;
                        display_name: string;
                        name: string;
                      }) => ({
                        value: extension.id,
                        label:
                          extension.display_name ||
                          extension.name ||
                          extension.id,
                      }),
                    )}
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
                leads.
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
                leadId: null,
                leadName: "",
                meetingName: "",
                meetingType: "Online",
                meetingDate: "",
                meetingTime: "",
                meetingOutcome: "",
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
            onClick={
              meetingIdToEdit ? handleUpdateMeeting : handleCreateMeeting
            }
          >
            {loadingMeeting ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                />
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

      {/* Change Stage Modal */}
      <Modal
        show={showChangeStageModal}
        onHide={() => {
          setShowChangeStageModal(false);
          setLeadToChangeStage(null);
          setSelectedStageId(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <GitBranch size={20} className="me-2" />
            Change Lead Stage
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {leadToChangeStage && (
            <div className="mb-3">
              <p className="mb-1">
                <strong>Lead:</strong> {leadToChangeStage.name}
              </p>
              {(leadToChangeStage.stage || leadToChangeStage.is_lost) && (
                <p className="mb-0 text-muted">
                  <strong>Current Stage:</strong>{" "}
                  {leadToChangeStage.is_lost
                    ? "Lost"
                    : leadToChangeStage.stage?.name}
                </p>
              )}
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label>
              Select Stage <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={selectedStageId || ""}
              onChange={(e) => setSelectedStageId(Number(e.target.value))}
            >
              <option value="">Select a stage</option>
              {leadStages
                .filter((stage) => stage.type === "lead" && stage.active)
                .sort((a, b) => a.sequence - b.sequence)
                .map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Choose the new stage for this lead
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowChangeStageModal(false);
              setLeadToChangeStage(null);
              setSelectedStageId(null);
            }}
          >
            <X size={16} className="me-1" />
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedStageId || loadingChangeStage}
            onClick={handleChangeStageSubmit}
          >
            {loadingChangeStage ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Updating...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="me-1" />
                Update Stage
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditingLead(null);
          setEditFormStep(0);
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Lead: {editingLead?.name || ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editFetching ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading lead data...</p>
            </div>
          ) : (
            <>
              {/* Step Timeline */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center position-relative">
                  <div
                    className="position-absolute top-50 start-0 end-0"
                    style={{
                      height: "2px",
                      backgroundColor: "#e0e0e0",
                      zIndex: 0,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        backgroundColor: "#198754",
                        width: `${(editFormStep / 3) * 100}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  {[
                    { step: 0, label: "Lead Info" },
                    { step: 1, label: "Company Info" },
                    { step: 2, label: "Contact Persons" },
                    { step: 3, label: "Other Info" },
                  ].map(({ step, label }) => (
                    <div
                      key={step}
                      className="d-flex flex-column align-items-center position-relative"
                      style={{ zIndex: 1, cursor: "pointer" }}
                      onClick={() => setEditFormStep(step)}
                    >
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          editFormStep >= step
                            ? "bg-primary text-white"
                            : "bg-light border border-secondary text-secondary"
                        }`}
                        style={{
                          width: "40px",
                          height: "40px",
                          fontWeight: "bold",
                        }}
                      >
                        {editFormStep > step ? (
                          <CheckCircle size={20} />
                        ) : (
                          step + 1
                        )}
                      </div>
                      <small
                        className={`mt-2 ${
                          editFormStep === step
                            ? "text-primary fw-bold"
                            : "text-muted"
                        }`}
                      >
                        {label}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 0: Lead Information */}
              {editFormStep === 0 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-primary">
                      LEAD INFORMATION
                    </h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Lead Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={editFormData.name}
                            onChange={(e) =>
                              handleEditInputChange("name", e.target.value)
                            }
                            placeholder="Enter lead name"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Assigned To <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={editFormData.user_extension || ""}
                            onChange={(e) =>
                              handleEditInputChange(
                                "user_extension",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                          >
                            <option value="">Select User</option>
                            {editExtensions.map((ext: any) => (
                              <option key={ext.id} value={ext.id}>
                                {ext.display_name || ext.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Stage <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={editFormData.stage_id || ""}
                            onChange={(e) =>
                              handleEditInputChange(
                                "stage_id",
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            required
                          >
                            <option value="">Select a stage</option>
                            {editStages.map((stage) => (
                              <option key={stage.id} value={stage.id}>
                                {stage.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Source</Form.Label>
                          <Form.Control
                            type="text"
                            value={editFormData.source}
                            onChange={(e) =>
                              handleEditInputChange("source", e.target.value)
                            }
                            placeholder="e.g., LinkedIn, Website, Referral"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Campaign</Form.Label>
                          <Select
                            value={
                              editFormData.campaign_id
                                ? {
                                    value: editFormData.campaign_id,
                                    label:
                                      editCampaigns.find(
                                        (c) =>
                                          c.id === editFormData.campaign_id,
                                      )?.name || "",
                                  }
                                : null
                            }
                            onChange={(selectedOption: any) => {
                              handleEditCampaignChange(
                                selectedOption?.value || undefined,
                              );
                            }}
                            options={editCampaigns.map((campaign) => ({
                              value: campaign.id,
                              label: campaign.name,
                            }))}
                            placeholder="Select a campaign (Optional)"
                            isClearable
                            isSearchable
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Prospect</Form.Label>
                          <Select
                            value={
                              editFormData.crm_data_id
                                ? {
                                    value: editFormData.crm_data_id,
                                    label: `${editCrmData.find((d) => d.id === editFormData.crm_data_id)?.name || "No Name"}`,
                                  }
                                : null
                            }
                            onChange={(selectedOption: any) => {
                              handleEditInputChange(
                                "crm_data_id",
                                selectedOption?.value || undefined,
                              );
                            }}
                            options={editCrmData.map((data) => ({
                              value: data.id,
                              label: `${data?.name || "No Name"} - ${data?.phone || "No Phone"}`,
                            }))}
                            placeholder="Select Prospect (Optional)"
                            isClearable
                            isSearchable
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={editFormData.description}
                            onChange={(e) =>
                              handleEditInputChange(
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Enter lead description or notes"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Step 1: Company Information */}
              {editFormStep === 1 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-primary">
                      COMPANY INFORMATION
                    </h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Company Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={editFormData.company_name}
                            onChange={(e) =>
                              handleEditInputChange(
                                "company_name",
                                e.target.value,
                              )
                            }
                            placeholder="Enter company name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Business Type <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={
                              editShowOtherBusinessType
                                ? "other"
                                : editBusinessTypeId
                                  ? String(editBusinessTypeId)
                                  : ""
                            }
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
                          >
                            <option value="">Select Business Type</option>
                            {editBusinessTypes.map((businessType) => (
                              <option
                                key={businessType.id}
                                value={businessType.id}
                              >
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
                            <Form.Label>
                              Specify Business Type{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={editBusinessTypeOther}
                              onChange={(e) =>
                                setEditBusinessTypeOther(e.target.value)
                              }
                              placeholder="Enter business type"
                            />
                          </Form.Group>
                        </Col>
                      )}
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country</Form.Label>
                          <Select
                            value={editSelectedCountry}
                            onChange={handleEditCountryChange}
                            options={Country.getAllCountries().map(
                              (country: any) => ({
                                value: country.isoCode,
                                label: country.name,
                                isoCode: country.isoCode,
                              }),
                            )}
                            placeholder="Select Country"
                            isClearable
                            isSearchable
                            formatOptionLabel={(option: any) => (
                              <div className="d-flex align-items-center">
                                <img
                                  src={`https://flagcdn.com/w20/${option.isoCode.toLowerCase()}.png`}
                                  alt={option.label}
                                  className="me-2"
                                  style={{ width: "20px", height: "15px" }}
                                />
                                {option.label}
                              </div>
                            )}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Province/State</Form.Label>
                          <Select
                            value={editSelectedState}
                            onChange={handleEditStateChange}
                            options={
                              editSelectedCountry
                                ? State.getStatesOfCountry(
                                    editSelectedCountry.value,
                                  ).map((state: any) => ({
                                    value: state.isoCode,
                                    label: state.name,
                                  }))
                                : []
                            }
                            placeholder="Select Province/State"
                            isClearable
                            isSearchable
                            isDisabled={!editSelectedCountry}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Select
                            value={editSelectedCity}
                            onChange={handleEditCityChange}
                            options={
                              editSelectedCountry && editSelectedState
                                ? City.getCitiesOfState(
                                    editSelectedCountry.value,
                                    editSelectedState.value,
                                  ).map((city: any) => ({
                                    value: city.name,
                                    label: city.name,
                                  }))
                                : []
                            }
                            placeholder="Select City"
                            isClearable
                            isSearchable
                            isDisabled={
                              !editSelectedCountry || !editSelectedState
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Size</Form.Label>
                          <Form.Select
                            value={editFormData.company_size}
                            onChange={(e) =>
                              handleEditInputChange(
                                "company_size",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Size</option>
                            <option value="Micro (1-10 employees)">
                              Micro (1-10 employees)
                            </option>
                            <option value="Small (11-50 employees)">
                              Small (11-50 employees)
                            </option>
                            <option value="Medium (51-200 employees)">
                              Medium (51-200 employees)
                            </option>
                            <option value="Large (201-500 employees)">
                              Large (201-500 employees)
                            </option>
                            <option value="Enterprise (500+ employees)">
                              Enterprise (500+ employees)
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Location Notes</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={editFormData.company_location_other}
                            onChange={(e) =>
                              handleEditInputChange(
                                "company_location_other",
                                e.target.value,
                              )
                            }
                            placeholder="Any additional location details"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Step 2: Contact Persons */}
              {editFormStep === 2 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold text-primary mb-0">
                        CONTACT PERSONS
                      </h5>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={addEditContactPerson}
                      >
                        <FiPlus size={16} className="me-1" />
                        Add Contact Person
                      </Button>
                    </div>
                    {editFormData.contact_persons.map((person, index) => (
                      <Card key={index} className="mb-3 border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Contact Person {index + 1}</h6>
                            {editFormData.contact_persons.length > 1 && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeEditContactPerson(index)}
                              >
                                <X size={16} />
                              </Button>
                            )}
                          </div>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Title <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={person.title}
                                  onChange={(e) =>
                                    updateEditContactPerson(
                                      index,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g., CEO, Manager"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={person.name}
                                  onChange={(e) =>
                                    updateEditContactPerson(
                                      index,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter contact name"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Phone <span className="text-danger">*</span>
                                </Form.Label>
                                <PhoneInput
                                  international
                                  defaultCountry="PK"
                                  value={person.phone}
                                  onChange={(value: any) => {
                                    updateEditContactPerson(
                                      index,
                                      "phone",
                                      value || "",
                                    );
                                    if (value) {
                                      try {
                                        const phoneNumber =
                                          parsePhoneLib(value);
                                        if (phoneNumber) {
                                          updateEditContactPerson(
                                            index,
                                            "phone_country_code",
                                            `+${phoneNumber.countryCallingCode}`,
                                          );
                                        }
                                      } catch (e) {
                                        console.error("Phone parse error:", e);
                                      }
                                    }
                                  }}
                                  className="form-control"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Email <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="email"
                                  value={person.email}
                                  onChange={(e) =>
                                    updateEditContactPerson(
                                      index,
                                      "email",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter email address"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </Card.Body>
                </Card>
              )}

              {/* Step 3: Other Information */}
              {editFormStep === 3 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-primary">
                      OTHER INFORMATION
                    </h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Lead Potential</Form.Label>
                          <Form.Select
                            value={editFormData.lead_potential}
                            onChange={(e) =>
                              handleEditInputChange(
                                "lead_potential",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Lead Potential</option>
                            <option value="Hot">Hot</option>
                            <option value="Warm">Warm</option>
                            <option value="Cold">Cold</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Campaign Custom Fields */}
                    {(editSelectedCampaign as any)?.custom_fields &&
                      (editSelectedCampaign as any).custom_fields.length >
                        0 && (
                        <>
                          <h6 className="fw-bold mt-4 mb-3 text-primary">
                            Campaign Custom Fields
                          </h6>
                          <Row>
                            {(editSelectedCampaign as any).custom_fields.map(
                              (field: any) => (
                                <Col md={6} key={field.field_key}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>
                                      {field.field_name}
                                      {field.required && (
                                        <span className="text-danger">*</span>
                                      )}
                                    </Form.Label>
                                    {field.field_type === "string" && (
                                      <Form.Control
                                        type="text"
                                        value={
                                          editFormData.campaign_field_values?.[
                                            field.field_key
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          handleEditCampaignFieldChange(
                                            field.field_key,
                                            e.target.value,
                                          )
                                        }
                                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                                        required={field.required}
                                      />
                                    )}
                                    {field.field_type === "email" && (
                                      <Form.Control
                                        type="email"
                                        value={
                                          editFormData.campaign_field_values?.[
                                            field.field_key
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          handleEditCampaignFieldChange(
                                            field.field_key,
                                            e.target.value,
                                          )
                                        }
                                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                                        required={field.required}
                                      />
                                    )}
                                    {field.field_type === "text" && (
                                      <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={
                                          editFormData.campaign_field_values?.[
                                            field.field_key
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          handleEditCampaignFieldChange(
                                            field.field_key,
                                            e.target.value,
                                          )
                                        }
                                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                                        required={field.required}
                                      />
                                    )}
                                    {field.field_type === "integer" && (
                                      <Form.Control
                                        type="number"
                                        value={
                                          editFormData.campaign_field_values?.[
                                            field.field_key
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          handleEditCampaignFieldChange(
                                            field.field_key,
                                            e.target.value,
                                          )
                                        }
                                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                                        required={field.required}
                                      />
                                    )}
                                    {field.field_type === "date" && (
                                      <Form.Control
                                        type="date"
                                        value={
                                          editFormData.campaign_field_values?.[
                                            field.field_key
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          handleEditCampaignFieldChange(
                                            field.field_key,
                                            e.target.value,
                                          )
                                        }
                                        required={field.required}
                                      />
                                    )}
                                    {field.field_type === "dropdown" && (
                                      <Form.Select
                                        value={
                                          editFormData.campaign_field_values?.[
                                            field.field_key
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          handleEditCampaignFieldChange(
                                            field.field_key,
                                            e.target.value,
                                          )
                                        }
                                        required={field.required}
                                      >
                                        <option value="">
                                          Select {field.field_name}
                                        </option>
                                        {field.dropdown_options?.map(
                                          (option: string) => (
                                            <option key={option} value={option}>
                                              {option}
                                            </option>
                                          ),
                                        )}
                                      </Form.Select>
                                    )}
                                  </Form.Group>
                                </Col>
                              ),
                            )}
                          </Row>
                        </>
                      )}
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {editFormStep > 0 && (
            <Button
              variant="outline-secondary"
              onClick={() => setEditFormStep((prev) => prev - 1)}
            >
              <ChevronLeft size={16} className="me-1" />
              Back
            </Button>
          )}
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowEditModal(false);
              setEditingLead(null);
              setEditFormStep(0);
            }}
          >
            <X size={16} className="me-1" />
            Cancel
          </Button>
          {editFormStep < 3 ? (
            <Button variant="primary" onClick={handleEditNextStep}>
              Next
              <ChevronRight size={16} className="ms-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleEditSubmit}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="me-1" />
                  Update Lead
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Lead Details Sidebar */}
      {/* <GenericSidebar
        isOpen={showLeadSidebar}
        onClose={() => {
          setShowLeadSidebar(false);
          setSelectedLead(null);
        }}
        onCall={handleSidebarCall}
        title={selectedLead?.name || 'Lead Details'}
        subtitle={selectedLead?.company_name || selectedLead?.company || ''}
        metadata={selectedLead?.id ? `Lead ID: ${selectedLead.id}` : ''}
        email={selectedLead?.email || selectedLead?.rawData?.email || ''}
        phone={selectedLead?.phone || selectedLead?.rawData?.phone || ''}
        completePhone={(() => {
          const raw = selectedLead?.contact_persons;
          if (!raw) return '';
          let arr: Array<{ phone_country_code?: string; phone?: string }> = [];
          if (typeof raw === 'string') {
            try {
              arr = JSON.parse(raw);
            } catch {
              return '';
            }
          } else if (Array.isArray(raw)) {
            arr = raw;
          }
          const first = arr[0];
          if (!first) return '';
          const code = first.phone_country_code ?? '';
          const num = first.phone ?? '';
          return `${code}${num}`.trim();
        })()}
        avatar={{
          name: selectedLead?.name || 'Lead',
          initials: getInitials(selectedLead?.name || 'Lead')
        }}
        contextPayload={
          selectedLead
            ? (() => {
                const { follow_ups, meetings, audit_trail, ...leadRest } = selectedLead ?? {};
                const leadForPayload = selectedLead ? { ...leadRest } : undefined;
                return {
                  lead: leadForPayload,
                };
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
            id: 'lead-info',
            title: 'Lead Information',
            icon: Target,
            fields: [
              {
                label: 'Lead Name',
                value: selectedLead?.name || 'N/A'
              },
              {
                label: 'Stage',
                value: (selectedLead?.is_lost || selectedLead?.isLost) ? 'Lost' : (selectedLead?.stage?.name || selectedLead?.stage || 'N/A'),
                type: 'badge',
                badgeVariant: 'primary'
              },
              {
                label: 'Lead Potential',
                value: selectedLead?.lead_potential || selectedLead?.leadPotential || 'N/A',
                type: 'badge',
                badgeVariant: selectedLead?.lead_potential === 'Hot' || selectedLead?.leadPotential === 'Hot' 
                  ? 'danger' 
                  : selectedLead?.lead_potential === 'Warm' || selectedLead?.leadPotential === 'Warm'
                  ? 'warning'
                  : 'secondary'
              },
              {
                label: 'Assigned To',
                value: selectedLead?.assigned_user?.display_name || selectedLead?.assigned_user?.name || selectedLead?.assignedUser || 'Unassigned',
                icon: User
              },
              {
                label: 'Created Date',
                value: selectedLead?.created_at || selectedLead?.created,
                type: 'date',
                icon: Calendar
              },
              {
                label: 'Lead Score (Based on Stage)',
                value: selectedLead?.stage?.score ? `${selectedLead.stage.score}%` : selectedLead?.lead_score ? `${selectedLead.lead_score}%` : 'N/A',
                show: !!(selectedLead?.stage?.score || selectedLead?.lead_score)
              },
              {
                label: 'Source',
                value: selectedLead?.source || 'N/A',
                show: !!selectedLead?.source
              },
              {
                label: 'Last Activity',
                value: selectedLead?.last_activity_at || selectedLead?.updated_at,
                type: 'datetime',
                show: !!(selectedLead?.last_activity_at || selectedLead?.updated_at)
              },
              {
                label: 'Follow-ups',
                value: `${selectedLead?.follow_ups?.length || 0} follow-up(s)`,
                icon: History,
                show: true
              },
              {
                label: 'Meetings',
                value: `${selectedLead?.meetings?.length || 0} meeting(s)`,
                icon: Calendar,
                show: true
              }
            ]
          },
          {
            id: 'company-info',
            title: 'Company Information',
            icon: Building2,
            fields: [
              {
                label: 'Company Name',
                value: selectedLead?.company_name || selectedLead?.company || 'N/A'
              },
              {
                label: 'Company Size',
                value: selectedLead?.company_size || 'N/A',
                show: !!selectedLead?.company_size
              },
              {
                label: 'Location',
                value: selectedLead?.location || 'N/A',
                show: !!selectedLead?.location
              }
            ]
          }
            ]
          },
          {
            id: 'campaign-prospects',
            label: 'Campaign and Prospects',
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
                  value: leadFollowUps?.length || 0,
                  variant: 'secondary'
                },
                ...(leadFollowUps?.length
                  ? {
                      customContent: (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(leadFollowUps || []).map((fu: any) => (
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
                                  style={{ fontSize: '12px', color: '#6366f1' }}
                                  onClick={() => {
                                    const leadId = selectedLead?.id || selectedLead?.rawData?.id;
                                    if (leadId) {
                                      const followUpDate = fu.follow_up_date ? new Date(fu.follow_up_date).toISOString().split('T')[0] : '';
                                      setFollowUpIdToEdit(fu.id);
                                      setFollowupData({
                                        leadId: Number(leadId),
                                        leadName: selectedLead?.name || '',
                                        followUpDate,
                                        followUpStatus: fu.follow_up_status || 'Pending',
                                        communicationChannel: fu.communication_channel || 'Phone Call',
                                        communicationChannelOther: fu.communication_channel_other || '',
                                        notes: fu.notes || '',
                                        userExtension: (session?.user as any)?.extension || ''
                                      });
                                      setShowAddFollowupModal(true);
                                    }
                                  }}
                                >
                                  <Edit size={14} className="me-1" /> Edit
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-danger"
                                  title="Delete"
                                  onClick={() => {
                                    const leadId = selectedLead?.id || selectedLead?.rawData?.id;
                                    if (leadId) {
                                      handleDeleteFollowUp(Number(leadId), fu.id, selectedLead?.name);
                                    }
                                  }}
                                >
                                  <Trash2 size={14} className="me-1" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                            onClick={() => {
                              const leadId = selectedLead?.id || selectedLead?.rawData?.id;
                              if (leadId) {
                                setFollowupData({
                                  leadId: Number(leadId),
                                  leadName: selectedLead?.name || '',
                                  followUpDate: '',
                                  followUpStatus: 'Pending',
                                  communicationChannel: 'Phone Call',
                                  communicationChannelOther: '',
                                  notes: '',
                                  userExtension: ''
                                });
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
                            setFollowupData({
                              leadId: selectedLead?.id || selectedLead?.rawData?.id || null,
                              leadName: selectedLead?.name || '',
                              followUpDate: '',
                              followUpStatus: 'Pending',
                              communicationChannel: 'Phone Call',
                              communicationChannelOther: '',
                              notes: '',
                              userExtension: ''
                            });
                            setShowAddFollowupModal(true);
                          }
                        }
                      }
                    })
              },
              {
                id: 'meetings',
                title: 'Meetings',
                icon: Calendar,
                badge: {
                  value: leadMeetings?.length || 0,
                  variant: 'secondary'
                },
                ...(leadMeetings?.length
                  ? {
                      customContent: (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(leadMeetings || []).map((m: any) => (
                            <div
                              key={m.id}
                              style={{
                                padding: '12px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '13px'
                              }}
                            >
                              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                                {m.name || 'Meeting'}
                              </div>
                              <div style={{ color: '#64748b', marginBottom: '4px' }}>
                                {m.meeting_date ? moment(m.meeting_date).format(GlobalDateFormat) : '-'}
                                {m.meeting_time && ` at ${m.meeting_time}`}
                              </div>
                              <div style={{ color: '#475569', marginBottom: '4px' }}>
                                <span style={{ color: '#94a3b8' }}>Type: </span>
                                {m.meeting_type || '-'}
                              </div>
                              {m.meeting_outcome && (
                                <div style={{ color: '#475569', marginBottom: '4px' }}>
                                  <span style={{ color: '#94a3b8' }}>Outcome: </span>
                                  {m.meeting_outcome}
                                </div>
                              )}
                              <div style={{ color: '#475569', marginBottom: '4px' }}>
                                <span style={{ color: '#94a3b8' }}>Attendees: </span>
                                {m.extensions?.map((ext: any) => {
                                  const user = extensions.find((e: any) => String(e?.extension) === String(ext?.extension) || String(e?.id) === String(ext?.extension));
                                  return user?.display_name || user?.name || ext?.extension || '';
                                }).filter(Boolean).join(', ') || '-'}
                              </div>
                              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-danger"
                                  title="Delete"
                                  onClick={() => {
                                    const leadId = selectedLead?.id || selectedLead?.rawData?.id;
                                    handleDeleteMeeting(m.id, m.name, leadId ? Number(leadId) : undefined);
                                  }}
                                >
                                  <Trash2 size={14} className="me-1" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                            onClick={() => {
                              const leadId = selectedLead?.id || selectedLead?.rawData?.id;
                              if (leadId) {
                                setMeetingData({
                                  leadId: Number(leadId),
                                  leadName: selectedLead?.name || '',
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
                            }}
                          >
                            <Plus size={14} className="me-1" /> Schedule Meeting
                          </Button>
                        </div>
                      )
                    }
                  : {
                      emptyState: {
                        icon: Calendar,
                        message: 'No meetings scheduled yet',
                        action: {
                          label: 'Schedule Meeting',
                          onClick: () => {
                            setMeetingData({
                              leadId: selectedLead?.id || selectedLead?.rawData?.id || null,
                              leadName: selectedLead?.name || '',
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
                    })
              }
            ]
          }
        ]}
        actions={[
          {
            label: 'Edit Lead',
            icon: Edit,
            onClick: () => {
              router.push(`/crm/leads/${selectedLead?.id || selectedLead?.rawData?.id}/edit`);
            },
            variant: 'primary',
            show: session?.user?.permissions?.includes('edit-crm-leads') && activeFilter !== 'lost'
          },
          {
            label: 'Convert to Deal',
            icon: Handshake,
            onClick: () => {
              setShowLeadSidebar(false);
              handleConvertLead(selectedLead?.rawData || selectedLead);
            },
            variant: 'success',
            show: session?.user?.permissions?.includes('add-crm-deals'),
            disabled: activeFilter === 'lost'
          },
          {
            label: 'View History',
            icon: History,
            onClick: () => {
              setShowLeadSidebar(false);
              void handleViewLead(selectedLead?.id || selectedLead?.rawData?.id).then(() => {
                setShowLeadHistoryModal(true);
              });
            },
            variant: 'outline-primary'
          }
        ]}
      /> */}

      {/* Filters Sidebar */}
      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={() => setShowFiltersSidebar(false)}
        title="Filters"
        subtitle="Filter and refine your leads"
        width="400px"
        filters={[
          {
            id: "assignedTo",
            label: "Assigned To",
            type: "select",
            value: leadsFilters.assignedTo
              ? (() => {
                  const assignedToId = leadsFilters.assignedTo;
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
              setLeadsFilters((prev) => ({
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
          },
          {
            id: "stage",
            label: "Stages",
            type: "select",
            value: leadsFilters.stage
              ? (() => {
                  const stageId = leadsFilters.stage;
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
              setLeadsFilters((prev) => ({
                ...prev,
                stage: stageValue,
              }));
              if (stageValue) {
                setActiveFilter(stageValue);
              } else {
                setActiveFilter("all");
              }
            },
            options: stages.map((s: any) => ({
              value: s.id.toString(),
              label: s.name,
            })),
            placeholder: "Select stage...",
            isClearable: true,
          },
          {
            id: "businessType",
            label: "Business Type",
            type: "select",
            value: leadsFilters.businessType
              ? (() => {
                  const btId = leadsFilters.businessType;
                  const bt = filterBusinessTypes.find(
                    (b: BusinessTypeData) => b.id.toString() === btId,
                  );
                  return bt
                    ? { value: btId, label: bt.name }
                    : { value: btId, label: btId };
                })()
              : null,
            onChange: (selected) => {
              const businessTypeValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                businessType: businessTypeValue,
              }));
            },
            options: filterBusinessTypes.map((bt: BusinessTypeData) => ({
              value: bt.id.toString(),
              label: bt.name,
            })),
            placeholder: "Select business type...",
            isClearable: true,
          },
          {
            id: "source",
            label: "Source",
            type: "select",
            value: leadsFilters.source
              ? { value: leadsFilters.source, label: leadsFilters.source }
              : null,
            onChange: (selected) => {
              const sourceValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                source: sourceValue,
              }));
            },
            options: uniqueSources,
            placeholder: "Select source...",
            isClearable: true,
          },
          {
            id: "leadPotential",
            label: "Lead Potential",
            type: "select",
            value: leadsFilters.leadPotential
              ? {
                  value: leadsFilters.leadPotential,
                  label: leadsFilters.leadPotential,
                }
              : null,
            onChange: (selected) => {
              const leadPotentialValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                leadPotential: leadPotentialValue,
              }));
            },
            options: [
              { value: "Hot", label: "Hot" },
              { value: "Warm", label: "Warm" },
              { value: "Cold", label: "Cold" },
            ],
            placeholder: "Select lead potential...",
            isClearable: true,
          },
          {
            id: "campaign",
            label: "Campaign",
            type: "select",
            value: leadsFilters.campaign
              ? (() => {
                  const campaignId = leadsFilters.campaign;
                  const campaign = campaigns.find(
                    (c: any) => c.id.toString() === campaignId,
                  );
                  return campaign
                    ? { value: campaignId, label: campaign.name }
                    : { value: campaignId, label: campaignId };
                })()
              : null,
            onChange: (selected) => {
              const campaignValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                campaign: campaignValue,
              }));
            },
            options: campaigns.map((campaign: any) => ({
              value: campaign.id.toString(),
              label: campaign.name,
            })),
            placeholder: "Select campaign...",
            isClearable: true,
          },
          {
            id: "lostReason",
            label: "Lost Lead Reason",
            type: "select",
            value: leadsFilters.lostReason
              ? (() => {
                  const reasonId = leadsFilters.lostReason;
                  const reason = lostReasons.find(
                    (r: any) => r.id.toString() === reasonId,
                  );
                  return reason
                    ? { value: reasonId, label: reason.name }
                    : { value: reasonId, label: reasonId };
                })()
              : null,
            onChange: (selected) => {
              const lostReasonValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                lostReason: lostReasonValue,
              }));
            },
            options: lostReasons.map((r: any) => ({
              value: r.id.toString(),
              label: r.name,
            })),
            placeholder: "Select lost reason...",
            isClearable: true,
          },
          {
            id: "leadScoreMin",
            label: "Lead Score (Min)",
            type: "text",
            value: leadsFilters.leadScoreMin || "",
            onChange: (value) => {
              const minValue = value || null;
              setLeadsFilters((prev) => ({
                ...prev,
                leadScoreMin: minValue,
              }));
            },
            placeholder: "Minimum score",
          },
          {
            id: "leadScoreMax",
            label: "Lead Score (Max)",
            type: "text",
            value: leadsFilters.leadScoreMax || "",
            onChange: (value) => {
              const maxValue = value || null;
              setLeadsFilters((prev) => ({
                ...prev,
                leadScoreMax: maxValue,
              }));
            },
            placeholder: "Maximum score",
          },
          {
            id: "dateFrom",
            label: "Date (From)",
            type: "date",
            value: leadsFilters.dateFrom || "",
            onChange: (value) => {
              const dateFromValue = value || null;
              setLeadsFilters((prev) => ({
                ...prev,
                dateFrom: dateFromValue,
              }));
            },
            placeholder: "From date",
          },
          {
            id: "dateTo",
            label: "Date (To)",
            type: "date",
            value: leadsFilters.dateTo || "",
            onChange: (value) => {
              const dateToValue = value || null;
              setLeadsFilters((prev) => ({
                ...prev,
                dateTo: dateToValue,
              }));
            },
            placeholder: "To date",
          },
        ]}
        onApply={() => {
          const filtersToApply: Record<string, any> = {};

          filtersToApply.search = leadsSearch;
          filtersToApply.assigned_to = leadsFilters.assignedTo;
          filtersToApply.stage_id = leadsFilters.stage;
          filtersToApply.business_type_id = leadsFilters.businessType;
          filtersToApply.source = leadsFilters.source;
          filtersToApply.lead_potential = leadsFilters.leadPotential;
          filtersToApply.campaign_id = leadsFilters.campaign;
          filtersToApply.lost_reason_id = leadsFilters.lostReason;
          filtersToApply.lead_score_min = leadsFilters.leadScoreMin;
          filtersToApply.lead_score_max = leadsFilters.leadScoreMax;
          filtersToApply.date_from = leadsFilters.dateFrom;
          filtersToApply.date_to = leadsFilters.dateTo;

          handleFiltersChange(filtersToApply);
          setLeadsPagination({ ...leadsPagination, currentPage: 1 });
          setRefreshKey((prev) => prev + 1);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setLeadsSearch("");
          setLeadsFilters({
            assignedTo: null,
            stage: null,
            businessType: null,
            source: null,
            leadPotential: null,
            campaign: null,
            lostReason: null,
            leadScoreMin: null,
            leadScoreMax: null,
            dateFrom: null,
            dateTo: null,
          });
          handleFiltersChange({});
          setCurrentFilters({});
          setActiveFilter("all");
        }}
      />

      {convertingLeadId && (
        <ConvertToDealModal
          show={showConvertToDealModal}
          onHide={() => {
            setShowConvertToDealModal(false);
            setConvertingLeadId(null);
          }}
          leadId={convertingLeadId}
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
            toast.success("Lead converted to deal successfully!");
          }}
        />
      )}

      {/* Add Tab Modal */}
      <Modal show={showTabModal} onHide={() => setShowTabModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Tab</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Select a stage to add as a new tab</p>
          <div
            className="d-grid gap-2"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            {stages.map((stage: any) => {
              const isAlreadyAdded = customTabs.some(
                (t) => t.id === stage.id.toString(),
              );
              const stageCount = filterCounts[stage.id] || 0;
              return (
                <Button
                  key={stage.id}
                  variant="outline-primary"
                  onClick={() => {
                    if (!isAlreadyAdded) {
                      setCustomTabs([
                        ...customTabs,
                        {
                          id: stage.id.toString(),
                          label: stage.name,
                          count: stageCount,
                          removable: true,
                        },
                      ]);
                      setShowTabModal(false);
                      toast.success("Tab added successfully!");
                    }
                  }}
                  disabled={isAlreadyAdded}
                  className="d-flex align-items-center justify-content-start"
                  style={{ textAlign: "left" }}
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
                if (!customTabs.find((t) => t.id === "lost")) {
                  setCustomTabs([
                    ...customTabs,
                    {
                      id: "lost",
                      label: "Lost",
                      count: filterCounts.lost || 0,
                      removable: true,
                    },
                  ]);
                  setShowTabModal(false);
                  toast.success("Tab added successfully!");
                }
              }}
              disabled={customTabs.some((t) => t.id === "lost")}
              className="d-flex align-items-center justify-content-start"
              style={{ textAlign: "left" }}
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
                if (!customTabs.find((t) => t.id === "deleted")) {
                  setCustomTabs([
                    ...customTabs,
                    {
                      id: "deleted",
                      label: "Deleted",
                      count: filterCounts.deleted || 0,
                      removable: true,
                    },
                  ]);
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

      {/* Add modal at the end */}
      <CreateLeadModal
        show={showCreateLeadModal}
        onHide={() => {
          setShowCreateLeadModal(false);
          setEditLeadIdForSidebar(null);
        }}
        onSuccess={() => {
          setShowCreateLeadModal(false);
          setEditLeadIdForSidebar(null);
          fetchLeads();
        }}
        type="lead"
        editLeadId={editLeadIdForSidebar}
      />
    </React.Fragment>
  );
};

CrmLeads.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmLeads;
