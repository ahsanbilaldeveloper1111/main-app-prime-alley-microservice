import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListCallLogs, ExportCallLogs, DownloadStreamingExport } from '@utils/calls';
import { GetHierarchyData } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import CallLogsFilters from '@components/filters/CallLogsFilters';
import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import moment from 'moment';
import { convertUTCToUserTimezone, convertUTCTimeToUserTimezone, convertUTCSeparateDateTimeToUserTime, convertUTCSeparateDateTimeToUserDate, formatDuration, GlobalDateFormat, GlobalTimeFormat } from '@utils/Helper';
import { ModuleSlug } from '@utils/Helper';

interface Summary {
    users: number;
    extensions: number;
    inbound: number;
    outbound: number;
}

const CallLogs = () => {
    const { data:session, status } = useSession();
   
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
    const [summary, setSummary] = useState<Summary>({
        users: 0,
        extensions: 0,
        inbound: 0,
        outbound: 0
    });
    
    const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
        const response = await ListCallLogs({ page, perPage, search, filters: currentFilters, moduleSlug: ModuleSlug.CALL_LOGS }, 'call-logs/list');
        //console.log(response);
        if(response?.summary){
            setSummary(response.summary);
            //console.log(summary);
        }
        
        return response;
    }, [currentFilters]);

    const handleFiltersChange = (filters: any) => {
        setCurrentFilters(filters);
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
     

      try {
            if (exportType === 'excel') {
             
              await DownloadStreamingExport(
                { filters: currentFilters, isExport: true, exportType, moduleSlug: ModuleSlug.CALL_LOGS },
                'call-logs/list',
                'downlaodCallLogs'
              );
            }
          } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed');
          }
    };

    
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Logs" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <Row className="align-items-center">
                    <Col md={3}>
                      <h2 className="mb-0 d-flex align-items-center">
                      Call Logs
                      </h2>
                    </Col>
                    <Col md={9} className="d-flex justify-content-end">
                      <CallLogsFilters onFiltersChange={handleFiltersChange} onExport={handleExport} moduleSlug={ModuleSlug.CALL_LOGS} />
                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

            <Row>
               <Col md={3}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-users f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Users</p>
                                          <div className="d-flex align-items-end">
                                                <AnimatedNumber value={summary?.users} duration={1000} />
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-phone-call f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Extensions</p>
                                          <div className="d-flex align-items-end">
                                                <AnimatedNumber value={summary?.extensions} duration={1000} />
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-2 text-white me-3">
                                          <i className="ph-duotone ph-phone-call f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Inbound</p>
                                          <div className="d-flex align-items-end">
                                                <AnimatedNumber value={summary?.inbound} duration={1000} />
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

               <Col md={3}>
                  <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus2.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-phone-call f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Outbound</p>
                                          <div className="d-flex align-items-end">
                                                <AnimatedNumber value={summary?.outbound} duration={1000} />
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
               </Col>

            </Row>

            {session?.user?.permissions?.includes('list-call-logs') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchCallLogs}
                 title="Call Logs"
                 searchPlaceholder="Search call logs..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
             />
            )}

        
        </React.Fragment>
    );
};

CallLogs.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default CallLogs;
