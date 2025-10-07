import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListCallLogs, ExportCallLogs, DownloadStreamingExport } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row, Tab, Tabs } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import CallLogsFilters from '@components/filters/CallLogsFilters';
import AnimatedNumber from '@components/AnimatedNumber';
import ChartBar from '@components/ChartBar';
import ChartDonut from '@components/ChartDonut';
import StatCard from '@components/StatCard';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import { motion, AnimatePresence } from "framer-motion";
import { easeInOut, easeOut, easeIn } from "framer-motion";
import { ModuleSlug } from '@utils/Helper';
import moment from 'moment';

interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration:number;
  avg_duration:number;
  avg_ring_time:number;
}

interface ChartData {
  country: string[];

  answered_calls: number[];
  unanswered_calls: number[];
  total_calls: number[];

  max_ring_time: number[];
  avg_ring_time: number[];
  min_ring_time: number[];

  min_cost: number[];
  avg_cost: number[];
  max_cost: number[];

  min_duration: number[];
  avg_duration: number[];
  max_duration: number[];
}

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const CallTrendCountry = () => {
    const { data:session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('calls_chart');
    
    // Debug session state
    useEffect(() => {
        console.log('Session state:', { session, status });
        if (status === 'authenticated' && session) {
            console.log('Session authenticated successfully');
        } else if (status === 'loading') {
            console.log('Session still loading...');
        } else if (status === 'unauthenticated') {
            console.log('User not authenticated');
        }
    }, [session, status]);
    
    // Debug component mounting
    useEffect(() => {
        console.log('CallTrendCountry component mounted');
        console.log('Initial props and state:', { 
            session, 
            status, 
            filtersReady, 
            dataLoaded, 
            loading 
        });
        return () => {
            console.log('CallTrendCountry component unmounting');
        };
    }, []);

    // Animation variants for tab transitions
    const tabVariants = {
        hidden: { 
            opacity: 0, 
            x: 20,
            scale: 0.95
        },
        visible: { 
            opacity: 1, 
            x: 0,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: easeOut
            }
        },
        exit: { 
            opacity: 0, 
            x: -20,
            scale: 0.95,
            transition: {
                duration: 0.2,
                ease: easeIn
            }
        }
    };

    const columns: Column[] = [
        { key: 'Country', name: 'Country', selector: (row: any) => row.Country, sortable: true },
        { key: 'CallDate', name: 'Call Date', selector: (row: any) => row.CallDate, sortable: true },
        { key: 'StartHour', name: 'Start Hour', selector: (row: any) => row.StartHour, sortable: true },

        { key: 'Answered', name: 'Answered', selector: (row: any) => row.Answered, sortable: true },
        { key: 'AvgCost', name: 'Avg Cost', selector: (row: any) => row.AvgCost, sortable: true },
        { key: 'AvgDuration', name: 'Avg Duration', selector: (row: any) => row.AvgDuration, sortable: true },
        { key: 'AvgRingTime', name: 'Avg Ring Time', selector: (row: any) => row.AvgRingTime, sortable: true },
        { key: 'Calls', name: 'Calls', selector: (row: any) => row.Calls, sortable: true },
        { key: 'Cost', name: 'Cost', selector: (row: any) => row.Cost, sortable: true },
        { key: 'Country', name: 'Country', selector: (row: any) => row.Country, sortable: true },
        { key: 'Duration', name: 'Duration', selector: (row: any) => row.Duration, sortable: true },
        { key: 'MaxRingTime', name: 'Max Ring Time', selector: (row: any) => row.MaxRingTime, sortable: true },
        { key: 'TotalDuration', name: 'Total Duration', selector: (row: any) => row.TotalDuration, sortable: true },
        { key: 'Unanswered', name: 'Un Answered', selector: (row: any) => row.Unanswered, sortable: true },
        
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({
      is_incoming_only: 'false'
    });
    
    // Debug current filters state
    useEffect(() => {
        console.log('Current filters state changed:', currentFilters);
    }, [currentFilters]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [filtersReady, setFiltersReady] = useState(false);
    const [summary, setSummary] = useState<Summary>({
        total_calls: 0,
        answered_calls: 0,
        unanswered_calls: 0,
        total_cost: 0,
        total_duration:0,
        avg_duration:0,
        avg_ring_time:0
    });
    
    const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
        // Only fetch if filters are ready
        if (!filtersReady) {
            console.log('Filters not ready yet, skipping fetch');
            return;
        }
        
        console.log('Fetching call logs with filters:', currentFilters);
        setLoading(true);
        
        try {
            console.log('About to call ListCallLogs with params:', { page, perPage, search, filters: currentFilters, reportType: 'trendStatsCountry' });
            const response = await ListCallLogs({ page, perPage, search, filters: currentFilters, reportType: 'trendStatsCountry', 
                moduleSlug: ModuleSlug.CALL_REPORTS }, 'call-logs/statsTrendByCountry');
            console.log('API response:', response);
            console.log('API response type:', typeof response);
            console.log('API response keys:', response ? Object.keys(response) : 'null/undefined');
            
            if (response?.summary) {
                setSummary(response.summary);
                setDataLoaded(true);
                console.log('Summary data set:', response.summary);
                console.log('DataLoaded set to true');
            } else if (response?.data) {
                // Fallback: check if data exists but no summary
                console.log('Response has data but no summary:', response.data);
                setDataLoaded(true);
                console.log('DataLoaded set to true (fallback 1)');
            } else if (response && typeof response === 'object') {
                // Check if response is an object but doesn't have expected properties
                console.log('Response is object but missing expected properties:', response);
                setDataLoaded(true);
                console.log('DataLoaded set to true (fallback 2)');
            } else {
                console.warn('No summary or data in response:', response);
                setDataLoaded(true); // Mark as loaded even if no data
                console.log('DataLoaded set to true (fallback 3)');
            }
            
            setLoading(false);
            return response;
        } catch (error: unknown) {
            console.error('Error fetching call logs:', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
            }
            setLoading(false);
            setDataLoaded(true); // Mark as loaded even on error
            console.log('DataLoaded set to true (error case)');
            toast.error('Failed to fetch call data');
            return null;
        }
    }, [currentFilters, filtersReady]);

    const [simpleDonut, setSimpleDonut] = React.useState<{ series: number[]; labels: string[] } | null>(null);

    useEffect(() => {
        if(summary && dataLoaded) {
        console.log('Summary data:', summary);
          const answeredCalls = Number(summary.answered_calls) || 0;
          const unansweredCalls = Number(summary.unanswered_calls) || 0;
          
          // Check if both values are 0, if so don't set chart data (will show empty state)
          if (answeredCalls === 0 && unansweredCalls === 0) {
            console.log('Both answered and unanswered calls are 0, not setting chart data');
            setSimpleDonut(null);
          } else {
            // Set chart data only when there's actual data
            setSimpleDonut({
              series: [answeredCalls, unansweredCalls],
              labels: ['Answered Calls', 'Unanswered Calls']
            });
          }
        }
    }, [summary, dataLoaded]);

    // Trigger initial data fetch when filters become ready
    useEffect(() => {
        console.log('Initial data fetch useEffect triggered:', { filtersReady, status, session });
        if (filtersReady && status === 'authenticated' && session) {
            console.log('Filters ready and session authenticated, triggering initial fetch');
            console.log('DataLoaded before fetch:', dataLoaded);
            fetchCallLogs(1, 15, "");
        } else if (status === 'loading') {
            console.log('Session still loading, waiting...');
        } else if (status === 'unauthenticated') {
            console.log('User not authenticated');
        } else {
            console.log('Not ready for data fetch:', { filtersReady, status, hasSession: !!session });
        }
    }, [filtersReady, fetchCallLogs, status, session]);
    
    // Fallback: if filters haven't been marked as ready after 1 second, mark them as ready
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!filtersReady) {
                console.log('Fallback: marking filters as ready');
                setFiltersReady(true);
            }
        }, 1000);
        
        return () => clearTimeout(timer);
    }, [filtersReady]);
    
    // Additional fallback: if session is authenticated but filters still not ready after 2 seconds
    useEffect(() => {
        if (status === 'authenticated' && session) {
            const timer = setTimeout(() => {
                if (!filtersReady) {
                    console.log('Session-based fallback: marking filters as ready');
                    setFiltersReady(true);
                }
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [status, session, filtersReady]);
    
    // Debug initial state
    useEffect(() => {
        console.log('Initial state:', { 
            filtersReady, 
            dataLoaded, 
            loading, 
            currentFilters, 
            session: !!session, 
            status 
        });
        
        // Log the actual API functions to make sure they're available
        console.log('API functions check:', {
            ListCallLogs: typeof ListCallLogs,
            ExportCallLogs: typeof ExportCallLogs,
            DownloadStreamingExport: typeof DownloadStreamingExport
        });
    }, [filtersReady, dataLoaded, loading, currentFilters, session, status]);

    
    const handleFiltersChange = (filters: any) => {
        console.log('Filters changed:', filters);
        console.log('Previous filters:', currentFilters);
        console.log('New filters:', filters);
        
        // Check if filters actually changed
        const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(filters);
        console.log('Filters actually changed:', filtersChanged);
        
        // Check if this is a complete clear (empty object or only has default values)
        const isCompletelyCleared = Object.keys(filters).length === 0 || 
            (Object.keys(filters).length === 1 && filters.hasOwnProperty('is_incoming_only'));
        
        console.log('Is completely cleared:', isCompletelyCleared);
        
        setCurrentFilters(filters);
        
        // Mark filters as ready when they are first set
        if (!filtersReady) {
            console.log('Marking filters as ready for the first time');
            setFiltersReady(true);
        }
        
        // Reset data loaded state when filters actually change or when cleared
        if ((filtersChanged && filtersReady) || isCompletelyCleared) {
            console.log('Resetting data loaded state due to filter change or clear');
            setDataLoaded(false);
            console.log('DataLoaded set to false due to filter change');
            setSummary({
                total_calls: 0,
                answered_calls: 0,
                unanswered_calls: 0,
                total_cost: 0,
                total_duration: 0,
                avg_duration: 0,
                avg_ring_time: 0
            });
            
            // Trigger refresh
            setRefreshKey(prev => prev + 1);
            console.log('Refresh key updated, new value:', refreshKey + 1);
        } else if (!filtersChanged) {
            console.log('Filters did not change, keeping dataLoaded state:', dataLoaded);
        }
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
      try {
        if (exportType === 'excel') {
         
          await DownloadStreamingExport(
            { filters: currentFilters, isExport: true, exportType ,reportType:'trendStatsCountry' }, 'call-logs/statsTrendByCountry',
            'trendStatsCountry'
          );
        }
      } catch (error: unknown) {
        console.error('Export error:', error);
        if (error instanceof Error) {
            console.error('Export error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        toast.error('Export failed');
      }
    };

    const [chartCalls, setChartCalls] = useState<{ series: any[]; categories: string[] } | null>(null);
    const [chartRingTime, setChartRingTime] = useState<{ series: any[]; categories: string[] } | null>(null);
    const [chartCost, setChartCost] = useState<{ series: any[]; categories: string[] } | null>(null);
    const [chartDuration, setChartDuration] = useState<{ series: any[]; categories: string[] } | null>(null);
    
    const [chartLoading, setChartLoading] = useState(false);
    const [showChartModal, setShowChartModal] = useState(false);
    const [currentChartData, setCurrentChartData] = useState<{ series: any[]; categories: string[] } | null>(null);
    const [currentChartTitle, setCurrentChartTitle] = useState('');

    useEffect(() => {
      // Only fetch charts when filters are ready and not empty
      const areFiltersReady = filtersReady && currentFilters && Object.keys(currentFilters).length > 0;
      
      if (areFiltersReady) {
        const fetchCharts = async () => {
          setChartLoading(true);
          try {
            const response = await ListCallLogs({ page: 1, perPage: 15, search: "", filters: currentFilters,reportType: 'chartCountry', 
                moduleSlug: ModuleSlug.CALL_REPORTS }, 'call-logs/stats/country/chart');
           
            const chartData = response?.chart_data;
            
            if(chartData && Array.isArray(chartData) && chartData.length > 0) {
             
              
              const newChartData: ChartData = {
                country: [],
                answered_calls: [],
                unanswered_calls: [],
                total_calls: [],
                max_ring_time: [],
                avg_ring_time: [],
                min_ring_time: [],
                min_cost: [],
                avg_cost: [],
                max_cost: [],
                min_duration: [],
                avg_duration: [],
                max_duration: [],
              };
              
              
              chartData.forEach((item: any, index: number) => {
               
                if (item && item.label) {
                  newChartData.country.push(item.label);
                  newChartData.answered_calls.push(Number(item.answered_calls) || 0);
                  newChartData.unanswered_calls.push(Number(item.unanswered_calls) || 0);
                  newChartData.total_calls.push(Number(item.total_calls) || 0);
                  newChartData.max_ring_time.push(Number(item.max_ring_time) || 0);
                  newChartData.avg_ring_time.push(Number(item.avg_ring_time) || 0);
                  newChartData.min_ring_time.push(Number(item.min_ring_time) || 0);
                  newChartData.min_cost.push(Number(item.min_cost) || 0);
                  newChartData.avg_cost.push(Number(item.avg_cost) || 0);
                  newChartData.max_cost.push(Number(item.max_cost) || 0);
                  newChartData.min_duration.push(Number(item.min_duration) || 0);
                  newChartData.avg_duration.push(Number(item.avg_duration) || 0);
                  newChartData.max_duration.push(Number(item.max_duration) || 0);
                } 
              });
              
              
              console.log("Chart data",newChartData);
              
              
              const dataLength = newChartData.country.length;
              
              if (dataLength > 0 && 
                  newChartData.answered_calls.length === dataLength &&
                  newChartData.unanswered_calls.length === dataLength &&
                  newChartData.total_calls.length === dataLength) {
                
                // Calls Chart
                setChartCalls({
                  series: [
                    { name: 'Total', data: newChartData.total_calls },
                    { name: 'Answered', data: newChartData.answered_calls },
                    { name: 'Unanswered', data: newChartData.unanswered_calls }
                  ],
                  categories: newChartData.country
                });

                // Ring Time Chart
                setChartRingTime({
                  series: [
                    { name: 'Max Ring Time', data: newChartData.max_ring_time },
                    { name: 'Avg Ring Time', data: newChartData.avg_ring_time },
                    { name: 'Min Ring Time', data: newChartData.min_ring_time }
                  ],
                  categories: newChartData.country
                });

                // Cost Chart
                setChartCost({
                  series: [
                    { name: 'Max Cost', data: newChartData.max_cost },
                    { name: 'Avg Cost', data: newChartData.avg_cost },
                    { name: 'Min Cost', data: newChartData.min_cost }
                  ],
                  categories: newChartData.country
                });

                // Duration Chart
                setChartDuration({
                  series: [
                    { name: 'Max Duration', data: newChartData.max_duration },
                    { name: 'Avg Duration', data: newChartData.avg_duration },
                    { name: 'Min Duration', data: newChartData.min_duration }
                  ],
                  categories: newChartData.country
                });

                

              } else {
                console.error('Chart data arrays have different lengths or no data');
                setChartCalls(null);
                setChartRingTime(null);
                setChartCost(null);
                setChartDuration(null);
              }
            } else {
              console.log('No chart data available');
              setChartCalls(null);
              setChartRingTime(null);
              setChartCost(null);
              setChartDuration(null);
            }
          } catch (error) {
            console.error('Error fetching chart data:', error);
            setChartCalls(null);
            setChartRingTime(null);
            setChartCost(null);
            setChartDuration(null);
          } finally {
            setChartLoading(false);
          }
        };

        fetchCharts();
      } else {
        // Reset chart when filters are not ready
        setChartCalls(null);
        setChartRingTime(null);
        setChartCost(null);
        setChartDuration(null);
        setChartLoading(false);
      }
    }, [currentFilters, filtersReady]);


    const [currentChartDataType, setCurrentChartDataType] = useState<'calls' | 'time' | 'cost' | 'custom'>('custom');

    const handleOpenChartModal = (chartData: { series: any[]; categories: string[] } | null, title: string, dataType: 'calls' | 'time' | 'cost' | 'custom') => {
        if (chartData) {
            setCurrentChartData(chartData);
            setCurrentChartTitle(title);
            setCurrentChartDataType(dataType);
            setShowChartModal(true);
        }
    };

    const handleTabChange = (key: string | null) => {
        if (key) {
            setActiveTab(key);
        }
    };

    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Trend By Country" />


            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <Row className="align-items-center">
                    <Col md={4}>
                      <h3 className="mb-0 d-flex align-items-center">
                      Call Trend By Country
                      </h3>
                    </Col>
                    <Col md={8} className="d-flex justify-content-end">
                      <CallLogsFilters
                       onFiltersChange={handleFiltersChange} onExport={handleExport} isVisibleCallDirection={false} moduleSlug={ModuleSlug.CALL_REPORTS} />
                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>


            <Row>
                <Col md={6}>
                    <Row>
                        <StatCard
                            title="Total Calls"
                            value={summary.total_calls}
                            valueType="number"
                            icon="phone"
                            bgImage={imgStatus1.src}
                            delay={0}
                        />

                        <StatCard
                            title="Avg Ring Time"
                            value={summary.avg_ring_time}
                            valueType="seconds"
                            icon="phone_in_talk"
                            bgImage={imgStatus1.src}
                            delay={1}
                        />

                        <StatCard
                            title="Avg Duration"
                            value={summary.avg_duration}
                            valueType="seconds"
                            icon="info"
                            bgImage={imgStatus1.src}
                            delay={2}
                        />

                        <StatCard
                            title="Cost"
                            value={summary.total_cost}
                            valueType="cost"
                            icon="payment"
                            bgImage={imgStatus1.src}
                            delay={3}
                        />
                    </Row>
                </Col>

                <Col md={6}>
                <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * 0 }}
                        >
                    <div className="report-grid ">
                    <p className="text-muted mb-0">Total Calls</p>
                        <div className="chart-one " >
                            {loading || !dataLoaded ? (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '180px' }}>
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (summary.answered_calls === 0 && summary.unanswered_calls === 0 && summary.total_duration === 0) ? (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '180px' }}>
                                    <p className="text-muted mb-0">No data available</p>
                                </div>
                            ) : simpleDonut ? (
                                <ChartDonut 
                                    series={simpleDonut.series} 
                                    labels={simpleDonut.labels}
                                    dataType="calls"
                                    height={180}
                                    width={500}
                                    showDataLabels={true}
                                    dataLabelsFormatter={(value) => `${value.toFixed(0)}%`}
                                />
                            ) : (
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '180px' }}>
                                    <p className="text-muted mb-0">Loading chart...</p>
                                </div>
                            )}
                        </div>
                    </div>
                    </motion.div>
                </Col>
            </Row>

            <Row>

                <Col md={12}>
                    <h4 className="">Core Metrics</h4>
                </Col>

                <Col md={12}>
                    <Tabs
                        defaultActiveKey="calls_chart"
                        id="system-tabs"
                        className="mb-3"
                        activeKey={activeTab}
                        onSelect={handleTabChange}
                    >
                        <Tab eventKey="calls_chart" title="Calls by Country">
                           <AnimatePresence mode="wait">
                             {activeTab === 'calls_chart' && (
                               <motion.div
                                 key="calls_chart"
                                 variants={tabVariants}
                                 initial="hidden"
                                 animate="visible"
                                 exit="exit"
                               >
                                 <Row>
                                  <Col md={12}>
                                      <div className="card report-shadow">
                                          <div className="card-body">
                                          
                                          {chartLoading ? (
                                              <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                                  <div className="spinner-border text-primary" role="status">
                                                      <span className="visually-hidden">Loading chart...</span>
                                                  </div>
                                              </div>
                                          ) : chartCalls ? (
                                              <ChartBar 
                                                  series={chartCalls.series}
                                                  categories={chartCalls.categories}
                                                  dataType="calls"
                                                  height={300}
                                                  maxDisplayedItems={5}
                                                  showViewAllButton={true}
                                                  viewAllButtonText="View All"
                                                  showFullScreenButton={true}
                                                  onFullScreenClick={() => handleOpenChartModal(chartCalls, 'Calls by Country', 'calls')}
                                              />
                                          ) : (
                                            <div className=""></div>
                                          )}
                                          </div>
                                      </div>
                                  </Col>
                                 </Row>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </Tab>


                        <Tab eventKey="duration_chart" title="Duration by Country">
                           <AnimatePresence mode="wait">
                             {activeTab === 'duration_chart' && (
                               <motion.div
                                 key="duration_chart"
                                 variants={tabVariants}
                                 initial="hidden"
                                 animate="visible"
                                 exit="exit"
                               >
                                 <Row>
                                  <Col md={12}>
                                      <div className="card report-shadow">
                                          <div className="card-body">
                                          
                                          {chartLoading ? (
                                              <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                                  <div className="spinner-border text-primary" role="status">
                                                      <span className="visually-hidden">Loading chart...</span>
                                                  </div>
                                              </div>
                                          ) : chartDuration ? (
                                              <ChartBar 
                                                  series={chartDuration.series}
                                                  categories={chartDuration.categories}
                                                  dataType="time"
                                                  height={300}
                                                  maxDisplayedItems={5}
                                                  showViewAllButton={true}
                                                  viewAllButtonText="View All"
                                                  showFullScreenButton={true}
                                                  onFullScreenClick={() => handleOpenChartModal(chartDuration, 'Duration by Country', 'time')}
                                              />
                                          ) : (
                                            <div className=""></div>
                                          )}
                                          </div>
                                      </div>
                                  </Col>
                                 </Row>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </Tab>

                        <Tab eventKey="ring_chart" title="Ring Time by Country">
                           <AnimatePresence mode="wait">
                             {activeTab === 'ring_chart' && (
                               <motion.div
                                 key="ring_chart"
                                 variants={tabVariants}
                                 initial="hidden"
                                 animate="visible"
                                 exit="exit"
                               >
                                 <Row>
                                  <Col md={12}>
                                      <div className="card report-shadow">
                                          <div className="card-body">
                                          
                                          {chartLoading ? (
                                              <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                                  <div className="spinner-border text-primary" role="status">
                                                      <span className="visually-hidden">Loading chart...</span>
                                                  </div>
                                              </div>
                                          ) : chartRingTime ? (
                                              <ChartBar 
                                                  series={chartRingTime.series}
                                                  categories={chartRingTime.categories}
                                                  dataType="time"
                                                  height={300}
                                                  maxDisplayedItems={5}
                                                  showViewAllButton={true}
                                                  viewAllButtonText="View All"
                                                  showFullScreenButton={true}
                                                  onFullScreenClick={() => handleOpenChartModal(chartRingTime, 'Ring Time by Country', 'time')}
                                              />
                                          ) : (
                                              <div className=""></div>
                                          )}
                                          </div>
                                      </div>
                                  </Col>
                                 </Row>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </Tab>

                        <Tab eventKey="cost_chart" title="Cost by Country">
                           <AnimatePresence mode="wait">
                             {activeTab === 'cost_chart' && (
                               <motion.div
                                 key="cost_chart"
                                 variants={tabVariants}
                                 initial="hidden"
                                 animate="visible"
                                 exit="exit"
                               >
                                 <Row>
                                  <Col md={12}>
                                      <div className="card report-shadow">
                                          <div className="card-body">
                                          
                                          {chartLoading ? (
                                              <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                                  <div className="spinner-border text-primary" role="status">
                                                      <span className="visually-hidden">Loading chart...</span>
                                                  </div>
                                              </div>
                                          ) : chartCost ? (
                                              <ChartBar 
                                                  series={chartCost.series}
                                                  categories={chartCost.categories}
                                                  dataType="cost"
                                                  height={300}
                                                  maxDisplayedItems={5}
                                                  showViewAllButton={true}
                                                  viewAllButtonText="View All"
                                                  showFullScreenButton={true}
                                                  onFullScreenClick={() => handleOpenChartModal(chartCost, 'Cost by Country', 'cost')}
                                              />
                                          ) : (
                                            <div className=""></div>
                                          )}
                                          </div>
                                      </div>
                                  </Col>
                                 </Row>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </Tab>

                    </Tabs>
                </Col>
            </Row>

            {session?.user?.permissions?.includes('list-call-logs') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchCallLogs}
                 title="Call Logs"
                 searchPlaceholder="Search call stats..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
             />
            )}

            {/* Chart Modal */}
            <Modal 
                show={showChartModal} 
                onHide={() => setShowChartModal(false)}
                size="xl"
                centered
                className="chart-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{currentChartTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentChartData ? (
                        <div className="chart-container" style={{ minHeight: '500px' }}>
                            <ChartBar 
                                series={currentChartData.series}
                                categories={currentChartData.categories}
                                height={500}
                                dataType={currentChartDataType}
                                useLogScale={true}
                            />
                        </div>
                    ) : (
                        <div className="d-flex align-items-center justify-content-center" style={{ height: '500px' }}>
                            <p className="text-muted mb-0">No chart data available</p>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

        
        </React.Fragment>
    );
};

CallTrendCountry.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallTrendCountry;
