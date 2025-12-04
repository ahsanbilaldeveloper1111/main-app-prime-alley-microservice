import "@assets/scss/datatable-style.scss";
import { useRouter } from 'next/router';
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
  getLeads,
  getLead,
  deleteLead,
  convertLead,
  markLeadLost,
  getStages,
  createLeadFollowUp,
  deleteLeadFollowUp,
  createMeeting,
  deleteMeeting,
  restoreLead,
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
import Select from 'react-select';
import { ModuleSlug } from "@utils/Helper";
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
  Phone,
  Building2,
  User,
  History,
  FileText,
  GitBranch,
  DollarSign,
  UserCheck,
  AlertCircle,
  RotateCcw,
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

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import FormModal from "../../partial/FormModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";

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
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const CrmLeads = () => {
  const { data: session } = useSession();

  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);
  
  // UI State
  const [showLeadsAnalytics, setShowLeadsAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [leadsSearch, setLeadsSearch] = useState('');
  const [showLeadViewModal, setShowLeadViewModal] = useState(false);
  const [viewingLead, setViewingLead] = useState<any>(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [showLeadHistoryModal, setShowLeadHistoryModal] = useState(false);
  
  // Follow-up Modal
  const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);
  const [followupData, setFollowupData] = useState({
    leadId: null as number | null,
    leadName: '',
    followUpDate: '',
    followUpStatus: 'Pending',
    communicationChannel: 'Phone Call',
    communicationChannelOther: '',
    notes: '',
    userExtension: '',
  });
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  
  // Meeting Modal
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [meetingData, setMeetingData] = useState({
    leadId: null as number | null,
    leadName: '',
    meetingName: '',
    meetingType: 'Online',
    meetingDate: '',
    meetingTime: '',
    meetingOutcome: '',
    extensions: [] as string[],
  });
  const [meetingAttendees, setMeetingAttendees] = useState<readonly any[]>([]);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  const [selectedLeadsColumns, setSelectedLeadsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('leadsSelectedColumns');
    return saved ? JSON.parse(saved) : ['name', 'company', 'email', 'phone', 'stage', 'leadPotential', 'followUps', 'assignedUser', 'created'];
  });
  const [leadsPagination, setLeadsPagination] = useState({ currentPage: 1, rowsPerPage: 10, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [leadsFilters, setLeadsFilters] = useState({
    assignedTo: null as string | null,
    stage: null as string | null,
  });

  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchStages();
    fetchLostReasons();
    fetchExtensions(ModuleSlug.CRM_LEADS);
  }, []);

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
      setTotalLeads(pagination?.total || (Array.isArray(leadsArray) ? leadsArray.length : 0) || 0);
      setSummaryTiles(summary);

      // Transform to GenericListPage expected format
      const transformedData = {
        dataList: Array.isArray(leadsArray) ? leadsArray : [],
        meta: {
          total: pagination?.total || (Array.isArray(leadsArray) ? leadsArray.length : 0) || 0,
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
    [currentFilters] // Only currentFilters as dependency
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
      setLeadsFilters(prev => ({
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
      setLeadsFilters(prev => ({
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
      setLeadsFilters(prev => ({
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
        setLeadsFilters(prev => ({
          ...prev,
          stage: selectedStage.id.toString()
        }));
      }
    }
  }, [activeFilter, stages]);

  useEffect(() => {
    fetchLeads(leadsPagination.currentPage, leadsPagination.rowsPerPage, leadsSearch);
  }, [refreshKey, currentFilters, leadsPagination.currentPage, leadsPagination.rowsPerPage, fetchLeads]);

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
      
      return newFilters;
    });
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages('lead');
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
  // Transform API lead data to UI format
  const transformLeadData = (lead: any) => {
    // Parse contact_persons - it can be a JSON string or an array
    let contactPersonsArray: any[] = [];
    if (lead.contact_persons) {
      if (typeof lead.contact_persons === 'string') {
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
    const contactPerson = contactPersonsArray.find(cp => cp.email || cp.phone) || contactPersonsArray[0] || {};
    
    // Use contact person data if available, otherwise fall back to top-level fields
    const email = contactPerson.email || '';
    const phone = contactPerson.phone 
      ? `${contactPerson.phone_country_code || ''} ${contactPerson.phone}`.trim()
      : (lead.contact_phone ? `${lead.contact_phone_country_code || ''} ${lead.contact_phone}`.trim() : '');

    return {
      id: lead.id,
      name: lead.name || '',
      email: email,
      phone: phone,
      company: lead.company_name || '',
      industry: lead.industry || '',
      stage: lead.stage?.name || (lead.stage_id ? 'Unknown' : 'New'),
      leadPotential: lead.lead_potential || 'Warm',
      assignedUser: extensions.find((ext: any) => ext?.id == lead?.user_extension || ext?.extension == lead?.user_extension)?.display_name || 
                    extensions.find((ext: any) => ext?.id == lead?.user_extension || ext?.extension == lead?.user_extension)?.name || 
                    lead.user_extension || '',
      created: lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
      lastActivity: lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleDateString() : '',
      followUps: lead.follow_ups || [],
      meetings: lead.meetings || [],
      source: lead.source || '',
      campaign: lead.campaign?.name || '',
      isLost: lead.is_lost || false,
      rawData: lead // Keep original data for actions
    };
  };

  // Delete Lead Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);

  // Delete Follow-up Modal
  const [showDeleteFollowUpModal, setShowDeleteFollowUpModal] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<{ leadId: number; followUpId: number; leadName?: string } | null>(null);

  // Delete Meeting Modal
  const [showDeleteMeetingModal, setShowDeleteMeetingModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<{ meetingId: number; meetingName?: string } | null>(null);

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
    if (!window.confirm('Are you sure you want to restore this lead?')) return;

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
  const router = useRouter();
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


  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalDescription, setSuccessModalDescription] = useState('');

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
      if (leadData.contact_persons && typeof leadData.contact_persons === 'string') {
        try {
          leadData.contact_persons = JSON.parse(leadData.contact_persons);
        } catch (e) {
          console.error("Failed to parse contact_persons:", e);
          leadData.contact_persons = [];
        }
      }
      
      setViewingLead(leadData);
      setShowLeadViewModal(true);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
      toast.error("Failed to load lead details");
    } finally {
      setLoadingLead(false);
    }
  }, []);

  // Handle follow-up creation
  const handleCreateFollowUp = useCallback(async () => {
    if (!followupData.leadId || !followupData.followUpDate) return;
    
    setLoadingFollowUp(true);
    try {
      const payload: any = {
        follow_up_date: followupData.followUpDate,
        follow_up_status: followupData.followUpStatus,
        communication_channel: followupData.communicationChannel,
        notes: followupData.notes,
        user_extension: followupData.userExtension || (session?.user as any)?.extension || 'admin',
      };
      
      if (followupData.communicationChannel === 'Other' && followupData.communicationChannelOther) {
        payload.communication_channel_other = followupData.communicationChannelOther;
      }
      
      await createLeadFollowUp(followupData.leadId, payload);
      
      // Refresh lead data
      if (viewingLead?.id === followupData.leadId) {
        await handleViewLead(followupData.leadId);
      }
      
      // Reset form and close modal
      setShowAddFollowupModal(false);
      setFollowupData({
        leadId: null,
        leadName: '',
        followUpDate: '',
        followUpStatus: 'Pending',
        communicationChannel: 'Phone Call',
        communicationChannelOther: '',
        notes: '',
        userExtension: '',
      });
      
      // Refresh leads list
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to create follow-up:", error);
    } finally {
      setLoadingFollowUp(false);
    }
  }, [followupData, session, viewingLead, handleViewLead]);

  // Handle follow-up deletion
  const handleDeleteFollowUp = useCallback((leadId: number, followUpId: number, leadName?: string) => {
    setFollowUpToDelete({ leadId, followUpId, leadName });
    setShowDeleteFollowUpModal(true);
  }, []);

  const confirmDeleteFollowUp = useCallback(async () => {
    if (!followUpToDelete) return;
    
    try {
      await deleteLeadFollowUp(followUpToDelete.leadId, followUpToDelete.followUpId);
      
      // Refresh lead data
      if (viewingLead?.id === followUpToDelete.leadId) {
        await handleViewLead(followUpToDelete.leadId);
      }
      
      // Refresh leads list
      setRefreshKey((oldKey) => oldKey + 1);
      
      setShowDeleteFollowUpModal(false);
      setFollowUpToDelete(null);
      toast.success("Follow-up deleted successfully!");
    } catch (error) {
      console.error("Failed to delete follow-up:", error);
      toast.error("Failed to delete follow-up");
    }
  }, [followUpToDelete, viewingLead, handleViewLead]);

  // Handle meeting creation
  const handleCreateMeeting = useCallback(async () => {
    if (!meetingData.leadId || !meetingData.meetingName || !meetingData.meetingDate || !meetingData.meetingTime) return;
    
    setLoadingMeeting(true);
    try {
      const payload: any = {
        name: meetingData.meetingName,
        meeting_type: meetingData.meetingType,
        meeting_date: meetingData.meetingDate,
        meeting_time: meetingData.meetingTime,
        lead_id: String(meetingData.leadId),
        extensions: meetingAttendees.length > 0 ? meetingAttendees.map((user: any) => user.value) : [(session?.user as any)?.extension || 'admin'],
      };
      
      if (meetingData.meetingOutcome) {
        payload.meeting_outcome = meetingData.meetingOutcome;
      }
      
      await createMeeting(payload);
      
      // Refresh lead data
      if (viewingLead?.id === meetingData.leadId) {
        await handleViewLead(meetingData.leadId);
      }
      
      // Reset form and close modal
      setShowAddMeetingModal(false);
      setMeetingData({
        leadId: null,
        leadName: '',
        meetingName: '',
        meetingType: 'Online',
        meetingDate: '',
        meetingTime: '',
        meetingOutcome: '',
        extensions: [],
      });
      setMeetingAttendees([]);
      
      // Refresh leads list
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to create meeting:", error);
    } finally {
      setLoadingMeeting(false);
    }
  }, [meetingData, session, viewingLead, handleViewLead]);

  // Handle meeting deletion
  const handleDeleteMeeting = useCallback((meetingId: number, meetingName?: string) => {
    setMeetingToDelete({ meetingId, meetingName });
    setShowDeleteMeetingModal(true);
  }, []);

  const confirmDeleteMeeting = useCallback(async () => {
    if (!meetingToDelete) return;
    
    try {
      await deleteMeeting(meetingToDelete.meetingId);
      
      // Refresh lead data
      if (viewingLead?.id) {
        await handleViewLead(viewingLead.id);
      }
      
      // Refresh leads list
      setRefreshKey((oldKey) => oldKey + 1);
      
      setShowDeleteMeetingModal(false);
      setMeetingToDelete(null);
      toast.success("Meeting deleted successfully!");
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      toast.error("Failed to delete meeting");
    }
  }, [meetingToDelete, viewingLead, handleViewLead]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const transformedLeads = leadsData.map(transformLeadData);
    
    // Use summary_tiles if available, otherwise calculate from data
    const total = summaryTiles ? totalLeads : transformedLeads.length;
    const hot = summaryTiles?.hot_leads || transformedLeads.filter(l => l.leadPotential === 'Hot').length;
    // Removed lead score calculation
    const qualified = transformedLeads.filter(l => l.stage === 'Qualified' || (l.stage?.toLowerCase().includes('qualified'))).length;
    
    // Stage distribution
    const stageCounts: Record<string, number> = {};
    transformedLeads.forEach(l => {
      const stage = l.stage || 'New';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });
    
    // Potential distribution
    const potentialCounts: Record<string, number> = {};
    transformedLeads.forEach(l => {
      const potential = l.leadPotential || 'Warm';
      potentialCounts[potential] = (potentialCounts[potential] || 0) + 1;
    });

    return { total, qualified, hot, stageCounts, potentialCounts };
  }, [leadsData, extensions, summaryTiles, totalLeads]);

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

  // Transform leads data (no client-side filtering - API handles it)
  const filteredLeads = useMemo(() => {
    return leadsData.map(transformLeadData);
  }, [leadsData, extensions]);

  // Calculate filter counts (using summary_tiles if available, otherwise from data)
  const filterCounts = useMemo(() => {
    const transformed = leadsData.map(transformLeadData);
    const counts: Record<string, number> = {
      all: summaryTiles?.total_leads || totalLeads || transformed.length,
      lost: summaryTiles?.lost_leads || transformed.filter(l => l.isLost).length,
      deleted: summaryTiles?.deleted_leads || 0,
    };
    
    // Add counts for first 5 stages
    stages.slice(0, 5).forEach((stage: any) => {
      const stageLeads = transformed.filter(l => l.stage === stage.name || l.rawData?.stage_id === stage.id);
      counts[stage.id] = stageLeads.length;
    });
    
    return counts;
  }, [leadsData, extensions, stages, summaryTiles, totalLeads]);

  if (!session?.user?.permissions?.includes('list-crm-leads')) {
    return null;
  }

  return (
    <React.Fragment>
      <style dangerouslySetInnerHTML={{__html: `
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
        .leads-table-wrapper .table-responsive table th.col-name,
        .leads-table-wrapper .table-responsive table td.col-name {
          min-width: 150px;
          white-space: nowrap;
        }
        .leads-table-wrapper .table-responsive table th.col-company,
        .leads-table-wrapper .table-responsive table td.col-company {
          min-width: 180px;
        }
        .leads-table-wrapper .table-responsive table th.col-email,
        .leads-table-wrapper .table-responsive table td.col-email {
          min-width: 200px;
          white-space: nowrap;
        }
        .leads-table-wrapper .table-responsive table th.col-phone,
        .leads-table-wrapper .table-responsive table td.col-phone {
          min-width: 150px;
          white-space: nowrap;
        }
        .leads-table-wrapper .table-responsive table th.col-stage,
        .leads-table-wrapper .table-responsive table td.col-stage {
          min-width: 120px;
          white-space: nowrap;
        }
        .leads-table-wrapper .table-responsive table th.col-leadPotential,
        .leads-table-wrapper .table-responsive table td.col-leadPotential {
          min-width: 130px;
          white-space: nowrap;
        }
        .leads-table-wrapper .table-responsive table th.col-followUps,
        .leads-table-wrapper .table-responsive table td.col-followUps {
          min-width: 100px;
          white-space: nowrap;
          text-align: center;
        }
        .leads-table-wrapper .table-responsive table th.col-assignedUser,
        .leads-table-wrapper .table-responsive table td.col-assignedUser {
          min-width: 150px;
          white-space: nowrap;
        }
        .leads-table-wrapper .table-responsive table th.col-created,
        .leads-table-wrapper .table-responsive table td.col-created {
          min-width: 120px;
          white-space: nowrap;
        }
        .leads-table-wrapper .table-responsive table th.col-actions,
        .leads-table-wrapper .table-responsive table td.col-actions {
          min-width: 120px;
          width: 120px;
          white-space: nowrap;
        }
      `}} />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Leads"
      />

          <div>
        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Leads Management</h2>
            <p className="text-muted mb-0">Track and manage your qualified leads with scoring</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button 
              variant={showLeadsAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowLeadsAnalytics(!showLeadsAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showLeadsAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            {session?.user?.permissions?.includes('add-crm-leads') && (
              <Link href="/crm/leads/create">
                <Button variant="primary">
                  <Plus size={16} className="me-2" />
                  Add Lead
                </Button>
              </Link>
            )}
          </div>
          </div>

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
                  value={analyticsData.qualified.toString()}
                  icon={<CheckCircle size={24} />}
                  color="success"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard 
                  title="Hot Leads"
                  value={analyticsData.hot.toString()}
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
                    <h6 className="fw-bold mb-3">Lead Potential Distribution</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Hot', value: analyticsData.potentialCounts['Hot'] || 0, color: '#dc3545' },
                            { name: 'Warm', value: analyticsData.potentialCounts['Warm'] || 0, color: '#ffc107' },
                            { name: 'Cold', value: analyticsData.potentialCounts['Cold'] || 0, color: '#0dcaf0' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Hot', value: analyticsData.potentialCounts['Hot'] || 0, color: '#dc3545' },
                            { name: 'Warm', value: analyticsData.potentialCounts['Warm'] || 0, color: '#ffc107' },
                            { name: 'Cold', value: analyticsData.potentialCounts['Cold'] || 0, color: '#0dcaf0' }
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
                        data={Object.entries(analyticsData.stageCounts).map(([stage, count]) => ({ stage, count }))}
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

        {/* Filter Bar */}
        <FilterBar
          quickFilters={[
            {
              id: 'all',
              label: 'All Leads',
              count: filterCounts.all,
              color: '#6c757d',
              activeColor: '#0d6efd',
              icon: <Users size={16} />
            },
            ...stages.slice(0, 5).map((stage: any) => ({
              id: stage.id.toString(),
              label: stage.name,
              count: filterCounts[stage.id] || 0,
              color: stage.color || '#6c757d',
              activeColor: '#0d6efd',
              icon: <Layers size={16} />
            })),
            {
              id: 'lost',
              label: 'Lost',
              count: filterCounts.lost || 0,
              color: '#fd7e14',
              activeColor: '#fd7e14',
              icon: <X size={16} />
            },
            {
              id: 'deleted',
              label: 'Deleted',
              count: filterCounts.deleted || 0,
              color: '#dc3545',
              activeColor: '#dc3545',
              icon: <Trash2 size={16} />
            }
          ]}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => {
            setActiveFilter(filterId);
            setLeadsPagination({ ...leadsPagination, currentPage: 1 });
          }}
          searchValue={leadsSearch}
          onSearchChange={(value) => setLeadsSearch(value)}
          onSearch={() => {
            if (leadsSearch.trim()) {
              handleFiltersChange({ search: leadsSearch.trim() });
            } else {
              handleFiltersChange({ search: null });
            }
            setLeadsPagination({ ...leadsPagination, currentPage: 1 });
          }}
          searchPlaceholder="Search leads by name, company, email..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={
            (leadsFilters.assignedTo !== null ? 1 : 0) +
            (leadsFilters.stage !== null ? 1 : 0)
          }
        />

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Assigned To</Form.Label>
                  <Select
                    options={extensions.map((ext: any) => ({ 
                      value: ext.id || ext.extension, 
                      label: ext.display_name || ext.name || ext.id || ext.extension
                    }))}
                    value={leadsFilters.assignedTo ? (() => {
                      const assignedToId = leadsFilters.assignedTo;
                      const ext = extensions.find((e: any) => (e.id || e.extension) === assignedToId);
                      return ext ? { 
                        value: assignedToId, 
                        label: ext.display_name || ext.name || assignedToId 
                      } : { value: assignedToId, label: assignedToId };
                    })() : null}
                    onChange={(selected) => {
                      const assignedToValue = selected ? selected.value : null;
                      setLeadsFilters(prev => ({
                        ...prev,
                        assignedTo: assignedToValue
                      }));
                      // Update currentFilters for API call
                      handleFiltersChange({ 
                        assigned_to: assignedToValue || null 
                      });
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
                    value={leadsFilters.stage ? (() => {
                      const stageId = leadsFilters.stage;
                      const stage = stages.find((st: any) => st.id.toString() === stageId);
                      return stage ? { value: stageId, label: stage.name } : { value: stageId, label: stageId };
                    })() : null}
                    onChange={(selected) => {
                      const stageValue = selected ? selected.value : null;
                      setLeadsFilters(prev => ({
                        ...prev,
                        stage: stageValue
                      }));
                      // Update currentFilters for API call
                      handleFiltersChange({ 
                        stage_id: stageValue || null 
                      });
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
                  <div className="d-flex gap-2">
                    {/* <Button
                      variant="primary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setLeadsPagination({ ...leadsPagination, currentPage: 1 });
                        setRefreshKey(prev => prev + 1);
                      }}
                    >
                      Apply Filters
                    </Button> */}
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setLeadsFilters({
                          assignedTo: null,
                          stage: null,
                        });
                        setCurrentFilters({});
                        setActiveFilter('all');
                        setLeadsPagination({ ...leadsPagination, currentPage: 1 });
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
        <div className="d-flex justify-content-end gap-2 mb-3">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <Layers size={16} className="me-2" />
              Customize Table
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[
                { key: 'name', label: 'Name' },
                { key: 'company', label: 'Company' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'stage', label: 'Stage' },
                { key: 'leadPotential', label: 'Lead Potential' },
                { key: 'followUps', label: 'Follow-ups' },
                { key: 'assignedUser', label: 'Assigned To' },
                { key: 'created', label: 'Created' }
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedLeadsColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeadsColumns([...selectedLeadsColumns, col.key]);
                        localStorage.setItem('leadsSelectedColumns', JSON.stringify([...selectedLeadsColumns, col.key]));
                      } else {
                        const newCols = selectedLeadsColumns.filter(c => c !== col.key);
                        setSelectedLeadsColumns(newCols);
                        localStorage.setItem('leadsSelectedColumns', JSON.stringify(newCols));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => {
                const allCols = ['name', 'company', 'email', 'phone', 'stage', 'leadPotential', 'followUps', 'assignedUser', 'created'];
                setSelectedLeadsColumns(allCols);
                localStorage.setItem('leadsSelectedColumns', JSON.stringify(allCols));
              }}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                const defaultCols = ['name', 'company', 'email', 'phone', 'stage', 'leadPotential', 'followUps', 'assignedUser', 'created'];
                setSelectedLeadsColumns(defaultCols);
                localStorage.setItem('leadsSelectedColumns', JSON.stringify(defaultCols));
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Leads Table */}
        <Card className="border-0 shadow-sm leads-table-wrapper" style={{ width: '100%' }}>
          <Card.Body className="p-0" style={{ width: '100%' }}>
            <div className="table-responsive">
              <Table hover className="mb-0 w-100" style={{ width: '100%', margin: 0 }}>
                <thead className="bg-light">
                  <tr>
                    {selectedLeadsColumns.includes('name') && (
                      <th 
                        className="col-name"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('name', leadsPagination, setLeadsPagination)}
                      >
                        Name {renderSortIcon('name', leadsPagination)}
                      </th>
                    )}
                    {selectedLeadsColumns.includes('company') && (
                      <th 
                        className="col-company"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('company', leadsPagination, setLeadsPagination)}
                      >
                        Company {renderSortIcon('company', leadsPagination)}
                      </th>
                    )}
                    {selectedLeadsColumns.includes('email') && (
                      <th 
                        className="col-email"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('email', leadsPagination, setLeadsPagination)}
                      >
                        Email {renderSortIcon('email', leadsPagination)}
                      </th>
                    )}
                    {selectedLeadsColumns.includes('phone') && (
                      <th 
                        className="col-phone"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('phone', leadsPagination, setLeadsPagination)}
                      >
                        Phone {renderSortIcon('phone', leadsPagination)}
                      </th>
                    )}
                    {selectedLeadsColumns.includes('stage') && (
                      <th 
                        className="col-stage"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('stage', leadsPagination, setLeadsPagination)}
                      >
                        Stage {renderSortIcon('stage', leadsPagination)}
                      </th>
                    )}
                    {selectedLeadsColumns.includes('leadPotential') && (
                      <th 
                        className="col-leadPotential"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('leadPotential', leadsPagination, setLeadsPagination)}
                      >
                        Lead Potential {renderSortIcon('leadPotential', leadsPagination)}
                      </th>
                    )}
                    {selectedLeadsColumns.includes('followUps') && (
                      <th className="col-followUps">Follow-ups</th>
                    )}
                    {selectedLeadsColumns.includes('assignedUser') && (
                      <th 
                        className="col-assignedUser"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('assignedUser', leadsPagination, setLeadsPagination)}
                      >
                        Assigned To {renderSortIcon('assignedUser', leadsPagination)}
                      </th>
                    )}
                    {selectedLeadsColumns.includes('created') && (
                      <th 
                        className="col-created"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('created', leadsPagination, setLeadsPagination)}
                      >
                        Created {renderSortIcon('created', leadsPagination)}
                      </th>
                    )}
                    <th className="col-actions" style={{ width: '120px', minWidth: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={selectedLeadsColumns.length + 1} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={selectedLeadsColumns.length + 1} className="text-center py-4 text-muted">
                        No leads found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    sortData(filteredLeads, leadsPagination.sortColumn, leadsPagination.sortDirection).map((lead) => (
                      <tr key={lead.id}>
                        {selectedLeadsColumns.includes('name') && (
                          <td className="col-name fw-semibold">{lead.name}</td>
                        )}
                        {selectedLeadsColumns.includes('company') && (
                          <td className="col-company">
                            <div>
                              <div className="fw-medium">{lead.company || 'No Company'}</div>
                              {lead.industry && <small className="text-muted">{lead.industry}</small>}
                            </div>
                          </td>
                        )}
                        {selectedLeadsColumns.includes('email') && (
                          <td className="col-email">{lead.email || '-'}</td>
                        )}
                        {selectedLeadsColumns.includes('phone') && (
                          <td className="col-phone">{lead.phone || '-'}</td>
                        )}
                        {selectedLeadsColumns.includes('stage') && (
                          <td className="col-stage">
                            <Badge 
                              bg={
                                lead.stage?.toLowerCase().includes('qualified') ? 'success' :
                                lead.stage?.toLowerCase().includes('contacted') ? 'info' :
                                'secondary'
                              }
                            >
                              {lead.stage}
                            </Badge>
                          </td>
                        )}
                        {selectedLeadsColumns.includes('leadPotential') && (
                          <td className="col-leadPotential">
                            <Badge 
                              bg={
                                lead.leadPotential === 'Hot' ? 'danger' :
                                lead.leadPotential === 'Warm' ? 'warning' :
                                'secondary'
                              }
                            >
                              {lead.leadPotential}
                            </Badge>
                          </td>
                        )}
                        {selectedLeadsColumns.includes('followUps') && (
                          <td className="col-followUps text-center">
                            <Badge bg="primary" pill>
                              {lead.followUps?.length || 0}
                            </Badge>
                          </td>
                        )}
                        {selectedLeadsColumns.includes('assignedUser') && (
                          <td className="col-assignedUser">{lead.assignedUser || '-'}</td>
                        )}
                        {selectedLeadsColumns.includes('created') && (
                          <td className="col-created">{lead.created || '-'}</td>
                        )}
                        <td className="col-actions" style={{ width: '120px', minWidth: '120px' }}>
                          <div className="d-flex gap-1">
                            {activeFilter === 'deleted' ? (
                              <>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-1" 
                                  title="View"
                                  onClick={() => handleViewLead(lead.rawData?.id || lead.id)}
                                >
                                  <Eye size={16} />
                                </Button>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-1 text-success" 
                                  title="Restore"
                                  onClick={() => handleRestoreLead(lead.rawData?.id || lead.id)}
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
                                  onClick={() => handleViewLead(lead.rawData?.id || lead.id)}
                                >
                                  <Eye size={16} />
                                </Button>
                                {session?.user?.permissions?.includes('edit-crm-leads') && (
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="p-1" 
                                    title="Edit"
                                    onClick={() => window.location.href = `/crm/leads/${lead.rawData?.id || lead.id}/edit`}
                                  >
                                    <Edit size={16} />
                                  </Button>
                                )}
                                {session?.user?.permissions?.includes('convert-to-opportunity-crm-leads') && (
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="p-1 text-success" 
                                    title="Convert to Deal"
                                    onClick={() => handleConvertLead(lead.rawData || lead)}
                                  >
                                    <Handshake size={16} />
                                  </Button>
                                )}
                                {session?.user?.permissions?.includes('delete-crm-leads') && (
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="p-1 text-danger" 
                                    title="Delete"
                                    onClick={() => handleDeleteLead(lead.rawData?.id || lead.id, lead.name)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                                {activeFilter !== 'lost' && (
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
                                      {session?.user?.permissions?.includes('mark-as-lost-crm-leads') && (
                                        <Dropdown.Item 
                                          className="text-danger"
                                          onClick={() => handleMarkLost(lead.rawData || lead)}
                                        >
                                          <X size={14} className="me-2" />
                                          Lost
                                        </Dropdown.Item>
                                      )}
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
              {renderPaginationControls(totalLeads, leadsPagination, setLeadsPagination, 'leads')}
            </div>
          </Card.Body>
        </Card>
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
        itemName={followUpToDelete?.leadName ? `follow-up for ${followUpToDelete.leadName}` : "this follow-up"}
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
        <Modal show={showLeadViewModal} onHide={() => setShowLeadViewModal(false)} size="xl" centered>
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
              onClick={() => setShowLeadViewModal(false)}
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
              {viewingLead.name}
            </h3>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              Lead Details
            </p>
          </div>

          <Modal.Body style={{ padding: '30px' }}>
            {loadingLead ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Lead Information Section */}
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
                  <Target size={18} style={{ color: '#4680ff' }} />
                  Lead Information
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
                    }}>Lead Name</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      {viewingLead.name}
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
                    }}>Stage</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      <Badge 
                        bg={viewingLead.stage?.name?.toLowerCase().includes('qualified') ? 'success' : viewingLead.stage?.name?.toLowerCase().includes('contacted') ? 'info' : 'secondary'}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: viewingLead.stage?.color || '#6c757d'
                        }}
                      >
                        {viewingLead.stage?.name || 'Not assigned'}
                      </Badge>
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
                    }}>Lead Potential</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      <Badge 
                        bg={viewingLead.lead_potential === 'Hot' ? 'danger' : viewingLead.lead_potential === 'Warm' ? 'warning' : 'secondary'}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {viewingLead.lead_potential || 'N/A'}
                      </Badge>
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
                      <Badge bg={viewingLead.is_lost ? 'danger' : viewingLead.status === 'new' ? 'primary' : 'success'}>
                        {viewingLead.is_lost ? 'Lost' : viewingLead.status || 'N/A'}
                      </Badge>
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
                    }}>Assigned To</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      <User size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                      {extensions.find((ext: any) => ext?.id == viewingLead?.user_extension || ext?.extension == viewingLead?.user_extension)?.display_name || 
                       extensions.find((ext: any) => ext?.id == viewingLead?.user_extension || ext?.extension == viewingLead?.user_extension)?.name || 
                       viewingLead.user_extension || 'Not assigned'}
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
                      <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                      {viewingLead.created_at ? new Date(viewingLead.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Company Information Section */}
                {viewingLead.company_name && (
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
                      Company Information
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
                          {viewingLead.company_name}
                        </div>
                      </div>
                      {viewingLead.industry && (
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
                            {viewingLead.industry}
                          </div>
                        </div>
                      )}
                      {viewingLead.business_type && (
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
                            {viewingLead.business_type}
                          </div>
                        </div>
                      )}
                      {viewingLead.company_size && (
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
                            {viewingLead.company_size}
                          </div>
                        </div>
                      )}
                      {viewingLead.company_city && (
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
                            {[viewingLead.company_city, viewingLead.company_country].filter(Boolean).join(', ') || 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Contact Persons Section */}
                {viewingLead.contact_persons && Array.isArray(viewingLead.contact_persons) && viewingLead.contact_persons.length > 0 && (
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
                      Contact Persons ({viewingLead.contact_persons.length})
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '20px',
                      marginBottom: '30px'
                    }}>
                      {viewingLead.contact_persons.map((person: any, index: number) => (
                        <div key={index} style={{
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
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '12px' }}>
                            {person.title} {person.name}
                          </div>
                          {person.email && (
                            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                              <Mail size={12} style={{ marginRight: '6px', display: 'inline' }} />
                              {person.email}
                            </div>
                          )}
                          {person.phone && (
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>
                              <Phone size={12} style={{ marginRight: '6px', display: 'inline' }} />
                              {person.phone_country_code} {person.phone}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Campaign Information */}
                {viewingLead.campaign && (
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
                      <FileText size={18} style={{ color: '#4680ff' }} />
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
                          {viewingLead.campaign.name}
                        </div>
                      </div>
                      {viewingLead.campaign_field_values && Object.keys(viewingLead.campaign_field_values).length > 0 && (
                        Object.entries(viewingLead.campaign_field_values).map(([key, value]: [string, any]) => (
                          <div key={key} style={{
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
                            }}>{key}</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              {String(value)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {/* Prospect Information */}
                {viewingLead.crm_data && (
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
                      <FileText size={18} style={{ color: '#4680ff' }} />
                      Prospect Information
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '20px',
                      marginBottom: '30px'
                    }}>
                      {viewingLead.crm_data.id && (
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
                          }}>CRM Data ID</div>
                          <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                            #{viewingLead.crm_data.id}
                          </div>
                        </div>
                      )}
                      {(viewingLead.crm_data.name || (viewingLead.crm_data.data && viewingLead.crm_data.data.name)) && (
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
                          }}>Name</div>
                          <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                            {viewingLead.crm_data.name || (viewingLead.crm_data.data && viewingLead.crm_data.data.name) || 'N/A'}
                          </div>
                        </div>
                      )}
                      {(viewingLead.crm_data.phone || (viewingLead.crm_data.data && viewingLead.crm_data.data.phone)) && (
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
                          }}>Phone</div>
                          <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                            <Phone size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                            {viewingLead.crm_data.phone || (viewingLead.crm_data.data && viewingLead.crm_data.data.phone) || 'N/A'}
                          </div>
                        </div>
                      )}
                      {viewingLead.crm_data.source_file && (
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
                          }}>Source File</div>
                          <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                            {viewingLead.crm_data.source_file}
                          </div>
                        </div>
                      )}
                      {viewingLead.crm_data.uploaded_by && (
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
                          }}>Uploaded By</div>
                          <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                            <User size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                            {viewingLead.crm_data.uploaded_by}
                          </div>
                        </div>
                      )}
                      {viewingLead.crm_data.created_at && (
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
                          }}>Created At</div>
                          <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                            <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                            {new Date(viewingLead.crm_data.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Prospect Fields */}
                    {viewingLead.crm_data.data && typeof viewingLead.crm_data.data === 'object' && Object.keys(viewingLead.crm_data.data).length > 0 && (
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
                          <FileText size={18} style={{ color: '#4680ff' }} />
                          Prospect Fields
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '20px',
                          marginBottom: '30px'
                        }}>
                          {Object.entries(viewingLead.crm_data.data)
                            .filter(([key]) => key.toLowerCase() !== 'name' && key.toLowerCase() !== 'phone')
                            .map(([key, value]: [string, any]) => (
                            <div key={key} style={{
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
                              }}>{key}</div>
                              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                {String(value || 'N/A')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Lost Reason */}
                {viewingLead.is_lost && viewingLead.lost_reason && (
                  <div style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '30px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
                      Lead Lost
                    </div>
                    <div style={{ fontSize: '13px', color: '#991b1b' }}>
                      Reason: {viewingLead.lost_reason.name}
                    </div>
                    {viewingLead.lost_feedback && (
                      <div style={{ fontSize: '13px', color: '#991b1b', marginTop: '8px' }}>
                        Feedback: {viewingLead.lost_feedback}
                      </div>
                    )}
                  </div>
                )}

                {/* Audit Trail / History */}
              

                {/* Description */}
                {viewingLead.description && (
                  <React.Fragment>
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
                    Description
                  </div>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '10px',
                    marginBottom: '30px',
                    fontSize: '14px',
                    color: '#1f2937',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {viewingLead.description}
                  </div>
                  </React.Fragment>
                )}

                {/* Follow-ups Timeline */}
                {viewingLead.follow_ups && Array.isArray(viewingLead.follow_ups) && viewingLead.follow_ups.length > 0 && (
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
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History size={18} style={{ color: '#4680ff' }} />
                        Follow-up Activity ({viewingLead.follow_ups.length})
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setFollowupData({
                            leadId: viewingLead.id,
                            leadName: viewingLead.name,
                            followUpDate: '',
                            followUpStatus: 'Pending',
                            communicationChannel: 'Phone Call',
                            communicationChannelOther: '',
                            notes: '',
                            userExtension: (session?.user as any)?.extension || 'admin',
                          });
                          setShowAddFollowupModal(true);
                        }}
                      >
                        <Plus size={14} className="me-1" />
                        Add Follow-up
                      </Button>
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
                      {viewingLead.follow_ups.map((followUp: any, idx: number) => (
                        <div key={followUp.id || idx} style={{ position: 'relative', paddingBottom: '20px' }}>
                          <div style={{
                            content: '',
                            position: 'absolute',
                            left: '-26px',
                            top: '4px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: followUp.follow_up_status === 'Completed' ? '#10b981' : '#4680ff',
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
                                {followUp.follow_up_date ? new Date(followUp.follow_up_date).toLocaleDateString() : 'N/A'} - {followUp.communication_channel === 'Other' ? followUp.communication_channel_other : followUp.communication_channel}
                              </div>
                              <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '4px', fontWeight: 500 }}>
                                <Badge bg={followUp.follow_up_status === 'Completed' ? 'success' : followUp.follow_up_status === 'In Progress' ? 'primary' : 'warning'}>
                                  {followUp.follow_up_status}
                                </Badge>
                              </div>
                              {followUp.notes && (
                                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                                  {followUp.notes}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-danger"
                              title="Delete"
                              onClick={() => handleDeleteFollowUp(viewingLead.id, followUp.id, viewingLead.name)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Add Follow-up Button if no follow-ups exist */}
                {(!viewingLead.follow_ups || viewingLead.follow_ups.length === 0) && (
                  <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <History size={32} style={{ color: '#9ca3af', marginBottom: '12px' }} />
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                      No follow-ups yet
                    </div>
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setFollowupData({
                          leadId: viewingLead.id,
                          leadName: viewingLead.name,
                          followUpDate: '',
                          followUpStatus: 'Pending',
                          communicationChannel: 'Phone Call',
                          communicationChannelOther: '',
                          notes: '',
                          userExtension: (session?.user as any)?.extension || 'admin',
                        });
                        setShowAddFollowupModal(true);
                      }}
                    >
                      <Plus size={14} className="me-1" />
                      Add Follow-up
                    </Button>
                  </div>
                )}

                {/* Meetings Timeline */}
                {viewingLead.meetings && Array.isArray(viewingLead.meetings) && viewingLead.meetings.length > 0 && (
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
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={18} style={{ color: '#4680ff' }} />
                        Meetings ({viewingLead.meetings.length})
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setMeetingData({
                            leadId: viewingLead.id,
                            leadName: viewingLead.name,
                            meetingName: '',
                            meetingType: 'Online',
                            meetingDate: '',
                            meetingTime: '',
                            meetingOutcome: '',
                            extensions: [],
                          });
                          setMeetingAttendees([]);
                          setShowAddMeetingModal(true);
                        }}
                      >
                        <Plus size={14} className="me-1" />
                        Schedule Meeting
                      </Button>
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
                      {viewingLead.meetings.map((meeting: any, idx: number) => (
                        <div key={meeting.id || idx} style={{ position: 'relative', paddingBottom: '20px' }}>
                          <div style={{
                            content: '',
                            position: 'absolute',
                            left: '-26px',
                            top: '4px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: meeting.meeting_outcome === 'Completed - Successful' ? '#10b981' : 
                                       meeting.meeting_outcome === 'Cancelled' ? '#dc3545' : '#4680ff',
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
                              <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '4px', fontWeight: 600 }}>
                                {meeting.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>
                                {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : 'N/A'} {meeting.meeting_time || ''} - {meeting.meeting_type}
                              </div>
                              {meeting.meeting_outcome && (
                                <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '4px', fontWeight: 500 }}>
                                  <Badge bg={
                                    meeting.meeting_outcome === 'Completed - Successful' ? 'success' : 
                                    meeting.meeting_outcome === 'Completed - Needs Follow-up' ? 'info' : 
                                    meeting.meeting_outcome === 'Cancelled' ? 'danger' : 
                                    meeting.meeting_outcome === 'Rescheduled' ? 'warning' : 
                                    'secondary'
                                  }>
                                    {meeting.meeting_outcome}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-danger"
                              title="Delete"
                              onClick={() => handleDeleteMeeting(meeting.id, meeting.name)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Add Meeting Button if no meetings exist */}
                {(!viewingLead.meetings || viewingLead.meetings.length === 0) && (
                  <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <Users size={32} style={{ color: '#9ca3af', marginBottom: '12px' }} />
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                      No meetings scheduled yet
                    </div>
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setMeetingData({
                          leadId: viewingLead.id,
                          leadName: viewingLead.name,
                          meetingName: '',
                          meetingType: 'Online',
                          meetingDate: '',
                          meetingTime: '',
                          meetingOutcome: '',
                          extensions: [],
                        });
                        setShowAddMeetingModal(true);
                      }}
                    >
                      <Plus size={14} className="me-1" />
                      Schedule Meeting
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  paddingTop: '20px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  {session?.user?.permissions?.includes('edit-crm-leads') && (
                    <Button
                      variant="primary"
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 500,
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#4680ff',
                        border: 'none'
                      }}
                      onClick={() => {
                        setShowLeadViewModal(false);
                        window.location.href = `/crm/leads/${viewingLead.id}/edit`;
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#3b6ce5';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(70, 128, 255, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#4680ff';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Edit size={16} />
                      Edit Lead
                    </Button>
                  )}
                  {session?.user?.permissions?.includes('convert-to-opportunity-crm-leads') && (
                    <Button
                      variant="success"
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 500,
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#10b981',
                        border: 'none'
                      }}
                      onClick={() => {
                        setShowLeadViewModal(false);
                        handleConvertLead(viewingLead);
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#059669';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#10b981';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Handshake size={16} />
                      Convert to Deal
                    </Button>
                  )}
                  <Button
                    variant="outline-primary"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'white',
                      color: '#4680ff',
                      border: '2px solid #4680ff'
                    }}
                    onClick={() => {
                      setShowLeadHistoryModal(true);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b6ce5';
                      e.currentTarget.style.color = '#3b6ce5';
                      e.currentTarget.style.background = '#f0f4ff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#4680ff';
                      e.currentTarget.style.color = '#4680ff';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <History size={16} />
                    View History
                  </Button>
                  <Button
                    variant="outline-secondary"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'white',
                      color: '#6b7280',
                      border: '2px solid #e5e7eb'
                    }}
                    onClick={() => setShowLeadViewModal(false)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#4680ff';
                      e.currentTarget.style.color = '#4680ff';
                      e.currentTarget.style.background = '#f0f4ff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.color = '#6b7280';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </Modal.Body>
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
          <div style={{
            borderBottom: '1px solid #ccc',
            color: 'black',
            padding: '30px',
            position: 'relative',
          }}>
            <button 
              onClick={() => {
                setShowLeadHistoryModal(false);
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
                  Complete Lead History
                </h3>
                <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                  {viewingLead.name} - All Activities & Changes
                </p>
              </div>
            </div>
          </div>

          <Modal.Body style={{ padding: '30px', maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Lead Summary Card */}
            <Card className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Lead Name</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{viewingLead.name}</div>
                  </Col>
                  <Col md={3}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Current Stage</div>
                    <Badge bg="primary" style={{ fontSize: '13px', padding: '6px 12px', backgroundColor: viewingLead.stage?.color || '#6c757d' }}>
                      {viewingLead.stage?.name || 'Not assigned'}
                    </Badge>
                  </Col>
                  <Col md={3}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Status</div>
                    <Badge bg={viewingLead.is_lost ? 'danger' : viewingLead.status === 'new' ? 'primary' : 'success'} style={{ fontSize: '13px', padding: '6px 12px' }}>
                      {viewingLead.is_lost ? 'Lost' : viewingLead.status || 'N/A'}
                    </Badge>
                  </Col>
                  <Col md={3}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Assigned To</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>
                      {extensions.find((ext: any) => ext?.id == viewingLead?.user_extension || ext?.extension == viewingLead?.user_extension)?.display_name || 
                       extensions.find((ext: any) => ext?.id == viewingLead?.user_extension || ext?.extension == viewingLead?.user_extension)?.name || 
                       viewingLead.user_extension || 'Not assigned'}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Timeline */}
            {viewingLead.audit_trail && Array.isArray(viewingLead.audit_trail) && viewingLead.audit_trail.length > 0 ? (
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
                
                {viewingLead.audit_trail.map((audit: any, index: number) => {
                  // Transform audit trail data to history format
                  const getCategoryAndIcon = (event: string, changes: any) => {
                    if (event === 'created') {
                      return { category: 'Creation', icon: <Plus size={16} />, color: '#198754' };
                    }
                    if (changes && Object.keys(changes).length > 0) {
                      const changeKeys = Object.keys(changes);
                      if (changeKeys.some(k => k.includes('stage'))) {
                        return { category: 'Stage Change', icon: <GitBranch size={16} />, color: '#0d6efd' };
                      }
                      if (changeKeys.some(k => k.includes('value') || k.includes('amount') || k.includes('price'))) {
                        return { category: 'Financial', icon: <DollarSign size={16} />, color: '#198754' };
                      }
                      if (changeKeys.some(k => k.includes('assigned') || k.includes('owner') || k.includes('user_extension'))) {
                        return { category: 'Assignment', icon: <UserCheck size={16} />, color: '#20c997' };
                      }
                    }
                    return { category: 'Update', icon: <FileText size={16} />, color: '#6c757d' };
                  };

                  const { category, icon, color } = getCategoryAndIcon(audit.event, audit.changes);
                  const performedBy = extensions.find((ext: any) => ext?.id == audit?.user_extension || ext?.extension == audit?.user_extension)?.display_name || 
                                     extensions.find((ext: any) => ext?.id == audit?.user_extension || ext?.extension == audit?.user_extension)?.name || 
                                     audit.user_extension || 'System';
                  const timestamp = audit.created_at_human || new Date(audit.created_at).toLocaleString();
                  
                  // Build metadata from changes
                  const metadata: Record<string, any> = {};
                  if (audit.changes && Object.keys(audit.changes).length > 0) {
                    Object.entries(audit.changes).forEach(([key, change]: [string, any]) => {
                      if (change.old !== undefined && change.new !== undefined) {
                        metadata[key] = `${change.old} → ${change.new}`;
                      } else if (change.new !== undefined) {
                        metadata[key] = change.new;
                      }
                    });
                  }

                  return (
                    <div 
                      key={audit.id || index} 
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
                                    {audit.event === 'created' ? 'Created' : audit.event === 'updated' ? 'Updated' : audit.event}
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
                                  {audit.description || 'Record updated'}
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

          <Modal.Footer style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '20px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                <strong>{viewingLead.audit_trail?.length || 0}</strong> activities recorded
              </div>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setShowLeadHistoryModal(false);
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

      {/* Add Follow-up Modal */}
      <Modal 
        show={showAddFollowupModal} 
        onHide={() => {
          setShowAddFollowupModal(false);
          setFollowupData({
            leadId: null,
            leadName: '',
            followUpDate: '',
            followUpStatus: 'Pending',
            communicationChannel: 'Phone Call',
            communicationChannelOther: '',
            notes: '',
            userExtension: '',
          });
        }} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton style={{ color: 'black', borderBottom: '1px solid #ccc' }}>
          <Modal.Title className="d-flex align-items-center">
            <Calendar size={24} className="me-2" />
            Add Follow up Activity
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {followupData.leadName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <User size={20} className="me-2" />
              <span><strong>Lead:</strong> {followupData.leadName}</span>
            </div>
          )}

          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Follow-up Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="date"
                    value={followupData.followUpDate}
                    onChange={(e) => setFollowupData({ ...followupData, followUpDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
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
                    value={{ value: followupData.followUpStatus, label: followupData.followUpStatus }}
                    onChange={(option) => setFollowupData({ ...followupData, followUpStatus: option?.value || 'Pending' })}
                    options={[
                      { value: 'Pending', label: 'Pending' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Cancelled', label: 'Cancelled' }
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
                  <Form.Label className="fw-semibold small">Communication Channel</Form.Label>
                  <Select
                    value={{ value: followupData.communicationChannel, label: followupData.communicationChannel }}
                    onChange={(option) => setFollowupData({ ...followupData, communicationChannel: option?.value || 'Phone Call', communicationChannelOther: '' })}
                    options={[
                      { value: 'Phone Call', label: 'Phone Call' },
                      { value: 'Email', label: 'Email' },
                      { value: 'Video Call', label: 'Video Call' },
                      { value: 'In-Person Meeting', label: 'In-Person Meeting' },
                      { value: 'SMS', label: 'SMS' },
                      { value: 'WhatsApp', label: 'WhatsApp' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    styles={customSelectStyles}
                    placeholder="Select communication channel..."
                  />
                </Form.Group>
              </Col>
            </Row>

            {followupData.communicationChannel === 'Other' && (
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">Communication Channel (Other)</Form.Label>
                    <Form.Control 
                      type="text"
                      value={followupData.communicationChannelOther}
                      onChange={(e) => setFollowupData({ ...followupData, communicationChannelOther: e.target.value })}
                      placeholder="Specify communication channel..."
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
                    onChange={(e) => setFollowupData({ ...followupData, notes: e.target.value })}
                    placeholder="Add notes, description, or specific action items for this follow-up..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="alert alert-info mb-0 d-flex align-items-center">
              <AlertCircle size={18} className="me-2" />
              <small>Follow-up activities help track communication and next steps with leads.</small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top bg-light">
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setShowAddFollowupModal(false);
              setFollowupData({
                leadId: null,
                leadName: '',
                followUpDate: '',
                followUpStatus: 'Pending',
                communicationChannel: 'Phone Call',
                communicationChannelOther: '',
                notes: '',
                userExtension: '',
              });
            }}
          >
            <X size={16} className="me-1" />
            Cancel
          </Button>
          <Button 
            variant="primary"
            disabled={!followupData.followUpDate || loadingFollowUp}
            onClick={handleCreateFollowUp}
          >
            {loadingFollowUp ? (
              <>
                <div className="spinner-border spinner-border-sm me-1" role="status" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={16} className="me-1" />
                Add Follow up
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Meeting Modal */}
      <Modal 
        show={showAddMeetingModal} 
        onHide={() => {
          setShowAddMeetingModal(false);
          setMeetingData({
            leadId: null,
            leadName: '',
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
            Schedule Meeting
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {meetingData.leadName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <User size={20} className="me-2" />
              <span><strong>Lead:</strong> {meetingData.leadName}</span>
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
                    min={new Date().toISOString().split('T')[0]}
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

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Meeting Outcome</Form.Label>
                  <Select
                    value={meetingData.meetingOutcome ? { value: meetingData.meetingOutcome, label: meetingData.meetingOutcome } : null}
                    onChange={(option) => setMeetingData({ ...meetingData, meetingOutcome: option?.value || '' })}
                    options={[
                      { value: 'Scheduled', label: 'Scheduled' },
                      { value: 'Completed - Successful', label: 'Completed - Successful' },
                      { value: 'Completed - Needs Follow-up', label: 'Completed - Needs Follow-up' },
                      { value: 'Cancelled', label: 'Cancelled' },
                      { value: 'No Show', label: 'No Show' },
                      { value: 'Rescheduled', label: 'Rescheduled' }
                    ]}
                    styles={customSelectStyles}
                    placeholder="Select meeting outcome..."
                    isClearable
                  />
                </Form.Group>
              </Col>
            </Row>

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
              <small>Schedule meetings to track important interactions with your leads.</small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top bg-light">
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setShowAddMeetingModal(false);
              setMeetingData({
                leadId: null,
                leadName: '',
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
            onClick={handleCreateMeeting}
          >
            {loadingMeeting ? (
              <>
                <div className="spinner-border spinner-border-sm me-1" role="status" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar size={16} className="me-1" />
                Schedule Meeting
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

    </React.Fragment>
  );
};

CrmLeads.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmLeads;
