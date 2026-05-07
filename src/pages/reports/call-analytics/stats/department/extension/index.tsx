import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
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
import { formatMinutesAndSeconds, formatCurrency, ModuleSlug, GlobalDateTimeFormat, formatDateTimeToLocal, getAutoTimezone } from '@utils/Helper';
import { HEADER_CONSTANTS } from '@constants/headerConstants';
import { canViewCallLogsFromSession } from '@utils/callPermissionUtils';
import { normalizeBarFiltersForApi } from "../../../callAnalyticsBarFilters";
import "@assets/scss/common.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;





interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration:number;
  avg_duration:number;
  avg_ring_time:number;
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
    { key: 'DepartmentName', name: 'Department Name', selector: (row: any) => row.DepartmentName, sortable: true },
    { key: 'Extension', name: 'Extension', selector: (row: any) => row.Extension, sortable: true },
    { key: 'Username', name: 'User Name', selector: (row: any) => row.Username, sortable: true },
    // { key: 'DepartmentExtension', name: 'Department Extension', selector: (row: any) => row.DepartmentExtension, sortable: true },

    // Outgoing columns
    { key: 'Outgoing_AnsweredCalls', name: 'Outgoing Answered Calls', selector: (row: any) => row.Outgoing?.AnsweredCalls || 0, sortable: true },
    { key: 'Outgoing_Duration', name: 'Outgoing Duration', selector: (row: any) => row.Outgoing?.Duration || 0, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.Outgoing?.Duration || 0)
    },
    { key: 'Outgoing_AvgDuration', name: 'Outgoing Avg Duration', selector: (row: any) => row.Outgoing?.AvgDuration || 0, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.Outgoing?.AvgDuration || 0)
    },
    // { key: 'Outgoing_Cost', name: 'Outgoing Cost', selector: (row: any) => row.Outgoing?.Cost || 0, sortable: true,
    //   cell: (row: any) => formatCurrency(row.Outgoing?.Cost || 0)
    // },
    // { key: 'Outgoing_AvgCost', name: 'Outgoing Avg Cost', selector: (row: any) => row.Outgoing?.AvgCost || 0, sortable: true,
    //   cell: (row: any) => formatCurrency(row.Outgoing?.AvgCost || 0)
    // },
    
    // Incoming columns
    { key: 'Incoming_AnsweredCalls', name: 'Incoming Answered Calls', selector: (row: any) => row.Incoming?.AnsweredCalls || 0, sortable: true },
    { key: 'Incoming_Duration', name: 'Incoming Duration', selector: (row: any) => row.Incoming?.Duration || 0, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.Incoming?.Duration || 0)
    },
    { key: 'Incoming_AvgDuration', name: 'Incoming Avg Duration', selector: (row: any) => row.Incoming?.AvgDuration || 0, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.Incoming?.AvgDuration || 0)
    },
    { key: 'Incoming_AvgRingTime', name: 'Incoming Avg Ring Time', selector: (row: any) => row.Incoming?.AvgRingTime || 0, sortable: true,
      cell: (row: any) => formatMinutesAndSeconds(row.Incoming?.AvgRingTime || 0)
    },
    { key: 'Incoming_Unanswered', name: 'Incoming Unanswered', selector: (row: any) => row.Incoming?.Unanswered || 0, sortable: true },
    


    
    
  ];

  const [showPageLoader, setShowPageLoader] = useState(false);
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
        reportType: 'statsDepartmentExtension',
        moduleSlug: ModuleSlug.CALL_REPORTS
      }, 'call-logs/statsDepartmentExtension');
      
      if (response?.summary) {

        setShowDateRange(true);
      const dataFilters = response?.filters;
      setStartDateTime(dataFilters?.start_datetime);
      setEndDateTime(dataFilters?.end_datetime);

        setSummary(response.summary);
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
    const formattedFilters = normalizeBarFiltersForApi(filters as Record<string, unknown>, {
      stripEmptyIncomingOnly: true,
    }) as Record<string, any>;
    
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
      await DownloadCallsExport(exportPayload, 'call-logs/report/department-extension/download');
    } catch (error: unknown) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Ensure initial fetch happens when session is ready
  useEffect(() => {
    if (canViewCallLogsFromSession(session)) {
      initialFetchDone.current = true;
    }
  }, [session]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Stats By Department Extension" showPageLoader={showPageLoader} />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5}>
                <h2 className="mb-0">Call Stats By Department Extension</h2>
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

      <Row>
        <Col md={12}>
          
          <PageSummaryGrid
                gridColumns={4}
                cards={[
                  {
                    id: 'total-calls',
                    title: 'Total Calls',
                    value: summary.total_calls,
                    description: 'Total number of calls',
                    delay: 0,
                    valueType: 'number',
                    showAnimatedNumber: true
                  },
                  {
                    id: 'avg-ring-time',
                    title: 'Avg Ring Time',
                    value: summary.avg_ring_time,
                    description: 'Average ring time in seconds',
                    delay: 0.3,
                    valueType: 'seconds',
                    showAnimatedNumber: true
                  },
                  {
                    id: 'avg-duration',
                    title: 'Avg Duration',
                    value: summary.avg_duration,
                    description: 'Average call duration',
                    delay: 0.6,
                    valueType: 'seconds',
                    showAnimatedNumber: true
                  },
                  {
                    id: 'total-cost',
                    title: 'Total Duration',
                    value: summary.total_duration,
                    description: 'Total duration of calls',
                    delay: 0.9,
                    valueType: 'seconds',
                    showAnimatedNumber: true,
                  }
                ]}
              />
        
        </Col>
      </Row>

      {canViewCallLogsFromSession(session) && (
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
                const freshDefaults = getDefaultFilters();
                const resetPending = { ...freshDefaults.pending };
                const resetCurrent = { ...freshDefaults.current };
                setPendingFilters(resetPending);
                setCurrentFilters(resetCurrent);
                currentFiltersRef.current = resetCurrent;
                handleFiltersChange(resetPending);
              }}
              filterContent={
                <>
                  

                  {/* Call Direction */}
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

                  {/* Call Status */}
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

                  {/* Department */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Department</Form.Label>
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
            <GenericListPage
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
            />
        </>
      )}

    </React.Fragment>
  );
};

CallStatsDepartment.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallStatsDepartment;