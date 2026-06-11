import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Row, Col, Card, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useAnalysisSSE } from '@hooks/useAnalysisSSE';
import { resolveChatTenantIdFromSession } from '@components/main-settings/ai-chatbot-settings/resolveChatTenantId';

// Components
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import { TextSkeleton, ListSkeleton } from '@components/skeletons';
import { formatDuration, decodeAnalysisData } from '@utils/Helper';
import axiosInstance from '@utils/axios';

// Assets
import imgStatus1 from '@assets/images/widget/img-status-1.svg';
import imgStatus3 from '@assets/images/widget/img-status-3.svg';
import avatar from '@assets/images/user/avatar-3.jpg';

// Styles
import '@assets/scss/datatable-style.scss';
import '@assets/scss/aiml.scss';
import '@assets/scss/chat.scss';
import '@assets/scss/audio-player.scss';
import '@assets/scss/tabs.scss';
import '@assets/scss/analysis-new.scss';

// Constants
const UNABLE_TO_ANALYZE_CALL = 'Unable to process request at this moment. Please try again later.';
const STEP_CODES = {
  TRANSCRIPTION: '001',
  ANALYSIS: '002',
  QUALIFICATION_FIELDS: '003',
  CLASSIFICATION: '004',
  SUMMARY: '005',
  LEAD_QUALITY: '006',
  BUYER_INTENT: '007',
  FEEDBACK: '008',
  TRANSLATIONS: '009',
  FROM_DATABAE:'100'
} as const;

const TRANSCRIPTION_SPEAKER_1 = 'Speaker 1';
const TRANSCRIPTION_SPEAKER_2 = 'Speaker 2';

interface SummaryData {
  summary: string;
  interaction_type: string;
  main_topic: string;
  tags: Array<{
    [key: string]: any;
  }>;
}

interface Transcription {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

const CallAnalysis = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const tenantId = useMemo(
    () => resolveChatTenantIdFromSession(session?.user),
    [session?.user],
  );
  
  // Analysis state
  const [chunksAnalysisData, setChunksAnalysisData] = useState<any>({
    summary: '',
    main_topic: '',
    interaction_type: '',
    analysis: [],
    extracted_qualification_fields: null,
    qualified:false,
    call_categories: [],
    transcriptions: [],
    sentiment: '',
    resolution_status: '',
    customer_intent: '',
    key_topics: [],
    action_items: [],
    entities_customer: [],
    customer_emotions: [],
    operator_emotions: [],
    follow_up_required: false,
    tags: [],
  });

  const [tagsArrayProcessing, setTagsArrayProcessing] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [validAnalysis, setValidAnalysis] = useState(true);
  const [callTranslation, setCallTranslation] = useState(false);
  
  // Step tracking state
  const [steps, setSteps] = useState<Array<{ step: string; message: string; status: string; timestamp: number }>>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  
  // Call parameters state
  const [uuid, setUuid] = useState('');
  const [date, setDate] = useState('');
  const [localPartyNumber, setLocalPartyNumber] = useState('');
  const [remotePartyNumber, setRemotePartyNumber] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [imagicle, setImagicle] = useState('');
  const [callType, setCallType] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<string | null>(null);
  const [callDurationFormatted, setCallDurationFormatted] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState('');
  
