import React from 'react';
import { Col, Row } from 'react-bootstrap';

const RecentActivities: React.FC = () => {
    return (
        <Col md={12} className="mb-3">
            {/* <div className="card">
                <div className="card-header">
                    <h5>Recent Activities</h5>
                </div>
                <div className="card-body">
                    <Row className="recent-activity">
                        <Col md={1} className="d-flex align-items-center justify-content-center">
                            <div className="ico">
                                <i className="ti ti-history"></i>
                            </div>
                        </Col>
                        <Col md={10} className="d-flex align-items-center">
                            <div className="info">
                                <h6>Login to platform</h6>
                                <p className="mb-2 small">
                                    <span className=""><b>Date: </b> </span>
                                    <span className="text-muted me-4">23 Aug 2024</span>

                                    <span className=""><b>Time: </b> </span>
                                    <span className="text-muted me-4">12:00:00</span>

                                    <span className=""><b>Device: </b> </span>
                                    <span className="text-muted me-4">MacBook Pro</span>

                                    <span className=""><b>Browser: </b> </span>
                                    <span className="text-muted me-4">Chrome</span>
                                </p>
                            </div>
                        </Col>
                        <Col md={1} className="d-flex align-items-center justify-content-end">
                            <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                        </Col>
                    </Row>
                </div>
            </div> */}
        </Col>
    );
};

export default RecentActivities;

