import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, ProgressBar, Form, Alert, Modal, InputGroup, Dropdown, Breadcrumb  } from 'react-bootstrap';

import { 
  LayoutDashboard, 
  Ticket, 
  Tags, 
  Package, 
  Layers, 
  List,
  ChevronLeft,
  ChevronRight,
  FolderOpen, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Eye,
  Edit,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check, 
  X, 
  Upload, 
  Info,
  Plus,
  MessageSquare,
  Send,


  Filter,
  Search,
 
  Paperclip,
  Clock,
  User,
  MessageCircle,
  AlertCircle,
  
  Calendar,
  Tag,
  FileText,

  BarChart2,

   PieChart,

   BarChart3, Grid, TrendingUp, Grid3x3, Box, FolderTree, Home 
  
} from 'lucide-react';
import {
    BarChart as ReBarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    Pie as RePie,
    PieChart as RePieChart,
    Cell,
    Legend as RechartsLegend,
    ResponsiveContainer,
    CartesianGrid,
    LabelList,
  } from 'recharts';
// import { Download, Ticket, FolderOpen, CheckCircle, AlertTriangle, ArrowUp, ArrowDown, Eye, Edit, BarChart2, PieChart, Plus } from 'react-feather';
// import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import "@assets/scss/ticketsnew.scss";
import ExpandableSidebar from '@components/updated-sidebar'
import ModuleDistributionCard from '@components/distribution-updated'

// Type Definitions
interface Comment {
    id: number;
    user: string;
    userRole: string;
    comment: string;
    timestamp: string;
    type: 'comment' | 'status_change' | 'assignment' | 'internal_note';
    isInternal?: boolean; // For internal notes
    attachments?: Array<{
        id: number;
        name: string;
        size: string;
        url: string;
    }>;
}

interface TicketType {
    id: number;
    title: string;
    type: string;
    description: string;
    userExtension: string;
    createdBy: string;
    status: string;
    module: string;
    priority: string;
    dueDate: string;
    createdAt: string;
    assignedTo?: string;
    isInternal?: boolean; // For internal/external tickets
    initialAttachments?: Array<{
        id: number;
        name: string;
        size: string;
        url: string;
    }>;
}

interface StatusType {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

interface ModuleType {
  id: number;
  name: string;
  description: string;
  color: string;
  userExtension: string;
  createdAt: string;
}

interface SubmoduleType {
  id: number;
  name: string;
  description: string;
  module: string;
  createdAt: string;
}

interface CategoryType {
    id: number;
    name: string;
    description: string;
    module: string;
    createdAt: string;
  }
  
  interface NewCategoryType {
    id: number;
    name: string;
    module: string;
  }
  interface SubCategoryType {
    id: number;
    name: string;
    description: string;
    module: string;
    category: string;
    createdAt: string;
  }

