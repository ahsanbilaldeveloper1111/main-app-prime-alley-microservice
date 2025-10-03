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

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';

const CrmDashboard = () => {
  const [dashboardData, setDashboardData] = useState<CrmDashboardData>(
    {} as CrmDashboardData
  );
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState({ search: "" });

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

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

<PageHeader
        title="CRM Dashboard"
       
        buttons={
          <>
          <Link href="/crm/leads/create" className="btn btn-primary me-2">
          <FiPlus className="me-2" />
          New Lead
        </Link>
        <Link
          href="/crm/leads/create?type=opportunity"
          className="btn btn-primary me-2"
        >
          <FiPlus className="me-2" />
          New Opportunity
        </Link>
          </>
        }
      />

      <div className="container-fluid">

        <PageSummaryGrid
         cards={[
          {
            id: 'total-leads',
            title: 'Total Leads',
            value: dashboardData.total_leads || 0,
            description: 'Total leads in the system',
          },
          {
            id: 'total-opportunities',
            title: 'Total Opportunities',
            value: dashboardData.total_opportunities || 0,
            description: 'Total opportunities in the system',
          },
          {
            id: 'total-meetings',
            title: 'Total Meetings',
            value: dashboardData.total_meetings || 0,
            description: 'Total meetings in the system',
          }
         ]
          
         }
        />

        {/* Leads by Stage */}
        {dashboardData.leads_by_stage &&
          dashboardData.leads_by_stage.length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent">
                    <h5 className="mb-0 app-title-heading">Leads by Stage</h5>
                  </Card.Header>
                  <Card.Body>

                    <PageSummaryGrid
                      cards={dashboardData.leads_by_stage.map((stage) => ({
                        id: stage.stage_name,
                        title: stage.stage_name,
                        value: stage.count,
                        description: "Total "+stage.stage_name+" leads in the system",
                        className: 'col-md-3',
                      }))}
                    />




                    
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
                <h5 className="app-title-heading mb-0">Recent Leads</h5>
                <Link
                  href="/crm/leads"
                  className="btn app-button btn-sm btn-primary"
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
                <h5 className="mb-0 app-title-heading">Recent Opportunities</h5>
                <Link
                  href="/crm/opportunities"
                  className="btn app-button btn-sm btn-primary"
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
                <h5 className="mb-0 app-title-heading">Recent Meetings</h5>
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
                <h5 className="mb-0 app-title-heading">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="row g-3">
                  <div className="col-md-4">
                    <Link
                      href="/crm/leads/create"
                      className="btn app-button btn-primary w-100"
                    >
                      <FiPlus className="me-2" />
                      Create Lead
                    </Link>
                  </div>
                  <div className="col-md-4">
                    <Link
                      href="/crm/leads/create?type=opportunity"
                      className="btn app-button btn-success w-100"
                    >
                      <FiPlus className="me-2" />
                      Create Opportunity
                    </Link>
                  </div>
                  <div className="col-md-4">
                    <Link
                      href="/crm/stages"
                      className="btn app-button btn-warning w-100"
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
