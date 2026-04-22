import '@assets/scss/datatable-style.scss';

import React, { ReactElement, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Col, Button, Card, Form, Modal, Row } from 'react-bootstrap';

import { useSession } from 'next-auth/react';
import type { NextPage } from 'next';
import moment from 'moment';
import dynamic from 'next/dynamic';

// Components
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableAction, TableColumn } from '@components/GenericTable';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import ChartBar from '@components/ChartBar';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import EmptyState from '@components/EmptyState';
import { Hash, Phone, PhoneIncoming, PhoneOutgoing, Calendar } from 'lucide-react';

import '@assets/scss/common.scss';

// Utils
import { ListCallLogs, DownloadCallRecording, DownloadStreamingExport } from '@utils/calls';
import axiosInstance from '@utils/axios';
import { toast } from 'react-toastify';
import { ModuleSlug, formatDuration, GlobalDateFormat, GlobalTimeFormat, GlobalDateTimeFormat, encodeAnalysisData, convertDateTimeWithOffsetToLocal, formatDateTimeToLocal } from '@utils/Helper';
import { isExactPhoneMatch, normalizePhoneValue } from '@utils/phoneMatch';
import CircularProgressCircle from '@components/CircularProgressCircle';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

import { HEADER_CONSTANTS } from '@constants/headerConstants';
const { PERMISSIONS } = HEADER_CONSTANTS;

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

// ─── Filter menu components (lifted out of CallRecordings to satisfy Sonar) ──

interface PhoneFilterMenuProps {
  value: string;
  onChange: (value: string) => void;
  onApply: (value: string) => void;
  closeMenu: () => void;
}
const PhoneFilterMenu: React.FC<PhoneFilterMenuProps> = ({ value, onChange, onApply, closeMenu }) => (
  <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
    <Form.Control
      size="sm"
      type="text"
      placeholder="Enter phone number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    <div className="d-flex justify-content-end gap-2">
      <Button variant="outline-secondary" size="sm" onClick={closeMenu}>Cancel</Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => { onApply(value.trim()); closeMenu(); }}
      >Apply</Button>
    </div>
  </div>
);

interface DateFilterMenuProps {
  value: string;
  onChange: (value: string) => void;
  onApply: (value: string) => void;
  closeMenu: () => void;
  variant: 'start' | 'end';
}

/**
 * `datetime-local` needs `YYYY-MM-DDTHH:mm` (or with seconds, trimmed to minutes for the control).
 * Accepts date-only, ISO strings, and existing local values from filter state.
 */
function toDateTimeLocalInputValue(raw: string | undefined, variant: 'start' | 'end'): string {
  if (raw == null || String(raw).trim() === '') return '';
  const t = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) {
    return t;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(t)) {
    return t.slice(0, 16);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return variant === 'end' ? `${t}T23:59` : `${t}T00:00`;
  }
  const m = moment(t);
  return m.isValid() ? m.format('YYYY-MM-DDTHH:mm') : '';
}

const DateFilterMenu: React.FC<DateFilterMenuProps> = ({ value, onChange, onApply, closeMenu, variant }) => {
  const inputValue = toDateTimeLocalInputValue(value, variant);
  return (
    <div className="d-flex flex-column gap-2" style={{ minWidth: 280 }}>
      <Form.Control
        size="sm"
        type="datetime-local"
        step={60}
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="d-flex justify-content-end gap-2">
        <Button variant="outline-secondary" size="sm" onClick={closeMenu}>Cancel</Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { onApply(inputValue); closeMenu(); }}
        >Apply</Button>
      </div>
    </div>
  );
};

// ─── Dropdown content factories (defined outside CallRecordings to satisfy Sonar) ──

function createPhoneDropdownContent(
  value: string,
  onChange: (v: string) => void,
  onApply: (v: string) => void,
) {
  return function PhoneDropdownRender({ closeMenu }: { closeMenu: () => void }) {
    return (
      <PhoneFilterMenu value={value} onChange={onChange} onApply={onApply} closeMenu={closeMenu} />
    );
  };
}

function createDateDropdownContent(
  value: string,
  onChange: (v: string) => void,
  onApply: (v: string) => void,
  variant: 'start' | 'end',
) {
  return function DateDropdownRender({ closeMenu }: { closeMenu: () => void }) {
    return (
      <DateFilterMenu
        value={value}
        onChange={onChange}
        onApply={onApply}
        closeMenu={closeMenu}
        variant={variant}
      />
    );
  };
}

