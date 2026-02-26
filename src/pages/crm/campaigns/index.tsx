import "@assets/scss/datatable-style.scss";
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
  getCampaigns,
  deleteCampaign,
  createCampaign,
  updateCampaign,
  getCampaign,
  CampaignMetrics,
  uploadCrmDataCsv,
  getCrmDataTags,
  getCrmDataCounts,
  downloadExampleCsv,
  getIndustries,
  getDealTemplates,
  IndustryData,
  DealTemplateData,
} from "@utils/crm";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Form,
  Card,
  Alert,
  Table,
  Dropdown,
  InputGroup,
} from "react-bootstrap";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiPlus,
  FiCalendar,
} from "react-icons/fi";
import {
  X,
  FileText,
  Megaphone,
  Users,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Target,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit,
  Eye,
  Trash2,
  Calendar,
  Download,
  AlertCircle as AlertCircleIcon,
  Hash,
  Briefcase,
  UserPlus,
  Building2,
} from "lucide-react";
import { toast } from "react-toastify";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { GetHierarchyData } from "@utils/users";
import axiosInstance from "@utils/axios";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";



import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { ModuleSlug, checkRequiredFields } from "@utils/Helper";
import { useSession } from "next-auth/react";
import DatatableActionButton from "@components/DatatableActionButton";
import { Column } from "@components/CustomDataTable";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import moment from "moment";

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
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map((filter) => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color;
              const buttonStyle: React.CSSProperties = {};
              if (hasCustomColor) {
                const bgColor = filter.color;
                if (isActive) {
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
                <Search size={16} />
              </Button>
            </InputGroup>
            <Button
              variant={showAdvancedFilters ? "primary" : "outline-secondary"}
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
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const CrmCampaigns = () => {
  const { data: session } = useSession();

  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [campaignsData, setCampaignsData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics>({
    active_campaigns: 0,
    inactive_campaigns: 0,
  });
  const [totalCampaigns, setTotalCampaigns] = useState(0);

  // UI State
  const [showCampaignsAnalytics, setShowCampaignsAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [campaignsSearch, setCampaignsSearch] = useState("");
  const [selectedCampaignsColumns, setSelectedCampaignsColumns] = useState<
    string[]
  >(() => {
    const saved = localStorage.getItem("campaignsSelectedColumns");
    return saved
      ? JSON.parse(saved)
      : ["name", "status", "dateRange", "campaignUsers", "created"];
  });
  const [campaignsPagination, setCampaignsPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [campaignFilters, setCampaignFilters] = useState({
    status: [] as string[],
    dateFrom: null as string | null,
    dateTo: null as string | null,
    userExtensions: null as string[] | null,
    hasUnassignedProspects: null as boolean | null,
    tags: null as string[] | null,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "active",
    options: {} as Record<string, any>,
  });

  // Campaign fields management
  const [campaignFields, setCampaignFields] = useState<any[]>([]);
  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "string",
    field_options: [] as string[],
    sort_order: 0,
    is_required: false,
  });

  // Extensions and campaign users
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaignUsers, setCampaignUsers] = useState<readonly any[]>([]);

  // Industries and Deal Templates
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [dealTemplates, setDealTemplates] = useState<DealTemplateData[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<readonly any[]>(
    [],
  );
  const [selectedDealTemplate, setSelectedDealTemplate] = useState<any>(null);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fieldTags, setFieldTags] = useState<readonly any[]>([]);
  const [uploadSelectedCampaigns, setUploadSelectedCampaigns] = useState<
    readonly any[]
  >([]);
  const [availableTags, setAvailableTags] = useState<
    Array<{
      value: string;
      label: string;
      id: number;
    }>
  >([]);
  const [availableCampaignsForUpload, setAvailableCampaignsForUpload] =
    useState<
      Array<{
        value: string;
        label: string;
        id: number;
      }>
    >([]);
  const [autoDistributeToUsers, setAutoDistributeToUsers] = useState(false);

  // Data assignment modal states
  const [showDataAssignmentModal, setShowDataAssignmentModal] = useState(false);
  const [assignmentFilterCampaigns, setAssignmentFilterCampaigns] = useState<
    string[]
  >([]);
  const [assignmentFilterTags, setAssignmentFilterTags] = useState<
    readonly any[]
  >([]);
  const [assignmentType, setAssignmentType] = useState<string>("");
  const [assignmentTargetType, setAssignmentTargetType] = useState<
    "campaigns" | "users"
  >("campaigns");
  const [distributionMode, setDistributionMode] = useState<string>("equal");
  const [selectedUserExtensions, setSelectedUserExtensions] = useState<
    readonly any[]
  >([]);
  const [assignToCampaigns, setAssignToCampaigns] = useState<string[]>([]);
  const [recordsToAssign, setRecordsToAssign] = useState<number>(0);
  const [includeAssignedRecords, setIncludeAssignedRecords] =
    useState<boolean>(false);
  const [dataManagementExtensions, setDataManagementExtensions] = useState<
    any[]
  >([]);
  const [assignmentCounts, setAssignmentCounts] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
  });
  const [customDistribution, setCustomDistribution] = useState<
    Record<string, number>
  >({});
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [assigningData, setAssigningData] = useState(false);

  // Fetch extensions data
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_CAMPAIGNS);
        setExtensions(hierarchyData?.extensions || []);
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };

    fetchExtensions();
  }, []);

  // Fetch extensions for CRM data management (for custom extensions assignment)
  useEffect(() => {
    const fetchDataManagementExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(
          ModuleSlug.CRM_DATA_MANAGEMENT,
        );
        setDataManagementExtensions(hierarchyData?.extensions || []);
      } catch (error) {
        console.error("Failed to fetch data management extensions:", error);
      }
    };

    fetchDataManagementExtensions();
  }, []);

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
        setAvailableTags([]);
      }
    };
    loadTags();
  }, [refreshKey]);

  // Load available campaigns for upload
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const campaignsResponse = await getCampaigns({ per_page: 1000 });
        const campaignOptions = campaignsResponse.data.map((campaign) => ({
          value: campaign.id.toString(),
          label: campaign.name,
          id: campaign.id,
        }));
        setAvailableCampaignsForUpload(campaignOptions);
      } catch (error) {
        console.error("Failed to load campaigns:", error);
        setAvailableCampaignsForUpload([]);
      }
    };
    loadCampaigns();
  }, [refreshKey]);

  // Load industries
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const response = await getIndustries({ per_page: 1000 });
        setIndustries(response.data || []);
      } catch (error) {
        console.error("Failed to load industries:", error);
        setIndustries([]);
      }
    };
    loadIndustries();
  }, []);

  // Load deal templates
  useEffect(() => {
    const loadDealTemplates = async () => {
      try {
        const response = await getDealTemplates({ per_page: 1000 });
        setDealTemplates(response.data || []);
      } catch (error) {
        console.error("Failed to load deal templates:", error);
        setDealTemplates([]);
      }
    };
    loadDealTemplates();
  }, []);

  // Helper function to get user names from extensions
  const getUserNames = (userExtensions: any[]) => {
    if (!userExtensions || userExtensions.length === 0) {
      return "No users assigned";
    }

    const maxDisplay = 2; // Show first 2 names
    const userNames = userExtensions
      .map((ue) => {
        const extension = extensions.find((ext) => ext.id == ue.user_extension);
        return (
          extension?.display_name ||
          extension?.name ||
          `Extension ${ue.user_extension}`
        );
      })
      .filter(Boolean);

    if (userNames.length <= maxDisplay) {
      return userNames.join(", ");
    }

    const displayedNames = userNames.slice(0, maxDisplay);
    const remainingCount = userNames.length - maxDisplay;
    return `${displayedNames.join(", ")} +${remainingCount} more`;
  };

  // Save column selection to localStorage
  useEffect(() => {
    localStorage.setItem(
      "campaignsSelectedColumns",
      JSON.stringify(selectedCampaignsColumns),
    );
  }, [selectedCampaignsColumns]);

  // Custom styles for React Select
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "38px",
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

  // Helper function to get user name by extension (for data management)
  const getUserNameByExtension = (extension: string) => {
    const ext = dataManagementExtensions.find(
      (e: any) =>
        e.id?.toString() === extension.trim() ||
        e.extension?.toString() === extension.trim(),
    );
    return ext?.display_name || ext?.name || `Extension ${extension.trim()}`;
  };

  // Get max records based on includeAssignedRecords
  const getMaxRecords = () => {
    return includeAssignedRecords
      ? assignmentCounts.total
      : assignmentCounts.unassigned;
  };

  // Handle number input keydown to prevent invalid characters
  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent: e, E, +, -, . (except for backspace, delete, tab, escape, enter, and arrow keys)
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Handle number input change with validation
  const handleNumberChange = (
    value: string,
    max: number,
    setter: (val: number) => void,
  ) => {
    // Remove any non-numeric characters except empty string
    const cleaned = value.replace(/[^0-9]/g, "");

    if (cleaned === "") {
      setter(0);
      return;
    }

    const numValue = Number.parseInt(cleaned, 10);

    // Ensure non-negative and within max
    if (numValue < 0) {
      setter(0);
    } else if (numValue > max) {
      setter(max);
    } else {
      setter(numValue);
    }
  };

  // Sorting & Pagination Helper Functions
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
    // data is already paginated by backend
    return data;
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

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters((prev) => {
      const mergedFilters = { ...prev, ...filters };
      // Clean up null/undefined values
      for (const key in mergedFilters) {
        if (
          mergedFilters[key] === null ||
          mergedFilters[key] === undefined ||
          (Array.isArray(mergedFilters[key]) && mergedFilters[key].length === 0)
        ) {
          delete mergedFilters[key];
        }
      }
      return mergedFilters;
    });
    setRefreshKey((prev) => prev + 1);
  }, []);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  // Fetch campaigns data
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);

        // Build status filter from activeFilter
        let statusFilter: string[] = [];
        if (activeFilter === "active") {
          statusFilter = ["active"];
        } else if (activeFilter === "inactive") {
          statusFilter = ["inactive"];
        }
        // If activeFilter is 'all', statusFilter remains empty array

        // Combine with advanced filter status if any
        const combinedStatus =
          campaignFilters.status.length > 0
            ? campaignFilters.status
            : statusFilter;

        // Build filters object
        const filters: Record<string, any> = {
          ...memoizedFilters,
        };

        // Add status filter
        if (combinedStatus.length > 0) {
          filters.status =
            combinedStatus.length === 1 ? combinedStatus[0] : combinedStatus;
        }

        // Add date range filters
        if (campaignFilters.dateFrom) {
          filters.date_from = campaignFilters.dateFrom;
        }
        if (campaignFilters.dateTo) {
          filters.date_to = campaignFilters.dateTo;
        }

        // Add user extensions filter
        if (
          campaignFilters.userExtensions &&
          campaignFilters.userExtensions.length > 0
        ) {
          filters.user_extensions = campaignFilters.userExtensions;
        }

        // Add unassigned prospects filter
        if (campaignFilters.hasUnassignedProspects !== null) {
          filters.has_unassigned_prospects =
            campaignFilters.hasUnassignedProspects;
        }

        // Add tags filter (if supported)
        if (campaignFilters.tags && campaignFilters.tags.length > 0) {
          filters.tags = campaignFilters.tags;
        }

        const response = await getCampaigns({
          page: campaignsPagination.currentPage,
          per_page: campaignsPagination.rowsPerPage,
          search: memoizedFilters.search || campaignsSearch || undefined,
          filters: filters,
          module_slug: ModuleSlug.CRM_CAMPAIGNS,
        });

        if (response && response.data) {
          setCampaignsData(response.data);
          console.log("ZEZEZE", response);
          setMetrics(response.metrics);
          setTotalCampaigns(response.total || response.data.length);
        }
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.permissions?.includes("list-crm-campaigns")) {
      loadCampaigns();
    }
  }, [
    refreshKey,
    campaignsPagination,
    memoizedFilters,
    campaignFilters,
    activeFilter,
    campaignsSearch,
    session,
  ]);

  // Modal handlers
  const handleCreateCampaign = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      status: "active",
      options: {},
    });
    setCampaignFields([]);
    setCampaignUsers([]);
    setSelectedIndustries([]);
    setSelectedDealTemplate(null);
    setNewField({
      field_name: "",
      field_type: "string",
      field_options: [],
      sort_order: 0,
      is_required: false,
    });
    setShowCreateModal(true);
  }, []);

  const handleEditCampaign = useCallback(
    async (campaign: any) => {
      try {
        setLoading(true);
        const campaignData = await getCampaign(campaign.id);
        setSelectedCampaign(campaignData);
        setFormData({
          name: campaignData.name || "",
          description: campaignData.description || "",
          start_date: campaignData.start_date
            ? campaignData.start_date.split("T")[0]
            : "",
          end_date: campaignData.end_date
            ? campaignData.end_date.split("T")[0]
            : "",
          status: campaignData.status || "active",
          options: campaignData.options || {},
        });
        setCampaignFields(campaignData.fields || []);

        // Set campaign users from user_extensions
        if (
          campaignData.user_extensions &&
          campaignData.user_extensions.length > 0
        ) {
          const selectedUsers = campaignData.user_extensions.map((ue: any) => {
            const extension = extensions.find(
              (ext) => ext.id == ue.user_extension,
            );
            return {
              value: ue.user_extension,
              label:
                extension?.display_name ||
                extension?.name ||
                ue?.user_extension,
            };
          });

          setCampaignUsers(selectedUsers);
        } else {
          setCampaignUsers([]);
        }

        // Set industries from industries array or industry_ids
        const industriesData = (campaignData as any).industries;
        const industryIds = (campaignData as any).industry_ids;

        if (
          industriesData &&
          Array.isArray(industriesData) &&
          industriesData.length > 0
        ) {
          // Use industries array if available (from API response)
          const selectedIndustriesOptions = industriesData
            .map((industry: any) => ({
              value: industry.id.toString(),
              label: industry.name || `Industry ${industry.id}`,
              id: industry.id,
            }))
            .filter(Boolean);
          setSelectedIndustries(selectedIndustriesOptions);
        } else if (
          industryIds &&
          Array.isArray(industryIds) &&
          industryIds.length > 0
        ) {
          // Fallback to industry_ids if industries array is not available
          const selectedIndustriesOptions = industryIds
            .map((industryId: number) => {
              const industry = industries.find((ind) => ind.id === industryId);
              return {
                value: industryId.toString(),
                label: industry?.name || `Industry ${industryId}`,
                id: industryId,
              };
            })
            .filter(Boolean);
          setSelectedIndustries(selectedIndustriesOptions);
        } else {
          setSelectedIndustries([]);
        }

        // Set deal template from deal_template object or deal_template_id
        const dealTemplateData = (campaignData as any).deal_template;
        const dealTemplateId = (campaignData as any).deal_template_id;

        if (dealTemplateData && dealTemplateData.id) {
          // Use deal_template object if available (from API response)
          setSelectedDealTemplate({
            value: dealTemplateData.id.toString(),
            label:
              dealTemplateData.name || `Deal Template ${dealTemplateData.id}`,
            id: dealTemplateData.id,
          });
        } else if (dealTemplateId) {
          // Fallback to deal_template_id if deal_template object is not available
          const dealTemplate = dealTemplates.find(
            (dt) => dt.id === parseInt(dealTemplateId.toString()),
          );
          setSelectedDealTemplate({
            value: dealTemplateId.toString(),
            label: dealTemplate?.name || `Deal Template ${dealTemplateId}`,
            id: parseInt(dealTemplateId.toString()),
          });
        } else {
          setSelectedDealTemplate(null);
        }

        // Reset newField form
        setNewField({
          field_name: "",
          field_type: "string",
          field_options: [],
          sort_order: 0,
          is_required: false,
        });

        setShowEditModal(true);
      } catch (error) {
        console.error("Failed to fetch campaign:", error);
        toast.error("Failed to fetch campaign details");
      } finally {
        setLoading(false);
      }
    },
    [extensions, industries, dealTemplates],
  );

  const handleViewCampaign = useCallback(async (campaign: any) => {
    try {
      setLoading(true);
      const campaignData = await getCampaign(campaign.id);
      setSelectedCampaign(campaignData);
      setShowViewModal(true);
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
      toast.error("Failed to fetch campaign details");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteCampaign = useCallback((campaign: any) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteCampaign = useCallback(async () => {
    if (!selectedCampaign) return;

    try {
      setLoading(true);
      await deleteCampaign(selectedCampaign.id);
      setShowDeleteModal(false);
      setSelectedCampaign(null);
      toast.success("Campaign deleted successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      toast.error("Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  }, [selectedCampaign]);

  // Helper function to get today's date in YYYY-MM-DD format
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

  // Get minimum date for end date (day after start_date if set, otherwise today)
  const getMinEndDate = useCallback(() => {
    const today = getTodayDate();
    if (formData.start_date) {
      // Calculate the next day after start_date
      const startDate = new Date(formData.start_date);
      startDate.setDate(startDate.getDate() + 1);
      const nextDay = startDate.toISOString().split("T")[0];
      // Return the later of: next day after start_date, or today
      return nextDay > today ? nextDay : today;
    }
    return today;
  }, [formData.start_date, getTodayDate]);

  // Handle start date change with validation
  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStartDate = e.target.value;
      const today = getTodayDate();

      // Only validate future date requirement when creating a new campaign
      if (!showEditModal && newStartDate && newStartDate < today) {
        toast.error("Start date must be today or a future date");
        return;
      }

      setFormData((prev) => {
        // If new start date is after end date, clear end date
        if (prev.end_date && newStartDate && newStartDate >= prev.end_date) {
          return { ...prev, start_date: newStartDate, end_date: "" };
        }
        return { ...prev, start_date: newStartDate };
      });
    },
    [getTodayDate, showEditModal],
  );

  // Handle end date change with validation
  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEndDate = e.target.value;
      const minEndDate = getMinEndDate();

      // Only validate minimum date requirement when creating a new campaign
      if (!showEditModal && newEndDate && newEndDate < minEndDate) {
        toast.error(
          `End date must be after ${new Date(formData.start_date || minEndDate).toLocaleDateString()}`,
        );
        return;
      }

      // Always validate that end date is after start date
      if (
        formData.start_date &&
        newEndDate &&
        newEndDate <= formData.start_date
      ) {
        toast.error("End date must be after start date");
        return;
      }

      setFormData((prev) => ({ ...prev, end_date: newEndDate }));
    },
    [formData.start_date, getMinEndDate, showEditModal],
  );

  // Form submission handlers
  const handleFormSubmit = useCallback(async () => {
    // Check required fields using checkRequiredFields helper
    const requiredFields: Array<{
      field: keyof typeof formData;
      name: string;
      required: boolean;
    }> = [
      { field: "name", name: "Campaign Name", required: true },
      { field: "start_date", name: "Start Date", required: true },
      { field: "end_date", name: "End Date", required: true },
    ];

    if (!checkRequiredFields(formData, requiredFields)) {
      return;
    }

    // Validate dates
    const today = getTodayDate();

    // Only validate that dates are in the future when creating a NEW campaign
    // When editing, allow existing past dates but validate date relationships
    if (!showEditModal) {
      // Creating new campaign - dates must be in the future
      if (formData.start_date && formData.start_date < today) {
        toast.error("Start date must be today or a future date");
        return;
      }

      if (formData.end_date && formData.end_date < today) {
        toast.error("End date must be today or a future date");
        return;
      }
    }

    // Always validate date relationships
    if (
      formData.start_date &&
      formData.end_date &&
      formData.start_date >= formData.end_date
    ) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setLoading(true);
      // Filter out empty dropdown options before submitting
      const cleanedFields = campaignFields.map((field) => {
        if (field.field_type === "dropdown" && field.field_options) {
          return {
            ...field,
            field_options: field.field_options.filter(
              (opt: string) => opt.trim() !== "",
            ),
          };
        }
        return field;
      });

      const campaignData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status as "active" | "inactive",
        fields: cleanedFields,
        campaign_users: campaignUsers.map((user) => user.value),
        industry_ids: selectedIndustries.map((ind: any) =>
          parseInt(ind.value || ind.id),
        ),
        deal_template_id: selectedDealTemplate
          ? parseInt(selectedDealTemplate.value || selectedDealTemplate.id)
          : undefined,
      };

      if (showEditModal && selectedCampaign) {
        await updateCampaign(selectedCampaign.id, campaignData);
        toast.success("Campaign updated successfully!");
        setShowEditModal(false);
      } else {
        await createCampaign(campaignData);
        toast.success("Campaign created successfully!");
        setShowCreateModal(false);
      }

      setSelectedCampaign(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to save campaign:", error);
      toast.error(error.message || "Failed to save campaign");
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    campaignFields,
    campaignUsers,
    selectedIndustries,
    selectedDealTemplate,
    showEditModal,
    selectedCampaign,
    getTodayDate,
  ]);

  // Field management functions
  const handleAddField = useCallback(() => {
    if (!newField.field_name.trim()) {
      toast.error("Field name is required");
      return;
    }

    const field = {
      ...newField,
      field_name: newField.field_name.trim(),
      sort_order: campaignFields.length,
    };

    setCampaignFields([...campaignFields, field]);
    setNewField({
      field_name: "",
      field_type: "string",
      field_options: [],
      sort_order: 0,
      is_required: false,
    });
  }, [newField, campaignFields]);

  const handleRemoveField = useCallback(
    (index: number) => {
      setCampaignFields(campaignFields.filter((_, i) => i !== index));
    },
    [campaignFields],
  );

  const handleFieldTypeChange = useCallback(
    (index: number, fieldType: string) => {
      const updatedFields = [...campaignFields];
      updatedFields[index].field_type = fieldType;
      if (fieldType !== "dropdown") {
        updatedFields[index].field_options = [];
      }
      setCampaignFields(updatedFields);
    },
    [campaignFields],
  );

  const handleFieldOptionChange = useCallback(
    (index: number, optionIndex: number, value: string) => {
      const updatedFields = [...campaignFields];
      if (!updatedFields[index].field_options) {
        updatedFields[index].field_options = [];
      }
      updatedFields[index].field_options[optionIndex] = value;
      setCampaignFields(updatedFields);
    },
    [campaignFields],
  );

  const handleAddFieldOption = useCallback(
    (index: number) => {
      const updatedFields = [...campaignFields];
      if (!updatedFields[index].field_options) {
        updatedFields[index].field_options = [];
      }
      // Check if the last option is empty - don't add another empty option
      const options = updatedFields[index].field_options;
      if (options.length > 0 && options[options.length - 1].trim() === "") {
        toast.error(
          "Please fill in the current option before adding a new one",
        );
        return;
      }
      updatedFields[index].field_options.push("");
      setCampaignFields(updatedFields);
    },
    [campaignFields],
  );

  const handleRemoveFieldOption = useCallback(
    (index: number, optionIndex: number) => {
      const updatedFields = [...campaignFields];
      updatedFields[index].field_options.splice(optionIndex, 1);
      setCampaignFields(updatedFields);
    },
    [campaignFields],
  );

  // CSV validation function
  const validateCsvFile = (
    file: File,
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

      // Extract campaign IDs from selected campaigns
      const campaignIds = Array.from(uploadSelectedCampaigns).map(
        (campaign) => campaign.value,
      );

      const response: any = await uploadCrmDataCsv(
        selectedFile,
        campaignIds,
        tagValues,
        autoDistributeToUsers, // Auto-assignment based on user selection
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Parse response
      const responseData = response?.data || {};
      const processedCount = responseData.processed_count || 0;
      const validationFailures = responseData.validation_failures || 0;
      const errors = responseData.errors || [];

      // Show error messages for validation failures
      // if (errors.length > 0) {
      //   errors.forEach((error: string) => {
      //     toast.error(error);
      //   });
      // }

      // Show success message
      if (processedCount > 0) {
        let successMessage = `Successfully processed ${processedCount} record${processedCount !== 1 ? "s" : ""}`;

        if (validationFailures > 0) {
          successMessage += ` with ${validationFailures} validation failure${validationFailures !== 1 ? "s" : ""}`;
        }
        if (validationFailures > 0) {
          toast.warn(successMessage);
        } else {
          toast.success(successMessage);
        }
      } else if (validationFailures > 0) {
        // All records failed validation
        toast.error(
          `Upload failed: All ${validationFailures} record${validationFailures !== 1 ? "s" : ""} failed validation`,
        );
      } else {
        toast.error("Upload completed but no records were processed");
      }

      setSelectedFile(null);
      setFieldTags([]);
      setUploadSelectedCampaigns([]);
      setAutoDistributeToUsers(false);
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

  // Calculate filtered entry counts using API
  const calculateEntryCounts = useCallback(async () => {
    try {
      const campaignIds: number[] = assignmentFilterCampaigns
        .map((c) => {
          const campaignId = parseInt(c);
          return isNaN(campaignId) ? 0 : campaignId;
        })
        .filter((id) => id > 0);

      const tags = assignmentFilterTags.map((tag: any) => tag.value || tag);

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
  }, [assignmentFilterCampaigns, assignmentFilterTags]);

  // Auto-refetch counts when filter dropdowns change
  useEffect(() => {
    const refetchCounts = async () => {
      if (showDataAssignmentModal) {
        try {
          const counts = await calculateEntryCounts();
          setAssignmentCounts(counts);
          if (recordsToAssign === 0 || recordsToAssign > counts.unassigned) {
            setRecordsToAssign(counts.unassigned);
          }
        } catch (error) {
          console.error("Failed to refetch counts:", error);
        }
      }
    };

    refetchCounts();
  }, [
    assignmentFilterCampaigns,
    assignmentFilterTags,
    calculateEntryCounts,
    showDataAssignmentModal,
  ]);

  // Handle data assignment
  const handleDataAssignment = useCallback(async () => {
    try {
      const counts = await calculateEntryCounts();
      setAssignmentCounts(counts);
      setRecordsToAssign(counts.unassigned);
      setShowDataAssignmentModal(true);
    } catch (error) {
      console.error("Failed to get entry counts:", error);
      // Fallback to static data
      setAssignmentCounts({ total: 5000, assigned: 2000, unassigned: 3000 });
      setRecordsToAssign(3000);
      setShowDataAssignmentModal(true);
    }
  }, [calculateEntryCounts]);

  // Handle data assignment submit
  const handleDataAssignmentSubmit = useCallback(async () => {
    if (!assignmentTargetType) {
      toast.error("Please select assignment target (Campaigns or Users)");
      return;
    }

    const maxRecords = getMaxRecords();
    if (recordsToAssign === 0 || recordsToAssign > maxRecords) {
      toast.error(
        `Please enter a valid number of records (max: ${maxRecords})`,
      );
      return;
    }

    if (
      assignmentTargetType === "campaigns" &&
      (!distributionMode || assignToCampaigns.length === 0)
    ) {
      toast.error("Please select distribution mode and target campaigns");
      return;
    }

    // Validate custom distribution if in custom mode
    if (assignmentTargetType === "campaigns" && distributionMode === "custom") {
      const totalCustomAllocation = Object.values(customDistribution).reduce(
        (sum, count) => sum + count,
        0,
      );
      if (totalCustomAllocation !== recordsToAssign) {
        toast.error(
          `Custom allocation must equal total records to assign (${recordsToAssign}). Current total: ${totalCustomAllocation}`,
        );
        return;
      }
    }

    if (
      assignmentTargetType === "users" &&
      selectedUserExtensions.length === 0
    ) {
      toast.error("Please select at least one user");
      return;
    }

    setAssigningData(true);
    try {
      const campaignFilterIds = assignmentFilterCampaigns
        .map((c) => {
          const campaignId = parseInt(c);
          return isNaN(campaignId) ? 0 : campaignId;
        })
        .filter((id) => id > 0);

      const tagIds = assignmentFilterTags
        .map((tag: any) => {
          const tagValue = tag.value || tag;
          const tagOption = availableTags.find((t) => t.value === tagValue);
          return tagOption ? tagOption.id : 0;
        })
        .filter((id) => id > 0);

      if (assignmentTargetType === "campaigns") {
        const targetCampaignIds = assignToCampaigns
          .map((c) => {
            const campaign = availableCampaignsForUpload.find(
              (camp) => camp.label === c,
            );
            return campaign ? parseInt(campaign.value) : 0;
          })
          .filter((id) => id > 0);

        if (targetCampaignIds.length === 0) {
          toast.error("Please select valid campaigns");
          return;
        }

        // Call API with include_assigned parameter
        const payload: any = {
          campaign_ids: targetCampaignIds,
          count: recordsToAssign,
          distribution_mode:
            distributionMode === "custom" ? "custom" : distributionMode,
          include_assigned: includeAssignedRecords,
        };

        if (campaignFilterIds.length > 0) {
          payload.campaign_filter_ids = campaignFilterIds;
        }

        if (tagIds.length > 0) {
          payload.tag_ids = tagIds;
        }

        // Add campaign distribution for custom mode
        if (distributionMode === "custom" && customDistribution) {
          const campaignDistribution: Record<number, number> = {};
          Object.entries(customDistribution).forEach(
            ([campaignValue, count]) => {
              const campaignId = parseInt(campaignValue);
              if (campaignId > 0 && count > 0) {
                campaignDistribution[campaignId] = count;
              }
            },
          );
          payload.campaign_distribution = campaignDistribution;
        }

        const response = await axiosInstance.post(
          "/crm/crm_data/assign",
          payload,
        );

        if (response?.data?.data?.success) {
          // Show toast notification
          toast.success(`Successfully assigned ${recordsToAssign} records!`);

          // Close modal first
          setShowDataAssignmentModal(false);

          // Reset all state to clear the dialog
          setAssignmentFilterCampaigns([]);
          setAssignmentFilterTags([]);
          setAssignmentTargetType("campaigns");
          setAssignmentType("");
          setDistributionMode("equal");
          setAssignToCampaigns([]);
          setSelectedUserExtensions([]);
          setRecordsToAssign(0);
          setIncludeAssignedRecords(false);
          setCustomDistribution({});

          // Show success modal
          setShowSuccessfulModal(true);
          setSuccessModalTitle("Data Assignment Successful!");
          setSuccessModalDescription(
            `Successfully assigned ${recordsToAssign} records!`,
          );

          setRefreshKey((prev) => prev + 1);
        } else {
          toast.error(response.data.message || "Failed to assign data");
        }
      } else {
        // Users assignment
        const extensionArray = selectedUserExtensions
          .map((ext: any) => {
            return (
              ext.value ||
              ext.extension?.id?.toString() ||
              ext.extension?.extension?.toString() ||
              ""
            );
          })
          .filter((ext) => ext.length > 0);

        if (extensionArray.length === 0) {
          toast.error("Please select valid users");
          setAssigningData(false);
          return;
        }

        const payload: any = {
          custom_extensions: extensionArray,
          count: recordsToAssign,
          include_assigned: includeAssignedRecords,
        };

        if (campaignFilterIds.length > 0) {
          payload.campaign_filter_ids = campaignFilterIds;
        }

        if (tagIds.length > 0) {
          payload.tag_ids = tagIds;
        }

        const response = await axiosInstance.post(
          "/crm/crm_data/assign",
          payload,
        );

        if (response?.data?.data?.success) {
          // Show toast notification
          toast.success(`Successfully assigned ${recordsToAssign} records!`);

          // Close modal first
          setShowDataAssignmentModal(false);

          // Reset all state to clear the dialog
          setAssignmentFilterCampaigns([]);
          setAssignmentFilterTags([]);
          setAssignmentTargetType("campaigns");
          setAssignmentType("");
          setDistributionMode("equal");
          setAssignToCampaigns([]);
          setSelectedUserExtensions([]);
          setRecordsToAssign(0);
          setIncludeAssignedRecords(false);
          setCustomDistribution({});

          // Show success modal
          setShowSuccessfulModal(true);
          setSuccessModalTitle("Data Assignment Successful!");
          setSuccessModalDescription(
            `Successfully assigned ${recordsToAssign} records!`,
          );

          setRefreshKey((prev) => prev + 1);
        } else {
          toast.error(response.data.message || "Failed to assign data");
        }
      }
    } catch (error: any) {
      console.error("Assignment error:", error);
      toast.error(error?.response?.data?.message || "Failed to assign data");
    } finally {
      setAssigningData(false);
    }
  }, [
    assignmentTargetType,
    recordsToAssign,
    getMaxRecords,
    distributionMode,
    assignToCampaigns,
    selectedUserExtensions,
    assignmentFilterCampaigns,
    assignmentFilterTags,
    availableTags,
    availableCampaignsForUpload,
    includeAssignedRecords,
    customDistribution,
  ]);

  // Handle data assignment modal close
  const handleDataAssignmentModalClose = useCallback(() => {
    setShowDataAssignmentModal(false);
    setAssignmentFilterCampaigns([]);
    setAssignmentFilterTags([]);
    setAssignmentTargetType("campaigns");
    setAssignmentType("");
    setDistributionMode("equal");
    setAssignToCampaigns([]);
    setSelectedUserExtensions([]);
    setRecordsToAssign(0);
    setIncludeAssignedRecords(false);
    setCustomDistribution({});
  }, []);

  // Define columns
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Campaign Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-medium">{props.name || "Unnamed Campaign"}</div>
            <small className="text-muted">
              {props.description || "No Description"}
            </small>
          </div>
        ),
      },
      {
        key: "status",
        name: "Status",
        selector: (row: any) => row.status,
        sortable: true,
        cell: (props: any) => {
          const status = props.status || "inactive";
          return (
            <span
              className={`status-badge ${status === "active" ? "success" : "danger"}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        key: "date_range",
        name: "Date Range",
        selector: (row: any) => row.start_date,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="d-flex align-items-center">
              <FiCalendar className="me-1" size={14} />
              <small>
                {props.start_date
                  ? new Date(props.start_date).toLocaleDateString()
                  : "No start date"}
              </small>
            </div>
            <div className="text-muted">
              <small>
                to{" "}
                {props.end_date
                  ? new Date(props.end_date).toLocaleDateString()
                  : "No end date"}
              </small>
            </div>
          </div>
        ),
      },
      {
        key: "campaign_users",
        name: "Campaign Users",
        selector: (row: any) => row.user_extensions?.length || 0,
        sortable: true,
        cell: (props: any) => (
          <div>
            <span className="text-muted small">
              {getUserNames(props.user_extensions || [])}
            </span>
            {props.user_extensions && props.user_extensions.length > 0 && (
              <div className="text-muted small">
                {props.user_extensions.length} user
                {props.user_extensions.length !== 1 ? "s" : ""} assigned
              </div>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span>
            {props.created_at
              ? new Date(props.created_at).toLocaleDateString()
              : "Unknown"}
          </span>
        ),
      },
      ...(session?.user?.permissions?.includes("view-crm-campaigns") ||
      session?.user?.permissions?.includes("edit-crm-campaigns") ||
      session?.user?.permissions?.includes("delete-crm-campaigns")
        ? [
            {
              key: "Action",
              name: "ACTION",
              selector: (row: any) => row.id,
              sortable: false,
              cell: (props: any) => (
                <>
                  <DatatableActionButton
                    actions={[
                      ...(session?.user?.permissions?.includes(
                        "view-crm-campaigns",
                      )
                        ? [
                            {
                              label: "View",
                              icon: <FiEye className="me-2" />,
                              onClick: () => handleViewCampaign(props),
                              className: "gap-2",
                            },
                          ]
                        : []),

                      ...(session?.user?.permissions?.includes(
                        "edit-crm-campaigns",
                      )
                        ? [
                            {
                              label: "Edit",
                              icon: <FiEdit className="me-2" />,
                              onClick: () => handleEditCampaign(props),
                            },
                          ]
                        : []),

                      ...(session?.user?.permissions?.includes(
                        "delete-crm-campaigns",
                      )
                        ? [
                            {
                              label: "Delete",
                              icon: <FiTrash2 className="me-2" />,
                              onClick: () => handleDeleteCampaign(props),
                              className: "text-danger",
                            },
                          ]
                        : []),
                    ]}
                  />
                </>
              ),
            },
          ]
        : []),
    ],
    [session?.user?.permissions],
  );

  const getFieldTypeText = (_fieldType: string) => {
    const fieldType = _fieldType.toLowerCase();
    switch (fieldType) {
      case "string":
        return "Text";
      case "integer":
        return "Number";
      case "date":
        return "Date";
      case "email":
        return "Email";
      case "dropdown":
        return "Dropdown";
      default:
        return fieldType;
    }
  };

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .campaigns-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .campaigns-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .campaigns-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .campaigns-table-wrapper .table-responsive table th,
        .campaigns-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .campaigns-table-wrapper .table-responsive table td:last-child,
        .campaigns-table-wrapper .table-responsive table th:last-child {
          max-width: none;
        }
        .campaigns-table-wrapper .table-responsive table td[style*="width"],
        .campaigns-table-wrapper .table-responsive table th[style*="width"] {
          max-width: none;
        }
        .campaigns-table-wrapper .table-responsive table td.description-cell {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Campaigns"
      />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <h2 className="mb-1 fw-bold">Campaigns Management</h2>
          <p className="text-muted mb-0">
            Create and manage marketing campaigns
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {session?.user?.permissions?.includes("list-crm-campaigns") && (
            <Button
              variant={showCampaignsAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowCampaignsAnalytics(!showCampaignsAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showCampaignsAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
          )}
          {session?.user?.permissions?.includes("add-crm-data-management") &&
            session?.user?.permissions?.includes(
              "data-assignment-crm-data-management",
            ) && (
              <Button
                variant="outline-primary"
                onClick={() => setShowUploadModal(true)}
              >
                <Download size={16} className="me-2" />
                Import Contacts
              </Button>
            )}
          {session?.user?.permissions?.includes(
            "data-assignment-crm-data-management",
          ) && (
            <Button variant="outline-success" onClick={handleDataAssignment}>
              <Target size={16} className="me-2" />
              Data Assignment
            </Button>
          )}
          {session?.user?.permissions?.includes("add-crm-campaigns") && (
            <Button variant="primary" onClick={handleCreateCampaign}>
              <FiPlus size={16} className="me-2" />
              New Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Analytics Section - Collapsible */}
      {showCampaignsAnalytics &&
        session?.user?.permissions?.includes("list-crm-campaigns") && (
          <>
            {/* KPI Cards */}
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Total Campaigns"
                  value={totalCampaigns.toString()}
                  icon={<Megaphone size={24} />}
                  color="primary"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Active Campaigns"
                  value={metrics.active_campaigns.toString()}
                  icon={<TrendingUp size={24} />}
                  color="success"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Inactive Campaigns"
                  value={metrics.inactive_campaigns.toString()}
                  icon={<AlertCircle size={24} />}
                  color="warning"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Total Users"
                  value={extensions.length.toString()}
                  icon={<Users size={24} />}
                  color="info"
                />
              </Col>
            </Row>
          </>
        )}

      {/* Filter Bar */}
      {session?.user?.permissions?.includes("list-crm-campaigns") && (
        <FilterBar
          quickFilters={[
            {
              id: "all",
              label: "All Campaigns",
              color: "#6c757d",
              icon: <Megaphone size={16} />,
            },
            {
              id: "active",
              label: "Active",
              color: "#198754",
              icon: <TrendingUp size={16} />,
            },
            {
              id: "inactive",
              label: "Inactive",
              color: "#dc3545",
              icon: <AlertCircle size={16} />,
            },
            {
              id: "assigned",
              label: "Assigned Records",
              color: "#0d6efd",
              icon: <UserPlus size={16} />,
            },
            {
              id: "unassigned",
              label: "Unassigned Records",
              color: "#ffc107",
              icon: <AlertCircle size={16} />,
            },
          ]}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => {
            setActiveFilter(filterId);
            // Handle assigned/unassigned filters
            if (filterId === "assigned") {
              setCampaignFilters((prev) => ({
                ...prev,
                hasUnassignedProspects: false,
              }));
            } else if (filterId === "unassigned") {
              setCampaignFilters((prev) => ({
                ...prev,
                hasUnassignedProspects: true,
              }));
            } else if (filterId !== "assigned" && filterId !== "unassigned") {
              // Clear assigned/unassigned filter for status filters (all, active, inactive)
              setCampaignFilters((prev) => ({
                ...prev,
                hasUnassignedProspects: null,
              }));
            }
            setCampaignsPagination({ ...campaignsPagination, currentPage: 1 });
            setRefreshKey((prev) => prev + 1);
          }}
          searchValue={campaignsSearch}
          onSearchChange={(value) => setCampaignsSearch(value)}
          onSearch={() => {
            handleFiltersChange({ search: campaignsSearch });
            setCampaignsPagination({ ...campaignsPagination, currentPage: 1 });
            setRefreshKey((prev) => prev + 1);
          }}
          searchPlaceholder="Search campaigns by name, description..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() =>
            setShowAdvancedFilters(!showAdvancedFilters)
          }
          advancedFilterCount={
            (campaignFilters.status.length > 0 ? 1 : 0) +
            (campaignFilters.dateFrom ? 1 : 0) +
            (campaignFilters.dateTo ? 1 : 0) +
            (campaignFilters.userExtensions &&
            campaignFilters.userExtensions.length > 0
              ? 1
              : 0) +
            (campaignFilters.tags && campaignFilters.tags.length > 0 ? 1 : 0)
          }
        />
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters &&
        session?.user?.permissions?.includes("list-crm-campaigns") && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Status</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    value={
                      campaignFilters.status.length > 0
                        ? campaignFilters.status.map((s) => ({
                            value: s,
                            label: s.charAt(0).toUpperCase() + s.slice(1),
                          }))
                        : null
                    }
                    onChange={(selected) => {
                      setCampaignFilters((prev) => ({
                        ...prev,
                        status: selected ? selected.map((s) => s.value) : [],
                      }));
                      // Reset activeFilter when using advanced status filter
                      setActiveFilter("all");
                    }}
                    placeholder="Select status..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Date From
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={campaignFilters.dateFrom || ""}
                    onChange={(e) => {
                      const dateValue = e.target.value || null;
                      setCampaignFilters((prev) => ({
                        ...prev,
                        dateFrom: dateValue,
                      }));
                      handleFiltersChange({ date_from: dateValue || null });
                    }}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Date To
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={campaignFilters.dateTo || ""}
                    onChange={(e) => {
                      const dateValue = e.target.value || null;
                      setCampaignFilters((prev) => ({
                        ...prev,
                        dateTo: dateValue,
                      }));
                      handleFiltersChange({ date_to: dateValue || null });
                    }}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Campaign Users
                  </Form.Label>
                  <Select
                    isMulti
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
                    value={
                      campaignFilters.userExtensions &&
                      campaignFilters.userExtensions.length > 0
                        ? campaignFilters.userExtensions.map(
                            (extId: string) => {
                              const extension = extensions.find(
                                (ext: any) => ext.id == extId,
                              );
                              return {
                                value: extId,
                                label:
                                  extension?.display_name ||
                                  extension?.name ||
                                  `Extension ${extId}`,
                              };
                            },
                          )
                        : null
                    }
                    onChange={(selected) => {
                      const extValues = selected
                        ? selected.map((s) => s.value)
                        : null;
                      setCampaignFilters((prev) => ({
                        ...prev,
                        userExtensions: extValues,
                      }));
                      handleFiltersChange({
                        user_extensions: extValues || null,
                      });
                    }}
                    placeholder="Select campaign users..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                <Col md={12}>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setCampaignFilters({
                          status: [],
                          dateFrom: null,
                          dateTo: null,
                          userExtensions: null,
                          hasUnassignedProspects: null,
                          tags: null,
                        });
                        setActiveFilter("all");
                        setCurrentFilters({});
                        setCampaignsPagination({
                          ...campaignsPagination,
                          currentPage: 1,
                        });
                        setRefreshKey((prev) => prev + 1);
                      }}
                    >
                      Reset All Filters
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

      {/* Column Customization */}
      {session?.user?.permissions?.includes("list-crm-campaigns") && (
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
                { key: "name", label: "Campaign Name" },
                { key: "status", label: "Status" },
                { key: "dateRange", label: "Date Range" },
                { key: "campaignUsers", label: "Campaign Users" },
                { key: "created", label: "Created" },
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedCampaignsColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCampaignsColumns([
                          ...selectedCampaignsColumns,
                          col.key,
                        ]);
                      } else {
                        setSelectedCampaignsColumns(
                          selectedCampaignsColumns.filter((c) => c !== col.key),
                        );
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() =>
                  setSelectedCampaignsColumns([
                    "name",
                    "status",
                    "dateRange",
                    "campaignUsers",
                    "created",
                  ])
                }
              >
                Select All
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => {
                  setSelectedCampaignsColumns([
                    "name",
                    "status",
                    "dateRange",
                    "campaignUsers",
                    "created",
                  ]);
                }}
              >
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}

      {/* Campaigns Table */}
      {session?.user?.permissions?.includes("list-crm-campaigns") && (
        <Card
          className="border-0 shadow-sm campaigns-table-wrapper"
          style={{ width: "100%" }}
        >
          <Card.Body className="p-0" style={{ width: "100%" }}>
            <div className="table-responsive">
              <Table
                hover
                className="mb-0"
                style={{ width: "100%", margin: 0, tableLayout: "auto" }}
              >
                <thead className="bg-light">
                  <tr>
                    {selectedCampaignsColumns.includes("name") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() => {
                          const newDirection =
                            campaignsPagination.sortColumn === "name" &&
                            campaignsPagination.sortDirection === "asc"
                              ? "desc"
                              : "asc";
                          setCampaignsPagination({
                            ...campaignsPagination,
                            sortColumn: "name",
                            sortDirection: newDirection,
                            currentPage: 1,
                          });
                        }}
                      >
                        Campaign Name{" "}
                        {renderSortIcon("name", campaignsPagination)}
                      </th>
                    )}
                    {selectedCampaignsColumns.includes("status") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() => {
                          const newDirection =
                            campaignsPagination.sortColumn === "status" &&
                            campaignsPagination.sortDirection === "asc"
                              ? "desc"
                              : "asc";
                          setCampaignsPagination({
                            ...campaignsPagination,
                            sortColumn: "status",
                            sortDirection: newDirection,
                            currentPage: 1,
                          });
                        }}
                      >
                        Status {renderSortIcon("status", campaignsPagination)}
                      </th>
                    )}
                    {selectedCampaignsColumns.includes("dateRange") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() => {
                          const newDirection =
                            campaignsPagination.sortColumn === "start_date" &&
                            campaignsPagination.sortDirection === "asc"
                              ? "desc"
                              : "asc";
                          setCampaignsPagination({
                            ...campaignsPagination,
                            sortColumn: "start_date",
                            sortDirection: newDirection,
                            currentPage: 1,
                          });
                        }}
                      >
                        Date Range{" "}
                        {renderSortIcon("start_date", campaignsPagination)}
                      </th>
                    )}
                    {selectedCampaignsColumns.includes("campaignUsers") && (
                      <th>Campaign Users</th>
                    )}

                    {selectedCampaignsColumns.includes(
                      "campaignsCreatedBy",
                    ) && <th>Created By</th>}

                    {selectedCampaignsColumns.includes("created") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() => {
                          const newDirection =
                            campaignsPagination.sortColumn === "created_at" &&
                            campaignsPagination.sortDirection === "asc"
                              ? "desc"
                              : "asc";
                          setCampaignsPagination({
                            ...campaignsPagination,
                            sortColumn: "created_at",
                            sortDirection: newDirection,
                            currentPage: 1,
                          });
                        }}
                      >
                        Created{" "}
                        {renderSortIcon("created_at", campaignsPagination)}
                      </th>
                    )}
                    <th style={{ width: "120px", minWidth: "120px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // API handles filtering, so we just sort and paginate the data
                    const sorted = sortData(
                      campaignsData,
                      campaignsPagination.sortColumn,
                      campaignsPagination.sortDirection,
                    );
                    const paginated = paginateData(
                      sorted,
                      campaignsPagination.currentPage,
                      campaignsPagination.rowsPerPage,
                    );

                    if (campaignsData.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={selectedCampaignsColumns.length + 1}
                            className="text-center py-4 text-muted"
                          >
                            No campaigns found matching your criteria
                          </td>
                        </tr>
                      );
                    }

                    return paginated.map((campaign) => (
                      <tr key={campaign.id}>
                        {selectedCampaignsColumns.includes("name") && (
                          <td>
                            <div>
                              <div className="fw-semibold">
                                {campaign.name || "Unnamed Campaign"}
                              </div>
                              <div
                                className="small text-muted mt-1 description-cell"
                                title={campaign.description || "No Description"}
                                style={{
                                  maxWidth: "300px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "block",
                                }}
                              >
                                {campaign.description || "No Description"}
                              </div>
                            </div>
                          </td>
                        )}
                        {selectedCampaignsColumns.includes("status") && (
                          <td>
                            <Badge
                              bg={
                                campaign.status === "active"
                                  ? "success"
                                  : "secondary"
                              }
                              className="bg-opacity-10 text-dark"
                            >
                              {campaign.status?.charAt(0).toUpperCase() +
                                campaign.status?.slice(1) || "Inactive"}
                            </Badge>
                          </td>
                        )}
                        {selectedCampaignsColumns.includes("dateRange") && (
                          <td>
                            <div>
                              <div className="fw-semibold small">
                                {campaign.start_date
                                  ? new Date(
                                      campaign.start_date,
                                    ).toLocaleDateString()
                                  : "No start date"}
                              </div>
                              <small className="text-muted">
                                to{" "}
                                {campaign.end_date
                                  ? new Date(
                                      campaign.end_date,
                                    ).toLocaleDateString()
                                  : "No end date"}
                              </small>
                            </div>
                          </td>
                        )}
                        {selectedCampaignsColumns.includes("campaignUsers") && (
                          <td>
                            <span className="text-muted small">
                              {getUserNames(campaign.user_extensions || [])}
                            </span>
                          </td>
                        )}
                        {selectedCampaignsColumns.includes(
                          "campaignsCreatedBy",
                        ) && (
                          <td>
                            <small className="text-muted">
                              {campaign.created_by
                                ? (() => {
                                    const extension = extensions.find(
                                      (ext) =>
                                        ext.id == campaign.created_by ||
                                        ext.extension == campaign.created_by,
                                    );
                                    return (
                                      extension?.display_name ||
                                      extension?.name ||
                                      campaign.created_by
                                    );
                                  })()
                                : "Unknown"}
                            </small>
                          </td>
                        )}
                        {selectedCampaignsColumns.includes("created") && (
                          <td>
                            <small className="text-muted">
                              {campaign.created_at
                                ? new Date(
                                    campaign.created_at,
                                  ).toLocaleDateString()
                                : "Unknown"}
                            </small>
                          </td>
                        )}
                        <td style={{ width: "120px", minWidth: "120px" }}>
                          <div className="d-flex gap-1">
                            {session?.user?.permissions?.includes(
                              "view-crm-campaigns",
                            ) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-1"
                                onClick={() => handleViewCampaign(campaign)}
                                title="View Details"
                              >
                                <Eye size={16} />
                              </Button>
                            )}
                            {session?.user?.permissions?.includes(
                              "edit-crm-campaigns",
                            ) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-1 text-primary"
                                onClick={() => handleEditCampaign(campaign)}
                                title="Edit Campaign"
                              >
                                <Edit size={16} />
                              </Button>
                            )}
                            {session?.user?.permissions?.includes(
                              "delete-crm-campaigns",
                            ) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-1 text-danger"
                                onClick={() => handleDeleteCampaign(campaign)}
                                title="Delete Campaign"
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </Table>
            </div>

            <div className="p-3">
              {renderPaginationControls(
                totalCampaigns,
                campaignsPagination,
                setCampaignsPagination,
                "campaigns",
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Create/Edit Campaign Modal */}
      <Modal
        show={showCreateModal || showEditModal}
        onHide={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedCampaign(null);
          setCampaignUsers([]);
          setSelectedIndustries([]);
          setSelectedDealTemplate(null);
          setNewField({
            field_name: "",
            field_type: "string",
            field_options: [],
            sort_order: 0,
            is_required: false,
          });
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showEditModal
              ? `Edit Campaign: ${selectedCampaign?.name}`
              : "Add New Campaign"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Campaign Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter campaign name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.start_date}
                    onChange={handleStartDateChange}
                    min={
                      showEditModal
                        ? getTodayDate(formData.start_date || "")
                        : getTodayDate()
                    }
                  />
                  <Form.Text className="text-muted">
                    {showEditModal
                      ? "Campaign start date"
                      : "Must be today or a future date"}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.end_date}
                    onChange={handleEndDateChange}
                    min={showEditModal ? undefined : getMinEndDate()}
                  />
                  <Form.Text className="text-muted">
                    Must be after start date
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter campaign description (optional)"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>Product Groups</Form.Label>
                  <Select
                    isMulti
                    value={selectedIndustries}
                    onChange={(selected) =>
                      setSelectedIndustries(selected || [])
                    }
                    options={industries.map((industry) => ({
                      value: industry.id.toString(),
                      label: industry.name,
                      id: industry.id,
                    }))}
                    placeholder="Select product groups..."
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
                    Select one or more product groups for this campaign.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>Deal Template</Form.Label>
                  <Select
                    value={selectedDealTemplate}
                    onChange={(selected) => setSelectedDealTemplate(selected)}
                    options={dealTemplates.map((template) => ({
                      value: template.id.toString(),
                      label: template.name,
                      id: template.id,
                    }))}
                    placeholder="Select deal template..."
                    isClearable
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
                    Select a deal template for this campaign (optional).
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>Campaign Users</Form.Label>
              <Select
                isMulti
                value={campaignUsers}
                onChange={(selected) => setCampaignUsers(selected || [])}
                options={extensions.map(
                  (extension: {
                    id: string;
                    display_name: string;
                    name: string;
                  }) => ({
                    value: extension.id,
                    label:
                      extension.display_name || extension.name || extension.id,
                  }),
                )}
                placeholder="Select users for this campaign..."
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
                Select users who will be assigned to this campaign.
              </Form.Text>
            </Form.Group>

            {/* Campaign Fields Management */}
            <div className="border-top pt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Campaign Fields</h5>
                {/* <Button variant="outline-primary" size="sm" onClick={handleAddField}>
                <FiPlus className="me-1" />
                Add Field
              </Button> */}
              </div>

              {/* Add New Field Form */}
              <Card className="mb-3">
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Control
                        type="text"
                        placeholder="Field name"
                        value={newField.field_name}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            field_name: e.target.value,
                          })
                        }
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={newField.field_type}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            field_type: e.target.value,
                          })
                        }
                      >
                        <option value="string">Text</option>
                        <option value="integer">Number</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="dropdown">Dropdown</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label="Required"
                        checked={newField.is_required}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            is_required: e.target.checked,
                          })
                        }
                      />
                    </Col>
                    <Col md={3}>
                      <Button
                        variant="success"
                        className="app-button"
                        onClick={handleAddField}
                      >
                        Add Field
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Existing Fields */}
              {campaignFields.map((field, index) => (
                <Card key={index} className="mb-2">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={4}>
                        <Form.Control
                          type="text"
                          value={field.field_name}
                          onChange={(e) => {
                            const updatedFields = [...campaignFields];
                            updatedFields[index].field_name = e.target.value;
                            setCampaignFields(updatedFields);
                          }}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Select
                          value={field.field_type}
                          onChange={(e) =>
                            handleFieldTypeChange(index, e.target.value)
                          }
                        >
                          <option value="string">Text</option>
                          <option value="integer">Number</option>
                          <option value="date">Date</option>
                          <option value="email">Email</option>
                          <option value="dropdown">Dropdown</option>
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Form.Check
                          type="checkbox"
                          label="Required"
                          checked={field.is_required || false}
                          onChange={(e) => {
                            const updatedFields = [...campaignFields];
                            updatedFields[index].is_required = e.target.checked;
                            setCampaignFields(updatedFields);
                          }}
                        />
                      </Col>
                      <Col md={3}>
                        <Button
                          variant="danger"
                          className="app-button"
                          onClick={() => handleRemoveField(index)}
                        >
                          <FiTrash2 /> Delete
                        </Button>
                      </Col>

                      <Col md={12} className="mt-3">
                        {field.field_type === "dropdown" && (
                          <div>
                            {field.field_options?.map(
                              (option: string, optionIndex: number) => (
                                <div
                                  key={optionIndex}
                                  className="d-flex mb-3 row align-items-center justify-content-left"
                                >
                                  <Col md={5}>
                                    <Form.Control
                                      type="text"
                                      size="sm"
                                      value={option}
                                      onChange={(e) =>
                                        handleFieldOptionChange(
                                          index,
                                          optionIndex,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Option value"
                                    />
                                  </Col>
                                  <Col md={5}>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      className="app-button"
                                      onClick={() =>
                                        handleRemoveFieldOption(
                                          index,
                                          optionIndex,
                                        )
                                      }
                                    >
                                      Remove Option
                                    </Button>
                                  </Col>
                                </div>
                              ),
                            )}

                            <Button
                              variant="primary"
                              className="app-button"
                              size="sm"
                              onClick={() => handleAddFieldOption(index)}
                            >
                              Add Option
                            </Button>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}

              {campaignFields.length === 0 && (
                <Alert variant="info">
                  No fields added yet. Click "Add Field" to create custom fields
                  for this campaign.
                </Alert>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedCampaign(null);
              setCampaignUsers([]);
              setSelectedIndustries([]);
              setSelectedDealTemplate(null);
              setNewField({
                field_name: "",
                field_type: "string",
                field_options: [],
                sort_order: 0,
                is_required: false,
              });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleFormSubmit()}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : showEditModal
                ? "Update Campaign"
                : "Create Campaign"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Campaign Modal */}
      {selectedCampaign && (
        <Modal
          show={showViewModal}
          onHide={() => {
            setShowViewModal(false);
            setSelectedCampaign(null);
          }}
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
              onClick={() => {
                setShowViewModal(false);
                setSelectedCampaign(null);
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
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>
              {selectedCampaign.name}
            </h3>
            <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
              Campaign Details
            </p>
          </div>

          <Modal.Body style={{ padding: "30px" }}>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Campaign Information Section */}
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
                  <Megaphone size={18} style={{ color: "#4680ff" }} />
                  Campaign Information
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
                      Campaign Name
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      {selectedCampaign.name}
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
                          selectedCampaign.status === "active"
                            ? "success"
                            : "secondary"
                        }
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {selectedCampaign.status?.charAt(0).toUpperCase() +
                          selectedCampaign.status?.slice(1) || "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Description - Full Width Row */}
                {selectedCampaign.description && (
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                      width: "100%",
                      marginBottom: "30px",
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
                      Description
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                        wordWrap: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {selectedCampaign.description}
                    </div>
                  </div>
                )}

                {/* Industries Section */}
                {(() => {
                  const industriesData = (selectedCampaign as any).industries;
                  const industryIds = (selectedCampaign as any).industry_ids;

                  // Use industries array if available, otherwise fallback to industry_ids
                  const industriesToShow =
                    industriesData &&
                    Array.isArray(industriesData) &&
                    industriesData.length > 0
                      ? industriesData
                      : industryIds &&
                          Array.isArray(industryIds) &&
                          industryIds.length > 0
                        ? industryIds.map((id: number) => {
                            const industry = industries.find(
                              (ind) => ind.id === id,
                            );
                            return industry || { id, name: `Industry ${id}` };
                          })
                        : [];

                  if (industriesToShow.length > 0) {
                    return (
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
                          Industries ({industriesToShow.length})
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "12px",
                            marginBottom: "30px",
                          }}
                        >
                          {industriesToShow.map(
                            (industry: any, index: number) => {
                              const industryName =
                                industry.name ||
                                `Industry ${industry.id || industry}`;
                              return (
                                <div
                                  key={index}
                                  style={{
                                    background: "#f8f9fa",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: 500,
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
                                  {industryName}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}

                {/* Deal Template Section */}
                {(() => {
                  const dealTemplateData = (selectedCampaign as any)
                    .deal_template;
                  const dealTemplateId = (selectedCampaign as any)
                    .deal_template_id;

                  // Use deal_template object if available, otherwise fallback to deal_template_id
                  let templateToShow = null;
                  if (dealTemplateData && dealTemplateData.id) {
                    templateToShow = dealTemplateData;
                  } else if (dealTemplateId) {
                    const dealTemplate = dealTemplates.find(
                      (dt) => dt.id === parseInt(dealTemplateId.toString()),
                    );
                    templateToShow = dealTemplate || {
                      id: dealTemplateId,
                      name: `Deal Template ${dealTemplateId}`,
                    };
                  }

                  if (templateToShow) {
                    return (
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
                          Deal Template
                        </div>
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "10px",
                            transition: "all 0.3s",
                            marginBottom: "30px",
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
                            Template Name
                          </div>
                          <div
                            style={{
                              fontSize: "15px",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            {templateToShow.name ||
                              `Deal Template ${templateToShow.id}`}
                          </div>
                          {templateToShow.description && (
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                marginTop: "8px",
                                wordWrap: "break-word",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {templateToShow.description}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}

                {/* Date Information Section */}
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
                  <Calendar size={18} style={{ color: "#4680ff" }} />
                  Date Information
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
                      Date Range
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      {selectedCampaign.start_date && selectedCampaign.end_date
                        ? `${new Date(selectedCampaign.start_date).toLocaleDateString()} - ${new Date(selectedCampaign.end_date).toLocaleDateString()}`
                        : selectedCampaign.start_date
                          ? `Starts: ${new Date(selectedCampaign.start_date).toLocaleDateString()}`
                          : "Not set"}
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
                      {selectedCampaign.created_at
                        ? new Date(
                            selectedCampaign.created_at,
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Campaign Users */}
                {selectedCampaign.user_extensions &&
                  selectedCampaign.user_extensions.length > 0 && (
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
                        <Users size={18} style={{ color: "#4680ff" }} />
                        Campaign Users (
                        {selectedCampaign.user_extensions.length})
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "12px",
                          marginBottom: "30px",
                        }}
                      >
                        {selectedCampaign.user_extensions.map(
                          (ue: any, index: number) => {
                            const extension = extensions.find(
                              (ext) => ext.id == ue.user_extension,
                            );
                            const userName =
                              extension?.display_name ||
                              extension?.name ||
                              `Extension ${ue.user_extension}`;
                            return (
                              <div
                                key={index}
                                style={{
                                  background: "#f8f9fa",
                                  padding: "12px",
                                  borderRadius: "8px",
                                  fontSize: "14px",
                                  fontWeight: 500,
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
                                {userName}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </>
                  )}

                {/* Campaign Fields */}
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
                  Campaign Fields ({selectedCampaign.fields?.length || 0})
                </div>
                {selectedCampaign.fields &&
                selectedCampaign.fields.length > 0 ? (
                  <div className="table-responsive mb-4">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Field Name</th>
                          <th>Type</th>
                          <th>Required</th>
                          <th>Options</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCampaign.fields.map(
                          (field: any, index: number) => (
                            <tr key={index}>
                              <td>{field.field_name}</td>
                              <td>
                                <Badge bg="primary" className="text-capitalize">
                                  {getFieldTypeText(field.field_type)}
                                </Badge>
                              </td>
                              <td>
                                {field.is_required ? (
                                  <Badge bg="danger">Required</Badge>
                                ) : (
                                  <Badge bg="secondary">Optional</Badge>
                                )}
                              </td>
                              <td>
                                {field.field_type === "dropdown" &&
                                field.field_options ? (
                                  <div>
                                    {field.field_options.map(
                                      (option: string, optIndex: number) => (
                                        <Badge
                                          key={optIndex}
                                          bg="info"
                                          className="me-1"
                                        >
                                          {option}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Alert variant="info" className="mb-4">
                    No custom fields defined for this campaign.
                  </Alert>
                )}

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    paddingTop: "20px",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedCampaign(null);
                    }}
                    style={{
                      borderRadius: "8px",
                      padding: "10px 24px",
                      fontWeight: 500,
                    }}
                  >
                    Close
                  </Button>
                  {session?.user?.permissions?.includes(
                    "edit-crm-campaigns",
                  ) && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditCampaign(selectedCampaign);
                      }}
                      style={{
                        borderRadius: "8px",
                        padding: "10px 24px",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Edit size={16} />
                      Edit Campaign
                    </Button>
                  )}
                </div>
              </>
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {/* <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the campaign "{selectedCampaign?.name}"? This action cannot be
          undone and will also delete all associated campaign fields.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteCampaign} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal> */}

      {/* Delete Campaign Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedCampaign(null);
        }}
        onConfirm={confirmDeleteCampaign}
        itemName={selectedCampaign?.name}
        itemType="campaign"
        loading={loading}
        additionalInfo={
          <p className="text-muted small mb-0">
            This action will also delete all associated campaign fields.
          </p>
        }
      />

      {/* Upload Modal */}
      {session?.user?.permissions?.includes("add-crm-data-management") &&
        session?.user?.permissions?.includes("add-crm-data-management") && (
          <Modal
            show={showUploadModal}
            onHide={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
              setFieldTags([]);
              setUploadSelectedCampaigns([]);
              setAutoDistributeToUsers(false);
            }}
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
                    <strong>Phone Column:</strong> Include a "phone" column
                    (case insensitive) for contact information
                  </li>
                  <li>
                    <strong>File Size:</strong> Maximum 2MB per file
                  </li>
                  <li>
                    <strong>Phone Format:</strong> Phone numbers must be in
                    E.164 format (e.g., +1234567890)
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
                  <Form.Label className="fw-semibold">
                    Campaigns (Optional)
                  </Form.Label>
                  <Select
                    isMulti
                    value={uploadSelectedCampaigns}
                    onChange={(selected) =>
                      setUploadSelectedCampaigns(selected || [])
                    }
                    options={availableCampaignsForUpload}
                    placeholder="Select campaigns to assign this data to..."
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
                    Select one or more campaigns to assign the uploaded data to.
                    If no campaigns are selected, the data will be uploaded
                    without campaign assignment.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Tags (Optional)
                  </Form.Label>
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

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Data Distribution
                  </Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      id="auto-distribute-yes"
                      name="autoDistribute"
                      label="Automatically distribute data between campaign users"
                      checked={autoDistributeToUsers === true}
                      onChange={() => setAutoDistributeToUsers(true)}
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      id="auto-distribute-no"
                      name="autoDistribute"
                      label="Do not automatically distribute"
                      checked={autoDistributeToUsers === false}
                      onChange={() => setAutoDistributeToUsers(false)}
                    />
                  </div>
                  <Form.Text className="text-muted">
                    When enabled, uploaded data will be automatically
                    distributed among users assigned to the selected campaigns.
                  </Form.Text>
                </Form.Group>

                <div className="alert alert-warning">
                  <small>
                    <strong>Note:</strong> The data will be uploaded even if
                    some fields remain empty.
                  </small>
                </div>
              </Form>
            </Modal.Body>
            <Modal.Footer className="border-top">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setFieldTags([]);
                  setUploadSelectedCampaigns([]);
                  setAutoDistributeToUsers(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
              >
                {uploading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Download size={16} className="me-2" />
                    Upload & Import
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        )}

      {/* Data Assignment Modal */}
      <Modal
        show={showDataAssignmentModal}
        onHide={handleDataAssignmentModalClose}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header
          closeButton
          style={{ borderBottom: "1px solid #ccc" }}
          className="pb-2"
        >
          <Modal.Title className="d-flex align-items-center gap-2 fs-5 fw-bold text-dark">
            <div className="p-2 bg-primary bg-opacity-10 rounded-3">
              <Target size={20} className="text-primary" />
            </div>
            Data Assignment
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 pb-4">
          <div
            className="alert alert-primary border-0 d-flex align-items-start mb-4 shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)",
              borderLeft: "4px solid #4f46e5",
            }}
          >
            <AlertCircle
              size={20}
              className="text-primary mt-1 me-2 flex-shrink-0"
            />
            <div>
              <strong className="d-block mb-1 text-dark">
                Smart Data Assignment
              </strong>
              <span className="text-muted small">
                Configure filters and assignment criteria to distribute
                prospects efficiently.
              </span>
            </div>
          </div>

          <Form>
            {/* Filter Section */}
            <div
              className="mb-4 p-4 rounded-4 border"
              style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-4">
                <Filter size={18} className="text-primary" />
                <h6 className="mb-0 fw-bold text-dark">Filter Records</h6>
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-muted mb-2">
                      <span className="d-flex align-items-center gap-1">
                        <Megaphone size={14} />
                        Campaign Filter
                      </span>
                    </Form.Label>
                    <Select
                      isMulti
                      options={availableCampaignsForUpload.map((c) => ({
                        value: c.value,
                        label: c.label,
                      }))}
                      value={assignmentFilterCampaigns.map((campaign) => {
                        const campaignOption = availableCampaignsForUpload.find(
                          (c) => c.value === campaign,
                        );
                        return campaignOption
                          ? {
                              value: campaignOption.value,
                              label: campaignOption.label,
                            }
                          : { value: campaign, label: campaign };
                      })}
                      onChange={(selected) =>
                        setAssignmentFilterCampaigns(
                          selected ? selected.map((s) => s.value) : [],
                        )
                      }
                      placeholder="Select campaigns..."
                      styles={customSelectStyles}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-muted mb-2">
                      <span className="d-flex align-items-center gap-1">
                        <Hash size={14} />
                        Tag Filter
                      </span>
                    </Form.Label>
                    <CreatableSelect
                      isMulti
                      options={availableTags}
                      value={assignmentFilterTags}
                      onChange={(selected) =>
                        setAssignmentFilterTags(selected || [])
                      }
                      placeholder="Select or create tags..."
                      styles={customSelectStyles}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Total Records Display with Breakdown */}
              <div
                className="mt-4 p-4 rounded-3"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(74, 222, 128, 0.08) 100%)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                }}
              >
                <Row className="g-3 align-items-center">
                  <Col md={4}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 bg-success bg-opacity-10 rounded-3">
                        <Users size={28} className="text-success" />
                      </div>
                      <div>
                        <small className="text-muted d-block mb-1">
                          Total Records
                        </small>
                        <strong className="fs-3 text-dark">
                          {assignmentCounts.total.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 bg-primary bg-opacity-10 rounded-3">
                        <UserPlus size={28} className="text-primary" />
                      </div>
                      <div>
                        <small className="text-muted d-block mb-1">
                          Assigned
                        </small>
                        <strong className="fs-3 text-dark">
                          {assignmentCounts.assigned.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 bg-warning bg-opacity-10 rounded-3">
                        <AlertCircle size={28} className="text-warning" />
                      </div>
                      <div>
                        <small className="text-muted d-block mb-1">
                          Unassigned
                        </small>
                        <strong className="fs-3 text-dark">
                          {assignmentCounts.unassigned.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Assignment Type Section */}
            <div
              className="mb-4 p-4 rounded-4 border"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-muted mb-2">
                  Assign To <span className="text-danger">*</span>
                </Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    id="assign-to-campaigns"
                    name="assignmentTargetType"
                    label="Campaigns"
                    value="campaigns"
                    checked={assignmentTargetType === "campaigns"}
                    onChange={() => {
                      setAssignmentTargetType("campaigns");
                      setAssignmentType("campaigns");
                      setDistributionMode("equal");
                      setAssignToCampaigns([]);
                      setSelectedUserExtensions([]);
                    }}
                    className="mb-2"
                  />
                  <Form.Check
                    type="radio"
                    id="assign-to-users"
                    name="assignmentTargetType"
                    label="Users"
                    value="users"
                    checked={assignmentTargetType === "users"}
                    onChange={() => {
                      setAssignmentTargetType("users");
                      setAssignmentType("custom");
                      setDistributionMode("");
                      setAssignToCampaigns([]);
                      setSelectedUserExtensions([]);
                    }}
                  />
                </div>
              </Form.Group>

              {/* Conditional Fields for "Assign to Campaigns" */}
              {assignmentTargetType === "campaigns" && (
                <div
                  className="p-4 rounded-3 border-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)",
                  }}
                >
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">
                          Distribution Mode{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Select
                          options={[
                            { value: "equal", label: "Equal Distribution" },
                            {
                              value: "custom",
                              label: "Proportional Distribution",
                            },
                          ]}
                          value={
                            distributionMode
                              ? {
                                  value: distributionMode,
                                  label:
                                    distributionMode === "equal"
                                      ? "Equal Distribution"
                                      : "Proportional Distribution",
                                }
                              : { value: "equal", label: "Equal Distribution" }
                          }
                          onChange={(selected) =>
                            setDistributionMode(selected?.value || "equal")
                          }
                          placeholder="Select distribution mode..."
                          styles={customSelectStyles}
                        />
                        {distributionMode && (
                          <div className="mt-2 p-2 rounded-2 bg-white border">
                            <small className="text-muted d-flex align-items-start gap-2">
                              <AlertCircle
                                size={14}
                                className="mt-1 flex-shrink-0 text-primary"
                              />
                              <span>
                                {distributionMode === "equal" &&
                                  "Records will be distributed equally across all selected campaigns"}
                                {distributionMode === "custom" &&
                                  "You can specify exactly how many records each campaign gets"}
                              </span>
                            </small>
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">
                          Target Campaigns{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Select
                          isMulti
                          options={availableCampaignsForUpload.map((c) => ({
                            value: c.label,
                            label: c.label,
                          }))}
                          value={assignToCampaigns.map((campaign) => ({
                            value: campaign,
                            label: campaign,
                          }))}
                          onChange={(selected) =>
                            setAssignToCampaigns(
                              selected ? selected.map((s) => s.value) : [],
                            )
                          }
                          placeholder="Select campaigns..."
                          styles={customSelectStyles}
                        />
                        {assignToCampaigns.length > 0 && (
                          <div className="mt-2 p-2 rounded-2 bg-white border">
                            <small className="text-muted">
                              <strong>{assignToCampaigns.length}</strong>{" "}
                              campaign
                              {assignToCampaigns.length !== 1 ? "s" : ""}{" "}
                              selected
                            </small>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Custom Distribution UI */}
                  {distributionMode === "custom" &&
                    assignToCampaigns.length > 0 && (
                      <Row className="mt-3">
                        <Col md={12}>
                          <Form.Group>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <Form.Label className="mb-0 fw-semibold small text-muted">
                                Proportional Distribution
                              </Form.Label>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => {
                                  const equalDistribution = Math.floor(
                                    recordsToAssign / assignToCampaigns.length,
                                  );
                                  const remainder =
                                    recordsToAssign % assignToCampaigns.length;
                                  const newCustomDistribution: Record<
                                    string,
                                    number
                                  > = {};

                                  assignToCampaigns.forEach(
                                    (campaign: string, index: number) => {
                                      const campaignOption =
                                        availableCampaignsForUpload.find(
                                          (c) => c.label === campaign,
                                        );
                                      if (campaignOption) {
                                        newCustomDistribution[
                                          campaignOption.value
                                        ] =
                                          equalDistribution +
                                          (index < remainder ? 1 : 0);
                                      }
                                    },
                                  );

                                  setCustomDistribution(newCustomDistribution);
                                }}
                              >
                                Auto-fill Equal
                              </Button>
                            </div>
                            <div className="border rounded p-3 bg-light">
                              <p className="small text-muted mb-3">
                                Total to assign:{" "}
                                <strong>{recordsToAssign}</strong> | Allocated:{" "}
                                <strong>
                                  {Object.values(customDistribution).reduce(
                                    (sum, count) => sum + count,
                                    0,
                                  )}
                                </strong>{" "}
                                | Remaining:{" "}
                                <strong>
                                  {recordsToAssign -
                                    Object.values(customDistribution).reduce(
                                      (sum, count) => sum + count,
                                      0,
                                    )}
                                </strong>
                              </p>
                              {assignToCampaigns.map((campaign: string) => {
                                const campaignOption =
                                  availableCampaignsForUpload.find(
                                    (c) => c.label === campaign,
                                  );
                                if (!campaignOption) return null;
                                return (
                                  <div
                                    key={campaignOption.value}
                                    className="mb-2"
                                  >
                                    <Row>
                                      <Col md={6}>
                                        <Form.Label className="small mb-0">
                                          {campaign}
                                        </Form.Label>
                                      </Col>
                                      <Col md={6}>
                                        <Form.Control
                                          type="number"
                                          min="0"
                                          max={recordsToAssign}
                                          value={
                                            customDistribution[
                                              campaignOption.value
                                            ] || 0
                                          }
                                          onKeyDown={handleNumberKeyDown}
                                          onChange={(e) => {
                                            const max = recordsToAssign;
                                            handleNumberChange(
                                              e.target.value,
                                              max,
                                              (val) => {
                                                setCustomDistribution(
                                                  (prev) => ({
                                                    ...prev,
                                                    [campaignOption.value]: val,
                                                  }),
                                                );
                                              },
                                            );
                                          }}
                                          size="sm"
                                        />
                                      </Col>
                                    </Row>
                                  </div>
                                );
                              })}
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                </div>
              )}

              {/* Conditional Fields for "Assign to Users" */}
              {assignmentTargetType === "users" && (
                <div
                  className="p-4 rounded-3 border-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)",
                  }}
                >
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">
                          Distribution Mode{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Select
                          options={[
                            { value: "equal", label: "Equal Distribution" },
                            {
                              value: "custom",
                              label: "Proportional Distribution",
                            },
                          ]}
                          value={
                            distributionMode
                              ? {
                                  value: distributionMode,
                                  label:
                                    distributionMode === "equal"
                                      ? "Equal Distribution"
                                      : "Proportional Distribution",
                                }
                              : { value: "equal", label: "Equal Distribution" }
                          }
                          onChange={(selected) =>
                            setDistributionMode(selected?.value || "equal")
                          }
                          placeholder="Select distribution mode..."
                          styles={customSelectStyles}
                        />
                        {distributionMode && (
                          <div className="mt-2 p-2 rounded-2 bg-white border">
                            <small className="text-muted d-flex align-items-start gap-2">
                              <AlertCircle
                                size={14}
                                className="mt-1 flex-shrink-0 text-primary"
                              />
                              <span>
                                {distributionMode === "equal" &&
                                  "Records will be distributed equally across all selected campaigns"}
                                {distributionMode === "custom" &&
                                  "You can specify exactly how many records each campaign gets"}
                              </span>
                            </small>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted mb-2">
                          Select Users <span className="text-danger">*</span>
                        </Form.Label>
                        <Select
                          isMulti
                          options={dataManagementExtensions.map((ext: any) => ({
                            value:
                              ext.id?.toString() ||
                              ext.extension?.toString() ||
                              "",
                            label:
                              ext.display_name ||
                              ext.name ||
                              `Extension ${ext.id || ext.extension}`,
                            extension: ext,
                          }))}
                          value={selectedUserExtensions}
                          onChange={(selected) =>
                            setSelectedUserExtensions(selected || [])
                          }
                          placeholder="Select users..."
                          styles={customSelectStyles}
                        />
                        {selectedUserExtensions.length > 0 && (
                          <div className="mt-2 p-2 rounded-2 bg-white border">
                            <small className="text-muted">
                              <strong>{selectedUserExtensions.length}</strong>{" "}
                              user
                              {selectedUserExtensions.length !== 1
                                ? "s"
                                : ""}{" "}
                              selected
                            </small>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}
            </div>

            {/* Number of Records to Assign */}
            <div className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold small text-muted mb-2">
                  Number of Records to Assign{" "}
                  <span className="text-danger">*</span>
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type="number"
                    min="1"
                    max={getMaxRecords()}
                    value={recordsToAssign || ""}
                    onKeyDown={handleNumberKeyDown}
                    onChange={(e) => {
                      const max = getMaxRecords();
                      handleNumberChange(
                        e.target.value,
                        max,
                        setRecordsToAssign,
                      );
                    }}
                    placeholder={`Enter number (max: ${getMaxRecords().toLocaleString()})`}
                    className="border-2 py-2"
                    style={{ paddingRight: "100px" }}
                  />
                  <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                    <small className="text-muted">
                      of {getMaxRecords().toLocaleString()}
                    </small>
                  </div>
                </div>
                <div className="mt-2 d-flex align-items-center gap-2">
                  <div
                    className="flex-grow-1 bg-light rounded-pill overflow-hidden"
                    style={{ height: "6px" }}
                  >
                    <div
                      className="bg-primary h-100 rounded-pill transition-all"
                      style={{
                        width: `${recordsToAssign > 0 && getMaxRecords() > 0 ? (recordsToAssign / getMaxRecords()) * 100 : 0}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <small className="text-muted fw-medium">
                    {recordsToAssign > 0 && getMaxRecords() > 0
                      ? ((recordsToAssign / getMaxRecords()) * 100).toFixed(1)
                      : "0"}
                    %
                  </small>
                </div>
              </Form.Group>
            </div>

            {/* Assignment Settings */}
            <div
              className="mb-4 p-4 rounded-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
              }}
            >
              <h6 className="fw-bold mb-3 text-primary d-flex align-items-center">
                <Briefcase size={18} className="me-2" />
                Assignment Settings
              </h6>
              <div className="p-3 bg-white rounded-3">
                <Form.Label className="fw-semibold text-dark mb-2">
                  Include already assigned records (allow reassignment)
                </Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    id="include-assigned-yes"
                    name="includeAssignedRecords"
                    label="Yes, include already assigned records"
                    checked={includeAssignedRecords === true}
                    onChange={() => {
                      setIncludeAssignedRecords(true);
                      // Reset recordsToAssign if it exceeds new max
                      const newMax = assignmentCounts.total;
                      if (recordsToAssign > newMax) {
                        setRecordsToAssign(newMax);
                      }
                    }}
                    className="mb-2"
                  />
                  <Form.Check
                    type="radio"
                    id="include-assigned-no"
                    name="includeAssignedRecords"
                    label="No, only assign unassigned records"
                    checked={includeAssignedRecords === false}
                    onChange={() => {
                      setIncludeAssignedRecords(false);
                      // Reset recordsToAssign if it exceeds new max
                      const newMax = assignmentCounts.unassigned;
                      if (recordsToAssign > newMax) {
                        setRecordsToAssign(newMax);
                      }
                    }}
                  />
                </div>
                <small className="text-muted d-block mt-2">
                  {includeAssignedRecords
                    ? "Records that are already assigned to other users will be included and reassigned based on the selected criteria."
                    : "Only records that are currently unassigned will be assigned."}
                </small>
              </div>
            </div>

            <div
              className="alert alert-warning border-0 mb-0 d-flex align-items-start"
              style={{
                background:
                  "linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(252, 211, 77, 0.08) 100%)",
                borderLeft: "4px solid #f59e0b",
              }}
            >
              <AlertCircle
                size={18}
                className="text-warning mt-1 me-2 flex-shrink-0"
              />
              <small className="text-dark">
                <strong>Important:</strong> Assignment will be processed
                immediately based on your selected criteria. This action cannot
                be undone.
              </small>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <Button
            variant="light"
            onClick={handleDataAssignmentModalClose}
            disabled={assigningData}
            className="px-4 fw-semibold"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={
              assigningData ||
              !assignmentTargetType ||
              recordsToAssign === 0 ||
              recordsToAssign > getMaxRecords() ||
              (assignmentTargetType === "campaigns" &&
                (!distributionMode || assignToCampaigns.length === 0)) ||
              (assignmentTargetType === "users" &&
                selectedUserExtensions.length === 0)
            }
            onClick={handleDataAssignmentSubmit}
            className="px-4 fw-semibold d-flex align-items-center gap-2"
          >
            {assigningData ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Assigning...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Assign{" "}
                {recordsToAssign > 0
                  ? `${recordsToAssign.toLocaleString()} Records`
                  : "Records"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />
    </React.Fragment>
  );
};

CrmCampaigns.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmCampaigns;
