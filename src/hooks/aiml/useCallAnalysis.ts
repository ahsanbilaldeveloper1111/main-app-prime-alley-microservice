import type { AudioPlayerRef } from "@components/AudioPlayer";
import { useAnalysisSSE } from "@hooks/useAnalysisSSE";
import axiosInstance from "@utils/axios";
import { decodeAnalysisData, formatDuration } from "@utils/Helper";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  INITIAL_CHUNKS_ANALYSIS_DATA,
  STEP_CODES,
  UNABLE_TO_ANALYZE_CALL,
} from "@pages/ai-ml/analysis/constants";
import type { AnalysisStepEntry, CallAnalysisWithDataParams } from "@pages/ai-ml/analysis/types";
import {
  normalizeStep,
  updateStepInList,
} from "@pages/ai-ml/analysis/analysisHelpers";

function isDefinedValue<T>(v: T | null | undefined): v is T {
  return v !== undefined && v !== null;
}

/** Normalizes router `router.query.data` to a single string parameter. */
function getRouterQueryString(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.at(0);
  return undefined;
}

type SetChunksAnalysis = React.Dispatch<React.SetStateAction<any>>;

/** Appends Good Lead widget from `lead_quality`, if present. */
function pushLeadQualityTag(result: any, out: unknown[]): void {
  if (!isDefinedValue(result.lead_quality)) return;
  out.push({
    status: result.lead_quality.good_lead ?? false,
    name: "Good Lead",
    percentage: result.lead_quality.good_lead_percentage ?? "N/A",
    description: result.lead_quality.good_lead_description ?? "N/A",
  });
}

function pushBuyerIntentTags(result: any, out: unknown[]): void {
  if (!isDefinedValue(result.buyer_intent)) return;
  const bi = result.buyer_intent;
  out.push(
    {
      status: bi.fast_buyer ?? false,
      name: "Fast Buyer",
      percentage: bi.fast_buyer_percentage ?? "N/A",
      description: bi.fast_buyer_description ?? "N/A",
    },
    {
      status: bi.big_budget_buyer ?? false,
      name: "Big Budget Buyer",
      percentage: bi.big_budget_buyer_percentage ?? "N/A",
      description: bi.big_budget_buyer_description ?? "N/A",
    },
    {
      status: bi.not_a_lead ?? false,
      name: "Not a Lead",
      percentage: bi.not_a_lead_percentage ?? "N/A",
      description: bi.not_a_lead_description ?? "N/A",
    },
  );
}

function pushFeedbackTag(result: any, out: unknown[]): void {
  if (!isDefinedValue(result.feedback)) return;
  out.push({
    status: result.feedback.negative_feedback ?? false,
    name: "Negative Feedback",
    percentage: result.feedback.negative_feedback_percentage ?? "N/A",
    description: result.feedback.negative_feedback_description ?? "N/A",
  });
}

const STEP_RESULT_CHUNK_HANDLERS: Record<
  string,
  (result: any, setChunks: SetChunksAnalysis) => void
