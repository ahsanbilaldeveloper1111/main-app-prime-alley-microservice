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
import { Form, Button } from "react-bootstrap";
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

interface NumberFilterMenuProps {
  value: string;
  onChange: (value: string) => void;
  onApply: (value: string) => void;
  closeMenu: () => void;
}

const NumberFilterMenu: React.FC<NumberFilterMenuProps> = ({
  value,
  onChange,
  onApply,
  closeMenu,
}) => (
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

const DateFilterMenu: React.FC<DateFilterMenuProps> = ({
  value,
  onChange,
  onApply,
  closeMenu,
}) => (
  <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
    <Form.Control
      size="sm"
      type="datetime-local"
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
  return function NumberDropdownRender({
    closeMenu,
  }: {
    closeMenu: () => void;
  }) {
    return (
      <NumberFilterMenu
        value={value}
        onChange={onChange}
        onApply={onApply}
        closeMenu={closeMenu}
      />
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
      <DateFilterMenu
        value={value}
        onChange={onChange}
        onApply={onApply}
        closeMenu={closeMenu}
      />
    );
  };
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

  // Initialize filters with default values immediately to prevent first API call without dates
  const getDefaultFilters = () => {
    const now = moment();
    const startDateApi =
      now.clone().startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    const endDateApi =
      now.clone().endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    // UI filter state must include the same default date range as `applied`; otherwise any
    // pill change via `applyFilters({ ...currentFilters, ... })` drops start/end and breaks the API query.
    const startDateUi = now.clone().startOf("day").format("YYYY-MM-DDTHH:mm");
    const endDateUi = now.clone().endOf("day").format("YYYY-MM-DDTHH:mm");
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
        isFetchingRef.current &&
        lastFetchParamsRef.current === paramsKey &&
        now - lastFetchTimeRef.current < 500
      ) {
        return;
      }
      if (
        lastFetchParamsRef.current === paramsKey &&
        now - lastFetchTimeRef.current < 100
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
    },
    [],
  );

  rowsPerPageRef.current = tablePagination.rowsPerPage;

  // Initial load and refetch when filters/refresh change
  useEffect(() => {
    setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchCallLogs(1, rowsPerPageRef.current, "");
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
      // datetime-local returns YYYY-MM-DDTHH:mm format, convert to YYYY-MM-DDTHH:mm:ss with timezone offset
      let startMoment = moment(formattedFilters.start_datetime);

      if (
        formattedFilters.start_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
      ) {
        // Format is YYYY-MM-DDTHH:mm, add :00 seconds
        startMoment = moment(formattedFilters.start_datetime + ":00");
      } else if (!formattedFilters.start_datetime.includes("T")) {
        // If only date, set to 00:00:00
        startMoment = moment(formattedFilters.start_datetime).startOf("day");
      }

      // Convert to UTC
      formattedFilters.start_datetime =
        startMoment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    }

    if (formattedFilters.end_datetime) {
      // datetime-local returns YYYY-MM-DDTHH:mm format, convert to YYYY-MM-DDTHH:mm:ss with timezone offset
      let endMoment = moment(formattedFilters.end_datetime);

      if (
        formattedFilters.end_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
      ) {
        // Format is YYYY-MM-DDTHH:mm, check if it's 23:59, otherwise add :00
        const timePart = formattedFilters.end_datetime.split("T")[1];
        if (timePart === "23:59") {
          endMoment = moment(formattedFilters.end_datetime + ":59");
        } else {
          endMoment = moment(formattedFilters.end_datetime + ":00");
        }
      } else if (!formattedFilters.end_datetime.includes("T")) {
        // If only date, set to 23:59:59
        endMoment = moment(formattedFilters.end_datetime).endOf("day");
      }

      // Convert to UTC
      formattedFilters.end_datetime =
        endMoment.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
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

  const handleApplyFiltersClick = useCallback(() => {
    handleFiltersChange(currentFilters);
  }, [handleFiltersChange, currentFilters]);

  const handleResetFiltersClick = useCallback(() => {
    setCurrentFilters(defaultFilters.current);
    handleFiltersChange(defaultFilters.current);
  }, [defaultFilters.current, handleFiltersChange]);

  const hasUnappliedFilterChanges = useMemo(
    () => JSON.stringify(currentFilters) !== JSON.stringify(appliedFilters),
    [currentFilters, appliedFilters],
  );

  const hasNonDefaultFilters = useMemo(
    () =>
      JSON.stringify(currentFilters) !== JSON.stringify(defaultFilters.current),
    [currentFilters, defaultFilters.current],
  );

  const extensionAllIds = useMemo(
    () => hierarchyDataExtensions.map((ext: any) => String(ext.id)),
    [hierarchyDataExtensions],
  );
  const selectedExtensionIds = useMemo(
    () =>
      Array.isArray(currentFilters.extension_number)
        ? (currentFilters.extension_number as string[])
        : [],
    [currentFilters.extension_number],
  );
  const areAllExtensionsSelected = useMemo(
    () =>
      extensionAllIds.length > 0 &&
      selectedExtensionIds.length === extensionAllIds.length,
    [extensionAllIds, selectedExtensionIds],
  );
  const callDirectionActiveLabel = useMemo(() => {
    const value = String(currentFilters.call_direction ?? "");
    if (value === "OUTGOING") return "Outgoing";
    if (value === "INCOMING") return "Incoming";
    if (value === "Both") return "Both";
    return undefined;
  }, [currentFilters.call_direction]);
  const toggleExtensionId = useCallback(
    (idVal: string) => {
      const next = selectedExtensionIds.includes(idVal)
        ? selectedExtensionIds.filter((v) => v !== idVal)
        : [...selectedExtensionIds, idVal];
      stageFilters({ ...currentFilters, extension_number: next });
    },
    [currentFilters, selectedExtensionIds, stageFilters],
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
        {
          id: "call_direction",
          label: "Call Direction",
          showDropdown: true,
          active: Boolean(currentFilters.call_direction),
          activeLabel: callDirectionActiveLabel,
          onClear: () =>
            stageFilters({ ...currentFilters, call_direction: "" }),
          dropdownOptions: [
            {
              label: "Outgoing",
              value: "OUTGOING",
              onClick: () =>
                stageFilters({ ...currentFilters, call_direction: "OUTGOING" }),
            },
            {
              label: "Incoming",
              value: "INCOMING",
              onClick: () =>
                stageFilters({ ...currentFilters, call_direction: "INCOMING" }),
            },
            {
              label: "Both",
              value: "Both",
              onClick: () =>
                stageFilters({ ...currentFilters, call_direction: "Both" }),
            },
          ],
        },
        {
          id: "call_status",
          label: "Call Status",
          showDropdown: true,
          active: Boolean(currentFilters.call_status),
          activeLabel: currentFilters.call_status || undefined,
          onClear: () => stageFilters({ ...currentFilters, call_status: "" }),
          dropdownOptions: [
            {
              label: "Answered",
              value: "Answered",
              onClick: () =>
                stageFilters({ ...currentFilters, call_status: "Answered" }),
            },
            {
              label: "Not Answered",
              value: "Not Answered",
              onClick: () =>
                stageFilters({
                  ...currentFilters,
                  call_status: "Not Answered",
                }),
            },
            {
              label: "Both",
              value: "Both",
              onClick: () =>
                stageFilters({ ...currentFilters, call_status: "Both" }),
            },
          ],
        },
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
        {
          id: "extension_number",
          label: "Extension",
          showDropdown: true,
          searchable: true,
          multiSelect: true,
          onSelectAll: () => {
            stageFilters({
              ...currentFilters,
              extension_number: areAllExtensionsSelected ? [] : extensionAllIds,
            });
          },
          selectAllLabel: areAllExtensionsSelected
            ? "Deselect all"
            : "Select all",
          active:
            Array.isArray(currentFilters.extension_number) &&
            currentFilters.extension_number.length > 0,
          activeLabel:
            Array.isArray(currentFilters.extension_number) &&
            currentFilters.extension_number.length > 0
              ? `${(currentFilters.extension_number as string[]).length} selected`
              : undefined,
          onClear: () =>
            stageFilters({ ...currentFilters, extension_number: [] }),
          dropdownOptions: hierarchyDataExtensions.map((ext: any) => {
            const idVal = String(ext.id);
            const isSelected = selectedExtensionIds.includes(idVal);
            return {
              label: String(ext.name ?? ext.id),
              value: idVal,
              selected: isSelected,
              onClick: () => toggleExtensionId(idVal),
            };
          }),
        },
        {
          id: "department",
          label: "Department",
          showDropdown: true,
          searchable: true,
          active:
            Array.isArray(currentFilters.department) &&
            currentFilters.department.length > 0,
          activeLabel:
            Array.isArray(currentFilters.department) &&
            currentFilters.department.length > 0
              ? `${(currentFilters.department as string[]).length} selected`
              : undefined,
          onClear: () => stageFilters({ ...currentFilters, department: [] }),
          dropdownOptions: hierarchyDataDepartments.map((dept: any) => {
            const idVal = String(dept.id);
            return {
              label: String(dept.name ?? dept.id),
              value: idVal,
              onClick: () =>
                stageFilters({ ...currentFilters, department: [idVal] }),
            };
          }),
        },
        {
          id: "phone_number",
          label: "Numbers",
          showDropdown: true,
          active: Boolean(currentFilters.phone_number),
          activeLabel: currentFilters.phone_number
            ? String(currentFilters.phone_number)
            : undefined,
          onClear: () => stageFilters({ ...currentFilters, phone_number: "" }),
          dropdownContent: createNumberDropdownContent(
            currentFilters.phone_number ?? "",
            (value: string) =>
              setCurrentFilters({ ...currentFilters, phone_number: value }),
            (value: string) =>
              stageFilters({ ...currentFilters, phone_number: value }),
          ),
        },
        {
          id: "start_datetime",
          label: "Start Date & Time",
          showDropdown: true,
          active: Boolean(currentFilters.start_datetime),
          activeLabel: currentFilters.start_datetime
            ? String(currentFilters.start_datetime)
            : undefined,
          activeLabelOnly: true,
          dropdownContent: createDateDropdownContent(
            currentFilters.start_datetime ?? "",
            (value: string) =>
              setCurrentFilters({ ...currentFilters, start_datetime: value }),
            (value: string) =>
              stageFilters({ ...currentFilters, start_datetime: value }),
          ),
        },
        {
          id: "end_datetime",
          label: "End Date & Time",
          showDropdown: true,
          active: Boolean(currentFilters.end_datetime),
          activeLabel: currentFilters.end_datetime
            ? String(currentFilters.end_datetime)
            : undefined,
          activeLabelOnly: true,
          dropdownContent: createDateDropdownContent(
            currentFilters.end_datetime ?? "",
            (value: string) =>
              setCurrentFilters({ ...currentFilters, end_datetime: value }),
            (value: string) =>
              stageFilters({ ...currentFilters, end_datetime: value }),
          ),
        },
      ],
      filterPillsRightActions: (
        <>
          {hasNonDefaultFilters && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleResetFiltersClick}
              className="call-logs-reset-filters-btn"
            >
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyFiltersClick}
            disabled={!hasUnappliedFilterChanges}
            className="call-logs-apply-filters-btn"
          >
            Apply Filters
          </Button>
        </>
      ),
    };
  }, [
    searchValue,
    tablePagination.rowsPerPage,
    fetchCallLogs,
    currentFilters,
    hierarchyDataExtensions,
    hierarchyDataDepartments,
    session?.user?.permissions,
    isExporting,
    stageFilters,
    handleExport,
    handleApplyFiltersClick,
    handleResetFiltersClick,
    hasUnappliedFilterChanges,
    hasNonDefaultFilters,
    callDirectionActiveLabel,
    extensionAllIds,
    areAllExtensionsSelected,
    selectedExtensionIds,
    toggleExtensionId,
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
