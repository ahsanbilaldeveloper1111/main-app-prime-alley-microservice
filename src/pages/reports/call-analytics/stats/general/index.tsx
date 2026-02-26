import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { ListCallLogs, DownloadCallsExport } from '@utils/calls';
import { Column } from '@components/CustomDataTable';
import { Row, Form } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import BarFilters from '@components/BarFilters';
import SelectBox from '@components/SelectBox';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import PageSummaryGrid from '@components/PageSummaryGrid';
import '@assets/scss/report-style.scss';
import moment from 'moment';
import { formatMinutesAndSeconds, ModuleSlug, GlobalDateTimeFormat, formatDateTimeToLocal, getAutoTimezone } from '@utils/Helper';

// Helper function to convert HH:MM:SS to seconds
const timeStringToSeconds = (timeStr: string): number => {
  if (!timeStr || timeStr === '00:00:00') return 0;
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hours = Number.parseInt(parts[0], 10) || 0;
    const minutes = Number.parseInt(parts[1], 10) || 0;
    const seconds = Number.parseInt(parts[2], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
};
import "@assets/scss/common.scss";





interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration:number;
  avg_duration:number;
  avg_ring_time:number;
  outgoing?: {
    TotalCalls: string;
    TotalDuration: string;
    AvgDuration: string;
    AvgCost: string;
    TotalCost: string;
    ComparisonCost: string;
    Saving: string;
    SavingPerc: string;
    AnsweredCalls: string;
    MissedCalls: string;
  };
  incoming?: {
    TotalCalls: string;
    TotalDuration: string;
    AvgDuration: string;
    AnsweredCalls: string;
    DirectCalls: string;
    TransferredCalls: string;
    MissedCalls: string;
    AvgRingTime: string;
  };
}


