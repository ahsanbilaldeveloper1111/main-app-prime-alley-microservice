/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-enable @typescript-eslint/ban-ts-comment */
import React, { useState } from 'react';
import { Row, Col, Card, Button, Badge, Table, Form, InputGroup } from 'react-bootstrap';
import Select from 'react-select';
import Layout from "@layout/index";
import { 
  Target,
  Handshake,
  ShoppingBag,
  Activity,
  BarChart3,
  Eye,
  Filter,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  SlidersHorizontal,
  RefreshCw,
  Users,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

const CrmReports = () => {
  // Reports Page States
  const [selectedReportModule, setSelectedReportModule] = useState('leads');
  const [selectedDateRange, setSelectedDateRange] = useState('last-30-days');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedReportStages, setSelectedReportStages] = useState<string[]>([]);
  const [selectedReportUsers, setSelectedReportUsers] = useState<string[]>([]);
  const [selectedReportStatus, setSelectedReportStatus] = useState<string[]>([]);
  const [selectedReportPriority, setSelectedReportPriority] = useState<string[]>([]);
  const [selectedReportCategories, setSelectedReportCategories] = useState<string[]>([]);
  const [reportGroupBy, setReportGroupBy] = useState('date');
  const [reportChartType, setReportChartType] = useState('line');

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
    })
  };
  // Report modules configuration
  const reportModules = [
    { id: 'leads', label: 'Leads Reports', icon: <Target size={18} />, color: '#0d6efd' },
    { id: 'deals', label: 'Deals Reports', icon: <Handshake size={18} />, color: '#198754' },
    { id: 'orders', label: 'Orders Reports', icon: <ShoppingBag size={18} />, color: '#ffc107' },
    { id: 'activities', label: 'Activity Reports', icon: <Activity size={18} />, color: '#dc3545' },
    { id: 'prospects', label: 'Prospects Reports', icon: <Users size={18} />, color: '#6f42c1' },
    // { id: 'campaigns', label: 'Campaign Reports', icon: <Megaphone size={18} />, color: '#fd7e14' },
    // { id: 'products', label: 'Products Reports', icon: <Package size={18} />, color: '#20c997' },
    // { id: 'overall', label: 'Overall Performance', icon: <BarChart3 size={18} />, color: '#0dcaf0' }
  ];

  // Dynamic filter options based on selected module
  const getFilterOptions = () => {
    switch (selectedReportModule) {
      case 'leads':
        return {
          stages: ['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'],
          users: ['Sarah Williams', 'John Doe', 'Jane Smith', 'Mike Johnson', 'Tom Brown'],
          status: ['Active', 'Inactive', 'Converted'],
          priority: ['Hot', 'Warm', 'Cold'],
          metrics: ['Total Leads', 'Conversion Rate', 'Lead Score', 'Response Time', 'Follow-ups']
        };
      case 'deals':
        return {
          stages: ['Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
          users: ['Sarah Williams', 'John Doe', 'Jane Smith', 'Mike Johnson'],
          status: ['Active', 'Closed', 'On Hold'],
          priority: ['High', 'Medium', 'Low'],
          metrics: ['Total Deals', 'Deal Value', 'Win Rate', 'Avg Deal Size', 'Sales Cycle']
        };
      case 'orders':
        return {
          stages: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
          users: ['Sarah Williams', 'John Doe', 'Jane Smith'],
          status: ['Pending', 'Completed', 'Cancelled'],
          priority: ['Urgent', 'Normal', 'Low'],
          metrics: ['Total Orders', 'Revenue', 'Avg Order Value', 'Fulfillment Time']
        };
      case 'activities':
        return {
          categories: ['Call', 'Email', 'Meeting', 'Task', 'Follow-up', 'Note'],
          users: ['Sarah Williams', 'John Doe', 'Jane Smith', 'Mike Johnson', 'Tom Brown'],
          status: ['Completed', 'Pending', 'Overdue'],
          priority: ['High', 'Medium', 'Low'],
          metrics: ['Total Activities', 'Completion Rate', 'Avg Response Time', 'Activities per Lead']
        };
      case 'prospects':
        return {
          stages: ['New', 'Contacted', 'Qualified', 'Unqualified'],
          users: ['Sarah Williams', 'John Doe', 'Jane Smith', 'Mike Johnson', 'Tom Brown'],
          status: ['Active', 'Inactive'],
          priority: ['Hot', 'Warm', 'Cold'],
          metrics: ['Total Prospects', 'Qualification Rate', 'Contact Rate', 'Lead Conversion']
        };
      case 'campaigns':
        return {
          stages: ['Planning', 'Active', 'Paused', 'Completed'],
          users: ['Sarah Williams', 'John Doe', 'Jane Smith'],
          status: ['Active', 'Inactive', 'Completed'],
          priority: ['High', 'Medium', 'Low'],
          metrics: ['Total Campaigns', 'ROI', 'Lead Generation', 'Conversion Rate', 'Cost per Lead']
        };
      // case 'products':
      //   return {
      //     categories: ['Electronics', 'Clothing', 'Footwear', 'Accessories', 'Home & Garden', 'Sports'],
      //     users: ['All Users'],
      //     status: ['Active', 'Inactive'],
      //     priority: ['Featured', 'Regular'],
      //     metrics: ['Total Products', 'Sales Volume', 'Revenue', 'Top Sellers', 'Inventory']
      //   };
      // case 'overall':
      //   return {
      //     stages: ['All Stages'],
      //     users: ['All Users', 'Sarah Williams', 'John Doe', 'Jane Smith', 'Mike Johnson', 'Tom Brown'],
      //     status: ['All Status'],
      //     priority: ['All Priorities'],
      //     metrics: ['Revenue', 'Conversions', 'Pipeline Value', 'Win Rate', 'Growth Rate']
      //   };
      default:
        return {
          stages: [],
          users: [],
          status: [],
          priority: [],
          metrics: []
        };
    }
  };

  const filterOptions = getFilterOptions();

  // Sample report data (would be dynamically generated based on filters)
  const getReportData = () => {
    // This would fetch real data based on selected filters
    return {
      summary: {
        totalRecords: 156,
        //growthRate: 23.5,
        avgValue: 14800,
        completionRate: 67.8
      },
      chartData: [
        { date: '2025-11-01', value: 12, label: 'Nov 1' },
        { date: '2025-11-08', value: 18, label: 'Nov 8' },
        { date: '2025-11-15', value: 15, label: 'Nov 15' },
        { date: '2025-11-22', value: 24, label: 'Nov 22' },
        { date: '2025-11-29', value: 28, label: 'Nov 29' },
        { date: '2025-12-03', value: 32, label: 'Dec 3' }
      ],
      tableData: [
        { id: 1, name: 'John Doe', stage: 'Qualified', value: 25000, date: '2025-11-15', status: 'Active' },
        { id: 2, name: 'Jane Smith', stage: 'Negotiation', value: 18000, date: '2025-11-18', status: 'Active' },
        { id: 3, name: 'Bob Wilson', stage: 'New', value: 12000, date: '2025-11-20', status: 'Active' },
        { id: 4, name: 'Alice Brown', stage: 'Won', value: 32000, date: '2025-11-25', status: 'Closed' },
        { id: 5, name: 'Charlie Davis', stage: 'Contacted', value: 15000, date: '2025-11-28', status: 'Active' }
      ]
    };
  };

  const reportData = getReportData();

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="mb-2 fw-bold">Advanced CRM Reports</h2>
        <p className="text-muted mb-0">Generate comprehensive reports with dynamic filters and real-time insights</p>
      </div>

      {/* Report Module Selection */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <BarChart3 size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Select Report Module</h5>
          </div>
          <Row className="g-3">
            {reportModules.map((module) => (
              // <Col lg={3} md={4} sm={6} key={module.id}>
              <Col lg={2} md={4} sm={6} xs={12} className="custom-col" key={module.id}>
                
                <div
                  onClick={() => {
                    setSelectedReportModule(module.id);
                    setSelectedReportStages([]);
                    setSelectedReportUsers([]);
                    setSelectedReportStatus([]);
                    setSelectedReportPriority([]);
                    setSelectedReportCategories([]);
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: selectedReportModule === module.id ? `2px solid ${module.color}` : '2px solid #e5e7eb',
                    background: selectedReportModule === module.id ? `${module.color}15` : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedReportModule !== module.id) {
                      e.currentTarget.style.borderColor = module.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedReportModule !== module.id) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: module.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {module.icon}
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: '14px',
                        color: selectedReportModule === module.id ? module.color : '#1f2937'
                      }}>
                        {module.label}
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Filters Section */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <SlidersHorizontal size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Report Filters</h5>
          </div>

          {/* Date Range Filter */}
          <Row className="g-3 mb-3">
            <Col md={12}>
              <Form.Label className="fw-semibold small text-muted">DATE RANGE</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'last-7-days', label: 'Last 7 Days' },
                  { id: 'last-30-days', label: 'Last 30 Days' },
                  { id: 'this-month', label: 'This Month' },
                  { id: 'last-month', label: 'Last Month' },
                  { id: 'this-quarter', label: 'This Quarter' },
                  { id: 'this-year', label: 'This Year' },
                  { id: 'custom', label: 'Custom Range' }
                ].map((range) => (
                  <Button
                    key={range.id}
                    size="sm"
                    variant={selectedDateRange === range.id ? 'primary' : 'outline-secondary'}
                    onClick={() => setSelectedDateRange(range.id)}
                    className="d-flex align-items-center gap-1"
                  >
                    <Calendar size={14} />
                    {range.label}
                  </Button>
                ))}
              </div>
            </Col>
            
            {selectedDateRange === 'custom' && (
              <>
                <Col md={6}>
                  <Form.Label className="fw-semibold small">From Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-semibold small">To Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                  />
                </Col>
              </>
            )}
          </Row>

          {/* Dynamic Filters Based on Module */}
          <Row className="g-3">
            {filterOptions.stages && filterOptions.stages.length > 0 && (
              <Col md={3}>
                <Form.Label className="fw-semibold small text-muted">STAGES</Form.Label>
                <Select
                  isMulti
                  options={filterOptions.stages.map(s => ({ value: s, label: s }))}
                  value={selectedReportStages.map(s => ({ value: s, label: s }))}
                  onChange={(selected) => setSelectedReportStages(selected.map((s: any) => s.value))}
                  placeholder="All Stages"
                  styles={customSelectStyles}
                />
              </Col>
            )}

            {filterOptions.users && filterOptions.users.length > 0 && (
              <Col md={3}>
                <Form.Label className="fw-semibold small text-muted">ASSIGNED TO</Form.Label>
                <Select
                  isMulti
                  options={filterOptions.users.map(u => ({ value: u, label: u }))}
                  value={selectedReportUsers.map(u => ({ value: u, label: u }))}
                  onChange={(selected) => setSelectedReportUsers(selected.map((u: any) => u.value))}
                  placeholder="All Users"
                  styles={customSelectStyles}
                />
              </Col>
            )}

            {filterOptions.status && filterOptions.status.length > 0 && (
              <Col md={3}>
                <Form.Label className="fw-semibold small text-muted">STATUS</Form.Label>
                <Select
                  isMulti
                  options={filterOptions.status.map(s => ({ value: s, label: s }))}
                  value={selectedReportStatus.map(s => ({ value: s, label: s }))}
                  onChange={(selected) => setSelectedReportStatus(selected.map((s: any) => s.value))}
                  placeholder="All Status"
                  styles={customSelectStyles}
                />
              </Col>
            )}

            {filterOptions.priority && filterOptions.priority.length > 0 && (
              <Col md={3}>
                <Form.Label className="fw-semibold small text-muted">PRIORITY</Form.Label>
                <Select
                  isMulti
                  options={filterOptions.priority.map(p => ({ value: p, label: p }))}
                  value={selectedReportPriority.map(p => ({ value: p, label: p }))}
                  onChange={(selected) => setSelectedReportPriority(selected.map((p: any) => p.value))}
                  placeholder="All Priorities"
                  styles={customSelectStyles}
                />
              </Col>
            )}

            {filterOptions.categories && filterOptions.categories.length > 0 && (
              <Col md={3}>
                <Form.Label className="fw-semibold small text-muted">CATEGORIES</Form.Label>
                <Select
                  isMulti
                  options={filterOptions.categories.map(c => ({ value: c, label: c }))}
                  value={selectedReportCategories.map(c => ({ value: c, label: c }))}
                  onChange={(selected) => setSelectedReportCategories(selected.map((c: any) => c.value))}
                  placeholder="All Categories"
                  styles={customSelectStyles}
                />
              </Col>
            )}
          </Row>

          <div className="d-flex gap-2 mt-3">
            <Button variant="primary" className="d-flex align-items-center gap-2">
              <Filter size={16} />
              Generate Report
            </Button>
            <Button variant="outline-secondary" className="d-flex align-items-center gap-2">
              <RefreshCw size={16} />
              Reset Filters
            </Button>
            <Button variant="outline-success" className="d-flex align-items-center gap-2 ms-auto">
              <Download size={16} />
              Export to Excel
            </Button>
            {/* <Button variant="outline-info" className="d-flex align-items-center gap-2">
              <Download size={16} />
              Export to PDF
            </Button> */}
          </div>
        </Card.Body>
      </Card>

      {/* Summary Cards */}
     

{/* Detailed Data Table */}
<Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="p-4 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Detailed Report Data</h5>
              <div className="d-flex gap-2">
                <InputGroup size="sm" style={{ width: '250px' }}>
                  <InputGroup.Text>
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control placeholder="Search in results..." />
                </InputGroup>
                {/* <Button size="sm" variant="outline-secondary">
                  <Filter size={16} />
                </Button> */}
              </div>
            </div>
          </div>
          
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>
                    <Form.Check type="checkbox" />
                  </th>
                  <th>Name</th>
                  <th>Stage</th>
                  <th>Value</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportData.tableData.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Form.Check type="checkbox" />
                    </td>
                    <td className="fw-semibold">{row.name}</td>
                    <td>
                      <Badge bg="primary" className="bg-opacity-10 text-dark">
                        {row.stage}
                      </Badge>
                    </td>
                    <td className="fw-semibold text-success">${row.value.toLocaleString()}</td>
                    <td className="text-muted">{row.date}</td>
                    <td>
                      <Badge bg={row.status === 'Active' ? 'success' : 'secondary'}>
                        {row.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="link" size="sm" className="p-1" title="View">
                          <Eye size={16} />
                        </Button>
                        {/* <Button variant="link" size="sm" className="p-1" title="Details">
                          <Info size={16} />
                        </Button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="p-3 border-top">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                Showing {reportData.tableData.length} of {reportData.summary.totalRecords} records
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" variant="outline-secondary">
                  <ChevronLeft size={16} />
                </Button>
                <Button size="sm" variant="primary">1</Button>
                <Button size="sm" variant="outline-secondary">2</Button>
                <Button size="sm" variant="outline-secondary">3</Button>
                <Button size="sm" variant="outline-secondary">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
      {/* Chart and Visualization Options */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 fw-bold">Data Visualization</h5>
            <div className="d-flex gap-2">
              <Form.Select 
                size="sm" 
                style={{ width: 'auto' }}
                value={reportGroupBy}
                onChange={(e) => setReportGroupBy(e.target.value)}
              >
                <option value="date">Group by Date</option>
                <option value="user">Group by User</option>
                <option value="stage">Group by Stage</option>
                <option value="status">Group by Status</option>
              </Form.Select>
              <Form.Select 
                size="sm" 
                style={{ width: 'auto' }}
                value={reportChartType}
                onChange={(e) => setReportChartType(e.target.value)}
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
              </Form.Select>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={reportData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="label" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0d6efd" 
                strokeWidth={3}
                dot={{ fill: '#0d6efd', r: 5 }}
                activeDot={{ r: 7 }}
                name={`${reportModules.find(m => m.id === selectedReportModule)?.label || 'Records'}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      

      {/* Insights and Recommendations */}
      <Row className="mt-4">
        <Col lg={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Zap size={20} className="text-warning" />
                <h5 className="mb-0 fw-bold">Key Insights</h5>
              </div>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex gap-3">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#0d6efd',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div>
                    <p className="mb-1 fw-semibold">Peak Performance Period</p>
                    <p className="text-muted small mb-0">Highest activity recorded between Nov 22 - Dec 3 with 28% increase</p>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#198754',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div>
                    <p className="mb-1 fw-semibold">Top Performer</p>
                    <p className="text-muted small mb-0">Sarah Williams leads with 34% of total conversions this period</p>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ffc107',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div>
                    <p className="mb-1 fw-semibold">Conversion Trend</p>
                    <p className="text-muted small mb-0">Average deal size increased by 12.3% compared to previous period</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Target size={20} className="text-danger" />
                <h5 className="mb-0 fw-bold">Recommendations</h5>
              </div>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex gap-3">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#dc3545',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div>
                    <p className="mb-1 fw-semibold">Focus on High-Value Leads</p>
                    <p className="text-muted small mb-0">15 leads with potential value over $20K require immediate attention</p>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#0dcaf0',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div>
                    <p className="mb-1 fw-semibold">Follow-up Optimization</p>
                    <p className="text-muted small mb-0">Average response time can be reduced by 30% with automated workflows</p>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#6f42c1',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div>
                    <p className="mb-1 fw-semibold">Team Training</p>
                    <p className="text-muted small mb-0">Consider sharing best practices from top performers with the team</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};



CrmReports.getLayout = function getLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};

export default CrmReports;