import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { getStages, createStage, deleteStage } from "@utils/crm";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Form,
  Card,
  Table,
  Alert,
} from "react-bootstrap";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSave,
  FiXCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";

interface Stage {
  id: number;
  name: string;
  sequence: number;
  is_won: boolean;
  requirements?: string;
  fold: boolean;
  color: string;
  description?: string;
  is_default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const StagesManagement = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sequence: 1,
    is_won: false,
    requirements: "",
    fold: false,
    color: "#6c757d",
    description: "",
    is_default: false,
    active: true,
  });

  // Fetch stages on component mount
  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const stagesData = await getStages();
      console.log("ZE STAGES DATA", stagesData);
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
      toast.error("Failed to fetch stages");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createStage(formData);
      toast.success("Stage created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        sequence: 1,
        is_won: false,
        requirements: "",
        fold: false,
        color: "#6c757d",
        description: "",
        is_default: false,
        active: true,
      });
      fetchStages();
    } catch (error) {
      toast.error("Failed to create stage");
      console.error("Create stage error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStage = async () => {
    if (!stageToDelete) return;

    try {
      await deleteStage(stageToDelete.id);
      toast.success("Stage deleted successfully!");
      setShowDeleteModal(false);
      setStageToDelete(null);
      fetchStages();
    } catch (error) {
      toast.error("Failed to delete stage");
      console.error("Delete stage error:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (stage: Stage) => {
    if (stage.is_won) {
      return <Badge bg="success">Won</Badge>;
    }
    if (stage.fold) {
      return <Badge bg="danger">Fold</Badge>;
    }
    if (stage.is_default) {
      return <Badge bg="primary">Default</Badge>;
    }
    return <Badge bg="secondary">Active</Badge>;
  };

  if (loading && stages.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Stages"
        currentTitle="Stages Management"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">Stages Management</h1>
                <p className="text-muted">Manage your CRM pipeline stages</p>
              </div>
              <div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  <FiPlus className="me-2" />
                  New Stage
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stages List */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {stages.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">No stages found</p>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                      <FiPlus className="me-2" />
                      Create First Stage
                    </Button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table>
                      <thead>
                        <tr>
                          <th>Stage</th>
                          <th>Sequence</th>
                          <th>Color</th>
                          <th>Status</th>
                          <th>Description</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stages.map((stage) => (
                          <tr key={stage.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="me-2"
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    backgroundColor: stage.color,
                                    borderRadius: "50%"
                                  }}
                                />
                                <strong>{stage.name}</strong>
                              </div>
                            </td>
                            <td>
                              <Badge bg="secondary">{stage.sequence}</Badge>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="me-2"
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    backgroundColor: stage.color,
                                    borderRadius: "4px"
                                  }}
                                />
                                <small className="text-muted">{stage.color}</small>
                              </div>
                            </td>
                            <td>
                              {getStatusBadge(stage)}
                            </td>
                            <td>
                              <small className="text-muted">
                                {stage.description || "No description"}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {new Date(stage.created_at).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setStageToDelete(stage);
                                  setShowDeleteModal(true);
                                }}
                                disabled={stage.is_default}
                              >
                                <FiTrash2 />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Stage Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Stage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stage Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter stage name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sequence *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.sequence}
                    onChange={(e) => handleInputChange("sequence", parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="checkbox"
                      label="Won Stage"
                      checked={formData.is_won}
                      onChange={(e) => handleInputChange("is_won", e.target.checked)}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Fold Stage"
                      checked={formData.fold}
                      onChange={(e) => handleInputChange("fold", e.target.checked)}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Default"
                      checked={formData.is_default}
                      onChange={(e) => handleInputChange("is_default", e.target.checked)}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Requirements</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.requirements}
                onChange={(e) => handleInputChange("requirements", e.target.value)}
                placeholder="Enter stage requirements (optional)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter stage description (optional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : (
              <>
                <FiSave className="me-2" />
                Create Stage
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Stage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Warning!</strong> Deleting this stage will affect all leads and opportunities currently assigned to it.
          </Alert>
          <p>
            Are you sure you want to delete the stage <strong>{stageToDelete?.name}</strong>?
          </p>
          <p className="text-muted">
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteStage} disabled={loading}>
            {loading ? "Deleting..." : (
              <>
                <FiTrash2 className="me-2" />
                Delete Stage
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

StagesManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default StagesManagement;
