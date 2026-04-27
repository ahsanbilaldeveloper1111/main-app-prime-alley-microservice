import "@assets/scss/datatable-style.scss";

import React, {
  ReactElement,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Col, Button, Card, Form, Modal, Row } from "react-bootstrap";

import { useSession } from "next-auth/react";
import type { NextPage } from "next";
import moment from "moment";
import dynamic from "next/dynamic";

// Components
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  TableAction,
  TableColumn,
} from "@components/GenericTable";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import ChartBar from "@components/ChartBar";
import AudioPlayer, { AudioPlayerRef } from "@components/AudioPlayer";
import EmptyState from "@components/EmptyState";
import {
  Hash,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
} from "lucide-react";

import "@assets/scss/common.scss";

// Utils
import {
  ListCallLogs,
  DownloadCallRecording,
  DownloadStreamingExport,
} from "@utils/calls";
import axiosInstance from "@utils/axios";
import { toast } from "react-toastify";
import {
  ModuleSlug,
  formatDuration,
  GlobalDateFormat,
  GlobalTimeFormat,
  GlobalDateTimeFormat,
  encodeAnalysisData,
  convertDateTimeWithOffsetToLocal,
  formatDateTimeToLocal,
} from "@utils/Helper";
import { isExactPhoneMatch, normalizePhoneValue } from "@utils/phoneMatch";
import CircularProgressCircle from "@components/CircularProgressCircle";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

import { HEADER_CONSTANTS } from "@constants/headerConstants";
const { PERMISSIONS } = HEADER_CONSTANTS;

/** Default "today" range for the call recordings list (UI datetime-local + UTC Z for API). */
function getDefaultCommunicationsDateFilterPair(
  startKey: string,
  endKey: string,
): { current: Record<string, string>; applied: Record<string, string> } {
  const now = moment();
  const startDateApi =
    now.clone().startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
  const endDateApi =
    now.clone().endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
  const startDateUi = now.clone().startOf("day").format("YYYY-MM-DDTHH:mm");
  const endDateUi = now.clone().endOf("day").format("YYYY-MM-DDTHH:mm");
  return {
    current: { [startKey]: startDateUi, [endKey]: endDateUi },
    applied: { [startKey]: startDateApi, [endKey]: endDateApi },
  };
}

/** Format datetime values to UTC ISO with trailing Z for the API. */
function formatDateForApi(
  value: string | undefined,
  endOfDay: boolean,
): string | undefined {
  if (!value) return value;
  let m = moment(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    m = moment(value + ":00");
  } else if (!value.includes("T")) {
    m = endOfDay ? moment(value).endOf("day") : moment(value).startOf("day");
  }
  return m.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
}

/** Format the recordings filters for the API call. */
function formatCallRecordingsFiltersForApi(filters: Record<string, any>): {
  applied: Record<string, any>;
  normalizedRemotePartyNumber: string | undefined;
} {
  const applied: Record<string, any> = { ...filters };

  const normalizedRemotePartyNumber = normalizePhoneValue(
    applied.remote_party_number,
  );
  if (normalizedRemotePartyNumber) {
    applied.remote_party_number = normalizedRemotePartyNumber;
  } else {
    delete applied.remote_party_number;
  }

  if (applied.start_date) {
    applied.start_date = formatDateForApi(String(applied.start_date), false);
  }
  if (applied.end_date) {
    applied.end_date = formatDateForApi(String(applied.end_date), true);
  }
  delete applied.timezone;

  return { applied, normalizedRemotePartyNumber };
}

/** Skip-fetch guard to avoid duplicate API calls for the recordings list. */
function shouldSkipCommunicationsListFetch(
  isFetching: boolean,
  paramsKey: string,
  lastParamsKey: string,
  lastFetchTime: number,
  now: number,
): boolean {
  if (isFetching && lastParamsKey === paramsKey && now - lastFetchTime < 500) {
    return true;
  }
  if (lastParamsKey === paramsKey && now - lastFetchTime < 100) {
    return true;
  }
  return false;
}