  // Audio state
  const [audioTrackId, setAudioTrackId] = useState('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [playingSegment, setPlayingSegment] = useState<{ start: number; end: number } | null>(null);
  const [mediaPlayerShow, setMediaPlayerShow] = useState(false);

  // Translation state
  const [translations, setTranslations] = useState<any | null>(null);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [subActiveTab, setSubActiveTab] = useState('en');



  // Refs
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const audioStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions
  const normalizeStep = (step: string) => step.toLowerCase().trim();
  
  // Data access helpers
  const getAnalysis = () => chunksAnalysisData?.analysis;
  const hasData = (data: any) => data !== null && data !== undefined;
  const hasArrayData = (arr: any) => Array.isArray(arr) && arr.length > 0;
  const capitalizeFirst = (str: string) => {
    if (!str) return '';
    return str.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };
  
  // Customer entity helpers
  const getCustomerEntity = () => {
    const analysis = getAnalysis();
    return analysis?.entities_customer?.[0];
  };
  
  const hasCustomerName = () => !!getCustomerEntity()?.name;
  const hasCustomerPhone = () => !!getCustomerEntity()?.phone;

  const updateStepInList = (
    prevSteps: Array<{ step: string; message: string; status: string; timestamp: number }>,
    stepEntry: { step: string; message: string; status: string; timestamp: number }
  ) => {
    const currentStepNormalized = normalizeStep(stepEntry.step);
    const existingIndex = prevSteps.findIndex(s => normalizeStep(s.step) === currentStepNormalized);
    
    let updated = [...prevSteps];
    
    if (existingIndex >= 0) {
      updated[existingIndex] = stepEntry;
    } else {
      updated = [...prevSteps, stepEntry];
    }
    
    // Mark previous steps as done when a new step becomes active
    if ((stepEntry.status === 'processing' || stepEntry.status === 'connecting' || stepEntry.status === 'connected') && updated.length > 1) {
      const currentIndex = existingIndex >= 0 ? existingIndex : updated.length - 1;
      for (let i = 0; i < currentIndex; i++) {
        if (updated[i].status !== 'done' && updated[i].status !== 'error') {
          updated[i] = { ...updated[i], status: 'done' };
        }
      }
    }
    
    return updated;
  };

  const handleStepDataUpdate = (stepCode: string, result: any) => {
    // Normalize stepCode to string for comparison
    const normalizedStepCode = String(stepCode).trim();
    //console.log('handleStepDataUpdate - stepCode:', stepCode, 'normalized:', normalizedStepCode);
    //console.log('handleStepDataUpdate - result:', result);
    
    // Initialize tags array and merge lead_quality, buyer_intent, and feedback
    
    
    // Set tags if we have any
    // if(tagsArray.length > 0){
    //   updates.tags = tagsArray;
    // }
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
    setCallTranslation(true);
     
    
    // Update step status if step field exists
    if (parsedData.step) {
      const stepEntry = {
        step: parsedData.step,
        message: parsedData.message || 'Completed',
        status: 'done',
        timestamp: Date.now()
      };
      
      setSteps((prev: Array<{ step: string; message: string; status: string; timestamp: number }>) => {
        const currentStepNormalized = normalizeStep(parsedData.step);
        const existingIndex = prev.findIndex((s: { step: string; message: string; status: string; timestamp: number }) => normalizeStep(s.step) === currentStepNormalized);
        
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
    //console.log('Done status - Full result:', result);
    
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
    setSteps((prev: Array<{ step: string; message: string; status: string; timestamp: number }>) => prev.map((s: { step: string; message: string; status: string; timestamp: number }) => ({ ...s, status: 'done' })));

    
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
      setSteps((prev: Array<{ step: string; message: string; status: string; timestamp: number }>) => prev.map((s: { step: string; message: string; status: string; timestamp: number }) => 
        s.step === currentStep ? { ...s, status: 'error', message: errorMessage } : s
      ));
    } else if (parsedData.step) {
      const stepEntry = {
        step: parsedData.step,
        message: errorMessage,
        status: 'error',
        timestamp: Date.now()
      };
      setSteps((prev: Array<{ step: string; message: string; status: string; timestamp: number }>) => {
        const existingIndex = prev.findIndex((s: { step: string; message: string; status: string; timestamp: number }) => s.step === parsedData.step);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = stepEntry;
          return updated;
        }
        return [...prev, stepEntry];
      });
      setCurrentStep(parsedData.step);
    } else {
      setSteps((prev: Array<{ step: string; message: string; status: string; timestamp: number }>) => {
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
    error: socketError,
    lastMessage: socketMessage,
    parametersReady: socketParametersReady,
    connect: connectSocket,
    disconnect: disconnectSocket
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
    tenantId,

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
          //console.log('Parsed string data to JSON:', parsedData);
        } catch (e) {
          console.error('Failed to parse string data:', e);
          return;
        }
      }

     // console.log('SSE message received in component:', parsedData);

      // UNIVERSAL STEP TRACKING: Handle ALL events with a step field first
      // This ensures every event with a step is captured, regardless of type/status
      if (parsedData.step) {
        const stepEntry = {
          step: parsedData.step,
          message: parsedData.message || '',
          status: parsedData.status || 'processing',
          timestamp: Date.now()
        };
        
        setSteps((prev: Array<{ step: string; message: string; status: string; timestamp: number }>) => updateStepInList(prev, stepEntry));
        
        // Set current step if it's processing or connecting
        if (parsedData.status === 'processing' || parsedData.status === 'connecting' || parsedData.status === 'connected') {
          setCurrentStep(parsedData.step);
        }
      }

      // Update data based on step code whenever we have result and step_code, regardless of status or step field
      // This handles cases where step_code and result are present but step field might be missing
      if (parsedData.result && parsedData.step_code) {
        // Update data based on step code
        //console.log('parsedData.stepcode '.concat(parsedData.step_code), 'type:', typeof parsedData.step_code);
        //console.log('parsedData.result '.concat(JSON.stringify(parsedData.result)), parsedData.result);
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
      

 


  // Extract data from URL parameters
  useEffect(() => {
    if (!router.isReady) return;

    try {
      // Check for new encoded data format first, then fallback to old format for backward compatibility
      const { data, id, file, direction, phone, imagicle, duration, dateTime } = router.query;
      
      let decodedId = '';
      let decodedFile = '';
      let decodedDirection = '';
      let decodedPhone = '';
      let decodedImagicle = '';
      let decodedDuration = '';
      let decodedDateTime = '';
      let decodedDateOnly = '';
      let decodedRemotePartyNumber = '';
      let decodedOwnerUsername = '';
      let decodedLocalPartyNumber = '';
      // If encoded data exists, decode it
      if (data) {
        try {
          // Decode using helper function
          const dataObject = decodeAnalysisData(data as string);

          console.log('dataObject', dataObject);
          decodedId = dataObject.uuid;
          decodedDirection = dataObject.direction;
          decodedPhone = dataObject.phone;
          decodedImagicle = dataObject.imagicle;
          decodedDuration = dataObject.duration; 
          decodedDateTime = dataObject.dateTime;
          decodedDateOnly = dataObject.dateOnly;
          decodedRemotePartyNumber = dataObject.remotePartyNumber;
          
          // decodedOwnerUsername = dataObject.ownerUsername;
          // decodedLocalPartyNumber = dataObject.localPartyNumber;

          decodedOwnerUsername = dataObject.localPartyNumber;
          decodedLocalPartyNumber = dataObject.ownerUsername;

        } catch (decodeError) {
          console.error('Error decoding encoded data:', decodeError);
          
        }
      } else {
        // Fallback to old format for backward compatibility
        
      }
      
      // Set basic parameters
      if (decodedId) {
        setAudioTrackId(decodedId);
        setUuid(decodedId);
      }
      if (decodedDirection) {
        setCallType(decodedDirection);
      }
      if (decodedPhone) {
        setLocalPartyNumber(decodedPhone);
      }

      if(decodedRemotePartyNumber){
        setRemotePartyNumber(decodedRemotePartyNumber);
      }

      if (decodedImagicle) {
        setImagicle(decodedImagicle);
      }
      if (decodedDuration) {
        const formatedDuration = formatDuration(parseInt(decodedDuration)/10000000);
        setCallDurationFormatted(formatedDuration as string);
        setCallDuration(decodedDuration);
      }

      if (decodedDateTime) {
        setDateTime(decodedDateTime);
      }
      
      // Parse file path for additional parameters
     
        
        // Set extracted parameters
        setLocalPartyNumber(decodedLocalPartyNumber);
        setOwnerUsername(decodedOwnerUsername);
        setDate(decodedDateOnly);
        
        // Trigger analysis
        handleGetCallAnalysisWithData(decodedDateOnly, decodedLocalPartyNumber, decodedOwnerUsername, decodedId, decodedImagicle,decodedDateTime,decodedDuration,decodedDirection,decodedPhone,decodedRemotePartyNumber);
      
    } catch (error) {
      console.error('Error parsing URL data:', error);
    }
  }, [router.isReady, router.query.data]);

  // Load audio when uuid changes
  useEffect(() => {
    if (audioTrackId) {
      loadAuthenticatedAudio(audioTrackId);
    }
    
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(audioUrl);
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

  const handleGetCallAnalysisWithData = async (dateParam: string, localPartyNumberParam: string, ownerUsernameParam: string, uuidParam: string, imagicleParam: string, dateTimeParam: string, durationParam: string, directionParam: string, phoneParam: string, remotePartyNumberParam: string) => {
    // Set the parameters
    setUuid(uuidParam);
    setDate(dateParam);
    setLocalPartyNumber(localPartyNumberParam);
    setOwnerUsername(ownerUsernameParam);
    setImagicle(imagicleParam);

    if (dateTimeParam) {
      setDateTime(dateTimeParam);
    }
    if (durationParam) {
      setCallDuration(durationParam);
    }
    if (directionParam) {
      setCallType(directionParam);
    }
    if (remotePartyNumberParam) {
      setRemotePartyNumber(remotePartyNumberParam);
    }
    // Set loading state
    setLoading(true);
    setError(null);
    setAnalysisComplete(false);
    
    // Reset steps for new analysis
    setSteps([]);
    setCurrentStep(null);
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
        const audioUrl = window.URL.createObjectURL(blob);
        setAudioUrl(audioUrl);
        setMediaPlayerShow(true);
       // console.log('Audio loaded successfully via axiosInstance');
      } else {
        setMediaPlayerShow(false);
        setAudioError(`Unexpected response status: ${response.status}`);
        //console.log('Unexpected response status:', response.status);
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
      //console.log('=== AUDIO LOADING COMPLETE ===');
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

  const renderAnalysisForm = () => (
    <Row className="mb-1">
      <Col md={12}>


        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Analysis Parameters</h5>
              {/* {socketConnected && (
                <span className="badge bg-success">
                  <i className="ti ti-wifi me-1"></i>
                  Connected
                </span>
              )}
              {socketConnecting && (
                <span className="badge bg-warning">
                  <Spinner animation="border" size="sm" className="me-1" />
                  Connecting...
                </span>
              )}
              {socketError && (
                <span className="badge bg-danger">
                  <i className="ti ti-wifi-off me-1"></i>
                  Connection Error
                </span>
              )} */}
            </div>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleFormSubmit}>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>UUID</Form.Label>
                    <Form.Control
                      type="text"
                      value={uuid}
                      onChange={(e) => setUuid(e.target.value)}
                      placeholder="Enter UUID"
                      autoFocus
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="Enter Date"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      value={localPartyNumber}
                      onChange={(e) => setLocalPartyNumber(e.target.value)}
                      placeholder="Enter Extension"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Extension</Form.Label>
                    <Form.Control
                      type="text"
                      value={ownerUsername}
                      onChange={(e) => setOwnerUsername(e.target.value)}
                      placeholder="Enter Username"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Node</Form.Label>
                    <Form.Control
                      type="text"
                      value={imagicle}
                      onChange={(e) => setImagicle(e.target.value)}
                      placeholder="Enter Node"
                      required
                    />
                  </Form.Group>
                </Col>
               
              </Row>
              <Row>
                <Col md={12}>
                  <div className="d-flex justify-content-end">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={loading || socketConnecting}
                      className="me-2"
                    >
                      {socketConnecting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Connecting...
                        </>
                      ) : loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Call'
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline-secondary"
                      onClick={() => {
                        // Clear form values
                        setUuid('');
                        setLocalPartyNumber('');
                        setOwnerUsername('');
                        setDate('');
                        
                        // Clear all analysis data
                        
                        setCallDurationFormatted(null);
                        setAnalysisComplete(false);
                        
                        // Clear loading and error states
                        setLoading(false);
                        setError(null);
                        
                        // Clear step tracking
                        setSteps([]);
                        setCurrentStep(null);
                        
                        // Clear audio data
                        setAudioUrl('');
                        setMediaPlayerShow(false);
                        setAudioError(null);
                        setPlayingSegment(null);
                        
                        // Stop any playing audio
                        if (audioPlayerRef.current) {
                          audioPlayerRef.current.pause();
                        }
                        if (audioStopTimeoutRef.current) {
                          clearTimeout(audioStopTimeoutRef.current);
                          audioStopTimeoutRef.current = null;
                        }
                      }}
                      className="me-2"
                    >
                      Reset
                    </Button>
                    
                    
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderCustomerInfo = () => {
    const analysis = getAnalysis();
    const customerEntity = getCustomerEntity();
    const followUpRequired = analysis?.follow_up_required;
    
    return (
      <Row>
        <Col md={12}>
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Customer Information</h5>
            </div>
            <div className="card-body">
              <Row className="between">
                {hasData(followUpRequired) ? (
                  <Col>
                    <div className="callType">
                      <div className={`ic_box ${followUpRequired ? 'bg-success' : 'bg-danger'}`}>
                        <i className={`material-icons-two-tone ${followUpRequired ? 'check' : 'close'}`} />
                      </div>
                      <div className="desc">
                        <small className="card-title">Follow Up Required</small>
                        <h5 className="card-text">{followUpRequired ? 'Yes' : 'No'}</h5>
                      </div>
                    </div>
                  </Col>
                ) : (
                  <Col>
                    <div className="callType">
                      <div className="desc">
                        <small className="card-title">Follow Up Required</small>
                        {!analysisComplete ? <TextSkeleton lines={1} /> : <p className="text-muted">No data available</p>}
                      </div>
                    </div>
                  </Col>
                )}

                {callType ? (
                  <Col>
                    <div className="callType">
                      <div className="ic_box bg-success">
                        <i className="material-icons-two-tone">call</i>
                      </div>
                      <div className="desc">
                        <small className="card-title">Call Type</small>
                        <h5 className="card-text">{callType}</h5>
                      </div>
                    </div>
                  </Col>
                ) : (
                  <Col>
                    <div className="callType">
                      <div className="desc">
                        <small className="card-title">Call Type</small>
                        <TextSkeleton lines={1} />
                      </div>
                    </div>
                  </Col>
                )}

                {/* {hasCustomerName() ? (
                  <Col>
                    <div className="callType">
                      <div className="desc">
                        <small className="card-title">Customer Name</small>
                        <h5 className="card-text">{customerEntity?.name}</h5>
                      </div>
                    </div>
                  </Col>
                ) : (
                  <Col>
                    <div className="callType">
                      <div className="desc">
                        <small className="card-title">Customer Name</small>
                        <TextSkeleton lines={1} />
                      </div>
                    </div>
                  </Col>
                )} */}

<Col>
                    <div className="callType">
                      <div className="desc">
                        <small className="card-title">Phone Number</small>
                        <h5 className="card-text">{remotePartyNumber}</h5>
                      </div>
                    </div>
                  </Col>

                <Col>
                  <div className="callType">
                    <div className="desc">
                      <small className="card-title">Call Duration</small>
                      {callDurationFormatted ? (
                        <h5 className="card-text">{callDurationFormatted}</h5>
                      ) : (
                        <div className="card-text"><TextSkeleton lines={1} /></div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>
    );
  };

  const renderSummaryCards = () => {
    const analysis = getAnalysis();
    const resolutionStatus = analysis?.resolution_status;
    const sentiment = analysis?.sentiment;
    const summary = chunksAnalysisData?.summary;
    const customerIntent = analysis?.customer_intent;
    const qualified = chunksAnalysisData?.qualified;
      const hasCompletionPercent = chunksAnalysisData?.completion_percent !== undefined && 
      chunksAnalysisData.completion_percent !== null;
    const completionPercent = hasCompletionPercent ? chunksAnalysisData.completion_percent : 0;
    
    return (
      <Row>
        <Col md={6}>
          <div className="card" style={{ backgroundImage: `url(${imgStatus1.src})` }}>
            <div className="card-body box1 gbox">
              <div className="vbox w-100">
                <h5>Resolution Status</h5>
                <div className="card-text">
                  {hasData(resolutionStatus) ? (
                    <h6>{capitalizeFirst(resolutionStatus)}</h6>
                  ) : (
                    <>
                    {!analysisComplete && <TextSkeleton lines={1} />}
                    {analysisComplete && <p className="text-muted">No data available</p>}
                    </>
                  )}
                </div>
              </div>

              <div className="vbox w-100">
                <h5>Sentiment</h5>
                <div className="card-text">
                  {hasData(sentiment) ? (
                    <h6>{capitalizeFirst(sentiment)}</h6>
                  ) : (
                    <>
                    {!analysisComplete && <TextSkeleton lines={1} />}
                    {analysisComplete && <p className="text-muted">No data available</p>}
                    </>
                  )}
                </div>
              </div>

              <div className="vbox w-100">
                <h5>Main Intention</h5>
                <div className="card-text">
                  {chunksAnalysisData?.main_topic && chunksAnalysisData.main_topic.trim().length > 0 ? (
                    <h6>{chunksAnalysisData.main_topic}</h6>
                  ) : (
                    <>
                    {!analysisComplete && <TextSkeleton lines={1} />}
                    {analysisComplete && <p className="text-muted">No data available</p>}
                    </>

                  )}
                </div>
              </div>

              <div className="vbox w-100">
                <h5>Summary</h5>
                <div className="card-text">
                  {hasData(summary) ? (
                    <h6>{summary}</h6>
                  ) : (
                    <>
                    {!analysisComplete && <TextSkeleton lines={2} lastLineWidth="70%" />}
                    {analysisComplete && <p className="text-muted">No data available</p>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col md={6}>
          <Row>
            <Col md={12}>
              <div className={`card ${qualified ? 'bg-success' : 'bg-danger'}`}
                   style={{ backgroundImage: `url(${imgStatus3.src})` }}>
                <div className="card-body gbox">
                  <div className="vbox">
                    <h6 className="text-white">Overall Assessment</h6>
                  </div>
                  <div className="vbox">
                    {hasData(qualified) ? (
                      <p className="card-text text-white size2">{qualified ? 'Qualified' : 'Unqualified'}</p>
                    ) : (
                      <div className="card-text text-white size2">
                        <>
                        {!analysisComplete && <TextSkeleton lines={1} />}
                        {analysisComplete && <p className="text-muted">No data available</p>}
                        </>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6}>
              <div className="card">
                <div className="card-body gbox">
                  <h5>Completion Percent</h5>
                  {hasCompletionPercent ? (
                    
                    <>
                    <p className="card-text size2 text-bold">{completionPercent}%</p>
                    <div className="progress mb-3 progress-thin">
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar" 
                      style={{ width: `${completionPercent}%` }}
                      aria-valuenow={completionPercent}
                      aria-valuemin={0} 
                      aria-valuemax={100}
                    />
                  </div>
                    </>
                  ) : (
                    <div className="card-text size2 text-bold d-block w-100">
                      <>
                      {!analysisComplete && <TextSkeleton lines={2} />}
                      {analysisComplete && <p className="text-muted">No data available</p>}
                      </>
                      </div>
                  )}
                  
                  
                </div>
              </div>
            </Col>

            <Col md={6}>
              <div className="card">
                <div className="card-body gbox">
                  <div className="vbox">
                    <h5>Customer Intention</h5>
                  </div>
                  <div className="vbox w-100">
                    {customerIntent ? (
                      <div className="card-text size2">
                        <h6>{customerIntent.charAt(0).toUpperCase() + customerIntent.slice(1)}</h6>
                      </div>
                    ) : (
                      <div className="card-text d-block w-100">
                        <>
                        {!analysisComplete && <TextSkeleton lines={2} />}
                        {analysisComplete && <p className="text-muted">No data available</p>}
                        </>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  };

  const renderEmotionsAndTopics = () => {
    const analysis = getAnalysis();
    const customerEmotions = analysis?.customer_emotions;
    const operatorEmotions = analysis?.operator_emotions;
    const keyTopics = analysis?.key_topics;
    const actionItems = analysis?.action_items;
    const callCategories = analysis?.call_categories;
    const qualificationFields = chunksAnalysisData?.extracted_qualification_fields;
    const hasQualificationFields = qualificationFields && Object.entries(qualificationFields).length > 0;
    
    return (
      <Row>
        <Col md={7}>
          <Row>
            <Col md={7}>
              <div className="card">
                <div className="card-body gbox gbox3">
                  <Row className="w-100">
                    <Col md={6}>
                      <div className="vbox">
                        <h5 className="mb-3">Customer Emotions</h5>
                      </div>
                      <div className="card-text">
                        {hasArrayData(customerEmotions) ? (
                          customerEmotions.map((emotion: any, index: number) => (
                            <div className="text-capitalize me-2" key={index}>
                              <div className="emo_text">{emotion}</div>
                            </div>
                          ))
                        ) : (
                          <>
                          {!analysisComplete && <ListSkeleton items={3} />}
                          {analysisComplete && <p className="text-muted">No data available</p>}
                          </>
                          
                        )}
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="vbox">
                        <h5 className="mb-3">Operator Emotions</h5>
                        <div className="card-text">
                          {hasArrayData(operatorEmotions) ? (
                            operatorEmotions.map((emotion: any, index: number) => (
                              <div className="text-capitalize me-2" key={index}>
                                <div className="emo_text">{emotion}</div>
                              </div>
                            ))
                          ) : (
                            <>
                            {!analysisComplete && <ListSkeleton items={3} />}
                            {analysisComplete && <p className="text-muted">No data available</p>}
                            </>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>

            <Col md={5}>
              <div className="card">
                <div className="card-body gbox gbox3">
                  <div className="vbox">
                    <h5 className="mb-3">Key Topics</h5>
                  </div>
                  <div className="vbox w-100">
                    <div className="card-text">
                      {hasArrayData(keyTopics) ? (
                        keyTopics.map((item: any, index: number) => (
                          <div className="mb-2 callType" key={index}>
                            <div className="ic_box bg-success">
                              <i className="material-icons-two-tone">check</i>
                            </div>
                            <div>
                              <h6 className="card-text text-capitalize font-weight-normal">{item}</h6>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                        {!analysisComplete && <ListSkeleton items={3} />}
                        {analysisComplete && <p className="text-muted">No data available</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <div className="card">
                <div className="card-body gbox">
                  <h5 className="card-title">Tags</h5>
                  <div className="card-text w-100">
                    {hasArrayData(chunksAnalysisData?.tags) ? (
                      <table className="table-bordered table-sm w-100">
                        <thead>
                          <tr>
                            
                            <th>Name</th>
                            <th>Percentage</th>
                            <th className="text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chunksAnalysisData?.tags?.map((item: any, index: number) => {
                            const isTrue = item.status === true;
                            return (
                              <tr key={index}>
                                 <td className="text-capitalize">
                                <div className="d-flex align-items-center gap-2">
                                <div className="tboxIn"> 
                                    <div className={`ic_box small ${isTrue ? 'bg-success' : 'bg-danger'}`}>
                                      <i className={`material-icons-two-tone`}>
                                        {isTrue ? 'check' : 'close'}
                                      </i>
                                    </div>
                                  </div>
                                  <div>{item.name || 'N/A'}</div>
                                  </div>
                                </td>
                                <td className="text-capitalize">
                                  {item.percentage || 'N/A'}
                                </td>
                                <td className="text-capitalize">
                                  {item.description || 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <>
                      {!analysisComplete && <TextSkeleton lines={3}  />}
                      {analysisComplete && <p className="text-muted">No data available</p>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <div className="card">
                <div className="card-body gbox vboxStyleTwo">
                  <div className="vbox">
                    <h5 className="mb-3">Details Summary</h5>
                  </div>
                  <div className="vbox w-100">
                    <div className="card-text">
                      {!hasData(chunksAnalysisData?.summary) ? (
                        <>
                        {!analysisComplete && <TextSkeleton lines={4} lastLineWidth="70%" />}
                        {analysisComplete && <p className="text-muted">No data available</p>}
                        </>
                      ) : (
                        <p>{chunksAnalysisData.summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Col>

        <Col md={5}>
          <Row>
            <Col md={12}>
              <div className="card">
                <div className="card-body gbox">
                  <h5 className="card-title">Qualification Fields</h5>
                  <div className="card-text w-100">
                    {hasQualificationFields ? (
                      <table className="table-bordered table-sm w-100">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th className="text-center">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(qualificationFields).map(([key, value], index: number) => (
                            <tr key={index}>
                              <td>{key}</td>
                              <td className="text-capitalize text-center">{value === "null" ? "-" : String(value as string)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <>
                      {!analysisComplete && <TextSkeleton lines={6}  />}
                      {analysisComplete && <p className="text-muted">No data available</p>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={12}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Action Items</h5>
                  {hasArrayData(actionItems) ? (
                    actionItems.map((item: any, index: number) => (
                      <div className="tagOuter" key={index}>
                        <div className="tagIcon bg-success">
                          <i className="material-icons-two-tone">check</i>
                        </div>
                        <div className="tagVal">
                          <h6 className="card-text text-capitalize">{item}</h6>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                    {!analysisComplete && <TextSkeleton lines={3} />}
                    {analysisComplete && <p className="text-muted">No data available</p>}
                    </>

                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-body gbox vboxStyleTwo">
                  <div className="vbox">
                    <h5 className="mb-3">Categories</h5>
                  </div>
                  <div className="vbox w-100">
                    <div className="card-text">
                      {hasArrayData(callCategories) ? (
                        callCategories.map((item: any, index: number) => (
                          <div className="mb-2 callType" key={index}>
                            <div className="ic_box bg-success">
                              <i className="material-icons-two-tone">check</i>
                            </div>
                            <div>
                              <h6 className="card-text text-capitalize font-weight-normal">{item}</h6>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                        {!analysisComplete && <TextSkeleton lines={3} />}
                        {analysisComplete && <p className="text-muted">No data available</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  };

  const renderTranscript = () => (
    <Row>
      <Col md={12}>
        <div className="card">
          <div className="card-body">
            <div className="transcript">
              <Row>
                <Col md={12}>
                  <div className={`mb-4 mediaPlayerOuter ${mediaPlayerShow ? 'show' : 'd-none'}`}>
                    {audioLoading ? (
                      <div className="text-center p-4">
                        <Spinner animation="border" role="status">
                          <span className="visually-hidden">Loading audio...</span>
                        </Spinner>
                        <p className="mt-2">Loading audio file...</p>
                      </div>
                    ) : audioError ? (
                      <Alert variant="warning" className="text-center">
                        <Alert.Heading>Audio Loading Error</Alert.Heading>
                        <p>{audioError}</p>
                        <hr />
                        <div className="d-flex justify-content-end gap-2">
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => {
                              setAudioError(null);
                              loadAuthenticatedAudio();
                            }}
                          >
                            Retry
                          </Button>
                        </div>
                      </Alert>
                    ) : mediaPlayerShow ? (
                      <AudioPlayer 
                        ref={audioPlayerRef}
                        audioSrc={getAudioFilePath()}
                        title={`Call Recording - ${uuid}`}
                        showWaveform={false}
                      />
                    ) : (
                      <Alert variant="info" className="text-center">
                        <Alert.Heading>No Audio Available</Alert.Heading>
                        <p>Audio file is not available for this call recording.</p>
                      </Alert>
                    )}
                  </div>
                </Col>
              </Row>

              {chunksAnalysisData?.transcriptions && chunksAnalysisData.transcriptions.length > 0 && chunksAnalysisData.transcriptions.map((transcriptItem: Transcription, index: number) => (
                <div key={index}>
                  {chunksAnalysisData.transcriptions[index].speaker ===TRANSCRIPTION_SPEAKER_1 ? (
                    <Row>
                      <Col md={6}>
                        <div className="message-in">
                          <div className="d-flex">
                            <div className="flex-shrink-0">
                              <div className="chat-avtar">
                                <img className="rounded-circle img-fluid wid-40" src={avatar.src} alt="User image" />
                                <i className="chat-badge bg-success"></i>
                              </div>
                            </div>
                            <div className="flex-grow-1 mx-3">
                              <div className="d-flex align-items-start flex-column">
                                {/* <p className="mb-1 text-muted"><small>Operator</small></p> */}
                                <div className="message d-flex align-items-start flex-column">
                                  <div className="d-flex align-items-center mb-1 chat-msg">
                                    <div className="flex-grow-1 me-3">
                                      <div className="msg-content card mb-0">
                                        <p className="mb-0">{transcriptItem.text}</p>
                                        {transcriptItem.start && transcriptItem.end && mediaPlayerShow && (
                                          <p className="text-primary mb-0">
                                            <span 
                                              className="time-stamp cursor-pointer" 
                                              onClick={() => {
                                                const isCurrentlyPlaying = playingSegment && 
                                                  playingSegment.start === transcriptItem.start && 
                                                  playingSegment.end === transcriptItem.end;
                                                if (isCurrentlyPlaying) {
                                                  handleStopAudio();
                                                } else {
                                                  handleTimeClick(transcriptItem.start, transcriptItem.end);
                                                }
                                              }}
                                            >
                                              <i className={`ti ${playingSegment && 
                                                playingSegment.start === transcriptItem.start && 
                                                playingSegment.end === transcriptItem.end 
                                                ? 'ti-player-pause' 
                                                : 'ti-player-play'}`} 
                                                title={playingSegment && 
                                                  playingSegment.start === transcriptItem.start && 
                                                  playingSegment.end === transcriptItem.end 
                                                  ? 'Stop' 
                                                  : 'Listen'} />
                                              {playingSegment && 
                                                playingSegment.start === transcriptItem.start && 
                                                playingSegment.end === transcriptItem.end 
                                                ? 'Stop' 
                                                : 'Listen'}
                                            </span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  ) : (
                    <Row>
                      <Col md={6}></Col>
                      <Col md={6}>
                        <div className="message-out">
                          <div className="d-flex align-items-end flex-column">
                            {/* <p className="mb-1 text-muted"><small>Customer</small></p> */}
                            <div className="message d-flex align-items-end flex-column">
                              <div className="d-flex align-items-center mb-1 chat-msg">
                                <div className="flex-grow-1 ms-3">
                                  <div className="msg-content card bg-primary">
                                    <p className="mb-0 text-white">{transcriptItem.text}</p>
                                    {transcriptItem.start && transcriptItem.end && mediaPlayerShow && (
                                      <p className="text-white mb-0">
                                        <span 
                                          className="time-stamp cursor-pointer time-stamp-padding" 
                                          onClick={() => {
                                            const isCurrentlyPlaying = playingSegment && 
                                              playingSegment.start === transcriptItem.start && 
                                              playingSegment.end === transcriptItem.end;
                                            if (isCurrentlyPlaying) {
                                              handleStopAudio();
                                            } else {
                                              handleTimeClick(transcriptItem.start, transcriptItem.end);
                                            }
                                          }}
                                        >
                                          <i className={`ti ${playingSegment && 
                                            playingSegment.start === transcriptItem.start && 
                                            playingSegment.end === transcriptItem.end 
                                            ? 'ti-player-pause' 
                                            : 'ti-player-play'}`} 
                                            title={playingSegment && 
                                              playingSegment.start === transcriptItem.start && 
                                              playingSegment.end === transcriptItem.end 
                                              ? 'Stop' 
                                              : 'Listen'} />
                                          {playingSegment && 
                                            playingSegment.start === transcriptItem.start && 
                                            playingSegment.end === transcriptItem.end 
                                            ? 'Stop' 
                                            : 'Listen'}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
  
  const renderTranslate = () => (
    <Row>
      <Col md={12}>
      

            {chunksAnalysisData?.translations  && (
            <Row>
                <Col md={12}>
                   
                      <>
                     
                       <Tabs
                       defaultActiveKey="calls_chart"
                       id="system-tabs"
                       className="mb-3 justify-content-center"
                       activeKey={subActiveTab}
                       onSelect={(k) => setSubActiveTab(k || 'en')}
                  >
                      <Tab eventKey="en" title="English">
                          <p style={{whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
    fontSize: '20px'
}}>{chunksAnalysisData?.translations?.en}</p>
                      </Tab>
                      <Tab eventKey="ar" title="Arabic">
                          <p style={{whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
    fontSize: '20px'
}}>{chunksAnalysisData?.translations?.ar}</p>
                      </Tab>
                      <Tab eventKey="ur" title="Urdu">
                          <p style={{whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
    fontSize: '20px'
}}>{chunksAnalysisData?.translations?.ur}</p>
                      </Tab>
                      <Tab eventKey="hi" title="Hindi">
                          <p style={{whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
    fontSize: '20px'
}}>{chunksAnalysisData?.translations?.hi}</p>
                      </Tab>
                      </Tabs>
                      </>
                  
                   
                    
                        
                </Col>
            </Row>
            )}
      </Col>
    </Row>
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Analysis" />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <Row className="align-items-center">
              <Col md={3}>
                <h2 className="mb-0 d-flex align-items-center">Call Analysis</h2>
              </Col>
              <Col md={9} className="text-end">
                {/* Connection status hidden for cleaner UI */}
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Always show the form */}
      {renderAnalysisForm()}
      
      {/* Show steps progress */}
      
      {!error  && (
        <Row className="mb-3">
          <Col md={12}>
            <Card>
               <Card.Header className="py-2">
                <h6 className="card-title mb-0">Analysis Progress</h6>
              </Card.Header>
              <Card.Body className="py-2">
                {steps.length === 0 && !error ? (
                  <div className="text-center p-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Initializing analysis...</span>
                  </div>
                ) : (
                  <div className="analysis-progress-container">
                    <div className="analysis-progress-wrapper">
                      {steps.map((stepEntry, index) => {
                        const isActive = stepEntry.step === currentStep && stepEntry.status === 'processing';
                        const isCompleted = stepEntry.status === 'done';

                        const isError = stepEntry.status === 'error';
                        const isLast = index === steps.length - 1;
                        const prevCompleted = index > 0 && steps[index - 1]?.status === 'done';
                        
                        return (
                          <React.Fragment key={`${stepEntry.step}-${stepEntry.timestamp}-${index}`}>
                            <div 
                              className="analysis-progress-step-wrapper"
                              style={{ 
                                flex: `1 1 ${100 / steps.length}%`,
                                maxWidth: `${100 / steps.length}%`
                              }}
                            >
                              <div 
                                className={`analysis-progress-step ${
                                  isActive ? 'active' : 
                                  isCompleted ? 'done' : 
                                  isError ? 'error' : 
                                  'pending'
                                }`}
                              >
                                <div className="step-indicator-wrapper">
                                  <div 
                                    className={`step-circle ${
                                      isActive ? 'active' : 
                                      isCompleted ? 'done' : 
                                      isError ? 'error' : 
                                      'pending'
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <i className="ti ti-check"></i>
                                    ) : isError ? (
                                      <i className="ti ti-x"></i>
                                    ) : isActive ? (
                                      <Spinner animation="border" size="sm" variant="light" />
                                    ) : (
                                      <span className="step-number">{index + 1}</span>
                                    )}
                                  </div>
                                  {!isLast && (
                                    <div 
                                      className={`step-connector ${
                                        isCompleted || prevCompleted ? 'completed' : ''
                                      }`}
                                    />
                                  )}
                                </div>
                                <div className="step-content">
                                  <div className="step-title">
                                    {stepEntry.step.replace(/_/g, ' ')}
                                  </div>
                                  {stepEntry.message && (
                                    <div className="step-message">
                                      {stepEntry.message || stepEntry.step.replace(/_/g, ' ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <style>{`
                      .analysis-progress-container {
                        padding: 0.5rem 0;
                      }
                      
                      .analysis-progress-wrapper {
                        display: flex;
                        align-items: flex-start;
                        gap: 0.25rem;
                        padding: 0.5rem 0;
                        width: 100%;
                      }
                      
                      .analysis-progress-step-wrapper {
                        flex: 1 1 auto;
                        padding: 0 0.15rem;
                        min-width: 0;
                      }
                      
                      .analysis-progress-step {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        position: relative;
                        transition: all 0.3s ease;
                      }
                      
                      .step-indicator-wrapper {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        position: relative;
                        margin-bottom: 0.4rem;
                        min-height: 32px;
                        justify-content: center;
                      }
                      
                      .step-circle {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 0.85rem;
                        position: relative;
                        z-index: 2;
                        transition: all 0.3s ease;
                        flex-shrink: 0;
                        margin: 0 auto;
                      }
                      
                      .step-circle.pending {
                        background: #e9ecef;
                        color: #6c757d;
                        border: 2px solid #ced4da;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                      }
                      
                      .step-circle.active {
                        background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%);
                        color: white;
                        border: 2px solid #0a58ca;
                        box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.2), 0 2px 8px rgba(13, 110, 253, 0.3);
                        animation: pulse-ring 2s infinite;
                      }
                      
                      .step-circle.done {
                        background: linear-gradient(135deg, #198754 0%, #146c43 100%);
                        color: white;
                        border: 2px solid #146c43;
                        box-shadow: 0 2px 8px rgba(25, 135, 84, 0.25);
                      }
                      
                      .step-circle.error {
                        background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
                        color: white;
                        border: 2px solid #b02a37;
                        box-shadow: 0 2px 8px rgba(220, 53, 69, 0.25);
                      }
                      
                      .step-circle i {
                        font-size: 1rem;
                      }
                      
                      .step-number {
                        font-size: 0.9rem;
                        font-weight: 700;
                      }
                      
                      .step-connector {
                        position: absolute;
                        height: 2px;
                        width: calc(100% + 0.25rem);
                        left: calc(50% + 16px);
                        top: 50%;
                        transform: translateY(-50%);
                        background: #dee2e6;
                        border-radius: 1px;
                        transition: all 0.3s ease;
                        z-index: 1;
                      }
                      
                      .step-connector.completed {
                        background: linear-gradient(90deg, #198754 0%, #20c997 100%);
                      }
                      
                      .step-content {
                        text-align: center;
                        width: 100%;
                        padding: 0;
                      }
                      
                      .step-title {
                        font-weight: 600;
                        font-size: 0.75rem;
                        line-height: 1.2;
                        margin-bottom: 0.1rem;
                        text-transform: capitalize;
                        word-break: break-word;
                        transition: color 0.3s ease;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      }
                      
                      .analysis-progress-step.pending .step-title {
                        color: #6c757d;
                      }
                      
                      .analysis-progress-step.active .step-title {
                        color: #0d6efd;
                        font-weight: 700;
                      }
                      
                      .analysis-progress-step.done .step-title {
                        color: #198754;
                        font-weight: 600;
                      }
                      
                      .analysis-progress-step.error .step-title {
                        color: #dc3545;
                        font-weight: 600;
                      }
                      
                      .step-message {
                        font-size: 0.65rem;
                        color: #6c757d;
                        line-height: 1.2;
                        margin-top: 0.1rem;
                        word-break: break-word;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      }
                      
                      @keyframes pulse-ring {
                        0% {
                          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.2), 0 2px 8px rgba(13, 110, 253, 0.3);
                        }
                        50% {
                          box-shadow: 0 0 0 6px rgba(13, 110, 253, 0.15), 0 2px 10px rgba(13, 110, 253, 0.4);
                        }
                        100% {
                          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.2), 0 2px 8px rgba(13, 110, 253, 0.3);
                        }
                      }
                      
                      @media (max-width: 768px) {
                        .step-circle {
                          width: 28px;
                          height: 28px;
                          font-size: 0.75rem;
                        }
                        
                        .step-circle i {
                          font-size: 0.85rem;
                        }
                        
                        .step-title {
                          font-size: 0.7rem;
                        }
                        
                        .step-message {
                          font-size: 0.6rem;
                        }
                        
                        .step-indicator-wrapper {
                          min-height: 28px;
                          margin-bottom: 0.3rem;
                        }
                      }
                      
                      @keyframes skeleton-loading {
                        0% {
                          background-position: 200% 0;
                        }
                        100% {
                          background-position: -200% 0;
                        }
                      }
                    `}</style>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Interactive Status Blocks - User-friendly progress messages */}
      {!error  && steps.length > 0 && (
        <Row className="mb-3">
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center flex-grow-1">
                    {currentStep && steps.find(s => s.step === currentStep && s.status === 'processing') ? (
                      <>
                        <div className="me-3">
                          <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <span className="badge bg-primary bg-opacity-10 text-primary me-2 px-2 py-1">
                              <i className="ti ti-brain me-1"></i>
                              Processing...
                            </span>
                            <span className="text-muted small text-capitalize">
                              {steps.find(s => s.step === currentStep)?.message || 
                               `${currentStep.replace(/_/g, ' ').toLowerCase()}...`}
                            </span>
                          </div>
                          <div className="skeleton-container mt-2">
                            <div className="skeleton-text" style={{ height: '8px', width: '100%', animationDelay: '0s' }} />
                            <div className="skeleton-text" style={{ height: '8px', width: '75%', animationDelay: '0.1s' }} />
                          </div>
                        </div>
                      </>
                    ) : steps.some(s => s.status === 'done') && !currentStep ? (
                      <>
                        <div className="me-3">
                          <i className="ti ti-check-circle text-success icon-large"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 text-success fw-bold">Analysis Complete</h6>
                          <p className="text-muted small mb-0">All steps have been processed successfully. Review the results below.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="me-3">
                          <Spinner animation="border" size="sm" variant="secondary" className="me-2" />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">Preparing Analysis</h6>
                          <p className="text-muted small mb-0">Initializing analysis pipeline...</p>
                        </div>
                      </>
                    )}
                  </div>
                  {/* {currentStep && (
                    <div className="text-end ms-3">
                      <div className="badge bg-info bg-opacity-10 text-info px-3 py-2">
                        <i className="ti ti-info-circle me-1"></i>
                        Step: {steps.findIndex(s => s.step === currentStep) + 1} of {steps.length}
                      </div>
                    </div>
                  )} */}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Detailed Step Information Card */}
      {/* {currentStep && steps.find(s => s.step === currentStep) && (
        <Row className="mb-3">
          <Col md={12}>
            <Card className="border-0 shadow-sm bg-light">
              <Card.Body className="py-3">
                <div className="d-flex align-items-start">
                  <div className="me-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center avatar-medium">
                      <i className="ti ti-cpu text-primary"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-2">
                      {steps.find(s => s.step === currentStep)?.step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h6>
                    {steps.find(s => s.step === currentStep)?.message && (
                      <p className="text-muted small mb-2">
                        {steps.find(s => s.step === currentStep)?.message}
                      </p>
                    )}
                    <div className="d-flex align-items-center gap-3">
                      <span className="badge bg-primary bg-opacity-10 text-primary">
                        <i className="ti ti-clock me-1"></i>
                        {steps.find(s => s.step === currentStep)?.status === 'processing' ? 'In Progress' : 
                         steps.find(s => s.step === currentStep)?.status === 'done' ? 'Completed' : 'Pending'}
                      </span>
                      {steps.find(s => s.step === currentStep)?.timestamp && (
                        <span className="text-muted small">
                          Started: {new Date(steps.find(s => s.step === currentStep)?.timestamp || 0).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )} */}
      
      {/* Show error if any - after progress bar */}
      {error && (
        <Row className="mb-3">
          <Col md={12}>
            <Alert variant="danger">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
            </Alert>
          </Col>
        </Row>
      )}
      
      {!error && validAnalysis && (
        <div className="analysis-container">
        {/* {loading ? (
          <Row>
           
            <Col md={12}>
              <div className="text-center p-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading analysis...</span>
                </Spinner>
                <p className="mt-3">Loading call analysis...</p>
              </div>
            </Col>
          </Row>
        ) : (validAnalysis) ? ( */}
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'summary')} id="system-tabs" className="mb-3">
            <Tab eventKey="summary" title="Summary">
            
            {validAnalysis && (
              <>
                {renderCustomerInfo()}
                {renderSummaryCards()}
                {renderEmotionsAndTopics()}
              </>
            )}
            </Tab>
            
            <Tab eventKey="transcript" title="Transcript">
              {renderTranscript()}
            </Tab>

            <Tab eventKey="translate" title="Translate">
              {renderTranslate()}
            </Tab>


          </Tabs>
        {/* // ) : (
        //   <></>
        // )} */}
      </div>
      )}

    </React.Fragment>
  );
};

CallAnalysis.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallAnalysis;
