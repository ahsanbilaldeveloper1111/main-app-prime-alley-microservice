import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import  { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Dropdown } from 'react-bootstrap';
import { TrendingUp, Shield, RefreshCw, XCircle, X, Clock, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';


const CDRRecords = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [callingNumberFilter, setCallingNumberFilter] = useState('');
  const [calledNumberFilter, setCalledNumberFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [repetitionStatusFilter, setRepetitionStatusFilter] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    callingNumber: '',
    calledNumber: '',
    userId: '',
    repetitionStatus: 'all'
  });

  // Sample data for charts
  const trendData = [
    { value: 950 }, { value: 1100 }, { value: 980 }, { value: 1250 }, 
    { value: 1050 }, { value: 1300 }, { value: 1150 }, { value: 1400 }, 
    { value: 1200 }, { value: 1500 }, { value: 1349 }
  ];

  const dncApiTrendData = [
    { value: 5 }, { value: 8 }, { value: 6 }, { value: 11 }, 
    { value: 7 }, { value: 12 }, { value: 9 }, { value: 10 }, 
    { value: 8 }, { value: 13 }, { value: 10 }
  ];

  const avgTimeTrendData = [
    { value: 850 }, { value: 920 }, { value: 880 }, { value: 1050 }, 
    { value: 900 }, { value: 980 }, { value: 860 }, { value: 1020 }, 
    { value: 890 }, { value: 950 }, { value: 926 }
  ];

  const repetitionData = [
    { name: 'Not Allowed', value: 7, color: '#a855f7' },
    { name: 'Allowed', value: 30, color: '#10b981' },
    { name: 'Other', value: 63, color: '#3b82f6' }
  ];

  const allowLocalDNCLData = [
    { name: 'FALSE', value: 10, color: '#ec4899' },
    { name: 'TRUE', value: 9, color: '#10b981' },
    { name: 'Other', value: 81, color: '#8b5cf6' }
  ];

  // Sample table data - expanded for better testing
  const allTableData = [
    { id: '178223', dateTime: '2025-12-31 11:38', calling: '+553780789', called: '0503770057', userId: 'tawasols7', localDND: 'Not Checked', repetition: 'Allowed', dncrApi: 'FALSE', time: '695.25', allowLocalDNCL: 'FALSE', allowRepetition: 'TRUE' },
    { id: '178224', dateTime: '2025-12-31 11:38', calling: '+557706000', called: '0507500600', userId: 'tawasols7', localDND: 'Not Checked', repetition: 'Allowed', dncrApi: 'FALSE', time: '571.75', allowLocalDNCL: 'FALSE', allowRepetition: 'TRUE' },
    { id: '178228', dateTime: '2025-12-31 11:37', calling: '+5527205635', called: '0509415315', userId: 'tawasols7', localDND: 'Not Checked', repetition: 'Not Allowed', dncrApi: 'FALSE', time: '1689.38', allowLocalDNCL: 'FALSE', allowRepetition: 'FALSE' },
    { id: '178225', dateTime: '2025-12-31 11:37', calling: '+5537607890', called: '0508317125', userId: 'tawasols7', localDND: 'Not Checked', repetition: 'Allowed', dncrApi: 'FALSE', time: '749.57', allowLocalDNCL: 'FALSE', allowRepetition: 'TRUE' },
    { id: '178229', dateTime: '2025-12-31 11:37', calling: '+5567200600', called: '0509415315', userId: 'tawasols8', localDND: 'Not Checked', repetition: 'Allowed', dncrApi: 'FALSE', time: '511.15', allowLocalDNCL: 'FALSE', allowRepetition: 'TRUE' },
    { id: '178226', dateTime: '2025-12-31 11:37', calling: '+5577205635', called: '0508317125', userId: 'tawasols9', localDND: 'Not Checked', repetition: 'Not Allowed', dncrApi: 'FALSE', time: '766.48', allowLocalDNCL: 'FALSE', allowRepetition: 'FALSE' },
    { id: '178230', dateTime: '2025-12-31 11:37', calling: '+5527206600', called: '0509415315', userId: 'tawasols10', localDND: 'Not Checked', repetition: 'Allowed', dncrApi: 'TRUE', time: '779.92', allowLocalDNCL: 'FALSE', allowRepetition: 'TRUE' },
    { id: '178227', dateTime: '2025-12-31 11:37', calling: '+6565387999', called: '0508317125', userId: 'teralink40', localDND: 'Not Checked', repetition: 'Allowed', dncrApi: 'FALSE', time: '779.92', allowLocalDNCL: 'FALSE', allowRepetition: 'TRUE' },
    { id: '178231', dateTime: '2025-12-31 11:36', calling: '+553780123', called: '0503770058', userId: 'teralink41', localDND: 'Not Checked', repetition: 'Not Allowed', dncrApi: 'FALSE', time: '850.50', allowLocalDNCL: 'FALSE', allowRepetition: 'FALSE' },
    { id: '178232', dateTime: '2025-12-31 11:36', calling: '+557706111', called: '0507500601', userId: 'teralink42', localDND: 'Not Checked', repetition: 'Allowed', dncrApi: 'TRUE', time: '620.30', allowLocalDNCL: 'TRUE', allowRepetition: 'TRUE' },
  ];

  // Filter data based on applied filters
  const getFilteredData = () => {
    return allTableData.filter(row => {
      // Global search filter
      if (appliedFilters.search) {
        const searchLower = appliedFilters.search.toLowerCase();
        const matchesSearch = Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Calling number filter
      if (appliedFilters.callingNumber && !row.calling.includes(appliedFilters.callingNumber)) {
        return false;
      }

      // Called number filter
      if (appliedFilters.calledNumber && !row.called.includes(appliedFilters.calledNumber)) {
        return false;
      }

      // User ID filter
      if (appliedFilters.userId && !row.userId.toLowerCase().includes(appliedFilters.userId.toLowerCase())) {
        return false;
      }

      // Repetition status filter
      if (appliedFilters.repetitionStatus !== 'all' && row.repetition !== appliedFilters.repetitionStatus) {
        return false;
      }

      return true;
    });
  };

  const filteredData = getFilteredData();
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  
  // Get current page data
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);

  // Apply filters handler
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery,
      callingNumber: callingNumberFilter,
      calledNumber: calledNumberFilter,
      userId: userIdFilter,
      repetitionStatus: repetitionStatusFilter
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCallingNumberFilter('');
    setCalledNumberFilter('');
    setUserIdFilter('');
    setRepetitionStatusFilter('all');
    setAppliedFilters({
      search: '',
      callingNumber: '',
      calledNumber: '',
      userId: '',
      repetitionStatus: 'all'
    });
    setCurrentPage(1);
  };

  // Pagination handlers
  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleRecordsPerPageChange = (value: number) => {
    setRecordsPerPage(value);
    setCurrentPage(1);
  };

  const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; subtitle?: string; chart?: React.ReactNode; bgClass?: string }> = ({ icon, title, value, subtitle, chart, bgClass = '' }) => (
    <Card className={`border stat-card-responsive ${bgClass}`} style={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#dee2e6' }}>
        
      <Card.Body className="p-3 d-flex flex-column">
        <div className="d-flex align-items-center mb-2">
          <div style={{ color: '#10b981' }} className="me-2">{icon}</div>
          <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>{title}</div>
        </div>
        <div className="mb-2">
          <div style={{ fontSize: '2rem', fontWeight: '600', color: '#212529' }}>{value}</div>
          {subtitle && <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>{subtitle}</div>}
        </div>
        {chart && <div className="mt-auto" style={{ width: '100%', height: '55px', marginTop: '12px' }}>{chart}</div>}
      </Card.Body>
    </Card>
  );

  const MetricCard: React.FC<{ icon: React.ReactNode; title: string; items: Array<{ label: string; value: string | number; color?: string }>; chart?: React.ReactNode; bgGradient?: string }> = ({ icon, title, items, chart, bgGradient = '' }) => (
    <Card className="stat-card-responsive border" style={{ backgroundColor: '#ffffff', borderRadius: '12px', background: bgGradient || '#ffffff', borderColor: '#dee2e6' }}>
      <Card.Body className="p-3">
        <div className="d-flex align-items-center mb-3">
          <div style={{ color: '#f59e0b' }} className="me-2">{icon}</div>
          <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>{title}</div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {items.map((item, idx) => (
              <div key={idx} className="mb-2">
                <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>{item.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: item.color || '#212529' }}>{item.value}</div>
              </div>
            ))}
          </div>
          {chart && <div style={{ width: '120px', height: '120px' }}>{chart}</div>}
        </div>
      </Card.Body>
    </Card>
  );


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="CDR Records" />

      
        {/* Header */}
        <div className="mb-4">
          <h4 style={{ color: '#212529', fontWeight: '600' }}>
            CDR Records <span style={{ color: '#6c757d' }}>— Compliance Checks</span>
          </h4>
        </div>

        {/* Stats Cards Row */}
        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} lg={2}>
          <style>{`
      .stat-card-responsive {
        min-height: auto;
      }

      /* Desktop and up */
@media (min-width: 992px) { /* lg breakpoint */
  .stat-card-responsive {
    min-height: 195px; /* adjust as needed */
  }
}
      `}</style>
            <StatCard
              icon={<TrendingUp size={20} />}
              title="Total Records"
              value="1,349"
              subtitle="Last 24 hours"
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              }
            />
          </Col>
          <Col xs={12} sm={6} lg={2}>
            <MetricCard
              icon={<Shield size={20} />}
              title="Local DND"
              items={[
                { label: 'Not Checked', value: '100%', color: '#212529' },
                { label: 'Allowed', value: '0%', color: '#6c757d' }
              ]}
              bgGradient="linear-gradient(135deg, #ffffff 0%, #fff5f0 100%)"
            />
          </Col>
          <Col xs={12} sm={6} lg={2}>
            <MetricCard
              icon={<RefreshCw size={20} />}
              title="Repetition"
              items={[
                { label: 'Allowed', value: '30%', color: '#212529' }
              ]}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={repetitionData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2}>
                      {repetitionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              }
            />
          </Col>
          <Col xs={12} sm={6} lg={2}>
            <StatCard
              icon={<XCircle size={20} />}
              title="DNCR API"
              value="10"
              subtitle="FALSE"
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dncApiTrendData}>
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              }
              bgClass=""
            />
          </Col>
          <Col xs={12} sm={6} lg={2}>
            <MetricCard
              icon={<X size={20} />}
              title="Allow Local DNCL"
              items={[
                { label: 'TRUE', value: '10%', color: '#212529' }
              ]}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allowLocalDNCLData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2}>
                      {allowLocalDNCLData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              }
              bgGradient="linear-gradient(135deg, #ffffff 0%, #f5f0ff 100%)"
            />
          </Col>
          <Col xs={12} sm={6} lg={2}>
            <StatCard
              icon={<Clock size={20} />}
              title="Avg Time"
              value="926ms"
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={avgTimeTrendData}>
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              }
            />
          </Col>
        </Row>

        {/* Search and Filter Row */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {/* Global Search */}
                <div className="d-flex align-items-center" style={{ backgroundColor: '#ffffff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '8px 12px', height: '38px' }}>
                  <Search size={16} style={{ color: '#6c757d', marginRight: '8px' }} />
                  <Form.Control
                    type="text"
                    placeholder="Search (across all fields)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                    style={{ 
                      border: 'none', 
                      boxShadow: 'none',
                      fontSize: '0.875rem',
                      color: '#212529',
                      width: '200px',
                      padding: '0'
                    }}
                  />
                </div>
                
                {/* Calling Number Filter */}
                <div className="d-flex align-items-center" style={{ backgroundColor: '#ffffff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '8px 12px', height: '38px' }}>
                  <Search size={16} style={{ color: '#6c757d', marginRight: '8px' }} />
                  <Form.Control
                    type="text"
                    placeholder="Calling Number"
                    value={callingNumberFilter}
                    onChange={(e) => setCallingNumberFilter(e.target.value)}
                    style={{ 
                      border: 'none', 
                      boxShadow: 'none',
                      fontSize: '0.875rem',
                      width: '130px',
                      padding: '0'
                    }}
                  />
                </div>

                {/* Called Number Filter */}
                <div className="d-flex align-items-center" style={{ backgroundColor: '#ffffff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '8px 12px', height: '38px' }}>
                  <Search size={16} style={{ color: '#6c757d', marginRight: '8px' }} />
                  <Form.Control
                    type="text"
                    placeholder="Called Number"
                    value={calledNumberFilter}
                    onChange={(e) => setCalledNumberFilter(e.target.value)}
                    style={{ 
                      border: 'none', 
                      boxShadow: 'none',
                      fontSize: '0.875rem',
                      width: '130px',
                      padding: '0'
                    }}
                  />
                </div>

                {/* User ID Filter */}
                <div className="d-flex align-items-center" style={{ backgroundColor: '#ffffff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '8px 12px', height: '38px' }}>
                  <span style={{ marginRight: '8px', fontSize: '14px' }}>👤</span>
                  <Form.Control
                    type="text"
                    placeholder="User ID"
                    value={userIdFilter}
                    onChange={(e) => setUserIdFilter(e.target.value)}
                    style={{ 
                      border: 'none', 
                      boxShadow: 'none',
                      fontSize: '0.875rem',
                      width: '110px',
                      padding: '0'
                    }}
                  />
                </div>

                {/* Repetition Status Dropdown */}
                <Dropdown>
                  <Dropdown.Toggle 
                    variant="light" 
                    style={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '8px', 
                      color: '#212529',
                      height: '38px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ marginRight: '4px' }}>👤</span> {repetitionStatusFilter === 'all' ? 'All Status' : repetitionStatusFilter}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setRepetitionStatusFilter('all')}>All Status</Dropdown.Item>
                    <Dropdown.Item onClick={() => setRepetitionStatusFilter('Allowed')}>Allowed</Dropdown.Item>
                    <Dropdown.Item onClick={() => setRepetitionStatusFilter('Not Allowed')}>Not Allowed</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Action Buttons - Right Side */}
              <div className="d-flex gap-2 align-items-center">
                <Button 
                  variant="light" 
                  onClick={handleResetFilters}
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px', 
                    color: '#212529',
                    height: '38px',
                    fontSize: '0.875rem',
                    padding: '0 16px'
                  }}
                >
                  Reset
                </Button>
                
                <Button 
                  onClick={handleApplyFilters}
                  style={{ 
                    backgroundColor: '#4f46e5', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#ffffff',
                    height: '38px',
                    fontSize: '0.875rem',
                    padding: '0 16px'
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Active Filters Display */}
        {(appliedFilters.search || appliedFilters.callingNumber || appliedFilters.calledNumber || 
          appliedFilters.userId || appliedFilters.repetitionStatus !== 'all') && (
          <div className="mb-3 px-2">
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>Active Filters:</span>
              {appliedFilters.search && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Search: {appliedFilters.search}
                </span>
              )}
              {appliedFilters.callingNumber && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Calling: {appliedFilters.callingNumber}
                </span>
              )}
              {appliedFilters.calledNumber && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Called: {appliedFilters.calledNumber}
                </span>
              )}
              {appliedFilters.userId && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  User: {appliedFilters.userId}
                </span>
              )}
              {appliedFilters.repetitionStatus !== 'all' && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Status: {appliedFilters.repetitionStatus}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Table Section */}
        <Card className="border" style={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#dee2e6' }}>
          <Card.Body className="p-0">
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: '#dee2e6 !important' }}>
              <h6 className="mb-0" style={{ color: '#212529' }}>
                CDR Records <span style={{ color: '#6c757d' }}>— Compliance Checks</span>
              </h6>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                  {totalRecords} Records | Page {currentPage} of {totalPages || 1}
                </span>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <Table className="mb-0" style={{ minWidth: '1400px' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>ID</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>DATE/TIME</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>CALLING #</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>CALLED #</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>USER ID</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>LOCAL DND</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>REPETITION</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>DNCR API</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>TIME (MS)</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>ALLOW LOCAL DNCL</th>
                    <th style={{ color: '#6c757d', fontWeight: '500', fontSize: '0.75rem', padding: '12px', border: 'none' }}>ALLOW REPETITION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length > 0 ? (
                    currentRecords.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{row.id}</td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{row.dateTime}</td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{row.calling}</td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{row.called}</td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{row.userId}</td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>
                          <span style={{ color: '#6c757d' }}>{row.localDND}</span>
                        </td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>
                          <span style={{ 
                            color: row.repetition === 'Allowed' ? '#0d8a5e' : '#c7337a', 
                            backgroundColor: row.repetition === 'Allowed' ? '#d1f4e8' : '#fce4ec', 
                            padding: '4px 8px', 
                            borderRadius: '6px' 
                          }}>
                            {row.repetition}
                          </span>
                        </td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>
                          <span style={{ 
                            color: row.dncrApi === 'TRUE' ? '#0d8a5e' : '#c7337a', 
                            backgroundColor: row.dncrApi === 'TRUE' ? '#d1f4e8' : '#fce4ec', 
                            padding: '4px 8px', 
                            borderRadius: '6px' 
                          }}>
                            {row.dncrApi}
                          </span>
                        </td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>{row.time}</td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>
                          <span style={{ 
                            color: row.allowLocalDNCL === 'TRUE' ? '#0d8a5e' : '#c7337a', 
                            backgroundColor: row.allowLocalDNCL === 'TRUE' ? '#d1f4e8' : '#fce4ec', 
                            padding: '4px 8px', 
                            borderRadius: '6px' 
                          }}>
                            {row.allowLocalDNCL}
                          </span>
                        </td>
                        <td style={{ color: '#212529', fontSize: '0.875rem', padding: '12px', border: 'none' }}>
                          <span style={{ 
                            color: row.allowRepetition === 'TRUE' ? '#0d8a5e' : '#c7337a', 
                            backgroundColor: row.allowRepetition === 'TRUE' ? '#d1f4e8' : '#fce4ec', 
                            padding: '4px 8px', 
                            borderRadius: '6px' 
                          }}>
                            {row.allowRepetition}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '24px', color: '#6c757d' }}>
                        No records found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            <div className="d-flex justify-content-between align-items-center p-3 border-top" style={{ borderColor: '#dee2e6 !important' }}>
              <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                {totalRecords} Records | Page {currentPage} of {totalPages || 1}
              </span>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: '#6c757d', fontSize: '0.875rem', marginRight: '8px' }}>Records per page:</span>
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}>
                    {recordsPerPage} ▼
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleRecordsPerPageChange(10)}>10</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleRecordsPerPageChange(25)}>25</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleRecordsPerPageChange(50)}>50</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleRecordsPerPageChange(100)}>100</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529', marginLeft: '12px' }}
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  style={{ backgroundColor: '#4f46e5', border: 'none', minWidth: '32px' }}
                >
                  {currentPage}
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#212529' }}
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

    </React.Fragment>
  );
};

CDRRecords.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CDRRecords;
