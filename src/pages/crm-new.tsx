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
            <Badge bg={isPositive ? 'success' : 'danger'} className="bg-opacity-75">
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
                      <Badge bg="primary" className="bg-opacity-75 text-dark">{item.count}</Badge>
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
                        <Badge bg="primary" className="bg-opacity-50 text-dark">{lead.stage}</Badge>
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
                        <Badge bg="success" className="bg-opacity-50 text-dark">{opp.stage}</Badge>
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
                        } className="bg-opacity-50 text-dark">
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
                        <Badge bg={prospect.assignedTo ? 'success' : 'warning'} className="bg-opacity-50 text-dark">
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
                  <td><Badge bg="primary" className="bg-opacity-50 text-dark">{call.status}</Badge></td>
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
  const FilterDrawer = () => (
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
                <Form.Select>
                  <option>All Users</option>
                  <option>John Doe (501)</option>
                  <option>Jane Smith (502)</option>
                  <option>Mike Johnson (503)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Phone</Form.Label>
                <Form.Control type="text" placeholder="Enter phone number" />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Campaigns (Multi-select)</Form.Label>
            <Form.Control as="select" multiple>
              <option>Q4 Campaign 2025</option>
              <option>Winter Sale 2025</option>
              <option>Black Friday 2025</option>
            </Form.Control>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Last Call Status</Form.Label>
                <Form.Select>
                  <option>All Statuses</option>
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
                <Form.Select>
                  <option>All Dispositions</option>
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
            <Form.Select>
              <option>All</option>
              <option>Viewed</option>
              <option>Not Viewed</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Last Called Date</Form.Label>
            <Form.Select>
              <option>All Time</option>
              <option>Today</option>
              <option>Yesterday</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Custom date range</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Next Call Scheduled</Form.Label>
            <Form.Select>
              <option>All</option>
              <option>Today</option>
              <option>Tomorrow</option>
              <option>This week</option>
              <option>Next week</option>
              <option>Overdue Calls</option>
              <option>Custom date range</option>
            </Form.Select>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Source Type</Form.Label>
                <Form.Select>
                  <option>All</option>
                  <option>Campaign</option>
                  <option>Import</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Source File</Form.Label>
                <Form.Select>
                  <option>All</option>
                  <option>Q4 Campaign 2025</option>
                  <option>Winter Sale 2025</option>
                  <option>leads_nov_2025.csv</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Tags (Multi-select)</Form.Label>
            <Form.Control as="select" multiple>
              <option>Hot</option>
              <option>Warm</option>
              <option>Cold</option>
              <option>Enterprise</option>
              <option>Follow-up</option>
            </Form.Control>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button variant="secondary" onClick={() => setShowFilterDrawer(false)}>Close</Button>
        <Button variant="outline-secondary">Reset Filters</Button>
        <Button variant="primary">Apply Filters</Button>
      </Modal.Footer>
    </Modal>
  );

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

        {/* Calls Per User Bar Chart */}
        <Card className="border-0 shadow-sm mb-4">
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
          <Card.Body>
            <div style={{ overflowX: 'auto' }}>
              <Table responsive hover>
                <thead className="bg-light">
                  <tr>
                    {selectedColumns.includes('name') && <th>Name</th>}
                    {selectedColumns.includes('phone') && <th>Phone</th>}
                    {selectedColumns.includes('email') && <th>Email</th>}
                    {selectedColumns.includes('dataSource') && <th>Data Source</th>}
                    {selectedColumns.includes('sourceFile') && <th>Source File/Campaign</th>}
                    {selectedColumns.includes('assignedTo') && <th>Assigned To</th>}
                    {selectedColumns.includes('lastCalled') && <th>Last Called</th>}
                    {selectedColumns.includes('lastCallStatus') && <th>Last Call Status</th>}
                    {selectedColumns.includes('callDisposition') && <th>Call Disposition</th>}
                    {selectedColumns.includes('nextCallScheduled') && <th>Next Call Scheduled</th>}
                    {selectedColumns.includes('tags') && <th>Tags</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleProspects.map((prospect) => (
                    <tr key={prospect.id}>
                      {selectedColumns.includes('name') && (
                        <td className="fw-semibold">{prospect.firstName} {prospect.lastName}</td>
                      )}
                      {selectedColumns.includes('phone') && <td>{prospect.phone}</td>}
                      {selectedColumns.includes('email') && <td>{prospect.email}</td>}
                      {selectedColumns.includes('dataSource') && (
                        <td>
                          <Badge bg={prospect.dataSource === 'Campaign' ? 'primary' : 'info'} className="bg-opacity-50 text-dark">
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
                              className="bg-opacity-50 text-dark"
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
                              <Badge key={idx} bg="secondary" className="bg-opacity-50 text-dark">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      )}
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            Quick Actions
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => {
                              setSelectedProspect(prospect);
                              setShowCallHistoryModal(true);
                            }}>
                              <Eye size={14} className="me-2" />
                              View Call History
                            </Dropdown.Item>
                            <Dropdown.Item>
                              <Phone size={14} className="me-2" />
                              Call Now
                            </Dropdown.Item>
                            <Dropdown.Item>
                              <Calendar size={14} className="me-2" />
                              Schedule Call
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => {
                              setSelectedProspect(prospect);
                              setShowLeadModal(true);
                            }}>
                              <UserPlus size={14} className="me-2" />
                              Generate Lead
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item>
                              <Trash2 size={14} className="me-2" />
                              Archive
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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
        {/* Lead Form Modal */}
        <Modal show={showLeadFormModal} onHide={() => { setShowLeadFormModal(false); setEditingLead(null); setLeadFormStep(0); }} size="xl">
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
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Stage</th>
                  <th>Lead Potential</th>
                  <th>Urgency</th>
                  <th>Follow-ups</th>
                  <th>Lead Score</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leadsData.map((lead) => (
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
                            setEditingLead(lead);
                            setShowLeadFormModal(true);
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
                            setEditingDeal({ ...lead, dealValue: '$20,000', stage: 'Proposal' });
                            setShowDealFormModal(true);
                          }}
                        >
                          <Handshake size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">Showing 1 to {leadsData.length} of {leadsData.length} total leads</small>
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



  const renderContent = () => {
    switch (activeScreen) {
      case 'dashboard': return renderDashboard();
      case 'prospects': return renderProspects();
      case 'leads': return renderLeads();
      // case 'deals': return renderDeals();
      // case 'orders': return renderOrders();
      // case 'campaigns': return renderCampaigns();
      // case 'tasks': return renderTasks();
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
