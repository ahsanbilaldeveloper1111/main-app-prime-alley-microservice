import React, { ReactElement } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';

const DNCRIndex = () => {
    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Compliance" mainLink="/compliance" subTitle="Dashboard" />
            
            <Row className="mb-4">
                <Col md={12}>
                    <h2 className="mb-3">Compliance Management</h2>
                    <p className="text-muted">Manage Compliance operations and phone number checks.</p>
                </Col>
            </Row>

            <Row>
                <Col md={6} lg={4} className="mb-4">
                    <Card className="h-100">
                        <Card.Body className="text-center">
                            <div className="mb-3">
                                <i className="fas fa-search fa-3x text-primary"></i>
                            </div>
                            <Card.Title>API Number Check</Card.Title>
                            <Card.Text>
                                Check individual phone numbers against the Compliance database.
                            </Card.Text>
                            <Link href="/compliance/api-number-check" passHref>
                                <Button variant="primary" className="w-100">
                                    API Number Check
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
                            <Card.Title>Compliance Analytics</Card.Title>
                            <Card.Text>
                                Upload CSV files to check multiple phone numbers at once.
                            </Card.Text>
                            <Link href="/compliance/cdr-records" passHref>
                                <Button variant="success" className="w-100">
                                    Compliance Analytics
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
                            <Card.Title>Add Local DND</Card.Title>
                            <Card.Text>
                                Add records to the Compliance database.
                            </Card.Text>
                            <Link href="/compliance/add-records" passHref>
                                <Button variant="info" className="w-100">
                                    Add Local DND
                                </Button>
                            </Link>
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