function recordingsDateTimePillLabel(raw: string | undefined, variant: 'start' | 'end'): string | undefined {
  if (raw == null || String(raw).trim() === '') return undefined;
  const local = toDateTimeLocalInputValue(raw, variant);
  if (!local) {
    const m = moment(String(raw).trim());
    return m.isValid() ? m.format('MMM D, YYYY h:mm A') : undefined;
  }
  return moment(local, 'YYYY-MM-DDTHH:mm').format('MMM D, YYYY h:mm A');
}

function recordingsExtensionPillOption(
  ext: { id: unknown; name?: unknown },
  currentFilters: Record<string, unknown>,
  applyFilters: (f: Record<string, unknown>) => void,
) {
  const idStr = String(ext.id);
  const selectedIds = Array.isArray(currentFilters.extension_number)
    ? (currentFilters.extension_number as string[]).map(String)
    : [];
  const isSelected = selectedIds.includes(idStr);
  return {
    label: String(ext.name ?? ext.id),
    value: idStr,
    selected: isSelected,
    onClick: () => {
      const next = isSelected
        ? selectedIds.filter((x) => x !== idStr)
        : [...selectedIds, idStr];
      applyFilters({ ...currentFilters, extension_number: next });
    },
  };
}

function recordingsExtensionAllSelected(allIds: string[], extensionFilter: unknown): boolean {
  if (allIds.length === 0) return false;
  if (!Array.isArray(extensionFilter) || extensionFilter.length !== allIds.length) {
    return false;
  }
  const selected = new Set((extensionFilter as string[]).map(String));
  return allIds.every((id) => selected.has(id));
}

function recordingsFormatStartDateForApi(value: string): string {
  let startMoment = moment(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    startMoment = moment(value + ':00');
  } else if (!value.includes('T')) {
    startMoment = moment(value).startOf('day');
  }
  return startMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
}

function recordingsFormatEndDateForApi(value: string): string {
  let endMoment = moment(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    const timePart = value.split('T')[1];
    if (timePart === '23:59') {
      endMoment = moment(value + ':59');
    } else {
      endMoment = moment(value + ':00');
    }
  } else if (!value.includes('T')) {
    endMoment = moment(value).endOf('day');
  }
  return endMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
}

