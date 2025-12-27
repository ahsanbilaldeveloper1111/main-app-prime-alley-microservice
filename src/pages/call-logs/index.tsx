import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListCallLogs, ExportCallLogs, DownloadStreamingExport } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { Row, Col, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import CallLogsFilters from '@components/filters/CallLogsFilters';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import moment from 'moment';
import PageLoader from '@components/PageLoader';


import '@assets/scss/common.scss';

import { convertUTCSeparateDateTimeToUserTime, convertUTCSeparateDateTimeToUserDate, formatDuration, GlobalDateFormat, GlobalTimeFormat, formatDateTimeToLocal, GlobalDateTimeFormat, ModuleSlug } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import BarFilters from '@components/BarFilters';
import SelectBox from '@components/SelectBox';


interface Summary {
    users: number;
    extensions: number;
    inbound: number;
    outbound: number;
}

const CallLogs = () => {
    const { data:session, status } = useSession();
    const [showPageLoader, setShowPageLoader] = useState(false);

    const [showDateRange, setShowDateRange] = useState(false);
    const [startDateTime, setStartDateTime] = useState<string>('');
    const [endDateTime, setEndDateTime] = useState<string>('');
   
    const columns: Column[] = [
        { key: 'Date', name: 'Date', selector: (row: any) => row.Date, sortable: true,
            cell: (props: any) => {
                // Convert UTC date to user's timezone using separate date and time
                const formattedDate = convertUTCSeparateDateTimeToUserDate(props.Date, props.Time, GlobalDateFormat);
                return formattedDate;
            }
         },
        { key: 'Time', name: 'Time', selector: (row: any) => row.Time, sortable: true,
            cell: (props: any) => {
                // Convert UTC time to user's timezone using separate date and time
                const formattedTime = convertUTCSeparateDateTimeToUserTime(props.Date, props.Time, GlobalTimeFormat);
                return formattedTime;
            }
         },
        { key: 'username', name: 'Username', selector: (row: any) => row.username, sortable: true },
        { key: 'department_name', name: 'Department', selector: (row: any) => row.department_name, sortable: true },
        { key: 'call_type', name: 'Call Type', selector: (row: any) => row.call_type, sortable: true },
        {
            key: 'Duration',
            name: 'Duration',
            selector: (row: any) => row.duration,
            sortable: true,
            cell: (props: any) => {
              const duration = parseInt(props.duration) || 0;
              return (
                <div>
                  {formatDuration(duration)}
                </div>
              );
            }
          },
        { key: 'extension', name: 'Extension', selector: (row: any) => row.extension, sortable: true },
        { key: 'phone_number', name: 'Phone Number', selector: (row: any) => row.phone_number, sortable: true },
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    
    // Initialize filters with default values immediately to prevent first API call without dates
    const getDefaultFilters = () => {
        const now = moment();
        const startDateInput = now.clone().startOf('day').format('YYYY-MM-DDTHH:mm');
        const endDateInput = now.clone().endOf('day').format('YYYY-MM-DDTHH:mm');
        const startDateApi = now.clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        const endDateApi = now.clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        return {
            pending: {
                start_datetime: startDateInput,
                end_datetime: endDateInput
            },
            current: {
                start_datetime: startDateApi,
                end_datetime: endDateApi
            }
        };
    };
    
    const defaultFilters = getDefaultFilters();
    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(defaultFilters.current);
    const [pendingFilters, setPendingFilters] = useState<Record<string, any>>(defaultFilters.pending);
    const [searchValue, setSearchValue] = useState<string>('');
    
    // Refs to prevent duplicate API calls
    const currentFiltersRef = useRef<Record<string, any>>(defaultFilters.current);
    const isFetchingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const lastFetchParamsRef = useRef<string>('');
    
    const [summary, setSummary] = useState<Summary>({
        users: 0,
        extensions: 0,
        inbound: 0,
        outbound: 0
    });

    const {
        hierarchyDataUsers,
        hierarchyDataExtensions,
        loading: hierarchyLoading
    } = useHierarchyData(ModuleSlug.CALL_LOGS);
    const [totalUsers, setTotalUsers] = useState(0);
    useEffect(() => {
        setTotalUsers(hierarchyDataUsers.length);
    }, [hierarchyDataUsers]);

    // Create cards data for PageSummaryGrid
    const summaryCards: SummaryCard[] = [
        {
            id: 'total-users',
            title: 'Total Users',
            value: totalUsers || 0,
            description: 'Show Registered users in the system',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'extensions',
            title: 'Extensions',
            value: summary?.extensions || 0,
            description: 'Show Extensions currently engaged or making calls',
            delay: 0.3,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'inbound',
            title: 'Inbound',
            value: summary?.inbound || 0,
            description: 'Total received call count',
            delay: 0.5,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'outbound',
            title: 'Outbound',
            value: summary?.outbound || 0,
            description: 'Total placed call count',
            delay: 0.7,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        }
    ];
    
    const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
        // Prevent duplicate calls
        const now = Date.now();
        const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(currentFiltersRef.current)}`;
        
        // Skip if already fetching with same params within 500ms
        if (isFetchingRef.current && lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 500) {
            return;
        }
        
        // Skip if same params were fetched recently (within 100ms)
        if (lastFetchParamsRef.current === paramsKey && (now - lastFetchTimeRef.current) < 100) {
            return;
        }
        
        isFetchingRef.current = true;
        lastFetchTimeRef.current = now;
        lastFetchParamsRef.current = paramsKey;
        
        setShowPageLoader(true);
        try {
            const response = await ListCallLogs({ 
                page, 
                perPage, 
                search, 
                filters: currentFiltersRef.current, 
                moduleSlug: ModuleSlug.CALL_LOGS 
            }, 'call-logs/list');
            
            if(response?.summary){
                setShowDateRange(true);
                const dataFilters = response?.filters;
                setStartDateTime(dataFilters?.start_datetime);
                setEndDateTime(dataFilters?.end_datetime);
                setSummary(response.summary);
            }
            
            return response;
        } finally {
            setShowPageLoader(false);
            isFetchingRef.current = false;
        }
    }, []);

    const handleFiltersChange = (filters: any) => {
        // Format datetime values to include seconds and timezone offset (remove timezone key)
        const formattedFilters: any = { ...filters };
        
        if (formattedFilters.start_datetime) {
            // datetime-local returns YYYY-MM-DDTHH:mm format, convert to YYYY-MM-DDTHH:mm:ss with timezone offset
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
            // datetime-local returns YYYY-MM-DDTHH:mm format, convert to YYYY-MM-DDTHH:mm:ss with timezone offset
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
        
        // Remove timezone key from payload (timezone is now included in datetime values)
        delete formattedFilters.timezone;
        
        // Update both state and ref immediately
        setCurrentFilters(formattedFilters);
        currentFiltersRef.current = formattedFilters;
        
        // Trigger refresh for GenericListPage to fetch new data
        setRefreshKey((prev) => prev + 1);
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
     
        setShowPageLoader(true);
      try {
            if (exportType === 'excel') {
             
              await DownloadStreamingExport(
                { filters: currentFilters, isExport: true, exportType, moduleSlug: ModuleSlug.CALL_LOGS },
                'call-logs/list',
                'downlaodCallLogs'
              ).finally(() => {
                setShowPageLoader(false);
              });
            }
          } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed');
          }
    };

    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" showPageLoader={showPageLoader} />
           

            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">Call Logs</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      

                    

                    {/* <div className="action-buttons">

                    {showDateRange && startDateTime && endDateTime && moment.utc(startDateTime).isValid() && moment.utc(endDateTime).isValid() && (
                            <>
                            <p className="mb-0">
                            Date Range: <span className="status-badge primary">{formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)}</span> to <span className="status-badge primary">{formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}</span>
                            </p>
                          
                            </>
                          )}
                    
                        <CallLogsFilters onFiltersChange={handleFiltersChange} onExport={handleExport} moduleSlug={ModuleSlug.CALL_LOGS} />
                    
                    </div> */}



                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

           
            <PageSummaryGrid cards={summaryCards} />

            <BarFilters
                searchValue={searchValue}
                onSearchChange={(value) => setSearchValue(value)}
                onSearch={() => {
                    const filtersWithSearch = { ...pendingFilters, search: searchValue };
                    setPendingFilters(filtersWithSearch);
                    setCurrentFilters(filtersWithSearch);
                    handleFiltersChange(filtersWithSearch);
                }}
                leftContent={
                    <>
                        {showDateRange && startDateTime && endDateTime && moment.utc(startDateTime).isValid() && moment.utc(endDateTime).isValid() && (
                            <p className="mb-0">
                                Date Range: <span className="status-badge primary">{formatDateTimeToLocal(startDateTime, GlobalDateTimeFormat)}</span> to <span className="status-badge primary">{formatDateTimeToLocal(endDateTime, GlobalDateTimeFormat)}</span>
                            </p>
                        )}
                    </>
                }
                searchPlaceholder="Search call logs..."
                showSearch={false}
                filters={pendingFilters}
                onSubmit={() => {
                    handleFiltersChange(pendingFilters);
                }}
                onReset={() => {
                    // Preserve current date filters, clear all other filters
                    const resetPendingFilters: Record<string, any> = {
                        start_datetime: (pendingFilters as any)?.start_datetime || defaultFilters.pending.start_datetime,
                        end_datetime: (pendingFilters as any)?.end_datetime || defaultFilters.pending.end_datetime,
                    };
                    const resetCurrentFilters: Record<string, any> = {
                        start_datetime: (currentFilters as any)?.start_datetime || defaultFilters.current.start_datetime,
                        end_datetime: (currentFilters as any)?.end_datetime || defaultFilters.current.end_datetime,
                    };
                    setPendingFilters(resetPendingFilters);
                    setCurrentFilters(resetCurrentFilters);
                    currentFiltersRef.current = resetCurrentFilters;
                    setSearchValue('');
                    handleFiltersChange(resetPendingFilters);
                }}
                filterContent={
                    <>
                        {/* Call Direction */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Call Direction</Form.Label>
                                <SelectBox
                                    isSearchable={false}
                                    value={(pendingFilters as any)?.call_direction || null}
                                    onChange={(value) => {
                                        setPendingFilters({ ...pendingFilters, call_direction: value as string || '' });
                                    }}
                                    options={[
                                        { value: 'OUTGOING', label: 'Outgoing' },
                                        { value: 'INCOMING', label: 'Incoming' },
                                        { value: 'Both', label: 'Both' }
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
                                <Form.Control
                                    type="text"
                                    placeholder="Enter department"
                                    value={(pendingFilters as any)?.department || ''}
                                    onChange={(e) => {
                                        setPendingFilters({ ...pendingFilters, department: e.target.value });
                                    }}
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

            {session?.user?.permissions?.includes('list-call-logs') && (
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

        
        </React.Fragment>
    );
};

CallLogs.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallLogs;
