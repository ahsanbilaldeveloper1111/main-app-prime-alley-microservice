import '@assets/scss/datatable-style.scss';

import React, { ReactElement, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from "socket.io-client";
import { Col, Button, Card, Modal, Row, Form } from 'react-bootstrap';

import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import type { NextPage } from 'next';
import moment from 'moment';
import dynamic from 'next/dynamic';

// Components
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableAction, TableColumn } from '@components/GenericTable';
import CallRecordingsFilters from '@components/filters/CallRecordingFilter';
import BarFilters from '@components/BarFilters';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import AnimatedNumber from '@components/AnimatedNumber';
import StatCard from '@components/StatCard';
import ChartBar from '@components/ChartBar';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import EmptyState from '@components/EmptyState';
import { ModuleSlug } from '@utils/Helper';
import SelectBox from '@components/SelectBox';
import { BarChart3, Hash, Phone, PhoneIncoming, PhoneOutgoing, Filter, Calendar } from 'lucide-react';
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import GenericFilterSidebar, { FilterFieldType } from '@components/GenericFilterSidebar';

import '@assets/scss/common.scss';

// Utils
import { ListCallLogs, ExportCallLogs, DownloadCallRecording, DownloadStreamingExport } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';

// Assets
import imgStatus1 from '@assets/images/widget/img-status-1.svg';
import imgStatus2 from '@assets/images/widget/img-status-2.svg';
import imgStatus3 from '@assets/images/widget/img-status-3.svg';
import imgStatus4 from '@assets/images/widget/img-status-4.svg';
import router from 'next/router';
import axiosInstance from '@utils/axios';
import { toast } from 'react-toastify';
import { formatDuration, GlobalDateFormat, GlobalTimeFormat, GlobalDateTimeFormat, encodeAnalysisData, convertDateTimeWithOffsetToLocal, formatDateTimeToLocal } from '@utils/Helper';
import PageLoader from '@components/PageLoader';
import CircularProgressLoader from '@components/CircularProgressLoader';
import CircularProgressCircle from '@components/CircularProgressCircle';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const sparklineData = [25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54];

const randomizeArray = (arr: number[]) => arr
  .map((value: number) => ({ value, sort: Math.random() }))
  .sort((a: { value: number; sort: number }, b: { value: number; sort: number }) => a.sort - b.sort)
  .map(({ value }: { value: number }) => value);

// Interfaces
interface Summary {
  numbers: number;
  extensions: number;
  inbound: number;
  outbound: number;
}

interface ChartDuration {
  label: string[];
  longest_call: number[];
  shortest_call: number[];
  average_call: number[];
}

interface ChartDirection{
  inbound: number[];
  outbound: number[];
  label: string[];
}

interface RecordingUpdate {
  message: string;
  data: {
    AgentExtension: string;
    [key: string]: any;
  };
}

