import "@assets/scss/datatable-style.scss";
import parsePhoneNumber from "libphonenumber-js";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import axiosInstance from "@utils/axios";
import GenericTable, {
  FilterPill,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { Row, Col, Card, Form, Button, Badge, Popover, OverlayTrigger } from 'react-bootstrap';
import { TrendingUp, Shield, RefreshCw, XCircle, Clock, Phone } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';


// API Response Types
interface CDRRecord {
  Id: number;
  DateTime: string;
  CallingNumber: string;
  CalledNumber: string;
  UserID: string;
  AllowLocalDNCLCalls: string;
  AllowApiDNCLCalls: string;
  AllowRepetitiveCalls: string;
  IndividualRepetitiveCallsAllowDaily: string;
  IndividualRepetitiveCallsAllowWeekly: string;
  CallRepFollowCompSettings: string;
  CompanyRepetitiveCallsAllowDaily: string;
  CompanyRepetitiveCallsAllowWeekly: string;
  LocalDNDStatus: string;
  CallRepetitionStatus: string;
  DNCRAPIStatus: string;
  TotalTimeTakenMs: number;
  CreatedDate: string;
}

interface CDRResponse {
  statistics?: {
    this_month?: {
      total_calls: number;
      local_dnd: {
        allowed: number;
        blocked: number;
        not_checked: number;
      };
      call_repetition: {
        allowed: number;
        blocked: number;
        not_checked: number;
      };
      dncr_api: {
        allowed: number;
        blocked: number;
        not_checked: number;
        invalid: number;
        none: number;
        error: number;
      };
      performance: {
        avg_time_ms: number;
        min_time_ms: number;
        max_time_ms: number;
      };
    };
    [key: string]: unknown;
  };
  status: string;
  message: string;
  authenticated_user: string;
  metadata: {
    total_records: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
    timestamp: string;
  };
  data: CDRRecord[];
}

type StatusChipTone = {
  color: string;
  backgroundColor: string;
};

function getTriStateTone(value: string, positive: string, neutral: string): StatusChipTone {
  if (value === positive) return { color: "#0d8a5e", backgroundColor: "#d1f4e8" };
  if (value === neutral) return { color: "#6c757d", backgroundColor: "#e9ecef" };
  return { color: "#dc3545", backgroundColor: "#f8d7da" };
}

function getDncrTone(value: string): StatusChipTone {
  if (value === "TRUE") return { color: "#dc3545", backgroundColor: "#f8d7da" };
  if (value === "FALSE") return { color: "#0d8a5e", backgroundColor: "#d1f4e8" };
  return { color: "#6c757d", backgroundColor: "#e9ecef" };
}

// Mapped record type for UI
interface MappedCDRRecord {
  id: string;
  dateTime: string;
  calling: string;
  called: string;
  userId: string;
  localDND: string;
  repetition: string;
  dncrApi: string;
  time: string;
  allowLocalDNCL: string;
  allowApiDNCLCalls: string;
  allowRepetition: string;
}

interface AppliedFilters {
  search: string;
  calling_number: string;
  called_number: string;
  user_id: string;
  call_repetition_status: string;
  local_dnd_status: string;
  dncr_api_status: string;
  date_from: string;
  date_to: string;
}

function buildCdrQueryParams(
  currentPage: number,
  recordsPerPage: number,
  filters: AppliedFilters,
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    page: currentPage,
    per_page: recordsPerPage,
    include_statistics: true,
  };

  if (filters.search) params.search = filters.search;
  if (filters.calling_number) params.calling_number = filters.calling_number;
  if (filters.called_number) params.called_number = filters.called_number;
  if (filters.user_id.trim()) params.user_id = filters.user_id.trim();
  if (filters.call_repetition_status) params.call_repetition_status = filters.call_repetition_status;
  if (filters.local_dnd_status) params.local_dnd_status = filters.local_dnd_status;
  if (filters.dncr_api_status) params.dncr_api_status = filters.dncr_api_status;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  return params;
}

