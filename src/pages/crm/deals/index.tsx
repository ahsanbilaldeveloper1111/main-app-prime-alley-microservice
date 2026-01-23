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
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
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
  
  // UI State
  const [showDealsAnalytics, setShowDealsAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dealsSearch, setDealsSearch] = useState('');
  const [selectedDealsColumns, setSelectedDealsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('dealsSelectedColumns');
    return saved ? JSON.parse(saved) : ['name', 'company', 'stage', 'dealType', 'value', 'assignedUser', 'closeDate', 'owner'];
  });
  const [dealsPagination, setDealsPagination] = useState({ currentPage: 1, rowsPerPage: 15, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [dealsFilters, setDealsFilters] = useState({
    assignedTo: null as string | null,
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

        const response: any = await getDeals(params);
        console.log("Raw response from getDeals:", response);

        const dealsArray: any[] = response?.dataList || [];
        const pagination: any = response?.meta || {};
        const summary: any = response?.summary_tiles || null;
        
        setDealsData(Array.isArray(dealsArray) ? dealsArray : []);
        setTotalDeals(pagination?.total || 0);
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
              window.location.href = `/crm/deals/${row.rawData?.id || row.id}/edit`;
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
            <h2 className="mb-1 fw-bold">Deals</h2>
            <p className="text-muted mb-0">Manage your sales pipeline and deals</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button 
              variant={showDealsAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowDealsAnalytics(!showDealsAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showDealsAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            {/* {session?.user?.permissions?.includes('add-crm-deals') && (
              <Link href="/crm/deals/create">
                <Button variant="primary">
                  <Plus size={16} className="me-2" />
                  Add Deal
                </Button>
              </Link>
            )} */}

<Button
            variant={showFiltersSidebar ? "secondary" : "outline-secondary"}
            onClick={() => setShowFiltersSidebar(!showFiltersSidebar)}
          >
            <FiFilter size={16} className="me-2" />
            {showFiltersSidebar ? "Hide Filters" : "Show Filters"}
          </Button>
          </div>
        </div>

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
          defaultSelectedColumns={['name', 'company', 'stage', 'dealType', 'value', 'assignedUser', 'closeDate', 'owner']}
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
        <Modal show={showDealViewModal} onHide={() => setShowDealViewModal(false)} size="xl" centered>
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
              onClick={() => setShowDealViewModal(false)}
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
              {viewingDeal.name}
            </h3>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              Deal Details
            </p>
          </div>

          <Modal.Body style={{ padding: '30px' }}>
            {loadingDeal ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                <style jsx>{`
                  .lead-detail-filter-buttons {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-bottom: 24px;
                  }

                  .lead-detail-filter-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: 1px solid;
                  }

                  .lead-detail-filter-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
                {/* Tabs Navigation */}
                <div className="lead-detail-filter-buttons   mb-4">
                  <button
                    className={`lead-detail-filter-button ${activeTab === "general-info" ? 'active' : ''}`}
                    onClick={() => setActiveTab("general-info")}
                    style={{
                      backgroundColor: activeTab === "general-info" ? "#4680ff" : 'white',
                      borderColor: "#4680ff",
                      color: activeTab === "general-info" ? 'white' : "#4680ff"
                    }}
                  >
                    <Handshake className="filter-icon" size={18} />
                    <span>General Information</span>
                  </button>
                  <button
                    className={`lead-detail-filter-button ${activeTab === "campaign-prospect" ? 'active' : ''}`}
                    onClick={() => setActiveTab("campaign-prospect")}
                    style={{
                      backgroundColor: activeTab === "campaign-prospect" ? "#4680ff" : 'white',
                      borderColor: "#4680ff",
                      color: activeTab === "campaign-prospect" ? 'white' : "#4680ff"
                    }}
                  >
                    <FileText className="filter-icon" size={18} />
                    <span>Campaign & Prospect</span>
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "general-info" && (
                  <div style={{ paddingTop: "20px" }}>
                      {/* Deal Information Section */}
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
                        <Handshake size={18} style={{ color: '#4680ff' }} />
                        Deal Information
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
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '6px'
                    }}>Deal Name</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      {viewingDeal.name}
                    </div>
                  </div>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '10px',
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
                        bg="primary"
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: viewingDeal.stage?.color || '#6c757d'
                        }}
                      >
                        {viewingDeal.stage?.name || 'Not assigned'}
                      </Badge>
                    </div>
                  </div>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '10px',
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '6px'
                    }}>Deal Value</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      {viewingDeal.currency || 'AED'} {parseFloat(String(viewingDeal.net_value || viewingDeal.grand_total || 0)).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '10px',
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '6px'
                    }}>Probability</div>
                    <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                      {viewingDeal?.stage?.probability || 0}%
                    </div>
                  </div>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '10px',
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
                      {extensions.find((ext: any) => ext?.id == viewingDeal?.assigned_to || ext?.extension == viewingDeal?.assigned_to)?.display_name || 
                       extensions.find((ext: any) => ext?.id == viewingDeal?.assigned_to || ext?.extension == viewingDeal?.assigned_to)?.name || 
                       viewingDeal.assigned_to || 'Not assigned'}
                    </div>
                  </div>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '10px',
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
                      {viewingDeal.created_at ? formatDateForTable(viewingDeal.created_at) : 'N/A'}
                    </div>
                  </div>
                </div>

                      {/* Client Information Section */}
                      {viewingDeal.company_name && (
                        <>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1f2937',
                            marginTop: '40px',
                            marginBottom: '20px',
                            paddingBottom: '10px',
                            borderBottom: '2px solid #f8f9fa',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <Building2 size={18} style={{ color: '#4680ff' }} />
                            Client information
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
                      }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '6px'
                        }}>Client Name</div>
                        <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                          <Building2 size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                          {viewingDeal.company_name}
                        </div>
                      </div>
                      {viewingDeal.industry && (
                        <div style={{
                          background: '#f8f9fa',
                          padding: '16px',
                          borderRadius: '10px',
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
                            {viewingDeal.industry}
                          </div>
                        </div>
                      )}
                        </div>
                      </>
                    )}

                      {/* Lead Information Section */}
                      {relatedLead && (
                        <>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1f2937',
                            marginTop: '40px',
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
                          {relatedLead.name}
                        </div>
                      </div>
                    
                      {relatedLead.lead_potential && (
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
                            {extensions.find((ext: any) => ext?.id == relatedLead?.user_extension || ext?.extension == relatedLead?.user_extension)?.display_name || 
                             extensions.find((ext: any) => ext?.id == relatedLead?.user_extension || ext?.extension == relatedLead?.user_extension)?.name || 
                             relatedLead.user_extension || 'Not assigned'}
                          </div>
                        </div>
                      )}
                      {relatedLead.created_at && (
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
                            {relatedLead.created_at ? formatDateForTable(relatedLead.created_at) : 'N/A'}
                          </div>
                        </div>
                      )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "campaign-prospect" && (
                  <div style={{ paddingTop: "20px" }}>
                      {/* Campaign Information Section */}
                      {relatedLead.campaign && (
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
                              {relatedLead.campaign.name}
                            </div>
                          </div>
                          {relatedLead.campaign_field_values && Object.keys(relatedLead.campaign_field_values).length > 0 && (
                            Object.entries(relatedLead.campaign_field_values).map(([key, value]: [string, any]) => (
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

                      {/* Prospect Information Section */}
                      {relatedLead.crm_data && (
                        <>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1f2937',
                            marginTop: '40px',
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
                          {relatedLead.crm_data.id && (
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
                                #{relatedLead.crm_data.id}
                              </div>
                            </div>
                          )}
                          {(relatedLead.crm_data.name || (relatedLead.crm_data.data && relatedLead.crm_data.data.name)) && (
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
                                {relatedLead.crm_data.name || (relatedLead.crm_data.data && relatedLead.crm_data.data.name) || 'N/A'}
                              </div>
                            </div>
                          )}
                          {(relatedLead.crm_data.phone || (relatedLead.crm_data.data && relatedLead.crm_data.data.phone)) && (
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
                          )}
                          {relatedLead.crm_data.source_file && (
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
                                {relatedLead.crm_data.source_file}
                              </div>
                            </div>
                          )}
                          {relatedLead.crm_data.uploaded_by && (
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
                                {relatedLead.crm_data.uploaded_by}
                              </div>
                            </div>
                          )}
                          {relatedLead.crm_data.created_at && (
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
                                {formatDateForTable(relatedLead.crm_data.created_at)}
                              </div>
                            </div>
                          )}
                          </div>
                          
                          {/* Prospect Fields Section */}
                          {relatedLead.crm_data.data && typeof relatedLead.crm_data.data === 'object' && Object.keys(relatedLead.crm_data.data).length > 0 && (
                            <>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#1f2937',
                                marginTop: '40px',
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
                              {Object.entries(relatedLead.crm_data.data)
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
                                  }}>{key.replace(/_/g, ' ')}</div>
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
                  </div>
                )}

                {/* Meetings Timeline */}
                {viewingDeal.meetings && Array.isArray(viewingDeal.meetings) && viewingDeal.meetings.length > 0 && (
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
                        Meetings ({viewingDeal.meetings.length})
                      </div>
                      {session?.user?.permissions?.includes('add-meeting-crm-deals') && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setMeetingData({
                            dealId: viewingDeal.id,
                            dealName: viewingDeal.name,
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
                      )}
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
                      {viewingDeal.meetings.map((meeting: any, idx: number) => (
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
                                {meeting.meeting_date ? formatDateForTable(meeting.meeting_date) : 'N/A'} {meeting.meeting_time || ''} - {meeting.meeting_type}
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
                            <div className="d-flex gap-1">
                              {session?.user?.permissions?.includes('add-meeting-crm-deals') && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  title="Edit"
                                  onClick={() => handleEditMeeting(meeting)}
                                >
                                  <Edit size={16} />
                                </Button>
                              )}
                              {session?.user?.permissions?.includes('delete-meeting-crm-deals') && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-danger"
                                  title="Delete"
                                  onClick={() => handleDeleteMeeting(meeting.id, meeting.name)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Add Meeting Button if no meetings exist */}
                {(!viewingDeal.meetings || viewingDeal.meetings.length === 0) && (
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
                    {session?.user?.permissions?.includes('add-meeting-crm-deals') && (
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setMeetingData({
                          dealId: viewingDeal.id,
                          dealName: viewingDeal.name,
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
                    )}
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
                  {session?.user?.permissions?.includes('edit-crm-deals') && (
                    <Button
                      variant="primary"
                      disabled={activeFilter === "lost"}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 500,
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: activeFilter === "lost" ? "#9ca3af" : "#4680ff",
                        border: 'none',
                        opacity: activeFilter === "lost" ? 0.6 : 1,
                        cursor: activeFilter === "lost" ? "not-allowed" : "pointer",
                      }}
                      onClick={() => {
                        if (activeFilter === "lost") return;
                        setShowDealViewModal(false);
                        window.location.href = `/crm/deals/${viewingDeal.id}/edit`;
                      }}
                      onMouseOver={(e) => {
                        if (activeFilter === "lost") return;
                        e.currentTarget.style.background = "#3b6ce5";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(70, 128, 255, 0.4)";
                      }}
                      onMouseOut={(e) => {
                        if (activeFilter === "lost") return;
                        e.currentTarget.style.background = "#4680ff";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <Edit size={16} />
                      Edit Deal
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
                      setShowDealHistoryModal(true);
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
                    onClick={() => setShowDealViewModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </Modal.Body>
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

    </React.Fragment>
  );
};

CrmDeals.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDeals;

