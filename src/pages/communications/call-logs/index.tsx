import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { ListCallLogs, ExportCallLogs, DownloadStreamingExport, DownloadCallsExport } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';
import { Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import StatsCards from '@components/GenericStatsCards';
import { Phone, Hash, PhoneIncoming, PhoneOutgoing, Filter, Calendar } from 'lucide-react';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import moment from 'moment';
import PageLoader from '@components/PageLoader';


import '@assets/scss/common.scss';

import { convertUTCSeparateDateTimeToUserTime, convertUTCSeparateDateTimeToUserDate, formatDuration, GlobalDateFormat, GlobalTimeFormat, formatDateTimeToLocal, GlobalDateTimeFormat, ModuleSlug, getAutoTimezone } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import GenericFilterSidebar, { FilterFieldType } from '@components/GenericFilterSidebar';

/** Row shape from call-logs API (data / dataList items) */
interface CallLogRow {
    id?: number | string;
    Date?: string;
    Time?: string;
    username?: string;
    department_name?: string;
    call_type?: string;
    is_answered?: string;
    duration?: string | number;
    extension?: string;
    phone_number?: string;
    [key: string]: any;
}


interface Summary {
    totalCalls: number;
    users: number;
    extensions: number;
    inbound: number;
    outbound: number;
}

const CallLogs = () => {
    const { data:session, status } = useSession();
    const [showPageLoader, setShowPageLoader] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);

    const [showDateRange, setShowDateRange] = useState(false);
    const [startDateTime, setStartDateTime] = useState<string>('');
    const [endDateTime, setEndDateTime] = useState<string>('');
   
    // Table data and pagination state for GenericTable
    const [callLogData, setCallLogData] = useState<CallLogRow[]>([]);
    const [tablePagination, setTablePagination] = useState({
        currentPage: 1,
        rowsPerPage: 15,
        totalRows: 0,
        pageSizeOptions: [10, 15, 25, 50, 100] as number[],
    });

    const tableColumns: TableColumn<CallLogRow>[] = [
        {
            key: 'Date',
            label: 'Date',
            sortable: true,
            render: (row) => convertUTCSeparateDateTimeToUserDate(row.Date ?? '', row.Time ?? '', GlobalDateFormat),
        },
        {
            key: 'Time',
            label: 'Time',
            sortable: true,
            render: (row) => convertUTCSeparateDateTimeToUserTime(row.Date ?? '', row.Time ?? '', GlobalTimeFormat),
        },
        { key: 'username', label: 'Username', sortable: true },
        { key: 'department_name', label: 'Department', sortable: true },
        { key: 'call_type', label: 'Call Type', sortable: true },
        {
            key: 'is_answered',
            label: 'Call Result',
            sortable: true,
            render: (row) =>
                row.is_answered === 'Yes' ? (
                    <span className="status-badge success">Answered</span>
                ) : (
                    <span className="status-badge danger">Not Answered</span>
                ),
        },
        {
            key: 'Duration',
            label: 'Duration',
            sortable: true,
            render: (row) => formatDuration(parseInt(String(row.duration)) || 0),
        },
        { key: 'extension', label: 'Extension', sortable: true },
        { key: 'phone_number', label: 'Phone Number', sortable: true },
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    
    // Initialize filters with default values immediately to prevent first API call without dates
    const getDefaultFilters = () => {
        const now = moment();
        const startDateInput = now.clone().startOf('day').format('YYYY-MM-DDTHH:mm');
        const endDateInput = now.clone().endOf('day').format('YYYY-MM-DDTHH:mm');
        const startDateApi = now.clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        const endDateApi = now.clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        return {
            pending: {
                start_datetime: startDateInput,
                end_datetime: endDateInput
            },
            current: {
                start_datetime: startDateApi,
                end_datetime: endDateApi
            }
        };
    };
    
    const defaultFilters = getDefaultFilters();
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(defaultFilters.current);
    const [pendingFilters, setPendingFilters] = useState<Record<string, any>>(defaultFilters.pending);
    const [searchValue, setSearchValue] = useState<string>('');
    
    // Refs to prevent duplicate API calls
    const currentFiltersRef = useRef<Record<string, any>>(defaultFilters.current);
    const isFetchingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const lastFetchParamsRef = useRef<string>('');
    const rowsPerPageRef = useRef(15);
    
    const [summary, setSummary] = useState<Summary>({
        users: 0,
        totalCalls: 0,
        extensions: 0,
        inbound: 0,
        outbound: 0
    });

    const {
        hierarchyDataUsers,
        hierarchyDataExtensions,
        hierarchyDataDepartments,
        loading: hierarchyLoading
    } = useHierarchyData(ModuleSlug.CALL_LOGS);
    const [totalUsers, setTotalUsers] = useState(0);
    useEffect(() => {
        setTotalUsers(hierarchyDataUsers.length);
    }, [hierarchyDataUsers]);

    const [totalCalls, setTotalCalls] = useState(0);
    // Stats cards data for StatsCards component
    const statsCardsData = [
        {
            title: 'Total Calls',
            value: totalCalls || 0,
            icon: Phone,
            iconColor: '#3B82F6',
            iconBgColor: '#DBEAFE',
            subtitle: 'Show total calls in the system',
        },
        {
            title: 'Extensions',
            value: summary?.extensions || 0,
            icon: Hash,
            iconColor: '#8B5CF6',
            iconBgColor: '#EDE9FE',
            subtitle: 'Show Extensions currently engaged or making calls',
        },
        {
            title: 'Inbound',
            value: summary?.inbound || 0,
            icon: PhoneIncoming,
            iconColor: '#10B981',
            iconBgColor: '#D1FAE5',
            subtitle: 'Total received call count',
        },
        {
            title: 'Outbound',
            value: summary?.outbound || 0,
            icon: PhoneOutgoing,
            iconColor: '#0EA5E9',
            iconBgColor: '#E0F2FE',
            subtitle: 'Total placed call count',
        },
        
    ];

    const [tableLoading, setTableLoading] = useState(false);

    const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
        const now = Date.now();
        const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(currentFiltersRef.current)}`;

        if (isFetchingRef.current && lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 500) {
            return;
        }
        if (lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 100) {
            return;
        }

        isFetchingRef.current = true;
        lastFetchTimeRef.current = now;
        lastFetchParamsRef.current = paramsKey;

        setShowPageLoader(true);
        setTableLoading(true);
        try {
            const response = await ListCallLogs({
                page,
                perPage,
                search,
                filters: currentFiltersRef.current,
                moduleSlug: ModuleSlug.CALL_LOGS,
            }, 'call-logs/list');

            // Handle various API response structures (flat, nested, DataTables style)
            const rawData = response?.data;
            let rowsArray: CallLogRow[] = [];
            if (Array.isArray(rawData)) {
                rowsArray = rawData;
            } else if (Array.isArray(rawData?.data)) {
                rowsArray = rawData.data;
            } else if (Array.isArray(response?.dataList)) {
                rowsArray = response.dataList;
            }

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

            setCallLogData(rowsArray);
            setTablePagination((prev) => ({
                ...prev,
                currentPage,
                rowsPerPage: perPageVal,
                totalRows: Number(total) || 0,
            }));
            setTotalCalls(total);

            if (response?.summary) {
                setShowDateRange(true);
                const dataFilters = response?.filters;
                setStartDateTime(dataFilters?.start_datetime);
                setEndDateTime(dataFilters?.end_datetime);
                setSummary(response.summary);
            }

            return response;
        } finally {
            setShowPageLoader(false);
            setTableLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    rowsPerPageRef.current = tablePagination.rowsPerPage;

    // Initial load and refetch when filters/refresh change
    useEffect(() => {
        setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
        fetchCallLogs(1, rowsPerPageRef.current, '');
    }, [refreshKey, fetchCallLogs]);

    const handleFiltersChange = (filters: any) => {
        // Format datetime values to include seconds and timezone offset (remove timezone key)
        const formattedFilters: any = { ...filters };
        
        if (formattedFilters.start_datetime) {
            // datetime-local returns YYYY-MM-DDTHH:mm format, convert to YYYY-MM-DDTHH:mm:ss with timezone offset
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
            // datetime-local returns YYYY-MM-DDTHH:mm format, convert to YYYY-MM-DDTHH:mm:ss with timezone offset
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
        
        // Remove timezone key from payload (timezone is now included in datetime values)
        delete formattedFilters.timezone;
        
        // Update both state and ref immediately
        setCurrentFilters(formattedFilters);
        currentFiltersRef.current = formattedFilters;
        
        // Trigger refresh for GenericListPage to fetch new data
        setRefreshKey((prev) => prev + 1);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const exportPayload = {
                ...currentFilters,
                timezone: getAutoTimezone()
            };
            await DownloadCallsExport( exportPayload,'call-logs/analytics/download')
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed');
        }
        finally {
            setIsExporting(false);
        }
    };

    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" showPageLoader={showPageLoader} />
           

            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">Call Logs</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      

                    

                    <div className="action-buttons d-flex align-items-center gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowFiltersSidebar(true)}
                        >
                            <Filter size={16} className="me-2" />
                            Filters
                        </button>
                        {session?.user?.permissions?.includes('export-call-logs') && (
                            <button
                                type="button"
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
                        )}
                    </div>



                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

           
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
                        padding: '10px 12px'
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
                                color: '#4f46e5'
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


            {session?.user?.permissions?.includes('list-call-logs') && (
                <GenericTable<CallLogRow>
                    data={callLogData}
                    columns={tableColumns}
                    loading={tableLoading}
                    emptyMessage="No call logs found."
                    loadingMessage="Loading call logs..."
                    pagination={{
                        currentPage: tablePagination.currentPage,
                        rowsPerPage: tablePagination.rowsPerPage,
                        totalRows: tablePagination.totalRows,
                        pageSizeOptions: tablePagination.pageSizeOptions,
                    }}
                    onPaginationChange={(page, rowsPerPage) => {
                        setTablePagination((prev) => ({ ...prev, currentPage: page, rowsPerPage }));
                        fetchCallLogs(page, rowsPerPage, '');
                    }}
                    sortable={true}
                    hover={true}
                    striped={false}
                    uniqueKey="id"
                />
            )}

<GenericFilterSidebar
                isOpen={showFiltersSidebar}
                onClose={() => setShowFiltersSidebar(false)}
                title="Filters"
                subtitle="Filter and refine call logs"
                width="400px"
                filters={[
                    {
                        id: 'call_direction',
                        label: 'Call Direction',
                        type: 'select',
                        value: (pendingFilters as any)?.call_direction
                            ? { value: (pendingFilters as any).call_direction, label: (pendingFilters as any).call_direction === 'OUTGOING' ? 'Outgoing' : (pendingFilters as any).call_direction === 'INCOMING' ? 'Incoming' : 'Both' }
                            : null,
                        onChange: (selected: any) => setPendingFilters({ ...pendingFilters, call_direction: selected?.value ?? '' }),
                        options: [
                            { value: 'OUTGOING', label: 'Outgoing' },
                            { value: 'INCOMING', label: 'Incoming' },
                            { value: 'Both', label: 'Both' },
                        ],
                        placeholder: 'Select call direction',
                        isClearable: true,
                    },
                    {
                        id: 'call_status',
                        label: 'Call Status',
                        type: 'select',
                        value: (pendingFilters as any)?.call_status
                            ? { value: (pendingFilters as any).call_status, label: (pendingFilters as any).call_status === 'Answered' ? 'Answered' : (pendingFilters as any).call_status === 'Not Answered' ? 'Not Answered' : 'Both' }
                            : null,
                        onChange: (selected: any) => setPendingFilters({ ...pendingFilters, call_status: selected?.value ?? '' }),
                        options: [
                            { value: 'Answered', label: 'Answered' },
                            { value: 'Not Answered', label: 'Not Answered' },
                            { value: 'Both', label: 'Both' },
                        ],
                        placeholder: 'Select call status',
                        isClearable: true,
                    },
                    {
                        id: 'called_numbers',
                        label: 'Called Numbers',
                        type: 'text',
                        value: ((pendingFilters as any)?.called_numbers || []).join(', '),
                        onChange: (v: string) => {
                            const values = v.split(',').map((s) => s.trim()).filter(Boolean);
                            setPendingFilters({ ...pendingFilters, called_numbers: values });
                        },
                        placeholder: 'Enter called numbers (comma separated)',
                    },
                    {
                        id: 'extension_number',
                        label: 'Extension',
                        type: 'multi-select',
                        value: ((pendingFilters as any)?.extension_number || []).map((id: string) => {
                            const ext = (hierarchyDataExtensions as any)?.find((e: any) => e.id === id);
                            return ext ? { value: ext.id, label: ext.name } : { value: id, label: id };
                        }).filter((o: { value: string; label: string }) => o.value),
                        onChange: (selected: any) => setPendingFilters({ ...pendingFilters, extension_number: selected ? selected.map((s: any) => s.value) : [] }),
                        options: (hierarchyDataExtensions as any)?.map((ext: any) => ({ value: ext.id, label: ext.name })) || [],
                        placeholder: 'Select extensions',
                        isClearable: true,
                    },
                    {
                        id: 'traffic_type',
                        label: 'Traffic Type',
                        type: 'select',
                        value: (pendingFilters as any)?.traffic_type != null && (pendingFilters as any).traffic_type !== ''
                            ? { value: (pendingFilters as any).traffic_type, label: (pendingFilters as any).traffic_type === 'internal' ? 'Internal' : (pendingFilters as any).traffic_type === 'external' ? 'External' : 'All' }
                            : { value: '', label: 'All' },
                        onChange: (selected: any) => setPendingFilters({ ...pendingFilters, traffic_type: selected?.value ?? '' }),
                        options: [
                            { value: '', label: 'All' },
                            { value: 'internal', label: 'Internal' },
                            { value: 'external', label: 'External' },
                        ],
                        placeholder: 'Select traffic type',
                        isClearable: true,
                    },
                    {
                        id: 'destination_type',
                        label: 'Destination Type',
                        type: 'select',
                        value: (pendingFilters as any)?.destination_type != null && (pendingFilters as any).destination_type !== ''
                            ? { value: (pendingFilters as any).destination_type, label: (pendingFilters as any).destination_type === 'local' ? 'Local' : (pendingFilters as any).destination_type === 'national' ? 'National' : (pendingFilters as any).destination_type === 'international' ? 'International' : 'All' }
                            : { value: '', label: 'All' },
                        onChange: (selected: any) => setPendingFilters({ ...pendingFilters, destination_type: selected?.value ?? '' }),
                        options: [
                            { value: '', label: 'All' },
                            { value: 'local', label: 'Local' },
                            { value: 'national', label: 'National' },
                            { value: 'international', label: 'International' },
                        ],
                        placeholder: 'Select destination type',
                        isClearable: true,
                    },
                    {
                        id: 'department',
                        label: 'Departments',
                        type: 'multi-select',
                        value: ((pendingFilters as any)?.department || []).map((id: string) => {
                            const dept = (hierarchyDataDepartments as any)?.find((d: any) => d.id === id);
                            return dept ? { value: dept.id, label: dept.name } : { value: id, label: id };
                        }).filter((o: { value: string; label: string }) => o.value),
                        onChange: (selected: any) => setPendingFilters({ ...pendingFilters, department: selected ? selected.map((s: any) => s.value) : [] }),
                        options: (hierarchyDataDepartments as any)?.map((d: any) => ({ value: d.id, label: d.name })) || [],
                        placeholder: 'Select departments',
                        isClearable: true,
                    },
                    {
                        id: 'start_datetime',
                        label: 'Start Date & Time',
                        type: 'datetime' as FilterFieldType,
                        value: (pendingFilters as any)?.start_datetime || '',
                        onChange: (v: string | null) => {
                            const datetimeValue = v || '';
                            const endDate = (pendingFilters as any)?.end_datetime || '';
                            let next: Record<string, any> = { ...pendingFilters, start_datetime: datetimeValue };
                            if (datetimeValue && endDate && moment(datetimeValue).isAfter(moment(endDate))) next.end_datetime = datetimeValue;
                            setPendingFilters(next);
                        },
                        placeholder: 'Start',
                    },
                    {
                        id: 'end_datetime',
                        label: 'End Date & Time',
                        type: 'datetime' as FilterFieldType,
                        value: (pendingFilters as any)?.end_datetime || '',
                        onChange: (v: string | null) => {
                            const datetimeValue = v || '';
                            const startDate = (pendingFilters as any)?.start_datetime || '';
                            let next: Record<string, any> = { ...pendingFilters, end_datetime: datetimeValue };
                            if (datetimeValue && startDate && moment(datetimeValue).isBefore(moment(startDate))) next.start_datetime = datetimeValue;
                            setPendingFilters(next);
                        },
                        placeholder: 'End',
                    },
                ]}
                onApply={() => {
                    handleFiltersChange(pendingFilters);
                    setRefreshKey((prev) => prev + 1);
                }}
                onReset={() => {
                    const resetPending: Record<string, any> = {
                        start_datetime: (pendingFilters as any)?.start_datetime || defaultFilters.pending.start_datetime,
                        end_datetime: (pendingFilters as any)?.end_datetime || defaultFilters.pending.end_datetime,
                    };
                    const resetCurrent: Record<string, any> = {
                        start_datetime: (currentFilters as any)?.start_datetime || defaultFilters.current.start_datetime,
                        end_datetime: (currentFilters as any)?.end_datetime || defaultFilters.current.end_datetime,
                    };
                    setPendingFilters(resetPending);
                    setCurrentFilters(resetCurrent);
                    currentFiltersRef.current = resetCurrent;
                    setSearchValue('');
                    handleFiltersChange(resetPending);
                    setRefreshKey((prev) => prev + 1);
                }}
            />
        </React.Fragment>
    );
};

CallLogs.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallLogs;
