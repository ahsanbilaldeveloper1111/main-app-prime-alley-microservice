import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { getDashboardData } from '@utils/GsmAssign';
import { Button, Modal, Row, Col, Card, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import AnimatedNumber from '@components/AnimatedNumber';
import EmptyState from '@components/EmptyState';
import { formatDateTimeToLocal, GlobalDateTimeFormat } from '@utils/Helper';
import '@assets/scss/common.scss';
import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import moment from 'moment';
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { motion } from 'framer-motion';

// Import ApexCharts
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DashboardData {
  total_gsm: number;
  total_company: number;
  total_port: number;
  used_port: number;
  inbox: number;
  gsm_assignment: GsmAssignment[];
  inbox_list: InboxMessage[];
  profilling: CompanyProfile[];
  gsm_ports_chart: GsmPortsChart;
}

interface GsmAssignment {
  id: number;
  device_status: string;
  company_name: string;
  gsm_name: string;
  gsm_ip: string;
  assigned_ports_data: AssignedPort[];
  total_ports: number;
  assigned_ports_count: number;
  unassigned_ports_count: number;
}

interface AssignedPort {
  port_number: string;
  status: string;
}

interface InboxMessage {
  ip_address: string;
  message: string;
  created_at: string;
  port_number: string;
  mobile_number: string;
}

interface CompanyProfile {
  company: string;
  gsm_count: number;
  port_count: number;
}

interface GsmPortsChart {
  used_ports: number[];
  free_ports: number[];
  gsm_names: string[];
}

const GsmDashboard = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [showGsmAssignmentModal, setShowGsmAssignmentModal] = useState(false);

  // Create cards data for PageSummaryGrid
  const summaryCards: SummaryCard[] = [
    {
      id: 'total-gsm',
      title: 'Total GSM Devices',
      value: dashboardData?.total_gsm || 0,
      description: 'Total GSM devices in the system',
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'total-companies',
      title: 'Total Companies',
      value: dashboardData?.total_company || 0,
      description: 'Total companies using GSM services',
      delay: 0.3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'total-ports',
      title: 'Total Ports',
      value: dashboardData?.total_port || 0,
      description: 'Total available ports across all GSM devices',
      delay: 0.5,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'used-ports',
      title: 'Used Ports',
      value: dashboardData?.used_port || 0,
      description: 'Currently used ports',
      delay: 0.7,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'inbox-messages',
      title: 'Inbox Messages',
      value: dashboardData?.inbox || 0,
      description: 'Total inbox messages',
      delay: 0.9,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'free-ports',
      title: 'Free Ports',
      value: (dashboardData?.total_port || 0) - (dashboardData?.used_port || 0),
      description: 'Available free ports',
      delay: 1.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    }
  ];

  // Company profiling chart
  const [companyChart, setCompanyChart] = useState({
    series: [{
      name: 'GSM Count',
      data: [] as number[]
    }, {
      name: 'Port Count',
      data: [] as number[]
    }],
    options: {
      chart: {
        type: 'bar' as const,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          borderRadiusApplication: 'end',
          horizontal: true,
          columnHeight: '2px',
        }
      },
      legend: {
        show: true,
        position: 'bottom'
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: [] as string[],
        labels: {
          show: true,
          style: {
            fontSize: '11px',
            colors: '#666'
          }
        }
      },
      yaxis: {
        show: true,
        title: {
          text: 'Count',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#263238'
          }
        }
      }
    }
  });

  // GSM ports chart
  const [gsmPortsChart, setGsmPortsChart] = useState({
    series: [{
      name: 'Used Ports',
      data: [] as number[]
    }, {
      name: 'Free Ports',
      data: [] as number[]
    }],
    options: {
      chart: {
        type: 'bar' as const,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          borderRadiusApplication: 'end',
          horizontal: true,
          columnHeight: '2px',
        }
      },
      legend: {
        show: true,
        position: 'bottom'
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: [] as string[],
        labels: {
          show: true,
          style: {
            fontSize: '11px',
            colors: '#666'
          }
        }
      },
      yaxis: {
        show: true,
        title: {
          text: 'Port Count',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#263238'
          }
        }
      }
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    NProgress.start();
    try {
      const response = await getDashboardData();
      if (response) {
        setDashboardData(response.data);
        
        // Update company profiling chart
        if (response?.data.profilling && response?.data.profilling.length > 0) {
          const companyNames = response?.data.profilling.map((p: CompanyProfile) => p.company);
          const gsmCounts = response?.data.profilling.map((p: CompanyProfile) => p.gsm_count);
          const portCounts = response?.data.profilling.map((p: CompanyProfile) => p.port_count);
          
          console.log('Company chart data:', { companyNames, gsmCounts, portCounts });
          
          setCompanyChart(prevChart => ({
            ...prevChart,
            series: [{
              name: 'GSM Count',
              data: gsmCounts
            }, {
              name: 'Port Count',
              data: portCounts
            }],
            options: {
              ...prevChart.options,
              xaxis: {
                ...prevChart.options.xaxis,
                categories: companyNames
              }
            }
          }));
        }

        // Update GSM ports chart
        if (response?.data.gsm_ports_chart) {
          console.log('GSM ports chart data:', response?.data.gsm_ports_chart);
          setGsmPortsChart(prevChart => ({
            ...prevChart,
            series: [{
              name: 'Used Ports',
              data: response?.data.gsm_ports_chart.used_ports
            }, {
              name: 'Free Ports',
              data: response?.data.gsm_ports_chart.free_ports
            }],
            options: {
              ...prevChart.options,
              xaxis: {
                ...prevChart.options.xaxis,
                categories: response?.data.gsm_ports_chart.gsm_names
              }
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const getDeviceStatusBadge = (status: string) => {
    switch (status) {
      case 'power_on':
        return <Badge bg="success">Online</Badge>;
      case 'power_off':
        return <Badge bg="danger">Offline</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getPortStatusBadge = (status: string) => {
    switch (status) {
      case 'up':
        return <Badge bg="success">Up</Badge>;
      case 'down':
        return <Badge bg="danger">Down</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const refreshData = async () => {
    await fetchDashboardData();
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="GSM Management" mainLink="/gsm" subTitle="Dashboard" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">GSM Dashboard</h2>
              </Col>
              <Col md={8} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <div className="d-flex align-items-center gap-2">
                    <i className="material-icons-two-tone" style={{cursor: 'pointer'}} onClick={refreshData}>refresh</i>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Summary Cards */}
      <PageSummaryGrid cards={summaryCards} />

      <Row>
        {/* GSM Assignment Table */}
        <Col md={8}>
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 app-title-heading">GSM Assignments</h5>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowGsmAssignmentModal(true)}
                >
                  View All
                </Button>
              </div>
              
              {!dashboardData?.gsm_assignment || dashboardData.gsm_assignment.length === 0 ? (
                <EmptyState
                  title="No GSM Assignments"
                  description="GSM assignment data will appear here when available."
                  isTableRow={true}
                  colSpan={6}
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped table-sm">
                    <thead>
                      <tr>
                        <th>GSM Device</th>
                        <th>Company</th>
                        <th>Status</th>
                        <th>Ports</th>
                        <th>Assigned</th>
                        <th>Free</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.gsm_assignment.slice(0, 5).map((assignment) => (
                        <tr key={assignment.id}>
                          <td>
                            <div>
                              <strong>{assignment.gsm_name}</strong>
                              <br />
                              <small className="text-muted">{assignment.gsm_ip}</small>
                            </div>
                          </td>
                          <td>{assignment.company_name}</td>
                          <td>{getDeviceStatusBadge(assignment.device_status)}</td>
                          <td>{assignment.total_ports}</td>
                          <td>
                            <Badge bg="primary">{assignment.assigned_ports_count}</Badge>
                          </td>
                          <td>
                            <Badge bg="secondary">{assignment.unassigned_ports_count}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Col>

        {/* Recent Inbox Messages */}
        <Col md={4}>
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 app-title-heading">Recent Messages</h5>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowInboxModal(true)}
                >
                  View All
                </Button>
              </div>
              
              {!dashboardData?.inbox_list || dashboardData.inbox_list.length === 0 ? (
                <EmptyState
                  title="No Messages"
                  description="Recent messages will appear here."
                  className="table-empty-state"
                />
              ) : (
                <div className="inbox-messages" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {dashboardData.inbox_list.slice(0, 5).map((message, index) => (
                    <div key={index} className="message-item mb-3 p-2 border rounded">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <small className="text-muted">
                          {formatDateTimeToLocal(message.created_at, GlobalDateTimeFormat)}
                        </small>
                        <Badge bg="info" className="ms-2">
                          {message.port_number}
                        </Badge>
                      </div>
                      <div className="message-content">
                        <small className="text-muted">GSM: {message.ip_address}</small>
                        <p className="mb-1 small">{message.message}</p>
                        <small className="text-primary">{message.mobile_number}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Company Profiling Chart */}
        <Col md={6}>
          <div className="card">
            <div className="card-body">
              <h5 className="mb-3 app-title-heading">Company Profiling</h5>
              {dashboardData?.profilling && dashboardData.profilling.length > 0 ? (
                <ReactApexChart 
                  options={companyChart.options as ApexOptions} 
                  series={companyChart.series} 
                  type="bar" 
                  height={300} 
                />
              ) : (
                <EmptyState
                  title="No Company Data"
                  description="Company profiling data will appear here when available."
                  className="table-empty-state"
                />
              )}
            </div>
          </div>
        </Col>

        {/* GSM Ports Usage Chart */}
        <Col md={6}>
          <div className="card">
            <div className="card-body">
              <h5 className="mb-3 app-title-heading">GSM Ports Usage</h5>
              {dashboardData?.gsm_ports_chart && dashboardData.gsm_ports_chart.gsm_names.length > 0 ? (
                <ReactApexChart 
                  options={gsmPortsChart.options as ApexOptions} 
                  series={gsmPortsChart.series} 
                  type="bar" 
                  height={300} 
                />
              ) : (
                <EmptyState
                  title="No Port Data"
                  description="GSM ports usage data will appear here when available."
                  className="table-empty-state"
                />
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Inbox Messages Modal */}
      <Modal 
        show={showInboxModal} 
        onHide={() => setShowInboxModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>All Inbox Messages</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!dashboardData?.inbox_list || dashboardData.inbox_list.length === 0 ? (
            <EmptyState
              title="No Messages"
              description="No inbox messages available."
              className="table-empty-state"
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>GSM IP</th>
                    <th>Port</th>
                    <th>Mobile Number</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.inbox_list.map((message, index) => (
                    <tr key={index}>
                      <td>{formatDateTimeToLocal(message.created_at, GlobalDateTimeFormat)}</td>
                      <td>{message.ip_address}</td>
                      <td><Badge bg="info">{message.port_number}</Badge></td>
                      <td>{message.mobile_number}</td>
                      <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                        {message.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* GSM Assignment Modal */}
      <Modal 
        show={showGsmAssignmentModal} 
        onHide={() => setShowGsmAssignmentModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>All GSM Assignments</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!dashboardData?.gsm_assignment || dashboardData.gsm_assignment.length === 0 ? (
            <EmptyState
              title="No GSM Assignments"
              description="No GSM assignment data available."
              className="table-empty-state"
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>GSM Device</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Total Ports</th>
                    <th>Assigned</th>
                    <th>Free</th>
                    <th>Assigned Ports</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.gsm_assignment.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>
                        <div>
                          <strong>{assignment.gsm_name}</strong>
                          <br />
                          <small className="text-muted">{assignment.gsm_ip}</small>
                        </div>
                      </td>
                      <td>{assignment.company_name}</td>
                      <td>{getDeviceStatusBadge(assignment.device_status)}</td>
                      <td>{assignment.total_ports}</td>
                      <td>
                        <Badge bg="primary">{assignment.assigned_ports_count}</Badge>
                      </td>
                      <td>
                        <Badge bg="secondary">{assignment.unassigned_ports_count}</Badge>
                      </td>
                      <td>
                        {assignment.assigned_ports_data.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {assignment.assigned_ports_data.map((port, index) => (
                              <div key={index} className="d-flex align-items-center gap-1">
                                <span>{port.port_number}</span>
                                {getPortStatusBadge(port.status)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

GsmDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmDashboard;