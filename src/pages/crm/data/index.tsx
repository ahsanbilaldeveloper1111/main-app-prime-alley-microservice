import "@assets/scss/datatable-style.scss";
import parsePhoneNumber from "libphonenumber-js";

import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  Button,
  Card,
  Row,
  Col,
  Form,
  Alert,
  Spinner,
  Modal,
  Badge,
  InputGroup,
  Dropdown,
  Table,
} from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import moment from "moment";
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
  Users,
  Calendar,
  XCircle,
  Clock as ClockIcon,
  AlertCircle as AlertCircleIcon,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Download,
  CheckSquare,
  Layers,
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  MoreVertical,
  Phone as PhoneIcon,
  Mail,
  X,
  User,
  History,
  FileText,
  Target,
} from "lucide-react";
import { Column } from "@components/CustomDataTable";

import {
  getCrmData,
  uploadCrmDataCsv,
  deleteCrmData,
  assignCrmDataAdvanced,
  getCrmDataCounts,
  bulkDeleteCrmData,
  getCrmDataTags,
  markCrmDataAsViewed,
  getCampaigns,
  scheduleCall,
  unscheduleCall,
  getCrmDataHistory,
  CrmDataItem,
  CrmDataMetrics,
  downloadExampleCsv,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import FormModal from "../../partial/FormModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import { ModuleSlug } from "@utils/Helper";
import PageSummaryGrid from "@components/PageSummaryGrid";
import DatatableActionButton from "@components/DatatableActionButton";

// KPI Card Component (from crm-new.tsx design)
interface KPICardData {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

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
  }, [phone]);

  const flagImgSrc = getFlagImgSrc(phoneNumber.countryCode);
  return (
      <Badge bg="info" className="bg-opacity-10 text-dark">
        <div className="d-flex align-items-center gap-2">
          {phoneNumber?.countryCode && <img
            src={flagImgSrc}
            alt={phoneNumber.countryCode}
          />}
          {phoneNumber.phone}
        </div>
      </Badge>
  );
};

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

