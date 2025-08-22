import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { DashboardData } from '@utils/tickets';
import {GetHierarchyData} from '@utils/users';
import { GetAllStatuses } from '@utils/ticket-statuses';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import { CreateStatus } from '@utils/ticket-statuses';
import { GetAllModules } from '@utils/ticket-module';
import Select from 'react-select';
import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg'
import imgStatus2 from '@assets/images/widget/img-status-2.svg'
import imgStatus3 from '@assets/images/widget/img-status-3.svg'
import imgStatus4 from '@assets/images/widget/img-status-4.svg'
import TicketsFilters from '@components/filters/TicketFilters';

interface Summary {
    tickets: number;
}

interface StatusSummary {
    name: string;
    count: number;
}

interface ModuleSummary {
    module_name: string;
    total_tickets: number;
}

const TicketDashboard = () => {
    const { data:session, status } = useSession();
   
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});

   const [dashboardData, setDashboardData] = useState<any>([]);
   const [summary, setSummary] = useState<Summary>({
    tickets: 0
   });
   const [statusSummary, setStatusSummary] = useState<StatusSummary[]>([]);
   const [moduleSummary, setModuleSummary] = useState<ModuleSummary[]>([]);
   useEffect(() => {
    const fetchDashboardData = async () => {
        try {
            const data = await DashboardData(currentFilters);
            console.log('Dashboard data:', data);
            setDashboardData(data);
            
            // Update summary based on dashboard data
            if (data && data.total_tickets !== undefined) {
                setSummary(prev => ({
                    ...prev,
                    tickets: data.total_tickets || 0
                }));
            }
            if (data && data.statuses !== undefined) {
                setStatusSummary(data.statuses);
            }
            if (data && data.modules !== undefined) {
                setModuleSummary(data.modules);
            }
            
            console.log('Dashboard data:', data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    fetchDashboardData();
    }, [currentFilters]);
   


    const handleFiltersChange = useCallback((filters: any) => {
        //console.log('Filters changed:', filters);
        setCurrentFilters(filters);
    }, []);

  
    const handleExport = async (exportType: string, filters: Record<string, any>) => {
       
    };

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/list" subTitle="Tickets" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <h2 className="mb-0 d-flex align-items-center">
                    Ticket Dashboard 
                    <TicketsFilters onFiltersChange={handleFiltersChange}  />

                </h2>
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
                                          <i className="ph-duotone ph-ticket f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">Tickets</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.tickets > 0 ? (
                                                <AnimatedNumber value={summary?.tickets} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>  
                              </div>
                        </div>
                  </div>
               </Col>


               {/* {statusSummary.map((status) => (
                <Col md={3}>
                    <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-ticket f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">{status.name}</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.tickets > 0 ? (
                                                <AnimatedNumber value={status.count} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>  
                              </div>
                        </div>
                  </div>
                </Col>
               ))}

{moduleSummary.map((module) => (
                    <Col md={3}>
                    <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-ticket f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">{module.module_name}</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.tickets > 0 ? (
                                                <AnimatedNumber value={module.total_tickets} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>  
                              </div>
                        </div>
                  </div>
                </Col>
                ))} */}

               

               
            </Row>

            <Row>
                <Col md={12}>
                    <h4>Ticket Statuses Summary</h4>
                </Col>
            {statusSummary.map((status) => (
                <Col md={3}>
                    <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-ticket f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">{status.name}</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.tickets > 0 ? (
                                                <AnimatedNumber value={status.count} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>  
                              </div>
                        </div>
                  </div>
                </Col>
               ))}
            </Row>
            

            <Row>
                <Col md={12}>
                    <h4>Module Summary</h4>
                </Col>
                {moduleSummary.map((module) => (
                    <Col md={3}>
                    <div className="card statistics-card-1">
                        <div className="card-body">
                              <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                              <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                          <i className="ph-duotone ph-ticket f-26"></i>
                                    </div>
                                    <div>
                                          <p className="text-muted mb-0">{module.module_name}</p>
                                          <div className="d-flex align-items-end">
                                            {summary?.tickets > 0 ? (
                                                <AnimatedNumber value={module.total_tickets} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                          </div>
                                    </div>  
                              </div>
                        </div>
                  </div>
                </Col>
                ))}
            </Row>
            
        
        </React.Fragment>
    );
};

TicketDashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketDashboard;
