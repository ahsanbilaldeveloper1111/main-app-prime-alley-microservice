import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Row, Col, Card, Badge, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import moment from 'moment';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import dynamic from 'next/dynamic';
import { Client } from '@stomp/stompjs';

// Components
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';

// Utils
import { GetCallAnalysis } from '@utils/aiml';
import axiosInstance from '@utils/axios';

// Assets
import imgStatus1 from '@assets/images/widget/img-status-1.svg';
import imgStatus2 from '@assets/images/widget/img-status-2.svg';
import imgStatus3 from '@assets/images/widget/img-status-3.svg';
import imgStatus4 from '@assets/images/widget/img-status-4.svg';
import avatar from '@assets/images/user/avatar-3.jpg';

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
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  
  // Audio related state
  const [uuid, setUuid] = useState('');
  const [date, setDate] = useState('');
  const [localPartyNumber, setLocalPartyNumber] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');

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
  const stompClientRef = useRef<Client | null>(null);

  // Extract data from URL parameters
  useEffect(() => {
    if (router.isReady) {
      try {
        const { id, file, direction, phone } = router.query;
        
        
        if (id) {
          setAudioTrackId(id as string);
          setUuid(id as string);
          //console.log('uuid is:', id);
        }
        if (direction) {
          setCallType(direction as string);
        }
        if (phone) {
          setLocalPartyNumber(phone as string);
        }
        
        
        if (file) {
          const filePath = file as string;
          //console.log('File path:', filePath);
          
          const filename = filePath.split('\\').pop();
          
          if (filename) {
            const cleanName = filename.replace('Record_', '').replace('_OUT', '');
            const parts = cleanName.split('_');
            
            if (parts.length >= 4) {
              const timestamp = parts[0];
              
              const extension = parts[1];
              const user = parts[2];

              const phoneNumber = parts[3];
              
              const year = timestamp.substring(0, 4);
              const month = timestamp.substring(4, 6);
              const day = timestamp.substring(6, 8);
              const formattedDate = `${year}-${month}-${day}`;
              
             
              
              // Set state variables
              
              setLocalPartyNumber(extension);
              setOwnerUsername(user);
              setDate(formattedDate);
              
              // Call analysis with extracted values directly
              handleGetCallAnalysisWithData(formattedDate, extension, user, id as string);
            }
          }
        }

        
      } catch (error) {
        console.error('Error parsing URL data:', error);
      }
    }
  }, [router.isReady, router.query.id, router.query.file]);

  // Debug useEffect to monitor date changes
  useEffect(() => {
    
  }, [date]);

  // STOMP connection setup
  useEffect(() => {
    const STOMP_URL = process.env.NEXT_PUBLIC_AIML_SOCKET_URL;
    
    if (STOMP_URL && uuid && date && localPartyNumber && ownerUsername) {
      // Construct the STOMP broker URL - ensure it's a proper WebSocket URL
      let brokerURL = STOMP_URL;
      
      // If the URL doesn't start with ws:// or wss://, add the appropriate protocol
      if (!brokerURL.startsWith('ws://') && !brokerURL.startsWith('wss://')) {
        // Check if it's HTTPS context to determine protocol
        const isSecure = window.location.protocol === 'https:';
        brokerURL = `${isSecure ? 'wss://' : 'ws://'}${brokerURL}`;
      }
      
      // Ensure the URL ends with /ws for STOMP
      if (!brokerURL.endsWith('/ws')) {
        brokerURL = `${brokerURL}/ws`;
      }
      
      console.log('Connecting to STOMP broker:', brokerURL);
      console.log('Analysis parameters:', { uuid, date, localPartyNumber, ownerUsername });
      console.log('Environment check:', {
        protocol: window.location.protocol,
        host: window.location.host,
        isSecure: window.location.protocol === 'https:',
        originalUrl: STOMP_URL
      });
      
      // Initialize STOMP client
      const client = new Client({
        brokerURL,
        connectHeaders: {
          'uuid': uuid,
          'date': date,
          'localPartyNumber': localPartyNumber,
          'ownerUsername': ownerUsername,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        connectionTimeout: 10000, // 10 seconds connection timeout
        debug: function (str) {
          console.log('STOMP Debug:', str);
        }
      });
      
      stompClientRef.current = client;
      
      // STOMP event handlers
      client.onConnect = () => {
        console.log('STOMP connected successfully');
        toast.success('Connected to analysis server');
        setError(null);
        setSocketConnected(true);
        setConnectionStatus('connected');
        
        try {
          console.log('Setting up STOMP subscriptions...');
          
          // Subscribe to analysis data
          client.subscribe('/user/topic/analysis-data', ({ body }) => {
            try {
              console.log('Received analysis data:', body);
              const data = JSON.parse(body);
              
              if (data) {
                setAnalysis(data);
                setSummaryData(data?.domain_specific_analysis?.summary_data);
                setDomainSpecificAnalysis(data?.domain_specific_analysis);
                setTranscription(data?.domain_specific_analysis?.transcription);
                setExtractEntities(data?.domain_specific_analysis?.extracted_qualification_fields);
                setCallDuration(data?.domain_specific_analysis?.domain_specific_duration);
                setDataFound(true);
                setLoading(false);
              }
            } catch (err) {
              console.error('Failed to process analysis data:', err);
              setError('Failed to process analysis data');
            }
          });
          
          // Subscribe to analysis errors
          client.subscribe('/user/topic/analysis-error', ({ body }) => {
            try {
              console.error('Analysis error received:', body);
              const errorData = JSON.parse(body);
              toast.error(`Analysis error: ${errorData.message || errorData}`);
              setError(errorData.message || 'Analysis failed');
              setLoading(false);
            } catch (err) {
              console.error('Failed to process analysis error:', err);
              setError('Failed to process analysis error');
            }
          });
          
          // Subscribe to analysis progress
          client.subscribe('/user/topic/analysis-progress', ({ body }) => {
            try {
              console.log('Analysis progress:', body);
              const progress = JSON.parse(body);
              // You can add a progress indicator here if needed
            } catch (err) {
              console.error('Failed to process analysis progress:', err);
            }
          });
          
          console.log('All STOMP subscriptions set up successfully');
        } catch (err) {
          console.error('Error setting up subscriptions:', err);
          setError('Failed to setup subscriptions');
        }
      };
      
      client.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        const errorMessage = frame.headers?.message || 'Unknown STOMP error';
        setSocketConnected(false);
        setConnectionStatus('error');
        toast.error(`STOMP error: ${errorMessage}`);
        setError(`STOMP error: ${errorMessage}`);
      };
      
      client.onWebSocketError = (ev) => {
        console.error('WebSocket error:', ev);
        console.error('WebSocket error details:', {
          type: ev.type,
          target: ev.target,
          readyState: ev.target?.readyState,
          url: ev.target?.url
        });
        
        setSocketConnected(false);
        setConnectionStatus('error');
        
        // Provide more specific error messages
        let errorMessage = 'WebSocket connection failed';
        if (ev.target?.readyState === 3) {
          errorMessage = 'WebSocket connection closed unexpectedly';
        } else if (ev.type === 'error') {
          errorMessage = 'WebSocket connection error - server may be unavailable';
        }
        
        toast.error(errorMessage);
        setError(`${errorMessage} (${brokerURL})`);
      };
      
      client.onWebSocketClose = (ev) => {
        console.log('WebSocket connection closed:', ev);
        setSocketConnected(false);
        setConnectionStatus('disconnected');
        toast.warning('Disconnected from analysis server');
      };
      
      // Activate the client
      client.activate();
      
      // Cleanup function
      return () => {
        if (client) {
          client.deactivate();
          stompClientRef.current = null;
        }
      };
    }
  }, [uuid, date, localPartyNumber, ownerUsername]);

  // Load audio when uuid changes
  useEffect(() => {
    //handleGetCallAnalysis();
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
    
    setLoading(true);
    setError(null);

    // Check if STOMP client is connected and request analysis
    if (stompClientRef.current && stompClientRef.current.connected) {
      console.log('Requesting analysis via STOMP');
      stompClientRef.current.publish({
        destination: '/app/request/analysis',
        body: JSON.stringify({
          uuid,
          date,
          localPartyNumber,
          ownerUsername
        })
      });
    } else {
      console.log('STOMP not connected, falling back to HTTP API');
      try {
        setLoading(true);
        const response = await GetCallAnalysis(date, localPartyNumber, ownerUsername, uuid);
       
        // Check if object has analysis and it has error
        if (response && response.analysis && response.analysis.error) {
          toast.error(response.analysis.error);
          setLoading(false);
          return;
        }
        setAnalysis(response);

        setSummaryData(response?.domain_specific_analysis?.summary_data);
        setDomainSpecificAnalysis(response?.domain_specific_analysis);
        setTranscription(response?.domain_specific_analysis?.transcription);
        setExtractEntities(response?.domain_specific_analysis?.extracted_qualification_fields);
        setCallDuration(response?.domain_specific_analysis?.domain_specific_duration);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error fetching call analysis:', err as Error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGetCallAnalysisWithData = async (dateParam: string, localPartyNumberParam: string, ownerUsernameParam: string, uuidParam: string) => {
    return;

    try {
     
      setLoading(true);
      const response = await GetCallAnalysis(dateParam, localPartyNumberParam, ownerUsernameParam, uuidParam);
      if (response && response.analysis && response.analysis.error) {
        toast.error(response.analysis.error);
        setLoading(false);
        setDataFound(false);
        return;
      }

      setAnalysis(response);
      setSummaryData(response?.domain_specific_analysis?.summary_data);
      setDomainSpecificAnalysis(response?.domain_specific_analysis);
      setTranscription(response?.domain_specific_analysis?.transcription);
      setExtractEntities(response?.domain_specific_analysis?.extracted_qualification_fields);
      setLoading(false);
      setDataFound(true);
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching call analysis:', err);
    } finally {
      setLoading(false);
    }
    
  };

  const loadAuthenticatedAudio = async (trackId?: string) => {
    const currentTrackId = trackId || audioTrackId;
    if (!currentTrackId) return;
    
    setAudioLoading(true);
    setAudioError(null);
    setMediaPlayerShow(false);
  

    
    try {
      const response = await axiosInstance.get(`call-logs/recordings/download/${currentTrackId}`, {
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
  };

  const handleReconnect = () => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }
    // Force reconnection by clearing the STOMP client ref
    // The useEffect will recreate the connection
    setConnectionStatus('disconnected');
    setSocketConnected(false);
    setError(null);
  };

  const testConnection = async () => {
    const STOMP_URL = process.env.NEXT_PUBLIC_AIML_SOCKET_URL;
    if (!STOMP_URL) {
      toast.error('STOMP URL not configured');
      return;
    }

    try {
      // Test basic connectivity
      const testUrl = STOMP_URL.replace(/^https?:\/\//, '');
      const response = await fetch(`http://${testUrl}/health`, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log('Server health check:', response);
    } catch (error) {
      console.error('Server health check failed:', error);
      toast.warning('Server may be unavailable - check your connection');
    }
  };

  const renderAnalysisForm = () => (
    <Row className="mb-4">
      <Col md={12}>
        <Card>
          <Card.Header>
            <h5 className="card-title mb-0">Analysis Parameters</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleFormSubmit}>
              <Row>
                <Col md={3}>
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
                <Col md={3}>
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
                <Col md={3}>
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
                <Col md={3}>
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
               
              </Row>
              <Row>
                <Col md={12}>
                  <div className="d-flex justify-content-end">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={loading}
                      className="me-2"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Loading...
                        </>
                      ) : (
                        'Analyze Call'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-secondary"
                      onClick={() => {
                        setUuid('');
                        setLocalPartyNumber('');
                        setOwnerUsername('');
                        setDate('');
                      }}
                      className="me-2"
                    >
                      Reset to Default
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-primary"
                      onClick={handleReconnect}
                      disabled={connectionStatus === 'reconnecting'}
                      className="me-2"
                    >
                      {connectionStatus === 'reconnecting' ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Reconnecting...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-refresh me-1"></i>
                          Reconnect
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-info"
                      onClick={testConnection}
                      size="sm"
                    >
                      <i className="ti ti-network me-1"></i>
                      Test Connection
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
                  <h6>{analysis?.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}</h6>
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
                <div className="d-flex align-items-center justify-content-end gap-2">
                  <span className="text-muted">Connection Status:</span>
                  <Badge 
                    bg={
                      connectionStatus === 'connected' ? 'success' :
                      connectionStatus === 'reconnecting' ? 'warning' :
                      connectionStatus === 'error' || connectionStatus === 'failed' ? 'danger' :
                      'secondary'
                    }
                    className="d-flex align-items-center gap-1"
                  >
                    {connectionStatus === 'connected' && <i className="ti ti-check"></i>}
                    {connectionStatus === 'reconnecting' && <Spinner animation="border" size="sm" />}
                    {connectionStatus === 'error' && <i className="ti ti-x"></i>}
                    {connectionStatus === 'failed' && <i className="ti ti-x"></i>}
                    {connectionStatus === 'disconnected' && <i className="ti ti-circle"></i>}
                    {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                  </Badge>
                </div>
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
          <Tabs defaultActiveKey="summary" id="system-tabs" className="mb-3 tab-style-two">
            <Tab eventKey="summary" title="Summary">
              {renderCustomerInfo()}
              {renderSummaryCards()}
              {renderEmotionsAndTopics()}
            </Tab>
            
            <Tab eventKey="transcript" title="Transcript">
              {renderTranscript()}
            </Tab>
          </Tabs>
        ) : (
          <Row>
            <Col md={12}>
              <Alert variant="info">
                <Alert.Heading>No Analysis Data</Alert.Heading>
                <p>Enter the parameters above and click "Analyze Call" to view the analysis results.</p>
              </Alert>
            </Col>
          </Row>
        )}
      </div>
    </React.Fragment>
  );
};

CallAnalysis.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallAnalysis;
