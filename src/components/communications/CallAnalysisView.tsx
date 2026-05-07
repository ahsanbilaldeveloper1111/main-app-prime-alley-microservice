import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Badge, Button, Modal } from "react-bootstrap";
import { useSession } from "next-auth/react";
import moment from "moment";
import { useStore } from "react-redux";
import GenericTable, { type TableAction, type TableColumn } from "@components/GenericTable";
import { type StatsCardData } from "@components/GenericStatsCards";
import { DownloadCallRecording } from "@utils/calls";
import { toast } from "react-toastify";
import {
  ModuleSlug,
  formatDateTimeToLocal,
  GlobalDateTimeFormat,
  formatDuration,
  encodeAnalysisData,
  GlobalDateFormat,
  convertDateTimeWithOffsetToLocal,
  GlobalTimeFormat,
} from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import AudioPlayer, { type AudioPlayerRef } from "@components/AudioPlayer";
import axiosInstance from "@utils/axios";
import CircularProgressCircle from "@components/CircularProgressCircle";
import { Calendar } from "lucide-react";
import type { RootState } from "@toolkit/index";
import { useAppDispatch, useAppSelector } from "@toolkit/hooks";
import {
  applyCallAnalysisFilters,
  callAnalysisListInitialState,
  setCallAnalysisPagination,
  setSearchValue,
} from "@toolkit/callAnalysisList/slice";
import {
  fetchCallAnalysisListThunk,
  runCallAnalysisFetchForRefreshKeyThunk,
} from "@toolkit/callAnalysisList/thunks";

type AnalysisRow = Record<string, unknown> & {
  uuid?: string;
  datetime?: string;
  direction?: string;
  duration?: string | number;
  remoteParty?: string;
  imagicle?: string;
  message?: string;
  local_party_model?: {
    localParty?: string;
    ownerUser?: string;
  };
  analysis?: Record<string, unknown>;
  status?: string;
};

