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
import { formatDateTimeToLocal, GlobalDateTimeFormat, ModuleSlug } from '@utils/Helper';
import '@assets/scss/common.scss';

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
import PageLoader from '@components/PageLoader';

import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { motion } from 'framer-motion';


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

// Helper function to format seconds to HH:MM:SS
const formatSecondsToTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const CallDashboard = () => {
    const { data:session, status } = useSession();
    const [showPageLoader, setShowPageLoader] = useState(false);
    const [showCountryChartModal, setShowCountryChartModal] = useState(false);
    const [showDepartmentChartModal, setShowDepartmentChartModal] = useState(false);
    const [showExtensionChartModal, setShowExtensionChartModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({
      start_datetime: moment().utc().startOf('day').format('YYYY-MM-DDTHH:mm:ss') + 'Z',
      end_datetime: moment().utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z',
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

    // Create cards data for PageSummaryGrid
    const summaryCards: SummaryCard[] = [
        {
            id: 'total-calls',
            title: 'Total Calls',
            value: generalStats.totalCalls,
            description: 'Total calls in the system',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'inbound-calls',
            title: 'Inbound',
            value: generalStats.totalInbound,
            description: 'Inbound calls in the system',
            delay: 0.3,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'outbound-calls',
            title: 'Outbound',
            value: generalStats.totalOutbound,
            description: 'Outbound calls in the system',
            delay: 0.5,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'missed-incoming',
            title: 'Missed Incoming',
            value: generalStats.totalMissedIncoming,
            description: 'Missed incoming calls in the system',
            delay: 0.7,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'missed-outgoing',
            title: 'Missed Outgoing',
            value: generalStats.totalMissedOutgoing,
            description: 'Missed outgoing calls in the system',
            delay: 0.9,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        // {
        //     id: 'avg-ring-time',
        //     title: 'Avg Ring Time',
        //     value: generalStats.totalAvgRingTime,
        //     description: 'Avg ring time in the system',
        //     delay: 1.1,
        //     showAnimatedNumber: true,
        //     animationDuration: 1000,
        //     fontStyle: 'style-2',
        //     valueType: 'seconds',
        // },
        // {
        //     id: 'avg-duration',
        //     title: 'Avg Duration',
        //     value: generalStats.totalAvgDuration,
        //     description: 'Avg duration in the system',
        //     delay: 1.3,
        //     showAnimatedNumber: true,
        //     animationDuration: 1000,
        //     fontStyle: 'style-2',
        //     valueType: 'seconds',
        // },
        // {
        //     id: 'avg-cost',
        //     title: 'Avg Cost',
        //     value: generalStats.totalAvgCost,
        //     description: 'Avg cost in the system',
        //     delay: 1.5,
        //     showAnimatedNumber: true,
        //     animationDuration: 1000,
        //     fontStyle: 'style-2',
        //     prefix: '$',
        // }
    ];

    const [perPage, setPerPage] = useState(5);
    const [page, setPage] = useState(1);

    const [showExtensionChart, setShowExtensionChart] = useState(true);
    const [showDepartmentChart, setShowDepartmentChart] = useState(true);
    const [showCountryChart, setShowCountryChart] = useState(true);

    const [countryChartData, setCountryChartData] = useState<any[]>([]);
    const [departmentChartData, setDepartmentChartData] = useState<any[]>([]);
    const [extensionChartData, setExtensionChartData] = useState<any[]>([]);

    const [startDateTime, setStartDateTime] = useState<string>('');
    const [endDateTime, setEndDateTime] = useState<string>('');

    useEffect(() => {
        fetchGeneralStats();
    }, []);
    const fetchGeneralStats = async () => {
      setShowPageLoader(true);
      const response = await ListCallLogs({ page:  page, perPage: perPage, search: "", filters: currentFilters,reportType: 'statsDashboard', moduleSlug: ModuleSlug.CALL_LOGS }, 
        'call-logs/generalStats').finally(() => {
          setShowPageLoader(false);
        });

      if(response.success){
        const responseData = response.data;
        const dataFilters = response?.filters;
        setShowDateRange(true);
      
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

      setStartDateTime(dataFilters?.start_datetime);
      setEndDateTime(dataFilters?.end_datetime);
      console.log(dataFilters?.start_datetime, dataFilters?.end_datetime);

      // Extract and map chart data
      const chartExtension = responseData?.chart_data?.extension;
      if(chartExtension){
        setShowExtensionChart(true);
        setExtensionChartData(chartExtension);
        
        // Map extension data to chart format
        const extensionLabels = chartExtension.map((item: any) => item.label || 'Unknown');
        const values = chartExtension.map((item: any) => item.value ? parseInt(item.value) : 0);
        
        setExtensionChart({
          series: [{
            name: 'Call Count',
            data: values
          }],
          options: {
            ...ExtensionChart.options,
            xaxis: {
              ...ExtensionChart.options.xaxis,
              categories: extensionLabels,
              labels: {
                show: true,
                
                style: {
                  fontSize: '11px',
                  colors: '#666'
                }
              }
            },
            tooltip: {
              ...ExtensionChart.options.tooltip,
              
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
        const values = chartDepartment.map((item: any) => item.value ? parseInt(item.value) : 0);
        
        setDepartmentChart({
          series: [{
            name: 'Call Count',
            data: values
          }],
          options: {
            ...DepartmentChart.options,
              xaxis: {
                ...DepartmentChart.options.xaxis,
                categories: departmentLabels as string[],
                labels: {
                  show: true,
                  
                  style: {
                    fontSize: '11px',
                    colors: '#666'
                  }
                }
              },
            yaxis: {
              ...DepartmentChart.options.yaxis,
              show: true,
              labels: {
                show: true,
                style: {
                  fontSize: '11px',
                  colors: '#666'
                }
              }
            },
            chart: {
              ...DepartmentChart.options.chart
            },
            plotOptions: {
              bar: {
                borderRadius: 4,
                borderRadiusApplication: 'end',
                horizontal: true,
                columnHeight: '2px',
              }
            },
            dataLabels: {
              enabled: false,
            },
            tooltip: {
               
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
        const values = chartCountry.map((item: any) => item.value ? parseInt(item.value) : 0);
        
        setCountryChart({
          series: [
            {
              name: 'Call Count',
              data: values
            }
          ],
          options: {
            ...CountryChart.options,
            xaxis: {
              ...CountryChart.options.xaxis,
              categories: countryLabels,
              labels: {
                show: true,
                
                style: {
                  fontSize: '11px',
                  colors: '#666'
                }
              }
            },
            tooltip: {
              
            }
          }
        });
      }
    }

  };

  const [CountryChart, setCountryChart] = React.useState({
          
    series: [{
      name: '',
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
        show: true,
        position: 'bottom'
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        
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
        tooltip: {
          
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
            text: 'Call Count', // <-- Your custom label here
            style: {
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#263238',
              marginRight: '10px'
            }
          },
          labels: {
            show: true,
            style: {
              fontSize: '11px',
              colors: '#666'
            }
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
      intersect: false,
      
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
    const response = await ListCallLogs({ page:  page, perPage: perPage, search: "", filters: currentFilters,reportType: 'statsExtension',moduleSlug: ModuleSlug.CALL_LOGS }, 'call-logs/statsByExtension');
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
    const response = await ListCallLogs({ page:  page, perPage: perPage, search: "", filters: currentFilters,reportType: 'statsCountry', moduleSlug: ModuleSlug.CALL_LOGS }, 'call-logs/statsByCountry');
    if(response?.dataList?.length > 0){
      setTrendByCountryData(response?.dataList);
    }
  };

   

    const handleFiltersChange = (filters: any) => {
        // Format datetime values to UTC format before sending to API
        const formattedFilters: any = { ...filters };
        
        if (formattedFilters.start_datetime) {
            // Handle different date formats
            let startMoment = moment(formattedFilters.start_datetime);
            
            if (formattedFilters.start_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                // Format is YYYY-MM-DDTHH:mm, add :00 seconds
                startMoment = moment(formattedFilters.start_datetime + ':00');
            } else if (formattedFilters.start_datetime.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [AP]M$/)) {
                // Format is YYYY-MM-DD hh:mm:ss A (local format from dashboard)
                startMoment = moment(formattedFilters.start_datetime, 'YYYY-MM-DD hh:mm:ss A');
            } else if (!formattedFilters.start_datetime.includes('T') && !formattedFilters.start_datetime.includes(' ')) {
                // If only date, set to 00:00:00
                startMoment = moment(formattedFilters.start_datetime).startOf('day');
            }
            
            // Convert to UTC
            formattedFilters.start_datetime = startMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        }
        
        if (formattedFilters.end_datetime) {
            // Handle different date formats
            let endMoment = moment(formattedFilters.end_datetime);
            
            if (formattedFilters.end_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                // Format is YYYY-MM-DDTHH:mm, check if it's 23:59, otherwise add :00
                const timePart = formattedFilters.end_datetime.split('T')[1];
                if (timePart === '23:59') {
                    endMoment = moment(formattedFilters.end_datetime + ':59');
                } else {
                    endMoment = moment(formattedFilters.end_datetime + ':00');
                }
            } else if (formattedFilters.end_datetime.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [AP]M$/)) {
                // Format is YYYY-MM-DD hh:mm:ss A (local format from dashboard)
                endMoment = moment(formattedFilters.end_datetime, 'YYYY-MM-DD hh:mm:ss A');
            } else if (!formattedFilters.end_datetime.includes('T') && !formattedFilters.end_datetime.includes(' ')) {
                // If only date, set to 23:59:59
                endMoment = moment(formattedFilters.end_datetime).endOf('day');
            }
            
            // Convert to UTC
            formattedFilters.end_datetime = endMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        }
        
        // Remove timezone key from payload if present
        delete formattedFilters.timezone;
        
        setCurrentFilters(formattedFilters);
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
            <BreadcrumbItem mainTitle="Call Logs" mainLink="/call-logs/dashboard" subTitle="Call Dashboard" showPageLoader={showPageLoader} />


            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">Call Dashboard</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                    <div className="d-flex align-items-center gap-2">
                          {showDateRange && (
                            <>
                            <p className="mb-0">
                            Date Range: <span className="status-badge primary">{formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)}</span> to <span className="status-badge primary">{formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}</span>
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



            <PageSummaryGrid 
              cards={summaryCards} 
            />

            <Row>
                {showCountryChart && (
                <Col md={4}>
                    <div className="card">
                        
                        <div className="card-body">
                            {countryChartData.length === 0 ? (
                                <EmptyState
                                    title="No Calls by Country Data"
                                    description="Chart data will appear here when available."
                                    className="table-empty-state"
                                />
                            ) : (
                              <>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 app-title-heading">Calls by Country</h5>
                                <button 
                                  className="btn btn-sm btn-light"
                                  onClick={() => setShowCountryChartModal(true)}
                                >
                                  <i className="material-icons-two-tone">open_in_full</i>
                                </button>
                              </div>
                              <ReactApexChart 
                                options={CountryChart.options as ApexOptions} 
                                series={CountryChart.series} 
                                type="bar" 
                                height={200} 
                              />
                                  </>
                            )}

                        </div>
                    </div>
                </Col>
                )}

                {showDepartmentChart && (
                <Col md={4}>
                    <div className="card">
                       
                        <div className="card-body">
                            

                            {departmentChartData.length === 0 ? (
                                <EmptyState
                                  title="No Calls by Department Data"
                                  description="Chart data will appear here when available."
                                  className="table-empty-state"
                              />
                            ) : (
                              <>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 app-title-heading">Call by Department</h5>
                                <button 
                                  className="btn btn-sm btn-light"
                                  onClick={() => setShowDepartmentChartModal(true)}
                                >
                                  <i className="material-icons-two-tone">open_in_full</i>
                                </button>
                              </div>
                              <ReactApexChart 
                                options={DepartmentChart.options as ApexOptions} 
                                series={DepartmentChart.series} 
                                type="bar" 
                                height={200} 
                              />
                              </>
                               
                            )}
                        </div>
                    </div>
                </Col>
                )}

                {showExtensionChart && (
                <Col md={4}>
                    <div className="card">
                       
                        <div className="card-body">
                            {extensionChartData.length === 0 ? (
                                <EmptyState
                                    title="No Calls by Extension Data"
                                    description="Chart data will appear here when available."
                                    className="table-empty-state"
                                />
                            ) : (
                              <>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 app-title-heading">Call by Extension</h5>
                                <button 
                                  className="btn btn-sm btn-light"
                                  onClick={() => setShowExtensionChartModal(true)}
                                >
                                  <i className="material-icons-two-tone">open_in_full</i>
                                </button>
                              </div>
                              <ReactApexChart 
                                options={ExtensionChart.options} 
                                series={ExtensionChart.series} 
                                type="bar" 
                                height={200} 
                              />
                              </>
                                
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
                        
                        <div className="card-body">

                        {extensionData.length === 0 ? (
                                        <EmptyState
                                            title="No Call by Extension Data"
                                            description="List of call by extension data will appear here."
                                            isTableRow={true}
                                            colSpan={6}
                                        />
                                    ) : (
                                      <>
                                      <h5 className="mb-0 app-title-heading">Call by Extension</h5>
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
                                      </>
                                    )}

                              
                        </div>
                    </div>
                </Col>
              )}

              {showTrendByCountryTable && (
                <Col md={6}>
                    <div className="card">
                       
                        <div className="card-body">

                        {trendByCountryData.length === 0 ? (
                                        <EmptyState
                                            title="No Call Stats by Country Data"
                                            description="List of call stats by country data will appear here."
                                            isTableRow={true}
                                            colSpan={6}
                                        />
                                    ) : ( 
                                      <>
                                      <h5 className="mb-0 app-title-heading">Call Stats by Country</h5>
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
                                    <Link href="/call-reports/stats/country" className="link-primary">View All</Link>
                              </div>
                                      </div>
                                      </>
                                    )}
                          
                              
                        </div>
                    </div>
                </Col>
              )}
            </Row>

            {/* Country Chart Modal */}
            <Modal 
                show={showCountryChartModal} 
                onHide={() => setShowCountryChartModal(false)}
                size="xl"
                centered
                className="chart-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Calls by Country</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="chart-container" style={{ minHeight: '500px' }}>
                        <ReactApexChart 
                            options={{
                                ...CountryChart.options as ApexOptions,
                                chart: {
                                    ...CountryChart.options.chart,
                                    height: 500,
                                    toolbar: {
                                        show: true
                                    }
                                }
                            }} 
                            series={CountryChart.series} 
                            type="bar" 
                            height={500} 
                        />
                    </div>
                </Modal.Body>
            </Modal>

            {/* Department Chart Modal */}
            <Modal 
                show={showDepartmentChartModal} 
                onHide={() => setShowDepartmentChartModal(false)}
                size="xl"
                centered
                className="chart-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Calls by Department</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="chart-container" style={{ minHeight: '500px' }}>
                        <ReactApexChart 
                            options={{
                                ...DepartmentChart.options as ApexOptions,
                                chart: {
                                    ...DepartmentChart.options.chart as ApexChart,
                                    height: 500,
                                    toolbar: {
                                        show: true
                                    }
                                }
                            }} 
                            series={DepartmentChart.series} 
                            type="bar" 
                            height={500} 
                        />
                    </div>
                </Modal.Body>
            </Modal>

            {/* Extension Chart Modal */}
            <Modal 
                show={showExtensionChartModal} 
                onHide={() => setShowExtensionChartModal(false)}
                size="xl"
                centered
                className="chart-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Calls by Extension</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="chart-container" style={{ minHeight: '500px' }}>
                        <ReactApexChart 
                            options={{
                                ...ExtensionChart.options,
                                chart: {
                                    ...ExtensionChart.options.chart as ApexChart,
                                    height: 500,
                                    toolbar: {
                                        show: true
                                    }
                                }
                            }} 
                            series={ExtensionChart.series} 
                            type="bar" 
                            height={500} 
                        />
                    </div>
                </Modal.Body>
            </Modal>
        
        </React.Fragment>
    );
};

CallDashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallDashboard;