// Phone Container Component
const PhoneContainer = ({ phone, onClick }: { phone: string; onClick?: () => void }) => {
  const [showPopover, setShowPopover] = useState(false);

  const parsePhone = useCallback((phone: string) => {
    if (!phone)
      return {
        phone: "N/A",
        countryCode: "",
      };
    try {
      const parsedPhone = parsePhoneNumber(phone);
      return {
        phone: parsedPhone?.formatInternational() || phone,
        countryCode: parsedPhone?.country || "",
      };
    } catch (e) {
      console.error(e);
      return {
        phone: phone,
        countryCode: "",
      };
    }
  }, []);
  const getFlagImgSrc = useCallback((countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
  }, []);
  const phoneNumber = useMemo(() => {
    return phone
      ? parsePhone(phone)
      : {
          phone: "N/A",
          countryCode: "",
        };
  }, [phone, parsePhone]);

  const flagImgSrc = getFlagImgSrc(phoneNumber.countryCode);

  const phoneBadge = (
    <Badge 
      bg="info" 
      className="bg-opacity-10 text-dark"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <div className="d-flex align-items-center gap-2">
        {phoneNumber?.countryCode && (
          <img src={flagImgSrc} alt={phoneNumber.countryCode} />
        )}
        {phoneNumber.phone}
      </div>
    </Badge>
  );

  if (!onClick) {
    return phoneBadge;
  }

  const popover = (
    <Popover 
      id={`phone-popover-${phone}`} 
      style={{ 
        maxWidth: '160px', 
        pointerEvents: 'auto',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        borderRadius: '8px'
      }}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <Popover.Body 
        className="p-0"
        style={{ 
          padding: '8px',
          borderRadius: '8px'
        }}
      >
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
            setShowPopover(false);
          }}
          className="d-flex align-items-center justify-content-center gap-2 w-100"
          style={{ 
            fontSize: '13px', 
            fontWeight: '600',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            backgroundColor: 'transparent',
            color: '#212529',
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            minHeight: '36px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.backgroundColor = '#f8f9fa';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Phone size={18} style={{ strokeWidth: 2.5 }} />
          <span>Call</span>
        </Button>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      show={showPopover}
      placement="top"
      overlay={popover}
      trigger={[]}
    >
      <span style={{ display: 'inline-block' }}>{phoneBadge}</span>
    </OverlayTrigger>
  );
};

// Component definitions moved outside
const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; subtitle?: string; chart?: React.ReactNode; bgClass?: string }> = ({ icon, title, value, subtitle, chart, bgClass = '' }) => (
  <Card className={`border stat-card-responsive ${bgClass}`} style={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#dee2e6' }}>
    <Card.Body className="p-3 d-flex flex-column">
      <div className="d-flex align-items-center mb-2">
        <div style={{ color: '#10b981' }} className="me-2">{icon}</div>
        <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>{title}</div>
      </div>
      <div className="mb-2">
        <div style={{ fontSize: '2rem', fontWeight: '600', color: '#212529' }}>{value}</div>
        {subtitle && <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>{subtitle}</div>}
      </div>
      {chart && <div className="mt-auto" style={{ width: '100%', height: '55px', marginTop: '12px' }}>{chart}</div>}
    </Card.Body>
  </Card>
);

const MetricCard: React.FC<{ icon: React.ReactNode; title: string; items: Array<{ label: string; value: string | number; color?: string }>; chart?: React.ReactNode; bgGradient?: string }> = ({ icon, title, items, chart, bgGradient = '' }) => (
  <Card className="stat-card-responsive border" style={{ backgroundColor: '#ffffff', borderRadius: '12px', background: bgGradient || '#ffffff', borderColor: '#dee2e6' }}>
    <Card.Body className="p-3">
      <div className="d-flex align-items-center mb-3">
        <div style={{ color: '#f59e0b' }} className="me-2">{icon}</div>
        <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>{title}</div>
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          {items.map((item, idx) => (
            <div key={`item-${item.label}-${idx}`} className="mb-2">
              <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>{item.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: item.color || '#212529' }}>{item.value}</div>
            </div>
          ))}
        </div>
        {chart && <div style={{ width: '120px', height: '120px' }}>{chart}</div>}
      </div>
    </Card.Body>
  </Card>
);

