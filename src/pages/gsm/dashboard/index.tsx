import React,{ReactElement, useEffect, useState} from 'react'
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
import  '@assets/scss/gsm-dashboard.scss'
import AnimatedNumber from '@components/AnimatedNumber';
import moment from 'moment';
const baseUrl = '';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { set } from 'nprogress'
import Link from 'next/link'
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface SummaryData {
      totalGsm: number;
      activeCompanies: number;
      portsInUse: number;
      totalPorts: number;
      inbox: number;
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
      });

      const [gsmAssigment, setGsmAssigment] = useState<GsmAssigment[]>([]);
      const [chartFreePorts, setChartFreePorts] = useState<number[]>([]);
      const [chartInUsePorts, setChartInUsePorts] = useState<number[]>([]);
      const [chartGsm, setChartGsm] = useState<string[]>([]);
      const [inboxData, setInboxData] = useState<InboxData[]>([]);
      const [profillingData, setProfillingData] = useState<ProfillingData[]>([]);
      useEffect(() => {
        DashboardData().then((res) => {
          console.log(res);
          if(res){
            setSummaryData({
              totalGsm: res.total_gsm,
              activeCompanies: res.total_company,
              portsInUse: res.used_port,
              totalPorts: res.total_port,
              inbox: res.inbox,
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
                      categories: chartGsm,
                    },
                   
                    fill: {
                      opacity: 1
                    },
                   
                  },
                
              });
      }, [chartGsm,chartFreePorts,chartInUsePorts]);



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
                                    <tr>
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
                        <div className="page-header-title d-flex justify-content-between">
                        <h2 className="mb-0 ">
                              Gsm Dashboard
                        </h2>
                        </div>
                  </Col>
            </Row>
            <Row>
               <Col md={3}>
               <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                    <i className="material-icons-two-tone text-white">settings_input_antenna</i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Total GSMs</p>
                                          <div className="d-flex align-items-end">
                                                {summaryData.totalGsm > 0 ? <AnimatedNumber value={summaryData.totalGsm} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>

               <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus2.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                    <i className="material-icons-two-tone text-white">business</i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Active Companies</p>
                                          <div className="d-flex align-items-end">
                                                {summaryData.activeCompanies > 0 ? <AnimatedNumber value={summaryData.activeCompanies} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>

               </Col>

               <Col md={3}>
               <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus4.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                    <i className="material-icons-two-tone text-white">sync_alt</i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Ports in Use</p>
                                          <div className="d-flex align-items-end">
                                          <h2 className="mb-0 f-w-500">{summaryData.portsInUse}/{summaryData.totalPorts}</h2>
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
                  
               </Col>

               <Col md={3}>
               <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus2.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                    <i className="material-icons-two-tone text-white">inbox</i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Inbox</p>
                                          <div className="d-flex align-items-end">
                                                {summaryData.inbox > 0 ? <AnimatedNumber value={summaryData.inbox} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>

               </Col>
            </Row>

            <Row>
                  <Col md={6}>
                        <div className="card">
                              <div className="card-header">
                                    <h5 className="mb-0">Recent GSM Activity</h5>
                              </div>
                              <div className="card-body">
                                    <div>
                                          <table className="table table-bordered table-striped table-sm">
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
                                                      <tr>
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
                              <div className="card-header">
                                    <h5 className="mb-0">Port Usage by GSM</h5>
                              </div>
                              <div className="card-body">
                              {portUsage.series.length > 0 && <ReactApexChart options={portUsage.options as ApexOptions} series={portUsage.series} type="bar" height={290} />}
                              </div>
                        </div>
                  </Col>
            </Row>


            <Row>
                  <Col md={6}>
                        <div className="card">
                              <div className="card-header">
                                    <h5 className="mb-0">Inbox Messages Feed</h5>
                              </div>
                              <div className="card-body">
                                    <table className="table table-bordered table-striped table-sm">
                                          <thead>
                                                <tr>
                                                      <th>Date Time</th>
                                                      <th>Mobile Number</th>
                                                      <th>Port</th>
                                                      <th>Message</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                      
                                                      {inboxData.length > 0 && inboxData.map((item: InboxData) => (
                                                      <tr>
                                                            <td>{moment(item.created_at).format('DD-MM-YYYY HH:mm:ss')}</td>
                                                            <td>{item.mobile_number}</td>
                                                            <td>{item.port_number}</td>
                                                            <td className="one-line-ellipsis">{item.message}</td>
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
                              <div className="card-header">
                                    <h5 className="mb-0">Companies Profilling</h5>
                              </div>
                              <div className="card-body">
                                    <table className="table table-bordered table-striped table-sm">
                                          <thead>
                                                <tr>
                                                      <th>Company</th>
                                                      <th>Gsm Count</th>
                                                      <th>Ports Count</th>
                                                      
                                                </tr>
                                                </thead>
                                                <tbody>
                                                      {profillingData.length > 0 && profillingData.map((item: ProfillingData) => (
                                                      <tr>
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
