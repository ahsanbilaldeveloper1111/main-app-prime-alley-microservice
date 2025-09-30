import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getLead,
  updateLead,
  getStages,
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getCampaigns,
  getCampaignById,
  CampaignData,
  getCrmData,
  CrmDataItem,
  LeadData,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Dropdown,
  Form,
  Alert,
  Card,
  Table,
} from "react-bootstrap";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiTarget,
  FiXCircle,
  FiPlus,
  FiSave,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiUsers,
  FiDatabase,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import moment from "moment";
import Select from "react-select";

interface Meeting {
  id: number;
  name: string;
  title: string;
  meeting_date: string;
  meeting_time: string;
  status: string;
  extensions?: any[];
}

interface AuditLogEntry {
  id: number;
  event: string;
  description: string;
  changes: {
    [key: string]: {
      old: any;
      new: any;
    };
  };
  user_extension: string;
  created_at: string;
  created_at_human: string;
}

const EditLead = () => {
  const router = useRouter();
  const { id } = router.query;
  const [lead, setLead] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [meetingForm, setMeetingForm] = useState({
    name: "",
    meeting_date: "",
    meeting_time: "",
    status: "scheduled",
    extensions: [""],
  });
  const [isOpportunity, setIsOpportunity] = useState(false);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [crmData, setCrmData] = useState<CrmDataItem[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(
    null
  );
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  // Fetch lead data, stages, and meetings
  useEffect(() => {
    if (id) {
      fetchLeadData();
      fetchMeetings();
    }
  }, [id]);

  useEffect(() => {
      fetchStages();
      fetchExtensions();
      fetchCampaigns();
      fetchCrmData();
  }, []);

  // Set selected campaign when lead data is available
  useEffect(() => {
    const fetchCampaignForLead = async () => {
      if (lead && lead.campaign_id) {
        try {
          // Fetch campaign details with fields
          const campaign = await getCampaignById(lead.campaign_id);
          console.log("ZE EDIT LEAD CAMPAIGN WITH FIELDS", campaign);
          setSelectedCampaign(campaign);
        } catch (error) {
          console.error("Failed to fetch campaign details for lead:", error);
          // Fallback to basic campaign from list if available
          if (campaigns.length > 0) {
            const basicCampaign = campaigns.find((c) => c.id == lead.campaign_id);
            setSelectedCampaign(basicCampaign || null);
          }
        }
      }
    };

    fetchCampaignForLead();
  }, [lead, campaigns]);

  const fetchLeadData = async () => {
    try {
      const leadData = await getLead(Number(id));
      
      setIsOpportunity(leadData.type === "opportunity");
      // Ensure campaign_field_values is properly initialized and add company fields
      const processedLeadData = {
        ...leadData,
        campaign_field_values: leadData.campaign_field_values || {},
        company_name: leadData.company_name || '',
        company_contact: leadData.company_contact || '',
        company_description: leadData.company_description || '',
      };

      setLead(processedLeadData);

      // Set audit log if available
      if (leadData.audit_trail) {
        setAuditLog(leadData.audit_trail);
      }

      setInitialLoading(false);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
      setInitialLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const stagesData = await getStages();
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const meetingsData: any = await getMeetings({ lead_id: Number(id) });
      setMeetings(meetingsData?.data || []);
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
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

  const fetchCampaigns = async () => {
    try {
      const campaignsData = await getCampaigns({ per_page: 100 });
      setCampaigns(campaignsData?.data || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
  };

  const fetchCrmData = async () => {
    try {
      const crmDataResponse = await getCrmData({ per_page: 100 });
      setCrmData(crmDataResponse?.data || []);
    } catch (error) {
      console.error("Failed to fetch CRM data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateLead(Number(id), {
        name: lead.name,
        user_extension: lead.user_extension,
        type: lead.type,
        description: lead.description,
        company_name: lead.company_name,
        company_contact: lead.company_contact,
        company_description: lead.company_description,
        stage_id: lead.stage_id,
        campaign_id: lead.campaign_id,
        crm_data_id: lead.crm_data_id,
        campaign_field_values: lead.campaign_field_values || {},
      });
      toast.success("Lead updated successfully!");
      router.push("/crm/leads");
    } catch (error) {
      toast.error("Failed to update lead");
      console.error("Update lead error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const meetingData = {
        ...meetingForm,
        lead_id: Number(id),
        extensions: meetingForm.extensions.filter((ext) => ext.trim() !== ""),
      };

      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, meetingData);
        toast.success("Meeting updated successfully!");
      } else {
        await createMeeting(meetingData);
        toast.success("Meeting created successfully!");
      }

      setShowMeetingModal(false);
      setEditingMeeting(null);
      setMeetingForm({
        name: "",
        meeting_date: "",
        meeting_time: "",
        status: "scheduled",
        extensions: [""],
      });
      fetchMeetings();
    } catch (error) {
      toast.error("Failed to save meeting");
      console.error("Meeting save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      try {
        await deleteMeeting(meetingId);
        toast.success("Meeting deleted successfully!");
        fetchMeetings();
      } catch (error) {
        toast.error("Failed to delete meeting");
        console.error("Delete meeting error:", error);
      }
    }
  };

  const addExtensionField = () => {
    setMeetingForm((prev) => ({
      ...prev,
      extensions: [...prev.extensions, ""],
    }));
  };

  const removeExtensionField = (index: number) => {
    setMeetingForm((prev) => ({
      ...prev,
      extensions: prev.extensions.filter((_, i) => i !== index),
    }));
  };

  const updateExtension = (index: number, value: string) => {
    setMeetingForm((prev) => ({
      ...prev,
      extensions: prev.extensions.map((ext, i) => (i == index ? value : ext)),
    }));
  };

  const handleCampaignChange = async (selectedOption: any) => {
    const campaignId = selectedOption?.value;
    
    if (!campaignId) {
      setSelectedCampaign(null);
      setLead((prev: any) => ({
        ...prev,
        campaign_id: undefined,
        campaign_field_values: {},
      }));
      return;
    }
    
    try {
      // Fetch campaign details with fields
      const campaign = await getCampaignById(campaignId);
      console.log("ZE EDIT CAMPAIGN WITH FIELDS", campaign);
      
      setLead((prev: any) => ({
        ...prev,
        campaign_id: campaignId,
        campaign_field_values: {}, // Reset campaign field values when campaign changes
      }));

      setSelectedCampaign(campaign);
    } catch (error) {
      console.error("Failed to fetch campaign details:", error);
      // Fallback to basic campaign from list
      const basicCampaign = campaigns.find((c) => c.id == campaignId);
      setSelectedCampaign(basicCampaign || null);
    }
  };

  const handleCampaignFieldChange = (fieldName: string, value: any) => {
    setLead((prev: any) => ({
      ...prev,
      campaign_field_values: {
        ...prev.campaign_field_values,
        [fieldName]: value,
      },
    }));
  };

  const renderCampaignField = (field: any) => {
    const fieldValue = lead?.campaign_field_values?.[field.field_name] || "";

    switch (field.field_type) {
      case "string":
      case "email":
        return (
          <Form.Control
            type={field.field_type == "email" ? "email" : "text"}
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
            placeholder={`Enter ${field.field_name}`}
          />
        );

      case "text":
        return (
          <Form.Control
            as="textarea"
            rows={3}
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
            placeholder={`Enter ${field.field_name}`}
          />
        );

      case "integer":
        return (
          <Form.Control
            type="number"
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
            placeholder={`Enter ${field.field_name}`}
          />
        );

      case "date":
        return (
          <Form.Control
            type="date"
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
          />
        );

      case "dropdown":
        return (
          <Form.Select
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
          >
            <option value="">Select {field.field_name}</option>
            {field.field_options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </Form.Select>
        );

      default:
        return (
          <Form.Control
            type="text"
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
            placeholder={`Enter ${field.field_name}`}
          />
        );
    }
  };

  if (initialLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
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
      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 30px;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 30px;
        }

        .timeline-marker {
          position: absolute;
          left: -30px;
          top: 0;
          width: 20px;
          height: 20px;
        }

        .timeline-marker-dot {
          width: 12px;
          height: 12px;
          background-color: #007bff;
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 0 0 2px #007bff;
        }

        .timeline-item:not(:last-child)::before {
          content: "";
          position: absolute;
          left: -25px;
          top: 20px;
          width: 2px;
          height: calc(100% + 10px);
          background-color: #e9ecef;
        }

        .timeline-content {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          margin-left: 10px;
        }

        .changes-details {
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 10px;
          margin-top: 10px;
        }

        .change-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 5px;
          font-size: 0.875rem;
        }

        .field-name {
          font-weight: 600;
          color: #495057;
          min-width: 100px;
        }

        .change-old {
          background: #f8d7da;
          color: #721c24;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }

        .change-arrow {
          color: #6c757d;
          font-weight: bold;
        }

        .change-new {
          background: #d4edda;
          color: #155724;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }
      `}</style>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Leads"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">Edit {isOpportunity ? "Opportunity" : "Lead"}: {lead.name}</h1>
                <p className="text-muted">
                  Update lead information and manage meetings
                </p>
              </div>
              <div>
                <Link
                  href={isOpportunity ? "/crm/opportunities" : "/crm/leads"}
                  className="btn btn-outline-secondary me-2"
                >
                  <FiArrowLeft className="me-2" />
                  Back to {isOpportunity ? "Opportunities" : "Leads"}
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
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Lead Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={lead.name}
                      onChange={(e) =>
                        setLead({ ...lead, name: e.target.value })
                      }
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>User Extension</Form.Label>
                    <Select
                      value={
                        lead.user_extension
                          ? {
                              value: lead.user_extension,
                              label:
                                extensions?.find(
                                  (ext: any) =>
                                    ext.id.toString() ==
                                    lead.user_extension?.toString()
                                )?.display_name || "",
                            }
                          : null
                      }
                      onChange={(selectedOption: any) => {
                        setLead({
                          ...lead,
                          user_extension: selectedOption?.value || null,
                        });
                      }}
                      options={
                        extensions?.map((extension: any) => ({
                          value: extension.id,
                          label: extension.display_name,
                        })) || []
                      }
                      placeholder="Select User Extension (Optional)"
                      isClearable
                      isSearchable
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Type *</Form.Label>
                    <Form.Select
                      value={lead.type}
                      onChange={(e) =>
                        setLead({ ...lead, type: e.target.value })
                      }
                      required
                    >
                      <option value="lead">Lead</option>
                      <option value="opportunity">Opportunity</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Stage</Form.Label>
                    <Form.Select
                      value={lead.stage_id || ""}
                      onChange={(e) =>
                        setLead({ ...lead, stage_id: e.target.value })
                      }
                    >
                      <option value="">Select a stage</option>
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={lead.description || ""}
                      onChange={(e) =>
                        setLead({ ...lead, description: e.target.value })
                      }
                    />
                  </Form.Group>

                  {/* Company Information Section */}
                  <div className="border-top pt-3 mt-4">
                    <h6 className="mb-3">Company Information</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={lead.company_name || ""}
                            onChange={(e) =>
                              setLead({ ...lead, company_name: e.target.value })
                            }
                            placeholder="Enter company name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Information</Form.Label>
                          <Form.Control
                            type="text"
                            value={lead.company_contact || ""}
                            onChange={(e) =>
                              setLead({ ...lead, company_contact: e.target.value })
                            }
                            placeholder="Enter phone or email"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Additional Contact Information</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={lead.company_description || ""}
                        onChange={(e) =>
                          setLead({ ...lead, company_description: e.target.value })
                        }
                        placeholder="Enter additional company contact details"
                      />
                    </Form.Group>
                  </div>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Campaign</Form.Label>
                        <Select
                          value={
                            lead.campaign_id
                              ? {
                                  value: lead.campaign_id,
                                  label:
                                    campaigns.find(
                                      (c) => c.id == lead.campaign_id
                                    )?.name || "",
                                }
                              : null
                          }
                          onChange={handleCampaignChange}
                          options={campaigns.map((campaign) => ({
                            value: campaign.id,
                            label: campaign.name,
                          }))}
                          placeholder="Select a campaign (Optional)"
                          isClearable
                          isSearchable
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>CRM Data Attribution</Form.Label>
                        <Select
                          value={
                            lead.crm_data_id
                              ? {
                                  value: lead.crm_data_id,
                                  label: `#${lead.crm_data_id} - ${
                                    crmData.find(
                                      (d) => d.id == lead.crm_data_id
                                    )?.phone || "No Phone"
                                  }`,
                                }
                              : null
                          }
                          onChange={(selectedOption: any) => {
                            setLead({
                              ...lead,
                              crm_data_id: selectedOption?.value || undefined,
                            });
                          }}
                          options={crmData.map((data) => ({
                            value: data.id,
                            label: `#${data.id} - ${data.phone || "No Phone"}`,
                          }))}
                          placeholder="Select CRM data (Optional)"
                          isClearable
                          isSearchable
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Campaign Custom Fields */}
                  {selectedCampaign &&
                    selectedCampaign.fields &&
                    selectedCampaign.fields.length > 0 && (
                      <div className="border-top pt-3 mt-4">
                        <div className="d-flex align-items-center mb-3">
                          <FiTarget className="me-2" />
                          <h6 className="mb-0">
                            Campaign Fields: {selectedCampaign.name}
                          </h6>
                        </div>
                        <Alert variant="info" className="mb-3">
                          <small>
                            Fill in the custom fields for the selected campaign.
                            These fields will be stored with the
                            lead/opportunity.
                          </small>
                        </Alert>
                        <Row>
                          {selectedCampaign.fields.map((field, index) => (
                            <Col md={6} key={index} className="mb-3">
                              <Form.Group>
                                <Form.Label>
                                  {field.field_name}
                                  {field.field_type == "email" && " (Email)"}
                                  {field.field_type == "integer" && " (Number)"}
                                  {field.field_type == "date" && " (Date)"}
                                  {field.field_type == "dropdown" &&
                                    " (Select)"}
                                </Form.Label>
                                {renderCampaignField(field)}
                              </Form.Group>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    )}

                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? (
                      "Updating..."
                    ) : (
                      <>
                        <FiSave className="me-2" />
                        Update Lead
                      </>
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Meetings Management */}
          <Col md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Meetings</h5>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowMeetingModal(true)}
                >
                  <FiPlus className="me-2" />
                  New Meeting
                </Button>
              </Card.Header>
              <Card.Body>
                {meetings.length == 0 ? (
                  <p className="text-muted text-center">
                    No meetings scheduled
                  </p>
                ) : (
                  <div className="table-responsive">
                    <Table size="sm">
                      <thead>
                        <tr>
                          <th>Meeting</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetings.map((meeting) => (
                          <tr key={meeting.id}>
                            <td>
                              <div>
                                <strong>{meeting.name}</strong>
                                <br />
                                <small className="text-muted " style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "150px",
                                }}>
                                  {meeting.title}
                                </small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div>
                                  <FiCalendar className="me-1" />
                                  {new Date(
                                    meeting.meeting_date
                                  ).toLocaleDateString()}
                                </div>
                                <div>
                                  <FiClock className="me-1" />
                                  {meeting.meeting_time}
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  meeting.status == "scheduled"
                                    ? "primary"
                                    : "success"
                                }
                              >
                                {meeting.status}
                              </Badge>
                            </td>
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle
                                  variant="outline-secondary"
                                  size="sm"
                                >
                                  Actions
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item
                                    onClick={() => {
                                      setEditingMeeting(meeting);
                                      setMeetingForm({
                                        name: meeting.name,
                                        meeting_date: meeting.meeting_date,
                                        meeting_time: meeting.meeting_time,
                                        status: meeting.status,
                                        extensions: meeting.extensions?.map(
                                          (ext: any) => ext.extension
                                        ) || [""],
                                      });
                                      setShowMeetingModal(true);
                                    }}
                                  >
                                    <FiEdit className="me-2" />
                                    Edit
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    onClick={() =>
                                      handleDeleteMeeting(meeting.id)
                                    }
                                    className="text-danger"
                                  >
                                    <FiTrash2 className="me-2" />
                                    Delete
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
            {(() => {
              const selectedCrmData = crmData.find(
                (d) => d.id == lead.crm_data_id
              );
              return selectedCrmData ? (
                <React.Fragment>
                  <Card>
                    <Card.Header>
                      <div className="d-flex align-items-center mb-3">
                        <FiDatabase className="me-2" />
                        <h6 className="mb-0">CRM Data Attribution Preview</h6>
                      </div>
                    </Card.Header>

                    <Card.Body>
                      <div className="">
                        <Alert variant="success" className="mb-3">
                          <small>
                            This lead/opportunity will be attributed to the
                            selected CRM data record.
                          </small>
                        </Alert>
                      </div>
                      <Row>
                        <Col md={6}>
                          <strong>Record ID:</strong> #{selectedCrmData.id}
                        </Col>
                        <Col md={6}>
                          <strong>Phone:</strong>{" "}
                          {selectedCrmData.phone || "N/A"}
                        </Col>
                        {Object.entries(selectedCrmData.data || {})
                          .map(([key, value]) => (
                            <Col md={6} key={key} className="mt-2">
                              <strong>{key}:</strong> {String(value) || "N/A"}
                            </Col>
                          ))}
                      </Row>
                    </Card.Body>
                  </Card>
                </React.Fragment>
              ) : null;
            })()}
          </Col>
        </Row>

        {/* Audit Log Section */}
        {auditLog && auditLog.length > 0 && (
          <Row className="mt-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">
                    <FiClock className="me-2" />
                    Activity History
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="timeline">
                    {auditLog.map((entry, index) => (
                      <div key={entry.id} className="timeline-item">
                        <div className="timeline-marker">
                          <div className="timeline-marker-dot"></div>
                        </div>
                        <div className="timeline-content">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-1">{entry.description}</h6>
                            <small className="text-muted">
                              {entry.created_at_human}
                            </small>
                          </div>
                          <div className="text-muted small mb-2">
                            <strong>Event:</strong> {entry.event} |{" "}
                            <strong>User:</strong> {entry.user_extension}
                          </div>
                          {Object.keys(entry.changes).length > 0 && (
                            <div className="changes-details">
                              <small className="text-muted">Changes:</small>
                              {Object.entries(entry.changes)
                                .map(([field, change]) =>
                                  field != "campaign_field_values" ? (
                                    <div key={field} className="change-item">
                                      <span className="field-name">
                                        {field}:
                                      </span>
                                      <span className="change-old">
                                        "{change.old}"
                                      </span>
                                      <span className="change-arrow">→</span>
                                      <span className="change-new">
                                        "{change.new}"
                                      </span>
                                    </div>
                                  ) : (
                                    <div key={field} className="change-item">
                                      Campaign Custom Field Values Updated
                                    </div>
                                  )
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Meeting Modal */}
      <Modal
        show={showMeetingModal}
        onHide={() => setShowMeetingModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingMeeting ? "Edit Meeting" : "Create New Meeting"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleMeetingSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Meeting Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={meetingForm.name}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, name: e.target.value })
                    }
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
                    value={moment(meetingForm.meeting_date).format(
                      "YYYY-MM-DD"
                    )}
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        meeting_date: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        meeting_time: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={meetingForm.status}
                onChange={(e) =>
                  setMeetingForm({ ...meetingForm, status: e.target.value })
                }
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Extensions *</Form.Label>
              {meetingForm.extensions.map((extension, index) => (
                <div key={index} className="d-flex gap-2 mb-2">
                  <Select
                    value={
                      extension
                        ? {
                            value: extension,
                            label:
                              extensions?.find(
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
                      extensions?.map((ext: any) => ({
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
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMeetingModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleMeetingSubmit}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editingMeeting
              ? "Update Meeting"
              : "Create Meeting"}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

EditLead.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EditLead;
