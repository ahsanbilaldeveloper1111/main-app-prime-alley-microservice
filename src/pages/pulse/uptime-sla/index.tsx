import '@assets/scss/datatable-style.scss';
import '@assets/scss/common.scss';
import '@assets/scss/report-style.scss';
import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Row, Col } from 'react-bootstrap';
import StatsCards, { StatsCardData } from '@components/GenericStatsCards';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Summary {
  overall_uptime: number;
  total_monitored: number;
  sla_compliant: number;
  sla_violations: number;
}

interface UptimeTrendPoint {
  date: string;
  deviceUptime: number;
  serviceUptime: number;
}

interface UptimeRow {
  name: string;
  uptime: number;
  target: number;
  slaStatus: 'met' | 'miss';
}

interface AttentionItem {
  name: string;
  percentage: number;
  status: string;
  type: 'device' | 'service';
  icon: string;
}

const UptimeSLAMonitoring = () => {
  const summary: Summary = {
    overall_uptime: 97.61,
    total_monitored: 66,
    sla_compliant: 81,
    sla_violations: 19,
  };

  // Create cards data for GenericStatsCards
  const summaryCards: StatsCardData[] = [
    {
      title: 'Overall Uptime',
      value: `${summary.overall_uptime}%`,
      subtitle: 'System-wide uptime percentage',
    },
    {
      title: 'Total Monitored',
      value: summary.total_monitored,
      subtitle: 'Total devices and services monitored',
    },
    {
      title: 'SLA Compliant',
      value: `${summary.sla_compliant}%`,
      subtitle: 'Services meeting SLA requirements',
    },
    {
      title: 'SLA Violations',
      value: `${summary.sla_violations}%`,
      subtitle: 'Services with SLA violations',
    },
  ];

  // Generate mock data for the last 30 days
  const generateUptimeData = (): UptimeTrendPoint[] => {
    const data: UptimeTrendPoint[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic uptime data with some variation
      const deviceUptime = 95 + Math.random() * 5; // 95-100%
      const serviceUptime = 90 + Math.random() * 8; // 90-98%
      
      data.push({
        date: date.toISOString().split('T')[0],
        deviceUptime: Math.round(deviceUptime * 100) / 100,
        serviceUptime: Math.round(serviceUptime * 100) / 100,
      });
    }
    
    return data;
  };

  const uptimeData = generateUptimeData();

  // Line chart configuration for uptime trends
  const lineChartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: ['#00B8D9', '#FF6B6B'],
    xaxis: {
      categories: uptimeData.map((item) => item.date),
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Uptime Percentage (%)',
      },
      min: 80,
      max: 100,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
    },
    grid: {
      borderColor: '#f1f1f1',
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value}%`,
      },
    },
  };

  const lineChartSeries = [
    {
      name: 'Device Uptime',
      data: uptimeData.map((item) => item.deviceUptime),
    },
    {
      name: 'Service Uptime',
      data: uptimeData.map((item) => item.serviceUptime),
    },
  ];

  // Doughnut chart configuration for SLA compliance
  const doughnutChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
    },
    colors: ['#00B8D9', '#FF6B6B'],
    labels: ['SLA Compliant', 'SLA Non-Compliant'],
    legend: {
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}%`,
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value}%`,
      },
    },
  };

  const doughnutChartSeries = [summary.sla_compliant, summary.sla_violations];

  // Mock data for device and service uptime sections
  const deviceUptimeData: UptimeRow[] = [
    { name: 'router-01', uptime: 99.8, target: 99.9, slaStatus: 'miss' },
    { name: 'switch-01', uptime: 99.5, target: 99.9, slaStatus: 'miss' },
    { name: 'server-01', uptime: 98.2, target: 99.9, slaStatus: 'miss' },
  ];

  const serviceUptimeData: UptimeRow[] = [
    { name: 'Web API (server-01)', uptime: 99.9, target: 99.9, slaStatus: 'met' },
    { name: 'Database (server-02)', uptime: 97.5, target: 99.5, slaStatus: 'miss' },
    { name: 'Monitoring (server-03)', uptime: 99.1, target: 99, slaStatus: 'met' },
  ];

  const getProgressBarColor = (uptime: number, target: number) => {
    if (uptime >= target) return 'success';
    if (uptime >= target - 1) return 'warning';
    return 'danger';
  };

  const getSlaStatusColor = (status: string) => {
    return status === 'met' ? 'success' : 'warning';
  };

  const getSlaStatusText = (status: string) => {
    return status === 'met' ? 'SLA Met' : 'SLA Miss';
  };

  // Mock data for attention required section
  const attentionRequiredData: AttentionItem[] = [
    { 
      name: 'server-01', 
      percentage: 95.2, 
      status: 'Frequent restarts',
      type: 'device',
      icon: 'ph-duotone ph-stack'
    },
    { 
      name: 'Payment API', 
      percentage: 94.8, 
      status: 'Database timeouts',
      type: 'service',
      icon: 'ph-duotone ph-gear'
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Pulse"
        mainLink="/pulse/dashboard"
        subTitle="Uptime & SLA Monitoring"
      />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={12}>
                <h4 className="mb-0">Uptime & SLA Monitoring</h4>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <StatsCards data={summaryCards} />

      <Row className="mt-4">
        <Col lg={8} md={12}>
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Uptime Trends (Last 30 Days)</h5>
            </div>
            <div className="card-body">
              <ReactApexChart
                options={lineChartOptions}
                series={lineChartSeries}
                type="line"
                height={350}
              />
            </div>
          </div>
        </Col>
        <Col lg={4} md={12} className="mt-4 mt-lg-0">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">SLA Compliance</h5>
            </div>
            <div className="card-body">
              <ReactApexChart
                options={doughnutChartOptions}
                series={doughnutChartSeries}
                type="donut"
                height={350}
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* Device and Service Uptime Sections */}
      <Row className="mt-4">
        <Col xl={6} md={12}>
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ph-duotone ph-server me-2"></i>
                {' '}
                Device Uptime
              </h5>
            </div>
            <div className="card-body uptime-list-body">
              {deviceUptimeData.map((device) => (
                <div key={device.name} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2 uptime-item-header">
                    <span className="fw-medium">{device.name}</span>
                    <div className="d-flex gap-2">
                      <span className={`badge bg-${getSlaStatusColor(device.slaStatus)}`}>
                        {getSlaStatusText(device.slaStatus)}
                      </span>
                      <i className="ph-duotone ph-chart-line text-muted"></i>
                    </div>
                  </div>
                  <progress
                    className={`w-100 mb-1 text-${getProgressBarColor(device.uptime, device.target)}`}
                    value={device.uptime}
                    max={100}
                    style={{ height: '8px' }}
                  />
                  <div className="d-flex justify-content-between">
                    <small className="text-muted">{device.uptime}%</small>
                    <small className="text-primary">Target: {device.target}%</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
        <Col xl={6} md={12} className="mt-4 mt-xl-0">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ph-duotone ph-gear me-2"></i>
                {' '}
                Service Uptime
              </h5>
            </div>
            <div className="card-body uptime-list-body">
              {serviceUptimeData.map((service) => (
                <div key={service.name} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2 uptime-item-header">
                    <span className="fw-medium">{service.name}</span>
                    <div className="d-flex gap-2">
                      <span className={`badge bg-${getSlaStatusColor(service.slaStatus)}`}>
                        {getSlaStatusText(service.slaStatus)}
                      </span>
                      <i className="ph-duotone ph-chart-line text-muted"></i>
                    </div>
                  </div>
                  <progress
                    className={`w-100 mb-1 text-${getProgressBarColor(service.uptime, service.target)}`}
                    value={service.uptime}
                    max={100}
                    style={{ height: '8px' }}
                  />
                  <div className="d-flex justify-content-between">
                    <small className="text-muted">{service.uptime}%</small>
                    <small className="text-primary">Target: {service.target}%</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      {/* Attention Required Section */}
      <Row className="mt-4">
        <Col md={12}>
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ph-duotone ph-warning-circle me-2"></i>
                {' '}
                Attention Required
              </h5>
            </div>
            <div className="card-body">
              {attentionRequiredData.map((item) => (
                <div key={`${item.type}-${item.name}`} className="alert-item mb-3 p-3 border border-warning rounded bg-warning bg-opacity-10">
                  <div className="d-flex justify-content-between align-items-center alert-item-row">
                    <div className="d-flex align-items-center">
                      <i className={`${item.icon} me-3 text-warning`} style={{ fontSize: '1.2rem' }}></i>
                      <span className="text-dark fw-medium">{item.name}</span>
                    </div>
                    <div className="d-flex align-items-center gap-3 alert-item-meta">
                      <span className="badge bg-warning text-dark px-3 py-2 rounded">
                        {item.percentage}%
                      </span>
                      <span className="text-dark">{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      <style jsx global>{`
        .uptime-list-body {
          overflow-x: hidden;
        }

        @media (max-width: 991.98px) {
          .uptime-item-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 8px;
          }

          .alert-item-row {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 10px;
          }

          .alert-item-meta {
            width: 100%;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px !important;
          }
        }

        @media (max-width: 767.98px) {
          .uptime-list-body {
            padding: 14px;
          }

          .alert-item {
            padding: 12px !important;
          }

          .alert-item .badge {
            padding: 6px 10px !important;
          }
        }
      `}</style>
    </React.Fragment>
  );
};

UptimeSLAMonitoring.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default UptimeSLAMonitoring;
