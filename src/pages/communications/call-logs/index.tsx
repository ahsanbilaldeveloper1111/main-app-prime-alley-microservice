import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { ListCallLogs, DownloadCallsExport } from '@utils/calls';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import StatsCards from '@components/GenericStatsCards';
import { Phone, Hash, PhoneIncoming, PhoneOutgoing, Calendar } from 'lucide-react';
import moment from 'moment';


import '@assets/scss/common.scss';

import { convertUTCSeparateDateTimeToUserTime, convertUTCSeparateDateTimeToUserDate, formatDuration, GlobalDateFormat, GlobalTimeFormat, formatDateTimeToLocal, GlobalDateTimeFormat, ModuleSlug, getAutoTimezone } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import { isExactPhoneMatch, normalizePhoneValue } from '@utils/phoneMatch';

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

interface NumberFilterMenuProps {
    value: string;
    onChange: (value: string) => void;
    onApply: (value: string) => void;
    closeMenu: () => void;
}

const NumberFilterMenu: React.FC<NumberFilterMenuProps> = ({ value, onChange, onApply, closeMenu }) => (
    <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
        <Form.Control
            size="sm"
            type="text"
            placeholder="Enter number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        <div className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" size="sm" onClick={closeMenu}>
                Cancel
            </Button>
            <Button
                variant="primary"
                size="sm"
                onClick={() => {
                    onApply(value.trim());
                    closeMenu();
                }}
            >
                Apply
            </Button>
        </div>
    </div>
);

interface DateFilterMenuProps {
    value: string;
    onChange: (value: string) => void;
    onApply: (value: string) => void;
    closeMenu: () => void;
}

const DateFilterMenu: React.FC<DateFilterMenuProps> = ({ value, onChange, onApply, closeMenu }) => (
    <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
        <Form.Control
            size="sm"
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        <div className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" size="sm" onClick={closeMenu}>
                Cancel
            </Button>
            <Button
                variant="primary"
                size="sm"
                onClick={() => {
                    onApply(value);
                    closeMenu();
                }}
            >
                Apply
            </Button>
        </div>
    </div>
);

function createNumberDropdownContent(
    value: string,
    onChange: (value: string) => void,
    onApply: (value: string) => void,
) {
    return function NumberDropdownRender({ closeMenu }: { closeMenu: () => void }) {
        return (
            <NumberFilterMenu value={value} onChange={onChange} onApply={onApply} closeMenu={closeMenu} />
        );
    };
}

function createDateDropdownContent(
    value: string,
    onChange: (value: string) => void,
    onApply: (value: string) => void,
) {
    return function DateDropdownRender({ closeMenu }: { closeMenu: () => void }) {
        return (
            <DateFilterMenu value={value} onChange={onChange} onApply={onApply} closeMenu={closeMenu} />
        );
    };
}