const CDRRecords = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [callingNumberFilter, setCallingNumberFilter] = useState('');
  const [calledNumberFilter, setCalledNumberFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [repetitionStatusFilter, setRepetitionStatusFilter] = useState('');
  const [localDndStatusFilter, setLocalDndStatusFilter] = useState('');
  const [dncrApiStatusFilter, setDncrApiStatusFilter] = useState('');

  // Mapping for DNCR API Status values to labels
  const dncrApiStatusLabels: Record<string, string> = {
    '': 'DNCR API',
    'TRUE': '🚫 TRUE (Blocked in DNCR)',
    'FALSE': '✅ FALSE (Allowed by DNCR)',
    'Not Checked': '⏭️ Not Checked',
    'INVALID': '⚠️ INVALID (Not Found)',
    'NONE': '⚠️ NONE (Null Status)',
    'NULL': '⚠️ NULL (Null Status)',
    'UNKNOWN': '❌ UNKNOWN (Timeout/Error)',
    'ERROR': '❌ ERROR (API Failed)',
    '%CACHE-BLOCKED': '🔄 Cache: Blocked',
    '%CACHE-ALLOWED': '🔄 Cache: Allowed',
    '%NOT-IN-CACHE': '🚫 Cache: Miss (Fail-closed)'
  };
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    search: '',
    calling_number: '',
    called_number: '',
    user_id: '',
    call_repetition_status: '',
    local_dnd_status: '',
    dncr_api_status: '',
    date_from: '',
    date_to: ''
  });
  
  // API state
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<CDRRecord[]>([]);
  const [metadata, setMetadata] = useState<CDRResponse['metadata'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<CDRResponse['statistics'] | null>(null);

  // Fetch CDR data from API
  const fetchCDRData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildCdrQueryParams(currentPage, recordsPerPage, appliedFilters);

      const response = await axiosInstance.get<CDRResponse>('/dncr/cdr/v1', { params });
      
      if (response.data?.status === 'success') {
        setApiData(response.data.data || []);
        setMetadata(response.data.metadata);
        setStatistics(response?.data?.statistics || null);
      } else {
        setError('Failed to fetch CDR records');
        setApiData([]);
      }
    } catch (err: unknown) {
      console.error('Error fetching CDR data:', err);
      const msg =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to fetch CDR records';
      setError(msg ?? 'Failed to fetch CDR records');
      setApiData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, recordsPerPage, appliedFilters]);

  // Fetch data on mount and when pagination changes
  useEffect(() => {
    fetchCDRData();
  }, [fetchCDRData]);

  // Map API record to UI format
  const mapRecordToUI = (record: CDRRecord): MappedCDRRecord => {
    // Format DateTime
    const formatDateTime = (dateTimeStr: string) => {
      try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(',', '');
      } catch {
        return dateTimeStr;
      }
    };

    // Map repetition status
    const mapRepetitionStatus = (status: string) => {
      if (status?.toLowerCase().includes('allowed')) {
        return 'Allowed';
      } else if (status?.toLowerCase().includes('not allowed') || status?.toLowerCase().includes('blocked')) {
        return 'Not Allowed';
      }
      return status || 'Unknown';
    };

    return {
      id: String(record.Id),
      dateTime: formatDateTime(record.DateTime),
      calling: record.CallingNumber || '',
      called: record.CalledNumber || '',
      userId: record.UserID || '',
      localDND: record.LocalDNDStatus,
      repetition: mapRepetitionStatus(record.CallRepetitionStatus),
      
      dncrApi: record.DNCRAPIStatus,

      time: record.TotalTimeTakenMs?.toFixed(2) || '0',
      allowLocalDNCL: record.AllowLocalDNCLCalls,
      allowApiDNCLCalls: record.AllowApiDNCLCalls,
      allowRepetition: record.AllowRepetitiveCalls
    };
  };

  // Calculate stats from API data
  const calculateStats = () => {
    if (!apiData || apiData.length === 0) {
      return {
        totalRecords: 0,
        localDNDNotChecked: 0,
        localDNDAllowed: 0,
        repetitionAllowed: 0,
        repetitionNotAllowed: 0,
        dncrApiFalse: 0,
        dncrApiTrue: 0,
        allowLocalDNCLTrue: 0,
        allowLocalDNCLFalse: 0,
        allowApiDNCLTrue: 0,
        allowApiDNCLFalse: 0,
        allowRepetitionTrue: 0,
        allowRepetitionFalse: 0,
        avgTime: 0
      };
    }

    // Use statistics.this_month data if available, otherwise fallback to calculated stats
    const thisMonthStats = statistics?.this_month;
    
    if (thisMonthStats) {
      return {
        totalRecords: thisMonthStats.total_calls || 0,
        localDNDNotChecked: thisMonthStats.local_dnd?.not_checked || 0,
        localDNDAllowed: thisMonthStats.local_dnd?.allowed || 0,
        localDNDBlocked: thisMonthStats.local_dnd?.blocked || 0,
        repetitionAllowed: thisMonthStats.call_repetition?.allowed || 0,
        repetitionNotAllowed: thisMonthStats.call_repetition?.blocked || 0,
        repetitionNotChecked: thisMonthStats.call_repetition?.not_checked || 0,
        dncrApiFalse: thisMonthStats.dncr_api?.allowed || 0,
        dncrApiTrue: thisMonthStats.dncr_api?.blocked || 0,
        dncrApiNotChecked: thisMonthStats.dncr_api?.not_checked || 0,
        dncrApiInvalid: thisMonthStats.dncr_api?.invalid || 0,
        dncrApiNone: thisMonthStats.dncr_api?.none || 0,
        dncrApiError: thisMonthStats.dncr_api?.error || 0,
        allowLocalDNCLTrue: 0,
        allowLocalDNCLFalse: 0,
        totalTime: 0,
        avgTime: thisMonthStats.performance?.avg_time_ms || 0,
        minTime: thisMonthStats.performance?.min_time_ms || 0,
        maxTime: thisMonthStats.performance?.max_time_ms || 0
      };
    }

    // Fallback to calculated stats from apiData if statistics not available
    const stats = {
      totalRecords: metadata?.total_records || apiData.length,
      localDNDNotChecked: 0,
      localDNDAllowed: 0,
      localDNDBlocked: 0,
      repetitionAllowed: 0,
      repetitionNotAllowed: 0,
      repetitionNotChecked: 0,
      dncrApiFalse: 0,
      dncrApiTrue: 0,
      dncrApiNotChecked: 0,
      dncrApiInvalid: 0,
      dncrApiNone: 0,
      dncrApiError: 0,
      allowLocalDNCLTrue: 0,
      allowLocalDNCLFalse: 0,
      totalTime: 0
    };

    apiData.forEach(record => {
      // Local DND
      if (record.LocalDNDStatus?.toLowerCase().includes('not blocked') || record.LocalDNDStatus?.toLowerCase().includes('allowed')) {
        stats.localDNDAllowed++;
      } else if (record.LocalDNDStatus?.toLowerCase().includes('blocked')) {
        stats.localDNDBlocked++;
      } else {
        stats.localDNDNotChecked++;
      }

      // Repetition
      if (record.CallRepetitionStatus?.toLowerCase().includes('allowed')) {
        stats.repetitionAllowed++;
      } else if (record.CallRepetitionStatus?.toLowerCase().includes('blocked')) {
        stats.repetitionNotAllowed++;
      } else {
        stats.repetitionNotChecked++;
      }

      // DNCR API
      if (record.DNCRAPIStatus === 'Blocked') {
        stats.dncrApiTrue++;
      } else {
        stats.dncrApiFalse++;
      }

      // Allow Local DNCL
      if (record.AllowLocalDNCLCalls?.toLowerCase() === 'true') {
        stats.allowLocalDNCLTrue++;
      } else {
        stats.allowLocalDNCLFalse++;
      }

      // Time
      stats.totalTime += record.TotalTimeTakenMs || 0;
    });

    return {
      ...stats,
      avgTime: apiData.length > 0 ? stats.totalTime / apiData.length : 0,
      minTime: 0,
      maxTime: 0
    };
  };

  const stats = calculateStats();

  // Generate chart data (simplified - using current data)
  const trendData = Array.from({ length: 11 }, () => ({ value: stats.totalRecords }));
  const dncApiTrendData = Array.from({ length: 11 }, () => ({ value: stats.dncrApiFalse }));
  const avgTimeTrendData = Array.from({ length: 11 }, () => ({ value: Math.round(stats.avgTime) }));

  const repetitionData = [
    { name: 'Blocked', value: stats.repetitionNotAllowed || 0, color: '#ef4444' },
    { name: 'Allowed', value: stats.repetitionAllowed || 0, color: '#10b981' },
    { name: 'Not Checked', value: stats.repetitionNotChecked || 0, color: '#6c757d' }
  ];

  // Map API data to UI format
  const mappedData: MappedCDRRecord[] = apiData.map(mapRecordToUI);

  const totalRecords = metadata?.total_records || 0;

  // Apply filters handler
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery,
      calling_number: callingNumberFilter,
      called_number: calledNumberFilter,
      user_id: userIdFilter.trim(),
      call_repetition_status: repetitionStatusFilter,
      local_dnd_status: localDndStatusFilter,
      dncr_api_status: dncrApiStatusFilter,
      date_from: dateFromFilter,
      date_to: dateToFilter
    });
    setCurrentPage(1); // Reset to first page when filters change
    // fetchCDRData will be called automatically via useEffect when appliedFilters changes
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCallingNumberFilter('');
    setCalledNumberFilter('');
    setUserIdFilter('');
    setRepetitionStatusFilter('');
    setLocalDndStatusFilter('');
    setDncrApiStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setAppliedFilters({
      search: '',
      calling_number: '',
      called_number: '',
      user_id: '',
      call_repetition_status: '',
      local_dnd_status: '',
      dncr_api_status: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };

  // Pagination handler for GenericTable
  const handleRecordsPerPageChange = (value: number) => {
    setRecordsPerPage(value);
    setCurrentPage(1);
    // fetchCDRData will be called automatically via useEffect
  };

  const repetitionFilterOptions = useMemo(
    () => [
      { label: 'All Status', value: '__all__', onClick: () => setRepetitionStatusFilter('') },
      { label: 'Allowed', value: 'Allowed', onClick: () => setRepetitionStatusFilter('Allowed') },
      { label: 'Blocked Daily', value: 'Blocked - Daily', onClick: () => setRepetitionStatusFilter('Blocked - Daily') },
      { label: 'Blocked Weekly', value: 'Blocked - Weekly', onClick: () => setRepetitionStatusFilter('Blocked - Weekly') },
      { label: 'Blocked Both', value: 'Blocked - Both', onClick: () => setRepetitionStatusFilter('Blocked - Both') },
      { label: 'Not Checked', value: 'Not Checked', onClick: () => setRepetitionStatusFilter('Not Checked') },
      {
        label: 'Not Checked - Zero Limits',
        value: 'Not Checked - Zero Limits',
        onClick: () => setRepetitionStatusFilter('Not Checked - Zero Limits'),
      },
    ],
    [],
  );

  const localDndFilterOptions = useMemo(
    () => [
      { label: 'All Status', value: '__all__', onClick: () => setLocalDndStatusFilter('') },
      { label: 'Allowed', value: 'Allowed', onClick: () => setLocalDndStatusFilter('Allowed') },
      { label: 'Blocked', value: 'Blocked', onClick: () => setLocalDndStatusFilter('Blocked') },
      { label: 'Not Checked', value: 'Not Checked', onClick: () => setLocalDndStatusFilter('Not Checked') },
    ],
    [],
  );

  const dncrApiFilterOptions = useMemo(
    () => [
      { label: 'All Statuses', value: '__all__', onClick: () => setDncrApiStatusFilter('') },
      ...Object.entries(dncrApiStatusLabels)
        .filter(([key]) => key !== '')
        .map(([key, label]) => ({
          label,
          value: key,
          onClick: () => setDncrApiStatusFilter(key),
        })),
    ],
    [dncrApiStatusLabels],
  );

  const callingDropdownContent = useMemo(
    () => (
      <div style={{ minWidth: '220px' }}>
        <Form.Control
          type="text"
          placeholder="Calling Number"
          value={callingNumberFilter}
          onChange={(e) => setCallingNumberFilter(e.target.value)}
          size="sm"
        />
      </div>
    ),
    [callingNumberFilter],
  );

  const calledDropdownContent = useMemo(
    () => (
      <div style={{ minWidth: '220px' }}>
        <Form.Control
          type="text"
          placeholder="Called Number"
          value={calledNumberFilter}
          onChange={(e) => setCalledNumberFilter(e.target.value)}
          size="sm"
        />
      </div>
    ),
    [calledNumberFilter],
  );

  const userDropdownContent = useMemo(
    () => (
      <div style={{ minWidth: '180px' }}>
        <Form.Control
          type="text"
          placeholder="User ID"
          value={userIdFilter}
          onChange={(e) => setUserIdFilter(e.target.value)}
          size="sm"
        />
      </div>
    ),
    [userIdFilter],
  );

  const dateFromDropdownContent = useMemo(
    () => (
      <div style={{ minWidth: '220px' }}>
        <Form.Control
          type="datetime-local"
          value={dateFromFilter}
          onChange={(e) => setDateFromFilter(e.target.value)}
          size="sm"
        />
      </div>
    ),
    [dateFromFilter],
  );

  const dateToDropdownContent = useMemo(
    () => (
      <div style={{ minWidth: '220px' }}>
        <Form.Control
          type="datetime-local"
          value={dateToFilter}
          onChange={(e) => setDateToFilter(e.target.value)}
          size="sm"
        />
      </div>
    ),
    [dateToFilter],
  );

  const clearAppliedFilter = useCallback(
    (key: keyof typeof appliedFilters) => {
      setAppliedFilters((prev) => ({ ...prev, [key]: '' }));
      setCurrentPage(1);
    },
    [setAppliedFilters, setCurrentPage],
  );

  const makeFilterPill = useCallback(
    (
      id: string,
      label: string,
      key: keyof typeof appliedFilters,
      options?: {
        dropdownContent?: React.ReactNode;
        dropdownOptions?: FilterPill["dropdownOptions"];
        searchable?: boolean;
        activeLabel?: string;
        onClearExtra?: () => void;
      },
    ): FilterPill => {
      const appliedValue = appliedFilters[key];
      const clearHandler = appliedValue
        ? () => {
            options?.onClearExtra?.();
            clearAppliedFilter(key);
          }
        : undefined;
      return {
        id,
        label,
        showDropdown: true,
        ...(options?.searchable ? { searchable: true } : {}),
        active: Boolean(appliedValue),
        activeLabel: options?.activeLabel ?? (appliedValue || undefined),
        onClear: clearHandler,
        ...(options?.dropdownContent ? { dropdownContent: options.dropdownContent } : {}),
        ...(options?.dropdownOptions ? { dropdownOptions: options.dropdownOptions } : {}),
      };
    },
    [appliedFilters, clearAppliedFilter],
  );

  const filterPills = useMemo<FilterPill[]>(
    () => [
      makeFilterPill('cdr-calling', 'Calling #', 'calling_number', {
        dropdownContent: callingDropdownContent,
        onClearExtra: () => setCallingNumberFilter(''),
      }),
      makeFilterPill('cdr-called', 'Called #', 'called_number', {
        dropdownContent: calledDropdownContent,
        onClearExtra: () => setCalledNumberFilter(''),
      }),
      makeFilterPill('cdr-user', 'User', 'user_id', {
        dropdownContent: userDropdownContent,
        onClearExtra: () => setUserIdFilter(''),
      }),
      makeFilterPill('cdr-repetition', 'Repetition', 'call_repetition_status', {
        dropdownOptions: repetitionFilterOptions,
        onClearExtra: () => setRepetitionStatusFilter(''),
      }),
      makeFilterPill('cdr-local-dnd', 'Local DND', 'local_dnd_status', {
        dropdownOptions: localDndFilterOptions,
        onClearExtra: () => setLocalDndStatusFilter(''),
      }),
      makeFilterPill(
        'cdr-dncr',
        'DNCR API',
        'dncr_api_status',
        {
          dropdownOptions: dncrApiFilterOptions,
          searchable: true,
          activeLabel: appliedFilters.dncr_api_status
            ? dncrApiStatusLabels[appliedFilters.dncr_api_status] || appliedFilters.dncr_api_status
            : undefined,
          onClearExtra: () => setDncrApiStatusFilter(''),
        },
      ),
      makeFilterPill('cdr-date-from', 'Date From', 'date_from', {
        dropdownContent: dateFromDropdownContent,
        onClearExtra: () => setDateFromFilter(''),
      }),
      makeFilterPill('cdr-date-to', 'Date To', 'date_to', {
        dropdownContent: dateToDropdownContent,
        onClearExtra: () => setDateToFilter(''),
      }),
    ],
    [
      appliedFilters,
      makeFilterPill,
      callingDropdownContent,
      calledDropdownContent,
      userDropdownContent,
      dateFromDropdownContent,
      dateToDropdownContent,
      repetitionFilterOptions,
      localDndFilterOptions,
      dncrApiFilterOptions,
      dncrApiStatusLabels,
    ],
  );

  const toolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchQuery,
      searchPlaceholder: 'Search (across all fields)',
      onSearchChange: setSearchQuery,
      onSearch: handleApplyFilters,
      showFilterPills: true,
      filterPills,
      showMoreFiltersButton: false,
      customActions: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="light"
            onClick={handleResetFilters}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              color: '#212529',
              height: '33px',
              fontSize: '0.875rem',
              padding: '0 12px',
            }}
          >
            Reset
          </Button>
          <Button
            onClick={handleApplyFilters}
            style={{
              backgroundColor: '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              height: '33px',
              fontSize: '0.875rem',
              padding: '0 12px',
            }}
          >
            Apply Filters
          </Button>
        </div>
      ),
    }),
    [searchQuery, filterPills],
  );

  const cdrColumns = useMemo<TableColumn<MappedCDRRecord>[]>(
    () => [
      { key: 'id', label: 'ID', type: 'text', sortable: false },
      { key: 'dateTime', label: 'DATE/TIME', type: 'text', sortable: false },
      {
        key: 'calling',
        label: 'CALLING #',
        type: 'custom',
        sortable: false,
        render: (row) => <PhoneContainer phone={row.calling} />,
      },
      {
        key: 'called',
        label: 'CALLED #',
        type: 'custom',
        sortable: false,
        render: (row) => <PhoneContainer phone={row.called} />,
      },
      { key: 'userId', label: 'USER ID', type: 'text', sortable: false },
      {
        key: 'localDND',
        label: 'LOCAL DND',
        type: 'custom',
        sortable: false,
        render: (row) => {
          const tone = getTriStateTone(row.localDND, 'Allowed', 'Not Checked');
          return (
            <span
              style={{
                color: tone.color,
                backgroundColor: tone.backgroundColor,
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              {row.localDND}
            </span>
          );
        },
      },
      {
        key: 'repetition',
        label: 'REPETITION',
        type: 'custom',
        sortable: false,
        render: (row) => {
          const tone = getTriStateTone(row.repetition, 'Allowed', 'Not Checked');
          return (
            <span
              style={{
                color: tone.color,
                backgroundColor: tone.backgroundColor,
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              {row.repetition}
            </span>
          );
        },
      },
      {
        key: 'dncrApi',
        label: 'DNCR API',
        type: 'custom',
        sortable: false,
        render: (row) => {
          const tone = getDncrTone(row.dncrApi);
          return (
            <span
              style={{
                color: tone.color,
                backgroundColor: tone.backgroundColor,
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              {row.dncrApi}
            </span>
          );
        },
      },
      { key: 'time', label: 'TIME (MS)', type: 'text', sortable: false },
      { key: 'allowLocalDNCL', label: 'ALLOW LOCAL DNCL', type: 'text', sortable: false },
      { key: 'allowApiDNCLCalls', label: 'ALLOW API DNCL', type: 'text', sortable: false },
      { key: 'allowRepetition', label: 'ALLOW REPETITIVE', type: 'text', sortable: false },
    ],
    [],
  );


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="CDR Records" />

      
        {/* Header */}
        <div className="mb-4">
          <h4 style={{ color: '#212529', fontWeight: '600' }}>
            CDR Records <span style={{ color: '#6c757d' }}>— Compliance Checks</span>
          </h4>
        </div>

        {/* Stats Cards Row */}
        <Row className="g-3 mb-4">
          <Col >
          <style>{`
      .stat-card-responsive {
        min-height: auto;
      }

      /* Desktop and up */
@media (min-width: 992px) { /* lg breakpoint */
  .stat-card-responsive {
    min-height: 195px; /* adjust as needed */
  }
}
      `}</style>
            <StatCard
              icon={<TrendingUp size={20} />}
              title="Total Records"
              value={stats.totalRecords.toLocaleString()}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              }
            />
          </Col>
          <Col >
            <MetricCard
              icon={<Shield size={20} />}
              title="Local DND"
              items={[
                { 
                  label: 'Not Checked', 
                  value: stats.localDNDNotChecked || 0,
                  color: '#212529' 
                },
                { 
                  label: 'Allowed', 
                  value: stats.localDNDAllowed || 0,
                  color: '#10b981' 
                },
                { 
                  label: 'Blocked', 
                  value: stats.localDNDBlocked || 0,
                  color: '#ef4444' 
                }
              ]}
              bgGradient="linear-gradient(135deg, #ffffff 0%, #fff5f0 100%)"
            />
          </Col>
          <Col >
            <MetricCard
              icon={<RefreshCw size={20} />}
              title="Repetition"
              items={[
                { 
                  label: 'Allowed', 
                  value: stats.repetitionAllowed || 0,
                  color: '#10b981' 
                },
                { 
                  label: 'Blocked', 
                  value: stats.repetitionNotAllowed || 0,
                  color: '#ef4444' 
                },
                { 
                  label: 'Not Checked', 
                  value: stats.repetitionNotChecked || 0,
                  color: '#6c757d' 
                }
              ]}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={repetitionData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2}>
                      {repetitionData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              }
            />
          </Col>
          <Col >
            <MetricCard
              icon={<XCircle size={20} />}
              title="DNCR API"
              items={[
                { 
                  label: 'Allowed', 
                  value: stats.dncrApiFalse || 0,
                  color: '#10b981' 
                },
                { 
                  label: 'Blocked', 
                  value: stats.dncrApiTrue || 0,
                  color: '#ef4444' 
                },
                { 
                  label: 'Not Checked', 
                  value: stats.dncrApiNotChecked || 0,
                  color: '#6c757d' 
                },
              ]}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dncApiTrendData}>
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              }
              bgGradient="linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)"
            />
          </Col>
          {/* <Col xs={12} sm={6} lg={2}>
            <MetricCard
              icon={<X size={20} />}
              title="Allow Local DNCL"
              items={[
                { 
                  label: 'TRUE', 
                  value: stats.totalRecords > 0 
                    ? `${Math.round((stats.allowLocalDNCLTrue / stats.totalRecords) * 100)}%` 
                    : '0%', 
                  color: '#212529' 
                }
              ]}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allowLocalDNCLData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2}>
                      {allowLocalDNCLData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              }
              bgGradient="linear-gradient(135deg, #ffffff 0%, #f5f0ff 100%)"
            />
          </Col> */}
          <Col >
            <MetricCard
              icon={<Clock size={20} />}
              title="Performance"
              items={[
                { 
                  label: 'Avg Time', 
                  value: `${(stats.avgTime || 0).toFixed(1)}ms`,
                  color: '#8b5cf6' 
                },
                { 
                  label: 'Min Time', 
                  value: `${(stats.minTime || 0).toFixed(1)}ms`,
                  color: '#10b981' 
                },
                { 
                  label: 'Max Time', 
                  value: `${(stats.maxTime || 0).toFixed(1)}ms`,
                  color: '#ef4444' 
                }
              ]}
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={avgTimeTrendData}>
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              }
              bgGradient="linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"
            />
          </Col>
        </Row>

        <div className="mb-3" />

        {/* Active Filters Display */}
        {(appliedFilters.search || appliedFilters.calling_number || appliedFilters.called_number || 
          appliedFilters.user_id || appliedFilters.call_repetition_status || 
          appliedFilters.local_dnd_status || appliedFilters.dncr_api_status ||
          appliedFilters.date_from || appliedFilters.date_to) && (
          <div className="mb-3 px-2">
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>Active Filters:</span>
              {appliedFilters.search && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Search: {appliedFilters.search}
                </span>
              )}
              {appliedFilters.calling_number && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Calling: {appliedFilters.calling_number}
                </span>
              )}
              {appliedFilters.called_number && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Called: {appliedFilters.called_number}
                </span>
              )}
              {appliedFilters.user_id && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  User: {appliedFilters.user_id}
                </span>
              )}
              {appliedFilters.call_repetition_status && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Repetition: {appliedFilters.call_repetition_status}
                </span>
              )}
              {appliedFilters.local_dnd_status && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  Local DND: {appliedFilters.local_dnd_status}
                </span>
              )}
              {appliedFilters.dncr_api_status && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  DNCR API: {dncrApiStatusLabels[appliedFilters.dncr_api_status] || appliedFilters.dncr_api_status}
                </span>
              )}
              {appliedFilters.date_from && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  From: {appliedFilters.date_from}
                </span>
              )}
              {appliedFilters.date_to && (
                <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  To: {appliedFilters.date_to}
                </span>
              )}
            </div>
          </div>
        )}

        <GenericTable<MappedCDRRecord>
          data={mappedData}
          columns={cdrColumns}
          loading={loading}
          loadingMessage="Loading CDR records..."
          emptyMessage={error ? <span style={{ color: '#dc3545' }}>{error}</span> : 'No records found matching your filters'}
          uniqueKey="id"
          pagination={{
            currentPage,
            rowsPerPage: recordsPerPage,
            totalRows: totalRecords,
            pageSizeOptions: [25, 50, 100],
          }}
          onPaginationChange={(page, rowsPerPageValue) => {
            if (rowsPerPageValue !== recordsPerPage) {
              handleRecordsPerPageChange(rowsPerPageValue);
              return;
            }
            setCurrentPage(page);
          }}
          showToolbar={true}
          toolbar={toolbarConfig}
          showToolbarActions={false}
          showActions={false}
        />

    </React.Fragment>
  );
};

CDRRecords.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CDRRecords;
