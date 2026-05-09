import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@components/page-partials/FormModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";
import "@assets/scss/reports.scss";
import moment from 'moment';
import { useSession } from 'next-auth/react';
import { HEADER_CONSTANTS } from '@constants/headerConstants';

const { PERMISSIONS } = HEADER_CONSTANTS;

const PageReports = () => {
    const { data: session } = useSession();
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Reports" mainLink="/reports" subTitle="Reports" />
            <PageHeader title="Reports" leftGrid={12} />


        <Row>   
            <Col md={12}>
            <div className="dashboard">
                <div className="dashboard-section">
                    <div className="section-header app-title-heading"><span className="material-icons-two-tone">call</span>
                    Call Reports
                    </div>
                    <div className="report-grid" id="reportGrid">
                        <Row className="">
                           
                           {session?.user?.permissions?.includes(PERMISSIONS.CALL_REPORTS_BY_STATISTICS_REPORTS) && (
                            
                            <>
                            
                            <Col md={4}>
                                <a href="/call-reports/stats/country" className="report-card" >
                                    <div className="report-header">
                                        <span className="material-icons-two-tone report-icon">call</span>
                                        <h2 className="report-title app-title-heading">Call Stats By Country</h2>
                                    </div>
                                    <p className="report-description">
                                    Visualize call volumes, durations, and trends across countries with dynamic charts and detailed metrics.
                                    </p>
                                    <div className="report-meta">
                                        <div className="meta-item">Type: <span>Call Outbound</span></div>
                                        <div className="meta-item">Last Run: <span>{moment().format('MMM D, YYYY')}</span></div>
                                        <div className="view-button app-button btn btn-primary">View</div>
                                    </div>
                                </a>
                            </Col>


                            <Col md={4}>
                                <a href="/call-reports/stats/department" className="report-card" >
                                    <div className="report-header">
                                        <span className="material-icons-two-tone report-icon">call</span>
                                        <h2 className="report-title">Call Stats By Department</h2>
                                    </div>
                                    <p className="report-description">
                                    Visualize call volumes, durations, and trends across departments with dynamic charts and detailed metrics.
                                    </p>
                                    <div className="report-meta">
                                        <div className="meta-item">Type: <span>Call Outbound</span></div>
                                        <div className="meta-item">Last Run: <span>{moment().format('MMM D, YYYY')}</span></div>
                                        <div className="view-button app-button btn btn-primary">View</div>
                                    </div>
                                </a>
                            </Col>


                            <Col md={4}>
                                <a href="/call-reports/stats/extension" className="report-card" >
                                    <div className="report-header">
                                        <span className="material-icons-two-tone report-icon">call</span>
                                        <h2 className="report-title">Call Stats By Extension</h2>
                                    </div>
                                    <p className="report-description">
                                    Visualize call volumes, durations, and trends across extensions with dynamic charts and detailed metrics.
                                    </p>
                                    <div className="report-meta">
                                        <div className="meta-item">Type: <span>Call Outbound</span></div>
                                        <div className="meta-item">Last Run: <span>{moment().format('MMM D, YYYY')}</span></div>
                                        <div className="view-button app-button btn btn-primary">View</div>
                                    </div>
                                </a>
                            </Col>
                            
                            </>

                            )}


                            {session?.user?.permissions?.includes(PERMISSIONS.CALL_REPORTS_BY_CALL_INCOMING_REPORTS) && (

                            <>
                                <Col md={4}>
                                    <a href="/call-reports/incoming/country" className="report-card" >
                                        <div className="report-header">
                                            <span className="material-icons-two-tone report-icon">call_received</span>
                                            <h2 className="report-title">Call Incoming By Country</h2>
                                        </div>
                                        <p className="report-description">
                                        Visualize call volumes, durations, and trends across countries with dynamic charts and detailed metrics.
                                        </p>
                                        <div className="report-meta">
                                            <div className="meta-item">Type: <span>Call Incoming</span></div>
                                            <div className="meta-item">Last Run: <span>{moment().format('MMM D, YYYY')}</span></div>
                                            <div className="view-button app-button btn btn-primary">View</div>
                                        </div>
                                    </a>
                                </Col>


                                <Col md={4}>
                                    <a href="/call-reports/incoming/department" className="report-card" >
                                        <div className="report-header">
                                            <span className="material-icons-two-tone report-icon">call_received</span>
                                            <h2 className="report-title">Call Incoming By Department</h2>
                                        </div>
                                        <p className="report-description">
                                        Visualize call volumes, durations, and trends across departments with dynamic charts and detailed metrics.
                                        </p>
                                        <div className="report-meta">
                                            <div className="meta-item">Type: <span>Call Incoming</span></div>
                                            <div className="meta-item">Last Run: <span>{moment().format('MMM D, YYYY')}</span></div>
                                            <div className="view-button app-button btn btn-primary">View</div>
                                        </div>
                                    </a>
                                </Col>


                                <Col md={4}>
                                    <a href="/call-reports/incoming/extension" className="report-card" >
                                        <div className="report-header">
                                            <span className="material-icons-two-tone report-icon">call_received</span>
                                            <h2 className="report-title">Call Incoming By Extension</h2>
                                        </div>
                                        <p className="report-description">
                                        Visualize call volumes, durations, and trends across extensions with dynamic charts and detailed metrics.
                                        </p>
                                        <div className="report-meta">
                                            <div className="meta-item">Type: <span>Call Incoming</span></div>
                                            <div className="meta-item">Last Run: <span>{moment().format('MMM D, YYYY')}</span></div>
                                            <div className="view-button app-button btn btn-primary">View</div>
                                        </div>
                                    </a>
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
