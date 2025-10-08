import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useRef, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListCallLogs, DownloadCallRecording } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row, Tab, Tabs, Form } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import { ModuleSlug } from '@utils/Helper';
import AnimatedNumber from '@components/AnimatedNumber';
import EmptyState from '@components/EmptyState';
import { formatDateTimeToLocal, GlobalDateTimeFormat } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import CreatableSelect from 'react-select/creatable';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import axiosInstance from '@utils/axios';
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

import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { motion } from 'framer-motion';

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

const AnalyseRecordings = () => {
    const { data:session, status } = useSession();
    const [showCountryChartModal, setShowCountryChartModal] = useState(false);
    const [showDepartmentChartModal, setShowDepartmentChartModal] = useState(false);
    const [showExtensionChartModal, setShowExtensionChartModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    
    // Audio player state
    const [mediaPlayerModal, setMediaPlayerModal] = useState(false);
    const [selectedRecording, setSelectedRecording] = useState<any>(null);
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [audioError, setAudioError] = useState<string | null>(null);
    const audioPlayerRef = useRef<AudioPlayerRef>(null);
    
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({
      start_date: moment().startOf("week").format('YYYY-MM-DD hh:mm:ss A'),
      end_date: moment().format('YYYY-MM-DD hh:mm:ss A'),
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
        {
            id: 'avg-ring-time',
            title: 'Avg Ring Time',
            value: generalStats.totalAvgRingTime,
            description: 'Avg ring time in the system',
            delay: 1.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2',
            valueType: 'seconds',
        },
        {
            id: 'avg-duration',
            title: 'Avg Duration',
            value: generalStats.totalAvgDuration,
            description: 'Avg duration in the system',
            delay: 1.3,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2',
            valueType: 'seconds',
        },
        {
            id: 'avg-cost',
            title: 'Avg Cost',
            value: generalStats.totalAvgCost,
            description: 'Avg cost in the system',
            delay: 1.5,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2',
            prefix: '$',
        }
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

    // Direct filter states
    const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
    const [selectedDirection, setSelectedDirection] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [dateRange, setDateRange] = useState({
        start: moment().startOf("week").format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
    });

    // Get hierarchy data for extensions
    const { 
        hierarchyDataExtensions,
        loading: hierarchyLoading 
    } = useHierarchyData(ModuleSlug.CALL_RECORDINGS);

    // Table data state
    const [tableData, setTableData] = useState<any[]>([]);
    const [paginationInfo, setPaginationInfo] = useState<any>({
        totalRows: 0,
        totalPages: 0,
        currentPage: 1,
        perPage: 15,
    });

    // Table columns configuration for call recordings
    const columns = [
        {
            key: 'DateTime',
            name: 'Date',
            selector: (row: any) => row.DateTime,
            sortable: true,
            cell: (props: any) => {
                return (
                    <div>
                        {formatDateTimeToLocal(props.DateTime, 'YYYY-MM-DD')}
                    </div>
                )
            }
        },
        {
            key: 'DateTime',
            name: 'Time',
            selector: (row: any) => row.DateTime,
            sortable: true,
            cell: (props: any) => {
                return (
                    <div>
                        {formatDateTimeToLocal(props.DateTime, 'HH:mm:ss')}
                    </div>
                )
            }
        },
        {
            key: 'AgentExtension',
            name: 'Extension',
            selector: (row: any) => row.AgentExtension,
            sortable: true
        },
        {
            key: 'RemotePartyNumber',
            name: 'Remote Number',
            selector: (row: any) => row.RemotePartyNumber,
            sortable: true
        },
        {
            key: 'Direction',
            name: 'Direction',
            selector: (row: any) => row.Direction,
            sortable: true,
            cell: (props: any) => {
                const direction = props.Direction;
                const badgeClass = direction === 'INCOMING' ? 'badge bg-success' : 'badge bg-primary';
                return (
                    <span className={badgeClass}>
                        {direction === 'INCOMING' ? 'Incoming' : 'Outgoing'}
                    </span>
                );
            }
        },
        {
            key: 'Duration',
            name: 'Duration',
            selector: (row: any) => row.Duration,
            sortable: true,
            cell: (props: any) => {
                const formatDuration = (seconds: number) => {
                    const minutes = Math.floor(seconds / 60);
                    let secs = seconds % 60;
                    secs = parseFloat(secs.toFixed(2));
                    
                    if (minutes > 0) {
                        return `${minutes} Min ${secs} Sec`;
                    } else {
                        return `${secs} Sec`;
                    }
                };
                
                const duration = parseInt(props.Duration.toString())/10000000 || 0;
                return (
                    <div>
                        {formatDuration(duration)}
                    </div>
                );
            }
        },
        {
            key: 'Action',
            name: 'Action',
            selector: (row: any) => row.Action,
            sortable: true,
            cell: (props: any) => {
                return (
                    <div className='d-flex gap-3 action-box'>
                        <i
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content="Play"
                            className='ph-duotone ph-play text-info'
                            style={{ fontSize: '1rem', cursor: 'pointer' }}
                            onClick={() => handlePlayRecording(props)}
                        />
                        <i
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content="Download"
                            className='ph-duotone ph-arrow-line-down text-info'
                            style={{ fontSize: '1rem' }}
                            onClick={() => {
                                handleDownload(props);
                            }}
                        />
                        <i
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content="Call Analysis"
                            className='ph-duotone ph-chart-bar text-info'
                            style={{ fontSize: '1rem' }}
                            onClick={() => {
                                handleAnalysis(props);
                            }}
                        />
                    </div>
                )
            }
        }
    ];

    useEffect(() => {
        fetchGeneralStats();
    }, []);

    const fetchGeneralStats = async () => {
        const response = await ListCallLogs({ page: page, perPage: perPage, search: "", filters: currentFilters, reportType: 'statsDashboard' }, 'call-logs/generalStats');

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
                            categories: extensionLabels,
                            labels: {
                                show: true,
                                formatter: function(value: string) {
                                    const numValue = parseFloat(value);
                                    return isNaN(numValue) ? value : formatSecondsToTime(numValue);
                                },
                                style: {
                                    fontSize: '11px',
                                    colors: '#666'
                                }
                            }
                        },
                        tooltip: {
                            ...ExtensionChart.options.tooltip,
                            y: {
                                formatter: function(value: number) {
                                    return formatSecondsToTime(value);
                                }
                            }
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
                        name: 'Average',
                        data: averageData
                    }, {
                        name: 'Longest',
                        data: longestData
                    }],
                    options: {
                        ...DepartmentChart.options,
                        xaxis: {
                            ...DepartmentChart.options.xaxis,
                            categories: departmentLabels as string[],
                            labels: {
                                show: true,
                                formatter: function(value: string) {
                                    const numValue = parseFloat(value);
                                    return isNaN(numValue) ? value : formatSecondsToTime(numValue);
                                },
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
                            y: {
                                formatter: function(value: number) {
                                    return formatSecondsToTime(value);
                                }
                            }
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
                const shortestData = chartCountry.map((item: any) => item.shortest ? parseInt(item.shortest) : 0);
                const longestData = chartCountry.map((item: any) => item.longest ? parseInt(item.longest) : 0);
                const averageData = chartCountry.map((item: any) => item.average ? parseInt(item.average) : 0);
                
                setCountryChart({
                    series: [
                        {
                            name: 'Shortest',
                            data: shortestData
                        },
                        {
                            name: 'Average',
                            data: averageData
                        },
                        {
                            name: 'Longest',
                            data: longestData
                        }
                    ],
                    options: {
                        ...CountryChart.options,
                        xaxis: {
                            ...CountryChart.options.xaxis,
                            categories: countryLabels,
                            labels: {
                                show: true,
                                formatter: function(value: string) {
                                    const numValue = parseFloat(value);
                                    return isNaN(numValue) ? value : formatSecondsToTime(numValue);
                                },
                                style: {
                                    fontSize: '11px',
                                    colors: '#666'
                                }
                            }
                        },
                        tooltip: {
                            y: {
                                formatter: function(value: number) {
                                    return formatSecondsToTime(value);
                                }
                            }
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
                y: {
                    formatter: function(value: number) {
                        return formatSecondsToTime(value);
                    }
                }
            },
            xaxis: {
                categories: [] as string[],
                labels: {
                    show: true,
                    formatter: function(value: string) {
                        const numValue = parseFloat(value);
                        return isNaN(numValue) ? value : formatSecondsToTime(numValue);
                    },
                    style: {
                        fontSize: '11px',
                        colors: '#666'
                    }
                }
            },
            yaxis: {
                title: {
                    text: '',
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
                y: {
                    formatter: function(value: number) {
                        return formatSecondsToTime(value);
                    }
                }
            },
            xaxis: {
                categories: [] as string[],
                labels: {
                    show: true,
                    formatter: function(value: string) {
                        const numValue = parseFloat(value);
                        return isNaN(numValue) ? value : formatSecondsToTime(numValue);
                    },
                    style: {
                        fontSize: '11px',
                        colors: '#666'
                    }
                }
            },
            yaxis: {
                show: true,
                title: {
                    text: 'Duration',
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
                y: {
                    formatter: function(value: number) {
                        return formatSecondsToTime(value);
                    }
                }
            },
            xaxis: {
                categories: [] as string[],
                labels: {
                    show: true,
                    formatter: function(value: string) {
                        const numValue = parseFloat(value);
                        return isNaN(numValue) ? value : formatSecondsToTime(numValue);
                    },
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

    // Fetch table data function for call recordings
    const fetchTableData = useCallback(async (page = 1, perPage = 15, search = "") => {
        try {
            const response = await ListCallLogs(
                { page, perPage, search, filters: currentFilters, reportType: 'recordings', moduleSlug: ModuleSlug.CALL_RECORDINGS },
                'call-logs/recordings'
            );
            
            if (response?.dataList) {
                setTableData(response.dataList);
                setPaginationInfo({
                    totalRows: response.total || 0,
                    totalPages: response.last_page || 0,
                    currentPage: response.current_page || 1,
                    perPage: response.per_page || 15,
                });
            }
            
            return response;
        } catch (error) {
            console.error('Error fetching table data:', error);
            setTableData([]);
            setPaginationInfo({
                totalRows: 0,
                totalPages: 0,
                currentPage: 1,
                perPage: 15,
            });
            return { dataList: [], total: 0, last_page: 0, current_page: 1, per_page: 15 };
        }
    }, [currentFilters]);

    const handleFiltersChange = (filters: any) => {
        setCurrentFilters(filters);
        // Only refresh table data if filters actually changed
        if (Object.keys(filters).length > 0) {
        fetchTableData(1, 15, '');
        }
    };

    // Handle direct filter changes
    const handleDirectFilterChange = async () => {
        setFilterLoading(true);
        
        try {
            const filters: any = {
                start_date: `${dateRange.start} 00:00:00`,
                end_date: `${dateRange.end} 23:59:59`
            };

            // Add optional filters only if they have values
            if (selectedExtensions.length > 0) {
                filters.extension_number = selectedExtensions;
            }
            if (selectedDirection) {
                filters.call_direction = selectedDirection;
            }
            if (selectedStatus) {
                filters.is_answered = selectedStatus;
            }

            setCurrentFilters(filters);
            await fetchTableData(1, 15, '');
        } catch (error) {
            console.error('Error applying filters:', error);
            toast.error('Failed to apply filters. Please try again.');
        } finally {
            setFilterLoading(false);
        }
    };

    // Handle individual filter changes
    const handleExtensionChange = (extensions: string[]) => {
        setSelectedExtensions(extensions);
    };

    const handleDirectionChange = (direction: string) => {
        setSelectedDirection(direction);
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
    };

    const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };


    const handleDownload = async (props: any) => {
        const { Id, AgentExtension } = props;
        return await DownloadCallRecording(
            Id, AgentExtension, 'call-logs/recordings/download'
        );
    };

    const handleAnalysis = async (props: any) => {
        try {
            const { Id, AudioTrack } = props;
            window.open(`/ai-ml/analysis?id=${Id}&file=${AudioTrack}&direction=${props.Direction}&phone=${props.RemotePartyNumber}`, '_blank');
        } catch (error) {
            console.error('Error navigating to analysis:', error);
        }
    };

    const handlePlayRecording = (recording: any) => {
        const trackId = recording.Id;
        const agentExtension = recording.AgentExtension;

        loadAuthenticatedAudio(trackId, agentExtension);

        setSelectedRecording(recording);
        setAudioLoading(false);
        setAudioError(null);
    };

    const loadAuthenticatedAudio = async (audioTrackId: string, agentExtension: string) => {
        if (!audioTrackId) return;
        
        setAudioLoading(true);
        setAudioError(null);
        
        console.log('=== AUDIO LOADING DEBUG ===');
        console.log('trackId:', audioTrackId);

        try {
            console.log('Attempting to load audio via axiosInstance...');
            const response = await axiosInstance.get(`call-logs/recordings/download/${audioTrackId}`, {
                responseType: 'blob',
                params: {
                    extension_number: agentExtension
                },
                headers: {
                    'Accept': 'audio/*, application/octet-stream, */*'
                }
            });
            
            console.log('AxiosInstance response received:', response.status, response.headers);
            
            if (response.status === 200) {
                setMediaPlayerModal(true);
                const blob = new Blob([response.data], { type: 'audio/mpeg' });
                const audioUrl = window.URL.createObjectURL(blob);
                setAudioUrl(audioUrl);

                console.log('Audio loaded successfully via axiosInstance');
            } else if (response.status === 204) {
                toast.error('Audio file not found');
            } else {
                setAudioError(`Unexpected response status: ${response.status}`);
                console.log('Unexpected response status:', response.status);
            }
            
        } catch (error: any) {
            console.error('=== AXIOSINSTANCE ERROR ===');
            console.error('Error loading audio file via axiosInstance:', error);
            
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', error.response.data);
                console.error('Error response headers:', error.response.headers);
                
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
            console.log('=== AUDIO LOADING COMPLETE ===');
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

    const refreshData = async () => {
        setLoading(true);
        NProgress.start();
        await fetchGeneralStats();
        await fetchTableData(1, 15, '');
        setLoading(false);  
        NProgress.done();
    }

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="AI Insights" mainLink="/ai-ml" subTitle="Analyse Recordings" />

            <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title style-2">
                        <Row className="d-flex justify-content-between align-items-center">
                            <Col md={4}>
                                <h2 className="mb-0">Analyse Recordings</h2>
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

            <PageSummaryGrid cards={summaryCards} />

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

            {/* Direct Filters Section */}
            <Row className="mb-3">
                <Col md={12}>
                    <div className="card">
                        <div className="card-body">
                            <h5 className="mb-3 app-title-heading">Filters</h5>
                            <Row className="g-3">
                                {/* Date Range */}
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Start Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => handleDateRangeChange('start', e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>End Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => handleDateRangeChange('end', e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>

                                {/* Extensions */}
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Extensions</Form.Label>
                                        <CreatableSelect
                                            isMulti
                                            onChange={(selected) => {
                                                const values = (selected || []).map((opt: any) => opt.value);
                                                handleExtensionChange(values);
                                            }}
                                            value={selectedExtensions.map(ext => ({ value: ext, label: ext }))}
                                            placeholder="Select extensions..."
                                            options={hierarchyDataExtensions?.map((ext: any) => ({
                                                value: ext.id,
                                                label: ext.name
                                            })) || []}
                                            styles={{
                                                control: (base, state) => ({
                                                    ...base,
                                                    borderColor: state.isFocused ? '#80bdff' : '#ced4da',
                                                    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
                                                    fontSize: '14px',
                                                    fontWeight: 'normal',
                                                    minHeight: '38px',
                                                    height: '48px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '0.375rem',
                                                    '&:hover': {
                                                        borderColor: '#ced4da'
                                                    }
                                                }),
                                                valueContainer: (base) => ({
                                                    ...base,
                                                    padding: '2px 8px',
                                                    height: '34px',
                                                    alignItems: 'center'
                                                }),
                                                input: (base) => ({
                                                    ...base,
                                                    margin: '0px',
                                                    padding: '0px',
                                                    height: '30px'
                                                }),
                                                multiValue: (base) => ({
                                                    ...base,
                                                    fontSize: '12px',
                                                    backgroundColor: '#e9ecef',
                                                    borderRadius: '0.25rem',
                                                    margin: '1px'
                                                }),
                                                multiValueLabel: (base) => ({
                                                    ...base,
                                                    fontSize: '12px',
                                                    padding: '2px 6px'
                                                }),
                                                multiValueRemove: (base) => ({
                                                    ...base,
                                                    fontSize: '12px',
                                                    padding: '2px 4px'
                                                }),
                                                placeholder: (base) => ({
                                                    ...base,
                                                    fontSize: '14px',
                                                    color: '#6c757d'
                                                }),
                                                dropdownIndicator: (base) => ({
                                                    ...base,
                                                    padding: '8px'
                                                }),
                                                clearIndicator: (base) => ({
                                                    ...base,
                                                    padding: '8px'
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    fontSize: '14px'
                                                }),
                                                option: (base) => ({
                                                    ...base,
                                                    fontSize: '14px',
                                                    padding: '8px 12px'
                                                })
                                            }}
                                        />
                                    </Form.Group>
                                </Col>

                                {/* Call Direction */}
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Call Direction</Form.Label>
                                        <Form.Select
                                            value={selectedDirection}
                                            onChange={(e) => handleDirectionChange(e.target.value)}
                                        >
                                            <option value="">All</option>
                                            <option value="INCOMING">Incoming</option>
                                            <option value="OUTGOING">Outgoing</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                {/* Call Status */}
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Call Status</Form.Label>
                                        <Form.Select
                                            value={selectedStatus}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                        >
                                            <option value="">All</option>
                                            <option value="true">Answered</option>
                                            <option value="false">Not Answered</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                {/* Apply Button */}
                                <Col md={3} className="d-flex align-items-end">
                                    <Button 
                                        variant="primary" 
                                        onClick={handleDirectFilterChange}
                                        className="w-100"
                                        disabled={filterLoading}
                                    >
                                        {filterLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Loading...
                                            </>
                                        ) : (
                                            'Apply Filters'
                                        )}
                                    </Button>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Data Table */}
            <Row>
                <Col md={12}>
                    <div className="card">
                        <div className="card-body">
                            <h5 className="mb-3 app-title-heading">Call Recordings Data</h5>
                            {session?.user?.permissions?.includes('transcriptions-analysis-aiml') && (
                                <GenericListPage
                                    columns={columns}
                                    fetchData={fetchTableData}
                                    title="Call Recordings"
                                    searchPlaceholder="Search call recordings..."
                                    defaultPageSize={15}
                                    filters={currentFilters}
                                    refreshKey={refreshKey}
                                    search={true}
                                    tableStyle='table-style-2'
                                />
                            )}
                        </div>
                    </div>
                </Col>
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

AnalyseRecordings.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default AnalyseRecordings;
