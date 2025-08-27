import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';

const DNCRIndex = () => {
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="DNCR" mainLink="/dncr" subTitle="Dashboard" />
            
            <Row className="mb-4">
                <Col md={12}>
                    <h2 className="mb-3">DNCR Management</h2>
                    <p className="text-muted">Manage Do Not Call Registry operations and phone number checks.</p>
                </Col>
            </Row>

            <Row>
                <Col md={6} lg={4} className="mb-4">
                    <Card className="h-100">
                        <Card.Body className="text-center">
                            <div className="mb-3">
                                <i className="fas fa-search fa-3x text-primary"></i>
                            </div>
                            <Card.Title>Check Number</Card.Title>
                            <Card.Text>
                                Check individual phone numbers against the DNCR database.
                            </Card.Text>
                            <Link href="/dncr/check-number" passHref>
                                <Button variant="primary" className="w-100">
                                    Check Number
                                </Button>
                            </Link>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={4} className="mb-4">
                    <Card className="h-100">
                        <Card.Body className="text-center">
                            <div className="mb-3">
                                <i className="fas fa-upload fa-3x text-success"></i>
                            </div>
                            <Card.Title>Bulk Upload</Card.Title>
                            <Card.Text>
                                Upload CSV files to check multiple phone numbers at once.
                            </Card.Text>
                            <Link href="/dncr/check-number" passHref>
                                <Button variant="success" className="w-100">
                                    Bulk Upload
                                </Button>
                            </Link>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={4} className="mb-4">
                    <Card className="h-100">
                        <Card.Body className="text-center">
                            <div className="mb-3">
                                <i className="fas fa-chart-bar fa-3x text-info"></i>
                            </div>
                            <Card.Title>Reports</Card.Title>
                            <Card.Text>
                                View DNCR check reports and analytics.
                            </Card.Text>
                            <Button variant="info" className="w-100" disabled>
                                Coming Soon
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Quick Actions</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <h6>Recent Activity</h6>
                                    <p className="text-muted">No recent DNCR checks performed.</p>
                                </Col>
                                <Col md={6}>
                                    <h6>System Status</h6>
                                    <p className="text-success">
                                        <i className="fas fa-check-circle me-2"></i>
                                        DNCR system is operational
                                    </p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    );
};

DNCRIndex.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default DNCRIndex;
