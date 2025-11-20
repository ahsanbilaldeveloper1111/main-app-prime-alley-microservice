import React, { useState, ChangeEvent } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Form, Modal, Dropdown, ProgressBar } from 'react-bootstrap';
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
  CheckCircle,
  XCircle,
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
  Bell
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
            <Badge bg={isPositive ? 'success' : 'danger'} className="bg-opacity-50">
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

const CRMPortal = () => {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [dashboardExpanded, setDashboardExpanded] = useState(false);
  const [showLeadFormModal, setShowLeadFormModal] = useState(false);
  const [showDealFormModal, setShowDealFormModal] = useState(false);
  const [showOrderFormModal, setShowOrderFormModal] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
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
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'name', 'phone', 'dataSource', 'sourceFile', 'assignedTo', 'lastCalled', 'lastCallStatus', 'callDisposition', 'nextCallScheduled'
  ]);
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
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [showExpandedModal, setShowExpandedModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [showAllProspectStats, setShowAllProspectStats] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [campaignFilters, setCampaignFilters] = useState({
    status: [] as string[],
    owner: [] as string[],
    tags: [] as string[],
    priority: [] as string[],
    dateRange: { start: '', end: '' }
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

  // Advanced Filters State
  const [prospectsFilters, setProspectsFilters] = useState({
    campaigns: [] as string[],
    tags: [] as string[],
    assignedTo: '',
    phone: '',
    lastCallStatus: '',
    callDisposition: '',
    viewStatus: '',
    lastCalledDate: '',
    nextCallScheduled: '',
    sourceType: '',
    sourceFile: ''
  });

  const [leadsFilters, setLeadsFilters] = useState({
    stage: [] as string[],
    potential: [] as string[],
    urgency: [] as string[],
    assignedTo: [] as string[],
    dateRange: { start: '', end: '' }
  });

  // View/Edit/Delete Modals
  const [showLeadViewModal, setShowLeadViewModal] = useState(false);
  const [showDealViewModal, setShowDealViewModal] = useState(false);
  const [showOrderViewModal, setShowOrderViewModal] = useState(false);
  const [showProspectViewModal, setShowProspectViewModal] = useState(false);
  const [showCampaignViewModal, setShowCampaignViewModal] = useState(false);
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; data: any } | null>(null);
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
    { id: 5, firstName: 'David', lastName: 'Wilson', phone: '+1234567894', email: 'david.w@email.com', dataSource: 'Campaign', sourceFile: 'Q4 Campaign 2025', assignedTo: 'Tom Brown (505)', lastCalled: '2025-11-14', lastCallStatus: 'Answered', callDisposition: 'Not Interested', nextCallScheduled: '', viewStatus: 'Viewed', tags: ['Cold'], importedBy: 'Manager One (601)', callHistory: [{ date: '2025-11-14', status: 'Answered', comments: 'Not interested at this time' }] }
  ];

  const recentLeads: Lead[] = [
    { id: 1, name: 'Miss Laine', email: 'laine@email.com', phone: '+1234567890', company: 'Tech Corp', stage: 'New', created: 'Nov 17, 2025', lastActivity: 'Nov 17, 2025 17:41', assignedTo: 'John Doe', leadPotential: 'Warm', urgency: 'High', followUpCount: 2, leadScore: 73.5 },
    { id: 2, name: 'Mr. Shayir', email: 'shayir@email.com', phone: '+1234567891', company: 'Digital Inc', stage: 'New', created: 'Nov 17, 2025', lastActivity: 'Nov 17, 2025 17:31', assignedTo: 'Jane Smith', leadPotential: 'Hot', urgency: 'Medium', followUpCount: 1, leadScore: 72.5 },
    { id: 3, name: 'Mr Hassan Khokhar', email: 'hassan@email.com', phone: '+1234567892', company: 'Solutions Ltd', stage: 'Contacted', created: 'Nov 15, 2025', lastActivity: 'Nov 15, 2025 14:55', assignedTo: 'Mike Johnson', leadPotential: 'Hot', urgency: 'High', followUpCount: 3, leadScore: 90.25 },
    { id: 4, name: 'Mr Niazi', email: 'niazi@email.com', phone: '+1234567893', company: 'Global Co', stage: 'New', created: 'Nov 13, 2025', lastActivity: 'Nov 13, 2025 16:40', assignedTo: 'Sarah Williams', leadPotential: 'Cold', urgency: 'Low', followUpCount: 0, leadScore: 0 },
    { id: 5, name: 'Mr Hilal', email: 'hilal@email.com', phone: '+1234567894', company: 'Enterprise Systems', stage: 'Contacted', created: 'Nov 12, 2025', lastActivity: 'Nov 12, 2025 17:18', assignedTo: 'Tom Brown', leadPotential: 'Warm', urgency: 'Medium', followUpCount: 1, leadScore: 50 }
  ];

  const recentOpportunities: Opportunity[] = [
    { id: 1, name: 'Mr Afrasiab Niazi', stage: 'Contacted', value: '£25,000', created: 'Nov 15, 2025', lastActivity: 'Nov 17, 2025 13:33' },
    { id: 2, name: 'M Jaweed Raza', stage: 'Meeting', value: '£18,500', created: 'Nov 15, 2025', lastActivity: 'Nov 15, 2025 13:00' },
    { id: 3, name: 'Waris Saleem', stage: 'Lost', value: '£12,000', created: 'Nov 13, 2025', lastActivity: 'Nov 13, 2025 16:45' },
    { id: 4, name: 'Mr Satya', stage: 'Contacted', value: '£30,000', created: 'Nov 13, 2025', lastActivity: 'Nov 14, 2025 17:40' },
    { id: 5, name: 'Mr.Waqar', stage: 'Won', value: '£45,000', created: 'Nov 08, 2025', lastActivity: 'Nov 08, 2025 15:07' }
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: 'Mr.Waqar', product: 'Enterprise Package', amount: '£45,000', status: 'Delivered', date: 'Nov 08, 2025' },
    { id: 'ORD-002', customer: 'Tech Corp', product: 'Premium Plan', amount: '£25,000', status: 'In Progress', date: 'Nov 15, 2025' },
    { id: 'ORD-003', customer: 'Digital Inc', product: 'Basic Package', amount: '£12,000', status: 'Pending', date: 'Nov 17, 2025' },
    { id: 'ORD-004', customer: 'Solutions Ltd', product: 'Advanced Plan', amount: '£18,500', status: 'Approved', date: 'Nov 16, 2025' },
    { id: 'ORD-005', customer: 'Global Co', product: 'Starter Pack', amount: '£8,000', status: 'Pending', date: 'Nov 18, 2025' }
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

  // Sorting & Pagination Helper Functions
  const handleSort = (column: string, paginationState: any, setPaginationState: Function) => {
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
    setPaginationState: Function,
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
        <Button variant="primary" onClick={() => {
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
        </Button>
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
  const DataAssignmentModal = () => (
    <Modal show={showDataAssignmentModal} onHide={() => setShowDataAssignmentModal(false)} size="lg" centered>
      <Modal.Header closeButton className="border-bottom bg-light">
        <Modal.Title>Data Assignment - Manual Assignment</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="alert alert-info mb-4">
          <AlertCircle size={18} className="me-2" />
          <strong>Assign prospects to users manually.</strong> Select prospects from the table below and assign them to a user.
        </div>

        <Form>
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Assign To User <span className="text-danger">*</span></Form.Label>
            <Form.Select>
              <option value="">Select user...</option>
              <option value="501">John Doe (501)</option>
              <option value="502">Jane Smith (502)</option>
              <option value="503">Mike Johnson (503)</option>
              <option value="504">Sarah Williams (504)</option>
              <option value="505">Tom Brown (505)</option>
            </Form.Select>
          </Form.Group>

          <div className="mb-3">
            <h6 className="fw-semibold mb-3">Select Prospects to Assign ({selectedProspects.length} selected)</h6>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <Table hover size="sm" className="mb-0">
                <thead className="bg-light sticky-top">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProspects(sampleProspects.map(p => p.id));
                          } else {
                            setSelectedProspects([]);
                          }
                        }}
                        checked={selectedProspects.length === sampleProspects.length}
                      />
                    </th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Current Assignment</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleProspects.map((prospect) => (
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
                      <td>{prospect.firstName} {prospect.lastName}</td>
                      <td>{prospect.phone}</td>
                      <td>
                        <Badge bg={prospect.assignedTo ? 'success' : 'warning'} className="bg-opacity-10 text-dark">
                          {prospect.assignedTo || 'Unassigned'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>

          <div className="alert alert-warning mb-0">
            <small><strong>Note:</strong> This will reassign the selected prospects to the chosen user.</small>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button variant="secondary" onClick={() => setShowDataAssignmentModal(false)}>Cancel</Button>
        <Button 
          variant="primary" 
          disabled={selectedProspects.length === 0}
          onClick={() => {
            console.log('Assigning prospects:', selectedProspects);
            alert(`${selectedProspects.length} prospects assigned successfully!`);
            setShowDataAssignmentModal(false);
            setSelectedProspects([]);
          }}
        >
          <UserPlus size={16} className="me-2" />
          Assign Selected ({selectedProspects.length})
        </Button>
      </Modal.Footer>
    </Modal>
  );

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
                        className="bg-opacity-10"
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

  // Filter Drawer Component
  const FilterDrawer = () => {
    const campaigns = ['Q4 Campaign 2025', 'Winter Sale 2025', 'Black Friday 2025', 'Enterprise Outreach'];
    const tags = ['Hot', 'Warm', 'Cold', 'Enterprise', 'Follow-up', 'New'];
    
    const toggleArrayFilter = (array: string[], value: string) => {
      return array.includes(value) ? array.filter(v => v !== value) : [...array, value];
    };

    return (
      <Modal show={showFilterDrawer} onHide={() => setShowFilterDrawer(false)} size="lg">
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>Advanced Filters</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Assigned To</Form.Label>
                  <Form.Select 
                    value={prospectsFilters.assignedTo}
                    onChange={(e) => setProspectsFilters({...prospectsFilters, assignedTo: e.target.value})}
                  >
                    <option value="">All Users</option>
                    <option>John Doe (501)</option>
                    <option>Jane Smith (502)</option>
                    <option>Mike Johnson (503)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Phone</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter phone number"
                    value={prospectsFilters.phone}
                    onChange={(e) => setProspectsFilters({...prospectsFilters, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Campaigns</Form.Label>
              {prospectsFilters.campaigns.length > 0 && (
                <div className="mb-2 d-flex flex-wrap gap-1">
                  {prospectsFilters.campaigns.map((campaign) => (
                    <Badge 
                      key={campaign} 
                      bg="primary" 
                      className="d-flex align-items-center gap-1"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setProspectsFilters({
                        ...prospectsFilters,
                        campaigns: prospectsFilters.campaigns.filter(c => c !== campaign)
                      })}
                    >
                      {campaign} <X size={14} />
                    </Badge>
                  ))}
                </div>
              )}
              <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
                {campaigns.map((campaign) => (
                  <Form.Check
                    key={campaign}
                    type="checkbox"
                    id={`campaign-${campaign}`}
                    label={campaign}
                    checked={prospectsFilters.campaigns.includes(campaign)}
                    onChange={() => setProspectsFilters({
                      ...prospectsFilters,
                      campaigns: toggleArrayFilter(prospectsFilters.campaigns, campaign)
                    })}
                    className="mb-2"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      backgroundColor: prospectsFilters.campaigns.includes(campaign) ? '#e7f3ff' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!prospectsFilters.campaigns.includes(campaign)) {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!prospectsFilters.campaigns.includes(campaign)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      } else {
                        e.currentTarget.style.backgroundColor = '#e7f3ff';
                      }
                    }}
                  />
                ))}
              </div>
              <Form.Text className="text-muted">
                Select one or more campaigns to filter prospects ({prospectsFilters.campaigns.length} selected)
              </Form.Text>
            </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Last Call Status</Form.Label>
                <Form.Select
                  value={prospectsFilters.lastCallStatus}
                  onChange={(e) => setProspectsFilters({...prospectsFilters, lastCallStatus: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option>Answered</option>
                  <option>No Answer</option>
                  <option>Busy</option>
                  <option>Not Called</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Call Disposition</Form.Label>
                <Form.Select
                  value={prospectsFilters.callDisposition}
                  onChange={(e) => setProspectsFilters({...prospectsFilters, callDisposition: e.target.value})}
                >
                  <option value="">All Dispositions</option>
                  <option>Interested</option>
                  <option>Not Interested</option>
                  <option>Callback Required</option>
                  <option>Reschedule</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">View Status</Form.Label>
            <Form.Select
              value={prospectsFilters.viewStatus}
              onChange={(e) => setProspectsFilters({...prospectsFilters, viewStatus: e.target.value})}
            >
              <option value="">All</option>
              <option>Viewed</option>
              <option>Not Viewed</option>
            </Form.Select>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Source Type</Form.Label>
                <Form.Select
                  value={prospectsFilters.sourceType}
                  onChange={(e) => setProspectsFilters({...prospectsFilters, sourceType: e.target.value})}
                >
                  <option value="">All</option>
                  <option>Campaign</option>
                  <option>Import</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Source File</Form.Label>
                <Form.Select
                  value={prospectsFilters.sourceFile}
                  onChange={(e) => setProspectsFilters({...prospectsFilters, sourceFile: e.target.value})}
                >
                  <option value="">All</option>
                  <option>Q4 Campaign 2025</option>
                  <option>Winter Sale 2025</option>
                  <option>leads_nov_2025.csv</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Tags</Form.Label>
            {prospectsFilters.tags.length > 0 && (
              <div className="mb-2 d-flex flex-wrap gap-1">
                {prospectsFilters.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    bg="secondary" 
                    className="d-flex align-items-center gap-1"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setProspectsFilters({
                      ...prospectsFilters,
                      tags: prospectsFilters.tags.filter(t => t !== tag)
                    })}
                  >
                    {tag} <X size={14} />
                  </Badge>
                ))}
              </div>
            )}
            <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
              {tags.map((tag) => (
                <Form.Check
                  key={tag}
                  type="checkbox"
                  id={`tag-${tag}`}
                  label={tag}
                  checked={prospectsFilters.tags.includes(tag)}
                  onChange={() => setProspectsFilters({
                    ...prospectsFilters,
                    tags: toggleArrayFilter(prospectsFilters.tags, tag)
                  })}
                  className="mb-2"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                    backgroundColor: prospectsFilters.tags.includes(tag) ? '#e7f3ff' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!prospectsFilters.tags.includes(tag)) {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!prospectsFilters.tags.includes(tag)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    } else {
                      e.currentTarget.style.backgroundColor = '#e7f3ff';
                    }
                  }}
                />
              ))}
            </div>
            <Form.Text className="text-muted">
              Select one or more tags to filter prospects ({prospectsFilters.tags.length} selected)
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button variant="secondary" onClick={() => setShowFilterDrawer(false)}>Close</Button>
        <Button 
          variant="outline-secondary"
          onClick={() => setProspectsFilters({
            campaigns: [],
            tags: [],
            assignedTo: '',
            phone: '',
            lastCallStatus: '',
            callDisposition: '',
            viewStatus: '',
            lastCalledDate: '',
            nextCallScheduled: '',
            sourceType: '',
            sourceFile: ''
          })}
        >
          Reset Filters
        </Button>
        <Button variant="primary" onClick={() => {
          // Apply filters logic here
          setShowFilterDrawer(false);
        }}>
          Apply Filters
        </Button>
      </Modal.Footer>
    </Modal>
    );
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
    <Modal show={showConfirmDialog} onHide={() => setShowConfirmDialog(false)} centered>
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
            <p className="text-muted small mb-0">This action cannot be undone.</p>
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
        <Button variant="secondary" onClick={() => setShowConfirmDialog(false)}>
          Cancel
        </Button>
        <Button 
          variant={confirmAction?.type === 'delete' ? 'danger' : 'success'}
          onClick={() => {
            if (confirmAction?.type === 'delete') {
              console.log('Deleting:', confirmAction.data);
              alert(`${confirmAction.data?.itemType || 'Item'} deleted successfully`);
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
      <Modal show={showLeadViewModal} onHide={() => setShowLeadViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>Lead Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row className="mb-4">
            <Col md={12}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="mb-0">{viewingLead.name}</h4>
                <Badge bg={viewingLead.stage === 'Qualified' ? 'success' : viewingLead.stage === 'Contacted' ? 'info' : 'secondary'} className="px-3 py-2">
                  {viewingLead.stage}
                </Badge>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Contact Information</h6>
                  <div className="mb-2">
                    <Mail size={16} className="me-2 text-primary" />
                    <strong>Email:</strong> {viewingLead.email}
                  </div>
                  <div className="mb-2">
                    <Phone size={16} className="me-2 text-primary" />
                    <strong>Phone:</strong> {viewingLead.phone}
                  </div>
                  <div className="mb-0">
                    <Building2 size={16} className="me-2 text-primary" />
                    <strong>Company:</strong> {viewingLead.company}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Lead Metrics</h6>
                  <div className="mb-2">
                    <strong>Lead Potential:</strong>{' '}
                    <Badge bg={viewingLead.leadPotential === 'Hot' ? 'danger' : viewingLead.leadPotential === 'Warm' ? 'warning' : 'secondary'}>
                      {viewingLead.leadPotential}
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <strong>Urgency:</strong>{' '}
                    <Badge bg={viewingLead.urgency === 'High' ? 'danger' : viewingLead.urgency === 'Medium' ? 'warning' : 'secondary'}>
                      {viewingLead.urgency}
                    </Badge>
                  </div>
                  <div className="mb-0">
                    <strong>Lead Score:</strong>{' '}
                    <Badge bg={viewingLead.leadScore >= 70 ? 'success' : viewingLead.leadScore >= 40 ? 'warning' : 'danger'} className="px-3">
                      {viewingLead.leadScore}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Additional Details</h6>
                  <div className="mb-2">
                    <strong>Industry:</strong> {viewingLead.industry}
                  </div>
                  <div className="mb-2">
                    <strong>Assigned To:</strong> {viewingLead.assignedUser}
                  </div>
                  <div className="mb-0">
                    <strong>Created:</strong> {viewingLead.created}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Follow-ups</h6>
                  <div className="mb-2">
                    <strong>Total Follow-ups:</strong>{' '}
                    <Badge bg="primary" pill>{viewingLead.followUps?.length || 0}</Badge>
                  </div>
                  {viewingLead.followUps && viewingLead.followUps.length > 0 && (
                    <div className="mt-2">
                      {viewingLead.followUps.map((followUp: any, idx: number) => (
                        <div key={idx} className="small text-muted mb-1">
                          • {followUp.date}: {followUp.notes}
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowLeadViewModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setEditingLead(viewingLead);
              setShowLeadViewModal(false);
              setShowLeadFormModal(true);
            }}
          >
            <Edit size={16} className="me-1" />
            Edit Lead
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Deal View Modal
  const DealViewModal = () => {
    if (!viewingDeal) return null;
    
    return (
      <Modal show={showDealViewModal} onHide={() => setShowDealViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>Deal Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row className="mb-4">
            <Col md={12}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="mb-0">{viewingDeal.name}</h4>
                <Badge bg={viewingDeal.stage === 'Won' ? 'success' : viewingDeal.stage === 'Lost' ? 'danger' : 'primary'} className="px-3 py-2">
                  {viewingDeal.stage}
                </Badge>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Deal Information</h6>
                  <div className="mb-2">
                    <strong>Deal Value:</strong> {viewingDeal.value || viewingDeal.dealValue}
                  </div>
                  <div className="mb-2">
                    <strong>Probability:</strong> <Badge bg="primary">{viewingDeal.probability || 50}%</Badge>
                  </div>
                  <div className="mb-0">
                    <strong>Created:</strong> {viewingDeal.created}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Company Details</h6>
                  <div className="mb-2">
                    <Building2 size={16} className="me-2 text-primary" />
                    <strong>Company:</strong> {viewingDeal.company}
                  </div>
                  <div className="mb-2">
                    <strong>Industry:</strong> {viewingDeal.industry}
                  </div>
                  <div className="mb-0">
                    <strong>Owner:</strong> {viewingDeal.owner}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowDealViewModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setEditingDeal(viewingDeal);
              setShowDealViewModal(false);
              setShowDealFormModal(true);
            }}
          >
            <Edit size={16} className="me-1" />
            Edit Deal
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Order View Modal
  const OrderViewModal = () => {
    if (!viewingOrder) return null;
    
    return (
      <Modal show={showOrderViewModal} onHide={() => setShowOrderViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row className="mb-4">
            <Col md={12}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="mb-0">{viewingOrder.id}</h4>
                <Badge bg={
                  viewingOrder.status === 'Delivered' ? 'success' : 
                  viewingOrder.status === 'In Progress' ? 'info' : 
                  viewingOrder.status === 'Pending' ? 'warning' : 
                  'secondary'
                } className="px-3 py-2">
                  {viewingOrder.status}
                </Badge>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Order Information</h6>
                  <div className="mb-2">
                    <strong>Customer:</strong> {viewingOrder.customer}
                  </div>
                  <div className="mb-2">
                    <strong>Product:</strong> {viewingOrder.product}
                  </div>
                  <div className="mb-0">
                    <strong>Amount:</strong> {viewingOrder.amount}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Additional Details</h6>
                  <div className="mb-2">
                    <strong>Date:</strong> {viewingOrder.date}
                  </div>
                  <div className="mb-2">
                    <strong>Status:</strong> {viewingOrder.status}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowOrderViewModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowOrderViewModal(false);
              // Add edit functionality
            }}
          >
            <Edit size={16} className="me-1" />
            Edit Order
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Prospect View Modal
  const ProspectViewModal = () => {
    if (!viewingProspect) return null;
    
    return (
      <Modal show={showProspectViewModal} onHide={() => setShowProspectViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>Prospect Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row className="mb-4">
            <Col md={12}>
              <h4 className="mb-0">{viewingProspect.firstName} {viewingProspect.lastName}</h4>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Contact Information</h6>
                  <div className="mb-2">
                    <Phone size={16} className="me-2 text-primary" />
                    <strong>Phone:</strong> {viewingProspect.phone}
                  </div>
                  <div className="mb-2">
                    <Mail size={16} className="me-2 text-primary" />
                    <strong>Email:</strong> {viewingProspect.email}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Assignment Details</h6>
                  <div className="mb-2">
                    <strong>Assigned To:</strong> {viewingProspect.assignedTo}
                  </div>
                  <div className="mb-2">
                    <strong>Data Source:</strong> {viewingProspect.dataSource}
                  </div>
                  <div className="mb-0">
                    <strong>Source File:</strong> {viewingProspect.sourceFile}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Call Information</h6>
                  <div className="mb-2">
                    <strong>Last Called:</strong> {viewingProspect.lastCalled || 'Never'}
                  </div>
                  <div className="mb-2">
                    <strong>Last Call Status:</strong>{' '}
                    {viewingProspect.lastCallStatus && (
                      <Badge bg={
                        viewingProspect.lastCallStatus === 'Answered' ? 'success' :
                        viewingProspect.lastCallStatus === 'No Answer' ? 'warning' :
                        'secondary'
                      }>
                        {viewingProspect.lastCallStatus}
                      </Badge>
                    )}
                  </div>
                  <div className="mb-2">
                    <strong>Call Disposition:</strong> {viewingProspect.callDisposition || '-'}
                  </div>
                  <div className="mb-0">
                    <strong>Tags:</strong>{' '}
                    {viewingProspect.tags?.map((tag: string, idx: number) => (
                      <Badge key={idx} bg="secondary" className="me-1">{tag}</Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowProspectViewModal(false)}>
            Close
          </Button>
          <Button 
            variant="success" 
            onClick={() => {
              setSelectedProspect(viewingProspect);
              setShowProspectViewModal(false);
              setShowLeadModal(true);
            }}
          >
            <UserPlus size={16} className="me-1" />
            Generate Lead
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Campaign View Modal
  const CampaignViewModal = () => {
    if (!viewingCampaign) return null;
    
    return (
      <Modal show={showCampaignViewModal} onHide={() => setShowCampaignViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>Campaign Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row className="mb-4">
            <Col md={12}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="mb-0">{viewingCampaign.name}</h4>
                <Badge bg={
                  viewingCampaign.status === 'Active' ? 'success' :
                  viewingCampaign.status === 'Draft' ? 'primary' :
                  viewingCampaign.status === 'Completed' ? 'secondary' :
                  'warning'
                } className="px-3 py-2">
                  {viewingCampaign.status}
                </Badge>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Campaign Information</h6>
                  <div className="mb-2">
                    <strong>Description:</strong> {viewingCampaign.description}
                  </div>
                  <div className="mb-2">
                    <strong>Owner:</strong> {viewingCampaign.owner}
                  </div>
                  <div className="mb-0">
                    <strong>Priority:</strong>{' '}
                    <Badge bg={
                      viewingCampaign.priority === 'High' ? 'danger' :
                      viewingCampaign.priority === 'Medium' ? 'warning' :
                      'info'
                    }>
                      {viewingCampaign.priority}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Performance Metrics</h6>
                  <div className="mb-2">
                    <strong>Goal Metric:</strong> {viewingCampaign.goalMetric}
                  </div>
                  <div className="mb-2">
                    <strong>Goal Label:</strong> {viewingCampaign.goalLabel}
                  </div>
                  <div className="mb-0">
                    <strong>Date Range:</strong> {viewingCampaign.dateRange}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Tags & Comments</h6>
                  <div className="mb-2">
                    <strong>Tags:</strong>{' '}
                    {viewingCampaign.tags?.map((tag: string, idx: number) => (
                      <Badge key={idx} bg="primary" className="me-1 bg-opacity-10 text-primary">{tag}</Badge>
                    ))}
                  </div>
                  <div className="mb-0">
                    <strong>Comments:</strong> {viewingCampaign.comments || 0}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowCampaignViewModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowCampaignViewModal(false);
              // Add edit functionality
            }}
          >
            <Edit size={16} className="me-1" />
            Edit Campaign
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Task View Modal
  const TaskViewModal = () => {
    if (!viewingTask) return null;
    
    return (
      <Modal show={showTaskViewModal} onHide={() => setShowTaskViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title>Task Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row className="mb-4">
            <Col md={12}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="mb-0">{viewingTask.task}</h4>
                <Badge bg={
                  viewingTask.status === 'Completed' ? 'success' :
                  viewingTask.status === 'In Progress' ? 'info' :
                  viewingTask.status === 'Pending' ? 'warning' :
                  'secondary'
                } className="px-3 py-2">
                  {viewingTask.status}
                </Badge>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Task Information</h6>
                  <div className="mb-2">
                    <strong>Type:</strong> {viewingTask.type}
                  </div>
                  <div className="mb-2">
                    <strong>Assigned To:</strong> {viewingTask.assignedTo}
                  </div>
                  <div className="mb-0">
                    <strong>Priority:</strong>{' '}
                    <Badge bg={
                      viewingTask.priority === 'High' ? 'danger' :
                      viewingTask.priority === 'Medium' ? 'warning' :
                      'info'
                    }>
                      {viewingTask.priority}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="text-muted mb-3">Dates & Links</h6>
                  <div className="mb-2">
                    <strong>Due Date:</strong> {viewingTask.dueDate}
                  </div>
                  <div className="mb-2">
                    <strong>Created:</strong> {viewingTask.created}
                  </div>
                  <div className="mb-0">
                    <strong>Related To:</strong> {viewingTask.relatedTo}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowTaskViewModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowTaskViewModal(false);
              // Add edit functionality
            }}
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

  // Prospects Screen
  const renderProspects = () => {
    const availableColumns = [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'dataSource', label: 'Data Source' },
      { key: 'sourceFile', label: 'Source File/Campaign' },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'lastCalled', label: 'Last Called' },
      { key: 'lastCallStatus', label: 'Last Call Status' },
      { key: 'callDisposition', label: 'Call Disposition' },
      { key: 'nextCallScheduled', label: 'Next Call Scheduled' },
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
        {FilterDrawer()}
        {GenerateLeadModal()}
        {DataAssignmentModal()}
        {UploadHistoryModal()}
        {ProspectViewModal()}
        {ConfirmationDialog()}

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Prospects</h2>
            <p className="text-muted mb-0">Manage your prospects and schedule calls</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
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
            <Button variant="primary" onClick={() => setShowProspectModal(true)}>
              <Plus size={16} className="me-2" />
              Add Prospect
            </Button>
          </div>
        </div>

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

        {/* Search and Filter Toolbar */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="bg-light">
            <Row className="align-items-center g-3">
              <Col md={4}>
                <Form.Control type="search" placeholder="Search prospects..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Assigned</option>
                  <option>John Doe (501)</option>
                  <option>Jane Smith (502)</option>
                  <option>Mike Johnson (503)</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Answered</option>
                  <option>No Answer</option>
                  <option>Busy</option>
                  <option>Not Called</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Disposition</option>
                  <option>Interested</option>
                  <option>Not Interested</option>
                  <option>Callback Required</option>
                  <option>Reschedule</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button variant="primary" className="w-100" onClick={() => setShowFilterDrawer(true)}>
                  <Filter size={16} className="me-2" />
                  Filters
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Customize Table Columns */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold">Customize Table Columns</h6>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  <Layers size={14} className="me-1" />
                  Select Columns
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                  <Dropdown.Item onClick={() => setSelectedColumns(['name', 'phone', 'assignedTo'])}>
                    Reset to Default
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Card.Body>
        </Card>

        {/* Prospects Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
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
                    {selectedColumns.includes('email') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('email', prospectsPagination, setProspectsPagination)}
                      >
                        Email {renderSortIcon('email', prospectsPagination)}
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
                    {selectedColumns.includes('tags') && <th>Tags</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sorted = sortData(sampleProspects, prospectsPagination.sortColumn, prospectsPagination.sortDirection);
                    const paginated = paginateData(sorted, prospectsPagination.currentPage, prospectsPagination.rowsPerPage);
                    return paginated.map((prospect) => (
                    <tr key={prospect.id}>
                      {selectedColumns.includes('name') && (
                        <td className="fw-semibold">{prospect.firstName} {prospect.lastName}</td>
                      )}
                      {selectedColumns.includes('phone') && <td>{prospect.phone}</td>}
                      {selectedColumns.includes('email') && <td>{prospect.email}</td>}
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
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              setViewingProspect(prospect);
                              setShowProspectViewModal(true);
                            }}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setShowLeadModal(true);
                            }}
                            title="Generate Lead"
                          >
                            <UserPlus size={16} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setConfirmAction({
                                type: 'delete',
                                data: { ...prospect, itemType: 'Prospect', name: `${prospect.firstName} ${prospect.lastName}` }
                              });
                              setShowConfirmDialog(true);
                            }}
                            title="Delete Prospect"
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
      }
    ];

    return (
      <div>
        {ConfirmationDialog()}
        {LeadViewModal()}
        
        {/* Lead Form Modal */}
        <Modal show={showLeadFormModal} onHide={() => { setShowLeadFormModal(false); setEditingLead(null); setLeadFormStep(0); }} size="xl" style={{ maxWidth: '95%', width: '1200px', margin: '1.75rem auto' }}>
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
                  <small className={`d-block mt-2 ${leadFormStep === 2 ? 'fw-bold text-primary' : 'text-muted'}`}>Contact Info</small>
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
                  <small className={`d-block mt-2 ${leadFormStep === 3 ? 'fw-bold text-primary' : 'text-muted'}`}>Other Info</small>
                </div>
              </div>
            </div>

            {/* Form Content Based on Step */}
            <div style={{ minHeight: '400px' }}>
              {leadFormStep === 0 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-primary">Lead Information</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Lead Type</Form.Label>
                          <Form.Select defaultValue={editingLead?.leadType || ''}>
                            <option value="">Select Type</option>
                            <option value="Inbound">Inbound</option>
                            <option value="Outbound">Outbound</option>
                            <option value="Referral">Referral</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Assigned User</Form.Label>
                          <Form.Select defaultValue={editingLead?.assignedUser || ''}>
                            <option value="">Select User</option>
                            <option value="John Doe">John Doe</option>
                            <option value="Jane Doe">Jane Doe</option>
                            <option value="Sarah Smith">Sarah Smith</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Stage</Form.Label>
                          <Form.Select defaultValue={editingLead?.stage || ''}>
                            <option value="">Select Stage</option>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Unqualified">Unqualified</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Campaign Source</Form.Label>
                          <Form.Control type="text" defaultValue={editingLead?.campaignSource || ''} placeholder="e.g., Google Ads Q4" />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>CRM Attribution</Form.Label>
                          <Form.Select defaultValue={editingLead?.crmAttribution || ''}>
                            <option value="">Select Attribution</option>
                            <option value="Website Form">Website Form</option>
                            <option value="Cold Email">Cold Email</option>
                            <option value="Referral">Referral</option>
                            <option value="Event">Event</option>
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
                    <h5 className="fw-bold mb-4 text-success">Company Information</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Name</Form.Label>
                          <Form.Control type="text" defaultValue={editingLead?.company || ''} placeholder="Company Name" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Industry</Form.Label>
                          <Form.Select defaultValue={editingLead?.industry || ''}>
                            <option value="">Select Industry</option>
                            <option value="Technology">Technology</option>
                            <option value="Finance">Finance</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Retail">Retail</option>
                            <option value="Manufacturing">Manufacturing</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Business Type</Form.Label>
                          <Form.Select defaultValue={editingLead?.businessType || ''}>
                            <option value="">Select Type</option>
                            <option value="B2B">B2B</option>
                            <option value="B2C">B2C</option>
                            <option value="B2G">B2G</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Location</Form.Label>
                          <Form.Control type="text" defaultValue={editingLead?.location || ''} placeholder="City, Country" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Size</Form.Label>
                          <Form.Select defaultValue={editingLead?.companySize || ''}>
                            <option value="">Select Size</option>
                            <option value="1-10">1-10</option>
                            <option value="10-50">10-50</option>
                            <option value="50-200">50-200</option>
                            <option value="200+">200+</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Person</Form.Label>
                          <Form.Control type="text" defaultValue={editingLead?.contactPerson || ''} placeholder="Primary Contact Name" />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {leadFormStep === 2 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-info">Contact Information</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control type="text" defaultValue={editingLead?.name || ''} placeholder="Full Name" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" defaultValue={editingLead?.email || ''} placeholder="email@example.com" />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control type="tel" defaultValue={editingLead?.phone || ''} placeholder="+44 20 1234 5678" />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {leadFormStep === 3 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-warning">Other Information</h5>
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
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Urgency</Form.Label>
                          <Form.Select defaultValue={editingLead?.urgency || ''}>
                            <option value="">Select Urgency</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <div className="alert alert-info small mb-0">
                          <AlertCircle size={14} className="me-1" />
                          Lead score will be auto-calculated based on potential, urgency, and follow-ups
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

        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Leads Management</h2>
            <p className="text-muted mb-0">Track and manage your qualified leads with scoring</p>
          </div>
          <Button variant="primary" onClick={() => setShowLeadFormModal(true)}>
            <Plus size={16} className="me-2" />
            Add Lead
          </Button>
        </div>

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

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="bg-light">
            <Row className="align-items-center">
              <Col md={3}>
                <Form.Control type="search" placeholder="Search leads..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Stages</option>
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Qualified</option>
                  <option>Unqualified</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Potential</option>
                  <option>Hot</option>
                  <option>Warm</option>
                  <option>Cold</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Urgency</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Assigned</option>
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                  <option>Mike Johnson</option>
                </Form.Select>
              </Col>
              <Col md={1}>
                <Button variant="primary" className="w-100">
                  <Filter size={16} />
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Leads Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold">Leads List</h5>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                  <Filter size={16} className="me-1" />
                  Advanced Filters
                </Button>
                <Button variant="outline-success" size="sm">
                  <Download size={16} className="me-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Advanced Filters for Leads */}
            {showAdvancedFilters && (
              <Card className="border bg-light mb-3">
                <Card.Body>
                  <h6 className="mb-3 fw-bold">Advanced Filters</h6>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Stage</Form.Label>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {['New', 'Contacted', 'Qualified', 'Unqualified'].map((stage) => (
                            <Form.Check
                              key={stage}
                              type="checkbox"
                              id={`lead-stage-${stage}`}
                              label={stage}
                              checked={leadsFilters.stage.includes(stage)}
                              onChange={() => setLeadsFilters({
                                ...leadsFilters,
                                stage: leadsFilters.stage.includes(stage) 
                                  ? leadsFilters.stage.filter(s => s !== stage)
                                  : [...leadsFilters.stage, stage]
                              })}
                              className="mb-1"
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Lead Potential</Form.Label>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {['Hot', 'Warm', 'Cold'].map((potential) => (
                            <Form.Check
                              key={potential}
                              type="checkbox"
                              id={`lead-potential-${potential}`}
                              label={potential}
                              checked={leadsFilters.potential.includes(potential)}
                              onChange={() => setLeadsFilters({
                                ...leadsFilters,
                                potential: leadsFilters.potential.includes(potential)
                                  ? leadsFilters.potential.filter(p => p !== potential)
                                  : [...leadsFilters.potential, potential]
                              })}
                              className="mb-1"
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Urgency</Form.Label>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {['High', 'Medium', 'Low'].map((urgency) => (
                            <Form.Check
                              key={urgency}
                              type="checkbox"
                              id={`lead-urgency-${urgency}`}
                              label={urgency}
                              checked={leadsFilters.urgency.includes(urgency)}
                              onChange={() => setLeadsFilters({
                                ...leadsFilters,
                                urgency: leadsFilters.urgency.includes(urgency)
                                  ? leadsFilters.urgency.filter(u => u !== urgency)
                                  : [...leadsFilters.urgency, urgency]
                              })}
                              className="mb-1"
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Assigned To</Form.Label>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'].map((user) => (
                            <Form.Check
                              key={user}
                              type="checkbox"
                              id={`lead-assigned-${user}`}
                              label={user}
                              checked={leadsFilters.assignedTo.includes(user)}
                              onChange={() => setLeadsFilters({
                                ...leadsFilters,
                                assignedTo: leadsFilters.assignedTo.includes(user)
                                  ? leadsFilters.assignedTo.filter(a => a !== user)
                                  : [...leadsFilters.assignedTo, user]
                              })}
                              className="mb-1"
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-end gap-2">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setLeadsFilters({
                        stage: [],
                        potential: [],
                        urgency: [],
                        assignedTo: [],
                        dateRange: { start: '', end: '' }
                      })}
                    >
                      Clear
                    </Button>
                    <Button variant="primary" size="sm">
                      Apply
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
            <div className="table-responsive">
              <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>
                    <Form.Check type="checkbox" />
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('name', leadsPagination, setLeadsPagination)}
                  >
                    Name {renderSortIcon('name', leadsPagination)}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('company', leadsPagination, setLeadsPagination)}
                  >
                    Company {renderSortIcon('company', leadsPagination)}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('email', leadsPagination, setLeadsPagination)}
                  >
                    Email {renderSortIcon('email', leadsPagination)}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('phone', leadsPagination, setLeadsPagination)}
                  >
                    Phone {renderSortIcon('phone', leadsPagination)}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('stage', leadsPagination, setLeadsPagination)}
                  >
                    Stage {renderSortIcon('stage', leadsPagination)}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('leadPotential', leadsPagination, setLeadsPagination)}
                  >
                    Lead Potential {renderSortIcon('leadPotential', leadsPagination)}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('urgency', leadsPagination, setLeadsPagination)}
                  >
                    Urgency {renderSortIcon('urgency', leadsPagination)}
                  </th>
                  <th>Follow-ups</th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('leadScore', leadsPagination, setLeadsPagination)}
                  >
                    Lead Score {renderSortIcon('leadScore', leadsPagination)}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('assignedUser', leadsPagination, setLeadsPagination)}
                  >
                    Assigned To {renderSortIcon('assignedUser', leadsPagination)}
                  </th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('created', leadsPagination, setLeadsPagination)}
                  >
                    Created {renderSortIcon('created', leadsPagination)}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const sorted = sortData(leadsData, leadsPagination.sortColumn, leadsPagination.sortDirection);
                  const paginated = paginateData(sorted, leadsPagination.currentPage, leadsPagination.rowsPerPage);
                  return paginated.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <Form.Check type="checkbox" />
                    </td>
                    <td className="fw-semibold">{lead.name}</td>
                    <td>
                      <div>
                        <div className="fw-medium">{lead.company}</div>
                        <small className="text-muted">{lead.industry}</small>
                      </div>
                    </td>
                    <td>{lead.email}</td>
                    <td>{lead.phone}</td>
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
                    <td className="text-center">
                      <Badge bg="primary" pill>
                        {lead.followUps.length}
                      </Badge>
                    </td>
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
                    <td>{lead.assignedUser}</td>
                    <td>{lead.created}</td>
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
                            setConfirmAction({ type: 'convert-deal', data: lead });
                            setShowConfirmDialog(true);
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
                      </div>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </Table>
            </div>
            {renderPaginationControls(leadsData.length, leadsPagination, setLeadsPagination, 'leads')}
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
        {DealViewModal()}
        {ConfirmationDialog()}
        {/* Deal Form Modal */}
        <Modal show={showDealFormModal} onHide={() => { setShowDealFormModal(false); setEditingDeal(null); }} size="xl" style={{ maxWidth: '95%', width: '1200px', margin: '1.75rem auto' }}>
          <Modal.Header closeButton>
            <Modal.Title>{editingDeal ? 'Edit Deal' : 'Add New Deal'}</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Deal Information Section */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="fw-bold mb-3 text-primary">Deal Information</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Deal Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" defaultValue={editingDeal?.name || ''} placeholder="Enter deal name" />
                      <Form.Text className="text-muted">Enter a descriptive name for this deal</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Deal Value <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" defaultValue={editingDeal?.dealValue || ''} placeholder="£0.00" />
                      <Form.Text className="text-muted">Enter the total value of this deal</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stage <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.stage || ''}>
                        <option value="">Select Stage</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Contract Sent">Contract Sent</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Current stage in the sales pipeline</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Expected Close Date</Form.Label>
                      <Form.Control type="date" defaultValue={editingDeal?.expectedCloseDate || ''} />
                      <Form.Text className="text-muted">When do you expect to close this deal?</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Probability <span className="text-muted small">(Auto-syncs with stage)</span></Form.Label>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Range defaultValue={editingDeal?.probability || 50} style={{ flex: 1 }} />
                        <Badge bg="primary" style={{ minWidth: '60px' }}>{editingDeal?.probability || 50}%</Badge>
                      </div>
                      <Form.Text className="text-muted">Likelihood of closing this deal</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Company Information Section */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="fw-bold mb-3 text-success">Company Information <span className="text-muted small">(Auto-fetched from Lead)</span></h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Company Name</Form.Label>
                      <Form.Control type="text" defaultValue={editingDeal?.company || ''} disabled />
                      <Form.Text className="text-muted">Company name from lead record</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Industry</Form.Label>
                      <Form.Control type="text" defaultValue={editingDeal?.industry || ''} disabled />
                      <Form.Text className="text-muted">Industry from lead record</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Person</Form.Label>
                      <Form.Control type="text" defaultValue={editingDeal?.contactPerson || ''} disabled />
                      <Form.Text className="text-muted">Primary contact from lead</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Owner <span className="text-danger">*</span></Form.Label>
                      <Form.Select defaultValue={editingDeal?.owner || ''}>
                        <option value="">Select Owner</option>
                        <option value="John Doe">John Doe</option>
                        <option value="Jane Doe">Jane Doe</option>
                        <option value="Sarah Smith">Sarah Smith</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Assign a deal owner</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Deal Characteristics Section */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="fw-bold mb-3 text-info">Deal Characteristics</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Deal Type</Form.Label>
                      <Form.Select defaultValue={editingDeal?.dealType || ''}>
                        <option value="">Select Type</option>
                        <option value="New Sale">New Sale</option>
                        <option value="Renewal">Renewal</option>
                        <option value="Migration">Migration</option>
                        <option value="Cross-sell">Cross-sell</option>
                        <option value="Upsell">Upsell</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Type of deal (new, renewal, upsell, etc.)</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contract Length</Form.Label>
                      <Form.Select defaultValue={editingDeal?.contractLength || ''}>
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
                      <Form.Label>Billing Model</Form.Label>
                      <Form.Select defaultValue={editingDeal?.billingModel || ''}>
                        <option value="">Select Model</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                        <option value="One-time">One-time</option>
                      </Form.Select>
                      <Form.Text className="text-muted">How often customer will be billed</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Terms</Form.Label>
                      <Form.Select defaultValue={editingDeal?.paymentTerms || ''}>
                        <option value="">Select Terms</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                        <option value="Upfront">Upfront</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Payment terms for the deal</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Risk Level</Form.Label>
                      <Form.Select defaultValue={editingDeal?.riskLevel || ''}>
                        <option value="">Select Risk</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Risk assessment for this deal</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Competitors</Form.Label>
                      <Form.Control 
                        type="text" 
                        defaultValue={editingDeal?.competitors?.join(', ') || ''} 
                        placeholder="Comma separated (e.g., Company A, Company B)"
                      />
                      <Form.Text className="text-muted">Competing companies for this deal</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Negotiation Progress Section */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                <h6 className="fw-bold mb-3 text-warning">Negotiation Progress</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox" 
                        label="Quotation Sent" 
                        defaultChecked={editingDeal?.quotationSent || false}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Check 
                            type="checkbox" 
                            label="Contract Sent" 
                            defaultChecked={editingDeal?.contractSent || false}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="alert alert-info small mb-0">
                      <AlertCircle size={14} className="me-1" />
                      Track key milestones in the negotiation process
                    </div>
              </Card.Body>
            </Card>

            {/* Estimation Chart Section */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-success">Estimation Chart</h6>
                      <Button variant="outline-primary" size="sm">
                        <Plus size={14} className="me-1" />
                        Add Item
                      </Button>
                    </div>
                    <Table size="sm" hover className="bg-white">
                      <thead>
                        <tr>
                          <th>Version</th>
                          <th>Product/Service</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Discount %</th>
                          <th>Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingDeal?.estimations?.map((est: any, index: number) => (
                          <tr key={index}>
                            <td><Badge bg="primary">{est.version}</Badge></td>
                            <td>{est.product}</td>
                            <td>{est.quantity}</td>
                            <td>£{est.price.toLocaleString()}</td>
                            <td>{est.discount}%</td>
                            <td className="fw-bold">£{est.total.toLocaleString()}</td>
                            <td>
                              <Button variant="link" size="sm" className="p-0">
                                <Edit size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {(!editingDeal?.estimations || editingDeal.estimations.length === 0) && (
                          <tr>
                            <td colSpan={7} className="text-center text-muted">No estimations added</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                    {editingDeal?.estimations && editingDeal.estimations.length > 0 && (
                      <div className="text-end mt-2">
                        <h5 className="mb-0">
                          Grand Total: <span className="text-success">£{editingDeal.estimations.reduce((sum: number, est: any) => sum + est.total, 0).toLocaleString()}</span>
                        </h5>
                      </div>
                    )}
              </Card.Body>
            </Card>

            {/* Meetings Section */}
            <Card className="mb-3 border-0 bg-light">
              <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-danger">Meetings</h6>
                      <Button variant="outline-primary" size="sm">
                        <Plus size={14} className="me-1" />
                        Schedule Meeting
                      </Button>
                    </div>
                    <Table size="sm" hover className="bg-white">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Outcome</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingDeal?.meetings?.map((meeting: any, index: number) => (
                          <tr key={index}>
                            <td>{meeting.date}</td>
                            <td>
                              <Badge bg={
                                meeting.type === 'In-person' ? 'primary' :
                                meeting.type === 'Online' ? 'info' :
                                'secondary'
                              }>
                                {meeting.type}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={meeting.outcome === 'Positive' ? 'success' : 'warning'}>
                                {meeting.outcome}
                              </Badge>
                            </td>
                            <td>
                              <Button variant="link" size="sm" className="p-0">
                                <Eye size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {(!editingDeal?.meetings || editingDeal.meetings.length === 0) && (
                          <tr>
                            <td colSpan={4} className="text-center text-muted">No meetings scheduled</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowDealFormModal(false); setEditingDeal(null); }}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              className="me-auto"
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
          </Modal.Footer>
        </Modal>

        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Deals & Opportunities</h2>
            <p className="text-muted mb-0">Manage your sales pipeline and deals</p>
          </div>
          <Button variant="primary" onClick={() => setShowDealFormModal(true)}>
            <Plus size={16} className="me-2" />
            Add Deal
          </Button>
        </div>

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

        {/* Deals Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold">Deals Pipeline</h5>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm">
                  <Filter size={16} className="me-1" />
                  Filter
                </Button>
                <Button variant="outline-success" size="sm">
                  <Download size={16} className="me-1" />
                  Export
                </Button>
              </div>
            </div>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>
                    <Form.Check type="checkbox" />
                  </th>
                  <th>Deal Name</th>
                  <th>Company</th>
                  <th>Stage</th>
                  <th>Deal Type</th>
                  <th>Value</th>
                  <th>Probability</th>
                  <th>Expected Close</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dealsData.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <Form.Check type="checkbox" />
                    </td>
                    <td className="fw-semibold">{deal.name}</td>
                    <td>
                      <div>
                        <div className="fw-medium">{deal.company}</div>
                        <small className="text-muted">{deal.industry}</small>
                      </div>
                    </td>
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
                    <td>
                      <Badge bg="primary" className="bg-opacity-10 text-dark">
                        {deal.dealType}
                      </Badge>
                    </td>
                    <td className="fw-semibold">{deal.dealValue}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <ProgressBar 
                          now={deal.probability} 
                          style={{ width: '60px', height: '8px' }}
                        />
                        <small>{deal.probability}%</small>
                      </div>
                    </td>
                    <td>{deal.expectedCloseDate}</td>
                    <td>{deal.owner}</td>
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
                ))}
              </tbody>
            </Table>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">Showing 1 to {dealsData.length} of {dealsData.length} total deals</small>
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Orders Management</h2>
            <p className="text-muted mb-0">Track and fulfill customer orders</p>
          </div>
          <Button variant="primary" onClick={() => setShowOrderFormModal(true)}>
            <Plus size={16} className="me-2" />
            Add Order
          </Button>
        </div>

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

        {/* Orders Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold">Orders List</h5>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm">
                  <Filter size={16} className="me-1" />
                  Filter
                </Button>
                <Button variant="outline-success" size="sm">
                  <Download size={16} className="me-1" />
                  Export
                </Button>
              </div>
            </div>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>
                    <Form.Check type="checkbox" />
                  </th>
                  <th>Order ID</th>
                  <th>Linked Deal</th>
                  <th>Customer (POC)</th>
                  <th>Value</th>
                  <th>Approval</th>
                  <th>Stage</th>
                  <th>Fulfillment</th>
                  <th>Progress</th>
                  <th>Priority</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersData.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Form.Check type="checkbox" />
                    </td>
                    <td className="fw-semibold">{order.id}</td>
                    <td>
                      <div>
                        <div className="fw-medium">{order.linkedDeal}</div>
                        <Button variant="link" size="sm" className="p-0 text-decoration-none small">
                          <Eye size={12} className="me-1" />
                          View Deal
                        </Button>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-medium">{order.pocName}</div>
                        <small className="text-muted">{order.pocTitle}</small>
                      </div>
                    </td>
                    <td className="fw-semibold">{order.value}</td>
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
                    <td>
                      <Badge bg="info">
                        {order.stage}
                      </Badge>
                    </td>
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
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <ProgressBar 
                          now={order.progressPercent} 
                          style={{ width: '60px', height: '8px' }}
                        />
                        <small>{order.progressPercent}%</small>
                      </div>
                    </td>
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
                    <td>{order.orderDate}</td>
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
                ))}
              </tbody>
            </Table>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">Showing 1 to {ordersData.length} of {ordersData.length} total orders</small>
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
        {CampaignViewModal()}
        {ConfirmationDialog()}
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Campaigns Management</h2>
            <p className="text-muted mb-0">Create and manage marketing campaigns</p>
          </div>
          <Button variant="primary">
            <Plus size={16} className="me-2" />
            New Campaign
          </Button>
        </div>

        {/* KPI Cards */}
        <Row className="mb-4">
          {campaignKPIData.map((kpi, index) => (
            <Col lg={3} md={6} key={index} className="mb-3">
              <KPICard {...kpi} />
            </Col>
          ))}
        </Row>

        {/* Search Bar - Full Width */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body>
            <div className="position-relative">
              <Search size={18} className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
              <Form.Control 
                type="search" 
                placeholder="Search campaigns by name, dates, owner, or status..." 
                style={{ paddingLeft: '40px' }}
                size="lg"
              />
            </div>
          </Card.Body>
        </Card>

        {/* Filter Controls */}
        <div className="d-flex gap-2 justify-content-between align-items-center mb-4 flex-wrap">
          <div className="d-flex gap-2">
            <Button 
              variant={showAdvancedFilters ? 'primary' : 'outline-secondary'}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} className="me-2" />
              Filters
              {(campaignFilters.status.length + campaignFilters.tags.length + campaignFilters.priority.length) > 0 && (
                <Badge bg="light" text="dark" className="ms-2">
                  {campaignFilters.status.length + campaignFilters.tags.length + campaignFilters.priority.length}
                </Badge>
              )}
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary">
                <TrendingUp size={16} className="me-2" />
                Sort
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>Date Created (Newest)</Dropdown.Item>
                <Dropdown.Item>Date Created (Oldest)</Dropdown.Item>
                <Dropdown.Item>Name (A-Z)</Dropdown.Item>
                <Dropdown.Item>Name (Z-A)</Dropdown.Item>
                <Dropdown.Item>Priority (High to Low)</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <Button variant="outline-secondary">
            <Download size={16} className="me-2" />
            Export
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h6 className="mb-3 fw-bold">Advanced Filters</h6>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Status</Form.Label>
                    {['Active', 'Draft', 'Completed', 'Paused'].map(status => (
                      <Form.Check
                        key={status}
                        type="checkbox"
                        label={status}
                        checked={campaignFilters.status.includes(status)}
                        onChange={(e) => {
                          setCampaignFilters(prev => ({
                            ...prev,
                            status: e.target.checked 
                              ? [...prev.status, status]
                              : prev.status.filter(s => s !== status)
                          }));
                        }}
                      />
                    ))}
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Priority</Form.Label>
                    {['High', 'Medium', 'Low'].map(priority => (
                      <Form.Check
                        key={priority}
                        type="checkbox"
                        label={priority}
                        checked={campaignFilters.priority.includes(priority)}
                        onChange={(e) => {
                          setCampaignFilters(prev => ({
                            ...prev,
                            priority: e.target.checked 
                              ? [...prev.priority, priority]
                              : prev.priority.filter(p => p !== priority)
                          }));
                        }}
                      />
                    ))}
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Owner</Form.Label>
                    {['Sarah Williams', 'John Doe', 'Mike Johnson', 'Jane Smith'].map(owner => (
                      <Form.Check
                        key={owner}
                        type="checkbox"
                        label={owner}
                        checked={campaignFilters.owner.includes(owner)}
                        onChange={(e) => {
                          setCampaignFilters(prev => ({
                            ...prev,
                            owner: e.target.checked 
                              ? [...prev.owner, owner]
                              : prev.owner.filter(o => o !== owner)
                          }));
                        }}
                      />
                    ))}
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Date Range</Form.Label>
                    <Form.Control 
                      type="date" 
                      size="sm" 
                      className="mb-2"
                      placeholder="Start Date"
                      value={campaignFilters.dateRange.start}
                      onChange={(e) => setCampaignFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                    />
                    <Form.Control 
                      type="date" 
                      size="sm"
                      placeholder="End Date"
                      value={campaignFilters.dateRange.end}
                      onChange={(e) => setCampaignFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex gap-2">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => {
                    // Apply filters logic here
                    console.log('Applying filters:', campaignFilters);
                  }}
                >
                  Apply Filters
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => {
                    setCampaignFilters({
                      status: [],
                      owner: [],
                      tags: [],
                      priority: [],
                      dateRange: { start: '', end: '' }
                    });
                  }}
                >
                  Clear All
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Selectable Filter Tags */}
        <div className="mb-4 d-flex gap-2 flex-wrap">
          <Badge 
            bg={activeFilter === 'all' ? 'primary' : 'light'} 
            text={activeFilter === 'all' ? 'white' : 'dark'}
            style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => setActiveFilter('all')}
          >
            All Campaigns (15)
          </Badge>
          <Badge 
            bg={activeFilter === 'my' ? 'primary' : 'light'} 
            text={activeFilter === 'my' ? 'white' : 'dark'}
            style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => setActiveFilter('my')}
          >
            My Campaigns (3)
          </Badge>
          <Badge 
            bg={activeFilter === 'drafts' ? 'primary' : 'light'} 
            text={activeFilter === 'drafts' ? 'white' : 'dark'}
            style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => setActiveFilter('drafts')}
          >
            Drafts (4)
          </Badge>
          <Badge 
            bg={activeFilter === 'ending-soon' ? 'warning' : 'light'} 
            text={activeFilter === 'ending-soon' ? 'dark' : 'dark'}
            style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => setActiveFilter('ending-soon')}
          >
            Ending Soon (1)
          </Badge>
          <Badge 
            bg={activeFilter === 'no-owner' ? 'danger' : 'light'} 
            text={activeFilter === 'no-owner' ? 'white' : 'dark'}
            style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => setActiveFilter('no-owner')}
          >
            No Owner (2)
          </Badge>
          <Badge 
            bg={activeFilter === 'high-priority' ? 'info' : 'light'} 
            text={activeFilter === 'high-priority' ? 'white' : 'dark'}
            style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => setActiveFilter('high-priority')}
          >
            High Priority (2)
          </Badge>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCampaigns.length > 0 && (
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
        )}

        {/* Campaigns Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <span>Showing</span>
                <Form.Select size="sm" style={{ width: 'auto' }}>
                  <option value="15">15</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </Form.Select>
                <span>results</span>
              </div>
              <Button variant="outline-secondary" size="sm">
                <Layers size={14} className="me-1" />
                Customize Columns
              </Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '40px' }}>
                      <Form.Check 
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCampaigns(campaigns.map(c => c.id));
                          } else {
                            setSelectedCampaigns([]);
                          }
                        }}
                      />
                    </th>
                    <th>Campaign Name</th>
                    <th>Owner</th>
                    <th>Tags</th>
                    <th>Status</th>
                    <th>Goal Metric</th>
                    <th>Date Range</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns
                    .filter(campaign => {
                      // Apply filters
                      if (activeFilter === 'my') return campaign.owner === 'Sarah Williams'; // Example user
                      if (activeFilter === 'drafts') return campaign.status === 'Draft';
                      if (activeFilter === 'ending-soon') return campaign.id === 1; // Example
                      if (activeFilter === 'no-owner') return !campaign.owner;
                      if (activeFilter === 'high-priority') return campaign.priority === 'High';
                      
                      // Advanced filters
                      if (campaignFilters.status.length > 0 && !campaignFilters.status.includes(campaign.status)) return false;
                      if (campaignFilters.owner.length > 0 && !campaignFilters.owner.includes(campaign.owner)) return false;
                      if (campaignFilters.priority.length > 0 && !campaignFilters.priority.includes(campaign.priority)) return false;
                      
                      return true;
                    })
                    .map((campaign) => (
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
                      <td>
                        <div>
                          <a href="#" className="fw-semibold text-primary text-decoration-none">
                            {campaign.name}
                          </a>
                          {campaign.comments > 0 && (
                            <Badge bg="info" className="ms-2 bg-opacity-50 text-info">
                              {campaign.comments} comments
                            </Badge>
                          )}
                          <div className="small text-muted mt-1">{campaign.description}</div>
                        </div>
                      </td>
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
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {campaign.tags.map((tag, idx) => (
                            <Badge key={idx} bg="primary" className="bg-opacity-50 text-primary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge 
                          bg={
                            campaign.status === 'Active' ? 'success' :
                            campaign.status === 'Draft' ? 'primary' :
                            campaign.status === 'Completed' ? 'secondary' :
                            'warning'
                          }
                          className="bg-opacity-50 text-dark"
                        >
                          {campaign.status}
                        </Badge>
                      </td>
                      <td>
                        <div>
                          <div className={`fw-bold ${campaign.goalMetric === '--' ? 'text-danger' : ''}`}>
                            {campaign.goalMetric}
                          </div>
                          <small className={campaign.goalMetric === '--' ? 'text-danger fw-semibold' : 'text-muted'}>
                            {campaign.goalLabel}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-semibold small">{campaign.dateRange.split(' - ')[0]}</div>
                          <small className="text-muted">
                            {campaign.status === 'Completed' ? 'Ended' : campaign.status === 'Draft' ? 'Starts' : 'Ends'}: {campaign.dateRange.split(' - ')[1]}
                          </small>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">{campaign.created}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-muted"
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
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="d-flex justify-content-between align-items-center p-4 border-top">
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
          <Button variant="primary" onClick={() => setShowTaskModal(true)}>
            <Plus size={16} className="me-2" />
            Create Task
          </Button>
        </div>

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

        {/* Tasks Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
              <h5 className="mb-2 mb-md-0 fw-bold">All Tasks</h5>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm">
                  <Filter size={16} className="me-1" />
                  Filter
                </Button>
                <Button variant="outline-success" size="sm">
                  <Download size={16} className="me-1" />
                  Export
                </Button>
              </div>
            </div>
            <div className="table-responsive">
              <Table hover>
                <thead className="bg-light">
                  <tr>
                    <th>
                      <Form.Check type="checkbox" />
                    </th>
                    <th>Task</th>
                    <th>Assigned To</th>
                    <th>Contact</th>
                    <th>Company</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksData.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <Form.Check type="checkbox" />
                      </td>
                      <td>
                        <div className="fw-semibold">{task.title}</div>
                        <small className="text-muted">Assigned: {task.dateAssigned}</small>
                      </td>
                      <td>{task.assignedTo}</td>
                      <td>
                        <div className="fw-medium">{task.prospect}</div>
                        <small className="text-muted">{task.email}</small>
                      </td>
                      <td>{task.company}</td>
                      <td>
                        <Badge bg={
                          task.urgency === 'High' ? 'danger' :
                          task.urgency === 'Medium' ? 'warning' :
                          'secondary'
                        }>
                          {task.urgency}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={
                          task.status === 'Completed' ? 'success' :
                          task.status === 'In Progress' ? 'info' :
                          'warning'
                        }>
                          {task.status}
                        </Badge>
                      </td>
                      <td>{task.dueDate}</td>
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
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3">
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
      { id: 1, name: 'Prospect', color: '#6c757d', order: 1, conversion: '45%', avgDuration: '3 days', count: 241, description: 'Initial contact or imported lead', automated: false },
      { id: 2, name: 'Qualified Lead', color: '#0d6efd', order: 2, conversion: '68%', avgDuration: '5 days', count: 58, description: 'Lead has been qualified and shows interest', automated: true },
      { id: 3, name: 'Contact Made', color: '#17a2b8', order: 3, conversion: '52%', avgDuration: '2 days', count: 34, description: 'First successful contact established', automated: false },
      { id: 4, name: 'Needs Analysis', color: '#ffc107', order: 4, conversion: '70%', avgDuration: '7 days', count: 18, description: 'Understanding customer requirements', automated: false },
      { id: 5, name: 'Proposal Sent', color: '#fd7e14', order: 5, conversion: '55%', avgDuration: '4 days', count: 12, description: 'Proposal or quote sent to prospect', automated: true },
      { id: 6, name: 'Negotiation', color: '#dc3545', order: 6, conversion: '75%', avgDuration: '6 days', count: 8, description: 'Active negotiation and discussion', automated: false },
      { id: 7, name: 'Deal Won', color: '#28a745', order: 7, conversion: '100%', avgDuration: '1 day', count: 15, description: 'Deal successfully closed', automated: true },
      { id: 8, name: 'Order Placed', color: '#20c997', order: 8, conversion: '100%', avgDuration: '0 days', count: 15, description: 'Order has been confirmed and placed', automated: false }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Stages Management</h2>
            <p className="text-muted mb-0">Configure and manage your sales pipeline stages</p>
          </div>
          <Button variant="primary">
            <Plus size={16} className="me-2" />
            Add Custom Stage
          </Button>
        </div>

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
              value="386"
              icon={<TrendingUp size={24} />}
              color="success"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard 
              title="Avg Conversion Rate"
              value="65.6%"
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

        {/* Pipeline Stages Table */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0 fw-bold">Sales Pipeline Stages</h5>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm">
                  <Edit size={16} className="me-1" />
                  Reorder Stages
                </Button>
                <Button variant="outline-info" size="sm">
                  <Download size={16} className="me-1" />
                  Export Configuration
                </Button>
              </div>
            </div>

            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th style={{ width: '50px' }}>Order</th>
                  <th>Stage Name</th>
                  <th>Description</th>
                  <th>Color</th>
                  <th>Records</th>
                  <th>Conversion Rate</th>
                  <th>Avg Duration</th>
                  <th>Automation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pipelineStages.map((stage) => (
                  <tr key={stage.id}>
                    <td className="text-center fw-bold">{stage.order}</td>
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
                    <td className="small text-muted">{stage.description}</td>
                    <td>
                      <Badge style={{ backgroundColor: stage.color }}>
                        {stage.color}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="primary" pill className="bg-opacity-50 text-dark">
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
                        <Badge bg="success" className="bg-opacity-50">
                          <CheckCircle size={14} className="me-1" />
                          Automated
                        </Badge>
                      ) : (
                        <Badge bg="secondary" className="bg-opacity-50">
                          Manual
                        </Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="link" size="sm" className="p-1" title="Edit Stage">
                          <Edit size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1" title="Configure Rules">
                          <GitBranch size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1 text-danger" title="Delete Stage">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
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

  // Activity Tracker Screen
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Activity Tracker</h2>
            <p className="text-muted mb-0">Monitor all CRM activities and conversions in real-time</p>
          </div>
          <div className="d-flex gap-2">
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
                          className="bg-opacity-50"
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
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
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
      // case 'stages': return renderStages();
      // case 'activities': return renderActivities();
      // case 'reports': return renderReports();
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
            margin-left: 280px;
          }
        }

        @media (max-width: 991px) {
          .content-wrapper {
            padding: 1rem;
          }
        }

        /* Responsive Tables */
        @media (max-width: 768px) {
          .table thead {
            display: none;
          }
          .table tbody tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
          }
          .table tbody td {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem;
            border: none;
            border-bottom: 1px solid #dee2e6;
          }
          .table tbody td:last-child {
            border-bottom: none;
          }
          .table tbody td::before {
            content: attr(data-label);
            font-weight: bold;
            margin-right: 1rem;
          }
        }

        /* KPI Cards Responsive */
        @media (max-width: 576px) {
          .kpi-card {
            margin-bottom: 1rem;
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
      <div className="content-wrapper">
        <Container fluid style={{marginTop:'85px'}}>
          {renderContent()}
        </Container>
      </div>
    </div>
  );
};

export default CRMPortal;