> = {
  [STEP_CODES.TRANSCRIPTION]: (result, setChunks) => {
    if (!isDefinedValue(result.transcription)) return;
    setChunks((prev: any) => ({ ...prev, transcriptions: result.transcription }));
  },
  [STEP_CODES.ANALYSIS]: (result, setChunks) => {
    if (result.analysis === undefined) return;
    setChunks((prev: any) => ({ ...prev, analysis: result.analysis }));
  },
  [STEP_CODES.QUALIFICATION_FIELDS]: (result, setChunks) => {
    if (result.extracted_qualification_fields !== undefined) {
      setChunks((prev: any) => ({
        ...prev,
        extracted_qualification_fields: result.extracted_qualification_fields,
      }));
    }
    if (result.qualified !== undefined) {
      setChunks((prev: any) => ({ ...prev, qualified: result.qualified }));
    }
    if (result.completion_percent !== undefined) {
      setChunks((prev: any) => ({ ...prev, completion_percent: result.completion_percent }));
    }
  },
  [STEP_CODES.CLASSIFICATION]: (result, setChunks) => {
    if (result.classification === undefined) return;
    setChunks((prev: any) => ({
      ...prev,
      main_topic: result.classification?.main_topic,
    }));
  },
  [STEP_CODES.SUMMARY]: (result, setChunks) => {
    if (result.summary === undefined) return;
    setChunks((prev: any) => ({ ...prev, summary: result.summary?.summary }));
  },
  [STEP_CODES.LEAD_QUALITY]: (result, setChunks) => {
    if (!isDefinedValue(result.lead_quality)) return;
    const tempLeadQuality = {
      status: result.lead_quality.good_lead ?? false,
      name: "Good Lead",
      percentage: result.lead_quality.good_lead_percentage ?? "N/A",
      description: result.lead_quality.good_lead_description ?? "N/A",
    };
    setChunks((prev: any) => ({ ...prev, tags: [...prev.tags, tempLeadQuality] }));
  },
  [STEP_CODES.BUYER_INTENT]: (result, setChunks) => {
    if (!isDefinedValue(result.buyer_intent)) return;
    const bi = result.buyer_intent;
    const rows = [
      {
        status: bi.fast_buyer ?? false,
        name: "Fast Buyer",
        percentage: bi.fast_buyer_percentage ?? "N/A",
        description: bi.fast_buyer_description ?? "N/A",
      },
      {
        status: bi.big_budget_buyer ?? false,
        name: "Big Budget Buyer",
        percentage: bi.big_budget_buyer_percentage ?? "N/A",
        description: bi.big_budget_buyer_description ?? "N/A",
      },
      {
        status: bi.not_a_lead ?? false,
        name: "Not a Lead",
        percentage: bi.not_a_lead_percentage ?? "N/A",
        description: bi.not_a_lead_description ?? "N/A",
      },
    ];
    setChunks((prev: any) => ({ ...prev, tags: [...prev.tags, ...rows] }));
  },
  [STEP_CODES.FEEDBACK]: (result, setChunks) => {
    if (!isDefinedValue(result.feedback)) return;
    const tempFeedback = {
      status: result.feedback.negative_feedback ?? false,
      name: "Negative Feedback",
      percentage: result.feedback.negative_feedback_percentage ?? "N/A",
      description: result.feedback.negative_feedback_description ?? "N/A",
    };
    setChunks((prev: any) => ({ ...prev, tags: [...prev.tags, tempFeedback] }));
  },
  [STEP_CODES.TRANSLATIONS]: (result, setChunks) => {
    if (result.translations === undefined) return;
    setChunks((prev: any) => ({ ...prev, translations: result.translations }));
  },
};

function mergeDoneStepEntry(
  prev: AnalysisStepEntry[],
  parsedStep: string | undefined,
  message: string,
): AnalysisStepEntry[] {
  if (!parsedStep) return prev;
  const stepEntry = {
    step: parsedStep,
    message: message || "Completed",
    status: "done",
    timestamp: Date.now(),
  };
  const normalizedTarget = normalizeStep(parsedStep);
  const existingIndex = prev.findIndex(
    (s) => normalizeStep(s.step) === normalizedTarget,
  );
  if (existingIndex >= 0) {
    const updated = [...prev];
    updated[existingIndex] = stepEntry;
    return updated;
  }
  return [...prev, stepEntry];
}

/** Builds `{ ...chunks }` patch object from SSE `done` payload `result`. */
function buildChunksUpdatesFromDoneResult(result: any): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if (isDefinedValue(result.transcription)) {
    updates.transcriptions = result.transcription;
  }
  if (isDefinedValue(result.analysis)) {
    updates.analysis = result.analysis;
  }
  if (isDefinedValue(result.extracted_qualification_fields)) {
    updates.extracted_qualification_fields = result.extracted_qualification_fields;
  }
  if (isDefinedValue(result.qualified)) {
    updates.qualified = result.qualified;
  }
  if (isDefinedValue(result.completion_percent)) {
    updates.completion_percent = result.completion_percent;
  }
  if (isDefinedValue(result.classification)) {
    updates.main_topic = result?.classification?.main_topic;
  }
  if (isDefinedValue(result.summary)) {
    updates.summary = result.summary?.summary;
  }

  const tagsArray: unknown[] = [];
  pushLeadQualityTag(result, tagsArray);
  pushBuyerIntentTags(result, tagsArray);
  pushFeedbackTag(result, tagsArray);
  if (tagsArray.length > 0) {
    updates.tags = tagsArray;
  }

  if (isDefinedValue(result.translation)) {
    updates.translations = result.translation?.translations || [];
  }

  return updates;
}

