import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';
import StatsCards, { StatsCardData } from '@components/GenericStatsCards';
import { DownloadCallRecording } from '@utils/calls';
import { GetImagicalTranscriptions } from '@utils/aiml';
import { Badge, Button, Col, Modal, Row } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { ModuleSlug, formatDateTimeToLocal, GlobalDateTimeFormat, formatDuration, encodeAnalysisData, GlobalDateFormat, convertDateTimeWithOffsetToLocal, GlobalTimeFormat } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import axiosInstance from '@utils/axios';
import '@assets/scss/common.scss';
import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import moment from 'moment';
import CircularProgressCircle from '@components/CircularProgressCircle';
import { Calendar } from 'lucide-react';


interface TranscriptionSummary {
    total_transcriptions: number;
    incomplete_transcriptions:number;
    in_progress_transcriptions:number;
    analyzing_transcriptions:number;
    analyzed_transcriptions:number;
    transribing_transcriptions:number;
    transcribed_transcriptions:number;
    completed_transcriptions: number;
    failed_transcriptions: number;
    queued_transcriptions: number;
    reanalysis_calls: number;
}


const AnalyzeRecordings = () => {
    const { data:session } = useSession();
    
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

    const [transcriptionSummary, setTranscriptionSummary] = useState<TranscriptionSummary>({
        total_transcriptions: 0,
        incomplete_transcriptions: 0,
        in_progress_transcriptions: 0,
        analyzing_transcriptions: 0,
        reanalysis_calls: 0,
        analyzed_transcriptions: 0,
        transribing_transcriptions: 0,
        transcribed_transcriptions: 0,
        completed_transcriptions: 0,
        failed_transcriptions: 0,
        queued_transcriptions: 0,
    });

    // Stats cards data for GenericStatsCards component
    const statsCardsData = useMemo<StatsCardData[]>(() => [
        { title: 'Total Calls', value: transcriptionSummary?.total_transcriptions || 0, subtitle: 'Total calls in the system' },
        { title: 'Calls In Queue', value: transcriptionSummary?.queued_transcriptions || 0, subtitle: 'Queued calls in the system' },
        { title: 'Transcribing', value: transcriptionSummary?.transribing_transcriptions || 0, subtitle: 'Transcribing calls' },
        { title: 'Analyzing', value: transcriptionSummary?.analyzing_transcriptions || 0, subtitle: 'Analyzing calls' },
        { title: 'Completed', value: transcriptionSummary?.completed_transcriptions || 0, subtitle: 'Completed calls' },
        { title: 'Failed', value: transcriptionSummary?.failed_transcriptions || 0, subtitle: 'Failed calls' },
        { title: 'Incomplete', value: transcriptionSummary?.incomplete_transcriptions || 0, subtitle: 'Incomplete calls' },
        { title: 'Reanalysis', value: transcriptionSummary?.reanalysis_calls || 0, subtitle: 'Reanalysis calls' },
    ], [transcriptionSummary]);

    const [searchValue, setSearchValue] = useState<string>('');
    const [tableLoading, setTableLoading] = useState(false);
    const rowsPerPageRef = useRef(15);

    // Get hierarchy data for extensions
    const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.CALL_RECORDINGS);

    // Table data state
    const [tableData, setTableData] = useState<any[]>([]);
    const [paginationInfo, setPaginationInfo] = useState<any>({
        totalRows: 0,
        totalPages: 0,
        currentPage: 1,
        perPage: 15,
    });

    // Table columns configuration for call analysis
    const tableColumns: TableColumn<any>[] = [
        {
            key: 'datetime',
            label: 'Date',
            sortable: true,
            render: (row) => (
                <div style={{ textTransform: 'uppercase' }}>
                    {convertDateTimeWithOffsetToLocal(row.datetime ?? '', undefined, GlobalDateFormat)}
                </div>
            ),
        },
        {
            key: 'datetime_time',
            label: 'Time',
            sortable: false,
            render: (row) => (
                <div>{convertDateTimeWithOffsetToLocal(row.datetime ?? '', undefined, GlobalTimeFormat)}</div>
            ),
        },
        {
            key: 'local_party_model',
            label: 'Extension',
            sortable: false,
            render: (row) => <div>{row.local_party_model?.localParty || ''}</div>,
        },
        { key: 'remoteParty', label: 'Remote Number', sortable: true },
        {
            key: 'direction',
            label: 'Direction',
            sortable: true,
            render: (row) => {
                const direction = row.direction;
                const badgeClass = direction === 'CALL_INCOMING' ? 'badge bg-success' : 'badge bg-primary';
                return (
                    <span className={badgeClass} style={{ textTransform: 'uppercase' }}>
                        {direction === 'CALL_INCOMING' ? 'Incoming' : 'Outgoing'}
                    </span>
                );
            },
        },
        {
            key: 'duration',
            label: 'Duration',
            sortable: true,
            render: (row) => (
                <div>{formatDuration(Number.parseInt(String(row.duration ?? '0'), 10) / 10000000 || 0)}</div>
            ),
        },
        {
            key: 'qualification',
            label: 'Qualification',
            sortable: true,
            render: (row) => (
                <Badge bg={row.analysis?.qualified === true ? 'success' : 'warning'}>
                    {row.analysis?.qualified === true ? 'Qualified' : 'Unqualified'}
                </Badge>
            ),
        },
        {
            key: 'follow_up',
            label: 'Follow Up',
            sortable: false,
            render: (row) => {
                const followUpRequired = row.analysis?.analysis?.follow_up_required;
                if (followUpRequired === true) return 'Required';
                if (followUpRequired === false) return 'Not Required';
                return 'N/A';
            },
        },
        {
            key: 'sentiment',
            label: 'Sentiment',
            sortable: false,
            render: (row) => <>{row.analysis?.analysis?.sentiment || 'N/A'}</>,
        },
        {
            key: 'main_topic',
            label: 'Main Intent',
            sortable: false,
            render: (row) => <>{row.analysis?.classification?.main_topic || 'N/A'}</>,
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (row) => {
                const status = row.status?.toLowerCase();
                switch (status) {
                    case 'complete':
                    case 'completed': return <Badge bg="success">Completed</Badge>;
                    case 'in_progress': return <Badge bg="info">In Progress</Badge>;
                    case 'incomplete': return <Badge bg="warning">Incomplete</Badge>;
                    case 'queued': return <Badge bg="secondary">Queued</Badge>;
                    default: return <Badge bg="secondary">{status || 'Unknown'}</Badge>;
                }
            },
        },
        {
            key: 'message',
            label: 'Message',
            sortable: false,
            render: (row) => <>{row.message || 'N/A'}</>,
        },
    ];

    const recordingActions: TableAction<any>[] = [
        {
            label: 'Actions',
            render: (row) => (
                <div className='d-flex gap-3 action-box'>
                    <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-info"
                        onClick={() => handlePlayRecording(row)}
                        aria-label="Play"
                        title="Play"
                    >
                        <i
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content="Play"
                            className='ph-duotone ph-play'
                            style={{ fontSize: '1rem' }}
                            aria-hidden="true"
                        />
                    </button>
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {downloadingRecordings.has(row.uuid) ? (
                            <CircularProgressCircle
                                progress={downloadProgress[row.uuid] || 0}
                                size="small"
                                color="#28a745"
                                backgroundColor="#e9ecef"
                                textColor="#495057"
                                showPercentage={false}
                                className="circular-progress-inline"
                            />
                        ) : (
                            <button
                                type="button"
                                className="btn btn-link p-0 border-0 text-info"
                                onClick={() => handleDownload(row)}
                                aria-label="Download"
                                title="Download"
                            >
                                <i
                                    data-tooltip-id="my-tooltip"
                                    data-tooltip-content="Download"
                                    className='ph-duotone ph-arrow-line-down'
                                    style={{ fontSize: '1rem' }}
                                    aria-hidden="true"
                                />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-info"
                        onClick={() => handleAnalysis(row)}
                        aria-label="Call Analysis"
                        title="Call Analysis"
                    >
                        <i
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content="Call Analysis"
                            className='ph-duotone ph-chart-bar'
                            style={{ fontSize: '1rem' }}
                            aria-hidden="true"
                        />
                    </button>
                </div>
            ),
        },
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
                setTableLoading(true);
            
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
                        page: page, 
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

                if (response?.success === true) {
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
                            incomplete_transcriptions: response.summary?.incomplete_transcriptions || 0,
                            in_progress_transcriptions: response.summary?.in_progress_transcriptions || 0,
                            analyzing_transcriptions: response.summary?.analyzing_transcriptions || 0,
                            reanalysis_calls: response.summary?.reanalysis_calls || 0,
                            analyzed_transcriptions: response.summary?.analyzed_transcriptions || 0,
                            transribing_transcriptions: response.summary?.transribing_transcriptions || 0,
                            transcribed_transcriptions: response.summary?.transcribed_transcriptions || 0,
                            completed_transcriptions: response.summary?.completed_transcriptions || 0,
                            failed_transcriptions: response.summary?.failed_transcriptions || 0,
                            queued_transcriptions: response.summary?.queued_transcriptions || 0,
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
                } else {
                    toast.error('Failed to get transcriptions');
                    return { data: [], total: 0, last_page: 0, current_page: 1, per_page: limit };
                }

            } catch (error) {
                console.error('Failed to fetch call analysis records:', error);
                toast.error('Failed to load call analysis records');
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
            } finally {
                setTableLoading(false);
            }
        })();
        
        // CRITICAL: Store the promise IMMEDIATELY (synchronously) before any async operations
        // This must happen right after creating the promise to prevent race conditions
        pendingRequestsRef.current.set(requestKey, requestPromise);
        
        return requestPromise;
    }, []); // Empty dependency array - using refs to access latest values

            const getQualificationActiveLabel = (value: string | undefined): string | undefined => {
                if (value === 'qualified') return 'Qualified';
                if (value === 'unqualified') return 'Unqualified';
                return undefined;
            };

            const getFollowUpActiveLabel = (value: string | undefined): string | undefined => {
                if (value === 'true') return 'Required';
                if (value === 'false') return 'Not Required';
                return undefined;
            };

    // Direct filter apply (already in API-ready format, no conversion needed)
    const applyFilters = (nextFilters: Record<string, any>) => {
        setCurrentFilters(nextFilters);
        currentFiltersRef.current = nextFilters;
        setRefreshKey((prev) => prev + 1);
    };

    const callDirectionLabel = (value: string): string => {
        if (value === 'CALL_OUTGOING') return 'Outgoing';
        if (value === 'CALL_INCOMING') return 'Incoming';
        return '';
    };

    const tableToolbar = useMemo(() => ({
        showSearch: true,
        searchValue,
        searchPlaceholder: 'Search call recordings...',
        onSearchChange: (value: string) => setSearchValue(value),
        onSearch: () => {
            setPaginationInfo((prev: any) => ({ ...prev, currentPage: 1 }));
            fetchTableData(1, rowsPerPageRef.current, searchValue.trim());
        },
        showFiltersButton: true,
        showFilterPills: true,
        showMoreFiltersButton: false,
        filterPills: [
            {
                id: 'direction',
                label: 'Direction',
                showDropdown: true,
                active: Boolean(currentFilters.direction),
                activeLabel: callDirectionLabel(currentFilters.direction ?? ''),
                onClear: () => applyFilters({ ...currentFilters, direction: '' }),
                dropdownOptions: [
                    { label: 'Outgoing', value: 'CALL_OUTGOING', onClick: () => applyFilters({ ...currentFilters, direction: 'CALL_OUTGOING' }) },
                    { label: 'Incoming', value: 'CALL_INCOMING', onClick: () => applyFilters({ ...currentFilters, direction: 'CALL_INCOMING' }) },
                ],
            },
            {
                id: 'status',
                label: 'Analysis Status',
                showDropdown: true,
                active: Boolean(currentFilters.status),
                activeLabel: currentFilters.status ? currentFilters.status.toUpperCase() : undefined,
                onClear: () => applyFilters({ ...currentFilters, status: '' }),
                dropdownOptions: [
                    { label: 'Queued', value: 'queued', onClick: () => applyFilters({ ...currentFilters, status: 'queued' }) },
                    { label: 'Transcribing', value: 'transribing', onClick: () => applyFilters({ ...currentFilters, status: 'transribing' }) },
                    { label: 'Analyzing', value: 'analyzing', onClick: () => applyFilters({ ...currentFilters, status: 'analyzing' }) },
                    { label: 'Completed', value: 'completed', onClick: () => applyFilters({ ...currentFilters, status: 'completed' }) },
                    { label: 'Failed', value: 'failed', onClick: () => applyFilters({ ...currentFilters, status: 'failed' }) },
                    { label: 'Incomplete', value: 'incomplete', onClick: () => applyFilters({ ...currentFilters, status: 'incomplete' }) },
                    { label: 'Reanalysis', value: 'reanalysis', onClick: () => applyFilters({ ...currentFilters, status: 'reanalysis' }) },
                ],
            },
            {
                id: 'qualified',
                label: 'Qualification',
                showDropdown: true,
                active: Boolean(currentFilters.qualified),
                activeLabel: getQualificationActiveLabel(currentFilters.qualified),
                onClear: () => applyFilters({ ...currentFilters, qualified: '' }),
                dropdownOptions: [
                    { label: 'Qualified', value: 'qualified', onClick: () => applyFilters({ ...currentFilters, qualified: 'qualified' }) },
                    { label: 'Unqualified', value: 'unqualified', onClick: () => applyFilters({ ...currentFilters, qualified: 'unqualified' }) },
                ],
            },
            {
                id: 'follow_up_required',
                label: 'Follow Up',
                showDropdown: true,
                active: currentFilters.follow_up_required !== undefined && currentFilters.follow_up_required !== '',
                activeLabel: getFollowUpActiveLabel(currentFilters.follow_up_required),
                onClear: () => applyFilters({ ...currentFilters, follow_up_required: '' }),
                dropdownOptions: [
                    { label: 'Required', value: 'true', onClick: () => applyFilters({ ...currentFilters, follow_up_required: 'true' }) },
                    { label: 'Not Required', value: 'false', onClick: () => applyFilters({ ...currentFilters, follow_up_required: 'false' }) },
                ],
            },
            {
                id: 'sentiment',
                label: 'Sentiment',
                showDropdown: true,
                active: Boolean(currentFilters.sentiment),
                activeLabel: currentFilters.sentiment
                    ? currentFilters.sentiment.charAt(0).toUpperCase() + currentFilters.sentiment.slice(1)
                    : undefined,
                onClear: () => applyFilters({ ...currentFilters, sentiment: '' }),
                dropdownOptions: [
                    { label: 'Positive', value: 'positive', onClick: () => applyFilters({ ...currentFilters, sentiment: 'positive' }) },
                    { label: 'Neutral', value: 'neutral', onClick: () => applyFilters({ ...currentFilters, sentiment: 'neutral' }) },
                    { label: 'Negative', value: 'negative', onClick: () => applyFilters({ ...currentFilters, sentiment: 'negative' }) },
                ],
            },
            {
                id: 'main_intent',
                label: 'Main Intent',
                showDropdown: true,
                active: Boolean(currentFilters.main_intent),
                activeLabel: currentFilters.main_intent || undefined,
                onClear: () => applyFilters({ ...currentFilters, main_intent: '' }),
                dropdownOptions: [
                    { label: 'Purchase', value: 'required', onClick: () => applyFilters({ ...currentFilters, main_intent: 'required' }) },
                    { label: 'Inquiry', value: 'inquiry', onClick: () => applyFilters({ ...currentFilters, main_intent: 'inquiry' }) },
                    { label: 'Support', value: 'support', onClick: () => applyFilters({ ...currentFilters, main_intent: 'support' }) },
                    { label: 'Complaint', value: 'complaint', onClick: () => applyFilters({ ...currentFilters, main_intent: 'complaint' }) },
                    { label: 'Follow-up', value: 'follow-up', onClick: () => applyFilters({ ...currentFilters, main_intent: 'follow-up' }) },
                ],
            },
            {
                id: 'local_parties',
                label: 'Extension',
                showDropdown: true,
                searchable: true,
                active: Array.isArray(currentFilters.local_parties) && currentFilters.local_parties.length > 0,
                activeLabel: Array.isArray(currentFilters.local_parties) && currentFilters.local_parties.length > 0
                    ? `${currentFilters.local_parties.length} selected`
                    : undefined,
                onClear: () => applyFilters({ ...currentFilters, local_parties: [] }),
                dropdownOptions: hierarchyDataExtensions.map((ext: any) => ({
                    label: String(ext.name ?? ext.id),
                    value: String(ext.id),
                    onClick: () => applyFilters({ ...currentFilters, local_parties: [String(ext.id)] }),
                })),
            },
        ],
    }), [
        searchValue,
        currentFilters,
        hierarchyDataExtensions,
        fetchTableData,
        applyFilters,
    ]);

    rowsPerPageRef.current = paginationInfo.perPage;

    // Initial load and refetch when filters/refresh change
    useEffect(() => {
        setPaginationInfo((prev: any) => ({ ...prev, currentPage: 1 }));
        fetchTableData(1, rowsPerPageRef.current, '');
    }, [refreshKey, fetchTableData]);


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
            console.error('Download failed:', error);
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
      
            globalThis.open(tempUrl, '_blank');
            
      
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
                const audioUrl = globalThis.URL.createObjectURL(blob);
                setAudioUrl(audioUrl);
            } else if (response.status === 204) {
                toast.error('Audio file not found');
            } else {
                setAudioError(`Unexpected response status: ${response.status}`);
            }
            
        } catch (error: any) {
            if (error?.response?.status) {
                if (error.response?.status === 204) {
                    toast.error('Audio file not found');
                } else {
                    setAudioError(`Error loading audio: ${error.response?.status}`);
                }
            } else if (error?.request) {
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

    const renderModalBody = () => {
        if (audioLoading) {
            return (
                <div className="p-4">
                    <div className="spinner-border text-primary" aria-hidden="true" />
                    <output className="mt-2 d-block" aria-live="polite">Loading audio file...</output>
                </div>
            );
        }

        if (audioError) {
            return (
                <div className="p-4">
                    <div className="alert alert-warning">
                        <i className="ph-duotone ph-warning-circle" aria-hidden="true" />{' '}
                        <span>File not found</span>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <AudioPlayer
                    ref={audioPlayerRef}
                    audioSrc={audioUrl}
                    title={`Call Recording - ${selectedRecording?.Id}`}
                    showWaveform={true}
                    autoPlay={true}
                />
            </div>
        );
    };


    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Call Analysis" mainLink="/communications/call-analysis" subTitle="Call Analysis" showPageLoader={showPageLoader} />

            <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title style-2">
                        <Row className="d-flex justify-content-between align-items-center">
                            <Col md={4}>
                                <h2 className="mb-0">Call Analysis</h2>
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

            <div className="mb-4">
                <StatsCards data={statsCardsData} gridMinWidth="160px" />
            </div>

            {currentFilters.start_datetime && currentFilters.end_datetime && (
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
                            style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eef2ff', color: '#4f46e5' }}
                        >
                            <Calendar size={16} />
                        </span>
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>
                                Selected Date Range
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                {formatDateTimeToLocal(currentFilters.start_datetime, GlobalDateTimeFormat)} — {formatDateTimeToLocal(currentFilters.end_datetime, GlobalDateTimeFormat)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            {session?.user?.permissions?.includes('transcriptions-analysis-aiml') && (
                <GenericTable<any>
                    data={tableData}
                    columns={tableColumns}
                    actions={recordingActions}
                    actionsLabel="Action"
                    loading={tableLoading}
                    emptyMessage="No call analysis records found."
                    loadingMessage="Loading call analysis..."
                    showToolbar={true}
                    toolbar={tableToolbar}
                    showToolbarActions={false}
                    pagination={{
                        currentPage: paginationInfo.currentPage,
                        rowsPerPage: paginationInfo.perPage,
                        totalRows: paginationInfo.totalRows,
                        pageSizeOptions: [10, 15, 25, 50, 100],
                    }}
                    onPaginationChange={(page, rowsPerPage) => {
                        setPaginationInfo((prev: any) => ({ ...prev, currentPage: page, perPage: rowsPerPage }));
                        fetchTableData(page, rowsPerPage, searchValue.trim());
                    }}
                    sortable={true}
                    hover={true}
                    striped={false}
                    uniqueKey="uuid"
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
                            {renderModalBody()}
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
