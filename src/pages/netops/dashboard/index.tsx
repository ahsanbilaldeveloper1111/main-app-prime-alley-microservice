import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Button, Modal, Row, Tab, Tabs } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import AnimatedNumber from '@components/AnimatedNumber';
import EmptyState from '@components/EmptyState';
import { formatDateTimeToLocal, GlobalDateTimeFormat } from '@utils/Helper';
import '@assets/scss/common.scss';
import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import moment from 'moment';
import Link from 'next/link';
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { motion } from 'framer-motion';

// NetOps API imports
import { 
  getComprehensiveMonitoring, 
  getMonitoringDashboard, 
  getDevices, 
  getServices, 
  getAlerts,
  ComprehensiveMonitoringResponse,
  MonitoringDashboardResponse,
  Device,
  Service,
  Alert,
  DeviceStatus,
  MonitoringSummary,
  AlertsSummary
} from '@utils/netops';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface NetOpsDashboardState {
  comprehensiveData: ComprehensiveMonitoringResponse | null;
  dashboardData: MonitoringDashboardResponse | null;
  devices: Device[];
  services: Service[];
  loading: boolean;
  lastUpdated: string;
}

const NetOpsDashboard = () => {
  const { data: session, status } = useSession();
  const [state, setState] = useState<NetOpsDashboardState>({
    comprehensiveData: null,
    dashboardData: null,
    devices: [],
    services: [],
    loading: false,
    lastUpdated: ''
  });

  const [showServiceModal, setShowServiceModal] = useState(false);

  // Create summary cards for PageSummaryGrid
  const summaryCards: SummaryCard[] = [
    {
      id: 'total-devices',
      title: 'Total Devices',
      value: state.dashboardData?.total_devices || 0,
      description: 'Total devices in the system',
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'devices-up',
      title: 'Devices Online',
      value: state.dashboardData?.devices_up || 0,
      description: 'Devices currently online',
      delay: 0.3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'devices-down',
      title: 'Devices Offline',
      value: state.dashboardData?.devices_down || 0,
      description: 'Devices currently offline',
      delay: 0.5,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'total-services',
      title: 'Total Services',
      value: state.comprehensiveData?.summary?.total_services || 0,
      description: 'Total services monitored',
      delay: 0.7,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'services-up',
      title: 'Services Up',
      value: state.comprehensiveData?.summary?.services_up || 0,
      description: 'Services currently running',
      delay: 0.9,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'services-down',
      title: 'Services Down',
      value: state.comprehensiveData?.summary?.services_down || 0,
      description: 'Services currently down',
      delay: 1.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'active-alerts',
      title: 'Active Alerts',
      value: state.dashboardData?.active_alerts || 0,
      description: 'Currently active alerts',
      delay: 1.3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'avg-uptime',
      title: 'Avg Uptime',
      value: state.comprehensiveData?.summary?.average_uptime || 0,
      description: 'Average system uptime',
      delay: 1.5,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2',
      suffix: '%'
    }
  ];

  // Chart states
  const [deviceStatusChart, setDeviceStatusChart] = useState({
    series: [0, 0] as number[],
    options: {
      chart: {
        type: 'donut' as const,
        toolbar: { show: false }
      },
      labels: ['Online', 'Offline'],
      colors: ['#28a745', '#dc3545'],
      legend: {
        position: 'bottom' as const
      },
      dataLabels: {
        enabled: false
      }
    }
  });

  const [serviceStatusChart, setServiceStatusChart] = useState({
    series: [0, 0] as number[],
    options: {
      chart: {
        type: 'donut' as const,
        toolbar: { show: false }
      },
      labels: ['Up', 'Down'],
      colors: ['#28a745', '#dc3545'],
      legend: {
        position: 'bottom' as const
      },
      dataLabels: {
        enabled: false
      }
    }
  });



  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    NProgress.start();

    try {
      // Fetch data with limits for dashboard performance
      // Only fetch what we need for the dashboard display
      const [comprehensiveData, dashboardData, devices, services] = await Promise.all([
        getComprehensiveMonitoring({ limit: 20 }), // Limit to 20 devices for dashboard overview
        getMonitoringDashboard(),
        getDevices({ limit: 10 }), // Limit to 10 devices for device status table
        getServices({ limit: 10 }) // Limit to 10 services for service status table
      ]);

      setState(prev => ({
        ...prev,
        comprehensiveData,
        dashboardData,
        devices,
        services,
        lastUpdated: moment().format('YYYY-MM-DD HH:mm:ss')
      }));

      // Update charts with new data
      updateCharts(comprehensiveData, dashboardData);
    } catch (error) {
      console.error('Failed to fetch NetOps data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
      NProgress.done();
    }
  };

  const updateCharts = (comprehensiveData: ComprehensiveMonitoringResponse, dashboardData: MonitoringDashboardResponse) => {
    
    // Safety checks
    if (!comprehensiveData || !comprehensiveData.summary) {
      console.warn("Invalid comprehensive data received");
      return;
    }

    if (!dashboardData || !dashboardData.devices_up) {
      console.warn("Invalid dashboard data received");
      return;
    }
    
    // Device Status Chart - Use dashboard API data
    const onlineDevices = Number(dashboardData.devices_up) || 0;
    const offlineDevices = Number(dashboardData.devices_down) || 0;
    setDeviceStatusChart(prev => ({
      ...prev,
      series: [onlineDevices, offlineDevices]
    }));

    // Service Status Chart - Calculate from comprehensive data
    const upServices = Number(comprehensiveData.summary.services_up) || 0;
    const downServices = Number(comprehensiveData.summary.services_down) || 0;
    
    setServiceStatusChart(prev => ({
      ...prev,
      series: [upServices, downServices]
    }));


    // Device Uptime Chart removed - using data from APIs directly
  };

  const refreshData = async () => {
    await fetchAllData();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'UP' ? 'success' : 'danger';
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="NetOps" mainLink="/netops/dashboard" subTitle="Network Operations Dashboard" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={8}>
                <h2 className="mb-0">Network Operations Dashboard</h2>
              </Col>
              <Col md={4} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <div className="d-flex align-items-center gap-2">
                    {state.lastUpdated && (
                      <>
                        <p className="mb-0">
                          Last Updated: <span className="status-badge primary">{state.lastUpdated}</span>
                        </p>
                        <i className="material-icons-two-tone" style={{cursor: 'pointer'}} onClick={() => refreshData()}>refresh</i>
                      </>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Summary Cards */}
      <PageSummaryGrid cards={summaryCards} />

      {/* Charts Row */}
      <Row>
        <Col md={3}>
          <div className="card">
            <div className="card-body">
              <h5 className="mb-0 app-title-heading">Device Status</h5>
              {state.loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <ReactApexChart 
                  key={`device-status-${deviceStatusChart.series.join('-')}`}
                  options={deviceStatusChart.options as ApexOptions} 
                  series={deviceStatusChart.series} 
                  type="donut" 
                  height={200} 
                />
              )}
            </div>
          </div>
        </Col>

        <Col md={3}>
          <div className="card">
            <div className="card-body">
              <h5 className="mb-0 app-title-heading">Service Status</h5>
              {state.loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <ReactApexChart 
                  key={`service-status-${serviceStatusChart.series.join('-')}`}
                  options={serviceStatusChart.options as ApexOptions} 
                  series={serviceStatusChart.series} 
                  type="donut" 
                  height={200} 
                />
              )}
            </div>
          </div>
        </Col>

        <Col md={6}>
          <div className="card">
            <div className="card-body">
              <h5 className="mb-0 app-title-heading">Alert Summary</h5>
              {state.loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped table-sm">
                    <thead>
                      <tr>
                        <th>Severity</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.comprehensiveData?.alerts_summary ? (
                        Object.entries(state.comprehensiveData.alerts_summary.alerts_by_severity).map(([severity, count]) => {
                          const total = state.comprehensiveData?.alerts_summary?.total_alerts || 0;
                          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={severity}>
                              <td>
                                <span className={`badge bg-${getSeverityColor(severity.toUpperCase())}`}>
                                  {severity.toUpperCase()}
                                </span>
                              </td>
                              <td>{count}</td>
                              <td>{percentage}%</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center">No alert data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>


      {/* Data Tables */}
      <Row className="mt-3">
        <Col md={6}>
          <div className="card">
            <div className="card-body">
              <h5 className="mb-0 app-title-heading mb-3">Recent Alerts</h5>
              {(() => {
                // Collect all alerts from devices
                const allAlerts = state.comprehensiveData?.devices?.flatMap(device => 
                  device.services?.flatMap(service => service.alerts || []) || []
                ) || [];
                
                // Sort by creation date (newest first) and take first 5
                const recentAlerts = allAlerts
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5);

                return recentAlerts.length === 0 ? (
                  <EmptyState
                    title="No Alerts"
                    description="No alerts found in the system."
                    className="table-empty-state"
                  />
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped table-sm">
                      <thead>
                        <tr>
                          <th>Severity</th>
                          <th>Type</th>
                          <th>Device</th>
                          <th>Message</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentAlerts.map((alert, index) => (
                          <tr key={index}>
                            <td>
                              <span className={`badge bg-${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                            </td>
                            <td>{alert.alert_type}</td>
                            <td>{alert.hostname}</td>
                            <td className="text-truncate" style={{ maxWidth: '200px' }} title={alert.message}>
                              {alert.message}
                            </td>
                            <td>{moment(alert.created_at).format('MM/DD HH:mm')}</td>
                            <td>
                              <span className={`badge bg-${alert.is_resolved ? 'success' : 'warning'}`}>
                                {alert.is_resolved ? 'Resolved' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-center">
                      <Link href="/netops/alerts" className="link-primary">View All Alerts</Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Col>

        <Col md={6}>
          <div className="card">
            <div className="card-body">
              <h5 className="mb-0 app-title-heading mb-3">Device Status Overview</h5>
              {state.comprehensiveData?.devices.length === 0 ? (
                <EmptyState
                  title="No Devices"
                  description="No devices found in the system."
                  className="table-empty-state"
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped table-sm">
                    <thead>
                      <tr>
                        <th>Hostname</th>
                        <th>IP Address</th>
                        <th>Status</th>
                        <th>Uptime</th>
                        <th>Services</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.comprehensiveData?.devices.slice(0, 5).map((device, index) => (
                        <tr key={index}>
                          <td>{device.hostname}</td>
                          <td>{device.ip_address}</td>
                          <td>
                            <span className={`badge bg-${getStatusBadge(device.status)}`}>
                              {device.status}
                            </span>
                          </td>
                          <td>{device.uptime_percentage.toFixed(1)}%</td>
                          <td>
                            <span className="badge bg-info">
                              {device.service_summary.services_up}/{device.service_summary.total_services}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-center">
                    <Link href="/netops/devices" className="link-primary">View All Devices</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Modals */}


      {/* Service Modal */}
      <Modal 
        show={showServiceModal} 
        onHide={() => setShowServiceModal(false)}
        size="xl"
        centered
        className="chart-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Service Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="chart-container" style={{ minHeight: '500px' }}>
            <ReactApexChart 
              key={`modal-service-status-${serviceStatusChart.series.join('-')}`}
              options={{
                ...serviceStatusChart.options as ApexOptions,
                chart: {
                  ...serviceStatusChart.options.chart,
                  height: 500,
                  toolbar: { show: true }
                }
              }} 
              series={serviceStatusChart.series} 
              type="donut" 
              height={500} 
            />
          </div>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

NetOpsDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default NetOpsDashboard;
