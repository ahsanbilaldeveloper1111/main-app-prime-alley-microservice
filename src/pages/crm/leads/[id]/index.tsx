import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { getLead, getMeetings } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Row,
  Col,
  Badge,
  Card,
  Table,
  Alert,
} from "react-bootstrap";
import {
  FiEdit,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiUsers,
  FiTarget,
  FiXCircle,
  FiPlus,
} from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/router";

interface Meeting {
  id: number;
  name: string;
  title: string;
  meeting_date: string;
  meeting_time: string;
  status: string;
  extensions?: any[];
}

const ViewLead = () => {
  const router = useRouter();
  const { id } = router.query;
  const [lead, setLead] = useState<any>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLeadData();
      fetchMeetings();
      fetchExtensions();
    }
  }, [id]);

  const fetchLeadData = async () => {
    try {
      const leadData = await getLead(Number(id));
      setLead(leadData);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const meetingsData: any = await getMeetings({ lead_id: Number(id) });
      console.log("Meetings API response:", meetingsData);
      
      // Handle different response structures
      if (Array.isArray(meetingsData)) {
        setMeetings(meetingsData);
      } else if (meetingsData?.data && Array.isArray(meetingsData.data)) {
        setMeetings(meetingsData.data);
      } else {
        console.warn("Meetings data is not an array:", meetingsData);
        setMeetings([]);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
      setMeetings([]);
    }
  };

  const fetchExtensions = async () => {
    try {
      const hierarchyData = await GetHierarchyData();
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
    } catch (error) {
      console.error("Failed to fetch extensions:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'new': 'primary',
      'opportunity': 'success',
      'lost': 'danger'
    };
    return statusColors[status] || 'secondary';
  };

  const getStageColor = (stage: any) => {
    return stage?.color || '#6c757d';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="alert alert-danger" role="alert">
        Lead not found
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle={`View ${lead?.type === 'opportunity' ? 'Opportunity' : 'Lead'}`}
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">{lead.name}</h1>
                <p className="text-muted">{lead?.type === 'opportunity' ? 'Opportunity Details and Meetings' : 'Lead Details and Meetings'}</p>
              </div>
              <div>
                <Link href={lead?.type === 'opportunity' ? '/crm/opportunities' : '/crm/leads'} className="btn btn-outline-secondary me-2">
                  <FiArrowLeft className="me-2" />
                  Back to {lead?.type === 'opportunity' ? 'Opportunities' : 'Leads'}
                </Link>
                <Link href={`/crm/leads/${id}/edit?type=${lead?.type}`} className="btn btn-primary">
                  <FiEdit className="me-2" />
                  Edit {lead?.type === 'opportunity' ? 'Opportunity' : 'Lead'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Row>
          {/* Lead Information */}
          <Col md={6}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">Lead Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Name</label>
                      <p className="mb-0">{lead.name}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Type</label>
                      <p className="mb-0">
                        <Badge bg={lead.type === 'opportunity' ? 'success' : 'primary'}>
                          {lead.type}
                        </Badge>
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">User Extension</label>
                      <p className="mb-0">{extensions.find(
                        (extension: any) =>
                          extension.id.toString() === lead.user_extension?.toString()
                      )?.display_name || lead.user_extension || 'Not specified'}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Status</label>
                      <p className="mb-0">
                        <Badge bg={getStatusBadge(lead.status)}>
                          {lead.status}
                        </Badge>
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Stage</label>
                      <p className="mb-0">
                        {lead.stage ? (
                          <Badge 
                            style={{ backgroundColor: getStageColor(lead.stage), color: 'white' }}
                          >
                            {lead.stage.name}
                          </Badge>
                        ) : (
                          'Not assigned'
                        )}
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Created</label>
                      <p className="mb-0">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Col>
                </Row>

                {lead.description && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Description</label>
                    <p className="mb-0">{lead.description}</p>
                  </div>
                )}

                {lead.is_lost && lead.lost_reason && (
                  <Alert variant="danger">
                    <div className="d-flex align-items-center">
                      <FiXCircle className="me-2" />
                      <div>
                        <strong>Lead Lost</strong>
                        <br />
                        <small>Reason: {lead.lost_reason.name}</small>
                        {lead.lost_feedback && (
                          <>
                            <br />
                            <small>Feedback: {lead.lost_feedback}</small>
                          </>
                        )}
                      </div>
                    </div>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Meetings */}
          <Col md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Meetings</h5>
                <Link href={`/crm/leads/${id}/edit?type=${lead?.type}`} className="btn btn-primary btn-sm">
                  <FiPlus className="me-2" />
                  Schedule Meeting
                </Link>
              </Card.Header>
              <Card.Body>
                
                {(!meetings || !Array.isArray(meetings) || meetings.length === 0) ? (
                  <p className="text-muted text-center">No meetings scheduled</p>
                ) : (
                  <div className="table-responsive">
                    <Table size="sm">
                      <thead>
                        <tr>
                          <th>Meeting</th>
                          <th>Date & Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetings.map((meeting) => (
                          <tr key={meeting.id}>
                            <td>
                              <div>
                                <strong>{meeting.name}</strong>
                                <br />
                                <small className="text-muted">{meeting.title}</small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div><FiCalendar className="me-1" />{new Date(meeting.meeting_date).toLocaleDateString()}</div>
                                <div><FiClock className="me-1" />{meeting.meeting_time}</div>
                              </div>
                            </td>
                            <td>
                              <Badge bg={meeting.status === 'scheduled' ? 'primary' : 'success'}>
                                {meeting.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row className="mt-4">
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex gap-2 flex-wrap">
                  {!lead.is_lost && lead.type === 'lead' && (
                    <Button variant="success">
                      <FiTarget className="me-2" />
                      Convert to Opportunity
                    </Button>
                  )}
                  <Link href={`/crm/leads/${id}/edit?type=${lead?.type}`} className="btn btn-primary">
                    <FiEdit className="me-2" />
                    Edit {lead?.type === 'opportunity' ? 'Opportunity' : 'Lead'}
                  </Link>
                  <Link href={lead?.type === 'opportunity' ? '/crm/opportunities' : '/crm/leads'} className="btn btn-outline-secondary">
                    <FiArrowLeft className="me-2" />
                    Back to {lead?.type === 'opportunity' ? 'Opportunities' : 'Leads'}
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </React.Fragment>
  );
};

ViewLead.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ViewLead;
