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
import { formatDateTimeToLocal, GlobalDateTimeFormat ,formatDuration, encodeAnalysisData} from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import BarFilters from '@components/BarFilters';
import SelectBox from '@components/SelectBox';
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
import CircularProgressCircle from '@components/CircularProgressCircle';


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


const AnalyzeRecordings = () => {
    const { data:session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    
    // Audio player state
    const [mediaPlayerModal, setMediaPlayerModal] = useState(false);
    const [selectedRecording, setSelectedRecording] = useState<any>(null);
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [audioError, setAudioError] = useState<string | null>(null);
    const [downloadingRecordings, setDownloadingRecordings] = useState<Set<string>>(new Set());
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
    const audioPlayerRef = useRef<AudioPlayerRef>(null);
    
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({
      start_date: moment().subtract(1, 'day').startOf('day').format('YYYY-MM-DD hh:mm:ss A'),
      end_date: moment().endOf('day').format('YYYY-MM-DD hh:mm:ss A'),
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
        
    ];

    const [perPage, setPerPage] = useState(5);
    const [page, setPage] = useState(1);

    const [startDateTime, setStartDateTime] = useState<string>('');
    const [endDateTime, setEndDateTime] = useState<string>('');
    const [searchValue, setSearchValue] = useState<string>('');
    const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({
        start_date: moment().subtract(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm'),
        end_date: moment().endOf('day').format('YYYY-MM-DDTHH:mm'),
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
                // const formatDuration = (seconds: number) => {
                //     const minutes = Math.floor(seconds / 60);
                //     let secs = seconds % 60;
                //     secs = parseFloat(secs.toFixed(2));
                    
                //     if (minutes > 0) {
                //         return `${minutes} Min ${secs} Sec`;
                //     } else {
                //         return `${secs} Sec`;
                //     }
                // };
                
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
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {downloadingRecordings.has(props.Id) ? (
                                <CircularProgressCircle 
                                    progress={downloadProgress[props.Id] || 0}
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
                                    className='ph-duotone ph-arrow-line-down text-info'
                                    style={{ fontSize: '1rem', cursor: 'pointer' }}
                                    onClick={() => {
                                        handleDownload(props);
                                    }}
                                />
                            )}
                        </div>
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

    const [showPageLoader, setShowPageLoader] = useState(false);
    const fetchGeneralStats = async () => {
        setShowPageLoader(true);
        const response = await ListCallLogs({ page: page, perPage: perPage, search: "", filters: currentFilters, reportType: 'statsDashboard', moduleSlug: ModuleSlug.CALL_RECORDINGS }, 'call-logs/generalStats').finally(() => {
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
        }
    };


    // Fetch table data function for call recordings
    const fetchTableData = useCallback(async (page = 1, perPage = 15, search = "") => {
        try {
            setShowPageLoader(true);
            const response = await ListCallLogs(
                { page, perPage, search, filters: currentFilters, reportType: 'recordings', moduleSlug: ModuleSlug.CALL_RECORDINGS },
                'call-logs/recordings'
            ).finally(() => {
                setShowPageLoader(false);
            });
            
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

    const handleFiltersChange = async (filters: any) => {
        setFilterLoading(true);
        
        try {
            // Convert datetime-local format to API format
            const apiFilters: any = {};
            
            if (filters.start_date) {
                apiFilters.start_date = moment(filters.start_date).format('YYYY-MM-DD hh:mm:ss A');
            }
            if (filters.end_date) {
                apiFilters.end_date = moment(filters.end_date).format('YYYY-MM-DD hh:mm:ss A');
            }
            
            if (filters.extension_number && filters.extension_number.length > 0) {
                apiFilters.extension_number = filters.extension_number;
            }
            if (filters.call_direction) {
                apiFilters.call_direction = filters.call_direction;
            }
            if (filters.is_answered !== undefined && filters.is_answered !== '') {
                apiFilters.is_answered = filters.is_answered;
            }

            setCurrentFilters(apiFilters);
            setAppliedFilters(filters);
            await fetchTableData(1, 15, searchValue);
            await fetchGeneralStats();
        } catch (error) {
            console.error('Error applying filters:', error);
            toast.error('Failed to apply filters. Please try again.');
        } finally {
            setFilterLoading(false);
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
            console.error('Download error:', error);
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
                id: Id || '',
                file: AudioTrack || '',
                direction: props.Direction || '',
                phone: props.RemotePartyNumber || '',
                imagicle: props.imagicle || '',
                duration: props.Duration || '',
                dateTime: props.DateTime || '',
            };

            // Encode data to base64 (unreadable format) using helper function
            const encodedData = encodeAnalysisData(dataObject);
            
            // Pass as single encoded parameter
            const tempUrl = `/ai-ml/analysis/new?data=${encodeURIComponent(encodedData)}`;

            window.open(tempUrl, '_blank');

        } catch (error) {
            console.error('Error navigating to analysis:', error);
        }
    };

    const handlePlayRecording = (recording: any) => {
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
        
        console.log('=== AUDIO LOADING DEBUG ===');
        console.log('trackId:', audioTrackId);

        try {
            console.log('Attempting to load audio via axiosInstance...');
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
            <BreadcrumbItem mainTitle="AI Insights" mainLink="/ai-ml" subTitle="Analyze Recordings" showPageLoader={showPageLoader} />

            <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title style-2">
                        <Row className="d-flex justify-content-between align-items-center">
                            <Col md={4}>
                                <h2 className="mb-0">Analyze Recordings</h2>
                            </Col>

                            <Col md={8} className="d-flex justify-content-end">
                                <div className="action-buttons">
                                    <div className="d-flex align-items-center gap-2">
                                       
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>

            <PageSummaryGrid cards={summaryCards} />

            <BarFilters
                searchValue={searchValue}
                onSearchChange={(value) => setSearchValue(value)}
                onSearch={() => {
                    handleFiltersChange({ ...appliedFilters, search: searchValue });
                }}
                leftContent={
                    <>
                        {showDateRange && (
                            <>
                                <p className="mb-0">
                                    Date Range : <span className="status-badge primary">
                                        {formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)}
                                    </span> to <span className="status-badge primary">
                                        {formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}
                                    </span>
                                </p>
                            </>
                        )}
                    </>
                }
                searchPlaceholder="Search call recordings..."
                showSearch={false}
                filters={appliedFilters}
                onSubmit={() => {
                    handleFiltersChange(appliedFilters);
                }}
                onReset={() => {
                    const defaultFilters = {
                        start_date: moment().subtract(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm'),
                        end_date: moment().endOf('day').format('YYYY-MM-DDTHH:mm'),
                    };
                    setAppliedFilters(defaultFilters);
                    handleFiltersChange(defaultFilters);
                }}
                filterContent={
                    <>
                        {/* Date Range */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Start Date & Time</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={(appliedFilters as any)?.start_date || ''}
                                    max={moment().format('YYYY-MM-DDTHH:mm')}
                                    onChange={(e) => {
                                        const datetimeValue = e.target.value;
                                        const endDate = (appliedFilters as any)?.end_date || '';
                                        
                                        let updatedFilters: any = {
                                            ...appliedFilters,
                                            start_date: datetimeValue
                                        };
                                        
                                        if (datetimeValue && endDate && moment(datetimeValue).isAfter(moment(endDate))) {
                                            updatedFilters.end_date = datetimeValue;
                                        }
                                        
                                        setAppliedFilters(updatedFilters);
                                    }}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>End Date & Time</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={(appliedFilters as any)?.end_date || ''}
                                    min={(appliedFilters as any)?.start_date || ''}
                                    max={moment().format('YYYY-MM-DDTHH:mm')}
                                    onChange={(e) => {
                                        const datetimeValue = e.target.value;
                                        const startDate = (appliedFilters as any)?.start_date || '';
                                        
                                        let updatedFilters: any = {
                                            ...appliedFilters,
                                            end_date: datetimeValue
                                        };
                                        
                                        if (datetimeValue && startDate && moment(datetimeValue).isBefore(moment(startDate))) {
                                            updatedFilters.start_date = datetimeValue;
                                        }
                                        
                                        setAppliedFilters(updatedFilters);
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
                                    value={(appliedFilters as any)?.extension_number?.length > 0 ? (appliedFilters as any)?.extension_number : null}
                                    onChange={(value) => {
                                        setAppliedFilters({ ...appliedFilters, extension_number: value ? (value as string[]) : [] });
                                    }}
                                    options={(hierarchyDataExtensions as any)?.map((ext: any) => ({
                                        value: ext.id,
                                        label: ext.name
                                    })) || []}
                                    placeholder="Select extensions"
                                />
                            </Form.Group>
                        </Col>

                        {/* Call Direction */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Call Direction</Form.Label>
                                <SelectBox
                                    isSearchable={false}
                                    value={(appliedFilters as any)?.call_direction || null}
                                    onChange={(value) => {
                                        setAppliedFilters({ ...appliedFilters, call_direction: value as string || '' });
                                    }}
                                    options={[
                                        { value: 'OUTGOING', label: 'Outgoing' },
                                        { value: 'INCOMING', label: 'Incoming' }
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
                                    value={(appliedFilters as any)?.is_answered !== undefined && (appliedFilters as any)?.is_answered !== '' ? (appliedFilters as any)?.is_answered : null}
                                    onChange={(value) => {
                                        setAppliedFilters({ ...appliedFilters, is_answered: value as string || '' });
                                    }}
                                    options={[
                                        { value: 'true', label: 'Answered' },
                                        { value: 'false', label: 'Not Answered' }
                                    ]}
                                    placeholder="Select call status"
                                />
                            </Form.Group>
                        </Col>
                    </>
                }
            />

            {/* Data Table */}
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

AnalyzeRecordings.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default AnalyzeRecordings;
