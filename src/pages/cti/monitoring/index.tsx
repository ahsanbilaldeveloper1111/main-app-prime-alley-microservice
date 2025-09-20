import React, { ReactElement, useEffect, useRef, useState } from 'react';
import Layout from '@layout/index';
import '@assets/scss/datatable-style.scss';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Button, Card, Col, Dropdown, Modal, Row } from 'react-bootstrap';
import AnimatedNumber from '@components/AnimatedNumber';
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';
import moment from 'moment';
import '@assets/scss/cti-monitoring.scss';
import Select from 'react-select';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

    
const CtiMonitoring = () => {

      const [donutChart, setDonutChart] = React.useState<{
        series: number[];
        options: ApexOptions;
      }>({
            series: [44, 55, 41],
            options: {
              chart: {
                type: 'donut',
              },
              title: {
                text: 'Live Agents Status',
                align: 'center',
                style: {
                  fontSize: '12px',
                  fontWeight: '600',
                 
                }
              },
              labels: ['On Call', 'Idle', 'Online'],
              legend: {
                  position: 'bottom'
                },
                dataLabels: {
                  enabled: false
                },
              responsive: [{
                breakpoint: 480,
                options: {
                  chart: {
                    width: 200
                  }
                  
                }
              }]
            },
          
          
        });


        const [callPerHourChart, setCallPerHourChart] = React.useState<{
          series: {name: string, data: number[]}[];
          options: ApexOptions;
        }>({
          
            series: [{
              name: 'Calls Per Hour',
              data: [10, 20, 30, 40, 75, 85]
            }],
            options: {
              chart: {
                type: 'area',
                height: 350,
                zoom: {
                  enabled: false
                },
                toolbar: {
                  show: false
                }
              },
              title: {
                text: 'Calls Per Hour',
                align: 'center',
                style: {
                  fontSize: '12px',
                  fontWeight: '600'
                }
              },
              dataLabels: {
                enabled: false
              },
              stroke: {
                curve: 'smooth'
              },
              markers: {
                size: 4,
                colors: ['#008FFB'],
                strokeColors: '#fff',
                strokeWidth: 2,
                hover: {
                  size: 6
                }
              },
              fill: {
                type: 'gradient',
                gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.7,
                  opacityTo: 0.3,
                }
              },
             
              xaxis: {
                categories: ['1AM', '2AM', '3AM', '4AM', '5AM'],
                axisBorder: {
                  show: true
                },
                axisTicks: {
                  show: true
                }
              },
              yaxis: {
                show: true,
                axisBorder: {
                  show: true
                },
                axisTicks: {
                  show: true
                }
              },
              grid: {
                show: true,
                borderColor: '#e0e0e0',
                strokeDashArray: 4,
                xaxis: {
                  lines: {
                    show: true
                  }
                },
                yaxis: {
                  lines: {
                    show: true
                  }
                }
              },
             
              legend: {
                horizontalAlign: 'left'
              },
              colors: ['#008FFB']
            },
          
          
        });











  const [selectedCompaign, setSelectedCompaign] = useState('All Compaigns');
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [isSliding, setIsSliding] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [serviceLevelThreshold, setServiceLevelThreshold] = useState(90);
  const [queueThreshold, setQueueThreshold] = useState(90);
  const [showThresholdAlert, setShowThresholdAlert] = useState(false);



  const [alerts, setAlerts] = useState([
    { id: 1, message: "Agent Alice on call for over 3 minutes.", type: "danger", title: "Long Call Alert", visible: true },
    { id: 2, message: "Agent Heidi on call for over 3 minutes.", type: "danger", title: "Long Call Alert", visible: true },
    { id: 3, message: "Agent Judy on call for over 3 minutes.", type: "danger", title: "Long Call Alert", visible: true },
    { id: 4, message: "Agent Rachel on call for over 3 minutes.", type: "danger", title: "Long Call Alert", visible: true }
  ]);


  const dismissAlert = (alertId: number) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, visible: false } : alert
      )
    );
  };

  // Continuous threshold checking
  useEffect(() => {
    const checkThresholds = () => {
      // Example conditions - you can modify these based on your actual data
      const currentServiceLevel = 50; // Default value
      const currentQueueLength = 50; // This should come from your actual data
      
      // Show alert if service level is below threshold OR queue length exceeds threshold
      const shouldShowAlert = currentServiceLevel < serviceLevelThreshold || currentQueueLength > queueThreshold;
      setShowThresholdAlert(shouldShowAlert);
    };

    // Check immediately
    checkThresholds();

    // Set up interval to check every 2 seconds
    const interval = setInterval(checkThresholds, 2000);

    return () => clearInterval(interval);
  }, [serviceLevelThreshold, queueThreshold]);

  const [agentModelShow, setAgentModelShow] = useState(false);

  const agentInfo = {
    name: 'Alice',
    compaign: 'Sales Q3',
    handledCalls: 100,
    csatScore: 80,
    aht: 50,
    cph: 10,
   activity:{
    onCall:4000,
    idle:1000,
    acw:80,
    break:80
   }
    
  };


  // Campaign data
  const campaigns = [
    {
      id: 'compaign-1',
      name: 'Compaign 1',
      data: {
        agentOnCall: 100,
        agentIdle: 100,
        longestWait: 80,
        serviceLevel: 80,
        cph:90,
        success:80,
        abandon:10,
        trend:"",
        performance:{
          calls_per_hour:90,
          success_rate:90,
          abandon_rate:80,
          avg_handle_time:50,
        },
        manualOutbound:{
          agent:8,
          aht:310,
          cph:10,
        }
      }
    },
    {
      id: 'compaign-2',
      name: 'Compaign 2',
      data: {
        agentOnCall: 200,
        agentIdle: 10,
        longestWait: 120,
        serviceLevel: 100,
        cph:80,
        success:70,
        abandon:15,
        trend:"",
        performance:{
          calls_per_hour:10,
          success_rate:20,
          abandon_rate:50,
          avg_handle_time:30,
        },
        manualOutbound:{
          agent:4,
          aht:120,
          cph:10,
        }
      }
    },
    {
      id: 'compaign-3',
      name: 'Compaign 3',
      data: {
        agentOnCall: 150,
        agentIdle: 25,
        longestWait: 95,
        serviceLevel: 85,
        cph:70,
        success:50,
        abandon:30,
        trend:"",
        performance:{
          calls_per_hour:80,
          success_rate:10,
          abandon_rate:30,
          avg_handle_time:30,
        },
        manualOutbound:{
          agent:6,
          aht:180,
          cph:10,
        }
      }
    }
  ];

  // Get current campaign to display
  const getCurrentCampaign = () => {
    if (selectedCompaign === 'All Compaigns') {
      return campaigns[currentCampaignIndex] || campaigns[0];
    }
    return campaigns.find(campaign => campaign.name === selectedCompaign) || campaigns[0];
  };

  const currentCampaign = getCurrentCampaign();

  // Auto-cycle through campaigns
  useEffect(() => {
    if (isAutoCycling && selectedCompaign === 'All Compaigns' && campaigns.length > 1) {
      intervalRef.current = setInterval(() => {
        const nextIndex = (currentCampaignIndex + 1) % campaigns.length;
        handleCampaignIndexChange(nextIndex);
      }, 5000); // 5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAutoCycling, selectedCompaign, campaigns.length, currentCampaignIndex]);

  // Handle campaign selection
  const handleCampaignSelect = (campaignName: string) => {
    if (campaignName !== selectedCompaign) {
      setIsSliding(true);
      setTimeout(() => {
        setSelectedCompaign(campaignName);
        if (campaignName === 'All Compaigns') {
          setIsAutoCycling(true);
        } else {
          setIsAutoCycling(false);
        }
        setTimeout(() => setIsSliding(false), 100);
      }, 150);
    }
  };

  // Handle campaign index change with slide effect
  const handleCampaignIndexChange = (newIndex: number) => {
    if (newIndex !== currentCampaignIndex) {
      setIsSliding(true);
      setTimeout(() => {
        setCurrentCampaignIndex(newIndex);
        setTimeout(() => setIsSliding(false), 100);
      }, 150);
    }
  };

  // Toggle auto-cycling
  const toggleAutoCycle = () => {
    if (selectedCompaign === 'All Compaigns') {
      setIsAutoCycling(!isAutoCycling);
    }
  };



  return (
    <>
      
      <BreadcrumbItem mainTitle="Gsm" mainLink="/call-recordings/dashboard" subTitle="Call Monitoring" />


      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0">
                 Live Call Center Dashboard
            </h2>
            <div className="monitoring-top-right ">
             <div className="innerbox gap-2 d-flex align-items-center">
                  <span className="compaign_title text-muted text-uppercase">
                    Compaign:
                  </span>
                  
                  <Dropdown  className="compaign-dropdown">
                    <Dropdown.Toggle variant="outline-primary" size='sm'>
                      {selectedCompaign}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleCampaignSelect('All Compaigns')}>All Compaigns</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleCampaignSelect('Compaign 1')}>Compaign 1</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleCampaignSelect('Compaign 2')}>Compaign 2</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleCampaignSelect('Compaign 3')}>Compaign 3</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>

                  {selectedCompaign !== 'All Compaigns' && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleCampaignSelect('All Compaigns')}
                      className=""
                      title="Reset to show all campaigns"
                    >
                      <i className="ti ti-refresh me-1"></i>
                      Reset
                    </Button>
                  )}

                  

                  
                  {/* {selectedCompaign === 'All Compaigns' && (
                    <>
                      <Button
                        variant={isAutoCycling ? "success" : "outline-secondary"}
                        size="sm"
                        onClick={toggleAutoCycle}
                        className="ms-2"
                      >
                        <i className={`ti ${isAutoCycling ? 'ti-player-pause' : 'ti-player-play'}`}></i>
                      </Button>
                      {isAutoCycling && (
                        <span className="badge bg-success ms-2">
                          <i className="ti ti-rotate-clockwise me-1"></i>
                          Auto-cycling
                        </span>
                      )}
                    </>
                  )} */}

                  {/* {selectedCompaign !== 'All Compaigns' && (
                    <span className="badge bg-primary ms-2">
                      <i className="ti ti-eye me-1"></i>
                      Manual Selection
                    </span>
                  )} */}

                  <span className="compaign_title text-muted">
                    Last Updated:
                  </span>
                  <span className="compaign_title text-bold">
                    {moment().format('hh:mm:ss A')}
                  </span>
             </div>
            </div>
          </div>
        </Col>
      </Row>


      {/* Dynamic Campaign Data Summary */}
      <Row className='mb-3 '>
        <Col md={12}>
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center bg-color-theme text-white">
              <h5 className="mb-0 text-white">
                <i className="ti ti-building me-2 text-white"></i>
                {currentCampaign.name} - Live Metrics
              </h5>
              <div className="d-flex align-items-center gap-2">
                {selectedCompaign === 'All Compaigns' && (
                  <span className=" small text-white">
                    Showing {currentCampaignIndex + 1} of {campaigns.length} compaigns
                  </span>
                )}
                {/* {isAutoCycling && selectedCompaign === 'All Compaigns' && (
                  <span className="badge bg-success">
                    <i className="ti ti-rotate-clockwise me-1"></i>
                    Auto-cycling every 5s
                  </span>
                )} */}
              </div>
            </div>
            <div className={`card-body ${isSliding ? 'slide-out' : 'slide-in'}`}>

                  {showThresholdAlert && (
                    <div className="row align-items-center justify-content-center text-center">
                          <Col md={10}>
                           <div className="alert alert-danger alert-danger-animation">
                                 <p className="mb-0">
                                       <b>Alert:</b> Service Level Threshold is {serviceLevelThreshold}% and Queue Threshold is {queueThreshold}%
                                 </p>
                           </div>
                          </Col>
                    </div>
                  )}
              
              
              
              <Row>
                <Col md={3}>
                  <div className="card">
                    <div className="card-body text-center">
                      <h5 className="card-title">Agent on Call</h5>
                      <AnimatedNumber value={currentCampaign.data.agentOnCall} textColor='text-success'/>
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="card">
                    <div className="card-body text-center">
                      <h5 className="card-title">Agent Idle</h5>
                      <AnimatedNumber value={currentCampaign.data.agentIdle} textColor='text-warning'/>
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="card">
                    <div className="card-body text-center">
                      <h5 className="card-title">Longest Wait</h5>
                      <AnimatedNumber value={currentCampaign.data.longestWait} textColor='text-danger' valueType='seconds'/>
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="card">
                    <div className="card-body text-center">
                      <h5 className="card-title">Service Level</h5>
                      <AnimatedNumber value={currentCampaign.data.serviceLevel} textColor='text-primary' suffix='%'/>
                    </div>
                  </div>
                </Col>


                <Col md={12} className=''>
                  <Row className=''>
                    <Col md={9}>

                    <Row>
                      <Col md={12}>
                      <h5>{currentCampaign.name}</h5>
                      <div className="compaign-description mb-3">
                        <ul>
                          <li>Manual</li>
                          <li>Agent:8</li>
                          <li>AHT:310S</li>
                        </ul>
                      </div>
                      </Col>
                      <Col md={3}>
                        <div className="card">
                          <div className="card-body text-center">
                            <h5 className="card-title">CPH</h5>
                            <AnimatedNumber value={currentCampaign.data.cph} textColor='text-success'/>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md={3}>
                        <div className="card">
                          <div className="card-body text-center">
                            <h5 className="card-title">Success</h5>
                            <AnimatedNumber value={currentCampaign.data.success} textColor='text-primary' suffix='%'/>
                          </div>
                        </div>
                      </Col>

                      <Col md={3}>
                      <div className="card">
                          <div className="card-body text-center">
                            <h5 className="card-title">Abandon</h5>
                            <AnimatedNumber value={currentCampaign.data.abandon} textColor='text-primary' suffix='%'/>
                          </div>
                        </div>
                      </Col>

                      <Col md={3}>
                        <div className="card">
                          <div className="card-body text-center">
                            <h5 className="card-title">Trend</h5>
                            <h2 className={`mb-0 f-w-500`}>{currentCampaign.data.trend || '---'}</h2>
                          </div>
                        </div>
                      </Col>



                      </Row>
                    </Col>
                    <Col md={3}>
                    <div className="manual-outbound">
                      <h5>Manual Outbound</h5>
                    <div className="compaign-description mb-3">
                        <ul>
                          <li>Manual</li>
                          <li>Agent:{currentCampaign.data.manualOutbound.agent}</li>
                          <li>AHT:{currentCampaign.data.manualOutbound.aht}S</li>
                        </ul>
                      </div>

                      <Col md={9}>
                      <div className="card">
                          <div className="card-body text-center">
                            <h5 className="card-title">CPH</h5>
                            <h2 className={`mb-0 f-w-500`}>{currentCampaign.data.manualOutbound.cph}</h2>
                          </div>
                        </div>
                        </Col>



                    </div>
                    </Col>
                  </Row>
                </Col>


                <Col md={12}>
                {/* Navigation Dots for Campaigns */}
                {selectedCompaign === 'All Compaigns' && (
                    <div className="campaign-navigation d-flex align-items-center gap-2">
                      {/* <Button
                        variant="outline-light"
                        size="sm"
                        onClick={() => {
                          setCurrentCampaignIndex((prevIndex) => 
                            prevIndex === 0 ? campaigns.length - 1 : prevIndex - 1
                          );
                        }}
                        title="Previous Campaign"
                      >
                        <i className="ti ti-chevron-left"></i>
                      </Button> */}
                      
                       <div className="navigation-dots d-flex gap-2 justify-content-center">
                        {campaigns.map((_, index) => (
                          <button
                            key={index}
                            className={`dot ${index === currentCampaignIndex ? 'active' : ''}`}
                            onClick={() => handleCampaignIndexChange(index)}
                            title={`Go to ${campaigns[index].name}`}
                          />
                        ))}
                      </div>
                      
                      {/* <Button
                        variant="outline-light"
                        size="sm"
                        onClick={() => {
                          setCurrentCampaignIndex((prevIndex) => 
                            prevIndex === campaigns.length - 1 ? 0 : prevIndex + 1
                          );
                        }}
                        title="Next Campaign"
                      >
                        <i className="ti ti-chevron-right"></i>
                      </Button> */}
                    </div>
                  )}
                </Col>
              </Row>


              <Row>
                  
                  <Col md={3}>
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">Live Agents Status</h5>
                         <div className="form-live-agent-status">
                           <form className="d-flex gap-1 align-items-center mb-1">
                             <div className="form-group flex-grow-1">
                               <input type="text" className="form-control form-control-sm" id="agent-name" placeholder="Search Agent" />
                             </div>
                             <div className="form-group flex-grow-1">
                                   <Select
                                 options={[{value: 'all', label: 'All'}, {value: 'on-call', label: 'On Call'}, {value: 'idle', label: 'Idle'}, {value: 'online', label: 'Online'}]}
                                className='form-select-sm'
                                classNamePrefix="react-select"
                                 id="agent-status"
                                 placeholder="Status"
                                 
                               />
                             </div>
                           </form>
                         </div>
                        <div className=" table-live-agents">
                          <table className="table table-bordered table-sm">
                            <thead>
                              <tr>
                                <th>Agent</th>
                                <th>Status</th>
                                <th>Compaign</th>
                              </tr>
                            </thead>
                            <tbody> 
                              
                              <tr onClick={() => setAgentModelShow(true)}>
                                <td><span className="bg-success statusBox"> </span> John Doe</td>
                                <td>On Call</td>
                                <td>Compaign 1</td>
                              </tr>

                              <tr onClick={() => setAgentModelShow(true)}>
                                <td><span className="bg-warning statusBox"> </span> Jane Doe</td>
                                <td>Idle</td>
                                <td>Compaign 1</td>
                              </tr>
                              <tr onClick={() => setAgentModelShow(true)}>
                                <td><span className="bg-info statusBox"> </span> Jim Doe</td>
                                <td>Online</td>
                                <td>Compaign 1</td>
                              </tr>



                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                  <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">Live Calls</h5>
                        <div className=" table-live-agents">
                          <table className="table table-bordered table-sm">
                              <thead>
                                    <tr>
                                          <th className="text-left">Agent</th>
                                          <th className="text-center">Customer</th>
                                          <th className="text-center">Compaign</th>
                                          <th className="text-center">Duration</th>
                                          </tr>
                              </thead>
                                          
                                          <tbody>
                                                <tr>
                                                      <td className="text-left text-bold">Agent 1</td>
                                                      <td className="text-center">Customer 1</td>
                                                      <td className="text-center">Compaign 1</td>
                                                      <td className="text-center">3m 4s</td>
                                                </tr>
                                                <tr>
                                                      <td className="text-left text-bold">Agent 2</td>
                                                      <td className="text-center">Customer 2</td>
                                                      <td className="text-center">Compaign 2</td>
                                                      <td className="text-center">3m 4s</td>
                                                </tr>
                                                <tr>
                                                      <td className="text-left text-bold">Agent 3</td>
                                                      <td className="text-center">Customer 3</td>
                                                      <td className="text-center">Compaign 3</td>
                                                      <td className="text-center">3m 4s</td>
                                                </tr>
                                                
                                          </tbody>
                                          </table>
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col md={3}>
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">Analytics & Alerts</h5>

                        <div className="donut-chart">
                          <div className="card pt-2 pb-2">
                            <ReactApexChart options={donutChart.options} series={donutChart.series} type="donut" />
                          </div>
                        </div>

                        <div className="call-per-hour-chart">
                          <div className="card pt-2 pb-2">
                            <ReactApexChart options={callPerHourChart.options} series={callPerHourChart.series} type="area" />
                          </div>
                        </div>

                        <div className="thresh-hold-for-calls">
                       
                          <div className="form-group mb-3">
                            <label htmlFor="service-level-threshold" className="form-label">Service Level Threshold: {serviceLevelThreshold}%</label>
                            <input 
                              type="range" 
                              className="form-range" 
                              id="service-level-threshold" 
                              min="0" 
                              max="100" 
                              value={serviceLevelThreshold} 
                              onChange={(e) => setServiceLevelThreshold(Number(e.target.value))} 
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="queue-threshold" className="form-label">Queue Threshold: {queueThreshold}%</label>
                            <input 
                              type="range" 
                              className="form-range" 
                              id="queue-threshold" 
                              min="0" 
                              max="100" 
                              value={queueThreshold} 
                              onChange={(e) => setQueueThreshold(Number(e.target.value))} 
                            />
                          </div>
                        </div>


                               <div className="realtime-alerts mt-3">
                                     <h5 className="card-title mb-2">Realtime Alerts</h5>
                               {alerts.filter(alert => alert.visible).map(alert => (
                                 <div key={alert.id} className={`alert alert-${alert.type}`}>
                                   <p className="mb-0"><b>{alert.title}:</b> {alert.message}</p>
                                 </div>
                               ))}
                               </div>
                          
                      </div>
                    </div>
                  </Col>




              </Row>


              <Row className='compaign-performance'>

                <Col md={12} className='mb-3 text-center'>
                  <h3 className="card-title">Compaign Performance</h3>
                  <p className="text-muted">
                    {currentCampaign.name}
                  </p>
                 
                </Col>


                <Col md={10} className=' justify-content-center'>

                <Row>
                <Col md={3}>
                  <div className="card">
                    <div className="card-body text-center">
                    <AnimatedNumber value={currentCampaign.data.performance.calls_per_hour} textColor='text-success'/>
                      <h5 className="card-title">Calls/Hour</h5>
                    </div>
                  </div>
                </Col>

                <Col md={3}>
                  <div className="card">
                    <div className="card-body text-center">
                      
                      <AnimatedNumber value={currentCampaign.data.performance.success_rate} textColor='text-primary' suffix='%'/>
                      <h5 className="card-title">Success Rate</h5>
                    </div>
                  </div>
                </Col>

                <Col md={3}>
                  <div className="card">
                    <div className="card-body text-center">
                      
                      <AnimatedNumber value={currentCampaign.data.performance.abandon_rate} textColor='text-primary' suffix='%'/>
                      <h5 className="card-title">Abandon Rate</h5>
                    </div>
                  </div>
                </Col>


               
                <Col md={3}>
                  <div className="card">
                    <div className="card-body text-center">
                      
                      <AnimatedNumber value={currentCampaign.data.performance.avg_handle_time} textColor='text-danger' valueType='seconds'/>
                      <h5 className="card-title">Avg Handle Time</h5>
                    </div>
                  </div>
                </Col>
                </Row>

                </Col>
                

                </Row>






            </div>
          </div>
        </Col>
      </Row>


      {agentModelShow && (
        <Modal 
          size='lg'
        className='agent-model-modal'
          show={agentModelShow}
          onHide={() => setAgentModelShow(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Alice</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="agent-model-content">
              <p>Compaign: <b>Sales Q3</b></p>

              <Row>
              <Col md={4}>
                  <div className="card card-bg-light-gray">
                    <div className="card-body text-center">
                      <h5 className="card-title">Calls Handled</h5>
                      <AnimatedNumber value={agentInfo.handledCalls} 
                      textColor='text-success'
                      />
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="card card-bg-light-gray">
                    <div className="card-body text-center">
                      <h5 className="card-title">CSAT Score</h5>
                      <AnimatedNumber value={agentInfo.csatScore} suffix='%' 
                      textColor='text-warning'
                      />
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="card card-bg-light-gray">
                    <div className="card-body text-center">
                      <h5 className="card-title">AHT</h5>
                      <AnimatedNumber value={agentInfo.aht} 
                      textColor='text-danger' 
                      valueType='seconds'/>
                    </div>
                  </div>
                </Col>
              </Row>

              <h4 className='mb-3 text-capitalize'>Today's activity breakdown</h4>
              <Row>
              <Col md={3}>
                  <div className="card card-bg-light-gray">
                    <div className="card-body text-center">
                      <h6 className=" text-muted">On Call</h6>
                      <AnimatedNumber value={agentInfo.activity.onCall} 
                      //textColor='text-success' 
                      size='sm'/>
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="card card-bg-light-gray">
                    <div className="card-body text-center">
                      <h6 className=" text-muted">Idle</h6>
                      <AnimatedNumber value={agentInfo.activity.idle} valueType='seconds' 
                      //textColor='text-warning'
                       size='sm'/>
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="card card-bg-light-gray">
                    <div className="card-body text-center">
                      <h6 className=" text-muted">ACW</h6>
                      <AnimatedNumber value={agentInfo.activity.acw} 
                      //textColor='text-danger' 
                      valueType='seconds' size='sm'/>
                    </div>
                  </div>
                </Col>

                <Col md={3}>
                  <div className="card card-bg-light-gray">
                    <div className="card-body text-center">
                      <h6 className=" text-muted">Break</h6>
                      <AnimatedNumber value={agentInfo.activity.break} 
                      //textColor='text-danger' 
                      valueType='seconds' size='sm'/>
                    </div>
                  </div>
                </Col>


                <Col md={12}>
                <div className="button-group d-flex gap-2 justify-content-end">
                  <Button variant="success">Listen Me</Button>
                  <Button variant="primary">Wishper</Button>
                  <Button variant="danger">Barge In</Button>
                </div>
                </Col>
              </Row>
            
            </div>
          </Modal.Body>


        </Modal>
      )}

      

    </>
  );
};

CtiMonitoring.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CtiMonitoring;