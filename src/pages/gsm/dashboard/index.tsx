import React,{ReactElement, useEffect, useState, useMemo} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row } from 'react-bootstrap'
import { DashboardData } from '@utils/GsmManagement'

import { toast } from 'react-toastify'
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import imgStatus5 from '@assets/images/widget/img-status-5.svg'
import imgStatus6 from '@assets/images/widget/img-status-6.svg'
import imgStatus7 from '@assets/images/widget/img-status-7.svg'
import imgStatus8 from '@assets/images/widget/img-status-8.svg'
import imgStatus9 from '@assets/images/widget/img-status-9.svg'
import  '@assets/scss/common.scss'
import AnimatedNumber from '@components/AnimatedNumber';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import moment from 'moment';
const baseUrl = '';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { set } from 'nprogress'
import Link from 'next/link'
import { motion } from 'framer-motion'
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface SummaryData {
      totalGsm: number;
      activeCompanies: number;
      portsInUse: number;
      totalPorts: number;
      inbox: number;
      onlinePorts: number;
      offlinePorts: number;
}

interface GsmAssigment{
      gsm_ip: string;
      company_name: string;
      device_status: string;
      gsm_name: string;
      total_ports: number;
      assigned_ports_count: number;
      unassigned_ports_count: number;
      assigned_ports: string;
      assigned_ports_data:PortModalData[]
}

interface PortModalData{
      port_number: number;
      status: string;
}

interface InboxData{
      ip_address: string;
      message: string;
      created_at: string;
      port_number: string;
      mobile_number: string;
}

interface ProfillingData{
      company: string;
      gsm_count: number;
      port_count: number;
}