// Filter Bar Component (from crm-new.tsx design)
interface FilterBarProps {
  quickFilters: {
    id: string;
    label: string;
    variant?: string;
    color?: string;
    icon?: React.ReactNode;
  }[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  searchPlaceholder?: string;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
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
          {/* Left Side: Quick Filter Buttons */}
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map((filter) => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color;

              // Determine button styles
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
                  onClick={() => onFilterChange(filter.id)}
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

          {/* Right Side: Search and Filters */}
          <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
            <InputGroup
              style={{ width: "300px", minWidth: "200px" }}
              className="flex-shrink-0"
            >
              <Form.Control
                style={{ height: "41px" }}
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    onSearch();
                  }
                }}
              />
              <Button variant="outline-secondary" onClick={onSearch}>
                <FiSearch size={16} />
              </Button>
            </InputGroup>
            <Button
              variant={showAdvancedFilters ? "primary" : "outline-secondary"}
              onClick={onToggleAdvancedFilters}
              className="d-flex align-items-center flex-shrink-0"
            >
              <FiFilter size={16} className="me-2" />
              Filters
              {advancedFilterCount > 0 && (
                <Badge bg="light" text="dark" className="ms-2">
                  {advancedFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
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

const CrmProspectsManagement = () => {
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const requestIdRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDataItem, setSelectedDataItem] = useState<CrmDataItem | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CrmDataItem | null>(null);
  const [showDataAssignmentModal, setShowDataAssignmentModal] = useState(false);
  const [showAfterCallModal, setShowAfterCallModal] = useState(false);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<readonly any[]>(
    []
  );
  const [fieldTags, setFieldTags] = useState<readonly any[]>([]);
  const [assignToCampaignUsers, setAssignToCampaignUsers] = useState(false);

  // Data assignment modal states
  const [assignmentFilters, setAssignmentFilters] = useState({
    selectedTags: [] as readonly any[],
    selectedCampaigns: [] as readonly any[],
  });
  const [assignmentCampaign, setAssignmentCampaign] = useState<readonly any[]>(
    []
  );
  const [assignmentDistribution, setAssignmentDistribution] = useState<
    "equal" | "custom"
  >("equal");
  const [totalEntriesToAssign, setTotalEntriesToAssign] = useState(0);
  const [customDistribution, setCustomDistribution] = useState<
    Record<string, number>
  >({});
  const [assignmentCounts, setAssignmentCounts] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
  });
  const [availableTags, setAvailableTags] = useState<
    Array<{
      value: string;
      label: string;
      id: number;
    }>
  >([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<
    Array<{
      value: string;
      label: string;
      id: number;
    }>
  >([]);
  const [campaignsById, setCampaignsById] = useState<Record<number, string>>(
    {}
  );
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // After Call modal states
  const [afterCallData, setAfterCallData] = useState({
    disposition: "",
    callStatus: "",
    comment: "",
    nextCallDate: "",
    nextCallTime: "",
    generateLead: "no", // "yes" or "no"
  });

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEntryForSchedule, setSelectedEntryForSchedule] =
    useState<any>(null);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    notes: "",
  });

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [showProspectsAnalytics, setShowProspectsAnalytics] = useState(false);
  const [showAllProspectStats, setShowAllProspectStats] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [prospectsSearch, setProspectsSearch] = useState("");
  const [prospectsFilters, setProspectsFilters] = useState({
    assignedTo: null as string | null,
    campaigns: null as string[] | null,
    nextCallScheduled: null as string | null,
    nextCallDateFrom: null as string | null,
    nextCallDateTo: null as string | null,
    sourceFile: null as string | null,
    tags: null as string[] | null,
  });

  // Column customization and pagination states
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("crmDataSelectedColumns");
    return saved
      ? JSON.parse(saved)
      : [
          "name",
          "phone",
          "source",
          "user_extension",
          "campaign",
          "last_called_at",
          "last_call_end_reason",
          "disposition",
          "scheduled_call_at",
          "tags",
        ];
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [dataList, setDataList] = useState<CrmDataItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<CrmDataMetrics>({
    assigned_records: 0,
    unassigned_records: 0,
    scheduled_records: 0,
    not_scheduled_records: 0,
    scheduled_next_hour_records: 0,
    scheduled_next_24_hours_records: 0,
  });

  // Static tags data
  const staticTags = [
    { value: "hot-lead", label: "Hot Lead" },
    { value: "cold-lead", label: "Cold Lead" },
    { value: "follow-up", label: "Follow Up" },
    { value: "interested", label: "Interested" },
    { value: "not-interested", label: "Not Interested" },
    { value: "callback", label: "Callback" },
    { value: "qualified", label: "Qualified" },
    { value: "unqualified", label: "Unqualified" },
  ];

  // Static call end reasons
  const callEndReasons = [
    { value: "call_later", label: "Call Later", color: "warning" },
    { value: "dont_call", label: "Don't Call", color: "danger" },
    {
      value: "not_reachable",
      label: "Number Not Reachable",
      color: "secondary",
    },
    { value: "dncr_blocklisted", label: "DNCR Blocklisted", color: "dark" },
    { value: "answered", label: "Answered", color: "success" },
    { value: "busy", label: "Busy", color: "info" },
    { value: "no_answer", label: "No Answer", color: "light" },
  ];

  // Static call history data with varied information
  const getCallHistory = (entryId: number) => {
    const histories = [
      {
        id: 1,
        duration: "2:34",
        endReason: "answered",
        disposition: "interested",
        calledAt: "2024-01-15T10:30:00Z",
        recordingUrl: "https://example.com/recording1.mp3",
        comment:
          "Client showed interest in our premium package. Asked for pricing details and wants to schedule a demo next week.",
      },
      {
        id: 2,
        duration: "0:45",
        endReason: "busy",
        disposition: "callback_requested",
        calledAt: "2024-01-14T14:20:00Z",
        recordingUrl: "https://example.com/recording2.mp3",
        comment:
          "Line was busy. Left voicemail with callback request for tomorrow morning.",
      },
      {
        id: 3,
        duration: "1:12",
        endReason: "no_answer",
        disposition: "no_answer",
        calledAt: "2024-01-13T09:15:00Z",
        recordingUrl: "https://example.com/recording3.mp3",
        comment:
          "No answer after multiple rings. Will try again later in the day.",
      },
      {
        id: 4,
        duration: "3:45",
        endReason: "answered",
        disposition: "not_interested",
        calledAt: "2024-01-12T16:20:00Z",
        recordingUrl: "https://example.com/recording4.mp3",
        comment:
          "Client politely declined. Not interested in our services at this time. Asked to be removed from calling list.",
      },
      {
        id: 5,
        duration: "4:12",
        endReason: "answered",
        disposition: "follow_up",
        calledAt: "2024-01-11T11:30:00Z",
        recordingUrl: "https://example.com/recording5.mp3",
        comment:
          "Client needs to discuss with their team. Will follow up in 2 weeks with additional information about our enterprise solutions.",
      },
    ];

    // Return different histories based on entryId for variety
    return histories.slice(0, (entryId % 3) + 2);
  };

  // History data state
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  });

  // Function to fetch campaigns by IDs
  const fetchCampaignsByIds = useCallback(async (campaignIds: number[]) => {
    try {
      const campaignsMap: Record<number, string> = {};

      // Fetch campaigns in batches to avoid overwhelming the API
      const batchSize = 50;
      for (let i = 0; i < campaignIds.length; i += batchSize) {
        const batch = campaignIds.slice(i, i + batchSize);
        const campaignsResponse = await getCampaigns({
          per_page: 1000,
          filters: { ids: batch },
          module_slug: ModuleSlug.CRM_CAMPAIGNS,
        });

        campaignsResponse.data.forEach((campaign) => {
          campaignsMap[campaign.id] = campaign.name;
        });
      }

      setCampaignsById((prev) => ({ ...prev, ...campaignsMap }));
      return campaignsMap;
    } catch (error) {
      console.error("Failed to fetch campaigns by IDs:", error);
      return {};
    }
  }, []);

  // Fetch history data
  const fetchHistoryData = useCallback(
    async (page: number = 1) => {
      try {
        setHistoryLoading(true);
        const response = await getCrmDataHistory(page, 15);
        console.log("ZE HISTORY DATA", response);
        setHistoryData(response.data);
        setHistoryPagination(response.pagination);

        // Extract campaign IDs from history data and fetch campaign names
        const campaignIds: number[] = [];
        response.data.forEach((activity: any) => {
          if (activity.details?.campaign_ids) {
            campaignIds.push(...activity.details.campaign_ids);
          }
        });

        if (campaignIds.length > 0) {
          const uniqueCampaignIds = Array.from(new Set(campaignIds));
          await fetchCampaignsByIds(uniqueCampaignIds);
        }
      } catch (error) {
        console.error("Failed to fetch history data:", error);
        setHistoryData([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [fetchCampaignsByIds]
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

  // Extract unique source_file values from dataList for creatable select
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    dataList.forEach((item: any) => {
      if (item.source_file && item.source_file.trim()) {
        sources.add(item.source_file.trim());
      }
    });
    return Array.from(sources).sort().map((source) => ({
      value: source,
      label: source,
    }));
  }, [dataList]);

  // Fetch extensions data
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(
          ModuleSlug.CRM_DATA_MANAGEMENT
        );
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };
    fetchExtensions();
  }, []);

  function getNameByExtension(extension: string) {
    const extensionData = extensions.find((ext) => ext.id === extension);
    return extensionData?.display_name || extensionData?.name || extension;
  }

  // Load history data when modal is opened
  useEffect(() => {
    if (showHistoryModal) {
      fetchHistoryData();
    }
  }, [showHistoryModal, fetchHistoryData]);

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getCrmDataTags();
        const tagOptions = tags.map((tag) => ({
          value: tag.name,
          label: tag.name,
          id: tag.id,
        }));
        setAvailableTags(tagOptions);
      } catch (error) {
        console.error("Failed to load tags:", error);
        // Fallback to static tags
        setAvailableTags(
          staticTags.map((tag) => ({
            value: tag.value,
            label: tag.label,
            id: parseInt(tag.value.replace("tag-", "")) || 0,
          }))
        );
      }
    };
    loadTags();
  }, [refreshKey]);

  // Load available campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const campaignsResponse = await getCampaigns({ per_page: 1000 });
        const campaignOptions = campaignsResponse.data.map((campaign) => ({
          value: campaign.id.toString(),
          label: campaign.name,
          id: campaign.id,
        }));
        setAvailableCampaigns(campaignOptions);

        // Also populate the campaignsById map
        const campaignsMap: Record<number, string> = {};
        campaignsResponse.data.forEach((campaign) => {
          campaignsMap[campaign.id] = campaign.name;
        });
        setCampaignsById(campaignsMap);
      } catch (error) {
        console.error("Failed to load campaigns:", error);
        // Fallback to empty array
        setAvailableCampaigns([]);
      }
    };
    loadCampaigns();
  }, [refreshKey]);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Handle activeFilter changes to update currentFilters
  useEffect(() => {
    if (activeFilter === "all") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_scheduled_calls;
        delete newFilters.has_tickets;
        return newFilters;
      });
    } else if (activeFilter === "scheduled") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_tickets;
        newFilters.has_scheduled_calls = true;
        return newFilters;
      });
    } else if (activeFilter === "has_leads") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_scheduled_calls;
        newFilters.has_tickets = true;
        return newFilters;
      });
    }
    // Don't reset pagination here - it's already reset in onFilterChange
  }, [activeFilter]);

  // Helper functions for sorting and pagination
  const handleSort = (column: string) => {
    const newDirection =
      pagination.sortColumn === column && pagination.sortDirection === "asc"
        ? "desc"
        : "asc";
    setPagination({
      ...pagination,
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

  const renderSortIcon = (column: string) => {
    if (pagination.sortColumn !== column) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return pagination.sortDirection === "asc" ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };

  const renderPaginationControls = () => {
    const totalPages = getTotalPages(totalRecords, pagination.rowsPerPage);
    const { currentPage, rowsPerPage } = pagination;
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, totalRecords);

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Show</span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) =>
              setPagination({
                ...pagination,
                rowsPerPage: Number(e.target.value),
                currentPage: 1,
              })
            }
            style={{ width: "auto" }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
          <span className="text-muted small">entries</span>
        </div>

        <div className="text-muted small">
          Showing {startRow} to {endRow} of {totalRecords} prospects
        </div>

        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPagination({ ...pagination, currentPage: 1 })}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() =>
              setPagination({ ...pagination, currentPage: currentPage - 1 })
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
                    setPagination({ ...pagination, currentPage: pageNum })
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
              setPagination({ ...pagination, currentPage: currentPage + 1 })
            }
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPagination({ ...pagination, currentPage: totalPages })
            }
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    );
  };

  // Fetch prospects data
  const fetchCrmData = useCallback(async () => {
    // Increment request ID to track the latest request
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setLoading(true);
    try {
      const params: any = {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
      };

      if (memoizedFilters.search) {
        params.search = memoizedFilters.search;
      }

      if (
        memoizedFilters.campaign_id &&
        memoizedFilters.campaign_id.length > 0
      ) {
        params.campaign_ids = memoizedFilters.campaign_id;
      }

      if (memoizedFilters.tags && memoizedFilters.tags.length > 0) {
        params.tags = memoizedFilters.tags;
      }

      if (memoizedFilters.assignment_status) {
        params.assignment_status = memoizedFilters.assignment_status;
      }

      if (
        memoizedFilters.user_extension &&
        memoizedFilters.user_extension.length > 0
      ) {
        params.user_extensions = memoizedFilters.user_extension;
      }

      if (
        memoizedFilters.is_viewed !== undefined &&
        memoizedFilters.is_viewed !== ""
      ) {
        params.is_viewed = memoizedFilters.is_viewed;
      }

      if (memoizedFilters.start_date) {
        params.date_from = memoizedFilters.start_date;
      }

      if (memoizedFilters.end_date) {
        params.date_to = memoizedFilters.end_date;
      }

      if (memoizedFilters.has_scheduled_calls !== undefined) {
        params.has_scheduled_calls = memoizedFilters.has_scheduled_calls;
      }

      if (memoizedFilters.has_tickets !== undefined) {
        params.has_tickets = memoizedFilters.has_tickets;
      }

      if (memoizedFilters.scheduled_call_status) {
        params.scheduled_call_status = memoizedFilters.scheduled_call_status;
      }

      if (memoizedFilters.scheduled_call_from) {
        params.scheduled_call_from = memoizedFilters.scheduled_call_from;
      }

      if (memoizedFilters.scheduled_call_to) {
        params.scheduled_call_to = memoizedFilters.scheduled_call_to;
      }

      if (memoizedFilters.source_file) {
        params.source_file = memoizedFilters.source_file;
      }

      if (memoizedFilters.tag_ids && memoizedFilters.tag_ids.length > 0) {
        params.tag_ids = memoizedFilters.tag_ids;
      }

      params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;

      const response = await getCrmData(params);

      // Only update state if this is still the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setDataList(response.data || []);
      setTotalRecords(response.pagination.total || 0);
      setMetrics(
        response.metrics || {
          assigned_records: 0,
          unassigned_records: 0,
          scheduled_records: 0,
          not_scheduled_records: 0,
          scheduled_next_hour_records: 0,
          scheduled_next_24_hours_records: 0,
        }
      );
    } catch (error: any) {
      // Only handle error if this is still the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      console.error("Failed to fetch CRM data:", error);
      setDataList([]);
      setTotalRecords(0);
    } finally {
      // Only set loading to false if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [memoizedFilters, pagination]);

  // Load data when filters or pagination changes
  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData, refreshKey]);

  // Save selected columns to localStorage
  useEffect(() => {
    localStorage.setItem(
      "crmDataSelectedColumns",
      JSON.stringify(selectedColumns)
    );
  }, [selectedColumns]);

  // CSV validation function
  const validateCsvFile = (
    file: File
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check file type
    if (
      !file.type.includes("csv") &&
      !file.name.toLowerCase().endsWith(".csv")
    ) {
      errors.push("File must be a CSV file");
    }

    // Check file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      errors.push("File size must be less than 2MB");
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push("File cannot be empty");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validation = validateCsvFile(file);

    if (validation.isValid) {
      setSelectedFile(file);
    } else {
      validation.errors.forEach((error) => toast.error(error));
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Upload CSV file
  const handleUpload = async () => {
    if (!session?.user?.permissions?.includes("add-crm-data-management")) {
      toast.error("You don't have permission to upload data");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Extract tag values from selected options
      const tagValues = Array.from(fieldTags).map((tag) => tag.value);

      const response: any = await uploadCrmDataCsv(
        selectedFile,
        [], // No campaigns selected
        tagValues,
        true // No auto-assignment
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Parse response
      const responseData = response?.data || {};
      const processedCount = responseData.processed_count || 0;
      const validationFailures = responseData.validation_failures || 0;
      // const errors = responseData.errors || [];
      const message = responseData.message || "Upload completed";

      // Show error messages for validation failures
      // if (errors.length > 0) {
      //   errors.forEach((error: string) => {
      //     toast.warn(error);
      //   });
      // }

      // Show success message
      if (processedCount > 0) {
        let successMessage = `Successfully processed ${processedCount} record${
          processedCount !== 1 ? "s" : ""
        }`;

        if (validationFailures > 0) {
          successMessage += ` with ${validationFailures} validation failure${
            validationFailures !== 1 ? "s" : ""
          }`;
        }

        setSuccessModalTitle("Upload Successful");
        setSuccessModalDescription(successMessage);
        setShowSuccessfulModal(true);
      } else if (validationFailures > 0) {
        // All records failed validation
        toast.error(
          `Upload failed: All ${validationFailures} record${
            validationFailures !== 1 ? "s" : ""
          } failed validation`
        );
      } else {
        toast.error("Upload completed but no prospects were processed");
      }

      setSelectedFile(null);
      setFieldTags([]);
      setShowUploadModal(false);
      setUploadProgress(0);

      // Refresh data
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload file. Please try again.";
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Handle view data item
  const handleViewData = useCallback((item: CrmDataItem) => {
    setSelectedDataItem(item);
    setShowViewModal(true);
  }, []);

  // Handle delete data item
  const handleDeleteData = useCallback((item: CrmDataItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await deleteCrmData(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Delete error:", error);
    }
  }, [itemToDelete]);

  // Calculate filtered entry counts using API
  const calculateEntryCounts = useCallback(async () => {
    try {
      const campaignIds = Array.from(assignmentFilters.selectedCampaigns).map(
        (campaign) => parseInt(campaign.value)
      );
      const tags = Array.from(assignmentFilters.selectedTags).map(
        (tag) => tag.value
      );

      const counts = await getCrmDataCounts(campaignIds, tags);

      return {
        total: counts.summary.total_records,
        assigned: counts.summary.assigned_records,
        unassigned: counts.summary.unassigned_records,
      };
    } catch (error) {
      console.error("Failed to get entry counts:", error);
      // Fallback to static data
      return {
        total: 5000,
        assigned: 2000,
        unassigned: 3000,
      };
    }
  }, [assignmentFilters]);

  // Auto-refetch counts when filter dropdowns change
  useEffect(() => {
    const refetchCounts = async () => {
      if (
        assignmentFilters.selectedCampaigns.length > 0 ||
        assignmentFilters.selectedTags.length > 0
      ) {
        try {
          const counts = await calculateEntryCounts();
          setAssignmentCounts(counts);
          setTotalEntriesToAssign(counts.unassigned);
        } catch (error) {
          console.error("Failed to refetch counts:", error);
        }
      }
    };

    refetchCounts();
  }, [
    assignmentFilters.selectedCampaigns,
    assignmentFilters.selectedTags,
    calculateEntryCounts,
  ]);

  // Handle data assignment
  const handleDataAssignment = useCallback(async () => {
    try {
      const counts = await calculateEntryCounts();
      setAssignmentCounts(counts);
      setTotalEntriesToAssign(counts.unassigned);
      setShowDataAssignmentModal(true);
    } catch (error) {
      console.error("Failed to get entry counts:", error);
      // Fallback to static data
      setAssignmentCounts({ total: 5000, assigned: 2000, unassigned: 3000 });
      setTotalEntriesToAssign(3000);
      setShowDataAssignmentModal(true);
    }
  }, [calculateEntryCounts]);

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  // Handle data assignment directly (no second dialog)
  const handleDataAssignmentSubmit = useCallback(async () => {
    if (assignmentCampaign.length === 0) {
      toast.error("Please select at least one campaign to assign entries to");
      return;
    }

    if (totalEntriesToAssign === 0) {
      toast.error("Please specify how many entries to assign");
      return;
    }

    // Validate custom distribution if in custom mode
    if (assignmentDistribution === "custom") {
      const totalCustomAllocation = Object.values(customDistribution).reduce(
        (sum, count) => sum + count,
        0
      );
      if (totalCustomAllocation !== totalEntriesToAssign) {
        toast.error(
          `Custom allocation must equal total entries to assign (${totalEntriesToAssign}). Current total: ${totalCustomAllocation}`
        );
        return;
      }
    }

    try {
      const campaignFilterIds = Array.from(
        assignmentFilters.selectedCampaigns
      ).map((campaign) => parseInt(campaign.value));
      console.log(assignmentFilters.selectedTags, "ZEZA");
      const tagIds = Array.from(assignmentFilters.selectedTags).map((tag) =>
        parseInt(tag.id)
      );

      const campaignIds = Array.from(assignmentCampaign).map((campaign) =>
        parseInt(campaign.value)
      );

      let result;

      if (assignmentDistribution === "equal") {
        // Equal distribution - single API call
        result = await assignCrmDataAdvanced(
          campaignIds,
          totalEntriesToAssign,
          campaignFilterIds,
          tagIds,
          "equal"
        );
      } else {
        // Custom distribution - single API call with campaign distribution
        const campaignDistribution: Record<number, number> = {};
        Array.from(assignmentCampaign).forEach((campaign: any) => {
          const campaignId = parseInt(campaign.value);
          const countForThisCampaign = customDistribution[campaign.value] || 0;
          if (countForThisCampaign > 0) {
            campaignDistribution[campaignId] = countForThisCampaign;
          }
        });

        result = await assignCrmDataAdvanced(
          campaignIds,
          totalEntriesToAssign,
          campaignFilterIds,
          tagIds,
          "custom",
          campaignDistribution
        );
      }

      console.log("Assignment result:", result);

      // Close modal and reset state
      setShowDataAssignmentModal(false);
      setAssignmentFilters({
        selectedTags: [],
        selectedCampaigns: [],
      });
      setAssignmentCampaign([]);
      setAssignmentDistribution("equal");
      setTotalEntriesToAssign(0);
      setCustomDistribution({});

      setShowSuccessfulModal(true);
      setSuccessModalTitle("Data Assignment Successful!");
      setSuccessModalDescription("The data has been successfully assigned.");

      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Assign error:", error);
    }
  }, [
    assignmentCampaign,
    totalEntriesToAssign,
    assignmentFilters,
    assignmentDistribution,
    customDistribution,
  ]);

  // Handle mark as viewed
  const handleMarkAsViewed = useCallback(async (item: CrmDataItem) => {
    try {
      await markCrmDataAsViewed(item.id);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Mark as viewed error:", error);
    }
  }, []);

  // Handle call actions
  const handleCallAction = useCallback((action: string, item: CrmDataItem) => {
    const phone = item.phone;
    if (!phone) {
      toast.error("No phone number available for this entry");
      return;
    }

    switch (action) {
      case "whatsapp":
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
        break;
      case "phone":
        window.open(`tel:${phone}`, "_self");
        break;
      case "sms":
        window.open(`sms:${phone}`, "_self");
        break;
      case "facebook":
        toast.info("Facebook calling feature coming soon");
        break;
      case "telegram":
        toast.info("Telegram calling feature coming soon");
        break;
      case "skype":
        toast.info("Skype calling feature coming soon");
        break;
      default:
        toast.error("Unknown action");
    }
  }, []);

  // Handle call button click
  const handleCallClick = useCallback((item: CrmDataItem) => {
    const phone = item.phone;
    if (!phone) {
      toast.error("No phone number available for this entry");
      return;
    }
    window.location.href = `tel://${phone}`;
  }, []);

  // Handle recording playback
  const handlePlayRecording = useCallback((recordingUrl: string) => {
    // In a real app, this would open the recording player
    toast.info(`Playing recording: ${recordingUrl}`);
    console.log("Playing recording:", recordingUrl);
  }, []);

  // Handle data assignment modal close
  const handleDataAssignmentModalClose = useCallback(() => {
    setShowDataAssignmentModal(false);
    setAssignmentFilters({
      selectedTags: [],
      selectedCampaigns: [],
    });
    setAssignmentCampaign([]);
    setAssignmentDistribution("equal");
    setTotalEntriesToAssign(0);
    setCustomDistribution({});
  }, []);

  // After Call modal handlers
  const handleAfterCallModalClose = useCallback(() => {
    setShowAfterCallModal(false);
    setAfterCallData({
      disposition: "",
      callStatus: "",
      comment: "",
      nextCallDate: "",
      nextCallTime: "",
      generateLead: "no",
    });
  }, []);

  const handleAfterCallSubmit = useCallback(() => {
    if (!afterCallData.disposition) {
      toast.error("Please select a disposition");
      return;
    }
    if (!afterCallData.callStatus) {
      toast.error("Please select a call status");
      return;
    }
    if (!afterCallData.comment.trim()) {
      toast.error("Please add a comment");
      return;
    }
    if (!afterCallData.generateLead) {
      toast.error("Please select whether to generate a lead");
      return;
    }

    // Close the dialog
    handleAfterCallModalClose();

    // If lead generation is selected, redirect to create lead page with prospect data
    if (afterCallData.generateLead === "yes" && selectedDataItem) {
      // Show success message and navigate to create lead page
      toast.success(
        "Redirecting to create lead page with pre-filled prospect data..."
      );
      window.location.href = `/crm/leads/create?crm_data_id=${selectedDataItem.id}`;
    } else {
      toast.success("After call data saved successfully! No lead generated.");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("After Call Successful!");
      setSuccessModalDescription(
        "The after call data has been successfully saved."
      );
    }
  }, [afterCallData, selectedDataItem, handleAfterCallModalClose]);

  // Schedule/Unschedule call handlers
  const handleScheduleCall = useCallback((entry: any) => {
    setSelectedEntryForSchedule(entry);
    setScheduleData({
      date: "",
      time: "",
      notes: "",
    });
    setShowScheduleModal(true);
  }, []);

  const handleUnscheduleCall = useCallback(
    async (entry: any) => {
      try {
        const userExtension = (session?.user as any)?.extension || "default";
        await unscheduleCall(entry.id, userExtension);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to unschedule call:", error);
      }
    },
    [session]
  );

  // Schedule modal handlers
  const handleScheduleModalClose = useCallback(() => {
    setShowScheduleModal(false);
    setSelectedEntryForSchedule(null);
    setScheduleData({
      date: "",
      time: "",
      notes: "",
    });
  }, []);

  const handleScheduleSubmit = useCallback(async () => {
    if (!scheduleData.date) {
      toast.error("Please select a date");
      return;
    }
    if (!scheduleData.time) {
      toast.error("Please select a time");
      return;
    }

    try {
      const userExtension = (session?.user as any)?.extension || "default";
      const scheduledDateTime = moment(
        `${scheduleData.date} ${scheduleData.time}`
      ).toISOString();

      await scheduleCall(
        selectedEntryForSchedule.id,
        scheduledDateTime,
        userExtension,
        scheduleData.notes
      );
      setRefreshKey((prev) => prev + 1);
      handleScheduleModalClose();
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Schedule Call Successful!");
      setSuccessModalDescription("The call has been successfully scheduled.");
    } catch (error) {
      console.error("Failed to schedule call:", error);
    }
  }, [
    scheduleData,
    selectedEntryForSchedule,
    handleScheduleModalClose,
    session,
  ]);

  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to delete");
      return;
    }

    try {
      await bulkDeleteCrmData(selectedItems);
      setShowBulkDeleteModal(false);
      setRefreshKey((prev) => prev + 1);
      setSelectedItems([]);
      setClearSelectedRows(!clearSelectedRows);
    } catch (error: any) {
      console.error("Bulk delete error:", error);
    }
  }, [selectedItems]);

  // Handle item selection
  const handleItemSelection = useCallback((selected: CrmDataItem[]) => {
    setSelectedItems(selected.map((item) => item.id));
  }, []);

  // Define columns for GenericListPage
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.name ? (
              <span className="text-muted">{props.name}</span>
            ) : (
              <span className="text-muted">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "phone",
        name: "Phone",
        selector: (row: any) => row.phone,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.phone ? (
              <span className="status-badge info">{props.phone}</span>
            ) : (
              <span className="status-badge info">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "source",
        name: "Source",
        selector: (row: any) => row.source_file,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.source_file ? (
              <span className="status-badge secondary">{props.source_file}</span>
            ) : (
              <span className="text-muted">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "user_extension",
        name: "Assigned To",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.user_extension ? (
              <span className="status-badge success">
                {extensions.find(
                  (extension: any) =>
                    extension.id.toString() === props.user_extension?.toString()
                )?.display_name || props.user_extension}
              </span>
            ) : (
              <span className="status-badge default">Unassigned</span>
            )}
          </div>
        ),
      },
      {
        key: "campaign",
        name: "Campaign",
        selector: (row: any) => row.campaign_id,
        sortable: true,
        cell: (props: any) => {
          return (
            <div>
              {props?.campaign ? (
                <span className="status-badge primary">
                  {props.campaign?.name}
                </span>
              ) : (
                <span className="status-badge info">No Campaign</span>
              )}
            </div>
          );
        },
      },
      {
        key: "last_called_at",
        name: "Last Called",
        selector: (row: any) => row.last_called_at,
        sortable: true,
        cell: (props: any) => {
          // Generate random date within last week
          const now = moment();
          const oneWeekAgo = moment().subtract(7, "days");
          const randomDays = Math.floor(Math.random() * 7);
          const randomHours = Math.floor(Math.random() * 24);
          const randomMinutes = Math.floor(Math.random() * 60);

          const lastCalled = oneWeekAgo
            .add(randomDays, "days")
            .add(randomHours, "hours")
            .add(randomMinutes, "minutes")
            .toISOString();

          return (
            <div className="d-flex align-items-center">
              <span className="">
                {moment(lastCalled).format("MMM DD, HH:mm")}
              </span>
            </div>
          );
        },
      },
      {
        key: "last_call_end_reason",
        name: "Last Call Status",
        selector: (row: any) => row.last_call_end_reason,
        sortable: true,
        cell: (props: any) => {
          // Static data for now
          const endReason =
            callEndReasons.find((r) => r.value === "answered") ||
            callEndReasons[0];
          return (
            <span className={`status-badge ${endReason.color as any}`}>
              {endReason.label}
            </span>
          );
        },
      },
      {
        key: "disposition",
        name: "Disposition",
        selector: (row: any) => row.disposition,
        sortable: true,
        cell: (props: any) => {
          // Static disposition data for now
          const dispositions = [
            { value: "interested", label: "Interested", color: "success" },
            {
              value: "not_interested",
              label: "Not Interested",
              color: "danger",
            },
            {
              value: "callback_requested",
              label: "Callback Requested",
              color: "warning",
            },
            { value: "no_answer", label: "No Answer", color: "warning" },
            { value: "busy", label: "Busy", color: "info" },
            { value: "do_not_call", label: "Do Not Call", color: "danger" },
            { value: "wrong_number", label: "Wrong Number", color: "info" },
            { value: "follow_up", label: "Follow Up", color: "primary" },
          ];

          // Randomly select a disposition for demo purposes
          const randomDisposition =
            dispositions[Math.floor(Math.random() * dispositions.length)];

          return (
            <span className={`status-badge ${randomDisposition.color as any}`}>
              {randomDisposition.label}
            </span>
          );
        },
      },
      {
        key: "scheduled_call_at",
        name: "Next Call",
        selector: (row: any) => row.scheduled_call_at,
        sortable: true,
        cell: (props: any) => {
          if (!props.scheduled_call_at) {
            return <span className="status-badge info">Not scheduled</span>;
          }

          const isOverdue = moment(props.scheduled_call_at).isBefore(moment());
          const isNextHour = moment(props.scheduled_call_at).isBefore(
            moment().add(1, "hour")
          );

          return (
            <div className="d-flex align-items-center">
              <span
                className={`status-badge ${
                  isOverdue ? "danger" : isNextHour ? "warning" : ""
                }`}
              >
                {moment(props.scheduled_call_at).format("MMM DD, HH:mm")}
                {isOverdue && <span className="ms-1 fw-bold">(Overdue)</span>}
                {isNextHour && !isOverdue && (
                  <span className="ms-1 fw-bold">(Soon)</span>
                )}
              </span>
            </div>
          );
        },
      },

      ...(session?.user?.permissions?.includes("view-crm-data-management")
        ? [
            {
              key: "view_action",
              name: "View",
              selector: (row: any) => row.id,
              sortable: false,
              cell: (props: any) => (
                <Button
                  variant="primary"
                  className="app-button"
                  size="sm"
                  onClick={() => handleViewData(props)}
                  title="View Details"
                >
                  <FiEye size={14} />
                </Button>
              ),
            },
          ]
        : []),

      {
        key: "call_action",
        name: "Call",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex gap-1">
            {session?.user?.permissions?.includes(
              "call-service-crm-data-management"
            ) && (
              <Button
                variant="success"
                className="app-button"
                size="sm"
                onClick={() => handleCallClick(props)}
                title="Call Now"
              >
                <FiPhone size={14} />
              </Button>
            )}

            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                className="app-button"
                id={`dropdown-${props.id}`}
              >
                <FiMoreVertical size={14} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {session?.user?.permissions?.includes(
                  "call-service-crm-data-management"
                )  && (
                  <>
                    {props.scheduled_call_at ? (
                      <Dropdown.Item
                        onClick={() => handleUnscheduleCall(props)}
                      >
                        <FiX size={14} className="me-2" />
                        Unschedule Call
                      </Dropdown.Item>
                    ) : (
                      <Dropdown.Item onClick={() => handleScheduleCall(props)}>
                        <FiCalendar size={14} className="me-2" />
                        Schedule Call
                      </Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                  </>
                )}
                <Dropdown.Item
                  onClick={() => {
                    window.location.href = `/crm/leads/create?crm_data_id=${props.id}`;
                  }}
                >
                  <FiTarget size={14} className="me-2" />
                  Convert to Lead
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        ),
      },

      {
        key: "tags",
        name: "Tags",
        selector: (row: any) => row.tags,
        sortable: false,
        cell: (props: any) => {
          // Show hardcoded tags for now
          const tags = props.tags;
          return (
            <div className="d-flex flex-wrap gap-1">
              {tags?.map((tag: any, index: any) => (
                <span key={index} className="status-badge info">
                  {tag.name}
                </span>
              ))}
            </div>
          );
        },
      },
      // {
      //   key: "delete_action",
      //   name: "Delete",
      //   selector: (row: any) => row.id,
      //   sortable: false,
      //   cell: (props: any) => (
      //     <Button
      //       variant="danger"
      //       className="app-button"
      //       size="sm"
      //       onClick={() => handleDeleteData(props)}
      //       title="Delete Entry"
      //     >
      //       <FiTrash2 size={14} />
      //     </Button>
      //   ),
      // },
    ],
    [
      handleViewData,
      handleMarkAsViewed,
      handleDeleteData,
      handleCallAction,
      handleCallClick,
      handlePlayRecording,
      extensions,
      availableCampaigns,
      callEndReasons,
      handleScheduleCall,
      handleUnscheduleCall,
    ]
  );

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
      `,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Prospects"
      />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Prospects</h2>
          <p className="text-muted mb-0">
          Upload, manage, call, schedule, and convert your prospects into leads.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button
            variant={showProspectsAnalytics ? "primary" : "outline-secondary"}
            onClick={() => setShowProspectsAnalytics(!showProspectsAnalytics)}
          >
            <FiDatabase size={16} className="me-2" />
            {showProspectsAnalytics ? "Hide Analytics" : "Show Analytics"}
          </Button>

          {session?.user?.permissions?.includes("add-crm-data-management") && (
            <Button
              variant="outline-primary"
              onClick={() => setShowUploadModal(true)}
            >
              <Download size={16} className="me-2" />
              Upload CSV
            </Button>
          )}
        </div>
      </div>

      <div className="container-fluid">
        {/* Analytics Section - Collapsible */}
        {showProspectsAnalytics && (
          <>
            {/* Summary Stats Grid - Using KPICard design */}
            <Row className="mb-2">
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard
                  title="Total Prospects"
                  value={totalRecords}
                  icon={<Users size={24} />}
                  color="primary"
                />
              </Col>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard
                  title="Prospects with Calls Scheduled"
                  value={metrics.scheduled_records}
                  icon={<Calendar size={24} />}
                  color="success"
                />
              </Col>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard
                  title="Prospects with No Calls Scheduled"
                  value={metrics.not_scheduled_records}
                  icon={<XCircle size={24} />}
                  color="secondary"
                />
              </Col>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard
                  title="Meetings in Next Hour"
                  value={metrics.scheduled_next_hour_records}
                  icon={<ClockIcon size={24} />}
                  color="info"
                />
              </Col>
              {showAllProspectStats && (
                <>
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard
                      title="Meetings in Next 24h"
                      value={metrics.scheduled_next_24_hours_records}
                      icon={<Calendar size={24} />}
                      color="warning"
                    />
                  </Col>

                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard
                      title=" Prospects Assigned to Team Members"
                      value={metrics.assigned_records}
                      icon={<UserPlus size={24} />}
                      color="primary"
                    />
                  </Col>
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard
                      title="Prospects Not Assigned to Team Members"
                      value={metrics.unassigned_records}
                      icon={<AlertCircleIcon size={24} />}
                      color="warning"
                    />
                  </Col>
                </>
              )}
            </Row>

            <div className="text-center mb-4">
              <Button
                variant="link"
                onClick={() => setShowAllProspectStats(!showAllProspectStats)}
                className="text-decoration-none"
              >
                {showAllProspectStats ? (
                  <>
                    <ArrowUp size={16} className="me-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ArrowDown size={16} className="me-1" />
                    Show More Stats
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Filter Bar */}
        {session?.user?.permissions?.includes("list-crm-data-management") && (
          <FilterBar
            quickFilters={[
              {
                id: "all",
                label: "All Prospects",
                color: "#0d6efd",
                icon: <Users size={16} />,
              },
              {
                id: "scheduled",
                label: "Scheduled",
                color: "#20c997",
                icon: <FiCalendar size={16} />,
              },
              {
                id: "has_leads",
                label: "Converted to Leads",
                color: "#0dcaf0",
                icon: <FiTarget size={16} />,
              },
            ]}
            activeFilter={activeFilter}
            onFilterChange={(filterId) => {
              setActiveFilter(filterId);
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
            }}
            searchValue={prospectsSearch}
            onSearchChange={(value) => {
              setProspectsSearch(value);
            }}
            onSearch={() =>
              handleFiltersChange({
                ...currentFilters,
                search: prospectsSearch,
              })
            }
            searchPlaceholder="Search by name or phone..."
            showAdvancedFilters={showAdvancedFilters}
            onToggleAdvancedFilters={() =>
              setShowAdvancedFilters(!showAdvancedFilters)
            }
            advancedFilterCount={
              (prospectsFilters.assignedTo !== null ? 1 : 0) +
              (prospectsFilters.campaigns !== null &&
              prospectsFilters.campaigns.length > 0
                ? 1
                : 0) +
              (prospectsFilters.nextCallScheduled !== null ? 1 : 0) +
              (prospectsFilters.sourceFile !== null ? 1 : 0) +
              (prospectsFilters.tags !== null &&
              prospectsFilters.tags.length > 0
                ? 1
                : 0)
            }
          />
        )}

        {/* Advanced Filters */}
        {showAdvancedFilters &&
          session?.user?.permissions?.includes("list-crm-data-management") && (
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
                        prospectsFilters.assignedTo
                          ? (() => {
                              const assignedToId = prospectsFilters.assignedTo;
                              const ext = extensions.find(
                                (e: any) =>
                                  (e.id || e.extension) === assignedToId
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
                        const assignedToValue = selected
                          ? selected.value
                          : null;
                        setProspectsFilters((prev) => ({
                          ...prev,
                          assignedTo: assignedToValue,
                        }));
                        // Update currentFilters for API call
                        const newFilters = { ...currentFilters };
                        if (assignedToValue) {
                          newFilters.user_extension = [assignedToValue];
                        } else {
                          delete newFilters.user_extension;
                        }
                        handleFiltersChange(newFilters);
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
                      Campaigns
                    </Form.Label>
                    <Select
                      isMulti
                      options={availableCampaigns.map((c) => ({
                        value: c.value,
                        label: c.label,
                      }))}
                      value={
                        prospectsFilters.campaigns
                          ? prospectsFilters.campaigns.map(
                              (campaignId: string) => {
                                const campaign = availableCampaigns.find(
                                  (c: any) => c.value === campaignId
                                );
                                return campaign
                                  ? { value: campaignId, label: campaign.label }
                                  : { value: campaignId, label: campaignId };
                              }
                            )
                          : null
                      }
                      onChange={(selected) => {
                        const campaignValues = selected
                          ? selected.map((s: any) => s.value)
                          : null;
                        setProspectsFilters((prev) => ({
                          ...prev,
                          campaigns: campaignValues,
                        }));
                        // Update currentFilters for API call
                        const newFilters = { ...currentFilters };
                        if (campaignValues && campaignValues.length > 0) {
                          newFilters.campaign_id = campaignValues;
                        } else {
                          delete newFilters.campaign_id;
                        }
                        handleFiltersChange(newFilters);
                        // Reset to all when campaign filter changes
                        setActiveFilter("all");
                      }}
                      placeholder="Select campaigns..."
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-bold mb-2">
                      Next Call Scheduled
                    </Form.Label>
                    <Form.Select
                      value={prospectsFilters.nextCallScheduled || ''}
                      onChange={(e) => {
                        const value = e.target.value || null;
                        setProspectsFilters((prev) => ({
                          ...prev,
                          nextCallScheduled: value,
                          nextCallDateFrom: null,
                          nextCallDateTo: null,
                        }));
                        
                        const now = moment();
                        let newFilters: any = { ...currentFilters };
                        
                        if (value === 'today') {
                          const today = now.format('YYYY-MM-DD');
                          newFilters.scheduled_call_from = today;
                          newFilters.scheduled_call_to = today;
                          delete newFilters.scheduled_call_status;
                        } else if (value === 'tomorrow') {
                          const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
                          newFilters.scheduled_call_from = tomorrow;
                          newFilters.scheduled_call_to = tomorrow;
                          delete newFilters.scheduled_call_status;
                        } else if (value === 'this_week') {
                          const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
                          const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');
                          newFilters.scheduled_call_from = startOfWeek;
                          newFilters.scheduled_call_to = endOfWeek;
                          delete newFilters.scheduled_call_status;
                        } else if (value === 'next_week') {
                          const nextWeekStart = moment().add(1, 'week').startOf('week').format('YYYY-MM-DD');
                          const nextWeekEnd = moment().add(1, 'week').endOf('week').format('YYYY-MM-DD');
                          newFilters.scheduled_call_from = nextWeekStart;
                          newFilters.scheduled_call_to = nextWeekEnd;
                          delete newFilters.scheduled_call_status;
                        } else if (value === 'overdue') {
                          newFilters.scheduled_call_status = 'overdue';
                          delete newFilters.scheduled_call_from;
                          delete newFilters.scheduled_call_to;
                        } else if (value === 'custom') {
                          // Custom date range - dates will be set separately
                          // Keep existing scheduled_call_from and scheduled_call_to if they exist
                        } else {
                          // Clear scheduled call filters
                          delete newFilters.scheduled_call_from;
                          delete newFilters.scheduled_call_to;
                          delete newFilters.scheduled_call_status;
                        }
                        
                        handleFiltersChange(newFilters);
                        setActiveFilter("all");
                      }}
                    >
                      <option value="">Select option...</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="this_week">This Week</option>
                      <option value="next_week">Next Week</option>
                      <option value="overdue">Overdue Calls</option>
                      <option value="custom">Custom Date Range</option>
                    </Form.Select>
                  </Col>
                  {prospectsFilters.nextCallScheduled === 'custom' && (
                    <>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Next Call Date From
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={prospectsFilters.nextCallDateFrom || ''}
                          onChange={(e) => {
                            const dateValue = e.target.value || null;
                            setProspectsFilters((prev) => ({
                              ...prev,
                              nextCallDateFrom: dateValue,
                            }));
                            const newFilters = { ...currentFilters };
                            if (dateValue) {
                              newFilters.scheduled_call_from = dateValue;
                            } else {
                              delete newFilters.scheduled_call_from;
                            }
                            handleFiltersChange(newFilters);
                          }}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Next Call Date To
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={prospectsFilters.nextCallDateTo || ''}
                          onChange={(e) => {
                            const dateValue = e.target.value || null;
                            setProspectsFilters((prev) => ({
                              ...prev,
                              nextCallDateTo: dateValue,
                            }));
                            const newFilters = { ...currentFilters };
                            if (dateValue) {
                              newFilters.scheduled_call_to = dateValue;
                            } else {
                              delete newFilters.scheduled_call_to;
                            }
                            handleFiltersChange(newFilters);
                          }}
                        />
                      </Col>
                    </>
                  )}
                  <Col md={4}>
                    <Form.Label className="small fw-bold mb-2">
                      Source Name
                    </Form.Label>
                    <CreatableSelect
                      options={uniqueSources}
                      value={
                        prospectsFilters.sourceFile
                          ? { value: prospectsFilters.sourceFile, label: prospectsFilters.sourceFile }
                          : null
                      }
                      onChange={(selected) => {
                        const sourceValue = selected ? selected.value : null;
                        setProspectsFilters((prev) => ({
                          ...prev,
                          sourceFile: sourceValue,
                        }));
                        const newFilters = { ...currentFilters };
                        if (sourceValue) {
                          newFilters.source_file = sourceValue;
                        } else {
                          delete newFilters.source_file;
                        }
                        handleFiltersChange(newFilters);
                        setActiveFilter("all");
                      }}
                      placeholder="Select or create source..."
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-bold mb-2">
                      Tags
                    </Form.Label>
                    <Select
                      isMulti
                      options={availableTags.map((tag) => ({
                        value: tag.value,
                        label: tag.label,
                      }))}
                      value={
                        prospectsFilters.tags
                          ? prospectsFilters.tags.map((tagValue: string) => {
                              const tag = availableTags.find((t: any) => t.value === tagValue);
                              return tag
                                ? { value: tagValue, label: tag.label }
                                : { value: tagValue, label: tagValue };
                            })
                          : null
                      }
                      onChange={(selected) => {
                        const tagValues = selected
                          ? selected.map((s: any) => s.value)
                          : null;
                        setProspectsFilters((prev) => ({
                          ...prev,
                          tags: tagValues,
                        }));
                        const newFilters = { ...currentFilters };
                        if (tagValues && tagValues.length > 0) {
                          newFilters.tags = tagValues;
                        } else {
                          delete newFilters.tags;
                        }
                        handleFiltersChange(newFilters);
                        setActiveFilter("all");
                      }}
                      placeholder="Select tags..."
                      styles={customSelectStyles}
                      isClearable
                    />
                  </Col>
                  <Col md={4}>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-secondary"
                        className="d-flex align-items-center justify-content-center"
                        onClick={() => {
                          setProspectsFilters({
                            assignedTo: null,
                            campaigns: null,
                            nextCallScheduled: null,
                            nextCallDateFrom: null,
                            nextCallDateTo: null,
                            sourceFile: null,
                            tags: null,
                          });
                          setCurrentFilters({});
                          setActiveFilter("all");
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: 1,
                          }));
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

        {/* Bulk Actions and Column Customization */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          {/* Bulk Actions Dropdown - Only show when items are selected and user has delete permission */}
          {selectedItems.length > 0 &&
            session?.user?.permissions?.includes(
              "delete-crm-data-management"
            ) && (
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" size="sm">
                  <CheckSquare size={16} className="me-2" />
                  Bulk Actions ({selectedItems.length})
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                  <Dropdown.Item
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="d-flex align-items-center text-danger"
                  >
                    <Trash2 size={14} className="me-2" />
                    Delete Selected ({selectedItems.length})
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}

          {/* Column Customization */}
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
                { key: "name", label: "Name" },
                { key: "phone", label: "Phone" },
                { key: "source", label: "Source" },
                { key: "user_extension", label: "Assigned To" },
                { key: "campaign", label: "Campaign" },
                { key: "last_called_at", label: "Last Called" },
                { key: "last_call_end_reason", label: "Last Call Status" },
                { key: "disposition", label: "Disposition" },
                { key: "scheduled_call_at", label: "Next Call Scheduled" },
                { key: "tags", label: "Tags" },
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedColumns([...selectedColumns, col.key]);
                      } else {
                        setSelectedColumns(
                          selectedColumns.filter((c) => c !== col.key)
                        );
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() =>
                  setSelectedColumns([
                    "name",
                    "phone",
                    "source",
                    "user_extension",
                    "campaign",
                    "last_called_at",
                    "last_call_end_reason",
                    "disposition",
                    "scheduled_call_at",
                    "tags",
                  ])
                }
              >
                Select All
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() =>
                  setSelectedColumns([
                    "name",
                    "phone",
                    "source",
                    "user_extension",
                    "campaign",
                    "last_called_at",
                    "last_call_end_reason",
                    "disposition",
                    "scheduled_call_at",
                    "tags",
                  ])
                }
              >
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Prospects Table */}
        {session?.user?.permissions?.includes("list-crm-data-management") && (
          <Card
            className="border-0 shadow-sm prospects-table-wrapper"
            style={{ width: "100%" }}
          >
            <Card.Body className="p-0" style={{ width: "100%" }}>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading prospects...</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table
                      hover
                      className="mb-0"
                      style={{ width: "100%", margin: 0, tableLayout: "auto" }}
                    >
                      <thead className="bg-light">
                        <tr>
                          {session?.user?.permissions?.includes(
                            "delete-crm-data-management"
                          ) && (
                            <th
                              style={{
                                width: "20px",
                                minWidth: "unset",
                                paddingRight: "2px",
                              }}
                            >
                              <Form.Check
                                type="checkbox"
                                checked={
                                  selectedItems.length > 0 &&
                                  selectedItems.length === dataList.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems(
                                      dataList.map((item) => item.id)
                                    );
                                  } else {
                                    setSelectedItems([]);
                                  }
                                }}
                              />
                            </th>
                          )}
                          {selectedColumns.includes("name") && (
                            <th
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => handleSort("name")}
                            >
                              Name {renderSortIcon("name")}
                            </th>
                          )}
                          {selectedColumns.includes("phone") && (
                            <th
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => handleSort("phone")}
                            >
                              Phone {renderSortIcon("phone")}
                            </th>
                          )}
                          {selectedColumns.includes("source") && (
                            <th
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => handleSort("source_file")}
                            >
                              Source {renderSortIcon("source_file")}
                            </th>
                          )}
                          {selectedColumns.includes("user_extension") && (
                            <th
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => handleSort("user_extension")}
                            >
                              Assigned To {renderSortIcon("user_extension")}
                            </th>
                          )}
                          {selectedColumns.includes("campaign") && (
                            <th
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => handleSort("campaign_id")}
                            >
                              Campaign {renderSortIcon("campaign_id")}
                            </th>
                          )}
                          {selectedColumns.includes("last_called_at") && (
                            <th
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => handleSort("last_called_at")}
                            >
                              Last Called {renderSortIcon("last_called_at")}
                            </th>
                          )}
                          {selectedColumns.includes("last_call_end_reason") && (
                            <th
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => handleSort("last_call_end_reason")}
                            >
                              Last Call Status{" "}
                              {renderSortIcon("last_call_end_reason")}
                            </th>
                          )}
                          {selectedColumns.includes("disposition") && (
                            <th
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => handleSort("disposition")}
                            >
                              Disposition {renderSortIcon("disposition")}
                            </th>
                          )}
                          {selectedColumns.includes("scheduled_call_at") && (
                            <th
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => handleSort("scheduled_call_at")}
                            >
                              Next Call Scheduled{" "}
                              {renderSortIcon("scheduled_call_at")}
                            </th>
                          )}
                          {selectedColumns.includes("tags") && <th>Tags</th>}
                          <th style={{ width: "120px", minWidth: "120px" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const sorted = sortData(
                            dataList,
                            pagination.sortColumn,
                            pagination.sortDirection
                          );

                          if (sorted.length === 0) {
                            return (
                              <tr>
                                <td
                                  colSpan={
                                    selectedColumns.length +
                                    (session?.user?.permissions?.includes(
                                      "delete-crm-data-management"
                                    )
                                      ? 2
                                      : 1)
                                  }
                                  className="text-center py-4 text-muted"
                                >
                                  No prospects found matching your criteria
                                </td>
                              </tr>
                            );
                          }

                          return sorted.map((item: any) => {
                            const endReason =
                              callEndReasons.find(
                                (r) =>
                                  r.value ===
                                  ((item as any).last_call_end_reason ||
                                    "answered")
                              ) || callEndReasons[0];
                            const dispositions = [
                              {
                                value: "interested",
                                label: "Interested",
                                color: "success",
                              },
                              {
                                value: "not_interested",
                                label: "Not Interested",
                                color: "danger",
                              },
                              {
                                value: "callback_requested",
                                label: "Callback Requested",
                                color: "warning",
                              },
                              {
                                value: "no_answer",
                                label: "No Answer",
                                color: "warning",
                              },
                              { value: "busy", label: "Busy", color: "info" },
                              {
                                value: "do_not_call",
                                label: "Do Not Call",
                                color: "danger",
                              },
                              {
                                value: "wrong_number",
                                label: "Wrong Number",
                                color: "info",
                              },
                              {
                                value: "follow_up",
                                label: "Follow Up",
                                color: "primary",
                              },
                            ];
                            const randomDisposition =
                              dispositions[
                                Math.floor(Math.random() * dispositions.length)
                              ];

                            return (
                              <tr key={item.id}>
                                {session?.user?.permissions?.includes(
                                  "delete-crm-data-management"
                                ) && (
                                  <td
                                    style={{
                                      width: "20px",
                                      minWidth: "unset",
                                      paddingRight: "2px",
                                    }}
                                  >
                                    <Form.Check
                                      type="checkbox"
                                      checked={selectedItems.includes(item.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedItems([
                                            ...selectedItems,
                                            item.id,
                                          ]);
                                        } else {
                                          setSelectedItems(
                                            selectedItems.filter(
                                              (id) => id !== item.id
                                            )
                                          );
                                        }
                                      }}
                                    />
                                  </td>
                                )}
                                {selectedColumns.includes("name") && (
                                  <td className="fw-semibold">
                                    <div className="d-flex align-items-center gap-2">
                                      {item.name ? (
                                        <>
                                          <div
                                            style={{
                                              width: "30px",
                                              height: "30px",
                                              borderRadius: "50%",
                                              backgroundColor: getRandomColor(
                                                item.name
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
                                            {getInitials(item.name)}
                                          </div>
                                          <span>{item.name}</span>
                                        </>
                                      ) : (
                                        "N/A"
                                      )}
                                    </div>
                                  </td>
                                )}
                                {selectedColumns.includes("phone") && (
                                  <td>
                                    <PhoneContainer phone={item?.phone} />
                                  </td>
                                )}
                                {selectedColumns.includes("source") && (
                                  <td>
                                    {(item as any).source_file ? (
                                      <Badge
                                        bg="secondary"
                                        className="bg-opacity-10 text-dark"
                                      >
                                        {(item as any).source_file}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted">N/A</span>
                                    )}
                                  </td>
                                )}
                                {selectedColumns.includes("user_extension") && (
                                  <td>
                                    {item.user_extension ? (
                                      <Badge
                                        bg="success"
                                        className="bg-opacity-10 text-dark d-flex align-items-center gap-1"
                                        style={{
                                        }}
                                      >
                                        <span style={{
                                          backgroundColor: '#1de9b6',
                                          width: '5px',
                                          height: '5px',
                                          borderRadius: '50%',
                                        }}>
                                        </span>
                                        {extensions.find(
                                          (ext: any) =>
                                            ext.id.toString() ===
                                            item.user_extension?.toString()
                                        )?.display_name || item.user_extension}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        bg="secondary"
                                        className="bg-opacity-10 text-dark"
                                      >
                                        Unassigned
                                      </Badge>
                                    )}
                                  </td>
                                )}
                                {selectedColumns.includes("campaign") && (
                                  <td>
                                    {(item as any).campaign ? (
                                      <Badge
                                        bg="primary"
                                        className="bg-opacity-10 text-dark"
                                      >
                                        {(item as any).campaign.name}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        bg="info"
                                        className="bg-opacity-10 text-dark"
                                      >
                                        No Campaign
                                      </Badge>
                                    )}
                                  </td>
                                )}
                                {selectedColumns.includes("last_called_at") && (
                                  <td>
                                    {(item as any).last_called_at
                                      ? moment(
                                          (item as any).last_called_at
                                        ).format("MMM DD, HH:mm")
                                      : "-"}
                                  </td>
                                )}
                                {selectedColumns.includes(
                                  "last_call_end_reason"
                                ) && (
                                  <td>
                                    {(item as any).last_call_end_reason ? (
                                      <Badge
                                        bg={endReason.color as any}
                                        className="bg-opacity-10 text-dark"
                                      >
                                        {endReason.label}
                                      </Badge>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                )}
                                {selectedColumns.includes("disposition") && (
                                  <td>
                                    {(item as any).disposition ? (
                                      <Badge
                                        bg={randomDisposition.color as any}
                                        className="bg-opacity-10 text-dark"
                                      >
                                        {randomDisposition.label}
                                      </Badge>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                )}
                                {selectedColumns.includes(
                                  "scheduled_call_at"
                                ) && (
                                  <td>
                                    {(item as any).scheduled_call_at ? (
                                      (() => {
                                        const scheduledAt = (item as any)
                                          .scheduled_call_at;
                                        const isOverdue = moment(
                                          scheduledAt
                                        ).isBefore(moment());
                                        const isNextHour = moment(
                                          scheduledAt
                                        ).isBefore(moment().add(1, "hour"));
                                        return (
                                          <Badge
                                            bg={
                                              isOverdue
                                                ? "danger"
                                                : isNextHour
                                                ? "warning"
                                                : "info"
                                            }
                                            className="bg-opacity-10 text-dark"
                                          >
                                            {moment(scheduledAt).format(
                                              "MMM DD, HH:mm"
                                            )}
                                            {isOverdue && (
                                              <span className="ms-1 fw-bold">
                                                (Overdue)
                                              </span>
                                            )}
                                            {isNextHour && !isOverdue && (
                                              <span className="ms-1 fw-bold">
                                                (Soon)
                                              </span>
                                            )}
                                          </Badge>
                                        );
                                      })()
                                    ) : (
                                      <Badge
                                        bg="info"
                                        className="bg-opacity-10 text-dark"
                                      >
                                        Not scheduled
                                      </Badge>
                                    )}
                                  </td>
                                )}
                                {selectedColumns.includes("tags") && (
                                  <td>
                                    <div className="d-flex gap-1 flex-wrap">
                                      {((item as any).tags || []).map(
                                        (tag: any, idx: number) => (
                                          <Badge
                                            key={idx}
                                            bg="secondary"
                                            className="bg-opacity-10 text-dark"
                                          >
                                            {tag.name || tag}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </td>
                                )}
                                <td
                                  style={{ width: "120px", minWidth: "120px" }}
                                >
                                  <div className="d-flex gap-1">
                                    {session?.user?.permissions?.includes(
                                      "view-crm-data-management"
                                    ) && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1"
                                        title="View Details"
                                        onClick={() => handleViewData(item)}
                                      >
                                        <Eye size={16} />
                                      </Button>
                                    )}
                                    {session?.user?.permissions?.includes(
                                      "call-service-crm-data-management"
                                    ) && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1 text-success"
                                        title="Call Now"
                                        onClick={() => handleCallClick(item)}
                                      >
                                        <PhoneIcon size={16} />
                                      </Button>
                                    )}
                                  {
                                    activeFilter !== 'has_leads' && (
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
                                        {session?.user?.permissions?.includes(
                                          "call-service-crm-data-management"
                                        ) && (
                                          <>
                                            {(item as any).scheduled_call_at ? (
                                              <Dropdown.Item
                                                onClick={() =>
                                                  handleUnscheduleCall(item)
                                                }
                                              >
                                                <FiX
                                                  size={14}
                                                  className="me-2"
                                                />
                                                Unschedule Call
                                              </Dropdown.Item>
                                            ) : (
                                              <Dropdown.Item
                                                onClick={() =>
                                                  handleScheduleCall(item)
                                                }
                                              >
                                                <FiCalendar
                                                  size={14}
                                                  className="me-2"
                                                />
                                                Schedule Call
                                              </Dropdown.Item>
                                            )}
                                            <Dropdown.Divider />
                                          </>
                                        )}
                                        <Dropdown.Item
                                          onClick={() => {
                                            window.location.href = `/crm/leads/create?crm_data_id=${item.id}`;
                                          }}
                                        >
                                          <FiTarget
                                            size={14}
                                            className="me-2"
                                          />
                                          Convert to Lead
                                        </Dropdown.Item>
                                        {/* <Dropdown.Item onClick={() => {
                                          window.location.href = `tel:${item.phone}`;
                                        }}>
                                          <PhoneIcon size={14} className="me-2" />
                                          Call Prospect
                                        </Dropdown.Item> */}
                                        {(item as any).email && (
                                          <Dropdown.Item
                                            onClick={() => {
                                              window.location.href = `mailto:${
                                                (item as any).email
                                              }`;
                                            }}
                                          >
                                            <Mail size={14} className="me-2" />
                                            Send Email
                                          </Dropdown.Item>
                                        )}
                                      </Dropdown.Menu>
                                    </Dropdown>
                                    )
                                  }
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </Table>
                  </div>
                  <div className="p-3">{renderPaginationControls()}</div>
                </>
              )}
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      {session?.user?.permissions?.includes("add-crm-data-management") && (
        <Modal
          show={showUploadModal}
          onHide={() => setShowUploadModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="border-bottom bg-light">
            <Modal.Title>Upload CSV - Import Prospects</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <div className="alert alert-info mb-4">
              <AlertCircleIcon size={18} className="me-2" />
              <strong>📋 Import Guidelines:</strong>
              <ul className="mb-0 mt-2">
                <li>
                  <strong>Headers:</strong> First row must contain column
                  headers
                </li>
                <li>
                  <strong>Name Column:</strong> Include a "name" column (case
                  insensitive) for first name and last name, or use separate
                  "first name" and "last name" columns
                </li>
                <li>
                  <strong>Phone Column:</strong> Include a "phone" column (case
                  insensitive) for contact information. Phone must follow the
                  E.164 format.
                </li>
                <li>
                  <strong>Email Column:</strong> Include a "email" column for contact information. Email must be a valid email address.
                </li>
                <li>
                  <strong>File Size:</strong> Maximum 2MB per file
                </li>
                <li>
                  <strong>Formats:</strong> CSV files supported
                </li>
                <li>
                  <strong>Data Quality:</strong> Clean, valid data imports
                  faster and works better
                </li>
              </ul>
            </div>
            <Form>
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="fw-semibold mb-0">
                    Select CSV File <span className="text-danger">*</span>
                  </Form.Label>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={downloadExampleCsv}
                    className="d-flex align-items-center gap-1"
                  >
                    <Download size={14} />
                    Download Example CSV
                  </Button>
                </div>
                <Form.Control
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                />
                <Form.Text className="text-muted">
                  Supported formats: CSV
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Tags (Optional)</Form.Label>
                <CreatableSelect
                  isMulti
                  value={fieldTags}
                  onChange={(selected) => setFieldTags(selected || [])}
                  options={availableTags}
                  placeholder="Add tags to organize and filter this data..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#ced4da",
                      boxShadow: "none",
                      fontSize: "14px",
                    }),
                  }}
                />
                <Form.Text className="text-muted">
                  Add descriptive tags to help categorize and filter your data
                  later. You can create new tags by typing them.
                </Form.Text>
              </Form.Group>
              <div className="alert alert-warning">
                <small>
                  <strong>Note:</strong> The data will be uploaded even if some
                  fields remain empty.
                </small>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-top">
            <Button
              variant="secondary"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={() => handleUpload()}>
              <Download size={16} className="me-2" />
              Upload & Import
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* View Data Modal */}
      {selectedDataItem && (
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
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
              onClick={() => setShowViewModal(false)}
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
              {selectedDataItem.name || `Prospect #${selectedDataItem.id}`}
            </h3>
            <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
              Prospect Details
            </p>
          </div>

          <Modal.Body style={{ padding: "30px" }}>
            {/* Prospect Information Section */}
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
              Prospect Information
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
                  Name
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  {selectedDataItem.name || "N/A"}
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
                  Phone
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  <PhoneIcon
                    size={14}
                    style={{
                      color: "#4680ff",
                      marginRight: "6px",
                      display: "inline",
                    }}
                  />
                  {selectedDataItem.phone || "N/A"}
                </div>
              </div>
              {/* <div style={{
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
                }}>Status</div>
                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                  <Badge bg={selectedDataItem.is_viewed ? 'success' : 'primary'}>
                    {selectedDataItem.is_viewed ? 'Viewed' : 'New'}
                  </Badge>
                </div>
              </div> */}
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
                  {selectedDataItem.user_extension
                    ? extensions.find(
                        (extension: any) =>
                          extension.id.toString() ===
                          selectedDataItem.user_extension?.toString()
                      )?.display_name || selectedDataItem.user_extension
                    : "Unassigned"}
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
                  Campaign
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  {availableCampaigns.find(
                    (c) => c.value === selectedDataItem.campaign_id?.toString()
                  )?.label || "No Campaign"}
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
                  {selectedDataItem.created_at
                    ? moment(selectedDataItem.created_at).format("MMM DD, YYYY")
                    : "N/A"}
                </div>
              </div>
            </div>

            {selectedDataItem?.scheduled_call_at && selectedDataItem?.note && (
              <React.Fragment>
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
                  {/* <FileText size={18} style={{ color: '#4680ff' }} />
                  Call Note */}
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
                      Call Note
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      {selectedDataItem.note}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}

            {/* Custom Data Fields Section */}
            {selectedDataItem.data &&
              Object.keys(selectedDataItem.data).length > 0 && (
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
                    Custom Data Fields
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
                    {Object.entries(selectedDataItem.data).map(
                      ([key, value]) => (
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
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                          <div
                            style={{
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            {value !== null && value !== undefined
                              ? typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)
                              : "N/A"}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}

            {/* Call History Timeline */}
            {/* {getCallHistory(selectedDataItem.id).length > 0 && (
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
                  <History size={18} style={{ color: '#4680ff' }} />
                  Call History ({getCallHistory(selectedDataItem.id).length})
                </div>
                <div style={{ position: 'relative', paddingLeft: '30px', marginBottom: '30px' }}>
                  <div style={{
                    content: '',
                    position: 'absolute',
                    left: '8px',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: '#e5e7eb'
                  }} />
                  {getCallHistory(selectedDataItem.id).map((call, idx) => {
                    const endReason = callEndReasons.find(
                      (r) => r.value === call.endReason
                    );
                    const dispositionColors: Record<string, string> = {
                      interested: 'success',
                      not_interested: 'danger',
                      callback_requested: 'warning',
                      no_answer: 'secondary',
                      busy: 'info',
                      do_not_call: 'dark',
                      wrong_number: 'light',
                      follow_up: 'primary',
                    };
                    const dispositionColor = dispositionColors[call.disposition] || 'primary';
                    const endReasonColor = endReason?.color || 'secondary';
                    
                    return (
                      <div key={call.id || idx} style={{ position: 'relative', paddingBottom: '20px' }}>
                        <div style={{
                          content: '',
                          position: 'absolute',
                          left: '-26px',
                          top: '4px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: endReasonColor === 'success' ? '#10b981' : '#4680ff',
                          border: '3px solid white',
                          boxShadow: '0 0 0 2px #e5e7eb'
                        }} />
                        <div style={{
                          background: '#f8f9fa',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>
                              {moment(call.calledAt).format("MMM DD, YYYY HH:mm")} - Duration: {call.duration}
                            </div>
                            <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '8px', fontWeight: 500 }}>
                              <Badge bg={endReasonColor as any} className="me-2">
                                {endReason?.label || call.endReason}
                              </Badge>
                              <Badge bg={dispositionColor as any}>
                                {call.disposition
                                  ?.replace("_", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Badge>
                            </div>
                            {call.comment && (
                              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                                {call.comment}
                              </div>
                            )}
                          </div>
                          {call.recordingUrl && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1"
                              title="Play Recording"
                              onClick={() => handlePlayRecording(call.recordingUrl)}
                            >
                              <FiPlay size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )} */}

            {/* No Call History Message */}
            {/* {getCallHistory(selectedDataItem.id).length === 0 && (
              <div style={{
                marginBottom: '30px',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <History size={32} style={{ color: '#9ca3af', marginBottom: '12px' }} />
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  No call history available for this prospect
                </div>
              </div>
            )} */}

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
                  background: "white",
                  color: "#6b7280",
                  border: "2px solid #e5e7eb",
                }}
                onClick={() => setShowViewModal(false)}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "#4680ff";
                  e.currentTarget.style.color = "#4680ff";
                  e.currentTarget.style.background = "#f0f4ff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.color = "#6b7280";
                  e.currentTarget.style.background = "white";
                }}
              >
                Close
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={
          itemToDelete ? `prospect entry #${itemToDelete.id}` : undefined
        }
        itemType="prospect entry"
        additionalInfo={
          itemToDelete ? (
            <div className="alert alert-warning mb-3">
              <strong>Entry ID:</strong> #{itemToDelete.id}
              <br />
              <strong>Phone:</strong> {itemToDelete.phone || "N/A"}
              <br />
              <strong>Assigned To:</strong>{" "}
              {itemToDelete.user_extension
                ? extensions.find(
                    (extension: any) =>
                      extension.id.toString() ===
                      itemToDelete.user_extension?.toString()
                  )?.display_name || itemToDelete.user_extension
                : "Unassigned"}
              <br />
              <strong>Created:</strong>{" "}
              {moment(itemToDelete.created_at).format("MMM DD, YYYY HH:mm")}
            </div>
          ) : undefined
        }
      />

      {/* Data Assignment Success Modal */}
      <FormModal
        show={showDataAssignmentModal}
        onHide={handleDataAssignmentModalClose}
        title="Smart Prospect Distribution"
        desc="Please fill the details below to smart prospect distribution."
        size="lg"
        formHtml={
          <>
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <FiFilter className="me-2 text-primary" />
                <h6 className="mb-0">Step 1: Filter Your Prospects</h6>
              </div>
              <p className="text-muted small mb-3">
                Choose which prospects to assign by filtering by tags and
                campaigns.
              </p>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Filter by Tags</Form.Label>
                    <CreatableSelect
                      isMulti
                      value={assignmentFilters.selectedTags}
                      onChange={(selected) =>
                        setAssignmentFilters((prev) => ({
                          ...prev,
                          selectedTags: selected || [],
                        }))
                      }
                      options={availableTags}
                      placeholder="Select tags to filter prospects..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#ced4da",
                          boxShadow: "none",
                          fontSize: "14px",
                        }),
                      }}
                    />
                    <Form.Text className="text-muted">
                      Only prospects with these tags will be considered for
                      assignment.
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Filter by Campaigns</Form.Label>
                    <CreatableSelect
                      isMulti
                      value={assignmentFilters.selectedCampaigns}
                      onChange={(selected) =>
                        setAssignmentFilters((prev) => ({
                          ...prev,
                          selectedCampaigns: selected || [],
                        }))
                      }
                      options={availableCampaigns}
                      placeholder="Select campaigns to filter prospects..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#ced4da",
                          boxShadow: "none",
                          fontSize: "14px",
                        }),
                      }}
                    />
                    <Form.Text className="text-muted">
                      Only prospects from these campaigns will be considered for
                      assignment.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <FiDatabase className="me-2 text-info" />
                <h6 className="mb-0">Step 2: Review Available Prospects</h6>
              </div>
              <p className="text-muted small mb-3">
                Based on your filters, here's what's available for assignment.
              </p>

              {/* <div className="row">
              <div className="col-md-4">
                <div className="card bg-light border-primary">
                  <div className="card-body text-center">
                    <h4 className="text-primary">
                      {assignmentCounts.total.toLocaleString()}
                    </h4>
                    <p className="mb-0 small">Total Entries</p>
                    <small className="text-muted">Matching your filters</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h4>{assignmentCounts.assigned.toLocaleString()}</h4>
                    <p className="mb-0 small">Already Assigned</p>
                    <small className="opacity-75">In use by team members</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-warning text-white">
                  <div className="card-body text-center">
                    <h4>{assignmentCounts.unassigned.toLocaleString()}</h4>
                    <p className="mb-0 small">Available</p>
                    <small className="opacity-75">Ready for assignment</small>
                  </div>
                </div>
              </div>
            </div> */}

              <Row>
                <Col md={12} className="text-left">
                  <PageSummaryGrid
                    gridColumns={3}
                    cardHeading="h5"
                    gridTextAlign="center"
                    cards={[
                      {
                        id: "total-entries",
                        title: "Total Prospects",
                        value: assignmentCounts?.total || 0,
                        description: "Matching your filters",
                      },
                      {
                        id: "assigned-entries",
                        title: "Assigned Prospects",
                        value: assignmentCounts?.assigned || 0,
                        description: "In use by team members",
                      },
                      {
                        id: "available-entries",
                        title: "Available Prospects",
                        value: assignmentCounts?.unassigned || 0,
                        description: "Ready for assignment",
                      },
                    ]}
                  />
                </Col>
              </Row>
            </div>

            <div className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <FiUsers className="me-2 text-success" />
                <h6 className="mb-0">Step 3: Configure Assignment</h6>
              </div>
              <p className="text-muted small mb-3">
                You have{" "}
                <strong>{assignmentCounts.unassigned.toLocaleString()}</strong>{" "}
                prospects ready for assignment out of{" "}
                <strong>{assignmentCounts.total.toLocaleString()}</strong> total
                matching prospects.
              </p>

              <Form.Group className="mb-3">
                <Form.Label>Target Campaigns *</Form.Label>
                <CreatableSelect
                  isMulti
                  value={assignmentCampaign}
                  onChange={(selected) => setAssignmentCampaign(selected || [])}
                  options={availableCampaigns}
                  placeholder="Choose which campaigns to assign prospects to..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#ced4da",
                      boxShadow: "none",
                      fontSize: "14px",
                    }),
                  }}
                />
                <Form.Text className="text-muted">
                  <strong>Smart Distribution:</strong> Prospects will be
                  automatically distributed among users in the selected
                  campaigns based on their workload and availability.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Assignment Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max={assignmentCounts.unassigned}
                  value={totalEntriesToAssign}
                  onChange={(e) =>
                    setTotalEntriesToAssign(parseInt(e.target.value) || 0)
                  }
                  placeholder="How many prospects to assign?"
                />
                <Form.Text className="text-muted">
                  <strong>Maximum:</strong>{" "}
                  {assignmentCounts.unassigned.toLocaleString()} prospects
                  available. Start with a smaller batch to test the assignment
                  process.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Distribution Strategy</Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    id="equal-distribution"
                    name="assignmentDistribution"
                    label="Auto-balance across campaigns"
                    value="equal"
                    checked={assignmentDistribution === "equal"}
                    onChange={() => setAssignmentDistribution("equal")}
                    className="mb-2"
                  />
                  <Form.Check
                    type="radio"
                    id="custom-distribution"
                    name="assignmentDistribution"
                    label="Custom allocation per campaign"
                    value="custom"
                    checked={assignmentDistribution === "custom"}
                    onChange={() => setAssignmentDistribution("custom")}
                  />
                </div>
                <Form.Text className="text-muted">
                  <strong>Auto-balance:</strong> Prospects are distributed
                  evenly. <strong>Custom:</strong> You specify exactly how many
                  prospects each campaign gets.
                </Form.Text>
              </Form.Group>

              {assignmentDistribution === "custom" &&
                assignmentCampaign.length > 0 && (
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="mb-0">
                        Custom Distribution
                      </Form.Label>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          const equalDistribution = Math.floor(
                            totalEntriesToAssign / assignmentCampaign.length
                          );
                          const remainder =
                            totalEntriesToAssign % assignmentCampaign.length;
                          const newCustomDistribution: Record<string, number> =
                            {};

                          Array.from(assignmentCampaign).forEach(
                            (campaign: any, index: number) => {
                              newCustomDistribution[campaign.value] =
                                equalDistribution + (index < remainder ? 1 : 0);
                            }
                          );

                          setCustomDistribution(newCustomDistribution);
                        }}
                      >
                        Auto-fill Equal
                      </Button>
                    </div>
                    <div className="border rounded p-3 bg-light">
                      <p className="small text-muted mb-3">
                        Total to assign: <strong>{totalEntriesToAssign}</strong>{" "}
                        | Allocated:{" "}
                        <strong>
                          {Object.values(customDistribution).reduce(
                            (sum, count) => sum + count,
                            0
                          )}
                        </strong>{" "}
                        | Remaining:{" "}
                        <strong>
                          {totalEntriesToAssign -
                            Object.values(customDistribution).reduce(
                              (sum, count) => sum + count,
                              0
                            )}
                        </strong>
                      </p>
                      {Array.from(assignmentCampaign).map((campaign: any) => (
                        <div key={campaign.value} className="mb-2">
                          <Row>
                            <Col md={6}>
                              <Form.Label className="small mb-0">
                                {campaign.label}
                              </Form.Label>
                            </Col>
                            <Col md={6}>
                              <Form.Control
                                type="number"
                                min="0"
                                max={totalEntriesToAssign}
                                value={customDistribution[campaign.value] || 0}
                                onChange={(e) =>
                                  setCustomDistribution((prev) => ({
                                    ...prev,
                                    [campaign.value]:
                                      parseInt(e.target.value) || 0,
                                  }))
                                }
                                size="sm"
                              />
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </div>
                  </Form.Group>
                )}

              <Alert variant="info" className="mt-3">
                <strong>Assignment Info:</strong> Prospects will be
                automatically assigned to users within the selected campaigns
                based on their campaign user extensions. The system will
                distribute prospects equally among users in each campaign.
              </Alert>
            </div>
          </>
        }
        submitButtonText="OK"
        cancelButtonText="Cancel"
        onSubmit={handleDataAssignmentSubmit}
        onCancel={handleDataAssignmentModalClose}
      />

      <FormModal
        show={showAfterCallModal}
        onHide={() => setShowAfterCallModal(false)}
        title="After Call Dialog"
        desc="Please fill the details below to record call outcomes and schedule follow-up actions."
        size="lg"
        formHtml={
          <>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Disposition *</Form.Label>
                  <Form.Select
                    value={afterCallData.disposition}
                    onChange={(e) =>
                      setAfterCallData({
                        ...afterCallData,
                        disposition: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Disposition</option>
                    <option value="interested">Interested</option>
                    <option value="not_interested">Not Interested</option>
                    <option value="callback_requested">
                      Call Back Requested
                    </option>
                    <option value="follow_up">Follow Up</option>
                    <option value="do_not_call">Do Not Call</option>
                    <option value="wrong_number">Wrong Number</option>
                    <option value="spam">Spam</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Call Status *</Form.Label>
                  <Form.Select
                    value={afterCallData.callStatus}
                    onChange={(e) =>
                      setAfterCallData({
                        ...afterCallData,
                        callStatus: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Call Status</option>
                    <option value="answered">Answered</option>
                    <option value="no_answer">No Answer</option>
                    <option value="busy">Busy</option>
                    <option value="voicemail">Voicemail</option>
                    <option value="disconnected">Disconnected</option>
                    <option value="network_error">Network Error</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Call Comment *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={afterCallData.comment}
                onChange={(e) =>
                  setAfterCallData({
                    ...afterCallData,
                    comment: e.target.value,
                  })
                }
                placeholder="Enter call details, client response, and any important notes..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Generate Lead *</Form.Label>
              <div className="d-flex gap-4">
                <Form.Check
                  type="radio"
                  id="generate-lead-yes"
                  name="generateLead"
                  value="yes"
                  checked={afterCallData.generateLead === "yes"}
                  onChange={(e) =>
                    setAfterCallData({
                      ...afterCallData,
                      generateLead: e.target.value,
                    })
                  }
                  label="Yes, generate lead"
                />
                <Form.Check
                  type="radio"
                  id="generate-lead-no"
                  name="generateLead"
                  value="no"
                  checked={afterCallData.generateLead === "no"}
                  onChange={(e) =>
                    setAfterCallData({
                      ...afterCallData,
                      generateLead: e.target.value,
                    })
                  }
                  label="No, do not generate lead"
                />
              </div>
              <Form.Text className="text-muted">
                Select "Yes" if this call resulted in a qualified lead that
                should be created in the CRM system.
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Schedule Next Call (Optional)</Form.Label>
                  <Form.Control
                    type="date"
                    value={afterCallData.nextCallDate}
                    onChange={(e) =>
                      setAfterCallData({
                        ...afterCallData,
                        nextCallDate: e.target.value,
                      })
                    }
                    min={moment().format("YYYY-MM-DD")}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Time (Optional)</Form.Label>
                  <Form.Control
                    type="time"
                    value={afterCallData.nextCallTime}
                    onChange={(e) =>
                      setAfterCallData({
                        ...afterCallData,
                        nextCallTime: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Alert variant="info">
              <strong>Note:</strong> This dialog will be used to record call
              outcomes and schedule follow-up actions. All fields marked with *
              are required.
            </Alert>
          </>
        }
        submitButtonText="Save Call Data"
        cancelButtonText="Cancel"
        onSubmit={() => handleAfterCallSubmit()}
        onCancel={() => setShowAfterCallModal(false)}
      />

      <FormModal
        show={showScheduleModal}
        onHide={() => setShowScheduleModal(false)}
        title="Schedule Call"
        desc="Please fill the details below to schedule a call."
        size="lg"
        formHtml={
          <>
            {selectedEntryForSchedule && (
              <div className="mb-3">
                <h6>Schedule Call For:</h6>
                <div className="bg-light p-3 rounded">
                  <div>
                    <strong>Name:</strong>{" "}
                    {selectedEntryForSchedule.name || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong>{" "}
                    {selectedEntryForSchedule.phone || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong>{" "}
                    {selectedEntryForSchedule?.data?.email || "N/A"}
                  </div>
                </div>
              </div>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={scheduleData.date}
                    onChange={(e) =>
                      setScheduleData({ ...scheduleData, date: e.target.value })
                    }
                    min={moment().format("YYYY-MM-DD")}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Time *</Form.Label>
                  <Form.Control
                    type="time"
                    value={scheduleData.time}
                    onChange={(e) =>
                      setScheduleData({ ...scheduleData, time: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={scheduleData.notes}
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, notes: e.target.value })
                }
                placeholder="Add any notes or reminders for this call..."
              />
            </Form.Group>

            <Alert variant="info">
              <strong>Note:</strong> The call will be scheduled and you'll
              receive a reminder at the selected time.
            </Alert>
          </>
        }
        submitButtonText="Schedule Call"
        cancelButtonText="Cancel"
        onSubmit={() => handleScheduleSubmit()}
        onCancel={() => handleScheduleModalClose()}
      />

      <FormModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        title="Activity History"
        desc="Please fill the details below to view the activity history."
        size="lg"
        formHtml={
          <>
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">System Activity Log</h5>
                  <p className="text-muted mb-0">
                    Track all user activities including CSV uploads, data
                    assignments, and campaign management.
                  </p>
                </div>
                <div className="text-end">
                  <Badge bg="info" className="me-2">
                    {historyPagination.total} Total Activities
                  </Badge>
                  <Badge bg="secondary">
                    Page {historyPagination.current_page} of{" "}
                    {historyPagination.last_page}
                  </Badge>
                </div>
              </div>
            </div>

            {historyLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading activity history...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-5">
                <FiClock size={48} className="text-muted mb-3" />
                <h6 className="text-muted">No Activity Found</h6>
                <p className="text-muted">
                  No activities have been recorded yet.
                </p>
              </div>
            ) : (
              <div className="timeline ">
                {historyData.map((activity, index) => {
                  const getActivityIcon = (action: string) => {
                    switch (action) {
                      case "upload":
                        return <FiUpload size={18} className="text-white" />;
                      case "assign":
                        return <FiUsers size={18} className="text-white" />;
                      case "schedule_call":
                      case "reschedule_call":
                        return <FiCalendar size={18} className="text-white" />;
                      case "cancel_call":
                      case "unschedule_call":
                        return <FiX size={18} className="text-white" />;
                      default:
                        return <FiUser size={18} className="text-white" />;
                    }
                  };

                  const getActivityColor = (action: string) => {
                    switch (action) {
                      case "upload":
                        return "primary";
                      case "assign":
                        return "success";
                      case "schedule_call":
                      case "reschedule_call":
                        return "info";
                      case "cancel_call":
                      case "unschedule_call":
                        return "warning";
                      default:
                        return "secondary";
                    }
                  };

                  const formatActivityDetails = (activity: any) => {
                    const details = activity.details || {};
                    switch (activity.action) {
                      case "upload":
                        const campaignNames =
                          details.campaign_ids
                            ?.map(
                              (id: number) =>
                                campaignsById[id] || `Campaign #${id}`
                            )
                            .join(", ") || "No campaigns";
                        const tags = details.tags?.join(", ") || "No tags";
                        return (
                          <div>
                            <div className="mb-1">
                              <strong>
                                Uploaded {activity.total_records || 0} prospects
                              </strong>
                            </div>
                            <div className="small text-muted">
                              <div>
                                <strong>Campaigns:</strong> {campaignNames}
                              </div>
                              <div>
                                <strong>Tags:</strong> {tags}
                              </div>
                            </div>
                          </div>
                        );
                      case "assign":
                        return (
                          <div>
                            <div className="mb-1">
                              <strong>
                                Assigned {activity.total_records || 0} prospects
                              </strong>
                            </div>
                            <div className="small text-muted">
                              <strong>To:</strong>{" "}
                              {getNameByExtension(
                                activity.user_extension_done_to
                              ) || "Campaign team"}
                            </div>
                          </div>
                        );
                      case "schedule_call":
                        return (
                          <div>
                            <div className="mb-1">
                              <strong>Scheduled call</strong>
                            </div>
                            <div className="small text-muted">
                              <div>
                                <strong>Phone:</strong> {details.phone || "N/A"}
                              </div>
                              <div>
                                <strong>Time:</strong>{" "}
                                {moment(details.scheduled_call_at).format(
                                  "MMM DD, YYYY HH:mm"
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      case "reschedule_call":
                        return (
                          <div>
                            <div className="mb-1">
                              <strong>Rescheduled call</strong>
                            </div>
                            <div className="small text-muted">
                              <div>
                                <strong>Phone:</strong> {details.phone || "N/A"}
                              </div>
                              <div>
                                <strong>From:</strong>{" "}
                                {moment(details.old_scheduled_call_at).format(
                                  "MMM DD, HH:mm"
                                )}
                              </div>
                              <div>
                                <strong>To:</strong>{" "}
                                {moment(details.new_scheduled_call_at).format(
                                  "MMM DD, HH:mm"
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      case "cancel_call":
                      case "unschedule_call":
                        return (
                          <div>
                            <div className="mb-1">
                              <strong>Cancelled call</strong>
                            </div>
                            <div className="small text-muted">
                              <div>
                                <strong>Phone:</strong> {details.phone || "N/A"}
                              </div>
                              <div>
                                <strong>Was scheduled:</strong>{" "}
                                {moment(
                                  details.cancelled_scheduled_call_at ||
                                    details.unscheduled_call_at
                                ).format("MMM DD, HH:mm")}
                              </div>
                            </div>
                          </div>
                        );
                      default:
                        return (
                          <div>
                            <div className="mb-1">
                              <strong>
                                {activity.action
                                  ?.replace("_", " ")
                                  .replace(/\b\w/g, (l: string) =>
                                    l.toUpperCase()
                                  )}
                              </strong>
                            </div>
                            <div className="small text-muted">
                              {activity.details?.description ||
                                "No details available"}
                            </div>
                          </div>
                        );
                    }
                  };

                  return (
                    <div key={activity.id} className="timeline-item mb-4 ">
                      <div className="d-flex">
                        <div className="timeline-marker me-3">
                          <div
                            className={`bg-${getActivityColor(
                              activity.action
                            )} rounded-circle d-flex align-items-center justify-content-center shadow-sm`}
                            style={{ width: "36px", height: "36px" }}
                          >
                            {getActivityIcon(activity.action)}
                          </div>
                        </div>
                        <div className="timeline-content flex-grow-1">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1 d-flex align-items-center">
                                    <strong className="text-primary">
                                      {getNameByExtension(
                                        activity.user_extension_done_by
                                      ) || "System"}
                                    </strong>
                                    <Badge
                                      bg={getActivityColor(activity.action)}
                                      className="ms-2 small"
                                    >
                                      {activity.action
                                        ?.replace("_", " ")
                                        .replace(/\b\w/g, (l: string) =>
                                          l.toUpperCase()
                                        )}
                                    </Badge>
                                  </h6>
                                  <div className="text-muted">
                                    {formatActivityDetails(activity)}
                                  </div>
                                </div>
                                <div className="text-end">
                                  <small className="text-muted">
                                    {moment(activity.created_at).format(
                                      "MMM DD, YYYY"
                                    )}
                                  </small>
                                  <br />
                                  <small className="text-muted">
                                    {moment(activity.created_at).format(
                                      "HH:mm:ss"
                                    )}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="timeline-line"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!historyLoading &&
              historyData.length > 0 &&
              historyPagination.last_page > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <div className="btn-group" role="group">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={historyPagination.current_page === 1}
                      onClick={() =>
                        fetchHistoryData(historyPagination.current_page - 1)
                      }
                    >
                      Previous
                    </Button>
                    <Button variant="outline-secondary" size="sm" disabled>
                      {historyPagination.current_page} /{" "}
                      {historyPagination.last_page}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={
                        historyPagination.current_page ===
                        historyPagination.last_page
                      }
                      onClick={() =>
                        fetchHistoryData(historyPagination.current_page + 1)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
          </>
        }
        submitButtonText="Close"
        cancelButtonText="Cancel"
        onSubmit={() => setShowHistoryModal(false)}
        onCancel={() => setShowHistoryModal(false)}
      />

      {/* Bulk Delete Modal */}
      <Modal
        show={showBulkDeleteModal}
        onHide={() => setShowBulkDeleteModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiTrash2 className="me-2" />
            Bulk Delete Prospects
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete {selectedItems.length} selected
            prospects?
          </p>
          <div className="alert alert-warning">
            <strong>Warning:</strong> This action cannot be undone. All selected
            entries will be permanently deleted.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowBulkDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBulkDelete}>
            Delete {selectedItems.length} Entries
          </Button>
        </Modal.Footer>
      </Modal>
      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />
    </React.Fragment>
  );
};

CrmProspectsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmProspectsManagement;
