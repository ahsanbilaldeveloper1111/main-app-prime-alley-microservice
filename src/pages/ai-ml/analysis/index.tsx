import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Row, Col, Card, Button, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import moment from 'moment';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import dynamic from 'next/dynamic';
import { useAnalysisSSE } from '@hooks/useAnalysisSSE';

// Components
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';

// Utils
import { GetCallAnalysis, GetTranscriptions, GetTranslations } from '@utils/aiml';
import axiosInstance from '@utils/axios';

// Assets
import imgStatus1 from '@assets/images/widget/img-status-1.svg';
import imgStatus2 from '@assets/images/widget/img-status-2.svg';
import imgStatus3 from '@assets/images/widget/img-status-3.svg';
import imgStatus4 from '@assets/images/widget/img-status-4.svg';
import avatar from '@assets/images/user/avatar-3.jpg';
import PageLoader from '@components/PageLoader';

// Styles
import '@assets/scss/datatable-style.scss';
import '@assets/scss/aiml.scss';
import '@assets/scss/chat.scss';
import '@assets/scss/audio-player.scss';
import '@assets/scss/tabs.scss';

interface SummaryData {
  summary: string;
  interaction_type: string;
  main_topic: string;
  tags: Array<{
    [key: string]: any;
  }>;
}

interface CallAnalysis {
  sentiment: string;
  customer_intent: string;
  key_topics: string[];
  action_items: string[];
  entities_customer: { name: string; phone: string,email: string }[];
  customer_emotions: string[];
  operator_emotions: string[];
  call_categories: string[];
  resolution_status: string;
  follow_up_required: boolean;
  summary: string;
}

interface DomainSpecificAnalysis {
  localPartyNumber: string;
  ownerUsername: string;
  completion_percent: number;
  matched_fields_count: number;
  qualified: boolean;
}