function attachErrorToLastStep(
  prev: AnalysisStepEntry[],
  errorMessage: string,
): AnalysisStepEntry[] {
  if (prev.length === 0) return prev;
  const updated = [...prev];
  const last = updated.at(-1);
  if (last === undefined) return prev;
  updated.splice(-1, 1, { ...last, status: "error", message: errorMessage });
  return updated;
}

type DecodeUrlSnap = Readonly<{
  dataBlob: string | undefined;
  id: string;
  direction: string;
  phone: string;
  imagicle: string;
  duration: string;
  dateTime: string;
  dateOnly: string;
  ownerUsername: string;
  localPartyNumber: string;
}>;

const EMPTY_DECODE: DecodeUrlSnap = {
  dataBlob: undefined,
  id: "",
  direction: "",
  phone: "",
  imagicle: "",
  duration: "",
  dateTime: "",
  dateOnly: "",
  ownerUsername: "",
  localPartyNumber: "",
};

function decodeAnalysisRouterBlob(dataBlob: string | undefined): DecodeUrlSnap {
  if (!dataBlob) return { ...EMPTY_DECODE, dataBlob };
  try {
    const o = decodeAnalysisData(dataBlob);
    console.log("dataObject", o);
    return {
      dataBlob,
      id: o.uuid,
      direction: o.direction,
      phone: o.phone,
      imagicle: o.imagicle,
      duration: o.duration,
      dateTime: o.dateTime,
      dateOnly: o.dateOnly,
      ownerUsername: o.localPartyNumber,
      localPartyNumber: o.ownerUsername,
    };
  } catch (decodeError) {
    console.error("Error decoding encoded data:", decodeError);
    return { ...EMPTY_DECODE, dataBlob };
  }
}

function persistDecodedSnapToCallAnalysisState(
  i: Readonly<{
    snap: DecodeUrlSnap;
    fetchWithParams: (params: CallAnalysisWithDataParams) => Promise<void>;
    setAudioTrackId: React.Dispatch<React.SetStateAction<string>>;
    setUuid: React.Dispatch<React.SetStateAction<string>>;
    setCallType: React.Dispatch<React.SetStateAction<string | null>>;
    setLocalPartyNumber: React.Dispatch<React.SetStateAction<string>>;
    setRemotePartyNumber: React.Dispatch<React.SetStateAction<string>>;
    setImagicle: React.Dispatch<React.SetStateAction<string>>;
    setCallDurationFormatted: React.Dispatch<React.SetStateAction<string | null>>;
    setCallDuration: React.Dispatch<React.SetStateAction<string | null>>;
    setDateTime: React.Dispatch<React.SetStateAction<string>>;
    setOwnerUsername: React.Dispatch<React.SetStateAction<string>>;
    setDate: React.Dispatch<React.SetStateAction<string>>;
  }>,
): void {
  const { snap } = i;
  if (snap.id) {
    i.setAudioTrackId(snap.id);
    i.setUuid(snap.id);
  }
  if (snap.direction) {
    i.setCallType(snap.direction);
  }
  if (snap.phone) {
    i.setLocalPartyNumber(snap.phone);
    i.setRemotePartyNumber(snap.phone);
  }
  if (snap.imagicle) {
    i.setImagicle(snap.imagicle);
  }
  if (snap.duration) {
    const formatted = formatDuration(Number.parseInt(snap.duration, 10) / 10000000);
    i.setCallDurationFormatted(formatted);
    i.setCallDuration(snap.duration);
  }
  if (snap.dateTime) {
    i.setDateTime(snap.dateTime);
  }

  const hasValidDecodedData =
    Boolean(snap.dataBlob) &&
    Boolean(snap.id) &&
    (Boolean(snap.dateOnly) ||
      Boolean(snap.localPartyNumber) ||
      Boolean(snap.ownerUsername));
  if (!hasValidDecodedData) {
    return;
  }

  i.setLocalPartyNumber(snap.localPartyNumber);
  i.setOwnerUsername(snap.ownerUsername);
  i.setDate(snap.dateOnly);
  i.fetchWithParams({
      dateParam: snap.dateOnly,
      localPartyNumberParam: snap.localPartyNumber,
      ownerUsernameParam: snap.ownerUsername,
      uuidParam: snap.id,
      imagicleParam: snap.imagicle,
      dateTimeParam: snap.dateTime,
      durationParam: snap.duration,
      directionParam: snap.direction,
      phoneParam: snap.phone,
    })
    .catch(() => undefined);
}

