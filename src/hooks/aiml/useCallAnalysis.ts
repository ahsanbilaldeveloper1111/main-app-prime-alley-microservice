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

type RouterQueryRaw = string | string[] | undefined;

type UrlDecodedAnalysisFields = {
  id: string;
  direction: string;
  phone: string;
  imagicle: string;
  duration: string;
  dateTime: string;
  dateOnly: string;
  ownerUsername: string;
  localPartyNumber: string;
};

function emptyUrlDecodedFields(): UrlDecodedAnalysisFields {
  return {
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
}

function getFirstRouterQueryString(raw: RouterQueryRaw): string | undefined {
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return undefined;
}

function decodeUrlAnalysisEncodedPayload(encoded: string | undefined): UrlDecodedAnalysisFields {
  if (!encoded) {
    return emptyUrlDecodedFields();
  }
  try {
    const dataObject = decodeAnalysisData(encoded);
    return {
      id: dataObject.uuid,
      direction: dataObject.direction,
      phone: dataObject.phone,
      imagicle: dataObject.imagicle,
      duration: dataObject.duration,
      dateTime: dataObject.dateTime,
      dateOnly: dataObject.dateOnly,
      ownerUsername: dataObject.localPartyNumber,
      localPartyNumber: dataObject.ownerUsername,
    };
  } catch (decodeError) {
    console.error("Error decoding encoded data:", decodeError);
    return emptyUrlDecodedFields();
  }
}

function shouldStartCallAnalysisFromDecodedUrl(
  data: string | undefined,
  decoded: UrlDecodedAnalysisFields,
): boolean {
  return Boolean(
    data &&
      decoded.id &&
      (decoded.dateOnly || decoded.localPartyNumber || decoded.ownerUsername),
  );
}

function buildCallAnalysisParamsFromDecoded(decoded: UrlDecodedAnalysisFields): CallAnalysisWithDataParams {
  return {
    dateParam: decoded.dateOnly,
    localPartyNumberParam: decoded.localPartyNumber,
    ownerUsernameParam: decoded.ownerUsername,
    uuidParam: decoded.id,
    imagicleParam: decoded.imagicle,
    dateTimeParam: decoded.dateTime,
    durationParam: decoded.duration,
    directionParam: decoded.direction,
    phoneParam: decoded.phone,
  };
}

function applyDecodedDurationState(
  durationRaw: string,
  setFormatted: (v: string | null) => void,
  setRaw: (v: string | null) => void,
) {
  const formatted = formatDuration(Number.parseInt(durationRaw, 10) / 10000000) as string;
  setFormatted(formatted);
  setRaw(durationRaw);
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
    const normalizedStepCode = String(stepCode).trim();
    switch (normalizedStepCode) {
      case STEP_CODES.TRANSCRIPTION:
       
        if (result.transcription !== undefined && result.transcription !== null) {
          setChunksAnalysisData((prev: any) => ({ ...prev, transcriptions: result.transcription }));
        } 
        break;

      case STEP_CODES.ANALYSIS:
        if (result.analysis !== undefined) {
          setChunksAnalysisData((prev: any) => ({ ...prev, analysis: result.analysis }));
        }
        break;

      case STEP_CODES.QUALIFICATION_FIELDS:
        if (result.extracted_qualification_fields !== undefined) {
          setChunksAnalysisData((prev: any) => ({ ...prev, extracted_qualification_fields: result.extracted_qualification_fields }));
        }
        if (result.qualified !== undefined) {
          setChunksAnalysisData((prev: any) => ({ ...prev, qualified: result.qualified }));
        }

        //completion_percent
        if (result.completion_percent !== undefined) {
          setChunksAnalysisData((prev: any) => ({ ...prev, completion_percent: result.completion_percent }));
        }
        break;

      case STEP_CODES.CLASSIFICATION:
        if (result.classification !== undefined) {
          setChunksAnalysisData((prev: any) => ({ ...prev, main_topic: result.classification?.main_topic }));
        }
        break;

      case STEP_CODES.SUMMARY:
        if (result.summary !== undefined) {
          setChunksAnalysisData((prev: any) => ({ ...prev, summary: result.summary?.summary }));
        }
        break;

        case STEP_CODES.LEAD_QUALITY:
          if(result.lead_quality !== undefined && result.lead_quality !== null){
            const tempLeadQuality = {
              status: result.lead_quality.good_lead ?? false,
              name: 'Good Lead',
              percentage: result.lead_quality.good_lead_percentage ?? 'N/A',
              description: result.lead_quality.good_lead_description ?? 'N/A',
            };
            setChunksAnalysisData((prev: any) => ({ ...prev, tags: [...prev.tags, tempLeadQuality] }));
          }
          break;

          case STEP_CODES.BUYER_INTENT:
            // // Convert buyer_intent object to tags format
            if(result.buyer_intent !== undefined && result.buyer_intent !== null){
              
              const tempFastBuyer = {
                status: result.buyer_intent.fast_buyer ?? false,
                name: 'Fast Buyer',
                percentage: result.buyer_intent.fast_buyer_percentage ?? 'N/A',
                description: result.buyer_intent.fast_buyer_description ?? 'N/A',
              };
              const tempBigBudgetBuyer = {
                status: result.buyer_intent.big_budget_buyer ?? false,
                name: 'Big Budget Buyer',
                percentage: result.buyer_intent.big_budget_buyer_percentage ?? 'N/A',
                description: result.buyer_intent.big_budget_buyer_description ?? 'N/A',
              };
              const tempNotALead = {
                status: result.buyer_intent.not_a_lead ?? false,
                name: 'Not a Lead',
                percentage: result.buyer_intent.not_a_lead_percentage ?? 'N/A',
                description: result.buyer_intent.not_a_lead_description ?? 'N/A',
              };
    
              setChunksAnalysisData((prev: any) => ({ ...prev, tags: [...prev.tags, tempFastBuyer, tempBigBudgetBuyer, tempNotALead] }));
            }
            break;


            case STEP_CODES.FEEDBACK:
              // // Convert feedback object to tags format
             if(result.feedback !== undefined && result.feedback !== null){
       
               const tempFeedback = {
                 status: result.feedback.negative_feedback ?? false,
                 name: 'Negative Feedback',
                 percentage: result.feedback.negative_feedback_percentage ?? 'N/A',
                 description: result.feedback.negative_feedback_description ?? 'N/A',
               };
               setChunksAnalysisData((prev: any) => ({ ...prev, tags: [...prev.tags, tempFeedback] }));
             }
               break;

      case STEP_CODES.TRANSLATIONS:
        if (result.translations !== undefined) {
          setChunksAnalysisData((prev: any) => ({ ...prev, translations: result.translations }));
        }
        break;

      default:
        console.log('Unknown step code:', stepCode);
        break;
    }
  };

  const handleDoneStatus = (parsedData: any) => {
    setLoading(false);
    // Update step status if step field exists
    if (parsedData.step) {
      const stepEntry = {
        step: parsedData.step,
        message: parsedData.message || 'Completed',
        status: 'done',
        timestamp: Date.now()
      };
      
      setSteps((prev: AnalysisStepEntry[]) => {
        const currentStepNormalized = normalizeStep(parsedData.step);
        const existingIndex = prev.findIndex((s: AnalysisStepEntry) => normalizeStep(s.step) === currentStepNormalized);
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = stepEntry;
          return updated;
        }
        return [...prev, stepEntry];
      });
    }
    
    if (!parsedData.result) {
      console.warn('Status is done but result is missing:', parsedData);
      return;
    }
    
    const result = parsedData.result;
    
    // Build update object with all available data in a single update
    const updates: any = {};
    
    if(result.transcription !== undefined && result.transcription !== null){
      updates.transcriptions = result.transcription;
    }
    if(result.analysis !== undefined && result.analysis !== null){
      updates.analysis = result.analysis;
    }
    if(result.extracted_qualification_fields !== undefined && result.extracted_qualification_fields !== null){
      updates.extracted_qualification_fields = result.extracted_qualification_fields;
    }
    if(result.qualified !== undefined && result.qualified !== null){
      updates.qualified = result.qualified;
    }
    if(result.completion_percent !== undefined && result.completion_percent !== null){
      updates.completion_percent = result.completion_percent;
    }
    if(result.classification !== undefined && result.classification !== null){
      updates.main_topic = result?.classification?.main_topic;
    }
    if(result.summary !== undefined && result.summary !== null){
      updates.summary = result.summary?.summary;
    }
    
    // Initialize tags array and merge lead_quality, buyer_intent, and feedback
    const tagsArray: any[] = [];
    
    // Convert lead_quality object to tags format
    if(result.lead_quality !== undefined && result.lead_quality !== null){
      const tempLeadQuality = {
        status: result.lead_quality.good_lead ?? false,
        name: 'Good Lead',
        percentage: result.lead_quality.good_lead_percentage ?? 'N/A',
        description: result.lead_quality.good_lead_description ?? 'N/A',
      };
      tagsArray.push(tempLeadQuality);
    }
    
    // Convert buyer_intent object to tags format
    if(result.buyer_intent !== undefined && result.buyer_intent !== null){
      const tempFastBuyer = {
        status: result.buyer_intent.fast_buyer ?? false,
        name: 'Fast Buyer',
        percentage: result.buyer_intent.fast_buyer_percentage ?? 'N/A',
        description: result.buyer_intent.fast_buyer_description ?? 'N/A',
      };
      const tempBigBudgetBuyer = {
        status: result.buyer_intent.big_budget_buyer ?? false,
        name: 'Big Budget Buyer',
        percentage: result.buyer_intent.big_budget_buyer_percentage ?? 'N/A',
        description: result.buyer_intent.big_budget_buyer_description ?? 'N/A',
      };
      const tempNotALead = {
        status: result.buyer_intent.not_a_lead ?? false,
        name: 'Not a Lead',
        percentage: result.buyer_intent.not_a_lead_percentage ?? 'N/A',
        description: result.buyer_intent.not_a_lead_description ?? 'N/A',
      };
      
      tagsArray.push(tempFastBuyer, tempBigBudgetBuyer, tempNotALead);
    }
    
    // Convert feedback object to tags format
    if(result.feedback !== undefined && result.feedback !== null){
      const tempFeedback = {
        status: result.feedback.negative_feedback ?? false,
        name: 'Negative Feedback',
        percentage: result.feedback.negative_feedback_percentage ?? 'N/A',
        description: result.feedback.negative_feedback_description ?? 'N/A',
      };
      tagsArray.push(tempFeedback);
    }

    if(result.translation !== undefined && result.translation !== null){
      updates.translations = result.translation?.translations || [];
    }
    
    // Set tags if we have any
    if(tagsArray.length > 0){
      updates.tags = tagsArray;
    }

    
    
    // Apply all updates in a single state update
    if(Object.keys(updates).length > 0){
     
      setChunksAnalysisData((prev: any) => ({ ...prev, ...updates }));
    } else {
      console.warn('No valid updates found in result:', result);
    }
    // Handle analysis errors
    if (result.analysis && result.analysis.error) {
      console.error('Analysis error:', result.analysis.error);
      setError(UNABLE_TO_ANALYZE_CALL);
      setLoading(false);
      setAnalysisComplete(true);
      
    } else {
      setValidAnalysis(true);
    }

    
    setLoading(false);
    setAnalysisComplete(true);
    setCurrentStep(null);
    
    // Mark all steps as done
    setSteps((prev: AnalysisStepEntry[]) => prev.map((s: AnalysisStepEntry) => ({ ...s, status: 'done' })));

    
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
      setSteps((prev: AnalysisStepEntry[]) => {
        if (prev.length > 0) {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], status: 'error', message: errorMessage };
          return updated;
        }
        return prev;
      });
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
      const data = getFirstRouterQueryString(router.query.data);
      const decoded = decodeUrlAnalysisEncodedPayload(data);

      if (decoded.id) {
        setAudioTrackId(decoded.id);
        setUuid(decoded.id);
      }
      if (decoded.direction) {
        setCallType(decoded.direction);
      }
      if (decoded.phone) {
        setLocalPartyNumber(decoded.phone);
        setRemotePartyNumber(decoded.phone);
      }
      if (decoded.imagicle) {
        setImagicle(decoded.imagicle);
      }
      if (decoded.duration) {
        applyDecodedDurationState(decoded.duration, setCallDurationFormatted, setCallDuration);
      }
      if (decoded.dateTime) {
        setDateTime(decoded.dateTime);
      }

      if (shouldStartCallAnalysisFromDecodedUrl(data, decoded)) {
        void handleGetCallAnalysisWithData(buildCallAnalysisParamsFromDecoded(decoded));
      }
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