  interface NewModuleType {
    id: number;
    name: string;
    color: string;
  }

interface TicketTypeData {
  id: number;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

interface FilterState {
  search: string;
  status: string;
  priority: string;
  module: string;
  type: string;
}

interface NewTicketFormData {
    title: string;
    type: string;
    description: string;
    status: string;
    module: string;
    submodule: string;
    submoduleChild: string;
    primaryIssue: string;
    specificProblem: string;
    priority: string;
    dueDate: string;
    image: File | null;
    userExtension: string;
    isInternal: boolean; // NEW
    attachments: File[]; // NEW - for multiple attachments
  }

interface FormErrors {
  [key: string]: string;
}

interface KPIData {
  title: string;
  value: number;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  color: string;
}

interface PriorityDistribution {
  priority: string;
  count: number;
  percentage: number;
  color: string;
}

interface ModuleDistribution {
  module: string;
  count: number;
}

interface MenuItemType {
  id: string;
  title: string;
  icon: React.ReactNode;
}

// type ScreenType = 'dashboard' | 'tickets' | 'status' | 'modules' | 'categories'  | 'subcategories' | 'types';
type ScreenType = 
  | 'dashboard' | 'tickets' | 'modules' | 'categories' | 'subcategories' | 'types' | 'status'
  | 'customer-dashboard' | 'account-overview' | 'product-details' | 'billing-history' | 'payment-method' | 'expenses-reports'
  | 'reseller-dashboard' | 'customer-management' | 'sales-orders' | 'commission-payouts' | 'products-pricing' | 'reseller-reports' | 'invoicing-billing'
  | 'vendor-dashboard' | 'product-management' | 'reseller-management' | 'order-management' | 'revenue-commission' | 'vendor-customer-management' | 'inventory-management' | 'supplier-management' | 'vendor-reports';

// Main Component
const TicketDashboard: React.FC = () => {
//   const [activeScreen, setActiveScreen] = useState<ScreenType>('dashboard');
//   const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

 
  const [sidebarOpen, setSidebarOpen] = useState(true);
const [activeScreen, setActiveScreen] = useState('dashboard');

  const [tickets, setTickets] = useState<TicketType[]>([
    
    {
      id: 88,
      title: 'Test Ticket',
      type: 'Test Type',
      description: 'Test Ticket description by asad 123456456879789789...',
      userExtension: 'Not assigned',
      createdBy: 'Usman Akram (512)',
      status: 'Test Status',
      module: 'Test Module',
      priority: 'High',
      dueDate: '24/10/2025',
      createdAt: '22/10/2025',
     
    },
    {
      id: 87,
      title: 'ticket 87',
      type: 'Change Request',
      description: 'wfwennjknjk wfwennjknjk ...',
      userExtension: 'Not assigned',
      createdBy: 'Ocean Agent 01 (3601)',
      status: 'Open',
      module: 'Omni Channel',
      priority: 'Low',
      dueDate: 'No due date',
      createdAt: '25/09/2025',
      
    },
    {
      id: 86,
      title: 'ticket 86',
      type: 'Service Request',
      description: 'jnndwnedn jnndwnedn...',
      userExtension: 'Not assigned',
      createdBy: 'Ocean Agent 01 (3601)',
      status: 'Open',
      module: 'Call Logs',
      priority: 'Low',
      dueDate: 'No due date',
      createdAt: '25/09/2025',
     
    },
    {
      id: 84,
      title: 'Call Log Timezone',
      type: 'Incident',
      description: 'The timestamps in the Call Logs ...',
      userExtension: 'Not assigned',
      createdBy: '525',
      status: 'Resolved',
      module: 'Call Logs',
      priority: 'High',
      dueDate: '17/09/2025',
      createdAt: '15/09/2025',
     
    },
    {
      id: 83,
      title: 'TMS login issue',
      type: 'Problem',
      description: 'After successfully logging into the system...',
      userExtension: 'Not assigned',
      createdBy: '514',
      status: 'Open',
      module: 'TMS (Tenant Management System)',
      priority: 'Critical',
      dueDate: '15/09/2025',
      createdAt: '15/09/2025',
    
    },
    {
      id: 82,
      title: 'CTI web dialler is not working',
      type: 'Problem',
      description: 'Unable to make a call on any extension...',
      userExtension: 'Not assigned',
      createdBy: '514',
      status: 'Open',
      module: 'CTI',
      priority: 'High',
      dueDate: '13/09/2025',
      createdAt: '13/09/2025',
     
    },
    {
      id: 81,
      title: 'Search bar is missing in ticket system',
      type: 'Problem',
      description: 'Need to add search bar in ticket system...',
      userExtension: 'Not assigned',
      createdBy: '514',
      status: 'Resolved',
      module: 'Ticket',
      priority: 'Low',
      dueDate: '13/09/2025',
      createdAt: '13/09/2025',
      
    }
  ]);



  const menuItems: MenuItemType[] = [
    { id: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'tickets', title: 'All Tickets', icon: <Ticket size={18} /> },
    
    { id: 'modules', title: 'Ticket Modules', icon: <Package size={18} /> },
    { id: 'categories', title: 'Categories', icon: <Layers size={18} /> },
    { id: 'subcategories', title: 'Sub Categories', icon: <FolderTree  size={18} /> },
    { id: 'types', title: 'Ticket Types', icon: <List size={18} /> },
    { id: 'status', title: 'Ticket Status', icon: <Tags size={18} /> },
  ];

  const renderContent = (): React.ReactNode => {
    switch (activeScreen) {
      case 'dashboard': 
        return <DashboardScreen tickets={tickets} setActiveScreen={setActiveScreen} />;
      case 'tickets': 
        return <TicketingSystem  />;
  
            case 'status': 
        return <StatusManagementScreen />;
      case 'modules': 
        return <ModuleManagementScreen />;
      case 'categories': 
        return <CategoriesManagementScreen />;
    
        case 'subcategories': 
        return <SubCategoriesManagementScreen />;

      case 'types': 
        return <TypeManagementScreen />;
      default: 
        return <DashboardScreen tickets={tickets} setActiveScreen={setActiveScreen} />;
    }
  };

 

  return (
    <Container fluid className="p-0 test">
      <Row className="g-0">
        {/* Mobile Toggle Button */}
        <Button
          variant="primary"
          className="position-fixed d-lg-none rounded-circle"
          style={{
            top: '20px',
            right: '20px',
            zIndex: 1100,
            width: '50px',
            height: '50px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </Button>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="position-fixed d-lg-none"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
       
        <Col lg={2} style={{ position: 'relative' }}>
  <ExpandableSidebar
    sidebarOpen={sidebarOpen}
    setSidebarOpen={setSidebarOpen}
    activeScreen={activeScreen}
    setActiveScreen={setActiveScreen}
  />
  
</Col>
        {/* <Col lg={2} style={{ position: 'relative' }}>
  <Card 
    className={`${sidebarOpen ? 'd-block' : 'd-none d-lg-block'}`}
    style={{ 
      minHeight: '100vh',
      height: '100%',
      position: 'fixed',
      width: '250px',
      borderRadius: '0',
      zIndex: 1050,
      overflowY: 'auto',
      left: 0,
      top: 0
    }}
  >
    <Card.Body className="p-0">
      <div className="p-4 border-bottom bg-primary bg-opacity-10">
        <h4 className="mb-0 text-primary fw-bold">Ticketing System</h4>
      </div>
      <div className="list-group list-group-flush">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`list-group-item list-group-item-action d-flex align-items-center border-0 py-3 ${
              activeScreen === item.id ? 'active bg-primary text-white' : ''
            }`}
            onClick={() => {
              setActiveScreen(item.id as ScreenType);
              setSidebarOpen(false);
            }}
          >
            <span className="me-3">{item.icon}</span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </Card.Body>
  </Card>
</Col> */}

        {/* Main Content */}
        <Col lg={10} className="ms-auto">
          <div className="p-4" style={{ marginTop: sidebarOpen ? '80px' : '0', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {renderContent()}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

// Dashboard Screen Component
interface DashboardScreenProps {
  tickets: TicketType[];
  setActiveScreen: (screen: ScreenType) => void;
}

const rechartsPriorityColors = {
    'Critical': '#F9323B',
    'High': '#FFA534',
    'Medium': '#37B8F2',
    'Low': '#4ED47C'
  };
  
  const rechartsModuleColors = [
    '#6366f1', '#10b981', '#f59e42', '#3f51b5', '#d53f8c', '#009688'
  ];

const DashboardScreen: React.FC<DashboardScreenProps> = ({ tickets, setActiveScreen }) => {
    // KPIs and Statistical Data
    const stats = {
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status === 'Open').length,
      resolvedTickets: tickets.filter(t => t.status === 'Resolved').length,
      criticalTickets: tickets.filter(t => t.priority === 'Critical').length,
    };
  
    const kpiData: KPIData[] = [
      {
        title: 'Total Tickets',
        value: stats.totalTickets,
        change: '+12.5%',
        isPositive: true,
        icon: <Ticket size={24} />,
        color: 'primary',
      },
      {
        title: 'Open Tickets',
        value: stats.openTickets,
        change: '+8.2%',
        isPositive: true,
        icon: <FolderOpen size={24} />,
        color: 'warning',
      },
      {
        title: 'Resolved Tickets',
        value: stats.resolvedTickets,
        change: '+15.3%',
        isPositive: true,
        icon: <CheckCircle size={24} />,
        color: 'success',
      },
      {
        title: 'Critical Tickets',
        value: stats.criticalTickets,
        change: '-5.1%',
        isPositive: false,
        icon: <AlertTriangle size={24} />,
        color: 'danger',
      }
    ];
  
    const priorityDistribution: PriorityDistribution[] = [
      {
        priority: 'Critical',
        count: tickets.filter(t => t.priority === 'Critical').length,
        percentage: Math.round((tickets.filter(t => t.priority === 'Critical').length / tickets.length) * 100) || 0,
        color: 'danger'
      },
      {
        priority: 'High',
        count: tickets.filter(t => t.priority === 'High').length,
        percentage: Math.round((tickets.filter(t => t.priority === 'High').length / tickets.length) * 100) || 0,
        color: 'warning'
      },
      {
        priority: 'Medium',
        count: tickets.filter(t => t.priority === 'Medium').length,
        percentage: Math.round((tickets.filter(t => t.priority === 'Medium').length / tickets.length) * 100) || 0,
        color: 'info'
      },
      {
        priority: 'Low',
        count: tickets.filter(t => t.priority === 'Low').length,
        percentage: Math.round((tickets.filter(t => t.priority === 'Low').length / tickets.length) * 100) || 0,
        color: 'success'
      }
    ];
  
    const moduleDistribution: ModuleDistribution[] = [
      { module: 'Omni Channel', count: 20 },
      { module: 'Call Logs', count: 40 },
      { module: 'TMS', count: 15 },
      { module: 'CTI', count: 30 },
      { module: 'Ticket', count:45 },
      { module: 'Test Module', count: 9 }
    ].filter(item => item.count > 0);
  
    // Data for Recharts
    const ticketTrendsLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const ticketTrendsData = ticketTrendsLabels.map((day, i) => ({
      day,
      opened: [10, 15, 12, 17, 9, 23, 17][i],
      resolved: [8, 9, 11, 13, 12, 18, 15][i],
    }));
  
    const priorityPieData = priorityDistribution.map(item => ({
      name: item.priority,
      value: item.count,
      color: rechartsPriorityColors[item.priority as keyof typeof rechartsPriorityColors] || "#8884d8"
    }));
  
    const moduleBarData = moduleDistribution.map((item, i) => ({
      name: item.module,
      count: item.count,
      fill: rechartsModuleColors[i % rechartsModuleColors.length]
    }));
  
    // CSV Download Handler
    const handleExport = () => {
      const csvContent = "data:text/csv;charset=utf-8,"
        + "ID,Title,Type,Status,Priority,Module,Created By,Due Date,Created At\n"
        + tickets.map(t => `${t.id},"${t.title}","${t.type}","${t.status}","${t.priority}","${t.module}","${t.createdBy}","${t.dueDate}","${t.createdAt}"`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `tickets_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  
    // Color helpers
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Open': return 'warning';
        case 'Resolved': return 'success';
        case 'In Progress': return 'info';
        default: return 'secondary';
      }
    };
  
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'Critical': return 'danger';
        case 'High': return 'warning';
        case 'Medium': return 'info';
        case 'Low': return 'success';
        default: return 'secondary';
      }
    };
  
    // Recent Tickets/Users (Avatars are random placeholders/demo purpose)
    const getUserAvatar = (user: string) => {
      const seed = user.charCodeAt(0) + user.length;
      const colors = ['#ff5722', '#3f51b5', '#009688', '#607d8b', '#4caf50'];
      return (
        <span className="rounded-circle d-inline-block text-center align-middle me-2" style={{
          width: 32, height: 32, lineHeight: '32px',
          background: colors[seed % colors.length],
          color: "white",
          fontWeight: 700
        }}>
          {user[0].toUpperCase()}
        </span>
      );
    };

    
  
    // Modern Dashboard Layout (with recharts)
    return (
      <div>
        {/* HEADER */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-5 gap-3">
          <div>
            <h2 className="mb-1 fw-bold d-flex align-items-center">
              <BarChart2 size={28} className="me-2 text-primary" />
              Dashboard Overview
              <Badge bg="primary-subtle" className="ms-2 text-primary px-2 fw-semibold" style={{ fontSize: "1rem" }}>Live</Badge>
            </h2>
            <span className="text-muted">
              Welcome! Here is an overview of your ticketing operations.
            </span>
          </div>
          <div className="d-flex flex-nowrap gap-2">
            {/* <Button variant="outline-primary" size="sm" className="shadow-sm" onClick={() => setActiveScreen('tickets')}>
              <Plus size={16} className="me-1" />New Ticket
            </Button> */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="primary" className="shadow-sm">
                <Download size={16} className="me-2" />
                Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleExport}>Tickets CSV</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
  
        {/* KPIs */}
        <Row className="gy-3 mb-4">
          {kpiData.map((kpi, index) => (
            <Col xl={3} md={6} key={index}>
              <Card className={`h-100 border-0 shadow-sm kpi-card kpi-card--${kpi.color}`}>
                <Card.Body className="d-flex align-items-center gap-3">
                  <div className={`d-flex align-items-center justify-content-center kpi-icon rounded-circle bg-${kpi.color} bg-opacity-25`} style={{ width: 48, height: 48 }}>
                    <div className={`text-${kpi.color}`}>{kpi.icon}</div>
                  </div>
                  <div>
                    <h4 className="mb-0 fw-bold">{kpi.value}</h4>
                    <span className="text-muted small">{kpi.title}</span>
                    <div className="mt-1 d-flex align-items-center">
                      <span className={`me-1 ${kpi.isPositive ? "text-success" : "text-danger"} d-inline-flex align-items-center`}>
                        {kpi.isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {kpi.change}
                      </span>
                      <span className="small text-secondary">vs last week</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
  
        {/* MODERN CHART ROW */}
        <Row className="mb-4 gx-3">
          <Col xl={6} lg={6} className="mb-4 mb-xl-0">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <BarChart2 size={18} className="me-2 text-primary" />
                  <h5 className="mb-0 fw-semibold">Ticket Trends (Weekly)</h5>
                </div>
                <div className="p-3 p-xl-2" style={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={ticketTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip />
                      <RechartsLegend />
                      <Bar dataKey="opened" fill="#3f7cf7" radius={[5, 5, 0, 0]}>
                        <LabelList dataKey="opened" position="top" fontSize={10} />
                      </Bar>
                      <Bar dataKey="resolved" fill="#3bd99c" radius={[5, 5, 0, 0]}>
                        <LabelList dataKey="resolved" position="top" fontSize={10} />
                      </Bar>
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>
         
          <Col xl={6} lg={6} md={6}>
  <Card className="border-0 shadow-sm h-100">
    <Card.Body>
      <div className="d-flex align-items-center mb-3">
        <BarChart2 size={18} className="me-2 text-primary" />
        <h6 className="mb-0 fw-semibold">Module Breakdown</h6>
      </div>
      <div className="p-2" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={moduleBarData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis 
              allowDecimals={false} 
              axisLine={false} 
              tickLine={false}
              tickCount={5}
              domain={[0, 'dataMax']}
            />
            <Bar dataKey="count">
              {moduleBarData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="count" position="top" fontSize={10} />
            </Bar>
            <RechartsTooltip />
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </Card.Body>
  </Card>
</Col>
        </Row>
  
       {/* Distribution Details */}
       <Row>
  {/* Priority Cards */}
 
  
  {/* Module Distribution */}
  <Col className="mb-4 mt-3">
    <h6 className="text-muted mb-3 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
      Module Distribution
    </h6>
  </Col>
  {/* <Col xs={12}>
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Row className="g-3">
          {moduleDistribution.map((item, index) => {
            const percentage = Math.round((item.count / tickets.length) * 100);
            return (
              <Col key={index} lg={4} md={6}>
                <div 
                  className="p-3 rounded" 
                  style={{ backgroundColor: '#f8f9fa', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold small">{item.module}</span>
                    <span className="badge bg-primary">{item.count}</span>
                  </div>
                  <ProgressBar
                    now={percentage}
                    style={{ height: '8px', backgroundColor: '#dee2e6' }}
                    className="mb-1"
                  />
                  <div className="text-muted small mt-1">{percentage}% of total</div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card.Body>
    </Card>
  </Col> */}

<ModuleDistributionCard />
</Row>
  
        {/* Recent Activity + Table Section */}
        <Row className="gx-3">
          <Col xl={8} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 fw-bold">Recent Tickets</h5>
                  <Button variant="link" size="sm" onClick={() => setActiveScreen('tickets')} className="text-decoration-none">
                    View All →
                  </Button>
                </div>
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0">ID</th>
                        <th className="border-0">Title</th>
                        <th className="border-0">Status</th>
                        <th className="border-0">Priority</th>
                        <th className="border-0">Module</th>
                        <th className="border-0">Created At</th>
                        <th className="border-0">Assignee</th>
                        <th className="border-0">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.slice(0, 5).map((ticket) => (
                        <tr key={ticket.id}>
                          <td className="fw-semibold">#{ticket.id}</td>
                          <td>{ticket.title}</td>
                          <td>
                            <Badge bg={getStatusColor(ticket.status)} className="bg-opacity-10 text-dark">
                              {ticket.status}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td>
                            <small>{ticket.module}</small>
                          </td>
                          <td>
                            <small>{ticket.createdAt}</small>
                          </td>
                          <td>
                            {getUserAvatar(ticket.createdBy)}
                            <small>{ticket.createdBy}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button variant="link" size="sm" className="p-1 text-primary" title="View">
                                <Eye size={16} />
                              </Button>
                              <Button variant="link" size="sm" className="p-1 text-secondary" title="Edit">
                                <Edit size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
          {/* Recent Log/Activity Section */}
          <Col xl={4} className="mb-4">
            <Card className="border-0 shadow-sm" style={{height: '448px'}}>
              <Card.Body>
                <h6 className="fw-bold mb-4">Recent Activity</h6>
                {tickets.slice(0, 5).map((ticket, idx) => (
                  <div key={ticket.id} className="d-flex align-items-center mb-3">
                    {getUserAvatar(ticket.createdBy)}
                    <div>
                      <div className="fw-semibold">
                        {ticket.createdBy} created ticket <span className="text-primary">#{ticket.id}</span>
                      </div>
                      <small className="text-muted">
                        <span>{ticket.createdAt}</span>
                        {ticket.priority === 'Critical' && (
                          <span className="ms-2 badge bg-danger bg-opacity-20 text-danger">Critical</span>
                        )}
                      </small>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
  
            {/* <Card className="border-0 shadow-sm mt-4">
              <Card.Body>
                <h6 className="fw-bold mb-3">Overall Progress</h6>
                <div className="mb-2 text-secondary small">Open vs Resolved</div>
                <ProgressBar>
                  <ProgressBar animated now={stats.openTickets / (stats.totalTickets || 1) * 100} key={1} variant="warning" label="Open" style={{ minWidth: 40 }} />
                  <ProgressBar animated now={stats.resolvedTickets / (stats.totalTickets || 1) * 100} key={2} variant="success" label="Resolved" style={{ minWidth: 40 }} />
                </ProgressBar>
                <div className="mt-2 small text-secondary">
                  {stats.openTickets} open • {stats.resolvedTickets} resolved
                </div>
              </Card.Body>
            </Card> */}
          </Col>
        </Row>
      </div>
    );
  }
  
  
  

// Tickets List Screen Component
interface TicketsListScreenProps {
  tickets: TicketType[];
  setTickets: React.Dispatch<React.SetStateAction<TicketType[]>>;
  setActiveScreen: (screen: ScreenType) => void;
}

const TicketingSystem = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
    const [newComment, setNewComment] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
  
    const [ticketFormData, setTicketFormData] = useState({
      title: '',
      type: '',
      description: '',
      status: '',
      module: '',
      category: '',
      subCategory: '',
      primaryIssue: '',
      specificProblem: '',
      priority: '',
      dueDate: '',
      image: null as File | null,
      isInternal: false, // NEW
      attachments: [] as File[] // NEW
    });
  
    // Sample Data
    const tickets: TicketType[] = [
        { 
          id: 88, 
          title: 'Test Ticket', 
          type: 'Test Type', 
          description: 'Test Ticket description...', 
          userExtension: 'Not assigned', 
          createdBy: 'Usman Akram (512)', 
          status: 'Test Status', 
          module: 'Test Module', 
          priority: 'High', 
          dueDate: '24/10/2025', 
          createdAt: '22/10/2025',
          assignedTo: 'Not assigned',
          isInternal: false,
          initialAttachments: [
            { id: 1, name: 'test-screenshot.png', size: '1.2 MB', url: '#' },
            { id: 2, name: 'error-log.txt', size: '45 KB', url: '#' }
          ]
        },
        { 
          id: 87, 
          title: 'Dummy Ticket', 
          type: 'Change Request', 
          description: 'Some random description...', 
          userExtension: 'Not assigned', 
          createdBy: 'Ocean Agent 01 (3601)', 
          status: 'Resolved', 
          module: 'Omni Channel', 
          priority: 'Low', 
          dueDate: 'No due date', 
          createdAt: '25/09/2025',
          assignedTo: 'Not assigned',
          isInternal: false
        },
        { 
          id: 84, 
          title: 'Call Log Timezone', 
          type: 'Incident', 
          description: 'The timestamps in the Call...', 
          userExtension: 'Not assigned', 
          createdBy: '525', 
          status: 'Open', 
          module: 'Call Logs', 
          priority: 'High', 
          dueDate: '17/09/2025', 
          createdAt: '15/09/2025',
          assignedTo: 'John Developer (501)',
          isInternal: false,
          initialAttachments: [
            { id: 1, name: 'timezone-screenshot.png', size: '245 KB', url: '#' }
          ]
        },
        { 
          id: 83, 
          title: 'TMS login issue', 
          type: 'Problem', 
          description: 'After successfully logging into ...', 
          userExtension: 'Not assigned', 
          createdBy: '514', 
          status: 'Open', 
          module: 'TMS (Tenant Management System)', 
          priority: 'Critical', 
          dueDate: '15/09/2025', 
          createdAt: '15/09/2025',
          assignedTo: 'Sarah Admin (502)',
          isInternal: true // Internal ticket example
        },
        // ... rest of tickets
      ];
  
      const ticketHistory: Record<number, Comment[]> = {
        84: [
          { 
            id: 1, 
            user: '525', 
            userRole: 'Reporter', 
            comment: 'The timestamps in the Call Logs don\'t seem to reflect the local time zone. When I check the call logs, the time displayed is different from my system time.', 
            timestamp: '15/09/2025 10:30 AM', 
            type: 'comment',
            attachments: [
              { id: 1, name: 'screenshot-timezone-issue.png', size: '245 KB', url: '#' }
            ]
          },
          { id: 2, user: 'System', userRole: 'System', comment: 'Ticket assigned to John Developer (501)', timestamp: '15/09/2025 10:35 AM', type: 'assignment' },
          { 
            id: 3, 
            user: 'John Developer (501)', 
            userRole: 'Developer', 
            comment: 'I\'ve reviewed the issue. The server timezone configuration is not being applied correctly. This needs backend changes.', 
            timestamp: '15/09/2025 02:15 PM', 
            type: 'internal_note',
            isInternal: true
          },
          { id: 4, user: 'System', userRole: 'System', comment: 'Status changed from Open to In Progress', timestamp: '15/09/2025 02:20 PM', type: 'status_change' },
          { 
            id: 5, 
            user: 'John Developer (501)', 
            userRole: 'Developer', 
            comment: 'Fixed the timezone issue. The timestamps should now reflect the correct local time. Please verify.', 
            timestamp: '16/09/2025 11:45 AM', 
            type: 'comment',
            attachments: [
              { id: 2, name: 'fix-patch.zip', size: '12 KB', url: '#' },
              { id: 3, name: 'deployment-notes.pdf', size: '89 KB', url: '#' }
            ]
          },
          { id: 6, user: 'System', userRole: 'System', comment: 'Status changed from In Progress to Resolved', timestamp: '16/09/2025 11:50 AM', type: 'status_change' },
          { id: 7, user: '525', userRole: 'Reporter', comment: 'Verified! The timestamps are now showing correctly. Thank you!', timestamp: '17/09/2025 09:20 AM', type: 'comment' }
        ],
        83: [
          { id: 1, user: '514', userRole: 'Reporter', comment: 'After successfully logging into the system, I am redirected to a blank page instead of the dashboard.', timestamp: '15/09/2025 09:15 AM', type: 'comment' },
          { id: 2, user: 'System', userRole: 'System', comment: 'Ticket assigned to Sarah Admin (502)', timestamp: '15/09/2025 09:20 AM', type: 'assignment' },
          { 
            id: 3, 
            user: 'Sarah Admin (502)', 
            userRole: 'Admin', 
            comment: 'This looks like a permission issue. The user might not have dashboard access configured.', 
            timestamp: '15/09/2025 10:15 AM', 
            type: 'internal_note',
            isInternal: true
          },
          { 
            id: 4, 
            user: 'Sarah Admin (502)', 
            userRole: 'Admin', 
            comment: 'Checking your user permissions and session data. Can you try clearing your browser cache?', 
            timestamp: '15/09/2025 10:30 AM', 
            type: 'comment'
          },
          { id: 5, user: '514', userRole: 'Reporter', comment: 'Tried clearing cache, but the issue persists.', timestamp: '15/09/2025 11:00 AM', type: 'comment' },
          { 
            id: 6, 
            user: 'Sarah Admin (502)', 
            userRole: 'Admin', 
            comment: 'Updated user permissions. Added dashboard module access.', 
            timestamp: '15/09/2025 02:30 PM', 
            type: 'internal_note',
            isInternal: true
          },
          { 
            id: 7, 
            user: 'Sarah Admin (502)', 
            userRole: 'Admin', 
            comment: 'I\'ve reset your session and updated your permissions. Please try logging in again.', 
            timestamp: '15/09/2025 02:45 PM', 
            type: 'comment'
          }
        ],
        81: [
          { id: 1, user: '514', userRole: 'Reporter', comment: 'Need to add search bar in ticket system. It would be helpful to filter tickets by various criteria like status, priority, module, etc.', timestamp: '13/09/2025 10:00 AM', type: 'comment' },
          { id: 2, user: 'System', userRole: 'System', comment: 'Ticket assigned to John Developer (501)', timestamp: '13/09/2025 10:05 AM', type: 'assignment' },
          { 
            id: 3, 
            user: 'John Developer (501)', 
            userRole: 'Developer', 
            comment: 'This is a good feature request. Will implement search with filters for status, priority, module, type, and date range.', 
            timestamp: '13/09/2025 11:00 AM', 
            type: 'internal_note',
            isInternal: true
          },
          { id: 4, user: 'System', userRole: 'System', comment: 'Status changed from Open to In Progress', timestamp: '13/09/2025 11:05 AM', type: 'status_change' },
          { 
            id: 5, 
            user: 'John Developer (501)', 
            userRole: 'Developer', 
            comment: 'Added comprehensive search and filter functionality to the ticket listing page. You can now search by ticket ID, title, and filter by multiple criteria.', 
            timestamp: '13/09/2025 03:30 PM', 
            type: 'comment',
            attachments: [
              { id: 1, name: 'search-feature-demo.gif', size: '3.2 MB', url: '#' }
            ]
          },
          { id: 6, user: 'System', userRole: 'System', comment: 'Status changed from In Progress to Resolved', timestamp: '13/09/2025 03:35 PM', type: 'status_change' },
          { id: 7, user: '514', userRole: 'Reporter', comment: 'Perfect! The search feature works great. Thank you!', timestamp: '13/09/2025 04:00 PM', type: 'comment' }
        ],
        82: [
          { 
            id: 1, 
            user: '514', 
            userRole: 'Reporter', 
            comment: 'Unable to make a call on any extension. The web dialer shows an error.', 
            timestamp: '13/09/2025 09:00 AM', 
            type: 'comment',
            attachments: [
              { id: 1, name: 'dialer-error-screenshot.png', size: '567 KB', url: '#' }
            ]
          },
          { id: 2, user: 'System', userRole: 'System', comment: 'Ticket assigned to Mike Support (503)', timestamp: '13/09/2025 09:05 AM', type: 'assignment' },
          { 
            id: 3, 
            user: 'Mike Support (503)', 
            userRole: 'Support', 
            comment: 'Checking CTI server status and WebRTC connections.', 
            timestamp: '13/09/2025 09:30 AM', 
            type: 'internal_note',
            isInternal: true
          },
          { 
            id: 4, 
            user: 'Mike Support (503)', 
            userRole: 'Support', 
            comment: 'We\'re investigating the issue. Can you check if you have microphone permissions enabled in your browser?', 
            timestamp: '13/09/2025 09:45 AM', 
            type: 'comment'
          }
        ],
        87: [
          { id: 1, user: 'Ocean Agent 01 (3601)', userRole: 'Reporter', comment: 'Testing the new omni-channel feature with various scenarios.', timestamp: '25/09/2025 10:00 AM', type: 'comment' },
          { id: 2, user: 'System', userRole: 'System', comment: 'Ticket created', timestamp: '25/09/2025 10:00 AM', type: 'status_change' }
        ],
        86: [
          { id: 1, user: 'Ocean Agent 01 (3601)', userRole: 'Reporter', comment: 'Service request for call log analysis features.', timestamp: '25/09/2025 09:30 AM', type: 'comment' },
          { id: 2, user: 'System', userRole: 'System', comment: 'Ticket created', timestamp: '25/09/2025 09:30 AM', type: 'status_change' }
        ],
        88: [
          { 
            id: 1, 
            user: 'Usman Akram (512)', 
            userRole: 'Reporter', 
            comment: 'Test Ticket description by asad. This is a comprehensive test of the new ticketing system.', 
            timestamp: '22/10/2025 11:00 AM', 
            type: 'comment',
            attachments: [
              { id: 1, name: 'test-screenshot.png', size: '1.2 MB', url: '#' },
              { id: 2, name: 'error-log.txt', size: '45 KB', url: '#' }
            ]
          },
          { 
            id: 2, 
            user: 'Admin User', 
            userRole: 'Admin', 
            comment: 'This is a test ticket. Will monitor for any issues.', 
            timestamp: '22/10/2025 11:30 AM', 
            type: 'internal_note',
            isInternal: true
          },
          { id: 3, user: 'System', userRole: 'System', comment: 'Ticket created with test status', timestamp: '22/10/2025 11:00 AM', type: 'status_change' }
        ]
      };
  
    const modules = [
      { id: 1, name: 'TMS (Tenant Management System)' },
      { id: 2, name: 'CTI' },
      { id: 3, name: 'Call Logs' },
      { id: 4, name: 'Omni Channel' },
      { id: 5, name: 'Ticket' },
      { id: 6, name: 'Test Module' }
    ];
  
    const categories = [
      { id: 1, name: 'User Management', module: 'TMS (Tenant Management System)' },
      { id: 2, name: 'Permissions', module: 'TMS (Tenant Management System)' },
      { id: 3, name: 'Dialer Issues', module: 'CTI' },
      { id: 4, name: 'Call Quality', module: 'CTI' },
      { id: 5, name: 'Timezone', module: 'Call Logs' }
    ];
  
    const ticketTypes = [
      { id: 1, name: 'Incident', color: '#dc3545' },
      { id: 2, name: 'Problem', color: '#ffc107' },
      { id: 3, name: 'Service Request', color: '#0d6efd' },
      { id: 4, name: 'Change Request', color: '#198754' },
      { id: 5, name: 'Test Type', color: '#6c757d' }
    ];
  
    const statuses = [
      { id: 1, name: 'Open', color: '#0d6efd' },
      { id: 2, name: 'In Progress', color: '#ffc107' },
      { id: 3, name: 'Resolved', color: '#198754' },
      { id: 4, name: 'Closed', color: '#6c757d' },
      { id: 5, name: 'Test Status', color: '#dc3545' }
    ];
  
    const handleViewTicket = (ticket: TicketType) => {
      setSelectedTicket(ticket);
      setShowViewModal(true);
      setNewComment('');
    };
  
    const handleAddComment = () => {
      if (newComment.trim()) {
        console.log('Adding comment:', newComment);
        // Here you would add the comment to the ticket history
        alert('Comment added successfully!');
        setNewComment('');
        setAttachments([]);
      }
    };
  
    const handleCreateTicket = () => {
      console.log('Creating ticket:', ticketFormData);
      alert('Ticket created successfully!');
      setShowCreateModal(false);
        setTicketFormData({
            title: '',
            type: '',
            description: '',
            status: '',
            module: '',
            category: '',
            subCategory: '',
            primaryIssue: '',
            specificProblem: '',
            priority: '',
            dueDate: '',
            image: null,
            isInternal: false,
            attachments: []
        });
    };
  
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setAttachments([...attachments, ...Array.from(e.target.files)]);
      }
    };
  
    const removeAttachment = (index: number) => {
      setAttachments(attachments.filter((_, i) => i !== index));
    };
  
    const getPriorityBadgeColor = (priority: string) => {
      switch (priority.toLowerCase()) {
        case 'critical': return 'danger';
        case 'high': return 'warning';
        case 'medium': return 'info';
        case 'low': return 'success';
        default: return 'secondary';
      }
    };
  
    const getStatusBadgeColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'resolved': return 'success';
        case 'closed': return 'secondary';
        case 'in progress': return 'warning';
        case 'open': return 'primary';
        default: return 'info';
      }
    };
  
    // Ticket Listing
    const renderTicketListing = () => (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">All Tickets</h2>
            <p className="text-muted mb-0">Manage and track all support tickets</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <Download size={16} className="me-2" />
              Export
            </Button>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="me-2" />
              Create Ticket
            </Button>
          </div>
        </div>
  
        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text className="bg-light border-end-0">
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search tickets..."
                    className="border-start-0"
                  />
                </InputGroup>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Modules</option>
                  {modules.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Priority</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Types</option>
                  {ticketTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={1}>
                <Button variant="outline-primary" className="w-100">
                  <Filter size={16} />
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
  
        {/* Tickets Table */}
        <Card>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3">Ticket ID & Title</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Description</th>
                    <th className="py-3">User Extension</th>
                    <th className="py-3">Created By</th>
                    <th className="py-3">Status & Module</th>
                    <th className="py-3">Priority</th>
                    <th className="py-3">Due Date</th>
                    <th className="py-3">Created At</th>
                    <th className="py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="align-middle">
                      <td className="px-4">
                        <div>
                          <span className="fw-bold text-primary">#{ticket.id}</span>
                          <div className="fw-semibold mt-1">{ticket.title}</div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="fw-normal">
                          {ticket.type}
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted" style={{ maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.description}
                        </small>
                      </td>
                      <td>
                        <small className="text-muted">{ticket.userExtension}</small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                            <User size={16} className="text-primary" />
                          </div>
                          <small>{ticket.createdBy}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <Badge bg={getStatusBadgeColor(ticket.status)} className="bg-opacity-10 text-dark mb-1 d-block" style={{ width: 'fit-content' }}>
                            {ticket.status}
                          </Badge>
                          <small className="text-muted">{ticket.module}</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg={getPriorityBadgeColor(ticket.priority)} className="bg-opacity-10 text-dark">
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted">
                          <Calendar size={14} className="me-1" />
                          {ticket.dueDate}
                        </small>
                      </td>
                      <td>
                        <small className="text-muted">{ticket.createdAt}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-primary"
                            onClick={() => handleViewTicket(ticket)}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </Button>
                          {/* <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-secondary"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </Button> */}
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-1 text-danger"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
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
  
  // Create Ticket Modal with Guidelines and Tooltips
const CreateTicketModal = () => {
    const charCount = ticketFormData.description.length;
    const isValidDescription = charCount >= 50 && charCount <= 500;
    const [showGuidelines, setShowGuidelines] = useState(false);
  
    return (
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="xl" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <div className="d-flex align-items-center justify-content-between w-100 pe-3">
            <Modal.Title className="d-flex align-items-center gap-2">
              {/* <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                <Ticket size={20} className="text-primary" />
              </div> */}
              <span>Create New Ticket</span>
            </Modal.Title>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="text-decoration-none"
            >
              <Info size={16} className="me-1" />
              {showGuidelines ? 'Hide' : 'Show'} Guidelines
            </Button>
          </div>
        </Modal.Header>
  
        <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Guidelines Panel */}
          {showGuidelines && (
            <Alert variant="info" className="mb-4 border-0 shadow-sm">
              <div className="d-flex align-items-start gap-3">
                <div className="bg-info bg-opacity-10 rounded-circle p-2" style={{ minWidth: '40px', height: '40px' }}>
                  <Info size={20} className="text-info" />
                </div>
                <div>
                  <h6 className="fw-bold mb-2 text-info">Quick Guidelines for Creating Tickets</h6>
                  <ul className="mb-0 ps-3" style={{ fontSize: '0.875rem', lineHeight: '1.8' }}>
                    <li>Provide a <strong>clear and descriptive title</strong> that summarizes the issue</li>
                    <li>Choose the appropriate <strong>ticket type</strong> based on the nature of your request</li>
                    <li>Write a <strong>detailed description</strong> (minimum 50 characters) explaining the issue</li>
                    <li>Select the correct <strong>module and category</strong> for faster routing</li>
                    <li>Set the right <strong>priority level</strong> based on business impact</li>
                    <li>Attach relevant <strong>screenshots or documents</strong> to help us understand better</li>
                  </ul>
                </div>
              </div>
            </Alert>
          )}
  
          <Form>
            <Row>
              {/* Ticket Visibility Section */}
              <Col md={12}>
                <Card className="mb-4 border-0 bg-light">
                  <Card.Body className="p-3">
                    <Form.Group>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <Form.Label className="fw-semibold mb-0 d-flex align-items-center gap-2">
                          <span>Ticket Visibility</span>
                          <span 
                            className="text-muted" 
                            title="Choose whether this ticket is visible to customers or internal team only"
                            style={{ cursor: 'help' }}
                          >
                            <Info size={16} />
                          </span>
                        </Form.Label>
                      </div>
                      <div className="d-flex gap-4">
                        <Form.Check
                          type="radio"
                          id="ticket-external"
                          name="ticketVisibility"
                          checked={!ticketFormData.isInternal}
                          onChange={() => setTicketFormData({ ...ticketFormData, isInternal: false })}
                          label={
                            <div className="d-flex align-items-start gap-2">
                              <div className="d-flex align-items-center gap-2">
                                <MessageCircle size={18} className="text-primary" />
                                <div>
                                  <div className="fw-semibold">External (Public)</div>
                                  <small className="text-muted d-block" style={{ fontSize: '0.813rem' }}>
                                    Visible to customers and team members
                                  </small>
                                </div>
                              </div>
                            </div>
                          }
                        />
                        <Form.Check
                          type="radio"
                          id="ticket-internal"
                          name="ticketVisibility"
                          checked={ticketFormData.isInternal}
                          onChange={() => setTicketFormData({ ...ticketFormData, isInternal: true })}
                          label={
                            <div className="d-flex align-items-start gap-2">
                              <div className="d-flex align-items-center gap-2">
                                <AlertCircle size={18} className="text-danger" />
                                <div>
                                  <div className="fw-semibold">Internal (Private)</div>
                                  <small className="text-muted d-block" style={{ fontSize: '0.813rem' }}>
                                    Only visible to internal team members
                                  </small>
                                </div>
                              </div>
                            </div>
                          }
                        />
                      </div>
                      {ticketFormData.isInternal && (
                        <Alert variant="danger" className="mt-3 mb-0 py-2">
                          <AlertCircle size={14} className="me-2" />
                          <small>This ticket will only be visible to internal team members and won't appear in customer portals.</small>
                        </Alert>
                      )}
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
  
              {/* Ticket Title */}
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                    Ticket Title <span className="text-danger">*</span>
                    <span 
                      className="text-muted" 
                      title="Provide a brief, clear summary of the issue or request"
                      style={{ cursor: 'help' }}
                    >
                      <Info size={14} />
                    </span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Unable to login to dashboard after password reset"
                    value={ticketFormData.title}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, title: e.target.value })}
                    className="py-2"
                    style={{ fontSize: '0.938rem' }}
                  />
                  <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                    <Info size={12} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Be specific and concise. A good title helps us route your ticket to the right team quickly.
                    </span>
                  </Form.Text>
                </Form.Group>
              </Col>
  
             {/* Ticket Type and Priority */}
<Col md={6}>
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold d-flex align-items-center gap-2">
      Ticket Type <span className="text-danger">*</span>
      <span 
        className="text-muted" 
        title="Select the category that best describes your request"
        style={{ cursor: 'help' }}
      >
        <Info size={14} />
      </span>
    </Form.Label>
    <Form.Select
      value={ticketFormData.type}
      onChange={(e) => setTicketFormData({ ...ticketFormData, type: e.target.value })}
      className="py-2"
      style={{ fontSize: '0.938rem' }}
    >
      <option value="">Choose ticket type...</option>
      {ticketTypes.map(type => (
        <option key={type.id} value={type.name}>{type.name}</option>
      ))}
    </Form.Select>
    <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
      <Info size={12} className="me-1" />
      Select the type that best matches the nature of your request. This helps us categorize and route your ticket appropriately.
    </Form.Text>
  </Form.Group>
</Col>

<Col md={6}>
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold d-flex align-items-center gap-2">
      Priority Level <span className="text-danger">*</span>
      <span 
        className="text-muted" 
        title="Indicate how urgently this issue needs attention"
        style={{ cursor: 'help' }}
      >
        <Info size={14} />
      </span>
    </Form.Label>
    <Form.Select
      value={ticketFormData.priority}
      onChange={(e) => setTicketFormData({ ...ticketFormData, priority: e.target.value })}
      className="py-2"
      style={{ fontSize: '0.938rem' }}
    >
      <option value="">Choose priority...</option>
      <option value="Critical">Critical - System down/Major impact</option>
      <option value="High">High - Significant impact on operations</option>
      <option value="Medium">Medium - Moderate impact</option>
      <option value="Low">Low - Minor impact or enhancement</option>
    </Form.Select>
    <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
      <Info size={12} className="me-1" />
      Choose the urgency level based on business impact. Higher priorities are addressed first by our support team.
    </Form.Text>
  </Form.Group>
</Col>
  
              {/* <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                    Priority Level <span className="text-danger">*</span>
                    <span 
                      className="text-muted" 
                      title="Indicate how urgently this issue needs attention"
                      style={{ cursor: 'help' }}
                    >
                      <Info size={14} />
                    </span>
                  </Form.Label>
                  <Form.Select
                    value={ticketFormData.priority}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, priority: e.target.value })}
                    className="py-2"
                    style={{ fontSize: '0.938rem' }}
                  >
                    <option value="">Choose priority...</option>
                    <option value="Critical">🔴 Critical - System down/Major impact</option>
                    <option value="High">🟠 High - Significant impact on operations</option>
                    <option value="Medium">🟡 Medium - Moderate impact</option>
                    <option value="Low">🟢 Low - Minor impact or enhancement</option>
                  </Form.Select>
                  <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
                    <Alert variant="warning" className="py-2 px-2 mb-0 mt-2 border-0">
                      <strong>Priority Guidelines:</strong>
                      <div className="mt-1">
                        <div><strong>Critical:</strong> Complete service outage affecting all users</div>
                        <div><strong>High:</strong> Major functionality not working, affecting multiple users</div>
                        <div><strong>Medium:</strong> Feature partially working with workaround available</div>
                        <div><strong>Low:</strong> Minor issue or cosmetic problem</div>
                      </div>
                    </Alert>
                  </Form.Text>
                </Form.Group>
              </Col> */}
  
              {/* Description */}
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                    Detailed Description <span className="text-danger">*</span>
                    <span 
                      className="text-muted" 
                      title="Provide a comprehensive description of the issue"
                      style={{ cursor: 'help' }}
                    >
                      <Info size={14} />
                    </span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    placeholder="Describe the issue in detail. Include:&#10;• What were you trying to do?&#10;• What happened instead?&#10;• Steps to reproduce the issue&#10;• Error messages (if any)&#10;• When did this start?"
                    value={ticketFormData.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setTicketFormData({ ...ticketFormData, description: e.target.value });
                      }
                    }}
                    className={`${charCount > 0 && !isValidDescription ? 'border-warning' : charCount >= 50 ? 'border-success' : ''}`}
                    style={{ fontSize: '0.938rem', lineHeight: '1.6' }}
                  />
                  <div className="d-flex justify-content-between mt-2">
                    <div className="d-flex flex-column gap-1">
                      <Form.Text className={charCount < 50 ? 'text-warning fw-semibold' : 'text-success fw-semibold'}>
                        {charCount < 50 ? (
                          <>
                            <AlertCircle size={14} className="me-1" />
                            Minimum 50 characters required ({50 - charCount} more needed)
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} className="me-1" />
                            Great! Detailed description provided
                          </>
                        )}
                      </Form.Text>
                      <Form.Text className="text-muted" style={{ fontSize: '0.813rem' }}>
                        <Info size={12} className="me-1" />
                        More details help us resolve your issue faster
                      </Form.Text>
                    </div>
                    <Form.Text className={charCount > 450 ? 'text-warning fw-semibold' : 'text-muted'}>
                      {charCount}/500 characters
                    </Form.Text>
                  </div>
                </Form.Group>
              </Col>
  
          {/* Module and Category Selection */}
<Col md={6}>
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold d-flex align-items-center gap-2">
      Module <span className="text-danger">*</span>
      <span 
        className="text-muted" 
        title="Select the system module related to this issue"
        style={{ cursor: 'help' }}
      >
        <Info size={14} />
      </span>
    </Form.Label>
    <Form.Select
      value={ticketFormData.module}
      onChange={(e) => setTicketFormData({ ...ticketFormData, module: e.target.value, category: '', subCategory: '' })}
      className="py-2"
      style={{ fontSize: '0.938rem' }}
    >
      <option value="">Choose module...</option>
      {modules.map(module => (
        <option key={module.id} value={module.name}>{module.name}</option>
      ))}
    </Form.Select>
    <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
      <Info size={12} className="me-1" />
      Identify which part of the system your issue relates to for faster routing to the specialist team.
    </Form.Text>
  </Form.Group>
</Col>

<Col md={6}>
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold d-flex align-items-center gap-2">
      Category
      <span 
        className="text-muted" 
        title="Narrow down the specific area within the module"
        style={{ cursor: 'help' }}
      >
        <Info size={14} />
      </span>
    </Form.Label>
    <Form.Select
      value={ticketFormData.category}
      onChange={(e) => setTicketFormData({ ...ticketFormData, category: e.target.value, subCategory: '' })}
      disabled={!ticketFormData.module}
      className="py-2"
      style={{ fontSize: '0.938rem' }}
    >
      <option value="">Choose category...</option>
      {categories
        .filter(cat => cat.module === ticketFormData.module)
        .map(cat => (
          <option key={cat.id} value={cat.name}>{cat.name}</option>
        ))}
    </Form.Select>
    {!ticketFormData.module ? (
      <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
        <AlertCircle size={12} className="me-1" />
        Please select a module first to see available categories
      </Form.Text>
    ) : (
      <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
        <Info size={12} className="me-1" />
        Optional: Further categorize your issue for more precise routing
      </Form.Text>
    )}
  </Form.Group>
</Col>

{/* Status and Due Date */}
<Col md={6}>
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold d-flex align-items-center gap-2">
      Initial Status <span className="text-danger">*</span>
      <span 
        className="text-muted" 
        title="Set the starting status for this ticket"
        style={{ cursor: 'help' }}
      >
        <Info size={14} />
      </span>
    </Form.Label>
    <Form.Select
      value={ticketFormData.status}
      onChange={(e) => setTicketFormData({ ...ticketFormData, status: e.target.value })}
      className="py-2"
      style={{ fontSize: '0.938rem' }}
    >
      <option value="">Choose status...</option>
      {statuses.map(status => (
        <option key={status.id} value={status.name}>{status.name}</option>
      ))}
    </Form.Select>
    <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
      <Info size={12} className="me-1" />
      Set the current state of your ticket. New tickets typically start as "Open".
    </Form.Text>
  </Form.Group>
</Col>

<Col md={6}>
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold d-flex align-items-center gap-2">
      Due Date
      <span 
        className="text-muted" 
        title="Set a target date for resolution (optional)"
        style={{ cursor: 'help' }}
      >
        <Info size={14} />
      </span>
    </Form.Label>
    <Form.Control
      type="date"
      value={ticketFormData.dueDate}
      onChange={(e) => setTicketFormData({ ...ticketFormData, dueDate: e.target.value })}
      min={new Date().toISOString().split('T')[0]}
      className="py-2"
      style={{ fontSize: '0.938rem' }}
    />
    <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
      <Calendar size={12} className="me-1" />
      Optional: Specify when you need this issue resolved. Helps with planning and prioritization.
    </Form.Text>
  </Form.Group>
</Col>

{/* Additional Fields */}
<Col md={6}>
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold d-flex align-items-center gap-2">
      Primary Issue
      <span 
        className="text-muted" 
        title="Describe the main problem in one sentence"
        style={{ cursor: 'help' }}
      >
        <Info size={14} />
      </span>
    </Form.Label>
    <Form.Control
      type="text"
      placeholder="e.g., Cannot access user management page"
      value={ticketFormData.primaryIssue}
      onChange={(e) => setTicketFormData({ ...ticketFormData, primaryIssue: e.target.value })}
      className="py-2"
      style={{ fontSize: '0.938rem' }}
    />
    <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
      <Info size={12} className="me-1" />
      Optional: A brief one-line summary of the core problem you're experiencing.
    </Form.Text>
  </Form.Group>
</Col>

<Col md={6}>
  <Form.Group className="mb-4">
    <Form.Label className="fw-semibold d-flex align-items-center gap-2">
      Specific Problem Details
      <span 
        className="text-muted" 
        title="Add any specific details that might help"
        style={{ cursor: 'help' }}
      >
        <Info size={14} />
      </span>
    </Form.Label>
    <Form.Control
      type="text"
      placeholder="e.g., Error code 403 appears on click"
      value={ticketFormData.specificProblem}
      onChange={(e) => setTicketFormData({ ...ticketFormData, specificProblem: e.target.value })}
      className="py-2"
      style={{ fontSize: '0.938rem' }}
    />
    <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
      <Info size={12} className="me-1" />
      Optional: Include error codes, messages, or any technical details that might assist diagnosis.
    </Form.Text>
  </Form.Group>
</Col>
  
              {/* Attachments */}
              <Col md={12}>
                <Card className="border-2 border-dashed mb-3">
                  <Card.Body className="p-4">
                    <Form.Group className="mb-0">
                      <div className="d-flex align-items-start justify-content-between mb-3">
                        <div>
                          <Form.Label className="fw-semibold mb-1 d-flex align-items-center gap-2">
                            Attachments (Optional)
                            <span 
                              className="text-muted" 
                              title="Upload screenshots, logs, or documents that help explain the issue"
                              style={{ cursor: 'help' }}
                            >
                              <Info size={14} />
                            </span>
                          </Form.Label>
                          <Form.Text className="text-muted d-block" style={{ fontSize: '0.813rem' }}>
                            Attach screenshots, error logs, or relevant documents
                          </Form.Text>
                        </div>
                        <Upload size={32} className="text-muted" />
                      </div>
  
                      <Form.Control
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.log"
                        multiple
                        onChange={(e: any) => {
                          const files = Array.from(e.target.files || []);
                          setTicketFormData({ ...ticketFormData, attachments: files as File[] });
                        }}
                        className="mb-2"
                      />
                      
                      <Alert variant="info" className="py-2 px-3 mb-0 border-0 bg-info bg-opacity-10">
                        <div className="d-flex gap-2">
                          <Info size={16} className="text-info mt-1" style={{ minWidth: '16px' }} />
                          <div style={{ fontSize: '0.813rem' }}>
                            <strong>Supported formats:</strong> Images (PNG, JPG, GIF), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX), Text files (TXT, LOG)
                            <br />
                            <strong>Maximum:</strong> 5 files, 5MB per file
                            <br />
                            <strong>Tip:</strong> Screenshots of error messages greatly help our team diagnose issues faster!
                          </div>
                        </div>
                      </Alert>
  
                      {ticketFormData.attachments.length > 0 && (
                        <div className="mt-3">
                          <small className="text-muted fw-semibold d-block mb-2">Selected Files ({ticketFormData.attachments.length}):</small>
                          <div className="d-flex flex-wrap gap-2">
                            {ticketFormData.attachments.map((file, index) => (
                              <Badge key={index} bg="light" text="dark" className="p-2 d-flex align-items-center gap-2">
                                <Paperclip size={14} className="text-primary" />
                                <span style={{ fontSize: '0.875rem' }}>{file.name}</span>
                                <small className="text-muted">({(file.size / 1024).toFixed(1)} KB)</small>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 ms-1 text-danger"
                                  onClick={() => {
                                    const newAttachments = ticketFormData.attachments.filter((_, i) => i !== index);
                                    setTicketFormData({ ...ticketFormData, attachments: newAttachments });
                                  }}
                                  title="Remove file"
                                >
                                  <X size={14} />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
  
        <Modal.Footer className="border-top bg-light">
          <div className="d-flex justify-content-between align-items-center w-100">
            <Form.Text className="text-muted d-flex align-items-center gap-1">
              <AlertCircle size={14} />
              <span style={{ fontSize: '0.813rem' }}>
                Fields marked with <span className="text-danger fw-bold">*</span> are required
              </span>
            </Form.Text>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" onClick={() => setShowCreateModal(false)}>
                <X size={16} className="me-1" />
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleCreateTicket}
                disabled={
                  !ticketFormData.title || 
                  !ticketFormData.type || 
                  !isValidDescription || 
                  !ticketFormData.status || 
                  !ticketFormData.module || 
                  !ticketFormData.priority
                }
              >
                <Plus size={16} className="me-1" />
                Create Ticket
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    );
  };
    // View Ticket Modal with History Thread
    // View Ticket Modal with Tab-based View
const ViewTicketModal = () => {
    if (!selectedTicket) return null;
  
    const history = ticketHistory[selectedTicket.id] || [];
    const [ticketStatus, setTicketStatus] = useState(selectedTicket.status);
    const [assignedUser, setAssignedUser] = useState(selectedTicket.assignedTo || '');
    const [activeTab, setActiveTab] = useState<'public' | 'internal' | 'activity'>('public');
    const [commentType, setCommentType] = useState<'public' | 'internal'>('public');
  
    const availableUsers = [
      { id: 1, name: 'John Developer (501)' },
      { id: 2, name: 'Sarah Admin (502)' },
      { id: 3, name: 'Mike Support (503)' },
      { id: 4, name: 'Jane Manager (504)' },
      { id: 5, name: 'Not assigned' }
    ];
  
    const handleStatusUpdate = () => {
      if (ticketStatus !== selectedTicket.status) {
        console.log('Updating status to:', ticketStatus);
        alert(`Status updated to: ${ticketStatus}`);
      }
    };
  
    const handleAssignUser = () => {
      if (assignedUser !== selectedTicket.assignedTo) {
        console.log('Assigning ticket to:', assignedUser);
        alert(`Ticket assigned to: ${assignedUser}`);
      }
    };
  
    // Filter comments based on tab
    const publicComments = history.filter(h => h.type === 'comment' && !h.isInternal);
    const internalNotes = history.filter(h => h.type === 'internal_note' || h.isInternal);
    const activityLogs = history.filter(h => h.type === 'status_change' || h.type === 'assignment');
  
    const renderCommentThread = (comments: Comment[]) => (
      <div className="position-relative" style={{ paddingLeft: '30px' }}>
        {comments.map((item, index) => (
          <div key={item.id} className="mb-4 position-relative">
            {/* Timeline line */}
            {index !== comments.length - 1 && (
              <div 
                className="position-absolute bg-light" 
                style={{ 
                  left: '-19px', 
                  top: '40px', 
                  width: '2px', 
                  height: 'calc(100% + 16px)' 
                }}
              />
            )}
  
            {/* Timeline dot */}
            <div 
              className={`position-absolute rounded-circle d-flex align-items-center justify-content-center ${
                item.type === 'status_change' ? 'bg-warning' :
                item.type === 'assignment' ? 'bg-info' :
                item.isInternal ? 'bg-danger' :
                'bg-primary'
              }`}
              style={{ 
                left: '-24px', 
                top: '8px', 
                width: '12px', 
                height: '12px'
              }}
            />
  
            <Card className="border">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      {item.type === 'status_change' ? (
                        <CheckCircle size={16} className="text-warning" />
                      ) : item.type === 'assignment' ? (
                        <User size={16} className="text-info" />
                      ) : item.isInternal ? (
                        <AlertCircle size={16} className="text-danger" />
                      ) : (
                        <MessageCircle size={16} className="text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        {item.user}
                        {item.isInternal && (
                          <Badge bg="danger" className="px-2 py-1" style={{ fontSize: '0.65rem' }}>
                            Internal
                          </Badge>
                        )}
                      </div>
                      <small className="text-muted">{item.userRole}</small>
                    </div>
                  </div>
                  <small className="text-muted">
                    <Clock size={12} className="me-1" />
                    {item.timestamp}
                  </small>
                </div>
  
                {item.type === 'status_change' ? (
                  <Alert variant="warning" className="mb-0 py-2 px-3">
                    <CheckCircle size={14} className="me-2" />
                    <small className="fw-semibold">{item.comment}</small>
                  </Alert>
                ) : item.type === 'assignment' ? (
                  <Alert variant="info" className="mb-0 py-2 px-3">
                    <User size={14} className="me-2" />
                    <small className="fw-semibold">{item.comment}</small>
                  </Alert>
                ) : (
                  <>
                    <p className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                      {item.comment}
                    </p>
                    
                    {/* Show attachments if any */}
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted fw-semibold d-block mb-2">Attachments:</small>
                        <div className="d-flex flex-wrap gap-2">
                          {item.attachments.map((file) => (
                            <Badge key={file.id} bg="light" text="dark" className="p-2 d-flex align-items-center gap-2">
                              <Paperclip size={12} />
                              <span>{file.name}</span>
                              <small className="text-muted">({file.size})</small>
                              <Button variant="link" size="sm" className="p-0 text-primary" title="Download">
                                <Download size={12} />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    );
  
    return (
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="xl" centered fullscreen>
        {/* <Modal.Header closeButton className="border-bottom bg-light"> */}
        <Modal.Header className="border-bottom bg-light">
          <div>
            <Modal.Title className="d-flex align-items-center gap-2">
              <span className="text-primary fw-bold">#{selectedTicket.id}</span>
              <span>{selectedTicket.title}</span>
            </Modal.Title>
            <div className="ticket-breadcrumbs-title bg-light pt-2 pl-0">
        <div className="d-flex align-items-center justify-content-between">
          <Breadcrumb className="mb-0">
            <Breadcrumb.Item 
              onClick={() => {
                setShowViewModal(false);
                //setActiveScreen('dashboard');
              }}
              style={{ cursor: 'pointer' }}
              className="d-flex align-items-center"
            >
              <Home size={14} className="me-1" />
              <span style={{ fontSize: '0.875rem' }}>Dashboard</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item 
              onClick={() => setShowViewModal(false)}
              style={{ cursor: 'pointer' }}
              className="d-flex align-items-center"
            >
              <List size={14} className="me-1" />
              <span style={{ fontSize: '0.875rem' }}>All Tickets</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item active className="d-flex align-items-center">
              <Ticket style={{ marginTop: '-3px' }} size={14} className="me-1" />
              <span style={{ fontSize: '0.875rem', marginTop: '-3px' }}>Ticket #{selectedTicket.id}</span>
            </Breadcrumb.Item>
          </Breadcrumb>
          
          
        </div>
      </div>
            {/* <div className="mt-2 d-flex gap-2 flex-wrap">
              <Badge bg={getPriorityBadgeColor(selectedTicket.priority)} className="bg-opacity-10 text-dark">
                <AlertCircle size={14} className="me-1" />
                {selectedTicket.priority}
              </Badge>
              <Badge bg={getStatusBadgeColor(selectedTicket.status)} className="bg-opacity-10 text-dark">
                {selectedTicket.status}
              </Badge>
              <Badge bg="light" text="dark">
                <Tag size={14} className="me-1" />
                {selectedTicket.type}
              </Badge>
              {selectedTicket.isInternal && (
                <Badge bg="danger">
                  <AlertCircle size={14} className="me-1" />
                  Internal Ticket
                </Badge>
              )}
            </div> */}
          </div>
        </Modal.Header>
        
        <Modal.Body style={{ height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <Row>
            {/* Ticket Details Sidebar */}
            <Col lg={3} className="border-end">
  <h5 className="fw-bold mb-4">Ticket Details</h5>
  
  <Row className="mb-3">
    <Col xs={12}>
      <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Module</small>
      <Badge bg="primary" className="bg-opacity-10 text-dark px-2 py-2">
        <FileText size={14} className="me-2" />
        <span style={{ fontSize: '0.875rem' }}>{selectedTicket.module}</span>
      </Badge>
    </Col>
  </Row>

  <Row className="mb-3">
    <Col xs={6}>
      <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Type</small>
      <Badge bg="secondary" className="bg-opacity-10 text-dark px-2 py-2">
        <Tag size={14} className="me-2" />
        <span style={{ fontSize: '0.875rem' }}>{selectedTicket.type}</span>
      </Badge>
    </Col>
    <Col xs={6}>
      <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Priority</small>
      <Badge bg={getPriorityBadgeColor(selectedTicket.priority)} className="bg-opacity-10 text-dark px-2 py-2">
        <span style={{ fontSize: '0.875rem' }}>{selectedTicket.priority}</span>
      </Badge>
    </Col>
  </Row>

  <Row className="mb-3">
    <Col xs={6}>
      <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Created At</small>
      <div className="d-flex align-items-center gap-2">
        <Clock size={14} className="text-muted" />
        <span style={{ fontSize: '0.875rem' }}>{selectedTicket.createdAt}</span>
      </div>
    </Col>
    <Col xs={6}>
      <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Due Date</small>
      <div className="d-flex align-items-center gap-2">
        <Calendar size={14} className="text-muted" />
        <span 
          className={selectedTicket.dueDate === 'No due date' ? 'text-muted' : 'fw-semibold'} 
          style={{ fontSize: '0.875rem' }}
        >
          {selectedTicket.dueDate}
        </span>
      </div>
    </Col>
  </Row>

  <div className="mb-3">
    <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Created By</small>
    <div className="d-flex align-items-center gap-2">
      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
        <User size={16} className="text-primary" />
      </div>
      <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>{selectedTicket.createdBy}</span>
    </div>
  </div>

  <hr className="my-4" />

  {/* Status Update Section */}
  <div className="mb-3">
    <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Update Status</small>
    <InputGroup>
      <Form.Select
        value={ticketStatus}
        onChange={(e) => setTicketStatus(e.target.value)}
        className="form-control"
        style={{ fontSize: '0.875rem' }}
      >
        {statuses.map(status => (
          <option key={status.id} value={status.name}>{status.name}</option>
        ))}
      </Form.Select>
      {/* <Button 
        variant="primary" 
        onClick={handleStatusUpdate}
        disabled={ticketStatus === selectedTicket.status}
        style={{ fontSize: '0.875rem' }}
      >
        Update
      </Button> */}
    </InputGroup>
  </div>

  {/* Assign User Section */}
  <div className="mb-3">
    <small className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '0.813rem' }}>Assign To</small>
    <InputGroup>
      <Form.Select
        value={assignedUser}
        onChange={(e) => setAssignedUser(e.target.value)}
        className="form-control"
        style={{ fontSize: '0.875rem' }}
      >
        {availableUsers.map(user => (
          <option key={user.id} value={user.name}>{user.name}</option>
        ))}
      </Form.Select>
      {/* <Button 
        variant="success" 
        onClick={handleAssignUser}
        disabled={assignedUser === selectedTicket.assignedTo}
        style={{ fontSize: '0.875rem' }}
      >
        Assign
      </Button> */}
    </InputGroup>
  </div>

  <hr className="my-4" />

  <div className="mb-4">
    <h6 className="fw-bold mb-3">Description</h6>
    <p className="text-muted mb-0" style={{ fontSize: '0.938rem', lineHeight: '1.6' }}>
      {selectedTicket.description}
    </p>
  </div>

  {/* Initial Attachments */}
  {selectedTicket.initialAttachments && selectedTicket.initialAttachments.length > 0 && (
    <div className="mb-3">
      <h6 className="fw-bold mb-3">Initial Attachments</h6>
      <div className="d-flex flex-column gap-2">
        {selectedTicket.initialAttachments.map((file) => (
          <div 
            key={file.id} 
            className="p-2 bg-light rounded d-flex align-items-center justify-content-between"
            style={{ border: '1px solid #e0e0e0' }}
          >
            <div className="d-flex align-items-center gap-2 flex-grow-1">
              <Paperclip size={14} className="text-primary" />
              <div className="d-flex flex-column">
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{file.name}</span>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{file.size}</small>
              </div>
            </div>
            <Button 
              variant="link" 
              size="sm" 
              className="p-1 text-primary" 
              title="Download"
              style={{ minWidth: 'auto' }}
            >
              <Download size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )}
</Col>
  
            {/* Thread Section with Tabs */}
            <Col lg={9}>
              {/* Tab Navigation */}
              <div className="mb-4">
                <div className="d-flex gap-2 border-bottom pb-2">
                  <Button
                    variant={activeTab === 'public' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setActiveTab('public')}
                    className="d-flex align-items-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Public Conversation
                    <Badge bg={activeTab === 'public' ? 'light' : 'primary'} text={activeTab === 'public' ? 'dark' : 'white'}>
                      {publicComments.length}
                    </Badge>
                  </Button>
                  <Button
                    variant={activeTab === 'internal' ? 'danger' : 'outline-danger'}
                    size="sm"
                    onClick={() => setActiveTab('internal')}
                    className="d-flex align-items-center gap-2"
                  >
                    <AlertCircle size={16} />
                    Internal Notes
                    <Badge bg={activeTab === 'internal' ? 'light' : 'danger'} text={activeTab === 'internal' ? 'dark' : 'white'}>
                      {internalNotes.length}
                    </Badge>
                  </Button>
                  <Button
                    variant={activeTab === 'activity' ? 'warning' : 'outline-warning'}
                    size="sm"
                    onClick={() => setActiveTab('activity')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Clock size={16} />
                    Activity Logs
                    <Badge bg={activeTab === 'activity' ? 'light' : 'warning'} text={activeTab === 'activity' ? 'dark' : 'white'}>
                      {activityLogs.length}
                    </Badge>
                  </Button>
                </div>
              </div>
  
              {/* Tab Content */}
              <div>
                {activeTab === 'public' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">
                        <MessageCircle size={18} className="me-2" />
                        Public Conversation ({publicComments.length})
                      </h6>
                    </div>
                    {publicComments.length > 0 ? (
                      renderCommentThread(publicComments)
                    ) : (
                      <Alert variant="info">
                        <Info size={16} className="me-2" />
                        No public comments yet. Start the conversation!
                      </Alert>
                    )}
                  </>
                )}
  
                {activeTab === 'internal' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-danger">
                        <AlertCircle size={18} className="me-2" />
                        Internal Notes ({internalNotes.length})
                      </h6>
                    </div>
                    <Alert variant="danger" className="mb-3">
                      <AlertCircle size={16} className="me-2" />
                      <strong>Private:</strong> These notes are only visible to internal team members and will not be shown to customers.
                    </Alert>
                    {internalNotes.length > 0 ? (
                      renderCommentThread(internalNotes)
                    ) : (
                      <Alert variant="warning">
                        <Info size={16} className="me-2" />
                        No internal notes yet. Add private notes for your team.
                      </Alert>
                    )}
                  </>
                )}
  
                {activeTab === 'activity' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-warning">
                        <Clock size={18} className="me-2" />
                        Activity Logs ({activityLogs.length})
                      </h6>
                    </div>
                    {activityLogs.length > 0 ? (
                      renderCommentThread(activityLogs)
                    ) : (
                      <Alert variant="secondary">
                        <Info size={16} className="me-2" />
                        No activity logs yet.
                      </Alert>
                    )}
                  </>
                )}
              </div>
  
              {/* Add Comment Section */}
              {(selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved') && activeTab !== 'activity' && (
                <Card className={`border-${activeTab === 'internal' ? 'danger' : 'primary'} mt-4`}>
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">
                        {activeTab === 'internal' ? 'Add Internal Note' : 'Add Comment'}
                      </h6>
                      {/* Comment Type Toggle */}
                      <div className="d-flex gap-2">
                        <Form.Check
                          type="radio"
                          id="comment-public"
                          label="Public"
                          name="commentType"
                          checked={commentType === 'public'}
                          onChange={() => {
                            setCommentType('public');
                            setActiveTab('public');
                          }}
                        />
                        <Form.Check
                          type="radio"
                          id="comment-internal"
                          label="Internal"
                          name="commentType"
                          checked={commentType === 'internal'}
                          onChange={() => {
                            setCommentType('internal');
                            setActiveTab('internal');
                          }}
                        />
                      </div>
                    </div>
                    
                    {commentType === 'internal' && (
                      <Alert variant="danger" className="py-2 mb-3">
                        <AlertCircle size={14} className="me-2" />
                        <small>This note will only be visible to internal team members</small>
                      </Alert>
                    )}
  
                    <Form.Group className="mb-3">
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder={commentType === 'internal' ? "Type your internal note here..." : "Type your comment here..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="border-0 bg-light"
                      />
                    </Form.Group>
  
                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted fw-semibold mb-2 d-block">Attachments:</small>
                        {attachments.map((file, index) => (
                          <Badge key={index} bg="light" text="dark" className="me-2 mb-2 p-2">
                            <Paperclip size={12} className="me-1" />
                            {file.name}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 ms-2 text-danger"
                              onClick={() => removeAttachment(index)}
                            >
                              <X size={12} />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
  
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <label htmlFor="file-upload" className="btn btn-outline-secondary btn-sm">
                          <Paperclip size={14} className="me-1" />
                          Attach Files
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          className="d-none"
                          onChange={handleFileUpload}
                        />
                      </div>
                      <Button 
                        variant={commentType === 'internal' ? 'danger' : 'primary'}
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        <Send size={14} className="me-1" />
                        {commentType === 'internal' ? 'Add Internal Note' : 'Add Comment'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}
  
              {(selectedTicket.status === 'Closed' || selectedTicket.status === 'Resolved') && (
                <Alert variant="success" className="mt-4">
                  <CheckCircle size={16} className="me-2" />
                  This ticket is {selectedTicket.status.toLowerCase()}. No further comments can be added.
                </Alert>
              )}
            </Col>
          </Row>
        </Modal.Body>
        
        {/* <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer> */}
      </Modal>
    );
  };
  
    return (
      <div className="container-fluid p-4">
        {renderTicketListing()}
        {CreateTicketModal()}
        <ViewTicketModal/>
      </div>
    );
  };

 

// Status Management Screen Component
// Status Management Screen
const StatusManagementScreen: React.FC = () => {
    const [statuses, setStatuses] = useState<StatusType[]>([
      { id: 1, name: 'Open', color: '#ffc107', createdAt: '15/09/2025' },
      { id: 2, name: 'In Progress', color: '#0dcaf0', createdAt: '15/09/2025' },
      { id: 3, name: 'Resolved', color: '#198754', createdAt: '15/09/2025' },
      { id: 4, name: 'Closed', color: '#6c757d', createdAt: '15/09/2025' },
      { id: 5, name: 'Pending', color: '#fd7e14', createdAt: '15/09/2025' },
    ]);
  
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingStatus, setEditingStatus] = useState<StatusType | null>(null);
    const [formData, setFormData] = useState<{ name: string; color: string }>({ 
      name: '', 
      color: '#0d6efd' 
    });
    const [searchTerm, setSearchTerm] = useState<string>('');
  
    const handleOpenModal = (status: StatusType | null = null): void => {
      if (status) {
        setEditingStatus(status);
        setFormData({ name: status.name, color: status.color });
      } else {
        setEditingStatus(null);
        setFormData({ name: '', color: '#0d6efd' });
      }
      setShowModal(true);
    };
  
    const handleSaveStatus = (): void => {
      if (!formData.name.trim()) {
        alert('Status name is required');
        return;
      }
  
      if (editingStatus) {
        setStatuses(statuses.map(s => 
          s.id === editingStatus.id ? { ...s, ...formData } : s
        ));
      } else {
        setStatuses([...statuses, {
          id: Math.max(...statuses.map(s => s.id), 0) + 1,
          ...formData,
          createdAt: new Date().toLocaleDateString('en-GB')
        }]);
      }
      setShowModal(false);
    };
  
    const handleDelete = (id: number): void => {
      if (window.confirm('Are you sure you want to delete this status?')) {
        setStatuses(statuses.filter(s => s.id !== id));
      }
    };
  
    const filteredStatuses = statuses.filter(status =>
      status.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    return (
      <div>
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h2 className="mb-2 fw-bold d-flex align-items-center">
                <div className="rounded-3 p-2 me-3" style={{ backgroundColor: '#0d6efd15' }}>
                  <Tag size={24} className="text-primary" />
                </div>
                Ticket Status
              </h2>
              <p className="text-muted mb-0">Manage and organize ticket statuses</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => handleOpenModal()} 
              className="shadow-sm"
              style={{ padding: '0.5rem 1.5rem' }}
            >
              <Plus size={18} className="me-2" />
              Add Status
            </Button>
          </div>
  
          {/* Stats Cards */}
          {/* <Row className="g-3 mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Card.Body className="text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-1 opacity-75 small">Total Statuses</p>
                      <h3 className="mb-0 fw-bold">{statuses.length}</h3>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-3">
                      <Tag size={24} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <Card.Body className="text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-1 opacity-75 small">Active</p>
                      <h3 className="mb-0 fw-bold">{statuses.filter(s => s.name !== 'Closed').length}</h3>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-3">
                      <Grid3x3 size={24} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <Card.Body className="text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-1 opacity-75 small">Closed Status</p>
                      <h3 className="mb-0 fw-bold">{statuses.filter(s => s.name === 'Closed').length}</h3>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-3">
                      <Box size={24} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row> */}
        </div>
  
        {/* Main Content */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            {/* Search Bar */}
            <div className="mb-4">
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search statuses..."
                  className="border-start-0 bg-light"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
  
            {/* Status Grid */}
            <Row className="g-3">
              {filteredStatuses.map((status) => (
                <Col key={status.id} md={6} lg={4} xl={3}>
                  <Card 
                    className="border-0 h-100 position-relative"
                    style={{ 
                        transition: 'all 0.3s ease',
                      backgroundColor: '#f8f9fa',
                      border: `4px solid ${status.color}30`,
                      
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 8px 16px ${status.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div 
                          className="rounded-circle p-2"
                          style={{ backgroundColor: status.color }}
                        >
                          <Tag size={16} className="text-white" />
                        </div>
                        <div className="d-flex gap-1">
                          <Button
                            variant="light"
                            size="sm"
                            className="p-1 rounded-circle"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleOpenModal(status)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            className="p-1 rounded-circle text-danger"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleDelete(status.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <h6 className="mb-2 fw-bold">{status.name}</h6>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div 
                          className="rounded"
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            backgroundColor: status.color 
                          }}
                        />
                        <code className="small text-muted">{status.color}</code>
                      </div>
                      <small className="text-muted">Created: {status.createdAt}</small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
  
            {filteredStatuses.length === 0 && (
              <div className="text-center py-5">
                <Tag size={48} className="text-muted mb-3" />
                <p className="text-muted">No statuses found</p>
              </div>
            )}
          </Card.Body>
        </Card>
  
        {/* Modal */}
       {/* Modal */}
<Modal show={showModal} onHide={() => setShowModal(false)} centered>
  <Modal.Header closeButton className="border-0 pb-0 bg-light">
    <div className="d-flex align-items-center justify-content-between w-100 pe-3">
      <Modal.Title className="fw-bold d-flex align-items-center gap-2">
        <div className="p-2">
          <Tag size={20} className="text-primary" />
        </div>
        <span>{editingStatus ? 'Edit Status' : 'Create New Status'}</span>
      </Modal.Title>
    </div>
  </Modal.Header>

  <Modal.Body className="px-4 pb-4">
    {/* Guidelines Alert */}
    {/* {!editingStatus && (
      <Alert variant="info" className="mb-4 border-0 shadow-sm">
        <div className="d-flex align-items-start gap-3">
          <div className="bg-info bg-opacity-10 rounded-circle p-2" style={{ minWidth: '40px', height: '40px' }}>
            <Info size={20} className="text-info" />
          </div>
          <div>
            <h6 className="fw-bold mb-2 text-info">Status Setup Guidelines</h6>
            <ul className="mb-0 ps-3" style={{ fontSize: '0.875rem', lineHeight: '1.8' }}>
              <li>Use <strong>clear, action-oriented names</strong> like "Open", "In Progress", "Resolved"</li>
              <li>Choose <strong>meaningful colors</strong> that represent the status state</li>
              <li>Keep status names <strong>short and consistent</strong> across the system</li>
              <li>Consider the <strong>ticket workflow</strong> when creating statuses</li>
            </ul>
          </div>
        </div>
      </Alert>
    )} */}

    <Form>
      {/* Status Name */}
      <Form.Group className="mb-4">
        <Form.Label className="fw-semibold d-flex align-items-center gap-2">
          Status Name <span className="text-danger">*</span>
          <span 
            className="text-muted" 
            title="Enter a clear name that represents the ticket state"
            style={{ cursor: 'help' }}
          >
            <Info size={14} />
          </span>
        </Form.Label>
        <Form.Control
          type="text"
          placeholder="e.g., Open, In Progress, Resolved, Pending Review"
          value={formData.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => 
            setFormData({ ...formData, name: e.target.value })
          }
          className="py-2"
          style={{ fontSize: '0.938rem' }}
        />
        <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
          <Info size={12} />
          <span style={{ fontSize: '0.813rem' }}>
            Use descriptive names that clearly indicate the current state of a ticket in your workflow.
          </span>
        </Form.Text>
      </Form.Group>

      {/* Status Color */}
      <Form.Group className="mb-4">
        <Form.Label className="fw-semibold d-flex align-items-center gap-2">
          Status Color <span className="text-danger">*</span>
          <span 
            className="text-muted" 
            title="Select a color that visually represents this status"
            style={{ cursor: 'help' }}
          >
            <Info size={14} />
          </span>
        </Form.Label>
        <div className="d-flex gap-2">
          <Form.Control
            type="color"
            value={formData.color}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setFormData({ ...formData, color: e.target.value })
            }
            style={{ width: '60px', height: '45px', cursor: 'pointer' }}
            title="Click to choose a color"
          />
          <Form.Control
            type="text"
            value={formData.color}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setFormData({ ...formData, color: e.target.value })
            }
            placeholder="#000000"
            className="py-2"
            style={{ fontSize: '0.938rem' }}
          />
        </div>
        <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
          <Info size={12} className="me-1" />
          Choose colors that align with status meaning (e.g., green for completed, yellow for pending, red for critical).
        </Form.Text>
        
        {/* Color Suggestions */}
        <div className="mt-3">
          <small className="text-muted fw-semibold d-block mb-2">Suggested Colors:</small>
          <div className="d-flex gap-2 flex-wrap">
            {[
              { name: 'Blue', color: '#0d6efd', label: 'Open/New' },
              { name: 'Yellow', color: '#ffc107', label: 'Pending' },
              { name: 'Orange', color: '#fd7e14', label: 'In Progress' },
              { name: 'Green', color: '#198754', label: 'Resolved' },
              { name: 'Gray', color: '#6c757d', label: 'Closed' },
              { name: 'Red', color: '#dc3545', label: 'Blocked' },
            ].map((suggestion) => (
              <Button
                key={suggestion.color}
                variant="outline-secondary"
                size="sm"
                className="d-flex align-items-center gap-2"
                onClick={() => setFormData({ ...formData, color: suggestion.color })}
                style={{ padding: '0.25rem 0.75rem' }}
              >
                <div 
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    backgroundColor: suggestion.color,
                    borderRadius: '3px',
                    border: '1px solid #dee2e6'
                  }}
                />
                <small>{suggestion.label}</small>
              </Button>
            ))}
          </div>
        </div>
      </Form.Group>

      {/* Preview */}
      <Form.Group>
        <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
          <Eye size={16} />
          Status Preview
        </Form.Label>
        <Card className="border-0 bg-light">
          <Card.Body className="p-3">
            <div className="d-flex flex-column gap-3">
              {/* Badge Preview */}
              <div>
                <small className="text-muted d-block mb-2">As Badge:</small>
                <Badge 
                  style={{ 
                    backgroundColor: formData.color,
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <Tag size={14} className="me-2" />
                  {formData.name || 'Status Name'}
                </Badge>
              </div>
              
              {/* Pill Preview */}
              <div>
                <small className="text-muted d-block mb-2">As Status Indicator:</small>
                <div className="d-flex align-items-center gap-2 p-2 bg-white rounded border">
                  <div 
                    className="rounded-circle"
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: formData.color 
                    }}
                  />
                  <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>
                    {formData.name || 'Status Name'}
                  </span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
        <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
          <Info size={12} className="me-1" />
          This is how your status will appear in tickets, dashboards, and reports
        </Form.Text>
      </Form.Group>
    </Form>
  </Modal.Body>

  <Modal.Footer className="border-0 pt-0 bg-light">
    <div className="d-flex justify-content-between align-items-center w-100">
      <Form.Text className="text-muted d-flex align-items-center gap-1">
        <AlertCircle size={14} />
        <span style={{ fontSize: '0.813rem' }}>
          Fields marked with <span className="text-danger fw-bold">*</span> are required
        </span>
      </Form.Text>
      <div className="d-flex gap-2">
        <Button variant="light" onClick={() => setShowModal(false)}>
          <X size={16} className="me-1" />
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSaveStatus}
          disabled={!formData.name.trim() || !formData.color}
        >
          <Check size={16} className="me-1" />
          {editingStatus ? 'Update Status' : 'Create Status'}
        </Button>
      </div>
    </div>
  </Modal.Footer>
</Modal>
      </div>
    );
  };
  
  // Module Management Screen
  const ModuleManagementScreen: React.FC = () => {
    const [modules, setModules] = useState<ModuleType[]>([
      { id: 1, name: 'Omni Channel', description: 'Multi-channel communication system', color: '#0d6efd', userExtension: '101-150', createdAt: '15/09/2025' },
      { id: 2, name: 'Call Logs', description: 'Call logging and tracking module', color: '#198754', userExtension: '201-250', createdAt: '15/09/2025' },
      { id: 3, name: 'TMS', description: 'Tenant and property management', color: '#dc3545', userExtension: '301-350', createdAt: '15/09/2025' },
      { id: 4, name: 'CTI', description: 'Computer Telephony Integration', color: '#fd7e14', userExtension: '401-450', createdAt: '15/09/2025' },
    ]);
  
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingModule, setEditingModule] = useState<ModuleType | null>(null);
    const [formData, setFormData] = useState<Omit<ModuleType, 'id' | 'createdAt'>>({
      name: '',
      description: '',
      color: '#0d6efd',
      userExtension: ''
    });
    const [searchTerm, setSearchTerm] = useState<string>('');
  
    const handleOpenModal = (module: ModuleType | null = null): void => {
      if (module) {
        setEditingModule(module);
        setFormData({
          name: module.name,
          description: module.description,
          color: module.color,
          userExtension: module.userExtension
        });
      } else {
        setEditingModule(null);
        setFormData({ name: '', description: '', color: '#0d6efd', userExtension: '' });
      }
      setShowModal(true);
    };
  
    const handleSaveModule = (): void => {
      if (!formData.name.trim() || !formData.description.trim()) {
        alert('Module name and description are required');
        return;
      }
  
      if (editingModule) {
        setModules(modules.map(m => 
          m.id === editingModule.id ? { ...m, ...formData } : m
        ));
      } else {
        setModules([...modules, {
          id: Math.max(...modules.map(m => m.id), 0) + 1,
          ...formData,
          createdAt: new Date().toLocaleDateString('en-GB')
        }]);
      }
      setShowModal(false);
    };
  
    const handleDelete = (id: number): void => {
      if (window.confirm('Are you sure you want to delete this module?')) {
        setModules(modules.filter(m => m.id !== id));
      }
    };
  
    const filteredModules = modules.filter(module =>
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    return (
      <div>
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h2 className="mb-2 fw-bold d-flex align-items-center">
                <div className="rounded-3 p-2 me-3" style={{ backgroundColor: '#198754 15' }}>
                  <Layers size={24} className="text-success" />
                </div>
                Ticket Modules
              </h2>
              <p className="text-muted mb-0">Manage and organize ticket modules</p>
            </div>
            <Button 
              variant="success" 
              onClick={() => handleOpenModal()} 
              className="shadow-sm btn btn-primary"
              style={{ padding: '0.5rem 1.5rem' }}
            >
              <Plus size={18} className="me-2" />
              Add Module
            </Button>
          </div>
  
          {/* Stats Cards */}
          {/* <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <Card.Body className="text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-1 opacity-75 small">Total Modules</p>
                      <h3 className="mb-0 fw-bold">{modules.length}</h3>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-3">
                      <Layers size={24} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row> */}
        </div>
  
        {/* Main Content */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            {/* Search Bar */}
            <div className="mb-4">
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search modules..."
                  className="border-start-0 bg-light"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
  
            {/* Module Cards */}
            <Row className="g-4">
              {filteredModules.map((module) => (
                <Col key={module.id} md={6} lg={6}>
                  <Card 
                    className="border-0 h-100"
                    style={{ 
                      borderLeft: `4px solid ${module.color}`,
                      transition: 'all 0.3s ease',
                      backgroundColor: '#f8f9fa'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center">
                          <div 
                            className="rounded-3 p-2 me-3"
                            style={{ backgroundColor: `${module.color}20` }}
                          >
                            <Layers size={24} style={{ color: module.color }} />
                          </div>
                          <div>
                            <h5 className="mb-1 fw-bold">{module.name}</h5>
                            <Badge 
                              style={{ backgroundColor: module.color }}
                              className="px-2 py-1"
                            >
                              {module.userExtension}
                            </Badge>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <Button
                            variant="light"
                            size="sm"
                            className="rounded-circle"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleOpenModal(module)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            className="rounded-circle text-danger"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleDelete(module.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted mb-3">{module.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Created: {module.createdAt}</small>
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded"
                            style={{ 
                              width: '16px', 
                              height: '16px', 
                              backgroundColor: module.color 
                            }}
                          />
                          <code className="small">{module.color}</code>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
  
            {filteredModules.length === 0 && (
              <div className="text-center py-5">
                <Layers size={48} className="text-muted mb-3" />
                <p className="text-muted">No modules found</p>
              </div>
            )}
          </Card.Body>
        </Card>
  
        {/* Modal */}
<Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
  <Modal.Header closeButton className="border-0 pb-0 bg-light">
    <div className="d-flex align-items-center justify-content-between w-100 pe-3">
      <Modal.Title className="fw-bold d-flex align-items-center gap-2">
        <div className="p-2">
          <Layers size={20} className="text-success" />
        </div>
        <span>{editingModule ? 'Edit Module' : 'Create New Module'}</span>
      </Modal.Title>
    </div>
  </Modal.Header>

  <Modal.Body className="px-4 pb-4">
    {/* Guidelines Alert */}
    {/* {!editingModule && (
      <Alert variant="info" className="mb-4 border-0 shadow-sm">
        <div className="d-flex align-items-start gap-3">
          <div className="bg-info bg-opacity-10 rounded-circle p-2" style={{ minWidth: '40px', height: '40px' }}>
            <Info size={20} className="text-info" />
          </div>
          <div>
            <h6 className="fw-bold mb-2 text-info">Module Setup Guidelines</h6>
            <ul className="mb-0 ps-3" style={{ fontSize: '0.875rem', lineHeight: '1.8' }}>
              <li>Use a <strong>clear, descriptive name</strong> that represents the system area</li>
              <li>Provide a <strong>detailed description</strong> to help users understand the module's purpose</li>
              <li>Choose a <strong>unique color</strong> for easy visual identification</li>
              <li>Optionally specify <strong>user extension ranges</strong> for access control</li>
            </ul>
          </div>
        </div>
      </Alert>
    )} */}

    <Form>
      <Row>
        {/* Module Name */}
        <Col md={12} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Module Name <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Enter a unique, descriptive name for this module"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Customer Relationship Management"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => 
                setFormData({ ...formData, name: e.target.value })
              }
              className="py-2"
              style={{ fontSize: '0.938rem' }}
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: '0.813rem' }}>
                Choose a clear name that represents the functional area or system component.
              </span>
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Description */}
        <Col md={12} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Description <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Provide a comprehensive description of the module's purpose and scope"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe what this module covers, its main features, and who should use it..."
              value={formData.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                setFormData({ ...formData, description: e.target.value })
              }
              style={{ fontSize: '0.938rem', lineHeight: '1.6' }}
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: '0.813rem' }}>
                Explain the module's purpose, main features, and target users. This helps with ticket routing and categorization.
              </span>
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Module Color */}
        <Col md={6} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Module Color <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Select a unique color to visually identify this module"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="color"
                value={formData.color}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, color: e.target.value })
                }
                style={{ width: '60px', height: '45px', cursor: 'pointer' }}
                title="Click to choose a color"
              />
              <Form.Control
                type="text"
                value={formData.color}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="#000000"
                className="py-2"
                style={{ fontSize: '0.938rem' }}
              />
            </div>
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: '0.813rem' }}>
                Choose a distinct color for easy visual identification in lists, dashboards, and reports.
              </span>
            </Form.Text>
          </Form.Group>
        </Col>

        {/* User Extension */}
        <Col md={6} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              User Extension Range
              <span 
                className="text-muted" 
                title="Optional: Specify user extension numbers for access control"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., 101-150 or 200-299"
              value={formData.userExtension}
              onChange={(e: ChangeEvent<HTMLInputElement>) => 
                setFormData({ ...formData, userExtension: e.target.value })
              }
              className="py-2"
              style={{ fontSize: '0.938rem' }}
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: '0.813rem' }}>
                Optional: Define extension number ranges (e.g., 101-150) for users who can access this module.
              </span>
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Preview Section */}
        <Col md={12}>
          <Card className="border-0 bg-light">
            <Card.Body className="p-3">
              <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <Eye size={16} />
                Preview
              </Form.Label>
              <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 border">
                <div 
                  className="rounded-3 p-2"
                  style={{ backgroundColor: `${formData.color || '#0d6efd'}20` }}
                >
                  <Layers size={24} style={{ color: formData.color || '#0d6efd' }} />
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-1 fw-bold">{formData.name || 'Module Name'}</h6>
                  <p className="mb-2 text-muted small">{formData.description || 'Module description will appear here...'}</p>
                  <div className="d-flex gap-2 align-items-center">
                    {formData.userExtension && (
                      <Badge 
                        style={{ backgroundColor: formData.color || '#0d6efd' }}
                        className="px-2 py-1"
                      >
                        {formData.userExtension}
                      </Badge>
                    )}
                    <div className="d-flex align-items-center gap-2">
                      <div 
                        className="rounded"
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: formData.color || '#0d6efd',
                          border: '1px solid #dee2e6'
                        }}
                      />
                      <code className="small">{formData.color || '#0d6efd'}</code>
                    </div>
                  </div>
                </div>
              </div>
              <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
                <Info size={12} className="me-1" />
                This is how your module will appear in the system
              </Form.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Form>
  </Modal.Body>

  <Modal.Footer className="border-0 pt-0 bg-light">
    <div className="d-flex justify-content-between align-items-center w-100">
      <Form.Text className="text-muted d-flex align-items-center gap-1">
        <AlertCircle size={14} />
        <span style={{ fontSize: '0.813rem' }}>
          Fields marked with <span className="text-danger fw-bold">*</span> are required
        </span>
      </Form.Text>
      <div className="d-flex gap-2">
        <Button variant="light" onClick={() => setShowModal(false)}>
          <X size={16} className="me-1" />
          Cancel
        </Button>
        <Button 
          variant="success" 
          onClick={handleSaveModule}
          disabled={!formData.name.trim() || !formData.description.trim() || !formData.color}
        >
          <Check size={16} className="me-1" />
          {editingModule ? 'Update Module' : 'Create Module'}
        </Button>
      </div>
    </div>
  </Modal.Footer>
</Modal>
      </div>
    );
  };
  
// Categories Management Screen
const CategoriesManagementScreen: React.FC = () => {
  const [categories, setCategories] = useState<CategoryType[]>([
    { id: 1, name: 'Email Integration', description: 'Email channel integration', module: 'Omni Channel', createdAt: '15/09/2025' },
    { id: 2, name: 'SMS Gateway', description: 'SMS communication gateway', module: 'Omni Channel', createdAt: '15/09/2025' },
    { id: 3, name: 'Inbound Calls', description: 'Incoming call logs', module: 'Call Logs', createdAt: '15/09/2025' },
    { id: 4, name: 'Web Dialer', description: 'Browser-based dialer', module: 'CTI', createdAt: '15/09/2025' },
    { id: 5, name: 'WhatsApp Business', description: 'WhatsApp integration', module: 'Omni Channel', createdAt: '15/09/2025' },
    { id: 6, name: 'Outbound Calls', description: 'Outgoing call logs', module: 'Call Logs', createdAt: '15/09/2025' },
  ]);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [formData, setFormData] = useState<Omit<CategoryType, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    module: ''
  });
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Parent modules with their colors
  const modules: NewModuleType[] = [
    { id: 1, name: 'Omni Channel', color: '#0d6efd' },
    { id: 2, name: 'Call Logs', color: '#198754' },
    { id: 3, name: 'TMS', color: '#dc3545' },
    { id: 4, name: 'CTI', color: '#fd7e14' },
    { id: 5, name: 'Ticket', color: '#6f42c1' },
  ];

  const handleOpenModal = (category: CategoryType | null = null): void => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        module: category.module
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', module: '' });
    }
    setShowModal(true);
  };

  const handleSaveCategory = (): void => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.module) {
      alert('All fields are required');
      return;
    }

    if (editingCategory) {
      setCategories(categories.map(c => 
        c.id === editingCategory.id ? { ...c, ...formData } : c
      ));
    } else {
      setCategories([...categories, {
        id: Math.max(...categories.map(c => c.id), 0) + 1,
        ...formData,
        createdAt: new Date().toLocaleDateString('en-GB')
      }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number): void => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get module color by name
  const getModuleColor = (moduleName: string): string => {
    const module = modules.find(m => m.name === moduleName);
    return module ? module.color : '#6c757d';
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="mb-1 fw-bold">Categories Management</h4>
          <p className="text-muted mb-0">Organize and manage ticket categories by modules</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => handleOpenModal()}
          className="d-flex align-items-center gap-2"
          style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
        >
          <Plus size={18} />
          Add Category
        </Button>
      </div>

      {/* Search and Stats Bar */}
      <Row className="mb-4 g-3">
      <div className="mb-4">
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search categories..."
                  className="border-start-0 bg-light"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
        {/* <Col md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Card.Body className="d-flex align-items-center justify-content-between text-white py-3">
              <div>
                <small className="opacity-75">Total Categories</small>
                <h4 className="mb-0 fw-bold">{categories.length}</h4>
              </div>
              <div className="bg-white bg-opacity-25 rounded p-2">
                <Grid3x3 size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col> */}
      </Row>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <Row className="g-4">
          {filteredCategories.map((category) => (
            <Col key={category.id} xs={12} md={6} lg={4}>
              <Card 
                className="border-0 shadow-sm h-100 position-relative overflow-hidden"
                style={{ transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                {/* Color Accent Bar */}
                <div 
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: getModuleColor(category.module)
                  }}
                />
                
                <Card.Body className="p-4">
                  {/* Header with Icon and Actions */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div 
                      className="rounded-3 p-3"
                      style={{ 
                        backgroundColor: `${getModuleColor(category.module)}15`,
                        width: 'fit-content'
                      }}
                    >
                      <Grid3x3 size={24} style={{ color: getModuleColor(category.module) }} />
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="link"
                        size="sm"
                        className="p-2 text-primary"
                        onClick={() => handleOpenModal(category)}
                        title="Edit Category"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-2 text-danger"
                        onClick={() => handleDelete(category.id)}
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Category Name */}
                  <h5 className="fw-bold mb-2">{category.name}</h5>
                  
                  {/* Description */}
                  <p className="text-muted mb-3 small" style={{ minHeight: '40px' }}>
                    {category.description}
                  </p>

                  {/* Footer Info */}
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                    <div className="d-flex align-items-center gap-2">
                      <Layers size={14} style={{ color: getModuleColor(category.module) }} />
                      <small className="fw-semibold" style={{ color: getModuleColor(category.module) }}>
                        {category.module}
                      </small>
                    </div>
                    <small className="text-muted">{category.createdAt}</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <div 
              className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: '#f8f9fa' 
              }}
            >
              <Grid3x3 size={40} className="text-muted" />
            </div>
            <h5 className="fw-bold mb-2">No categories found</h5>
            <p className="text-muted mb-0">
              {searchTerm 
                ? 'Try adjusting your search criteria' 
                : 'Get started by creating your first category'}
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0 bg-light">
          <div className="d-flex align-items-center justify-content-between w-100 pe-3">
            <Modal.Title className="fw-bold d-flex align-items-center gap-2">
              <div className="p-2">
                <Grid3x3 size={20} style={{ color: '#6f42c1' }} />
              </div>
              <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
            </Modal.Title>
          </div>
        </Modal.Header>

        <Modal.Body className="px-4 pb-4">
          <Form>
            <Row>
              {/* Parent Module */}
              <Col md={12} className="mb-4">
                <Form.Group>
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                    Parent Module <span className="text-danger">*</span>
                    <span 
                      className="text-muted" 
                      title="Select the module this category will belong to"
                      style={{ cursor: 'help' }}
                    >
                      <Info size={14} />
                    </span>
                  </Form.Label>
                  <Form.Select
                    value={formData.module}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                      setFormData({ ...formData, module: e.target.value })
                    }
                    className="py-2"
                    style={{ fontSize: '0.938rem' }}
                  >
                    <option value="">Select a parent module</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.name}>
                        {module.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                    <Info size={12} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Choose the module that this category will be associated with. This creates a hierarchical organization.
                    </span>
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Category Name */}
              <Col md={12} className="mb-4">
                <Form.Group>
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                    Category Name <span className="text-danger">*</span>
                    <span 
                      className="text-muted" 
                      title="Enter a descriptive name for this category"
                      style={{ cursor: 'help' }}
                    >
                      <Info size={14} />
                    </span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., User Authentication, Email Integration"
                    value={formData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="py-2"
                    style={{ fontSize: '0.938rem' }}
                  />
                  <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                    <Info size={12} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Use a specific name that clearly identifies this category within the parent module.
                    </span>
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Description */}
              <Col md={12} className="mb-4">
                <Form.Group>
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                    Description <span className="text-danger">*</span>
                    <span 
                      className="text-muted" 
                      title="Explain what types of issues belong in this category"
                      style={{ cursor: 'help' }}
                    >
                      <Info size={14} />
                    </span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Describe what issues or requests belong to this category..."
                    value={formData.description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                      setFormData({ ...formData, description: e.target.value })
                    }
                    style={{ fontSize: '0.938rem', lineHeight: '1.6' }}
                  />
                  <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                    <Info size={12} />
                    <span style={{ fontSize: '0.813rem' }}>
                      Provide clear guidance on what types of tickets should be categorized here. This helps users select the right category.
                    </span>
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Preview Section */}
              {formData.module && (
                <Col md={12}>
                  <Card className="border-0 bg-light">
                    <Card.Body className="p-3">
                      <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                        <Eye size={16} />
                        Category Hierarchy Preview
                      </Form.Label>
                      <div className="d-flex align-items-center gap-2 p-3 bg-white rounded-3 border">
                        <Badge bg="primary" className="px-3 py-2">
                          <Layers size={14} className="me-2" />
                          {formData.module}
                        </Badge>
                        <ChevronRight size={16} className="text-muted" />
                        <Badge bg="secondary" className="px-3 py-2">
                          <Grid3x3 size={14} className="me-2" />
                          {formData.name || 'Category Name'}
                        </Badge>
                      </div>
                      <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
                        <Info size={12} className="me-1" />
                        This shows how your category will be organized under the parent module
                      </Form.Text>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0 bg-light">
          <div className="d-flex justify-content-between align-items-center w-100">
            <Form.Text className="text-muted d-flex align-items-center gap-1">
              <AlertCircle size={14} />
              <span style={{ fontSize: '0.813rem' }}>
                Fields marked with <span className="text-danger fw-bold">*</span> are required
              </span>
            </Form.Text>
            <div className="d-flex gap-2">
              <Button variant="light" onClick={() => setShowModal(false)}>
                <X size={16} className="me-1" />
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveCategory}
                disabled={!formData.name.trim() || !formData.description.trim() || !formData.module}
                style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
              >
                <Check size={16} className="me-1" />
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

  const SubCategoriesManagementScreen: React.FC = () => {
    const [subCategories, setSubCategories] = useState<SubCategoryType[]>([
      { id: 1, name: 'Gmail Integration', description: 'Gmail email integration', module: 'Omni Channel', category: 'Email Integration', createdAt: '15/09/2025' },
      { id: 2, name: 'Outlook Integration', description: 'Microsoft Outlook integration', module: 'Omni Channel', category: 'Email Integration', createdAt: '15/09/2025' },
      { id: 3, name: 'Twilio SMS', description: 'Twilio SMS gateway', module: 'Omni Channel', category: 'SMS Gateway', createdAt: '15/09/2025' },
      { id: 4, name: 'Nexmo SMS', description: 'Nexmo SMS service', module: 'Omni Channel', category: 'SMS Gateway', createdAt: '15/09/2025' },
      { id: 5, name: 'Customer Calls', description: 'Customer inbound calls', module: 'Call Logs', category: 'Inbound Calls', createdAt: '15/09/2025' },
      { id: 6, name: 'Support Calls', description: 'Support team inbound calls', module: 'Call Logs', category: 'Inbound Calls', createdAt: '15/09/2025' },
      { id: 7, name: 'Click-to-Call', description: 'Web click-to-call feature', module: 'CTI', category: 'Web Dialer', createdAt: '15/09/2025' },
      { id: 8, name: 'WhatsApp API', description: 'WhatsApp Business API', module: 'Omni Channel', category: 'WhatsApp Business', createdAt: '16/09/2025' },
    ]);
  
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryType | null>(null);
    const [formData, setFormData] = useState<Omit<SubCategoryType, 'id' | 'createdAt'>>({
      name: '',
      description: '',
      module: '',
      category: ''
    });
    const [searchTerm, setSearchTerm] = useState<string>('');
  
    // Parent modules with their colors
    const modules: NewModuleType[] = [
      { id: 1, name: 'Omni Channel', color: '#0d6efd' },
      { id: 2, name: 'Call Logs', color: '#198754' },
      { id: 3, name: 'TMS', color: '#dc3545' },
      { id: 4, name: 'CTI', color: '#fd7e14' },
      { id: 5, name: 'Ticket', color: '#6f42c1' },
    ];
  
    // Categories grouped by modules
    const categories: NewCategoryType[] = [
      { id: 1, name: 'Email Integration', module: 'Omni Channel' },
      { id: 2, name: 'SMS Gateway', module: 'Omni Channel' },
      { id: 3, name: 'WhatsApp Business', module: 'Omni Channel' },
      { id: 4, name: 'Inbound Calls', module: 'Call Logs' },
      { id: 5, name: 'Outbound Calls', module: 'Call Logs' },
      { id: 6, name: 'Web Dialer', module: 'CTI' },
      { id: 7, name: 'IVR System', module: 'CTI' },
    ];
  
    const handleOpenModal = (subCategory: SubCategoryType | null = null): void => {
      if (subCategory) {
        setEditingSubCategory(subCategory);
        setFormData({
          name: subCategory.name,
          description: subCategory.description,
          module: subCategory.module,
          category: subCategory.category
        });
      } else {
        setEditingSubCategory(null);
        setFormData({ name: '', description: '', module: '', category: '' });
      }
      setShowModal(true);
    };
  
    const handleSaveSubCategory = (): void => {
      if (!formData.name.trim() || !formData.description.trim() || !formData.module || !formData.category) {
        alert('All fields are required');
        return;
      }
  
      if (editingSubCategory) {
        setSubCategories(subCategories.map(sc => 
          sc.id === editingSubCategory.id ? { ...sc, ...formData } : sc
        ));
      } else {
        setSubCategories([...subCategories, {
          id: Math.max(...subCategories.map(sc => sc.id), 0) + 1,
          ...formData,
          createdAt: new Date().toLocaleDateString('en-GB')
        }]);
      }
      setShowModal(false);
    };
  
    const handleDelete = (id: number): void => {
      if (window.confirm('Are you sure you want to delete this sub-category?')) {
        setSubCategories(subCategories.filter(sc => sc.id !== id));
      }
    };
  
    const filteredSubCategories = subCategories.filter(subCategory =>
      subCategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subCategory.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subCategory.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subCategory.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    // Get module color by name
    const getModuleColor = (moduleName: string): string => {
      const module = modules.find(m => m.name === moduleName);
      return module ? module.color : '#6c757d';
    };
  
    // Get filtered categories based on selected module
    const getFilteredCategories = (): NewCategoryType[] => {
      if (!formData.module) return [];
      return categories.filter(cat => cat.module === formData.module);
    };
  
    // Group sub-categories by module and category
    const groupedSubCategories = modules.map(module => {
      const moduleCategories = categories
        .filter(cat => cat.module === module.name)
        .map(category => ({
          category: category.name,
          subCategories: filteredSubCategories.filter(
            sc => sc.module === module.name && sc.category === category.name
          )
        }))
        .filter(group => group.subCategories.length > 0);
  
      return {
        module: module.name,
        color: module.color,
        categories: moduleCategories
      };
    }).filter(group => group.categories.length > 0);
  
    return (
      <div>
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h2 className="mb-2 fw-bold d-flex align-items-center">
                <div className="rounded-3 p-2 me-3" style={{ backgroundColor: '#fd7e1415' }}>
                  <FolderTree size={24} style={{ color: '#fd7e14' }} />
                </div>
                Sub-Categories
              </h2>
              <p className="text-muted mb-0">Manage sub-categories under categories and modules</p>
            </div>
            <Button 
              variant="warning" 
              onClick={() => handleOpenModal()} 
              className="shadow-sm btn btn-primary"
              style={{ padding: '0.5rem 1.5rem' }}
            >
              <Plus size={18} className="me-2" />
              Add Sub-Category
            </Button>
          </div>
  
          {/* Stats Cards */}
          {/* <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <Card.Body className="text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-1 opacity-75 small">Total Sub-Categories</p>
                      <h3 className="mb-0 fw-bold">{subCategories.length}</h3>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-3">
                      <FolderTree size={24} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                <Card.Body className="text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-1 opacity-75 small">Parent Modules</p>
                      <h3 className="mb-0 fw-bold">{groupedSubCategories.length}</h3>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-3">
                      <Layers size={24} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row> */}
        </div>
  
        {/* Main Content */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            {/* Search Bar */}
            <div className="mb-4">
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search sub-categories..."
                  className="border-start-0 bg-light"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
  
            {/* Sub-Categories grouped by Module and Category */}
            {groupedSubCategories.map((moduleGroup, moduleIndex) => (
              <div key={moduleIndex} className="mb-5">
                {/* Module Header */}
                <div 
                  className="d-flex align-items-center mb-3 p-3 rounded-3"
                  style={{ 
                    backgroundColor: `${moduleGroup.color}15`,
                    borderLeft: `4px solid ${moduleGroup.color}`
                  }}
                >
                  <Layers size={20} style={{ color: moduleGroup.color }} className="me-2" />
                  <h5 className="mb-0 fw-bold" style={{ color: moduleGroup.color }}>
                    {moduleGroup.module}
                  </h5>
                </div>
  
                {/* Categories under Module */}
                {moduleGroup.categories.map((categoryGroup, categoryIndex) => (
                  <div key={categoryIndex} className="mb-4 ms-3">
                    {/* Category Header */}
                    <div 
                      className="d-flex align-items-center mb-3 p-2 rounded-3"
                      style={{ 
                        backgroundColor: `${moduleGroup.color}08`,
                        borderLeft: `3px solid ${moduleGroup.color}`
                      }}
                    >
                      <ChevronRight size={16} style={{ color: moduleGroup.color }} className="me-2" />
                      <Grid3x3 size={16} style={{ color: moduleGroup.color }} className="me-2" />
                      <h6 className="mb-0 fw-semibold" style={{ color: moduleGroup.color }}>
                        {categoryGroup.category}
                      </h6>
                      <Badge 
                        bg="light" 
                        text="dark" 
                        className="ms-auto"
                      >
                        {categoryGroup.subCategories.length} sub-{categoryGroup.subCategories.length === 1 ? 'category' : 'categories'}
                      </Badge>
                    </div>
  
                    {/* Sub-Category Cards */}
                    <Row className="g-3 ms-4">
                      {categoryGroup.subCategories.map((subCategory) => (
                        <Col key={subCategory.id} md={6} lg={4}>
                          <Card 
                            className="border-0 h-100"
                            style={{ 
                              borderLeft: `4px solid ${moduleGroup.color}`,
                              transition: 'all 0.3s ease',
                              backgroundColor: '#f8f9fa'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)';
                              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <Card.Body className="p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="d-flex align-items-center flex-grow-1">
                                  <div 
                                    className="rounded-3 p-2 me-2"
                                    style={{ backgroundColor: `${moduleGroup.color}20` }}
                                  >
                                    <FolderTree size={18} style={{ color: moduleGroup.color }} />
                                  </div>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-0 fw-bold">{subCategory.name}</h6>
                                  </div>
                                </div>
                                <div className="d-flex gap-1">
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="rounded-circle p-0"
                                    style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => handleOpenModal(subCategory)}
                                  >
                                    <Edit size={12} />
                                  </Button>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="rounded-circle text-danger p-0"
                                    style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => handleDelete(subCategory.id)}
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-muted small mb-2">{subCategory.description}</p>
                              <div className="d-flex flex-wrap gap-1 mb-2">
                                <Badge 
                                  style={{ backgroundColor: moduleGroup.color, fontSize: '0.65rem' }}
                                  className="px-2 py-1"
                                >
                                  {subCategory.module}
                                </Badge>
                                <Badge 
                                  bg="light"
                                  text="dark"
                                  className="px-2 py-1"
                                  style={{ fontSize: '0.65rem' }}
                                >
                                  {subCategory.category}
                                </Badge>
                              </div>
                              <small className="text-muted">Created: {subCategory.createdAt}</small>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </div>
            ))}
  
            {filteredSubCategories.length === 0 && (
              <div className="text-center py-5">
                <FolderTree size={48} className="text-muted mb-3" />
                <p className="text-muted">No sub-categories found</p>
              </div>
            )}
          </Card.Body>
        </Card>
  
        {/* Modal */}
        {/* Modal */}
<Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
  <Modal.Header closeButton className="border-0 pb-0 bg-light">
    <div className="d-flex align-items-center justify-content-between w-100 pe-3">
      <Modal.Title className="fw-bold d-flex align-items-center gap-2">
        <div className="p-2">
          <FolderTree size={20} className="text-warning" />
        </div>
        <span>{editingSubCategory ? 'Edit Sub-Category' : 'Create New Sub-Category'}</span>
      </Modal.Title>
    </div>
  </Modal.Header>

  <Modal.Body className="px-4 pb-4">
    {/* Guidelines Alert */}
    {/* {!editingSubCategory && (
      <Alert variant="info" className="mb-4 border-0 shadow-sm">
        <div className="d-flex align-items-start gap-3">
          <div className="bg-info bg-opacity-10 rounded-circle p-2" style={{ minWidth: '40px', height: '40px' }}>
            <Info size={20} className="text-info" />
          </div>
          <div>
            <h6 className="fw-bold mb-2 text-info">Sub-Category Setup Guidelines</h6>
            <ul className="mb-0 ps-3" style={{ fontSize: '0.875rem', lineHeight: '1.8' }}>
              <li>First select the <strong>parent module</strong>, then choose the <strong>category</strong></li>
              <li>Sub-categories provide the <strong>finest level of organization</strong> for tickets</li>
              <li>Use <strong>specific, descriptive names</strong> for easy identification</li>
              <li>This creates a three-level hierarchy: Module → Category → Sub-Category</li>
            </ul>
          </div>
        </div>
      </Alert>
    )} */}

    <Form>
      <Row>
        {/* Parent Module */}
        <Col md={12} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Parent Module <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Select the top-level module this sub-category belongs to"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <Form.Select
              value={formData.module}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                setFormData({ ...formData, module: e.target.value, category: '' })
              }
              className="py-2"
              style={{ fontSize: '0.938rem' }}
            >
              <option value="">Select a parent module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.name}>
                  {module.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: '0.813rem' }}>
                Start by selecting the main module. This will determine which categories are available.
              </span>
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Parent Category */}
        <Col md={12} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Parent Category <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Select the category this sub-category will be nested under"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <Form.Select
              value={formData.category}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                setFormData({ ...formData, category: e.target.value })
              }
              className="py-2"
              disabled={!formData.module}
              style={{ fontSize: '0.938rem' }}
            >
              <option value="">Select a parent category</option>
              {getFilteredCategories().map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </Form.Select>
            {!formData.module ? (
              <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                <AlertCircle size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Please select a module first to see available categories
                </span>
              </Form.Text>
            ) : (
              <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Choose the category under which this sub-category will be organized.
                </span>
              </Form.Text>
            )}
          </Form.Group>
        </Col>

        {/* Sub-Category Name */}
        <Col md={12} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Sub-Category Name <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Enter a specific name for this sub-category"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Password Reset, Two-Factor Authentication"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => 
                setFormData({ ...formData, name: e.target.value })
              }
              className="py-2"
              style={{ fontSize: '0.938rem' }}
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: '0.813rem' }}>
                Use a precise, specific name that clearly identifies this sub-category within its parent category.
              </span>
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Description */}
        <Col md={12} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Description <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Provide details about what this sub-category covers"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe the specific issues or requests that belong to this sub-category..."
              value={formData.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                setFormData({ ...formData, description: e.target.value })
              }
              style={{ fontSize: '0.938rem', lineHeight: '1.6' }}
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: '0.813rem' }}>
                Explain what specific types of issues fall under this sub-category. Be as detailed as possible for accurate ticket classification.
              </span>
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Hierarchy Preview */}
        {formData.module && formData.category && (
          <Col md={12}>
            <Card className="border-0 bg-light">
              <Card.Body className="p-3">
                <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                  <Eye size={16} />
                  Three-Level Hierarchy Preview
                </Form.Label>
                <div className="d-flex align-items-center gap-2 p-3 bg-white rounded-3 border flex-wrap">
                  <Badge bg="primary" className="px-3 py-2">
                    <Layers size={14} className="me-2" />
                    {formData.module}
                  </Badge>
                  <ChevronRight size={16} className="text-muted" />
                  <Badge bg="secondary" className="px-3 py-2">
                    <Grid3x3 size={14} className="me-2" />
                    {formData.category}
                  </Badge>
                  <ChevronRight size={16} className="text-muted" />
                  <Badge bg="warning" className="px-3 py-2">
                    <FolderTree size={14} className="me-2" />
                    {formData.name || 'Sub-Category Name'}
                  </Badge>
                </div>
                <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
                  <Info size={12} className="me-1" />
                  This shows the complete hierarchy: Module → Category → Sub-Category
                </Form.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Form>
  </Modal.Body>

  <Modal.Footer className="border-0 pt-0 bg-light">
    <div className="d-flex justify-content-between align-items-center w-100">
      <Form.Text className="text-muted d-flex align-items-center gap-1">
        <AlertCircle size={14} />
        <span style={{ fontSize: '0.813rem' }}>
          Fields marked with <span className="text-danger fw-bold">*</span> are required
        </span>
      </Form.Text>
      <div className="d-flex gap-2">
        <Button variant="light" onClick={() => setShowModal(false)}>
          <X size={16} className="me-1" />
          Cancel
        </Button>
        <Button 
          variant="warning" 
          className="btn btn-primary"
          onClick={handleSaveSubCategory}
          disabled={!formData.name.trim() || !formData.description.trim() || !formData.module || !formData.category}
        >
          <Check size={16} className="me-1" />
          {editingSubCategory ? 'Update Sub-Category' : 'Create Sub-Category'}
        </Button>
      </div>
    </div>
  </Modal.Footer>
</Modal>
      </div>
    );
  };

// Type Management Screen Component
const TypeManagementScreen: React.FC = () => {
    const [types, setTypes] = useState<TicketTypeData[]>([
      { id: 1, name: 'Incident', description: 'An unplanned interruption or reduction in quality of service', color: '#dc3545', createdAt: '15/09/2025' },
      { id: 2, name: 'Problem', description: 'The unknown cause of one or more incidents', color: '#fd7e14', createdAt: '15/09/2025' },
      { id: 3, name: 'Service Request', description: 'A request from a user for information, advice, or access', color: '#0dcaf0', createdAt: '15/09/2025' },
      { id: 4, name: 'Change Request', description: 'A request to modify or update existing services', color: '#6f42c1', createdAt: '15/09/2025' },
      { id: 5, name: 'Test Type', description: 'Testing and QA related tickets', color: '#20c997', createdAt: '22/10/2025' }
    ]);
  
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingType, setEditingType] = useState<TicketTypeData | null>(null);
    const [formData, setFormData] = useState<Omit<TicketTypeData, 'id' | 'createdAt'>>({
      name: '',
      description: '',
      color: '#0d6efd'
    });
    const [searchTerm, setSearchTerm] = useState<string>('');
  
    const handleOpenModal = (type: TicketTypeData | null = null): void => {
      if (type) {
        setEditingType(type);
        setFormData({
          name: type.name,
          description: type.description,
          color: type.color
        });
      } else {
        setEditingType(null);
        setFormData({ name: '', description: '', color: '#0d6efd' });
      }
      setShowModal(true);
    };
  
    const handleSaveType = (): void => {
      if (!formData.name.trim() || !formData.description.trim()) {
        alert('Type name and description are required');
        return;
      }
  
      if (editingType) {
        setTypes(types.map(t => 
          t.id === editingType.id ? { ...t, ...formData } : t
        ));
      } else {
        setTypes([...types, {
          id: Math.max(...types.map(t => t.id), 0) + 1,
          ...formData,
          createdAt: new Date().toLocaleDateString('en-GB')
        }]);
      }
      setShowModal(false);
    };
  
    const handleDelete = (id: number): void => {
      if (window.confirm('Are you sure you want to delete this ticket type?')) {
        setTypes(types.filter(t => t.id !== id));
      }
    };
  
    const filteredTypes = types.filter(type =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    return (
      <div>
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h2 className="mb-2 fw-bold d-flex align-items-center">
                <div className="rounded-3 p-2 me-3" style={{ backgroundColor: '#0dcaf015' }}>
                  <Tag size={24} className="text-info" style={{ color: '#0dcaf0' }} />
                </div>
                Ticket Types
              </h2>
              <p className="text-muted mb-0">Manage ticket types and their properties</p>
            </div>
            <Button 
              variant="info" 
              onClick={() => handleOpenModal()} 
              className="shadow-sm"
              style={{ padding: '0.5rem 1.5rem' }}
            >
              <Plus size={18} className="me-2" />
              Add Type
            </Button>
          </div>
  
          {/* Stats Cards */}
          {/* <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <Card.Body className="text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-1 opacity-75 small">Total Types</p>
                      <h3 className="mb-0 fw-bold">{types.length}</h3>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-3">
                      <Tag size={24} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <Card.Body className="text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-1 opacity-75 small">Active</p>
                      <h3 className="mb-0 fw-bold">{types.length}</h3>
                    </div>
                    <div className="bg-white bg-opacity-25 rounded-3 p-3">
                      <CheckCircle size={24} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row> */}
        </div>
  
        {/* Main Content */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            {/* Search Bar */}
            <div className="mb-4">
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search ticket types..."
                  className="border-start-0 bg-light"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
  
            {/* Type Cards */}
            <Row className="g-4">
              {filteredTypes.map((type) => (
                <Col key={type.id} md={6} lg={6}>
                  <Card 
                    className="border-0 h-100"
                    style={{ 
                      borderLeft: `4px solid ${type.color}`,
                      transition: 'all 0.3s ease',
                      backgroundColor: '#f8f9fa'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center flex-grow-1">
                          <div 
                            className="rounded-3 p-2 me-3"
                            style={{ backgroundColor: `${type.color}20` }}
                          >
                            <Tag size={24} style={{ color: type.color }} />
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-1 fw-bold">{type.name}</h5>
                            <Badge 
                              style={{ backgroundColor: type.color }}
                              className="px-2 py-1"
                            >
                              {type.name}
                            </Badge>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <Button
                            variant="light"
                            size="sm"
                            className="rounded-circle"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleOpenModal(type)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            className="rounded-circle text-danger"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleDelete(type.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted mb-3">{type.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Created: {type.createdAt}</small>
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded"
                            style={{ 
                              width: '16px', 
                              height: '16px', 
                              backgroundColor: type.color,
                              border: '1px solid #dee2e6'
                            }}
                          />
                          <code className="small">{type.color}</code>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
  
            {filteredTypes.length === 0 && (
              <div className="text-center py-5">
                <Tag size={48} className="text-muted mb-3" />
                <p className="text-muted">No ticket types found</p>
              </div>
            )}
          </Card.Body>
        </Card>
  
        {/* Modal */}
       {/* Modal */}
<Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
  <Modal.Header closeButton className="border-0 pb-0 bg-light">
    <div className="d-flex align-items-center justify-content-between w-100 pe-3">
      <Modal.Title className="fw-bold d-flex align-items-center gap-2">
        <div className="p-2">
          <Tag size={20} className="text-info" />
        </div>
        <span>{editingType ? 'Edit Ticket Type' : 'Create New Ticket Type'}</span>
      </Modal.Title>
    </div>
  </Modal.Header>

  <Modal.Body className="px-4 pb-4">
    {/* Guidelines Alert */}
    {/* {!editingType && (
      <Alert variant="info" className="mb-4 border-0 shadow-sm">
        <div className="d-flex align-items-start gap-3">
          <div className="bg-info bg-opacity-10 rounded-circle p-2" style={{ minWidth: '40px', height: '40px' }}>
            <Info size={20} className="text-info" />
          </div>
          <div>
            <h6 className="fw-bold mb-2 text-info">Ticket Type Setup Guidelines</h6>
            <ul className="mb-0 ps-3" style={{ fontSize: '0.875rem', lineHeight: '1.8' }}>
              <li>Use <strong>ITIL-standard names</strong> like Incident, Problem, Service Request, Change Request</li>
              <li>Provide a <strong>clear definition</strong> to help users select the correct type</li>
              <li>Choose colors that <strong>differentiate types</strong> at a glance</li>
              <li>Consider <strong>SLA requirements</strong> for each type when creating them</li>
            </ul>
          </div>
        </div>
      </Alert>
    )} */}

    <Form>
      <Row>
        {/* Type Name */}
        <Col md={12} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Type Name <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Enter a name that categorizes the type of request"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Incident, Problem, Service Request, Change Request"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => 
                setFormData({ ...formData, name: e.target.value })
              }
              className="py-2"
              style={{ fontSize: '0.938rem' }}
            />
            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
              <Info size={12} />
              <span style={{ fontSize: '0.813rem' }}>
                Use standardized ITIL terminology or create custom types that match your organization's needs.
              </span>
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Description */}
        <Col md={12} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Description <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Explain what this ticket type is used for"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe when users should select this ticket type and what it covers..."
              value={formData.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                setFormData({ ...formData, description: e.target.value })
              }
              style={{ fontSize: '0.938rem', lineHeight: '1.6' }}
            />
            <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
              <Info size={12} className="me-1" />
              Provide a clear definition to help users understand when to use this type. Include examples if helpful.
            </Form.Text>
            
            {/* Common Type Examples */}
            {/* <Card className="border-0 bg-white mt-3">
              <Card.Body className="p-3">
                <small className="text-muted fw-semibold d-block mb-2">Common Type Definitions:</small>
                <div className="d-flex flex-column gap-2" style={{ fontSize: '0.813rem' }}>
                  <div>
                    <strong>Incident:</strong> <span className="text-muted">Unplanned interruption or reduction in quality of an IT service</span>
                  </div>
                  <div>
                    <strong>Problem:</strong> <span className="text-muted">Root cause of one or more incidents requiring investigation</span>
                  </div>
                  <div>
                    <strong>Service Request:</strong> <span className="text-muted">Request from a user for information, advice, or access</span>
                  </div>
                  <div>
                    <strong>Change Request:</strong> <span className="text-muted">Request to add, modify, or remove service components</span>
                  </div>
                </div>
              </Card.Body>
            </Card> */}
          </Form.Group>
        </Col>

        {/* Type Color */}
        <Col md={12} className="mb-4">
          <Form.Group>
            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
              Type Color <span className="text-danger">*</span>
              <span 
                className="text-muted" 
                title="Select a distinctive color for this ticket type"
                style={{ cursor: 'help' }}
              >
                <Info size={14} />
              </span>
            </Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="color"
                value={formData.color}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, color: e.target.value })
                }
                style={{ width: '60px', height: '45px', cursor: 'pointer' }}
                title="Click to choose a color"
              />
              <Form.Control
                type="text"
                value={formData.color}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="#000000"
                className="py-2"
                style={{ fontSize: '0.938rem' }}
              />
            </div>
            <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
              <Info size={12} className="me-1" />
              Choose a unique color that helps users quickly identify ticket types in lists and dashboards.
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Preview Section */}
        <Col md={12}>
          <Card className="border-0 bg-light">
            <Card.Body className="p-3">
              <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <Eye size={16} />
                Ticket Type Preview
              </Form.Label>
              <div className="p-3 bg-white rounded-3 border">
                <div className="d-flex flex-column gap-3">
                  {/* Badge Style */}
                  <div>
                    <small className="text-muted d-block mb-2">Badge Style:</small>
                    <Badge 
                      style={{ backgroundColor: formData.color }}
                      className="px-3 py-2"
                    >
                      <Tag size={14} className="me-2" />
                      {formData.name || 'Type Name'}
                    </Badge>
                  </div>
                  
                  {/* Card Style */}
                  <div>
                    <small className="text-muted d-block mb-2">In Ticket Card:</small>
                    <div 
                      className="p-3 rounded-3"
                      style={{ 
                        borderLeft: `4px solid ${formData.color}`,
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div 
                          className="rounded-3 p-2"
                          style={{ backgroundColor: `${formData.color}20` }}
                        >
                          <Tag size={20} style={{ color: formData.color }} />
                        </div>
                        <div>
                          <div className="fw-bold">{formData.name || 'Type Name'}</div>
                          <small className="text-muted">
                            {formData.description ? 
                              formData.description.substring(0, 60) + (formData.description.length > 60 ? '...' : '') : 
                              'Type description will appear here'}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
                <Info size={12} className="me-1" />
                This shows how your ticket type will be displayed throughout the system
              </Form.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Form>
  </Modal.Body>

  <Modal.Footer className="border-0 pt-0 bg-light">
    <div className="d-flex justify-content-between align-items-center w-100">
      <Form.Text className="text-muted d-flex align-items-center gap-1">
        <AlertCircle size={14} />
        <span style={{ fontSize: '0.813rem' }}>
          Fields marked with <span className="text-danger fw-bold">*</span> are required
        </span>
      </Form.Text>
      <div className="d-flex gap-2">
        <Button variant="light" onClick={() => setShowModal(false)}>
          <X size={16} className="me-1" />
          Cancel
        </Button>
        <Button 
          variant="info" 
          onClick={handleSaveType}
          disabled={!formData.name.trim() || !formData.description.trim() || !formData.color}
        >
          <Check size={16} className="me-1" />
		  
          {editingType ? 'Update Type' : 'Create Type'}
        </Button>
      </div>
    </div>
  </Modal.Footer>
</Modal>
      </div>
    );
  };

export default TicketDashboard;