export function useCallAnalysis() {
  const router = useRouter();
  const [chunksAnalysisData, setChunksAnalysisData] = useState<any>({
    ...INITIAL_CHUNKS_ANALYSIS_DATA,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [validAnalysis, setValidAnalysis] = useState(true);

  const [steps, setSteps] = useState<AnalysisStepEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const [uuid, setUuid] = useState("");
  const [date, setDate] = useState("");
  const [localPartyNumber, setLocalPartyNumber] = useState("");
  const [remotePartyNumber, setRemotePartyNumber] = useState("");
  const [ownerUsername, setOwnerUsername] = useState("");
  const [imagicle, setImagicle] = useState("");
  const [callType, setCallType] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<string | null>(null);
  const [callDurationFormatted, setCallDurationFormatted] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState("");

  const [audioTrackId, setAudioTrackId] = useState("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [playingSegment, setPlayingSegment] = useState<{ start: number; end: number } | null>(null);
  const [mediaPlayerShow, setMediaPlayerShow] = useState(false);

  const [activeTab, setActiveTab] = useState("summary");
  const [subActiveTab, setSubActiveTab] = useState("en");

  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const audioStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStepDataUpdate = (stepCode: string, result: any) => {
    const key = String(stepCode).trim();
    const handler = STEP_RESULT_CHUNK_HANDLERS[key];
    if (handler === undefined) {
      console.log("Unknown step code:", stepCode);
      return;
    }
    handler(result, setChunksAnalysisData);
  };

  const handleDoneStatus = (parsedData: any) => {
    setLoading(false);
    if (parsedData.step) {
      setSteps((prev: AnalysisStepEntry[]) =>
        mergeDoneStepEntry(prev, parsedData.step, parsedData.message ?? ""),
      );
    }

    if (!parsedData.result) {
      console.warn("Status is done but result is missing:", parsedData);
      return;
    }

    const updates = buildChunksUpdatesFromDoneResult(parsedData.result);
    if (Object.keys(updates).length > 0) {
      setChunksAnalysisData((prev: any) => ({ ...prev, ...updates }));
    } else {
      console.warn("No valid updates found in result:", parsedData.result);
    }

    if (parsedData.result.analysis?.error) {
      console.error("Analysis error:", parsedData.result.analysis.error);
      setError(UNABLE_TO_ANALYZE_CALL);
    } else {
      setValidAnalysis(true);
    }

    setLoading(false);
    setAnalysisComplete(true);
    setCurrentStep(null);
    setSteps((prev: AnalysisStepEntry[]) =>
      prev.map((s: AnalysisStepEntry) => ({ ...s, status: "done" })),
    );
    disconnectSocket();
  };

  const handleErrorStatus = (parsedData: any) => {
    console.error('Error status received from server:', parsedData);
    const errorMessage = parsedData.msg || parsedData.message || 'Analysis error occurred';
    setError(errorMessage);
    setLoading(false);
    setAnalysisComplete(true);
    
    // Update step error status
    if (currentStep) {
      setSteps((prev: AnalysisStepEntry[]) => prev.map((s: AnalysisStepEntry) => 
        s.step === currentStep ? { ...s, status: 'error', message: errorMessage } : s
      ));
    } else if (parsedData.step) {
      const stepEntry = {
        step: parsedData.step,
        message: errorMessage,
        status: 'error',
        timestamp: Date.now()
      };
      setSteps((prev: AnalysisStepEntry[]) => {
        const existingIndex = prev.findIndex((s: AnalysisStepEntry) => s.step === parsedData.step);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = stepEntry;
          return updated;
        }
        return [...prev, stepEntry];
      });
      setCurrentStep(parsedData.step);
    } else {
      setSteps((prev: AnalysisStepEntry[]) => attachErrorToLastStep(prev, errorMessage));
    }
    
    disconnectSocket();
  };

  // Server-Sent Events connection to analysis server
  const {
    connected: socketConnected,
    connecting: socketConnecting,
    parametersReady: socketParametersReady,
    connect: connectSocket,
    disconnect: disconnectSocket,
  } = useAnalysisSSE({

    uuid: uuid,
    date: date,
    localPartyNumber: localPartyNumber,
    ownerUsername: ownerUsername,
    imagicle: imagicle,

    callDuration: callDuration?.toString(),
    callType: callType?.toString(),
    remotePartyNumber: remotePartyNumber,
    dateTime: dateTime,

    preventAutoConnect: analysisComplete,
    onMessage: (data) => {
      if (!data) {
        return;
      }

      // Handle case where data might be a string that needs parsing
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse string data:', e);
          return;
        }
      }

      // UNIVERSAL STEP TRACKING: Handle ALL events with a step field first
      // This ensures every event with a step is captured, regardless of type/status
      if (parsedData.step) {
        const stepEntry = {
          step: parsedData.step,
          message: parsedData.message || '',
          status: parsedData.status || 'processing',
          timestamp: Date.now()
        };
        
        setSteps((prev: AnalysisStepEntry[]) => updateStepInList(prev, stepEntry));
        
        // Set current step if it's processing or connecting
        if (parsedData.status === 'processing' || parsedData.status === 'connecting' || parsedData.status === 'connected') {
          setCurrentStep(parsedData.step);
        }
      }

      // Update data based on step code whenever we have result and step_code, regardless of status or step field
      // This handles cases where step_code and result are present but step field might be missing
      if (parsedData.result && parsedData.step_code) {
        handleStepDataUpdate(String(parsedData.step_code), parsedData.result);
      }

      

      // Handle status-specific logic
      if (parsedData.status === 'processing') {
        setLoading(true);
      } else if (parsedData.status === 'done') {
        handleDoneStatus(parsedData);
      } else if (parsedData.status === 'error') {
        handleErrorStatus(parsedData);
      }

      // Handle connection type messages
      if (parsedData.type === 'connection') {
        setLoading(true);
      }
      // Ping messages are handled silently to keep connection alive
    },
    onError: (error) => {
      console.error('Analysis SSE error:', error);
      const errorMessage = error?.msg || error?.message || (typeof error === 'string' ? error : UNABLE_TO_ANALYZE_CALL);
      setError(errorMessage);
      setLoading(false);
      setAnalysisComplete(true); // Prevent auto-reconnect
      // Disconnect socket on error
      disconnectSocket();
      toast.error(errorMessage);
    },
    onOpen: () => {
      setError(null);
    },
    onClose: () => {
      // Connection closed - handled silently
    }
  });
      

  const handleGetCallAnalysisWithData = async (params: CallAnalysisWithDataParams) => {
    setUuid(params.uuidParam);
    setDate(params.dateParam);
    setLocalPartyNumber(params.localPartyNumberParam);
    setOwnerUsername(params.ownerUsernameParam);
    setImagicle(params.imagicleParam);

    if (params.dateTimeParam) {
      setDateTime(params.dateTimeParam);
    }
    if (params.durationParam) {
      setCallDuration(params.durationParam);
    }
    if (params.directionParam) {
      setCallType(params.directionParam);
    }
    if (params.phoneParam) {
      setRemotePartyNumber(params.phoneParam);
    }
    setLoading(true);
    setError(null);
    setAnalysisComplete(false);
    setSteps([]);
    setCurrentStep(null);
  };

  // Extract data from URL parameters
  useEffect(() => {
    if (!router.isReady) return;

    try {
      const snap = decodeAnalysisRouterBlob(getRouterQueryString(router.query.data));

      persistDecodedSnapToCallAnalysisState({
        snap,
        fetchWithParams: handleGetCallAnalysisWithData,
        setAudioTrackId,
        setUuid,
        setCallType,
        setLocalPartyNumber,
        setRemotePartyNumber,
        setImagicle,
        setCallDurationFormatted,
        setCallDuration,
        setDateTime,
        setOwnerUsername,
        setDate,
      });
    } catch (error) {
      console.error("Error parsing URL data:", error);
    }
  }, [router.isReady, router.query.data]);

  // Load audio when uuid changes
  useEffect(() => {
    if (audioTrackId) {
      loadAuthenticatedAudio(audioTrackId);
    }
    
    return () => {
      if (audioUrl?.startsWith("blob:")) {
        globalThis.URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioTrackId]);

  const handleGetCallAnalysis = async () => {
    // Validate required parameters
    if (!uuid || !date || !localPartyNumber || !ownerUsername) {
      toast.error('Please fill in all required fields (UUID, Date, Extension, Username)');
      return;
    }
    
    setLoading(true);
    setError(null);
    setAnalysisComplete(false);
    
    // Reset steps for new analysis
    setSteps([]);
    setCurrentStep(null);
    
    // Connect to WebSocket for analysis
    if (socketParametersReady && !socketConnected && !socketConnecting) {
      connectSocket();
    }
  };

  const loadAuthenticatedAudio = async (trackId?: string) => {
    const currentTrackId = trackId || audioTrackId;
    if (!currentTrackId) return;
    
    setAudioLoading(true);
    setAudioError(null);
    setMediaPlayerShow(false);
  

    
    try {
      const response = await axiosInstance.get(`call-logs/recordings/download/${currentTrackId}?extension_number=${ownerUsername}&node=${imagicle}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'audio/*, application/octet-stream, */*'
        }
      });
      
      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const audioUrl = globalThis.URL.createObjectURL(blob);
        setAudioUrl(audioUrl);
        setMediaPlayerShow(true);
      } else {
        setMediaPlayerShow(false);
        setAudioError(`Unexpected response status: ${response.status}`);
      }
      
    } catch (error: any) {
      console.error('Error loading audio file via axiosInstance:', error);
      
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        console.error('Error response headers:', error.response.headers);
        
        if (error.response.status === 204) {
          setMediaPlayerShow(false);
          setAudioError('Audio file not found (204)');
        } else {
          setMediaPlayerShow(false);
          setAudioError(`Error loading audio: ${error.response.status}`);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        setMediaPlayerShow(false);
        setAudioError('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
        setMediaPlayerShow(false);
        setAudioError(`Request error: ${error.message}`);
      }
    } finally {
      setAudioLoading(false);
    }
  };

  const getAudioFilePath = () => {
    return audioUrl || '';
  };

  const handleTimeClick = (start: number, end: number) => {
    if (audioPlayerRef.current) {
      if (audioStopTimeoutRef.current) {
        clearTimeout(audioStopTimeoutRef.current);
        audioStopTimeoutRef.current = null;
      }
      
      setPlayingSegment({ start, end });
      audioPlayerRef.current.seekTo(start);
      audioPlayerRef.current.play();
      
      const duration = end - start;
      
      audioStopTimeoutRef.current = setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
        setPlayingSegment(null);
      }, duration * 1000);
    } else {
      toast.error('Audio player not ready');
    }
  };

  const handleStopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (audioStopTimeoutRef.current) {
      clearTimeout(audioStopTimeoutRef.current);
      audioStopTimeoutRef.current = null;
    }
    setPlayingSegment(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGetCallAnalysis();
  };
  const resetAnalysisForm = () => {
    setUuid("");
    setLocalPartyNumber("");
    setOwnerUsername("");
    setDate("");
    setCallDurationFormatted(null);
    setAnalysisComplete(false);
    setLoading(false);
    setError(null);
    setSteps([]);
    setCurrentStep(null);
    setAudioUrl("");
    setMediaPlayerShow(false);
    setAudioError(null);
    setPlayingSegment(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (audioStopTimeoutRef.current) {
      clearTimeout(audioStopTimeoutRef.current);
      audioStopTimeoutRef.current = null;
    }
  };

  return {
    chunksAnalysisData,
    loading,
    error,
    analysisComplete,
    validAnalysis,
    steps,
    currentStep,
    uuid,
    setUuid,
    date,
    setDate,
    localPartyNumber,
    setLocalPartyNumber,
    remotePartyNumber,
    setRemotePartyNumber,
    ownerUsername,
    setOwnerUsername,
    imagicle,
    setImagicle,
    callType,
    callDurationFormatted,
    activeTab,
    setActiveTab,
    subActiveTab,
    setSubActiveTab,
    socketConnecting,
    audioPlayerRef,
    mediaPlayerShow,
    audioLoading,
    audioError,
    playingSegment,
    handleFormSubmit,
    resetAnalysisForm,
    handleTimeClick,
    handleStopAudio,
    getAudioFilePath,
    loadAuthenticatedAudio,
    setAudioError,
  };
}
