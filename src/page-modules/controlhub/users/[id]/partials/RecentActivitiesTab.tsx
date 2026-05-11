import React from "react";
import { Row } from "react-bootstrap";

interface RecentActivitiesTabProps {
  activities?: Array<{
    id?: number;
    title: string;
    date: string;
    time: string;
    device?: string;
    browser?: string;
  }>;
}

const RecentActivitiesTab: React.FC<RecentActivitiesTabProps> = ({
  activities = [
    {
      id: 1,
      title: "Login to platform",
      date: "23 Aug 2024",
      time: "12:00:00",
      device: "MacBook Pro",
      browser: "Chrome",
    },
  ],
}) => {
  return (
    <Row>
      {/* <Col md={12}>
                <Card>
                    <Card.Header>
                        <h5>Recent Activities</h5>
                    </Card.Header>
                    <Card.Body>
                        {activities.map((activity, index) => (
                            <Row key={activity.id || index} className="recent-activity">
                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                    <div className="ico">
                                        <i className="ti ti-history"></i>
                                    </div>
                                </Col>
                                <Col md={10} className="d-flex align-items-center">
                                    <div className="info">
                                        <h6>{activity.title}</h6>
                                        <p className="mb-2 small">
                                            <span className=""><b>Date: </b> </span>
                                            <span className="text-muted me-4">{activity.date}</span>
                                            <span className=""><b>Time: </b> </span>
                                            <span className="text-muted me-4">{activity.time}</span>
                                            {activity.device && (
                                                <>
                                                    <span className=""><b>Device: </b> </span>
                                                    <span className="text-muted me-4">{activity.device}</span>
                                                </>
                                            )}
                                            {activity.browser && (
                                                <>
                                                    <span className=""><b>Browser: </b> </span>
                                                    <span className="text-muted me-4">{activity.browser}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </Col>
                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                    <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                </Col>
                            </Row>
                        ))}
                    </Card.Body>
                </Card>
            </Col> */}
    </Row>
  );
};

export default RecentActivitiesTab;
