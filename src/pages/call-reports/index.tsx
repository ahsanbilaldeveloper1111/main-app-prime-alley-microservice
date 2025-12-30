import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";
import "@assets/scss/reports.scss";
import moment from 'moment';
import { useSession } from 'next-auth/react';
import router from 'next/router';


const PageReports = () => {
    const { data: session } = useSession();
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Call Analytics" mainLink="/call-reports" subTitle="Call Analytics" />
            {/* <PageHeader title="Reports" leftGrid={12} /> */}


        <Row>   
            <Col md={12}>
            <div className="dashboard">
                <div className="dashboard-section">
                    <div className="section-header app-title-heading"><span className="material-icons-two-tone">call</span>
                    Call Analytics
                    </div>
                    <div className="report-grid" id="reportGrid">
                        <Row className="">
                           
                           {session?.user?.permissions?.includes('call-reports-by-statistics-reports') && (
                            
                            <>
                            
                            <Col md={4}>
                                <div  className="report-card" >
                                    <div className="report-header">
                                        <span className="material-icons-two-tone report-icon">call</span>
                                        <h2 className="report-title app-title-heading">Call Stats By Country</h2>
                                    </div>
                                    <p className="report-description">
                                    Visualize call volumes, durations, and trends across countries with dynamic charts and detailed metrics.
                                    </p>
                                    <div className="report-meta">
                                        <div className="meta-item">Type: <span>Inbound/Outbound</span></div>
                                        
                                        <div className="view-button app-button btn btn-primary"
                                        onClick={() => router.push('/call-reports/stats/country')}
                                        >View</div>
                                    </div>
                                </div>
                            </Col>


                            <Col md={4}>
                                <div className="report-card" >
                                    <div className="report-header">
                                        <span className="material-icons-two-tone report-icon">call</span>
                                        <h2 className="report-title">Call Stats By Department</h2>
                                    </div>
                                    <p className="report-description">
                                    Visualize call volumes, durations, and trends across departments with dynamic charts and detailed metrics.
                                    </p>
                                    <div className="report-meta">
                                        <div className="meta-item">Type: <span>Inbound/Outbound</span></div>
                                        
                                        <div className="view-button app-button btn btn-primary"
                                        onClick={() => router.push('/call-reports/stats/department')}
                                        >View</div>
                                    </div>
                                </div>
                            </Col>

                            


                            <Col md={4}>
                                <div className="report-card" >
                                    <div className="report-header">
                                        <span className="material-icons-two-tone report-icon">call</span>
                                        <h2 className="report-title">Call Stats By Extension</h2>
                                    </div>
                                    <p className="report-description">
                                    Visualize call volumes, durations, and trends across extensions with dynamic charts and detailed metrics.
                                    </p>
                                    <div className="report-meta">
                                        <div className="meta-item">Type: <span>Inbound/Outbound</span></div>
                                        
                                        <div className="view-button app-button btn btn-primary"
                                        onClick={() => router.push('/call-reports/stats/extension')}
                                        >View</div>
                                    </div>
                                </div>
                            </Col>

                            <Col md={4}>
                                <div className="report-card" >
                                    <div className="report-header">
                                        <span className="material-icons-two-tone report-icon">call</span>
                                        <h2 className="report-title">Call Stats By Department Extension</h2>
                                    </div>
                                    <p className="report-description">
                                    Visualize call volumes, durations, and trends across departments extensions with dynamic charts and detailed metrics.
                                    </p>
                                    <div className="report-meta">
                                        <div className="meta-item">Type: <span>Inbound/Outbound</span></div>
                                        
                                        <div className="view-button app-button btn btn-primary"
                                        onClick={() => router.push('/call-reports/stats/department/extension')}
                                        >View</div>
                                    </div>
                                </div>
                            </Col>

                            <Col md={4}>
                                <div className="report-card" >
                                    <div className="report-header">
                                        <span className="material-icons-two-tone report-icon">call</span>
                                        <h2 className="report-title">General Call Statistics</h2>
                                    </div>
                                    <p className="report-description">
                                    Visualize call volumes, durations, and trends across all calls with dynamic charts and detailed metrics.
                                    </p>
                                    <div className="report-meta">
                                        <div className="meta-item">Type: <span>Inbound/Outbound</span></div>
                                        
                                        <div className="view-button app-button btn btn-primary"
                                        onClick={() => router.push('/call-reports/stats/general')}
                                        >View</div>
                                    </div>
                                </div>
                            </Col>
                            
                            </>

                            )}


                            {session?.user?.permissions?.includes('call-reports-by-call-incoming-reports') && (

                            <>
                                <Col md={4}>
                                    <div className="report-card" >
                                        <div className="report-header">
                                            <span className="material-icons-two-tone report-icon">call_received</span>
                                            <h2 className="report-title">Call Inbound By Country</h2>
                                        </div>
                                        <p className="report-description">
                                        Visualize call volumes, durations, and trends across countries with dynamic charts and detailed metrics.
                                        </p>
                                        <div className="report-meta">
                                            <div className="meta-item">Type: <span>Call Inbound</span></div>
                                            
                                            <div className="view-button app-button btn btn-primary"
                                            onClick={() => router.push('/call-reports/incoming/country')}
                                            >View</div>
                                        </div>
                                    </div>
                                </Col>


                                <Col md={4}>
                                    <div className="report-card" >
                                        <div className="report-header">
                                            <span className="material-icons-two-tone report-icon">call_received</span>
                                            <h2 className="report-title">Call Inbound By Department</h2>
                                        </div>
                                        <p className="report-description">
                                        Visualize call volumes, durations, and trends across departments with dynamic charts and detailed metrics.
                                        </p>
                                        <div className="report-meta">
                                            <div className="meta-item">Type: <span>Call Inbound</span></div>
                                            
                                            <div className="view-button app-button btn btn-primary"
                                            onClick={() => router.push('/call-reports/incoming/department')}
                                            >View</div>
                                        </div>
                                    </div>
                                </Col>


                                <Col md={4}>
                                    <div className="report-card" >
                                        <div className="report-header">
                                            <span className="material-icons-two-tone report-icon">call_received</span>
                                            <h2 className="report-title">Call Inbound By Extension</h2>
                                        </div>
                                        <p className="report-description">
                                        Visualize call volumes, durations, and trends across extensions with dynamic charts and detailed metrics.
                                        </p>
                                        <div className="report-meta">
                                            <div className="meta-item">Type: <span>Call Inbound</span></div>
                                            
                                            <div className="view-button app-button btn btn-primary"
                                            onClick={() => router.push('/call-reports/incoming/extension')}
                                            >View</div>
                                        </div>
                                    </div>
                                </Col>
                            </>
                            )}




                        </Row>
                    </div>
                </div>
                </div>
            </Col>
        </Row>

        </React.Fragment>
    );
};

PageReports.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default PageReports;