/** Row shape from call-recordings API (dataList items) */
interface RecordingRow {
  Id?: string;
  DateTime?: string;
  AgentExtension?: string;
  Username?: string;
  Department?: string;
  RemotePartyNumber?: string;
  Direction?: string;
  Duration?: string | number;
  imagicle?: string;
  [key: string]: any;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_CALL_LOGS_SOCKET_URL;

const CallRecordings: NextPage & { getLayout?: (page: React.ReactElement) => React.ReactNode } = () => {
  const { data: session, status } = useSession();
  const { getAccessToken } = useTokenService();
  const stableGetAccessToken = useCallback(getAccessToken, []);
  const socketRef = useRef<Socket | null>(null);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const [showPageLoader, setShowPageLoader] = useState(false);

  // const [showDateRange, setShowDateRange] = useState(false);
  // const [startDateTime, setStartDateTime] = useState<string>('');
  // const [endDateTime, setEndDateTime] = useState<string>('');

  const [showDateRange, setShowDateRange] = useState(true);
  const [startDateTime, setStartDateTime] = useState<string>(() =>
    moment().clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
  );
  const [endDateTime, setEndDateTime] = useState<string>(() =>
    moment().clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
  );
  // Initialize filters with default values immediately to prevent first API call without dates
  const getDefaultFilters = () => {
    const now = moment();
    const startDateInput = now.clone().startOf('day').format('YYYY-MM-DDTHH:mm');
    const endDateInput = now.clone().endOf('day').format('YYYY-MM-DDTHH:mm');
    const startDateApi = now.clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    const endDateApi = now.clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    return {
      current: {
        start_date: startDateInput,
        end_date: endDateInput
      },
      applied: {
        start_date: startDateApi,
        end_date: endDateApi
      }
    };
  };
  
  const defaultFilters = getDefaultFilters();
  
  // State declarations
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(defaultFilters.current);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>(defaultFilters.applied); // Filters that trigger API calls
  const [searchValue, setSearchValue] = useState<string>('');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  // Refs to prevent duplicate API calls
  const appliedFiltersRef = useRef<Record<string, any>>(defaultFilters.applied);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const lastFetchParamsRef = useRef<string>('');
  
  // Use hierarchy data hook
  const { 
    hierarchyDataExtensions,
    hierarchyDataDepartments,
    hierarchyDataUsers,
    loading: hierarchyLoading
  } = useHierarchyData(ModuleSlug.CALL_RECORDINGS);
  const [callDurationBarChartModal, setCallDurationBarChartModal] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [currentChartTitle, setCurrentChartTitle] = useState('');
  const [mediaPlayerModal, setMediaPlayerModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [mediaPlayerShow, setMediaPlayerShow] = useState(false);
  const [downloadingRecordings, setDownloadingRecordings] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  
  // State for managing data and manual additions
  const [currentData, setCurrentData] = useState<any[]>([]);
  const [isDataModified, setIsDataModified] = useState(false);
  const modifiedDataRef = useRef<any[]>([]);
  const [tableData, setTableData] = useState<RecordingRow[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<{
    totalRows: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }>({
    totalRows: 0,
    totalPages: 0,
    currentPage: 1,
    perPage: 15,
  });
  const rowsPerPageRef = useRef(15);
  const [socketExtensions, setSocketExtensions] = useState<number[]>([]);

  const [summary, setSummary] = useState<Summary>({
    numbers: 0,
    extensions: 0,
    inbound: 0,
    outbound: 0
  });

  // Stats cards data for StatsCards component
  const statsCardsData = [
    {
      title: 'Extensions',
      value: summary?.extensions || 0,
      icon: Hash,
      iconColor: '#8B5CF6',
      iconBgColor: '#EDE9FE',
      subtitle: 'Extensions in the system',
    },
    {
      title: 'Remote Numbers',
      value: summary?.numbers || 0,
      icon: Phone,
      iconColor: '#3B82F6',
      iconBgColor: '#DBEAFE',
      subtitle: 'Remote numbers in the system',
    },
    {
      title: 'Inbound',
      value: summary?.inbound || 0,
      icon: PhoneIncoming,
      iconColor: '#10B981',
      iconBgColor: '#D1FAE5',
      subtitle: 'Inbound calls in the system',
    },
    {
      title: 'Outbound',
      value: summary?.outbound || 0,
      icon: PhoneOutgoing,
      iconColor: '#0EA5E9',
      iconBgColor: '#E0F2FE',
      subtitle: 'Outbound calls in the system',
    },
   
  ];

  // Create cards data for PageSummaryGrid
  const summaryCards: SummaryCard[] = [
    {
      id: 'total-gsms-count',
      title: 'Extensions',
      value: summary?.extensions || 0,
      description: 'Extensions in the system',
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'assigned-gsms-count',
      title: 'Remote Numbers',
      value: summary?.numbers || 0,
      description: 'Remote numbers in the system',
      delay: 0.3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'unassigned-gsms-count',
      title: 'Inbound',
      value: summary?.inbound || 0,
      description: 'Inbound calls in the system',
      delay: 0.5,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'total-ports-count',
      title: 'Outbound',
      value: summary?.outbound || 0,
      description: 'Outbound calls in the system',
      delay: 0.7,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    }
  ];

  const [callDirectionTwo, setCallDirectionTwo] = React.useState<{
    series: Array<{ name: string; data: number[] }>;
    options: any;
  }>({
    series: [],
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
        categories: [] as string[],
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

  // Functions
  const addNewRecord = () => {
    const newRecord = {
      "Id": "F035BC55-6FA5-4553-A4F3-0C36D269C3E0",
      "Direction": "CALL_OUTGOING",
      "LocalCallId": null,
      "RemoteCallId": null,
      "AgentExtension": "4030",
      "RemotePartyNumber": "0543879764",
      "RecordId": "2025004387522",
      "AudioTrack": "\\2025\\08\\07\\Record_20250807021403_4030_default_C808a6829400671_Recorder",
      "Duration": 5553198016,
      "OwnerId": "89CD4A38-A4AB-4F8F-BD52-3B1A2CE886A9",
      "PreservingUserId": null,
      "NoteOwnerId": null,
      "Note": null,
      "DateTime": "2025-08-06T22:14:03.944000Z",
      "NoteDateTime": null,
      "OwnerPropertiesId": "6E39C533-9D5D-4CC3-9B28-B1F4A96282AE",
      "PreservingUserPropertiesId": null,
      "NoteOwnerPropertiesId": null,
      "NodeId": "IMAGICLE_GW_DC_02",
      "Size": "2222624"
    };

    // Update the table data directly without triggering API call
    setTableData(prevData => {
      const updatedData = [...prevData, newRecord];
      modifiedDataRef.current = updatedData;
      setIsDataModified(true);
      return updatedData;
    });


    // Update summary counts
    setSummary(prevSummary => ({
      ...prevSummary,
      numbers: prevSummary.numbers + 1,
      outbound: prevSummary.outbound + 1
    }));

    toast.success('New record added successfully');
  };

  const fetchCallLogsOriginal = useCallback(async (page = 1, perPage = 15, search = "") => {
    // Prevent duplicate calls
    const now = Date.now();
    const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(appliedFiltersRef.current)}`;
    
    // Skip if already fetching with same params within 500ms
    if (isFetchingRef.current && lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 500) {
      return;
    }
    
    // Skip if same params were fetched recently (within 100ms)
    if (lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 100) {
      return;
    }
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    lastFetchParamsRef.current = paramsKey;

    setShowPageLoader(true);
    setTableLoading(true);
    try {
      const response = await ListCallLogs(
        { page, perPage, search, filters: appliedFiltersRef.current, reportType: 'recordings', moduleSlug: ModuleSlug.CALL_RECORDINGS },
        'call-logs/recordings'
      );

    if (response?.summary) {
      setSummary(response.summary)
    }

    // Handle various API response structures for data (flat, nested, DataTables style)
    const rawData = response?.data;
    let rowsArray: RecordingRow[] = [];
    if (Array.isArray(rawData)) {
      rowsArray = rawData;
    } else if (Array.isArray(rawData?.data)) {
      rowsArray = rawData.data;
    } else if (Array.isArray(response?.dataList)) {
      rowsArray = response.dataList;
    }

    setCurrentData(rowsArray);
    setTableData(rowsArray);
    modifiedDataRef.current = rowsArray;
    setIsDataModified(false);

    // Update pagination info - handle various API structures
    if (response) {
      const paginationData = response?.data?.pagination ?? response?.pagination ?? response;
      const total =
        response?.recordsTotal ??
        response?.total ??
        rawData?.recordsTotal ??
        rawData?.total ??
        paginationData?.total ??
        (rowsArray.length > 0 ? rowsArray.length : 0);
      const currentPage = response?.current_page ?? paginationData?.current_page ?? page;
      const perPageVal = response?.per_page ?? paginationData?.per_page ?? perPage;
      rowsPerPageRef.current = perPageVal;
      setPaginationInfo({
        totalRows: Number(total) || 0,
        totalPages: (response?.last_page ?? paginationData?.last_page ?? Math.ceil(Number(total) / perPageVal)) || 1,
        currentPage,
        perPage: perPageVal,
      });
    }

    if (response?.chart?.extension) {
      const dataExtension = response.chart.extension;
      if (dataExtension.length > 0) {
        const newChartData: ChartDuration = {
          label: [],
          longest_call: [],
          shortest_call: [],
          average_call: []
        };

        const ms = 10000000;
        dataExtension.forEach((item: any) => {
          newChartData.label.push(item.label);
          // Parse string values to numbers before division
          const longestCall = typeof item.longest_call === 'string' 
            ? Number.parseFloat(item.longest_call) 
            : Number(item.longest_call) || 0;
          const shortestCall = typeof item.shortest_call === 'string' 
            ? Number.parseFloat(item.shortest_call) 
            : Number(item.shortest_call) || 0;
          const averageCall = typeof item.average_call === 'string' 
            ? Number.parseFloat(item.average_call) 
            : Number(item.average_call) || 0;
          
          newChartData.longest_call.push(longestCall / ms);
          newChartData.shortest_call.push(shortestCall / ms);
          newChartData.average_call.push(averageCall / ms);
        });

        setChartLoading(true);

        const dataLength = newChartData.label.length;

        if (dataLength > 0 &&
          newChartData.shortest_call.length === dataLength &&
          newChartData.longest_call.length === dataLength &&
          newChartData.average_call.length === dataLength) {

          // Calls Chart
          setCurrentChartData({
            series: [
              { name: 'Short', data: newChartData.shortest_call },
              { name: 'Average', data: newChartData.average_call },
              { name: 'Long', data: newChartData.longest_call }
            ],
            categories: newChartData.label
          });
          setChartLoading(false);
        } else {
          setChartLoading(false);
        }
      } else {
        setChartLoading(false);
      }
    } else {
      setChartLoading(false);
    }



    if (response?.chart?.date) {
      const dataDirection = response.chart.date;
      if (dataDirection.length > 0) {
        const newChartDirection: ChartDirection = {
          inbound: [],
          outbound: [],
          label: []
        };

        dataDirection.forEach((item: any) => {
          newChartDirection.inbound.push(item.inbound);
          newChartDirection.outbound.push(item.outbound);
          newChartDirection.label.push(item.label);
        });

        setCallDirectionTwo({
          series: [
            { name: 'Inbound', data: newChartDirection.inbound },
            { name: 'Outbound', data: newChartDirection.outbound }
          ],
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
              categories: newChartDirection.label,
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
          }
        });
      }
    }

      return response;
    } finally {
      setShowPageLoader(false);
      setTableLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Wrapper function that handles modified data
  const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
    const response = await fetchCallLogsOriginal(page, perPage, search);

    if (response?.summary) {
      setShowDateRange(true);
      const dataFilters = response?.filters;
      setStartDateTime(dataFilters?.start_date);
      setEndDateTime(dataFilters?.end_date);
    }
    // Return modified data if data has been manually added, otherwise return original response
    if (isDataModified && modifiedDataRef.current.length > 0) {
      return {
        ...response,
        dataList: modifiedDataRef.current
      };
    }
    
    return response;
  }, [fetchCallLogsOriginal, isDataModified]);


  const handleOpenChartModal = (
    chartData: { series: any[]; categories: string[] } | null,
    title: string,
    dataType: 'calls' | 'time' | 'cost' | 'custom'
  ) => {
    if (chartData) {
      setCurrentChartData(chartData);
      setCurrentChartTitle(title);
      setCallDurationBarChartModal(true);
    }
  };

  const handleFiltersChange = (filters: any) => {
    // Format datetime values to include seconds and timezone offset (remove timezone key)
    const formattedFilters: any = { ...filters };
    
    if (formattedFilters.start_date) {
      // datetime-local returns YYYY-MM-DDTHH:mm format, convert to YYYY-MM-DDTHH:mm:ss with timezone offset
      let startMoment = moment(formattedFilters.start_date);
      
      if (formattedFilters.start_date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        // Format is YYYY-MM-DDTHH:mm, add :00 seconds
        startMoment = moment(formattedFilters.start_date + ':00');
      } else if (!formattedFilters.start_date.includes('T')) {
        // If only date, set to 00:00:00
        startMoment = moment(formattedFilters.start_date).startOf('day');
      }
      
      // Convert to UTC
      formattedFilters.start_date = startMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    }
    
    if (formattedFilters.end_date) {
      // datetime-local returns YYYY-MM-DDTHH:mm format, convert to YYYY-MM-DDTHH:mm:ss with timezone offset
      let endMoment = moment(formattedFilters.end_date);
      
      if (formattedFilters.end_date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        // Format is YYYY-MM-DDTHH:mm, check if it's 23:59, otherwise add :00
        const timePart = formattedFilters.end_date.split('T')[1];
        if (timePart === '23:59') {
          endMoment = moment(formattedFilters.end_date + ':59');
        } else {
          endMoment = moment(formattedFilters.end_date + ':00');
        }
      } else if (!formattedFilters.end_date.includes('T')) {
        // If only date, set to 23:59:59
        endMoment = moment(formattedFilters.end_date).endOf('day');
      }
      
      // Convert to UTC
      formattedFilters.end_date = endMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    }
    
    // Remove timezone key from payload (timezone is now included in datetime values)
    delete formattedFilters.timezone;
    
    // Update both state and ref immediately
    setCurrentFilters(filters); // Keep input format for display
    setAppliedFilters(formattedFilters); // Use formatted filters for API (with timezone in datetime)
    appliedFiltersRef.current = formattedFilters;
    
    // Trigger refresh for GenericListPage to fetch new data
    setRefreshKey((prev) => prev + 1);
    
    // Clear chart data when filters are cleared
    if (!filters || Object.keys(filters).length === 0) {
      setCurrentChartData(null);
      setCallDirectionTwo({
        series: [],
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
            categories: [] as string[],
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
      setChartLoading(false);
    }
  };

  const handleExport = async (exportType: string, filters: Record<string, any>) => {
    setShowPageLoader(true);
    try {
      if (exportType === 'excel') {
       
        await DownloadStreamingExport(
          { filters: appliedFilters, isExport: true, exportType, moduleSlug: ModuleSlug.CALL_RECORDINGS},
          'call-logs/recordings',
          'recordings'
        ).finally(() => {
          setShowPageLoader(false);
        });
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleDownload = async (props: any) => {
    const { Id, AgentExtension } = props;
    
    // Add to downloading set and initialize progress
    setDownloadingRecordings(prev => new Set(prev).add(Id));
    setDownloadProgress(prev => ({ ...prev, [Id]: 0 }));
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          const currentProgress = prev[Id] || 0;
          if (currentProgress < 90) {
            return { ...prev, [Id]: currentProgress + Math.random() * 15 };
          }
          return prev;
        });
      }, 200);

      await DownloadCallRecording(
        Id, AgentExtension, 'call-logs/recordings/download', props.imagicle
      );
      
      // Complete the progress
      clearInterval(progressInterval);
      setDownloadProgress(prev => ({ ...prev, [Id]: 100 }));
      
      // Show completion briefly before hiding
      setTimeout(() => {
        setDownloadingRecordings(prev => {
          const newSet = new Set(prev);
          newSet.delete(Id);
          return newSet;
        });
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[Id];
          return newProgress;
        });
      }, 1000);
      
    } catch (error) {
      toast.error('Download failed');
      
      // Remove from downloading set on error
      setDownloadingRecordings(prev => {
        const newSet = new Set(prev);
        newSet.delete(Id);
        return newSet;
      });
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[Id];
        return newProgress;
      });
    }
  };


  const handleAnalysis = async (props: any) => {
    try {
      const { Id, AudioTrack } = props;
      
      // Create data object with all parameters
      const dataObject = {
        uuid: Id || '',
        direction: props?.Direction || '',
        phone: props?.AgentExtension || '',
        imagicle: props?.imagicle || '',
        duration: props?.Duration || '',
        dateTime: props?.DateTime || '',
        dateOnly: props?.DateOnly || '',
        remotePartyNumber:props?.RemotePartyNumber || '',
        ownerUsername:props?.Username || '',
        localPartyNumber:props?.AgentExtension || '',
      };
      console.log('dataObject before analysis', dataObject);

      // Encode data to base64 (unreadable format) using helper function
      const encodedData = encodeAnalysisData(dataObject);
      
      // Pass as single encoded parameter
      const tempUrl = `/ai-ml/analysis/new?data=${encodeURIComponent(encodedData)}`;

      window.open(tempUrl, '_blank');
      

    } catch {
      // Error handling for navigation
    }
  };

  const handlePlayRecording = (recording: any) => {

    setShowPageLoader(true);
    const trackId = recording.Id;
    const agentExtension = recording.AgentExtension;

    loadAuthenticatedAudio(trackId, agentExtension, recording.imagicle);

    setSelectedRecording(recording);
     
      setAudioLoading(false);
      setAudioError(null);
  };


  const loadAuthenticatedAudio = async (audioTrackId: string, agentExtension: string, node?: string) => {
    if (!audioTrackId) return;
    
    setAudioLoading(true);
    setAudioError(null);
    setMediaPlayerShow(false);
    
    try {
      const response = await axiosInstance.get(`call-logs/recordings/download/${audioTrackId}`, {
        responseType: 'blob',
        params: {
          extension_number: agentExtension,
          node: node
        },
        headers: {
          'Accept': 'audio/*, application/octet-stream, */*'
        }
      });
      setShowPageLoader(false);
      
      if (response.status === 200) {
        setMediaPlayerModal(true);
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const audioUrl = window.URL.createObjectURL(blob);
        setAudioUrl(audioUrl);
      } else if (response.status === 204) {
        toast.error('Audio file not found');
      } else {
        setAudioError(`Unexpected response status: ${response.status}`);
      }
      
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 204) {
          toast.error('Audio file not found');
        } else {
          setAudioError(`Error loading audio: ${error.response.status}`);
        }
      } else if (error.request) {
        setAudioError('No response received from server');
      } else {
        setAudioError(`Request error: ${error.message}`);
      }
    } finally {
      setAudioLoading(false);
    }
  };

  const handleCloseModal = () => {
    setMediaPlayerModal(false);
    setSelectedRecording(null);
    setAudioLoading(false);
    setAudioError(null);
    // Stop audio playback
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
  };

  rowsPerPageRef.current = paginationInfo.perPage;

  // Initial load and refetch when filters/refresh change
  useEffect(() => {
    setPaginationInfo((prev) => ({ ...prev, currentPage: 1 }));
    fetchCallLogsOriginal(1, rowsPerPageRef.current, '');
  }, [refreshKey, fetchCallLogsOriginal]);

  // Table columns for GenericTable (defined after handlers so they are in scope)
  const tableColumns: TableColumn<RecordingRow>[] = [
    {
      key: 'DateTime',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <div>{convertDateTimeWithOffsetToLocal(row.DateTime ?? '', undefined, GlobalDateFormat)}</div>
      ),
    },
    {
      key: 'Time',
      label: 'Time',
      sortable: true,
      render: (row) => (
        <div>{convertDateTimeWithOffsetToLocal(row.DateTime ?? '', undefined, GlobalTimeFormat)}</div>
      ),
    },
    { key: 'AgentExtension', label: 'Extension', sortable: true },
    { key: 'Username', label: 'Username', sortable: true },
    {
      key: 'Department',
      label: 'Department',
      sortable: true,
      render: (row) => row.Department || '---',
    },
    { key: 'RemotePartyNumber', label: 'Remote Number', sortable: true },
    { key: 'Direction', label: 'Direction', sortable: true },
    {
      key: 'Duration',
      label: 'Duration',
      sortable: true,
      render: (row) => {
        const duration = parseInt(String(row.Duration), 10) / 10000000 || 0;
        return <div>{formatDuration(duration)}</div>;
      },
    },
  ];

  const recordingActions: TableAction<RecordingRow>[] = [
    {
      label: 'Actions',
      render: (row) => {
        const isDownloading = downloadingRecordings.has(row.Id ?? '');
        const progress = downloadProgress[row.Id ?? ''] || 0;
        return (
          <div className="d-flex gap-3 action-box">
            <i
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Play"
              className="ph-duotone ph-play text-info"
              style={{ fontSize: '1rem', cursor: 'pointer' }}
              onClick={() => handlePlayRecording(row)}
            />
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
              {isDownloading ? (
                <CircularProgressCircle
                  progress={progress}
                  size="small"
                  color="#28a745"
                  backgroundColor="#e9ecef"
                  textColor="#495057"
                  showPercentage={false}
                  className="circular-progress-inline"
                />
              ) : (
                <i
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Download"
                  className="ph-duotone ph-arrow-line-down text-info"
                  style={{ fontSize: '1rem', cursor: 'pointer' }}
                  onClick={() => handleDownload(row)}
                />
              )}
            </div>
            {session?.user?.permissions?.includes('transcriptions-analysis-aiml') && (
              <i
                data-tooltip-id="my-tooltip"
                data-tooltip-content="Call Analysis"
                className="ph-duotone ph-chart-bar text-info"
                style={{ fontSize: '1rem', cursor: 'pointer' }}
                onClick={() => handleAnalysis(row)}
              />
            )}
          </div>
        );
      },
    },
  ];

  // Socket connection effect
  // useEffect(() => {
  //   if (status === 'authenticated' && session) {
  //     // Initialize socket connection
  //     socketRef.current = io(SOCKET_URL, {
  //       auth: {
  //         token: stableGetAccessToken()
  //       }
  //     });

  //      // Socket event listeners
  //      socketRef.current.on('connect', () => {
  //        // Join room for all extensions
  //        if (socketExtensions.length > 0) {
  //          socketRef.current?.emit('join:recording', socketExtensions);
  //        }
  //      });

  //     socketRef.current.on('disconnect', () => {
  //       console.log('Socket disconnected from call recordings');
  //     });

  //      socketRef.current.on('recording_update', (data: RecordingUpdate) => {
  //        console.log('Recording update received:', data);
         
  //        // Add the new recording data to the table
  //        if (data) {
           
  //          // Add to table data directly
  //          setTableData(prevData => {
  //            const updatedData = [...prevData, data];
  //            modifiedDataRef.current = updatedData;
  //            setIsDataModified(true);
  //            return updatedData;
  //          });


  //          // Update summary counts
  //          setSummary(prevSummary => ({
  //            ...prevSummary,
  //            numbers: prevSummary.numbers + 1,
  //            outbound: prevSummary.outbound + 1
  //          }));

  //          toast.success('New recording received and added to table');
  //        }
  //      });

  //     socketRef.current.on('error', (error: any) => {
  //       console.error('Socket error:', error);
  //     });

  //     // Cleanup function
  //     return () => {
  //       if (socketRef.current) {
  //         socketRef.current.disconnect();
  //         socketRef.current = null;
  //       }
  //     };
  //   }
  //  }, [status, session, stableGetAccessToken, socketExtensions]);

  return (
    <React.Fragment>
      {/* Chart Modal */}
      <Modal
        show={callDurationBarChartModal}
        onHide={() => setCallDurationBarChartModal(false)}
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
                dataType="time"
              />
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '500px' }}>
              <p className="text-muted mb-0">No chart data available</p>
            </div>
          )}
        </Modal.Body>
      </Modal>


      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Recordings" showPageLoader={showPageLoader} />
      
      <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">Call Recordings</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons d-flex align-items-center gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowFiltersSidebar(true)}
                        className="d-flex align-items-center"
                        style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', padding: '0.5rem 1rem' }}
                      >
                        <Filter size={16} className="me-1" />
                        Filters
                      </Button>
                      {/* <Button
                        variant={showAnalytics ? "primary" : "outline-secondary"}
                        size="sm"
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="d-flex align-items-center"
                        style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', padding: '0.5rem 1rem' }}
                      >
                        <BarChart3 size={16} className="me-1" />
                        <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
                      </Button> */}
                    </div>



                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

    

      {/* <PageSummaryGrid cards={summaryCards} /> */}
      <div className="mb-4">
        <StatsCards data={statsCardsData} gridMinWidth="180px" />
      </div>

      {showDateRange && startDateTime && endDateTime && moment.utc(startDateTime).isValid() && moment.utc(endDateTime).isValid() && (
        <div
          className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 12px',
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span
              className="d-inline-flex align-items-center justify-content-center"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#eef2ff',
                color: '#4f46e5',
              }}
            >
              <Calendar size={16} />
            </span>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>
                Selected Date Range
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                {formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)} — {formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}
              </span>
            </div>
          </div>
          {/* <div className="d-flex align-items-center gap-2">
            <span className="status-badge primary">{formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)}</span>
            <span className="text-muted" style={{ fontSize: '12px' }}>to</span>
            <span className="status-badge primary">{formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}</span>
          </div> */}
        </div>
      )}
      {/* Charts */}
      {showAnalytics && (
      <Row className="mb-3">
        <Col md={6}>
          <Card>
            <Card.Body className='p-3'>
              

              {!currentChartData || currentChartData.series.length === 0 || currentChartData.series.every(series => series.data.length === 0) ? (
                <EmptyState
                  title="No Call Duration Data"
                  description="Chart data will appear here when available."
                  className="table-empty-state"
                />
              ) : (
                <>
                <h5 className="app-title-heading">Call Duration</h5>
                
                
                <ChartBar
                  series={currentChartData?.series || []}
                  categories={currentChartData?.categories || []}
                  dataType="time"
                  height={300}
                  loading={chartLoading}
                  yAxisLabel="Extensions"
                  maxDisplayedItems={5}
                  showViewAllButton={true}
                  viewAllButtonText="View All"
                  showFullScreenButton={true}
                  onFullScreenClick={() => handleOpenChartModal(currentChartData, 'Call Duration', 'calls')}
                  useLogScale={true}
                />
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Body className='p-3'>
            
              {!callDirectionTwo.series || callDirectionTwo.series.length === 0 || callDirectionTwo.series.every(series => series.data.length === 0) ? (
                <EmptyState
                  title="No Call Direction Data"
                  description="Chart data will appear here when available."
                  className="table-empty-state"
                />
              ) : (
                <>
                <h5 className="app-title-heading">Call Directions</h5>
                <ReactApexChart
                  options={callDirectionTwo.options}
                  series={callDirectionTwo.series}
                  type="bar"
                  height={300}
                />
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}

      

      

{session?.user?.permissions?.includes('list-call-recordings') && (
                 <GenericTable<RecordingRow>
                   data={tableData}
                   columns={tableColumns}
                   actions={recordingActions}
                   actionsLabel="Action"
                   loading={tableLoading}
                   emptyMessage="No call recordings found."
                   loadingMessage="Loading call recordings..."
                   pagination={{
                     currentPage: paginationInfo.currentPage,
                     rowsPerPage: paginationInfo.perPage,
                     totalRows: paginationInfo.totalRows,
                     pageSizeOptions: [10, 15, 25, 50, 100],
                   }}
                   onPaginationChange={(page, rowsPerPage) => {
                     setPaginationInfo((prev) => ({ ...prev, currentPage: page, perPage: rowsPerPage }));
                     fetchCallLogsOriginal(page, rowsPerPage, '');
                   }}
                   sortable={true}
                   hover={true}
                   striped={false}
                   customizableColumns={true}
                   defaultSelectedColumns={['DateTime', 'Time', 'AgentExtension', 'Username', 'Department', 'RemotePartyNumber', 'Direction', 'Duration']}
                   columnStorageKey="call-recordings-columns"
                   uniqueKey="Id"
                 />
            )}

<GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={() => setShowFiltersSidebar(false)}
        title="Filters"
        subtitle="Filter and refine call recordings"
        width="400px"
        filters={[
          {
            id: 'call_direction',
            label: 'Call Direction',
            type: 'select',
            value: (currentFilters as any)?.call_direction
              ? { value: (currentFilters as any).call_direction, label: (currentFilters as any).call_direction === 'OUTGOING' ? 'Outgoing' : (currentFilters as any).call_direction === 'INCOMING' ? 'Incoming' : 'Both' }
              : null,
            onChange: (selected: any) => setCurrentFilters({ ...currentFilters, call_direction: selected?.value ?? '' }),
            options: [
              { value: 'OUTGOING', label: 'Outgoing' },
              { value: 'INCOMING', label: 'Incoming' },
              { value: 'Both', label: 'Both' },
            ],
            placeholder: 'Select call direction',
            isClearable: true,
          },
          {
            id: 'extension_number',
            label: 'Extension',
            type: 'multi-select',
            value: ((currentFilters as any)?.extension_number || []).map((id: string) => {
              const ext = (hierarchyDataExtensions as any)?.find((e: any) => e.id === id);
              return ext ? { value: ext.id, label: ext.name } : { value: id, label: id };
            }).filter((o: { value: string; label: string }) => o.value),
            onChange: (selected: any) => setCurrentFilters({ ...currentFilters, extension_number: selected ? selected.map((s: any) => s.value) : [] }),
            options: (hierarchyDataExtensions as any)?.map((ext: any) => ({ value: ext.id, label: ext.name })) || [],
            placeholder: 'Select extensions',
            isClearable: true,
          },
          {
            id: 'department',
            label: 'Departments',
            type: 'multi-select',
            value: ((currentFilters as any)?.department || []).map((id: string) => {
              const dept = (hierarchyDataDepartments as any)?.find((d: any) => d.id === id);
              return dept ? { value: dept.id, label: dept.name } : { value: id, label: id };
            }).filter((o: { value: string; label: string }) => o.value),
            onChange: (selected: any) => setCurrentFilters({ ...currentFilters, department: selected ? selected.map((s: any) => s.value) : [] }),
            options: (hierarchyDataDepartments as any)?.map((d: any) => ({ value: d.id, label: d.name })) || [],
            placeholder: 'Select departments',
            isClearable: true,
          },
          {
            id: 'username',
            label: 'Username',
            type: 'select',
            value: (currentFilters as any)?.username
              ? (() => {
                  const uid = (currentFilters as any).username;
                  const user = (hierarchyDataUsers as any)?.find((u: any) => u.id === uid);
                  return user ? { value: user.id, label: user.name } : { value: uid, label: uid };
                })()
              : null,
            onChange: (selected: any) => setCurrentFilters({ ...currentFilters, username: selected?.value ?? '' }),
            options: (hierarchyDataUsers as any)?.map((u: any) => ({ value: u.id, label: u.name })) || [],
            placeholder: 'Select username',
            isClearable: true,
          },
          {
            id: 'remote_party_number',
            label: 'Remote Party Numbers',
            type: 'text',
            value: ((currentFilters as any)?.remote_party_number || []).join(', '),
            onChange: (v: string) => {
              const values = v.split(',').map((s) => s.trim()).filter(Boolean);
              setCurrentFilters({ ...currentFilters, remote_party_number: values });
            },
            placeholder: 'Enter remote party numbers (comma separated)',
          },
          {
            id: 'start_date',
            label: 'Start Date & Time',
            type: 'datetime' as FilterFieldType,
            value: (currentFilters as any)?.start_date || '',
            onChange: (v: string | null) => {
              const datetimeValue = v || '';
              const endDate = (currentFilters as any)?.end_date || '';
              let next: Record<string, any> = { ...currentFilters, start_date: datetimeValue };
              if (datetimeValue && endDate && moment(datetimeValue).isAfter(moment(endDate))) next.end_date = datetimeValue;
              setCurrentFilters(next);
            },
            placeholder: 'Start',
          },
          {
            id: 'end_date',
            label: 'End Date & Time',
            type: 'datetime' as FilterFieldType,
            value: (currentFilters as any)?.end_date || '',
            onChange: (v: string | null) => {
              const datetimeValue = v || '';
              const startDate = (currentFilters as any)?.start_date || '';
              let next: Record<string, any> = { ...currentFilters, end_date: datetimeValue };
              if (datetimeValue && startDate && moment(datetimeValue).isBefore(moment(startDate))) next.start_date = datetimeValue;
              setCurrentFilters(next);
            },
            placeholder: 'End',
          },
        ]}
        onApply={() => {
          handleFiltersChange(currentFilters);
          setRefreshKey((prev) => prev + 1);
        }}
        onReset={() => {
          const freshDefaults = getDefaultFilters();
          const resetCurrent: Record<string, any> = { ...freshDefaults.current };
          setCurrentFilters(resetCurrent);
          setSearchValue('');
          handleFiltersChange(resetCurrent);
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {/* Media Player Modal */}
      <Modal
        show={mediaPlayerModal}
        onHide={handleCloseModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Playing a Call Recording 
            {/* - {selectedRecording?.Id || 'Unknown'} */}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecording && (
            <div className="text-center d-flex flex-column align-items-center">
              {audioLoading ? (
                <div className="p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading audio file...</p>
                </div>
              ) : audioError ? (
                <div className="p-4">
                  <div className="alert alert-warning">
                    <i className="ph-duotone ph-warning-circle me-2"></i>
                    File not found
                  </div>
                </div>
              ) : (
                <div>
                  <AudioPlayer
                    ref={audioPlayerRef}
                    audioSrc={audioUrl}
                    title={`Call Recording - ${selectedRecording.Id}`}
                    showWaveform={true}
                    autoPlay={true}
                  />
                </div>
              )}
              
              
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CallRecordings.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallRecordings;
