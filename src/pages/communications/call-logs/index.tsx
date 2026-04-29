import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";

import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import { ListCallLogs, DownloadCallsExport } from "@utils/calls";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import {
  Phone,
  Hash,
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
} from "lucide-react";
import moment from "moment";

import "@assets/scss/common.scss";

import {
  convertUTCSeparateDateTimeToUserTime,
  convertUTCSeparateDateTimeToUserDate,
  formatDuration,
  GlobalDateFormat,
  GlobalTimeFormat,
  formatDateTimeToLocal,
  GlobalDateTimeFormat,
  ModuleSlug,
  getAutoTimezone,
} from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { isExactPhoneMatch, normalizePhoneValue } from "@utils/phoneMatch";
import {
  formatDateTimeFilterForApi,
  formatFilterDateTimeLabel,
  getDefaultCommunicationsDateFilterPair,
  shouldSkipCommunicationsListFetch,
} from "@utils/communicationsDateUtils";
import {
  buildDateTimeFilterPill,
  buildCallDirectionFilterPill,
  buildCallStatusFilterPill,
  buildDepartmentFilterPill,
  buildExtensionMultiSelectFilterPill,
  buildTextDropdownFilterPill,
} from "@utils/communicationsFilterPills";
import {
  createDateTimeDropdownContent,
  createTextFilterDropdownContent,
} from "@utils/communicationsFilterDropdowns";
import {
  renderApplyResetFilterActions,
  useStagedFiltersActions,
} from "@utils/communicationsStagedFilters";

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
function normalizeCallLogRow(
  row: CallLogRow & Record<string, unknown>,
): CallLogRow {
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
      (row.phone as string) ??
      (row.number as string) ??
      (row.PhoneNumber as string) ??
      next.phone_number;
  }
  if (typeof next.is_answered === "boolean") {
    next.is_answered = next.is_answered ? "Yes" : "No";
  }

  if (next.Date && next.Time) return next;

  const isoCandidate =
    (row.call_datetime as string) ??
    (row.start_time as string) ??
    (row.call_date_time as string) ??
    (row.datetime as string) ??
    (row.created_at as string);
  if (typeof isoCandidate === "string" && isoCandidate.includes("T")) {
    const m = moment.utc(isoCandidate);
    if (m.isValid()) {
      next.Date = m.format("YYYY-MM-DD");
      next.Time = m.format("HH:mm:ss");
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


const CallLogs = () => {
  const { data: session } = useSession();
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [showDateRange, setShowDateRange] = useState(false);
  const [startDateTime, setStartDateTime] = useState<string>("");
  const [endDateTime, setEndDateTime] = useState<string>("");

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
      key: "Date",
      label: "Date",
      sortable: true,
      render: (row) =>
        convertUTCSeparateDateTimeToUserDate(
          row.Date ?? "",
          row.Time ?? "",
          GlobalDateFormat,
        ),
    },
    {
      key: "Time",
      label: "Time",
      sortable: true,
      render: (row) =>
        convertUTCSeparateDateTimeToUserTime(
          row.Date ?? "",
          row.Time ?? "",
          GlobalTimeFormat,
        ),
    },
    { key: "username", label: "Username", sortable: true },
    { key: "department_name", label: "Department", sortable: true },
    { key: "call_type", label: "Call Type", sortable: true },
    {
      key: "is_answered",
      label: "Call Result",
      sortable: true,
      render: (row) =>
        row.is_answered === "Yes" ? (
          <span className="status-badge success">Answered</span>
        ) : (
          <span className="status-badge danger">Not Answered</span>
        ),
    },
    {
      key: "duration",
      label: "Duration",
      sortable: true,
      render: (row) =>
        formatDuration(Number.parseInt(String(row.duration), 10) || 0),
    },
    { key: "extension", label: "Extension", sortable: true },
    { key: "phone_number", label: "Phone Number", sortable: true },
  ];

  const [refreshKey, setRefreshKey] = useState<number>(0);

  const defaultFilters = getDefaultCommunicationsDateFilterPair(
    "start_datetime",
    "end_datetime",
  );
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(
    defaultFilters.current,
  );
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>(
    defaultFilters.applied,
  );
  const [searchValue, setSearchValue] = useState<string>("");

  // Refs to prevent duplicate API calls
  const appliedFiltersRef = useRef<Record<string, any>>(defaultFilters.applied);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const lastFetchParamsRef = useRef<string>("");
  const rowsPerPageRef = useRef(15);

  const [summary, setSummary] = useState<Summary>({
    users: 0,
    totalCalls: 0,
    extensions: 0,
    inbound: 0,
    outbound: 0,
  });

  const { hierarchyDataExtensions, hierarchyDataDepartments } =
    useHierarchyData(ModuleSlug.CALL_LOGS);
  const selectedExtensionIds = useMemo<string[]>(
    () =>
      Array.isArray(currentFilters.extension_number)
        ? (currentFilters.extension_number as string[]).map(String)
        : [],
    [currentFilters.extension_number],
  );
  const extensionOptionsSelectedFirst = useMemo(
    () =>
      [...hierarchyDataExtensions].sort((a: any, b: any) => {
        const aSelected = selectedExtensionIds.includes(String(a.id));
        const bSelected = selectedExtensionIds.includes(String(b.id));
        if (aSelected === bSelected) return 0;
        return aSelected ? -1 : 1;
      }),
    [hierarchyDataExtensions, selectedExtensionIds],
  );

  const [totalCalls, setTotalCalls] = useState(0);
  // Stats cards data for StatsCards component
  const statsCardsData = [
    {
      title: "Total Calls",
      value: totalCalls || 0,
      icon: Phone,
      iconColor: "#3B82F6",
      iconBgColor: "#DBEAFE",
      subtitle: "Show total calls in the system",
    },
    {
      title: "Extensions",
      value: summary?.extensions || 0,
      icon: Hash,
      iconColor: "#8B5CF6",
      iconBgColor: "#EDE9FE",
      subtitle: "Show Extensions currently engaged or making calls",
    },
    {
      title: "Inbound",
      value: summary?.inbound || 0,
      icon: PhoneIncoming,
      iconColor: "#10B981",
      iconBgColor: "#D1FAE5",
      subtitle: "Total received call count",
    },
    {
      title: "Outbound",
      value: summary?.outbound || 0,
      icon: PhoneOutgoing,
      iconColor: "#0EA5E9",
      iconBgColor: "#E0F2FE",
      subtitle: "Total placed call count",
    },
  ];

  const [tableLoading, setTableLoading] = useState(false);

  const fetchCallLogs = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const now = Date.now();
      const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(appliedFiltersRef.current)}`;

      if (
        shouldSkipCommunicationsListFetch(
          isFetchingRef.current,
          paramsKey,
          lastFetchParamsRef.current,
          lastFetchTimeRef.current,
          now,
        )
      ) {
        return;
      }

      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      lastFetchParamsRef.current = paramsKey;

      setShowPageLoader(true);
      setTableLoading(true);
      try {
        const response = await ListCallLogs(
          {
            page,
            perPage,
            search,
            filters: appliedFiltersRef.current,
            moduleSlug: ModuleSlug.CALL_LOGS,
          },
          "call-logs/list",
        );

        let rowsArray: CallLogRow[] = extractCallLogRows(response).map((r) =>
          normalizeCallLogRow(r as CallLogRow & Record<string, unknown>),
        );

        const exactPhoneFilter = normalizePhoneValue(
          appliedFiltersRef.current?.phone_number,
        );
        if (exactPhoneFilter) {
          rowsArray = rowsArray.filter((row) =>
            isExactPhoneMatch(row.phone_number, exactPhoneFilter),
          );
        }

        const rawData = response?.data;
        const paginationData =
          response?.data?.pagination ?? response?.pagination ?? response;
        const total =
          response?.recordsTotal ??
          response?.total ??
          rawData?.recordsTotal ??
          rawData?.total ??
          paginationData?.total ??
          Math.max(rowsArray.length, 0);
        const currentPage =
          response?.current_page ?? paginationData?.current_page ?? page;
        const perPageVal =
          response?.per_page ?? paginationData?.per_page ?? perPage;

        setCallLogData(rowsArray);
        setTablePagination((prev) => ({
          ...prev,
          currentPage,
          rowsPerPage: perPageVal,
          totalRows: Number(total) || 0,
        }));
        setTotalCalls(total);

        if (response?.summary) {
          const selectedExtensionFilter = Array.isArray(
            appliedFiltersRef.current?.extension_number,
          )
            ? (appliedFiltersRef.current.extension_number as string[])
            : [];
          setShowDateRange(true);
          const dataFilters = response?.filters;
          setStartDateTime(dataFilters?.start_datetime);
          setEndDateTime(dataFilters?.end_datetime);
          let extensionsMetric = response.summary.extensions;
          if (rowsArray.length === 0) {
            extensionsMetric = 0;
          } else if (selectedExtensionFilter.length > 0) {
            extensionsMetric = selectedExtensionFilter.length;
          }
          setSummary({
            ...response.summary,
            // Keep metrics aligned with visible results.
            extensions: extensionsMetric,
          });
        }

        return response;
      } finally {
        setShowPageLoader(false);
        setTableLoading(false);
        isFetchingRef.current = false;
      }
    },
    [],
  );

  rowsPerPageRef.current = tablePagination.rowsPerPage;

  // Initial load and refetch when filters/refresh change
  useEffect(() => {
    setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchCallLogs(1, rowsPerPageRef.current, searchValue.trim());
  }, [refreshKey, fetchCallLogs]);

  const handleFiltersChange = useCallback((filters: any) => {
    // Format datetime values to include seconds and timezone offset (remove timezone key)
    const formattedFilters: any = { ...filters };

    const normalizedPhoneNumber = normalizePhoneValue(
      formattedFilters.phone_number,
    );
    formattedFilters.phone_number = normalizedPhoneNumber;
    if (normalizedPhoneNumber) {
      // Keep existing key and also pass explicit exact-match key when backend supports it.
      formattedFilters.phone_number_exact = normalizedPhoneNumber;
    } else {
      delete formattedFilters.phone_number_exact;
    }

    if (formattedFilters.start_datetime) {
      formattedFilters.start_datetime = formatDateTimeFilterForApi(
        String(formattedFilters.start_datetime),
        false,
      );
    }

    if (formattedFilters.end_datetime) {
      formattedFilters.end_datetime = formatDateTimeFilterForApi(
        String(formattedFilters.end_datetime),
        true,
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
        timezone: getAutoTimezone(),
      };
      await DownloadCallsExport(exportPayload, "call-logs/analytics/download");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const stageFilters = useCallback((nextFilters: Record<string, any>) => {
    setCurrentFilters(nextFilters);
  }, []);

  const {
    handleApplyFiltersClick,
    handleResetFiltersClick,
    hasUnappliedFilterChanges,
    hasNonDefaultFilters,
  } = useStagedFiltersActions(
    currentFilters,
    appliedFilters,
    defaultFilters.current,
    setCurrentFilters,
    handleFiltersChange,
  );

  const tableToolbar = useMemo<any>(() => {
    return {
      showTabs: true,
      tabs: [
        {
          id: "call-logs-title",
          label: "Call Logs",
          removable: false,
        },
      ],
      activeTab: "call-logs-title",
      onTabChange: () => {},
      showSearch: true,
      searchValue,
      searchPlaceholder: "Search by username, extension, phone...",
      onSearchChange: (value: string) => setSearchValue(value),
      onSearch: () => {
        setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
        fetchCallLogs(1, tablePagination.rowsPerPage, searchValue.trim());
      },
      showFiltersButton: true,
      showExportButton:
        session?.user?.permissions?.includes("export-call-logs"),
      onExportClick: () => handleExport(),
      showFilterPills: true,
      showMoreFiltersButton: false,
      filterPills: [
        buildCallDirectionFilterPill(currentFilters, stageFilters),
        buildCallStatusFilterPill(currentFilters, stageFilters),
        {
          id: "traffic_type",
          label: "Traffic Type",
          showDropdown: true,
          active: Boolean(currentFilters.traffic_type),
          activeLabel: currentFilters.traffic_type || undefined,
          onClear: () => stageFilters({ ...currentFilters, traffic_type: "" }),
          dropdownOptions: [
            {
              label: "Internal",
              value: "internal",
              onClick: () =>
                stageFilters({ ...currentFilters, traffic_type: "internal" }),
            },
            {
              label: "External",
              value: "external",
              onClick: () =>
                stageFilters({ ...currentFilters, traffic_type: "external" }),
            },
            {
              label: "All",
              value: "",
              onClick: () =>
                stageFilters({ ...currentFilters, traffic_type: "" }),
            },
          ],
        },
        {
          id: "destination_type",
          label: "Destination Type",
          showDropdown: true,
          active: Boolean(currentFilters.destination_type),
          activeLabel: currentFilters.destination_type || undefined,
          onClear: () =>
            stageFilters({ ...currentFilters, destination_type: "" }),
          dropdownOptions: [
            {
              label: "Local",
              value: "local",
              onClick: () =>
                stageFilters({ ...currentFilters, destination_type: "local" }),
            },
            {
              label: "National",
              value: "national",
              onClick: () =>
                stageFilters({
                  ...currentFilters,
                  destination_type: "national",
                }),
            },
            {
              label: "International",
              value: "international",
              onClick: () =>
                stageFilters({
                  ...currentFilters,
                  destination_type: "international",
                }),
            },
            {
              label: "All",
              value: "",
              onClick: () =>
                stageFilters({ ...currentFilters, destination_type: "" }),
            },
          ],
        },
        buildExtensionMultiSelectFilterPill(
          extensionOptionsSelectedFirst,
          currentFilters,
          stageFilters,
        ),
        buildDepartmentFilterPill(
          hierarchyDataDepartments as any[],
          currentFilters,
          stageFilters,
        ),
        buildTextDropdownFilterPill(
          "phone_number",
          "Numbers",
          currentFilters,
          setCurrentFilters,
          stageFilters,
          createTextFilterDropdownContent,
          "Enter number",
        ),
        buildDateTimeFilterPill(
          "start_datetime",
          "Start Date & Time",
          currentFilters,
          setCurrentFilters,
          stageFilters,
          formatFilterDateTimeLabel,
          createDateTimeDropdownContent,
        ),
        buildDateTimeFilterPill(
          "end_datetime",
          "End Date & Time",
          currentFilters,
          setCurrentFilters,
          stageFilters,
          formatFilterDateTimeLabel,
          createDateTimeDropdownContent,
        ),
      ],
      filterPillsRightActions: renderApplyResetFilterActions(
        hasNonDefaultFilters,
        hasUnappliedFilterChanges,
        handleResetFiltersClick,
        handleApplyFiltersClick,
        "call-logs",
      ),
    };
  }, [
    searchValue,
    tablePagination.rowsPerPage,
    fetchCallLogs,
    currentFilters,
    hierarchyDataExtensions,
    extensionOptionsSelectedFirst,
    hierarchyDataDepartments,
    session?.user?.permissions,
    isExporting,
    stageFilters,
    handleExport,
    handleApplyFiltersClick,
    handleResetFiltersClick,
    hasUnappliedFilterChanges,
    hasNonDefaultFilters,
  ]);

  return (
    <div className="call-logs-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `.call-logs-page .gt-toolbar-tabs-section .gt-tab-button { margin-left: 12px; }`,
        }}
      />
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Call Logs"
        showPageLoader={showPageLoader}
      />

      {showDateRange &&
        startDateTime &&
        endDateTime &&
        moment.utc(startDateTime).isValid() &&
        moment.utc(endDateTime).isValid() && (
          <div
            className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: "#eef2ff",
                  color: "#4f46e5",
                }}
              >
                <Calendar size={16} />
              </span>
              <div className="d-flex align-items-center gap-2">
                <span
                  className="text-muted"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                  }}
                >
                  Selected Date Range
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)} —{" "}
                  {formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}
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

      {session?.user?.permissions?.includes("list-call-logs") && (
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
            setTablePagination((prev) => ({
              ...prev,
              currentPage: page,
              rowsPerPage,
            }));
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
