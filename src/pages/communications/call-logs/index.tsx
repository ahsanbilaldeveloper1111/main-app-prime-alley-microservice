import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { ListCallLogs, DownloadCallsExport } from '@utils/calls';
import { Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { Phone, Hash, PhoneIncoming, PhoneOutgoing, Calendar } from 'lucide-react';
import moment from 'moment';


import '@assets/scss/common.scss';

import { convertUTCSeparateDateTimeToUserTime, convertUTCSeparateDateTimeToUserDate, formatDuration, GlobalDateFormat, GlobalTimeFormat, formatDateTimeToLocal, GlobalDateTimeFormat, ModuleSlug, getAutoTimezone } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import { isExactPhoneMatch, normalizePhoneValue } from '@utils/phoneMatch';
import { HEADER_CONSTANTS } from '@constants/headerConstants';
import {
    formatEndDateValueForApi,
    formatStartDateValueForApi,
} from '@utils/communications/communicationsDateExtensionFilters';
import {
    buildCallDirectionFilterPill,
    buildCallStatusFilterPill,
    buildDepartmentFilterPill,
    buildEndDateTimeFilterPill,
    buildExtensionNumberMultiSelectFilterPill,
    buildStartDateTimeFilterPill,
} from '@utils/communications/communicationsFilterPillFactories';

const { PERMISSIONS } = HEADER_CONSTANTS;

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

function extractCallLogRows(response: any): CallLogRow[] {
    const rawData = response?.data;
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData?.data)) return rawData.data;
    if (Array.isArray(rawData?.rows)) return rawData.rows;
    if (Array.isArray(response?.dataList)) return response.dataList;
    if (Array.isArray(response?.rows)) return response.rows;
    return [];
}

/** Map alternate API field names and split combined UTC datetimes when Date/Time are missing */
function normalizeCallLogRow(row: CallLogRow & Record<string, unknown>): CallLogRow {
    const next: CallLogRow = { ...row };
    if (!next.username) {
        next.username =
            (row.user_name as string) ??
            (row.agent_name as string) ??
            (row.Username as string) ??
            next.username;
    }
    if (!next.phone_number) {
        next.phone_number =
            (row.phone as string) ?? (row.number as string) ?? (row.PhoneNumber as string) ?? next.phone_number;
    }
    if (typeof next.is_answered === 'boolean') {
        next.is_answered = next.is_answered ? 'Yes' : 'No';
    }

    if (next.Date && next.Time) return next;

    const isoCandidate =
        (row.call_datetime as string) ??
        (row.start_time as string) ??
        (row.call_date_time as string) ??
        (row.datetime as string) ??
        (row.created_at as string);
    if (typeof isoCandidate === 'string' && isoCandidate.includes('T')) {
        const m = moment.utc(isoCandidate);
        if (m.isValid()) {
            next.Date = m.format('YYYY-MM-DD');
            next.Time = m.format('HH:mm:ss');
        }
    }
    return next;
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
            key: 'duration',
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
        // UI filter state must include the same default date range as `applied`; otherwise any
        // pill change via `applyFilters({ ...currentFilters, ... })` drops start/end and breaks the API query.
        const startDateUi = now.clone().startOf('day').format('YYYY-MM-DDTHH:mm');
        const endDateUi = now.clone().endOf('day').format('YYYY-MM-DDTHH:mm');
        return {
            current: {
                start_datetime: startDateUi,
                end_datetime: endDateUi,
            },
            applied: {
                start_datetime: startDateApi,
                end_datetime: endDateApi,
            },
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

            let rowsArray: CallLogRow[] = extractCallLogRows(response).map((r) =>
                normalizeCallLogRow(r as CallLogRow & Record<string, unknown>),
            );

            const exactPhoneFilter = normalizePhoneValue(appliedFiltersRef.current?.phone_number);
            if (exactPhoneFilter) {
                rowsArray = rowsArray.filter((row) => isExactPhoneMatch(row.phone_number, exactPhoneFilter));
            }

            const rawData = response?.data;
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

    const handleFiltersChange = useCallback((filters: any) => {
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
            formattedFilters.start_datetime = formatStartDateValueForApi(
                String(formattedFilters.start_datetime),
            );
        }

        if (formattedFilters.end_datetime) {
            formattedFilters.end_datetime = formatEndDateValueForApi(
                String(formattedFilters.end_datetime),
            );
        }
        
        // Remove timezone key from payload (timezone is now included in datetime values)
        delete formattedFilters.timezone;
        
        // Update both state and ref immediately
        setCurrentFilters(filters);
        setAppliedFilters(formattedFilters);
        appliedFiltersRef.current = formattedFilters;
        
        // Trigger refresh for GenericListPage to fetch new data
        setRefreshKey((prev) => prev + 1);
    }, []);

    const handleExport = async () => {
        if (isExporting) return;
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

    const applyFilters = useCallback(
        (nextFilters: Record<string, any>) => {
            handleFiltersChange(nextFilters);
        },
        [handleFiltersChange],
    );

    const tableToolbar = useMemo<any>(() => {
        const extensionAllIds = hierarchyDataExtensions.map((ext: any) => String(ext.id));
        return {
        showTabs: true,
        tabs: [
            {
                id: 'call-logs-title',
                label: 'Call Logs',
                removable: false,
            },
        ],
        activeTab: 'call-logs-title',
        onTabChange: () => {},
        showSearch: true,
        searchValue,
        searchPlaceholder: 'Search by username, extension, phone...',
        onSearchChange: (value: string) => setSearchValue(value),
        onSearch: () => {
            setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
            fetchCallLogs(1, tablePagination.rowsPerPage, searchValue.trim());
        },
        showFiltersButton: session?.user?.permissions?.includes(PERMISSIONS.VIEW_CALL_LOGS_FILTERS),
        showExportButton: session?.user?.permissions?.includes('export-call-logs'),
        onExportClick: () => handleExport(),
        showFilterPills: true,
        showMoreFiltersButton: false,
        filterPills: [
            buildCallDirectionFilterPill(currentFilters, applyFilters),
            buildCallStatusFilterPill(currentFilters, applyFilters),
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
            buildExtensionNumberMultiSelectFilterPill(
                extensionAllIds,
                hierarchyDataExtensions,
                currentFilters,
                applyFilters,
            ),
            buildDepartmentFilterPill(
                hierarchyDataDepartments,
                currentFilters,
                applyFilters,
            ),
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
            buildStartDateTimeFilterPill('start_datetime', currentFilters, setCurrentFilters, applyFilters),
            buildEndDateTimeFilterPill('end_datetime', currentFilters, setCurrentFilters, applyFilters),
        ],
    };
    }, [
        searchValue,
        tablePagination.rowsPerPage,
        fetchCallLogs,
        currentFilters,
        setCurrentFilters,
        hierarchyDataExtensions,
        hierarchyDataDepartments,
        session?.user?.permissions,
        isExporting,
        applyFilters,
        handleExport,
    ]);

    
    return (
        <div className="call-logs-page">
            <style
                dangerouslySetInnerHTML={{
                    __html: `.call-logs-page .gt-toolbar-tabs-section .gt-tab-button { margin-left: 12px; }`,
                }}
            />
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" showPageLoader={showPageLoader} />

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
                    statsCards={statsCardsData}
                    metricsGridMinWidth="180px"
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
        </div>
    );
};

CallLogs.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallLogs;