/** Empty chart state for the recordings call-direction chart. */
function getEmptyCallRecordingsDirectionChartState() {
  return {
    series: [] as { name: string; data: number[] }[],
    options: {
      chart: { type: "bar" as const, height: 200, toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 5,
          borderRadiusApplication: "end" as const,
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      xaxis: { categories: [] as string[] },
      yaxis: { title: { text: "Calls" } },
      fill: { opacity: 1 },
      tooltip: { y: { formatter: (val: any) => `${val} calls` } },
    },
  };
}

import { HEADER_CONSTANTS } from '@constants/headerConstants';
import { createCommunicationsTextFilterDropdownContent } from '@utils/communications/communicationsDateExtensionFilters';
import { formatCallRecordingsFiltersForApi } from '@utils/communications/communicationsAppliedFiltersFormat';
import { getDefaultCommunicationsDateFilterPair } from '@utils/communications/communicationsFilterDefaults';
import { shouldSkipCommunicationsListFetch } from '@utils/communications/communicationsListFetchDedup';
import { getEmptyCallRecordingsDirectionChartState } from '@utils/communications/recordingsChartDefaults';
import {
    buildCallDirectionFilterPill,
    buildDepartmentFilterPill,
    buildEndDateTimeFilterPill,
    buildExtensionNumberMultiSelectFilterPill,
    buildStartDateTimeFilterPill,
} from '@utils/communications/communicationsFilterPillFactories';
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

interface ChartDirection {
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
const PhoneFilterMenu: React.FC<PhoneFilterMenuProps> = ({
  value,
  onChange,
  onApply,
  closeMenu,
}) => (
  <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
    <Form.Control
      size="sm"
      type="text"
      placeholder="Enter phone number"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
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
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
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

// ─── Dropdown content factories (defined outside CallRecordings to satisfy Sonar) ──

function createPhoneDropdownContent(
  value: string,
  onChange: (v: string) => void,
  onApply: (v: string) => void,
) {
  return function PhoneDropdownRender({
    closeMenu,
  }: {
    closeMenu: () => void;
  }) {
    return (
      <PhoneFilterMenu
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
  onChange: (v: string) => void,
  onApply: (v: string) => void,
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

const CallRecordings: NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
} = () => {
  const { data: session } = useSession();
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const [showPageLoader, setShowPageLoader] = useState(false);

  const [showDateRange] = useState(true);
  const [startDateTime, setStartDateTime] = useState<string>(
    () =>
      moment().clone().startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
  );
  const [endDateTime, setEndDateTime] = useState<string>(
    () =>
      moment().clone().endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
  );
  const defaultFilters = getDefaultCommunicationsDateFilterPair(
    "start_date",
    "end_date",
  );

  // State declarations
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(
    defaultFilters.current,
  );
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>(
    defaultFilters.applied,
  ); // Filters that trigger API calls
  const [searchValue, setSearchValue] = useState<string>("");
  const showAnalytics = false;
  // Refs to prevent duplicate API calls
  const appliedFiltersRef = useRef<Record<string, any>>(defaultFilters.applied);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const lastFetchParamsRef = useRef<string>("");

  // Use hierarchy data hook
  const {
    hierarchyDataExtensions,
    hierarchyDataDepartments,
    hierarchyDataUsers,
  } = useHierarchyData(ModuleSlug.CALL_RECORDINGS);
  const [callDurationBarChartModal, setCallDurationBarChartModal] =
    useState(false);
  const [currentChartData, setCurrentChartData] = useState<{
    series: any[];
    categories: string[];
  } | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [currentChartTitle, setCurrentChartTitle] = useState("");
  const [mediaPlayerModal, setMediaPlayerModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioError, setAudioError] = useState<string | null>(null);
  const [downloadingRecordings, setDownloadingRecordings] = useState<
    Set<string>
  >(new Set());
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

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
    outbound: 0,
  });

  // Stats cards data for StatsCards component
  const statsCardsData = [
    {
      title: "Extensions",
      value: summary?.extensions || 0,
      icon: Hash,
      iconColor: "#8B5CF6",
      iconBgColor: "#EDE9FE",
      subtitle: "Extensions in the system",
    },
    {
      title: "Remote Numbers",
      value: summary?.numbers || 0,
      icon: Phone,
      iconColor: "#3B82F6",
      iconBgColor: "#DBEAFE",
      subtitle: "Remote numbers in the system",
    },
    {
      title: "Inbound",
      value: summary?.inbound || 0,
      icon: PhoneIncoming,
      iconColor: "#10B981",
      iconBgColor: "#D1FAE5",
      subtitle: "Inbound calls in the system",
    },
    {
      title: "Outbound",
      value: summary?.outbound || 0,
      icon: PhoneOutgoing,
      iconColor: "#0EA5E9",
      iconBgColor: "#E0F2FE",
      subtitle: "Outbound calls in the system",
    },
  ];

  const [callDirectionTwo, setCallDirectionTwo] = React.useState(() =>
    getEmptyCallRecordingsDirectionChartState(),
  );

  const getRowsArray = (response: any): RecordingRow[] => {
    const rawData = response?.data;
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData?.data)) return rawData.data;
    if (Array.isArray(response?.dataList)) return response.dataList;
    return [];
  };

  const updatePaginationFromResponse = (
    response: any,
    rowsArray: RecordingRow[],
    page: number,
    perPage: number,
  ) => {
    const rawData = response?.data;
    const paginationData =
      response?.data?.pagination ?? response?.pagination ?? response;
    const total =
      response?.recordsTotal ??
      response?.total ??
      rawData?.recordsTotal ??
      rawData?.total ??
      paginationData?.total ??
      rowsArray.length;
    const currentPage =
      response?.current_page ?? paginationData?.current_page ?? page;
    const perPageVal =
      response?.per_page ?? paginationData?.per_page ?? perPage;
    rowsPerPageRef.current = perPageVal;

    setPaginationInfo({
      totalRows: Number(total) || 0,
      totalPages:
        Number(
          paginationData?.last_page ??
            response?.last_page ??
            Math.max(1, Math.ceil(Number(total) / perPageVal)),
        ) || 1,
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
    const newChartData: ChartDuration = {
      label: [],
      longest_call: [],
      shortest_call: [],
      average_call: [],
    };

    dataExtension.forEach((item: any) => {
      newChartData.label.push(item.label);
      const longestCall =
        typeof item.longest_call === "string"
          ? Number.parseFloat(item.longest_call)
          : Number(item.longest_call) || 0;
      const shortestCall =
        typeof item.shortest_call === "string"
          ? Number.parseFloat(item.shortest_call)
          : Number(item.shortest_call) || 0;
      const averageCall =
        typeof item.average_call === "string"
          ? Number.parseFloat(item.average_call)
          : Number(item.average_call) || 0;
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
          { name: "Short", data: newChartData.shortest_call },
          { name: "Average", data: newChartData.average_call },
          { name: "Long", data: newChartData.longest_call },
        ],
        categories: newChartData.label,
      });
    }
    setChartLoading(false);
  };

  const updateDirectionChart = (dateChart: any[]) => {
    if (!Array.isArray(dateChart) || dateChart.length === 0) return;

    const newChartDirection: ChartDirection = {
      inbound: [],
      outbound: [],
      label: [],
    };
    dateChart.forEach((item: any) => {
      newChartDirection.inbound.push(item.inbound);
      newChartDirection.outbound.push(item.outbound);
      newChartDirection.label.push(item.label);
    });

    setCallDirectionTwo({
      series: [
        { name: "Inbound", data: newChartDirection.inbound },
        { name: "Outbound", data: newChartDirection.outbound },
      ],
      options: {
        chart: { type: "bar" as const, height: 200, toolbar: { show: false } },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "55%",
            borderRadius: 5,
            borderRadiusApplication: "end" as const,
          },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ["transparent"] },
        xaxis: { categories: newChartDirection.label },
        yaxis: { title: { text: "Calls" } },
        fill: { opacity: 1 },
        tooltip: { y: { formatter: (val: any) => `${val} calls` } },
      },
    });
  };

  const fetchCallLogsOriginal = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      // Prevent duplicate calls
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
            reportType: "recordings",
            moduleSlug: ModuleSlug.CALL_RECORDINGS,
          },
          "call-logs/recordings",
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
          rowsArray = rowsArray.filter((row) =>
            isExactPhoneMatch(row.RemotePartyNumber, exactRemoteFilter),
          );
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
    },
    [],
  );

  const handleOpenChartModal = (
    chartData: { series: any[]; categories: string[] } | null,
    title: string,
  ) => {
    if (chartData) {
      setCurrentChartData(chartData);
      setCurrentChartTitle(title);
      setCallDurationBarChartModal(true);
    }
  };

  const handleFiltersChange = useCallback((filters: any) => {
    const { applied: formattedFilters, normalizedRemotePartyNumber } =
      formatCallRecordingsFiltersForApi(filters);

    setCurrentFilters({
      ...filters,
      remote_party_number: normalizedRemotePartyNumber,
    });
    setAppliedFilters(formattedFilters);
    appliedFiltersRef.current = formattedFilters;
    setRefreshKey((prev) => prev + 1);

    if (!filters || Object.keys(filters).length === 0) {
      setCurrentChartData(null);
      setCallDirectionTwo(getEmptyCallRecordingsDirectionChartState());
      setChartLoading(false);
    }
  }, []);

  const handleExport = async (
    exportType: string,
    filters: Record<string, any>,
  ) => {
    setShowPageLoader(true);
    try {
      if (exportType === "excel") {
        await DownloadStreamingExport(
          {
            filters,
            isExport: true,
            exportType,
            moduleSlug: ModuleSlug.CALL_RECORDINGS,
          },
          "call-logs/recordings",
          "recordings",
        ).finally(() => {
          setShowPageLoader(false);
        });
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed");
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

  const callDirectionLabel = (value: string): string => {
    if (value === "OUTGOING") return "Outgoing";
    if (value === "INCOMING") return "Incoming";
    if (value === "Both") return "Both";
    return "";
  };

  const toggleExtensionId = useCallback(
    (idVal: string) => {
      const prev = Array.isArray(currentFilters.extension_number)
        ? (currentFilters.extension_number as string[])
        : [];
      const next = prev.includes(idVal)
        ? prev.filter((v) => v !== idVal)
        : [...prev, idVal];
      stageFilters({ ...currentFilters, extension_number: next });
    },
    [currentFilters, stageFilters],
  );

  const selectedStartDateTime = String(
    appliedFilters?.start_date || startDateTime || "",
  );
  const selectedEndDateTime = String(
    appliedFilters?.end_date || endDateTime || "",
  );

  const tableToolbar = useMemo(() => {
    const extensionAllIds = hierarchyDataExtensions.map((ext: any) =>
      String(ext.id),
    );
    return {
      showTabs: true,
      tabs: [
        {
          id: "call-recordings-title",
          label: "Call Recordings",
          removable: false,
        },
      ],
      activeTab: "call-recordings-title",
      onTabChange: () => {},
      showSearch: true,
      searchValue,
      searchPlaceholder: "Search by username, extension, phone...",
      onSearchChange: (value: string) => setSearchValue(value),
      onSearch: () => {
        setPaginationInfo((prev) => ({ ...prev, currentPage: 1 }));
        fetchCallLogsOriginal(1, paginationInfo.perPage, searchValue.trim());
      },
      showFiltersButton: session?.user?.permissions?.includes(
        PERMISSIONS.VIEW_CALL_RECORDINGS,
      ),
      showExportButton: session?.user?.permissions?.includes(
        "export-call-recordings",
      ),
      onExportClick: () => handleExport("excel", appliedFilters),
      showFilterPills: true,
      showMoreFiltersButton: false,
      filterPills: [
        {
          id: "call_direction",
          label: "Call Direction",
          showDropdown: true,
          active: Boolean(currentFilters.call_direction),
          activeLabel: callDirectionLabel(
            String(currentFilters.call_direction ?? ""),
          ),
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
          id: "extension_number",
          label: "Extension",
          showDropdown: true,
          searchable: true,
          multiSelect: true,
          onSelectAll: () => {
            const selected = Array.isArray(currentFilters.extension_number)
              ? (currentFilters.extension_number as string[])
              : [];
            const allSelected =
              extensionAllIds.length > 0 &&
              selected.length === extensionAllIds.length;
            stageFilters({
              ...currentFilters,
              extension_number: allSelected ? [] : extensionAllIds,
            });
          },
          selectAllLabel:
            Array.isArray(currentFilters.extension_number) &&
            extensionAllIds.length > 0 &&
            (currentFilters.extension_number as string[]).length ===
              extensionAllIds.length
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
            const isSelected =
              Array.isArray(currentFilters.extension_number) &&
              (currentFilters.extension_number as string[]).includes(idVal);
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
          id: "username",
          label: "Username",
          showDropdown: true,
          searchable: true,
          active: Boolean(currentFilters.username),
          activeLabel: currentFilters.username
            ? (() => {
                const user = hierarchyDataUsers.find(
                  (u: any) => String(u.id) === String(currentFilters.username),
                );
                return user
                  ? String((user as any).name ?? (user as any).id)
                  : String(currentFilters.username);
              })()
            : undefined,
          onClear: () => stageFilters({ ...currentFilters, username: "" }),
          dropdownOptions: hierarchyDataUsers.map((u: any) => ({
            label: String(u.name ?? u.id),
            value: String(u.id),
            onClick: () =>
              stageFilters({ ...currentFilters, username: String(u.id) }),
          })),
        },
        {
          id: "remote_party_number",
          label: "Remote Party Number",
          showDropdown: true,
          active: Boolean(currentFilters.remote_party_number),
          activeLabel: currentFilters.remote_party_number
            ? String(currentFilters.remote_party_number)
            : undefined,
          onClear: () =>
            stageFilters({ ...currentFilters, remote_party_number: "" }),
          dropdownContent: createPhoneDropdownContent(
            currentFilters.remote_party_number ?? "",
            (v: string) =>
              setCurrentFilters({ ...currentFilters, remote_party_number: v }),
            (v: string) =>
              stageFilters({ ...currentFilters, remote_party_number: v }),
          ),
        },
        {
          id: "start_date",
          label: "Start Date & Time",
          showDropdown: true,
          active: Boolean(currentFilters.start_date),
          activeLabel: currentFilters.start_date
            ? String(currentFilters.start_date)
            : undefined,
          activeLabelOnly: true,
          dropdownContent: createDateDropdownContent(
            currentFilters.start_date ?? "",
            (v: string) =>
              setCurrentFilters({ ...currentFilters, start_date: v }),
            (v: string) => stageFilters({ ...currentFilters, start_date: v }),
          ),
        },
        {
          id: "end_date",
          label: "End Date & Time",
          showDropdown: true,
          active: Boolean(currentFilters.end_date),
          activeLabel: currentFilters.end_date
            ? String(currentFilters.end_date)
            : undefined,
          activeLabelOnly: true,
          dropdownContent: createDateDropdownContent(
            currentFilters.end_date ?? "",
            (v: string) =>
              setCurrentFilters({ ...currentFilters, end_date: v }),
            (v: string) => stageFilters({ ...currentFilters, end_date: v }),
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
              className="call-recordings-reset-filters-btn"
            >
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyFiltersClick}
            disabled={!hasUnappliedFilterChanges}
            className="call-recordings-apply-filters-btn"
          >
            Apply Filters
          </Button>
        </>
      ),
      rightActions: (
        <div className="d-flex align-items-center gap-2 call-recordings-date-range-wrap">
          {showDateRange &&
            selectedStartDateTime &&
            selectedEndDateTime &&
            moment.utc(selectedStartDateTime).isValid() &&
            moment.utc(selectedEndDateTime).isValid() && (
              <div
                className="d-flex align-items-center gap-2 call-recordings-date-chip"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "6px 10px",
                }}
              >
                <span
                  className="d-inline-flex align-items-center justify-content-center"
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: "#eef2ff",
                    color: "#4f46e5",
                  }}
                >
                  <Calendar size={14} />
                </span>
                <span
                  className="call-recordings-date-text"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDateTimeToLocal(
                    selectedStartDateTime,
                    GlobalDateTimeFormat,
                  )}{" "}
                  -{" "}
                  {formatDateTimeToLocal(
                    selectedEndDateTime,
                    GlobalDateTimeFormat,
                  )}
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
    setCurrentFilters,
    hierarchyDataExtensions,
    hierarchyDataDepartments,
    hierarchyDataUsers,
    session?.user?.permissions,
    showPageLoader,
    appliedFilters,
    showDateRange,
    selectedStartDateTime,
    selectedEndDateTime,
    stageFilters,
    handleApplyFiltersClick,
    handleResetFiltersClick,
    hasUnappliedFilterChanges,
    hasNonDefaultFilters,
    toggleExtensionId,
  ]);

  const handleDownload = async (props: any) => {
    const { Id, AgentExtension } = props;

    // Add to downloading set and initialize progress
    setDownloadingRecordings((prev) => new Set(prev).add(Id));
    setDownloadProgress((prev) => ({ ...prev, [Id]: 0 }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          const currentProgress = prev[Id] || 0;
          if (currentProgress < 90) {
            const randomIncrement =
              (crypto.getRandomValues(new Uint8Array(1))[0] / 255) * 15;
            return { ...prev, [Id]: currentProgress + randomIncrement };
          }
          return prev;
        });
      }, 200);

      await DownloadCallRecording(
        Id,
        AgentExtension,
        "call-logs/recordings/download",
        props.imagicle,
      );

      // Complete the progress
      clearInterval(progressInterval);
      setDownloadProgress((prev) => ({ ...prev, [Id]: 100 }));

      // Show completion briefly before hiding
      setTimeout(() => {
        setDownloadingRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(Id);
          return newSet;
        });
        setDownloadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[Id];
          return newProgress;
        });
      }, 1000);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");

      // Remove from downloading set on error
      setDownloadingRecordings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(Id);
        return newSet;
      });
      setDownloadProgress((prev) => {
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
        uuid: Id || "",
        direction: props?.Direction || "",
        phone: props?.AgentExtension || "",
        imagicle: props?.imagicle || "",
        duration: props?.Duration || "",
        dateTime: props?.DateTime || "",
        dateOnly: props?.DateOnly || "",
        remotePartyNumber: props?.RemotePartyNumber || "",
        ownerUsername: props?.Username || "",
        localPartyNumber: props?.AgentExtension || "",
      };
      console.log("dataObject before analysis", dataObject);

      // Encode data to base64 (unreadable format) using helper function
      const encodedData = encodeAnalysisData(dataObject);

      // Pass as single encoded parameter
      const tempUrl = `/ai-ml/analysis/new?data=${encodeURIComponent(encodedData)}`;

      globalThis.open(tempUrl, "_blank");
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

  const loadAuthenticatedAudio = async (
    audioTrackId: string,
    agentExtension: string,
    node?: string,
  ) => {
    if (!audioTrackId) return;

    setAudioLoading(true);
    setAudioError(null);

    try {
      const response = await axiosInstance.get(
        `call-logs/recordings/download/${audioTrackId}`,
        {
          responseType: "blob",
          params: {
            extension_number: agentExtension,
            node: node,
          },
          headers: {
            "Accept": "audio/*, application/octet-stream, */*",
          },
        },
      );
      setShowPageLoader(false);

      if (response.status === 200) {
        setMediaPlayerModal(true);
        const blob = new Blob([response.data], { type: "audio/mpeg" });
        const audioUrl = globalThis.URL.createObjectURL(blob);
        setAudioUrl(audioUrl);
      } else if (response.status === 204) {
        toast.error("Audio file not found");
      } else {
        setAudioError(`Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 204) {
          toast.error("Audio file not found");
        } else {
          setAudioError(`Error loading audio: ${error.response.status}`);
        }
      } else if (error.request) {
        setAudioError("No response received from server");
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
          <output className="mt-2 d-block" aria-live="polite">
            Loading audio file...
          </output>
        </div>
      );
    }

    if (audioError) {
      return (
        <div className="p-4">
          <div className="alert alert-warning">
            <i
              className="ph-duotone ph-warning-circle me-2"
              aria-hidden="true"
            ></i>{" "}
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
    fetchCallLogsOriginal(1, rowsPerPageRef.current, "");
  }, [refreshKey, fetchCallLogsOriginal]);

  // Table columns for GenericTable (defined after handlers so they are in scope)
  const tableColumns: TableColumn<RecordingRow>[] = [
    {
      key: "DateTime",
      label: "Date",
      sortable: true,
      render: (row) => (
        <div>
          {convertDateTimeWithOffsetToLocal(
            row.DateTime ?? "",
            undefined,
            GlobalDateFormat,
          )}
        </div>
      ),
    },
    {
      key: "Time",
      label: "Time",
      sortable: true,
      render: (row) => (
        <div>
          {convertDateTimeWithOffsetToLocal(
            row.DateTime ?? "",
            undefined,
            GlobalTimeFormat,
          )}
        </div>
      ),
    },
    { key: "AgentExtension", label: "Extension", sortable: true },
    { key: "Username", label: "Username", sortable: true },
    {
      key: "Department",
      label: "Department",
      sortable: true,
      render: (row) => row.Department || "---",
    },
    { key: "RemotePartyNumber", label: "Remote Number", sortable: true },
    { key: "Direction", label: "Direction", sortable: true },
    {
      key: "Duration",
      label: "Duration",
      sortable: true,
      render: (row) => {
        const duration =
          Number.parseInt(String(row.Duration), 10) / 10000000 || 0;
        return <div>{formatDuration(duration)}</div>;
      },
    },
  ];

  const recordingActions: TableAction<RecordingRow>[] = [
    {
      label: "Actions",
      render: (row) => {
        const isDownloading = downloadingRecordings.has(row.Id ?? "");
        const progress = downloadProgress[row.Id ?? ""] || 0;
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
                style={{ fontSize: "1rem" }}
                aria-hidden="true"
              />
            </button>
            <div style={{ display: "inline-flex", alignItems: "center" }}>
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
                    style={{ fontSize: "1rem" }}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
            {session?.user?.permissions?.includes(
              "transcriptions-analysis-aiml",
            ) && (
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
                  style={{ fontSize: "1rem" }}
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
            <div className="chart-container" style={{ minHeight: "500px" }}>
              <ChartBar
                series={currentChartData.series}
                categories={currentChartData.categories}
                height={500}
                dataType="time"
              />
            </div>
          ) : (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ height: "500px" }}
            >
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
        <BreadcrumbItem
          mainTitle=""
          mainLink=""
          subTitle="Call Recordings"
          showPageLoader={showPageLoader}
        />

        {/* Charts */}
        {showAnalytics && (
          <Row className="mb-3">
            <Col md={6}>
              <Card>
                <Card.Body className="p-3">
                  {!currentChartData ||
                  currentChartData.series.some(
                    (series) => series.data.length === 0,
                  ) ? (
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
                        onFullScreenClick={() =>
                          handleOpenChartModal(
                            currentChartData,
                            "Call Duration",
                          )
                        }
                        useLogScale={true}
                      />
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Body className="p-3">
                  {!callDirectionTwo.series.length ||
                  callDirectionTwo.series.some(
                    (series: { data: number[] }) => series.data.length === 0,
                  ) ? (
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

        {session?.user?.permissions?.includes("list-call-recordings") && (
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
              setPaginationInfo((prev) => ({
                ...prev,
                currentPage: page,
                perPage: rowsPerPage,
              }));
              fetchCallLogsOriginal(page, rowsPerPage, "");
            }}
            sortable={true}
            hover={true}
            striped={false}
            customizableColumns={true}
            defaultSelectedColumns={[
              "DateTime",
              "Time",
              "AgentExtension",
              "Username",
              "Department",
              "RemotePartyNumber",
              "Direction",
              "Duration",
              "actions",
            ]}
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
          <Modal.Title>Playing a Call Recording</Modal.Title>
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
