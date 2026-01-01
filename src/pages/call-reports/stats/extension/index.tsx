import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListCallLogs, ExportCallLogs, DownloadStreamingExport, DownloadCallsExport } from '@utils/calls';

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
import { formatCurrency, formatMinutesAndSeconds, ModuleSlug, GlobalDateTimeFormat, formatDateTimeToLocal, getAutoTimezone } from '@utils/Helper';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const CallStatsExtension = () => {
    const { data:session, status } = useSession();

    const [showDateRange, setShowDateRange] = useState(false);
    const [startDateTime, setStartDateTime] = useState<string>('');
    const [endDateTime, setEndDateTime] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('calls_chart');
    
    

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
        { key: 'Extension', name: 'Extension', selector: (row: any) => row.Extension, sortable: true },
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
    
        // { key: 'Cost', name: 'Total Cost', selector: (row: any) => row.Cost, sortable: true,
        //   cell: (row: any) => formatCurrency(row.Cost)
        //  },
        // { key: 'AvgCost', name: 'Avg Cost', selector: (row: any) => row['Avg Cost'], sortable: true,
        //   cell: (row: any) => formatCurrency(Number(row['Avg Cost']))
        //  },
    ];

  // Initialize filters with default values immediately to prevent first API call without dates
  const getDefaultFilters = () => {
    const now = moment();
    const startDateInput = now.clone().startOf('day').format('YYYY-MM-DDTHH:mm');
    const endDateInput = now.clone().endOf('day').format('YYYY-MM-DDTHH:mm');
    const startDateUTC = now.clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    const endDateUTC = now.clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    return {
      pending: {
        start_datetime: startDateInput,
        end_datetime: endDateInput
      },
      current: {
        start_datetime: startDateUTC,
        end_datetime: endDateUTC
      }
    };
  };
  
  const defaultFilters = getDefaultFilters();
  
    const [refreshKey, setRefreshKey] = useState<number>(1); // Start at 1 to ensure initial fetch
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(defaultFilters.current);
    const [pendingFilters, setPendingFilters] = useState<Record<string, any>>(defaultFilters.pending);
    
    const {
      hierarchyDataExtensions,
      loading: hierarchyLoading
    } = useHierarchyData(ModuleSlug.CALL_REPORTS);
    
    // Use ref to track if initial fetch has been done
    const initialFetchDone = React.useRef(false);
    // Use ref to track last filters used for charts to prevent unnecessary refetches
    const lastChartFilters = React.useRef<string>('');
    
    // Refs to prevent duplicate API calls
    const currentFiltersRef = useRef<Record<string, any>>(defaultFilters.current);
    const isFetchingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const lastFetchParamsRef = useRef<string>('');
    
    const [dataLoaded, setDataLoaded] = useState(false);
    const filtersReady = true; // Always ready since filters are initialized immediately
    const [summary, setSummary] = useState<Summary>({
        total_calls: 0,
        answered_calls: 0,
        unanswered_calls: 0,
        total_cost: 0,
        total_duration:0,
        avg_duration:0,
        avg_ring_time:0
    });

    const [showPageLoader, setShowPageLoader] = useState(false);
    
    const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
        // Prevent duplicate calls - but always allow the first call
        const now = Date.now();
        const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(currentFiltersRef.current)}`;
        
        // Skip if already fetching with same params within 500ms
        if (isFetchingRef.current && lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 500) {
            return;
        }
        
        // Skip if same params were fetched recently (within 100ms) - but allow first call (when lastFetchParamsRef is empty string)
        if (lastFetchParamsRef.current !== '' && lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 100) {
            return;
        }
        
        isFetchingRef.current = true;
        lastFetchTimeRef.current = now;
        lastFetchParamsRef.current = paramsKey;
        
        setLoading(true);
        setShowPageLoader(true);
        
        try {
            const response = await ListCallLogs({ 
                page, 
                perPage, 
                search, 
                filters: currentFiltersRef.current, 
                reportType: 'statsExtension', 
                moduleSlug: ModuleSlug.CALL_REPORTS 
            }, 'call-logs/statsByExtension');
            
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
        } catch {
            setLoading(false);
            setDataLoaded(true);
            toast.error('Failed to fetch call data');
            return null;
        } finally {
            setShowPageLoader(false);
            isFetchingRef.current = false;
        }
    }, []);

    const [simpleDonut, setSimpleDonut] = React.useState<{ series: number[]; labels: string[] } | null>(null);

    useEffect(() => {
        if(summary && dataLoaded) {
          const answeredCalls = Number(summary.answered_calls) || 0;
          const unansweredCalls = Number(summary.unanswered_calls) || 0;
          
          // Check if both values are 0, if so don't set chart data (will show empty state)
          if (answeredCalls === 0 && unansweredCalls === 0) {
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

    // Trigger initial data fetch when filters become ready (only once)
    // Ensure initial fetch happens when session is ready
    useEffect(() => {
        if (session && session.user?.permissions?.includes('list-call-logs')) {
            initialFetchDone.current = true;
        }
    }, [session]);

    
    const handleFiltersChange = (filters: any) => {
        // Convert datetime values from local timezone to UTC before sending to API
        const formattedFilters: any = { ...filters };
        
        if (formattedFilters.start_datetime) {
            // datetime-local returns YYYY-MM-DDTHH:mm format in local timezone
            // Convert to UTC ISO format
            let startMoment = moment(formattedFilters.start_datetime);
            
            if (formattedFilters.start_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                // Format is YYYY-MM-DDTHH:mm, add :00 seconds
                startMoment = moment(formattedFilters.start_datetime + ':00');
            } else if (!formattedFilters.start_datetime.includes('T')) {
                // If only date, set to 00:00:00
                startMoment = moment(formattedFilters.start_datetime).startOf('day');
            }
            
            // Convert to UTC
            formattedFilters.start_datetime = startMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        }
        
        if (formattedFilters.end_datetime) {
            // datetime-local returns YYYY-MM-DDTHH:mm format in local timezone
            // Convert to UTC ISO format
            let endMoment = moment(formattedFilters.end_datetime);
            
            if (formattedFilters.end_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                // Format is YYYY-MM-DDTHH:mm, check if it's 23:59, otherwise add :00
                const timePart = formattedFilters.end_datetime.split('T')[1];
                if (timePart === '23:59') {
                    endMoment = moment(formattedFilters.end_datetime + ':59');
                } else {
                    endMoment = moment(formattedFilters.end_datetime + ':00');
                }
            } else if (!formattedFilters.end_datetime.includes('T')) {
                // If only date, set to 23:59:59
                endMoment = moment(formattedFilters.end_datetime).endOf('day');
            }
            
            // Convert to UTC
            formattedFilters.end_datetime = endMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        }
        
        // Remove is_incoming_only if it's empty, null, or undefined (don't send to API by default)
        if (!formattedFilters.is_incoming_only || formattedFilters.is_incoming_only === '') {
            delete formattedFilters.is_incoming_only;
        }
        
        // Check if filters actually changed
        const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(formattedFilters);
        
        // Check if this is a complete clear (empty object or only has default values)
        const isCompletelyCleared = Object.keys(formattedFilters).length === 0 || 
            (Object.keys(formattedFilters).length === 1 && formattedFilters.hasOwnProperty('is_incoming_only'));
        
        // Update both state and ref immediately
        setCurrentFilters(formattedFilters);
        currentFiltersRef.current = formattedFilters;
        
        // Reset data loaded state when filters actually change or when cleared
        if ((filtersChanged && filtersReady) || isCompletelyCleared) {
            setDataLoaded(false);
            // Reset chart filters ref to allow chart refetch
            lastChartFilters.current = '';
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
        }
    };

    const handleExport = async () => {
      setIsExporting(true);
      try {
        await DownloadCallsExport(currentFilters, 'call-logs/report/extension/download');
      } catch {
        toast.error('Export failed');
      } finally {
        setIsExporting(false);
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
      // Only fetch charts when filters are ready and not empty and session is authenticated
      // Check if filters have actually changed
      const currentFiltersString = JSON.stringify(currentFilters);
      const filtersChanged = lastChartFilters.current !== currentFiltersString;
      
      if (session && filtersChanged && currentFilters && Object.keys(currentFilters).length > 0) {
        lastChartFilters.current = currentFiltersString;
        const fetchCharts = async () => {
          setChartLoading(true);
          try {
            const response = await ListCallLogs({ 
              page: 1, 
              perPage: 15, 
              search: "", 
              filters: currentFilters, 
              reportType: 'chartExtension', 
              moduleSlug: ModuleSlug.CALL_REPORTS 
            }, 'call-logs/stats/extension/chart');
           
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
            if (error instanceof Error) {
            }
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
    }, [currentFilters, session]);

    const [currentChartDataType, setCurrentChartDataType] = useState<'calls' | 'time' | 'cost' | 'custom'>('custom');

    const handleOpenChartModal = (chartData: { series: any[]; categories: string[] } | null, title: string, dataType: 'calls' | 'time' | 'cost' | 'custom') => {
        if (chartData) {
            setCurrentChartData(chartData);
            setCurrentChartTitle(title);
            setCurrentChartDataType(dataType);
            setShowChartModal(true);
        }
    };
    
    // Debug: log when chart data changes
    useEffect(() => {
        console.log('Chart data state updated:', {
            hasChartCalls: !!chartCalls,
            hasChartRingTime: !!chartRingTime,
            hasChartCost: !!chartCost,
            hasChartDuration: !!chartDuration,
            chartLoading
        });
    }, [chartCalls, chartRingTime, chartCost, chartDuration, chartLoading]);
    
    // Debug: log when summary data changes
    useEffect(() => {
        console.log('Summary data updated:', summary);
    }, [summary]);
    
    // Debug: log when dataLoaded state changes
    useEffect(() => {
        console.log('DataLoaded state changed:', dataLoaded);
        console.log('Loading state:', loading);
        console.log('FiltersReady state:', filtersReady);
    }, [dataLoaded, loading, filtersReady]);

    const handleTabChange = (key: string | null) => {
        if (key) {
            console.log('Tab changed to:', key);
            setActiveTab(key);
        }
    };

   
    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Stats By Extension" showPageLoader={showPageLoader} />


            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={5}>
						<h2 className="mb-0">Call Stats By Extension</h2>
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
                    {/* {session?.user?.permissions?.includes('') && ( */}
                      <div className="d-flex align-items-center gap-2">
                        <button 
                          className="btn btn-outline-secondary" 
                          onClick={() => handleExport()}
                          disabled={isExporting}
                        >
                          {isExporting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Exporting...
                            </>
                          ) : (
                            'Export'
                          )}
                        </button>
                      </div>
                    {/* )} */}
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
                            // Loading state for stat cards
                            <>
                                <Col md={6} className="mb-3">
                                    <div className="card report-shadow h-100">
                                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '120px' }}>
                                            <div className="spinner-border text-primary mb-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="text-muted mb-0">Loading...</p>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <div className="card report-shadow h-100">
                                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '120px' }}>
                                            <div className="spinner-border text-primary mb-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="text-muted mb-0">Loading...</p>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <div className="card report-shadow h-100">
                                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '120px' }}>
                                            <div className="spinner-border text-primary mb-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="text-muted mb-0">Loading...</p>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <div className="card report-shadow h-100">
                                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '120px' }}>
                                            <div className="spinner-border text-primary mb-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="text-muted mb-0">Loading...</p>
                                        </div>
                                    </div>
                                </Col>
                            </>
                        ) : dataLoaded && summary.total_calls === 0 && summary.total_duration === 0 && summary.answered_calls === 0 && summary.unanswered_calls === 0 ? (
                            // Empty state when no data is available
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
                            // Normal stat cards when data is available
                            <>
                                <PageSummaryGrid
                                gridColumns={2}
                                    cards={[
                                        {
                                            id: "total-calls",
                                            title: "Total Calls",
                                            value: summary.total_calls,
                                            valueType: "number",
                                            description: "Total number of calls",
                                            delay: 0,
                                            
                                        },
                                        {
                                            id: "avg-ring-time",
                                            title: "Avg Ring Time",
                                            value: summary.avg_ring_time,
                                            valueType: "seconds",
                                            description: "Average ring time for calls",
                                            delay: 0.3
                                        },
                                        {
                                            id: "avg-duration",
                                            title: "Avg Duration",
                                            value: summary.avg_duration,
                                            valueType: "seconds",
                                            description: "Average call duration",
                                            delay: 0.6
                                        },
                                        {
                                            id: "total-cost",
                                            title: "Total Duration",
                                            value: summary.total_duration,
                                            valueType: "seconds",
                                            description: "Total duration of calls",
                                            delay: 0.9,
                                        }
                                    ]}
                                    
                                />
                            </>
                        )}
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
                            ) : simpleDonut ? (
                                <ChartDonut 
                                    series={simpleDonut.series} 
                                    labels={simpleDonut.labels}
                                    dataType="calls"
                                    height={200}
                                    width={500}
                                    showDataLabels={true}
                                    dataLabelsFormatter={(value) => `${value.toFixed(0)}%`}
                                />
                            ) : (
                                <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '180px' }}>
                                    <div className="spinner-border text-primary mb-2" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="text-muted mb-0">Preparing chart visualization...</p>
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
                        <Tab eventKey="calls_chart" title="Calls by Extension">
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
                                                  onFullScreenClick={() => handleOpenChartModal(chartCalls, 'Calls by Extension', 'calls')}
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


                        <Tab eventKey="duration_chart" title="Duration by Extension">
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
                                                                                              onFullScreenClick={() => handleOpenChartModal(chartDuration, 'Duration by Extension', 'time')}
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

                        <Tab eventKey="ring_chart" title="Ring Time by Extension">
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
                                                  onFullScreenClick={() => handleOpenChartModal(chartRingTime, 'Ring Time by Extension', 'time')}
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

                        {/* <Tab eventKey="cost_chart" title="Cost by Extension">
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
                                                  onFullScreenClick={() => handleOpenChartModal(chartCost, 'Cost by Extension', 'cost')}
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
                        </Tab> */}

                    </Tabs>
                </Col>
            </Row>

            {session?.user?.permissions?.includes('list-call-logs') && (
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
                            // Convert and apply filters, then trigger all APIs
                            handleFiltersChange(pendingFilters);
                            // fetchCallLogs will be triggered by refreshKey change
                            // Chart data will be triggered by useEffect watching currentFilters
                          }}
                          onReset={() => {
                            // Preserve current date filters, clear all other filters
                            const resetPendingFilters: Record<string, any> = {
                              start_datetime: (pendingFilters as any)?.start_datetime || defaultFilters.pending.start_datetime,
                              end_datetime: (pendingFilters as any)?.end_datetime || defaultFilters.pending.end_datetime
                            };
                            const resetCurrentFilters: Record<string, any> = {
                              start_datetime: (currentFilters as any)?.start_datetime || defaultFilters.current.start_datetime,
                              end_datetime: (currentFilters as any)?.end_datetime || defaultFilters.current.end_datetime
                            };
                            setPendingFilters(resetPendingFilters);
                            setCurrentFilters(resetCurrentFilters);
                            currentFiltersRef.current = resetCurrentFilters;
                            handleFiltersChange(resetPendingFilters);
                          }}
                          filterContent={
                            <>
                              

                              {/* Call Direction */}
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label>Call Direction</Form.Label>
                                  <SelectBox
                                    isSearchable={false}
                                    value={(pendingFilters as any)?.is_incoming_only || null}
                                    onChange={(value) => {
                                      setPendingFilters({ ...pendingFilters, is_incoming_only: value as string || '' });
                                    }}
                                    options={[
                                      { value: 'true', label: 'Incoming' },
                                      { value: 'false', label: 'Outgoing' },
                                      { value: '', label: 'Both' }
                                    ]}
                                    placeholder="Select call direction"
                                  />
                                </Form.Group>
                              </Col>

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
                                    placeholder="Enter department"
                                    value={(pendingFilters as any)?.department || ''}
                                    onChange={(e) => {
                                      setPendingFilters({ ...pendingFilters, department: e.target.value });
                                    }}
                                  />
                                </Form.Group>
                              </Col>

                              {/* Date Range - Start */}
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label>Start Date & Time</Form.Label>
                                  <Form.Control
                                    type="datetime-local"
                                    value={(pendingFilters as any)?.start_datetime || ''}
                                    max={moment().format('YYYY-MM-DDTHH:mm')}
                                    onChange={(e) => {
                                      const datetimeValue = e.target.value;
                                      const endDate = (pendingFilters as any)?.end_datetime || '';
                                      
                                      // If start date is greater than end date, adjust end date to start date
                                      let updatedFilters: any = {
                                          ...pendingFilters,
                                          start_datetime: datetimeValue
                                      };
                                      
                                      if (datetimeValue && endDate && moment(datetimeValue).isAfter(moment(endDate))) {
                                          updatedFilters.end_datetime = datetimeValue;
                                      }
                                      
                                      setPendingFilters(updatedFilters);
                                    }}
                                  />
                                </Form.Group>
                              </Col>

                              {/* Date Range - End */}
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label>End Date & Time</Form.Label>
                                  <Form.Control
                                    type="datetime-local"
                                    value={(pendingFilters as any)?.end_datetime || ''}
                                    min={(pendingFilters as any)?.start_datetime || ''}
                                    max={moment().format('YYYY-MM-DDTHH:mm')}
                                    onChange={(e) => {
                                      const datetimeValue = e.target.value;
                                      const startDate = (pendingFilters as any)?.start_datetime || '';
                                      
                                      // If end date is less than start date, adjust start date to end date
                                      let updatedFilters: any = {
                                          ...pendingFilters,
                                          end_datetime: datetimeValue
                                      };
                                      
                                      if (datetimeValue && startDate && moment(datetimeValue).isBefore(moment(startDate))) {
                                          updatedFilters.start_datetime = datetimeValue;
                                      }
                                      
                                      setPendingFilters(updatedFilters);
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
                            search={false}
                            tableStyle='table-style-2'
                        />
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

CallStatsExtension.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallStatsExtension;
