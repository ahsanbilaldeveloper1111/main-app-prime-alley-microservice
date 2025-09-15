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

    const [countryChartData, setCountryChartData] = useState<any[]>([]);
    const [departmentChartData, setDepartmentChartData] = useState<any[]>([]);
    const [extensionChartData, setExtensionChartData] = useState<any[]>([]);

    useEffect(() => {
        fetchGeneralStats();
    }, []);
    const fetchGeneralStats = async () => {
      const response = await ListCallLogs({ page:  page, perPage: perPage, search: "", filters: currentFilters,reportType: 'statsDashboard' }, 'call-logs/generalStats');

      if(response.success){
        const responseData = response.data;
      
      setGeneralStats({
          totalCalls: responseData.total_calls,
          totalInbound: responseData.inbound_calls,
          totalOutbound: responseData.outbound_calls,
          totalMissedIncoming: responseData.missed_incoming_calls,
          totalMissedOutgoing: responseData.missed_outgoing_calls,
          totalAvgRingTime: responseData.avg_ring_time,
          totalAvgDuration: responseData.avg_duration,
          totalAvgCost: responseData.avg_cost,
      });

      // Extract and map chart data
      const chartExtension = responseData?.chart_data?.extension;
      if(chartExtension){
        setShowExtensionChart(true);
        setExtensionChartData(chartExtension);
        
        // Map extension data to chart format
        const extensionLabels = chartExtension.map((item: any) => item.label || 'Unknown');
        const shortestData = chartExtension.map((item: any) => item.shortest ? parseInt(item.shortest) : 0);
        const longestData = chartExtension.map((item: any) => item.longest ? parseInt(item.longest) : 0);
        
        setExtensionChart({
          series: [{
            name: 'Shortest',
            data: shortestData
          }, {
            name: 'Longest', 
            data: longestData
          }],
          options: {
            ...ExtensionChart.options,
            xaxis: {
              ...ExtensionChart.options.xaxis,
              categories: extensionLabels
            }
          }
        });
      }
      
      const chartDepartment = responseData?.chart_data?.department;
      if(chartDepartment){
        setShowDepartmentChart(true);
        setDepartmentChartData(chartDepartment);
        
        // Map department data to chart format
        const departmentLabels = chartDepartment.map((item: any) => item.label || 'Unknown');
        const shortestData = chartDepartment.map((item: any) => item.shortest ? parseInt(item.shortest) : 0);
        const longestData = chartDepartment.map((item: any) => item.longest ? parseInt(item.longest) : 0);
        const averageData = chartDepartment.map((item: any) => item.average ? parseInt(item.average) : 0);
        
        setDepartmentChart({
          series: [{
            name: 'Shortest',
            data: shortestData
          }, {
            name: 'Longest',
            data: longestData
          }, {
            name: 'Average',
            data: averageData
          }],
          options: {
            ...DepartmentChart.options,
              xaxis: {
                ...DepartmentChart.options.xaxis,
                categories: departmentLabels as string[]
              },
            yaxis: {
              ...DepartmentChart.options.yaxis,
              
            },
            chart: {
              ...DepartmentChart.options.chart
            },
            plotOptions: {
              bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 4,
                borderRadiusApplication: 'end'
              }
            },
            dataLabels: {
              enabled: false,
            }
          }
        });
      }
      
      const chartCountry = responseData?.chart_data?.country;
      if(chartCountry){
        setShowCountryChart(true);
        setCountryChartData(chartCountry);
        
        // Map country data to chart format
        const countryLabels = chartCountry.map((item: any) => item.label || 'Unknown');
        const averageData = chartCountry.map((item: any) => item.average ? parseInt(item.average) : 0);
        
        setCountryChart({
          series: [{
            data: averageData
          }],
          options: {
            ...CountryChart.options,
            xaxis: {
              ...CountryChart.options.xaxis,
              categories: countryLabels
            }
          }
        });
      }
    }

  };

  const [CountryChart, setCountryChart] = React.useState({
          
    series: [{
      data: [] as number[]
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
        categories: [] as string[],
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

const [DepartmentChart, setDepartmentChart] = React.useState({
  series: [] as any[],
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
          categories: [] as string[],
          labels: {
            show: true,
            style: {
              fontSize: '8px',
             
            }
          }

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

const [ExtensionChart, setExtensionChart] = React.useState({
  series: [] as any[],
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
      categories: [] as string[],
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
                            {countryChartData.length === 0 ? (
                                <EmptyState
                                    title="No Call by Country Data"
                                    description="Chart data will appear here when available."
                                    className="table-empty-state"
                                />
                            ) : (
                                <ReactApexChart options={CountryChart.options as ApexOptions} series={CountryChart.series} type="bar" height={200} />
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
                            

                            {departmentChartData.length === 0 ? (
                                <EmptyState
                                  title="No Call by Department Data"
                                  description="Chart data will appear here when available."
                                  className="table-empty-state"
                              />
                            ) : (
                                <ReactApexChart options={DepartmentChart.options as ApexOptions} series={DepartmentChart.series} type="bar" height={200} />
                            )}
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
                            {extensionChartData.length === 0 ? (
                                <EmptyState
                                    title="No Call by Extension Data"
                                    description="Chart data will appear here when available."
                                    className="table-empty-state"
                                />
                            ) : (
                                <ReactApexChart options={ExtensionChart.options} series={ExtensionChart.series} type="bar" height={200} />
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
                                      <div className="table-responsive">
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
                                      <div className="table-responsive">
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
