import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { useRouter } from 'next/router';
import { getSystemMetrics, getAlerts, SystemMetric, SystemMetricsResponse, Alert } from "@utils/netops";
import { 
  Server, 
  Globe, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Cpu,
  HardDrive,
  Activity,
  RefreshCw
} from 'lucide-react';
import { Form } from 'react-bootstrap';

type SeverityBadgeColor = 'danger' | 'warning' | 'info' | 'secondary';

type NetworkLike = {
  interface: string;
  is_up: boolean;
  ip?: string;
};

type AlertResponseLike = {
  alerts?: Alert[];
};

const getSeverityColor = (severity: string): SeverityBadgeColor => {
  switch (severity) {
    case 'CRITICAL':
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

const getSeverityIcon = (severity: string) => {
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    return <XCircle size={14} color="#dc3545" />;
  }
  if (severity === 'MEDIUM') {
    return <AlertTriangle size={14} color="#ffc107" />;
  }
  return <AlertCircle size={14} color="#17a2b8" />;
};

const getAlertDisplayName = (alert: Alert): string =>
  alert.hostname || alert.customer_name || `Device ${alert.device_id}`;

const getAlertDisplayInfo = (alert: Alert): string =>
  alert.service_name || alert.message || alert.alert_type;

const getServerStatusColorHex = (statusColor: string): string => {
  if (statusColor === 'danger') {
    return '#dc3545';
  }
  if (statusColor === 'warning') {
    return '#ffc107';
  }
  return '#28a745';
};

const getUsageBarColor = (usedPercent: number, healthyColor: string): string => {
  if (usedPercent > 80) {
    return '#dc3545';
  }
  if (usedPercent > 60) {
    return '#ffc107';
  }
  return healthyColor;
};

const SelectServer = () => {
      const router = useRouter();
      const selectedGroup = 'all';
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
        const mainInterface = metric.network.find((n: NetworkLike) => n.interface !== 'lo' && n.is_up);
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
    
      // Fetch server metrics on component mount
      const fetchServerMetrics = useCallback(async () => {
        try {
          setLoading(true);
          console.log("=== Fetching System Metrics ===");
          const response: SystemMetricsResponse = await getSystemMetrics("all");
          setServerMetrics(response.metrics);
        } catch (error: unknown) {
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
          setAlerts(((alertsData as AlertResponseLike)?.alerts ?? []));
        } catch (error: unknown) {
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

              if (serverIndex === -1) {
                // If server not found, add it to the list.
                updatedMetrics.push(response.metrics[0]);
                return updatedMetrics;
              }

              // Replace the existing server's metrics.
              updatedMetrics[serverIndex] = response.metrics[0];
              return updatedMetrics;
            });
          }
        } catch (error: unknown) {
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

      const filteredServerMetrics = useMemo(
        () =>
          serverMetrics.filter((metric) => {
            if (selectedGroup === 'all') {
              return true;
            }
            const status = getServerStatus(metric);
            return status.status === selectedGroup;
          }),
        [serverMetrics, selectedGroup]
      );

      const serverCounts = useMemo(() => {
        const totalServers = filteredServerMetrics.length;
        const healthyCount = filteredServerMetrics.filter((metric) => getServerStatus(metric).status === 'Healthy').length;
        const warningCount = filteredServerMetrics.filter((metric) => getServerStatus(metric).status === 'Warning').length;
        const criticalCount = filteredServerMetrics.filter((metric) => getServerStatus(metric).status === 'Critical').length;
        return {
          totalServers,
          healthyCount,
          warningCount,
          criticalCount,
          offlineCount: 0,
        };
      }, [filteredServerMetrics]);

      const serverMetricsContent = (() => {
        if (loading) {
          return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '16px', color: '#6c757d' }}>Loading server metrics...</div>
            </div>
          );
        }

        if (serverMetrics.length === 0) {
          return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '16px', color: '#6c757d' }}>No server metrics available</div>
            </div>
          );
        }

        return (
          <div className="grid-3">
            {filteredServerMetrics.map((metric) => {
              const status = getServerStatus(metric);
              const serverIp = getServerIp(metric);
              const statusColor = getServerStatusColorHex(status.statusColor);

              return (
                <div key={metric.hostname} className="card">
                  <div style={{ padding: '16px', position: 'relative' }}>
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
                        opacity: refreshingServer === metric.hostname ? 0.6 : 1,
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
                      <h6
                        style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          marginBottom: '4px',
                          color: '#1a1a1a',
                        }}
                      >
                        {metric.hostname}
                      </h6>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6c757d',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Server size={12} />
                        {serverIp}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#6c757d',
                          marginTop: '4px',
                        }}
                      >
                        OS: {metric.host.os.split('-')[0]}
                      </div>
                    </div>

                    <span className={`badge badge-${status.statusColor}`} style={{ marginBottom: '16px' }}>
                      {status.status}
                    </span>

                    <div style={{ marginBottom: '16px' }}>
                      <div className="metric-item">
                        <div className="metric-label">
                          <Cpu size={14} />
                          <span>CPU Usage</span>
                        </div>
                        <div className="metric-value">
                          <span>{metric.cpu.used_percent.toFixed(1)}%</span>
                          <span style={{ fontSize: '11px', color: '#6c757d' }}>({metric.cpu.cores} cores)</span>
                        </div>
                        <div className="progress-container">
                          <div
                            className="progress-bar"
                            style={{
                              width: `${metric.cpu.used_percent}%`,
                              background: getUsageBarColor(metric.cpu.used_percent, '#4da6ff'),
                            }}
                          />
                        </div>
                      </div>

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
                              background: getUsageBarColor(metric.memory.used_percent, '#28a745'),
                            }}
                          />
                        </div>
                      </div>

                      <div className="metric-item">
                        <div className="metric-label">
                          <HardDrive size={14} />
                          <span>Disk Usage</span>
                        </div>
                        <div className="metric-value">
                          <span>{metric.disk.used_percent.toFixed(1)}%</span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: metric.disk.used_percent < 20 ? '#28a745' : '#6c757d',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            {metric.disk.free_gb.toFixed(1)} GB free
                          </span>
                        </div>
                        <div className="progress-container">
                          <div
                            className="progress-bar"
                            style={{
                              width: `${metric.disk.used_percent}%`,
                              background: getUsageBarColor(metric.disk.used_percent, '#17a2b8'),
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid #e9ecef',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          color: statusColor,
                        }}
                      >
                        {getStatusIcon(status.status)}
                        {status.status}
                      </div>
                      <button
                        className="btn btn-link"
                        onClick={() =>
                          router.push(`/pulse/application-monitoring?server=${encodeURIComponent(metric.hostname)}`)
                        }
                        style={{ fontSize: '12px' }}
                      >
                        Open Monitoring
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })();

      const alertsContent = (() => {
        if (loadingAlerts) {
          return (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '14px',
              }}
            >
              Loading alerts...
            </div>
          );
        }

        if (alerts.length === 0) {
          return (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '14px',
              }}
            >
              No alerts at this time
            </div>
          );
        }

        return alerts.map((alert: Alert, idx: number) => {
          const severityColor = getSeverityColor(alert.severity);
          const displayName = getAlertDisplayName(alert);
          const displayInfo = getAlertDisplayInfo(alert);

          return (
            <div
              key={alert.id}
              style={{
                padding: '12px 0',
                borderBottom: idx < alerts.length - 1 ? '1px solid #e9ecef' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    {getSeverityIcon(alert.severity)}
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1a1a1a',
                      }}
                    >
                      {displayName}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6c757d',
                      paddingLeft: '20px',
                    }}
                  >
                    {displayInfo}
                  </div>
                </div>
                <span className={`badge badge-${severityColor}`} style={{ fontSize: '11px' }}>
                  {alert.severity}
                </span>
              </div>
            </div>
          );
        });
      })();
    

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

        .layout-row {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .main-content-pane {
          flex: 1;
          min-width: 0;
        }

        .right-sidebar {
          width: 280px;
          flex-shrink: 0;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .filters-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .filters-row .dropdown {
          min-width: 220px;
        }

        .server-filter-toggle {
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
          color: inherit;
        }

        .server-filter-toggle:hover {
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

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .grid-3 .card {
          min-width: 0;
        }

        @media (max-width: 1400px) {
          .grid-3 {
            grid-template-columns: repeat(2, minmax(280px, 1fr));
          }
        }

        @media (max-width: 1200px) {
          .grid-3 {
            grid-template-columns: repeat(2, minmax(260px, 1fr));
          }

          .right-sidebar {
            width: 240px;
          }
        }

        @media (max-width: 1100px) {
          .grid-3 {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 992px) {
          .layout-row {
            flex-direction: column;
          }

          .main-content-pane {
            width: 100%;
          }

          .grid-3 {
            width: 100%;
          }

          .right-sidebar {
            width: 100%;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
            flex-wrap: wrap;
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
          
          .filters-row .dropdown {
            min-width: 100%;
          }

          .header-row h2 {
            font-size: 22px !important;
          }

        }

        @media (max-width: 576px) {
          .metric-value {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      
        {/* Header */}
        <div className="header-row">
          <h4 style={{
            
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0
          }}>
            Select a Server
          </h4>

          <div className="d-flex gap-2 align-items-center header-actions">
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
        </div>

        <div className="layout-row">
          

          {/* Main Content */}
          <div className="main-content-pane">
            
            {/* Filter Dropdowns */}
            <div className="filters-row">
              {/* Environment Dropdown */}
              <div className={`dropdown ${showEnvDropdown ? 'show' : ''}`}>
                <button
                  type="button"
                  className="server-filter-toggle"
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
                </button>
                <div className="dropdown-menu">
                  {environments.map((env) => (
                    <button
                      type="button"
                      key={env}
                      className={`dropdown-item ${selectedEnvironment === env ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedEnvironment(env);
                        setShowEnvDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{env}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Region Dropdown */}
              <div className={`dropdown ${showRegionDropdown ? 'show' : ''}`}>
                <button
                  type="button"
                  className="server-filter-toggle"
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
                </button>
                <div className="dropdown-menu">
                  {regions.map((region) => (
                    <button
                      type="button"
                      key={region}
                      className={`dropdown-item ${selectedRegion === region ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedRegion(region);
                        setShowRegionDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{region}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {serverMetricsContent}
          </div>

          {/* Right Sidebar */}
          <div className="right-sidebar">
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

                {
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
                            <strong style={{ fontSize: '18px' }}>{serverCounts.healthyCount}</strong>
                            {/* <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{serverCounts.totalServers > 0 ? Math.round((serverCounts.healthyCount / serverCounts.totalServers) * 100) : 0}%</span> */}
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
                            <strong style={{ fontSize: '18px' }}>{serverCounts.warningCount}</strong>
                            {/* <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{serverCounts.totalServers > 0 ? Math.round((serverCounts.warningCount / serverCounts.totalServers) * 100) : 0}%</span> */}
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
                            <strong style={{ fontSize: '18px' }}>{serverCounts.criticalCount}</strong>
                            {/* <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{serverCounts.totalServers > 0 ? Math.round((serverCounts.criticalCount / serverCounts.totalServers) * 100) : 0}%</span> */}
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
                            <strong style={{ fontSize: '18px' }}>{serverCounts.offlineCount}</strong>
                            {/* <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{serverCounts.totalServers > 0 ? Math.round((serverCounts.offlineCount / serverCounts.totalServers) * 100) : 0}%</span> */}
                          </div>
                        </div>
                      </div>
                  </>
                }
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

                <div>{alertsContent}</div>
              </div>
            </div>

            <button 
              className="btn"
              style={{
                width: '100%',
                padding: '12px',
                fontWeight: '600',
                justifyContent: 'center',
                fontSize: '15px',
                background: '#141414',
                color: '#ffffff',
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