const GsmDashboard = () => {

      const [summaryData, setSummaryData] = useState<SummaryData>({
            totalGsm: 0,
            activeCompanies: 0,
            portsInUse: 0,
            totalPorts: 0,
            inbox: 0,
            onlinePorts: 0,
            offlinePorts: 0,
      });

      // Create cards data for PageSummaryGrid
      const summaryCards: SummaryCard[] = useMemo(() => [
        {
            id: 'total-gsms',
            title: 'Total GSMs',
            value: summaryData.totalGsm || 0,
            description: 'Total devices in the system',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'assigned-gsms',
            title: 'Assigned GSMs',
            value: summaryData.activeCompanies || 0,
            description: 'GSMs linked to a company',
            delay: 0.3,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'unassigned-gsms',
            title: 'Unassigned GSMs',
            value: Math.max(0, (summaryData.totalGsm || 0) - (summaryData.activeCompanies || 0)),
            description: 'GSMs awaiting assignment',
            delay: 0.5,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'total-ports',
            title: 'Total Ports',
            value: summaryData.totalPorts || 0,
            description: 'Overall port capacity',
            delay: 0.7,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        
      ], [summaryData.totalGsm, summaryData.activeCompanies, summaryData.totalPorts]);

      const [gsmAssigment, setGsmAssigment] = useState<GsmAssigment[]>([]);
      const [chartFreePorts, setChartFreePorts] = useState<number[]>([]);
      const [chartInUsePorts, setChartInUsePorts] = useState<number[]>([]);
      const [chartGsm, setChartGsm] = useState<string[]>([]);
      const [inboxData, setInboxData] = useState<InboxData[]>([]);
      const [profillingData, setProfillingData] = useState<ProfillingData[]>([]);
      const [inboxItemsByDays, setInboxItemsByDays] = useState<{date: string; count: string}[]>([]);
      useEffect(() => {
        DashboardData().then((res) => {
          if(res){
            setSummaryData({
              totalGsm: res.total_gsm ?? 0,
              activeCompanies: res.total_company ?? 0,
              portsInUse: res.used_port ?? 0,
              totalPorts: res.total_port ?? 0,
              inbox: res.inbox ?? 0,
              onlinePorts: res.online_port ?? 0,
              offlinePorts: res.offline_port ?? 0,
            });


            const gsmAssignment = res.gsm_assignment;
            if(gsmAssignment){
              setGsmAssigment(gsmAssignment);
            }


            if(res.gsm_ports_chart){
              setChartFreePorts(res.gsm_ports_chart.free_ports);
              setChartInUsePorts(res.gsm_ports_chart.used_ports);
              setChartGsm(res.gsm_ports_chart.gsm_names);
            }

            if(res.inbox_list){
              setInboxData(res.inbox_list);
            }

            if(res.profilling){
              setProfillingData(res.profilling);
            }

            if(res.inbox_items_by_days){
              setInboxItemsByDays(res.inbox_items_by_days);
            }
          }
        });
      }, []);


      const [portData, setPortData] = useState<PortModalData[]>([]);
      const [portModalCompany, setPortModalCompany] = useState('');
      const [portModal, setPortModal] = useState(false);
      const handleViewPorts = (item: GsmAssigment) => {
        setPortModal(true);
        setPortData(item?.assigned_ports_data);
        setPortModalCompany(item?.company_name);
      }

      const [portUsage, setPortUsage] = useState<{
            series: { name: string; data: number[] }[];
            options: ApexOptions;
            }>({
            series: [],
            options: {}
            });
    
      useEffect(() => {
            setPortUsage({
          
                  series: [{
                    name: 'In Use Ports',
                    data: chartInUsePorts as number[]
                  }, {
                    name: 'Free Ports',
                    data: chartFreePorts
                  }
            ],
                  options: {
                    chart: {
                      type: 'bar',
                      height: 350,
                      toolbar: {
                        show: false
                      }
                    },
                    colors: ['#008ffb', '#00e396'],
                    plotOptions: {
                      bar: {
                        horizontal: false,
                        columnWidth: '55%',
                        borderRadius: 5,
                        borderRadiusApplication: 'end'
                      },
                    },
                    dataLabels: {
                      enabled: false
                    },
                    stroke: {
                      show: true,
                      width: 2,
                      colors: ['transparent']
                    },
                    xaxis: {
                      categories: chartGsm || [],
                    },
                    yaxis: {
                      title: {
                        text: 'Port Count'
                      }
                    },
                    fill: {
                      opacity: 1
                    },
                    tooltip: {
                      enabled: true,
                      y: {
                        formatter: function (val: number) {
                          return val + ' ports';
                        }
                      }
                    },
                    legend: {
                      show: true,
                      position: 'bottom',
                      horizontalAlign: 'center'
                    }
                  },
                
              });
      }, [chartGsm,chartFreePorts,chartInUsePorts]);

      // Update GSM Status Chart with dynamic data
      useEffect(() => {
    
        setGsmStatusChart(prev => ({
          ...prev,
          series: [summaryData?.onlinePorts || 0, summaryData?.offlinePorts || 0]
        }));
      }, [gsmAssigment, summaryData.totalGsm, summaryData.activeCompanies]);

      // Update Port Utilization Chart with dynamic data
      useEffect(() => {
        const assignedPorts = summaryData.portsInUse;
        const unassignedPorts = summaryData.totalPorts - summaryData.portsInUse;
        
        setPortUtilizationChart(prev => ({
          ...prev,
          series: [assignedPorts, unassignedPorts]
        }));
      }, [summaryData.portsInUse, summaryData.totalPorts]);

      // Update GSM Assignments Trend Chart with inbox data
      useEffect(() => {
        if (inboxItemsByDays.length > 0) {
          const dates = inboxItemsByDays.map(item => moment(item.date).format('MMM DD'));
          const counts = inboxItemsByDays.map(item => parseInt(item.count));
          
          setGsmAssignmentsTrendChart({
            series: [{
              name: "Inbox Messages",
              data: counts
            }],
            options: {
              chart: {
                height: 350,
                type: 'line',
                zoom: {
                  enabled: false
                },
                toolbar: {
                  show: false
                }
              },
              colors: ['#008ffb'],
              dataLabels: {
                enabled: false
              },
              stroke: {
                curve: 'straight',
                width: 2
              },
              grid: {
                row: {
                  colors: ['#f3f3f3', 'transparent'],
                  opacity: 0.5
                },
              },
              xaxis: {
                categories: dates
              },
              yaxis: {
                title: {
                  text: 'Message Count'
                }
              },
              tooltip: {
                enabled: true,
                y: {
                  formatter: function (val: number) {
                    return val + ' messages';
                  }
                }
              },
              legend: {
                show: true,
                position: 'top',
                horizontalAlign: 'right'
              }
            }
          });
        }
      }, [inboxItemsByDays]);

      const [gsmStatusChart, setGsmStatusChart] = React.useState({
          
            series: [0, 0],
            options: {
              chart: {
                width: 380,
                type: 'pie',
                toolbar: {
                  show: false
                }
              },
              colors: ['#00e396', '#ff4560'],
              legend: {
                show: true,
                position: 'bottom'
              },
              dataLabels: {
                enabled: false
              },
              labels: ['Online', 'Offline'],
              tooltip: {
                enabled: true,
                y: {
                  formatter: function (val: number) {
                  return val + ' ports';
                  }
                }
              },
              responsive: [{
                breakpoint: 480,
                options: {
                  chart: {
                    width: 200
                  },
                  legend: {
                    show: true,
                    position: 'bottom'
                  }
                }
              }]
            },
          
          
        });



        const [portUtilizationChart, setPortUtilizationChart] = React.useState({
          
            series: [0, 0],
            options: {
              chart: {
                width: 380,
                type: 'pie',
                toolbar: {
                  show: false
                }
              },
              colors: ['#008ffb', '#feb019'],
              labels: ['Assigned', 'UnAssigned'],
              legend: {
                show: true,
                position: 'bottom'
              },
              dataLabels: {
                enabled: false
              },
              tooltip: {
                enabled: true,
                y: {
                  formatter: function (val: number) {
                    return val + ' ports';
                  }
                }
              },
              responsive: [{
                breakpoint: 480,
                options: {
                  chart: {
                    width: 200
                  },
                  legend: {
                    show: true,
                    position: 'bottom'
                  }
                }
              }]
            },
          
          
        });


        const [gsmAssignmentsTrendChart, setGsmAssignmentsTrendChart] = React.useState<{
          series: { name: string; data: number[] }[];
          options: {
            chart: {
              height: number;
              type: string;
              zoom: { enabled: boolean };
              toolbar: { show: boolean };
            };
            colors?: string[];
            dataLabels: { enabled: boolean };
            stroke: { curve: string; width?: number };
            grid: {
              row: {
                colors: string[];
                opacity: number;
              };
            };
            xaxis: { categories: string[] };
            yaxis?: { title: { text: string } };
            tooltip?: { enabled: boolean; y: { formatter: (val: number) => string } };
            legend?: { show: boolean; position: string; horizontalAlign: string };
          };
        }>({
          
            series: [{
                name: "Inbox Messages",
                data: []
            }],
            options: {
              chart: {
                height: 350,
                type: 'line',
                zoom: {
                  enabled: false
                },
                toolbar: {
                  show: false
                }
              },
              colors: ['#008ffb'],
              dataLabels: {
                enabled: false
              },
              stroke: {
                curve: 'straight',
                width: 2
              },
              grid: {
                row: {
                  colors: ['#f3f3f3', 'transparent'],
                  opacity: 0.5
                },
              },
              xaxis: {
                categories: [],
              },
              yaxis: {
                title: {
                  text: 'Message Count'
                }
              },
              tooltip: {
                enabled: true,
                y: {
                  formatter: function (val: number) {
                    return val + ' messages';
                  }
                }
              },
              legend: {
                show: true,
                position: 'top',
                horizontalAlign: 'right'
              }
            },
          
          
        });



    return (

        <React.Fragment>
            <BreadcrumbItem mainTitle="Gsm" mainLink="/gsm/dashboard" subTitle="Gsm Dashboard"  />
            
            <Modal show={portModal} onHide={() => setPortModal(false)}>
                  <Modal.Header closeButton>
                        <Modal.Title>{portModalCompany} Ports</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                        <table className="table table-bordered table-striped table-sm">
                              <thead>
                                    <tr>
                                          <th>Port</th>
                                          <th>Status</th>
                                    </tr>
                              </thead>
                              <tbody>
                                    {portData.length > 0 && portData.map((item: PortModalData) => (
                                    <tr key={item.port_number}>
                                          <td>{item.port_number}</td>
                                          <td>
                                                {item.status !== 'null' && item.status === 'up' ? <span className="text-success"><i className="fas fa-circle"></i> Up</span> : <span className="text-danger"><i className="fas fa-circle"></i> Down</span>}
                                          </td>
                                    </tr>
                                    ))}
                                    {portData.length === 0 && <tr><td colSpan={2} className="text-center">No ports assigned</td></tr>}
                              </tbody>
                        </table>
                  </Modal.Body>
                  <Modal.Footer>
                        <Button variant="secondary" onClick={() => setPortModal(false)}>
                              Close
                        </Button>
                  </Modal.Footer>
            </Modal>

            <Row className='mb-3'>
                  <Col md={12}>
                        <div className="page-header-title style-2">
                        <h2 className="mb-0 ">
                              Gsm Dashboard
                        </h2>
                        </div>
                  </Col>
            </Row>
           

            {/* GSM Summary Cards */}
            <PageSummaryGrid cards={summaryCards} />


            <Row>
                  <Col md={3}>
                        <Card>
                              
                              <Card.Body>
                              <h5 className="app-title-heading">GSM Port Status</h5>
                                    {gsmStatusChart.series && gsmStatusChart.series.some(s => s > 0) ? (
                                      <ReactApexChart options={gsmStatusChart.options as ApexOptions} series={gsmStatusChart.series} type="pie" height={200} />
                                    ) : (
                                      <div className="text-center py-4">
                                        <p className="text-muted">No data available</p>
                                      </div>
                                    )}
                              </Card.Body>
                        </Card>
                  </Col>
                  <Col md={3}>
                        <Card>
                        
                              <Card.Body>
                              <h5 className="app-title-heading">Port Utilization</h5>
                                    {portUtilizationChart.series && portUtilizationChart.series.some(s => s > 0) ? (
                                      <ReactApexChart options={portUtilizationChart.options as ApexOptions} series={portUtilizationChart.series} type="pie" height={200} />
                                    ) : (
                                      <div className="text-center py-4">
                                        <p className="text-muted">No data available</p>
                                      </div>
                                    )}
                              </Card.Body>
                        </Card>
                  </Col>

                  <Col md={6}>
                        <Card>
                        
                              <Card.Body>
                              <h5    className="app-title-heading">Inbox Messages Trend</h5>
                                    {gsmAssignmentsTrendChart.series && gsmAssignmentsTrendChart.series.length > 0 && gsmAssignmentsTrendChart.series[0]?.data && gsmAssignmentsTrendChart.series[0].data.length > 0 ? (
                                      <ReactApexChart options={gsmAssignmentsTrendChart.options as ApexOptions} series={gsmAssignmentsTrendChart.series} type="line" height={185} />
                                    ) : (
                                      <div className="text-center py-4">
                                        <p className="text-muted">No data available</p>
                                      </div>
                                    )}
                              </Card.Body>
                        </Card>
                  </Col>
            </Row>

            <Row>
                  <Col md={6}>
                        <div className="card">
                             
                              <div className="card-body dashboard-table">
                              <h5 className="mb-3 app-title-heading">Recent GSM Activity</h5>
                                    <div>
                                          <table className="table table-bordered table-striped table-sm custom-app-table">
                                                <thead>
                                                      <tr>
                                                            <th>GSM IP</th>
                                                            <th>Company</th>
                                                            <th>Status</th>
                                                            <th>Action</th>
                                                      </tr>
                                                </thead>
                                                <tbody>

                                                      {gsmAssigment.length > 0 && gsmAssigment.map((item: GsmAssigment) => (
                                                      <tr key={`${item.gsm_ip}-${item.company_name}`}>
                                                            <td>{item.gsm_ip}</td>
                                                            <td className="one-line-ellipsis">{item.company_name}</td>
                                                            <td>
                                                                  {item.device_status === 'power_on' ? <span className="text-success"><i className="fas fa-circle"></i> Power ON</span> : <span className="text-danger"><i className="fas fa-circle"></i> Power OFF</span>}
                                                            </td>
                                                            <td>
                                                                  <Button size="sm" variant="outline-primary" onClick={() => handleViewPorts(item)}>View Ports</Button>
                                                            </td>
                                                            </tr>
                                                      ))}


                                                </tbody>
                                          </table>
                                    </div>
                              </div>
                        </div>
                  </Col>
                  <Col md={6}>
                        <div className="card">
                             
                              
                              <div className="card-body">
                              <h5 className="mb-3 app-title-heading">Port Usage by GSM</h5>
                              {portUsage.series.length > 0 && <ReactApexChart options={portUsage.options as ApexOptions} series={portUsage.series} type="bar" height={290} />}
                              </div>
                        </div>
                  </Col>
            </Row>


            <Row>
                  <Col md={6}>
                        <div className="card">
                             
                              <div className="card-body dashboard-table">
                              <h5 className="mb-3 app-title-heading">Inbox Messages Feed</h5>
                                    <table className="table table-bordered table-striped table-sm custom-app-table">
                                          <thead>
                                                <tr>
                                                      <th>Date Time</th>
                                                      <th>Mobile Number</th>
                                                      <th>Port</th>
                                                      <th >Message</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                      
                                                      {inboxData.length > 0 && inboxData.map((item: InboxData, index: number) => (
                                                      <tr key={`${item.ip_address}-${item.port_number}-${item.created_at}-${index}`}>
                                                            <td>{moment(item.created_at).format('DD-MM-YYYY HH:mm:ss')}</td>
                                                            <td>{item.mobile_number}</td>
                                                            <td>{item.port_number}</td>
                                                            <td className="one-line-ellipsis" title={item.message}>{item.message}</td>
                                                      </tr>
                                                      ))}
                                                </tbody>
                                    </table>
                                    <div className="me-3 w-100 text-center">
                                          <Link href={`${baseUrl}/gsm/inbox`} className="link-primary">View All</Link>
                                    </div>
                              </div>
                              
                        </div>
                  </Col>
                  <Col md={6}>
                        <div className="card">
                             
                              <div className="card-body dashboard-table">
                              <h5 className="mb-3 app-title-heading">Companies Profilling</h5>
                                    <table className="table table-bordered table-striped table-sm custom-app-table">
                                          <thead>
                                                <tr>
                                                      <th>Company</th>
                                                      <th>Gsm Count</th>
                                                      <th>Ports Count</th>
                                                      
                                                </tr>
                                                </thead>
                                                <tbody>
                                                      {profillingData.length > 0 && profillingData.map((item: ProfillingData) => (
                                                      <tr key={item.company}>
                                                            <td>{item.company}</td>
                                                            <td>{item.gsm_count}</td>
                                                            <td>{item.port_count}</td>
                                                      </tr>
                                                      ))}
                                                </tbody>
                                    </table>
                                    <div className="me-3 w-100 text-center">
                                    <Link href={`${baseUrl}/gsm/profilling`} className="link-primary">View All</Link>
                                    </div>
                              </div>
                        </div>
                  </Col>
            </Row>


        </React.Fragment>
    )
}
GsmDashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
  
export default GsmDashboard
