import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
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

import { convertUTCToUserTimezone, convertUTCTimeToUserTimezone, convertUTCSeparateDateTimeToUserTime, convertUTCSeparateDateTimeToUserDate, formatDuration, GlobalDateFormat, GlobalTimeFormat,formatDateTimeToLocal, GlobalDateTimeFormat, getAutoTimezone } from '@utils/Helper';
import { ModuleSlug } from '@utils/Helper';
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
    const [currentFilters, setCurrentFilters] = useState({});
    const [pendingFilters, setPendingFilters] = useState({});
    const [searchValue, setSearchValue] = useState<string>('');
    const [currentTimezone, setCurrentTimezone] = useState<string>('');
    const [summary, setSummary] = useState<Summary>({
        users: 0,
        extensions: 0,
        inbound: 0,
        outbound: 0
    });

    const {
        hierarchyDataUsers,
        hierarchyDataDepartments,
        hierarchyDataExtensions,
        loading: hierarchyLoading
    } = useHierarchyData(ModuleSlug.CALL_LOGS);
    const [totalUsers, setTotalUsers] = useState(0);
    useEffect(() => {
        setTotalUsers(hierarchyDataUsers.length);
    }, [hierarchyDataUsers]);

    // Get current timezone on component mount and set default date values
    useEffect(() => {
        const timezone = getAutoTimezone();
        setCurrentTimezone(timezone);
        
        // Set default start_datetime (today 00:00) and end_datetime (today 23:59)
        // Format for datetime-local input (YYYY-MM-DDTHH:mm)
        const now = moment();
        const startDateInput = now.clone().startOf('day').format('YYYY-MM-DDTHH:mm');
        const endDateInput = now.clone().endOf('day').format('YYYY-MM-DDTHH:mm');
        
        // Format for API (UTC format)
        const startDateApi = now.clone().startOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        const endDateApi = now.clone().endOf('day').utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        
        // Set default filters for input (without timezone key)
        const defaultPendingFilters = {
            start_datetime: startDateInput,
            end_datetime: endDateInput
        };
        
        // Set applied filters with API format (with timezone offset in datetime, no timezone key)
        const defaultCurrentFilters = {
            start_datetime: startDateApi,
            end_datetime: endDateApi
        };
        
        setPendingFilters(defaultPendingFilters);
        setCurrentFilters(defaultCurrentFilters);
    }, []);

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
        setShowPageLoader(true);
        const response = await ListCallLogs({ page, perPage, search, filters: currentFilters, moduleSlug: ModuleSlug.CALL_LOGS }, 'call-logs/list');
        setShowPageLoader(false);
        //console.log(response);
        if(response?.summary){

            setShowDateRange(true);
            const dataFilters = response?.filters;
            setStartDateTime(dataFilters?.start_datetime);
            setEndDateTime(dataFilters?.end_datetime);

            setSummary(response.summary);
            //console.log(summary);
        }
        
        return response;
    }, [currentFilters]);

    const handleFiltersChange = (filters: any) => {
        // Format datetime values to include seconds and timezone offset (remove timezone key)
        const formattedFilters: any = { ...filters };
        const timezone = currentTimezone || getAutoTimezone();
        
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
        
        setCurrentFilters(formattedFilters);
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

                    {showDateRange && (
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
                        {showDateRange && (
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
                    setPendingFilters({});
                    setCurrentFilters({});
                    setSearchValue('');
                    handleFiltersChange({});
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
                                        const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
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
