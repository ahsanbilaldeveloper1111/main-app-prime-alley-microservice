import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Card, Col, Modal, Row } from "react-bootstrap";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import moment from "moment";
import { useStore } from "react-redux";

import GenericTable, {
  type TableAction,
  type TableColumn,
} from "@components/GenericTable";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import ChartBar from "@components/ChartBar";
import AudioPlayer, { type AudioPlayerRef } from "@components/AudioPlayer";
import EmptyState from "@components/EmptyState";
import {
  Hash,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
} from "lucide-react";
import CircularProgressCircle from "@components/CircularProgressCircle";

import { DownloadCallRecording } from "@utils/calls";
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
import { formatFilterDateTimeLabel } from "@utils/communicationsDateUtils";
import {
  buildDateTimeFilterPill,
  buildCallDirectionFilterPill,
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
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import type { RootState } from "@toolkit/index";
import { useAppDispatch, useAppSelector } from "@toolkit/hooks";
import {
  setCallRecordingsCurrentFilters,
  setCallRecordingsPagination,
  setCallDurationBarChartModal,
  setCurrentChartTitle,
  setSearchValue,
  setShowPageLoader,
} from "@toolkit/callRecordingsList/slice";
import {
  commitCallRecordingsFiltersThunk,
  exportCallRecordingsExcelThunk,
  fetchCallRecordingsThunk,
  resetCallRecordingsFiltersThunk,
  runCallRecordingsFetchForRefreshKeyThunk,
} from "@toolkit/callRecordingsList/thunks";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const { PERMISSIONS } = HEADER_CONSTANTS;

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
  [key: string]: unknown;
}

/** Avoid `String(object)` → `"[object Object]"` for hierarchy/API ids. */
function hierarchyScalarToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "symbol":
      return String(value);
    default:
      return "";
  }
}

function isCanceledAxiosError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ERR_CANCELED"
  );
}

function applyAudioRecordingGetError(
  error: unknown,
  setAudioError: (msg: string | null) => void,
): void {
  const err = error as {
    response?: { status?: number };
    request?: unknown;
    message?: string;
  };
  if (err.response?.status) {
    if (err.response.status === 204) {
      toast.error("Audio file not found");
    } else {
      setAudioError(`Error loading audio: ${err.response.status}`);
    }
    return;
  }
  if (err.request) {
    setAudioError("No response received from server");
    return;
  }
  setAudioError(`Request error: ${err.message ?? "unknown"}`);
}

function applyAudioRecordingGetResponse(args: {
  status: number;
  data: unknown;
  requestGeneration: number;
  generationRef: { current: number };
  replaceAudioObjectUrl: (next: string | null) => void;
  setMediaPlayerModal: (open: boolean) => void;
  setAudioError: (msg: string | null) => void;
}): void {
  const {
    status,
    data,
    requestGeneration,
    generationRef,
    replaceAudioObjectUrl,
    setMediaPlayerModal,
    setAudioError,
  } = args;

  if (status === 200) {
    const blob = new Blob([data as BlobPart], { type: "audio/mpeg" });
    const url = globalThis.URL.createObjectURL(blob);
    if (requestGeneration !== generationRef.current) {
      globalThis.URL.revokeObjectURL(url);
      return;
    }
    replaceAudioObjectUrl(url);
    setMediaPlayerModal(true);
    return;
  }
  if (status === 204) {
    toast.error("Audio file not found");
    return;
  }
  setAudioError(`Unexpected response status: ${status}`);
}

function buildUsernameFilterPill(
  currentFilters: Record<string, unknown>,
  stageFilters: (nextFilters: Record<string, unknown>) => void,
  selectedUsernameIds: string[],
  areAllUsernamesSelected: boolean,
  allUsernameIds: string[],
  usernameDropdownOptions: Array<{
    label: string;
    value: string;
    selected: boolean;
    onClick: () => void;
  }>,
) {
  return {
    id: "username",
    label: "Username",
    showDropdown: true,
    searchable: true,
    multiSelect: true,
    active: selectedUsernameIds.length > 0,
    activeLabel:
      selectedUsernameIds.length > 0
        ? `${selectedUsernameIds.length} selected`
        : undefined,
    onClear: () => stageFilters({ ...currentFilters, username: [] }),
    onSelectAll: () => {
      stageFilters({
        ...currentFilters,
        username: areAllUsernamesSelected ? [] : allUsernameIds,
      });
    },
    selectAllLabel: areAllUsernamesSelected ? "Deselect all" : "Select all",
    dropdownOptions: usernameDropdownOptions,
  };
}