const CallStatsDepartment = () => {
  const { data: session } = useSession();

  const [showDateRange, setShowDateRange] = useState(false);
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Initialize filters with default values immediately to prevent first API call without dates
  const getDefaultFilters = () => {
    const now = moment();
    const startDateInput = now.clone().startOf('day').format('YYYY-MM-DDTHH:mm');
    const endDateInput = now.clone().endOf('day').format('YYYY-MM-DDTHH:mm');
    const startDateUTC = now.clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    const endDateUTC = now.clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    return {
      pending: {
        start_datetime: startDateInput,
        end_datetime: endDateInput
      },
      current: {
        start_datetime: startDateUTC,
        end_datetime: endDateUTC
      }
    };
  };
  
  const defaultFilters = getDefaultFilters();

  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState<number>(1); // Start at 1 to ensure initial fetch
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(defaultFilters.current);
  const [pendingFilters, setPendingFilters] = useState<Record<string, any>>(defaultFilters.pending);
  const [dataLoaded, setDataLoaded] = useState(false);
  const filtersReady = true; // Always ready since filters are initialized immediately
  
  const {
    hierarchyDataExtensions,
    hierarchyDataDepartments,
    loading: hierarchyLoading
  } = useHierarchyData(ModuleSlug.CALL_REPORTS);
  
  // Use ref to track if initial fetch has been done
  const initialFetchDone = React.useRef(false);
  
  // Refs to prevent duplicate API calls
  const currentFiltersRef = useRef<Record<string, any>>(defaultFilters.current);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const lastFetchParamsRef = useRef<string>('');
  
  const [summary, setSummary] = useState<Summary>({
    total_calls: 0,
    answered_calls: 0,
    unanswered_calls: 0,
    total_cost: 0,
    total_duration:0,
    avg_duration:0,
    avg_ring_time:0
  });

  const columns: Column[] = [
    { key: 'DepartmentName', name: 'DepartmentName', selector: (row: any) => row.DepartmentName, sortable: true },
    { key: 'Calls', name: 'Total Calls', selector: (row: any) => row.Calls, sortable: true },
    { key: 'Answered', name: 'Answered', selector: (row: any) => row.Answered, sortable: true },
    { key: 'Unanswered', name: 'Un Answered', selector: (row: any) => row.Unanswered, sortable: true },

    { key: 'AvgRingTime', name: 'Avg Ring Time', selector: (row: any) => row.AvgRingTime, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.AvgRingTime)
     },
    { key: 'MaxRingTime', name: 'Max Ring Time', selector: (row: any) => row.MaxRingTime, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.MaxRingTime)
     },

    { key: 'Duration', name: 'Total Duration', selector: (row: any) => row.Duration, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.Duration)
     },
    { key: 'AvgDuration', name: 'Avg Duration', selector: (row: any) => row.AvgDuration, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.AvgDuration)
     },

    // { key: 'Cost', name: 'Total Cost', selector: (row: any) => row.Cost, sortable: true,
    //   cell: (row: any) => formatCurrency(row.Cost)
    //  },
    // { key: 'AvgCost', name: 'Avg Cost', selector: (row: any) => row['Avg Cost'], sortable: true,
    //   cell: (row: any) => formatCurrency(Number(row['Avg Cost']))
    //  },
  ];

  const [showPageLoader, setShowPageLoader] = useState(false);
  useEffect(() => {
    fetchCallLogs();
  }, [currentFilters]);
  const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
    // Prevent duplicate calls - but always allow the first call
    const now = Date.now();
    const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(currentFiltersRef.current)}`;
    
    // Skip if already fetching with same params within 500ms
    if (isFetchingRef.current && lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 500) {
      return;
    }
    
    // Skip if same params were fetched recently (within 100ms) - but allow first call (when lastFetchParamsRef is empty string)
    if (lastFetchParamsRef.current !== '' && lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 100) {
      return;
    }
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    lastFetchParamsRef.current = paramsKey;
    
    setLoading(true);
    setShowPageLoader(true);
    
    try {
      const response = await ListCallLogs({ 
        page, 
        perPage, 
        search, 
        filters: currentFiltersRef.current, 
        reportType: 'statsGeneral',
        moduleSlug: ModuleSlug.CALL_REPORTS
      }, 'call-logs/generalStats');

      if (response) {
        setShowDateRange(true);
        const dataFilters = response?.filters;
        setStartDateTime(dataFilters?.start_datetime);
        setEndDateTime(dataFilters?.end_datetime);

        // Set summary with outgoing and incoming data
        setSummary({
          total_calls: 0,
          answered_calls: 0,
          unanswered_calls: 0,
          total_cost: 0,
          total_duration: 0,
          avg_duration: 0,
          avg_ring_time: 0,
          outgoing: response?.outgoing,
          incoming: response?.incoming
        });
        setDataLoaded(true);
      } else {
        setDataLoaded(true);
      }
      
      setLoading(false);
      return response;
    } catch {
      setLoading(false);
      setDataLoaded(true);
      toast.error('Failed to fetch call data');
      return null;
    } finally {
      setShowPageLoader(false);
      isFetchingRef.current = false;
    }
  }, []);


  const handleFiltersChange = (filters: any) => {
    // Convert datetime values from local timezone to UTC before sending to API
    const formattedFilters: any = { ...filters };
    
    if (formattedFilters.start_datetime) {
      // datetime-local returns YYYY-MM-DDTHH:mm format in local timezone
      // Convert to UTC ISO format
      let startMoment = moment(formattedFilters.start_datetime);
      
      if (formattedFilters.start_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        // Format is YYYY-MM-DDTHH:mm, add :00 seconds
        startMoment = moment(formattedFilters.start_datetime + ':00');
      } else if (!formattedFilters.start_datetime.includes('T')) {
        // If only date, set to 00:00:00
        startMoment = moment(formattedFilters.start_datetime).startOf('day');
      }
      
      // Convert to UTC
      formattedFilters.start_datetime = startMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    }
    
    if (formattedFilters.end_datetime) {
      // datetime-local returns YYYY-MM-DDTHH:mm format in local timezone
      // Convert to UTC ISO format
      let endMoment = moment(formattedFilters.end_datetime);
      
      if (formattedFilters.end_datetime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        // Format is YYYY-MM-DDTHH:mm, check if it's 23:59, otherwise add :00
        const timePart = formattedFilters.end_datetime.split('T')[1];
        if (timePart === '23:59') {
          endMoment = moment(formattedFilters.end_datetime + ':59');
        } else {
          endMoment = moment(formattedFilters.end_datetime + ':00');
        }
      } else if (!formattedFilters.end_datetime.includes('T')) {
        // If only date, set to 23:59:59
        endMoment = moment(formattedFilters.end_datetime).endOf('day');
      }
      
      // Convert to UTC
      formattedFilters.end_datetime = endMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    }
    
    // Remove is_incoming_only if it's empty, null, or undefined (don't send to API by default)
    if (!formattedFilters.is_incoming_only || formattedFilters.is_incoming_only === '') {
      delete formattedFilters.is_incoming_only;
    }
    
    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(formattedFilters);
    const isCompletelyCleared = Object.keys(formattedFilters).length === 0 || 
      (Object.keys(formattedFilters).length === 1 && formattedFilters.hasOwnProperty('is_incoming_only'));
    
    // Update both state and ref immediately
    setCurrentFilters(formattedFilters);
    currentFiltersRef.current = formattedFilters;
    
    if ((filtersChanged && filtersReady) || isCompletelyCleared) {
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportPayload = {
        ...currentFilters,
        timezone: getAutoTimezone()
      };
      await DownloadCallsExport(exportPayload, 'call-logs/report/general/download');
    } catch (error: unknown) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Ensure initial fetch happens when session is ready
  useEffect(() => {
    if (session && session.user?.permissions?.includes('list-call-logs')) {
      initialFetchDone.current = true;
    }
  }, [session]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="General Call Statistics" showPageLoader={showPageLoader} />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5}>
                <h2 className="mb-0">General Call Statistics</h2>
              </Col>
              <Col md={7} className="d-flex justify-content-end">
                <div className="action-buttons">
                  {/* {session?.user?.permissions?.includes('') && ( */}
                    <div className="d-flex align-items-center gap-2">
                      <button 
                        className="btn btn-outline-secondary" 
                        onClick={() => handleExport()}
                        disabled={isExporting}
                      >
                        {isExporting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Exporting...
                          </>
                        ) : (
                          'Export'
                        )}
                      </button>
                    </div>
                  {/* )} */}
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <>
            <BarFilters
              leftContent={
                <>
                  {showDateRange && (
                    <p className="mb-0">
                      Date Range: <span className="status-badge primary">{formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)}</span> to <span className="status-badge primary">{formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}</span>
                    </p>
                  )}
                </>
              }
              searchValue=""
              onSearchChange={() => {}}
              onSearch={() => {}}
              searchPlaceholder="Search call stats..."
              showSearch={false}
              filters={pendingFilters}
              onSubmit={() => {
                // Convert and apply filters, then trigger all APIs
                handleFiltersChange(pendingFilters);
                // fetchCallLogs will be triggered by refreshKey change
              }}
              onReset={() => {
                // Preserve current date filters, clear all other filters
                const resetPendingFilters: Record<string, any> = {
                  start_datetime: (pendingFilters as any)?.start_datetime || defaultFilters.pending.start_datetime,
                  end_datetime: (pendingFilters as any)?.end_datetime || defaultFilters.pending.end_datetime
                };
                const resetCurrentFilters: Record<string, any> = {
                  start_datetime: (currentFilters as any)?.start_datetime || defaultFilters.current.start_datetime,
                  end_datetime: (currentFilters as any)?.end_datetime || defaultFilters.current.end_datetime
                };
                setPendingFilters(resetPendingFilters);
                setCurrentFilters(resetCurrentFilters);
                currentFiltersRef.current = resetCurrentFilters;
                handleFiltersChange(resetPendingFilters);
              }}
              filterContent={
                <>
                  

                  {/* Call Status */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Call Direction</Form.Label>
                      <SelectBox
                        isSearchable={false}
                        value={(pendingFilters as any)?.is_incoming_only || null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, is_incoming_only: value as string || '' });
                        }}
                        options={[
                          { value: 'true', label: 'Incoming' },
                          { value: 'false', label: 'Outgoing' },
                          { value: '', label: 'Both' }
                        ]}
                        placeholder="Select call direction"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Call Status</Form.Label>
                      <SelectBox
                        isSearchable={false}
                        value={(pendingFilters as any)?.call_status || null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, call_status: value as string || '' });
                        }}
                        options={[
                          { value: 'Answered', label: 'Answered' },
                          { value: 'Not Answered', label: 'Not Answered' },
                          { value: 'Both', label: 'Both' }
                        ]}
                        placeholder="Select call status"
                      />
                    </Form.Group>
                  </Col>

                  {/* Called Numbers */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Called Numbers</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter called numbers (comma separated)"
                        value={((pendingFilters as any)?.called_numbers || []).join(', ')}
                        onChange={(e) => {
                          const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                          setPendingFilters({ ...pendingFilters, called_numbers: values });
                        }}
                      />
                    </Form.Group>
                  </Col>

                  {/* Extension */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Extension</Form.Label>
                      <SelectBox
                        isMulti
                        isSearchable={true}
                        isDisabled={hierarchyLoading}
                        value={(pendingFilters as any)?.extension_number?.length > 0 ? (pendingFilters as any)?.extension_number : null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, extension_number: value ? (value as string[]) : [] });
                        }}
                        options={(hierarchyDataExtensions as any)?.map((ext: any) => ({
                          value: ext.id,
                          label: ext.name
                        })) || []}
                        placeholder="Select extensions"
                      />
                    </Form.Group>
                  </Col>

                  {/* Traffic Type */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Traffic Type</Form.Label>
                      <SelectBox
                        isSearchable={false}
                        value={(pendingFilters as any)?.traffic_type || null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, traffic_type: value as string || '' });
                        }}
                        options={[
                          { value: '', label: 'All' },
                          { value: 'internal', label: 'Internal' },
                          { value: 'external', label: 'External' }
                        ]}
                        placeholder="Select traffic type"
                      />
                    </Form.Group>
                  </Col>

                  {/* Destination Type */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Destination Type</Form.Label>
                      <SelectBox
                        isSearchable={false}
                        value={(pendingFilters as any)?.destination_type || null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, destination_type: value as string || '' });
                        }}
                        options={[
                          { value: '', label: 'All' },
                          { value: 'local', label: 'Local' },
                          { value: 'national', label: 'National' },
                          { value: 'international', label: 'International' }
                        ]}
                        placeholder="Select destination type"
                      />
                    </Form.Group>
                  </Col>

                  {/* Departments */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Departments</Form.Label>
                      <SelectBox
                        isMulti
                        isSearchable={true}
                        isDisabled={hierarchyLoading}
                        value={(pendingFilters as any)?.department?.length > 0 ? (pendingFilters as any)?.department : null}
                        onChange={(value) => {
                          setPendingFilters({ ...pendingFilters, department: value ? (value as string[]) : [] });
                        }}
                        options={(hierarchyDataDepartments as any)?.map((dept: any) => ({
                          value: dept.id,
                          label: dept.name
                        })) || []}
                        placeholder="Select departments"
                      />
                    </Form.Group>
                  </Col>

                  {/* Date Range - Start */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Start Date & Time</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={(pendingFilters as any)?.start_datetime || ''}
                        max={moment().format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => {
                          const datetimeValue = e.target.value;
                          const endDate = (pendingFilters as any)?.end_datetime || '';
                          
                          // If start date is greater than end date, adjust end date to start date
                          let updatedFilters: any = {
                              ...pendingFilters,
                              start_datetime: datetimeValue
                          };
                          
                          if (datetimeValue && endDate && moment(datetimeValue).isAfter(moment(endDate))) {
                              updatedFilters.end_datetime = datetimeValue;
                          }
                          
                          setPendingFilters(updatedFilters);
                        }}
                      />
                    </Form.Group>
                  </Col>

                  {/* Date Range - End */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>End Date & Time</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={(pendingFilters as any)?.end_datetime || ''}
                        min={(pendingFilters as any)?.start_datetime || ''}
                        max={moment().format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => {
                          const datetimeValue = e.target.value;
                          const startDate = (pendingFilters as any)?.start_datetime || '';
                          
                          // If end date is less than start date, adjust start date to end date
                          let updatedFilters: any = {
                              ...pendingFilters,
                              end_datetime: datetimeValue
                          };
                          
                          if (datetimeValue && startDate && moment(datetimeValue).isBefore(moment(startDate))) {
                              updatedFilters.start_datetime = datetimeValue;
                          }
                          
                          setPendingFilters(updatedFilters);
                        }}
                      />
                    </Form.Group>
                  </Col>
                </>
              }
            />
            {/* <GenericListPage
              columns={columns}
              fetchData={fetchCallLogs}
              title="Call Logs"
              searchPlaceholder="Search call stats..."
              defaultPageSize={15}
              filters={currentFilters}
              refreshKey={refreshKey}
              key={refreshKey}
              tableStyle='table-style-2'
              search={false}
            /> */}
        </>

      {/* Outgoing Summary Tiles */}
      <Row className="mb-4">
        <Col md={12}>
          <h4 className="mb-3">Outgoing Calls</h4>
          <PageSummaryGrid
            gridColumns={4}
            cards={[
              {
                id: 'outgoing-total-calls',
                title: 'Total Calls',
                value: Number(summary.outgoing?.TotalCalls || 0),
                description: 'Total outgoing calls',
                delay: 0,
                valueType: 'number',
                showAnimatedNumber: true
              },
              {
                id: 'outgoing-total-duration',
                title: 'Total Duration',
                value: timeStringToSeconds(summary.outgoing?.TotalDuration || '00:00:00'),
                description: 'Total duration of outgoing calls',
                delay: 0.1,
                valueType: 'seconds',
                showAnimatedNumber: true
              },
              {
                id: 'outgoing-avg-duration',
                title: 'Avg Duration',
                value: timeStringToSeconds(summary.outgoing?.AvgDuration || '00:00:00'),
                description: 'Average duration of outgoing calls',
                delay: 0.2,
                valueType: 'seconds',
                showAnimatedNumber: true
              },
              {
                id: 'outgoing-answered-calls',
                title: 'Answered Calls',
                value: Number(summary.outgoing?.AnsweredCalls || 0),
                description: 'Total answered outgoing calls',
                delay: 0.3,
                valueType: 'number',
                showAnimatedNumber: true
              },
              {
                id: 'outgoing-missed-calls',
                title: 'Missed Calls',
                value: Number(summary.outgoing?.MissedCalls || 0),
                description: 'Total missed outgoing calls',
                delay: 0.4,
                valueType: 'number',
                showAnimatedNumber: true
              },
            ]}
          />
        </Col>
      </Row>

      {/* Incoming Summary Tiles */}
      <Row className="mb-4">
        <Col md={12}>
          <h4 className="mb-3">Incoming Calls</h4>
          <PageSummaryGrid
            gridColumns={4}
            cards={[
              {
                id: 'incoming-total-calls',
                title: 'Total Calls',
                value: Number(summary.incoming?.TotalCalls || 0),
                description: 'Total incoming calls',
                delay: 0,
                valueType: 'number',
                showAnimatedNumber: true
              },
              {
                id: 'incoming-total-duration',
                title: 'Total Duration',
                value: timeStringToSeconds(summary.incoming?.TotalDuration || '00:00:00'),
                description: 'Total duration of incoming calls',
                delay: 0.1,
                valueType: 'seconds',
                showAnimatedNumber: true
              },
              {
                id: 'incoming-avg-duration',
                title: 'Avg Duration',
                value: timeStringToSeconds(summary.incoming?.AvgDuration || '00:00:00'),
                description: 'Average duration of incoming calls',
                delay: 0.2,
                valueType: 'seconds',
                showAnimatedNumber: true
              },
              {
                id: 'incoming-answered-calls',
                title: 'Answered Calls',
                value: Number(summary.incoming?.AnsweredCalls || 0),
                description: 'Total answered incoming calls',
                delay: 0.3,
                valueType: 'number',
                showAnimatedNumber: true
              },
              {
                id: 'incoming-direct-calls',
                title: 'Direct Calls',
                value: Number(summary.incoming?.DirectCalls || 0),
                description: 'Direct incoming calls',
                delay: 0.4,
                valueType: 'number',
                showAnimatedNumber: true
              },
              {
                id: 'incoming-transferred-calls',
                title: 'Transferred Calls',
                value: Number(summary.incoming?.TransferredCalls || 0),
                description: 'Transferred incoming calls',
                delay: 0.5,
                valueType: 'number',
                showAnimatedNumber: true
              },
              {
                id: 'incoming-missed-calls',
                title: 'Missed Calls',
                value: Number(summary.incoming?.MissedCalls || 0),
                description: 'Missed incoming calls',
                delay: 0.6,
                valueType: 'number',
                showAnimatedNumber: true
              },
              {
                id: 'incoming-avg-ring-time',
                title: 'Avg Ring Time',
                value: timeStringToSeconds(summary.incoming?.AvgRingTime || '00:00:00'),
                description: 'Average ring time for incoming calls',
                delay: 0.7,
                valueType: 'seconds',
                showAnimatedNumber: true
              }
            ]}
          />
        </Col>
      </Row>

       


    </React.Fragment>
  );
};

CallStatsDepartment.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallStatsDepartment;