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
import GenericTable, {
  FilterPill,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import { StatsCardData } from "@components/GenericStatsCards";
import { ListCallLogs, DownloadCallsExport } from "@utils/calls";
import { Modal, Row, Tab, Tabs, Form, Button, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import ChartBar from "@components/ChartBar";
import ChartDonut from "@components/ChartDonut";
import "@assets/scss/report-style.scss";
import "@assets/scss/tabs.scss";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import {
  GlobalDateTimeFormat,
  formatDateTimeToLocal,
  ModuleSlug,
  getAutoTimezone,
  formatMinutesAndSeconds,
} from "@utils/Helper";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { canViewCallLogsFromSession } from "@utils/callPermissionUtils";
import { normalizeBarFiltersForApi } from "@page-modules/reports/call-analytics/callAnalyticsBarFilters";
import "@assets/scss/common.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

type ChartDataType = "calls" | "time" | "cost" | "custom";

interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration: number;
  avg_duration: number;
  avg_ring_time: number;
}

interface ChartData {
  country: string[];
  answered_calls: number[];
  unanswered_calls: number[];
  total_calls: number[];
  max_ring_time: number[];
  avg_ring_time: number[];
  min_ring_time: number[];
  min_cost: number[];
  avg_cost: number[];
  max_cost: number[];
  min_duration: number[];
  avg_duration: number[];
  max_duration: number[];
}

const donutDataLabelsFormatter = (value: number): string =>
  `${value.toFixed(0)}%`;

// ─── Date range pill menu component ────────────────────────────────────────
interface DateRangePillMenuProps {
  startVal: string;
  endVal: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onApply: () => void;
  closeMenu: () => void;
}

function DateRangePillMenu({
  startVal,
  endVal,
  onStartChange,
  onEndChange,
  onApply,
  closeMenu,
}: Readonly<DateRangePillMenuProps>) {
  return (
    <div className="d-flex flex-column gap-2" style={{ minWidth: 260 }}>
      <Form.Group>
        <Form.Label className="small mb-1">Start Date &amp; Time</Form.Label>
        <Form.Control
          size="sm"
          type="datetime-local"
          value={startVal}
          max={moment().format("YYYY-MM-DDTHH:mm")}
          onChange={(e) => {
            const v = e.target.value;
            onStartChange(v);
            if (endVal && moment(v).isAfter(moment(endVal))) {
              onEndChange(v);
            }
          }}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label className="small mb-1">End Date &amp; Time</Form.Label>
        <Form.Control
          size="sm"
          type="datetime-local"
          value={endVal}
          min={startVal}
          max={moment().format("YYYY-MM-DDTHH:mm")}
          onChange={(e) => {
            const v = e.target.value;
            onEndChange(v);
            if (startVal && moment(v).isBefore(moment(startVal))) {
              onStartChange(v);
            }
          }}
        />
      </Form.Group>
      <div className="d-flex justify-content-end gap-2">
        <Button variant="outline-secondary" size="sm" onClick={closeMenu}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            onApply();
            closeMenu();
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

function createDateRangeDropdownContent(
  startVal: string,
  endVal: string,
  onStartChange: (v: string) => void,
  onEndChange: (v: string) => void,
  onApply: () => void,
) {
  return function DateRangeRender({ closeMenu }: { closeMenu: () => void }) {
    return (
      <DateRangePillMenu
        startVal={startVal}
        endVal={endVal}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        onApply={onApply}
        closeMenu={closeMenu}
      />
    );
  };
}

// ─── Called numbers pill menu component ────────────────────────────────────
interface CalledNumbersPillMenuProps {
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  closeMenu: () => void;
}

function CalledNumbersPillMenu({
  value,
  onChange,
  onApply,
  closeMenu,
}: Readonly<CalledNumbersPillMenuProps>) {
  return (
    <div className="d-flex flex-column gap-2" style={{ minWidth: 260 }}>
      <Form.Control
        size="sm"
        type="text"
        placeholder="Enter numbers (comma separated)"
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
            onApply();
            closeMenu();
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

function createCalledNumbersDropdownContent(
  value: string,
  onChange: (v: string) => void,
  onApply: () => void,
) {
  return function CalledNumbersRender({
    closeMenu,
  }: {
    closeMenu: () => void;
  }) {
    return (
      <CalledNumbersPillMenu
        value={value}
        onChange={onChange}
        onApply={onApply}
        closeMenu={closeMenu}
      />
    );
  };
}

const CallStatsCountry = () => {
  const { data: session } = useSession();

  const [showDateRange, setShowDateRange] = useState(false);
  const [startDateTime, setStartDateTime] = useState<string>("");
  const [endDateTime, setEndDateTime] = useState<string>("");

  // ─── Pending filter state for pill dropdowns ───────────────────────────────
  const getDefaultFilters = () => {
    const now = moment();
    const startDateInput = now
      .clone()
      .startOf("day")
      .format("YYYY-MM-DDTHH:mm");
    const endDateInput = now.clone().endOf("day").format("YYYY-MM-DDTHH:mm");
    const startDateUTC =
      now.clone().startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    const endDateUTC =
      now.clone().endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    return {
      pending: {
        start_datetime: startDateInput,
        end_datetime: endDateInput,
      },
      current: {
        start_datetime: startDateUTC,
        end_datetime: endDateUTC,
      },
    };
  };

  const defaultFilters = getDefaultFilters();

  const [activeTab, setActiveTab] = useState("calls_chart");
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(
    defaultFilters.current,
  );
  const [dataLoaded, setDataLoaded] = useState(false);
  // Refs to prevent duplicate API calls
  const currentFiltersRef = useRef<Record<string, any>>(defaultFilters.current);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const lastFetchParamsRef = useRef<string>("");

  const { hierarchyDataExtensions, hierarchyDataDepartments } =
    useHierarchyData(ModuleSlug.CALL_REPORTS);

  // Use ref to track if initial fetch has been done
  const initialFetchDone = React.useRef(false);
  // Use ref to track last filters used for charts to prevent unnecessary refetches
  const lastChartFilters = React.useRef<string>("");
  const [summary, setSummary] = useState<Summary>({
    total_calls: 0,
    answered_calls: 0,
    unanswered_calls: 0,
    total_cost: 0,
    total_duration: 0,
    avg_duration: 0,
    avg_ring_time: 0,
  });

  const columns: TableColumn[] = [
    { key: "Country", label: "Country", sortable: true },
    { key: "Calls", label: "Total Calls", sortable: true },
    { key: "Answered", label: "Answered", sortable: true },
    { key: "Unanswered", label: "Un Answered", sortable: true },
    {
      key: "AvgRingTime",
      label: "Avg Ring Time",
      sortable: true,
      render: (row: any) => formatMinutesAndSeconds(row.AvgRingTime),
    },
    {
      key: "MaxRingTime",
      label: "Max Ring Time",
      sortable: true,
      render: (row: any) => formatMinutesAndSeconds(row.MaxRingTime),
    },
    {
      key: "Duration",
      label: "Total Duration",
      sortable: true,
      render: (row: any) => formatMinutesAndSeconds(row.Duration),
    },
    {
      key: "AvgDuration",
      label: "Avg Duration",
      sortable: true,
      render: (row: any) => formatMinutesAndSeconds(row.AvgDuration),
    },
  ];

  const [showPageLoader, setShowPageLoader] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [tableLoading, setTableLoading] = useState(false);

  const fetchCallLogs = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      // Prevent duplicate calls - but always allow the first call
      const now = Date.now();
      const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(currentFiltersRef.current)}`;

      // Skip if already fetching with same params within 500ms
      if (
        isFetchingRef.current &&
        lastFetchParamsRef.current === paramsKey &&
        now - lastFetchTimeRef.current < 500
      ) {
        return;
      }

      // Skip if same params were fetched recently (within 100ms) - but allow first call (when lastFetchParamsRef is empty string)
      if (
        lastFetchParamsRef.current !== "" &&
        lastFetchParamsRef.current === paramsKey &&
        now - lastFetchTimeRef.current < 100
      ) {
        return;
      }

      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      lastFetchParamsRef.current = paramsKey;

      setTableLoading(true);
      setShowPageLoader(true);

      try {
        const response = await ListCallLogs(
          {
            page,
            perPage,
            search,
            filters: currentFiltersRef.current,
            reportType: "statsCountry",
            moduleSlug: ModuleSlug.CALL_REPORTS,
          },
          "call-logs/statsByCountry",
        );

        if (response.summary) {
          setShowDateRange(true);
          const dataFilters = response.filters;
          setStartDateTime(dataFilters.start_datetime);
          setEndDateTime(dataFilters.end_datetime);
          setSummary(response.summary);
          setDataLoaded(true);
        } else {
          setDataLoaded(true);
        }

        setTableData(response.data || []);
        setTotalRows(response.total || 0);
        setCurrentPage(response.current_page || page);
        setRowsPerPage(response.per_page || perPage);

        return response;
      } catch {
        setDataLoaded(true);
        toast.error("Failed to fetch call data");
        return null;
      } finally {
        setShowPageLoader(false);
        setTableLoading(false);
        isFetchingRef.current = false;
      }
    },
    [],
  );

  const handleExport = async () => {
    try {
      const exportPayload = {
        ...currentFilters,
        timezone: getAutoTimezone(),
      };
      await DownloadCallsExport(
        exportPayload,
        "call-logs/report/country/download",
      );
    } catch (error: unknown) {
      console.error("Export error:", error);
      toast.error("Export failed");
    }
  };

  const handleFiltersChange = (filters: any) => {
    const formattedFilters = normalizeBarFiltersForApi(filters as Record<string, unknown>, {
      stripEmptyIncomingOnly: true,
    }) as Record<string, any>;

    // Update both state and ref immediately
    setCurrentFilters(formattedFilters);
    currentFiltersRef.current = formattedFilters;
    // Reset chart filters ref to allow chart refetch
    lastChartFilters.current = "";
  };

  // Ensure initial fetch happens when session is ready
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (canViewCallLogsFromSession(session)) {
      initialFetchDone.current = true;
      fetchCallLogs(1, rowsPerPage, "");
    }
  }, [session]);

  // Separate useEffect for chart data when filters change
  useEffect(() => {
    if (session && initialFetchDone.current) {
      // Check if filters have actually changed
      const currentFiltersString = JSON.stringify(currentFilters);
      const filtersChanged = lastChartFilters.current !== currentFiltersString;

      if (filtersChanged) {
        lastChartFilters.current = currentFiltersString;

        // Fetch chart data
        const fetchCharts = async () => {
          setChartLoading(true);
          try {
            const response = await ListCallLogs(
              {
                page: 1,
                perPage: 15,
                search: "",
                filters: currentFilters,
                reportType: "chartCountry",
                moduleSlug: ModuleSlug.CALL_REPORTS,
              },
              "call-logs/stats/country/chart",
            );

            const chartData = response.chart_data;

            if (chartData && Array.isArray(chartData) && chartData.length > 0) {
              const newChartData: ChartData = {
                country: [],
                answered_calls: [],
                unanswered_calls: [],
                total_calls: [],
                max_ring_time: [],
                avg_ring_time: [],
                min_ring_time: [],
                min_cost: [],
                avg_cost: [],
                max_cost: [],
                min_duration: [],
                avg_duration: [],
                max_duration: [],
              };

              chartData.forEach((item: any) => {
                if (item?.label) {
                  newChartData.country.push(item.label);
                  newChartData.answered_calls.push(
                    Number(item.answered_calls) || 0,
                  );
                  newChartData.unanswered_calls.push(
                    Number(item.unanswered_calls) || 0,
                  );
                  newChartData.total_calls.push(Number(item.total_calls) || 0);
                  newChartData.max_ring_time.push(
                    Number(item.max_ring_time) || 0,
                  );
                  newChartData.avg_ring_time.push(
                    Number(item.avg_ring_time) || 0,
                  );
                  newChartData.min_ring_time.push(
                    Number(item.min_ring_time) || 0,
                  );
                  newChartData.min_cost.push(Number(item.min_cost) || 0);
                  newChartData.avg_cost.push(Number(item.avg_cost) || 0);
                  newChartData.max_cost.push(Number(item.max_cost) || 0);
                  newChartData.min_duration.push(
                    Number(item.min_duration) || 0,
                  );
                  newChartData.avg_duration.push(
                    Number(item.avg_duration) || 0,
                  );
                  newChartData.max_duration.push(
                    Number(item.max_duration) || 0,
                  );
                }
              });

              const dataLength = newChartData.country.length;

              if (
                dataLength > 0 &&
                newChartData.answered_calls.length === dataLength &&
                newChartData.unanswered_calls.length === dataLength &&
                newChartData.total_calls.length === dataLength
              ) {
                // Calls Chart
                setChartCalls({
                  series: [
                    { name: "Total", data: newChartData.total_calls },
                    { name: "Answered", data: newChartData.answered_calls },
                    { name: "Unanswered", data: newChartData.unanswered_calls },
                  ],
                  categories: newChartData.country,
                });

                // Ring Time Chart
                setChartRingTime({
                  series: [
                    { name: "Max Ring Time", data: newChartData.max_ring_time },
                    { name: "Avg Ring Time", data: newChartData.avg_ring_time },
                    { name: "Min Ring Time", data: newChartData.min_ring_time },
                  ],
                  categories: newChartData.country,
                });

                // Duration Chart
                setChartDuration({
                  series: [
                    { name: "Max Duration", data: newChartData.max_duration },
                    { name: "Avg Duration", data: newChartData.avg_duration },
                    { name: "Min Duration", data: newChartData.min_duration },
                  ],
                  categories: newChartData.country,
                });
              } else {
                setChartCalls(null);
                setChartRingTime(null);
                setChartDuration(null);
              }
            } else {
              setChartCalls(null);
              setChartRingTime(null);
              setChartDuration(null);
            }
          } catch (error: unknown) {
            console.error("Error fetching chart data:", error);
            setChartCalls(null);
            setChartRingTime(null);
          } finally {
            setChartLoading(false);
          }
        };

        fetchCharts();
      }
    }
  }, [currentFilters, session]);

  const [simpleDonut, setSimpleDonut] = useState<{
    series: number[];
    labels: string[];
  } | null>(null);
  const [chartCalls, setChartCalls] = useState<{
    series: any[];
    categories: string[];
  } | null>(null);
  const [chartRingTime, setChartRingTime] = useState<{
    series: any[];
    categories: string[];
  } | null>(null);
  const [chartDuration, setChartDuration] = useState<{
    series: any[];
    categories: string[];
  } | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<{
    series: any[];
    categories: string[];
  } | null>(null);
  const [currentChartTitle, setCurrentChartTitle] = useState("");
  const [currentChartDataType, setCurrentChartDataType] =
    useState<ChartDataType>("custom");

  const handleOpenChartModal = (
    chartData: { series: any[]; categories: string[] } | null,
    title: string,
    dataType: ChartDataType,
  ) => {
    if (chartData) {
      setCurrentChartData(chartData);
      setCurrentChartTitle(title);
      setCurrentChartDataType(dataType);
      setShowChartModal(true);
    }
  };

  useEffect(() => {
    if (summary && dataLoaded) {
      const answeredCalls = Number(summary.answered_calls) || 0;
      const unansweredCalls = Number(summary.unanswered_calls) || 0;

      if (answeredCalls === 0 && unansweredCalls === 0) {
        setSimpleDonut(null);
      } else {
        setSimpleDonut({
          series: [answeredCalls, unansweredCalls],
          labels: ["Answered Calls", "Unanswered Calls"],
        });
      }
    }
  }, [summary, dataLoaded]);

  const [pendingStartDate, setPendingStartDate] = useState<string>(
    (currentFilters as any)?.start_datetime ||
      defaultFilters.pending.start_datetime,
  );
  const [pendingEndDate, setPendingEndDate] = useState<string>(
    (currentFilters as any)?.end_datetime ||
      defaultFilters.pending.end_datetime,
  );
  const [isDateRangeSet, setIsDateRangeSet] = useState(false);
  const [pendingCalledNumbers, setPendingCalledNumbers] = useState<string>("");

  // ─── Apply filters helper (used by pills) ─────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const applyFilters = useCallback(
    (updated: Record<string, any>) => {
      handleFiltersChange(updated);
      fetchCallLogs(1, rowsPerPage, "");
    },
    [handleFiltersChange, rowsPerPage, fetchCallLogs],
  );

  const toggleStringIdInFilter = useCallback(
    (key: "extension_number" | "department", id: string) => {
      const current: string[] = (currentFilters as any)?.[key] || [];
      const updated = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      applyFilters({ ...currentFilters, [key]: updated });
    },
    [currentFilters, applyFilters],
  );

  // ─── Stats cards ──────────────────────────────────────────────────────────
  const statsCardsData: StatsCardData[] = useMemo(() => {
    if (!dataLoaded) return [];
    return [
      {
        title: "Total Calls",
        value: summary.total_calls,
        subtitle: "Total number of calls",
      },
      {
        title: "Avg Ring Time",
        value: formatMinutesAndSeconds(summary.avg_ring_time),
        subtitle: "Average ring time per call",
      },
      {
        title: "Avg Duration",
        value: formatMinutesAndSeconds(summary.avg_duration),
        subtitle: "Average call duration",
      },
      {
        title: "Total Duration",
        value: formatMinutesAndSeconds(summary.total_duration),
        subtitle: "Total duration of calls",
      },
    ];
  }, [dataLoaded, summary]);

  // ─── Filter pills ─────────────────────────────────────────────────────────
  const directionLabel = useMemo(() => {
    const val = (currentFilters as any)?.is_incoming_only;
    if (val === "true") return "Incoming";
    if (val === "false") return "Outgoing";
    return undefined;
  }, [currentFilters]);

  const statusLabel = useMemo(() => {
    const val = (currentFilters as any)?.call_status;
    if (val === "Answered") return "Answered";
    if (val === "Not Answered") return "Not Answered";
    if (val === "Both") return "Both";
    return undefined;
  }, [currentFilters]);

  const trafficLabel = useMemo(() => {
    const val = (currentFilters as any)?.traffic_type;
    if (val === "internal") return "Internal";
    if (val === "external") return "External";
    return undefined;
  }, [currentFilters]);

  const destinationLabel = useMemo(() => {
    const val = (currentFilters as any)?.destination_type;
    if (val === "local") return "Local";
    if (val === "national") return "National";
    if (val === "international") return "International";
    return undefined;
  }, [currentFilters]);

  const dateRangeActiveLabel = useMemo(() => {
    const s = (currentFilters as any)?.start_datetime;
    const e = (currentFilters as any)?.end_datetime;
    if (s && e)
      return `${formatDateTimeToLocal(s, GlobalDateTimeFormat)} – ${formatDateTimeToLocal(e, GlobalDateTimeFormat)}`;
    if (s) return `From ${formatDateTimeToLocal(s, GlobalDateTimeFormat)}`;
    if (e) return `To ${formatDateTimeToLocal(e, GlobalDateTimeFormat)}`;
    return undefined;
  }, [currentFilters]);

  const extensionActiveLabel = useMemo(() => {
    const exts: string[] = (currentFilters as any)?.extension_number || [];
    if (exts.length === 0) return undefined;
    return `${exts.length} selected`;
  }, [currentFilters]);

  const departmentActiveLabel = useMemo(() => {
    const depts: string[] = (currentFilters as any)?.department || [];
    if (depts.length === 0) return undefined;
    return `${depts.length} selected`;
  }, [currentFilters]);

  const calledNumbersActiveLabel = useMemo(() => {
    const nums: string[] = (currentFilters as any)?.called_numbers || [];
    if (nums.length === 0) return undefined;
    return `${nums.length} number(s)`;
  }, [currentFilters]);

  const filterPills: FilterPill[] = useMemo(
    () => [
      {
        id: "date_range",
        label: "Date Range",
        showDropdown: true,
        active: isDateRangeSet,
        activeLabel: isDateRangeSet ? dateRangeActiveLabel : undefined,
        activeLabelOnly: true,
        onClear: () => {
          const freshDefaults = getDefaultFilters();
          setIsDateRangeSet(false);
          setPendingStartDate(freshDefaults.pending.start_datetime);
          setPendingEndDate(freshDefaults.pending.end_datetime);
          applyFilters({
            ...currentFilters,
            start_datetime: freshDefaults.current.start_datetime,
            end_datetime: freshDefaults.current.end_datetime,
          });
        },
        dropdownContent: createDateRangeDropdownContent(
          pendingStartDate,
          pendingEndDate,
          (v) => setPendingStartDate(v),
          (v) => setPendingEndDate(v),
          () => {
            setIsDateRangeSet(true);
            applyFilters({
              ...currentFilters,
              start_datetime: pendingStartDate,
              end_datetime: pendingEndDate,
            });
          },
        ),
      },
      {
        id: "direction",
        label: "Direction",
        showDropdown: true,
        active: Boolean((currentFilters as any)?.is_incoming_only),
        activeLabel: directionLabel,
        onClear: () => {
          const updated = { ...currentFilters };
          delete updated.is_incoming_only;
          applyFilters(updated);
        },
        dropdownOptions: [
          {
            label: "All",
            value: "",
            onClick: () => {
              const u = { ...currentFilters };
              delete u.is_incoming_only;
              applyFilters(u);
            },
          },
          {
            label: "Incoming",
            value: "true",
            onClick: () =>
              applyFilters({ ...currentFilters, is_incoming_only: "true" }),
          },
          {
            label: "Outgoing",
            value: "false",
            onClick: () =>
              applyFilters({ ...currentFilters, is_incoming_only: "false" }),
          },
        ],
      },
      {
        id: "call_status",
        label: "Call Status",
        showDropdown: true,
        active: Boolean((currentFilters as any)?.call_status),
        activeLabel: statusLabel,
        onClear: () => applyFilters({ ...currentFilters, call_status: "" }),
        dropdownOptions: [
          {
            label: "All",
            value: "",
            onClick: () => applyFilters({ ...currentFilters, call_status: "" }),
          },
          {
            label: "Answered",
            value: "Answered",
            onClick: () =>
              applyFilters({ ...currentFilters, call_status: "Answered" }),
          },
          {
            label: "Not Answered",
            value: "Not Answered",
            onClick: () =>
              applyFilters({ ...currentFilters, call_status: "Not Answered" }),
          },
          {
            label: "Both",
            value: "Both",
            onClick: () =>
              applyFilters({ ...currentFilters, call_status: "Both" }),
          },
        ],
      },
      {
        id: "traffic_type",
        label: "Traffic Type",
        showDropdown: true,
        active: Boolean((currentFilters as any)?.traffic_type),
        activeLabel: trafficLabel,
        onClear: () => applyFilters({ ...currentFilters, traffic_type: "" }),
        dropdownOptions: [
          {
            label: "All",
            value: "",
            onClick: () =>
              applyFilters({ ...currentFilters, traffic_type: "" }),
          },
          {
            label: "Internal",
            value: "internal",
            onClick: () =>
              applyFilters({ ...currentFilters, traffic_type: "internal" }),
          },
          {
            label: "External",
            value: "external",
            onClick: () =>
              applyFilters({ ...currentFilters, traffic_type: "external" }),
          },
        ],
      },
      {
        id: "destination_type",
        label: "Destination",
        showDropdown: true,
        active: Boolean((currentFilters as any)?.destination_type),
        activeLabel: destinationLabel,
        onClear: () =>
          applyFilters({ ...currentFilters, destination_type: "" }),
        dropdownOptions: [
          {
            label: "All",
            value: "",
            onClick: () =>
              applyFilters({ ...currentFilters, destination_type: "" }),
          },
          {
            label: "Local",
            value: "local",
            onClick: () =>
              applyFilters({ ...currentFilters, destination_type: "local" }),
          },
          {
            label: "National",
            value: "national",
            onClick: () =>
              applyFilters({ ...currentFilters, destination_type: "national" }),
          },
          {
            label: "International",
            value: "international",
            onClick: () =>
              applyFilters({
                ...currentFilters,
                destination_type: "international",
              }),
          },
        ],
      },
      {
        id: "extension_number",
        label: "Extension",
        showDropdown: true,
        active: ((currentFilters as any)?.extension_number || []).length > 0,
        activeLabel: extensionActiveLabel,
        onClear: () =>
          applyFilters({ ...currentFilters, extension_number: [] }),
        dropdownOptions: [
          {
            label: "All",
            value: "",
            onClick: () =>
              applyFilters({ ...currentFilters, extension_number: [] }),
          },
          ...((hierarchyDataExtensions as any[]) || []).map((ext: any) => ({
            label: ext.name,
            value: String(ext.id),
            onClick: () =>
              toggleStringIdInFilter("extension_number", String(ext.id)),
          })),
        ],
      },
      {
        id: "department",
        label: "Department",
        showDropdown: true,
        active: ((currentFilters as any)?.department || []).length > 0,
        activeLabel: departmentActiveLabel,
        onClear: () => applyFilters({ ...currentFilters, department: [] }),
        dropdownOptions: [
          {
            label: "All",
            value: "",
            onClick: () => applyFilters({ ...currentFilters, department: [] }),
          },
          ...((hierarchyDataDepartments as any[]) || []).map((dept: any) => ({
            label: dept.name,
            value: String(dept.id),
            onClick: () =>
              toggleStringIdInFilter("department", String(dept.id)),
          })),
        ],
      },
      {
        id: "called_numbers",
        label: "Called Numbers",
        showDropdown: true,
        active: ((currentFilters as any)?.called_numbers || []).length > 0,
        activeLabel: calledNumbersActiveLabel,
        onClear: () => {
          setPendingCalledNumbers("");
          applyFilters({ ...currentFilters, called_numbers: [] });
        },
        dropdownContent: createCalledNumbersDropdownContent(
          pendingCalledNumbers,
          (v) => setPendingCalledNumbers(v),
          () => {
            const values = pendingCalledNumbers
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
            applyFilters({ ...currentFilters, called_numbers: values });
          },
        ),
      },
    ],
    [
      currentFilters,
      isDateRangeSet,
      dateRangeActiveLabel,
      directionLabel,
      statusLabel,
      trafficLabel,
      destinationLabel,
      extensionActiveLabel,
      departmentActiveLabel,
      calledNumbersActiveLabel,
      pendingStartDate,
      pendingEndDate,
      pendingCalledNumbers,
      hierarchyDataExtensions,
      hierarchyDataDepartments,
      applyFilters,
      toggleStringIdInFilter,
    ],
  );

  // ─── Toolbar config ───────────────────────────────────────────────────────
  const tableToolbar: ToolbarConfig = useMemo(
    () => ({
      showSearch: false,
      showFilterPills: true,
      filterPills,
      showMoreFiltersButton: false,
      showExportButton: true,
      onExportClick: handleExport,
      rightActions: showDateRange ? (
        <p className="mb-0 small">
          <span>Date Range:</span>
          <span className="status-badge primary ms-2">
            {formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)}
          </span>
          <span className="mx-2">to</span>
          <span className="status-badge primary">
            {formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}
          </span>
        </p>
      ) : undefined,
    }),
    [filterPills, handleExport, showDateRange, startDateTime, endDateTime],
  );

  // ─── Pagination handler ───────────────────────────────────────────────────
  const handlePaginationChange = useCallback(
    (page: number, perPage: number) => {
      setCurrentPage(page);
      setRowsPerPage(perPage);
      fetchCallLogs(page, perPage, "");
    },
    [fetchCallLogs],
  );

  // ─── Chart render helpers ─────────────────────────────────────────────────
  function renderDonutChart() {
    if (!dataLoaded) {
      return (
        <div
          className="d-flex flex-column align-items-center justify-content-center text-center"
          style={{ height: "180px" }}
        >
          <output className="spinner-border text-primary mb-2">
            <span className="visually-hidden">Loading chart data...</span>
          </output>
          <p className="text-muted mb-0">Loading chart data...</p>
        </div>
      );
    }
    if (!simpleDonut) {
      return (
        <div
          className="d-flex flex-column align-items-center justify-content-center text-center"
          style={{ height: "180px" }}
        >
          <i className="fa fa-chart-pie fa-2x text-muted mb-2" />
          <h6 className="text-muted mb-1">No Call Data Available</h6>
          <p className="text-muted mb-0">
            No call statistics found for the selected filters
          </p>
        </div>
      );
    }
    return (
      <ChartDonut
        series={simpleDonut.series}
        labels={simpleDonut.labels}
        dataType="calls"
        height={200}
        width={500}
        showDataLabels={true}
        dataLabelsFormatter={donutDataLabelsFormatter}
      />
    );
  }

  function renderBarChart(
    chartData: { series: any[]; categories: string[] } | null,
    dataType: ChartDataType,
    modalData: { series: any[]; categories: string[] } | null,
    modalTitle: string,
    modalDataType: ChartDataType,
  ) {
    if (chartLoading) {
      return (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "300px" }}
        >
          <output className="spinner-border text-primary">
            <span className="visually-hidden">Loading chart...</span>
          </output>
        </div>
      );
    }
    if (!chartData) {
      return (
        <div
          className="d-flex flex-column align-items-center justify-content-center text-center"
          style={{ height: "300px" }}
        >
          <i className="fa fa-chart-bar fa-3x text-muted mb-3" />
          <h5 className="text-muted mb-2">No Data Available</h5>
          <p className="text-muted mb-0">
            No statistics found for the selected filters and date range.
          </p>
        </div>
      );
    }
    return (
      <ChartBar
        series={chartData.series}
        categories={chartData.categories}
        dataType={dataType}
        height={300}
        maxDisplayedItems={5}
        showViewAllButton={true}
        viewAllButtonText="View All"
        showFullScreenButton={false}
        onFullScreenClick={() =>
          handleOpenChartModal(modalData, modalTitle, modalDataType)
        }
      />
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Call Stats By Country"
        showPageLoader={showPageLoader}
      />

      {/* GenericTable with filter pills and stats cards — at top */}
      {canViewCallLogsFromSession(session) && (
        <GenericTable
          data={tableData}
          columns={columns}
          loading={tableLoading}
          showToolbar={true}
          toolbar={tableToolbar}
          showToolbarActions={false}
          statsCards={statsCardsData}
          metricsGridMinWidth="180px"
          pagination={{
            currentPage,
            rowsPerPage,
            totalRows,
            pageSizeOptions: [15, 25, 50, 100],
          }}
          onPaginationChange={handlePaginationChange}
          emptyMessage="No call statistics found for the selected filters and date range."
        />
      )}

      {/* Call Analytics charts section — below table, styled to match GenericTable card */}
      <div className="mt-4">
        <div
          style={{
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 0.125rem 0.25rem rgba(0,0,0,0.075)",
          }}
        >
          {/* Section header — matches GenericTable toolbar header style */}
          <div
            style={{
              background: "#f7f2f7",
              borderBottom: "1px solid #dfe1e6",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <h6
              className="mb-0 fw-semibold"
              style={{ fontSize: "14px", color: "#222" }}
            >
              Call Analytics
            </h6>
          </div>

          {/* Charts body */}
          <div className="p-3">
            <Row className="g-3">
              {/* Donut chart — answered vs unanswered */}
              <Col md={4}>
                <div
                  style={{
                    background: "#fafafa",
                    border: "1px solid #eee",
                    borderRadius: "10px",
                    padding: "16px",
                    height: "100%",
                  }}
                >
                  <p
                    className="text-muted mb-3 fw-semibold"
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Answered vs Unanswered
                  </p>
                  {renderDonutChart()}
                </div>
              </Col>

              {/* Tabbed bar charts */}
              <Col md={8}>
                <div
                  style={{
                    background: "#fafafa",
                    border: "1px solid #eee",
                    borderRadius: "10px",
                    padding: "16px",
                    height: "100%",
                  }}
                >
                  <Tabs
                    defaultActiveKey="calls_chart"
                    id="system-tabs"
                    className="mb-3"
                    activeKey={activeTab}
                    onSelect={(key) => key && setActiveTab(key)}
                  >
                    <Tab eventKey="calls_chart" title="Calls by Country">
                      <AnimatePresence mode="wait">
                        {activeTab === "calls_chart" && (
                          <motion.div
                            key="calls_chart"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                          >
                            {renderBarChart(
                              chartCalls,
                              "calls",
                              chartCalls,
                              "Calls by Country",
                              "calls",
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Tab>

                    <Tab eventKey="duration_chart" title="Duration by Country">
                      <AnimatePresence mode="wait">
                        {activeTab === "duration_chart" && (
                          <motion.div
                            key="duration_chart"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                          >
                            {renderBarChart(
                              chartDuration,
                              "time",
                              chartDuration,
                              "Duration by Country",
                              "time",
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Tab>

                    <Tab eventKey="ring_chart" title="Ring Time by Country">
                      <AnimatePresence mode="wait">
                        {activeTab === "ring_chart" && (
                          <motion.div
                            key="ring_chart"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                          >
                            {renderBarChart(
                              chartRingTime,
                              "time",
                              chartRingTime,
                              "Ring Time by Country",
                              "time",
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Tab>
                  </Tabs>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>

      {/* Chart fullscreen modal */}
      <Modal
        show={showChartModal}
        onHide={() => setShowChartModal(false)}
        size="xl"
        centered
        className="chart-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{currentChartTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentChartData ? (
            <div className="chart-container" style={{ minHeight: "500px" }}>
              <ChartBar
                series={currentChartData.series}
                categories={currentChartData.categories}
                height={500}
                dataType={currentChartDataType}
              />
            </div>
          ) : (
            <div
              className="d-flex flex-column align-items-center justify-content-center text-center"
              style={{ height: "500px" }}
            >
              <i className="fa fa-chart-area fa-4x text-muted mb-3" />
              <h5 className="text-muted mb-2">No Chart Data Available</h5>
              <p className="text-muted mb-0">
                The selected chart data is not available or has been cleared.
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

CallStatsCountry.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallStatsCountry;
