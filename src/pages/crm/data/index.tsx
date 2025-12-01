import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import CrmDataFilters from "@components/filters/CrmDataFilters";
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
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
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

// Filter Bar Component (from crm-new.tsx design)
interface FilterBarProps {
  quickFilters: { id: string; label: string; count: number; variant?: string; color?: string; activeColor?: string; icon?: React.ReactNode }[];
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
  advancedFilterCount = 0
}) => {
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3">
          {/* Left Side: Quick Filter Buttons */}
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map(filter => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color || filter.activeColor;

              // Determine button styles
              const buttonStyle: React.CSSProperties = {};
              if (hasCustomColor) {
                if (isActive) {
                  const bgColor = filter.activeColor || filter.color;
                  buttonStyle.background = '#fff';
                  buttonStyle.borderColor = bgColor;
                  buttonStyle.color = bgColor;
                } else {
                  buttonStyle.background = '#fff';
                  buttonStyle.borderColor = filter.color;
                  buttonStyle.color = filter.color;
                  buttonStyle.opacity = '0.7';
                }
              }

              return (
                <Button
                  key={filter.id}
                  variant={hasCustomColor ? undefined : (isActive ? (filter.variant || 'primary') : 'outline-secondary')}
                  onClick={() => onFilterChange(filter.id)}
                  className="d-flex align-items-center gap-2"
                  style={hasCustomColor ? buttonStyle : undefined}
                >
                  {filter.icon && <span className="d-flex align-items-center">{filter.icon}</span>}
                  {filter.label}
                  <Badge
                    bg={isActive ? 'light' : 'light'}
                    text={isActive ? 'dark' : 'dark'}
                    className="ms-2"
                  >
                    {filter.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Right Side: Search and Filters */}
          <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
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
                <FiSearch size={16} />
              </Button>
            </InputGroup>
            <Button 
              variant={showAdvancedFilters ? 'primary' : 'outline-secondary'}
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

const CrmProspectsManagement = () => {
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
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
  const [dashboardStats, setDashboardStats] = useState({
    callsInNextHour: 0,
    callsInNext24Hours: 0,
    overdueCalls: 0,
    assignedEntries: 0,
    unassignedEntries: 0,
    total_scheduled:0,
    not_scheduled:0,
    total_records:0
  });
  const [showProspectsAnalytics, setShowProspectsAnalytics] = useState(false);
  const [showAllProspectStats, setShowAllProspectStats] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [prospectsSearch, setProspectsSearch] = useState('');

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
          filters: { ids: batch},
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

  // Calculate dashboard statistics using real data
  const calculateDashboardStats = useCallback(async () => {
    try {
      // Extract campaign IDs and tags from current filters
      const campaignIds = currentFilters.campaign_id
        ? currentFilters.campaign_id.map((id: string) => parseInt(id))
        : [];
      const tags = currentFilters.tags || [];

      // Get real counts from API with current filters
      const counts = await getCrmDataCounts(campaignIds, tags);

      return {
        callsInNextHour: counts.scheduled_calls?.next_hour || 0,
        callsInNext24Hours: counts.scheduled_calls?.next_24_hours || 0,
        overdueCalls: counts.scheduled_calls?.overdue || 0,
        assignedEntries: counts.summary.assigned_records,
        unassignedEntries: counts.summary.unassigned_records,
        total_scheduled: counts.scheduled_calls?.total_scheduled || 0,
        not_scheduled: counts.scheduled_calls?.not_scheduled || 0,
        total_records: counts.summary.total_records || 0,
      };
    } catch (error) {
      console.error("Failed to get dashboard stats:", error);
      // Fallback to static data
      return {
        callsInNextHour: 0,
        callsInNext24Hours: 0,
        overdueCalls: 0,
        assignedEntries: 0,
        unassignedEntries: 0,
        total_scheduled: 0,
        not_scheduled: 0,
        total_records: 0,
      };
    }
  }, [currentFilters]);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  // Fetch extensions data
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_DATA_MANAGEMENT);
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
  
  // Load dashboard stats
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const stats = await calculateDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      }
    };
    loadDashboardStats();
  }, [calculateDashboardStats, refreshKey, currentFilters]);

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

  // Fetch prospects data for GenericListPage
  const fetchCrmData = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const params: any = {
        page,
        per_page: perPage,
      };
      console.log("ZE PARAMS", params);

      // Use search from filters if available, otherwise use the search parameter
      const searchTerm = memoizedFilters.search || search;
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add filter parameters matching the Laravel controller
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

      params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;
      console.log("Sending params with module_slug:", params);

      const response = await getCrmData(params);
      console.log("Prospects Response:", response);

      // Transform to GenericListPage expected format
      return {
        dataList: response.data || [],
        meta: {
          total: response.pagination.total || 0,
          current_page: response.pagination.current_page || page,
          per_page: response.pagination.per_page || perPage,
          last_page: response.pagination.last_page || 1,
        },
      };
    },
    [memoizedFilters]
  );

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

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      errors.push("File size must be less than 10MB");
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

      // Extract campaign IDs from selected options
      const campaignIds = Array.from(selectedCampaigns).map(
        (campaign) => campaign.value
      );

      // Extract tag values from selected options
      const tagValues = Array.from(fieldTags).map((tag) => tag.value);

      const response = await uploadCrmDataCsv(
        selectedFile,
        campaignIds,
        tagValues,
        assignToCampaignUsers
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSelectedFile(null);
      setSelectedCampaigns([]);
      setFieldTags([]);
      setAssignToCampaignUsers(false);
      setShowUploadModal(false);
      setUploadProgress(0);

      // Refresh data
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Upload error:", error);
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
    window.open(`tel:${phone}`, "_self");
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
      toast.success("Redirecting to create lead page with pre-filled prospect data...");
      window.location.href = `/crm/leads/create?crm_data_id=${selectedDataItem.id}`;
    } else {
      toast.success("After call data saved successfully! No lead generated.");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("After Call Successful!");
      setSuccessModalDescription("The after call data has been successfully saved.");
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
        userExtension
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
                <span className="status-badge primary">{props.campaign?.name}</span>
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
          const oneWeekAgo = moment().subtract(7, 'days');
          const randomDays = Math.floor(Math.random() * 7);
          const randomHours = Math.floor(Math.random() * 24);
          const randomMinutes = Math.floor(Math.random() * 60);
          
          const lastCalled = oneWeekAgo
            .add(randomDays, 'days')
            .add(randomHours, 'hours')
            .add(randomMinutes, 'minutes')
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

      ...(session?.user?.permissions?.includes('view-crm-data-management') ? [
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
      ] : []),

     
      {
        key: "call_action",
        name: "Call",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex gap-1">
           
           {session?.user?.permissions?.includes('call-service-crm-data-management') && (
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
            
            {session?.user?.permissions?.includes('call-service-crm-data-management') && (
              props.scheduled_call_at ? (
                <Button
                  variant="warning"
                  size="sm"
                  className="app-button"
                  onClick={() => handleUnscheduleCall(props)}
                  title="Unschedule Call"
                >
                  <FiX size={14} />
                </Button>
              ) : (
                <Button
                  variant="info"
                  className="app-button"
                  size="sm"
                  onClick={() => handleScheduleCall(props)}
                  title="Schedule Call"
                >
                  <FiCalendar size={14} />
                </Button>
              )
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

  return (
    <React.Fragment>
      <style jsx>{`
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
      `}</style>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Prospects"
      />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Prospects</h2>
          <p className="text-muted mb-0">Manage your prospects and schedule calls</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button 
            variant={showProspectsAnalytics ? "primary" : "outline-secondary"}
            onClick={() => setShowProspectsAnalytics(!showProspectsAnalytics)}
          >
            <FiDatabase size={16} className="me-2" />
            {showProspectsAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </Button>
          {session?.user?.permissions?.includes('view-history-crm-data-management') && (
            <Button
              variant="outline-secondary"
              onClick={() => setShowHistoryModal(true)}
            >
              <FiClock className="me-2" />
              Activity History
            </Button>
          )}
          {session?.user?.permissions?.includes('data-assignment-crm-data-management') && (
            <Button variant="outline-success" onClick={handleDataAssignment}>
              <FiUsers className="me-2" />
              Data Assignment
            </Button>
          )}
          {session?.user?.permissions?.includes('call-service-crm-data-management') && (
            <Button
              variant="outline-info"
              onClick={() => setShowAfterCallModal(true)}
            >
              <FiPhone className="me-2" />
              After Call
            </Button>
          )}
          {session?.user?.permissions?.includes('add-crm-data-management') && (
            <Button variant="outline-primary" onClick={() => setShowUploadModal(true)}>
              <FiUpload className="me-2" />
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
                  title="Total Records"
                  value={dashboardStats.total_records}
                  icon={<Users size={24} />}
                  color="primary"
                />
              </Col>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard 
                  title="Scheduled"
                  value={dashboardStats.total_scheduled}
                  icon={<Calendar size={24} />}
                  color="success"
                />
              </Col>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard 
                  title="Not Scheduled"
                  value={dashboardStats.not_scheduled}
                  icon={<XCircle size={24} />}
                  color="secondary"
                />
              </Col>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard 
                  title="Next Hour"
                  value={dashboardStats.callsInNextHour}
                  icon={<ClockIcon size={24} />}
                  color="info"
                />
              </Col>
              {showAllProspectStats && (
                <>
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard 
                      title="Next 24h"
                      value={dashboardStats.callsInNext24Hours}
                      icon={<Calendar size={24} />}
                      color="warning"
                    />
                  </Col>
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard 
                      title="Overdue Calls"
                      value={dashboardStats.overdueCalls}
                      icon={<AlertCircleIcon size={24} />}
                      color="danger"
                    />
                  </Col>
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard 
                      title="Assigned Entries"
                      value={dashboardStats.assignedEntries}
                      icon={<UserPlus size={24} />}
                      color="primary"
                    />
                  </Col>
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard 
                      title="Unassigned Entries"
                      value={dashboardStats.unassignedEntries}
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
        {session?.user?.permissions?.includes('list-crm-data-management') && (
          <FilterBar
            quickFilters={[
              { id: 'all', label: 'All Prospects', count: dashboardStats.total_records, color: '#6c757d', activeColor: '#0d6efd', icon: <Users size={16} /> },
              { id: 'assigned', label: 'Assigned', count: dashboardStats.assignedEntries, color: '#0dcaf0', activeColor: '#0dcaf0', icon: <UserPlus size={16} /> },
              { id: 'unassigned', label: 'Unassigned', count: dashboardStats.unassignedEntries, color: '#fd7e14', activeColor: '#fd7e14', icon: <FiUser size={16} /> },
              { id: 'scheduled', label: 'Scheduled', count: dashboardStats.total_scheduled, color: '#20c997', activeColor: '#20c997', icon: <FiCalendar size={16} /> },
              { id: 'overdue', label: 'Overdue', count: dashboardStats.overdueCalls, color: '#dc3545', activeColor: '#dc3545', icon: <FiAlertCircle size={16} /> },
            ]}
            activeFilter={activeFilter}
            onFilterChange={(filterId) => setActiveFilter(filterId)}
            searchValue={prospectsSearch}
            onSearchChange={(value) => {
              setProspectsSearch(value);
              handleFiltersChange({...currentFilters, search: value});
            }}
            onSearch={() => handleFiltersChange({...currentFilters, search: prospectsSearch})}
            searchPlaceholder="Search prospects by name, phone, email..."
            showAdvancedFilters={showAdvancedFilters}
            onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
            advancedFilterCount={Object.keys(currentFilters).filter(key => {
              const val = currentFilters[key];
              if (Array.isArray(val)) return val.length > 0;
              if (typeof val === 'object' && val !== null) return (val as any).start || (val as any).end;
              return val;
            }).length}
          />
        )}

        {/* Advanced Filters */}
        {showAdvancedFilters && session?.user?.permissions?.includes('list-crm-data-management') && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <CrmDataFilters onFiltersChange={handleFiltersChange} />
            </Card.Body>
          </Card>
        )}

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="d-flex justify-content-end gap-2 mb-3">
            <Button
              variant="danger"
              onClick={() => setShowBulkDeleteModal(true)}
            >
              <FiTrash2 className="me-2" />
              Delete Selected ({selectedItems.length})
            </Button>
          </div>
        )}

       
        
        
        {session?.user?.permissions?.includes('list-crm-data-management') && (
            <GenericListPage
                  columns={columns}
                  fetchData={fetchCrmData}
                  title="Prospects"
                  searchPlaceholder="Search prospects..."
                  defaultPageSize={15}
                  filters={memoizedFilters}
                  refreshKey={refreshKey}
                  search={false}
                  rowSelection={false}
                  onSelectionChange={handleItemSelection}
                  clearSelectedRows={clearSelectedRows}
                  tableStyle="table-style-2"

                />
                )}
      </div>

      {/* Upload Modal */}
      

      <FormModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        title="Upload Prospects"
        desc="Please fill the details below to upload the prospects."
        formHtml={
          <>
          <div
            className={`border-2 border-dashed rounded p-4 text-center ${
              dragActive ? "border-primary bg-light" : "border-secondary"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {selectedFile ? (
              <div className="d-flex flex-column align-items-center">
                <FiDatabase
                  className="text-success mb-3"
                  style={{ fontSize: "3rem" }}
                />
                <p className="mt-2 mb-1">
                  <strong>{selectedFile.name}</strong>
                </p>
                <p className="text-muted small mb-3">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="app-button"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center">
                <FiUpload className="text-muted mb-3" style={{ fontSize: "3rem" }} />
                <p className="mt-2 mb-2">Drag and drop your CSV file here</p>
                <p className="text-muted small mb-3">or</p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="app-button"
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  Browse Files
                </Button>
                <input
                  id="fileInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <Form.Group className="mt-3">
            <Form.Label>Target Campaigns (Optional)</Form.Label>
            <CreatableSelect
              isMulti
              value={selectedCampaigns}
              onChange={(selected) => setSelectedCampaigns(selected || [])}
              options={availableCampaigns}
              placeholder="Choose which campaigns this data belongs to..."
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
              <strong>Pro Tip:</strong> Select specific campaigns to categorize
              your data. This helps with organization and targeted marketing
              efforts. Data will be automatically distributed among campaign
              users.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mt-3">
            <Form.Label>User Assignment Strategy</Form.Label>
            <div>
              <Form.Check
                type="radio"
                id="assign-campaign-users"
                name="assignToCampaignUsers"
                label="Auto-assign to campaign team members"
                value="true"
                checked={assignToCampaignUsers === true}
                onChange={() => setAssignToCampaignUsers(true)}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="no-assign-campaign-users"
                name="assignToCampaignUsers"
                label="Keep unassigned for manual distribution"
                value="false"
                checked={assignToCampaignUsers === false}
                onChange={() => setAssignToCampaignUsers(false)}
              />
            </div>
            <Form.Text className="text-muted">
              <strong>Auto-assign:</strong> Data will be automatically
              distributed among users in the selected campaigns.{" "}
              <strong>Manual:</strong> Data remains unassigned for you to
              distribute later using the Data Assignment tool.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mt-3">
            <Form.Label>Data Tags (Optional)</Form.Label>
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
              <strong>Organize:</strong> Add descriptive tags like "hot-lead",
              "follow-up", or "qualified" to help categorize and filter your
              data later. You can create new tags by typing them.
            </Form.Text>
          </Form.Group>

          <Alert variant="info" className="mt-3">
            <strong>📋 Import Guidelines:</strong>
            <ul className="mb-0 mt-2">
              <li>
                <strong>Headers:</strong> First row must contain column headers
              </li>
              <li>
                <strong>Phone Column:</strong> Include a "phone" column (case
                insensitive) for contact information
              </li>
              <li>
                <strong>File Size:</strong> Maximum 10MB per file
              </li>
              <li>
                <strong>Formats:</strong> CSV and TXT files supported
              </li>
              <li>
                <strong>Data Quality:</strong> Clean, valid data imports faster
                and works better
              </li>
            </ul>
          </Alert>
          </>
        }
        submitButtonText="Upload File"
        cancelButtonText="Cancel"
        onSubmit={() => handleUpload()}
        onCancel={() => setShowUploadModal(false)}
      />






      {/* View Data Modal */}
     
      <FormModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        title={`View Prospect #${selectedDataItem?.id}`}
        desc="Please fill the details below to view the prospect."
        formHtml={
          <>
           {selectedDataItem && (
            <div>
              <Row>
                <Col className="mb-3" md={6}>
                  <strong>Name:</strong> {selectedDataItem.name || "N/A"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Phone:</strong> {selectedDataItem.phone || "N/A"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Assigned To:</strong>{" "}
                  {selectedDataItem.user_extension
                    ? extensions.find(
                        (extension: any) =>
                          extension.id.toString() ===
                          selectedDataItem.user_extension?.toString()
                      )?.display_name || selectedDataItem.user_extension
                    : "Unassigned"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Status:</strong>{" "}
                  {selectedDataItem.is_viewed ? "Viewed" : "New"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Campaign:</strong>{" "}
                  {availableCampaigns.find(
                    (c) => c.value === selectedDataItem.campaign_id?.toString()
                  )?.label || "No Campaign"}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Last Call Status:</strong>{" "}
                  <Badge bg="success" className="small">
                    Answered
                  </Badge>
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Disposition:</strong>{" "}
                  <Badge bg="primary" className="small">
                    {getCallHistory(selectedDataItem.id)[0]
                      ?.disposition?.replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()) || "Interested"}
                  </Badge>
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Last Called:</strong>{" "}
                  {getCallHistory(selectedDataItem.id)[0]?.calledAt
                    ? moment(
                        getCallHistory(selectedDataItem.id)[0].calledAt
                      ).format("MMM DD, YYYY HH:mm")
                    : moment("2024-01-15T10:30:00Z").format(
                        "MMM DD, YYYY HH:mm"
                      )}
                </Col>
                <Col className="mb-3" md={6}>
                  <strong>Next Call Scheduled:</strong>{" "}
                  <span className="text-success">
                    {moment()
                      .add(Math.floor(Math.random() * 7) + 1, "days")
                      .format("MMM DD, YYYY HH:mm")}
                  </span>
                </Col>
              </Row>

              {/* Custom Data Fields Section */}
              {selectedDataItem.data && Object.keys(selectedDataItem.data).length > 0 && (
                <div className="mt-4">
                  <h6 className="mb-3">Custom Data Fields</h6>
                  <Row>
                    {Object.entries(selectedDataItem.data).map(([key, value]) => (
                      <Col className="mb-3" md={6} key={key}>
                        <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:</strong>{" "}
                        <span className="text-muted">
                          {value !== null && value !== undefined 
                            ? (typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : String(value))
                            : "N/A"}
                        </span>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* Call History Section */}
              <div className="mt-4">
                <h6 className="mb-3">Call History</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Duration</th>
                        <th>End Reason</th>
                        <th>Disposition</th>
                        <th>Recording</th>
                        <th>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCallHistory(selectedDataItem.id).map((call) => {
                        const endReason = callEndReasons.find(
                          (r) => r.value === call.endReason
                        );
                        const dispositionColors = {
                          interested: "success",
                          not_interested: "danger",
                          callback_requested: "warning",
                          no_answer: "secondary",
                          busy: "info",
                          do_not_call: "dark",
                          wrong_number: "light",
                          follow_up: "primary",
                        };
                        return (
                          <tr key={call.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <FiClock className="me-1" size={12} />
                                <span className="small">
                                  {moment(call.calledAt).format(
                                    "MMM DD, HH:mm"
                                  )}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="small">{call.duration}</span>
                            </td>
                            <td>
                              <Badge
                                bg={(endReason?.color as any) || "secondary"}
                                className="small"
                              >
                                {endReason?.label || call.endReason}
                              </Badge>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  (dispositionColors[
                                    call.disposition as keyof typeof dispositionColors
                                  ] as any) || "primary"
                                }
                                className="small"
                              >
                                {call.disposition
                                  ?.replace("_", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() =>
                                  handlePlayRecording(call.recordingUrl)
                                }
                                title="Play Recording"
                              >
                                <FiPlay size={12} />
                              </Button>
                            </td>
                            <td>
                              <div
                                className="small text-muted"
                                style={{
                                  maxWidth: "200px",
                                  whiteSpace: "wrap",
                                }}
                              >
                                {call.comment}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          </>
        }
        submitButtonText="Close"
        cancelButtonText="Cancel"
        onSubmit={() => setShowViewModal(false)}
        onCancel={() => setShowViewModal(false)}
      
      />







      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiTrash2 className="me-2" />
            Delete Prospect
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this prospect entry?</p>
          {itemToDelete && (
            <div className="alert alert-warning">
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
          )}
          <p className="text-danger">
            <strong>This action cannot be undone.</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Entry
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Data Assignment Success Modal */}
      <FormModal
        show={showDataAssignmentModal}
        onHide={handleDataAssignmentModalClose}
        title="Smart Prospect Distribution"
        desc="Please fill the details below to smart prospect distribution."
        formHtml={
          <>
          <div className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <FiFilter className="me-2 text-primary" />
              <h6 className="mb-0">Step 1: Filter Your Prospects</h6>
            </div>
            <p className="text-muted small mb-3">
              Choose which prospects to assign by filtering by tags and campaigns.
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
                    placeholder="Select tags to filter entries..."
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
                    Only entries with these tags will be considered for
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
                    placeholder="Select campaigns to filter entries..."
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
                    Only entries from these campaigns will be considered for
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
                  id: 'total-entries',
                  title: 'Total Entries',
                  value: assignmentCounts?.total || 0,
                  description: 'Matching your filters'
                },
                {
                  id: 'assigned-entries',
                  title: 'Assigned Entries',
                  value: assignmentCounts?.assigned || 0,
                  description: 'In use by team members'
                },
                {
                  id: 'available-entries',
                  title: 'Available Entries',
                  value: assignmentCounts?.unassigned || 0,
                  description: 'Ready for assignment'
                }
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
                automatically distributed among users in the selected campaigns
                based on their workload and availability.
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
                <strong>Auto-balance:</strong> Entries are distributed evenly.{" "}
                <strong>Custom:</strong> You specify exactly how many entries
                each campaign gets.
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
                      Total to assign: <strong>{totalEntriesToAssign}</strong> |
                      Allocated:{" "}
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
              <strong>Assignment Info:</strong> Prospects will be automatically
              assigned to users within the selected campaigns based on their
              campaign user extensions. The system will distribute prospects
              equally among users in each campaign.
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
                  <option value="callback_requested">Call Back Requested</option>
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
                setAfterCallData({ ...afterCallData, comment: e.target.value })
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
              Select "Yes" if this call resulted in a qualified lead that should
              be created in the CRM system.
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
                  {selectedEntryForSchedule.email || "N/A"}
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
            <strong>Note:</strong> The call will be scheduled and you'll receive
            a reminder at the selected time.
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
                              Uploaded {activity.total_records || 0} entries
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
                              Assigned {activity.total_records || 0} entries
                            </strong>
                          </div>
                          <div className="small text-muted">
                            <strong>To:</strong>{" "}
                            {getNameByExtension(activity.user_extension_done_to) || "Campaign team"}
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
                                    {getNameByExtension(activity.user_extension_done_by) ||
                                      "System"}
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
            prospect entries?
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
