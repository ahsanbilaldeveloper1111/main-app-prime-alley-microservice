import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  ProgressBar,
  Spinner,
} from "react-bootstrap";
import {
  getCrmDashboard,
  getLeads,
  getOpportunities,
  getMeetings,
  DashboardData as CrmDashboardData,
} from "@utils/crm";
import {
  FiUsers,
  FiTarget,
  FiCalendar,
  FiTrendingUp,
  FiPlus,
  FiEye,
} from "react-icons/fi";
import Link from "next/link";

const CrmDashboard = () => {
  const [dashboardData, setDashboardData] = useState<CrmDashboardData>(
    {} as CrmDashboardData
  );
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await getCrmDashboard();
      console.log("ZE DASH DATA", data);
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  }, []);

  const fetchRecentData = useCallback(async () => {
    try {
      const [leadsData, opportunitiesData, meetingsData] = await Promise.all([
        getLeads({ per_page: 5 }),
        getOpportunities({ per_page: 5 }),
        getMeetings(),
      ]);

      setRecentLeads(leadsData?.data || []);
      setRecentOpportunities(opportunitiesData?.data || []);
      setRecentMeetings(meetingsData?.data || []);
    } catch (error) {
      console.error("Failed to fetch recent data:", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentData();
  }, []); // Only run once on mount

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <Button
          variant="outline-danger"
          size="sm"
          className="ms-3"
          onClick={fetchDashboardData}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Dashboard"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">CRM Dashboard</h1>
                <p className="text-muted">
                  Overview of your customer relationship management activities
                </p>
              </div>
              <div>
                <Link href="/crm/leads/create" className="btn btn-primary me-2">
                  <FiPlus className="me-2" />
                  New Lead
                </Link>
                <Link
                  href="/crm/opportunities/create"
                  className="btn btn-outline-primary"
                >
                  <FiPlus className="me-2" />
                  New Opportunity
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="row g-4 mb-4">
          <div className="col-xl-4 col-md-6">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                      <FiUsers className="text-primary" size={24} />
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h4 className="mb-1">{dashboardData.total_leads || 0}</h4>
                    <p className="text-muted mb-0">Total Leads</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="col-xl-4 col-md-6">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-success bg-opacity-10 p-3 rounded">
                      <FiTarget className="text-success" size={24} />
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h4 className="mb-1">
                      {dashboardData.total_opportunities || 0}
                    </h4>
                    <p className="text-muted mb-0">Opportunities</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="col-xl-4 col-md-6">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-info bg-opacity-10 p-3 rounded">
                      <FiCalendar className="text-info" size={24} />
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h4 className="mb-1">
                      {dashboardData.total_meetings || 0}
                    </h4>
                    <p className="text-muted mb-0">Meetings</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Leads by Stage */}
        {dashboardData.leads_by_stage &&
          dashboardData.leads_by_stage.length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent">
                    <h5 className="mb-0">Leads by Stage</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="row">
                      {dashboardData.leads_by_stage.map((stage, index) => (
                        <div key={index} className="col-md-6 col-lg-4 mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-medium">
                              {stage.stage_name}
                            </span>
                            {/* <span className="text-muted">{stage.count}</span> */}
                          </div>
                          <div className="d-flex align-items-center">
                            <div
                              className="me-2"
                              style={{
                                width: "12px",
                                height: "12px",
                                backgroundColor: stage.color,
                                borderRadius: "50%",
                              }}
                            />
                            <small className="text-muted">
                              {stage.count} leads
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          )}

        {/* Recent Data */}
        <div className="row g-4">
          {/* Recent Leads */}
          <div className="col-lg-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Recent Leads</h6>
                <Link
                  href="/crm/leads"
                  className="btn btn-sm btn-outline-primary"
                >
                  View All
                </Link>
              </Card.Header>
              <Card.Body>
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead, index) => (
                    <div key={index} className="d-flex align-items-center mb-3">
                      <div className="flex-shrink-0">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                          <FiUsers className="text-primary" size={16} />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">{lead.name || "Unnamed Lead"}</h6>
                        <p className="text-muted mb-0 small">
                          {lead.stage?.name || "No Stage"}
                        </p>
                      </div>
                      <Link
                        href={`/crm/leads/${lead.id}/edit`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        <FiEye size={14} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center">No recent leads</p>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Recent Opportunities */}
          <div className="col-lg-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Recent Opportunities</h6>
                <Link
                  href="/crm/opportunities"
                  className="btn btn-sm btn-outline-primary"
                >
                  View All
                </Link>
              </Card.Header>
              <Card.Body>
                {recentOpportunities.length > 0 ? (
                  recentOpportunities.map((opportunity, index) => (
                    <div key={index} className="d-flex align-items-center mb-3">
                      <div className="flex-shrink-0">
                        <div className="bg-success bg-opacity-10 rounded-circle p-2">
                          <FiTarget className="text-success" size={16} />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">
                          {opportunity.name || "Unnamed Opportunity"}
                        </h6>
                        <p className="text-muted mb-0 small">
                          
                          {opportunity.stage?.name
                            ? opportunity.stage?.name
                            : "No Stage"}
                        </p>
                      </div>
                      <Link
                        href={`/crm/leads/${opportunity.id}/edit`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        <FiEye size={14} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center">
                    No recent opportunities
                  </p>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Recent Meetings */}
          <div className="col-lg-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Recent Meetings</h6>
              </Card.Header>
              <Card.Body>
                {recentMeetings.length > 0 ? (
                  recentMeetings.map((meeting, index) => (
                    <div key={index} className="d-flex align-items-center mb-3">
                      <div className="flex-shrink-0">
                        <div className="bg-info bg-opacity-10 rounded-circle p-2">
                          <FiCalendar className="text-info" size={16} />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">
                          {meeting?.name || "Untitled Meeting"}
                        </h6>
                        <p
                          className="text-muted mb-0 small"
                          onClick={() => console.log(meeting)}
                        >
                          {meeting?.meeting_date && meeting?.meeting_time
                            ? `${new Date(meeting.meeting_date).toLocaleDateString()} ${meeting.meeting_time}`
                            : "No Date"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center">No recent meetings</p>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row mt-4">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent">
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="row g-3">
                  <div className="col-md-4">
                    <Link
                      href="/crm/leads/create"
                      className="btn btn-outline-primary w-100"
                    >
                      <FiPlus className="me-2" />
                      Create Lead
                    </Link>
                  </div>
                  <div className="col-md-4">
                    <Link
                      href="/crm/opportunities/create"
                      className="btn btn-outline-success w-100"
                    >
                      <FiPlus className="me-2" />
                      Create Opportunity
                    </Link>
                  </div>
                  <div className="col-md-4">
                    <Link
                      href="/crm/stages"
                      className="btn btn-outline-warning w-100"
                    >
                      <FiTrendingUp className="me-2" />
                      Manage Stages
                    </Link>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

CrmDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDashboard;