const CallLogs = () => {
    const { data:session } = useSession();
    const [showPageLoader, setShowPageLoader] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

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
            render: (row) => formatDuration(Number.parseInt(String(row.duration), 10) || 0),
        },
        { key: 'extension', label: 'Extension', sortable: true },
        { key: 'phone_number', label: 'Phone Number', sortable: true },
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    
    // Initialize filters with default values immediately to prevent first API call without dates
    const getDefaultFilters = () => {
        const now = moment();
        const startDateApi = now.clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        const endDateApi = now.clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        return {
            current: {
                start_datetime: '',
                end_datetime: ''
            },
            applied: {
                start_datetime: startDateApi,
                end_datetime: endDateApi
            }
        };
    };
    
    const defaultFilters = getDefaultFilters();
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(defaultFilters.current);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>(defaultFilters.applied);
    const [searchValue, setSearchValue] = useState<string>('');
    
    // Refs to prevent duplicate API calls
    const appliedFiltersRef = useRef<Record<string, any>>(defaultFilters.applied);
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
        hierarchyDataExtensions,
        hierarchyDataDepartments,
    } = useHierarchyData(ModuleSlug.CALL_LOGS);

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
        const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(appliedFiltersRef.current)}`;

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
                filters: appliedFiltersRef.current,
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

            const exactPhoneFilter = normalizePhoneValue(appliedFiltersRef.current?.phone_number);
            if (exactPhoneFilter) {
                rowsArray = rowsArray.filter((row) => isExactPhoneMatch(row.phone_number, exactPhoneFilter));
            }

            const paginationData = response?.data?.pagination ?? response?.pagination ?? response;
            const total =
                response?.recordsTotal ??
                response?.total ??
                rawData?.recordsTotal ??
                rawData?.total ??
                paginationData?.total ??
                Math.max(rowsArray.length, 0);
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

        const normalizedPhoneNumber = normalizePhoneValue(formattedFilters.phone_number);
        formattedFilters.phone_number = normalizedPhoneNumber;
        if (normalizedPhoneNumber) {
            // Keep existing key and also pass explicit exact-match key when backend supports it.
            formattedFilters.phone_number_exact = normalizedPhoneNumber;
        } else {
            delete formattedFilters.phone_number_exact;
        }
        
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
        setCurrentFilters(filters);
        setAppliedFilters(formattedFilters);
        appliedFiltersRef.current = formattedFilters;
        
        // Trigger refresh for GenericListPage to fetch new data
        setRefreshKey((prev) => prev + 1);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const exportPayload = {
                ...appliedFilters,
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

    const applyFilters = (nextFilters: Record<string, any>) => {
        handleFiltersChange(nextFilters);
    };

    const callDirectionLabel = (value: string): string => {
        if (value === 'OUTGOING') return 'Outgoing';
        if (value === 'INCOMING') return 'Incoming';
        if (value === 'Both') return 'Both';
        return '';
    };

    const callStatusLabel = (value: string): string => {
        if (value === 'Answered') return 'Answered';
        if (value === 'Not Answered') return 'Not Answered';
        if (value === 'Both') return 'Both';
        return '';
    };

    const tableToolbar = useMemo<any>(() => ({
        showSearch: true,
        searchValue,
        searchPlaceholder: 'Search by username, extension, phone...',
        onSearchChange: (value: string) => setSearchValue(value),
        onSearch: () => {
            setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
            fetchCallLogs(1, tablePagination.rowsPerPage, searchValue.trim());
        },
        showFiltersButton: true,
        showFilterPills: true,
        showMoreFiltersButton: false,
        filterPills: [
            {
                id: 'call_direction',
                label: 'Call Direction',
                showDropdown: true,
                active: Boolean(currentFilters.call_direction),
                activeLabel: callDirectionLabel(currentFilters.call_direction ?? ''),
                onClear: () => applyFilters({ ...currentFilters, call_direction: '' }),
                dropdownOptions: [
                    { label: 'Outgoing', value: 'OUTGOING', onClick: () => applyFilters({ ...currentFilters, call_direction: 'OUTGOING' }) },
                    { label: 'Incoming', value: 'INCOMING', onClick: () => applyFilters({ ...currentFilters, call_direction: 'INCOMING' }) },
                    { label: 'Both', value: 'Both', onClick: () => applyFilters({ ...currentFilters, call_direction: 'Both' }) },
                ],
            },
            {
                id: 'call_status',
                label: 'Call Status',
                showDropdown: true,
                active: Boolean(currentFilters.call_status),
                activeLabel: callStatusLabel(currentFilters.call_status ?? ''),
                onClear: () => applyFilters({ ...currentFilters, call_status: '' }),
                dropdownOptions: [
                    { label: 'Answered', value: 'Answered', onClick: () => applyFilters({ ...currentFilters, call_status: 'Answered' }) },
                    { label: 'Not Answered', value: 'Not Answered', onClick: () => applyFilters({ ...currentFilters, call_status: 'Not Answered' }) },
                    { label: 'Both', value: 'Both', onClick: () => applyFilters({ ...currentFilters, call_status: 'Both' }) },
                ],
            },
            {
                id: 'traffic_type',
                label: 'Traffic Type',
                showDropdown: true,
                active: Boolean(currentFilters.traffic_type),
                activeLabel: currentFilters.traffic_type || undefined,
                onClear: () => applyFilters({ ...currentFilters, traffic_type: '' }),
                dropdownOptions: [
                    { label: 'Internal', value: 'internal', onClick: () => applyFilters({ ...currentFilters, traffic_type: 'internal' }) },
                    { label: 'External', value: 'external', onClick: () => applyFilters({ ...currentFilters, traffic_type: 'external' }) },
                    { label: 'All', value: '', onClick: () => applyFilters({ ...currentFilters, traffic_type: '' }) },
                ],
            },
            {
                id: 'destination_type',
                label: 'Destination Type',
                showDropdown: true,
                active: Boolean(currentFilters.destination_type),
                activeLabel: currentFilters.destination_type || undefined,
                onClear: () => applyFilters({ ...currentFilters, destination_type: '' }),
                dropdownOptions: [
                    { label: 'Local', value: 'local', onClick: () => applyFilters({ ...currentFilters, destination_type: 'local' }) },
                    { label: 'National', value: 'national', onClick: () => applyFilters({ ...currentFilters, destination_type: 'national' }) },
                    { label: 'International', value: 'international', onClick: () => applyFilters({ ...currentFilters, destination_type: 'international' }) },
                    { label: 'All', value: '', onClick: () => applyFilters({ ...currentFilters, destination_type: '' }) },
                ],
            },
            {
                id: 'extension_number',
                label: 'Extension',
                showDropdown: true,
                searchable: true,
                active: Array.isArray(currentFilters.extension_number) && currentFilters.extension_number.length > 0,
                activeLabel: Array.isArray(currentFilters.extension_number) && currentFilters.extension_number.length > 0
                    ? `${currentFilters.extension_number.length} selected`
                    : undefined,
                onClear: () => applyFilters({ ...currentFilters, extension_number: [] }),
                dropdownOptions: hierarchyDataExtensions.map((ext: any) => ({
                    label: String(ext.name ?? ext.id),
                    value: String(ext.id),
                    onClick: () => applyFilters({
                        ...currentFilters,
                        extension_number: [String(ext.id)],
                    }),
                })),
            },
            {
                id: 'department',
                label: 'Department',
                showDropdown: true,
                searchable: true,
                active: Array.isArray(currentFilters.department) && currentFilters.department.length > 0,
                activeLabel: Array.isArray(currentFilters.department) && currentFilters.department.length > 0
                    ? `${currentFilters.department.length} selected`
                    : undefined,
                onClear: () => applyFilters({ ...currentFilters, department: [] }),
                dropdownOptions: hierarchyDataDepartments.map((dept: any) => ({
                    label: String(dept.name ?? dept.id),
                    value: String(dept.id),
                    onClick: () => applyFilters({
                        ...currentFilters,
                        department: [String(dept.id)],
                    }),
                })),
            },
            {
                id: 'phone_number',
                label: 'Numbers',
                showDropdown: true,
                active: Boolean(currentFilters.phone_number),
                activeLabel: currentFilters.phone_number ? String(currentFilters.phone_number) : undefined,
                onClear: () => applyFilters({ ...currentFilters, phone_number: '' }),
                dropdownContent: createNumberDropdownContent(
                    currentFilters.phone_number ?? '',
                    (value) => setCurrentFilters({ ...currentFilters, phone_number: value }),
                    (value) => applyFilters({ ...currentFilters, phone_number: value }),
                ),
            },
            {
                id: 'start_datetime',
                label: 'Start Date & Time',
                showDropdown: true,
                active: Boolean(currentFilters.start_datetime),
                activeLabel: currentFilters.start_datetime ? moment(currentFilters.start_datetime).format('MMM DD, YYYY') : undefined,
                activeLabelOnly: true,
                onClear: () => applyFilters({ ...currentFilters, start_datetime: '' }),
                dropdownContent: createDateDropdownContent(
                    currentFilters.start_datetime ?? '',
                    (value) => setCurrentFilters({ ...currentFilters, start_datetime: value }),
                    (value) => applyFilters({ ...currentFilters, start_datetime: value }),
                ),
            },
            {
                id: 'end_datetime',
                label: 'End Date & Time',
                showDropdown: true,
                active: Boolean(currentFilters.end_datetime),
                activeLabel: currentFilters.end_datetime ? moment(currentFilters.end_datetime).format('MMM DD, YYYY') : undefined,
                activeLabelOnly: true,
                onClear: () => applyFilters({ ...currentFilters, end_datetime: '' }),
                dropdownContent: createDateDropdownContent(
                    currentFilters.end_datetime ?? '',
                    (value) => setCurrentFilters({ ...currentFilters, end_datetime: value }),
                    (value) => applyFilters({ ...currentFilters, end_datetime: value }),
                ),
            },
        ],
        rightActions: (
            <div className="d-flex align-items-center gap-2">
                {session?.user?.permissions?.includes('export-call-logs') && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleExport()}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Exporting...' : 'Export'}
                    </button>
                )}
            </div>
        ),
    }), [
        searchValue,
        tablePagination.rowsPerPage,
        fetchCallLogs,
        currentFilters,
        appliedFilters,
        hierarchyDataExtensions,
        hierarchyDataDepartments,
        session?.user?.permissions,
        isExporting,
        applyFilters,
    ]);

    
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


                    <Col md={8} className="d-flex justify-content-end" />
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
                    showToolbar={true}
                    toolbar={tableToolbar}
                    showToolbarActions={false}
                    pagination={{
                        currentPage: tablePagination.currentPage,
                        rowsPerPage: tablePagination.rowsPerPage,
                        totalRows: tablePagination.totalRows,
                        pageSizeOptions: tablePagination.pageSizeOptions,
                    }}
                    onPaginationChange={(page, rowsPerPage) => {
                        setTablePagination((prev) => ({ ...prev, currentPage: page, rowsPerPage }));
                        fetchCallLogs(page, rowsPerPage, searchValue.trim());
                    }}
                    sortable={true}
                    hover={true}
                    striped={false}
                    uniqueKey="id"
                />
            )}
        </React.Fragment>
    );
};

CallLogs.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallLogs;
