import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { getLostReasons, createLostReason, updateLostReason, deleteLostReason } from "@utils/crm";
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

interface LostReason {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  color: string;
  sequence: number;
  created_at: string;
  updated_at: string;
}

const LostReasonsManagement = () => {
  const [lostReasons, setLostReasons] = useState<LostReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingReason, setEditingReason] = useState<LostReason | null>(null);
  const [reasonToDelete, setReasonToDelete] = useState<LostReason | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
    color: "#dc3545",
    sequence: 1,
  });

  // Fetch lost reasons on component mount
  useEffect(() => {
    fetchLostReasons();
  }, []);

  const fetchLostReasons = async () => {
    try {
      setLoading(true);
      const reasonsData = await getLostReasons();
      console.log("ZE LOST REASONS DATA", reasonsData);
      setLostReasons(reasonsData as any || []);
    } catch (error) {
      console.error("Failed to fetch lost reasons:", error);
      toast.error("Failed to fetch lost reasons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createLostReason(formData);
      toast.success("Lost reason created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        description: "",
        active: true,
        color: "#dc3545",
        sequence: 1,
      });
      fetchLostReasons();
    } catch (error) {
      toast.error("Failed to create lost reason");
      console.error("Create lost reason error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReason) return;
    
    setLoading(true);

    try {
      await updateLostReason(editingReason.id, formData);
      toast.success("Lost reason updated successfully!");
      setShowEditModal(false);
      setEditingReason(null);
      setFormData({
        name: "",
        description: "",
        active: true,
        color: "#dc3545",
        sequence: 1,
      });
      fetchLostReasons();
    } catch (error) {
      toast.error("Failed to update lost reason");
      console.error("Update lost reason error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReason = async () => {
    if (!reasonToDelete) return;

    try {
      await deleteLostReason(reasonToDelete.id);
      toast.success("Lost reason deleted successfully!");
      setShowDeleteModal(false);
      setReasonToDelete(null);
      fetchLostReasons();
    } catch (error) {
      toast.error("Failed to delete lost reason");
      console.error("Delete lost reason error:", error);
    }
  };

  const handleEdit = (reason: LostReason) => {
    setEditingReason(reason);
    setFormData({
      name: reason.name,
      description: reason.description || "",
      active: reason.active,
      color: reason.color,
      sequence: reason.sequence,
    });
    setShowEditModal(true);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (reason: LostReason) => {
    if (reason.active) {
      return <Badge bg="success">Active</Badge>;
    }
    return <Badge bg="secondary">Inactive</Badge>;
  };

  if (loading && lostReasons.length === 0) {
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
        subTitle="Lost Reasons"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">Lost Reasons Management</h1>
                <p className="text-muted">Manage reasons why leads are marked as lost</p>
              </div>
              <div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  <FiPlus className="me-2" />
                  New Lost Reason
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Lost Reasons List */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {lostReasons.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">No lost reasons found</p>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                      <FiPlus className="me-2" />
                      Create First Lost Reason
                    </Button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table>
                      <thead>
                        <tr>
                          <th>Reason</th>
                          <th>Sequence</th>
                          <th>Color</th>
                          <th>Status</th>
                          <th>Description</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lostReasons.map((reason) => (
                          <tr key={reason.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="me-2"
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    backgroundColor: reason.color,
                                    borderRadius: "50%"
                                  }}
                                />
                                <strong>{reason.name}</strong>
                              </div>
                            </td>
                            <td>
                              <Badge bg="secondary">{reason.sequence}</Badge>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="me-2"
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    backgroundColor: reason.color,
                                    borderRadius: "4px"
                                  }}
                                />
                                <small className="text-muted">{reason.color}</small>
                              </div>
                            </td>
                            <td>
                              {getStatusBadge(reason)}
                            </td>
                            <td>
                              <small className="text-muted">
                                {reason.description || "No description"}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {new Date(reason.created_at).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEdit(reason)}
                                >
                                  <FiEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setReasonToDelete(reason);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <FiTrash2 />
                                </Button>
                              </div>
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

      {/* Create Lost Reason Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Lost Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Reason Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter reason name"
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
                  <div>
                    <Form.Check
                      type="checkbox"
                      label="Active"
                      checked={formData.active}
                      onChange={(e) => handleInputChange("active", e.target.checked)}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter reason description (optional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" onClick={handleCreateSubmit} disabled={loading}>
            {loading ? "Creating..." : (
              <>
                <FiSave className="me-2" />
                Create Lost Reason
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Lost Reason Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Lost Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Reason Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter reason name"
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
                  <div>
                    <Form.Check
                      type="checkbox"
                      label="Active"
                      checked={formData.active}
                      onChange={(e) => handleInputChange("active", e.target.checked)}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter reason description (optional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" onClick={handleEditSubmit} disabled={loading}>
            {loading ? "Updating..." : (
              <>
                <FiSave className="me-2" />
                Update Lost Reason
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Lost Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Warning!</strong> Deleting this lost reason will affect all leads currently marked as lost with this reason.
          </Alert>
          <p>
            Are you sure you want to delete the lost reason <strong>{reasonToDelete?.name}</strong>?
          </p>
          <p className="text-muted">
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteReason} disabled={loading}>
            {loading ? "Deleting..." : (
              <>
                <FiTrash2 className="me-2" />
                Delete Lost Reason
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

LostReasonsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LostReasonsManagement;
