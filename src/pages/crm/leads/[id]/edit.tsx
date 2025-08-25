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
} from "@utils/crm";
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
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
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
    title: "",
    meeting_date: "",
    meeting_time: "",
    status: "scheduled",
    extensions: [""],
  });

  // Fetch lead data, stages, and meetings
  useEffect(() => {
    if (id) {
      fetchLeadData();
      fetchStages();
      fetchMeetings();
    }
  }, [id]);

  const fetchLeadData = async () => {
    try {
      const leadData = await getLead(Number(id));
      console.log("ZE LEAD DATA", leadData);
      setLead(leadData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateLead(Number(id), {
        name: lead.name,
        user_extension: lead.user_extension,
        type: lead.type,
        description: lead.description,
        stage_id: lead.stage_id,
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
        title: "",
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
      extensions: prev.extensions.map((ext, i) => (i === index ? value : ext)),
    }));
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
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Leads"
        subLink="/crm/leads"
        currentTitle="Edit Lead"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">Edit Lead: {lead.name}</h1>
                <p className="text-muted">
                  Update lead information and manage meetings
                </p>
              </div>
              <div>
                <Link
                  href="/crm/leads"
                  className="btn btn-outline-secondary me-2"
                >
                  <FiArrowLeft className="me-2" />
                  Back to Leads
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
                    <Form.Control
                      type="text"
                      value={lead.user_extension || ""}
                      onChange={(e) =>
                        setLead({ ...lead, user_extension: e.target.value })
                      }
                      maxLength={15}
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
                {meetings.length === 0 ? (
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
                        {
                          meetings.map((meeting) => (
                            <tr key={meeting.id}>
                              <td>
                                <div>
                                  <strong>{meeting.name}</strong>
                                  <br />
                                  <small className="text-muted">
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
                                    meeting.status === "scheduled"
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
                                          title: meeting.title,
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
          </Col>
        </Row>
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={meetingForm.title}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, title: e.target.value })
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
                    value={meetingForm.meeting_date}
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
                  <Form.Control
                    type="text"
                    value={extension}
                    onChange={(e) => updateExtension(index, e.target.value)}
                    placeholder="Enter extension"
                    maxLength={15}
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
