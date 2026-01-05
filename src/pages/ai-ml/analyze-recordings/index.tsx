import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { DownloadCallRecording, GetTranscriptionOverview } from '@utils/calls';
import { GetImagicalTranscriptions } from '@utils/aiml';
import { Button, Modal, Row, Form, Badge } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { ModuleSlug, formatDateTimeToLocal, GlobalDateTimeFormat, formatDuration, encodeAnalysisData, GlobalDateFormat } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import BarFilters from '@components/BarFilters';
import SelectBox from '@components/SelectBox';
import axiosInstance from '@utils/axios';
import '@assets/scss/common.scss';
import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import moment from 'moment';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import CircularProgressCircle from '@components/CircularProgressCircle';


interface TranscriptionSummary {
    total_transcriptions: number;
    inbound_transcriptions: number;
    outbound_transcriptions: number;
    pending_transcriptions: number;
    processing_transcriptions: number;
    completed_transcriptions: number;
    failed_transcriptions: number;
    with_transcription: number;
    with_analysis: number;
}


const AnalyzeRecordings = () => {
    const { data:session, status } = useSession();
    const [filterLoading, setFilterLoading] = useState(false);
    
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
      start_datetime: moment().subtract(1, 'day').startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z',
      end_datetime: moment().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z',
    });
    
    // Ref to store latest filters to avoid dependency issues
    const currentFiltersRef = useRef<Record<string, any>>(currentFilters);
    // Ref to track the current request key being processed
    const currentRequestKeyRef = useRef<string>('');
    // Ref to track pending requests by requestKey to prevent duplicate API calls
    const pendingRequestsRef = useRef<Map<string, Promise<any>>>(new Map());
    
    // Update ref when currentFilters changes
    useEffect(() => {
        currentFiltersRef.current = currentFilters;
    }, [currentFilters]);

    const [transcriptionOverview, setTranscriptionOverview] = useState<any>(null);

    useEffect(() => {
      handleGetTranscriptionOverview();
    }, []);

    const handleGetTranscriptionOverview = async () => {
      const response = await GetTranscriptionOverview();
      setTranscriptionOverview(response);
    };

    // Removed duplicate call - fetchTableData handles all API calls

    const [transcriptionSummary, setTranscriptionSummary] = useState<TranscriptionSummary>({
        total_transcriptions: 0,
        inbound_transcriptions: 0,
        outbound_transcriptions: 0,
        pending_transcriptions: 0,
        processing_transcriptions: 0,
        completed_transcriptions: 0,
        failed_transcriptions: 0,
        with_transcription: 0,
        with_analysis: 0,
    });

    // Base card configuration to avoid duplication
    const baseCardConfig = {
        showAnimatedNumber: true,
        animationDuration: 1000,
        fontStyle: 'style-2' as const
    };

    // Create cards data for PageSummaryGrid using transcription summary
    const summaryCards: SummaryCard[] = useMemo(() => [
        {
            id: 'total-transcriptions',
            title: 'Total Transcriptions',
            value: transcriptionSummary.total_transcriptions,
            description: 'Total transcriptions in the system',
            delay: 0.1,
            ...baseCardConfig
        },
        {
            id: 'inbound-transcriptions',
            title: 'Inbound',
            value: transcriptionSummary.inbound_transcriptions,
            description: 'Inbound transcriptions',
            delay: 0.2,
            ...baseCardConfig
        },
        {
            id: 'outbound-transcriptions',
            title: 'Outbound',
            value: transcriptionSummary.outbound_transcriptions,
            description: 'Outbound transcriptions',
            delay: 0.3,
            ...baseCardConfig
        },
        {
            id: 'completed-transcriptions',
            title: 'Completed',
            value: transcriptionSummary.completed_transcriptions,
            description: 'Completed transcriptions',
            delay: 0.4,
            ...baseCardConfig
        },
        {
            id: 'pending-transcriptions',
            title: 'Pending',
            value: transcriptionSummary.pending_transcriptions,
            description: 'Pending transcriptions',
            delay: 0.5,
            ...baseCardConfig
        },
        {
            id: 'processing-transcriptions',
            title: 'Processing',
            value: transcriptionSummary.processing_transcriptions,
            description: 'Processing transcriptions',
            delay: 0.6,
            ...baseCardConfig
        },
        {
            id: 'with-analysis',
            title: 'With Analysis',
            value: transcriptionSummary.with_analysis,
            description: 'Transcriptions with analysis',
            delay: 0.7,
            ...baseCardConfig
        },
        {
            id: 'with-transcription',
            title: 'With Transcription',
            value: transcriptionSummary.with_transcription,
            description: 'Transcriptions available',
            delay: 0.8,
            ...baseCardConfig
        },
    ], [transcriptionSummary]);

    const [searchValue, setSearchValue] = useState<string>('');
    const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({
        start_datetime: moment().subtract(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm'),
        end_datetime: moment().endOf('day').format('YYYY-MM-DDTHH:mm'),
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
                    <div style={{textTransform: 'uppercase'}}>
                        {formatDateTimeToLocal(props.DateTime, GlobalDateFormat as string)}
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
            sortable: true,
            cell: (props: any) => {
                return (
                    <div>
                        {props?.local_party_model?.localParty || ''}
                    </div>
                )
            }
        },
        {
            key: 'remoteParty',
            name: 'Remote Number',
            selector: (row: any) => row.remoteParty,
            sortable: true
        },
        {
            key: 'direction',
            name: 'Direction',
            selector: (row: any) => row?.direction,
            sortable: true,
            cell: (props: any) => {
                const direction = props?.direction;
                const badgeClass = direction === 'CALL_INCOMING' ? 'badge bg-success' : 'badge bg-primary';
                return (
                    <span className={badgeClass} style={{textTransform: 'uppercase'}}>
                        {direction === 'CALL_INCOMING' ? 'Incoming' : 'Outgoing'}
                    </span>
                );
            }
        },
        {
            key: 'duration',
            name: 'Duration',
            selector: (row: any) => row.duration,
            sortable: true,
            cell: (props: any) => {
                const duration = parseInt(props?.duration?.toString())/10000000 || 0;
                return (
                    <div>
                        {formatDuration(duration)}
                    </div>
                );
            }
        },
        {
            key:'status',
            name: 'Qualified',
            selector: (row: any) => row.status,
            sortable: true,
            cell: (props: any) => {
                return (
                    <div>
                        {props?.status === 'completed' ?
                        <Badge bg={props?.analysis?.qualified === true ? 'success' : 'warning'}>
                            {props?.analysis?.qualified === true ? 'Qualified' : 'Unqualified'}
                        </Badge>
                        :
                            <span className='text-muted'>N/A</span>
                        }
                    </div>
                )
            }
        },
        {
            key:'status',
            name: 'Status',
            selector: (row: any) => row.status,
            sortable: true,
            cell: (props: any) => {
                return (
                    <div>
                        <Badge bg={props?.status === 'completed' ? 'success' : 'warning'}>
                            {props?.status === 'completed' ? 'Completed' : 'Pending'}
                        </Badge>
                    </div>
                )
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


    const [showPageLoader, setShowPageLoader] = useState(false);

    // Helper function to get dates with fallback (same logic used in API calls)
    const getDatesFromFilters = (filters: Record<string, any>) => {
        // Default dates in UTC format
        const defaultStartDate = moment().subtract(1, 'day').startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        const defaultEndDate = moment().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        
        // If filters already have UTC format dates, use them; otherwise use defaults
        let startDate = defaultStartDate;
        let endDate = defaultEndDate;
        
        if (filters.start_datetime && filters.start_datetime.trim()) {
            // If it's already in UTC format (ends with Z), use it as is
            if (filters.start_datetime.endsWith('Z') || filters.start_datetime.includes('T')) {
                startDate = filters.start_datetime;
            } else {
                // Convert to UTC if it's in local format
                const startMoment = moment(filters.start_datetime);
                startDate = startMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
            }
        }
        
        if (filters.end_datetime && filters.end_datetime.trim()) {
            // If it's already in UTC format (ends with Z), use it as is
            if (filters.end_datetime.endsWith('Z') || filters.end_datetime.includes('T')) {
                endDate = filters.end_datetime;
            } else {
                // Convert to UTC if it's in local format
                const endMoment = moment(filters.end_datetime);
                endDate = endMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
            }
        }
        
        return { startDate, endDate };
    };

    // Fetch table data function for call recordings
    const fetchTableData = useCallback(async (page = 1, limit = 15, search = "") => {
        // Get latest filters from ref to ensure we always have the most recent values
        const filters = currentFiltersRef.current || {};
        
        // Ensure dates always have fallback values - never send empty strings
        const { startDate, endDate } = getDatesFromFilters(filters);
        
        // Create a unique key for this request to detect duplicates
        const requestKey = `${page}-${limit}-${search}-${startDate}-${endDate}`;
        
        // CRITICAL: Check if the same request is already pending - return the same promise
        // This must be the FIRST check to prevent duplicate API calls
        // This check happens synchronously before any async operations
        const pendingRequest = pendingRequestsRef.current.get(requestKey);
        if (pendingRequest) {
            return pendingRequest;
        }
        
        // Set the current request key immediately (synchronously) to prevent duplicates
        currentRequestKeyRef.current = requestKey;
        
        // Create the async function and get its promise
        const requestPromise = (async () => {
            try {
                setShowPageLoader(true);
            
                // Extract start_datetime and end_datetime from filters for separate parameters
                // Use the dates from getDatesFromFilters which has fallback logic - always returns a value
                const start_datetime = filters.start_datetime || startDate;
                const end_datetime = filters.end_datetime || endDate;
                
                // Create a copy of filters without start_datetime and end_datetime to avoid duplication
                const filterParams: any = {};
                Object.keys(filters).forEach(key => {
                    if (key !== 'start_datetime' && key !== 'end_datetime') {
                        filterParams[key] = filters[key];
                    }
                });
                
                const response = await GetImagicalTranscriptions(
                    { 
                        page: 1, 
                        limit: limit, 
                        search, 
                        start_datetime: start_datetime,
                        end_datetime: end_datetime,
                        filters: filterParams
                    }
                );

                setShowPageLoader(false);
                
                // Clear current request key and remove from pending requests once completed
                if (currentRequestKeyRef.current === requestKey) {
                    currentRequestKeyRef.current = '';
                }
                pendingRequestsRef.current.delete(requestKey);

                if(response &&  response?.success === true){
                    console.log(response?.data);
                    setTableData(response?.data);
                    setPaginationInfo({
                        totalRows: response?.pagination?.total || 0,
                        totalPages: response?.pagination?.last_page || 0,
                        currentPage: response?.pagination?.page || 1,
                        perPage: limit, // Use the requested perPage value
                    });

                    // Update transcription summary from API response
                    if (response?.summary) {
                        setTranscriptionSummary({
                            total_transcriptions: response.summary.total_transcriptions || 0,
                            inbound_transcriptions: response.summary.inbound_transcriptions || 0,
                            outbound_transcriptions: response.summary.outbound_transcriptions || 0,
                            pending_transcriptions: response.summary.pending_transcriptions || 0,
                            processing_transcriptions: response.summary.processing_transcriptions || 0,
                            completed_transcriptions: response.summary.completed_transcriptions || 0,
                            failed_transcriptions: response.summary.failed_transcriptions || 0,
                            with_transcription: response.summary.with_transcription || 0,
                            with_analysis: response.summary.with_analysis || 0,
                        });
                    }

                    // Return data in the format expected by GenericListPage
                    // Use the limit parameter that was requested, not the response limit
                    return {
                        data: response?.data || [],
                        total: response?.pagination?.total || 0,
                        last_page: response?.pagination?.last_page || 0,
                        current_page: response?.pagination?.page || 1,
                        per_page: limit, // Use the requested perPage value
                    };
                }else{
                    toast.error('Failed to get transcriptions');
                    return { data: [], total: 0, last_page: 0, current_page: 1, per_page: limit };
                }

            } catch (error) {
                setShowPageLoader(false);
                setTableData([]);
                setPaginationInfo({
                    totalRows: 0,
                    totalPages: 0,
                    currentPage: 1,
                    perPage: limit,
                });
                // Clear current request key and remove from pending requests on error
                if (currentRequestKeyRef.current === requestKey) {
                    currentRequestKeyRef.current = '';
                }
                pendingRequestsRef.current.delete(requestKey);
                return { data: [], total: 0, last_page: 0, current_page: 1, per_page: limit };
            }
        })();
        
        // CRITICAL: Store the promise IMMEDIATELY (synchronously) before any async operations
        // This must happen right after creating the promise to prevent race conditions
        pendingRequestsRef.current.set(requestKey, requestPromise);
        
        return requestPromise;
    }, []); // Empty dependency array - using refs to access latest values

    const handleFiltersChange = async (filters: any) => {
        setFilterLoading(true);
        
        try {
            // Convert datetime-local format to UTC format for API
            const apiFilters: any = {};
            
            if (filters.start_datetime) {
                // datetime-local returns YYYY-MM-DDTHH:mm format in local timezone
                // Convert to UTC ISO format
                let startMoment = moment(filters.start_datetime);
                
                if (filters.start_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                    // Format is YYYY-MM-DDTHH:mm, add :00 seconds
                    startMoment = moment(filters.start_datetime + ':00');
                } else if (!filters.start_datetime.includes('T')) {
                    // If only date, set to 00:00:00
                    startMoment = moment(filters.start_datetime).startOf('day');
                }
                
                // Convert to UTC
                apiFilters.start_datetime = startMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
            }
            
            if (filters.end_datetime) {
                // datetime-local returns YYYY-MM-DDTHH:mm format in local timezone
                // Convert to UTC ISO format
                let endMoment = moment(filters.end_datetime);
                
                if (filters.end_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
                    // Format is YYYY-MM-DDTHH:mm, check if it's 23:59, otherwise add :00
                    const timePart = filters.end_datetime.split('T')[1];
                    if (timePart === '23:59') {
                        endMoment = moment(filters.end_datetime + ':59');
                    } else {
                        endMoment = moment(filters.end_datetime + ':00');
                    }
                } else if (!filters.end_datetime.includes('T')) {
                    // If only date, set to 23:59:59
                    endMoment = moment(filters.end_datetime).endOf('day');
                }
                
                // Convert to UTC
                apiFilters.end_datetime = endMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
            }
            
            // Always include local_parties and direction if they exist, even if empty
            // This ensures they're sent to the API when explicitly set
            if (filters.local_parties !== undefined) {
                if (filters.local_parties && filters.local_parties.length > 0) {
                    // Ensure extension_number is an array of strings
                    apiFilters.local_parties = Array.isArray(filters.local_parties) 
                        ? filters.local_parties.map((ext: any) => String(ext))
                        : [String(filters.local_parties)];
                } else {
                    // Set to empty array to clear the filter
                    apiFilters.local_parties = [];
                }
            }
            if (filters.direction !== undefined) {
                apiFilters.direction = filters.direction || '';
            }
            if (filters.status !== undefined) {
                apiFilters.status = filters.status || '';
            }

            setCurrentFilters(apiFilters);
            // Update the ref immediately so fetchTableData can use the latest values
            currentFiltersRef.current = apiFilters;
            setAppliedFilters(filters);
            // Don't call fetchTableData directly here - GenericListPage will handle it when filters prop changes
        } catch (error) {
            toast.error('Failed to apply filters. Please try again.');
        } finally {
            setFilterLoading(false);
        }
    };


    // Helper function to clear download state
    const clearDownloadState = useCallback((recordingId: string) => {
        setDownloadingRecordings(prev => {
            const newSet = new Set(prev);
            newSet.delete(recordingId);
            return newSet;
        });
        setDownloadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[recordingId];
            return newProgress;
        });
    }, []);

    const handleDownload = async (props: any) => {
        const { uuid, local_party_model, imagicle } = props;
        
        // Extract the extension number from local_party_model
        const agentExtension = local_party_model?.localParty;
        
        if (!agentExtension) {
            toast.error('Extension number is missing. Please try again later.');
            return;
        }
        
        // Add to downloading set and initialize progress
        setDownloadingRecordings(prev => new Set(prev).add(uuid));
        setDownloadProgress(prev => ({ ...prev, [uuid]: 0 }));
        
        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setDownloadProgress(prev => {
                    const currentProgress = prev[uuid] || 0;
                    if (currentProgress < 90) {
                        return { ...prev, [uuid]: currentProgress + Math.random() * 15 };
                    }
                    return prev;
                });
            }, 200);

            await DownloadCallRecording(
                uuid, agentExtension, 'call-logs/recordings/download', imagicle
            );
            
            // Complete the progress
            clearInterval(progressInterval);
            setDownloadProgress(prev => ({ ...prev, [uuid]: 100 }));
            
            // Show completion briefly before hiding
            setTimeout(() => {
                clearDownloadState(uuid);
            }, 1000);
            
        } catch (error) {
            toast.error('Download failed');
            clearDownloadState(uuid);
        }
    };

    const handleAnalysis = async (props: any) => {
        try {
            console.log('props before analysis', props);
            // Create data object with all parameters
            const dataObject = {
              uuid: props?.uuid || '',
              direction: props?.direction || '',
              phone: props?.local_party_model?.localParty || '',
              imagicle: props?.imagicle || '',
              duration: props?.duration || '',
              dateTime: props?.datetime || '',
              dateOnly: props?.datetime ? moment(props?.datetime).format('YYYY-MM-DD') : '',
              remotePartyNumber: props?.remoteParty || '',
              ownerUsername: props?.local_party_model?.ownerUser || '',
              localPartyNumber: props?.local_party_model?.localParty || '',
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

        if(!recording?.uuid || !recording?.local_party_model?.localParty || !recording?.imagicle){
            toast.error('Recording data is not complete. Please try again later.');
            return;
        }

        const trackId = recording?.uuid;
        const agentExtension = recording?.local_party_model?.localParty;

        loadAuthenticatedAudio(trackId, agentExtension, recording?.imagicle);

        setSelectedRecording(recording);
        setAudioLoading(false);
        setAudioError(null);
    };

    const loadAuthenticatedAudio = async (audioTrackId: string, agentExtension: string, node?: string) => {
        if (!audioTrackId) return;
        
        setAudioLoading(true);
        setAudioError(null);

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
                        {(() => {
                            // Use same logic as API call to get dates
                            const { startDate, endDate } = getDatesFromFilters(currentFilters);
                            return (
                                <p className="mb-0">
                                    Date Range : <span className="status-badge primary">
                                        {formatDateTimeToLocal(startDate, GlobalDateTimeFormat)}
                                    </span> to <span className="status-badge primary">
                                        {formatDateTimeToLocal(endDate, GlobalDateTimeFormat)}
                                    </span>
                                </p>
                            );
                        })()}
                    </>
                }
                searchPlaceholder="Search call recordings..."
                showSearch={false}
                filters={appliedFilters}
                onSubmit={() => {
                    handleFiltersChange(appliedFilters);
                }}
                onReset={() => {
                    // Preserve current date filters, clear all other filters
                    // Only include date filters to avoid counting empty filters
                    const resetFilters: Record<string, any> = {
                        start_datetime: (appliedFilters as any)?.start_datetime || moment().subtract(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm'),
                        end_datetime: (appliedFilters as any)?.end_datetime || moment().endOf('day').format('YYYY-MM-DDTHH:mm'),
                    };
                    setAppliedFilters(resetFilters);
                    handleFiltersChange(resetFilters);
                }}
                filterContent={
                    <>
                        {/* Date Range */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Start Date & Time</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={(appliedFilters as any)?.start_datetime || ''}
                                    max={moment().format('YYYY-MM-DDTHH:mm')}
                                    onChange={(e) => {
                                        const datetimeValue = e.target.value;
                                        const endDatetime = (appliedFilters as any)?.end_datetime || '';
                                        
                                        let updatedFilters: any = {
                                            ...appliedFilters,
                                            start_datetime: datetimeValue
                                        };
                                        
                                        if (datetimeValue && endDatetime && moment(datetimeValue).isAfter(moment(endDatetime))) {
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
                                    value={(appliedFilters as any)?.end_datetime || ''}
                                    min={(appliedFilters as any)?.start_datetime || ''}
                                    max={moment().format('YYYY-MM-DDTHH:mm')}
                                    onChange={(e) => {
                                        const datetimeValue = e.target.value;
                                        const startDatetime = (appliedFilters as any)?.start_datetime || '';
                                        
                                        let updatedFilters: any = {
                                            ...appliedFilters,
                                            end_datetime: datetimeValue
                                        };
                                        
                                        if (datetimeValue && startDatetime && moment(datetimeValue).isBefore(moment(startDatetime))) {
                                            updatedFilters.start_datetime = datetimeValue;
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
                                    value={(appliedFilters as any)?.local_parties?.length > 0 ? (appliedFilters as any)?.local_parties : null}
                                    onChange={(value) => {
                                        // Ensure extension_number is always an array of strings
                                        const extensionArray = value 
                                            ? (Array.isArray(value) ? value : [value]).map((ext: any) => String(ext))
                                            : [];
                                        setAppliedFilters({ ...appliedFilters, local_parties: extensionArray });
                                    }}
                                    options={(hierarchyDataExtensions as any)?.map((ext: any) => ({
                                        value: String(ext.id), // Ensure value is always a string
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
                                    value={(appliedFilters as any)?.direction || null}
                                    onChange={(value) => {
                                        setAppliedFilters({ ...appliedFilters, direction: value as string || '' });
                                    }}
                                    options={[
                                        { value: 'CALL_OUTGOING', label: 'Outgoing' },
                                        { value: 'CALL_INCOMING', label: 'Incoming' }
                                    ]}
                                    placeholder="Select call direction"
                                />
                            </Form.Group>
                        </Col>

                        {/* Call status */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Analysis Status</Form.Label>
                                <SelectBox
                                    isSearchable={false}
                                    value={(appliedFilters as any)?.status || null}
                                    onChange={(value) => {
                                        setAppliedFilters({ ...appliedFilters, status: value as string || '' });
                                    }}
                                    options={[
                                        { value: '', label: 'All' },
                                        { value: 'in_progress', label: 'IN_PROGRESS' },
                                        { value: 'queued', label: 'QUEUED' },
                                        { value: 'completed', label: 'COMPLETED' },
                                        { value: 'in_complete', label: 'IN_COMPLETE' },
                                        
                                    ]}
                                    placeholder="Select analysis status"
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
                                    search={false}
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
