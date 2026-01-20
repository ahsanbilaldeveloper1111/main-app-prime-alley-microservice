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

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSystemMetrics, getSystemMetricsServers, SystemMetric, ServerMetricsListResponse } from "@utils/netops";
import { Container, Row, Col, Card, Badge, Dropdown, Form, Table } from 'react-bootstrap';
import { 
  Server, 
  HardDrive, 
  Cpu, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  ChevronDown,
  Database,
  Play,
  AlertCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const ApplicationMonitoring = () => {
      const router = useRouter();
      const { server } = router.query;

      const [autoRefresh, setAutoRefresh] = useState(true);
      const [showPackages, setShowPackages] = useState(false);
      const [systemMetrics, setSystemMetrics] = useState<SystemMetric | null>(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [servers, setServers] = useState<Array<{ name: string; ip: string }>>([]);
      const [loadingServers, setLoadingServers] = useState(false);
      const [showDropdown, setShowDropdown] = useState(false);
      
      // Helper function to format uptime
      const formatUptime = (seconds: number): string => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days} days, ${hours}h ${minutes}m`;
      };
      
      // Helper function to get network IP
      const getNetworkIp = (): string => {
        if (!systemMetrics?.network) return 'N/A';
        const mainInterface = systemMetrics.network.find(n => n.interface !== 'lo' && n.is_up);
        return mainInterface?.ip || systemMetrics.network[0]?.ip || 'N/A';
      };
      
      // Helper function to get system alerts based on metrics
      const getSystemAlerts = (): Array<{ type: 'warning' | 'danger' | 'info'; message: string; icon: React.ReactNode }> => {
        if (!systemMetrics) return [];
        
        const alerts: Array<{ type: 'warning' | 'danger' | 'info'; message: string; icon: React.ReactNode }> = [];
        
        // Check CPU usage
        if (systemMetrics.cpu.used_percent > 90) {
          alerts.push({
            type: 'danger',
            message: `Critical CPU usage: ${systemMetrics.cpu.used_percent.toFixed(1)}%`,
            icon: <Cpu size={20} />
          });
        } else if (systemMetrics.cpu.used_percent > 80) {
          alerts.push({
            type: 'warning',
            message: `High CPU usage: ${systemMetrics.cpu.used_percent.toFixed(1)}%`,
            icon: <Cpu size={20} />
          });
        }
        
        // Check Memory usage
        if (systemMetrics.memory.used_percent > 90) {
          alerts.push({
            type: 'danger',
            message: `Critical memory usage: ${systemMetrics.memory.used_percent.toFixed(1)}%`,
            icon: <Activity size={20} />
          });
        } else if (systemMetrics.memory.used_percent > 80) {
          alerts.push({
            type: 'warning',
            message: `High memory usage: ${systemMetrics.memory.used_percent.toFixed(1)}%`,
            icon: <Activity size={20} />
          });
        }
        
        // Check Disk usage
        if (systemMetrics.disk.used_percent > 90) {
          alerts.push({
            type: 'danger',
            message: `Critical disk usage: ${systemMetrics.disk.used_percent.toFixed(1)}%`,
            icon: <HardDrive size={20} />
          });
        } else if (systemMetrics.disk.used_percent > 80) {
          alerts.push({
            type: 'warning',
            message: `High disk usage: ${systemMetrics.disk.used_percent.toFixed(1)}%`,
            icon: <HardDrive size={20} />
          });
        }
        
        // Check failed services
        if (systemMetrics.failed_services && systemMetrics.failed_services.length > 0) {
          alerts.push({
            type: 'danger',
            message: `${systemMetrics.failed_services.length} service(s) failed: ${systemMetrics.failed_services.join(', ')}`,
            icon: <XCircle size={20} />
          });
        }
        
        // Check journal errors
        if (systemMetrics.journal_errors && systemMetrics.journal_errors.length > 0) {
          alerts.push({
            type: 'warning',
            message: `${systemMetrics.journal_errors.length} journal error(s) detected`,
            icon: <AlertCircle size={20} />
          });
        }
        
        // Check swap usage if high
        if (systemMetrics.swap && systemMetrics.swap.used_percent > 50) {
          alerts.push({
            type: 'warning',
            message: `High swap usage: ${systemMetrics.swap.used_percent.toFixed(1)}%`,
            icon: <Activity size={20} />
          });
        }
        
        return alerts;
      };
      
      const [selectedServer, setSelectedServer] = useState<{ name: string; ip: string }>({
        name: (server as string) || '',
        ip: 'N/A'
      });
      
      // Update selectedServer when server query param changes
      useEffect(() => {
        if (server && typeof server === 'string') {
          setSelectedServer(prev => ({
            ...prev,
            name: server
          }));
        }
      }, [server]);
      
      // Update IP when metrics are loaded
      useEffect(() => {
        if (systemMetrics) {
          const ip = getNetworkIp();
          setSelectedServer(prev => ({
            ...prev,
            ip: ip !== 'N/A' ? ip : prev.ip
          }));
        }
      }, [systemMetrics]);
      
      // Fetch system metrics when server name is available (from query param or selectedServer)
      useEffect(() => {
        const serverName = (server as string) || selectedServer.name;
        const fetchSystemMetrics = async () => {
          if (serverName) {
            setLoading(true);
            setError(null);
            try {
              const response = await getSystemMetrics(serverName);
              console.log('System Metrics Response:', response);
              // The response is already extracted by extractData, so it should be SystemMetric
              setSystemMetrics(response as any);
            } catch (error: any) {
              console.error('Error fetching system metrics:', error);
              setError(error?.message || 'Failed to fetch system metrics');
            } finally {
              setLoading(false);
            }
          }
        };
        
        if (serverName) {
          fetchSystemMetrics();
          
          // Auto-refresh if enabled
          if (autoRefresh) {
            const interval = setInterval(() => {
              fetchSystemMetrics();
            }, 30000); // Refresh every 30 seconds
            
            return () => clearInterval(interval);
          }
        }
      }, [server, selectedServer.name, autoRefresh]);
    
      // Fetch servers list on component mount
      useEffect(() => {
        const fetchServers = async () => {
          setLoadingServers(true);
          try {
            const response: ServerMetricsListResponse = await getSystemMetricsServers();
            
            // Transform the response to match the expected format
            // The extractData function already extracts response.data.data, so response should have servers and count at top level
            if (response?.servers && Array.isArray(response.servers)) {
              const serverList = response.servers.map(server => ({
                name: server.hostname,
                ip: server.ip_address || 'N/A'
              }));
              setServers(serverList);
            } else {
              console.warn('No servers found in response or invalid format:', response);
              setServers([]);
            }
          } catch (error: any) {
            console.error('Error fetching servers list:', error);
            // Fallback to empty array on error
            setServers([]);
          } finally {
            setLoadingServers(false);
          }
        };
        
        fetchServers();
      }, []);

      // Set default server when servers list is loaded and no server is selected
      useEffect(() => {
        if (servers.length > 0 && !selectedServer.name && !server) {
          // If no query param and no selected server, set first server as default
          setSelectedServer({
            name: servers[0].name,
            ip: servers[0].ip
          });
        }
      }, [servers, server, selectedServer.name]);
    
    
      const customStyles = `
      .table-responsive .table th:last-child, .table-responsive .table td:last-child {
        min-width: auto !important;
      }
        .btn-light:active,
    .btn-light:focus,
    .btn-light.show,
    .btn-light:not(:disabled):not(.disabled):active {
      background-color: #f1f5f9 !important;
      color: #000 !important;
      box-shadow: none !important;
    }
        .metric-card {
          border: none;
          border-radius: 12px;
          height: 100%;
          transition: all 0.3s ease;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .progress-ring {
          transform: rotate(-90deg);
        }
        .progress-ring-circle {
          transition: stroke-dashoffset 0.35s;
          transform-origin: 50% 50%;
        }
        .cpu-card {
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
         
        }
        .memory-card {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
          
        }
        .disk-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          
        }
        .system-load-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          
        }
        .metric-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          line-height: 1;
        }
        .metric-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }
        .metric-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .info-item:last-child {
          border-bottom: none;
        }
        .info-label {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .info-value {
          color: #1e293b;
          font-size: 0.875rem;
          font-weight: 600;
        }
        .service-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          border-radius: 8px;
          background: #f8fafc;
          margin-bottom: 0.5rem;
          transition: background 0.2s ease;
        }
        .service-item:hover {
          background: #f1f5f9;
        }
        .database-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: all 0.2s ease;
        }
        .database-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .alert-card {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .process-table {
          font-size: 0.875rem;
        }
        .process-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
          border: none;
          padding: 0.75rem 0.5rem;
        }
        .process-table td {
          padding: 0.75rem 0.5rem;
          vertical-align: middle;
          border-color: #f1f5f9;
        }
        .memory-bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
          margin-left: 0.5rem;
          flex: 1;
          max-width: 100px;
        }
        .memory-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .port-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .header-section {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .failed-service-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem;
          background: #fef2f2;
          border-radius: 8px;
          border-left: 3px solid #ef4444;
          margin-bottom: 0.5rem;
        }
        .sparkline-container {
          height: 40px;
          margin-top: 0.5rem;
        }
      `;
    
  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Application Monitoring" />

      {/* <PageHeader
        title="Application Monitoring"
        showSearch={false}
      /> */}

<>
      <style>{customStyles}</style>
      
        {/* Error State */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={20} className="me-2" />
            {error}
          </div>
        )}
      
        {/* Loading Overlay - When switching servers */}
        {loading && systemMetrics && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted" style={{ fontSize: '1rem' }}>Loading system metrics...</p>
            </div>
          </div>
        )}
      
        {/* Header - Always visible */}
        <div className="header-section">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>OS & Application Monitoring</h2>
              <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                Monitor system and app health across servers
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <button 
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                onClick={async () => {
                  if (selectedServer.name) {
                    setLoading(true);
                    setError(null);
                    try {
                      const response = await getSystemMetrics(selectedServer.name);
                      console.log('System Metrics Response:', response);
                      setSystemMetrics(response as any);
                    } catch (error: any) {
                      console.error('Error fetching system metrics:', error);
                      setError(error?.message || 'Failed to fetch system metrics');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                disabled={loading || !selectedServer.name}
              >
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                Refresh
              </button>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Auto</span>
                <Form.Check 
                  type="switch"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  style={{ fontSize: '1.25rem' }}
                />
              </div>
            </div>
          </div>

         <Row className="g-3">
            <Col md={3}>
              <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                <Dropdown.Toggle 
                  variant="light" 
                  className="w-100 text-start d-flex align-items-center gap-2" 
                  style={{ background: '#f1f5f9' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '14px', height: '14px', borderWidth: '2px' }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                  <Server size={16} className="text-primary" />
                      {selectedServer.name ? `${selectedServer.name} - ${selectedServer.ip}` : 'Select a server'}
                    </>
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                  {loadingServers ? (
                    <Dropdown.Item disabled>
                      <div className="d-flex align-items-center gap-2">
                        <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '14px', height: '14px', borderWidth: '2px' }}>
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Loading servers...</span>
                      </div>
                    </Dropdown.Item>
                  ) : servers.length > 0 ? (
                    servers.map((server, index) => (
                      <Dropdown.Item 
                        key={index}
                        active={selectedServer.name === server.name}
                        onClick={async (e: React.MouseEvent<HTMLElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Close dropdown
                        setShowDropdown(false);
                        
                        // Don't fetch if already selected
                        if (selectedServer.name === server.name) {
                          return;
                        }
                        
                        // Update selected server immediately
                        setSelectedServer({
                          name: server.name,
                          ip: server.ip
                        });
                        
                        // Fetch metrics for the selected server
                        setLoading(true);
                        setError(null);
                        try {
                          const response = await getSystemMetrics(server.name);
                          console.log('System Metrics Response for', server.name, ':', response);
                          setSystemMetrics(response as any);
                        } catch (error: any) {
                          console.error('Error fetching system metrics:', error);
                          setError(error?.message || 'Failed to fetch system metrics');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {/* <Server size={14} /> */}
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{server.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{server.ip}</div>
                        </div>
                      </div>
                    </Dropdown.Item>
                    ))
                  ) : (
                    <Dropdown.Item disabled>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>No servers available</div>
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </div>

        {/* Metrics Content - Only show when systemMetrics exists */}
        {!loading && systemMetrics && (
        <>
          <Row className="mt-3 g-3">
            <Col md={3}>
              <div className="info-item">
                <Server size={16} className="text-primary" />
                <div className="flex-grow-1">
                  <div className="info-label">Hostname</div>
                  <div className="info-value">{systemMetrics?.host?.hostname || systemMetrics?.hostname || 'Loading...'}</div>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="info-item">
                <HardDrive size={16} className="text-success" />
                <div className="flex-grow-1">
                  <div className="info-label">OS</div>
                  <div className="info-value">{systemMetrics?.host?.os || 'Loading...'}</div>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="info-item">
                <Cpu size={16} className="text-warning" />
                <div className="flex-grow-1">
                  <div className="info-label">Kernel</div>
                  <div className="info-value">{systemMetrics?.host?.kernel || 'Loading...'}</div>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="info-item">
                <Activity size={16} className="text-info" />
                <div className="flex-grow-1">
                  <div className="info-label">Uptime</div>
                  <div className="info-value">{systemMetrics?.uptime ? formatUptime(systemMetrics.uptime.seconds) : 'Loading...'}</div>
                </div>
              </div>
            </Col>
          </Row>

        {/* Metrics Cards */}
        <Row className="g-3 mb-4">
          <Col lg={3} md={6}>
            <Card className="metric-card cpu-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="metric-label">CPU USAGE</div>
                    <h1 className="metric-value" style={{ color: '#4c6ef5' }}>
                      {systemMetrics ? systemMetrics.cpu.used_percent.toFixed(1) : '0'}<span style={{ fontSize: '1.5rem' }}>%</span>
                    </h1>
                    <div className="metric-subtitle">{systemMetrics ? `${systemMetrics.cpu.cores} Cores` : 'Loading...'}</div>
                  </div>
                  <svg width="60" height="60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="#e0e7ff" strokeWidth="5"/>
                    <circle 
                      cx="30" cy="30" r="25" 
                      fill="none" 
                      stroke="#4c6ef5" 
                      strokeWidth="5"
                      strokeDasharray={systemMetrics ? `${systemMetrics.cpu.used_percent * 1.57} ${100 * 1.57}` : '0 157'}
                      className="progress-ring-circle"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-1" style={{ color: '#4c6ef5', fontSize: '0.875rem' }}>
                    <Activity size={14} />
                    <span>Avg Load: {systemMetrics ? systemMetrics.load['15m'].toFixed(2) : '0.00'}</span>
                  </div>
                  <Badge bg={systemMetrics && systemMetrics.cpu.used_percent > 80 ? 'danger' : systemMetrics && systemMetrics.cpu.used_percent > 60 ? 'warning' : 'success'} style={{ fontSize: '0.7rem' }}>
                    {systemMetrics && systemMetrics.cpu.used_percent > 80 ? 'High' : systemMetrics && systemMetrics.cpu.used_percent > 60 ? 'Warning' : 'Normal'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="metric-card memory-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="metric-label">MEMORY USAGE</div>
                    <h1 className="metric-value" style={{ color: '#f03e3e' }}>
                      {systemMetrics ? systemMetrics.memory.used_percent.toFixed(1) : '0'}<span style={{ fontSize: '1.5rem' }}>%</span>
                    </h1>
                    <div className="metric-subtitle">
                      {systemMetrics ? `${systemMetrics.memory.used_gb.toFixed(1)} / ${systemMetrics.memory.total_gb.toFixed(1)} GB` : 'Loading...'}
                    </div>
                  </div>
                  <svg width="60" height="60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="#ffe8e8" strokeWidth="5"/>
                    <circle 
                      cx="30" cy="30" r="25" 
                      fill="none" 
                      stroke="#f03e3e" 
                      strokeWidth="5"
                      strokeDasharray={systemMetrics ? `${systemMetrics.memory.used_percent * 1.57} ${100 * 1.57}` : '0 157'}
                      className="progress-ring-circle"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-1">
                    <AlertTriangle size={14} style={{ color: systemMetrics && systemMetrics.memory.used_percent > 80 ? '#f03e3e' : '#64748b' }} />
                    <span style={{ color: systemMetrics && systemMetrics.memory.used_percent > 80 ? '#f03e3e' : '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                      {systemMetrics && systemMetrics.memory.used_percent > 80 ? 'High Usage' : 'Normal'}
                    </span>
                  </div>
                  <Badge bg={systemMetrics && systemMetrics.memory.used_percent > 80 ? 'danger' : systemMetrics && systemMetrics.memory.used_percent > 60 ? 'warning' : 'success'} style={{ fontSize: '0.7rem' }}>
                    {systemMetrics && systemMetrics.memory.used_percent > 80 ? 'Warning' : systemMetrics && systemMetrics.memory.used_percent > 60 ? 'Moderate' : 'Normal'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="metric-card disk-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="metric-label">DISK USAGE</div>
                    <h1 className="metric-value" style={{ color: '#3b82f6' }}>
                      {systemMetrics ? systemMetrics.disk.used_percent.toFixed(1) : '0'}<span style={{ fontSize: '1.5rem' }}>%</span>
                    </h1>
                    <div className="metric-subtitle">
                      {systemMetrics ? `${systemMetrics.disk.used_gb.toFixed(1)} / ${systemMetrics.disk.total_gb.toFixed(1)} GB` : 'Loading...'}
                    </div>
                  </div>
                  <svg width="60" height="60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="#e0f2fe" strokeWidth="5"/>
                    <circle 
                      cx="30" cy="30" r="25" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="5"
                      strokeDasharray={systemMetrics ? `${systemMetrics.disk.used_percent * 1.57} ${100 * 1.57}` : '0 157'}
                      className="progress-ring-circle"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-1" style={{ color: '#3b82f6', fontSize: '0.875rem' }}>
                    <HardDrive size={14} />
                    <span>Free: {systemMetrics ? systemMetrics.disk.free_gb.toFixed(1) : '0'} GB</span>
                  </div>
                  <Badge bg={systemMetrics && systemMetrics.disk.used_percent > 80 ? 'danger' : systemMetrics && systemMetrics.disk.used_percent > 60 ? 'warning' : 'success'} style={{ fontSize: '0.7rem' }}>
                    {systemMetrics && systemMetrics.disk.used_percent > 80 ? 'Warning' : systemMetrics && systemMetrics.disk.used_percent > 60 ? 'Moderate' : 'Healthy'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="metric-card system-load-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="metric-label">SYSTEM LOAD</div>
                    <h1 className="metric-value" style={{ color: '#22c55e' }}>
                      {systemMetrics ? systemMetrics.load['15m'].toFixed(2) : '0.00'}
                    </h1>
                    <div className="metric-subtitle">
                      {systemMetrics ? `1m: ${systemMetrics.load['1m'].toFixed(2)} | 5m: ${systemMetrics.load['5m'].toFixed(2)}` : 'Loading...'}
                    </div>
                  </div>
                  <svg width="60" height="60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="#dcfce7" strokeWidth="5"/>
                    <circle 
                      cx="30" cy="30" r="25" 
                      fill="none" 
                      stroke="#22c55e" 
                      strokeWidth="5"
                      strokeDasharray={systemMetrics ? `${(systemMetrics.load['15m'] / systemMetrics.cpu.cores) * 100 * 1.57} ${100 * 1.57}` : '0 157'}
                      className="progress-ring-circle"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-1" style={{ color: '#22c55e', fontSize: '0.875rem' }}>
                    <Activity size={14} />
                    <span>15m Average</span>
                  </div>
                  <Badge bg={systemMetrics && (systemMetrics.load['15m'] / systemMetrics.cpu.cores) > 1 ? 'warning' : 'success'} style={{ fontSize: '0.7rem' }}>
                    {systemMetrics && (systemMetrics.load['15m'] / systemMetrics.cpu.cores) > 1 ? 'High' : 'Normal'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3">
          {/* Left Column */}
          <Col lg={6}>
            {/* Services Status */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Activity className="text-primary" size={20} />
                  Services Status
                </div>
                
                {systemMetrics?.services && systemMetrics.services.length > 0 ? (
                  systemMetrics.services.map((service, index) => (
                    <div key={index} className="service-item">
                  <div className="d-flex align-items-center gap-2">
                        {service.running ? (
                    <CheckCircle size={18} className="text-success" />
                        ) : (
                          <XCircle size={18} className="text-danger" />
                        )}
                        <span style={{ fontWeight: 600 }}>{service.name}</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                        <Badge bg={service.running ? 'success' : 'danger'} className="status-badge">
                          {service.status}
                        </Badge>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{service.status}</span>
                  </div>
                </div>
                  ))
                ) : (
                  <div className="text-muted text-center py-3">No services data available</div>
                )}
                
                {systemMetrics?.failed_services && systemMetrics.failed_services.length > 0 && (
                  <div className="mt-3">
                    <div className="section-title" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <AlertCircle className="text-danger" size={16} />
                      Failed Services
                  </div>
                    {systemMetrics.failed_services.map((failedService, index) => (
                      <div key={index} className="failed-service-item">
                        <span style={{ fontWeight: 600 }}>{failedService}</span>
                        <Badge bg="danger">Failed</Badge>
                  </div>
                    ))}
                </div>
                )}
              </Card.Body>
            </Card>

            {/* SQL Server Databases */}
            {systemMetrics?.sql && systemMetrics.sql.databases && systemMetrics.sql.databases.length > 0 && (
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Database className="text-primary" size={20} />
                  SQL Server Databases
                </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                    Driver: {systemMetrics.sql.driver_used} | Version: {systemMetrics.sql.version.split('\n')[0]}
                </div>

                  {systemMetrics.sql.databases.map((db, index) => (
                    <div 
                      key={index} 
                      className="database-card"
                      style={db.used_percent > 80 ? { background: '#fef2f2', border: '1px solid #fecaca' } : {}}
                    >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 32, height: 32, background: db.used_percent > 80 ? '#f59e0b' : '#4c6ef5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                            {db.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{db.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{db.tables} Tables</div>
                      </div>
                    </div>
                        <Badge bg={db.used_percent > 80 ? 'warning' : 'success'} className="status-badge">
                          {db.used_percent > 80 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                          {db.used_percent > 80 ? 'Warning' : 'Healthy'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Storage: {db.used_gb.toFixed(2)} GB / {db.size_gb.toFixed(2)} GB • {db.used_percent.toFixed(1)}% used
                  </div>
                </div>
                  ))}
              </Card.Body>
            </Card>
            )}

            {/* Filesystems */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <HardDrive className="text-primary" size={20} />
                  Filesystems
                </div>

                <Row className="g-3">
                  {systemMetrics?.filesystems && systemMetrics.filesystems.length > 0 ? (
                    systemMetrics.filesystems.slice(0, 6).map((fs, index) => {
                      const usedPercent = parseFloat(fs.used_percent.replace('%', ''));
                      return (
                        <Col md={4} key={index}>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                              <HardDrive size={18} className={usedPercent > 80 ? 'text-danger' : usedPercent > 60 ? 'text-warning' : 'text-primary'} />
                              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{fs.filesystem}</span>
                      </div>
                      <Badge bg="success" className="status-badge mb-2">
                        <CheckCircle size={12} />
                        Mounted
                      </Badge>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {fs.mount}: {fs.used_gb.toFixed(1)} / {fs.total_gb.toFixed(1)} GB • {fs.used_percent} used
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                              Type: {fs.type}
                      </div>
                    </div>
                  </Col>
                      );
                    })
                  ) : (
                    <Col md={12}>
                      <div className="text-muted text-center py-3">No filesystem data available</div>
                  </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>

            {/* Listening Ports */}
            {systemMetrics?.listening_ports && systemMetrics.listening_ports.length > 0 && (
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Activity className="text-primary" size={20} />
                  Listening Ports
                    <Badge bg="secondary" style={{ fontSize: '0.75rem' }}>{systemMetrics.listening_ports.length}</Badge>
                </div>

                <Table className="process-table" hover>
                  <thead>
                    <tr>
                        <th>Port Info</th>
                      <th>Process</th>
                    </tr>
                  </thead>
                  <tbody>
                      {systemMetrics.listening_ports.slice(0, 20).map((portInfo, index) => {
                        // Parse port information from the string format
                        const parts = portInfo.split(/\s+/);
                        const protocol = parts[0]?.toUpperCase() || 'UNKNOWN';
                        const address = parts[3] || '';
                        const processRegex = /users:\(\(["']?([^"',]+)/;
                        const processMatch = processRegex.exec(portInfo);
                        const process = processMatch ? processMatch[1] : 'N/A';
                        const portRegex = /:(\d+)/;
                        const portMatch = portRegex.exec(address);
                        const port = portMatch ? portMatch[1] : 'N/A';
                        
                        // Determine if port is risky (common risky ports)
                        const riskyPorts = ['22', '23', '21', '3306', '1433', '5432', '27017'];
                        const isRisky = riskyPorts.includes(port);
                        
                        return (
                          <tr key={index}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{protocol}</span>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{address}</span>
                                {isRisky && <Badge bg="danger" className="port-badge" style={{ fontSize: '0.7rem' }}>Risky</Badge>}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.875rem' }}>{process}</span>
                            </td>
                    </tr>
                        );
                      })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
            )}

          </Col>

          {/* Right Column */}
          <Col lg={6}>
            {/* Alerts */}
            {systemMetrics && getSystemAlerts().length > 0 ? (
              getSystemAlerts().map((alert, index) => (
                <div 
                  key={index} 
                  className="alert-card"
                  style={{
                    background: alert.type === 'danger' ? '#fef2f2' : alert.type === 'warning' ? '#fef3c7' : '#eff6ff',
                    borderLeft: `4px solid ${alert.type === 'danger' ? '#ef4444' : alert.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
                    marginBottom: '1rem'
                  }}
                >
                  <div className="d-flex align-items-start gap-2">
                    <div style={{ 
                      color: alert.type === 'danger' ? '#ef4444' : alert.type === 'warning' ? '#f59e0b' : '#3b82f6',
                      marginTop: '2px'
                    }}>
                      {alert.icon}
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        color: alert.type === 'danger' ? '#991b1b' : alert.type === 'warning' ? '#92400e' : '#1e40af',
                        marginBottom: '0.25rem' 
                      }}>
                        {alert.message}
                    </div>
                  </div>
                </div>
                </div>
              ))
            ) : systemMetrics ? (
              <div className="alert-card" style={{ background: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
              <div className="d-flex align-items-start gap-2">
                  <CheckCircle size={20} className="text-success mt-1" />
                <div>
                    <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>
                      System health: All metrics within normal range
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {/* CPU & Memory Chart */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 12, height: 3, background: '#3b82f6', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>CPU Usage</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 12, height: 3, background: '#f43f5e', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Memory Usage</span>
                    </div>
                  </div>
                  <Badge bg="success" className="status-badge">Current</Badge>
                </div>

                {systemMetrics ? (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={[
                      { 
                        time: new Date(systemMetrics.timestamp || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        cpu: systemMetrics.cpu.used_percent,
                        memory: systemMetrics.memory.used_percent
                      }
                    ]}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: '0.75rem', fill: '#94a3b8' }}
                    />
                    <YAxis 
                        domain={[0, 100]}
                      stroke="#94a3b8" 
                      tick={{ fontSize: '0.75rem', fill: '#94a3b8' }}
                        label={{ value: 'Usage %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: '0.75rem' } }}
                    />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                    <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                    <Area type="monotone" dataKey="memory" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorMemory)" />
                  </AreaChart>
                </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-5">
                    <p style={{ margin: 0 }}>No data available</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Top Processes */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Cpu className="text-primary" size={20} />
                  Top Processes by CPU
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 400, marginLeft: 'auto' }}>Real-time</span>
                </div>

                <Table className="process-table" hover responsive>
                  <thead>
                    <tr>
                      <th>Process Name</th>
                      <th>PID</th>
                      <th>CPU %</th>
                      <th>Memory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemMetrics?.top_processes && systemMetrics.top_processes.length > 0 ? (
                      systemMetrics.top_processes.map((process, index) => {
                        const cpuPercent = parseFloat(process.cpu_percent);
                        const memPercent = parseFloat(process.mem_percent);
                        return (
                          <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                                {process.process.toLowerCase().includes('sql') ? (
                                  <Database size={14} className="text-success" />
                                ) : (
                          <Server size={14} className="text-primary" />
                                )}
                                <span style={{ fontWeight: 500 }}>{process.process}</span>
                        </div>
                      </td>
                            <td>{process.pid}</td>
                            <td>
                              <span style={{ fontWeight: 600, color: cpuPercent > 10 ? '#f59e0b' : '#64748b' }}>
                                {process.cpu_percent}%
                              </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                                <span style={{ fontSize: '0.875rem', minWidth: '60px' }}>
                                  {((memPercent / 100) * (systemMetrics.memory.total_gb || 1)).toFixed(1)} GB
                                </span>
                          <div className="memory-bar">
                                  <div 
                                    className="memory-bar-fill" 
                                    style={{ 
                                      width: `${memPercent}%`, 
                                      background: memPercent > 50 ? '#f59e0b' : '#3b82f6' 
                                    }}
                                  ></div>
                          </div>
                                <span className="ms-2" style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                  {process.mem_percent}%
                                </span>
                        </div>
                      </td>
                    </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-3">No process data available</td>
                    </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Python Environment */}
            {systemMetrics?.python ? (
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Activity className="text-primary" size={20} />
                  Python Environment
                </div>

                <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      fontWeight: '600',
                      minWidth: '180px'
                    }}>
                      Version:
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                        {systemMetrics.python.version || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      fontWeight: '600',
                      minWidth: '180px'
                    }}>
                      Executable:
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                        {systemMetrics.python.executable || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      fontWeight: '600',
                      minWidth: '180px'
                    }}>
                      Packages:
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                        {systemMetrics.python.packages?.length || 0} installed
                    </span>
                  </div>
                </div>

                  {systemMetrics.python.packages && systemMetrics.python.packages.length > 0 && (
                    <>
                <button 
                  onClick={() => setShowPackages(!showPackages)}
                  className="btn btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <Database size={18} />
                  {showPackages ? 'Hide Packages' : 'View Packages'}
                </button>

                {showPackages && (
                  <Table className="process-table mt-3" hover responsive>
                    <thead>
                      <tr>
                        <th>Package</th>
                        <th>Version</th>
                      </tr>
                    </thead>
                    <tbody>
                            {systemMetrics.python.packages.map((pkg, index) => (
                              <tr key={index}>
                                <td style={{ fontWeight: 500 }}>{pkg.name}</td>
                                <td>{pkg.version}</td>
                      </tr>
                            ))}
                    </tbody>
                  </Table>
                      )}
                    </>
                )}
              </Card.Body>
            </Card>
            ) : (
              systemMetrics && (
                <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
                  <Card.Body>
                    <div className="section-title">
                      <Activity className="text-primary" size={20} />
                      Python Environment
                    </div>
                    <div className="text-center text-muted py-4">
                      <p style={{ margin: 0 }}>Python environment information not available</p>
                    </div>
                  </Card.Body>
                </Card>
              )
            )}

            {/* Scheduled Tasks (Cron Jobs) */}
            {systemMetrics?.cron && (
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Clock className="text-primary" size={20} />
                  Scheduled Tasks (Cron Jobs)
                    <Badge bg="secondary" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                      {systemMetrics.cron.users ? Object.values(systemMetrics.cron.users).flatMap((jobs: any) => 
                        Array.isArray(jobs) ? jobs.filter((job: any) => typeof job === 'string' && job.trim() && !job.startsWith('#')) : []
                      ).length : 0} Active
                    </Badge>
                </div>

                  {systemMetrics.cron.users && Object.keys(systemMetrics.cron.users).length > 0 ? (
                <Table className="process-table" hover responsive>
                  <thead>
                    <tr>
                          <th>User</th>
                      <th>Task</th>
                      <th>Schedule</th>
                    </tr>
                  </thead>
                  <tbody>
                        {Object.entries(systemMetrics.cron.users).flatMap(([user, jobs]: [string, any]) => {
                          // Filter out comments and empty lines
                          const activeJobs = Array.isArray(jobs) 
                            ? jobs.filter((job: any) => typeof job === 'string' && job.trim() && !job.startsWith('#') && !job.startsWith('SHELL') && !job.startsWith('PATH') && !job.startsWith('MAILTO'))
                            : [];
                          
                          return activeJobs.map((job: string, index: number) => {
                            // Parse cron job - format: "* * * * * command"
                            const parts = job.trim().split(/\s+/);
                            if (parts.length < 6) return null;
                            
                            const schedule = parts.slice(0, 5).join(' ');
                            const command = parts.slice(5).join(' ');
                            
                            return (
                              <tr key={`${user}-${index}`}>
                                <td>
                                  <Badge bg="info" style={{ fontSize: '0.75rem' }}>{user}</Badge>
                      </td>
                      <td>
                          <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                      {command.split(' ')[0] || 'N/A'}
                          </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                      {command.length > 50 ? command.substring(0, 50) + '...' : command}
                          </div>
                        </div>
                      </td>
                      <td>
                                  <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>
                                    {schedule}
                        </div>
                      </td>
                    </tr>
                            );
                          }).filter(Boolean);
                        })}
                  </tbody>
                </Table>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <p style={{ margin: 0 }}>No cron jobs configured</p>
                    </div>
                  )}
              </Card.Body>
            </Card>
            )}
          </Col>
        </Row>
    </>
        )}
      </>
    </React.Fragment>
  );
};

ApplicationMonitoring.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ApplicationMonitoring;
