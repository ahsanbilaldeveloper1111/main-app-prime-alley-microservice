import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListCallLogs, ExportCallLogs, DownloadStreamingExport } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row, Tab, Tabs, Form } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import CallLogsFilters from '@components/filters/CallLogsFilters';
import BarFilters from '@components/BarFilters';
import SelectBox from '@components/SelectBox';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import AnimatedNumber from '@components/AnimatedNumber';
import ChartBar from '@components/ChartBar';
import ChartDonut from '@components/ChartDonut';
import PageSummaryGrid from '@components/PageSummaryGrid';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import { motion, AnimatePresence } from "framer-motion";
import { easeInOut, easeOut, easeIn } from "framer-motion";
import moment from 'moment';
import { formatCurrency,  formatMinutesAndSeconds, ModuleSlug, GlobalDateTimeFormat, formatDateTimeToLocal } from '@utils/Helper';
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";





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
  department: string[];
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

const CallStatsDepartment = () => {
  const { data: session } = useSession();

  const [showDateRange, setShowDateRange] = useState(false);
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calls_chart');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({
    is_incoming_only: 'false'
  });
  const [pendingFilters, setPendingFilters] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);
  
  const {
    hierarchyDataUsers,
    hierarchyDataDepartments,
    hierarchyDataExtensions,
    loading: hierarchyLoading
  } = useHierarchyData(ModuleSlug.CALL_REPORTS);
  
  // Use ref to track if initial fetch has been done
  const initialFetchDone = React.useRef(false);
  // Use ref to track last filters used for charts to prevent unnecessary refetches
  const lastChartFilters = React.useRef<string>('');
  
  const [summary, setSummary] = useState<Summary>({
    total_calls: 0,
    answered_calls: 0,
    unanswered_calls: 0,
    total_cost: 0,
    total_duration:0,
    avg_duration:0,
    avg_ring_time:0
  });

  const columns: Column[] = [
    { key: 'DepartmentName', name: 'DepartmentName', selector: (row: any) => row.DepartmentName, sortable: true },
    { key: 'Calls', name: 'Total Calls', selector: (row: any) => row.Calls, sortable: true },
    { key: 'Answered', name: 'Answered', selector: (row: any) => row.Answered, sortable: true },
    { key: 'Unanswered', name: 'Un Answered', selector: (row: any) => row.Unanswered, sortable: true },

    { key: 'AvgRingTime', name: 'Avg Ring Time', selector: (row: any) => row.AvgRingTime, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.AvgRingTime)
     },
    { key: 'MaxRingTime', name: 'Max Ring Time', selector: (row: any) => row.MaxRingTime, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.MaxRingTime)
     },

    { key: 'Duration', name: 'Total Duration', selector: (row: any) => row.Duration, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.Duration)
     },
    { key: 'AvgDuration', name: 'Avg Duration', selector: (row: any) => row.AvgDuration, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.AvgDuration)
     },

    { key: 'Cost', name: 'Total Cost', selector: (row: any) => row.Cost, sortable: true,
      cell: (row: any) => formatCurrency(row.Cost)
     },
    { key: 'AvgCost', name: 'Avg Cost', selector: (row: any) => row['Avg Cost'], sortable: true,
      cell: (row: any) => formatCurrency(Number(row['Avg Cost']))
     },
  ];

  const [showPageLoader, setShowPageLoader] = useState(false);
  const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
   
    if (!filtersReady) {
      return;
    }
    
    setLoading(true);
    setShowPageLoader(true);
    
    try {
      const response = await ListCallLogs({ 
        page, 
        perPage, 
        search, 
        filters: currentFilters, 
        reportType: 'statsDepartment',
        moduleSlug: ModuleSlug.CALL_REPORTS

      }, 'call-logs/statsByDepartment').finally(() => {
        setShowPageLoader(false);
      });
      
      if (response?.summary) {

        setShowDateRange(true);
      const dataFilters = response?.filters;
      setStartDateTime(dataFilters?.start_datetime);
      setEndDateTime(dataFilters?.end_datetime);

        setSummary(response.summary);
        setDataLoaded(true);
      } else {
        setDataLoaded(true);
      }
      
      setLoading(false);
      return response;
    } catch (error: unknown) {
      console.error('Error fetching call logs:', error);
      setLoading(false);
      setDataLoaded(true);
      toast.error('Failed to fetch call data');
      return null;
    }
  }, [currentFilters, filtersReady]);

  const handleExport = async (exportType: string, filters: Record<string, any>) => {
    try {
      if (exportType === 'excel') {
        await DownloadStreamingExport(
          { filters: currentFilters, isExport: true, exportType, reportType: 'statsDepartment' }, 
          'call-logs/statsByDepartment',
          'statsDepartment'
        );
      }
    } catch (error: unknown) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const handleFiltersChange = (filters: any) => {
    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(filters);
    const isCompletelyCleared = Object.keys(filters).length === 0 || 
      (Object.keys(filters).length === 1 && filters.hasOwnProperty('is_incoming_only'));
    
    setCurrentFilters(filters);
    
    if (!filtersReady) {
      setFiltersReady(true);
    }
    
    if ((filtersChanged && filtersReady) || isCompletelyCleared) {
      // Reset chart filters ref to allow chart refetch
      lastChartFilters.current = '';
      setRefreshKey(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (filtersReady && session && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchCallLogs(1, 15, "");
    }
  }, [filtersReady, session]);
  
  // Separate useEffect for chart data when filters change
  useEffect(() => {
    if (filtersReady && session && initialFetchDone.current) {
      // Check if filters have actually changed
      const currentFiltersString = JSON.stringify(currentFilters);
      const filtersChanged = lastChartFilters.current !== currentFiltersString;
      
      if (filtersChanged) {
        lastChartFilters.current = currentFiltersString;
        
        // Fetch chart data
        const fetchCharts = async () => {
          setChartLoading(true);
          try {
            const response = await ListCallLogs({ 
              page: 1, 
              perPage: 15, 
              search: "", 
              filters: currentFilters, 
              reportType: 'chartDepartment',
              moduleSlug: ModuleSlug.CALL_REPORTS
            }, 'call-logs/stats/department/chart');
            
            const chartData = response?.chart_data;
            
            if(chartData && Array.isArray(chartData) && chartData.length > 0) {
              const newChartData: ChartData = {
                department: [],
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
              
              chartData.forEach((item: any) => {
                if (item && item.label) {
                  newChartData.department.push(item.label);
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
              
              const dataLength = newChartData.department.length;
              
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
                  categories: newChartData.department
                });

                // Ring Time Chart
                setChartRingTime({
                  series: [
                    { name: 'Max Ring Time', data: newChartData.max_ring_time },
                    { name: 'Avg Ring Time', data: newChartData.avg_ring_time },
                    { name: 'Min Ring Time', data: newChartData.min_ring_time }
                  ],
                  categories: newChartData.department
                });

                // Cost Chart
                setChartCost({
                  series: [
                    { name: 'Max Cost', data: newChartData.max_cost },
                    { name: 'Avg Cost', data: newChartData.avg_cost },
                    { name: 'Min Cost', data: newChartData.min_cost }
                  ],
                  categories: newChartData.department
                });

                // Duration Chart
                setChartDuration({
                  series: [
                    { name: 'Max Duration', data: newChartData.max_duration },
                    { name: 'Avg Duration', data: newChartData.avg_duration },
                    { name: 'Min Duration', data: newChartData.min_duration }
                  ],
                  categories: newChartData.department
                });
              } else {
                setChartCalls(null);
                setChartRingTime(null);
                setChartCost(null);
                setChartDuration(null);
              }
            } else {
              setChartCalls(null);
              setChartRingTime(null);
              setChartCost(null);
              setChartDuration(null);
            }
          } catch (error: unknown) {
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
      }
    }
  }, [currentFilters, filtersReady, session]);

  // Fallback: if filters haven't been marked as ready after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!filtersReady) {
        setFiltersReady(true);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [filtersReady]);

  const [simpleDonut, setSimpleDonut] = useState<{ series: number[]; labels: string[] } | null>(null);
  const [chartCalls, setChartCalls] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartRingTime, setChartRingTime] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartCost, setChartCost] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartDuration, setChartDuration] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [currentChartTitle, setCurrentChartTitle] = useState('');

  const [currentChartDataType, setCurrentChartDataType] = useState<'calls' | 'time' | 'cost' | 'custom'>('custom');
  const handleOpenChartModal = (chartData: { series: any[]; categories: string[] } | null, title: string, dataType: 'calls' | 'time' | 'cost' | 'custom') => {
    if (chartData) {
      setCurrentChartData(chartData);
      setCurrentChartTitle(title);
      setCurrentChartDataType(dataType);
      setShowChartModal(true);
    }
  };

  useEffect(() => {
    if(summary && dataLoaded) {
      const answeredCalls = Number(summary.answered_calls) || 0;
      const unansweredCalls = Number(summary.unanswered_calls) || 0;
      
      if (answeredCalls === 0 && unansweredCalls === 0) {
        setSimpleDonut(null);
      } else {
        setSimpleDonut({
          series: [answeredCalls, unansweredCalls],
          labels: ['Answered Calls', 'Unanswered Calls']
        });
      }
    }
  }, [summary, dataLoaded]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Stats By Department" showPageLoader={showPageLoader} />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5}>
                <h2 className="mb-0">Call Stats By Department</h2>
              </Col>
              <Col md={7} className="d-flex justify-content-end">
                <div className="action-buttons">

                  {showDateRange && (
                            <>
                            <p className="mb-0">
                            Date Range: <span className="status-badge primary">{formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)}</span> to <span className="status-badge primary">{formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}</span>
                            </p>
                          
                            </>
                          )}
                  {/* <CallLogsFilters
                    onFiltersChange={handleFiltersChange} 
                    onExport={handleExport} 
                    isVisibleCallDirection={false} 
                    moduleSlug={ModuleSlug.CALL_REPORTS} 
                  /> */}
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Row>
            {!dataLoaded ? (
              <>
                {[...Array(4)].map((_, index) => (
                  <Col md={6} className="mb-3" key={index}>
                    <div className="card report-shadow h-100">
                      <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '120px' }}>
                        <div className="spinner-border text-primary mb-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted mb-0">Loading...</p>
                      </div>
                    </div>
                  </Col>
                ))}
              </>
            ) : dataLoaded && summary.total_calls === 0 && summary.total_cost === 0 && summary.answered_calls === 0 && summary.unanswered_calls === 0 ? (
              <Col md={12}>
                <div className="card report-shadow">
                  <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '120px' }}>
                    <i className="fa fa-database fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted mb-2">No Data Available</h5>
                    <p className="text-muted mb-0">No call statistics found for the selected filters and date range.</p>
                  </div>
                </div>
              </Col>
            ) : (
              <PageSummaryGrid
                gridColumns={2}
                cards={[
                  {
                    id: 'total-calls',
                    title: 'Total Calls',
                    value: summary.total_calls,
                    description: 'Total number of calls',
                    delay: 0,
                    valueType: 'number',
                    showAnimatedNumber: true
                  },
                  {
                    id: 'avg-ring-time',
                    title: 'Avg Ring Time',
                    value: summary.avg_ring_time,
                    description: 'Average ring time in seconds',
                    delay: 0.3,
                    valueType: 'seconds',
                    showAnimatedNumber: true
                  },
                  {
                    id: 'avg-duration',
                    title: 'Avg Duration',
                    value: summary.avg_duration,
                    description: 'Average call duration',
                    delay: 0.6,
                    valueType: 'seconds',
                    showAnimatedNumber: true
                  },
                  {
                    id: 'total-cost',
                    title: 'Cost',
                    value: summary.total_cost,
                    description: 'Total cost of calls',
                    delay: 0.9,
                    valueType: 'cost',
                    showAnimatedNumber: true,
                    prefix: '$',
                  }
                ]}
              
              />
            )}
          </Row>
        </Col>

        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * 0 }}
          >
            <div className="report-grid">
              <p className="text-muted mb-0">Total Calls</p>
              <div className="chart-one">
                {!dataLoaded ? (
                  <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '180px' }}>
                    <div className="spinner-border text-primary mb-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mb-0">Loading chart data...</p>
                  </div>
                ) : (summary.answered_calls === 0 && summary.unanswered_calls === 0 && summary.total_duration === 0) ? (
                  <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '180px' }}>
                    <i className="fa fa-chart-pie fa-2x text-muted mb-2"></i>
                    <h6 className="text-muted mb-1">No Call Data Available</h6>
                    <p className="text-muted mb-0">No call statistics found for the selected filters</p>
                  </div>
                ) : !simpleDonut ? (
                  <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '180px' }}>
                    <i className="fa fa-chart-pie fa-2x text-muted mb-2"></i>
                    <h6 className="text-muted mb-1">No Call Data Available</h6>
                    <p className="text-muted mb-0">No call statistics found for the selected filters</p>
                  </div>
                ) : (
                  <ChartDonut 
                    series={simpleDonut.series} 
                    labels={simpleDonut.labels}
                    dataType="calls"
                    height={250}
                    width={500}
                    showDataLabels={true}
                    dataLabelsFormatter={(value) => `${value.toFixed(0)}%`}
                  />
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
            onSelect={(key) => key && setActiveTab(key)}
          >
            <Tab eventKey="calls_chart" title="Calls by Department">
              <AnimatePresence mode="wait">
                {activeTab === 'calls_chart' && (
                  <motion.div
                    key="calls_chart"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
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
                                onFullScreenClick={() => handleOpenChartModal(chartCalls, 'Calls by Department', 'calls')}
                              />
                            ) : (
                              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '300px' }}>
                                <i className="fa fa-chart-bar fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted mb-2">No Call Data Available</h5>
                                <p className="text-muted mb-0">No call statistics found for the selected filters and date range.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tab>

            <Tab eventKey="duration_chart" title="Duration by Department">
              <AnimatePresence mode="wait">
                {activeTab === 'duration_chart' && (
                  <motion.div
                    key="duration_chart"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
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
                                onFullScreenClick={() => handleOpenChartModal(chartDuration, 'Duration by Department', 'time')}
                              />
                            ) : (
                              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '300px' }}>
                                <i className="fa fa-clock fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted mb-2">No Duration Data Available</h5>
                                <p className="text-muted mb-0">No duration statistics found for the selected filters and date range.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tab>

            <Tab eventKey="ring_chart" title="Ring Time by Department">
              <AnimatePresence mode="wait">
                {activeTab === 'ring_chart' && (
                  <motion.div
                    key="ring_chart"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
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
                                onFullScreenClick={() => handleOpenChartModal(chartRingTime, 'Ring Time by Department', 'time')}
                              />
                            ) : (
                              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '300px' }}>
                                <i className="fa fa-phone fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted mb-2">No Ring Time Data Available</h5>
                                <p className="text-muted mb-0">No ring time statistics found for the selected filters and date range.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tab>

            <Tab eventKey="cost_chart" title="Cost by Department">
              <AnimatePresence mode="wait">
                {activeTab === 'cost_chart' && (
                  <motion.div
                    key="cost_chart"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
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
                                onFullScreenClick={() => handleOpenChartModal(chartCost, 'Cost by Department', 'cost')}
                              />
                            ) : (
                              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '300px' }}>
                                <i className="fa fa-dollar-sign fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted mb-2">No Cost Data Available</h5>
                                <p className="text-muted mb-0">No cost statistics found for the selected filters and date range.</p>
                              </div>
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
        <>
          {!dataLoaded ? (
            <Row>
              <Col md={12}>
                <div className="card report-shadow">
                  <div className="card-body">
                    <h5 className="card-title">Call Logs</h5>
                    <div className="d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Loading call logs...</span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          ) : dataLoaded && summary.total_calls === 0 ? (
            <Row>
              <Col md={12}>
                <div className="card report-shadow">
                  <div className="card-body">
                    <h5 className="card-title">Call Logs</h5>
                    <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '200px' }}>
                      <i className="fa fa-list fa-3x text-muted mb-3"></i>
                      <h6 className="text-muted mb-2">No Call Logs Available</h6>
                      <p className="text-muted mb-0">No call logs found for the selected filters and date range.</p>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          ) : (
            <>
            <BarFilters
              leftContent={
                <>
                  {showDateRange && (
                    <p className="mb-0">
                      Date Range: <span className="status-badge primary">{formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)}</span> to <span className="status-badge primary">{formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}</span>
                    </p>
                  )}
                </>
              }
              searchValue=""
              onSearchChange={() => {}}
              onSearch={() => {}}
              searchPlaceholder="Search call stats..."
              showSearch={false}
              filters={pendingFilters}
              onSubmit={() => {
                setCurrentFilters(pendingFilters);
                handleFiltersChange(pendingFilters);
              }}
              onReset={() => {
                setPendingFilters({});
                const resetFilters = { is_incoming_only: 'false' };
                setCurrentFilters(resetFilters);
                handleFiltersChange(resetFilters);
              }}
              filterContent={
                <>
                  

                  {/* Call Status */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Call Status</Form.Label>
                      <SelectBox
                        isSearchable={false}
                        value={(pendingFilters as any)?.call_status || null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, call_status: value as string || '' });
                        }}
                        options={[
                          { value: 'Answered', label: 'Answered' },
                          { value: 'Not Answered', label: 'Not Answered' },
                          { value: 'Both', label: 'Both' }
                        ]}
                        placeholder="Select call status"
                      />
                    </Form.Group>
                  </Col>

                  {/* Called Numbers */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Called Numbers</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter called numbers (comma separated)"
                        value={((pendingFilters as any)?.called_numbers || []).join(', ')}
                        onChange={(e) => {
                          const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                          setPendingFilters({ ...pendingFilters, called_numbers: values });
                        }}
                      />
                    </Form.Group>
                  </Col>

                  {/* Extension */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Extension</Form.Label>
                      <SelectBox
                        isMulti
                        isSearchable={true}
                        isDisabled={hierarchyLoading}
                        value={(pendingFilters as any)?.extension_number?.length > 0 ? (pendingFilters as any)?.extension_number : null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, extension_number: value ? (value as string[]) : [] });
                        }}
                        options={(hierarchyDataExtensions as any)?.map((ext: any) => ({
                          value: ext.id,
                          label: ext.name
                        })) || []}
                        placeholder="Select extensions"
                      />
                    </Form.Group>
                  </Col>

                  {/* Traffic Type */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Traffic Type</Form.Label>
                      <SelectBox
                        isSearchable={false}
                        value={(pendingFilters as any)?.traffic_type || null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, traffic_type: value as string || '' });
                        }}
                        options={[
                          { value: '', label: 'All' },
                          { value: 'internal', label: 'Internal' },
                          { value: 'external', label: 'External' }
                        ]}
                        placeholder="Select traffic type"
                      />
                    </Form.Group>
                  </Col>

                  {/* Destination Type */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Destination Type</Form.Label>
                      <SelectBox
                        isSearchable={false}
                        value={(pendingFilters as any)?.destination_type || null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, destination_type: value as string || '' });
                        }}
                        options={[
                          { value: '', label: 'All' },
                          { value: 'local', label: 'Local' },
                          { value: 'national', label: 'National' },
                          { value: 'international', label: 'International' }
                        ]}
                        placeholder="Select destination type"
                      />
                    </Form.Group>
                  </Col>

                  {/* Departments */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Departments</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter departments (comma separated)"
                        value={((pendingFilters as any)?.department || []).join(', ')}
                        onChange={(e) => {
                          const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                          setPendingFilters({ ...pendingFilters, department: values });
                        }}
                      />
                    </Form.Group>
                  </Col>

                  {/* Date Range - Start */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Start Date Time</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={(pendingFilters as any)?.start_datetime || ''}
                        onChange={(e) => {
                          setPendingFilters({ ...pendingFilters, start_datetime: e.target.value });
                        }}
                      />
                    </Form.Group>
                  </Col>

                  {/* Date Range - End */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>End Date Time</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={(pendingFilters as any)?.end_datetime || ''}
                        min={(pendingFilters as any)?.start_datetime || ''}
                        onChange={(e) => {
                          setPendingFilters({ ...pendingFilters, end_datetime: e.target.value });
                        }}
                      />
                    </Form.Group>
                  </Col>
                </>
              }
            />
            <GenericListPage
              columns={columns}
              fetchData={fetchCallLogs}
              title="Call Logs"
              searchPlaceholder="Search call stats..."
              defaultPageSize={15}
              filters={currentFilters}
              refreshKey={refreshKey}
              key={refreshKey}
              tableStyle='table-style-2'
              search={false}
            />
            </>
          )}
        </>
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
              />
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '500px' }}>
              <i className="fa fa-chart-area fa-4x text-muted mb-3"></i>
              <h5 className="text-muted mb-2">No Chart Data Available</h5>
              <p className="text-muted mb-0">The selected chart data is not available or has been cleared.</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

CallStatsDepartment.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallStatsDepartment;