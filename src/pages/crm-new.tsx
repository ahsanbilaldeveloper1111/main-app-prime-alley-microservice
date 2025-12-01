import React, { useState, ChangeEvent } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Form, Modal, Dropdown, ProgressBar, InputGroup } from 'react-bootstrap';
import Select from 'react-select';
import ExpandableSidebar from '@components/updated-sidebar'
import CompanyLogo2 from "@assets/images/ringedge-logo-black-n-blue.png";
import { 
  LayoutDashboard, 
  Users, 
  Target,
  Handshake,
  ShoppingBag,
  Megaphone,
  GitBranch,
  Activity,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  Clock,
  Mail,
  Phone,
  Building2,
  UserPlus,
  FileText,
  
  AlertCircle,
  Package,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  Wallet,
  ExternalLink,
  X,
  Menu,
  Bell,
  Check,
  MoreVertical,
  XCircle,
  CheckCircle,
  Zap,
  Star,
  PlusCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  User,
  History,
  Hash,
  Tag,
  MessageSquare,
  ArrowRight,
  Send,
  UserCheck,
  Info,
  Paperclip,
  Upload,
  Download as DownloadIcon
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
  Legend
} from 'recharts';
import "@assets/scss/ticketsnew.scss";
// Types
interface Prospect {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company?: string;
  dataSource: string;
  sourceFile: string;
  assignedTo: string;
  lastCalled: string;
  lastCallStatus: string;
  callDisposition: string;
  nextCallScheduled: string;
  viewStatus: string;
  tags: string[];
  importedBy: string;
  callHistory: Array<{
    date: string;
    status: string;
    comments: string;
  }>;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  stage: string;
  created: string;
  lastActivity: string;
  assignedTo: string;
  leadPotential: string;
  urgency: string;
  followUpCount: number;
  leadScore: number;
}

interface Opportunity {
  id: number;
  name: string;
  stage: string;
  value: string;
  created: string;
  lastActivity: string;
}

interface Task {
  title: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  assignedTo: string;
  assignedBy: string;
  dateAssigned: string;
  urgency: string;
  dueDate: string;
  notes: string;
}

interface KPICardData {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

// Reusable KPI Card Component
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

// Advanced Filter Component with React Select
interface FilterCategory {
  name: string;
  icon: React.ReactNode;
  filters: { label: string; value: string; options: string[]; type?: 'select' | 'date' | 'daterange' }[];
}

interface AdvancedFilterProps {
  categories?: FilterCategory[];
  filters?: { label: string; value: string; options: string[]; type?: 'select' | 'date' | 'daterange' }[];
  selectedFilters: { [key: string]: any };
  onFilterChange: (filterKey: string, values: any) => void;
  onClearAll: () => void;
  onApplyFilters: () => void;
}

// Filter Bar Component - Reusable across all pages
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
        // Active state: use activeColor or fallback to color for background
        const bgColor = filter.activeColor || filter.color;
        buttonStyle.background = '#fff';
        buttonStyle.borderColor = bgColor;
        buttonStyle.color = bgColor;
      } else {
        // Inactive state: use color for background with reduced opacity
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
        {/* Icon */}
        {filter.icon && <span className="d-flex align-items-center">{filter.icon}</span>}
        
        {/* Button Text */}
        {filter.label}

        {/* Badge */}
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

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({ categories, filters, selectedFilters, onFilterChange, onClearAll, onApplyFilters }) => {
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(categories ? categories[0]?.name : null);
  
  const activeFilterCount = Object.keys(selectedFilters).reduce((sum, key) => {
    const val = selectedFilters[key];
    if (Array.isArray(val)) return sum + val.length;
    if (typeof val === 'object' && val !== null) {
      return sum + (val.start || val.end ? 1 : 0);
    }
    return sum + (val ? 1 : 0);
  }, 0);

  // Custom styles for React Select to match Bootstrap theme
  const customStyles = {
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

  const renderFilterInput = (filter: any) => {
    if (filter.type === 'daterange') {
      return (
        <div className="d-flex gap-2">
          <Form.Control
            type="date"
            className="py-3"
            placeholder="Start Date"
            value={selectedFilters[filter.value]?.start || ''}
            onChange={(e) => onFilterChange(filter.value, { ...(selectedFilters[filter.value] || {}), start: e.target.value })}
          />
          <Form.Control
            type="date"
            className="py-3"
            placeholder="End Date"
            value={selectedFilters[filter.value]?.end || ''}
            onChange={(e) => onFilterChange(filter.value, { ...(selectedFilters[filter.value] || {}), end: e.target.value })}
          />
        </div>
      );
    }
    
    return (
      <Select
        isMulti
        options={filter.options.map((opt: string) => ({ value: opt, label: opt }))}
        value={(selectedFilters[filter.value] || []).map((val: string) => ({ value: val, label: val }))}
        onChange={(selected) => {
          onFilterChange(filter.value, selected ? selected.map((item: any) => item.value) : []);
        }}
        placeholder={`Select...`}
        styles={customStyles}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        isClearable
        isSearchable
        maxMenuHeight={200}
      />
    );
  };

  // Use categorized view if categories provided, otherwise simple grid view
  if (categories && categories.length > 0) {
    return (
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
              <Filter size={18} />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge bg="primary" className="ms-1">{activeFilterCount}</Badge>
              )}
            </h6>
            <div className="d-flex gap-2">
              {activeFilterCount > 0 && (
                <Button variant="link" size="sm" className="text-danger text-decoration-none p-0" onClick={onClearAll}>
                  <X size={16} className="me-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
          
          {/* Categorized Accordion View */}
          <div className="accordion" id="filterAccordion">
            {categories.map((category, idx) => {
              const categoryFilterCount = category.filters.reduce((sum, filter) => {
                const val = selectedFilters[filter.value];
                if (Array.isArray(val)) return sum + val.length;
                if (typeof val === 'object' && val !== null) {
                  return sum + (val.start || val.end ? 1 : 0);
                }
                return sum + (val ? 1 : 0);
              }, 0);

              return (
                <div className="accordion-item border" key={category.name}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${expandedCategory !== category.name ? 'collapsed' : ''} py-4`}
                      type="button"
                      onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                      style={{ fontSize: '0.875rem', backgroundColor: expandedCategory === category.name ? '#f8f9fa' : 'white' }}
                    >
                      <span className="d-flex align-items-center gap-2 w-100">
                        {category.icon}
                        <span className="fw-semibold">{category.name}</span>
                        {categoryFilterCount > 0 && (
                          <Badge bg="primary" className="ms-auto me-2" style={{ fontSize: '0.75rem' }}>
                            {categoryFilterCount}
                          </Badge>
                        )}
                      </span>
                    </button>
                  </h2>
                  <div className={`accordion-collapse collapse ${expandedCategory === category.name ? 'show' : ''}`}>
                    <div className="accordion-body p-3">
                      <Row>
                        {category.filters.map((filter) => (
                          <Col md={6} key={filter.value} className="mb-3">
                            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.813rem' }}>
                              {filter.label}
                            </label>
                            {renderFilterInput(filter)}
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
            <Button variant="outline-secondary" size="sm" onClick={onClearAll}>
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={onApplyFilters}>
              <Filter size={14} className="me-1" />
              Apply Filters
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Fallback to simple grid view for backward compatibility
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0 fw-semibold">Advanced Filters</h6>
          <div className="d-flex gap-2">
            {activeFilterCount > 0 && (
              <Button variant="link" size="sm" className="text-danger" onClick={onClearAll}>
                Clear All ({activeFilterCount})
              </Button>
            )}
          </div>
        </div>
        <Row>
          {(filters || []).map((filter) => (
            <Col md={4} key={filter.value} className="mb-3">
              <label className="form-label small fw-semibold">{filter.label}</label>
              {renderFilterInput(filter)}
            </Col>
          ))}
        </Row>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="primary" onClick={onApplyFilters}>
            <Filter size={16} className="me-2" />
            Apply Filters
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

const CRMPortal = () => {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [dashboardExpanded, setDashboardExpanded] = useState(false);
  const [showLeadFormModal, setShowLeadFormModal] = useState(false);
  const [showDealFormModal, setShowDealFormModal] = useState(false);
  const [showOrderFormModal, setShowOrderFormModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showStageRulesModal, setShowStageRulesModal] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showRevisionHistoryModal, setShowRevisionHistoryModal] = useState(false);
  const [showRevisionDetailModal, setShowRevisionDetailModal] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);
  const [showDealHistoryModal, setShowDealHistoryModal] = useState(false);
  const [selectedDealForHistory, setSelectedDealForHistory] = useState<any>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedDealForAttachments, setSelectedDealForAttachments] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemFormData, setItemFormData] = useState({
    product: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    currency: 'GBP',
    tax: 20
  });
  const [taskFormData, setTaskFormData] = useState<Task>({
    title: '',
    name: '',
    phone: '',
    email: '',
    companyName: '',
    assignedTo: '',
    assignedBy: '',
    dateAssigned: new Date().toISOString().split('T')[0],
    urgency: '',
    dueDate: '',
    notes: ''
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);
  const [showScheduleCallbackModal, setShowScheduleCallbackModal] = useState(false);
  const [scheduleCallbackData, setScheduleCallbackData] = useState({
    prospectId: null as number | null,
    prospectName: '',
    callbackDate: '',
    callbackTime: '',
    duration: '15',
    callbackReason: '',
    priority: 'Medium',
    assignedTo: '',
    reminderBefore: '15',
    notes: '',
    communicationChannel: 'Phone Call'
  });
  const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);
  const [followupData, setFollowupData] = useState({
    leadId: null as number | null,
    leadName: '',
    followupDate: '',
    status: 'Pending',
    communicationChannel: 'Phone Call',
    notes: ''
  });
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [meetingData, setMeetingData] = useState({
    leadId: null as number | null,
    leadName: '',
    meetingName: '',
    meetingType: 'Discovery Call',
    meetingOutcome: '',
    meetingDate: '',
    meetingTime: '',
    attendees: [] as string[]
  });
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('prospectsSelectedColumns');
    return saved ? JSON.parse(saved) : ['name', 'phone', 'dataSource', 'sourceFile', 'assignedTo', 'lastCalled', 'lastCallStatus', 'callDisposition', 'nextCallScheduled', 'viewStatus', 'tags'];
  });
  const [selectedLeadsColumns, setSelectedLeadsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('leadsSelectedColumns');
    return saved ? JSON.parse(saved) : ['name', 'company', 'email', 'phone', 'stage', 'leadPotential', 'urgency', 'followUps', 'leadScore', 'assignedUser', 'created'];
  });
  const [selectedDealsColumns, setSelectedDealsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('dealsSelectedColumns');
    return saved ? JSON.parse(saved) : ['dealName', 'company', 'value', 'stage', 'dealType', 'owner', 'industry', 'probability', 'closeDate', 'created'];
  });
  const [selectedOrdersColumns, setSelectedOrdersColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('ordersSelectedColumns');
    return saved ? JSON.parse(saved) : ['orderId', 'linkedDeal', 'customer', 'value', 'approval', 'stage', 'fulfillment', 'progress', 'priority', 'orderDate'];
  });
  const [selectedCampaignsColumns, setSelectedCampaignsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('campaignsSelectedColumns');
    return saved ? JSON.parse(saved) : ['campaignName', 'owner', 'status', 'dateRange', 'created'];
  });
  const [selectedTasksColumns, setSelectedTasksColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('tasksSelectedColumns');
    return saved ? JSON.parse(saved) : ['task', 'assignedTo', 'contact', 'company', 'urgency', 'status', 'dueDate'];
  });
  const [selectedStagesColumns, setSelectedStagesColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('stagesSelectedColumns');
    return saved ? JSON.parse(saved) : ['stageName', 'category', 'duration', 'successRate', 'activeDeals', 'automation'];
  });
  const [leadFormData, setLeadFormData] = useState({
    leadPotential: '',
    urgency: '',
    followUpCount: 0
  });
  const [showReminderAlert, setShowReminderAlert] = useState(false);
  const [upcomingCall, setUpcomingCall] = useState<Prospect | null>(null);
  const [showDataAssignmentModal, setShowDataAssignmentModal] = useState(false);
  const [showUploadHistoryModal, setShowUploadHistoryModal] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);
  
  // Data Assignment Modal States
  const [assignmentFilterCampaign, setAssignmentFilterCampaign] = useState<string>('');
  const [assignmentFilterTags, setAssignmentFilterTags] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<string>('');
  const [distributionMode, setDistributionMode] = useState<string>('');
  const [assignToCampaigns, setAssignToCampaigns] = useState<string[]>([]);
  const [customExtensions, setCustomExtensions] = useState<string>('');

  // Activity Tracker States
  const [activityStageFilter, setActivityStageFilter] = useState('all');
  const [activityDateRange, setActivityDateRange] = useState({ start: '', end: '' });
  const [activityRecordsLimit, setActivityRecordsLimit] = useState(50);
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [recordsToAssign, setRecordsToAssign] = useState<number>(0);
  const [includeAssignedRecords, setIncludeAssignedRecords] = useState<boolean>(false);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectedStages, setSelectedStages] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [showExpandedModal, setShowExpandedModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [showAllProspectStats, setShowAllProspectStats] = useState(false);
  const [showProspectsAnalytics, setShowProspectsAnalytics] = useState(false);
  const [showLeadsAnalytics, setShowLeadsAnalytics] = useState(false);
  const [showDealsAnalytics, setShowDealsAnalytics] = useState(false);
  const [showOrdersAnalytics, setShowOrdersAnalytics] = useState(false);
  const [showCampaignsAnalytics, setShowCampaignsAnalytics] = useState(false);
  const [showTasksAnalytics, setShowTasksAnalytics] = useState(false);
  const [showStagesAnalytics, setShowStagesAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [campaignFilters, setCampaignFilters] = useState({
    status: [] as string[],
    owner: [] as string[],
    tags: [] as string[],
    priority: [] as string[],
    dateRange: { start: '', end: '' }
  });
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    owner: '',
    status: 'Draft',
    startDate: '',
    endDate: '',
    created: new Date().toLocaleDateString('en-GB')
  });
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [leadFormStep, setLeadFormStep] = useState(0);
  const [dealFormStep, setDealFormStep] = useState(0);
  const [prospectFormData, setProspectFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    dataSource: 'Manual Entry',
    tags: [] as string[],
    notes: ''
  });

  // Pagination & Sorting States
  const [prospectsPagination, setProspectsPagination] = useState({ currentPage: 1, rowsPerPage: 10, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [leadsPagination, setLeadsPagination] = useState({ currentPage: 1, rowsPerPage: 10, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [dealsPagination, setDealsPagination] = useState({ currentPage: 1, rowsPerPage: 10, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [ordersPagination, setOrdersPagination] = useState({ currentPage: 1, rowsPerPage: 10, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [campaignsPagination, setCampaignsPagination] = useState({ currentPage: 1, rowsPerPage: 10, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [tasksPagination, setTasksPagination] = useState({ currentPage: 1, rowsPerPage: 10, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [stagesPagination, setStagesPagination] = useState({ currentPage: 1, rowsPerPage: 10, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });

  // Search States for all pages
  const [prospectsSearch, setProspectsSearch] = useState('');
  const [leadsSearch, setLeadsSearch] = useState('');
  const [dealsSearch, setDealsSearch] = useState('');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [campaignsSearch, setCampaignsSearch] = useState('');
  const [tasksSearch, setTasksSearch] = useState('');
  const [stagesSearch, setStagesSearch] = useState('');

  // Advanced Filters State
  const [prospectsFilters, setProspectsFilters] = useState({
    assignedTo: [] as string[],
    phone: '',
    campaigns: [] as string[],
    lastCallStatus: [] as string[],
    callDisposition: [] as string[],
    viewStatus: [] as string[],
    lastCalledDate: [] as string[],
    lastCalledCustomRange: { start: '', end: '' },
    nextCallScheduled: [] as string[],
    nextCallCustomRange: { start: '', end: '' },
    overdueCalls: false,
    sourceType: [] as string[],
    sourceFile: [] as string[],
    tags: [] as string[]
  });

  const [leadsFilters, setLeadsFilters] = useState({
    assignedTo: [] as string[],
    industry: [] as string[],
    stage: [] as string[],
    source: [] as string[],
    potential: [] as string[],
    campaign: [] as string[],
    leadScoreMin: '',
    leadScoreMax: '',
    dateRange: [] as string[],
    dateRangeCustomStart: '',
    dateRangeCustomEnd: ''
  });

  const [dealsFilters, setDealsFilters] = useState({
    stage: [] as string[],
    dealType: [] as string[],
    owner: [] as string[],
    industry: [] as string[],
    riskLevel: [] as string[],
    minValue: '',
    closeDate: ''
  });

  const [ordersFilters, setOrdersFilters] = useState({
    stage: [] as string[],
    approvalStatus: [] as string[],
    priority: [] as string[],
    fulfillmentStatus: [] as string[],
    billingStatus: [] as string[]
  });

  const [tasksFilters, setTasksFilters] = useState({
    status: [] as string[],
    urgency: [] as string[],
    assignedTo: [] as string[]
  });

  // View/Edit/Delete Modals
  const [showLeadViewModal, setShowLeadViewModal] = useState(false);
  const [showDealViewModal, setShowDealViewModal] = useState(false);
  const [showOrderViewModal, setShowOrderViewModal] = useState(false);
  const [showProspectViewModal, setShowProspectViewModal] = useState(false);
  const [showCampaignViewModal, setShowCampaignViewModal] = useState(false);
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; data: any } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [viewingLead, setViewingLead] = useState<any>(null);
  const [viewingDeal, setViewingDeal] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [viewingProspect, setViewingProspect] = useState<any>(null);
  const [viewingCampaign, setViewingCampaign] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'prospects', title: 'Prospects', icon: <Users size={18} /> },
    { id: 'leads', title: 'Leads', icon: <Target size={18} /> },
    { id: 'deals', title: 'Deals', icon: <Handshake size={18} /> },
    { id: 'orders', title: 'Orders', icon: <ShoppingBag size={18} /> },
    { id: 'campaigns', title: 'Campaigns', icon: <Megaphone size={18} /> },
    { id: 'tasks', title: 'Task Management', icon: <CheckCircle size={18} /> },
    { id: 'stages', title: 'Stages Management', icon: <GitBranch size={18} /> },
    { id: 'activities', title: 'Activity Tracker', icon: <Activity size={18} /> },
    { id: 'reports', title: 'Reports', icon: <BarChart3 size={18} /> }
  ];

  // Sample Data
  const sampleProspects: Prospect[] = [
    { id: 1, firstName: 'John', lastName: 'Smith', phone: '+1234567890', email: 'john.smith@email.com', dataSource: 'Campaign', sourceFile: 'Q4 Campaign 2025', assignedTo: 'John Doe (501)', lastCalled: '2025-11-17', lastCallStatus: 'Answered', callDisposition: 'Interested', nextCallScheduled: '2025-11-20 14:00', viewStatus: 'Viewed', tags: ['Hot', 'Enterprise'], importedBy: 'Manager One (601)', callHistory: [{ date: '2025-11-17', status: 'Answered', comments: 'Interested in premium package' }] },
    { id: 2, firstName: 'Sarah', lastName: 'Johnson', phone: '+1234567891', email: 'sarah.j@email.com', dataSource: 'Import', sourceFile: 'leads_nov_2025.csv', assignedTo: 'Jane Smith (502)', lastCalled: '2025-11-16', lastCallStatus: 'No Answer', callDisposition: 'Callback Required', nextCallScheduled: '2025-11-18 10:00', viewStatus: 'Not Viewed', tags: ['Follow-up'], importedBy: 'Jane Smith (502)', callHistory: [{ date: '2025-11-16', status: 'No Answer', comments: 'Left voicemail' }] },
    { id: 3, firstName: 'Michael', lastName: 'Brown', phone: '+1234567892', email: 'michael.b@email.com', dataSource: 'Campaign', sourceFile: 'Winter Sale 2025', assignedTo: 'Mike Johnson (503)', lastCalled: '', lastCallStatus: 'Not Called', callDisposition: '', nextCallScheduled: '2025-11-19 15:00', viewStatus: 'Not Viewed', tags: ['New'], importedBy: 'Manager One (601)', callHistory: [] },
    { id: 4, firstName: 'Emily', lastName: 'Davis', phone: '+1234567893', email: 'emily.davis@email.com', dataSource: 'Import', sourceFile: 'prospects_batch_1.csv', assignedTo: 'Sarah Williams (504)', lastCalled: '2025-11-15', lastCallStatus: 'Busy', callDisposition: 'Reschedule', nextCallScheduled: '2025-11-18 16:00', viewStatus: 'Viewed', tags: ['Warm'], importedBy: 'Sarah Williams (504)', callHistory: [{ date: '2025-11-15', status: 'Busy', comments: 'Call back later' }] },
    { id: 5, firstName: 'David', lastName: 'Wilson', phone: '+1234567894', email: 'david.w@email.com', dataSource: 'Campaign', sourceFile: 'Q4 Campaign 2025', assignedTo: 'Tom Brown (505)', lastCalled: '2025-11-14', lastCallStatus: 'Answered', callDisposition: 'Not Interested', nextCallScheduled: '', viewStatus: 'Viewed', tags: ['Cold'], importedBy: 'Manager One (601)', callHistory: [{ date: '2025-11-14', status: 'Answered', comments: 'Not interested at this time' }] },
  
    { id: 6, firstName: 'Lisa', lastName: 'Taylor', phone: '+1234567895', email: 'lisa.taylor@email.com', dataSource: 'Import', sourceFile: 'batch_2.csv', assignedTo: 'John Doe (501)', lastCalled: '2025-11-10', lastCallStatus: 'No Answer', callDisposition: 'Callback Required', nextCallScheduled: '2025-11-21 11:30', viewStatus: 'Viewed', tags: ['Warm'], importedBy: 'Manager Two (602)', callHistory: [{ date: '2025-11-10', status: 'No Answer', comments: 'Left voicemail' }] },
    { id: 7, firstName: 'Robert', lastName: 'Lee', phone: '+1234567896', email: 'robert.lee@email.com', dataSource: 'Campaign', sourceFile: 'Winter Sale 2025', assignedTo: 'Jane Smith (502)', lastCalled: '2025-11-11', lastCallStatus: 'Busy', callDisposition: 'Reschedule', nextCallScheduled: '2025-11-22 10:00', viewStatus: 'Not Viewed', tags: ['Hot'], importedBy: 'Manager One (601)', callHistory: [{ date: '2025-11-11', status: 'Busy', comments: 'Requested callback next week' }] },
    { id: 8, firstName: 'Karen', lastName: 'Moore', phone: '+1234567897', email: 'karen.moore@email.com', dataSource: 'Import', sourceFile: 'leads_nov_2025.csv', assignedTo: 'Mike Johnson (503)', lastCalled: '', lastCallStatus: 'Not Called', callDisposition: '', nextCallScheduled: '2025-11-25 09:00', viewStatus: 'Not Viewed', tags: ['New'], importedBy: 'Manager Two (602)', callHistory: [] },
    { id: 9, firstName: 'James', lastName: 'Evans', phone: '+1234567898', email: 'james.evans@email.com', dataSource: 'Campaign', sourceFile: 'Q4 Campaign 2025', assignedTo: 'Tom Brown (505)', lastCalled: '2025-11-09', lastCallStatus: 'Answered', callDisposition: 'Interested', nextCallScheduled: '2025-11-23 14:20', viewStatus: 'Viewed', tags: ['Enterprise'], importedBy: 'Manager One (601)', callHistory: [{ date: '2025-11-09', status: 'Answered', comments: 'Requested pricing brochure' }] },
    { id: 10, firstName: 'Anna', lastName: 'Hill', phone: '+1234567899', email: 'anna.hill@email.com', dataSource: 'Import', sourceFile: 'prospects_batch_3.csv', assignedTo: 'Sarah Williams (504)', lastCalled: '', lastCallStatus: 'Not Called', callDisposition: '', nextCallScheduled: '2025-11-26 13:00', viewStatus: 'Not Viewed', tags: ['Cold'], importedBy: 'Sarah Williams (504)', callHistory: [] },
  
    { id: 11, firstName: 'Tom', lastName: 'Anderson', phone: '+1234500000', email: 'tom.anderson@email.com', dataSource: 'Campaign', sourceFile: 'Black Friday 2025', assignedTo: 'John Doe (501)', lastCalled: '2025-11-13', lastCallStatus: 'Answered', callDisposition: 'Interested', nextCallScheduled: '2025-11-28 12:00', viewStatus: 'Viewed', tags: ['Hot'], importedBy: 'Manager Two (602)', callHistory: [{ date: '2025-11-13', status: 'Answered', comments: 'Very interested' }] },
    { id: 12, firstName: 'Mary', lastName: 'Scott', phone: '+1234500001', email: 'mary.scott@email.com', dataSource: 'Import', sourceFile: 'batch_4.csv', assignedTo: 'Mike Johnson (503)', lastCalled: '2025-11-12', lastCallStatus: 'Busy', callDisposition: 'Callback Required', nextCallScheduled: '2025-11-27 11:30', viewStatus: 'Viewed', tags: ['Follow-up'], importedBy: 'Manager One (601)', callHistory: [{ date: '2025-11-12', status: 'Busy', comments: 'Asked to call tomorrow' }] },
    { id: 13, firstName: 'Daniel', lastName: 'Clark', phone: '+1234500002', email: 'daniel.clark@email.com', dataSource: 'Campaign', sourceFile: 'Winter Sale 2025', assignedTo: 'Jane Smith (502)', lastCalled: '', lastCallStatus: 'Not Called', callDisposition: '', nextCallScheduled: '2025-11-30 09:00', viewStatus: 'Not Viewed', tags: ['New'], importedBy: 'Manager One (601)', callHistory: [] },
    { id: 14, firstName: 'Sophia', lastName: 'Green', phone: '+1234500003', email: 'sophia.green@email.com', dataSource: 'Import', sourceFile: 'leads_nov_2025.csv', assignedTo: 'Tom Brown (505)', lastCalled: '2025-11-10', lastCallStatus: 'Answered', callDisposition: 'Not Interested', nextCallScheduled: '', viewStatus: 'Viewed', tags: ['Cold'], importedBy: 'Sarah Williams (504)', callHistory: [{ date: '2025-11-10', status: 'Answered', comments: 'Not interested currently' }] },
    { id: 15, firstName: 'George', lastName: 'King', phone: '+1234500004', email: 'george.king@email.com', dataSource: 'Campaign', sourceFile: 'Q4 Campaign 2025', assignedTo: 'Mike Johnson (503)', lastCalled: '2025-11-18', lastCallStatus: 'Answered', callDisposition: 'Interested', nextCallScheduled: '2025-11-29 15:00', viewStatus: 'Viewed', tags: ['Warm'], importedBy: 'Manager Two (602)', callHistory: [{ date: '2025-11-18', status: 'Answered', comments: 'Requested follow-up call' }] }
  ];
  

  const recentLeads: Lead[] = [
    { id: 1, name: 'Miss Laine', email: 'laine@email.com', phone: '+1234567890', company: 'Tech Corp', stage: 'New', created: 'Nov 17, 2025', lastActivity: 'Nov 17, 2025 17:41', assignedTo: 'John Doe', leadPotential: 'Warm', urgency: 'High', followUpCount: 2, leadScore: 73.5 },
    { id: 2, name: 'Mr. Shayir', email: 'shayir@email.com', phone: '+1234567891', company: 'Digital Inc', stage: 'New', created: 'Nov 17, 2025', lastActivity: 'Nov 17, 2025 17:31', assignedTo: 'Jane Smith', leadPotential: 'Hot', urgency: 'Medium', followUpCount: 1, leadScore: 72.5 },
    { id: 3, name: 'Mr Hassan Khokhar', email: 'hassan@email.com', phone: '+1234567892', company: 'Solutions Ltd', stage: 'Contacted', created: 'Nov 15, 2025', lastActivity: 'Nov 15, 2025 14:55', assignedTo: 'Mike Johnson', leadPotential: 'Hot', urgency: 'High', followUpCount: 3, leadScore: 90.25 },
    { id: 4, name: 'Mr Niazi', email: 'niazi@email.com', phone: '+1234567893', company: 'Global Co', stage: 'New', created: 'Nov 13, 2025', lastActivity: 'Nov 13, 2025 16:40', assignedTo: 'Sarah Williams', leadPotential: 'Cold', urgency: 'Low', followUpCount: 0, leadScore: 0 },
    { id: 5, name: 'Mr Hilal', email: 'hilal@email.com', phone: '+1234567894', company: 'Enterprise Systems', stage: 'Contacted', created: 'Nov 12, 2025', lastActivity: 'Nov 12, 2025 17:18', assignedTo: 'Tom Brown', leadPotential: 'Warm', urgency: 'Medium', followUpCount: 1, leadScore: 50 },
  
    { id: 6, name: 'Miss Ayesha', email: 'ayesha@email.com', phone: '+1234567895', company: 'Tech Hive', stage: 'New', created: 'Nov 11, 2025', lastActivity: 'Nov 11, 2025 14:22', assignedTo: 'John Doe', leadPotential: 'Warm', urgency: 'Medium', followUpCount: 1, leadScore: 61 },
    { id: 7, name: 'Mr Danish', email: 'danish@email.com', phone: '+1234567896', company: 'CloudSoft', stage: 'Contacted', created: 'Nov 10, 2025', lastActivity: 'Nov 10, 2025 11:45', assignedTo: 'Jane Smith', leadPotential: 'Hot', urgency: 'High', followUpCount: 2, leadScore: 88.2 },
    { id: 8, name: 'Miss Noor', email: 'noor@email.com', phone: '+1234567897', company: 'Creative Labs', stage: 'New', created: 'Nov 09, 2025', lastActivity: 'Nov 09, 2025 17:32', assignedTo: 'Mike Johnson', leadPotential: 'Cold', urgency: 'Low', followUpCount: 0, leadScore: 12 },
    { id: 9, name: 'Mr Ali Raza', email: 'ali@email.com', phone: '+1234567898', company: 'SmartWorks', stage: 'Contacted', created: 'Nov 08, 2025', lastActivity: 'Nov 08, 2025 13:10', assignedTo: 'Sarah Williams', leadPotential: 'Warm', urgency: 'High', followUpCount: 3, leadScore: 69 },
    { id: 10, name: 'Mr Kamran', email: 'kamran@email.com', phone: '+1234567899', company: 'Global Co', stage: 'New', created: 'Nov 07, 2025', lastActivity: 'Nov 07, 2025 15:55', assignedTo: 'Tom Brown', leadPotential: 'Cold', urgency: 'Medium', followUpCount: 1, leadScore: 22 },
  
    { id: 11, name: 'Mr Bilal', email: 'bilal@email.com', phone: '+1234500000', company: 'Alpha Systems', stage: 'Contacted', created: 'Nov 06, 2025', lastActivity: 'Nov 06, 2025 12:45', assignedTo: 'John Doe', leadPotential: 'Hot', urgency: 'High', followUpCount: 4, leadScore: 94 },
    { id: 12, name: 'Miss Hira', email: 'hira@email.com', phone: '+1234500001', company: 'Tech Corp', stage: 'New', created: 'Nov 05, 2025', lastActivity: 'Nov 05, 2025 16:20', assignedTo: 'Jane Smith', leadPotential: 'Warm', urgency: 'Medium', followUpCount: 2, leadScore: 58 },
    { id: 13, name: 'Mr Saif', email: 'saif@email.com', phone: '+1234500002', company: 'Digital Hub', stage: 'Contacted', created: 'Nov 04, 2025', lastActivity: 'Nov 04, 2025 12:05', assignedTo: 'Mike Johnson', leadPotential: 'Hot', urgency: 'High', followUpCount: 3, leadScore: 82 },
    { id: 14, name: 'Miss Reema', email: 'reema@email.com', phone: '+1234500003', company: 'BlueStone', stage: 'New', created: 'Nov 03, 2025', lastActivity: 'Nov 03, 2025 17:20', assignedTo: 'Sarah Williams', leadPotential: 'Cold', urgency: 'Low', followUpCount: 0, leadScore: 10 },
    { id: 15, name: 'Mr Hashim', email: 'hashim@email.com', phone: '+1234500004', company: 'Tech Hive', stage: 'Contacted', created: 'Nov 02, 2025', lastActivity: 'Nov 02, 2025 15:12', assignedTo: 'Tom Brown', leadPotential: 'Warm', urgency: 'Medium', followUpCount: 1, leadScore: 55 }
  ];
  

  const recentOpportunities: Opportunity[] = [
    { id: 1, name: 'Mr Afrasiab Niazi', stage: 'Contacted', value: '£25,000', created: 'Nov 15, 2025', lastActivity: 'Nov 17, 2025 13:33' },
    { id: 2, name: 'M Jaweed Raza', stage: 'Meeting', value: '£18,500', created: 'Nov 15, 2025', lastActivity: 'Nov 15, 2025 13:00' },
    { id: 3, name: 'Waris Saleem', stage: 'Lost', value: '£12,000', created: 'Nov 13, 2025', lastActivity: 'Nov 13, 2025 16:45' },
    { id: 4, name: 'Mr Satya', stage: 'Contacted', value: '£30,000', created: 'Nov 13, 2025', lastActivity: 'Nov 14, 2025 17:40' },
    { id: 5, name: 'Mr.Waqar', stage: 'Won', value: '£45,000', created: 'Nov 08, 2025', lastActivity: 'Nov 08, 2025 15:07' },
  
    { id: 6, name: 'Mr Ahmed', stage: 'Lost', value: '£10,000', created: 'Nov 10, 2025', lastActivity: 'Nov 11, 2025 14:00' },
    { id: 7, name: 'Mr Danish', stage: 'Meeting', value: '£22,000', created: 'Nov 12, 2025', lastActivity: 'Nov 12, 2025 12:30' },
    { id: 8, name: 'Mr Haris', stage: 'Contacted', value: '£18,000', created: 'Nov 14, 2025', lastActivity: 'Nov 15, 2025 09:20' },
    { id: 9, name: 'Mr Saad', stage: 'Won', value: '£55,000', created: 'Nov 07, 2025', lastActivity: 'Nov 07, 2025 16:40' },
    { id: 10, name: 'Mr Adeel', stage: 'Lost', value: '£9,000', created: 'Nov 09, 2025', lastActivity: 'Nov 09, 2025 14:55' },
  
    { id: 11, name: 'Mr Bilal', stage: 'Meeting', value: '£28,000', created: 'Nov 05, 2025', lastActivity: 'Nov 05, 2025 13:10' },
    { id: 12, name: 'Mr Arham', stage: 'Won', value: '£42,000', created: 'Nov 06, 2025', lastActivity: 'Nov 06, 2025 11:00' },
    { id: 13, name: 'Mr Imran', stage: 'Contacted', value: '£15,500', created: 'Nov 04, 2025', lastActivity: 'Nov 04, 2025 10:25' },
    { id: 14, name: 'Mr Ahsan', stage: 'Lost', value: '£8,000', created: 'Nov 03, 2025', lastActivity: 'Nov 03, 2025 17:22' },
    { id: 15, name: 'Mr Zohaib', stage: 'Meeting', value: '£33,500', created: 'Nov 02, 2025', lastActivity: 'Nov 02, 2025 16:12' }
  ];
  

  const recentOrders = [
    { id: 'ORD-001', customer: 'Mr.Waqar', product: 'Enterprise Package', amount: '£45,000', status: 'Delivered', date: 'Nov 08, 2025' },
    { id: 'ORD-002', customer: 'Tech Corp', product: 'Premium Plan', amount: '£25,000', status: 'In Progress', date: 'Nov 15, 2025' },
    { id: 'ORD-003', customer: 'Digital Inc', product: 'Basic Package', amount: '£12,000', status: 'Pending', date: 'Nov 17, 2025' },
    { id: 'ORD-004', customer: 'Solutions Ltd', product: 'Advanced Plan', amount: '£18,500', status: 'Approved', date: 'Nov 16, 2025' },
    { id: 'ORD-005', customer: 'Global Co', product: 'Starter Pack', amount: '£8,000', status: 'Pending', date: 'Nov 18, 2025' },
  
    { id: 'ORD-006', customer: 'BlueStone', product: 'Business Package', amount: '£15,000', status: 'Delivered', date: 'Nov 14, 2025' },
    { id: 'ORD-007', customer: 'Tech Hive', product: 'Enterprise Package', amount: '£42,000', status: 'In Progress', date: 'Nov 13, 2025' },
    { id: 'ORD-008', customer: 'SmartWorks', product: 'Premium Plan', amount: '£20,000', status: 'Pending', date: 'Nov 12, 2025' },
    { id: 'ORD-009', customer: 'Creative Labs', product: 'Basic Package', amount: '£10,500', status: 'Delivered', date: 'Nov 11, 2025' },
    { id: 'ORD-010', customer: 'CloudSoft', product: 'Advanced Plan', amount: '£22,500', status: 'Approved', date: 'Nov 10, 2025' },
  
    { id: 'ORD-011', customer: 'Digital Hub', product: 'Business Package', amount: '£14,000', status: 'In Progress', date: 'Nov 09, 2025' },
    { id: 'ORD-012', customer: 'Alpha Systems', product: 'Starter Pack', amount: '£7,000', status: 'Pending', date: 'Nov 08, 2025' },
    { id: 'ORD-013', customer: 'BlueStone', product: 'Enterprise Package', amount: '£39,000', status: 'Delivered', date: 'Nov 07, 2025' },
    { id: 'ORD-014', customer: 'Enterprise Systems', product: 'Premium Plan', amount: '£24,500', status: 'Approved', date: 'Nov 06, 2025' },
    { id: 'ORD-015', customer: 'Global Co', product: 'Advanced Plan', amount: '£17,500', status: 'Pending', date: 'Nov 05, 2025' }
  ];
  

  // Get Widget Data for Expanded View
  const getWidgetData = (widgetType: string) => {
    switch (widgetType) {
      case 'leads':
        return recentLeads.map(lead => ({
          id: lead.id,
          title: lead.name,
          subtitle: lead.company,
          badge: lead.stage,
          badgeColor: lead.stage === 'Qualified' ? 'success' : lead.stage === 'Contacted' ? 'info' : 'secondary',
          details: `Score: ${lead.leadScore} | ${lead.assignedTo}`,
          date: lead.created
        }));
      case 'opportunities':
        return recentOpportunities.map(opp => ({
          id: opp.id,
          title: opp.name,
          subtitle: opp.value,
          badge: opp.stage,
          badgeColor: opp.stage === 'Won' ? 'success' : opp.stage === 'Lost' ? 'danger' : 'primary',
          details: `Last Activity: ${opp.lastActivity}`,
          date: opp.created
        }));
      case 'meetings':
        return [
          { id: 1, title: 'Client Demo - Tech Corp', subtitle: 'John Doe', badge: 'Scheduled', badgeColor: 'info', details: 'Nov 20, 2025 14:00', date: 'Nov 20, 2025' },
          { id: 2, title: 'Follow-up Call - Digital Inc', subtitle: 'Jane Smith', badge: 'Completed', badgeColor: 'success', details: 'Nov 17, 2025 10:30', date: 'Nov 17, 2025' },
          { id: 3, title: 'Proposal Review - Solutions Ltd', subtitle: 'Mike Johnson', badge: 'Scheduled', badgeColor: 'info', details: 'Nov 21, 2025 15:00', date: 'Nov 21, 2025' }
        ];
      case 'campaigns':
        return [
          { id: 1, title: 'Q4 Campaign 2025', subtitle: 'Active', badge: 'Running', badgeColor: 'success', details: '241 prospects assigned', date: 'Oct 15, 2025' },
          { id: 2, title: 'Winter Sale 2025', subtitle: 'Active', badge: 'Running', badgeColor: 'success', details: '156 prospects assigned', date: 'Nov 01, 2025' },
          { id: 3, title: 'Enterprise Outreach', subtitle: 'Completed', badge: 'Finished', badgeColor: 'secondary', details: '89 prospects assigned', date: 'Oct 01, 2025' }
        ];
      default:
        return [];
    }
  };

  // Save column selection to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('prospectsSelectedColumns', JSON.stringify(selectedColumns));
  }, [selectedColumns]);

  React.useEffect(() => {
    localStorage.setItem('leadsSelectedColumns', JSON.stringify(selectedLeadsColumns));
  }, [selectedLeadsColumns]);

  React.useEffect(() => {
    localStorage.setItem('dealsSelectedColumns', JSON.stringify(selectedDealsColumns));
  }, [selectedDealsColumns]);

  React.useEffect(() => {
    localStorage.setItem('ordersSelectedColumns', JSON.stringify(selectedOrdersColumns));
  }, [selectedOrdersColumns]);

  React.useEffect(() => {
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
  const handleSort = (column: string, paginationState: any, setPaginationState: (state: any) => void) => {
    const newDirection = paginationState.sortColumn === column && paginationState.sortDirection === 'asc' ? 'desc' : 'asc';
    setPaginationState({ ...paginationState, sortColumn: column, sortDirection: newDirection, currentPage: 1 });
  };

  const sortData = <T extends Record<string, any>>(data: T[], sortColumn: string, sortDirection: 'asc' | 'desc'): T[] => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      // Handle nested properties (e.g., 'firstName' + 'lastName')
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';
      
      // Convert to string for comparison
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
            // Show first, last, current, and adjacent pages
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

  // Dashboard Screen
  const renderDashboard = () => {
    const handleWidgetClick = (widgetType: string) => {
      setExpandedWidget(widgetType);
    };

    const handleExpandFull = () => {
      setShowExpandedModal(true);
    };

    const kpiData: KPICardData[] = [
      { 
        title: 'Total Leads', 
        value: '58', 
        change: '+12.5%', 
        isPositive: true, 
        icon: <Target size={24} />, 
        color: 'primary',
        onClick: () => handleWidgetClick('leads')
      },
      { 
        title: 'Total Opportunities', 
        value: '51', 
        change: '+8.2%', 
        isPositive: true, 
        icon: <Handshake size={24} />, 
        color: 'success',
        onClick: () => handleWidgetClick('opportunities')
      },
      { 
        title: 'Total Meetings', 
        value: '15', 
        change: '+3', 
        isPositive: true, 
        icon: <Calendar size={24} />, 
        color: 'info',
        onClick: () => handleWidgetClick('meetings')
      },
      { 
        title: 'Meetings in Next 24h', 
        value: '0', 
        icon: <Clock size={24} />, 
        color: 'warning',
        onClick: () => handleWidgetClick('meetings')
      },
      { 
        title: 'Meetings in Last 24h', 
        value: '0', 
        icon: <Activity size={24} />, 
        color: 'secondary',
        onClick: () => handleWidgetClick('meetings')
      },
      { 
        title: 'Total Campaigns', 
        value: '20', 
        change: '+5', 
        isPositive: true, 
        icon: <Megaphone size={24} />, 
        color: 'primary',
        onClick: () => handleWidgetClick('campaigns')
      }
    ];

    const displayedKpiData = dashboardExpanded ? kpiData : kpiData.slice(0, 4);
    const widgetData = expandedWidget ? getWidgetData(expandedWidget) : [];

    const leadsByStage = [
      { stage: 'New', count: 8, color: '#0d6efd' },
      { stage: 'Contacted', count: 24, color: '#198754' },
      { stage: 'Qualified', count: 9, color: '#0dcaf0' },
      { stage: 'Unqualified', count: 4, color: '#6c757d' }
    ];

    const opportunitiesByStage = [
      { stage: 'Meeting', count: 11 },
      { stage: 'Proposal', count: 9 },
      { stage: 'Negotiation', count: 4 },
      { stage: 'Contract Sent', count: 5 },
      { stage: 'Contract Received', count: 1 },
      { stage: 'Lost', count: 6 },
      { stage: 'Won', count: 13 }
    ];

    const orderApprovalData = [
      { name: 'Pending', value: 12, color: '#ffc107' },
      { name: 'Approved', value: 35, color: '#198754' },
      { name: 'Rejected', value: 4, color: '#dc3545' }
    ];

    const orderFulfillmentData = [
      { name: 'Pending', value: 8, color: '#ffc107' },
      { name: 'In Progress', value: 15, color: '#0dcaf0' },
      { name: 'On Hold', value: 3, color: '#6c757d' },
      { name: 'Delivered', value: 22, color: '#198754' },
      { name: 'Canceled', value: 3, color: '#dc3545' }
    ];

    const salesPipelineData = opportunitiesByStage.slice(0, 6); // Excluding Lost

    return (
      <div>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div>
            <h2 className="mb-1">Dashboard Overview</h2>
            <p className="text-muted mb-0">Welcome back! Here's what's happening with your CRM system.</p>
          </div>
          <Button variant="primary" onClick={() => setShowTaskModal(true)}>
            <Plus size={16} className="me-2" />
            Open Task
          </Button>
        </div>

        {/* KPI Cards */}
        <Row className="mb-4">
          {displayedKpiData.map((kpi, index) => (
            <Col lg={3} md={6} key={index} className="mb-3">
              <KPICard {...kpi} />
            </Col>
          ))}
        </Row>

        {/* Expand/Collapse Button */}
        {kpiData.length > 4 && (
          <div className="text-center mb-4 margin-minus-10">
            <Button 
              variant="link" 
              onClick={() => setDashboardExpanded(!dashboardExpanded)}
              className="text-decoration-none"
            >
              {dashboardExpanded ? (
                <>
                  <ArrowUp size={16} className="me-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ArrowDown size={16} className="me-2" />
                  Show More
                </>
              )}
            </Button>
          </div>
        )}

        {/* Expanded Widget Data */}
        {expandedWidget && widgetData.length > 0 && (
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold text-capitalize">{expandedWidget} Details</h5>
                <Button 
                  variant="link" 
                  className="p-0 text-muted"
                  onClick={() => setExpandedWidget(null)}
                >
                  <X size={20} />
                </Button>
              </div>
              <Table responsive hover className="mb-3">
                <thead className="bg-light">
                  <tr>
                    <th>Name</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {widgetData.slice(0, 5).map((item: any) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-semibold">{item.title}</div>
                        <small className="text-muted">{item.subtitle}</small>
                      </td>
                      <td><small className="text-muted">{item.details}</small></td>
                      <td>
                        <Badge bg={item.badgeColor}>{item.badge}</Badge>
                      </td>
                      <td><small className="text-muted">{item.date}</small></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="text-center">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={handleExpandFull}
                >
                  <ExternalLink size={14} className="me-1" />
                  Expand Full List
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Expanded Widget Modal */}
        <Modal show={showExpandedModal} onHide={() => setShowExpandedModal(false)} size="xl">
          <Modal.Header closeButton>
            <Modal.Title className="text-capitalize">{expandedWidget} - Complete List</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {widgetData.map((item: any, index: number) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="fw-semibold">{item.title}</div>
                      <small className="text-muted">{item.subtitle}</small>
                    </td>
                    <td><small className="text-muted">{item.details}</small></td>
                    <td>
                      <Badge bg={item.badgeColor}>{item.badge}</Badge>
                    </td>
                    <td><small className="text-muted">{item.date}</small></td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="link" size="sm" className="p-1">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1">
                          <Edit size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowExpandedModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Charts Row */}
        <Row className="mb-4">
          {/* Sales Pipeline Bar Chart */}
          <Col lg={8} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Sales Pipeline</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesPipelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#0d6efd" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* Order Approval Status Pie Chart */}
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Order Approval Status</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderApprovalData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {orderApprovalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Second Charts Row */}
        <Row className="mb-4">
          {/* Leads by Stage */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body style={{minHeight: '344px'}}>
                <h5 className="mb-4 fw-bold">Leads by Stage</h5>
                {leadsByStage.map((item, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-semibold">{item.stage}</span>
                      <Badge bg="primary" className="bg-opacity-10 text-dark">{item.count}</Badge>
                    </div>
                    <ProgressBar 
                      now={(item.count / 45) * 100} 
                      style={{ height: '8px', backgroundColor: '#e9ecef' }}
                      className="rounded"
                    />
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>

          {/* Order Fulfillment Status */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Order Fulfillment Status</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderFulfillmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {orderFulfillmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Activities */}
        <Row>
          {/* Recent Leads */}
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 fw-bold">Recent Leads</h5>
                  <Button variant="link" size="sm" className="text-decoration-none" onClick={() => setActiveScreen('leads')}>
                    View All →
                  </Button>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-1">{lead.name}</h6>
                        <Badge bg="primary" className="bg-opacity-10 text-dark">{lead.stage}</Badge>
                      </div>
                      <small className="text-muted d-block">Created: {lead.created}</small>
                      <small className="text-muted d-block">Last activity: {lead.lastActivity}</small>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Recent Opportunities */}
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 fw-bold">Recent Opportunities</h5>
                  <Button variant="link" size="sm" className="text-decoration-none" onClick={() => setActiveScreen('deals')}>
                    View All →
                  </Button>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {recentOpportunities.map((opp) => (
                    <div key={opp.id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-1">{opp.name}</h6>
                        <Badge bg="success" className="bg-opacity-10 text-dark">{opp.stage}</Badge>
                      </div>
                      <small className="text-muted d-block">Created: {opp.created}</small>
                      <small className="text-muted d-block">Last activity: {opp.lastActivity}</small>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Recent Orders */}
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 fw-bold">Recent Orders</h5>
                  <Button variant="link" size="sm" className="text-decoration-none" onClick={() => setActiveScreen('orders')}>
                    View All →
                  </Button>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {recentOrders.map((order) => (
                    <div key={order.id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">{order.id}</h6>
                          <small className="text-muted">{order.customer}</small>
                        </div>
                        <Badge bg={
                          order.status === 'Delivered' ? 'success' :
                          order.status === 'In Progress' ? 'info' :
                          order.status === 'Approved' ? 'primary' :
                          'warning'
                        } className="bg-opacity-10 text-dark">
                          {order.status}
                        </Badge>
                      </div>
                      <small className="text-muted d-block">Status: {order.status}</small>
                      <small className="text-muted d-block">Created: {order.date}</small>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Open Task Modal
  const OpenTaskModal = () => {
    const minDate = new Date().toISOString().split('T')[0];

    return (
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>Open Task</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            {/* Task Title */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Task Title <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter task title"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              />
            </Form.Group>

            <Row>
              {/* Name */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter contact name"
                    value={taskFormData.name}
                    onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                  />
                </Form.Group>
              </Col>

              {/* Phone */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Enter phone number"
                    value={taskFormData.phone}
                    onChange={(e) => setTaskFormData({ ...taskFormData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              {/* Email */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email address"
                    value={taskFormData.email}
                    onChange={(e) => setTaskFormData({ ...taskFormData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>

              {/* Company Name */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter company name"
                    value={taskFormData.companyName}
                    onChange={(e) => setTaskFormData({ ...taskFormData, companyName: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              {/* Assigned To */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Assigned to <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={taskFormData.assignedTo}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                  >
                    <option value="">Select user...</option>
                    <option value="John Doe (501)">John Doe (501)</option>
                    <option value="Jane Smith (502)">Jane Smith (502)</option>
                    <option value="Mike Johnson (503)">Mike Johnson (503)</option>
                    <option value="Sarah Williams (504)">Sarah Williams (504)</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Assigned By */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Assigned by <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={taskFormData.assignedBy}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignedBy: e.target.value })}
                  >
                    <option value="">Select supervisor...</option>
                    <option value="Manager One (601)">Manager One (601)</option>
                    <option value="Manager Two (602)">Manager Two (602)</option>
                    <option value="Supervisor One (603)">Supervisor One (603)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              {/* Date Assigned */}
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Date Assigned</Form.Label>
                  <Form.Control
                    type="date"
                    value={taskFormData.dateAssigned}
                    disabled
                  />
                </Form.Group>
              </Col>

              {/* Urgency */}
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Urgency <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={taskFormData.urgency}
                    onChange={(e) => setTaskFormData({ ...taskFormData, urgency: e.target.value })}
                  >
                    <option value="">Select urgency...</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Due Date */}
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    min={minDate}
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Add Notes */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Add Notes <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Please contact Mr. Elvin via email and schedule a meeting for tomorrow."
                value={taskFormData.notes}
                onChange={(e) => setTaskFormData({ ...taskFormData, notes: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            disabled={!taskFormData.title || !taskFormData.name || !taskFormData.assignedTo || !taskFormData.assignedBy || !taskFormData.urgency || !taskFormData.notes}
            onClick={() => {
              console.log('Task Created:', taskFormData);
              alert('Task created successfully!');
              setShowTaskModal(false);
              setTaskFormData({
                title: '',
                name: '',
                phone: '',
                email: '',
                companyName: '',
                assignedTo: '',
                assignedBy: '',
                dateAssigned: new Date().toISOString().split('T')[0],
                urgency: '',
                dueDate: '',
                notes: ''
              });
            }}
          >
            <Plus size={16} className="me-2" />
            Create Task
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Calculate Lead Score
  const calculateLeadScore = (potential: string, urgency: string, followUpCount: number): number => {
    const potentialScore = potential === 'Hot' ? 95 : potential === 'Warm' ? 50 : 0;
    const urgencyScore = urgency === 'High' ? 95 : urgency === 'Medium' ? 50 : 0;
    const followUpScore = followUpCount >= 2 ? 95 : followUpCount === 1 ? 50 : 0;

    return (potentialScore * 0.5) + (urgencyScore * 0.3) + (followUpScore * 0.2);
  };

  // Add Prospect Modal
  const AddProspectModal = () => (
    <Modal show={showProspectModal} onHide={() => setShowProspectModal(false)} size="lg" centered>
      <Modal.Header closeButton className="border-bottom bg-light">
        <Modal.Title>Add New Prospect</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Form>
          {/* Personal Information */}
          <Card className="border-0 bg-light mb-4">
            <Card.Body>
              <h6 className="fw-bold mb-3 text-primary">Personal Information</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter first name"
                      value={prospectFormData.firstName}
                      onChange={(e) => setProspectFormData({...prospectFormData, firstName: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter last name"
                      value={prospectFormData.lastName}
                      onChange={(e) => setProspectFormData({...prospectFormData, lastName: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="tel" 
                      placeholder="+1 234 567 8900"
                      value={prospectFormData.phone}
                      onChange={(e) => setProspectFormData({...prospectFormData, phone: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="email" 
                      placeholder="email@example.com"
                      value={prospectFormData.email}
                      onChange={(e) => setProspectFormData({...prospectFormData, email: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Company & Source Information */}
          <Card className="border-0 bg-light mb-4">
            <Card.Body>
              <h6 className="fw-bold mb-3 text-success">Company & Source Information</h6>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter company name"
                      value={prospectFormData.company}
                      onChange={(e) => setProspectFormData({...prospectFormData, company: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Data Source</Form.Label>
                    <Form.Select 
                      value={prospectFormData.dataSource}
                      onChange={(e) => setProspectFormData({...prospectFormData, dataSource: e.target.value})}
                    >
                      <option value="Manual Entry">Manual Entry</option>
                      <option value="Website Form">Website Form</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Referral">Referral</option>
                      <option value="Campaign">Campaign</option>
                      <option value="Cold Outreach">Cold Outreach</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tags</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="e.g., Hot, Enterprise (comma separated)"
                    />
                    <Form.Text className="text-muted">Separate tags with commas</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      placeholder="Add any additional notes or comments"
                      value={prospectFormData.notes}
                      onChange={(e) => setProspectFormData({...prospectFormData, notes: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button variant="secondary" onClick={() => setShowProspectModal(false)}>
          Cancel
        </Button>
        {/* <Button variant="primary" onClick={() => {
          // Handle form submission
          console.log('Prospect data:', prospectFormData);
          setShowProspectModal(false);
          // Reset form
          setProspectFormData({
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            company: '',
            dataSource: 'Manual Entry',
            tags: [],
            notes: ''
          });
        }}>
          <Plus size={16} className="me-2" />
          Add Prospect
        </Button> */}
      </Modal.Footer>
    </Modal>
  );

  // Import Modal (Upload CSV)
  const ImportProspectsModal = () => (
    <Modal show={showImportModal} onHide={() => setShowImportModal(false)} size="lg" centered>
      <Modal.Header closeButton className="border-bottom bg-light">
        <Modal.Title>Upload CSV - Import Prospects</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="alert alert-info mb-4">
          <AlertCircle size={18} className="me-2" />
          <strong>Format Guidelines:</strong> Please ensure your file follows the format: First Name, Last Name, Phone, Email
          <br />
          <small>Note: Email addresses with '@' will be restricted. Empty fields are allowed.</small>
        </div>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Select CSV File <span className="text-danger">*</span></Form.Label>
            <Form.Control type="file" accept=".csv,.xlsx,.xls" />
            <Form.Text className="text-muted">
              Supported formats: CSV, XLSX, XLS
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Campaign/Source Name (Optional)</Form.Label>
            <Form.Control type="text" placeholder="Enter campaign name or source" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Assign To User (Optional)</Form.Label>
            <Form.Select>
              <option value="">Leave Unassigned</option>
              <option value="501">John Doe (501)</option>
              <option value="502">Jane Smith (502)</option>
              <option value="503">Mike Johnson (503)</option>
              <option value="504">Sarah Williams (504)</option>
            </Form.Select>
          </Form.Group>
          <div className="alert alert-warning">
            <small><strong>Note:</strong> The data will be uploaded even if some fields remain empty.</small>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button variant="secondary" onClick={() => setShowImportModal(false)}>Cancel</Button>
        <Button variant="primary">
          <Download size={16} className="me-2" />
          Upload & Import
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Data Assignment Modal
  const DataAssignmentModal = () => {
    // Calculate filtered records based on campaign and tags
    const filteredRecords = sampleProspects.filter(prospect => {
      const matchesCampaign = !assignmentFilterCampaign || 
        (prospect.dataSource === 'Campaign' && prospect.sourceFile === assignmentFilterCampaign);
      const matchesTags = assignmentFilterTags.length === 0 || 
        assignmentFilterTags.some(tag => prospect.tags.includes(tag));
      return matchesCampaign && matchesTags;
    });

    const totalFilteredRecords = filteredRecords.length;

    return (
      <Modal 
      show={showDataAssignmentModal} 
      onHide={() => {
        setShowDataAssignmentModal(false);
        setAssignmentFilterCampaign('');
        setAssignmentFilterTags([]);
        setAssignmentType('');
        setDistributionMode('');
        setAssignToCampaigns([]);
        setCustomExtensions('');
        setRecordsToAssign(0);
        setIncludeAssignedRecords(false);
      }} 
      size="lg" 
      centered
      backdrop="static"
    >
      <Modal.Header closeButton style={{ borderBottom: '1px solid #ccc' }} className="pb-2">
        <Modal.Title className="d-flex align-items-center gap-2 fs-5 fw-bold text-dark">
          <div className="p-2 bg-primary bg-opacity-10 rounded-3">
            <Target size={20} className="text-primary" />
          </div>
          Data Assignment
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="px-4 pb-4">
        <div className="alert alert-primary border-0 d-flex align-items-start mb-4 shadow-sm" style={{ 
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
          borderLeft: '4px solid #4f46e5'
        }}>
          <AlertCircle size={20} className="text-primary mt-1 me-2 flex-shrink-0" />
          <div>
            <strong className="d-block mb-1 text-dark">Smart Data Assignment</strong>
            <span className="text-muted small">Configure filters and assignment criteria to distribute prospects efficiently.</span>
          </div>
        </div>

        <Form>
          {/* Filter Section */}
          <div className="mb-4 p-4 rounded-4 border" style={{ 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div className="d-flex align-items-center gap-2 mb-4">
              <Filter size={18} className="text-primary" />
              <h6 className="mb-0 fw-bold text-dark">Filter Records</h6>
            </div>
            
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small text-muted mb-2">
                    <span className="d-flex align-items-center gap-1">
                      <TrendingUp size={14} />
                      Campaign Filter
                    </span>
                  </Form.Label>
                  <Select
                    options={[
                      { value: '', label: 'All Campaigns' },
                      { value: 'Q4 2024 Outreach', label: 'Q4 2024 Outreach' },
                      { value: 'Holiday Sale', label: 'Holiday Sale' },
                      { value: 'Product Launch', label: 'Product Launch' },
                      { value: 'Renewal Campaign', label: 'Renewal Campaign' }
                    ]}
                    value={assignmentFilterCampaign ? { value: assignmentFilterCampaign, label: assignmentFilterCampaign } : { value: '', label: 'All Campaigns' }}
                    onChange={(selected) => setAssignmentFilterCampaign(selected?.value || '')}
                    placeholder="Select campaign..."
                    isClearable
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
                  <Select
                    isMulti
                    options={[
                      { value: 'Hot Lead', label: 'Hot Lead' },
                      { value: 'Follow Up', label: 'Follow Up' },
                      { value: 'Decision Maker', label: 'Decision Maker' },
                      { value: 'Budget Approved', label: 'Budget Approved' },
                      { value: 'Gatekeeper', label: 'Gatekeeper' }
                    ]}
                    value={assignmentFilterTags.map(tag => ({ value: tag, label: tag }))}
                    onChange={(selected) => setAssignmentFilterTags(selected ? selected.map(s => s.value) : [])}
                    placeholder="Select tags..."
                    styles={customSelectStyles}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Total Records Display with Breakdown */}
            <div className="mt-4 p-4 rounded-3" style={{ 
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(74, 222, 128, 0.08) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <Row className="g-3 align-items-center">
                <Col md={4}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-3 bg-success bg-opacity-10 rounded-3">
                      <Users size={28} className="text-success" />
                    </div>
                    <div>
                      <small className="text-muted d-block mb-1">Total Records</small>
                      <strong className="fs-3 text-dark">{totalFilteredRecords.toLocaleString()}</strong>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-3 bg-primary bg-opacity-10 rounded-3">
                      <UserPlus size={28} className="text-primary" />
                    </div>
                    <div>
                      <small className="text-muted d-block mb-1">Assigned</small>
                      <strong className="fs-3 text-dark">
                        {filteredRecords.filter(r => r.assignedTo && r.assignedTo !== 'Unassigned').length.toLocaleString()}
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
                      <small className="text-muted d-block mb-1">Unassigned</small>
                      <strong className="fs-3 text-dark">
                        {filteredRecords.filter(r => !r.assignedTo || r.assignedTo === 'Unassigned').length.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          {/* Assignment Type Section */}
          <div className="mb-4 p-4 rounded-4 border" style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted mb-2">
                Assignment Type <span className="text-danger">*</span>
              </Form.Label>
              <Select
                options={[
                  { value: 'campaigns', label: 'Assign to Campaigns' },
                  { value: 'custom', label: 'Assign to Custom Extensions' }
                ]}
                value={assignmentType ? { value: assignmentType, label: assignmentType === 'campaigns' ? 'Assign to Campaigns' : 'Assign to Custom Extensions' } : null}
                onChange={(selected) => {
                  setAssignmentType(selected?.value || '');
                  setDistributionMode('');
                  setAssignToCampaigns([]);
                  setCustomExtensions('');
                }}
                placeholder="Select assignment type..."
                isClearable
                styles={customSelectStyles}
              />
            </Form.Group>

            {/* Conditional Fields for "Assign to Campaigns" */}
            {assignmentType === 'campaigns' && (
              <div className="p-4 rounded-3 border-0" style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)',
              }}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small text-muted mb-2">
                        Distribution Mode <span className="text-danger">*</span>
                      </Form.Label>
                      <Select
                        options={[
                          { value: 'equal', label: 'Equal Distribution' },
                          { value: 'proportional', label: 'Proportional Distribution' }
                        ]}
                        value={distributionMode ? { value: distributionMode, label: distributionMode === 'equal' ? 'Equal Distribution' : 'Proportional Distribution' } : null}
                        onChange={(selected) => setDistributionMode(selected?.value || '')}
                        placeholder="Select distribution mode..."
                        isClearable
                        styles={customSelectStyles}
                      />
                      {distributionMode && (
                        <div className="mt-2 p-2 rounded-2 bg-white border">
                          <small className="text-muted d-flex align-items-start gap-2">
                            <AlertCircle size={14} className="mt-1 flex-shrink-0 text-primary" />
                            <span>
                              {distributionMode === 'equal' && 'Records will be distributed equally across all selected campaigns'}
                              {distributionMode === 'proportional' && 'Records will be distributed based on individual campaign capacity and requirements'}
                            </span>
                          </small>
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small text-muted mb-2">
                        Target Campaigns <span className="text-danger">*</span>
                      </Form.Label>
                      <Select
                        isMulti
                        options={[
                          { value: 'Q4 2024 Outreach', label: 'Q4 2024 Outreach' },
                          { value: 'Holiday Sale', label: 'Holiday Sale' },
                          { value: 'Product Launch', label: 'Product Launch' },
                          { value: 'Renewal Campaign', label: 'Renewal Campaign' },
                          { value: 'Email Nurture Series', label: 'Email Nurture Series' }
                        ]}
                        value={assignToCampaigns.map(campaign => ({ value: campaign, label: campaign }))}
                        onChange={(selected) => setAssignToCampaigns(selected ? selected.map(s => s.value) : [])}
                        placeholder="Select campaigns..."
                        styles={customSelectStyles}
                      />
                      {assignToCampaigns.length > 0 && (
                        <div className="mt-2 p-2 rounded-2 bg-white border">
                          <small className="text-muted">
                            <strong>{assignToCampaigns.length}</strong> campaign{assignToCampaigns.length !== 1 ? 's' : ''} selected
                          </small>
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* Conditional Fields for "Assign to Custom Extensions" */}
            {assignmentType === 'custom' && (
              <div className="p-4 rounded-3 border-0" style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)',
              }}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-2">
                    Custom Extensions <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control 
                    type="text"
                    value={customExtensions}
                    onChange={(e) => setCustomExtensions(e.target.value)}
                    placeholder="e.g., 501, 502, 503, 504"
                    className="border-2"
                  />
                  <small className="text-muted d-block mt-2">
                    Enter extension numbers separated by commas
                  </small>
                </Form.Group>

                {customExtensions && (
                  <div className="mt-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-semibold mb-0 small">Extension Assignment Preview</h6>
                      <Badge bg="secondary" className="bg-opacity-10 text-dark">
                        {customExtensions.split(',').length} Extensions
                      </Badge>
                    </div>
                    <div className="rounded-3 overflow-hidden border" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <Table hover size="sm" className="mb-0">
                        <thead style={{ 
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                          position: 'sticky',
                          top: 0
                        }}>
                          <tr>
                            <th className="border-0 py-3 fw-semibold small">Extension</th>
                            <th className="border-0 py-3 fw-semibold small">User Name</th>
                            <th className="border-0 py-3 fw-semibold small">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customExtensions.split(',').map((ext, idx) => {
                            const trimmedExt = ext.trim();
                            const userMap: { [key: string]: string } = {
                              '501': 'John Doe',
                              '502': 'Jane Smith',
                              '503': 'Mike Johnson',
                              '504': 'Sarah Williams',
                              '505': 'Tom Brown'
                            };
                            const userName = userMap[trimmedExt] || 'Unknown';
                            const isValid = userName !== 'Unknown';
                            
                            return (
                              <tr key={idx} className="align-middle">
                                <td className="py-3">
                                  <Badge bg="secondary" className="bg-opacity-10 text-dark fw-semibold px-3 py-2">
                                    {trimmedExt}
                                  </Badge>
                                </td>
                                <td className="py-3 fw-medium">{userName}</td>
                                <td className="py-3">
                                  <Badge 
                                    bg={isValid ? 'success' : 'danger'} 
                                    className="bg-opacity-10 px-3 py-2"
                                    style={{ color: isValid ? '#16a34a' : '#dc2626' }}
                                  >
                                    {isValid ? '✓ Valid' : '✗ Invalid'}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Number of Records to Assign */}
          <div className="mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold small text-muted mb-2">
                Number of Records to Assign <span className="text-danger">*</span>
              </Form.Label>
              <div className="position-relative">
                <Form.Control 
                  type="number"
                  min="1"
                  max={totalFilteredRecords}
                  value={recordsToAssign || ''}
                  onChange={(e) => setRecordsToAssign(parseInt(e.target.value) || 0)}
                  placeholder={`Enter number (max: ${totalFilteredRecords.toLocaleString()})`}
                  className="border-2 py-2"
                  style={{ paddingRight: '100px' }}
                />
                <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                  <small className="text-muted">of {totalFilteredRecords.toLocaleString()}</small>
                </div>
              </div>
              {recordsToAssign > 0 && recordsToAssign <= totalFilteredRecords && (
                <div className="mt-2 d-flex align-items-center gap-2">
                  <div className="flex-grow-1 bg-light rounded-pill overflow-hidden" style={{ height: '6px' }}>
                    <div 
                      className="bg-primary h-100 rounded-pill transition-all"
                      style={{ 
                        width: `${(recordsToAssign / totalFilteredRecords) * 100}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <small className="text-muted fw-medium">
                    {((recordsToAssign / totalFilteredRecords) * 100).toFixed(1)}%
                  </small>
                </div>
              )}
            </Form.Group>
          </div>

          {/* Assignment Settings */}
          <div className="mb-4 p-4 rounded-3" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.15)'
          }}>
            <h6 className="fw-bold mb-3 text-primary d-flex align-items-center">
              <Briefcase size={18} className="me-2" />
              Assignment Settings
            </h6>
            <div className="d-flex align-items-center justify-content-between p-3 bg-white rounded-3">
              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded-3" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                  <RefreshCw size={20} className="text-primary" />
                </div>
                <div>
                  <div className="fw-semibold text-dark mb-1">Include already assigned records (allow reassignment)</div>
                  <small className="text-muted">Enable this to include records that are already assigned to other users. They will be reassigned based on the selected criteria.</small>
                </div>
              </div>
              <Form.Check 
                type="switch"
                id="includeAssignedRecords"
                checked={includeAssignedRecords}
                onChange={(e) => setIncludeAssignedRecords(e.target.checked)}
                className="ms-3"
                style={{ transform: 'scale(1.3)' }}
              />
            </div>
          </div>

          <div className="alert alert-warning border-0 mb-0 d-flex align-items-start" style={{ 
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(252, 211, 77, 0.08) 100%)',
            borderLeft: '4px solid #f59e0b'
          }}>
            <AlertCircle size={18} className="text-warning mt-1 me-2 flex-shrink-0" />
            <small className="text-dark">
              <strong>Important:</strong> Assignment will be processed immediately based on your selected criteria. This action cannot be undone.
            </small>
          </div>
        </Form>
      </Modal.Body>
      
      <Modal.Footer className="border-0 pt-0 px-4 pb-4">
        <Button 
          variant="light" 
          onClick={() => {
            setShowDataAssignmentModal(false);
            setAssignmentFilterCampaign('');
            setAssignmentFilterTags([]);
            setAssignmentType('');
            setDistributionMode('');
            setAssignToCampaigns([]);
            setCustomExtensions('');
            setRecordsToAssign(0);
            setIncludeAssignedRecords(false);
          }}
          className="px-4 fw-semibold"
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          disabled={
            !assignmentType || 
            recordsToAssign === 0 || 
            recordsToAssign > totalFilteredRecords ||
            (assignmentType === 'campaigns' && (!distributionMode || assignToCampaigns.length === 0)) ||
            (assignmentType === 'custom' && !customExtensions)
          }
          onClick={() => {
            console.log('Assignment Data:', {
              filterCampaign: assignmentFilterCampaign,
              filterTags: assignmentFilterTags,
              totalRecords: totalFilteredRecords,
              assignmentType,
              distributionMode,
              assignToCampaigns,
              customExtensions,
              recordsToAssign,
              includeAssignedRecords
            });
            alert(`Successfully assigned ${recordsToAssign} records!`);
            setShowDataAssignmentModal(false);
            setAssignmentFilterCampaign('');
            setAssignmentFilterTags([]);
            setAssignmentType('');
            setDistributionMode('');
            setAssignToCampaigns([]);
            setCustomExtensions('');
            setRecordsToAssign(0);
            setIncludeAssignedRecords(false);
          }}
          className="px-4 fw-semibold d-flex align-items-center gap-2"
        >
          <UserPlus size={18} />
          Assign {recordsToAssign > 0 ? `${recordsToAssign.toLocaleString()} Records` : 'Records'}
        </Button>
      </Modal.Footer>
    </Modal>
    );
  };

  // Upload History Modal
  const UploadHistoryModal = () => {
    const activityHistory = [
      { id: 1, entityName: 'John Smith', action: 'Prospect → Lead', performedBy: 'Jane Smith (502)', date: '2025-11-19 10:30', company: 'Tech Corp', notes: 'Interested in enterprise package' },
      { id: 2, entityName: 'Acme Corporation', action: 'Lead → Deal', performedBy: 'John Doe (501)', date: '2025-11-19 09:15', company: 'Acme Corporation', notes: 'Negotiation phase started' },
      { id: 3, entityName: 'Sarah Johnson', action: 'Prospect Added', performedBy: 'Mike Johnson (503)', date: '2025-11-18 16:45', company: 'Digital Inc', notes: 'From Q4 Campaign' },
      { id: 4, entityName: 'Global Services Ltd', action: 'Deal → Order', performedBy: 'Sarah Williams (504)', date: '2025-11-18 14:20', company: 'Global Services', notes: 'Contract signed, $45,000' },
      { id: 5, entityName: 'Michael Brown', action: 'Lead → Deal', performedBy: 'Jane Smith (502)', date: '2025-11-18 11:00', company: 'Innovation Hub', notes: 'Proposal accepted' },
      { id: 6, entityName: 'Emily Davis', action: 'Prospect → Lead', performedBy: 'Tom Brown (505)', date: '2025-11-17 15:30', company: 'Smart Solutions', notes: 'Follow-up scheduled' },
      { id: 7, entityName: 'DataTech Systems', action: 'Deal → Order', performedBy: 'John Doe (501)', date: '2025-11-17 13:45', company: 'DataTech Systems', notes: 'Order confirmed, $32,000' },
      { id: 8, entityName: 'Robert Wilson', action: 'Prospect → Lead', performedBy: 'Sarah Williams (504)', date: '2025-11-17 10:15', company: 'Wilson Enterprises', notes: 'Hot lead - urgent' },
    ];

    return (
      <Modal show={showUploadHistoryModal} onHide={() => setShowUploadHistoryModal(false)} size="xl" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>CRM Activity History</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="mb-3">
            <Row className="align-items-center">
              <Col md={6}>
                <Form.Control type="search" placeholder="Search by name, company, or user..." size="sm" />
              </Col>
              <Col md={3}>
                <Form.Select size="sm">
                  <option>All Actions</option>
                  <option>Prospect Added</option>
                  <option>Prospect → Lead</option>
                  <option>Lead → Deal</option>
                  <option>Deal → Order</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select size="sm">
                  <option>Last 30 days</option>
                  <option>Last 7 days</option>
                  <option>Last 3 months</option>
                  <option>All time</option>
                </Form.Select>
              </Col>
            </Row>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table hover responsive>
              <thead className="bg-light sticky-top">
                <tr>
                  <th>Entity Name</th>
                  <th>Company</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Date & Time</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {activityHistory.map((activity) => (
                  <tr key={activity.id}>
                    <td className="fw-semibold">{activity.entityName}</td>
                    <td>{activity.company}</td>
                    <td>
                      <Badge 
                        bg={
                          activity.action === 'Deal → Order' ? 'success' :
                          activity.action === 'Lead → Deal' ? 'info' :
                          activity.action === 'Prospect → Lead' ? 'primary' :
                          'secondary'
                        }
                        className="bg-opacity-50"
                      >
                        {activity.action}
                      </Badge>
                    </td>
                    <td>{activity.performedBy}</td>
                    <td className="text-muted small">{activity.date}</td>
                    <td className="small">{activity.notes}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="mt-3 text-muted small">
            Showing {activityHistory.length} recent activities
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="outline-primary">
            <Download size={16} className="me-2" />
            Export History
          </Button>
          <Button variant="secondary" onClick={() => setShowUploadHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Call History Modal
  const CallHistoryModal = () => (
    <Modal show={showCallHistoryModal} onHide={() => setShowCallHistoryModal(false)} size="lg" centered>
      <Modal.Header closeButton className="border-bottom bg-light">
        <Modal.Title>Call History - {selectedProspect?.firstName} {selectedProspect?.lastName}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {selectedProspect?.callHistory && selectedProspect.callHistory.length > 0 ? (
          <Table hover>
            <thead className="bg-light">
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {selectedProspect.callHistory.map((call, index) => (
                <tr key={index}>
                  <td>{call.date}</td>
                  <td><Badge bg="primary" className="bg-opacity-10 text-dark">{call.status}</Badge></td>
                  <td>{call.comments}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="text-center text-muted py-4">No call history available</div>
        )}
      </Modal.Body>
    </Modal>
  );

  // Schedule Callback Modal
  const ScheduleCallbackModal = () => (
    <Modal 
      show={showScheduleCallbackModal} 
      onHide={() => {
        setShowScheduleCallbackModal(false);
        setScheduleCallbackData({
          prospectId: null,
          prospectName: '',
          callbackDate: '',
          callbackTime: '',
          duration: '15',
          callbackReason: '',
          priority: 'Medium',
          assignedTo: '',
          reminderBefore: '15',
          notes: '',
          communicationChannel: 'Phone Call'
        });
      }} 
      size="lg" 
      centered
    >
      <Modal.Header closeButton style={{  color: 'black', borderBottom: '1px solid #ccc' }}>
        <Modal.Title className="d-flex align-items-center">
          <Calendar size={24} className="me-2" />
          Schedule Callback
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {scheduleCallbackData.prospectName && (
          <div className="alert alert-info mb-4 d-flex align-items-center">
            <User size={20} className="me-2" />
            <span><strong>Contact:</strong> {scheduleCallbackData.prospectName}</span>
          </div>
        )}

        <Form>
          {/* Date and Time Section */}
          <div className="mb-4 p-3 rounded" style={{ background: '#f8f9fa' }}>
            <h6 className="fw-bold mb-3 text-primary d-flex align-items-center">
              <Clock size={18} className="me-2" />
              Schedule Details
            </h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Callback Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="date"
                    value={scheduleCallbackData.callbackDate}
                    onChange={(e) => setScheduleCallbackData({ ...scheduleCallbackData, callbackDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Callback Time <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="time"
                    value={scheduleCallbackData.callbackTime}
                    onChange={(e) => setScheduleCallbackData({ ...scheduleCallbackData, callbackTime: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              {/* <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Expected Duration <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={[
                      { value: '15', label: '15 minutes' },
                      { value: '30', label: '30 minutes' },
                      { value: '45', label: '45 minutes' },
                      { value: '60', label: '1 hour' },
                      { value: '90', label: '1.5 hours' },
                      { value: '120', label: '2 hours' }
                    ]}
                    value={{ value: scheduleCallbackData.duration, label: scheduleCallbackData.duration === '15' ? '15 minutes' : scheduleCallbackData.duration === '30' ? '30 minutes' : scheduleCallbackData.duration === '45' ? '45 minutes' : scheduleCallbackData.duration === '60' ? '1 hour' : scheduleCallbackData.duration === '90' ? '1.5 hours' : '2 hours' }}
                    onChange={(selected) => setScheduleCallbackData({ ...scheduleCallbackData, duration: selected?.value || '15' })}
                    styles={customSelectStyles}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Communication Channel <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={[
                      { value: 'Phone Call', label: '📞 Phone Call' },
                      { value: 'Video Meeting', label: '📹 Video Meeting' },
                      { value: 'WhatsApp', label: '💬 WhatsApp' },
                      { value: 'In-Person Meeting', label: '🤝 In-Person Meeting' }
                    ]}
                    value={{ value: scheduleCallbackData.communicationChannel, label: scheduleCallbackData.communicationChannel === 'Phone Call' ? '📞 Phone Call' : scheduleCallbackData.communicationChannel === 'Video Meeting' ? '📹 Video Meeting' : scheduleCallbackData.communicationChannel === 'WhatsApp' ? '💬 WhatsApp' : '🤝 In-Person Meeting' }}
                    onChange={(selected) => setScheduleCallbackData({ ...scheduleCallbackData, communicationChannel: selected?.value || 'Phone Call' })}
                    styles={customSelectStyles}
                  />
                </Form.Group>
              </Col> */}
            </Row>
          </div>

          {/* Callback Details Section */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3 text-success d-flex align-items-center">
              <FileText size={18} className="me-2" />
              Callback Information
            </h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Callback Reason <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={[
                      { value: 'Follow-up', label: 'Follow-up' },
                      { value: 'Product Demo', label: 'Product Demo' },
                      { value: 'Quote Discussion', label: 'Quote Discussion' },
                      { value: 'Pricing Inquiry', label: 'Pricing Inquiry' },
                      { value: 'Technical Support', label: 'Technical Support' },
                      { value: 'Contract Renewal', label: 'Contract Renewal' },
                      { value: 'Feedback Collection', label: 'Feedback Collection' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    value={scheduleCallbackData.callbackReason ? { value: scheduleCallbackData.callbackReason, label: scheduleCallbackData.callbackReason } : null}
                    onChange={(selected) => setScheduleCallbackData({ ...scheduleCallbackData, callbackReason: selected?.value || '' })}
                    placeholder="Select reason..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Form.Group>
              </Col>
              {/* <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Priority <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={[
                      { value: 'Low', label: '🟢 Low' },
                      { value: 'Medium', label: '🟡 Medium' },
                      { value: 'High', label: '🟠 High' },
                      { value: 'Urgent', label: '🔴 Urgent' }
                    ]}
                    value={{ value: scheduleCallbackData.priority, label: scheduleCallbackData.priority === 'Low' ? '🟢 Low' : scheduleCallbackData.priority === 'Medium' ? '🟡 Medium' : scheduleCallbackData.priority === 'High' ? '🟠 High' : '🔴 Urgent' }}
                    onChange={(selected) => setScheduleCallbackData({ ...scheduleCallbackData, priority: selected?.value || 'Medium' })}
                    styles={customSelectStyles}
                  />
                </Form.Group>
              </Col> */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Assign To <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={[
                      { value: 'John Doe (501)', label: 'John Doe (501)' },
                      { value: 'Jane Smith (502)', label: 'Jane Smith (502)' },
                      { value: 'Mike Johnson (503)', label: 'Mike Johnson (503)' },
                      { value: 'Sarah Williams (504)', label: 'Sarah Williams (504)' },
                      { value: 'Tom Brown (505)', label: 'Tom Brown (505)' }
                    ]}
                    value={scheduleCallbackData.assignedTo ? { value: scheduleCallbackData.assignedTo, label: scheduleCallbackData.assignedTo } : null}
                    onChange={(selected) => setScheduleCallbackData({ ...scheduleCallbackData, assignedTo: selected?.value || '' })}
                    placeholder="Select user..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Form.Group>
              </Col>
              {/* <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Reminder Before <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={[
                      { value: '0', label: 'No Reminder' },
                      { value: '5', label: '5 minutes before' },
                      { value: '15', label: '15 minutes before' },
                      { value: '30', label: '30 minutes before' },
                      { value: '60', label: '1 hour before' },
                      { value: '120', label: '2 hours before' },
                      { value: '1440', label: '1 day before' }
                    ]}
                    value={{ value: scheduleCallbackData.reminderBefore, label: scheduleCallbackData.reminderBefore === '0' ? 'No Reminder' : scheduleCallbackData.reminderBefore === '5' ? '5 minutes before' : scheduleCallbackData.reminderBefore === '15' ? '15 minutes before' : scheduleCallbackData.reminderBefore === '30' ? '30 minutes before' : scheduleCallbackData.reminderBefore === '60' ? '1 hour before' : scheduleCallbackData.reminderBefore === '120' ? '2 hours before' : '1 day before' }}
                    onChange={(selected) => setScheduleCallbackData({ ...scheduleCallbackData, reminderBefore: selected?.value || '15' })}
                    styles={customSelectStyles}
                  />
                </Form.Group>
              </Col> */}
            </Row>
          </div>

          {/* Notes Section */}
          <div className="mb-3">
            <Form.Group>
              <Form.Label className="fw-semibold small d-flex align-items-center">
                <FileText size={16} className="me-2" />
                Notes / Agenda
              </Form.Label>
              <Form.Control 
                as="textarea"
                rows={4}
                value={scheduleCallbackData.notes}
                onChange={(e) => setScheduleCallbackData({ ...scheduleCallbackData, notes: e.target.value })}
                placeholder="Add any notes, agenda items, or discussion points for this callback..."
              />
              <Form.Text className="text-muted small">
                Optional: Add context, talking points, or preparation notes
              </Form.Text>
            </Form.Group>
          </div>

          <div className="alert alert-success mb-0 d-flex align-items-center">
            <CheckCircle size={18} className="me-2" />
            <small><strong>Tip:</strong> A reminder notification will be sent to the assigned user before the scheduled time.</small>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top bg-light">
        <Button 
          variant="outline-secondary" 
          onClick={() => {
            setShowScheduleCallbackModal(false);
            setScheduleCallbackData({
              prospectId: null,
              prospectName: '',
              callbackDate: '',
              callbackTime: '',
              duration: '15',
              callbackReason: '',
              priority: 'Medium',
              assignedTo: '',
              reminderBefore: '15',
              notes: '',
              communicationChannel: 'Phone Call'
            });
          }}
        >
          <X size={16} className="me-1" />
          Cancel
        </Button>
        <Button 
          variant="primary"
          disabled={
            !scheduleCallbackData.callbackDate || 
            !scheduleCallbackData.callbackTime || 
            !scheduleCallbackData.callbackReason || 
            !scheduleCallbackData.assignedTo
          }
          onClick={() => {
            console.log('Scheduling callback:', scheduleCallbackData);
            alert(`Callback scheduled successfully for ${scheduleCallbackData.callbackDate} at ${scheduleCallbackData.callbackTime}`);
            setShowScheduleCallbackModal(false);
            setScheduleCallbackData({
              prospectId: null,
              prospectName: '',
              callbackDate: '',
              callbackTime: '',
              duration: '15',
              callbackReason: '',
              priority: 'Medium',
              assignedTo: '',
              reminderBefore: '15',
              notes: '',
              communicationChannel: 'Phone Call'
            });
          }}
        >
          <CheckCircle size={16} className="me-2" />
          Schedule Callback
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Add Follow-up Modal
  const AddFollowupModal = () => (
    <Modal 
      show={showAddFollowupModal} 
      onHide={() => {
        setShowAddFollowupModal(false);
        setFollowupData({
          leadId: null,
          leadName: '',
          followupDate: '',
          status: 'Pending',
          communicationChannel: 'Phone Call',
          notes: ''
        });
      }} 
      size="lg" 
      centered
    >
      <Modal.Header closeButton style={{  color: 'black', borderBottom: '1px solid #ccc' }}>
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
                  value={followupData.followupDate}
                  onChange={(e) => setFollowupData({ ...followupData, followupDate: e.target.value })}
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
                  value={{ value: followupData.status, label: followupData.status }}
                  onChange={(option) => setFollowupData({ ...followupData, status: option?.value || 'Pending' })}
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
                  onChange={(option) => setFollowupData({ ...followupData, communicationChannel: option?.value || 'Phone Call' })}
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
              followupDate: '',
              status: 'Pending',
              communicationChannel: 'Phone Call',
              notes: ''
            });
          }}
        >
          <X size={16} className="me-1" />
          Cancel
        </Button>
        <Button 
          variant="primary"
          disabled={!followupData.followupDate}
          onClick={() => {
            console.log('Adding follow-up:', followupData);
            alert(`Follow-up activity added successfully for ${followupData.followupDate}`);
            setShowAddFollowupModal(false);
            setFollowupData({
              leadId: null,
              leadName: '',
              followupDate: '',
              status: 'Pending',
              communicationChannel: 'Phone Call',
              notes: ''
            });
          }}
        >
          <Plus size={16} className="me-1" />
          Add Follow up
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Add Meeting Modal
  const AddMeetingModal = () => (
    <Modal 
      show={showAddMeetingModal} 
      onHide={() => {
        setShowAddMeetingModal(false);
        setMeetingData({
          leadId: null,
          leadName: '',
          meetingName: '',
          meetingType: 'Discovery Call',
          meetingOutcome: '',
          meetingDate: '',
          meetingTime: '',
          attendees: []
        });
      }} 
      size="lg" 
      centered
    >
      <Modal.Header closeButton style={{  color: 'black', borderBottom: '1px solid #ccc' }}>
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
                  onChange={(option) => setMeetingData({ ...meetingData, meetingType: option?.value || 'Discovery Call' })}
                  options={[
                    { value: 'Discovery Call', label: 'Discovery Call' },
                    { value: 'Product Demo', label: 'Product Demo' },
                    { value: 'Proposal Discussion', label: 'Proposal Discussion' },
                    { value: 'Negotiation', label: 'Negotiation' },
                    { value: 'Follow-up', label: 'Follow-up' },
                    { value: 'Closing', label: 'Closing' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  styles={customSelectStyles}
                  placeholder="Select meeting type..."
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
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="fw-semibold small mb-0">Attendees</Form.Label>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    // onClick={() => {
                    //   // This would typically open an attendee selection modal
                    //   const newAttendee = prompt('Enter attendee name:');
                    //   if (newAttendee && newAttendee.trim()) {
                    //     setMeetingData({ 
                    //       ...meetingData, 
                    //       attendees: [...meetingData.attendees, newAttendee.trim()] 
                    //     });
                    //   }
                    // }}
                  >
                    <UserPlus size={14} className="me-1" />
                    Add Attendees
                  </Button>
                </div>
                {meetingData.attendees.length > 0 ? (
                  <div className="border rounded p-2" style={{ background: '#f8f9fa' }}>
                    {meetingData.attendees.map((attendee, index) => (
                      <Badge 
                        key={index} 
                        bg="primary" 
                        className="me-2 mb-2 d-inline-flex align-items-center"
                        style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                      >
                        <User size={12} className="me-1" />
                        {attendee}
                        <X 
                          size={14} 
                          className="ms-2" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setMeetingData({
                              ...meetingData,
                              attendees: meetingData.attendees.filter((_, i) => i !== index)
                            });
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted small border rounded p-3 text-center" style={{ background: '#f8f9fa' }}>
                    <Users size={20} className="mb-2" />
                    <div>No attendees added yet. Click "Add Attendees" to invite team members.</div>
                  </div>
                )}
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
              meetingType: 'Discovery Call',
              meetingOutcome: '',
              meetingDate: '',
              meetingTime: '',
              attendees: []
            });
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
            !meetingData.meetingTime
          }
          onClick={() => {
            console.log('Scheduling meeting:', meetingData);
            alert(`Meeting "${meetingData.meetingName}" scheduled successfully for ${meetingData.meetingDate} at ${meetingData.meetingTime}`);
            setShowAddMeetingModal(false);
            setMeetingData({
              leadId: null,
              leadName: '',
              meetingName: '',
              meetingType: 'Discovery Call',
              meetingOutcome: '',
              meetingDate: '',
              meetingTime: '',
              attendees: []
            });
          }}
        >
          <Calendar size={16} className="me-1" />
          Schedule Meeting
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Helper function for downloading revision PDF
  const handleDownloadRevisionPDF = (revision: any) => {
    // Simulate PDF download
    console.log('Downloading PDF for:', revision.version);
    alert(`Downloading estimate ${revision.version} as PDF...\n\nGrand Total: £${revision.grandTotal.toLocaleString()}\nNet Value: £${revision.netValue.toLocaleString()}\nCreated: ${revision.created}`);
    // In real implementation, this would generate and download a PDF
  };

  // Add/Edit Item Modal Component
  const AddItemModal = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!editingDeal) return;
      
      const newItem = {
        ...itemFormData,
        subTotal: (itemFormData.unitPrice * itemFormData.quantity * (1 + itemFormData.tax / 100))
      };
      
      let updatedEstimations = [...(editingDeal.estimations || [])];
      
      if (editingItem !== null) {
        // Edit existing item
        updatedEstimations[editingItem] = newItem;
      } else {
        // Add new item
        updatedEstimations.push(newItem);
      }
      
      setEditingDeal({
        ...editingDeal,
        estimations: updatedEstimations
      });
      
      // Reset and close
      setShowAddItemModal(false);
      setEditingItem(null);
      setItemFormData({
        product: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        currency: 'GBP',
        tax: 20
      });
    };
    
    return (
      <Modal show={showAddItemModal} onHide={() => {
        setShowAddItemModal(false);
        setEditingItem(null);
        setItemFormData({
          product: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          currency: 'GBP',
          tax: 20
        });
      }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingItem !== null ? 'Edit Item' : 'Add New Item'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Product/Service Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter product or service name"
                    value={itemFormData.product}
                    onChange={(e) => setItemFormData({ ...itemFormData, product: e.target.value })}
                    required
                    disabled={editingItem !== null}
                  />
                  {editingItem !== null && (
                    <Form.Text className="text-muted">Product name cannot be edited</Form.Text>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description/Specification</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter product description or specifications"
                    value={itemFormData.description}
                    onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                    disabled={editingItem !== null}
                  />
                  {editingItem !== null && (
                    <Form.Text className="text-muted">Description cannot be edited</Form.Text>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={itemFormData.quantity}
                    onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseInt(e.target.value) || 1 })}
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
                    value={itemFormData.unitPrice}
                    onChange={(e) => setItemFormData({ ...itemFormData, unitPrice: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Currency <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={itemFormData.currency}
                    onChange={(e) => setItemFormData({ ...itemFormData, currency: e.target.value })}
                    required
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tax % <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Enter tax percentage"
                    value={itemFormData.tax}
                    onChange={(e) => setItemFormData({ ...itemFormData, tax: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Card className="bg-light border-0">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Sub Total (with tax):</span>
                      <h5 className="mb-0 text-success">
                        {itemFormData.currency === 'GBP' ? '£' : itemFormData.currency === 'USD' ? '$' : '€'}
                        {(itemFormData.unitPrice * itemFormData.quantity * (1 + itemFormData.tax / 100)).toFixed(2)}
                      </h5>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => {
              setShowAddItemModal(false);
              setEditingItem(null);
              setItemFormData({
                product: '',
                description: '',
                quantity: 1,
                unitPrice: 0,
                currency: 'GBP',
                tax: 20
              });
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingItem !== null ? 'Update Item' : 'Add Item'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  };

  // Revision History Modal Component
  const RevisionHistoryModal = () => {
    // Mock revision history data with detailed items
    const revisionHistory = [
      {
        version: 'v3.0',
        created: '2025-11-28 14:30',
        grandTotal: 15420.50,
        netValue: 12850.42,
        items: [
          { product: 'Software License Pro', description: 'Annual subscription', quantity: 10, unitPrice: 450, currency: 'GBP', tax: 20, subTotal: 5400 },
          { product: 'Cloud Storage 5TB', description: 'Monthly plan', quantity: 5, unitPrice: 120, currency: 'GBP', tax: 20, subTotal: 720 },
          { product: 'Support Package Premium', description: '24/7 support', quantity: 1, unitPrice: 9300.50, currency: 'GBP', tax: 20, subTotal: 11160.60 }
        ]
      },
      {
        version: 'v2.0',
        created: '2025-11-25 10:15',
        grandTotal: 14200.00,
        netValue: 11833.33,
        items: [
          { product: 'Software License Pro', description: 'Annual subscription', quantity: 10, unitPrice: 450, currency: 'GBP', tax: 20, subTotal: 5400 },
          { product: 'Cloud Storage 5TB', description: 'Monthly plan', quantity: 4, unitPrice: 120, currency: 'GBP', tax: 20, subTotal: 576 },
          { product: 'Support Package Standard', description: 'Business hours support', quantity: 1, unitPrice: 8224, currency: 'GBP', tax: 20, subTotal: 9868.80 }
        ]
      },
      {
        version: 'v1.0',
        created: '2025-11-20 16:45',
        grandTotal: 12500.00,
        netValue: 10416.67,
        items: [
          { product: 'Software License Basic', description: 'Annual subscription', quantity: 10, unitPrice: 350, currency: 'GBP', tax: 20, subTotal: 4200 },
          { product: 'Cloud Storage 2TB', description: 'Monthly plan', quantity: 5, unitPrice: 80, currency: 'GBP', tax: 20, subTotal: 480 },
          { product: 'Support Package Basic', description: 'Email support', quantity: 1, unitPrice: 7820, currency: 'GBP', tax: 20, subTotal: 9384 }
        ]
      }
    ];
    
    const handleViewDetails = (revision: any) => {
      setSelectedRevision(revision);
      setShowRevisionDetailModal(true);
    };
    
    const handleRestoreVersion = (revision: any) => {
      if (window.confirm(`Are you sure you want to restore ${revision.version}?\n\nThis will replace the current estimation with the selected version.`)) {
        // Restore the revision items to editingDeal
        if (editingDeal) {
          setEditingDeal({
            ...editingDeal,
            estimations: revision.items
          });
          setShowRevisionHistoryModal(false);
          alert(`${revision.version} has been restored successfully!`);
        }
      }
    };
    
    return (
      <Modal show={showRevisionHistoryModal} onHide={() => setShowRevisionHistoryModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <History size={20} className="me-2" />
            Revision History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <Table hover>
              <thead className="bg-light">
                <tr>
                  <th>Version</th>
                  <th>Created</th>
                  <th>Grand Total</th>
                  <th>Net Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {revisionHistory.map((revision, index) => (
                  <tr key={index}>
                    <td>
                      <Badge bg={index === 0 ? 'success' : 'secondary'}>
                        {revision.version}
                      </Badge>
                      {index === 0 && (
                        <Badge bg="info" className="ms-2">Current</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Calendar size={14} className="me-2 text-muted" />
                        {revision.created}
                      </div>
                    </td>
                    <td className="fw-bold text-success">£{revision.grandTotal.toLocaleString()}</td>
                    <td>£{revision.netValue.toLocaleString()}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1" 
                          title="View Details"
                          onClick={() => handleViewDetails(revision)}
                        >
                          <Eye size={14} />
                        </Button>
                        {/* <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1" 
                          title="Download PDF"
                          onClick={() => handleDownloadRevisionPDF(revision)}
                        >
                          <Download size={14} />
                        </Button>
                        {index !== 0 && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-info" 
                            title="Restore Version"
                            onClick={() => handleRestoreVersion(revision)}
                          >
                            <RefreshCw size={14} />
                          </Button>
                        )} */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          <Card className="border-0 bg-light mt-3">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <small className="text-muted">Total Revisions</small>
                  <div className="fw-bold">{revisionHistory.length}</div>
                </Col>
                <Col md={6}>
                  <small className="text-muted">Latest Update</small>
                  <div className="fw-bold">{revisionHistory[0].created}</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRevisionHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Deal Complete History Modal Component
  const DealCompleteHistoryModal = () => {
    if (!selectedDealForHistory) return null;
    
    // Comprehensive history tracking all deal activities
    const dealHistory = [
      {
        id: 1,
        timestamp: '2025-11-30 15:45',
        category: 'Stage Change',
        action: 'Stage Updated',
        details: 'Deal moved from "Proposal" to "Negotiation"',
        performedBy: 'John Doe (501)',
        icon: <GitBranch size={16} />,
        color: '#0d6efd',
        metadata: { from: 'Proposal', to: 'Negotiation' }
      },
      {
        id: 2,
        timestamp: '2025-11-29 14:20',
        category: 'Financial',
        action: 'Value Updated',
        details: `Deal value changed from £45,000 to £${selectedDealForHistory.value}`,
        performedBy: 'Sarah Williams (504)',
        icon: <DollarSign size={16} />,
        color: '#198754',
        metadata: { from: '£45,000', to: selectedDealForHistory.value }
      },
      {
        id: 3,
        timestamp: '2025-11-28 16:30',
        category: 'Estimation',
        action: 'Revision Created',
        details: 'New estimate version v3.0 created with updated items',
        performedBy: 'John Doe (501)',
        icon: <FileText size={16} />,
        color: '#6f42c1',
        metadata: { version: 'v3.0', grandTotal: '£15,420.50' }
      },
      {
        id: 4,
        timestamp: '2025-11-27 11:15',
        category: 'Communication',
        action: 'Meeting Scheduled',
        details: 'Follow-up meeting scheduled for Dec 5, 2025 at 2:00 PM',
        performedBy: 'Jane Smith (502)',
        icon: <Calendar size={16} />,
        color: '#0dcaf0',
        metadata: { meetingDate: '2025-12-05 14:00', type: 'Follow-up' }
      },
      {
        id: 5,
        timestamp: '2025-11-26 10:00',
        category: 'Document',
        action: 'Proposal Sent',
        details: 'Proposal document sent to client via email',
        performedBy: 'Mike Johnson (503)',
        icon: <Send size={16} />,
        color: '#fd7e14',
        metadata: { documentType: 'Proposal', recipient: selectedDealForHistory.company }
      },
      {
        id: 6,
        timestamp: '2025-11-25 13:45',
        category: 'Estimation',
        action: 'Revision Created',
        details: 'Estimate version v2.0 created',
        performedBy: 'John Doe (501)',
        icon: <FileText size={16} />,
        color: '#6f42c1',
        metadata: { version: 'v2.0', grandTotal: '£14,200.00' }
      },
      {
        id: 7,
        timestamp: '2025-11-24 09:30',
        category: 'Assignment',
        action: 'Owner Changed',
        details: `Deal reassigned from Mike Johnson to ${selectedDealForHistory.owner}`,
        performedBy: 'Manager One (601)',
        icon: <UserCheck size={16} />,
        color: '#20c997',
        metadata: { from: 'Mike Johnson', to: selectedDealForHistory.owner }
      },
      {
        id: 8,
        timestamp: '2025-11-23 14:15',
        category: 'Communication',
        action: 'Call Logged',
        details: 'Discovery call completed - 45 minutes duration',
        performedBy: 'John Doe (501)',
        icon: <Phone size={16} />,
        color: '#0d6efd',
        metadata: { duration: '45 min', outcome: 'Positive' }
      },
      {
        id: 9,
        timestamp: '2025-11-22 16:20',
        category: 'Stage Change',
        action: 'Stage Updated',
        details: 'Deal moved from "Qualified" to "Proposal"',
        performedBy: 'John Doe (501)',
        icon: <GitBranch size={16} />,
        color: '#0d6efd',
        metadata: { from: 'Qualified', to: 'Proposal' }
      },
      {
        id: 10,
        timestamp: '2025-11-21 11:00',
        category: 'Note',
        action: 'Note Added',
        details: 'Client interested in premium package with extended support',
        performedBy: 'Sarah Williams (504)',
        icon: <MessageSquare size={16} />,
        color: '#6c757d',
        metadata: { noteType: 'General' }
      },
      {
        id: 11,
        timestamp: '2025-11-20 15:30',
        category: 'Estimation',
        action: 'Initial Estimate',
        details: 'First estimate version v1.0 created',
        performedBy: 'John Doe (501)',
        icon: <FileText size={16} />,
        color: '#6f42c1',
        metadata: { version: 'v1.0', grandTotal: '£12,500.00' }
      },
      {
        id: 12,
        timestamp: '2025-11-20 14:00',
        category: 'Creation',
        action: 'Deal Created',
        details: `Deal "${selectedDealForHistory.name}" created from lead qualification`,
        performedBy: 'John Doe (501)',
        icon: <Plus size={16} />,
        color: '#198754',
        metadata: { initialStage: 'New', source: 'Lead Conversion' }
      }
    ];
    
    const categoryColors: { [key: string]: string } = {
      'Stage Change': '#0d6efd',
      'Financial': '#198754',
      'Estimation': '#6f42c1',
      'Communication': '#0dcaf0',
      'Document': '#fd7e14',
      'Assignment': '#20c997',
      'Note': '#6c757d',
      'Creation': '#198754'
    };
    
    return (
      <Modal 
        show={showDealHistoryModal} 
        onHide={() => {
          setShowDealHistoryModal(false);
          setSelectedDealForHistory(null);
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
              setSelectedDealForHistory(null);
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
                {selectedDealForHistory.name} - All Activities & Changes
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
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedDealForHistory.name}</div>
                </Col>
                <Col md={3}>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Current Value</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#198754' }}>{selectedDealForHistory.value}</div>
                </Col>
                <Col md={3}>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Current Stage</div>
                  <Badge bg="primary" style={{ fontSize: '13px', padding: '6px 12px' }}>{selectedDealForHistory.stage}</Badge>
                </Col>
                <Col md={3}>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Owner</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedDealForHistory.owner}</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Timeline */}
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
            
            {dealHistory.map((item, index) => (
              <div 
                key={item.id} 
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
                  border: `3px solid ${item.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  boxShadow: `0 0 0 4px ${item.color}20`
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
                          background: `${item.color}15`,
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                              {item.action}
                            </span>
                            <div
  style={{
    display: "inline-block",
    backgroundColor: item.color,   // dynamic background
    color: "#fff",
    fontSize: "11px",
    padding: "3px 8px",
    fontWeight: 500,
    borderRadius: "0.375rem",      // same as Bootstrap badge rounded corners
    lineHeight: 1,
    textAlign: "center",
    whiteSpace: "nowrap",
    verticalAlign: "baseline",
  }}
>
  {item.category}
</div>

                            {/* <Badge 
                              style={{ 
                                background: `${item.color}`, 
                                color: "#fff",
                                fontSize: '11px',
                                padding: '3px 8px',
                                fontWeight: 500
                              }}
                            >
                              {item.category}
                            </Badge> */}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                            {item.details}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} />
                              {item.timestamp}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} />
                              {item.performedBy}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Metadata Tags */}
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div style={{ 
                        marginTop: '12px', 
                        paddingTop: '12px', 
                        borderTop: '1px solid #f3f4f6',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {Object.entries(item.metadata).map(([key, value]) => (
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
                            <strong>{key}:</strong> {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>

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
            @keyframes shimmer {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }
          `}</style>
        </Modal.Body>

        <Modal.Footer style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '20px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              <strong>{dealHistory.length}</strong> activities recorded
            </div>
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowDealHistoryModal(false);
                setSelectedDealForHistory(null);
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
    );
  };

  // Revision Detail Modal Component
  const RevisionDetailModal = () => {
    if (!selectedRevision) return null;
    
    return (
      <Modal show={showRevisionDetailModal} onHide={() => {
        setShowRevisionDetailModal(false);
        setSelectedRevision(null);
      }} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FileText size={20} className="me-2" />
            Estimate Details - {selectedRevision.version}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Card className="border-0 bg-light mb-3">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <small className="text-muted">Version</small>
                  <div className="fw-bold">
                    <Badge bg="success" className="me-2">{selectedRevision.version}</Badge>
                  </div>
                </Col>
                <Col md={3}>
                  <small className="text-muted">Created</small>
                  <div className="fw-bold">{selectedRevision.created}</div>
                </Col>
                <Col md={3}>
                  <small className="text-muted">Grand Total</small>
                  <div className="fw-bold text-success">£{selectedRevision.grandTotal.toLocaleString()}</div>
                </Col>
                <Col md={3}>
                  <small className="text-muted">Net Value</small>
                  <div className="fw-bold">£{selectedRevision.netValue.toLocaleString()}</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <h6 className="fw-bold mb-3">Items in this Estimate</h6>
          <div className="table-responsive">
            <Table hover className="bg-white">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Product/Service</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Currency</th>
                  <th>Tax %</th>
                  <th>Sub Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedRevision.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td className="fw-semibold">{item.product}</td>
                    <td className="text-muted small">{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>£{item.unitPrice.toLocaleString()}</td>
                    <td>
                      <Badge bg="secondary">{item.currency}</Badge>
                    </td>
                    <td>{item.tax}%</td>
                    <td className="fw-bold">£{item.subTotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-light">
                <tr>
                  <td colSpan={7} className="text-end fw-bold">Net Value:</td>
                  <td className="fw-bold">£{selectedRevision.netValue.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={7} className="text-end fw-bold">Tax (20%):</td>
                  <td className="fw-bold">£{(selectedRevision.grandTotal - selectedRevision.netValue).toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={7} className="text-end fw-bold text-success">Grand Total:</td>
                  <td className="fw-bold text-success">£{selectedRevision.grandTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => {
            setShowRevisionDetailModal(false);
            setSelectedRevision(null);
          }}>
            Close
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => {
              handleDownloadRevisionPDF(selectedRevision);
            }}
          >
            <Download size={16} className="me-2" />
            Download PDF
          </Button>
          {selectedRevision.version !== 'v3.0' && (
            <Button 
              variant="info" 
              onClick={() => {
                setShowRevisionDetailModal(false);
                if (window.confirm(`Restore ${selectedRevision.version}?\n\nThis will replace the current estimation.`)) {
                  if (editingDeal) {
                    setEditingDeal({
                      ...editingDeal,
                      estimations: selectedRevision.items
                    });
                    setShowRevisionHistoryModal(false);
                    setSelectedRevision(null);
                    alert(`${selectedRevision.version} has been restored successfully!`);
                  }
                }
              }}
            >
              <RefreshCw size={16} className="me-2" />
              Restore This Version
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
  };

  // Manage Attachments Modal Component
  const ManageAttachmentsModal = () => {
    if (!selectedDealForAttachments) return null;

    // Mock attachments data - you can replace with actual data from deal
    const attachments = selectedDealForAttachments.attachments || [
      { id: 1, name: 'Contract_Draft.pdf', size: '2.5 MB', uploadedBy: 'John Doe', uploadedAt: '2024-11-20', type: 'application/pdf' },
      { id: 2, name: 'Proposal_Final.docx', size: '1.8 MB', uploadedBy: 'Jane Smith', uploadedAt: '2024-11-22', type: 'application/docx' },
      { id: 3, name: 'Budget_Breakdown.xlsx', size: '856 KB', uploadedBy: 'Sarah Johnson', uploadedAt: '2024-11-25', type: 'application/xlsx' }
    ];

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        // Handle file upload logic here
        alert(`${files.length} file(s) selected for upload: ${Array.from(files).map(f => f.name).join(', ')}`);
      }
    };

    const handleDownload = (attachment: any) => {
      alert(`Downloading: ${attachment.name}`);
      // Implement actual download logic here
    };

    const handleDelete = (attachment: any) => {
      if (window.confirm(`Are you sure you want to delete "${attachment.name}"?`)) {
        alert(`Deleted: ${attachment.name}`);
        // Implement actual delete logic here
      }
    };

    return (
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
                <small className="text-muted">Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 10MB)</small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Form.Control
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                style={{ flex: 1 }}
              />
              <Button variant="primary" className="d-flex align-items-center gap-2">
                <Upload size={16} />
                Upload
              </Button>
            </div>
          </div>

          {/* Attachments List */}
          <div>
            <h6 className="mb-3 fw-bold d-flex align-items-center gap-2">
              <FileText size={18} />
              Attached Files ({attachments.length})
            </h6>
            
            {attachments.length === 0 ? (
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
                              background: attachment.type.includes('pdf') ? '#dc3545' : 
                                         attachment.type.includes('doc') ? '#0d6efd' : 
                                         attachment.type.includes('xls') ? '#198754' : '#6c757d',
                              color: 'white'
                            }}
                          >
                            <FileText size={22} />
                          </div>
                          
                          {/* File Info */}
                          <div className="flex-grow-1">
                            <div className="fw-semibold" style={{ fontSize: '14px' }}>{attachment.name}</div>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                              {attachment.size} • Uploaded by {attachment.uploadedBy} • {attachment.uploadedAt}
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
                            onClick={() => handleDownload(attachment)}
                          >
                            <DownloadIcon size={18} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-2 text-danger" 
                            title="Delete"
                            onClick={() => handleDelete(attachment)}
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
    );
  };
  
  // Deal Form Modal Component (Reusable)
  const DealFormModal = () => (
    <Modal show={showDealFormModal} onHide={() => { setShowDealFormModal(false); setEditingDeal(null); setDealFormStep(0); }} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>{editingDeal ? 'Edit Deal' : 'Add New Deal'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Timeline Navigation */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between position-relative">
            {/* Progress Line */}
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
                width: `${(dealFormStep / 4) * 100}%`,
                zIndex: 0,
                transition: 'width 0.3s ease'
              }}
            />
            
            {/* Step 1 */}
            <div 
              className="text-center position-relative" 
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => setDealFormStep(0)}
            >
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 0 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
              >
                {dealFormStep > 0 ? <CheckCircle size={20} /> : '1'}
              </div>
              <small className={`d-block mt-2 ${dealFormStep === 0 ? 'fw-bold text-primary' : 'text-muted'}`}>Deal Info</small>
            </div>

            {/* Step 2 */}
            <div 
              className="text-center position-relative" 
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => setDealFormStep(1)}
            >
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
              >
                {dealFormStep > 1 ? <CheckCircle size={20} /> : '2'}
              </div>
              <small className={`d-block mt-2 ${dealFormStep === 1 ? 'fw-bold text-primary' : 'text-muted'}`}>Company Info</small>
            </div>

            {/* Step 3 */}
            <div 
              className="text-center position-relative" 
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => setDealFormStep(2)}
            >
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
              >
                {dealFormStep > 2 ? <CheckCircle size={20} /> : '3'}
              </div>
              <small className={`d-block mt-2 ${dealFormStep === 2 ? 'fw-bold text-primary' : 'text-muted'}`}>Characteristics</small>
            </div>

            {/* Step 4 */}
            <div 
              className="text-center position-relative" 
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => setDealFormStep(3)}
            >
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
              >
                {dealFormStep > 3 ? <CheckCircle size={20} /> : '4'}
              </div>
              <small className={`d-block mt-2 ${dealFormStep === 3 ? 'fw-bold text-primary' : 'text-muted'}`}>Progress & Notes</small>
            </div>

            {/* Step 5 */}
            <div 
              className="text-center position-relative" 
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => setDealFormStep(4)}
            >
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 4 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
              >
                {dealFormStep > 4 ? <CheckCircle size={20} /> : '5'}
              </div>
              <small className={`d-block mt-2 ${dealFormStep === 4 ? 'fw-bold text-primary' : 'text-muted'}`}>Estimation</small>
            </div>
          </div>
        </div>

        {/* Form Content Based on Step */}
        <div style={{ minHeight: '400px' }}>
          {dealFormStep === 0 && (
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h5 className="fw-bold mb-4 text-primary">DEAL INFORMATION</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Deal Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" defaultValue={editingDeal?.name || ''} placeholder="Enter deal name" required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.type || ''} required>
                        <option value="">Select Type</option>
                        <option value="New Business">New Business</option>
                        <option value="Existing Business">Existing Business</option>
                        <option value="Renewal">Renewal</option>
                        <option value="Upsell">Upsell</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Expected Close Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="date" defaultValue={editingDeal?.expectedCloseDate || ''} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Assigned to <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.assignedTo || editingDeal?.owner || ''} required>
                        <option value="">Select User</option>
                        <option value="John Doe">John Doe</option>
                        <option value="Jane Doe">Jane Doe</option>
                        <option value="Sarah Smith">Sarah Smith</option>
                        <option value="Mike Johnson">Mike Johnson</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stage <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.stage || ''} required>
                        <option value="">Select Stage</option>
                        <option value="Qualification">Qualification</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Contract Sent">Contract Sent</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Probability <span className="text-danger">*</span></Form.Label>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Range defaultValue={editingDeal?.probability || 50} style={{ flex: 1 }} />
                        <Badge bg="primary" style={{ minWidth: '60px' }}>{editingDeal?.probability || 50}%</Badge>
                      </div>
                      <Form.Text className="text-muted">Likelihood of closing this deal</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={3} 
                        defaultValue={editingDeal?.description || ''} 
                        placeholder="Enter deal description"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {dealFormStep === 1 && (
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h5 className="fw-bold mb-4 text-success">COMPANY INFORMATION</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" defaultValue={editingDeal?.company || ''} placeholder="Enter company name" required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Industry <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.industry || ''} required>
                        <option value="">Select Industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                        <option value="Education">Education</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Telecommunications">Telecommunications</option>
                        <option value="Construction">Construction</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Main Decision Maker <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" defaultValue={editingDeal?.decisionMaker || editingDeal?.contactPerson || ''} placeholder="Decision maker name" required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Decision Maker Email <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="email" defaultValue={editingDeal?.decisionMakerEmail || editingDeal?.contactEmail || ''} placeholder="decisionmaker@company.com" required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Decision Maker Phone <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="tel" defaultValue={editingDeal?.decisionMakerPhone || editingDeal?.contactPhone || ''} placeholder="+44 20 1234 5678" required />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {dealFormStep === 2 && (
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h5 className="fw-bold mb-4 text-info">DEAL CHARACTERISTICS</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Deal Type <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.dealType || ''} required>
                        <option value="">Select Deal Type</option>
                        <option value="New Sale">New Sale</option>
                        <option value="Renewal">Renewal</option>
                        <option value="Migration">Migration</option>
                        <option value="Cross-sell">Cross-sell</option>
                        <option value="Upsell">Upsell</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contract Length <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.contractLength || ''} required>
                        <option value="">Select Length</option>
                        <option value="1 month">1 month</option>
                        <option value="3 months">3 months</option>
                        <option value="6 months">6 months</option>
                        <option value="12 months">12 months</option>
                        <option value="24 months">24 months</option>
                        <option value="36 months">36 months</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Billing Model <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.billingModel || ''} required>
                        <option value="">Select Model</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Semi-Annual">Semi-Annual</option>
                        <option value="Annual">Annual</option>
                        <option value="One-time">One-time</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Terms <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.paymentTerms || ''} required>
                        <option value="">Select Terms</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Net 60">Net 60</option>
                        <option value="Upfront">Upfront</option>
                        <option value="50% Upfront">50% Upfront</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Risk Level <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.riskLevel || ''} required>
                        <option value="">Select Risk Level</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Competitors in Deal <span className="text-danger">*</span></Form.Label>
                      <Form.Control 
                        type="text" 
                        defaultValue={editingDeal?.competitors?.join(', ') || ''} 
                        placeholder="Enter competitor names (comma separated)"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {dealFormStep === 3 && (
            <div>
              {/* Negotiation Progress */}
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-warning">NEGOTIATION PROGRESS</h5>
                  <Row>
                    <Col md={12}>
                      <div className="d-flex align-items-center gap-4 mb-4 p-4 bg-white rounded shadow-sm">
                        {/* Circular Progress Indicator */}
                        <div className="position-relative" style={{ width: '140px', height: '140px', flexShrink: 0 }}>
                          {/* Background Circle */}
                          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                              cx="70"
                              cy="70"
                              r="60"
                              fill="none"
                              stroke="#e9ecef"
                              strokeWidth="12"
                            />
                            {/* Progress Circle */}
                            <circle
                              cx="70"
                              cy="70"
                              r="60"
                              fill="none"
                              stroke="url(#progressGradient)"
                              strokeWidth="12"
                              strokeDasharray={`${2 * Math.PI * 60}`}
                              strokeDashoffset={`${2 * Math.PI * 60 * (1 - 50 / 100)}`}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 1s ease' }}
                            />
                            <defs>
                              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#0d6efd', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#0dcaf0', stopOpacity: 1 }} />
                              </linearGradient>
                            </defs>
                          </svg>
                          {/* Center Text */}
                          <div className="position-absolute top-50 start-50 translate-middle text-center">
                            <div className="fw-bold" style={{ fontSize: '32px', color: '#0d6efd', lineHeight: 1 }}>
                              50%
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>Complete</div>
                          </div>
                        </div>
                        
                        {/* Progress Details */}
                        <div style={{ flex: 1 }}>
                          <h6 className="fw-bold mb-3" style={{ color: '#495057' }}>Deal Progress Tracker</h6>
                          
                          <div className="text-muted" style={{ fontSize: '12px' }}>
                          <Info size={16} className="me-1" />
                            Progress automatically calculated based on completed milestones
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
  <Form.Label className="fw-semibold">
    Quotation Sent <span className="text-danger">*</span>
  </Form.Label>

  <div className="d-flex gap-3 mt-2">
    <div className="custom-radio">
      <input
        type="radio"
        id="quotationSent-yes"
        name="quotationSent"
        value="Yes"
        defaultChecked={editingDeal?.quotationSent === "Yes"}
      />
      <label htmlFor="quotationSent-yes">Yes</label>
    </div>

    <div className="custom-radio">
      <input
        type="radio"
        id="quotationSent-no"
        name="quotationSent"
        value="No"
        defaultChecked={editingDeal?.quotationSent === "No" || !editingDeal?.quotationSent}
      />
      <label htmlFor="quotationSent-no">No</label>
    </div>
  </div>
</Form.Group>


                        </Col>
                        <Col md={4}>
  <Form.Group className="mb-3">
    <Form.Label className="fw-semibold">
      Contract Sent <span className="text-danger">*</span>
    </Form.Label>
    <div className="d-flex gap-3 mt-2">
      <div className="custom-radio">
        <input
          type="radio"
          id="contractSent-yes"
          name="contractSent"
          value="Yes"
          defaultChecked={editingDeal?.contractSent === "Yes"}
        />
        <label htmlFor="contractSent-yes">Yes</label>
      </div>
      <div className="custom-radio">
        <input
          type="radio"
          id="contractSent-no"
          name="contractSent"
          value="No"
          defaultChecked={editingDeal?.contractSent === "No" || !editingDeal?.contractSent}
        />
        <label htmlFor="contractSent-no">No</label>
      </div>
    </div>
  </Form.Group>
</Col>

<Col md={4}>
  <Form.Group className="mb-3">
    <Form.Label className="fw-semibold">
      Contract Received <span className="text-danger">*</span>
    </Form.Label>
    <div className="d-flex gap-3 mt-2">
      <div className="custom-radio">
        <input
          type="radio"
          id="contractReceived-yes"
          name="contractReceived"
          value="Yes"
          defaultChecked={editingDeal?.contractReceived === "Yes"}
        />
        <label htmlFor="contractReceived-yes">Yes</label>
      </div>
      <div className="custom-radio">
        <input
          type="radio"
          id="contractReceived-no"
          name="contractReceived"
          value="No"
          defaultChecked={editingDeal?.contractReceived === "No" || !editingDeal?.contractReceived}
        />
        <label htmlFor="contractReceived-no">No</label>
      </div>
    </div>
  </Form.Group>
</Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Attachments */}
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-info">ATTACHMENTS</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Document Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" placeholder="Enter document name" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Upload Document</Form.Label>
                        <Form.Control type="file" />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      {editingDeal?.attachments && editingDeal.attachments.length > 0 ? (
                        <div className="border rounded p-2 bg-white">
                          <small className="text-muted d-block mb-2">Attached Documents:</small>
                          {editingDeal.attachments.map((doc: any, idx: number) => (
                            <Badge key={idx} bg="secondary" className="me-2 mb-1">
                              <FileText size={12} className="me-1" />
                              {doc.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted p-3 border rounded bg-white">
                          <FileText size={24} className="mb-2" />
                          <div><small>No documents attached</small></div>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Additional Notes */}
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-primary">ADDITIONAL NOTES</h5>
                  <Form.Group className="mb-3">
                    <Form.Control 
                      as="textarea" 
                      rows={4} 
                      defaultValue={editingDeal?.additionalNotes || ''} 
                      placeholder="Enter any additional notes about this deal"
                    />
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Remarks by Supervisor */}
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-success">REMARKS BY SUPERVISOR</h5>
                  <Form.Group className="mb-3">
                    <Form.Control 
                      as="textarea" 
                      rows={4} 
                      defaultValue={editingDeal?.supervisorRemarks || ''} 
                      placeholder="Supervisor remarks and feedback"
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            </div>
          )}

          {dealFormStep === 4 && (
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h5 className="fw-bold mb-4 text-success">ESTIMATION CHART</h5>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex gap-2">
                    {/* <Button variant="outline-primary" size="sm">
                      <Edit size={14} className="me-1" />
                      Estimate Option
                    </Button> */}
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      onClick={() => setShowRevisionHistoryModal(true)}
                    >
                      <Eye size={14} className="me-1" />
                      Revision History
                    </Button>
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => {
                      setEditingItem(null);
                      setItemFormData({
                        product: '',
                        description: '',
                        quantity: 1,
                        unitPrice: 0,
                        currency: 'GBP',
                        tax: 20
                      });
                      setShowAddItemModal(true);
                    }}
                  >
                    <Plus size={14} className="me-1" />
                    Add Item
                  </Button>
                </div>
                <div className="table-responsive">
                  <Table size="sm" hover className="bg-white">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product/Service</th>
                        <th>Description/Specification</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Currency</th>
                        <th>Tax %</th>
                        <th>Sub Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingDeal?.estimations?.map((est: any, index: number) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{est.product}</td>
                          <td>{est.description || 'N/A'}</td>
                          <td>{est.quantity}</td>
                          <td>{est.unitPrice?.toLocaleString() || 0}</td>
                          <td>
                            <Badge bg="secondary">{est.currency || 'GBP'}</Badge>
                          </td>
                          <td>{est.tax || 0}%</td>
                          <td className="fw-bold">
                            {est.currency || '£'}{((est.unitPrice || 0) * (est.quantity || 0) * (1 + (est.tax || 0) / 100)).toLocaleString()}
                          </td>
                          <td>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 me-2"
                              title="Edit Item"
                              onClick={() => {
                                setEditingItem(index);
                                setItemFormData({
                                  product: est.product,
                                  description: est.description || '',
                                  quantity: est.quantity,
                                  unitPrice: est.unitPrice,
                                  currency: est.currency || 'GBP',
                                  tax: est.tax || 20
                                });
                                setShowAddItemModal(true);
                              }}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 text-danger"
                              title="Delete Item"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this item?')) {
                                  const updatedEstimations = editingDeal.estimations.filter((_: any, i: number) => i !== index);
                                  setEditingDeal({
                                    ...editingDeal,
                                    estimations: updatedEstimations
                                  });
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!editingDeal?.estimations || editingDeal.estimations.length === 0) && (
                        <tr>
                          <td colSpan={9} className="text-center text-muted py-4">
                            <Package size={32} className="text-muted mb-2" />
                            <div>No items in estimation chart</div>
                            <small>Click "Add Item" to add products or services</small>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                {editingDeal?.estimations && editingDeal.estimations.length > 0 && (
                  <div className="text-end mt-3 p-3 bg-white rounded border">
                    <h4 className="mb-0">
                      <strong>Grand Total:</strong> <span className="text-success">
                        £{editingDeal.estimations.reduce((sum: number, est: any) => 
                          sum + ((est.unitPrice || 0) * (est.quantity || 0) * (1 + (est.tax || 0) / 100)), 0
                        ).toLocaleString()}
                      </span>
                    </h4>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button 
          variant="secondary" 
          onClick={() => dealFormStep > 0 ? setDealFormStep(dealFormStep - 1) : setShowDealFormModal(false)}
        >
          {dealFormStep > 0 ? '← Previous' : 'Cancel'}
        </Button>
        <div className="d-flex gap-2">
          {dealFormStep < 4 ? (
            <Button 
              variant="primary"
              onClick={() => setDealFormStep(dealFormStep + 1)}
            >
              Next →
            </Button>
          ) : (
            <>
              <Button 
                variant="success"
                onClick={() => {
                  setConfirmAction({ type: 'convert-order', data: editingDeal });
                  setShowConfirmDialog(true);
                }}
              >
                <ShoppingBag size={16} className="me-1" />
                Convert to Order
              </Button>
              <Button variant="primary">
                {editingDeal ? 'Update Deal' : 'Create Deal'}
              </Button>
            </>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );

  // Filter Drawer Component
  // Column customization drawer (keeping simple version)
  const FilterDrawer = () => {
    return null; // Using new AdvancedFilter component instead
  };

  // Reminder Alert Component
  const ReminderAlert = () => {
    if (!showReminderAlert || !upcomingCall) return null;

    return (
      <div 
        className="position-fixed top-0 end-0 m-4" 
        style={{ zIndex: 9999, maxWidth: '400px' }}
      >
        <Card className="border-warning border-3 shadow-lg">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="d-flex align-items-center">
                <AlertCircle size={24} className="text-warning me-2" />
                <h6 className="mb-0 fw-bold">Upcoming Call Reminder</h6>
              </div>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 text-muted"
                onClick={() => setShowReminderAlert(false)}
              >
                <XCircle size={18} />
              </Button>
            </div>
            <p className="mb-2">
              <strong>Contact:</strong> {upcomingCall.firstName} {upcomingCall.lastName}
            </p>
            <p className="mb-2">
              <strong>Phone:</strong> {upcomingCall.phone}
            </p>
            <p className="mb-3">
              <strong>Scheduled:</strong> {upcomingCall.nextCallScheduled}
            </p>
            <div className="d-flex gap-2">
              <Button 
                variant="success" 
                size="sm" 
                onClick={() => {
                  console.log('Call marked as done');
                  setShowReminderAlert(false);
                }}
              >
                <CheckCircle size={14} className="me-1" />
                Done
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  console.log('Reminder dismissed');
                  setShowReminderAlert(false);
                }}
              >
                Dismiss
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Confirmation Dialog Component
  const ConfirmationDialog = () => (
    <Modal 
      show={showConfirmDialog} 
      onHide={() => {
        setShowConfirmDialog(false);
        setDeleteConfirmText('');
      }} 
      centered
    >
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title>
          {confirmAction?.type === 'delete' && 'Confirm Deletion'}
          {confirmAction?.type === 'convert-deal' && 'Convert to Deal'}
          {confirmAction?.type === 'convert-order' && 'Convert to Order'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {confirmAction?.type === 'delete' && (
          <div className="text-center">
            <AlertCircle size={48} className="text-danger mb-3" />
            <p className="mb-0">Are you sure you want to delete this {confirmAction.data?.itemType || 'item'}?</p>
            <p className="text-muted small mb-3">This action cannot be undone.</p>
            <div className="text-center mt-4">
              <Form.Label className="fw-semibold">Type <span className="text-danger fw-bold">DELETE</span> to confirm</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}
        {confirmAction?.type === 'convert-deal' && (
          <div className="text-center">
            <Handshake size={48} className="text-success mb-3" />
            <p className="mb-0">Convert <strong>{confirmAction.data?.name}</strong> to a Deal?</p>
            <p className="text-muted small mb-0">This will create a new deal opportunity and update the lead status.</p>
          </div>
        )}
        {confirmAction?.type === 'convert-order' && (
          <div className="text-center">
            <ShoppingBag size={48} className="text-primary mb-3" />
            <p className="mb-0">Convert <strong>{confirmAction.data?.name}</strong> to an Order?</p>
            <p className="text-muted small mb-0">This will create a new order and update the deal status.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button 
          variant="secondary" 
          onClick={() => {
            setShowConfirmDialog(false);
            setDeleteConfirmText('');
          }}
        >
          Cancel
        </Button>
        <Button 
          variant={confirmAction?.type === 'delete' ? 'danger' : 'success'}
          disabled={confirmAction?.type === 'delete' && deleteConfirmText !== 'DELETE'}
          onClick={() => {
            if (confirmAction?.type === 'delete') {
              console.log('Deleting:', confirmAction.data);
              alert(`${confirmAction.data?.itemType || 'Item'} deleted successfully`);
              setDeleteConfirmText('');
            } else if (confirmAction?.type === 'convert-deal') {
              setEditingDeal({ ...confirmAction.data, dealValue: '$20,000', stage: 'Proposal' });
              setShowDealFormModal(true);
            } else if (confirmAction?.type === 'convert-order') {
              console.log('Converting to order:', confirmAction.data);
              alert('Order created successfully');
            }
            setShowConfirmDialog(false);
          }}
        >
          {confirmAction?.type === 'delete' ? 'Delete' : 'Confirm'}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Lead View Modal
  const LeadViewModal = () => {
    if (!viewingLead) return null;
    
    return (
      <Modal show={showLeadViewModal} onHide={() => setShowLeadViewModal(false)} size="xl" centered>
        {/* Custom Header with Gradient */}
        <div style={{
          // background: 'linear-gradient(135deg, #4680ff 0%, #5a67d8 100%)',
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
          {/* Contact Information Section */}
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
            <User size={18} style={{ color: '#4680ff' }} />
            Contact Information
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
              }}>Email Address</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Mail size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingLead.email}
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
              }}>Phone Number</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Phone size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingLead.phone}
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
              }}>Company</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Building2 size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingLead.company}
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
                  bg={viewingLead.stage === 'Qualified' ? 'success' : viewingLead.stage === 'Contacted' ? 'info' : 'secondary'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingLead.stage}
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
                {viewingLead.assignedUser}
              </div>
            </div>
          </div>

          {/* Lead Metrics Section */}
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
            <TrendingUp size={18} style={{ color: '#4680ff' }} />
            Lead Metrics
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
              }}>Lead Potential</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingLead.leadPotential === 'Hot' ? 'danger' : viewingLead.leadPotential === 'Warm' ? 'warning' : 'secondary'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingLead.leadPotential}
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
              }}>Urgency</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingLead.urgency === 'High' ? 'danger' : viewingLead.urgency === 'Medium' ? 'warning' : 'info'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingLead.urgency}
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
              }}>Lead Score</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingLead.leadScore >= 70 ? 'success' : viewingLead.leadScore >= 40 ? 'warning' : 'danger'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingLead.leadScore}
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
              }}>Lead Type</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingLead.leadType || 'N/A'}
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
              }}>Industry</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingLead.industry || 'N/A'}
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
                <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingLead.created}
              </div>
            </div>
          </div>

          {/* Follow-ups Timeline */}
          {viewingLead.followUps && viewingLead.followUps.length > 0 && (
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
                Follow-up Activity ({viewingLead.followUps.length})
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
                {viewingLead.followUps.map((followUp: any, idx: number) => (
                  <div key={idx} style={{ position: 'relative', paddingBottom: '20px' }}>
                    <div style={{
                      content: '',
                      position: 'absolute',
                      left: '-26px',
                      top: '4px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: followUp.status === 'Completed' ? '#10b981' : '#4680ff',
                      border: '3px solid white',
                      boxShadow: '0 0 0 2px #e5e7eb'
                    }} />
                    <div style={{
                      background: '#f8f9fa',
                      padding: '12px 16px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                        {followUp.date} - {followUp.channel}
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', marginTop: '4px' }}>
                        <strong>{followUp.status}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
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
                setEditingLead(viewingLead);
                setShowLeadViewModal(false);
                setShowLeadFormModal(true);
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
                setEditingDeal(null);
                setDealFormStep(0);
                setShowLeadViewModal(false);
                setShowDealFormModal(true);
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
              <Calendar size={16} />
              Schedule Follow-up
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
              <Phone size={16} />
              Call Lead
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  // Deal View Modal
  const DealViewModal = () => {
    if (!viewingDeal) return null;
    
    return (
      <Modal show={showDealViewModal} onHide={() => setShowDealViewModal(false)} size="xl" centered>
        {/* Custom Header with Gradient */}
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
              }}>Deal Name</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingDeal.name}
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
              }}>Company</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Building2 size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingDeal.company}
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
              }}>Deal Value</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <DollarSign size={14} style={{ color: '#10b981', marginRight: '6px' }} />
                {viewingDeal.value || viewingDeal.dealValue}
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
                  bg={viewingDeal.stage === 'Won' ? 'success' : viewingDeal.stage === 'Lost' ? 'danger' : viewingDeal.stage === 'Negotiation' ? 'warning' : 'primary'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingDeal.stage}
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
              }}>Probability</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingDeal.probability >= 70 ? 'success' : viewingDeal.probability >= 40 ? 'warning' : 'danger'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingDeal.probability || 50}%
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
              }}>Owner</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <User size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingDeal.owner}
              </div>
            </div>
          </div>

          {/* Company Details Section */}
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
            Company Details
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
              }}>Industry</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingDeal.industry || 'N/A'}
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
              }}>Deal Type</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingDeal.dealType || 'N/A'}
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
              }}>Expected Close Date</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingDeal.expectedCloseDate || viewingDeal.closeDate || 'N/A'}
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
                <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingDeal.created}
              </div>
            </div>
          </div>

          {/* Action Buttons */}

          {/* Action Buttons Bar */}
          
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
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
                border: '2px solid #4680ff',
                transition: 'all 0.3s'
              }}
              onClick={() => {
                setSelectedDealForHistory(viewingDeal);
                setShowDealHistoryModal(true);
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#4680ff';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(70, 128, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#4680ff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <History size={16} />
              Complete History
            </Button>
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
                setEditingDeal(viewingDeal);
                setShowDealViewModal(false);
                setShowDealFormModal(true);
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
              Edit Deal
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
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#4680ff';
                e.currentTarget.style.color = '#4680ff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Close
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  // Order View Modal
  const OrderViewModal = () => {
    if (!viewingOrder) return null;
    
    return (
      <Modal show={showOrderViewModal} onHide={() => setShowOrderViewModal(false)} size="xl" centered>
        {/* Custom Header with Gradient */}
        <div style={{
          color: 'black',
          padding: '30px',
          position: 'relative',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button 
            onClick={() => setShowOrderViewModal(false)}
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
            {viewingOrder.id}
          </h3>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
            Order Details
          </p>
        </div>

        <Modal.Body style={{ padding: '30px' }}>
          {/* Order Information Section */}
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
            <ShoppingCart size={18} style={{ color: '#4680ff' }} />
            Order Information
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
              }}>Order ID</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Hash size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingOrder.id}
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
              }}>Linked Deal</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Handshake size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingOrder.linkedDeal || 'N/A'}
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
              }}>Order Value</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <DollarSign size={14} style={{ color: '#10b981', marginRight: '6px' }} />
                {viewingOrder.value}
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
                  bg={viewingOrder.stage === 'Completed' || viewingOrder.stage === 'Delivered' ? 'success' : viewingOrder.stage === 'In Progress' ? 'info' : viewingOrder.stage === 'Order Created' ? 'warning' : 'secondary'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingOrder.stage}
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
              }}>Approval Status</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingOrder.approvalStatus === 'Approved' ? 'success' : viewingOrder.approvalStatus === 'Pending' ? 'warning' : 'danger'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingOrder.approvalStatus}
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
              }}>Priority</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingOrder.priority === 'High' ? 'danger' : viewingOrder.priority === 'Medium' ? 'warning' : 'info'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingOrder.priority}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contract & Billing Section */}
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
            Contract & Billing Details
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
              }}>Contract Type</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingOrder.contractType || 'N/A'}
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
              }}>Contract Length</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingOrder.contractLength || 'N/A'}
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
              }}>Billing Model</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingOrder.billingModel || 'N/A'}
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
              }}>Billing Status</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingOrder.billingStatus === 'Paid' ? 'success' : viewingOrder.billingStatus === 'Not Billed' ? 'warning' : 'danger'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingOrder.billingStatus}
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
              }}>Payment Status</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingOrder.paymentStatus === 'Received' ? 'success' : viewingOrder.paymentStatus === 'Pending' ? 'warning' : 'danger'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingOrder.paymentStatus}
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
              }}>Fulfillment Status</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingOrder.fulfillmentStatus === 'Completed' ? 'success' : viewingOrder.fulfillmentStatus === 'In Progress' ? 'info' : viewingOrder.fulfillmentStatus === 'Pending' ? 'warning' : 'secondary'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingOrder.fulfillmentStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* POC Information Section */}
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
            <User size={18} style={{ color: '#4680ff' }} />
            Point of Contact
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
              }}>POC Name</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <User size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingOrder.pocName || 'N/A'}
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
              }}>POC Title</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingOrder.pocTitle || 'N/A'}
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
              }}>POC Phone</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Phone size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingOrder.pocPhone || 'N/A'}
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
              }}>Owner</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingOrder.owner || 'N/A'}
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
              }}>Order Date</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingOrder.orderDate || viewingOrder.created}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
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
                setEditingOrder(viewingOrder);
                setShowOrderViewModal(false);
                setShowOrderFormModal(true);
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
              Edit Order
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
              onClick={() => setShowOrderViewModal(false)}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#4680ff';
                e.currentTarget.style.color = '#4680ff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Close
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  // Prospect View Modal
  const ProspectViewModal = () => {
    if (!viewingProspect) return null;
    
    return (
      <Modal show={showProspectViewModal} onHide={() => setShowProspectViewModal(false)} size="xl" centered>
        {/* Custom Header with Gradient */}
        <div style={{
          // background: 'linear-gradient(135deg, #4680ff 0%, #5a67d8 100%)',
          color: 'black',
          padding: '30px',
          position: 'relative',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          borderBottom: '1px solid #e5e7eb'

        }}>
          <button 
            onClick={() => setShowProspectViewModal(false)}
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
            {viewingProspect.firstName} {viewingProspect.lastName}
          </h3>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
            Prospect Details
          </p>
        </div>

        <Modal.Body style={{ padding: '30px' }}>
          {/* Contact Information Section */}
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
            <User size={18} style={{ color: '#4680ff' }} />
            Contact Information
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
              }}>Full Name</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingProspect.firstName} {viewingProspect.lastName}
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
              }}>Phone Number</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Phone size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingProspect.phone}
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
              }}>Email Address</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Mail size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingProspect.email}
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
                {viewingProspect.assignedTo}
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
              }}>Last Call Status</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={viewingProspect.lastCallStatus === 'Answered' ? 'success' : 'warning'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingProspect.lastCallStatus || 'Not Called'}
                </Badge>
              </div>
            </div>
          </div>

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
              }}>Data Source</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg="primary"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: '#dbeafe',
                    color: '#1e40af'
                  }}
                >
                  {viewingProspect.dataSource}
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
              }}>Source File/Campaign</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingProspect.sourceFile}
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
              }}>Last Called</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingProspect.lastCalled || 'Never'}
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
              }}>Imported By</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingProspect.importedBy}
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          {viewingProspect.callHistory && viewingProspect.callHistory.length > 0 && (
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
                Recent Activity
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
                {viewingProspect.callHistory.map((call: any, idx: number) => (
                  <div key={idx} style={{ position: 'relative', paddingBottom: '20px' }}>
                    <div style={{
                      content: '',
                      position: 'absolute',
                      left: '-26px',
                      top: '4px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#4680ff',
                      border: '3px solid white',
                      boxShadow: '0 0 0 2px #e5e7eb'
                    }} />
                    <div style={{
                      background: '#f8f9fa',
                      padding: '12px 16px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                        {call.date}
                      </div>
                      <div style={{ fontSize: '14px', color: '#1f2937', marginTop: '4px' }}>
                        <strong>{call.status}</strong> - {call.comments}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
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
              <Phone size={16} />
              Call Now
            </Button>
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
                setSelectedProspect(viewingProspect);
                setShowProspectViewModal(false);
                setShowLeadModal(true);
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
              <UserPlus size={16} />
              Convert to Lead
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
              onClick={() => {
                if (viewingProspect) {
                  setScheduleCallbackData({
                    ...scheduleCallbackData,
                    prospectId: viewingProspect.id,
                    prospectName: `${viewingProspect.firstName} ${viewingProspect.lastName}`
                  });
                  setShowScheduleCallbackModal(true);
                }
              }}
            >
              <Calendar size={16} />
              Schedule Callback
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
              <FileText size={16} />
              Add Note
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  // Campaign View Modal
  const CampaignViewModal = () => {
    if (!viewingCampaign) return null;
    
    return (
      <Modal show={showCampaignViewModal} onHide={() => setShowCampaignViewModal(false)} size="xl" centered>
        {/* Custom Header with Gradient */}
        <div style={{
          color: 'black',
          padding: '30px',
          position: 'relative',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button 
            onClick={() => setShowCampaignViewModal(false)}
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
            {viewingCampaign.name}
          </h3>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
            Campaign Details
          </p>
        </div>

        <Modal.Body style={{ padding: '30px' }}>
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
                {viewingCampaign.name}
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
              }}>Owner</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <User size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingCampaign.owner}
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
                  bg={
                    viewingCampaign.status === 'Active' ? 'success' :
                    viewingCampaign.status === 'Draft' ? 'primary' :
                    viewingCampaign.status === 'Completed' ? 'secondary' :
                    'warning'
                  }
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingCampaign.status}
                </Badge>
              </div>
            </div>
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
                {viewingCampaign.description}
              </div>
            </div>
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
                {viewingCampaign.dateRange}
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
                {viewingCampaign.created}
              </div>
            </div>
          </div>

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
              onClick={() => setShowCampaignViewModal(false)}
              style={{
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: 500
              }}
            >
              Close
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                setShowCampaignViewModal(false);
                setEditingCampaign(viewingCampaign);
                setCampaignFormData({
                  name: viewingCampaign.name,
                  description: viewingCampaign.description,
                  owner: viewingCampaign.owner,
                  status: viewingCampaign.status,
                  startDate: viewingCampaign.dateRange.split(' - ')[0],
                  endDate: viewingCampaign.dateRange.split(' - ')[1],
                  created: viewingCampaign.created
                });
                setShowCampaignModal(true);
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
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  // Task View Modal
  const TaskModal = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Task saved:', taskFormData);
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskFormData({
        title: '',
        name: '',
        phone: '',
        email: '',
        companyName: '',
        assignedTo: '',
        assignedBy: '',
        dateAssigned: new Date().toISOString().split('T')[0],
        urgency: '',
        dueDate: '',
        notes: ''
      });
    };

    return (
      <Modal show={showTaskModal} onHide={() => {
        setShowTaskModal(false);
        setEditingTask(null);
        setTaskFormData({
          title: '',
          name: '',
          phone: '',
          email: '',
          companyName: '',
          assignedTo: '',
          assignedBy: '',
          dateAssigned: new Date().toISOString().split('T')[0],
          urgency: '',
          dueDate: '',
          notes: ''
        });
      }} size="lg" centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title>{editingTask ? 'Edit Task' : 'Create New Task'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Task Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter task title"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Assigned To <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={taskFormData.assignedTo}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                    required
                  >
                    <option value="">Select user...</option>
                    <option value="John Doe">John Doe</option>
                    <option value="Jane Smith">Jane Smith</option>
                    <option value="Mike Johnson">Mike Johnson</option>
                    <option value="Sarah Williams">Sarah Williams</option>
                    <option value="Tom Brown">Tom Brown</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Assigned By</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter assigner name"
                    value={taskFormData.assignedBy}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignedBy: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Prospect Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter prospect name"
                    value={taskFormData.name}
                    onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Company</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter company name"
                    value={taskFormData.companyName}
                    onChange={(e) => setTaskFormData({ ...taskFormData, companyName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Enter phone number"
                    value={taskFormData.phone}
                    onChange={(e) => setTaskFormData({ ...taskFormData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email address"
                    value={taskFormData.email}
                    onChange={(e) => setTaskFormData({ ...taskFormData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Urgency <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={taskFormData.urgency}
                    onChange={(e) => setTaskFormData({ ...taskFormData, urgency: e.target.value })}
                    required
                  >
                    <option value="">Select urgency...</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Due Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date Assigned</Form.Label>
                  <Form.Control
                    type="date"
                    value={taskFormData.dateAssigned}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dateAssigned: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter task notes or description"
                    value={taskFormData.notes}
                    onChange={(e) => setTaskFormData({ ...taskFormData, notes: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-top">
            <Button variant="outline-secondary" onClick={() => {
              setShowTaskModal(false);
              setEditingTask(null);
              setTaskFormData({
                title: '',
                name: '',
                phone: '',
                email: '',
                companyName: '',
                assignedTo: '',
                assignedBy: '',
                dateAssigned: new Date().toISOString().split('T')[0],
                urgency: '',
                dueDate: '',
                notes: ''
              });
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  };

  const TaskViewModal = () => {
    if (!viewingTask) return null;
    
    return (
      <Modal show={showTaskViewModal} onHide={() => setShowTaskViewModal(false)} size="xl" centered>
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
            onClick={() => setShowTaskViewModal(false)}
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
            {viewingTask.task}
          </h3>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
            Task Details
          </p>
        </div>

        <Modal.Body style={{ padding: '30px' }}>
          {/* Task Information Section */}
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
            <CheckSquare size={18} style={{ color: '#4680ff' }} />
            Task Information
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
              }}>Type</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingTask.type}
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
                <User size={14} style={{ color: '#4680ff', marginRight: '6px' }} />
                {viewingTask.assignedTo}
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
              }}>Priority</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                <Badge 
                  bg={
                    viewingTask.priority === 'High' ? 'danger' :
                    viewingTask.priority === 'Medium' ? 'warning' :
                    'info'
                  }
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingTask.priority}
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
                <Badge 
                  bg={
                    viewingTask.status === 'Completed' ? 'success' :
                    viewingTask.status === 'In Progress' ? 'info' :
                    viewingTask.status === 'Pending' ? 'warning' :
                    'secondary'
                  }
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {viewingTask.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dates & Timeline Section */}
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
            Dates & Timeline
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
              }}>Due Date</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingTask.dueDate}
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
              }}>Created</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingTask.created}
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
              }}>Related To</div>
              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                {viewingTask.relatedTo}
              </div>
            </div>
          </div>
        </Modal.Body>
        
        <Modal.Footer className="border-top" style={{ background: 'white', padding: '1rem 1.5rem' }}>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowTaskViewModal(false)}
            style={{ borderRadius: '8px', padding: '0.5rem 1.5rem' }}
          >
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowTaskViewModal(false);
              // Add edit functionality
            }}
            style={{ borderRadius: '8px', padding: '0.5rem 1.5rem' }}
          >
            <Edit size={16} className="me-1" />
            Edit Task
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Generate Lead Modal
  const GenerateLeadModal = () => {
    const currentScore = calculateLeadScore(
      leadFormData.leadPotential,
      leadFormData.urgency,
      leadFormData.followUpCount
    );

    return (
      <Modal show={showLeadModal} onHide={() => setShowLeadModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>Generate Lead</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Lead Potential <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={leadFormData.leadPotential}
                    onChange={(e) => setLeadFormData({ ...leadFormData, leadPotential: e.target.value })}
                  >
                    <option value="">Select potential...</option>
                    <option value="Cold">Cold (0%)</option>
                    <option value="Warm">Warm (50%)</option>
                    <option value="Hot">Hot (95%)</option>
                  </Form.Select>
                  <Form.Text className="text-muted">Assessed likelihood of converting based on fit and interest (50% weight in score)</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Urgency <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={leadFormData.urgency}
                    onChange={(e) => setLeadFormData({ ...leadFormData, urgency: e.target.value })}
                  >
                    <option value="">Select urgency...</option>
                    <option value="Low">Low (0%)</option>
                    <option value="Medium">Medium (50%)</option>
                    <option value="High">High (95%)</option>
                  </Form.Select>
                  <Form.Text className="text-muted">How quickly they need to make a decision (30% weight in score)</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Follow-up Engagements (Last 2 weeks)</Form.Label>
              <Form.Select
                value={leadFormData.followUpCount}
                onChange={(e) => setLeadFormData({ ...leadFormData, followUpCount: parseInt(e.target.value) })}
              >
                <option value="0">0 follow-ups (0%)</option>
                <option value="1">1 follow-up (50%)</option>
                <option value="2">2 or more follow-ups (95%)</option>
              </Form.Select>
              <Form.Text className="text-muted">Number of meaningful interactions in recent weeks (20% weight in score)</Form.Text>
            </Form.Group>

            <div className="alert alert-success">
              <h5 className="mb-2">Calculated Lead Score</h5>
              <h3 className="mb-0">{currentScore.toFixed(2)} / 100</h3>
              <small className="text-muted">
                Formula: (Lead Potential × 50%) + (Urgency × 30%) + (Follow-up Engagement × 20%)
              </small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowLeadModal(false)}>Cancel</Button>
          <Button 
            variant="primary" 
            disabled={!leadFormData.leadPotential || !leadFormData.urgency}
            onClick={() => {
              console.log('Lead Generated:', { ...selectedProspect, ...leadFormData, leadScore: currentScore });
              alert(`Lead generated successfully with score: ${currentScore.toFixed(2)}`);
              setShowLeadModal(false);
            }}
          >
            Generate Lead
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Add Lead Form Modal (Full Form with 4 Steps)
  const AddLeadFormModal = () => {
    return (
      <Modal show={showLeadFormModal} onHide={() => { setShowLeadFormModal(false); setEditingLead(null); setLeadFormStep(0); }} size="xl" >
        <Modal.Header closeButton>
          <Modal.Title>{editingLead ? 'Edit Lead' : 'Add New Lead'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Timeline Navigation */}
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between position-relative">
              {/* Progress Line */}
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
                  width: `${(leadFormStep / 3) * 100}%`,
                  zIndex: 0,
                  transition: 'width 0.3s ease'
                }}
              />
              
              {/* Step 1 */}
              <div 
                className="text-center position-relative" 
                style={{ cursor: 'pointer', flex: 1 }}
                onClick={() => setLeadFormStep(0)}
              >
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${leadFormStep >= 0 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                  style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                >
                  {leadFormStep > 0 ? <CheckCircle size={20} /> : '1'}
                </div>
                <small className={`d-block mt-2 ${leadFormStep === 0 ? 'fw-bold text-primary' : 'text-muted'}`}>Lead Info</small>
              </div>

              {/* Step 2 */}
              <div 
                className="text-center position-relative" 
                style={{ cursor: 'pointer', flex: 1 }}
                onClick={() => setLeadFormStep(1)}
              >
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${leadFormStep >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                  style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                >
                  {leadFormStep > 1 ? <CheckCircle size={20} /> : '2'}
                </div>
                <small className={`d-block mt-2 ${leadFormStep === 1 ? 'fw-bold text-primary' : 'text-muted'}`}>Company Info</small>
              </div>

              {/* Step 3 */}
              <div 
                className="text-center position-relative" 
                style={{ cursor: 'pointer', flex: 1 }}
                onClick={() => setLeadFormStep(2)}
              >
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${leadFormStep >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                  style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                >
                  {leadFormStep > 2 ? <CheckCircle size={20} /> : '3'}
                </div>
                <small className={`d-block mt-2 ${leadFormStep === 2 ? 'fw-bold text-primary' : 'text-muted'}`}>Other Info</small>
              </div>

              {/* Step 4 */}
              <div 
                className="text-center position-relative" 
                style={{ cursor: 'pointer', flex: 1 }}
                onClick={() => setLeadFormStep(3)}
              >
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${leadFormStep >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                  style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                >
                  {leadFormStep > 3 ? <CheckCircle size={20} /> : '4'}
                </div>
                <small className={`d-block mt-2 ${leadFormStep === 3 ? 'fw-bold text-primary' : 'text-muted'}`}>Follow-ups</small>
              </div>
            </div>
          </div>

          {/* Form Content Based on Step */}
          <div style={{ minHeight: '400px' }}>
            {leadFormStep === 0 && (
              <Card className="border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-primary">LEAD INFORMATION</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Lead Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" defaultValue={editingLead?.name || ''} placeholder="Enter lead name" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Type <span className="text-danger">*</span></Form.Label>
                        <Form.Select defaultValue={editingLead?.leadType || ''} required>
                          <option value="">Select Type</option>
                          <option value="Inbound">Inbound</option>
                          <option value="Outbound">Outbound</option>
                          <option value="Referral">Referral</option>
                          <option value="Partner">Partner</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Lead Source <span className="text-danger">*</span></Form.Label>
                        <Form.Select defaultValue={editingLead?.leadSource || ''} required>
                          <option value="">Select Source</option>
                          <option value="Website">Website</option>
                          <option value="Email Campaign">Email Campaign</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Referral">Referral</option>
                          <option value="Cold Call">Cold Call</option>
                          <option value="Event">Event</option>
                          <option value="Advertisement">Advertisement</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>CRM Data Attribution</Form.Label>
                        <Form.Select defaultValue={editingLead?.crmAttribution || ''}>
                          <option value="">Select Attribution</option>
                          <option value="Website Form">Website Form</option>
                          <option value="Landing Page">Landing Page</option>
                          <option value="Cold Email">Cold Email</option>
                          <option value="Referral">Referral</option>
                          <option value="Event">Event</option>
                          <option value="Webinar">Webinar</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={3} 
                          defaultValue={editingLead?.description || ''} 
                          placeholder="Enter lead description or notes"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Assigned to <span className="text-danger">*</span></Form.Label>
                        <Form.Select defaultValue={editingLead?.assignedUser || ''} required>
                          <option value="">Select User</option>
                          <option value="John Doe">John Doe</option>
                          <option value="Jane Doe">Jane Doe</option>
                          <option value="Sarah Smith">Sarah Smith</option>
                          <option value="Mike Johnson">Mike Johnson</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stage <span className="text-danger">*</span></Form.Label>
                        <Form.Select defaultValue={editingLead?.stage || ''} required>
                          <option value="">Select Stage</option>
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Unqualified">Unqualified</option>
                          <option value="Nurturing">Nurturing</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Campaign <span className="text-danger">*</span></Form.Label>
                        <Form.Select defaultValue={editingLead?.campaign || ''} required>
                          <option value="">Select Campaign</option>
                          <option value="Q4 2025 Digital Campaign">Q4 2025 Digital Campaign</option>
                          <option value="Product Launch 2025">Product Launch 2025</option>
                          <option value="Email Nurture Series">Email Nurture Series</option>
                          <option value="Trade Show Q4">Trade Show Q4</option>
                          <option value="Social Media Ads">Social Media Ads</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {leadFormStep === 1 && (
              <Card className="border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-success">COMPANY INFORMATION</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" defaultValue={editingLead?.company || ''} placeholder="Enter company name" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Business Type <span className="text-danger">*</span></Form.Label>
                        <Form.Select defaultValue={editingLead?.businessType || ''} required>
                          <option value="">Select Type</option>
                          <option value="B2B">B2B (Business to Business)</option>
                          <option value="B2C">B2C (Business to Consumer)</option>
                          <option value="B2G">B2G (Business to Government)</option>
                          <option value="B2B2C">B2B2C</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Location <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" defaultValue={editingLead?.location || ''} placeholder="City, Country" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Person <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" defaultValue={editingLead?.contactPerson || ''} placeholder="Primary contact name" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="tel" defaultValue={editingLead?.phone || ''} placeholder="+44 20 1234 5678" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="email" defaultValue={editingLead?.email || ''} placeholder="email@example.com" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Website</Form.Label>
                        <Form.Control type="url" defaultValue={editingLead?.website || ''} placeholder="https://example.com" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Industry <span className="text-danger">*</span></Form.Label>
                        <Form.Select defaultValue={editingLead?.industry || ''} required>
                          <option value="">Select Industry</option>
                          <option value="Technology">Technology</option>
                          <option value="Finance">Finance</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Retail">Retail</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Education">Education</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Telecommunications">Telecommunications</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Size <span className="text-danger">*</span></Form.Label>
                        <Form.Select defaultValue={editingLead?.companySize || ''} required>
                          <option value="">Select Size</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501-1000">501-1000 employees</option>
                          <option value="1000+">1000+ employees</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Designation <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" defaultValue={editingLead?.designation || ''} placeholder="e.g., CEO, CTO, Marketing Manager" required />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {leadFormStep === 2 && (
              <Card className="border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-info">OTHER INFORMATION</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Lead Potential</Form.Label>
                        <Form.Select defaultValue={editingLead?.leadPotential || ''}>
                          <option value="">Select Potential</option>
                          <option value="Hot">Hot</option>
                          <option value="Warm">Warm</option>
                          <option value="Cold">Cold</option>
                        </Form.Select>
                        <Form.Text className="text-muted">Likelihood of converting based on engagement</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Requirement Confirmed</Form.Label>
                        <Form.Select defaultValue={editingLead?.requirementConfirmed || ''}>
                          <option value="">Select Status</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Form.Select>
                        <Form.Text className="text-muted">Has the customer confirmed their requirement?</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Urgency</Form.Label>
                        <Form.Select defaultValue={editingLead?.urgency || ''}>
                          <option value="">Select Urgency</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </Form.Select>
                        <Form.Text className="text-muted">Timeline for purchasing decision</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Lead Score</Form.Label>
                        <Form.Control 
                          type="number" 
                          min="0" 
                          max="100" 
                          defaultValue={editingLead?.leadScore || ''} 
                          placeholder="0-100"
                          disabled
                        />
                        <Form.Text className="text-muted">Auto-calculated based on engagement</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <div className="alert alert-info small mb-0">
                        <AlertCircle size={14} className="me-1" />
                        Lead score is automatically calculated based on potential, urgency, requirement status, and follow-up activities
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {leadFormStep === 3 && (
              <Card className="border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-warning">FOLLOW-UPS</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Follow-up Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          defaultValue={editingLead?.followUpDate || ''} 
                        />
                        <Form.Text className="text-muted">Schedule next follow-up activity</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Follow-up Status</Form.Label>
                        <Form.Select defaultValue={editingLead?.followUpStatus || ''}>
                          <option value="">Select Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Done">Done</option>
                        </Form.Select>
                        <Form.Text className="text-muted">Current follow-up status</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Communication Channel</Form.Label>
                        <Form.Select defaultValue={editingLead?.communicationChannel || ''}>
                          <option value="">Select Channel</option>
                          <option value="Email">Email</option>
                          <option value="Phone Call">Phone Call</option>
                          <option value="Video Meeting">Video Meeting</option>
                          <option value="In-Person Meeting">In-Person Meeting</option>
                          <option value="LinkedIn Message">LinkedIn Message</option>
                          <option value="WhatsApp">WhatsApp</option>
                        </Form.Select>
                        <Form.Text className="text-muted">Preferred communication method</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <div className="alert alert-success small">
                        <CheckCircle size={14} className="me-1" />
                        All required fields are marked with <span className="text-danger">*</span>. Complete all sections to create the lead.
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button 
            variant="outline-secondary" 
            onClick={() => setLeadFormStep(Math.max(0, leadFormStep - 1))}
            disabled={leadFormStep === 0}
          >
            <ChevronLeft size={16} className="me-1" />
            Back
          </Button>
          <Button variant="secondary" onClick={() => { setShowLeadFormModal(false); setEditingLead(null); setLeadFormStep(0); }}>
            Cancel
          </Button>
          {leadFormStep < 3 ? (
            <Button 
              variant="primary" 
              onClick={() => setLeadFormStep(Math.min(3, leadFormStep + 1))}
            >
              Next
              <ChevronRight size={16} className="ms-1" />
            </Button>
          ) : (
            <Button variant="success">
              <CheckCircle size={16} className="me-2" />
              {editingLead ? 'Update Lead' : 'Create Lead'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
  };

  // Prospects Screen
  const renderProspects = () => {
    const availableColumns = [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'dataSource', label: 'Data Source' },
      { key: 'sourceFile', label: 'Source File/Campaign' },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'lastCalled', label: 'Last Called' },
      { key: 'lastCallStatus', label: 'Last Call Status' },
      { key: 'callDisposition', label: 'Call Disposition' },
      { key: 'nextCallScheduled', label: 'Next Call Scheduled' },
      { key: 'viewStatus', label: 'View Status' },
      { key: 'tags', label: 'Tags' }
    ];

    // Sample bar chart data for calls per user
    const callsPerUserData = [
      { user: 'John Doe', calls: 12 },
      { user: 'Jane Smith', calls: 8 },
      { user: 'Mike Johnson', calls: 15 },
      { user: 'Sarah W.', calls: 10 },
      { user: 'Tom Brown', calls: 6 }
    ];

    return (
      <div>
        {AddProspectModal()}
        {ImportProspectsModal()}
        {CallHistoryModal()}
        {ScheduleCallbackModal()}
        {FilterDrawer()}
        {GenerateLeadModal()}
        {DataAssignmentModal()}
        {UploadHistoryModal()}
        {ProspectViewModal()}
        {ConfirmationDialog()}
        {AddLeadFormModal()}

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
              <BarChart3 size={16} className="me-2" />
              {showProspectsAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            <Button 
              variant="outline-info" 
              onClick={() => setShowUploadHistoryModal(true)}
            >
              <Activity size={16} className="me-2" />
              Activity History
            </Button>
            <Button 
              variant="outline-success" 
              onClick={() => setShowDataAssignmentModal(true)}
            >
              <UserPlus size={16} className="me-2" />
              Data Assignment
            </Button>
            <Button variant="outline-primary" onClick={() => setShowImportModal(true)}>
              <Download size={16} className="me-2" />
              Upload CSV
            </Button>
            {/* <Button variant="primary" onClick={() => setShowProspectModal(true)}>
              <Plus size={16} className="me-2" />
              Add Prospect
            </Button> */}
          </div>
        </div>

        {/* Analytics Section - Collapsible */}
        {showProspectsAnalytics && (
          <>
            {/* Summary Stats Grid - Collapsible */}
            <Row className="mb-2">
          <Col xl={3} lg={4} md={6} className="mb-3">
            <KPICard 
              title="Total Records"
              value="241"
              icon={<Users size={24} />}
              color="primary"
            />
          </Col>
          <Col xl={3} lg={4} md={6} className="mb-3">
            <KPICard 
              title="Scheduled"
              value="8"
              icon={<Calendar size={24} />}
              color="success"
            />
          </Col>
          <Col xl={3} lg={4} md={6} className="mb-3">
            <KPICard 
              title="Not Scheduled"
              value="233"
              icon={<XCircle size={24} />}
              color="secondary"
            />
          </Col>
          <Col xl={3} lg={4} md={6} className="mb-3">
            <KPICard 
              title="Next Hour"
              value="0"
              icon={<Clock size={24} />}
              color="info"
            />
          </Col>
          {showAllProspectStats && (
            <>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard 
                  title="Next 24h"
                  value="0"
                  icon={<Calendar size={24} />}
                  color="warning"
                />
              </Col>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard 
                  title="Overdue Calls"
                  value="8"
                  icon={<AlertCircle size={24} />}
                  color="danger"
                />
              </Col>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard 
                  title="Assigned Entries"
                  value="169"
                  icon={<UserPlus size={24} />}
                  color="primary"
                />
              </Col>
              <Col xl={3} lg={4} md={6} className="mb-3">
                <KPICard 
                  title="Unassigned Entries"
                  value="72"
                  icon={<AlertCircle size={24} />}
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

        {/* Analytics Charts Row */}
        <Row className="mb-4">
          {/* Calls Per User Bar Chart */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Calls Today by User</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={callsPerUserData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="user" tick={{ fontSize: 12 }} />
                    <YAxis label={{ value: 'Number of Calls', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="calls" fill="#0d6efd" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* Call Status Distribution Pie Chart */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Call Status Distribution</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Answered', value: 125, fill: '#198754' },
                        { name: 'No Answer', value: 68, fill: '#ffc107' },
                        { name: 'Busy', value: 32, fill: '#dc3545' },
                        { name: 'Not Called', value: 16, fill: '#6c757d' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          {/* Lead Source Distribution */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Lead Source Distribution</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Campaign', value: 145, fill: '#0d6efd' },
                        { name: 'Direct Upload', value: 62, fill: '#6f42c1' },
                        { name: 'Referral', value: 23, fill: '#20c997' },
                        { name: 'Website', value: 11, fill: '#fd7e14' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* Conversion Funnel */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Conversion Funnel</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { stage: 'Prospects', count: 241, fill: '#0d6efd' },
                      { stage: 'Leads', count: 89, fill: '#198754' },
                      { stage: 'Deals', count: 34, fill: '#ffc107' },
                      { stage: 'Orders', count: 12, fill: '#20c997' }
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {[
                        { stage: 'Prospects', count: 241, fill: '#0d6efd' },
                        { stage: 'Leads', count: 89, fill: '#198754' },
                        { stage: 'Deals', count: 34, fill: '#ffc107' },
                        { stage: 'Orders', count: 12, fill: '#20c997' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
          </>
        )}

        {/* Filter Bar prospects*/}
        <FilterBar
          quickFilters={[
            { id: 'all', label: 'All Prospects', count: 241, color: '#6c757d', activeColor: '#0d6efd', icon: <Users size={16} /> },
            { id: 'assigned', label: 'Assigned to Me', count: 58, color: '#0dcaf0', activeColor: '#0dcaf0', icon: <UserPlus size={16} /> },
            { id: 'not-called', label: 'Not Called', count: 45, color: '#fd7e14', activeColor: '#fd7e14', icon: <Phone size={16} /> },
            { id: 'answered', label: 'Answered', count: 125, color: '#198754', activeColor: '#198754', icon: <CheckCircle size={16} /> },
            { id: 'callback', label: 'Callback Required', count: 23, color: '#ffc107', activeColor: '#ffc107', icon: <AlertCircle size={16} /> },
            { id: 'scheduled', label: 'Scheduled Today', count: 8, color: '#20c997', activeColor: '#20c997', icon: <Calendar size={16} /> }
          ]}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => setActiveFilter(filterId)}
          searchValue={prospectsSearch}
          onSearchChange={(value) => setProspectsSearch(value)}
          onSearch={() => console.log('Searching prospects:', prospectsSearch)}
          searchPlaceholder="Search prospects by name, phone, email..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={Object.keys(prospectsFilters).filter(key => {
            const val = prospectsFilters[key as keyof typeof prospectsFilters];
            if (Array.isArray(val)) return val.length > 0;
            if (typeof val === 'object' && val !== null) return (val as any).start || (val as any).end;
            return val;
          }).length}
        />

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                {/* Row 1 */}
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Assigned To</Form.Label>
                  <Select
                    options={[
                      { value: 'John Doe (501)', label: 'John Doe (501)' },
                      { value: 'Jane Smith (502)', label: 'Jane Smith (502)' },
                      { value: 'Mike Johnson (503)', label: 'Mike Johnson (503)' },
                      { value: 'Sarah Williams (504)', label: 'Sarah Williams (504)' },
                      { value: 'Tom Brown (505)', label: 'Tom Brown (505)' }
                    ]}
                    value={prospectsFilters.assignedTo.length > 0 ? { value: prospectsFilters.assignedTo[0], label: prospectsFilters.assignedTo[0] } : null}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        assignedTo: selected ? [selected.value] : []
                      }));
                    }}
                    placeholder="Select..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Campaigns</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Q4 2024 Outreach', label: 'Q4 2024 Outreach' },
                      { value: 'Holiday Sale', label: 'Holiday Sale' },
                      { value: 'Product Launch', label: 'Product Launch' },
                      { value: 'Renewal Campaign', label: 'Renewal Campaign' }
                    ]}
                    value={prospectsFilters.campaigns.map(c => ({ value: c, label: c }))}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        campaigns: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select campaigns..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Last Call Status</Form.Label>
                  <Select
                    options={[
                      { value: 'Answered', label: 'Answered' },
                      { value: 'No Answer', label: 'No Answer' },
                      { value: 'Busy', label: 'Busy' },
                      { value: 'Voicemail', label: 'Voicemail' },
                      { value: 'Not Called', label: 'Not Called' }
                    ]}
                    value={prospectsFilters.lastCallStatus.length > 0 ? { value: prospectsFilters.lastCallStatus[0], label: prospectsFilters.lastCallStatus[0] } : null}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        lastCallStatus: selected ? [selected.value] : []
                      }));
                    }}
                    placeholder="Select..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Call Disposition</Form.Label>
                  <Select
                    options={[
                      { value: 'Interested', label: 'Interested' },
                      { value: 'Not Interested', label: 'Not Interested' },
                      { value: 'Callback Required', label: 'Callback Required' },
                      { value: 'Reschedule', label: 'Reschedule' },
                      { value: 'Wrong Number', label: 'Wrong Number' }
                    ]}
                    value={prospectsFilters.callDisposition.length > 0 ? { value: prospectsFilters.callDisposition[0], label: prospectsFilters.callDisposition[0] } : null}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        callDisposition: selected ? [selected.value] : []
                      }));
                    }}
                    placeholder="Select..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">View Status</Form.Label>
                  <Select
                    options={[
                      { value: 'Viewed', label: 'Viewed' },
                      { value: 'Not Viewed', label: 'Not Viewed' }
                    ]}
                    value={prospectsFilters.viewStatus.length > 0 ? { value: prospectsFilters.viewStatus[0], label: prospectsFilters.viewStatus[0] } : null}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        viewStatus: selected ? [selected.value] : []
                      }));
                    }}
                    placeholder="Select..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Col>
                
                {/* Row 2 */}
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Last Called Date</Form.Label>
                  <Select
                    options={[
                      { value: 'Today', label: 'Today' },
                      { value: 'Yesterday', label: 'Yesterday' },
                      { value: 'Last 7 days', label: 'Last 7 days' },
                      { value: 'Last 30 days', label: 'Last 30 days' },
                      { value: 'Custom range', label: 'Custom range' }
                    ]}
                    value={prospectsFilters.lastCalledDate.length > 0 ? { value: prospectsFilters.lastCalledDate[0], label: prospectsFilters.lastCalledDate[0] } : null}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        lastCalledDate: selected ? [selected.value] : []
                      }));
                    }}
                    placeholder="Select..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Next Call Scheduled</Form.Label>
                  <Select
                    options={[
                      { value: 'Today', label: 'Today' },
                      { value: 'Tomorrow', label: 'Tomorrow' },
                      { value: 'This week', label: 'This week' },
                      { value: 'Next week', label: 'Next week' },
                      { value: 'Custom range', label: 'Custom range' },
                      { value: 'Overdue', label: 'Overdue' }
                    ]}
                    value={prospectsFilters.nextCallScheduled.length > 0 ? { value: prospectsFilters.nextCallScheduled[0], label: prospectsFilters.nextCallScheduled[0] } : null}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        nextCallScheduled: selected ? [selected.value] : []
                      }));
                    }}
                    placeholder="Select..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Source Type</Form.Label>
                  <Select
                    options={[
                      { value: 'Campaign', label: 'Campaign' },
                      { value: 'CSV Upload', label: 'CSV Upload' },
                      { value: 'Manual Entry', label: 'Manual Entry' },
                      { value: 'API Import', label: 'API Import' }
                    ]}
                    value={prospectsFilters.sourceType.length > 0 ? { value: prospectsFilters.sourceType[0], label: prospectsFilters.sourceType[0] } : null}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        sourceType: selected ? [selected.value] : []
                      }));
                    }}
                    placeholder="Select..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Source File</Form.Label>
                  <Select
                    options={[
                      { value: 'All', label: 'All' },
                      { value: 'Campaign list', label: 'Campaign list' }
                    ]}
                    value={prospectsFilters.sourceFile.length > 0 ? { value: prospectsFilters.sourceFile[0], label: prospectsFilters.sourceFile[0] } : null}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        sourceFile: selected ? [selected.value] : []
                      }));
                    }}
                    placeholder="Select..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Tags</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Hot Lead', label: 'Hot Lead' },
                      { value: 'Follow Up', label: 'Follow Up' },
                      { value: 'Decision Maker', label: 'Decision Maker' },
                      { value: 'Budget Approved', label: 'Budget Approved' },
                      { value: 'Gatekeeper', label: 'Gatekeeper' }
                    ]}
                    value={prospectsFilters.tags.map(t => ({ value: t, label: t }))}
                    onChange={(selected) => {
                      setProspectsFilters(prev => ({
                        ...prev,
                        tags: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select tags..."
                    styles={customSelectStyles}
                  />
                </Col>
                
                <Col md={2}>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary" 
                      
                      className="flex-grow-1"
                      onClick={() => {
                        setProspectsPagination({ ...prospectsPagination, currentPage: 1 });
                      }}
                    >
                      Apply
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      
                      onClick={() => {
                        setProspectsFilters({
                          assignedTo: [],
                          phone: '',
                          campaigns: [],
                          lastCallStatus: [],
                          callDisposition: [],
                          viewStatus: [],
                          lastCalledDate: [],
                          lastCalledCustomRange: { start: '', end: '' },
                          nextCallScheduled: [],
                          nextCallCustomRange: { start: '', end: '' },
                          overdueCalls: false,
                          sourceType: [],
                          sourceFile: [],
                          tags: []
                        });
                        setProspectsPagination({ ...prospectsPagination, currentPage: 1 });
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
          {/* Bulk Actions Dropdown - Only show when items are selected */}
          {selectedProspects.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <CheckSquare size={16} className="me-2" />
                Bulk Actions ({selectedProspects.length})
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item 
                  onClick={() => {
                    // Get all selected prospects
                    const prospectsToSchedule = sampleProspects.filter(p => selectedProspects.includes(p.id));
                    if (prospectsToSchedule.length === 1) {
                      // If only one selected, open modal with pre-filled data
                      const prospect = prospectsToSchedule[0];
                      setScheduleCallbackData({
                        ...scheduleCallbackData,
                        prospectId: prospect.id,
                        prospectName: `${prospect.firstName} ${prospect.lastName}`
                      });
                      setShowScheduleCallbackModal(true);
                    } else {
                      // For multiple selections, just open the modal
                      setScheduleCallbackData({
                        ...scheduleCallbackData,
                        prospectId: null,
                        prospectName: `${prospectsToSchedule.length} prospects selected`
                      });
                      setShowScheduleCallbackModal(true);
                    }
                  }}
                  className="d-flex align-items-center"
                >
                  <Calendar size={14} className="me-2" />
                  Schedule Callback
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item 
                  onClick={() => {
                    setConfirmAction({
                      type: 'delete',
                      data: { 
                        itemType: 'Prospects', 
                        name: `${selectedProspects.length} selected prospects`,
                        count: selectedProspects.length
                      }
                    });
                    setShowConfirmDialog(true);
                  }}
                  className="d-flex align-items-center text-danger"
                >
                  <Trash2 size={14} className="me-2" />
                  Delete Selected ({selectedProspects.length})
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
            <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {availableColumns.map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedColumns([...selectedColumns, col.key]);
                      } else {
                        setSelectedColumns(selectedColumns.filter(c => c !== col.key));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setSelectedColumns(availableColumns.map(c => c.key))}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setSelectedColumns(['name', 'phone', 'dataSource', 'sourceFile', 'assignedTo', 'lastCalled', 'lastCallStatus', 'callDisposition', 'nextCallScheduled', 'viewStatus', 'tags']);
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Prospects Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check
                        type="checkbox"
                        checked={(() => {
                          const filtered = sampleProspects.filter(prospect => {
                            if (activeFilter === 'assigned') {
                              if (prospect.assignedTo !== 'John Doe (501)') return false;
                            } else if (activeFilter === 'not-called') {
                              if (prospect.lastCallStatus) return false;
                            } else if (activeFilter === 'answered') {
                              if (prospect.lastCallStatus !== 'Answered') return false;
                            } else if (activeFilter === 'callback') {
                              if (prospect.callDisposition !== 'Callback Required') return false;
                            } else if (activeFilter === 'scheduled') {
                              const today = new Date().toISOString().split('T')[0];
                              if (prospect.nextCallScheduled !== today) return false;
                            }
                            
                            const searchLower = prospectsSearch.toLowerCase();
                            const matchesSearch = !prospectsSearch ||
                              prospect.firstName.toLowerCase().includes(searchLower) ||
                              prospect.lastName.toLowerCase().includes(searchLower) ||
                              prospect.phone.includes(searchLower) ||
                              prospect.email.toLowerCase().includes(searchLower) ||
                              (prospect.company?.toLowerCase().includes(searchLower) || false);
                            
                            const matchesAssignedTo = prospectsFilters.assignedTo.length === 0 || prospectsFilters.assignedTo.includes(prospect.assignedTo);
                            const matchesPhone = !prospectsFilters.phone || prospect.phone.includes(prospectsFilters.phone);
                            const matchesCampaigns = prospectsFilters.campaigns.length === 0 || (prospect.dataSource === 'Campaign' && prospectsFilters.campaigns.includes(prospect.sourceFile));
                            const matchesCallStatus = prospectsFilters.lastCallStatus.length === 0 || prospectsFilters.lastCallStatus.includes(prospect.lastCallStatus || '');
                            const matchesDisposition = prospectsFilters.callDisposition.length === 0 || prospectsFilters.callDisposition.includes(prospect.callDisposition || '');
                            const matchesViewStatus = prospectsFilters.viewStatus.length === 0 || prospectsFilters.viewStatus.includes(prospect.viewStatus);
                            const matchesSourceType = prospectsFilters.sourceType.length === 0 || prospectsFilters.sourceType.includes(prospect.dataSource);
                            const matchesSourceFile = prospectsFilters.sourceFile.length === 0 || prospectsFilters.sourceFile.includes(prospect.sourceFile);
                            const matchesTags = prospectsFilters.tags.length === 0 || prospectsFilters.tags.some(tag => prospect.tags.includes(tag));
                            
                            return matchesSearch && matchesAssignedTo && matchesPhone && matchesCampaigns && matchesCallStatus && matchesDisposition && matchesViewStatus && matchesSourceType && matchesSourceFile && matchesTags;
                          });
                          const sorted = sortData(filtered, prospectsPagination.sortColumn, prospectsPagination.sortDirection);
                          const paginated = paginateData(sorted, prospectsPagination.currentPage, prospectsPagination.rowsPerPage);
                          return paginated.length > 0 && paginated.every(p => selectedProspects.includes(p.id));
                        })()}
                        onChange={(e) => {
                          const filtered = sampleProspects.filter(prospect => {
                            if (activeFilter === 'assigned') {
                              if (prospect.assignedTo !== 'John Doe (501)') return false;
                            } else if (activeFilter === 'not-called') {
                              if (prospect.lastCallStatus) return false;
                            } else if (activeFilter === 'answered') {
                              if (prospect.lastCallStatus !== 'Answered') return false;
                            } else if (activeFilter === 'callback') {
                              if (prospect.callDisposition !== 'Callback Required') return false;
                            } else if (activeFilter === 'scheduled') {
                              const today = new Date().toISOString().split('T')[0];
                              if (prospect.nextCallScheduled !== today) return false;
                            }
                            
                            const searchLower = prospectsSearch.toLowerCase();
                            const matchesSearch = !prospectsSearch ||
                              prospect.firstName.toLowerCase().includes(searchLower) ||
                              prospect.lastName.toLowerCase().includes(searchLower) ||
                              prospect.phone.includes(searchLower) ||
                              prospect.email.toLowerCase().includes(searchLower) ||
                              (prospect.company?.toLowerCase().includes(searchLower) || false);
                            
                            const matchesAssignedTo = prospectsFilters.assignedTo.length === 0 || prospectsFilters.assignedTo.includes(prospect.assignedTo);
                            const matchesPhone = !prospectsFilters.phone || prospect.phone.includes(prospectsFilters.phone);
                            const matchesCampaigns = prospectsFilters.campaigns.length === 0 || (prospect.dataSource === 'Campaign' && prospectsFilters.campaigns.includes(prospect.sourceFile));
                            const matchesCallStatus = prospectsFilters.lastCallStatus.length === 0 || prospectsFilters.lastCallStatus.includes(prospect.lastCallStatus || '');
                            const matchesDisposition = prospectsFilters.callDisposition.length === 0 || prospectsFilters.callDisposition.includes(prospect.callDisposition || '');
                            const matchesViewStatus = prospectsFilters.viewStatus.length === 0 || prospectsFilters.viewStatus.includes(prospect.viewStatus);
                            const matchesSourceType = prospectsFilters.sourceType.length === 0 || prospectsFilters.sourceType.includes(prospect.dataSource);
                            const matchesSourceFile = prospectsFilters.sourceFile.length === 0 || prospectsFilters.sourceFile.includes(prospect.sourceFile);
                            const matchesTags = prospectsFilters.tags.length === 0 || prospectsFilters.tags.some(tag => prospect.tags.includes(tag));
                            
                            return matchesSearch && matchesAssignedTo && matchesPhone && matchesCampaigns && matchesCallStatus && matchesDisposition && matchesViewStatus && matchesSourceType && matchesSourceFile && matchesTags;
                          });
                          const sorted = sortData(filtered, prospectsPagination.sortColumn, prospectsPagination.sortDirection);
                          const paginated = paginateData(sorted, prospectsPagination.currentPage, prospectsPagination.rowsPerPage);
                          
                          if (e.target.checked) {
                            setSelectedProspects(paginated.map(p => p.id));
                          } else {
                            setSelectedProspects([]);
                          }
                        }}
                      />
                    </th>
                    {selectedColumns.includes('name') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('firstName', prospectsPagination, setProspectsPagination)}
                      >
                        Name {renderSortIcon('firstName', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('phone') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('phone', prospectsPagination, setProspectsPagination)}
                      >
                        Phone {renderSortIcon('phone', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('dataSource') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('dataSource', prospectsPagination, setProspectsPagination)}
                      >
                        Data Source {renderSortIcon('dataSource', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('sourceFile') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('sourceFile', prospectsPagination, setProspectsPagination)}
                      >
                        Source File/Campaign {renderSortIcon('sourceFile', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('assignedTo') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('assignedTo', prospectsPagination, setProspectsPagination)}
                      >
                        Assigned To {renderSortIcon('assignedTo', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('lastCalled') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('lastCalled', prospectsPagination, setProspectsPagination)}
                      >
                        Last Called {renderSortIcon('lastCalled', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('lastCallStatus') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('lastCallStatus', prospectsPagination, setProspectsPagination)}
                      >
                        Last Call Status {renderSortIcon('lastCallStatus', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('callDisposition') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('callDisposition', prospectsPagination, setProspectsPagination)}
                      >
                        Call Disposition {renderSortIcon('callDisposition', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('nextCallScheduled') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('nextCallScheduled', prospectsPagination, setProspectsPagination)}
                      >
                        Next Call Scheduled {renderSortIcon('nextCallScheduled', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('viewStatus') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('viewStatus', prospectsPagination, setProspectsPagination)}
                      >
                        View Status {renderSortIcon('viewStatus', prospectsPagination)}
                      </th>
                    )}
                    {selectedColumns.includes('tags') && <th>Tags</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Apply search filter
                    let filtered = sampleProspects.filter(prospect => {
                      // Apply quick filters first
                      if (activeFilter === 'assigned') {
                        // Filter for prospects assigned to current user (example: John Doe)
                        if (prospect.assignedTo !== 'John Doe (501)') return false;
                      } else if (activeFilter === 'not-called') {
                        if (prospect.lastCallStatus !== 'Not Called') return false;
                      } else if (activeFilter === 'answered') {
                        if (prospect.lastCallStatus !== 'Answered') return false;
                      } else if (activeFilter === 'callback') {
                        if (prospect.callDisposition !== 'Callback Required') return false;
                      } else if (activeFilter === 'scheduled') {
                        // Filter for prospects with calls scheduled today
                        const today = new Date().toISOString().split('T')[0];
                        if (!prospect.nextCallScheduled || !prospect.nextCallScheduled.includes(today)) return false;
                      }
                      // 'all' filter shows everything

                      const searchLower = prospectsSearch.toLowerCase();
                      const matchesSearch = !prospectsSearch || 
                        prospect.firstName.toLowerCase().includes(searchLower) ||
                        prospect.lastName.toLowerCase().includes(searchLower) ||
                        prospect.phone.toLowerCase().includes(searchLower) ||
                        prospect.email.toLowerCase().includes(searchLower) ||
                        prospect.company?.toLowerCase().includes(searchLower);

                      // Apply advanced filters
                      const matchesAssignedTo = prospectsFilters.assignedTo.length === 0 || prospectsFilters.assignedTo.includes(prospect.assignedTo);
                      const matchesPhone = !prospectsFilters.phone || prospect.phone.includes(prospectsFilters.phone);
                      const matchesCampaigns = prospectsFilters.campaigns.length === 0 || (prospect.dataSource === 'Campaign' && prospectsFilters.campaigns.includes(prospect.sourceFile));
                      const matchesCallStatus = prospectsFilters.lastCallStatus.length === 0 || prospectsFilters.lastCallStatus.includes(prospect.lastCallStatus || '');
                      const matchesDisposition = prospectsFilters.callDisposition.length === 0 || prospectsFilters.callDisposition.includes(prospect.callDisposition || '');
                      const matchesViewStatus = prospectsFilters.viewStatus.length === 0 || prospectsFilters.viewStatus.includes(prospect.viewStatus);
                      const matchesSourceType = prospectsFilters.sourceType.length === 0 || prospectsFilters.sourceType.includes(prospect.dataSource);
                      const matchesSourceFile = prospectsFilters.sourceFile.length === 0 || prospectsFilters.sourceFile.includes(prospect.sourceFile);
                      const matchesTags = prospectsFilters.tags.length === 0 || prospectsFilters.tags.some(tag => prospect.tags.includes(tag));

                      return matchesSearch && matchesAssignedTo && matchesPhone && matchesCampaigns && matchesCallStatus && matchesDisposition && matchesViewStatus && matchesSourceType && matchesSourceFile && matchesTags;
                    });

                    const sorted = sortData(filtered, prospectsPagination.sortColumn, prospectsPagination.sortDirection);
                    const paginated = paginateData(sorted, prospectsPagination.currentPage, prospectsPagination.rowsPerPage);
                    
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={selectedColumns.length + 2} className="text-center py-4 text-muted">
                            No prospects found matching your criteria
                          </td>
                        </tr>
                      );
                    }

                    return paginated.map((prospect) => (
                    <tr key={prospect.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedProspects.includes(prospect.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProspects([...selectedProspects, prospect.id]);
                            } else {
                              setSelectedProspects(selectedProspects.filter(id => id !== prospect.id));
                            }
                          }}
                        />
                      </td>
                      {selectedColumns.includes('name') && (
                        <td className="fw-semibold">{prospect.firstName} {prospect.lastName}</td>
                      )}
                      {selectedColumns.includes('phone') && <td>{prospect.phone}</td>}
                      {selectedColumns.includes('dataSource') && (
                        <td>
                          <Badge bg={prospect.dataSource === 'Campaign' ? 'primary' : 'info'} className="bg-opacity-10 text-dark">
                            {prospect.dataSource}
                          </Badge>
                        </td>
                      )}
                      {selectedColumns.includes('sourceFile') && <td>{prospect.sourceFile}</td>}
                      {selectedColumns.includes('assignedTo') && <td>{prospect.assignedTo}</td>}
                      {selectedColumns.includes('lastCalled') && <td>{prospect.lastCalled || '-'}</td>}
                      {selectedColumns.includes('lastCallStatus') && (
                        <td>
                          {prospect.lastCallStatus ? (
                            <Badge 
                              bg={
                                prospect.lastCallStatus === 'Answered' ? 'success' :
                                prospect.lastCallStatus === 'No Answer' ? 'warning' :
                                prospect.lastCallStatus === 'Busy' ? 'danger' :
                                'secondary'
                              } 
                              className="bg-opacity-10 text-dark"
                            >
                              {prospect.lastCallStatus}
                            </Badge>
                          ) : '-'}
                        </td>
                      )}
                      {selectedColumns.includes('callDisposition') && <td>{prospect.callDisposition || '-'}</td>}
                      {selectedColumns.includes('nextCallScheduled') && <td>{prospect.nextCallScheduled || '-'}</td>}
                      {selectedColumns.includes('viewStatus') && (
                        <td>
                          <Badge 
                            bg={prospect.viewStatus === 'Viewed' ? 'success' : 'secondary'} 
                            className="bg-opacity-10 text-dark"
                          >
                            {prospect.viewStatus}
                          </Badge>
                        </td>
                      )}
                      {selectedColumns.includes('tags') && (
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            {prospect.tags.map((tag, idx) => (
                              <Badge key={idx} bg="secondary" className="bg-opacity-10 text-dark">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1" 
                            title="View Details"
                            onClick={() => {
                              setViewingProspect(prospect);
                              setShowProspectViewModal(true);
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                          {/* <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1" 
                            title="Edit Prospect"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              // Add edit modal trigger here when available
                              alert('Edit prospect functionality');
                            }}
                          >
                            <Edit size={16} />
                          </Button> */}
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-success" 
                            title="Convert to Lead"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowLeadFormModal(true);
                            }}
                          >
                            <UserPlus size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-danger" 
                            title="Delete"
                            onClick={() => {
                              setConfirmAction({
                                type: 'delete',
                                data: { ...prospect, itemType: 'Prospect', name: `${prospect.firstName} ${prospect.lastName}` }
                              });
                              setShowConfirmDialog(true);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
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
                              <Dropdown.Item onClick={() => {
                                window.location.href = `tel:${prospect.phone}`;
                              }}>
                                <Phone size={14} className="me-2" />
                                Call Prospect
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => {
                                window.location.href = `mailto:${prospect.email}`;
                              }}>
                                <Mail size={14} className="me-2" />
                                Send Email
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => {
                                setScheduleCallbackData({
                                  ...scheduleCallbackData,
                                  prospectId: prospect.id,
                                  prospectName: `${prospect.firstName} ${prospect.lastName}`
                                });
                                setShowScheduleCallbackModal(true);
                              }}>
                                <Calendar size={14} className="me-2" />
                                Schedule Callback
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item onClick={() => {
                                setSelectedProspect(prospect);
                                setShowCallHistoryModal(true);
                              }}>
                                <Activity size={14} className="me-2" />
                                View Call History
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                    ));
                  })()}
                </tbody>
              </Table>
            </div>
            <div className="p-3">
              {renderPaginationControls(sampleProspects.length, prospectsPagination, setProspectsPagination, 'prospects')}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Leads Screen
  const renderLeads = () => {
    // Sample leads data
    const leadsData = [
      {
        id: 1,
        name: 'John Smith',
        email: 'john@company.com',
        phone: '+44 20 1234 5678',
        company: 'Tech Corp Ltd',
        industry: 'Technology',
        businessType: 'B2B',
        location: 'London, UK',
        companySize: '50-200',
        contactPerson: 'Sarah Johnson',
        stage: 'Qualified',
        leadType: 'Inbound',
        assignedUser: 'Jane Doe',
        campaignSource: 'Google Ads Q4',
        crmAttribution: 'Website Form',
        leadPotential: 'Hot',
        urgency: 'High',
        followUps: [
          { date: '2025-11-15', status: 'Completed', channel: 'Call' },
          { date: '2025-11-18', status: 'Scheduled', channel: 'Email' }
        ],
        leadScore: 82.5,
        created: '2025-11-10',
        lastActivity: '2025-11-15'
      },
      {
        id: 2,
        name: 'Emily Brown',
        email: 'emily@startup.io',
        phone: '+44 20 9876 5432',
        company: 'Startup Innovations',
        industry: 'Software',
        businessType: 'B2C',
        location: 'Manchester, UK',
        companySize: '10-50',
        contactPerson: 'Mike Wilson',
        stage: 'Contacted',
        leadType: 'Outbound',
        assignedUser: 'John Doe',
        campaignSource: 'LinkedIn Campaign',
        crmAttribution: 'Cold Email',
        leadPotential: 'Warm',
        urgency: 'Medium',
        followUps: [
          { date: '2025-11-14', status: 'Completed', channel: 'WhatsApp' }
        ],
        leadScore: 55.0,
        created: '2025-11-08',
        lastActivity: '2025-11-14'
      },
      {
        id: 3,
        name: 'Robert Taylor',
        email: 'robert@enterprise.co.uk',
        phone: '+44 161 234 5678',
        company: 'Enterprise Solutions',
        industry: 'Finance',
        businessType: 'B2B',
        location: 'Birmingham, UK',
        companySize: '200+',
        contactPerson: 'David Lee',
        stage: 'New',
        leadType: 'Referral',
        assignedUser: 'Sarah Smith',
        campaignSource: 'Partner Referral',
        crmAttribution: 'Referral',
        leadPotential: 'Hot',
        urgency: 'High',
        followUps: [
          { date: '2025-11-19', status: 'Scheduled', channel: 'LinkedIn' },
          { date: '2025-11-20', status: 'Scheduled', channel: 'Call' }
        ],
        leadScore: 75.5,
        created: '2025-11-12',
        lastActivity: '2025-11-12'
      },


      {
        id: 4,
        name: 'John Smith',
        email: 'john@company.com',
        phone: '+44 20 1234 5678',
        company: 'Tech Corp Ltd',
        industry: 'Technology',
        businessType: 'B2B',
        location: 'London, UK',
        companySize: '50-200',
        contactPerson: 'Sarah Johnson',
        stage: 'Qualified',
        leadType: 'Inbound',
        assignedUser: 'Jane Doe',
        campaignSource: 'Google Ads Q4',
        crmAttribution: 'Website Form',
        leadPotential: 'Hot',
        urgency: 'High',
        followUps: [
          { date: '2025-11-15', status: 'Completed', channel: 'Call' },
          { date: '2025-11-18', status: 'Scheduled', channel: 'Email' }
        ],
        leadScore: 82.5,
        created: '2025-11-10',
        lastActivity: '2025-11-15'
      },
      {
        id: 5,
        name: 'Emily Brown',
        email: 'emily@startup.io',
        phone: '+44 20 9876 5432',
        company: 'Startup Innovations',
        industry: 'Software',
        businessType: 'B2C',
        location: 'Manchester, UK',
        companySize: '10-50',
        contactPerson: 'Mike Wilson',
        stage: 'Contacted',
        leadType: 'Outbound',
        assignedUser: 'John Doe',
        campaignSource: 'LinkedIn Campaign',
        crmAttribution: 'Cold Email',
        leadPotential: 'Warm',
        urgency: 'Medium',
        followUps: [
          { date: '2025-11-14', status: 'Completed', channel: 'WhatsApp' }
        ],
        leadScore: 55.0,
        created: '2025-11-08',
        lastActivity: '2025-11-14'
      },
      {
        id: 6,
        name: 'Robert Taylor',
        email: 'robert@enterprise.co.uk',
        phone: '+44 161 234 5678',
        company: 'Enterprise Solutions',
        industry: 'Finance',
        businessType: 'B2B',
        location: 'Birmingham, UK',
        companySize: '200+',
        contactPerson: 'David Lee',
        stage: 'New',
        leadType: 'Referral',
        assignedUser: 'Sarah Smith',
        campaignSource: 'Partner Referral',
        crmAttribution: 'Referral',
        leadPotential: 'Hot',
        urgency: 'High',
        followUps: [
          { date: '2025-11-19', status: 'Scheduled', channel: 'LinkedIn' },
          { date: '2025-11-20', status: 'Scheduled', channel: 'Call' }
        ],
        leadScore: 75.5,
        created: '2025-11-12',
        lastActivity: '2025-11-12'
      },




      {
        id:7,
        name: 'John Smith',
        email: 'john@company.com',
        phone: '+44 20 1234 5678',
        company: 'Tech Corp Ltd',
        industry: 'Technology',
        businessType: 'B2B',
        location: 'London, UK',
        companySize: '50-200',
        contactPerson: 'Sarah Johnson',
        stage: 'Qualified',
        leadType: 'Inbound',
        assignedUser: 'Jane Doe',
        campaignSource: 'Google Ads Q4',
        crmAttribution: 'Website Form',
        leadPotential: 'Hot',
        urgency: 'High',
        followUps: [
          { date: '2025-11-15', status: 'Completed', channel: 'Call' },
          { date: '2025-11-18', status: 'Scheduled', channel: 'Email' }
        ],
        leadScore: 82.5,
        created: '2025-11-10',
        lastActivity: '2025-11-15'
      },
      {
        id: 8,
        name: 'Emily Brown',
        email: 'emily@startup.io',
        phone: '+44 20 9876 5432',
        company: 'Startup Innovations',
        industry: 'Software',
        businessType: 'B2C',
        location: 'Manchester, UK',
        companySize: '10-50',
        contactPerson: 'Mike Wilson',
        stage: 'Contacted',
        leadType: 'Outbound',
        assignedUser: 'John Doe',
        campaignSource: 'LinkedIn Campaign',
        crmAttribution: 'Cold Email',
        leadPotential: 'Warm',
        urgency: 'Medium',
        followUps: [
          { date: '2025-11-14', status: 'Completed', channel: 'WhatsApp' }
        ],
        leadScore: 55.0,
        created: '2025-11-08',
        lastActivity: '2025-11-14'
      },
      {
        id: 9,
        name: 'Robert Taylor',
        email: 'robert@enterprise.co.uk',
        phone: '+44 161 234 5678',
        company: 'Enterprise Solutions',
        industry: 'Finance',
        businessType: 'B2B',
        location: 'Birmingham, UK',
        companySize: '200+',
        contactPerson: 'David Lee',
        stage: 'New',
        leadType: 'Referral',
        assignedUser: 'Sarah Smith',
        campaignSource: 'Partner Referral',
        crmAttribution: 'Referral',
        leadPotential: 'Hot',
        urgency: 'High',
        followUps: [
          { date: '2025-11-19', status: 'Scheduled', channel: 'LinkedIn' },
          { date: '2025-11-20', status: 'Scheduled', channel: 'Call' }
        ],
        leadScore: 75.5,
        created: '2025-11-12',
        lastActivity: '2025-11-12'
      },


      {
        id: 10,
        name: 'John Smith',
        email: 'john@company.com',
        phone: '+44 20 1234 5678',
        company: 'Tech Corp Ltd',
        industry: 'Technology',
        businessType: 'B2B',
        location: 'London, UK',
        companySize: '50-200',
        contactPerson: 'Sarah Johnson',
        stage: 'Qualified',
        leadType: 'Inbound',
        assignedUser: 'Jane Doe',
        campaignSource: 'Google Ads Q4',
        crmAttribution: 'Website Form',
        leadPotential: 'Hot',
        urgency: 'High',
        followUps: [
          { date: '2025-11-15', status: 'Completed', channel: 'Call' },
          { date: '2025-11-18', status: 'Scheduled', channel: 'Email' }
        ],
        leadScore: 82.5,
        created: '2025-11-10',
        lastActivity: '2025-11-15'
      },
      {
        id: 11,
        name: 'Emily Brown',
        email: 'emily@startup.io',
        phone: '+44 20 9876 5432',
        company: 'Startup Innovations',
        industry: 'Software',
        businessType: 'B2C',
        location: 'Manchester, UK',
        companySize: '10-50',
        contactPerson: 'Mike Wilson',
        stage: 'Contacted',
        leadType: 'Outbound',
        assignedUser: 'John Doe',
        campaignSource: 'LinkedIn Campaign',
        crmAttribution: 'Cold Email',
        leadPotential: 'Warm',
        urgency: 'Medium',
        followUps: [
          { date: '2025-11-14', status: 'Completed', channel: 'WhatsApp' }
        ],
        leadScore: 55.0,
        created: '2025-11-08',
        lastActivity: '2025-11-14'
      },
      {
        id: 12,
        name: 'Robert Taylor',
        email: 'robert@enterprise.co.uk',
        phone: '+44 161 234 5678',
        company: 'Enterprise Solutions',
        industry: 'Finance',
        businessType: 'B2B',
        location: 'Birmingham, UK',
        companySize: '200+',
        contactPerson: 'David Lee',
        stage: 'New',
        leadType: 'Referral',
        assignedUser: 'Sarah Smith',
        campaignSource: 'Partner Referral',
        crmAttribution: 'Referral',
        leadPotential: 'Hot',
        urgency: 'High',
        followUps: [
          { date: '2025-11-19', status: 'Scheduled', channel: 'LinkedIn' },
          { date: '2025-11-20', status: 'Scheduled', channel: 'Call' }
        ],
        leadScore: 75.5,
        created: '2025-11-12',
        lastActivity: '2025-11-12'
      }
    ];

    return (
      <div>
        {ConfirmationDialog()}
        {LeadViewModal()}
        {AddLeadFormModal()}
        {ScheduleCallbackModal()}
        {AddFollowupModal()}
        {AddMeetingModal()}
        {DealFormModal()}

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
            <Button variant="primary" onClick={() => setShowLeadFormModal(true)}>
              <Plus size={16} className="me-2" />
              Add Lead
            </Button>
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
              value="58"
              change="+12.5%"
              isPositive={true}
              icon={<Target size={24} />}
              color="primary"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Qualified Leads"
              value="9"
              change="+3"
              isPositive={true}
              icon={<CheckCircle size={24} />}
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Hot Leads"
              value="15"
              icon={<TrendingUp size={24} />}
              color="danger"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Avg Lead Score"
              value="67.5"
              change="+5.2"
              isPositive={true}
              icon={<BarChart3 size={24} />}
              color="info"
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
                        { name: 'Hot', value: 15, color: '#dc3545' },
                        { name: 'Warm', value: 28, color: '#ffc107' },
                        { name: 'Cold', value: 15, color: '#0dcaf0' }
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
                        { name: 'Hot', value: 15, color: '#dc3545' },
                        { name: 'Warm', value: 28, color: '#ffc107' },
                        { name: 'Cold', value: 15, color: '#0dcaf0' }
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
                <h6 className="fw-bold mb-3">Urgency Levels</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'High', value: 22, color: '#dc3545' },
                        { name: 'Medium', value: 19, color: '#ffc107' },
                        { name: 'Low', value: 17, color: '#6c757d' }
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
                        { name: 'High', value: 22, color: '#dc3545' },
                        { name: 'Medium', value: 19, color: '#ffc107' },
                        { name: 'Low', value: 17, color: '#6c757d' }
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
                    data={[
                      { stage: 'New', count: 25 },
                      { stage: 'Contacted', count: 18 },
                      { stage: 'Qualified', count: 9 },
                      { stage: 'Unqualified', count: 6 }
                    ]}
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
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Lead to Deal Conversion</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    layout="vertical"
                    data={[
                      { stage: 'Total Leads', value: 58 },
                      { stage: 'Qualified', value: 9 },
                      { stage: 'Converted to Deals', value: 5 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="stage" width={140} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#198754" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <small className="text-muted">Conversion Rate: <strong className="text-success">8.6%</strong></small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Lead Score Info Card */}
        {/* <Card className="border-0 shadow-sm mb-4 bg-light">
          <Card.Body>
            <h6 className="fw-bold mb-3">Lead Score Calculation Formula</h6>
            <p className="mb-2">
              <strong>Lead Score = (Lead Potential × 50%) + (Urgency × 30%) + (Follow-up Engagement × 20%)</strong>
            </p>
            <Row className="small">
              <Col md={4}>
                <strong>Lead Potential:</strong>
                <ul className="mb-0">
                  <li>Cold = 0%</li>
                  <li>Warm = 50%</li>
                  <li>Hot = 95%</li>
                </ul>
              </Col>
              <Col md={4}>
                <strong>Urgency:</strong>
                <ul className="mb-0">
                  <li>Low = 0%</li>
                  <li>Medium = 50%</li>
                  <li>High = 95%</li>
                </ul>
              </Col>
              <Col md={4}>
                <strong>Follow-up (Last 2 weeks):</strong>
                <ul className="mb-0">
                  <li>0 follow-ups = 0%</li>
                  <li>1 follow-up = 50%</li>
                  <li>2+ follow-ups = 95%</li>
                </ul>
              </Col>
            </Row>
            <div className="alert alert-info mb-0 mt-3">
              <small><AlertCircle size={14} className="me-1" />Lead score is recalculated automatically when Lead Potential, Urgency, or Follow-up Engagement values are updated.</small>
            </div>
          </Card.Body>
        </Card> */}
          </>
        )}

        {/* Filter Bar  leads*/}
        <FilterBar
          quickFilters={[
            {
              id: 'all',
              label: 'All Leads',
              count: 89,
              color: '#6c757d',
              activeColor: '#0d6efd',
              icon: <Users size={16} />
            },
            {
              id: 'new',
              label: 'New',
              count: 34,
              color: '#dc3545',
              activeColor: '#0d6efd',
              icon: <PlusCircle size={16} />
            },
            {
              id: 'qualified',
              label: 'Qualified',
              count: 28,
              color: '#0d6efd',
              activeColor: '#0d6efd',
              icon: <CheckSquare size={16} />
            },
            {
              id: 'hot',
              label: 'Hot Leads',
              count: 15,
              color: '#fd7e14',
              activeColor: '#0d6efd',
              icon: <Zap size={16} />
            },
            {
              id: 'high-score',
              label: 'High Score (>70)',
              count: 21,
              color: '#198754',
              activeColor: '#0d6efd',
              icon: <Star size={16} />
            },
            {
              id: 'follow-up',
              label: 'Follow-up Due',
              count: 12,
              color: '#ffc107',
              activeColor: '#0d6efd',
              icon: <Clock size={16} />
            },
            {
              id: 'lost',
              label: 'Lost',
              count: 7,
              color: '#dc3545',
              activeColor: '#0d6efd',
              icon: <X size={16} />
            }
          ]}
          
         
          activeFilter={activeFilter}
          onFilterChange={(filterId) => setActiveFilter(filterId)}
          searchValue={leadsSearch}
          onSearchChange={(value) => setLeadsSearch(value)}
          onSearch={() => console.log('Searching leads:', leadsSearch)}
          searchPlaceholder="Search leads by name, company, email..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={
            leadsFilters.assignedTo.length +
            leadsFilters.industry.length +
            leadsFilters.stage.length +
            leadsFilters.source.length +
            leadsFilters.potential.length +
            leadsFilters.campaign.length +
            (leadsFilters.leadScoreMin ? 1 : 0) +
            (leadsFilters.leadScoreMax ? 1 : 0) +
            leadsFilters.dateRange.length
          }
        />

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                {/* Row 1 */}
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Assigned To</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'John Doe', label: 'John Doe' },
                      { value: 'Jane Doe', label: 'Jane Doe' },
                      { value: 'Sarah Smith', label: 'Sarah Smith' },
                      { value: 'Mike Johnson', label: 'Mike Johnson' }
                    ]}
                    value={leadsFilters.assignedTo.map(u => ({ value: u, label: u }))}
                    onChange={(selected) => {
                      setLeadsFilters(prev => ({
                        ...prev,
                        assignedTo: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select users..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Industry</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Technology', label: 'Technology' },
                      { value: 'Healthcare', label: 'Healthcare' },
                      { value: 'Finance', label: 'Finance' },
                      { value: 'Manufacturing', label: 'Manufacturing' },
                      { value: 'Retail', label: 'Retail' },
                      { value: 'Education', label: 'Education' }
                    ]}
                    value={leadsFilters.industry.map(i => ({ value: i, label: i }))}
                    onChange={(selected) => {
                      setLeadsFilters(prev => ({
                        ...prev,
                        industry: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select industries..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Stages</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'New', label: 'New' },
                      { value: 'Contacted', label: 'Contacted' },
                      { value: 'Qualified', label: 'Qualified' },
                      { value: 'Unqualified', label: 'Unqualified' }
                    ]}
                    value={leadsFilters.stage.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setLeadsFilters(prev => ({
                        ...prev,
                        stage: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select stages..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Source</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Website', label: 'Website' },
                      { value: 'Referral', label: 'Referral' },
                      { value: 'Campaign', label: 'Campaign' },
                      { value: 'Cold Call', label: 'Cold Call' },
                      { value: 'Email', label: 'Email' },
                      { value: 'Social Media', label: 'Social Media' }
                    ]}
                    value={leadsFilters.source.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setLeadsFilters(prev => ({
                        ...prev,
                        source: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select sources..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Lead Potential</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Hot', label: 'Hot' },
                      { value: 'Warm', label: 'Warm' },
                      { value: 'Cold', label: 'Cold' }
                    ]}
                    value={leadsFilters.potential.map(p => ({ value: p, label: p }))}
                    onChange={(selected) => {
                      setLeadsFilters(prev => ({
                        ...prev,
                        potential: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select potential..."
                    styles={customSelectStyles}
                  />
                </Col>
                
                {/* Row 2 */}
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Campaign</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Q4 2024 Outreach', label: 'Q4 2024 Outreach' },
                      { value: 'Holiday Sale', label: 'Holiday Sale' },
                      { value: 'Product Launch', label: 'Product Launch' },
                      { value: 'Webinar Series', label: 'Webinar Series' }
                    ]}
                    value={leadsFilters.campaign.map(c => ({ value: c, label: c }))}
                    onChange={(selected) => {
                      setLeadsFilters(prev => ({
                        ...prev,
                        campaign: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select campaigns..."
                    styles={customSelectStyles}
                  />
                </Col>
                {/* <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Lead Score Min</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Min score"
                    size="sm"
                    value={leadsFilters.leadScoreMin}
                    onChange={(e) => {
                      setLeadsFilters(prev => ({
                        ...prev,
                        leadScoreMin: e.target.value
                      }));
                    }}
                    style={{ fontSize: '0.875rem' }}
                  />
                </Col> */}
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Lead Score</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Lead score"
                    size="sm"
                    value={leadsFilters.leadScoreMax}
                    onChange={(e) => {
                      setLeadsFilters(prev => ({
                        ...prev,
                        leadScoreMax: e.target.value
                      }));
                    }}
                    style={{ fontSize: '0.875rem' }}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Date Range</Form.Label>
                  <Select
                    options={[
                      { value: 'Today', label: 'Today' },
                      { value: 'Yesterday', label: 'Yesterday' },
                      { value: 'Last 7 days', label: 'Last 7 days' },
                      { value: 'Last 30 days', label: 'Last 30 days' },
                      { value: 'This Month', label: 'This Month' },
                      { value: 'Last Month', label: 'Last Month' },
                      { value: 'Custom range', label: 'Custom range' }
                    ]}
                    value={leadsFilters.dateRange.length > 0 ? { value: leadsFilters.dateRange[0], label: leadsFilters.dateRange[0] } : null}
                    onChange={(selected) => {
                      setLeadsFilters(prev => ({
                        ...prev,
                        dateRange: selected ? [selected.value] : []
                      }));
                    }}
                    placeholder="Select range..."
                    isClearable
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                <div className="d-flex gap-2">
  {/* Apply Button */}
  <Button
    variant="primary"
    
    className="flex-grow-1 d-flex align-items-center justify-content-center"
    onClick={() => {
      setLeadsPagination({ ...leadsPagination, currentPage: 1 });
    }}
  >
    Apply
  </Button>

  {/* Reset Button */}
  <Button
    variant="outline-secondary"
    
    className="d-flex align-items-center justify-content-center"
    onClick={() => {
      setLeadsFilters({
        assignedTo: [],
        industry: [],
        stage: [],
        source: [],
        potential: [],
        campaign: [],
        leadScoreMin: '',
        leadScoreMax: '',
        dateRange: [],
        dateRangeCustomStart: '',
        dateRangeCustomEnd: ''
      });
      setLeadsPagination({ ...leadsPagination, currentPage: 1 });
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

        {/* Bulk Actions and Column Customization - Leads */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          {/* Bulk Actions Dropdown - Only show when items are selected */}
          {selectedLeads.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <CheckSquare size={16} className="me-2" />
                Bulk Actions ({selectedLeads.length})
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item 
                  onClick={() => {
                    // Get all selected leads
                    const leadsToScheduleFollowup = leadsData.filter(l => selectedLeads.includes(l.id));
                    if (leadsToScheduleFollowup.length === 1) {
                      // If only one selected, open modal with pre-filled data
                      const lead = leadsToScheduleFollowup[0];
                      setFollowupData({
                        ...followupData,
                        leadId: lead.id,
                        leadName: lead.name
                      });
                      setShowAddFollowupModal(true);
                    } else {
                      // For multiple selections, just open the modal
                      setFollowupData({
                        ...followupData,
                        leadId: null,
                        leadName: `${leadsToScheduleFollowup.length} leads selected`
                      });
                      setShowAddFollowupModal(true);
                    }
                  }}
                  className="d-flex align-items-center"
                >
                  <Calendar size={14} className="me-2" />
                  Add Follow-up
                </Dropdown.Item>
                <Dropdown.Item 
                  onClick={() => {
                    // Get all selected leads
                    const leadsToScheduleMeeting = leadsData.filter(l => selectedLeads.includes(l.id));
                    if (leadsToScheduleMeeting.length === 1) {
                      // If only one selected, open modal with pre-filled data
                      const lead = leadsToScheduleMeeting[0];
                      setMeetingData({
                        ...meetingData,
                        leadId: lead.id,
                        leadName: lead.name
                      });
                      setShowAddMeetingModal(true);
                    } else {
                      // For multiple selections, just open the modal
                      setMeetingData({
                        ...meetingData,
                        leadId: null,
                        leadName: `${leadsToScheduleMeeting.length} leads selected`
                      });
                      setShowAddMeetingModal(true);
                    }
                  }}
                  className="d-flex align-items-center"
                >
                  <Users size={14} className="me-2" />
                  Schedule Meeting
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item 
                  onClick={() => {
                    setConfirmAction({
                      type: 'delete',
                      data: { 
                        itemType: 'Leads', 
                        name: `${selectedLeads.length} selected leads`,
                        count: selectedLeads.length
                      }
                    });
                    setShowConfirmDialog(true);
                  }}
                  className="d-flex align-items-center text-danger"
                >
                  <Trash2 size={14} className="me-2" />
                  Delete Selected ({selectedLeads.length})
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
            <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[
                { key: 'name', label: 'Name' },
                { key: 'company', label: 'Company' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'stage', label: 'Stage' },
                { key: 'leadPotential', label: 'Lead Potential' },
                { key: 'urgency', label: 'Urgency' },
                { key: 'followUps', label: 'Follow-ups' },
                { key: 'leadScore', label: 'Lead Score' },
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
                      } else {
                        setSelectedLeadsColumns(selectedLeadsColumns.filter(c => c !== col.key));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setSelectedLeadsColumns(['name', 'company', 'email', 'phone', 'stage', 'leadPotential', 'urgency', 'followUps', 'leadScore', 'assignedUser', 'created'])}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setSelectedLeadsColumns(['name', 'company', 'email', 'phone', 'stage', 'leadPotential', 'urgency', 'followUps', 'leadScore', 'assignedUser', 'created']);
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Leads Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: '50px' }}>
                    <Form.Check
                      type="checkbox"
                      checked={(() => {
                        const filtered = leadsData.filter(lead => {
                          if (activeFilter === 'new') {
                            if (lead.stage !== 'New') return false;
                          } else if (activeFilter === 'qualified') {
                            if (lead.stage !== 'Qualified') return false;
                          } else if (activeFilter === 'hot') {
                            if (lead.leadPotential !== 'Hot') return false;
                          } else if (activeFilter === 'high-score') {
                            if (lead.leadScore < 70) return false;
                          } else if (activeFilter === 'follow-up') {
                            if (!lead.followUps || lead.followUps.length === 0) return false;
                            const hasScheduled = lead.followUps.some(f => f.status === 'Scheduled');
                            if (!hasScheduled) return false;
                          } else if (activeFilter === 'lost') {
                            if (lead.stage !== 'Lost') return false;
                          }
                          
                          const searchLower = leadsSearch.toLowerCase();
                          const matchesSearch = !leadsSearch ||
                            lead.name.toLowerCase().includes(searchLower) ||
                            lead.company.toLowerCase().includes(searchLower) ||
                            lead.email.toLowerCase().includes(searchLower);
                          
                          const matchesAssignedTo = leadsFilters.assignedTo.length === 0 || leadsFilters.assignedTo.includes(lead.assignedUser);
                          const matchesIndustry = leadsFilters.industry.length === 0 || leadsFilters.industry.includes(lead.industry);
                          const matchesStage = leadsFilters.stage.length === 0 || leadsFilters.stage.includes(lead.stage);
                          const matchesSource = leadsFilters.source.length === 0 || leadsFilters.source.includes(lead.leadType);
                          const matchesPotential = leadsFilters.potential.length === 0 || leadsFilters.potential.includes(lead.leadPotential);
                          const matchesCampaign = leadsFilters.campaign.length === 0;
                          const matchesLeadScoreMin = !leadsFilters.leadScoreMin || lead.leadScore >= parseInt(leadsFilters.leadScoreMin);
                          const matchesLeadScoreMax = !leadsFilters.leadScoreMax || lead.leadScore <= parseInt(leadsFilters.leadScoreMax);
                          const matchesDateRange = leadsFilters.dateRange.length === 0;
                          
                          return matchesSearch && matchesAssignedTo && matchesIndustry && matchesStage && 
                            matchesSource && matchesPotential && matchesCampaign && 
                            matchesLeadScoreMin && matchesLeadScoreMax && matchesDateRange;
                        });
                        const sorted = sortData(filtered, leadsPagination.sortColumn, leadsPagination.sortDirection);
                        const paginated = paginateData(sorted, leadsPagination.currentPage, leadsPagination.rowsPerPage);
                        return paginated.length > 0 && paginated.every(l => selectedLeads.includes(l.id));
                      })()}
                      onChange={(e) => {
                        const filtered = leadsData.filter(lead => {
                          if (activeFilter === 'new') {
                            if (lead.stage !== 'New') return false;
                          } else if (activeFilter === 'qualified') {
                            if (lead.stage !== 'Qualified') return false;
                          } else if (activeFilter === 'hot') {
                            if (lead.leadPotential !== 'Hot') return false;
                          } else if (activeFilter === 'high-score') {
                            if (lead.leadScore < 70) return false;
                          } else if (activeFilter === 'follow-up') {
                            if (!lead.followUps || lead.followUps.length === 0) return false;
                            const hasScheduled = lead.followUps.some(f => f.status === 'Scheduled');
                            if (!hasScheduled) return false;
                          } else if (activeFilter === 'lost') {
                            if (lead.stage !== 'Lost') return false;
                          }
                          
                          const searchLower = leadsSearch.toLowerCase();
                          const matchesSearch = !leadsSearch ||
                            lead.name.toLowerCase().includes(searchLower) ||
                            lead.company.toLowerCase().includes(searchLower) ||
                            lead.email.toLowerCase().includes(searchLower);
                          
                          const matchesAssignedTo = leadsFilters.assignedTo.length === 0 || leadsFilters.assignedTo.includes(lead.assignedUser);
                          const matchesIndustry = leadsFilters.industry.length === 0 || leadsFilters.industry.includes(lead.industry);
                          const matchesStage = leadsFilters.stage.length === 0 || leadsFilters.stage.includes(lead.stage);
                          const matchesSource = leadsFilters.source.length === 0 || leadsFilters.source.includes(lead.leadType);
                          const matchesPotential = leadsFilters.potential.length === 0 || leadsFilters.potential.includes(lead.leadPotential);
                          const matchesCampaign = leadsFilters.campaign.length === 0;
                          const matchesLeadScoreMin = !leadsFilters.leadScoreMin || lead.leadScore >= parseInt(leadsFilters.leadScoreMin);
                          const matchesLeadScoreMax = !leadsFilters.leadScoreMax || lead.leadScore <= parseInt(leadsFilters.leadScoreMax);
                          const matchesDateRange = leadsFilters.dateRange.length === 0;
                          
                          return matchesSearch && matchesAssignedTo && matchesIndustry && matchesStage && 
                            matchesSource && matchesPotential && matchesCampaign && 
                            matchesLeadScoreMin && matchesLeadScoreMax && matchesDateRange;
                        });
                        const sorted = sortData(filtered, leadsPagination.sortColumn, leadsPagination.sortDirection);
                        const paginated = paginateData(sorted, leadsPagination.currentPage, leadsPagination.rowsPerPage);
                        
                        if (e.target.checked) {
                          setSelectedLeads(paginated.map(l => l.id));
                        } else {
                          setSelectedLeads([]);
                        }
                      }}
                    />
                  </th>
                  {selectedLeadsColumns.includes('name') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('name', leadsPagination, setLeadsPagination)}
                    >
                      Name {renderSortIcon('name', leadsPagination)}
                    </th>
                  )}
                  {selectedLeadsColumns.includes('company') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('company', leadsPagination, setLeadsPagination)}
                    >
                      Company {renderSortIcon('company', leadsPagination)}
                    </th>
                  )}
                  {selectedLeadsColumns.includes('email') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('email', leadsPagination, setLeadsPagination)}
                    >
                      Email {renderSortIcon('email', leadsPagination)}
                    </th>
                  )}
                  {selectedLeadsColumns.includes('phone') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('phone', leadsPagination, setLeadsPagination)}
                    >
                      Phone {renderSortIcon('phone', leadsPagination)}
                    </th>
                  )}
                  {selectedLeadsColumns.includes('stage') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('stage', leadsPagination, setLeadsPagination)}
                    >
                      Stage {renderSortIcon('stage', leadsPagination)}
                    </th>
                  )}
                  {selectedLeadsColumns.includes('leadPotential') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('leadPotential', leadsPagination, setLeadsPagination)}
                    >
                      Lead Potential {renderSortIcon('leadPotential', leadsPagination)}
                    </th>
                  )}
                  {selectedLeadsColumns.includes('urgency') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('urgency', leadsPagination, setLeadsPagination)}
                    >
                      Urgency {renderSortIcon('urgency', leadsPagination)}
                    </th>
                  )}
                  {selectedLeadsColumns.includes('followUps') && (
                    <th>Follow-ups</th>
                  )}
                  {selectedLeadsColumns.includes('leadScore') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('leadScore', leadsPagination, setLeadsPagination)}
                    >
                      Lead Score {renderSortIcon('leadScore', leadsPagination)}
                    </th>
                  )}
                  {selectedLeadsColumns.includes('assignedUser') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('assignedUser', leadsPagination, setLeadsPagination)}
                    >
                      Assigned To {renderSortIcon('assignedUser', leadsPagination)}
                    </th>
                  )}
                  {selectedLeadsColumns.includes('created') && (
                    <th 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('created', leadsPagination, setLeadsPagination)}
                    >
                      Created {renderSortIcon('created', leadsPagination)}
                    </th>
                  )}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Apply quick filters
                  let filtered = leadsData.filter(lead => {
                    // Apply quick filters first
                    if (activeFilter === 'new') {
                      if (lead.stage !== 'New') return false;
                    } else if (activeFilter === 'qualified') {
                      if (lead.stage !== 'Qualified') return false;
                    } else if (activeFilter === 'hot') {
                      if (lead.leadPotential !== 'Hot') return false;
                    } else if (activeFilter === 'high-score') {
                      if (lead.leadScore < 70) return false;
                    } else if (activeFilter === 'follow-up') {
                      // Filter for leads with follow-ups scheduled
                      if (!lead.followUps || lead.followUps.length === 0) return false;
                      const hasScheduled = lead.followUps.some(f => f.status === 'Scheduled');
                      if (!hasScheduled) return false;
                    } else if (activeFilter === 'lost') {
                      if (lead.stage !== 'Lost') return false;
                    }
                    // 'all' filter shows everything

                    // Apply search filter
                    const searchLower = leadsSearch.toLowerCase();
                    const matchesSearch = !leadsSearch ||
                      lead.name.toLowerCase().includes(searchLower) ||
                      lead.company.toLowerCase().includes(searchLower) ||
                      lead.email.toLowerCase().includes(searchLower);

                    // Apply advanced filters
                    const matchesAssignedTo = leadsFilters.assignedTo.length === 0 || leadsFilters.assignedTo.includes(lead.assignedUser);
                    const matchesIndustry = leadsFilters.industry.length === 0 || leadsFilters.industry.includes(lead.industry);
                    const matchesStage = leadsFilters.stage.length === 0 || leadsFilters.stage.includes(lead.stage);
                    const matchesSource = leadsFilters.source.length === 0 || leadsFilters.source.includes(lead.leadType);
                    const matchesPotential = leadsFilters.potential.length === 0 || leadsFilters.potential.includes(lead.leadPotential);
                    const matchesCampaign = leadsFilters.campaign.length === 0; // Campaign filter - can be implemented when campaign data is added
                    const matchesLeadScoreMin = !leadsFilters.leadScoreMin || lead.leadScore >= parseInt(leadsFilters.leadScoreMin);
                    const matchesLeadScoreMax = !leadsFilters.leadScoreMax || lead.leadScore <= parseInt(leadsFilters.leadScoreMax);
                    const matchesDateRange = leadsFilters.dateRange.length === 0; // Date range logic can be implemented based on created date

                    return matchesSearch && matchesAssignedTo && matchesIndustry && matchesStage && 
                      matchesSource && matchesPotential && matchesCampaign && 
                      matchesLeadScoreMin && matchesLeadScoreMax && matchesDateRange;
                  });

                  const sorted = sortData(filtered, leadsPagination.sortColumn, leadsPagination.sortDirection);
                  const paginated = paginateData(sorted, leadsPagination.currentPage, leadsPagination.rowsPerPage);
                  
                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={selectedLeadsColumns.length + 2} className="text-center py-4 text-muted">
                          No leads found matching your criteria
                        </td>
                      </tr>
                    );
                  }

                  return paginated.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads([...selectedLeads, lead.id]);
                          } else {
                            setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                          }
                        }}
                      />
                    </td>
                    {selectedLeadsColumns.includes('name') && (
                      <td className="fw-semibold">{lead.name}</td>
                    )}
                    {selectedLeadsColumns.includes('company') && (
                      <td>
                        <div>
                          <div className="fw-medium">{lead.company}</div>
                          <small className="text-muted">{lead.industry}</small>
                        </div>
                      </td>
                    )}
                    {selectedLeadsColumns.includes('email') && (
                      <td>{lead.email}</td>
                    )}
                    {selectedLeadsColumns.includes('phone') && (
                      <td>{lead.phone}</td>
                    )}
                    {selectedLeadsColumns.includes('stage') && (
                      <td>
                        <Badge 
                          bg={
                            lead.stage === 'Qualified' ? 'success' :
                            lead.stage === 'Contacted' ? 'info' :
                            'secondary'
                          }
                        >
                          {lead.stage}
                        </Badge>
                      </td>
                    )}
                    {selectedLeadsColumns.includes('leadPotential') && (
                      <td>
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
                    {selectedLeadsColumns.includes('urgency') && (
                      <td>
                        <Badge 
                          bg={
                            lead.urgency === 'High' ? 'danger' :
                            lead.urgency === 'Medium' ? 'warning' :
                            'secondary'
                          }
                        >
                          {lead.urgency}
                        </Badge>
                      </td>
                    )}
                    {selectedLeadsColumns.includes('followUps') && (
                      <td className="text-center">
                        <Badge bg="primary" pill>
                          {lead.followUps.length}
                        </Badge>
                      </td>
                    )}
                    {selectedLeadsColumns.includes('leadScore') && (
                      <td>
                        <Badge 
                          bg={
                            lead.leadScore >= 70 ? 'success' :
                            lead.leadScore >= 40 ? 'warning' :
                            'danger'
                          }
                          className="px-3"
                        >
                          {lead.leadScore}
                        </Badge>
                      </td>
                    )}
                    {selectedLeadsColumns.includes('assignedUser') && (
                      <td>{lead.assignedUser}</td>
                    )}
                    {selectedLeadsColumns.includes('created') && (
                      <td>{lead.created}</td>
                    )}
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1" 
                          title="View"
                          onClick={() => {
                            setViewingLead(lead);
                            setShowLeadViewModal(true);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1" 
                          title="Edit"
                          onClick={() => {
                            setEditingLead(lead);
                            setShowLeadFormModal(true);
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1 text-success" 
                          title="Convert to Deal"
                          onClick={() => {
                            setEditingDeal(null);
                            setDealFormStep(0);
                            setShowDealFormModal(true);
                          }}
                        >
                          <Handshake size={16} />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1 text-danger" 
                          title="Delete"
                          onClick={() => {
                            setConfirmAction({ type: 'delete', data: { ...lead, itemType: 'Lead' } });
                            setShowConfirmDialog(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
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
                            <Dropdown.Item onClick={() => {
                              setFollowupData({
                                ...followupData,
                                leadId: lead.id,
                                leadName: lead.name
                              });
                              setShowAddFollowupModal(true);
                            }}>
                              <Calendar size={14} className="me-2" />
                              Add Follow up
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => {
                              setMeetingData({
                                ...meetingData,
                                leadId: lead.id,
                                leadName: lead.name
                              });
                              setShowAddMeetingModal(true);
                            }}>
                              <Users size={14} className="me-2" />
                              Add Meeting
                            </Dropdown.Item>
                            
                            <Dropdown.Item 
                              className="text-danger"
                              // onClick={() => {
                              //   setConfirmAction({ type: 'mark-lost', data: lead });
                              //   setShowConfirmDialog(true);
                              // }}
                            >
                              <X size={14} className="me-2" />
                              Lost
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </Table>
            </div>
            <div className="p-3">
              {(() => {
                let filtered = leadsData.filter(lead => {
                  if (activeFilter === 'new') {
                    if (lead.stage !== 'New') return false;
                  } else if (activeFilter === 'qualified') {
                    if (lead.stage !== 'Qualified') return false;
                  } else if (activeFilter === 'hot') {
                    if (lead.leadPotential !== 'Hot') return false;
                  } else if (activeFilter === 'high-score') {
                    if (lead.leadScore < 70) return false;
                  } else if (activeFilter === 'follow-up') {
                    if (!lead.followUps || lead.followUps.length === 0) return false;
                    const hasScheduled = lead.followUps.some(f => f.status === 'Scheduled');
                    if (!hasScheduled) return false;
                  } else if (activeFilter === 'lost') {
                    if (lead.stage !== 'Lost') return false;
                  }
                  
                  const searchLower = leadsSearch.toLowerCase();
                  const matchesSearch = !leadsSearch ||
                    lead.name.toLowerCase().includes(searchLower) ||
                    lead.company.toLowerCase().includes(searchLower) ||
                    lead.email.toLowerCase().includes(searchLower);
                  
                  const matchesAssignedTo = leadsFilters.assignedTo.length === 0 || leadsFilters.assignedTo.includes(lead.assignedUser);
                  const matchesIndustry = leadsFilters.industry.length === 0 || leadsFilters.industry.includes(lead.industry);
                  const matchesStage = leadsFilters.stage.length === 0 || leadsFilters.stage.includes(lead.stage);
                  const matchesSource = leadsFilters.source.length === 0 || leadsFilters.source.includes(lead.leadType);
                  const matchesPotential = leadsFilters.potential.length === 0 || leadsFilters.potential.includes(lead.leadPotential);
                  const matchesCampaign = leadsFilters.campaign.length === 0;
                  const matchesLeadScoreMin = !leadsFilters.leadScoreMin || lead.leadScore >= parseInt(leadsFilters.leadScoreMin);
                  const matchesLeadScoreMax = !leadsFilters.leadScoreMax || lead.leadScore <= parseInt(leadsFilters.leadScoreMax);
                  const matchesDateRange = leadsFilters.dateRange.length === 0;
                  
                  return matchesSearch && matchesAssignedTo && matchesIndustry && matchesStage && 
                    matchesSource && matchesPotential && matchesCampaign && 
                    matchesLeadScoreMin && matchesLeadScoreMax && matchesDateRange;
                });
                
                return renderPaginationControls(filtered.length, leadsPagination, setLeadsPagination, 'leads');
              })()}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Deals Screen
  const renderDeals = () => {
    // Sample deals data
    const dealsData = [
      {
        id: 1,
        name: 'Enterprise Software License',
        dealType: 'New Sale',
        probability: 75,
        expectedCloseDate: '2025-12-15',
        dealValue: '£50,000',
        company: 'Tech Corp Ltd',
        industry: 'Technology',
        contactPerson: 'Sarah Johnson',
        stage: 'Negotiation',
        contractLength: '12 months',
        billingModel: 'Annual',
        paymentTerms: 'Net 30',
        riskLevel: 'Low',
        competitors: ['Competitor A', 'Competitor B'],
        quotationSent: true,
        contractSent: false,
        estimations: [
          { version: 'V1', product: 'Software License', quantity: 10, price: 4500, discount: 10, total: 40500 },
          { version: 'V2', product: 'Support Package', quantity: 1, price: 9500, discount: 0, total: 9500 }
        ],
        meetings: [
          { date: '2025-11-10', type: 'Online', outcome: 'Positive' },
          { date: '2025-11-15', type: 'Call', outcome: 'Follow-up Required' }
        ],
        owner: 'Jane Doe',
        created: '2025-10-15'
      },
      {
        id: 2,
        name: 'Cloud Migration Project',
        dealType: 'Migration',
        probability: 60,
        expectedCloseDate: '2025-12-30',
        dealValue: '£85,000',
        company: 'Enterprise Solutions',
        industry: 'Finance',
        contactPerson: 'David Lee',
        stage: 'Proposal',
        contractLength: '24 months',
        billingModel: 'Monthly',
        paymentTerms: 'Net 15',
        riskLevel: 'Medium',
        competitors: ['Competitor C'],
        quotationSent: true,
        contractSent: false,
        estimations: [
          { version: 'V1', product: 'Migration Service', quantity: 1, price: 75000, discount: 0, total: 75000 },
          { version: 'V1', product: 'Training', quantity: 5, price: 2000, discount: 0, total: 10000 }
        ],
        meetings: [
          { date: '2025-11-12', type: 'In-person', outcome: 'Positive' }
        ],
        owner: 'John Doe',
        created: '2025-10-20'
      }
    ];

    return (
      <div>
        {AddItemModal()}
        {RevisionHistoryModal()}
        {RevisionDetailModal()}
        {DealCompleteHistoryModal()}
        {ManageAttachmentsModal()}
        {DealViewModal()}
        {ConfirmationDialog()}
        {/* Deal Form Modal */}
        <Modal show={showDealFormModal} onHide={() => { setShowDealFormModal(false); setEditingDeal(null); setDealFormStep(0); }} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>{editingDeal ? 'Edit Deal' : 'Add New Deal'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Timeline Navigation */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between position-relative">
                {/* Progress Line */}
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
                    width: `${(dealFormStep / 4) * 100}%`,
                    zIndex: 0,
                    transition: 'width 0.3s ease'
                  }}
                />
                
                {/* Step 1 */}
                <div 
                  className="text-center position-relative" 
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => setDealFormStep(0)}
                >
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 0 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                    style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                  >
                    {dealFormStep > 0 ? <CheckCircle size={20} /> : '1'}
                  </div>
                  <small className={`d-block mt-2 ${dealFormStep === 0 ? 'fw-bold text-primary' : 'text-muted'}`}>Deal Info</small>
                </div>

                {/* Step 2 */}
                <div 
                  className="text-center position-relative" 
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => setDealFormStep(1)}
                >
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                    style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                  >
                    {dealFormStep > 1 ? <CheckCircle size={20} /> : '2'}
                  </div>
                  <small className={`d-block mt-2 ${dealFormStep === 1 ? 'fw-bold text-primary' : 'text-muted'}`}>Company Info</small>
                </div>

                {/* Step 3 */}
                <div 
                  className="text-center position-relative" 
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => setDealFormStep(2)}
                >
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                    style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                  >
                    {dealFormStep > 2 ? <CheckCircle size={20} /> : '3'}
                  </div>
                  <small className={`d-block mt-2 ${dealFormStep === 2 ? 'fw-bold text-primary' : 'text-muted'}`}>Characteristics</small>
                </div>

                {/* Step 4 */}
                <div 
                  className="text-center position-relative" 
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => setDealFormStep(3)}
                >
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                    style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                  >
                    {dealFormStep > 3 ? <CheckCircle size={20} /> : '4'}
                  </div>
                  <small className={`d-block mt-2 ${dealFormStep === 3 ? 'fw-bold text-primary' : 'text-muted'}`}>Progress & Notes</small>
                </div>

                {/* Step 5 */}
                <div 
                  className="text-center position-relative" 
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => setDealFormStep(4)}
                >
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${dealFormStep >= 4 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                    style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                  >
                    {dealFormStep > 4 ? <CheckCircle size={20} /> : '5'}
                  </div>
                  <small className={`d-block mt-2 ${dealFormStep === 4 ? 'fw-bold text-primary' : 'text-muted'}`}>Estimation</small>
                </div>
              </div>
            </div>

            {/* Form Content Based on Step */}
            <div style={{ minHeight: '400px' }}>
              {dealFormStep === 0 && (
                <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-primary">DEAL INFORMATION</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Deal Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control type="text" defaultValue={editingDeal?.name || ''} placeholder="Enter deal name" required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Type <span className="text-danger">*</span></Form.Label>
                          <Form.Select defaultValue={editingDeal?.type || ''} required>
                            <option value="">Select Type</option>
                            <option value="New Business">New Business</option>
                            <option value="Existing Business">Existing Business</option>
                            <option value="Renewal">Renewal</option>
                            <option value="Upsell">Upsell</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Expected Close Date <span className="text-danger">*</span></Form.Label>
                          <Form.Control type="date" defaultValue={editingDeal?.expectedCloseDate || ''} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Assigned to <span className="text-danger">*</span></Form.Label>
                          <Form.Select defaultValue={editingDeal?.assignedTo || editingDeal?.owner || ''} required>
                            <option value="">Select User</option>
                            <option value="John Doe">John Doe</option>
                            <option value="Jane Doe">Jane Doe</option>
                            <option value="Sarah Smith">Sarah Smith</option>
                            <option value="Mike Johnson">Mike Johnson</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Stage <span className="text-danger">*</span></Form.Label>
                          <Form.Select defaultValue={editingDeal?.stage || ''} required>
                            <option value="">Select Stage</option>
                            <option value="Qualification">Qualification</option>
                            <option value="Meeting">Meeting</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Contract Sent">Contract Sent</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Probability <span className="text-danger">*</span></Form.Label>
                          <div className="d-flex align-items-center gap-2">
                            <Form.Range defaultValue={editingDeal?.probability || 50} style={{ flex: 1 }} />
                            <Badge bg="primary" style={{ minWidth: '60px' }}>{editingDeal?.probability || 50}%</Badge>
                          </div>
                          <Form.Text className="text-muted">Likelihood of closing this deal</Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control 
                            as="textarea" 
                            rows={3} 
                            defaultValue={editingDeal?.description || ''} 
                            placeholder="Enter deal description"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {dealFormStep === 1 && (
                <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-success">COMPANY INFORMATION</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control type="text" defaultValue={editingDeal?.company || ''} placeholder="Enter company name" required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Industry <span className="text-danger">*</span></Form.Label>
                          <Form.Select defaultValue={editingDeal?.industry || ''} required>
                            <option value="">Select Industry</option>
                            <option value="Technology">Technology</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retail">Retail</option>
                            <option value="Education">Education</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Telecommunications">Telecommunications</option>
                            <option value="Construction">Construction</option>
                            <option value="Other">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Main Decision Maker <span className="text-danger">*</span></Form.Label>
                          <Form.Control type="text" defaultValue={editingDeal?.decisionMaker || editingDeal?.contactPerson || ''} placeholder="Decision maker name" required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Decision Maker Email <span className="text-danger">*</span></Form.Label>
                          <Form.Control type="email" defaultValue={editingDeal?.decisionMakerEmail || editingDeal?.contactEmail || ''} placeholder="decisionmaker@company.com" required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Decision Maker Phone <span className="text-danger">*</span></Form.Label>
                          <Form.Control type="tel" defaultValue={editingDeal?.decisionMakerPhone || editingDeal?.contactPhone || ''} placeholder="+44 20 1234 5678" required />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {dealFormStep === 2 && (
                <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-info">DEAL CHARACTERISTICS</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Deal Type <span className="text-danger">*</span></Form.Label>
                          <Form.Select defaultValue={editingDeal?.dealType || ''} required>
                            <option value="">Select Deal Type</option>
                            <option value="New Sale">New Sale</option>
                            <option value="Renewal">Renewal</option>
                            <option value="Migration">Migration</option>
                            <option value="Cross-sell">Cross-sell</option>
                            <option value="Upsell">Upsell</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contract Length <span className="text-danger">*</span></Form.Label>
                          <Form.Select defaultValue={editingDeal?.contractLength || ''} required>
                            <option value="">Select Length</option>
                            <option value="1 month">1 month</option>
                            <option value="3 months">3 months</option>
                            <option value="6 months">6 months</option>
                            <option value="12 months">12 months</option>
                            <option value="24 months">24 months</option>
                            <option value="36 months">36 months</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Billing Model <span className="text-danger">*</span></Form.Label>
                          <Form.Select defaultValue={editingDeal?.billingModel || ''} required>
                            <option value="">Select Model</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Semi-Annual">Semi-Annual</option>
                            <option value="Annual">Annual</option>
                            <option value="One-time">One-time</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Payment Terms <span className="text-danger">*</span></Form.Label>
                          <Form.Select defaultValue={editingDeal?.paymentTerms || ''} required>
                            <option value="">Select Terms</option>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                            <option value="Net 45">Net 45</option>
                            <option value="Net 60">Net 60</option>
                            <option value="Upfront">Upfront</option>
                            <option value="50% Upfront">50% Upfront</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Risk Level <span className="text-danger">*</span></Form.Label>
                          <Form.Select defaultValue={editingDeal?.riskLevel || ''} required>
                            <option value="">Select Risk Level</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Competitors in Deal <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="text" 
                            defaultValue={editingDeal?.competitors?.join(', ') || ''} 
                            placeholder="Enter competitor names (comma separated)"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {dealFormStep === 3 && (
                <div>
                  {/* Negotiation Progress */}
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-warning">NEGOTIATION PROGRESS</h5>
                      <Row>
                        <Col md={12}>
                          <div className="d-flex align-items-center gap-4 mb-4 p-4 bg-white rounded shadow-sm">
                            {/* Circular Progress Indicator */}
                            <div className="position-relative" style={{ width: '140px', height: '140px', flexShrink: 0 }}>
                              {/* Background Circle */}
                              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                                <circle
                                  cx="70"
                                  cy="70"
                                  r="60"
                                  fill="none"
                                  stroke="#e9ecef"
                                  strokeWidth="12"
                                />
                                {/* Progress Circle */}
                                <circle
                                  cx="70"
                                  cy="70"
                                  r="60"
                                  fill="none"
                                  stroke="url(#progressGradient2)"
                                  strokeWidth="12"
                                  strokeDasharray={`${2 * Math.PI * 60}`}
                                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - 50 / 100)}`}
                                  strokeLinecap="round"
                                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                                />
                                <defs>
                                  <linearGradient id="progressGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#0d6efd', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#0dcaf0', stopOpacity: 1 }} />
                                  </linearGradient>
                                </defs>
                              </svg>
                              {/* Center Text */}
                              <div className="position-absolute top-50 start-50 translate-middle text-center">
                                <div className="fw-bold" style={{ fontSize: '32px', color: '#0d6efd', lineHeight: 1 }}>
                                  50%
                                </div>
                                <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>Complete</div>
                              </div>
                            </div>
                            
                            {/* Progress Details */}
                            <div style={{ flex: 1 }}>
                              <h6 className="fw-bold mb-3" style={{ color: '#495057' }}>Deal Progress Tracker</h6>
                              {/* <div className="d-flex gap-3 mb-3"> */}
                                {/* Milestone Indicators */}
                                {/* <div className="d-flex align-items-center gap-2">
                                  <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      background: (editingDeal?.quotationSent === 'Yes') ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e9ecef',
                                      boxShadow: (editingDeal?.quotationSent === 'Yes') ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    {(editingDeal?.quotationSent === 'Yes') ? (
                                      <CheckCircle size={20} color="white" />
                                    ) : (
                                      <FileText size={20} color="#6c757d" />
                                    )}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>Quotation</div>
                                    <div style={{ fontSize: '10px', color: '#6c757d' }}>Sent to Client</div>
                                  </div>
                                </div> */}
                                
                                {/* <div className="d-flex align-items-center gap-2">
                                  <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      background: (editingDeal?.contractSent === 'Yes') ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#e9ecef',
                                      boxShadow: (editingDeal?.contractSent === 'Yes') ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    {(editingDeal?.contractSent === 'Yes') ? (
                                      <CheckCircle size={20} color="white" />
                                    ) : (
                                      <Send size={20} color="#6c757d" />
                                    )}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>Contract Sent</div>
                                    <div style={{ fontSize: '10px', color: '#6c757d' }}>Out for Signature</div>
                                  </div>
                                </div>
                                
                                <div className="d-flex align-items-center gap-2">
                                  <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      background: (editingDeal?.contractReceived === 'Yes') ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : '#e9ecef',
                                      boxShadow: (editingDeal?.contractReceived === 'Yes') ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    {(editingDeal?.contractReceived === 'Yes') ? (
                                      <CheckCircle size={20} color="white" />
                                    ) : (
                                      <UserCheck size={20} color="#6c757d" />
                                    )}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>Contract Back</div>
                                    <div style={{ fontSize: '10px', color: '#6c757d' }}>Signed & Received</div>
                                  </div>
                                </div> */}
                              {/* </div> */}
                              <div className="text-muted" style={{ fontSize: '12px' }}>
                                {/* <i className="bi bi-info-circle me-1"></i> */}
                                <Info size={16} className="me-1" />

                                Progress automatically calculated based on completed milestones
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                        <Form.Group className="mb-3">
  <Form.Label className="fw-semibold">
    Quotation Sent <span className="text-danger">*</span>
  </Form.Label>

  <div className="d-flex gap-3 mt-2">
    <div className="custom-radio">
      <input
        type="radio"
        id="quotationSent-yes"
        name="quotationSent"
        value="Yes"
        defaultChecked={editingDeal?.quotationSent === "Yes"}
      />
      <label htmlFor="quotationSent-yes">Yes</label>
    </div>

    <div className="custom-radio">
      <input
        type="radio"
        id="quotationSent-no"
        name="quotationSent"
        value="No"
        defaultChecked={editingDeal?.quotationSent === "No" || !editingDeal?.quotationSent}
      />
      <label htmlFor="quotationSent-no">No</label>
    </div>
  </div>
</Form.Group>


                        </Col>
                        <Col md={4}>
  <Form.Group className="mb-3">
    <Form.Label className="fw-semibold">
      Contract Sent <span className="text-danger">*</span>
    </Form.Label>
    <div className="d-flex gap-3 mt-2">
      <div className="custom-radio">
        <input
          type="radio"
          id="contractSent-yes"
          name="contractSent"
          value="Yes"
          defaultChecked={editingDeal?.contractSent === "Yes"}
        />
        <label htmlFor="contractSent-yes">Yes</label>
      </div>
      <div className="custom-radio">
        <input
          type="radio"
          id="contractSent-no"
          name="contractSent"
          value="No"
          defaultChecked={editingDeal?.contractSent === "No" || !editingDeal?.contractSent}
        />
        <label htmlFor="contractSent-no">No</label>
      </div>
    </div>
  </Form.Group>
</Col>

<Col md={4}>
  <Form.Group className="mb-3">
    <Form.Label className="fw-semibold">
      Contract Received <span className="text-danger">*</span>
    </Form.Label>
    <div className="d-flex gap-3 mt-2">
      <div className="custom-radio">
        <input
          type="radio"
          id="contractReceived-yes"
          name="contractReceived"
          value="Yes"
          defaultChecked={editingDeal?.contractReceived === "Yes"}
        />
        <label htmlFor="contractReceived-yes">Yes</label>
      </div>
      <div className="custom-radio">
        <input
          type="radio"
          id="contractReceived-no"
          name="contractReceived"
          value="No"
          defaultChecked={editingDeal?.contractReceived === "No" || !editingDeal?.contractReceived}
        />
        <label htmlFor="contractReceived-no">No</label>
      </div>
    </div>
  </Form.Group>
</Col>

                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Attachments */}
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-info">ATTACHMENTS</h5>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Document Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="text" placeholder="Enter document name" />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Upload Document</Form.Label>
                            <Form.Control type="file" />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          {editingDeal?.attachments && editingDeal.attachments.length > 0 ? (
                            <div className="border rounded p-2 bg-white">
                              <small className="text-muted d-block mb-2">Attached Documents:</small>
                              {editingDeal.attachments.map((doc: any, idx: number) => (
                                <Badge key={idx} bg="secondary" className="me-2 mb-1">
                                  <FileText size={12} className="me-1" />
                                  {doc.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted p-3 border rounded bg-white">
                              <FileText size={24} className="mb-2" />
                              <div><small>No documents attached</small></div>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Additional Notes */}
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-primary">ADDITIONAL NOTES</h5>
                      <Form.Group className="mb-3">
                        <Form.Control 
                          as="textarea" 
                          rows={4} 
                          defaultValue={editingDeal?.additionalNotes || ''} 
                          placeholder="Enter any additional notes about this deal"
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>

                  {/* Remarks by Supervisor */}
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-success">REMARKS BY SUPERVISOR</h5>
                      <Form.Group className="mb-3">
                        <Form.Control 
                          as="textarea" 
                          rows={4} 
                          defaultValue={editingDeal?.supervisorRemarks || ''} 
                          placeholder="Supervisor remarks and feedback"
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {dealFormStep === 4 && (
                <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-success">ESTIMATION CHART</h5>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex gap-2">
                        {/* <Button variant="outline-primary" size="sm">
                          <Edit size={14} className="me-1" />
                          Estimate Option
                        </Button> */}
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={() => setShowRevisionHistoryModal(true)}
                        >
                          <Eye size={14} className="me-1" />
                          Revision History
                        </Button>
                      </div>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => {
                          setEditingItem(null);
                          setItemFormData({
                            product: '',
                            description: '',
                            quantity: 1,
                            unitPrice: 0,
                            currency: 'GBP',
                            tax: 20
                          });
                          setShowAddItemModal(true);
                        }}
                      >
                        <Plus size={14} className="me-1" />
                        Add Item
                      </Button>
                    </div>
                    <div className="table-responsive">
                      <Table size="sm" hover className="bg-white">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Product/Service</th>
                            <th>Description/Specification</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Currency</th>
                            <th>Tax %</th>
                            <th>Sub Total</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editingDeal?.estimations?.map((est: any, index: number) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{est.product}</td>
                              <td>{est.description || 'N/A'}</td>
                              <td>{est.quantity}</td>
                              <td>{est.unitPrice?.toLocaleString() || 0}</td>
                              <td>
                                <Badge bg="secondary">{est.currency || 'GBP'}</Badge>
                              </td>
                              <td>{est.tax || 0}%</td>
                              <td className="fw-bold">
                                {est.currency || '£'}{((est.unitPrice || 0) * (est.quantity || 0) * (1 + (est.tax || 0) / 100)).toLocaleString()}
                              </td>
                              <td>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 me-2"
                                  title="Edit Item"
                                  onClick={() => {
                                    setEditingItem(index);
                                    setItemFormData({
                                      product: est.product,
                                      description: est.description || '',
                                      quantity: est.quantity,
                                      unitPrice: est.unitPrice,
                                      currency: est.currency || 'GBP',
                                      tax: est.tax || 20
                                    });
                                    setShowAddItemModal(true);
                                  }}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 text-danger"
                                  title="Delete Item"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this item?')) {
                                      const updatedEstimations = editingDeal.estimations.filter((_: any, i: number) => i !== index);
                                      setEditingDeal({
                                        ...editingDeal,
                                        estimations: updatedEstimations
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {(!editingDeal?.estimations || editingDeal.estimations.length === 0) && (
                            <tr>
                              <td colSpan={9} className="text-center text-muted py-4">
                                <Package size={32} className="text-muted mb-2" />
                                <div>No items in estimation chart</div>
                                <small>Click "Add Item" to add products or services</small>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                    {editingDeal?.estimations && editingDeal.estimations.length > 0 && (
                      <div className="text-end mt-3 p-3 bg-white rounded border">
                        <h4 className="mb-0">
                          <strong>Grand Total:</strong> <span className="text-success">
                            £{editingDeal.estimations.reduce((sum: number, est: any) => 
                              sum + ((est.unitPrice || 0) * (est.quantity || 0) * (1 + (est.tax || 0) / 100)), 0
                            ).toLocaleString()}
                          </span>
                        </h4>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between">
            <Button 
              variant="secondary" 
              onClick={() => dealFormStep > 0 ? setDealFormStep(dealFormStep - 1) : setShowDealFormModal(false)}
            >
              {dealFormStep > 0 ? '← Previous' : 'Cancel'}
            </Button>
            <div className="d-flex gap-2">
              {dealFormStep < 4 ? (
                <Button 
                  variant="primary"
                  onClick={() => setDealFormStep(dealFormStep + 1)}
                >
                  Next →
                </Button>
              ) : (
                <>
                  <Button 
                    variant="success"
                    onClick={() => {
                      setConfirmAction({ type: 'convert-order', data: editingDeal });
                      setShowConfirmDialog(true);
                    }}
                  >
                    <ShoppingBag size={16} className="me-1" />
                    Convert to Order
                  </Button>
                  <Button variant="primary">
                    {editingDeal ? 'Update Deal' : 'Create Deal'}
                  </Button>
                </>
              )}
            </div>
          </Modal.Footer>
        </Modal>

        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Deals & Opportunities</h2>
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
            <Button variant="primary" onClick={() => setShowDealFormModal(true)}>
              <Plus size={16} className="me-2" />
              Add Deal
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
              value="51"
              change="+8.2%"
              isPositive={true}
              icon={<Handshake size={24} />}
              color="primary"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Won Deals"
              value="13"
              change="+2"
              isPositive={true}
              icon={<CheckCircle size={24} />}
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="In Negotiation"
              value="4"
              icon={<Activity size={24} />}
              color="warning"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Total Value"
              value="£842K"
              change="+15.3%"
              isPositive={true}
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
                      data={[
                        { name: 'Meeting', value: 12, color: '#0dcaf0' },
                        { name: 'Proposal', value: 15, color: '#0d6efd' },
                        { name: 'Negotiation', value: 8, color: '#ffc107' },
                        { name: 'Contract Sent', value: 3, color: '#fd7e14' },
                        { name: 'Won', value: 13, color: '#198754' }
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
                        { name: 'Meeting', value: 12, color: '#0dcaf0' },
                        { name: 'Proposal', value: 15, color: '#0d6efd' },
                        { name: 'Negotiation', value: 8, color: '#ffc107' },
                        { name: 'Contract Sent', value: 3, color: '#fd7e14' },
                        { name: 'Won', value: 13, color: '#198754' }
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
                <h6 className="fw-bold mb-3">Deal Value Distribution</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { range: '£0-25K', count: 18 },
                      { range: '£25-50K', count: 15 },
                      { range: '£50-100K', count: 12 },
                      { range: '£100K+', count: 6 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d6efd" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Win/Loss Ratio</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Won', value: 13, color: '#198754' },
                        { name: 'Lost', value: 7, color: '#dc3545' },
                        { name: 'In Progress', value: 31, color: '#6c757d' }
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
                        { name: 'Won', value: 13, color: '#198754' },
                        { name: 'Lost', value: 7, color: '#dc3545' },
                        { name: 'In Progress', value: 31, color: '#6c757d' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <small className="text-muted">Win Rate: <strong className="text-success">65%</strong></small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Deals by Industry</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { industry: 'Technology', count: 18 },
                      { industry: 'Finance', count: 14 },
                      { industry: 'Healthcare', count: 9 },
                      { industry: 'Retail', count: 6 },
                      { industry: 'Other', count: 4 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="industry" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6f42c1" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
          </>
        )}

        {/* Filter Bar  deals*/}
        <FilterBar
         quickFilters={[
          { id: 'all', label: 'All Deals', count: 51, color: '#6c757d', activeColor: '#0d6efd', icon: <Users size={16} /> },
          { id: 'negotiation', label: 'Negotiation', count: 8, color: '#0dcaf0', activeColor: '#0d6efd', icon: <DollarSign size={16} /> },
          { id: 'proposal', label: 'Proposal', count: 15, color: '#0d6efd', activeColor: '#0d6efd', icon: <FileText size={16} /> },
          { id: 'high-value', label: 'High Value (>£50k)', count: 12, color: '#198754', activeColor: '#0d6efd', icon: <Star size={16} /> },
          { id: 'closing-soon', label: 'Closing This Month', count: 6, color: '#ffc107', activeColor: '#0d6efd', icon: <Calendar size={16} /> },
          { id: 'won', label: 'Won', count: 13, color: '#198754', activeColor: '#0d6efd', icon: <CheckCircle size={16} /> }
        ]}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => setActiveFilter(filterId)}
          searchValue={dealsSearch}
          onSearchChange={(value) => setDealsSearch(value)}
          onSearch={() => console.log('Searching deals:', dealsSearch)}
          searchPlaceholder="Search deals by name, company..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={Object.values(dealsFilters).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)}
        />

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Stage</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Meeting', label: 'Meeting' },
                      { value: 'Proposal', label: 'Proposal' },
                      { value: 'Negotiation', label: 'Negotiation' },
                      { value: 'Contract Sent', label: 'Contract Sent' },
                      { value: 'Won', label: 'Won' },
                      { value: 'Lost', label: 'Lost' }
                    ]}
                    value={dealsFilters.stage.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setDealsFilters(prev => ({
                        ...prev,
                        stage: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Deal Type</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'New Sale', label: 'New Sale' },
                      { value: 'Migration', label: 'Migration' },
                      { value: 'Renewal', label: 'Renewal' },
                      { value: 'Upsell', label: 'Upsell' }
                    ]}
                    value={dealsFilters.dealType.map(t => ({ value: t, label: t }))}
                    onChange={(selected) => {
                      setDealsFilters(prev => ({
                        ...prev,
                        dealType: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Owner</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Jane Doe', label: 'Jane Doe' },
                      { value: 'John Doe', label: 'John Doe' },
                      { value: 'Sarah Smith', label: 'Sarah Smith' },
                      { value: 'Mike Johnson', label: 'Mike Johnson' }
                    ]}
                    value={dealsFilters.owner.map(o => ({ value: o, label: o }))}
                    onChange={(selected) => {
                      setDealsFilters(prev => ({
                        ...prev,
                        owner: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Min Value (£)</Form.Label>
                  <Form.Control 
                    type="number" 
                    size="sm"
                    placeholder="0"
                    value={dealsFilters.minValue}
                    onChange={(e) => setDealsFilters(prev => ({
                      ...prev,
                      minValue: e.target.value
                    }))}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Close Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    size="sm"
                    value={dealsFilters.closeDate}
                    onChange={(e) => setDealsFilters(prev => ({
                      ...prev,
                      closeDate: e.target.value
                    }))}
                  />
                </Col>
                <Col md={2}>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary" 
                     
                      className="flex-grow-1"
                      onClick={() => {
                        console.log('Applying filters:', dealsFilters);
                      }}
                    >
                      Apply
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      
                      onClick={() => {
                        setDealsFilters({
                          stage: [],
                          dealType: [],
                          owner: [],
                          industry: [],
                          riskLevel: [],
                          minValue: '',
                          closeDate: ''
                        });
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

        {/* Bulk Actions and Column Customization - Deals */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          {/* Bulk Actions Dropdown - Only show when items are selected */}
          {selectedDeals.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <CheckSquare size={16} className="me-2" />
                Bulk Actions ({selectedDeals.length})
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item 
                  onClick={() => {
                    setConfirmAction({
                      type: 'delete',
                      data: { 
                        itemType: 'Deals', 
                        name: `${selectedDeals.length} selected deals`,
                        count: selectedDeals.length
                      }
                    });
                    setShowConfirmDialog(true);
                  }}
                  className="d-flex align-items-center text-danger"
                >
                  <Trash2 size={14} className="me-2" />
                  Delete Selected ({selectedDeals.length})
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
            <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[
                { key: 'dealName', label: 'Deal Name' },
                { key: 'company', label: 'Company' },
                { key: 'value', label: 'Value' },
                { key: 'stage', label: 'Stage' },
                { key: 'dealType', label: 'Deal Type' },
                { key: 'owner', label: 'Owner' },
                { key: 'industry', label: 'Industry' },
                { key: 'probability', label: 'Probability' },
                { key: 'closeDate', label: 'Close Date' },
                { key: 'created', label: 'Created' }
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedDealsColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDealsColumns([...selectedDealsColumns, col.key]);
                      } else {
                        setSelectedDealsColumns(selectedDealsColumns.filter(c => c !== col.key));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setSelectedDealsColumns(['dealName', 'company', 'value', 'stage', 'dealType', 'owner', 'industry', 'probability', 'closeDate', 'created'])}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setSelectedDealsColumns(['dealName', 'company', 'value', 'stage', 'dealType', 'owner', 'industry', 'probability', 'closeDate', 'created']);
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Deals Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: '50px' }}>
                    <Form.Check
                      type="checkbox"
                      checked={(() => {
                        const filtered = dealsData.filter(deal => {
                          if (activeFilter === 'negotiation') {
                            if (deal.stage !== 'Negotiation') return false;
                          } else if (activeFilter === 'proposal') {
                            if (deal.stage !== 'Proposal') return false;
                          } else if (activeFilter === 'high-value') {
                            const value = parseInt(deal.dealValue.replace(/[£,]/g, ''));
                            if (value <= 50000) return false;
                          } else if (activeFilter === 'closing-soon') {
                            const currentMonth = new Date().getMonth();
                            const currentYear = new Date().getFullYear();
                            const closeDate = new Date(deal.expectedCloseDate);
                            if (closeDate.getMonth() !== currentMonth || closeDate.getFullYear() !== currentYear) return false;
                          } else if (activeFilter === 'won') {
                            if (deal.stage !== 'Won') return false;
                          }
                          
                          const searchLower = dealsSearch.toLowerCase();
                          const matchesSearch = !dealsSearch ||
                            deal.name.toLowerCase().includes(searchLower) ||
                            deal.company.toLowerCase().includes(searchLower);
                          
                          const matchesStage = dealsFilters.stage.length === 0 || dealsFilters.stage.includes(deal.stage);
                          const matchesDealType = dealsFilters.dealType.length === 0 || dealsFilters.dealType.includes(deal.dealType);
                          const matchesOwner = dealsFilters.owner.length === 0 || dealsFilters.owner.includes(deal.owner);
                          const matchesIndustry = dealsFilters.industry.length === 0 || dealsFilters.industry.includes(deal.industry);
                          const matchesMinValue = !dealsFilters.minValue || parseInt(deal.dealValue.replace(/[£,]/g, '')) >= parseInt(dealsFilters.minValue);
                          const matchesCloseDate = !dealsFilters.closeDate || new Date(deal.expectedCloseDate) <= new Date(dealsFilters.closeDate);
                          
                          return matchesSearch && matchesStage && matchesDealType && matchesOwner && matchesIndustry && matchesMinValue && matchesCloseDate;
                        });
                        const sorted = sortData(filtered, dealsPagination.sortColumn, dealsPagination.sortDirection);
                        const paginated = paginateData(sorted, dealsPagination.currentPage, dealsPagination.rowsPerPage);
                        return paginated.length > 0 && paginated.every(d => selectedDeals.includes(d.id));
                      })()}
                      onChange={(e) => {
                        const filtered = dealsData.filter(deal => {
                          if (activeFilter === 'negotiation') {
                            if (deal.stage !== 'Negotiation') return false;
                          } else if (activeFilter === 'proposal') {
                            if (deal.stage !== 'Proposal') return false;
                          } else if (activeFilter === 'high-value') {
                            const value = parseInt(deal.dealValue.replace(/[£,]/g, ''));
                            if (value <= 50000) return false;
                          } else if (activeFilter === 'closing-soon') {
                            const currentMonth = new Date().getMonth();
                            const currentYear = new Date().getFullYear();
                            const closeDate = new Date(deal.expectedCloseDate);
                            if (closeDate.getMonth() !== currentMonth || closeDate.getFullYear() !== currentYear) return false;
                          } else if (activeFilter === 'won') {
                            if (deal.stage !== 'Won') return false;
                          }
                          
                          const searchLower = dealsSearch.toLowerCase();
                          const matchesSearch = !dealsSearch ||
                            deal.name.toLowerCase().includes(searchLower) ||
                            deal.company.toLowerCase().includes(searchLower);
                          
                          const matchesStage = dealsFilters.stage.length === 0 || dealsFilters.stage.includes(deal.stage);
                          const matchesDealType = dealsFilters.dealType.length === 0 || dealsFilters.dealType.includes(deal.dealType);
                          const matchesOwner = dealsFilters.owner.length === 0 || dealsFilters.owner.includes(deal.owner);
                          const matchesIndustry = dealsFilters.industry.length === 0 || dealsFilters.industry.includes(deal.industry);
                          const matchesMinValue = !dealsFilters.minValue || parseInt(deal.dealValue.replace(/[£,]/g, '')) >= parseInt(dealsFilters.minValue);
                          const matchesCloseDate = !dealsFilters.closeDate || new Date(deal.expectedCloseDate) <= new Date(dealsFilters.closeDate);
                          
                          return matchesSearch && matchesStage && matchesDealType && matchesOwner && matchesIndustry && matchesMinValue && matchesCloseDate;
                        });
                        const sorted = sortData(filtered, dealsPagination.sortColumn, dealsPagination.sortDirection);
                        const paginated = paginateData(sorted, dealsPagination.currentPage, dealsPagination.rowsPerPage);
                        
                        if (e.target.checked) {
                          setSelectedDeals(paginated.map(d => d.id));
                        } else {
                          setSelectedDeals([]);
                        }
                      }}
                    />
                  </th>
                  {selectedDealsColumns.includes('dealName') && <th>Deal Name</th>}
                  {selectedDealsColumns.includes('company') && <th>Company</th>}
                  {selectedDealsColumns.includes('stage') && <th>Stage</th>}
                  {selectedDealsColumns.includes('dealType') && <th>Deal Type</th>}
                  {selectedDealsColumns.includes('value') && <th>Value</th>}
                  {selectedDealsColumns.includes('probability') && <th>Probability</th>}
                  {selectedDealsColumns.includes('closeDate') && <th>Expected Close</th>}
                  {selectedDealsColumns.includes('owner') && <th>Owner</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Filter deals based on active filter, search, and advanced filters
                  let filteredDeals = dealsData.filter(deal => {
                    // Quick filters
                    if (activeFilter === 'negotiation') {
                      if (deal.stage !== 'Negotiation') return false;
                    } else if (activeFilter === 'proposal') {
                      if (deal.stage !== 'Proposal') return false;
                    } else if (activeFilter === 'high-value') {
                      const value = parseInt(deal.dealValue.replace(/[£,]/g, ''));
                      if (value <= 50000) return false;
                    } else if (activeFilter === 'closing-soon') {
                      const currentMonth = new Date().getMonth();
                      const currentYear = new Date().getFullYear();
                      const closeDate = new Date(deal.expectedCloseDate);
                      if (closeDate.getMonth() !== currentMonth || closeDate.getFullYear() !== currentYear) return false;
                    } else if (activeFilter === 'won') {
                      if (deal.stage !== 'Won') return false;
                    }
                    
                    // Search filter
                    const searchLower = dealsSearch.toLowerCase();
                    const matchesSearch = !dealsSearch || 
                      deal.name.toLowerCase().includes(searchLower) ||
                      deal.company.toLowerCase().includes(searchLower);
                    
                    // Advanced filters
                    const matchesStage = dealsFilters.stage.length === 0 || 
                      dealsFilters.stage.includes(deal.stage);
                    const matchesDealType = dealsFilters.dealType.length === 0 || 
                      dealsFilters.dealType.includes(deal.dealType);
                    const matchesOwner = dealsFilters.owner.length === 0 || 
                      dealsFilters.owner.includes(deal.owner);
                    const matchesIndustry = dealsFilters.industry.length === 0 || 
                      dealsFilters.industry.includes(deal.industry);
                    const matchesMinValue = !dealsFilters.minValue || 
                      parseInt(deal.dealValue.replace(/[£,]/g, '')) >= parseInt(dealsFilters.minValue);
                    const matchesCloseDate = !dealsFilters.closeDate || 
                      new Date(deal.expectedCloseDate) <= new Date(dealsFilters.closeDate);
                    
                    return matchesSearch && matchesStage && matchesDealType && 
                      matchesOwner && matchesIndustry && matchesMinValue && matchesCloseDate;
                  });
                  
                  const sorted = sortData(filteredDeals, dealsPagination.sortColumn, dealsPagination.sortDirection);
                  const paginated = paginateData(sorted, dealsPagination.currentPage, dealsPagination.rowsPerPage);
                  
                  if (filteredDeals.length === 0) {
                    return (
                      <tr>
                        <td colSpan={selectedDealsColumns.length + 2} className="text-center py-4 text-muted">
                          No deals found matching your criteria
                        </td>
                      </tr>
                    );
                  }
                  
                  return paginated.map((deal) => (
                    <tr key={deal.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedDeals.includes(deal.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDeals([...selectedDeals, deal.id]);
                            } else {
                              setSelectedDeals(selectedDeals.filter(id => id !== deal.id));
                            }
                          }}
                        />
                      </td>
                      {selectedDealsColumns.includes('dealName') && (
                        <td className="fw-semibold">{deal.name}</td>
                      )}
                      {selectedDealsColumns.includes('company') && (
                        <td>
                          <div>
                            <div className="fw-medium">{deal.company}</div>
                            <small className="text-muted">{deal.industry}</small>
                          </div>
                        </td>
                      )}
                      {selectedDealsColumns.includes('stage') && (
                        <td>
                          <Badge 
                            bg={
                              deal.stage === 'Negotiation' ? 'warning' :
                              deal.stage === 'Proposal' ? 'info' :
                              deal.stage === 'Won' ? 'success' :
                              'secondary'
                            }
                          >
                            {deal.stage}
                          </Badge>
                        </td>
                      )}
                      {selectedDealsColumns.includes('dealType') && (
                        <td>
                          <Badge bg="primary" className="bg-opacity-10 text-dark">
                            {deal.dealType}
                          </Badge>
                        </td>
                      )}
                      {selectedDealsColumns.includes('value') && (
                        <td className="fw-semibold">{deal.dealValue}</td>
                      )}
                      {selectedDealsColumns.includes('probability') && (
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <ProgressBar 
                              now={deal.probability} 
                              style={{ width: '60px', height: '8px' }}
                            />
                            <small>{deal.probability}%</small>
                          </div>
                        </td>
                      )}
                      {selectedDealsColumns.includes('closeDate') && (
                        <td>{deal.expectedCloseDate}</td>
                      )}
                      {selectedDealsColumns.includes('owner') && (
                        <td>{deal.owner}</td>
                      )}
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1" 
                            title="View"
                            onClick={() => {
                              setViewingDeal(deal);
                              setShowDealViewModal(true);
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1" 
                            title="Edit"
                            onClick={() => {
                              setEditingDeal(deal);
                              setShowDealFormModal(true);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-info" 
                            title="Manage Attachments"
                            onClick={() => {
                              setSelectedDealForAttachments(deal);
                              setShowAttachmentModal(true);
                            }}
                          >
                            <Paperclip size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-success" 
                            title="Convert to Order"
                            onClick={() => {
                              setConfirmAction({
                                type: 'convert-order',
                                data: { ...deal, itemType: 'Deal' }
                              });
                              setShowConfirmDialog(true);
                            }}
                          >
                            <ShoppingBag size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-danger" 
                            title="Delete"
                            onClick={() => {
                              setConfirmAction({
                                type: 'delete',
                                data: { ...deal, itemType: 'Deal' }
                              });
                              setShowConfirmDialog(true);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </Table>
            </div>
            <div className="p-3">
            {(() => {
              let filteredDeals = dealsData.filter(deal => {
                if (activeFilter === 'negotiation') {
                  if (deal.stage !== 'Negotiation') return false;
                } else if (activeFilter === 'proposal') {
                  if (deal.stage !== 'Proposal') return false;
                } else if (activeFilter === 'high-value') {
                  const value = parseInt(deal.dealValue.replace(/[£,]/g, ''));
                  if (value <= 50000) return false;
                } else if (activeFilter === 'closing-soon') {
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  const closeDate = new Date(deal.expectedCloseDate);
                  if (closeDate.getMonth() !== currentMonth || closeDate.getFullYear() !== currentYear) return false;
                } else if (activeFilter === 'won') {
                  if (deal.stage !== 'Won') return false;
                }
                
                const searchLower = dealsSearch.toLowerCase();
                const matchesSearch = !dealsSearch || 
                  deal.name.toLowerCase().includes(searchLower) ||
                  deal.company.toLowerCase().includes(searchLower);
                
                const matchesStage = dealsFilters.stage.length === 0 || 
                  dealsFilters.stage.includes(deal.stage);
                const matchesDealType = dealsFilters.dealType.length === 0 || 
                  dealsFilters.dealType.includes(deal.dealType);
                const matchesOwner = dealsFilters.owner.length === 0 || 
                  dealsFilters.owner.includes(deal.owner);
                const matchesIndustry = dealsFilters.industry.length === 0 || 
                  dealsFilters.industry.includes(deal.industry);
                const matchesMinValue = !dealsFilters.minValue || 
                  parseInt(deal.dealValue.replace(/[£,]/g, '')) >= parseInt(dealsFilters.minValue);
                const matchesCloseDate = !dealsFilters.closeDate || 
                  new Date(deal.expectedCloseDate) <= new Date(dealsFilters.closeDate);
                
                return matchesSearch && matchesStage && matchesDealType && 
                  matchesOwner && matchesIndustry && matchesMinValue && matchesCloseDate;
              });
              
              return renderPaginationControls(filteredDeals.length, dealsPagination, setDealsPagination, 'deals');
            })()}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Orders Screen
  const renderOrders = () => {
    // Sample orders data
    const ordersData = [
      {
        id: 'ORD-2025-001',
        linkedDeal: 'Enterprise Software License',
        linkedLead: 'John Smith',
        orderDate: '2025-11-16',
        value: '£50,000',
        discount: '10%',
        approvalStatus: 'Approved',
        stage: 'In Progress',
        priority: 'High',
        contractType: 'Fixed',
        contractLength: '12 months',
        contractStartDate: '2025-11-16',
        contractEndDate: '2026-11-16',
        billingModel: 'Annual',
        billingStatus: 'Paid',
        paymentTerms: 'Net 30',
        paymentStatus: 'Received',
        autoRenewal: true,
        fulfillmentStatus: 'In Progress',
        progressPercent: 45,
        pocName: 'Sarah Johnson',
        pocTitle: 'IT Director',
        pocPhone: '+44 20 1234 5678',
        pocCountryCode: '+44',
        products: [
          { name: 'Software License', quantity: 10, price: 4500, total: 45000 },
          { name: 'Support Package', quantity: 1, price: 5000, total: 5000 }
        ],
        created: '2025-11-16',
        owner: 'Jane Doe'
      },
      {
        id: 'ORD-2025-002',
        linkedDeal: 'Cloud Migration Project',
        linkedLead: 'Robert Taylor',
        orderDate: '2025-11-18',
        value: '£85,000',
        discount: '5%',
        approvalStatus: 'Pending',
        stage: 'Order Created',
        priority: 'Medium',
        contractType: 'Subscription',
        contractLength: '24 months',
        contractStartDate: '2025-12-01',
        contractEndDate: '2027-12-01',
        billingModel: 'Monthly',
        billingStatus: 'Not Billed',
        paymentTerms: 'Net 15',
        paymentStatus: 'Pending',
        autoRenewal: false,
        fulfillmentStatus: 'Pending',
        progressPercent: 5,
        pocName: 'David Lee',
        pocTitle: 'CTO',
        pocPhone: '+44 161 234 5678',
        pocCountryCode: '+44',
        products: [
          { name: 'Migration Service', quantity: 1, price: 75000, total: 75000 },
          { name: 'Training Package', quantity: 5, price: 2000, total: 10000 }
        ],
        created: '2025-11-18',
        owner: 'John Doe'
      }
    ];

    return (
      <div>
        {OrderViewModal()}
        {ConfirmationDialog()}
        {/* Order Form Modal */}
        <Modal show={showOrderFormModal} onHide={() => { setShowOrderFormModal(false); setEditingOrder(null); }} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>{editingOrder ? 'Edit Order' : 'Add New Order'}</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Order Information Section */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="fw-bold mb-3 text-primary">Order Information</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Order ID <span className="text-muted small">(Auto-generated)</span></Form.Label>
                      <Form.Control type="text" value={editingOrder?.id || 'ORD-2025-XXX'} disabled />
                      <Form.Text className="text-muted">Unique order identifier</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Linked Deal <span className="text-danger">*</span></Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control type="text" value={editingOrder?.linkedDeal || ''} disabled />
                        <Button variant="outline-primary" size="sm">
                          <Eye size={14} />
                        </Button>
                      </div>
                      <Form.Text className="text-muted">Associated deal for this order</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Order Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="date" defaultValue={editingOrder?.orderDate || ''} />
                      <Form.Text className="text-muted">Date when order was created</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Order Value <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" defaultValue={editingOrder?.value || ''} placeholder="£0.00" />
                      <Form.Text className="text-muted">Total value of the order</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Discount</Form.Label>
                      <Form.Control type="text" defaultValue={editingOrder?.discount || ''} placeholder="0%" />
                      <Form.Text className="text-muted">Applied discount percentage</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Priority <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingOrder?.priority || ''}>
                        <option value="">Select Priority</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Order processing priority</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Approval Status</Form.Label>
                      <Form.Select defaultValue={editingOrder?.approvalStatus || ''}>
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Current approval status</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stage <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingOrder?.stage || ''}>
                        <option value="">Select Stage</option>
                        <option value="Order Created">Order Created</option>
                        <option value="Approved">Approved</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Ready for Delivery">Ready for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Activated">Activated</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Current order stage</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Contract & Billing Section */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="fw-bold mb-3 text-success">Contract & Billing</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contract Type <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingOrder?.contractType || ''}>
                        <option value="">Select Type</option>
                        <option value="Fixed">Fixed</option>
                        <option value="Subscription">Subscription</option>
                        <option value="Usage-based">Usage-based</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Type of contract agreement</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contract Length</Form.Label>
                      <Form.Select defaultValue={editingOrder?.contractLength || ''}>
                        <option value="">Select Length</option>
                        <option value="6 months">6 months</option>
                        <option value="12 months">12 months</option>
                        <option value="24 months">24 months</option>
                        <option value="36 months">36 months</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Duration of the contract</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contract Start Date</Form.Label>
                      <Form.Control type="date" defaultValue={editingOrder?.contractStartDate || ''} />
                      <Form.Text className="text-muted">When the contract begins</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contract End Date</Form.Label>
                      <Form.Control type="date" defaultValue={editingOrder?.contractEndDate || ''} />
                      <Form.Text className="text-muted">When the contract expires</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Billing Model <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingOrder?.billingModel || ''}>
                        <option value="">Select Model</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                        <option value="One-time">One-time</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Billing frequency</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Billing Status</Form.Label>
                      <Form.Select defaultValue={editingOrder?.billingStatus || ''}>
                        <option value="">Select Status</option>
                        <option value="Not Billed">Not Billed</option>
                        <option value="Billed">Billed</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Current billing status</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Terms</Form.Label>
                      <Form.Select defaultValue={editingOrder?.paymentTerms || ''}>
                        <option value="">Select Terms</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                        <option value="Upfront">Upfront</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Payment due period</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Status</Form.Label>
                      <Form.Select defaultValue={editingOrder?.paymentStatus || ''}>
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Current payment status</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fulfillment Status</Form.Label>
                      <Form.Select defaultValue={editingOrder?.fulfillmentStatus || ''}>
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Order fulfillment status</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 d-flex align-items-center" style={{ paddingTop: '32px' }}>
                      <Form.Check 
                        type="checkbox" 
                        label="Enable Auto Renewal" 
                        defaultChecked={editingOrder?.autoRenewal || false}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Order Progress Section */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <h6 className="fw-bold mb-3 text-info">Order Progress</h6>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                        <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" strokeWidth="8" />
                          <circle 
                            cx="60" 
                            cy="60" 
                            r="54" 
                            fill="none" 
                            stroke="#0d6efd" 
                            strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 54}`}
                            strokeDashoffset={`${2 * Math.PI * 54 * (1 - (editingOrder?.progressPercent || 0) / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div 
                          style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            fontSize: '24px',
                            fontWeight: 'bold'
                          }}
                        >
                          {editingOrder?.progressPercent || 0}%
                        </div>
                      </div>
                      <div>
                        <p className="mb-2"><strong>Stage:</strong> {editingOrder?.stage || 'Order Created'}</p>
                        <p className="mb-2"><strong>Fulfillment:</strong> {editingOrder?.fulfillmentStatus || 'Pending'}</p>
                        <div className="alert alert-info small mb-0">
                          <AlertCircle size={14} className="me-1" />
                          Progress auto-updates based on stage and fulfillment status
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

            {/* Point of Contact Section */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <h6 className="fw-bold mb-3 text-warning">Point of Contact (POC)</h6>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>POC Name</Form.Label>
                          <Form.Control type="text" defaultValue={editingOrder?.pocName || ''} placeholder="Full Name" />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Title</Form.Label>
                          <Form.Control type="text" defaultValue={editingOrder?.pocTitle || ''} placeholder="Job Title" />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone (with country code)</Form.Label>
                          <Form.Control type="tel" defaultValue={editingOrder?.pocPhone || ''} placeholder="+44 20 1234 5678" />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

            {/* Product/Services Section */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-success">Product/Services <span className="text-muted small">(From Deal Estimation)</span></h6>
                      <Button variant="outline-primary" size="sm">
                        <Edit size={14} className="me-1" />
                        Edit Items
                      </Button>
                    </div>
                    <Table size="sm" hover className="bg-white">
                      <thead>
                        <tr>
                          <th>Product/Service</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingOrder?.products?.map((product: any, index: number) => (
                          <tr key={index}>
                            <td>{product.name}</td>
                            <td>{product.quantity}</td>
                            <td>£{product.price.toLocaleString()}</td>
                            <td className="fw-bold">£{product.total.toLocaleString()}</td>
                          </tr>
                        ))}
                        {(!editingOrder?.products || editingOrder.products.length === 0) && (
                          <tr>
                            <td colSpan={4} className="text-center text-muted">No products added</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                    {editingOrder?.products && editingOrder.products.length > 0 && (
                      <div className="text-end mt-2">
                        <h5 className="mb-0">
                          Grand Total: <span className="text-success">£{editingOrder.products.reduce((sum: number, p: any) => sum + p.total, 0).toLocaleString()}</span>
                        </h5>
                      </div>
                    )}
                  </Card.Body>
                </Card>

            {/* Linked Forms Section */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <h6 className="fw-bold mb-3 text-danger">Linked Forms</h6>
                    <div className="d-flex gap-2">
                      <Button variant="outline-primary" size="sm">
                        <Eye size={14} className="me-1" />
                        View Linked Deal
                      </Button>
                      <Button variant="outline-success" size="sm">
                        <Eye size={14} className="me-1" />
                        View Linked Lead
                      </Button>
                      <Button variant="outline-info" size="sm">
                        <Activity size={14} className="me-1" />
                        Activity History
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowOrderFormModal(false); setEditingOrder(null); }}>
              Cancel
            </Button>
            <Button variant="primary">
              {editingOrder ? 'Update Order' : 'Create Order'}
            </Button>
          </Modal.Footer>
        </Modal>

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
              {showOrdersAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            <Button variant="primary" onClick={() => setShowOrderFormModal(true)}>
              <Plus size={16} className="me-2" />
              Add Order
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
              value="35"
              change="+5"
              isPositive={true}
              icon={<ShoppingBag size={24} />}
              color="primary"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Delivered"
              value="22"
              change="+3"
              isPositive={true}
              icon={<CheckCircle size={24} />}
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="In Progress"
              value="8"
              icon={<Activity size={24} />}
              color="info"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Pending Approval"
              value="5"
              icon={<Clock size={24} />}
              color="warning"
            />
          </Col>
        </Row>

        {/* Analytics Charts */}
        <Row className="mb-4">
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Orders by Status</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Delivered', value: 22, color: '#198754' },
                        { name: 'In Progress', value: 8, color: '#0dcaf0' },
                        { name: 'Pending Approval', value: 5, color: '#ffc107' }
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
                        { name: 'Delivered', value: 22, color: '#198754' },
                        { name: 'In Progress', value: 8, color: '#0dcaf0' },
                        { name: 'Pending Approval', value: 5, color: '#ffc107' }
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
                <h6 className="fw-bold mb-3">Order Value Trend (Last 6 Months)</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { month: 'Jun', value: 125 },
                      { month: 'Jul', value: 142 },
                      { month: 'Aug', value: 138 },
                      { month: 'Sep', value: 165 },
                      { month: 'Oct', value: 178 },
                      { month: 'Nov', value: 195 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `£${value}K`} />
                    <Bar dataKey="value" fill="#198754" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Fulfillment Status</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: 22, color: '#198754' },
                        { name: 'In Progress', value: 8, color: '#0d6efd' },
                        { name: 'Pending', value: 5, color: '#ffc107' }
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
                        { name: 'Completed', value: 22, color: '#198754' },
                        { name: 'In Progress', value: 8, color: '#0d6efd' },
                        { name: 'Pending', value: 5, color: '#ffc107' }
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
                <h6 className="fw-bold mb-3">Orders by Priority</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { priority: 'High', count: 12 },
                      { priority: 'Medium', count: 15 },
                      { priority: 'Low', count: 8 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#dc3545" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
          </>
        )}

        {/* Orders Filter Bar */}
        <FilterBar
          quickFilters={[
            { id: 'all', label: 'All Orders', count: 35, color: '#6c757d', activeColor: '#0d6efd', icon: <ShoppingCart size={16} /> },
            { id: 'pending-approval', label: 'Pending Approval', count: 5, color: '#ffc107', activeColor: '#0d6efd', icon: <AlertTriangle size={16} /> },
            { id: 'in-progress', label: 'In Progress', count: 8, color: '#0dcaf0', activeColor: '#0d6efd', icon: <RefreshCw size={16} /> },
            { id: 'delivered', label: 'Delivered', count: 22, color: '#198754', activeColor: '#0d6efd', icon: <CheckCircle size={16} /> },
            { id: 'high-priority', label: 'High Priority', count: 12, color: '#dc3545', activeColor: '#0d6efd', icon: <Star size={16} /> }
          ]}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => setActiveFilter(filterId)}
          searchValue={ordersSearch}
          onSearchChange={(value) => setOrdersSearch(value)}
          onSearch={() => console.log('Searching orders:', ordersSearch)}
          searchPlaceholder="Search orders by ID, deal name..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={
            ordersFilters.stage.length +
            ordersFilters.approvalStatus.length +
            ordersFilters.priority.length +
            ordersFilters.fulfillmentStatus.length +
            ordersFilters.billingStatus.length
          }
        />

        {/* Orders Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Stage</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Quote', label: 'Quote' },
                      { value: 'Proposal', label: 'Proposal' },
                      { value: 'Contract', label: 'Contract' },
                      { value: 'Active', label: 'Active' },
                      { value: 'Fulfilled', label: 'Fulfilled' }
                    ]}
                    value={ordersFilters.stage.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        stage: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select stages..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Approval Status</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Approved', label: 'Approved' },
                      { value: 'Rejected', label: 'Rejected' }
                    ]}
                    value={ordersFilters.approvalStatus.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        approvalStatus: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select status..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Priority</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'High', label: 'High' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'Low', label: 'Low' }
                    ]}
                    value={ordersFilters.priority.map(p => ({ value: p, label: p }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        priority: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select priority..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Fulfillment Status</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Pending', label: 'Pending' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Completed', label: 'Completed' }
                    ]}
                    value={ordersFilters.fulfillmentStatus.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        fulfillmentStatus: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select status..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Billing Status</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Paid', label: 'Paid' },
                      { value: 'Partially Paid', label: 'Partially Paid' }
                    ]}
                    value={ordersFilters.billingStatus.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        billingStatus: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select status..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary" 
                      
                      className="flex-grow-1"
                      onClick={() => {
                        // Apply filters - they are already applied in real-time
                        console.log('Applying orders filters');
                      }}
                    >
                      Apply
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      
                      onClick={() => {
                        setOrdersFilters({
                          stage: [],
                          approvalStatus: [],
                          priority: [],
                          fulfillmentStatus: [],
                          billingStatus: []
                        });
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

        {/* Bulk Actions and Column Customization - Orders */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          {/* Bulk Actions Dropdown - Only show when items are selected */}
          {selectedOrders.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <CheckSquare size={16} className="me-2" />
                Bulk Actions ({selectedOrders.length})
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item 
                  onClick={() => {
                    setConfirmAction({
                      type: 'delete',
                      data: { 
                        itemType: 'Orders', 
                        name: `${selectedOrders.length} selected orders`,
                        count: selectedOrders.length
                      }
                    });
                    setShowConfirmDialog(true);
                  }}
                  className="d-flex align-items-center text-danger"
                >
                  <Trash2 size={14} className="me-2" />
                  Delete Selected ({selectedOrders.length})
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
            <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[
                { key: 'orderId', label: 'Order ID' },
                { key: 'linkedDeal', label: 'Linked Deal' },
                { key: 'customer', label: 'Customer (POC)' },
                { key: 'value', label: 'Value' },
                { key: 'approval', label: 'Approval' },
                { key: 'stage', label: 'Stage' },
                { key: 'fulfillment', label: 'Fulfillment' },
                { key: 'progress', label: 'Progress' },
                { key: 'priority', label: 'Priority' },
                { key: 'orderDate', label: 'Order Date' }
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedOrdersColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrdersColumns([...selectedOrdersColumns, col.key]);
                      } else {
                        setSelectedOrdersColumns(selectedOrdersColumns.filter(c => c !== col.key));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setSelectedOrdersColumns(['orderId', 'linkedDeal', 'customer', 'value', 'approval', 'stage', 'fulfillment', 'progress', 'priority', 'orderDate'])}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setSelectedOrdersColumns(['orderId', 'linkedDeal', 'customer', 'value', 'approval', 'stage', 'fulfillment', 'progress', 'priority', 'orderDate']);
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Orders Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {/* <div className="d-flex justify-content-between align-items-center mb-3 px-3 pt-3">
              <h5 className="mb-0 fw-bold">Orders List</h5>
              <div className="d-flex gap-2">
                <Button variant="outline-success" size="sm">
                  <Download size={16} className="me-1" />
                  Export
                </Button>
              </div>
            </div> */}
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        checked={(() => {
                          let filteredOrders = ordersData.filter(order => {
                            if (activeFilter === 'pending-approval') {
                              if (order.approvalStatus !== 'Pending') return false;
                            } else if (activeFilter === 'in-progress') {
                              if (order.fulfillmentStatus !== 'In Progress') return false;
                            } else if (activeFilter === 'delivered') {
                              if (order.fulfillmentStatus !== 'Completed') return false;
                            } else if (activeFilter === 'high-priority') {
                              if (order.priority !== 'High' && order.priority !== 'Urgent') return false;
                            }
                            
                            const searchLower = ordersSearch.toLowerCase();
                            const matchesSearch = !ordersSearch || 
                              order.id.toLowerCase().includes(searchLower) ||
                              order.linkedDeal.toLowerCase().includes(searchLower) ||
                              order.pocName.toLowerCase().includes(searchLower);
                            
                            const matchesStage = ordersFilters.stage.length === 0 || 
                              ordersFilters.stage.includes(order.stage);
                            const matchesApproval = ordersFilters.approvalStatus.length === 0 || 
                              ordersFilters.approvalStatus.includes(order.approvalStatus);
                            const matchesPriority = ordersFilters.priority.length === 0 || 
                              ordersFilters.priority.includes(order.priority);
                            const matchesFulfillment = ordersFilters.fulfillmentStatus.length === 0 || 
                              ordersFilters.fulfillmentStatus.includes(order.fulfillmentStatus);
                            const matchesBilling = ordersFilters.billingStatus.length === 0 || 
                              ordersFilters.billingStatus.includes(order.billingStatus);
                            
                            return matchesSearch && matchesStage && matchesApproval && 
                              matchesPriority && matchesFulfillment && matchesBilling;
                          });
                          
                          const sorted = sortData(filteredOrders, ordersPagination.sortColumn, ordersPagination.sortDirection);
                          const paginated = paginateData(sorted, ordersPagination.currentPage, ordersPagination.rowsPerPage);
                          return paginated.length > 0 && paginated.every((order: any) => selectedOrders.includes(order.id));
                        })()}
                        onChange={(e) => {
                          let filteredOrders = ordersData.filter(order => {
                            if (activeFilter === 'pending-approval') {
                              if (order.approvalStatus !== 'Pending') return false;
                            } else if (activeFilter === 'in-progress') {
                              if (order.fulfillmentStatus !== 'In Progress') return false;
                            } else if (activeFilter === 'delivered') {
                              if (order.fulfillmentStatus !== 'Completed') return false;
                            } else if (activeFilter === 'high-priority') {
                              if (order.priority !== 'High' && order.priority !== 'Urgent') return false;
                            }
                            
                            const searchLower = ordersSearch.toLowerCase();
                            const matchesSearch = !ordersSearch || 
                              order.id.toLowerCase().includes(searchLower) ||
                              order.linkedDeal.toLowerCase().includes(searchLower) ||
                              order.pocName.toLowerCase().includes(searchLower);
                            
                            const matchesStage = ordersFilters.stage.length === 0 || 
                              ordersFilters.stage.includes(order.stage);
                            const matchesApproval = ordersFilters.approvalStatus.length === 0 || 
                              ordersFilters.approvalStatus.includes(order.approvalStatus);
                            const matchesPriority = ordersFilters.priority.length === 0 || 
                              ordersFilters.priority.includes(order.priority);
                            const matchesFulfillment = ordersFilters.fulfillmentStatus.length === 0 || 
                              ordersFilters.fulfillmentStatus.includes(order.fulfillmentStatus);
                            const matchesBilling = ordersFilters.billingStatus.length === 0 || 
                              ordersFilters.billingStatus.includes(order.billingStatus);
                            
                            return matchesSearch && matchesStage && matchesApproval && 
                              matchesPriority && matchesFulfillment && matchesBilling;
                          });
                          
                          const sorted = sortData(filteredOrders, ordersPagination.sortColumn, ordersPagination.sortDirection);
                          const paginated = paginateData(sorted, ordersPagination.currentPage, ordersPagination.rowsPerPage);
                          
                          if (e.target.checked) {
                            const newIds = paginated.map((order: any) => order.id).filter((id: string) => !selectedOrders.includes(id));
                            setSelectedOrders([...selectedOrders, ...newIds]);
                          } else {
                            const paginatedIds = paginated.map((order: any) => order.id);
                            setSelectedOrders(selectedOrders.filter(id => !paginatedIds.includes(id)));
                          }
                        }}
                      />
                    </th>
                  {selectedOrdersColumns.includes('orderId') && <th>Order ID</th>}
                  {selectedOrdersColumns.includes('linkedDeal') && <th>Linked Deal</th>}
                  {selectedOrdersColumns.includes('customer') && <th>Customer (POC)</th>}
                  {selectedOrdersColumns.includes('value') && <th>Value</th>}
                  {selectedOrdersColumns.includes('approval') && <th>Approval</th>}
                  {selectedOrdersColumns.includes('stage') && <th>Stage</th>}
                  {selectedOrdersColumns.includes('fulfillment') && <th>Fulfillment</th>}
                  {selectedOrdersColumns.includes('progress') && <th>Progress</th>}
                  {selectedOrdersColumns.includes('priority') && <th>Priority</th>}
                  {selectedOrdersColumns.includes('orderDate') && <th>Order Date</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Filter orders based on active filter, search, and advanced filters
                  let filteredOrders = ordersData.filter(order => {
                    // Quick filters
                    if (activeFilter === 'pending-approval') {
                      if (order.approvalStatus !== 'Pending') return false;
                    } else if (activeFilter === 'in-progress') {
                      if (order.fulfillmentStatus !== 'In Progress') return false;
                    } else if (activeFilter === 'delivered') {
                      if (order.fulfillmentStatus !== 'Completed') return false;
                    } else if (activeFilter === 'high-priority') {
                      if (order.priority !== 'High' && order.priority !== 'Urgent') return false;
                    }
                    
                    // Search filter
                    const searchLower = ordersSearch.toLowerCase();
                    const matchesSearch = !ordersSearch || 
                      order.id.toLowerCase().includes(searchLower) ||
                      order.linkedDeal.toLowerCase().includes(searchLower) ||
                      order.pocName.toLowerCase().includes(searchLower);
                    
                    // Advanced filters
                    const matchesStage = ordersFilters.stage.length === 0 || 
                      ordersFilters.stage.includes(order.stage);
                    const matchesApproval = ordersFilters.approvalStatus.length === 0 || 
                      ordersFilters.approvalStatus.includes(order.approvalStatus);
                    const matchesPriority = ordersFilters.priority.length === 0 || 
                      ordersFilters.priority.includes(order.priority);
                    const matchesFulfillment = ordersFilters.fulfillmentStatus.length === 0 || 
                      ordersFilters.fulfillmentStatus.includes(order.fulfillmentStatus);
                    const matchesBilling = ordersFilters.billingStatus.length === 0 || 
                      ordersFilters.billingStatus.includes(order.billingStatus);
                    
                    return matchesSearch && matchesStage && matchesApproval && 
                      matchesPriority && matchesFulfillment && matchesBilling;
                  });
                  
                  const sorted = sortData(filteredOrders, ordersPagination.sortColumn, ordersPagination.sortDirection);
                  const paginated = paginateData(sorted, ordersPagination.currentPage, ordersPagination.rowsPerPage);
                  
                  if (filteredOrders.length === 0) {
                    return (
                      <tr>
                        <td colSpan={selectedOrdersColumns.length + 2} className="text-center py-4 text-muted">
                          No orders found matching your criteria
                        </td>
                      </tr>
                    );
                  }
                  
                  return paginated.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders([...selectedOrders, order.id]);
                            } else {
                              setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                            }
                          }}
                        />
                      </td>
                      {selectedOrdersColumns.includes('orderId') && (
                        <td className="fw-semibold">{order.id}</td>
                      )}
                      {selectedOrdersColumns.includes('linkedDeal') && (
                        <td>
                          <div>
                            <div className="fw-medium">{order.linkedDeal}</div>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none small">
                              <Eye size={12} className="me-1" />
                              View Deal
                            </Button>
                          </div>
                        </td>
                      )}
                      {selectedOrdersColumns.includes('customer') && (
                        <td>
                          <div>
                            <div className="fw-medium">{order.pocName}</div>
                            <small className="text-muted">{order.pocTitle}</small>
                          </div>
                        </td>
                      )}
                      {selectedOrdersColumns.includes('value') && (
                        <td className="fw-semibold">{order.value}</td>
                      )}
                      {selectedOrdersColumns.includes('approval') && (
                        <td>
                          <Badge 
                            bg={
                              order.approvalStatus === 'Approved' ? 'success' :
                              order.approvalStatus === 'Rejected' ? 'danger' :
                              'warning'
                            }
                          >
                            {order.approvalStatus}
                          </Badge>
                        </td>
                      )}
                      {selectedOrdersColumns.includes('stage') && (
                        <td>
                          <Badge bg="info">
                            {order.stage}
                          </Badge>
                        </td>
                      )}
                      {selectedOrdersColumns.includes('fulfillment') && (
                        <td>
                          <Badge 
                            bg={
                              order.fulfillmentStatus === 'In Progress' ? 'primary' :
                              order.fulfillmentStatus === 'Completed' ? 'success' :
                              'secondary'
                            }
                          >
                            {order.fulfillmentStatus}
                          </Badge>
                        </td>
                      )}
                      {selectedOrdersColumns.includes('progress') && (
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <ProgressBar 
                              now={order.progressPercent} 
                              style={{ width: '60px', height: '8px' }}
                            />
                            <small>{order.progressPercent}%</small>
                          </div>
                        </td>
                      )}
                      {selectedOrdersColumns.includes('priority') && (
                        <td>
                          <Badge 
                            bg={
                              order.priority === 'Urgent' ? 'danger' :
                              order.priority === 'High' ? 'warning' :
                              order.priority === 'Medium' ? 'info' :
                              'secondary'
                            }
                          >
                            {order.priority}
                          </Badge>
                        </td>
                      )}
                      {selectedOrdersColumns.includes('orderDate') && (
                        <td>{order.orderDate}</td>
                      )}
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1" 
                            title="View"
                            onClick={() => {
                              setViewingOrder(order);
                              setShowOrderViewModal(true);
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1" 
                            title="Edit"
                            onClick={() => {
                              setEditingOrder(order);
                              setShowOrderFormModal(true);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-1 text-danger" 
                          title="Delete"
                          onClick={() => {
                            setConfirmAction({
                              type: 'delete',
                              data: { ...order, itemType: 'Order' }
                            });
                            setShowConfirmDialog(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </Table>
            </div>
            <div className="p-3">
            {(() => {
              let filteredOrders = ordersData.filter(order => {
                if (activeFilter === 'pending-approval') {
                  if (order.approvalStatus !== 'Pending') return false;
                } else if (activeFilter === 'in-progress') {
                  if (order.fulfillmentStatus !== 'In Progress') return false;
                } else if (activeFilter === 'delivered') {
                  if (order.fulfillmentStatus !== 'Completed') return false;
                } else if (activeFilter === 'high-priority') {
                  if (order.priority !== 'High' && order.priority !== 'Urgent') return false;
                }
                
                const searchLower = ordersSearch.toLowerCase();
                const matchesSearch = !ordersSearch || 
                  order.id.toLowerCase().includes(searchLower) ||
                  order.linkedDeal.toLowerCase().includes(searchLower) ||
                  order.pocName.toLowerCase().includes(searchLower);
                
                const matchesStage = ordersFilters.stage.length === 0 || 
                  ordersFilters.stage.includes(order.stage);
                const matchesApproval = ordersFilters.approvalStatus.length === 0 || 
                  ordersFilters.approvalStatus.includes(order.approvalStatus);
                const matchesPriority = ordersFilters.priority.length === 0 || 
                  ordersFilters.priority.includes(order.priority);
                const matchesFulfillment = ordersFilters.fulfillmentStatus.length === 0 || 
                  ordersFilters.fulfillmentStatus.includes(order.fulfillmentStatus);
                const matchesBilling = ordersFilters.billingStatus.length === 0 || 
                  ordersFilters.billingStatus.includes(order.billingStatus);
                
                return matchesSearch && matchesStage && matchesApproval && 
                  matchesPriority && matchesFulfillment && matchesBilling;
              });
              
              return renderPaginationControls(filteredOrders.length, ordersPagination, setOrdersPagination, 'orders');
            })()}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Campaigns Screen
  const renderCampaigns = () => {
    const campaignKPIData: KPICardData[] = [
      { title: 'Total Campaigns', value: '15', change: '**1** new this week', isPositive: true, icon: <Megaphone size={24} />, color: 'primary' },
      { title: 'Active Campaigns', value: '3', change: '**+1** from last month', isPositive: true, icon: <TrendingUp size={24} />, color: 'success' },
      { title: 'Awaiting Review', value: '2', change: '**Action Required**', isPositive: false, icon: <AlertCircle size={24} />, color: 'warning' },
      { title: 'Missing Goal Metric', value: '1', change: '**Incomplete Setup**', isPositive: false, icon: <Target size={24} />, color: 'danger' }
    ];

    const campaigns = [
      { 
        id: 1, 
        name: 'Cloud Services Q3 Retargeting', 
        description: 'Retargeting old leads that showed interest in our cloud-based calling services during Q3.',
        owner: 'Sarah Williams',
        ownerInitials: 'SW',
        tags: ['Retargeting', 'Cloud', 'Q3'],
        status: 'Active',
        goalMetric: '5%',
        goalLabel: 'Conversion Rate',
        dateRange: '20/10/2025 - 01/11/2025',
        created: '10/10/2025',
        comments: 3,
        priority: 'High'
      },
      { 
        id: 2, 
        name: 'UAE Real Estate Acquisition Drive', 
        description: 'Targeted campaign focused on reaching potential clients in the UAE real estate market.',
        owner: 'John Doe',
        ownerInitials: 'JD',
        tags: ['Real Estate', 'UAE', 'Acquisition'],
        status: 'Active',
        goalMetric: '10%',
        goalLabel: 'Response Rate',
        dateRange: '02/10/2025 - 04/10/2025',
        created: '28/09/2025',
        comments: 0,
        priority: 'Medium'
      },
      { 
        id: 3, 
        name: 'Q4 Reseller Onboarding Promo', 
        description: 'Promotional campaign to onboard new high-volume resellers before the end of the year.',
        owner: 'Mike Johnson',
        ownerInitials: 'MJ',
        tags: ['Reseller', 'Q4', 'Onboarding'],
        status: 'Draft',
        goalMetric: '--',
        goalLabel: 'MISSING DATA',
        dateRange: '10/11/2025 - TBD',
        created: '20/09/2025',
        comments: 1,
        priority: 'High'
      },
      { 
        id: 4, 
        name: 'Annual Customer Loyalty Check', 
        description: 'An annual check-in campaign targeting existing customers with high usage.',
        owner: 'Jane Smith',
        ownerInitials: 'JS',
        tags: ['Loyalty', 'Retention'],
        status: 'Completed',
        goalMetric: '90%',
        goalLabel: 'Retention Rate',
        dateRange: '01/08/2025 - 01/09/2025',
        created: '15/07/2025',
        comments: 0,
        priority: 'Low'
      }
    ];

    return (
      <div>
        {/* Add New Campaign Modal */}
        <Modal 
          show={showCampaignModal} 
          onHide={() => {
            setShowCampaignModal(false);
            setEditingCampaign(null);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{editingCampaign ? 'Edit Campaign' : 'Add New Campaign'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Campaign Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter campaign name"
                      value={campaignFormData.name}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, name: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter campaign description"
                      value={campaignFormData.description}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, description: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Owner <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={campaignFormData.owner}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, owner: e.target.value })}
                    >
                      <option value="">Select owner</option>
                      <option value="Sarah Williams">Sarah Williams</option>
                      <option value="John Doe">John Doe</option>
                      <option value="Mike Johnson">Mike Johnson</option>
                      <option value="Jane Smith">Jane Smith</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={campaignFormData.status}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, status: e.target.value })}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Awaiting Review">Awaiting Review</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      value={campaignFormData.startDate}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, startDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      value={campaignFormData.endDate}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, endDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Created Date</Form.Label>
                    <Form.Control
                      type="text"
                      value={campaignFormData.created}
                      disabled
                      className="bg-light"
                    />
                    <Form.Text className="text-muted">
                      This field is automatically set to today's date
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setShowCampaignModal(false);
                setEditingCampaign(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                // Validation
                if (!campaignFormData.name || !campaignFormData.owner || !campaignFormData.status || !campaignFormData.startDate || !campaignFormData.endDate) {
                  alert('Please fill in all required fields');
                  return;
                }
                
                // Here you would typically save the campaign to your backend
                console.log('Saving campaign:', campaignFormData);
                
                setShowCampaignModal(false);
                setEditingCampaign(null);
              }}
            >
              {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </Modal.Footer>
        </Modal>

        {CampaignViewModal()}
        {ConfirmationDialog()}
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1">Campaigns Management</h2>
            <p className="text-muted mb-0">Create and manage marketing campaigns</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button 
              variant={showCampaignsAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowCampaignsAnalytics(!showCampaignsAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showCampaignsAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                setEditingCampaign(null);
                setCampaignFormData({
                  name: '',
                  description: '',
                  owner: '',
                  status: 'Draft',
                  startDate: '',
                  endDate: '',
                  created: new Date().toLocaleDateString('en-GB')
                });
                setShowCampaignModal(true);
              }}
            >
              <Plus size={16} className="me-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Analytics Section - Collapsible */}
        {showCampaignsAnalytics && (
          <>
            {/* KPI Cards */}
            <Row className="mb-4">
          {campaignKPIData.map((kpi, index) => (
            <Col lg={3} md={6} key={index} className="mb-3">
              <KPICard {...kpi} />
            </Col>
          ))}
        </Row>

        {/* Analytics Charts */}
        <Row className="mb-4">
          <Col md={4} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Campaign Status Distribution</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: 3, color: '#198754' },
                        { name: 'Draft', value: 2, color: '#6c757d' },
                        { name: 'Completed', value: 1, color: '#0d6efd' },
                        { name: 'Awaiting Review', value: 2, color: '#ffc107' }
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
                        { name: 'Active', value: 3, color: '#198754' },
                        { name: 'Draft', value: 2, color: '#6c757d' },
                        { name: 'Completed', value: 1, color: '#0d6efd' },
                        { name: 'Awaiting Review', value: 2, color: '#ffc107' }
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
          <Col md={4} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Goal Achievement Rates</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { campaign: 'Cloud Services', achievement: 78 },
                      { campaign: 'UAE Real Estate', achievement: 92 },
                      { campaign: 'Reseller Promo', achievement: 45 },
                      { campaign: 'Customer Loyalty', achievement: 95 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="campaign" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="achievement" fill="#198754" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Campaigns by Owner</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Sarah W.', value: 4, color: '#0d6efd' },
                        { name: 'John Doe', value: 3, color: '#6f42c1' },
                        { name: 'Mike J.', value: 2, color: '#fd7e14' },
                        { name: 'Jane S.', value: 2, color: '#20c997' }
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
                        { name: 'Sarah W.', value: 4, color: '#0d6efd' },
                        { name: 'John Doe', value: 3, color: '#6f42c1' },
                        { name: 'Mike J.', value: 2, color: '#fd7e14' },
                        { name: 'Jane S.', value: 2, color: '#20c997' }
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
        </Row>
        </>
        )}

       
       {/* campaign filters if required here */}

        {/* Bulk Actions Bar */}
        {/* {selectedCampaigns.length > 0 && (
          <Card className="mb-4 border-0" style={{ backgroundColor: '#0d6efd' }}>
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center text-white">
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle size={20} />
                  <strong>**{selectedCampaigns.length}** Campaigns Selected</strong>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="light" size="sm">
                    <Clock size={14} className="me-1" />
                    Pause Selected
                  </Button>
                  <Button variant="light" size="sm">
                    <Package size={14} className="me-1" />
                    Archive
                  </Button>
                  <Button variant="danger" size="sm">
                    <Trash2 size={14} className="me-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        )} */}
        

        {/* Campaigns Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="d-flex justify-content-between align-items-center mb-3 px-3 pt-3">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">Manage your campaigns</span>
              </div>
              <div className="d-flex gap-2">
                {/* Bulk Actions Dropdown */}
                {selectedCampaigns.length > 0 && (
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-primary" size="sm">
                      <CheckSquare size={16} className="me-2" />
                      Bulk Actions ({selectedCampaigns.length})
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                      {/* <Dropdown.Item 
                        onClick={() => {
                          console.log('Pausing campaigns:', selectedCampaigns);
                          // Add pause logic here
                        }}
                        className="d-flex align-items-center"
                      >
                        <Clock size={14} className="me-2" />
                        Pause Selected ({selectedCampaigns.length})
                      </Dropdown.Item> */}
                      {/* <Dropdown.Item 
                        onClick={() => {
                          console.log('Archiving campaigns:', selectedCampaigns);
                          // Add archive logic here
                        }}
                        className="d-flex align-items-center"
                      >
                        <Package size={14} className="me-2" />
                        Archive Selected ({selectedCampaigns.length})
                      </Dropdown.Item> */}
                      <Dropdown.Divider />
                      <Dropdown.Item 
                        onClick={() => {
                          setConfirmAction({
                            type: 'delete',
                            data: { 
                              itemType: 'Campaigns', 
                              name: `${selectedCampaigns.length} selected campaigns`,
                              count: selectedCampaigns.length
                            }
                          });
                          setShowConfirmDialog(true);
                        }}
                        className="d-flex align-items-center text-danger"
                      >
                        <Trash2 size={14} className="me-2" />
                        Delete Selected ({selectedCampaigns.length})
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
                  <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {[
                      { key: 'campaignName', label: 'Campaign Name' },
                      { key: 'owner', label: 'Owner' },
                      { key: 'status', label: 'Status' },
                      { key: 'dateRange', label: 'Date Range' },
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
                    <Dropdown.Item onClick={() => setSelectedCampaignsColumns(['campaignName', 'owner', 'status', 'dateRange', 'created'])}>
                      Select All
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      setSelectedCampaignsColumns(['campaignName', 'owner', 'status', 'dateRange', 'created']);
                    }}>
                      Reset to Default
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>

            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        checked={(() => {
                          let filteredCampaigns = campaigns.filter(campaign => {
                            // Quick filters
                            if (activeFilter === 'my') return campaign.owner === 'Sarah Williams';
                            if (activeFilter === 'drafts') return campaign.status === 'Draft';
                            if (activeFilter === 'ending-soon') return campaign.id === 1;
                            if (activeFilter === 'no-owner') return !campaign.owner;
                            if (activeFilter === 'high-priority') return campaign.priority === 'High';
                            
                            // Search filter
                            const searchLower = campaignsSearch.toLowerCase();
                            const matchesSearch = !campaignsSearch || 
                              campaign.name.toLowerCase().includes(searchLower) ||
                              campaign.description.toLowerCase().includes(searchLower) ||
                              campaign.owner.toLowerCase().includes(searchLower);
                            
                            // Advanced filters
                            if (campaignFilters.status.length > 0 && !campaignFilters.status.includes(campaign.status)) return false;
                            if (campaignFilters.owner.length > 0 && !campaignFilters.owner.includes(campaign.owner)) return false;
                            if (campaignFilters.priority.length > 0 && !campaignFilters.priority.includes(campaign.priority)) return false;
                            
                            return matchesSearch;
                          });
                          
                          const sorted = sortData(filteredCampaigns, campaignsPagination.sortColumn, campaignsPagination.sortDirection);
                          const paginated = paginateData(sorted, campaignsPagination.currentPage, campaignsPagination.rowsPerPage);
                          return paginated.length > 0 && paginated.every((campaign: any) => selectedCampaigns.includes(campaign.id));
                        })()}
                        onChange={(e) => {
                          let filteredCampaigns = campaigns.filter(campaign => {
                            // Quick filters
                            if (activeFilter === 'my') return campaign.owner === 'Sarah Williams';
                            if (activeFilter === 'drafts') return campaign.status === 'Draft';
                            if (activeFilter === 'ending-soon') return campaign.id === 1;
                            if (activeFilter === 'no-owner') return !campaign.owner;
                            if (activeFilter === 'high-priority') return campaign.priority === 'High';
                            
                            // Search filter
                            const searchLower = campaignsSearch.toLowerCase();
                            const matchesSearch = !campaignsSearch || 
                              campaign.name.toLowerCase().includes(searchLower) ||
                              campaign.description.toLowerCase().includes(searchLower) ||
                              campaign.owner.toLowerCase().includes(searchLower);
                            
                            // Advanced filters
                            if (campaignFilters.status.length > 0 && !campaignFilters.status.includes(campaign.status)) return false;
                            if (campaignFilters.owner.length > 0 && !campaignFilters.owner.includes(campaign.owner)) return false;
                            if (campaignFilters.priority.length > 0 && !campaignFilters.priority.includes(campaign.priority)) return false;
                            
                            return matchesSearch;
                          });
                          
                          const sorted = sortData(filteredCampaigns, campaignsPagination.sortColumn, campaignsPagination.sortDirection);
                          const paginated = paginateData(sorted, campaignsPagination.currentPage, campaignsPagination.rowsPerPage);
                          
                          if (e.target.checked) {
                            const newIds = paginated.map((campaign: any) => campaign.id).filter((id: number) => !selectedCampaigns.includes(id));
                            setSelectedCampaigns([...selectedCampaigns, ...newIds]);
                          } else {
                            const paginatedIds = paginated.map((campaign: any) => campaign.id);
                            setSelectedCampaigns(selectedCampaigns.filter(id => !paginatedIds.includes(id)));
                          }
                        }}
                      />
                    </th>
                    {selectedCampaignsColumns.includes('campaignName') && <th>Campaign Name</th>}
                    {selectedCampaignsColumns.includes('owner') && <th>Owner</th>}
                    {selectedCampaignsColumns.includes('status') && <th>Status</th>}
                    {selectedCampaignsColumns.includes('dateRange') && <th>Date Range</th>}
                    {selectedCampaignsColumns.includes('created') && <th>Created</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Filter campaigns based on active filter, search, and advanced filters
                    let filteredCampaigns = campaigns.filter(campaign => {
                      // Quick filters
                      if (activeFilter === 'my') return campaign.owner === 'Sarah Williams';
                      if (activeFilter === 'drafts') return campaign.status === 'Draft';
                      if (activeFilter === 'ending-soon') return campaign.id === 1;
                      if (activeFilter === 'no-owner') return !campaign.owner;
                      if (activeFilter === 'high-priority') return campaign.priority === 'High';
                      
                      // Search filter
                      const searchLower = campaignsSearch.toLowerCase();
                      const matchesSearch = !campaignsSearch || 
                        campaign.name.toLowerCase().includes(searchLower) ||
                        campaign.description.toLowerCase().includes(searchLower) ||
                        campaign.owner.toLowerCase().includes(searchLower);
                      
                      // Advanced filters
                      if (campaignFilters.status.length > 0 && !campaignFilters.status.includes(campaign.status)) return false;
                      if (campaignFilters.owner.length > 0 && !campaignFilters.owner.includes(campaign.owner)) return false;
                      if (campaignFilters.priority.length > 0 && !campaignFilters.priority.includes(campaign.priority)) return false;
                      
                      return matchesSearch;
                    });
                    
                    const sorted = sortData(filteredCampaigns, campaignsPagination.sortColumn, campaignsPagination.sortDirection);
                    const paginated = paginateData(sorted, campaignsPagination.currentPage, campaignsPagination.rowsPerPage);
                    
                    if (filteredCampaigns.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="text-center py-4 text-muted">
                            No campaigns found matching your criteria
                          </td>
                        </tr>
                      );
                    }
                    
                    return paginated.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedCampaigns.includes(campaign.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCampaigns([...selectedCampaigns, campaign.id]);
                            } else {
                              setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaign.id));
                            }
                          }}
                        />
                      </td>
                      {selectedCampaignsColumns.includes('campaignName') && (
                        <td>
                        <div>
                          <div className="fw-semibold">
                            {campaign.name}
                          </div>
                          <div className="small text-muted mt-1">{campaign.description}</div>
                        </div>
                      </td>
                      )}
                      {selectedCampaignsColumns.includes('owner') && (
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div 
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                              style={{ width: '32px', height: '32px', fontSize: '0.75rem', fontWeight: '600' }}
                            >
                              {campaign.ownerInitials}
                            </div>
                            <span className="small">{campaign.owner}</span>
                          </div>
                        </td>
                      )}
                      {selectedCampaignsColumns.includes('status') && (
                        <td>
                          <Badge 
                            bg={
                              campaign.status === 'Active' ? 'success' :
                              campaign.status === 'Draft' ? 'primary' :
                              campaign.status === 'Completed' ? 'secondary' :
                              'warning'
                            }
                            className="bg-opacity-10 text-dark"
                          >
                            {campaign.status}
                          </Badge>
                        </td>
                      )}
                      {selectedCampaignsColumns.includes('dateRange') && (
                        <td>
                          <div>
                            <div className="fw-semibold small">{campaign.dateRange.split(' - ')[0]}</div>
                            <small className="text-muted">
                              {campaign.status === 'Completed' ? 'Ended' : campaign.status === 'Draft' ? 'Starts' : 'Ends'}: {campaign.dateRange.split(' - ')[1]}
                            </small>
                          </div>
                        </td>
                      )}
                      {selectedCampaignsColumns.includes('created') && (
                        <td>
                          <small className="text-muted">{campaign.created}</small>
                        </td>
                      )}
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1"
                            onClick={() => {
                              setViewingCampaign(campaign);
                              setShowCampaignViewModal(true);
                            }}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-primary"
                            onClick={() => {
                              setEditingCampaign(campaign);
                              setCampaignFormData({
                                name: campaign.name,
                                description: campaign.description,
                                owner: campaign.owner,
                                status: campaign.status,
                                startDate: campaign.dateRange.split(' - ')[0].split('/').reverse().join('-'),
                                endDate: campaign.dateRange.split(' - ')[1].split('/').reverse().join('-'),
                                created: campaign.created
                              });
                              setShowCampaignModal(true);
                            }}
                            title="Edit Campaign"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-danger"
                            onClick={() => {
                              setConfirmAction({
                                type: 'delete',
                                data: { ...campaign, itemType: 'Campaign' }
                              });
                              setShowConfirmDialog(true);
                            }}
                            title="Delete Campaign"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    ));
                  })()}
                </tbody>
              </Table>
            </div>

            <div className="p-3">
              {(() => {
                let filteredCampaigns = campaigns.filter(campaign => {
                  // Quick filters
                  if (activeFilter === 'my') return campaign.owner === 'Sarah Williams';
                  if (activeFilter === 'drafts') return campaign.status === 'Draft';
                  if (activeFilter === 'ending-soon') return campaign.id === 1;
                  if (activeFilter === 'no-owner') return !campaign.owner;
                  if (activeFilter === 'high-priority') return campaign.priority === 'High';
                  
                  // Search filter
                  const searchLower = campaignsSearch.toLowerCase();
                  const matchesSearch = !campaignsSearch || 
                    campaign.name.toLowerCase().includes(searchLower) ||
                    campaign.description.toLowerCase().includes(searchLower) ||
                    campaign.owner.toLowerCase().includes(searchLower);
                  
                  // Advanced filters
                  if (campaignFilters.status.length > 0 && !campaignFilters.status.includes(campaign.status)) return false;
                  if (campaignFilters.owner.length > 0 && !campaignFilters.owner.includes(campaign.owner)) return false;
                  if (campaignFilters.priority.length > 0 && !campaignFilters.priority.includes(campaign.priority)) return false;
                  
                  return matchesSearch;
                });
                
                return renderPaginationControls(filteredCampaigns.length, campaignsPagination, setCampaignsPagination, 'campaigns');
              })()}
            </div>
            <div className="d-none d-flex justify-content-between align-items-center p-4 border-top">
              <div className="small text-muted">
                Showing <strong>1 to 4</strong> of <strong>15</strong> total campaigns
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" disabled>
                  <ChevronLeft size={14} /> Previous
                </Button>
                <Button variant="outline-secondary" size="sm">
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Task Management Screen
  const renderTasks = () => {
    const tasksData = [
      {
        id: 1,
        title: 'Follow up with Tech Corp',
        assignedTo: 'John Doe',
        assignedBy: 'Manager One',
        prospect: 'John Smith',
        company: 'Tech Corp Ltd',
        phone: '+44 20 1234 5678',
        email: 'john@company.com',
        urgency: 'High',
        status: 'In Progress',
        dueDate: '2025-11-20',
        dateAssigned: '2025-11-15',
        notes: 'Discuss enterprise package pricing',
        history: [
          { date: '2025-11-15', action: 'Task Created', user: 'Manager One' },
          { date: '2025-11-16', action: 'Task Started', user: 'John Doe' },
          { date: '2025-11-17', action: 'Initial Contact Made', user: 'John Doe' }
        ]
      },
      {
        id: 2,
        title: 'Send proposal to Digital Inc',
        assignedTo: 'Jane Smith',
        assignedBy: 'Manager Two',
        prospect: 'Emily Brown',
        company: 'Startup Innovations',
        phone: '+44 20 9876 5432',
        email: 'emily@startup.io',
        urgency: 'Medium',
        status: 'Pending',
        dueDate: '2025-11-22',
        dateAssigned: '2025-11-18',
        notes: 'Prepare customized proposal with cloud migration options',
        history: [
          { date: '2025-11-18', action: 'Task Created', user: 'Manager Two' }
        ]
      },
      {
        id: 3,
        title: 'Schedule demo for Enterprise Solutions',
        assignedTo: 'Mike Johnson',
        assignedBy: 'Manager One',
        prospect: 'Robert Taylor',
        company: 'Enterprise Solutions',
        phone: '+44 161 234 5678',
        email: 'robert@enterprise.co.uk',
        urgency: 'High',
        status: 'Completed',
        dueDate: '2025-11-19',
        dateAssigned: '2025-11-14',
        notes: 'Demo completed successfully, moving to proposal stage',
        history: [
          { date: '2025-11-14', action: 'Task Created', user: 'Manager One' },
          { date: '2025-11-15', action: 'Demo Scheduled', user: 'Mike Johnson' },
          { date: '2025-11-19', action: 'Demo Completed', user: 'Mike Johnson' },
          { date: '2025-11-19', action: 'Task Completed', user: 'Mike Johnson' }
        ]
      }
    ];

    return (
      <div>
        {TaskModal()}
        {TaskViewModal()}
        {ConfirmationDialog()}
        {/* Task History Modal */}
        <Modal show={showTaskHistory} onHide={() => setShowTaskHistory(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Task History - {selectedTask?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedTask && (
              <>
                <div className="mb-4">
                  <Row>
                    <Col md={6}>
                      <p><strong>Assigned To:</strong> {selectedTask.assignedTo}</p>
                      <p><strong>Company:</strong> {selectedTask.company}</p>
                      <p><strong>Status:</strong> <Badge bg={
                        selectedTask.status === 'Completed' ? 'success' :
                        selectedTask.status === 'In Progress' ? 'info' :
                        'warning'
                      }>{selectedTask.status}</Badge></p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Urgency:</strong> <Badge bg={
                        selectedTask.urgency === 'High' ? 'danger' :
                        selectedTask.urgency === 'Medium' ? 'warning' :
                        'secondary'
                      }>{selectedTask.urgency}</Badge></p>
                      <p><strong>Due Date:</strong> {selectedTask.dueDate}</p>
                      <p><strong>Assigned By:</strong> {selectedTask.assignedBy}</p>
                    </Col>
                  </Row>
                  <p className="mb-0"><strong>Notes:</strong> {selectedTask.notes}</p>
                </div>

                <h6 className="fw-bold mb-3">Task History Timeline</h6>
                <div className="timeline">
                  {selectedTask.history?.map((entry: any, index: number) => (
                    <div key={index} className="d-flex mb-3">
                      <div className="me-3">
                        <div 
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#0d6efd',
                            marginTop: '6px'
                          }}
                        />
                        {index < selectedTask.history.length - 1 && (
                          <div 
                            style={{
                              width: '2px',
                              height: '40px',
                              backgroundColor: '#dee2e6',
                              marginLeft: '5px'
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1 fw-semibold">{entry.action}</p>
                        <small className="text-muted">
                          {entry.date} by {entry.user}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTaskHistory(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Task Management</h2>
            <p className="text-muted mb-0">Track and manage tasks with complete history logging</p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant={showTasksAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowTasksAnalytics(!showTasksAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showTasksAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            <Button variant="primary" onClick={() => setShowTaskModal(true)}>
              <Plus size={16} className="me-2" />
              Create Task
            </Button>
          </div>
        </div>

        {/* Analytics Section - Collapsible */}
        {showTasksAnalytics && (
          <>
            {/* Summary Stats */}
            <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Total Tasks"
              value={tasksData.length.toString()}
              icon={<CheckCircle size={24} />}
              color="primary"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="In Progress"
              value={tasksData.filter(t => t.status === 'In Progress').length.toString()}
              icon={<Activity size={24} />}
              color="info"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Completed"
              value={tasksData.filter(t => t.status === 'Completed').length.toString()}
              icon={<CheckCircle size={24} />}
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Pending"
              value={tasksData.filter(t => t.status === 'Pending').length.toString()}
              icon={<Clock size={24} />}
              color="warning"
            />
          </Col>
        </Row>

        {/* Analytics Charts */}
        <Row className="mb-4">
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Tasks by Status</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: 12, color: '#198754' },
                        { name: 'In Progress', value: 8, color: '#0dcaf0' },
                        { name: 'Pending', value: 6, color: '#ffc107' },
                        { name: 'Overdue', value: 3, color: '#dc3545' }
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
                        { name: 'Completed', value: 12, color: '#198754' },
                        { name: 'In Progress', value: 8, color: '#0dcaf0' },
                        { name: 'Pending', value: 6, color: '#ffc107' },
                        { name: 'Overdue', value: 3, color: '#dc3545' }
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
                <h6 className="fw-bold mb-3">Tasks by Urgency</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { urgency: 'High', count: 11 },
                      { urgency: 'Medium', count: 9 },
                      { urgency: 'Low', count: 9 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="urgency" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#dc3545" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Tasks by Assigned User</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { user: 'John Doe', count: 8 },
                      { user: 'Jane Smith', count: 7 },
                      { user: 'Mike J.', count: 6 },
                      { user: 'Sarah W.', count: 5 },
                      { user: 'Tom B.', count: 3 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="user" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d6efd" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Overdue Tasks by User</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    layout="vertical"
                    data={[
                      { user: 'John Doe', overdue: 1 },
                      { user: 'Mike Johnson', overdue: 1 },
                      { user: 'Sarah Williams', overdue: 1 },
                      { user: 'Jane Smith', overdue: 0 },
                      { user: 'Tom Brown', overdue: 0 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="user" width={100} />
                    <Tooltip />
                    <Bar dataKey="overdue" fill="#dc3545" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
          </>
        )}

        {/* Bulk Actions and Column Customization - Tasks */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          {/* Bulk Actions Dropdown - Only show when items are selected */}
          {selectedTasks.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <CheckSquare size={16} className="me-2" />
                Bulk Actions ({selectedTasks.length})
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item
                  onClick={() => {
                    console.log('Mark as completed:', selectedTasks);
                    // Add logic to mark selected tasks as completed
                  }}
                  className="d-flex align-items-center"
                >
                  <CheckCircle size={14} className="me-2" />
                  Mark as Completed
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    console.log('Change urgency:', selectedTasks);
                    // Add logic to change urgency
                  }}
                  className="d-flex align-items-center"
                >
                  <AlertCircle size={14} className="me-2" />
                  Change Urgency
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    console.log('Reassign tasks:', selectedTasks);
                    // Add logic to reassign tasks
                  }}
                  className="d-flex align-items-center"
                >
                  <User size={14} className="me-2" />
                  Reassign Tasks
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item 
                  onClick={() => {
                    setConfirmAction({
                      type: 'delete',
                      data: { 
                        itemType: 'Tasks', 
                        name: `${selectedTasks.length} selected tasks`,
                        count: selectedTasks.length
                      }
                    });
                    setShowConfirmDialog(true);
                  }}
                  className="d-flex align-items-center text-danger"
                >
                  <Trash2 size={14} className="me-2" />
                  Delete Selected ({selectedTasks.length})
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
            <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[
                { key: 'task', label: 'Task' },
                { key: 'assignedTo', label: 'Assigned To' },
                { key: 'contact', label: 'Contact' },
                { key: 'company', label: 'Company' },
                { key: 'urgency', label: 'Urgency' },
                { key: 'status', label: 'Status' },
                { key: 'dueDate', label: 'Due Date' }
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedTasksColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasksColumns([...selectedTasksColumns, col.key]);
                      } else {
                        setSelectedTasksColumns(selectedTasksColumns.filter(c => c !== col.key));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setSelectedTasksColumns(['task', 'assignedTo', 'contact', 'company', 'urgency', 'status', 'dueDate'])}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setSelectedTasksColumns(['task', 'assignedTo', 'contact', 'company', 'urgency', 'status', 'dueDate']);
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Tasks Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        checked={(() => {
                          let filteredTasks = tasksData.filter(task => {
                            // Quick filters
                            if (activeFilter === 'my-tasks') return task.assignedTo === 'John Doe';
                            if (activeFilter === 'high-urgency') return task.urgency === 'High';
                            if (activeFilter === 'overdue') return false; // Add overdue logic
                            if (activeFilter === 'completed') return task.status === 'Completed';
                            
                            // Search filter
                            const searchLower = tasksSearch.toLowerCase();
                            const matchesSearch = !tasksSearch || 
                              task.title.toLowerCase().includes(searchLower) ||
                              task.assignedTo.toLowerCase().includes(searchLower) ||
                              task.prospect.toLowerCase().includes(searchLower) ||
                              task.company.toLowerCase().includes(searchLower);
                            
                            return matchesSearch;
                          });
                          
                          const sorted = sortData(filteredTasks, tasksPagination.sortColumn, tasksPagination.sortDirection);
                          const paginated = paginateData(sorted, tasksPagination.currentPage, tasksPagination.rowsPerPage);
                          return paginated.length > 0 && paginated.every((task: any) => selectedTasks.includes(task.id));
                        })()}
                        onChange={(e) => {
                          let filteredTasks = tasksData.filter(task => {
                            // Quick filters
                            if (activeFilter === 'my-tasks') return task.assignedTo === 'John Doe';
                            if (activeFilter === 'high-urgency') return task.urgency === 'High';
                            if (activeFilter === 'overdue') return false;
                            if (activeFilter === 'completed') return task.status === 'Completed';
                            
                            // Search filter
                            const searchLower = tasksSearch.toLowerCase();
                            const matchesSearch = !tasksSearch || 
                              task.title.toLowerCase().includes(searchLower) ||
                              task.assignedTo.toLowerCase().includes(searchLower) ||
                              task.prospect.toLowerCase().includes(searchLower) ||
                              task.company.toLowerCase().includes(searchLower);
                            
                            return matchesSearch;
                          });
                          
                          const sorted = sortData(filteredTasks, tasksPagination.sortColumn, tasksPagination.sortDirection);
                          const paginated = paginateData(sorted, tasksPagination.currentPage, tasksPagination.rowsPerPage);
                          
                          if (e.target.checked) {
                            const newIds = paginated.map((task: any) => task.id).filter((id: number) => !selectedTasks.includes(id));
                            setSelectedTasks([...selectedTasks, ...newIds]);
                          } else {
                            const paginatedIds = paginated.map((task: any) => task.id);
                            setSelectedTasks(selectedTasks.filter(id => !paginatedIds.includes(id)));
                          }
                        }}
                      />
                    </th>
                    {selectedTasksColumns.includes('task') && <th>Task</th>}
                    {selectedTasksColumns.includes('assignedTo') && <th>Assigned To</th>}
                    {selectedTasksColumns.includes('contact') && <th>Contact</th>}
                    {selectedTasksColumns.includes('company') && <th>Company</th>}
                    {selectedTasksColumns.includes('urgency') && <th>Urgency</th>}
                    {selectedTasksColumns.includes('status') && <th>Status</th>}
                    {selectedTasksColumns.includes('dueDate') && <th>Due Date</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Filter tasks based on active filter and search
                    let filteredTasks = tasksData.filter(task => {
                      // Quick filters
                      if (activeFilter === 'my-tasks') return task.assignedTo === 'John Doe';
                      if (activeFilter === 'high-urgency') return task.urgency === 'High';
                      if (activeFilter === 'overdue') return false; // Add overdue logic
                      if (activeFilter === 'completed') return task.status === 'Completed';
                      
                      // Search filter
                      const searchLower = tasksSearch.toLowerCase();
                      const matchesSearch = !tasksSearch || 
                        task.title.toLowerCase().includes(searchLower) ||
                        task.assignedTo.toLowerCase().includes(searchLower) ||
                        task.prospect.toLowerCase().includes(searchLower) ||
                        task.company.toLowerCase().includes(searchLower);
                      
                      return matchesSearch;
                    });
                    
                    const sorted = sortData(filteredTasks, tasksPagination.sortColumn, tasksPagination.sortDirection);
                    const paginated = paginateData(sorted, tasksPagination.currentPage, tasksPagination.rowsPerPage);
                    
                    if (filteredTasks.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="text-center py-4 text-muted">
                            No tasks found matching your criteria
                          </td>
                        </tr>
                      );
                    }
                    
                    return paginated.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks([...selectedTasks, task.id]);
                            } else {
                              setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                            }
                          }}
                        />
                      </td>
                      {selectedTasksColumns.includes('task') && (
                        <td>
                          <div className="fw-semibold">{task.title}</div>
                          <small className="text-muted">Assigned: {task.dateAssigned}</small>
                        </td>
                      )}
                      {selectedTasksColumns.includes('assignedTo') && <td>{task.assignedTo}</td>}
                      {selectedTasksColumns.includes('contact') && (
                        <td>
                          <div className="fw-medium">{task.prospect}</div>
                          <small className="text-muted">{task.email}</small>
                        </td>
                      )}
                      {selectedTasksColumns.includes('company') && <td>{task.company}</td>}
                      {selectedTasksColumns.includes('urgency') && (
                        <td>
                          <Badge bg={
                            task.urgency === 'High' ? 'danger' :
                            task.urgency === 'Medium' ? 'warning' :
                            'secondary'
                          }>
                            {task.urgency}
                          </Badge>
                        </td>
                      )}
                      {selectedTasksColumns.includes('status') && (
                        <td>
                          <Badge bg={
                            task.status === 'Completed' ? 'success' :
                            task.status === 'In Progress' ? 'info' :
                            'warning'
                          }>
                            {task.status}
                          </Badge>
                        </td>
                      )}
                      {selectedTasksColumns.includes('dueDate') && <td>{task.dueDate}</td>}
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1" 
                            title="View Details"
                            onClick={() => {
                              setViewingTask({
                                task: task.title,
                                type: 'Follow-up',
                                assignedTo: task.assignedTo,
                                priority: task.urgency,
                                dueDate: task.dueDate,
                                created: task.dateAssigned,
                                relatedTo: `${task.prospect} - ${task.company}`,
                                status: task.status
                              });
                              setShowTaskViewModal(true);
                            }}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1" 
                            title="Edit Task"
                            onClick={() => {
                              setEditingTask(task);
                              setTaskFormData({
                                title: task.title,
                                name: task.prospect,
                                phone: task.phone,
                                email: task.email,
                                companyName: task.company,
                                assignedTo: task.assignedTo,
                                assignedBy: task.assignedBy,
                                dateAssigned: task.dateAssigned,
                                urgency: task.urgency,
                                dueDate: task.dueDate,
                                notes: task.notes || ''
                              });
                              setShowTaskModal(true);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-danger" 
                            title="Delete Task"
                            onClick={() => {
                              setConfirmAction({
                                type: 'delete',
                                data: { ...task, itemType: 'Task', name: task.title }
                              });
                              setShowConfirmDialog(true);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    ));
                  })()}
                </tbody>
              </Table>
            </div>
            <div className="p-3">
              {(() => {
                let filteredTasks = tasksData.filter(task => {
                  // Quick filters
                  if (activeFilter === 'my-tasks') return task.assignedTo === 'John Doe';
                  if (activeFilter === 'high-urgency') return task.urgency === 'High';
                  if (activeFilter === 'overdue') return false;
                  if (activeFilter === 'completed') return task.status === 'Completed';
                  
                  // Search filter
                  const searchLower = tasksSearch.toLowerCase();
                  const matchesSearch = !tasksSearch || 
                    task.title.toLowerCase().includes(searchLower) ||
                    task.assignedTo.toLowerCase().includes(searchLower) ||
                    task.prospect.toLowerCase().includes(searchLower) ||
                    task.company.toLowerCase().includes(searchLower);
                  
                  return matchesSearch;
                });
                
                return renderPaginationControls(filteredTasks.length, tasksPagination, setTasksPagination, 'tasks');
              })()}
            </div>
            <div className="d-none d-flex flex-column flex-md-row justify-content-between align-items-center mt-3">
              <small className="text-muted mb-2 mb-md-0">Showing 1 to {tasksData.length} of {tasksData.length} total tasks</small>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" disabled>
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                <Button variant="outline-secondary" size="sm" disabled>
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Stages Management Screen (Placeholder)
  const renderStages = () => {
    const pipelineStages = [
      { id: 1, name: 'Prospect', type: 'Lead', color: '#6c757d', order: 1, conversion: '45%', avgDuration: '3 days', count: 241, description: 'Initial contact or imported lead', automated: false },
      { id: 2, name: 'Qualified Lead', type: 'Lead', color: '#0d6efd', order: 2, conversion: '68%', avgDuration: '5 days', count: 58, description: 'Lead has been qualified and shows interest', automated: true },
      { id: 3, name: 'Contact Made', type: 'Lead', color: '#17a2b8', order: 3, conversion: '52%', avgDuration: '2 days', count: 34, description: 'First successful contact established', automated: false },
      { id: 4, name: 'Needs Analysis', type: 'Deal', color: '#ffc107', order: 4, conversion: '70%', avgDuration: '7 days', count: 18, description: 'Understanding customer requirements', automated: false },
      { id: 5, name: 'Proposal Sent', type: 'Deal', color: '#fd7e14', order: 5, conversion: '55%', avgDuration: '4 days', count: 12, description: 'Proposal or quote sent to prospect', automated: true },
      { id: 6, name: 'Negotiation', type: 'Deal', color: '#dc3545', order: 6, conversion: '75%', avgDuration: '6 days', count: 8, description: 'Active negotiation and discussion', automated: false },
      { id: 7, name: 'Deal Won', type: 'Deal', color: '#28a745', order: 7, conversion: '100%', avgDuration: '1 day', count: 15, description: 'Deal successfully closed', automated: true },
      { id: 8, name: 'Order Placed', type: 'Order', color: '#20c997', order: 8, conversion: '100%', avgDuration: '0 days', count: 15, description: 'Order has been confirmed and placed', automated: false }
    ];

    // Stage distribution data for charts
    const stagesByType = [
      { type: 'Lead', count: 333, fill: '#0d6efd' },
      { type: 'Deal', count: 53, fill: '#ffc107' },
      { type: 'Order', count: 15, fill: '#20c997' }
    ];

    const conversionData = [
      { stage: 'Prospect', rate: 45 },
      { stage: 'Qualified', rate: 68 },
      { stage: 'Contact', rate: 52 },
      { stage: 'Analysis', rate: 70 },
      { stage: 'Proposal', rate: 55 },
      { stage: 'Negotiation', rate: 75 },
      { stage: 'Won', rate: 100 }
    ];

    return (
      <div>
        {ConfirmationDialog()}
        
        {/* Stage Form Modal */}
        <Modal show={showStageModal} onHide={() => { setShowStageModal(false); setEditingStage(null); }} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingStage ? 'Edit Stage' : 'Add New Stage'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Stage Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="text" defaultValue={editingStage?.name || ''} placeholder="Enter stage name" />
                    <Form.Text className="text-muted">Name of the pipeline stage</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type <span className="text-danger">*</span></Form.Label>
                    <Form.Select defaultValue={editingStage?.type || ''}>
                      <option value="">Select Type</option>
                      <option value="Lead">Lead</option>
                      <option value="Deal">Deal</option>
                      <option value="Order">Order</option>
                    </Form.Select>
                    <Form.Text className="text-muted">Category this stage belongs to</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Color <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="color" defaultValue={editingStage?.color || '#0d6efd'} />
                    <Form.Text className="text-muted">Visual indicator color for this stage</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Order Position</Form.Label>
                    <Form.Control type="number" defaultValue={editingStage?.order || 1} min="1" />
                    <Form.Text className="text-muted">Position in the pipeline sequence</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={3} defaultValue={editingStage?.description || ''} placeholder="Describe this stage..." />
                <Form.Text className="text-muted">Brief description of what this stage represents</Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check 
                  type="checkbox" 
                  label="Enable Automation for this stage" 
                  defaultChecked={editingStage?.automated || false}
                />
                <Form.Text className="text-muted">Automatically trigger actions when records enter this stage</Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowStageModal(false); setEditingStage(null); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => {
              alert(editingStage ? 'Stage updated!' : 'Stage created!');
              setShowStageModal(false);
              setEditingStage(null);
            }}>
              {editingStage ? 'Update Stage' : 'Create Stage'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Stage Rules Modal */}
        <Modal show={showStageRulesModal} onHide={() => { setShowStageRulesModal(false); setEditingStage(null); }} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Configure Rules - {editingStage?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted mb-4">Set up automation rules that trigger when records enter this stage.</p>
            
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="fw-bold mb-3">Entry Actions</h6>
                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" label="Send email notification to assigned user" />
                  <Form.Text className="text-muted">Alert the owner when a record moves to this stage</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" label="Create follow-up task automatically" />
                  <Form.Text className="text-muted">Generate a task for the assigned user</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" label="Update record status" />
                  <Form.Text className="text-muted">Change the record's status field</Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="border-0 bg-light">
              <Card.Body>
                <h6 className="fw-bold mb-3">Exit Conditions</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Move to next stage after:</Form.Label>
                  <Form.Control type="number" placeholder="Number of days" />
                  <Form.Text className="text-muted">Automatically progress after specified days</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" label="Require approval before moving" />
                  <Form.Text className="text-muted">Manager approval needed to progress</Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowStageRulesModal(false); setEditingStage(null); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => {
              alert('Rules saved successfully!');
              setShowStageRulesModal(false);
              setEditingStage(null);
            }}>
              Save Rules
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Stages Management</h2>
            <p className="text-muted mb-0">Configure and manage your sales pipeline stages</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button 
              variant={showStagesAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowStagesAnalytics(!showStagesAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showStagesAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            <Button variant="primary" onClick={() => setShowStageModal(true)}>
              <Plus size={16} className="me-2" />
              Add Custom Stage
            </Button>
          </div>
        </div>

        {/* Analytics Section - Collapsible */}
        {showStagesAnalytics && (
          <>
            {/* Summary Stats */}
            <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Total Stages"
              value="8"
              icon={<Layers size={24} />}
              color="primary"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Active Records"
              value="401"
              icon={<TrendingUp size={24} />}
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Avg Conversion Rate"
              value="70.6%"
              change="+3.2%"
              isPositive={true}
              icon={<Target size={24} />}
              color="info"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Avg Cycle Time"
              value="3.5 days"
              change="-0.5"
              isPositive={true}
              icon={<Clock size={24} />}
              color="warning"
            />
          </Col>
        </Row>

        {/* Analytics Charts */}
        <Row className="mb-4">
          {/* Stages by Type Distribution */}
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Records by Type</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stagesByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }: any) => `${type}: ${count}`}
                      outerRadius={70}
                      dataKey="count"
                    >
                      {stagesByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* Conversion Rates by Stage */}
          <Col lg={8} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Conversion Rates by Stage</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis label={{ value: 'Conversion %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#0d6efd" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
          </>
        )}

        {/* Bulk Actions and Column Customization - Stages */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          {/* Bulk Actions Dropdown - Only show when items are selected */}
          {selectedStages.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <CheckSquare size={16} className="me-2" />
                Bulk Actions ({selectedStages.length})
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item
                  onClick={() => {
                    console.log('Enable selected stages:', selectedStages);
                    // Add logic to enable stages
                  }}
                  className="d-flex align-items-center"
                >
                  <CheckCircle size={14} className="me-2" />
                  Enable Selected
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    console.log('Disable selected stages:', selectedStages);
                    // Add logic to disable stages
                  }}
                  className="d-flex align-items-center"
                >
                  <XCircle size={14} className="me-2" />
                  Disable Selected
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    console.log('Reorder stages:', selectedStages);
                    // Add logic to reorder stages
                  }}
                  className="d-flex align-items-center"
                >
                  <ArrowUpDown size={14} className="me-2" />
                  Reorder Stages
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item 
                  onClick={() => {
                    setConfirmAction({
                      type: 'delete',
                      data: { 
                        itemType: 'Stages', 
                        name: `${selectedStages.length} selected stages`,
                        count: selectedStages.length
                      }
                    });
                    setShowConfirmDialog(true);
                  }}
                  className="d-flex align-items-center text-danger"
                >
                  <Trash2 size={14} className="me-2" />
                  Delete Selected ({selectedStages.length})
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
            <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[
                { key: 'stageName', label: 'Stage Name' },
                { key: 'category', label: 'Type' },
                { key: 'description', label: 'Description' },
                { key: 'color', label: 'Color' },
                { key: 'order', label: 'Order' }
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedStagesColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStagesColumns([...selectedStagesColumns, col.key]);
                      } else {
                        setSelectedStagesColumns(selectedStagesColumns.filter(c => c !== col.key));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setSelectedStagesColumns(['stageName', 'category', 'description', 'color', 'order'])}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setSelectedStagesColumns(['stageName', 'category', 'description', 'color', 'order']);
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Pipeline Stages Table */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-0">
            

            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        checked={(() => {
                          const sorted = sortData(pipelineStages, stagesPagination.sortColumn, stagesPagination.sortDirection);
                          const paginated = paginateData(sorted, stagesPagination.currentPage, stagesPagination.rowsPerPage);
                          return paginated.length > 0 && paginated.every((stage: any) => selectedStages.includes(stage.id));
                        })()}
                        onChange={(e) => {
                          const sorted = sortData(pipelineStages, stagesPagination.sortColumn, stagesPagination.sortDirection);
                          const paginated = paginateData(sorted, stagesPagination.currentPage, stagesPagination.rowsPerPage);
                          
                          if (e.target.checked) {
                            const newIds = paginated.map((stage: any) => stage.id).filter((id: number) => !selectedStages.includes(id));
                            setSelectedStages([...selectedStages, ...newIds]);
                          } else {
                            const paginatedIds = paginated.map((stage: any) => stage.id);
                            setSelectedStages(selectedStages.filter(id => !paginatedIds.includes(id)));
                          }
                        }}
                      />
                    </th>
                    {selectedStagesColumns.includes('order') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('order', stagesPagination, setStagesPagination)}
                      >
                        Order {renderSortIcon('order', stagesPagination)}
                      </th>
                    )}
                    {selectedStagesColumns.includes('stageName') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('name', stagesPagination, setStagesPagination)}
                      >
                        Stage Name {renderSortIcon('name', stagesPagination)}
                      </th>
                    )}
                    {selectedStagesColumns.includes('category') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('type', stagesPagination, setStagesPagination)}
                      >
                        Type {renderSortIcon('type', stagesPagination)}
                      </th>
                    )}
                    {selectedStagesColumns.includes('description') && <th>Description</th>}
                    {selectedStagesColumns.includes('color') && <th>Color</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sorted = sortData(pipelineStages, stagesPagination.sortColumn, stagesPagination.sortDirection);
                    const paginated = paginateData(sorted, stagesPagination.currentPage, stagesPagination.rowsPerPage);
                    return paginated.map((stage) => (
                      <tr key={stage.id}>
                        <td>
                          <Form.Check 
                            type="checkbox"
                            checked={selectedStages.includes(stage.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStages([...selectedStages, stage.id]);
                              } else {
                                setSelectedStages(selectedStages.filter(id => id !== stage.id));
                              }
                            }}
                          />
                        </td>
                        {selectedStagesColumns.includes('order') && (
                          <td className="text-center fw-bold">{stage.order}</td>
                        )}
                        {selectedStagesColumns.includes('stageName') && (
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div 
                                style={{ 
                                  width: '10px', 
                                  height: '10px', 
                                  backgroundColor: stage.color, 
                                  borderRadius: '50%' 
                                }}
                              />
                              <span className="fw-semibold">{stage.name}</span>
                            </div>
                          </td>
                        )}
                        {selectedStagesColumns.includes('category') && (
                          <td>
                            <Badge bg={
                              stage.type === 'Lead' ? 'primary' :
                              stage.type === 'Deal' ? 'warning' :
                              'success'
                            } className="bg-opacity-10 text-dark">
                              {stage.type}
                            </Badge>
                          </td>
                        )}
                        {selectedStagesColumns.includes('description') && (
                          <td className="small text-muted">{stage.description}</td>
                        )}
                        {selectedStagesColumns.includes('color') && (
                          <td>
                            <Badge style={{ backgroundColor: stage.color }}>
                              {stage.color}
                            </Badge>
                          </td>
                        )}
                        {/* <td>
                          <Badge bg="primary" pill className="bg-opacity-10 text-dark">
                            {stage.count}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <ProgressBar 
                              now={parseInt(stage.conversion)} 
                              variant={parseInt(stage.conversion) >= 70 ? 'success' : parseInt(stage.conversion) >= 50 ? 'warning' : 'danger'}
                              style={{ width: '80px', height: '8px' }}
                            />
                            <small className="fw-semibold">{stage.conversion}</small>
                          </div>
                        </td>
                        <td className="text-muted small">{stage.avgDuration}</td>
                        <td>
                          {stage.automated ? (
                            <Badge bg="success" className="bg-opacity-10">
                              <CheckCircle size={14} className="me-1" />
                              Automated
                            </Badge>
                          ) : (
                            <Badge bg="secondary" className="bg-opacity-10">
                              Manual
                            </Badge>
                          )}
                        </td> */}
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-1" 
                              title="Edit Stage"
                              onClick={() => {
                                setEditingStage(stage);
                                setShowStageModal(true);
                              }}
                            >
                              <Edit size={16} />
                            </Button>
                            {/* <Button 
                              variant="link" 
                              size="sm" 
                              className="p-1 text-info" 
                              title="Configure Automation Rules"
                              onClick={() => {
                                setEditingStage(stage);
                                setShowStageRulesModal(true);
                              }}
                            >
                              <GitBranch size={16} />
                            </Button> */}
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-1 text-danger" 
                              title="Delete Stage"
                              onClick={() => {
                                setConfirmAction({
                                  type: 'delete',
                                  data: { ...stage, itemType: 'Stage' }
                                });
                                setShowConfirmDialog(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </Table>
            </div>
            
            <div className="p-3">
              {renderPaginationControls(pipelineStages.length, stagesPagination, setStagesPagination, 'stages')}
            </div>
          </Card.Body>
        </Card>

        {/* Stage Flow Visualization */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <h5 className="mb-4 fw-bold">Pipeline Flow Visualization</h5>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              {pipelineStages.map((stage, index) => (
                <React.Fragment key={stage.id}>
                  <div className="text-center" style={{ minWidth: '100px' }}>
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" 
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        backgroundColor: stage.color,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {stage.count}
                    </div>
                    <small className="fw-semibold d-block">{stage.name}</small>
                    <small className="text-muted">{stage.conversion}</small>
                  </div>
                  {index < pipelineStages.length - 1 && (
                    <ChevronRight size={24} className="text-muted" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // New Modern Activity Tracker Screen
  const renderActivityTrackerNew = () => {
    // Pipeline stages with colors and icons
    const pipelineStages = [
      { id: 'all', label: 'All Stages', color: '#6c757d', icon: <Activity size={16} />, bgColor: '#f8f9fa' },
      { id: 'prospect', label: 'Prospect', color: '#6c757d', icon: <Users size={16} />, bgColor: '#f8f9fa' },
      { id: 'qualified', label: 'Qualified Lead', color: '#0d6efd', icon: <Target size={16} />, bgColor: '#e7f1ff' },
      { id: 'contact', label: 'Contact Made', color: '#17a2b8', icon: <Phone size={16} />, bgColor: '#d1ecf1' },
      { id: 'analysis', label: 'Needs Analysis', color: '#ffc107', icon: <FileText size={16} />, bgColor: '#fff3cd' },
      { id: 'proposal', label: 'Proposal Sent', color: '#fd7e14', icon: <Mail size={16} />, bgColor: '#ffe5d0' },
      { id: 'negotiation', label: 'Negotiation', color: '#dc3545', icon: <Handshake size={16} />, bgColor: '#f8d7da' },
      { id: 'won', label: 'Deal Won', color: '#28a745', icon: <CheckCircle size={16} />, bgColor: '#d4edda' },
      { id: 'order', label: 'Order Placed', color: '#20c997', icon: <ShoppingBag size={16} />, bgColor: '#d1f4ea' }
    ];

    // Sample activity data
    const allActivities = [
      { id: 1, entityName: 'Global Services Ltd', entityType: 'Company', currentStage: 'order', previousStage: 'won', movedBy: 'Sarah Williams', movedAt: '2025-11-29 14:20', duration: '2 days', value: '£45,000', owner: 'Sarah Williams', notes: 'Order confirmed, contract signed', tags: ['High Value', 'Priority'] },
      { id: 2, entityName: 'Acme Corporation', entityType: 'Company', currentStage: 'won', previousStage: 'negotiation', movedBy: 'John Doe', movedAt: '2025-11-29 09:15', duration: '5 days', value: '£32,000', owner: 'John Doe', notes: 'Successfully closed deal after negotiation', tags: ['Enterprise'] },
      { id: 3, entityName: 'John Smith', entityType: 'Contact', currentStage: 'qualified', previousStage: 'prospect', movedBy: 'Jane Smith', movedAt: '2025-11-28 10:30', duration: '1 day', value: '-', owner: 'Jane Smith', notes: 'Qualified after initial conversation', tags: ['New'] },
      { id: 4, entityName: 'Tech Innovations Ltd', entityType: 'Company', currentStage: 'proposal', previousStage: 'analysis', movedBy: 'Mike Johnson', movedAt: '2025-11-28 16:45', duration: '4 days', value: '£28,500', owner: 'Mike Johnson', notes: 'Proposal sent with custom pricing', tags: ['Tech'] },
      { id: 5, entityName: 'Emily Davis', entityType: 'Contact', currentStage: 'contact', previousStage: 'qualified', movedBy: 'Tom Brown', movedAt: '2025-11-27 15:30', duration: '2 days', value: '-', owner: 'Tom Brown', notes: 'First contact made via phone', tags: [] },
      { id: 6, entityName: 'DataTech Systems', entityType: 'Company', currentStage: 'negotiation', previousStage: 'proposal', movedBy: 'Sarah Williams', movedAt: '2025-11-27 11:00', duration: '3 days', value: '£52,000', owner: 'Sarah Williams', notes: 'In negotiation on pricing and terms', tags: ['High Value'] },
      { id: 7, entityName: 'Innovation Hub', entityType: 'Company', currentStage: 'analysis', previousStage: 'contact', movedBy: 'Jane Smith', movedAt: '2025-11-26 14:20', duration: '3 days', value: '£22,500', owner: 'Jane Smith', notes: 'Requirements gathering in progress', tags: ['Startup'] },
      { id: 8, entityName: 'Robert Wilson', entityType: 'Contact', currentStage: 'prospect', previousStage: '', movedBy: 'System', movedAt: '2025-11-26 10:15', duration: '-', value: '-', owner: 'Sarah Williams', notes: 'New prospect imported from campaign', tags: ['Campaign'] },
      { id: 9, entityName: 'Cloud Solutions Inc', entityType: 'Company', currentStage: 'order', previousStage: 'won', movedBy: 'John Doe', movedAt: '2025-11-25 13:45', duration: '1 day', value: '£38,000', owner: 'John Doe', notes: 'Order processing started', tags: ['Cloud'] },
      { id: 10, entityName: 'Sarah Johnson', entityType: 'Contact', currentStage: 'contact', previousStage: 'qualified', movedBy: 'Mike Johnson', movedAt: '2025-11-25 10:20', duration: '1 day', value: '-', owner: 'Mike Johnson', notes: 'Email sent, waiting for response', tags: [] },
    ];

    // Filter activities based on stage and search
    const filteredActivities = allActivities
      .filter(activity => activityStageFilter === 'all' || activity.currentStage === activityStageFilter)
      .filter(activity => {
        if (!activitySearchTerm) return true;
        const searchLower = activitySearchTerm.toLowerCase();
        return activity.entityName.toLowerCase().includes(searchLower) ||
               activity.owner.toLowerCase().includes(searchLower) ||
               activity.movedBy.toLowerCase().includes(searchLower);
      })
      .slice(0, activityRecordsLimit);

    // Get stage info
    const getStageInfo = (stageId: string) => {
      return pipelineStages.find(s => s.id === stageId) || pipelineStages[0];
    };

    // Statistics - count activities per stage
    const stageStats = pipelineStages.slice(1).map(stage => ({
      ...stage,
      count: allActivities.filter(a => a.currentStage === stage.id).length
    }));

    // Prepare quick filters for FilterBar
    const quickFilters = pipelineStages.map(stage => {
      const count = stage.id === 'all' ? allActivities.length : allActivities.filter(a => a.currentStage === stage.id).length;
      return {
        id: stage.id,
        label: stage.label,
        count: count,
        color: stage.color,
        activeColor: stage.color,
        icon: stage.icon
      };
    });

    return (
      <div>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Activity Tracker</h2>
            <p className="text-muted mb-0">Track entities moving through your sales pipeline stages</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button variant="outline-secondary" size="sm">
              <Download size={16} className="me-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filter Bar with Stage Tabs */}
        <FilterBar
          quickFilters={quickFilters}
          activeFilter={activityStageFilter}
          onFilterChange={(filterId) => setActivityStageFilter(filterId)}
          searchValue={activitySearchTerm}
          onSearchChange={(value) => setActivitySearchTerm(value)}
          onSearch={() => console.log('Searching activities:', activitySearchTerm)}
          searchPlaceholder="Search by entity name or owner..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={(activityDateRange.start || activityDateRange.end) ? 1 : 0}
        />

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Label className="small fw-bold mb-2">Records Limit</Form.Label>
                  <Form.Select 
                    value={activityRecordsLimit} 
                    onChange={(e) => setActivityRecordsLimit(Number(e.target.value))}
                  >
                    <option value="10">10 Records</option>
                    <option value="25">25 Records</option>
                    <option value="50">50 Records</option>
                    <option value="100">100 Records</option>
                    <option value="250">250 Records</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="small fw-bold mb-2">Start Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={activityDateRange.start}
                    onChange={(e) => setActivityDateRange({ ...activityDateRange, start: e.target.value })}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="small fw-bold mb-2">End Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={activityDateRange.end}
                    onChange={(e) => setActivityDateRange({ ...activityDateRange, end: e.target.value })}
                  />
                </Col>
                <Col md={3} className="d-flex gap-2">
                  <Button 
                    variant="outline-secondary"
                    className="flex-fill"
                    onClick={() => {
                      setActivityStageFilter('all');
                      setActivitySearchTerm('');
                      setActivityDateRange({ start: '', end: '' });
                      setActivityRecordsLimit(50);
                    }}
                  >
                    <XCircle size={16} className="me-2" />
                   Reset
                  </Button>
                </Col>
              </Row>
              <div className="mt-3">
                <span className="small text-muted">
                  Showing <strong>{filteredActivities.length}</strong> of <strong>{allActivities.length}</strong> activities
                </span>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Activities Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '20%' }}>Entity</th>
                    <th style={{ width: '15%' }}>Stage Transition</th>
                    <th style={{ width: '12%' }}>Value</th>
                    <th style={{ width: '12%' }}>Owner</th>
                    {/* <th style={{ width: '10%' }}>Duration</th> */}
                    <th style={{ width: '15%' }}>Moved At</th>
                    {/* <th style={{ width: '11%' }}>Actions</th> */}
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <AlertCircle size={48} className="mb-3 opacity-50" />
                        <div>No activities found matching your criteria</div>
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((activity, index) => {
                      const currentStageInfo = getStageInfo(activity.currentStage);
                      const previousStageInfo = activity.previousStage ? getStageInfo(activity.previousStage) : null;
                      
                      return (
                        <tr key={activity.id}>
                          <td className="text-muted">{index + 1}</td>
                          <td>
                            <div>
                              <div className="fw-semibold text-dark">{activity.entityName}</div>
                              <div className="small text-muted">{activity.entityType}</div>
                              {activity.tags.length > 0 && (
                                <div className="mt-1">
                                  {activity.tags.map((tag, idx) => (
                                    <Badge key={idx} bg="light" text="dark" className="me-1" style={{ fontSize: '0.7rem' }}>
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {previousStageInfo && (
                                <>
                                  <Badge 
                                    style={{ 
                                      backgroundColor: previousStageInfo.bgColor,
                                      color: "#fff",
                                      // border: `1px solid ${previousStageInfo.color}`,
                                      fontSize: '0.7rem',
                                      padding: '4px 8px'
                                    }}
                                  >
                                    {previousStageInfo.label}
                                  </Badge>
                                  <ArrowRight size={14} className="text-muted" />
                                </>
                              )}
                              <Badge 
                                style={{ 
                                  backgroundColor: currentStageInfo.bgColor,
                                  color: "#fff",
                                  // border: `1px solid ${currentStageInfo.color}`,
                                  fontSize: '0.7rem',
                                  padding: '4px 8px',
                                  fontWeight: 600
                                }}
                              >
                                {currentStageInfo.label}
                              </Badge>
                            </div>
                          </td>
                          <td>
                            {activity.value !== '-' ? (
                              <span className="fw-semibold text-success">{activity.value}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div 
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: '#0d6efd',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {activity.owner.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="small">{activity.owner}</div>
                            </div>
                          </td>
                          {/* <td>
                            <Badge bg="secondary" className="bg-opacity-10 text-dark">
                              <Clock size={12} className="me-1" />
                              {activity.duration}
                            </Badge>
                          </td> */}
                          <td>
                            <div className="small">
                              <div className="text-dark">{activity.movedAt.split(' ')[0]}</div>
                              <div className="text-muted">{activity.movedAt.split(' ')[1]}</div>
                            </div>
                          </td>
                          {/* <td>
                            <div className="d-flex gap-1">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-1 text-primary"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </Button>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-1 text-muted"
                                title="View History"
                              >
                                <History size={16} />
                              </Button>
                            </div>
                          </td> */}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Activity Tracker Screen (Original)
  const renderActivities = () => {
    const recentActivities = [
      { id: 1, type: 'conversion', from: 'Deal', to: 'Order', entity: 'Global Services Ltd', value: '$45,000', user: 'Sarah Williams', date: '2025-11-19 14:20', icon: <ShoppingBag size={18} />, color: 'success' },
      { id: 2, type: 'conversion', from: 'Lead', to: 'Deal', entity: 'Acme Corporation', value: '$32,000', user: 'John Doe', date: '2025-11-19 09:15', icon: <Handshake size={18} />, color: 'info' },
      { id: 3, type: 'conversion', from: 'Prospect', to: 'Lead', entity: 'John Smith', value: '-', user: 'Jane Smith', date: '2025-11-19 10:30', icon: <Target size={18} />, color: 'primary' },
      { id: 4, type: 'call', from: '', to: '', entity: 'Michael Brown', value: '-', user: 'Mike Johnson', date: '2025-11-18 16:45', icon: <Phone size={18} />, color: 'secondary' },
      { id: 5, type: 'email', from: '', to: '', entity: 'Emily Davis', value: '-', user: 'Tom Brown', date: '2025-11-18 15:30', icon: <Mail size={18} />, color: 'warning' },
      { id: 6, type: 'meeting', from: '', to: '', entity: 'DataTech Systems', value: '$28,000', user: 'Sarah Williams', date: '2025-11-18 11:00', icon: <Calendar size={18} />, color: 'info' },
      { id: 7, type: 'conversion', from: 'Lead', to: 'Deal', entity: 'Innovation Hub', value: '$22,500', user: 'Jane Smith', date: '2025-11-18 11:00', icon: <Handshake size={18} />, color: 'info' },
      { id: 8, type: 'conversion', from: 'Deal', to: 'Order', entity: 'DataTech Systems', value: '$32,000', user: 'John Doe', date: '2025-11-17 13:45', icon: <ShoppingBag size={18} />, color: 'success' },
      { id: 9, type: 'note', from: '', to: '', entity: 'Sarah Johnson', value: '-', user: 'Mike Johnson', date: '2025-11-17 10:20', icon: <FileText size={18} />, color: 'secondary' },
      { id: 10, type: 'conversion', from: 'Prospect', to: 'Lead', entity: 'Robert Wilson', value: '-', user: 'Sarah Williams', date: '2025-11-17 10:15', icon: <Target size={18} />, color: 'primary' },
    ];

    const activityStats = {
      today: 12,
      thisWeek: 47,
      thisMonth: 186,
      conversions: 8
    };

    return (
      <div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Activity Tracker</h2>
            <p className="text-muted mb-0">Monitor all CRM activities and conversions in real-time</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button variant="outline-secondary">
              <Filter size={16} className="me-2" />
              Filter
            </Button>
            <Button variant="primary">
              <Plus size={16} className="me-2" />
              Log Activity
            </Button>
          </div>
        </div>

        {/* Activity Stats */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Today's Activities"
              value={activityStats.today.toString()}
              icon={<Activity size={24} />}
              color="primary"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="This Week"
              value={activityStats.thisWeek.toString()}
              change="+8"
              isPositive={true}
              icon={<TrendingUp size={24} />}
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="This Month"
              value={activityStats.thisMonth.toString()}
              icon={<BarChart3 size={24} />}
              color="info"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Conversions (7 days)"
              value={activityStats.conversions.toString()}
              change="+2"
              isPositive={true}
              icon={<CheckCircle size={24} />}
              color="warning"
            />
          </Col>
        </Row>

        {/* Filter Tabs */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex gap-2 flex-wrap">
              <Badge 
                bg="primary" 
                style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                All Activities
              </Badge>
              <Badge 
                bg="light" 
                text="dark"
                style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Conversions Only
              </Badge>
              <Badge 
                bg="light" 
                text="dark"
                style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Calls & Meetings
              </Badge>
              <Badge 
                bg="light" 
                text="dark"
                style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Emails & Notes
              </Badge>
            </div>
          </Card.Body>
        </Card>

        {/* Activity Timeline */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <h5 className="mb-4 fw-bold">Activity Timeline</h5>
            
            <div className="position-relative">
              {/* Timeline Line */}
              <div 
                className="position-absolute bg-light" 
                style={{ left: '29px', top: '0', bottom: '0', width: '2px' }}
              />
              
              {recentActivities.map((activity, index) => (
                <div key={activity.id} className="d-flex gap-3 mb-4 position-relative">
                  {/* Timeline Icon */}
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center bg-${activity.color} text-white position-relative`}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      minWidth: '40px',
                      zIndex: 1
                    }}
                  >
                    {activity.icon}
                  </div>
                  
                  {/* Activity Card */}
                  <Card className="flex-grow-1 border-0 shadow-sm">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          {activity.type === 'conversion' ? (
                            <h6 className="mb-1 fw-semibold">
                              {activity.from} → {activity.to}
                            </h6>
                          ) : (
                            <h6 className="mb-1 fw-semibold text-capitalize">
                              {activity.type} Activity
                            </h6>
                          )}
                          <p className="mb-1 text-dark">
                            <strong>{activity.entity}</strong>
                            {activity.value !== '-' && (
                              <span className="text-success ms-2">
                                <DollarSign size={14} className="me-1" />
                                {activity.value}
                              </span>
                            )}
                          </p>
                        </div>
                        <Badge 
                          bg={activity.color} 
                          className="bg-opacity-10"
                        >
                          {activity.type === 'conversion' ? 'Conversion' : activity.type}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center text-muted small">
                        <span>
                          <Users size={14} className="me-1" />
                          {activity.user}
                        </span>
                        <span>
                          <Clock size={14} className="me-1" />
                          {activity.date}
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>

            <div className="text-center mt-4">
              <Button variant="outline-primary">
                Load More Activities
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Reports Screen
  const renderReports = () => {
    const conversionFunnelData = [
      { name: 'Prospects', value: 241, percentage: 100 },
      { name: 'Leads', value: 58, percentage: 24 },
      { name: 'Deals', value: 23, percentage: 40 },
      { name: 'Orders', value: 15, percentage: 65 }
    ];

    const performanceByUserData = [
      { user: 'Sarah Williams', prospects: 45, leads: 18, deals: 8, orders: 5, conversionRate: 11.1 },
      { user: 'John Doe', prospects: 52, leads: 12, deals: 6, orders: 4, conversionRate: 7.7 },
      { user: 'Jane Smith', prospects: 38, leads: 15, deals: 5, orders: 3, conversionRate: 7.9 },
      { user: 'Mike Johnson', prospects: 49, leads: 8, deals: 3, orders: 2, conversionRate: 4.1 },
      { user: 'Tom Brown', prospects: 57, leads: 5, deals: 1, orders: 1, conversionRate: 1.8 }
    ];

    const monthlyRevenueData = [
      { month: 'Jul', revenue: 125000, deals: 8 },
      { month: 'Aug', revenue: 156000, deals: 10 },
      { month: 'Sep', revenue: 143000, deals: 9 },
      { month: 'Oct', revenue: 178000, deals: 12 },
      { month: 'Nov', revenue: 195000, deals: 15 }
    ];

    const leadSourceData = [
      { name: 'Website Form', value: 35, color: '#0d6efd' },
      { name: 'Google Ads', value: 28, color: '#198754' },
      { name: 'LinkedIn', value: 18, color: '#0dcaf0' },
      { name: 'Referral', value: 12, color: '#ffc107' },
      { name: 'Cold Email', value: 7, color: '#dc3545' }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Reports & Analytics</h2>
            <p className="text-muted mb-0">Comprehensive CRM insights and performance metrics</p>
          </div>
          <div className="d-flex gap-2">
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary">
                <Calendar size={16} className="me-2" />
                Last 30 Days
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>Last 7 Days</Dropdown.Item>
                <Dropdown.Item>Last 30 Days</Dropdown.Item>
                <Dropdown.Item>Last 3 Months</Dropdown.Item>
                <Dropdown.Item>Last 6 Months</Dropdown.Item>
                <Dropdown.Item>This Year</Dropdown.Item>
                <Dropdown.Item>Custom Range</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button variant="primary">
              <Download size={16} className="me-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Total Revenue"
              value="$797K"
              change="+23.5%"
              isPositive={true}
              icon={<DollarSign size={24} />}
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Deals Closed"
              value="54"
              change="+12"
              isPositive={true}
              icon={<Handshake size={24} />}
              color="primary"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Avg Deal Value"
              value="$14.8K"
              change="+5.2%"
              isPositive={true}
              icon={<TrendingUp size={24} />}
              color="info"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Win Rate"
              value="65.2%"
              change="+3.1%"
              isPositive={true}
              icon={<Target size={24} />}
              color="warning"
            />
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row className="mb-4">
          <Col lg={8} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Monthly Revenue Trend</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      yAxisId="left"
                      label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }} 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      label={{ value: 'Deals', angle: 90, position: 'insideRight' }} 
                    />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#0d6efd" name="Revenue" radius={[8, 8, 0, 0]} />
                    <Bar yAxisId="right" dataKey="deals" fill="#198754" name="Deals Closed" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Lead Sources</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name} ${(((entry.percent as number) || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Conversion Funnel */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <h5 className="mb-4 fw-bold">Conversion Funnel</h5>
            <Row>
              {conversionFunnelData.map((stage, index) => (
                <Col md={3} key={stage.name} className="mb-3">
                  <div className="text-center">
                    <div 
                      className="mb-2 mx-auto" 
                      style={{ 
                        width: `${stage.percentage}%`,
                        height: '80px',
                        backgroundColor: index === 0 ? '#0d6efd' : index === 1 ? '#17a2b8' : index === 2 ? '#ffc107' : '#28a745',
                        clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.5rem'
                      }}
                    >
                      {stage.value}
                    </div>
                    <h6 className="fw-bold">{stage.name}</h6>
                    <p className="text-muted small mb-0">
                      {index > 0 && `${stage.percentage}% conversion`}
                    </p>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Performance by User */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <h5 className="mb-4 fw-bold">Performance by Sales Rep</h5>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>User</th>
                  <th>Prospects</th>
                  <th>Leads</th>
                  <th>Deals</th>
                  <th>Orders</th>
                  <th>Conversion Rate</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {performanceByUserData.map((user) => (
                  <tr key={user.user}>
                    <td className="fw-semibold">{user.user}</td>
                    <td>
                      <Badge bg="secondary" pill className="bg-opacity-10 text-dark">
                        {user.prospects}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="primary" pill className="bg-opacity-10 text-dark">
                        {user.leads}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="info" pill className="bg-opacity-10 text-dark">
                        {user.deals}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="success" pill className="bg-opacity-10 text-dark">
                        {user.orders}
                      </Badge>
                    </td>
                    <td>
                      <Badge 
                        bg={
                          user.conversionRate >= 10 ? 'success' :
                          user.conversionRate >= 5 ? 'warning' :
                          'danger'
                        }
                      >
                        {user.conversionRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td>
                      <ProgressBar 
                        now={user.conversionRate * 10} 
                        variant={
                          user.conversionRate >= 10 ? 'success' :
                          user.conversionRate >= 5 ? 'warning' :
                          'danger'
                        }
                        style={{ height: '8px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeScreen) {
      case 'dashboard': return renderDashboard();
      case 'prospects': return renderProspects();
      case 'leads': return renderLeads();
      case 'deals': return renderDeals();
      case 'orders': return renderOrders();
      case 'campaigns': return renderCampaigns();
      case 'tasks': return renderTasks();
      case 'stages': return renderStages();
      case 'activities': return renderActivityTrackerNew(); // Use renderActivities() for old version
      case 'reports': return renderReports();
      default: return renderDashboard();
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {OpenTaskModal()}
      {ReminderAlert()}
      
      <style>{`
        /* Responsive Utilities */
        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          max-width: 100%;
        }
        
        @media (max-width: 768px) {
          .table-responsive {
            font-size: 0.875rem;
          }
          h2 {
            font-size: 1.5rem;
          }
          h5 {
            font-size: 1.125rem;
          }
          .card-body {
            padding: 1rem;
          }
        }

        /* Mobile Toggle Button */
        .mobile-toggle-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        @media (min-width: 992px) {
          .mobile-toggle-btn {
            display: none;
          }
        }

        /* Content Area Responsive */
        .content-wrapper {
          flex: 1;
          padding: 2rem;
          margin-left: 0;
          transition: margin-left 0.3s ease;
          overflow-x: hidden;
          max-width: 100vw;
        }
        
        .container-fluid {
          max-width: 100%;
          overflow-x: hidden;
        }

        @media (min-width: 992px) {
          .content-wrapper {
            /* margin-left controlled by inline style based on sidebar state */
          }
        }

        @media (max-width: 991px) {
          .content-wrapper {
            padding: 1rem;
          }
        }

        /* Responsive Tables - Keep horizontal scroll on mobile for better UX */
        @media (max-width: 768px) {
          .table-responsive {
            font-size: 0.813rem;
          }
          .table th, .table td {
            padding: 0.5rem;
            white-space: nowrap;
          }
          .table .btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }
          .badge {
            font-size: 0.688rem;
            padding: 0.25rem 0.5rem;
          }
        }
        
        /* Small mobile devices - extra compact */
        @media (max-width: 576px) {
          .table-responsive {
            font-size: 0.75rem;
          }
          .table th, .table td {
            padding: 0.375rem;
          }
          .btn-sm {
            font-size: 0.688rem;
            padding: 0.188rem 0.375rem;
          }
        }

        /* KPI Cards Responsive */
        @media (max-width: 576px) {
          .kpi-card {
            margin-bottom: 1rem;
          }
        }
        
        /* Filter Bar Responsive Improvements */
        @media (max-width: 992px) {
          .filter-bar .btn {
            font-size: 0.875rem;
            padding: 0.5rem 0.75rem;
          }
          .filter-bar .badge {
            font-size: 0.688rem;
          }
        }
        
        @media (max-width: 768px) {
          .filter-bar .btn {
            font-size: 0.813rem;
            padding: 0.375rem 0.625rem;
          }
        }
        
        /* Better button wrapping on small screens */
        @media (max-width: 576px) {
          .d-flex.gap-2 {
            gap: 0.5rem !important;
          }
          .d-flex.flex-wrap {
            justify-content: flex-start;
          }
          h2 {
            font-size: 1.25rem;
          }
          .btn {
            font-size: 0.813rem;
          }
        }
        
        /* Input Group Responsive */
        @media (max-width: 576px) {
          .input-group .form-control {
            font-size: 0.875rem;
          }
        }
        
        /* Modal Responsive */
        @media (max-width: 768px) {
          .modal-dialog {
            margin: 0.5rem;
          }
          .modal-body {
            padding: 1rem;
          }
        }
      `}</style>

      {/* Mobile Toggle Button */}
      <Button
        variant="primary"
        className="mobile-toggle-btn d-lg-none"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu size={24} />
      </Button>

      {/* Sidebar with ExpandableSidebar Component */}
      <ExpandableSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
      />

<nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-2">
            <Button 
              variant="link" 
              className="text-dark d-none d-lg-block p-2" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ marginLeft: '-10px' }}
            >
              {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </Button>
            <a className="navbar-brand fw-bold text-primary mb-0" href="#"><img src={CompanyLogo2.src} alt="logo" className="img-fluid" /></a>
          </div>
          <div className="ms-auto d-flex align-items-center gap-3">
            <Button variant="link" className="text-dark position-relative">
              <Bell size={20} />
              <Badge bg="danger" pill className="position-absolute translate-middle" style={{top:'10px', left:'37px'}}>3</Badge>
            </Button>
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                <Users size={20} className="text-primary" />
              </div>
              <div className="d-none d-md-block">
                <small className="d-block fw-semibold">John Doe</small>
                <small className="text-muted">john@example.com</small>
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content Area */}
      <div 
        className="content-wrapper" 
        style={{ 
          marginLeft: window.innerWidth >= 992 ? (sidebarOpen ? '280px' : '80px') : '0'
        }}
      >
        <Container fluid style={{marginTop:'85px'}}>
          {renderContent()}
        </Container>
      </div>
    </div>
  );
};

export default CRMPortal;
