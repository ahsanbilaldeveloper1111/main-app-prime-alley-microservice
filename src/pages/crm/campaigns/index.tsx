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
  User,
} from 'lucide-react';
import { toast } from "react-toastify";
import Select from "react-select";
import { GetHierarchyData } from "@utils/users";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
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
  Legend
} from 'recharts';

import FormModal from "@pages/partial/FormModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { ModuleSlug } from "@utils/Helper";
import { useSession } from "next-auth/react";
import DatatableActionButton from "@components/DatatableActionButton";
import { Column } from "@components/CustomDataTable";

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
  quickFilters: { id: string; label: string; variant?: string; color?: string; activeColor?: string; icon?: React.ReactNode }[];
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
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map(filter => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color || filter.activeColor;
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
                </Button>
              );
            })}
          </div>

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
                <Search size={16} />
              </Button>
            </InputGroup>
            {/* <Button 
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
            </Button> */}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const CrmCampaigns = () => {

  const { data:session } = useSession();


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
  const [activeFilter, setActiveFilter] = useState('all');
  const [campaignsSearch, setCampaignsSearch] = useState('');
  const [selectedCampaignsColumns, setSelectedCampaignsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('campaignsSelectedColumns');
    return saved ? JSON.parse(saved) : ['name', 'status', 'dateRange', 'campaignUsers', 'created'];
  });
  const [campaignsPagination, setCampaignsPagination] = useState({ currentPage: 1, rowsPerPage: 10, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [campaignFilters, setCampaignFilters] = useState({
    status: [] as string[],
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
  });

  // Extensions and campaign users
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaignUsers, setCampaignUsers] = useState<readonly any[]>([]);

  // Fetch extensions data
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_CAMPAIGNS);
        setExtensions(hierarchyData?.extensions || []);
      } catch (error) {
        console.error('Failed to fetch extensions:', error);
      }
    };

    fetchExtensions();
  }, []);

  // Helper function to get user names from extensions
  const getUserNames = (userExtensions: any[]) => {
    if (!userExtensions || userExtensions.length === 0) {
      return "No users assigned";
    }

    const maxDisplay = 2; // Show first 2 names
    const userNames = userExtensions
      .map(ue => {
        const extension = extensions.find(ext => ext.id == ue.user_extension);
        return extension?.display_name || extension?.name || `Extension ${ue.user_extension}`;
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
    localStorage.setItem('campaignsSelectedColumns', JSON.stringify(selectedCampaignsColumns));
  }, [selectedCampaignsColumns]);

  // Custom styles for React Select
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '38px',
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

  // Sorting & Pagination Helper Functions
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
          Showing {startRow} to {endRow} of {dataLength} {label}
        </div>

        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPaginationState({ ...paginationState, currentPage: 1 })}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPaginationState({ ...paginationState, currentPage: currentPage - 1 })}
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
                  variant={currentPage === pageNum ? 'primary' : 'outline-secondary'}
                  onClick={() => setPaginationState({ ...paginationState, currentPage: pageNum })}
                >
                  {pageNum}
                </Button>
              );
            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
              return <span key={pageNum} className="px-2">...</span>;
            }
            return null;
          })}
          
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setPaginationState({ ...paginationState, currentPage: currentPage + 1 })}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
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

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
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
        if (activeFilter === 'active') {
          statusFilter = ['active'];
        } else if (activeFilter === 'inactive') {
          statusFilter = ['inactive'];
        }
        // If activeFilter is 'all', statusFilter remains empty array
        
        // Combine with advanced filter status if any
        const combinedStatus = campaignFilters.status.length > 0 ? campaignFilters.status : statusFilter;
        
        const response = await getCampaigns({
          page: campaignsPagination.currentPage,
          per_page: campaignsPagination.rowsPerPage,
          search: memoizedFilters.search || undefined,
          filters: {
            ...memoizedFilters,
            status: combinedStatus,
          },
          module_slug: ModuleSlug.CRM_CAMPAIGNS,
        });
        
        if (response && response.data) {
          setCampaignsData(response.data);
          console.log("ZEZEZE", response)
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

    if (session?.user?.permissions?.includes('list-crm-campaigns')) {
      loadCampaigns();
    }
  }, [refreshKey, campaignsPagination, memoizedFilters, campaignFilters, activeFilter, session]);

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
    setNewField({
      field_name: "",
      field_type: "string",
      field_options: [],
      sort_order: 0,
    });
    setShowCreateModal(true);
  }, []);

  const handleEditCampaign = useCallback(async (campaign: any) => {
    try {
      setLoading(true);
      const campaignData = await getCampaign(campaign.id);
      setSelectedCampaign(campaignData);
      setFormData({
        name: campaignData.name || "",
        description: campaignData.description || "",
        start_date: campaignData.start_date ? campaignData.start_date.split('T')[0] : "",
        end_date: campaignData.end_date ? campaignData.end_date.split('T')[0] : "",
        status: campaignData.status || "active",
        options: campaignData.options || {},
      });
      setCampaignFields(campaignData.fields || []);
      
      // Set campaign users from user_extensions
      if (campaignData.user_extensions && campaignData.user_extensions.length > 0) {
        const selectedUsers = campaignData.user_extensions
          .map((ue: any) => {
            const extension = extensions.find(ext => ext.id == ue.user_extension);
              return {
                value: ue.user_extension,
                label: extension?.display_name || extension?.name || ue?.user_extension
              };
          })
          
        setCampaignUsers(selectedUsers);
      } else {
        setCampaignUsers([]);
      }
      
      // Reset newField form
      setNewField({
        field_name: "",
        field_type: "string",
        field_options: [],
        sort_order: 0,
      });
      
      setShowEditModal(true);
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
      toast.error("Failed to fetch campaign details");
    } finally {
      setLoading(false);
    }
  }, [extensions]);

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
  const getTodayDate = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Get minimum date for end date (day after start_date if set, otherwise today)
  const getMinEndDate = useCallback(() => {
    const today = getTodayDate();
    if (formData.start_date) {
      // Calculate the next day after start_date
      const startDate = new Date(formData.start_date);
      startDate.setDate(startDate.getDate() + 1);
      const nextDay = startDate.toISOString().split('T')[0];
      // Return the later of: next day after start_date, or today
      return nextDay > today ? nextDay : today;
    }
    return today;
  }, [formData.start_date, getTodayDate]);

  // Handle start date change with validation
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    const today = getTodayDate();
    
    // Only validate future date requirement when creating a new campaign
    if (!showEditModal && newStartDate && newStartDate < today) {
      toast.error("Start date must be today or a future date");
      return;
    }
    
    setFormData(prev => {
      // If new start date is after end date, clear end date
      if (prev.end_date && newStartDate && newStartDate >= prev.end_date) {
        return { ...prev, start_date: newStartDate, end_date: "" };
      }
      return { ...prev, start_date: newStartDate };
    });
  }, [getTodayDate, showEditModal]);

  // Handle end date change with validation
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    const minEndDate = getMinEndDate();
    
    // Only validate minimum date requirement when creating a new campaign
    if (!showEditModal && newEndDate && newEndDate < minEndDate) {
      toast.error(`End date must be after ${new Date(formData.start_date || minEndDate).toLocaleDateString()}`);
      return;
    }
    
    // Always validate that end date is after start date
    if (formData.start_date && newEndDate && newEndDate <= formData.start_date) {
      toast.error("End date must be after start date");
      return;
    }
    
    setFormData(prev => ({ ...prev, end_date: newEndDate }));
  }, [formData.start_date, getMinEndDate, showEditModal]);

  // Form submission handlers
  const handleFormSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error("Campaign name is required");
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
    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setLoading(true);
      const campaignData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status as 'active' | 'inactive',
        fields: campaignFields,
        campaign_users: campaignUsers.map(user => user.value),
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
  }, [formData, campaignFields, campaignUsers, showEditModal, selectedCampaign, getTodayDate]);

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
    });
  }, [newField, campaignFields]);

  const handleRemoveField = useCallback((index: number) => {
    setCampaignFields(campaignFields.filter((_, i) => i !== index));
  }, [campaignFields]);

  const handleFieldTypeChange = useCallback((index: number, fieldType: string) => {
    const updatedFields = [...campaignFields];
    updatedFields[index].field_type = fieldType;
    if (fieldType !== "dropdown") {
      updatedFields[index].field_options = [];
    }
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  const handleFieldOptionChange = useCallback((index: number, optionIndex: number, value: string) => {
    const updatedFields = [...campaignFields];
    if (!updatedFields[index].field_options) {
      updatedFields[index].field_options = [];
    }
    updatedFields[index].field_options[optionIndex] = value;
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  const handleAddFieldOption = useCallback((index: number) => {
    const updatedFields = [...campaignFields];
    if (!updatedFields[index].field_options) {
      updatedFields[index].field_options = [];
    }
    updatedFields[index].field_options.push("");
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  const handleRemoveFieldOption = useCallback((index: number, optionIndex: number) => {
    const updatedFields = [...campaignFields];
    updatedFields[index].field_options.splice(optionIndex, 1);
    setCampaignFields(updatedFields);
  }, [campaignFields]);

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
            <span className={`status-badge ${status === "active" ? "success" : "danger"}`}>
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
                {props.user_extensions.length} user{props.user_extensions.length !== 1 ? 's' : ''} assigned
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
      ...(session?.user?.permissions?.includes('view-crm-campaigns') || session?.user?.permissions?.includes('edit-crm-campaigns') || session?.user?.permissions?.includes('delete-crm-campaigns') ? [
      {
        key: "Action",
        name: "ACTION",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <>
          
          <DatatableActionButton
            actions={[
              ...(session?.user?.permissions?.includes('view-crm-campaigns') ? [{
                label: 'View',
                icon: <FiEye className="me-2" />,
                onClick: () => handleViewCampaign(props),
                className: 'gap-2'
              }] : []),

              ...(session?.user?.permissions?.includes('edit-crm-campaigns') ? [{
                label: 'Edit',
                icon: <FiEdit className="me-2" />,
                onClick: () => handleEditCampaign(props),
              }] : []),

              ...(session?.user?.permissions?.includes('delete-crm-campaigns') ? [{
                label: 'Delete',
                icon: <FiTrash2 className="me-2" />,
                onClick: () => handleDeleteCampaign(props),
                className: 'text-danger',
              }] : []),

            ]}
          />
          </>
        ),
      }] : []),
    ],
    [session?.user?.permissions]
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
      <style dangerouslySetInnerHTML={{__html: `
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
      `}} />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Campaigns"
      />

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <h2 className="mb-1 fw-bold">Campaigns Management</h2>
          <p className="text-muted mb-0">Create and manage marketing campaigns</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {session?.user?.permissions?.includes('list-crm-campaigns') && (
            <Button 
              variant={showCampaignsAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowCampaignsAnalytics(!showCampaignsAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showCampaignsAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
          )}
          {session?.user?.permissions?.includes('add-crm-campaigns') && (
            <Button 
              variant="primary"
              onClick={handleCreateCampaign}
            >
              <FiPlus size={16} className="me-2" />
              New Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Analytics Section - Collapsible */}
      {showCampaignsAnalytics && session?.user?.permissions?.includes('list-crm-campaigns') && (
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
      {session?.user?.permissions?.includes('list-crm-campaigns') && (
        <FilterBar
          quickFilters={[
            { id: 'all', label: 'All Campaigns', color: '#6c757d', activeColor: '#0d6efd', icon: <Megaphone size={16} /> },
            { id: 'active', label: 'Active', color: '#198754', activeColor: '#0d6efd', icon: <TrendingUp size={16} /> },
            { id: 'inactive', label: 'Inactive', color: '#dc3545', activeColor: '#0d6efd', icon: <AlertCircle size={16} /> },
          ]}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => {
            setActiveFilter(filterId);
            setCampaignsPagination({ ...campaignsPagination, currentPage: 1 });
            setRefreshKey(prev => prev + 1);
          }}
          searchValue={campaignsSearch}
          onSearchChange={(value) => setCampaignsSearch(value)}
          onSearch={() => {
            handleFiltersChange({ ...currentFilters, search: campaignsSearch });
            setCampaignsPagination({ ...campaignsPagination, currentPage: 1 });
            setRefreshKey(prev => prev + 1);
          }}
          searchPlaceholder="Search campaigns by name, description..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={campaignFilters.status.length}
        />
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && session?.user?.permissions?.includes('list-crm-campaigns') && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label className="small fw-bold mb-2">Status</Form.Label>
                <Select
                  isMulti
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  value={campaignFilters.status.length > 0 
                    ? campaignFilters.status.map(s => ({ 
                        value: s, 
                        label: s.charAt(0).toUpperCase() + s.slice(1) 
                      }))
                    : null
                  }
                  onChange={(selected) => {
                    setCampaignFilters(prev => ({
                      ...prev,
                      status: selected ? selected.map(s => s.value) : []
                    }));
                    // Reset activeFilter when using advanced status filter
                    setActiveFilter('all');
                  }}
                  placeholder="Select status..."
                  styles={customSelectStyles}
                  isClearable
                />
              </Col>
              <Col md={8}>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setCampaignFilters({
                        status: [],
                      });
                      setActiveFilter('all');
                      setCampaignsPagination({ ...campaignsPagination, currentPage: 1 });
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

      {/* Column Customization */}
      {session?.user?.permissions?.includes('list-crm-campaigns') && (
        <div className="d-flex justify-content-end gap-2 mb-3">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <Layers size={16} className="me-2" />
              Customize Table
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[
                { key: 'name', label: 'Campaign Name' },
                { key: 'status', label: 'Status' },
                { key: 'dateRange', label: 'Date Range' },
                { key: 'campaignUsers', label: 'Campaign Users' },
                { key: 'created', label: 'Created' }
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedCampaignsColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCampaignsColumns([...selectedCampaignsColumns, col.key]);
                      } else {
                        setSelectedCampaignsColumns(selectedCampaignsColumns.filter(c => c !== col.key));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setSelectedCampaignsColumns(['name', 'status', 'dateRange', 'campaignUsers', 'created'])}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setSelectedCampaignsColumns(['name', 'status', 'dateRange', 'campaignUsers', 'created']);
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}

      {/* Campaigns Table */}
      {session?.user?.permissions?.includes('list-crm-campaigns') && (
        <Card className="border-0 shadow-sm campaigns-table-wrapper" style={{ width: '100%' }}>
          <Card.Body className="p-0" style={{ width: '100%' }}>
            <div className="table-responsive">
              <Table hover className="mb-0" style={{ width: '100%', margin: 0, tableLayout: 'auto' }}>
                <thead className="bg-light">
                  <tr>
                    {selectedCampaignsColumns.includes('name') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => {
                          const newDirection = campaignsPagination.sortColumn === 'name' && campaignsPagination.sortDirection === 'asc' ? 'desc' : 'asc';
                          setCampaignsPagination({ ...campaignsPagination, sortColumn: 'name', sortDirection: newDirection, currentPage: 1 });
                        }}
                      >
                        Campaign Name {renderSortIcon('name', campaignsPagination)}
                      </th>
                    )}
                    {selectedCampaignsColumns.includes('status') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => {
                          const newDirection = campaignsPagination.sortColumn === 'status' && campaignsPagination.sortDirection === 'asc' ? 'desc' : 'asc';
                          setCampaignsPagination({ ...campaignsPagination, sortColumn: 'status', sortDirection: newDirection, currentPage: 1 });
                        }}
                      >
                        Status {renderSortIcon('status', campaignsPagination)}
                      </th>
                    )}
                    {selectedCampaignsColumns.includes('dateRange') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => {
                          const newDirection = campaignsPagination.sortColumn === 'start_date' && campaignsPagination.sortDirection === 'asc' ? 'desc' : 'asc';
                          setCampaignsPagination({ ...campaignsPagination, sortColumn: 'start_date', sortDirection: newDirection, currentPage: 1 });
                        }}
                      >
                        Date Range {renderSortIcon('start_date', campaignsPagination)}
                      </th>
                    )}
                    {selectedCampaignsColumns.includes('campaignUsers') && <th>Campaign Users</th>}
                    {selectedCampaignsColumns.includes('created') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => {
                          const newDirection = campaignsPagination.sortColumn === 'created_at' && campaignsPagination.sortDirection === 'asc' ? 'desc' : 'asc';
                          setCampaignsPagination({ ...campaignsPagination, sortColumn: 'created_at', sortDirection: newDirection, currentPage: 1 });
                        }}
                      >
                        Created {renderSortIcon('created_at', campaignsPagination)}
                      </th>
                    )}
                    <th style={{ width: '120px', minWidth: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // API handles filtering, so we just sort and paginate the data
                    const sorted = sortData(campaignsData, campaignsPagination.sortColumn, campaignsPagination.sortDirection);
                    const paginated = paginateData(sorted, campaignsPagination.currentPage, campaignsPagination.rowsPerPage);
                    
                    if (campaignsData.length === 0) {
                      return (
                        <tr>
                          <td colSpan={selectedCampaignsColumns.length + 1} className="text-center py-4 text-muted">
                            No campaigns found matching your criteria
                          </td>
                        </tr>
                      );
                    }
                    
                    return paginated.map((campaign) => (
                      <tr key={campaign.id}>
                        {selectedCampaignsColumns.includes('name') && (
                          <td>
                            <div>
                              <div className="fw-semibold">{campaign.name || "Unnamed Campaign"}</div>
                              <div 
                                className="small text-muted mt-1 description-cell" 
                                title={campaign.description || "No Description"}
                                style={{
                                  maxWidth: '300px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block'
                                }}
                              >
                                {campaign.description || "No Description"}
                              </div>
                            </div>
                          </td>
                        )}
                        {selectedCampaignsColumns.includes('status') && (
                          <td>
                            <Badge 
                              bg={campaign.status === 'active' ? 'success' : 'secondary'}
                              className="bg-opacity-10 text-dark"
                            >
                              {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1) || 'Inactive'}
                            </Badge>
                          </td>
                        )}
                        {selectedCampaignsColumns.includes('dateRange') && (
                          <td>
                            <div>
                              <div className="fw-semibold small">
                                {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'No start date'}
                              </div>
                              <small className="text-muted">
                                to {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'No end date'}
                              </small>
                            </div>
                          </td>
                        )}
                        {selectedCampaignsColumns.includes('campaignUsers') && (
                          <td>
                            <span className="text-muted small">
                              {getUserNames(campaign.user_extensions || [])}
                            </span>
                          </td>
                        )}
                        {selectedCampaignsColumns.includes('created') && (
                          <td>
                            <small className="text-muted">
                              {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'Unknown'}
                            </small>
                          </td>
                        )}
                        <td style={{ width: '120px', minWidth: '120px' }}>
                          <div className="d-flex gap-1">
                            {session?.user?.permissions?.includes('view-crm-campaigns') && (
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
                            {session?.user?.permissions?.includes('edit-crm-campaigns') && (
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
                            {session?.user?.permissions?.includes('delete-crm-campaigns') && (
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
              {renderPaginationControls(totalCampaigns, campaignsPagination, setCampaignsPagination, 'campaigns')}
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
          setNewField({
            field_name: "",
            field_type: "string",
            field_options: [],
            sort_order: 0,
          });
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{showEditModal ? `Edit Campaign: ${selectedCampaign?.name}` : 'Add New Campaign'}</Modal.Title>
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
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter campaign name"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
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
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.start_date}
                  onChange={handleStartDateChange}
                  min={showEditModal ? undefined : getTodayDate()}
                />
                <Form.Text className="text-muted">
                  {showEditModal ? "Campaign start date" : "Must be today or a future date"}
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
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
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter campaign description (optional)"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Campaign Users</Form.Label>
            <Select
              isMulti
              value={campaignUsers}
              onChange={(selected) => setCampaignUsers(selected || [])}
              options={extensions.map((extension: { id: string; display_name: string; name: string }) => ({
                value: extension.id,
                label: extension.display_name || extension.name || extension.id
              }))}
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
                      onChange={(e) => setNewField({...newField, field_name: e.target.value})}
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={newField.field_type}
                      onChange={(e) => setNewField({...newField, field_type: e.target.value})}
                    >
                      <option value="string">Text</option>
                      <option value="integer">Number</option>
                      <option value="date">Date</option>
                      <option value="email">Email</option>
                      <option value="dropdown">Dropdown</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Button variant="success" className="app-button" onClick={handleAddField}>
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
                        onChange={(e) => handleFieldTypeChange(index, e.target.value)}
                      >
                        <option value="string">Text</option>
                        <option value="integer">Number</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="dropdown">Dropdown</option>
                      </Form.Select>
                    </Col>
                    
                  
                    <Col md={1}>
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
                          {field.field_options?.map((option: string, optionIndex: number) => (
                            <div key={optionIndex} className="d-flex mb-3 row align-items-center justify-content-left">
                              <Col md={5}>
                              <Form.Control
                                type="text"
                                size="sm"
                                value={option}
                                onChange={(e) => handleFieldOptionChange(index, optionIndex, e.target.value)}
                                placeholder="Option value"
                              />
                              </Col>
                              <Col md={5}>
                              <Button
                                variant="danger"
                                size="sm"
                                className="app-button"
                                onClick={() => handleRemoveFieldOption(index, optionIndex)}
                              >Remove Option</Button>
                              </Col>
                            
                            </div>
                          ))}


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
                No fields added yet. Click "Add Field" to create custom fields for this campaign.
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
              setNewField({
                field_name: "",
                field_type: "string",
                field_options: [],
                sort_order: 0,
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
            {loading ? 'Saving...' : (showEditModal ? 'Update Campaign' : 'Create Campaign')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Campaign Modal */}
      {selectedCampaign && (
        <Modal show={showViewModal} onHide={() => {
          setShowViewModal(false);
          setSelectedCampaign(null);
        }} size="xl" centered>
          {/* Custom Header */}
          <div style={{
            color: 'black',
            padding: '30px',
            position: 'relative',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <button 
              onClick={() => {
                setShowViewModal(false);
                setSelectedCampaign(null);
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
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: '24px' }}>
              {selectedCampaign.name}
            </h3>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              Campaign Details
            </p>
          </div>

          <Modal.Body style={{ padding: '30px' }}>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Campaign Information Section */}
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
                  <Megaphone size={18} style={{ color: '#4680ff' }} />
                  Campaign Information
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
                    }}>Campaign Name</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      {selectedCampaign.name}
                    </div>
                  </div>
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
                    }}>Status</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      <Badge 
                        bg={selectedCampaign.status === 'active' ? 'success' : 'secondary'}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {selectedCampaign.status?.charAt(0).toUpperCase() + selectedCampaign.status?.slice(1) || 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {selectedCampaign.description && (
                    <div style={{
                      background: '#f8f9fa',
                      padding: '16px',
                      borderRadius: '10px',
                      transition: 'all 0.3s',
                      gridColumn: 'span 2'
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
                      }}>Description</div>
                      <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                        {selectedCampaign.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Information Section */}
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
                  <Calendar size={18} style={{ color: '#4680ff' }} />
                  Date Information
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
                    }}>Date Range</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      {selectedCampaign.start_date && selectedCampaign.end_date 
                        ? `${new Date(selectedCampaign.start_date).toLocaleDateString()} - ${new Date(selectedCampaign.end_date).toLocaleDateString()}`
                        : selectedCampaign.start_date 
                          ? `Starts: ${new Date(selectedCampaign.start_date).toLocaleDateString()}`
                          : 'Not set'}
                    </div>
                  </div>
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
                    }}>Created Date</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      {selectedCampaign.created_at ? new Date(selectedCampaign.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>


                {/* Campaign Users */}
                {selectedCampaign.user_extensions && selectedCampaign.user_extensions.length > 0 && (
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
                      <Users size={18} style={{ color: '#4680ff' }} />
                      Campaign Users ({selectedCampaign.user_extensions.length})
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      marginBottom: '30px'
                    }}>
                      {selectedCampaign.user_extensions.map((ue: any, index: number) => {
                        const extension = extensions.find(ext => ext.id == ue.user_extension);
                        const userName = extension?.display_name || extension?.name || `Extension ${ue.user_extension}`;
                        return (
                          <div key={index} style={{
                            background: '#f8f9fa',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 500,
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
                            {userName}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Campaign Fields */}
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
                  <FileText size={18} style={{ color: '#4680ff' }} />
                  Campaign Fields ({selectedCampaign.fields?.length || 0})
                </div>
                {selectedCampaign.fields && selectedCampaign.fields.length > 0 ? (
                  <div className="table-responsive mb-4">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Field Name</th>
                          <th>Type</th>
                          <th>Options</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCampaign.fields.map((field: any, index: number) => (
                          <tr key={index}>
                            <td>{field.field_name}</td>
                            <td>
                              <Badge bg="primary" className="text-capitalize">{getFieldTypeText(field.field_type)}</Badge>
                            </td>
                            <td>
                              {field.field_type === "dropdown" && field.field_options ? (
                                <div>
                                  {field.field_options.map((option: string, optIndex: number) => (
                                    <Badge key={optIndex} bg="info" className="me-1">
                                      {option}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Alert variant="info" className="mb-4">No custom fields defined for this campaign.</Alert>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  paddingTop: '20px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <Button 
                    variant="outline-secondary"
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedCampaign(null);
                    }}
                    style={{
                      borderRadius: '8px',
                      padding: '10px 24px',
                      fontWeight: 500
                    }}
                  >
                    Close
                  </Button>
                  {session?.user?.permissions?.includes('edit-crm-campaigns') && (
                    <Button 
                      variant="primary"
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditCampaign(selectedCampaign);
                      }}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 24px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
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
          <p className="text-muted small mb-0">This action will also delete all associated campaign fields.</p>
        }
      />








    </React.Fragment>
  );
};

CrmCampaigns.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmCampaigns;
