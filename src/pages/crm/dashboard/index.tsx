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
  Form,
  Modal,
  Alert,
} from "react-bootstrap";
import {
  getCrmDashboard,
  getLeads,
  getOpportunities,
  getMeetings,
  createMeeting,
  createCampaign,
  getCampaigns,
  DashboardData as CrmDashboardData,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import {
  FiUsers,
  FiTarget,
  FiCalendar,
  FiTrendingUp,
  FiPlus,
  FiEye,
  FiX,
  FiSave,
  FiXCircle,
  FiTrash2,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import moment from "moment";
import Select from "react-select";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { ModuleSlug } from '@utils/Helper';

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

  // Modal states
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Meeting form data
  const [meetingForm, setMeetingForm] = useState({
    name: "",
    meeting_date: "",
    meeting_time: "",
    status: "scheduled",
    extensions: [""],
    lead_id: null as number | null,
  });

  // Extensions data
  const [extensions, setExtensions] = useState<any[]>([]);
  const [extensionsOpportunities, setExtensionsOpportunities] = useState<any[]>([]);
  const [extensionsLeads, setExtensionsLeads] = useState<any[]>([]);
  
  const [leads, setLeads] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  // Campaign form data
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "active",
  });

  // Campaign fields management
  const [campaignFields, setCampaignFields] = useState<any[]>([]);
  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "string",
    field_options: [] as string[],
    sort_order: 0,
  });
  const [campaignUsers, setCampaignUsers] = useState<readonly any[]>([]);

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  // Helper function to determine meeting color based on status and timing
  const getMeetingColor = (meeting: any) => {
    const now = new Date();
    const meetingDateTime = new Date(`${meeting.meeting_date.split('T')[0]}T${meeting.meeting_time}`);
    const timeDiff = meetingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // Overdue meetings (past due and not completed)
    if (meetingDateTime < now && meeting.status !== 'completed') {
      return {
        iconBg: 'bg-danger bg-opacity-10',
        iconColor: 'text-danger',
        statusColor: 'text-danger'
      };
    }

    // Completed meetings
    if (meeting.status === 'completed') {
      return {
        iconBg: 'bg-success bg-opacity-10',
        iconColor: 'text-success',
        statusColor: 'text-success'
      };
    }

    // Cancelled meetings
    if (meeting.status === 'cancelled') {
      return {
        iconBg: 'bg-secondary bg-opacity-10',
        iconColor: 'text-secondary',
        statusColor: 'text-secondary'
      };
    }

    // Upcoming meetings (within next 24 hours)
    if (hoursDiff >= 0 && hoursDiff <= 24) {
      return {
        iconBg: 'bg-warning bg-opacity-10',
        iconColor: 'text-warning',
        statusColor: 'text-warning'
      };
    }

    // Future meetings (more than 24 hours away)
    if (hoursDiff > 24) {
      return {
        iconBg: 'bg-info bg-opacity-10',
        iconColor: 'text-info',
        statusColor: 'text-info'
      };
    }

    // Default for scheduled meetings
    return {
      iconBg: 'bg-primary bg-opacity-10',
      iconColor: 'text-primary',
      statusColor: 'text-primary'
    };
  };

  // Fetch extensions, leads, and opportunities data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hierarchyData,hierarchyDataOpportunities,hierarchyDataLeads, leadsData, opportunitiesData] = await Promise.all([
          GetHierarchyData(ModuleSlug.CRM_CAMPAIGNS),
          GetHierarchyData(ModuleSlug.CRM_OPPORTUNITIES),
          GetHierarchyData(ModuleSlug.CRM_LEADS),
          getLeads({ per_page: 1000 }),
          getOpportunities({ per_page: 1000 }),]);
        
        setExtensions(hierarchyData?.extensions || []);
        setExtensionsOpportunities(hierarchyDataOpportunities?.extensions || []);
        setExtensionsLeads(hierarchyDataLeads?.extensions || []);

        setLeads(leadsData?.data || []);
        setOpportunities(opportunitiesData?.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Modal handlers
  const handleCreateMeeting = useCallback(() => {
    setMeetingForm({
      name: "",
      meeting_date: "",
      meeting_time: "",
      status: "scheduled",
      extensions: [""],
      lead_id: null,
    });
    setShowMeetingModal(true);
  }, []);

  const handleCreateCampaign = useCallback(() => {
    setCampaignForm({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      status: "active",
    });
    setCampaignFields([]);
    setCampaignUsers([]);
    setShowCampaignModal(true);
  }, []);

  // Form submission handlers
  const handleMeetingSubmit = useCallback(async () => {
    if (!meetingForm.name.trim()) {
      toast.error("Meeting name is required");
      return;
    }

    if (!meetingForm.lead_id) {
      toast.error("Please select a lead or opportunity");
      return;
    }

    try {
      setModalLoading(true);
      await createMeeting({
        ...meetingForm,
        name: meetingForm.name.trim(),
        lead_id: meetingForm.lead_id,
        extensions: meetingForm.extensions.filter((ext) => ext.trim() !== ""),
      });
      toast.success("Meeting created successfully!");
      setShowMeetingModal(false);
      fetchRecentData(); // Refresh recent meetings
    } catch (error: any) {
      console.error("Failed to create meeting:", error);
      toast.error(error.message || "Failed to create meeting");
    } finally {
      setModalLoading(false);
    }
  }, [meetingForm]);

  const handleCampaignSubmit = useCallback(async () => {
    if (!campaignForm.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      setModalLoading(true);
      const campaignData = {
        ...campaignForm,
        name: campaignForm.name.trim(),
        description: campaignForm.description.trim() || null,
        start_date: campaignForm.start_date || undefined,
        end_date: campaignForm.end_date || undefined,
        status: campaignForm.status as 'active' | 'inactive',
        fields: campaignFields,
        campaign_users: campaignUsers.map(user => user.value),
      };

      await createCampaign(campaignData);
      toast.success("Campaign created successfully!");
      setShowCampaignModal(false);
    } catch (error: any) {
      console.error("Failed to create campaign:", error);
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setModalLoading(false);
    }
  }, [campaignForm, campaignFields, campaignUsers]);

  // Campaign field management functions
  const handleAddField = useCallback(() => {
    if (!newField.field_name.trim()) {
      toast.error("Field name is required");
      return;
    }

    const field = {
      ...newField,
      field_name: newField.field_name.trim(),
      sort_order: campaignFields.length,
    };

    setCampaignFields([...campaignFields, field]);
    setNewField({
      field_name: "",
      field_type: "string",
      field_options: [],
      sort_order: 0,
    });
  }, [newField, campaignFields]);

  const handleRemoveField = useCallback((index: number) => {
    setCampaignFields(campaignFields.filter((_, i) => i !== index));
  }, [campaignFields]);

  const handleFieldTypeChange = useCallback((index: number, fieldType: string) => {
    const updatedFields = [...campaignFields];
    updatedFields[index].field_type = fieldType;
    if (fieldType !== "dropdown") {
      updatedFields[index].field_options = [];
    }
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  const handleFieldOptionChange = useCallback((index: number, optionIndex: number, value: string) => {
    const updatedFields = [...campaignFields];
    if (!updatedFields[index].field_options) {
      updatedFields[index].field_options = [];
    }
    updatedFields[index].field_options[optionIndex] = value;
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  const handleAddFieldOption = useCallback((index: number) => {
    const updatedFields = [...campaignFields];
    if (!updatedFields[index].field_options) {
      updatedFields[index].field_options = [];
    }
    updatedFields[index].field_options.push("");
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  const handleRemoveFieldOption = useCallback((index: number, optionIndex: number) => {
    const updatedFields = [...campaignFields];
    updatedFields[index].field_options.splice(optionIndex, 1);
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  // Extension management functions
  const addExtensionField = useCallback(() => {
    setMeetingForm((prev) => ({
      ...prev,
      extensions: [...prev.extensions, ""],
    }));
  }, []);

  const removeExtensionField = useCallback((index: number) => {
    setMeetingForm((prev) => ({
      ...prev,
      extensions: prev.extensions.filter((_, i) => i !== index),
    }));
  }, []);

  const updateExtension = useCallback((index: number, value: string) => {
    setMeetingForm((prev) => ({
      ...prev,
      extensions: prev.extensions.map((ext, i) => (i === index ? value : ext)),
    }));
  }, []);

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
        getMeetings({per_page: 5}),
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
          <Button onClick={handleCreateMeeting} className="btn btn-primary me-2">
          <FiCalendar className="me-2" />
          Schedule a Meeting
        </Button>
        <Button
          onClick={handleCreateCampaign}
          className="btn btn-primary me-2"
        >
          <FiPlus className="me-2" />
          Create a New Campaign
        </Button>
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
          },
          {
            id: 'meetings-next-24h',
            title: 'Meetings in Next 24h',
            value: dashboardData.meetings_next_24h || 0,
            description: 'Meetings scheduled in the next 24 hours',
          },
          {
            id: 'meetings-last-24h',
            title: 'Meetings in Last 24h',
            value: dashboardData.meetings_last_24h || 0,
            description: 'Meetings that occurred in the last 24 hours',
          },
          {
            id: 'total-campaigns',
            title: 'Total Campaigns',
            value: dashboardData.total_campaigns || 0,
            description: 'Total campaigns in the system',
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

        {/* Opportunities by Stage */}
        {dashboardData.opportunities_by_stage &&
          dashboardData.opportunities_by_stage.length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent">
                    <h5 className="mb-0 app-title-heading">Opportunities by Stage</h5>
                  </Card.Header>
                  <Card.Body>

                    <PageSummaryGrid
                      cards={dashboardData.opportunities_by_stage.map((stage) => ({
                        id: `opp-${stage.stage_name}`,
                        title: stage.stage_name,
                        value: stage.count,
                        description: "Total "+stage.stage_name+" opportunities in the system",
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
                        <p className="text-muted mb-1 small">
                          {lead.stage?.name || "No Stage"}
                        </p>
                        <div className="d-flex flex-column small text-muted">
                          <span>Created: {moment(lead.created_at).format('MMM DD, YYYY')}</span>
                          <span>Last activity: {moment(lead.updated_at).format('MMM DD, YYYY HH:mm')}</span>
                        </div>
                      </div>
                      <Link
                        href={`/crm/leads/${lead.id}/edit`}
                        className="btn btn-sm btn-outline-secondary"
                        title="View Details"
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
                        <p className="text-muted mb-1 small">
                          
                          {opportunity.stage?.name
                            ? opportunity.stage?.name
                            : "No Stage"}
                        </p>
                        <div className="d-flex flex-column small text-muted">
                          <span>Created: {moment(opportunity.created_at).format('MMM DD, YYYY')}</span>
                          <span>Last activity: {moment(opportunity.updated_at).format('MMM DD, YYYY HH:mm')}</span>
                        </div>
                      </div>
                      <Link
                        href={`/crm/leads/${opportunity.id}/edit`}
                        className="btn btn-sm btn-outline-secondary"
                        title="View Details"
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
                  recentMeetings.map((meeting, index) => {
                    const meetingColors = getMeetingColor(meeting);
                    return (
                      <div key={index} className="d-flex align-items-center mb-3">
                        <div className="flex-shrink-0">
                          <div className={`${meetingColors.iconBg} rounded-circle p-2`}>
                            <FiCalendar className={meetingColors.iconColor} size={16} />
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <h6 className="mb-1">
                            {meeting?.name || "Untitled Meeting"}
                          </h6>
                          <p className="text-muted mb-1 small">
                            {meeting?.meeting_date && meeting?.meeting_time
                              ? `${new Date(meeting.meeting_date).toLocaleDateString()} ${meeting.meeting_time}`
                              : "No Date"}
                          </p>
                          <div className="d-flex flex-column small text-muted">
                            <span className={meetingColors.statusColor}>
                              Status: {meeting?.status || "Unknown"}
                            </span>
                            <span>Created: {moment(meeting?.created_at).format('MMM DD, YYYY HH:mm')}</span>
                          </div>
                        </div>
                        <Link
                          href={`/crm/leads/${meeting?.lead_id}/edit`}
                          className="btn btn-sm btn-outline-secondary"
                          title="View Details"
                        >
                          <FiEye size={14} />
                        </Link>
                      </div>
                    );
                  })
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

      {/* Meeting Creation Modal */}
      <FormModal
        show={showMeetingModal}
        onHide={() => setShowMeetingModal(false)}
        title="Schedule a Meeting"
        desc="Please fill in the details below to schedule a new meeting."
        formHtml={
          <>
            <Form onSubmit={handleMeetingSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Meeting Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={meetingForm.name}
                      onChange={(e) => setMeetingForm({...meetingForm, name: e.target.value})}
                      placeholder="Enter meeting name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Lead/Opportunity *</Form.Label>
                    <Select
                      value={meetingForm.lead_id ? {
                        value: meetingForm.lead_id,
                        label: [...leads, ...opportunities].find(item => item.id === meetingForm.lead_id)?.name || ""
                      } : null}
                      onChange={(selectedOption: any) => 
                        setMeetingForm({...meetingForm, lead_id: selectedOption?.value || null})
                      }
                      options={[
                        ...leads.map((lead: any) => ({
                          value: lead.id,
                          label: `${lead.name} (Lead)`,
                        })),
                        ...opportunities.map((opp: any) => ({
                          value: opp.id,
                          label: `${opp.name} (Opportunity)`,
                        })),
                      ]}
                      placeholder="Select a lead or opportunity"
                      isClearable
                      isSearchable
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Meeting Date *</Form.Label>
                    <Form.Control
                      type="date"
                      value={meetingForm.meeting_date ? moment(meetingForm.meeting_date).format("YYYY-MM-DD") : ""}
                      onChange={(e) => setMeetingForm({...meetingForm, meeting_date: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Meeting Time *</Form.Label>
                    <Form.Control
                      type="time"
                      value={meetingForm.meeting_time}
                      onChange={(e) => setMeetingForm({...meetingForm, meeting_time: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={meetingForm.status}
                  onChange={(e) => setMeetingForm({...meetingForm, status: e.target.value})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>

{meetingForm.lead_id &&  (
              <Form.Group className="mb-3">
                <Form.Label>Extensions *</Form.Label>

                {meetingForm.lead_id && leads.find(item => item.id === meetingForm.lead_id) ? (
                  <div className="mb-2">
                    {meetingForm.extensions.map((extension, index) => (
                  <div key={index} className="d-flex gap-2 mb-2">
                    <Select
                      value={
                        extension
                          ? {
                              value: extension,
                              label:
                                extensionsLeads?.find(
                                  (ext: any) =>
                                    ext.id.toString() == extension.toString()
                                )?.display_name || "",
                            }
                          : null
                      }
                      onChange={(selectedOption: any) =>
                        updateExtension(index, selectedOption?.value || "")
                      }
                      options={
                        extensionsLeads?.map((ext: any) => ({
                          value: ext.id,
                          label: ext.display_name,
                        })) || []
                      }
                      placeholder="Select Extension"
                      isClearable
                      isSearchable
                      required
                    />
                    {meetingForm.extensions.length > 1 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeExtensionField(index)}
                      >
                        <FiXCircle />
                      </Button>
                    )}
                  </div>
                ))}
                  </div>
                ) : (
                  <div className="mb-2">
                    {meetingForm.extensions.map((extension, index) => (
                  <div key={index} className="d-flex gap-2 mb-2">
                    <Select
                      value={
                        extension
                          ? {
                              value: extension,
                              label:
                                extensionsOpportunities?.find(
                                  (ext: any) =>
                                    ext.id.toString() == extension.toString()
                                )?.display_name || "",
                            }
                          : null
                      }
                      onChange={(selectedOption: any) =>
                        updateExtension(index, selectedOption?.value || "")
                      }
                      options={
                        extensionsOpportunities?.map((ext: any) => ({
                          value: ext.id,
                          label: ext.display_name,
                        })) || []
                      }
                      placeholder="Select Extension"
                      isClearable
                      isSearchable
                      required
                    />
                    {meetingForm.extensions.length > 1 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeExtensionField(index)}
                      >
                        <FiXCircle />
                      </Button>
                    )}
                  </div>
                ))}
                  </div>
                )}

                
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={addExtensionField}
                >
                  <FiPlus className="me-2" />
                  Add Extension
                </Button>
              </Form.Group>
                )}

            </Form>
          </>
        }
        submitButtonText="Schedule Meeting"
        cancelButtonText="Cancel"
        onSubmit={handleMeetingSubmit}
        onCancel={() => setShowMeetingModal(false)}
      />

      {/* Campaign Creation Modal */}
      <FormModal
        show={showCampaignModal}
        onHide={() => {
          setShowCampaignModal(false);
          setCampaignUsers([]);
        }}
        title="Create a New Campaign"
        desc="Please fill the details below to create the campaign."
        formHtml={
          <>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Campaign Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                    placeholder="Enter campaign name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={campaignForm.status}
                    onChange={(e) => setCampaignForm({...campaignForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm({...campaignForm, start_date: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm({...campaignForm, end_date: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({...campaignForm, description: e.target.value})}
                placeholder="Enter campaign description (optional)"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Campaign Users</Form.Label>
              <Select
                isMulti
                value={campaignUsers}
                onChange={(selected) => setCampaignUsers(selected || [])}
                options={extensions.map((extension: { id: string; display_name: string; name: string }) => ({
                  value: extension.id,
                  label: extension.display_name || extension.name || extension.id
                }))}
                placeholder="Select users for this campaign..."
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#ced4da",
                    boxShadow: "none",
                    fontSize: "14px",
                  }),
                }}
              />
              <Form.Text className="text-muted">
                Select users who will be assigned to this campaign.
              </Form.Text>
            </Form.Group>

            {/* Campaign Fields Management */}
            <div className="border-top pt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Campaign Fields</h5>
              </div>

              {/* Add New Field Form */}
              <Card className="mb-3">
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Control
                        type="text"
                        placeholder="Field name"
                        value={newField.field_name}
                        onChange={(e) => setNewField({...newField, field_name: e.target.value})}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={newField.field_type}
                        onChange={(e) => setNewField({...newField, field_type: e.target.value})}
                      >
                        <option value="string">Text</option>
                        <option value="text">Long Text</option>
                        <option value="integer">Number</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="dropdown">Dropdown</option>
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Button variant="success" className="app-button" onClick={handleAddField}>
                        Add Field
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Existing Fields */}
              {campaignFields.map((field, index) => (
                <Card key={index} className="mb-2">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={4}>
                        <Form.Control
                          type="text"
                          value={field.field_name}
                          onChange={(e) => {
                            const updatedFields = [...campaignFields];
                            updatedFields[index].field_name = e.target.value;
                            setCampaignFields(updatedFields);
                          }}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Select
                          value={field.field_type}
                          onChange={(e) => handleFieldTypeChange(index, e.target.value)}
                        >
                          <option value="string">Text</option>
                          <option value="text">Long Text</option>
                          <option value="integer">Number</option>
                          <option value="date">Date</option>
                          <option value="email">Email</option>
                          <option value="dropdown">Dropdown</option>
                        </Form.Select>
                      </Col>
                      
                      <Col md={1}>
                        <Button
                          variant="danger"
                          className="app-button"
                          onClick={() => handleRemoveField(index)}
                        >
                          <FiTrash2 /> Delete
                        </Button>
                      </Col>

                      <Col md={12} className="mt-3">
                        {field.field_type === "dropdown" && (
                          <div>
                            {field.field_options?.map((option: string, optionIndex: number) => (
                              <div key={optionIndex} className="d-flex mb-3 row align-items-center justify-content-left">
                                <Col md={5}>
                                  <Form.Control
                                    type="text"
                                    size="sm"
                                    value={option}
                                    onChange={(e) => handleFieldOptionChange(index, optionIndex, e.target.value)}
                                    placeholder="Option value"
                                  />
                                </Col>
                                <Col md={5}>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    className="app-button"
                                    onClick={() => handleRemoveFieldOption(index, optionIndex)}
                                  >Remove Option</Button>
                                </Col>
                              </div>
                            ))}

                            <Button
                              variant="primary"
                              className="app-button"
                              size="sm"
                              onClick={() => handleAddFieldOption(index)}
                            >
                              Add Option
                            </Button>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}

              {campaignFields.length === 0 && (
                <Alert variant="info">
                  No fields added yet. Click "Add Field" to create custom fields for this campaign.
                </Alert>
              )}
            </div>
          </>
        }
        submitButtonText="Create Campaign"
        cancelButtonText="Cancel"
        onSubmit={handleCampaignSubmit}
        onCancel={() => {
          setShowCampaignModal(false);
          setCampaignUsers([]);
        }}
      />
    </React.Fragment>
  );
};

CrmDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDashboard;
