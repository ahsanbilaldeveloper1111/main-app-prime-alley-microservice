import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListCallLogs, ExportCallLogs } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row, Tab, Tabs } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import CallLogsFilters from '@components/filters/CallLogsFilters';
import AnimatedNumber from '@components/AnimatedNumber';
import EmptyState from '@components/EmptyState';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import moment from 'moment';
import Link from 'next/link';
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { motion } from "framer-motion";


interface Summary {
    users: number;
    extensions: number;
    inbound: number;
    outbound: number;
}

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface GeneralStats {
    totalCalls: number;
    totalInbound: number;
    totalOutbound: number;
    totalMissedIncoming: number;
    totalMissedOutgoing: number;
    totalAvgRingTime: number;
    totalAvgDuration: number;
    totalAvgCost: number;
}

interface TrendByCountry {
  CallDate: string;
  StartHour: string;
  Country: string;
  IsCountryTotal: string;
  Calls: string;
  Unanswered: string;
  Answered: string;
  AvgRingTime: string;
  MaxRingTime: string;
  TotalDuration: string;
  AvgDuration: string;
  Duration: string;
  Cost: string;
  AvgCost: string;
}

const CallDashboard = () => {
    const { data:session, status } = useSession();
    const [loading, setLoading] = useState(false);
    //const loadingBar = useRef<any>(null); // Removed as per edit hint


    const [sampleChart, setSampleChart] = React.useState({
          
        series: [{
          data: [400, 430, 448,970,980]
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
            }
          },
          legend: {
            show: false
          },
          dataLabels: {
            enabled: false
          },
          tooltip: {
            enabled: true,
            y: {
                title: {
                    formatter: function(value: number) {
                        return value + ' calls';
                    }
                }
            }
           
          },
          xaxis: {
            
            categories: ['140', '150', '160', '170', '180'],
          },
          yaxis: {
            show: false,

            title: {
              text: 'Extensions', 
              show: false,
              style: {
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#263238',
                marginRight: '10px'
              }
            }
          }
        },
    });


    const [sampleCountryChart, setSampleCountryChart] = React.useState({
          
        series: [{
          data: [400, 430, 448,970,980]
        }],
        options: {
          chart: {
            type: 'bar' as const,
            toolbar: {
              show: false
            },
            
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
            show: false
          },
          dataLabels: {
            enabled: false
          },
          xaxis: {
            categories: ['United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand'],
          },
          yaxis: {
            
            title: {

              text: '', // <-- Your custom label here
              style: {
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#263238',
                marginRight: '10px'
              }
            }
          }
        },
    });

    const [sampleDepartmentChart, setSampleDepartmentChart] = React.useState({
      series: [{
            name: 'Shortest',
            data: [20, 34, 23, 34, 53]
          }, {
            name: 'Longest',
            data: [76, 85, 101, 98, 87]
          }, {
            name: 'Avg Duration',
            data: [30, 40, 60, 80, 60]
          }],
          options: {
            chart: {
              type: 'bar',
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
              categories: ['Ocean_LAX', 'Ocean_HKG', 'Ocean_SFO', 'Ocean_LHR', 'Ocean_ISL'],

            },
            yaxis: {
              //show: false,
              title: {
                text: ''
              }
            },
            fill: {
              opacity: 1
            },
            
          },
    });  
    
    const [callDirectionTwo, setCallDirectionTwo] = React.useState({
          
      series: [{
        name: 'Inbound',
        data: [44, 55, 57]
      },{
        name: 'Outbound',
        data: [35, 41, 36]
      }],
      options: {
        chart: {
          type: 'bar' as const,
          height: 200,
          toolbar: {
            show: false
          }
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 5,
            borderRadiusApplication: 'end' as const
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
          categories: ['Apr', 'May', 'Jun'],
        },
        yaxis: {
          title: {
            text: 'Calls'
          }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: function (val: any) {
              return val + ' calls'
            }
          }
        }
      },
    
    
  });

  const [callDurationBarChart, setCallDurationBarChart] = React.useState({
      series: [{
        name: 'Short',
        data: [44, 55, 41,12,45]
      },  {
        name: 'Long',
        data: [53, 32, 33,45,34]
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
            horizontal: true,
            dataLabels: {
              show: true,
              position: 'top',
            },
          }
        },
        dataLabels: {
          enabled: false,
          
        },
        stroke: {
          show: true,
          width: 1,
          colors: ['#fff']
        },
        tooltip: {
          shared: false,
          intersect: false
        },
        xaxis: {
          categories: [123, 32, 231,123,422],
        },
        yaxis: {
          title: {
            text: '',
        
          },
          
        },
        legend: {
          position: 'bottom' as const,
          horizontalAlign: 'center' as const,
          offsetX: 40
        }
      },
    });

    const [simpleDonut, setSimpleDonut] = React.useState({
          
        series: [44, 55, 41],
        options: {

          chart: {
            type: 'donut',
          },
          labels: [
            'Avg Answered',
            'Avg Unanswered',
            'Avg Missed'
          ],
          responsive: [{
            breakpoint: 480,
            options: {
              chart: {
                width: 200
              },
              legend: {
                position: 'bottom'
              }
            }
          }]
        },
      
      
    });

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({
      start_datetime: moment().subtract(24, 'hours').format('YYYY-MM-DD hh:mm:ss A'),
      end_datetime: moment().format('YYYY-MM-DD hh:mm:ss A'),
    });
    const [generalStats, setGeneralStats] = useState<GeneralStats>({
        totalCalls: 0,
        totalInbound: 0,
        totalOutbound: 0,
        totalMissedIncoming: 0,
        totalMissedOutgoing: 0,
        totalAvgRingTime: 0,
        totalAvgDuration: 0,
        totalAvgCost: 0,
    });

    const [perPage, setPerPage] = useState(5);
    const [page, setPage] = useState(1);

    const [showExtensionChart, setShowExtensionChart] = useState(true);
    const [showDepartmentChart, setShowDepartmentChart] = useState(true);
    const [showCountryChart, setShowCountryChart] = useState(true);

    useEffect(() => {
        fetchGeneralStats();
    }, []);
    const fetchGeneralStats = async () => {
      const response = await ListCallLogs({ page:  page, perPage: perPage, search: "", filters: currentFilters,reportType: 'statsDashboard' }, 'call-logs/generalStats');
      setGeneralStats({
          totalCalls: response.total_calls,
          totalInbound: response.inbound_calls,
          totalOutbound: response.outbound_calls,
          totalMissedIncoming: response.missed_incoming_calls,
          totalMissedOutgoing: response.missed_outgoing_calls,
          totalAvgRingTime: response.avg_ring_time,
          totalAvgDuration: response.avg_duration,
          totalAvgCost: response.avg_cost,
      });

      const chartExtension = response?.extension;
      if(chartExtension){
        setShowExtensionChart(true);
      }
      const chartDepartment = response?.department;
      if(chartDepartment){
        setShowDepartmentChart(true);
      }
      const chartCountry = response?.country;
      if(chartCountry){
        setShowCountryChart(true);
      }

  };


    const [showStatsByExtensionTable, setShowStatsByExtensionTable] = useState(true);
    const [trendByCountryData, setTrendByCountryData] = useState<TrendByCountry[]>([]);
    const [extensionData, setExtensionData] = useState<any[]>([]);
    useEffect(() => {
      fetchExtensionStats();
  }, []);
  const fetchExtensionStats = async () => {
    const response = await ListCallLogs({ page:  page, perPage: perPage, search: "", filters: currentFilters,reportType: 'statsExtension' }, 'call-logs/statsByExtension');
    if(response?.dataList?.length > 0){
      setExtensionData(response?.dataList);
    } else {
      setExtensionData([]);
    }
};

  const [showTrendByCountryTable, setShowTrendByCountryTable] = useState(true);
  useEffect(() => {
    fetchTrendByCountryStats();
  }, []);

  const fetchTrendByCountryStats = async () => {
    const response = await ListCallLogs({ page:  page, perPage: perPage, search: "", filters: currentFilters,reportType: 'trendStatsCountry' }, 'call-logs/statsTrendByCountry');
    if(response?.dataList?.length > 0){
      setTrendByCountryData(response?.dataList);
    }
  };

   

    const handleFiltersChange = (filters: any) => {
        setCurrentFilters(filters);
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
        try {
            const response = await ExportCallLogs({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
            //console.log(response);
        } catch (error) {
            //console.error('Export error:', error);
            toast.error('Export failed. Please try again.');
        }
    };

    const refreshData = async () => {
      setLoading(true);
      NProgress.start();
      await fetchGeneralStats();
      await fetchExtensionStats();
      await fetchTrendByCountryStats();
      setLoading(false);  
      NProgress.done();
    }

    useEffect(() => {
        const fetchHierarchyData = async () => {
            const hierarchyData = await GetHierarchyData();
            //console.log(hierarchyData);
        };
        fetchHierarchyData();
    }, []);

    const formatDuration = (duration: number) => {
      if (!duration) return '00:00:00';
      const totalSeconds = Math.floor(Number(duration));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    };
    
    return (
        <React.Fragment>
            {/* Removed LoadingBar component */}
            <BreadcrumbItem mainTitle="Call Logs" mainLink="/call-logs/dashboard" subTitle="Call Dashboard" />


            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <Row className="align-items-center">
                    <Col md={4}>
                      <h3 className="mb-0 d-flex align-items-center">
                        Call Dashboard
                      </h3>
                    </Col>
                    <Col md={8} className="d-flex justify-content-end">
                      <div className="d-flex align-items-center gap-2">
                          <p className="mb-0">
                          Date Range: <span className="badge bg-info">{moment(currentFilters.start_datetime).format('DD-MM-YYYY hh:mm:ss A')}</span> to <span className="badge bg-info">{moment(currentFilters.end_datetime).format('DD-MM-YYYY hh:mm:ss A')}</span>
                          </p>
                          <i className="material-icons-two-tone" style={{cursor: 'pointer'}} onClick={() => refreshData()}>refresh</i>
                        </div>
                    </Col>
                    
                  </Row>
               
                
                </div>
            </Col>
            </Row>


            <Row>
                        <Col md={3}>

                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * 0 }}
                        >
                        <div className="card statistics-card-1">
                              <div className="card-body">
                                    <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                                    <div className="d-flex align-items-center">
                                          <div className="avtar bg-brand-color-1 text-white me-2">
                                          <i className="material-icons-two-tone text-white">phone</i>
                                          </div>
                                          <div>
                                                <p className="text-muted mb-0">Total Calls</p>
                                                <div className="d-flex align-items-end">
                                                      {generalStats.totalCalls > 0 ? <AnimatedNumber value={generalStats.totalCalls} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                        </motion.div>


                        </Col>

                        <Col md={3}>
                         <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * 1 }}
                        >
                         <div className="card statistics-card-1">
                              <div className="card-body">
                                    <img src={imgStatus2.src} alt="img" className="img-fluid img-bg" />
                                    <div className="d-flex align-items-center">
                                          <div className="avtar bg-brand-color-1 text-white me-2">
                                          <i className="material-icons-two-tone text-white">phone_in_talk</i>
                                          </div>
                                          <div>
                                                <p className="text-muted mb-0">Inbound</p>
                                                <div className="d-flex align-items-end">
                                                      {generalStats.totalInbound > 0 ? <AnimatedNumber value={generalStats.totalInbound} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                        </motion.div>
                        </Col> 

                        <Col md={3}>
                         <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * 2 }}
                        >
                         <div className="card statistics-card-1">
                              <div className="card-body">
                                    <img src={imgStatus2.src} alt="img" className="img-fluid img-bg" />
                                    <div className="d-flex align-items-center">
                                          <div className="avtar bg-brand-color-1 text-white me-2">
                                          <i className="material-icons-two-tone text-white">phone_in_talk</i>
                                          </div>
                                          <div>
                                                <p className="text-muted mb-0">Outbound</p>
                                                <div className="d-flex align-items-end">
                                                      {generalStats.totalOutbound > 0 ? <AnimatedNumber value={generalStats.totalOutbound} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                        </motion.div>
                        </Col> 

                        <Col md={3}>
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * 3 }}
                        >
                        <div className="card statistics-card-1">
                              <div className="card-body">
                                    <img src={imgStatus4.src} alt="img" className="img-fluid img-bg" />
                                    <div className="d-flex align-items-center">
                                          <div className="avtar bg-brand-color-1 text-white me-2">
                                          <i className="material-icons-two-tone text-white">phone_missed</i>
                                          </div>
                                          <div>
                                                <p className="text-muted mb-0">Missed Incoming</p>
                                                <div className="d-flex align-items-end">
                                                      {generalStats.totalMissedIncoming > 0 ? <AnimatedNumber value={generalStats.totalMissedIncoming} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                        </motion.div>
                        </Col> 

                        <Col md={3}>
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * 4 }}
                        >
                        <div className="card statistics-card-1">
                              <div className="card-body">
                                    <img src={imgStatus4.src} alt="img" className="img-fluid img-bg" />
                                    <div className="d-flex align-items-center">
                                          <div className="avtar bg-brand-color-1 text-white me-2">
                                          <i className="material-icons-two-tone text-white">phone_missed</i>
                                          </div>
                                          <div>
                                                <p className="text-muted mb-0">Missed Outgoing</p>
                                                <div className="d-flex align-items-end">
                                                      {generalStats.totalMissedOutgoing > 0 ? <AnimatedNumber value={generalStats.totalMissedOutgoing} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                        </motion.div>
                        </Col> 

                        <Col md={3}>
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * 5 }}
                        >
                        <div className="card statistics-card-1">
                              <div className="card-body">
                                    <img src={imgStatus4.src} alt="img" className="img-fluid img-bg" />
                                    <div className="d-flex align-items-center">
                                          <div className="avtar bg-brand-color-1 text-white me-2">
                                          <i className="material-icons-two-tone text-white">phonelink_ring</i>
                                          </div>
                                          <div>
                                                <p className="text-muted mb-0">Avg Ring Time</p>
                                                <div className="d-flex align-items-end">
                                                      {generalStats.totalAvgRingTime > 0 ? <AnimatedNumber value={generalStats.totalAvgRingTime} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                        </motion.div>
                           
                        </Col> 

                        <Col md={3}>
                            
                            <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * 6 }}
                        >
                            <div className="card statistics-card-1">
                              <div className="card-body">
                                    <img src={imgStatus4.src} alt="img" className="img-fluid img-bg" />
                                    <div className="d-flex align-items-center">
                                          <div className="avtar bg-brand-color-1 text-white me-2">
                                          <i className="material-icons-two-tone text-white">timeline</i>
                                          </div>
                                          <div>
                                                <p className="text-muted mb-0">Avg Duration</p>
                                                <div className="d-flex align-items-end">
                                                      {generalStats.totalAvgDuration > 0 ? <AnimatedNumber value={generalStats.totalAvgDuration} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                        </motion.div>
                        </Col> 
                        <Col md={3}>
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * 7 }}
                        >
                        <div className="card statistics-card-1">
                              <div className="card-body">
                                    <img src={imgStatus4.src} alt="img" className="img-fluid img-bg" />
                                    <div className="d-flex align-items-center">
                                          <div className="avtar bg-brand-color-1 text-white me-2">
                                          <i className="material-icons-two-tone text-white">payments</i>
                                          </div>
                                          <div>
                                                <p className="text-muted mb-0">Avg Cost</p>
                                                <div className="d-flex align-items-end">
                                                      {generalStats.totalAvgCost > 0 ? <AnimatedNumber value={generalStats.totalAvgCost} duration={1000} /> : <h2 className="mb-0 f-w-500">0</h2>}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                        </motion.div>
                        </Col> 
            </Row>

            <Row>
                {showCountryChart && (
                <Col md={4}>
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Call by Country</h5>
                        </div>
                        <div className="card-body">
                            {trendByCountryData.length === 0 ? (
                                <EmptyState
                                    title="No Call by Country Data"
                                    description="Chart data will appear here when available."
                                    className="table-empty-state"
                                />
                            ) : (
                                <ReactApexChart options={sampleCountryChart.options as ApexOptions} series={sampleChart.series} type="bar" height={200} />
                            )}
                        </div>
                    </div>
                </Col>
                )}

                {showDepartmentChart && (
                <Col md={4}>
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Call by Department</h5>
                        </div>
                        <div className="card-body">
                            <EmptyState
                                title="No Call by Department Data"
                                description="Chart data will appear here when available."
                                className="table-empty-state"
                            />
                        </div>
                    </div>
                </Col>
                )}

                {showExtensionChart && (
                <Col md={4}>
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Call by Extension</h5>
                        </div>
                        <div className="card-body">
                            {extensionData.length === 0 ? (
                                <EmptyState
                                    title="No Call by Extension Data"
                                    description="Chart data will appear here when available."
                                    className="table-empty-state"
                                />
                            ) : (
                                <ReactApexChart options={callDurationBarChart.options} series={callDurationBarChart.series} type="bar" height={200} />
                            )}
                        </div>
                    </div>
                </Col>
                )}
            </Row>

            <Row>
              {showStatsByExtensionTable && (
                <Col md={6}>
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Call by Extension</h5>
                        </div>
                        <div className="card-body">

                        {extensionData.length === 0 ? (
                                        <EmptyState
                                            title="No Call by Extension Data"
                                            description="List of call by extension data will appear here."
                                            isTableRow={true}
                                            colSpan={6}
                                        />
                                    ) : (
                                      <div>
                                        <table className="table table-bordered table-striped table-sm ">
                                      <thead>
                                        <tr>
                                          <th>Extension</th>
                                          <th>Calls</th>
                                          <th>Answered</th>
                                          <th>Un Answered</th>
                                          <th>Duration</th>
                                          <th>Cost</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                      {extensionData.map((item, index) => (
                                                <tr key={index}>
                                                  <td>{item.Extension}</td>
                                                  <td>{item.Calls}</td>
                                                  <td>{item.Answered}</td>
                                                  <td>{item.Unanswered}</td>
                                                  <td>{formatDuration(Number(item.TotalDuration))}</td>
                                                  <td>{parseFloat(item.Cost).toFixed(2)}</td>
                                                </tr>
                                                ))
                                          }
                                      </tbody>
                                    </table>
                                    <div className="d-flex justify-content-center">
                                          <Link href="/call-reports/stats/extension" className="link-primary">View All</Link>
                                    </div>
                                      </div>
                                    )}

                              
                        </div>
                    </div>
                </Col>
              )}

              {showTrendByCountryTable && (
                <Col md={6}>
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Call Trend by Country</h5>
                        </div>
                        <div className="card-body">

                        {trendByCountryData.length === 0 ? (
                                        <EmptyState
                                            title="No Call Trend by Country Data"
                                            description="List of call trend by country data will appear here."
                                            isTableRow={true}
                                            colSpan={6}
                                        />
                                    ) : ( 
                                      <div>
                                       <table className="table table-bordered table-striped table-sm ">
                                <thead>
                                  <tr>
                                    <th>Country</th>
                                    <th>Calls</th>
                                    <th>Answered</th>
                                    <th>Un Answered</th>
                                    <th>Duration</th>
                                    <th>Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                    {trendByCountryData.map((item, index) => (
                                          <tr key={index}>
                                            <td>{item.Country}</td>
                                            <td>{item.Calls}</td>
                                            <td>{item.Answered}</td>
                                            <td>{item.Unanswered}</td>
                                            <td>{formatDuration(Number(item.TotalDuration))}</td>
                                            <td>{parseFloat(item.Cost).toFixed(2)}</td>
                                          </tr>
                                        ))
                                    }
                                </tbody>
                              </table>
                              <div className="d-flex justify-content-center">
                                    <Link href="/call-reports/trend/country" className="link-primary">View All</Link>
                              </div>
                                      </div>
                                    )}
                          
                              
                        </div>
                    </div>
                </Col>
              )}
            </Row>
            

        
        </React.Fragment>
    );
};

CallDashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallDashboard;
