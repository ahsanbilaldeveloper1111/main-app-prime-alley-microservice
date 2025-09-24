import '@assets/scss/datatable-style.scss';

import React, { ReactElement, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from "socket.io-client";
import { Col, Button, Card, Modal, Row } from 'react-bootstrap';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import type { NextPage } from 'next';
import moment from 'moment';
import dynamic from 'next/dynamic';

// Components
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import CallRecordingsFilters from '@components/filters/CallRecordingFilter';
import AnimatedNumber from '@components/AnimatedNumber';
import StatCard from '@components/StatCard';
import ChartBar from '@components/ChartBar';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { Column } from '@components/CustomDataTable';
import CustomDataTable from '@components/CustomDataTable';
import AudioPlayer, { AudioPlayerRef } from '@components/AudioPlayer';
import EmptyState from '@components/EmptyState';
import { ModuleSlug } from '@utils/Helper';


import '@assets/scss/common.scss';

// Utils
import { ListCallLogs, ExportCallLogs, DownloadCallRecording, DownloadStreamingExport } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';
import { formatDateTimeToLocal } from '@utils/Helper';

// Assets
import imgStatus1 from '@assets/images/widget/img-status-1.svg';
import imgStatus2 from '@assets/images/widget/img-status-2.svg';
import imgStatus3 from '@assets/images/widget/img-status-3.svg';
import imgStatus4 from '@assets/images/widget/img-status-4.svg';
import router from 'next/router';
import axiosInstance from '@utils/axios';
import { toast } from 'react-toastify';
import { convertUTCToUserTimezone, convertUTCTimeToUserTimezone, convertUTCSeparateDateTimeToUserTime, convertUTCSeparateDateTimeToUserDate, formatDuration, convertUTCDateToUserTimezone, GlobalDateFormat, GlobalTimeFormat } from '@utils/Helper';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const sparklineData = [25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54];

const randomizeArray = (arr: number[]) => arr
  .map((value: number) => ({ value, sort: Math.random() }))
  .sort((a: { value: number; sort: number }, b: { value: number; sort: number }) => a.sort - b.sort)
  .map(({ value }: { value: number }) => value);

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

interface ChartDirection{
  inbound: number[];
  outbound: number[];
  label: string[];
}

interface RecordingUpdate {
  message: string;
  data: {
    AgentExtension: string;
    [key: string]: any;
  };
}

const SOCKET_URL = process.env.NEXT_PUBLIC_CALL_LOGS_SOCKET_URL;

const CallRecordings: NextPage & { getLayout?: (page: React.ReactElement) => React.ReactNode } = () => {
  const { data: session, status } = useSession();
  const { getAccessToken } = useTokenService();
  const stableGetAccessToken = useCallback(getAccessToken, []);
  const socketRef = useRef<Socket | null>(null);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  // State declarations
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});
  const [callDurationBarChartModal, setCallDurationBarChartModal] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [currentChartTitle, setCurrentChartTitle] = useState('');
  const [mediaPlayerModal, setMediaPlayerModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [mediaPlayerShow, setMediaPlayerShow] = useState(false);
  
  // State for managing data and manual additions
  const [currentData, setCurrentData] = useState<any[]>([]);
  const [isDataModified, setIsDataModified] = useState(false);
  const modifiedDataRef = useRef<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<any>({
    totalRows: 0,
    totalPages: 0,
    currentPage: 1,
    perPage: 15,
  });
  const [socketExtensions, setSocketExtensions] = useState<number[]>([]);

  const [summary, setSummary] = useState<Summary>({
    numbers: 0,
    extensions: 0,
    inbound: 0,
    outbound: 0
  });

  // Create cards data for PageSummaryGrid
  const summaryCards: SummaryCard[] = [
    {
      id: 'total-gsms-count',
      title: 'Extensions',
      value: summary?.extensions || 0,
      description: 'Extensions in the system',
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'assigned-gsms-count',
      title: 'Remote Numbers',
      value: summary?.numbers || 0,
      description: 'Remote numbers in the system',
      delay: 0.3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'unassigned-gsms-count',
      title: 'Inbound',
      value: summary?.inbound || 0,
      description: 'Inbound calls in the system',
      delay: 0.5,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    },
    {
      id: 'total-ports-count',
      title: 'Outbound',
      value: summary?.outbound || 0,
      description: 'Outbound calls in the system',
      delay: 0.7,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2'
    }
  ];

  const [callDirectionTwo, setCallDirectionTwo] = React.useState<{
    series: Array<{ name: string; data: number[] }>;
    options: any;
  }>({
    series: [],
    options: {
      chart: {
        type: 'bar' as const,
        height: 200,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5,
          borderRadiusApplication: 'end' as const
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: [] as string[],
      },
      yaxis: {
        title: {
          text: 'Calls'
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function (val: any) {
            return val + ' calls'
          }
        }
      }
    },
  });

  // Table columns configuration
  const columns = [
    {
      key: 'DateTime',
      name: 'Date',
      selector: (row: any) => row.DateTime,
      sortable: true,
      cell: (props: any) => {
        return (
          <div>
            {formatDateTimeToLocal(props.DateTime, GlobalDateFormat)}
          </div>
        )
      }
    },
    {
      key: 'DateTime',
      name: 'Time',
      selector: (row: any) => row.DateTime,
      sortable: true,
      cell: (props: any) => {
        return (
          <div>
            {formatDateTimeToLocal(props.DateTime, GlobalTimeFormat, 'YYYY-MM-DD HH:mm:ss.SSSSSSS')}
          </div>
        )
      }
    },
    {
      key: 'AgentExtension',
      name: 'Extension',
      selector: (row: any) => row.AgentExtension,
      sortable: true
    },
    {
      key: 'RemotePartyNumber',
      name: 'Remote Number',
      selector: (row: any) => row.RemotePartyNumber,
      sortable: true
    },
    {
      key: 'Direction',
      name: 'Direction',
      selector: (row: any) => row.Direction,
      sortable: true
    },
    {
      key: 'Duration',
      name: 'Duration',
      selector: (row: any) => row.Duration,
      sortable: true,
      cell: (props: any) => {
        const formatDuration = (seconds: number) => {
          const minutes = Math.floor(seconds / 60);
          let secs = seconds % 60;
          secs = parseFloat(secs.toFixed(2));
          
          if (minutes > 0) {
            return `${minutes} Min ${secs} Sec`;
          } else {
            return `${secs} Sec`;
          }
        };
        
        const duration = parseInt(props.Duration.toString())/10000000 || 0;
        return (
          <div>
            {formatDuration(duration)}
          </div>
        );
      }
    },
    {
      key: 'Action',
      name: 'Action',
      selector: (row: any) => row.Action,
      sortable: true,
      cell: (props: any) => {
        return (
          <div className='d-flex gap-3 action-box'>
            <i
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Play"
              className='ph-duotone ph-play text-info'
              style={{ fontSize: '1rem', cursor: 'pointer' }}
              onClick={() => handlePlayRecording(props)}
            />
            <i
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Download"
              className='ph-duotone ph-arrow-line-down text-info'
              style={{ fontSize: '1rem' }}
              onClick={() => {
                handleDownload(props);
              }}
            />
            <i
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Call Analysis"
              className='ph-duotone ph-chart-bar text-info'
              style={{ fontSize: '1rem' }}
              onClick={() => {
                handleAnalysis(props);
              }}
            />
          </div>
        )
      }
    }
  ];

  // Functions
  const addNewRecord = () => {
    const newRecord = {
      "Id": "F035BC55-6FA5-4553-A4F3-0C36D269C3E0",
      "Direction": "CALL_OUTGOING",
      "LocalCallId": null,
      "RemoteCallId": null,
      "AgentExtension": "4030",
      "RemotePartyNumber": "0543879764",
      "RecordId": "2025004387522",
      "AudioTrack": "\\2025\\08\\07\\Record_20250807021403_4030_default_C808a6829400671_Recorder",
      "Duration": 5553198016,
      "OwnerId": "89CD4A38-A4AB-4F8F-BD52-3B1A2CE886A9",
      "PreservingUserId": null,
      "NoteOwnerId": null,
      "Note": null,
      "DateTime": "2025-08-06T22:14:03.944000Z",
      "NoteDateTime": null,
      "OwnerPropertiesId": "6E39C533-9D5D-4CC3-9B28-B1F4A96282AE",
      "PreservingUserPropertiesId": null,
      "NoteOwnerPropertiesId": null,
      "NodeId": "IMAGICLE_GW_DC_02",
      "Size": "2222624"
    };

    // Update the table data directly without triggering API call
    setTableData(prevData => {
      const updatedData = [...prevData, newRecord];
      modifiedDataRef.current = updatedData;
      setIsDataModified(true);
      return updatedData;
    });


    // Update summary counts
    setSummary(prevSummary => ({
      ...prevSummary,
      numbers: prevSummary.numbers + 1,
      outbound: prevSummary.outbound + 1
    }));

    toast.success('New record added successfully');
  };

  const fetchCallLogsOriginal = useCallback(async (page = 1, perPage = 15, search = "") => {
    const response = await ListCallLogs(
      { page, perPage, search, filters: currentFilters, reportType: 'recordings', moduleSlug: ModuleSlug.CALL_RECORDINGS },
      'call-logs/recordings'
    );
    

    if (response?.summary) {
      setSummary(response.summary)
    }

    // Store the original data from API
    if (response?.dataList) {
      setCurrentData(response.dataList);
      setTableData(response.dataList);
      modifiedDataRef.current = response.dataList;
      setIsDataModified(false);
    }

    // Update pagination info
    if (response) {
      setPaginationInfo({
        totalRows: response.total || 0,
        totalPages: response.last_page || 0,
        currentPage: response.current_page || 1,
        perPage: response.per_page || 15,
      });
    }

    if (response?.chart?.extension) {
      const dataExtension = response.chart.extension;
      if (dataExtension.length > 0) {
        const newChartData: ChartDuration = {
          label: [],
          longest_call: [],
          shortest_call: [],
          average_call: []
        };

        const ms = 10000000;
        dataExtension.forEach((item: any) => {
          newChartData.label.push(item.label);
          newChartData.longest_call.push(item.longest_call / ms);
          newChartData.shortest_call.push(item.shortest_call / ms);
          newChartData.average_call.push(item.average_call / ms);
        });

        console.log("Chart data", newChartData);
        setChartLoading(true);

        const dataLength = newChartData.label.length;

        if (dataLength > 0 &&
          newChartData.shortest_call.length === dataLength &&
          newChartData.longest_call.length === dataLength &&
          newChartData.average_call.length === dataLength) {

          // Calls Chart
          setCurrentChartData({
            series: [
              { name: 'Short', data: newChartData.shortest_call },
              { name: 'Average', data: newChartData.average_call },
              { name: 'Long', data: newChartData.longest_call }
            ],
            categories: newChartData.label
          });
          setChartLoading(false);
        } else {
          setChartLoading(false);
        }
      } else {
        setChartLoading(false);
      }
    } else {
      setChartLoading(false);
    }



    if (response?.chart?.date) {
      const dataDirection = response.chart.date;
      if (dataDirection.length > 0) {
        const newChartDirection: ChartDirection = {
          inbound: [],
          outbound: [],
          label: []
        };

        dataDirection.forEach((item: any) => {
          newChartDirection.inbound.push(item.inbound);
          newChartDirection.outbound.push(item.outbound);
          newChartDirection.label.push(item.label);
        });

        setCallDirectionTwo({
          series: [
            { name: 'Inbound', data: newChartDirection.inbound },
            { name: 'Outbound', data: newChartDirection.outbound }
          ],
          options: {
            chart: {
              type: 'bar' as const,
              height: 200,
              toolbar: {
                show: false
              }
            },
            plotOptions: {
              bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 5,
                borderRadiusApplication: 'end' as const
              },
            },
            dataLabels: {
              enabled: false
            },
            stroke: {
              show: true,
              width: 2,
              colors: ['transparent']
            },
            xaxis: {
              categories: newChartDirection.label,
            },
            yaxis: {
              title: {
                text: 'Calls'
              }
            },
            fill: {
              opacity: 1
            },
            tooltip: {
              y: {
                formatter: function (val: any) {
                  return val + ' calls'
                }
              }
            }
          }
        });
      }
    }

    return response;
  }, [currentFilters]);

  // Wrapper function that handles modified data
  const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
    const response = await fetchCallLogsOriginal(page, perPage, search);
    
    // Return modified data if data has been manually added, otherwise return original response
    if (isDataModified && modifiedDataRef.current.length > 0) {
      return {
        ...response,
        dataList: modifiedDataRef.current
      };
    }
    
    return response;
  }, [fetchCallLogsOriginal, isDataModified]);


  const handleOpenChartModal = (
    chartData: { series: any[]; categories: string[] } | null,
    title: string,
    dataType: 'calls' | 'time' | 'cost' | 'custom'
  ) => {
    if (chartData) {
      setCurrentChartData(chartData);
      setCurrentChartTitle(title);
      setCallDurationBarChartModal(true);
    }
  };

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
    
    // Clear chart data when filters are cleared
    if (!filters || Object.keys(filters).length === 0) {
      setCurrentChartData(null);
      setCallDirectionTwo({
        series: [],
        options: {
          chart: {
            type: 'bar' as const,
            height: 200,
            toolbar: {
              show: false
            }
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '55%',
              borderRadius: 5,
              borderRadiusApplication: 'end' as const
            },
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
          },
          xaxis: {
            categories: [] as string[],
          },
          yaxis: {
            title: {
              text: 'Calls'
            }
          },
          fill: {
            opacity: 1
          },
          tooltip: {
            y: {
              formatter: function (val: any) {
                return val + ' calls'
              }
            }
          }
        },
      });
      setChartLoading(false);
    }
  };

  const handleExport = async (exportType: string, filters: Record<string, any>) => {
    try {
      if (exportType === 'excel') {
       
        await DownloadStreamingExport(
          { filters: currentFilters, isExport: true, exportType, moduleSlug: ModuleSlug.CALL_RECORDINGS},
          'call-logs/recordings',
          'recordings'
          
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const handleDownload = async (props: any) => {
    const { Id, AgentExtension } = props;
    return await DownloadCallRecording(
      Id,AgentExtension,'call-logs/recordings/download'
    );
  };

  const handleAnalysis = async (props: any) => {
    try {
      const { Id, AudioTrack } = props;
      window.open(`/ai-ml/analysis?id=${Id}&file=${AudioTrack}&direction=${props.Direction}&phone=${props.RemotePartyNumber}`, '_blank');
    } catch (error) {
      console.error('Error navigating to analysis:', error);
    }
  };

  const handlePlayRecording = (recording: any) => {
    const trackId = recording.Id;
    const agentExtension = recording.AgentExtension;

    loadAuthenticatedAudio(trackId, agentExtension);

    setSelectedRecording(recording);
     
      setAudioLoading(false);
      setAudioError(null);
  };


  const loadAuthenticatedAudio = async (audioTrackId: string, agentExtension: string) => {
    if (!audioTrackId) return;
    
    setAudioLoading(true);
    setAudioError(null);
    setMediaPlayerShow(false);
    
    console.log('=== AUDIO LOADING DEBUG ===');
    console.log('trackId:', audioTrackId);

    
    try {
      console.log('Attempting to load audio via axiosInstance...');
      const response = await axiosInstance.get(`call-logs/recordings/download/${audioTrackId}`, {
        responseType: 'blob',
        params: {
          extension_number: agentExtension
        },
        headers: {
          'Accept': 'audio/*, application/octet-stream, */*'
        }
      });
      
      console.log('AxiosInstance response received:', response.status, response.headers);
      
      if (response.status === 200) {
        setMediaPlayerModal(true);
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const audioUrl = window.URL.createObjectURL(blob);
        setAudioUrl(audioUrl);

        console.log('Audio loaded successfully via axiosInstance');
      } else if (response.status === 204) {
        toast.error('Audio file not found');
      } else {
        setAudioError(`Unexpected response status: ${response.status}`);
        console.log('Unexpected response status:', response.status);
      }
      
    } catch (error: any) {
      console.error('=== AXIOSINSTANCE ERROR ===');
      console.error('Error loading audio file via axiosInstance:', error);
      
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        console.error('Error response headers:', error.response.headers);
        
        if (error.response.status === 204) {
          toast.error('Audio file not found');
        } else {
         
          setAudioError(`Error loading audio: ${error.response.status}`);
        }
      } else if (error.request) {
        
        setAudioError('No response received from server');
      } else {
       
        setAudioError(`Request error: ${error.message}`);
      }
    } finally {
      setAudioLoading(false);
      console.log('=== AUDIO LOADING COMPLETE ===');
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

  // Effects
  useEffect(() => {
    const fetchHierarchyData = async () => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CALL_RECORDINGS);
      
      const extensions = hierarchyData?.extensions;
      if (extensions && Array.isArray(extensions)) {
        // Extract IDs from extensions array where each object has {id, name}
        const extensionIds = extensions.map(ext => ext.id).filter(id => id !== undefined);
        setSocketExtensions(extensionIds);
      }
    };
    fetchHierarchyData();
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetchCallLogsOriginal(1, 15, '');
        // Data is already set in fetchCallLogsOriginal
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadInitialData();
  }, [currentFilters]);



  // Socket connection effect
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Initialize socket connection
      socketRef.current = io(SOCKET_URL, {
        auth: {
          token: stableGetAccessToken()
        }
      });

       // Socket event listeners
       socketRef.current.on('connect', () => {
         // Join room for all extensions
         if (socketExtensions.length > 0) {
           socketRef.current?.emit('join:recording', socketExtensions);
         }
       });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected from call recordings');
      });

       socketRef.current.on('recording_update', (data: RecordingUpdate) => {
         console.log('Recording update received:', data);
         
         // Add the new recording data to the table
         if (data) {
           
           // Add to table data directly
           setTableData(prevData => {
             const updatedData = [...prevData, data];
             modifiedDataRef.current = updatedData;
             setIsDataModified(true);
             return updatedData;
           });


           // Update summary counts
           setSummary(prevSummary => ({
             ...prevSummary,
             numbers: prevSummary.numbers + 1,
             outbound: prevSummary.outbound + 1
           }));

           toast.success('New recording received and added to table');
         }
       });

      socketRef.current.on('error', (error: any) => {
        console.error('Socket error:', error);
      });

      // Cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
   }, [status, session, stableGetAccessToken, socketExtensions]);

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
            <div className="chart-container" style={{ minHeight: '500px' }}>
              <ChartBar
                series={currentChartData.series}
                categories={currentChartData.categories}
                height={500}
                dataType="time"
              />
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '500px' }}>
              <p className="text-muted mb-0">No chart data available</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Recordings" />

      
      <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">Call Recordings</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                    {/* <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search call recordings..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div> */}
                        <CallRecordingsFilters onFiltersChange={handleFiltersChange} onExport={handleExport} moduleSlug={ModuleSlug.CALL_RECORDINGS} />
                       
                    
                    </div>



                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

    

      <PageSummaryGrid cards={summaryCards} />

      {/* Charts */}
      <Row className="mb-3">
        <Col md={6}>
          <Card>
            <Card.Body className='p-3'>
              

              {!currentChartData || currentChartData.series.length === 0 || currentChartData.series.every(series => series.data.length === 0) ? (
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
                  onFullScreenClick={() => handleOpenChartModal(currentChartData, 'Call Duration', 'calls')}
                  useLogScale={true}
                />
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Body className='p-3'>
            
              {!callDirectionTwo.series || callDirectionTwo.series.length === 0 || callDirectionTwo.series.every(series => series.data.length === 0) ? (
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

      {/* Data Table */}
      {/* <CustomDataTable
        columns={columns}
        data={tableData}
        title="Call Recordings"
        loading={false}
        defaultPageSize={15}
        searchPlaceholder="Search call recordings..."
        serverSide={false}
        paginationInfo={paginationInfo}
        showSearch={false}
        pagination={true}
        showPageSizeSelector={true}
      /> */}

{session?.user?.permissions?.includes('list-call-recordings') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchCallLogs}
                 title="Call Logs"
                 searchPlaceholder="Search call logs..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
                 search={false}
                 tableStyle='table-style-2'
             />
            )}

      {/* Media Player Modal */}
      <Modal
        show={mediaPlayerModal}
        onHide={handleCloseModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Playing a Call Recording 
            {/* - {selectedRecording?.Id || 'Unknown'} */}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecording && (
            <div className="text-center d-flex flex-column align-items-center">
              {audioLoading ? (
                <div className="p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading audio file...</p>
                </div>
              ) : audioError ? (
                <div className="p-4">
                  <div className="alert alert-warning">
                    <i className="ph-duotone ph-warning-circle me-2"></i>
                    File not found
                  </div>
                </div>
              ) : (
                <div>
                  <AudioPlayer
                    ref={audioPlayerRef}
                    audioSrc={audioUrl}
                    title={`Call Recording - ${selectedRecording.Id}`}
                    showWaveform={true}
                  />
                </div>
              )}
              
              
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