/** Safe display/id string for JSON-like values; avoids String(object) => "[object Object]". */
function unknownScalarToString(value: unknown): string {
  if (value === undefined || value === null) return "";
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

const CallAnalysisView: React.FC = () => {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  const list = useAppSelector(
    (s) => s.callAnalysisList ?? callAnalysisListInitialState,
  );
  const refreshKey = list.refreshKey;
  const filters = list.filters;
  const searchValue = list.searchValue;
  const tableData = list.tableData;
  const tableLoading = list.tableLoading;
  const pagination = list.pagination;
  const transcriptionSummary = list.summary;

  const [mediaPlayerModal, setMediaPlayerModal] = useState(false);
  const [selectedRecording, setSelectedRecording] =
    useState<AnalysisRow | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioError, setAudioError] = useState<string | null>(null);
  const [downloadingRecordings, setDownloadingRecordings] = useState<
    Set<string>
  >(new Set());
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

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

  const { hierarchyDataExtensions } = useHierarchyData(
    ModuleSlug.CALL_RECORDINGS,
  );

  const statsCardsData = useMemo<StatsCardData[]>(
    () => [
      {
        title: "Total Calls",
        value: transcriptionSummary?.total_transcriptions || 0,
        subtitle: "Total calls in the system",
      },
      {
        title: "Calls In Queue",
        value: transcriptionSummary?.queued_transcriptions || 0,
        subtitle: "Queued calls in the system",
      },
      {
        title: "Transcribing",
        value: transcriptionSummary?.transribing_transcriptions || 0,
        subtitle: "Transcribing calls",
      },
      {
        title: "Analyzing",
        value: transcriptionSummary?.analyzing_transcriptions || 0,
        subtitle: "Analyzing calls",
      },
      {
        title: "Completed",
        value: transcriptionSummary?.completed_transcriptions || 0,
        subtitle: "Completed calls",
      },
      {
        title: "Failed",
        value: transcriptionSummary?.failed_transcriptions || 0,
        subtitle: "Failed calls",
      },
      {
        title: "Incomplete",
        value: transcriptionSummary?.incomplete_transcriptions || 0,
        subtitle: "Incomplete calls",
      },
      {
        title: "Reanalysis",
        value: transcriptionSummary?.reanalysis_calls || 0,
        subtitle: "Reanalysis calls",
      },
    ],
    [transcriptionSummary],
  );

  const applyFilters = useCallback(
    (nextFilters: Record<string, unknown>) => {
      dispatch(applyCallAnalysisFilters(nextFilters));
    },
    [dispatch],
  );

  useEffect(() => {
    dispatch(runCallAnalysisFetchForRefreshKeyThunk());
  }, [refreshKey, dispatch]);

  const getQualificationActiveLabel = (
    value: string | undefined,
  ): string | undefined => {
    if (value === "qualified") return "Qualified";
    if (value === "unqualified") return "Unqualified";
    return undefined;
  };

  const getFollowUpActiveLabel = (
    value: string | undefined,
  ): string | undefined => {
    if (value === "true") return "Required";
    if (value === "false") return "Not Required";
    return undefined;
  };

  const callDirectionLabel = (value: string): string => {
    if (value === "CALL_OUTGOING") return "Outgoing";
    if (value === "CALL_INCOMING") return "Incoming";
    return "";
  };

  const selectedStartDateTime = String(filters?.start_datetime ?? "");
  const selectedEndDateTime = String(filters?.end_datetime ?? "");

  const tableToolbar = useMemo(
    () => ({
      showTabs: true,
      tabs: [
        {
          id: "call-analysis-title",
          label: "Call Analysis",
          removable: false,
        },
      ],
      activeTab: "call-analysis-title",
      onTabChange: () => {},
      showSearch: true,
      searchValue,
      searchPlaceholder: "Search call recordings...",
      onSearchChange: (value: string) => dispatch(setSearchValue(value)),
      onSearch: () => {
        const st =
          store.getState().callAnalysisList ?? callAnalysisListInitialState;
        dispatch(
          setCallAnalysisPagination({
            ...st.pagination,
            currentPage: 1,
          }),
        );
        dispatch(
          fetchCallAnalysisListThunk({
            page: 1,
            limit: st.pagination.perPage,
            search: st.searchValue.trim(),
          }),
        );
      },
      showFiltersButton: true,
      showFilterPills: true,
      showMoreFiltersButton: false,
      filterPills: [
        {
          id: "direction",
          label: "Direction",
          showDropdown: true,
          active: Boolean(filters.direction),
          activeLabel: callDirectionLabel(String(filters.direction ?? "")),
          onClear: () => applyFilters({ ...filters, direction: "" }),
          dropdownOptions: [
            {
              label: "Outgoing",
              value: "CALL_OUTGOING",
              onClick: () =>
                applyFilters({ ...filters, direction: "CALL_OUTGOING" }),
            },
            {
              label: "Incoming",
              value: "CALL_INCOMING",
              onClick: () =>
                applyFilters({ ...filters, direction: "CALL_INCOMING" }),
            },
          ],
        },
        {
          id: "status",
          label: "Analysis Status",
          showDropdown: true,
          active: Boolean(filters.status),
          activeLabel: filters.status
            ? String(filters.status).toUpperCase()
            : undefined,
          onClear: () => applyFilters({ ...filters, status: "" }),
          dropdownOptions: [
            {
              label: "Queued",
              value: "queued",
              onClick: () => applyFilters({ ...filters, status: "queued" }),
            },
            {
              label: "Transcribing",
              value: "transribing",
              onClick: () =>
                applyFilters({ ...filters, status: "transribing" }),
            },
            {
              label: "Analyzing",
              value: "analyzing",
              onClick: () => applyFilters({ ...filters, status: "analyzing" }),
            },
            {
              label: "Completed",
              value: "completed",
              onClick: () => applyFilters({ ...filters, status: "completed" }),
            },
            {
              label: "Failed",
              value: "failed",
              onClick: () => applyFilters({ ...filters, status: "failed" }),
            },
            {
              label: "Incomplete",
              value: "incomplete",
              onClick: () =>
                applyFilters({ ...filters, status: "incomplete" }),
            },
            {
              label: "Reanalysis",
              value: "reanalysis",
              onClick: () =>
                applyFilters({ ...filters, status: "reanalysis" }),
            },
          ],
        },
        {
          id: "qualified",
          label: "Qualification",
          showDropdown: true,
          active: Boolean(filters.qualified),
          activeLabel: getQualificationActiveLabel(
            filters.qualified as string | undefined,
          ),
          onClear: () => applyFilters({ ...filters, qualified: "" }),
          dropdownOptions: [
            {
              label: "Qualified",
              value: "qualified",
              onClick: () =>
                applyFilters({ ...filters, qualified: "qualified" }),
            },
            {
              label: "Unqualified",
              value: "unqualified",
              onClick: () =>
                applyFilters({ ...filters, qualified: "unqualified" }),
            },
          ],
        },
        {
          id: "follow_up_required",
          label: "Follow Up",
          showDropdown: true,
          active:
            filters.follow_up_required !== undefined &&
            filters.follow_up_required !== "",
          activeLabel: getFollowUpActiveLabel(
            filters.follow_up_required as string | undefined,
          ),
          onClear: () => applyFilters({ ...filters, follow_up_required: "" }),
          dropdownOptions: [
            {
              label: "Required",
              value: "true",
              onClick: () =>
                applyFilters({ ...filters, follow_up_required: "true" }),
            },
            {
              label: "Not Required",
              value: "false",
              onClick: () =>
                applyFilters({ ...filters, follow_up_required: "false" }),
            },
          ],
        },
        {
          id: "sentiment",
          label: "Sentiment",
          showDropdown: true,
          active: Boolean(filters.sentiment),
          activeLabel: filters.sentiment
            ? String(filters.sentiment).charAt(0).toUpperCase() +
              String(filters.sentiment).slice(1)
            : undefined,
          onClear: () => applyFilters({ ...filters, sentiment: "" }),
          dropdownOptions: [
            {
              label: "Positive",
              value: "positive",
              onClick: () =>
                applyFilters({ ...filters, sentiment: "positive" }),
            },
            {
              label: "Neutral",
              value: "neutral",
              onClick: () =>
                applyFilters({ ...filters, sentiment: "neutral" }),
            },
            {
              label: "Negative",
              value: "negative",
              onClick: () =>
                applyFilters({ ...filters, sentiment: "negative" }),
            },
          ],
        },
        {
          id: "main_intent",
          label: "Main Intent",
          showDropdown: true,
          active: Boolean(filters.main_intent),
          activeLabel: filters.main_intent
            ? String(filters.main_intent)
            : undefined,
          onClear: () => applyFilters({ ...filters, main_intent: "" }),
          dropdownOptions: [
            {
              label: "Purchase",
              value: "required",
              onClick: () =>
                applyFilters({ ...filters, main_intent: "required" }),
            },
            {
              label: "Inquiry",
              value: "inquiry",
              onClick: () =>
                applyFilters({ ...filters, main_intent: "inquiry" }),
            },
            {
              label: "Support",
              value: "support",
              onClick: () =>
                applyFilters({ ...filters, main_intent: "support" }),
            },
            {
              label: "Complaint",
              value: "complaint",
              onClick: () =>
                applyFilters({ ...filters, main_intent: "complaint" }),
            },
            {
              label: "Follow-up",
              value: "follow-up",
              onClick: () =>
                applyFilters({ ...filters, main_intent: "follow-up" }),
            },
          ],
        },
        {
          id: "local_parties",
          label: "Extension",
          showDropdown: true,
          searchable: true,
          active:
            Array.isArray(filters.local_parties) &&
            (filters.local_parties as unknown[]).length > 0,
          activeLabel:
            Array.isArray(filters.local_parties) &&
            (filters.local_parties as unknown[]).length > 0
              ? `${(filters.local_parties as unknown[]).length} selected`
              : undefined,
          onClear: () => applyFilters({ ...filters, local_parties: [] }),
          dropdownOptions: hierarchyDataExtensions.map(
            (ext: unknown) => {
              const row = ext as { id?: unknown; name?: unknown };
              const id = unknownScalarToString(row.id);
              const label = unknownScalarToString(row.name) || id;
              return {
                label,
                value: id,
                onClick: () =>
                  applyFilters({ ...filters, local_parties: [id] }),
              };
            },
          ),
        },
      ],
      rightActions: (
        <div className="d-flex align-items-center gap-2 call-analysis-date-range-wrap">
          {selectedStartDateTime &&
            selectedEndDateTime &&
            moment.utc(selectedStartDateTime).isValid() &&
            moment.utc(selectedEndDateTime).isValid() && (
              <div
                className="d-flex align-items-center gap-2 call-analysis-date-chip"
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
                  className="call-analysis-date-text"
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
    }),
    [
      searchValue,
      filters,
      hierarchyDataExtensions,
      dispatch,
      store,
      applyFilters,
      selectedStartDateTime,
      selectedEndDateTime,
    ],
  );

  const clearDownloadState = useCallback((recordingId: string) => {
    setDownloadingRecordings((prev) => {
      const next = new Set(prev);
      next.delete(recordingId);
      return next;
    });
    setDownloadProgress((prev) => {
      const next = { ...prev };
      delete next[recordingId];
      return next;
    });
  }, []);

  const handleDownload = async (props: AnalysisRow) => {
    const uuid = String(props.uuid ?? "");
    const agentExtension = props.local_party_model?.localParty;
    const imagicle = props.imagicle;

    if (!agentExtension) {
      toast.error("Extension number is missing. Please try again later.");
      return;
    }

    setDownloadingRecordings((prev) => new Set(prev).add(uuid));
    setDownloadProgress((prev) => ({ ...prev, [uuid]: 0 }));

    let progressInterval: ReturnType<typeof setInterval> | undefined;
    try {
      progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          const currentProgress = prev[uuid] || 0;
          if (currentProgress < 90) {
            const randomIncrement =
              (crypto.getRandomValues(new Uint8Array(1))[0] / 255) * 15;
            return { ...prev, [uuid]: currentProgress + randomIncrement };
          }
          return prev;
        });
      }, 200);

      await DownloadCallRecording(
        uuid,
        agentExtension,
        "call-logs/recordings/download",
        typeof imagicle === "string" ? imagicle : undefined,
      );

      setDownloadProgress((prev) => ({ ...prev, [uuid]: 100 }));

      const tid = setTimeout(() => {
        pendingDownloadTimeoutsRef.current.delete(tid);
        clearDownloadState(uuid);
      }, 1000);
      pendingDownloadTimeoutsRef.current.add(tid);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
      clearDownloadState(uuid);
    } finally {
      if (progressInterval !== undefined) {
        clearInterval(progressInterval);
      }
    }
  };

  const handleAnalysis = async (props: AnalysisRow) => {
    try {
      const dataObject = {
        uuid: String(props?.uuid ?? ""),
        direction: String(props?.direction ?? ""),
        phone: String(props?.local_party_model?.localParty ?? ""),
        imagicle: String(props?.imagicle ?? ""),
        duration: String(props?.duration ?? ""),
        dateTime: String(props?.datetime ?? ""),
        dateOnly: props?.datetime
          ? moment(String(props.datetime)).format("YYYY-MM-DD")
          : "",
        remotePartyNumber: String(props?.remoteParty ?? ""),
        ownerUsername: String(props?.local_party_model?.ownerUser ?? ""),
        localPartyNumber: String(props?.local_party_model?.localParty ?? ""),
      };

      const encodedData = encodeAnalysisData(dataObject);
      const tempUrl = `/ai-ml/analysis/new?data=${encodeURIComponent(encodedData)}`;
      globalThis.open(tempUrl, "_blank");
    } catch {
      // navigation / encoding
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
            Accept: "audio/*, application/octet-stream, */*",
          },
          signal: controller.signal,
        },
      );

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

  const handlePlayRecording = (recording: AnalysisRow) => {
    if (
      !recording?.uuid ||
      !recording?.local_party_model?.localParty ||
      !recording?.imagicle
    ) {
      toast.error("Recording data is not complete. Please try again later.");
      return;
    }

    const trackId = String(recording.uuid);
    const agentExtension = String(recording.local_party_model.localParty);
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

  const renderModalBody = () => {
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
            <i className="ph-duotone ph-warning-circle" aria-hidden="true" />{" "}
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
          title={`Call Recording - ${selectedRecording?.uuid ?? ""}`}
          showWaveform={true}
          autoPlay={true}
        />
      </div>
    );
  };

  const tableColumns: TableColumn<AnalysisRow>[] = useMemo(
    () => [
      {
        key: "datetime",
        label: "Date",
        sortable: true,
        render: (row) => (
          <div style={{ textTransform: "uppercase" }}>
            {convertDateTimeWithOffsetToLocal(
              String(row.datetime ?? ""),
              undefined,
              GlobalDateFormat,
            )}
          </div>
        ),
      },
      {
        key: "datetime_time",
        label: "Time",
        sortable: false,
        render: (row) => (
          <div>
            {convertDateTimeWithOffsetToLocal(
              String(row.datetime ?? ""),
              undefined,
              GlobalTimeFormat,
            )}
          </div>
        ),
      },
      {
        key: "local_party_model",
        label: "Extension",
        sortable: false,
        render: (row) => (
          <div>{row.local_party_model?.localParty ?? ""}</div>
        ),
      },
      { key: "remoteParty", label: "Remote Number", sortable: true },
      {
        key: "direction",
        label: "Direction",
        sortable: true,
        render: (row) => {
          const direction = row.direction;
          const badgeClass =
            direction === "CALL_INCOMING"
              ? "badge bg-success"
              : "badge bg-primary";
          return (
            <span
              className={badgeClass}
              style={{ textTransform: "uppercase" }}
            >
              {direction === "CALL_INCOMING" ? "Incoming" : "Outgoing"}
            </span>
          );
        },
      },
      {
        key: "duration",
        label: "Duration",
        sortable: true,
        render: (row) => (
          <div>
            {formatDuration(
              Number.parseInt(String(row.duration ?? "0"), 10) / 10000000 ||
                0,
            )}
          </div>
        ),
      },
      {
        key: "qualification",
        label: "Qualification",
        sortable: true,
        render: (row) => {
          const analysis = row.analysis as
            | { qualified?: boolean }
            | undefined;
          const qualified = analysis?.qualified === true;
          return (
            <Badge bg={qualified ? "success" : "warning"}>
              {qualified ? "Qualified" : "Unqualified"}
            </Badge>
          );
        },
      },
      {
        key: "follow_up",
        label: "Follow Up",
        sortable: false,
        render: (row) => {
          const analysisBlock = row.analysis as
            | { analysis?: { follow_up_required?: boolean } }
            | undefined;
          const followUpRequired = analysisBlock?.analysis?.follow_up_required;
          if (followUpRequired === true) return "Required";
          if (followUpRequired === false) return "Not Required";
          return "N/A";
        },
      },
      {
        key: "sentiment",
        label: "Sentiment",
        sortable: false,
        render: (row) => {
          const analysisBlock = row.analysis as
            | { analysis?: { sentiment?: string } }
            | undefined;
          return <>{analysisBlock?.analysis?.sentiment ?? "N/A"}</>;
        },
      },
      {
        key: "main_topic",
        label: "Main Intent",
        sortable: false,
        render: (row) => {
          const analysisBlock = row.analysis as
            | { classification?: { main_topic?: string } }
            | undefined;
          return <>{analysisBlock?.classification?.main_topic ?? "N/A"}</>;
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row) => {
          const status = String(row.status ?? "").toLowerCase();
          switch (status) {
            case "complete":
            case "completed":
              return <Badge bg="success">Completed</Badge>;
            case "in_progress":
              return <Badge bg="info">In Progress</Badge>;
            case "incomplete":
              return <Badge bg="warning">Incomplete</Badge>;
            case "queued":
              return <Badge bg="secondary">Queued</Badge>;
            default:
              return (
                <Badge bg="secondary">{row.status || "Unknown"}</Badge>
              );
          }
        },
      },
      {
        key: "message",
        label: "Message",
        sortable: false,
        render: (row) => <>{row.message ?? "N/A"}</>,
      },
    ],
    [],
  );

  const recordingActions: TableAction<AnalysisRow>[] = [
    {
      label: "Actions",
      render: (row) => {
        const id = String(row.uuid ?? "");
        return (
          <div className="d-flex gap-3 action-box">
            <button
              type="button"
              className="btn btn-link p-0 border-0 text-info"
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
              {downloadingRecordings.has(id) ? (
                <CircularProgressCircle
                  progress={downloadProgress[id] || 0}
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
                  className="btn btn-link p-0 border-0 text-info"
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
              )}
            </div>
            <button
              type="button"
              className="btn btn-link p-0 border-0 text-info"
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
          </div>
        );
      },
    },
  ];

  return (
    <React.Fragment>
      {session?.user?.permissions?.includes("transcriptions-analysis-aiml") && (
        <GenericTable<AnalysisRow>
          data={tableData as AnalysisRow[]}
          columns={tableColumns}
          actions={recordingActions}
          actionsLabel="Action"
          loading={tableLoading}
          emptyMessage="No call analysis records found."
          loadingMessage="Loading call analysis..."
          showToolbar={true}
          toolbar={tableToolbar}
          showToolbarActions={false}
          statsCards={statsCardsData}
          metricsGridMinWidth="160px"
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.perPage,
            totalRows: pagination.totalRows,
            pageSizeOptions: [10, 15, 25, 50, 100],
          }}
          onPaginationChange={(page, rowsPerPage) => {
            const st =
          store.getState().callAnalysisList ?? callAnalysisListInitialState;
            dispatch(
              setCallAnalysisPagination({
                ...st.pagination,
                currentPage: page,
                perPage: rowsPerPage,
              }),
            );
            dispatch(
              fetchCallAnalysisListThunk({
                page,
                limit: rowsPerPage,
                search: st.searchValue.trim(),
              }),
            );
          }}
          sortable={true}
          hover={true}
          striped={false}
          uniqueKey="uuid"
        />
      )}

      <Modal show={mediaPlayerModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Playing a Call Recording</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecording && (
            <div className="text-center d-flex flex-column align-items-center">
              {renderModalBody()}
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

export default CallAnalysisView;