interface Transcription {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface ExtractEntities {
  [key: string]: string;
}

const CallAnalysis = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State declarations
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [domainSpecificAnalysis, setDomainSpecificAnalysis] = useState<DomainSpecificAnalysis | null>(null);
  const [transcription, setTranscription] = useState<Transcription[] | null>(null);
  const [extractEntities, setExtractEntities] = useState<ExtractEntities | null>(null);
  const [callDuration, setCallDuration] = useState<string | null>(null);
  const [callType, setCallType] = useState<string | null>(null);
  const [dataFound, setDataFound] = useState<boolean>(false);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);

  const [mlCallDuration, setMlCallDuration] = useState<string | null>('1980543371');
  const [callDirection, setCallDirection] = useState<string | null>('CALL_OUTGOING');
  const [callRemoteNumber, setCallRemoteNumber] = useState<string | null>('0561979110');
  const [callDateTime, setCallDateTime] = useState<string | null>('2025-10-29 22:19:47 +04:00');
  
  // Audio related state
  const [uuid, setUuid] = useState('9AC40A0F-03E0-4DA3-9706-219534EE5E23');
  const [localPartyNumber, setLocalPartyNumber] = useState('6018');
  const [ownerUsername, setOwnerUsername] = useState('bpo18');
  const [imagicle, setImagicle] = useState('node2');


  const [audioTrackId, setAudioTrackId] = useState('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [lastClickedTime, setLastClickedTime] = useState<string | null>(null);
  const [playingSegment, setPlayingSegment] = useState<{ start: number; end: number } | null>(null);
  const [mediaPlayerShow, setMediaPlayerShow] = useState(false);

  // Refs
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const audioStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    localPartyNumber: localPartyNumber || '',
    ownerUsername: ownerUsername || '',
    imagicle: imagicle || '',
    mlCallDuration: mlCallDuration || '',
    callDirection: callDirection || '',
    callRemoteNumber: callRemoteNumber || '',
    callDateTime: callDateTime || '',
    preventAutoConnect: analysisComplete,
    onMessage: (data) => {
      if (!data) return;

      // Handle final analysis result
      if (data.status === 'done' && data.result) {
        const result = data.result;
        
        // Set main analysis data
        if (result.sentiment || result.customer_intent) {
          setAnalysis(result);
        }
        
        // Set domain specific analysis
        if (result.domain_specific_analysis) {
          const domainAnalysis = result.domain_specific_analysis;
          setDomainSpecificAnalysis(domainAnalysis);
          setSummaryData(domainAnalysis?.summary_data);
          setTranscription(domainAnalysis?.transcription);
          setExtractEntities(domainAnalysis?.extracted_qualification_fields);
          setCallDuration(domainAnalysis?.domain_specific_duration);
        }
        
        setDataFound(true);
        setLoading(false);
        setAnalysisComplete(true);
        
        // Disconnect socket when analysis is complete
        disconnectSocket();
      }
      // Handle processing
      else if (data.status === 'processing') {
        setLoading(true);
      }
      // Handle connection status
      else if (data.type === 'connection') {
        // Connection status handled by onOpen/onClose
      }
      // Handle ping messages
      else if (data.type === 'ping') {
        // Keep connection alive
      }
      // Fallback for other data structures
      else if (data.analysis) {
        setAnalysis(data.analysis);
      } else if (data.sentiment || data.customer_intent) {
        setAnalysis(data);
      }
    },
    onError: (error) => {
      console.error('Analysis SSE error:', error);
      //toast.error(`WebSocket connection failed: ${error.message || error}`);
      //setError(error.message || 'Analysis connection failed');
      setLoading(false);
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
      const { id, file, direction, phone, imagicle, datetime, duration } = router.query;
      
      // Set basic parameters
      if (id) {
        setAudioTrackId(id as string);
        setUuid(id as string);
      }
      if (direction) {
        setCallType(direction as string);
      }
      if (phone) {
        setLocalPartyNumber(phone as string);
      }

      if (imagicle) {
        setImagicle(imagicle as string);
      }
      
      // Parse file path for additional parameters
      if (file) {
        const filePath = file as string;
        const filename = filePath.split('\\').pop();
        
        if (filename) {
          const cleanName = filename.replace('Record_', '').replace('_OUT', '');
          const parts = cleanName.split('_');
          
          if (parts.length >= 4) {
           
            const extension = parts[1];
            const user = parts[2];
            const remoteNumber = parts[3];
            setCallRemoteNumber(remoteNumber as string);

            // Set extracted parameters
            setLocalPartyNumber(extension);
            setOwnerUsername(user);
            
            // Trigger analysis
            handleGetCallAnalysisWithData(extension, user, id as string, imagicle as string, mlCallDuration as string, callDirection as string, callRemoteNumber as string, callDateTime as string);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing URL data:', error);
    }
  }, [router.isReady, router.query.id, router.query.file]);

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
    if (!uuid || !localPartyNumber || !ownerUsername || !mlCallDuration || !callDirection || !callRemoteNumber || !callDateTime) {
      toast.error('Please fill in all required fields (UUID, Extension, Username, Duration, Direction, Remote Number, DateTime)');
      return;
    }
    
    setLoading(true);
    setError(null);
    setAnalysisComplete(false);
    
    // Connect to WebSocket for analysis
    if (socketParametersReady && !socketConnected && !socketConnecting) {
      connectSocket();
    }
  };

  const handleGetCallAnalysisWithData = async (localPartyNumberParam: string, ownerUsernameParam: string, uuidParam: string, imagicleParam: string, mlCallDurationParam: string, callDirectionParam: string, callRemoteNumberParam: string, callDateTimeParam: string) => {
    // Set the parameters
    setUuid(uuidParam);
    setLocalPartyNumber(localPartyNumberParam);
    setOwnerUsername(ownerUsernameParam);
    setImagicle(imagicleParam);
    setMlCallDuration(mlCallDurationParam);
    setCallDirection(callDirectionParam);
    setCallRemoteNumber(callRemoteNumberParam);
    setCallDateTime(callDateTimeParam);
    // Set loading state
    setLoading(true);
    setError(null);
    setAnalysisComplete(false);
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
      setLastClickedTime(start.toString());
      
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
    handleGetTranslations();
  };





  const renderAnalysisForm = () => (
    <Row className="mb-4">
      <Col md={12}>


        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Analysis Parameters</h5>
              {socketConnected && (
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
              )}
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
                    <Form.Label>Extension</Form.Label>
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
                    <Form.Label>Username</Form.Label>
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


                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Duration</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      value={mlCallDuration || 0}
                      onChange={(e) => setMlCallDuration(e.target.value.toString())}
                      placeholder="Enter Duration"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Direction</Form.Label>
                    <Form.Control
                      type="text"
                      value={callDirection || ''}
                      onChange={(e) => setCallDirection(e.target.value)}
                      placeholder="Enter Direction"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Remote Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={callRemoteNumber || ''}
                      onChange={(e) => setCallRemoteNumber(e.target.value)}
                      placeholder="Enter Remote Number"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>DateTime</Form.Label>
                    <Form.Control
                      type="datetime"
                      value={callDateTime || ''}
                      onChange={(e) => setCallDateTime(e.target.value)}
                      placeholder="Enter DateTime"
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
                      ) : socketConnected ? (
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
                       
                        
                        // Clear all analysis data
                        setAnalysis(null);
                        setSummaryData(null);
                        setDomainSpecificAnalysis(null);
                        setTranscription(null);
                        setExtractEntities(null);
                        setCallDuration(null);
                        setDataFound(false);
                        setAnalysisComplete(false);
                        
                        // Clear loading and error states
                        setLoading(false);
                        setError(null);
                        
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

  const renderCustomerInfo = () => (
    <Row>
      <Col md={12}>
        <div className="card">
          <div className="card-header">
            <h5 className="card-title">Customer Information</h5>
          </div>
          <div className="card-body">
            <Row className="between">
              {analysis?.follow_up_required && (
              <Col>
                <div className="callType">
                  <div className={`ic_box ${analysis?.follow_up_required === true ? 'bg-success' : 'bg-danger'}`}>
                    {analysis?.follow_up_required === true ? 
                      <i className="material-icons-two-tone">check</i> : 
                      <i className="material-icons-two-tone">close</i>
                    }
                  </div>
                  <div className="desc">
                    <small className="card-title">Follow Up Required</small>
                    <h5 className="card-text">
                      {analysis?.follow_up_required === true ? 'Yes' : 'No'}
                    </h5>
                  </div>
                </div>
              </Col>
              )}

              {callType && (
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
              )}

              {analysis?.entities_customer && analysis.entities_customer.length > 0 && analysis.entities_customer[0]?.name && (
                <Col>
                  <div className="callType">
                    <div className="desc">
                      <small className="card-title">Customer Name</small>
                      <h5 className="card-text">
                        {analysis?.entities_customer && analysis.entities_customer.length > 0 && analysis.entities_customer[0]?.name}
                      </h5>
                    </div>
                  </div>
                </Col>
              )}

              {analysis?.entities_customer && analysis.entities_customer.length > 0 && analysis.entities_customer[0]?.phone && (
              <Col>
                <div className="callType">
                  <div className="desc">
                    <small className="card-title">Phone Number</small>
                    <h5 className="card-text">
                    {analysis?.entities_customer && analysis.entities_customer.length > 0 && analysis.entities_customer[0]?.phone}
                    </h5>
                  </div>
                </div>
              </Col>
              )}

              <Col>
                <div className="callType">
                  <div className="desc">
                    <small className="card-title">Call Duration</small>
                    <h5 className="card-text">{callDuration}</h5>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Col>
    </Row>
  );

  const renderSummaryCards = () => (
    <Row>
      <Col md={6}>
        <div className="card" style={{ backgroundImage: `url(${imgStatus1.src})` }}>
          <div className="card-body box1 gbox">
            {analysis?.resolution_status && (
              <div className="vbox">
                <h5>Resolution Status</h5>
                <div className="card-text">
                  <h6>{analysis?.resolution_status?.charAt(0).toUpperCase() + analysis.resolution_status.slice(1)}</h6>
                </div>
              </div>
            )}

            {analysis?.sentiment && (
              <div className="vbox">
                <h5>Sentiment</h5>
                <div className="card-text">
                  {/* <h6>{analysis?.sentiment?.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}</h6> */}
                </div>
              </div>
            )}

            <div className="vbox">
              <h5>Main Intention</h5>
              <div className="card-text">
                <h6>{summaryData?.main_topic}</h6>
              </div>
            </div>

            <div className="vbox">
              <h5>Summary</h5>
              <div className="card-text">
                <h6>{analysis?.summary}</h6>
              </div>
            </div>
          </div>
        </div>
      </Col>

      <Col md={6}>
        <Row>

         
          <Col md={12}>
            <div className={`card ${domainSpecificAnalysis?.qualified ? 'bg-success' : 'bg-danger'}`}
                 style={{ backgroundImage: `url(${imgStatus3.src})` }}>
              <div className="card-body gbox">
                <div className="vbox">
                  <h6 className="text-white">Overall Assessment</h6>
                </div>
                <div className="vbox">
                  <p className="card-text text-white size2">
                    {domainSpecificAnalysis?.qualified ? 'Qualified' : 'Unqualified'}
                  </p>
                </div>
              </div>
            </div>
          </Col>
         

          <Col md={6}>
            <div className="card">
              <div className="card-body gbox">
                <h6>Completion Percent</h6>
                <p className="card-text size2 text-bold">
                  {domainSpecificAnalysis?.completion_percent || 0}%
                </p>
                <div className="progress mb-3" style={{ height: '10px', width: '100%' }}>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ width: `${domainSpecificAnalysis?.completion_percent || 0}%` }}
                    aria-valuenow={domainSpecificAnalysis?.completion_percent || 0}
                    aria-valuemin={0} 
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="card">
              <div className="card-body gbox">
                <div className="vbox">
                  <h6>Customer Intention</h6>
                </div>
                <div className="vbox">
                  <h5 className="card-text size2">
                    {analysis?.customer_intent}
                  </h5>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  const renderEmotionsAndTopics = () => (
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
                      {analysis?.customer_emotions && analysis?.customer_emotions.length > 0 && analysis?.customer_emotions.map((emotion, index) => (
                        <div className="text-capitalize me-2" key={index}>
                          <div className="emo_text">{emotion}</div>
                          <div className="emo_pbar">
                            <div className="progress mb-3" style={{ height: '10px', width: '100%' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${domainSpecificAnalysis?.completion_percent || 0}%` }}
                                aria-valuenow={domainSpecificAnalysis?.completion_percent || 0}
                                aria-valuemin={0} 
                                aria-valuemax={100}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="vbox">
                      <h5 className="mb-3">Operator Emotions</h5>
                      <div className="card-text">
                        {analysis?.operator_emotions && analysis?.operator_emotions.length > 0 && analysis?.operator_emotions.map((emotion, index) => (
                          <div className="text-capitalize me-2" key={index}>
                            <div className="emo_text">{emotion}</div>
                            <div className="emo_pbar">
                              <div className="progress mb-3" style={{ height: '10px', width: '100%' }}>
                                <div 
                                  className="progress-bar bg-success" 
                                  role="progressbar" 
                                  style={{ width: `${domainSpecificAnalysis?.completion_percent || 0}%` }}
                                  aria-valuenow={domainSpecificAnalysis?.completion_percent || 0}
                                  aria-valuemin={0} 
                                  aria-valuemax={100}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
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
                <div className="vbox">
                  <div className="card-text">
                    {analysis?.key_topics && analysis?.key_topics.length > 0 && analysis?.key_topics.map((item, index) => (
                      <div className="mb-2 callType" key={index}>
                        <div className="ic_box bg-success">
                          <i className="material-icons-two-tone">check</i>
                        </div>
                        <div className="">
                          <h6 className="card-text text-capitalize font-weight-normal">{item}</h6>
                        </div>
                      </div>
                    ))}
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
                  <table className="table-bordered table-sm w-100">
                    <thead>
                      <tr>
                        <th>Icon</th>
                        <th>Name</th>
                        <th className="text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData?.tags && summaryData?.tags.length > 0 && summaryData?.tags.map((item: any, index: number) => (
                        <tr key={index}>
                          <td>
                            <div className="tboxIn">
                              <div className={`ic_box small ${Object.values(item)[0] === true ? 'bg-success' : 'bg-danger'}`}>
                                {Object.values(item)[0] === true ? 
                                  <i className="material-icons-two-tone">check</i> : 
                                  <i className="material-icons-two-tone">close</i>
                                }
                              </div>
                            </div>
                          </td>
                          <td className="text-capitalize">
                            {Object.keys(item)[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </td>
                          <td className="text-capitalize text-left">{String(Object.values(item)[1])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <div className="vbox">
                  <div className="card-text">
                    <p>{summaryData?.summary}</p>
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
                  <table className="table-bordered table-sm w-100">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th className="text-center">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractEntities && Object.entries(extractEntities).length > 0 && Object.entries(extractEntities).map(([key, value], index) => (
                        <tr key={index}>
                          <td>{key}</td>
                          <td className="text-capitalize text-center">{value === "null" ? "-" : value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Col>

          <Col md={12}>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Action Items</h5>
                {analysis?.action_items && analysis?.action_items.length > 0 && analysis?.action_items.map((item: any, index: number) => (
                  <div className="tagOuter" key={index}>
                    <div className="tagIcon bg-success">
                      <i className="material-icons-two-tone">check</i>
                    </div>
                    <div className="tagVal">
                      <h6 className="card-text text-capitalize">{item}</h6>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-body gbox vboxStyleTwo">
                <div className="vbox">
                  <h5 className="mb-3">Categories</h5>
                </div>
                <div className="vbox">
                  <div className="card-text">
                    {analysis?.call_categories && analysis?.call_categories.length > 0 && analysis?.call_categories.map((item, index) => (
                      <div className="mb-2 callType" key={index}>
                        <div className="ic_box bg-success">
                          <i className="material-icons-two-tone">check</i>
                        </div>
                        <div className="">
                          <h6 className="card-text text-capitalize font-weight-normal">{item}</h6>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  );

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

              {transcription && transcription.length > 0 && transcription.map((transcriptItem: Transcription, index: number) => (
                <div key={index}>
                  {transcriptItem.speaker === 'Operator' ? (
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
                                <p className="mb-1 text-muted"><small>Operator</small></p>
                                <div className="message d-flex align-items-start flex-column">
                                  <div className="d-flex align-items-center mb-1 chat-msg">
                                    <div className="flex-grow-1 me-3">
                                      <div className="msg-content card mb-0">
                                        <p className="mb-0">{transcriptItem.text}</p>
                                        {transcriptItem.start && transcriptItem.end && mediaPlayerShow && (
                                          <p className="text-primary mb-0">
                                            <span 
                                              className="time-stamp" 
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
                                              style={{ cursor: 'pointer' }}
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
                            <p className="mb-1 text-muted"><small>Customer</small></p>
                            <div className="message d-flex align-items-end flex-column">
                              <div className="d-flex align-items-center mb-1 chat-msg">
                                <div className="flex-grow-1 ms-3">
                                  <div className="msg-content card bg-primary">
                                    <p className="mb-0 text-white">{transcriptItem.text}</p>
                                    {transcriptItem.start && transcriptItem.end && mediaPlayerShow && (
                                      <p className="text-white mb-0">
                                        <span 
                                          className="time-stamp" 
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
                                          style={{ cursor: 'pointer', padding: '0px 4px' }}
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



  const [target, setTarget] = useState('');
  const [translations, setTranslations] = useState<any | null>(null);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [subActiveTab, setSubActiveTab] = useState('en');

  useEffect(() => {
    handleGetTranslations();
  }, [uuid]);

  const handleGetTranslations = async () => {
    try {
      const response = await GetTranscriptions(uuid);
      setTranslations(response);
      console.log(response);

  } catch (err) {
      //setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching transcription:', err);
  } finally {
      setLoading(false);
  }
}

  
  const renderTranslate = () => (
    <Row>
      <Col md={12}>
    

            {translations && (
            <Row>
                <Col md={12}>
                    {isError && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    {!isError && translations && (
                      <>
                     
                       <Tabs
                       defaultActiveKey="calls_chart"
                       id="system-tabs"
                       className="mb-3 justify-content-center"
                       activeKey={subActiveTab}
                       onSelect={(k) => setSubActiveTab(k || 'en')}
                  >
                      <Tab eventKey="en" title="English">
                          <p>{translations?.transcription}</p>
                      </Tab>
                      <Tab eventKey="ar" title="Arabic">
                          <p>{translations?.transcription_ar}</p>
                      </Tab>
                      <Tab eventKey="ur" title="Urdu">
                          <p>{translations?.transcription_ur}</p>
                      </Tab>
                      <Tab eventKey="hi" title="Hindi">
                          <p>{translations?.transcription_hi}</p>
                      </Tab>
                      </Tabs>
                      </>
                    )}
                   
                    
                        
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

      {/* Show error if any */}
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
      
      <div className="analysis-container">
        {loading ? (
          <Row>
            {/* <PageLoader isLoading={true} /> */}
            <Col md={12}>
              <div className="text-center p-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading analysis...</span>
                </Spinner>
                <p className="mt-3">Loading call analysis...</p>
              </div>
            </Col>
          </Row>
        ) : analysis ? (
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'summary')} id="system-tabs" className="mb-3">
            <Tab eventKey="summary" title="Summary">
              {renderCustomerInfo()}
              {renderSummaryCards()}
              {renderEmotionsAndTopics()}
            </Tab>
            
            <Tab eventKey="transcript" title="Transcript">
              {renderTranscript()}
            </Tab>

            <Tab eventKey="translate" title="Translate">
              {renderTranslate()}
            </Tab>


          </Tabs>
        ) : (
          <></>
        )}
      </div>
    </React.Fragment>
  );
};

CallAnalysis.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallAnalysis;