const CallRecordings: NextPage & { getLayout?: (page: React.ReactElement) => React.ReactNode } = () => {
  const { data: session } = useSession();
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const [showPageLoader, setShowPageLoader] = useState(false);

  const [showDateRange] = useState(true);
  const [startDateTime, setStartDateTime] = useState<string>(() =>
    moment().clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
  );
  const [endDateTime, setEndDateTime] = useState<string>(() =>
    moment().clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
  );
  // Initialize filters with default values immediately to prevent first API call without dates
  const getDefaultFilters = () => {
    const now = moment();
    const startDateApi = now.clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    const endDateApi = now.clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    // Match default range in `current` so `applyFilters({ ...currentFilters, ... })` does not drop dates.
    const startDateUi = now.clone().startOf('day').format('YYYY-MM-DDTHH:mm');
    const endDateUi = now.clone().endOf('day').format('YYYY-MM-DDTHH:mm');
    return {
      current: {
        start_date: startDateUi,
        end_date: endDateUi,
      },
      applied: {
        start_date: startDateApi,
        end_date: endDateApi,
      },
    };
  };
  
  const defaultFilters = getDefaultFilters();
  
  // State declarations
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(defaultFilters.current);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>(defaultFilters.applied); // Filters that trigger API calls
  const [searchValue, setSearchValue] = useState<string>('');
  const showAnalytics = false;
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
  const [downloadingRecordings, setDownloadingRecordings] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  
  // State for managing data and manual additions
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

  const getRowsArray = (response: any): RecordingRow[] => {
    const rawData = response?.data;
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData?.data)) return rawData.data;
    if (Array.isArray(response?.dataList)) return response.dataList;
    return [];
  };

  const updatePaginationFromResponse = (response: any, rowsArray: RecordingRow[], page: number, perPage: number) => {
    const rawData = response?.data;
    const paginationData = response?.data?.pagination ?? response?.pagination ?? response;
    const total =
      response?.recordsTotal ??
      response?.total ??
      rawData?.recordsTotal ??
      rawData?.total ??
      paginationData?.total ??
      rowsArray.length;
    const currentPage = response?.current_page ?? paginationData?.current_page ?? page;
    const perPageVal = response?.per_page ?? paginationData?.per_page ?? perPage;
    rowsPerPageRef.current = perPageVal;

    setPaginationInfo({
      totalRows: Number(total) || 0,
      totalPages: Number(paginationData?.last_page ?? response?.last_page ?? Math.max(1, Math.ceil(Number(total) / perPageVal))) || 1,
      currentPage,
      perPage: perPageVal,
    });
  };

  const updateExtensionChart = (dataExtension: any[]) => {
    if (!Array.isArray(dataExtension) || dataExtension.length === 0) {
      setChartLoading(false);
      return;
    }

    const ms = 10000000;
    const newChartData: ChartDuration = { label: [], longest_call: [], shortest_call: [], average_call: [] };

    dataExtension.forEach((item: any) => {
      newChartData.label.push(item.label);
      const longestCall = typeof item.longest_call === 'string' ? Number.parseFloat(item.longest_call) : Number(item.longest_call) || 0;
      const shortestCall = typeof item.shortest_call === 'string' ? Number.parseFloat(item.shortest_call) : Number(item.shortest_call) || 0;
      const averageCall = typeof item.average_call === 'string' ? Number.parseFloat(item.average_call) : Number(item.average_call) || 0;
      newChartData.longest_call.push(longestCall / ms);
      newChartData.shortest_call.push(shortestCall / ms);
      newChartData.average_call.push(averageCall / ms);
    });

    setChartLoading(true);
    const dataLength = newChartData.label.length;
    if (
      dataLength > 0 &&
      newChartData.shortest_call.length === dataLength &&
      newChartData.longest_call.length === dataLength &&
      newChartData.average_call.length === dataLength
    ) {
      setCurrentChartData({
        series: [
          { name: 'Short', data: newChartData.shortest_call },
          { name: 'Average', data: newChartData.average_call },
          { name: 'Long', data: newChartData.longest_call },
        ],
        categories: newChartData.label,
      });
    }
    setChartLoading(false);
  };

  const updateDirectionChart = (dateChart: any[]) => {
    if (!Array.isArray(dateChart) || dateChart.length === 0) return;

    const newChartDirection: ChartDirection = { inbound: [], outbound: [], label: [] };
    dateChart.forEach((item: any) => {
      newChartDirection.inbound.push(item.inbound);
      newChartDirection.outbound.push(item.outbound);
      newChartDirection.label.push(item.label);
    });

    setCallDirectionTwo({
      series: [
        { name: 'Inbound', data: newChartDirection.inbound },
        { name: 'Outbound', data: newChartDirection.outbound },
      ],
      options: {
        chart: { type: 'bar' as const, height: 200, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 5, borderRadiusApplication: 'end' as const } },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: { categories: newChartDirection.label },
        yaxis: { title: { text: 'Calls' } },
        fill: { opacity: 1 },
        tooltip: { y: { formatter: (val: any) => `${val} calls` } },
      },
    });
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
      setSummary(response.summary);
      const dataFilters = response?.filters;
      if (dataFilters?.start_date) setStartDateTime(dataFilters.start_date);
      if (dataFilters?.end_date) setEndDateTime(dataFilters.end_date);
    }

    let rowsArray = getRowsArray(response);

    // Keep UI behavior consistent even if backend ignores exact-number filter keys.
    const rawRemoteFilter = appliedFiltersRef.current?.remote_party_number;
    const exactRemoteFilter = Array.isArray(rawRemoteFilter)
      ? normalizePhoneValue(rawRemoteFilter[0])
      : normalizePhoneValue(rawRemoteFilter);
    if (exactRemoteFilter) {
      rowsArray = rowsArray.filter((row) => isExactPhoneMatch(row.RemotePartyNumber, exactRemoteFilter));
    }

    setTableData(rowsArray);

    updatePaginationFromResponse(response, rowsArray, page, perPage);
    updateExtensionChart(response?.chart?.extension);
    updateDirectionChart(response?.chart?.date);

      return response;
    } finally {
      setShowPageLoader(false);
      setTableLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const handleOpenChartModal = (
    chartData: { series: any[]; categories: string[] } | null,
    title: string
  ) => {
    if (chartData) {
      setCurrentChartData(chartData);
      setCurrentChartTitle(title);
      setCallDurationBarChartModal(true);
    }
  };

  const handleFiltersChange = useCallback((filters: any) => {
    // Format datetime values to include seconds and timezone offset (remove timezone key)
    const formattedFilters: any = { ...filters };

    // Backward compatibility: normalize alternate keys to API keys expected by recordings endpoint.
    if (formattedFilters.start_datetime && !formattedFilters.start_date) {
      formattedFilters.start_date = formattedFilters.start_datetime;
    }
    if (formattedFilters.end_datetime && !formattedFilters.end_date) {
      formattedFilters.end_date = formattedFilters.end_datetime;
    }
    delete formattedFilters.start_datetime;
    delete formattedFilters.end_datetime;
    
    if (formattedFilters.start_date) {
      formattedFilters.start_date = recordingsFormatStartDateForApi(
        String(formattedFilters.start_date),
      );
    }
    if (formattedFilters.end_date) {
      formattedFilters.end_date = recordingsFormatEndDateForApi(
        String(formattedFilters.end_date),
      );
    }

    const normalizedRemotePartyNumber = normalizePhoneValue(formattedFilters.remote_party_number);
    if (normalizedRemotePartyNumber) {
      // Recordings endpoint expects an array for this filter key.
      formattedFilters.remote_party_number = [normalizedRemotePartyNumber];
      // Also pass an explicit exact key for backends that support it.
      formattedFilters.remote_party_number_exact = normalizedRemotePartyNumber;
    } else {
      delete formattedFilters.remote_party_number;
      delete formattedFilters.remote_party_number_exact;
    }
    
    // Remove timezone key from payload (timezone is now included in datetime values)
    delete formattedFilters.timezone;
    
    // Update both state and ref immediately
    setCurrentFilters({
      ...filters,
      remote_party_number: normalizedRemotePartyNumber,
    }); // Keep input format for display
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
  }, []);

  const handleExport = async (exportType: string, filters: Record<string, any>) => {
    setShowPageLoader(true);
    try {
      if (exportType === 'excel') {
       
        await DownloadStreamingExport(
          { filters, isExport: true, exportType, moduleSlug: ModuleSlug.CALL_RECORDINGS},
          'call-logs/recordings',
          'recordings'
        ).finally(() => {
          setShowPageLoader(false);
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  };

  const applyFilters = useCallback(
    (nextFilters: Record<string, any>) => {
      handleFiltersChange(nextFilters);
    },
    [handleFiltersChange],
  );

  const callDirectionLabel = (value: string): string => {
    if (value === 'OUTGOING') return 'Outgoing';
    if (value === 'INCOMING') return 'Incoming';
    if (value === 'Both') return 'Both';
    return '';
  };

  const selectedStartDateTime = String(appliedFilters?.start_date || startDateTime || '');
  const selectedEndDateTime = String(appliedFilters?.end_date || endDateTime || '');

  const tableToolbar = useMemo(() => {
    const extensionAllIds = hierarchyDataExtensions.map((ext: any) => String(ext.id));
    return {
    showTabs: true,
    tabs: [
      {
        id: 'call-recordings-title',
        label: 'Call Recordings',
        removable: false,
      },
    ],
    activeTab: 'call-recordings-title',
    onTabChange: () => {},
    showSearch: true,
    searchValue,
    searchPlaceholder: 'Search by username, extension, phone...',
    onSearchChange: (value: string) => setSearchValue(value),
    onSearch: () => {
      setPaginationInfo((prev) => ({ ...prev, currentPage: 1 }));
      fetchCallLogsOriginal(1, paginationInfo.perPage, searchValue.trim());
    },
    showFiltersButton: session?.user?.permissions?.includes(PERMISSIONS.VIEW_CALL_RECORDINGS_FILTERS),
    showExportButton: session?.user?.permissions?.includes('export-call-recordings'),
    onExportClick: () => handleExport('excel', appliedFilters),
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
        id: 'extension_number',
        label: 'Extension',
        showDropdown: true,
        searchable: true,
        multiSelect: true,
        onSelectAll: () => {
          const allSelected = recordingsExtensionAllSelected(
            extensionAllIds,
            currentFilters.extension_number,
          );
          applyFilters({
            ...currentFilters,
            extension_number: allSelected ? [] : extensionAllIds,
          });
        },
        selectAllLabel: recordingsExtensionAllSelected(
          extensionAllIds,
          currentFilters.extension_number,
        )
          ? 'Deselect all'
          : 'Select all',
        active: Array.isArray(currentFilters.extension_number) && currentFilters.extension_number.length > 0,
        activeLabel: Array.isArray(currentFilters.extension_number) && currentFilters.extension_number.length > 0
          ? `${currentFilters.extension_number.length} selected`
          : undefined,
        onClear: () => applyFilters({ ...currentFilters, extension_number: [] }),
        dropdownOptions: hierarchyDataExtensions.map((ext: any) =>
          recordingsExtensionPillOption(ext, currentFilters, applyFilters),
        ),
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
          onClick: () => applyFilters({ ...currentFilters, department: [String(dept.id)] }),
        })),
      },
      {
        id: 'username',
        label: 'Username',
        showDropdown: true,
        searchable: true,
        active: Boolean(currentFilters.username),
        activeLabel: currentFilters.username
          ? (() => {
              const user = hierarchyDataUsers.find((u: any) => String(u.id) === String(currentFilters.username));
              return user ? String((user as any).name ?? (user as any).id) : String(currentFilters.username);
            })()
          : undefined,
        onClear: () => applyFilters({ ...currentFilters, username: '' }),
        dropdownOptions: hierarchyDataUsers.map((u: any) => ({
          label: String(u.name ?? u.id),
          value: String(u.id),
          onClick: () => applyFilters({ ...currentFilters, username: String(u.id) }),
        })),
      },
      {
        id: 'remote_party_number',
        label: 'Remote Party Number',
        showDropdown: true,
        active: Boolean(currentFilters.remote_party_number),
        activeLabel: currentFilters.remote_party_number ? String(currentFilters.remote_party_number) : undefined,
        onClear: () => applyFilters({ ...currentFilters, remote_party_number: '' }),
        dropdownContent: createPhoneDropdownContent(
          currentFilters.remote_party_number ?? '',
          (v) => setCurrentFilters({ ...currentFilters, remote_party_number: v }),
          (v) => applyFilters({ ...currentFilters, remote_party_number: v }),
        ),
      },
      {
        id: 'start_date',
        label: 'Start Date & Time',
        showDropdown: true,
        active: Boolean(currentFilters.start_date),
        activeLabel: recordingsDateTimePillLabel(currentFilters.start_date, 'start'),
        activeLabelOnly: true,
        onClear: () => applyFilters({ ...currentFilters, start_date: '' }),
        dropdownContent: createDateDropdownContent(
          currentFilters.start_date ?? '',
          (v) => setCurrentFilters({ ...currentFilters, start_date: v }),
          (v) => applyFilters({ ...currentFilters, start_date: v }),
          'start',
        ),
      },
      {
        id: 'end_date',
        label: 'End Date & Time',
        showDropdown: true,
        active: Boolean(currentFilters.end_date),
        activeLabel: recordingsDateTimePillLabel(currentFilters.end_date, 'end'),
        activeLabelOnly: true,
        onClear: () => applyFilters({ ...currentFilters, end_date: '' }),
        dropdownContent: createDateDropdownContent(
          currentFilters.end_date ?? '',
          (v) => setCurrentFilters({ ...currentFilters, end_date: v }),
          (v) => applyFilters({ ...currentFilters, end_date: v }),
          'end',
        ),
      },
    ],
    rightActions: (
      <div className="d-flex align-items-center gap-2 call-recordings-date-range-wrap">
        {showDateRange && selectedStartDateTime && selectedEndDateTime && moment.utc(selectedStartDateTime).isValid() && moment.utc(selectedEndDateTime).isValid() && (
          <div
            className="d-flex align-items-center gap-2 call-recordings-date-chip"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '6px 10px',
            }}
          >
            <span
              className="d-inline-flex align-items-center justify-content-center"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#eef2ff',
                color: '#4f46e5',
              }}
            >
              <Calendar size={14} />
            </span>
            <span className="call-recordings-date-text" style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
              {formatDateTimeToLocal(selectedStartDateTime, GlobalDateTimeFormat)} - {formatDateTimeToLocal(selectedEndDateTime, GlobalDateTimeFormat)}
            </span>
          </div>
        )}
      </div>
    ),
  };
  }, [
    searchValue,
    paginationInfo.perPage,
    fetchCallLogsOriginal,
    currentFilters,
    hierarchyDataExtensions,
    hierarchyDataDepartments,
    hierarchyDataUsers,
    session?.user?.permissions,
    showPageLoader,
    appliedFilters,
    showDateRange,
    selectedStartDateTime,
    selectedEndDateTime,
    applyFilters,
  ]);

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
            const randomIncrement = (crypto.getRandomValues(new Uint8Array(1))[0] / 255) * 15;
            return { ...prev, [Id]: currentProgress + randomIncrement };
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
      console.error('Download failed:', error);
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
      const { Id } = props;
      
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

      globalThis.open(tempUrl, '_blank');
      

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
        const audioUrl = globalThis.URL.createObjectURL(blob);
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

  const renderMediaPlayerBody = () => {
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
            <i className="ph-duotone ph-warning-circle me-2" aria-hidden="true"></i>{' '}
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
          title={`Call Recording - ${selectedRecording.Id}`}
          showWaveform={true}
          autoPlay={true}
        />
      </div>
    );
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
        const duration = Number.parseInt(String(row.Duration), 10) / 10000000 || 0;
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
            <button
              type="button"
              className="btn btn-link p-0 text-info border-0"
              onClick={() => handlePlayRecording(row)}
              aria-label="Play"
              title="Play"
            >
              <i
                data-tooltip-id="my-tooltip"
                data-tooltip-content="Play"
                className="ph-duotone ph-play"
                style={{ fontSize: '1rem' }}
                aria-hidden="true"
              />
            </button>
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
                <button
                  type="button"
                  className="btn btn-link p-0 text-info border-0"
                  onClick={() => handleDownload(row)}
                  aria-label="Download"
                  title="Download"
                >
                  <i
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content="Download"
                    className="ph-duotone ph-arrow-line-down"
                    style={{ fontSize: '1rem' }}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
            {session?.user?.permissions?.includes('transcriptions-analysis-aiml') && (
              <button
                type="button"
                className="btn btn-link p-0 text-info border-0"
                onClick={() => handleAnalysis(row)}
                aria-label="Call Analysis"
                title="Call Analysis"
              >
                <i
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Call Analysis"
                  className="ph-duotone ph-chart-bar"
                  style={{ fontSize: '1rem' }}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        );
      },
    },
  ];

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


      <div className="call-recordings-page">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .call-recordings-page .gt-toolbar-tabs-section .gt-tab-button { margin-left: 12px; }
              .call-recordings-page .call-recordings-date-chip { max-width: 100%; }
              .call-recordings-page .call-recordings-date-text { white-space: nowrap; line-height: 1.35; }
              @media (max-width: 992px) {
              
                .call-recordings-page .gt-toolbar-tabs-section > .d-flex {
                  flex-wrap: wrap;
                  row-gap: 8px;
                }
                .call-recordings-page .call-recordings-date-range-wrap {
                  display:none !important;
                }
                .call-recordings-page .call-recordings-date-chip {
                  width: 100%;
                }
                .call-recordings-page .call-recordings-date-text {
                  white-space: normal !important;
                  overflow-wrap: anywhere;
                  word-break: break-word;
                }
              }
            `,
          }}
        />
        <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Recordings" showPageLoader={showPageLoader} />

      {/* Charts */}
      {showAnalytics && (
      <Row className="mb-3">
        <Col md={6}>
          <Card>
            <Card.Body className='p-3'>
              

              {!currentChartData || currentChartData.series.some((series) => series.data.length === 0) ? (
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
                  onFullScreenClick={() => handleOpenChartModal(currentChartData, 'Call Duration')}
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
            
              {!callDirectionTwo.series.length || callDirectionTwo.series.some((series) => series.data.length === 0) ? (
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
                   showToolbar={true}
                   toolbar={tableToolbar}
                   showToolbarActions={false}
                   statsCards={statsCardsData}
                   metricsGridMinWidth="180px"
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
              </div>

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
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecording && (
            <div className="text-center d-flex flex-column align-items-center">
              {renderMediaPlayerBody()}
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