const CallRecordingsView: React.FC = () => {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  const canPlayRecordings = session?.user?.permissions?.includes(
    PERMISSIONS.PLAY_RECORDING_CALL_RECORDINGS,
  );
  const canDownloadRecordings = session?.user?.permissions?.includes(
    PERMISSIONS.DOWNLOAD_RECORDING_CALL_RECORDINGS,
  );
  const userPermissions = session?.user?.permissions ?? [];
  const canViewCallRecordings =
    userPermissions.includes(PERMISSIONS.VIEW_CALL_RECORDINGS) ||
    userPermissions.includes(PERMISSIONS.LIST_CALL_RECORDINGS);
  const canExportCallRecordings = userPermissions.includes(
    PERMISSIONS.EXPORT_CALL_RECORDINGS,
  );

  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  const refreshKey = useAppSelector((s) => s.callRecordingsList.refreshKey);
  const currentFilters = useAppSelector((s) => s.callRecordingsList.currentFilters);
  const appliedFilters = useAppSelector(
    (s) => s.callRecordingsList.appliedFilters,
  );
  const defaultFiltersCurrent = useAppSelector(
    (s) => s.callRecordingsList.defaultFiltersCurrent,
  );
  const searchValue = useAppSelector((s) => s.callRecordingsList.searchValue);
  const tableData = useAppSelector((s) => s.callRecordingsList.tableData);
  const tableLoading = useAppSelector((s) => s.callRecordingsList.tableLoading);
  const pagination = useAppSelector((s) => s.callRecordingsList.pagination);
  const summary = useAppSelector((s) => s.callRecordingsList.summary);
  const durationChart = useAppSelector((s) => s.callRecordingsList.durationChart);
  const directionChart = useAppSelector(
    (s) => s.callRecordingsList.directionChart,
  );
  const chartLoading = useAppSelector((s) => s.callRecordingsList.chartLoading);
  const callDurationBarChartModal = useAppSelector(
    (s) => s.callRecordingsList.callDurationBarChartModal,
  );
  const currentChartTitle = useAppSelector(
    (s) => s.callRecordingsList.currentChartTitle,
  );
  const startDateTime = useAppSelector((s) => s.callRecordingsList.startDateTime);
  const endDateTime = useAppSelector((s) => s.callRecordingsList.endDateTime);

  const showAnalytics = false;
  const [showDateRange] = useState(true);

  const {
    hierarchyDataExtensions,
    hierarchyDataDepartments,
    hierarchyDataUsers,
  } = useHierarchyData(ModuleSlug.CALL_RECORDINGS);

  const selectedExtensionIds = useMemo<string[]>(
    () =>
      Array.isArray(currentFilters.extension_number)
        ? (currentFilters.extension_number as string[]).map(String)
        : [],
    [currentFilters.extension_number],
  );

  const extensionOptionsSelectedFirst = useMemo(
    () =>
      [...hierarchyDataExtensions].sort((a: unknown, b: unknown) => {
        const ao = a as { id?: unknown };
        const bo = b as { id?: unknown };
        const aSelected = selectedExtensionIds.includes(
          hierarchyScalarToString(ao.id),
        );
        const bSelected = selectedExtensionIds.includes(
          hierarchyScalarToString(bo.id),
        );
        if (aSelected === bSelected) return 0;
        return aSelected ? -1 : 1;
      }),
    [hierarchyDataExtensions, selectedExtensionIds],
  );

  const [mediaPlayerModal, setMediaPlayerModal] = useState(false);
  const [selectedRecording, setSelectedRecording] =
    useState<RecordingRow | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioError, setAudioError] = useState<string | null>(null);
  const [downloadingRecordings, setDownloadingRecordings] = useState<
    Set<string>
  >(new Set());
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

  const pendingDownloadTimeoutsRef = useRef(
    new Set<ReturnType<typeof setTimeout>>(),
  );
  const audioObjectUrlRef = useRef<string | null>(null);
  const audioFetchGenerationRef = useRef(0);
  const audioAbortRef = useRef<AbortController | null>(null);

  const replaceAudioObjectUrl = useCallback((next: string | null) => {
    if (audioObjectUrlRef.current) {
      globalThis.URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
    }
    if (next) {
      audioObjectUrlRef.current = next;
    }
    setAudioUrl(next ?? "");
  }, []);

  useEffect(
    () => () => {
      pendingDownloadTimeoutsRef.current.forEach(clearTimeout);
      pendingDownloadTimeoutsRef.current.clear();
      audioAbortRef.current?.abort();
      audioAbortRef.current = null;
      if (audioObjectUrlRef.current) {
        globalThis.URL.revokeObjectURL(audioObjectUrlRef.current);
        audioObjectUrlRef.current = null;
      }
    },
    [],
  );

  const statsCardsData = useMemo(
    () => [
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
    ],
    [summary],
  );

  const directionApexState = useMemo(() => {
    if (!directionChart) {
      return {
        series: [] as { name: string; data: number[] }[],
        options: {
          chart: { type: "bar" as const, height: 300, toolbar: { show: false } },
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
          tooltip: {
            y: { formatter: (val: number) => `${val} calls` },
          },
        },
      };
    }
    return {
      series: [
        { name: "Inbound", data: [...directionChart.inbound] },
        { name: "Outbound", data: [...directionChart.outbound] },
      ],
      options: {
        chart: { type: "bar" as const, height: 300, toolbar: { show: false } },
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
        xaxis: { categories: [...directionChart.labels] },
        yaxis: { title: { text: "Calls" } },
        fill: { opacity: 1 },
        tooltip: {
          y: { formatter: (val: number) => `${val} calls` },
        },
      },
    };
  }, [directionChart]);

  useEffect(() => {
    dispatch(runCallRecordingsFetchForRefreshKeyThunk());
  }, [refreshKey, dispatch]);

  const stageFilters = useCallback(
    (nextFilters: Record<string, unknown>) => {
      dispatch(setCallRecordingsCurrentFilters(nextFilters));
    },
    [dispatch],
  );

  const setCurrentFiltersDispatch = useCallback(
    (filters: Record<string, unknown>) => {
      dispatch(setCallRecordingsCurrentFilters(filters));
    },
    [dispatch],
  );

  const applyCommitted = useCallback(
    (filters: Record<string, unknown>) => {
      dispatch(commitCallRecordingsFiltersThunk(filters));
    },
    [dispatch],
  );

  const {
    handleApplyFiltersClick,
    hasUnappliedFilterChanges,
    hasNonDefaultFilters,
  } = useStagedFiltersActions(
    currentFilters as Record<string, unknown>,
    appliedFilters as Record<string, unknown>,
    defaultFiltersCurrent as Record<string, unknown>,
    setCurrentFiltersDispatch,
    applyCommitted,
  );

  const handleResetFiltersClick = useCallback(() => {
    dispatch(resetCallRecordingsFiltersThunk());
  }, [dispatch]);

  const selectedUsernameIds = useMemo<string[]>(() => {
    const raw = currentFilters.username;
    if (Array.isArray(raw)) {
      return raw
        .map((value) => hierarchyScalarToString(value).trim())
        .filter((value) => value.length > 0);
    }
    const single = hierarchyScalarToString(raw).trim();
    return single ? [single] : [];
  }, [currentFilters.username]);

  const allUsernameIds = useMemo<string[]>(
    () =>
      hierarchyDataUsers.map((u: unknown) =>
        hierarchyScalarToString((u as { id?: unknown }).id),
      ),
    [hierarchyDataUsers],
  );

  const areAllUsernamesSelected = useMemo(
    () =>
      allUsernameIds.length > 0 &&
      allUsernameIds.every((id) => selectedUsernameIds.includes(id)),
    [allUsernameIds, selectedUsernameIds],
  );

  const toggleUsernameSelection = useCallback(
    (userId: string) => {
      const isSelected = selectedUsernameIds.includes(userId);
      const nextUsernames = isSelected
        ? selectedUsernameIds.filter((id) => id !== userId)
        : [...selectedUsernameIds, userId];
      stageFilters({
        ...currentFilters,
        username: nextUsernames,
      });
    },
    [selectedUsernameIds, stageFilters, currentFilters],
  );

  const usernameDropdownOptions = useMemo(
    () =>
      hierarchyDataUsers
        .map((u: unknown) => {
          const row = u as { id?: unknown; name?: unknown };
          const userId = hierarchyScalarToString(row.id);
          const label = hierarchyScalarToString(row.name) || userId;
          return {
            label,
            value: userId,
            selected: selectedUsernameIds.includes(userId),
            onClick: () => toggleUsernameSelection(userId),
          };
        })
        .sort((a, b) => {
          if (a.selected === b.selected) return 0;
          return a.selected ? -1 : 1;
        }),
    [hierarchyDataUsers, selectedUsernameIds, toggleUsernameSelection],
  );

  const usernameFilterPill = useMemo(
    () =>
      buildUsernameFilterPill(
        currentFilters as Record<string, unknown>,
        stageFilters,
        selectedUsernameIds,
        areAllUsernamesSelected,
        allUsernameIds,
        usernameDropdownOptions,
      ),
    [
      currentFilters,
      stageFilters,
      selectedUsernameIds,
      areAllUsernamesSelected,
      allUsernameIds,
      usernameDropdownOptions,
    ],
  );

  const selectedStartDateTime = String(
    appliedFilters.start_date ?? startDateTime ?? "",
  );
  const selectedEndDateTime = String(
    appliedFilters.end_date ?? endDateTime ?? "",
  );

  const handleOpenChartModal = useCallback(
    (title: string) => {
      dispatch(setCurrentChartTitle(title));
      dispatch(setCallDurationBarChartModal(true));
    },
    [dispatch],
  );

  const handleCloseDurationChartModal = useCallback(() => {
    dispatch(setCallDurationBarChartModal(false));
  }, [dispatch]);

  const handleExportExcel = useCallback(() => {
    dispatch(exportCallRecordingsExcelThunk());
  }, [dispatch]);

  const tableToolbar = useMemo(() => {
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
      onSearchChange: (value: string) => dispatch(setSearchValue(value)),
      onSearch: () => {
        const st = store.getState().callRecordingsList;
        dispatch(
          setCallRecordingsPagination({
            ...st.pagination,
            currentPage: 1,
          }),
        );
        dispatch(
          fetchCallRecordingsThunk({
            page: 1,
            perPage: st.pagination.perPage,
            search: st.searchValue.trim(),
          }),
        );
      },
      showFiltersButton: canViewCallRecordings,
      showExportButton: canExportCallRecordings,
      onExportClick: handleExportExcel,
      showFilterPills: true,
      showMoreFiltersButton: false,
      filterPills: [
        buildCallDirectionFilterPill(
          currentFilters as Record<string, unknown>,
          stageFilters,
        ),
        buildExtensionMultiSelectFilterPill(
          extensionOptionsSelectedFirst,
          currentFilters as Record<string, unknown>,
          stageFilters,
        ),
        buildDepartmentFilterPill(
          hierarchyDataDepartments as { id?: string; name?: string }[],
          currentFilters as Record<string, unknown>,
          stageFilters,
        ),
        usernameFilterPill,
        buildTextDropdownFilterPill(
          "remote_party_number",
          "Remote Party Number",
          currentFilters as Record<string, unknown>,
          setCurrentFiltersDispatch,
          stageFilters,
          createTextFilterDropdownContent,
          "Enter phone number",
        ),
        buildDateTimeFilterPill(
          "start_date",
          "Start Date & Time",
          currentFilters as Record<string, unknown>,
          setCurrentFiltersDispatch,
          stageFilters,
          formatFilterDateTimeLabel,
          createDateTimeDropdownContent,
        ),
        buildDateTimeFilterPill(
          "end_date",
          "End Date & Time",
          currentFilters as Record<string, unknown>,
          setCurrentFiltersDispatch,
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
        "call-recordings",
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
    canExportCallRecordings,
    canViewCallRecordings,
    searchValue,
    dispatch,
    store,
    currentFilters,
    stageFilters,
    extensionOptionsSelectedFirst,
    hierarchyDataDepartments,
    usernameFilterPill,
    setCurrentFiltersDispatch,
    handleExportExcel,
    handleResetFiltersClick,
    handleApplyFiltersClick,
    hasUnappliedFilterChanges,
    hasNonDefaultFilters,
    showDateRange,
    selectedStartDateTime,
    selectedEndDateTime,
  ]);

  const handleDownload = async (props: RecordingRow) => {
    const Id = String(props.Id ?? "");
    const AgentExtension = String(props.AgentExtension ?? "");

    setDownloadingRecordings((prev) => new Set(prev).add(Id));
    setDownloadProgress((prev) => ({ ...prev, [Id]: 0 }));

    let progressInterval: ReturnType<typeof setInterval> | undefined;
    try {
      progressInterval = setInterval(() => {
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
        typeof props.imagicle === "string" ? props.imagicle : undefined,
      );

      setDownloadProgress((prev) => ({ ...prev, [Id]: 100 }));

      const tid = setTimeout(() => {
        pendingDownloadTimeoutsRef.current.delete(tid);
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
      pendingDownloadTimeoutsRef.current.add(tid);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");

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
    } finally {
      if (progressInterval !== undefined) {
        clearInterval(progressInterval);
      }
    }
  };

  const handleAnalysis = async (props: RecordingRow) => {
    try {
      const Id = props.Id;
      let dateOnly = "";
      if (
        typeof props.DateOnly === "string" ||
        typeof props.DateOnly === "number"
      ) {
        dateOnly = String(props.DateOnly);
      } else if (props?.DateTime) {
        dateOnly = moment(String(props.DateTime)).format("YYYY-MM-DD");
      }
      const dataObject = {
        uuid: String(Id ?? ""),
        direction: String(props?.Direction ?? ""),
        phone: String(props?.AgentExtension ?? ""),
        imagicle: String(props?.imagicle ?? ""),
        duration: String(props?.Duration ?? ""),
        dateTime: String(props?.DateTime ?? ""),
        dateOnly,
        remotePartyNumber: String(props?.RemotePartyNumber ?? ""),
        ownerUsername: String(props?.Username ?? ""),
        localPartyNumber: String(props?.AgentExtension ?? ""),
      };

      const encodedData = encodeAnalysisData(dataObject);
      const tempUrl = `/ai-ml/analysis/new?data=${encodeURIComponent(encodedData)}`;
      globalThis.open(tempUrl, "_blank");
    } catch {
      // navigation / encoding errors ignored
    }
  };

  const loadAuthenticatedAudio = async (
    audioTrackId: string,
    agentExtension: string,
    node?: string,
  ) => {
    if (!audioTrackId) return;

    audioAbortRef.current?.abort();
    const controller = new AbortController();
    audioAbortRef.current = controller;
    const requestGeneration = ++audioFetchGenerationRef.current;

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
          signal: controller.signal,
        },
      );
      dispatch(setShowPageLoader(false));

      applyAudioRecordingGetResponse({
        status: response.status,
        data: response.data,
        requestGeneration,
        generationRef: audioFetchGenerationRef,
        replaceAudioObjectUrl,
        setMediaPlayerModal,
        setAudioError,
      });
    } catch (error: unknown) {
      if (isCanceledAxiosError(error)) {
        return;
      }
      applyAudioRecordingGetError(error, setAudioError);
    } finally {
      setAudioLoading(false);
    }
  };

  const handlePlayRecording = (recording: RecordingRow) => {
    dispatch(setShowPageLoader(true));
    const trackId = String(recording.Id ?? "");
    const agentExtension = String(recording.AgentExtension ?? "");
    loadAuthenticatedAudio(
      trackId,
      agentExtension,
      typeof recording.imagicle === "string" ? recording.imagicle : undefined,
    ).catch(() => {});
    setSelectedRecording(recording);
    setAudioLoading(false);
    setAudioError(null);
  };

  const handleCloseModal = () => {
    audioFetchGenerationRef.current += 1;
    audioAbortRef.current?.abort();
    audioAbortRef.current = null;
    replaceAudioObjectUrl(null);
    setMediaPlayerModal(false);
    setSelectedRecording(null);
    setAudioLoading(false);
    setAudioError(null);
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
          title={`Call Recording - ${selectedRecording?.Id ?? ""}`}
          showWaveform={true}
          autoPlay={true}
        />
      </div>
    );
  };

  const tableColumns: TableColumn<RecordingRow>[] = useMemo(
    () => [
      {
        key: "DateTime",
        label: "Date",
        sortable: true,
        render: (row) => (
          <div>
            {convertDateTimeWithOffsetToLocal(
              String(row.DateTime ?? ""),
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
              String(row.DateTime ?? ""),
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
    ],
    [],
  );

  const recordingActions: TableAction<RecordingRow>[] = [
    {
      label: "Actions",
      render: (row) => {
        const rowId = String(row.Id ?? "");
        const isDownloading = downloadingRecordings.has(rowId);
        const progress = downloadProgress[rowId] || 0;
        const canRenderDownload = canDownloadRecordings;
        const showDownloadProgress = canRenderDownload && isDownloading;
        let downloadControl: React.ReactNode = null;
        if (showDownloadProgress) {
          downloadControl = (
            <CircularProgressCircle
              progress={progress}
              size="small"
              color="#28a745"
              backgroundColor="#e9ecef"
              textColor="#495057"
              showPercentage={false}
              className="circular-progress-inline"
            />
          );
        } else if (canRenderDownload) {
          downloadControl = (
            <button
              type="button"
              className="btn btn-link p-0 text-info border-0"
              onClick={() => {
                handleDownload(row).catch(() => {});
              }}
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
          );
        }
        return (
          <div className="d-flex gap-3 action-box">
            {canPlayRecordings && (
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
            )}
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              {downloadControl}
            </div>
            {session?.user?.permissions?.includes(
              "transcriptions-analysis-aiml",
            ) && (
              <button
                type="button"
                className="btn btn-link p-0 text-info border-0"
                onClick={() => {
                  handleAnalysis(row).catch(() => {});
                }}
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

  const durationSeriesForCharts = durationChart?.series ?? [];
  const durationCategoriesForCharts = durationChart?.categories ?? [];
  const hasDurationChartData =
    durationSeriesForCharts.length > 0 &&
    durationSeriesForCharts.every(
      (s: { name: string; data: number[] }) => s.data.length > 0,
    );

  return (
    <React.Fragment>
      <Modal
        show={callDurationBarChartModal}
        onHide={handleCloseDurationChartModal}
        size="xl"
        centered
        className="chart-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{currentChartTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {durationChart && hasDurationChartData ? (
            <div className="chart-container" style={{ minHeight: "500px" }}>
              <ChartBar
                series={durationSeriesForCharts.map(
                  (s: { name: string; data: number[] }) => ({
                    name: s.name,
                    data: [...s.data],
                  }),
                )}
                categories={[...durationCategoriesForCharts]}
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

      {showAnalytics && (
        <Row className="mb-3">
          <Col md={6}>
            <Card>
              <Card.Body className="p-3">
                {!durationChart || !hasDurationChartData ? (
                  <EmptyState
                    title="No Call Duration Data"
                    description="Chart data will appear here when available."
                    className="table-empty-state"
                  />
                ) : (
                  <>
                    <h5 className="app-title-heading">Call Duration</h5>
                    <ChartBar
                      series={durationSeriesForCharts.map(
                        (s: { name: string; data: number[] }) => ({
                          name: s.name,
                          data: [...s.data],
                        }),
                      )}
                      categories={[...durationCategoriesForCharts]}
                      dataType="time"
                      height={300}
                      loading={chartLoading}
                      yAxisLabel="Extensions"
                      maxDisplayedItems={5}
                      showViewAllButton={true}
                      viewAllButtonText="View All"
                      showFullScreenButton={true}
                      onFullScreenClick={() => handleOpenChartModal("Call Duration")}
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
                {!directionApexState.series.length ||
                directionApexState.series.some(
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
                      options={directionApexState.options}
                      series={directionApexState.series}
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

      {canViewCallRecordings && (
        <GenericTable<RecordingRow>
          data={tableData as RecordingRow[]}
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
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.perPage,
            totalRows: pagination.totalRows,
            pageSizeOptions: [10, 15, 25, 50, 100],
          }}
          onPaginationChange={(page, rowsPerPage) => {
            const st = store.getState().callRecordingsList;
            dispatch(
              setCallRecordingsPagination({
                ...st.pagination,
                currentPage: page,
                perPage: rowsPerPage,
              }),
            );
            dispatch(
              fetchCallRecordingsThunk({
                page,
                perPage: rowsPerPage,
                search: st.searchValue.trim(),
              }),
            );
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

export default CallRecordingsView;
