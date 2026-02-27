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

import  { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getSystemMetrics, getAlerts, SystemMetric, SystemMetricsResponse, Alert } from "@utils/netops";
import { 
  Search, 
  Server, 
  Globe, 
  Layout as LayoutIcon, 
  Database, 
  Star,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  LayoutGrid,
  List,
  Cpu,
  HardDrive,
  Activity,
  RefreshCw
} from 'lucide-react';
import { Form } from 'react-bootstrap';

const SelectServer = () => {
      const router = useRouter();
      const [viewMode, setViewMode] = useState('cards');
      const [selectedGroup, setSelectedGroup] = useState('all');
      const [selectedEnvironment, setSelectedEnvironment] = useState('All Environments');
      const [selectedRegion, setSelectedRegion] = useState('All Regions');
      const [showEnvDropdown, setShowEnvDropdown] = useState(false);
      const [showRegionDropdown, setShowRegionDropdown] = useState(false);
      const [serverMetrics, setServerMetrics] = useState<SystemMetric[]>([]);
      const [loading, setLoading] = useState(false);
      const [autoRefresh, setAutoRefresh] = useState(true);
      const [refreshingServer, setRefreshingServer] = useState<string | null>(null);
      const [alerts, setAlerts] = useState<Alert[]>([]);
      const [loadingAlerts, setLoadingAlerts] = useState(false);
    
      // Environment options
      const environments = ['All Environments', 'Production', 'Staging', 'Development', 'Testing', 'UAT'];
    
      // Region options
      const regions = ['All Regions', 'US East', 'US West', 'Europe', 'Asia Pacific', 'South America'];
    
      // Helper function to determine server status based on metrics
      const getServerStatus = (metric: SystemMetric): { status: string; statusColor: string } => {
        const cpuPercent = metric.cpu.used_percent;
        const memoryPercent = metric.memory.used_percent;
        const diskPercent = metric.disk.used_percent;
        const hasFailedServices = metric.failed_services.length > 0;
        
        if (hasFailedServices || cpuPercent > 90 || memoryPercent > 90 || diskPercent > 90) {
          return { status: 'Critical', statusColor: 'danger' };
        }
        if (cpuPercent > 70 || memoryPercent > 70 || diskPercent > 70) {
          return { status: 'Warning', statusColor: 'warning' };
        }
        return { status: 'Healthy', statusColor: 'success' };
      };
      
      // Helper function to get IP address from network interfaces
      const getServerIp = (metric: SystemMetric): string => {
        const mainInterface = metric.network.find(n => n.interface !== 'lo' && n.is_up);
        return mainInterface?.ip || 'N/A';
      };
    
      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'Healthy':
          case 'Active':
            return <CheckCircle size={16} />;
          case 'Warning':
            return <AlertTriangle size={16} />;
          case 'Critical':
            return <XCircle size={16} />;
          default:
            return <AlertCircle size={16} />;
        }
      };
    
      const getEnvironmentColor = (env: string) => {
        const colors = {
          'Production': '#28a745',
          'Warning': '#ffc107',
          'Critical': '#dc3545',
          'Development': '#17a2b8',
          'Staging': '#ffc107',
          'Healthy': '#28a745'
        };
        return colors[env as keyof typeof colors] || '#6c757d';
      };

      // Fetch server metrics on component mount
      const fetchServerMetrics = useCallback(async () => {
        try {
          setLoading(true);
          console.log("=== Fetching System Metrics ===");
          const response: SystemMetricsResponse = await getSystemMetrics("all");
          setServerMetrics(response.metrics);
        } catch (error: any) {
          console.error("=== Failed to fetch system metrics ===", error);
        } finally {
          setLoading(false);
        }
      }, []);

      // Fetch alerts
      const fetchAlerts = useCallback(async () => {
        try {
          setLoadingAlerts(true);
          console.log("=== Fetching Alerts ===");
          const alertsData = await getAlerts({ 
            is_resolved: false,  // Only get unresolved alerts
            limit: 5  // Limit to 5 most recent alerts
          });
          setAlerts(alertsData);
        } catch (error: any) {
          console.error("=== Failed to fetch alerts ===", error);
        } finally {
          setLoadingAlerts(false);
        }
      }, []);

      // Function to refresh a specific server's metrics
      const refreshServerMetrics = useCallback(async (hostname: string) => {
        try {
          setRefreshingServer(hostname);
          console.log(`=== Refreshing metrics for server: ${hostname} ===`);
          const response: SystemMetricsResponse = await getSystemMetrics(hostname);
          
          // Update the specific server's metrics in the state
          if (response.metrics && response.metrics.length > 0) {
            setServerMetrics(prevMetrics => {
              const updatedMetrics = [...prevMetrics];
              const serverIndex = updatedMetrics.findIndex(m => m.hostname === hostname);
              
              if (serverIndex !== -1) {
                // Replace the existing server's metrics
                updatedMetrics[serverIndex] = response.metrics[0];
              } else {
                // If server not found, add it to the list
                updatedMetrics.push(response.metrics[0]);
              }
              
              return updatedMetrics;
            });
          }
        } catch (error: any) {
          console.error(`=== Failed to refresh metrics for server ${hostname} ===`, error);
        } finally {
          setRefreshingServer(null);
        }
      }, []);

      useEffect(() => {
        fetchServerMetrics();
        fetchAlerts();

        // Auto-refresh if enabled (15 minutes = 900000 ms)
        if (autoRefresh) {
          const interval = setInterval(() => {
            fetchServerMetrics();
            fetchAlerts();
          }, 900000); // Refresh every 15 minutes
          
          return () => clearInterval(interval);
        }
      }, [autoRefresh, fetchServerMetrics, fetchAlerts]);
    

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Select Server" />

      {/* <PageHeader
        title="Select Server"
        showSearch={false}
      /> */}


      <style>{`
        * {
          box-sizing: border-box;
        }
        

        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #4da6ff;
          color: white;
          border-color: #4da6ff;
        }

        .btn-primary:hover {
          background: #3d96ef;
          border-color: #3d96ef;
        }

        .btn-outline {
          background: white;
          color: #6c757d;
          border-color: #dee2e6;
        }

        .btn-outline:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }

        .btn-outline-primary {
          background: white;
          color: #4da6ff;
          border-color: #4da6ff;
        }

        .btn-outline-primary:hover {
          background: #f0f8ff;
          border-color: #3d96ef;
          color: #3d96ef;
        }

        .btn-outline-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-link {
          background: transparent;
          border: none;
          color: #4da6ff;
          padding: 4px 8px;
          text-decoration: none;
        }

        .btn-link:hover {
          text-decoration: underline;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #4da6ff;
          box-shadow: 0 0 0 3px rgba(77, 166, 255, 0.1);
        }

        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .badge-success {
          background: #28a745;
          color: white;
        }

        .badge-warning {
          background: #ffc107;
          color: #212529;
        }

        .badge-danger {
          background: #dc3545;
          color: white;
        }

        .badge-info {
          background: #17a2b8;
          color: white;
        }

        .badge-secondary {
          background: #6c757d;
          color: white;
        }

        .progress-container {
          background: #e9ecef;
          border-radius: 6px;
          height: 6px;
          overflow: hidden;
          margin-top: 6px;
        }

        .progress-bar {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease;
        }

        .metric-item {
          margin-bottom: 12px;
        }

        .metric-item:last-child {
          margin-bottom: 0;
        }

        .metric-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #495057;
          margin-bottom: 4px;
        }

        .metric-value {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
        }

        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.2s;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .list-item {
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .list-item:hover {
          background: #f8f9fa;
        }

        .list-item.active {
          background: #e7f3ff;
          color: #4da6ff;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

       

        input:checked + .slider {
          background-color: #4da6ff;
        }

        input:checked + .slider:before {
          transform: translateX(24px);
        }

        .dropdown {
          position: relative;
          display: inline-block;
          min-width: 200px;
        }

        .dropdown-toggle {
          width: 100%;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: space-between;
          background: #f1f5f9;
          padding: 10px 14px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dropdown-toggle:hover {
          background: #e2e8f0;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1000;
          display: none;
          width: 100%;
          padding: 8px 0;
          margin: 4px 0 0;
          background-color: #fff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown.show .dropdown-menu {
          display: block;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 10px 16px;
          clear: both;
          font-weight: 400;
          color: #212529;
          text-align: inherit;
          white-space: nowrap;
          background-color: transparent;
          border: 0;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
        }

        .dropdown-item.active {
          background-color: #e7f3ff;
          color: #4da6ff;
          font-weight: 500;
        }

        @media (max-width: 1200px) {
          .grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .grid-3 {
            grid-template-columns: 1fr;
          }
          
          .layout-row {
            flex-direction: column;
          }
          
         
        }
      `}</style>

      
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
         
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0
          }}>
            Select a Server
          </h2>

          <div className="d-flex gap-2 align-items-center">
            <button 
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
              onClick={async () => {
                await fetchServerMetrics();
                await fetchAlerts();
              }}
              disabled={loading || loadingAlerts}
            >
              <RefreshCw size={16} className={(loading || loadingAlerts) ? 'spinning' : ''} />
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

          {/* <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid size={18} /> Cards
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} /> List
            </button>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div> */}
        </div>

        <div className="layout-row" style={{ display: 'flex', gap: '20px' }}>
          

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            
            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {/* Environment Dropdown */}
              <div className={`dropdown ${showEnvDropdown ? 'show' : ''}`} style={{ minWidth: '220px' }}>
                <div 
                  className="dropdown-toggle"
                  onClick={() => {
                    setShowEnvDropdown(!showEnvDropdown);
                    setShowRegionDropdown(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={16} style={{ color: '#4da6ff' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEnvironment}</span>
                  </div>
                  <ChevronDown size={16} style={{ color: '#6c757d' }} />
                </div>
                <div className="dropdown-menu">
                  {environments.map((env, index) => (
                    <div
                      key={index}
                      className={`dropdown-item ${selectedEnvironment === env ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedEnvironment(env);
                        setShowEnvDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* <Server size={14} /> */}
                        <span>{env}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Region Dropdown */}
              <div className={`dropdown ${showRegionDropdown ? 'show' : ''}`} style={{ minWidth: '200px' }}>
                <div 
                  className="dropdown-toggle"
                  onClick={() => {
                    setShowRegionDropdown(!showRegionDropdown);
                    setShowEnvDropdown(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={16} style={{ color: '#4da6ff' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedRegion}</span>
                  </div>
                  <ChevronDown size={16} style={{ color: '#6c757d' }} />
                </div>
                <div className="dropdown-menu">
                  {regions.map((region, index) => (
                    <div
                      key={index}
                      className={`dropdown-item ${selectedRegion === region ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedRegion(region);
                        setShowRegionDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* <Globe size={14} /> */}
                        <span>{region}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '16px', color: '#6c757d' }}>Loading server metrics...</div>
              </div>
            ) : serverMetrics.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '16px', color: '#6c757d' }}>No server metrics available</div>
              </div>
            ) : (
              <div className="grid-3" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                {serverMetrics
                  .filter(metric => {
                    if (selectedGroup === 'all') return true;
                    const status = getServerStatus(metric);
                    return status.status === selectedGroup;
                  })
                  .map((metric, idx) => {
                    const status = getServerStatus(metric);
                    const serverIp = getServerIp(metric);
                    return (
                      <div 
                        key={idx} 
                        className="card" 
                       
                        >
                        <div style={{ padding: '16px', position: 'relative' }}>
                          {/* Refresh Button - Top Right Corner */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshServerMetrics(metric.hostname);
                            }}
                            disabled={refreshingServer === metric.hostname}
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              background: 'transparent',
                              border: 'none',
                              cursor: refreshingServer === metric.hostname ? 'not-allowed' : 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s',
                              opacity: refreshingServer === metric.hostname ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (refreshingServer !== metric.hostname) {
                                e.currentTarget.style.backgroundColor = '#f0f0f0';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Refresh server metrics"
                          >
                            <RefreshCw 
                              size={16} 
                              className={refreshingServer === metric.hostname ? 'spinning' : ''}
                              color="#6c757d"
                            />
                          </button>

                          <div style={{ marginBottom: '12px' }}>
                            <h6 style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              marginBottom: '4px',
                              color: '#1a1a1a'
                            }}>
                              {metric.hostname}
                            </h6>
                            <div style={{
                              fontSize: '12px',
                              color: '#6c757d',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Server size={12} />
                              {serverIp}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#6c757d',
                              marginTop: '4px'
                            }}>
                              OS: {metric.host.os.split('-')[0]}
                            </div>
                          </div>

                          <span 
                            className={`badge badge-${status.statusColor}`}
                            style={{ marginBottom: '16px' }}
                          >
                            {status.status}
                          </span>

                          {/* Resource Usage Progress Bars */}
                          <div style={{ marginBottom: '16px' }}>
                            {/* CPU Usage */}
                            <div className="metric-item">
                              <div className="metric-label">
                                <Cpu size={14} />
                                <span>CPU Usage</span>
                              </div>
                              <div className="metric-value">
                                <span>{metric.cpu.used_percent.toFixed(1)}%</span>
                                <span style={{ fontSize: '11px', color: '#6c757d' }}>
                                  ({metric.cpu.cores} cores)
                                </span>
                              </div>
                              <div className="progress-container">
                                <div 
                                  className="progress-bar" 
                                  style={{
                                    width: `${metric.cpu.used_percent}%`,
                                    background: metric.cpu.used_percent > 80 ? '#dc3545' : 
                                               metric.cpu.used_percent > 60 ? '#ffc107' : '#4da6ff'
                                  }}
                                />
                              </div>
                            </div>

                            {/* Memory Usage */}
                            <div className="metric-item">
                              <div className="metric-label">
                                <Activity size={14} />
                                <span>Memory</span>
                              </div>
                              <div className="metric-value">
                                <span>{metric.memory.used_gb.toFixed(2)} GB</span>
                                <span style={{ fontSize: '11px', color: '#6c757d' }}>
                                  of {metric.memory.total_gb.toFixed(2)} GB
                                </span>
                              </div>
                              <div className="progress-container">
                                <div 
                                  className="progress-bar" 
                                  style={{
                                    width: `${metric.memory.used_percent}%`,
                                    background: metric.memory.used_percent > 80 ? '#dc3545' : 
                                               metric.memory.used_percent > 60 ? '#ffc107' : '#28a745'
                                  }}
                                />
                              </div>
                            </div>

                            {/* Disk Usage */}
                            <div className="metric-item">
                              <div className="metric-label">
                                <HardDrive size={14} />
                                <span>Disk Usage</span>
                              </div>
                              <div className="metric-value">
                                <span>{metric.disk.used_percent.toFixed(1)}%</span>
                                <span style={{ 
                                  fontSize: '11px', 
                                  color: metric.disk.used_percent < 20 ? '#28a745' : '#6c757d',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}>
                                  {metric.disk.free_gb.toFixed(1)} GB free
                                </span>
                              </div>
                              <div className="progress-container">
                                <div 
                                  className="progress-bar" 
                                  style={{
                                    width: `${metric.disk.used_percent}%`,
                                    background: metric.disk.used_percent > 80 ? '#dc3545' : 
                                               metric.disk.used_percent > 60 ? '#ffc107' : '#17a2b8'
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '12px',
                            borderTop: '1px solid #e9ecef'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '13px',
                              color: status.statusColor === 'danger' ? '#dc3545' :
                                     status.statusColor === 'warning' ? '#ffc107' : '#28a745'
                            }}>
                              {getStatusIcon(status.status)}
                              {status.status}
                            </div>
                            <button className="btn btn-link"
                            onClick={() => router.push(`/pulse/application-monitoring?server=${encodeURIComponent(metric.hostname)}`)}
                      
                             style={{ fontSize: '12px' }}>
                              Open Monitoring
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ padding: '20px' }}>
                <h5 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#1a1a1a'
                }}>
                  Server Summary
                </h5>

                {(() => {
                  const filteredMetrics = serverMetrics.filter(metric => {
                    if (selectedGroup === 'all') return true;
                    const status = getServerStatus(metric);
                    return status.status === selectedGroup;
                  });
                  
                  const totalServers = filteredMetrics.length;
                  const healthyCount = filteredMetrics.filter(m => {
                    const status = getServerStatus(m);
                    return status.status === 'Healthy';
                  }).length;
                  const warningCount = filteredMetrics.filter(m => {
                    const status = getServerStatus(m);
                    return status.status === 'Warning';
                  }).length;
                  const criticalCount = filteredMetrics.filter(m => {
                    const status = getServerStatus(m);
                    return status.status === 'Critical';
                  }).length;
                  const offlineCount = 0; // No offline servers in current data
                  
                  return (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <CheckCircle size={16} color="#28a745" />
                            Healthy Servers
                          </span>
                          <div>
                            <strong style={{ fontSize: '18px' }}>{healthyCount}</strong>
                            {/* <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{totalServers > 0 ? Math.round((healthyCount / totalServers) * 100) : 0}%</span> */}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <AlertTriangle size={16} color="#ffc107" />
                            Warning Servers
                          </span>
                          <div>
                            <strong style={{ fontSize: '18px' }}>{warningCount}</strong>
                            {/* <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{totalServers > 0 ? Math.round((warningCount / totalServers) * 100) : 0}%</span> */}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <XCircle size={16} color="#dc3545" />
                            Critical Servers
                          </span>
                          <div>
                            <strong style={{ fontSize: '18px' }}>{criticalCount}</strong>
                            {/* <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{totalServers > 0 ? Math.round((criticalCount / totalServers) * 100) : 0}%</span> */}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <AlertCircle size={16} color="#6c757d" />
                            Offline Servers
                          </span>
                          <div>
                            <strong style={{ fontSize: '18px' }}>{offlineCount}</strong>
                            {/* <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{totalServers > 0 ? Math.round((offlineCount / totalServers) * 100) : 0}%</span> */}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ padding: '20px' }}>
                <h5 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#1a1a1a'
                }}>
                  Recent Alerts
                </h5>

                <div>
                  {loadingAlerts ? (
                    <div style={{ 
                      padding: '20px', 
                      textAlign: 'center', 
                      color: '#6c757d',
                      fontSize: '14px'
                    }}>
                      Loading alerts...
                    </div>
                  ) : alerts.length === 0 ? (
                    <div style={{ 
                      padding: '20px', 
                      textAlign: 'center', 
                      color: '#6c757d',
                      fontSize: '14px'
                    }}>
                      No alerts at this time
                    </div>
                  ) : (
                    alerts.map((alert: Alert, idx: number) => {
                      // Map severity to color
                      const getSeverityColor = (severity: string): string => {
                        switch (severity) {
                          case 'CRITICAL':
                            return 'danger';
                          case 'HIGH':
                            return 'danger';
                          case 'MEDIUM':
                            return 'warning';
                          case 'LOW':
                            return 'info';
                          default:
                            return 'secondary';
                        }
                      };

                      // Map severity to icon
                      const getSeverityIcon = (severity: string) => {
                        if (severity === 'CRITICAL' || severity === 'HIGH') {
                          return <XCircle size={14} color="#dc3545" />;
                        } else if (severity === 'MEDIUM') {
                          return <AlertTriangle size={14} color="#ffc107" />;
                        } else {
                          return <AlertCircle size={14} color="#17a2b8" />;
                        }
                      };

                      const severityColor = getSeverityColor(alert.severity);
                      const displayName = alert.hostname || alert.customer_name || `Device ${alert.device_id}`;
                      const displayInfo = alert.service_name || alert.message || alert.alert_type;

                      return (
                        <div 
                          key={alert.id}
                          style={{
                            padding: '12px 0',
                            borderBottom: idx < alerts.length - 1 ? '1px solid #e9ecef' : 'none'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '4px'
                              }}>
                                {getSeverityIcon(alert.severity)}
                                <span style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#1a1a1a'
                                }}>
                                  {displayName}
                                </span>
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#6c757d',
                                paddingLeft: '20px'
                              }}>
                                {displayInfo}
                              </div>
                            </div>
                            <span 
                              className={`badge badge-${severityColor}`}
                              style={{ fontSize: '11px' }}
                            >
                              {alert.severity}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontWeight: '600',
                justifyContent: 'center',
                fontSize: '15px'
              }}
              onClick={() => router.push(`/pulse/application-monitoring`)}
            >
              Open Monitoring <ChevronRight size={20} />
            </button>
          </div>
        </div>
     
 

    </React.Fragment>
  );
};

SelectServer.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SelectServer;
